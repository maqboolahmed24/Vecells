import { createHash } from "node:crypto";
import { RequestBackboneInvariantError } from "../../../domain-kernel/src/index";
import type {
  NormalizedSubmissionChannelCapabilityCeiling,
  NormalizedSubmissionIdentityContext,
} from "./normalized-submission";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
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

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function stableDigest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function saveAppendOnly<T>(map: Map<string, T>, key: string, value: T, label: string): void {
  invariant(
    !map.has(key),
    `IMMUTABLE_${label.toUpperCase()}_REWRITE_FORBIDDEN`,
    `${label} is append-only and may not be rewritten in place.`,
  );
  map.set(key, value);
}

function nextLocalId(seed: string, counters: Map<string, number>, kind: string): string {
  const next = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, next);
  return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
}

export type Phase1SubmitDecisionClass =
  | "new_lineage"
  | "exact_replay"
  | "semantic_replay"
  | "collision_review"
  | "stale_recoverable"
  | "submit_blocked";

export type Phase1SubmitSettlementState =
  | "request_submitted"
  | "authoritative_replay"
  | "collision_review_open"
  | "recovery_required"
  | "submit_blocked";

export interface SubmissionSnapshotFreezeSnapshot {
  freezeSchemaVersion: "PHASE1_SUBMISSION_SNAPSHOT_FREEZE_V1";
  submissionSnapshotFreezeId: string;
  envelopeRef: string;
  draftPublicId: string;
  sourceLineageRef: string;
  draftVersion: number;
  requestType: string;
  intakeExperienceBundleRef: string;
  validationVerdictHash: string;
  activeQuestionKeys: readonly string[];
  activeStructuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferencesRef: string | null;
  contactPreferenceFreezeRef: string | null;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: "released" | "monitoring" | "frozen";
  manifestVersionRef: string;
  sessionEpochRef: string | null;
  surfaceChannelProfile: "browser" | "embedded";
  ingressChannel: "self_service_form";
  intakeConvergenceContractRef: string;
  sourceHash: string;
  semanticHash: string;
  normalizedCandidateHash: string;
  evidenceCaptureBundleRef: string;
  frozenAt: string;
  identityContext: NormalizedSubmissionIdentityContext;
  channelCapabilityCeiling: NormalizedSubmissionChannelCapabilityCeiling;
  contactAuthorityState:
    | "verified"
    | "assumed_self_service_browser_minimum"
    | "rebind_required"
    | "blocked";
  contactAuthorityPolicyRef: string;
  version: number;
}

export interface SubmitNormalizationSeedSnapshot {
  seedSchemaVersion: "PHASE1_SUBMIT_NORMALIZATION_SEED_V1";
  submitNormalizationSeedId: string;
  submissionSnapshotFreezeRef: string;
  envelopeRef: string;
  sourceLineageRef: string;
  evidenceCaptureBundleRef: string;
  requestType: string;
  intakeExperienceBundleRef: string;
  normalizationVersionRef: string;
  normalizedHash: string;
  dedupeFingerprint: string;
  futureContractGapRefs: readonly string[];
  normalizedPayload: Record<string, unknown>;
  createdAt: string;
  version: number;
}

export interface IntakeSubmitSettlementSnapshot {
  settlementSchemaVersion: "INTAKE_SUBMIT_SETTLEMENT_V1";
  intakeSubmitSettlementId: string;
  decisionClass: Phase1SubmitDecisionClass;
  settlementState: Phase1SubmitSettlementState;
  envelopeRef: string;
  draftPublicId: string;
  sourceLineageRef: string;
  requestRef: string | null;
  requestLineageRef: string | null;
  promotionRecordRef: string | null;
  submissionSnapshotFreezeRef: string | null;
  evidenceCaptureBundleRef: string | null;
  evidenceSnapshotRef: string | null;
  normalizedSubmissionRef: string | null;
  collisionReviewRef: string | null;
  commandActionRecordRef: string | null;
  commandSettlementRecordRef: string | null;
  routeIntentBindingRef: string;
  receiptConsistencyKey: string | null;
  statusConsistencyKey: string | null;
  reasonCodes: readonly string[];
  gapRefs: readonly string[];
  recordedAt: string;
  version: number;
}

export class SubmissionSnapshotFreezeDocument {
  private readonly snapshot: SubmissionSnapshotFreezeSnapshot;

  private constructor(snapshot: SubmissionSnapshotFreezeSnapshot) {
    this.snapshot = SubmissionSnapshotFreezeDocument.normalize(snapshot);
  }

  static create(
    input: Omit<SubmissionSnapshotFreezeSnapshot, "version">,
  ): SubmissionSnapshotFreezeDocument {
    return new SubmissionSnapshotFreezeDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: SubmissionSnapshotFreezeSnapshot): SubmissionSnapshotFreezeDocument {
    return new SubmissionSnapshotFreezeDocument(snapshot);
  }

  private static normalize(
    snapshot: SubmissionSnapshotFreezeSnapshot,
  ): SubmissionSnapshotFreezeSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_SUBMISSION_SNAPSHOT_FREEZE_VERSION",
      "SubmissionSnapshotFreeze.version must be >= 1.",
    );
    return {
      ...snapshot,
      submissionSnapshotFreezeId: requireRef(
        snapshot.submissionSnapshotFreezeId,
        "submissionSnapshotFreezeId",
      ),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(snapshot.draftPublicId, "draftPublicId"),
      sourceLineageRef: requireRef(snapshot.sourceLineageRef, "sourceLineageRef"),
      requestType: requireRef(snapshot.requestType, "requestType"),
      intakeExperienceBundleRef: requireRef(
        snapshot.intakeExperienceBundleRef,
        "intakeExperienceBundleRef",
      ),
      validationVerdictHash: requireRef(snapshot.validationVerdictHash, "validationVerdictHash"),
      activeQuestionKeys: uniqueSortedRefs(snapshot.activeQuestionKeys),
      attachmentRefs: uniqueSortedRefs(snapshot.attachmentRefs),
      contactPreferencesRef: optionalRef(snapshot.contactPreferencesRef),
      contactPreferenceFreezeRef: optionalRef(snapshot.contactPreferenceFreezeRef),
      routeFamilyRef: requireRef(snapshot.routeFamilyRef, "routeFamilyRef"),
      routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
      audienceSurfaceRuntimeBindingRef: requireRef(
        snapshot.audienceSurfaceRuntimeBindingRef,
        "audienceSurfaceRuntimeBindingRef",
      ),
      releaseApprovalFreezeRef: requireRef(
        snapshot.releaseApprovalFreezeRef,
        "releaseApprovalFreezeRef",
      ),
      manifestVersionRef: requireRef(snapshot.manifestVersionRef, "manifestVersionRef"),
      sessionEpochRef: optionalRef(snapshot.sessionEpochRef),
      intakeConvergenceContractRef: requireRef(
        snapshot.intakeConvergenceContractRef,
        "intakeConvergenceContractRef",
      ),
      sourceHash: requireRef(snapshot.sourceHash, "sourceHash"),
      semanticHash: requireRef(snapshot.semanticHash, "semanticHash"),
      normalizedCandidateHash: requireRef(
        snapshot.normalizedCandidateHash,
        "normalizedCandidateHash",
      ),
      evidenceCaptureBundleRef: requireRef(
        snapshot.evidenceCaptureBundleRef,
        "evidenceCaptureBundleRef",
      ),
      frozenAt: ensureIsoTimestamp(snapshot.frozenAt, "frozenAt"),
      contactAuthorityPolicyRef: requireRef(
        snapshot.contactAuthorityPolicyRef,
        "contactAuthorityPolicyRef",
      ),
    };
  }

  get submissionSnapshotFreezeId(): string {
    return this.snapshot.submissionSnapshotFreezeId;
  }

  get envelopeRef(): string {
    return this.snapshot.envelopeRef;
  }

  toSnapshot(): SubmissionSnapshotFreezeSnapshot {
    return {
      ...this.snapshot,
      activeQuestionKeys: [...this.snapshot.activeQuestionKeys],
      attachmentRefs: [...this.snapshot.attachmentRefs],
    };
  }
}

export class SubmitNormalizationSeedDocument {
  private readonly snapshot: SubmitNormalizationSeedSnapshot;

  private constructor(snapshot: SubmitNormalizationSeedSnapshot) {
    this.snapshot = SubmitNormalizationSeedDocument.normalize(snapshot);
  }

  static create(
    input: Omit<SubmitNormalizationSeedSnapshot, "version">,
  ): SubmitNormalizationSeedDocument {
    return new SubmitNormalizationSeedDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: SubmitNormalizationSeedSnapshot): SubmitNormalizationSeedDocument {
    return new SubmitNormalizationSeedDocument(snapshot);
  }

  private static normalize(snapshot: SubmitNormalizationSeedSnapshot): SubmitNormalizationSeedSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_SUBMIT_NORMALIZATION_SEED_VERSION",
      "SubmitNormalizationSeed.version must be >= 1.",
    );
    return {
      ...snapshot,
      submitNormalizationSeedId: requireRef(
        snapshot.submitNormalizationSeedId,
        "submitNormalizationSeedId",
      ),
      submissionSnapshotFreezeRef: requireRef(
        snapshot.submissionSnapshotFreezeRef,
        "submissionSnapshotFreezeRef",
      ),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      sourceLineageRef: requireRef(snapshot.sourceLineageRef, "sourceLineageRef"),
      evidenceCaptureBundleRef: requireRef(
        snapshot.evidenceCaptureBundleRef,
        "evidenceCaptureBundleRef",
      ),
      requestType: requireRef(snapshot.requestType, "requestType"),
      intakeExperienceBundleRef: requireRef(
        snapshot.intakeExperienceBundleRef,
        "intakeExperienceBundleRef",
      ),
      normalizationVersionRef: requireRef(
        snapshot.normalizationVersionRef,
        "normalizationVersionRef",
      ),
      normalizedHash: requireRef(snapshot.normalizedHash, "normalizedHash"),
      dedupeFingerprint: requireRef(snapshot.dedupeFingerprint, "dedupeFingerprint"),
      futureContractGapRefs: uniqueSortedRefs(snapshot.futureContractGapRefs),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    };
  }

  get submitNormalizationSeedId(): string {
    return this.snapshot.submitNormalizationSeedId;
  }

  toSnapshot(): SubmitNormalizationSeedSnapshot {
    return {
      ...this.snapshot,
      futureContractGapRefs: [...this.snapshot.futureContractGapRefs],
    };
  }
}

export class IntakeSubmitSettlementDocument {
  private readonly snapshot: IntakeSubmitSettlementSnapshot;

  private constructor(snapshot: IntakeSubmitSettlementSnapshot) {
    this.snapshot = IntakeSubmitSettlementDocument.normalize(snapshot);
  }

  static create(
    input: Omit<IntakeSubmitSettlementSnapshot, "version">,
  ): IntakeSubmitSettlementDocument {
    return new IntakeSubmitSettlementDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: IntakeSubmitSettlementSnapshot): IntakeSubmitSettlementDocument {
    return new IntakeSubmitSettlementDocument(snapshot);
  }

  private static normalize(snapshot: IntakeSubmitSettlementSnapshot): IntakeSubmitSettlementSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_INTAKE_SUBMIT_SETTLEMENT_VERSION",
      "IntakeSubmitSettlement.version must be >= 1.",
    );
    if (snapshot.settlementState === "request_submitted" || snapshot.settlementState === "authoritative_replay") {
      invariant(
        snapshot.requestRef && snapshot.requestLineageRef && snapshot.promotionRecordRef,
        "SUBMIT_SETTLEMENT_REQUEST_REFS_REQUIRED",
        "Successful submit settlements must retain canonical request and promotion refs.",
      );
    }
    if (snapshot.settlementState === "collision_review_open") {
      invariant(
        snapshot.collisionReviewRef,
        "COLLISION_REVIEW_SETTLEMENT_REQUIRES_REFERENCE",
        "Collision-review settlements must retain collisionReviewRef.",
      );
    }
    return {
      ...snapshot,
      intakeSubmitSettlementId: requireRef(
        snapshot.intakeSubmitSettlementId,
        "intakeSubmitSettlementId",
      ),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(snapshot.draftPublicId, "draftPublicId"),
      sourceLineageRef: requireRef(snapshot.sourceLineageRef, "sourceLineageRef"),
      requestRef: optionalRef(snapshot.requestRef),
      requestLineageRef: optionalRef(snapshot.requestLineageRef),
      promotionRecordRef: optionalRef(snapshot.promotionRecordRef),
      submissionSnapshotFreezeRef: optionalRef(snapshot.submissionSnapshotFreezeRef),
      evidenceCaptureBundleRef: optionalRef(snapshot.evidenceCaptureBundleRef),
      evidenceSnapshotRef: optionalRef(snapshot.evidenceSnapshotRef),
      normalizedSubmissionRef: optionalRef(snapshot.normalizedSubmissionRef),
      collisionReviewRef: optionalRef(snapshot.collisionReviewRef),
      commandActionRecordRef: optionalRef(snapshot.commandActionRecordRef),
      commandSettlementRecordRef: optionalRef(snapshot.commandSettlementRecordRef),
      routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
      receiptConsistencyKey: optionalRef(snapshot.receiptConsistencyKey),
      statusConsistencyKey: optionalRef(snapshot.statusConsistencyKey),
      reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
      gapRefs: uniqueSortedRefs(snapshot.gapRefs),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }

  get intakeSubmitSettlementId(): string {
    return this.snapshot.intakeSubmitSettlementId;
  }

  get envelopeRef(): string {
    return this.snapshot.envelopeRef;
  }

  get commandActionRecordRef(): string | null {
    return this.snapshot.commandActionRecordRef;
  }

  get commandSettlementRecordRef(): string | null {
    return this.snapshot.commandSettlementRecordRef;
  }

  toSnapshot(): IntakeSubmitSettlementSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
      gapRefs: [...this.snapshot.gapRefs],
    };
  }
}

export interface SubmissionSnapshotFreezeRepository {
  getSubmissionSnapshotFreeze(
    submissionSnapshotFreezeId: string,
  ): Promise<SubmissionSnapshotFreezeDocument | undefined>;
  saveSubmissionSnapshotFreeze(document: SubmissionSnapshotFreezeDocument): Promise<void>;
  findSubmissionSnapshotFreezeByEnvelope(
    envelopeRef: string,
  ): Promise<SubmissionSnapshotFreezeDocument | undefined>;
  listSubmissionSnapshotFreezes(): Promise<readonly SubmissionSnapshotFreezeDocument[]>;
}

export interface SubmitNormalizationSeedRepository {
  getSubmitNormalizationSeed(
    submitNormalizationSeedId: string,
  ): Promise<SubmitNormalizationSeedDocument | undefined>;
  saveSubmitNormalizationSeed(document: SubmitNormalizationSeedDocument): Promise<void>;
  listSubmitNormalizationSeeds(): Promise<readonly SubmitNormalizationSeedDocument[]>;
}

export interface IntakeSubmitSettlementRepository {
  getIntakeSubmitSettlement(
    intakeSubmitSettlementId: string,
  ): Promise<IntakeSubmitSettlementDocument | undefined>;
  saveIntakeSubmitSettlement(document: IntakeSubmitSettlementDocument): Promise<void>;
  findLatestIntakeSubmitSettlementByEnvelope(
    envelopeRef: string,
  ): Promise<IntakeSubmitSettlementDocument | undefined>;
  listIntakeSubmitSettlements(): Promise<readonly IntakeSubmitSettlementDocument[]>;
}

export interface SubmissionPromotionTransactionRepositories
  extends SubmissionSnapshotFreezeRepository,
    SubmitNormalizationSeedRepository,
    IntakeSubmitSettlementRepository {}

export class InMemorySubmissionPromotionTransactionStore
  implements SubmissionPromotionTransactionRepositories
{
  private readonly freezes = new Map<string, SubmissionSnapshotFreezeSnapshot>();
  private readonly freezeByEnvelope = new Map<string, string>();
  private readonly seeds = new Map<string, SubmitNormalizationSeedSnapshot>();
  private readonly settlements = new Map<string, IntakeSubmitSettlementSnapshot>();
  private readonly settlementByEnvelope = new Map<string, string>();
  private readonly counters = new Map<string, number>();

  nextGeneratedId(kind: "freeze" | "seed" | "settlement"): string {
    return nextLocalId("phase1_submit", this.counters, kind);
  }

  async getSubmissionSnapshotFreeze(
    submissionSnapshotFreezeId: string,
  ): Promise<SubmissionSnapshotFreezeDocument | undefined> {
    const row = this.freezes.get(submissionSnapshotFreezeId);
    return row ? SubmissionSnapshotFreezeDocument.hydrate(row) : undefined;
  }

  async saveSubmissionSnapshotFreeze(document: SubmissionSnapshotFreezeDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    saveAppendOnly(
      this.freezes,
      snapshot.submissionSnapshotFreezeId,
      snapshot,
      "SubmissionSnapshotFreeze",
    );
    this.freezeByEnvelope.set(snapshot.envelopeRef, snapshot.submissionSnapshotFreezeId);
  }

  async findSubmissionSnapshotFreezeByEnvelope(
    envelopeRef: string,
  ): Promise<SubmissionSnapshotFreezeDocument | undefined> {
    const freezeId = this.freezeByEnvelope.get(envelopeRef);
    return freezeId ? this.getSubmissionSnapshotFreeze(freezeId) : undefined;
  }

  async listSubmissionSnapshotFreezes(): Promise<readonly SubmissionSnapshotFreezeDocument[]> {
    return [...this.freezes.values()].map((row) => SubmissionSnapshotFreezeDocument.hydrate(row));
  }

  async getSubmitNormalizationSeed(
    submitNormalizationSeedId: string,
  ): Promise<SubmitNormalizationSeedDocument | undefined> {
    const row = this.seeds.get(submitNormalizationSeedId);
    return row ? SubmitNormalizationSeedDocument.hydrate(row) : undefined;
  }

  async saveSubmitNormalizationSeed(document: SubmitNormalizationSeedDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    saveAppendOnly(this.seeds, snapshot.submitNormalizationSeedId, snapshot, "SubmitNormalizationSeed");
  }

  async listSubmitNormalizationSeeds(): Promise<readonly SubmitNormalizationSeedDocument[]> {
    return [...this.seeds.values()].map((row) => SubmitNormalizationSeedDocument.hydrate(row));
  }

  async getIntakeSubmitSettlement(
    intakeSubmitSettlementId: string,
  ): Promise<IntakeSubmitSettlementDocument | undefined> {
    const row = this.settlements.get(intakeSubmitSettlementId);
    return row ? IntakeSubmitSettlementDocument.hydrate(row) : undefined;
  }

  async saveIntakeSubmitSettlement(document: IntakeSubmitSettlementDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    saveAppendOnly(
      this.settlements,
      snapshot.intakeSubmitSettlementId,
      snapshot,
      "IntakeSubmitSettlement",
    );
    this.settlementByEnvelope.set(snapshot.envelopeRef, snapshot.intakeSubmitSettlementId);
  }

  async findLatestIntakeSubmitSettlementByEnvelope(
    envelopeRef: string,
  ): Promise<IntakeSubmitSettlementDocument | undefined> {
    const settlementId = this.settlementByEnvelope.get(envelopeRef);
    return settlementId ? this.getIntakeSubmitSettlement(settlementId) : undefined;
  }

  async listIntakeSubmitSettlements(): Promise<readonly IntakeSubmitSettlementDocument[]> {
    return [...this.settlements.values()].map((row) => IntakeSubmitSettlementDocument.hydrate(row));
  }
}

export function createSubmissionPromotionTransactionStore(): InMemorySubmissionPromotionTransactionStore {
  return new InMemorySubmissionPromotionTransactionStore();
}

export function buildSubmitNormalizationSeedDigest(payload: Record<string, unknown>): string {
  return stableDigest(payload);
}

export function buildSubmitReplaySemanticFingerprint(input: {
  sourceLineageRef: string;
  requestType: string;
  normalizedPayload: Record<string, unknown>;
  attachmentRefs: readonly string[];
  contactPreferencesRef?: string | null;
}): string {
  return stableDigest({
    sourceLineageRef: input.sourceLineageRef,
    requestType: input.requestType,
    normalizedPayload: input.normalizedPayload,
    attachmentRefs: uniqueSortedRefs(input.attachmentRefs),
    contactPreferencesRef: optionalRef(input.contactPreferencesRef),
  });
}
