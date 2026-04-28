import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  createAccessGrantService,
  type AccessGrantRedemptionResult,
  type IdentityAccessDependencies,
} from "../../identity_access/src/index";

import {
  type HubCaseBundle,
  type HubCaseTransitionCommandInput,
  type HubCaseTransitionResult,
  type Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";
import {
  type CapacityRankExplanationSnapshot,
  type CapacityRankProofSnapshot,
  type CrossSiteDecisionPlanSnapshot,
  type NetworkCandidateSnapshot,
  type NetworkSlotCandidateSnapshot,
  type Phase5NetworkCapacityPipelineRepositories,
} from "./phase5-network-capacity-pipeline";
import type { HubOptionCapacityReservationBindingSnapshot } from "./phase5-hub-queue-engine";

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

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

function addMinutes(timestamp: string, minutes: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + minutes * 60_000);
  return date.toISOString();
}

function deriveIdentityBindingRef(subjectBindingVersionRef: string | null): string | null {
  if (!subjectBindingVersionRef) {
    return null;
  }
  const atIndex = subjectBindingVersionRef.indexOf("@");
  return atIndex >= 0 ? subjectBindingVersionRef.slice(0, atIndex) : subjectBindingVersionRef;
}

function localDayBucket(startAt: string, timezone: string): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(startAt));
  return formatted.replace(/\//g, "-");
}

function bucketKeyForCandidate(candidate: NetworkSlotCandidateSnapshot): string {
  return `${candidate.siteId}::${localDayBucket(candidate.startAt, candidate.timezone)}::${candidate.modality}`;
}

function candidateLabel(candidate: NetworkSlotCandidateSnapshot): string {
  const site = candidate.siteLabel ?? candidate.siteId;
  return `${site} at ${candidate.startAt} (${candidate.modality.replace(/_/g, " ")})`;
}

function computeTruthTupleHash(
  snapshot: Omit<HubOfferToConfirmationTruthProjectionSnapshot, "truthTupleHash"> & {
    truthTupleHash?: string;
  },
): string {
  return sha256Hex(
    stableStringify({
      offerSessionRef: snapshot.offerSessionRef,
      selectedCandidateRef: snapshot.selectedCandidateRef,
      fallbackCardRef: snapshot.fallbackCardRef,
      offerSetHash: snapshot.offerSetHash,
      offerState: snapshot.offerState,
      offerActionabilityState: snapshot.offerActionabilityState,
      fallbackLinkState: snapshot.fallbackLinkState,
      patientVisibilityState: snapshot.patientVisibilityState,
      practiceVisibilityState: snapshot.practiceVisibilityState,
      closureState: snapshot.closureState,
      latestRegenerationSettlementRef: snapshot.latestRegenerationSettlementRef,
      currentAckGeneration: snapshot.practiceAckGeneration,
      policyTupleHash: snapshot.policyTupleHash,
      monotoneRevision: snapshot.monotoneRevision,
    }),
  );
}

const DEFAULT_SOURCE_REFS = [
  "blueprint/phase-5-the-network-horizon.md#5E. Alternative offers, patient choice, and network-facing UX",
  "blueprint/phase-cards.md#Card-6",
  "blueprint/phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm",
  "blueprint/callback-and-clinician-messaging-loop.md",
  "docs/api/311_phase5_hub_route_and_command_contract.md",
  "docs/api/313_phase5_commit_and_practice_visibility_api_contract.md",
  "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
].sort();

export const alternativeOfferRecommendationStates = ["recommended", "neutral"] as const;
export type AlternativeOfferRecommendationState =
  (typeof alternativeOfferRecommendationStates)[number];

export const alternativeOfferCoverageRoles = [
  "primary_bucket",
  "diversity_fill",
  "last_safe_extra",
] as const;
export type AlternativeOfferCoverageRole = (typeof alternativeOfferCoverageRoles)[number];

export const alternativeOfferRedundancyPenaltyClasses = ["none", "low", "high"] as const;
export type AlternativeOfferRedundancyPenaltyClass =
  (typeof alternativeOfferRedundancyPenaltyClasses)[number];

export const alternativeOfferEntrySelectionStates = [
  "available",
  "selected",
  "declined",
  "expired",
  "superseded",
  "read_only_provenance",
] as const;
export type AlternativeOfferEntrySelectionState =
  (typeof alternativeOfferEntrySelectionStates)[number];

export const alternativeOfferOpenChoiceStates = [
  "full_set_visible",
  "callback_only",
  "read_only_provenance",
] as const;
export type AlternativeOfferOpenChoiceState = (typeof alternativeOfferOpenChoiceStates)[number];

export const alternativeOfferPatientChoiceStates = [
  "prepared",
  "delivered",
  "opened",
  "selected",
  "declined",
  "callback_requested",
  "expired",
  "superseded",
  "recovery_only",
] as const;
export type AlternativeOfferPatientChoiceState =
  (typeof alternativeOfferPatientChoiceStates)[number];

export const alternativeOfferCallbackStates = [
  "hidden",
  "available",
  "selected",
  "transferred",
  "blocked",
] as const;
export type AlternativeOfferCallbackState = (typeof alternativeOfferCallbackStates)[number];

export const alternativeOfferOfferModes = [
  "patient_secure_link",
  "staff_read_back",
  "callback_recovery_only",
] as const;
export type AlternativeOfferOfferMode = (typeof alternativeOfferOfferModes)[number];

export const alternativeOfferConfidenceBands = ["high", "medium", "low"] as const;
export type AlternativeOfferConfidenceBand = (typeof alternativeOfferConfidenceBands)[number];

export const alternativeOfferFallbackCardTypes = [
  "callback",
  "outside_window_explanation",
] as const;
export type AlternativeOfferFallbackCardType =
  (typeof alternativeOfferFallbackCardTypes)[number];

export const alternativeOfferFallbackEligibilityStates = [
  "hidden",
  "visible",
  "selected",
  "transferred",
  "blocked",
  "read_only_provenance",
] as const;
export type AlternativeOfferFallbackEligibilityState =
  (typeof alternativeOfferFallbackEligibilityStates)[number];

export const alternativeOfferRegenerationTriggerClasses = [
  "expiry",
  "candidate_snapshot_superseded",
  "subject_binding_drift",
  "publication_drift",
  "embedded_drift",
  "continuity_drift",
  "callback_linkage_change",
] as const;
export type AlternativeOfferRegenerationTriggerClass =
  (typeof alternativeOfferRegenerationTriggerClasses)[number];

export const alternativeOfferRegenerationResultStates = [
  "regenerated_in_shell",
  "read_only_provenance",
  "callback_only_recovery",
  "escalated_back",
  "blocked",
] as const;
export type AlternativeOfferRegenerationResultState =
  (typeof alternativeOfferRegenerationResultStates)[number];

export const alternativeOfferChannelReleaseFreezeStates = [
  "monitoring",
  "frozen",
  "kill_switch_active",
  "rollback_recommended",
  "released",
] as const;
export type AlternativeOfferChannelReleaseFreezeState =
  (typeof alternativeOfferChannelReleaseFreezeStates)[number];

export const offerProjectionSelectionSources = [
  "direct_candidate",
  "alternative_offer",
  "assisted_read_back",
  "imported_confirmation",
  "callback_fallback",
  "return_to_practice",
] as const;
export type OfferProjectionSelectionSource = (typeof offerProjectionSelectionSources)[number];

export const hubOfferProjectionOfferStates = [
  "not_used",
  "prepared",
  "delivered",
  "patient_choice_pending",
  "selected",
  "declined",
  "expired",
  "superseded",
] as const;
export type HubOfferProjectionOfferState = (typeof hubOfferProjectionOfferStates)[number];

export const hubOfferProjectionActionabilityStates = [
  "live_open_choice",
  "read_only_provenance",
  "fallback_only",
  "blocked",
] as const;
export type HubOfferProjectionActionabilityState =
  (typeof hubOfferProjectionActionabilityStates)[number];

export const hubOfferProjectionFallbackLinkStates = [
  "none",
  "callback_pending_link",
  "callback_linked",
  "return_pending_link",
  "return_linked",
] as const;
export type HubOfferProjectionFallbackLinkState =
  (typeof hubOfferProjectionFallbackLinkStates)[number];

export const hubOfferProjectionConfirmationTruthStates = [
  "no_commit",
  "candidate_revalidating",
  "native_booking_pending",
  "confirmation_pending",
  "confirmed_pending_practice_ack",
  "confirmed",
  "disputed",
  "expired",
  "blocked_by_drift",
  "superseded",
] as const;
export type HubOfferProjectionConfirmationTruthState =
  (typeof hubOfferProjectionConfirmationTruthStates)[number];

export const hubOfferProjectionPatientVisibilityStates = [
  "choice_visible",
  "provisional_receipt",
  "confirmed_visible",
  "fallback_visible",
  "recovery_required",
] as const;
export type HubOfferProjectionPatientVisibilityState =
  (typeof hubOfferProjectionPatientVisibilityStates)[number];

export const hubOfferProjectionPracticeVisibilityStates = [
  "not_started",
  "continuity_pending",
  "ack_pending",
  "acknowledged",
  "exception_granted",
  "recovery_required",
] as const;
export type HubOfferProjectionPracticeVisibilityState =
  (typeof hubOfferProjectionPracticeVisibilityStates)[number];

export const hubOfferProjectionClosureStates = [
  "blocked_by_offer",
  "blocked_by_confirmation",
  "blocked_by_practice_visibility",
  "blocked_by_fallback_linkage",
  "blocked_by_supplier_drift",
  "closable",
] as const;
export type HubOfferProjectionClosureState = (typeof hubOfferProjectionClosureStates)[number];

export const offerSelectionEventTypes = [
  "offer_created",
  "offer_delivered",
  "offer_opened",
  "offer_accepted",
  "offer_declined",
  "callback_requested",
  "read_back_recorded",
  "offer_regenerated",
] as const;
export type OfferSelectionEventType = (typeof offerSelectionEventTypes)[number];

export interface AlternativeOfferExcludedCandidateSnapshot {
  candidateRef: string;
  reasonCode: string;
  bucketKey: string;
  sourceTrustState: NetworkSlotCandidateSnapshot["sourceTrustState"];
  offerabilityState: NetworkSlotCandidateSnapshot["offerabilityState"];
  marginalUtilityDelta: number;
}

export interface AlternativeOfferOptimisationPlanSnapshot {
  alternativeOfferOptimisationPlanId: string;
  hubCoordinationCaseId: string;
  candidateSnapshotRef: string;
  decisionPlanRef: string;
  capacityRankProofRef: string;
  rankPlanVersionRef: string;
  policyTupleHash: string;
  maxOfferCount: number;
  lambdaDiversity: number;
  lambdaRedundancy: number;
  eligibleCandidateRefs: readonly string[];
  visibleCandidateRefs: readonly string[];
  representedBucketKeys: readonly string[];
  excludedCandidates: readonly AlternativeOfferExcludedCandidateSnapshot[];
  callbackFallbackEligible: boolean;
  callbackFallbackReasonRefs: readonly string[];
  outsideWindowExplanationEligible: boolean;
  offerSetHash: string;
  objectiveScore: number;
  generatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferEntrySnapshot {
  alternativeOfferEntryId: string;
  alternativeOfferSessionId: string;
  hubCoordinationCaseId: string;
  candidateRef: string;
  slotCandidateRef: string;
  capacityUnitRef: string;
  siteId: string;
  localDayBucket: string;
  modality: string;
  capacityRankExplanationRef: string;
  rankOrdinal: number;
  bucketKey: string;
  coverageRole: AlternativeOfferCoverageRole;
  redundancyPenaltyClass: AlternativeOfferRedundancyPenaltyClass;
  recommendationState: AlternativeOfferRecommendationState;
  selectionState: AlternativeOfferEntrySelectionState;
  availabilityWindowStartAt: string;
  availabilityWindowEndAt: string;
  patientFacingLabel: string;
  patientReasonCueRefs: readonly string[];
  staffReasonCueRefs: readonly string[];
  routeFamilyRef: string;
  truthTupleHash: string;
  policyTupleHash: string;
  generatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferFallbackCardSnapshot {
  alternativeOfferFallbackCardId: string;
  offerSessionRef: string;
  hubCoordinationCaseId: string;
  cardType: AlternativeOfferFallbackCardType;
  sourceFallbackRef: string | null;
  displayPlacement: "after_ranked_offers";
  eligibilityState: AlternativeOfferFallbackEligibilityState;
  reasonCodeRefs: readonly string[];
  leadTimeConstraintRef: string | null;
  dominantActionRef: string;
  generatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferSessionSnapshot {
  alternativeOfferSessionId: string;
  hubCoordinationCaseId: string;
  candidateSnapshotRef: string;
  candidateRefs: readonly string[];
  optimisationPlanRef: string;
  offerEntryRefs: readonly string[];
  fallbackCardRef: string | null;
  rankPlanVersionRef: string;
  capacityRankProofRef: string;
  rankDisclosurePolicyRef: string;
  rankDisclosureMode: "recommended_open_choice";
  visibleOfferSetHash: string;
  offerSetHash: string;
  openChoiceState: AlternativeOfferOpenChoiceState;
  offerMode: AlternativeOfferOfferMode;
  patientChoiceState: AlternativeOfferPatientChoiceState;
  callbackOfferState: AlternativeOfferCallbackState;
  accessGrantRef: string;
  subjectRef: string;
  routeIntentRef: string;
  routeFamilyRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef: string | null;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: AlternativeOfferChannelReleaseFreezeState;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  transitionEnvelopeRef: string;
  experienceContinuityEvidenceRef: string;
  releaseRecoveryDispositionRef: string;
  truthProjectionRef: string;
  truthTupleHash: string;
  policyTupleHash: string;
  visibilityEnvelopeVersionRef: string;
  offerFenceEpoch: number;
  sameShellContinuationRef: string;
  patientChoiceDeadlineAt: string;
  expiresAt: string;
  selectedCandidateRef: string | null;
  latestRegenerationSettlementRef: string | null;
  supersededByOfferSessionRef: string | null;
  supersededAt: string | null;
  stateConfidenceBand: AlternativeOfferConfidenceBand;
  causalToken: string;
  monotoneRevision: number;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferRegenerationSettlementSnapshot {
  alternativeOfferRegenerationSettlementId: string;
  hubCoordinationCaseId: string;
  previousOfferSessionRef: string;
  nextOfferSessionRef: string | null;
  previousOfferSetHash: string;
  nextOfferSetHash: string | null;
  triggerClass: AlternativeOfferRegenerationTriggerClass;
  preservedSelectedAnchorRef: string;
  preservedSelectedAnchorTupleHashRef: string;
  preservedOfferEntryRefs: readonly string[];
  preservedFallbackCardRef: string | null;
  resultState: AlternativeOfferRegenerationResultState;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubOfferToConfirmationTruthProjectionSnapshot {
  hubOfferToConfirmationTruthProjectionId: string;
  hubCoordinationCaseId: string;
  selectionSource: OfferProjectionSelectionSource;
  candidateSnapshotRef: string | null;
  selectedCandidateRef: string | null;
  selectedCandidateSourceVersion: string | null;
  selectedCapacityUnitRef: string | null;
  offerSessionRef: string | null;
  offerOptimisationPlanRef: string | null;
  fallbackCardRef: string | null;
  offerSetHash: string | null;
  offerSessionRevision: number;
  offerExpiryAt: string | null;
  offerState: HubOfferProjectionOfferState;
  offerActionabilityState: HubOfferProjectionActionabilityState;
  latestRegenerationSettlementRef: string | null;
  commitAttemptRef: string | null;
  bookingEvidenceRef: string | null;
  confirmationGateRef: string | null;
  hubAppointmentId: string | null;
  practiceAcknowledgementRef: string | null;
  practiceAckGeneration: number;
  fallbackRef: string | null;
  fallbackLinkState: HubOfferProjectionFallbackLinkState;
  confirmationTruthState: HubOfferProjectionConfirmationTruthState;
  patientVisibilityState: HubOfferProjectionPatientVisibilityState;
  practiceVisibilityState: HubOfferProjectionPracticeVisibilityState;
  closureState: HubOfferProjectionClosureState;
  experienceContinuityEvidenceRef: string | null;
  policyTupleHash: string;
  truthTupleHash: string;
  blockingRefs: readonly string[];
  causalToken: string;
  monotoneRevision: number;
  generatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface OfferSecureLinkBindingSnapshot {
  offerSecureLinkBindingId: string;
  hubCoordinationCaseId: string;
  offerSessionRef: string;
  accessGrantRef: string;
  governingObjectRef: string;
  governingVersionRef: string;
  routeFamilyRef: string;
  routeIntentRef: string;
  tokenKeyVersionRef: string;
  validatorVersionRef: string;
  transportClass: "url_query";
  subjectRef: string;
  boundPatientRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef: string | null;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: AlternativeOfferChannelReleaseFreezeState;
  visibilityEnvelopeVersionRef: string;
  visibleOfferSetHash: string;
  truthTupleHash: string;
  offerFenceEpoch: number;
  recoveryRouteRef: string;
  createdAt: string;
  expiresAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferSelectionEventSnapshot {
  alternativeOfferSelectionEventId: string;
  hubCoordinationCaseId: string;
  offerSessionRef: string;
  offerEntryRef: string | null;
  fallbackCardRef: string | null;
  eventType: OfferSelectionEventType;
  actorRef: string;
  actorKind: "patient" | "hub_staff";
  decisionReasonRefs: readonly string[];
  truthTupleHash: string;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferReadBackCaptureSnapshot {
  alternativeOfferReadBackCaptureId: string;
  hubCoordinationCaseId: string;
  offerSessionRef: string;
  selectedOfferEntryRef: string | null;
  selectedFallbackCardRef: string | null;
  spokenSummary: string;
  confirmedSubjectRef: string;
  callerRelationship: string;
  confirmationPhrase: string;
  decision: "accept" | "decline" | "callback_request";
  capturedBy: string;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface AlternativeOfferReplayFixtureSnapshot {
  alternativeOfferReplayFixtureId: string;
  hubCoordinationCaseId: string;
  offerSessionRef: string;
  optimisationPlanRef: string;
  candidateSnapshotRef: string;
  decisionPlanRef: string;
  capacityRankProofRef: string;
  visibleCandidateRefs: readonly string[];
  representedBucketKeys: readonly string[];
  offerSetHash: string;
  policyTupleHash: string;
  recordedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface SolveAlternativeOfferSetInput {
  hubCoordinationCaseId: string;
  candidateSnapshot: NetworkCandidateSnapshot;
  decisionPlan: CrossSiteDecisionPlanSnapshot;
  rankProof: CapacityRankProofSnapshot;
  candidates: readonly NetworkSlotCandidateSnapshot[];
  generatedAt: string;
  maxOfferCount?: number;
  lambdaDiversity?: number;
  lambdaRedundancy?: number;
}

export interface SolveAlternativeOfferSetResult {
  visibleCandidates: readonly NetworkSlotCandidateSnapshot[];
  representedBucketKeys: readonly string[];
  excludedCandidates: readonly AlternativeOfferExcludedCandidateSnapshot[];
  callbackFallbackEligible: boolean;
  callbackFallbackReasonRefs: readonly string[];
  outsideWindowExplanationEligible: boolean;
  offerSetHash: string;
  objectiveScore: number;
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

export interface Phase5AlternativeOfferEngineRepositories {
  getOptimisationPlan(
    alternativeOfferOptimisationPlanId: string,
  ): Promise<SnapshotDocument<AlternativeOfferOptimisationPlanSnapshot> | null>;
  saveOptimisationPlan(
    snapshot: AlternativeOfferOptimisationPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listOptimisationPlansForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<AlternativeOfferOptimisationPlanSnapshot>[]>;
  getSession(
    alternativeOfferSessionId: string,
  ): Promise<SnapshotDocument<AlternativeOfferSessionSnapshot> | null>;
  saveSession(
    snapshot: AlternativeOfferSessionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSessionsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<AlternativeOfferSessionSnapshot>[]>;
  getCurrentSessionForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<AlternativeOfferSessionSnapshot> | null>;
  getEntry(
    alternativeOfferEntryId: string,
  ): Promise<SnapshotDocument<AlternativeOfferEntrySnapshot> | null>;
  saveEntry(
    snapshot: AlternativeOfferEntrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listEntriesForSession(
    alternativeOfferSessionId: string,
  ): Promise<readonly SnapshotDocument<AlternativeOfferEntrySnapshot>[]>;
  getFallbackCard(
    alternativeOfferFallbackCardId: string,
  ): Promise<SnapshotDocument<AlternativeOfferFallbackCardSnapshot> | null>;
  getFallbackCardForSession(
    alternativeOfferSessionId: string,
  ): Promise<SnapshotDocument<AlternativeOfferFallbackCardSnapshot> | null>;
  saveFallbackCard(
    snapshot: AlternativeOfferFallbackCardSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getRegenerationSettlement(
    alternativeOfferRegenerationSettlementId: string,
  ): Promise<SnapshotDocument<AlternativeOfferRegenerationSettlementSnapshot> | null>;
  saveRegenerationSettlement(
    snapshot: AlternativeOfferRegenerationSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRegenerationSettlementsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<AlternativeOfferRegenerationSettlementSnapshot>[]>;
  getTruthProjectionForCase(
    hubCoordinationCaseId: string,
  ): Promise<SnapshotDocument<HubOfferToConfirmationTruthProjectionSnapshot> | null>;
  saveTruthProjection(
    snapshot: HubOfferToConfirmationTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getSecureLinkBindingByAccessGrantRef(
    accessGrantRef: string,
  ): Promise<SnapshotDocument<OfferSecureLinkBindingSnapshot> | null>;
  getSecureLinkBindingForSession(
    alternativeOfferSessionId: string,
  ): Promise<SnapshotDocument<OfferSecureLinkBindingSnapshot> | null>;
  saveSecureLinkBinding(
    snapshot: OfferSecureLinkBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendSelectionEvent(snapshot: AlternativeOfferSelectionEventSnapshot): Promise<void>;
  listSelectionEventsForSession(
    alternativeOfferSessionId: string,
  ): Promise<readonly SnapshotDocument<AlternativeOfferSelectionEventSnapshot>[]>;
  saveReadBackCapture(
    snapshot: AlternativeOfferReadBackCaptureSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReadBackCapturesForSession(
    alternativeOfferSessionId: string,
  ): Promise<readonly SnapshotDocument<AlternativeOfferReadBackCaptureSnapshot>[]>;
  saveReplayFixture(
    snapshot: AlternativeOfferReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReplayFixtureForSession(
    alternativeOfferSessionId: string,
  ): Promise<SnapshotDocument<AlternativeOfferReplayFixtureSnapshot> | null>;
}

export class Phase5AlternativeOfferEngineStore
  implements Phase5AlternativeOfferEngineRepositories
{
  private readonly plans = new Map<string, AlternativeOfferOptimisationPlanSnapshot>();
  private readonly casePlans = new Map<string, string[]>();
  private readonly sessions = new Map<string, AlternativeOfferSessionSnapshot>();
  private readonly caseSessions = new Map<string, string[]>();
  private readonly caseCurrentSession = new Map<string, string>();
  private readonly entries = new Map<string, AlternativeOfferEntrySnapshot>();
  private readonly sessionEntries = new Map<string, string[]>();
  private readonly fallbackCards = new Map<string, AlternativeOfferFallbackCardSnapshot>();
  private readonly sessionFallbackCards = new Map<string, string>();
  private readonly settlements = new Map<string, AlternativeOfferRegenerationSettlementSnapshot>();
  private readonly caseSettlements = new Map<string, string[]>();
  private readonly truthByCase = new Map<string, HubOfferToConfirmationTruthProjectionSnapshot>();
  private readonly secureLinks = new Map<string, OfferSecureLinkBindingSnapshot>();
  private readonly secureLinkByGrantRef = new Map<string, string>();
  private readonly secureLinkBySession = new Map<string, string>();
  private readonly selectionEvents = new Map<string, AlternativeOfferSelectionEventSnapshot[]>();
  private readonly readBackCaptures = new Map<string, AlternativeOfferReadBackCaptureSnapshot[]>();
  private readonly replayFixtures = new Map<string, AlternativeOfferReplayFixtureSnapshot>();
  private readonly replayBySession = new Map<string, string>();

  async getOptimisationPlan(alternativeOfferOptimisationPlanId: string) {
    const row = this.plans.get(alternativeOfferOptimisationPlanId);
    return row ? new StoredDocument(row) : null;
  }

  async saveOptimisationPlan(
    snapshot: AlternativeOfferOptimisationPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.plans, snapshot.alternativeOfferOptimisationPlanId, snapshot, options);
    const current = this.casePlans.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.alternativeOfferOptimisationPlanId)) {
      this.casePlans.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.alternativeOfferOptimisationPlanId,
      ]);
    }
  }

  async listOptimisationPlansForCase(hubCoordinationCaseId: string) {
    return (this.casePlans.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.plans.get(id))
      .filter((value): value is AlternativeOfferOptimisationPlanSnapshot => value !== undefined)
      .map((value) => new StoredDocument(value));
  }

  async getSession(alternativeOfferSessionId: string) {
    const row = this.sessions.get(alternativeOfferSessionId);
    return row ? new StoredDocument(row) : null;
  }

  async saveSession(snapshot: AlternativeOfferSessionSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.sessions, snapshot.alternativeOfferSessionId, snapshot, options);
    const current = this.caseSessions.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.alternativeOfferSessionId)) {
      this.caseSessions.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.alternativeOfferSessionId,
      ]);
    }
    this.caseCurrentSession.set(snapshot.hubCoordinationCaseId, snapshot.alternativeOfferSessionId);
  }

  async listSessionsForCase(hubCoordinationCaseId: string) {
    return (this.caseSessions.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.sessions.get(id))
      .filter((value): value is AlternativeOfferSessionSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.expiresAt, right.expiresAt))
      .map((value) => new StoredDocument(value));
  }

  async getCurrentSessionForCase(hubCoordinationCaseId: string) {
    const sessionId = this.caseCurrentSession.get(hubCoordinationCaseId);
    return sessionId ? this.getSession(sessionId) : null;
  }

  async getEntry(alternativeOfferEntryId: string) {
    const row = this.entries.get(alternativeOfferEntryId);
    return row ? new StoredDocument(row) : null;
  }

  async saveEntry(snapshot: AlternativeOfferEntrySnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.entries, snapshot.alternativeOfferEntryId, snapshot, options);
    const current = this.sessionEntries.get(snapshot.alternativeOfferSessionId) ?? [];
    if (!current.includes(snapshot.alternativeOfferEntryId)) {
      this.sessionEntries.set(snapshot.alternativeOfferSessionId, [
        ...current,
        snapshot.alternativeOfferEntryId,
      ]);
    }
  }

  async listEntriesForSession(alternativeOfferSessionId: string) {
    return (this.sessionEntries.get(alternativeOfferSessionId) ?? [])
      .map((id) => this.entries.get(id))
      .filter((value): value is AlternativeOfferEntrySnapshot => value !== undefined)
      .sort((left, right) => left.rankOrdinal - right.rankOrdinal)
      .map((value) => new StoredDocument(value));
  }

  async getFallbackCard(alternativeOfferFallbackCardId: string) {
    const row = this.fallbackCards.get(alternativeOfferFallbackCardId);
    return row ? new StoredDocument(row) : null;
  }

  async getFallbackCardForSession(alternativeOfferSessionId: string) {
    const fallbackId = this.sessionFallbackCards.get(alternativeOfferSessionId);
    return fallbackId ? this.getFallbackCard(fallbackId) : null;
  }

  async saveFallbackCard(
    snapshot: AlternativeOfferFallbackCardSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.fallbackCards, snapshot.alternativeOfferFallbackCardId, snapshot, options);
    this.sessionFallbackCards.set(snapshot.offerSessionRef, snapshot.alternativeOfferFallbackCardId);
  }

  async getRegenerationSettlement(alternativeOfferRegenerationSettlementId: string) {
    const row = this.settlements.get(alternativeOfferRegenerationSettlementId);
    return row ? new StoredDocument(row) : null;
  }

  async saveRegenerationSettlement(
    snapshot: AlternativeOfferRegenerationSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.settlements,
      snapshot.alternativeOfferRegenerationSettlementId,
      snapshot,
      options,
    );
    const current = this.caseSettlements.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!current.includes(snapshot.alternativeOfferRegenerationSettlementId)) {
      this.caseSettlements.set(snapshot.hubCoordinationCaseId, [
        ...current,
        snapshot.alternativeOfferRegenerationSettlementId,
      ]);
    }
  }

  async listRegenerationSettlementsForCase(hubCoordinationCaseId: string) {
    return (this.caseSettlements.get(hubCoordinationCaseId) ?? [])
      .map((id) => this.settlements.get(id))
      .filter((value): value is AlternativeOfferRegenerationSettlementSnapshot => value !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((value) => new StoredDocument(value));
  }

  async getTruthProjectionForCase(hubCoordinationCaseId: string) {
    const row = this.truthByCase.get(hubCoordinationCaseId);
    return row ? new StoredDocument(row) : null;
  }

  async saveTruthProjection(
    snapshot: HubOfferToConfirmationTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    const key = snapshot.hubCoordinationCaseId;
    const current = this.truthByCase.get(key);
    if (options?.expectedVersion !== undefined) {
      invariant(
        current?.version === options.expectedVersion,
        "OPTIMISTIC_CONCURRENCY_MISMATCH",
        `Expected version ${options.expectedVersion} for truth projection ${key}.`,
      );
    } else if (current) {
      invariant(current.version < snapshot.version, "NON_MONOTONE_SAVE", "Truth version must increase.");
    }
    this.truthByCase.set(key, structuredClone(snapshot));
  }

  async getSecureLinkBindingByAccessGrantRef(accessGrantRef: string) {
    const bindingId = this.secureLinkByGrantRef.get(accessGrantRef);
    return bindingId ? new StoredDocument(this.secureLinks.get(bindingId)!) : null;
  }

  async getSecureLinkBindingForSession(alternativeOfferSessionId: string) {
    const bindingId = this.secureLinkBySession.get(alternativeOfferSessionId);
    return bindingId ? new StoredDocument(this.secureLinks.get(bindingId)!) : null;
  }

  async saveSecureLinkBinding(
    snapshot: OfferSecureLinkBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.secureLinks, snapshot.offerSecureLinkBindingId, snapshot, options);
    this.secureLinkByGrantRef.set(snapshot.accessGrantRef, snapshot.offerSecureLinkBindingId);
    this.secureLinkBySession.set(snapshot.offerSessionRef, snapshot.offerSecureLinkBindingId);
  }

  async appendSelectionEvent(snapshot: AlternativeOfferSelectionEventSnapshot) {
    const current = this.selectionEvents.get(snapshot.offerSessionRef) ?? [];
    this.selectionEvents.set(snapshot.offerSessionRef, [...current, structuredClone(snapshot)]);
  }

  async listSelectionEventsForSession(alternativeOfferSessionId: string) {
    return (this.selectionEvents.get(alternativeOfferSessionId) ?? [])
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((value) => new StoredDocument(value));
  }

  async saveReadBackCapture(
    snapshot: AlternativeOfferReadBackCaptureSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    const current = this.readBackCaptures.get(snapshot.offerSessionRef) ?? [];
    if (options?.expectedVersion !== undefined) {
      const existing = current.find(
        (entry) => entry.alternativeOfferReadBackCaptureId === snapshot.alternativeOfferReadBackCaptureId,
      );
      invariant(
        existing?.version === options.expectedVersion,
        "OPTIMISTIC_CONCURRENCY_MISMATCH",
        `Expected version ${options.expectedVersion} for read-back capture ${snapshot.alternativeOfferReadBackCaptureId}.`,
      );
    }
    const withoutCurrent = current.filter(
      (entry) => entry.alternativeOfferReadBackCaptureId !== snapshot.alternativeOfferReadBackCaptureId,
    );
    this.readBackCaptures.set(snapshot.offerSessionRef, [...withoutCurrent, structuredClone(snapshot)]);
  }

  async listReadBackCapturesForSession(alternativeOfferSessionId: string) {
    return (this.readBackCaptures.get(alternativeOfferSessionId) ?? [])
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((value) => new StoredDocument(value));
  }

  async saveReplayFixture(
    snapshot: AlternativeOfferReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.replayFixtures, snapshot.alternativeOfferReplayFixtureId, snapshot, options);
    this.replayBySession.set(snapshot.offerSessionRef, snapshot.alternativeOfferReplayFixtureId);
  }

  async getReplayFixtureForSession(alternativeOfferSessionId: string) {
    const fixtureId = this.replayBySession.get(alternativeOfferSessionId);
    return fixtureId ? new StoredDocument(this.replayFixtures.get(fixtureId)!) : null;
  }
}

export function createPhase5AlternativeOfferEngineStore(): Phase5AlternativeOfferEngineStore {
  return new Phase5AlternativeOfferEngineStore();
}

function candidateById(
  candidates: readonly NetworkSlotCandidateSnapshot[],
): Map<string, NetworkSlotCandidateSnapshot> {
  return new Map(candidates.map((candidate) => [candidate.candidateId, candidate]));
}

function rankExplanationByCandidate(
  explanations: readonly CapacityRankExplanationSnapshot[],
): Map<string, CapacityRankExplanationSnapshot> {
  return new Map(explanations.map((entry) => [entry.candidateRef, entry]));
}

export function solveAlternativeOfferSet(
  input: SolveAlternativeOfferSetInput,
): SolveAlternativeOfferSetResult {
  const maxOfferCount = ensurePositiveInteger(input.maxOfferCount ?? 3, "maxOfferCount");
  const lambdaDiversity = input.lambdaDiversity ?? 0.2;
  const lambdaRedundancy = input.lambdaRedundancy ?? 0.12;
  const candidatesById = candidateById(input.candidates);
  const patientOfferableSet = new Set(input.decisionPlan.patientOfferableFrontierRefs);
  const visible: NetworkSlotCandidateSnapshot[] = [];
  const excluded: AlternativeOfferExcludedCandidateSnapshot[] = [];
  const usedCapacityUnits = new Set<string>();
  const representedBuckets = new Set<string>();

  for (const candidateRef of input.rankProof.orderedCandidateRefs) {
    const candidate = candidatesById.get(candidateRef);
    if (!candidate) {
      continue;
    }
    const bucketKey = bucketKeyForCandidate(candidate);
    let reasonCode: string | null = null;

    if (!patientOfferableSet.has(candidateRef)) {
      reasonCode = "NOT_ON_PATIENT_FRONTIER";
    } else if (candidate.windowClass < 1) {
      reasonCode = "OUTSIDE_REQUIRED_WINDOW";
    } else if (candidate.sourceTrustState !== "trusted") {
      reasonCode = "SOURCE_NOT_TRUSTED";
    } else if (candidate.offerabilityState !== "patient_offerable") {
      reasonCode = "NOT_PATIENT_OFFERABLE";
    } else if (usedCapacityUnits.has(candidate.capacityUnitRef)) {
      reasonCode = "DUPLICATE_CAPACITY_UNIT";
    } else if (representedBuckets.has(bucketKey) && representedBuckets.size >= Math.min(maxOfferCount, patientOfferableSet.size)) {
      reasonCode = "DUPLICATE_BUCKET";
    }

    if (reasonCode) {
      excluded.push({
        candidateRef,
        reasonCode,
        bucketKey,
        sourceTrustState: candidate.sourceTrustState,
        offerabilityState: candidate.offerabilityState,
        marginalUtilityDelta: Math.round((candidate.robustFit - lambdaRedundancy) * 1_000_000) / 1_000_000,
      });
      continue;
    }

    visible.push(candidate);
    usedCapacityUnits.add(candidate.capacityUnitRef);
    representedBuckets.add(bucketKey);
    if (visible.length >= maxOfferCount) {
      break;
    }
  }

  if (visible.length < maxOfferCount) {
    for (const candidateRef of input.rankProof.orderedCandidateRefs) {
      if (visible.length >= maxOfferCount) {
        break;
      }
      if (visible.some((entry) => entry.candidateId === candidateRef)) {
        continue;
      }
      const candidate = candidatesById.get(candidateRef);
      if (!candidate) {
        continue;
      }
      if (
        !patientOfferableSet.has(candidateRef) ||
        candidate.windowClass < 1 ||
        candidate.sourceTrustState !== "trusted" ||
        candidate.offerabilityState !== "patient_offerable" ||
        usedCapacityUnits.has(candidate.capacityUnitRef)
      ) {
        continue;
      }
      visible.push(candidate);
      usedCapacityUnits.add(candidate.capacityUnitRef);
      representedBuckets.add(bucketKeyForCandidate(candidate));
    }
  }

  const offerSetHash = sha256Hex(
    stableStringify({
      snapshotId: input.candidateSnapshot.snapshotId,
      orderedCandidateRefs: visible.map((candidate) => candidate.candidateId),
      policyTupleHash: input.candidateSnapshot.policyTupleHash,
      rankProofRef: input.rankProof.capacityRankProofId,
    }),
  );
  const coverage = representedBuckets.size;
  const redundancyPenalty = visible.length - coverage;
  const robustFitSum = visible.reduce((sum, candidate) => sum + candidate.robustFit, 0);
  const objectiveScore = Math.round(
    (robustFitSum + lambdaDiversity * coverage - lambdaRedundancy * redundancyPenalty) * 1_000_000,
  ) / 1_000_000;

  return {
    visibleCandidates: visible,
    representedBucketKeys: [...representedBuckets],
    excludedCandidates: excluded,
    callbackFallbackEligible: input.decisionPlan.callbackReasoningRefs.length > 0,
    callbackFallbackReasonRefs: uniqueSortedRefs(input.decisionPlan.callbackReasoningRefs),
    outsideWindowExplanationEligible: input.decisionPlan.diagnosticOnlyRefs.length > 0,
    offerSetHash,
    objectiveScore,
  };
}

export interface OpenAlternativeOfferSessionInput {
  hubCoordinationCaseId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  subjectRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef?: string | null;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: AlternativeOfferChannelReleaseFreezeState;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  transitionEnvelopeRef: string;
  experienceContinuityEvidenceRef: string;
  releaseRecoveryDispositionRef: string;
  visibilityEnvelopeVersionRef: string;
  routeFamilyRef?: string;
  rankDisclosurePolicyRef?: string;
  tokenKeyVersionRef?: string;
  expiryMinutes?: number;
  maxOfferCount?: number;
  lineagedFenceEpoch?: number;
  callbackFallbackRef?: string | null;
  sourceRefs?: readonly string[];
}

export interface DeliverAlternativeOfferSessionInput {
  alternativeOfferSessionId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  deliveryMode?: AlternativeOfferOfferMode;
}

export interface OfferMutationFenceInput {
  subjectRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef?: string | null;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: AlternativeOfferChannelReleaseFreezeState;
  visibleOfferSetHash: string;
  truthTupleHash: string;
  offerFenceEpoch: number;
  experienceContinuityEvidenceRef: string;
  surfacePublicationRef?: string | null;
  runtimePublicationBundleRef?: string | null;
  presentedToken?: string | null;
}

export interface RedeemAlternativeOfferLinkInput extends OfferMutationFenceInput {
  alternativeOfferSessionId: string;
  recordedAt: string;
}

export interface AcceptAlternativeOfferEntryInput extends OfferMutationFenceInput {
  alternativeOfferSessionId: string;
  alternativeOfferEntryId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  reservationBinding?: HubOptionCapacityReservationBindingSnapshot | null;
  selectionSource?: OfferProjectionSelectionSource;
  skipGrantValidation?: boolean;
}

export interface DeclineAlternativeOffersInput extends OfferMutationFenceInput {
  alternativeOfferSessionId: string;
  actorRef: string;
  recordedAt: string;
  skipGrantValidation?: boolean;
}

export interface RequestCallbackFromAlternativeOfferInput extends OfferMutationFenceInput {
  alternativeOfferSessionId: string;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  activeFallbackRef?: string | null;
  callbackExpectationRef?: string | null;
  skipGrantValidation?: boolean;
}

export interface CaptureStructuredReadBackInput {
  alternativeOfferSessionId: string;
  selectedOfferEntryRef?: string | null;
  spokenSummary: string;
  confirmedSubjectRef: string;
  callerRelationship: string;
  confirmationPhrase: string;
  decision: "accept" | "decline" | "callback_request";
  capturedBy: string;
  recordedAt: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
}

export interface RegenerateAlternativeOfferSessionInput extends OpenAlternativeOfferSessionInput {
  alternativeOfferSessionId: string;
  triggerClass: AlternativeOfferRegenerationTriggerClass;
  activateImmediately?: boolean;
}

export interface ReplayAlternativeOfferSessionInput {
  alternativeOfferSessionId: string;
  replayedAt: string;
}

export interface BuildOfferOptimisationPlanResult {
  hubCaseBundle: HubCaseBundle;
  candidateSnapshot: NetworkCandidateSnapshot;
  decisionPlan: CrossSiteDecisionPlanSnapshot;
  rankProof: CapacityRankProofSnapshot;
  candidates: readonly NetworkSlotCandidateSnapshot[];
  rankExplanations: readonly CapacityRankExplanationSnapshot[];
  optimisationPlan: AlternativeOfferOptimisationPlanSnapshot;
}

export interface OpenAlternativeOfferSessionResult extends BuildOfferOptimisationPlanResult {
  session: AlternativeOfferSessionSnapshot;
  entries: readonly AlternativeOfferEntrySnapshot[];
  fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
  secureLinkBinding: OfferSecureLinkBindingSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  hubTransition: HubCaseTransitionResult;
  materializedToken: string | null;
  replayFixture: AlternativeOfferReplayFixtureSnapshot;
}

export interface DeliverAlternativeOfferSessionResult {
  session: AlternativeOfferSessionSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  hubTransition: HubCaseTransitionResult;
  selectionEvent: AlternativeOfferSelectionEventSnapshot;
}

export interface RedeemAlternativeOfferLinkResult {
  session: AlternativeOfferSessionSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  redemption: AccessGrantRedemptionResult;
  liveActionabilityState: HubOfferProjectionActionabilityState;
  reasonCodes: readonly string[];
  replayed: boolean;
}

export interface AcceptAlternativeOfferEntryResult {
  session: AlternativeOfferSessionSnapshot;
  entry: AlternativeOfferEntrySnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  hubTransition: HubCaseTransitionResult;
  selectionEvent: AlternativeOfferSelectionEventSnapshot;
  settlement: AlternativeOfferRegenerationSettlementSnapshot | null;
}

export interface DeclineAlternativeOffersResult {
  session: AlternativeOfferSessionSnapshot;
  entries: readonly AlternativeOfferEntrySnapshot[];
  fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  selectionEvent: AlternativeOfferSelectionEventSnapshot;
}

export interface RequestCallbackFromAlternativeOfferResult {
  session: AlternativeOfferSessionSnapshot;
  fallbackCard: AlternativeOfferFallbackCardSnapshot;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  hubTransition: HubCaseTransitionResult;
  selectionEvent: AlternativeOfferSelectionEventSnapshot;
}

export interface CaptureStructuredReadBackResult {
  readBackCapture: AlternativeOfferReadBackCaptureSnapshot;
  acceptResult: AcceptAlternativeOfferEntryResult | null;
  declineResult: DeclineAlternativeOffersResult | null;
  callbackResult: RequestCallbackFromAlternativeOfferResult | null;
}

export interface RegenerateAlternativeOfferSessionResult {
  settlement: AlternativeOfferRegenerationSettlementSnapshot;
  priorSession: AlternativeOfferSessionSnapshot;
  nextSession: AlternativeOfferSessionSnapshot | null;
  nextEntries: readonly AlternativeOfferEntrySnapshot[];
  nextFallbackCard: AlternativeOfferFallbackCardSnapshot | null;
  truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
  hubTransition: HubCaseTransitionResult | null;
}

export interface ReplayAlternativeOfferSessionResult {
  session: AlternativeOfferSessionSnapshot;
  optimisationPlan: AlternativeOfferOptimisationPlanSnapshot;
  replayFixture: AlternativeOfferReplayFixtureSnapshot;
  rerunVisibleCandidateRefs: readonly string[];
  rerunOfferSetHash: string;
  matchesStoredSession: boolean;
  mismatchFields: readonly string[];
}

export interface Phase5AlternativeOfferEngineService {
  createOfferOptimisationPlan(input: {
    hubCoordinationCaseId: string;
    recordedAt: string;
    maxOfferCount?: number;
  }): Promise<BuildOfferOptimisationPlanResult>;
  openAlternativeOfferSession(
    input: OpenAlternativeOfferSessionInput,
  ): Promise<OpenAlternativeOfferSessionResult>;
  deliverAlternativeOfferSession(
    input: DeliverAlternativeOfferSessionInput,
  ): Promise<DeliverAlternativeOfferSessionResult>;
  redeemAlternativeOfferLink(
    input: RedeemAlternativeOfferLinkInput,
  ): Promise<RedeemAlternativeOfferLinkResult>;
  acceptAlternativeOfferEntry(
    input: AcceptAlternativeOfferEntryInput,
  ): Promise<AcceptAlternativeOfferEntryResult>;
  declineAlternativeOffers(
    input: DeclineAlternativeOffersInput,
  ): Promise<DeclineAlternativeOffersResult>;
  requestCallbackFromAlternativeOffer(
    input: RequestCallbackFromAlternativeOfferInput,
  ): Promise<RequestCallbackFromAlternativeOfferResult>;
  captureStructuredReadBack(
    input: CaptureStructuredReadBackInput,
  ): Promise<CaptureStructuredReadBackResult>;
  regenerateAlternativeOfferSession(
    input: RegenerateAlternativeOfferSessionInput,
  ): Promise<RegenerateAlternativeOfferSessionResult>;
  queryCurrentTruthProjection(
    hubCoordinationCaseId: string,
  ): Promise<HubOfferToConfirmationTruthProjectionSnapshot | null>;
  replayAlternativeOfferSession(
    input: ReplayAlternativeOfferSessionInput,
  ): Promise<ReplayAlternativeOfferSessionResult>;
}

export interface CreatePhase5AlternativeOfferEngineServiceOptions {
  repositories: Phase5AlternativeOfferEngineRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  capacityRepositories: Phase5NetworkCapacityPipelineRepositories;
  identityRepositories: IdentityAccessDependencies;
  idGenerator?: BackboneIdGenerator;
}

function requireAllowedOfferStatus(hubCaseStatus: string): void {
  invariant(
    [
      "candidates_ready",
      "coordinator_selecting",
      "candidate_revalidating",
      "alternatives_offered",
      "patient_choice_pending",
    ].includes(hubCaseStatus),
    "INVALID_ALTERNATIVE_OFFER_STATUS",
    `Alternative offers may not be opened from ${hubCaseStatus}.`,
  );
}

function computeGoverningVersionRef(sessionId: string, offerSetHash: string, truthTupleHash: string): string {
  return `${sessionId}::${offerSetHash}::${truthTupleHash}`;
}

function ensureReservationStillLive(
  reservationBinding: HubOptionCapacityReservationBindingSnapshot | null | undefined,
): void {
  if (!reservationBinding) {
    return;
  }
  invariant(
    reservationBinding.reservationState !== "released" &&
      reservationBinding.reservationState !== "expired",
    "RESERVATION_TRUTH_DRIFT",
    "Reservation truth no longer supports accepting this alternative offer entry.",
  );
}

function determineTriggerFromFenceReasons(
  reasons: readonly string[],
): AlternativeOfferRegenerationTriggerClass {
  if (reasons.some((reason) => reason.includes("EXPIRY"))) {
    return "expiry";
  }
  if (
    reasons.some((reason) =>
      ["MANIFEST", "PUBLICATION", "RUNTIME_PUBLICATION"].some((fragment) => reason.includes(fragment)),
    )
  ) {
    return "publication_drift";
  }
  if (reasons.some((reason) => reason.includes("CONTINUITY"))) {
    return "continuity_drift";
  }
  if (reasons.some((reason) => reason.includes("SUBJECT"))) {
    return "subject_binding_drift";
  }
  if (reasons.some((reason) => reason.includes("SNAPSHOT") || reason.includes("OFFER_SET"))) {
    return "candidate_snapshot_superseded";
  }
  return "embedded_drift";
}

function computeActionability(
  session: AlternativeOfferSessionSnapshot,
  fallbackCard: AlternativeOfferFallbackCardSnapshot | null,
): HubOfferProjectionActionabilityState {
  if (session.patientChoiceState === "expired" || session.patientChoiceState === "superseded") {
    return "read_only_provenance";
  }
  if (
    fallbackCard &&
    fallbackCard.eligibilityState === "visible" &&
    session.openChoiceState === "callback_only"
  ) {
    return "fallback_only";
  }
  if (session.openChoiceState === "full_set_visible") {
    return "live_open_choice";
  }
  if (session.openChoiceState === "read_only_provenance") {
    return "read_only_provenance";
  }
  return "blocked";
}

function updateEntryState(
  current: AlternativeOfferEntrySnapshot,
  input: Partial<AlternativeOfferEntrySnapshot>,
): AlternativeOfferEntrySnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateFallbackState(
  current: AlternativeOfferFallbackCardSnapshot,
  input: Partial<AlternativeOfferFallbackCardSnapshot>,
): AlternativeOfferFallbackCardSnapshot {
  return {
    ...current,
    ...input,
    version: nextVersion(current.version),
  };
}

function updateSessionState(
  current: AlternativeOfferSessionSnapshot,
  input: Partial<AlternativeOfferSessionSnapshot>,
): AlternativeOfferSessionSnapshot {
  return {
    ...current,
    ...input,
    monotoneRevision: current.monotoneRevision + 1,
    version: nextVersion(current.version),
  };
}

function updateTruthProjection(
  current: HubOfferToConfirmationTruthProjectionSnapshot,
  input: Partial<HubOfferToConfirmationTruthProjectionSnapshot>,
  generatedAt: string,
): HubOfferToConfirmationTruthProjectionSnapshot {
  const nextCore = {
    ...current,
    ...input,
    generatedAt,
    monotoneRevision: current.monotoneRevision + 1,
    version: nextVersion(current.version),
  };
  return {
    ...nextCore,
    truthTupleHash: computeTruthTupleHash({
      ...nextCore,
      truthTupleHash: undefined as never,
    }),
  };
}

function baseOfferReasonCueRefs(candidate: NetworkSlotCandidateSnapshot): string[] {
  return uniqueSortedRefs([
    ...candidate.patientReasonCueRefs,
    ...candidate.staffReasonRefs,
    ...candidate.blockedByPolicyReasonRefs,
  ]);
}

async function requireSnapshot<T>(
  loader: Promise<SnapshotDocument<T> | null>,
  code: string,
  message: string,
): Promise<T> {
  const document = await loader;
  invariant(document, code, message);
  return document.toSnapshot();
}

function requireHubCaseBundle(
  hubCaseBundle: HubCaseBundle | null,
  hubCoordinationCaseId: string,
): HubCaseBundle {
  invariant(
    hubCaseBundle !== null,
    "HUB_CASE_BUNDLE_NOT_FOUND",
    `Hub case bundle ${hubCoordinationCaseId} was not found.`,
  );
  return hubCaseBundle;
}

export function createPhase5AlternativeOfferEngineService(
  options: CreatePhase5AlternativeOfferEngineServiceOptions,
): Phase5AlternativeOfferEngineService {
  const repositories = options.repositories;
  const idGenerator =
    options.idGenerator ?? createDeterministicBackboneIdGenerator("phase5_alternative_offer");
  const accessGrantService = createAccessGrantService(options.identityRepositories, idGenerator);

  async function loadPlanInputs(input: {
    hubCoordinationCaseId: string;
    recordedAt: string;
    maxOfferCount?: number;
  }): Promise<BuildOfferOptimisationPlanResult> {
    const hubCaseBundle = requireHubCaseBundle(
      await options.hubCaseService.queryHubCaseBundle(input.hubCoordinationCaseId),
      input.hubCoordinationCaseId,
    );
    requireAllowedOfferStatus(hubCaseBundle.hubCase.status);
    const candidateSnapshot = await requireSnapshot(
      options.capacityRepositories.getSnapshot(
        requireRef(hubCaseBundle.hubCase.candidateSnapshotRef, "candidateSnapshotRef"),
      ),
      "CANDIDATE_SNAPSHOT_NOT_FOUND",
      "Hub case candidateSnapshotRef is missing or unresolved.",
    );
    const decisionPlan = await requireSnapshot(
      options.capacityRepositories.getDecisionPlan(
        requireRef(hubCaseBundle.hubCase.crossSiteDecisionPlanRef, "crossSiteDecisionPlanRef"),
      ),
      "DECISION_PLAN_NOT_FOUND",
      "Hub case crossSiteDecisionPlanRef is missing or unresolved.",
    );
    invariant(
      candidateSnapshot.capacityRankProofRef,
      "CAPACITY_RANK_PROOF_REQUIRED",
      "Candidate snapshot must reference a capacity rank proof.",
    );
    const rankProof = await requireSnapshot(
      options.capacityRepositories.getRankProof(candidateSnapshot.capacityRankProofRef),
      "RANK_PROOF_NOT_FOUND",
      "Candidate snapshot rank proof is missing.",
    );
    const candidates = (
      await options.capacityRepositories.listCandidatesForSnapshot(candidateSnapshot.snapshotId)
    ).map((entry) => entry.toSnapshot());
    invariant(candidates.length > 0, "NO_CANDIDATES_AVAILABLE", "No slot candidates were found.");
    const rankExplanations = (
      await options.capacityRepositories.listRankExplanationsForSnapshot(candidateSnapshot.snapshotId)
    ).map((entry) => entry.toSnapshot());
    const solver = solveAlternativeOfferSet({
      hubCoordinationCaseId: hubCaseBundle.hubCase.hubCoordinationCaseId,
      candidateSnapshot,
      decisionPlan,
      rankProof,
      candidates,
      generatedAt: input.recordedAt,
      maxOfferCount: input.maxOfferCount,
    });
    const optimisationPlan: AlternativeOfferOptimisationPlanSnapshot = {
      alternativeOfferOptimisationPlanId: nextId(idGenerator, "alternativeOfferOptimisationPlan"),
      hubCoordinationCaseId: hubCaseBundle.hubCase.hubCoordinationCaseId,
      candidateSnapshotRef: candidateSnapshot.snapshotId,
      decisionPlanRef: decisionPlan.decisionPlanId,
      capacityRankProofRef: rankProof.capacityRankProofId,
      rankPlanVersionRef: candidateSnapshot.rankPlanVersionRef,
      policyTupleHash: candidateSnapshot.policyTupleHash,
      maxOfferCount: ensurePositiveInteger(input.maxOfferCount ?? 3, "maxOfferCount"),
      lambdaDiversity: 0.2,
      lambdaRedundancy: 0.12,
      eligibleCandidateRefs: uniqueSortedRefs(decisionPlan.patientOfferableFrontierRefs),
      visibleCandidateRefs: solver.visibleCandidates.map((candidate) => candidate.candidateId),
      representedBucketKeys: solver.representedBucketKeys,
      excludedCandidates: solver.excludedCandidates,
      callbackFallbackEligible: solver.callbackFallbackEligible,
      callbackFallbackReasonRefs: solver.callbackFallbackReasonRefs,
      outsideWindowExplanationEligible: solver.outsideWindowExplanationEligible,
      offerSetHash: solver.offerSetHash,
      objectiveScore: solver.objectiveScore,
      generatedAt: input.recordedAt,
      sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
      version: 1,
    };
    await repositories.saveOptimisationPlan(optimisationPlan);
    return {
      hubCaseBundle,
      candidateSnapshot,
      decisionPlan,
      rankProof,
      candidates,
      rankExplanations,
      optimisationPlan,
    };
  }

  async function upsertTruthProjection(input: {
    hubCaseBundle: HubCaseBundle;
    session: AlternativeOfferSessionSnapshot;
    fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
    selectionSource: OfferProjectionSelectionSource;
    offerState: HubOfferProjectionOfferState;
    fallbackLinkState: HubOfferProjectionFallbackLinkState;
    patientVisibilityState: HubOfferProjectionPatientVisibilityState;
    closureState: HubOfferProjectionClosureState;
    selectedCandidateRef?: string | null;
    selectedCapacityUnitRef?: string | null;
    latestRegenerationSettlementRef?: string | null;
    generatedAt: string;
  }): Promise<HubOfferToConfirmationTruthProjectionSnapshot> {
    const current = (
      await repositories.getTruthProjectionForCase(input.hubCaseBundle.hubCase.hubCoordinationCaseId)
    )?.toSnapshot();
    const baseActionability = computeActionability(input.session, input.fallbackCard);

    if (!current) {
      const createdCore = {
        hubOfferToConfirmationTruthProjectionId: nextId(idGenerator, "hubOfferToConfirmationTruth"),
        hubCoordinationCaseId: input.hubCaseBundle.hubCase.hubCoordinationCaseId,
        selectionSource: input.selectionSource,
        candidateSnapshotRef: input.session.candidateSnapshotRef,
        selectedCandidateRef: input.selectedCandidateRef ?? null,
        selectedCandidateSourceVersion:
          input.session.capacityRankProofRef.length > 0 ? input.session.capacityRankProofRef : null,
        selectedCapacityUnitRef: input.selectedCapacityUnitRef ?? null,
        offerSessionRef: input.session.alternativeOfferSessionId,
        offerOptimisationPlanRef: input.session.optimisationPlanRef,
        fallbackCardRef: input.fallbackCard?.alternativeOfferFallbackCardId ?? null,
        offerSetHash: input.session.visibleOfferSetHash,
        offerSessionRevision: input.session.monotoneRevision,
        offerExpiryAt: input.session.expiresAt,
        offerState: input.offerState,
        offerActionabilityState: baseActionability,
        latestRegenerationSettlementRef: input.latestRegenerationSettlementRef ?? null,
        commitAttemptRef: null,
        bookingEvidenceRef: input.hubCaseBundle.hubCase.bookingEvidenceRef,
        confirmationGateRef: null,
        hubAppointmentId: input.hubCaseBundle.hubCase.networkAppointmentRef,
        practiceAcknowledgementRef: null,
        practiceAckGeneration: input.hubCaseBundle.hubCase.practiceAckGeneration,
        fallbackRef: input.hubCaseBundle.hubCase.activeFallbackRef,
        fallbackLinkState: input.fallbackLinkState,
        confirmationTruthState: "no_commit" as const,
        patientVisibilityState: input.patientVisibilityState,
        practiceVisibilityState: "not_started" as const,
        closureState: input.closureState,
        experienceContinuityEvidenceRef: input.session.experienceContinuityEvidenceRef,
        policyTupleHash: input.session.policyTupleHash,
        blockingRefs:
          input.closureState === "closable"
            ? []
            : uniqueSortedRefs([
                input.offerState === "selected" ? "offer_selected_commit_pending" : "offer_live",
                input.fallbackLinkState === "callback_pending_link" ? "callback_linkage_pending" : "",
              ]),
        causalToken: nextId(idGenerator, "hubOfferTruthCausalToken"),
        monotoneRevision: 1,
        generatedAt: input.generatedAt,
        sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
        version: 1,
      };
      const created: HubOfferToConfirmationTruthProjectionSnapshot = {
        ...createdCore,
        truthTupleHash: computeTruthTupleHash({
          ...createdCore,
          truthTupleHash: undefined as never,
        }),
      };
      await repositories.saveTruthProjection(created);
      return created;
    }

    const updated = updateTruthProjection(
      current,
      {
        selectionSource: input.selectionSource,
        candidateSnapshotRef: input.session.candidateSnapshotRef,
        selectedCandidateRef:
          input.selectedCandidateRef === undefined ? current.selectedCandidateRef : input.selectedCandidateRef,
        selectedCandidateSourceVersion: input.session.capacityRankProofRef,
        selectedCapacityUnitRef:
          input.selectedCapacityUnitRef === undefined
            ? current.selectedCapacityUnitRef
            : input.selectedCapacityUnitRef,
        offerSessionRef: input.session.alternativeOfferSessionId,
        offerOptimisationPlanRef: input.session.optimisationPlanRef,
        fallbackCardRef: input.fallbackCard?.alternativeOfferFallbackCardId ?? null,
        offerSetHash: input.session.visibleOfferSetHash,
        offerSessionRevision: input.session.monotoneRevision,
        offerExpiryAt: input.session.expiresAt,
        offerState: input.offerState,
        offerActionabilityState: baseActionability,
        latestRegenerationSettlementRef:
          input.latestRegenerationSettlementRef === undefined
            ? current.latestRegenerationSettlementRef
            : input.latestRegenerationSettlementRef,
        bookingEvidenceRef: input.hubCaseBundle.hubCase.bookingEvidenceRef,
        hubAppointmentId: input.hubCaseBundle.hubCase.networkAppointmentRef,
        practiceAckGeneration: input.hubCaseBundle.hubCase.practiceAckGeneration,
        fallbackRef: input.hubCaseBundle.hubCase.activeFallbackRef,
        fallbackLinkState: input.fallbackLinkState,
        patientVisibilityState: input.patientVisibilityState,
        closureState: input.closureState,
        experienceContinuityEvidenceRef: input.session.experienceContinuityEvidenceRef,
        policyTupleHash: input.session.policyTupleHash,
        blockingRefs:
          input.closureState === "closable"
            ? []
            : uniqueSortedRefs([
                input.offerState === "selected" ? "offer_selected_commit_pending" : "offer_live",
                input.fallbackLinkState === "callback_pending_link" ? "callback_linkage_pending" : "",
              ]),
        causalToken: nextId(idGenerator, "hubOfferTruthCausalToken"),
      },
      input.generatedAt,
    );
    await repositories.saveTruthProjection(updated, { expectedVersion: current.version });
    return updated;
  }

  async function appendSelectionEvent(input: {
    hubCoordinationCaseId: string;
    offerSessionRef: string;
    offerEntryRef?: string | null;
    fallbackCardRef?: string | null;
    eventType: OfferSelectionEventType;
    actorRef: string;
    actorKind: "patient" | "hub_staff";
    decisionReasonRefs?: readonly string[];
    truthTupleHash: string;
    recordedAt: string;
  }): Promise<AlternativeOfferSelectionEventSnapshot> {
    const event: AlternativeOfferSelectionEventSnapshot = {
      alternativeOfferSelectionEventId: nextId(idGenerator, "alternativeOfferSelectionEvent"),
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      offerSessionRef: input.offerSessionRef,
      offerEntryRef: input.offerEntryRef ?? null,
      fallbackCardRef: input.fallbackCardRef ?? null,
      eventType: input.eventType,
      actorRef: input.actorRef,
      actorKind: input.actorKind,
      decisionReasonRefs: uniqueSortedRefs(input.decisionReasonRefs ?? []),
      truthTupleHash: input.truthTupleHash,
      recordedAt: input.recordedAt,
      sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
      version: 1,
    };
    await repositories.appendSelectionEvent(event);
    return event;
  }

  async function maybeRevokeGrant(
    session: AlternativeOfferSessionSnapshot,
    recordedAt: string,
    reasonCodes: readonly string[],
  ): Promise<void> {
    const grantBinding = await repositories.getSecureLinkBindingForSession(
      session.alternativeOfferSessionId,
    );
    if (!grantBinding) {
      return;
    }
    await accessGrantService.revokeGrant({
      grantRef: grantBinding.toSnapshot().accessGrantRef,
      governingObjectRef: grantBinding.toSnapshot().governingObjectRef,
      lineageFenceEpoch: session.offerFenceEpoch,
      reasonCodes,
      recordedAt,
    });
  }

  async function collectMutationFenceReasons(input: {
    session: AlternativeOfferSessionSnapshot;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    fence: OfferMutationFenceInput;
    recordedAt?: string;
  }): Promise<string[]> {
    const reasons: string[] = [];
    const currentAt =
      typeof input.recordedAt === "string"
        ? ensureIsoTimestamp(input.recordedAt, "recordedAt")
        : new Date().toISOString();
    if (compareIso(input.fence.visibleOfferSetHash, input.session.visibleOfferSetHash) !== 0) {
      reasons.push("VISIBLE_OFFER_SET_HASH_DRIFT");
    }
    if (compareIso(input.fence.truthTupleHash, input.truthProjection.truthTupleHash) !== 0) {
      reasons.push("TRUTH_TUPLE_HASH_DRIFT");
    }
    if (input.fence.subjectRef !== input.session.subjectRef) {
      reasons.push("SUBJECT_DRIFT");
    }
    if (input.fence.sessionEpochRef !== input.session.sessionEpochRef) {
      reasons.push("SESSION_EPOCH_DRIFT");
    }
    if (input.fence.subjectBindingVersionRef !== input.session.subjectBindingVersionRef) {
      reasons.push("SUBJECT_BINDING_VERSION_DRIFT");
    }
    if ((input.fence.manifestVersionRef ?? null) !== (input.session.manifestVersionRef ?? null)) {
      reasons.push("MANIFEST_DRIFT");
    }
    if (input.fence.releaseApprovalFreezeRef !== input.session.releaseApprovalFreezeRef) {
      reasons.push("RELEASE_APPROVAL_FREEZE_DRIFT");
    }
    if (input.fence.channelReleaseFreezeState !== input.session.channelReleaseFreezeState) {
      reasons.push("CHANNEL_RELEASE_STATE_DRIFT");
    }
    if (input.fence.offerFenceEpoch !== input.session.offerFenceEpoch) {
      reasons.push("OFFER_FENCE_EPOCH_DRIFT");
    }
    if (
      input.fence.experienceContinuityEvidenceRef !== input.session.experienceContinuityEvidenceRef
    ) {
      reasons.push("CONTINUITY_EVIDENCE_DRIFT");
    }
    if (
      input.fence.surfacePublicationRef !== undefined &&
      (input.fence.surfacePublicationRef ?? null) !== input.session.surfacePublicationRef
    ) {
      reasons.push("SURFACE_PUBLICATION_DRIFT");
    }
    if (
      input.fence.runtimePublicationBundleRef !== undefined &&
      (input.fence.runtimePublicationBundleRef ?? null) !== input.session.runtimePublicationBundleRef
    ) {
      reasons.push("RUNTIME_PUBLICATION_DRIFT");
    }
    if (compareIso(input.session.expiresAt, currentAt) < 0) {
      reasons.push("EXPIRY_DRIFT");
    }
    if (
      [
        "selected",
        "declined",
        "callback_requested",
        "expired",
        "superseded",
        "recovery_only",
      ].includes(input.session.patientChoiceState)
    ) {
      reasons.push("SESSION_NO_LONGER_MUTABLE");
    }
    if (input.truthProjection.offerActionabilityState !== "live_open_choice") {
      reasons.push("TRUTH_PROJECTION_NOT_LIVE");
    }
    return uniqueSortedRefs(reasons);
  }

  async function preserveReadOnlyProvenance(input: {
    session: AlternativeOfferSessionSnapshot;
    entries: readonly AlternativeOfferEntrySnapshot[];
    fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    triggerClass: AlternativeOfferRegenerationTriggerClass;
    resultState: AlternativeOfferRegenerationResultState;
    recordedAt: string;
    nextOfferSessionRef?: string | null;
    nextOfferSetHash?: string | null;
  }): Promise<{
    session: AlternativeOfferSessionSnapshot;
    entries: readonly AlternativeOfferEntrySnapshot[];
    fallbackCard: AlternativeOfferFallbackCardSnapshot | null;
    truthProjection: HubOfferToConfirmationTruthProjectionSnapshot;
    settlement: AlternativeOfferRegenerationSettlementSnapshot;
  }> {
    const settlement: AlternativeOfferRegenerationSettlementSnapshot = {
      alternativeOfferRegenerationSettlementId: nextId(
        idGenerator,
        "alternativeOfferRegenerationSettlement",
      ),
      hubCoordinationCaseId: input.session.hubCoordinationCaseId,
      previousOfferSessionRef: input.session.alternativeOfferSessionId,
      nextOfferSessionRef: input.nextOfferSessionRef ?? null,
      previousOfferSetHash: input.session.visibleOfferSetHash,
      nextOfferSetHash: input.nextOfferSetHash ?? null,
      triggerClass: input.triggerClass,
      preservedSelectedAnchorRef: input.session.selectedAnchorRef,
      preservedSelectedAnchorTupleHashRef: input.session.selectedAnchorTupleHashRef,
      preservedOfferEntryRefs: input.entries.map((entry) => entry.alternativeOfferEntryId),
      preservedFallbackCardRef: input.fallbackCard?.alternativeOfferFallbackCardId ?? null,
      resultState: input.resultState,
      recordedAt: input.recordedAt,
      sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
      version: 1,
    };
    await repositories.saveRegenerationSettlement(settlement);

    const nextPatientChoiceState: AlternativeOfferPatientChoiceState =
      input.triggerClass === "expiry" ? "expired" : "superseded";
    const updatedSession = updateSessionState(input.session, {
      openChoiceState: "read_only_provenance",
      patientChoiceState: nextPatientChoiceState,
      callbackOfferState:
        input.resultState === "callback_only_recovery" ? "available" : "blocked",
      latestRegenerationSettlementRef: settlement.alternativeOfferRegenerationSettlementId,
      supersededByOfferSessionRef: input.nextOfferSessionRef ?? null,
      supersededAt:
        input.triggerClass === "expiry" && input.nextOfferSessionRef === null
          ? null
          : input.recordedAt,
      truthTupleHash: input.truthProjection.truthTupleHash,
    });
    await repositories.saveSession(updatedSession, { expectedVersion: input.session.version });

    const nextEntryState: AlternativeOfferEntrySelectionState =
      input.triggerClass === "expiry" ? "expired" : "superseded";
    const updatedEntries: AlternativeOfferEntrySnapshot[] = [];
    for (const entry of input.entries) {
      const updatedEntry = updateEntryState(entry, {
        selectionState: nextEntryState,
        truthTupleHash: input.truthProjection.truthTupleHash,
      });
      await repositories.saveEntry(updatedEntry, { expectedVersion: entry.version });
      updatedEntries.push(updatedEntry);
    }

    const updatedFallback =
      input.fallbackCard === null
        ? null
        : updateFallbackState(input.fallbackCard, {
            eligibilityState:
              input.resultState === "callback_only_recovery"
                ? "visible"
                : "read_only_provenance",
          });
    if (updatedFallback) {
      await repositories.saveFallbackCard(updatedFallback, {
        expectedVersion: input.fallbackCard!.version,
      });
    }

    const updatedTruth = updateTruthProjection(
      input.truthProjection,
      {
        offerState: input.triggerClass === "expiry" ? "expired" : "superseded",
        offerActionabilityState:
          input.resultState === "callback_only_recovery"
            ? "fallback_only"
            : "read_only_provenance",
        latestRegenerationSettlementRef: settlement.alternativeOfferRegenerationSettlementId,
        fallbackCardRef: updatedFallback?.alternativeOfferFallbackCardId ?? null,
        fallbackLinkState:
          input.resultState === "callback_only_recovery"
            ? "callback_pending_link"
            : input.truthProjection.fallbackLinkState,
        patientVisibilityState:
          input.resultState === "callback_only_recovery"
            ? "fallback_visible"
            : "recovery_required",
        closureState:
          input.resultState === "callback_only_recovery"
            ? "blocked_by_fallback_linkage"
            : "blocked_by_supplier_drift",
        blockingRefs: uniqueSortedRefs([
          "offer_set_not_live",
          input.resultState === "callback_only_recovery" ? "callback_recovery_only" : "",
        ]),
      },
      input.recordedAt,
    );
    await repositories.saveTruthProjection(updatedTruth, {
      expectedVersion: input.truthProjection.version,
    });
    await maybeRevokeGrant(updatedSession, input.recordedAt, [
      `SETTLEMENT_${input.triggerClass.toUpperCase()}`,
    ]);
    return {
      session: updatedSession,
      entries: updatedEntries,
      fallbackCard: updatedFallback,
      truthProjection: updatedTruth,
      settlement,
    };
  }

  async function buildOrRefreshOfferSession(
    input: OpenAlternativeOfferSessionInput,
  ): Promise<OpenAlternativeOfferSessionResult> {
    const plan = await loadPlanInputs({
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      recordedAt: input.recordedAt,
      maxOfferCount: input.maxOfferCount,
    });
    const candidateMap = candidateById(plan.candidates);
    const explanationMap = rankExplanationByCandidate(plan.rankExplanations);

    const existingSessionDoc = await repositories.getCurrentSessionForCase(input.hubCoordinationCaseId);
    const previousSession = existingSessionDoc?.toSnapshot() ?? null;
    if (
      previousSession &&
      previousSession.alternativeOfferSessionId !==
        plan.hubCaseBundle.hubCase.activeAlternativeOfferSessionRef
    ) {
      await maybeRevokeGrant(previousSession, input.recordedAt, ["SUPERSEDED_BY_NEW_OFFER_SESSION"]);
    }

    const existingTruth =
      (await repositories.getTruthProjectionForCase(input.hubCoordinationCaseId))?.toSnapshot() ??
      null;
    const truthProjectionRef =
      existingTruth?.hubOfferToConfirmationTruthProjectionId ??
      nextId(idGenerator, "hubOfferToConfirmationTruth");
    const sessionId = nextId(idGenerator, "alternativeOfferSession");
    const routeFamilyRef = input.routeFamilyRef ?? "rf_patient_appointments";
    const offerFenceEpoch = ensureNonNegativeInteger(
      input.lineagedFenceEpoch ?? plan.hubCaseBundle.hubCase.ownershipEpoch,
      "offerFenceEpoch",
    );
    const expiresAt = addMinutes(
      input.recordedAt,
      ensurePositiveInteger(input.expiryMinutes ?? 20, "expiryMinutes"),
    );
    const governingVersionRef = computeGoverningVersionRef(
      sessionId,
      plan.optimisationPlan.offerSetHash,
      existingTruth?.truthTupleHash ?? sha256Hex(sessionId),
    );

    const grantIssue = await accessGrantService.issueGrantForUseCase({
      useCase: "network_alternative_choice",
      routeFamilyRef,
      governingObjectRef: input.hubCoordinationCaseId,
      governingVersionRef,
      issuedRouteIntentBindingRef: input.routeIntentBindingRef,
      requiredIdentityBindingRef: deriveIdentityBindingRef(input.subjectBindingVersionRef),
      requiredReleaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: input.runtimePublicationBundleRef,
      minimumBridgeCapabilitiesRef: null,
      requiredAssuranceSliceTrustRefs: [input.visibilityEnvelopeVersionRef],
      recoveryRouteRef: "rf_patient_secure_link_recovery",
      subjectRef: input.subjectRef,
      boundPatientRef: plan.hubCaseBundle.networkBookingRequest.patientRef,
      issuedIdentityBindingRef: deriveIdentityBindingRef(input.subjectBindingVersionRef),
      boundContactRouteRef: null,
      tokenKeyVersionRef: input.tokenKeyVersionRef ?? "token_key_local_v1",
      validatorVersionRef: "network_alternative_choice_validator::v1",
      issuedSessionEpochRef: input.sessionEpochRef,
      issuedSubjectBindingVersionRef: input.subjectBindingVersionRef,
      issuedLineageFenceEpoch: offerFenceEpoch,
      presentedToken: "",
      expiresAt,
      createdAt: input.recordedAt,
    });
    invariant(grantIssue.outcome === "issued", "ACCESS_GRANT_ISSUE_FAILED", "Expected issued grant.");

    const sessionDraftBase = {
      alternativeOfferSessionId: sessionId,
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      candidateSnapshotRef: plan.candidateSnapshot.snapshotId,
      candidateRefs: plan.optimisationPlan.visibleCandidateRefs,
      optimisationPlanRef: plan.optimisationPlan.alternativeOfferOptimisationPlanId,
      offerEntryRefs: [] as string[],
      fallbackCardRef: null,
      rankPlanVersionRef: plan.rankProof.rankPlanVersionRef,
      capacityRankProofRef: plan.rankProof.capacityRankProofId,
      rankDisclosurePolicyRef: input.rankDisclosurePolicyRef ?? "313.rank-disclosure.patient-open-choice.v1",
      rankDisclosureMode: "recommended_open_choice" as const,
      visibleOfferSetHash: plan.optimisationPlan.offerSetHash,
      offerSetHash: plan.optimisationPlan.offerSetHash,
      openChoiceState:
        plan.optimisationPlan.visibleCandidateRefs.length > 0
          ? ("full_set_visible" as const)
          : plan.optimisationPlan.callbackFallbackEligible
            ? ("callback_only" as const)
            : ("read_only_provenance" as const),
      offerMode:
        plan.optimisationPlan.visibleCandidateRefs.length > 0
          ? ("patient_secure_link" as const)
          : ("callback_recovery_only" as const),
      patientChoiceState: "prepared" as const,
      callbackOfferState: plan.optimisationPlan.callbackFallbackEligible
        ? ("available" as const)
        : ("hidden" as const),
      accessGrantRef: grantIssue.grant.grantId,
      subjectRef: input.subjectRef,
      routeIntentRef: input.routeIntentBindingRef,
      routeFamilyRef,
      sessionEpochRef: input.sessionEpochRef,
      subjectBindingVersionRef: input.subjectBindingVersionRef,
      manifestVersionRef: optionalRef(input.manifestVersionRef),
      releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
      channelReleaseFreezeState: input.channelReleaseFreezeState,
      surfaceRouteContractRef: input.surfaceRouteContractRef,
      surfacePublicationRef: input.surfacePublicationRef,
      runtimePublicationBundleRef: input.runtimePublicationBundleRef,
      selectedAnchorRef: input.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
      transitionEnvelopeRef: input.transitionEnvelopeRef,
      experienceContinuityEvidenceRef: input.experienceContinuityEvidenceRef,
      releaseRecoveryDispositionRef: input.releaseRecoveryDispositionRef,
      truthProjectionRef,
      truthTupleHash: sha256Hex(`${sessionId}::prepared`),
      policyTupleHash: plan.optimisationPlan.policyTupleHash,
      visibilityEnvelopeVersionRef: input.visibilityEnvelopeVersionRef,
      offerFenceEpoch,
      sameShellContinuationRef: input.selectedAnchorRef,
      patientChoiceDeadlineAt: expiresAt,
      expiresAt,
      selectedCandidateRef: null,
      latestRegenerationSettlementRef: null,
      supersededByOfferSessionRef: null,
      supersededAt: null,
      stateConfidenceBand:
        plan.optimisationPlan.visibleCandidateRefs.length >= 2
          ? ("high" as const)
          : plan.optimisationPlan.visibleCandidateRefs.length === 1
            ? ("medium" as const)
            : ("low" as const),
      causalToken: nextId(idGenerator, "alternativeOfferCausalToken"),
      monotoneRevision: 1,
      sourceRefs: uniqueSortedRefs([...(input.sourceRefs ?? []), ...DEFAULT_SOURCE_REFS]),
      version: 1,
    };

    const entries: AlternativeOfferEntrySnapshot[] = [];
    plan.optimisationPlan.visibleCandidateRefs.forEach((candidateRef, index) => {
      const candidate = candidateMap.get(candidateRef);
      invariant(candidate, "VISIBLE_CANDIDATE_MISSING", `Candidate ${candidateRef} is missing.`);
      const explanation = explanationMap.get(candidateRef);
      const entry: AlternativeOfferEntrySnapshot = {
        alternativeOfferEntryId: nextId(idGenerator, "alternativeOfferEntry"),
        alternativeOfferSessionId: sessionId,
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        candidateRef,
        slotCandidateRef: candidate.candidateId,
        capacityUnitRef: candidate.capacityUnitRef,
        siteId: candidate.siteId,
        localDayBucket: localDayBucket(candidate.startAt, candidate.timezone),
        modality: candidate.modality,
        capacityRankExplanationRef:
          explanation?.capacityRankExplanationId ?? candidate.capacityRankExplanationRef,
        rankOrdinal: index + 1,
        bucketKey: bucketKeyForCandidate(candidate),
        coverageRole: index === 0 ? "primary_bucket" : "diversity_fill",
        redundancyPenaltyClass: index === 0 ? "none" : "low",
        recommendationState: index === 0 ? "recommended" : "neutral",
        selectionState: "available",
        availabilityWindowStartAt: candidate.startAt,
        availabilityWindowEndAt: candidate.endAt,
        patientFacingLabel: candidateLabel(candidate),
        patientReasonCueRefs: candidate.patientReasonCueRefs,
        staffReasonCueRefs: baseOfferReasonCueRefs(candidate),
        routeFamilyRef,
        truthTupleHash: sessionDraftBase.truthTupleHash,
        policyTupleHash: sessionDraftBase.policyTupleHash,
        generatedAt: input.recordedAt,
        sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
        version: 1,
      };
      entries.push(entry);
    });

    const fallbackCard =
      plan.optimisationPlan.callbackFallbackEligible || plan.optimisationPlan.outsideWindowExplanationEligible
        ? {
            alternativeOfferFallbackCardId: nextId(idGenerator, "alternativeOfferFallbackCard"),
            offerSessionRef: sessionId,
            hubCoordinationCaseId: input.hubCoordinationCaseId,
            cardType: plan.optimisationPlan.callbackFallbackEligible
              ? ("callback" as const)
              : ("outside_window_explanation" as const),
            sourceFallbackRef: optionalRef(input.callbackFallbackRef),
            displayPlacement: "after_ranked_offers" as const,
            eligibilityState: plan.optimisationPlan.callbackFallbackEligible
              ? ("visible" as const)
              : ("hidden" as const),
            reasonCodeRefs: uniqueSortedRefs([
              ...plan.optimisationPlan.callbackFallbackReasonRefs,
              ...(plan.optimisationPlan.outsideWindowExplanationEligible
                ? ["OUTSIDE_WINDOW_EXPLANATION_AVAILABLE"]
                : []),
            ]),
            leadTimeConstraintRef: plan.optimisationPlan.callbackFallbackEligible
              ? "callback_lead_time_governed"
              : "outside_window_explanation_only",
            dominantActionRef: plan.optimisationPlan.callbackFallbackEligible
              ? "request_callback"
              : "explain_outside_window",
            generatedAt: input.recordedAt,
            sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
            version: 1,
          }
        : null;

    const provisionalSession: AlternativeOfferSessionSnapshot = {
      ...sessionDraftBase,
      offerEntryRefs: entries.map((entry) => entry.alternativeOfferEntryId),
      fallbackCardRef: fallbackCard?.alternativeOfferFallbackCardId ?? null,
    };

    const truthProjection = await upsertTruthProjection({
      hubCaseBundle: plan.hubCaseBundle,
      session: provisionalSession,
      fallbackCard,
      selectionSource: "alternative_offer",
      offerState: "prepared",
      fallbackLinkState: "none",
      patientVisibilityState: "provisional_receipt",
      closureState: "blocked_by_offer",
      generatedAt: input.recordedAt,
    });

    const session = {
      ...provisionalSession,
      truthProjectionRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
      truthTupleHash: truthProjection.truthTupleHash,
    };

    await repositories.saveSession(session);
    for (const entry of entries) {
      await repositories.saveEntry({
        ...entry,
        truthTupleHash: truthProjection.truthTupleHash,
      });
    }
    if (fallbackCard) {
      await repositories.saveFallbackCard(fallbackCard);
    }

    const secureLinkBinding: OfferSecureLinkBindingSnapshot = {
      offerSecureLinkBindingId: nextId(idGenerator, "offerSecureLinkBinding"),
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      offerSessionRef: sessionId,
      accessGrantRef: grantIssue.grant.grantId,
      governingObjectRef: input.hubCoordinationCaseId,
      governingVersionRef,
      routeFamilyRef,
      routeIntentRef: input.routeIntentBindingRef,
      tokenKeyVersionRef: input.tokenKeyVersionRef ?? "token_key_local_v1",
      validatorVersionRef: "network_alternative_choice_validator::v1",
      transportClass: "url_query",
      subjectRef: input.subjectRef,
      boundPatientRef: plan.hubCaseBundle.networkBookingRequest.patientRef,
      sessionEpochRef: input.sessionEpochRef,
      subjectBindingVersionRef: input.subjectBindingVersionRef,
      manifestVersionRef: optionalRef(input.manifestVersionRef),
      releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
      channelReleaseFreezeState: input.channelReleaseFreezeState,
      visibilityEnvelopeVersionRef: input.visibilityEnvelopeVersionRef,
      visibleOfferSetHash: session.visibleOfferSetHash,
      truthTupleHash: truthProjection.truthTupleHash,
      offerFenceEpoch,
      recoveryRouteRef: "rf_patient_secure_link_recovery",
      createdAt: input.recordedAt,
      expiresAt,
      sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
      version: 1,
    };
    await repositories.saveSecureLinkBinding(secureLinkBinding);

    const replayFixture: AlternativeOfferReplayFixtureSnapshot = {
      alternativeOfferReplayFixtureId: nextId(idGenerator, "alternativeOfferReplayFixture"),
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      offerSessionRef: sessionId,
      optimisationPlanRef: plan.optimisationPlan.alternativeOfferOptimisationPlanId,
      candidateSnapshotRef: plan.candidateSnapshot.snapshotId,
      decisionPlanRef: plan.decisionPlan.decisionPlanId,
      capacityRankProofRef: plan.rankProof.capacityRankProofId,
      visibleCandidateRefs: session.candidateRefs,
      representedBucketKeys: plan.optimisationPlan.representedBucketKeys,
      offerSetHash: session.visibleOfferSetHash,
      policyTupleHash: session.policyTupleHash,
      recordedAt: input.recordedAt,
      sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
      version: 1,
    };
    await repositories.saveReplayFixture(replayFixture);

    let hubTransition: HubCaseTransitionResult;
    if (["alternatives_offered", "patient_choice_pending"].includes(plan.hubCaseBundle.hubCase.status)) {
      hubTransition = await options.hubCaseService.refreshAlternativeOfferPointers({
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.recordedAt,
        reasonCode: "offer_session_refresh",
        expectedOwnershipEpoch: plan.hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: plan.hubCaseBundle.hubCase.ownershipFenceToken,
        activeAlternativeOfferSessionRef: session.alternativeOfferSessionId,
        activeOfferOptimisationPlanRef: plan.optimisationPlan.alternativeOfferOptimisationPlanId,
        latestOfferRegenerationSettlementRef: session.latestRegenerationSettlementRef,
        offerToConfirmationTruthRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
        selectedCandidateRef: session.selectedCandidateRef,
      });
    } else {
      hubTransition = await options.hubCaseService.enterAlternativesOffered({
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.recordedAt,
        reasonCode: "offer_session_opened",
        expectedOwnershipEpoch: plan.hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: plan.hubCaseBundle.hubCase.ownershipFenceToken,
        activeAlternativeOfferSessionRef: session.alternativeOfferSessionId,
        activeOfferOptimisationPlanRef: plan.optimisationPlan.alternativeOfferOptimisationPlanId,
        latestOfferRegenerationSettlementRef: session.latestRegenerationSettlementRef,
        offerToConfirmationTruthRef: truthProjection.hubOfferToConfirmationTruthProjectionId,
      });
    }

    await appendSelectionEvent({
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      offerSessionRef: session.alternativeOfferSessionId,
      eventType: "offer_created",
      actorRef: input.actorRef,
      actorKind: "hub_staff",
      truthTupleHash: truthProjection.truthTupleHash,
      recordedAt: input.recordedAt,
      decisionReasonRefs: [
        `VISIBLE_COUNT_${session.offerEntryRefs.length}`,
        `CALLBACK_ELIGIBLE_${String(Boolean(fallbackCard))}`,
      ],
    });

    return {
      ...plan,
      session,
      entries: entries.map((entry) => ({ ...entry, truthTupleHash: truthProjection.truthTupleHash })),
      fallbackCard,
      secureLinkBinding,
      truthProjection,
      hubTransition,
      materializedToken: grantIssue.materializedToken?.opaqueToken ?? null,
      replayFixture,
    };
  }

  return {
    async createOfferOptimisationPlan(input) {
      return loadPlanInputs({
        hubCoordinationCaseId: input.hubCoordinationCaseId,
        recordedAt: input.recordedAt,
        maxOfferCount: input.maxOfferCount,
      });
    },

    async openAlternativeOfferSession(input) {
      return buildOrRefreshOfferSession(input);
    },

    async deliverAlternativeOfferSession(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const truthProjection = await requireSnapshot(
        repositories.getTruthProjectionForCase(session.hubCoordinationCaseId),
        "OFFER_TRUTH_PROJECTION_NOT_FOUND",
        "Offer truth projection is missing.",
      );
      const hubCaseBundle = requireHubCaseBundle(
        await options.hubCaseService.queryHubCaseBundle(session.hubCoordinationCaseId),
        session.hubCoordinationCaseId,
      );
      const nextSession = updateSessionState(session, {
        patientChoiceState: "delivered",
        offerMode: input.deliveryMode ?? "patient_secure_link",
      });
      await repositories.saveSession(nextSession, { expectedVersion: session.version });
      const nextTruth = await upsertTruthProjection({
        hubCaseBundle,
        session: nextSession,
        fallbackCard:
          nextSession.fallbackCardRef === null
            ? null
            : await requireSnapshot(
                repositories.getFallbackCard(nextSession.fallbackCardRef),
                "ALTERNATIVE_FALLBACK_NOT_FOUND",
                "Fallback card is missing.",
              ),
        selectionSource: "alternative_offer",
        offerState: "patient_choice_pending",
        fallbackLinkState: truthProjection.fallbackLinkState,
        patientVisibilityState: "choice_visible",
        closureState: "blocked_by_offer",
        generatedAt: input.recordedAt,
      });
      const hubTransition = await options.hubCaseService.enterPatientChoicePending({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.recordedAt,
        reasonCode: "offer_delivered",
        expectedOwnershipEpoch: hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: hubCaseBundle.hubCase.ownershipFenceToken,
      });
      const selectionEvent = await appendSelectionEvent({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        eventType: "offer_delivered",
        actorRef: input.actorRef,
        actorKind: "hub_staff",
        truthTupleHash: nextTruth.truthTupleHash,
        recordedAt: input.recordedAt,
      });
      return {
        session: nextSession,
        truthProjection: nextTruth,
        hubTransition,
        selectionEvent,
      };
    },

    async redeemAlternativeOfferLink(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const truthProjection = await requireSnapshot(
        repositories.getTruthProjectionForCase(session.hubCoordinationCaseId),
        "OFFER_TRUTH_PROJECTION_NOT_FOUND",
        "Offer truth projection is missing.",
      );
      const binding = await requireSnapshot(
        repositories.getSecureLinkBindingForSession(session.alternativeOfferSessionId),
        "OFFER_LINK_BINDING_NOT_FOUND",
        "Offer secure-link binding is missing.",
      );
      const redemption = input.presentedToken
        ? await accessGrantService.redeemGrant({
            presentedToken: input.presentedToken,
            context: {
              routeFamily: binding.routeFamilyRef,
              actionScope: "alternative_offer",
              lineageScope: "request",
              governingObjectRef: binding.governingObjectRef,
              governingVersionRef: binding.governingVersionRef,
              routeIntentBindingRef: binding.routeIntentRef,
              routeIntentTupleHash: session.visibleOfferSetHash,
              routeContractDigestRef: session.surfaceRouteContractRef,
              routeIntentBindingState: "live",
              identityBindingRef: deriveIdentityBindingRef(session.subjectBindingVersionRef),
              releaseApprovalFreezeRef: session.releaseApprovalFreezeRef,
              audienceSurfaceRuntimeBindingRef: session.runtimePublicationBundleRef,
              assuranceSliceTrustRefs: [binding.visibilityEnvelopeVersionRef],
              lineageFenceEpoch: session.offerFenceEpoch,
              sessionEpochRef: session.sessionEpochRef,
              subjectBindingVersionRef: session.subjectBindingVersionRef,
              tokenKeyVersionRef: binding.tokenKeyVersionRef,
            },
            recordedAt: input.recordedAt,
            resultingSessionRef: session.sameShellContinuationRef,
            resultingRouteIntentBindingRef: binding.routeIntentRef,
          })
        : {
            replayed: false,
            grant: null,
            scopeEnvelope: null,
            redemption: null,
            supersession: null,
            replacementGrant: null,
            sessionDecision: null,
          } as unknown as AccessGrantRedemptionResult;
      const fenceReasons = await collectMutationFenceReasons({
        session,
        truthProjection,
        fence: input,
        recordedAt: input.recordedAt,
      });
      const decision = redemption.redemption?.toSnapshot().decision;
      const decisionReasons =
        decision === "allow" ? [] : (redemption.redemption?.toSnapshot().decisionReasonCodes ?? []);
      const combinedReasons = uniqueSortedRefs([
        ...fenceReasons,
        ...decisionReasons,
        decision !== undefined && decision !== "allow"
          ? `GRANT_DECISION_${decision.toUpperCase()}`
          : "",
      ]);
      if (
        redemption.redemption?.toSnapshot().decision &&
        redemption.redemption.toSnapshot().decision !== "allow"
      ) {
        return {
          session,
          truthProjection,
          redemption,
          liveActionabilityState: "read_only_provenance",
          reasonCodes: combinedReasons,
          replayed: redemption.replayed,
        };
      }
      if (combinedReasons.length > 0) {
        return {
          session,
          truthProjection,
          redemption,
          liveActionabilityState:
            session.openChoiceState === "callback_only" ? "fallback_only" : "read_only_provenance",
          reasonCodes: combinedReasons,
          replayed: redemption.replayed,
        };
      }
      const nextSession =
        session.patientChoiceState === "opened"
          ? session
          : updateSessionState(session, {
              patientChoiceState: "opened",
            });
      if (nextSession !== session) {
        await repositories.saveSession(nextSession, { expectedVersion: session.version });
      }
      await appendSelectionEvent({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        eventType: "offer_opened",
        actorRef: session.subjectRef,
        actorKind: "patient",
        truthTupleHash: truthProjection.truthTupleHash,
        recordedAt: input.recordedAt,
      });
      return {
        session: nextSession,
        truthProjection,
        redemption,
        liveActionabilityState: computeActionability(
          nextSession,
          nextSession.fallbackCardRef
            ? await requireSnapshot(
                repositories.getFallbackCard(nextSession.fallbackCardRef),
                "ALTERNATIVE_FALLBACK_NOT_FOUND",
                "Fallback card is missing.",
              )
            : null,
        ),
        reasonCodes: [],
        replayed: redemption.replayed,
      };
    },

    async acceptAlternativeOfferEntry(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const truthProjection = await requireSnapshot(
        repositories.getTruthProjectionForCase(session.hubCoordinationCaseId),
        "OFFER_TRUTH_PROJECTION_NOT_FOUND",
        "Offer truth projection is missing.",
      );
      const entry = await requireSnapshot(
        repositories.getEntry(input.alternativeOfferEntryId),
        "ALTERNATIVE_OFFER_ENTRY_NOT_FOUND",
        "Alternative offer entry was not found.",
      );
      invariant(
        entry.alternativeOfferSessionId === session.alternativeOfferSessionId,
        "ENTRY_SESSION_MISMATCH",
        "Alternative offer entry does not belong to the requested session.",
      );
      if (!input.skipGrantValidation) {
        const fenceReasons = await collectMutationFenceReasons({
          session,
          truthProjection,
          fence: input,
          recordedAt: input.recordedAt,
        });
        if (fenceReasons.length > 0) {
          const entries = (
            await repositories.listEntriesForSession(session.alternativeOfferSessionId)
          ).map((row) => row.toSnapshot());
          const fallbackCard =
            session.fallbackCardRef === null
              ? null
              : await requireSnapshot(
                  repositories.getFallbackCard(session.fallbackCardRef),
                  "ALTERNATIVE_FALLBACK_NOT_FOUND",
                  "Fallback card is missing.",
                );
          await preserveReadOnlyProvenance({
            session,
            entries,
            fallbackCard,
            truthProjection,
            triggerClass: determineTriggerFromFenceReasons(fenceReasons),
            resultState: fallbackCard ? "callback_only_recovery" : "read_only_provenance",
            recordedAt: input.recordedAt,
          });
          throw new RequestBackboneInvariantError(
            "ALTERNATIVE_OFFER_MUTATION_BLOCKED",
            `Offer accept blocked by: ${fenceReasons.join(", ")}.`,
          );
        }
      }

      ensureReservationStillLive(input.reservationBinding);
      invariant(entry.selectionState === "available", "ENTRY_NOT_AVAILABLE", "Offer entry is no longer available.");
      const candidates = (
        await options.capacityRepositories.listCandidatesForSnapshot(session.candidateSnapshotRef)
      ).map((row) => row.toSnapshot());
      const currentCandidate = candidates.find((candidate) => candidate.candidateId === entry.candidateRef);
      invariant(currentCandidate, "LIVE_CANDIDATE_MISSING", "Selected candidate is no longer present.");
      invariant(
        currentCandidate.capacityUnitRef === entry.capacityUnitRef,
        "CAPACITY_UNIT_DRIFT",
        "Selected candidate capacity unit no longer matches the published entry.",
      );
      invariant(currentCandidate.windowClass >= 1, "WINDOW_CLASS_DRIFT", "Selected candidate is no longer clinically in-window.");
      invariant(
        currentCandidate.offerabilityState === "patient_offerable" &&
          currentCandidate.sourceTrustState === "trusted",
        "PATIENT_OFFERABILITY_DRIFT",
        "Selected candidate is no longer patient offerable.",
      );

      const allEntries = (
        await repositories.listEntriesForSession(session.alternativeOfferSessionId)
      ).map((row) => row.toSnapshot());
      const updatedEntries: AlternativeOfferEntrySnapshot[] = [];
      for (const current of allEntries) {
        const updated = updateEntryState(current, {
          selectionState:
            current.alternativeOfferEntryId === entry.alternativeOfferEntryId
              ? "selected"
              : "read_only_provenance",
          truthTupleHash: truthProjection.truthTupleHash,
        });
        await repositories.saveEntry(updated, { expectedVersion: current.version });
        updatedEntries.push(updated);
      }
      const currentFallbackCard =
        session.fallbackCardRef === null
          ? null
          : await requireSnapshot(
              repositories.getFallbackCard(session.fallbackCardRef),
              "ALTERNATIVE_FALLBACK_NOT_FOUND",
              "Fallback card is missing.",
            );
      const fallbackCard =
        currentFallbackCard === null
          ? null
          : updateFallbackState(currentFallbackCard, { eligibilityState: "blocked" });
      if (fallbackCard && currentFallbackCard) {
        await repositories.saveFallbackCard(fallbackCard, {
          expectedVersion: currentFallbackCard.version,
        });
      }

      const nextSession = updateSessionState(session, {
        patientChoiceState: "selected",
        openChoiceState: "read_only_provenance",
        callbackOfferState: "blocked",
        selectedCandidateRef: entry.candidateRef,
      });
      const hubCaseBundle = requireHubCaseBundle(
        await options.hubCaseService.queryHubCaseBundle(session.hubCoordinationCaseId),
        session.hubCoordinationCaseId,
      );
      const nextTruth = await upsertTruthProjection({
        hubCaseBundle,
        session: nextSession,
        fallbackCard,
        selectionSource: input.selectionSource ?? "alternative_offer",
        offerState: "selected",
        fallbackLinkState: "none",
        patientVisibilityState: "provisional_receipt",
        closureState: "blocked_by_confirmation",
        generatedAt: input.recordedAt,
        selectedCandidateRef: entry.candidateRef,
        selectedCapacityUnitRef: entry.capacityUnitRef,
      });
      const finalSession = {
        ...nextSession,
        truthTupleHash: nextTruth.truthTupleHash,
      };
      await repositories.saveSession(finalSession, { expectedVersion: session.version });
      await options.hubCaseService.refreshAlternativeOfferPointers({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.recordedAt,
        reasonCode: "patient_selected_offer_entry",
        expectedOwnershipEpoch: hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: hubCaseBundle.hubCase.ownershipFenceToken,
        activeAlternativeOfferSessionRef: session.alternativeOfferSessionId,
        activeOfferOptimisationPlanRef: session.optimisationPlanRef,
        latestOfferRegenerationSettlementRef: session.latestRegenerationSettlementRef,
        offerToConfirmationTruthRef: nextTruth.hubOfferToConfirmationTruthProjectionId,
        selectedCandidateRef: entry.candidateRef,
      });
      const hubTransition = await options.hubCaseService.enterCoordinatorSelecting({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.recordedAt,
        reasonCode: "patient_selected_offer_entry",
        expectedOwnershipEpoch: hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: hubCaseBundle.hubCase.ownershipFenceToken,
        selectedCandidateRef: entry.candidateRef,
      } as HubCaseTransitionCommandInput);
      await maybeRevokeGrant(finalSession, input.recordedAt, ["PATIENT_CHOICE_COMPLETED"]);
      const selectionEvent = await appendSelectionEvent({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        offerEntryRef: entry.alternativeOfferEntryId,
        eventType: "offer_accepted",
        actorRef: input.actorRef,
        actorKind: input.skipGrantValidation ? "hub_staff" : "patient",
        truthTupleHash: nextTruth.truthTupleHash,
        recordedAt: input.recordedAt,
      });
      return {
        session: finalSession,
        entry: updatedEntries.find((candidate) => candidate.alternativeOfferEntryId === entry.alternativeOfferEntryId)!,
        truthProjection: nextTruth,
        hubTransition,
        selectionEvent,
        settlement: null,
      };
    },

    async declineAlternativeOffers(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const truthProjection = await requireSnapshot(
        repositories.getTruthProjectionForCase(session.hubCoordinationCaseId),
        "OFFER_TRUTH_PROJECTION_NOT_FOUND",
        "Offer truth projection is missing.",
      );
      if (!input.skipGrantValidation) {
        const fenceReasons = await collectMutationFenceReasons({
          session,
          truthProjection,
          fence: input,
          recordedAt: input.recordedAt,
        });
        invariant(
          fenceReasons.length === 0,
          "ALTERNATIVE_OFFER_MUTATION_BLOCKED",
          `Offer decline blocked by: ${fenceReasons.join(", ")}.`,
        );
      }
      const entries = (
        await repositories.listEntriesForSession(session.alternativeOfferSessionId)
      ).map((row) => row.toSnapshot());
      const updatedEntries: AlternativeOfferEntrySnapshot[] = [];
      for (const entry of entries) {
        const updated = updateEntryState(entry, {
          selectionState: "declined",
          truthTupleHash: truthProjection.truthTupleHash,
        });
        await repositories.saveEntry(updated, { expectedVersion: entry.version });
        updatedEntries.push(updated);
      }
      const currentFallbackCard =
        session.fallbackCardRef === null
          ? null
          : await requireSnapshot(
              repositories.getFallbackCard(session.fallbackCardRef),
              "ALTERNATIVE_FALLBACK_NOT_FOUND",
              "Fallback card is missing.",
            );
      const fallbackCard =
        currentFallbackCard === null
          ? null
          : updateFallbackState(currentFallbackCard, { eligibilityState: "visible" });
      if (fallbackCard && currentFallbackCard) {
        await repositories.saveFallbackCard(fallbackCard, {
          expectedVersion: currentFallbackCard.version,
        });
      }
      const nextSession = updateSessionState(session, {
        patientChoiceState: "declined",
        openChoiceState: fallbackCard ? "callback_only" : "read_only_provenance",
        callbackOfferState: fallbackCard ? "available" : "blocked",
      });
      const hubCaseBundle = requireHubCaseBundle(
        await options.hubCaseService.queryHubCaseBundle(session.hubCoordinationCaseId),
        session.hubCoordinationCaseId,
      );
      const nextTruth = await upsertTruthProjection({
        hubCaseBundle,
        session: nextSession,
        fallbackCard,
        selectionSource: "alternative_offer",
        offerState: "declined",
        fallbackLinkState: fallbackCard ? "callback_pending_link" : "none",
        patientVisibilityState: fallbackCard ? "fallback_visible" : "recovery_required",
        closureState: fallbackCard ? "blocked_by_fallback_linkage" : "blocked_by_supplier_drift",
        generatedAt: input.recordedAt,
      });
      const finalSession = {
        ...nextSession,
        truthTupleHash: nextTruth.truthTupleHash,
      };
      await repositories.saveSession(finalSession, { expectedVersion: session.version });
      await maybeRevokeGrant(finalSession, input.recordedAt, ["PATIENT_DECLINED_ALL_OFFERS"]);
      const selectionEvent = await appendSelectionEvent({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        eventType: "offer_declined",
        actorRef: input.actorRef,
        actorKind: input.skipGrantValidation ? "hub_staff" : "patient",
        truthTupleHash: nextTruth.truthTupleHash,
        recordedAt: input.recordedAt,
      });
      return {
        session: finalSession,
        entries: updatedEntries,
        fallbackCard,
        truthProjection: nextTruth,
        selectionEvent,
      };
    },

    async requestCallbackFromAlternativeOffer(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const truthProjection = await requireSnapshot(
        repositories.getTruthProjectionForCase(session.hubCoordinationCaseId),
        "OFFER_TRUTH_PROJECTION_NOT_FOUND",
        "Offer truth projection is missing.",
      );
      const fallbackCard = await requireSnapshot(
        repositories.getFallbackCardForSession(session.alternativeOfferSessionId),
        "ALTERNATIVE_FALLBACK_NOT_FOUND",
        "Callback fallback card is missing.",
      );
      if (!input.skipGrantValidation) {
        const fenceReasons = await collectMutationFenceReasons({
          session,
          truthProjection,
          fence: input,
          recordedAt: input.recordedAt,
        });
        invariant(
          fenceReasons.length === 0,
          "ALTERNATIVE_OFFER_MUTATION_BLOCKED",
          `Callback request blocked by: ${fenceReasons.join(", ")}.`,
        );
      }
      invariant(
        fallbackCard.cardType === "callback",
        "CALLBACK_CARD_REQUIRED",
        "Requested callback requires a callback fallback card.",
      );
      const updatedFallback = updateFallbackState(fallbackCard, { eligibilityState: "selected" });
      await repositories.saveFallbackCard(updatedFallback, { expectedVersion: fallbackCard.version });

      const entries = (
        await repositories.listEntriesForSession(session.alternativeOfferSessionId)
      ).map((row) => row.toSnapshot());
      for (const entry of entries) {
        const updatedEntry = updateEntryState(entry, {
          selectionState: "read_only_provenance",
          truthTupleHash: truthProjection.truthTupleHash,
        });
        await repositories.saveEntry(updatedEntry, { expectedVersion: entry.version });
      }

      const nextSession = updateSessionState(session, {
        patientChoiceState: "callback_requested",
        openChoiceState: "read_only_provenance",
        callbackOfferState: "selected",
      });
      const hubCaseBundle = requireHubCaseBundle(
        await options.hubCaseService.queryHubCaseBundle(session.hubCoordinationCaseId),
        session.hubCoordinationCaseId,
      );
      const nextTruth = await upsertTruthProjection({
        hubCaseBundle,
        session: nextSession,
        fallbackCard: updatedFallback,
        selectionSource: "callback_fallback",
        offerState: "declined",
        fallbackLinkState: "callback_pending_link",
        patientVisibilityState: "fallback_visible",
        closureState: "blocked_by_fallback_linkage",
        generatedAt: input.recordedAt,
      });
      const finalSession = {
        ...nextSession,
        truthTupleHash: nextTruth.truthTupleHash,
      };
      await repositories.saveSession(finalSession, { expectedVersion: session.version });
      const hubTransition = await options.hubCaseService.markCallbackTransferPending({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        actorRef: input.actorRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        commandActionRecordRef: input.commandActionRecordRef,
        commandSettlementRecordRef: input.commandSettlementRecordRef,
        recordedAt: input.recordedAt,
        reasonCode: "patient_requested_callback",
        expectedOwnershipEpoch: hubCaseBundle.hubCase.ownershipEpoch,
        expectedOwnershipFenceToken: hubCaseBundle.hubCase.ownershipFenceToken,
        activeFallbackRef:
          optionalRef(input.activeFallbackRef) ?? `gap_callback_fallback_${session.hubCoordinationCaseId}`,
        callbackExpectationRef: optionalRef(input.callbackExpectationRef),
      });
      await maybeRevokeGrant(finalSession, input.recordedAt, ["CALLBACK_REQUESTED"]);
      const selectionEvent = await appendSelectionEvent({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        fallbackCardRef: updatedFallback.alternativeOfferFallbackCardId,
        eventType: "callback_requested",
        actorRef: input.actorRef,
        actorKind: input.skipGrantValidation ? "hub_staff" : "patient",
        truthTupleHash: nextTruth.truthTupleHash,
        recordedAt: input.recordedAt,
      });
      return {
        session: finalSession,
        fallbackCard: updatedFallback,
        truthProjection: nextTruth,
        hubTransition,
        selectionEvent,
      };
    },

    async captureStructuredReadBack(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const readBackCapture: AlternativeOfferReadBackCaptureSnapshot = {
        alternativeOfferReadBackCaptureId: nextId(idGenerator, "alternativeOfferReadBackCapture"),
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        selectedOfferEntryRef: optionalRef(input.selectedOfferEntryRef),
        selectedFallbackCardRef: null,
        spokenSummary: requireRef(input.spokenSummary, "spokenSummary"),
        confirmedSubjectRef: requireRef(input.confirmedSubjectRef, "confirmedSubjectRef"),
        callerRelationship: requireRef(input.callerRelationship, "callerRelationship"),
        confirmationPhrase: requireRef(input.confirmationPhrase, "confirmationPhrase"),
        decision: input.decision,
        capturedBy: requireRef(input.capturedBy, "capturedBy"),
        recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
        sourceRefs: uniqueSortedRefs(DEFAULT_SOURCE_REFS),
        version: 1,
      };
      await repositories.saveReadBackCapture(readBackCapture);
      await appendSelectionEvent({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        offerSessionRef: session.alternativeOfferSessionId,
        offerEntryRef: optionalRef(input.selectedOfferEntryRef),
        eventType: "read_back_recorded",
        actorRef: input.capturedBy,
        actorKind: "hub_staff",
        truthTupleHash:
          (await repositories.getTruthProjectionForCase(session.hubCoordinationCaseId))?.toSnapshot()
            .truthTupleHash ?? session.truthTupleHash,
        recordedAt: input.recordedAt,
      });
      if (input.decision === "accept") {
        invariant(
          optionalRef(input.selectedOfferEntryRef) !== null,
          "READ_BACK_SELECTION_REQUIRED",
          "Structured accept read-back requires a selectedOfferEntryRef.",
        );
        return {
          readBackCapture,
          acceptResult: await this.acceptAlternativeOfferEntry({
            alternativeOfferSessionId: input.alternativeOfferSessionId,
            alternativeOfferEntryId: requireRef(
              input.selectedOfferEntryRef,
              "selectedOfferEntryRef",
            ),
            actorRef: input.capturedBy,
            routeIntentBindingRef: input.routeIntentBindingRef,
            commandActionRecordRef: input.commandActionRecordRef,
            commandSettlementRecordRef: input.commandSettlementRecordRef,
            recordedAt: input.recordedAt,
            subjectRef: session.subjectRef,
            sessionEpochRef: session.sessionEpochRef,
            subjectBindingVersionRef: session.subjectBindingVersionRef,
            manifestVersionRef: session.manifestVersionRef,
            releaseApprovalFreezeRef: session.releaseApprovalFreezeRef,
            channelReleaseFreezeState: session.channelReleaseFreezeState,
            visibleOfferSetHash: session.visibleOfferSetHash,
            truthTupleHash:
              (
                await repositories.getTruthProjectionForCase(session.hubCoordinationCaseId)
              )!.toSnapshot().truthTupleHash,
            offerFenceEpoch: session.offerFenceEpoch,
            experienceContinuityEvidenceRef: session.experienceContinuityEvidenceRef,
            selectionSource: "assisted_read_back",
            skipGrantValidation: true,
          }),
          declineResult: null,
          callbackResult: null,
        };
      }
      if (input.decision === "decline") {
        return {
          readBackCapture,
          acceptResult: null,
          declineResult: await this.declineAlternativeOffers({
            alternativeOfferSessionId: input.alternativeOfferSessionId,
            actorRef: input.capturedBy,
            recordedAt: input.recordedAt,
            subjectRef: session.subjectRef,
            sessionEpochRef: session.sessionEpochRef,
            subjectBindingVersionRef: session.subjectBindingVersionRef,
            manifestVersionRef: session.manifestVersionRef,
            releaseApprovalFreezeRef: session.releaseApprovalFreezeRef,
            channelReleaseFreezeState: session.channelReleaseFreezeState,
            visibleOfferSetHash: session.visibleOfferSetHash,
            truthTupleHash:
              (
                await repositories.getTruthProjectionForCase(session.hubCoordinationCaseId)
              )!.toSnapshot().truthTupleHash,
            offerFenceEpoch: session.offerFenceEpoch,
            experienceContinuityEvidenceRef: session.experienceContinuityEvidenceRef,
            skipGrantValidation: true,
          }),
          callbackResult: null,
        };
      }
      return {
        readBackCapture,
        acceptResult: null,
        declineResult: null,
        callbackResult: await this.requestCallbackFromAlternativeOffer({
          alternativeOfferSessionId: input.alternativeOfferSessionId,
          actorRef: input.capturedBy,
          routeIntentBindingRef: input.routeIntentBindingRef,
          commandActionRecordRef: input.commandActionRecordRef,
          commandSettlementRecordRef: input.commandSettlementRecordRef,
          recordedAt: input.recordedAt,
          subjectRef: session.subjectRef,
          sessionEpochRef: session.sessionEpochRef,
          subjectBindingVersionRef: session.subjectBindingVersionRef,
          manifestVersionRef: session.manifestVersionRef,
          releaseApprovalFreezeRef: session.releaseApprovalFreezeRef,
          channelReleaseFreezeState: session.channelReleaseFreezeState,
          visibleOfferSetHash: session.visibleOfferSetHash,
          truthTupleHash:
            (await repositories.getTruthProjectionForCase(session.hubCoordinationCaseId))!.toSnapshot()
              .truthTupleHash,
          offerFenceEpoch: session.offerFenceEpoch,
          experienceContinuityEvidenceRef: session.experienceContinuityEvidenceRef,
          skipGrantValidation: true,
        }),
      };
    },

    async regenerateAlternativeOfferSession(input) {
      const priorSession = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const truthProjection = await requireSnapshot(
        repositories.getTruthProjectionForCase(priorSession.hubCoordinationCaseId),
        "OFFER_TRUTH_PROJECTION_NOT_FOUND",
        "Offer truth projection is missing.",
      );
      const entries = (
        await repositories.listEntriesForSession(priorSession.alternativeOfferSessionId)
      ).map((row) => row.toSnapshot());
      const fallbackCard =
        priorSession.fallbackCardRef === null
          ? null
          : await requireSnapshot(
              repositories.getFallbackCard(priorSession.fallbackCardRef),
              "ALTERNATIVE_FALLBACK_NOT_FOUND",
              "Fallback card is missing.",
            );
      const preserved = await preserveReadOnlyProvenance({
        session: priorSession,
        entries,
        fallbackCard,
        truthProjection,
        triggerClass: input.triggerClass,
        resultState: fallbackCard ? "callback_only_recovery" : "read_only_provenance",
        recordedAt: input.recordedAt,
      });
      const nextOffer = await buildOrRefreshOfferSession({
        ...input,
        hubCoordinationCaseId: priorSession.hubCoordinationCaseId,
      });
      const completedSettlement: AlternativeOfferRegenerationSettlementSnapshot = {
        ...preserved.settlement,
        nextOfferSessionRef: nextOffer.session.alternativeOfferSessionId,
        nextOfferSetHash: nextOffer.session.visibleOfferSetHash,
        resultState: "regenerated_in_shell",
        version: nextVersion(preserved.settlement.version),
      };
      await repositories.saveRegenerationSettlement(completedSettlement, {
        expectedVersion: preserved.settlement.version,
      });
      const refreshedPriorSession = updateSessionState(preserved.session, {
        latestRegenerationSettlementRef: completedSettlement.alternativeOfferRegenerationSettlementId,
        supersededByOfferSessionRef: nextOffer.session.alternativeOfferSessionId,
        supersededAt: input.recordedAt,
      });
      await repositories.saveSession(refreshedPriorSession, {
        expectedVersion: preserved.session.version,
      });
      const hubTransition = input.activateImmediately
        ? (
            await this.deliverAlternativeOfferSession({
              alternativeOfferSessionId: nextOffer.session.alternativeOfferSessionId,
              actorRef: input.actorRef,
              routeIntentBindingRef: input.routeIntentBindingRef,
              commandActionRecordRef: input.commandActionRecordRef,
              commandSettlementRecordRef: input.commandSettlementRecordRef,
              recordedAt: input.recordedAt,
              deliveryMode: nextOffer.session.offerMode,
            })
          ).hubTransition
        : nextOffer.hubTransition;
      await appendSelectionEvent({
        hubCoordinationCaseId: priorSession.hubCoordinationCaseId,
        offerSessionRef: nextOffer.session.alternativeOfferSessionId,
        eventType: "offer_regenerated",
        actorRef: input.actorRef,
        actorKind: "hub_staff",
        truthTupleHash: nextOffer.truthProjection.truthTupleHash,
        recordedAt: input.recordedAt,
        decisionReasonRefs: [input.triggerClass.toUpperCase()],
      });
      return {
        settlement: completedSettlement,
        priorSession: refreshedPriorSession,
        nextSession: nextOffer.session,
        nextEntries: nextOffer.entries,
        nextFallbackCard: nextOffer.fallbackCard,
        truthProjection: nextOffer.truthProjection,
        hubTransition,
      };
    },

    async queryCurrentTruthProjection(hubCoordinationCaseId) {
      return (await repositories.getTruthProjectionForCase(hubCoordinationCaseId))?.toSnapshot() ?? null;
    },

    async replayAlternativeOfferSession(input) {
      const session = await requireSnapshot(
        repositories.getSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_SESSION_NOT_FOUND",
        "Alternative offer session was not found.",
      );
      const replayFixture = await requireSnapshot(
        repositories.getReplayFixtureForSession(input.alternativeOfferSessionId),
        "ALTERNATIVE_OFFER_REPLAY_FIXTURE_NOT_FOUND",
        "Alternative offer replay fixture is missing.",
      );
      const optimisationPlan = await requireSnapshot(
        repositories.getOptimisationPlan(session.optimisationPlanRef),
        "ALTERNATIVE_OFFER_PLAN_NOT_FOUND",
        "Alternative offer optimisation plan is missing.",
      );
      const candidateSnapshot = await requireSnapshot(
        options.capacityRepositories.getSnapshot(replayFixture.candidateSnapshotRef),
        "CANDIDATE_SNAPSHOT_NOT_FOUND",
        "Candidate snapshot is missing for replay.",
      );
      const decisionPlan = await requireSnapshot(
        options.capacityRepositories.getDecisionPlan(replayFixture.decisionPlanRef),
        "DECISION_PLAN_NOT_FOUND",
        "Decision plan is missing for replay.",
      );
      const rankProof = await requireSnapshot(
        options.capacityRepositories.getRankProof(replayFixture.capacityRankProofRef),
        "RANK_PROOF_NOT_FOUND",
        "Rank proof is missing for replay.",
      );
      const candidates = (
        await options.capacityRepositories.listCandidatesForSnapshot(replayFixture.candidateSnapshotRef)
      ).map((row) => row.toSnapshot());
      const rerun = solveAlternativeOfferSet({
        hubCoordinationCaseId: session.hubCoordinationCaseId,
        candidateSnapshot,
        decisionPlan,
        rankProof,
        candidates,
        generatedAt: input.replayedAt,
        maxOfferCount: optimisationPlan.maxOfferCount,
      });
      const mismatchFields: string[] = [];
      if (rerun.offerSetHash !== replayFixture.offerSetHash) {
        mismatchFields.push("offerSetHash");
      }
      if (
        stableStringify(rerun.visibleCandidates.map((candidate) => candidate.candidateId)) !==
        stableStringify(replayFixture.visibleCandidateRefs)
      ) {
        mismatchFields.push("visibleCandidateRefs");
      }
      if (
        stableStringify(rerun.representedBucketKeys) !==
        stableStringify(replayFixture.representedBucketKeys)
      ) {
        mismatchFields.push("representedBucketKeys");
      }
      return {
        session,
        optimisationPlan,
        replayFixture,
        rerunVisibleCandidateRefs: rerun.visibleCandidates.map((candidate) => candidate.candidateId),
        rerunOfferSetHash: rerun.offerSetHash,
        matchesStoredSession: mismatchFields.length === 0,
        mismatchFields,
      };
    },
  };
}
