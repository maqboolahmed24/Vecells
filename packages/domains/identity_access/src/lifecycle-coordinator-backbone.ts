import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  type LineageCaseLinkRepository,
  type RequestAggregate,
  type RequestLineageAggregate,
  type RequestLineageRepository,
  type RequestRepository,
  type RequestWorkflowState,
  RequestAggregate as KernelRequestAggregate,
  RequestBackboneInvariantError,
  RequestLineageAggregate as KernelRequestLineageAggregate,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  type EpisodeRepository,
  EpisodeAggregate,
  InMemorySubmissionLineageFoundationStore,
} from "./submission-lineage-backbone";
import {
  LineageFenceDocument,
  type LineageFenceIssuedFor,
  type LineageFenceRepository,
  type PersistedLineageFenceRow,
} from "./lease-fence-command-backbone";

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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function ensureHexHash(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    /^[a-f0-9]{64}$/i.test(normalized),
    `INVALID_${field.toUpperCase()}_HASH`,
    `${field} must be a 64-character hexadecimal digest.`,
  );
  return normalized.toLowerCase();
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

function nextLifecycleId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function addHours(timestamp: string, hours: number): string {
  return new Date(Date.parse(timestamp) + hours * 60 * 60 * 1000).toISOString();
}

const workflowRank: Record<RequestWorkflowState, number> = {
  submitted: 0,
  intake_normalized: 1,
  triage_ready: 2,
  triage_active: 3,
  handoff_active: 4,
  outcome_recorded: 5,
  closed: 6,
};

const workflowSteps: readonly RequestWorkflowState[] = [
  "submitted",
  "intake_normalized",
  "triage_ready",
  "triage_active",
  "handoff_active",
  "outcome_recorded",
  "closed",
] as const;

const allowedSignalMilestones = workflowSteps.slice(
  0,
  workflowSteps.length - 1,
) as readonly Exclude<RequestWorkflowState, "closed">[];

const materialChangeWeights = {
  clinical: 0.28,
  contact: 0.14,
  provider: 0.18,
  consent: 0.14,
  timing: 0.12,
  identity: 0.14,
} as const;

const lifecycleThresholds = {
  reopen: 0.45,
  reopenSecondary: 0.35,
  loop: 0.65,
  returnBudget: 3,
} as const;

export const missingTerminalOutcomeRef = "terminal-outcome://missing";

export type LifecycleSourceDomain =
  | "intake"
  | "triage"
  | "booking"
  | "hub"
  | "pharmacy"
  | "callback"
  | "messaging"
  | "recovery"
  | "support"
  | "system";

export type LifecycleSignalFamily =
  | "milestone"
  | "blocker"
  | "confirmation"
  | "lease"
  | "lineage_case"
  | "grant"
  | "repair"
  | "terminal_outcome"
  | "reopen";

export type LifecycleCloseMode =
  | "routine_terminal_outcome"
  | "governed_return_close"
  | "coordinator_episode_close"
  | "manually_authorized_exception_close"
  | "not_closed";

export type LifecycleDeferReasonCode =
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

export type LifecycleReopenTriggerFamily =
  | "materially_new_evidence"
  | "urgent_bounce_back"
  | "pharmacy_unable_to_complete"
  | "callback_escalation"
  | "wrong_patient_correction"
  | "booking_dispute"
  | "hub_return"
  | "contact_dependency_failure"
  | "manual_support_recovery";

export interface LifecycleBlockerVector {
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
}

export interface LifecycleSignalSnapshot extends LifecycleBlockerVector {
  signalId: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  sourceDomain: LifecycleSourceDomain;
  signalFamily: LifecycleSignalFamily;
  signalType: string;
  domainObjectRef: string;
  milestoneHint: Exclude<RequestWorkflowState, "closed"> | null;
  currentConfirmationGateRefs: readonly string[];
  requiredCommandFollowingProjectionRefs: readonly string[];
  terminalOutcomeRef: string | null;
  activeIdentityRepairCaseRef: string | null;
  sameShellRecoveryRouteRef: string | null;
  presentedLineageEpoch: number;
  partitionSequence: number;
  occurredAt: string;
  recordedAt: string;
  causalTokenRef: string;
  correlationRef: string;
  reopenTriggerFamily: LifecycleReopenTriggerFamily | null;
  reopenTargetState: Exclude<RequestWorkflowState, "closed"> | null;
  uUrgent: number;
  uUnable: number;
  uContact: number;
  uBounce: number;
  uRevocation: number;
  uContradiction: number;
  deltaClinical: number;
  deltaContact: number;
  deltaProvider: number;
  deltaConsent: number;
  deltaTiming: number;
  deltaIdentity: number;
  returnCount: number;
  signalDigest: string;
  version: number;
}

export interface PersistedLifecycleSignalRow extends LifecycleSignalSnapshot {
  aggregateType: "LifecycleSignal";
  persistenceSchemaVersion: 1;
}

export class LifecycleSignalDocument {
  private readonly snapshot: LifecycleSignalSnapshot;

  private constructor(snapshot: LifecycleSignalSnapshot) {
    this.snapshot = LifecycleSignalDocument.normalize(snapshot);
  }

  static create(
    input: Omit<LifecycleSignalSnapshot, "version" | "signalDigest">,
  ): LifecycleSignalDocument {
    const signalDigest = buildLifecycleSignalDigest(input);
    return new LifecycleSignalDocument({
      ...input,
      signalDigest,
      version: 1,
    });
  }

  static hydrate(snapshot: LifecycleSignalSnapshot): LifecycleSignalDocument {
    return new LifecycleSignalDocument(snapshot);
  }

  private static normalize(snapshot: LifecycleSignalSnapshot): LifecycleSignalSnapshot {
    ensurePositiveInteger(snapshot.partitionSequence, "partitionSequence");
    ensurePositiveInteger(snapshot.presentedLineageEpoch, "presentedLineageEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    ensureUnitInterval(snapshot.uUrgent, "uUrgent");
    ensureUnitInterval(snapshot.uUnable, "uUnable");
    ensureUnitInterval(snapshot.uContact, "uContact");
    ensureUnitInterval(snapshot.uBounce, "uBounce");
    ensureUnitInterval(snapshot.uRevocation, "uRevocation");
    ensureUnitInterval(snapshot.uContradiction, "uContradiction");
    ensureUnitInterval(snapshot.deltaClinical, "deltaClinical");
    ensureUnitInterval(snapshot.deltaContact, "deltaContact");
    ensureUnitInterval(snapshot.deltaProvider, "deltaProvider");
    ensureUnitInterval(snapshot.deltaConsent, "deltaConsent");
    ensureUnitInterval(snapshot.deltaTiming, "deltaTiming");
    ensureUnitInterval(snapshot.deltaIdentity, "deltaIdentity");
    ensureNonNegativeInteger(snapshot.returnCount, "returnCount");
    invariant(
      snapshot.milestoneHint === null ||
        allowedSignalMilestones.includes(
          snapshot.milestoneHint as Exclude<RequestWorkflowState, "closed">,
        ),
      "SIGNAL_MAY_NOT_CLOSE_REQUEST_DIRECTLY",
      "Child-domain lifecycle signals may not write Request.workflowState = closed directly.",
    );
    invariant(
      !snapshot.signalType.toLowerCase().includes("request.closed"),
      "SIGNAL_MAY_NOT_DECLARE_REQUEST_CLOSED",
      "Lifecycle signals may not masquerade as coordinator-owned request.closed events.",
    );
    return {
      ...snapshot,
      signalId: requireRef(snapshot.signalId, "signalId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      signalType: requireRef(snapshot.signalType, "signalType"),
      domainObjectRef: requireRef(snapshot.domainObjectRef, "domainObjectRef"),
      currentConfirmationGateRefs: uniqueSortedRefs(snapshot.currentConfirmationGateRefs),
      requiredCommandFollowingProjectionRefs: uniqueSortedRefs(
        snapshot.requiredCommandFollowingProjectionRefs,
      ),
      blockingLeaseRefs: uniqueSortedRefs(snapshot.blockingLeaseRefs ?? []),
      blockingPreemptionRefs: uniqueSortedRefs(snapshot.blockingPreemptionRefs ?? []),
      blockingApprovalRefs: uniqueSortedRefs(snapshot.blockingApprovalRefs ?? []),
      blockingReconciliationRefs: uniqueSortedRefs(snapshot.blockingReconciliationRefs ?? []),
      blockingConfirmationRefs: uniqueSortedRefs(snapshot.blockingConfirmationRefs ?? []),
      blockingLineageCaseLinkRefs: uniqueSortedRefs(snapshot.blockingLineageCaseLinkRefs ?? []),
      blockingDuplicateClusterRefs: uniqueSortedRefs(snapshot.blockingDuplicateClusterRefs ?? []),
      blockingFallbackCaseRefs: uniqueSortedRefs(snapshot.blockingFallbackCaseRefs ?? []),
      blockingIdentityRepairRefs: uniqueSortedRefs(snapshot.blockingIdentityRepairRefs ?? []),
      blockingGrantRefs: uniqueSortedRefs(snapshot.blockingGrantRefs ?? []),
      blockingReachabilityRefs: uniqueSortedRefs(snapshot.blockingReachabilityRefs ?? []),
      blockingDegradedPromiseRefs: uniqueSortedRefs(snapshot.blockingDegradedPromiseRefs ?? []),
      terminalOutcomeRef: optionalRef(snapshot.terminalOutcomeRef),
      activeIdentityRepairCaseRef: optionalRef(snapshot.activeIdentityRepairCaseRef),
      sameShellRecoveryRouteRef: optionalRef(snapshot.sameShellRecoveryRouteRef),
      occurredAt: ensureIsoTimestamp(snapshot.occurredAt, "occurredAt"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
      causalTokenRef: requireRef(snapshot.causalTokenRef, "causalTokenRef"),
      correlationRef: requireRef(snapshot.correlationRef, "correlationRef"),
      signalDigest: ensureHexHash(snapshot.signalDigest, "signalDigest"),
    };
  }

  get signalId(): string {
    return this.snapshot.signalId;
  }

  get partitionSequence(): number {
    return this.snapshot.partitionSequence;
  }

  get signalDigest(): string {
    return this.snapshot.signalDigest;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): LifecycleSignalSnapshot {
    return {
      ...this.snapshot,
      currentConfirmationGateRefs: [...this.snapshot.currentConfirmationGateRefs],
      requiredCommandFollowingProjectionRefs: [
        ...this.snapshot.requiredCommandFollowingProjectionRefs,
      ],
      blockingLeaseRefs: [...(this.snapshot.blockingLeaseRefs ?? [])],
      blockingPreemptionRefs: [...(this.snapshot.blockingPreemptionRefs ?? [])],
      blockingApprovalRefs: [...(this.snapshot.blockingApprovalRefs ?? [])],
      blockingReconciliationRefs: [...(this.snapshot.blockingReconciliationRefs ?? [])],
      blockingConfirmationRefs: [...(this.snapshot.blockingConfirmationRefs ?? [])],
      blockingLineageCaseLinkRefs: [...(this.snapshot.blockingLineageCaseLinkRefs ?? [])],
      blockingDuplicateClusterRefs: [...(this.snapshot.blockingDuplicateClusterRefs ?? [])],
      blockingFallbackCaseRefs: [...(this.snapshot.blockingFallbackCaseRefs ?? [])],
      blockingIdentityRepairRefs: [...(this.snapshot.blockingIdentityRepairRefs ?? [])],
      blockingGrantRefs: [...(this.snapshot.blockingGrantRefs ?? [])],
      blockingReachabilityRefs: [...(this.snapshot.blockingReachabilityRefs ?? [])],
      blockingDegradedPromiseRefs: [...(this.snapshot.blockingDegradedPromiseRefs ?? [])],
    };
  }
}

export interface LifecycleClosureRecordSnapshot extends LifecycleBlockerVector {
  closureRecordId: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  evaluatedAt: string;
  requiredLineageEpoch: number;
  decision: "close" | "defer";
  closedByMode: LifecycleCloseMode;
  deferReasonCodes: readonly LifecycleDeferReasonCode[];
  currentClosureBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  terminalOutcomeRef: string;
  requiredCommandFollowingProjectionRefs: readonly string[];
  consumedCausalTokenRef: string;
  materializedBlockerSetHash: string;
  version: number;
}

export interface PersistedLifecycleClosureRecordRow extends LifecycleClosureRecordSnapshot {
  aggregateType: "RequestClosureRecord";
  persistenceSchemaVersion: 1;
}

export class LifecycleClosureRecordDocument {
  private readonly snapshot: LifecycleClosureRecordSnapshot;

  private constructor(snapshot: LifecycleClosureRecordSnapshot) {
    this.snapshot = LifecycleClosureRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<LifecycleClosureRecordSnapshot, "version" | "materializedBlockerSetHash">,
  ): LifecycleClosureRecordDocument {
    const materializedBlockerSetHash = hashMaterializedBlockerSet(input);
    return new LifecycleClosureRecordDocument({
      ...input,
      materializedBlockerSetHash,
      version: 1,
    });
  }

  static hydrate(snapshot: LifecycleClosureRecordSnapshot): LifecycleClosureRecordDocument {
    return new LifecycleClosureRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: LifecycleClosureRecordSnapshot,
  ): LifecycleClosureRecordSnapshot {
    ensurePositiveInteger(snapshot.requiredLineageEpoch, "requiredLineageEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    const normalized = {
      ...snapshot,
      closureRecordId: requireRef(snapshot.closureRecordId, "closureRecordId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
      blockingLeaseRefs: uniqueSortedRefs(snapshot.blockingLeaseRefs ?? []),
      blockingPreemptionRefs: uniqueSortedRefs(snapshot.blockingPreemptionRefs ?? []),
      blockingApprovalRefs: uniqueSortedRefs(snapshot.blockingApprovalRefs ?? []),
      blockingReconciliationRefs: uniqueSortedRefs(snapshot.blockingReconciliationRefs ?? []),
      blockingConfirmationRefs: uniqueSortedRefs(snapshot.blockingConfirmationRefs ?? []),
      blockingLineageCaseLinkRefs: uniqueSortedRefs(snapshot.blockingLineageCaseLinkRefs ?? []),
      blockingDuplicateClusterRefs: uniqueSortedRefs(snapshot.blockingDuplicateClusterRefs ?? []),
      blockingFallbackCaseRefs: uniqueSortedRefs(snapshot.blockingFallbackCaseRefs ?? []),
      blockingIdentityRepairRefs: uniqueSortedRefs(snapshot.blockingIdentityRepairRefs ?? []),
      blockingGrantRefs: uniqueSortedRefs(snapshot.blockingGrantRefs ?? []),
      blockingReachabilityRefs: uniqueSortedRefs(snapshot.blockingReachabilityRefs ?? []),
      blockingDegradedPromiseRefs: uniqueSortedRefs(snapshot.blockingDegradedPromiseRefs ?? []),
      deferReasonCodes: [...new Set(snapshot.deferReasonCodes)].sort(),
      currentClosureBlockerRefs: uniqueSortedRefs(snapshot.currentClosureBlockerRefs),
      currentConfirmationGateRefs: uniqueSortedRefs(snapshot.currentConfirmationGateRefs),
      requiredCommandFollowingProjectionRefs: uniqueSortedRefs(
        snapshot.requiredCommandFollowingProjectionRefs,
      ),
      terminalOutcomeRef: requireRef(snapshot.terminalOutcomeRef, "terminalOutcomeRef"),
      consumedCausalTokenRef: requireRef(snapshot.consumedCausalTokenRef, "consumedCausalTokenRef"),
      materializedBlockerSetHash: requireRef(
        snapshot.materializedBlockerSetHash,
        "materializedBlockerSetHash",
      ),
    };

    const hash = hashMaterializedBlockerSet(normalized);
    invariant(
      hash === normalized.materializedBlockerSetHash,
      "REQUEST_CLOSURE_RECORD_HASH_DRIFT",
      "RequestClosureRecord.materializedBlockerSetHash must match the blocker payload.",
    );

    const allBlockingRefs = collectMaterializedClosureRefs(normalized);
    if (normalized.decision === "close") {
      invariant(
        normalized.closedByMode !== "not_closed",
        "REQUEST_CLOSE_MODE_INVALID",
        "Close decisions must preserve an explicit closedByMode.",
      );
      invariant(
        normalized.deferReasonCodes.length === 0,
        "REQUEST_CLOSE_MAY_NOT_DEFER",
        "Close decisions may not carry defer reasons.",
      );
      invariant(
        allBlockingRefs.length === 0 &&
          normalized.currentConfirmationGateRefs.length === 0 &&
          normalized.requiredCommandFollowingProjectionRefs.length === 0,
        "REQUEST_CLOSE_REQUIRES_EMPTY_BLOCKERS",
        "Close decisions require empty blocker, confirmation, and command-following sets.",
      );
      invariant(
        normalized.terminalOutcomeRef !== missingTerminalOutcomeRef,
        "REQUEST_CLOSE_REQUIRES_TERMINAL_OUTCOME",
        "Close decisions require a real terminalOutcomeRef.",
      );
    } else {
      invariant(
        normalized.closedByMode === "not_closed",
        "REQUEST_DEFER_REQUIRES_NOT_CLOSED_MODE",
        "Defer decisions must preserve closedByMode = not_closed.",
      );
      invariant(
        normalized.deferReasonCodes.length > 0,
        "REQUEST_DEFER_REQUIRES_REASON_CODES",
        "Defer decisions must carry explicit deferReasonCodes.",
      );
    }

    return normalized;
  }

  get closureRecordId(): string {
    return this.snapshot.closureRecordId;
  }

  get decision(): "close" | "defer" {
    return this.snapshot.decision;
  }

  get requiredLineageEpoch(): number {
    return this.snapshot.requiredLineageEpoch;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): LifecycleClosureRecordSnapshot {
    return {
      ...this.snapshot,
      blockingLeaseRefs: [...(this.snapshot.blockingLeaseRefs ?? [])],
      blockingPreemptionRefs: [...(this.snapshot.blockingPreemptionRefs ?? [])],
      blockingApprovalRefs: [...(this.snapshot.blockingApprovalRefs ?? [])],
      blockingReconciliationRefs: [...(this.snapshot.blockingReconciliationRefs ?? [])],
      blockingConfirmationRefs: [...(this.snapshot.blockingConfirmationRefs ?? [])],
      blockingLineageCaseLinkRefs: [...(this.snapshot.blockingLineageCaseLinkRefs ?? [])],
      blockingDuplicateClusterRefs: [...(this.snapshot.blockingDuplicateClusterRefs ?? [])],
      blockingFallbackCaseRefs: [...(this.snapshot.blockingFallbackCaseRefs ?? [])],
      blockingIdentityRepairRefs: [...(this.snapshot.blockingIdentityRepairRefs ?? [])],
      blockingGrantRefs: [...(this.snapshot.blockingGrantRefs ?? [])],
      blockingReachabilityRefs: [...(this.snapshot.blockingReachabilityRefs ?? [])],
      blockingDegradedPromiseRefs: [...(this.snapshot.blockingDegradedPromiseRefs ?? [])],
      deferReasonCodes: [...this.snapshot.deferReasonCodes],
      currentClosureBlockerRefs: [...this.snapshot.currentClosureBlockerRefs],
      currentConfirmationGateRefs: [...this.snapshot.currentConfirmationGateRefs],
      requiredCommandFollowingProjectionRefs: [
        ...this.snapshot.requiredCommandFollowingProjectionRefs,
      ],
    };
  }
}

export interface GovernedReopenRecordSnapshot {
  reopenRecordId: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  sourceSignalRef: string;
  priorClosureRecordRef: string | null;
  requiredLineageEpoch: number;
  reopenTriggerFamily: LifecycleReopenTriggerFamily;
  uUrgent: number;
  uUnable: number;
  uContact: number;
  uBounce: number;
  uRevocation: number;
  uContradiction: number;
  materialChange: number;
  loopRisk: number;
  reopenSignal: number;
  reopenPriorityBand: number;
  reopenedToWorkflowState: Exclude<RequestWorkflowState, "closed">;
  reopenedAt: string;
  version: number;
}

export interface PersistedGovernedReopenRecordRow extends GovernedReopenRecordSnapshot {
  aggregateType: "GovernedReopenRecord";
  persistenceSchemaVersion: 1;
}

export class GovernedReopenRecordDocument {
  private readonly snapshot: GovernedReopenRecordSnapshot;

  private constructor(snapshot: GovernedReopenRecordSnapshot) {
    this.snapshot = GovernedReopenRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<GovernedReopenRecordSnapshot, "version">,
  ): GovernedReopenRecordDocument {
    return new GovernedReopenRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: GovernedReopenRecordSnapshot): GovernedReopenRecordDocument {
    return new GovernedReopenRecordDocument(snapshot);
  }

  private static normalize(snapshot: GovernedReopenRecordSnapshot): GovernedReopenRecordSnapshot {
    ensurePositiveInteger(snapshot.requiredLineageEpoch, "requiredLineageEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    ensureUnitInterval(snapshot.uUrgent, "uUrgent");
    ensureUnitInterval(snapshot.uUnable, "uUnable");
    ensureUnitInterval(snapshot.uContact, "uContact");
    ensureUnitInterval(snapshot.uBounce, "uBounce");
    ensureUnitInterval(snapshot.uRevocation, "uRevocation");
    ensureUnitInterval(snapshot.uContradiction, "uContradiction");
    ensureUnitInterval(snapshot.materialChange, "materialChange");
    ensureUnitInterval(snapshot.loopRisk, "loopRisk");
    ensureUnitInterval(snapshot.reopenSignal, "reopenSignal");
    return {
      ...snapshot,
      reopenRecordId: requireRef(snapshot.reopenRecordId, "reopenRecordId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      sourceSignalRef: requireRef(snapshot.sourceSignalRef, "sourceSignalRef"),
      priorClosureRecordRef: optionalRef(snapshot.priorClosureRecordRef),
      reopenedAt: ensureIsoTimestamp(snapshot.reopenedAt, "reopenedAt"),
    };
  }

  get reopenRecordId(): string {
    return this.snapshot.reopenRecordId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): GovernedReopenRecordSnapshot {
    return { ...this.snapshot };
  }
}

export interface LifecycleCoordinatorEventEnvelope<TPayload = Record<string, unknown>> {
  eventType:
    | "request.closure_blockers.changed"
    | "request.workflow.changed"
    | "request.close.evaluated"
    | "request.closed"
    | "request.reopened";
  emittedAt: string;
  payload: TPayload;
}

export interface LifecycleMaterializedState extends LifecycleBlockerVector {
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  signalRefs: readonly string[];
  currentClosureBlockerRefs: readonly string[];
  currentConfirmationGateRefs: readonly string[];
  requiredCommandFollowingProjectionRefs: readonly string[];
  terminalOutcomeRef: string | null;
  derivedWorkflowState: Exclude<RequestWorkflowState, "closed">;
  activeIdentityRepairCaseRef: string | null;
}

export interface LifecycleSignalRepository {
  getLifecycleSignal(signalId: string): Promise<LifecycleSignalDocument | undefined>;
  listLifecycleSignals(): Promise<readonly LifecycleSignalDocument[]>;
  listLifecycleSignalsForEpisode(episodeId: string): Promise<readonly LifecycleSignalDocument[]>;
  listLifecycleSignalsForRequest(requestId: string): Promise<readonly LifecycleSignalDocument[]>;
  saveLifecycleSignal(
    signal: LifecycleSignalDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface LifecycleClosureRecordRepository {
  getRequestClosureRecord(
    closureRecordId: string,
  ): Promise<LifecycleClosureRecordDocument | undefined>;
  listRequestClosureRecords(): Promise<readonly LifecycleClosureRecordDocument[]>;
  listRequestClosureRecordsForRequest(
    requestId: string,
  ): Promise<readonly LifecycleClosureRecordDocument[]>;
  getLatestRequestClosureRecordForRequest(
    requestId: string,
  ): Promise<LifecycleClosureRecordDocument | undefined>;
  saveRequestClosureRecord(
    record: LifecycleClosureRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface GovernedReopenRecordRepository {
  listGovernedReopenRecords(): Promise<readonly GovernedReopenRecordDocument[]>;
  listGovernedReopenRecordsForRequest(
    requestId: string,
  ): Promise<readonly GovernedReopenRecordDocument[]>;
  saveGovernedReopenRecord(
    record: GovernedReopenRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface LifecycleCoordinatorEventRepository {
  listLifecycleCoordinatorEvents(): Promise<readonly LifecycleCoordinatorEventEnvelope[]>;
  appendLifecycleCoordinatorEvents(
    events: readonly LifecycleCoordinatorEventEnvelope[],
  ): Promise<void>;
}

export interface LifecycleCoordinatorDependencies
  extends RequestRepository,
    RequestLineageRepository,
    LineageCaseLinkRepository,
    EpisodeRepository,
    LineageFenceRepository,
    LifecycleSignalRepository,
    LifecycleClosureRecordRepository,
    GovernedReopenRecordRepository,
    LifecycleCoordinatorEventRepository {}

export class InMemoryLifecycleCoordinatorStore
  extends InMemorySubmissionLineageFoundationStore
  implements LifecycleCoordinatorDependencies
{
  private readonly lifecycleSignals = new Map<string, PersistedLifecycleSignalRow>();
  private readonly closureRecords = new Map<string, PersistedLifecycleClosureRecordRow>();
  private readonly reopenRecords = new Map<string, PersistedGovernedReopenRecordRow>();
  private readonly lineageFences = new Map<string, PersistedLineageFenceRow>();
  private readonly latestFenceByEpisode = new Map<string, string>();
  private readonly lifecycleEvents: LifecycleCoordinatorEventEnvelope[] = [];

  async getLifecycleSignal(signalId: string): Promise<LifecycleSignalDocument | undefined> {
    const row = this.lifecycleSignals.get(signalId);
    return row ? LifecycleSignalDocument.hydrate(row) : undefined;
  }

  async listLifecycleSignals(): Promise<readonly LifecycleSignalDocument[]> {
    return [...this.lifecycleSignals.values()]
      .sort((left, right) => left.partitionSequence - right.partitionSequence)
      .map((row) => LifecycleSignalDocument.hydrate(row));
  }

  async listLifecycleSignalsForEpisode(
    episodeId: string,
  ): Promise<readonly LifecycleSignalDocument[]> {
    return [...this.lifecycleSignals.values()]
      .filter((row) => row.episodeId === episodeId)
      .sort((left, right) => left.partitionSequence - right.partitionSequence)
      .map((row) => LifecycleSignalDocument.hydrate(row));
  }

  async listLifecycleSignalsForRequest(
    requestId: string,
  ): Promise<readonly LifecycleSignalDocument[]> {
    return [...this.lifecycleSignals.values()]
      .filter((row) => row.requestId === requestId)
      .sort((left, right) => left.partitionSequence - right.partitionSequence)
      .map((row) => LifecycleSignalDocument.hydrate(row));
  }

  async saveLifecycleSignal(
    signal: LifecycleSignalDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = signal.toSnapshot();
    saveWithCas(
      this.lifecycleSignals,
      row.signalId,
      {
        ...row,
        aggregateType: "LifecycleSignal",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getRequestClosureRecord(
    closureRecordId: string,
  ): Promise<LifecycleClosureRecordDocument | undefined> {
    const row = this.closureRecords.get(closureRecordId);
    return row ? LifecycleClosureRecordDocument.hydrate(row) : undefined;
  }

  async listRequestClosureRecords(): Promise<readonly LifecycleClosureRecordDocument[]> {
    return [...this.closureRecords.values()]
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt))
      .map((row) => LifecycleClosureRecordDocument.hydrate(row));
  }

  async listRequestClosureRecordsForRequest(
    requestId: string,
  ): Promise<readonly LifecycleClosureRecordDocument[]> {
    return [...this.closureRecords.values()]
      .filter((row) => row.requestId === requestId)
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt))
      .map((row) => LifecycleClosureRecordDocument.hydrate(row));
  }

  async getLatestRequestClosureRecordForRequest(
    requestId: string,
  ): Promise<LifecycleClosureRecordDocument | undefined> {
    return (await this.listRequestClosureRecordsForRequest(requestId)).at(-1);
  }

  async saveRequestClosureRecord(
    record: LifecycleClosureRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = record.toSnapshot();
    saveWithCas(
      this.closureRecords,
      row.closureRecordId,
      {
        ...row,
        aggregateType: "RequestClosureRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listGovernedReopenRecords(): Promise<readonly GovernedReopenRecordDocument[]> {
    return [...this.reopenRecords.values()]
      .sort((left, right) => compareIso(left.reopenedAt, right.reopenedAt))
      .map((row) => GovernedReopenRecordDocument.hydrate(row));
  }

  async listGovernedReopenRecordsForRequest(
    requestId: string,
  ): Promise<readonly GovernedReopenRecordDocument[]> {
    return [...this.reopenRecords.values()]
      .filter((row) => row.requestId === requestId)
      .sort((left, right) => compareIso(left.reopenedAt, right.reopenedAt))
      .map((row) => GovernedReopenRecordDocument.hydrate(row));
  }

  async saveGovernedReopenRecord(
    record: GovernedReopenRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = record.toSnapshot();
    saveWithCas(
      this.reopenRecords,
      row.reopenRecordId,
      {
        ...row,
        aggregateType: "GovernedReopenRecord",
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
    const currentFenceId = this.latestFenceByEpisode.get(episodeId);
    if (!currentFenceId) {
      return undefined;
    }
    const row = this.lineageFences.get(currentFenceId);
    return row ? LineageFenceDocument.hydrate(row) : undefined;
  }

  async listLineageFences(): Promise<readonly LineageFenceDocument[]> {
    return [...this.lineageFences.values()]
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt))
      .map((row) => LineageFenceDocument.hydrate(row));
  }

  async listLifecycleCoordinatorEvents(): Promise<readonly LifecycleCoordinatorEventEnvelope[]> {
    return [...this.lifecycleEvents];
  }

  async appendLifecycleCoordinatorEvents(
    events: readonly LifecycleCoordinatorEventEnvelope[],
  ): Promise<void> {
    this.lifecycleEvents.push(...events);
  }
}

export function createLifecycleCoordinatorStore(): LifecycleCoordinatorDependencies {
  return new InMemoryLifecycleCoordinatorStore();
}

function buildLifecycleSignalDigest(
  input: Omit<LifecycleSignalSnapshot, "version" | "signalDigest">,
): string {
  return sha256Hex(
    stableStringify({
      episodeId: input.episodeId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      sourceDomain: input.sourceDomain,
      signalFamily: input.signalFamily,
      signalType: input.signalType,
      domainObjectRef: input.domainObjectRef,
      milestoneHint: input.milestoneHint,
      blockers: {
        blockingLeaseRefs: uniqueSortedRefs(input.blockingLeaseRefs ?? []),
        blockingPreemptionRefs: uniqueSortedRefs(input.blockingPreemptionRefs ?? []),
        blockingApprovalRefs: uniqueSortedRefs(input.blockingApprovalRefs ?? []),
        blockingReconciliationRefs: uniqueSortedRefs(input.blockingReconciliationRefs ?? []),
        blockingConfirmationRefs: uniqueSortedRefs(input.blockingConfirmationRefs ?? []),
        blockingLineageCaseLinkRefs: uniqueSortedRefs(input.blockingLineageCaseLinkRefs ?? []),
        blockingDuplicateClusterRefs: uniqueSortedRefs(input.blockingDuplicateClusterRefs ?? []),
        blockingFallbackCaseRefs: uniqueSortedRefs(input.blockingFallbackCaseRefs ?? []),
        blockingIdentityRepairRefs: uniqueSortedRefs(input.blockingIdentityRepairRefs ?? []),
        blockingGrantRefs: uniqueSortedRefs(input.blockingGrantRefs ?? []),
        blockingReachabilityRefs: uniqueSortedRefs(input.blockingReachabilityRefs ?? []),
        blockingDegradedPromiseRefs: uniqueSortedRefs(input.blockingDegradedPromiseRefs ?? []),
      },
      currentConfirmationGateRefs: uniqueSortedRefs(input.currentConfirmationGateRefs),
      requiredCommandFollowingProjectionRefs: uniqueSortedRefs(
        input.requiredCommandFollowingProjectionRefs,
      ),
      terminalOutcomeRef: optionalRef(input.terminalOutcomeRef),
      activeIdentityRepairCaseRef: optionalRef(input.activeIdentityRepairCaseRef),
      sameShellRecoveryRouteRef: optionalRef(input.sameShellRecoveryRouteRef),
      presentedLineageEpoch: input.presentedLineageEpoch,
      occurredAt: input.occurredAt,
      causalTokenRef: input.causalTokenRef,
      correlationRef: input.correlationRef,
      reopenTriggerFamily: input.reopenTriggerFamily,
      reopenTargetState: input.reopenTargetState,
      uUrgent: input.uUrgent,
      uUnable: input.uUnable,
      uContact: input.uContact,
      uBounce: input.uBounce,
      uRevocation: input.uRevocation,
      uContradiction: input.uContradiction,
      deltaClinical: input.deltaClinical,
      deltaContact: input.deltaContact,
      deltaProvider: input.deltaProvider,
      deltaConsent: input.deltaConsent,
      deltaTiming: input.deltaTiming,
      deltaIdentity: input.deltaIdentity,
      returnCount: input.returnCount,
    }),
  );
}

function collectMaterializedClosureRefs(input: LifecycleBlockerVector): string[] {
  return uniqueSortedRefs([
    ...(input.blockingLeaseRefs ?? []),
    ...(input.blockingPreemptionRefs ?? []),
    ...(input.blockingApprovalRefs ?? []),
    ...(input.blockingReconciliationRefs ?? []),
    ...(input.blockingLineageCaseLinkRefs ?? []),
    ...(input.blockingDuplicateClusterRefs ?? []),
    ...(input.blockingFallbackCaseRefs ?? []),
    ...(input.blockingIdentityRepairRefs ?? []),
    ...(input.blockingGrantRefs ?? []),
    ...(input.blockingReachabilityRefs ?? []),
    ...(input.blockingDegradedPromiseRefs ?? []),
  ]);
}

function hashMaterializedBlockerSet(
  input: Pick<
    LifecycleClosureRecordSnapshot,
    | keyof LifecycleBlockerVector
    | "currentClosureBlockerRefs"
    | "currentConfirmationGateRefs"
    | "requiredCommandFollowingProjectionRefs"
  >,
): string {
  return sha256Hex(
    stableStringify({
      blockingLeaseRefs: uniqueSortedRefs(input.blockingLeaseRefs ?? []),
      blockingPreemptionRefs: uniqueSortedRefs(input.blockingPreemptionRefs ?? []),
      blockingApprovalRefs: uniqueSortedRefs(input.blockingApprovalRefs ?? []),
      blockingReconciliationRefs: uniqueSortedRefs(input.blockingReconciliationRefs ?? []),
      blockingConfirmationRefs: uniqueSortedRefs(input.blockingConfirmationRefs ?? []),
      blockingLineageCaseLinkRefs: uniqueSortedRefs(input.blockingLineageCaseLinkRefs ?? []),
      blockingDuplicateClusterRefs: uniqueSortedRefs(input.blockingDuplicateClusterRefs ?? []),
      blockingFallbackCaseRefs: uniqueSortedRefs(input.blockingFallbackCaseRefs ?? []),
      blockingIdentityRepairRefs: uniqueSortedRefs(input.blockingIdentityRepairRefs ?? []),
      blockingGrantRefs: uniqueSortedRefs(input.blockingGrantRefs ?? []),
      blockingReachabilityRefs: uniqueSortedRefs(input.blockingReachabilityRefs ?? []),
      blockingDegradedPromiseRefs: uniqueSortedRefs(input.blockingDegradedPromiseRefs ?? []),
      currentClosureBlockerRefs: uniqueSortedRefs(input.currentClosureBlockerRefs),
      currentConfirmationGateRefs: uniqueSortedRefs(input.currentConfirmationGateRefs),
      requiredCommandFollowingProjectionRefs: uniqueSortedRefs(
        input.requiredCommandFollowingProjectionRefs,
      ),
    }),
  );
}

function highestWorkflow(
  left: Exclude<RequestWorkflowState, "closed">,
  right: Exclude<RequestWorkflowState, "closed">,
): Exclude<RequestWorkflowState, "closed"> {
  return workflowRank[left] >= workflowRank[right] ? left : right;
}

function deriveWorkflowFromSignals(
  currentWorkflow: RequestWorkflowState,
  signals: readonly LifecycleSignalDocument[],
  terminalOutcomeRef: string | null,
): Exclude<RequestWorkflowState, "closed"> {
  let derived: Exclude<RequestWorkflowState, "closed"> =
    currentWorkflow === "closed" ? "outcome_recorded" : currentWorkflow;

  for (const signal of signals) {
    const hint = signal.toSnapshot().milestoneHint;
    if (hint) {
      derived = highestWorkflow(derived, hint);
    }
  }

  if (terminalOutcomeRef !== null) {
    derived = highestWorkflow(derived, "outcome_recorded");
  }

  return derived;
}

function advanceRequestForward(
  request: RequestAggregate,
  targetState: Exclude<RequestWorkflowState, "closed">,
  updatedAt: string,
): RequestAggregate {
  let current = request;
  while (workflowRank[current.workflowState] < workflowRank[targetState]) {
    const nextState = workflowSteps[workflowRank[current.workflowState] + 1]!;
    current = current.advanceWorkflow({
      nextState,
      updatedAt,
    });
  }
  return current;
}

function forceRequestWorkflowState(
  request: RequestAggregate,
  nextState: RequestWorkflowState,
  updatedAt: string,
): RequestAggregate {
  const snapshot = request.toSnapshot();
  return KernelRequestAggregate.hydrate({
    ...snapshot,
    workflowState: nextState,
    updatedAt,
    requestVersion: snapshot.requestVersion + 1,
    version: snapshot.version + 1,
  });
}

function forceRequestLineageState(
  lineage: RequestLineageAggregate,
  nextState: "active" | "closure_pending" | "closed",
  updatedAt: string,
  latestClosureRecordRef?: string | null,
): RequestLineageAggregate {
  const snapshot = lineage.toSnapshot();
  return KernelRequestLineageAggregate.hydrate({
    ...snapshot,
    lineageState: nextState,
    latestClosureRecordRef:
      latestClosureRecordRef === undefined
        ? snapshot.latestClosureRecordRef
        : latestClosureRecordRef,
    updatedAt,
    version: snapshot.version + 1,
  });
}

function forceEpisodeResolution(
  episode: EpisodeAggregate,
  state: "open" | "resolved",
  updatedAt: string,
  resolutionReason: string | null,
): EpisodeAggregate {
  const snapshot = episode.toSnapshot();
  return EpisodeAggregate.hydrate({
    ...snapshot,
    state,
    resolutionReason,
    resolvedAt: state === "resolved" ? updatedAt : null,
    updatedAt,
    version: snapshot.version + 1,
  });
}

function computeReopenMetrics(signal: LifecycleSignalSnapshot) {
  const materialChange =
    1 -
    (1 - materialChangeWeights.clinical * signal.deltaClinical) *
      (1 - materialChangeWeights.contact * signal.deltaContact) *
      (1 - materialChangeWeights.provider * signal.deltaProvider) *
      (1 - materialChangeWeights.consent * signal.deltaConsent) *
      (1 - materialChangeWeights.timing * signal.deltaTiming) *
      (1 - materialChangeWeights.identity * signal.deltaIdentity);
  const reopenSignal = Math.max(
    signal.uUrgent,
    signal.uUnable,
    signal.uContact,
    signal.uBounce,
    signal.uRevocation,
    signal.uContradiction,
  );
  const loopRisk =
    Math.min(signal.returnCount / lifecycleThresholds.returnBudget, 1) * (1 - materialChange);
  return {
    materialChange,
    reopenSignal,
    loopRisk,
    shouldReopen: signal.uUrgent === 1 || reopenSignal >= lifecycleThresholds.reopen,
  };
}

function deriveReopenPriorityBand(
  originPriorityBand: string | null,
  signal: LifecycleSignalSnapshot,
  loopRisk: number,
): number {
  const origin =
    originPriorityBand === null
      ? 0
      : Number.isFinite(Number(originPriorityBand))
        ? Number(originPriorityBand)
        : 0;
  const urgentBand = signal.uUrgent === 1 ? 3 : 0;
  const secondaryBand =
    Math.max(signal.uUnable, signal.uContact) >= lifecycleThresholds.reopenSecondary ? 2 : 0;
  const loopBand = loopRisk >= lifecycleThresholds.loop ? 1 : 0;
  return Math.max(origin, urgentBand, secondaryBand, loopBand);
}

function collectDeferReasonCodes(
  state: LifecycleMaterializedState,
  input: { evaluateEpisodeClosure?: boolean; episodeEligible?: boolean },
): LifecycleDeferReasonCode[] {
  const reasons = new Set<LifecycleDeferReasonCode>();
  if ((state.blockingLeaseRefs ?? []).length > 0) {
    reasons.add("LEASE_ACTIVE_OR_BROKEN");
  }
  if ((state.blockingPreemptionRefs ?? []).length > 0) {
    reasons.add("SAFETY_PREEMPTION_OPEN");
  }
  if (
    (state.blockingApprovalRefs ?? []).length > 0 ||
    state.currentConfirmationGateRefs.length > 0
  ) {
    reasons.add("APPROVAL_OR_CONFIRMATION_PENDING");
  }
  if ((state.blockingReconciliationRefs ?? []).length > 0) {
    reasons.add("OUTCOME_TRUTH_DISPUTED");
    reasons.add("PHARMACY_RECONCILIATION_OPEN");
  }
  if (
    (state.blockingDuplicateClusterRefs ?? []).length > 0 ||
    (state.blockingFallbackCaseRefs ?? []).length > 0 ||
    (state.blockingIdentityRepairRefs ?? []).length > 0
  ) {
    reasons.add("REPAIR_OR_REVIEW_OPEN");
  }
  if ((state.blockingReachabilityRefs ?? []).length > 0) {
    reasons.add("REACHABILITY_REPAIR_OPEN");
  }
  if ((state.blockingGrantRefs ?? []).length > 0) {
    reasons.add("LIVE_PHI_GRANT_PRESENT");
  }
  if (state.currentClosureBlockerRefs.length > 0 || state.currentConfirmationGateRefs.length > 0) {
    reasons.add("MATERIALIZED_BLOCKERS_PRESENT");
  }
  if ((state.blockingLineageCaseLinkRefs ?? []).length > 0) {
    reasons.add("LINEAGE_BRANCH_STILL_ACTIVE");
  }
  if (state.requiredCommandFollowingProjectionRefs.length > 0) {
    reasons.add("COMMAND_FOLLOWING_PROJECTION_PENDING");
  }
  if (state.terminalOutcomeRef === null) {
    reasons.add("TERMINAL_OUTCOME_MISSING");
  }
  if (input.evaluateEpisodeClosure && !input.episodeEligible) {
    reasons.add("EPISODE_POLICY_UNSATISFIED");
  }
  if ((state.blockingApprovalRefs ?? []).length > 0) {
    reasons.add("ACKNOWLEDGEMENT_REQUIRED");
  }
  if ((state.blockingDegradedPromiseRefs ?? []).length > 0) {
    reasons.add("CONSENT_OR_DEGRADED_PROMISE_OPEN");
  }
  return [...reasons].sort();
}

function emitLifecycleEvent<TPayload>(
  eventType: LifecycleCoordinatorEventEnvelope<TPayload>["eventType"],
  emittedAt: string,
  payload: TPayload,
): LifecycleCoordinatorEventEnvelope<TPayload> {
  return {
    eventType,
    emittedAt,
    payload,
  };
}

export interface InitializeLifecyclePartitionInput {
  episodeId: string;
  issuedAt: string;
  initialEpoch?: number;
  expiresAt?: string | null;
}

export interface RecordLifecycleSignalInput extends LifecycleBlockerVector {
  signalId?: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  sourceDomain: LifecycleSourceDomain;
  signalFamily: LifecycleSignalFamily;
  signalType: string;
  domainObjectRef: string;
  milestoneHint?: Exclude<RequestWorkflowState, "closed"> | null;
  currentConfirmationGateRefs?: readonly string[];
  requiredCommandFollowingProjectionRefs?: readonly string[];
  terminalOutcomeRef?: string | null;
  activeIdentityRepairCaseRef?: string | null;
  sameShellRecoveryRouteRef?: string | null;
  presentedLineageEpoch: number;
  occurredAt: string;
  recordedAt?: string;
  causalTokenRef: string;
  correlationRef?: string;
  reopenTriggerFamily?: LifecycleReopenTriggerFamily | null;
  reopenTargetState?: Exclude<RequestWorkflowState, "closed"> | null;
  uUrgent?: number;
  uUnable?: number;
  uContact?: number;
  uBounce?: number;
  uRevocation?: number;
  uContradiction?: number;
  deltaClinical?: number;
  deltaContact?: number;
  deltaProvider?: number;
  deltaConsent?: number;
  deltaTiming?: number;
  deltaIdentity?: number;
  returnCount?: number;
}

export interface EvaluateRequestClosureInput {
  closureRecordId?: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  presentedLineageEpoch: number;
  evaluatedAt: string;
  closedByMode?: Exclude<LifecycleCloseMode, "not_closed">;
  consumedCausalTokenRef: string;
  evaluateEpisodeClosure?: boolean;
}

export interface RecordLifecycleSignalResult {
  signal: LifecycleSignalDocument;
  materializedState: LifecycleMaterializedState;
  currentFence: LineageFenceDocument;
  emittedEvents: readonly LifecycleCoordinatorEventEnvelope[];
  reopenedRecord: GovernedReopenRecordDocument | null;
  reusedExisting: boolean;
}

export interface EvaluateRequestClosureResult {
  record: LifecycleClosureRecordDocument;
  materializedState: LifecycleMaterializedState;
  currentFence: LineageFenceDocument;
  emittedEvents: readonly LifecycleCoordinatorEventEnvelope[];
}

export class LifecycleCoordinatorService {
  constructor(
    private readonly repositories: LifecycleCoordinatorDependencies,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async initializeLifecyclePartition(
    input: InitializeLifecyclePartitionInput,
    options?: CompareAndSetWriteOptions,
  ): Promise<LineageFenceDocument> {
    const existing = await this.repositories.getCurrentLineageFenceForEpisode(input.episodeId);
    if (existing) {
      return existing;
    }
    const epoch = input.initialEpoch ?? 1;
    const issuedAt = ensureIsoTimestamp(input.issuedAt, "issuedAt");
    const fence = LineageFenceDocument.create({
      fenceId: nextLifecycleId(this.idGenerator, "lineageFence"),
      episodeId: requireRef(input.episodeId, "episodeId"),
      currentEpoch: ensurePositiveInteger(epoch, "initialEpoch"),
      issuedFor: "cross_domain_commit",
      issuedAt,
      expiresAt: input.expiresAt
        ? ensureIsoTimestamp(input.expiresAt, "expiresAt")
        : addHours(issuedAt, 12),
    });
    await this.repositories.saveLineageFence(fence, options);
    return fence;
  }

  async recordLifecycleSignal(
    input: RecordLifecycleSignalInput,
    options?: CompareAndSetWriteOptions,
  ): Promise<RecordLifecycleSignalResult> {
    await this.requireRequestScope({
      episodeId: input.episodeId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
    });

    const signalId =
      optionalRef(input.signalId) ?? nextLifecycleId(this.idGenerator, "lifecycleSignal");
    const existing = await this.repositories.getLifecycleSignal(signalId);
    const recordedAt = input.recordedAt ?? input.occurredAt;
    const nextSequence =
      existing?.toSnapshot().partitionSequence ??
      (await this.repositories.listLifecycleSignalsForEpisode(input.episodeId)).length + 1;

    const createPayload: Omit<LifecycleSignalSnapshot, "version" | "signalDigest"> = {
      signalId,
      episodeId: input.episodeId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      sourceDomain: input.sourceDomain,
      signalFamily: input.signalFamily,
      signalType: input.signalType,
      domainObjectRef: input.domainObjectRef,
      milestoneHint: input.milestoneHint ?? null,
      currentConfirmationGateRefs: input.currentConfirmationGateRefs ?? [],
      requiredCommandFollowingProjectionRefs: input.requiredCommandFollowingProjectionRefs ?? [],
      terminalOutcomeRef: input.terminalOutcomeRef ?? null,
      activeIdentityRepairCaseRef: input.activeIdentityRepairCaseRef ?? null,
      sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef ?? null,
      presentedLineageEpoch: input.presentedLineageEpoch,
      partitionSequence: nextSequence,
      occurredAt: input.occurredAt,
      recordedAt,
      causalTokenRef: input.causalTokenRef,
      correlationRef: input.correlationRef ?? `${input.sourceDomain}:${input.domainObjectRef}`,
      reopenTriggerFamily: input.reopenTriggerFamily ?? null,
      reopenTargetState: input.reopenTargetState ?? null,
      uUrgent: input.uUrgent ?? 0,
      uUnable: input.uUnable ?? 0,
      uContact: input.uContact ?? 0,
      uBounce: input.uBounce ?? 0,
      uRevocation: input.uRevocation ?? 0,
      uContradiction: input.uContradiction ?? 0,
      deltaClinical: input.deltaClinical ?? 0,
      deltaContact: input.deltaContact ?? 0,
      deltaProvider: input.deltaProvider ?? 0,
      deltaConsent: input.deltaConsent ?? 0,
      deltaTiming: input.deltaTiming ?? 0,
      deltaIdentity: input.deltaIdentity ?? 0,
      returnCount: input.returnCount ?? 0,
      blockingLeaseRefs: input.blockingLeaseRefs ?? [],
      blockingPreemptionRefs: input.blockingPreemptionRefs ?? [],
      blockingApprovalRefs: input.blockingApprovalRefs ?? [],
      blockingReconciliationRefs: input.blockingReconciliationRefs ?? [],
      blockingConfirmationRefs: input.blockingConfirmationRefs ?? [],
      blockingLineageCaseLinkRefs: input.blockingLineageCaseLinkRefs ?? [],
      blockingDuplicateClusterRefs: input.blockingDuplicateClusterRefs ?? [],
      blockingFallbackCaseRefs: input.blockingFallbackCaseRefs ?? [],
      blockingIdentityRepairRefs: input.blockingIdentityRepairRefs ?? [],
      blockingGrantRefs: input.blockingGrantRefs ?? [],
      blockingReachabilityRefs: input.blockingReachabilityRefs ?? [],
      blockingDegradedPromiseRefs: input.blockingDegradedPromiseRefs ?? [],
    };

    const candidate = LifecycleSignalDocument.create(createPayload);
    if (existing) {
      invariant(
        existing.signalDigest === candidate.signalDigest,
        "LIFECYCLE_SIGNAL_REPLAY_DRIFT",
        `LifecycleSignal ${signalId} already exists with different semantics.`,
      );
      const materializedState = await this.materializeLifecycleState(
        input.requestId,
        input.requestLineageRef,
      );
      const currentFence = await this.requireCurrentFence(input.episodeId);
      return {
        signal: existing,
        materializedState,
        currentFence,
        emittedEvents: [],
        reopenedRecord: null,
        reusedExisting: true,
      };
    }

    const currentFence = await this.requireCurrentFence(input.episodeId);
    invariant(
      currentFence.currentEpoch === input.presentedLineageEpoch,
      "STALE_LINEAGE_EPOCH",
      `Signal ${input.signalType} presented stale lineage epoch ${input.presentedLineageEpoch}; current is ${currentFence.currentEpoch}.`,
    );

    await this.repositories.saveLifecycleSignal(candidate, options);

    const materializedState = await this.materializeLifecycleState(
      input.requestId,
      input.requestLineageRef,
    );
    const applyResult = await this.applyMaterializedState(materializedState, recordedAt);

    let latestFence = currentFence;
    const events: LifecycleCoordinatorEventEnvelope[] = [];

    if (applyResult.refsChanged || applyResult.workflowChanged) {
      latestFence = await this.advanceLineageFence({
        episodeId: input.episodeId,
        currentFence: latestFence,
        issuedAt: recordedAt,
        issuedFor: "cross_domain_commit",
      });
    }

    if (applyResult.refsChanged) {
      events.push(
        emitLifecycleEvent("request.closure_blockers.changed", recordedAt, {
          episodeId: input.episodeId,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          currentClosureBlockerRefs: materializedState.currentClosureBlockerRefs,
          currentConfirmationGateRefs: materializedState.currentConfirmationGateRefs,
          lineageEpoch: latestFence.currentEpoch,
        }),
      );
    }

    if (applyResult.workflowChanged) {
      events.push(
        emitLifecycleEvent("request.workflow.changed", recordedAt, {
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          previousWorkflowState: applyResult.previousWorkflowState,
          nextWorkflowState: applyResult.nextWorkflowState,
          lineageEpoch: latestFence.currentEpoch,
        }),
      );
    }

    const reopenResult = await this.maybeGovernedReopen(candidate, latestFence);
    if (reopenResult) {
      latestFence = reopenResult.currentFence;
      events.push(...reopenResult.events);
    }

    if (events.length > 0) {
      await this.repositories.appendLifecycleCoordinatorEvents(events);
    }

    return {
      signal: candidate,
      materializedState,
      currentFence: latestFence,
      emittedEvents: events,
      reopenedRecord: reopenResult?.record ?? null,
      reusedExisting: false,
    };
  }

  async evaluateRequestClosure(
    input: EvaluateRequestClosureInput,
    options?: CompareAndSetWriteOptions,
  ): Promise<EvaluateRequestClosureResult> {
    await this.requireRequestScope({
      episodeId: input.episodeId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
    });
    const currentFence = await this.requireCurrentFence(input.episodeId);
    invariant(
      currentFence.currentEpoch === input.presentedLineageEpoch,
      "STALE_CLOSE_EPOCH",
      `Close evaluation presented stale lineage epoch ${input.presentedLineageEpoch}; current is ${currentFence.currentEpoch}.`,
    );

    const existing = (
      await this.repositories.listRequestClosureRecordsForRequest(input.requestId)
    ).find(
      (record) =>
        record.toSnapshot().consumedCausalTokenRef === input.consumedCausalTokenRef &&
        record.toSnapshot().requiredLineageEpoch === input.presentedLineageEpoch,
    );
    if (existing) {
      const materializedState = await this.materializeLifecycleState(
        input.requestId,
        input.requestLineageRef,
      );
      return {
        record: existing,
        materializedState,
        currentFence,
        emittedEvents: [],
      };
    }

    const materializedState = await this.materializeLifecycleState(
      input.requestId,
      input.requestLineageRef,
    );
    const applyResult = await this.applyMaterializedState(materializedState, input.evaluatedAt);
    const request = await this.requireRequest(input.requestId);
    const lineage = await this.requireRequestLineage(input.requestLineageRef);
    const episode = await this.requireEpisode(input.episodeId);

    const episodeEligible = input.evaluateEpisodeClosure
      ? await this.canResolveEpisode(input.episodeId, input.requestId)
      : true;
    const deferReasonCodes = collectDeferReasonCodes(materializedState, {
      evaluateEpisodeClosure: input.evaluateEpisodeClosure,
      episodeEligible,
    });

    const record = LifecycleClosureRecordDocument.create({
      closureRecordId:
        optionalRef(input.closureRecordId) ?? nextLifecycleId(this.idGenerator, "requestClosure"),
      episodeId: input.episodeId,
      requestId: input.requestId,
      requestLineageRef: input.requestLineageRef,
      evaluatedAt: input.evaluatedAt,
      requiredLineageEpoch: currentFence.currentEpoch,
      blockingLeaseRefs: materializedState.blockingLeaseRefs ?? [],
      blockingPreemptionRefs: materializedState.blockingPreemptionRefs ?? [],
      blockingApprovalRefs: materializedState.blockingApprovalRefs ?? [],
      blockingReconciliationRefs: materializedState.blockingReconciliationRefs ?? [],
      blockingConfirmationRefs: materializedState.blockingConfirmationRefs ?? [],
      blockingLineageCaseLinkRefs: materializedState.blockingLineageCaseLinkRefs ?? [],
      blockingDuplicateClusterRefs: materializedState.blockingDuplicateClusterRefs ?? [],
      blockingFallbackCaseRefs: materializedState.blockingFallbackCaseRefs ?? [],
      blockingIdentityRepairRefs: materializedState.blockingIdentityRepairRefs ?? [],
      blockingGrantRefs: materializedState.blockingGrantRefs ?? [],
      blockingReachabilityRefs: materializedState.blockingReachabilityRefs ?? [],
      blockingDegradedPromiseRefs: materializedState.blockingDegradedPromiseRefs ?? [],
      decision: deferReasonCodes.length === 0 ? "close" : "defer",
      closedByMode:
        deferReasonCodes.length === 0
          ? (input.closedByMode ?? "routine_terminal_outcome")
          : "not_closed",
      deferReasonCodes,
      currentClosureBlockerRefs: materializedState.currentClosureBlockerRefs,
      currentConfirmationGateRefs: materializedState.currentConfirmationGateRefs,
      terminalOutcomeRef: materializedState.terminalOutcomeRef ?? missingTerminalOutcomeRef,
      requiredCommandFollowingProjectionRefs:
        materializedState.requiredCommandFollowingProjectionRefs,
      consumedCausalTokenRef: input.consumedCausalTokenRef,
    });

    await this.repositories.saveRequestClosureRecord(record, options);

    const nextLineage = forceRequestLineageState(
      lineage,
      record.decision === "close" ? "closed" : "closure_pending",
      input.evaluatedAt,
      record.closureRecordId,
    );
    await this.repositories.saveRequestLineage(nextLineage, {
      expectedVersion: lineage.version,
    });

    const events: LifecycleCoordinatorEventEnvelope[] = [];
    if (applyResult.refsChanged) {
      events.push(
        emitLifecycleEvent("request.closure_blockers.changed", input.evaluatedAt, {
          episodeId: input.episodeId,
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          currentClosureBlockerRefs: materializedState.currentClosureBlockerRefs,
          currentConfirmationGateRefs: materializedState.currentConfirmationGateRefs,
          lineageEpoch: currentFence.currentEpoch,
        }),
      );
    }

    events.push(
      emitLifecycleEvent("request.close.evaluated", input.evaluatedAt, {
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        closureRecordId: record.closureRecordId,
        decision: record.decision,
        requiredLineageEpoch: currentFence.currentEpoch,
        deferReasonCodes,
      }),
    );

    let latestFence = currentFence;

    if (record.decision === "close") {
      const closedRequest = forceRequestWorkflowState(request, "closed", input.evaluatedAt);
      await this.repositories.saveRequest(closedRequest, {
        expectedVersion: request.version,
      });
      if (input.evaluateEpisodeClosure && episodeEligible) {
        const resolvedEpisode = forceEpisodeResolution(
          episode,
          "resolved",
          input.evaluatedAt,
          "all_request_lineages_satisfied_closure_policy",
        );
        await this.repositories.saveEpisode(resolvedEpisode, {
          expectedVersion: episode.version,
        });
      }
      latestFence = await this.advanceLineageFence({
        episodeId: input.episodeId,
        currentFence,
        issuedAt: input.evaluatedAt,
        issuedFor: "close",
      });
      events.push(
        emitLifecycleEvent("request.workflow.changed", input.evaluatedAt, {
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          previousWorkflowState: request.workflowState,
          nextWorkflowState: "closed",
          lineageEpoch: latestFence.currentEpoch,
        }),
      );
      events.push(
        emitLifecycleEvent("request.closed", input.evaluatedAt, {
          requestId: input.requestId,
          requestLineageRef: input.requestLineageRef,
          closureRecordId: record.closureRecordId,
          closedByMode: record.toSnapshot().closedByMode,
          terminalOutcomeRef: record.toSnapshot().terminalOutcomeRef,
          lineageEpoch: latestFence.currentEpoch,
        }),
      );
    }

    if (events.length > 0) {
      await this.repositories.appendLifecycleCoordinatorEvents(events);
    }

    return {
      record,
      materializedState,
      currentFence: latestFence,
      emittedEvents: events,
    };
  }

  async replayEpisode(episodeId: string): Promise<readonly LifecycleSignalSnapshot[]> {
    const signals = await this.repositories.listLifecycleSignalsForEpisode(episodeId);
    return signals.map((signal) => signal.toSnapshot());
  }

  private async maybeGovernedReopen(
    signal: LifecycleSignalDocument,
    currentFence: LineageFenceDocument,
  ): Promise<
    | {
        record: GovernedReopenRecordDocument;
        currentFence: LineageFenceDocument;
        events: readonly LifecycleCoordinatorEventEnvelope[];
      }
    | undefined
  > {
    const snapshot = signal.toSnapshot();
    if (!snapshot.reopenTriggerFamily) {
      return undefined;
    }

    const request = await this.requireRequest(snapshot.requestId);
    const latestClosure = await this.repositories.getLatestRequestClosureRecordForRequest(
      snapshot.requestId,
    );
    if (
      request.workflowState !== "closed" &&
      request.workflowState !== "outcome_recorded" &&
      latestClosure?.decision !== "close"
    ) {
      return undefined;
    }

    const metrics = computeReopenMetrics(snapshot);
    if (!metrics.shouldReopen) {
      return undefined;
    }

    const reopenRecord = GovernedReopenRecordDocument.create({
      reopenRecordId: nextLifecycleId(this.idGenerator, "governedReopen"),
      episodeId: snapshot.episodeId,
      requestId: snapshot.requestId,
      requestLineageRef: snapshot.requestLineageRef,
      sourceSignalRef: snapshot.signalId,
      priorClosureRecordRef: latestClosure?.closureRecordId ?? null,
      requiredLineageEpoch: currentFence.currentEpoch,
      reopenTriggerFamily: snapshot.reopenTriggerFamily,
      uUrgent: snapshot.uUrgent,
      uUnable: snapshot.uUnable,
      uContact: snapshot.uContact,
      uBounce: snapshot.uBounce,
      uRevocation: snapshot.uRevocation,
      uContradiction: snapshot.uContradiction,
      materialChange: metrics.materialChange,
      loopRisk: metrics.loopRisk,
      reopenSignal: metrics.reopenSignal,
      reopenPriorityBand: deriveReopenPriorityBand(
        request.toSnapshot().priorityBand,
        snapshot,
        metrics.loopRisk,
      ),
      reopenedToWorkflowState: snapshot.reopenTargetState ?? "triage_active",
      reopenedAt: snapshot.recordedAt,
    });
    await this.repositories.saveGovernedReopenRecord(reopenRecord);

    const nextWorkflowState = snapshot.reopenTargetState ?? "triage_active";
    const reopenedRequest = forceRequestWorkflowState(
      request,
      nextWorkflowState,
      snapshot.recordedAt,
    );
    await this.repositories.saveRequest(reopenedRequest, {
      expectedVersion: request.version,
    });

    const lineage = await this.requireRequestLineage(snapshot.requestLineageRef);
    const reopenedLineage = forceRequestLineageState(
      lineage,
      "active",
      snapshot.recordedAt,
      latestClosure?.closureRecordId ?? null,
    );
    await this.repositories.saveRequestLineage(reopenedLineage, {
      expectedVersion: lineage.version,
    });

    const episode = await this.requireEpisode(snapshot.episodeId);
    if (episode.state === "resolved") {
      const reopenedEpisode = forceEpisodeResolution(episode, "open", snapshot.recordedAt, null);
      await this.repositories.saveEpisode(reopenedEpisode, {
        expectedVersion: episode.version,
      });
    }

    const nextFence = await this.advanceLineageFence({
      episodeId: snapshot.episodeId,
      currentFence,
      issuedAt: snapshot.recordedAt,
      issuedFor: "reopen",
    });

    return {
      record: reopenRecord,
      currentFence: nextFence,
      events: [
        emitLifecycleEvent("request.workflow.changed", snapshot.recordedAt, {
          requestId: snapshot.requestId,
          requestLineageRef: snapshot.requestLineageRef,
          previousWorkflowState: request.workflowState,
          nextWorkflowState,
          lineageEpoch: nextFence.currentEpoch,
        }),
        emitLifecycleEvent("request.reopened", snapshot.recordedAt, {
          requestId: snapshot.requestId,
          requestLineageRef: snapshot.requestLineageRef,
          reopenRecordId: reopenRecord.reopenRecordId,
          reopenTriggerFamily: snapshot.reopenTriggerFamily,
          reopenPriorityBand: reopenRecord.toSnapshot().reopenPriorityBand,
          lineageEpoch: nextFence.currentEpoch,
          reopenedToWorkflowState: nextWorkflowState,
        }),
      ],
    };
  }

  private async materializeLifecycleState(
    requestId: string,
    requestLineageRef: string,
  ): Promise<LifecycleMaterializedState> {
    const request = await this.requireRequest(requestId);
    const signals = await this.repositories.listLifecycleSignalsForRequest(requestId);
    const latestSignalByObject = new Map<string, LifecycleSignalDocument>();
    for (const signal of signals) {
      latestSignalByObject.set(signal.toSnapshot().domainObjectRef, signal);
    }

    const effectiveSignals = [...latestSignalByObject.values()].sort(
      (left, right) => left.partitionSequence - right.partitionSequence,
    );

    const lineages = await this.repositories.listLineageCaseLinks();
    const activeLineageLinks = lineages
      .map((link) => link.toSnapshot())
      .filter(
        (link) =>
          link.requestLineageRef === requestLineageRef &&
          ["proposed", "acknowledged", "active", "returned"].includes(link.ownershipState),
      );

    const blockerFamilies: { [K in keyof LifecycleBlockerVector]-?: string[] } = {
      blockingLeaseRefs: [],
      blockingPreemptionRefs: [],
      blockingApprovalRefs: [],
      blockingReconciliationRefs: [],
      blockingConfirmationRefs: [],
      blockingLineageCaseLinkRefs: [],
      blockingDuplicateClusterRefs: [],
      blockingFallbackCaseRefs: [],
      blockingIdentityRepairRefs: [],
      blockingGrantRefs: [],
      blockingReachabilityRefs: [],
      blockingDegradedPromiseRefs: [],
    };
    const currentConfirmationGateRefs: string[] = [];
    const commandFollowingRefs: string[] = [];
    let terminalOutcomeRef: string | null = null;
    let activeIdentityRepairCaseRef: string | null = null;

    for (const signal of effectiveSignals) {
      const snapshot = signal.toSnapshot();
      blockerFamilies.blockingLeaseRefs.push(...(snapshot.blockingLeaseRefs ?? []));
      blockerFamilies.blockingPreemptionRefs.push(...(snapshot.blockingPreemptionRefs ?? []));
      blockerFamilies.blockingApprovalRefs.push(...(snapshot.blockingApprovalRefs ?? []));
      blockerFamilies.blockingReconciliationRefs.push(
        ...(snapshot.blockingReconciliationRefs ?? []),
      );
      blockerFamilies.blockingConfirmationRefs.push(...(snapshot.blockingConfirmationRefs ?? []));
      blockerFamilies.blockingLineageCaseLinkRefs.push(
        ...(snapshot.blockingLineageCaseLinkRefs ?? []),
      );
      blockerFamilies.blockingDuplicateClusterRefs.push(
        ...(snapshot.blockingDuplicateClusterRefs ?? []),
      );
      blockerFamilies.blockingFallbackCaseRefs.push(...(snapshot.blockingFallbackCaseRefs ?? []));
      blockerFamilies.blockingIdentityRepairRefs.push(
        ...(snapshot.blockingIdentityRepairRefs ?? []),
      );
      blockerFamilies.blockingGrantRefs.push(...(snapshot.blockingGrantRefs ?? []));
      blockerFamilies.blockingReachabilityRefs.push(...(snapshot.blockingReachabilityRefs ?? []));
      blockerFamilies.blockingDegradedPromiseRefs.push(
        ...(snapshot.blockingDegradedPromiseRefs ?? []),
      );
      currentConfirmationGateRefs.push(...snapshot.currentConfirmationGateRefs);
      commandFollowingRefs.push(...snapshot.requiredCommandFollowingProjectionRefs);
      if (snapshot.terminalOutcomeRef) {
        terminalOutcomeRef = snapshot.terminalOutcomeRef;
      }
      if (snapshot.activeIdentityRepairCaseRef) {
        activeIdentityRepairCaseRef = snapshot.activeIdentityRepairCaseRef;
      }
    }

    blockerFamilies.blockingLineageCaseLinkRefs.push(
      ...activeLineageLinks.map((link) => link.lineageCaseLinkId),
    );
    for (const link of activeLineageLinks) {
      currentConfirmationGateRefs.push(...link.currentConfirmationGateRefs);
      blockerFamilies.blockingConfirmationRefs.push(...link.currentConfirmationGateRefs);
      blockerFamilies.blockingLineageCaseLinkRefs.push(...link.currentClosureBlockerRefs);
    }

    const currentClosureBlockerRefs = collectMaterializedClosureRefs(blockerFamilies);
    const derivedWorkflowState = deriveWorkflowFromSignals(
      request.workflowState,
      effectiveSignals,
      terminalOutcomeRef,
    );

    return {
      episodeId: request.episodeId,
      requestId,
      requestLineageRef,
      signalRefs: effectiveSignals.map((signal) => signal.signalId),
      currentClosureBlockerRefs,
      currentConfirmationGateRefs: uniqueSortedRefs(currentConfirmationGateRefs),
      requiredCommandFollowingProjectionRefs: uniqueSortedRefs(commandFollowingRefs),
      terminalOutcomeRef,
      derivedWorkflowState,
      activeIdentityRepairCaseRef:
        activeIdentityRepairCaseRef ??
        uniqueSortedRefs(blockerFamilies.blockingIdentityRepairRefs)[0] ??
        null,
      blockingLeaseRefs: uniqueSortedRefs(blockerFamilies.blockingLeaseRefs),
      blockingPreemptionRefs: uniqueSortedRefs(blockerFamilies.blockingPreemptionRefs),
      blockingApprovalRefs: uniqueSortedRefs(blockerFamilies.blockingApprovalRefs),
      blockingReconciliationRefs: uniqueSortedRefs(blockerFamilies.blockingReconciliationRefs),
      blockingConfirmationRefs: uniqueSortedRefs(blockerFamilies.blockingConfirmationRefs),
      blockingLineageCaseLinkRefs: uniqueSortedRefs(blockerFamilies.blockingLineageCaseLinkRefs),
      blockingDuplicateClusterRefs: uniqueSortedRefs(blockerFamilies.blockingDuplicateClusterRefs),
      blockingFallbackCaseRefs: uniqueSortedRefs(blockerFamilies.blockingFallbackCaseRefs),
      blockingIdentityRepairRefs: uniqueSortedRefs(blockerFamilies.blockingIdentityRepairRefs),
      blockingGrantRefs: uniqueSortedRefs(blockerFamilies.blockingGrantRefs),
      blockingReachabilityRefs: uniqueSortedRefs(blockerFamilies.blockingReachabilityRefs),
      blockingDegradedPromiseRefs: uniqueSortedRefs(blockerFamilies.blockingDegradedPromiseRefs),
    };
  }

  private async applyMaterializedState(
    materializedState: LifecycleMaterializedState,
    updatedAt: string,
  ): Promise<{
    refsChanged: boolean;
    workflowChanged: boolean;
    previousWorkflowState: RequestWorkflowState;
    nextWorkflowState: RequestWorkflowState;
  }> {
    const request = await this.requireRequest(materializedState.requestId);
    const episode = await this.requireEpisode(materializedState.episodeId);

    const refsChanged =
      stableStringify(request.toSnapshot().currentClosureBlockerRefs) !==
        stableStringify(materializedState.currentClosureBlockerRefs) ||
      stableStringify(request.toSnapshot().currentConfirmationGateRefs) !==
        stableStringify(materializedState.currentConfirmationGateRefs) ||
      stableStringify(episode.toSnapshot().currentClosureBlockerRefs) !==
        stableStringify(materializedState.currentClosureBlockerRefs) ||
      stableStringify(episode.toSnapshot().currentConfirmationGateRefs) !==
        stableStringify(materializedState.currentConfirmationGateRefs) ||
      episode.toSnapshot().activeIdentityRepairCaseRef !==
        materializedState.activeIdentityRepairCaseRef;

    if (refsChanged) {
      const nextRequest = request.refreshLineageSummary({
        latestLineageCaseLinkRef: request.toSnapshot().latestLineageCaseLinkRef,
        activeLineageCaseLinkRefs: request.toSnapshot().activeLineageCaseLinkRefs,
        currentClosureBlockerRefs: materializedState.currentClosureBlockerRefs,
        currentConfirmationGateRefs: materializedState.currentConfirmationGateRefs,
        updatedAt,
      });
      await this.repositories.saveRequest(nextRequest, {
        expectedVersion: request.version,
      });
      const nextEpisode = episode.refreshOperationalRefs({
        currentClosureBlockerRefs: materializedState.currentClosureBlockerRefs,
        currentConfirmationGateRefs: materializedState.currentConfirmationGateRefs,
        activeIdentityRepairCaseRef: materializedState.activeIdentityRepairCaseRef,
        updatedAt,
      });
      await this.repositories.saveEpisode(nextEpisode, {
        expectedVersion: episode.version,
      });
    }

    const previousWorkflowState = request.workflowState;
    let nextWorkflowState = request.workflowState;
    const requestForWorkflow = refsChanged
      ? await this.requireRequest(materializedState.requestId)
      : request;
    if (
      requestForWorkflow.workflowState === "outcome_recorded" &&
      materializedState.derivedWorkflowState === "handoff_active"
    ) {
      const correctedRequest = forceRequestWorkflowState(
        requestForWorkflow,
        "handoff_active",
        updatedAt,
      );
      nextWorkflowState = correctedRequest.workflowState;
      await this.repositories.saveRequest(correctedRequest, {
        expectedVersion: requestForWorkflow.version,
      });
    } else if (
      requestForWorkflow.workflowState !== "closed" &&
      workflowRank[materializedState.derivedWorkflowState] > workflowRank[requestForWorkflow.workflowState]
    ) {
      const nextRequest = advanceRequestForward(
        requestForWorkflow,
        materializedState.derivedWorkflowState,
        updatedAt,
      );
      nextWorkflowState = nextRequest.workflowState;
      if (nextRequest.workflowState !== requestForWorkflow.workflowState) {
        await this.repositories.saveRequest(nextRequest, {
          expectedVersion: requestForWorkflow.version,
        });
      }
    }

    return {
      refsChanged,
      workflowChanged: previousWorkflowState !== nextWorkflowState,
      previousWorkflowState,
      nextWorkflowState,
    };
  }

  private async canResolveEpisode(episodeId: string, requestId: string): Promise<boolean> {
    const requests = await this.repositories.listRequests();
    return requests
      .filter((request) => request.episodeId === episodeId && request.requestId !== requestId)
      .every((request) => request.workflowState === "closed");
  }

  private async advanceLineageFence(input: {
    episodeId: string;
    currentFence: LineageFenceDocument;
    issuedAt: string;
    issuedFor: LineageFenceIssuedFor;
  }): Promise<LineageFenceDocument> {
    const nextFence = LineageFenceDocument.create({
      fenceId: nextLifecycleId(this.idGenerator, "lineageFence"),
      episodeId: input.episodeId,
      currentEpoch: input.currentFence.currentEpoch + 1,
      issuedFor: input.issuedFor,
      issuedAt: input.issuedAt,
      expiresAt: addHours(input.issuedAt, 12),
    });
    await this.repositories.saveLineageFence(nextFence);
    return nextFence;
  }

  private async requireCurrentFence(episodeId: string): Promise<LineageFenceDocument> {
    const fence = await this.repositories.getCurrentLineageFenceForEpisode(episodeId);
    invariant(
      fence !== undefined,
      "LINEAGE_FENCE_MISSING",
      `LifecycleCoordinator requires an initialized LineageFence for episode ${episodeId}.`,
    );
    return fence;
  }

  private async requireRequestScope(input: {
    episodeId: string;
    requestId: string;
    requestLineageRef: string;
  }): Promise<void> {
    const request = await this.requireRequest(input.requestId);
    const lineage = await this.requireRequestLineage(input.requestLineageRef);
    const episode = await this.requireEpisode(input.episodeId);
    invariant(
      request.episodeId === input.episodeId,
      "LIFECYCLE_REQUEST_EPISODE_MISMATCH",
      `Request ${input.requestId} does not belong to episode ${input.episodeId}.`,
    );
    invariant(
      request.requestLineageRef === input.requestLineageRef,
      "LIFECYCLE_REQUEST_LINEAGE_MISMATCH",
      `Request ${input.requestId} does not belong to lineage ${input.requestLineageRef}.`,
    );
    invariant(
      lineage.toSnapshot().requestRef === input.requestId,
      "LIFECYCLE_LINEAGE_REQUEST_MISMATCH",
      `RequestLineage ${input.requestLineageRef} does not belong to request ${input.requestId}.`,
    );
    invariant(
      lineage.toSnapshot().episodeRef === input.episodeId && episode.episodeId === input.episodeId,
      "LIFECYCLE_LINEAGE_EPISODE_MISMATCH",
      `RequestLineage ${input.requestLineageRef} does not belong to episode ${input.episodeId}.`,
    );
  }

  private async requireRequest(requestId: string): Promise<RequestAggregate> {
    const request = await this.repositories.getRequest(requestId);
    invariant(request !== undefined, "REQUEST_NOT_FOUND", `Request ${requestId} was not found.`);
    return request;
  }

  private async requireRequestLineage(requestLineageRef: string): Promise<RequestLineageAggregate> {
    const lineage = await this.repositories.getRequestLineage(requestLineageRef);
    invariant(
      lineage !== undefined,
      "REQUEST_LINEAGE_NOT_FOUND",
      `RequestLineage ${requestLineageRef} was not found.`,
    );
    return lineage;
  }

  private async requireEpisode(episodeId: string): Promise<EpisodeAggregate> {
    const episode = await this.repositories.getEpisode(episodeId);
    invariant(episode !== undefined, "EPISODE_NOT_FOUND", `Episode ${episodeId} was not found.`);
    return episode;
  }
}

export function createLifecycleCoordinatorService(
  repositories: LifecycleCoordinatorDependencies = createLifecycleCoordinatorStore(),
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "lifecycle_coordinator_backbone",
  ),
): LifecycleCoordinatorService {
  return new LifecycleCoordinatorService(repositories, idGenerator);
}

export const lifecycleCoordinatorParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_077_CHILD_DOMAIN_SIGNAL_ADAPTERS",
    stubInterface: "LifecycleSignalContract",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "Phase 0 sibling domains publish bounded lifecycle signals now so later triage, booking, hub, pharmacy, callback, messaging, recovery, and support services can bind to one deterministic coordinator stream without writing request closure directly.",
    sourceRefs: [
      "prompt/077.md",
      "prompt/shared_operating_contract_076_to_085.md",
      "blueprint/phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator",
    ],
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_077_REQUEST_CLOSURE_MODEL_SEAM",
    stubInterface: "RequestClosureRecordRepository",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "Task 077 consumes a bounded RequestClosureRecord substrate now so the coordinator can persist canonical close/defer decisions while task 076 lands its richer closure-case coverage in parallel.",
    sourceRefs: [
      "prompt/076.md",
      "prompt/077.md",
      "blueprint/phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
    ],
  },
] as const;

export interface LifecycleSimulationScenarioResult {
  scenarioId: string;
  title: string;
  request: RequestAggregate;
  closureRecords: readonly LifecycleClosureRecordDocument[];
  reopenRecords: readonly GovernedReopenRecordDocument[];
  fence: LineageFenceDocument;
}

class LifecycleCoordinatorSimulationHarness {
  constructor(
    private readonly repositories: LifecycleCoordinatorDependencies,
    private readonly authority: LifecycleCoordinatorService,
  ) {}

  async runAllScenarios(): Promise<readonly LifecycleSimulationScenarioResult[]> {
    return [
      await this.runNormalClosureScenario(),
      await this.runMoreInfoReopenScenario(),
      await this.runBookingConfirmationScenario(),
      await this.runHubReturnVisibilityDebtScenario(),
      await this.runPharmacyWeakMatchScenario(),
      await this.runWrongPatientRepairReleaseScenario(),
      await this.runDuplicateReviewHoldScenario(),
      await this.runFallbackReviewHoldScenario(),
      await this.runReachabilityRepairHoldScenario(),
    ];
  }

  private async createRoot(seed: string) {
    const episodeId = `episode_077_${seed}`;
    const requestId = `request_077_${seed}`;
    const requestLineageId = `lineage_077_${seed}`;
    const episode = EpisodeAggregate.create({
      episodeId,
      episodeFingerprint: `episode_fingerprint_${seed}`,
      openedAt: "2026-04-12T22:00:00Z",
    }).attachRequestMembership({
      requestRef: requestId,
      requestLineageRef: requestLineageId,
      updatedAt: "2026-04-12T22:00:00Z",
    });
    const lineage = KernelRequestLineageAggregate.create({
      requestLineageId,
      episodeRef: episodeId,
      requestRef: requestId,
      continuityWitnessRef: `promotion_${seed}`,
      createdAt: "2026-04-12T22:00:00Z",
    });
    const request = KernelRequestAggregate.create({
      requestId,
      episodeId,
      originEnvelopeRef: `envelope_${seed}`,
      promotionRecordRef: `promotion_${seed}`,
      tenantId: "tenant_vecells_demo",
      sourceChannel: "self_service_form",
      originIngressRecordRef: `ingress_${seed}`,
      normalizedSubmissionRef: `normalized_${seed}`,
      requestType: "service_request",
      requestLineageRef: requestLineageId,
      createdAt: "2026-04-12T22:00:00Z",
    });
    await this.repositories.saveEpisode(episode);
    await this.repositories.saveRequestLineage(lineage);
    await this.repositories.saveRequest(request);
    const fence = await this.authority.initializeLifecyclePartition({
      episodeId,
      issuedAt: "2026-04-12T22:00:00Z",
    });
    return {
      episodeId,
      requestId,
      requestLineageId,
      fence,
    };
  }

  private async finalizeScenario(
    seed: string,
    title: string,
  ): Promise<LifecycleSimulationScenarioResult> {
    const requestId = `request_077_${seed}`;
    const episodeId = `episode_077_${seed}`;
    const request = await this.repositories.getRequest(requestId);
    invariant(request !== undefined, "SIMULATION_REQUEST_MISSING", "Simulation request missing.");
    const closureRecords = await this.repositories.listRequestClosureRecordsForRequest(requestId);
    const reopenRecords = await this.repositories.listGovernedReopenRecordsForRequest(requestId);
    const fence = await this.repositories.getCurrentLineageFenceForEpisode(episodeId);
    invariant(fence !== undefined, "SIMULATION_FENCE_MISSING", "Simulation fence missing.");
    return {
      scenarioId: seed,
      title,
      request,
      closureRecords,
      reopenRecords,
      fence,
    };
  }

  private async runNormalClosureScenario() {
    const root = await this.createRoot("normal_closure");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.ready",
      domainObjectRef: "triage_task_normal_closure",
      milestoneHint: "triage_ready",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:01:00Z",
      causalTokenRef: "causal_normal_1",
    });
    const fenceAfterReady = await this.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    invariant(
      fenceAfterReady !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after ready.",
    );
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.active",
      domainObjectRef: "triage_task_normal_closure",
      milestoneHint: "triage_active",
      presentedLineageEpoch: fenceAfterReady.currentEpoch,
      occurredAt: "2026-04-12T22:02:00Z",
      causalTokenRef: "causal_normal_2",
    });
    const fenceAfterActive = await this.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    invariant(
      fenceAfterActive !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after active.",
    );
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "booking",
      signalFamily: "terminal_outcome",
      signalType: "booking.confirmed",
      domainObjectRef: "booking_case_normal_closure",
      milestoneHint: "outcome_recorded",
      terminalOutcomeRef: "outcome://booking/confirmed/normal_closure",
      presentedLineageEpoch: fenceAfterActive.currentEpoch,
      occurredAt: "2026-04-12T22:03:00Z",
      causalTokenRef: "causal_normal_3",
    });
    const fenceAfterOutcome = await this.repositories.getCurrentLineageFenceForEpisode(
      root.episodeId,
    );
    invariant(
      fenceAfterOutcome !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after outcome.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceAfterOutcome.currentEpoch,
      evaluatedAt: "2026-04-12T22:04:00Z",
      consumedCausalTokenRef: "close_normal",
    });
    return this.finalizeScenario(
      "normal_closure",
      "Normal intake reaches a terminal outcome and closes cleanly.",
    );
  }

  private async runMoreInfoReopenScenario() {
    const root = await this.createRoot("more_info_reopen");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "triage",
      signalFamily: "milestone",
      signalType: "triage.more_info.open",
      domainObjectRef: "triage_more_info_case",
      milestoneHint: "triage_active",
      blockingFallbackCaseRefs: ["fallback_case_more_info_late_reply"],
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:05:00Z",
      causalTokenRef: "causal_more_info_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceOne !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after blocker open.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:06:00Z",
      consumedCausalTokenRef: "close_more_info_defer",
    });
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "messaging",
      signalFamily: "terminal_outcome",
      signalType: "messaging.more_info.resolved",
      domainObjectRef: "triage_more_info_case",
      milestoneHint: "outcome_recorded",
      blockingFallbackCaseRefs: [],
      terminalOutcomeRef: "outcome://triage/more_info/settled",
      presentedLineageEpoch: fenceOne.currentEpoch,
      occurredAt: "2026-04-12T22:06:30Z",
      causalTokenRef: "causal_more_info_1b",
    });
    const fenceTwo = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceTwo !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after more-info settlement.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceTwo.currentEpoch,
      evaluatedAt: "2026-04-12T22:06:45Z",
      consumedCausalTokenRef: "close_more_info_success",
    });
    const fenceThree = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceThree !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after more-info close.",
    );
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "messaging",
      signalFamily: "reopen",
      signalType: "patient.reply.late",
      domainObjectRef: "patient_reply_more_info",
      reopenTriggerFamily: "materially_new_evidence",
      reopenTargetState: "triage_active",
      uUnable: 0.55,
      deltaClinical: 0.6,
      deltaTiming: 0.8,
      returnCount: 1,
      presentedLineageEpoch: fenceThree.currentEpoch,
      occurredAt: "2026-04-12T22:07:00Z",
      causalTokenRef: "causal_more_info_2",
    });
    return this.finalizeScenario(
      "more_info_reopen",
      "Late reply pressure reopens the request under governed lifecycle control.",
    );
  }

  private async runBookingConfirmationScenario() {
    const root = await this.createRoot("booking_confirmation");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "booking",
      signalFamily: "confirmation",
      signalType: "booking.confirmation.pending",
      domainObjectRef: "booking_case_confirmation",
      milestoneHint: "handoff_active",
      currentConfirmationGateRefs: ["confirmation_gate_booking_001"],
      blockingConfirmationRefs: ["confirmation_gate_booking_001"],
      terminalOutcomeRef: "outcome://booking/pending_confirmation",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:08:00Z",
      causalTokenRef: "causal_booking_confirmation_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(fenceOne !== undefined, "SIMULATION_FENCE_MISSING", "Fence missing after gate open.");
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:09:00Z",
      consumedCausalTokenRef: "close_booking_defer",
    });
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "booking",
      signalFamily: "terminal_outcome",
      signalType: "booking.confirmation.cleared",
      domainObjectRef: "booking_case_confirmation",
      milestoneHint: "outcome_recorded",
      terminalOutcomeRef: "outcome://booking/confirmed/booking_confirmation",
      currentConfirmationGateRefs: [],
      blockingConfirmationRefs: [],
      presentedLineageEpoch: fenceOne.currentEpoch,
      occurredAt: "2026-04-12T22:10:00Z",
      causalTokenRef: "causal_booking_confirmation_2",
    });
    const fenceTwo = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceTwo !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after gate clear.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceTwo.currentEpoch,
      evaluatedAt: "2026-04-12T22:11:00Z",
      consumedCausalTokenRef: "close_booking_success",
    });
    return this.finalizeScenario(
      "booking_confirmation",
      "Booking waits on an external confirmation gate before legal closure.",
    );
  }

  private async runHubReturnVisibilityDebtScenario() {
    const root = await this.createRoot("hub_return_visibility_debt");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "hub",
      signalFamily: "blocker",
      signalType: "hub.return.visibility.debt",
      domainObjectRef: "hub_case_visibility",
      milestoneHint: "handoff_active",
      blockingApprovalRefs: ["hub_ack_required_001"],
      blockingLineageCaseLinkRefs: ["hub_case_link_001"],
      terminalOutcomeRef: "outcome://hub/returned_with_visibility_debt",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:12:00Z",
      causalTokenRef: "causal_hub_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(fenceOne !== undefined, "SIMULATION_FENCE_MISSING", "Fence missing after hub block.");
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:13:00Z",
      consumedCausalTokenRef: "close_hub_defer",
    });
    return this.finalizeScenario(
      "hub_return_visibility_debt",
      "Hub return and practice-visibility debt remain materialized blocker truth instead of a hidden workflow alias.",
    );
  }

  private async runPharmacyWeakMatchScenario() {
    const root = await this.createRoot("pharmacy_weak_match");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "pharmacy",
      signalFamily: "blocker",
      signalType: "pharmacy.outcome.weak_match",
      domainObjectRef: "pharmacy_case_weak_match",
      milestoneHint: "handoff_active",
      blockingReconciliationRefs: ["pharmacy_reconciliation_gate_weak_match"],
      terminalOutcomeRef: "outcome://pharmacy/awaiting_reconciliation",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:14:00Z",
      causalTokenRef: "causal_pharmacy_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceOne !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after weak match.",
    );
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "pharmacy",
      signalFamily: "terminal_outcome",
      signalType: "pharmacy.outcome.reconciled",
      domainObjectRef: "pharmacy_case_weak_match",
      milestoneHint: "outcome_recorded",
      blockingReconciliationRefs: [],
      terminalOutcomeRef: "outcome://pharmacy/dispensed/reconciled",
      presentedLineageEpoch: fenceOne.currentEpoch,
      occurredAt: "2026-04-12T22:15:00Z",
      causalTokenRef: "causal_pharmacy_2",
    });
    return this.finalizeScenario(
      "pharmacy_weak_match",
      "Pharmacy weak-match review blocks closure until the reconciliation gate clears.",
    );
  }

  private async runWrongPatientRepairReleaseScenario() {
    const root = await this.createRoot("wrong_patient_repair_release");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "support",
      signalFamily: "repair",
      signalType: "identity.repair.open",
      domainObjectRef: "identity_repair_case_001",
      milestoneHint: "triage_active",
      activeIdentityRepairCaseRef: "identity_repair_case_001",
      blockingIdentityRepairRefs: ["identity_repair_case_001"],
      blockingDuplicateClusterRefs: ["duplicate_cluster_review_001"],
      blockingReachabilityRefs: ["reachability_repair_001"],
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:16:00Z",
      causalTokenRef: "causal_repair_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceOne !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after wrong-patient hold.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:16:30Z",
      consumedCausalTokenRef: "close_wrong_patient_defer",
    });
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "support",
      signalFamily: "repair",
      signalType: "identity.repair.corrected",
      domainObjectRef: "identity_repair_case_001",
      milestoneHint: "triage_active",
      activeIdentityRepairCaseRef: null,
      blockingIdentityRepairRefs: [],
      blockingDuplicateClusterRefs: [],
      blockingReachabilityRefs: [],
      presentedLineageEpoch: fenceOne.currentEpoch,
      occurredAt: "2026-04-12T22:17:00Z",
      causalTokenRef: "causal_repair_2",
    });
    return this.finalizeScenario(
      "wrong_patient_repair_release",
      "Wrong-patient repair holds closure and then clears through an explicit repair-release signal.",
    );
  }

  private async runDuplicateReviewHoldScenario() {
    const root = await this.createRoot("duplicate_review_hold");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "support",
      signalFamily: "repair",
      signalType: "support.duplicate.review.required",
      domainObjectRef: "duplicate_cluster_review_001",
      milestoneHint: "triage_active",
      blockingDuplicateClusterRefs: ["duplicate_cluster_review_001"],
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:18:00Z",
      causalTokenRef: "causal_duplicate_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceOne !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after duplicate-review hold.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:18:30Z",
      consumedCausalTokenRef: "close_duplicate_defer",
    });
    return this.finalizeScenario(
      "duplicate_review_hold",
      "Duplicate-review debt persists as a first-class blocker until the review settles.",
    );
  }

  private async runFallbackReviewHoldScenario() {
    const root = await this.createRoot("fallback_review_hold");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "support",
      signalFamily: "repair",
      signalType: "support.fallback.review.open",
      domainObjectRef: "fallback_case_restore_review_001",
      milestoneHint: "triage_active",
      blockingFallbackCaseRefs: ["fallback_case_restore_review_001"],
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:19:00Z",
      causalTokenRef: "causal_fallback_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceOne !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after fallback-review hold.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:19:30Z",
      consumedCausalTokenRef: "close_fallback_defer",
    });
    return this.finalizeScenario(
      "fallback_review_hold",
      "Fallback review preserves accepted progress while keeping closure deferred under explicit blocker truth.",
    );
  }

  private async runReachabilityRepairHoldScenario() {
    const root = await this.createRoot("reachability_repair_hold");
    await this.authority.recordLifecycleSignal({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      sourceDomain: "callback",
      signalFamily: "blocker",
      signalType: "communication.reachability.repair.required",
      domainObjectRef: "reachability_repair_001",
      milestoneHint: "handoff_active",
      blockingReachabilityRefs: ["reachability_repair_001"],
      terminalOutcomeRef: "outcome://communication/contact_route_unverified",
      presentedLineageEpoch: root.fence.currentEpoch,
      occurredAt: "2026-04-12T22:20:00Z",
      causalTokenRef: "causal_reachability_1",
    });
    const fenceOne = await this.repositories.getCurrentLineageFenceForEpisode(root.episodeId);
    invariant(
      fenceOne !== undefined,
      "SIMULATION_FENCE_MISSING",
      "Fence missing after reachability hold.",
    );
    await this.authority.evaluateRequestClosure({
      episodeId: root.episodeId,
      requestId: root.requestId,
      requestLineageRef: root.requestLineageId,
      presentedLineageEpoch: fenceOne.currentEpoch,
      evaluatedAt: "2026-04-12T22:20:30Z",
      consumedCausalTokenRef: "close_reachability_defer",
    });
    return this.finalizeScenario(
      "reachability_repair_hold",
      "Reachability repair stays explicit in blocker refs until a governed contact-route repair clears it.",
    );
  }
}

export async function runLifecycleCoordinatorSimulation(
  repositories: LifecycleCoordinatorDependencies = createLifecycleCoordinatorStore(),
  authority: LifecycleCoordinatorService = createLifecycleCoordinatorService(repositories),
): Promise<readonly LifecycleSimulationScenarioResult[]> {
  const harness = new LifecycleCoordinatorSimulationHarness(repositories, authority);
  return harness.runAllScenarios();
}
