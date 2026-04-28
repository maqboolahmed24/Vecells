import transportAssuranceRegistryContract from "../../../../data/contracts/343_phase6_transport_assurance_registry.json";
import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  createReplayCollisionAuthorityService,
  createReplayCollisionStore,
  createReservationConfirmationAuthorityService,
  createReservationConfirmationStore,
  defaultReservationConfirmationThresholdPolicy,
  type ConfirmationAssuranceLevel,
  type ConfirmationEvidenceAtom,
  type ExternalConfirmationGateSnapshot,
  type ReplayCollisionDependencies,
  type ReservationConfirmationDependencies,
} from "../../identity_access/src/index";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type Phase6PharmacyCaseKernelService,
  type PharmacyCaseBundle,
  type PharmacyCaseMutationResult,
  type PharmacyCaseSnapshot,
} from "./phase6-pharmacy-case-kernel";
import {
  createPhase6PharmacyDirectoryChoiceStore,
  type Phase6PharmacyDirectoryChoiceStore,
  type PharmacyChoiceExplanation,
  type PharmacyChoiceProof,
  type PharmacyChoiceSession,
  type PharmacyConsentCheckpoint,
  type PharmacyConsentRecord,
  type PharmacyDirectorySnapshot,
  type PharmacyProvider,
  type PharmacyProviderCapabilitySnapshot,
  type PharmacyTransportMode,
} from "./phase6-pharmacy-directory-choice-engine";
import {
  createPhase6PharmacyReferralPackageStore,
  type Phase6PharmacyReferralPackageStore,
  type PharmacyCorrelationRecordSnapshot,
  type PharmacyPackageArtifactSnapshot,
  type PharmacyPackageContentGovernanceDecisionSnapshot,
  type PharmacyReferralPackageSnapshot,
} from "./phase6-pharmacy-referral-package-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_349 =
  "par_349_phase6_track_backend_build_referral_pack_composer_and_content_governance_binding" as const;
const TASK_350 =
  "par_350_phase6_track_backend_build_dispatch_adapter_transport_contract_and_retry_expiry_logic" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task349 = typeof TASK_349;
type Task350 = typeof TASK_350;

export type DispatchTransportAcceptanceState =
  | "none"
  | "accepted"
  | "rejected"
  | "timed_out"
  | "disputed";

export type DispatchProofState = "pending" | "satisfied" | "disputed" | "expired";
export type DispatchRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type DispatchStateConfidenceBand = "high" | "medium" | "low";
export type PharmacyDispatchPlanState = "planned" | "superseded" | "cancelled";
export type PharmacyDispatchAttemptStatus =
  | "pending_send"
  | "sent_pending_proof"
  | "confirmed"
  | "failed"
  | "expired"
  | "disputed"
  | "superseded";
export type DispatchEvidenceLane =
  | "transport_acceptance"
  | "provider_acceptance"
  | "delivery"
  | "authoritative";
export type PharmacyDispatchSettlementResult =
  | "live_referral_confirmed"
  | "pending_ack"
  | "stale_choice_or_consent"
  | "denied_scope"
  | "reconciliation_required";
export type ManualDispatchAttestationState = "pending" | "attested" | "rejected";

export interface TransportAssuranceProfileSnapshot {
  transportAssuranceProfileId: string;
  transportMode: PharmacyTransportMode;
  assuranceClass: string;
  ackRequired: boolean;
  proofSources: readonly string[];
  proofDeadlinePolicy: string;
  dispatchConfidenceThreshold: number;
  contradictionThreshold: number;
  proofRiskModelRef: string;
  proofRiskCalibrationVersion: string;
  proofRiskThresholdSetRef: string;
  revisionPolicyRef: string;
  patientAssurancePolicy: string;
  exceptionPolicy: string;
  thetaDispatchTrack: number;
  thetaDispatchFail: number;
  lambdaDispatchContra: number;
  manualReviewRequired: boolean;
  version: number;
}

export interface DispatchAdapterBindingSnapshot {
  dispatchAdapterBindingId: string;
  transportMode: PharmacyTransportMode;
  adapterVersionRef: string;
  transformContractRef: string;
  providerCapabilitySnapshotRef:
    AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>;
  allowedArtifactClasses: readonly string[];
  requiresManualOperator: boolean;
  manualReviewPolicyRef: string;
  bindingHash: string;
  boundAt: string;
  version: number;
}

export interface ReferralArtifactManifestSnapshot {
  artifactManifestId: string;
  dispatchPlanRef: AggregateRef<"PharmacyDispatchPlan", Task343>;
  packageId: string;
  includedArtifactRefs: readonly string[];
  redactedArtifactRefs: readonly string[];
  omittedArtifactRefs: readonly string[];
  transformNotesRef: string;
  classificationRef: string;
  manifestHash: string;
  compiledAt: string;
  version: number;
}

export interface PharmacyDispatchPayloadSnapshot {
  dispatchPayloadId: string;
  packageId: string;
  dispatchPlanRef: AggregateRef<"PharmacyDispatchPlan", Task343>;
  transportMode: PharmacyTransportMode;
  representationSetRef: string | null;
  manifestHash: string;
  payloadHash: string;
  payload: Record<string, unknown>;
  compiledAt: string;
  version: number;
}

export interface PharmacyDispatchPlanSnapshot {
  dispatchPlanId: string;
  pharmacyCaseId: string;
  packageId: string;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  providerCapabilitySnapshotRef:
    AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>;
  transportMode: PharmacyTransportMode;
  transportAssuranceProfileRef: AggregateRef<"TransportAssuranceProfile", Task343>;
  dispatchAdapterBindingRef: AggregateRef<"DispatchAdapterBinding", Task343>;
  transformContractRef: string;
  allowedArtifactClasses: readonly string[];
  artifactManifestRef: AggregateRef<"ReferralArtifactManifest", Task343>;
  dispatchPayloadRef: string;
  dispatchPayloadHash: string;
  dispatchPlanHash: string;
  manualReviewPolicyRef: string;
  planState: PharmacyDispatchPlanState;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  plannedAt: string;
  version: number;
}

export interface DispatchEvidenceObservationSnapshot {
  evidenceObservationId: string;
  dispatchAttemptId: string;
  lane: DispatchEvidenceLane;
  sourceClass: string;
  sourceFamily: string;
  polarity: "positive" | "negative";
  logLikelihoodWeight: number;
  satisfiesHardMatchRefs: readonly string[];
  failsHardMatchRefs: readonly string[];
  contradictory: boolean;
  receiptCheckpointRef: string | null;
  proofRef: string | null;
  sourceCorrelationRef: string | null;
  payloadDigest: string;
  recordedAt: string;
  version: number;
}

export interface PharmacyDispatchAttemptSnapshot {
  dispatchAttemptId: string;
  pharmacyCaseId: string;
  packageId: string;
  dispatchPlanRef: AggregateRef<"PharmacyDispatchPlan", Task343>;
  transportMode: PharmacyTransportMode;
  transportAssuranceProfileRef: AggregateRef<"TransportAssuranceProfile", Task343>;
  routeIntentBindingRef: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  routeIntentTupleHash: string;
  idempotencyKey: string;
  requestLifecycleLeaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  requestOwnershipEpochRef: string;
  commandActionRecordRef: string;
  idempotencyRecordRef: string;
  adapterDispatchAttemptRef: string;
  latestReceiptCheckpointRef: string;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  providerCapabilitySnapshotRef:
    AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>;
  dispatchAdapterBindingRef: AggregateRef<"DispatchAdapterBinding", Task343>;
  dispatchPlanHash: string;
  packageHash: string;
  outboundReferenceSet: readonly string[];
  outboundReferenceSetHash: string;
  status: PharmacyDispatchAttemptStatus;
  transportAcceptanceState: DispatchTransportAcceptanceState;
  providerAcceptanceState: DispatchTransportAcceptanceState;
  proofDeadlineAt: string;
  proofState: DispatchProofState;
  dispatchConfidence: number;
  contradictionScore: number;
  proofEnvelopeRef: AggregateRef<"DispatchProofEnvelope", Task343> | null;
  externalConfirmationGateRef: AggregateRef<"ExternalConfirmationGate", Task343> | null;
  authoritativeProofRef: string;
  supersededByAttemptRef: AggregateRef<"PharmacyDispatchAttempt", Task343> | null;
  attemptedAt: string;
  confirmedAt: string | null;
  lastSentAt: string | null;
  retryGeneration: number;
  version: number;
}

export interface DispatchProofEnvelopeSnapshot {
  dispatchProofEnvelopeId: string;
  dispatchAttemptId: string;
  transportAssuranceProfileRef: AggregateRef<"TransportAssuranceProfile", Task343>;
  proofDeadlineAt: string;
  proofSources: readonly string[];
  transportAcceptanceEvidenceRefs: readonly string[];
  providerAcceptanceEvidenceRefs: readonly string[];
  deliveryEvidenceRefs: readonly string[];
  authoritativeProofSourceRef: string | null;
  proofComponents: readonly string[];
  proofConfidence: number;
  dispatchConfidence: number;
  contradictionScore: number;
  sourceCorrelationRefs: readonly string[];
  duplicateOfRef: string | null;
  proofState: DispatchProofState;
  riskState: DispatchRiskState;
  stateConfidenceBand: DispatchStateConfidenceBand;
  calibrationVersion: string;
  causalToken: string;
  monotoneRevision: number;
  verifiedAt: string;
  version: number;
}

export interface ManualDispatchAssistanceRecordSnapshot {
  manualDispatchAssistanceRecordId: string;
  dispatchAttemptId: string;
  operatorRef: string;
  operatorActionRef: string;
  secondReviewerRef: string | null;
  evidenceRefs: readonly string[];
  attestationState: ManualDispatchAttestationState;
  completedAt: string | null;
  version: number;
}

export interface PharmacyContinuityEvidenceProjectionSnapshot {
  pharmacyContinuityEvidenceProjectionId: string;
  pharmacyCaseId: string;
  dispatchAttemptRef: AggregateRef<"PharmacyDispatchAttempt", Task343>;
  settlementResult: PharmacyDispatchSettlementResult;
  pendingPosture:
    | "on_track_pending"
    | "at_risk_pending"
    | "likely_failed_pending"
    | "recovery_required"
    | "calm_confirmed";
  audienceMessageRef: string;
  nextReviewAt: string | null;
  computedAt: string;
  version: number;
}

export interface PharmacyDispatchSettlementSnapshot {
  settlementId: string;
  pharmacyCaseId: string;
  dispatchAttemptId: string;
  dispatchPlanRef: AggregateRef<"PharmacyDispatchPlan", Task343>;
  routeIntentBindingRef: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  routeIntentTupleHash: string;
  proofEnvelopeRef: AggregateRef<"DispatchProofEnvelope", Task343>;
  transportAssuranceProfileRef: AggregateRef<"TransportAssuranceProfile", Task343>;
  dispatchAdapterBindingRef: AggregateRef<"DispatchAdapterBinding", Task343>;
  consentCheckpointRef: AggregateRef<"PharmacyConsentCheckpoint", Task343>;
  result: PharmacyDispatchSettlementResult;
  proofRiskState: DispatchRiskState;
  stateConfidenceBand: DispatchStateConfidenceBand;
  calibrationVersion: string;
  receiptTextRef: string;
  experienceContinuityEvidenceRef: string;
  causalToken: string;
  recoveryRouteRef: string | null;
  monotoneRevision: number;
  recordedAt: string;
  version: number;
}

export interface PharmacyDispatchTruthProjectionSnapshot {
  pharmacyDispatchTruthProjectionId: string;
  pharmacyCaseId: string;
  dispatchAttemptRef: AggregateRef<"PharmacyDispatchAttempt", Task343>;
  dispatchPlanRef: AggregateRef<"PharmacyDispatchPlan", Task343>;
  selectedProviderRef: AggregateRef<"PharmacyProvider", Task343>;
  packageId: string;
  packageHash: string;
  transportMode: PharmacyTransportMode;
  transportAssuranceProfileRef: AggregateRef<"TransportAssuranceProfile", Task343>;
  dispatchAdapterBindingRef: AggregateRef<"DispatchAdapterBinding", Task343>;
  dispatchPlanHash: string;
  transportAcceptanceState: DispatchTransportAcceptanceState;
  providerAcceptanceState: DispatchTransportAcceptanceState;
  authoritativeProofState: DispatchProofState;
  proofRiskState: DispatchRiskState;
  dispatchConfidence: number;
  contradictionScore: number;
  proofDeadlineAt: string;
  outboundReferenceSetHash: string;
  proofEnvelopeRef: AggregateRef<"DispatchProofEnvelope", Task343>;
  dispatchSettlementRef: AggregateRef<"PharmacyDispatchSettlement", Task343>;
  continuityEvidenceRef: string;
  audienceMessageRef: string;
  computedAt: string;
  version: number;
}

export interface PharmacyDispatchAuditEventSnapshot {
  pharmacyDispatchAuditEventId: string;
  pharmacyCaseId: string;
  dispatchAttemptId: string | null;
  eventName: string;
  actorRef: string | null;
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

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function addDurationToIso(base: string, isoDuration: string): string {
  const duration = requireText(isoDuration, "isoDuration");
  const match =
    /^P(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)$/i.exec(duration);
  invariant(match !== null, "UNSUPPORTED_DURATION_FORMAT", `Unsupported ISO-8601 duration ${duration}.`);
  const hours = Number(match.groups?.hours ?? "0");
  const minutes = Number(match.groups?.minutes ?? "0");
  const seconds = Number(match.groups?.seconds ?? "0");
  const deltaMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
  const timestamp = Date.parse(base);
  invariant(!Number.isNaN(timestamp), "INVALID_BASE_TIMESTAMP", "base must be an ISO-8601 timestamp.");
  return new Date(timestamp + deltaMs).toISOString();
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

const TRANSPORT_PRIORITY: readonly PharmacyTransportMode[] = [
  "bars_fhir",
  "supplier_interop",
  "mesh",
  "nhsmail_shared_mailbox",
  "manual_assisted_dispatch",
] as const;

const ALLOWED_ARTIFACT_CLASSES_BY_MODE: Record<PharmacyTransportMode, readonly string[]> = {
  bars_fhir: [
    "service_request",
    "communication",
    "consent",
    "provenance",
    "audit_event",
    "patient_summary",
    "clinical_summary",
  ],
  supplier_interop: [
    "service_request",
    "communication",
    "document_reference",
    "consent",
    "provenance",
    "audit_event",
    "patient_summary",
    "clinical_summary",
  ],
  mesh: [
    "service_request",
    "communication",
    "document_reference",
    "consent",
    "provenance",
    "audit_event",
    "patient_summary",
    "clinical_summary",
  ],
  nhsmail_shared_mailbox: [
    "communication",
    "document_reference",
    "consent",
    "provenance",
    "audit_event",
    "patient_summary",
    "clinical_summary",
  ],
  manual_assisted_dispatch: [
    "communication",
    "document_reference",
    "consent",
    "provenance",
    "audit_event",
    "patient_summary",
    "clinical_summary",
  ],
} as const;

const DEFAULT_AUDIENCE_MESSAGES = {
  live_referral_confirmed: "pharmacy.dispatch.truth.live_referral_confirmed",
  pending_ack: "pharmacy.dispatch.truth.pending_ack",
  stale_choice_or_consent: "pharmacy.dispatch.truth.stale_choice_or_consent",
  denied_scope: "pharmacy.dispatch.truth.denied_scope",
  reconciliation_required: "pharmacy.dispatch.truth.reconciliation_required",
} as const;

type TransportRegistryProfile = (typeof transportAssuranceRegistryContract)["profiles"][number];

function asTransportProfileSnapshot(
  profile: TransportRegistryProfile,
): TransportAssuranceProfileSnapshot {
  return {
    transportAssuranceProfileId: profile.profileId,
    transportMode: profile.transportMode as PharmacyTransportMode,
    assuranceClass: profile.assuranceClass,
    ackRequired: profile.ackRequired,
    proofSources: [...profile.proofSources],
    proofDeadlinePolicy: profile.proofDeadlinePolicy,
    dispatchConfidenceThreshold: profile.dispatchConfidenceThreshold,
    contradictionThreshold: profile.contradictionThreshold,
    proofRiskModelRef: profile.proofRiskModelRef,
    proofRiskCalibrationVersion: profile.proofRiskCalibrationVersion,
    proofRiskThresholdSetRef: profile.proofRiskThresholdSetRef,
    revisionPolicyRef: profile.revisionPolicyRef,
    patientAssurancePolicy: profile.patientAssurancePolicy,
    exceptionPolicy: profile.exceptionPolicy,
    thetaDispatchTrack: profile.theta_dispatch_track,
    thetaDispatchFail: profile.theta_dispatch_fail,
    lambdaDispatchContra: profile.lambda_dispatch_contra,
    manualReviewRequired: profile.manualReviewRequired,
    version: 1,
  };
}

function getTransportAssuranceLevel(
  profile: TransportAssuranceProfileSnapshot,
): ConfirmationAssuranceLevel {
  switch (profile.transportMode) {
    case "bars_fhir":
      return "strong";
    case "supplier_interop":
    case "mesh":
      return "moderate";
    case "nhsmail_shared_mailbox":
    case "manual_assisted_dispatch":
      return "manual";
    default:
      return "weak";
  }
}

function buildAdapterVersionRef(transportMode: PharmacyTransportMode): string {
  return `dispatch_adapter.${transportMode}.v1`;
}

function buildTransformContractRef(transportMode: PharmacyTransportMode): string {
  return `dispatch_transform.${transportMode}.v1`;
}

function buildManualReviewPolicyRef(profile: TransportAssuranceProfileSnapshot): string {
  return profile.manualReviewRequired
    ? `manual_review_required::${profile.transportMode}`
    : `manual_review_not_required::${profile.transportMode}`;
}

function buildBindingHash(input: {
  transportMode: PharmacyTransportMode;
  adapterVersionRef: string;
  transformContractRef: string;
  providerCapabilitySnapshotRef: string;
  allowedArtifactClasses: readonly string[];
  requiresManualOperator: boolean;
  manualReviewPolicyRef: string;
}): string {
  return stableReviewDigest({
    transportMode: input.transportMode,
    adapterVersionRef: input.adapterVersionRef,
    transformContractRef: input.transformContractRef,
    providerCapabilitySnapshotRef: input.providerCapabilitySnapshotRef,
    allowedArtifactClasses: uniqueSorted(input.allowedArtifactClasses),
    requiresManualOperator: input.requiresManualOperator,
    manualReviewPolicyRef: input.manualReviewPolicyRef,
  });
}

function buildArtifactManifestHash(input: {
  packageId: string;
  includedArtifactRefs: readonly string[];
  redactedArtifactRefs: readonly string[];
  omittedArtifactRefs: readonly string[];
  transformNotesRef: string;
  classificationRef: string;
}): string {
  return stableReviewDigest({
    packageId: input.packageId,
    includedArtifactRefs: uniqueSorted(input.includedArtifactRefs),
    redactedArtifactRefs: uniqueSorted(input.redactedArtifactRefs),
    omittedArtifactRefs: uniqueSorted(input.omittedArtifactRefs),
    transformNotesRef: input.transformNotesRef,
    classificationRef: input.classificationRef,
  });
}

function buildDispatchPayloadHash(payload: Record<string, unknown>): string {
  return stableReviewDigest(payload);
}

function buildDispatchPlanHash(input: {
  pharmacyCaseId: string;
  packageHash: string;
  dispatchPayloadHash: string;
  manifestHash: string;
  providerRef: string;
  providerCapabilitySnapshotRef: string;
  transportAssuranceProfileRef: string;
  dispatchAdapterBindingRef: string;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
}): string {
  return stableReviewDigest({
    pharmacyCaseId: input.pharmacyCaseId,
    packageHash: input.packageHash,
    dispatchPayloadHash: input.dispatchPayloadHash,
    manifestHash: input.manifestHash,
    providerRef: input.providerRef,
    providerCapabilitySnapshotRef: input.providerCapabilitySnapshotRef,
    transportAssuranceProfileRef: input.transportAssuranceProfileRef,
    dispatchAdapterBindingRef: input.dispatchAdapterBindingRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    routeIntentTupleHash: input.routeIntentTupleHash,
    canonicalObjectDescriptorRef: input.canonicalObjectDescriptorRef,
    governingObjectVersionRef: input.governingObjectVersionRef,
  });
}

function buildEffectKey(input: {
  pharmacyCaseId: string;
  packageHash: string;
  dispatchPlanHash: string;
  routeIntentTupleHash: string;
  transportMode: PharmacyTransportMode;
}): string {
  return stableReviewDigest(input);
}

function buildOutboundReferenceSetHash(values: readonly string[]): string {
  return stableReviewDigest(uniqueSorted(values));
}

function buildProofThresholdPolicy(profile: TransportAssuranceProfileSnapshot) {
  const tauConfirm = ensureUnitInterval(
    profile.dispatchConfidenceThreshold,
    "dispatchConfidenceThreshold",
  );
  const tauHold = Math.min(
    tauConfirm - 0.05,
    Math.max(0.2, profile.thetaDispatchTrack),
  );
  return {
    policyRef: `${profile.transportAssuranceProfileId}::threshold_policy`,
    tauHold,
    tauConfirm,
    deltaConfirm: Math.max(
      0.05,
      Math.min(defaultReservationConfirmationThresholdPolicy.deltaConfirm, profile.contradictionThreshold),
    ),
    weakManualMinSourceFamilies:
      defaultReservationConfirmationThresholdPolicy.weakManualMinSourceFamilies,
  } as const;
}

function buildAudienceMessageRef(
  result: PharmacyDispatchSettlementResult,
  riskState: DispatchRiskState,
): string {
  if (result === "pending_ack") {
    return `${DEFAULT_AUDIENCE_MESSAGES.pending_ack}.${riskState}`;
  }
  return DEFAULT_AUDIENCE_MESSAGES[result];
}

function buildContinuityPosture(
  result: PharmacyDispatchSettlementResult,
  riskState: DispatchRiskState,
): PharmacyContinuityEvidenceProjectionSnapshot["pendingPosture"] {
  if (result === "live_referral_confirmed") {
    return "calm_confirmed";
  }
  if (result === "pending_ack") {
    if (riskState === "on_track") {
      return "on_track_pending";
    }
    if (riskState === "at_risk") {
      return "at_risk_pending";
    }
    return "likely_failed_pending";
  }
  return "recovery_required";
}

function buildStateConfidenceBand(confidence: number): DispatchStateConfidenceBand {
  if (confidence >= 0.82) {
    return "high";
  }
  if (confidence >= 0.55) {
    return "medium";
  }
  return "low";
}

function buildAttemptStatus(input: {
  proofState: DispatchProofState;
  transportAcceptanceState: DispatchTransportAcceptanceState;
}): PharmacyDispatchAttemptStatus {
  if (input.proofState === "satisfied") {
    return "confirmed";
  }
  if (input.proofState === "expired") {
    return "expired";
  }
  if (input.proofState === "disputed") {
    return "disputed";
  }
  if (
    input.transportAcceptanceState === "rejected" ||
    input.transportAcceptanceState === "disputed"
  ) {
    return "failed";
  }
  return "sent_pending_proof";
}

function normalizeSourceFamily(sourceClass: string, lane: DispatchEvidenceLane): string {
  if (sourceClass.includes("operator_attestation")) {
    return "operator_attestation";
  }
  if (sourceClass.includes("second_reviewer")) {
    return "second_reviewer_attestation";
  }
  if (sourceClass.includes("provider")) {
    return "provider_confirmation";
  }
  if (sourceClass.includes("mesh")) {
    return "mesh";
  }
  if (sourceClass.includes("bars")) {
    return "bars";
  }
  if (sourceClass.includes("supplier")) {
    return "supplier";
  }
  if (sourceClass.includes("mail")) {
    return "mailbox";
  }
  return lane;
}

function deriveEvidenceDefaults(
  lane: DispatchEvidenceLane,
  sourceClass: string,
): Pick<
  DispatchEvidenceObservationSnapshot,
  "polarity" | "logLikelihoodWeight" | "satisfiesHardMatchRefs" | "failsHardMatchRefs" | "contradictory"
> {
  const authoritative =
    lane === "authoritative" || sourceClass.includes("authoritative") || sourceClass.includes("attestation");
  return {
    polarity: "positive",
    logLikelihoodWeight:
      authoritative ? 1.6 : lane === "provider_acceptance" ? 0.9 : lane === "delivery" ? 0.55 : 0.65,
    satisfiesHardMatchRefs: authoritative ? ["authoritative_dispatch_proof"] : [],
    failsHardMatchRefs: [],
    contradictory: false,
  };
}

export interface PharmacyDispatchAdapterSendRequest {
  attemptId: string;
  plan: PharmacyDispatchPlanSnapshot;
  payload: PharmacyDispatchPayloadSnapshot;
  frozenPackage: PharmacyReferralPackageSnapshot;
  provider: PharmacyProvider;
  transportAssuranceProfile: TransportAssuranceProfileSnapshot;
  binding: DispatchAdapterBindingSnapshot;
  recordedAt: string;
}

export interface PharmacyDispatchAdapterSendResult {
  accepted: boolean;
  transportMessageId: string;
  providerCorrelationRef: string | null;
  acknowledgementSourceClass: string;
  rawReceipt: Record<string, unknown>;
  semanticReceipt: Record<string, unknown>;
}

export interface PharmacyDispatchAdapter {
  readonly transportMode: PharmacyTransportMode;
  readonly adapterVersionRef: string;
  send(request: PharmacyDispatchAdapterSendRequest): Promise<PharmacyDispatchAdapterSendResult>;
}

export function createDeterministicPharmacyDispatchAdapter(input: {
  transportMode: PharmacyTransportMode;
  adapterVersionRef?: string;
}): PharmacyDispatchAdapter {
  const adapterVersionRef = input.adapterVersionRef ?? buildAdapterVersionRef(input.transportMode);
  return {
    transportMode: input.transportMode,
    adapterVersionRef,
    async send(request) {
      const transportMessageId = `${input.transportMode}_msg_${stableReviewDigest({
        attemptId: request.attemptId,
        dispatchPlanHash: request.plan.dispatchPlanHash,
        recordedAt: request.recordedAt,
      }).slice(0, 16)}`;
      const providerCorrelationRef = `${input.transportMode}_corr_${stableReviewDigest({
        providerRef: request.provider.providerId,
        packageId: request.frozenPackage.packageId,
        transportMessageId,
      }).slice(0, 16)}`;
      return {
        accepted: true,
        transportMessageId,
        providerCorrelationRef,
        acknowledgementSourceClass: request.transportAssuranceProfile.proofSources[0] ?? "transport_ack",
        rawReceipt: {
          transportMode: input.transportMode,
          transportMessageId,
          providerCorrelationRef,
          accepted: true,
          adapterVersionRef,
          recordedAt: request.recordedAt,
        },
        semanticReceipt: {
          transportMode: input.transportMode,
          accepted: true,
          providerCorrelationRef,
        },
      };
    },
  };
}

export interface Phase6PharmacyDispatchRepositories {
  getTransportAssuranceProfile(
    transportAssuranceProfileId: string,
  ): Promise<SnapshotDocument<TransportAssuranceProfileSnapshot> | null>;
  listTransportAssuranceProfiles(): Promise<readonly SnapshotDocument<TransportAssuranceProfileSnapshot>[]>;
  saveTransportAssuranceProfile(
    snapshot: TransportAssuranceProfileSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDispatchAdapterBinding(
    dispatchAdapterBindingId: string,
  ): Promise<SnapshotDocument<DispatchAdapterBindingSnapshot> | null>;
  getCurrentDispatchAdapterBinding(
    providerCapabilitySnapshotId: string,
    transportMode: PharmacyTransportMode,
  ): Promise<SnapshotDocument<DispatchAdapterBindingSnapshot> | null>;
  saveDispatchAdapterBinding(
    snapshot: DispatchAdapterBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReferralArtifactManifest(
    artifactManifestId: string,
  ): Promise<SnapshotDocument<ReferralArtifactManifestSnapshot> | null>;
  saveReferralArtifactManifest(
    snapshot: ReferralArtifactManifestSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDispatchPayload(
    dispatchPayloadId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchPayloadSnapshot> | null>;
  saveDispatchPayload(
    snapshot: PharmacyDispatchPayloadSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDispatchPlan(dispatchPlanId: string): Promise<SnapshotDocument<PharmacyDispatchPlanSnapshot> | null>;
  getCurrentDispatchPlanForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchPlanSnapshot> | null>;
  saveDispatchPlan(
    snapshot: PharmacyDispatchPlanSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDispatchAttempt(
    dispatchAttemptId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchAttemptSnapshot> | null>;
  getCurrentDispatchAttemptForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchAttemptSnapshot> | null>;
  listDispatchAttemptsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyDispatchAttemptSnapshot>[]>;
  listDispatchAttempts(): Promise<readonly SnapshotDocument<PharmacyDispatchAttemptSnapshot>[]>;
  saveDispatchAttempt(
    snapshot: PharmacyDispatchAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getEvidenceObservation(
    evidenceObservationId: string,
  ): Promise<SnapshotDocument<DispatchEvidenceObservationSnapshot> | null>;
  listEvidenceObservationsForAttempt(
    dispatchAttemptId: string,
  ): Promise<readonly SnapshotDocument<DispatchEvidenceObservationSnapshot>[]>;
  saveEvidenceObservation(
    snapshot: DispatchEvidenceObservationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getProofEnvelope(
    dispatchProofEnvelopeId: string,
  ): Promise<SnapshotDocument<DispatchProofEnvelopeSnapshot> | null>;
  getCurrentProofEnvelopeForAttempt(
    dispatchAttemptId: string,
  ): Promise<SnapshotDocument<DispatchProofEnvelopeSnapshot> | null>;
  saveProofEnvelope(
    snapshot: DispatchProofEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listManualDispatchAssistanceRecords(
    dispatchAttemptId: string,
  ): Promise<readonly SnapshotDocument<ManualDispatchAssistanceRecordSnapshot>[]>;
  saveManualDispatchAssistanceRecord(
    snapshot: ManualDispatchAssistanceRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getContinuityEvidenceProjection(
    pharmacyContinuityEvidenceProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyContinuityEvidenceProjectionSnapshot> | null>;
  getCurrentContinuityEvidenceProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyContinuityEvidenceProjectionSnapshot> | null>;
  saveContinuityEvidenceProjection(
    snapshot: PharmacyContinuityEvidenceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDispatchSettlement(
    settlementId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchSettlementSnapshot> | null>;
  getCurrentDispatchSettlementForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchSettlementSnapshot> | null>;
  saveDispatchSettlement(
    snapshot: PharmacyDispatchSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDispatchTruthProjection(
    pharmacyDispatchTruthProjectionId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchTruthProjectionSnapshot> | null>;
  getCurrentDispatchTruthProjectionForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyDispatchTruthProjectionSnapshot> | null>;
  saveDispatchTruthProjection(
    snapshot: PharmacyDispatchTruthProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDispatchAuditEventsForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyDispatchAuditEventSnapshot>[]>;
  saveDispatchAuditEvent(
    snapshot: PharmacyDispatchAuditEventSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface Phase6PharmacyDispatchStore extends Phase6PharmacyDispatchRepositories {}

export function createPhase6PharmacyDispatchStore(): Phase6PharmacyDispatchStore {
  const transportProfiles = new Map<string, TransportAssuranceProfileSnapshot>();
  const adapterBindings = new Map<string, DispatchAdapterBindingSnapshot>();
  const bindingByCapabilityAndMode = new Map<string, string>();
  const manifests = new Map<string, ReferralArtifactManifestSnapshot>();
  const payloads = new Map<string, PharmacyDispatchPayloadSnapshot>();
  const plans = new Map<string, PharmacyDispatchPlanSnapshot>();
  const currentPlanByCase = new Map<string, string>();
  const attempts = new Map<string, PharmacyDispatchAttemptSnapshot>();
  const attemptIdsByCase = new Map<string, string[]>();
  const currentAttemptByCase = new Map<string, string>();
  const evidenceObservations = new Map<string, DispatchEvidenceObservationSnapshot>();
  const evidenceIdsByAttempt = new Map<string, string[]>();
  const proofEnvelopes = new Map<string, DispatchProofEnvelopeSnapshot>();
  const currentProofEnvelopeByAttempt = new Map<string, string>();
  const manualRecords = new Map<string, ManualDispatchAssistanceRecordSnapshot>();
  const manualRecordIdsByAttempt = new Map<string, string[]>();
  const continuityEvidence = new Map<string, PharmacyContinuityEvidenceProjectionSnapshot>();
  const currentContinuityByCase = new Map<string, string>();
  const settlements = new Map<string, PharmacyDispatchSettlementSnapshot>();
  const currentSettlementByCase = new Map<string, string>();
  const truthProjections = new Map<string, PharmacyDispatchTruthProjectionSnapshot>();
  const currentTruthByCase = new Map<string, string>();
  const auditEvents = new Map<string, PharmacyDispatchAuditEventSnapshot>();
  const auditIdsByCase = new Map<string, string[]>();

  function appendIndex(map: Map<string, string[]>, key: string, value: string) {
    const current = new Set(map.get(key) ?? []);
    current.add(value);
    map.set(key, [...current].sort());
  }

  for (const profile of transportAssuranceRegistryContract.profiles) {
    const normalized = asTransportProfileSnapshot(profile);
    transportProfiles.set(normalized.transportAssuranceProfileId, normalized);
  }

  return {
    async getTransportAssuranceProfile(transportAssuranceProfileId) {
      const snapshot = transportProfiles.get(transportAssuranceProfileId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listTransportAssuranceProfiles() {
      return [...transportProfiles.values()]
        .sort((left, right) =>
          left.transportAssuranceProfileId.localeCompare(right.transportAssuranceProfileId),
        )
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveTransportAssuranceProfile(snapshot, options) {
      saveWithCas(
        transportProfiles,
        snapshot.transportAssuranceProfileId,
        structuredClone(snapshot),
        options,
      );
    },

    async getDispatchAdapterBinding(dispatchAdapterBindingId) {
      const snapshot = adapterBindings.get(dispatchAdapterBindingId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentDispatchAdapterBinding(providerCapabilitySnapshotId, transportMode) {
      const bindingId = bindingByCapabilityAndMode.get(
        `${providerCapabilitySnapshotId}::${transportMode}`,
      );
      return bindingId === undefined ? null : new StoredDocument(adapterBindings.get(bindingId)!);
    },

    async saveDispatchAdapterBinding(snapshot, options) {
      saveWithCas(
        adapterBindings,
        snapshot.dispatchAdapterBindingId,
        structuredClone(snapshot),
        options,
      );
      bindingByCapabilityAndMode.set(
        `${snapshot.providerCapabilitySnapshotRef.refId}::${snapshot.transportMode}`,
        snapshot.dispatchAdapterBindingId,
      );
    },

    async getReferralArtifactManifest(artifactManifestId) {
      const snapshot = manifests.get(artifactManifestId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveReferralArtifactManifest(snapshot, options) {
      saveWithCas(manifests, snapshot.artifactManifestId, structuredClone(snapshot), options);
    },

    async getDispatchPayload(dispatchPayloadId) {
      const snapshot = payloads.get(dispatchPayloadId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async saveDispatchPayload(snapshot, options) {
      saveWithCas(payloads, snapshot.dispatchPayloadId, structuredClone(snapshot), options);
    },

    async getDispatchPlan(dispatchPlanId) {
      const snapshot = plans.get(dispatchPlanId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentDispatchPlanForCase(pharmacyCaseId) {
      const planId = currentPlanByCase.get(pharmacyCaseId);
      return planId === undefined ? null : new StoredDocument(plans.get(planId)!);
    },

    async saveDispatchPlan(snapshot, options) {
      saveWithCas(plans, snapshot.dispatchPlanId, structuredClone(snapshot), options);
      if (snapshot.planState === "planned") {
        currentPlanByCase.set(snapshot.pharmacyCaseId, snapshot.dispatchPlanId);
      }
    },

    async getDispatchAttempt(dispatchAttemptId) {
      const snapshot = attempts.get(dispatchAttemptId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentDispatchAttemptForCase(pharmacyCaseId) {
      const attemptId = currentAttemptByCase.get(pharmacyCaseId);
      return attemptId === undefined ? null : new StoredDocument(attempts.get(attemptId)!);
    },

    async listDispatchAttemptsForCase(pharmacyCaseId) {
      return (attemptIdsByCase.get(pharmacyCaseId) ?? [])
        .map((attemptId) => attempts.get(attemptId))
        .filter((snapshot): snapshot is PharmacyDispatchAttemptSnapshot => snapshot !== undefined)
        .sort((left, right) => compareIso(left.attemptedAt, right.attemptedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async listDispatchAttempts() {
      return [...attempts.values()]
        .sort((left, right) => compareIso(left.attemptedAt, right.attemptedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveDispatchAttempt(snapshot, options) {
      saveWithCas(attempts, snapshot.dispatchAttemptId, structuredClone(snapshot), options);
      appendIndex(attemptIdsByCase, snapshot.pharmacyCaseId, snapshot.dispatchAttemptId);
      if (snapshot.status !== "superseded") {
        currentAttemptByCase.set(snapshot.pharmacyCaseId, snapshot.dispatchAttemptId);
      }
    },

    async getEvidenceObservation(evidenceObservationId) {
      const snapshot = evidenceObservations.get(evidenceObservationId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listEvidenceObservationsForAttempt(dispatchAttemptId) {
      return (evidenceIdsByAttempt.get(dispatchAttemptId) ?? [])
        .map((evidenceId) => evidenceObservations.get(evidenceId))
        .filter((snapshot): snapshot is DispatchEvidenceObservationSnapshot => snapshot !== undefined)
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveEvidenceObservation(snapshot, options) {
      saveWithCas(
        evidenceObservations,
        snapshot.evidenceObservationId,
        structuredClone(snapshot),
        options,
      );
      appendIndex(evidenceIdsByAttempt, snapshot.dispatchAttemptId, snapshot.evidenceObservationId);
    },

    async getProofEnvelope(dispatchProofEnvelopeId) {
      const snapshot = proofEnvelopes.get(dispatchProofEnvelopeId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentProofEnvelopeForAttempt(dispatchAttemptId) {
      const envelopeId = currentProofEnvelopeByAttempt.get(dispatchAttemptId);
      return envelopeId === undefined ? null : new StoredDocument(proofEnvelopes.get(envelopeId)!);
    },

    async saveProofEnvelope(snapshot, options) {
      saveWithCas(
        proofEnvelopes,
        snapshot.dispatchProofEnvelopeId,
        structuredClone(snapshot),
        options,
      );
      currentProofEnvelopeByAttempt.set(snapshot.dispatchAttemptId, snapshot.dispatchProofEnvelopeId);
    },

    async listManualDispatchAssistanceRecords(dispatchAttemptId) {
      return (manualRecordIdsByAttempt.get(dispatchAttemptId) ?? [])
        .map((recordId) => manualRecords.get(recordId))
        .filter((snapshot): snapshot is ManualDispatchAssistanceRecordSnapshot => snapshot !== undefined)
        .sort((left, right) => {
          const leftCompleted = left.completedAt ?? left.manualDispatchAssistanceRecordId;
          const rightCompleted = right.completedAt ?? right.manualDispatchAssistanceRecordId;
          return leftCompleted.localeCompare(rightCompleted);
        })
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveManualDispatchAssistanceRecord(snapshot, options) {
      saveWithCas(
        manualRecords,
        snapshot.manualDispatchAssistanceRecordId,
        structuredClone(snapshot),
        options,
      );
      appendIndex(
        manualRecordIdsByAttempt,
        snapshot.dispatchAttemptId,
        snapshot.manualDispatchAssistanceRecordId,
      );
    },

    async getContinuityEvidenceProjection(pharmacyContinuityEvidenceProjectionId) {
      const snapshot = continuityEvidence.get(pharmacyContinuityEvidenceProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentContinuityEvidenceProjectionForCase(pharmacyCaseId) {
      const projectionId = currentContinuityByCase.get(pharmacyCaseId);
      return projectionId === undefined
        ? null
        : new StoredDocument(continuityEvidence.get(projectionId)!);
    },

    async saveContinuityEvidenceProjection(snapshot, options) {
      saveWithCas(
        continuityEvidence,
        snapshot.pharmacyContinuityEvidenceProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentContinuityByCase.set(
        snapshot.pharmacyCaseId,
        snapshot.pharmacyContinuityEvidenceProjectionId,
      );
    },

    async getDispatchSettlement(settlementId) {
      const snapshot = settlements.get(settlementId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentDispatchSettlementForCase(pharmacyCaseId) {
      const settlementId = currentSettlementByCase.get(pharmacyCaseId);
      return settlementId === undefined ? null : new StoredDocument(settlements.get(settlementId)!);
    },

    async saveDispatchSettlement(snapshot, options) {
      saveWithCas(settlements, snapshot.settlementId, structuredClone(snapshot), options);
      currentSettlementByCase.set(snapshot.pharmacyCaseId, snapshot.settlementId);
    },

    async getDispatchTruthProjection(pharmacyDispatchTruthProjectionId) {
      const snapshot = truthProjections.get(pharmacyDispatchTruthProjectionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCurrentDispatchTruthProjectionForCase(pharmacyCaseId) {
      const truthId = currentTruthByCase.get(pharmacyCaseId);
      return truthId === undefined ? null : new StoredDocument(truthProjections.get(truthId)!);
    },

    async saveDispatchTruthProjection(snapshot, options) {
      saveWithCas(
        truthProjections,
        snapshot.pharmacyDispatchTruthProjectionId,
        structuredClone(snapshot),
        options,
      );
      currentTruthByCase.set(snapshot.pharmacyCaseId, snapshot.pharmacyDispatchTruthProjectionId);
    },

    async listDispatchAuditEventsForCase(pharmacyCaseId) {
      return (auditIdsByCase.get(pharmacyCaseId) ?? [])
        .map((eventId) => auditEvents.get(eventId))
        .filter((snapshot): snapshot is PharmacyDispatchAuditEventSnapshot => snapshot !== undefined)
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveDispatchAuditEvent(snapshot, options) {
      saveWithCas(auditEvents, snapshot.pharmacyDispatchAuditEventId, structuredClone(snapshot), options);
      appendIndex(auditIdsByCase, snapshot.pharmacyCaseId, snapshot.pharmacyDispatchAuditEventId);
    },
  };
}

export interface PharmacyDispatchRouteBindingInput {
  routeIntentBindingRef: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
}

export interface PlanPharmacyDispatchInput extends PharmacyDispatchRouteBindingInput {
  pharmacyCaseId: string;
  packageId?: string | null;
  transportMode?: PharmacyTransportMode | null;
  recordedAt: string;
}

export interface SubmitPharmacyDispatchInput extends PlanPharmacyDispatchInput {
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  expectedOwnershipEpoch: number;
  expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
  scopedMutationGateRef: string;
  reasonCode: string;
  sourceCommandId?: string | null;
  transportCorrelationId?: string | null;
  retryIntentGeneration?: number | null;
}

export interface ResendPharmacyDispatchInput extends SubmitPharmacyDispatchInput {
  dispatchAttemptId?: string | null;
}

export interface IngestDispatchEvidenceInput {
  dispatchAttemptId: string;
  lane: DispatchEvidenceLane;
  sourceClass: string;
  recordedAt: string;
  transportMessageId?: string | null;
  orderingKey?: string | null;
  rawEvidence: unknown;
  semanticEvidence: unknown;
  proofRef?: string | null;
  sourceCorrelationRef?: string | null;
  polarity?: "positive" | "negative";
  logLikelihoodWeight?: number | null;
  satisfiesHardMatchRefs?: readonly string[] | null;
  failsHardMatchRefs?: readonly string[] | null;
  contradictory?: boolean;
}

export interface MarkDispatchContradictionInput {
  dispatchAttemptId: string;
  sourceClass: string;
  recordedAt: string;
  contradictionRef: string;
  rawEvidence?: unknown;
  semanticEvidence?: unknown;
}

export interface RecordManualDispatchAssistanceInput {
  dispatchAttemptId: string;
  operatorRef: string;
  operatorActionRef: string;
  secondReviewerRef?: string | null;
  evidenceRefs: readonly string[];
  attestationState: ManualDispatchAttestationState;
  completedAt?: string | null;
}

export interface ExpireStaleDispatchAttemptsInput {
  now: string;
}

export interface PharmacyDispatchPlanBundle {
  profile: TransportAssuranceProfileSnapshot;
  binding: DispatchAdapterBindingSnapshot;
  manifest: ReferralArtifactManifestSnapshot;
  payload: PharmacyDispatchPayloadSnapshot;
  plan: PharmacyDispatchPlanSnapshot;
}

export interface PharmacyDispatchBundle extends PharmacyDispatchPlanBundle {
  attempt: PharmacyDispatchAttemptSnapshot;
  proofEnvelope: DispatchProofEnvelopeSnapshot;
  settlement: PharmacyDispatchSettlementSnapshot;
  truthProjection: PharmacyDispatchTruthProjectionSnapshot;
  continuityEvidenceProjection: PharmacyContinuityEvidenceProjectionSnapshot;
  evidenceObservations: readonly DispatchEvidenceObservationSnapshot[];
  manualAssistanceRecords: readonly ManualDispatchAssistanceRecordSnapshot[];
  externalConfirmationGate: ExternalConfirmationGateSnapshot | null;
  correlationRecord: PharmacyCorrelationRecordSnapshot;
}

export interface PharmacyDispatchCommandResult {
  dispatchBundle: PharmacyDispatchBundle;
  caseMutation: PharmacyCaseMutationResult | null;
  replayed: boolean;
  reusedExistingAttempt: boolean;
}

interface ResolvedDispatchContext {
  pharmacyCaseBundle: PharmacyCaseBundle;
  pharmacyCase: PharmacyCaseSnapshot;
  frozenPackage: PharmacyReferralPackageSnapshot;
  currentCorrelation: PharmacyCorrelationRecordSnapshot;
  provider: PharmacyProvider;
  providerCapabilitySnapshot: PharmacyProviderCapabilitySnapshot;
  directorySnapshot: PharmacyDirectorySnapshot;
  choiceSession: PharmacyChoiceSession;
  choiceProof: PharmacyChoiceProof;
  choiceExplanation: PharmacyChoiceExplanation;
  consentRecord: PharmacyConsentRecord;
  consentCheckpoint: PharmacyConsentCheckpoint;
}

export interface Phase6PharmacyDispatchService {
  readonly repositories: Phase6PharmacyDispatchStore;
  readonly caseKernelService: Phase6PharmacyCaseKernelService;
  readonly directoryRepositories: Phase6PharmacyDirectoryChoiceStore;
  readonly packageRepositories: Phase6PharmacyReferralPackageStore;
  readonly replayRepositories: ReplayCollisionDependencies;
  readonly confirmationRepositories: ReservationConfirmationDependencies;
  readonly adapters: Map<PharmacyTransportMode, PharmacyDispatchAdapter>;
  planDispatch(input: PlanPharmacyDispatchInput): Promise<PharmacyDispatchPlanBundle>;
  submitDispatch(input: SubmitPharmacyDispatchInput): Promise<PharmacyDispatchCommandResult>;
  resendDispatch(input: ResendPharmacyDispatchInput): Promise<PharmacyDispatchCommandResult>;
  ingestReceiptEvidence(input: IngestDispatchEvidenceInput): Promise<PharmacyDispatchBundle>;
  markDispatchContradiction(input: MarkDispatchContradictionInput): Promise<PharmacyDispatchBundle>;
  recordManualDispatchAssistance(
    input: RecordManualDispatchAssistanceInput,
  ): Promise<PharmacyDispatchBundle>;
  expireStaleAttempts(
    input: ExpireStaleDispatchAttemptsInput,
  ): Promise<readonly PharmacyDispatchBundle[]>;
  getCurrentDispatchTruth(pharmacyCaseId: string): Promise<PharmacyDispatchBundle | null>;
}

export function createPhase6PharmacyDispatchService(input?: {
  repositories?: Phase6PharmacyDispatchStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceStore;
  packageRepositories?: Phase6PharmacyReferralPackageStore;
  replayRepositories?: ReplayCollisionDependencies;
  confirmationRepositories?: ReservationConfirmationDependencies;
  adapters?: readonly PharmacyDispatchAdapter[];
  idGenerator?: BackboneIdGenerator;
}): Phase6PharmacyDispatchService {
  const repositories = input?.repositories ?? createPhase6PharmacyDispatchStore();
  const caseKernelService =
    input?.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const directoryRepositories =
    input?.directoryRepositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const packageRepositories =
    input?.packageRepositories ?? createPhase6PharmacyReferralPackageStore();
  const replayRepositories =
    input?.replayRepositories ?? createReplayCollisionStore();
  const confirmationRepositories =
    input?.confirmationRepositories ?? createReservationConfirmationStore();
  const idGenerator =
    input?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase6-pharmacy-dispatch");
  const replayAuthority = createReplayCollisionAuthorityService(replayRepositories);
  const confirmationAuthority =
    createReservationConfirmationAuthorityService(confirmationRepositories);
  const adapters = new Map<PharmacyTransportMode, PharmacyDispatchAdapter>();
  for (const transportMode of TRANSPORT_PRIORITY) {
    adapters.set(transportMode, createDeterministicPharmacyDispatchAdapter({ transportMode }));
  }
  for (const adapter of input?.adapters ?? []) {
    adapters.set(adapter.transportMode, adapter);
  }

  function nextId(kind: string): string {
    return (idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  async function loadCase(pharmacyCaseId: string): Promise<PharmacyCaseBundle> {
    const bundle = await caseKernelService.getPharmacyCase(pharmacyCaseId);
    invariant(bundle !== null, "PHARMACY_CASE_NOT_FOUND", `PharmacyCase ${pharmacyCaseId} was not found.`);
    return bundle;
  }

  async function resolveDispatchContext(input: {
    pharmacyCaseId: string;
    packageId?: string | null;
  }): Promise<ResolvedDispatchContext> {
    const pharmacyCaseBundle = await loadCase(input.pharmacyCaseId);
    const pharmacyCase = pharmacyCaseBundle.pharmacyCase;
    const frozenPackageDocument =
      optionalText(input.packageId) !== null
        ? await packageRepositories.getPackage(requireText(input.packageId, "packageId"))
        : await packageRepositories.getCurrentFrozenPackageForCase(input.pharmacyCaseId);
    invariant(
      frozenPackageDocument !== null,
      "FROZEN_PACKAGE_NOT_FOUND",
      "Current frozen PharmacyReferralPackage was not found.",
    );
    const frozenPackage = frozenPackageDocument.toSnapshot();
    invariant(
      frozenPackage.packageState === "frozen",
      "PACKAGE_NOT_FROZEN",
      "Dispatch requires a frozen PharmacyReferralPackage.",
    );
    const currentCorrelationDocument = await packageRepositories.getCurrentCorrelationRecordForCase(
      input.pharmacyCaseId,
    );
    invariant(
      currentCorrelationDocument !== null,
      "CORRELATION_RECORD_NOT_FOUND",
      "PharmacyCorrelationRecord was not found for the case.",
    );
    const currentCorrelation = currentCorrelationDocument.toSnapshot();
    invariant(
      currentCorrelation.packageId === frozenPackage.packageId,
      "CORRELATION_PACKAGE_DRIFT",
      "Correlation record does not point at the current frozen package.",
    );

    const providerDocument = await directoryRepositories.getProvider(frozenPackage.providerRef.refId);
    invariant(providerDocument !== null, "PROVIDER_NOT_FOUND", "Selected PharmacyProvider was not found.");
    const provider = providerDocument.toSnapshot();
    const capabilityDocument = await directoryRepositories.getProviderCapabilitySnapshot(
      frozenPackage.providerCapabilitySnapshotRef.refId,
    );
    invariant(
      capabilityDocument !== null,
      "PROVIDER_CAPABILITY_NOT_FOUND",
      "Selected PharmacyProviderCapabilitySnapshot was not found.",
    );
    const providerCapabilitySnapshot = capabilityDocument.toSnapshot();
    const directorySnapshotDocument = await directoryRepositories.getDirectorySnapshot(
      frozenPackage.directorySnapshotRef.refId,
    );
    invariant(
      directorySnapshotDocument !== null,
      "DIRECTORY_SNAPSHOT_NOT_FOUND",
      "PharmacyDirectorySnapshot was not found.",
    );
    const directorySnapshot = directorySnapshotDocument.toSnapshot();
    invariant(
      pharmacyCase.choiceSessionRef !== null,
      "CHOICE_SESSION_NOT_BOUND",
      "PharmacyCase does not currently reference a PharmacyChoiceSession.",
    );
    const choiceSessionDocument = await directoryRepositories.getChoiceSession(
      pharmacyCase.choiceSessionRef.refId,
    );
    invariant(
      choiceSessionDocument !== null,
      "CHOICE_SESSION_NOT_FOUND",
      "Current PharmacyChoiceSession was not found.",
    );
    const choiceSession = choiceSessionDocument.toSnapshot();
    const choiceProofDocument = await directoryRepositories.getChoiceProof(
      choiceSession.choiceProofRef.refId,
    );
    invariant(choiceProofDocument !== null, "CHOICE_PROOF_NOT_FOUND", "PharmacyChoiceProof was not found.");
    const choiceProof = choiceProofDocument.toSnapshot();
    invariant(
      choiceSession.selectedProviderRef?.refId === frozenPackage.providerRef.refId,
      "SELECTED_PROVIDER_DRIFT",
      "Selected provider no longer matches the frozen package.",
    );
    invariant(
      choiceSession.selectedProviderCapabilitySnapshotRef?.refId ===
        frozenPackage.providerCapabilitySnapshotRef.refId,
      "SELECTED_CAPABILITY_DRIFT",
      "Provider capability snapshot no longer matches the frozen package.",
    );
    invariant(
      choiceSession.selectionBindingHash === frozenPackage.selectionBindingHash,
      "SELECTION_BINDING_HASH_DRIFT",
      "Selection binding hash no longer matches the frozen package.",
    );

    const explanationRef =
      choiceSession.selectedProviderExplanationRef?.refId ??
      provider.choiceExplanationRef?.refId ??
      (() => {
        invariant(false, "CHOICE_EXPLANATION_NOT_FOUND", "Selected PharmacyChoiceExplanation was not found.");
      })();
    const explanationDocument = await directoryRepositories.getChoiceExplanation(explanationRef);
    invariant(
      explanationDocument !== null,
      "CHOICE_EXPLANATION_NOT_FOUND",
      "Selected PharmacyChoiceExplanation was not found.",
    );
    const choiceExplanation = explanationDocument.toSnapshot();
    const consentRecordDocument = await directoryRepositories.getConsentRecord(
      frozenPackage.consentRef.refId,
    );
    invariant(
      consentRecordDocument !== null,
      "CONSENT_RECORD_NOT_FOUND",
      "PharmacyConsentRecord was not found.",
    );
    const consentRecord = consentRecordDocument.toSnapshot();
    const consentCheckpointDocument = await directoryRepositories.getConsentCheckpoint(
      frozenPackage.consentCheckpointRef.refId,
    );
    invariant(
      consentCheckpointDocument !== null,
      "CONSENT_CHECKPOINT_NOT_FOUND",
      "PharmacyConsentCheckpoint was not found.",
    );
    const consentCheckpoint = consentCheckpointDocument.toSnapshot();

    invariant(
      consentCheckpoint.selectionBindingHash === frozenPackage.selectionBindingHash,
      "CONSENT_SELECTION_BINDING_DRIFT",
      "Consent checkpoint selection binding no longer matches the frozen package.",
    );
    invariant(
      consentCheckpoint.packageFingerprint === frozenPackage.packageFingerprint,
      "PACKAGE_FINGERPRINT_DRIFT",
      "Consent checkpoint package fingerprint no longer matches the frozen package.",
    );
    invariant(
      consentRecord.selectionBindingHash === frozenPackage.selectionBindingHash,
      "CONSENT_RECORD_SELECTION_DRIFT",
      "Consent record selection binding no longer matches the frozen package.",
    );
    invariant(
      consentRecord.packageFingerprint === frozenPackage.packageFingerprint,
      "CONSENT_RECORD_PACKAGE_DRIFT",
      "Consent record package fingerprint no longer matches the frozen package.",
    );

    return {
      pharmacyCaseBundle,
      pharmacyCase,
      frozenPackage,
      currentCorrelation,
      provider,
      providerCapabilitySnapshot,
      directorySnapshot,
      choiceSession,
      choiceProof,
      choiceExplanation,
      consentRecord,
      consentCheckpoint,
    };
  }

  function selectTransportMode(
    capabilitySnapshot: PharmacyProviderCapabilitySnapshot,
    requestedTransportMode?: PharmacyTransportMode | null,
  ): PharmacyTransportMode {
    if (requestedTransportMode) {
      invariant(
        capabilitySnapshot.supportedTransportModes.includes(requestedTransportMode) ||
          (requestedTransportMode === "manual_assisted_dispatch" &&
            capabilitySnapshot.manualFallbackState !== "unavailable"),
        "UNSUPPORTED_TRANSPORT_MODE",
        `Requested transport mode ${requestedTransportMode} is not supported.`,
      );
      return requestedTransportMode;
    }
    for (const candidate of TRANSPORT_PRIORITY) {
      if (capabilitySnapshot.supportedTransportModes.includes(candidate)) {
        return candidate;
      }
      if (
        candidate === "manual_assisted_dispatch" &&
        capabilitySnapshot.manualFallbackState !== "unavailable"
      ) {
        return candidate;
      }
    }
    invariant(false, "NO_SUPPORTED_TRANSPORT_MODE", "Provider capability snapshot exposes no supported transport mode.");
  }

  async function requireProfile(
    transportMode: PharmacyTransportMode,
  ): Promise<TransportAssuranceProfileSnapshot> {
    const profile = (await repositories.listTransportAssuranceProfiles())
      .map((entry) => entry.toSnapshot())
      .find((entry) => entry.transportMode === transportMode);
    invariant(profile !== undefined, "TRANSPORT_PROFILE_NOT_FOUND", `TransportAssuranceProfile for ${transportMode} was not found.`);
    return profile;
  }

  async function resolveBinding(input: {
    transportMode: PharmacyTransportMode;
    providerCapabilitySnapshot: PharmacyProviderCapabilitySnapshot;
    recordedAt: string;
  }): Promise<DispatchAdapterBindingSnapshot> {
    const existing = await repositories.getCurrentDispatchAdapterBinding(
      input.providerCapabilitySnapshot.providerCapabilitySnapshotId,
      input.transportMode,
    );
    if (existing) {
      return existing.toSnapshot();
    }
    const profile = await requireProfile(input.transportMode);
    const allowedArtifactClasses = [
      ...ALLOWED_ARTIFACT_CLASSES_BY_MODE[input.transportMode],
    ] as const;
    const snapshot: DispatchAdapterBindingSnapshot = {
      dispatchAdapterBindingId: nextId("pharmacyDispatchAdapterBinding"),
      transportMode: input.transportMode,
      adapterVersionRef: buildAdapterVersionRef(input.transportMode),
      transformContractRef: buildTransformContractRef(input.transportMode),
      providerCapabilitySnapshotRef: makeRef(
        "PharmacyProviderCapabilitySnapshot",
        input.providerCapabilitySnapshot.providerCapabilitySnapshotId,
        TASK_343,
      ),
      allowedArtifactClasses,
      requiresManualOperator:
        profile.manualReviewRequired || input.transportMode === "manual_assisted_dispatch",
      manualReviewPolicyRef: buildManualReviewPolicyRef(profile),
      bindingHash: buildBindingHash({
        transportMode: input.transportMode,
        adapterVersionRef: buildAdapterVersionRef(input.transportMode),
        transformContractRef: buildTransformContractRef(input.transportMode),
        providerCapabilitySnapshotRef:
          input.providerCapabilitySnapshot.providerCapabilitySnapshotId,
        allowedArtifactClasses,
        requiresManualOperator:
          profile.manualReviewRequired || input.transportMode === "manual_assisted_dispatch",
        manualReviewPolicyRef: buildManualReviewPolicyRef(profile),
      }),
      boundAt: input.recordedAt,
      version: 1,
    };
    await repositories.saveDispatchAdapterBinding(snapshot);
    return snapshot;
  }

  async function loadPackageArtifacts(
    packageId: string,
  ): Promise<readonly PharmacyPackageArtifactSnapshot[]> {
    return (await packageRepositories.listPackageArtifacts(packageId)).map((entry) =>
      entry.toSnapshot(),
    );
  }

  async function loadPackageGovernanceDecisions(
    packageId: string,
  ): Promise<readonly PharmacyPackageContentGovernanceDecisionSnapshot[]> {
    return (await packageRepositories.listGovernanceDecisions(packageId)).map((entry) =>
      entry.toSnapshot(),
    );
  }

  async function compileArtifactManifest(input: {
    frozenPackage: PharmacyReferralPackageSnapshot;
    binding: DispatchAdapterBindingSnapshot;
    dispatchPlanId: string;
    recordedAt: string;
  }): Promise<ReferralArtifactManifestSnapshot> {
    const packageArtifacts = await loadPackageArtifacts(input.frozenPackage.packageId);
    const governanceDecisions = await loadPackageGovernanceDecisions(input.frozenPackage.packageId);
    const allowed = new Set(input.binding.allowedArtifactClasses);
    const includedArtifactRefs = packageArtifacts
      .filter((artifact) => allowed.has(artifact.artifactClass))
      .map((artifact) => artifact.packageArtifactId);
    const redactedArtifactRefs = packageArtifacts
      .filter((artifact) => allowed.has(artifact.artifactClass) && artifact.contentState === "redacted")
      .map((artifact) => artifact.packageArtifactId);
    const omittedArtifactRefs = governanceDecisions
      .filter(
        (decision) =>
          decision.resultingArtifactRef === null ||
          decision.decisionState === "excluded_by_policy" ||
          decision.decisionState === "unavailable",
      )
      .map((decision) => decision.candidateRef);
    const manifest: ReferralArtifactManifestSnapshot = {
      artifactManifestId: nextId("referralArtifactManifest"),
      dispatchPlanRef: makeRef("PharmacyDispatchPlan", input.dispatchPlanId, TASK_343),
      packageId: input.frozenPackage.packageId,
      includedArtifactRefs: uniqueSorted(includedArtifactRefs),
      redactedArtifactRefs: uniqueSorted(redactedArtifactRefs),
      omittedArtifactRefs: uniqueSorted(omittedArtifactRefs),
      transformNotesRef: `transform_notes::${input.binding.dispatchAdapterBindingId}`,
      classificationRef: `classification::${input.binding.transportMode}::v1`,
      manifestHash: buildArtifactManifestHash({
        packageId: input.frozenPackage.packageId,
        includedArtifactRefs,
        redactedArtifactRefs,
        omittedArtifactRefs,
        transformNotesRef: `transform_notes::${input.binding.dispatchAdapterBindingId}`,
        classificationRef: `classification::${input.binding.transportMode}::v1`,
      }),
      compiledAt: input.recordedAt,
      version: 1,
    };
    await repositories.saveReferralArtifactManifest(manifest);
    return manifest;
  }

  async function compileDispatchPayload(input: {
    dispatchPlanId: string;
    frozenPackage: PharmacyReferralPackageSnapshot;
    provider: PharmacyProvider;
    profile: TransportAssuranceProfileSnapshot;
    binding: DispatchAdapterBindingSnapshot;
    manifest: ReferralArtifactManifestSnapshot;
    recordedAt: string;
  }): Promise<PharmacyDispatchPayloadSnapshot> {
    const payload: Record<string, unknown> = {
      packageId: input.frozenPackage.packageId,
      packageHash: input.frozenPackage.packageHash,
      packageFingerprint: input.frozenPackage.packageFingerprint,
      providerId: input.provider.providerId,
      providerOdsCode: input.provider.odsCode,
      providerDisplayName: input.provider.displayName,
      transportMode: input.profile.transportMode,
      transportAssuranceProfileId: input.profile.transportAssuranceProfileId,
      dispatchAdapterBindingId: input.binding.dispatchAdapterBindingId,
      representationSetRef: input.frozenPackage.fhirRepresentationSetRef,
      manifestHash: input.manifest.manifestHash,
      includedArtifactRefs: input.manifest.includedArtifactRefs,
      redactedArtifactRefs: input.manifest.redactedArtifactRefs,
      omittedArtifactRefs: input.manifest.omittedArtifactRefs,
      routeIntentBindingRef: input.frozenPackage.routeIntentBindingRef,
      routeIntentTupleHash: input.frozenPackage.routeIntentTupleHash,
      compiledAt: input.recordedAt,
    };
    const dispatchPayloadId = nextId("pharmacyDispatchPayload");
    const snapshot: PharmacyDispatchPayloadSnapshot = {
      dispatchPayloadId,
      packageId: input.frozenPackage.packageId,
      dispatchPlanRef: makeRef("PharmacyDispatchPlan", input.dispatchPlanId, TASK_343),
      transportMode: input.profile.transportMode,
      representationSetRef: input.frozenPackage.fhirRepresentationSetRef,
      manifestHash: input.manifest.manifestHash,
      payloadHash: buildDispatchPayloadHash(payload),
      payload,
      compiledAt: input.recordedAt,
      version: 1,
    };
    await repositories.saveDispatchPayload(snapshot);
    return snapshot;
  }

  async function compileDispatchPlan(
    input: PlanPharmacyDispatchInput,
  ): Promise<PharmacyDispatchPlanBundle> {
    const context = await resolveDispatchContext({
      pharmacyCaseId: input.pharmacyCaseId,
      packageId: input.packageId,
    });
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const transportMode = selectTransportMode(
      context.providerCapabilitySnapshot,
      input.transportMode ?? null,
    );
    const profile = await requireProfile(transportMode);
    const binding = await resolveBinding({
      transportMode,
      providerCapabilitySnapshot: context.providerCapabilitySnapshot,
      recordedAt,
    });
    const dispatchPlanId = nextId("pharmacyDispatchPlan");
    const manifest = await compileArtifactManifest({
      frozenPackage: context.frozenPackage,
      binding,
      dispatchPlanId,
      recordedAt,
    });
    const payload = await compileDispatchPayload({
      dispatchPlanId,
      frozenPackage: context.frozenPackage,
      provider: context.provider,
      profile,
      binding,
      manifest,
      recordedAt,
    });
    const plan: PharmacyDispatchPlanSnapshot = {
      dispatchPlanId,
      pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
      packageId: context.frozenPackage.packageId,
      providerRef: makeRef("PharmacyProvider", context.provider.providerId, TASK_343),
      providerCapabilitySnapshotRef: makeRef(
        "PharmacyProviderCapabilitySnapshot",
        context.providerCapabilitySnapshot.providerCapabilitySnapshotId,
        TASK_343,
      ),
      transportMode,
      transportAssuranceProfileRef: makeRef(
        "TransportAssuranceProfile",
        profile.transportAssuranceProfileId,
        TASK_343,
      ),
      dispatchAdapterBindingRef: makeRef(
        "DispatchAdapterBinding",
        binding.dispatchAdapterBindingId,
        TASK_343,
      ),
      transformContractRef: binding.transformContractRef,
      allowedArtifactClasses: [...binding.allowedArtifactClasses],
      artifactManifestRef: makeRef("ReferralArtifactManifest", manifest.artifactManifestId, TASK_343),
      dispatchPayloadRef: payload.dispatchPayloadId,
      dispatchPayloadHash: payload.payloadHash,
      dispatchPlanHash: buildDispatchPlanHash({
        pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
        packageHash: context.frozenPackage.packageHash,
        dispatchPayloadHash: payload.payloadHash,
        manifestHash: manifest.manifestHash,
        providerRef: context.provider.providerId,
        providerCapabilitySnapshotRef:
          context.providerCapabilitySnapshot.providerCapabilitySnapshotId,
        transportAssuranceProfileRef: profile.transportAssuranceProfileId,
        dispatchAdapterBindingRef: binding.dispatchAdapterBindingId,
        routeIntentBindingRef: requireText(
          input.routeIntentBindingRef,
          "routeIntentBindingRef",
        ),
        routeIntentTupleHash: context.frozenPackage.routeIntentTupleHash,
        canonicalObjectDescriptorRef: requireText(
          input.canonicalObjectDescriptorRef,
          "canonicalObjectDescriptorRef",
        ),
        governingObjectVersionRef: requireText(
          input.governingObjectVersionRef,
          "governingObjectVersionRef",
        ),
      }),
      manualReviewPolicyRef: binding.manualReviewPolicyRef,
      planState: "planned",
      routeIntentBindingRef: requireText(input.routeIntentBindingRef, "routeIntentBindingRef"),
      routeIntentTupleHash: context.frozenPackage.routeIntentTupleHash,
      canonicalObjectDescriptorRef: requireText(
        input.canonicalObjectDescriptorRef,
        "canonicalObjectDescriptorRef",
      ),
      governingObjectVersionRef: requireText(
        input.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      plannedAt: recordedAt,
      version: 1,
    };
    await repositories.saveDispatchPlan(plan);
    return {
      profile,
      binding,
      manifest,
      payload,
      plan,
    };
  }

  async function loadBundleForAttempt(
    attemptId: string,
  ): Promise<PharmacyDispatchBundle | null> {
    const attemptDocument = await repositories.getDispatchAttempt(attemptId);
    if (!attemptDocument) {
      return null;
    }
    const attempt = attemptDocument.toSnapshot();
    const planDocument = await repositories.getDispatchPlan(attempt.dispatchPlanRef.refId);
    invariant(planDocument !== null, "DISPATCH_PLAN_NOT_FOUND", "PharmacyDispatchPlan was not found.");
    const plan = planDocument.toSnapshot();
    const proofEnvelope = attempt.proofEnvelopeRef
      ? (await repositories.getProofEnvelope(attempt.proofEnvelopeRef.refId))?.toSnapshot()
      : null;
    const settlement = (
      await repositories.getCurrentDispatchSettlementForCase(attempt.pharmacyCaseId)
    )?.toSnapshot();
    const truthProjection = (
      await repositories.getCurrentDispatchTruthProjectionForCase(attempt.pharmacyCaseId)
    )?.toSnapshot();
    const continuityEvidenceProjection = (
      await repositories.getCurrentContinuityEvidenceProjectionForCase(attempt.pharmacyCaseId)
    )?.toSnapshot();
    invariant(plan !== null, "DISPATCH_PLAN_NOT_FOUND", "PharmacyDispatchPlan was not found.");
    invariant(
      proofEnvelope !== null && proofEnvelope !== undefined,
      "DISPATCH_PROOF_ENVELOPE_NOT_FOUND",
      "DispatchProofEnvelope was not found.",
    );
    invariant(
      settlement !== null && settlement !== undefined,
      "DISPATCH_SETTLEMENT_NOT_FOUND",
      "PharmacyDispatchSettlement was not found.",
    );
    invariant(
      truthProjection !== null && truthProjection !== undefined,
      "DISPATCH_TRUTH_NOT_FOUND",
      "PharmacyDispatchTruthProjection was not found.",
    );
    invariant(
      continuityEvidenceProjection !== null && continuityEvidenceProjection !== undefined,
      "CONTINUITY_EVIDENCE_NOT_FOUND",
      "PharmacyContinuityEvidenceProjection was not found.",
    );
    const profileDocument = await repositories.getTransportAssuranceProfile(
      attempt.transportAssuranceProfileRef.refId,
    );
    const bindingDocument = await repositories.getDispatchAdapterBinding(
      attempt.dispatchAdapterBindingRef.refId,
    );
    const manifestDocument = await repositories.getReferralArtifactManifest(
      plan.artifactManifestRef.refId,
    );
    const payloadDocument = await repositories.getDispatchPayload(plan.dispatchPayloadRef);
    const profile = profileDocument?.toSnapshot();
    const binding = bindingDocument?.toSnapshot();
    const manifest = manifestDocument?.toSnapshot();
    const payload = payloadDocument?.toSnapshot();
    const evidenceObservations = (
      await repositories.listEvidenceObservationsForAttempt(attempt.dispatchAttemptId)
    ).map((entry) => entry.toSnapshot());
    const manualAssistanceRecords = (
      await repositories.listManualDispatchAssistanceRecords(attempt.dispatchAttemptId)
    ).map((entry) => entry.toSnapshot());
    const correlationRecord = (
      await packageRepositories.getCurrentCorrelationRecordForCase(attempt.pharmacyCaseId)
    )?.toSnapshot();
    invariant(profile !== undefined, "TRANSPORT_PROFILE_NOT_FOUND", "TransportAssuranceProfile was not found.");
    invariant(binding !== undefined, "DISPATCH_BINDING_NOT_FOUND", "DispatchAdapterBinding was not found.");
    invariant(manifest !== undefined, "ARTIFACT_MANIFEST_NOT_FOUND", "ReferralArtifactManifest was not found.");
    invariant(payload !== undefined, "DISPATCH_PAYLOAD_NOT_FOUND", "Dispatch payload was not found.");
    invariant(correlationRecord !== undefined, "CORRELATION_RECORD_NOT_FOUND", "Correlation record was not found.");
    const externalConfirmationGate =
      attempt.externalConfirmationGateRef === null
        ? null
        : (await confirmationRepositories.getExternalConfirmationGate(
            attempt.externalConfirmationGateRef.refId,
          ))?.toSnapshot() ?? null;
    return {
      profile,
      binding,
      manifest,
      payload,
      plan,
      attempt,
      proofEnvelope,
      settlement,
      truthProjection,
      continuityEvidenceProjection,
      evidenceObservations,
      manualAssistanceRecords,
      externalConfirmationGate,
      correlationRecord,
    };
  }

  async function saveDispatchAuditEvent(input: {
    pharmacyCaseId: string;
    dispatchAttemptId?: string | null;
    eventName: string;
    actorRef?: string | null;
    payload: Record<string, unknown>;
    recordedAt: string;
  }) {
    const snapshot: PharmacyDispatchAuditEventSnapshot = {
      pharmacyDispatchAuditEventId: nextId("pharmacyDispatchAuditEvent"),
      pharmacyCaseId: input.pharmacyCaseId,
      dispatchAttemptId: optionalText(input.dispatchAttemptId),
      eventName: requireText(input.eventName, "eventName"),
      actorRef: optionalText(input.actorRef),
      payloadDigest: stableReviewDigest(input.payload),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: 1,
    };
    await repositories.saveDispatchAuditEvent(snapshot);
  }

  async function recordEvidenceObservation(input: {
    dispatchAttemptId: string;
    lane: DispatchEvidenceLane;
    sourceClass: string;
    recordedAt: string;
    receiptCheckpointRef?: string | null;
    proofRef?: string | null;
    sourceCorrelationRef?: string | null;
    rawEvidence: unknown;
    polarity?: "positive" | "negative";
    logLikelihoodWeight?: number | null;
    satisfiesHardMatchRefs?: readonly string[] | null;
    failsHardMatchRefs?: readonly string[] | null;
    contradictory?: boolean;
  }): Promise<DispatchEvidenceObservationSnapshot> {
    const defaults = deriveEvidenceDefaults(input.lane, input.sourceClass);
    const snapshot: DispatchEvidenceObservationSnapshot = {
      evidenceObservationId: nextId("dispatchEvidenceObservation"),
      dispatchAttemptId: requireText(input.dispatchAttemptId, "dispatchAttemptId"),
      lane: input.lane,
      sourceClass: requireText(input.sourceClass, "sourceClass"),
      sourceFamily: normalizeSourceFamily(input.sourceClass, input.lane),
      polarity: input.polarity ?? defaults.polarity,
      logLikelihoodWeight:
        input.logLikelihoodWeight === null || input.logLikelihoodWeight === undefined
          ? defaults.logLikelihoodWeight
          : input.logLikelihoodWeight,
      satisfiesHardMatchRefs: uniqueSorted(
        input.satisfiesHardMatchRefs ?? defaults.satisfiesHardMatchRefs,
      ),
      failsHardMatchRefs: uniqueSorted(input.failsHardMatchRefs ?? defaults.failsHardMatchRefs),
      contradictory: input.contradictory ?? defaults.contradictory,
      receiptCheckpointRef: optionalText(input.receiptCheckpointRef),
      proofRef: optionalText(input.proofRef),
      sourceCorrelationRef: optionalText(input.sourceCorrelationRef),
      payloadDigest: stableReviewDigest(input.rawEvidence),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: 1,
    };
    await repositories.saveEvidenceObservation(snapshot);
    return snapshot;
  }

  function deriveAcceptanceState(
    observations: readonly DispatchEvidenceObservationSnapshot[],
    lane: DispatchEvidenceLane,
    priorState: DispatchTransportAcceptanceState,
    deadlineExceeded: boolean,
    ackRequired: boolean,
  ): DispatchTransportAcceptanceState {
    const relevant = observations.filter((entry) => entry.lane === lane);
    if (relevant.some((entry) => entry.contradictory || entry.polarity === "negative")) {
      return relevant.some((entry) => entry.contradictory) ? "disputed" : "rejected";
    }
    if (relevant.length > 0) {
      return "accepted";
    }
    if (deadlineExceeded && ackRequired) {
      return priorState === "none" ? "timed_out" : priorState;
    }
    return priorState;
  }

  async function refreshDerivedState(input: {
    attempt: PharmacyDispatchAttemptSnapshot;
    profile: TransportAssuranceProfileSnapshot;
    binding: DispatchAdapterBindingSnapshot;
    consentCheckpoint: PharmacyConsentCheckpoint;
    selectedProviderRef: AggregateRef<"PharmacyProvider", Task343>;
    packageHash: string;
    recordedAt: string;
    forceResult?: PharmacyDispatchSettlementResult | null;
  }): Promise<PharmacyDispatchBundle> {
    const observations = (await repositories.listEvidenceObservationsForAttempt(
      input.attempt.dispatchAttemptId,
    )).map((entry) => entry.toSnapshot());
    const deadlineExceeded = compareIso(input.recordedAt, input.attempt.proofDeadlineAt) > 0;
    const atoms: ConfirmationEvidenceAtom[] = observations.map((entry) => ({
      evidenceRef: entry.evidenceObservationId,
      sourceFamily: entry.sourceFamily,
      proofRef: entry.proofRef,
      logLikelihoodWeight: Math.abs(entry.logLikelihoodWeight),
      polarity: entry.polarity,
      satisfiesHardMatchRefs: entry.satisfiesHardMatchRefs,
      failsHardMatchRefs: entry.failsHardMatchRefs,
      contradictory: entry.contradictory,
    }));
    const existingGate =
      input.attempt.externalConfirmationGateRef === null
        ? null
        : (await confirmationRepositories.getExternalConfirmationGate(
            input.attempt.externalConfirmationGateRef.refId,
          ))?.toSnapshot() ?? null;
    const gate = await confirmationAuthority.refreshExternalConfirmationGate({
      gateId: existingGate?.gateId,
      episodeId: input.attempt.pharmacyCaseId,
      domain: "phase6_pharmacy_dispatch",
      domainObjectRef: input.attempt.dispatchAttemptId,
      transportMode: input.attempt.transportMode,
      assuranceLevel: getTransportAssuranceLevel(input.profile),
      evidenceModelVersionRef: input.profile.proofRiskModelRef,
      requiredHardMatchRefs: ["authoritative_dispatch_proof"],
      evidenceAtoms: atoms,
      confirmationDeadlineAt: input.attempt.proofDeadlineAt,
      priorProbability: 0.35,
      createdAt: existingGate?.createdAt ?? input.attempt.attemptedAt,
      updatedAt: input.recordedAt,
      gateRevision: existingGate?.gateRevision ? existingGate.gateRevision + 1 : 1,
      thresholdPolicy: buildProofThresholdPolicy(input.profile),
      manualOverrideRequested: false,
    });
    const authoritativeObservation =
      observations
        .filter(
          (entry) =>
            entry.polarity === "positive" &&
            (entry.satisfiesHardMatchRefs.includes("authoritative_dispatch_proof") ||
              entry.lane === "authoritative"),
        )
        .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
        .at(-1) ?? null;
    const negativeWeight = observations
      .filter((entry) => entry.polarity === "negative" || entry.contradictory)
      .reduce((total, entry) => total + Math.abs(entry.logLikelihoodWeight), 0);
    const positiveWeight = observations
      .filter((entry) => entry.polarity === "positive")
      .reduce((total, entry) => total + Math.abs(entry.logLikelihoodWeight), 0);
    const contradictionScore = Math.min(
      1,
      observations.some((entry) => entry.contradictory)
        ? Math.max(
            input.profile.contradictionThreshold + 0.05,
            negativeWeight / Math.max(0.01, positiveWeight + negativeWeight),
          )
        : negativeWeight / Math.max(0.01, positiveWeight + negativeWeight),
    );
    const dispatchConfidence = ensureUnitInterval(
      Math.max(
        0,
        Math.min(
          1,
          gate.toSnapshot().confirmationConfidence - contradictionScore * 0.1,
        ),
      ),
      "dispatchConfidence",
    );
    const proofConfidence = gate.toSnapshot().confirmationConfidence;
    const proofState: DispatchProofState =
      contradictionScore > input.profile.contradictionThreshold ||
      gate.toSnapshot().state === "disputed"
        ? "disputed"
        : authoritativeObservation !== null &&
            gate.toSnapshot().state === "confirmed" &&
            dispatchConfidence >= input.profile.dispatchConfidenceThreshold
          ? "satisfied"
          : deadlineExceeded
            ? "expired"
            : "pending";
    const failureProbability = 1 - dispatchConfidence;
    const riskState: DispatchRiskState =
      proofState === "disputed"
        ? "disputed"
        : proofState === "expired"
          ? "likely_failed"
          : failureProbability < input.profile.thetaDispatchTrack
            ? "on_track"
            : failureProbability < input.profile.thetaDispatchFail
              ? "at_risk"
              : "likely_failed";
    const stateConfidenceBand = buildStateConfidenceBand(proofConfidence);
    const currentProofEnvelope = await repositories.getCurrentProofEnvelopeForAttempt(
      input.attempt.dispatchAttemptId,
    );
    const envelopeSnapshot: DispatchProofEnvelopeSnapshot = {
      dispatchProofEnvelopeId:
        currentProofEnvelope?.toSnapshot().dispatchProofEnvelopeId ??
        nextId("dispatchProofEnvelope"),
      dispatchAttemptId: input.attempt.dispatchAttemptId,
      transportAssuranceProfileRef: makeRef(
        "TransportAssuranceProfile",
        input.profile.transportAssuranceProfileId,
        TASK_343,
      ),
      proofDeadlineAt: input.attempt.proofDeadlineAt,
      proofSources: [...input.profile.proofSources],
      transportAcceptanceEvidenceRefs: observations
        .filter((entry) => entry.lane === "transport_acceptance")
        .map((entry) => entry.evidenceObservationId),
      providerAcceptanceEvidenceRefs: observations
        .filter((entry) => entry.lane === "provider_acceptance")
        .map((entry) => entry.evidenceObservationId),
      deliveryEvidenceRefs: observations
        .filter((entry) => entry.lane === "delivery" || entry.lane === "authoritative")
        .map((entry) => entry.evidenceObservationId),
      authoritativeProofSourceRef:
        authoritativeObservation?.proofRef ??
        authoritativeObservation?.evidenceObservationId ??
        null,
      proofComponents: observations.map((entry) => entry.evidenceObservationId),
      proofConfidence,
      dispatchConfidence,
      contradictionScore,
      sourceCorrelationRefs: uniqueSorted(
        observations
          .map((entry) => entry.sourceCorrelationRef)
          .filter((entry): entry is string => entry !== null),
      ),
      duplicateOfRef: null,
      proofState,
      riskState,
      stateConfidenceBand,
      calibrationVersion: input.profile.proofRiskCalibrationVersion,
      causalToken: stableReviewDigest({
        dispatchAttemptId: input.attempt.dispatchAttemptId,
        monotoneRevision: currentProofEnvelope ? currentProofEnvelope.toSnapshot().monotoneRevision + 1 : 1,
        proofState,
        riskState,
        proofComponents: observations.map((entry) => entry.evidenceObservationId),
      }),
      monotoneRevision: currentProofEnvelope ? currentProofEnvelope.toSnapshot().monotoneRevision + 1 : 1,
      verifiedAt: input.recordedAt,
      version: currentProofEnvelope ? nextVersion(currentProofEnvelope.toSnapshot().version) : 1,
    };
    await repositories.saveProofEnvelope(
      envelopeSnapshot,
      currentProofEnvelope ? { expectedVersion: currentProofEnvelope.toSnapshot().version } : undefined,
    );
    const transportAcceptanceState = deriveAcceptanceState(
      observations,
      "transport_acceptance",
      input.attempt.transportAcceptanceState,
      deadlineExceeded,
      input.profile.ackRequired,
    );
    const providerAcceptanceState = deriveAcceptanceState(
      observations,
      "provider_acceptance",
      input.attempt.providerAcceptanceState,
      deadlineExceeded,
      input.profile.ackRequired,
    );
    const settlementResult =
      input.forceResult ??
      (input.consentCheckpoint.checkpointState !== "satisfied"
        ? "stale_choice_or_consent"
        : proofState === "satisfied"
          ? "live_referral_confirmed"
          : proofState === "disputed" || proofState === "expired"
            ? "reconciliation_required"
            : "pending_ack");
    const currentContinuity = await repositories.getCurrentContinuityEvidenceProjectionForCase(
      input.attempt.pharmacyCaseId,
    );
    const continuitySnapshot: PharmacyContinuityEvidenceProjectionSnapshot = {
      pharmacyContinuityEvidenceProjectionId:
        currentContinuity?.toSnapshot().pharmacyContinuityEvidenceProjectionId ??
        nextId("pharmacyContinuityEvidenceProjection"),
      pharmacyCaseId: input.attempt.pharmacyCaseId,
      dispatchAttemptRef: makeRef(
        "PharmacyDispatchAttempt",
        input.attempt.dispatchAttemptId,
        TASK_343,
      ),
      settlementResult,
      pendingPosture: buildContinuityPosture(settlementResult, riskState),
      audienceMessageRef: buildAudienceMessageRef(settlementResult, riskState),
      nextReviewAt:
        settlementResult === "pending_ack"
          ? input.attempt.proofDeadlineAt
          : settlementResult === "live_referral_confirmed"
            ? null
            : input.recordedAt,
      computedAt: input.recordedAt,
      version: currentContinuity ? nextVersion(currentContinuity.toSnapshot().version) : 1,
    };
    await repositories.saveContinuityEvidenceProjection(
      continuitySnapshot,
      currentContinuity ? { expectedVersion: currentContinuity.toSnapshot().version } : undefined,
    );
    const currentSettlement = await repositories.getCurrentDispatchSettlementForCase(
      input.attempt.pharmacyCaseId,
    );
    const settlementSnapshot: PharmacyDispatchSettlementSnapshot = {
      settlementId:
        currentSettlement?.toSnapshot().settlementId ?? nextId("pharmacyDispatchSettlement"),
      pharmacyCaseId: input.attempt.pharmacyCaseId,
      dispatchAttemptId: input.attempt.dispatchAttemptId,
      dispatchPlanRef: input.attempt.dispatchPlanRef,
      routeIntentBindingRef: input.attempt.routeIntentBindingRef,
      canonicalObjectDescriptorRef: input.attempt.canonicalObjectDescriptorRef,
      governingObjectVersionRef: input.attempt.governingObjectVersionRef,
      routeIntentTupleHash: input.attempt.routeIntentTupleHash,
      proofEnvelopeRef: makeRef(
        "DispatchProofEnvelope",
        envelopeSnapshot.dispatchProofEnvelopeId,
        TASK_343,
      ),
      transportAssuranceProfileRef: makeRef(
        "TransportAssuranceProfile",
        input.profile.transportAssuranceProfileId,
        TASK_343,
      ),
      dispatchAdapterBindingRef: makeRef(
        "DispatchAdapterBinding",
        input.binding.dispatchAdapterBindingId,
        TASK_343,
      ),
      consentCheckpointRef: makeRef(
        "PharmacyConsentCheckpoint",
        input.consentCheckpoint.pharmacyConsentCheckpointId,
        TASK_343,
      ),
      result: settlementResult,
      proofRiskState: riskState,
      stateConfidenceBand,
      calibrationVersion: input.profile.proofRiskCalibrationVersion,
      receiptTextRef: `dispatch_receipt.${settlementResult}.${riskState}`,
      experienceContinuityEvidenceRef:
        continuitySnapshot.pharmacyContinuityEvidenceProjectionId,
      causalToken: stableReviewDigest({
        dispatchAttemptId: input.attempt.dispatchAttemptId,
        monotoneRevision: currentSettlement ? currentSettlement.toSnapshot().monotoneRevision + 1 : 1,
        settlementResult,
        proofEnvelopeId: envelopeSnapshot.dispatchProofEnvelopeId,
      }),
      recoveryRouteRef:
        settlementResult === "live_referral_confirmed"
          ? null
          : `dispatch_recovery.${settlementResult}`,
      monotoneRevision: currentSettlement ? currentSettlement.toSnapshot().monotoneRevision + 1 : 1,
      recordedAt: input.recordedAt,
      version: currentSettlement ? nextVersion(currentSettlement.toSnapshot().version) : 1,
    };
    await repositories.saveDispatchSettlement(
      settlementSnapshot,
      currentSettlement ? { expectedVersion: currentSettlement.toSnapshot().version } : undefined,
    );
    const currentTruth = await repositories.getCurrentDispatchTruthProjectionForCase(
      input.attempt.pharmacyCaseId,
    );
    const truthSnapshot: PharmacyDispatchTruthProjectionSnapshot = {
      pharmacyDispatchTruthProjectionId:
        currentTruth?.toSnapshot().pharmacyDispatchTruthProjectionId ??
        nextId("pharmacyDispatchTruthProjection"),
      pharmacyCaseId: input.attempt.pharmacyCaseId,
      dispatchAttemptRef: makeRef(
        "PharmacyDispatchAttempt",
        input.attempt.dispatchAttemptId,
        TASK_343,
      ),
      dispatchPlanRef: input.attempt.dispatchPlanRef,
      selectedProviderRef: input.selectedProviderRef,
      packageId: input.attempt.packageId,
      packageHash: input.packageHash,
      transportMode: input.attempt.transportMode,
      transportAssuranceProfileRef: makeRef(
        "TransportAssuranceProfile",
        input.profile.transportAssuranceProfileId,
        TASK_343,
      ),
      dispatchAdapterBindingRef: makeRef(
        "DispatchAdapterBinding",
        input.binding.dispatchAdapterBindingId,
        TASK_343,
      ),
      dispatchPlanHash: input.attempt.dispatchPlanHash,
      transportAcceptanceState,
      providerAcceptanceState,
      authoritativeProofState: proofState,
      proofRiskState: riskState,
      dispatchConfidence,
      contradictionScore,
      proofDeadlineAt: input.attempt.proofDeadlineAt,
      outboundReferenceSetHash: input.attempt.outboundReferenceSetHash,
      proofEnvelopeRef: makeRef(
        "DispatchProofEnvelope",
        envelopeSnapshot.dispatchProofEnvelopeId,
        TASK_343,
      ),
      dispatchSettlementRef: makeRef(
        "PharmacyDispatchSettlement",
        settlementSnapshot.settlementId,
        TASK_343,
      ),
      continuityEvidenceRef: continuitySnapshot.pharmacyContinuityEvidenceProjectionId,
      audienceMessageRef: continuitySnapshot.audienceMessageRef,
      computedAt: input.recordedAt,
      version: currentTruth ? nextVersion(currentTruth.toSnapshot().version) : 1,
    };
    await repositories.saveDispatchTruthProjection(
      truthSnapshot,
      currentTruth ? { expectedVersion: currentTruth.toSnapshot().version } : undefined,
    );
    const updatedAttempt: PharmacyDispatchAttemptSnapshot = {
      ...input.attempt,
      status: buildAttemptStatus({
        proofState,
        transportAcceptanceState,
      }),
      transportAcceptanceState,
      providerAcceptanceState,
      proofState,
      dispatchConfidence,
      contradictionScore,
      proofEnvelopeRef: makeRef(
        "DispatchProofEnvelope",
        envelopeSnapshot.dispatchProofEnvelopeId,
        TASK_343,
      ),
      externalConfirmationGateRef: makeRef("ExternalConfirmationGate", gate.gateId, TASK_343),
      authoritativeProofRef:
        authoritativeObservation?.proofRef ??
        authoritativeObservation?.evidenceObservationId ??
        `proof_pending::${input.attempt.dispatchAttemptId}`,
      confirmedAt: proofState === "satisfied" ? input.recordedAt : input.attempt.confirmedAt,
      version: nextVersion(input.attempt.version),
    };
    await repositories.saveDispatchAttempt(updatedAttempt, {
      expectedVersion: input.attempt.version,
    });
    const currentCorrelationDocument = await packageRepositories.getCurrentCorrelationRecordForCase(
      input.attempt.pharmacyCaseId,
    );
    invariant(
      currentCorrelationDocument !== null,
      "CORRELATION_RECORD_NOT_FOUND",
      "Correlation record was not found.",
    );
    const currentCorrelation = currentCorrelationDocument.toSnapshot();
    const updatedCorrelation: PharmacyCorrelationRecordSnapshot = {
      ...currentCorrelation,
      dispatchAttemptId: updatedAttempt.dispatchAttemptId,
      dispatchPlanRef: updatedAttempt.dispatchPlanRef.refId,
      transportMode: updatedAttempt.transportMode,
      transportAssuranceProfileRef: updatedAttempt.transportAssuranceProfileRef.refId,
      dispatchAdapterBindingRef: updatedAttempt.dispatchAdapterBindingRef.refId,
      dispatchPlanHash: updatedAttempt.dispatchPlanHash,
      outboundReferenceSet: [...updatedAttempt.outboundReferenceSet],
      outboundReferenceSetHash: updatedAttempt.outboundReferenceSetHash,
      transportAcceptanceState: updatedAttempt.transportAcceptanceState,
      providerAcceptanceState: updatedAttempt.providerAcceptanceState,
      authoritativeDispatchProofState: updatedAttempt.proofState,
      currentProofEnvelopeRef: envelopeSnapshot.dispatchProofEnvelopeId,
      currentDispatchSettlementRef: settlementSnapshot.settlementId,
      acknowledgementState:
        settlementResult === "live_referral_confirmed"
          ? "confirmed"
          : settlementResult === "reconciliation_required"
            ? "disputed"
            : "pending",
      updatedAt: input.recordedAt,
      version: nextVersion(currentCorrelation.version),
    };
    await packageRepositories.saveCorrelationRecord(updatedCorrelation, {
      expectedVersion: currentCorrelation.version,
    });
    return (await loadBundleForAttempt(updatedAttempt.dispatchAttemptId))!;
  }

  async function transitionCaseForSuccessfulSend(input: {
    command: SubmitPharmacyDispatchInput | ResendPharmacyDispatchInput;
    consentCheckpoint: PharmacyConsentCheckpoint;
    dispatchAttemptId: string;
    proofState: DispatchProofState;
    currentCase: PharmacyCaseSnapshot;
    correlationId: string;
    gateId: string | null;
  }): Promise<PharmacyCaseMutationResult | null> {
    if (input.currentCase.status === "referred" || input.currentCase.status === "consultation_outcome_pending") {
      return null;
    }
    return caseKernelService.dispatchPharmacyReferral({
      pharmacyCaseId: input.command.pharmacyCaseId,
      actorRef: input.command.actorRef,
      commandActionRecordRef: input.command.commandActionRecordRef,
      commandSettlementRecordRef: input.command.commandSettlementRecordRef,
      recordedAt: input.command.recordedAt,
      leaseRef: input.command.leaseRef,
      expectedOwnershipEpoch: input.command.expectedOwnershipEpoch,
      expectedLineageFenceRef: input.command.expectedLineageFenceRef,
      scopedMutationGateRef: input.command.scopedMutationGateRef,
      reasonCode: input.command.reasonCode,
      activeConsentCheckpointRef: makeRef(
        "PharmacyConsentCheckpoint",
        input.consentCheckpoint.pharmacyConsentCheckpointId,
        TASK_343,
      ),
      activeDispatchAttemptRef: makeRef(
        "PharmacyDispatchAttempt",
        input.dispatchAttemptId,
        TASK_343,
      ),
      correlationRef: makeRef("CorrelationRecord", input.correlationId, TASK_343),
      checkpointState:
        input.consentCheckpoint.checkpointState === "satisfied" ? "satisfied" : "unsatisfied",
      dispatchProofState: input.proofState === "satisfied" ? "confirmed" : "missing",
      currentConfirmationGateRefs:
        input.gateId === null ? [] : [makeRef("ExternalConfirmationGate", input.gateId, TASK_343)],
    });
  }

  async function failClosedOnStaleContext(input: {
    command: SubmitPharmacyDispatchInput | ResendPharmacyDispatchInput;
    pharmacyCase: PharmacyCaseSnapshot;
    consentCheckpoint: PharmacyConsentCheckpoint;
    currentAttemptId?: string | null;
  }): Promise<void> {
    if (input.currentAttemptId) {
      await caseKernelService.dispatchPharmacyReferral({
        pharmacyCaseId: input.command.pharmacyCaseId,
        actorRef: input.command.actorRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
        commandSettlementRecordRef: input.command.commandSettlementRecordRef,
        recordedAt: input.command.recordedAt,
        leaseRef: input.command.leaseRef,
        expectedOwnershipEpoch: input.command.expectedOwnershipEpoch,
        expectedLineageFenceRef: input.command.expectedLineageFenceRef,
        scopedMutationGateRef: input.command.scopedMutationGateRef,
        reasonCode: input.command.reasonCode,
        activeConsentCheckpointRef: makeRef(
          "PharmacyConsentCheckpoint",
          input.consentCheckpoint.pharmacyConsentCheckpointId,
          TASK_343,
        ),
        activeDispatchAttemptRef: makeRef(
          "PharmacyDispatchAttempt",
          input.currentAttemptId,
          TASK_343,
        ),
        checkpointState: "unsatisfied",
        dispatchProofState: "missing",
      });
      return;
    }
    if (input.pharmacyCase.status === "package_ready") {
      await caseKernelService.transitionPharmacyCase({
        pharmacyCaseId: input.command.pharmacyCaseId,
        actorRef: input.command.actorRef,
        commandActionRecordRef: input.command.commandActionRecordRef,
        commandSettlementRecordRef: input.command.commandSettlementRecordRef,
        recordedAt: input.command.recordedAt,
        leaseRef: input.command.leaseRef,
        expectedOwnershipEpoch: input.command.expectedOwnershipEpoch,
        expectedLineageFenceRef: input.command.expectedLineageFenceRef,
        scopedMutationGateRef: input.command.scopedMutationGateRef,
        reasonCode: input.command.reasonCode,
        nextStatus: "consent_pending",
        eventName: "pharmacy.consent.revoked",
        transitionPredicateId: "PH6_TX_008",
      });
    }
  }

  async function executeDispatch(
    input: SubmitPharmacyDispatchInput | ResendPharmacyDispatchInput,
    allowRetry: boolean,
  ): Promise<PharmacyDispatchCommandResult> {
    const planned = await compileDispatchPlan(input);
    const initialContext = await resolveDispatchContext({
      pharmacyCaseId: input.pharmacyCaseId,
      packageId: input.packageId,
    });
    const currentAttemptDocument = await repositories.getCurrentDispatchAttemptForCase(
      input.pharmacyCaseId,
    );
    const currentAttempt = currentAttemptDocument?.toSnapshot() ?? null;
    if (initialContext.consentCheckpoint.checkpointState !== "satisfied") {
      await failClosedOnStaleContext({
        command: input,
        pharmacyCase: initialContext.pharmacyCase,
        consentCheckpoint: initialContext.consentCheckpoint,
        currentAttemptId: currentAttempt?.dispatchAttemptId ?? null,
      });
      invariant(
        false,
        "STALE_CHOICE_OR_CONSENT",
        "Dispatch tuple drifted or consent is no longer satisfied.",
      );
    }
    const requestedAttempt =
      "dispatchAttemptId" in input && optionalText(input.dispatchAttemptId)
        ? (await repositories.getDispatchAttempt(requireText(input.dispatchAttemptId, "dispatchAttemptId")))?.toSnapshot() ??
          null
        : null;
    const activeAttempt =
      requestedAttempt ??
      (currentAttempt !== null &&
      currentAttempt.dispatchPlanHash === planned.plan.dispatchPlanHash &&
      currentAttempt.packageHash === initialContext.frozenPackage.packageHash &&
      currentAttempt.routeIntentTupleHash === initialContext.frozenPackage.routeIntentTupleHash &&
      currentAttempt.status !== "superseded"
        ? currentAttempt
        : null);
    const attemptGeneration =
      activeAttempt === null ? 1 : activeAttempt.retryGeneration + (allowRetry ? 1 : 0);
    const semanticCommandPayload = {
      pharmacyCaseId: input.pharmacyCaseId,
      packageId: initialContext.frozenPackage.packageId,
      transportMode: planned.plan.transportMode,
      dispatchPlanHash: planned.plan.dispatchPlanHash,
      routeIntentBindingRef: input.routeIntentBindingRef,
      routeIntentTupleHash: initialContext.frozenPackage.routeIntentTupleHash,
      canonicalObjectDescriptorRef: input.canonicalObjectDescriptorRef,
      governingObjectVersionRef: input.governingObjectVersionRef,
      retry: allowRetry,
    };
    const replayDecision = await replayAuthority.resolveInboundCommand({
      actionScope: allowRetry ? "pharmacy.dispatch.resend" : "pharmacy.dispatch.submit",
      governingLineageRef: initialContext.pharmacyCase.requestLineageRef.refId,
      effectiveActorRef: input.actorRef,
      sourceCommandId: input.sourceCommandId ?? null,
      transportCorrelationId: input.transportCorrelationId ?? null,
      intentGeneration: input.retryIntentGeneration ?? attemptGeneration,
      expectedEffectSetRefs: [
        planned.plan.dispatchPlanId,
        initialContext.frozenPackage.packageId,
        initialContext.provider.providerId,
      ],
      scope: {
        governingObjectRef: initialContext.pharmacyCase.pharmacyCaseId,
        governingObjectVersionRef: input.governingObjectVersionRef,
        routeIntentTupleHash: initialContext.frozenPackage.routeIntentTupleHash,
        routeContractDigestRef: input.routeIntentBindingRef,
      },
      rawPayload: semanticCommandPayload,
      semanticPayload: semanticCommandPayload,
      firstAcceptedActionRecordRef: input.commandActionRecordRef,
      acceptedSettlementRef: input.commandSettlementRecordRef,
      observedAt: input.recordedAt,
    });
    const effectKey = buildEffectKey({
      pharmacyCaseId: input.pharmacyCaseId,
      packageHash: initialContext.frozenPackage.packageHash,
      dispatchPlanHash: planned.plan.dispatchPlanHash,
      routeIntentTupleHash: initialContext.frozenPackage.routeIntentTupleHash,
      transportMode: planned.plan.transportMode,
    });
    const adapterAttemptDecision = await replayAuthority.ensureAdapterDispatchAttempt({
      idempotencyRecordRef: replayDecision.idempotencyRecord.idempotencyRecordId,
      actionScope: allowRetry ? "pharmacy.dispatch.resend" : "pharmacy.dispatch.submit",
      governingLineageRef: initialContext.pharmacyCase.requestLineageRef.refId,
      actionRecordRef: input.commandActionRecordRef,
      adapterContractProfileRef: planned.binding.adapterVersionRef,
      effectScope: `${input.pharmacyCaseId}::${planned.plan.transportMode}`,
      effectKey,
      transportPayload: planned.payload.payload,
      semanticPayload: semanticCommandPayload,
      providerCorrelationRef: initialContext.currentCorrelation.correlationId,
      firstDispatchedAt: input.recordedAt,
    });
    if (adapterAttemptDecision.reusedExistingAttempt && !allowRetry && activeAttempt !== null) {
      return {
        dispatchBundle: (await loadBundleForAttempt(activeAttempt.dispatchAttemptId))!,
        caseMutation: null,
        replayed: true,
        reusedExistingAttempt: true,
      };
    }
    const preCommitContext = await resolveDispatchContext({
      pharmacyCaseId: input.pharmacyCaseId,
      packageId: input.packageId,
    });
    if (preCommitContext.consentCheckpoint.checkpointState !== "satisfied") {
      await failClosedOnStaleContext({
        command: input,
        pharmacyCase: preCommitContext.pharmacyCase,
        consentCheckpoint: preCommitContext.consentCheckpoint,
        currentAttemptId: activeAttempt?.dispatchAttemptId ?? null,
      });
      invariant(
        false,
        "STALE_CHOICE_OR_CONSENT",
        "Dispatch tuple drifted or consent is no longer satisfied immediately before send.",
      );
    }

    let supersededAttempt: PharmacyDispatchAttemptSnapshot | null = null;
    if (
      currentAttempt !== null &&
      activeAttempt === null &&
      currentAttempt.status !== "superseded" &&
      (currentAttempt.dispatchPlanHash !== planned.plan.dispatchPlanHash ||
        currentAttempt.packageHash !== preCommitContext.frozenPackage.packageHash ||
        currentAttempt.routeIntentTupleHash !== preCommitContext.frozenPackage.routeIntentTupleHash)
    ) {
      supersededAttempt = {
        ...currentAttempt,
        status: "superseded",
        supersededByAttemptRef: null,
        version: nextVersion(currentAttempt.version),
      };
    }
    let attempt = activeAttempt;
    if (attempt === null) {
      const attemptId = nextId("pharmacyDispatchAttempt");
      const pendingGate = await confirmationAuthority.refreshExternalConfirmationGate({
        episodeId: input.pharmacyCaseId,
        domain: "phase6_pharmacy_dispatch",
        domainObjectRef: attemptId,
        transportMode: planned.plan.transportMode,
        assuranceLevel: getTransportAssuranceLevel(planned.profile),
        evidenceModelVersionRef: planned.profile.proofRiskModelRef,
        requiredHardMatchRefs: ["authoritative_dispatch_proof"],
        evidenceAtoms: [],
        confirmationDeadlineAt: addDurationToIso(input.recordedAt, planned.profile.proofDeadlinePolicy),
        priorProbability: 0.35,
        createdAt: input.recordedAt,
        updatedAt: input.recordedAt,
        gateRevision: 1,
        thresholdPolicy: buildProofThresholdPolicy(planned.profile),
      });
      const attemptSnapshot: PharmacyDispatchAttemptSnapshot = {
        dispatchAttemptId: attemptId,
        pharmacyCaseId: input.pharmacyCaseId,
        packageId: preCommitContext.frozenPackage.packageId,
        dispatchPlanRef: makeRef("PharmacyDispatchPlan", planned.plan.dispatchPlanId, TASK_343),
        transportMode: planned.plan.transportMode,
        transportAssuranceProfileRef: makeRef(
          "TransportAssuranceProfile",
          planned.profile.transportAssuranceProfileId,
          TASK_343,
        ),
        routeIntentBindingRef: input.routeIntentBindingRef,
        canonicalObjectDescriptorRef: input.canonicalObjectDescriptorRef,
        governingObjectVersionRef: input.governingObjectVersionRef,
        routeIntentTupleHash: preCommitContext.frozenPackage.routeIntentTupleHash,
        idempotencyKey:
          input.sourceCommandId ??
          replayDecision.idempotencyRecord.toSnapshot().replayKey,
        requestLifecycleLeaseRef: input.leaseRef,
        requestOwnershipEpochRef: `ownership_epoch::${input.expectedOwnershipEpoch}`,
        commandActionRecordRef: input.commandActionRecordRef,
        idempotencyRecordRef: replayDecision.idempotencyRecord.idempotencyRecordId,
        adapterDispatchAttemptRef: adapterAttemptDecision.dispatchAttempt.dispatchAttemptId,
        latestReceiptCheckpointRef: `receipt_pending::${attemptId}`,
        providerRef: makeRef("PharmacyProvider", preCommitContext.provider.providerId, TASK_343),
        providerCapabilitySnapshotRef: makeRef(
          "PharmacyProviderCapabilitySnapshot",
          preCommitContext.providerCapabilitySnapshot.providerCapabilitySnapshotId,
          TASK_343,
        ),
        dispatchAdapterBindingRef: makeRef(
          "DispatchAdapterBinding",
          planned.binding.dispatchAdapterBindingId,
          TASK_343,
        ),
        dispatchPlanHash: planned.plan.dispatchPlanHash,
        packageHash: preCommitContext.frozenPackage.packageHash,
        outboundReferenceSet: [],
        outboundReferenceSetHash: buildOutboundReferenceSetHash([]),
        status: "pending_send",
        transportAcceptanceState: "none",
        providerAcceptanceState: "none",
        proofDeadlineAt: addDurationToIso(input.recordedAt, planned.profile.proofDeadlinePolicy),
        proofState: "pending",
        dispatchConfidence: 0.35,
        contradictionScore: 0,
        proofEnvelopeRef: null,
        externalConfirmationGateRef: makeRef("ExternalConfirmationGate", pendingGate.gateId, TASK_343),
        authoritativeProofRef: `proof_pending::${attemptId}`,
        supersededByAttemptRef: null,
        attemptedAt: input.recordedAt,
        confirmedAt: null,
        lastSentAt: null,
        retryGeneration: 1,
        version: 1,
      };
      await repositories.saveDispatchAttempt(attemptSnapshot);
      attempt = attemptSnapshot;
    }
    const adapter = adapters.get(planned.plan.transportMode);
    invariant(adapter !== undefined, "DISPATCH_ADAPTER_NOT_FOUND", `Dispatch adapter for ${planned.plan.transportMode} was not found.`);
    const sendResult = await adapter.send({
      attemptId: attempt.dispatchAttemptId,
      plan: planned.plan,
      payload: planned.payload,
      frozenPackage: preCommitContext.frozenPackage,
      provider: preCommitContext.provider,
      transportAssuranceProfile: planned.profile,
      binding: planned.binding,
      recordedAt: input.recordedAt,
    });
    const checkpoint = await replayAuthority.recordAdapterReceiptCheckpoint({
      actionScope: allowRetry ? "pharmacy.dispatch.resend" : "pharmacy.dispatch.submit",
      governingLineageRef: preCommitContext.pharmacyCase.requestLineageRef.refId,
      adapterContractProfileRef: planned.binding.adapterVersionRef,
      effectKey,
      providerCorrelationRef:
        sendResult.providerCorrelationRef ?? preCommitContext.currentCorrelation.correlationId,
      transportMessageId: sendResult.transportMessageId,
      orderingKey: input.recordedAt,
      rawReceipt: sendResult.rawReceipt,
      semanticReceipt: sendResult.semanticReceipt,
      recordedAt: input.recordedAt,
    });
    await recordEvidenceObservation({
      dispatchAttemptId: attempt.dispatchAttemptId,
      lane: "transport_acceptance",
      sourceClass: sendResult.acknowledgementSourceClass,
      recordedAt: input.recordedAt,
      receiptCheckpointRef: checkpoint.checkpoint.receiptCheckpointId,
      sourceCorrelationRef: sendResult.providerCorrelationRef,
      rawEvidence: sendResult.rawReceipt,
    });
    const nextOutboundReferenceSet = uniqueSorted([
      ...attempt.outboundReferenceSet,
      sendResult.transportMessageId,
      ...(sendResult.providerCorrelationRef ? [sendResult.providerCorrelationRef] : []),
    ]);
    const updatedAttemptForRefresh: PharmacyDispatchAttemptSnapshot = {
      ...attempt,
      latestReceiptCheckpointRef: checkpoint.checkpoint.receiptCheckpointId,
      outboundReferenceSet: nextOutboundReferenceSet,
      outboundReferenceSetHash: buildOutboundReferenceSetHash(nextOutboundReferenceSet),
      lastSentAt: input.recordedAt,
      retryGeneration: allowRetry ? attempt.retryGeneration + 1 : attempt.retryGeneration,
      version: nextVersion(attempt.version),
    };
    await repositories.saveDispatchAttempt(updatedAttemptForRefresh, {
      expectedVersion: attempt.version,
    });
    const refreshedBundle = await refreshDerivedState({
      attempt: updatedAttemptForRefresh,
      profile: planned.profile,
      binding: planned.binding,
      consentCheckpoint: preCommitContext.consentCheckpoint,
      selectedProviderRef: makeRef("PharmacyProvider", preCommitContext.provider.providerId, TASK_343),
      packageHash: preCommitContext.frozenPackage.packageHash,
      recordedAt: input.recordedAt,
    });
    if (supersededAttempt !== null) {
      await repositories.saveDispatchAttempt(
        {
          ...supersededAttempt,
          supersededByAttemptRef: makeRef(
            "PharmacyDispatchAttempt",
            refreshedBundle.attempt.dispatchAttemptId,
            TASK_343,
          ),
        },
        { expectedVersion: currentAttempt!.version },
      );
    }
    const currentCorrelationDocument = await packageRepositories.getCurrentCorrelationRecordForCase(
      input.pharmacyCaseId,
    );
    invariant(
      currentCorrelationDocument !== null,
      "CORRELATION_RECORD_NOT_FOUND",
      "Correlation record was not found.",
    );
    const currentCorrelation = currentCorrelationDocument.toSnapshot();
    const caseMutation = await transitionCaseForSuccessfulSend({
      command: input,
      consentCheckpoint: preCommitContext.consentCheckpoint,
      dispatchAttemptId: refreshedBundle.attempt.dispatchAttemptId,
      proofState: refreshedBundle.proofEnvelope.proofState,
      currentCase: preCommitContext.pharmacyCase,
      correlationId: currentCorrelation.correlationId,
      gateId: refreshedBundle.externalConfirmationGate?.gateId ?? null,
    });
    await saveDispatchAuditEvent({
      pharmacyCaseId: input.pharmacyCaseId,
      dispatchAttemptId: refreshedBundle.attempt.dispatchAttemptId,
      eventName: allowRetry ? "pharmacy.dispatch.resend.executed" : "pharmacy.dispatch.submit.executed",
      actorRef: input.actorRef,
      payload: {
        transportMode: refreshedBundle.plan.transportMode,
        dispatchPlanHash: refreshedBundle.plan.dispatchPlanHash,
        attemptId: refreshedBundle.attempt.dispatchAttemptId,
        reusedExistingAttempt: adapterAttemptDecision.reusedExistingAttempt,
      },
      recordedAt: input.recordedAt,
    });
    return {
      dispatchBundle: refreshedBundle,
      caseMutation,
      replayed: replayDecision.reusedExistingRecord,
      reusedExistingAttempt:
        adapterAttemptDecision.reusedExistingAttempt || activeAttempt !== null,
    };
  }

  return {
    repositories,
    caseKernelService,
    directoryRepositories,
    packageRepositories,
    replayRepositories,
    confirmationRepositories,
    adapters,

    async planDispatch(input) {
      return compileDispatchPlan(input);
    },

    async submitDispatch(input) {
      return executeDispatch(input, false);
    },

    async resendDispatch(input) {
      return executeDispatch(input, true);
    },

    async ingestReceiptEvidence(input) {
      const attemptDocument = await repositories.getDispatchAttempt(input.dispatchAttemptId);
      invariant(attemptDocument !== null, "DISPATCH_ATTEMPT_NOT_FOUND", "PharmacyDispatchAttempt was not found.");
      const attempt = attemptDocument.toSnapshot();
      const plan = (await repositories.getDispatchPlan(attempt.dispatchPlanRef.refId))?.toSnapshot();
      invariant(plan !== null, "DISPATCH_PLAN_NOT_FOUND", "PharmacyDispatchPlan was not found.");
      const profile = await requireProfile(attempt.transportMode);
      const bindingDocument = await repositories.getDispatchAdapterBinding(
        attempt.dispatchAdapterBindingRef.refId,
      );
      invariant(bindingDocument !== null, "DISPATCH_BINDING_NOT_FOUND", "DispatchAdapterBinding was not found.");
      const binding = bindingDocument.toSnapshot();
      const context = await resolveDispatchContext({
        pharmacyCaseId: attempt.pharmacyCaseId,
        packageId: attempt.packageId,
      });
      if (optionalText(input.transportMessageId) && optionalText(input.orderingKey)) {
        await replayAuthority.recordAdapterReceiptCheckpoint({
          actionScope: "pharmacy.dispatch.evidence",
          governingLineageRef: context.pharmacyCase.requestLineageRef.refId,
          adapterContractProfileRef: binding.adapterVersionRef,
          effectKey: buildEffectKey({
            pharmacyCaseId: attempt.pharmacyCaseId,
            packageHash: attempt.packageHash,
            dispatchPlanHash: attempt.dispatchPlanHash,
            routeIntentTupleHash: attempt.routeIntentTupleHash,
            transportMode: attempt.transportMode,
          }),
          providerCorrelationRef: input.sourceCorrelationRef ?? context.currentCorrelation.correlationId,
          transportMessageId: requireText(input.transportMessageId, "transportMessageId"),
          orderingKey: requireText(input.orderingKey, "orderingKey"),
          rawReceipt: input.rawEvidence,
          semanticReceipt: input.semanticEvidence,
          recordedAt: input.recordedAt,
        });
      }
      await recordEvidenceObservation({
        dispatchAttemptId: attempt.dispatchAttemptId,
        lane: input.lane,
        sourceClass: input.sourceClass,
        recordedAt: input.recordedAt,
        proofRef: input.proofRef,
        sourceCorrelationRef: input.sourceCorrelationRef,
        rawEvidence: input.rawEvidence,
        polarity: input.polarity,
        logLikelihoodWeight: input.logLikelihoodWeight,
        satisfiesHardMatchRefs: input.satisfiesHardMatchRefs,
        failsHardMatchRefs: input.failsHardMatchRefs,
        contradictory: input.contradictory,
      });
      const refreshedBundle = await refreshDerivedState({
        attempt,
        profile,
        binding,
        consentCheckpoint: context.consentCheckpoint,
        selectedProviderRef: makeRef("PharmacyProvider", context.provider.providerId, TASK_343),
        packageHash: context.frozenPackage.packageHash,
        recordedAt: input.recordedAt,
      });
      if (
        refreshedBundle.proofEnvelope.proofState === "satisfied" &&
        context.pharmacyCase.status !== "referred" &&
        context.pharmacyCase.status !== "consultation_outcome_pending"
      ) {
        await caseKernelService.dispatchPharmacyReferral({
          pharmacyCaseId: context.pharmacyCase.pharmacyCaseId,
          actorRef: "system::dispatch_proof_aggregator",
          commandActionRecordRef: `dispatch_proof_aggregator::${refreshedBundle.attempt.dispatchAttemptId}`,
          commandSettlementRecordRef: `dispatch_proof_aggregator::${refreshedBundle.settlement.settlementId}`,
          recordedAt: input.recordedAt,
          leaseRef: context.pharmacyCase.leaseRef,
          expectedOwnershipEpoch: context.pharmacyCase.ownershipEpoch,
          expectedLineageFenceRef: context.pharmacyCase.lineageFenceRef,
          scopedMutationGateRef: `scope_gate::dispatch_proof_aggregator::${refreshedBundle.attempt.dispatchAttemptId}`,
          reasonCode: "aggregate_dispatch_proof",
          activeConsentCheckpointRef: makeRef(
            "PharmacyConsentCheckpoint",
            context.consentCheckpoint.pharmacyConsentCheckpointId,
            TASK_343,
          ),
          activeDispatchAttemptRef: makeRef(
            "PharmacyDispatchAttempt",
            refreshedBundle.attempt.dispatchAttemptId,
            TASK_343,
          ),
          correlationRef: makeRef("CorrelationRecord", refreshedBundle.correlationRecord.correlationId, TASK_343),
          checkpointState: "satisfied",
          dispatchProofState: "confirmed",
          currentConfirmationGateRefs:
            refreshedBundle.externalConfirmationGate === null
              ? []
              : [
                  makeRef(
                    "ExternalConfirmationGate",
                    refreshedBundle.externalConfirmationGate.gateId,
                    TASK_343,
                  ),
                ],
        });
      }
      return refreshedBundle;
    },

    async markDispatchContradiction(input) {
      return this.ingestReceiptEvidence({
        dispatchAttemptId: input.dispatchAttemptId,
        lane: "authoritative",
        sourceClass: input.sourceClass,
        recordedAt: input.recordedAt,
        rawEvidence: input.rawEvidence ?? {
          contradictionRef: input.contradictionRef,
        },
        semanticEvidence: input.semanticEvidence ?? {
          contradictionRef: input.contradictionRef,
        },
        proofRef: input.contradictionRef,
        polarity: "negative",
        logLikelihoodWeight: 1.45,
        failsHardMatchRefs: ["authoritative_dispatch_proof"],
        contradictory: true,
      });
    },

    async recordManualDispatchAssistance(input) {
      const attemptDocument = await repositories.getDispatchAttempt(input.dispatchAttemptId);
      invariant(attemptDocument !== null, "DISPATCH_ATTEMPT_NOT_FOUND", "PharmacyDispatchAttempt was not found.");
      const attempt = attemptDocument.toSnapshot();
      const record: ManualDispatchAssistanceRecordSnapshot = {
        manualDispatchAssistanceRecordId: nextId("manualDispatchAssistanceRecord"),
        dispatchAttemptId: attempt.dispatchAttemptId,
        operatorRef: requireText(input.operatorRef, "operatorRef"),
        operatorActionRef: requireText(input.operatorActionRef, "operatorActionRef"),
        secondReviewerRef: optionalText(input.secondReviewerRef),
        evidenceRefs: uniqueSorted(input.evidenceRefs),
        attestationState: input.attestationState,
        completedAt:
          input.completedAt === undefined || input.completedAt === null
            ? null
            : ensureIsoTimestamp(input.completedAt, "completedAt"),
        version: 1,
      };
      await repositories.saveManualDispatchAssistanceRecord(record);
      await recordEvidenceObservation({
        dispatchAttemptId: attempt.dispatchAttemptId,
        lane: "delivery",
        sourceClass: "operator_attestation",
        recordedAt: input.completedAt ?? new Date().toISOString(),
        proofRef: record.manualDispatchAssistanceRecordId,
        rawEvidence: record,
      });
      if (record.secondReviewerRef && input.attestationState === "attested") {
        await recordEvidenceObservation({
          dispatchAttemptId: attempt.dispatchAttemptId,
          lane: "authoritative",
          sourceClass: "second_reviewer_attestation",
          recordedAt: input.completedAt ?? new Date().toISOString(),
          proofRef: record.manualDispatchAssistanceRecordId,
          rawEvidence: record,
        });
      } else if (input.attestationState === "rejected") {
        await recordEvidenceObservation({
          dispatchAttemptId: attempt.dispatchAttemptId,
          lane: "authoritative",
          sourceClass: "manual_supervisor_attestation",
          recordedAt: input.completedAt ?? new Date().toISOString(),
          proofRef: record.manualDispatchAssistanceRecordId,
          rawEvidence: record,
          polarity: "negative",
          logLikelihoodWeight: 1.25,
          failsHardMatchRefs: ["authoritative_dispatch_proof"],
          contradictory: true,
        });
      }
      const profile = await requireProfile(attempt.transportMode);
      const bindingDocument = await repositories.getDispatchAdapterBinding(
        attempt.dispatchAdapterBindingRef.refId,
      );
      invariant(bindingDocument !== null, "DISPATCH_BINDING_NOT_FOUND", "DispatchAdapterBinding was not found.");
      const binding = bindingDocument.toSnapshot();
      const context = await resolveDispatchContext({
        pharmacyCaseId: attempt.pharmacyCaseId,
        packageId: attempt.packageId,
      });
      return refreshDerivedState({
        attempt,
        profile,
        binding,
        consentCheckpoint: context.consentCheckpoint,
        selectedProviderRef: makeRef("PharmacyProvider", context.provider.providerId, TASK_343),
        packageHash: context.frozenPackage.packageHash,
        recordedAt: input.completedAt ?? new Date().toISOString(),
      });
    },

    async expireStaleAttempts(input) {
      const now = ensureIsoTimestamp(input.now, "now");
      const bundles: PharmacyDispatchBundle[] = [];
      const currentAttempts = (await repositories.listDispatchAttempts())
        .map((entry) => entry.toSnapshot())
        .filter((entry) => entry.status !== "superseded");
      for (const entry of currentAttempts) {
        if (compareIso(now, entry.proofDeadlineAt) <= 0 || entry.proofState !== "pending") {
          continue;
        }
        const profile = await requireProfile(entry.transportMode);
        const bindingDocument = await repositories.getDispatchAdapterBinding(
          entry.dispatchAdapterBindingRef.refId,
        );
        invariant(bindingDocument !== null, "DISPATCH_BINDING_NOT_FOUND", "DispatchAdapterBinding was not found.");
        const binding = bindingDocument.toSnapshot();
        const context = await resolveDispatchContext({
          pharmacyCaseId: entry.pharmacyCaseId,
          packageId: entry.packageId,
        });
        const bundle = await refreshDerivedState({
          attempt: entry,
          profile,
          binding,
          consentCheckpoint: context.consentCheckpoint,
          selectedProviderRef: makeRef("PharmacyProvider", context.provider.providerId, TASK_343),
          packageHash: context.frozenPackage.packageHash,
          recordedAt: now,
        });
        bundles.push(bundle);
      }
      return bundles;
    },

    async getCurrentDispatchTruth(pharmacyCaseId) {
      const attemptDocument = await repositories.getCurrentDispatchAttemptForCase(pharmacyCaseId);
      return attemptDocument === null ? null : loadBundleForAttempt(attemptDocument.toSnapshot().dispatchAttemptId);
    },
  };
}
