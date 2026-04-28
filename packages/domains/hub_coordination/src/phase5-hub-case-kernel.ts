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
    `${field} must be between 0 and 1.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextHubId(idGenerator: BackboneIdGenerator, kind: string): string {
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
  map.set(key, structuredClone(row));
}

type Phase5NetworkRequestCreationMode = "phase4_fallback" | "governed_routing";

export type NetworkBookingPriorityBand =
  | "routine"
  | "priority"
  | "urgent"
  | "same_day"
  | "safety_escalation";

export type ClinicalWindowClass =
  | "within_required_window"
  | "approved_variance_allowed"
  | "outside_window_with_warning";

export type PreferredModality = "in_person" | "telephone" | "video" | "asynchronous";

export type TravelMode =
  | "any"
  | "public_transport"
  | "car_required"
  | "walking_only"
  | "assisted_travel";

export type ReasonForHubRouting =
  | "policy_required"
  | "no_local_capacity"
  | "waitlist_breach_risk"
  | "patient_requested_network"
  | "supervisor_return"
  | "callback_reentry";

export type HubCoordinationCaseStatus =
  | "hub_requested"
  | "intake_validated"
  | "queued"
  | "claimed"
  | "candidate_searching"
  | "candidates_ready"
  | "coordinator_selecting"
  | "candidate_revalidating"
  | "native_booking_pending"
  | "confirmation_pending"
  | "booked_pending_practice_ack"
  | "booked"
  | "closed"
  | "alternatives_offered"
  | "patient_choice_pending"
  | "callback_transfer_pending"
  | "callback_offered"
  | "escalated_back";

export type HubOwnerState =
  | "unclaimed"
  | "claimed_active"
  | "release_pending"
  | "transfer_pending"
  | "supervisor_override"
  | "stale_owner_recovery";

export type HubExternalConfirmationState =
  | "not_started"
  | "pending"
  | "confirmed"
  | "disputed"
  | "expired"
  | "recovery_required";

export type HubOrganisationKind = "practice" | "hub" | "pcn" | "site" | "platform";

export type HubTransitionOutcome = "applied" | "rejected";

export type SourceFreshnessState = "active" | "stale" | "superseded";

export interface NetworkClinicalTimeframeSnapshot {
  windowClass: ClinicalWindowClass;
  dueAt: string;
  latestSafeOfferAt: string | null;
  urgencyCarryFloor: number;
}

export interface NetworkModalityPreferenceSnapshot {
  preferredModes: readonly PreferredModality[];
  allowsInPerson: boolean;
  allowsRemote: boolean;
}

export interface NetworkContinuityPreferenceSnapshot {
  continuityMode:
    | "same_clinician_preferred"
    | "same_site_preferred"
    | "network_any"
    | "first_safe_available";
  preferredSiteRefs: readonly string[];
}

export interface NetworkAccessNeedsSnapshot {
  needsSummary: string;
  accessibilityRequirementRefs: readonly string[];
  communicationSupportRefs: readonly string[];
}

export interface NetworkTravelConstraintsSnapshot {
  travelMode: TravelMode;
  maxTravelMinutes: number | null;
  locationConstraintRefs: readonly string[];
}

export interface HubActingOrgSnapshot {
  organisationRef: string;
  organisationKind: HubOrganisationKind;
  siteRef: string | null;
}

export interface NetworkBookingRequestSnapshot {
  networkBookingRequestId: string;
  episodeRef: string;
  requestLineageRef: string;
  originLineageCaseLinkRef: string;
  originBookingCaseId: string;
  originRequestId: string;
  originPracticeOds: string;
  patientRef: string;
  priorityBand: NetworkBookingPriorityBand;
  clinicalTimeframe: NetworkClinicalTimeframeSnapshot;
  modalityPreference: NetworkModalityPreferenceSnapshot;
  clinicianType: string;
  continuityPreference: NetworkContinuityPreferenceSnapshot;
  accessNeeds: NetworkAccessNeedsSnapshot;
  travelConstraints: NetworkTravelConstraintsSnapshot;
  reasonForHubRouting: ReasonForHubRouting;
  requestedAt: string;
  creationMode: Phase5NetworkRequestCreationMode;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface HubCoordinationCaseSnapshot {
  hubCoordinationCaseId: string;
  episodeRef: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  parentLineageCaseLinkRef: string;
  networkBookingRequestId: string;
  servingPcnId: string;
  status: HubCoordinationCaseStatus;
  ownerState: HubOwnerState;
  claimedBy: string | null;
  actingOrg: HubActingOrgSnapshot | null;
  ownershipLeaseRef: string | null;
  activeOwnershipTransitionRef: string | null;
  ownershipFenceToken: string | null;
  ownershipEpoch: number;
  compiledPolicyBundleRef: string | null;
  enhancedAccessPolicyRef: string | null;
  policyEvaluationRef: string | null;
  policyTupleHash: string | null;
  candidateSnapshotRef: string | null;
  crossSiteDecisionPlanRef: string | null;
  activeAlternativeOfferSessionRef: string | null;
  activeOfferOptimisationPlanRef: string | null;
  latestOfferRegenerationSettlementRef: string | null;
  selectedCandidateRef: string | null;
  bookingEvidenceRef: string | null;
  networkAppointmentRef: string | null;
  offerToConfirmationTruthRef: string | null;
  activeFallbackRef: string | null;
  callbackExpectationRef: string | null;
  activeIdentityRepairCaseRef: string | null;
  identityRepairBranchDispositionRef: string | null;
  identityRepairReleaseSettlementRef: string | null;
  externalConfirmationState: HubExternalConfirmationState;
  practiceAckGeneration: number;
  practiceAckDueAt: string | null;
  openCaseBlockerRefs: readonly string[];
  lastProgressAt: string | null;
  slaTargetAt: string | null;
  queueEnteredAt: string | null;
  lastMaterialReturnAt: string | null;
  expectedCoordinationMinutes: number;
  urgencyCarry: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface HubCaseTransitionJournalEntrySnapshot {
  hubCaseTransitionJournalEntryId: string;
  hubCoordinationCaseId: string;
  networkBookingRequestId: string;
  lineageCaseLinkRef: string;
  previousStatus: HubCoordinationCaseStatus | "none";
  nextStatus: HubCoordinationCaseStatus;
  previousOwnerState: HubOwnerState | "none";
  nextOwnerState: HubOwnerState;
  transitionOutcome: HubTransitionOutcome;
  failureCode: string | null;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  expectedOwnershipEpoch: number | null;
  expectedOwnershipFenceToken: string | null;
  currentLineageFenceEpoch: number | null;
  transitionPredicateId: string;
  reasonCode: string;
  dependentRef: string | null;
  recordedAt: string;
  version: number;
}

export interface HubEventJournalEntrySnapshot {
  hubEventJournalEntryId: string;
  aggregateKind: "network_request" | "hub_case";
  aggregateId: string;
  eventName: string;
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

export interface CreateNetworkBookingRequestInput {
  networkBookingRequestId?: string;
  episodeRef: string;
  requestLineageRef: string;
  originLineageCaseLinkRef: string;
  originBookingCaseId: string;
  originRequestId: string;
  originPracticeOds: string;
  patientRef: string;
  priorityBand: NetworkBookingPriorityBand;
  clinicalTimeframe: NetworkClinicalTimeframeSnapshot;
  modalityPreference: NetworkModalityPreferenceSnapshot;
  clinicianType: string;
  continuityPreference: NetworkContinuityPreferenceSnapshot;
  accessNeeds: NetworkAccessNeedsSnapshot;
  travelConstraints: NetworkTravelConstraintsSnapshot;
  reasonForHubRouting: ReasonForHubRouting;
  requestedAt: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  creationMode: Phase5NetworkRequestCreationMode;
  sourceBookingBranchState?: SourceFreshnessState;
  idempotencyKey?: string;
}

export interface CreateHubCoordinationCaseInput {
  networkBookingRequestId: string;
  hubCoordinationCaseId?: string;
  servingPcnId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  createdAt: string;
  slaTargetAt?: string | null;
  expectedCoordinationMinutes?: number;
  carriedOpenCaseBlockerRefs?: readonly string[];
  lineageCaseLinkId?: string;
  sourceBookingBranchState?: SourceFreshnessState;
}

export interface HubCaseTransitionCommandInput {
  hubCoordinationCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  reasonCode: string;
  expectedOwnershipEpoch?: number | null;
  expectedOwnershipFenceToken?: string | null;
  currentLineageFenceEpoch?: number | null;
  sourceBookingBranchState?: SourceFreshnessState;
  leaseFreshness?: SourceFreshnessState;
  claimedBy?: string | null;
  actingOrg?: HubActingOrgSnapshot | null;
  ownershipLeaseRef?: string | null;
  activeOwnershipTransitionRef?: string | null;
  newOwnershipFenceToken?: string | null;
  nextClaimedBy?: string | null;
  nextActingOrg?: HubActingOrgSnapshot | null;
  nextOwnershipLeaseRef?: string | null;
  nextOwnershipFenceToken?: string | null;
  compiledPolicyBundleRef?: string | null;
  enhancedAccessPolicyRef?: string | null;
  policyEvaluationRef?: string | null;
  policyTupleHash?: string | null;
  candidateSnapshotRef?: string | null;
  crossSiteDecisionPlanRef?: string | null;
  activeAlternativeOfferSessionRef?: string | null;
  activeOfferOptimisationPlanRef?: string | null;
  latestOfferRegenerationSettlementRef?: string | null;
  selectedCandidateRef?: string | null;
  bookingEvidenceRef?: string | null;
  networkAppointmentRef?: string | null;
  offerToConfirmationTruthRef?: string | null;
  activeFallbackRef?: string | null;
  callbackExpectationRef?: string | null;
  activeIdentityRepairCaseRef?: string | null;
  identityRepairBranchDispositionRef?: string | null;
  identityRepairReleaseSettlementRef?: string | null;
  externalConfirmationState?: HubExternalConfirmationState;
  practiceAckGeneration?: number | null;
  practiceAckDueAt?: string | null;
  slaTargetAt?: string | null;
  queueEnteredAt?: string | null;
  lastMaterialReturnAt?: string | null;
  expectedCoordinationMinutes?: number | null;
  urgencyCarry?: number | null;
  carriedOpenCaseBlockerRefs?: readonly string[];
  closeDecisionRef?: string | null;
}

export interface NetworkBookingRequestCreationResult {
  networkBookingRequest: NetworkBookingRequestSnapshot;
  eventJournalEntries: readonly HubEventJournalEntrySnapshot[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
  replayed: boolean;
}

export interface HubCaseTransitionResult {
  networkBookingRequest: NetworkBookingRequestSnapshot;
  hubCase: HubCoordinationCaseSnapshot;
  lineageCaseLink: LineageCaseLinkSnapshot;
  transitionJournalEntry: HubCaseTransitionJournalEntrySnapshot;
  transitionJournal: readonly HubCaseTransitionJournalEntrySnapshot[];
  eventJournalEntries: readonly HubEventJournalEntrySnapshot[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface HubCaseBundle {
  networkBookingRequest: NetworkBookingRequestSnapshot;
  hubCase: HubCoordinationCaseSnapshot;
  lineageCaseLink: LineageCaseLinkSnapshot;
  transitionJournal: readonly HubCaseTransitionJournalEntrySnapshot[];
  eventJournal: readonly HubEventJournalEntrySnapshot[];
}

export interface Phase5HubCaseKernelRepositories {
  getNetworkBookingRequest(
    networkBookingRequestId: string,
  ): Promise<SnapshotDocument<NetworkBookingRequestSnapshot> | null>;
  getHubCoordinationCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubCoordinationCaseSnapshot> | null>;
  getLineageCaseLink(
    lineageCaseLinkId: string,
  ): Promise<SnapshotDocument<LineageCaseLinkSnapshot> | null>;
  listTransitionJournal(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<HubCaseTransitionJournalEntrySnapshot>[]>;
  listEventJournal(
    aggregateId: string,
  ): Promise<readonly SnapshotDocument<HubEventJournalEntrySnapshot>[]>;
}

export interface Phase5HubCaseKernelStore extends Phase5HubCaseKernelRepositories {
  saveNetworkBookingRequest(
    snapshot: NetworkBookingRequestSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveHubCoordinationCase(
    snapshot: HubCoordinationCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveLineageCaseLink(
    snapshot: LineageCaseLinkSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendTransitionJournalEntry(snapshot: HubCaseTransitionJournalEntrySnapshot): Promise<void>;
  appendEventJournalEntry(snapshot: HubEventJournalEntrySnapshot): Promise<void>;
  findNetworkBookingRequestByIdempotencyKey(
    replayKey: string,
  ): Promise<string | null>;
  saveNetworkBookingRequestReplay(replayKey: string, requestId: string): Promise<void>;
  findHubCoordinationCaseByNetworkRequestId(
    networkBookingRequestId: string,
  ): Promise<SnapshotDocument<HubCoordinationCaseSnapshot> | null>;
  findActiveHubLineageCaseLink(
    requestLineageRef: string,
    domainCaseRef: string,
  ): Promise<SnapshotDocument<LineageCaseLinkSnapshot> | null>;
}

function normalizeClinicalTimeframe(
  input: NetworkClinicalTimeframeSnapshot,
): NetworkClinicalTimeframeSnapshot {
  return {
    windowClass: input.windowClass,
    dueAt: ensureIsoTimestamp(input.dueAt, "clinicalTimeframe.dueAt"),
    latestSafeOfferAt: optionalRef(input.latestSafeOfferAt)
      ? ensureIsoTimestamp(input.latestSafeOfferAt!, "clinicalTimeframe.latestSafeOfferAt")
      : null,
    urgencyCarryFloor: ensureUnitInterval(
      input.urgencyCarryFloor,
      "clinicalTimeframe.urgencyCarryFloor",
    ),
  };
}

function normalizeModalityPreference(
  input: NetworkModalityPreferenceSnapshot,
): NetworkModalityPreferenceSnapshot {
  invariant(
    Array.isArray(input.preferredModes) && input.preferredModes.length > 0,
    "INVALID_PREFERRED_MODES",
    "preferredModes must contain at least one allowed modality.",
  );
  return {
    preferredModes: [...new Set(input.preferredModes)],
    allowsInPerson: Boolean(input.allowsInPerson),
    allowsRemote: Boolean(input.allowsRemote),
  };
}

function normalizeContinuityPreference(
  input: NetworkContinuityPreferenceSnapshot,
): NetworkContinuityPreferenceSnapshot {
  return {
    continuityMode: input.continuityMode,
    preferredSiteRefs: uniqueSortedRefs(input.preferredSiteRefs ?? []),
  };
}

function normalizeAccessNeeds(input: NetworkAccessNeedsSnapshot): NetworkAccessNeedsSnapshot {
  return {
    needsSummary: requireRef(input.needsSummary, "accessNeeds.needsSummary"),
    accessibilityRequirementRefs: uniqueSortedRefs(
      input.accessibilityRequirementRefs ?? [],
    ),
    communicationSupportRefs: uniqueSortedRefs(input.communicationSupportRefs ?? []),
  };
}

function normalizeTravelConstraints(
  input: NetworkTravelConstraintsSnapshot,
): NetworkTravelConstraintsSnapshot {
  return {
    travelMode: input.travelMode,
    maxTravelMinutes:
      input.maxTravelMinutes === null || input.maxTravelMinutes === undefined
        ? null
        : ensureNonNegativeInteger(input.maxTravelMinutes, "travelConstraints.maxTravelMinutes"),
    locationConstraintRefs: uniqueSortedRefs(input.locationConstraintRefs ?? []),
  };
}

function normalizeActingOrg(input: HubActingOrgSnapshot | null | undefined): HubActingOrgSnapshot | null {
  if (input === null || input === undefined) {
    return null;
  }
  return {
    organisationRef: requireRef(input.organisationRef, "actingOrg.organisationRef"),
    organisationKind: input.organisationKind,
    siteRef: optionalRef(input.siteRef),
  };
}

function normalizeNetworkBookingRequest(
  snapshot: NetworkBookingRequestSnapshot,
): NetworkBookingRequestSnapshot {
  return {
    ...snapshot,
    networkBookingRequestId: requireRef(
      snapshot.networkBookingRequestId,
      "networkBookingRequestId",
    ),
    episodeRef: requireRef(snapshot.episodeRef, "episodeRef"),
    requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
    originLineageCaseLinkRef: requireRef(
      snapshot.originLineageCaseLinkRef,
      "originLineageCaseLinkRef",
    ),
    originBookingCaseId: requireRef(snapshot.originBookingCaseId, "originBookingCaseId"),
    originRequestId: requireRef(snapshot.originRequestId, "originRequestId"),
    originPracticeOds: requireRef(snapshot.originPracticeOds, "originPracticeOds"),
    patientRef: requireRef(snapshot.patientRef, "patientRef"),
    clinicianType: requireRef(snapshot.clinicianType, "clinicianType"),
    clinicalTimeframe: normalizeClinicalTimeframe(snapshot.clinicalTimeframe),
    modalityPreference: normalizeModalityPreference(snapshot.modalityPreference),
    continuityPreference: normalizeContinuityPreference(snapshot.continuityPreference),
    accessNeeds: normalizeAccessNeeds(snapshot.accessNeeds),
    travelConstraints: normalizeTravelConstraints(snapshot.travelConstraints),
    requestedAt: ensureIsoTimestamp(snapshot.requestedAt, "requestedAt"),
    commandActionRecordRef: requireRef(snapshot.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      snapshot.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeHubCoordinationCase(
  snapshot: HubCoordinationCaseSnapshot,
): HubCoordinationCaseSnapshot {
  const normalized: HubCoordinationCaseSnapshot = {
    ...snapshot,
    hubCoordinationCaseId: requireRef(snapshot.hubCoordinationCaseId, "hubCoordinationCaseId"),
    episodeRef: requireRef(snapshot.episodeRef, "episodeRef"),
    requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
    lineageCaseLinkRef: requireRef(snapshot.lineageCaseLinkRef, "lineageCaseLinkRef"),
    parentLineageCaseLinkRef: requireRef(
      snapshot.parentLineageCaseLinkRef,
      "parentLineageCaseLinkRef",
    ),
    networkBookingRequestId: requireRef(
      snapshot.networkBookingRequestId,
      "networkBookingRequestId",
    ),
    servingPcnId: requireRef(snapshot.servingPcnId, "servingPcnId"),
    claimedBy: optionalRef(snapshot.claimedBy),
    actingOrg: normalizeActingOrg(snapshot.actingOrg),
    ownershipLeaseRef: optionalRef(snapshot.ownershipLeaseRef),
    activeOwnershipTransitionRef: optionalRef(snapshot.activeOwnershipTransitionRef),
    ownershipFenceToken: optionalRef(snapshot.ownershipFenceToken),
    ownershipEpoch: ensureNonNegativeInteger(snapshot.ownershipEpoch, "ownershipEpoch"),
    compiledPolicyBundleRef: optionalRef(snapshot.compiledPolicyBundleRef),
    enhancedAccessPolicyRef: optionalRef(snapshot.enhancedAccessPolicyRef),
    policyEvaluationRef: optionalRef(snapshot.policyEvaluationRef),
    policyTupleHash: optionalRef(snapshot.policyTupleHash),
    candidateSnapshotRef: optionalRef(snapshot.candidateSnapshotRef),
    crossSiteDecisionPlanRef: optionalRef(snapshot.crossSiteDecisionPlanRef),
    activeAlternativeOfferSessionRef: optionalRef(snapshot.activeAlternativeOfferSessionRef),
    activeOfferOptimisationPlanRef: optionalRef(snapshot.activeOfferOptimisationPlanRef),
    latestOfferRegenerationSettlementRef: optionalRef(
      snapshot.latestOfferRegenerationSettlementRef,
    ),
    selectedCandidateRef: optionalRef(snapshot.selectedCandidateRef),
    bookingEvidenceRef: optionalRef(snapshot.bookingEvidenceRef),
    networkAppointmentRef: optionalRef(snapshot.networkAppointmentRef),
    offerToConfirmationTruthRef: optionalRef(snapshot.offerToConfirmationTruthRef),
    activeFallbackRef: optionalRef(snapshot.activeFallbackRef),
    callbackExpectationRef: optionalRef(snapshot.callbackExpectationRef),
    activeIdentityRepairCaseRef: optionalRef(snapshot.activeIdentityRepairCaseRef),
    identityRepairBranchDispositionRef: optionalRef(
      snapshot.identityRepairBranchDispositionRef,
    ),
    identityRepairReleaseSettlementRef: optionalRef(
      snapshot.identityRepairReleaseSettlementRef,
    ),
    practiceAckGeneration: ensureNonNegativeInteger(
      snapshot.practiceAckGeneration,
      "practiceAckGeneration",
    ),
    practiceAckDueAt: optionalRef(snapshot.practiceAckDueAt)
      ? ensureIsoTimestamp(snapshot.practiceAckDueAt!, "practiceAckDueAt")
      : null,
    openCaseBlockerRefs: uniqueSortedRefs(snapshot.openCaseBlockerRefs ?? []),
    lastProgressAt: optionalRef(snapshot.lastProgressAt)
      ? ensureIsoTimestamp(snapshot.lastProgressAt!, "lastProgressAt")
      : null,
    slaTargetAt: optionalRef(snapshot.slaTargetAt)
      ? ensureIsoTimestamp(snapshot.slaTargetAt!, "slaTargetAt")
      : null,
    queueEnteredAt: optionalRef(snapshot.queueEnteredAt)
      ? ensureIsoTimestamp(snapshot.queueEnteredAt!, "queueEnteredAt")
      : null,
    lastMaterialReturnAt: optionalRef(snapshot.lastMaterialReturnAt)
      ? ensureIsoTimestamp(snapshot.lastMaterialReturnAt!, "lastMaterialReturnAt")
      : null,
    expectedCoordinationMinutes: ensureNonNegativeInteger(
      snapshot.expectedCoordinationMinutes,
      "expectedCoordinationMinutes",
    ),
    urgencyCarry: ensureUnitInterval(snapshot.urgencyCarry, "urgencyCarry"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };

  invariant(
    normalized.status !== "closed" || normalized.openCaseBlockerRefs.length === 0,
    "CLOSED_CASE_WITH_BLOCKERS",
    "Closed hub cases must not retain open blockers.",
  );
  invariant(
    normalized.status !== "closed" ||
      (normalized.ownerState === "unclaimed" &&
        normalized.claimedBy === null &&
        normalized.actingOrg === null &&
        normalized.ownershipLeaseRef === null &&
        normalized.activeOwnershipTransitionRef === null &&
        normalized.ownershipFenceToken === null),
    "CLOSED_CASE_REQUIRES_RELEASED_OWNERSHIP",
    "Closed hub cases must not retain live ownership state, leases, or fence tokens.",
  );
  invariant(
    normalized.ownerState !== "claimed_active" ||
      (normalized.claimedBy !== null &&
        normalized.actingOrg !== null &&
        normalized.ownershipLeaseRef !== null &&
        normalized.ownershipFenceToken !== null),
    "CLAIMED_CASE_REQUIRES_ACTIVE_OWNER",
    "claimed_active cases require claimedBy, actingOrg, ownership lease, and fence token.",
  );

  return normalized;
}

function normalizeTransitionJournalEntry(
  snapshot: HubCaseTransitionJournalEntrySnapshot,
): HubCaseTransitionJournalEntrySnapshot {
  return {
    ...snapshot,
    hubCaseTransitionJournalEntryId: requireRef(
      snapshot.hubCaseTransitionJournalEntryId,
      "hubCaseTransitionJournalEntryId",
    ),
    hubCoordinationCaseId: requireRef(snapshot.hubCoordinationCaseId, "hubCoordinationCaseId"),
    networkBookingRequestId: requireRef(
      snapshot.networkBookingRequestId,
      "networkBookingRequestId",
    ),
    lineageCaseLinkRef: requireRef(snapshot.lineageCaseLinkRef, "lineageCaseLinkRef"),
    actorRef: requireRef(snapshot.actorRef, "actorRef"),
    routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
    commandActionRecordRef: requireRef(snapshot.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      snapshot.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    expectedOwnershipEpoch:
      snapshot.expectedOwnershipEpoch === null || snapshot.expectedOwnershipEpoch === undefined
        ? null
        : ensureNonNegativeInteger(snapshot.expectedOwnershipEpoch, "expectedOwnershipEpoch"),
    expectedOwnershipFenceToken: optionalRef(snapshot.expectedOwnershipFenceToken),
    currentLineageFenceEpoch:
      snapshot.currentLineageFenceEpoch === null || snapshot.currentLineageFenceEpoch === undefined
        ? null
        : ensureNonNegativeInteger(snapshot.currentLineageFenceEpoch, "currentLineageFenceEpoch"),
    transitionPredicateId: requireRef(snapshot.transitionPredicateId, "transitionPredicateId"),
    reasonCode: requireRef(snapshot.reasonCode, "reasonCode"),
    dependentRef: optionalRef(snapshot.dependentRef),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeEventJournalEntry(
  snapshot: HubEventJournalEntrySnapshot,
): HubEventJournalEntrySnapshot {
  return {
    ...snapshot,
    hubEventJournalEntryId: requireRef(snapshot.hubEventJournalEntryId, "hubEventJournalEntryId"),
    aggregateId: requireRef(snapshot.aggregateId, "aggregateId"),
    eventName: requireRef(snapshot.eventName, "eventName"),
    actorRef: requireRef(snapshot.actorRef, "actorRef"),
    commandActionRecordRef: requireRef(snapshot.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      snapshot.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    payloadDigest: requireRef(snapshot.payloadDigest, "payloadDigest"),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function initialHubStatusBlockers(status: HubCoordinationCaseStatus): readonly string[] {
  if (status === "hub_requested") {
    return ["policy_tuple_stale"];
  }
  if (status === "booked_pending_practice_ack") {
    return ["practice_ack_debt_open"];
  }
  if (status === "confirmation_pending" || status === "native_booking_pending") {
    return ["confirmation_truth_pending"];
  }
  if (status === "callback_transfer_pending") {
    return ["callback_linkage_pending"];
  }
  if (status === "escalated_back") {
    return ["return_linkage_pending"];
  }
  if (status === "alternatives_offered" || status === "patient_choice_pending") {
    return ["offer_truth_blocks_close"];
  }
  if (status === "candidate_revalidating") {
    return ["selected_candidate_not_revalidated"];
  }
  return [];
}

const phase5HubStatusGraph: Readonly<Record<HubCoordinationCaseStatus, readonly HubCoordinationCaseStatus[]>> =
  {
    hub_requested: ["intake_validated"],
    intake_validated: ["queued", "claimed"],
    queued: ["claimed", "escalated_back"],
    claimed: ["candidate_searching", "queued"],
    candidate_searching: ["candidates_ready", "callback_transfer_pending", "escalated_back"],
    candidates_ready: [
      "coordinator_selecting",
      "alternatives_offered",
      "callback_transfer_pending",
      "escalated_back",
    ],
    coordinator_selecting: [
      "alternatives_offered",
      "candidate_revalidating",
      "callback_transfer_pending",
      "escalated_back",
    ],
    candidate_revalidating: [
      "native_booking_pending",
      "alternatives_offered",
      "callback_transfer_pending",
      "escalated_back",
    ],
    native_booking_pending: [
      "confirmation_pending",
      "booked_pending_practice_ack",
      "callback_transfer_pending",
      "escalated_back",
    ],
    confirmation_pending: [
      "booked_pending_practice_ack",
      "callback_transfer_pending",
      "escalated_back",
    ],
    booked_pending_practice_ack: ["booked_pending_practice_ack", "booked", "escalated_back"],
    booked: ["booked_pending_practice_ack", "closed"],
    closed: [],
    alternatives_offered: [
      "patient_choice_pending",
      "coordinator_selecting",
      "callback_transfer_pending",
      "escalated_back",
    ],
    patient_choice_pending: [
      "coordinator_selecting",
      "callback_transfer_pending",
      "escalated_back",
    ],
    callback_transfer_pending: ["callback_offered", "escalated_back"],
    callback_offered: ["closed"],
    escalated_back: ["closed"],
  };

const phase5HubTransitionPredicateIds = {
  "hub_requested->intake_validated": "P311_REQUEST_LINEAGE_BOUND",
  "intake_validated->queued": "P311_QUEUE_ADMISSION_CLEAR",
  "intake_validated->claimed": "P311_QUEUE_ADMISSION_CLEAR",
  "queued->claimed": "P311_CASE_CLAIMED_FROM_QUEUE",
  "queued->escalated_back": "P311_RETURN_FROM_QUEUE",
  "claimed->candidate_searching": "P311_REFRESH_CANDIDATES_ALLOWED",
  "claimed->queued": "P315_RELEASE_TO_QUEUE",
  "candidate_searching->candidates_ready": "P311_CANDIDATES_CURRENT",
  "candidate_searching->callback_transfer_pending": "P311_CALLBACK_PENDING_FROM_SEARCH",
  "candidate_searching->escalated_back": "P311_RETURN_FROM_SEARCH",
  "candidates_ready->coordinator_selecting": "P311_SELECTION_RESUMED",
  "candidates_ready->alternatives_offered": "P311_ALTERNATIVES_GENERATED",
  "candidates_ready->callback_transfer_pending": "P311_CALLBACK_PENDING_FROM_READY",
  "candidates_ready->escalated_back": "P311_RETURN_FROM_READY",
  "coordinator_selecting->alternatives_offered": "P320_ALTERNATIVES_REOPENED_FROM_DIRECT_SELECTION",
  "coordinator_selecting->candidate_revalidating": "P311_SELECTED_CANDIDATE_PRECHECK",
  "coordinator_selecting->callback_transfer_pending": "P311_CALLBACK_CHOSEN_BY_COORDINATOR",
  "coordinator_selecting->escalated_back": "P311_RETURN_CHOSEN_BY_COORDINATOR",
  "candidate_revalidating->native_booking_pending": "P311_REVALIDATION_PASSED",
  "candidate_revalidating->alternatives_offered": "P311_REVALIDATION_FALLBACK_TO_OFFER",
  "candidate_revalidating->callback_transfer_pending": "P311_REVALIDATION_FALLBACK_TO_CALLBACK",
  "candidate_revalidating->escalated_back": "P311_REVALIDATION_FALLBACK_TO_RETURN",
  "native_booking_pending->confirmation_pending": "P311_PENDING_CONFIRMATION_ONLY",
  "native_booking_pending->booked_pending_practice_ack": "P311_CONFIRMED_PENDING_ACK",
  "native_booking_pending->callback_transfer_pending": "P311_COMMIT_MOVED_TO_CALLBACK_RECOVERY",
  "native_booking_pending->escalated_back": "P311_COMMIT_RETURN_REQUIRED",
  "confirmation_pending->booked_pending_practice_ack": "P311_CONFIRMATION_GATE_CLEARED",
  "confirmation_pending->callback_transfer_pending": "P311_CONFIRMATION_PENDING_TO_CALLBACK",
  "confirmation_pending->escalated_back": "P311_CONFIRMATION_PENDING_TO_RETURN",
  "booked_pending_practice_ack->booked_pending_practice_ack": "P322_ACK_DEBT_REFRESHED",
  "booked_pending_practice_ack->booked": "P311_ACK_GENERATION_SATISFIED",
  "booked_pending_practice_ack->escalated_back": "P311_ACK_FAILURE_ESCALATES",
  "booked->booked_pending_practice_ack": "P322_ACK_DEBT_REOPENED",
  "booked->closed": "P311_OPEN_BLOCKERS_EMPTY",
  "alternatives_offered->patient_choice_pending": "P311_OFFER_DELIVERED",
  "alternatives_offered->coordinator_selecting": "P311_DIRECT_SELECTION_RESUMED",
  "alternatives_offered->callback_transfer_pending": "P311_CALLBACK_SELECTED_FROM_FALLBACK_CARD",
  "alternatives_offered->escalated_back": "P311_RETURN_AFTER_OFFER_GENERATION",
  "patient_choice_pending->coordinator_selecting": "P311_PATIENT_SELECTED_ENTRY",
  "patient_choice_pending->callback_transfer_pending": "P311_PATIENT_REQUESTED_CALLBACK",
  "patient_choice_pending->escalated_back": "P311_CHOICE_WINDOW_EXPIRED_TO_RETURN",
  "callback_transfer_pending->callback_offered": "P311_CALLBACK_LINKED",
  "callback_transfer_pending->escalated_back": "P311_CALLBACK_LINKAGE_ABORTED_TO_RETURN",
  "callback_offered->closed": "P311_CALLBACK_CONTINUATION_DURABLE",
  "escalated_back->closed": "P311_RETURN_CONTINUATION_DURABLE",
};

function requireLegalStatusTransition(
  currentStatus: HubCoordinationCaseStatus,
  nextStatus: HubCoordinationCaseStatus,
): string {
  invariant(
    phase5HubStatusGraph[currentStatus].includes(nextStatus),
    "ILLEGAL_HUB_CASE_TRANSITION",
    `HubCoordinationCase transition ${currentStatus} -> ${nextStatus} is not allowed.`,
  );
  const key = `${currentStatus}->${nextStatus}`;
  return phase5HubTransitionPredicateIds[key as keyof typeof phase5HubTransitionPredicateIds];
}

function mapRoutingReasonToLineageReason(reason: ReasonForHubRouting): LineageCaseLinkReason {
  if (reason === "callback_reentry") {
    return "recovery_follow_on";
  }
  if (reason === "supervisor_return") {
    return "bounce_back";
  }
  return "direct_handoff";
}

function computeOpenCaseBlockers(
  snapshot: Pick<
    HubCoordinationCaseSnapshot,
    | "status"
    | "ownerState"
    | "ownershipLeaseRef"
    | "activeOwnershipTransitionRef"
    | "activeIdentityRepairCaseRef"
    | "identityRepairBranchDispositionRef"
    | "identityRepairReleaseSettlementRef"
  >,
  carriedRefs: readonly string[],
): string[] {
  const blockers = new Set<string>(carriedRefs);
  if (snapshot.status !== "closed" && snapshot.ownerState !== "unclaimed") {
    blockers.add("ownership_lease_live");
  }
  if (snapshot.activeOwnershipTransitionRef !== null) {
    blockers.add("ownership_transition_open");
  }
  if (
    snapshot.activeIdentityRepairCaseRef !== null ||
    (snapshot.identityRepairBranchDispositionRef !== null &&
      snapshot.identityRepairReleaseSettlementRef === null)
  ) {
    blockers.add("identity_repair_active");
  }
  return [...blockers].sort();
}

function mergeCaseSnapshot(
  current: HubCoordinationCaseSnapshot,
  updates: Partial<HubCoordinationCaseSnapshot>,
  status: HubCoordinationCaseStatus,
  recordedAt: string,
  carriedBlockerRefs: readonly string[],
): HubCoordinationCaseSnapshot {
  const merged = normalizeHubCoordinationCase({
    ...current,
    ...updates,
    status,
    updatedAt: recordedAt,
    version: nextVersion(current.version),
    openCaseBlockerRefs: computeOpenCaseBlockers(
      {
        status,
        ownerState: updates.ownerState ?? current.ownerState,
        ownershipLeaseRef:
          updates.ownershipLeaseRef === undefined
            ? current.ownershipLeaseRef
            : updates.ownershipLeaseRef,
        activeOwnershipTransitionRef:
          updates.activeOwnershipTransitionRef === undefined
            ? current.activeOwnershipTransitionRef
            : updates.activeOwnershipTransitionRef,
        activeIdentityRepairCaseRef:
          updates.activeIdentityRepairCaseRef === undefined
            ? current.activeIdentityRepairCaseRef
            : updates.activeIdentityRepairCaseRef,
        identityRepairBranchDispositionRef:
          updates.identityRepairBranchDispositionRef === undefined
            ? current.identityRepairBranchDispositionRef
            : updates.identityRepairBranchDispositionRef,
        identityRepairReleaseSettlementRef:
          updates.identityRepairReleaseSettlementRef === undefined
            ? current.identityRepairReleaseSettlementRef
            : updates.identityRepairReleaseSettlementRef,
      },
      carriedBlockerRefs,
    ),
  });
  return merged;
}

function makeEventJournalEntries(input: {
  idGenerator: BackboneIdGenerator;
  aggregateKind: "network_request" | "hub_case";
  aggregateId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  events: readonly { eventName: string; payload: object }[];
}): {
  journalEntries: readonly HubEventJournalEntrySnapshot[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
} {
  const journalEntries = input.events.map((entry, index) =>
    normalizeEventJournalEntry({
      hubEventJournalEntryId: nextHubId(input.idGenerator, "hub_event_journal"),
      aggregateKind: input.aggregateKind,
      aggregateId: input.aggregateId,
      eventName: entry.eventName,
      actorRef: input.actorRef,
      commandActionRecordRef: input.commandActionRecordRef,
      commandSettlementRecordRef: input.commandSettlementRecordRef,
      payloadDigest: stableReviewDigest(entry.payload),
      recordedAt: input.recordedAt,
      version: index + 1,
    }),
  );
  const emittedEvents = input.events.map((entry) =>
    makeFoundationEvent(entry.eventName, entry.payload),
  );
  return { journalEntries, emittedEvents };
}

function buildTransitionJournalEntry(input: {
  idGenerator: BackboneIdGenerator;
  hubCase: HubCoordinationCaseSnapshot;
  previousStatus: HubCoordinationCaseStatus | "none";
  previousOwnerState: HubOwnerState | "none";
  nextStatus: HubCoordinationCaseStatus;
  nextOwnerState: HubOwnerState;
  transitionOutcome: HubTransitionOutcome;
  failureCode: string | null;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  expectedOwnershipEpoch: number | null;
  expectedOwnershipFenceToken: string | null;
  currentLineageFenceEpoch: number | null;
  transitionPredicateId: string;
  reasonCode: string;
  dependentRef: string | null;
  recordedAt: string;
  version: number;
}): HubCaseTransitionJournalEntrySnapshot {
  return normalizeTransitionJournalEntry({
    hubCaseTransitionJournalEntryId: nextHubId(input.idGenerator, "hub_case_transition_journal"),
    hubCoordinationCaseId: input.hubCase.hubCoordinationCaseId,
    networkBookingRequestId: input.hubCase.networkBookingRequestId,
    lineageCaseLinkRef: input.hubCase.lineageCaseLinkRef,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    previousOwnerState: input.previousOwnerState,
    nextOwnerState: input.nextOwnerState,
    transitionOutcome: input.transitionOutcome,
    failureCode: input.failureCode,
    actorRef: input.actorRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRecordRef: input.commandSettlementRecordRef,
    expectedOwnershipEpoch: input.expectedOwnershipEpoch,
    expectedOwnershipFenceToken: input.expectedOwnershipFenceToken,
    currentLineageFenceEpoch: input.currentLineageFenceEpoch,
    transitionPredicateId: input.transitionPredicateId,
    reasonCode: input.reasonCode,
    dependentRef: input.dependentRef,
    recordedAt: input.recordedAt,
    version: input.version,
  });
}

export function createPhase5HubCaseKernelStore(): Phase5HubCaseKernelStore {
  const networkRequests = new Map<string, NetworkBookingRequestSnapshot>();
  const hubCases = new Map<string, HubCoordinationCaseSnapshot>();
  const lineageCaseLinks = new Map<string, LineageCaseLinkSnapshot>();
  const transitionJournal = new Map<string, HubCaseTransitionJournalEntrySnapshot[]>();
  const eventJournal = new Map<string, HubEventJournalEntrySnapshot[]>();
  const requestReplay = new Map<string, string>();
  const caseByNetworkRequestId = new Map<string, string>();

  return {
    async getNetworkBookingRequest(networkBookingRequestId) {
      const snapshot = networkRequests.get(networkBookingRequestId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getHubCoordinationCase(hubCoordinationCaseId) {
      const snapshot = hubCases.get(hubCoordinationCaseId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getLineageCaseLink(lineageCaseLinkId) {
      const snapshot = lineageCaseLinks.get(lineageCaseLinkId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listTransitionJournal(hubCoordinationCaseId) {
      return (transitionJournal.get(hubCoordinationCaseId) ?? []).map(
        (snapshot) => new StoredDocument(snapshot),
      );
    },

    async listEventJournal(aggregateId) {
      return (eventJournal.get(aggregateId) ?? []).map((snapshot) => new StoredDocument(snapshot));
    },

    async saveNetworkBookingRequest(snapshot, options) {
      saveWithCas(
        networkRequests,
        snapshot.networkBookingRequestId,
        normalizeNetworkBookingRequest(snapshot),
        options,
      );
    },

    async saveHubCoordinationCase(snapshot, options) {
      const normalized = normalizeHubCoordinationCase(snapshot);
      saveWithCas(hubCases, normalized.hubCoordinationCaseId, normalized, options);
      caseByNetworkRequestId.set(normalized.networkBookingRequestId, normalized.hubCoordinationCaseId);
    },

    async saveLineageCaseLink(snapshot, options) {
      saveWithCas(
        lineageCaseLinks,
        snapshot.lineageCaseLinkId,
        structuredClone(snapshot),
        options,
      );
    },

    async appendTransitionJournalEntry(snapshot) {
      const normalized = normalizeTransitionJournalEntry(snapshot);
      const current = transitionJournal.get(normalized.hubCoordinationCaseId) ?? [];
      transitionJournal.set(normalized.hubCoordinationCaseId, [...current, normalized]);
    },

    async appendEventJournalEntry(snapshot) {
      const normalized = normalizeEventJournalEntry(snapshot);
      const current = eventJournal.get(normalized.aggregateId) ?? [];
      eventJournal.set(normalized.aggregateId, [...current, normalized]);
    },

    async findNetworkBookingRequestByIdempotencyKey(replayKey) {
      return requestReplay.get(replayKey) ?? null;
    },

    async saveNetworkBookingRequestReplay(replayKey, requestId) {
      requestReplay.set(replayKey, requestId);
    },

    async findHubCoordinationCaseByNetworkRequestId(networkBookingRequestId) {
      const caseId = caseByNetworkRequestId.get(networkBookingRequestId);
      if (!caseId) {
        return null;
      }
      const snapshot = hubCases.get(caseId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async findActiveHubLineageCaseLink(requestLineageRef, domainCaseRef) {
      for (const snapshot of lineageCaseLinks.values()) {
        if (
          snapshot.requestLineageRef === requestLineageRef &&
          snapshot.domainCaseRef === domainCaseRef &&
          snapshot.caseFamily === "hub" &&
          snapshot.ownershipState !== "superseded" &&
          snapshot.ownershipState !== "compensated"
        ) {
          return new StoredDocument(snapshot);
        }
      }
      return null;
    },
  };
}

async function requireRequest(
  repositories: Phase5HubCaseKernelRepositories,
  networkBookingRequestId: string,
): Promise<NetworkBookingRequestSnapshot> {
  const document = await repositories.getNetworkBookingRequest(networkBookingRequestId);
  invariant(document, "NETWORK_BOOKING_REQUEST_NOT_FOUND", "NetworkBookingRequest was not found.");
  return document.toSnapshot();
}

async function requireCase(
  repositories: Phase5HubCaseKernelRepositories,
  hubCoordinationCaseId: string,
): Promise<HubCoordinationCaseSnapshot> {
  const document = await repositories.getHubCoordinationCase(hubCoordinationCaseId);
  invariant(document, "HUB_CASE_NOT_FOUND", "HubCoordinationCase was not found.");
  return document.toSnapshot();
}

async function requireLineageCaseLink(
  repositories: Phase5HubCaseKernelRepositories,
  lineageCaseLinkId: string,
): Promise<LineageCaseLinkSnapshot> {
  const document = await repositories.getLineageCaseLink(lineageCaseLinkId);
  invariant(document, "LINEAGE_CASE_LINK_NOT_FOUND", "Hub lineage case link was not found.");
  return document.toSnapshot();
}

function requireSourceFreshness(
  state: SourceFreshnessState | undefined,
  code: string,
  label: string,
): void {
  if (!state) {
    return;
  }
  invariant(state === "active", code, `${label} is ${state}.`);
}

function requireOwnershipFence(
  hubCase: HubCoordinationCaseSnapshot,
  command: HubCaseTransitionCommandInput,
): void {
  if (hubCase.status === "closed") {
    invariant(false, "CASE_ALREADY_CLOSED", "Closed hub cases cannot accept new mutations.");
  }
  if (hubCase.ownerState === "unclaimed") {
    if (command.expectedOwnershipEpoch !== undefined && command.expectedOwnershipEpoch !== null) {
      invariant(
        command.expectedOwnershipEpoch === hubCase.ownershipEpoch,
        "STALE_OWNERSHIP_EPOCH",
        "The presented ownership epoch is stale.",
      );
    }
    return;
  }
  invariant(
    command.expectedOwnershipEpoch !== undefined && command.expectedOwnershipEpoch !== null,
    "OWNERSHIP_EPOCH_REQUIRED",
    "expectedOwnershipEpoch is required for owned hub mutations.",
  );
  invariant(
    command.expectedOwnershipEpoch === hubCase.ownershipEpoch,
    "STALE_OWNERSHIP_EPOCH",
    "The presented ownership epoch is stale.",
  );
  invariant(
    command.expectedOwnershipFenceToken !== undefined &&
      command.expectedOwnershipFenceToken !== null,
    "OWNERSHIP_FENCE_TOKEN_REQUIRED",
    "expectedOwnershipFenceToken is required for owned hub mutations.",
  );
  invariant(
    command.expectedOwnershipFenceToken === hubCase.ownershipFenceToken,
    "STALE_OWNERSHIP_FENCE",
    "The presented ownership fence token is stale.",
  );
}

function requireCurrentFenceForOwnerAction(
  hubCase: HubCoordinationCaseSnapshot,
  command: HubCaseTransitionCommandInput,
): void {
  invariant(
    command.expectedOwnershipEpoch !== undefined && command.expectedOwnershipEpoch !== null,
    "OWNERSHIP_EPOCH_REQUIRED",
    "expectedOwnershipEpoch is required.",
  );
  invariant(
    command.expectedOwnershipEpoch === hubCase.ownershipEpoch,
    "STALE_OWNERSHIP_EPOCH",
    "The presented ownership epoch is stale.",
  );
  if (hubCase.ownershipFenceToken !== null) {
    invariant(
      command.expectedOwnershipFenceToken !== undefined &&
        command.expectedOwnershipFenceToken !== null,
      "OWNERSHIP_FENCE_TOKEN_REQUIRED",
      "expectedOwnershipFenceToken is required.",
    );
    invariant(
      command.expectedOwnershipFenceToken === hubCase.ownershipFenceToken,
      "STALE_OWNERSHIP_FENCE",
      "The presented ownership fence token is stale.",
    );
  }
}

function requireField<T>(value: T | null | undefined, code: string, message: string): T {
  invariant(value !== null && value !== undefined, code, message);
  return value;
}

export interface Phase5HubCaseKernelService {
  readonly repositories: Phase5HubCaseKernelStore;
  createNetworkBookingRequestFromPhase4Fallback(
    input: Omit<CreateNetworkBookingRequestInput, "creationMode">,
  ): Promise<NetworkBookingRequestCreationResult>;
  createNetworkBookingRequestFromGovernedRouting(
    input: Omit<CreateNetworkBookingRequestInput, "creationMode">,
  ): Promise<NetworkBookingRequestCreationResult>;
  createHubCoordinationCaseFromNetworkRequest(
    input: CreateHubCoordinationCaseInput,
  ): Promise<HubCaseTransitionResult>;
  validateIntake(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  queueHubCase(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  claimHubCase(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  releaseHubCase(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  transferHubOwnership(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  markStaleOwnerRecoveryPending(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  beginCandidateSearch(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  publishCandidatesReady(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  enterCoordinatorSelecting(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  enterAlternativesOffered(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  refreshAlternativeOfferPointers(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  enterPatientChoicePending(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  enterCandidateRevalidating(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  enterNativeBookingPending(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  markConfirmationPending(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  markBookedPendingPracticeAcknowledgement(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  markBooked(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  markCallbackTransferPending(
    input: HubCaseTransitionCommandInput,
  ): Promise<HubCaseTransitionResult>;
  markCallbackOffered(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  markEscalatedBack(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  closeHubCase(input: HubCaseTransitionCommandInput): Promise<HubCaseTransitionResult>;
  queryHubCaseBundle(hubCoordinationCaseId: string): Promise<HubCaseBundle | null>;
}

async function buildBundle(
  repositories: Phase5HubCaseKernelRepositories,
  hubCoordinationCaseId: string,
): Promise<HubCaseBundle | null> {
  const hubCaseDocument = await repositories.getHubCoordinationCase(hubCoordinationCaseId);
  if (!hubCaseDocument) {
    return null;
  }
  const hubCase = hubCaseDocument.toSnapshot();
  const networkBookingRequest = await requireRequest(
    repositories,
    hubCase.networkBookingRequestId,
  );
  const lineageCaseLink = await requireLineageCaseLink(repositories, hubCase.lineageCaseLinkRef);
  const transitionJournal = (
    await repositories.listTransitionJournal(hubCoordinationCaseId)
  ).map((entry) => entry.toSnapshot());
  const eventJournal = (
    await repositories.listEventJournal(hubCoordinationCaseId)
  ).map((entry) => entry.toSnapshot());
  return {
    networkBookingRequest,
    hubCase,
    lineageCaseLink,
    transitionJournal,
    eventJournal,
  };
}

export function createPhase5HubCaseKernelService(input?: {
  repositories?: Phase5HubCaseKernelStore;
  idGenerator?: BackboneIdGenerator;
}): Phase5HubCaseKernelService {
  const repositories = input?.repositories ?? createPhase5HubCaseKernelStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-hub-kernel");

  async function appendEvents(
    aggregateKind: "network_request" | "hub_case",
    aggregateId: string,
    actorRef: string,
    commandActionRecordRef: string,
    commandSettlementRecordRef: string,
    recordedAt: string,
    events: readonly { eventName: string; payload: object }[],
  ) {
    const existing = await repositories.listEventJournal(aggregateId);
    const offset = existing.length;
    const materialized = makeEventJournalEntries({
      idGenerator,
      aggregateKind,
      aggregateId,
      actorRef,
      commandActionRecordRef,
      commandSettlementRecordRef,
      recordedAt,
      events,
    });
    const journalEntries = materialized.journalEntries.map((entry, index) => ({
      ...entry,
      version: offset + index + 1,
    }));
    for (const entry of journalEntries) {
      await repositories.appendEventJournalEntry(entry);
    }
    return { journalEntries, emittedEvents: materialized.emittedEvents };
  }

  async function appendRejectedAudit(
    hubCase: HubCoordinationCaseSnapshot,
    command: HubCaseTransitionCommandInput,
    nextStatus: HubCoordinationCaseStatus,
    failureCode: string,
    predicateId: string,
  ): Promise<void> {
    const journal = await repositories.listTransitionJournal(hubCase.hubCoordinationCaseId);
    const entry = buildTransitionJournalEntry({
      idGenerator,
      hubCase,
      previousStatus: hubCase.status,
      previousOwnerState: hubCase.ownerState,
      nextStatus,
      nextOwnerState: hubCase.ownerState,
      transitionOutcome: "rejected",
      failureCode,
      actorRef: requireRef(command.actorRef, "actorRef"),
      routeIntentBindingRef: requireRef(command.routeIntentBindingRef, "routeIntentBindingRef"),
      commandActionRecordRef: requireRef(
        command.commandActionRecordRef,
        "commandActionRecordRef",
      ),
      commandSettlementRecordRef: requireRef(
        command.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      expectedOwnershipEpoch:
        command.expectedOwnershipEpoch === undefined ? null : command.expectedOwnershipEpoch,
      expectedOwnershipFenceToken: optionalRef(command.expectedOwnershipFenceToken),
      currentLineageFenceEpoch:
        command.currentLineageFenceEpoch === undefined ? null : command.currentLineageFenceEpoch,
      transitionPredicateId: predicateId,
      reasonCode: requireRef(command.reasonCode, "reasonCode"),
      dependentRef: optionalRef(command.closeDecisionRef),
      recordedAt: ensureIsoTimestamp(command.recordedAt, "recordedAt"),
      version: journal.length + 1,
    });
    await repositories.appendTransitionJournalEntry(entry);
  }

  async function applyTransition(
    command: HubCaseTransitionCommandInput,
    nextStatus: HubCoordinationCaseStatus,
    options: {
      eventNames: readonly string[];
      requireOwnership?: boolean;
      dependentRef?: string | null;
      predicateIdOverride?: string;
      mutate(
        current: HubCoordinationCaseSnapshot,
        request: NetworkBookingRequestSnapshot,
        lineage: LineageCaseLinkSnapshot,
      ): {
        nextCase: HubCoordinationCaseSnapshot;
        nextLineage: LineageCaseLinkSnapshot;
        additionalPayload?: object;
      };
    },
  ): Promise<HubCaseTransitionResult> {
    const current = await requireCase(repositories, command.hubCoordinationCaseId);
    const request = await requireRequest(repositories, current.networkBookingRequestId);
    const lineage = await requireLineageCaseLink(repositories, current.lineageCaseLinkRef);
    const predicateId =
      options.predicateIdOverride ?? requireLegalStatusTransition(current.status, nextStatus);

    try {
      requireSourceFreshness(
        command.sourceBookingBranchState,
        "STALE_SOURCE_BOOKING_BRANCH",
        "The source booking branch",
      );
      requireSourceFreshness(
        command.leaseFreshness,
        "STALE_REQUEST_LIFECYCLE_LEASE",
        "The request lifecycle lease",
      );
      if (options.requireOwnership !== false) {
        requireOwnershipFence(current, command);
      }
      const mutated = options.mutate(current, request, lineage);
      await repositories.saveHubCoordinationCase(mutated.nextCase, {
        expectedVersion: current.version,
      });
      await repositories.saveLineageCaseLink(mutated.nextLineage, {
        expectedVersion: lineage.version,
      });

      const existingJournal = await repositories.listTransitionJournal(
        current.hubCoordinationCaseId,
      );
      const transitionJournalEntry = buildTransitionJournalEntry({
        idGenerator,
        hubCase: mutated.nextCase,
        previousStatus: current.status,
        previousOwnerState: current.ownerState,
        nextStatus: mutated.nextCase.status,
        nextOwnerState: mutated.nextCase.ownerState,
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: command.actorRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        expectedOwnershipEpoch:
          command.expectedOwnershipEpoch === undefined ? null : command.expectedOwnershipEpoch,
        expectedOwnershipFenceToken: optionalRef(command.expectedOwnershipFenceToken),
        currentLineageFenceEpoch:
          command.currentLineageFenceEpoch === undefined ? null : command.currentLineageFenceEpoch,
        transitionPredicateId: predicateId,
        reasonCode: command.reasonCode,
        dependentRef: options.dependentRef ?? null,
        recordedAt: command.recordedAt,
        version: existingJournal.length + 1,
      });
      await repositories.appendTransitionJournalEntry(transitionJournalEntry);

      const eventPayload = {
        hubCoordinationCaseId: mutated.nextCase.hubCoordinationCaseId,
        networkBookingRequestId: mutated.nextCase.networkBookingRequestId,
        requestLineageRef: mutated.nextCase.requestLineageRef,
        lineageCaseLinkRef: mutated.nextCase.lineageCaseLinkRef,
        previousStatus: current.status,
        nextStatus: mutated.nextCase.status,
        previousOwnerState: current.ownerState,
        nextOwnerState: mutated.nextCase.ownerState,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        dependentRef: options.dependentRef ?? null,
        ...(mutated.additionalPayload ?? {}),
      };
      const { journalEntries, emittedEvents } = await appendEvents(
        "hub_case",
        mutated.nextCase.hubCoordinationCaseId,
        command.actorRef,
        command.commandActionRecordRef,
        command.commandSettlementRecordRef,
        command.recordedAt,
        options.eventNames.map((eventName) => ({
          eventName,
          payload: eventPayload,
        })),
      );

      return {
        networkBookingRequest: request,
        hubCase: mutated.nextCase,
        lineageCaseLink: mutated.nextLineage,
        transitionJournalEntry,
        transitionJournal: [
          ...existingJournal.map((entry) => entry.toSnapshot()),
          transitionJournalEntry,
        ],
        eventJournalEntries: journalEntries,
        emittedEvents,
      };
    } catch (error) {
      const failureCode =
        error instanceof RequestBackboneInvariantError ? error.code : "HUB_CASE_MUTATION_FAILED";
      await appendRejectedAudit(current, command, nextStatus, failureCode, predicateId);
      throw error;
    }
  }

  async function createNetworkBookingRequest(
    input: CreateNetworkBookingRequestInput,
  ): Promise<NetworkBookingRequestCreationResult> {
    requireSourceFreshness(
      input.sourceBookingBranchState,
      "STALE_SOURCE_BOOKING_BRANCH",
      "The source booking branch",
    );
    const replayKey = optionalRef(input.idempotencyKey)
      ? `hub_request_replay_${stableReviewDigest({
          idempotencyKey: input.idempotencyKey,
          requestLineageRef: input.requestLineageRef,
          originBookingCaseId: input.originBookingCaseId,
        })}`
      : null;
    if (replayKey) {
      const existingId = await repositories.findNetworkBookingRequestByIdempotencyKey(replayKey);
      if (existingId) {
        const networkBookingRequest = await requireRequest(repositories, existingId);
        const existingEvents = await repositories.listEventJournal(existingId);
        return {
          networkBookingRequest,
          eventJournalEntries: existingEvents.map((entry) => entry.toSnapshot()),
          emittedEvents: [],
          replayed: true,
        };
      }
    }

    const networkBookingRequest = normalizeNetworkBookingRequest({
      networkBookingRequestId:
        input.networkBookingRequestId ?? nextHubId(idGenerator, "network_booking_request"),
      episodeRef: requireRef(input.episodeRef, "episodeRef"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      originLineageCaseLinkRef: requireRef(
        input.originLineageCaseLinkRef,
        "originLineageCaseLinkRef",
      ),
      originBookingCaseId: requireRef(input.originBookingCaseId, "originBookingCaseId"),
      originRequestId: requireRef(input.originRequestId, "originRequestId"),
      originPracticeOds: requireRef(input.originPracticeOds, "originPracticeOds"),
      patientRef: requireRef(input.patientRef, "patientRef"),
      priorityBand: input.priorityBand,
      clinicalTimeframe: normalizeClinicalTimeframe(input.clinicalTimeframe),
      modalityPreference: normalizeModalityPreference(input.modalityPreference),
      clinicianType: requireRef(input.clinicianType, "clinicianType"),
      continuityPreference: normalizeContinuityPreference(input.continuityPreference),
      accessNeeds: normalizeAccessNeeds(input.accessNeeds),
      travelConstraints: normalizeTravelConstraints(input.travelConstraints),
      reasonForHubRouting: input.reasonForHubRouting,
      requestedAt: ensureIsoTimestamp(input.requestedAt, "requestedAt"),
      creationMode: input.creationMode,
      commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
      commandSettlementRecordRef: requireRef(
        input.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      createdAt: ensureIsoTimestamp(input.requestedAt, "requestedAt"),
      updatedAt: ensureIsoTimestamp(input.requestedAt, "requestedAt"),
      version: 1,
    });
    await repositories.saveNetworkBookingRequest(networkBookingRequest);
    if (replayKey) {
      await repositories.saveNetworkBookingRequestReplay(
        replayKey,
        networkBookingRequest.networkBookingRequestId,
      );
    }
    const { journalEntries, emittedEvents } = await appendEvents(
      "network_request",
      networkBookingRequest.networkBookingRequestId,
      input.actorRef,
      input.commandActionRecordRef,
      input.commandSettlementRecordRef,
      input.requestedAt,
      [
        {
          eventName: "hub.request.created",
          payload: {
            networkBookingRequestId: networkBookingRequest.networkBookingRequestId,
            requestLineageRef: networkBookingRequest.requestLineageRef,
            originBookingCaseId: networkBookingRequest.originBookingCaseId,
            originLineageCaseLinkRef: networkBookingRequest.originLineageCaseLinkRef,
            reasonForHubRouting: networkBookingRequest.reasonForHubRouting,
            creationMode: networkBookingRequest.creationMode,
          },
        },
      ],
    );
    return {
      networkBookingRequest,
      eventJournalEntries: journalEntries,
      emittedEvents,
      replayed: false,
    };
  }

  return {
    repositories,

    async createNetworkBookingRequestFromPhase4Fallback(command) {
      return createNetworkBookingRequest({
        ...command,
        creationMode: "phase4_fallback",
      });
    },

    async createNetworkBookingRequestFromGovernedRouting(command) {
      return createNetworkBookingRequest({
        ...command,
        creationMode: "governed_routing",
      });
    },

    async createHubCoordinationCaseFromNetworkRequest(command) {
      requireSourceFreshness(
        command.sourceBookingBranchState,
        "STALE_SOURCE_BOOKING_BRANCH",
        "The source booking branch",
      );
      const networkBookingRequest = await requireRequest(repositories, command.networkBookingRequestId);
      const existingCase = await repositories.findHubCoordinationCaseByNetworkRequestId(
        command.networkBookingRequestId,
      );
      invariant(
        !existingCase,
        "HUB_CASE_ALREADY_EXISTS",
        "A HubCoordinationCase already exists for the supplied NetworkBookingRequest.",
      );

      const hubCoordinationCaseId =
        command.hubCoordinationCaseId ?? nextHubId(idGenerator, "hub_coordination_case");
      const lineageAggregate = LineageCaseLinkAggregate.propose({
        lineageCaseLinkId:
          command.lineageCaseLinkId ?? nextHubId(idGenerator, "hub_lineage_case_link"),
        requestLineageRef: networkBookingRequest.requestLineageRef,
        episodeRef: networkBookingRequest.episodeRef,
        requestRef: networkBookingRequest.originRequestId,
        caseFamily: "hub",
        domainCaseRef: hubCoordinationCaseId,
        linkReason: mapRoutingReasonToLineageReason(networkBookingRequest.reasonForHubRouting),
        openedAt: command.createdAt,
        parentLineageCaseLinkRef: networkBookingRequest.originLineageCaseLinkRef,
      });
      await repositories.saveLineageCaseLink(lineageAggregate.toSnapshot());

      const carriedBlockerRefs = uniqueSortedRefs([
        ...initialHubStatusBlockers("hub_requested"),
        ...(command.carriedOpenCaseBlockerRefs ?? []),
      ]);
      const hubCase = normalizeHubCoordinationCase({
        hubCoordinationCaseId,
        episodeRef: networkBookingRequest.episodeRef,
        requestLineageRef: networkBookingRequest.requestLineageRef,
        lineageCaseLinkRef: lineageAggregate.lineageCaseLinkId,
        parentLineageCaseLinkRef: networkBookingRequest.originLineageCaseLinkRef,
        networkBookingRequestId: networkBookingRequest.networkBookingRequestId,
        servingPcnId: requireRef(command.servingPcnId, "servingPcnId"),
        status: "hub_requested",
        ownerState: "unclaimed",
        claimedBy: null,
        actingOrg: null,
        ownershipLeaseRef: null,
        activeOwnershipTransitionRef: null,
        ownershipFenceToken: null,
        ownershipEpoch: 0,
        compiledPolicyBundleRef: null,
        enhancedAccessPolicyRef: null,
        policyEvaluationRef: null,
        policyTupleHash: null,
        candidateSnapshotRef: null,
        crossSiteDecisionPlanRef: null,
        activeAlternativeOfferSessionRef: null,
        activeOfferOptimisationPlanRef: null,
        latestOfferRegenerationSettlementRef: null,
        selectedCandidateRef: null,
        bookingEvidenceRef: null,
        networkAppointmentRef: null,
        offerToConfirmationTruthRef: null,
        activeFallbackRef: null,
        callbackExpectationRef: null,
        activeIdentityRepairCaseRef: null,
        identityRepairBranchDispositionRef: null,
        identityRepairReleaseSettlementRef: null,
        externalConfirmationState: "not_started",
        practiceAckGeneration: 0,
        practiceAckDueAt: null,
        openCaseBlockerRefs: computeOpenCaseBlockers(
          {
            status: "hub_requested",
            ownerState: "unclaimed",
            ownershipLeaseRef: null,
            activeOwnershipTransitionRef: null,
            activeIdentityRepairCaseRef: null,
            identityRepairBranchDispositionRef: null,
            identityRepairReleaseSettlementRef: null,
          },
          carriedBlockerRefs,
        ),
        lastProgressAt: command.createdAt,
        slaTargetAt: command.slaTargetAt ?? networkBookingRequest.clinicalTimeframe.dueAt,
        queueEnteredAt: null,
        lastMaterialReturnAt: null,
        expectedCoordinationMinutes: command.expectedCoordinationMinutes ?? 15,
        urgencyCarry: networkBookingRequest.clinicalTimeframe.urgencyCarryFloor,
        createdAt: command.createdAt,
        updatedAt: command.createdAt,
        version: 1,
      });
      await repositories.saveHubCoordinationCase(hubCase);

      const transitionJournalEntry = buildTransitionJournalEntry({
        idGenerator,
        hubCase,
        previousStatus: "none",
        previousOwnerState: "none",
        nextStatus: "hub_requested",
        nextOwnerState: "unclaimed",
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: command.actorRef,
        routeIntentBindingRef: command.routeIntentBindingRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        expectedOwnershipEpoch: null,
        expectedOwnershipFenceToken: null,
        currentLineageFenceEpoch: null,
        transitionPredicateId: "P315_CREATE_HUB_CASE",
        reasonCode: "create_hub_case",
        dependentRef: lineageAggregate.lineageCaseLinkId,
        recordedAt: command.createdAt,
        version: 1,
      });
      await repositories.appendTransitionJournalEntry(transitionJournalEntry);

      const { journalEntries, emittedEvents } = await appendEvents(
        "hub_case",
        hubCase.hubCoordinationCaseId,
        command.actorRef,
        command.commandActionRecordRef,
        command.commandSettlementRecordRef,
        command.createdAt,
        [
          {
            eventName: "hub.case.created",
            payload: {
              hubCoordinationCaseId: hubCase.hubCoordinationCaseId,
              networkBookingRequestId: hubCase.networkBookingRequestId,
              requestLineageRef: hubCase.requestLineageRef,
              lineageCaseLinkRef: hubCase.lineageCaseLinkRef,
              parentLineageCaseLinkRef: hubCase.parentLineageCaseLinkRef,
              servingPcnId: hubCase.servingPcnId,
              status: hubCase.status,
            },
          },
        ],
      );

      return {
        networkBookingRequest,
        hubCase,
        lineageCaseLink: lineageAggregate.toSnapshot(),
        transitionJournalEntry,
        transitionJournal: [transitionJournalEntry],
        eventJournalEntries: journalEntries,
        emittedEvents,
      };
    },

    async validateIntake(command) {
      return applyTransition(command, "intake_validated", {
        eventNames: [],
        requireOwnership: false,
        mutate(current, _request, lineage) {
          const acknowledged = LineageCaseLinkAggregate.hydrate(lineage)
            .transition({
              nextState: "acknowledged",
              updatedAt: command.recordedAt,
              latestMilestoneRef: "hub_intake_validated",
            })
            .toSnapshot();
          return {
            nextCase: mergeCaseSnapshot(
              current,
              { lastProgressAt: command.recordedAt },
              "intake_validated",
              command.recordedAt,
              uniqueSortedRefs([
                ...initialHubStatusBlockers("intake_validated"),
                ...(command.carriedOpenCaseBlockerRefs ?? []),
              ]),
            ),
            nextLineage: acknowledged,
          };
        },
      });
    },

    async queueHubCase(command) {
      return applyTransition(command, "queued", {
        eventNames: [],
        requireOwnership: false,
        mutate(current, _request, lineage) {
          const active = LineageCaseLinkAggregate.hydrate(lineage)
            .transition({
              nextState: lineage.ownershipState === "acknowledged" ? "active" : lineage.ownershipState,
              updatedAt: command.recordedAt,
              latestMilestoneRef: "hub_queue_admitted",
            })
            .toSnapshot();
          return {
            nextCase: mergeCaseSnapshot(
              current,
              {
                queueEnteredAt: command.queueEnteredAt ?? command.recordedAt,
                lastProgressAt: command.recordedAt,
              },
              "queued",
              command.recordedAt,
              uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
            ),
            nextLineage: active,
          };
        },
      });
    },

    async claimHubCase(command) {
      const current = await requireCase(repositories, command.hubCoordinationCaseId);
      const targetStatus =
        current.status === "queued" || current.status === "intake_validated"
          ? "claimed"
          : current.status;
      return applyTransition(command, targetStatus, {
        eventNames: ["hub.case.claimed"],
        predicateIdOverride:
          targetStatus === current.status ? "P315_CLAIM_WITHOUT_STATUS_CHANGE" : undefined,
          requireOwnership: false,
          mutate(current, _request, lineage) {
            if (current.ownerState !== "unclaimed") {
              requireCurrentFenceForOwnerAction(current, command);
            } else {
              invariant(
                command.expectedOwnershipEpoch !== undefined &&
                  command.expectedOwnershipEpoch !== null,
                "OWNERSHIP_EPOCH_REQUIRED",
                "expectedOwnershipEpoch is required when claiming a case.",
              );
              invariant(
                command.expectedOwnershipEpoch === current.ownershipEpoch,
                "STALE_OWNERSHIP_EPOCH",
                "The presented ownership epoch is stale.",
              );
            }
            const nextEpoch = current.ownershipEpoch + 1;
            const nextFenceToken =
              optionalRef(command.newOwnershipFenceToken) ??
              `hub_fence_${stableReviewDigest({
                hubCoordinationCaseId: current.hubCoordinationCaseId,
                ownershipEpoch: nextEpoch,
                ownershipLeaseRef: requireRef(command.ownershipLeaseRef, "ownershipLeaseRef"),
              })}`;
            const nextCase = mergeCaseSnapshot(
              current,
              {
                ownerState: "claimed_active",
                claimedBy: requireRef(command.claimedBy, "claimedBy"),
                actingOrg: requireField(
                  normalizeActingOrg(command.actingOrg),
                  "ACTING_ORG_REQUIRED",
                  "actingOrg is required when claiming a case.",
                ),
                ownershipLeaseRef: requireRef(command.ownershipLeaseRef, "ownershipLeaseRef"),
                activeOwnershipTransitionRef: null,
                ownershipFenceToken: nextFenceToken,
                ownershipEpoch: nextEpoch,
                lastProgressAt: command.recordedAt,
              },
              targetStatus,
              command.recordedAt,
              uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
            );
            const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
              .refreshOperationalFacts({
                currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
                latestMilestoneRef: "hub_case_claimed",
                updatedAt: command.recordedAt,
              })
              .toSnapshot();
            return {
              nextCase,
              nextLineage,
            };
          },
      });
    },

    async releaseHubCase(command) {
      const current = await requireCase(repositories, command.hubCoordinationCaseId);
      requireCurrentFenceForOwnerAction(current, command);
      const targetStatus = current.status === "claimed" ? "queued" : current.status;
      return applyTransition(command, targetStatus, {
        eventNames: ["hub.case.released"],
        predicateIdOverride:
          targetStatus === current.status ? "P315_RELEASE_OWNERSHIP_ONLY" : undefined,
        mutate(currentCase, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            currentCase,
            {
              ownerState: "unclaimed",
              claimedBy: null,
              actingOrg: null,
              ownershipLeaseRef: null,
              activeOwnershipTransitionRef: null,
              ownershipFenceToken: null,
              ownershipEpoch: currentCase.ownershipEpoch + 1,
              lastProgressAt: command.recordedAt,
            },
            targetStatus,
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "hub_case_released",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async transferHubOwnership(command) {
      const current = await requireCase(repositories, command.hubCoordinationCaseId);
      requireCurrentFenceForOwnerAction(current, command);
      return applyTransition(command, current.status, {
        eventNames: ["hub.case.transfer_started", "hub.case.transfer_accepted"],
        dependentRef: optionalRef(command.activeOwnershipTransitionRef),
        predicateIdOverride: "P315_TRANSFER_OWNERSHIP",
        mutate(currentCase, _request, lineage) {
          const nextEpoch = currentCase.ownershipEpoch + 1;
          const nextFenceToken =
            optionalRef(command.nextOwnershipFenceToken) ??
            `hub_fence_${stableReviewDigest({
              hubCoordinationCaseId: currentCase.hubCoordinationCaseId,
              ownershipEpoch: nextEpoch,
              ownershipLeaseRef: requireRef(
                command.nextOwnershipLeaseRef,
                "nextOwnershipLeaseRef",
              ),
            })}`;
          const nextCase = mergeCaseSnapshot(
            currentCase,
            {
              ownerState: "claimed_active",
              claimedBy: requireRef(command.nextClaimedBy, "nextClaimedBy"),
              actingOrg: requireField(
                normalizeActingOrg(command.nextActingOrg),
                "NEXT_ACTING_ORG_REQUIRED",
                "nextActingOrg is required for transfer.",
              ),
              ownershipLeaseRef: requireRef(
                command.nextOwnershipLeaseRef,
                "nextOwnershipLeaseRef",
              ),
              activeOwnershipTransitionRef: null,
              ownershipFenceToken: nextFenceToken,
              ownershipEpoch: nextEpoch,
              lastProgressAt: command.recordedAt,
            },
            currentCase.status,
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "hub_transfer_accepted",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return {
            nextCase,
            nextLineage,
            additionalPayload: {
              transferTransitionRef: optionalRef(command.activeOwnershipTransitionRef),
            },
          };
        },
      });
    },

    async markStaleOwnerRecoveryPending(command) {
      const current = await requireCase(repositories, command.hubCoordinationCaseId);
      requireCurrentFenceForOwnerAction(current, command);
      return applyTransition(command, current.status, {
        eventNames: [],
        predicateIdOverride: "P315_STALE_OWNER_RECOVERY",
        mutate(currentCase, _request, lineage) {
          invariant(
            optionalRef(command.activeOwnershipTransitionRef) !== null,
            "STALE_OWNER_RECOVERY_REF_REQUIRED",
            "activeOwnershipTransitionRef is required to mark stale-owner recovery.",
          );
          const nextCase = mergeCaseSnapshot(
            currentCase,
            {
              ownerState: "stale_owner_recovery",
              claimedBy: null,
              actingOrg: null,
              ownershipLeaseRef: null,
              activeOwnershipTransitionRef: command.activeOwnershipTransitionRef ?? null,
              ownershipFenceToken: null,
              ownershipEpoch: currentCase.ownershipEpoch + 1,
              lastProgressAt: command.recordedAt,
            },
            currentCase.status,
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "stale_owner_recovery_pending",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async beginCandidateSearch(command) {
      return applyTransition(command, "candidate_searching", {
        eventNames: [],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              compiledPolicyBundleRef:
                command.compiledPolicyBundleRef === undefined
                  ? current.compiledPolicyBundleRef
                  : command.compiledPolicyBundleRef,
              enhancedAccessPolicyRef:
                command.enhancedAccessPolicyRef === undefined
                  ? current.enhancedAccessPolicyRef
                  : command.enhancedAccessPolicyRef,
              policyEvaluationRef:
                command.policyEvaluationRef === undefined
                  ? current.policyEvaluationRef
                  : command.policyEvaluationRef,
              policyTupleHash:
                command.policyTupleHash === undefined
                  ? current.policyTupleHash
                  : command.policyTupleHash,
              lastProgressAt: command.recordedAt,
            },
            "candidate_searching",
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          invariant(
            nextCase.policyTupleHash !== null,
            "POLICY_TUPLE_HASH_REQUIRED",
            "policyTupleHash is required to begin candidate search.",
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "candidate_searching",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async publishCandidatesReady(command) {
      return applyTransition(command, "candidates_ready", {
        eventNames: ["hub.candidates.rank_completed"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              candidateSnapshotRef: requireRef(
                command.candidateSnapshotRef,
                "candidateSnapshotRef",
              ),
              crossSiteDecisionPlanRef: requireRef(
                command.crossSiteDecisionPlanRef,
                "crossSiteDecisionPlanRef",
              ),
              lastProgressAt: command.recordedAt,
            },
            "candidates_ready",
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "candidates_ready",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async enterCoordinatorSelecting(command) {
      return applyTransition(command, "coordinator_selecting", {
        eventNames: [],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              selectedCandidateRef:
                command.selectedCandidateRef === undefined
                  ? current.selectedCandidateRef
                  : command.selectedCandidateRef,
              lastProgressAt: command.recordedAt,
            },
            "coordinator_selecting",
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "coordinator_selecting",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async enterAlternativesOffered(command) {
      return applyTransition(command, "alternatives_offered", {
        eventNames: ["hub.offer.created"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              activeAlternativeOfferSessionRef: requireRef(
                command.activeAlternativeOfferSessionRef,
                "activeAlternativeOfferSessionRef",
              ),
              activeOfferOptimisationPlanRef: requireRef(
                command.activeOfferOptimisationPlanRef,
                "activeOfferOptimisationPlanRef",
              ),
              latestOfferRegenerationSettlementRef:
                command.latestOfferRegenerationSettlementRef ?? null,
              offerToConfirmationTruthRef:
                command.offerToConfirmationTruthRef === undefined
                  ? current.offerToConfirmationTruthRef
                  : command.offerToConfirmationTruthRef,
              lastProgressAt: command.recordedAt,
            },
            "alternatives_offered",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("alternatives_offered"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "alternatives_offered",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async refreshAlternativeOfferPointers(command) {
      const current = await requireCase(repositories, command.hubCoordinationCaseId);
      invariant(
        current.status === "alternatives_offered" || current.status === "patient_choice_pending",
        "INVALID_OFFER_POINTER_REFRESH_STATE",
        "Alternative offer pointers may only refresh while the case is alternatives_offered or patient_choice_pending.",
      );
      return applyTransition(command, current.status, {
        predicateIdOverride: "P320_OFFER_POINTERS_REFRESHED",
        eventNames: ["hub.offer.created"],
        mutate(bundleCurrent, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            bundleCurrent,
            {
              activeAlternativeOfferSessionRef: requireRef(
                command.activeAlternativeOfferSessionRef,
                "activeAlternativeOfferSessionRef",
              ),
              activeOfferOptimisationPlanRef: requireRef(
                command.activeOfferOptimisationPlanRef,
                "activeOfferOptimisationPlanRef",
              ),
              latestOfferRegenerationSettlementRef:
                command.latestOfferRegenerationSettlementRef === undefined
                  ? bundleCurrent.latestOfferRegenerationSettlementRef
                  : command.latestOfferRegenerationSettlementRef,
              offerToConfirmationTruthRef:
                command.offerToConfirmationTruthRef === undefined
                  ? bundleCurrent.offerToConfirmationTruthRef
                  : command.offerToConfirmationTruthRef,
              selectedCandidateRef:
                command.selectedCandidateRef === undefined
                  ? bundleCurrent.selectedCandidateRef
                  : command.selectedCandidateRef,
              lastProgressAt: command.recordedAt,
            },
            bundleCurrent.status,
            command.recordedAt,
            uniqueSortedRefs([
              ...bundleCurrent.openCaseBlockerRefs,
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              currentConfirmationGateRefs:
                nextCase.offerToConfirmationTruthRef === null
                  ? []
                  : [nextCase.offerToConfirmationTruthRef],
              latestMilestoneRef: bundleCurrent.status,
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async enterPatientChoicePending(command) {
      return applyTransition(command, "patient_choice_pending", {
        eventNames: ["hub.patient.notified"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              lastProgressAt: command.recordedAt,
            },
            "patient_choice_pending",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("patient_choice_pending"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "patient_choice_pending",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async enterCandidateRevalidating(command) {
      return applyTransition(command, "candidate_revalidating", {
        eventNames: [],
        mutate(current, _request, lineage) {
          const selectedCandidateRef = requireRef(
            command.selectedCandidateRef ?? current.selectedCandidateRef,
            "selectedCandidateRef",
          );
          const nextCase = mergeCaseSnapshot(
            current,
            {
              selectedCandidateRef,
              lastProgressAt: command.recordedAt,
            },
            "candidate_revalidating",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("candidate_revalidating"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "candidate_revalidating",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async enterNativeBookingPending(command) {
      return applyTransition(command, "native_booking_pending", {
        eventNames: ["hub.booking.native_started"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              bookingEvidenceRef: requireRef(command.bookingEvidenceRef, "bookingEvidenceRef"),
              externalConfirmationState: command.externalConfirmationState ?? "pending",
              lastProgressAt: command.recordedAt,
            },
            "native_booking_pending",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("native_booking_pending"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "native_booking_pending",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async markConfirmationPending(command) {
      return applyTransition(command, "confirmation_pending", {
        eventNames: ["hub.booking.confirmation_pending"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              externalConfirmationState: command.externalConfirmationState ?? "pending",
              lastProgressAt: command.recordedAt,
            },
            "confirmation_pending",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("confirmation_pending"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "confirmation_pending",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async markBookedPendingPracticeAcknowledgement(command) {
      return applyTransition(command, "booked_pending_practice_ack", {
        eventNames: ["hub.booking.externally_confirmed", "hub.practice.notified"],
        mutate(current, _request, lineage) {
          const nextGeneration = ensurePositiveInteger(
            requireField(
              command.practiceAckGeneration,
              "PRACTICE_ACK_GENERATION_REQUIRED",
              "practiceAckGeneration is required.",
            ),
            "practiceAckGeneration",
          );
          const nextCase = mergeCaseSnapshot(
            current,
            {
              networkAppointmentRef: requireRef(
                command.networkAppointmentRef,
                "networkAppointmentRef",
              ),
              offerToConfirmationTruthRef: requireRef(
                command.offerToConfirmationTruthRef,
                "offerToConfirmationTruthRef",
              ),
              externalConfirmationState: "confirmed",
              practiceAckGeneration: nextGeneration,
              practiceAckDueAt: requireRef(command.practiceAckDueAt, "practiceAckDueAt"),
              lastProgressAt: command.recordedAt,
            },
            "booked_pending_practice_ack",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("booked_pending_practice_ack"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              currentConfirmationGateRefs: [nextCase.offerToConfirmationTruthRef!],
              latestMilestoneRef: "booked_pending_practice_ack",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async markBooked(command) {
      return applyTransition(command, "booked", {
        eventNames: ["hub.practice.acknowledged"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              externalConfirmationState: "confirmed",
              lastProgressAt: command.recordedAt,
            },
            "booked",
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              currentConfirmationGateRefs:
                nextCase.offerToConfirmationTruthRef === null
                  ? []
                  : [nextCase.offerToConfirmationTruthRef],
              latestMilestoneRef: "booked",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async markCallbackTransferPending(command) {
      return applyTransition(command, "callback_transfer_pending", {
        eventNames: ["hub.callback.transfer_pending"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              activeFallbackRef: requireRef(command.activeFallbackRef, "activeFallbackRef"),
              callbackExpectationRef:
                command.callbackExpectationRef === undefined
                  ? current.callbackExpectationRef
                  : command.callbackExpectationRef,
              lastProgressAt: command.recordedAt,
            },
            "callback_transfer_pending",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("callback_transfer_pending"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "callback_transfer_pending",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async markCallbackOffered(command) {
      return applyTransition(command, "callback_offered", {
        eventNames: ["hub.callback.offered"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              callbackExpectationRef: requireRef(
                command.callbackExpectationRef,
                "callbackExpectationRef",
              ),
              lastProgressAt: command.recordedAt,
            },
            "callback_offered",
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "callback_offered",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async markEscalatedBack(command) {
      return applyTransition(command, "escalated_back", {
        eventNames: ["hub.escalated.back"],
        mutate(current, _request, lineage) {
          const nextCase = mergeCaseSnapshot(
            current,
            {
              activeFallbackRef: requireRef(command.activeFallbackRef, "activeFallbackRef"),
              lastMaterialReturnAt: command.lastMaterialReturnAt ?? command.recordedAt,
              lastProgressAt: command.recordedAt,
            },
            "escalated_back",
            command.recordedAt,
            uniqueSortedRefs([
              ...initialHubStatusBlockers("escalated_back"),
              ...(command.carriedOpenCaseBlockerRefs ?? []),
            ]),
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .refreshOperationalFacts({
              currentClosureBlockerRefs: nextCase.openCaseBlockerRefs,
              latestMilestoneRef: "escalated_back",
              updatedAt: command.recordedAt,
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async closeHubCase(command) {
      const current = await requireCase(repositories, command.hubCoordinationCaseId);
      requireCurrentFenceForOwnerAction(current, command);
      return applyTransition(command, "closed", {
        eventNames: ["hub.case.closed"],
        dependentRef: optionalRef(command.closeDecisionRef),
        mutate(current, _request, lineage) {
          invariant(
            optionalRef(command.closeDecisionRef) !== null,
            "CLOSE_DECISION_REQUIRED",
            "closeDecisionRef is required to close a hub case.",
          );
          const nextCase = mergeCaseSnapshot(
            current,
            {
              lastProgressAt: command.recordedAt,
            },
            "closed",
            command.recordedAt,
            uniqueSortedRefs(command.carriedOpenCaseBlockerRefs ?? []),
          );
          invariant(
            nextCase.openCaseBlockerRefs.length === 0,
            "OPEN_CASE_BLOCKERS_REMAIN",
            "Hub cases may close only when OpenCaseBlockers(h) is empty.",
          );
          const nextLineage = LineageCaseLinkAggregate.hydrate(lineage)
            .transition({
              nextState: "closed",
              updatedAt: command.recordedAt,
              latestMilestoneRef: requireRef(command.closeDecisionRef, "closeDecisionRef"),
              currentClosureBlockerRefs: [],
              currentConfirmationGateRefs:
                nextCase.offerToConfirmationTruthRef === null
                  ? []
                  : [nextCase.offerToConfirmationTruthRef],
            })
            .toSnapshot();
          return { nextCase, nextLineage };
        },
      });
    },

    async queryHubCaseBundle(hubCoordinationCaseId) {
      return buildBundle(repositories, hubCoordinationCaseId);
    },
  };
}

export const PHASE5_HUB_CASE_SERVICE_NAME = "Phase5HubCaseKernel";
export const PHASE5_HUB_CASE_SCHEMA_VERSION = "315.phase5.hub-case-kernel.v1";
export const phase5HubCasePersistenceTables = [
  "phase5_network_booking_requests",
  "phase5_hub_coordination_cases",
  "phase5_hub_case_transition_journal",
  "phase5_hub_event_journal",
] as const;

export const phase5HubCaseMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
  "services/command-api/migrations/072_command_settlement_and_transition_envelope_library.sql",
  "services/command-api/migrations/143_phase5_hub_case_kernel.sql",
] as const;

export const phase5HubCaseRoutes = [
  {
    routeId: "hub_network_booking_request_create_from_phase4_fallback",
    method: "POST",
    path: "/internal/v1/hub/requests:create-from-phase4-fallback",
    contractFamily: "CreateNetworkBookingRequestCommandContract",
  },
  {
    routeId: "hub_network_booking_request_create_from_governed_routing",
    method: "POST",
    path: "/internal/v1/hub/requests:create-from-governed-routing",
    contractFamily: "CreateNetworkBookingRequestCommandContract",
  },
  {
    routeId: "hub_case_create_from_request",
    method: "POST",
    path: "/internal/v1/hub/cases:create-from-request",
    contractFamily: "CreateHubCoordinationCaseCommandContract",
  },
  {
    routeId: "hub_case_validate_intake",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:validate-intake",
    contractFamily: "HubCaseValidateIntakeCommandContract",
  },
  {
    routeId: "hub_case_queue",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:queue",
    contractFamily: "HubCaseQueueCommandContract",
  },
  {
    routeId: "hub_case_claim",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:claim",
    contractFamily: "HubCaseClaimCommandContract",
  },
  {
    routeId: "hub_case_release",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:release",
    contractFamily: "HubCaseReleaseCommandContract",
  },
  {
    routeId: "hub_case_transfer",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:transfer-ownership",
    contractFamily: "HubCaseTransferCommandContract",
  },
  {
    routeId: "hub_case_stale_owner_recovery",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:stale-owner-recovery",
    contractFamily: "HubCaseStaleOwnerRecoveryCommandContract",
  },
  {
    routeId: "hub_case_close",
    method: "POST",
    path: "/internal/v1/hub/cases/{hubCoordinationCaseId}:close",
    contractFamily: "HubCaseCloseCommandContract",
  },
] as const;
