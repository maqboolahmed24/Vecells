import { createHash } from "node:crypto";

export type EvidenceReplayClass =
  | "distinct"
  | "exact_replay"
  | "semantic_replay"
  | "collision_review";

export type EvidenceDerivationClass =
  | "canonical_normalization"
  | "transcript"
  | "structured_fact_extraction"
  | "safety_feature_set"
  | "patient_safe_summary"
  | "staff_review_summary";

export type EvidenceSummaryKind =
  | "patient_safe_summary"
  | "staff_review_summary"
  | "transcript_stub";

export type EvidenceParityState = "verified" | "stale" | "blocked" | "superseded";

export type MaterialDeltaDisposition =
  | "clinical_meaning_changed"
  | "triage_meaning_changed"
  | "delivery_meaning_changed"
  | "patient_visible_interpretation_changed"
  | "technical_only"
  | "operational_nonclinical";

export type ArtifactStorageClass = "source" | "derived" | "redacted";

export type ArtifactChecksumAlgorithm = "sha256";

export type EvidenceIdKind =
  | "artifact"
  | "captureBundle"
  | "derivationPackage"
  | "redactionTransform"
  | "summaryParityRecord"
  | "evidenceSnapshot";

export interface EvidenceBackboneIdGenerator {
  nextId(kind: EvidenceIdKind): string;
}

const SUMMARY_DERIVATION_CLASS_BY_KIND = {
  patient_safe_summary: "patient_safe_summary",
  staff_review_summary: "staff_review_summary",
  transcript_stub: "transcript",
} as const satisfies Record<EvidenceSummaryKind, EvidenceDerivationClass>;

const MATERIAL_SNAPSHOT_DISPOSITIONS = new Set<MaterialDeltaDisposition>([
  "clinical_meaning_changed",
  "triage_meaning_changed",
  "delivery_meaning_changed",
  "patient_visible_interpretation_changed",
]);

const UNATTACHED_ONLY_DISPOSITIONS = new Set<MaterialDeltaDisposition>([
  "technical_only",
  "operational_nonclinical",
]);

export function createDeterministicEvidenceIdGenerator(
  seed = "evidence",
): EvidenceBackboneIdGenerator {
  const counters = new Map<EvidenceIdKind, number>();

  return {
    nextId(kind: EvidenceIdKind): string {
      const next = (counters.get(kind) ?? 0) + 1;
      counters.set(kind, next);
      return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
    },
  };
}

export class EvidenceInvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EvidenceInvariantError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new EvidenceInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableDigest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function appendOnlyInsert<T>(
  map: Map<string, T>,
  key: string,
  value: T,
  aggregateLabel: string,
): void {
  invariant(
    !map.has(key),
    `IMMUTABLE_${aggregateLabel.toUpperCase()}_REWRITE_FORBIDDEN`,
    `${aggregateLabel} is append-only and may not be rewritten in place.`,
  );
  map.set(key, value);
}

export interface ImmutableArtifactRecord {
  artifactId: string;
  storageClass: ArtifactStorageClass;
  locator: string;
  checksum: string;
  checksumAlgorithm: ArtifactChecksumAlgorithm;
  mediaType: string;
  byteLength: number;
  createdAt: string;
  sourceArtifactRef: string | null;
}

export interface RegisterArtifactInput {
  artifactId?: string;
  locator: string;
  checksum: string;
  mediaType: string;
  byteLength: number;
  createdAt: string;
  sourceArtifactRef?: string | null;
}

function normalizeArtifactRecord(
  storageClass: ArtifactStorageClass,
  input: RegisterArtifactInput,
  idGenerator: EvidenceBackboneIdGenerator,
): ImmutableArtifactRecord {
  return {
    artifactId: requireRef(
      input.artifactId ?? idGenerator.nextId("artifact"),
      `${storageClass}ArtifactId`,
    ),
    storageClass,
    locator: requireRef(input.locator, "locator"),
    checksum: requireRef(input.checksum, "checksum"),
    checksumAlgorithm: "sha256",
    mediaType: requireRef(input.mediaType, "mediaType"),
    byteLength: input.byteLength,
    createdAt: input.createdAt,
    sourceArtifactRef: input.sourceArtifactRef ?? null,
  };
}

export interface SourceArtifactStorage {
  registerSourceArtifact(input: RegisterArtifactInput): Promise<ImmutableArtifactRecord>;
  getSourceArtifact(artifactId: string): Promise<ImmutableArtifactRecord | undefined>;
  listSourceArtifacts(): Promise<readonly ImmutableArtifactRecord[]>;
}

export interface DerivedArtifactStorage {
  registerDerivedArtifact(input: RegisterArtifactInput): Promise<ImmutableArtifactRecord>;
  getDerivedArtifact(artifactId: string): Promise<ImmutableArtifactRecord | undefined>;
  listDerivedArtifacts(): Promise<readonly ImmutableArtifactRecord[]>;
}

export interface RedactedArtifactStorage {
  registerRedactedArtifact(input: RegisterArtifactInput): Promise<ImmutableArtifactRecord>;
  getRedactedArtifact(artifactId: string): Promise<ImmutableArtifactRecord | undefined>;
  listRedactedArtifacts(): Promise<readonly ImmutableArtifactRecord[]>;
}

export interface EvidenceCaptureBundleSnapshot {
  captureBundleId: string;
  evidenceLineageRef: string;
  sourceChannel: string;
  replayClass: EvidenceReplayClass;
  transportCorrelationRef: string | null;
  capturePolicyVersion: string;
  sourceHash: string;
  semanticHash: string;
  sourceArtifactRefs: readonly string[];
  attachmentArtifactRefs: readonly string[];
  audioArtifactRefs: readonly string[];
  metadataArtifactRefs: readonly string[];
  bundleHash: string;
  createdAt: string;
  recordVersion: 1;
}

export interface EvidenceDerivationPackageSnapshot {
  derivationPackageId: string;
  evidenceLineageRef: string;
  captureBundleRef: string;
  sourceBundleHash: string;
  parentDerivationPackageRef: string | null;
  supersedesDerivationPackageRef: string | null;
  derivationClass: EvidenceDerivationClass;
  derivationVersion: string;
  policyVersionRef: string;
  derivedArtifactRef: string;
  derivedArtifactHash: string;
  structuredDigest: string;
  createdAt: string;
  recordVersion: 1;
}

export interface EvidenceRedactionTransformSnapshot {
  redactionTransformId: string;
  evidenceLineageRef: string;
  sourceCaptureBundleRef: string | null;
  sourceDerivationPackageRef: string | null;
  sourceArtifactRef: string;
  sourceArtifactHash: string;
  redactionPolicyVersion: string;
  redactedArtifactRef: string;
  redactedArtifactHash: string;
  transformDigest: string;
  supersedesRedactionTransformRef: string | null;
  createdAt: string;
  recordVersion: 1;
}

export interface EvidenceSummaryParityRecordSnapshot {
  parityRecordId: string;
  evidenceLineageRef: string;
  captureBundleRef: string;
  normalizedDerivationPackageRef: string;
  authoritativeDerivedFactsPackageRef: string | null;
  summaryDerivationPackageRef: string;
  summaryKind: EvidenceSummaryKind;
  authorityDigest: string;
  summaryDigest: string;
  parityDigest: string;
  parityPolicyVersion: string;
  parityState: EvidenceParityState;
  blockingReasonRefs: readonly string[];
  supersedesParityRecordRef: string | null;
  createdAt: string;
  recordVersion: 1;
}

export interface EvidenceSnapshotSnapshot {
  evidenceSnapshotId: string;
  evidenceLineageRef: string;
  captureBundleRef: string;
  authoritativeNormalizedDerivationPackageRef: string;
  authoritativeDerivedFactsPackageRef: string | null;
  currentSummaryParityRecordRef: string | null;
  supersedesEvidenceSnapshotRef: string | null;
  materialDeltaDisposition: MaterialDeltaDisposition | null;
  snapshotHash: string;
  createdAt: string;
  recordVersion: 1;
}

export interface PersistedEvidenceCaptureBundleRow extends EvidenceCaptureBundleSnapshot {
  aggregateType: "EvidenceCaptureBundle";
  persistenceSchemaVersion: 1;
}

export interface PersistedEvidenceDerivationPackageRow extends EvidenceDerivationPackageSnapshot {
  aggregateType: "EvidenceDerivationPackage";
  persistenceSchemaVersion: 1;
}

export interface PersistedEvidenceRedactionTransformRow extends EvidenceRedactionTransformSnapshot {
  aggregateType: "EvidenceRedactionTransform";
  persistenceSchemaVersion: 1;
}

export interface PersistedEvidenceSummaryParityRecordRow
  extends EvidenceSummaryParityRecordSnapshot {
  aggregateType: "EvidenceSummaryParityRecord";
  persistenceSchemaVersion: 1;
}

export interface PersistedEvidenceSnapshotRow extends EvidenceSnapshotSnapshot {
  aggregateType: "EvidenceSnapshot";
  persistenceSchemaVersion: 1;
}

export class EvidenceCaptureBundleDocument {
  private readonly snapshot: EvidenceCaptureBundleSnapshot;

  private constructor(snapshot: EvidenceCaptureBundleSnapshot) {
    this.snapshot = EvidenceCaptureBundleDocument.normalize(snapshot);
  }

  static create(snapshot: EvidenceCaptureBundleSnapshot): EvidenceCaptureBundleDocument {
    return new EvidenceCaptureBundleDocument(snapshot);
  }

  static hydrate(snapshot: EvidenceCaptureBundleSnapshot): EvidenceCaptureBundleDocument {
    return new EvidenceCaptureBundleDocument(snapshot);
  }

  private static normalize(snapshot: EvidenceCaptureBundleSnapshot): EvidenceCaptureBundleSnapshot {
    invariant(
      snapshot.recordVersion === 1,
      "INVALID_CAPTURE_BUNDLE_RECORD_VERSION",
      "EvidenceCaptureBundle recordVersion must be 1.",
    );
    invariant(
      snapshot.sourceArtifactRefs.length > 0,
      "CAPTURE_BUNDLE_REQUIRES_SOURCE_ARTIFACT",
      "EvidenceCaptureBundle requires at least one raw source artifact reference.",
    );
    return {
      ...snapshot,
      captureBundleId: requireRef(snapshot.captureBundleId, "captureBundleId"),
      evidenceLineageRef: requireRef(snapshot.evidenceLineageRef, "evidenceLineageRef"),
      sourceChannel: requireRef(snapshot.sourceChannel, "sourceChannel"),
      capturePolicyVersion: requireRef(snapshot.capturePolicyVersion, "capturePolicyVersion"),
      sourceHash: requireRef(snapshot.sourceHash, "sourceHash"),
      semanticHash: requireRef(snapshot.semanticHash, "semanticHash"),
      bundleHash: requireRef(snapshot.bundleHash, "bundleHash"),
      sourceArtifactRefs: uniqueSortedRefs(snapshot.sourceArtifactRefs),
      attachmentArtifactRefs: uniqueSortedRefs(snapshot.attachmentArtifactRefs),
      audioArtifactRefs: uniqueSortedRefs(snapshot.audioArtifactRefs),
      metadataArtifactRefs: uniqueSortedRefs(snapshot.metadataArtifactRefs),
      transportCorrelationRef: snapshot.transportCorrelationRef ?? null,
    };
  }

  get captureBundleId(): string {
    return this.snapshot.captureBundleId;
  }

  get evidenceLineageRef(): string {
    return this.snapshot.evidenceLineageRef;
  }

  get bundleHash(): string {
    return this.snapshot.bundleHash;
  }

  toSnapshot(): EvidenceCaptureBundleSnapshot {
    return {
      ...this.snapshot,
      sourceArtifactRefs: [...this.snapshot.sourceArtifactRefs],
      attachmentArtifactRefs: [...this.snapshot.attachmentArtifactRefs],
      audioArtifactRefs: [...this.snapshot.audioArtifactRefs],
      metadataArtifactRefs: [...this.snapshot.metadataArtifactRefs],
    };
  }
}

export class EvidenceDerivationPackageDocument {
  private readonly snapshot: EvidenceDerivationPackageSnapshot;

  private constructor(snapshot: EvidenceDerivationPackageSnapshot) {
    this.snapshot = EvidenceDerivationPackageDocument.normalize(snapshot);
  }

  static create(snapshot: EvidenceDerivationPackageSnapshot): EvidenceDerivationPackageDocument {
    return new EvidenceDerivationPackageDocument(snapshot);
  }

  static hydrate(snapshot: EvidenceDerivationPackageSnapshot): EvidenceDerivationPackageDocument {
    return new EvidenceDerivationPackageDocument(snapshot);
  }

  private static normalize(
    snapshot: EvidenceDerivationPackageSnapshot,
  ): EvidenceDerivationPackageSnapshot {
    invariant(
      snapshot.recordVersion === 1,
      "INVALID_DERIVATION_RECORD_VERSION",
      "EvidenceDerivationPackage recordVersion must be 1.",
    );
    invariant(
      snapshot.parentDerivationPackageRef !== snapshot.derivationPackageId,
      "DERIVATION_PARENT_SELF_REFERENCE",
      "EvidenceDerivationPackage cannot reference itself as parent.",
    );
    invariant(
      snapshot.supersedesDerivationPackageRef !== snapshot.derivationPackageId,
      "DERIVATION_SUPERSEDES_SELF_REFERENCE",
      "EvidenceDerivationPackage cannot supersede itself.",
    );
    return {
      ...snapshot,
      derivationPackageId: requireRef(snapshot.derivationPackageId, "derivationPackageId"),
      evidenceLineageRef: requireRef(snapshot.evidenceLineageRef, "evidenceLineageRef"),
      captureBundleRef: requireRef(snapshot.captureBundleRef, "captureBundleRef"),
      sourceBundleHash: requireRef(snapshot.sourceBundleHash, "sourceBundleHash"),
      derivationVersion: requireRef(snapshot.derivationVersion, "derivationVersion"),
      policyVersionRef: requireRef(snapshot.policyVersionRef, "policyVersionRef"),
      derivedArtifactRef: requireRef(snapshot.derivedArtifactRef, "derivedArtifactRef"),
      derivedArtifactHash: requireRef(snapshot.derivedArtifactHash, "derivedArtifactHash"),
      structuredDigest: requireRef(snapshot.structuredDigest, "structuredDigest"),
      parentDerivationPackageRef: snapshot.parentDerivationPackageRef ?? null,
      supersedesDerivationPackageRef: snapshot.supersedesDerivationPackageRef ?? null,
    };
  }

  get derivationPackageId(): string {
    return this.snapshot.derivationPackageId;
  }

  get captureBundleRef(): string {
    return this.snapshot.captureBundleRef;
  }

  get derivationClass(): EvidenceDerivationClass {
    return this.snapshot.derivationClass;
  }

  get evidenceLineageRef(): string {
    return this.snapshot.evidenceLineageRef;
  }

  get structuredDigest(): string {
    return this.snapshot.structuredDigest;
  }

  toSnapshot(): EvidenceDerivationPackageSnapshot {
    return { ...this.snapshot };
  }
}

export class EvidenceRedactionTransformDocument {
  private readonly snapshot: EvidenceRedactionTransformSnapshot;

  private constructor(snapshot: EvidenceRedactionTransformSnapshot) {
    this.snapshot = EvidenceRedactionTransformDocument.normalize(snapshot);
  }

  static create(snapshot: EvidenceRedactionTransformSnapshot): EvidenceRedactionTransformDocument {
    return new EvidenceRedactionTransformDocument(snapshot);
  }

  static hydrate(snapshot: EvidenceRedactionTransformSnapshot): EvidenceRedactionTransformDocument {
    return new EvidenceRedactionTransformDocument(snapshot);
  }

  private static normalize(
    snapshot: EvidenceRedactionTransformSnapshot,
  ): EvidenceRedactionTransformSnapshot {
    invariant(
      snapshot.recordVersion === 1,
      "INVALID_REDACTION_RECORD_VERSION",
      "EvidenceRedactionTransform recordVersion must be 1.",
    );
    invariant(
      Number(Boolean(snapshot.sourceCaptureBundleRef)) +
        Number(Boolean(snapshot.sourceDerivationPackageRef)) ===
        1,
      "REDACTION_SOURCE_BOUNDARY_INVALID",
      "EvidenceRedactionTransform must reference exactly one source authority.",
    );
    invariant(
      snapshot.supersedesRedactionTransformRef !== snapshot.redactionTransformId,
      "REDACTION_SUPERSEDES_SELF_REFERENCE",
      "EvidenceRedactionTransform cannot supersede itself.",
    );
    return {
      ...snapshot,
      redactionTransformId: requireRef(snapshot.redactionTransformId, "redactionTransformId"),
      evidenceLineageRef: requireRef(snapshot.evidenceLineageRef, "evidenceLineageRef"),
      sourceArtifactRef: requireRef(snapshot.sourceArtifactRef, "sourceArtifactRef"),
      sourceArtifactHash: requireRef(snapshot.sourceArtifactHash, "sourceArtifactHash"),
      redactionPolicyVersion: requireRef(snapshot.redactionPolicyVersion, "redactionPolicyVersion"),
      redactedArtifactRef: requireRef(snapshot.redactedArtifactRef, "redactedArtifactRef"),
      redactedArtifactHash: requireRef(snapshot.redactedArtifactHash, "redactedArtifactHash"),
      transformDigest: requireRef(snapshot.transformDigest, "transformDigest"),
      sourceCaptureBundleRef: snapshot.sourceCaptureBundleRef ?? null,
      sourceDerivationPackageRef: snapshot.sourceDerivationPackageRef ?? null,
      supersedesRedactionTransformRef: snapshot.supersedesRedactionTransformRef ?? null,
    };
  }

  get redactionTransformId(): string {
    return this.snapshot.redactionTransformId;
  }

  toSnapshot(): EvidenceRedactionTransformSnapshot {
    return { ...this.snapshot };
  }
}

export class EvidenceSummaryParityRecordDocument {
  private readonly snapshot: EvidenceSummaryParityRecordSnapshot;

  private constructor(snapshot: EvidenceSummaryParityRecordSnapshot) {
    this.snapshot = EvidenceSummaryParityRecordDocument.normalize(snapshot);
  }

  static create(
    snapshot: EvidenceSummaryParityRecordSnapshot,
  ): EvidenceSummaryParityRecordDocument {
    return new EvidenceSummaryParityRecordDocument(snapshot);
  }

  static hydrate(
    snapshot: EvidenceSummaryParityRecordSnapshot,
  ): EvidenceSummaryParityRecordDocument {
    return new EvidenceSummaryParityRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: EvidenceSummaryParityRecordSnapshot,
  ): EvidenceSummaryParityRecordSnapshot {
    invariant(
      snapshot.recordVersion === 1,
      "INVALID_PARITY_RECORD_VERSION",
      "EvidenceSummaryParityRecord recordVersion must be 1.",
    );
    invariant(
      snapshot.supersedesParityRecordRef !== snapshot.parityRecordId,
      "PARITY_SUPERSEDES_SELF_REFERENCE",
      "EvidenceSummaryParityRecord cannot supersede itself.",
    );
    return {
      ...snapshot,
      parityRecordId: requireRef(snapshot.parityRecordId, "parityRecordId"),
      evidenceLineageRef: requireRef(snapshot.evidenceLineageRef, "evidenceLineageRef"),
      captureBundleRef: requireRef(snapshot.captureBundleRef, "captureBundleRef"),
      normalizedDerivationPackageRef: requireRef(
        snapshot.normalizedDerivationPackageRef,
        "normalizedDerivationPackageRef",
      ),
      summaryDerivationPackageRef: requireRef(
        snapshot.summaryDerivationPackageRef,
        "summaryDerivationPackageRef",
      ),
      authorityDigest: requireRef(snapshot.authorityDigest, "authorityDigest"),
      summaryDigest: requireRef(snapshot.summaryDigest, "summaryDigest"),
      parityDigest: requireRef(snapshot.parityDigest, "parityDigest"),
      parityPolicyVersion: requireRef(snapshot.parityPolicyVersion, "parityPolicyVersion"),
      blockingReasonRefs: uniqueSortedRefs(snapshot.blockingReasonRefs),
      authoritativeDerivedFactsPackageRef: snapshot.authoritativeDerivedFactsPackageRef ?? null,
      supersedesParityRecordRef: snapshot.supersedesParityRecordRef ?? null,
    };
  }

  get parityRecordId(): string {
    return this.snapshot.parityRecordId;
  }

  get parityState(): EvidenceParityState {
    return this.snapshot.parityState;
  }

  get captureBundleRef(): string {
    return this.snapshot.captureBundleRef;
  }

  get normalizedDerivationPackageRef(): string {
    return this.snapshot.normalizedDerivationPackageRef;
  }

  get authoritativeDerivedFactsPackageRef(): string | null {
    return this.snapshot.authoritativeDerivedFactsPackageRef;
  }

  get summaryDerivationPackageRef(): string {
    return this.snapshot.summaryDerivationPackageRef;
  }

  toSnapshot(): EvidenceSummaryParityRecordSnapshot {
    return {
      ...this.snapshot,
      blockingReasonRefs: [...this.snapshot.blockingReasonRefs],
    };
  }
}

export class EvidenceSnapshotDocument {
  private readonly snapshot: EvidenceSnapshotSnapshot;

  private constructor(snapshot: EvidenceSnapshotSnapshot) {
    this.snapshot = EvidenceSnapshotDocument.normalize(snapshot);
  }

  static create(snapshot: EvidenceSnapshotSnapshot): EvidenceSnapshotDocument {
    return new EvidenceSnapshotDocument(snapshot);
  }

  static hydrate(snapshot: EvidenceSnapshotSnapshot): EvidenceSnapshotDocument {
    return new EvidenceSnapshotDocument(snapshot);
  }

  private static normalize(snapshot: EvidenceSnapshotSnapshot): EvidenceSnapshotSnapshot {
    invariant(
      snapshot.recordVersion === 1,
      "INVALID_EVIDENCE_SNAPSHOT_RECORD_VERSION",
      "EvidenceSnapshot recordVersion must be 1.",
    );
    invariant(
      snapshot.supersedesEvidenceSnapshotRef !== snapshot.evidenceSnapshotId,
      "SNAPSHOT_SUPERSEDES_SELF_REFERENCE",
      "EvidenceSnapshot cannot supersede itself.",
    );
    return {
      ...snapshot,
      evidenceSnapshotId: requireRef(snapshot.evidenceSnapshotId, "evidenceSnapshotId"),
      evidenceLineageRef: requireRef(snapshot.evidenceLineageRef, "evidenceLineageRef"),
      captureBundleRef: requireRef(snapshot.captureBundleRef, "captureBundleRef"),
      authoritativeNormalizedDerivationPackageRef: requireRef(
        snapshot.authoritativeNormalizedDerivationPackageRef,
        "authoritativeNormalizedDerivationPackageRef",
      ),
      snapshotHash: requireRef(snapshot.snapshotHash, "snapshotHash"),
      authoritativeDerivedFactsPackageRef: snapshot.authoritativeDerivedFactsPackageRef ?? null,
      currentSummaryParityRecordRef: snapshot.currentSummaryParityRecordRef ?? null,
      supersedesEvidenceSnapshotRef: snapshot.supersedesEvidenceSnapshotRef ?? null,
      materialDeltaDisposition: snapshot.materialDeltaDisposition ?? null,
    };
  }

  get evidenceSnapshotId(): string {
    return this.snapshot.evidenceSnapshotId;
  }

  get evidenceLineageRef(): string {
    return this.snapshot.evidenceLineageRef;
  }

  toSnapshot(): EvidenceSnapshotSnapshot {
    return { ...this.snapshot };
  }
}

export function serializeEvidenceCaptureBundle(
  document: EvidenceCaptureBundleDocument,
): PersistedEvidenceCaptureBundleRow {
  return {
    aggregateType: "EvidenceCaptureBundle",
    persistenceSchemaVersion: 1,
    ...document.toSnapshot(),
  };
}

export function hydrateEvidenceCaptureBundle(
  row: PersistedEvidenceCaptureBundleRow,
): EvidenceCaptureBundleDocument {
  return EvidenceCaptureBundleDocument.hydrate(row);
}

export function serializeEvidenceDerivationPackage(
  document: EvidenceDerivationPackageDocument,
): PersistedEvidenceDerivationPackageRow {
  return {
    aggregateType: "EvidenceDerivationPackage",
    persistenceSchemaVersion: 1,
    ...document.toSnapshot(),
  };
}

export function hydrateEvidenceDerivationPackage(
  row: PersistedEvidenceDerivationPackageRow,
): EvidenceDerivationPackageDocument {
  return EvidenceDerivationPackageDocument.hydrate(row);
}

export function serializeEvidenceRedactionTransform(
  document: EvidenceRedactionTransformDocument,
): PersistedEvidenceRedactionTransformRow {
  return {
    aggregateType: "EvidenceRedactionTransform",
    persistenceSchemaVersion: 1,
    ...document.toSnapshot(),
  };
}

export function hydrateEvidenceRedactionTransform(
  row: PersistedEvidenceRedactionTransformRow,
): EvidenceRedactionTransformDocument {
  return EvidenceRedactionTransformDocument.hydrate(row);
}

export function serializeEvidenceSummaryParityRecord(
  document: EvidenceSummaryParityRecordDocument,
): PersistedEvidenceSummaryParityRecordRow {
  return {
    aggregateType: "EvidenceSummaryParityRecord",
    persistenceSchemaVersion: 1,
    ...document.toSnapshot(),
  };
}

export function hydrateEvidenceSummaryParityRecord(
  row: PersistedEvidenceSummaryParityRecordRow,
): EvidenceSummaryParityRecordDocument {
  return EvidenceSummaryParityRecordDocument.hydrate(row);
}

export function serializeEvidenceSnapshot(
  document: EvidenceSnapshotDocument,
): PersistedEvidenceSnapshotRow {
  return {
    aggregateType: "EvidenceSnapshot",
    persistenceSchemaVersion: 1,
    ...document.toSnapshot(),
  };
}

export function hydrateEvidenceSnapshot(
  row: PersistedEvidenceSnapshotRow,
): EvidenceSnapshotDocument {
  return EvidenceSnapshotDocument.hydrate(row);
}

export interface EvidenceCaptureBundleRepository {
  getEvidenceCaptureBundle(
    captureBundleId: string,
  ): Promise<EvidenceCaptureBundleDocument | undefined>;
  saveEvidenceCaptureBundle(document: EvidenceCaptureBundleDocument): Promise<void>;
  listEvidenceCaptureBundles(): Promise<readonly EvidenceCaptureBundleDocument[]>;
}

export interface EvidenceDerivationPackageRepository {
  getEvidenceDerivationPackage(
    derivationPackageId: string,
  ): Promise<EvidenceDerivationPackageDocument | undefined>;
  saveEvidenceDerivationPackage(document: EvidenceDerivationPackageDocument): Promise<void>;
  listEvidenceDerivationPackages(): Promise<readonly EvidenceDerivationPackageDocument[]>;
}

export interface EvidenceRedactionTransformRepository {
  getEvidenceRedactionTransform(
    redactionTransformId: string,
  ): Promise<EvidenceRedactionTransformDocument | undefined>;
  saveEvidenceRedactionTransform(document: EvidenceRedactionTransformDocument): Promise<void>;
  listEvidenceRedactionTransforms(): Promise<readonly EvidenceRedactionTransformDocument[]>;
}

export interface EvidenceSummaryParityRecordRepository {
  getEvidenceSummaryParityRecord(
    parityRecordId: string,
  ): Promise<EvidenceSummaryParityRecordDocument | undefined>;
  saveEvidenceSummaryParityRecord(document: EvidenceSummaryParityRecordDocument): Promise<void>;
  listEvidenceSummaryParityRecords(): Promise<readonly EvidenceSummaryParityRecordDocument[]>;
}

export interface EvidenceSnapshotRepository {
  getEvidenceSnapshot(evidenceSnapshotId: string): Promise<EvidenceSnapshotDocument | undefined>;
  saveEvidenceSnapshot(document: EvidenceSnapshotDocument): Promise<void>;
  listEvidenceSnapshots(): Promise<readonly EvidenceSnapshotDocument[]>;
  getCurrentEvidenceSnapshotForLineage(
    evidenceLineageRef: string,
  ): Promise<EvidenceSnapshotDocument | undefined>;
}

export interface EvidenceBackboneDependencies
  extends SourceArtifactStorage,
    DerivedArtifactStorage,
    RedactedArtifactStorage,
    EvidenceCaptureBundleRepository,
    EvidenceDerivationPackageRepository,
    EvidenceRedactionTransformRepository,
    EvidenceSummaryParityRecordRepository,
    EvidenceSnapshotRepository {}

class InMemoryEvidenceBackboneStore implements EvidenceBackboneDependencies {
  private readonly sourceArtifacts = new Map<string, ImmutableArtifactRecord>();
  private readonly derivedArtifacts = new Map<string, ImmutableArtifactRecord>();
  private readonly redactedArtifacts = new Map<string, ImmutableArtifactRecord>();
  private readonly captureBundles = new Map<string, PersistedEvidenceCaptureBundleRow>();
  private readonly derivationPackages = new Map<string, PersistedEvidenceDerivationPackageRow>();
  private readonly redactionTransforms = new Map<string, PersistedEvidenceRedactionTransformRow>();
  private readonly summaryParityRecords = new Map<
    string,
    PersistedEvidenceSummaryParityRecordRow
  >();
  private readonly evidenceSnapshots = new Map<string, PersistedEvidenceSnapshotRow>();
  private readonly idGenerator: EvidenceBackboneIdGenerator;

  constructor(idGenerator = createDeterministicEvidenceIdGenerator("store")) {
    this.idGenerator = idGenerator;
  }

  private registerArtifact(
    map: Map<string, ImmutableArtifactRecord>,
    storageClass: ArtifactStorageClass,
    input: RegisterArtifactInput,
  ): ImmutableArtifactRecord {
    const record = normalizeArtifactRecord(storageClass, input, this.idGenerator);
    const existing = map.get(record.artifactId);

    if (existing) {
      invariant(
        JSON.stringify(existing) === JSON.stringify(record),
        `IMMUTABLE_${storageClass.toUpperCase()}_ARTIFACT_REWRITE_FORBIDDEN`,
        `${storageClass} artifact metadata is append-only and may not be rewritten in place.`,
      );
      return existing;
    }

    map.set(record.artifactId, record);
    return record;
  }

  async registerSourceArtifact(input: RegisterArtifactInput): Promise<ImmutableArtifactRecord> {
    return this.registerArtifact(this.sourceArtifacts, "source", input);
  }

  async registerDerivedArtifact(input: RegisterArtifactInput): Promise<ImmutableArtifactRecord> {
    return this.registerArtifact(this.derivedArtifacts, "derived", input);
  }

  async registerRedactedArtifact(input: RegisterArtifactInput): Promise<ImmutableArtifactRecord> {
    return this.registerArtifact(this.redactedArtifacts, "redacted", input);
  }

  async getSourceArtifact(artifactId: string): Promise<ImmutableArtifactRecord | undefined> {
    return this.sourceArtifacts.get(artifactId);
  }

  async getDerivedArtifact(artifactId: string): Promise<ImmutableArtifactRecord | undefined> {
    return this.derivedArtifacts.get(artifactId);
  }

  async getRedactedArtifact(artifactId: string): Promise<ImmutableArtifactRecord | undefined> {
    return this.redactedArtifacts.get(artifactId);
  }

  async listSourceArtifacts(): Promise<readonly ImmutableArtifactRecord[]> {
    return [...this.sourceArtifacts.values()];
  }

  async listDerivedArtifacts(): Promise<readonly ImmutableArtifactRecord[]> {
    return [...this.derivedArtifacts.values()];
  }

  async listRedactedArtifacts(): Promise<readonly ImmutableArtifactRecord[]> {
    return [...this.redactedArtifacts.values()];
  }

  async getEvidenceCaptureBundle(
    captureBundleId: string,
  ): Promise<EvidenceCaptureBundleDocument | undefined> {
    const row = this.captureBundles.get(captureBundleId);
    return row ? hydrateEvidenceCaptureBundle(row) : undefined;
  }

  async saveEvidenceCaptureBundle(document: EvidenceCaptureBundleDocument): Promise<void> {
    appendOnlyInsert(
      this.captureBundles,
      document.captureBundleId,
      serializeEvidenceCaptureBundle(document),
      "EvidenceCaptureBundle",
    );
  }

  async listEvidenceCaptureBundles(): Promise<readonly EvidenceCaptureBundleDocument[]> {
    return [...this.captureBundles.values()].map(hydrateEvidenceCaptureBundle);
  }

  async getEvidenceDerivationPackage(
    derivationPackageId: string,
  ): Promise<EvidenceDerivationPackageDocument | undefined> {
    const row = this.derivationPackages.get(derivationPackageId);
    return row ? hydrateEvidenceDerivationPackage(row) : undefined;
  }

  async saveEvidenceDerivationPackage(document: EvidenceDerivationPackageDocument): Promise<void> {
    appendOnlyInsert(
      this.derivationPackages,
      document.derivationPackageId,
      serializeEvidenceDerivationPackage(document),
      "EvidenceDerivationPackage",
    );
  }

  async listEvidenceDerivationPackages(): Promise<readonly EvidenceDerivationPackageDocument[]> {
    return [...this.derivationPackages.values()].map(hydrateEvidenceDerivationPackage);
  }

  async getEvidenceRedactionTransform(
    redactionTransformId: string,
  ): Promise<EvidenceRedactionTransformDocument | undefined> {
    const row = this.redactionTransforms.get(redactionTransformId);
    return row ? hydrateEvidenceRedactionTransform(row) : undefined;
  }

  async saveEvidenceRedactionTransform(
    document: EvidenceRedactionTransformDocument,
  ): Promise<void> {
    appendOnlyInsert(
      this.redactionTransforms,
      document.redactionTransformId,
      serializeEvidenceRedactionTransform(document),
      "EvidenceRedactionTransform",
    );
  }

  async listEvidenceRedactionTransforms(): Promise<readonly EvidenceRedactionTransformDocument[]> {
    return [...this.redactionTransforms.values()].map(hydrateEvidenceRedactionTransform);
  }

  async getEvidenceSummaryParityRecord(
    parityRecordId: string,
  ): Promise<EvidenceSummaryParityRecordDocument | undefined> {
    const row = this.summaryParityRecords.get(parityRecordId);
    return row ? hydrateEvidenceSummaryParityRecord(row) : undefined;
  }

  async saveEvidenceSummaryParityRecord(
    document: EvidenceSummaryParityRecordDocument,
  ): Promise<void> {
    appendOnlyInsert(
      this.summaryParityRecords,
      document.parityRecordId,
      serializeEvidenceSummaryParityRecord(document),
      "EvidenceSummaryParityRecord",
    );
  }

  async listEvidenceSummaryParityRecords(): Promise<
    readonly EvidenceSummaryParityRecordDocument[]
  > {
    return [...this.summaryParityRecords.values()].map(hydrateEvidenceSummaryParityRecord);
  }

  async getEvidenceSnapshot(
    evidenceSnapshotId: string,
  ): Promise<EvidenceSnapshotDocument | undefined> {
    const row = this.evidenceSnapshots.get(evidenceSnapshotId);
    return row ? hydrateEvidenceSnapshot(row) : undefined;
  }

  async saveEvidenceSnapshot(document: EvidenceSnapshotDocument): Promise<void> {
    appendOnlyInsert(
      this.evidenceSnapshots,
      document.evidenceSnapshotId,
      serializeEvidenceSnapshot(document),
      "EvidenceSnapshot",
    );
  }

  async listEvidenceSnapshots(): Promise<readonly EvidenceSnapshotDocument[]> {
    return [...this.evidenceSnapshots.values()].map(hydrateEvidenceSnapshot);
  }

  async getCurrentEvidenceSnapshotForLineage(
    evidenceLineageRef: string,
  ): Promise<EvidenceSnapshotDocument | undefined> {
    const snapshots = [...this.evidenceSnapshots.values()]
      .map(hydrateEvidenceSnapshot)
      .filter((snapshot) => snapshot.evidenceLineageRef === evidenceLineageRef);

    const supersededIds = new Set(
      snapshots
        .map((snapshot) => snapshot.toSnapshot().supersedesEvidenceSnapshotRef)
        .filter((ref): ref is string => Boolean(ref)),
    );

    const current = snapshots.filter((snapshot) => !supersededIds.has(snapshot.evidenceSnapshotId));

    invariant(
      current.length <= 1,
      "SNAPSHOT_FORK_DETECTED",
      `Evidence lineage ${evidenceLineageRef} resolved to multiple current snapshots.`,
    );

    return current[0];
  }
}

export function createEvidenceBackboneStore(
  idGenerator?: EvidenceBackboneIdGenerator,
): EvidenceBackboneDependencies {
  return new InMemoryEvidenceBackboneStore(idGenerator);
}

export interface FreezeCaptureBundleInput {
  captureBundleId?: string;
  evidenceLineageRef: string;
  sourceChannel: string;
  replayClass: EvidenceReplayClass;
  transportCorrelationRef?: string | null;
  capturePolicyVersion: string;
  sourceHash: string;
  semanticHash: string;
  sourceArtifactRefs: readonly string[];
  attachmentArtifactRefs?: readonly string[];
  audioArtifactRefs?: readonly string[];
  metadataArtifactRefs?: readonly string[];
  createdAt: string;
}

export interface CreateDerivationPackageInput {
  derivationPackageId?: string;
  captureBundleRef: string;
  parentDerivationPackageRef?: string | null;
  supersedesDerivationPackageRef?: string | null;
  derivationClass: EvidenceDerivationClass;
  derivationVersion: string;
  policyVersionRef: string;
  derivedArtifactRef: string;
  structuredDigest?: string | null;
  createdAt: string;
}

export interface CreateRedactionTransformInput {
  redactionTransformId?: string;
  sourceCaptureBundleRef?: string | null;
  sourceDerivationPackageRef?: string | null;
  sourceArtifactRef: string;
  redactionPolicyVersion: string;
  redactedArtifactRef: string;
  supersedesRedactionTransformRef?: string | null;
  createdAt: string;
}

export interface CreateSummaryParityRecordInput {
  parityRecordId?: string;
  captureBundleRef: string;
  normalizedDerivationPackageRef: string;
  authoritativeDerivedFactsPackageRef?: string | null;
  summaryDerivationPackageRef: string;
  summaryKind: EvidenceSummaryKind;
  parityPolicyVersion: string;
  expectedAuthorityDigest?: string | null;
  blockingReasonRefs?: readonly string[];
  supersedesParityRecordRef?: string | null;
  createdAt: string;
}

export interface CreateEvidenceSnapshotInput {
  evidenceSnapshotId?: string;
  captureBundleRef: string;
  authoritativeNormalizedDerivationPackageRef: string;
  authoritativeDerivedFactsPackageRef?: string | null;
  currentSummaryParityRecordRef?: string | null;
  supersedesEvidenceSnapshotRef?: string | null;
  materialDeltaDisposition?: MaterialDeltaDisposition | null;
  createdAt: string;
}

export interface AssimilateDerivationRevisionInput {
  derivationPackage: CreateDerivationPackageInput;
  materialDeltaDisposition: MaterialDeltaDisposition;
  snapshotIntent?: Omit<
    CreateEvidenceSnapshotInput,
    "captureBundleRef" | "supersedesEvidenceSnapshotRef" | "materialDeltaDisposition" | "createdAt"
  > & {
    createdAt?: string;
  };
}

export interface AssimilateDerivationRevisionResult {
  derivationPackage: EvidenceDerivationPackageDocument;
  evidenceSnapshot: EvidenceSnapshotDocument | null;
}

export class EvidenceCaptureBundleService {
  constructor(
    private readonly dependencies: EvidenceBackboneDependencies,
    private readonly idGenerator: EvidenceBackboneIdGenerator,
  ) {}

  async freezeCaptureBundle(
    input: FreezeCaptureBundleInput,
  ): Promise<EvidenceCaptureBundleDocument> {
    const sourceArtifactRefs = uniqueSortedRefs(input.sourceArtifactRefs);
    const attachmentArtifactRefs = uniqueSortedRefs(input.attachmentArtifactRefs ?? []);
    const audioArtifactRefs = uniqueSortedRefs(input.audioArtifactRefs ?? []);
    const metadataArtifactRefs = uniqueSortedRefs(input.metadataArtifactRefs ?? []);
    const allArtifactRefs = [
      ...sourceArtifactRefs,
      ...attachmentArtifactRefs,
      ...audioArtifactRefs,
      ...metadataArtifactRefs,
    ];

    invariant(
      sourceArtifactRefs.length > 0,
      "CAPTURE_BUNDLE_SOURCE_REQUIRED",
      "EvidenceCaptureBundle requires at least one source artifact.",
    );

    const artifactChecksums: string[] = [];
    for (const artifactRef of allArtifactRefs) {
      const artifact = await this.dependencies.getSourceArtifact(artifactRef);
      invariant(
        artifact,
        "CAPTURE_BUNDLE_ARTIFACT_MISSING",
        `Source artifact ${artifactRef} must exist before bundle freeze.`,
      );
      artifactChecksums.push(artifact.checksum);
    }

    const document = EvidenceCaptureBundleDocument.create({
      captureBundleId: requireRef(
        input.captureBundleId ?? this.idGenerator.nextId("captureBundle"),
        "captureBundleId",
      ),
      evidenceLineageRef: requireRef(input.evidenceLineageRef, "evidenceLineageRef"),
      sourceChannel: requireRef(input.sourceChannel, "sourceChannel"),
      replayClass: input.replayClass,
      transportCorrelationRef: input.transportCorrelationRef ?? null,
      capturePolicyVersion: requireRef(input.capturePolicyVersion, "capturePolicyVersion"),
      sourceHash: requireRef(input.sourceHash, "sourceHash"),
      semanticHash: requireRef(input.semanticHash, "semanticHash"),
      sourceArtifactRefs,
      attachmentArtifactRefs,
      audioArtifactRefs,
      metadataArtifactRefs,
      bundleHash: stableDigest({
        evidenceLineageRef: input.evidenceLineageRef,
        sourceHash: input.sourceHash,
        semanticHash: input.semanticHash,
        capturePolicyVersion: input.capturePolicyVersion,
        artifactChecksums,
      }),
      createdAt: input.createdAt,
      recordVersion: 1,
    });

    await this.dependencies.saveEvidenceCaptureBundle(document);
    return document;
  }
}

export class EvidenceDerivationPackageService {
  constructor(
    private readonly dependencies: EvidenceBackboneDependencies,
    private readonly idGenerator: EvidenceBackboneIdGenerator,
  ) {}

  async createDerivationPackage(
    input: CreateDerivationPackageInput,
  ): Promise<EvidenceDerivationPackageDocument> {
    const captureBundle = await this.dependencies.getEvidenceCaptureBundle(input.captureBundleRef);
    invariant(
      captureBundle,
      "DERIVATION_REQUIRES_CAPTURE_BUNDLE",
      "EvidenceDerivationPackage requires a frozen EvidenceCaptureBundle first.",
    );

    const artifact = await this.dependencies.getDerivedArtifact(input.derivedArtifactRef);
    invariant(
      artifact,
      "DERIVATION_ARTIFACT_MISSING",
      `Derived artifact ${input.derivedArtifactRef} must exist before derivation creation.`,
    );

    if (input.parentDerivationPackageRef) {
      const parent = await this.dependencies.getEvidenceDerivationPackage(
        input.parentDerivationPackageRef,
      );
      invariant(parent, "DERIVATION_PARENT_MISSING", "Parent derivation package must exist.");
      invariant(
        parent.toSnapshot().captureBundleRef === captureBundle.captureBundleId,
        "DERIVATION_PARENT_CAPTURE_MISMATCH",
        "Parent derivation package must belong to the same capture bundle.",
      );
    }

    if (input.supersedesDerivationPackageRef) {
      const superseded = await this.dependencies.getEvidenceDerivationPackage(
        input.supersedesDerivationPackageRef,
      );
      invariant(
        superseded,
        "DERIVATION_SUPERSEDES_TARGET_MISSING",
        "Superseded derivation package must exist.",
      );
      invariant(
        superseded.derivationClass === input.derivationClass,
        "DERIVATION_SUPERSEDES_CLASS_MISMATCH",
        "Superseding derivation packages must stay in the same derivation class.",
      );
      invariant(
        superseded.captureBundleRef === captureBundle.captureBundleId,
        "DERIVATION_SUPERSEDES_CAPTURE_MISMATCH",
        "Superseded derivation package must belong to the same capture bundle.",
      );
    }

    const structuredDigest =
      input.structuredDigest ??
      stableDigest({
        derivationClass: input.derivationClass,
        derivationVersion: input.derivationVersion,
        policyVersionRef: input.policyVersionRef,
        artifactChecksum: artifact.checksum,
      });

    const document = EvidenceDerivationPackageDocument.create({
      derivationPackageId: requireRef(
        input.derivationPackageId ?? this.idGenerator.nextId("derivationPackage"),
        "derivationPackageId",
      ),
      evidenceLineageRef: captureBundle.evidenceLineageRef,
      captureBundleRef: captureBundle.captureBundleId,
      sourceBundleHash: captureBundle.bundleHash,
      parentDerivationPackageRef: input.parentDerivationPackageRef ?? null,
      supersedesDerivationPackageRef: input.supersedesDerivationPackageRef ?? null,
      derivationClass: input.derivationClass,
      derivationVersion: requireRef(input.derivationVersion, "derivationVersion"),
      policyVersionRef: requireRef(input.policyVersionRef, "policyVersionRef"),
      derivedArtifactRef: artifact.artifactId,
      derivedArtifactHash: artifact.checksum,
      structuredDigest: requireRef(structuredDigest, "structuredDigest"),
      createdAt: input.createdAt,
      recordVersion: 1,
    });

    await this.dependencies.saveEvidenceDerivationPackage(document);
    return document;
  }
}

export class EvidenceRedactionTransformService {
  constructor(
    private readonly dependencies: EvidenceBackboneDependencies,
    private readonly idGenerator: EvidenceBackboneIdGenerator,
  ) {}

  async createRedactionTransform(
    input: CreateRedactionTransformInput,
  ): Promise<EvidenceRedactionTransformDocument> {
    const redactedArtifact = await this.dependencies.getRedactedArtifact(input.redactedArtifactRef);
    invariant(
      redactedArtifact,
      "REDACTION_ARTIFACT_MISSING",
      `Redacted artifact ${input.redactedArtifactRef} must exist before redaction creation.`,
    );

    let evidenceLineageRef: string;
    let sourceArtifact: ImmutableArtifactRecord | undefined;

    if (input.sourceCaptureBundleRef) {
      const captureBundle = await this.dependencies.getEvidenceCaptureBundle(
        input.sourceCaptureBundleRef,
      );
      invariant(captureBundle, "REDACTION_CAPTURE_BUNDLE_MISSING", "Capture bundle must exist.");
      evidenceLineageRef = captureBundle.evidenceLineageRef;
      sourceArtifact = await this.dependencies.getSourceArtifact(input.sourceArtifactRef);
      invariant(
        sourceArtifact,
        "REDACTION_SOURCE_ARTIFACT_MISSING",
        `Source artifact ${input.sourceArtifactRef} must exist.`,
      );

      const bundleRefs = new Set([
        ...captureBundle.toSnapshot().sourceArtifactRefs,
        ...captureBundle.toSnapshot().attachmentArtifactRefs,
        ...captureBundle.toSnapshot().audioArtifactRefs,
        ...captureBundle.toSnapshot().metadataArtifactRefs,
      ]);
      invariant(
        bundleRefs.has(sourceArtifact.artifactId),
        "REDACTION_CAPTURE_SOURCE_MISMATCH",
        "Capture-bundle redaction must reference one artifact from the frozen bundle.",
      );
    } else {
      const derivationPackage = await this.dependencies.getEvidenceDerivationPackage(
        requireRef(input.sourceDerivationPackageRef, "sourceDerivationPackageRef"),
      );
      invariant(
        derivationPackage,
        "REDACTION_DERIVATION_MISSING",
        "Derivation package must exist.",
      );
      evidenceLineageRef = derivationPackage.evidenceLineageRef;
      sourceArtifact = await this.dependencies.getDerivedArtifact(input.sourceArtifactRef);
      invariant(
        sourceArtifact,
        "REDACTION_DERIVED_ARTIFACT_MISSING",
        `Derived artifact ${input.sourceArtifactRef} must exist.`,
      );
      invariant(
        derivationPackage.toSnapshot().derivedArtifactRef === sourceArtifact.artifactId,
        "REDACTION_DERIVATION_SOURCE_MISMATCH",
        "Derivation-backed redaction must reference the package artifact.",
      );
    }

    if (input.supersedesRedactionTransformRef) {
      const superseded = await this.dependencies.getEvidenceRedactionTransform(
        input.supersedesRedactionTransformRef,
      );
      invariant(
        superseded,
        "REDACTION_SUPERSEDES_TARGET_MISSING",
        "Superseded redaction transform must exist.",
      );
      invariant(
        superseded.toSnapshot().sourceArtifactRef === sourceArtifact.artifactId,
        "REDACTION_SUPERSEDES_SOURCE_MISMATCH",
        "Superseding redaction transforms must preserve the same source artifact lineage.",
      );
    }

    const document = EvidenceRedactionTransformDocument.create({
      redactionTransformId: requireRef(
        input.redactionTransformId ?? this.idGenerator.nextId("redactionTransform"),
        "redactionTransformId",
      ),
      evidenceLineageRef,
      sourceCaptureBundleRef: input.sourceCaptureBundleRef ?? null,
      sourceDerivationPackageRef: input.sourceDerivationPackageRef ?? null,
      sourceArtifactRef: sourceArtifact.artifactId,
      sourceArtifactHash: sourceArtifact.checksum,
      redactionPolicyVersion: requireRef(input.redactionPolicyVersion, "redactionPolicyVersion"),
      redactedArtifactRef: redactedArtifact.artifactId,
      redactedArtifactHash: redactedArtifact.checksum,
      transformDigest: stableDigest({
        sourceArtifactHash: sourceArtifact.checksum,
        redactionPolicyVersion: input.redactionPolicyVersion,
        redactedArtifactHash: redactedArtifact.checksum,
      }),
      supersedesRedactionTransformRef: input.supersedesRedactionTransformRef ?? null,
      createdAt: input.createdAt,
      recordVersion: 1,
    });

    await this.dependencies.saveEvidenceRedactionTransform(document);
    return document;
  }
}

export class EvidenceSummaryParityService {
  constructor(
    private readonly dependencies: EvidenceBackboneDependencies,
    private readonly idGenerator: EvidenceBackboneIdGenerator,
  ) {}

  async createSummaryParityRecord(
    input: CreateSummaryParityRecordInput,
  ): Promise<EvidenceSummaryParityRecordDocument> {
    const captureBundle = await this.dependencies.getEvidenceCaptureBundle(input.captureBundleRef);
    invariant(captureBundle, "PARITY_CAPTURE_BUNDLE_MISSING", "Capture bundle must exist.");

    const normalizedDerivation = await this.dependencies.getEvidenceDerivationPackage(
      input.normalizedDerivationPackageRef,
    );
    invariant(
      normalizedDerivation,
      "PARITY_NORMALIZED_DERIVATION_MISSING",
      "Normalized derivation package must exist.",
    );
    invariant(
      normalizedDerivation.derivationClass === "canonical_normalization",
      "PARITY_NORMALIZED_DERIVATION_CLASS_INVALID",
      "Parity records require a canonical_normalization derivation package.",
    );

    const summaryDerivation = await this.dependencies.getEvidenceDerivationPackage(
      input.summaryDerivationPackageRef,
    );
    invariant(
      summaryDerivation,
      "PARITY_SUMMARY_DERIVATION_MISSING",
      "Summary derivation package must exist.",
    );
    invariant(
      summaryDerivation.derivationClass === SUMMARY_DERIVATION_CLASS_BY_KIND[input.summaryKind],
      "PARITY_SUMMARY_KIND_CLASS_MISMATCH",
      "Summary derivation class must match the requested summary kind.",
    );

    let authoritativeDerivedFactsPackageRef: string | null =
      input.authoritativeDerivedFactsPackageRef ?? null;
    let authoritativeDerivedFactsDigest: string | null = null;

    if (authoritativeDerivedFactsPackageRef) {
      const derivedFacts = await this.dependencies.getEvidenceDerivationPackage(
        authoritativeDerivedFactsPackageRef,
      );
      invariant(
        derivedFacts,
        "PARITY_DERIVED_FACTS_MISSING",
        "Derived facts package must exist when parity is fact-bound.",
      );
      invariant(
        derivedFacts.derivationClass === "structured_fact_extraction" ||
          derivedFacts.derivationClass === "safety_feature_set",
        "PARITY_DERIVED_FACTS_CLASS_INVALID",
        "Derived facts parity may only reference structured facts or safety feature packages.",
      );
      invariant(
        derivedFacts.captureBundleRef === captureBundle.captureBundleId,
        "PARITY_DERIVED_FACTS_CAPTURE_MISMATCH",
        "Derived facts parity must stay on the same capture bundle.",
      );
      authoritativeDerivedFactsDigest = derivedFacts.structuredDigest;
      authoritativeDerivedFactsPackageRef = derivedFacts.derivationPackageId;
    }

    invariant(
      normalizedDerivation.captureBundleRef === captureBundle.captureBundleId,
      "PARITY_NORMALIZED_CAPTURE_MISMATCH",
      "Normalized parity authority must stay on the same capture bundle.",
    );
    invariant(
      summaryDerivation.captureBundleRef === captureBundle.captureBundleId,
      "PARITY_SUMMARY_CAPTURE_MISMATCH",
      "Summary parity authority must stay on the same capture bundle.",
    );

    const authorityDigest = stableDigest({
      captureBundleRef: captureBundle.captureBundleId,
      normalizedDigest: normalizedDerivation.structuredDigest,
      authoritativeDerivedFactsDigest,
      summaryKind: input.summaryKind,
      parityPolicyVersion: input.parityPolicyVersion,
    });

    const blockingReasonRefs = uniqueSortedRefs(input.blockingReasonRefs ?? []);
    let parityState: EvidenceParityState;
    if (input.supersedesParityRecordRef) {
      parityState = "superseded";
    } else if (blockingReasonRefs.length > 0) {
      parityState = "blocked";
    } else if (input.expectedAuthorityDigest && input.expectedAuthorityDigest !== authorityDigest) {
      parityState = "stale";
    } else {
      parityState = "verified";
    }

    const document = EvidenceSummaryParityRecordDocument.create({
      parityRecordId: requireRef(
        input.parityRecordId ?? this.idGenerator.nextId("summaryParityRecord"),
        "parityRecordId",
      ),
      evidenceLineageRef: captureBundle.evidenceLineageRef,
      captureBundleRef: captureBundle.captureBundleId,
      normalizedDerivationPackageRef: normalizedDerivation.derivationPackageId,
      authoritativeDerivedFactsPackageRef,
      summaryDerivationPackageRef: summaryDerivation.derivationPackageId,
      summaryKind: input.summaryKind,
      authorityDigest,
      summaryDigest: summaryDerivation.structuredDigest,
      parityDigest: stableDigest({
        authorityDigest,
        summaryDigest: summaryDerivation.structuredDigest,
        parityPolicyVersion: input.parityPolicyVersion,
      }),
      parityPolicyVersion: requireRef(input.parityPolicyVersion, "parityPolicyVersion"),
      parityState,
      blockingReasonRefs,
      supersedesParityRecordRef: input.supersedesParityRecordRef ?? null,
      createdAt: input.createdAt,
      recordVersion: 1,
    });

    await this.dependencies.saveEvidenceSummaryParityRecord(document);
    return document;
  }
}

export class EvidenceSnapshotService {
  constructor(
    private readonly dependencies: EvidenceBackboneDependencies,
    private readonly idGenerator: EvidenceBackboneIdGenerator,
  ) {}

  async createEvidenceSnapshot(
    input: CreateEvidenceSnapshotInput,
  ): Promise<EvidenceSnapshotDocument> {
    const captureBundle = await this.dependencies.getEvidenceCaptureBundle(input.captureBundleRef);
    invariant(captureBundle, "SNAPSHOT_CAPTURE_BUNDLE_MISSING", "Capture bundle must exist.");

    const normalizedDerivation = await this.dependencies.getEvidenceDerivationPackage(
      input.authoritativeNormalizedDerivationPackageRef,
    );
    invariant(
      normalizedDerivation,
      "SNAPSHOT_NORMALIZED_DERIVATION_MISSING",
      "EvidenceSnapshot requires a canonical normalization derivation package.",
    );
    invariant(
      normalizedDerivation.derivationClass === "canonical_normalization",
      "SNAPSHOT_NORMALIZED_DERIVATION_CLASS_INVALID",
      "EvidenceSnapshot authoritative normalization must use the canonical_normalization derivation class.",
    );
    invariant(
      normalizedDerivation.captureBundleRef === captureBundle.captureBundleId,
      "SNAPSHOT_NORMALIZED_CAPTURE_MISMATCH",
      "EvidenceSnapshot normalization must stay on the same capture bundle.",
    );

    let authoritativeDerivedFactsPackageRef: string | null =
      input.authoritativeDerivedFactsPackageRef ?? null;
    let authoritativeDerivedFactsDigest: string | null = null;
    if (authoritativeDerivedFactsPackageRef) {
      const derivedFacts = await this.dependencies.getEvidenceDerivationPackage(
        authoritativeDerivedFactsPackageRef,
      );
      invariant(
        derivedFacts,
        "SNAPSHOT_DERIVED_FACTS_MISSING",
        "Derived facts package must exist before snapshot creation.",
      );
      invariant(
        derivedFacts.derivationClass === "structured_fact_extraction" ||
          derivedFacts.derivationClass === "safety_feature_set",
        "SNAPSHOT_DERIVED_FACTS_CLASS_INVALID",
        "EvidenceSnapshot may only pin structured_fact_extraction or safety_feature_set as authoritative derived facts.",
      );
      invariant(
        derivedFacts.captureBundleRef === captureBundle.captureBundleId,
        "SNAPSHOT_DERIVED_FACTS_CAPTURE_MISMATCH",
        "EvidenceSnapshot derived facts must stay on the same capture bundle.",
      );
      authoritativeDerivedFactsDigest = derivedFacts.structuredDigest;
      authoritativeDerivedFactsPackageRef = derivedFacts.derivationPackageId;
    }

    let currentSummaryParityRecordRef: string | null = input.currentSummaryParityRecordRef ?? null;
    if (currentSummaryParityRecordRef) {
      const parityRecord = await this.dependencies.getEvidenceSummaryParityRecord(
        currentSummaryParityRecordRef,
      );
      invariant(
        parityRecord,
        "SNAPSHOT_PARITY_RECORD_MISSING",
        "Summary parity record must exist before authoritative snapshot creation.",
      );
      invariant(
        parityRecord.parityState === "verified",
        "SNAPSHOT_PARITY_RECORD_NOT_VERIFIED",
        "Only parityState = verified may back an authoritative snapshot summary.",
      );
      invariant(
        parityRecord.captureBundleRef === captureBundle.captureBundleId,
        "SNAPSHOT_PARITY_CAPTURE_MISMATCH",
        "Summary parity record must stay on the same capture bundle.",
      );
      invariant(
        parityRecord.normalizedDerivationPackageRef === normalizedDerivation.derivationPackageId,
        "SNAPSHOT_PARITY_NORMALIZATION_MISMATCH",
        "Summary parity record must reference the authoritative normalized derivation package.",
      );
      invariant(
        parityRecord.authoritativeDerivedFactsPackageRef === authoritativeDerivedFactsPackageRef,
        "SNAPSHOT_PARITY_DERIVED_FACTS_MISMATCH",
        "Summary parity record must reference the same authoritative derived facts package.",
      );
      currentSummaryParityRecordRef = parityRecord.parityRecordId;
    }

    const currentSnapshot = await this.dependencies.getCurrentEvidenceSnapshotForLineage(
      captureBundle.evidenceLineageRef,
    );

    if (currentSnapshot) {
      invariant(
        input.supersedesEvidenceSnapshotRef === currentSnapshot.evidenceSnapshotId,
        "SNAPSHOT_SUPERSESSION_REQUIRED",
        "EvidenceSnapshot supersession must reference the current authoritative snapshot.",
      );
      invariant(
        !input.materialDeltaDisposition ||
          !UNATTACHED_ONLY_DISPOSITIONS.has(input.materialDeltaDisposition),
        "SNAPSHOT_TECHNICAL_ONLY_FORBIDDEN",
        "technical_only and operational_nonclinical changes may not mint a new attached EvidenceSnapshot.",
      );
    } else {
      invariant(
        !input.supersedesEvidenceSnapshotRef,
        "SNAPSHOT_SUPERSEDES_WITHOUT_CURRENT",
        "Initial EvidenceSnapshot may not supersede a missing current snapshot.",
      );
    }

    if (input.materialDeltaDisposition) {
      invariant(
        MATERIAL_SNAPSHOT_DISPOSITIONS.has(input.materialDeltaDisposition) ||
          UNATTACHED_ONLY_DISPOSITIONS.has(input.materialDeltaDisposition),
        "SNAPSHOT_MATERIAL_DELTA_INVALID",
        "EvidenceSnapshot material delta disposition must remain inside the canonical disposition set.",
      );
    }

    const document = EvidenceSnapshotDocument.create({
      evidenceSnapshotId: requireRef(
        input.evidenceSnapshotId ?? this.idGenerator.nextId("evidenceSnapshot"),
        "evidenceSnapshotId",
      ),
      evidenceLineageRef: captureBundle.evidenceLineageRef,
      captureBundleRef: captureBundle.captureBundleId,
      authoritativeNormalizedDerivationPackageRef: normalizedDerivation.derivationPackageId,
      authoritativeDerivedFactsPackageRef,
      currentSummaryParityRecordRef,
      supersedesEvidenceSnapshotRef: input.supersedesEvidenceSnapshotRef ?? null,
      materialDeltaDisposition: input.materialDeltaDisposition ?? null,
      snapshotHash: stableDigest({
        evidenceLineageRef: captureBundle.evidenceLineageRef,
        bundleHash: captureBundle.bundleHash,
        normalizedDigest: normalizedDerivation.structuredDigest,
        authoritativeDerivedFactsDigest,
        currentSummaryParityRecordRef,
        supersedesEvidenceSnapshotRef: input.supersedesEvidenceSnapshotRef ?? null,
      }),
      createdAt: input.createdAt,
      recordVersion: 1,
    });

    await this.dependencies.saveEvidenceSnapshot(document);
    return document;
  }
}

export class EvidenceAssimilationCoordinator {
  constructor(
    private readonly derivations: EvidenceDerivationPackageService,
    private readonly snapshots: EvidenceSnapshotService,
    private readonly dependencies: EvidenceBackboneDependencies,
  ) {}

  async assimilateDerivationRevision(
    input: AssimilateDerivationRevisionInput,
  ): Promise<AssimilateDerivationRevisionResult> {
    const derivationPackage = await this.derivations.createDerivationPackage(
      input.derivationPackage,
    );
    const captureBundle = await this.dependencies.getEvidenceCaptureBundle(
      derivationPackage.captureBundleRef,
    );
    invariant(captureBundle, "ASSIMILATION_CAPTURE_BUNDLE_MISSING", "Capture bundle must exist.");

    if (UNATTACHED_ONLY_DISPOSITIONS.has(input.materialDeltaDisposition)) {
      invariant(
        !input.snapshotIntent,
        "ASSIMILATION_UNATTACHED_REVISION_ONLY",
        "technical_only and operational_nonclinical revisions may not attach a new EvidenceSnapshot.",
      );
      return { derivationPackage, evidenceSnapshot: null };
    }

    invariant(
      MATERIAL_SNAPSHOT_DISPOSITIONS.has(input.materialDeltaDisposition),
      "ASSIMILATION_DISPOSITION_INVALID",
      "Assimilation must resolve to a known material delta disposition.",
    );
    invariant(
      input.snapshotIntent,
      "ASSIMILATION_SNAPSHOT_INTENT_REQUIRED",
      "Materially changed evidence revisions must provide snapshot creation intent.",
    );

    const authoritativeNormalizedDerivationPackageRef =
      derivationPackage.derivationClass === "canonical_normalization"
        ? derivationPackage.derivationPackageId
        : input.snapshotIntent.authoritativeNormalizedDerivationPackageRef;

    const authoritativeDerivedFactsPackageRef =
      input.snapshotIntent.authoritativeDerivedFactsPackageRef ??
      (derivationPackage.derivationClass === "structured_fact_extraction" ||
      derivationPackage.derivationClass === "safety_feature_set"
        ? derivationPackage.derivationPackageId
        : null);

    const currentSnapshot = await this.dependencies.getCurrentEvidenceSnapshotForLineage(
      captureBundle.evidenceLineageRef,
    );
    const evidenceSnapshot = await this.snapshots.createEvidenceSnapshot({
      captureBundleRef: derivationPackage.captureBundleRef,
      authoritativeNormalizedDerivationPackageRef,
      authoritativeDerivedFactsPackageRef,
      currentSummaryParityRecordRef: input.snapshotIntent.currentSummaryParityRecordRef ?? null,
      evidenceSnapshotId: input.snapshotIntent.evidenceSnapshotId,
      supersedesEvidenceSnapshotRef: currentSnapshot?.evidenceSnapshotId ?? null,
      materialDeltaDisposition: input.materialDeltaDisposition,
      createdAt: input.snapshotIntent.createdAt ?? input.derivationPackage.createdAt,
    });

    return { derivationPackage, evidenceSnapshot };
  }
}

export interface EvidenceBackboneServices {
  artifacts: Pick<
    EvidenceBackboneDependencies,
    | "registerSourceArtifact"
    | "registerDerivedArtifact"
    | "registerRedactedArtifact"
    | "getSourceArtifact"
    | "getDerivedArtifact"
    | "getRedactedArtifact"
  >;
  captureBundles: EvidenceCaptureBundleService;
  derivations: EvidenceDerivationPackageService;
  redactions: EvidenceRedactionTransformService;
  summaryParity: EvidenceSummaryParityService;
  snapshots: EvidenceSnapshotService;
  assimilation: EvidenceAssimilationCoordinator;
}

export function createEvidenceBackboneServices(
  dependencies: EvidenceBackboneDependencies,
  idGenerator = createDeterministicEvidenceIdGenerator("evidence_backbone"),
): EvidenceBackboneServices {
  const captureBundles = new EvidenceCaptureBundleService(dependencies, idGenerator);
  const derivations = new EvidenceDerivationPackageService(dependencies, idGenerator);
  const redactions = new EvidenceRedactionTransformService(dependencies, idGenerator);
  const summaryParity = new EvidenceSummaryParityService(dependencies, idGenerator);
  const snapshots = new EvidenceSnapshotService(dependencies, idGenerator);

  return {
    artifacts: {
      registerSourceArtifact: dependencies.registerSourceArtifact.bind(dependencies),
      registerDerivedArtifact: dependencies.registerDerivedArtifact.bind(dependencies),
      registerRedactedArtifact: dependencies.registerRedactedArtifact.bind(dependencies),
      getSourceArtifact: dependencies.getSourceArtifact.bind(dependencies),
      getDerivedArtifact: dependencies.getDerivedArtifact.bind(dependencies),
      getRedactedArtifact: dependencies.getRedactedArtifact.bind(dependencies),
    },
    captureBundles,
    derivations,
    redactions,
    summaryParity,
    snapshots,
    assimilation: new EvidenceAssimilationCoordinator(derivations, snapshots, dependencies),
  };
}
