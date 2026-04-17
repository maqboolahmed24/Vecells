import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestAggregate,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  AccessGrantService,
  type AccessGrantActionScope,
  type AccessGrantSnapshot,
  type AccessGrantSupersessionRecordDocument,
  createIdentityBindingAuthorityService,
} from "./identity-access-backbone";
import {
  createReachabilityGovernorService,
  InMemoryReachabilityStore,
  type ReachabilityAssessmentRecordDocument,
  type ReachabilityDependencies,
  type ReachabilityDependencyDocument,
  type ContactRouteRepairJourneyDocument,
  type ContactRouteVerificationCheckpointDocument,
  type RouteHealthState,
  type ReachabilityRepairState,
} from "./reachability-backbone";
import {
  LineageFenceDocument,
  type LineageFenceIssuedFor,
  type LineageFenceRepository,
  type PersistedLineageFenceRow,
} from "./lease-fence-command-backbone";
import { EpisodeAggregate } from "./submission-lineage-backbone";

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

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function addHours(value: string, hours: number): string {
  return new Date(Date.parse(value) + hours * 60 * 60 * 1000).toISOString();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextIdentityRepairId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

export const identityRepairParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_ROUTE_INTENT_SUPERSESSION_SETTLEMENT",
  "PARALLEL_INTERFACE_GAP_PROJECTION_REBUILD_WORKER",
  "PARALLEL_INTERFACE_GAP_COMMS_FREEZE_RUNTIME",
  "PARALLEL_INTERFACE_GAP_SESSION_TERMINATION_SETTLEMENTS",
] as const;

export type IdentityRepairSignalClass =
  | "patient_report"
  | "support_report"
  | "auth_subject_conflict"
  | "secure_link_subject_conflict"
  | "telephony_contradiction"
  | "downstream_contradiction"
  | "delivery_dispute"
  | "audit_replay";

export type IdentityRepairSignalDisposition =
  | "suspicion_only"
  | "credible_misbinding"
  | "confirmed_misbinding";

export interface IdentityRepairSignal {
  repairSignalId: string;
  episodeId: string;
  affectedRequestRef: string;
  observedIdentityBindingRef: string;
  observedSessionRef: string | null;
  observedAccessGrantRef: string | null;
  observedRouteIntentBindingRef: string | null;
  signalClass: IdentityRepairSignalClass;
  signalDisposition: IdentityRepairSignalDisposition;
  evidenceRefs: readonly string[];
  openedRepairCaseRef: string | null;
  reportedBy: string;
  reportedAt: string;
  version: number;
}

export interface PersistedIdentityRepairSignalRow extends IdentityRepairSignal {
  aggregateType: "IdentityRepairSignal";
  persistenceSchemaVersion: 1;
}

function signalDigest(snapshot: Omit<IdentityRepairSignal, "version" | "repairSignalId">): string {
  return sha256Hex(
    stableStringify({
      episodeId: snapshot.episodeId,
      affectedRequestRef: snapshot.affectedRequestRef,
      observedIdentityBindingRef: snapshot.observedIdentityBindingRef,
      observedSessionRef: optionalRef(snapshot.observedSessionRef),
      observedAccessGrantRef: optionalRef(snapshot.observedAccessGrantRef),
      observedRouteIntentBindingRef: optionalRef(snapshot.observedRouteIntentBindingRef),
      signalClass: snapshot.signalClass,
      signalDisposition: snapshot.signalDisposition,
      evidenceRefs: uniqueSortedRefs(snapshot.evidenceRefs),
      reportedBy: snapshot.reportedBy,
      reportedAt: snapshot.reportedAt,
    }),
  );
}

export class IdentityRepairSignalDocument {
  private readonly snapshot: IdentityRepairSignal;

  private constructor(snapshot: IdentityRepairSignal) {
    this.snapshot = IdentityRepairSignalDocument.normalize(snapshot);
  }

  static create(input: Omit<IdentityRepairSignal, "version">): IdentityRepairSignalDocument {
    return new IdentityRepairSignalDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: IdentityRepairSignal): IdentityRepairSignalDocument {
    return new IdentityRepairSignalDocument(snapshot);
  }

  private static normalize(snapshot: IdentityRepairSignal): IdentityRepairSignal {
    invariant(
      snapshot.version >= 1,
      "INVALID_IDENTITY_REPAIR_SIGNAL_VERSION",
      "IdentityRepairSignal.version must be >= 1.",
    );
    return {
      ...snapshot,
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      affectedRequestRef: requireRef(snapshot.affectedRequestRef, "affectedRequestRef"),
      observedIdentityBindingRef: requireRef(
        snapshot.observedIdentityBindingRef,
        "observedIdentityBindingRef",
      ),
      observedSessionRef: optionalRef(snapshot.observedSessionRef),
      observedAccessGrantRef: optionalRef(snapshot.observedAccessGrantRef),
      observedRouteIntentBindingRef: optionalRef(snapshot.observedRouteIntentBindingRef),
      evidenceRefs: uniqueSortedRefs(snapshot.evidenceRefs),
      openedRepairCaseRef: optionalRef(snapshot.openedRepairCaseRef),
      reportedBy: requireRef(snapshot.reportedBy, "reportedBy"),
      reportedAt: ensureIsoTimestamp(snapshot.reportedAt, "reportedAt"),
    };
  }

  get repairSignalId(): string {
    return this.snapshot.repairSignalId;
  }

  get openedRepairCaseRef(): string | null {
    return this.snapshot.openedRepairCaseRef;
  }

  toSnapshot(): IdentityRepairSignal {
    return {
      ...this.snapshot,
      evidenceRefs: [...this.snapshot.evidenceRefs],
    };
  }

  attachRepairCase(input: { repairCaseRef: string }): IdentityRepairSignalDocument {
    if (this.snapshot.openedRepairCaseRef === input.repairCaseRef) {
      return this;
    }
    return new IdentityRepairSignalDocument({
      ...this.snapshot,
      openedRepairCaseRef: requireRef(input.repairCaseRef, "repairCaseRef"),
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type IdentityRepairCaseState =
  | "opened"
  | "freeze_committed"
  | "downstream_quarantined"
  | "correction_authority_pending"
  | "corrected"
  | "rebuild_pending"
  | "release_pending"
  | "closed";

export interface IdentityRepairCase {
  repairCaseId: string;
  episodeId: string;
  affectedRequestRefs: readonly string[];
  openedSignalRefs: readonly string[];
  frozenIdentityBindingRef: string;
  frozenSubjectRef: string;
  frozenPatientRef: string | null;
  suspectedWrongBindingRef: string | null;
  repairBasis: IdentityRepairSignalDisposition;
  lineageFenceEpoch: number;
  state: IdentityRepairCaseState;
  openedBy: string;
  supervisorApprovalRef: string | null;
  independentReviewRef: string | null;
  freezeRecordRef: string | null;
  projectionRebuildRef: string | null;
  downstreamDispositionRefs: readonly string[];
  compensationRefs: readonly string[];
  releaseSettlementRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedIdentityRepairCaseRow extends IdentityRepairCase {
  aggregateType: "IdentityRepairCase";
  persistenceSchemaVersion: 1;
}

function repairBasisRank(value: IdentityRepairSignalDisposition): number {
  switch (value) {
    case "suspicion_only":
      return 1;
    case "credible_misbinding":
      return 2;
    case "confirmed_misbinding":
      return 3;
  }
}

function highestRepairBasis(
  left: IdentityRepairSignalDisposition,
  right: IdentityRepairSignalDisposition,
): IdentityRepairSignalDisposition {
  return repairBasisRank(left) >= repairBasisRank(right) ? left : right;
}

export class IdentityRepairCaseDocument {
  private readonly snapshot: IdentityRepairCase;

  private constructor(snapshot: IdentityRepairCase) {
    this.snapshot = IdentityRepairCaseDocument.normalize(snapshot);
  }

  static create(input: Omit<IdentityRepairCase, "version">): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: IdentityRepairCase): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument(snapshot);
  }

  private static normalize(snapshot: IdentityRepairCase): IdentityRepairCase {
    invariant(
      snapshot.version >= 1,
      "INVALID_IDENTITY_REPAIR_CASE_VERSION",
      "IdentityRepairCase.version must be >= 1.",
    );
    invariant(
      Number.isInteger(snapshot.lineageFenceEpoch) && snapshot.lineageFenceEpoch >= 1,
      "INVALID_IDENTITY_REPAIR_LINEAGE_EPOCH",
      "IdentityRepairCase.lineageFenceEpoch must be >= 1.",
    );
    if (snapshot.state === "closed") {
      invariant(
        optionalRef(snapshot.releaseSettlementRef) !== null,
        "CLOSED_IDENTITY_REPAIR_CASE_REQUIRES_RELEASE",
        "Closed IdentityRepairCase requires releaseSettlementRef.",
      );
    }
    return {
      ...snapshot,
      affectedRequestRefs: uniqueSortedRefs(snapshot.affectedRequestRefs),
      openedSignalRefs: uniqueSortedRefs(snapshot.openedSignalRefs),
      frozenIdentityBindingRef: requireRef(
        snapshot.frozenIdentityBindingRef,
        "frozenIdentityBindingRef",
      ),
      frozenSubjectRef: requireRef(snapshot.frozenSubjectRef, "frozenSubjectRef"),
      frozenPatientRef: optionalRef(snapshot.frozenPatientRef),
      suspectedWrongBindingRef: optionalRef(snapshot.suspectedWrongBindingRef),
      openedBy: requireRef(snapshot.openedBy, "openedBy"),
      supervisorApprovalRef: optionalRef(snapshot.supervisorApprovalRef),
      independentReviewRef: optionalRef(snapshot.independentReviewRef),
      freezeRecordRef: optionalRef(snapshot.freezeRecordRef),
      projectionRebuildRef: optionalRef(snapshot.projectionRebuildRef),
      downstreamDispositionRefs: uniqueSortedRefs(snapshot.downstreamDispositionRefs),
      compensationRefs: uniqueSortedRefs(snapshot.compensationRefs),
      releaseSettlementRef: optionalRef(snapshot.releaseSettlementRef),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
  }

  get repairCaseId(): string {
    return this.snapshot.repairCaseId;
  }

  get frozenIdentityBindingRef(): string {
    return this.snapshot.frozenIdentityBindingRef;
  }

  get state(): IdentityRepairCaseState {
    return this.snapshot.state;
  }

  get freezeRecordRef(): string | null {
    return this.snapshot.freezeRecordRef;
  }

  get releaseSettlementRef(): string | null {
    return this.snapshot.releaseSettlementRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): IdentityRepairCase {
    return {
      ...this.snapshot,
      affectedRequestRefs: [...this.snapshot.affectedRequestRefs],
      openedSignalRefs: [...this.snapshot.openedSignalRefs],
      downstreamDispositionRefs: [...this.snapshot.downstreamDispositionRefs],
      compensationRefs: [...this.snapshot.compensationRefs],
    };
  }

  addSignal(input: {
    signalRef: string;
    repairBasis: IdentityRepairSignalDisposition;
    updatedAt: string;
  }): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      openedSignalRefs: uniqueSortedRefs([...this.snapshot.openedSignalRefs, input.signalRef]),
      repairBasis: highestRepairBasis(this.snapshot.repairBasis, input.repairBasis),
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  commitFreeze(input: {
    freezeRecordRef: string;
    lineageFenceEpoch: number;
    downstreamDispositionRefs: readonly string[];
    compensationRefs: readonly string[];
    updatedAt: string;
  }): IdentityRepairCaseDocument {
    const nextState =
      input.downstreamDispositionRefs.length > 0 ? "downstream_quarantined" : "freeze_committed";
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      freezeRecordRef: requireRef(input.freezeRecordRef, "freezeRecordRef"),
      lineageFenceEpoch: input.lineageFenceEpoch,
      downstreamDispositionRefs: uniqueSortedRefs(input.downstreamDispositionRefs),
      compensationRefs: uniqueSortedRefs(input.compensationRefs),
      state: nextState,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  settleBranchDisposition(input: {
    downstreamDispositionRef: string;
    compensationRef?: string | null;
    updatedAt: string;
  }): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      downstreamDispositionRefs: uniqueSortedRefs([
        ...this.snapshot.downstreamDispositionRefs,
        input.downstreamDispositionRef,
      ]),
      compensationRefs:
        optionalRef(input.compensationRef) === null
          ? [...this.snapshot.compensationRefs]
          : uniqueSortedRefs([...this.snapshot.compensationRefs, input.compensationRef!]),
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markCorrectionAuthorityPending(input: {
    supervisorApprovalRef: string;
    independentReviewRef: string;
    updatedAt: string;
  }): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      supervisorApprovalRef: requireRef(input.supervisorApprovalRef, "supervisorApprovalRef"),
      independentReviewRef: requireRef(input.independentReviewRef, "independentReviewRef"),
      state: "correction_authority_pending",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markCorrected(input: {
    projectionRebuildRef?: string | null;
    updatedAt: string;
  }): IdentityRepairCaseDocument {
    const projectionRebuildRef = optionalRef(input.projectionRebuildRef);
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      projectionRebuildRef: projectionRebuildRef ?? this.snapshot.projectionRebuildRef,
      state: projectionRebuildRef ? "rebuild_pending" : "corrected",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markReleasePending(input: { updatedAt: string }): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      state: "release_pending",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  close(input: { releaseSettlementRef: string; updatedAt: string }): IdentityRepairCaseDocument {
    return new IdentityRepairCaseDocument({
      ...this.snapshot,
      releaseSettlementRef: requireRef(input.releaseSettlementRef, "releaseSettlementRef"),
      state: "closed",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type IdentityRepairCommunicationsHoldState = "active" | "partial" | "released";
export type IdentityRepairProjectionHoldState = "summary_only" | "read_only" | "recovery_only";
export type IdentityRepairFreezeState = "pending" | "active" | "released";

export interface IdentityRepairFreezeRecord {
  freezeRecordId: string;
  identityRepairCaseRef: string;
  frozenIdentityBindingRef: string;
  lineageFenceEpoch: number;
  sessionTerminationSettlementRefs: readonly string[];
  accessGrantSupersessionRefs: readonly string[];
  supersededRouteIntentBindingRefs: readonly string[];
  communicationsHoldState: IdentityRepairCommunicationsHoldState;
  projectionHoldState: IdentityRepairProjectionHoldState;
  affectedAudienceRefs: readonly string[];
  freezeState: IdentityRepairFreezeState;
  activatedAt: string;
  releasedAt: string | null;
  version: number;
}

export interface PersistedIdentityRepairFreezeRecordRow extends IdentityRepairFreezeRecord {
  aggregateType: "IdentityRepairFreezeRecord";
  persistenceSchemaVersion: 1;
}

export class IdentityRepairFreezeRecordDocument {
  private readonly snapshot: IdentityRepairFreezeRecord;

  private constructor(snapshot: IdentityRepairFreezeRecord) {
    this.snapshot = IdentityRepairFreezeRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<IdentityRepairFreezeRecord, "version">,
  ): IdentityRepairFreezeRecordDocument {
    return new IdentityRepairFreezeRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: IdentityRepairFreezeRecord): IdentityRepairFreezeRecordDocument {
    return new IdentityRepairFreezeRecordDocument(snapshot);
  }

  private static normalize(snapshot: IdentityRepairFreezeRecord): IdentityRepairFreezeRecord {
    invariant(
      snapshot.version >= 1,
      "INVALID_IDENTITY_REPAIR_FREEZE_VERSION",
      "IdentityRepairFreezeRecord.version must be >= 1.",
    );
    invariant(
      Number.isInteger(snapshot.lineageFenceEpoch) && snapshot.lineageFenceEpoch >= 1,
      "INVALID_IDENTITY_REPAIR_FREEZE_EPOCH",
      "IdentityRepairFreezeRecord.lineageFenceEpoch must be >= 1.",
    );
    if (snapshot.freezeState === "released") {
      invariant(
        optionalRef(snapshot.releasedAt) !== null,
        "RELEASED_IDENTITY_REPAIR_FREEZE_REQUIRES_RELEASED_AT",
        "Released IdentityRepairFreezeRecord requires releasedAt.",
      );
    }
    return {
      ...snapshot,
      identityRepairCaseRef: requireRef(snapshot.identityRepairCaseRef, "identityRepairCaseRef"),
      frozenIdentityBindingRef: requireRef(
        snapshot.frozenIdentityBindingRef,
        "frozenIdentityBindingRef",
      ),
      sessionTerminationSettlementRefs: uniqueSortedRefs(snapshot.sessionTerminationSettlementRefs),
      accessGrantSupersessionRefs: uniqueSortedRefs(snapshot.accessGrantSupersessionRefs),
      supersededRouteIntentBindingRefs: uniqueSortedRefs(snapshot.supersededRouteIntentBindingRefs),
      affectedAudienceRefs: uniqueSortedRefs(snapshot.affectedAudienceRefs),
      activatedAt: ensureIsoTimestamp(snapshot.activatedAt, "activatedAt"),
      releasedAt: optionalRef(snapshot.releasedAt),
    };
  }

  get freezeRecordId(): string {
    return this.snapshot.freezeRecordId;
  }

  get freezeState(): IdentityRepairFreezeState {
    return this.snapshot.freezeState;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): IdentityRepairFreezeRecord {
    return {
      ...this.snapshot,
      sessionTerminationSettlementRefs: [...this.snapshot.sessionTerminationSettlementRefs],
      accessGrantSupersessionRefs: [...this.snapshot.accessGrantSupersessionRefs],
      supersededRouteIntentBindingRefs: [...this.snapshot.supersededRouteIntentBindingRefs],
      affectedAudienceRefs: [...this.snapshot.affectedAudienceRefs],
    };
  }

  release(input: {
    communicationsHoldState: Exclude<IdentityRepairCommunicationsHoldState, "active" | "partial">;
    releasedAt: string;
  }): IdentityRepairFreezeRecordDocument {
    return new IdentityRepairFreezeRecordDocument({
      ...this.snapshot,
      communicationsHoldState: input.communicationsHoldState,
      freezeState: "released",
      releasedAt: input.releasedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type IdentityRepairBranchType =
  | "booking"
  | "hub_coordination"
  | "pharmacy"
  | "callback"
  | "message_thread"
  | "support_ticket"
  | "artifact_projection"
  | "outbound_communication";

export type IdentityRepairRequiredDisposition =
  | "suppress_visibility"
  | "revalidate_under_new_binding"
  | "compensate_external"
  | "manual_review_only";

export type IdentityRepairBranchState =
  | "pending_freeze"
  | "quarantined"
  | "compensation_pending"
  | "rebuilt"
  | "released";

export interface IdentityRepairBranchDisposition {
  branchDispositionId: string;
  identityRepairCaseRef: string;
  branchType: IdentityRepairBranchType;
  governingObjectRef: string;
  frozenIdentityBindingRef: string;
  requiredDisposition: IdentityRepairRequiredDisposition;
  compensationRef: string | null;
  revalidationSettlementRef: string | null;
  branchState: IdentityRepairBranchState;
  releasedAt: string | null;
  version: number;
}

export interface PersistedIdentityRepairBranchDispositionRow
  extends IdentityRepairBranchDisposition {
  aggregateType: "IdentityRepairBranchDisposition";
  persistenceSchemaVersion: 1;
}

export class IdentityRepairBranchDispositionDocument {
  private readonly snapshot: IdentityRepairBranchDisposition;

  private constructor(snapshot: IdentityRepairBranchDisposition) {
    this.snapshot = IdentityRepairBranchDispositionDocument.normalize(snapshot);
  }

  static create(
    input: Omit<IdentityRepairBranchDisposition, "version">,
  ): IdentityRepairBranchDispositionDocument {
    return new IdentityRepairBranchDispositionDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: IdentityRepairBranchDisposition,
  ): IdentityRepairBranchDispositionDocument {
    return new IdentityRepairBranchDispositionDocument(snapshot);
  }

  private static normalize(
    snapshot: IdentityRepairBranchDisposition,
  ): IdentityRepairBranchDisposition {
    invariant(
      snapshot.version >= 1,
      "INVALID_IDENTITY_REPAIR_BRANCH_DISPOSITION_VERSION",
      "IdentityRepairBranchDisposition.version must be >= 1.",
    );
    if (snapshot.branchState === "released") {
      invariant(
        optionalRef(snapshot.releasedAt) !== null,
        "RELEASED_IDENTITY_REPAIR_BRANCH_REQUIRES_RELEASED_AT",
        "Released IdentityRepairBranchDisposition requires releasedAt.",
      );
    }
    return {
      ...snapshot,
      identityRepairCaseRef: requireRef(snapshot.identityRepairCaseRef, "identityRepairCaseRef"),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      frozenIdentityBindingRef: requireRef(
        snapshot.frozenIdentityBindingRef,
        "frozenIdentityBindingRef",
      ),
      compensationRef: optionalRef(snapshot.compensationRef),
      revalidationSettlementRef: optionalRef(snapshot.revalidationSettlementRef),
      releasedAt: optionalRef(snapshot.releasedAt),
    };
  }

  get branchDispositionId(): string {
    return this.snapshot.branchDispositionId;
  }

  get branchState(): IdentityRepairBranchState {
    return this.snapshot.branchState;
  }

  get requiredDisposition(): IdentityRepairRequiredDisposition {
    return this.snapshot.requiredDisposition;
  }

  get compensationRef(): string | null {
    return this.snapshot.compensationRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): IdentityRepairBranchDisposition {
    return { ...this.snapshot };
  }

  quarantine(input: {
    compensationRef?: string | null;
    updatedAt?: string;
  }): IdentityRepairBranchDispositionDocument {
    return new IdentityRepairBranchDispositionDocument({
      ...this.snapshot,
      compensationRef: optionalRef(input.compensationRef) ?? this.snapshot.compensationRef,
      branchState:
        optionalRef(input.compensationRef) !== null ||
        this.snapshot.requiredDisposition === "compensate_external"
          ? "compensation_pending"
          : "quarantined",
      version: nextVersion(this.snapshot.version),
    });
  }

  rebuild(input: {
    revalidationSettlementRef: string;
    updatedAt?: string;
  }): IdentityRepairBranchDispositionDocument {
    return new IdentityRepairBranchDispositionDocument({
      ...this.snapshot,
      revalidationSettlementRef: requireRef(
        input.revalidationSettlementRef,
        "revalidationSettlementRef",
      ),
      branchState: "rebuilt",
      version: nextVersion(this.snapshot.version),
    });
  }

  release(input: {
    compensationRef?: string | null;
    revalidationSettlementRef?: string | null;
    releasedAt: string;
  }): IdentityRepairBranchDispositionDocument {
    return new IdentityRepairBranchDispositionDocument({
      ...this.snapshot,
      compensationRef: optionalRef(input.compensationRef) ?? this.snapshot.compensationRef,
      revalidationSettlementRef:
        optionalRef(input.revalidationSettlementRef) ?? this.snapshot.revalidationSettlementRef,
      branchState: "released",
      releasedAt: input.releasedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type IdentityRepairCommunicationsResumeState = "resumed" | "manual_follow_up_required";

export type IdentityRepairReleaseMode =
  | "read_only_resume"
  | "claim_pending_resume"
  | "writable_resume"
  | "manual_follow_up_only";

export interface IdentityRepairReleaseSettlement {
  releaseSettlementId: string;
  identityRepairCaseRef: string;
  resultingIdentityBindingRef: string;
  freezeRecordRef: string;
  downstreamDispositionRefs: readonly string[];
  projectionRebuildRef: string | null;
  replacementAccessGrantRefs: readonly string[];
  replacementRouteIntentBindingRefs: readonly string[];
  replacementSessionEstablishmentDecisionRef: string | null;
  communicationsResumeState: IdentityRepairCommunicationsResumeState;
  releaseMode: IdentityRepairReleaseMode;
  recordedAt: string;
  version: number;
}

export interface PersistedIdentityRepairReleaseSettlementRow
  extends IdentityRepairReleaseSettlement {
  aggregateType: "IdentityRepairReleaseSettlement";
  persistenceSchemaVersion: 1;
}

export class IdentityRepairReleaseSettlementDocument {
  private readonly snapshot: IdentityRepairReleaseSettlement;

  private constructor(snapshot: IdentityRepairReleaseSettlement) {
    this.snapshot = IdentityRepairReleaseSettlementDocument.normalize(snapshot);
  }

  static create(
    input: Omit<IdentityRepairReleaseSettlement, "version">,
  ): IdentityRepairReleaseSettlementDocument {
    return new IdentityRepairReleaseSettlementDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: IdentityRepairReleaseSettlement,
  ): IdentityRepairReleaseSettlementDocument {
    return new IdentityRepairReleaseSettlementDocument(snapshot);
  }

  private static normalize(
    snapshot: IdentityRepairReleaseSettlement,
  ): IdentityRepairReleaseSettlement {
    invariant(
      snapshot.version >= 1,
      "INVALID_IDENTITY_REPAIR_RELEASE_SETTLEMENT_VERSION",
      "IdentityRepairReleaseSettlement.version must be >= 1.",
    );
    return {
      ...snapshot,
      identityRepairCaseRef: requireRef(snapshot.identityRepairCaseRef, "identityRepairCaseRef"),
      resultingIdentityBindingRef: requireRef(
        snapshot.resultingIdentityBindingRef,
        "resultingIdentityBindingRef",
      ),
      freezeRecordRef: requireRef(snapshot.freezeRecordRef, "freezeRecordRef"),
      downstreamDispositionRefs: uniqueSortedRefs(snapshot.downstreamDispositionRefs),
      projectionRebuildRef: optionalRef(snapshot.projectionRebuildRef),
      replacementAccessGrantRefs: uniqueSortedRefs(snapshot.replacementAccessGrantRefs),
      replacementRouteIntentBindingRefs: uniqueSortedRefs(
        snapshot.replacementRouteIntentBindingRefs,
      ),
      replacementSessionEstablishmentDecisionRef: optionalRef(
        snapshot.replacementSessionEstablishmentDecisionRef,
      ),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }

  get releaseSettlementId(): string {
    return this.snapshot.releaseSettlementId;
  }

  get releaseMode(): IdentityRepairReleaseMode {
    return this.snapshot.releaseMode;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): IdentityRepairReleaseSettlement {
    return {
      ...this.snapshot,
      downstreamDispositionRefs: [...this.snapshot.downstreamDispositionRefs],
      replacementAccessGrantRefs: [...this.snapshot.replacementAccessGrantRefs],
      replacementRouteIntentBindingRefs: [...this.snapshot.replacementRouteIntentBindingRefs],
    };
  }
}

export type IdentityRepairReachabilityEventName =
  | "identity.repair_signal.recorded"
  | "identity.repair_case.opened"
  | "identity.repair_case.freeze_committed"
  | "identity.repair_branch.quarantined"
  | "identity.repair_case.corrected"
  | "identity.repair_release.settled"
  | "identity.repair_case.closed"
  | "reachability.route_snapshot.superseded"
  | "reachability.assessment.settled"
  | "reachability.changed"
  | "reachability.repair.started"
  | "reachability.verification_checkpoint.verified"
  | "reachability.repair_journey.closed";

export interface IdentityRepairReachabilityEventEnvelope<TPayload = Record<string, unknown>> {
  eventName: IdentityRepairReachabilityEventName;
  emittedAt: string;
  payload: TPayload;
}

export const identityRepairReachabilityCanonicalEvents = [
  {
    eventName: "identity.repair_case.opened",
    governingObjectType: "IdentityRepairCase",
    sourceRef: "phase-0-the-foundation-protocol.md#2.5 IdentityRepairOrchestrator",
  },
  {
    eventName: "identity.repair_case.freeze_committed",
    governingObjectType: "IdentityRepairCase",
    sourceRef: "phase-0-the-foundation-protocol.md#5.6 Wrong-patient correction algorithm",
  },
  {
    eventName: "identity.repair_branch.quarantined",
    governingObjectType: "IdentityRepairBranchDisposition",
    sourceRef: "phase-0-the-foundation-protocol.md#1.5B IdentityRepairBranchDisposition",
  },
  {
    eventName: "identity.repair_release.settled",
    governingObjectType: "IdentityRepairReleaseSettlement",
    sourceRef: "phase-0-the-foundation-protocol.md#1.5C IdentityRepairReleaseSettlement",
  },
  {
    eventName: "reachability.route_snapshot.superseded",
    governingObjectType: "ContactRouteSnapshot",
    sourceRef: "phase-0-the-foundation-protocol.md#1.8D ContactRouteSnapshot",
  },
  {
    eventName: "reachability.changed",
    governingObjectType: "ReachabilityAssessmentRecord",
    sourceRef: "phase-0-the-foundation-protocol.md#1.8F ReachabilityAssessmentRecord",
  },
  {
    eventName: "reachability.repair.started",
    governingObjectType: "ContactRouteRepairJourney",
    sourceRef: "phase-0-the-foundation-protocol.md#1.9A ContactRouteRepairJourney",
  },
  {
    eventName: "reachability.verification_checkpoint.verified",
    governingObjectType: "ContactRouteVerificationCheckpoint",
    sourceRef: "phase-0-the-foundation-protocol.md#1.9B ContactRouteVerificationCheckpoint",
  },
  {
    eventName: "reachability.repair_journey.closed",
    governingObjectType: "ContactRouteRepairJourney",
    sourceRef: "phase-0-the-foundation-protocol.md#1.9A ContactRouteRepairJourney",
  },
] as const;

function emitRepairEvent<TPayload>(
  eventName: IdentityRepairReachabilityEventName,
  emittedAt: string,
  payload: TPayload,
): IdentityRepairReachabilityEventEnvelope<TPayload> {
  return {
    eventName,
    emittedAt,
    payload,
  };
}

export interface IdentityRepairSignalRepository {
  getIdentityRepairSignal(
    repairSignalId: string,
  ): Promise<IdentityRepairSignalDocument | undefined>;
  findIdentityRepairSignalByDigest(
    digest: string,
  ): Promise<IdentityRepairSignalDocument | undefined>;
  listIdentityRepairSignals(): Promise<readonly IdentityRepairSignalDocument[]>;
  listIdentityRepairSignalsForCase(
    repairCaseId: string,
  ): Promise<readonly IdentityRepairSignalDocument[]>;
  listIdentityRepairSignalsForEpisode(
    episodeId: string,
  ): Promise<readonly IdentityRepairSignalDocument[]>;
  saveIdentityRepairSignal(
    signal: IdentityRepairSignalDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface IdentityRepairCaseRepository {
  getIdentityRepairCase(repairCaseId: string): Promise<IdentityRepairCaseDocument | undefined>;
  findActiveIdentityRepairCaseForBinding(
    frozenIdentityBindingRef: string,
  ): Promise<IdentityRepairCaseDocument | undefined>;
  listIdentityRepairCases(): Promise<readonly IdentityRepairCaseDocument[]>;
  listIdentityRepairCasesForEpisode(
    episodeId: string,
  ): Promise<readonly IdentityRepairCaseDocument[]>;
  saveIdentityRepairCase(
    repairCase: IdentityRepairCaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface IdentityRepairFreezeRecordRepository {
  getIdentityRepairFreezeRecord(
    freezeRecordId: string,
  ): Promise<IdentityRepairFreezeRecordDocument | undefined>;
  listIdentityRepairFreezeRecords(): Promise<readonly IdentityRepairFreezeRecordDocument[]>;
  listIdentityRepairFreezeRecordsForCase(
    repairCaseId: string,
  ): Promise<readonly IdentityRepairFreezeRecordDocument[]>;
  saveIdentityRepairFreezeRecord(
    freezeRecord: IdentityRepairFreezeRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface IdentityRepairBranchDispositionRepository {
  getIdentityRepairBranchDisposition(
    branchDispositionId: string,
  ): Promise<IdentityRepairBranchDispositionDocument | undefined>;
  listIdentityRepairBranchDispositions(): Promise<
    readonly IdentityRepairBranchDispositionDocument[]
  >;
  listIdentityRepairBranchDispositionsForCase(
    repairCaseId: string,
  ): Promise<readonly IdentityRepairBranchDispositionDocument[]>;
  saveIdentityRepairBranchDisposition(
    branchDisposition: IdentityRepairBranchDispositionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface IdentityRepairReleaseSettlementRepository {
  getIdentityRepairReleaseSettlement(
    releaseSettlementId: string,
  ): Promise<IdentityRepairReleaseSettlementDocument | undefined>;
  listIdentityRepairReleaseSettlements(): Promise<
    readonly IdentityRepairReleaseSettlementDocument[]
  >;
  saveIdentityRepairReleaseSettlement(
    releaseSettlement: IdentityRepairReleaseSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface IdentityRepairReachabilityEventRepository {
  listIdentityRepairReachabilityEvents(): Promise<
    readonly IdentityRepairReachabilityEventEnvelope[]
  >;
  appendIdentityRepairReachabilityEvents(
    events: readonly IdentityRepairReachabilityEventEnvelope[],
  ): Promise<void>;
}

export interface IdentityRepairDependencies
  extends ReachabilityDependencies,
    LineageFenceRepository,
    IdentityRepairSignalRepository,
    IdentityRepairCaseRepository,
    IdentityRepairFreezeRecordRepository,
    IdentityRepairBranchDispositionRepository,
    IdentityRepairReleaseSettlementRepository,
    IdentityRepairReachabilityEventRepository {}

export class InMemoryIdentityRepairStore
  extends InMemoryReachabilityStore
  implements IdentityRepairDependencies
{
  private readonly repairSignals = new Map<string, PersistedIdentityRepairSignalRow>();
  private readonly repairSignalDigestToId = new Map<string, string>();
  private readonly repairCases = new Map<string, PersistedIdentityRepairCaseRow>();
  private readonly repairFreezes = new Map<string, PersistedIdentityRepairFreezeRecordRow>();
  private readonly repairBranches = new Map<string, PersistedIdentityRepairBranchDispositionRow>();
  private readonly repairReleases = new Map<string, PersistedIdentityRepairReleaseSettlementRow>();
  private readonly lineageFences = new Map<string, PersistedLineageFenceRow>();
  private readonly latestFenceByEpisode = new Map<string, string>();
  private readonly repairEvents: IdentityRepairReachabilityEventEnvelope[] = [];

  async getIdentityRepairSignal(
    repairSignalId: string,
  ): Promise<IdentityRepairSignalDocument | undefined> {
    const row = this.repairSignals.get(repairSignalId);
    return row ? IdentityRepairSignalDocument.hydrate(row) : undefined;
  }

  async findIdentityRepairSignalByDigest(
    digest: string,
  ): Promise<IdentityRepairSignalDocument | undefined> {
    const signalId = this.repairSignalDigestToId.get(digest);
    return signalId ? this.getIdentityRepairSignal(signalId) : undefined;
  }

  async listIdentityRepairSignals(): Promise<readonly IdentityRepairSignalDocument[]> {
    return [...this.repairSignals.values()]
      .sort((left, right) => compareIso(left.reportedAt, right.reportedAt))
      .map((row) => IdentityRepairSignalDocument.hydrate(row));
  }

  async listIdentityRepairSignalsForCase(
    repairCaseId: string,
  ): Promise<readonly IdentityRepairSignalDocument[]> {
    return [...this.repairSignals.values()]
      .filter((row) => row.openedRepairCaseRef === repairCaseId)
      .sort((left, right) => compareIso(left.reportedAt, right.reportedAt))
      .map((row) => IdentityRepairSignalDocument.hydrate(row));
  }

  async listIdentityRepairSignalsForEpisode(
    episodeId: string,
  ): Promise<readonly IdentityRepairSignalDocument[]> {
    return [...this.repairSignals.values()]
      .filter((row) => row.episodeId === episodeId)
      .sort((left, right) => compareIso(left.reportedAt, right.reportedAt))
      .map((row) => IdentityRepairSignalDocument.hydrate(row));
  }

  async saveIdentityRepairSignal(
    signal: IdentityRepairSignalDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = signal.toSnapshot();
    const digest = signalDigest({
      episodeId: snapshot.episodeId,
      affectedRequestRef: snapshot.affectedRequestRef,
      observedIdentityBindingRef: snapshot.observedIdentityBindingRef,
      observedSessionRef: snapshot.observedSessionRef,
      observedAccessGrantRef: snapshot.observedAccessGrantRef,
      observedRouteIntentBindingRef: snapshot.observedRouteIntentBindingRef,
      signalClass: snapshot.signalClass,
      signalDisposition: snapshot.signalDisposition,
      evidenceRefs: snapshot.evidenceRefs,
      openedRepairCaseRef: snapshot.openedRepairCaseRef,
      reportedBy: snapshot.reportedBy,
      reportedAt: snapshot.reportedAt,
    });
    const currentSignalId = this.repairSignalDigestToId.get(digest);
    invariant(
      currentSignalId === undefined || currentSignalId === snapshot.repairSignalId,
      "IDENTITY_REPAIR_SIGNAL_DIGEST_ALREADY_BOUND",
      `IdentityRepairSignal digest ${digest} is already bound to ${currentSignalId}.`,
    );
    saveWithCas(
      this.repairSignals,
      snapshot.repairSignalId,
      {
        ...snapshot,
        aggregateType: "IdentityRepairSignal",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.repairSignalDigestToId.set(digest, snapshot.repairSignalId);
  }

  async getIdentityRepairCase(
    repairCaseId: string,
  ): Promise<IdentityRepairCaseDocument | undefined> {
    const row = this.repairCases.get(repairCaseId);
    return row ? IdentityRepairCaseDocument.hydrate(row) : undefined;
  }

  async findActiveIdentityRepairCaseForBinding(
    frozenIdentityBindingRef: string,
  ): Promise<IdentityRepairCaseDocument | undefined> {
    const row = [...this.repairCases.values()]
      .filter(
        (candidate) =>
          candidate.frozenIdentityBindingRef === frozenIdentityBindingRef &&
          candidate.state !== "closed",
      )
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .at(-1);
    return row ? IdentityRepairCaseDocument.hydrate(row) : undefined;
  }

  async listIdentityRepairCases(): Promise<readonly IdentityRepairCaseDocument[]> {
    return [...this.repairCases.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => IdentityRepairCaseDocument.hydrate(row));
  }

  async listIdentityRepairCasesForEpisode(
    episodeId: string,
  ): Promise<readonly IdentityRepairCaseDocument[]> {
    return [...this.repairCases.values()]
      .filter((row) => row.episodeId === episodeId)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => IdentityRepairCaseDocument.hydrate(row));
  }

  async saveIdentityRepairCase(
    repairCase: IdentityRepairCaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = repairCase.toSnapshot();
    saveWithCas(
      this.repairCases,
      snapshot.repairCaseId,
      {
        ...snapshot,
        aggregateType: "IdentityRepairCase",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getIdentityRepairFreezeRecord(
    freezeRecordId: string,
  ): Promise<IdentityRepairFreezeRecordDocument | undefined> {
    const row = this.repairFreezes.get(freezeRecordId);
    return row ? IdentityRepairFreezeRecordDocument.hydrate(row) : undefined;
  }

  async listIdentityRepairFreezeRecords(): Promise<readonly IdentityRepairFreezeRecordDocument[]> {
    return [...this.repairFreezes.values()]
      .sort((left, right) => compareIso(left.activatedAt, right.activatedAt))
      .map((row) => IdentityRepairFreezeRecordDocument.hydrate(row));
  }

  async listIdentityRepairFreezeRecordsForCase(
    repairCaseId: string,
  ): Promise<readonly IdentityRepairFreezeRecordDocument[]> {
    return [...this.repairFreezes.values()]
      .filter((row) => row.identityRepairCaseRef === repairCaseId)
      .sort((left, right) => compareIso(left.activatedAt, right.activatedAt))
      .map((row) => IdentityRepairFreezeRecordDocument.hydrate(row));
  }

  async saveIdentityRepairFreezeRecord(
    freezeRecord: IdentityRepairFreezeRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = freezeRecord.toSnapshot();
    saveWithCas(
      this.repairFreezes,
      snapshot.freezeRecordId,
      {
        ...snapshot,
        aggregateType: "IdentityRepairFreezeRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getIdentityRepairBranchDisposition(
    branchDispositionId: string,
  ): Promise<IdentityRepairBranchDispositionDocument | undefined> {
    const row = this.repairBranches.get(branchDispositionId);
    return row ? IdentityRepairBranchDispositionDocument.hydrate(row) : undefined;
  }

  async listIdentityRepairBranchDispositions(): Promise<
    readonly IdentityRepairBranchDispositionDocument[]
  > {
    return [...this.repairBranches.values()]
      .sort((left, right) => compareIso(left.releasedAt ?? "", right.releasedAt ?? ""))
      .map((row) => IdentityRepairBranchDispositionDocument.hydrate(row));
  }

  async listIdentityRepairBranchDispositionsForCase(
    repairCaseId: string,
  ): Promise<readonly IdentityRepairBranchDispositionDocument[]> {
    return [...this.repairBranches.values()]
      .filter((row) => row.identityRepairCaseRef === repairCaseId)
      .map((row) => IdentityRepairBranchDispositionDocument.hydrate(row));
  }

  async saveIdentityRepairBranchDisposition(
    branchDisposition: IdentityRepairBranchDispositionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = branchDisposition.toSnapshot();
    saveWithCas(
      this.repairBranches,
      snapshot.branchDispositionId,
      {
        ...snapshot,
        aggregateType: "IdentityRepairBranchDisposition",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getIdentityRepairReleaseSettlement(
    releaseSettlementId: string,
  ): Promise<IdentityRepairReleaseSettlementDocument | undefined> {
    const row = this.repairReleases.get(releaseSettlementId);
    return row ? IdentityRepairReleaseSettlementDocument.hydrate(row) : undefined;
  }

  async listIdentityRepairReleaseSettlements(): Promise<
    readonly IdentityRepairReleaseSettlementDocument[]
  > {
    return [...this.repairReleases.values()]
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => IdentityRepairReleaseSettlementDocument.hydrate(row));
  }

  async saveIdentityRepairReleaseSettlement(
    releaseSettlement: IdentityRepairReleaseSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = releaseSettlement.toSnapshot();
    saveWithCas(
      this.repairReleases,
      snapshot.releaseSettlementId,
      {
        ...snapshot,
        aggregateType: "IdentityRepairReleaseSettlement",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getLineageFence(fenceId: string): Promise<LineageFenceDocument | undefined> {
    const row = this.lineageFences.get(fenceId);
    return row ? LineageFenceDocument.hydrate(row) : undefined;
  }

  async saveLineageFence(
    fence: LineageFenceDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = fence.toSnapshot();
    saveWithCas(
      this.lineageFences,
      row.fenceId,
      {
        ...row,
        aggregateType: "LineageFence",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.latestFenceByEpisode.set(row.episodeId, row.fenceId);
  }

  async getCurrentLineageFenceForEpisode(
    episodeId: string,
  ): Promise<LineageFenceDocument | undefined> {
    const fenceId = this.latestFenceByEpisode.get(episodeId);
    if (!fenceId) {
      return undefined;
    }
    const row = this.lineageFences.get(fenceId);
    return row ? LineageFenceDocument.hydrate(row) : undefined;
  }

  async listLineageFences(): Promise<readonly LineageFenceDocument[]> {
    return [...this.lineageFences.values()]
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt))
      .map((row) => LineageFenceDocument.hydrate(row));
  }

  async listIdentityRepairReachabilityEvents(): Promise<
    readonly IdentityRepairReachabilityEventEnvelope[]
  > {
    return [...this.repairEvents];
  }

  async appendIdentityRepairReachabilityEvents(
    events: readonly IdentityRepairReachabilityEventEnvelope[],
  ): Promise<void> {
    this.repairEvents.push(...events);
  }
}

export function createIdentityRepairStore(): IdentityRepairDependencies {
  return new InMemoryIdentityRepairStore();
}

export interface RepairImpactBranchInput {
  branchType: IdentityRepairBranchType;
  governingObjectRef: string;
  audienceRef?: string | null;
  hasExternalSideEffect?: boolean;
  requiresManualReview?: boolean;
  requiresRevalidation?: boolean;
  requiresCompensation?: boolean;
}

export interface RepairImpactBranchPlan {
  branchType: IdentityRepairBranchType;
  governingObjectRef: string;
  audienceRef: string | null;
  requiredDisposition: IdentityRepairRequiredDisposition;
  initialBranchState: IdentityRepairBranchState;
  compensationRef: string | null;
}

export interface IdentityRepairImpactPlan {
  communicationsHoldState: IdentityRepairCommunicationsHoldState;
  projectionHoldState: IdentityRepairProjectionHoldState;
  affectedAudienceRefs: readonly string[];
  branchPlans: readonly RepairImpactBranchPlan[];
  compensationRefs: readonly string[];
}

function defaultAudienceForBranch(branchType: IdentityRepairBranchType): string {
  switch (branchType) {
    case "booking":
      return "patient_booking";
    case "hub_coordination":
      return "hub";
    case "pharmacy":
      return "pharmacy";
    case "callback":
      return "callback";
    case "message_thread":
      return "patient_messages";
    case "support_ticket":
      return "support";
    case "artifact_projection":
      return "artifact";
    case "outbound_communication":
      return "patient_outbound";
  }
}

export function planIdentityRepairImpact(input: {
  repairBasis: IdentityRepairSignalDisposition;
  branches: readonly RepairImpactBranchInput[];
  idGenerator: BackboneIdGenerator;
}): IdentityRepairImpactPlan {
  const branchPlans = input.branches.map((branch) => {
    let requiredDisposition: IdentityRepairRequiredDisposition = "suppress_visibility";
    let initialBranchState: IdentityRepairBranchState = "quarantined";
    let compensationRef: string | null = null;
    if (branch.requiresManualReview) {
      requiredDisposition = "manual_review_only";
    } else if (branch.requiresCompensation || branch.hasExternalSideEffect) {
      requiredDisposition = "compensate_external";
      initialBranchState = "compensation_pending";
      compensationRef = nextIdentityRepairId(input.idGenerator, "identityRepairCompensation");
    } else if (branch.requiresRevalidation || branch.branchType !== "outbound_communication") {
      requiredDisposition = "revalidate_under_new_binding";
    }
    return {
      branchType: branch.branchType,
      governingObjectRef: requireRef(branch.governingObjectRef, "governingObjectRef"),
      audienceRef: optionalRef(branch.audienceRef) ?? defaultAudienceForBranch(branch.branchType),
      requiredDisposition,
      initialBranchState,
      compensationRef,
    } satisfies RepairImpactBranchPlan;
  });
  const communicationsHoldState = branchPlans.some(
    (branch) =>
      branch.branchType === "callback" ||
      branch.branchType === "message_thread" ||
      branch.branchType === "outbound_communication",
  )
    ? "active"
    : "partial";
  const projectionHoldState =
    input.repairBasis === "confirmed_misbinding"
      ? "recovery_only"
      : input.repairBasis === "credible_misbinding"
        ? "read_only"
        : "summary_only";
  return {
    communicationsHoldState,
    projectionHoldState,
    affectedAudienceRefs: uniqueSortedRefs(
      branchPlans.map((branch) => requireRef(branch.audienceRef, "audienceRef")),
    ),
    branchPlans,
    compensationRefs: uniqueSortedRefs(
      branchPlans
        .map((branch) => branch.compensationRef)
        .filter((value): value is string => value !== null),
    ),
  };
}

function routeIntentHookRef(routeIntentRef: string): string {
  return `route_intent_supersession_hook:${routeIntentRef}`;
}

function sessionTerminationHookRef(sessionRef: string): string {
  return `session_termination_hook:${sessionRef}`;
}

function projectionRebuildHookRef(repairCaseId: string): string {
  return `projection_rebuild_request:${repairCaseId}`;
}

function isLiveGrant(snapshot: AccessGrantSnapshot): boolean {
  return snapshot.grantState === "live" || snapshot.grantState === "redeeming";
}

function isRepairCaseActive(state: IdentityRepairCaseState): boolean {
  return state !== "closed";
}

export interface RecordIdentityRepairSignalInput {
  repairSignalId?: string;
  episodeId: string;
  affectedRequestRef: string;
  observedIdentityBindingRef?: string | null;
  observedSessionRef?: string | null;
  observedAccessGrantRef?: string | null;
  observedRouteIntentBindingRef?: string | null;
  signalClass: IdentityRepairSignalClass;
  signalDisposition: IdentityRepairSignalDisposition;
  evidenceRefs: readonly string[];
  reportedBy: string;
  reportedAt: string;
}

export interface RecordIdentityRepairSignalResult {
  signal: IdentityRepairSignalDocument;
  repairCase: IdentityRepairCaseDocument;
  currentFence: LineageFenceDocument;
  reusedExisting: boolean;
  emittedEvents: readonly IdentityRepairReachabilityEventEnvelope[];
}

export interface CommitIdentityRepairFreezeInput {
  repairCaseRef: string;
  affectedBranches: readonly RepairImpactBranchInput[];
  derivativeGrantRefs?: readonly string[];
  supersededRouteIntentBindingRefs?: readonly string[];
  affectedAudienceRefs?: readonly string[];
  communicationsHoldState?: IdentityRepairCommunicationsHoldState;
  projectionHoldState?: IdentityRepairProjectionHoldState;
  activatedAt: string;
}

export interface CommitIdentityRepairFreezeResult {
  repairCase: IdentityRepairCaseDocument;
  freezeRecord: IdentityRepairFreezeRecordDocument;
  branchDispositions: readonly IdentityRepairBranchDispositionDocument[];
  supersededGrantRefs: readonly string[];
  supersessionRecords: readonly AccessGrantSupersessionRecordDocument[];
  supersededRouteIntentBindingRefs: readonly string[];
  currentFence: LineageFenceDocument;
  emittedEvents: readonly IdentityRepairReachabilityEventEnvelope[];
}

export interface SettleIdentityRepairBranchDispositionInput {
  branchDispositionRef: string;
  nextState: Extract<IdentityRepairBranchState, "rebuilt" | "released">;
  compensationRef?: string | null;
  revalidationSettlementRef?: string | null;
  releasedAt: string;
}

export interface MarkIdentityRepairCorrectedInput {
  repairCaseRef: string;
  supervisorApprovalRef: string;
  independentReviewRef: string;
  projectionRebuildRef?: string | null;
  correctedAt: string;
}

export interface SettleIdentityRepairReleaseInput {
  repairCaseRef: string;
  resultingIdentityBindingRef: string;
  replacementAccessGrantRefs?: readonly string[];
  replacementRouteIntentBindingRefs?: readonly string[];
  replacementSessionEstablishmentDecisionRef?: string | null;
  communicationsResumeState: IdentityRepairCommunicationsResumeState;
  releaseMode: IdentityRepairReleaseMode;
  recordedAt: string;
}

export interface IdentityRepairReleaseResult {
  repairCase: IdentityRepairCaseDocument;
  freezeRecord: IdentityRepairFreezeRecordDocument;
  releaseSettlement: IdentityRepairReleaseSettlementDocument;
  currentFence: LineageFenceDocument;
  emittedEvents: readonly IdentityRepairReachabilityEventEnvelope[];
}

export interface IdentityRepairCaseProjection {
  repairCaseId: string;
  episodeId: string;
  affectedRequestRefs: readonly string[];
  repairBasis: IdentityRepairSignalDisposition;
  state: IdentityRepairCaseState;
  lineageFenceEpoch: number;
  freezeState: IdentityRepairFreezeState | null;
  communicationsHoldState: IdentityRepairCommunicationsHoldState | null;
  projectionHoldState: IdentityRepairProjectionHoldState | null;
  affectedAudienceRefs: readonly string[];
  branchStates: readonly {
    branchDispositionId: string;
    branchType: IdentityRepairBranchType;
    governingObjectRef: string;
    requiredDisposition: IdentityRepairRequiredDisposition;
    branchState: IdentityRepairBranchState;
  }[];
  releaseMode: IdentityRepairReleaseMode | null;
  gaps: readonly string[];
}

export function buildIdentityRepairCaseProjection(input: {
  repairCase: IdentityRepairCaseDocument;
  freezeRecord: IdentityRepairFreezeRecordDocument | null;
  branchDispositions: readonly IdentityRepairBranchDispositionDocument[];
  releaseSettlement: IdentityRepairReleaseSettlementDocument | null;
}): IdentityRepairCaseProjection {
  const freezeSnapshot = input.freezeRecord?.toSnapshot() ?? null;
  return {
    repairCaseId: input.repairCase.repairCaseId,
    episodeId: input.repairCase.toSnapshot().episodeId,
    affectedRequestRefs: [...input.repairCase.toSnapshot().affectedRequestRefs],
    repairBasis: input.repairCase.toSnapshot().repairBasis,
    state: input.repairCase.state,
    lineageFenceEpoch: input.repairCase.toSnapshot().lineageFenceEpoch,
    freezeState: freezeSnapshot?.freezeState ?? null,
    communicationsHoldState: freezeSnapshot?.communicationsHoldState ?? null,
    projectionHoldState: freezeSnapshot?.projectionHoldState ?? null,
    affectedAudienceRefs: freezeSnapshot?.affectedAudienceRefs ?? [],
    branchStates: input.branchDispositions.map((branch) => ({
      branchDispositionId: branch.branchDispositionId,
      branchType: branch.toSnapshot().branchType,
      governingObjectRef: branch.toSnapshot().governingObjectRef,
      requiredDisposition: branch.requiredDisposition,
      branchState: branch.branchState,
    })),
    releaseMode: input.releaseSettlement?.releaseMode ?? null,
    gaps: [...identityRepairParallelInterfaceGaps],
  };
}

export interface RouteVerificationCheckpointVerdict {
  checkpointId: string;
  mayResume: boolean;
  routeHealthState: RouteHealthState;
  repairState: ReachabilityRepairState;
  reasonCodes: readonly string[];
}

export function evaluateRouteVerificationCheckpoint(input: {
  checkpoint: ContactRouteVerificationCheckpointDocument;
  assessment: ReachabilityAssessmentRecordDocument;
}): RouteVerificationCheckpointVerdict {
  const checkpoint = input.checkpoint.toSnapshot();
  const assessment = input.assessment.toSnapshot();
  const reasonCodes = new Set<string>();
  if (checkpoint.verificationState !== "verified") {
    reasonCodes.add(`CHECKPOINT_${checkpoint.verificationState.toUpperCase()}`);
  }
  if (checkpoint.rebindState !== "rebound") {
    reasonCodes.add(`REBIND_${checkpoint.rebindState.toUpperCase()}`);
  }
  if (assessment.assessmentState !== "clear") {
    reasonCodes.add(`ASSESSMENT_${assessment.assessmentState.toUpperCase()}`);
  }
  if (assessment.routeAuthorityState !== "current") {
    reasonCodes.add(`ROUTE_AUTHORITY_${assessment.routeAuthorityState.toUpperCase()}`);
  }
  return {
    checkpointId: checkpoint.checkpointId,
    mayResume: reasonCodes.size === 0,
    routeHealthState:
      assessment.assessmentState === "clear"
        ? "clear"
        : assessment.assessmentState === "at_risk"
          ? "degraded"
          : assessment.assessmentState === "blocked"
            ? "blocked"
            : "disputed",
    repairState: assessment.resultingRepairState,
    reasonCodes: [...reasonCodes].sort(),
  };
}

export interface ContactRouteRepairJourneyVerdict {
  repairJourneyId: string;
  sameShellRecoveryActive: boolean;
  blockedActionScopeRefs: readonly AccessGrantActionScope[];
  selectedAnchorRef: string;
  nextAction:
    | "collect_route"
    | "verify_candidate_route"
    | "resume_original_action"
    | "manual_recovery"
    | "stale_restart_required";
}

export function evaluateContactRouteRepairJourney(input: {
  dependency: ReachabilityDependencyDocument;
  journey: ContactRouteRepairJourneyDocument;
  assessment: ReachabilityAssessmentRecordDocument;
  checkpoint?: ContactRouteVerificationCheckpointDocument | null;
}): ContactRouteRepairJourneyVerdict {
  const dependency = input.dependency.toSnapshot();
  const journey = input.journey.toSnapshot();
  const checkpointVerdict =
    input.checkpoint === undefined || input.checkpoint === null
      ? null
      : evaluateRouteVerificationCheckpoint({
          checkpoint: input.checkpoint,
          assessment: input.assessment,
        });
  let nextAction: ContactRouteRepairJourneyVerdict["nextAction"] = "collect_route";
  if (journey.journeyState === "awaiting_verification") {
    nextAction = "verify_candidate_route";
  } else if (
    journey.journeyState === "completed" &&
    checkpointVerdict?.mayResume &&
    dependency.routeHealthState === "clear"
  ) {
    nextAction = "resume_original_action";
  } else if (
    journey.journeyState === "recovery_required" ||
    dependency.routeHealthState === "blocked" ||
    dependency.routeHealthState === "disputed"
  ) {
    nextAction = "manual_recovery";
  } else if (journey.journeyState === "stale") {
    nextAction = "stale_restart_required";
  }
  return {
    repairJourneyId: journey.repairJourneyId,
    sameShellRecoveryActive:
      journey.journeyState !== "completed" && journey.journeyState !== "stale",
    blockedActionScopeRefs: [...journey.blockedActionScopeRefs],
    selectedAnchorRef: journey.selectedAnchorRef,
    nextAction,
  };
}

export class IdentityRepairOrchestratorService {
  private readonly repositories: IdentityRepairDependencies;
  private readonly idGenerator: BackboneIdGenerator;
  private readonly accessGrants: AccessGrantService;

  constructor(repositories: IdentityRepairDependencies, idGenerator: BackboneIdGenerator) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
    this.accessGrants = new AccessGrantService(repositories, idGenerator);
  }

  async initializeRepairFence(input: {
    episodeId: string;
    issuedAt: string;
    initialEpoch?: number;
  }): Promise<LineageFenceDocument> {
    const existing = await this.repositories.getCurrentLineageFenceForEpisode(input.episodeId);
    if (existing) {
      return existing;
    }
    const fence = LineageFenceDocument.create({
      fenceId: nextIdentityRepairId(this.idGenerator, "lineageFence"),
      episodeId: input.episodeId,
      currentEpoch: input.initialEpoch ?? 1,
      issuedFor: "cross_domain_commit",
      issuedAt: input.issuedAt,
      expiresAt: addHours(input.issuedAt, 12),
    });
    await this.repositories.saveLineageFence(fence);
    return fence;
  }

  private async requireCurrentFence(
    episodeId: string,
    recordedAt: string,
  ): Promise<LineageFenceDocument> {
    return (
      (await this.repositories.getCurrentLineageFenceForEpisode(episodeId)) ??
      this.initializeRepairFence({
        episodeId,
        issuedAt: recordedAt,
      })
    );
  }

  private async advanceFence(input: {
    episodeId: string;
    currentFence: LineageFenceDocument;
    issuedAt: string;
    issuedFor: LineageFenceIssuedFor;
  }): Promise<LineageFenceDocument> {
    const nextFence = LineageFenceDocument.create({
      fenceId: nextIdentityRepairId(this.idGenerator, "lineageFence"),
      episodeId: input.episodeId,
      currentEpoch: input.currentFence.toSnapshot().currentEpoch + 1,
      issuedFor: input.issuedFor,
      issuedAt: input.issuedAt,
      expiresAt: addHours(input.issuedAt, 12),
    });
    await this.repositories.saveLineageFence(nextFence);
    return nextFence;
  }

  private async requireRequestScope(input: {
    episodeId: string;
    requestId: string;
  }): Promise<void> {
    const episode = await this.repositories.getEpisode(input.episodeId);
    const request = await this.repositories.getRequest(input.requestId);
    invariant(episode, "EPISODE_NOT_FOUND", `Episode ${input.episodeId} was not found.`);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${input.requestId} was not found.`);
    invariant(
      request.episodeId === input.episodeId,
      "IDENTITY_REPAIR_REQUEST_EPISODE_MISMATCH",
      `Request ${input.requestId} does not belong to episode ${input.episodeId}.`,
    );
  }

  private async appendEvents(
    events: readonly IdentityRepairReachabilityEventEnvelope[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }
    await this.repositories.appendIdentityRepairReachabilityEvents(events);
  }

  async recordSignal(
    input: RecordIdentityRepairSignalInput,
  ): Promise<RecordIdentityRepairSignalResult> {
    await this.requireRequestScope({
      episodeId: input.episodeId,
      requestId: input.affectedRequestRef,
    });
    const request = await this.repositories.getRequest(input.affectedRequestRef);
    const episode = await this.repositories.getEpisode(input.episodeId);
    invariant(request && episode, "IDENTITY_REPAIR_SCOPE_MISSING", "Repair scope is missing.");
    const currentFence = await this.requireCurrentFence(input.episodeId, input.reportedAt);
    const observedIdentityBindingRef =
      optionalRef(input.observedIdentityBindingRef) ??
      request.toSnapshot().currentIdentityBindingRef ??
      episode.toSnapshot().currentIdentityBindingRef;
    invariant(
      observedIdentityBindingRef !== null,
      "IDENTITY_REPAIR_BINDING_REQUIRED",
      "Wrong-patient repair requires a durable observedIdentityBindingRef.",
    );

    const digest = signalDigest({
      episodeId: input.episodeId,
      affectedRequestRef: input.affectedRequestRef,
      observedIdentityBindingRef,
      observedSessionRef: input.observedSessionRef ?? null,
      observedAccessGrantRef: input.observedAccessGrantRef ?? null,
      observedRouteIntentBindingRef: input.observedRouteIntentBindingRef ?? null,
      signalClass: input.signalClass,
      signalDisposition: input.signalDisposition,
      evidenceRefs: input.evidenceRefs,
      openedRepairCaseRef: null,
      reportedBy: input.reportedBy,
      reportedAt: input.reportedAt,
    });
    const existingByDigest = await this.repositories.findIdentityRepairSignalByDigest(digest);
    if (existingByDigest) {
      invariant(
        existingByDigest.openedRepairCaseRef,
        "IDENTITY_REPAIR_SIGNAL_CASE_POINTER_DRIFT",
        `Signal ${existingByDigest.repairSignalId} is missing openedRepairCaseRef.`,
      );
      const existingCase = await this.repositories.getIdentityRepairCase(
        existingByDigest.openedRepairCaseRef,
      );
      invariant(
        existingCase,
        "IDENTITY_REPAIR_CASE_NOT_FOUND",
        `Repair case ${existingByDigest.openedRepairCaseRef} was not found.`,
      );
      return {
        signal: existingByDigest,
        repairCase: existingCase,
        currentFence,
        reusedExisting: true,
        emittedEvents: [],
      };
    }

    const binding = await this.repositories.getIdentityBinding(observedIdentityBindingRef);
    invariant(
      binding,
      "IDENTITY_REPAIR_BINDING_NOT_FOUND",
      `IdentityBinding ${observedIdentityBindingRef} was not found.`,
    );
    const bindingSnapshot = binding.toSnapshot();
    let repairCase =
      (await this.repositories.findActiveIdentityRepairCaseForBinding(
        observedIdentityBindingRef,
      )) ?? null;
    const events: IdentityRepairReachabilityEventEnvelope[] = [];
    if (repairCase === null) {
      repairCase = IdentityRepairCaseDocument.create({
        repairCaseId: nextIdentityRepairId(this.idGenerator, "identityRepairCase"),
        episodeId: input.episodeId,
        affectedRequestRefs: [input.affectedRequestRef],
        openedSignalRefs: [],
        frozenIdentityBindingRef: observedIdentityBindingRef,
        frozenSubjectRef: bindingSnapshot.subjectRef,
        frozenPatientRef: bindingSnapshot.patientRef,
        suspectedWrongBindingRef: bindingSnapshot.patientRef,
        repairBasis: input.signalDisposition,
        lineageFenceEpoch: currentFence.toSnapshot().currentEpoch,
        state: "opened",
        openedBy: input.reportedBy,
        supervisorApprovalRef: null,
        independentReviewRef: null,
        freezeRecordRef: null,
        projectionRebuildRef: null,
        downstreamDispositionRefs: [],
        compensationRefs: [],
        releaseSettlementRef: null,
        createdAt: input.reportedAt,
        updatedAt: input.reportedAt,
      });
      await this.repositories.saveIdentityRepairCase(repairCase);
      events.push(
        emitRepairEvent("identity.repair_case.opened", input.reportedAt, {
          repairCaseId: repairCase.repairCaseId,
          episodeId: input.episodeId,
          requestId: input.affectedRequestRef,
          frozenIdentityBindingRef: observedIdentityBindingRef,
          repairBasis: input.signalDisposition,
          lineageFenceEpoch: currentFence.toSnapshot().currentEpoch,
        }),
      );
    }

    const signal = IdentityRepairSignalDocument.create({
      repairSignalId:
        optionalRef(input.repairSignalId) ??
        nextIdentityRepairId(this.idGenerator, "identityRepairSignal"),
      episodeId: input.episodeId,
      affectedRequestRef: input.affectedRequestRef,
      observedIdentityBindingRef,
      observedSessionRef: input.observedSessionRef ?? null,
      observedAccessGrantRef: input.observedAccessGrantRef ?? null,
      observedRouteIntentBindingRef: input.observedRouteIntentBindingRef ?? null,
      signalClass: input.signalClass,
      signalDisposition: input.signalDisposition,
      evidenceRefs: input.evidenceRefs,
      openedRepairCaseRef: repairCase.repairCaseId,
      reportedBy: input.reportedBy,
      reportedAt: input.reportedAt,
    });
    await this.repositories.saveIdentityRepairSignal(signal);
    await this.repositories.saveIdentityRepairCase(
      repairCase.addSignal({
        signalRef: signal.repairSignalId,
        repairBasis: input.signalDisposition,
        updatedAt: input.reportedAt,
      }),
      { expectedVersion: repairCase.version },
    );
    repairCase = (await this.repositories.getIdentityRepairCase(repairCase.repairCaseId))!;
    events.push(
      emitRepairEvent("identity.repair_signal.recorded", input.reportedAt, {
        repairSignalId: signal.repairSignalId,
        repairCaseId: repairCase.repairCaseId,
        signalClass: input.signalClass,
        signalDisposition: input.signalDisposition,
        observedIdentityBindingRef,
      }),
    );
    await this.appendEvents(events);
    return {
      signal,
      repairCase,
      currentFence,
      reusedExisting: false,
      emittedEvents: events,
    };
  }

  private async applyRepairBlockers(
    repairCase: IdentityRepairCaseDocument,
    updatedAt: string,
  ): Promise<void> {
    const caseId = repairCase.repairCaseId;
    const repairSnapshot = repairCase.toSnapshot();
    const episode = await this.repositories.getEpisode(repairSnapshot.episodeId);
    invariant(episode, "EPISODE_NOT_FOUND", `Episode ${repairSnapshot.episodeId} was not found.`);
    const nextEpisode = episode.refreshOperationalRefs({
      activeIdentityRepairCaseRef: caseId,
      currentClosureBlockerRefs: uniqueSortedRefs([
        ...episode.toSnapshot().currentClosureBlockerRefs,
        caseId,
      ]),
      updatedAt,
    });
    await this.repositories.saveEpisode(nextEpisode, {
      expectedVersion: episode.version,
    });
    for (const requestId of repairSnapshot.affectedRequestRefs) {
      const request = await this.repositories.getRequest(requestId);
      invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} was not found.`);
      const requestSnapshot = request.toSnapshot();
      const nextRequest = request.refreshLineageSummary({
        latestLineageCaseLinkRef: requestSnapshot.latestLineageCaseLinkRef,
        activeLineageCaseLinkRefs: requestSnapshot.activeLineageCaseLinkRefs,
        currentClosureBlockerRefs: uniqueSortedRefs([
          ...requestSnapshot.currentClosureBlockerRefs,
          caseId,
        ]),
        currentConfirmationGateRefs: requestSnapshot.currentConfirmationGateRefs,
        updatedAt,
      });
      await this.repositories.saveRequest(nextRequest, {
        expectedVersion: request.version,
      });
    }
  }

  private async clearRepairBlockers(
    repairCase: IdentityRepairCaseDocument,
    updatedAt: string,
  ): Promise<void> {
    const caseId = repairCase.repairCaseId;
    const repairSnapshot = repairCase.toSnapshot();
    const episode = await this.repositories.getEpisode(repairSnapshot.episodeId);
    invariant(episode, "EPISODE_NOT_FOUND", `Episode ${repairSnapshot.episodeId} was not found.`);
    const nextEpisode = episode.refreshOperationalRefs({
      activeIdentityRepairCaseRef:
        episode.toSnapshot().activeIdentityRepairCaseRef === caseId
          ? null
          : episode.toSnapshot().activeIdentityRepairCaseRef,
      currentClosureBlockerRefs: episode
        .toSnapshot()
        .currentClosureBlockerRefs.filter((value) => value !== caseId),
      updatedAt,
    });
    await this.repositories.saveEpisode(nextEpisode, {
      expectedVersion: episode.version,
    });
    for (const requestId of repairSnapshot.affectedRequestRefs) {
      const request = await this.repositories.getRequest(requestId);
      invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} was not found.`);
      const requestSnapshot = request.toSnapshot();
      const nextRequest = request.refreshLineageSummary({
        latestLineageCaseLinkRef: requestSnapshot.latestLineageCaseLinkRef,
        activeLineageCaseLinkRefs: requestSnapshot.activeLineageCaseLinkRefs,
        currentClosureBlockerRefs: requestSnapshot.currentClosureBlockerRefs.filter(
          (value) => value !== caseId,
        ),
        currentConfirmationGateRefs: requestSnapshot.currentConfirmationGateRefs,
        updatedAt,
      });
      await this.repositories.saveRequest(nextRequest, {
        expectedVersion: request.version,
      });
    }
  }

  private async collectImpactedGrantRefs(
    repairCase: IdentityRepairCaseDocument,
    inputGrantRefs: readonly string[],
  ): Promise<readonly string[]> {
    const repairSnapshot = repairCase.toSnapshot();
    const grants = await this.repositories.listAccessGrants();
    const impacted = grants
      .map((grant) => grant.toSnapshot())
      .filter(
        (grant) =>
          isLiveGrant(grant) &&
          (grant.issuedIdentityBindingRef === repairSnapshot.frozenIdentityBindingRef ||
            grant.subjectRef === repairSnapshot.frozenSubjectRef ||
            (repairSnapshot.frozenPatientRef !== null &&
              grant.boundPatientRef === repairSnapshot.frozenPatientRef)),
      )
      .map((grant) => grant.grantId);
    return uniqueSortedRefs([...inputGrantRefs, ...impacted]);
  }

  private async collectSupersededRouteIntentRefs(
    repairCase: IdentityRepairCaseDocument,
    impactedGrantRefs: readonly string[],
    explicitRouteIntentRefs: readonly string[],
  ): Promise<readonly string[]> {
    const signals = await this.repositories.listIdentityRepairSignalsForCase(
      repairCase.repairCaseId,
    );
    const grants = await Promise.all(
      impactedGrantRefs.map((grantRef) => this.repositories.getAccessGrant(grantRef)),
    );
    return uniqueSortedRefs([
      ...explicitRouteIntentRefs,
      ...signals
        .map((signal) => signal.toSnapshot().observedRouteIntentBindingRef)
        .filter((value): value is string => value !== null),
      ...grants
        .map((grant) => grant?.toSnapshot().issuedRouteIntentBindingRef ?? null)
        .filter((value): value is string => value !== null),
    ]).map(routeIntentHookRef);
  }

  async commitFreeze(
    input: CommitIdentityRepairFreezeInput,
  ): Promise<CommitIdentityRepairFreezeResult> {
    const repairCase = await this.repositories.getIdentityRepairCase(input.repairCaseRef);
    invariant(
      repairCase,
      "IDENTITY_REPAIR_CASE_NOT_FOUND",
      `IdentityRepairCase ${input.repairCaseRef} was not found.`,
    );
    if (repairCase.freezeRecordRef) {
      const existingFreeze = await this.repositories.getIdentityRepairFreezeRecord(
        repairCase.freezeRecordRef,
      );
      invariant(
        existingFreeze,
        "IDENTITY_REPAIR_FREEZE_NOT_FOUND",
        `IdentityRepairFreezeRecord ${repairCase.freezeRecordRef} was not found.`,
      );
      const existingBranches = await this.repositories.listIdentityRepairBranchDispositionsForCase(
        repairCase.repairCaseId,
      );
      const currentFence = await this.requireCurrentFence(
        repairCase.toSnapshot().episodeId,
        input.activatedAt,
      );
      return {
        repairCase,
        freezeRecord: existingFreeze,
        branchDispositions: existingBranches,
        supersededGrantRefs: [],
        supersessionRecords: [],
        supersededRouteIntentBindingRefs:
          existingFreeze.toSnapshot().supersededRouteIntentBindingRefs,
        currentFence,
        emittedEvents: [],
      };
    }

    const currentFence = await this.requireCurrentFence(
      repairCase.toSnapshot().episodeId,
      input.activatedAt,
    );
    const nextFence = await this.advanceFence({
      episodeId: repairCase.toSnapshot().episodeId,
      currentFence,
      issuedAt: input.activatedAt,
      issuedFor: "identity_repair",
    });
    const impactedGrantRefs = await this.collectImpactedGrantRefs(
      repairCase,
      input.derivativeGrantRefs ?? [],
    );
    const supersessionRecords: AccessGrantSupersessionRecordDocument[] = [];
    for (const grantRef of impactedGrantRefs) {
      const revokeResult = await this.accessGrants.revokeGrant({
        grantRef,
        governingObjectRef: repairCase.repairCaseId,
        lineageFenceEpoch: nextFence.toSnapshot().currentEpoch,
        causeClass: "identity_repair",
        reasonCodes: ["IDENTITY_REPAIR_FREEZE_ACTIVE"],
        recordedAt: input.activatedAt,
      });
      supersessionRecords.push(revokeResult.supersession);
    }

    const impactPlan = planIdentityRepairImpact({
      repairBasis: repairCase.toSnapshot().repairBasis,
      branches: input.affectedBranches,
      idGenerator: this.idGenerator,
    });
    const supersededRouteIntentBindingRefs = await this.collectSupersededRouteIntentRefs(
      repairCase,
      impactedGrantRefs,
      input.supersededRouteIntentBindingRefs ?? [],
    );
    const signals = await this.repositories.listIdentityRepairSignalsForCase(
      repairCase.repairCaseId,
    );
    const sessionTerminationSettlementRefs = uniqueSortedRefs(
      signals
        .map((signal) => signal.toSnapshot().observedSessionRef)
        .filter((value): value is string => value !== null)
        .map(sessionTerminationHookRef),
    );

    const branchDispositions: IdentityRepairBranchDispositionDocument[] = [];
    for (const plan of impactPlan.branchPlans) {
      const branchDisposition = IdentityRepairBranchDispositionDocument.create({
        branchDispositionId: nextIdentityRepairId(
          this.idGenerator,
          "identityRepairBranchDisposition",
        ),
        identityRepairCaseRef: repairCase.repairCaseId,
        branchType: plan.branchType,
        governingObjectRef: plan.governingObjectRef,
        frozenIdentityBindingRef: repairCase.toSnapshot().frozenIdentityBindingRef,
        requiredDisposition: plan.requiredDisposition,
        compensationRef: plan.compensationRef,
        revalidationSettlementRef: null,
        branchState: plan.initialBranchState,
        releasedAt: null,
      });
      await this.repositories.saveIdentityRepairBranchDisposition(branchDisposition);
      branchDispositions.push(branchDisposition);
    }

    const freezeRecord = IdentityRepairFreezeRecordDocument.create({
      freezeRecordId: nextIdentityRepairId(this.idGenerator, "identityRepairFreezeRecord"),
      identityRepairCaseRef: repairCase.repairCaseId,
      frozenIdentityBindingRef: repairCase.toSnapshot().frozenIdentityBindingRef,
      lineageFenceEpoch: nextFence.toSnapshot().currentEpoch,
      sessionTerminationSettlementRefs,
      accessGrantSupersessionRefs: supersessionRecords.map(
        (supersession) => supersession.supersessionId,
      ),
      supersededRouteIntentBindingRefs,
      communicationsHoldState: input.communicationsHoldState ?? impactPlan.communicationsHoldState,
      projectionHoldState: input.projectionHoldState ?? impactPlan.projectionHoldState,
      affectedAudienceRefs: uniqueSortedRefs([
        ...(input.affectedAudienceRefs ?? []),
        ...impactPlan.affectedAudienceRefs,
      ]),
      freezeState: "active",
      activatedAt: input.activatedAt,
      releasedAt: null,
    });
    await this.repositories.saveIdentityRepairFreezeRecord(freezeRecord);
    const updatedCase = repairCase.commitFreeze({
      freezeRecordRef: freezeRecord.freezeRecordId,
      lineageFenceEpoch: nextFence.toSnapshot().currentEpoch,
      downstreamDispositionRefs: branchDispositions.map((branch) => branch.branchDispositionId),
      compensationRefs: impactPlan.compensationRefs,
      updatedAt: input.activatedAt,
    });
    await this.repositories.saveIdentityRepairCase(updatedCase, {
      expectedVersion: repairCase.version,
    });
    await this.applyRepairBlockers(updatedCase, input.activatedAt);

    const events = [
      emitRepairEvent("identity.repair_case.freeze_committed", input.activatedAt, {
        repairCaseId: updatedCase.repairCaseId,
        freezeRecordId: freezeRecord.freezeRecordId,
        lineageFenceEpoch: nextFence.toSnapshot().currentEpoch,
        accessGrantSupersessionRefs: freezeRecord.toSnapshot().accessGrantSupersessionRefs,
        supersededRouteIntentBindingRefs:
          freezeRecord.toSnapshot().supersededRouteIntentBindingRefs,
        affectedAudienceRefs: freezeRecord.toSnapshot().affectedAudienceRefs,
      }),
      ...branchDispositions.map((branch) =>
        emitRepairEvent("identity.repair_branch.quarantined", input.activatedAt, {
          repairCaseId: updatedCase.repairCaseId,
          branchDispositionId: branch.branchDispositionId,
          branchType: branch.toSnapshot().branchType,
          governingObjectRef: branch.toSnapshot().governingObjectRef,
          requiredDisposition: branch.requiredDisposition,
          branchState: branch.branchState,
        }),
      ),
    ];
    await this.appendEvents(events);
    return {
      repairCase: updatedCase,
      freezeRecord,
      branchDispositions,
      supersededGrantRefs: impactedGrantRefs,
      supersessionRecords,
      supersededRouteIntentBindingRefs,
      currentFence: nextFence,
      emittedEvents: events,
    };
  }

  async settleBranchDisposition(
    input: SettleIdentityRepairBranchDispositionInput,
  ): Promise<IdentityRepairBranchDispositionDocument> {
    const branchDisposition = await this.repositories.getIdentityRepairBranchDisposition(
      input.branchDispositionRef,
    );
    invariant(
      branchDisposition,
      "IDENTITY_REPAIR_BRANCH_DISPOSITION_NOT_FOUND",
      `IdentityRepairBranchDisposition ${input.branchDispositionRef} was not found.`,
    );
    const updated =
      input.nextState === "rebuilt"
        ? branchDisposition.rebuild({
            revalidationSettlementRef: requireRef(
              input.revalidationSettlementRef,
              "revalidationSettlementRef",
            ),
          })
        : branchDisposition.release({
            compensationRef: input.compensationRef ?? null,
            revalidationSettlementRef: input.revalidationSettlementRef ?? null,
            releasedAt: input.releasedAt,
          });
    await this.repositories.saveIdentityRepairBranchDisposition(updated, {
      expectedVersion: branchDisposition.version,
    });
    return updated;
  }

  async markCorrected(
    input: MarkIdentityRepairCorrectedInput,
  ): Promise<IdentityRepairCaseDocument> {
    const repairCase = await this.repositories.getIdentityRepairCase(input.repairCaseRef);
    invariant(
      repairCase,
      "IDENTITY_REPAIR_CASE_NOT_FOUND",
      `IdentityRepairCase ${input.repairCaseRef} was not found.`,
    );
    let updatedCase = repairCase.markCorrectionAuthorityPending({
      supervisorApprovalRef: input.supervisorApprovalRef,
      independentReviewRef: input.independentReviewRef,
      updatedAt: input.correctedAt,
    });
    await this.repositories.saveIdentityRepairCase(updatedCase, {
      expectedVersion: repairCase.version,
    });
    const corrected = updatedCase.markCorrected({
      projectionRebuildRef:
        input.projectionRebuildRef ?? projectionRebuildHookRef(updatedCase.repairCaseId),
      updatedAt: input.correctedAt,
    });
    await this.repositories.saveIdentityRepairCase(corrected, {
      expectedVersion: updatedCase.version,
    });
    updatedCase = corrected;
    await this.appendEvents([
      emitRepairEvent("identity.repair_case.corrected", input.correctedAt, {
        repairCaseId: updatedCase.repairCaseId,
        projectionRebuildRef: updatedCase.toSnapshot().projectionRebuildRef,
        supervisorApprovalRef: updatedCase.toSnapshot().supervisorApprovalRef,
        independentReviewRef: updatedCase.toSnapshot().independentReviewRef,
      }),
    ]);
    return updatedCase;
  }

  private releaseReady(branch: IdentityRepairBranchDispositionDocument): boolean {
    if (branch.branchState === "released") {
      return (
        branch.requiredDisposition !== "compensate_external" || branch.compensationRef !== null
      );
    }
    if (branch.requiredDisposition === "revalidate_under_new_binding") {
      return branch.branchState === "rebuilt";
    }
    return false;
  }

  async settleRelease(
    input: SettleIdentityRepairReleaseInput,
  ): Promise<IdentityRepairReleaseResult> {
    const repairCase = await this.repositories.getIdentityRepairCase(input.repairCaseRef);
    invariant(
      repairCase,
      "IDENTITY_REPAIR_CASE_NOT_FOUND",
      `IdentityRepairCase ${input.repairCaseRef} was not found.`,
    );
    invariant(
      repairCase.freezeRecordRef !== null,
      "IDENTITY_REPAIR_FREEZE_REQUIRED",
      "IdentityRepairReleaseSettlement requires an active freeze record.",
    );
    const freezeRecord = await this.repositories.getIdentityRepairFreezeRecord(
      repairCase.freezeRecordRef,
    );
    invariant(
      freezeRecord,
      "IDENTITY_REPAIR_FREEZE_NOT_FOUND",
      `IdentityRepairFreezeRecord ${repairCase.freezeRecordRef} was not found.`,
    );
    const branchDispositions = await this.repositories.listIdentityRepairBranchDispositionsForCase(
      repairCase.repairCaseId,
    );
    invariant(
      branchDispositions.every((branch) => this.releaseReady(branch)),
      "IDENTITY_REPAIR_BRANCH_RELEASE_NOT_READY",
      "Every IdentityRepairBranchDisposition must be rebuilt or released before repair release settles.",
    );
    const currentFence = await this.requireCurrentFence(
      repairCase.toSnapshot().episodeId,
      input.recordedAt,
    );
    const releasePending = repairCase.markReleasePending({ updatedAt: input.recordedAt });
    await this.repositories.saveIdentityRepairCase(releasePending, {
      expectedVersion: repairCase.version,
    });
    const releaseSettlement = IdentityRepairReleaseSettlementDocument.create({
      releaseSettlementId: nextIdentityRepairId(
        this.idGenerator,
        "identityRepairReleaseSettlement",
      ),
      identityRepairCaseRef: repairCase.repairCaseId,
      resultingIdentityBindingRef: input.resultingIdentityBindingRef,
      freezeRecordRef: freezeRecord.freezeRecordId,
      downstreamDispositionRefs: branchDispositions.map((branch) => branch.branchDispositionId),
      projectionRebuildRef:
        releasePending.toSnapshot().projectionRebuildRef ??
        projectionRebuildHookRef(repairCase.repairCaseId),
      replacementAccessGrantRefs: input.replacementAccessGrantRefs ?? [],
      replacementRouteIntentBindingRefs: input.replacementRouteIntentBindingRefs ?? [],
      replacementSessionEstablishmentDecisionRef:
        input.replacementSessionEstablishmentDecisionRef ?? null,
      communicationsResumeState: input.communicationsResumeState,
      releaseMode: input.releaseMode,
      recordedAt: input.recordedAt,
    });
    await this.repositories.saveIdentityRepairReleaseSettlement(releaseSettlement);
    const releasedFreeze = freezeRecord.release({
      communicationsHoldState: "released",
      releasedAt: input.recordedAt,
    });
    await this.repositories.saveIdentityRepairFreezeRecord(releasedFreeze, {
      expectedVersion: freezeRecord.version,
    });
    const closedCase = releasePending.close({
      releaseSettlementRef: releaseSettlement.releaseSettlementId,
      updatedAt: input.recordedAt,
    });
    await this.repositories.saveIdentityRepairCase(closedCase, {
      expectedVersion: releasePending.version,
    });
    await this.clearRepairBlockers(closedCase, input.recordedAt);
    const nextFence = await this.advanceFence({
      episodeId: repairCase.toSnapshot().episodeId,
      currentFence,
      issuedAt: input.recordedAt,
      issuedFor: "cross_domain_commit",
    });
    const events = [
      emitRepairEvent("identity.repair_release.settled", input.recordedAt, {
        repairCaseId: closedCase.repairCaseId,
        releaseSettlementId: releaseSettlement.releaseSettlementId,
        resultingIdentityBindingRef: input.resultingIdentityBindingRef,
        releaseMode: input.releaseMode,
        lineageFenceEpoch: nextFence.toSnapshot().currentEpoch,
      }),
      emitRepairEvent("identity.repair_case.closed", input.recordedAt, {
        repairCaseId: closedCase.repairCaseId,
        releaseSettlementId: releaseSettlement.releaseSettlementId,
      }),
    ];
    await this.appendEvents(events);
    return {
      repairCase: closedCase,
      freezeRecord: releasedFreeze,
      releaseSettlement,
      currentFence: nextFence,
      emittedEvents: events,
    };
  }

  async describeRepairCase(repairCaseRef: string): Promise<IdentityRepairCaseProjection> {
    const repairCase = await this.repositories.getIdentityRepairCase(repairCaseRef);
    invariant(
      repairCase,
      "IDENTITY_REPAIR_CASE_NOT_FOUND",
      `IdentityRepairCase ${repairCaseRef} was not found.`,
    );
    const freezeRecord =
      repairCase.freezeRecordRef === null
        ? null
        : ((await this.repositories.getIdentityRepairFreezeRecord(repairCase.freezeRecordRef)) ??
          null);
    const releaseSettlement =
      repairCase.releaseSettlementRef === null
        ? null
        : ((await this.repositories.getIdentityRepairReleaseSettlement(
            repairCase.releaseSettlementRef,
          )) ?? null);
    const branchDispositions = await this.repositories.listIdentityRepairBranchDispositionsForCase(
      repairCase.repairCaseId,
    );
    return buildIdentityRepairCaseProjection({
      repairCase,
      freezeRecord,
      branchDispositions,
      releaseSettlement,
    });
  }
}

export function createIdentityRepairOrchestratorService(
  repositories: IdentityRepairDependencies,
  idGenerator: BackboneIdGenerator,
): IdentityRepairOrchestratorService {
  return new IdentityRepairOrchestratorService(repositories, idGenerator);
}

export interface IdentityRepairReachabilitySimulationScenario {
  scenarioId: string;
  title: string;
  repairCase: IdentityRepairCaseProjection;
  freezeRecord: IdentityRepairFreezeRecord;
  releaseSettlement: IdentityRepairReleaseSettlement | null;
  reachabilityJourney: ContactRouteRepairJourneyVerdict | null;
  routeVerificationVerdict: RouteVerificationCheckpointVerdict | null;
  currentFenceEpoch: number;
  eventNames: readonly IdentityRepairReachabilityEventName[];
}

export class IdentityRepairSimulationHarness {
  private readonly repositories: IdentityRepairDependencies;
  private readonly repair: IdentityRepairOrchestratorService;

  constructor(repositories: IdentityRepairDependencies, repair: IdentityRepairOrchestratorService) {
    this.repositories = repositories;
    this.repair = repair;
  }

  async runScenario(input: {
    scenarioId: string;
    title: string;
    signal: RecordIdentityRepairSignalInput;
    freeze: CommitIdentityRepairFreezeInput;
    correction: MarkIdentityRepairCorrectedInput;
    release: SettleIdentityRepairReleaseInput;
    reachability?: {
      dependency: ReachabilityDependencyDocument;
      journey: ContactRouteRepairJourneyDocument;
      assessment: ReachabilityAssessmentRecordDocument;
      checkpoint?: ContactRouteVerificationCheckpointDocument | null;
    };
  }): Promise<IdentityRepairReachabilitySimulationScenario> {
    await this.repair.initializeRepairFence({
      episodeId: input.signal.episodeId,
      issuedAt: input.signal.reportedAt,
    });
    const opened = await this.repair.recordSignal(input.signal);
    const frozen = await this.repair.commitFreeze({
      ...input.freeze,
      repairCaseRef: opened.repairCase.repairCaseId,
    });
    await this.repair.markCorrected({
      ...input.correction,
      repairCaseRef: opened.repairCase.repairCaseId,
    });
    for (const branch of frozen.branchDispositions) {
      if (branch.requiredDisposition === "revalidate_under_new_binding") {
        await this.repair.settleBranchDisposition({
          branchDispositionRef: branch.branchDispositionId,
          nextState: "rebuilt",
          revalidationSettlementRef: `simulation_revalidation:${branch.branchDispositionId}`,
          releasedAt: input.release.recordedAt,
        });
        continue;
      }
      await this.repair.settleBranchDisposition({
        branchDispositionRef: branch.branchDispositionId,
        nextState: "released",
        compensationRef:
          branch.requiredDisposition === "compensate_external"
            ? `simulation_compensation:${branch.branchDispositionId}`
            : null,
        releasedAt: input.release.recordedAt,
      });
    }
    const release = await this.repair.settleRelease({
      ...input.release,
      repairCaseRef: opened.repairCase.repairCaseId,
    });
    const projection = await this.repair.describeRepairCase(opened.repairCase.repairCaseId);
    const freezeRecord = release.freezeRecord.toSnapshot();
    const routeVerificationVerdict =
      input.reachability?.checkpoint && input.reachability?.assessment
        ? evaluateRouteVerificationCheckpoint({
            checkpoint: input.reachability.checkpoint,
            assessment: input.reachability.assessment,
          })
        : null;
    const reachabilityJourney =
      input.reachability === undefined
        ? null
        : evaluateContactRouteRepairJourney({
            dependency: input.reachability.dependency,
            journey: input.reachability.journey,
            assessment: input.reachability.assessment,
            checkpoint: input.reachability.checkpoint,
          });
    const events = await this.repositories.listIdentityRepairReachabilityEvents();
    return {
      scenarioId: input.scenarioId,
      title: input.title,
      repairCase: projection,
      freezeRecord,
      releaseSettlement: release.releaseSettlement.toSnapshot(),
      reachabilityJourney,
      routeVerificationVerdict,
      currentFenceEpoch: release.currentFence.toSnapshot().currentEpoch,
      eventNames: events.map((event) => event.eventName),
    };
  }
}

export function createIdentityRepairSimulationHarness(
  repositories: IdentityRepairDependencies,
  repair: IdentityRepairOrchestratorService,
): IdentityRepairSimulationHarness {
  return new IdentityRepairSimulationHarness(repositories, repair);
}

export interface IdentityRepairLedgerIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  reference: string;
}

export async function validateIdentityRepairLedgerState(
  repositories: IdentityRepairDependencies,
): Promise<readonly IdentityRepairLedgerIssue[]> {
  const issues: IdentityRepairLedgerIssue[] = [];
  const repairCases = await repositories.listIdentityRepairCases();
  const repairSignals = await repositories.listIdentityRepairSignals();
  const freezes = await repositories.listIdentityRepairFreezeRecords();
  const branches = await repositories.listIdentityRepairBranchDispositions();
  const releases = await repositories.listIdentityRepairReleaseSettlements();

  const repairCasesById = new Map(
    repairCases.map((repairCase) => [repairCase.repairCaseId, repairCase]),
  );
  const freezesById = new Map(freezes.map((freeze) => [freeze.freezeRecordId, freeze]));
  const releasesById = new Map(releases.map((release) => [release.releaseSettlementId, release]));

  for (const signal of repairSignals) {
    const snapshot = signal.toSnapshot();
    if (snapshot.openedRepairCaseRef === null) {
      issues.push({
        code: "IDENTITY_REPAIR_SIGNAL_WITHOUT_CASE",
        severity: "error",
        message: "IdentityRepairSignal must reference its opened or reused repair case.",
        reference: `repairSignal:${snapshot.repairSignalId}`,
      });
      continue;
    }
    if (!repairCasesById.has(snapshot.openedRepairCaseRef)) {
      issues.push({
        code: "IDENTITY_REPAIR_SIGNAL_CASE_MISSING",
        severity: "error",
        message: "IdentityRepairSignal references a missing IdentityRepairCase.",
        reference: `repairSignal:${snapshot.repairSignalId}`,
      });
    }
  }

  for (const repairCase of repairCases) {
    const snapshot = repairCase.toSnapshot();
    if (snapshot.freezeRecordRef && !freezesById.has(snapshot.freezeRecordRef)) {
      issues.push({
        code: "IDENTITY_REPAIR_CASE_FREEZE_MISSING",
        severity: "error",
        message: "IdentityRepairCase references a missing IdentityRepairFreezeRecord.",
        reference: `repairCase:${snapshot.repairCaseId}`,
      });
    }
    if (snapshot.releaseSettlementRef && !releasesById.has(snapshot.releaseSettlementRef)) {
      issues.push({
        code: "IDENTITY_REPAIR_CASE_RELEASE_MISSING",
        severity: "error",
        message: "IdentityRepairCase references a missing IdentityRepairReleaseSettlement.",
        reference: `repairCase:${snapshot.repairCaseId}`,
      });
    }
    if (isRepairCaseActive(snapshot.state) && snapshot.releaseSettlementRef !== null) {
      issues.push({
        code: "IDENTITY_REPAIR_ACTIVE_CASE_HAS_RELEASE",
        severity: "warning",
        message: "An active IdentityRepairCase should not yet point at a release settlement.",
        reference: `repairCase:${snapshot.repairCaseId}`,
      });
    }
  }

  for (const freeze of freezes) {
    const snapshot = freeze.toSnapshot();
    if (!repairCasesById.has(snapshot.identityRepairCaseRef)) {
      issues.push({
        code: "IDENTITY_REPAIR_FREEZE_CASE_MISSING",
        severity: "error",
        message: "IdentityRepairFreezeRecord references a missing IdentityRepairCase.",
        reference: `freeze:${snapshot.freezeRecordId}`,
      });
    }
    if (snapshot.freezeState === "released" && snapshot.communicationsHoldState !== "released") {
      issues.push({
        code: "IDENTITY_REPAIR_FREEZE_RELEASE_STATE_DRIFT",
        severity: "error",
        message: "Released IdentityRepairFreezeRecord must also release communications hold.",
        reference: `freeze:${snapshot.freezeRecordId}`,
      });
    }
  }

  for (const branch of branches) {
    const snapshot = branch.toSnapshot();
    if (!repairCasesById.has(snapshot.identityRepairCaseRef)) {
      issues.push({
        code: "IDENTITY_REPAIR_BRANCH_CASE_MISSING",
        severity: "error",
        message: "IdentityRepairBranchDisposition references a missing IdentityRepairCase.",
        reference: `branch:${snapshot.branchDispositionId}`,
      });
    }
    if (
      snapshot.requiredDisposition === "compensate_external" &&
      snapshot.compensationRef === null
    ) {
      issues.push({
        code: "IDENTITY_REPAIR_BRANCH_COMPENSATION_REQUIRED",
        severity: "warning",
        message: "Compensating branches should hold a compensationRef.",
        reference: `branch:${snapshot.branchDispositionId}`,
      });
    }
  }

  for (const release of releases) {
    const snapshot = release.toSnapshot();
    const repairCase = repairCasesById.get(snapshot.identityRepairCaseRef);
    if (!repairCase) {
      issues.push({
        code: "IDENTITY_REPAIR_RELEASE_CASE_MISSING",
        severity: "error",
        message: "IdentityRepairReleaseSettlement references a missing IdentityRepairCase.",
        reference: `release:${snapshot.releaseSettlementId}`,
      });
      continue;
    }
    if (repairCase.toSnapshot().state !== "closed") {
      issues.push({
        code: "IDENTITY_REPAIR_RELEASE_CASE_NOT_CLOSED",
        severity: "error",
        message: "Release settlement exists but the case is not yet closed.",
        reference: `release:${snapshot.releaseSettlementId}`,
      });
    }
    if (!freezesById.has(snapshot.freezeRecordRef)) {
      issues.push({
        code: "IDENTITY_REPAIR_RELEASE_FREEZE_MISSING",
        severity: "error",
        message: "IdentityRepairReleaseSettlement references a missing freeze record.",
        reference: `release:${snapshot.releaseSettlementId}`,
      });
    }
  }

  return issues;
}

async function seedIdentityRepairSimulationScope(seed: string): Promise<{
  repositories: IdentityRepairDependencies;
  repair: IdentityRepairOrchestratorService;
  governor: ReturnType<typeof createReachabilityGovernorService>;
  episode: EpisodeAggregate;
  request: RequestAggregate;
  bindingRef: string;
  bookingGrantRef: string | null;
}> {
  const repositories = createIdentityRepairStore();
  const episode = EpisodeAggregate.create({
    episodeId: `episode_080_${seed}`,
    episodeFingerprint: `episode_fp_080_${seed}`,
    openedAt: "2026-04-13T08:55:00Z",
  });
  const request = RequestAggregate.create({
    requestId: `request_080_${seed}`,
    episodeId: episode.episodeId,
    originEnvelopeRef: `envelope_080_${seed}`,
    promotionRecordRef: `promotion_080_${seed}`,
    tenantId: "tenant_080",
    sourceChannel: "self_service_form",
    originIngressRecordRef: `ingress_080_${seed}`,
    normalizedSubmissionRef: `normalized_080_${seed}`,
    requestType: "clinical_question",
    requestLineageRef: `lineage_080_${seed}`,
    createdAt: "2026-04-13T08:55:00Z",
  });
  await repositories.saveEpisode(episode);
  await repositories.saveRequest(request);

  const bindings = createIdentityBindingAuthorityService(
    repositories,
    createDeterministicBackboneIdGenerator(`par080_binding_${seed}`),
  );
  const binding = await bindings.settleBinding({
    requestId: request.requestId,
    episodeId: episode.episodeId,
    subjectRef: `subject_080_${seed}`,
    patientRef: `patient_080_${seed}`,
    runnerUpPatientRef: `patient_080_${seed}_runner_up`,
    candidatePatientRefs: [`patient_080_${seed}`, `patient_080_${seed}_runner_up`],
    candidateSetRef: `candidate_set_080_${seed}_v1`,
    bindingState: "verified_patient",
    ownershipState: "claimed",
    decisionClass: "claim_confirmed",
    assuranceLevel: "high",
    verifiedContactRouteRef: `contact_route_080_${seed}_sms`,
    matchEvidenceRef: `match_evidence_080_${seed}_v1`,
    linkProbability: 0.99,
    linkProbabilityLowerBound: 0.98,
    runnerUpProbabilityUpperBound: 0.02,
    subjectProofProbabilityLowerBound: 0.98,
    gapLogit: 6.4,
    calibrationVersionRef: `calibration_080_${seed}_v1`,
    confidenceModelState: "calibrated",
    bindingAuthorityRef: "identity_binding_authority_080",
    stepUpMethod: "nhs_login_subject_and_phone_match",
    createdAt: "2026-04-13T08:56:00Z",
  });

  const grants = new AccessGrantService(
    repositories,
    createDeterministicBackboneIdGenerator(`par080_grants_${seed}`),
  );
  const bookingGrant = await grants.issueGrantForUseCase({
    useCase: "booking_manage",
    routeFamilyRef: "rf_patient_appointments",
    governingObjectRef: request.requestId,
    governingVersionRef: `${request.requestId}@v1`,
    recoveryRouteRef: "rf_patient_secure_link_recovery",
    subjectRef: `subject_080_${seed}`,
    boundPatientRef: `patient_080_${seed}`,
    issuedIdentityBindingRef: binding.binding.bindingId,
    boundContactRouteRef: `contact_route_080_${seed}_sms`,
    issuedRouteIntentBindingRef: `route_intent_080_${seed}_booking_v1`,
    tokenKeyVersionRef: "token_key_080_v1",
    issuedLineageFenceEpoch: 1,
    presentedToken: `token-booking-080-${seed}`,
    expiresAt: "2026-04-13T09:40:00Z",
    createdAt: "2026-04-13T08:57:00Z",
  });
  await grants.issueGrantForUseCase({
    useCase: "pharmacy_choice",
    routeFamilyRef: "rf_patient_requests",
    governingObjectRef: request.requestId,
    governingVersionRef: `${request.requestId}@v1`,
    recoveryRouteRef: "rf_patient_secure_link_recovery",
    subjectRef: `subject_080_${seed}`,
    boundPatientRef: `patient_080_${seed}`,
    issuedIdentityBindingRef: binding.binding.bindingId,
    boundContactRouteRef: `contact_route_080_${seed}_sms`,
    issuedRouteIntentBindingRef: `route_intent_080_${seed}_pharmacy_v1`,
    tokenKeyVersionRef: "token_key_080_v1",
    issuedLineageFenceEpoch: 1,
    presentedToken: `token-pharmacy-080-${seed}`,
    expiresAt: "2026-04-13T09:45:00Z",
    createdAt: "2026-04-13T08:57:30Z",
  });

  return {
    repositories,
    repair: createIdentityRepairOrchestratorService(
      repositories,
      createDeterministicBackboneIdGenerator(`par080_repair_${seed}`),
    ),
    governor: createReachabilityGovernorService(
      repositories,
      createDeterministicBackboneIdGenerator(`par080_reachability_${seed}`),
    ),
    episode,
    request,
    bindingRef: binding.binding.bindingId,
    bookingGrantRef: "grant" in bookingGrant ? bookingGrant.grant.grantId : null,
  };
}

export async function runIdentityRepairReachabilitySimulation(): Promise<
  readonly IdentityRepairReachabilitySimulationScenario[]
> {
  const context = await seedIdentityRepairSimulationScope("simulation");
  const harness = createIdentityRepairSimulationHarness(context.repositories, context.repair);

  const initialSnapshot = await context.governor.freezeContactRouteSnapshot({
    subjectRef: "subject_080_simulation",
    routeRef: "contact_route_080_simulation_sms",
    routeVersionRef: "contact_route_080_simulation_sms_v1",
    routeKind: "sms",
    normalizedAddressRef: "tel:+447700900180",
    preferenceProfileRef: "preference_profile_080_simulation",
    verificationState: "verified_current",
    demographicFreshnessState: "current",
    preferenceFreshnessState: "current",
    sourceAuthorityClass: "patient_confirmed",
    createdAt: "2026-04-13T08:58:00Z",
  });
  const dependency = await context.governor.createDependency({
    episodeId: context.episode.episodeId,
    requestId: context.request.requestId,
    domain: "callback",
    domainObjectRef: "callback_080_simulation",
    requiredRouteRef: initialSnapshot.snapshot.toSnapshot().routeRef,
    purpose: "callback",
    blockedActionScopeRefs: ["callback_status_entry", "callback_response"],
    selectedAnchorRef: "anchor_callback_080_simulation",
    requestReturnBundleRef: "return_bundle_080_simulation",
    resumeContinuationRef: "resume_080_simulation",
    deadlineAt: "2026-04-13T10:00:00Z",
    failureEffect: "urgent_review",
    assessedAt: "2026-04-13T08:58:30Z",
  });
  await context.governor.recordObservation({
    reachabilityDependencyRef: dependency.dependency.dependencyId,
    contactRouteSnapshotRef: initialSnapshot.snapshot.contactRouteSnapshotId,
    observationClass: "bounce",
    observationSourceRef: "simulator:sms",
    observedAt: "2026-04-13T08:59:00Z",
    recordedAt: "2026-04-13T08:59:00Z",
    outcomePolarity: "negative",
    authorityWeight: "strong",
    evidenceRef: "evidence_080_simulation_bounce",
  });
  await context.governor.refreshDependencyAssessment({
    reachabilityDependencyRef: dependency.dependency.dependencyId,
    contactRouteSnapshotRef: initialSnapshot.snapshot.contactRouteSnapshotId,
    assessedAt: "2026-04-13T08:59:00Z",
  });
  const repairJourney = await context.governor.openRepairJourney({
    reachabilityDependencyRef: dependency.dependency.dependencyId,
    patientRecoveryLoopRef: "patient_recovery_loop_080_simulation",
    issuedAt: "2026-04-13T08:59:30Z",
  });
  const candidateSnapshot = await context.governor.freezeContactRouteSnapshot({
    subjectRef: "subject_080_simulation",
    routeRef: "contact_route_080_simulation_sms",
    routeVersionRef: "contact_route_080_simulation_sms_v2",
    routeKind: "sms",
    normalizedAddressRef: "tel:+447700900181",
    preferenceProfileRef: "preference_profile_080_simulation",
    verificationState: "unverified",
    demographicFreshnessState: "current",
    preferenceFreshnessState: "current",
    sourceAuthorityClass: "patient_confirmed",
    expectedCurrentSnapshotRef: initialSnapshot.snapshot.contactRouteSnapshotId,
    createdAt: "2026-04-13T09:00:00Z",
  });
  await context.governor.attachCandidateSnapshot({
    repairJourneyRef: repairJourney.journey.repairJourneyId,
    contactRouteSnapshotRef: candidateSnapshot.snapshot.contactRouteSnapshotId,
    updatedAt: "2026-04-13T09:00:10Z",
  });
  const checkpoint = await context.governor.issueVerificationCheckpoint({
    repairJourneyRef: repairJourney.journey.repairJourneyId,
    contactRouteRef: "contact_route_080_simulation_sms",
    contactRouteVersionRef: "contact_route_080_simulation_sms_v2",
    verificationMethod: "otp",
    dependentGrantRefs: context.bookingGrantRef ? [context.bookingGrantRef] : [],
    dependentRouteIntentRefs: ["route_intent_080_simulation_booking_v2"],
    evaluatedAt: "2026-04-13T09:00:30Z",
  });
  const settledCheckpoint = await context.governor.settleVerificationCheckpoint({
    checkpointId: checkpoint.checkpointId,
    verificationState: "verified",
    evaluatedAt: "2026-04-13T09:01:00Z",
  });

  return Promise.all([
    harness.runScenario({
      scenarioId: "wrong_patient_freeze_release",
      title: "Wrong-patient suspicion freezes grants, branches, and comms before governed release.",
      signal: {
        episodeId: context.episode.episodeId,
        affectedRequestRef: context.request.requestId,
        observedIdentityBindingRef: context.bindingRef,
        observedSessionRef: "session_080_simulation",
        observedAccessGrantRef: context.bookingGrantRef,
        observedRouteIntentBindingRef: "route_intent_080_simulation_booking_v1",
        signalClass: "support_report",
        signalDisposition: "confirmed_misbinding",
        evidenceRefs: ["evidence_080_support_call", "evidence_080_identity_conflict"],
        reportedBy: "support.advisor.080",
        reportedAt: "2026-04-13T09:00:00Z",
      },
      freeze: {
        repairCaseRef: "unused",
        affectedBranches: [
          {
            branchType: "booking",
            governingObjectRef: "booking_080_primary",
            requiresRevalidation: true,
          },
          {
            branchType: "callback",
            governingObjectRef: "callback_080_primary",
            hasExternalSideEffect: true,
            requiresCompensation: true,
          },
          {
            branchType: "pharmacy",
            governingObjectRef: "pharmacy_080_primary",
            requiresManualReview: true,
          },
          {
            branchType: "outbound_communication",
            governingObjectRef: "outbound_sms_080_primary",
          },
        ],
        activatedAt: "2026-04-13T09:04:00Z",
      },
      correction: {
        repairCaseRef: "unused",
        supervisorApprovalRef: "supervisor_approval_080_primary",
        independentReviewRef: "independent_review_080_primary",
        projectionRebuildRef: "projection_rebuild_080_primary",
        correctedAt: "2026-04-13T09:18:00Z",
      },
      release: {
        repairCaseRef: "unused",
        resultingIdentityBindingRef: "binding_080_simulation_v2",
        replacementAccessGrantRefs: ["grant_080_primary_v2"],
        replacementRouteIntentBindingRefs: ["route_intent_080_primary_v2"],
        replacementSessionEstablishmentDecisionRef: "session_establishment_080_primary_v2",
        communicationsResumeState: "resumed",
        releaseMode: "claim_pending_resume",
        recordedAt: "2026-04-13T09:30:00Z",
      },
      reachability: {
        dependency: settledCheckpoint.dependency,
        journey: settledCheckpoint.journey,
        assessment: settledCheckpoint.assessment,
        checkpoint: settledCheckpoint.checkpoint,
      },
    }),
  ]);
}
