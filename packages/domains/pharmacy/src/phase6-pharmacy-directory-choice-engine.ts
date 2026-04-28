import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type PharmacyCaseBundle,
  type PharmacyPathwayCode,
  type PharmacyServiceType,
  type Phase6PharmacyCaseKernelService,
} from "./phase6-pharmacy-case-kernel";
import {
  createPhase6PharmacyEligibilityStore,
  type NamedPharmacyPathwayCode,
  type PathwayTimingGuardrailSnapshot,
  type Phase6PharmacyEligibilityStore,
} from "./phase6-pharmacy-eligibility-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_348 =
  "par_348_phase6_track_backend_build_pharmacy_directory_abstraction_and_provider_choice_pipeline" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task348 = typeof TASK_348;

export type PharmacyDiscoveryAdapterMode =
  | "dohs_service_search"
  | "eps_dos_legacy"
  | "local_registry_override"
  | "manual_directory_snapshot";

export type PharmacyDirectorySourceStatus = "success" | "partial" | "failed" | "superseded";

export type PharmacyDirectorySourceTrustClass =
  | "authoritative"
  | "strategic"
  | "legacy"
  | "manual_override";

export type PharmacyDirectoryFreshnessPosture = "current" | "degraded" | "stale" | "expired";

export type PharmacyDirectoryFailureClassification =
  | "none"
  | "timeout"
  | "auth_failed"
  | "source_unavailable"
  | "schema_mismatch"
  | "deprecated_source"
  | "manual_gap";

export type PharmacyTransportMode =
  | "bars_fhir"
  | "supplier_interop"
  | "nhsmail_shared_mailbox"
  | "mesh"
  | "manual_assisted_dispatch";

export type PharmacyProviderCapabilityState =
  | "direct_supported"
  | "manual_supported"
  | "unsupported";

export type PharmacyChoiceVisibilityState =
  | "recommended_visible"
  | "visible_with_warning"
  | "suppressed_unsafe"
  | "invalid_hidden";

export type PharmacyMinorIllnessSuitability =
  | "supported"
  | "manual_only"
  | "unsupported";

export type PharmacyOpeningState = "open_now" | "opens_later_today" | "closed" | "unknown";

export type PharmacyChoiceOverrideRequirementState =
  | "none"
  | "warned_choice_ack_required"
  | "policy_override_required";

export type PharmacyChoiceSessionState =
  | "choosing"
  | "selected_waiting_consent"
  | "consent_pending"
  | "superseded"
  | "recovery_required"
  | "completed";

export type PharmacyChoiceProjectionState =
  | "choosing"
  | "selected_waiting_consent"
  | "read_only_provenance"
  | "recovery_required";

export type PharmacyConsentCaptureChannel =
  | "patient_direct"
  | "staff_assisted"
  | "proxy_confirmed";

export type PharmacyConsentRecordState =
  | "granted"
  | "withdrawn"
  | "expired"
  | "superseded";

export type PharmacyConsentCheckpointState =
  | "satisfied"
  | "missing"
  | "refused"
  | "expired"
  | "withdrawn"
  | "superseded"
  | "revoked_post_dispatch"
  | "withdrawal_reconciliation";

export type PharmacyConsentContinuityState = "current" | "stale" | "blocked";

export type PharmacyConsentRevocationReasonClass =
  | "withdrawn_by_patient"
  | "pathway_drift"
  | "provider_drift"
  | "scope_drift"
  | "proof_superseded"
  | "post_dispatch_withdrawal";

export type PharmacyConsentRevocationState =
  | "pending"
  | "recorded"
  | "downstream_reconciliation"
  | "resolved";

export type PharmacyChoiceAudience = "patient" | "staff";

export type PharmacyChoiceRefreshMode = "if_current" | "if_stale" | "force_refresh";

export interface PharmacyLocationInput {
  postcodeDistrict: string;
  travelOriginRef?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PharmacyDirectorySourceSnapshot {
  directorySourceSnapshotId: string;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  adapterMode: PharmacyDiscoveryAdapterMode;
  adapterVersion: string;
  sourceLabel: string;
  sourceStatus: PharmacyDirectorySourceStatus;
  queryContextHash: string;
  rawResponseHash: string;
  rawResultCount: number;
  sourceTrustClass: PharmacyDirectorySourceTrustClass;
  sourceFreshnessPosture: PharmacyDirectoryFreshnessPosture;
  sourceFailureClassification: PharmacyDirectoryFailureClassification;
  normalizedSourceTimestamp: string;
  stalenessMinutes: number;
  requestTupleHash: string;
  capturedAt: string;
  version: number;
}

export interface PharmacyDirectoryRankingInputs {
  tauDelayMinutes: number;
  tauTravelMinutes: number;
  tauFreshMinutes: number;
  epsilonFloor: number;
  frontierToleranceRatio: number;
  lambdaPath: number;
  lambdaTiming: number;
  lambdaTravel: number;
  lambdaAccess: number;
  lambdaFresh: number;
}

export interface PharmacyDirectorySnapshot {
  directorySnapshotId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  serviceType: PharmacyServiceType;
  pathwayOrLane: PharmacyPathwayCode;
  timingGuardrailRef: AggregateRef<"PathwayTimingGuardrail", Task342>;
  sourceSnapshotRefs: readonly AggregateRef<"PharmacyDirectorySourceSnapshot", Task343>[];
  providerRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  providerCapabilitySnapshotRefs:
    readonly AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>[];
  visibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  recommendedProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  suppressedUnsafeProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  invalidHiddenProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  directoryTupleHash: string;
  candidateUniverseHash: string;
  rankingInputs: PharmacyDirectoryRankingInputs;
  snapshotState: "current" | "stale" | "superseded";
  capturedAt: string;
  version: number;
}

export interface PharmacyProviderCapabilitySnapshot {
  providerCapabilitySnapshotId: string;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  supportedTransportModes: readonly PharmacyTransportMode[];
  manualFallbackState: "not_needed" | "allowed" | "required" | "unavailable";
  capabilityEvidenceRefs: readonly string[];
  capabilityState: PharmacyProviderCapabilityState;
  capabilityTupleHash: string;
  capturedAt: string;
  version: number;
}

export interface PharmacyProviderContactWindow {
  windowStart: string;
  windowEnd: string;
}

export interface PharmacyProviderLocalityAndTravel {
  travelMinutes: number;
  travelBand: "local" | "nearby" | "far";
}

export interface PharmacyNormalizationProvenance {
  contributingSourceSnapshotRefs: readonly string[];
  normalizedByTrustRank: readonly string[];
  conflictFieldNames: readonly string[];
}

export interface PharmacyProvider {
  providerId: string;
  providerCapabilitySnapshotRef: AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>;
  odsCode: string;
  displayName: string;
  openingState: PharmacyOpeningState;
  nextSafeContactWindow: PharmacyProviderContactWindow;
  pathwaySuitability: readonly PharmacyPathwayCode[];
  minorIllnessSuitability: PharmacyMinorIllnessSuitability;
  dispatchCapabilityState: PharmacyProviderCapabilityState;
  accessibilityTags: readonly string[];
  contactEndpoints: readonly string[];
  consultationModeHints: readonly string[];
  localityAndTravelInputs: PharmacyProviderLocalityAndTravel;
  timingBand: 0 | 1 | 2;
  warningState:
    | "none"
    | "manual_route_warning"
    | "late_option_warning"
    | "policy_override_required";
  serviceFitClass: 0 | 1 | 2;
  recommendationScore: number;
  choiceVisibilityState: PharmacyChoiceVisibilityState;
  choiceExplanationRef: AggregateRef<"PharmacyChoiceExplanation", Task343> | null;
  overrideRequirementState: PharmacyChoiceOverrideRequirementState;
  normalizationProvenance: PharmacyNormalizationProvenance;
  version: number;
}

export interface PharmacyChoiceProof {
  pharmacyChoiceProofId: string;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  visibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  recommendedProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  warningVisibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  suppressedUnsafeProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  fullVisibleProviderCount: number;
  frontierToleranceRatio: number;
  rankingFormula: string;
  visibleChoiceSetHash: string;
  calculatedAt: string;
  version: number;
}

export interface PharmacyChoiceExplanation {
  pharmacyChoiceExplanationId: string;
  pharmacyChoiceProofRef: AggregateRef<"PharmacyChoiceProof", Task343>;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  rankOrdinal: number;
  serviceFitClass: 0 | 1 | 2;
  timingBand: 0 | 1 | 2;
  recommendationScore: number;
  visibilityDisposition: PharmacyChoiceVisibilityState;
  reasonCodeRefs: readonly string[];
  patientReasonCueRefs: readonly string[];
  staffExplanationRefs: readonly string[];
  warningCopyRef: string | null;
  suppressionReasonCodeRef: string | null;
  overrideRequirementState: PharmacyChoiceOverrideRequirementState;
  disclosureTupleHash: string;
  generatedAt: string;
  version: number;
}

export interface PharmacyChoiceDisclosurePolicy {
  pharmacyChoiceDisclosurePolicyId: string;
  choiceProofRef: AggregateRef<"PharmacyChoiceProof", Task343>;
  suppressedUnsafeSummaryRef: string;
  warnedChoicePolicyRef: string;
  hiddenStatePolicyRef: string;
  generatedAt: string;
  version: number;
}

export interface PharmacyChoiceOverrideAcknowledgement {
  pharmacyChoiceOverrideAcknowledgementId: string;
  choiceSessionRef: AggregateRef<"PharmacyChoiceSession", Task343>;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  overrideRequirementState: Exclude<
    PharmacyChoiceOverrideRequirementState,
    "none"
  >;
  acknowledgementScriptRef: string;
  actorRef: string;
  actorRole: "patient" | "staff";
  acknowledgedAt: string;
  version: number;
}

export interface PharmacyChoiceSession {
  pharmacyChoiceSessionId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  choiceProofRef: AggregateRef<"PharmacyChoiceProof", Task343>;
  choiceDisclosurePolicyRef: AggregateRef<"PharmacyChoiceDisclosurePolicy", Task343>;
  visibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  recommendedProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  selectedProviderExplanationRef: AggregateRef<"PharmacyChoiceExplanation", Task343> | null;
  selectedProviderCapabilitySnapshotRef:
    | AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>
    | null;
  overrideAcknowledgementRef:
    | AggregateRef<"PharmacyChoiceOverrideAcknowledgement", Task343>
    | null;
  patientOverrideRequired: boolean;
  selectionBindingHash: string | null;
  visibleChoiceSetHash: string;
  sessionState: PharmacyChoiceSessionState;
  directoryTupleHash: string;
  freshnessPosture: PharmacyDirectoryFreshnessPosture;
  revision: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PharmacyChoiceTruthProjection {
  pharmacyChoiceTruthProjectionId: string;
  pharmacyCaseId: string;
  choiceSessionRef: AggregateRef<"PharmacyChoiceSession", Task343>;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  choiceProofRef: AggregateRef<"PharmacyChoiceProof", Task343>;
  choiceDisclosurePolicyRef: AggregateRef<"PharmacyChoiceDisclosurePolicy", Task343>;
  directoryTupleHash: string;
  visibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  recommendedProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  warningVisibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[];
  suppressedUnsafeSummaryRef: string | null;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343> | null;
  selectedProviderExplanationRef: AggregateRef<"PharmacyChoiceExplanation", Task343> | null;
  selectedProviderCapabilitySnapshotRef:
    | AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>
    | null;
  patientOverrideRequired: boolean;
  overrideAcknowledgementRef:
    | AggregateRef<"PharmacyChoiceOverrideAcknowledgement", Task343>
    | null;
  selectionBindingHash: string | null;
  visibleChoiceSetHash: string;
  projectionState: PharmacyChoiceProjectionState;
  computedAt: string;
  version: number;
}

export interface PharmacyConsentRecord {
  pharmacyConsentRecordId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  pathwayOrLane: PharmacyPathwayCode;
  referralScope: string;
  choiceSessionRef: AggregateRef<"PharmacyChoiceSession", Task343>;
  choiceProofRef: AggregateRef<"PharmacyChoiceProof", Task343>;
  selectedExplanationRef: AggregateRef<"PharmacyChoiceExplanation", Task343>;
  overrideAcknowledgementRef:
    | AggregateRef<"PharmacyChoiceOverrideAcknowledgement", Task343>
    | null;
  selectionBindingHash: string;
  channel: PharmacyConsentCaptureChannel;
  consentScriptVersionRef: string;
  patientAwarenessOfGpVisibility: boolean;
  packageFingerprint: string | null;
  state: PharmacyConsentRecordState;
  grantedAt: string;
  supersededAt: string | null;
  version: number;
}

export interface PharmacyConsentCheckpoint {
  pharmacyConsentCheckpointId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  pathwayOrLane: PharmacyPathwayCode;
  referralScope: string;
  choiceProofRef: AggregateRef<"PharmacyChoiceProof", Task343>;
  selectedExplanationRef: AggregateRef<"PharmacyChoiceExplanation", Task343>;
  consentRecordRef: AggregateRef<"PharmacyConsentRecord", Task343> | null;
  latestRevocationRef:
    | AggregateRef<"PharmacyConsentRevocationRecord", Task343>
    | null;
  selectionBindingHash: string;
  packageFingerprint: string | null;
  checkpointState: PharmacyConsentCheckpointState;
  continuityState: PharmacyConsentContinuityState;
  evaluatedAt: string;
  version: number;
}

export interface PharmacyConsentRevocationRecord {
  pharmacyConsentRevocationRecordId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  consentRecordRef: AggregateRef<"PharmacyConsentRecord", Task343>;
  reasonClass: PharmacyConsentRevocationReasonClass;
  revocationState: PharmacyConsentRevocationState;
  recordedAt: string;
  version: number;
}

export interface PharmacyDirectoryChoiceBundle {
  directorySnapshot: PharmacyDirectorySnapshot;
  sourceSnapshots: readonly PharmacyDirectorySourceSnapshot[];
  providerCapabilitySnapshots: readonly PharmacyProviderCapabilitySnapshot[];
  providers: readonly PharmacyProvider[];
  choiceProof: PharmacyChoiceProof;
  choiceExplanations: readonly PharmacyChoiceExplanation[];
  choiceDisclosurePolicy: PharmacyChoiceDisclosurePolicy;
  choiceSession: PharmacyChoiceSession;
  choiceTruthProjection: PharmacyChoiceTruthProjection;
  replayed: boolean;
}

export interface PharmacySelectionResult {
  choiceSession: PharmacyChoiceSession;
  choiceTruthProjection: PharmacyChoiceTruthProjection;
  selectedProvider: PharmacyProvider;
  selectedExplanation: PharmacyChoiceExplanation;
  caseMutation: Awaited<
    ReturnType<Phase6PharmacyCaseKernelService["choosePharmacyProvider"]>
  >;
  replayed: boolean;
}

export interface PharmacyWarnedChoiceAcknowledgementResult {
  acknowledgement: PharmacyChoiceOverrideAcknowledgement;
  choiceSession: PharmacyChoiceSession;
  choiceTruthProjection: PharmacyChoiceTruthProjection;
  replayed: boolean;
}

export interface PharmacyConsentCaptureResult {
  consentRecord: PharmacyConsentRecord;
  consentCheckpoint: PharmacyConsentCheckpoint;
  choiceSession: PharmacyChoiceSession;
  choiceTruthProjection: PharmacyChoiceTruthProjection;
  replayed: boolean;
}

export interface PharmacyConsentRevocationResult {
  revocationRecord: PharmacyConsentRevocationRecord;
  consentCheckpoint: PharmacyConsentCheckpoint;
  choiceSession: PharmacyChoiceSession;
  choiceTruthProjection: PharmacyChoiceTruthProjection;
  replayed: boolean;
}

export interface PharmacyDiscoveryAdapterProviderCandidate {
  odsCode: string;
  displayName: string;
  openingState: PharmacyOpeningState;
  nextSafeContactWindow: PharmacyProviderContactWindow;
  pathwaySuitability: readonly PharmacyPathwayCode[];
  minorIllnessSuitability: PharmacyMinorIllnessSuitability;
  supportedTransportModes: readonly PharmacyTransportMode[];
  manualFallbackState: "not_needed" | "allowed" | "required" | "unavailable";
  accessibilityTags: readonly string[];
  contactEndpoints: readonly string[];
  consultationModeHints: readonly string[];
  localityAndTravelInputs: PharmacyProviderLocalityAndTravel;
  organisationalValidity: "valid" | "invalid";
  serviceCommissioningState: "commissioned" | "manual_only" | "not_commissioned";
  accessScore?: number | null;
  evidenceRefs?: readonly string[];
}

export interface PharmacyDiscoveryAdapterQuery {
  pharmacyCaseId: string;
  location: PharmacyLocationInput;
  serviceType: PharmacyServiceType;
  pathwayOrLane: PharmacyPathwayCode;
  evaluatedAt: string;
}

export interface PharmacyDiscoveryAdapterResponse {
  adapterMode: PharmacyDiscoveryAdapterMode;
  adapterVersion: string;
  sourceLabel: string;
  sourceStatus: PharmacyDirectorySourceStatus;
  requestTupleHash: string;
  rawResponseHash: string;
  normalizedSourceTimestamp: string;
  sourceTrustClass: PharmacyDirectorySourceTrustClass;
  sourceFreshnessPosture: PharmacyDirectoryFreshnessPosture;
  sourceFailureClassification: PharmacyDirectoryFailureClassification;
  stalenessMinutes: number;
  providers: readonly PharmacyDiscoveryAdapterProviderCandidate[];
}

export interface PharmacyDiscoveryAdapter {
  readonly mode: PharmacyDiscoveryAdapterMode;
  readonly version: string;
  discover(query: PharmacyDiscoveryAdapterQuery): Promise<PharmacyDiscoveryAdapterResponse>;
}

export interface DirectoryChoiceRankingPolicy {
  tauDelayMinutes: number;
  tauTravelMinutes: number;
  tauFreshMinutes: number;
  epsilonFloor: number;
  frontierToleranceRatio: number;
  lambdaPath: number;
  lambdaTiming: number;
  lambdaTravel: number;
  lambdaAccess: number;
  lambdaFresh: number;
}

export const defaultDirectoryChoiceRankingPolicy = {
  tauDelayMinutes: 240,
  tauTravelMinutes: 25,
  tauFreshMinutes: 240,
  epsilonFloor: 0.001,
  frontierToleranceRatio: 0.05,
  lambdaPath: 0.32,
  lambdaTiming: 0.28,
  lambdaTravel: 0.16,
  lambdaAccess: 0.12,
  lambdaFresh: 0.12,
} as const satisfies DirectoryChoiceRankingPolicy;

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

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

function ensureProbability(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function clampProbability(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return Number(value.toFixed(6));
}

function canonicalStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
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

function trustRank(trustClass: PharmacyDirectorySourceTrustClass): number {
  switch (trustClass) {
    case "manual_override":
      return 4;
    case "authoritative":
      return 3;
    case "strategic":
      return 2;
    case "legacy":
      return 1;
  }
}

function freshnessPostureForMinutes(minutes: number): PharmacyDirectoryFreshnessPosture {
  if (minutes <= 60) {
    return "current";
  }
  if (minutes <= 240) {
    return "degraded";
  }
  if (minutes <= 1_440) {
    return "stale";
  }
  return "expired";
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function normalizeLocationInput(input: PharmacyLocationInput): PharmacyLocationInput {
  return {
    postcodeDistrict: requireText(input.postcodeDistrict, "postcodeDistrict").toUpperCase(),
    travelOriginRef: optionalText(input.travelOriginRef),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };
}

function stableLocationHash(location: PharmacyLocationInput): string {
  return sha256Hex(
    canonicalStringify({
      postcodeDistrict: location.postcodeDistrict,
      travelOriginRef: location.travelOriginRef,
      latitudeBucket:
        location.latitude === null || location.latitude === undefined
          ? null
          : Number(location.latitude.toFixed(3)),
      longitudeBucket:
        location.longitude === null || location.longitude === undefined
          ? null
          : Number(location.longitude.toFixed(3)),
    }),
  );
}

function minutesBetween(leftIso: string, rightIso: string): number {
  const diff = Date.parse(rightIso) - Date.parse(leftIso);
  return Math.max(0, Math.round(diff / 60_000));
}

function ratingForTravelBand(travelMinutes: number): PharmacyProviderLocalityAndTravel["travelBand"] {
  if (travelMinutes <= 15) {
    return "local";
  }
  if (travelMinutes <= 30) {
    return "nearby";
  }
  return "far";
}

function normalizeContactWindow(input: PharmacyProviderContactWindow, field: string): PharmacyProviderContactWindow {
  const windowStart = ensureIsoTimestamp(input.windowStart, `${field}.windowStart`);
  const windowEnd = ensureIsoTimestamp(input.windowEnd, `${field}.windowEnd`);
  invariant(
    compareIso(windowStart, windowEnd) <= 0,
    `INVALID_${field.toUpperCase()}_WINDOW`,
    `${field} must end on or after its start time.`,
  );
  return {
    windowStart,
    windowEnd,
  };
}

function normalizeProviderCandidate(
  input: PharmacyDiscoveryAdapterProviderCandidate,
): PharmacyDiscoveryAdapterProviderCandidate {
  return {
    odsCode: requireText(input.odsCode, "odsCode").toUpperCase(),
    displayName: requireText(input.displayName, "displayName"),
    openingState: input.openingState,
    nextSafeContactWindow: normalizeContactWindow(
      input.nextSafeContactWindow,
      `${input.odsCode}.nextSafeContactWindow`,
    ),
    pathwaySuitability: [...new Set(input.pathwaySuitability)].sort() as readonly PharmacyPathwayCode[],
    minorIllnessSuitability: input.minorIllnessSuitability,
    supportedTransportModes: [...new Set(input.supportedTransportModes)].sort() as readonly PharmacyTransportMode[],
    manualFallbackState: input.manualFallbackState,
    accessibilityTags: sortedUnique(input.accessibilityTags),
    contactEndpoints: sortedUnique(input.contactEndpoints),
    consultationModeHints: sortedUnique(input.consultationModeHints),
    localityAndTravelInputs: {
      travelMinutes: ensureNonNegativeInteger(
        Math.round(input.localityAndTravelInputs.travelMinutes),
        `${input.odsCode}.travelMinutes`,
      ),
      travelBand: input.localityAndTravelInputs.travelBand,
    },
    organisationalValidity: input.organisationalValidity,
    serviceCommissioningState: input.serviceCommissioningState,
    accessScore:
      input.accessScore === null || input.accessScore === undefined
        ? null
        : ensureProbability(input.accessScore, `${input.odsCode}.accessScore`),
    evidenceRefs: sortedUnique(input.evidenceRefs ?? []),
  };
}

function normalizeAdapterResponse(
  input: PharmacyDiscoveryAdapterResponse,
): PharmacyDiscoveryAdapterResponse {
  return {
    adapterMode: input.adapterMode,
    adapterVersion: requireText(input.adapterVersion, "adapterVersion"),
    sourceLabel: requireText(input.sourceLabel, "sourceLabel"),
    sourceStatus: input.sourceStatus,
    requestTupleHash: requireText(input.requestTupleHash, "requestTupleHash"),
    rawResponseHash: requireText(input.rawResponseHash, "rawResponseHash"),
    normalizedSourceTimestamp: ensureIsoTimestamp(
      input.normalizedSourceTimestamp,
      "normalizedSourceTimestamp",
    ),
    sourceTrustClass: input.sourceTrustClass,
    sourceFreshnessPosture: input.sourceFreshnessPosture,
    sourceFailureClassification: input.sourceFailureClassification,
    stalenessMinutes: ensureNonNegativeInteger(input.stalenessMinutes, "stalenessMinutes"),
    providers: input.providers.map(normalizeProviderCandidate),
  };
}

export function createStaticPharmacyDiscoveryAdapter(input: {
  mode: PharmacyDiscoveryAdapterMode;
  version: string;
  sourceLabel: string;
  sourceTrustClass: PharmacyDirectorySourceTrustClass;
  sourceFailureClassification?: PharmacyDirectoryFailureClassification;
  providers: readonly PharmacyDiscoveryAdapterProviderCandidate[];
  capturedAt?: string;
}): PharmacyDiscoveryAdapter {
  const normalizedProviders = input.providers.map(normalizeProviderCandidate);
  return {
    mode: input.mode,
    version: input.version,
    async discover(query) {
      const location = normalizeLocationInput(query.location);
      const capturedAt = ensureIsoTimestamp(
        input.capturedAt ?? query.evaluatedAt,
        "capturedAt",
      );
      const rawResponseHash = sha256Hex(
        canonicalStringify({
          mode: input.mode,
          version: input.version,
          providers: normalizedProviders,
          capturedAt,
        }),
      );
      const stalenessMinutes = minutesBetween(capturedAt, query.evaluatedAt);
      return normalizeAdapterResponse({
        adapterMode: input.mode,
        adapterVersion: input.version,
        sourceLabel: input.sourceLabel,
        sourceStatus: "success",
        requestTupleHash: sha256Hex(
          canonicalStringify({
            pharmacyCaseId: query.pharmacyCaseId,
            location,
            serviceType: query.serviceType,
            pathwayOrLane: query.pathwayOrLane,
          }),
        ),
        rawResponseHash,
        normalizedSourceTimestamp: capturedAt,
        sourceTrustClass: input.sourceTrustClass,
        sourceFreshnessPosture: freshnessPostureForMinutes(stalenessMinutes),
        sourceFailureClassification: input.sourceFailureClassification ?? "none",
        stalenessMinutes,
        providers: normalizedProviders,
      });
    },
  };
}

function providerChoiceReplayKey(input: {
  pharmacyCaseId: string;
  location: PharmacyLocationInput;
  audience: PharmacyChoiceAudience;
  refreshMode: PharmacyChoiceRefreshMode;
  evaluatedAt: string;
}): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    location: normalizeLocationInput(input.location),
    audience: input.audience,
    refreshMode: input.refreshMode,
    evaluatedAt: input.evaluatedAt,
  });
}

function selectionReplayKey(input: {
  pharmacyCaseId: string;
  providerRef: string;
  expectedChoiceRevision: number;
}): string {
  return stableReviewDigest(input);
}

function consentReplayKey(input: {
  pharmacyCaseId: string;
  consentScriptVersion: string;
  expectedSelectionBindingHash: string;
}): string {
  return stableReviewDigest(input);
}

function acknowledgementReplayKey(input: {
  pharmacyCaseId: string;
  providerRef: string;
  scriptRef: string;
  actorRef: string;
}): string {
  return stableReviewDigest(input);
}

function revocationReplayKey(input: {
  pharmacyCaseId: string;
  reasonCode: string;
  actorRef: string;
}): string {
  return stableReviewDigest(input);
}

function resolveServiceFitClass(input: {
  provider: PharmacyDiscoveryAdapterProviderCandidate;
  serviceType: PharmacyServiceType;
  pathwayOrLane: PharmacyPathwayCode;
  capabilityState: PharmacyProviderCapabilityState;
}): 0 | 1 | 2 {
  if (
    input.serviceType === "clinical_pathway_consultation" &&
    input.provider.pathwaySuitability.includes(input.pathwayOrLane)
  ) {
    return 2;
  }
  if (input.serviceType === "minor_illness_fallback") {
    if (input.provider.minorIllnessSuitability === "supported") {
      return 2;
    }
    if (input.provider.minorIllnessSuitability === "manual_only") {
      return 1;
    }
  }
  if (
    input.provider.serviceCommissioningState === "manual_only" ||
    input.capabilityState === "manual_supported"
  ) {
    return 1;
  }
  return 0;
}

function computeCapabilityState(
  candidate: PharmacyDiscoveryAdapterProviderCandidate,
): PharmacyProviderCapabilityState {
  if (candidate.organisationalValidity === "invalid") {
    return "unsupported";
  }
  if (
    candidate.supportedTransportModes.some((mode) => mode !== "manual_assisted_dispatch")
  ) {
    return "direct_supported";
  }
  if (
    candidate.manualFallbackState === "allowed" ||
    candidate.manualFallbackState === "required" ||
    candidate.serviceCommissioningState === "manual_only" ||
    candidate.minorIllnessSuitability === "manual_only"
  ) {
    return "manual_supported";
  }
  return "unsupported";
}

function resolveTimingBand(input: {
  now: string;
  nextSafeContactWindow: PharmacyProviderContactWindow;
  guardrail: PathwayTimingGuardrailSnapshot;
}): 0 | 1 | 2 {
  const readyAt =
    compareIso(input.nextSafeContactWindow.windowStart, input.now) < 0
      ? input.now
      : input.nextSafeContactWindow.windowStart;
  const delay = minutesBetween(input.now, readyAt);
  if (delay <= input.guardrail.maxRecommendedDelayMinutes) {
    return 2;
  }
  if (delay <= input.guardrail.maxAllowedDelayMinutes) {
    return 1;
  }
  return 0;
}

function buildSelectionBindingHash(input: {
  choiceSessionId: string;
  directorySnapshotRef: string;
  choiceProofRef: string;
  disclosurePolicyRef: string;
  selectedProviderRef: string;
  selectedProviderExplanationRef: string;
  selectedCapabilitySnapshotRef: string;
  visibleChoiceSetHash: string;
}): string {
  return sha256Hex(canonicalStringify(input));
}

interface CommandReplayRecord {
  replayKey: string;
  resultKind:
    | "choice_bundle"
    | "selection"
    | "acknowledgement"
    | "consent"
    | "revocation";
  resultRefId: string;
  version: number;
}

export interface Phase6PharmacyDirectoryChoiceRepositories {
  getDirectorySnapshot(
    directorySnapshotId: string,
  ): Promise<SnapshotDocument<PharmacyDirectorySnapshot> | null>;
  getLatestDirectorySnapshotForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDirectorySnapshot> | null>;
  listDirectorySnapshotsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyDirectorySnapshot>[]>;
  saveDirectorySnapshot(
    snapshot: PharmacyDirectorySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDirectorySourceSnapshot(
    directorySourceSnapshotId: string,
  ): Promise<SnapshotDocument<PharmacyDirectorySourceSnapshot> | null>;
  listDirectorySourceSnapshots(
    directorySnapshotId: string,
  ): Promise<readonly SnapshotDocument<PharmacyDirectorySourceSnapshot>[]>;
  saveDirectorySourceSnapshot(
    snapshot: PharmacyDirectorySourceSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getProviderCapabilitySnapshot(
    providerCapabilitySnapshotId: string,
  ): Promise<SnapshotDocument<PharmacyProviderCapabilitySnapshot> | null>;
  listProviderCapabilitySnapshots(
    directorySnapshotId: string,
  ): Promise<readonly SnapshotDocument<PharmacyProviderCapabilitySnapshot>[]>;
  saveProviderCapabilitySnapshot(
    snapshot: PharmacyProviderCapabilitySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getProvider(providerId: string): Promise<SnapshotDocument<PharmacyProvider> | null>;
  listProviders(
    directorySnapshotId: string,
  ): Promise<readonly SnapshotDocument<PharmacyProvider>[]>;
  saveProvider(snapshot: PharmacyProvider, options?: CompareAndSetWriteOptions): Promise<void>;
  getChoiceProof(
    pharmacyChoiceProofId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceProof> | null>;
  saveChoiceProof(
    snapshot: PharmacyChoiceProof,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getChoiceExplanation(
    pharmacyChoiceExplanationId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceExplanation> | null>;
  listChoiceExplanations(
    pharmacyChoiceProofId: string,
  ): Promise<readonly SnapshotDocument<PharmacyChoiceExplanation>[]>;
  saveChoiceExplanation(
    snapshot: PharmacyChoiceExplanation,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDisclosurePolicy(
    pharmacyChoiceDisclosurePolicyId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceDisclosurePolicy> | null>;
  saveDisclosurePolicy(
    snapshot: PharmacyChoiceDisclosurePolicy,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getChoiceSession(
    pharmacyChoiceSessionId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceSession> | null>;
  getLatestChoiceSessionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceSession> | null>;
  saveChoiceSession(
    snapshot: PharmacyChoiceSession,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getChoiceTruthProjection(
    pharmacyChoiceTruthProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceTruthProjection> | null>;
  getLatestChoiceTruthProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceTruthProjection> | null>;
  saveChoiceTruthProjection(
    snapshot: PharmacyChoiceTruthProjection,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getOverrideAcknowledgement(
    acknowledgementId: string,
  ): Promise<SnapshotDocument<PharmacyChoiceOverrideAcknowledgement> | null>;
  saveOverrideAcknowledgement(
    snapshot: PharmacyChoiceOverrideAcknowledgement,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestConsentRecordForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyConsentRecord> | null>;
  getConsentRecord(
    pharmacyConsentRecordId: string,
  ): Promise<SnapshotDocument<PharmacyConsentRecord> | null>;
  saveConsentRecord(
    snapshot: PharmacyConsentRecord,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestConsentCheckpointForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyConsentCheckpoint> | null>;
  getConsentCheckpoint(
    pharmacyConsentCheckpointId: string,
  ): Promise<SnapshotDocument<PharmacyConsentCheckpoint> | null>;
  saveConsentCheckpoint(
    snapshot: PharmacyConsentCheckpoint,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getConsentRevocationRecord(
    pharmacyConsentRevocationRecordId: string,
  ): Promise<SnapshotDocument<PharmacyConsentRevocationRecord> | null>;
  getLatestConsentRevocationForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyConsentRevocationRecord> | null>;
  saveConsentRevocationRecord(
    snapshot: PharmacyConsentRevocationRecord,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCommandReplay(
    replayKey: string,
  ): Promise<SnapshotDocument<CommandReplayRecord> | null>;
  saveCommandReplay(
    replay: CommandReplayRecord,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface Phase6PharmacyDirectoryChoiceStore
  extends Phase6PharmacyDirectoryChoiceRepositories {}

export function createPhase6PharmacyDirectoryChoiceStore(): Phase6PharmacyDirectoryChoiceStore {
  const directorySnapshots = new Map<string, PharmacyDirectorySnapshot>();
  const latestDirectorySnapshotByCase = new Map<string, string>();
  const directorySourceSnapshots = new Map<string, PharmacyDirectorySourceSnapshot>();
  const directorySourceRefsBySnapshot = new Map<string, string[]>();
  const providerCapabilitySnapshots = new Map<string, PharmacyProviderCapabilitySnapshot>();
  const capabilityRefsBySnapshot = new Map<string, string[]>();
  const providers = new Map<string, PharmacyProvider>();
  const choiceProofs = new Map<string, PharmacyChoiceProof>();
  const choiceExplanations = new Map<string, PharmacyChoiceExplanation>();
  const choiceExplanationRefsByProof = new Map<string, string[]>();
  const disclosurePolicies = new Map<string, PharmacyChoiceDisclosurePolicy>();
  const choiceSessions = new Map<string, PharmacyChoiceSession>();
  const latestChoiceSessionByCase = new Map<string, string>();
  const truthProjections = new Map<string, PharmacyChoiceTruthProjection>();
  const latestTruthProjectionByCase = new Map<string, string>();
  const overrideAcknowledgements = new Map<string, PharmacyChoiceOverrideAcknowledgement>();
  const consentRecords = new Map<string, PharmacyConsentRecord>();
  const latestConsentRecordByCase = new Map<string, string>();
  const consentCheckpoints = new Map<string, PharmacyConsentCheckpoint>();
  const latestConsentCheckpointByCase = new Map<string, string>();
  const consentRevocations = new Map<string, PharmacyConsentRevocationRecord>();
  const latestConsentRevocationByCase = new Map<string, string>();
  const commandReplays = new Map<string, CommandReplayRecord>();

  return {
    async getDirectorySnapshot(directorySnapshotId) {
      const snapshot = directorySnapshots.get(directorySnapshotId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getLatestDirectorySnapshotForCase(pharmacyCaseId) {
      const id = latestDirectorySnapshotByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(directorySnapshots.get(id)!);
    },

    async listDirectorySnapshotsForCase(pharmacyCaseId) {
      return [...directorySnapshots.values()]
        .filter((snapshot) => snapshot.pharmacyCaseRef.refId === pharmacyCaseId)
        .sort((left, right) => compareIso(left.capturedAt, right.capturedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveDirectorySnapshot(snapshot, options) {
      saveWithCas(directorySnapshots, snapshot.directorySnapshotId, structuredClone(snapshot), options);
      latestDirectorySnapshotByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.directorySnapshotId);
    },

    async getDirectorySourceSnapshot(directorySourceSnapshotId) {
      const snapshot = directorySourceSnapshots.get(directorySourceSnapshotId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listDirectorySourceSnapshots(directorySnapshotId) {
      const refs = directorySourceRefsBySnapshot.get(directorySnapshotId) ?? [];
      return refs
        .map((id) => directorySourceSnapshots.get(id))
        .filter((snapshot): snapshot is PharmacyDirectorySourceSnapshot => snapshot !== undefined)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveDirectorySourceSnapshot(snapshot, options) {
      saveWithCas(
        directorySourceSnapshots,
        snapshot.directorySourceSnapshotId,
        structuredClone(snapshot),
        options,
      );
      const refs = new Set(directorySourceRefsBySnapshot.get(snapshot.directorySnapshotRef.refId) ?? []);
      refs.add(snapshot.directorySourceSnapshotId);
      directorySourceRefsBySnapshot.set(snapshot.directorySnapshotRef.refId, [...refs].sort());
    },

    async getProviderCapabilitySnapshot(providerCapabilitySnapshotId) {
      const snapshot = providerCapabilitySnapshots.get(providerCapabilitySnapshotId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listProviderCapabilitySnapshots(directorySnapshotId) {
      const refs = capabilityRefsBySnapshot.get(directorySnapshotId) ?? [];
      return refs
        .map((id) => providerCapabilitySnapshots.get(id))
        .filter((snapshot): snapshot is PharmacyProviderCapabilitySnapshot => snapshot !== undefined)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveProviderCapabilitySnapshot(snapshot, options) {
      saveWithCas(
        providerCapabilitySnapshots,
        snapshot.providerCapabilitySnapshotId,
        structuredClone(snapshot),
        options,
      );
      const refs = new Set(capabilityRefsBySnapshot.get(snapshot.directorySnapshotRef.refId) ?? []);
      refs.add(snapshot.providerCapabilitySnapshotId);
      capabilityRefsBySnapshot.set(snapshot.directorySnapshotRef.refId, [...refs].sort());
    },

    async getProvider(providerId) {
      const snapshot = providers.get(providerId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listProviders(directorySnapshotId) {
      return [...providers.values()]
        .filter((provider) => {
          const capabilitySnapshot = providerCapabilitySnapshots.get(
            provider.providerCapabilitySnapshotRef.refId,
          );
          return capabilitySnapshot?.directorySnapshotRef.refId === directorySnapshotId;
        })
        .sort((left, right) => left.displayName.localeCompare(right.displayName))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveProvider(snapshot, options) {
      saveWithCas(providers, snapshot.providerId, structuredClone(snapshot), options);
    },

    async getChoiceProof(pharmacyChoiceProofId) {
      const snapshot = choiceProofs.get(pharmacyChoiceProofId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveChoiceProof(snapshot, options) {
      saveWithCas(choiceProofs, snapshot.pharmacyChoiceProofId, structuredClone(snapshot), options);
    },

    async getChoiceExplanation(pharmacyChoiceExplanationId) {
      const snapshot = choiceExplanations.get(pharmacyChoiceExplanationId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listChoiceExplanations(pharmacyChoiceProofId) {
      const refs = choiceExplanationRefsByProof.get(pharmacyChoiceProofId) ?? [];
      return refs
        .map((id) => choiceExplanations.get(id))
        .filter((snapshot): snapshot is PharmacyChoiceExplanation => snapshot !== undefined)
        .sort((left, right) => left.rankOrdinal - right.rankOrdinal)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveChoiceExplanation(snapshot, options) {
      saveWithCas(
        choiceExplanations,
        snapshot.pharmacyChoiceExplanationId,
        structuredClone(snapshot),
        options,
      );
      const refs = new Set(choiceExplanationRefsByProof.get(snapshot.pharmacyChoiceProofRef.refId) ?? []);
      refs.add(snapshot.pharmacyChoiceExplanationId);
      choiceExplanationRefsByProof.set(snapshot.pharmacyChoiceProofRef.refId, [...refs].sort());
    },

    async getDisclosurePolicy(pharmacyChoiceDisclosurePolicyId) {
      const snapshot = disclosurePolicies.get(pharmacyChoiceDisclosurePolicyId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveDisclosurePolicy(snapshot, options) {
      saveWithCas(
        disclosurePolicies,
        snapshot.pharmacyChoiceDisclosurePolicyId,
        structuredClone(snapshot),
        options,
      );
    },

    async getChoiceSession(pharmacyChoiceSessionId) {
      const snapshot = choiceSessions.get(pharmacyChoiceSessionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getLatestChoiceSessionForCase(pharmacyCaseId) {
      const id = latestChoiceSessionByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(choiceSessions.get(id)!);
    },

    async saveChoiceSession(snapshot, options) {
      saveWithCas(choiceSessions, snapshot.pharmacyChoiceSessionId, structuredClone(snapshot), options);
      latestChoiceSessionByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyChoiceSessionId);
    },

    async getChoiceTruthProjection(pharmacyChoiceTruthProjectionId) {
      const snapshot = truthProjections.get(pharmacyChoiceTruthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getLatestChoiceTruthProjectionForCase(pharmacyCaseId) {
      const id = latestTruthProjectionByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(truthProjections.get(id)!);
    },

    async saveChoiceTruthProjection(snapshot, options) {
      saveWithCas(
        truthProjections,
        snapshot.pharmacyChoiceTruthProjectionId,
        structuredClone(snapshot),
        options,
      );
      latestTruthProjectionByCase.set(snapshot.pharmacyCaseId, snapshot.pharmacyChoiceTruthProjectionId);
    },

    async getOverrideAcknowledgement(acknowledgementId) {
      const snapshot = overrideAcknowledgements.get(acknowledgementId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveOverrideAcknowledgement(snapshot, options) {
      saveWithCas(
        overrideAcknowledgements,
        snapshot.pharmacyChoiceOverrideAcknowledgementId,
        structuredClone(snapshot),
        options,
      );
    },

    async getLatestConsentRecordForCase(pharmacyCaseId) {
      const id = latestConsentRecordByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(consentRecords.get(id)!);
    },

    async getConsentRecord(pharmacyConsentRecordId) {
      const snapshot = consentRecords.get(pharmacyConsentRecordId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveConsentRecord(snapshot, options) {
      saveWithCas(consentRecords, snapshot.pharmacyConsentRecordId, structuredClone(snapshot), options);
      latestConsentRecordByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyConsentRecordId);
    },

    async getLatestConsentCheckpointForCase(pharmacyCaseId) {
      const id = latestConsentCheckpointByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(consentCheckpoints.get(id)!);
    },

    async getConsentCheckpoint(pharmacyConsentCheckpointId) {
      const snapshot = consentCheckpoints.get(pharmacyConsentCheckpointId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveConsentCheckpoint(snapshot, options) {
      saveWithCas(consentCheckpoints, snapshot.pharmacyConsentCheckpointId, structuredClone(snapshot), options);
      latestConsentCheckpointByCase.set(snapshot.pharmacyCaseRef.refId, snapshot.pharmacyConsentCheckpointId);
    },

    async getConsentRevocationRecord(pharmacyConsentRevocationRecordId) {
      const snapshot = consentRevocations.get(pharmacyConsentRevocationRecordId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getLatestConsentRevocationForCase(pharmacyCaseId) {
      const id = latestConsentRevocationByCase.get(pharmacyCaseId);
      return id === undefined ? null : new StoredDocument(consentRevocations.get(id)!);
    },

    async saveConsentRevocationRecord(snapshot, options) {
      saveWithCas(
        consentRevocations,
        snapshot.pharmacyConsentRevocationRecordId,
        structuredClone(snapshot),
        options,
      );
      latestConsentRevocationByCase.set(
        snapshot.pharmacyCaseRef.refId,
        snapshot.pharmacyConsentRevocationRecordId,
      );
    },

    async getCommandReplay(replayKey) {
      const snapshot = commandReplays.get(replayKey);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveCommandReplay(replay, options) {
      saveWithCas(commandReplays, replay.replayKey, structuredClone(replay), options);
    },
  };
}

function currentCheckpointState(record: PharmacyConsentRecord | null): PharmacyConsentCheckpointState {
  if (record === null) {
    return "missing";
  }
  switch (record.state) {
    case "granted":
      return "satisfied";
    case "withdrawn":
      return "withdrawn";
    case "expired":
      return "expired";
    case "superseded":
      return "superseded";
  }
}

function stateToProjection(session: PharmacyChoiceSession): PharmacyChoiceProjectionState {
  switch (session.sessionState) {
    case "choosing":
      return "choosing";
    case "selected_waiting_consent":
    case "consent_pending":
      return "selected_waiting_consent";
    case "completed":
    case "superseded":
      return "read_only_provenance";
    case "recovery_required":
      return "recovery_required";
  }
}

function reasonCodeToRevocationClass(
  reasonCode: string,
): PharmacyConsentRevocationReasonClass {
  const normalized = reasonCode.toLowerCase();
  if (normalized.includes("withdraw")) {
    return "withdrawn_by_patient";
  }
  if (normalized.includes("provider")) {
    return "provider_drift";
  }
  if (normalized.includes("pathway")) {
    return "pathway_drift";
  }
  if (normalized.includes("scope")) {
    return "scope_drift";
  }
  if (normalized.includes("dispatch")) {
    return "post_dispatch_withdrawal";
  }
  return "proof_superseded";
}

function detectMaterialDriftReason(
  previousSession: PharmacyChoiceSession,
  nextVisibleChoiceSetHash: string,
  nextVisibleProviderRefs: readonly AggregateRef<"PharmacyProvider", Task343>[],
): PharmacyConsentRevocationReasonClass | null {
  if (previousSession.selectedProviderRef === null) {
    return null;
  }
  const selectedProviderStillVisible = nextVisibleProviderRefs.some(
    (ref) => ref.refId === previousSession.selectedProviderRef?.refId,
  );
  if (!selectedProviderStillVisible) {
    return "provider_drift";
  }
  if (previousSession.visibleChoiceSetHash !== nextVisibleChoiceSetHash) {
    return "proof_superseded";
  }
  return null;
}

async function requireCaseBundle(
  caseKernelService: Phase6PharmacyCaseKernelService,
  pharmacyCaseId: string,
): Promise<PharmacyCaseBundle> {
  const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
  invariant(bundle, "PHARMACY_CASE_NOT_FOUND", "PharmacyCase was not found.");
  return bundle;
}

async function requireChoiceSession(
  repositories: Phase6PharmacyDirectoryChoiceRepositories,
  pharmacyCaseId: string,
): Promise<PharmacyChoiceSession> {
  const document = await repositories.getLatestChoiceSessionForCase(pharmacyCaseId);
  invariant(document, "CHOICE_SESSION_NOT_FOUND", "PharmacyChoiceSession was not found.");
  return document.toSnapshot();
}

async function requireChoiceTruthProjection(
  repositories: Phase6PharmacyDirectoryChoiceRepositories,
  pharmacyCaseId: string,
): Promise<PharmacyChoiceTruthProjection> {
  const document = await repositories.getLatestChoiceTruthProjectionForCase(pharmacyCaseId);
  invariant(
    document,
    "CHOICE_TRUTH_PROJECTION_NOT_FOUND",
    "PharmacyChoiceTruthProjection was not found.",
  );
  return document.toSnapshot();
}

async function requireChoiceProof(
  repositories: Phase6PharmacyDirectoryChoiceRepositories,
  choiceProofId: string,
): Promise<PharmacyChoiceProof> {
  const document = await repositories.getChoiceProof(choiceProofId);
  invariant(document, "CHOICE_PROOF_NOT_FOUND", "PharmacyChoiceProof was not found.");
  return document.toSnapshot();
}

async function requireProvider(
  repositories: Phase6PharmacyDirectoryChoiceRepositories,
  providerId: string,
): Promise<PharmacyProvider> {
  const document = await repositories.getProvider(providerId);
  invariant(document, "PROVIDER_NOT_FOUND", "PharmacyProvider was not found.");
  return document.toSnapshot();
}

async function requireChoiceExplanation(
  repositories: Phase6PharmacyDirectoryChoiceRepositories,
  explanationId: string,
): Promise<PharmacyChoiceExplanation> {
  const document = await repositories.getChoiceExplanation(explanationId);
  invariant(
    document,
    "CHOICE_EXPLANATION_NOT_FOUND",
    "PharmacyChoiceExplanation was not found.",
  );
  return document.toSnapshot();
}

async function resolveEvaluationAndGuardrail(input: {
  pharmacyCase: PharmacyCaseBundle["pharmacyCase"];
  eligibilityRepositories: Phase6PharmacyEligibilityStore;
}): Promise<{
  pathwayOrLane: PharmacyPathwayCode;
  timingGuardrailRef: AggregateRef<"PathwayTimingGuardrail", Task342>;
  timingGuardrail: PathwayTimingGuardrailSnapshot;
}> {
  const evaluationDocument =
    input.pharmacyCase.eligibilityRef === null
      ? null
      : await input.eligibilityRepositories.getEvaluation(
          input.pharmacyCase.eligibilityRef.refId,
        );
  const evaluation = evaluationDocument?.toSnapshot() ?? null;
  const pathwayOrLane =
    input.pharmacyCase.candidatePathway ??
    (input.pharmacyCase.serviceType === "minor_illness_fallback"
      ? "minor_illness_fallback"
      : null);
  invariant(
    pathwayOrLane !== null,
    "PATHWAY_OR_LANE_UNRESOLVED",
    "The pharmacy case does not carry a resolvable pathway or lane.",
  );

  if (evaluation?.timingGuardrailRef !== null && evaluation?.timingGuardrailRef !== undefined) {
    const compiledDocument = await input.eligibilityRepositories.getCompiledRulePackByPackId(
      evaluation.rulePackRef.refId,
    );
    const compiled = compiledDocument?.toSnapshot() ?? null;
    invariant(
      compiled,
      "COMPILED_RULE_PACK_NOT_FOUND",
      "The compiled rule pack was not found for the evaluation timing guardrail lookup.",
    );
    const compiledGuardrail =
      evaluation.pathwayCode === null
        ? null
        : compiled.pathways[evaluation.pathwayCode as NamedPharmacyPathwayCode]
            ?.timingGuardrail ?? null;
    invariant(
      compiledGuardrail,
      "TIMING_GUARDRAIL_SNAPSHOT_MISSING",
      "The evaluation timing guardrail snapshot could not be resolved from the compiled rule pack.",
    );
    return {
      pathwayOrLane,
      timingGuardrailRef: makeRef(
        "PathwayTimingGuardrail",
        evaluation.timingGuardrailRef.refId,
        TASK_342,
      ),
      timingGuardrail: compiledGuardrail,
    };
  }

  const compiledDocument =
    evaluation === null
      ? null
      : await input.eligibilityRepositories.getCompiledRulePackByPackId(
          evaluation.rulePackRef.refId,
        );
  const compiled = compiledDocument?.toSnapshot() ?? null;
  invariant(
    compiled,
    "TIMING_GUARDRAIL_SOURCE_MISSING",
    "The current evaluation does not expose a timing guardrail and the compiled rule pack could not be resolved.",
  );

  const fallbackGuardrail = Object.values(compiled.pathways)
    .map((entry) => entry.timingGuardrail)
    .sort((left, right) => {
      if (left.maxRecommendedDelayMinutes !== right.maxRecommendedDelayMinutes) {
        return left.maxRecommendedDelayMinutes - right.maxRecommendedDelayMinutes;
      }
      return left.guardrailId.localeCompare(right.guardrailId);
    })[0];
  invariant(
    fallbackGuardrail,
    "MINOR_ILLNESS_GUARDRAIL_UNRESOLVED",
    "A fallback timing guardrail could not be resolved for the minor-illness lane.",
  );
  return {
    pathwayOrLane,
    timingGuardrailRef: makeRef(
      "PathwayTimingGuardrail",
      fallbackGuardrail.guardrailId,
      TASK_342,
    ),
    timingGuardrail: fallbackGuardrail,
  };
}

export interface Phase6PharmacyDirectoryChoiceEngineService {
  readonly repositories: Phase6PharmacyDirectoryChoiceStore;
  readonly caseKernelService: Phase6PharmacyCaseKernelService;
  readonly eligibilityRepositories: Phase6PharmacyEligibilityStore;
  readonly adapters: ReadonlyMap<PharmacyDiscoveryAdapterMode, PharmacyDiscoveryAdapter>;
  discoverProvidersForCase(input: {
    pharmacyCaseId: string;
    location: PharmacyLocationInput;
    audience: PharmacyChoiceAudience;
    refreshMode: PharmacyChoiceRefreshMode;
    evaluatedAt: string;
  }): Promise<PharmacyDirectoryChoiceBundle>;
  getChoiceTruth(input: {
    pharmacyCaseId: string;
    audience: PharmacyChoiceAudience;
  }): Promise<PharmacyDirectoryChoiceBundle>;
  selectProvider(input: {
    pharmacyCaseId: string;
    providerRef: string;
    actorRef: string;
    expectedChoiceRevision: number;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    recordedAt: string;
    leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
    expectedOwnershipEpoch: number;
    expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
    scopedMutationGateRef: string;
    reasonCode: string;
    idempotencyKey?: string;
  }): Promise<PharmacySelectionResult>;
  acknowledgeWarnedChoice(input: {
    pharmacyCaseId: string;
    acknowledgementScriptRef: string;
    actorRef: string;
    actorRole: "patient" | "staff";
    expectedChoiceRevision: number;
    recordedAt: string;
    leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
    expectedOwnershipEpoch: number;
    expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
    scopedMutationGateRef: string;
    reasonCode: string;
    idempotencyKey?: string;
  }): Promise<PharmacyWarnedChoiceAcknowledgementResult>;
  capturePharmacyConsent(input: {
    pharmacyCaseId: string;
    consentScriptVersion: string;
    actorRef: string;
    expectedSelectionBindingHash: string;
    referralScope: string;
    channel: PharmacyConsentCaptureChannel;
    patientAwarenessOfGpVisibility: boolean;
    recordedAt: string;
    leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
    expectedOwnershipEpoch: number;
    expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
    scopedMutationGateRef: string;
    reasonCode: string;
    packageFingerprint?: string | null;
    idempotencyKey?: string;
  }): Promise<PharmacyConsentCaptureResult>;
  revokeOrSupersedeConsent(input: {
    pharmacyCaseId: string;
    reasonCode: string;
    actorRef: string;
    recordedAt: string;
    leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
    expectedOwnershipEpoch: number;
    expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
    scopedMutationGateRef: string;
    idempotencyKey?: string;
  }): Promise<PharmacyConsentRevocationResult>;
  refreshChoiceIfStale(input: {
    pharmacyCaseId: string;
    location: PharmacyLocationInput;
    audience: PharmacyChoiceAudience;
    reasonCode: string;
    evaluatedAt: string;
  }): Promise<PharmacyDirectoryChoiceBundle>;
}

export function createPhase6PharmacyDirectoryChoiceEngineService(input?: {
  repositories?: Phase6PharmacyDirectoryChoiceStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  eligibilityRepositories?: Phase6PharmacyEligibilityStore;
  adapters?: readonly PharmacyDiscoveryAdapter[];
  rankingPolicy?: DirectoryChoiceRankingPolicy;
  idGenerator?: BackboneIdGenerator;
}): Phase6PharmacyDirectoryChoiceEngineService {
  const repositories = input?.repositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const caseKernelService =
    input?.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const eligibilityRepositories =
    input?.eligibilityRepositories ?? createPhase6PharmacyEligibilityStore();
  const rankingPolicy = input?.rankingPolicy ?? defaultDirectoryChoiceRankingPolicy;
  const idGenerator =
    input?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase6-pharmacy-directory-choice");
  const adapters = new Map<PharmacyDiscoveryAdapterMode, PharmacyDiscoveryAdapter>(
    (input?.adapters ?? []).map((adapter) => [adapter.mode, adapter]),
  );

  function nextId(kind: string): string {
    return (idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  async function maybeReplay<T>(replayKey: string, loader: (resultRefId: string) => Promise<T>): Promise<T | null> {
    const replayDocument = await repositories.getCommandReplay(replayKey);
    if (!replayDocument) {
      return null;
    }
    return loader(replayDocument.toSnapshot().resultRefId);
  }

  async function loadBundleByProjectionId(
    projectionId: string,
  ): Promise<PharmacyDirectoryChoiceBundle> {
    const projectionDocument = await repositories.getChoiceTruthProjection(projectionId);
    invariant(
      projectionDocument,
      "CHOICE_TRUTH_PROJECTION_NOT_FOUND",
      "PharmacyChoiceTruthProjection was not found.",
    );
    const projection = projectionDocument.toSnapshot();
    const session = (await repositories.getChoiceSession(projection.choiceSessionRef.refId))!.toSnapshot();
    const directorySnapshot = (await repositories.getDirectorySnapshot(projection.directorySnapshotRef.refId))!.toSnapshot();
    const sourceSnapshots = (
      await repositories.listDirectorySourceSnapshots(directorySnapshot.directorySnapshotId)
    ).map((entry) => entry.toSnapshot());
    const providerCapabilitySnapshots = (
      await repositories.listProviderCapabilitySnapshots(directorySnapshot.directorySnapshotId)
    ).map((entry) => entry.toSnapshot());
    const providersList = (await repositories.listProviders(directorySnapshot.directorySnapshotId)).map((entry) =>
      entry.toSnapshot(),
    );
    const choiceProof = (await repositories.getChoiceProof(session.choiceProofRef.refId))!.toSnapshot();
    const choiceExplanations = (
      await repositories.listChoiceExplanations(choiceProof.pharmacyChoiceProofId)
    ).map((entry) => entry.toSnapshot());
    const choiceDisclosurePolicy = (
      await repositories.getDisclosurePolicy(session.choiceDisclosurePolicyRef.refId)
    )!.toSnapshot();
    return {
      directorySnapshot,
      sourceSnapshots,
      providerCapabilitySnapshots,
      providers: providersList,
      choiceProof,
      choiceExplanations,
      choiceDisclosurePolicy,
      choiceSession: session,
      choiceTruthProjection: projection,
      replayed: true,
    };
  }

  async function buildDirectoryChoiceBundle(input: {
    pharmacyCaseId: string;
    location: PharmacyLocationInput;
    audience: PharmacyChoiceAudience;
    evaluatedAt: string;
    previousSession: PharmacyChoiceSession | null;
  }): Promise<PharmacyDirectoryChoiceBundle> {
    const caseBundle = await requireCaseBundle(caseKernelService, input.pharmacyCaseId);
    invariant(
      caseBundle.pharmacyCase.status === "eligible_choice_pending" ||
        caseBundle.pharmacyCase.status === "provider_selected" ||
        caseBundle.pharmacyCase.status === "consent_pending",
      "DIRECTORY_DISCOVERY_STATE_INVALID",
      "Directory discovery requires an eligible or selection-pending pharmacy case.",
    );
    const location = normalizeLocationInput(input.location);
    const guardrailBinding = await resolveEvaluationAndGuardrail({
      pharmacyCase: caseBundle.pharmacyCase,
      eligibilityRepositories,
    });

    const directorySnapshotId = nextId("pharmacy_directory_snapshot");
    const directorySnapshotRef = makeRef(
      "PharmacyDirectorySnapshot",
      directorySnapshotId,
      TASK_343,
    );
    const queryHash = sha256Hex(
      canonicalStringify({
        pharmacyCaseId: caseBundle.pharmacyCase.pharmacyCaseId,
        location: stableLocationHash(location),
        serviceType: caseBundle.pharmacyCase.serviceType,
        pathwayOrLane: guardrailBinding.pathwayOrLane,
        evaluatedAt: input.evaluatedAt,
      }),
    );

    const sourceResponses = await Promise.all(
      [...adapters.values()].map(async (adapter) => {
        try {
          return await adapter.discover({
            pharmacyCaseId: caseBundle.pharmacyCase.pharmacyCaseId,
            location,
            serviceType: caseBundle.pharmacyCase.serviceType,
            pathwayOrLane: guardrailBinding.pathwayOrLane,
            evaluatedAt: input.evaluatedAt,
          });
        } catch {
          return normalizeAdapterResponse({
            adapterMode: adapter.mode,
            adapterVersion: adapter.version,
            sourceLabel: adapter.mode,
            sourceStatus: "failed",
            requestTupleHash: queryHash,
            rawResponseHash: sha256Hex(
              canonicalStringify({
                mode: adapter.mode,
                failedAt: input.evaluatedAt,
              }),
            ),
            normalizedSourceTimestamp: input.evaluatedAt,
            sourceTrustClass:
              adapter.mode === "dohs_service_search"
                ? "strategic"
                : adapter.mode === "eps_dos_legacy"
                  ? "legacy"
                  : adapter.mode === "local_registry_override"
                    ? "authoritative"
                    : "manual_override",
            sourceFreshnessPosture: "expired",
            sourceFailureClassification: "source_unavailable",
            stalenessMinutes: 1_440,
            providers: [],
          });
        }
      }),
    );

    const sourceSnapshots = sourceResponses.map((response) => ({
      directorySourceSnapshotId: nextId("pharmacy_directory_source_snapshot"),
      directorySnapshotRef,
      adapterMode: response.adapterMode,
      adapterVersion: response.adapterVersion,
      sourceLabel: response.sourceLabel,
      sourceStatus: response.sourceStatus,
      queryContextHash: queryHash,
      rawResponseHash: response.rawResponseHash,
      rawResultCount: response.providers.length,
      sourceTrustClass: response.sourceTrustClass,
      sourceFreshnessPosture: response.sourceFreshnessPosture,
      sourceFailureClassification: response.sourceFailureClassification,
      normalizedSourceTimestamp: response.normalizedSourceTimestamp,
      stalenessMinutes: response.stalenessMinutes,
      requestTupleHash: response.requestTupleHash,
      capturedAt: input.evaluatedAt,
      version: 1,
    } satisfies PharmacyDirectorySourceSnapshot));

    type SourceBoundCandidate = {
      sourceSnapshot: PharmacyDirectorySourceSnapshot;
      candidate: PharmacyDiscoveryAdapterProviderCandidate;
    };

    const groupedProviders = new Map<string, SourceBoundCandidate[]>();
    for (const sourceSnapshot of sourceSnapshots) {
      const response = sourceResponses.find(
        (entry) =>
          entry.adapterMode === sourceSnapshot.adapterMode &&
          entry.adapterVersion === sourceSnapshot.adapterVersion,
      )!;
      for (const candidate of response.providers) {
        const key = candidate.odsCode;
        const current = groupedProviders.get(key) ?? [];
        current.push({
          sourceSnapshot,
          candidate,
        });
        groupedProviders.set(key, current);
      }
    }

    const providerCapabilitySnapshots: PharmacyProviderCapabilitySnapshot[] = [];
    const normalizedProviders: PharmacyProvider[] = [];

    for (const [odsCode, candidates] of [...groupedProviders.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      const rankedCandidates = [...candidates].sort((left, right) => {
        const trustGap =
          trustRank(right.sourceSnapshot.sourceTrustClass) -
          trustRank(left.sourceSnapshot.sourceTrustClass);
        if (trustGap !== 0) {
          return trustGap;
        }
        const freshnessGap =
          left.sourceSnapshot.stalenessMinutes - right.sourceSnapshot.stalenessMinutes;
        if (freshnessGap !== 0) {
          return freshnessGap;
        }
        return left.candidate.displayName.localeCompare(right.candidate.displayName);
      });
      const preferred = rankedCandidates[0]!;
      const conflictFieldNames = new Set<string>();
      if (new Set(rankedCandidates.map((entry) => entry.candidate.displayName)).size > 1) {
        conflictFieldNames.add("displayName");
      }
      if (new Set(rankedCandidates.map((entry) => entry.candidate.openingState)).size > 1) {
        conflictFieldNames.add("openingState");
      }
      if (
        new Set(
          rankedCandidates.map((entry) =>
            canonicalStringify(entry.candidate.nextSafeContactWindow),
          ),
        ).size > 1
      ) {
        conflictFieldNames.add("nextSafeContactWindow");
      }

      const providerId = `provider_${odsCode}`;
      const providerRef = makeRef("PharmacyProvider", providerId, TASK_343);
      const existingProviderVersion =
        (await repositories.getProvider(providerId))?.toSnapshot().version ?? 0;
      const capabilityState = computeCapabilityState(preferred.candidate);
      const capabilitySnapshot: PharmacyProviderCapabilitySnapshot = {
        providerCapabilitySnapshotId: nextId("pharmacy_provider_capability_snapshot"),
        directorySnapshotRef,
        providerRef,
        supportedTransportModes: preferred.candidate.supportedTransportModes,
        manualFallbackState: preferred.candidate.manualFallbackState,
        capabilityEvidenceRefs: sortedUnique(
          rankedCandidates.flatMap((entry) => entry.candidate.evidenceRefs ?? []),
        ),
        capabilityState,
        capabilityTupleHash: sha256Hex(
          canonicalStringify({
            providerId,
            supportedTransportModes: preferred.candidate.supportedTransportModes,
            manualFallbackState: preferred.candidate.manualFallbackState,
            capabilityState,
          }),
        ),
        capturedAt: input.evaluatedAt,
        version: 1,
      };
      providerCapabilitySnapshots.push(capabilitySnapshot);

      const serviceFitClass = resolveServiceFitClass({
        provider: preferred.candidate,
        serviceType: caseBundle.pharmacyCase.serviceType,
        pathwayOrLane: guardrailBinding.pathwayOrLane,
        capabilityState,
      });

      const hPath =
        serviceFitClass === 2 ? 1 : serviceFitClass === 1 ? 0.72 : 0.45;
      const timingBand = resolveTimingBand({
        now: input.evaluatedAt,
        nextSafeContactWindow: preferred.candidate.nextSafeContactWindow,
        guardrail: guardrailBinding.timingGuardrail,
      });
      const readyAt =
        compareIso(preferred.candidate.nextSafeContactWindow.windowStart, input.evaluatedAt) < 0
          ? input.evaluatedAt
          : preferred.candidate.nextSafeContactWindow.windowStart;
      const delayMinutes = minutesBetween(input.evaluatedAt, readyAt);
      const hTiming = clampProbability(
        Math.exp(
          -Math.max(
            0,
            delayMinutes - guardrailBinding.timingGuardrail.maxRecommendedDelayMinutes,
          ) / rankingPolicy.tauDelayMinutes,
        ),
      );
      const hTravel = clampProbability(
        Math.exp(
          -preferred.candidate.localityAndTravelInputs.travelMinutes /
            rankingPolicy.tauTravelMinutes,
        ),
      );
      const hAccess = clampProbability(preferred.candidate.accessScore ?? 0.85);
      const hFresh = clampProbability(
        Math.exp(-preferred.sourceSnapshot.stalenessMinutes / rankingPolicy.tauFreshMinutes),
      );
      const recommendationScore = clampProbability(
        Math.max(rankingPolicy.epsilonFloor, hPath) ** rankingPolicy.lambdaPath *
          Math.max(rankingPolicy.epsilonFloor, hTiming) ** rankingPolicy.lambdaTiming *
          Math.max(rankingPolicy.epsilonFloor, hTravel) ** rankingPolicy.lambdaTravel *
          Math.max(rankingPolicy.epsilonFloor, hAccess) ** rankingPolicy.lambdaAccess *
          Math.max(rankingPolicy.epsilonFloor, hFresh) ** rankingPolicy.lambdaFresh,
      );

      const invalidHidden =
        preferred.candidate.organisationalValidity === "invalid" ||
        preferred.candidate.serviceCommissioningState === "not_commissioned" ||
        capabilityState === "unsupported";
      const overrideRequirementState: PharmacyChoiceOverrideRequirementState =
        capabilityState === "manual_supported" || timingBand === 1
          ? "warned_choice_ack_required"
          : timingBand === 0
            ? "policy_override_required"
            : "none";
      const warningState: PharmacyProvider["warningState"] =
        capabilityState === "manual_supported"
          ? "manual_route_warning"
          : timingBand === 0
            ? "policy_override_required"
            : timingBand === 1
              ? "late_option_warning"
              : "none";

      normalizedProviders.push({
        providerId,
        providerCapabilitySnapshotRef: makeRef(
          "PharmacyProviderCapabilitySnapshot",
          capabilitySnapshot.providerCapabilitySnapshotId,
          TASK_343,
        ),
        odsCode,
        displayName: preferred.candidate.displayName,
        openingState: preferred.candidate.openingState,
        nextSafeContactWindow: preferred.candidate.nextSafeContactWindow,
        pathwaySuitability: preferred.candidate.pathwaySuitability,
        minorIllnessSuitability: preferred.candidate.minorIllnessSuitability,
        dispatchCapabilityState: capabilityState,
        accessibilityTags: preferred.candidate.accessibilityTags,
        contactEndpoints: preferred.candidate.contactEndpoints,
        consultationModeHints: preferred.candidate.consultationModeHints,
        localityAndTravelInputs: {
          travelMinutes: preferred.candidate.localityAndTravelInputs.travelMinutes,
          travelBand:
            preferred.candidate.localityAndTravelInputs.travelBand ??
            ratingForTravelBand(preferred.candidate.localityAndTravelInputs.travelMinutes),
        },
        timingBand,
        warningState,
        serviceFitClass,
        recommendationScore,
        choiceVisibilityState: invalidHidden
          ? "invalid_hidden"
          : timingBand === 0
            ? "suppressed_unsafe"
            : overrideRequirementState === "none"
              ? "recommended_visible"
              : "visible_with_warning",
        choiceExplanationRef: null,
        overrideRequirementState,
        normalizationProvenance: {
          contributingSourceSnapshotRefs: rankedCandidates.map(
            (entry) => entry.sourceSnapshot.directorySourceSnapshotId,
          ),
          normalizedByTrustRank: rankedCandidates.map(
            (entry) =>
              `${entry.sourceSnapshot.adapterMode}:${entry.sourceSnapshot.sourceTrustClass}`,
          ),
          conflictFieldNames: [...conflictFieldNames].sort(),
        },
        version:
          existingProviderVersion === 0 ? 1 : nextVersion(existingProviderVersion),
      });
    }

    const visibleProviders = normalizedProviders
      .filter((provider) => provider.choiceVisibilityState !== "invalid_hidden")
      .filter((provider) => provider.choiceVisibilityState !== "suppressed_unsafe")
      .sort((left, right) => {
        if (left.timingBand !== right.timingBand) {
          return right.timingBand - left.timingBand;
        }
        if (left.serviceFitClass !== right.serviceFitClass) {
          return right.serviceFitClass - left.serviceFitClass;
        }
        if (left.recommendationScore !== right.recommendationScore) {
          return right.recommendationScore - left.recommendationScore;
        }
        return left.displayName.localeCompare(right.displayName);
      });

    const bestVisible = visibleProviders[0] ?? null;
    const recommendedProviderRefs = visibleProviders
      .filter((provider) => {
        if (bestVisible === null) {
          return false;
        }
        return (
          provider.timingBand === bestVisible.timingBand &&
          provider.serviceFitClass === bestVisible.serviceFitClass &&
          provider.recommendationScore >=
            bestVisible.recommendationScore * (1 - rankingPolicy.frontierToleranceRatio)
        );
      })
      .map((provider) => makeRef("PharmacyProvider", provider.providerId, TASK_343));

    const visibleProviderRefs = visibleProviders.map((provider) =>
      makeRef("PharmacyProvider", provider.providerId, TASK_343),
    );
    const warningVisibleProviderRefs = visibleProviders
      .filter((provider) => provider.overrideRequirementState !== "none")
      .map((provider) => makeRef("PharmacyProvider", provider.providerId, TASK_343));
    const suppressedUnsafeProviderRefs = normalizedProviders
      .filter((provider) => provider.choiceVisibilityState === "suppressed_unsafe")
      .map((provider) => makeRef("PharmacyProvider", provider.providerId, TASK_343));
    const invalidHiddenProviderRefs = normalizedProviders
      .filter((provider) => provider.choiceVisibilityState === "invalid_hidden")
      .map((provider) => makeRef("PharmacyProvider", provider.providerId, TASK_343));

    const visibleChoiceSetHash = sha256Hex(
      canonicalStringify(
        visibleProviders.map((provider) => ({
          providerId: provider.providerId,
          timingBand: provider.timingBand,
          serviceFitClass: provider.serviceFitClass,
          recommendationScore: provider.recommendationScore,
          visibility: provider.choiceVisibilityState,
          overrideRequirementState: provider.overrideRequirementState,
        })),
      ),
    );
    const candidateUniverseHash = sha256Hex(
      canonicalStringify(
        normalizedProviders.map((provider) => ({
          providerId: provider.providerId,
          visibility: provider.choiceVisibilityState,
        })),
      ),
    );

    const choiceProof: PharmacyChoiceProof = {
      pharmacyChoiceProofId: nextId("pharmacy_choice_proof"),
      directorySnapshotRef,
      visibleProviderRefs,
      recommendedProviderRefs,
      warningVisibleProviderRefs,
      suppressedUnsafeProviderRefs,
      fullVisibleProviderCount: visibleProviderRefs.length,
      frontierToleranceRatio: rankingPolicy.frontierToleranceRatio,
      rankingFormula:
        "timingBand_desc__serviceFitClass_desc__recommendationScore_desc__displayName_asc",
      visibleChoiceSetHash,
      calculatedAt: input.evaluatedAt,
      version: 1,
    };

    const choiceExplanations = visibleProviders.map((provider, index) => {
      const visibilityDisposition =
        recommendedProviderRefs.some((ref) => ref.refId === provider.providerId)
          ? "recommended_visible"
          : provider.choiceVisibilityState;
      const reasonCodeRefs = sortedUnique([
        provider.timingBand === 2 ? "timing.within_recommended_window" : "timing.warning",
        provider.serviceFitClass === 2
          ? "service.exact_pathway_fit"
          : provider.serviceFitClass === 1
            ? "service.manual_or_lane_fit"
            : "service.visible_fallback",
        `freshness.${freshnessPostureForMinutes(
          provider.normalizationProvenance.contributingSourceSnapshotRefs.length > 0
            ? sourceSnapshots.find(
                (snapshot) =>
                  snapshot.directorySourceSnapshotId ===
                  provider.normalizationProvenance.contributingSourceSnapshotRefs[0],
              )?.stalenessMinutes ?? 0
            : 0,
        )}`,
      ]);
      const warningCopyRef =
        provider.overrideRequirementState === "warned_choice_ack_required"
          ? provider.dispatchCapabilityState === "manual_supported"
            ? "warn.manual_route.same_day"
            : "warn.late_option.within_guardrail"
          : provider.overrideRequirementState === "policy_override_required"
            ? "warn.policy_override.required"
            : null;
      const explanation: PharmacyChoiceExplanation = {
        pharmacyChoiceExplanationId: nextId("pharmacy_choice_explanation"),
        pharmacyChoiceProofRef: makeRef(
          "PharmacyChoiceProof",
          choiceProof.pharmacyChoiceProofId,
          TASK_343,
        ),
        providerRef: makeRef("PharmacyProvider", provider.providerId, TASK_343),
        rankOrdinal: index + 1,
        serviceFitClass: provider.serviceFitClass,
        timingBand: provider.timingBand,
        recommendationScore: provider.recommendationScore,
        visibilityDisposition,
        reasonCodeRefs,
        patientReasonCueRefs: sortedUnique(
          reasonCodeRefs.map((code) => `patient.${code}`),
        ),
        staffExplanationRefs: sortedUnique(
          reasonCodeRefs.map((code) => `staff.${code}`),
        ),
        warningCopyRef,
        suppressionReasonCodeRef:
          provider.choiceVisibilityState === "suppressed_unsafe"
            ? "late_option_exceeds_guardrail"
            : null,
        overrideRequirementState: provider.overrideRequirementState,
        disclosureTupleHash: sha256Hex(
          canonicalStringify({
            providerId: provider.providerId,
            visibilityDisposition,
            warningCopyRef,
          }),
        ),
        generatedAt: input.evaluatedAt,
        version: 1,
      };
      provider.choiceExplanationRef = makeRef(
        "PharmacyChoiceExplanation",
        explanation.pharmacyChoiceExplanationId,
        TASK_343,
      );
      provider.choiceVisibilityState = visibilityDisposition;
      return explanation;
    });

    const disclosurePolicy: PharmacyChoiceDisclosurePolicy = {
      pharmacyChoiceDisclosurePolicyId: nextId("pharmacy_choice_disclosure_policy"),
      choiceProofRef: makeRef("PharmacyChoiceProof", choiceProof.pharmacyChoiceProofId, TASK_343),
      suppressedUnsafeSummaryRef:
        suppressedUnsafeProviderRefs.length === 0
          ? "suppressed.none"
          : `suppressed.count.${suppressedUnsafeProviderRefs.length}`,
      warnedChoicePolicyRef: "warned_choice.manual_supported_or_timing_degraded",
      hiddenStatePolicyRef: "hidden.invalid_or_unsupported_only",
      generatedAt: input.evaluatedAt,
      version: 1,
    };

    const nextDirectoryTupleHash = sha256Hex(
      canonicalStringify({
        pharmacyCaseId: caseBundle.pharmacyCase.pharmacyCaseId,
        locationHash: stableLocationHash(location),
        pathwayOrLane: guardrailBinding.pathwayOrLane,
        timingGuardrailRef: guardrailBinding.timingGuardrailRef.refId,
        sourceResponseHashes: sourceSnapshots.map((snapshot) => snapshot.rawResponseHash),
      }),
    );
    const materialDriftReason =
      input.previousSession === null
        ? null
        : detectMaterialDriftReason(
            input.previousSession,
            visibleChoiceSetHash,
            visibleProviderRefs,
          ) ??
          (input.previousSession.directoryTupleHash === nextDirectoryTupleHash
            ? null
            : "proof_superseded");
    let selectedProviderRef = input.previousSession?.selectedProviderRef ?? null;
    let selectedProviderExplanationRef =
      input.previousSession?.selectedProviderExplanationRef ?? null;
    let selectedProviderCapabilitySnapshotRef =
      input.previousSession?.selectedProviderCapabilitySnapshotRef ?? null;
    let overrideAcknowledgementRef =
      input.previousSession?.overrideAcknowledgementRef ?? null;
    let patientOverrideRequired = input.previousSession?.patientOverrideRequired ?? false;
    let selectionBindingHash = input.previousSession?.selectionBindingHash ?? null;
    let sessionState: PharmacyChoiceSessionState =
      materialDriftReason !== null
        ? "recovery_required"
        : input.previousSession?.selectedProviderRef === null || input.previousSession === null
          ? "choosing"
          : input.previousSession.sessionState === "completed"
            ? "completed"
            : "selected_waiting_consent";

    if (
      selectedProviderRef !== null &&
      !visibleProviderRefs.some((ref) => ref.refId === selectedProviderRef.refId)
    ) {
      patientOverrideRequired = false;
      selectionBindingHash = null;
    }

    const session: PharmacyChoiceSession = {
      pharmacyChoiceSessionId: nextId("pharmacy_choice_session"),
      pharmacyCaseRef: makeRef("PharmacyCase", caseBundle.pharmacyCase.pharmacyCaseId, TASK_342),
      directorySnapshotRef,
      choiceProofRef: makeRef("PharmacyChoiceProof", choiceProof.pharmacyChoiceProofId, TASK_343),
      choiceDisclosurePolicyRef: makeRef(
        "PharmacyChoiceDisclosurePolicy",
        disclosurePolicy.pharmacyChoiceDisclosurePolicyId,
        TASK_343,
      ),
      visibleProviderRefs,
      recommendedProviderRefs,
      selectedProviderRef,
      selectedProviderExplanationRef,
      selectedProviderCapabilitySnapshotRef,
      overrideAcknowledgementRef,
      patientOverrideRequired,
      selectionBindingHash,
      visibleChoiceSetHash,
      sessionState,
      directoryTupleHash: nextDirectoryTupleHash,
      freshnessPosture:
        sourceSnapshots.reduce<PharmacyDirectoryFreshnessPosture>((worst, snapshot) => {
          const order = ["current", "degraded", "stale", "expired"] as const;
          return order.indexOf(snapshot.sourceFreshnessPosture) >
            order.indexOf(worst)
            ? snapshot.sourceFreshnessPosture
            : worst;
        }, "current"),
      revision: input.previousSession === null ? 1 : input.previousSession.revision + 1,
      createdAt: input.evaluatedAt,
      updatedAt: input.evaluatedAt,
      version: 1,
    };

    const truthProjection: PharmacyChoiceTruthProjection = {
      pharmacyChoiceTruthProjectionId: nextId("pharmacy_choice_truth_projection"),
      pharmacyCaseId: caseBundle.pharmacyCase.pharmacyCaseId,
      choiceSessionRef: makeRef("PharmacyChoiceSession", session.pharmacyChoiceSessionId, TASK_343),
      directorySnapshotRef,
      choiceProofRef: makeRef("PharmacyChoiceProof", choiceProof.pharmacyChoiceProofId, TASK_343),
      choiceDisclosurePolicyRef: makeRef(
        "PharmacyChoiceDisclosurePolicy",
        disclosurePolicy.pharmacyChoiceDisclosurePolicyId,
        TASK_343,
      ),
      directoryTupleHash: session.directoryTupleHash,
      visibleProviderRefs,
      recommendedProviderRefs,
      warningVisibleProviderRefs,
      suppressedUnsafeSummaryRef:
        suppressedUnsafeProviderRefs.length === 0
          ? null
          : disclosurePolicy.suppressedUnsafeSummaryRef,
      selectedProviderRef,
      selectedProviderExplanationRef,
      selectedProviderCapabilitySnapshotRef,
      patientOverrideRequired,
      overrideAcknowledgementRef,
      selectionBindingHash,
      visibleChoiceSetHash,
      projectionState: stateToProjection(session),
      computedAt: input.evaluatedAt,
      version: 1,
    };

    const directorySnapshot: PharmacyDirectorySnapshot = {
      directorySnapshotId,
      pharmacyCaseRef: makeRef("PharmacyCase", caseBundle.pharmacyCase.pharmacyCaseId, TASK_342),
      serviceType: caseBundle.pharmacyCase.serviceType,
      pathwayOrLane: guardrailBinding.pathwayOrLane,
      timingGuardrailRef: guardrailBinding.timingGuardrailRef,
      sourceSnapshotRefs: sourceSnapshots.map((snapshot) =>
        makeRef(
          "PharmacyDirectorySourceSnapshot",
          snapshot.directorySourceSnapshotId,
          TASK_343,
        ),
      ),
      providerRefs: normalizedProviders.map((provider) =>
        makeRef("PharmacyProvider", provider.providerId, TASK_343),
      ),
      providerCapabilitySnapshotRefs: providerCapabilitySnapshots.map((snapshot) =>
        makeRef(
          "PharmacyProviderCapabilitySnapshot",
          snapshot.providerCapabilitySnapshotId,
          TASK_343,
        ),
      ),
      visibleProviderRefs,
      recommendedProviderRefs,
      suppressedUnsafeProviderRefs,
      invalidHiddenProviderRefs,
      directoryTupleHash: session.directoryTupleHash,
      candidateUniverseHash,
      rankingInputs: {
        tauDelayMinutes: rankingPolicy.tauDelayMinutes,
        tauTravelMinutes: rankingPolicy.tauTravelMinutes,
        tauFreshMinutes: rankingPolicy.tauFreshMinutes,
        epsilonFloor: rankingPolicy.epsilonFloor,
        frontierToleranceRatio: rankingPolicy.frontierToleranceRatio,
        lambdaPath: rankingPolicy.lambdaPath,
        lambdaTiming: rankingPolicy.lambdaTiming,
        lambdaTravel: rankingPolicy.lambdaTravel,
        lambdaAccess: rankingPolicy.lambdaAccess,
        lambdaFresh: rankingPolicy.lambdaFresh,
      },
      snapshotState: "current",
      capturedAt: input.evaluatedAt,
      version: 1,
    };

    for (const sourceSnapshot of sourceSnapshots) {
      await repositories.saveDirectorySourceSnapshot(sourceSnapshot);
    }
    for (const capabilitySnapshot of providerCapabilitySnapshots) {
      await repositories.saveProviderCapabilitySnapshot(capabilitySnapshot);
    }
    for (const provider of normalizedProviders) {
      await repositories.saveProvider(provider);
    }
    await repositories.saveDirectorySnapshot(directorySnapshot);
    await repositories.saveChoiceProof(choiceProof);
    for (const explanation of choiceExplanations) {
      await repositories.saveChoiceExplanation(explanation);
    }
    await repositories.saveDisclosurePolicy(disclosurePolicy);
    await repositories.saveChoiceSession(session);
    await repositories.saveChoiceTruthProjection(truthProjection);

    if (materialDriftReason !== null) {
      const latestConsentRecordDocument = await repositories.getLatestConsentRecordForCase(
        caseBundle.pharmacyCase.pharmacyCaseId,
      );
      const latestConsentRecord = latestConsentRecordDocument?.toSnapshot() ?? null;
      if (latestConsentRecord?.state === "granted") {
        const supersededConsent: PharmacyConsentRecord = {
          ...latestConsentRecord,
          state: "superseded",
          supersededAt: input.evaluatedAt,
          version: nextVersion(latestConsentRecord.version),
        };
        await repositories.saveConsentRecord(supersededConsent, {
          expectedVersion: latestConsentRecord.version,
        });
        const revocationRecord: PharmacyConsentRevocationRecord = {
          pharmacyConsentRevocationRecordId: nextId("pharmacy_consent_revocation"),
          pharmacyCaseRef: makeRef("PharmacyCase", caseBundle.pharmacyCase.pharmacyCaseId, TASK_342),
          consentRecordRef: makeRef(
            "PharmacyConsentRecord",
            supersededConsent.pharmacyConsentRecordId,
            TASK_343,
          ),
          reasonClass: materialDriftReason,
          revocationState: "recorded",
          recordedAt: input.evaluatedAt,
          version: 1,
        };
        await repositories.saveConsentRevocationRecord(revocationRecord);
        const latestCheckpointDocument = await repositories.getLatestConsentCheckpointForCase(
          caseBundle.pharmacyCase.pharmacyCaseId,
        );
        if (latestCheckpointDocument) {
          const latestCheckpoint = latestCheckpointDocument.toSnapshot();
          await repositories.saveConsentCheckpoint(
            {
              ...latestCheckpoint,
              latestRevocationRef: makeRef(
                "PharmacyConsentRevocationRecord",
                revocationRecord.pharmacyConsentRevocationRecordId,
                TASK_343,
              ),
              checkpointState: "superseded",
              continuityState: "stale",
              evaluatedAt: input.evaluatedAt,
              version: nextVersion(latestCheckpoint.version),
            },
            { expectedVersion: latestCheckpoint.version },
          );
        }
      }
    }

    return {
      directorySnapshot,
      sourceSnapshots,
      providerCapabilitySnapshots,
      providers: normalizedProviders,
      choiceProof,
      choiceExplanations,
      choiceDisclosurePolicy: disclosurePolicy,
      choiceSession: session,
      choiceTruthProjection: truthProjection,
      replayed: false,
    };
  }

  return {
    repositories,
    caseKernelService,
    eligibilityRepositories,
    adapters,

    async discoverProvidersForCase(command) {
      const latestProjection =
        await repositories.getLatestChoiceTruthProjectionForCase(command.pharmacyCaseId);
      if (command.refreshMode !== "force_refresh" && latestProjection) {
        const bundle = await loadBundleByProjectionId(
          latestProjection.toSnapshot().pharmacyChoiceTruthProjectionId,
        );
        const latestSnapshotAge = minutesBetween(
          bundle.directorySnapshot.capturedAt,
          command.evaluatedAt,
        );
        const isCurrent = latestSnapshotAge <= 60;
        if (
          (command.refreshMode === "if_current" && isCurrent) ||
          (command.refreshMode === "if_stale" && isCurrent)
        ) {
          return { ...bundle, replayed: true };
        }
      }

      return buildDirectoryChoiceBundle({
        pharmacyCaseId: command.pharmacyCaseId,
        location: command.location,
        audience: command.audience,
        evaluatedAt: command.evaluatedAt,
        previousSession:
          (await repositories.getLatestChoiceSessionForCase(command.pharmacyCaseId))?.toSnapshot() ??
          null,
      });
    },

    async getChoiceTruth(command) {
      const latestProjection = await repositories.getLatestChoiceTruthProjectionForCase(
        command.pharmacyCaseId,
      );
      invariant(
        latestProjection,
        "CHOICE_TRUTH_PROJECTION_NOT_FOUND",
        "PharmacyChoiceTruthProjection was not found.",
      );
      return loadBundleByProjectionId(
        latestProjection.toSnapshot().pharmacyChoiceTruthProjectionId,
      );
    },

    async selectProvider(command) {
      const replayKey =
        command.idempotencyKey ??
        selectionReplayKey({
          pharmacyCaseId: command.pharmacyCaseId,
          providerRef: command.providerRef,
          expectedChoiceRevision: command.expectedChoiceRevision,
        });
      const replayed = await maybeReplay(replayKey, async (refId) => {
        const projection = await repositories.getChoiceTruthProjection(refId);
        invariant(
          projection,
          "CHOICE_TRUTH_PROJECTION_NOT_FOUND",
          "PharmacyChoiceTruthProjection was not found for replayed provider selection.",
        );
        const bundle = await loadBundleByProjectionId(refId);
        const selectedProvider = bundle.providers.find(
          (provider) => provider.providerId === command.providerRef,
        );
        invariant(selectedProvider, "PROVIDER_NOT_FOUND", "The selected provider was not found.");
        const selectedExplanation = bundle.choiceExplanations.find(
          (explanation) =>
            explanation.providerRef.refId === command.providerRef,
        );
        invariant(
          selectedExplanation,
          "CHOICE_EXPLANATION_NOT_FOUND",
          "The selected provider explanation was not found.",
        );
        const caseMutation = await caseKernelService.getPharmacyCase(command.pharmacyCaseId);
        invariant(caseMutation, "PHARMACY_CASE_NOT_FOUND", "The pharmacy case was not found.");
        return {
          choiceSession: bundle.choiceSession,
          choiceTruthProjection: bundle.choiceTruthProjection,
          selectedProvider,
          selectedExplanation,
          caseMutation: {
            pharmacyCase: caseMutation.pharmacyCase,
            lineageCaseLink: caseMutation.lineageCaseLink,
            transitionJournalEntries: [],
            eventJournalEntries: [],
            emittedEvents: [],
            staleOwnerRecovery: null,
            replayed: true,
          },
          replayed: true,
        } satisfies PharmacySelectionResult;
      });
      if (replayed) {
        return replayed;
      }

      await caseKernelService.verifyMutationAuthority({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt: command.recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        reasonCode: command.reasonCode,
      });

      const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
      invariant(
        session.revision === command.expectedChoiceRevision,
        "STALE_CHOICE_REVISION",
        `Expected choice revision ${command.expectedChoiceRevision}, received ${session.revision}.`,
      );
      const proof = await requireChoiceProof(repositories, session.choiceProofRef.refId);
      invariant(
        proof.visibleProviderRefs.some((ref) => ref.refId === command.providerRef),
        "PROVIDER_NOT_VISIBLE",
        "The selected provider is not in the visible choice set.",
      );
      const provider = await requireProvider(repositories, command.providerRef);
      const explanation = (
        await repositories.listChoiceExplanations(session.choiceProofRef.refId)
      )
        .map((entry) => entry.toSnapshot())
        .find((entry) => entry.providerRef.refId === provider.providerId);
      invariant(
        explanation,
        "CHOICE_EXPLANATION_NOT_FOUND",
        "The selected provider explanation was not found.",
      );

      const selectionBindingHash = buildSelectionBindingHash({
        choiceSessionId: session.pharmacyChoiceSessionId,
        directorySnapshotRef: session.directorySnapshotRef.refId,
        choiceProofRef: session.choiceProofRef.refId,
        disclosurePolicyRef: session.choiceDisclosurePolicyRef.refId,
        selectedProviderRef: provider.providerId,
        selectedProviderExplanationRef: explanation.pharmacyChoiceExplanationId,
        selectedCapabilitySnapshotRef: provider.providerCapabilitySnapshotRef.refId,
        visibleChoiceSetHash: session.visibleChoiceSetHash,
      });
      const patientOverrideRequired = explanation.overrideRequirementState !== "none";
      const updatedSession: PharmacyChoiceSession = {
        ...session,
        selectedProviderRef: makeRef("PharmacyProvider", provider.providerId, TASK_343),
        selectedProviderExplanationRef: makeRef(
          "PharmacyChoiceExplanation",
          explanation.pharmacyChoiceExplanationId,
          TASK_343,
        ),
        selectedProviderCapabilitySnapshotRef: makeRef(
          "PharmacyProviderCapabilitySnapshot",
          provider.providerCapabilitySnapshotRef.refId,
          TASK_343,
        ),
        overrideAcknowledgementRef: null,
        patientOverrideRequired,
        selectionBindingHash,
        sessionState: patientOverrideRequired
          ? "selected_waiting_consent"
          : "consent_pending",
        revision: session.revision + 1,
        updatedAt: command.recordedAt,
        version: nextVersion(session.version),
      };
      await repositories.saveChoiceSession(updatedSession, {
        expectedVersion: session.version,
      });
      const latestProjection = await requireChoiceTruthProjection(
        repositories,
        command.pharmacyCaseId,
      );
      const updatedProjection: PharmacyChoiceTruthProjection = {
        ...latestProjection,
        selectedProviderRef: makeRef("PharmacyProvider", provider.providerId, TASK_343),
        selectedProviderExplanationRef: makeRef(
          "PharmacyChoiceExplanation",
          explanation.pharmacyChoiceExplanationId,
          TASK_343,
        ),
        selectedProviderCapabilitySnapshotRef: makeRef(
          "PharmacyProviderCapabilitySnapshot",
          provider.providerCapabilitySnapshotRef.refId,
          TASK_343,
        ),
        patientOverrideRequired,
        overrideAcknowledgementRef: null,
        selectionBindingHash,
        projectionState: "selected_waiting_consent",
        computedAt: command.recordedAt,
        version: nextVersion(latestProjection.version),
      };
      await repositories.saveChoiceTruthProjection(updatedProjection, {
        expectedVersion: latestProjection.version,
      });

      const placeholderCheckpointId =
        (await repositories.getLatestConsentCheckpointForCase(command.pharmacyCaseId))?.toSnapshot()
          .pharmacyConsentCheckpointId ?? nextId("pharmacy_consent_checkpoint");
      const caseMutation = await caseKernelService.choosePharmacyProvider({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt: command.recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        reasonCode: command.reasonCode,
        choiceSessionRef: makeRef(
          "PharmacyChoiceSession",
          updatedSession.pharmacyChoiceSessionId,
          TASK_343,
        ),
        selectedProviderRef: makeRef("PharmacyProvider", provider.providerId, TASK_343),
        activeConsentRef: null,
        activeConsentCheckpointRef: makeRef(
          "PharmacyConsentCheckpoint",
          placeholderCheckpointId,
          TASK_343,
        ),
        latestConsentRevocationRef: null,
        checkpointState: "unsatisfied",
        finalizePackageReady: false,
        idempotencyKey: replayKey,
      });

      const placeholderCheckpoint: PharmacyConsentCheckpoint = {
        pharmacyConsentCheckpointId: placeholderCheckpointId,
        pharmacyCaseRef: makeRef("PharmacyCase", command.pharmacyCaseId, TASK_342),
        providerRef: makeRef("PharmacyProvider", provider.providerId, TASK_343),
        pathwayOrLane:
          (await repositories.getDirectorySnapshot(updatedSession.directorySnapshotRef.refId))!
            .toSnapshot().pathwayOrLane,
        referralScope: "pharmacy_referral",
        choiceProofRef: makeRef(
          "PharmacyChoiceProof",
          updatedSession.choiceProofRef.refId,
          TASK_343,
        ),
        selectedExplanationRef: makeRef(
          "PharmacyChoiceExplanation",
          explanation.pharmacyChoiceExplanationId,
          TASK_343,
        ),
        consentRecordRef: null,
        latestRevocationRef: null,
        selectionBindingHash,
        packageFingerprint: null,
        checkpointState: "missing",
        continuityState: "current",
        evaluatedAt: command.recordedAt,
        version:
          ((await repositories.getConsentCheckpoint(placeholderCheckpointId))?.toSnapshot().version ??
            0) + 1,
      };
      await repositories.saveConsentCheckpoint(
        placeholderCheckpoint,
        (await repositories.getConsentCheckpoint(placeholderCheckpointId))
          ? {
              expectedVersion:
                (await repositories.getConsentCheckpoint(placeholderCheckpointId))!.toSnapshot()
                  .version,
            }
          : undefined,
      );

      await repositories.saveCommandReplay({
        replayKey,
        resultKind: "selection",
        resultRefId: updatedProjection.pharmacyChoiceTruthProjectionId,
        version: 1,
      });

      return {
        choiceSession: updatedSession,
        choiceTruthProjection: updatedProjection,
        selectedProvider: provider,
        selectedExplanation: explanation,
        caseMutation,
        replayed: false,
      };
    },

    async acknowledgeWarnedChoice(command) {
      const replayKey =
        command.idempotencyKey ??
        acknowledgementReplayKey({
          pharmacyCaseId: command.pharmacyCaseId,
          providerRef:
            (await requireChoiceSession(repositories, command.pharmacyCaseId)).selectedProviderRef
              ?.refId ?? "none",
          scriptRef: command.acknowledgementScriptRef,
          actorRef: command.actorRef,
        });
      const replayed = await maybeReplay(replayKey, async (refId) => {
        const ack = await repositories.getOverrideAcknowledgement(refId);
        invariant(
          ack,
          "OVERRIDE_ACKNOWLEDGEMENT_NOT_FOUND",
          "The warned-choice acknowledgement was not found.",
        );
        const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
        const projection = await requireChoiceTruthProjection(repositories, command.pharmacyCaseId);
        return {
          acknowledgement: ack.toSnapshot(),
          choiceSession: session,
          choiceTruthProjection: projection,
          replayed: true,
        } satisfies PharmacyWarnedChoiceAcknowledgementResult;
      });
      if (replayed) {
        return replayed;
      }

      await caseKernelService.verifyMutationAuthority({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: `warned_choice_ack_${command.actorRef}`,
        commandSettlementRecordRef: `warned_choice_ack_${command.actorRef}`,
        recordedAt: command.recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        reasonCode: command.reasonCode,
      });

      const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
      invariant(
        session.revision === command.expectedChoiceRevision,
        "STALE_CHOICE_REVISION",
        `Expected choice revision ${command.expectedChoiceRevision}, received ${session.revision}.`,
      );
      invariant(
        session.selectedProviderRef !== null && session.selectedProviderExplanationRef !== null,
        "NO_SELECTED_PROVIDER",
        "Warned-choice acknowledgement requires a selected provider.",
      );
      const explanation = await requireChoiceExplanation(
        repositories,
        session.selectedProviderExplanationRef.refId,
      );
      invariant(
        explanation.overrideRequirementState !== "none",
        "ACKNOWLEDGEMENT_NOT_REQUIRED",
        "The selected provider does not require warned-choice acknowledgement.",
      );

      const acknowledgement: PharmacyChoiceOverrideAcknowledgement = {
        pharmacyChoiceOverrideAcknowledgementId: nextId(
          "pharmacy_choice_override_acknowledgement",
        ),
        choiceSessionRef: makeRef(
          "PharmacyChoiceSession",
          session.pharmacyChoiceSessionId,
          TASK_343,
        ),
        providerRef: makeRef("PharmacyProvider", session.selectedProviderRef.refId, TASK_343),
        overrideRequirementState:
          explanation.overrideRequirementState === "policy_override_required"
            ? "policy_override_required"
            : "warned_choice_ack_required",
        acknowledgementScriptRef: command.acknowledgementScriptRef,
        actorRef: command.actorRef,
        actorRole: command.actorRole,
        acknowledgedAt: command.recordedAt,
        version: 1,
      };
      await repositories.saveOverrideAcknowledgement(acknowledgement);

      const updatedSession: PharmacyChoiceSession = {
        ...session,
        overrideAcknowledgementRef: makeRef(
          "PharmacyChoiceOverrideAcknowledgement",
          acknowledgement.pharmacyChoiceOverrideAcknowledgementId,
          TASK_343,
        ),
        patientOverrideRequired: false,
        sessionState: "consent_pending",
        revision: session.revision + 1,
        updatedAt: command.recordedAt,
        version: nextVersion(session.version),
      };
      await repositories.saveChoiceSession(updatedSession, {
        expectedVersion: session.version,
      });
      const projection = await requireChoiceTruthProjection(repositories, command.pharmacyCaseId);
      const updatedProjection: PharmacyChoiceTruthProjection = {
        ...projection,
        overrideAcknowledgementRef: makeRef(
          "PharmacyChoiceOverrideAcknowledgement",
          acknowledgement.pharmacyChoiceOverrideAcknowledgementId,
          TASK_343,
        ),
        patientOverrideRequired: false,
        computedAt: command.recordedAt,
        version: nextVersion(projection.version),
      };
      await repositories.saveChoiceTruthProjection(updatedProjection, {
        expectedVersion: projection.version,
      });

      await repositories.saveCommandReplay({
        replayKey,
        resultKind: "acknowledgement",
        resultRefId: acknowledgement.pharmacyChoiceOverrideAcknowledgementId,
        version: 1,
      });

      return {
        acknowledgement,
        choiceSession: updatedSession,
        choiceTruthProjection: updatedProjection,
        replayed: false,
      };
    },

    async capturePharmacyConsent(command) {
      const replayKey =
        command.idempotencyKey ??
        consentReplayKey({
          pharmacyCaseId: command.pharmacyCaseId,
          consentScriptVersion: command.consentScriptVersion,
          expectedSelectionBindingHash: command.expectedSelectionBindingHash,
        });
      const replayed = await maybeReplay(replayKey, async (refId) => {
        const record = await repositories.getConsentRecord(refId);
        invariant(record, "CONSENT_RECORD_NOT_FOUND", "The consent record was not found.");
        const checkpoint = await repositories.getLatestConsentCheckpointForCase(
          command.pharmacyCaseId,
        );
        invariant(
          checkpoint,
          "CONSENT_CHECKPOINT_NOT_FOUND",
          "The consent checkpoint was not found.",
        );
        const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
        const projection = await requireChoiceTruthProjection(repositories, command.pharmacyCaseId);
        return {
          consentRecord: record.toSnapshot(),
          consentCheckpoint: checkpoint.toSnapshot(),
          choiceSession: session,
          choiceTruthProjection: projection,
          replayed: true,
        } satisfies PharmacyConsentCaptureResult;
      });
      if (replayed) {
        return replayed;
      }

      await caseKernelService.verifyMutationAuthority({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: `capture_consent_${command.actorRef}`,
        commandSettlementRecordRef: `capture_consent_${command.actorRef}`,
        recordedAt: command.recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        reasonCode: command.reasonCode,
      });

      const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
      invariant(
        session.selectedProviderRef !== null &&
          session.selectedProviderExplanationRef !== null &&
          session.selectedProviderCapabilitySnapshotRef !== null,
        "NO_SELECTED_PROVIDER",
        "Consent capture requires a selected provider.",
      );
      invariant(
        session.selectionBindingHash === command.expectedSelectionBindingHash,
        "STALE_SELECTION_BINDING",
        "The expected selection binding hash is stale.",
      );
      invariant(
        !session.patientOverrideRequired,
        "WARNED_CHOICE_ACKNOWLEDGEMENT_REQUIRED",
        "Consent cannot be captured until warned-choice acknowledgement settles.",
      );

      const directorySnapshot = (
        await repositories.getDirectorySnapshot(session.directorySnapshotRef.refId)
      )!.toSnapshot();
      const consentRecord: PharmacyConsentRecord = {
        pharmacyConsentRecordId: nextId("pharmacy_consent_record"),
        pharmacyCaseRef: makeRef("PharmacyCase", command.pharmacyCaseId, TASK_342),
        providerRef: makeRef("PharmacyProvider", session.selectedProviderRef.refId, TASK_343),
        pathwayOrLane: directorySnapshot.pathwayOrLane,
        referralScope: requireText(command.referralScope, "referralScope"),
        choiceSessionRef: makeRef(
          "PharmacyChoiceSession",
          session.pharmacyChoiceSessionId,
          TASK_343,
        ),
        choiceProofRef: makeRef("PharmacyChoiceProof", session.choiceProofRef.refId, TASK_343),
        selectedExplanationRef: makeRef(
          "PharmacyChoiceExplanation",
          session.selectedProviderExplanationRef.refId,
          TASK_343,
        ),
        overrideAcknowledgementRef:
          session.overrideAcknowledgementRef === null
            ? null
            : makeRef(
                "PharmacyChoiceOverrideAcknowledgement",
                session.overrideAcknowledgementRef.refId,
                TASK_343,
              ),
        selectionBindingHash: session.selectionBindingHash!,
        channel: command.channel,
        consentScriptVersionRef: command.consentScriptVersion,
        patientAwarenessOfGpVisibility: command.patientAwarenessOfGpVisibility,
        packageFingerprint: command.packageFingerprint ?? null,
        state: "granted",
        grantedAt: command.recordedAt,
        supersededAt: null,
        version: 1,
      };
      await repositories.saveConsentRecord(consentRecord);

      const currentCheckpoint =
        (await repositories.getLatestConsentCheckpointForCase(command.pharmacyCaseId))?.toSnapshot() ??
        null;
      const checkpointId =
        currentCheckpoint?.pharmacyConsentCheckpointId ?? nextId("pharmacy_consent_checkpoint");
      const consentCheckpoint: PharmacyConsentCheckpoint = {
        pharmacyConsentCheckpointId: checkpointId,
        pharmacyCaseRef: makeRef("PharmacyCase", command.pharmacyCaseId, TASK_342),
        providerRef: makeRef("PharmacyProvider", session.selectedProviderRef.refId, TASK_343),
        pathwayOrLane: directorySnapshot.pathwayOrLane,
        referralScope: command.referralScope,
        choiceProofRef: makeRef("PharmacyChoiceProof", session.choiceProofRef.refId, TASK_343),
        selectedExplanationRef: makeRef(
          "PharmacyChoiceExplanation",
          session.selectedProviderExplanationRef.refId,
          TASK_343,
        ),
        consentRecordRef: makeRef(
          "PharmacyConsentRecord",
          consentRecord.pharmacyConsentRecordId,
          TASK_343,
        ),
        latestRevocationRef: null,
        selectionBindingHash: session.selectionBindingHash!,
        packageFingerprint: command.packageFingerprint ?? null,
        checkpointState: currentCheckpointState(consentRecord),
        continuityState: "current",
        evaluatedAt: command.recordedAt,
        version: currentCheckpoint === null ? 1 : nextVersion(currentCheckpoint.version),
      };
      await repositories.saveConsentCheckpoint(
        consentCheckpoint,
        currentCheckpoint === null ? undefined : { expectedVersion: currentCheckpoint.version },
      );

      const updatedSession: PharmacyChoiceSession = {
        ...session,
        sessionState: "completed",
        updatedAt: command.recordedAt,
        revision: session.revision + 1,
        version: nextVersion(session.version),
      };
      await repositories.saveChoiceSession(updatedSession, {
        expectedVersion: session.version,
      });
      const projection = await requireChoiceTruthProjection(repositories, command.pharmacyCaseId);
      const updatedProjection: PharmacyChoiceTruthProjection = {
        ...projection,
        projectionState: "read_only_provenance",
        computedAt: command.recordedAt,
        version: nextVersion(projection.version),
      };
      await repositories.saveChoiceTruthProjection(updatedProjection, {
        expectedVersion: projection.version,
      });

      await repositories.saveCommandReplay({
        replayKey,
        resultKind: "consent",
        resultRefId: consentRecord.pharmacyConsentRecordId,
        version: 1,
      });

      return {
        consentRecord,
        consentCheckpoint,
        choiceSession: updatedSession,
        choiceTruthProjection: updatedProjection,
        replayed: false,
      };
    },

    async revokeOrSupersedeConsent(command) {
      const replayKey =
        command.idempotencyKey ??
        revocationReplayKey({
          pharmacyCaseId: command.pharmacyCaseId,
          reasonCode: command.reasonCode,
          actorRef: command.actorRef,
        });
      const replayed = await maybeReplay(replayKey, async (refId) => {
        const record = await repositories.getConsentRevocationRecord(refId);
        invariant(
          record,
          "CONSENT_REVOCATION_NOT_FOUND",
          "The consent revocation record was not found.",
        );
        const checkpoint = (
          await repositories.getLatestConsentCheckpointForCase(command.pharmacyCaseId)
        )!.toSnapshot();
        const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
        const projection = await requireChoiceTruthProjection(repositories, command.pharmacyCaseId);
        return {
          revocationRecord: record.toSnapshot(),
          consentCheckpoint: checkpoint,
          choiceSession: session,
          choiceTruthProjection: projection,
          replayed: true,
        } satisfies PharmacyConsentRevocationResult;
      });
      if (replayed) {
        return replayed;
      }

      await caseKernelService.verifyMutationAuthority({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: `revoke_consent_${command.actorRef}`,
        commandSettlementRecordRef: `revoke_consent_${command.actorRef}`,
        recordedAt: command.recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        reasonCode: command.reasonCode,
      });

      const consentRecordDocument = await repositories.getLatestConsentRecordForCase(
        command.pharmacyCaseId,
      );
      invariant(
        consentRecordDocument,
        "CONSENT_RECORD_NOT_FOUND",
        "A current consent record is required to revoke or supersede consent.",
      );
      const consentRecord = consentRecordDocument.toSnapshot();
      const updatedConsentRecord: PharmacyConsentRecord = {
        ...consentRecord,
        state:
          reasonCodeToRevocationClass(command.reasonCode) === "withdrawn_by_patient"
            ? "withdrawn"
            : "superseded",
        supersededAt: command.recordedAt,
        version: nextVersion(consentRecord.version),
      };
      await repositories.saveConsentRecord(updatedConsentRecord, {
        expectedVersion: consentRecord.version,
      });

      const revocationRecord: PharmacyConsentRevocationRecord = {
        pharmacyConsentRevocationRecordId: nextId("pharmacy_consent_revocation"),
        pharmacyCaseRef: makeRef("PharmacyCase", command.pharmacyCaseId, TASK_342),
        consentRecordRef: makeRef(
          "PharmacyConsentRecord",
          updatedConsentRecord.pharmacyConsentRecordId,
          TASK_343,
        ),
        reasonClass: reasonCodeToRevocationClass(command.reasonCode),
        revocationState: "recorded",
        recordedAt: command.recordedAt,
        version: 1,
      };
      await repositories.saveConsentRevocationRecord(revocationRecord);

      const checkpointDocument = await repositories.getLatestConsentCheckpointForCase(
        command.pharmacyCaseId,
      );
      invariant(
        checkpointDocument,
        "CONSENT_CHECKPOINT_NOT_FOUND",
        "A current consent checkpoint is required to revoke or supersede consent.",
      );
      const checkpoint = checkpointDocument.toSnapshot();
      const updatedCheckpoint: PharmacyConsentCheckpoint = {
        ...checkpoint,
        consentRecordRef: makeRef(
          "PharmacyConsentRecord",
          updatedConsentRecord.pharmacyConsentRecordId,
          TASK_343,
        ),
        latestRevocationRef: makeRef(
          "PharmacyConsentRevocationRecord",
          revocationRecord.pharmacyConsentRevocationRecordId,
          TASK_343,
        ),
        checkpointState:
          revocationRecord.reasonClass === "post_dispatch_withdrawal"
            ? "revoked_post_dispatch"
            : currentCheckpointState(updatedConsentRecord),
        continuityState: "stale",
        evaluatedAt: command.recordedAt,
        version: nextVersion(checkpoint.version),
      };
      await repositories.saveConsentCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });

      const session = await requireChoiceSession(repositories, command.pharmacyCaseId);
      const updatedSession: PharmacyChoiceSession = {
        ...session,
        patientOverrideRequired: false,
        sessionState: "recovery_required",
        updatedAt: command.recordedAt,
        revision: session.revision + 1,
        version: nextVersion(session.version),
      };
      await repositories.saveChoiceSession(updatedSession, {
        expectedVersion: session.version,
      });
      const projection = await requireChoiceTruthProjection(repositories, command.pharmacyCaseId);
      const updatedProjection: PharmacyChoiceTruthProjection = {
        ...projection,
        patientOverrideRequired: false,
        overrideAcknowledgementRef:
          updatedSession.overrideAcknowledgementRef === null
            ? null
            : makeRef(
                "PharmacyChoiceOverrideAcknowledgement",
                updatedSession.overrideAcknowledgementRef.refId,
                TASK_343,
              ),
        projectionState: "recovery_required",
        computedAt: command.recordedAt,
        version: nextVersion(projection.version),
      };
      await repositories.saveChoiceTruthProjection(updatedProjection, {
        expectedVersion: projection.version,
      });

      await repositories.saveCommandReplay({
        replayKey,
        resultKind: "revocation",
        resultRefId: revocationRecord.pharmacyConsentRevocationRecordId,
        version: 1,
      });

      return {
        revocationRecord,
        consentCheckpoint: updatedCheckpoint,
        choiceSession: updatedSession,
        choiceTruthProjection: updatedProjection,
        replayed: false,
      };
    },

    async refreshChoiceIfStale(command) {
      return this.discoverProvidersForCase({
        pharmacyCaseId: command.pharmacyCaseId,
        location: command.location,
        audience: command.audience,
        refreshMode: "if_stale",
        evaluatedAt: command.evaluatedAt,
      });
    },
  };
}
