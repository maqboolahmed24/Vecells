import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import { makeFoundationEvent, type FoundationEventEnvelope } from "@vecells/event-contracts";

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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
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

function nextClosureId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type RequestClosureDecision = "close" | "defer";

export type RequestClosedByMode =
  | "routine_terminal_outcome"
  | "governed_return_close"
  | "coordinator_episode_close"
  | "manually_authorized_exception_close"
  | "not_closed";

export type ClosureDeferReasonCode =
  | "LEASE_ACTIVE_OR_BROKEN"
  | "SAFETY_PREEMPTION_OPEN"
  | "APPROVAL_OR_CONFIRMATION_PENDING"
  | "OUTCOME_TRUTH_DISPUTED"
  | "PHARMACY_RECONCILIATION_OPEN"
  | "REPAIR_OR_REVIEW_OPEN"
  | "REACHABILITY_REPAIR_OPEN"
  | "LIVE_PHI_GRANT_PRESENT"
  | "MATERIALIZED_BLOCKERS_PRESENT"
  | "LINEAGE_BRANCH_STILL_ACTIVE"
  | "COMMAND_FOLLOWING_PROJECTION_PENDING"
  | "TERMINAL_OUTCOME_MISSING"
  | "EPISODE_POLICY_UNSATISFIED"
  | "ACKNOWLEDGEMENT_REQUIRED"
  | "CONSENT_OR_DEGRADED_PROMISE_OPEN";

export type ClosureBlockerClass =
  | "lease_conflict"
  | "safety_preemption"
  | "approval_checkpoint"
  | "outcome_reconciliation"
  | "confirmation_gate"
  | "lineage_case_link_active"
  | "duplicate_review"
  | "fallback_review"
  | "identity_repair"
  | "live_phi_grant"
  | "reachability_dependency"
  | "degraded_promise";

export type FallbackReviewLineageScope = "envelope" | "request" | "episode";

export type FallbackTriggerClass =
  | "ingest_failure"
  | "safety_engine_failure"
  | "artifact_quarantine"
  | "auth_recovery"
  | "degraded_dependency";

export type FallbackPatientVisibleState =
  | "draft_recoverable"
  | "submitted_degraded"
  | "under_manual_review"
  | "recovered"
  | "closed";

export type FallbackCaseState = "open" | "recovered" | "closed";

export type FallbackClosureBasis = "none" | "recovered" | "superseded" | "manual_settlement";

export type FallbackGovernedRecoveryFamily =
  | "accepted_progress"
  | "auth_recovery"
  | "dependency_recovery"
  | "manual_review"
  | "wrong_patient_repair";

export type ClosureEvaluationBooleanState = "satisfied" | "unsatisfied";

const blockingFieldNames = [
  "blockingLeaseRefs",
  "blockingPreemptionRefs",
  "blockingApprovalRefs",
  "blockingReconciliationRefs",
  "blockingConfirmationRefs",
  "blockingLineageCaseLinkRefs",
  "blockingDuplicateClusterRefs",
  "blockingFallbackCaseRefs",
  "blockingIdentityRepairRefs",
  "blockingGrantRefs",
  "blockingReachabilityRefs",
  "blockingDegradedPromiseRefs",
] as const;

type BlockingFieldName = (typeof blockingFieldNames)[number];

export const closureBlockerCatalog = [
  {
    blockerClass: "lease_conflict",
    label: "Lifecycle lease conflict",
    field: "blockingLeaseRefs",
    deferReasonCode: "LEASE_ACTIVE_OR_BROKEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 1",
  },
  {
    blockerClass: "safety_preemption",
    label: "Safety preemption",
    field: "blockingPreemptionRefs",
    deferReasonCode: "SAFETY_PREEMPTION_OPEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 2",
  },
  {
    blockerClass: "approval_checkpoint",
    label: "Approval or acknowledgement checkpoint",
    field: "blockingApprovalRefs",
    deferReasonCode: "APPROVAL_OR_CONFIRMATION_PENDING",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / checks 3 and 14",
  },
  {
    blockerClass: "outcome_reconciliation",
    label: "Outcome reconciliation gate",
    field: "blockingReconciliationRefs",
    deferReasonCode: "PHARMACY_RECONCILIATION_OPEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / checks 4 and 5",
  },
  {
    blockerClass: "confirmation_gate",
    label: "External confirmation gate",
    field: "blockingConfirmationRefs",
    deferReasonCode: "APPROVAL_OR_CONFIRMATION_PENDING",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / checks 3 and 15",
  },
  {
    blockerClass: "lineage_case_link_active",
    label: "Active lineage branch",
    field: "blockingLineageCaseLinkRefs",
    deferReasonCode: "LINEAGE_BRANCH_STILL_ACTIVE",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 10",
  },
  {
    blockerClass: "duplicate_review",
    label: "Duplicate review required",
    field: "blockingDuplicateClusterRefs",
    deferReasonCode: "REPAIR_OR_REVIEW_OPEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 6",
  },
  {
    blockerClass: "fallback_review",
    label: "Fallback review case open",
    field: "blockingFallbackCaseRefs",
    deferReasonCode: "REPAIR_OR_REVIEW_OPEN",
    sourceRef: "blueprint/phase-0-the-foundation-protocol.md#1.20 FallbackReviewCase",
  },
  {
    blockerClass: "identity_repair",
    label: "Identity repair active",
    field: "blockingIdentityRepairRefs",
    deferReasonCode: "REPAIR_OR_REVIEW_OPEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 6",
  },
  {
    blockerClass: "live_phi_grant",
    label: "Live PHI-bearing grant",
    field: "blockingGrantRefs",
    deferReasonCode: "LIVE_PHI_GRANT_PRESENT",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 8",
  },
  {
    blockerClass: "reachability_dependency",
    label: "Reachability repair open",
    field: "blockingReachabilityRefs",
    deferReasonCode: "REACHABILITY_REPAIR_OPEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 7",
  },
  {
    blockerClass: "degraded_promise",
    label: "Degraded promise still current",
    field: "blockingDegradedPromiseRefs",
    deferReasonCode: "CONSENT_OR_DEGRADED_PROMISE_OPEN",
    sourceRef:
      "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm / check 15",
  },
] as const satisfies readonly {
  blockerClass: ClosureBlockerClass;
  label: string;
  field: BlockingFieldName;
  deferReasonCode: ClosureDeferReasonCode;
  sourceRef: string;
}[];

const blockerClassFieldMap = new Map(
  closureBlockerCatalog.map((entry) => [entry.blockerClass, entry.field] as const),
);

export interface RequestClosureRecordSnapshot {
  closureRecordId: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  evaluatedAt: string;
  requiredLineageEpoch: number;
  blockingLeaseRefs: readonly string[];
  blockingPreemptionRefs: readonly string[];
  blockingApprovalRefs: readonly string[];
  blockingReconciliationRefs: readonly string[];
  blockingConfirmationRefs: readonly string[];
  blockingLineageCaseLinkRefs: readonly string[];
  blockingDuplicateClusterRefs: readonly string[];
  blockingFallbackCaseRefs: readonly string[];
  blockingIdentityRepairRefs: readonly string[];
  blockingGrantRefs: readonly string[];
  blockingReachabilityRefs: readonly string[];
  blockingDegradedPromiseRefs: readonly string[];
  decision: RequestClosureDecision;
  closedByMode: RequestClosedByMode;
  deferReasonCodes: readonly ClosureDeferReasonCode[];
  currentClosureBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  terminalOutcomeRef: string | null;
  requiredCommandFollowingProjectionRefs: readonly string[];
  consumedCausalTokenRef: string | null;
  materializedBlockerSetHash: string;
  version: number;
}

export interface PersistedRequestClosureRecordRow extends RequestClosureRecordSnapshot {
  aggregateType: "RequestClosureRecord";
  persistenceSchemaVersion: 1;
}

export interface FallbackReviewCaseSnapshot {
  fallbackCaseId: string;
  lineageScope: FallbackReviewLineageScope;
  envelopeId: string | null;
  requestId: string | null;
  episodeId: string | null;
  requestLineageRef: string | null;
  triggerClass: FallbackTriggerClass;
  patientVisibleState: FallbackPatientVisibleState;
  manualOwnerQueue: string;
  slaAnchorAt: string;
  receiptIssuedAt: string;
  createdAt: string;
  updatedAt: string;
  caseState: FallbackCaseState;
  closureBasis: FallbackClosureBasis;
  governedRecoveryFamily: FallbackGovernedRecoveryFamily;
  latestRecoveryEvidenceRef: string | null;
  governedManualSettlementRef: string | null;
  supersededByCaseRef: string | null;
  closedAt: string | null;
  recoveredAt: string | null;
  version: number;
}

export interface PersistedFallbackReviewCaseRow extends FallbackReviewCaseSnapshot {
  aggregateType: "FallbackReviewCase";
  persistenceSchemaVersion: 1;
}

export interface RequestClosureEvaluationInput {
  closureRecordId?: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  evaluatedAt: string;
  requiredLineageEpoch: number;
  blockingLeaseRefs?: readonly string[];
  blockingPreemptionRefs?: readonly string[];
  blockingApprovalRefs?: readonly string[];
  blockingReconciliationRefs?: readonly string[];
  blockingConfirmationRefs?: readonly string[];
  blockingLineageCaseLinkRefs?: readonly string[];
  blockingDuplicateClusterRefs?: readonly string[];
  blockingFallbackCaseRefs?: readonly string[];
  blockingIdentityRepairRefs?: readonly string[];
  blockingGrantRefs?: readonly string[];
  blockingReachabilityRefs?: readonly string[];
  blockingDegradedPromiseRefs?: readonly string[];
  currentClosureBlockerRefs?: readonly string[];
  currentConfirmationGateRefs?: readonly string[];
  terminalOutcomeRef?: string | null;
  requiredCommandFollowingProjectionRefs?: readonly string[];
  consumedCausalTokenRef?: string | null;
  outcomeTruthState?: ClosureEvaluationBooleanState;
  episodeClosurePolicyState?: ClosureEvaluationBooleanState;
  acknowledgementState?: ClosureEvaluationBooleanState;
  consentAndDegradedConfirmationState?: ClosureEvaluationBooleanState;
  requestedDecision?: "auto" | RequestClosureDecision;
  closedByMode?: Exclude<RequestClosedByMode, "not_closed">;
  deferReasonCodes?: readonly ClosureDeferReasonCode[];
}

export interface RequestClosureEvaluationResult {
  snapshot: RequestClosureRecordSnapshot;
  blockerRefs: readonly string[];
  deferReasonCodes: readonly ClosureDeferReasonCode[];
}

export interface OpenFallbackReviewCaseInput {
  fallbackCaseId?: string;
  lineageScope: FallbackReviewLineageScope;
  envelopeId?: string | null;
  requestId?: string | null;
  episodeId?: string | null;
  requestLineageRef?: string | null;
  triggerClass: FallbackTriggerClass;
  patientVisibleState: Exclude<FallbackPatientVisibleState, "recovered" | "closed">;
  manualOwnerQueue: string;
  slaAnchorAt: string;
  receiptIssuedAt: string;
  createdAt: string;
  updatedAt?: string;
  governedRecoveryFamily?: FallbackGovernedRecoveryFamily;
  latestRecoveryEvidenceRef?: string | null;
}

export interface AdvanceFallbackReviewCaseInput {
  fallbackCaseId: string;
  updatedAt: string;
  patientVisibleState: Exclude<FallbackPatientVisibleState, "recovered" | "closed">;
  manualOwnerQueue?: string;
  latestRecoveryEvidenceRef?: string | null;
}

export interface RecoverFallbackReviewCaseInput {
  fallbackCaseId: string;
  updatedAt: string;
  recoveredAt: string;
  latestRecoveryEvidenceRef: string;
}

export interface CloseFallbackReviewCaseInput {
  fallbackCaseId: string;
  updatedAt: string;
  closedAt: string;
  closureBasis: Exclude<FallbackClosureBasis, "none">;
  governedManualSettlementRef?: string | null;
  supersededByCaseRef?: string | null;
}

export interface RequestClosureRecordRepository {
  saveRequestClosureRecord(
    row: PersistedRequestClosureRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getRequestClosureRecord(
    closureRecordId: string,
  ): Promise<PersistedRequestClosureRecordRow | null>;
  listRequestClosureRecordsByRequest(
    requestId: string,
  ): Promise<PersistedRequestClosureRecordRow[]>;
  listRequestClosureRecordsByEpisode(
    episodeId: string,
  ): Promise<PersistedRequestClosureRecordRow[]>;
  listRequestClosureRecordsByLineage(
    requestLineageRef: string,
  ): Promise<PersistedRequestClosureRecordRow[]>;
  findLatestRequestClosureRecordForRequest(
    requestId: string,
  ): Promise<PersistedRequestClosureRecordRow | null>;
  listActiveClosureRecords(filters?: {
    requestId?: string;
    episodeId?: string;
    requestLineageRef?: string;
    blockerClass?: ClosureBlockerClass;
    requiredLineageEpoch?: number;
  }): Promise<PersistedRequestClosureRecordRow[]>;
}

export interface FallbackReviewCaseRepository {
  saveFallbackReviewCase(
    row: PersistedFallbackReviewCaseRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getFallbackReviewCase(fallbackCaseId: string): Promise<PersistedFallbackReviewCaseRow | null>;
  listFallbackReviewCases(filters?: {
    requestId?: string;
    episodeId?: string;
    lineageScope?: FallbackReviewLineageScope;
    triggerClass?: FallbackTriggerClass;
    caseState?: FallbackCaseState;
  }): Promise<PersistedFallbackReviewCaseRow[]>;
  listFallbackReviewCaseHistory(
    fallbackCaseId: string,
  ): Promise<readonly PersistedFallbackReviewCaseRow[]>;
}

export interface RequestClosureDependencies
  extends RequestClosureRecordRepository,
    FallbackReviewCaseRepository {}

function buildMaterializedMinimumClosureBlockerRefs(
  snapshot: Pick<
    RequestClosureRecordSnapshot,
    | "blockingLeaseRefs"
    | "blockingPreemptionRefs"
    | "blockingApprovalRefs"
    | "blockingReconciliationRefs"
    | "blockingLineageCaseLinkRefs"
    | "blockingDuplicateClusterRefs"
    | "blockingFallbackCaseRefs"
    | "blockingIdentityRepairRefs"
    | "blockingGrantRefs"
    | "blockingReachabilityRefs"
    | "blockingDegradedPromiseRefs"
  >,
): string[] {
  return uniqueSortedRefs([
    ...snapshot.blockingLeaseRefs,
    ...snapshot.blockingPreemptionRefs,
    ...snapshot.blockingApprovalRefs,
    ...snapshot.blockingReconciliationRefs,
    ...snapshot.blockingLineageCaseLinkRefs,
    ...snapshot.blockingDuplicateClusterRefs,
    ...snapshot.blockingFallbackCaseRefs,
    ...snapshot.blockingIdentityRepairRefs,
    ...snapshot.blockingGrantRefs,
    ...snapshot.blockingReachabilityRefs,
    ...snapshot.blockingDegradedPromiseRefs,
  ]);
}

export function buildMaterializedBlockerSetHash(input: {
  currentClosureBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
}): string {
  return sha256Hex(
    stableStringify({
      currentClosureBlockerRefs: uniqueSortedRefs(input.currentClosureBlockerRefs),
      currentConfirmationGateRefs: uniqueSortedRefs(input.currentConfirmationGateRefs),
    }),
  );
}

export function listRequestClosureBlockerRefs(
  snapshot: Pick<RequestClosureRecordSnapshot, BlockingFieldName | "currentConfirmationGateRefs">,
  blockerClass?: ClosureBlockerClass,
): string[] {
  if (blockerClass === undefined) {
    return uniqueSortedRefs(
      blockingFieldNames.flatMap((field) => snapshot[field] as readonly string[]),
    );
  }
  const field = blockerClassFieldMap.get(blockerClass);
  invariant(field !== undefined, "UNKNOWN_BLOCKER_CLASS", `Unknown blocker class ${blockerClass}.`);
  return uniqueSortedRefs(snapshot[field] as readonly string[]);
}

export class RequestClosureRecordDocument {
  private readonly snapshot: RequestClosureRecordSnapshot;

  private constructor(snapshot: RequestClosureRecordSnapshot) {
    this.snapshot = RequestClosureRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<RequestClosureRecordSnapshot, "version" | "materializedBlockerSetHash">,
  ): RequestClosureRecordDocument {
    return new RequestClosureRecordDocument({
      ...input,
      materializedBlockerSetHash: buildMaterializedBlockerSetHash({
        currentClosureBlockerRefs: input.currentClosureBlockerRefs,
        currentConfirmationGateRefs: input.currentConfirmationGateRefs,
      }),
      version: 1,
    });
  }

  static hydrate(snapshot: RequestClosureRecordSnapshot): RequestClosureRecordDocument {
    return new RequestClosureRecordDocument(snapshot);
  }

  private static normalize(snapshot: RequestClosureRecordSnapshot): RequestClosureRecordSnapshot {
    const normalized: RequestClosureRecordSnapshot = {
      ...snapshot,
      closureRecordId: requireRef(snapshot.closureRecordId, "closureRecordId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
      requiredLineageEpoch: ensureNonNegativeInteger(
        snapshot.requiredLineageEpoch,
        "requiredLineageEpoch",
      ),
      blockingLeaseRefs: uniqueSortedRefs(snapshot.blockingLeaseRefs),
      blockingPreemptionRefs: uniqueSortedRefs(snapshot.blockingPreemptionRefs),
      blockingApprovalRefs: uniqueSortedRefs(snapshot.blockingApprovalRefs),
      blockingReconciliationRefs: uniqueSortedRefs(snapshot.blockingReconciliationRefs),
      blockingConfirmationRefs: uniqueSortedRefs(snapshot.blockingConfirmationRefs),
      blockingLineageCaseLinkRefs: uniqueSortedRefs(snapshot.blockingLineageCaseLinkRefs),
      blockingDuplicateClusterRefs: uniqueSortedRefs(snapshot.blockingDuplicateClusterRefs),
      blockingFallbackCaseRefs: uniqueSortedRefs(snapshot.blockingFallbackCaseRefs),
      blockingIdentityRepairRefs: uniqueSortedRefs(snapshot.blockingIdentityRepairRefs),
      blockingGrantRefs: uniqueSortedRefs(snapshot.blockingGrantRefs),
      blockingReachabilityRefs: uniqueSortedRefs(snapshot.blockingReachabilityRefs),
      blockingDegradedPromiseRefs: uniqueSortedRefs(snapshot.blockingDegradedPromiseRefs),
      deferReasonCodes: [...new Set(snapshot.deferReasonCodes)].sort(),
      currentClosureBlockerRefs: uniqueSortedRefs(snapshot.currentClosureBlockerRefs),
      currentConfirmationGateRefs: uniqueSortedRefs(snapshot.currentConfirmationGateRefs),
      terminalOutcomeRef: optionalRef(snapshot.terminalOutcomeRef),
      requiredCommandFollowingProjectionRefs: uniqueSortedRefs(
        snapshot.requiredCommandFollowingProjectionRefs,
      ),
      consumedCausalTokenRef: optionalRef(snapshot.consumedCausalTokenRef),
      materializedBlockerSetHash: requireRef(
        snapshot.materializedBlockerSetHash,
        "materializedBlockerSetHash",
      ).toLowerCase(),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };

    const minimumClosureBlockerRefs = buildMaterializedMinimumClosureBlockerRefs(normalized);
    invariant(
      minimumClosureBlockerRefs.every((ref) => normalized.currentClosureBlockerRefs.includes(ref)),
      "CURRENT_BLOCKER_SET_STALE",
      "currentClosureBlockerRefs must contain every persisted non-confirmation blocker ref.",
    );
    invariant(
      normalized.blockingConfirmationRefs.every((ref) =>
        normalized.currentConfirmationGateRefs.includes(ref),
      ),
      "CURRENT_CONFIRMATION_SET_STALE",
      "currentConfirmationGateRefs must contain every persisted confirmation blocker ref.",
    );

    const expectedHash = buildMaterializedBlockerSetHash({
      currentClosureBlockerRefs: normalized.currentClosureBlockerRefs,
      currentConfirmationGateRefs: normalized.currentConfirmationGateRefs,
    });
    invariant(
      normalized.materializedBlockerSetHash === expectedHash,
      "MATERIALIZED_BLOCKER_HASH_MISMATCH",
      "materializedBlockerSetHash must match the current blocker and confirmation sets.",
    );

    const hasCanonicalBlockerRefs =
      listRequestClosureBlockerRefs(normalized).length > 0 ||
      normalized.currentClosureBlockerRefs.length > 0 ||
      normalized.currentConfirmationGateRefs.length > 0;

    if (normalized.decision === "close") {
      invariant(
        !hasCanonicalBlockerRefs,
        "CLOSE_WITH_ACTIVE_BLOCKERS",
        "RequestClosureRecord(decision = close) requires every blocker array to be empty.",
      );
      invariant(
        normalized.deferReasonCodes.length === 0,
        "CLOSE_WITH_DEFER_REASONS",
        "RequestClosureRecord(decision = close) may not carry deferReasonCodes.",
      );
      invariant(
        normalized.closedByMode !== "not_closed",
        "CLOSE_WITH_NOT_CLOSED_MODE",
        "RequestClosureRecord(decision = close) requires a closing mode.",
      );
      invariant(
        normalized.terminalOutcomeRef !== null,
        "CLOSE_REQUIRES_TERMINAL_OUTCOME",
        "RequestClosureRecord(decision = close) requires terminalOutcomeRef.",
      );
      invariant(
        normalized.requiredCommandFollowingProjectionRefs.length === 0 ||
          normalized.consumedCausalTokenRef !== null,
        "CLOSE_REQUIRES_CONSUMED_CAUSAL_TOKEN",
        "RequestClosureRecord(decision = close) requires consumedCausalTokenRef when command-following projections are required.",
      );
    } else {
      invariant(
        normalized.closedByMode === "not_closed",
        "DEFER_REQUIRES_NOT_CLOSED_MODE",
        "RequestClosureRecord(decision = defer) must use closedByMode = not_closed.",
      );
      invariant(
        hasCanonicalBlockerRefs ||
          normalized.deferReasonCodes.length > 0 ||
          normalized.terminalOutcomeRef === null ||
          (normalized.requiredCommandFollowingProjectionRefs.length > 0 &&
            normalized.consumedCausalTokenRef === null),
        "DEFER_REQUIRES_BLOCKER_BASIS",
        "RequestClosureRecord(decision = defer) requires blocker refs, missing terminal outcome, or explicit defer reasons.",
      );
    }

    return normalized;
  }

  toSnapshot(): RequestClosureRecordSnapshot {
    return {
      ...this.snapshot,
      blockingLeaseRefs: [...this.snapshot.blockingLeaseRefs],
      blockingPreemptionRefs: [...this.snapshot.blockingPreemptionRefs],
      blockingApprovalRefs: [...this.snapshot.blockingApprovalRefs],
      blockingReconciliationRefs: [...this.snapshot.blockingReconciliationRefs],
      blockingConfirmationRefs: [...this.snapshot.blockingConfirmationRefs],
      blockingLineageCaseLinkRefs: [...this.snapshot.blockingLineageCaseLinkRefs],
      blockingDuplicateClusterRefs: [...this.snapshot.blockingDuplicateClusterRefs],
      blockingFallbackCaseRefs: [...this.snapshot.blockingFallbackCaseRefs],
      blockingIdentityRepairRefs: [...this.snapshot.blockingIdentityRepairRefs],
      blockingGrantRefs: [...this.snapshot.blockingGrantRefs],
      blockingReachabilityRefs: [...this.snapshot.blockingReachabilityRefs],
      blockingDegradedPromiseRefs: [...this.snapshot.blockingDegradedPromiseRefs],
      deferReasonCodes: [...this.snapshot.deferReasonCodes],
      currentClosureBlockerRefs: [...this.snapshot.currentClosureBlockerRefs],
      currentConfirmationGateRefs: [...this.snapshot.currentConfirmationGateRefs],
      requiredCommandFollowingProjectionRefs: [
        ...this.snapshot.requiredCommandFollowingProjectionRefs,
      ],
    };
  }

  toPersistedRow(): PersistedRequestClosureRecordRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "RequestClosureRecord",
      persistenceSchemaVersion: 1,
    };
  }
}

export class FallbackReviewCaseDocument {
  private readonly snapshot: FallbackReviewCaseSnapshot;

  private constructor(snapshot: FallbackReviewCaseSnapshot) {
    this.snapshot = FallbackReviewCaseDocument.normalize(snapshot);
  }

  static create(input: Omit<FallbackReviewCaseSnapshot, "version">): FallbackReviewCaseDocument {
    return new FallbackReviewCaseDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: FallbackReviewCaseSnapshot): FallbackReviewCaseDocument {
    return new FallbackReviewCaseDocument(snapshot);
  }

  private static normalize(snapshot: FallbackReviewCaseSnapshot): FallbackReviewCaseSnapshot {
    const normalized: FallbackReviewCaseSnapshot = {
      ...snapshot,
      fallbackCaseId: requireRef(snapshot.fallbackCaseId, "fallbackCaseId"),
      envelopeId: optionalRef(snapshot.envelopeId),
      requestId: optionalRef(snapshot.requestId),
      episodeId: optionalRef(snapshot.episodeId),
      requestLineageRef: optionalRef(snapshot.requestLineageRef),
      manualOwnerQueue: requireRef(snapshot.manualOwnerQueue, "manualOwnerQueue"),
      slaAnchorAt: ensureIsoTimestamp(snapshot.slaAnchorAt, "slaAnchorAt"),
      receiptIssuedAt: ensureIsoTimestamp(snapshot.receiptIssuedAt, "receiptIssuedAt"),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
      latestRecoveryEvidenceRef: optionalRef(snapshot.latestRecoveryEvidenceRef),
      governedManualSettlementRef: optionalRef(snapshot.governedManualSettlementRef),
      supersededByCaseRef: optionalRef(snapshot.supersededByCaseRef),
      closedAt: optionalRef(snapshot.closedAt),
      recoveredAt: optionalRef(snapshot.recoveredAt),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };

    invariant(
      compareIso(normalized.updatedAt, normalized.createdAt) >= 0,
      "FALLBACK_UPDATED_BEFORE_CREATED",
      "FallbackReviewCase.updatedAt must not be earlier than createdAt.",
    );
    invariant(
      compareIso(normalized.receiptIssuedAt, normalized.createdAt) >= 0,
      "FALLBACK_RECEIPT_BEFORE_CREATED",
      "FallbackReviewCase.receiptIssuedAt must not be earlier than createdAt.",
    );
    invariant(
      compareIso(normalized.slaAnchorAt, normalized.receiptIssuedAt) <= 0,
      "FALLBACK_SLA_ANCHOR_AFTER_RECEIPT",
      "FallbackReviewCase.slaAnchorAt must anchor on or before the issued receipt.",
    );

    if (normalized.lineageScope === "envelope") {
      invariant(
        normalized.envelopeId !== null,
        "FALLBACK_ENVELOPE_SCOPE_REQUIRES_ENVELOPE",
        "Envelope-scoped fallback cases require envelopeId.",
      );
    } else {
      invariant(
        normalized.requestId !== null && normalized.requestLineageRef !== null,
        "FALLBACK_REQUEST_SCOPE_REQUIRES_LINEAGE",
        "Request and episode fallback cases require requestId and requestLineageRef.",
      );
    }

    if (normalized.lineageScope === "episode") {
      invariant(
        normalized.episodeId !== null,
        "FALLBACK_EPISODE_SCOPE_REQUIRES_EPISODE",
        "Episode-scoped fallback cases require episodeId.",
      );
    }

    invariant(
      normalized.governedRecoveryFamily !== "wrong_patient_repair",
      "WRONG_PATIENT_REPAIR_REQUIRES_IDENTITY_CASE",
      "Wrong-patient repair must use IdentityRepairCase, not FallbackReviewCase.",
    );

    if (normalized.caseState === "open") {
      invariant(
        normalized.patientVisibleState !== "recovered" &&
          normalized.patientVisibleState !== "closed",
        "OPEN_FALLBACK_CASE_STATE_MISMATCH",
        "Open fallback cases must remain draft_recoverable, submitted_degraded, or under_manual_review.",
      );
      invariant(
        normalized.closureBasis === "none",
        "OPEN_FALLBACK_CASE_WITH_CLOSURE_BASIS",
        "Open fallback cases may not carry a closure basis.",
      );
      invariant(
        normalized.closedAt === null && normalized.recoveredAt === null,
        "OPEN_FALLBACK_CASE_WITH_TERMINAL_TIMESTAMPS",
        "Open fallback cases may not carry closedAt or recoveredAt.",
      );
    }

    if (normalized.caseState === "recovered") {
      invariant(
        normalized.patientVisibleState === "recovered",
        "RECOVERED_FALLBACK_CASE_STATE_MISMATCH",
        "Recovered fallback cases must expose patientVisibleState = recovered.",
      );
      invariant(
        normalized.latestRecoveryEvidenceRef !== null && normalized.recoveredAt !== null,
        "RECOVERED_FALLBACK_CASE_REQUIRES_EVIDENCE",
        "Recovered fallback cases require recovery evidence and recoveredAt.",
      );
      invariant(
        normalized.closureBasis === "none" && normalized.closedAt === null,
        "RECOVERED_FALLBACK_CASE_CANNOT_BE_CLOSED",
        "Recovered fallback cases remain distinct from closed fallback history.",
      );
    }

    if (normalized.caseState === "closed") {
      invariant(
        normalized.patientVisibleState === "closed",
        "CLOSED_FALLBACK_CASE_STATE_MISMATCH",
        "Closed fallback cases must expose patientVisibleState = closed.",
      );
      invariant(
        normalized.closedAt !== null,
        "CLOSED_FALLBACK_CASE_REQUIRES_CLOSED_AT",
        "Closed fallback cases require closedAt.",
      );
      invariant(
        normalized.closureBasis !== "none",
        "CLOSED_FALLBACK_CASE_REQUIRES_CLOSURE_BASIS",
        "Closed fallback cases require closureBasis = recovered | superseded | manual_settlement.",
      );
      if (normalized.closureBasis === "recovered") {
        invariant(
          normalized.latestRecoveryEvidenceRef !== null && normalized.recoveredAt !== null,
          "CLOSED_RECOVERED_FALLBACK_CASE_REQUIRES_EVIDENCE",
          "FallbackReviewCase closed by recovery requires recovery evidence and recoveredAt.",
        );
      }
      if (normalized.closureBasis === "manual_settlement") {
        invariant(
          normalized.governedManualSettlementRef !== null,
          "CLOSED_MANUAL_FALLBACK_CASE_REQUIRES_SETTLEMENT",
          "FallbackReviewCase closed by manual settlement requires governedManualSettlementRef.",
        );
      }
      if (normalized.closureBasis === "superseded") {
        invariant(
          normalized.supersededByCaseRef !== null,
          "CLOSED_SUPERSEDED_FALLBACK_CASE_REQUIRES_SUCCESSOR",
          "FallbackReviewCase closed by supersession requires supersededByCaseRef.",
        );
      }
    }

    return normalized;
  }

  toSnapshot(): FallbackReviewCaseSnapshot {
    return { ...this.snapshot };
  }

  toPersistedRow(): PersistedFallbackReviewCaseRow {
    return {
      ...this.snapshot,
      aggregateType: "FallbackReviewCase",
      persistenceSchemaVersion: 1,
    };
  }
}

export function evaluateRequestClosure(
  input: RequestClosureEvaluationInput & { closureRecordId: string },
): RequestClosureEvaluationResult {
  const blockingLeaseRefs = uniqueSortedRefs(input.blockingLeaseRefs ?? []);
  const blockingPreemptionRefs = uniqueSortedRefs(input.blockingPreemptionRefs ?? []);
  const blockingApprovalRefs = uniqueSortedRefs(input.blockingApprovalRefs ?? []);
  const blockingReconciliationRefs = uniqueSortedRefs(input.blockingReconciliationRefs ?? []);
  const blockingConfirmationRefs = uniqueSortedRefs(input.blockingConfirmationRefs ?? []);
  const blockingLineageCaseLinkRefs = uniqueSortedRefs(input.blockingLineageCaseLinkRefs ?? []);
  const blockingDuplicateClusterRefs = uniqueSortedRefs(input.blockingDuplicateClusterRefs ?? []);
  const blockingFallbackCaseRefs = uniqueSortedRefs(input.blockingFallbackCaseRefs ?? []);
  const blockingIdentityRepairRefs = uniqueSortedRefs(input.blockingIdentityRepairRefs ?? []);
  const blockingGrantRefs = uniqueSortedRefs(input.blockingGrantRefs ?? []);
  const blockingReachabilityRefs = uniqueSortedRefs(input.blockingReachabilityRefs ?? []);
  const blockingDegradedPromiseRefs = uniqueSortedRefs(input.blockingDegradedPromiseRefs ?? []);

  const minimumCurrentClosureBlockerRefs = buildMaterializedMinimumClosureBlockerRefs({
    blockingLeaseRefs,
    blockingPreemptionRefs,
    blockingApprovalRefs,
    blockingReconciliationRefs,
    blockingLineageCaseLinkRefs,
    blockingDuplicateClusterRefs,
    blockingFallbackCaseRefs,
    blockingIdentityRepairRefs,
    blockingGrantRefs,
    blockingReachabilityRefs,
    blockingDegradedPromiseRefs,
  });

  const currentClosureBlockerRefs = uniqueSortedRefs(
    input.currentClosureBlockerRefs ?? minimumCurrentClosureBlockerRefs,
  );
  const currentConfirmationGateRefs = uniqueSortedRefs(
    input.currentConfirmationGateRefs ?? blockingConfirmationRefs,
  );

  const deferReasonCodes = new Set(input.deferReasonCodes ?? []);
  if (blockingLeaseRefs.length > 0) {
    deferReasonCodes.add("LEASE_ACTIVE_OR_BROKEN");
  }
  if (blockingPreemptionRefs.length > 0) {
    deferReasonCodes.add("SAFETY_PREEMPTION_OPEN");
  }
  if (blockingApprovalRefs.length > 0 || blockingConfirmationRefs.length > 0) {
    deferReasonCodes.add("APPROVAL_OR_CONFIRMATION_PENDING");
  }
  if (input.outcomeTruthState === "unsatisfied") {
    deferReasonCodes.add("OUTCOME_TRUTH_DISPUTED");
  }
  if (blockingReconciliationRefs.length > 0) {
    deferReasonCodes.add("PHARMACY_RECONCILIATION_OPEN");
  }
  if (
    blockingDuplicateClusterRefs.length > 0 ||
    blockingFallbackCaseRefs.length > 0 ||
    blockingIdentityRepairRefs.length > 0
  ) {
    deferReasonCodes.add("REPAIR_OR_REVIEW_OPEN");
  }
  if (blockingReachabilityRefs.length > 0) {
    deferReasonCodes.add("REACHABILITY_REPAIR_OPEN");
  }
  if (blockingGrantRefs.length > 0) {
    deferReasonCodes.add("LIVE_PHI_GRANT_PRESENT");
  }
  if (currentClosureBlockerRefs.length > 0 || currentConfirmationGateRefs.length > 0) {
    deferReasonCodes.add("MATERIALIZED_BLOCKERS_PRESENT");
  }
  if (blockingLineageCaseLinkRefs.length > 0) {
    deferReasonCodes.add("LINEAGE_BRANCH_STILL_ACTIVE");
  }
  if (
    (input.requiredCommandFollowingProjectionRefs?.length ?? 0) > 0 &&
    optionalRef(input.consumedCausalTokenRef) === null
  ) {
    deferReasonCodes.add("COMMAND_FOLLOWING_PROJECTION_PENDING");
  }
  if (optionalRef(input.terminalOutcomeRef) === null) {
    deferReasonCodes.add("TERMINAL_OUTCOME_MISSING");
  }
  if (input.episodeClosurePolicyState === "unsatisfied") {
    deferReasonCodes.add("EPISODE_POLICY_UNSATISFIED");
  }
  if (input.acknowledgementState === "unsatisfied") {
    deferReasonCodes.add("ACKNOWLEDGEMENT_REQUIRED");
  }
  if (
    blockingDegradedPromiseRefs.length > 0 ||
    input.consentAndDegradedConfirmationState === "unsatisfied"
  ) {
    deferReasonCodes.add("CONSENT_OR_DEGRADED_PROMISE_OPEN");
  }

  const derivedDecision: RequestClosureDecision = deferReasonCodes.size === 0 ? "close" : "defer";
  const requestedDecision = input.requestedDecision ?? "auto";
  if (requestedDecision !== "auto") {
    invariant(
      requestedDecision === derivedDecision,
      "REQUESTED_CLOSURE_DECISION_CONFLICTS",
      `Requested decision ${requestedDecision} is inconsistent with the canonical closure evaluation.`,
    );
  }

  const snapshot = RequestClosureRecordDocument.create({
    closureRecordId: requireRef(input.closureRecordId, "closureRecordId"),
    episodeId: requireRef(input.episodeId, "episodeId"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    evaluatedAt: ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"),
    requiredLineageEpoch: ensureNonNegativeInteger(
      input.requiredLineageEpoch,
      "requiredLineageEpoch",
    ),
    blockingLeaseRefs,
    blockingPreemptionRefs,
    blockingApprovalRefs,
    blockingReconciliationRefs,
    blockingConfirmationRefs,
    blockingLineageCaseLinkRefs,
    blockingDuplicateClusterRefs,
    blockingFallbackCaseRefs,
    blockingIdentityRepairRefs,
    blockingGrantRefs,
    blockingReachabilityRefs,
    blockingDegradedPromiseRefs,
    decision: derivedDecision,
    closedByMode:
      derivedDecision === "close"
        ? (input.closedByMode ?? "routine_terminal_outcome")
        : "not_closed",
    deferReasonCodes: [...deferReasonCodes].sort(),
    currentClosureBlockerRefs,
    currentConfirmationGateRefs,
    terminalOutcomeRef: optionalRef(input.terminalOutcomeRef),
    requiredCommandFollowingProjectionRefs: uniqueSortedRefs(
      input.requiredCommandFollowingProjectionRefs ?? [],
    ),
    consumedCausalTokenRef: optionalRef(input.consumedCausalTokenRef),
  }).toSnapshot();

  return {
    snapshot,
    blockerRefs: uniqueSortedRefs([
      ...snapshot.currentClosureBlockerRefs,
      ...snapshot.currentConfirmationGateRefs,
    ]),
    deferReasonCodes: [...snapshot.deferReasonCodes],
  };
}

export function assertRequestWorkflowCloseAllowed(
  closureRecord: RequestClosureRecordSnapshot,
): void {
  invariant(
    closureRecord.decision === "close",
    "REQUEST_WORKFLOW_CLOSE_REQUIRES_CLOSURE_RECORD",
    "Request.workflowState = closed requires RequestClosureRecord(decision = close).",
  );
  invariant(
    closureRecord.currentClosureBlockerRefs.length === 0 &&
      closureRecord.currentConfirmationGateRefs.length === 0,
    "REQUEST_WORKFLOW_CLOSE_WITH_ACTIVE_BLOCKERS",
    "Request.workflowState = closed is illegal while materialized blockers remain.",
  );
}

export function fallbackReviewCaseBlocksClosure(snapshot: FallbackReviewCaseSnapshot): boolean {
  return snapshot.caseState === "open";
}

export function resolveDefaultGovernedRecoveryFamily(
  triggerClass: FallbackTriggerClass,
): FallbackGovernedRecoveryFamily {
  switch (triggerClass) {
    case "auth_recovery":
      return "auth_recovery";
    case "degraded_dependency":
      return "dependency_recovery";
    default:
      return "accepted_progress";
  }
}

function buildFallbackReviewCaseSnapshot(
  input: OpenFallbackReviewCaseInput & { fallbackCaseId: string },
): FallbackReviewCaseSnapshot {
  return FallbackReviewCaseDocument.create({
    fallbackCaseId: input.fallbackCaseId,
    lineageScope: input.lineageScope,
    envelopeId: optionalRef(input.envelopeId),
    requestId: optionalRef(input.requestId),
    episodeId: optionalRef(input.episodeId),
    requestLineageRef: optionalRef(input.requestLineageRef),
    triggerClass: input.triggerClass,
    patientVisibleState: input.patientVisibleState,
    manualOwnerQueue: requireRef(input.manualOwnerQueue, "manualOwnerQueue"),
    slaAnchorAt: ensureIsoTimestamp(input.slaAnchorAt, "slaAnchorAt"),
    receiptIssuedAt: ensureIsoTimestamp(input.receiptIssuedAt, "receiptIssuedAt"),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt ?? input.createdAt, "updatedAt"),
    caseState: "open",
    closureBasis: "none",
    governedRecoveryFamily:
      input.governedRecoveryFamily ?? resolveDefaultGovernedRecoveryFamily(input.triggerClass),
    latestRecoveryEvidenceRef: optionalRef(input.latestRecoveryEvidenceRef),
    governedManualSettlementRef: null,
    supersededByCaseRef: null,
    closedAt: null,
    recoveredAt: null,
  }).toSnapshot();
}

export interface RequestClosureEventCatalogEntry {
  eventName: string;
  contractRef: string;
  stateMeaning: string;
}

export const requestClosureCanonicalEventEntries = [
  {
    eventName: "exception.review_case.opened",
    contractRef: "CEC_EXCEPTION_REVIEW_CASE_OPENED",
    stateMeaning: "FallbackReviewCase opened on the request lineage.",
  },
  {
    eventName: "exception.review_case.advanced",
    contractRef: "PARALLEL_INTERFACE_GAP_EXCEPTION_REVIEW_CASE_ADVANCED_EVENT",
    stateMeaning: "FallbackReviewCase manual-review posture advanced without leaving the lineage.",
  },
  {
    eventName: "exception.review_case.recovered",
    contractRef: "CEC_EXCEPTION_REVIEW_CASE_RECOVERED",
    stateMeaning: "FallbackReviewCase recovered under the same lineage.",
  },
  {
    eventName: "exception.review_case.closed",
    contractRef: "PARALLEL_INTERFACE_GAP_EXCEPTION_REVIEW_CASE_CLOSED_EVENT",
    stateMeaning:
      "FallbackReviewCase closed by recovery, supersession, or governed manual settlement.",
  },
  {
    eventName: "request.close.evaluated",
    contractRef: "CEC_REQUEST_CLOSE_EVALUATED",
    stateMeaning: "LifecycleCoordinator persisted a close-or-defer evaluation.",
  },
  {
    eventName: "request.close.deferred",
    contractRef: "PARALLEL_INTERFACE_GAP_REQUEST_CLOSE_DEFERRED_EVENT",
    stateMeaning: "LifecycleCoordinator persisted an explicit defer verdict.",
  },
  {
    eventName: "request.closed",
    contractRef: "CEC_REQUEST_CLOSED",
    stateMeaning: "LifecycleCoordinator persisted a close verdict.",
  },
  {
    eventName: "request.closure_blockers.changed",
    contractRef: "CEC_REQUEST_CLOSURE_BLOCKERS_CHANGED",
    stateMeaning: "Coordinator materialized blocker truth changed.",
  },
] as const satisfies readonly RequestClosureEventCatalogEntry[];

export const requestClosureParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_EXCEPTION_REVIEW_CASE_ADVANCED_EVENT",
  "PARALLEL_INTERFACE_GAP_EXCEPTION_REVIEW_CASE_CLOSED_EVENT",
  "PARALLEL_INTERFACE_GAP_REQUEST_CLOSE_DEFERRED_EVENT",
] as const;

export interface RequestClosureEvaluatedEventPayload {
  closureRecordId: string;
  requestId: string;
  requestLineageRef: string;
  decision: RequestClosureDecision;
  requiredLineageEpoch: number;
  deferReasonCodes: readonly ClosureDeferReasonCode[];
}

export interface RequestClosureBlockersChangedEventPayload {
  requestId: string;
  requestLineageRef: string;
  blockerRefs: readonly string[];
  confirmationGateRefs: readonly string[];
  materializedBlockerSetHash: string;
}

export interface FallbackReviewCaseEventPayload {
  fallbackCaseId: string;
  lineageScope: FallbackReviewLineageScope;
  requestId: string | null;
  episodeId: string | null;
  triggerClass: FallbackTriggerClass;
  caseState: FallbackCaseState;
}

export function makeRequestClosureEvaluatedEvent(
  snapshot: RequestClosureRecordSnapshot,
): FoundationEventEnvelope<RequestClosureEvaluatedEventPayload> {
  return makeFoundationEvent("request.close.evaluated", {
    closureRecordId: snapshot.closureRecordId,
    requestId: snapshot.requestId,
    requestLineageRef: snapshot.requestLineageRef,
    decision: snapshot.decision,
    requiredLineageEpoch: snapshot.requiredLineageEpoch,
    deferReasonCodes: snapshot.deferReasonCodes,
  });
}

export function makeRequestClosureDeferredEvent(
  snapshot: RequestClosureRecordSnapshot,
): FoundationEventEnvelope<RequestClosureEvaluatedEventPayload> {
  return makeFoundationEvent("request.close.deferred", {
    closureRecordId: snapshot.closureRecordId,
    requestId: snapshot.requestId,
    requestLineageRef: snapshot.requestLineageRef,
    decision: snapshot.decision,
    requiredLineageEpoch: snapshot.requiredLineageEpoch,
    deferReasonCodes: snapshot.deferReasonCodes,
  });
}

export function makeRequestClosedEvent(
  snapshot: RequestClosureRecordSnapshot,
): FoundationEventEnvelope<RequestClosureEvaluatedEventPayload> {
  return makeFoundationEvent("request.closed", {
    closureRecordId: snapshot.closureRecordId,
    requestId: snapshot.requestId,
    requestLineageRef: snapshot.requestLineageRef,
    decision: snapshot.decision,
    requiredLineageEpoch: snapshot.requiredLineageEpoch,
    deferReasonCodes: snapshot.deferReasonCodes,
  });
}

export function makeRequestClosureBlockersChangedEvent(
  snapshot: RequestClosureRecordSnapshot,
): FoundationEventEnvelope<RequestClosureBlockersChangedEventPayload> {
  return makeFoundationEvent("request.closure_blockers.changed", {
    requestId: snapshot.requestId,
    requestLineageRef: snapshot.requestLineageRef,
    blockerRefs: snapshot.currentClosureBlockerRefs,
    confirmationGateRefs: snapshot.currentConfirmationGateRefs,
    materializedBlockerSetHash: snapshot.materializedBlockerSetHash,
  });
}

export function makeFallbackReviewCaseEvent(
  eventName:
    | "exception.review_case.opened"
    | "exception.review_case.advanced"
    | "exception.review_case.recovered"
    | "exception.review_case.closed",
  snapshot: FallbackReviewCaseSnapshot,
): FoundationEventEnvelope<FallbackReviewCaseEventPayload> {
  return makeFoundationEvent(eventName, {
    fallbackCaseId: snapshot.fallbackCaseId,
    lineageScope: snapshot.lineageScope,
    requestId: snapshot.requestId,
    episodeId: snapshot.episodeId,
    triggerClass: snapshot.triggerClass,
    caseState: snapshot.caseState,
  });
}

export class InMemoryRequestClosureStore implements RequestClosureDependencies {
  private readonly closureRecords = new Map<string, PersistedRequestClosureRecordRow>();
  private readonly fallbackCases = new Map<string, PersistedFallbackReviewCaseRow>();
  private readonly fallbackCaseHistory = new Map<string, PersistedFallbackReviewCaseRow[]>();

  async saveRequestClosureRecord(
    row: PersistedRequestClosureRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const current = this.closureRecords.get(row.closureRecordId);
    invariant(
      current === undefined,
      "REQUEST_CLOSURE_RECORD_IMMUTABLE",
      "RequestClosureRecord is append-only and may not be overwritten.",
    );
    saveWithCas(this.closureRecords, row.closureRecordId, row, options);
  }

  async getRequestClosureRecord(
    closureRecordId: string,
  ): Promise<PersistedRequestClosureRecordRow | null> {
    return this.closureRecords.get(closureRecordId) ?? null;
  }

  async listRequestClosureRecordsByRequest(
    requestId: string,
  ): Promise<PersistedRequestClosureRecordRow[]> {
    return [...this.closureRecords.values()]
      .filter((row) => row.requestId === requestId)
      .sort(
        (left, right) =>
          compareIso(left.evaluatedAt, right.evaluatedAt) || left.version - right.version,
      );
  }

  async listRequestClosureRecordsByEpisode(
    episodeId: string,
  ): Promise<PersistedRequestClosureRecordRow[]> {
    return [...this.closureRecords.values()]
      .filter((row) => row.episodeId === episodeId)
      .sort(
        (left, right) =>
          compareIso(left.evaluatedAt, right.evaluatedAt) || left.version - right.version,
      );
  }

  async listRequestClosureRecordsByLineage(
    requestLineageRef: string,
  ): Promise<PersistedRequestClosureRecordRow[]> {
    return [...this.closureRecords.values()]
      .filter((row) => row.requestLineageRef === requestLineageRef)
      .sort(
        (left, right) =>
          compareIso(left.evaluatedAt, right.evaluatedAt) || left.version - right.version,
      );
  }

  async findLatestRequestClosureRecordForRequest(
    requestId: string,
  ): Promise<PersistedRequestClosureRecordRow | null> {
    const records = await this.listRequestClosureRecordsByRequest(requestId);
    return records.at(-1) ?? null;
  }

  async listActiveClosureRecords(filters?: {
    requestId?: string;
    episodeId?: string;
    requestLineageRef?: string;
    blockerClass?: ClosureBlockerClass;
    requiredLineageEpoch?: number;
  }): Promise<PersistedRequestClosureRecordRow[]> {
    const rows = [...this.closureRecords.values()].filter((row) => row.decision === "defer");
    return rows.filter((row) => {
      if (filters?.requestId && row.requestId !== filters.requestId) {
        return false;
      }
      if (filters?.episodeId && row.episodeId !== filters.episodeId) {
        return false;
      }
      if (filters?.requestLineageRef && row.requestLineageRef !== filters.requestLineageRef) {
        return false;
      }
      if (
        filters?.requiredLineageEpoch !== undefined &&
        row.requiredLineageEpoch !== filters.requiredLineageEpoch
      ) {
        return false;
      }
      if (filters?.blockerClass) {
        return listRequestClosureBlockerRefs(row, filters.blockerClass).length > 0;
      }
      return true;
    });
  }

  async saveFallbackReviewCase(
    row: PersistedFallbackReviewCaseRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.fallbackCases, row.fallbackCaseId, row, options);
    const history = this.fallbackCaseHistory.get(row.fallbackCaseId) ?? [];
    this.fallbackCaseHistory.set(row.fallbackCaseId, [...history, row]);
  }

  async getFallbackReviewCase(
    fallbackCaseId: string,
  ): Promise<PersistedFallbackReviewCaseRow | null> {
    return this.fallbackCases.get(fallbackCaseId) ?? null;
  }

  async listFallbackReviewCases(filters?: {
    requestId?: string;
    episodeId?: string;
    lineageScope?: FallbackReviewLineageScope;
    triggerClass?: FallbackTriggerClass;
    caseState?: FallbackCaseState;
  }): Promise<PersistedFallbackReviewCaseRow[]> {
    return [...this.fallbackCases.values()]
      .filter((row) => {
        if (filters?.requestId && row.requestId !== filters.requestId) {
          return false;
        }
        if (filters?.episodeId && row.episodeId !== filters.episodeId) {
          return false;
        }
        if (filters?.lineageScope && row.lineageScope !== filters.lineageScope) {
          return false;
        }
        if (filters?.triggerClass && row.triggerClass !== filters.triggerClass) {
          return false;
        }
        if (filters?.caseState && row.caseState !== filters.caseState) {
          return false;
        }
        return true;
      })
      .sort(
        (left, right) =>
          compareIso(left.createdAt, right.createdAt) || left.version - right.version,
      );
  }

  async listFallbackReviewCaseHistory(
    fallbackCaseId: string,
  ): Promise<readonly PersistedFallbackReviewCaseRow[]> {
    return this.fallbackCaseHistory.get(fallbackCaseId) ?? [];
  }
}

export function createRequestClosureStore(): RequestClosureDependencies {
  return new InMemoryRequestClosureStore();
}

export class RequestClosureAuthorityService {
  constructor(
    private readonly repositories: RequestClosureDependencies,
    private readonly idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "request_closure",
    ),
  ) {}

  async evaluateAndSave(input: RequestClosureEvaluationInput): Promise<{
    snapshot: RequestClosureRecordSnapshot;
    blockerRefs: readonly string[];
    deferReasonCodes: readonly ClosureDeferReasonCode[];
    emittedEvents: readonly FoundationEventEnvelope<object>[];
  }> {
    const evaluation = evaluateRequestClosure({
      ...input,
      closureRecordId:
        input.closureRecordId ?? nextClosureId(this.idGenerator, "requestClosureRecord"),
    });
    await this.repositories.saveRequestClosureRecord(
      RequestClosureRecordDocument.hydrate(evaluation.snapshot).toPersistedRow(),
    );

    const emittedEvents = [
      makeRequestClosureEvaluatedEvent(evaluation.snapshot),
      makeRequestClosureBlockersChangedEvent(evaluation.snapshot),
      evaluation.snapshot.decision === "close"
        ? makeRequestClosedEvent(evaluation.snapshot)
        : makeRequestClosureDeferredEvent(evaluation.snapshot),
    ] as const;

    return {
      snapshot: evaluation.snapshot,
      blockerRefs: evaluation.blockerRefs,
      deferReasonCodes: evaluation.deferReasonCodes,
      emittedEvents,
    };
  }

  async openFallbackReviewCase(input: OpenFallbackReviewCaseInput): Promise<{
    snapshot: FallbackReviewCaseSnapshot;
    emittedEvent: FoundationEventEnvelope<FallbackReviewCaseEventPayload>;
  }> {
    const snapshot = buildFallbackReviewCaseSnapshot({
      ...input,
      fallbackCaseId: input.fallbackCaseId ?? nextClosureId(this.idGenerator, "fallbackReviewCase"),
    });
    await this.repositories.saveFallbackReviewCase(
      FallbackReviewCaseDocument.hydrate(snapshot).toPersistedRow(),
    );
    return {
      snapshot,
      emittedEvent: makeFallbackReviewCaseEvent("exception.review_case.opened", snapshot),
    };
  }

  async advanceFallbackReviewCase(input: AdvanceFallbackReviewCaseInput): Promise<{
    snapshot: FallbackReviewCaseSnapshot;
    emittedEvent: FoundationEventEnvelope<FallbackReviewCaseEventPayload>;
  }> {
    const current = await this.requireFallbackCase(input.fallbackCaseId);
    invariant(
      current.caseState === "open",
      "FALLBACK_CASE_NOT_OPEN",
      "Only open fallback cases may advance manual-review posture.",
    );
    const snapshot = FallbackReviewCaseDocument.hydrate({
      ...current,
      patientVisibleState: input.patientVisibleState,
      manualOwnerQueue: input.manualOwnerQueue
        ? requireRef(input.manualOwnerQueue, "manualOwnerQueue")
        : current.manualOwnerQueue,
      updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
      latestRecoveryEvidenceRef:
        optionalRef(input.latestRecoveryEvidenceRef) ?? current.latestRecoveryEvidenceRef,
      version: current.version + 1,
    }).toSnapshot();
    await this.repositories.saveFallbackReviewCase(
      FallbackReviewCaseDocument.hydrate(snapshot).toPersistedRow(),
      { expectedVersion: current.version },
    );
    return {
      snapshot,
      emittedEvent: makeFallbackReviewCaseEvent("exception.review_case.advanced", snapshot),
    };
  }

  async recoverFallbackReviewCase(input: RecoverFallbackReviewCaseInput): Promise<{
    snapshot: FallbackReviewCaseSnapshot;
    emittedEvent: FoundationEventEnvelope<FallbackReviewCaseEventPayload>;
  }> {
    const current = await this.requireFallbackCase(input.fallbackCaseId);
    invariant(
      current.caseState === "open",
      "FALLBACK_CASE_NOT_OPEN",
      "Only open fallback cases may be recovered.",
    );
    const snapshot = FallbackReviewCaseDocument.hydrate({
      ...current,
      patientVisibleState: "recovered",
      caseState: "recovered",
      latestRecoveryEvidenceRef: requireRef(
        input.latestRecoveryEvidenceRef,
        "latestRecoveryEvidenceRef",
      ),
      recoveredAt: ensureIsoTimestamp(input.recoveredAt, "recoveredAt"),
      updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
      version: current.version + 1,
    }).toSnapshot();
    await this.repositories.saveFallbackReviewCase(
      FallbackReviewCaseDocument.hydrate(snapshot).toPersistedRow(),
      { expectedVersion: current.version },
    );
    return {
      snapshot,
      emittedEvent: makeFallbackReviewCaseEvent("exception.review_case.recovered", snapshot),
    };
  }

  async closeFallbackReviewCase(input: CloseFallbackReviewCaseInput): Promise<{
    snapshot: FallbackReviewCaseSnapshot;
    emittedEvent: FoundationEventEnvelope<FallbackReviewCaseEventPayload>;
  }> {
    const current = await this.requireFallbackCase(input.fallbackCaseId);
    if (input.closureBasis === "recovered") {
      invariant(
        current.caseState === "recovered",
        "FALLBACK_RECOVERY_CLOSE_REQUIRES_RECOVERED_STATE",
        "Fallback review may close by recovery only after recovery has been recorded.",
      );
    }
    if (input.closureBasis === "manual_settlement") {
      invariant(
        optionalRef(input.governedManualSettlementRef) !== null,
        "FALLBACK_MANUAL_SETTLEMENT_REQUIRES_REF",
        "Fallback review closed by manual settlement requires governedManualSettlementRef.",
      );
    }
    if (input.closureBasis === "superseded") {
      invariant(
        optionalRef(input.supersededByCaseRef) !== null,
        "FALLBACK_SUPERSESSION_REQUIRES_SUCCESSOR",
        "Fallback review closed by supersession requires supersededByCaseRef.",
      );
    }

    const snapshot = FallbackReviewCaseDocument.hydrate({
      ...current,
      patientVisibleState: "closed",
      caseState: "closed",
      closureBasis: input.closureBasis,
      governedManualSettlementRef:
        optionalRef(input.governedManualSettlementRef) ?? current.governedManualSettlementRef,
      supersededByCaseRef: optionalRef(input.supersededByCaseRef) ?? current.supersededByCaseRef,
      updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
      closedAt: ensureIsoTimestamp(input.closedAt, "closedAt"),
      version: current.version + 1,
    }).toSnapshot();
    await this.repositories.saveFallbackReviewCase(
      FallbackReviewCaseDocument.hydrate(snapshot).toPersistedRow(),
      { expectedVersion: current.version },
    );
    return {
      snapshot,
      emittedEvent: makeFallbackReviewCaseEvent("exception.review_case.closed", snapshot),
    };
  }

  private async requireFallbackCase(
    fallbackCaseId: string,
  ): Promise<PersistedFallbackReviewCaseRow> {
    const current = await this.repositories.getFallbackReviewCase(
      requireRef(fallbackCaseId, "fallbackCaseId"),
    );
    invariant(
      current !== null,
      "FALLBACK_CASE_NOT_FOUND",
      `FallbackReviewCase ${fallbackCaseId} does not exist.`,
    );
    return current;
  }
}

export function createRequestClosureAuthorityService(
  repositories: RequestClosureDependencies,
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator("request_closure"),
): RequestClosureAuthorityService {
  return new RequestClosureAuthorityService(repositories, idGenerator);
}

export interface RequestClosureSimulationResult {
  scenarioId: string;
  decision: RequestClosureDecision;
  closedByMode: RequestClosedByMode;
  deferReasonCodes: readonly ClosureDeferReasonCode[];
  blockerRefs: readonly string[];
  blockerFamily: ClosureBlockerClass | "none" | "stale_materialized_blockers";
  lineageScope: FallbackReviewLineageScope;
  closureRecord: RequestClosureRecordSnapshot;
  fallbackCase: FallbackReviewCaseSnapshot | null;
}

export class RequestClosureSimulationHarness {
  constructor(private readonly authority: RequestClosureAuthorityService) {}

  async runAllScenarios(): Promise<RequestClosureSimulationResult[]> {
    const duplicate = await this.authority.evaluateAndSave({
      episodeId: "episode_duplicate",
      requestId: "request_duplicate",
      requestLineageRef: "lineage_duplicate",
      evaluatedAt: "2026-04-12T22:40:00Z",
      requiredLineageEpoch: 5,
      blockingDuplicateClusterRefs: ["duplicate_cluster_001"],
      currentClosureBlockerRefs: ["duplicate_cluster_001"],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_duplicate",
      requiredCommandFollowingProjectionRefs: ["projection_duplicate"],
      consumedCausalTokenRef: "causal_duplicate",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    const fallbackCase = await this.authority.openFallbackReviewCase({
      lineageScope: "request",
      requestId: "request_fallback",
      episodeId: "episode_fallback",
      requestLineageRef: "lineage_fallback",
      triggerClass: "artifact_quarantine",
      patientVisibleState: "submitted_degraded",
      manualOwnerQueue: "manual_exception_review",
      slaAnchorAt: "2026-04-12T22:35:00Z",
      receiptIssuedAt: "2026-04-12T22:36:00Z",
      createdAt: "2026-04-12T22:36:00Z",
    });

    const fallback = await this.authority.evaluateAndSave({
      episodeId: "episode_fallback",
      requestId: "request_fallback",
      requestLineageRef: "lineage_fallback",
      evaluatedAt: "2026-04-12T22:41:00Z",
      requiredLineageEpoch: 6,
      blockingFallbackCaseRefs: [fallbackCase.snapshot.fallbackCaseId],
      currentClosureBlockerRefs: [fallbackCase.snapshot.fallbackCaseId],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_fallback",
      requiredCommandFollowingProjectionRefs: ["projection_fallback"],
      consumedCausalTokenRef: "causal_fallback",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    const identityRepair = await this.authority.evaluateAndSave({
      episodeId: "episode_identity",
      requestId: "request_identity",
      requestLineageRef: "lineage_identity",
      evaluatedAt: "2026-04-12T22:42:00Z",
      requiredLineageEpoch: 7,
      blockingIdentityRepairRefs: ["identity_repair_case_001"],
      currentClosureBlockerRefs: ["identity_repair_case_001"],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_identity",
      requiredCommandFollowingProjectionRefs: ["projection_identity"],
      consumedCausalTokenRef: "causal_identity",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    const confirmation = await this.authority.evaluateAndSave({
      episodeId: "episode_confirmation",
      requestId: "request_confirmation",
      requestLineageRef: "lineage_confirmation",
      evaluatedAt: "2026-04-12T22:43:00Z",
      requiredLineageEpoch: 8,
      blockingConfirmationRefs: ["confirmation_gate_001"],
      currentClosureBlockerRefs: [],
      currentConfirmationGateRefs: ["confirmation_gate_001"],
      terminalOutcomeRef: "outcome_confirmation",
      requiredCommandFollowingProjectionRefs: ["projection_confirmation"],
      consumedCausalTokenRef: "causal_confirmation",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "unsatisfied",
    });

    const grantAndReachability = await this.authority.evaluateAndSave({
      episodeId: "episode_grant_reachability",
      requestId: "request_grant_reachability",
      requestLineageRef: "lineage_grant_reachability",
      evaluatedAt: "2026-04-12T22:44:00Z",
      requiredLineageEpoch: 9,
      blockingGrantRefs: ["grant_001"],
      blockingReachabilityRefs: ["reachability_001"],
      currentClosureBlockerRefs: ["grant_001", "reachability_001"],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_grant_reachability",
      requiredCommandFollowingProjectionRefs: ["projection_grant_reachability"],
      consumedCausalTokenRef: "causal_grant_reachability",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    const staleMaterialized = await this.authority.evaluateAndSave({
      episodeId: "episode_stale",
      requestId: "request_stale",
      requestLineageRef: "lineage_stale",
      evaluatedAt: "2026-04-12T22:45:00Z",
      requiredLineageEpoch: 10,
      currentClosureBlockerRefs: ["stale_blocker_ref_001"],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_stale",
      requiredCommandFollowingProjectionRefs: ["projection_stale"],
      consumedCausalTokenRef: "causal_stale",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    const legalClose = await this.authority.evaluateAndSave({
      episodeId: "episode_close",
      requestId: "request_close",
      requestLineageRef: "lineage_close",
      evaluatedAt: "2026-04-12T22:46:00Z",
      requiredLineageEpoch: 11,
      currentClosureBlockerRefs: [],
      currentConfirmationGateRefs: [],
      terminalOutcomeRef: "outcome_close",
      requiredCommandFollowingProjectionRefs: ["projection_close"],
      consumedCausalTokenRef: "causal_close",
      outcomeTruthState: "satisfied",
      episodeClosurePolicyState: "satisfied",
      acknowledgementState: "satisfied",
      consentAndDegradedConfirmationState: "satisfied",
    });

    return [
      {
        scenarioId: "legal_close_no_blockers",
        decision: legalClose.snapshot.decision,
        closedByMode: legalClose.snapshot.closedByMode,
        deferReasonCodes: legalClose.deferReasonCodes,
        blockerRefs: legalClose.blockerRefs,
        blockerFamily: "none",
        lineageScope: "request",
        closureRecord: legalClose.snapshot,
        fallbackCase: null,
      },
      {
        scenarioId: "defer_duplicate_review_open",
        decision: duplicate.snapshot.decision,
        closedByMode: duplicate.snapshot.closedByMode,
        deferReasonCodes: duplicate.deferReasonCodes,
        blockerRefs: duplicate.blockerRefs,
        blockerFamily: "duplicate_review",
        lineageScope: "request",
        closureRecord: duplicate.snapshot,
        fallbackCase: null,
      },
      {
        scenarioId: "defer_fallback_review_after_degraded_progress",
        decision: fallback.snapshot.decision,
        closedByMode: fallback.snapshot.closedByMode,
        deferReasonCodes: fallback.deferReasonCodes,
        blockerRefs: fallback.blockerRefs,
        blockerFamily: "fallback_review",
        lineageScope: fallbackCase.snapshot.lineageScope,
        closureRecord: fallback.snapshot,
        fallbackCase: fallbackCase.snapshot,
      },
      {
        scenarioId: "defer_identity_repair_hold",
        decision: identityRepair.snapshot.decision,
        closedByMode: identityRepair.snapshot.closedByMode,
        deferReasonCodes: identityRepair.deferReasonCodes,
        blockerRefs: identityRepair.blockerRefs,
        blockerFamily: "identity_repair",
        lineageScope: "request",
        closureRecord: identityRepair.snapshot,
        fallbackCase: null,
      },
      {
        scenarioId: "defer_external_confirmation_pending",
        decision: confirmation.snapshot.decision,
        closedByMode: confirmation.snapshot.closedByMode,
        deferReasonCodes: confirmation.deferReasonCodes,
        blockerRefs: confirmation.blockerRefs,
        blockerFamily: "confirmation_gate",
        lineageScope: "request",
        closureRecord: confirmation.snapshot,
        fallbackCase: null,
      },
      {
        scenarioId: "defer_grant_and_reachability_repair",
        decision: grantAndReachability.snapshot.decision,
        closedByMode: grantAndReachability.snapshot.closedByMode,
        deferReasonCodes: grantAndReachability.deferReasonCodes,
        blockerRefs: grantAndReachability.blockerRefs,
        blockerFamily: "live_phi_grant",
        lineageScope: "request",
        closureRecord: grantAndReachability.snapshot,
        fallbackCase: null,
      },
      {
        scenarioId: "defer_stale_materialized_blocker_refs",
        decision: staleMaterialized.snapshot.decision,
        closedByMode: staleMaterialized.snapshot.closedByMode,
        deferReasonCodes: staleMaterialized.deferReasonCodes,
        blockerRefs: staleMaterialized.blockerRefs,
        blockerFamily: "stale_materialized_blockers",
        lineageScope: "request",
        closureRecord: staleMaterialized.snapshot,
        fallbackCase: null,
      },
    ];
  }
}

export function createRequestClosureSimulationHarness(options?: {
  repositories?: RequestClosureDependencies;
  authority?: RequestClosureAuthorityService;
  idGenerator?: BackboneIdGenerator;
}): RequestClosureSimulationHarness {
  const repositories = options?.repositories ?? createRequestClosureStore();
  const authority =
    options?.authority ??
    createRequestClosureAuthorityService(
      repositories,
      options?.idGenerator ?? createDeterministicBackboneIdGenerator("request_closure_sim"),
    );
  return new RequestClosureSimulationHarness(authority);
}
