import { createHash } from "node:crypto";
import type {
  BindingConfidenceSnapshot,
  IdentityBindingAuthorityService,
} from "./identity-binding-authority";
import type {
  IdentityEvidenceLocator,
  IdentityEvidenceSourceChannel,
  IdentityEvidenceVaultService,
} from "./identity-evidence-vault";
import type { RouteSensitivityFamily } from "./patient-linker";

export const TELEPHONY_VERIFICATION_SERVICE_NAME = "TelephonyVerificationPipeline";
export const TELEPHONY_VERIFICATION_SCHEMA_VERSION = "189.phase2.telephony-verification.v1";
export const TELEPHONY_VERIFICATION_POLICY_VERSION = "phase2-telephony-verification-189.v1";
export const TELEPHONY_VERIFICATION_THRESHOLD_VERSION =
  "phase2-telephony-verification-thresholds-189.v1";
export const TELEPHONY_VERIFICATION_ID_CALIBRATION_VERSION =
  "Cal_id_189_synthetic_adjudicated_v1";
export const TELEPHONY_VERIFICATION_DEST_CALIBRATION_VERSION =
  "Cal_dest_189_synthetic_adjudicated_v1";
export const TELEPHONY_VERIFICATION_SEED_MODEL_VERSION = "no_joint_seed_model_189_v1";
export const TELEPHONY_VERIFICATION_EPSILON = 1e-6;

export const telephonyVerificationPersistenceTables = [
  "phase2_telephony_identifier_capture_attempts",
  "phase2_telephony_candidate_sets",
  "phase2_telephony_identity_confidence_assessments",
  "phase2_telephony_destination_confidence_assessments",
  "phase2_telephony_verification_decisions",
  "phase2_telephony_candidate_evidence_packages",
  "phase2_telephony_verification_authority_submissions",
] as const;

export const telephonyVerificationMigrationPlanRefs = [
  "services/command-api/migrations/104_phase2_telephony_verification_pipeline.sql",
] as const;

export const telephonyVerificationGapResolutions = [
  "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CONFIDENCE_OBJECTS",
  "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_THRESHOLD_SOURCE",
  "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALIBRATION_ABSENCE",
  "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_CALLER_ID_CAP",
  "GAP_RESOLVED_PHASE2_TELEPHONY_VERIFICATION_AUTHORITY_UNAVAILABLE",
] as const;

export const controlledTelephonyIdentifierCaptureOrder = [
  "nhs_number",
  "date_of_birth",
  "surname",
  "postcode",
  "caller_id_hint",
  "verified_callback",
  "handset_step_up_proof",
  "ivr_consistency",
  "operator_correction",
] as const;

export type TelephonyIdentifierFieldFamily =
  (typeof controlledTelephonyIdentifierCaptureOrder)[number];

export type TelephonyCaptureSource =
  | "ivr"
  | "speech"
  | "operator"
  | "provider_callback"
  | "handset_step_up"
  | "system";

export type TelephonyIdentifierValidationResult =
  | "valid"
  | "invalid_format"
  | "unsupported_family"
  | "operator_correction_recorded"
  | "contradictory_identifier";

export type TelephonyVerificationOutcome =
  | "telephony_verified_seeded"
  | "telephony_verified_challenge"
  | "manual_followup_required"
  | "identity_failed"
  | "insufficient_calibration"
  | "destination_untrusted"
  | "ambiguous_candidate_set";

export type TelephonyContinuationPosture =
  | "seeded_continuation_candidate"
  | "challenge_continuation_only"
  | "manual_followup_only"
  | "no_continuation";

export type TelephonyCalibrationState =
  | "validated_seeded"
  | "challenge_only"
  | "manual_only"
  | "unvalidated";

export interface TelephonyIdentifierCaptureAttempt {
  readonly captureAttemptRef: string;
  readonly schemaVersion: typeof TELEPHONY_VERIFICATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_VERIFICATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly fieldFamily: TelephonyIdentifierFieldFamily;
  readonly captureOrderIndex: number;
  readonly captureSource: TelephonyCaptureSource;
  readonly validationResult: TelephonyIdentifierValidationResult;
  readonly normalizedValueHash: string | null;
  readonly vaultEvidenceRef: string | null;
  readonly vaultRef: string | null;
  readonly maskedFragment: string;
  readonly evidenceEnvelopeRef: string | null;
  readonly relatedCandidateSetRef: string | null;
  readonly idempotencyKey: string;
  readonly reasonCodes: readonly string[];
  readonly capturedAt: string;
  readonly recordedBy: typeof TELEPHONY_VERIFICATION_SERVICE_NAME;
}

export interface AppendTelephonyIdentifierCaptureInput {
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly fieldFamily: TelephonyIdentifierFieldFamily;
  readonly rawValue: unknown;
  readonly captureSource: TelephonyCaptureSource;
  readonly actorRef: string;
  readonly idempotencyKey: string;
  readonly provenanceRef?: string;
  readonly capturedAt?: string;
}

export interface TelephonyPatientCandidateRecord {
  readonly candidatePatientRef: string;
  readonly candidateLabel: string;
  readonly patientLinkCandidateRef?: string | null;
  readonly identityAttributeHashes: {
    readonly nhsNumberHash?: string | null;
    readonly dateOfBirthHash?: string | null;
    readonly surnameHash?: string | null;
    readonly postcodeHash?: string | null;
    readonly callerIdHintHash?: string | null;
  };
  readonly destinationHashes: {
    readonly verifiedSmsDestinationHash?: string | null;
    readonly verifiedCallbackNumberHash?: string | null;
    readonly handsetStepUpBindingHash?: string | null;
  };
  readonly candidateSourceRef: string;
}

export interface TelephonyResolvedCandidate {
  readonly candidatePatientRef: string;
  readonly candidateLabel: string;
  readonly patientLinkCandidateRef: string | null;
  readonly candidateRank: number;
  readonly matchedFeatureKeys: readonly TelephonyIdentifierFieldFamily[];
  readonly record: TelephonyPatientCandidateRecord;
}

export interface TelephonyCandidateSet {
  readonly candidateSetRef: string;
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly candidateRefs: readonly string[];
  readonly candidateCount: number;
  readonly resolverPolicyRef: "patient-linker-compatible-hash-resolution-189.v1";
  readonly frozenAt: string;
}

export interface TelephonyIdentityFeatureVector {
  readonly nhsNumberAgreement: number;
  readonly dateOfBirthAgreement: number;
  readonly surnameSimilarity: number;
  readonly postcodeFragmentMatch: number;
  readonly verifiedCallbackSuccess: number;
  readonly ivrConsistency: number;
  readonly callerIdHint: number;
  readonly handsetStepUpProof: number;
  readonly operatorCorrectionSupport: number;
}

export interface TelephonyIdentityCandidateScore {
  readonly candidatePatientRef: string;
  readonly candidateRank: number;
  readonly featureVector: TelephonyIdentityFeatureVector;
  readonly z_id: number;
  readonly P_id: number;
  readonly LCB_id_alpha: number;
  readonly UCB_id_alpha: number;
  readonly nonCallerIdPositiveFeatureCount: number;
  readonly callerIdOnly: boolean;
  readonly reasonCodes: readonly string[];
}

export interface TelephonyIdentityConfidenceAssessment {
  readonly identityConfidenceAssessmentRef: string;
  readonly schemaVersion: typeof TELEPHONY_VERIFICATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_VERIFICATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly candidateSetRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly calibrationVersionRef: string;
  readonly thresholdProfileRef: string;
  readonly alphaId: number;
  readonly candidateScores: readonly TelephonyIdentityCandidateScore[];
  readonly bestCandidateRef: string | null;
  readonly runnerUpCandidateRef: string | null;
  readonly bestPId: number;
  readonly bestLcbIdAlpha: number;
  readonly bestUcbIdAlpha: number;
  readonly runnerUpPId: number;
  readonly runnerUpUcbIdAlpha: number;
  readonly gap_id: number;
  readonly callerIdOnlyBlocked: boolean;
  readonly reasonCodes: readonly string[];
  readonly assessedAt: string;
}

export interface TelephonyDestinationFeatureVector {
  readonly verified_number_on_patient: number;
  readonly handset_step_up_success: number;
  readonly fresh_channel_control_proof: number;
}

export interface TelephonyDestinationConfidenceAssessment {
  readonly destinationConfidenceAssessmentRef: string;
  readonly schemaVersion: typeof TELEPHONY_VERIFICATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_VERIFICATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly candidatePatientRef: string | null;
  readonly calibrationVersionRef: string;
  readonly seedCalibrationVersionRef: string;
  readonly thresholdProfileRef: string;
  readonly alphaDest: number;
  readonly destinationFeatureVector: TelephonyDestinationFeatureVector;
  readonly z_dest: number;
  readonly P_dest: number;
  readonly LCB_dest_alpha: number;
  readonly P_seed: number | null;
  readonly LCB_seed_alpha: number | null;
  readonly P_seed_lower: number;
  readonly seedLowerBoundMethod:
    | "joint_seed_calibrator"
    | "dependence_safe_frechet_lower_bound";
  readonly reasonCodes: readonly string[];
  readonly assessedAt: string;
}

export interface TelephonyVerificationDecision {
  readonly telephonyVerificationDecisionRef: string;
  readonly schemaVersion: typeof TELEPHONY_VERIFICATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_VERIFICATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly outcome: TelephonyVerificationOutcome;
  readonly thresholdProfileRef: string;
  readonly calibrationVersionRefs: readonly string[];
  readonly identityConfidenceAssessmentRef: string | null;
  readonly destinationConfidenceAssessmentRef: string | null;
  readonly candidateSetRef: string | null;
  readonly bestCandidateRef: string | null;
  readonly runnerUpCandidateRef: string | null;
  readonly lowerBoundsUsed: {
    readonly LCB_id_alpha: number;
    readonly UCB_runner_up_alpha: number;
    readonly LCB_dest_alpha: number;
    readonly seededLowerBound: number;
    readonly gap_id: number;
  };
  readonly thresholdValues: {
    readonly tau_id: number;
    readonly tau_runner_up: number;
    readonly delta_id: number;
    readonly tau_dest: number;
    readonly tau_seeded: number;
    readonly tau_challenge: number;
    readonly tau_runner_up_challenge: number;
    readonly delta_challenge: number;
  };
  readonly reasonCodes: readonly string[];
  readonly nextAllowedContinuationPosture: TelephonyContinuationPosture;
  readonly submittedEvidencePackageRef: string | null;
  readonly authoritySubmissionRef: string | null;
  readonly localBindingMutation: "forbidden";
  readonly decidedAt: string;
}

export interface TelephonyCandidateEvidencePackage {
  readonly evidencePackageRef: string;
  readonly schemaVersion: typeof TELEPHONY_VERIFICATION_SCHEMA_VERSION;
  readonly policyVersion: typeof TELEPHONY_VERIFICATION_POLICY_VERSION;
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly subjectRef: string;
  readonly candidatePatientRef: string;
  readonly identityConfidenceAssessmentRef: string;
  readonly destinationConfidenceAssessmentRef: string;
  readonly captureAttemptRefs: readonly string[];
  readonly vaultEvidenceRefs: readonly string[];
  readonly thresholdProfileRef: string;
  readonly calibrationVersionRefs: readonly string[];
  readonly bindingAuthorityName: "IdentityBindingAuthority";
  readonly bindingMutationAuthority: "IdentityBindingAuthority";
  readonly localBindingMutation: "forbidden";
  readonly reasonCodes: readonly string[];
  readonly packagedAt: string;
}

export interface TelephonyVerificationAuthoritySubmission {
  readonly authoritySubmissionRef: string;
  readonly evidencePackageRef: string;
  readonly accepted: boolean;
  readonly settlementRef: string | null;
  readonly bindingVersionRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly submittedAt: string;
}

export interface SubmitTelephonyCandidateEvidenceInput {
  readonly evidencePackage: TelephonyCandidateEvidencePackage;
  readonly identityAssessment: TelephonyIdentityConfidenceAssessment;
  readonly destinationAssessment: TelephonyDestinationConfidenceAssessment;
  readonly decisionReasonCodes: readonly string[];
  readonly submittedAt: string;
}

export interface TelephonyIdentityBindingAuthorityPort {
  submitCandidateEvidencePackage(
    input: SubmitTelephonyCandidateEvidenceInput,
  ): Promise<TelephonyVerificationAuthoritySubmission>;
}

export interface TelephonyVerificationThresholdProfile {
  readonly thresholdProfileRef: string;
  readonly thresholdVersionRef: typeof TELEPHONY_VERIFICATION_THRESHOLD_VERSION;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly calibrationState: TelephonyCalibrationState;
  readonly alphaId: number;
  readonly alphaDest: number;
  readonly identityMargin: number;
  readonly destinationMargin: number;
  readonly seededMargin: number;
  readonly tau_id: number;
  readonly tau_runner_up: number;
  readonly delta_id: number;
  readonly tau_dest: number;
  readonly tau_seeded: number;
  readonly tau_challenge: number;
  readonly tau_runner_up_challenge: number;
  readonly delta_challenge: number;
  readonly identityCoefficients: {
    readonly gamma_0: number;
    readonly nhsNumberAgreement: number;
    readonly dateOfBirthAgreement: number;
    readonly surnameSimilarity: number;
    readonly postcodeFragmentMatch: number;
    readonly verifiedCallbackSuccess: number;
    readonly ivrConsistency: number;
    readonly callerIdHint: number;
    readonly handsetStepUpProof: number;
    readonly operatorCorrectionSupport: number;
  };
  readonly destinationCoefficients: {
    readonly eta_0: number;
    readonly verified_number_on_patient: number;
    readonly handset_step_up_success: number;
    readonly fresh_channel_control_proof: number;
  };
  readonly maximumCallerIdContribution: 0.25;
  readonly minimumNonCallerIdEvidenceCount: number;
  readonly createdAt: string;
}

export interface TelephonyVerificationCalibrationRepository {
  getThresholdProfile(
    routeSensitivity: RouteSensitivityFamily,
  ): Promise<TelephonyVerificationThresholdProfile | null>;
}

export interface TelephonyVerificationRepository {
  getCaptureAttemptByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<TelephonyIdentifierCaptureAttempt | null>;
  saveCaptureAttempt(attempt: TelephonyIdentifierCaptureAttempt): Promise<void>;
  listCaptureAttempts(callSessionRef: string): Promise<readonly TelephonyIdentifierCaptureAttempt[]>;
  listPatientIndexRecords(): Promise<readonly TelephonyPatientCandidateRecord[]>;
  saveCandidateSet(candidateSet: TelephonyCandidateSet): Promise<void>;
  saveIdentityAssessment(assessment: TelephonyIdentityConfidenceAssessment): Promise<void>;
  saveDestinationAssessment(assessment: TelephonyDestinationConfidenceAssessment): Promise<void>;
  saveEvidencePackage(evidencePackage: TelephonyCandidateEvidencePackage): Promise<void>;
  saveAuthoritySubmission(submission: TelephonyVerificationAuthoritySubmission): Promise<void>;
  saveDecision(decision: TelephonyVerificationDecision): Promise<void>;
}

export interface EvaluateTelephonyVerificationInput {
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly subjectRef: string;
  readonly targetDestinationHash?: string | null;
  readonly actorRef: string;
  readonly idempotencyKey: string;
  readonly observedAt?: string;
}

export interface EvaluateTelephonyVerificationResult {
  readonly candidateSet: TelephonyCandidateSet;
  readonly candidates: readonly TelephonyResolvedCandidate[];
  readonly identityAssessment: TelephonyIdentityConfidenceAssessment | null;
  readonly destinationAssessment: TelephonyDestinationConfidenceAssessment | null;
  readonly evidencePackage: TelephonyCandidateEvidencePackage | null;
  readonly authoritySubmission: TelephonyVerificationAuthoritySubmission | null;
  readonly decision: TelephonyVerificationDecision;
}

export interface TelephonyVerificationService {
  appendIdentifierCapture(
    input: AppendTelephonyIdentifierCaptureInput,
  ): Promise<TelephonyIdentifierCaptureAttempt>;
  evaluateVerification(
    input: EvaluateTelephonyVerificationInput,
  ): Promise<EvaluateTelephonyVerificationResult>;
}

export interface TelephonyVerificationApplication {
  readonly service: TelephonyVerificationService;
  readonly repository: TelephonyVerificationRepository;
  readonly calibrationRepository: TelephonyVerificationCalibrationRepository;
  readonly authorityPort: TelephonyIdentityBindingAuthorityPort;
  readonly migrationPlanRef: (typeof telephonyVerificationMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof telephonyVerificationMigrationPlanRefs;
  readonly persistenceTables: typeof telephonyVerificationPersistenceTables;
  readonly gapResolutions: typeof telephonyVerificationGapResolutions;
}

interface NormalizedCaptureValue {
  readonly normalizedValue: string;
  readonly normalizedValueHash: string | null;
  readonly maskedFragment: string;
  readonly validationResult: TelephonyIdentifierValidationResult;
  readonly booleanPosture: "success" | "failed" | "consistent" | "contradiction" | "not_applicable";
  readonly reasonCodes: readonly string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, stableValue(record[key])]),
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(stableJson(value)).slice(0, 32)}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function roundConfidence(value: number): number {
  return Number(value.toFixed(6));
}

function logOdds(probability: number): number {
  return Math.log(
    (probability + TELEPHONY_VERIFICATION_EPSILON) /
      (1 - probability + TELEPHONY_VERIFICATION_EPSILON),
  );
}

function sourceChannelForCapture(source: TelephonyCaptureSource): IdentityEvidenceSourceChannel {
  if (source === "operator") return "staff";
  if (source === "provider_callback") return "system";
  if (source === "handset_step_up") return "sms";
  return "ivr";
}

function fieldOrderIndex(fieldFamily: TelephonyIdentifierFieldFamily): number {
  const index = controlledTelephonyIdentifierCaptureOrder.indexOf(fieldFamily);
  if (index < 0) return controlledTelephonyIdentifierCaptureOrder.length;
  return index + 1;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeString(rawValue: unknown): string {
  if (typeof rawValue === "string") return rawValue.trim();
  if (typeof rawValue === "number" || typeof rawValue === "boolean") return String(rawValue);
  return stableJson(rawValue);
}

function normalizeBooleanPosture(rawValue: unknown): NormalizedCaptureValue["booleanPosture"] {
  if (typeof rawValue === "boolean") return rawValue ? "success" : "failed";
  const value = normalizeString(rawValue).toLowerCase();
  if (["true", "yes", "success", "passed", "verified", "matched"].includes(value)) {
    return "success";
  }
  if (["consistent", "same_menu", "same_caller"].includes(value)) return "consistent";
  if (["contradiction", "inconsistent", "mismatch"].includes(value)) return "contradiction";
  return "failed";
}

function maskDigits(value: string, visible = 4): string {
  if (!value) return "not supplied";
  const suffix = value.slice(-visible);
  return `ending ${suffix}`;
}

export function telephonyVerificationHashIdentifier(
  fieldFamily: TelephonyIdentifierFieldFamily,
  rawValue: unknown,
): string {
  return normalizeCaptureValue(fieldFamily, rawValue).normalizedValueHash ?? "";
}

function hashNormalizedValue(fieldFamily: TelephonyIdentifierFieldFamily, normalizedValue: string): string {
  return `sha256:${sha256(`${fieldFamily}:${normalizedValue}`)}`;
}

function normalizeCaptureValue(
  fieldFamily: TelephonyIdentifierFieldFamily,
  rawValue: unknown,
): NormalizedCaptureValue {
  if (fieldFamily === "nhs_number") {
    const normalizedValue = digitsOnly(normalizeString(rawValue));
    const valid = normalizedValue.length === 10;
    return {
      normalizedValue,
      normalizedValueHash: valid ? hashNormalizedValue(fieldFamily, normalizedValue) : null,
      maskedFragment: valid ? `NHS ${maskDigits(normalizedValue, 3)}` : "NHS number invalid",
      validationResult: valid ? "valid" : "invalid_format",
      booleanPosture: "not_applicable",
      reasonCodes: valid
        ? ["TEL_VERIFY_189_NHS_NUMBER_CAPTURED_TO_VAULT"]
        : ["TEL_VERIFY_189_NHS_NUMBER_INVALID_FORMAT"],
    };
  }

  if (fieldFamily === "date_of_birth") {
    const raw = normalizeString(rawValue);
    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : raw.replaceAll("/", "-");
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue);
    return {
      normalizedValue,
      normalizedValueHash: valid ? hashNormalizedValue(fieldFamily, normalizedValue) : null,
      maskedFragment: valid ? `DOB year ${normalizedValue.slice(0, 4)}` : "DOB invalid",
      validationResult: valid ? "valid" : "invalid_format",
      booleanPosture: "not_applicable",
      reasonCodes: valid
        ? ["TEL_VERIFY_189_DOB_CAPTURED_TO_VAULT"]
        : ["TEL_VERIFY_189_DOB_INVALID_FORMAT"],
    };
  }

  if (fieldFamily === "surname") {
    const normalizedValue = normalizeString(rawValue).toUpperCase().replace(/[^A-Z]/g, "");
    const valid = normalizedValue.length >= 2;
    return {
      normalizedValue,
      normalizedValueHash: valid ? hashNormalizedValue(fieldFamily, normalizedValue) : null,
      maskedFragment: valid ? `surname ${normalizedValue[0] ?? "*"}***` : "surname invalid",
      validationResult: valid ? "valid" : "invalid_format",
      booleanPosture: "not_applicable",
      reasonCodes: valid
        ? ["TEL_VERIFY_189_SURNAME_CAPTURED_TO_VAULT"]
        : ["TEL_VERIFY_189_SURNAME_INVALID_FORMAT"],
    };
  }

  if (fieldFamily === "postcode") {
    const compact = normalizeString(rawValue).toUpperCase().replace(/\s/g, "");
    const normalizedValue = compact.slice(0, Math.min(4, compact.length));
    const valid = /^[A-Z]{1,2}\d[A-Z\d]?$/.test(normalizedValue);
    return {
      normalizedValue,
      normalizedValueHash: valid ? hashNormalizedValue(fieldFamily, normalizedValue) : null,
      maskedFragment: valid ? `postcode ${normalizedValue.slice(0, 2)}**` : "postcode invalid",
      validationResult: valid ? "valid" : "invalid_format",
      booleanPosture: "not_applicable",
      reasonCodes: valid
        ? ["TEL_VERIFY_189_POSTCODE_FRAGMENT_CAPTURED_TO_VAULT"]
        : ["TEL_VERIFY_189_POSTCODE_FRAGMENT_INVALID_FORMAT"],
    };
  }

  if (fieldFamily === "caller_id_hint") {
    const normalizedValue = digitsOnly(normalizeString(rawValue));
    const valid = normalizedValue.length >= 8;
    return {
      normalizedValue,
      normalizedValueHash: valid ? hashNormalizedValue(fieldFamily, normalizedValue) : null,
      maskedFragment: valid ? `caller ${maskDigits(normalizedValue)}` : "caller ID unavailable",
      validationResult: valid ? "valid" : "invalid_format",
      booleanPosture: "not_applicable",
      reasonCodes: valid
        ? ["TEL_VERIFY_189_CALLER_ID_HINT_CAPTURED_WEAK_ONLY"]
        : ["TEL_VERIFY_189_CALLER_ID_HINT_INVALID_FORMAT"],
    };
  }

  if (fieldFamily === "operator_correction") {
    const normalizedValue = normalizeString(rawValue).toLowerCase();
    return {
      normalizedValue,
      normalizedValueHash: hashNormalizedValue(fieldFamily, normalizedValue),
      maskedFragment: "operator correction recorded",
      validationResult: "operator_correction_recorded",
      booleanPosture: normalizedValue.includes("contradiction") ? "contradiction" : "success",
      reasonCodes: ["TEL_VERIFY_189_OPERATOR_CORRECTION_APPENDED"],
    };
  }

  const posture = normalizeBooleanPosture(rawValue);
  const normalizedValue = posture;
  const reasonByFamily: Record<
    "verified_callback" | "handset_step_up_proof" | "ivr_consistency",
    string
  > = {
    verified_callback: "TEL_VERIFY_189_VERIFIED_CALLBACK_CAPTURED",
    handset_step_up_proof: "TEL_VERIFY_189_HANDSET_STEP_UP_CAPTURED",
    ivr_consistency: "TEL_VERIFY_189_IVR_CONSISTENCY_CAPTURED",
  };
  return {
    normalizedValue,
    normalizedValueHash: hashNormalizedValue(fieldFamily, normalizedValue),
    maskedFragment: `${fieldFamily.replaceAll("_", " ")} ${posture}`,
    validationResult: posture === "contradiction" ? "contradictory_identifier" : "valid",
    booleanPosture: posture,
    reasonCodes: [reasonByFamily[fieldFamily]],
  };
}

function cloneCaptureAttempt(
  attempt: TelephonyIdentifierCaptureAttempt,
): TelephonyIdentifierCaptureAttempt {
  return Object.freeze({
    ...attempt,
    reasonCodes: Object.freeze([...attempt.reasonCodes]),
  });
}

function cloneCandidateRecord(
  record: TelephonyPatientCandidateRecord,
): TelephonyPatientCandidateRecord {
  return Object.freeze({
    ...record,
    identityAttributeHashes: Object.freeze({ ...record.identityAttributeHashes }),
    destinationHashes: Object.freeze({ ...record.destinationHashes }),
  });
}

function cloneCandidate(candidate: TelephonyResolvedCandidate): TelephonyResolvedCandidate {
  return Object.freeze({
    ...candidate,
    matchedFeatureKeys: Object.freeze([...candidate.matchedFeatureKeys]),
    record: cloneCandidateRecord(candidate.record),
  });
}

function cloneCandidateSet(candidateSet: TelephonyCandidateSet): TelephonyCandidateSet {
  return Object.freeze({
    ...candidateSet,
    candidateRefs: Object.freeze([...candidateSet.candidateRefs]),
  });
}

function cloneFeatureVector(
  featureVector: TelephonyIdentityFeatureVector,
): TelephonyIdentityFeatureVector {
  return Object.freeze({ ...featureVector });
}

function cloneCandidateScore(score: TelephonyIdentityCandidateScore): TelephonyIdentityCandidateScore {
  return Object.freeze({
    ...score,
    featureVector: cloneFeatureVector(score.featureVector),
    reasonCodes: Object.freeze([...score.reasonCodes]),
  });
}

function cloneIdentityAssessment(
  assessment: TelephonyIdentityConfidenceAssessment,
): TelephonyIdentityConfidenceAssessment {
  return Object.freeze({
    ...assessment,
    candidateScores: Object.freeze(assessment.candidateScores.map(cloneCandidateScore)),
    reasonCodes: Object.freeze([...assessment.reasonCodes]),
  });
}

function cloneDestinationAssessment(
  assessment: TelephonyDestinationConfidenceAssessment,
): TelephonyDestinationConfidenceAssessment {
  return Object.freeze({
    ...assessment,
    destinationFeatureVector: Object.freeze({ ...assessment.destinationFeatureVector }),
    reasonCodes: Object.freeze([...assessment.reasonCodes]),
  });
}

function cloneEvidencePackage(
  evidencePackage: TelephonyCandidateEvidencePackage,
): TelephonyCandidateEvidencePackage {
  return Object.freeze({
    ...evidencePackage,
    captureAttemptRefs: Object.freeze([...evidencePackage.captureAttemptRefs]),
    vaultEvidenceRefs: Object.freeze([...evidencePackage.vaultEvidenceRefs]),
    calibrationVersionRefs: Object.freeze([...evidencePackage.calibrationVersionRefs]),
    reasonCodes: Object.freeze([...evidencePackage.reasonCodes]),
  });
}

function cloneAuthoritySubmission(
  submission: TelephonyVerificationAuthoritySubmission,
): TelephonyVerificationAuthoritySubmission {
  return Object.freeze({
    ...submission,
    reasonCodes: Object.freeze([...submission.reasonCodes]),
  });
}

function cloneDecision(decision: TelephonyVerificationDecision): TelephonyVerificationDecision {
  return Object.freeze({
    ...decision,
    calibrationVersionRefs: Object.freeze([...decision.calibrationVersionRefs]),
    lowerBoundsUsed: Object.freeze({ ...decision.lowerBoundsUsed }),
    thresholdValues: Object.freeze({ ...decision.thresholdValues }),
    reasonCodes: Object.freeze([...decision.reasonCodes]),
  });
}

function matchedFeatureKeys(
  capturesByFamily: Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>,
  candidate: TelephonyPatientCandidateRecord,
): TelephonyIdentifierFieldFamily[] {
  const keys: TelephonyIdentifierFieldFamily[] = [];
  const identity = candidate.identityAttributeHashes;
  const destination = candidate.destinationHashes;
  if (
    capturesByFamily.get("nhs_number")?.normalizedValueHash &&
    capturesByFamily.get("nhs_number")?.normalizedValueHash === identity.nhsNumberHash
  ) {
    keys.push("nhs_number");
  }
  if (
    capturesByFamily.get("date_of_birth")?.normalizedValueHash &&
    capturesByFamily.get("date_of_birth")?.normalizedValueHash === identity.dateOfBirthHash
  ) {
    keys.push("date_of_birth");
  }
  if (
    capturesByFamily.get("surname")?.normalizedValueHash &&
    capturesByFamily.get("surname")?.normalizedValueHash === identity.surnameHash
  ) {
    keys.push("surname");
  }
  if (
    capturesByFamily.get("postcode")?.normalizedValueHash &&
    capturesByFamily.get("postcode")?.normalizedValueHash === identity.postcodeHash
  ) {
    keys.push("postcode");
  }
  const callerHash = capturesByFamily.get("caller_id_hint")?.normalizedValueHash ?? null;
  if (
    callerHash &&
    (callerHash === identity.callerIdHintHash ||
      callerHash === destination.verifiedSmsDestinationHash ||
      callerHash === destination.verifiedCallbackNumberHash)
  ) {
    keys.push("caller_id_hint");
  }
  return keys;
}

function latestCaptureByFamily(
  captures: readonly TelephonyIdentifierCaptureAttempt[],
): Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt> {
  const result = new Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>();
  for (const capture of [...captures].sort((left, right) =>
    left.capturedAt.localeCompare(right.capturedAt),
  )) {
    result.set(capture.fieldFamily, capture);
  }
  return result;
}

function resolveCandidates(
  captures: readonly TelephonyIdentifierCaptureAttempt[],
  patientIndexRecords: readonly TelephonyPatientCandidateRecord[],
): readonly TelephonyResolvedCandidate[] {
  const capturesByFamily = latestCaptureByFamily(captures);
  return patientIndexRecords
    .map((record) => ({
      record,
      matchedKeys: matchedFeatureKeys(capturesByFamily, record),
    }))
    .filter((entry) => entry.matchedKeys.length > 0)
    .sort((left, right) => {
      const rankDelta = right.matchedKeys.length - left.matchedKeys.length;
      if (rankDelta !== 0) return rankDelta;
      return left.record.candidatePatientRef.localeCompare(right.record.candidatePatientRef);
    })
    .slice(0, 8)
    .map((entry, index) =>
      Object.freeze({
        candidatePatientRef: entry.record.candidatePatientRef,
        candidateLabel: entry.record.candidateLabel,
        patientLinkCandidateRef: entry.record.patientLinkCandidateRef ?? null,
        candidateRank: index + 1,
        matchedFeatureKeys: Object.freeze([...entry.matchedKeys]),
        record: cloneCandidateRecord(entry.record),
      }),
    );
}

function captureMatchesCandidate(
  capturesByFamily: Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>,
  fieldFamily: TelephonyIdentifierFieldFamily,
  expectedHash: string | null | undefined,
): number {
  const actualHash = capturesByFamily.get(fieldFamily)?.normalizedValueHash ?? null;
  return actualHash && expectedHash && actualHash === expectedHash ? 1 : 0;
}

function captureBooleanSuccess(
  capturesByFamily: Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>,
  fieldFamily: TelephonyIdentifierFieldFamily,
): number {
  const capture = capturesByFamily.get(fieldFamily);
  if (!capture?.normalizedValueHash) return 0;
  const successHash = hashNormalizedValue(fieldFamily, fieldFamily === "ivr_consistency" ? "consistent" : "success");
  return capture.normalizedValueHash === successHash ? 1 : 0;
}

function captureContradictionPresent(
  captures: readonly TelephonyIdentifierCaptureAttempt[],
): boolean {
  return captures.some(
    (capture) =>
      capture.validationResult === "contradictory_identifier" ||
      capture.reasonCodes.includes("TEL_VERIFY_189_OPERATOR_CORRECTION_APPENDED") &&
        capture.maskedFragment.includes("contradiction"),
  );
}

function identityFeatureVectorForCandidate(
  capturesByFamily: Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>,
  candidate: TelephonyResolvedCandidate,
  profile: TelephonyVerificationThresholdProfile,
): TelephonyIdentityFeatureVector {
  const identity = candidate.record.identityAttributeHashes;
  const destination = candidate.record.destinationHashes;
  const callerHash = capturesByFamily.get("caller_id_hint")?.normalizedValueHash ?? null;
  const callerIdMatches = Boolean(
    callerHash &&
      (callerHash === identity.callerIdHintHash ||
        callerHash === destination.verifiedSmsDestinationHash ||
        callerHash === destination.verifiedCallbackNumberHash),
  );
  const verifiedCallbackSuccess =
    captureBooleanSuccess(capturesByFamily, "verified_callback") && callerIdMatches ? 1 : 0;
  const callerIdHint = callerIdMatches ? profile.maximumCallerIdContribution : 0;
  const operatorCorrection = capturesByFamily.has("operator_correction") ? 0.2 : 0;

  return Object.freeze({
    nhsNumberAgreement: captureMatchesCandidate(
      capturesByFamily,
      "nhs_number",
      identity.nhsNumberHash,
    ),
    dateOfBirthAgreement: captureMatchesCandidate(
      capturesByFamily,
      "date_of_birth",
      identity.dateOfBirthHash,
    ),
    surnameSimilarity: captureMatchesCandidate(capturesByFamily, "surname", identity.surnameHash),
    postcodeFragmentMatch: captureMatchesCandidate(
      capturesByFamily,
      "postcode",
      identity.postcodeHash,
    ),
    verifiedCallbackSuccess,
    ivrConsistency: captureBooleanSuccess(capturesByFamily, "ivr_consistency"),
    callerIdHint,
    handsetStepUpProof: captureBooleanSuccess(capturesByFamily, "handset_step_up_proof"),
    operatorCorrectionSupport: operatorCorrection,
  });
}

function scoreIdentityCandidate(input: {
  readonly callSessionRef: string;
  readonly candidate: TelephonyResolvedCandidate;
  readonly capturesByFamily: Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>;
  readonly profile: TelephonyVerificationThresholdProfile;
}): TelephonyIdentityCandidateScore {
  const featureVector = identityFeatureVectorForCandidate(
    input.capturesByFamily,
    input.candidate,
    input.profile,
  );
  const gamma = input.profile.identityCoefficients;
  const z_id =
    gamma.gamma_0 +
    gamma.nhsNumberAgreement * featureVector.nhsNumberAgreement +
    gamma.dateOfBirthAgreement * featureVector.dateOfBirthAgreement +
    gamma.surnameSimilarity * featureVector.surnameSimilarity +
    gamma.postcodeFragmentMatch * featureVector.postcodeFragmentMatch +
    gamma.verifiedCallbackSuccess * featureVector.verifiedCallbackSuccess +
    gamma.ivrConsistency * featureVector.ivrConsistency +
    gamma.callerIdHint * featureVector.callerIdHint +
    gamma.handsetStepUpProof * featureVector.handsetStepUpProof +
    gamma.operatorCorrectionSupport * featureVector.operatorCorrectionSupport;
  const P_id = roundConfidence(sigmoid(z_id));
  const LCB_id_alpha = roundConfidence(clamp01(P_id - input.profile.identityMargin));
  const UCB_id_alpha = roundConfidence(clamp01(P_id + input.profile.identityMargin));
  const nonCallerIdPositiveFeatureCount = [
    featureVector.nhsNumberAgreement,
    featureVector.dateOfBirthAgreement,
    featureVector.surnameSimilarity,
    featureVector.postcodeFragmentMatch,
    featureVector.verifiedCallbackSuccess,
    featureVector.ivrConsistency,
    featureVector.handsetStepUpProof,
    featureVector.operatorCorrectionSupport,
  ].filter((value) => value > 0).length;
  const callerIdOnly = featureVector.callerIdHint > 0 && nonCallerIdPositiveFeatureCount === 0;
  const reasonCodes = [
    "TEL_VERIFY_189_IDENTITY_Z_ID_COMPUTED",
    "TEL_VERIFY_189_IDENTITY_CALIBRATED_PROBABILITY_COMPUTED",
  ];
  if (callerIdOnly) reasonCodes.push("TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED");
  return Object.freeze({
    candidatePatientRef: input.candidate.candidatePatientRef,
    candidateRank: input.candidate.candidateRank,
    featureVector,
    z_id: roundConfidence(z_id),
    P_id,
    LCB_id_alpha,
    UCB_id_alpha,
    nonCallerIdPositiveFeatureCount,
    callerIdOnly,
    reasonCodes: Object.freeze(reasonCodes),
  });
}

function buildIdentityAssessment(input: {
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly candidateSet: TelephonyCandidateSet;
  readonly candidates: readonly TelephonyResolvedCandidate[];
  readonly captures: readonly TelephonyIdentifierCaptureAttempt[];
  readonly profile: TelephonyVerificationThresholdProfile;
  readonly assessedAt: string;
}): TelephonyIdentityConfidenceAssessment {
  const capturesByFamily = latestCaptureByFamily(input.captures);
  const candidateScores = input.candidates
    .map((candidate) =>
      scoreIdentityCandidate({
        callSessionRef: input.callSessionRef,
        candidate,
        capturesByFamily,
        profile: input.profile,
      }),
    )
    .sort((left, right) => {
      const scoreDelta = right.P_id - left.P_id;
      if (scoreDelta !== 0) return scoreDelta;
      return left.candidatePatientRef.localeCompare(right.candidatePatientRef);
    });
  const best = candidateScores[0] ?? null;
  const runnerUp = candidateScores[1] ?? null;
  const bestPId = best?.P_id ?? 0;
  const runnerUpPId = runnerUp?.P_id ?? 0;
  const gap_id = roundConfidence(logOdds(bestPId) - logOdds(runnerUpPId));
  const callerIdOnlyBlocked = candidateScores.some((score) => score.callerIdOnly);
  const reasonCodes = [
    "TEL_VERIFY_189_GAP_ID_COMPUTED_WITH_EPSILON_1E_6",
    "TEL_VERIFY_189_CONFIDENCE_BOUNDS_COMPUTED",
  ];
  if (callerIdOnlyBlocked) reasonCodes.push("TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED");
  return Object.freeze({
    identityConfidenceAssessmentRef: deterministicId("tida", {
      callSessionRef: input.callSessionRef,
      candidateSetRef: input.candidateSet.candidateSetRef,
      candidateScores,
    }),
    schemaVersion: TELEPHONY_VERIFICATION_SCHEMA_VERSION,
    policyVersion: TELEPHONY_VERIFICATION_POLICY_VERSION,
    callSessionRef: input.callSessionRef,
    candidateSetRef: input.candidateSet.candidateSetRef,
    routeSensitivity: input.routeSensitivity,
    calibrationVersionRef: TELEPHONY_VERIFICATION_ID_CALIBRATION_VERSION,
    thresholdProfileRef: input.profile.thresholdProfileRef,
    alphaId: input.profile.alphaId,
    candidateScores: Object.freeze(candidateScores.map(cloneCandidateScore)),
    bestCandidateRef: best?.candidatePatientRef ?? null,
    runnerUpCandidateRef: runnerUp?.candidatePatientRef ?? null,
    bestPId,
    bestLcbIdAlpha: best?.LCB_id_alpha ?? 0,
    bestUcbIdAlpha: best?.UCB_id_alpha ?? 0,
    runnerUpPId,
    runnerUpUcbIdAlpha: runnerUp?.UCB_id_alpha ?? 0,
    gap_id,
    callerIdOnlyBlocked,
    reasonCodes: Object.freeze(reasonCodes),
    assessedAt: input.assessedAt,
  });
}

function destinationFeatureVectorForCandidate(input: {
  readonly capturesByFamily: Map<TelephonyIdentifierFieldFamily, TelephonyIdentifierCaptureAttempt>;
  readonly candidate: TelephonyResolvedCandidate | null;
  readonly targetDestinationHash: string | null;
}): TelephonyDestinationFeatureVector {
  const verifiedCallback = captureBooleanSuccess(input.capturesByFamily, "verified_callback");
  const handsetStepUp = captureBooleanSuccess(input.capturesByFamily, "handset_step_up_proof");
  const destinationHashes = input.candidate?.record.destinationHashes ?? {};
  const targetHash = input.targetDestinationHash;
  const verifiedNumberOnPatient =
    targetHash &&
      (targetHash === destinationHashes.verifiedSmsDestinationHash ||
        targetHash === destinationHashes.verifiedCallbackNumberHash)
      ? 1
      : 0;
  const freshControlProof = verifiedCallback || handsetStepUp ? 1 : 0;
  return Object.freeze({
    verified_number_on_patient: verifiedNumberOnPatient,
    handset_step_up_success: handsetStepUp,
    fresh_channel_control_proof: freshControlProof,
  });
}

function buildDestinationAssessment(input: {
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly captures: readonly TelephonyIdentifierCaptureAttempt[];
  readonly candidate: TelephonyResolvedCandidate | null;
  readonly targetDestinationHash: string | null;
  readonly identityAssessment: TelephonyIdentityConfidenceAssessment;
  readonly profile: TelephonyVerificationThresholdProfile;
  readonly assessedAt: string;
}): TelephonyDestinationConfidenceAssessment {
  const capturesByFamily = latestCaptureByFamily(input.captures);
  const destinationFeatureVector = destinationFeatureVectorForCandidate({
    capturesByFamily,
    candidate: input.candidate,
    targetDestinationHash: input.targetDestinationHash,
  });
  const eta = input.profile.destinationCoefficients;
  const z_dest =
    eta.eta_0 +
    eta.verified_number_on_patient * destinationFeatureVector.verified_number_on_patient +
    eta.handset_step_up_success * destinationFeatureVector.handset_step_up_success +
    eta.fresh_channel_control_proof * destinationFeatureVector.fresh_channel_control_proof;
  const P_dest = roundConfidence(sigmoid(z_dest));
  const LCB_dest_alpha = roundConfidence(clamp01(P_dest - input.profile.destinationMargin));
  const P_seed_lower = roundConfidence(
    Math.max(0, input.identityAssessment.bestLcbIdAlpha + LCB_dest_alpha - 1),
  );
  return Object.freeze({
    destinationConfidenceAssessmentRef: deterministicId("tdca", {
      callSessionRef: input.callSessionRef,
      candidatePatientRef: input.candidate?.candidatePatientRef ?? null,
      destinationFeatureVector,
      identityRef: input.identityAssessment.identityConfidenceAssessmentRef,
    }),
    schemaVersion: TELEPHONY_VERIFICATION_SCHEMA_VERSION,
    policyVersion: TELEPHONY_VERIFICATION_POLICY_VERSION,
    callSessionRef: input.callSessionRef,
    routeSensitivity: input.routeSensitivity,
    candidatePatientRef: input.candidate?.candidatePatientRef ?? null,
    calibrationVersionRef: TELEPHONY_VERIFICATION_DEST_CALIBRATION_VERSION,
    seedCalibrationVersionRef: TELEPHONY_VERIFICATION_SEED_MODEL_VERSION,
    thresholdProfileRef: input.profile.thresholdProfileRef,
    alphaDest: input.profile.alphaDest,
    destinationFeatureVector,
    z_dest: roundConfidence(z_dest),
    P_dest,
    LCB_dest_alpha,
    P_seed: null,
    LCB_seed_alpha: null,
    P_seed_lower,
    seedLowerBoundMethod: "dependence_safe_frechet_lower_bound",
    reasonCodes: Object.freeze([
      "TEL_VERIFY_189_DESTINATION_Z_DEST_COMPUTED",
      "TEL_VERIFY_189_DESTINATION_SEPARATE_FROM_IDENTITY",
      "TEL_VERIFY_189_SEEDED_LOWER_BOUND_FRECHET_USED",
    ]),
    assessedAt: input.assessedAt,
  });
}

function profileAllowsSeeded(profile: TelephonyVerificationThresholdProfile): boolean {
  return profile.calibrationState === "validated_seeded";
}

function profileAllowsChallenge(profile: TelephonyVerificationThresholdProfile): boolean {
  return profile.calibrationState === "validated_seeded" || profile.calibrationState === "challenge_only";
}

function thresholdsForDecision(profile: TelephonyVerificationThresholdProfile): TelephonyVerificationDecision["thresholdValues"] {
  return Object.freeze({
    tau_id: profile.tau_id,
    tau_runner_up: profile.tau_runner_up,
    delta_id: profile.delta_id,
    tau_dest: profile.tau_dest,
    tau_seeded: profile.tau_seeded,
    tau_challenge: profile.tau_challenge,
    tau_runner_up_challenge: profile.tau_runner_up_challenge,
    delta_challenge: profile.delta_challenge,
  });
}

function decideOutcome(input: {
  readonly profile: TelephonyVerificationThresholdProfile;
  readonly candidates: readonly TelephonyResolvedCandidate[];
  readonly captures: readonly TelephonyIdentifierCaptureAttempt[];
  readonly identityAssessment: TelephonyIdentityConfidenceAssessment | null;
  readonly destinationAssessment: TelephonyDestinationConfidenceAssessment | null;
}): {
  readonly outcome: TelephonyVerificationOutcome;
  readonly posture: TelephonyContinuationPosture;
  readonly reasonCodes: readonly string[];
} {
  if (!profileAllowsChallenge(input.profile)) {
    return {
      outcome: "insufficient_calibration",
      posture: "manual_followup_only",
      reasonCodes: Object.freeze([
        "TEL_VERIFY_189_NO_VALIDATED_CALIBRATION_FAIL_CLOSED",
        "TEL_VERIFY_189_MANUAL_OR_CHALLENGE_ONLY_WHEN_SEED_MODEL_ABSENT",
      ]),
    };
  }

  if (input.captures.length === 0) {
    return {
      outcome: "manual_followup_required",
      posture: "manual_followup_only",
      reasonCodes: Object.freeze(["TEL_VERIFY_189_NO_IDENTIFIER_CAPTURE_ATTEMPTS"]),
    };
  }

  if (captureContradictionPresent(input.captures)) {
    return {
      outcome: "manual_followup_required",
      posture: "manual_followup_only",
      reasonCodes: Object.freeze(["TEL_VERIFY_189_CONTRADICTORY_IDENTIFIER_FAIL_CLOSED"]),
    };
  }

  if (input.candidates.length === 0 || !input.identityAssessment || !input.destinationAssessment) {
    return {
      outcome: "identity_failed",
      posture: "no_continuation",
      reasonCodes: Object.freeze(["TEL_VERIFY_189_NO_LOCAL_PATIENT_CANDIDATE"]),
    };
  }

  const identity = input.identityAssessment;
  const destination = input.destinationAssessment;
  const seededLowerBound = destination.LCB_seed_alpha ?? destination.P_seed_lower;
  const bestScore = identity.candidateScores.find(
    (score) => score.candidatePatientRef === identity.bestCandidateRef,
  );

  if (identity.callerIdOnlyBlocked || bestScore?.callerIdOnly) {
    return {
      outcome: "manual_followup_required",
      posture: "manual_followup_only",
      reasonCodes: Object.freeze([
        "TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED",
        "TEL_VERIFY_189_NON_CALLER_ID_EVIDENCE_REQUIRED",
      ]),
    };
  }

  if (
    bestScore &&
    bestScore.nonCallerIdPositiveFeatureCount < input.profile.minimumNonCallerIdEvidenceCount
  ) {
    return {
      outcome: "manual_followup_required",
      posture: "manual_followup_only",
      reasonCodes: Object.freeze(["TEL_VERIFY_189_INSUFFICIENT_NON_CALLER_ID_EVIDENCE"]),
    };
  }

  const identitySeededPass =
    identity.bestLcbIdAlpha >= input.profile.tau_id &&
    identity.runnerUpUcbIdAlpha <= input.profile.tau_runner_up &&
    identity.gap_id >= input.profile.delta_id;
  const destinationSeededPass =
    destination.LCB_dest_alpha >= input.profile.tau_dest &&
    seededLowerBound >= input.profile.tau_seeded;
  if (profileAllowsSeeded(input.profile) && identitySeededPass && destinationSeededPass) {
    return {
      outcome: "telephony_verified_seeded",
      posture: "seeded_continuation_candidate",
      reasonCodes: Object.freeze([
        "TEL_VERIFY_189_SEEDED_THRESHOLDS_PASSED",
        "TEL_VERIFY_189_LOWER_BOUNDS_AUTHORIZED_SEEDED_POSTURE",
      ]),
    };
  }

  const challengePass =
    identity.bestLcbIdAlpha >= input.profile.tau_challenge &&
    identity.runnerUpUcbIdAlpha <= input.profile.tau_runner_up_challenge &&
    identity.gap_id >= input.profile.delta_challenge;
  if (challengePass && destination.LCB_dest_alpha < input.profile.tau_dest) {
    return {
      outcome: "telephony_verified_challenge",
      posture: "challenge_continuation_only",
      reasonCodes: Object.freeze([
        "TEL_VERIFY_189_IDENTITY_CHALLENGE_THRESHOLDS_PASSED",
        "TEL_VERIFY_189_DESTINATION_BELOW_SEEDED_THRESHOLD",
      ]),
    };
  }

  if (
    identity.runnerUpCandidateRef &&
    (identity.runnerUpUcbIdAlpha > input.profile.tau_runner_up ||
      identity.gap_id < input.profile.delta_challenge)
  ) {
    return {
      outcome: "ambiguous_candidate_set",
      posture: "manual_followup_only",
      reasonCodes: Object.freeze(["TEL_VERIFY_189_AMBIGUOUS_RUNNER_UP_FAIL_CLOSED"]),
    };
  }

  if (identity.bestLcbIdAlpha >= input.profile.tau_challenge && destination.LCB_dest_alpha < input.profile.tau_dest) {
    return {
      outcome: "destination_untrusted",
      posture: "challenge_continuation_only",
      reasonCodes: Object.freeze(["TEL_VERIFY_189_DESTINATION_UNTRUSTED"]),
    };
  }

  return {
    outcome: "manual_followup_required",
    posture: "manual_followup_only",
    reasonCodes: Object.freeze(["TEL_VERIFY_189_MANUAL_FOLLOWUP_DEFAULT_FAIL_CLOSED"]),
  };
}

function buildEvidencePackage(input: {
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly subjectRef: string;
  readonly candidatePatientRef: string;
  readonly captures: readonly TelephonyIdentifierCaptureAttempt[];
  readonly identityAssessment: TelephonyIdentityConfidenceAssessment;
  readonly destinationAssessment: TelephonyDestinationConfidenceAssessment;
  readonly profile: TelephonyVerificationThresholdProfile;
  readonly packagedAt: string;
}): TelephonyCandidateEvidencePackage {
  const captureAttemptRefs = input.captures.map((capture) => capture.captureAttemptRef);
  const vaultEvidenceRefs = input.captures
    .map((capture) => capture.evidenceEnvelopeRef)
    .filter((ref): ref is string => Boolean(ref));
  return Object.freeze({
    evidencePackageRef: deterministicId("tcep", {
      callSessionRef: input.callSessionRef,
      candidatePatientRef: input.candidatePatientRef,
      captureAttemptRefs,
      identityRef: input.identityAssessment.identityConfidenceAssessmentRef,
      destinationRef: input.destinationAssessment.destinationConfidenceAssessmentRef,
    }),
    schemaVersion: TELEPHONY_VERIFICATION_SCHEMA_VERSION,
    policyVersion: TELEPHONY_VERIFICATION_POLICY_VERSION,
    callSessionRef: input.callSessionRef,
    routeSensitivity: input.routeSensitivity,
    subjectRef: input.subjectRef,
    candidatePatientRef: input.candidatePatientRef,
    identityConfidenceAssessmentRef: input.identityAssessment.identityConfidenceAssessmentRef,
    destinationConfidenceAssessmentRef: input.destinationAssessment.destinationConfidenceAssessmentRef,
    captureAttemptRefs: Object.freeze(captureAttemptRefs),
    vaultEvidenceRefs: Object.freeze(vaultEvidenceRefs),
    thresholdProfileRef: input.profile.thresholdProfileRef,
    calibrationVersionRefs: Object.freeze([
      TELEPHONY_VERIFICATION_ID_CALIBRATION_VERSION,
      TELEPHONY_VERIFICATION_DEST_CALIBRATION_VERSION,
      TELEPHONY_VERIFICATION_SEED_MODEL_VERSION,
    ]),
    bindingAuthorityName: "IdentityBindingAuthority",
    bindingMutationAuthority: "IdentityBindingAuthority",
    localBindingMutation: "forbidden",
    reasonCodes: Object.freeze([
      "TEL_VERIFY_189_EVIDENCE_PACKAGE_SUBMITTED_TO_AUTHORITY_PORT",
      "TEL_VERIFY_189_LOCAL_BINDING_MUTATION_FORBIDDEN",
    ]),
    packagedAt: input.packagedAt,
  });
}

function buildDecision(input: {
  readonly callSessionRef: string;
  readonly routeSensitivity: RouteSensitivityFamily;
  readonly candidateSet: TelephonyCandidateSet | null;
  readonly profile: TelephonyVerificationThresholdProfile;
  readonly identityAssessment: TelephonyIdentityConfidenceAssessment | null;
  readonly destinationAssessment: TelephonyDestinationConfidenceAssessment | null;
  readonly outcome: TelephonyVerificationOutcome;
  readonly posture: TelephonyContinuationPosture;
  readonly evidencePackageRef: string | null;
  readonly authoritySubmissionRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly decidedAt: string;
}): TelephonyVerificationDecision {
  const identity = input.identityAssessment;
  const destination = input.destinationAssessment;
  return Object.freeze({
    telephonyVerificationDecisionRef: deterministicId("tvd", {
      callSessionRef: input.callSessionRef,
      outcome: input.outcome,
      identityRef: identity?.identityConfidenceAssessmentRef ?? null,
      destinationRef: destination?.destinationConfidenceAssessmentRef ?? null,
      reasonCodes: input.reasonCodes,
      decidedAt: input.decidedAt,
    }),
    schemaVersion: TELEPHONY_VERIFICATION_SCHEMA_VERSION,
    policyVersion: TELEPHONY_VERIFICATION_POLICY_VERSION,
    callSessionRef: input.callSessionRef,
    routeSensitivity: input.routeSensitivity,
    outcome: input.outcome,
    thresholdProfileRef: input.profile.thresholdProfileRef,
    calibrationVersionRefs: Object.freeze([
      TELEPHONY_VERIFICATION_ID_CALIBRATION_VERSION,
      TELEPHONY_VERIFICATION_DEST_CALIBRATION_VERSION,
      TELEPHONY_VERIFICATION_SEED_MODEL_VERSION,
    ]),
    identityConfidenceAssessmentRef: identity?.identityConfidenceAssessmentRef ?? null,
    destinationConfidenceAssessmentRef: destination?.destinationConfidenceAssessmentRef ?? null,
    candidateSetRef: input.candidateSet?.candidateSetRef ?? null,
    bestCandidateRef: identity?.bestCandidateRef ?? null,
    runnerUpCandidateRef: identity?.runnerUpCandidateRef ?? null,
    lowerBoundsUsed: Object.freeze({
      LCB_id_alpha: identity?.bestLcbIdAlpha ?? 0,
      UCB_runner_up_alpha: identity?.runnerUpUcbIdAlpha ?? 0,
      LCB_dest_alpha: destination?.LCB_dest_alpha ?? 0,
      seededLowerBound: destination?.LCB_seed_alpha ?? destination?.P_seed_lower ?? 0,
      gap_id: identity?.gap_id ?? 0,
    }),
    thresholdValues: thresholdsForDecision(input.profile),
    reasonCodes: Object.freeze(input.reasonCodes),
    nextAllowedContinuationPosture: input.posture,
    submittedEvidencePackageRef: input.evidencePackageRef,
    authoritySubmissionRef: input.authoritySubmissionRef,
    localBindingMutation: "forbidden",
    decidedAt: input.decidedAt,
  });
}

export function createSeedTelephonyVerificationCalibrationRepository(
  profiles: readonly TelephonyVerificationThresholdProfile[] = defaultTelephonyVerificationThresholdProfiles,
): TelephonyVerificationCalibrationRepository {
  const byRoute = new Map<RouteSensitivityFamily, TelephonyVerificationThresholdProfile>();
  for (const profile of profiles) byRoute.set(profile.routeSensitivity, profile);
  return {
    async getThresholdProfile(routeSensitivity) {
      return byRoute.get(routeSensitivity) ?? null;
    },
  };
}

const defaultCreatedAt = "2026-04-15T00:00:00.000Z";

export const defaultTelephonyVerificationThresholdProfiles: readonly TelephonyVerificationThresholdProfile[] =
  Object.freeze([
    Object.freeze({
      thresholdProfileRef: "telephony-verification-threshold-sms-continuation-189.v1",
      thresholdVersionRef: TELEPHONY_VERIFICATION_THRESHOLD_VERSION,
      routeSensitivity: "sms_continuation",
      calibrationState: "validated_seeded",
      alphaId: 0.05,
      alphaDest: 0.05,
      identityMargin: 0.035,
      destinationMargin: 0.04,
      seededMargin: 0.04,
      tau_id: 0.86,
      tau_runner_up: 0.58,
      delta_id: 1.1,
      tau_dest: 0.82,
      tau_seeded: 0.72,
      tau_challenge: 0.68,
      tau_runner_up_challenge: 0.66,
      delta_challenge: 0.45,
      identityCoefficients: Object.freeze({
        gamma_0: -3.1,
        nhsNumberAgreement: 2.4,
        dateOfBirthAgreement: 1.5,
        surnameSimilarity: 1.05,
        postcodeFragmentMatch: 0.8,
        verifiedCallbackSuccess: 0.75,
        ivrConsistency: 0.3,
        callerIdHint: 0.55,
        handsetStepUpProof: 0.5,
        operatorCorrectionSupport: 0.15,
      }),
      destinationCoefficients: Object.freeze({
        eta_0: -2.1,
        verified_number_on_patient: 1.65,
        handset_step_up_success: 1.35,
        fresh_channel_control_proof: 1.1,
      }),
      maximumCallerIdContribution: 0.25,
      minimumNonCallerIdEvidenceCount: 3,
      createdAt: defaultCreatedAt,
    }),
    Object.freeze({
      thresholdProfileRef: "telephony-verification-threshold-public-intake-189.v1",
      thresholdVersionRef: TELEPHONY_VERIFICATION_THRESHOLD_VERSION,
      routeSensitivity: "public_intake",
      calibrationState: "challenge_only",
      alphaId: 0.05,
      alphaDest: 0.05,
      identityMargin: 0.05,
      destinationMargin: 0.06,
      seededMargin: 0.06,
      tau_id: 0.91,
      tau_runner_up: 0.52,
      delta_id: 1.45,
      tau_dest: 0.86,
      tau_seeded: 0.78,
      tau_challenge: 0.66,
      tau_runner_up_challenge: 0.7,
      delta_challenge: 0.4,
      identityCoefficients: Object.freeze({
        gamma_0: -3.15,
        nhsNumberAgreement: 2.25,
        dateOfBirthAgreement: 1.45,
        surnameSimilarity: 1.0,
        postcodeFragmentMatch: 0.7,
        verifiedCallbackSuccess: 0.65,
        ivrConsistency: 0.25,
        callerIdHint: 0.45,
        handsetStepUpProof: 0.45,
        operatorCorrectionSupport: 0.1,
      }),
      destinationCoefficients: Object.freeze({
        eta_0: -2.2,
        verified_number_on_patient: 1.45,
        handset_step_up_success: 1.15,
        fresh_channel_control_proof: 0.95,
      }),
      maximumCallerIdContribution: 0.25,
      minimumNonCallerIdEvidenceCount: 2,
      createdAt: defaultCreatedAt,
    }),
    Object.freeze({
      thresholdProfileRef: "telephony-verification-threshold-future-protected-records-189.v1",
      thresholdVersionRef: TELEPHONY_VERIFICATION_THRESHOLD_VERSION,
      routeSensitivity: "future_protected_records",
      calibrationState: "unvalidated",
      alphaId: 0.05,
      alphaDest: 0.05,
      identityMargin: 0.12,
      destinationMargin: 0.12,
      seededMargin: 0.12,
      tau_id: 0.96,
      tau_runner_up: 0.38,
      delta_id: 2.1,
      tau_dest: 0.95,
      tau_seeded: 0.9,
      tau_challenge: 0.84,
      tau_runner_up_challenge: 0.5,
      delta_challenge: 1.2,
      identityCoefficients: Object.freeze({
        gamma_0: -3.5,
        nhsNumberAgreement: 2.0,
        dateOfBirthAgreement: 1.25,
        surnameSimilarity: 0.9,
        postcodeFragmentMatch: 0.55,
        verifiedCallbackSuccess: 0.5,
        ivrConsistency: 0.2,
        callerIdHint: 0.3,
        handsetStepUpProof: 0.35,
        operatorCorrectionSupport: 0.05,
      }),
      destinationCoefficients: Object.freeze({
        eta_0: -2.5,
        verified_number_on_patient: 1.1,
        handset_step_up_success: 0.9,
        fresh_channel_control_proof: 0.7,
      }),
      maximumCallerIdContribution: 0.25,
      minimumNonCallerIdEvidenceCount: 4,
      createdAt: defaultCreatedAt,
    }),
  ]);

const defaultUnvalidatedThresholdProfile = defaultTelephonyVerificationThresholdProfiles[2] as
  | TelephonyVerificationThresholdProfile
  | undefined;

function missingThresholdProfileForRoute(
  routeSensitivity: RouteSensitivityFamily,
): TelephonyVerificationThresholdProfile {
  if (!defaultUnvalidatedThresholdProfile) {
    throw new Error("TELEPHONY_VERIFICATION_DEFAULT_PROFILE_MISSING");
  }
  return Object.freeze({
    ...defaultUnvalidatedThresholdProfile,
    routeSensitivity,
    thresholdProfileRef: `telephony-verification-threshold-missing-${routeSensitivity}-189.v1`,
    calibrationState: "unvalidated",
  });
}

export function createInMemoryTelephonyVerificationRepository(options?: {
  readonly patientIndexRecords?: readonly TelephonyPatientCandidateRecord[];
}): TelephonyVerificationRepository & {
  snapshots(): {
    readonly captureAttempts: readonly TelephonyIdentifierCaptureAttempt[];
    readonly candidateSets: readonly TelephonyCandidateSet[];
    readonly identityAssessments: readonly TelephonyIdentityConfidenceAssessment[];
    readonly destinationAssessments: readonly TelephonyDestinationConfidenceAssessment[];
    readonly evidencePackages: readonly TelephonyCandidateEvidencePackage[];
    readonly authoritySubmissions: readonly TelephonyVerificationAuthoritySubmission[];
    readonly decisions: readonly TelephonyVerificationDecision[];
    readonly patientIndexRecords: readonly TelephonyPatientCandidateRecord[];
  };
} {
  const captureAttempts = new Map<string, TelephonyIdentifierCaptureAttempt>();
  const captureAttemptsByIdempotency = new Map<string, string>();
  const candidateSets = new Map<string, TelephonyCandidateSet>();
  const identityAssessments = new Map<string, TelephonyIdentityConfidenceAssessment>();
  const destinationAssessments = new Map<string, TelephonyDestinationConfidenceAssessment>();
  const evidencePackages = new Map<string, TelephonyCandidateEvidencePackage>();
  const authoritySubmissions = new Map<string, TelephonyVerificationAuthoritySubmission>();
  const decisions = new Map<string, TelephonyVerificationDecision>();
  const patientIndexRecords = new Map<string, TelephonyPatientCandidateRecord>();
  for (const record of options?.patientIndexRecords ?? []) {
    patientIndexRecords.set(record.candidatePatientRef, cloneCandidateRecord(record));
  }

  return {
    async getCaptureAttemptByIdempotencyKey(idempotencyKey) {
      const ref = captureAttemptsByIdempotency.get(idempotencyKey);
      return ref ? cloneCaptureAttempt(captureAttempts.get(ref) as TelephonyIdentifierCaptureAttempt) : null;
    },
    async saveCaptureAttempt(attempt) {
      captureAttempts.set(attempt.captureAttemptRef, cloneCaptureAttempt(attempt));
      captureAttemptsByIdempotency.set(attempt.idempotencyKey, attempt.captureAttemptRef);
    },
    async listCaptureAttempts(callSessionRef) {
      return Object.freeze(
        [...captureAttempts.values()]
          .filter((attempt) => attempt.callSessionRef === callSessionRef)
          .sort((left, right) => left.captureOrderIndex - right.captureOrderIndex)
          .map(cloneCaptureAttempt),
      );
    },
    async listPatientIndexRecords() {
      return Object.freeze([...patientIndexRecords.values()].map(cloneCandidateRecord));
    },
    async saveCandidateSet(candidateSet) {
      candidateSets.set(candidateSet.candidateSetRef, cloneCandidateSet(candidateSet));
    },
    async saveIdentityAssessment(assessment) {
      identityAssessments.set(
        assessment.identityConfidenceAssessmentRef,
        cloneIdentityAssessment(assessment),
      );
    },
    async saveDestinationAssessment(assessment) {
      destinationAssessments.set(
        assessment.destinationConfidenceAssessmentRef,
        cloneDestinationAssessment(assessment),
      );
    },
    async saveEvidencePackage(evidencePackage) {
      evidencePackages.set(evidencePackage.evidencePackageRef, cloneEvidencePackage(evidencePackage));
    },
    async saveAuthoritySubmission(submission) {
      authoritySubmissions.set(submission.authoritySubmissionRef, cloneAuthoritySubmission(submission));
    },
    async saveDecision(decision) {
      decisions.set(decision.telephonyVerificationDecisionRef, cloneDecision(decision));
    },
    snapshots() {
      return Object.freeze({
        captureAttempts: Object.freeze(
          [...captureAttempts.values()]
            .sort((left, right) => left.captureOrderIndex - right.captureOrderIndex)
            .map(cloneCaptureAttempt),
        ),
        candidateSets: Object.freeze([...candidateSets.values()].map(cloneCandidateSet)),
        identityAssessments: Object.freeze([...identityAssessments.values()].map(cloneIdentityAssessment)),
        destinationAssessments: Object.freeze(
          [...destinationAssessments.values()].map(cloneDestinationAssessment),
        ),
        evidencePackages: Object.freeze([...evidencePackages.values()].map(cloneEvidencePackage)),
        authoritySubmissions: Object.freeze(
          [...authoritySubmissions.values()].map(cloneAuthoritySubmission),
        ),
        decisions: Object.freeze([...decisions.values()].map(cloneDecision)),
        patientIndexRecords: Object.freeze([...patientIndexRecords.values()].map(cloneCandidateRecord)),
      });
    },
  };
}

export function createInMemoryTelephonyIdentityBindingAuthorityPort(options?: {
  readonly unavailable?: boolean;
}): TelephonyIdentityBindingAuthorityPort & {
  submissions(): readonly SubmitTelephonyCandidateEvidenceInput[];
} {
  const submissions: SubmitTelephonyCandidateEvidenceInput[] = [];
  return {
    async submitCandidateEvidencePackage(input) {
      submissions.push({
        ...input,
        evidencePackage: cloneEvidencePackage(input.evidencePackage),
        identityAssessment: cloneIdentityAssessment(input.identityAssessment),
        destinationAssessment: cloneDestinationAssessment(input.destinationAssessment),
        decisionReasonCodes: Object.freeze([...input.decisionReasonCodes]),
      });
      if (options?.unavailable) {
        return Object.freeze({
          authoritySubmissionRef: deterministicId("tvas", {
            evidencePackageRef: input.evidencePackage.evidencePackageRef,
            unavailable: true,
          }),
          evidencePackageRef: input.evidencePackage.evidencePackageRef,
          accepted: false,
          settlementRef: null,
          bindingVersionRef: null,
          reasonCodes: Object.freeze([
            "TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK",
          ]),
          submittedAt: input.submittedAt,
        });
      }
      return Object.freeze({
        authoritySubmissionRef: deterministicId("tvas", {
          evidencePackageRef: input.evidencePackage.evidencePackageRef,
          accepted: true,
        }),
        evidencePackageRef: input.evidencePackage.evidencePackageRef,
        accepted: true,
        settlementRef: deterministicId("ibas", input.evidencePackage.evidencePackageRef),
        bindingVersionRef: null,
        reasonCodes: Object.freeze([
          "TEL_VERIFY_189_AUTHORITY_EVIDENCE_PACKAGE_ACCEPTED",
          "TEL_VERIFY_189_PIPELINE_DID_NOT_BIND_LOCALLY",
        ]),
        submittedAt: input.submittedAt,
      });
    },
    submissions() {
      return Object.freeze([...submissions]);
    },
  };
}

function bindingConfidenceFromTelephony(
  identity: TelephonyIdentityConfidenceAssessment,
): BindingConfidenceSnapshot {
  return Object.freeze({
    P_link: identity.bestPId,
    LCB_link_alpha: identity.bestLcbIdAlpha,
    P_subject: identity.bestPId,
    LCB_subject_alpha: identity.bestLcbIdAlpha,
    runnerUpProbabilityUpperBound: identity.runnerUpUcbIdAlpha,
    gap_logit: identity.gap_id,
    confidenceModelState: "calibrated",
  });
}

export function createIdentityBindingAuthorityTelephonyPort(
  identityBindingAuthority: IdentityBindingAuthorityService,
): TelephonyIdentityBindingAuthorityPort {
  return {
    async submitCandidateEvidencePackage(input) {
      try {
        const result = await identityBindingAuthority.settleIdentityBindingCommand({
          commandId: deterministicId("ibcmd", input.evidencePackage.evidencePackageRef),
          idempotencyKey: deterministicId("ibidm", input.evidencePackage.evidencePackageRef),
          subjectRef: input.evidencePackage.subjectRef,
          intentType: "provisional_verify",
          candidatePatientRef: input.evidencePackage.candidatePatientRef,
          confidence: bindingConfidenceFromTelephony(input.identityAssessment),
          provenanceRefs: [
            input.evidencePackage.evidencePackageRef,
            input.identityAssessment.identityConfidenceAssessmentRef,
            input.destinationAssessment.destinationConfidenceAssessmentRef,
          ],
          actorRef: TELEPHONY_VERIFICATION_SERVICE_NAME,
          reasonCodes: [
            "TEL_VERIFY_189_EVIDENCE_SUBMITTED_TO_IDENTITY_BINDING_AUTHORITY",
            ...input.decisionReasonCodes,
          ],
          observedAt: input.submittedAt,
        });
        return Object.freeze({
          authoritySubmissionRef: deterministicId("tvas", {
            evidencePackageRef: input.evidencePackage.evidencePackageRef,
            settlementRef: result.settlement.commandSettlementId,
          }),
          evidencePackageRef: input.evidencePackage.evidencePackageRef,
          accepted: result.settlement.decision === "accepted" || result.settlement.decision === "replayed",
          settlementRef: result.settlement.commandSettlementId,
          bindingVersionRef: result.settlement.bindingVersionRef,
          reasonCodes: Object.freeze([
            "TEL_VERIFY_189_EVIDENCE_SUBMITTED_TO_IDENTITY_BINDING_AUTHORITY",
            ...result.settlement.reasonCodes,
          ]),
          submittedAt: input.submittedAt,
        });
      } catch {
        return Object.freeze({
          authoritySubmissionRef: deterministicId("tvas", {
            evidencePackageRef: input.evidencePackage.evidencePackageRef,
            unavailable: true,
          }),
          evidencePackageRef: input.evidencePackage.evidencePackageRef,
          accepted: false,
          settlementRef: null,
          bindingVersionRef: null,
          reasonCodes: Object.freeze([
            "TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK",
          ]),
          submittedAt: input.submittedAt,
        });
      }
    },
  };
}

function locatorFromWriteResult(locator: IdentityEvidenceLocator): {
  readonly vaultEvidenceRef: string;
  readonly vaultRef: string;
  readonly evidenceEnvelopeRef: string;
  readonly maskedFragment: string;
} {
  return {
    vaultEvidenceRef: locator.evidenceEnvelopeRef,
    vaultRef: locator.vaultRef,
    evidenceEnvelopeRef: locator.evidenceEnvelopeRef,
    maskedFragment: locator.maskedDisplay.maskedContact,
  };
}

export function createTelephonyVerificationService(options: {
  readonly repository: TelephonyVerificationRepository;
  readonly evidenceVault: IdentityEvidenceVaultService;
  readonly calibrationRepository: TelephonyVerificationCalibrationRepository;
  readonly authorityPort: TelephonyIdentityBindingAuthorityPort;
}): TelephonyVerificationService {
  const repository = options.repository;
  const evidenceVault = options.evidenceVault;
  const calibrationRepository = options.calibrationRepository;
  const authorityPort = options.authorityPort;

  return {
    async appendIdentifierCapture(input) {
      const replay = await repository.getCaptureAttemptByIdempotencyKey(input.idempotencyKey);
      if (replay) return replay;

      const capturedAt = input.capturedAt ?? nowIso();
      const normalized = normalizeCaptureValue(input.fieldFamily, input.rawValue);
      const vaultWrite = await evidenceVault.writeEvidence({
        evidenceNamespace: "telephony_capture",
        sourceChannel: sourceChannelForCapture(input.captureSource),
        subjectRef: input.callSessionRef,
        rawEvidence: {
          fieldFamily: input.fieldFamily,
          value: input.rawValue,
          capturedAt,
        },
        actorRef: input.actorRef,
        purpose: "identity_binding_authority",
        provenanceRef: input.provenanceRef ?? input.callSessionRef,
        label: input.fieldFamily,
        disclosureClass: "vault_internal",
        retentionClass: "identity_binding_evidence",
        lookupValues: normalized.normalizedValueHash ? [normalized.normalizedValueHash] : [],
        createdAt: capturedAt,
      });
      const locator = locatorFromWriteResult(vaultWrite.locator);
      const attempt = Object.freeze({
        captureAttemptRef: deterministicId("tica", {
          callSessionRef: input.callSessionRef,
          fieldFamily: input.fieldFamily,
          idempotencyKey: input.idempotencyKey,
        }),
        schemaVersion: TELEPHONY_VERIFICATION_SCHEMA_VERSION,
        policyVersion: TELEPHONY_VERIFICATION_POLICY_VERSION,
        callSessionRef: input.callSessionRef,
        routeSensitivity: input.routeSensitivity,
        fieldFamily: input.fieldFamily,
        captureOrderIndex: fieldOrderIndex(input.fieldFamily),
        captureSource: input.captureSource,
        validationResult: normalized.validationResult,
        normalizedValueHash: normalized.normalizedValueHash,
        vaultEvidenceRef: locator.vaultEvidenceRef,
        vaultRef: locator.vaultRef,
        maskedFragment: normalized.maskedFragment || locator.maskedFragment,
        evidenceEnvelopeRef: locator.evidenceEnvelopeRef,
        relatedCandidateSetRef: null,
        idempotencyKey: input.idempotencyKey,
        reasonCodes: Object.freeze([
          ...normalized.reasonCodes,
          "TEL_VERIFY_189_RAW_IDENTIFIER_WRITTEN_TO_IDENTITY_EVIDENCE_VAULT",
          "TEL_VERIFY_189_CAPTURE_ORDER_CONTROLLED",
        ]),
        capturedAt,
        recordedBy: TELEPHONY_VERIFICATION_SERVICE_NAME,
      });
      await repository.saveCaptureAttempt(attempt);
      return cloneCaptureAttempt(attempt);
    },

    async evaluateVerification(input) {
      const observedAt = input.observedAt ?? nowIso();
      const captures = await repository.listCaptureAttempts(input.callSessionRef);
      const profile = await calibrationRepository.getThresholdProfile(input.routeSensitivity);
      const fallbackProfile: TelephonyVerificationThresholdProfile =
        profile ?? missingThresholdProfileForRoute(input.routeSensitivity);

      const patientIndexRecords = await repository.listPatientIndexRecords();
      const candidates = resolveCandidates(captures, patientIndexRecords);
      const candidateSet = Object.freeze({
        candidateSetRef: deterministicId("tvcs", {
          callSessionRef: input.callSessionRef,
          candidateRefs: candidates.map((candidate) => candidate.candidatePatientRef),
          captureRefs: captures.map((capture) => capture.captureAttemptRef),
        }),
        callSessionRef: input.callSessionRef,
        routeSensitivity: input.routeSensitivity,
        candidateRefs: Object.freeze(candidates.map((candidate) => candidate.candidatePatientRef)),
        candidateCount: candidates.length,
        resolverPolicyRef: "patient-linker-compatible-hash-resolution-189.v1" as const,
        frozenAt: observedAt,
      });
      await repository.saveCandidateSet(candidateSet);

      let identityAssessment: TelephonyIdentityConfidenceAssessment | null = null;
      let destinationAssessment: TelephonyDestinationConfidenceAssessment | null = null;
      if (profileAllowsChallenge(fallbackProfile) && candidates.length > 0) {
        identityAssessment = buildIdentityAssessment({
          callSessionRef: input.callSessionRef,
          routeSensitivity: input.routeSensitivity,
          candidateSet,
          candidates,
          captures,
          profile: fallbackProfile,
          assessedAt: observedAt,
        });
        await repository.saveIdentityAssessment(identityAssessment);
        const bestCandidate =
          candidates.find(
            (candidate) => candidate.candidatePatientRef === identityAssessment?.bestCandidateRef,
          ) ?? null;
        destinationAssessment = buildDestinationAssessment({
          callSessionRef: input.callSessionRef,
          routeSensitivity: input.routeSensitivity,
          captures,
          candidate: bestCandidate,
          targetDestinationHash: input.targetDestinationHash ?? null,
          identityAssessment,
          profile: fallbackProfile,
          assessedAt: observedAt,
        });
        await repository.saveDestinationAssessment(destinationAssessment);
      }

      const preliminary = decideOutcome({
        profile: fallbackProfile,
        candidates,
        captures,
        identityAssessment,
        destinationAssessment,
      });
      let evidencePackage: TelephonyCandidateEvidencePackage | null = null;
      let authoritySubmission: TelephonyVerificationAuthoritySubmission | null = null;
      let outcome = preliminary.outcome;
      let posture = preliminary.posture;
      const reasonCodes = [...preliminary.reasonCodes];

      if (
        outcome === "telephony_verified_seeded" &&
        identityAssessment?.bestCandidateRef &&
        destinationAssessment
      ) {
        evidencePackage = buildEvidencePackage({
          callSessionRef: input.callSessionRef,
          routeSensitivity: input.routeSensitivity,
          subjectRef: input.subjectRef,
          candidatePatientRef: identityAssessment.bestCandidateRef,
          captures,
          identityAssessment,
          destinationAssessment,
          profile: fallbackProfile,
          packagedAt: observedAt,
        });
        await repository.saveEvidencePackage(evidencePackage);
        authoritySubmission = await authorityPort.submitCandidateEvidencePackage({
          evidencePackage,
          identityAssessment,
          destinationAssessment,
          decisionReasonCodes: reasonCodes,
          submittedAt: observedAt,
        });
        await repository.saveAuthoritySubmission(authoritySubmission);
        if (!authoritySubmission.accepted) {
          outcome = "telephony_verified_challenge";
          posture = "challenge_continuation_only";
          reasonCodes.push(
            "TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK",
            "TEL_VERIFY_189_SEEDED_DOWNGRADED_TO_CHALLENGE",
          );
        } else {
          reasonCodes.push(
            "TEL_VERIFY_189_EVIDENCE_SUBMITTED_TO_IDENTITY_BINDING_AUTHORITY",
            "TEL_VERIFY_189_PIPELINE_DID_NOT_BIND_LOCALLY",
          );
        }
      }

      const decision = buildDecision({
        callSessionRef: input.callSessionRef,
        routeSensitivity: input.routeSensitivity,
        candidateSet,
        profile: fallbackProfile,
        identityAssessment,
        destinationAssessment,
        outcome,
        posture,
        evidencePackageRef: evidencePackage?.evidencePackageRef ?? null,
        authoritySubmissionRef: authoritySubmission?.authoritySubmissionRef ?? null,
        reasonCodes,
        decidedAt: observedAt,
      });
      await repository.saveDecision(decision);

      return Object.freeze({
        candidateSet,
        candidates: Object.freeze(candidates.map(cloneCandidate)),
        identityAssessment: identityAssessment ? cloneIdentityAssessment(identityAssessment) : null,
        destinationAssessment: destinationAssessment
          ? cloneDestinationAssessment(destinationAssessment)
          : null,
        evidencePackage: evidencePackage ? cloneEvidencePackage(evidencePackage) : null,
        authoritySubmission: authoritySubmission ? cloneAuthoritySubmission(authoritySubmission) : null,
        decision,
      });
    },
  };
}

export function createTelephonyVerificationApplication(options: {
  readonly evidenceVault: IdentityEvidenceVaultService;
  readonly repository?: TelephonyVerificationRepository;
  readonly calibrationRepository?: TelephonyVerificationCalibrationRepository;
  readonly authorityPort?: TelephonyIdentityBindingAuthorityPort;
}): TelephonyVerificationApplication {
  const repository = options.repository ?? createInMemoryTelephonyVerificationRepository();
  const calibrationRepository =
    options.calibrationRepository ?? createSeedTelephonyVerificationCalibrationRepository();
  const authorityPort =
    options.authorityPort ?? createInMemoryTelephonyIdentityBindingAuthorityPort();
  return Object.freeze({
    service: createTelephonyVerificationService({
      repository,
      evidenceVault: options.evidenceVault,
      calibrationRepository,
      authorityPort,
    }),
    repository,
    calibrationRepository,
    authorityPort,
    migrationPlanRef: telephonyVerificationMigrationPlanRefs[0],
    migrationPlanRefs: telephonyVerificationMigrationPlanRefs,
    persistenceTables: telephonyVerificationPersistenceTables,
    gapResolutions: telephonyVerificationGapResolutions,
  });
}
