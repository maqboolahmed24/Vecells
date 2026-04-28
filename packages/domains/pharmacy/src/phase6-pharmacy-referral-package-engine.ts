import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  createFhirRepresentationCompiler,
  createFhirRepresentationStore,
  fhirExchangeBundlePolicies,
  fhirIdentifierPolicies,
  fhirRepresentationContracts,
  fhirStatusMappingPolicies,
  type FhirCompilerDependencies,
  type FhirMaterializationResult,
  type FhirRepresentationCompiler,
  type FhirRepresentationContractSnapshot,
  type FhirRepresentationSetSnapshot,
  type FhirResourceRecordSnapshot,
} from "@vecells/fhir-mapping";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type Phase6PharmacyCaseKernelService,
  type PharmacyCaseMutationResult,
  type PharmacyCaseSnapshot,
  type PharmacyPathwayCode,
  type PharmacyServiceType,
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

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_349 =
  "par_349_phase6_track_backend_build_referral_pack_composer_and_content_governance_binding" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task349 = typeof TASK_349;

const PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID =
  "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1" as const;
const DEFAULT_VISIBILITY_POLICY_REF =
  "VisibilityProjectionPolicy.pharmacy_partner_referral" as const;
const DEFAULT_MINIMUM_NECESSARY_CONTRACT_REF =
  "MinimumNecessaryContract.pharmacy_partner_referral" as const;

export type PharmacyReferralPackageState =
  | "composing"
  | "frozen"
  | "superseded"
  | "invalidated";

export type PharmacyPackageContentDecisionState =
  | "included"
  | "excluded_by_policy"
  | "included_redaction_required"
  | "included_summary_only"
  | "unavailable";

export type PharmacyPackageArtifactClass =
  | "service_request"
  | "communication"
  | "document_reference"
  | "consent"
  | "provenance"
  | "audit_event"
  | "patient_summary"
  | "clinical_summary";

export type PharmacyPackageArtifactContentState =
  | "full"
  | "summary_only"
  | "redacted";

export type PharmacyPackageTupleValidationState =
  | "valid"
  | "stale_choice_or_consent"
  | "content_ambiguity";

export type PharmacyCorrelationAuthoritativeDispatchProofState =
  | "pending"
  | "satisfied"
  | "disputed"
  | "expired";

export type PharmacyCorrelationAcknowledgementState =
  | "awaiting_dispatch"
  | "pending"
  | "confirmed"
  | "disputed";

export interface PharmacyReferralRouteIntentTupleInput {
  actionScope: string;
  governingObjectRef: string;
  canonicalObjectDescriptorRef: string;
  routeIntentRef: string;
  routeContractDigestRef: string;
  parentAnchorRef: string;
  governingObjectVersionRef: string;
  lineageScope: string;
  requiredContextBoundaryRefs: readonly string[];
  actingContextRef: string;
  initiatingBoundedContextRef: string;
  governingBoundedContextRef: string;
}

export interface PharmacyReferralStructuredContentInput {
  sourceArtifactRef: string;
  sourceHash: string;
  label: string;
  summaryText: string;
  derivationRef?: string | null;
  visibilityPolicyRef?: string | null;
  minimumNecessaryContractRef?: string | null;
  governanceHint?: "include" | "summary_only";
}

export interface PharmacyReferralSupportingArtifactInput {
  sourceArtifactRef: string;
  sourceHash: string;
  label: string;
  classification: string;
  mimeType: string;
  derivationRef?: string | null;
  visibilityPolicyRef?: string | null;
  minimumNecessaryContractRef?: string | null;
  governanceHint:
    | "include"
    | "exclude_by_policy"
    | "summary_only"
    | "redact"
    | "unavailable";
  redactionTransformRef?: string | null;
  unavailableReasonCode?: string | null;
}

export interface PharmacyReferralPackageContentInput {
  sourcePracticeRef: string;
  sourcePracticeSummary: string;
  requestLineageSummary: string;
  patientSummary: PharmacyReferralStructuredContentInput;
  clinicalSummary: PharmacyReferralStructuredContentInput;
  communicationPreferenceSummary: PharmacyReferralStructuredContentInput;
  supportingArtifacts: readonly PharmacyReferralSupportingArtifactInput[];
  redFlagCheckRefs: readonly string[];
  exclusionCheckRefs: readonly string[];
  visibilityPolicyRef?: string | null;
  minimumNecessaryContractRef?: string | null;
}

export interface PharmacyReferralPackageSnapshot {
  packageId: string;
  pharmacyCaseId: string;
  patientRef: AggregateRef<"Patient", Task342>;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  providerCapabilitySnapshotRef:
    AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>;
  pathwayRef: AggregateRef<"PathwayEligibilityEvaluation", Task342> | null;
  fhirRepresentationSetRef: string | null;
  serviceRequestArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  communicationArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  documentReferenceArtifactRefs:
    readonly AggregateRef<"PharmacyPackageArtifact", Task349>[];
  consentArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  provenanceArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  auditEventArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  patientSummaryRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  consentRef: AggregateRef<"PharmacyConsentRecord", Task343>;
  consentCheckpointRef: AggregateRef<"PharmacyConsentCheckpoint", Task343>;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  compiledPolicyBundleRef: string;
  selectionBindingHash: string;
  lineageRefs: readonly string[];
  clinicalSummaryRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  packageFingerprint: string;
  packageHash: string;
  packageState: PharmacyReferralPackageState;
  frozenAt: string | null;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  representationContractRef: string;
  visibilityPolicyRef: string;
  minimumNecessaryContractRef: string;
  sourcePracticeRef: string;
  sourcePracticeSummary: string;
  requestLineageSummary: string;
  supersededByPackageRef: AggregateRef<"PharmacyReferralPackage", Task349> | null;
  invalidationReasonCode: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PharmacyPackageArtifactSnapshot {
  packageArtifactId: string;
  packageRef: AggregateRef<"PharmacyReferralPackage", Task349>;
  artifactClass: PharmacyPackageArtifactClass;
  sourceArtifactRef: string | null;
  sourceHash: string | null;
  derivationRef: string | null;
  visibilityPolicyRef: string;
  minimumNecessaryContractRef: string;
  governanceDecisionRef: AggregateRef<
    "PharmacyPackageContentGovernanceDecision",
    Task349
  >;
  contentState: PharmacyPackageArtifactContentState;
  canonicalArtifactRef: string;
  canonicalHash: string;
  fhirResourceRecordRef: string | null;
  label: string;
  payload: Record<string, unknown>;
  createdAt: string;
  version: number;
}

export interface PharmacyPackageContentGovernanceDecisionSnapshot {
  packageContentGovernanceDecisionId: string;
  packageRef: AggregateRef<"PharmacyReferralPackage", Task349>;
  artifactClass: PharmacyPackageArtifactClass;
  candidateRef: string;
  sourceArtifactRef: string | null;
  sourceHash: string | null;
  derivationRef: string | null;
  visibilityPolicyRef: string;
  minimumNecessaryContractRef: string;
  decisionState: PharmacyPackageContentDecisionState;
  reasonCode: string;
  label: string;
  payload: Record<string, unknown>;
  resultingArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349> | null;
  absenceReasonCode: string | null;
  redactionTransformRef: string | null;
  recordedAt: string;
  version: number;
}

export interface PharmacyReferralPackageFreezeRecordSnapshot {
  packageFreezeRecordId: string;
  packageRef: AggregateRef<"PharmacyReferralPackage", Task349>;
  representationContractRef: string;
  fhirRepresentationSetRef: string;
  packageFingerprint: string;
  packageHash: string;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  compiledPolicyBundleRef: string;
  actorRef: string;
  recordedAt: string;
  version: number;
}

export interface PharmacyReferralPackageSupersessionRecordSnapshot {
  packageSupersessionRecordId: string;
  supersededPackageRef: AggregateRef<"PharmacyReferralPackage", Task349>;
  successorPackageRef: AggregateRef<"PharmacyReferralPackage", Task349>;
  reasonCode: string;
  recordedAt: string;
  version: number;
}

export interface PharmacyReferralPackageInvalidationRecordSnapshot {
  packageInvalidationRecordId: string;
  packageRef: AggregateRef<"PharmacyReferralPackage", Task349>;
  invalidationReasonCode: string;
  invalidatedByRef: string | null;
  invalidatedAt: string;
  representationInvalidated: boolean;
  version: number;
}

export interface PharmacyCorrelationRecordSnapshot {
  correlationId: string;
  pharmacyCaseId: string;
  packageId: string;
  dispatchAttemptId: string | null;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  patientRef: AggregateRef<"Patient", Task342>;
  serviceType: PharmacyServiceType;
  directorySnapshotRef: AggregateRef<"PharmacyDirectorySnapshot", Task343>;
  providerCapabilitySnapshotRef:
    AggregateRef<"PharmacyProviderCapabilitySnapshot", Task343>;
  dispatchPlanRef: string | null;
  transportMode: PharmacyTransportMode | null;
  transportAssuranceProfileRef: string | null;
  dispatchAdapterBindingRef: string | null;
  dispatchPlanHash: string | null;
  packageHash: string;
  outboundReferenceSet: readonly string[];
  outboundReferenceSetHash: string | null;
  transportAcceptanceState: "none" | "accepted" | "rejected" | "timed_out" | "disputed";
  providerAcceptanceState: "none" | "accepted" | "rejected" | "timed_out" | "disputed";
  authoritativeDispatchProofState: PharmacyCorrelationAuthoritativeDispatchProofState;
  currentProofEnvelopeRef: string | null;
  currentDispatchSettlementRef: string | null;
  acknowledgementState: PharmacyCorrelationAcknowledgementState;
  confidenceFloor: number;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PharmacyPackageTupleValidationResult {
  status: PharmacyPackageTupleValidationState;
  blockingReasonCodes: readonly string[];
  packageFingerprint: string | null;
  packageHash: string | null;
  routeIntentTupleHash: string;
  compiledPolicyBundleRef: string | null;
  currentPackageId: string | null;
}

export interface PharmacyReferralPackageBundle {
  package: PharmacyReferralPackageSnapshot;
  contentGovernanceDecisions:
    readonly PharmacyPackageContentGovernanceDecisionSnapshot[];
  artifacts: readonly PharmacyPackageArtifactSnapshot[];
  latestFreezeRecord: PharmacyReferralPackageFreezeRecordSnapshot | null;
  supersessionRecords: readonly PharmacyReferralPackageSupersessionRecordSnapshot[];
  invalidationRecords: readonly PharmacyReferralPackageInvalidationRecordSnapshot[];
  correlationRecord: PharmacyCorrelationRecordSnapshot | null;
  fhirRepresentationSet: FhirRepresentationSetSnapshot | null;
  fhirResourceRecords: readonly FhirResourceRecordSnapshot[];
}

export interface PharmacyReferralPackageFreezeResult {
  packageBundle: PharmacyReferralPackageBundle;
  caseMutation: PharmacyCaseMutationResult | null;
  tupleValidation: PharmacyPackageTupleValidationResult;
  representationMaterialization: {
    representationSetId: string;
    resourceRecordIds: readonly string[];
    exchangeBundleId: string | null;
    replayed: boolean;
  };
  correlationRecord: PharmacyCorrelationRecordSnapshot;
  replayed: boolean;
}

export interface PharmacyReferralPackageRepresentationReplayResult {
  packageBundle: PharmacyReferralPackageBundle;
  replayed: boolean;
  representationSetId: string;
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

interface CommandReplayRecord {
  replayKey: string;
  resultKind: "draft" | "freeze" | "supersede" | "invalidate";
  resultRefId: string;
  version: number;
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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily,
    refId: requireText(refId, "refId"),
    ownerTask,
  };
}

function buildPharmacyRouteIntentTupleHash(
  input: PharmacyReferralRouteIntentTupleInput,
): string {
  return stableReviewDigest({
    actionScope: requireText(input.actionScope, "actionScope"),
    actingContextRef: requireText(input.actingContextRef, "actingContextRef"),
    canonicalObjectDescriptorRef: requireText(
      input.canonicalObjectDescriptorRef,
      "canonicalObjectDescriptorRef",
    ),
    governingBoundedContextRef: requireText(
      input.governingBoundedContextRef,
      "governingBoundedContextRef",
    ),
    governingObjectRef: requireText(input.governingObjectRef, "governingObjectRef"),
    governingObjectVersionRef: requireText(
      input.governingObjectVersionRef,
      "governingObjectVersionRef",
    ),
    initiatingBoundedContextRef: requireText(
      input.initiatingBoundedContextRef,
      "initiatingBoundedContextRef",
    ),
    lineageScope: requireText(input.lineageScope, "lineageScope"),
    parentAnchorRef: requireText(input.parentAnchorRef, "parentAnchorRef"),
    requiredContextBoundaryRefs: uniqueSorted(input.requiredContextBoundaryRefs),
    routeContractDigestRef: requireText(input.routeContractDigestRef, "routeContractDigestRef"),
    routeIntentRef: requireText(input.routeIntentRef, "routeIntentRef"),
  });
}

function buildPackageTupleDigest(input: {
  pharmacyCaseId: string;
  providerRef: string;
  providerCapabilitySnapshotRef: string;
  pathwayRef: string | null;
  consentCheckpointRef: string;
  directorySnapshotRef: string;
  compiledPolicyBundleRef: string;
  selectionBindingHash: string;
  routeIntentTupleHash: string;
  contentDigest: string;
  lineageRefs: readonly string[];
}): string {
  return stableReviewDigest({
    pharmacyCaseId: requireText(input.pharmacyCaseId, "pharmacyCaseId"),
    providerRef: requireText(input.providerRef, "providerRef"),
    providerCapabilitySnapshotRef: requireText(
      input.providerCapabilitySnapshotRef,
      "providerCapabilitySnapshotRef",
    ),
    pathwayRef: optionalText(input.pathwayRef),
    consentCheckpointRef: requireText(input.consentCheckpointRef, "consentCheckpointRef"),
    directorySnapshotRef: requireText(input.directorySnapshotRef, "directorySnapshotRef"),
    compiledPolicyBundleRef: requireText(
      input.compiledPolicyBundleRef,
      "compiledPolicyBundleRef",
    ),
    selectionBindingHash: requireText(input.selectionBindingHash, "selectionBindingHash"),
    routeIntentTupleHash: requireText(input.routeIntentTupleHash, "routeIntentTupleHash"),
    contentDigest: requireText(input.contentDigest, "contentDigest"),
    lineageRefs: uniqueSorted(input.lineageRefs),
  });
}

function buildPackageRepresentationVersionRef(packageHash: string): string {
  return `pharmacy_referral_package::${requireText(packageHash, "packageHash")}`;
}

function clonePackageMaterializationContracts(): FhirRepresentationContractSnapshot[] {
  return fhirRepresentationContracts.map((contract) =>
    contract.fhirRepresentationContractId === PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID
      ? {
          ...contract,
          declaredBundlePolicyRefs: [],
        }
      : contract,
  );
}

function currentOrDefault(value: string | null | undefined, fallback: string): string {
  return optionalText(value) ?? fallback;
}

function decisionStateToContentState(
  state: PharmacyPackageContentDecisionState,
): PharmacyPackageArtifactContentState {
  switch (state) {
    case "included":
      return "full";
    case "included_summary_only":
      return "summary_only";
    case "included_redaction_required":
      return "redacted";
    case "excluded_by_policy":
    case "unavailable":
      invariant(false, "DECISION_STATE_HAS_NO_ARTIFACT", `${state} does not create an artifact.`);
  }
}

function normalizePackage(snapshot: PharmacyReferralPackageSnapshot): PharmacyReferralPackageSnapshot {
  return {
    ...snapshot,
    documentReferenceArtifactRefs: [...snapshot.documentReferenceArtifactRefs].sort((left, right) =>
      left.refId.localeCompare(right.refId),
    ),
    lineageRefs: uniqueSorted(snapshot.lineageRefs),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    frozenAt: snapshot.frozenAt ? ensureIsoTimestamp(snapshot.frozenAt, "frozenAt") : null,
    version: snapshot.version,
  };
}

function normalizeCorrelation(
  snapshot: PharmacyCorrelationRecordSnapshot,
): PharmacyCorrelationRecordSnapshot {
  return {
    ...snapshot,
    outboundReferenceSet: uniqueSorted(snapshot.outboundReferenceSet),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    version: snapshot.version,
  };
}

interface EvaluatedGovernanceDecisionInput {
  artifactClass: PharmacyPackageArtifactClass;
  candidateRef: string;
  sourceArtifactRef: string | null;
  sourceHash: string | null;
  derivationRef: string | null;
  visibilityPolicyRef: string;
  minimumNecessaryContractRef: string;
  decisionState: PharmacyPackageContentDecisionState;
  reasonCode: string;
  absenceReasonCode: string | null;
  redactionTransformRef: string | null;
  label: string;
  payload: Record<string, unknown>;
}

function buildSupportingDecisionState(
  input: PharmacyReferralSupportingArtifactInput,
): PharmacyPackageContentDecisionState {
  switch (input.governanceHint) {
    case "include":
      return "included";
    case "exclude_by_policy":
      return "excluded_by_policy";
    case "summary_only":
      return "included_summary_only";
    case "redact":
      return "included_redaction_required";
    case "unavailable":
      return "unavailable";
  }
}

function buildReasonCodeForSupportingInput(
  input: PharmacyReferralSupportingArtifactInput,
): string {
  switch (input.governanceHint) {
    case "include":
      return "INCLUDED_SUPPORTING_MATERIAL";
    case "exclude_by_policy":
      return "EXCLUDED_BY_POLICY";
    case "summary_only":
      return "INCLUDED_AS_SUMMARY_ONLY";
    case "redact":
      return "REDACTION_REQUIRED_AT_PACKAGE_BOUNDARY";
    case "unavailable":
      return "UNAVAILABLE_WITH_RECORDED_REASON";
  }
}

function buildDecisionDigest(decisions: readonly EvaluatedGovernanceDecisionInput[]): string {
  return stableReviewDigest(
    decisions
      .map((decision) => ({
        artifactClass: decision.artifactClass,
        candidateRef: decision.candidateRef,
        sourceArtifactRef: decision.sourceArtifactRef,
        sourceHash: decision.sourceHash,
        derivationRef: decision.derivationRef,
        visibilityPolicyRef: decision.visibilityPolicyRef,
        minimumNecessaryContractRef: decision.minimumNecessaryContractRef,
        decisionState: decision.decisionState,
        reasonCode: decision.reasonCode,
        absenceReasonCode: decision.absenceReasonCode,
        redactionTransformRef: decision.redactionTransformRef,
        payload: decision.payload,
      }))
      .sort((left, right) => left.candidateRef.localeCompare(right.candidateRef)),
  );
}

function findMaterializedResourceRef(
  materialization: FhirMaterializationResult,
  resourceType: string,
): string | null {
  const record = materialization.resourceRecords.find(
    (candidate) => candidate.toSnapshot().resourceType === resourceType,
  );
  return record?.fhirResourceRecordId ?? null;
}

function buildPackageRepresentationPayload(input: {
  pharmacyCase: PharmacyCaseSnapshot;
  provider: PharmacyProvider;
  choiceProof: PharmacyChoiceProof;
  explanation: PharmacyChoiceExplanation;
  consentRecord: PharmacyConsentRecord;
  consentCheckpoint: PharmacyConsentCheckpoint;
  packageFingerprint: string;
  packageHash: string;
  compiledPolicyBundleRef: string;
  routeIntentBindingRef: string;
  routeIntentTupleHash: string;
  contentInput: PharmacyReferralPackageContentInput;
  decisions: readonly EvaluatedGovernanceDecisionInput[];
}): Record<string, unknown> {
  return {
    pharmacyCaseId: input.pharmacyCase.pharmacyCaseId,
    packageFingerprint: input.packageFingerprint,
    packageHash: input.packageHash,
    serviceType: input.pharmacyCase.serviceType,
    pathwayCode: input.pharmacyCase.candidatePathway,
    selectedProviderRef: input.provider.providerId,
    selectedProviderExplanationRef: input.explanation.pharmacyChoiceExplanationId,
    choiceProofRef: input.choiceProof.pharmacyChoiceProofId,
    consentRecordRef: input.consentRecord.pharmacyConsentRecordId,
    consentCheckpointRef: input.consentCheckpoint.pharmacyConsentCheckpointId,
    referralScope: input.consentRecord.referralScope,
    selectionBindingHash: input.consentCheckpoint.selectionBindingHash,
    compiledPolicyBundleRef: input.compiledPolicyBundleRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    routeIntentTupleHash: input.routeIntentTupleHash,
    sourcePracticeRef: input.contentInput.sourcePracticeRef,
    sourcePracticeSummary: input.contentInput.sourcePracticeSummary,
    requestLineageSummary: input.contentInput.requestLineageSummary,
    patientSummary: {
      label: input.contentInput.patientSummary.label,
      summaryText: input.contentInput.patientSummary.summaryText,
      sourceArtifactRef: input.contentInput.patientSummary.sourceArtifactRef,
    },
    clinicalSummary: {
      label: input.contentInput.clinicalSummary.label,
      summaryText: input.contentInput.clinicalSummary.summaryText,
      sourceArtifactRef: input.contentInput.clinicalSummary.sourceArtifactRef,
    },
    communicationPreferenceSummary: {
      label: input.contentInput.communicationPreferenceSummary.label,
      summaryText: input.contentInput.communicationPreferenceSummary.summaryText,
      sourceArtifactRef: input.contentInput.communicationPreferenceSummary.sourceArtifactRef,
    },
    redFlagCheckRefs: uniqueSorted(input.contentInput.redFlagCheckRefs),
    exclusionCheckRefs: uniqueSorted(input.contentInput.exclusionCheckRefs),
    supportingArtifacts: input.contentInput.supportingArtifacts
      .map((artifact) => ({
        sourceArtifactRef: artifact.sourceArtifactRef,
        sourceHash: artifact.sourceHash,
        label: artifact.label,
        classification: artifact.classification,
        governanceHint: artifact.governanceHint,
      }))
      .sort((left, right) => left.sourceArtifactRef.localeCompare(right.sourceArtifactRef)),
    governanceDecisions: input.decisions
      .map((decision) => ({
        artifactClass: decision.artifactClass,
        candidateRef: decision.candidateRef,
        decisionState: decision.decisionState,
        reasonCode: decision.reasonCode,
      }))
      .sort((left, right) => left.candidateRef.localeCompare(right.candidateRef)),
  };
}

async function requireCurrentChoiceTuple(
  directoryRepositories: Phase6PharmacyDirectoryChoiceStore,
  pharmacyCaseId: string,
): Promise<{
  choiceSession: PharmacyChoiceSession;
  choiceProof: PharmacyChoiceProof;
  explanation: PharmacyChoiceExplanation;
  provider: PharmacyProvider;
  providerCapabilitySnapshot: PharmacyProviderCapabilitySnapshot;
  directorySnapshot: PharmacyDirectorySnapshot;
  consentRecord: PharmacyConsentRecord;
  consentCheckpoint: PharmacyConsentCheckpoint;
}> {
  const choiceSessionDocument = await directoryRepositories.getLatestChoiceSessionForCase(
    pharmacyCaseId,
  );
  invariant(choiceSessionDocument, "CHOICE_SESSION_NOT_FOUND", "A PharmacyChoiceSession is required.");
  const choiceSession = choiceSessionDocument.toSnapshot();
  invariant(
    choiceSession.selectedProviderRef !== null &&
      choiceSession.selectedProviderExplanationRef !== null &&
      choiceSession.selectedProviderCapabilitySnapshotRef !== null &&
      choiceSession.selectionBindingHash !== null,
    "PROVIDER_SELECTION_NOT_FINALIZED",
    "A finalized provider selection is required before package composition.",
  );

  const choiceProofDocument = await directoryRepositories.getChoiceProof(
    choiceSession.choiceProofRef.refId,
  );
  invariant(choiceProofDocument, "CHOICE_PROOF_NOT_FOUND", "PharmacyChoiceProof was not found.");
  const choiceProof = choiceProofDocument.toSnapshot();

  const explanationDocument = await directoryRepositories.getChoiceExplanation(
    choiceSession.selectedProviderExplanationRef.refId,
  );
  invariant(explanationDocument, "CHOICE_EXPLANATION_NOT_FOUND", "PharmacyChoiceExplanation was not found.");
  const explanation = explanationDocument.toSnapshot();

  const providerDocument = await directoryRepositories.getProvider(
    choiceSession.selectedProviderRef.refId,
  );
  invariant(providerDocument, "PROVIDER_NOT_FOUND", "Selected PharmacyProvider was not found.");
  const provider = providerDocument.toSnapshot();

  const capabilityDocument = await directoryRepositories.getProviderCapabilitySnapshot(
    choiceSession.selectedProviderCapabilitySnapshotRef.refId,
  );
  invariant(
    capabilityDocument,
    "PROVIDER_CAPABILITY_SNAPSHOT_NOT_FOUND",
    "Selected PharmacyProviderCapabilitySnapshot was not found.",
  );
  const providerCapabilitySnapshot = capabilityDocument.toSnapshot();

  const directorySnapshotDocument = await directoryRepositories.getDirectorySnapshot(
    choiceSession.directorySnapshotRef.refId,
  );
  invariant(
    directorySnapshotDocument,
    "DIRECTORY_SNAPSHOT_NOT_FOUND",
    "PharmacyDirectorySnapshot was not found.",
  );
  const directorySnapshot = directorySnapshotDocument.toSnapshot();

  const consentRecordDocument = await directoryRepositories.getLatestConsentRecordForCase(
    pharmacyCaseId,
  );
  invariant(consentRecordDocument, "CONSENT_RECORD_NOT_FOUND", "PharmacyConsentRecord was not found.");
  const consentRecord = consentRecordDocument.toSnapshot();

  const consentCheckpointDocument =
    await directoryRepositories.getLatestConsentCheckpointForCase(pharmacyCaseId);
  invariant(
    consentCheckpointDocument,
    "CONSENT_CHECKPOINT_NOT_FOUND",
    "PharmacyConsentCheckpoint was not found.",
  );
  const consentCheckpoint = consentCheckpointDocument.toSnapshot();

  return {
    choiceSession,
    choiceProof,
    explanation,
    provider,
    providerCapabilitySnapshot,
    directorySnapshot,
    consentRecord,
    consentCheckpoint,
  };
}

function buildGovernanceDecisions(input: {
  contentInput: PharmacyReferralPackageContentInput;
}): {
  decisions: readonly EvaluatedGovernanceDecisionInput[];
  blockingReasonCodes: readonly string[];
  contentDigest: string;
} {
  const visibilityPolicyRef = currentOrDefault(
    input.contentInput.visibilityPolicyRef,
    DEFAULT_VISIBILITY_POLICY_REF,
  );
  const minimumNecessaryContractRef = currentOrDefault(
    input.contentInput.minimumNecessaryContractRef,
    DEFAULT_MINIMUM_NECESSARY_CONTRACT_REF,
  );

  const blockingReasonCodes: string[] = [];
  const decisions: EvaluatedGovernanceDecisionInput[] = [];

  const requiredStructuredLanes: ReadonlyArray<{
    artifactClass: PharmacyPackageArtifactClass;
    candidateRef: string;
    input: PharmacyReferralStructuredContentInput;
    decisionState: PharmacyPackageContentDecisionState;
    reasonCode: string;
  }> = [
    {
      artifactClass: "patient_summary" as const,
      candidateRef: "patient_summary",
      input: input.contentInput.patientSummary,
      decisionState:
        input.contentInput.patientSummary.governanceHint === "summary_only"
          ? "included_summary_only"
          : "included",
      reasonCode:
        input.contentInput.patientSummary.governanceHint === "summary_only"
          ? "MINIMUM_NECESSARY_PATIENT_SUMMARY"
          : "INCLUDED_PATIENT_SUMMARY",
    },
    {
      artifactClass: "clinical_summary" as const,
      candidateRef: "clinical_summary",
      input: input.contentInput.clinicalSummary,
      decisionState:
        input.contentInput.clinicalSummary.governanceHint === "summary_only"
          ? "included_summary_only"
          : "included",
      reasonCode:
        input.contentInput.clinicalSummary.governanceHint === "summary_only"
          ? "SUMMARY_ONLY_CLINICAL_LANE"
          : "INCLUDED_CLINICAL_SUMMARY",
    },
    {
      artifactClass: "communication" as const,
      candidateRef: "communication_preference_summary",
      input: input.contentInput.communicationPreferenceSummary,
      decisionState: "included_summary_only",
      reasonCode: "COMMUNICATION_PREFERENCE_SUMMARY_ONLY",
    },
  ];

  for (const lane of requiredStructuredLanes) {
    if (optionalText(lane.input.summaryText) === null) {
      blockingReasonCodes.push(`MISSING_${lane.candidateRef.toUpperCase()}_TEXT`);
      continue;
    }
    decisions.push({
      artifactClass: lane.artifactClass,
      candidateRef: lane.candidateRef,
      sourceArtifactRef: requireText(lane.input.sourceArtifactRef, `${lane.candidateRef}.sourceArtifactRef`),
      sourceHash: requireText(lane.input.sourceHash, `${lane.candidateRef}.sourceHash`),
      derivationRef: optionalText(lane.input.derivationRef),
      visibilityPolicyRef: currentOrDefault(lane.input.visibilityPolicyRef, visibilityPolicyRef),
      minimumNecessaryContractRef: currentOrDefault(
        lane.input.minimumNecessaryContractRef,
        minimumNecessaryContractRef,
      ),
      decisionState: lane.decisionState,
      reasonCode: lane.reasonCode,
      absenceReasonCode: null,
      redactionTransformRef: null,
      label: lane.input.label,
      payload: {
        label: lane.input.label,
        summaryText: lane.input.summaryText,
      },
    });
  }

  decisions.push(
    {
      artifactClass: "service_request",
      candidateRef: "service_request_core",
      sourceArtifactRef: null,
      sourceHash: null,
      derivationRef: "derived_from_package_tuple",
      visibilityPolicyRef,
      minimumNecessaryContractRef,
      decisionState: "included",
      reasonCode: "CORE_SERVICE_REQUEST_REQUIRED",
      absenceReasonCode: null,
      redactionTransformRef: null,
      label: "Service request",
      payload: { role: "primary_referral_request" },
    },
    {
      artifactClass: "consent",
      candidateRef: "consent_record",
      sourceArtifactRef: null,
      sourceHash: null,
      derivationRef: "derived_from_consent_checkpoint",
      visibilityPolicyRef,
      minimumNecessaryContractRef,
      decisionState: "included",
      reasonCode: "CONSENT_REQUIRED_FOR_REFERRAL",
      absenceReasonCode: null,
      redactionTransformRef: null,
      label: "Consent",
      payload: { role: "consent_checkpoint" },
    },
    {
      artifactClass: "provenance",
      candidateRef: "package_provenance",
      sourceArtifactRef: null,
      sourceHash: null,
      derivationRef: "derived_from_package_freeze",
      visibilityPolicyRef,
      minimumNecessaryContractRef,
      decisionState: "included",
      reasonCode: "PROVENANCE_REQUIRED_FOR_REPLAY",
      absenceReasonCode: null,
      redactionTransformRef: null,
      label: "Provenance",
      payload: { role: "package_provenance" },
    },
    {
      artifactClass: "audit_event",
      candidateRef: "package_audit_event",
      sourceArtifactRef: null,
      sourceHash: null,
      derivationRef: "derived_from_package_freeze",
      visibilityPolicyRef,
      minimumNecessaryContractRef,
      decisionState: "included",
      reasonCode: "AUDIT_EVENT_REQUIRED_FOR_REPLAY",
      absenceReasonCode: null,
      redactionTransformRef: null,
      label: "Audit event",
      payload: { role: "package_audit_event" },
    },
  );

  const sortedSupportingArtifacts = [...input.contentInput.supportingArtifacts].sort((left, right) =>
    left.sourceArtifactRef.localeCompare(right.sourceArtifactRef),
  );

  let includedDocumentCount = 0;
  for (const artifact of sortedSupportingArtifacts) {
    const decisionState = buildSupportingDecisionState(artifact);
    if (decisionState === "included_redaction_required" && optionalText(artifact.redactionTransformRef) === null) {
      blockingReasonCodes.push(`MISSING_REDACTION_TRANSFORM_${artifact.sourceArtifactRef}`);
      continue;
    }
    if (decisionState === "unavailable" && optionalText(artifact.unavailableReasonCode) === null) {
      blockingReasonCodes.push(`MISSING_UNAVAILABLE_REASON_${artifact.sourceArtifactRef}`);
      continue;
    }
    if (decisionState === "included" || decisionState === "included_redaction_required" || decisionState === "included_summary_only") {
      includedDocumentCount += 1;
    }
    decisions.push({
      artifactClass: "document_reference",
      candidateRef: artifact.sourceArtifactRef,
      sourceArtifactRef: requireText(artifact.sourceArtifactRef, "supportingArtifact.sourceArtifactRef"),
      sourceHash: requireText(artifact.sourceHash, "supportingArtifact.sourceHash"),
      derivationRef: optionalText(artifact.derivationRef),
      visibilityPolicyRef: currentOrDefault(artifact.visibilityPolicyRef, visibilityPolicyRef),
      minimumNecessaryContractRef: currentOrDefault(
        artifact.minimumNecessaryContractRef,
        minimumNecessaryContractRef,
      ),
      decisionState,
      reasonCode: buildReasonCodeForSupportingInput(artifact),
      absenceReasonCode: optionalText(artifact.unavailableReasonCode),
      redactionTransformRef: optionalText(artifact.redactionTransformRef),
      label: artifact.label,
      payload: {
        label: artifact.label,
        classification: artifact.classification,
        mimeType: artifact.mimeType,
        governanceHint: artifact.governanceHint,
      },
    });
  }

  if (includedDocumentCount === 0) {
    decisions.push({
      artifactClass: "document_reference",
      candidateRef: "no_supporting_documents",
      sourceArtifactRef: null,
      sourceHash: null,
      derivationRef: null,
      visibilityPolicyRef,
      minimumNecessaryContractRef,
      decisionState: "unavailable",
      reasonCode: "NO_SUPPORTING_DOCUMENTS_AVAILABLE",
      absenceReasonCode: "NO_SUPPORTING_DOCUMENTS_AVAILABLE",
      redactionTransformRef: null,
      label: "Supporting documents unavailable",
      payload: {
        note: "No additional supporting documents were available at package freeze.",
      },
    });
  }

  return {
    decisions,
    blockingReasonCodes: uniqueSorted(blockingReasonCodes),
    contentDigest: buildDecisionDigest(decisions),
  };
}

export interface Phase6PharmacyReferralPackageRepositories extends FhirCompilerDependencies {
  getPackage(
    packageId: string,
  ): Promise<SnapshotDocument<PharmacyReferralPackageSnapshot> | null>;
  getLatestPackageForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyReferralPackageSnapshot> | null>;
  getCurrentFrozenPackageForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyReferralPackageSnapshot> | null>;
  listPackagesForCase(
    pharmacyCaseId: string,
  ): Promise<readonly SnapshotDocument<PharmacyReferralPackageSnapshot>[]>;
  savePackage(
    snapshot: PharmacyReferralPackageSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPackageArtifact(
    packageArtifactId: string,
  ): Promise<SnapshotDocument<PharmacyPackageArtifactSnapshot> | null>;
  listPackageArtifacts(
    packageId: string,
  ): Promise<readonly SnapshotDocument<PharmacyPackageArtifactSnapshot>[]>;
  savePackageArtifact(
    snapshot: PharmacyPackageArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getGovernanceDecision(
    governanceDecisionId: string,
  ): Promise<SnapshotDocument<PharmacyPackageContentGovernanceDecisionSnapshot> | null>;
  listGovernanceDecisions(
    packageId: string,
  ): Promise<
    readonly SnapshotDocument<PharmacyPackageContentGovernanceDecisionSnapshot>[]
  >;
  saveGovernanceDecision(
    snapshot: PharmacyPackageContentGovernanceDecisionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestFreezeRecord(
    packageId: string,
  ): Promise<SnapshotDocument<PharmacyReferralPackageFreezeRecordSnapshot> | null>;
  saveFreezeRecord(
    snapshot: PharmacyReferralPackageFreezeRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSupersessionRecords(
    packageId: string,
  ): Promise<
    readonly SnapshotDocument<PharmacyReferralPackageSupersessionRecordSnapshot>[]
  >;
  saveSupersessionRecord(
    snapshot: PharmacyReferralPackageSupersessionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listInvalidationRecords(
    packageId: string,
  ): Promise<
    readonly SnapshotDocument<PharmacyReferralPackageInvalidationRecordSnapshot>[]
  >;
  saveInvalidationRecord(
    snapshot: PharmacyReferralPackageInvalidationRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCorrelationRecord(
    correlationId: string,
  ): Promise<SnapshotDocument<PharmacyCorrelationRecordSnapshot> | null>;
  listCorrelationRecords(): Promise<readonly SnapshotDocument<PharmacyCorrelationRecordSnapshot>[]>;
  getCurrentCorrelationRecordForCase(
    pharmacyCaseId: string,
  ): Promise<SnapshotDocument<PharmacyCorrelationRecordSnapshot> | null>;
  saveCorrelationRecord(
    snapshot: PharmacyCorrelationRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCommandReplay(replayKey: string): Promise<SnapshotDocument<CommandReplayRecord> | null>;
  saveCommandReplay(
    replay: CommandReplayRecord,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface Phase6PharmacyReferralPackageStore
  extends Phase6PharmacyReferralPackageRepositories {}

export function createPhase6PharmacyReferralPackageStore(): Phase6PharmacyReferralPackageStore {
  const packages = new Map<string, PharmacyReferralPackageSnapshot>();
  const latestPackageByCase = new Map<string, string>();
  const currentFrozenPackageByCase = new Map<string, string>();
  const packageIdsByCase = new Map<string, string[]>();
  const artifacts = new Map<string, PharmacyPackageArtifactSnapshot>();
  const artifactIdsByPackage = new Map<string, string[]>();
  const governanceDecisions = new Map<
    string,
    PharmacyPackageContentGovernanceDecisionSnapshot
  >();
  const governanceIdsByPackage = new Map<string, string[]>();
  const freezeRecords = new Map<string, PharmacyReferralPackageFreezeRecordSnapshot>();
  const freezeRecordByPackage = new Map<string, string>();
  const supersessionRecords = new Map<
    string,
    PharmacyReferralPackageSupersessionRecordSnapshot
  >();
  const supersessionIdsByPackage = new Map<string, string[]>();
  const invalidationRecords = new Map<
    string,
    PharmacyReferralPackageInvalidationRecordSnapshot
  >();
  const invalidationIdsByPackage = new Map<string, string[]>();
  const correlationRecords = new Map<string, PharmacyCorrelationRecordSnapshot>();
  const currentCorrelationByCase = new Map<string, string>();
  const commandReplays = new Map<string, CommandReplayRecord>();
  const fhirStore = createFhirRepresentationStore({
    contracts: clonePackageMaterializationContracts(),
    bundlePolicies: fhirExchangeBundlePolicies,
    identifierPolicies: fhirIdentifierPolicies,
    statusPolicies: fhirStatusMappingPolicies,
  });

  function appendIndex(map: Map<string, string[]>, key: string, value: string) {
    const current = map.get(key) ?? [];
    if (!current.includes(value)) {
      map.set(key, [...current, value]);
    }
  }

  return {
    async getPackage(packageId) {
      const snapshot = packages.get(packageId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getLatestPackageForCase(pharmacyCaseId) {
      const packageId = latestPackageByCase.get(pharmacyCaseId);
      return packageId === undefined ? null : new StoredDocument(packages.get(packageId)!);
    },

    async getCurrentFrozenPackageForCase(pharmacyCaseId) {
      const packageId = currentFrozenPackageByCase.get(pharmacyCaseId);
      return packageId === undefined ? null : new StoredDocument(packages.get(packageId)!);
    },

    async listPackagesForCase(pharmacyCaseId) {
      return (packageIdsByCase.get(pharmacyCaseId) ?? [])
        .map((packageId) => packages.get(packageId)!)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async savePackage(snapshot, options) {
      const normalized = normalizePackage(snapshot);
      saveWithCas(packages, normalized.packageId, normalized, options);
      latestPackageByCase.set(normalized.pharmacyCaseId, normalized.packageId);
      appendIndex(packageIdsByCase, normalized.pharmacyCaseId, normalized.packageId);
      if (normalized.packageState === "frozen") {
        currentFrozenPackageByCase.set(normalized.pharmacyCaseId, normalized.packageId);
      } else if (
        currentFrozenPackageByCase.get(normalized.pharmacyCaseId) === normalized.packageId
      ) {
        currentFrozenPackageByCase.delete(normalized.pharmacyCaseId);
      }
    },

    async getPackageArtifact(packageArtifactId) {
      const snapshot = artifacts.get(packageArtifactId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listPackageArtifacts(packageId) {
      return (artifactIdsByPackage.get(packageId) ?? [])
        .map((artifactId) => artifacts.get(artifactId)!)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async savePackageArtifact(snapshot, options) {
      saveWithCas(artifacts, snapshot.packageArtifactId, structuredClone(snapshot), options);
      appendIndex(artifactIdsByPackage, snapshot.packageRef.refId, snapshot.packageArtifactId);
    },

    async getGovernanceDecision(governanceDecisionId) {
      const snapshot = governanceDecisions.get(governanceDecisionId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listGovernanceDecisions(packageId) {
      return (governanceIdsByPackage.get(packageId) ?? [])
        .map((decisionId) => governanceDecisions.get(decisionId)!)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveGovernanceDecision(snapshot, options) {
      saveWithCas(
        governanceDecisions,
        snapshot.packageContentGovernanceDecisionId,
        structuredClone(snapshot),
        options,
      );
      appendIndex(
        governanceIdsByPackage,
        snapshot.packageRef.refId,
        snapshot.packageContentGovernanceDecisionId,
      );
    },

    async getLatestFreezeRecord(packageId) {
      const freezeRecordId = freezeRecordByPackage.get(packageId);
      return freezeRecordId === undefined
        ? null
        : new StoredDocument(freezeRecords.get(freezeRecordId)!);
    },

    async saveFreezeRecord(snapshot, options) {
      saveWithCas(
        freezeRecords,
        snapshot.packageFreezeRecordId,
        structuredClone(snapshot),
        options,
      );
      freezeRecordByPackage.set(snapshot.packageRef.refId, snapshot.packageFreezeRecordId);
    },

    async listSupersessionRecords(packageId) {
      return (supersessionIdsByPackage.get(packageId) ?? [])
        .map((recordId) => supersessionRecords.get(recordId)!)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveSupersessionRecord(snapshot, options) {
      saveWithCas(
        supersessionRecords,
        snapshot.packageSupersessionRecordId,
        structuredClone(snapshot),
        options,
      );
      appendIndex(
        supersessionIdsByPackage,
        snapshot.supersededPackageRef.refId,
        snapshot.packageSupersessionRecordId,
      );
      appendIndex(
        supersessionIdsByPackage,
        snapshot.successorPackageRef.refId,
        snapshot.packageSupersessionRecordId,
      );
    },

    async listInvalidationRecords(packageId) {
      return (invalidationIdsByPackage.get(packageId) ?? [])
        .map((recordId) => invalidationRecords.get(recordId)!)
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async saveInvalidationRecord(snapshot, options) {
      saveWithCas(
        invalidationRecords,
        snapshot.packageInvalidationRecordId,
        structuredClone(snapshot),
        options,
      );
      appendIndex(
        invalidationIdsByPackage,
        snapshot.packageRef.refId,
        snapshot.packageInvalidationRecordId,
      );
    },

    async getCorrelationRecord(correlationId) {
      const snapshot = correlationRecords.get(correlationId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listCorrelationRecords() {
      return [...correlationRecords.values()]
        .sort((left, right) => compareIso(left.updatedAt, right.updatedAt))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async getCurrentCorrelationRecordForCase(pharmacyCaseId) {
      const correlationId = currentCorrelationByCase.get(pharmacyCaseId);
      return correlationId === undefined
        ? null
        : new StoredDocument(correlationRecords.get(correlationId)!);
    },

    async saveCorrelationRecord(snapshot, options) {
      const normalized = normalizeCorrelation(snapshot);
      saveWithCas(correlationRecords, normalized.correlationId, normalized, options);
      currentCorrelationByCase.set(normalized.pharmacyCaseId, normalized.correlationId);
    },

    async getCommandReplay(replayKey) {
      const replay = commandReplays.get(replayKey);
      return replay ? new StoredDocument(replay) : null;
    },

    async saveCommandReplay(replay, options) {
      saveWithCas(commandReplays, replay.replayKey, structuredClone(replay), options);
    },

    getRepresentationContract: (contractId) => fhirStore.getRepresentationContract(contractId),
    getBundlePolicy: (policyId) => fhirStore.getBundlePolicy(policyId),
    getIdentifierPolicy: (policyId) => fhirStore.getIdentifierPolicy(policyId),
    getStatusMappingPolicy: (policyId) => fhirStore.getStatusMappingPolicy(policyId),
    getRepresentationSet: (representationSetId) =>
      fhirStore.getRepresentationSet(representationSetId),
    saveRepresentationSet: (record) => fhirStore.saveRepresentationSet(record),
    saveResourceRecord: (record) => fhirStore.saveResourceRecord(record),
    saveExchangeBundle: (record) => fhirStore.saveExchangeBundle(record),
    getRepresentationSetByDeterministicKey: (replayKey) =>
      fhirStore.getRepresentationSetByDeterministicKey(replayKey),
    getCurrentRepresentationSetForContractAggregate: (contractRef, aggregateRef) =>
      fhirStore.getCurrentRepresentationSetForContractAggregate(contractRef, aggregateRef),
    listCurrentResourceRecordsForSet: (representationSetRef) =>
      fhirStore.listCurrentResourceRecordsForSet(representationSetRef),
    getCurrentExchangeBundleForSet: (representationSetRef) =>
      fhirStore.getCurrentExchangeBundleForSet(representationSetRef),
    setReplayKey: (replayKey, representationSetId) =>
      fhirStore.setReplayKey(replayKey, representationSetId),
    setCurrentRepresentationSetIndex: (contractRef, aggregateRef, representationSetId) =>
      fhirStore.setCurrentRepresentationSetIndex(contractRef, aggregateRef, representationSetId),
  };
}

export interface PharmacyValidateReferralPackageInput {
  pharmacyCaseId: string;
  compiledPolicyBundleRef: string;
  expectedSelectionBindingHash: string;
  routeIntentBindingRef: string;
  routeIntentTuple: PharmacyReferralRouteIntentTupleInput;
  contentInput: PharmacyReferralPackageContentInput;
  expectedChoiceProofRef?: string | null;
  expectedSelectedExplanationRef?: string | null;
  expectedDirectorySnapshotRef?: string | null;
  expectedConsentCheckpointRef?: string | null;
}

export interface PharmacyComposeReferralPackageDraftInput
  extends PharmacyValidateReferralPackageInput {
  recordedAt: string;
}

export interface PharmacyFreezeReferralPackageInput
  extends PharmacyValidateReferralPackageInput {
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  expectedOwnershipEpoch: number;
  expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
  scopedMutationGateRef: string;
  reasonCode: string;
  draftPackageId?: string | null;
  idempotencyKey?: string | null;
}

export interface PharmacySupersedeReferralPackageInput {
  packageId: string;
  successorPackageId: string;
  reasonCode: string;
  recordedAt: string;
}

export interface PharmacyInvalidateReferralPackageInput {
  packageId: string;
  reasonCode: string;
  invalidatedByRef?: string | null;
  invalidatedAt: string;
}

export interface Phase6PharmacyReferralPackageService {
  readonly repositories: Phase6PharmacyReferralPackageStore;
  readonly caseKernelService: Phase6PharmacyCaseKernelService;
  readonly directoryRepositories: Phase6PharmacyDirectoryChoiceStore;
  readonly representationCompiler: FhirRepresentationCompiler;
  validatePackageTuple(
    input: PharmacyValidateReferralPackageInput,
  ): Promise<PharmacyPackageTupleValidationResult>;
  composeDraftPackage(
    input: PharmacyComposeReferralPackageDraftInput,
  ): Promise<PharmacyReferralPackageBundle>;
  freezePackage(
    input: PharmacyFreezeReferralPackageInput,
  ): Promise<PharmacyReferralPackageFreezeResult>;
  supersedePackage(
    input: PharmacySupersedeReferralPackageInput,
  ): Promise<PharmacyReferralPackageBundle>;
  invalidatePackage(
    input: PharmacyInvalidateReferralPackageInput,
  ): Promise<PharmacyReferralPackageBundle>;
  getPackageById(packageId: string): Promise<PharmacyReferralPackageBundle | null>;
  getCurrentPackageForCase(
    pharmacyCaseId: string,
  ): Promise<PharmacyReferralPackageBundle | null>;
  replayCanonicalRepresentationGeneration(
    input: { packageId: string; generatedAt: string },
  ): Promise<PharmacyReferralPackageRepresentationReplayResult>;
}

interface ResolvedPackageContext {
  pharmacyCase: PharmacyCaseSnapshot;
  choiceSession: PharmacyChoiceSession;
  choiceProof: PharmacyChoiceProof;
  explanation: PharmacyChoiceExplanation;
  provider: PharmacyProvider;
  providerCapabilitySnapshot: PharmacyProviderCapabilitySnapshot;
  directorySnapshot: PharmacyDirectorySnapshot;
  consentRecord: PharmacyConsentRecord;
  consentCheckpoint: PharmacyConsentCheckpoint;
  contentInput: PharmacyReferralPackageContentInput;
  routeIntentTupleHash: string;
  compiledPolicyBundleRef: string;
  lineageRefs: readonly string[];
  decisions: readonly EvaluatedGovernanceDecisionInput[];
  contentDigest: string;
  validation: PharmacyPackageTupleValidationResult;
  packageFingerprint: string;
  packageHash: string;
}

export function createPhase6PharmacyReferralPackageService(input?: {
  repositories?: Phase6PharmacyReferralPackageStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  directoryRepositories?: Phase6PharmacyDirectoryChoiceStore;
  idGenerator?: BackboneIdGenerator;
}): Phase6PharmacyReferralPackageService {
  const repositories = input?.repositories ?? createPhase6PharmacyReferralPackageStore();
  const caseKernelService =
    input?.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const directoryRepositories =
    input?.directoryRepositories ?? createPhase6PharmacyDirectoryChoiceStore();
  const idGenerator =
    input?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase6-pharmacy-referral-package");
  const representationCompiler = createFhirRepresentationCompiler(repositories);

  function nextId(kind: string): string {
    return (idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  async function loadBundle(packageId: string): Promise<PharmacyReferralPackageBundle | null> {
    const packageDocument = await repositories.getPackage(packageId);
    if (!packageDocument) {
      return null;
    }
    const snapshot = packageDocument.toSnapshot();
    const decisions = (await repositories.listGovernanceDecisions(packageId)).map((entry) =>
      entry.toSnapshot(),
    );
    const artifacts = (await repositories.listPackageArtifacts(packageId)).map((entry) =>
      entry.toSnapshot(),
    );
    const latestFreezeRecord = (await repositories.getLatestFreezeRecord(packageId))?.toSnapshot() ?? null;
    const supersessionRecords = (
      await repositories.listSupersessionRecords(packageId)
    ).map((entry) => entry.toSnapshot());
    const invalidationRecords = (
      await repositories.listInvalidationRecords(packageId)
    ).map((entry) => entry.toSnapshot());
    const correlationRecordDocument = await repositories.getCurrentCorrelationRecordForCase(
      snapshot.pharmacyCaseId,
    );
    const correlationRecord =
      correlationRecordDocument?.toSnapshot().packageId === snapshot.packageId
        ? correlationRecordDocument.toSnapshot()
        : null;
    const representationSet =
      snapshot.fhirRepresentationSetRef === null
        ? null
        : (await repositories.getRepresentationSet(snapshot.fhirRepresentationSetRef))?.toSnapshot() ?? null;
    const fhirResourceRecords =
      snapshot.fhirRepresentationSetRef === null
        ? []
        : (
            await repositories.listCurrentResourceRecordsForSet(snapshot.fhirRepresentationSetRef)
          ).map((record) => record.toSnapshot());
    return {
      package: snapshot,
      contentGovernanceDecisions: decisions,
      artifacts,
      latestFreezeRecord,
      supersessionRecords,
      invalidationRecords,
      correlationRecord,
      fhirRepresentationSet: representationSet,
      fhirResourceRecords,
    };
  }

  async function resolveContext(
    validationInput: PharmacyValidateReferralPackageInput,
  ): Promise<ResolvedPackageContext> {
    const pharmacyCaseBundle = await caseKernelService.getPharmacyCase(
      validationInput.pharmacyCaseId,
    );
    invariant(pharmacyCaseBundle, "PHARMACY_CASE_NOT_FOUND", "PharmacyCase was not found.");
    const pharmacyCase = pharmacyCaseBundle.pharmacyCase;

    const {
      choiceSession,
      choiceProof,
      explanation,
      provider,
      providerCapabilitySnapshot,
      directorySnapshot,
      consentRecord,
      consentCheckpoint,
    } = await requireCurrentChoiceTuple(directoryRepositories, validationInput.pharmacyCaseId);

    const routeIntentTupleHash = buildPharmacyRouteIntentTupleHash(
      validationInput.routeIntentTuple,
    );
    const contentEvaluation = buildGovernanceDecisions({
      contentInput: validationInput.contentInput,
    });
    const blockingReasonCodes = [...contentEvaluation.blockingReasonCodes];

    if (choiceSession.selectionBindingHash !== validationInput.expectedSelectionBindingHash) {
      blockingReasonCodes.push("SELECTION_BINDING_HASH_MISMATCH");
    }
    if (consentCheckpoint.selectionBindingHash !== validationInput.expectedSelectionBindingHash) {
      blockingReasonCodes.push("CONSENT_CHECKPOINT_SELECTION_BINDING_MISMATCH");
    }
    if (consentCheckpoint.checkpointState !== "satisfied") {
      blockingReasonCodes.push("CONSENT_CHECKPOINT_NOT_SATISFIED");
    }
    if (consentRecord.state !== "granted") {
      blockingReasonCodes.push("CONSENT_RECORD_NOT_GRANTED");
    }
    if (
      validationInput.expectedChoiceProofRef &&
      choiceProof.pharmacyChoiceProofId !== validationInput.expectedChoiceProofRef
    ) {
      blockingReasonCodes.push("CHOICE_PROOF_REF_MISMATCH");
    }
    if (
      validationInput.expectedSelectedExplanationRef &&
      explanation.pharmacyChoiceExplanationId !== validationInput.expectedSelectedExplanationRef
    ) {
      blockingReasonCodes.push("CHOICE_EXPLANATION_REF_MISMATCH");
    }
    if (
      validationInput.expectedDirectorySnapshotRef &&
      directorySnapshot.directorySnapshotId !== validationInput.expectedDirectorySnapshotRef
    ) {
      blockingReasonCodes.push("DIRECTORY_SNAPSHOT_REF_MISMATCH");
    }
    if (
      validationInput.expectedConsentCheckpointRef &&
      consentCheckpoint.pharmacyConsentCheckpointId !== validationInput.expectedConsentCheckpointRef
    ) {
      blockingReasonCodes.push("CONSENT_CHECKPOINT_REF_MISMATCH");
    }
    if (
      !directorySnapshot.providerRefs.some(
        (candidate) => candidate.refId === provider.providerId,
      )
    ) {
      blockingReasonCodes.push("SELECTED_PROVIDER_NOT_IN_DIRECTORY_SNAPSHOT");
    }
    if (explanation.providerRef.refId !== provider.providerId) {
      blockingReasonCodes.push("CHOICE_EXPLANATION_PROVIDER_DRIFT");
    }
    if (providerCapabilitySnapshot.providerRef.refId !== provider.providerId) {
      blockingReasonCodes.push("PROVIDER_CAPABILITY_PROVIDER_DRIFT");
    }
    if (consentCheckpoint.providerRef.refId !== provider.providerId) {
      blockingReasonCodes.push("CONSENT_CHECKPOINT_PROVIDER_DRIFT");
    }
    if (consentCheckpoint.choiceProofRef.refId !== choiceProof.pharmacyChoiceProofId) {
      blockingReasonCodes.push("CONSENT_CHECKPOINT_CHOICE_PROOF_DRIFT");
    }
    if (
      consentCheckpoint.selectedExplanationRef.refId !==
      explanation.pharmacyChoiceExplanationId
    ) {
      blockingReasonCodes.push("CONSENT_CHECKPOINT_EXPLANATION_DRIFT");
    }

    const lineageRefs = uniqueSorted([
      pharmacyCase.requestLineageRef.refId,
      pharmacyCase.lineageCaseLinkRef.refId,
      pharmacyCase.sourceDecisionEpochRef.refId,
      pharmacyCase.leaseRef.refId,
      pharmacyCase.lineageFenceRef.refId,
      pharmacyCase.sourceDecisionSupersessionRef?.refId ?? "",
    ]);

    const compiledPolicyBundleRef = optionalText(validationInput.compiledPolicyBundleRef);
    if (compiledPolicyBundleRef === null) {
      blockingReasonCodes.push("COMPILED_POLICY_BUNDLE_REF_MISSING");
    }

    const packageFingerprint = buildPackageTupleDigest({
      pharmacyCaseId: pharmacyCase.pharmacyCaseId,
      providerRef: provider.providerId,
      providerCapabilitySnapshotRef:
        providerCapabilitySnapshot.providerCapabilitySnapshotId,
      pathwayRef: pharmacyCase.eligibilityRef?.refId ?? pharmacyCase.candidatePathway ?? null,
      consentCheckpointRef: consentCheckpoint.pharmacyConsentCheckpointId,
      directorySnapshotRef: directorySnapshot.directorySnapshotId,
      compiledPolicyBundleRef: compiledPolicyBundleRef ?? "missing_compiled_policy_bundle",
      selectionBindingHash: choiceSession.selectionBindingHash!,
      routeIntentTupleHash,
      contentDigest: contentEvaluation.contentDigest,
      lineageRefs,
    });

    const packageHash = stableReviewDigest({
      packageFingerprint,
      packageState: "frozen",
      representationContractRef: PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID,
      packageTuple: {
        pharmacyCaseId: pharmacyCase.pharmacyCaseId,
        providerRef: provider.providerId,
        providerCapabilitySnapshotRef:
          providerCapabilitySnapshot.providerCapabilitySnapshotId,
        consentCheckpointRef: consentCheckpoint.pharmacyConsentCheckpointId,
        directorySnapshotRef: directorySnapshot.directorySnapshotId,
        compiledPolicyBundleRef,
        selectionBindingHash: choiceSession.selectionBindingHash,
        routeIntentTupleHash,
      },
      decisions: contentEvaluation.decisions
        .map((decision) => ({
          artifactClass: decision.artifactClass,
          candidateRef: decision.candidateRef,
          sourceArtifactRef: decision.sourceArtifactRef,
          sourceHash: decision.sourceHash,
          decisionState: decision.decisionState,
          reasonCode: decision.reasonCode,
          absenceReasonCode: decision.absenceReasonCode,
          redactionTransformRef: decision.redactionTransformRef,
          payload: decision.payload,
        }))
        .sort((left, right) => left.candidateRef.localeCompare(right.candidateRef)),
      lineageRefs,
      contentInput: {
        sourcePracticeRef: validationInput.contentInput.sourcePracticeRef,
        sourcePracticeSummary: validationInput.contentInput.sourcePracticeSummary,
        requestLineageSummary: validationInput.contentInput.requestLineageSummary,
        redFlagCheckRefs: uniqueSorted(validationInput.contentInput.redFlagCheckRefs),
        exclusionCheckRefs: uniqueSorted(validationInput.contentInput.exclusionCheckRefs),
      },
    });

    const currentPackage = await repositories.getCurrentFrozenPackageForCase(
      validationInput.pharmacyCaseId,
    );
    const blocking = uniqueSorted(blockingReasonCodes);

    return {
      pharmacyCase,
      choiceSession,
      choiceProof,
      explanation,
      provider,
      providerCapabilitySnapshot,
      directorySnapshot,
      consentRecord,
      consentCheckpoint,
      contentInput: structuredClone(validationInput.contentInput),
      routeIntentTupleHash,
      compiledPolicyBundleRef: compiledPolicyBundleRef ?? "missing_compiled_policy_bundle",
      lineageRefs,
      decisions: contentEvaluation.decisions,
      contentDigest: contentEvaluation.contentDigest,
      packageFingerprint,
      packageHash,
      validation: {
        status:
          blocking.length === 0
            ? "valid"
            : blocking.some((code) => code.includes("CONTENT") || code.includes("MISSING_"))
              ? "content_ambiguity"
              : "stale_choice_or_consent",
        blockingReasonCodes: blocking,
        packageFingerprint,
        packageHash,
        routeIntentTupleHash,
        compiledPolicyBundleRef,
        currentPackageId: currentPackage?.toSnapshot().packageId ?? null,
      },
    };
  }

  async function saveDraftPackage(input: {
    context: ResolvedPackageContext;
    validationInput: PharmacyComposeReferralPackageDraftInput | PharmacyFreezeReferralPackageInput;
  }): Promise<PharmacyReferralPackageSnapshot> {
    const currentPackageDocument = await repositories.getLatestPackageForCase(
      input.context.pharmacyCase.pharmacyCaseId,
    );
    const currentPackage = currentPackageDocument?.toSnapshot() ?? null;
    if (
      currentPackage &&
      currentPackage.packageState === "composing" &&
      currentPackage.packageHash === input.context.packageHash
    ) {
      return currentPackage;
    }

    const draftPackage: PharmacyReferralPackageSnapshot = {
      packageId: nextId("pharmacy_referral_package"),
      pharmacyCaseId: input.context.pharmacyCase.pharmacyCaseId,
      patientRef: input.context.pharmacyCase.patientRef,
      providerRef: makeRef("PharmacyProvider", input.context.provider.providerId, TASK_343),
      providerCapabilitySnapshotRef: makeRef(
        "PharmacyProviderCapabilitySnapshot",
        input.context.providerCapabilitySnapshot.providerCapabilitySnapshotId,
        TASK_343,
      ),
      pathwayRef:
        input.context.pharmacyCase.eligibilityRef === null
          ? null
          : makeRef(
              "PathwayEligibilityEvaluation",
              input.context.pharmacyCase.eligibilityRef.refId,
              TASK_342,
            ),
      fhirRepresentationSetRef: null,
      serviceRequestArtifactRef: null,
      communicationArtifactRef: null,
      documentReferenceArtifactRefs: [],
      consentArtifactRef: null,
      provenanceArtifactRef: null,
      auditEventArtifactRef: null,
      patientSummaryRef: null,
      consentRef: makeRef(
        "PharmacyConsentRecord",
        input.context.consentRecord.pharmacyConsentRecordId,
        TASK_343,
      ),
      consentCheckpointRef: makeRef(
        "PharmacyConsentCheckpoint",
        input.context.consentCheckpoint.pharmacyConsentCheckpointId,
        TASK_343,
      ),
      directorySnapshotRef: makeRef(
        "PharmacyDirectorySnapshot",
        input.context.directorySnapshot.directorySnapshotId,
        TASK_343,
      ),
      compiledPolicyBundleRef: input.context.compiledPolicyBundleRef,
      selectionBindingHash: input.context.choiceSession.selectionBindingHash!,
      lineageRefs: input.context.lineageRefs,
      clinicalSummaryRef: null,
      packageFingerprint: input.context.packageFingerprint,
      packageHash: input.context.packageHash,
      packageState: "composing",
      frozenAt: null,
      routeIntentBindingRef: requireText(
        input.validationInput.routeIntentBindingRef,
        "routeIntentBindingRef",
      ),
      routeIntentTupleHash: input.context.routeIntentTupleHash,
      representationContractRef: PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID,
      visibilityPolicyRef: currentOrDefault(
        input.validationInput.contentInput.visibilityPolicyRef,
        DEFAULT_VISIBILITY_POLICY_REF,
      ),
      minimumNecessaryContractRef: currentOrDefault(
        input.validationInput.contentInput.minimumNecessaryContractRef,
        DEFAULT_MINIMUM_NECESSARY_CONTRACT_REF,
      ),
      sourcePracticeRef: requireText(
        input.validationInput.contentInput.sourcePracticeRef,
        "contentInput.sourcePracticeRef",
      ),
      sourcePracticeSummary: requireText(
        input.validationInput.contentInput.sourcePracticeSummary,
        "contentInput.sourcePracticeSummary",
      ),
      requestLineageSummary: requireText(
        input.validationInput.contentInput.requestLineageSummary,
        "contentInput.requestLineageSummary",
      ),
      supersededByPackageRef: null,
      invalidationReasonCode: null,
      createdAt: input.validationInput.recordedAt,
      updatedAt: input.validationInput.recordedAt,
      version: 1,
    };
    await repositories.savePackage(draftPackage);

    for (const decision of input.context.decisions) {
      await repositories.saveGovernanceDecision({
        packageContentGovernanceDecisionId: nextId("pharmacy_package_governance"),
        packageRef: makeRef("PharmacyReferralPackage", draftPackage.packageId, TASK_349),
        artifactClass: decision.artifactClass,
        candidateRef: decision.candidateRef,
        sourceArtifactRef: decision.sourceArtifactRef,
        sourceHash: decision.sourceHash,
        derivationRef: decision.derivationRef,
        visibilityPolicyRef: decision.visibilityPolicyRef,
        minimumNecessaryContractRef: decision.minimumNecessaryContractRef,
        decisionState: decision.decisionState,
        reasonCode: decision.reasonCode,
        label: decision.label,
        payload: decision.payload,
        resultingArtifactRef: null,
        absenceReasonCode: decision.absenceReasonCode,
        redactionTransformRef: decision.redactionTransformRef,
        recordedAt: input.validationInput.recordedAt,
        version: 1,
      });
    }

    return draftPackage;
  }

  async function materializeRepresentationSet(input: {
    context: ResolvedPackageContext;
    draftPackage: PharmacyReferralPackageSnapshot;
    recordedAt: string;
  }): Promise<FhirMaterializationResult> {
    const materializationPayload = buildPackageRepresentationPayload({
      pharmacyCase: input.context.pharmacyCase,
      provider: input.context.provider,
      choiceProof: input.context.choiceProof,
      explanation: input.context.explanation,
      consentRecord: input.context.consentRecord,
      consentCheckpoint: input.context.consentCheckpoint,
      packageFingerprint: input.context.packageFingerprint,
      packageHash: input.context.packageHash,
      compiledPolicyBundleRef: input.context.compiledPolicyBundleRef,
      routeIntentBindingRef: input.draftPackage.routeIntentBindingRef,
      routeIntentTupleHash: input.context.routeIntentTupleHash,
      contentInput: {
        sourcePracticeRef: input.draftPackage.sourcePracticeRef,
        sourcePracticeSummary: input.draftPackage.sourcePracticeSummary,
        requestLineageSummary: input.draftPackage.requestLineageSummary,
        patientSummary: {
          ...input.context.decisions.find((decision) => decision.candidateRef === "patient_summary")!
            .payload,
          sourceArtifactRef:
            input.context.decisions.find((decision) => decision.candidateRef === "patient_summary")!
              .sourceArtifactRef!,
          sourceHash:
            input.context.decisions.find((decision) => decision.candidateRef === "patient_summary")!
              .sourceHash!,
          label:
            input.context.decisions.find((decision) => decision.candidateRef === "patient_summary")!
              .label,
        } as PharmacyReferralStructuredContentInput,
        clinicalSummary: {
          ...input.context.decisions.find((decision) => decision.candidateRef === "clinical_summary")!
            .payload,
          sourceArtifactRef:
            input.context.decisions.find((decision) => decision.candidateRef === "clinical_summary")!
              .sourceArtifactRef!,
          sourceHash:
            input.context.decisions.find((decision) => decision.candidateRef === "clinical_summary")!
              .sourceHash!,
          label:
            input.context.decisions.find((decision) => decision.candidateRef === "clinical_summary")!
              .label,
        } as PharmacyReferralStructuredContentInput,
        communicationPreferenceSummary: {
          ...input.context.decisions.find(
            (decision) => decision.candidateRef === "communication_preference_summary",
          )!.payload,
          sourceArtifactRef:
            input.context.decisions.find(
              (decision) => decision.candidateRef === "communication_preference_summary",
            )!.sourceArtifactRef!,
          sourceHash:
            input.context.decisions.find(
              (decision) => decision.candidateRef === "communication_preference_summary",
            )!.sourceHash!,
          label:
            input.context.decisions.find(
              (decision) => decision.candidateRef === "communication_preference_summary",
            )!.label,
        } as PharmacyReferralStructuredContentInput,
        supportingArtifacts: input.context.decisions
          .filter((decision) => decision.artifactClass === "document_reference")
          .map((decision) => ({
            sourceArtifactRef: decision.sourceArtifactRef ?? decision.candidateRef,
            sourceHash: decision.sourceHash ?? "missing_source_hash",
            label: decision.label,
            classification: `${decision.decisionState}:${decision.reasonCode}`,
            mimeType: "application/octet-stream",
            governanceHint:
              decision.decisionState === "included"
                ? "include"
                : decision.decisionState === "excluded_by_policy"
                  ? "exclude_by_policy"
                  : decision.decisionState === "included_summary_only"
                    ? "summary_only"
                    : decision.decisionState === "included_redaction_required"
                      ? "redact"
                      : "unavailable",
            redactionTransformRef: decision.redactionTransformRef,
            unavailableReasonCode: decision.absenceReasonCode,
            derivationRef: decision.derivationRef,
            visibilityPolicyRef: decision.visibilityPolicyRef,
            minimumNecessaryContractRef: decision.minimumNecessaryContractRef,
          })),
        redFlagCheckRefs: input.context.contentInput.redFlagCheckRefs,
        exclusionCheckRefs: input.context.contentInput.exclusionCheckRefs,
      },
      decisions: input.context.decisions,
    });

    const aggregateVersionRef = buildPackageRepresentationVersionRef(
      input.context.packageHash,
    );

    const materialization = await representationCompiler.materializeRepresentationSet({
      representationContractRef: PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID,
      generatedAt: input.recordedAt,
      aggregate: {
        governingAggregateType: "PharmacyCase",
        aggregateRef: input.context.pharmacyCase.pharmacyCaseId,
        aggregateVersionRef,
        lineageRef: input.context.pharmacyCase.requestLineageRef.refId,
        aggregateState: "package_ready",
        subjectRef: input.context.pharmacyCase.patientRef.refId,
        evidenceSnapshotRef: input.context.packageFingerprint,
        authoritativeSettlementRef: `pkg_freeze_${input.draftPackage.packageId}`,
        provenanceAuditJoinRef: `pkg_audit_${input.draftPackage.packageId}`,
        payload: materializationPayload,
        sourceAggregateRefs: uniqueSorted([
          input.context.pharmacyCase.pharmacyCaseId,
          input.context.choiceProof.pharmacyChoiceProofId,
          input.context.consentCheckpoint.pharmacyConsentCheckpointId,
          input.context.directorySnapshot.directorySnapshotId,
        ]),
        availableEvidenceRefs: [
          "PharmacyCase",
          "PharmacyConsentCheckpoint",
          "DispatchProofEnvelope",
          "OutcomeEvidenceEnvelope",
        ],
      },
    });

    const replay = await representationCompiler.materializeRepresentationSet({
      representationContractRef: PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID,
      generatedAt: input.recordedAt,
      aggregate: {
        governingAggregateType: "PharmacyCase",
        aggregateRef: input.context.pharmacyCase.pharmacyCaseId,
        aggregateVersionRef,
        lineageRef: input.context.pharmacyCase.requestLineageRef.refId,
        aggregateState: "package_ready",
        subjectRef: input.context.pharmacyCase.patientRef.refId,
        evidenceSnapshotRef: input.context.packageFingerprint,
        authoritativeSettlementRef: `pkg_freeze_${input.draftPackage.packageId}`,
        provenanceAuditJoinRef: `pkg_audit_${input.draftPackage.packageId}`,
        payload: materializationPayload,
        sourceAggregateRefs: uniqueSorted([
          input.context.pharmacyCase.pharmacyCaseId,
          input.context.choiceProof.pharmacyChoiceProofId,
          input.context.consentCheckpoint.pharmacyConsentCheckpointId,
          input.context.directorySnapshot.directorySnapshotId,
        ]),
        availableEvidenceRefs: [
          "PharmacyCase",
          "PharmacyConsentCheckpoint",
          "DispatchProofEnvelope",
          "OutcomeEvidenceEnvelope",
        ],
      },
    });

    invariant(
      replay.replayed &&
        replay.representationSet.fhirRepresentationSetId ===
          materialization.representationSet.fhirRepresentationSetId,
      "REPRESENTATION_REPLAY_MISMATCH",
      "Canonical FHIR representation replay diverged for the same package tuple.",
    );

    return materialization;
  }

  async function upsertArtifacts(input: {
    draftPackage: PharmacyReferralPackageSnapshot;
    decisions: readonly PharmacyPackageContentGovernanceDecisionSnapshot[];
    materialization: FhirMaterializationResult;
    recordedAt: string;
  }): Promise<{
    artifacts: readonly PharmacyPackageArtifactSnapshot[];
    updatedDecisions: readonly PharmacyPackageContentGovernanceDecisionSnapshot[];
    serviceRequestArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
    communicationArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
    documentReferenceArtifactRefs: readonly AggregateRef<"PharmacyPackageArtifact", Task349>[];
    consentArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
    provenanceArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
    auditEventArtifactRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
    patientSummaryRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
    clinicalSummaryRef: AggregateRef<"PharmacyPackageArtifact", Task349>;
  }> {
    const resourceRefByType = new Map<string, string | null>([
      ["service_request", findMaterializedResourceRef(input.materialization, "ServiceRequest")],
      ["communication", findMaterializedResourceRef(input.materialization, "Communication")],
      ["document_reference", findMaterializedResourceRef(input.materialization, "DocumentReference")],
      ["consent", findMaterializedResourceRef(input.materialization, "Consent")],
      ["provenance", findMaterializedResourceRef(input.materialization, "Provenance")],
      ["audit_event", findMaterializedResourceRef(input.materialization, "AuditEvent")],
    ]);

    const artifacts: PharmacyPackageArtifactSnapshot[] = [];
    const updatedDecisions: PharmacyPackageContentGovernanceDecisionSnapshot[] = [];

    for (const decision of input.decisions) {
      if (
        decision.decisionState === "excluded_by_policy" ||
        decision.decisionState === "unavailable"
      ) {
        updatedDecisions.push(decision);
        continue;
      }

      const packageArtifactId = nextId("pharmacy_package_artifact");
      const canonicalArtifactRef =
        decision.artifactClass === "service_request" ||
        decision.artifactClass === "communication" ||
        decision.artifactClass === "document_reference" ||
        decision.artifactClass === "consent" ||
        decision.artifactClass === "provenance" ||
        decision.artifactClass === "audit_event"
          ? resourceRefByType.get(decision.artifactClass) ??
            `artifact://${input.draftPackage.packageId}/${decision.candidateRef}`
          : `artifact://${input.draftPackage.packageId}/${decision.candidateRef}`;

      const artifact: PharmacyPackageArtifactSnapshot = {
        packageArtifactId,
        packageRef: makeRef("PharmacyReferralPackage", input.draftPackage.packageId, TASK_349),
        artifactClass: decision.artifactClass,
        sourceArtifactRef: decision.sourceArtifactRef,
        sourceHash: decision.sourceHash,
        derivationRef: decision.derivationRef,
        visibilityPolicyRef: decision.visibilityPolicyRef,
        minimumNecessaryContractRef: decision.minimumNecessaryContractRef,
        governanceDecisionRef: makeRef(
          "PharmacyPackageContentGovernanceDecision",
          decision.packageContentGovernanceDecisionId,
          TASK_349,
        ),
        contentState: decisionStateToContentState(decision.decisionState),
        canonicalArtifactRef,
        canonicalHash: stableReviewDigest({
          canonicalArtifactRef,
          payload: decision.payload,
          fhirResourceRecordRef: resourceRefByType.get(decision.artifactClass),
        }),
        fhirResourceRecordRef: resourceRefByType.get(decision.artifactClass) ?? null,
        label: decision.candidateRef === "communication_preference_summary" ? "Communication preference" : decision.candidateRef.replaceAll("_", " "),
        payload: decision.payload,
        createdAt: input.recordedAt,
        version: 1,
      };
      await repositories.savePackageArtifact(artifact);
      artifacts.push(artifact);

      const updatedDecision: PharmacyPackageContentGovernanceDecisionSnapshot = {
        ...decision,
        resultingArtifactRef: makeRef("PharmacyPackageArtifact", packageArtifactId, TASK_349),
        version: nextVersion(decision.version),
      };
      await repositories.saveGovernanceDecision(updatedDecision, {
        expectedVersion: decision.version,
      });
      updatedDecisions.push(updatedDecision);
    }

    const byClass = (artifactClass: PharmacyPackageArtifactClass, candidateRef?: string) =>
      artifacts.find(
        (artifact) =>
          artifact.artifactClass === artifactClass &&
          (candidateRef === undefined || artifact.label === candidateRef || artifact.payload["label"] === candidateRef),
      );

    const patientSummaryArtifact = updatedDecisions.find(
      (decision) => decision.candidateRef === "patient_summary" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const clinicalSummaryArtifact = updatedDecisions.find(
      (decision) => decision.candidateRef === "clinical_summary" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const communicationArtifact = updatedDecisions.find(
      (decision) =>
        decision.artifactClass === "communication" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const serviceRequestArtifact = updatedDecisions.find(
      (decision) =>
        decision.artifactClass === "service_request" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const consentArtifact = updatedDecisions.find(
      (decision) => decision.artifactClass === "consent" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const provenanceArtifact = updatedDecisions.find(
      (decision) =>
        decision.artifactClass === "provenance" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const auditEventArtifact = updatedDecisions.find(
      (decision) =>
        decision.artifactClass === "audit_event" && decision.resultingArtifactRef !== null,
    )?.resultingArtifactRef;
    const documentReferenceArtifactRefs = updatedDecisions
      .filter(
        (decision) =>
          decision.artifactClass === "document_reference" &&
          decision.resultingArtifactRef !== null,
      )
      .map((decision) => decision.resultingArtifactRef!);

    invariant(serviceRequestArtifact, "SERVICE_REQUEST_ARTIFACT_MISSING", "ServiceRequest artifact was not materialized.");
    invariant(communicationArtifact, "COMMUNICATION_ARTIFACT_MISSING", "Communication artifact was not materialized.");
    invariant(consentArtifact, "CONSENT_ARTIFACT_MISSING", "Consent artifact was not materialized.");
    invariant(provenanceArtifact, "PROVENANCE_ARTIFACT_MISSING", "Provenance artifact was not materialized.");
    invariant(auditEventArtifact, "AUDIT_EVENT_ARTIFACT_MISSING", "AuditEvent artifact was not materialized.");
    invariant(patientSummaryArtifact, "PATIENT_SUMMARY_ARTIFACT_MISSING", "Patient summary artifact was not materialized.");
    invariant(clinicalSummaryArtifact, "CLINICAL_SUMMARY_ARTIFACT_MISSING", "Clinical summary artifact was not materialized.");

    return {
      artifacts,
      updatedDecisions,
      serviceRequestArtifactRef: serviceRequestArtifact,
      communicationArtifactRef: communicationArtifact,
      documentReferenceArtifactRefs,
      consentArtifactRef: consentArtifact,
      provenanceArtifactRef: provenanceArtifact,
      auditEventArtifactRef: auditEventArtifact,
      patientSummaryRef: patientSummaryArtifact,
      clinicalSummaryRef: clinicalSummaryArtifact,
    };
  }

  async function updateConsentFingerprint(input: {
    consentRecord: PharmacyConsentRecord;
    consentCheckpoint: PharmacyConsentCheckpoint;
    packageFingerprint: string;
    recordedAt: string;
  }): Promise<void> {
    await directoryRepositories.saveConsentRecord(
      {
        ...input.consentRecord,
        packageFingerprint: input.packageFingerprint,
        version: nextVersion(input.consentRecord.version),
      },
      { expectedVersion: input.consentRecord.version },
    );
    await directoryRepositories.saveConsentCheckpoint(
      {
        ...input.consentCheckpoint,
        packageFingerprint: input.packageFingerprint,
        evaluatedAt: input.recordedAt,
        version: nextVersion(input.consentCheckpoint.version),
      },
      { expectedVersion: input.consentCheckpoint.version },
    );
  }

  async function refreshCorrelationRecord(input: {
    frozenPackage: PharmacyReferralPackageSnapshot;
    context: ResolvedPackageContext;
    recordedAt: string;
  }): Promise<PharmacyCorrelationRecordSnapshot> {
    const existing = (
      await repositories.getCurrentCorrelationRecordForCase(input.frozenPackage.pharmacyCaseId)
    )?.toSnapshot();

    const snapshot: PharmacyCorrelationRecordSnapshot =
      existing === undefined
        ? {
            correlationId: nextId("pharmacy_correlation"),
            pharmacyCaseId: input.frozenPackage.pharmacyCaseId,
            packageId: input.frozenPackage.packageId,
            dispatchAttemptId: null,
            providerRef: input.frozenPackage.providerRef,
            patientRef: input.frozenPackage.patientRef,
            serviceType: input.context.pharmacyCase.serviceType,
            directorySnapshotRef: input.frozenPackage.directorySnapshotRef,
            providerCapabilitySnapshotRef:
              input.frozenPackage.providerCapabilitySnapshotRef,
            dispatchPlanRef: null,
            transportMode: null,
            transportAssuranceProfileRef: null,
            dispatchAdapterBindingRef: null,
            dispatchPlanHash: null,
            packageHash: input.frozenPackage.packageHash,
            outboundReferenceSet: [],
            outboundReferenceSetHash: null,
            transportAcceptanceState: "none",
            providerAcceptanceState: "none",
            authoritativeDispatchProofState: "pending",
            currentProofEnvelopeRef: null,
            currentDispatchSettlementRef: null,
            acknowledgementState: "awaiting_dispatch",
            confidenceFloor: 0,
            routeIntentBindingRef: input.frozenPackage.routeIntentBindingRef,
            routeIntentTupleHash: input.frozenPackage.routeIntentTupleHash,
            createdAt: input.recordedAt,
            updatedAt: input.recordedAt,
            version: 1,
          }
        : {
            ...existing,
            packageId: input.frozenPackage.packageId,
            providerRef: input.frozenPackage.providerRef,
            patientRef: input.frozenPackage.patientRef,
            serviceType: input.context.pharmacyCase.serviceType,
            directorySnapshotRef: input.frozenPackage.directorySnapshotRef,
            providerCapabilitySnapshotRef:
              input.frozenPackage.providerCapabilitySnapshotRef,
            dispatchPlanRef: null,
            transportMode: null,
            transportAssuranceProfileRef: null,
            dispatchAdapterBindingRef: null,
            dispatchPlanHash: null,
            packageHash: input.frozenPackage.packageHash,
            outboundReferenceSet: [],
            outboundReferenceSetHash: null,
            transportAcceptanceState: "none",
            providerAcceptanceState: "none",
            authoritativeDispatchProofState: "pending",
            currentProofEnvelopeRef: null,
            currentDispatchSettlementRef: null,
            acknowledgementState: "awaiting_dispatch",
            confidenceFloor: 0,
            routeIntentBindingRef: input.frozenPackage.routeIntentBindingRef,
            routeIntentTupleHash: input.frozenPackage.routeIntentTupleHash,
            updatedAt: input.recordedAt,
            version: nextVersion(existing.version),
          };

    await repositories.saveCorrelationRecord(
      snapshot,
      existing ? { expectedVersion: existing.version } : undefined,
    );
    return snapshot;
  }

  async function markPackageSuperseded(input: {
    supersededPackage: PharmacyReferralPackageSnapshot;
    successorPackage: PharmacyReferralPackageSnapshot;
    reasonCode: string;
    recordedAt: string;
  }): Promise<void> {
    if (input.supersededPackage.packageState !== "frozen") {
      return;
    }
    await repositories.savePackage(
      {
        ...input.supersededPackage,
        packageState: "superseded",
        supersededByPackageRef: makeRef(
          "PharmacyReferralPackage",
          input.successorPackage.packageId,
          TASK_349,
        ),
        updatedAt: input.recordedAt,
        version: nextVersion(input.supersededPackage.version),
      },
      { expectedVersion: input.supersededPackage.version },
    );
    await repositories.saveSupersessionRecord({
      packageSupersessionRecordId: nextId("pharmacy_package_supersession"),
      supersededPackageRef: makeRef(
        "PharmacyReferralPackage",
        input.supersededPackage.packageId,
        TASK_349,
      ),
      successorPackageRef: makeRef(
        "PharmacyReferralPackage",
        input.successorPackage.packageId,
        TASK_349,
      ),
      reasonCode: input.reasonCode,
      recordedAt: input.recordedAt,
      version: 1,
    });
  }

  async function markPackageInvalidated(
    input: PharmacyInvalidateReferralPackageInput,
  ): Promise<PharmacyReferralPackageBundle> {
    const packageDocument = await repositories.getPackage(input.packageId);
    invariant(packageDocument, "REFERRAL_PACKAGE_NOT_FOUND", "PharmacyReferralPackage was not found.");
    const snapshot = packageDocument.toSnapshot();
    if (snapshot.packageState === "invalidated") {
      return (await loadBundle(snapshot.packageId))!;
    }
    if (snapshot.fhirRepresentationSetRef) {
      await representationCompiler.invalidateRepresentationSet({
        representationSetId: snapshot.fhirRepresentationSetRef,
        invalidationReasonRef: input.reasonCode,
        invalidatedAt: input.invalidatedAt,
      });
    }
    await repositories.savePackage(
      {
        ...snapshot,
        packageState: "invalidated",
        invalidationReasonCode: input.reasonCode,
        updatedAt: input.invalidatedAt,
        version: nextVersion(snapshot.version),
      },
      { expectedVersion: snapshot.version },
    );
    await repositories.saveInvalidationRecord({
      packageInvalidationRecordId: nextId("pharmacy_package_invalidation"),
      packageRef: makeRef("PharmacyReferralPackage", snapshot.packageId, TASK_349),
      invalidationReasonCode: input.reasonCode,
      invalidatedByRef: optionalText(input.invalidatedByRef),
      invalidatedAt: input.invalidatedAt,
      representationInvalidated: snapshot.fhirRepresentationSetRef !== null,
      version: 1,
    });
    return (await loadBundle(snapshot.packageId))!;
  }

  async function maybeReplayFreeze(
    replayKey: string,
  ): Promise<PharmacyReferralPackageFreezeResult | null> {
    const replayDocument = await repositories.getCommandReplay(replayKey);
    if (!replayDocument) {
      return null;
    }
    const replay = replayDocument.toSnapshot();
    invariant(replay.resultKind === "freeze", "INVALID_REPLAY_KIND", "Replay key does not point to a freeze result.");
    const packageBundle = await loadBundle(replay.resultRefId);
    invariant(packageBundle, "REPLAY_PACKAGE_NOT_FOUND", "Replayed package was not found.");
    invariant(packageBundle.latestFreezeRecord, "REPLAY_FREEZE_RECORD_NOT_FOUND", "Replayed freeze record was not found.");
    invariant(packageBundle.correlationRecord, "REPLAY_CORRELATION_NOT_FOUND", "Replayed correlation record was not found.");
    return {
      packageBundle,
      caseMutation: null,
      tupleValidation: {
        status: "valid",
        blockingReasonCodes: [],
        packageFingerprint: packageBundle.package.packageFingerprint,
        packageHash: packageBundle.package.packageHash,
        routeIntentTupleHash: packageBundle.package.routeIntentTupleHash,
        compiledPolicyBundleRef: packageBundle.package.compiledPolicyBundleRef,
        currentPackageId: packageBundle.package.packageId,
      },
      representationMaterialization: {
        representationSetId: packageBundle.package.fhirRepresentationSetRef!,
        resourceRecordIds: packageBundle.fhirResourceRecords.map(
          (record) => record["fhirResourceRecordId"] as string,
        ),
        exchangeBundleId: null,
        replayed: true,
      },
      correlationRecord: packageBundle.correlationRecord,
      replayed: true,
    };
  }

  return {
    repositories,
    caseKernelService,
    directoryRepositories,
    representationCompiler,

    async validatePackageTuple(validationInput) {
      return (await resolveContext(validationInput)).validation;
    },

    async composeDraftPackage(validationInput) {
      const context = await resolveContext(validationInput);
      invariant(
        context.validation.status === "valid",
        "PACKAGE_TUPLE_INVALID",
        `Package tuple is invalid: ${context.validation.blockingReasonCodes.join(", ")}`,
      );
      const draftPackage = await saveDraftPackage({
        context,
        validationInput,
      });
      return (await loadBundle(draftPackage.packageId))!;
    },

    async freezePackage(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const replayKey = optionalText(command.idempotencyKey);
      if (replayKey) {
        const replay = await maybeReplayFreeze(replayKey);
        if (replay) {
          return replay;
        }
      }

      const context = await resolveContext(command);
      if (context.validation.status !== "valid") {
        const currentFrozenPackage = await repositories.getCurrentFrozenPackageForCase(
          command.pharmacyCaseId,
        );
        if (currentFrozenPackage) {
          await markPackageInvalidated({
            packageId: currentFrozenPackage.toSnapshot().packageId,
            reasonCode: context.validation.blockingReasonCodes[0] ?? "PACKAGE_TUPLE_INVALID",
            invalidatedByRef: command.actorRef,
            invalidatedAt: recordedAt,
          });
        }
        invariant(
          false,
          "PACKAGE_TUPLE_INVALID",
          `Package tuple is invalid: ${context.validation.blockingReasonCodes.join(", ")}`,
        );
      }

      const currentFrozenPackage = (
        await repositories.getCurrentFrozenPackageForCase(command.pharmacyCaseId)
      )?.toSnapshot() ?? null;
      if (
        currentFrozenPackage &&
        currentFrozenPackage.packageHash === context.packageHash &&
        currentFrozenPackage.routeIntentTupleHash === context.routeIntentTupleHash
      ) {
        const packageBundle = (await loadBundle(currentFrozenPackage.packageId))!;
        invariant(
          packageBundle.correlationRecord,
          "CORRELATION_NOT_FOUND",
          "Current package correlation record was not found.",
        );
        if (replayKey) {
          await repositories.saveCommandReplay({
            replayKey,
            resultKind: "freeze",
            resultRefId: currentFrozenPackage.packageId,
            version: 1,
          });
        }
        return {
          packageBundle,
          caseMutation: null,
          tupleValidation: context.validation,
          representationMaterialization: {
            representationSetId: currentFrozenPackage.fhirRepresentationSetRef!,
            resourceRecordIds: packageBundle.fhirResourceRecords.map(
              (record) => record["fhirResourceRecordId"] as string,
            ),
            exchangeBundleId: null,
            replayed: true,
          },
          correlationRecord: packageBundle.correlationRecord,
          replayed: true,
        };
      }

      const draftPackage =
        command.draftPackageId === undefined || command.draftPackageId === null
          ? await saveDraftPackage({
              context,
              validationInput: command,
            })
          : (await repositories.getPackage(command.draftPackageId))?.toSnapshot() ??
            (() => {
              invariant(false, "DRAFT_PACKAGE_NOT_FOUND", "Draft PharmacyReferralPackage was not found.");
            })();

      await caseKernelService.verifyMutationAuthority({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        reasonCode: command.reasonCode,
      });

      const materialization = await materializeRepresentationSet({
        context,
        draftPackage,
        recordedAt,
      });
      const decisions = (await repositories.listGovernanceDecisions(draftPackage.packageId)).map(
        (entry) => entry.toSnapshot(),
      );
      const artifactUpsert = await upsertArtifacts({
        draftPackage,
        decisions,
        materialization,
        recordedAt,
      });
      const frozenPackage: PharmacyReferralPackageSnapshot = {
        ...draftPackage,
        fhirRepresentationSetRef: materialization.representationSet.fhirRepresentationSetId,
        serviceRequestArtifactRef: artifactUpsert.serviceRequestArtifactRef,
        communicationArtifactRef: artifactUpsert.communicationArtifactRef,
        documentReferenceArtifactRefs: artifactUpsert.documentReferenceArtifactRefs,
        consentArtifactRef: artifactUpsert.consentArtifactRef,
        provenanceArtifactRef: artifactUpsert.provenanceArtifactRef,
        auditEventArtifactRef: artifactUpsert.auditEventArtifactRef,
        patientSummaryRef: artifactUpsert.patientSummaryRef,
        clinicalSummaryRef: artifactUpsert.clinicalSummaryRef,
        packageState: "frozen",
        frozenAt: recordedAt,
        updatedAt: recordedAt,
        version: nextVersion(draftPackage.version),
      };
      await repositories.savePackage(frozenPackage, {
        expectedVersion: draftPackage.version,
      });

      await repositories.saveFreezeRecord({
        packageFreezeRecordId: nextId("pharmacy_package_freeze"),
        packageRef: makeRef("PharmacyReferralPackage", frozenPackage.packageId, TASK_349),
        representationContractRef: PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID,
        fhirRepresentationSetRef: frozenPackage.fhirRepresentationSetRef!,
        packageFingerprint: frozenPackage.packageFingerprint,
        packageHash: frozenPackage.packageHash,
        routeIntentBindingRef: frozenPackage.routeIntentBindingRef,
        routeIntentTupleHash: frozenPackage.routeIntentTupleHash,
        compiledPolicyBundleRef: frozenPackage.compiledPolicyBundleRef,
        actorRef: command.actorRef,
        recordedAt,
        version: 1,
      });

      await updateConsentFingerprint({
        consentRecord: context.consentRecord,
        consentCheckpoint: context.consentCheckpoint,
        packageFingerprint: frozenPackage.packageFingerprint,
        recordedAt,
      });

      const correlationRecord = await refreshCorrelationRecord({
        frozenPackage,
        context,
        recordedAt,
      });

      let caseMutation: PharmacyCaseMutationResult | null = null;
      if (context.pharmacyCase.status !== "package_ready") {
        caseMutation = await caseKernelService.transitionPharmacyCase({
          pharmacyCaseId: command.pharmacyCaseId,
          actorRef: command.actorRef,
          commandActionRecordRef: command.commandActionRecordRef,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          recordedAt,
          leaseRef: command.leaseRef,
          expectedOwnershipEpoch: command.expectedOwnershipEpoch,
          expectedLineageFenceRef: command.expectedLineageFenceRef,
          scopedMutationGateRef: command.scopedMutationGateRef,
          reasonCode: command.reasonCode,
          nextStatus: "package_ready",
          eventName: "pharmacy.package.composed",
          transitionPredicateId: "PH6_PKG_349_FREEZE",
          dependentRef: frozenPackage.packageId,
        });
      }

      if (currentFrozenPackage && currentFrozenPackage.packageId !== frozenPackage.packageId) {
        await markPackageSuperseded({
          supersededPackage: currentFrozenPackage,
          successorPackage: frozenPackage,
          reasonCode: "PACKAGE_TUPLE_SUPERSEDED_BY_NEW_FREEZE",
          recordedAt,
        });
      }

      if (replayKey) {
        await repositories.saveCommandReplay({
          replayKey,
          resultKind: "freeze",
          resultRefId: frozenPackage.packageId,
          version: 1,
        });
      }

      const packageBundle = (await loadBundle(frozenPackage.packageId))!;
      return {
        packageBundle,
        caseMutation,
        tupleValidation: context.validation,
        representationMaterialization: {
          representationSetId: materialization.representationSet.fhirRepresentationSetId,
          resourceRecordIds: materialization.resourceRecords.map(
            (record) => record.fhirResourceRecordId,
          ),
          exchangeBundleId: materialization.exchangeBundle?.fhirExchangeBundleId ?? null,
          replayed: materialization.replayed,
        },
        correlationRecord,
        replayed: false,
      };
    },

    async supersedePackage(input) {
      const supersededPackageDocument = await repositories.getPackage(input.packageId);
      invariant(
        supersededPackageDocument,
        "REFERRAL_PACKAGE_NOT_FOUND",
        "Superseded PharmacyReferralPackage was not found.",
      );
      const successorPackageDocument = await repositories.getPackage(input.successorPackageId);
      invariant(
        successorPackageDocument,
        "SUCCESSOR_PACKAGE_NOT_FOUND",
        "Successor PharmacyReferralPackage was not found.",
      );
      await markPackageSuperseded({
        supersededPackage: supersededPackageDocument.toSnapshot(),
        successorPackage: successorPackageDocument.toSnapshot(),
        reasonCode: input.reasonCode,
        recordedAt: input.recordedAt,
      });
      return (await loadBundle(input.packageId))!;
    },

    async invalidatePackage(input) {
      return markPackageInvalidated(input);
    },

    async getPackageById(packageId) {
      return loadBundle(packageId);
    },

    async getCurrentPackageForCase(pharmacyCaseId) {
      const currentPackageDocument = await repositories.getCurrentFrozenPackageForCase(
        pharmacyCaseId,
      );
      if (!currentPackageDocument) {
        return null;
      }
      return loadBundle(currentPackageDocument.toSnapshot().packageId);
    },

    async replayCanonicalRepresentationGeneration(input) {
      const packageBundle = await loadBundle(input.packageId);
      invariant(packageBundle, "REFERRAL_PACKAGE_NOT_FOUND", "PharmacyReferralPackage was not found.");
      invariant(
        packageBundle.latestFreezeRecord,
        "PACKAGE_FREEZE_RECORD_NOT_FOUND",
        "Package freeze record was not found.",
      );
      const replay = await representationCompiler.materializeRepresentationSet({
          representationContractRef: PHARMACY_PACKAGE_REPRESENTATION_CONTRACT_ID,
          generatedAt: input.generatedAt,
          aggregate: {
            governingAggregateType: "PharmacyCase",
            aggregateRef: packageBundle.package.pharmacyCaseId,
            aggregateVersionRef: buildPackageRepresentationVersionRef(
              packageBundle.package.packageHash,
            ),
          lineageRef: packageBundle.package.lineageRefs[0] ?? packageBundle.package.pharmacyCaseId,
          aggregateState: "package_ready",
          subjectRef: packageBundle.package.patientRef.refId,
          evidenceSnapshotRef: packageBundle.package.packageFingerprint,
          authoritativeSettlementRef: packageBundle.latestFreezeRecord.packageFreezeRecordId,
          provenanceAuditJoinRef: `pkg_audit_${packageBundle.package.packageId}`,
          payload: {
            packageHash: packageBundle.package.packageHash,
            packageFingerprint: packageBundle.package.packageFingerprint,
            packageId: packageBundle.package.packageId,
          },
          availableEvidenceRefs: [
            "PharmacyCase",
            "PharmacyConsentCheckpoint",
            "DispatchProofEnvelope",
            "OutcomeEvidenceEnvelope",
          ],
        },
      });
      return {
        packageBundle,
        replayed: replay.replayed,
        representationSetId: replay.representationSet.fhirRepresentationSetId,
      };
    },
  };
}
