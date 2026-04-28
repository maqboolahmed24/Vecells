import {
  LineageCaseLinkAggregate,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  type LineageCaseLinkReason,
  type LineageCaseLinkSnapshot,
} from "@vecells/domain-kernel";
import {
  makeFoundationEvent,
  type FoundationEventEnvelope,
} from "@vecells/event-contracts";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireText(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireText(value, field);
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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextPharmacyId(idGenerator: BackboneIdGenerator, kind: string): string {
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
      row.version > current.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, structuredClone(row));
}

export interface AggregateRef<TTarget extends string = string, TOwner extends string = string> {
  targetFamily: TTarget;
  refId: string;
  ownerTask: TOwner;
}

export type PharmacyServiceType = "clinical_pathway_consultation" | "minor_illness_fallback";

export type PharmacyPathwayCode =
  | "uncomplicated_uti_female_16_64"
  | "shingles_18_plus"
  | "acute_otitis_media_1_17"
  | "acute_sore_throat_5_plus"
  | "acute_sinusitis_12_plus"
  | "impetigo_1_plus"
  | "infected_insect_bites_1_plus"
  | "minor_illness_fallback";

export type PharmacyCaseStatus =
  | "candidate_received"
  | "rules_evaluating"
  | "ineligible_returned"
  | "eligible_choice_pending"
  | "provider_selected"
  | "consent_pending"
  | "package_ready"
  | "dispatch_pending"
  | "referred"
  | "consultation_outcome_pending"
  | "outcome_reconciliation_pending"
  | "resolved_by_pharmacy"
  | "unresolved_returned"
  | "urgent_bounce_back"
  | "no_contact_return_pending"
  | "closed";

export type PharmacyScopedMutationGateState = "admitted" | "denied";
export type PharmacyConsentCheckpointState = "satisfied" | "unsatisfied";
export type PharmacyDispatchProofState = "pending" | "confirmed" | "missing";
export type PharmacyTransitionOutcome = "applied" | "rejected";

export type PharmacyOutcomeDisposition =
  | "pending_review"
  | "resolved_by_pharmacy"
  | "unresolved_returned"
  | "urgent_bounce_back"
  | "no_contact_return_pending";

export type PharmacyCaseTransitionEventName =
  | "pharmacy.case.created"
  | "pharmacy.service_type.resolved"
  | "pharmacy.pathway.evaluated"
  | "pharmacy.provider.selected"
  | "pharmacy.consent.checkpoint.updated"
  | "pharmacy.package.composed"
  | "pharmacy.dispatch.started"
  | "pharmacy.dispatch.confirmed"
  | "pharmacy.dispatch.proof_missing"
  | "pharmacy.consent.revoked"
  | "pharmacy.consent.revocation.recorded"
  | "pharmacy.outcome.received"
  | "pharmacy.outcome.reconciled"
  | "pharmacy.reachability.blocked"
  | "pharmacy.reachability.repaired"
  | "pharmacy.case.resolved"
  | "pharmacy.case.bounce_back"
  | "pharmacy.case.reopened"
  | "pharmacy.case.closed";

export interface PharmacyCaseSnapshot {
  pharmacyCaseId: string;
  episodeRef: AggregateRef<"Episode", Task342>;
  originRequestId: string;
  requestLineageRef: AggregateRef<"RequestLineage", Task342>;
  lineageCaseLinkRef: AggregateRef<"LineageCaseLink", Task342>;
  originTaskId: string;
  pharmacyIntentId: string;
  sourceDecisionEpochRef: AggregateRef<"DecisionEpoch", Task342>;
  sourceDecisionSupersessionRef: AggregateRef<"DecisionSupersession", Task342> | null;
  patientRef: AggregateRef<"Patient", Task342>;
  tenantId: string;
  serviceType: PharmacyServiceType;
  candidatePathway: PharmacyPathwayCode | null;
  eligibilityRef: AggregateRef<"PathwayEligibilityEvaluation", Task342> | null;
  choiceSessionRef: AggregateRef<"PharmacyChoiceSession", Task343> | null;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  activeConsentRef: AggregateRef<"PharmacyConsentRecord", Task343> | null;
  activeConsentCheckpointRef: AggregateRef<"PharmacyConsentCheckpoint", Task343> | null;
  latestConsentRevocationRef:
    | AggregateRef<"PharmacyConsentRevocationRecord", Task343>
    | null;
  activeDispatchAttemptRef: AggregateRef<"PharmacyDispatchAttempt", Task343> | null;
  correlationRef: AggregateRef<"CorrelationRecord", Task343> | null;
  outcomeRef: AggregateRef<"PharmacyOutcomeSettlement", Task343> | null;
  bounceBackRef: AggregateRef<"PharmacyBounceBackRecord", Task344> | null;
  leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  ownershipEpoch: number;
  staleOwnerRecoveryRef: AggregateRef<"StaleOwnershipRecoveryRecord", Task342> | null;
  lineageFenceRef: AggregateRef<"LineageFence", Task342>;
  currentConfirmationGateRefs: readonly AggregateRef<"ExternalConfirmationGate", Task343>[];
  currentClosureBlockerRefs: readonly AggregateRef<"ClosureBlocker", Task344>[];
  activeReachabilityDependencyRefs:
    readonly AggregateRef<"ReachabilityDependency", Task344>[];
  activeIdentityRepairCaseRef: AggregateRef<"IdentityRepairCase", Task342> | null;
  identityRepairBranchDispositionRef:
    | AggregateRef<"IdentityRepairBranchDisposition", Task342>
    | null;
  identityRepairReleaseSettlementRef:
    | AggregateRef<"IdentityRepairReleaseSettlement", Task342>
    | null;
  status: PharmacyCaseStatus;
  slaTargetAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PharmacyStaleOwnershipRecoveryRecordSnapshot {
  staleOwnershipRecoveryId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  leaseRefAtDetection: AggregateRef<"RequestLifecycleLease", Task342>;
  lineageFenceRefAtDetection: AggregateRef<"LineageFence", Task342>;
  scopedMutationGateRef: string;
  staleOwnershipEpoch: number;
  failureCode: string;
  recoveryState: "pending" | "resolved";
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  resolutionLeaseRef: AggregateRef<"RequestLifecycleLease", Task342> | null;
  resolutionLineageFenceRef: AggregateRef<"LineageFence", Task342> | null;
  resolutionOwnershipEpoch: number | null;
  version: number;
}

export interface PharmacyCaseTransitionJournalEntrySnapshot {
  pharmacyCaseTransitionJournalEntryId: string;
  pharmacyCaseId: string;
  lineageCaseLinkRef: string;
  previousStatus: PharmacyCaseStatus | "none";
  nextStatus: PharmacyCaseStatus;
  transitionEvent: PharmacyCaseTransitionEventName;
  transitionOutcome: PharmacyTransitionOutcome;
  failureCode: string | null;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  leaseRefAtDecision: string | null;
  expectedOwnershipEpoch: number | null;
  expectedLineageFenceRef: string | null;
  scopedMutationGateRef: string | null;
  transitionPredicateId: string;
  reasonCode: string;
  dependentRef: string | null;
  recordedAt: string;
  version: number;
}

export interface PharmacyCaseEventJournalEntrySnapshot {
  pharmacyCaseEventJournalEntryId: string;
  aggregateKind: "pharmacy_case";
  aggregateId: string;
  eventName: PharmacyCaseTransitionEventName;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  payloadDigest: string;
  recordedAt: string;
  version: number;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily,
    refId: requireText(refId, `${targetFamily}.refId`),
    ownerTask,
  };
}

function cloneRef<TTarget extends string, TOwner extends string>(
  value: AggregateRef<TTarget, TOwner>,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily: value.targetFamily,
    refId: value.refId,
    ownerTask: value.ownerTask,
  };
}

function normalizeRef<TTarget extends string, TOwner extends string>(
  value: AggregateRef<TTarget, TOwner>,
  field: string,
  targetFamily: TTarget,
  ownerTask?: TOwner,
): AggregateRef<TTarget, TOwner> {
  invariant(value !== null && value !== undefined, `INVALID_${field.toUpperCase()}`, `${field} is required.`);
  invariant(
    value.targetFamily === targetFamily,
    `INVALID_${field.toUpperCase()}_TARGET`,
    `${field} must target ${targetFamily}.`,
  );
  if (ownerTask !== undefined) {
    invariant(
      value.ownerTask === ownerTask,
      `INVALID_${field.toUpperCase()}_OWNER`,
      `${field} must be owned by ${ownerTask}.`,
    );
  } else {
    requireText(value.ownerTask, `${field}.ownerTask`);
  }
  return {
    targetFamily,
    refId: requireText(value.refId, `${field}.refId`),
    ownerTask: value.ownerTask,
  };
}

function normalizeOptionalRef<TTarget extends string, TOwner extends string>(
  value: AggregateRef<TTarget, TOwner> | null | undefined,
  field: string,
  targetFamily: TTarget,
  ownerTask?: TOwner,
): AggregateRef<TTarget, TOwner> | null {
  if (value === null || value === undefined) {
    return null;
  }
  return normalizeRef(value, field, targetFamily, ownerTask);
}

function refSortKey(value: AggregateRef<string, string>): string {
  return `${value.targetFamily}:${value.refId}:${value.ownerTask}`;
}

function uniqueSortedRefs<TTarget extends string, TOwner extends string>(
  values: readonly AggregateRef<TTarget, TOwner>[],
): AggregateRef<TTarget, TOwner>[] {
  const deduped = new Map<string, AggregateRef<TTarget, TOwner>>();
  for (const value of values) {
    deduped.set(refSortKey(value), cloneRef(value));
  }
  return [...deduped.values()].sort((left, right) => refSortKey(left).localeCompare(refSortKey(right)));
}

function sameRef(
  left: AggregateRef<string, string> | null | undefined,
  right: AggregateRef<string, string> | null | undefined,
): boolean {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }
  return (
    left.targetFamily === right.targetFamily &&
    left.refId === right.refId &&
    left.ownerTask === right.ownerTask
  );
}

function requireField<T>(value: T | null | undefined, code: string, message: string): T {
  invariant(value !== null && value !== undefined, code, message);
  return value;
}

function normalizePharmacyCase(snapshot: PharmacyCaseSnapshot): PharmacyCaseSnapshot {
  return {
    ...snapshot,
    pharmacyCaseId: requireText(snapshot.pharmacyCaseId, "pharmacyCaseId"),
    episodeRef: normalizeRef(snapshot.episodeRef, "episodeRef", "Episode", TASK_342),
    originRequestId: requireText(snapshot.originRequestId, "originRequestId"),
    requestLineageRef: normalizeRef(
      snapshot.requestLineageRef,
      "requestLineageRef",
      "RequestLineage",
      TASK_342,
    ),
    lineageCaseLinkRef: normalizeRef(
      snapshot.lineageCaseLinkRef,
      "lineageCaseLinkRef",
      "LineageCaseLink",
      TASK_342,
    ),
    originTaskId: requireText(snapshot.originTaskId, "originTaskId"),
    pharmacyIntentId: requireText(snapshot.pharmacyIntentId, "pharmacyIntentId"),
    sourceDecisionEpochRef: normalizeRef(
      snapshot.sourceDecisionEpochRef,
      "sourceDecisionEpochRef",
      "DecisionEpoch",
      TASK_342,
    ),
    sourceDecisionSupersessionRef: normalizeOptionalRef(
      snapshot.sourceDecisionSupersessionRef,
      "sourceDecisionSupersessionRef",
      "DecisionSupersession",
      TASK_342,
    ),
    patientRef: normalizeRef(snapshot.patientRef, "patientRef", "Patient", TASK_342),
    tenantId: requireText(snapshot.tenantId, "tenantId"),
    serviceType: snapshot.serviceType,
    candidatePathway: snapshot.candidatePathway,
    eligibilityRef: normalizeOptionalRef(
      snapshot.eligibilityRef,
      "eligibilityRef",
      "PathwayEligibilityEvaluation",
      TASK_342,
    ),
    choiceSessionRef: normalizeOptionalRef(
      snapshot.choiceSessionRef,
      "choiceSessionRef",
      "PharmacyChoiceSession",
      TASK_343,
    ),
    selectedProviderRef: normalizeOptionalRef(
      snapshot.selectedProviderRef,
      "selectedProviderRef",
      "PharmacyProvider",
      TASK_343,
    ),
    activeConsentRef: normalizeOptionalRef(
      snapshot.activeConsentRef,
      "activeConsentRef",
      "PharmacyConsentRecord",
      TASK_343,
    ),
    activeConsentCheckpointRef: normalizeOptionalRef(
      snapshot.activeConsentCheckpointRef,
      "activeConsentCheckpointRef",
      "PharmacyConsentCheckpoint",
      TASK_343,
    ),
    latestConsentRevocationRef: normalizeOptionalRef(
      snapshot.latestConsentRevocationRef,
      "latestConsentRevocationRef",
      "PharmacyConsentRevocationRecord",
      TASK_343,
    ),
    activeDispatchAttemptRef: normalizeOptionalRef(
      snapshot.activeDispatchAttemptRef,
      "activeDispatchAttemptRef",
      "PharmacyDispatchAttempt",
      TASK_343,
    ),
    correlationRef: normalizeOptionalRef(
      snapshot.correlationRef,
      "correlationRef",
      "CorrelationRecord",
      TASK_343,
    ),
    outcomeRef: normalizeOptionalRef(
      snapshot.outcomeRef,
      "outcomeRef",
      "PharmacyOutcomeSettlement",
      TASK_343,
    ),
    bounceBackRef: normalizeOptionalRef(
      snapshot.bounceBackRef,
      "bounceBackRef",
      "PharmacyBounceBackRecord",
      TASK_344,
    ),
    leaseRef: normalizeRef(snapshot.leaseRef, "leaseRef", "RequestLifecycleLease", TASK_342),
    ownershipEpoch: ensureNonNegativeInteger(snapshot.ownershipEpoch, "ownershipEpoch"),
    staleOwnerRecoveryRef: normalizeOptionalRef(
      snapshot.staleOwnerRecoveryRef,
      "staleOwnerRecoveryRef",
      "StaleOwnershipRecoveryRecord",
      TASK_342,
    ),
    lineageFenceRef: normalizeRef(
      snapshot.lineageFenceRef,
      "lineageFenceRef",
      "LineageFence",
      TASK_342,
    ),
    currentConfirmationGateRefs: uniqueSortedRefs(
      (snapshot.currentConfirmationGateRefs ?? []).map((value) =>
        normalizeRef(value, "currentConfirmationGateRefs", "ExternalConfirmationGate", TASK_343),
      ),
    ),
    currentClosureBlockerRefs: uniqueSortedRefs(
      (snapshot.currentClosureBlockerRefs ?? []).map((value) =>
        normalizeRef(value, "currentClosureBlockerRefs", "ClosureBlocker", TASK_344),
      ),
    ),
    activeReachabilityDependencyRefs: uniqueSortedRefs(
      (snapshot.activeReachabilityDependencyRefs ?? []).map((value) =>
        normalizeRef(
          value,
          "activeReachabilityDependencyRefs",
          "ReachabilityDependency",
          TASK_344,
        ),
      ),
    ),
    activeIdentityRepairCaseRef: normalizeOptionalRef(
      snapshot.activeIdentityRepairCaseRef,
      "activeIdentityRepairCaseRef",
      "IdentityRepairCase",
      TASK_342,
    ),
    identityRepairBranchDispositionRef: normalizeOptionalRef(
      snapshot.identityRepairBranchDispositionRef,
      "identityRepairBranchDispositionRef",
      "IdentityRepairBranchDisposition",
      TASK_342,
    ),
    identityRepairReleaseSettlementRef: normalizeOptionalRef(
      snapshot.identityRepairReleaseSettlementRef,
      "identityRepairReleaseSettlementRef",
      "IdentityRepairReleaseSettlement",
      TASK_342,
    ),
    status: snapshot.status,
    slaTargetAt: ensureIsoTimestamp(snapshot.slaTargetAt, "slaTargetAt"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeStaleRecovery(
  snapshot: PharmacyStaleOwnershipRecoveryRecordSnapshot,
): PharmacyStaleOwnershipRecoveryRecordSnapshot {
  return {
    ...snapshot,
    staleOwnershipRecoveryId: requireText(
      snapshot.staleOwnershipRecoveryId,
      "staleOwnershipRecoveryId",
    ),
    pharmacyCaseRef: normalizeRef(
      snapshot.pharmacyCaseRef,
      "pharmacyCaseRef",
      "PharmacyCase",
      TASK_342,
    ),
    leaseRefAtDetection: normalizeRef(
      snapshot.leaseRefAtDetection,
      "leaseRefAtDetection",
      "RequestLifecycleLease",
      TASK_342,
    ),
    lineageFenceRefAtDetection: normalizeRef(
      snapshot.lineageFenceRefAtDetection,
      "lineageFenceRefAtDetection",
      "LineageFence",
      TASK_342,
    ),
    scopedMutationGateRef: requireText(snapshot.scopedMutationGateRef, "scopedMutationGateRef"),
    staleOwnershipEpoch: ensureNonNegativeInteger(
      snapshot.staleOwnershipEpoch,
      "staleOwnershipEpoch",
    ),
    failureCode: requireText(snapshot.failureCode, "failureCode"),
    firstDetectedAt: ensureIsoTimestamp(snapshot.firstDetectedAt, "firstDetectedAt"),
    lastDetectedAt: ensureIsoTimestamp(snapshot.lastDetectedAt, "lastDetectedAt"),
    resolvedAt:
      optionalText(snapshot.resolvedAt) === null
        ? null
        : ensureIsoTimestamp(snapshot.resolvedAt!, "resolvedAt"),
    resolutionLeaseRef: normalizeOptionalRef(
      snapshot.resolutionLeaseRef,
      "resolutionLeaseRef",
      "RequestLifecycleLease",
      TASK_342,
    ),
    resolutionLineageFenceRef: normalizeOptionalRef(
      snapshot.resolutionLineageFenceRef,
      "resolutionLineageFenceRef",
      "LineageFence",
      TASK_342,
    ),
    resolutionOwnershipEpoch:
      snapshot.resolutionOwnershipEpoch === null
        ? null
        : ensureNonNegativeInteger(snapshot.resolutionOwnershipEpoch, "resolutionOwnershipEpoch"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeTransitionJournalEntry(
  snapshot: PharmacyCaseTransitionJournalEntrySnapshot,
): PharmacyCaseTransitionJournalEntrySnapshot {
  return {
    ...snapshot,
    pharmacyCaseTransitionJournalEntryId: requireText(
      snapshot.pharmacyCaseTransitionJournalEntryId,
      "pharmacyCaseTransitionJournalEntryId",
    ),
    pharmacyCaseId: requireText(snapshot.pharmacyCaseId, "pharmacyCaseId"),
    lineageCaseLinkRef: requireText(snapshot.lineageCaseLinkRef, "lineageCaseLinkRef"),
    actorRef: requireText(snapshot.actorRef, "actorRef"),
    commandActionRecordRef: requireText(
      snapshot.commandActionRecordRef,
      "commandActionRecordRef",
    ),
    commandSettlementRecordRef: requireText(
      snapshot.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    leaseRefAtDecision: optionalText(snapshot.leaseRefAtDecision),
    expectedOwnershipEpoch:
      snapshot.expectedOwnershipEpoch === null
        ? null
        : ensureNonNegativeInteger(snapshot.expectedOwnershipEpoch, "expectedOwnershipEpoch"),
    expectedLineageFenceRef: optionalText(snapshot.expectedLineageFenceRef),
    scopedMutationGateRef: optionalText(snapshot.scopedMutationGateRef),
    transitionPredicateId: requireText(
      snapshot.transitionPredicateId,
      "transitionPredicateId",
    ),
    reasonCode: requireText(snapshot.reasonCode, "reasonCode"),
    dependentRef: optionalText(snapshot.dependentRef),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

function normalizeEventJournalEntry(
  snapshot: PharmacyCaseEventJournalEntrySnapshot,
): PharmacyCaseEventJournalEntrySnapshot {
  return {
    ...snapshot,
    pharmacyCaseEventJournalEntryId: requireText(
      snapshot.pharmacyCaseEventJournalEntryId,
      "pharmacyCaseEventJournalEntryId",
    ),
    aggregateId: requireText(snapshot.aggregateId, "aggregateId"),
    actorRef: requireText(snapshot.actorRef, "actorRef"),
    commandActionRecordRef: requireText(
      snapshot.commandActionRecordRef,
      "commandActionRecordRef",
    ),
    commandSettlementRecordRef: requireText(
      snapshot.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    payloadDigest: requireText(snapshot.payloadDigest, "payloadDigest"),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    version: ensureNonNegativeInteger(snapshot.version, "version"),
  };
}

export interface PharmacyCaseBundle {
  pharmacyCase: PharmacyCaseSnapshot;
  lineageCaseLink: LineageCaseLinkSnapshot;
  transitionJournal: readonly PharmacyCaseTransitionJournalEntrySnapshot[];
  eventJournal: readonly PharmacyCaseEventJournalEntrySnapshot[];
  staleOwnerRecovery: PharmacyStaleOwnershipRecoveryRecordSnapshot | null;
}

export interface PharmacyAuthorityCommandInput {
  pharmacyCaseId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  expectedOwnershipEpoch: number;
  expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
  scopedMutationGateRef: string;
  scopedMutationGateState?: PharmacyScopedMutationGateState;
  reasonCode: string;
  idempotencyKey?: string;
}

export interface CreatePharmacyCaseInput {
  pharmacyCaseId?: string;
  lineageCaseLinkId?: string;
  episodeRef: AggregateRef<"Episode", Task342>;
  originRequestId: string;
  requestLineageRef: AggregateRef<"RequestLineage", Task342>;
  parentLineageCaseLinkRef: string | null;
  originTaskId: string;
  pharmacyIntentId: string;
  sourceDecisionEpochRef: AggregateRef<"DecisionEpoch", Task342>;
  sourceDecisionSupersessionRef?: AggregateRef<"DecisionSupersession", Task342> | null;
  patientRef: AggregateRef<"Patient", Task342>;
  tenantId: string;
  serviceType: PharmacyServiceType;
  candidatePathway?: PharmacyPathwayCode | null;
  leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  initialOwnershipEpoch: number;
  lineageFenceRef: AggregateRef<"LineageFence", Task342>;
  slaTargetAt: string;
  linkReason?: LineageCaseLinkReason;
  activeIdentityRepairCaseRef?: AggregateRef<"IdentityRepairCase", Task342> | null;
  identityRepairBranchDispositionRef?:
    | AggregateRef<"IdentityRepairBranchDisposition", Task342>
    | null;
  identityRepairReleaseSettlementRef?:
    | AggregateRef<"IdentityRepairReleaseSettlement", Task342>
    | null;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  scopedMutationGateRef: string;
  scopedMutationGateState?: PharmacyScopedMutationGateState;
  createdAt: string;
  idempotencyKey?: string;
}

export interface EvaluatePharmacyCaseInput extends PharmacyAuthorityCommandInput {
  serviceType: PharmacyServiceType;
  candidatePathway: PharmacyPathwayCode | null;
  eligibilityRef: AggregateRef<"PathwayEligibilityEvaluation", Task342>;
  evaluationOutcome: "eligible" | "ineligible";
  sourceDecisionSupersessionRef?: AggregateRef<"DecisionSupersession", Task342> | null;
}

export interface ChoosePharmacyProviderInput extends PharmacyAuthorityCommandInput {
  choiceSessionRef: AggregateRef<"PharmacyChoiceSession", Task343>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343>;
  activeConsentRef?: AggregateRef<"PharmacyConsentRecord", Task343> | null;
  activeConsentCheckpointRef: AggregateRef<"PharmacyConsentCheckpoint", Task343>;
  latestConsentRevocationRef?:
    | AggregateRef<"PharmacyConsentRevocationRecord", Task343>
    | null;
  checkpointState: PharmacyConsentCheckpointState;
  finalizePackageReady?: boolean;
}

export interface DispatchPharmacyReferralInput extends PharmacyAuthorityCommandInput {
  activeConsentCheckpointRef: AggregateRef<"PharmacyConsentCheckpoint", Task343>;
  activeDispatchAttemptRef: AggregateRef<"PharmacyDispatchAttempt", Task343>;
  correlationRef?: AggregateRef<"CorrelationRecord", Task343> | null;
  checkpointState: PharmacyConsentCheckpointState;
  dispatchProofState: PharmacyDispatchProofState;
  latestConsentRevocationRef?:
    | AggregateRef<"PharmacyConsentRevocationRecord", Task343>
    | null;
  currentConfirmationGateRefs?: readonly AggregateRef<"ExternalConfirmationGate", Task343>[];
}

export interface CapturePharmacyOutcomeInput extends PharmacyAuthorityCommandInput {
  outcomeRef?: AggregateRef<"PharmacyOutcomeSettlement", Task343> | null;
  correlationRef?: AggregateRef<"CorrelationRecord", Task343> | null;
  disposition: PharmacyOutcomeDisposition;
  bounceBackRef?: AggregateRef<"PharmacyBounceBackRecord", Task344> | null;
  currentClosureBlockerRefs?: readonly AggregateRef<"ClosureBlocker", Task344>[];
  activeReachabilityDependencyRefs?:
    readonly AggregateRef<"ReachabilityDependency", Task344>[];
}

export interface ReopenPharmacyCaseInput extends PharmacyAuthorityCommandInput {
  reopenToStatus: "candidate_received" | "rules_evaluating" | "consent_pending";
  clearOutcomeRef?: boolean;
  clearBounceBackRef?: boolean;
  currentClosureBlockerRefs?: readonly AggregateRef<"ClosureBlocker", Task344>[];
  activeReachabilityDependencyRefs?:
    readonly AggregateRef<"ReachabilityDependency", Task344>[];
}

export interface ClosePharmacyCaseInput extends PharmacyAuthorityCommandInput {
  closeDecisionRef: string;
  lifecycleCloseApproved: boolean;
}

export interface ReservePharmacyCaseMutationAuthorityInput {
  pharmacyCaseId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  currentLeaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  currentOwnershipEpoch: number;
  currentLineageFenceRef: AggregateRef<"LineageFence", Task342>;
  scopedMutationGateRef: string;
  scopedMutationGateState?: PharmacyScopedMutationGateState;
  nextLeaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  nextOwnershipEpoch: number;
  nextLineageFenceRef: AggregateRef<"LineageFence", Task342>;
  reasonCode: string;
}

export interface VerifyPharmacyCaseMutationAuthorityInput extends PharmacyAuthorityCommandInput {}

export interface PharmacyCaseMutationResult {
  pharmacyCase: PharmacyCaseSnapshot;
  lineageCaseLink: LineageCaseLinkSnapshot;
  transitionJournalEntries: readonly PharmacyCaseTransitionJournalEntrySnapshot[];
  eventJournalEntries: readonly PharmacyCaseEventJournalEntrySnapshot[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
  staleOwnerRecovery: PharmacyStaleOwnershipRecoveryRecordSnapshot | null;
  replayed: boolean;
}

export interface PharmacyAuthorityVerificationResult {
  pharmacyCase: PharmacyCaseSnapshot;
  staleOwnerRecovery: PharmacyStaleOwnershipRecoveryRecordSnapshot | null;
}

export interface Phase6PharmacyCaseKernelRepositories {
  getPharmacyCase(pharmacyCaseId: string): Promise<SnapshotDocument<PharmacyCaseSnapshot> | null>;
  listPharmacyCases(): Promise<readonly SnapshotDocument<PharmacyCaseSnapshot>[]>;
  getLineageCaseLink(lineageCaseLinkId: string): Promise<SnapshotDocument<LineageCaseLinkSnapshot> | null>;
  getStaleOwnershipRecovery(
    staleOwnershipRecoveryId: string,
  ): Promise<SnapshotDocument<PharmacyStaleOwnershipRecoveryRecordSnapshot> | null>;
  listTransitionJournal(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyCaseTransitionJournalEntrySnapshot>[]>;
  listEventJournal(
    aggregateId: string,
  ): Promise<readonly SnapshotDocument<PharmacyCaseEventJournalEntrySnapshot>[]>;
}

export interface Phase6PharmacyCaseKernelStore
  extends Phase6PharmacyCaseKernelRepositories {
  savePharmacyCase(
    snapshot: PharmacyCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveLineageCaseLink(
    snapshot: LineageCaseLinkSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveStaleOwnershipRecovery(
    snapshot: PharmacyStaleOwnershipRecoveryRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendTransitionJournalEntry(
    snapshot: PharmacyCaseTransitionJournalEntrySnapshot,
  ): Promise<void>;
  appendEventJournalEntry(snapshot: PharmacyCaseEventJournalEntrySnapshot): Promise<void>;
  findPharmacyCaseByOriginTuple(originTupleDigest: string): Promise<string | null>;
  saveOriginTuple(originTupleDigest: string, pharmacyCaseId: string): Promise<void>;
  findReplayKey(replayKey: string): Promise<string | null>;
  saveReplayKey(replayKey: string, pharmacyCaseId: string): Promise<void>;
}

export function createPhase6PharmacyCaseKernelStore(): Phase6PharmacyCaseKernelStore {
  const pharmacyCases = new Map<string, PharmacyCaseSnapshot>();
  const lineageLinks = new Map<string, LineageCaseLinkSnapshot>();
  const staleRecoveries = new Map<string, PharmacyStaleOwnershipRecoveryRecordSnapshot>();
  const transitionJournal = new Map<string, PharmacyCaseTransitionJournalEntrySnapshot[]>();
  const eventJournal = new Map<string, PharmacyCaseEventJournalEntrySnapshot[]>();
  const originTupleIndex = new Map<string, string>();
  const replayIndex = new Map<string, string>();

  return {
    async getPharmacyCase(pharmacyCaseId) {
      const snapshot = pharmacyCases.get(pharmacyCaseId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listPharmacyCases() {
      return [...pharmacyCases.values()]
        .sort((left, right) => compareIso(left.createdAt, right.createdAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async getLineageCaseLink(lineageCaseLinkId) {
      const snapshot = lineageLinks.get(lineageCaseLinkId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getStaleOwnershipRecovery(staleOwnershipRecoveryId) {
      const snapshot = staleRecoveries.get(staleOwnershipRecoveryId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listTransitionJournal(pharmacyCaseId) {
      return (transitionJournal.get(pharmacyCaseId) ?? []).map(
        (entry) => new StoredDocument(entry),
      );
    },

    async listEventJournal(aggregateId) {
      return (eventJournal.get(aggregateId) ?? []).map((entry) => new StoredDocument(entry));
    },

    async savePharmacyCase(snapshot, options) {
      const normalized = normalizePharmacyCase(snapshot);
      saveWithCas(pharmacyCases, normalized.pharmacyCaseId, normalized, options);
    },

    async saveLineageCaseLink(snapshot, options) {
      saveWithCas(lineageLinks, snapshot.lineageCaseLinkId, structuredClone(snapshot), options);
    },

    async saveStaleOwnershipRecovery(snapshot, options) {
      const normalized = normalizeStaleRecovery(snapshot);
      saveWithCas(staleRecoveries, normalized.staleOwnershipRecoveryId, normalized, options);
    },

    async appendTransitionJournalEntry(snapshot) {
      const normalized = normalizeTransitionJournalEntry(snapshot);
      const current = transitionJournal.get(normalized.pharmacyCaseId) ?? [];
      transitionJournal.set(normalized.pharmacyCaseId, [...current, normalized]);
    },

    async appendEventJournalEntry(snapshot) {
      const normalized = normalizeEventJournalEntry(snapshot);
      const current = eventJournal.get(normalized.aggregateId) ?? [];
      eventJournal.set(normalized.aggregateId, [...current, normalized]);
    },

    async findPharmacyCaseByOriginTuple(originTupleDigest) {
      return originTupleIndex.get(originTupleDigest) ?? null;
    },

    async saveOriginTuple(originTupleDigest, pharmacyCaseId) {
      originTupleIndex.set(originTupleDigest, pharmacyCaseId);
    },

    async findReplayKey(replayKey) {
      return replayIndex.get(replayKey) ?? null;
    },

    async saveReplayKey(replayKey, pharmacyCaseId) {
      replayIndex.set(replayKey, pharmacyCaseId);
    },
  };
}

async function requirePharmacyCase(
  repositories: Phase6PharmacyCaseKernelRepositories,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  const document = await repositories.getPharmacyCase(pharmacyCaseId);
  invariant(document, "PHARMACY_CASE_NOT_FOUND", "PharmacyCase was not found.");
  return document.toSnapshot();
}

async function requireLineageCaseLink(
  repositories: Phase6PharmacyCaseKernelRepositories,
  lineageCaseLinkId: string,
): Promise<LineageCaseLinkSnapshot> {
  const document = await repositories.getLineageCaseLink(lineageCaseLinkId);
  invariant(document, "LINEAGE_CASE_LINK_NOT_FOUND", "LineageCaseLink was not found.");
  return document.toSnapshot();
}

async function buildBundle(
  repositories: Phase6PharmacyCaseKernelRepositories,
  pharmacyCaseId: string,
): Promise<PharmacyCaseBundle | null> {
  const document = await repositories.getPharmacyCase(pharmacyCaseId);
  if (!document) {
    return null;
  }
  const pharmacyCase = document.toSnapshot();
  const lineageCaseLink = await requireLineageCaseLink(
    repositories,
    pharmacyCase.lineageCaseLinkRef.refId,
  );
  const staleOwnerRecovery =
    pharmacyCase.staleOwnerRecoveryRef === null
      ? null
      : (await repositories.getStaleOwnershipRecovery(
          pharmacyCase.staleOwnerRecoveryRef.refId,
        ))?.toSnapshot() ?? null;
  const transitionJournal = (
    await repositories.listTransitionJournal(pharmacyCaseId)
  ).map((entry) => entry.toSnapshot());
  const eventJournal = (
    await repositories.listEventJournal(pharmacyCaseId)
  ).map((entry) => entry.toSnapshot());
  return {
    pharmacyCase,
    lineageCaseLink,
    transitionJournal,
    eventJournal,
    staleOwnerRecovery,
  };
}

interface PharmacyTransitionDefinition {
  transitionId: string;
  eventName: PharmacyCaseTransitionEventName;
  from: PharmacyCaseStatus;
  to: PharmacyCaseStatus;
}

const BASE_TRANSITIONS: readonly PharmacyTransitionDefinition[] = [
  {
    transitionId: "PH6_TX_001",
    eventName: "pharmacy.service_type.resolved",
    from: "candidate_received",
    to: "rules_evaluating",
  },
  {
    transitionId: "PH6_TX_002",
    eventName: "pharmacy.pathway.evaluated",
    from: "rules_evaluating",
    to: "ineligible_returned",
  },
  {
    transitionId: "PH6_TX_003",
    eventName: "pharmacy.pathway.evaluated",
    from: "rules_evaluating",
    to: "eligible_choice_pending",
  },
  {
    transitionId: "PH6_TX_004",
    eventName: "pharmacy.provider.selected",
    from: "eligible_choice_pending",
    to: "provider_selected",
  },
  {
    transitionId: "PH6_TX_005",
    eventName: "pharmacy.consent.checkpoint.updated",
    from: "provider_selected",
    to: "consent_pending",
  },
  {
    transitionId: "PH6_TX_006",
    eventName: "pharmacy.package.composed",
    from: "provider_selected",
    to: "package_ready",
  },
  {
    transitionId: "PH6_TX_007",
    eventName: "pharmacy.consent.checkpoint.updated",
    from: "consent_pending",
    to: "package_ready",
  },
  {
    transitionId: "PH6_TX_007A",
    eventName: "pharmacy.package.composed",
    from: "consent_pending",
    to: "package_ready",
  },
  {
    transitionId: "PH6_TX_008",
    eventName: "pharmacy.consent.revoked",
    from: "package_ready",
    to: "consent_pending",
  },
  {
    transitionId: "PH6_TX_009",
    eventName: "pharmacy.dispatch.started",
    from: "package_ready",
    to: "dispatch_pending",
  },
  {
    transitionId: "PH6_TX_010",
    eventName: "pharmacy.dispatch.confirmed",
    from: "dispatch_pending",
    to: "referred",
  },
  {
    transitionId: "PH6_TX_011",
    eventName: "pharmacy.dispatch.confirmed",
    from: "referred",
    to: "consultation_outcome_pending",
  },
  {
    transitionId: "PH6_TX_012",
    eventName: "pharmacy.case.resolved",
    from: "consultation_outcome_pending",
    to: "resolved_by_pharmacy",
  },
  {
    transitionId: "PH6_TX_013",
    eventName: "pharmacy.case.bounce_back",
    from: "consultation_outcome_pending",
    to: "unresolved_returned",
  },
  {
    transitionId: "PH6_TX_014",
    eventName: "pharmacy.case.bounce_back",
    from: "consultation_outcome_pending",
    to: "urgent_bounce_back",
  },
  {
    transitionId: "PH6_TX_015",
    eventName: "pharmacy.reachability.blocked",
    from: "consultation_outcome_pending",
    to: "no_contact_return_pending",
  },
  {
    transitionId: "PH6_TX_016",
    eventName: "pharmacy.outcome.received",
    from: "consultation_outcome_pending",
    to: "outcome_reconciliation_pending",
  },
  {
    transitionId: "PH6_TX_017",
    eventName: "pharmacy.outcome.reconciled",
    from: "outcome_reconciliation_pending",
    to: "resolved_by_pharmacy",
  },
  {
    transitionId: "PH6_TX_018",
    eventName: "pharmacy.outcome.reconciled",
    from: "outcome_reconciliation_pending",
    to: "unresolved_returned",
  },
  {
    transitionId: "PH6_TX_019",
    eventName: "pharmacy.outcome.reconciled",
    from: "outcome_reconciliation_pending",
    to: "urgent_bounce_back",
  },
  {
    transitionId: "PH6_TX_020",
    eventName: "pharmacy.outcome.reconciled",
    from: "outcome_reconciliation_pending",
    to: "no_contact_return_pending",
  },
  {
    transitionId: "PH6_TX_021",
    eventName: "pharmacy.case.closed",
    from: "resolved_by_pharmacy",
    to: "closed",
  },
] as const;

const REOPEN_TRANSITIONS: readonly PharmacyTransitionDefinition[] = [
  {
    transitionId: "PH6_REOPEN_001",
    eventName: "pharmacy.case.reopened",
    from: "unresolved_returned",
    to: "candidate_received",
  },
  {
    transitionId: "PH6_REOPEN_002",
    eventName: "pharmacy.case.reopened",
    from: "urgent_bounce_back",
    to: "rules_evaluating",
  },
  {
    transitionId: "PH6_REOPEN_003",
    eventName: "pharmacy.case.reopened",
    from: "no_contact_return_pending",
    to: "candidate_received",
  },
  {
    transitionId: "PH6_REOPEN_004",
    eventName: "pharmacy.case.reopened",
    from: "outcome_reconciliation_pending",
    to: "consent_pending",
  },
] as const;

const AUXILIARY_TRANSITIONS: readonly PharmacyTransitionDefinition[] = [
  {
    transitionId: "PH6_AUX_001",
    eventName: "pharmacy.dispatch.proof_missing",
    from: "dispatch_pending",
    to: "dispatch_pending",
  },
  {
    transitionId: "PH6_AUX_002",
    eventName: "pharmacy.dispatch.started",
    from: "dispatch_pending",
    to: "dispatch_pending",
  },
] as const;

function transitionKey(
  from: PharmacyCaseStatus,
  eventName: PharmacyCaseTransitionEventName,
  to: PharmacyCaseStatus,
): string {
  return `${from}::${eventName}::${to}`;
}

const TRANSITION_INDEX = new Map<string, PharmacyTransitionDefinition>(
  [...BASE_TRANSITIONS, ...REOPEN_TRANSITIONS, ...AUXILIARY_TRANSITIONS].map((transition) => [
    transitionKey(transition.from, transition.eventName, transition.to),
    transition,
  ]),
);

function assertTransitionAllowed(
  previousStatus: PharmacyCaseStatus,
  eventName: PharmacyCaseTransitionEventName,
  nextStatus: PharmacyCaseStatus,
): PharmacyTransitionDefinition {
  const transition = TRANSITION_INDEX.get(transitionKey(previousStatus, eventName, nextStatus));
  invariant(
    transition,
    "ILLEGAL_PHARMACY_CASE_TRANSITION",
    `PharmacyCase transition ${previousStatus} -> ${nextStatus} via ${eventName} is not allowed.`,
  );
  return transition;
}

function updateLineageFacts(
  lineage: LineageCaseLinkSnapshot,
  pharmacyCase: PharmacyCaseSnapshot,
  updatedAt: string,
  latestMilestoneRef: string,
): LineageCaseLinkSnapshot {
  return LineageCaseLinkAggregate.hydrate(lineage)
    .refreshOperationalFacts({
      currentClosureBlockerRefs: uniqueSortedRefs([
        ...pharmacyCase.currentClosureBlockerRefs,
        ...pharmacyCase.activeReachabilityDependencyRefs,
        ...(pharmacyCase.staleOwnerRecoveryRef === null
          ? []
          : [makeRef("StaleOwnershipRecoveryRecord", pharmacyCase.staleOwnerRecoveryRef.refId, TASK_342)]),
      ]).map((value) => value.refId),
      currentConfirmationGateRefs: pharmacyCase.currentConfirmationGateRefs.map((value) => value.refId),
      latestMilestoneRef,
      updatedAt,
    })
    .toSnapshot();
}

function buildTransitionJournalEntry(input: {
  idGenerator: BackboneIdGenerator;
  pharmacyCase: PharmacyCaseSnapshot;
  previousStatus: PharmacyCaseStatus | "none";
  nextStatus: PharmacyCaseStatus;
  transitionEvent: PharmacyCaseTransitionEventName;
  transitionOutcome: PharmacyTransitionOutcome;
  failureCode: string | null;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  leaseRefAtDecision: AggregateRef<"RequestLifecycleLease", Task342> | null;
  expectedOwnershipEpoch: number | null;
  expectedLineageFenceRef: AggregateRef<"LineageFence", Task342> | null;
  scopedMutationGateRef: string | null;
  transitionPredicateId: string;
  reasonCode: string;
  dependentRef: string | null;
  recordedAt: string;
  version: number;
}): PharmacyCaseTransitionJournalEntrySnapshot {
  return normalizeTransitionJournalEntry({
    pharmacyCaseTransitionJournalEntryId: nextPharmacyId(
      input.idGenerator,
      "pharmacy_case_transition_journal",
    ),
    pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
    lineageCaseLinkRef: input.pharmacyCase.lineageCaseLinkRef.refId,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    transitionEvent: input.transitionEvent,
    transitionOutcome: input.transitionOutcome,
    failureCode: input.failureCode,
    actorRef: input.actorRef,
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRecordRef: input.commandSettlementRecordRef,
    leaseRefAtDecision: input.leaseRefAtDecision?.refId ?? null,
    expectedOwnershipEpoch: input.expectedOwnershipEpoch,
    expectedLineageFenceRef: input.expectedLineageFenceRef?.refId ?? null,
    scopedMutationGateRef: input.scopedMutationGateRef,
    transitionPredicateId: input.transitionPredicateId,
    reasonCode: input.reasonCode,
    dependentRef: input.dependentRef,
    recordedAt: input.recordedAt,
    version: input.version,
  });
}

function makeEventJournalEntries(input: {
  idGenerator: BackboneIdGenerator;
  aggregateId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  events: readonly { eventName: PharmacyCaseTransitionEventName; payload: object }[];
  versionOffset: number;
}): {
  journalEntries: readonly PharmacyCaseEventJournalEntrySnapshot[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
} {
  const journalEntries = input.events.map((entry, index) =>
    normalizeEventJournalEntry({
      pharmacyCaseEventJournalEntryId: nextPharmacyId(
        input.idGenerator,
        "pharmacy_case_event_journal",
      ),
      aggregateKind: "pharmacy_case",
      aggregateId: input.aggregateId,
      eventName: entry.eventName,
      actorRef: input.actorRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      payloadDigest: stableReviewDigest(entry.payload),
      recordedAt: input.recordedAt,
      version: input.versionOffset + index + 1,
    }),
  );
  const emittedEvents = input.events.map((entry) =>
    makeFoundationEvent(entry.eventName, entry.payload),
  );
  return { journalEntries, emittedEvents };
}

function defaultOriginTupleDigest(input: CreatePharmacyCaseInput): string {
  return stableReviewDigest({
    originRequestId: input.originRequestId,
    pharmacyIntentId: input.pharmacyIntentId,
    sourceDecisionEpochRef: input.sourceDecisionEpochRef.refId,
  });
}

function defaultEvaluateReplayKey(input: EvaluatePharmacyCaseInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    ruleEvalRef: input.eligibilityRef.refId,
    candidatePathway: input.candidatePathway,
    outcome: input.evaluationOutcome,
  });
}

function defaultChooseReplayKey(input: ChoosePharmacyProviderInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    choiceSessionRef: input.choiceSessionRef.refId,
    selectedProviderRef: input.selectedProviderRef.refId,
    checkpointRef: input.activeConsentCheckpointRef.refId,
    checkpointState: input.checkpointState,
    finalizePackageReady: Boolean(input.finalizePackageReady),
  });
}

function defaultDispatchReplayKey(input: DispatchPharmacyReferralInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    dispatchAttemptRef: input.activeDispatchAttemptRef.refId,
    checkpointRef: input.activeConsentCheckpointRef.refId,
    proofState: input.dispatchProofState,
  });
}

function defaultOutcomeReplayKey(input: CapturePharmacyOutcomeInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    outcomeRef: input.outcomeRef?.refId ?? null,
    disposition: input.disposition,
    bounceBackRef: input.bounceBackRef?.refId ?? null,
  });
}

function defaultReopenReplayKey(input: ReopenPharmacyCaseInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    reopenToStatus: input.reopenToStatus,
    reasonCode: input.reasonCode,
    expectedOwnershipEpoch: input.expectedOwnershipEpoch,
  });
}

function defaultCloseReplayKey(input: ClosePharmacyCaseInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    closeDecisionRef: input.closeDecisionRef,
    expectedOwnershipEpoch: input.expectedOwnershipEpoch,
  });
}

function defaultReserveReplayKey(input: ReservePharmacyCaseMutationAuthorityInput): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    nextLeaseRef: input.nextLeaseRef.refId,
    nextOwnershipEpoch: input.nextOwnershipEpoch,
    nextLineageFenceRef: input.nextLineageFenceRef.refId,
  });
}

function ensureReopenAllowed(status: PharmacyCaseStatus): void {
  invariant(
    status === "unresolved_returned" ||
      status === "urgent_bounce_back" ||
      status === "no_contact_return_pending" ||
      status === "outcome_reconciliation_pending",
    "ILLEGAL_REOPEN_STATE",
    `PharmacyCase status ${status} cannot be reopened.`,
  );
}

function ensureDispatchAllowed(status: PharmacyCaseStatus): void {
  invariant(
    status === "package_ready" || status === "consent_pending" || status === "dispatch_pending",
    "ILLEGAL_DISPATCH_STATE",
    `PharmacyCase status ${status} does not allow dispatch.`,
  );
}

function ensureChooseAllowed(status: PharmacyCaseStatus): void {
  invariant(
    status === "eligible_choice_pending" || status === "consent_pending",
    "ILLEGAL_PROVIDER_SELECTION_STATE",
    `PharmacyCase status ${status} does not allow provider selection.`,
  );
}

function ensureOutcomeCaptureAllowed(status: PharmacyCaseStatus): void {
  invariant(
    status === "referred" ||
      status === "consultation_outcome_pending" ||
      status === "outcome_reconciliation_pending",
    "ILLEGAL_OUTCOME_CAPTURE_STATE",
    `PharmacyCase status ${status} does not allow outcome capture.`,
  );
}

export interface Phase6PharmacyCaseKernelService {
  readonly repositories: Phase6PharmacyCaseKernelStore;
  createPharmacyCase(input: CreatePharmacyCaseInput): Promise<PharmacyCaseMutationResult>;
  getPharmacyCase(pharmacyCaseId: string): Promise<PharmacyCaseBundle | null>;
  verifyMutationAuthority(
    input: VerifyPharmacyCaseMutationAuthorityInput,
  ): Promise<PharmacyAuthorityVerificationResult>;
  reserveMutationAuthority(
    input: ReservePharmacyCaseMutationAuthorityInput,
  ): Promise<PharmacyCaseMutationResult>;
  transitionPharmacyCase(
    input: PharmacyAuthorityCommandInput & {
      nextStatus: PharmacyCaseStatus;
      eventName: PharmacyCaseTransitionEventName;
      transitionPredicateId: string;
      dependentRef?: string | null;
    },
  ): Promise<PharmacyCaseMutationResult>;
  evaluatePharmacyCase(input: EvaluatePharmacyCaseInput): Promise<PharmacyCaseMutationResult>;
  choosePharmacyProvider(
    input: ChoosePharmacyProviderInput,
  ): Promise<PharmacyCaseMutationResult>;
  dispatchPharmacyReferral(
    input: DispatchPharmacyReferralInput,
  ): Promise<PharmacyCaseMutationResult>;
  capturePharmacyOutcome(
    input: CapturePharmacyOutcomeInput,
  ): Promise<PharmacyCaseMutationResult>;
  reopenPharmacyCase(input: ReopenPharmacyCaseInput): Promise<PharmacyCaseMutationResult>;
  closePharmacyCase(input: ClosePharmacyCaseInput): Promise<PharmacyCaseMutationResult>;
}

export function createPhase6PharmacyCaseKernelService(input?: {
  repositories?: Phase6PharmacyCaseKernelStore;
  idGenerator?: BackboneIdGenerator;
}): Phase6PharmacyCaseKernelService {
  const repositories = input?.repositories ?? createPhase6PharmacyCaseKernelStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase6-pharmacy-kernel");

  async function appendRejectedAudit(
    pharmacyCase: PharmacyCaseSnapshot,
    command: PharmacyAuthorityCommandInput,
    eventName: PharmacyCaseTransitionEventName,
    failureCode: string,
    transitionPredicateId: string,
  ): Promise<void> {
    const journal = await repositories.listTransitionJournal(pharmacyCase.pharmacyCaseId);
    await repositories.appendTransitionJournalEntry(
      buildTransitionJournalEntry({
        idGenerator,
        pharmacyCase,
        previousStatus: pharmacyCase.status,
        nextStatus: pharmacyCase.status,
        transitionEvent: eventName,
        transitionOutcome: "rejected",
        failureCode,
        actorRef: requireText(command.actorRef, "actorRef"),
        commandActionRecordRef: requireText(
          command.commandActionRecordRef,
          "commandActionRecordRef",
        ),
        commandSettlementRecordRef: requireText(
          command.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        leaseRefAtDecision: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        transitionPredicateId,
        reasonCode: command.reasonCode,
        dependentRef: null,
        recordedAt: command.recordedAt,
        version: journal.length + 1,
      }),
    );
  }

  async function appendEvents(
    pharmacyCaseId: string,
    actorRef: string,
    commandActionRecordRef: string,
    commandSettlementRecordRef: string,
    recordedAt: string,
    events: readonly { eventName: PharmacyCaseTransitionEventName; payload: object }[],
  ) {
    const current = await repositories.listEventJournal(pharmacyCaseId);
    const materialized = makeEventJournalEntries({
      idGenerator,
      aggregateId: pharmacyCaseId,
      actorRef,
      commandActionRecordRef,
      commandSettlementRecordRef,
      recordedAt,
      events,
      versionOffset: current.length,
    });
    for (const entry of materialized.journalEntries) {
      await repositories.appendEventJournalEntry(entry);
    }
    return materialized;
  }

  async function createOrRefreshStaleRecovery(
    pharmacyCase: PharmacyCaseSnapshot,
    command: PharmacyAuthorityCommandInput,
    failureCode: string,
  ): Promise<{
    pharmacyCase: PharmacyCaseSnapshot;
    staleOwnerRecovery: PharmacyStaleOwnershipRecoveryRecordSnapshot;
  }> {
    const existing =
      pharmacyCase.staleOwnerRecoveryRef === null
        ? null
        : (await repositories.getStaleOwnershipRecovery(
            pharmacyCase.staleOwnerRecoveryRef.refId,
          ))?.toSnapshot() ?? null;

    const staleOwnerRecovery =
      existing && existing.recoveryState === "pending"
        ? normalizeStaleRecovery({
            ...existing,
            failureCode,
            lastDetectedAt: command.recordedAt,
            version: nextVersion(existing.version),
          })
        : normalizeStaleRecovery({
            staleOwnershipRecoveryId: nextPharmacyId(
              idGenerator,
              "pharmacy_stale_ownership_recovery",
            ),
            pharmacyCaseRef: makeRef("PharmacyCase", pharmacyCase.pharmacyCaseId, TASK_342),
            leaseRefAtDetection: command.leaseRef,
            lineageFenceRefAtDetection: command.expectedLineageFenceRef,
            scopedMutationGateRef: command.scopedMutationGateRef,
            staleOwnershipEpoch: command.expectedOwnershipEpoch,
            failureCode,
            recoveryState: "pending",
            firstDetectedAt: command.recordedAt,
            lastDetectedAt: command.recordedAt,
            resolvedAt: null,
            resolutionLeaseRef: null,
            resolutionLineageFenceRef: null,
            resolutionOwnershipEpoch: null,
            version: 1,
          });

    await repositories.saveStaleOwnershipRecovery(
      staleOwnerRecovery,
      existing ? { expectedVersion: existing.version } : undefined,
    );

    const nextCase = normalizePharmacyCase({
      ...pharmacyCase,
      staleOwnerRecoveryRef: makeRef(
        "StaleOwnershipRecoveryRecord",
        staleOwnerRecovery.staleOwnershipRecoveryId,
        TASK_342,
      ),
      updatedAt: command.recordedAt,
      version: nextVersion(pharmacyCase.version),
    });
    await repositories.savePharmacyCase(nextCase, {
      expectedVersion: pharmacyCase.version,
    });
    const lineage = await requireLineageCaseLink(
      repositories,
      pharmacyCase.lineageCaseLinkRef.refId,
    );
    const nextLineage = updateLineageFacts(
      lineage,
      nextCase,
      command.recordedAt,
      "pharmacy_stale_owner_recovery",
    );
    await repositories.saveLineageCaseLink(nextLineage, {
      expectedVersion: lineage.version,
    });
    return { pharmacyCase: nextCase, staleOwnerRecovery };
  }

  async function requireAuthority(
    pharmacyCase: PharmacyCaseSnapshot,
    command: PharmacyAuthorityCommandInput,
    transitionEvent: PharmacyCaseTransitionEventName,
    options?: { allowOpenStaleRecovery?: boolean },
  ): Promise<PharmacyAuthorityVerificationResult> {
    const gateState = command.scopedMutationGateState ?? "admitted";
    if (gateState !== "admitted") {
      await appendRejectedAudit(
        pharmacyCase,
        command,
        transitionEvent,
        "SCOPED_MUTATION_GATE_DENIED",
        "PH6_AUTH_001",
      );
      invariant(false, "SCOPED_MUTATION_GATE_DENIED", "ScopedMutationGate denied the mutation.");
    }

    const staleLease = !sameRef(command.leaseRef, pharmacyCase.leaseRef);
    const staleEpoch = command.expectedOwnershipEpoch !== pharmacyCase.ownershipEpoch;
    const staleFence = !sameRef(command.expectedLineageFenceRef, pharmacyCase.lineageFenceRef);

    if (staleLease || staleEpoch || staleFence) {
      const failureCode = staleLease
        ? "STALE_REQUEST_LIFECYCLE_LEASE"
        : staleEpoch
          ? "STALE_OWNERSHIP_EPOCH"
          : "STALE_LINEAGE_FENCE";
      const recovery = await createOrRefreshStaleRecovery(pharmacyCase, command, failureCode);
      await appendRejectedAudit(
        recovery.pharmacyCase,
        command,
        transitionEvent,
        failureCode,
        "PH6_AUTH_002",
      );
      invariant(false, failureCode, "Presented mutation authority is stale.");
    }

    if (
      pharmacyCase.staleOwnerRecoveryRef !== null &&
      pharmacyCase.status !== "closed" &&
      !options?.allowOpenStaleRecovery
    ) {
      await appendRejectedAudit(
        pharmacyCase,
        command,
        transitionEvent,
        "STALE_OWNERSHIP_RECOVERY_OPEN",
        "PH6_AUTH_003",
      );
      invariant(
        false,
        "STALE_OWNERSHIP_RECOVERY_OPEN",
        "A pending stale-owner recovery blocks calm progression.",
      );
    }

    if (
      pharmacyCase.activeIdentityRepairCaseRef !== null &&
      pharmacyCase.identityRepairReleaseSettlementRef === null
    ) {
      await appendRejectedAudit(
        pharmacyCase,
        command,
        transitionEvent,
        "IDENTITY_REPAIR_BRANCH_ACTIVE",
        "PH6_AUTH_004",
      );
      invariant(
        false,
        "IDENTITY_REPAIR_BRANCH_ACTIVE",
        "Identity repair is active and the branch is not yet released.",
      );
    }

    return {
      pharmacyCase,
      staleOwnerRecovery: null,
    };
  }

  async function maybeReplay(
    replayKey: string,
  ): Promise<PharmacyCaseMutationResult | null> {
    const pharmacyCaseId = await repositories.findReplayKey(replayKey);
    if (!pharmacyCaseId) {
      return null;
    }
    const bundle = await buildBundle(repositories, pharmacyCaseId);
    invariant(bundle, "REPLAY_CASE_NOT_FOUND", "Replayed pharmacy case was not found.");
    return {
      pharmacyCase: bundle.pharmacyCase,
      lineageCaseLink: bundle.lineageCaseLink,
      transitionJournalEntries: [],
      eventJournalEntries: [],
      emittedEvents: [],
      staleOwnerRecovery: bundle.staleOwnerRecovery,
      replayed: true,
    };
  }

  async function persistMutation(input: {
    currentCase: PharmacyCaseSnapshot;
    currentLineage: LineageCaseLinkSnapshot;
    command:
      | PharmacyAuthorityCommandInput
      | {
          actorRef: string;
          commandActionRecordRef: string;
          commandSettlementRecordRef: string;
          recordedAt: string;
          reasonCode: string;
          leaseRef?: AggregateRef<"RequestLifecycleLease", Task342> | null;
          expectedOwnershipEpoch?: number | null;
          expectedLineageFenceRef?: AggregateRef<"LineageFence", Task342> | null;
          scopedMutationGateRef?: string | null;
        };
    steps: readonly {
      nextCase: PharmacyCaseSnapshot;
      eventName: PharmacyCaseTransitionEventName;
      transitionPredicateId: string;
      dependentRef?: string | null;
      payload: object;
      milestoneRef: string;
    }[];
  }): Promise<PharmacyCaseMutationResult> {
    let currentCase = input.currentCase;
    let currentLineage = input.currentLineage;
    const transitionEntries: PharmacyCaseTransitionJournalEntrySnapshot[] = [];
    const events: { eventName: PharmacyCaseTransitionEventName; payload: object }[] = [];
    const journal = await repositories.listTransitionJournal(currentCase.pharmacyCaseId);
    let versionOffset = journal.length;

    for (const step of input.steps) {
      const transition = assertTransitionAllowed(
        currentCase.status,
        step.eventName,
        step.nextCase.status,
      );
      const nextCase = normalizePharmacyCase(step.nextCase);
      await repositories.savePharmacyCase(nextCase, {
        expectedVersion: currentCase.version,
      });
      currentLineage = updateLineageFacts(
        currentLineage,
        nextCase,
        input.command.recordedAt,
        step.milestoneRef,
      );
      await repositories.saveLineageCaseLink(currentLineage, {
        expectedVersion: input.currentLineage.version + transitionEntries.length,
      });
      const transitionEntry = buildTransitionJournalEntry({
        idGenerator,
        pharmacyCase: nextCase,
        previousStatus: currentCase.status,
        nextStatus: nextCase.status,
        transitionEvent: step.eventName,
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: input.command.actorRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
        commandSettlementRecordRef: input.command.commandSettlementRecordRef,
        leaseRefAtDecision:
          "leaseRef" in input.command ? input.command.leaseRef ?? null : null,
        expectedOwnershipEpoch:
          "expectedOwnershipEpoch" in input.command
            ? input.command.expectedOwnershipEpoch ?? null
            : null,
        expectedLineageFenceRef:
          "expectedLineageFenceRef" in input.command
            ? input.command.expectedLineageFenceRef ?? null
            : null,
        scopedMutationGateRef:
          "scopedMutationGateRef" in input.command
            ? input.command.scopedMutationGateRef ?? null
            : null,
        transitionPredicateId: transition.transitionId ?? step.transitionPredicateId,
        reasonCode: input.command.reasonCode,
        dependentRef: step.dependentRef ?? null,
        recordedAt: input.command.recordedAt,
        version: versionOffset + 1,
      });
      versionOffset += 1;
      await repositories.appendTransitionJournalEntry(transitionEntry);
      transitionEntries.push(transitionEntry);
      events.push({
        eventName: step.eventName,
        payload: step.payload,
      });
      currentCase = nextCase;
    }

    const appendedEvents = await appendEvents(
      currentCase.pharmacyCaseId,
      input.command.actorRef,
      input.command.commandActionRecordRef,
      input.command.commandSettlementRecordRef,
      input.command.recordedAt,
      events,
    );

    return {
      pharmacyCase: currentCase,
      lineageCaseLink: currentLineage,
      transitionJournalEntries: transitionEntries,
      eventJournalEntries: appendedEvents.journalEntries,
      emittedEvents: appendedEvents.emittedEvents,
      staleOwnerRecovery:
        currentCase.staleOwnerRecoveryRef === null
          ? null
          : (await repositories.getStaleOwnershipRecovery(
              currentCase.staleOwnerRecoveryRef.refId,
            ))?.toSnapshot() ?? null,
      replayed: false,
    };
  }

  return {
    repositories,

    async createPharmacyCase(command) {
      const replayKey = command.idempotencyKey ?? defaultOriginTupleDigest(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const gateState = command.scopedMutationGateState ?? "admitted";
      invariant(gateState === "admitted", "SCOPED_MUTATION_GATE_DENIED", "ScopedMutationGate denied case creation.");
      invariant(
        command.activeIdentityRepairCaseRef === undefined ||
          command.activeIdentityRepairCaseRef === null,
        "IDENTITY_REPAIR_BRANCH_ACTIVE",
        "Identity repair must be released before a PharmacyCase can be created.",
      );

      const originTupleDigest = defaultOriginTupleDigest(command);
      const existingCaseId = await repositories.findPharmacyCaseByOriginTuple(originTupleDigest);
      if (existingCaseId) {
        const existing = await buildBundle(repositories, existingCaseId);
        invariant(existing, "PHARMACY_CASE_NOT_FOUND", "Existing PharmacyCase was not found.");
        await repositories.saveReplayKey(replayKey, existingCaseId);
        return {
          pharmacyCase: existing.pharmacyCase,
          lineageCaseLink: existing.lineageCaseLink,
          transitionJournalEntries: [],
          eventJournalEntries: [],
          emittedEvents: [],
          staleOwnerRecovery: existing.staleOwnerRecovery,
          replayed: true,
        };
      }

      const pharmacyCaseId =
        command.pharmacyCaseId ?? nextPharmacyId(idGenerator, "pharmacy_case");
      const createdAt = ensureIsoTimestamp(command.createdAt, "createdAt");
      const lineageAggregate = LineageCaseLinkAggregate.propose({
        lineageCaseLinkId:
          command.lineageCaseLinkId ?? nextPharmacyId(idGenerator, "pharmacy_lineage_case_link"),
        requestLineageRef: command.requestLineageRef.refId,
        episodeRef: command.episodeRef.refId,
        requestRef: command.originRequestId,
        caseFamily: "pharmacy",
        domainCaseRef: pharmacyCaseId,
        parentLineageCaseLinkRef: optionalText(command.parentLineageCaseLinkRef),
        originDecisionEpochRef: command.sourceDecisionEpochRef.refId,
        originDecisionSupersessionRef: command.sourceDecisionSupersessionRef?.refId ?? null,
        originTriageTaskRef: command.originTaskId,
        linkReason: command.linkReason ?? "direct_handoff",
        openedAt: createdAt,
      })
        .transition({
          nextState: "active",
          updatedAt: createdAt,
          latestMilestoneRef: "pharmacy_case_created",
        });

      await repositories.saveLineageCaseLink(lineageAggregate.toSnapshot());

      const pharmacyCase = normalizePharmacyCase({
        pharmacyCaseId,
        episodeRef: command.episodeRef,
        originRequestId: command.originRequestId,
        requestLineageRef: command.requestLineageRef,
        lineageCaseLinkRef: makeRef(
          "LineageCaseLink",
          lineageAggregate.lineageCaseLinkId,
          TASK_342,
        ),
        originTaskId: command.originTaskId,
        pharmacyIntentId: command.pharmacyIntentId,
        sourceDecisionEpochRef: command.sourceDecisionEpochRef,
        sourceDecisionSupersessionRef: command.sourceDecisionSupersessionRef ?? null,
        patientRef: command.patientRef,
        tenantId: command.tenantId,
        serviceType: command.serviceType,
        candidatePathway: command.candidatePathway ?? null,
        eligibilityRef: null,
        choiceSessionRef: null,
        selectedProviderRef: null,
        activeConsentRef: null,
        activeConsentCheckpointRef: null,
        latestConsentRevocationRef: null,
        activeDispatchAttemptRef: null,
        correlationRef: null,
        outcomeRef: null,
        bounceBackRef: null,
        leaseRef: command.leaseRef,
        ownershipEpoch: ensureNonNegativeInteger(
          command.initialOwnershipEpoch,
          "initialOwnershipEpoch",
        ),
        staleOwnerRecoveryRef: null,
        lineageFenceRef: command.lineageFenceRef,
        currentConfirmationGateRefs: [],
        currentClosureBlockerRefs: [],
        activeReachabilityDependencyRefs: [],
        activeIdentityRepairCaseRef: command.activeIdentityRepairCaseRef ?? null,
        identityRepairBranchDispositionRef:
          command.identityRepairBranchDispositionRef ?? null,
        identityRepairReleaseSettlementRef:
          command.identityRepairReleaseSettlementRef ?? null,
        status: "candidate_received",
        slaTargetAt: command.slaTargetAt,
        createdAt,
        updatedAt: createdAt,
        version: 1,
      });

      await repositories.savePharmacyCase(pharmacyCase);
      await repositories.saveOriginTuple(originTupleDigest, pharmacyCaseId);

      const transitionJournalEntry = buildTransitionJournalEntry({
        idGenerator,
        pharmacyCase,
        previousStatus: "none",
        nextStatus: "candidate_received",
        transitionEvent: "pharmacy.case.created",
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        leaseRefAtDecision: command.leaseRef,
        expectedOwnershipEpoch: command.initialOwnershipEpoch,
        expectedLineageFenceRef: command.lineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        transitionPredicateId: "PH6_CREATE_CASE",
        reasonCode: "create_case",
        dependentRef: lineageAggregate.lineageCaseLinkId,
        recordedAt: createdAt,
        version: 1,
      });
      await repositories.appendTransitionJournalEntry(transitionJournalEntry);

      const events = await appendEvents(
        pharmacyCaseId,
        command.actorRef,
        command.commandActionRecordRef,
        command.commandSettlementRecordRef,
        createdAt,
        [
          {
            eventName: "pharmacy.case.created",
            payload: {
              pharmacyCaseId,
              requestLineageRef: pharmacyCase.requestLineageRef.refId,
              lineageCaseLinkRef: pharmacyCase.lineageCaseLinkRef.refId,
              originRequestId: pharmacyCase.originRequestId,
              pharmacyIntentId: pharmacyCase.pharmacyIntentId,
              status: pharmacyCase.status,
            },
          },
        ],
      );
      await repositories.saveReplayKey(replayKey, pharmacyCaseId);

      return {
        pharmacyCase,
        lineageCaseLink: lineageAggregate.toSnapshot(),
        transitionJournalEntries: [transitionJournalEntry],
        eventJournalEntries: events.journalEntries,
        emittedEvents: events.emittedEvents,
        staleOwnerRecovery: null,
        replayed: false,
      };
    },

    async getPharmacyCase(pharmacyCaseId) {
      return buildBundle(repositories, pharmacyCaseId);
    },

    async verifyMutationAuthority(command) {
      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      return requireAuthority(pharmacyCase, command, "pharmacy.case.reopened");
    },

    async reserveMutationAuthority(command) {
      const replayKey = defaultReserveReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const gateState = command.scopedMutationGateState ?? "admitted";
      invariant(gateState === "admitted", "SCOPED_MUTATION_GATE_DENIED", "ScopedMutationGate denied the mutation authority reservation.");

      const currentCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const currentLineage = await requireLineageCaseLink(
        repositories,
        currentCase.lineageCaseLinkRef.refId,
      );

      const authorityCommand: PharmacyAuthorityCommandInput = {
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt: command.recordedAt,
        leaseRef: command.currentLeaseRef,
        expectedOwnershipEpoch: command.currentOwnershipEpoch,
        expectedLineageFenceRef: command.currentLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        scopedMutationGateState: gateState,
        reasonCode: command.reasonCode,
      };
      await requireAuthority(currentCase, authorityCommand, "pharmacy.case.reopened", {
        allowOpenStaleRecovery: true,
      });

      let staleOwnerRecovery: PharmacyStaleOwnershipRecoveryRecordSnapshot | null = null;
      if (currentCase.staleOwnerRecoveryRef !== null) {
        const currentRecovery = await repositories.getStaleOwnershipRecovery(
          currentCase.staleOwnerRecoveryRef.refId,
        );
        if (currentRecovery) {
          staleOwnerRecovery = normalizeStaleRecovery({
            ...currentRecovery.toSnapshot(),
            recoveryState: "resolved",
            lastDetectedAt: command.recordedAt,
            resolvedAt: command.recordedAt,
            resolutionLeaseRef: command.nextLeaseRef,
            resolutionLineageFenceRef: command.nextLineageFenceRef,
            resolutionOwnershipEpoch: command.nextOwnershipEpoch,
            version: nextVersion(currentRecovery.toSnapshot().version),
          });
          await repositories.saveStaleOwnershipRecovery(staleOwnerRecovery, {
            expectedVersion: currentRecovery.toSnapshot().version,
          });
        }
      }

      const nextCase = normalizePharmacyCase({
        ...currentCase,
        leaseRef: command.nextLeaseRef,
        ownershipEpoch: ensureNonNegativeInteger(command.nextOwnershipEpoch, "nextOwnershipEpoch"),
        lineageFenceRef: command.nextLineageFenceRef,
        staleOwnerRecoveryRef: null,
        updatedAt: command.recordedAt,
        version: nextVersion(currentCase.version),
      });

      await repositories.savePharmacyCase(nextCase, { expectedVersion: currentCase.version });
      const nextLineage = updateLineageFacts(
        currentLineage,
        nextCase,
        command.recordedAt,
        "pharmacy_mutation_authority_reserved",
      );
      await repositories.saveLineageCaseLink(nextLineage, {
        expectedVersion: currentLineage.version,
      });

      const existingJournal = await repositories.listTransitionJournal(nextCase.pharmacyCaseId);
      const transitionEntry = buildTransitionJournalEntry({
        idGenerator,
        pharmacyCase: nextCase,
        previousStatus: currentCase.status,
        nextStatus: nextCase.status,
        transitionEvent: "pharmacy.case.reopened",
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        leaseRefAtDecision: command.nextLeaseRef,
        expectedOwnershipEpoch: command.nextOwnershipEpoch,
        expectedLineageFenceRef: command.nextLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        transitionPredicateId: "PH6_AUTH_005",
        reasonCode: command.reasonCode,
        dependentRef: staleOwnerRecovery?.staleOwnershipRecoveryId ?? null,
        recordedAt: command.recordedAt,
        version: existingJournal.length + 1,
      });
      await repositories.appendTransitionJournalEntry(transitionEntry);
      const events = await appendEvents(
        nextCase.pharmacyCaseId,
        command.actorRef,
        command.commandActionRecordRef,
        command.commandSettlementRecordRef,
        command.recordedAt,
        [
          {
            eventName: "pharmacy.case.reopened",
            payload: {
              pharmacyCaseId: nextCase.pharmacyCaseId,
              leaseRef: nextCase.leaseRef.refId,
              ownershipEpoch: nextCase.ownershipEpoch,
              lineageFenceRef: nextCase.lineageFenceRef.refId,
              staleOwnerRecoveryResolved:
                staleOwnerRecovery?.staleOwnershipRecoveryId ?? null,
            },
          },
        ],
      );
      await repositories.saveReplayKey(replayKey, nextCase.pharmacyCaseId);

      return {
        pharmacyCase: nextCase,
        lineageCaseLink: nextLineage,
        transitionJournalEntries: [transitionEntry],
        eventJournalEntries: events.journalEntries,
        emittedEvents: events.emittedEvents,
        staleOwnerRecovery,
        replayed: false,
      };
    },

    async transitionPharmacyCase(command) {
      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const lineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      await requireAuthority(pharmacyCase, command, command.eventName);
      const transition = assertTransitionAllowed(
        pharmacyCase.status,
        command.eventName,
        command.nextStatus,
      );
      const nextCase = normalizePharmacyCase({
        ...pharmacyCase,
        status: command.nextStatus,
        updatedAt: command.recordedAt,
        version: nextVersion(pharmacyCase.version),
      });
      return persistMutation({
        currentCase: pharmacyCase,
        currentLineage: lineage,
        command,
        steps: [
          {
            nextCase,
            eventName: command.eventName,
            transitionPredicateId: transition.transitionId,
            dependentRef: command.dependentRef ?? null,
            payload: {
              pharmacyCaseId: nextCase.pharmacyCaseId,
              previousStatus: pharmacyCase.status,
              nextStatus: nextCase.status,
            },
            milestoneRef: `pharmacy_${command.nextStatus}`,
          },
        ],
      });
    },

    async evaluatePharmacyCase(command) {
      const replayKey = command.idempotencyKey ?? defaultEvaluateReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const lineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      invariant(
        pharmacyCase.status === "candidate_received" || pharmacyCase.status === "rules_evaluating",
        "ILLEGAL_EVALUATION_STATE",
        `PharmacyCase status ${pharmacyCase.status} does not allow evaluation.`,
      );
      await requireAuthority(pharmacyCase, command, "pharmacy.pathway.evaluated");

      const steps: {
        nextCase: PharmacyCaseSnapshot;
        eventName: PharmacyCaseTransitionEventName;
        transitionPredicateId: string;
        dependentRef?: string | null;
        payload: object;
        milestoneRef: string;
      }[] = [];

      let workingCase = pharmacyCase;

      if (workingCase.status === "candidate_received") {
        const nextCase = normalizePharmacyCase({
          ...workingCase,
          serviceType: command.serviceType,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "rules_evaluating",
        });
        steps.push({
          nextCase,
          eventName: "pharmacy.service_type.resolved",
          transitionPredicateId: "PH6_TX_001",
          dependentRef: null,
          payload: {
            pharmacyCaseId: workingCase.pharmacyCaseId,
            serviceType: command.serviceType,
            candidatePathway: command.candidatePathway,
          },
          milestoneRef: "pharmacy_rules_evaluating",
        });
        workingCase = nextCase;
      }

      const finalStatus =
        command.evaluationOutcome === "eligible"
          ? "eligible_choice_pending"
          : "ineligible_returned";
      const finalCase = normalizePharmacyCase({
        ...workingCase,
        serviceType: command.serviceType,
        candidatePathway: command.candidatePathway,
        eligibilityRef: command.eligibilityRef,
        sourceDecisionSupersessionRef: command.sourceDecisionSupersessionRef ?? workingCase.sourceDecisionSupersessionRef,
        updatedAt: command.recordedAt,
        version: nextVersion(workingCase.version),
        status: finalStatus,
      });
      steps.push({
        nextCase: finalCase,
        eventName: "pharmacy.pathway.evaluated",
        transitionPredicateId:
          finalStatus === "eligible_choice_pending" ? "PH6_TX_003" : "PH6_TX_002",
        dependentRef: command.eligibilityRef.refId,
        payload: {
          pharmacyCaseId: finalCase.pharmacyCaseId,
          eligibilityRef: command.eligibilityRef.refId,
          candidatePathway: command.candidatePathway,
          evaluationOutcome: command.evaluationOutcome,
          nextStatus: finalStatus,
        },
        milestoneRef: `pharmacy_${finalStatus}`,
      });

      const result = await persistMutation({
        currentCase: pharmacyCase,
        currentLineage: lineage,
        command,
        steps,
      });
      await repositories.saveReplayKey(replayKey, result.pharmacyCase.pharmacyCaseId);
      return result;
    },

    async choosePharmacyProvider(command) {
      const replayKey = command.idempotencyKey ?? defaultChooseReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const lineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      ensureChooseAllowed(pharmacyCase.status);
      await requireAuthority(pharmacyCase, command, "pharmacy.provider.selected");

      const steps: {
        nextCase: PharmacyCaseSnapshot;
        eventName: PharmacyCaseTransitionEventName;
        transitionPredicateId: string;
        dependentRef?: string | null;
        payload: object;
        milestoneRef: string;
      }[] = [];
      let workingCase = pharmacyCase;

      if (workingCase.status === "eligible_choice_pending") {
        const selectedCase = normalizePharmacyCase({
          ...workingCase,
          choiceSessionRef: command.choiceSessionRef,
          selectedProviderRef: command.selectedProviderRef,
          activeConsentRef: command.activeConsentRef ?? null,
          activeConsentCheckpointRef: command.activeConsentCheckpointRef,
          latestConsentRevocationRef: command.latestConsentRevocationRef ?? null,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "provider_selected",
        });
        steps.push({
          nextCase: selectedCase,
          eventName: "pharmacy.provider.selected",
          transitionPredicateId: "PH6_TX_004",
          dependentRef: command.selectedProviderRef.refId,
          payload: {
            pharmacyCaseId: selectedCase.pharmacyCaseId,
            choiceSessionRef: command.choiceSessionRef.refId,
            selectedProviderRef: command.selectedProviderRef.refId,
          },
          milestoneRef: "pharmacy_provider_selected",
        });
        workingCase = selectedCase;
      }

      if (command.checkpointState === "unsatisfied") {
        const pendingCase = normalizePharmacyCase({
          ...workingCase,
          activeConsentRef: command.activeConsentRef ?? null,
          activeConsentCheckpointRef: command.activeConsentCheckpointRef,
          latestConsentRevocationRef: command.latestConsentRevocationRef ?? null,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "consent_pending",
        });
        steps.push({
          nextCase: pendingCase,
          eventName: "pharmacy.consent.checkpoint.updated",
          transitionPredicateId: "PH6_TX_005",
          dependentRef: command.activeConsentCheckpointRef.refId,
          payload: {
            pharmacyCaseId: pendingCase.pharmacyCaseId,
            checkpointRef: command.activeConsentCheckpointRef.refId,
            checkpointState: command.checkpointState,
          },
          milestoneRef: "pharmacy_consent_pending",
        });
      } else if (Boolean(command.finalizePackageReady)) {
        const packageReadyCase = normalizePharmacyCase({
          ...workingCase,
          activeConsentRef: command.activeConsentRef ?? null,
          activeConsentCheckpointRef: command.activeConsentCheckpointRef,
          latestConsentRevocationRef: command.latestConsentRevocationRef ?? null,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "package_ready",
        });
        steps.push({
          nextCase: packageReadyCase,
          eventName: "pharmacy.package.composed",
          transitionPredicateId: "PH6_TX_006",
          dependentRef: command.activeConsentCheckpointRef.refId,
          payload: {
            pharmacyCaseId: packageReadyCase.pharmacyCaseId,
            selectedProviderRef: command.selectedProviderRef.refId,
            checkpointRef: command.activeConsentCheckpointRef.refId,
          },
          milestoneRef: "pharmacy_package_ready",
        });
      }

      const result = await persistMutation({
        currentCase: pharmacyCase,
        currentLineage: lineage,
        command,
        steps,
      });
      await repositories.saveReplayKey(replayKey, result.pharmacyCase.pharmacyCaseId);
      return result;
    },

    async dispatchPharmacyReferral(command) {
      const replayKey = command.idempotencyKey ?? defaultDispatchReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const lineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      ensureDispatchAllowed(pharmacyCase.status);
      await requireAuthority(pharmacyCase, command, "pharmacy.dispatch.started");

      const steps: {
        nextCase: PharmacyCaseSnapshot;
        eventName: PharmacyCaseTransitionEventName;
        transitionPredicateId: string;
        dependentRef?: string | null;
        payload: object;
        milestoneRef: string;
      }[] = [];
      let workingCase = pharmacyCase;

      if (workingCase.status === "consent_pending" && command.checkpointState === "satisfied") {
        const packageReadyCase = normalizePharmacyCase({
          ...workingCase,
          activeConsentCheckpointRef: command.activeConsentCheckpointRef,
          latestConsentRevocationRef: command.latestConsentRevocationRef ?? workingCase.latestConsentRevocationRef,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "package_ready",
        });
        steps.push({
          nextCase: packageReadyCase,
          eventName: "pharmacy.consent.checkpoint.updated",
          transitionPredicateId: "PH6_TX_007",
          dependentRef: command.activeConsentCheckpointRef.refId,
          payload: {
            pharmacyCaseId: packageReadyCase.pharmacyCaseId,
            checkpointRef: command.activeConsentCheckpointRef.refId,
            checkpointState: "satisfied",
          },
          milestoneRef: "pharmacy_package_ready",
        });
        workingCase = packageReadyCase;
      }

      if (command.checkpointState !== "satisfied") {
        invariant(
          workingCase.status === "package_ready",
          "CONSENT_INVALID",
          "Unsatisfied consent can only invalidate an existing package-ready case.",
        );
        const consentPendingCase = normalizePharmacyCase({
          ...workingCase,
          activeConsentCheckpointRef: command.activeConsentCheckpointRef,
          latestConsentRevocationRef: command.latestConsentRevocationRef ?? workingCase.latestConsentRevocationRef,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "consent_pending",
        });
        steps.push({
          nextCase: consentPendingCase,
          eventName: "pharmacy.consent.revoked",
          transitionPredicateId: "PH6_TX_008",
          dependentRef: command.latestConsentRevocationRef?.refId ?? null,
          payload: {
            pharmacyCaseId: consentPendingCase.pharmacyCaseId,
            checkpointRef: command.activeConsentCheckpointRef.refId,
            checkpointState: "unsatisfied",
          },
          milestoneRef: "pharmacy_consent_pending",
        });
      } else {
        invariant(
          workingCase.status === "package_ready" || workingCase.status === "dispatch_pending",
          "DISPATCH_REQUIRES_PACKAGE_READY_OR_PENDING",
          "Dispatch requires a package_ready or dispatch_pending case once consent is satisfied.",
        );
        const dispatchPendingCase = normalizePharmacyCase({
          ...workingCase,
          activeConsentCheckpointRef: command.activeConsentCheckpointRef,
          activeDispatchAttemptRef: command.activeDispatchAttemptRef,
          correlationRef: command.correlationRef ?? null,
          currentConfirmationGateRefs: uniqueSortedRefs(
            command.currentConfirmationGateRefs ?? workingCase.currentConfirmationGateRefs,
          ),
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "dispatch_pending",
        });
        steps.push({
          nextCase: dispatchPendingCase,
          eventName: "pharmacy.dispatch.started",
          transitionPredicateId: "PH6_TX_009",
          dependentRef: command.activeDispatchAttemptRef.refId,
          payload: {
            pharmacyCaseId: dispatchPendingCase.pharmacyCaseId,
            dispatchAttemptRef: command.activeDispatchAttemptRef.refId,
            checkpointRef: command.activeConsentCheckpointRef.refId,
            confirmationGateRefs: dispatchPendingCase.currentConfirmationGateRefs.map(
              (value) => value.refId,
            ),
          },
          milestoneRef: "pharmacy_dispatch_pending",
        });
        workingCase = dispatchPendingCase;

        if (command.dispatchProofState === "confirmed") {
          const referredCase = normalizePharmacyCase({
            ...workingCase,
            updatedAt: command.recordedAt,
            version: nextVersion(workingCase.version),
            status: "referred",
          });
          steps.push({
            nextCase: referredCase,
            eventName: "pharmacy.dispatch.confirmed",
            transitionPredicateId: "PH6_TX_010",
            dependentRef: command.activeDispatchAttemptRef.refId,
            payload: {
              pharmacyCaseId: referredCase.pharmacyCaseId,
              dispatchAttemptRef: command.activeDispatchAttemptRef.refId,
              proofState: "confirmed",
            },
            milestoneRef: "pharmacy_referred",
          });
        } else if (command.dispatchProofState === "missing") {
          const stillPending = normalizePharmacyCase({
            ...workingCase,
            updatedAt: command.recordedAt,
            version: nextVersion(workingCase.version),
          });
          steps.push({
            nextCase: stillPending,
            eventName: "pharmacy.dispatch.proof_missing",
            transitionPredicateId: "PH6_DISPATCH_PROOF_MISSING",
            dependentRef: command.activeDispatchAttemptRef.refId,
            payload: {
              pharmacyCaseId: stillPending.pharmacyCaseId,
              dispatchAttemptRef: command.activeDispatchAttemptRef.refId,
              proofState: "missing",
            },
            milestoneRef: "pharmacy_dispatch_pending",
          });
        }
      }

      const result = await persistMutation({
        currentCase: pharmacyCase,
        currentLineage: lineage,
        command,
        steps,
      });
      await repositories.saveReplayKey(replayKey, result.pharmacyCase.pharmacyCaseId);
      return result;
    },

    async capturePharmacyOutcome(command) {
      const replayKey = command.idempotencyKey ?? defaultOutcomeReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const lineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      ensureOutcomeCaptureAllowed(pharmacyCase.status);
      await requireAuthority(pharmacyCase, command, "pharmacy.outcome.received");

      const steps: {
        nextCase: PharmacyCaseSnapshot;
        eventName: PharmacyCaseTransitionEventName;
        transitionPredicateId: string;
        dependentRef?: string | null;
        payload: object;
        milestoneRef: string;
      }[] = [];
      let workingCase = pharmacyCase;

      if (workingCase.status === "referred") {
        const pendingCase = normalizePharmacyCase({
          ...workingCase,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "consultation_outcome_pending",
        });
        steps.push({
          nextCase: pendingCase,
          eventName: "pharmacy.dispatch.confirmed",
          transitionPredicateId: "PH6_TX_011",
          dependentRef: workingCase.activeDispatchAttemptRef?.refId ?? null,
          payload: {
            pharmacyCaseId: pendingCase.pharmacyCaseId,
            dispatchAttemptRef: pendingCase.activeDispatchAttemptRef?.refId ?? null,
          },
          milestoneRef: "pharmacy_consultation_outcome_pending",
        });
        workingCase = pendingCase;
      }

      if (command.disposition === "pending_review") {
        const reviewCase = normalizePharmacyCase({
          ...workingCase,
          outcomeRef: command.outcomeRef ?? workingCase.outcomeRef,
          correlationRef: command.correlationRef ?? workingCase.correlationRef,
          currentConfirmationGateRefs: workingCase.currentConfirmationGateRefs,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "outcome_reconciliation_pending",
        });
        steps.push({
          nextCase: reviewCase,
          eventName: "pharmacy.outcome.received",
          transitionPredicateId: "PH6_TX_016",
          dependentRef: command.outcomeRef?.refId ?? null,
          payload: {
            pharmacyCaseId: reviewCase.pharmacyCaseId,
            outcomeRef: command.outcomeRef?.refId ?? null,
            disposition: "pending_review",
          },
          milestoneRef: "pharmacy_outcome_reconciliation_pending",
        });
      } else if (command.disposition === "resolved_by_pharmacy") {
        const reconciledFromReview = workingCase.status === "outcome_reconciliation_pending";
        invariant(
          (command.currentClosureBlockerRefs ?? pharmacyCase.currentClosureBlockerRefs).length === 0,
          "CLOSURE_BLOCKER_OPEN",
          "Resolved-by-pharmacy requires no open closure blockers.",
        );
        invariant(
          (command.activeReachabilityDependencyRefs ??
            pharmacyCase.activeReachabilityDependencyRefs).length === 0,
          "REACHABILITY_DEPENDENCY_OPEN",
          "Resolved-by-pharmacy requires no active reachability dependencies.",
        );
        const resolvedCase = normalizePharmacyCase({
          ...workingCase,
          outcomeRef: command.outcomeRef ?? workingCase.outcomeRef,
          correlationRef: command.correlationRef ?? workingCase.correlationRef,
          currentConfirmationGateRefs: workingCase.currentConfirmationGateRefs,
          currentClosureBlockerRefs:
            command.currentClosureBlockerRefs ?? workingCase.currentClosureBlockerRefs,
          activeReachabilityDependencyRefs:
            command.activeReachabilityDependencyRefs ??
            workingCase.activeReachabilityDependencyRefs,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "resolved_by_pharmacy",
        });
        steps.push({
          nextCase: resolvedCase,
          eventName: reconciledFromReview ? "pharmacy.outcome.reconciled" : "pharmacy.case.resolved",
          transitionPredicateId: reconciledFromReview ? "PH6_TX_017" : "PH6_TX_012",
          dependentRef: command.outcomeRef?.refId ?? null,
          payload: {
            pharmacyCaseId: resolvedCase.pharmacyCaseId,
            outcomeRef: command.outcomeRef?.refId ?? null,
            disposition: "resolved_by_pharmacy",
          },
          milestoneRef: "pharmacy_resolved_by_pharmacy",
        });
      } else if (command.disposition === "unresolved_returned") {
        const reconciledFromReview = workingCase.status === "outcome_reconciliation_pending";
        const returnedCase = normalizePharmacyCase({
          ...workingCase,
          outcomeRef: command.outcomeRef ?? workingCase.outcomeRef,
          correlationRef: command.correlationRef ?? workingCase.correlationRef,
          bounceBackRef: command.bounceBackRef ?? workingCase.bounceBackRef,
          currentConfirmationGateRefs: workingCase.currentConfirmationGateRefs,
          currentClosureBlockerRefs:
            command.currentClosureBlockerRefs ?? workingCase.currentClosureBlockerRefs,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "unresolved_returned",
        });
        steps.push({
          nextCase: returnedCase,
          eventName: reconciledFromReview ? "pharmacy.outcome.reconciled" : "pharmacy.case.bounce_back",
          transitionPredicateId: reconciledFromReview ? "PH6_TX_018" : "PH6_TX_013",
          dependentRef: command.bounceBackRef?.refId ?? null,
          payload: {
            pharmacyCaseId: returnedCase.pharmacyCaseId,
            bounceBackRef: command.bounceBackRef?.refId ?? null,
            disposition: "unresolved_returned",
          },
          milestoneRef: "pharmacy_unresolved_returned",
        });
      } else if (command.disposition === "urgent_bounce_back") {
        const reconciledFromReview = workingCase.status === "outcome_reconciliation_pending";
        const urgentCase = normalizePharmacyCase({
          ...workingCase,
          outcomeRef: command.outcomeRef ?? workingCase.outcomeRef,
          correlationRef: command.correlationRef ?? workingCase.correlationRef,
          bounceBackRef: command.bounceBackRef ?? workingCase.bounceBackRef,
          currentConfirmationGateRefs: workingCase.currentConfirmationGateRefs,
          currentClosureBlockerRefs:
            command.currentClosureBlockerRefs ?? workingCase.currentClosureBlockerRefs,
          activeReachabilityDependencyRefs:
            command.activeReachabilityDependencyRefs ??
            workingCase.activeReachabilityDependencyRefs,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "urgent_bounce_back",
        });
        steps.push({
          nextCase: urgentCase,
          eventName: reconciledFromReview ? "pharmacy.outcome.reconciled" : "pharmacy.case.bounce_back",
          transitionPredicateId: reconciledFromReview ? "PH6_TX_019" : "PH6_TX_014",
          dependentRef: command.bounceBackRef?.refId ?? null,
          payload: {
            pharmacyCaseId: urgentCase.pharmacyCaseId,
            bounceBackRef: command.bounceBackRef?.refId ?? null,
            disposition: "urgent_bounce_back",
          },
          milestoneRef: "pharmacy_urgent_bounce_back",
        });
      } else {
        const reconciledFromReview = workingCase.status === "outcome_reconciliation_pending";
        const noContactCase = normalizePharmacyCase({
          ...workingCase,
          outcomeRef: command.outcomeRef ?? workingCase.outcomeRef,
          correlationRef: command.correlationRef ?? workingCase.correlationRef,
          bounceBackRef: command.bounceBackRef ?? workingCase.bounceBackRef,
          currentConfirmationGateRefs: workingCase.currentConfirmationGateRefs,
          currentClosureBlockerRefs:
            command.currentClosureBlockerRefs ?? workingCase.currentClosureBlockerRefs,
          activeReachabilityDependencyRefs:
            command.activeReachabilityDependencyRefs ??
            workingCase.activeReachabilityDependencyRefs,
          updatedAt: command.recordedAt,
          version: nextVersion(workingCase.version),
          status: "no_contact_return_pending",
        });
        steps.push({
          nextCase: noContactCase,
          eventName: reconciledFromReview ? "pharmacy.outcome.reconciled" : "pharmacy.reachability.blocked",
          transitionPredicateId: reconciledFromReview ? "PH6_TX_020" : "PH6_TX_015",
          dependentRef: command.bounceBackRef?.refId ?? null,
          payload: {
            pharmacyCaseId: noContactCase.pharmacyCaseId,
            bounceBackRef: command.bounceBackRef?.refId ?? null,
            disposition: "no_contact_return_pending",
          },
          milestoneRef: "pharmacy_no_contact_return_pending",
        });
      }

      const result = await persistMutation({
        currentCase: pharmacyCase,
        currentLineage: lineage,
        command,
        steps,
      });
      await repositories.saveReplayKey(replayKey, result.pharmacyCase.pharmacyCaseId);
      return result;
    },

    async reopenPharmacyCase(command) {
      const replayKey = command.idempotencyKey ?? defaultReopenReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const lineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      ensureReopenAllowed(pharmacyCase.status);
      await requireAuthority(pharmacyCase, command, "pharmacy.case.reopened");

      const transition = assertTransitionAllowed(
        pharmacyCase.status,
        "pharmacy.case.reopened",
        command.reopenToStatus,
      );
      const nextCase = normalizePharmacyCase({
        ...pharmacyCase,
        outcomeRef: command.clearOutcomeRef ? null : pharmacyCase.outcomeRef,
        bounceBackRef: command.clearBounceBackRef ? null : pharmacyCase.bounceBackRef,
        currentClosureBlockerRefs:
          command.currentClosureBlockerRefs ?? pharmacyCase.currentClosureBlockerRefs,
        activeReachabilityDependencyRefs:
          command.activeReachabilityDependencyRefs ?? pharmacyCase.activeReachabilityDependencyRefs,
        updatedAt: command.recordedAt,
        version: nextVersion(pharmacyCase.version),
        status: command.reopenToStatus,
      });

      const result = await persistMutation({
        currentCase: pharmacyCase,
        currentLineage: lineage,
        command,
        steps: [
          {
            nextCase,
            eventName: "pharmacy.case.reopened",
            transitionPredicateId: transition.transitionId,
            dependentRef: pharmacyCase.lineageCaseLinkRef.refId,
            payload: {
              pharmacyCaseId: nextCase.pharmacyCaseId,
              previousStatus: pharmacyCase.status,
              nextStatus: nextCase.status,
            },
            milestoneRef: `pharmacy_${nextCase.status}`,
          },
        ],
      });
      await repositories.saveReplayKey(replayKey, result.pharmacyCase.pharmacyCaseId);
      return result;
    },

    async closePharmacyCase(command) {
      const replayKey = command.idempotencyKey ?? defaultCloseReplayKey(command);
      const replayed = await maybeReplay(replayKey);
      if (replayed) {
        return replayed;
      }

      const pharmacyCase = await requirePharmacyCase(repositories, command.pharmacyCaseId);
      const currentLineage = await requireLineageCaseLink(
        repositories,
        pharmacyCase.lineageCaseLinkRef.refId,
      );
      await requireAuthority(pharmacyCase, command, "pharmacy.case.closed");
      if (pharmacyCase.status !== "resolved_by_pharmacy") {
        await appendRejectedAudit(
          pharmacyCase,
          command,
          "pharmacy.case.closed",
          "ILLEGAL_CLOSE_STATE",
          "PH6_TX_021",
        );
        invariant(
          false,
          "ILLEGAL_CLOSE_STATE",
          "Only resolved_by_pharmacy cases may close.",
        );
      }
      if (!command.lifecycleCloseApproved) {
        await appendRejectedAudit(
          pharmacyCase,
          command,
          "pharmacy.case.closed",
          "LIFECYCLE_COORDINATOR_APPROVAL_REQUIRED",
          "PH6_TX_021",
        );
        invariant(
          false,
          "LIFECYCLE_COORDINATOR_APPROVAL_REQUIRED",
          "LifecycleCoordinator remains the only request-closure authority.",
        );
      }
      if (pharmacyCase.currentConfirmationGateRefs.length > 0) {
        await appendRejectedAudit(
          pharmacyCase,
          command,
          "pharmacy.case.closed",
          "CONFIRMATION_GATE_OPEN",
          "PH6_TX_021",
        );
        invariant(
          false,
          "CONFIRMATION_GATE_OPEN",
          "Confirmation gates must be cleared before close.",
        );
      }
      if (pharmacyCase.currentClosureBlockerRefs.length > 0) {
        await appendRejectedAudit(
          pharmacyCase,
          command,
          "pharmacy.case.closed",
          "CLOSURE_BLOCKER_OPEN",
          "PH6_TX_021",
        );
        invariant(
          false,
          "CLOSURE_BLOCKER_OPEN",
          "Closure blockers must be cleared before close.",
        );
      }
      if (pharmacyCase.activeReachabilityDependencyRefs.length > 0) {
        await appendRejectedAudit(
          pharmacyCase,
          command,
          "pharmacy.case.closed",
          "REACHABILITY_DEPENDENCY_OPEN",
          "PH6_TX_021",
        );
        invariant(
          false,
          "REACHABILITY_DEPENDENCY_OPEN",
          "Reachability dependencies must be cleared before close.",
        );
      }
      if (
        pharmacyCase.identityRepairBranchDispositionRef !== null &&
        pharmacyCase.identityRepairReleaseSettlementRef === null
      ) {
        await appendRejectedAudit(
          pharmacyCase,
          command,
          "pharmacy.case.closed",
          "IDENTITY_REPAIR_BRANCH_ACTIVE",
          "PH6_TX_021",
        );
        invariant(
          false,
          "IDENTITY_REPAIR_BRANCH_ACTIVE",
          "Identity repair must be released before close.",
        );
      }

      const nextCase = normalizePharmacyCase({
        ...pharmacyCase,
        updatedAt: command.recordedAt,
        version: nextVersion(pharmacyCase.version),
        status: "closed",
      });

      await repositories.savePharmacyCase(nextCase, {
        expectedVersion: pharmacyCase.version,
      });
      const nextLineage = LineageCaseLinkAggregate.hydrate(currentLineage)
        .transition({
          nextState: "closed",
          updatedAt: command.recordedAt,
          latestMilestoneRef: command.closeDecisionRef,
        })
        .refreshOperationalFacts({
          currentClosureBlockerRefs: [],
          currentConfirmationGateRefs: [],
          latestMilestoneRef: command.closeDecisionRef,
          updatedAt: command.recordedAt,
        })
        .toSnapshot();
      await repositories.saveLineageCaseLink(nextLineage, {
        expectedVersion: currentLineage.version,
      });

      const existingJournal = await repositories.listTransitionJournal(nextCase.pharmacyCaseId);
      const transitionEntry = buildTransitionJournalEntry({
        idGenerator,
        pharmacyCase: nextCase,
        previousStatus: pharmacyCase.status,
        nextStatus: nextCase.status,
        transitionEvent: "pharmacy.case.closed",
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        leaseRefAtDecision: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        transitionPredicateId: "PH6_TX_021",
        reasonCode: command.reasonCode,
        dependentRef: command.closeDecisionRef,
        recordedAt: command.recordedAt,
        version: existingJournal.length + 1,
      });
      await repositories.appendTransitionJournalEntry(transitionEntry);
      const events = await appendEvents(
        nextCase.pharmacyCaseId,
        command.actorRef,
        command.commandActionRecordRef,
        command.commandSettlementRecordRef,
        command.recordedAt,
        [
          {
            eventName: "pharmacy.case.closed",
            payload: {
              pharmacyCaseId: nextCase.pharmacyCaseId,
              closeDecisionRef: command.closeDecisionRef,
              lineageCaseLinkRef: nextCase.lineageCaseLinkRef.refId,
            },
          },
        ],
      );
      await repositories.saveReplayKey(replayKey, nextCase.pharmacyCaseId);

      return {
        pharmacyCase: nextCase,
        lineageCaseLink: nextLineage,
        transitionJournalEntries: [transitionEntry],
        eventJournalEntries: events.journalEntries,
        emittedEvents: events.emittedEvents,
        staleOwnerRecovery: null,
        replayed: false,
      };
    },
  };
}
