import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function lifecycleAuthority(): "LifecycleCoordinator" {
  return "LifecycleCoordinator";
}

export type BookingIntentSourceState =
  | "seeded"
  | "proposed"
  | "acknowledged"
  | "superseded"
  | "recovery_only";

export type BookingIntentRecordState =
  | "proposed"
  | "acknowledged"
  | "superseded"
  | "recovery_only";

export type BookingCaseStatus =
  | "handoff_received"
  | "capability_checked"
  | "searching_local"
  | "offers_ready"
  | "selecting"
  | "revalidating"
  | "commit_pending"
  | "booked"
  | "confirmation_pending"
  | "supplier_reconciliation_pending"
  | "waitlisted"
  | "fallback_to_hub"
  | "callback_fallback"
  | "booking_failed"
  | "managed"
  | "closed";

export type BookingCaseTransitionOutcome = "applied" | "rejected";

export interface ProviderContextSnapshot {
  practiceRef: string;
  supplierHintRef: string | null;
  careSetting: string;
}

export interface BookingIntentHandoffSourceSnapshot {
  intentId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  sourceTriageTaskRef: string;
  lineageCaseLinkRef: string;
  priorityBand: string;
  timeframe: string;
  modality: string;
  clinicianType: string;
  continuityPreference: string;
  accessNeeds: string;
  patientPreferenceSummary: string;
  createdFromDecisionId: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  intentState: BookingIntentSourceState;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BookingIntentRecordSnapshot {
  intentId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  sourceTriageTaskRef: string;
  lineageCaseLinkRef: string;
  priorityBand: string;
  timeframe: string;
  modality: string;
  clinicianType: string;
  continuityPreference: string;
  accessNeeds: string;
  patientPreferenceSummary: string;
  createdFromDecisionId: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  intentState: BookingIntentRecordState;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  lifecycleClosureAuthority: "LifecycleCoordinator";
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SearchPolicySnapshot {
  policyId: string;
  timeframeEarliest: string;
  timeframeLatest: string;
  modality: string;
  clinicianType: string;
  continuityPreference: string;
  sitePreference: readonly string[];
  accessibilityNeeds: readonly string[];
  maxTravelTime: number;
  bookabilityPolicy: string;
  selectionAudience: "patient_self_service" | "staff_assist";
  patientChannelMode: "signed_in_shell" | "embedded_nhs_app" | "staff_proxy";
  policyBundleHash: string;
  sameBandReorderSlackMinutesByWindow: Readonly<Record<string, number>>;
}

export interface BookingCaseSnapshot {
  bookingCaseId: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  originTriageTaskRef: string;
  bookingIntentId: string;
  sourceDecisionEpochRef: string;
  sourceDecisionSupersessionRef: string | null;
  patientRef: string;
  tenantId: string;
  providerContext: ProviderContextSnapshot;
  activeCapabilityResolutionRef: string | null;
  activeCapabilityProjectionRef: string | null;
  activeProviderAdapterBindingRef: string | null;
  status: BookingCaseStatus;
  searchPolicyRef: string | null;
  currentOfferSessionRef: string | null;
  selectedSlotRef: string | null;
  appointmentRef: string | null;
  latestConfirmationTruthProjectionRef: string | null;
  waitlistEntryRef: string | null;
  activeWaitlistFallbackObligationRef: string | null;
  latestWaitlistContinuationTruthProjectionRef: string | null;
  exceptionRef: string | null;
  activeIdentityRepairCaseRef: string | null;
  identityRepairBranchDispositionRef: string | null;
  identityRepairReleaseSettlementRef: string | null;
  requestLifecycleLeaseRef: string;
  ownershipEpoch: number;
  staleOwnerRecoveryRef: string | null;
  patientShellConsistencyProjectionRef: string | null;
  patientEmbeddedSessionProjectionRef: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  routeFreezeDispositionRef: string | null;
  releaseRecoveryDispositionRef: string | null;
  closureAuthority: "LifecycleCoordinator";
  createdAt: string;
  updatedAt: string;
}

export interface BookingCaseTransitionJournalEntrySnapshot {
  bookingCaseTransitionJournalEntryId: string;
  bookingCaseId: string;
  bookingIntentId: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  previousStatus: BookingCaseStatus;
  nextStatus: BookingCaseStatus;
  transitionOutcome: BookingCaseTransitionOutcome;
  failureCode: string | null;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  sourceDecisionEpochRef: string;
  requestLifecycleLeaseRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  transitionPredicateId: string;
  reasonCode: string;
  dependentRef: string | null;
  recordedAt: string;
  version: number;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

interface StoredRow<T> {
  snapshot: T;
  version: number;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly row: StoredRow<T>) {}

  toSnapshot(): T {
    return structuredClone(this.row.snapshot);
  }
}

function saveWithCas<T>(
  map: Map<string, StoredRow<T>>,
  key: string,
  snapshot: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  }
  const nextVersion = (current?.version ?? 0) + 1;
  map.set(key, { snapshot, version: nextVersion });
}

function hashSearchPolicy(policy: SearchPolicySnapshot): string {
  return stableReviewDigest({
    timeframeEarliest: policy.timeframeEarliest,
    timeframeLatest: policy.timeframeLatest,
    modality: policy.modality,
    clinicianType: policy.clinicianType,
    continuityPreference: policy.continuityPreference,
    sitePreference: policy.sitePreference,
    accessibilityNeeds: policy.accessibilityNeeds,
    maxTravelTime: policy.maxTravelTime,
    bookabilityPolicy: policy.bookabilityPolicy,
    selectionAudience: policy.selectionAudience,
    patientChannelMode: policy.patientChannelMode,
    sameBandReorderSlackMinutesByWindow: policy.sameBandReorderSlackMinutesByWindow,
  });
}

const bookingCaseStatuses: readonly BookingCaseStatus[] = [
  "handoff_received",
  "capability_checked",
  "searching_local",
  "offers_ready",
  "selecting",
  "revalidating",
  "commit_pending",
  "booked",
  "confirmation_pending",
  "supplier_reconciliation_pending",
  "waitlisted",
  "fallback_to_hub",
  "callback_fallback",
  "booking_failed",
  "managed",
  "closed",
];

const legalTransitionGraph: Readonly<Record<BookingCaseStatus, readonly BookingCaseStatus[]>> = {
  handoff_received: ["capability_checked"],
  capability_checked: ["searching_local"],
  searching_local: [
    "offers_ready",
    "waitlisted",
    "callback_fallback",
    "fallback_to_hub",
    "booking_failed",
  ],
  offers_ready: [
    "selecting",
    "waitlisted",
    "callback_fallback",
    "fallback_to_hub",
    "booking_failed",
  ],
  selecting: [
    "revalidating",
    "offers_ready",
    "waitlisted",
    "callback_fallback",
    "fallback_to_hub",
    "booking_failed",
  ],
  revalidating: [
    "commit_pending",
    "offers_ready",
    "waitlisted",
    "callback_fallback",
    "fallback_to_hub",
    "booking_failed",
  ],
  commit_pending: [
    "booked",
    "confirmation_pending",
    "supplier_reconciliation_pending",
    "waitlisted",
    "callback_fallback",
    "fallback_to_hub",
    "booking_failed",
  ],
  booked: ["managed"],
  confirmation_pending: [
    "managed",
    "supplier_reconciliation_pending",
    "booking_failed",
    "callback_fallback",
    "fallback_to_hub",
  ],
  supplier_reconciliation_pending: [
    "managed",
    "booking_failed",
    "callback_fallback",
    "fallback_to_hub",
  ],
  waitlisted: [
    "selecting",
    "revalidating",
    "callback_fallback",
    "fallback_to_hub",
    "booking_failed",
    "managed",
  ],
  fallback_to_hub: ["closed"],
  callback_fallback: ["closed"],
  booking_failed: ["closed"],
  managed: ["searching_local", "supplier_reconciliation_pending", "closed"],
  closed: [],
};

const transitionPredicateIds: Readonly<Record<BookingCaseStatus, string>> = {
  handoff_received: "P278_HANDOFF_RECEIVED",
  capability_checked: "P278_HANDOFF_ACKNOWLEDGED",
  searching_local: "P278_CAPABILITY_LIVE_FOR_SEARCH",
  offers_ready: "P278_OFFERS_DISCLOSED",
  selecting: "P278_SLOT_CHOSEN",
  revalidating: "P278_REVALIDATION_STARTED",
  commit_pending: "P278_PREFLIGHT_VALID",
  booked: "P278_COMMIT_CONFIRMED",
  confirmation_pending: "P278_PENDING_CONFIRMATION",
  supplier_reconciliation_pending: "P278_RECONCILIATION_PENDING",
  waitlisted: "P278_WAITLIST_SAFE",
  fallback_to_hub: "P278_HUB_REQUIRED",
  callback_fallback: "P278_CALLBACK_REQUIRED",
  booking_failed: "P278_LOCAL_FAILURE",
  managed: "P278_MANAGE_OPEN",
  closed: "P278_BRANCH_CLOSED",
};

export interface CreateBookingCaseFromIntentInput {
  handoff: BookingIntentHandoffSourceSnapshot | BookingIntentRecordSnapshot;
  bookingCaseId?: string;
  patientRef: string;
  tenantId: string;
  providerContext: ProviderContextSnapshot;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  createdAt: string;
  patientShellConsistencyProjectionRef?: string | null;
  patientEmbeddedSessionProjectionRef?: string | null;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  routeFreezeDispositionRef?: string | null;
  releaseRecoveryDispositionRef?: string | null;
  activeIdentityRepairCaseRef?: string | null;
  identityRepairBranchDispositionRef?: string | null;
  identityRepairReleaseSettlementRef?: string | null;
}

export interface BookingCaseTransitionCommandInput {
  bookingCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  sourceDecisionEpochRef: string;
  sourceDecisionSupersessionRef?: string | null;
  lineageCaseLinkRef: string;
  requestLifecycleLeaseRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  reasonCode: string;
  activeCapabilityResolutionRef?: string | null;
  activeCapabilityProjectionRef?: string | null;
  activeProviderAdapterBindingRef?: string | null;
  capabilityState?: string | null;
  searchPolicy?: SearchPolicySnapshot | null;
  currentOfferSessionRef?: string | null;
  selectedSlotRef?: string | null;
  appointmentRef?: string | null;
  latestConfirmationTruthProjectionRef?: string | null;
  waitlistEntryRef?: string | null;
  activeWaitlistFallbackObligationRef?: string | null;
  latestWaitlistContinuationTruthProjectionRef?: string | null;
  exceptionRef?: string | null;
  activeIdentityRepairCaseRef?: string | null;
  identityRepairBranchDispositionRef?: string | null;
  identityRepairReleaseSettlementRef?: string | null;
  staleOwnerRecoveryRef?: string | null;
  patientShellConsistencyProjectionRef?: string | null;
  patientEmbeddedSessionProjectionRef?: string | null;
  surfaceRouteContractRef?: string;
  surfacePublicationRef?: string;
  runtimePublicationBundleRef?: string;
  routeFreezeDispositionRef?: string | null;
  releaseRecoveryDispositionRef?: string | null;
  callbackCaseRef?: string | null;
  hubCaseRef?: string | null;
}

export interface BookingCaseCreatedEventPayload {
  bookingCaseId: string;
  bookingIntentId: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  previousState: "none";
  nextState: "handoff_received";
  stateAxis: "case_state";
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  routeIntentBindingRef: string;
  sourceDecisionEpochRef: string;
}

export interface BookingCaseTransitionResult {
  bookingIntent: BookingIntentRecordSnapshot;
  bookingCase: BookingCaseSnapshot;
  searchPolicy: SearchPolicySnapshot | null;
  transitionJournalEntry: BookingCaseTransitionJournalEntrySnapshot;
  transitionJournal: readonly BookingCaseTransitionJournalEntrySnapshot[];
  emittedEvents: readonly FoundationEventEnvelope<object>[];
}

export interface BookingCaseBundle {
  bookingIntent: BookingIntentRecordSnapshot;
  bookingCase: BookingCaseSnapshot;
  searchPolicy: SearchPolicySnapshot | null;
  transitionJournal: readonly BookingCaseTransitionJournalEntrySnapshot[];
}

export interface Phase4BookingCaseKernelRepositories {
  getBookingIntent(intentId: string): Promise<SnapshotDocument<BookingIntentRecordSnapshot> | null>;
  getBookingCase(bookingCaseId: string): Promise<SnapshotDocument<BookingCaseSnapshot> | null>;
  getSearchPolicy(policyId: string): Promise<SnapshotDocument<SearchPolicySnapshot> | null>;
  listTransitionJournal(
    bookingCaseId: string,
  ): Promise<readonly SnapshotDocument<BookingCaseTransitionJournalEntrySnapshot>[]>;
}

interface TransitionAttemptContext {
  intent: BookingIntentRecordSnapshot;
  bookingCase: BookingCaseSnapshot;
  input: BookingCaseTransitionCommandInput;
  nextStatus: BookingCaseStatus;
}

function normalizeIntentState(
  value: BookingIntentSourceState | BookingIntentRecordState,
): BookingIntentRecordState {
  if (value === "seeded") {
    return "proposed";
  }
  return value;
}

function normalizeHandoff(
  handoff: BookingIntentHandoffSourceSnapshot | BookingIntentRecordSnapshot,
): BookingIntentRecordSnapshot {
  return {
    intentId: requireRef(handoff.intentId, "intentId"),
    episodeRef: requireRef(handoff.episodeRef, "episodeRef"),
    requestId: requireRef(handoff.requestId, "requestId"),
    requestLineageRef: requireRef(handoff.requestLineageRef, "requestLineageRef"),
    sourceTriageTaskRef: requireRef(handoff.sourceTriageTaskRef, "sourceTriageTaskRef"),
    lineageCaseLinkRef: requireRef(handoff.lineageCaseLinkRef, "lineageCaseLinkRef"),
    priorityBand: requireRef(handoff.priorityBand, "priorityBand"),
    timeframe: requireRef(handoff.timeframe, "timeframe"),
    modality: requireRef(handoff.modality, "modality"),
    clinicianType: requireRef(handoff.clinicianType, "clinicianType"),
    continuityPreference: requireRef(handoff.continuityPreference, "continuityPreference"),
    accessNeeds: requireRef(handoff.accessNeeds, "accessNeeds"),
    patientPreferenceSummary: requireRef(
      handoff.patientPreferenceSummary,
      "patientPreferenceSummary",
    ),
    createdFromDecisionId: requireRef(handoff.createdFromDecisionId, "createdFromDecisionId"),
    decisionEpochRef: requireRef(handoff.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(handoff.decisionSupersessionRecordRef),
    lifecycleLeaseRef: requireRef(handoff.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(handoff.leaseAuthorityRef, "leaseAuthorityRef"),
    leaseTtlSeconds: ensurePositiveInteger(handoff.leaseTtlSeconds, "leaseTtlSeconds"),
    ownershipEpoch: ensurePositiveInteger(handoff.ownershipEpoch, "ownershipEpoch"),
    fencingToken: requireRef(handoff.fencingToken, "fencingToken"),
    currentLineageFenceEpoch: ensurePositiveInteger(
      handoff.currentLineageFenceEpoch,
      "currentLineageFenceEpoch",
    ),
    intentState: normalizeIntentState(handoff.intentState),
    commandActionRecordRef: requireRef(handoff.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      handoff.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    lifecycleClosureAuthority: lifecycleAuthority(),
    createdAt: ensureIsoTimestamp(handoff.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(handoff.updatedAt, "updatedAt"),
    version: ensurePositiveInteger(handoff.version, "version"),
  };
}

function normalizeProviderContext(input: ProviderContextSnapshot): ProviderContextSnapshot {
  return {
    practiceRef: requireRef(input.practiceRef, "providerContext.practiceRef"),
    supplierHintRef: optionalRef(input.supplierHintRef),
    careSetting: requireRef(input.careSetting, "providerContext.careSetting"),
  };
}

function normalizeSearchPolicy(input: SearchPolicySnapshot): SearchPolicySnapshot {
  const timeframeEarliest = ensureIsoTimestamp(input.timeframeEarliest, "timeframeEarliest");
  const timeframeLatest = ensureIsoTimestamp(input.timeframeLatest, "timeframeLatest");
  invariant(
    compareIso(timeframeEarliest, timeframeLatest) <= 0,
    "INVALID_SEARCH_POLICY_TIMEFRAME",
    "timeframeLatest must not be earlier than timeframeEarliest.",
  );
  const selectionAudience = input.selectionAudience;
  invariant(
    selectionAudience === "patient_self_service" || selectionAudience === "staff_assist",
    "INVALID_SELECTION_AUDIENCE",
    "selectionAudience is invalid.",
  );
  const patientChannelMode = input.patientChannelMode;
  invariant(
    patientChannelMode === "signed_in_shell" ||
      patientChannelMode === "embedded_nhs_app" ||
      patientChannelMode === "staff_proxy",
    "INVALID_PATIENT_CHANNEL_MODE",
    "patientChannelMode is invalid.",
  );
  const slackEntries = Object.entries(input.sameBandReorderSlackMinutesByWindow ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  );
  const normalizedSlack: Record<string, number> = {};
  for (const [windowClass, minutes] of slackEntries) {
    normalizedSlack[requireRef(windowClass, "sameBandReorderSlackMinutesByWindow.key")] =
      ensurePositiveInteger(minutes + 1, "sameBandReorderSlackMinutesByWindow.value") - 1;
  }
  return {
    policyId: requireRef(input.policyId, "policyId"),
    timeframeEarliest,
    timeframeLatest,
    modality: requireRef(input.modality, "modality"),
    clinicianType: requireRef(input.clinicianType, "clinicianType"),
    continuityPreference: requireRef(input.continuityPreference, "continuityPreference"),
    sitePreference: uniqueSorted(input.sitePreference),
    accessibilityNeeds: uniqueSorted(input.accessibilityNeeds),
    maxTravelTime: ensurePositiveInteger(input.maxTravelTime, "maxTravelTime"),
    bookabilityPolicy: requireRef(input.bookabilityPolicy, "bookabilityPolicy"),
    selectionAudience,
    patientChannelMode,
    policyBundleHash: requireRef(input.policyBundleHash, "policyBundleHash"),
    sameBandReorderSlackMinutesByWindow: normalizedSlack,
  };
}

function isIdentityRepairReleased(ref: string | null): boolean {
  if (ref === null) {
    return true;
  }
  return /released|clear|resolved/i.test(ref);
}

function isRecoveryFrozen(ref: string | null): boolean {
  return ref !== null;
}

function createRejectedJournalEntry(
  idGenerator: BackboneIdGenerator,
  bookingCase: BookingCaseSnapshot,
  input: BookingCaseTransitionCommandInput,
  nextStatus: BookingCaseStatus,
  failureCode: string,
  version: number,
): BookingCaseTransitionJournalEntrySnapshot {
  return {
    bookingCaseTransitionJournalEntryId: nextId(idGenerator, "booking_case_transition_rejected"),
    bookingCaseId: bookingCase.bookingCaseId,
    bookingIntentId: bookingCase.bookingIntentId,
    requestId: bookingCase.requestId,
    requestLineageRef: bookingCase.requestLineageRef,
    lineageCaseLinkRef: bookingCase.lineageCaseLinkRef,
    previousStatus: bookingCase.status,
    nextStatus,
    transitionOutcome: "rejected",
    failureCode,
    actorRef: requireRef(input.actorRef, "actorRef"),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    sourceDecisionEpochRef: requireRef(input.sourceDecisionEpochRef, "sourceDecisionEpochRef"),
    requestLifecycleLeaseRef: requireRef(
      input.requestLifecycleLeaseRef,
      "requestLifecycleLeaseRef",
    ),
    ownershipEpoch: ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    currentLineageFenceEpoch: ensurePositiveInteger(
      input.currentLineageFenceEpoch,
      "currentLineageFenceEpoch",
    ),
    transitionPredicateId: transitionPredicateIds[nextStatus],
    reasonCode: requireRef(input.reasonCode, "reasonCode"),
    dependentRef:
      optionalRef(input.callbackCaseRef) ??
      optionalRef(input.hubCaseRef) ??
      optionalRef(input.currentOfferSessionRef) ??
      optionalRef(input.appointmentRef) ??
      optionalRef(input.exceptionRef),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    version,
  };
}

function buildBookingCaseCreatedEvent(
  input: BookingCaseCreatedEventPayload,
): FoundationEventEnvelope<BookingCaseCreatedEventPayload> {
  return makeFoundationEvent("booking.case.created", input);
}

export function createPhase4BookingCaseKernelStore(): Phase4BookingCaseKernelRepositories & {
  saveBookingIntent(
    snapshot: BookingIntentRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveBookingCase(snapshot: BookingCaseSnapshot, options?: CompareAndSetWriteOptions): Promise<void>;
  saveSearchPolicy(
    snapshot: SearchPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendTransitionJournalEntry(snapshot: BookingCaseTransitionJournalEntrySnapshot): Promise<void>;
  findBookingCaseByIntentId(intentId: string): Promise<SnapshotDocument<BookingCaseSnapshot> | null>;
  findBookingCaseByLineageCaseLinkRef(
    lineageCaseLinkRef: string,
  ): Promise<SnapshotDocument<BookingCaseSnapshot> | null>;
  getCreationReplay(
    replayKey: string,
  ): Promise<{ bookingCaseId: string; commandActionRecordRef: string } | null>;
  saveCreationReplay(
    replayKey: string,
    value: { bookingCaseId: string; commandActionRecordRef: string },
  ): Promise<void>;
  getTransitionReplay(
    replayKey: string,
  ): Promise<{ bookingCaseId: string; nextStatus: BookingCaseStatus } | null>;
  saveTransitionReplay(
    replayKey: string,
    value: { bookingCaseId: string; nextStatus: BookingCaseStatus },
  ): Promise<void>;
} {
  const bookingIntents = new Map<string, StoredRow<BookingIntentRecordSnapshot>>();
  const bookingCases = new Map<string, StoredRow<BookingCaseSnapshot>>();
  const searchPolicies = new Map<string, StoredRow<SearchPolicySnapshot>>();
  const transitionJournal = new Map<string, BookingCaseTransitionJournalEntrySnapshot[]>();
  const bookingCaseByIntentId = new Map<string, string>();
  const bookingCaseByLineageCaseLinkRef = new Map<string, string>();
  const creationReplay = new Map<string, { bookingCaseId: string; commandActionRecordRef: string }>();
  const transitionReplay = new Map<
    string,
    { bookingCaseId: string; nextStatus: BookingCaseStatus }
  >();

  return {
    async getBookingIntent(intentId) {
      const row = bookingIntents.get(intentId);
      return row ? new StoredDocument(row) : null;
    },
    async getBookingCase(bookingCaseId) {
      const row = bookingCases.get(bookingCaseId);
      return row ? new StoredDocument(row) : null;
    },
    async getSearchPolicy(policyId) {
      const row = searchPolicies.get(policyId);
      return row ? new StoredDocument(row) : null;
    },
    async listTransitionJournal(bookingCaseId) {
      return (transitionJournal.get(bookingCaseId) ?? []).map((entry) => ({
        toSnapshot() {
          return structuredClone(entry);
        },
      }));
    },
    async saveBookingIntent(snapshot, options) {
      saveWithCas(bookingIntents, snapshot.intentId, structuredClone(snapshot), options);
    },
    async saveBookingCase(snapshot, options) {
      const existingForIntent = bookingCaseByIntentId.get(snapshot.bookingIntentId);
      invariant(
        existingForIntent === undefined || existingForIntent === snapshot.bookingCaseId,
        "BOOKING_CASE_INTENT_CONFLICT",
        `Booking intent ${snapshot.bookingIntentId} is already bound to case ${existingForIntent}.`,
      );
      const existingForLineage = bookingCaseByLineageCaseLinkRef.get(snapshot.lineageCaseLinkRef);
      invariant(
        existingForLineage === undefined || existingForLineage === snapshot.bookingCaseId,
        "BOOKING_CASE_LINEAGE_CONFLICT",
        `Lineage case link ${snapshot.lineageCaseLinkRef} is already bound to case ${existingForLineage}.`,
      );
      saveWithCas(bookingCases, snapshot.bookingCaseId, structuredClone(snapshot), options);
      bookingCaseByIntentId.set(snapshot.bookingIntentId, snapshot.bookingCaseId);
      bookingCaseByLineageCaseLinkRef.set(snapshot.lineageCaseLinkRef, snapshot.bookingCaseId);
    },
    async saveSearchPolicy(snapshot, options) {
      saveWithCas(searchPolicies, snapshot.policyId, structuredClone(snapshot), options);
    },
    async appendTransitionJournalEntry(snapshot) {
      const rows = transitionJournal.get(snapshot.bookingCaseId) ?? [];
      const latestVersion = rows.at(-1)?.version ?? 0;
      invariant(
        snapshot.version === latestVersion + 1,
        "NON_MONOTONE_TRANSITION_JOURNAL",
        `Transition journal for ${snapshot.bookingCaseId} must append version ${latestVersion + 1}.`,
      );
      transitionJournal.set(snapshot.bookingCaseId, [...rows, structuredClone(snapshot)]);
    },
    async findBookingCaseByIntentId(intentId) {
      const bookingCaseId = bookingCaseByIntentId.get(intentId);
      if (!bookingCaseId) {
        return null;
      }
      return this.getBookingCase(bookingCaseId);
    },
    async findBookingCaseByLineageCaseLinkRef(lineageCaseLinkRef) {
      const bookingCaseId = bookingCaseByLineageCaseLinkRef.get(lineageCaseLinkRef);
      if (!bookingCaseId) {
        return null;
      }
      return this.getBookingCase(bookingCaseId);
    },
    async getCreationReplay(replayKey) {
      const row = creationReplay.get(replayKey);
      return row ? structuredClone(row) : null;
    },
    async saveCreationReplay(replayKey, value) {
      creationReplay.set(replayKey, structuredClone(value));
    },
    async getTransitionReplay(replayKey) {
      const row = transitionReplay.get(replayKey);
      return row ? structuredClone(row) : null;
    },
    async saveTransitionReplay(replayKey, value) {
      transitionReplay.set(replayKey, structuredClone(value));
    },
  };
}

export interface Phase4BookingCaseKernelService {
  repositories: Phase4BookingCaseKernelRepositories;
  createBookingCaseFromIntent(input: CreateBookingCaseFromIntentInput): Promise<BookingCaseTransitionResult>;
  markCapabilityChecked(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  beginLocalSearch(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  publishOffersReady(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  startSelection(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  startRevalidation(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  enterCommitPending(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markConfirmationPending(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markSupplierReconciliationPending(
    input: BookingCaseTransitionCommandInput,
  ): Promise<BookingCaseTransitionResult>;
  markWaitlisted(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markCallbackFallback(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markHubFallback(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markBookingFailed(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markBooked(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  markManaged(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  closeBookingCase(input: BookingCaseTransitionCommandInput): Promise<BookingCaseTransitionResult>;
  queryBookingCaseBundle(bookingCaseId: string): Promise<BookingCaseBundle | null>;
}

export function createPhase4BookingCaseKernelService(input?: {
  repositories?: ReturnType<typeof createPhase4BookingCaseKernelStore>;
  idGenerator?: BackboneIdGenerator;
}): Phase4BookingCaseKernelService {
  const repositories = input?.repositories ?? createPhase4BookingCaseKernelStore();
  const idGenerator = input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase4-booking");

  async function requireCase(bookingCaseId: string): Promise<BookingCaseSnapshot> {
    const document = await repositories.getBookingCase(bookingCaseId);
    invariant(document, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    return document.toSnapshot();
  }

  async function requireIntent(intentId: string): Promise<BookingIntentRecordSnapshot> {
    const document = await repositories.getBookingIntent(intentId);
    invariant(document, "BOOKING_INTENT_NOT_FOUND", `BookingIntent ${intentId} was not found.`);
    return document.toSnapshot();
  }

  async function currentBundle(bookingCase: BookingCaseSnapshot): Promise<BookingCaseBundle> {
    const intent = await requireIntent(bookingCase.bookingIntentId);
    const searchPolicy = bookingCase.searchPolicyRef
      ? (await repositories.getSearchPolicy(bookingCase.searchPolicyRef))?.toSnapshot() ?? null
      : null;
    const transitionJournal = (await repositories.listTransitionJournal(bookingCase.bookingCaseId)).map(
      (document) => document.toSnapshot(),
    );
    return {
      bookingIntent: intent,
      bookingCase,
      searchPolicy,
      transitionJournal,
    };
  }

  async function appendRejectedTransition(
    bookingCase: BookingCaseSnapshot,
    intent: BookingIntentRecordSnapshot,
    input: BookingCaseTransitionCommandInput,
    nextStatus: BookingCaseStatus,
    failureCode: string,
  ): Promise<never> {
    const journalEntries = (await repositories.listTransitionJournal(bookingCase.bookingCaseId)).map(
      (document) => document.toSnapshot(),
    );
    const journalEntry = createRejectedJournalEntry(
      idGenerator,
      bookingCase,
      input,
      nextStatus,
      failureCode,
      journalEntries.length + 1,
    );
    await repositories.appendTransitionJournalEntry(journalEntry);
    throw new RequestBackboneInvariantError(
      failureCode,
      `BookingCase ${bookingCase.bookingCaseId} rejected transition ${bookingCase.status} -> ${nextStatus}.`,
    );
  }

  function normalizedRecordedAt(input: { recordedAt?: string; createdAt?: string }): string {
    if (input.recordedAt) {
      return ensureIsoTimestamp(input.recordedAt, "recordedAt");
    }
    invariant(input.createdAt, "MISSING_RECORDED_AT", "recordedAt is required.");
    return ensureIsoTimestamp(input.createdAt, "createdAt");
  }

  async function assertCaseMutationAllowed(
    context: TransitionAttemptContext,
  ): Promise<void> {
    const { bookingCase, intent, input, nextStatus } = context;
    invariant(
      bookingCase.sourceDecisionEpochRef === requireRef(input.sourceDecisionEpochRef, "sourceDecisionEpochRef"),
      "STALE_SOURCE_DECISION_EPOCH",
      "sourceDecisionEpochRef no longer matches the current BookingCase tuple.",
    );
    invariant(
      intent.decisionEpochRef === bookingCase.sourceDecisionEpochRef,
      "INTENT_CASE_DECISION_EPOCH_DRIFT",
      "BookingIntent and BookingCase decision epochs no longer align.",
    );
    invariant(
      optionalRef(input.sourceDecisionSupersessionRef) === null &&
        bookingCase.sourceDecisionSupersessionRef === null &&
        intent.decisionSupersessionRecordRef === null,
      "SOURCE_DECISION_SUPERSEDED",
      "The source decision epoch has been superseded and booking mutation must fail closed.",
    );
    invariant(
      bookingCase.lineageCaseLinkRef === requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef") &&
        intent.lineageCaseLinkRef === bookingCase.lineageCaseLinkRef,
      "LINEAGE_CASE_LINK_DRIFT",
      "lineageCaseLinkRef no longer matches the live booking lineage.",
    );
    invariant(
      bookingCase.requestLifecycleLeaseRef ===
        requireRef(input.requestLifecycleLeaseRef, "requestLifecycleLeaseRef") &&
        intent.lifecycleLeaseRef === bookingCase.requestLifecycleLeaseRef,
      "STALE_REQUEST_LIFECYCLE_LEASE",
      "requestLifecycleLeaseRef is stale for the current booking tuple.",
    );
    invariant(
      bookingCase.ownershipEpoch === ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch") &&
        intent.ownershipEpoch === bookingCase.ownershipEpoch,
      "STALE_OWNERSHIP_EPOCH",
      "ownershipEpoch is stale for the current booking tuple.",
    );
    invariant(
      intent.fencingToken === requireRef(input.fencingToken, "fencingToken"),
      "STALE_FENCING_TOKEN",
      "fencingToken is stale for the current booking tuple.",
    );
    invariant(
      intent.currentLineageFenceEpoch ===
        ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch"),
      "STALE_LINEAGE_FENCE_EPOCH",
      "currentLineageFenceEpoch is stale for the current booking tuple.",
    );
    invariant(
      intent.intentState !== "superseded" && intent.intentState !== "recovery_only",
      "STALE_BOOKING_INTENT",
      "BookingIntent is no longer live for mutation.",
    );
    invariant(
      isIdentityRepairReleased(
        optionalRef(input.identityRepairBranchDispositionRef) ??
          bookingCase.identityRepairBranchDispositionRef,
      ),
      "IDENTITY_REPAIR_FREEZE_ACTIVE",
      "Identity repair freeze suppresses live booking mutation.",
    );
    invariant(
      !isRecoveryFrozen(
        optionalRef(input.routeFreezeDispositionRef) ?? bookingCase.routeFreezeDispositionRef,
      ),
      "ROUTE_FREEZE_ACTIVE",
      "Route freeze disposition is active for the booking shell tuple.",
    );
    invariant(
      !isRecoveryFrozen(
        optionalRef(input.releaseRecoveryDispositionRef) ?? bookingCase.releaseRecoveryDispositionRef,
      ),
      "RELEASE_RECOVERY_ACTIVE",
      "Release recovery disposition is active for the booking shell tuple.",
    );
    invariant(
      legalTransitionGraph[bookingCase.status].includes(nextStatus),
      "ILLEGAL_BOOKING_CASE_TRANSITION",
      `Transition ${bookingCase.status} -> ${nextStatus} is not legal in the frozen 278 graph.`,
    );
  }

  function nextCaseSnapshot(
    bookingCase: BookingCaseSnapshot,
    input: BookingCaseTransitionCommandInput,
    nextStatus: BookingCaseStatus,
  ): BookingCaseSnapshot {
    const activeCapabilityResolutionRef =
      optionalRef(input.activeCapabilityResolutionRef) ?? bookingCase.activeCapabilityResolutionRef;
    const activeCapabilityProjectionRef =
      optionalRef(input.activeCapabilityProjectionRef) ?? bookingCase.activeCapabilityProjectionRef;
    const activeProviderAdapterBindingRef =
      optionalRef(input.activeProviderAdapterBindingRef) ??
      bookingCase.activeProviderAdapterBindingRef;
    const currentOfferSessionRef =
      optionalRef(input.currentOfferSessionRef) ?? bookingCase.currentOfferSessionRef;
    const selectedSlotRef = optionalRef(input.selectedSlotRef) ?? bookingCase.selectedSlotRef;
    const appointmentRef = optionalRef(input.appointmentRef) ?? bookingCase.appointmentRef;
    const latestConfirmationTruthProjectionRef =
      optionalRef(input.latestConfirmationTruthProjectionRef) ??
      bookingCase.latestConfirmationTruthProjectionRef;
    const waitlistEntryRef = optionalRef(input.waitlistEntryRef) ?? bookingCase.waitlistEntryRef;
    const activeWaitlistFallbackObligationRef =
      optionalRef(input.activeWaitlistFallbackObligationRef) ??
      bookingCase.activeWaitlistFallbackObligationRef;
    const latestWaitlistContinuationTruthProjectionRef =
      optionalRef(input.latestWaitlistContinuationTruthProjectionRef) ??
      bookingCase.latestWaitlistContinuationTruthProjectionRef;
    const exceptionRef = optionalRef(input.exceptionRef) ?? bookingCase.exceptionRef;
    return {
      ...bookingCase,
      activeCapabilityResolutionRef,
      activeCapabilityProjectionRef,
      activeProviderAdapterBindingRef,
      status: nextStatus,
      currentOfferSessionRef,
      selectedSlotRef,
      appointmentRef,
      latestConfirmationTruthProjectionRef,
      waitlistEntryRef,
      activeWaitlistFallbackObligationRef,
      latestWaitlistContinuationTruthProjectionRef,
      exceptionRef,
      activeIdentityRepairCaseRef:
        optionalRef(input.activeIdentityRepairCaseRef) ?? bookingCase.activeIdentityRepairCaseRef,
      identityRepairBranchDispositionRef:
        optionalRef(input.identityRepairBranchDispositionRef) ??
        bookingCase.identityRepairBranchDispositionRef,
      identityRepairReleaseSettlementRef:
        optionalRef(input.identityRepairReleaseSettlementRef) ??
        bookingCase.identityRepairReleaseSettlementRef,
      staleOwnerRecoveryRef:
        optionalRef(input.staleOwnerRecoveryRef) ?? bookingCase.staleOwnerRecoveryRef,
      patientShellConsistencyProjectionRef:
        optionalRef(input.patientShellConsistencyProjectionRef) ??
        bookingCase.patientShellConsistencyProjectionRef,
      patientEmbeddedSessionProjectionRef:
        optionalRef(input.patientEmbeddedSessionProjectionRef) ??
        bookingCase.patientEmbeddedSessionProjectionRef,
      surfaceRouteContractRef:
        optionalRef(input.surfaceRouteContractRef) ?? bookingCase.surfaceRouteContractRef,
      surfacePublicationRef:
        optionalRef(input.surfacePublicationRef) ?? bookingCase.surfacePublicationRef,
      runtimePublicationBundleRef:
        optionalRef(input.runtimePublicationBundleRef) ?? bookingCase.runtimePublicationBundleRef,
      routeFreezeDispositionRef:
        optionalRef(input.routeFreezeDispositionRef) ?? bookingCase.routeFreezeDispositionRef,
      releaseRecoveryDispositionRef:
        optionalRef(input.releaseRecoveryDispositionRef) ??
        bookingCase.releaseRecoveryDispositionRef,
      updatedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    };
  }

  async function applyTransition(
    input: BookingCaseTransitionCommandInput,
    nextStatus: BookingCaseStatus,
    transitionGuard: (context: TransitionAttemptContext) => void,
  ): Promise<BookingCaseTransitionResult> {
    const bookingCase = await requireCase(input.bookingCaseId);
    const intent = await requireIntent(bookingCase.bookingIntentId);
    const replayKey = `${bookingCase.bookingCaseId}::${requireRef(
      input.commandActionRecordRef,
      "commandActionRecordRef",
    )}`;
    const replay = await repositories.getTransitionReplay(replayKey);
    if (replay) {
      invariant(
        replay.nextStatus === nextStatus,
        "TRANSITION_REPLAY_TARGET_MISMATCH",
        `Command ${input.commandActionRecordRef} already resolved to ${replay.nextStatus}.`,
      );
      const bundle = await currentBundle(bookingCase);
      const transitionJournal = bundle.transitionJournal;
      const journalEntry = transitionJournal.at(-1);
      invariant(
        journalEntry !== undefined,
        "TRANSITION_REPLAY_JOURNAL_MISSING",
        `Transition replay for ${bookingCase.bookingCaseId} has no journal entry.`,
      );
      return {
        ...bundle,
        transitionJournalEntry: journalEntry,
        emittedEvents: [],
      };
    }

    const context: TransitionAttemptContext = {
      intent,
      bookingCase,
      input,
      nextStatus,
    };

    try {
      await assertCaseMutationAllowed(context);
      transitionGuard(context);
    } catch (error) {
      if (error instanceof RequestBackboneInvariantError) {
        await appendRejectedTransition(bookingCase, intent, input, nextStatus, error.code);
      }
      throw error;
    }

    const nextPolicy =
      input.searchPolicy === undefined || input.searchPolicy === null
        ? bookingCase.searchPolicyRef
          ? (await repositories.getSearchPolicy(bookingCase.searchPolicyRef))?.toSnapshot() ?? null
          : null
        : normalizeSearchPolicy(input.searchPolicy);
    if (nextPolicy) {
      await repositories.saveSearchPolicy(nextPolicy);
    }
    const nextSnapshot = nextCaseSnapshot(bookingCase, input, nextStatus);
    const persistedSnapshot: BookingCaseSnapshot = {
      ...nextSnapshot,
      searchPolicyRef: nextPolicy?.policyId ?? nextSnapshot.searchPolicyRef,
    };
    await repositories.saveBookingCase(persistedSnapshot);

    const previousJournalEntries = (await repositories.listTransitionJournal(
      bookingCase.bookingCaseId,
    )).map((document) => document.toSnapshot());
    const journalEntry: BookingCaseTransitionJournalEntrySnapshot = {
      bookingCaseTransitionJournalEntryId: nextId(idGenerator, "booking_case_transition"),
      bookingCaseId: persistedSnapshot.bookingCaseId,
      bookingIntentId: persistedSnapshot.bookingIntentId,
      requestId: persistedSnapshot.requestId,
      requestLineageRef: persistedSnapshot.requestLineageRef,
      lineageCaseLinkRef: persistedSnapshot.lineageCaseLinkRef,
      previousStatus: bookingCase.status,
      nextStatus,
      transitionOutcome: "applied",
      failureCode: null,
      actorRef: requireRef(input.actorRef, "actorRef"),
      routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
      commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
      commandSettlementRecordRef: requireRef(
        input.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      sourceDecisionEpochRef: requireRef(input.sourceDecisionEpochRef, "sourceDecisionEpochRef"),
      requestLifecycleLeaseRef: requireRef(
        input.requestLifecycleLeaseRef,
        "requestLifecycleLeaseRef",
      ),
      ownershipEpoch: ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch"),
      fencingToken: requireRef(input.fencingToken, "fencingToken"),
      currentLineageFenceEpoch: ensurePositiveInteger(
        input.currentLineageFenceEpoch,
        "currentLineageFenceEpoch",
      ),
      transitionPredicateId: transitionPredicateIds[nextStatus],
      reasonCode: requireRef(input.reasonCode, "reasonCode"),
      dependentRef:
        optionalRef(input.callbackCaseRef) ??
        optionalRef(input.hubCaseRef) ??
        optionalRef(input.currentOfferSessionRef) ??
        optionalRef(input.appointmentRef) ??
        optionalRef(input.exceptionRef),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: previousJournalEntries.length + 1,
    };
    await repositories.appendTransitionJournalEntry(journalEntry);
    await repositories.saveTransitionReplay(replayKey, {
      bookingCaseId: persistedSnapshot.bookingCaseId,
      nextStatus,
    });

    const bundle = await currentBundle(persistedSnapshot);
    return {
      ...bundle,
      transitionJournalEntry: journalEntry,
      emittedEvents: [],
    };
  }

  return {
    repositories,

    async createBookingCaseFromIntent(input) {
      const normalizedIntent = normalizeHandoff(input.handoff);
      invariant(
        normalizedIntent.decisionSupersessionRecordRef === null,
        "SOURCE_DECISION_SUPERSEDED",
        "Superseded booking handoffs cannot open a live BookingCase.",
      );
      invariant(
        normalizedIntent.intentState !== "superseded" &&
          normalizedIntent.intentState !== "recovery_only",
        "STALE_BOOKING_INTENT",
        "Only live booking handoffs can create BookingCase state.",
      );
      invariant(
        isIdentityRepairReleased(optionalRef(input.identityRepairBranchDispositionRef)),
        "IDENTITY_REPAIR_FREEZE_ACTIVE",
        "Identity repair freeze suppresses live booking case creation.",
      );
      const replayKey = `${normalizedIntent.intentId}::${requireRef(
        input.commandActionRecordRef,
        "commandActionRecordRef",
      )}`;
      const replay = await repositories.getCreationReplay(replayKey);
      if (replay) {
        const document = await repositories.getBookingCase(replay.bookingCaseId);
        invariant(
          document,
          "BOOKING_CASE_REPLAY_MISSING",
          `BookingCase replay ${replay.bookingCaseId} is missing.`,
        );
        const bundle = await currentBundle(document.toSnapshot());
        const transitionJournalEntry = bundle.transitionJournal.at(-1);
        invariant(
          transitionJournalEntry !== undefined,
          "BOOKING_CASE_REPLAY_JOURNAL_MISSING",
          `BookingCase replay ${replay.bookingCaseId} has no creation journal.`,
        );
        return {
          ...bundle,
          transitionJournalEntry,
          emittedEvents: [],
        };
      }

      const existingCase = await repositories.findBookingCaseByIntentId(normalizedIntent.intentId);
      invariant(
        existingCase === null,
        "BOOKING_CASE_ALREADY_EXISTS_FOR_INTENT",
        `Booking intent ${normalizedIntent.intentId} already owns a BookingCase.`,
      );
      const existingLineage = await repositories.findBookingCaseByLineageCaseLinkRef(
        normalizedIntent.lineageCaseLinkRef,
      );
      invariant(
        existingLineage === null,
        "BOOKING_CASE_ALREADY_EXISTS_FOR_LINEAGE",
        `Lineage case link ${normalizedIntent.lineageCaseLinkRef} already owns a BookingCase.`,
      );

      const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
      const bookingIntent: BookingIntentRecordSnapshot = {
        ...normalizedIntent,
        intentState: "acknowledged",
        commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          input.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        updatedAt: createdAt,
        version: normalizedIntent.version + 1,
      };
      await repositories.saveBookingIntent(bookingIntent);

      const bookingCase: BookingCaseSnapshot = {
        bookingCaseId:
          optionalRef(input.bookingCaseId) ?? nextId(idGenerator, "phase4_booking_case"),
        episodeRef: bookingIntent.episodeRef,
        requestId: bookingIntent.requestId,
        requestLineageRef: bookingIntent.requestLineageRef,
        lineageCaseLinkRef: bookingIntent.lineageCaseLinkRef,
        originTriageTaskRef: bookingIntent.sourceTriageTaskRef,
        bookingIntentId: bookingIntent.intentId,
        sourceDecisionEpochRef: bookingIntent.decisionEpochRef,
        sourceDecisionSupersessionRef: bookingIntent.decisionSupersessionRecordRef,
        patientRef: requireRef(input.patientRef, "patientRef"),
        tenantId: requireRef(input.tenantId, "tenantId"),
        providerContext: normalizeProviderContext(input.providerContext),
        activeCapabilityResolutionRef: null,
        activeCapabilityProjectionRef: null,
        activeProviderAdapterBindingRef: null,
        status: "handoff_received",
        searchPolicyRef: null,
        currentOfferSessionRef: null,
        selectedSlotRef: null,
        appointmentRef: null,
        latestConfirmationTruthProjectionRef: null,
        waitlistEntryRef: null,
        activeWaitlistFallbackObligationRef: null,
        latestWaitlistContinuationTruthProjectionRef: null,
        exceptionRef: null,
        activeIdentityRepairCaseRef: optionalRef(input.activeIdentityRepairCaseRef),
        identityRepairBranchDispositionRef: optionalRef(input.identityRepairBranchDispositionRef),
        identityRepairReleaseSettlementRef: optionalRef(
          input.identityRepairReleaseSettlementRef,
        ),
        requestLifecycleLeaseRef: bookingIntent.lifecycleLeaseRef,
        ownershipEpoch: bookingIntent.ownershipEpoch,
        staleOwnerRecoveryRef: null,
        patientShellConsistencyProjectionRef: optionalRef(
          input.patientShellConsistencyProjectionRef,
        ),
        patientEmbeddedSessionProjectionRef: optionalRef(
          input.patientEmbeddedSessionProjectionRef,
        ),
        surfaceRouteContractRef: requireRef(
          input.surfaceRouteContractRef,
          "surfaceRouteContractRef",
        ),
        surfacePublicationRef: requireRef(
          input.surfacePublicationRef,
          "surfacePublicationRef",
        ),
        runtimePublicationBundleRef: requireRef(
          input.runtimePublicationBundleRef,
          "runtimePublicationBundleRef",
        ),
        routeFreezeDispositionRef: optionalRef(input.routeFreezeDispositionRef),
        releaseRecoveryDispositionRef: optionalRef(input.releaseRecoveryDispositionRef),
        closureAuthority: lifecycleAuthority(),
        createdAt,
        updatedAt: createdAt,
      };
      await repositories.saveBookingCase(bookingCase);

      const journalEntry: BookingCaseTransitionJournalEntrySnapshot = {
        bookingCaseTransitionJournalEntryId: nextId(idGenerator, "booking_case_transition"),
        bookingCaseId: bookingCase.bookingCaseId,
        bookingIntentId: bookingCase.bookingIntentId,
        requestId: bookingCase.requestId,
        requestLineageRef: bookingCase.requestLineageRef,
        lineageCaseLinkRef: bookingCase.lineageCaseLinkRef,
        previousStatus: "handoff_received",
        nextStatus: "handoff_received",
        transitionOutcome: "applied",
        failureCode: null,
        actorRef: requireRef(input.actorRef, "actorRef"),
        routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
        commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          input.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        sourceDecisionEpochRef: bookingCase.sourceDecisionEpochRef,
        requestLifecycleLeaseRef: bookingCase.requestLifecycleLeaseRef,
        ownershipEpoch: bookingCase.ownershipEpoch,
        fencingToken: bookingIntent.fencingToken,
        currentLineageFenceEpoch: bookingIntent.currentLineageFenceEpoch,
        transitionPredicateId: "P278_HANDOFF_INGESTED",
        reasonCode: "booking_intent_handoff_acknowledged",
        dependentRef: bookingIntent.intentId,
        recordedAt: createdAt,
        version: 1,
      };
      await repositories.appendTransitionJournalEntry(journalEntry);
      await repositories.saveCreationReplay(replayKey, {
        bookingCaseId: bookingCase.bookingCaseId,
        commandActionRecordRef: bookingIntent.commandActionRecordRef,
      });

      const emittedEvent = buildBookingCaseCreatedEvent({
        bookingCaseId: bookingCase.bookingCaseId,
        bookingIntentId: bookingIntent.intentId,
        requestId: bookingCase.requestId,
        requestLineageRef: bookingCase.requestLineageRef,
        lineageCaseLinkRef: bookingCase.lineageCaseLinkRef,
        previousState: "none",
        nextState: "handoff_received",
        stateAxis: "case_state",
        commandActionRecordRef: bookingIntent.commandActionRecordRef,
        commandSettlementRecordRef: bookingIntent.commandSettlementRecordRef,
        routeIntentBindingRef: journalEntry.routeIntentBindingRef,
        sourceDecisionEpochRef: bookingCase.sourceDecisionEpochRef,
      });

      return {
        bookingIntent,
        bookingCase,
        searchPolicy: null,
        transitionJournalEntry: journalEntry,
        transitionJournal: [journalEntry],
        emittedEvents: [emittedEvent],
      };
    },

    async markCapabilityChecked(input) {
      return applyTransition(input, "capability_checked", () => {});
    },

    async beginLocalSearch(input) {
      return applyTransition(input, "searching_local", ({ input }) => {
        invariant(
          optionalRef(input.activeCapabilityResolutionRef) !== null &&
            optionalRef(input.activeCapabilityProjectionRef) !== null &&
            optionalRef(input.activeProviderAdapterBindingRef) !== null,
          "CAPABILITY_TUPLE_MISSING",
          "A live capability tuple is required before local search can begin.",
        );
        invariant(
          input.capabilityState === "live_self_service" ||
            input.capabilityState === "live_staff_assist",
          "CAPABILITY_NOT_LIVE_FOR_SEARCH",
          "Capability state is not live for local search.",
        );
        invariant(input.searchPolicy !== undefined && input.searchPolicy !== null, "SEARCH_POLICY_MISSING", "SearchPolicy is required before local search can begin.");
        const policy = normalizeSearchPolicy(input.searchPolicy);
        invariant(
          policy.policyBundleHash === input.searchPolicy.policyBundleHash &&
            hashSearchPolicy(policy).length > 0,
          "INVALID_SEARCH_POLICY",
          "SearchPolicy could not be normalized.",
        );
      });
    },

    async publishOffersReady(input) {
      return applyTransition(input, "offers_ready", ({ input }) => {
        invariant(
          optionalRef(input.currentOfferSessionRef) !== null,
          "OFFER_SESSION_REF_MISSING",
          "currentOfferSessionRef is required to publish offers_ready.",
        );
      });
    },

    async startSelection(input) {
      return applyTransition(input, "selecting", ({ input }) => {
        invariant(
          optionalRef(input.selectedSlotRef) !== null,
          "SELECTED_SLOT_REF_MISSING",
          "selectedSlotRef is required to enter selecting state.",
        );
      });
    },

    async startRevalidation(input) {
      return applyTransition(input, "revalidating", ({ input }) => {
        invariant(
          optionalRef(input.selectedSlotRef) !== null,
          "SELECTED_SLOT_REF_MISSING",
          "selectedSlotRef is required to enter revalidating state.",
        );
      });
    },

    async enterCommitPending(input) {
      return applyTransition(input, "commit_pending", ({ input }) => {
        invariant(
          optionalRef(input.selectedSlotRef) !== null,
          "SELECTED_SLOT_REF_MISSING",
          "selectedSlotRef is required to enter commit_pending.",
        );
      });
    },

    async markConfirmationPending(input) {
      return applyTransition(input, "confirmation_pending", ({ input }) => {
        invariant(
          optionalRef(input.latestConfirmationTruthProjectionRef) !== null,
          "CONFIRMATION_TRUTH_REF_MISSING",
          "latestConfirmationTruthProjectionRef is required to enter confirmation_pending.",
        );
      });
    },

    async markSupplierReconciliationPending(input) {
      return applyTransition(input, "supplier_reconciliation_pending", ({ input }) => {
        invariant(
          optionalRef(input.latestConfirmationTruthProjectionRef) !== null,
          "CONFIRMATION_TRUTH_REF_MISSING",
          "latestConfirmationTruthProjectionRef is required to enter supplier_reconciliation_pending.",
        );
      });
    },

    async markWaitlisted(input) {
      return applyTransition(input, "waitlisted", ({ input }) => {
        invariant(
          optionalRef(input.waitlistEntryRef) !== null,
          "WAITLIST_ENTRY_REF_MISSING",
          "waitlistEntryRef is required to enter waitlisted.",
        );
        invariant(
          optionalRef(input.latestWaitlistContinuationTruthProjectionRef) !== null,
          "WAITLIST_CONTINUATION_TRUTH_REF_MISSING",
          "latestWaitlistContinuationTruthProjectionRef is required to enter waitlisted.",
        );
      });
    },

    async markCallbackFallback(input) {
      return applyTransition(input, "callback_fallback", ({ input }) => {
        invariant(
          optionalRef(input.activeWaitlistFallbackObligationRef) !== null,
          "WAITLIST_FALLBACK_OBLIGATION_REF_MISSING",
          "activeWaitlistFallbackObligationRef is required for callback fallback.",
        );
        invariant(
          optionalRef(input.callbackCaseRef) !== null,
          "CALLBACK_CASE_REF_MISSING",
          "callbackCaseRef is required for callback fallback.",
        );
      });
    },

    async markHubFallback(input) {
      return applyTransition(input, "fallback_to_hub", ({ input }) => {
        invariant(
          optionalRef(input.activeWaitlistFallbackObligationRef) !== null,
          "WAITLIST_FALLBACK_OBLIGATION_REF_MISSING",
          "activeWaitlistFallbackObligationRef is required for hub fallback.",
        );
        invariant(
          optionalRef(input.hubCaseRef) !== null,
          "HUB_CASE_REF_MISSING",
          "hubCaseRef is required for hub fallback.",
        );
      });
    },

    async markBookingFailed(input) {
      return applyTransition(input, "booking_failed", ({ input }) => {
        invariant(
          optionalRef(input.exceptionRef) !== null,
          "BOOKING_EXCEPTION_REF_MISSING",
          "exceptionRef is required to enter booking_failed.",
        );
      });
    },

    async markBooked(input) {
      return applyTransition(input, "booked", ({ input }) => {
        invariant(
          optionalRef(input.appointmentRef) !== null,
          "APPOINTMENT_REF_MISSING",
          "appointmentRef is required to enter booked.",
        );
        invariant(
          optionalRef(input.latestConfirmationTruthProjectionRef) !== null,
          "CONFIRMATION_TRUTH_REF_MISSING",
          "latestConfirmationTruthProjectionRef is required to enter booked.",
        );
      });
    },

    async markManaged(input) {
      return applyTransition(input, "managed", async ({ bookingCase, input }) => {
        invariant(
          optionalRef(input.appointmentRef) !== null || bookingCase.appointmentRef !== null,
          "APPOINTMENT_REF_MISSING",
          "appointmentRef is required to enter managed.",
        );
      });
    },

    async closeBookingCase(input) {
      return applyTransition(input, "closed", () => {});
    },

    async queryBookingCaseBundle(bookingCaseId) {
      const bookingCase = await repositories.getBookingCase(bookingCaseId);
      if (!bookingCase) {
        return null;
      }
      return currentBundle(bookingCase.toSnapshot());
    },
  };
}
