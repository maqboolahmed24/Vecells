import { createHash } from "node:crypto";

export const patientLinkerPersistenceTables = [
  "patient_link_candidate_search_specs",
  "patient_link_candidate_sets",
  "patient_match_evidence_basis",
  "patient_link_decisions",
  "patient_link_binding_intents",
  "patient_link_calibration_profiles",
  "patient_link_pds_enrichment_audit",
] as const;

export const patientLinkerMigrationPlanRefs = [
  "services/command-api/migrations/093_phase2_patient_linker.sql",
] as const;

export const patientLinkerParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CALIBRATED_DECISION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_RUNNER_UP_COMPETITION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_DRIFT_FAIL_CLOSED_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_PDS_OPTIONAL_SEAM_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_CONTACT_PREF_SEPARATION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_LINKER_AUTHORITY_INTENT_PORT_V1",
] as const;

export const PATIENT_LINKER_SCHEMA_VERSION = "172.phase2.patient-link.v1";
export const PATIENT_LINKER_POLICY_VERSION = "phase2-patient-link-v1";
export const PDS_ENRICHMENT_SEAM_REF = "PDS_ENRICHMENT_SEAM_172";
export const CONTACT_PREFERENCE_SEPARATION_RULESET_REF = "CONTACT_PREF_SEPARATION_172";
export const patientLinkerDomainSeparationRules = {
  contactClaims: "match_evidence_only",
  pdsDemographics: "candidate_enrichment_only",
  patientPreferredComms: "notification_route_only_not_identity_proof",
} as const;

export type RouteSensitivityFamily =
  | "public_intake"
  | "signed_in_draft_start"
  | "authenticated_request_status"
  | "post_sign_in_attachment_write"
  | "sms_continuation"
  | "identity_repair"
  | "future_protected_records"
  | "future_booking_surfaces";

export type PatientLinkSearchKey =
  | "nhs_number_hash_exact"
  | "date_of_birth"
  | "normalized_family_name"
  | "normalized_given_name"
  | "postcode_prefix"
  | "address_token_set"
  | "contact_claim_digest"
  | "pds_demographic_ref";

export type PatientLinkProvenanceSource =
  | "nhs_login_claim_digest"
  | "local_patient_reference_fixture"
  | "secure_link_digest"
  | "telephony_capture_digest"
  | "support_correction_digest"
  | "pds_enrichment_digest";

export type PatientLinkConfidenceModelState = "calibrated" | "drift_review" | "out_of_domain";

export type PatientLinkState =
  | "none"
  | "candidate"
  | "provisional_verified"
  | "verified_patient"
  | "ambiguous"
  | "correction_pending"
  | "revoked";

export type PatientLinkDecisionClass =
  | "candidate_refresh"
  | "provisional_verify"
  | "verified_bind"
  | "manual_review_required"
  | "correction_pending"
  | "revoked";

export type PatientLinkAuthorityIntentKind =
  | "submit_candidate_refresh"
  | "submit_provisional_verify"
  | "submit_verified_bind"
  | "submit_repair_signal"
  | "submit_revocation_signal";

export type PatientLinkPatientFacingState =
  | "signed_in_ready"
  | "details_found_confirmation_needed"
  | "limited_or_provisional_mode"
  | "unable_to_confidently_match"
  | "identity_hold_bounded_recovery";

export type PdsEnrichmentStatus = "disabled" | "unavailable" | "enriched" | "legal_basis_missing";

export interface IgnoredSearchKey {
  readonly searchKey: string;
  readonly ignoreReasonCode: string;
}

export interface CandidateSearchSpec {
  readonly candidateSearchSpecId: string;
  readonly schemaVersion: typeof PATIENT_LINKER_SCHEMA_VERSION;
  readonly policyVersion: typeof PATIENT_LINKER_POLICY_VERSION;
  readonly subjectRef: string;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly permittedSearchKeys: readonly PatientLinkSearchKey[];
  readonly ignoredSearchKeys: readonly IgnoredSearchKey[];
  readonly provenanceSources: readonly PatientLinkProvenanceSource[];
  readonly searchBoundaries: {
    readonly freeTextRummaging: "forbidden";
    readonly routeLocalHeuristics: "forbidden";
    readonly maxCandidateCount: number;
    readonly candidateSetFreezeRule: "freeze_before_scoring_and_binding_intent";
    readonly noCandidateFallback: "none" | "candidate" | "ambiguous" | "correction_pending";
  };
  readonly pdsEnrichmentSeamRef: typeof PDS_ENRICHMENT_SEAM_REF;
  readonly gpLinkagePosture:
    | "disabled_until_live_im1_prerequisites"
    | "enabled_by_policy_prerequisite_only";
  readonly createdAt: string;
}

export interface PatientLinkSearchAttributes {
  readonly nhsNumberHashExact?: string | null;
  readonly dateOfBirth?: string | null;
  readonly normalizedFamilyName?: string | null;
  readonly normalizedGivenName?: string | null;
  readonly postcodePrefix?: string | null;
  readonly addressTokenSet?: readonly string[];
  readonly contactClaimDigest?: string | null;
  readonly pdsDemographicRef?: string | null;
}

export interface PatientLinkSubjectEvidence {
  readonly subjectRef: string;
  readonly rawEvidenceRefs: readonly string[];
  readonly provenanceSources: readonly PatientLinkProvenanceSource[];
  readonly searchAttributes: PatientLinkSearchAttributes;
  readonly sourceReliability: number;
  readonly stepUpEvidenceRefs?: readonly string[];
  readonly contactPreferenceSeparationRef?: typeof CONTACT_PREFERENCE_SEPARATION_RULESET_REF;
}

export interface PatientIndexRecord {
  readonly candidatePatientRef: string;
  readonly candidateLabel: string;
  readonly searchAttributes: PatientLinkSearchAttributes;
  readonly localPatientReferenceFixtureRef: string;
  readonly rawEvidenceRefs: readonly string[];
  readonly pdsDemographicsRef?: string | null;
  readonly patientPreferredCommsRef?: string | null;
}

export interface PatientCandidateMatch {
  readonly candidatePatientRef: string;
  readonly candidateLabel: string;
  readonly candidateRank: number;
  readonly candidateSetRef: string;
  readonly matchedSearchKeys: readonly PatientLinkSearchKey[];
  readonly record: PatientIndexRecord;
}

export interface NormalizedFeatureValues {
  readonly nhsNumberHashAgreement: number;
  readonly dateOfBirthAgreement: number;
  readonly nameSimilarity: number;
  readonly postcodeSimilarity: number;
  readonly phoneEmailAgreementWithProvenancePenalty: number;
  readonly addressTokenSimilarity: number;
  readonly sourceReliability: number;
  readonly stepUpSupport: number;
}

export interface ProvenancePenalty {
  readonly featureName: string;
  readonly penalty: number;
  readonly reasonCode: string;
}

export type MissingnessFlag =
  | "missing_nhs_number_hash"
  | "missing_postcode"
  | "missing_contact_claim"
  | "missing_pds_demographic_ref"
  | "missing_step_up_support"
  | "missing_address_tokens";

export interface MatchEvidenceBasis {
  readonly matchEvidenceBasisId: string;
  readonly schemaVersion: typeof PATIENT_LINKER_SCHEMA_VERSION;
  readonly policyVersion: typeof PATIENT_LINKER_POLICY_VERSION;
  readonly candidateSetRef: string;
  readonly subjectRef: string;
  readonly candidatePatientRef: string;
  readonly rawEvidenceRefs: readonly string[];
  readonly normalizedFeatureValues: NormalizedFeatureValues;
  readonly provenancePenalties: readonly ProvenancePenalty[];
  readonly missingnessFlags: readonly MissingnessFlag[];
  readonly calibratorVersionRef: string;
  readonly thresholdVersionRef: string;
  readonly policyVersionRef: typeof PATIENT_LINKER_POLICY_VERSION;
  readonly confidenceModelState: PatientLinkConfidenceModelState;
  readonly driftScore: number;
  readonly createdAt: string;
}

export interface PatientLinkThresholds {
  readonly autoLinkLcbMin: number;
  readonly provisionalLcbMin: number;
  readonly runnerUpUcbMax: number;
  readonly subjectLcbMin: number;
  readonly gapLogitMin: number;
  readonly driftFailClosedPosture:
    | "manual_review_only"
    | "ambiguous"
    | "provisional_verified"
    | "none";
}

export interface PatientLinkCalibrationProfile {
  readonly linkCalibrationProfileId: string;
  readonly schemaVersion: typeof PATIENT_LINKER_SCHEMA_VERSION;
  readonly policyVersion: typeof PATIENT_LINKER_POLICY_VERSION;
  readonly calibrationVersionRef: string;
  readonly thresholdVersionRef: string;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly calibratorType: "isotonic" | "platt_logistic" | "conservative_placeholder";
  readonly alphaLink: number;
  readonly alphaSubject: number;
  readonly deltaDrift: number;
  readonly thresholds: PatientLinkThresholds;
  readonly minimumCalibrationPosture:
    | "auto_link_allowed"
    | "provisional_only"
    | "manual_review_only";
  readonly metrics: {
    readonly brierScoreMax: number;
    readonly calibrationSlopeRange: readonly [number, number];
    readonly minimumAdjudicatedExamples: number;
  };
  readonly coefficients: {
    readonly intercept: number;
    readonly nhsNumberHashAgreement: number;
    readonly dateOfBirthAgreement: number;
    readonly nameSimilarity: number;
    readonly postcodeSimilarity: number;
    readonly phoneEmailAgreementWithProvenancePenalty: number;
    readonly addressTokenSimilarity: number;
    readonly sourceReliability: number;
    readonly stepUpSupport: number;
  };
  readonly createdAt: string;
}

export interface PatientLinkScore {
  readonly candidatePatientRef: string;
  readonly basisRef: string;
  readonly logit: number;
  readonly P_link: number;
  readonly LCB_link_alpha: number;
  readonly UCB_link_alpha: number;
  readonly P_subject: number;
  readonly LCB_subject_alpha: number;
  readonly confidenceModelState: PatientLinkConfidenceModelState;
  readonly driftScore: number;
}

export interface PatientLinkAutoLinkChecks {
  readonly winnerLowerBoundPass: boolean;
  readonly runnerUpCeilingPass: boolean;
  readonly gapLogitPass: boolean;
  readonly subjectProofFloorPass: boolean;
  readonly driftPass: boolean;
  readonly policyAllowsAutoLink: boolean;
}

export interface PatientLinkDecision {
  readonly patientLinkDecisionId: string;
  readonly schemaVersion: typeof PATIENT_LINKER_SCHEMA_VERSION;
  readonly policyVersion: typeof PATIENT_LINKER_POLICY_VERSION;
  readonly candidateSearchSpecRef: string;
  readonly matchEvidenceBasisRefs: readonly string[];
  readonly subjectRef: string;
  readonly winnerCandidateRef: string;
  readonly runnerUpCandidateRef: string | null;
  readonly P_link: number;
  readonly LCB_link_alpha: number;
  readonly UCB_link_alpha: number;
  readonly P_subject: number;
  readonly LCB_subject_alpha: number;
  readonly runnerUpProbabilityUpperBound: number;
  readonly gap_logit: number;
  readonly confidenceModelState: PatientLinkConfidenceModelState;
  readonly linkState: PatientLinkState;
  readonly decisionClass: PatientLinkDecisionClass;
  readonly autoLinkChecks: PatientLinkAutoLinkChecks;
  readonly identityBindingAuthorityIntent: PatientLinkAuthorityIntentKind;
  readonly reasonCodes: readonly string[];
  readonly decidedAt: string;
}

export interface PatientLinkerAuthorityIntent {
  readonly authorityIntentId: string;
  readonly subjectRef: string;
  readonly patientLinkDecisionRef: string;
  readonly candidatePatientRef: string | null;
  readonly intentKind: PatientLinkAuthorityIntentKind;
  readonly linkState: PatientLinkState;
  readonly decisionClass: PatientLinkDecisionClass;
  readonly confidenceValues: {
    readonly P_link: number;
    readonly LCB_link_alpha: number;
    readonly P_subject: number;
    readonly LCB_subject_alpha: number;
    readonly runnerUpProbabilityUpperBound: number;
    readonly gap_logit: number;
  };
  readonly provenanceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly submittedAt: string;
}

export interface IdentityBindingAuthorityIntentPort {
  submitLinkIntent(input: PatientLinkerAuthorityIntent): Promise<{
    readonly authorityIntentRef: string;
    readonly accepted: boolean;
    readonly reasonCodes: readonly string[];
  }>;
}

export interface PdsEnrichmentRequest {
  readonly subjectRef: string;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly permittedSearchKeys: readonly PatientLinkSearchKey[];
  readonly localEvidenceRefs: readonly string[];
  readonly featureFlagEnabled: boolean;
  readonly legalBasisEvidenceRef?: string | null;
  readonly observedAt: string;
}

export interface PdsEnrichmentOutcome {
  readonly seamRef: typeof PDS_ENRICHMENT_SEAM_REF;
  readonly status: PdsEnrichmentStatus;
  readonly pdsDemographicsRef: string | null;
  readonly pdsLookupOutcome: "not_called" | "not_available" | "reference_returned";
  readonly pdsProvenancePenalty: number;
  readonly reasonCodes: readonly string[];
}

export interface PdsEnrichmentProvider {
  enrich(input: PdsEnrichmentRequest): Promise<PdsEnrichmentOutcome>;
}

export interface EvaluatePatientLinkInput {
  readonly subjectEvidence: PatientLinkSubjectEvidence;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly actorRef: string;
  readonly purpose: string;
  readonly permittedSearchKeys?: readonly PatientLinkSearchKey[];
  readonly enablePdsEnrichment?: boolean;
  readonly pdsLegalBasisEvidenceRef?: string | null;
  readonly observedAt?: string;
}

export interface EvaluatePatientLinkResult {
  readonly candidateSearchSpec: CandidateSearchSpec;
  readonly candidates: readonly PatientCandidateMatch[];
  readonly evidenceBases: readonly MatchEvidenceBasis[];
  readonly scores: readonly PatientLinkScore[];
  readonly decision: PatientLinkDecision;
  readonly authorityIntent: PatientLinkerAuthorityIntent;
  readonly authoritySettlement: {
    readonly authorityIntentRef: string;
    readonly accepted: boolean;
    readonly reasonCodes: readonly string[];
  };
  readonly pdsOutcome: PdsEnrichmentOutcome;
  readonly patientFacingState: PatientLinkPatientFacingState;
}

export interface PatientLinkerRepository {
  saveCandidateSearchSpec(spec: CandidateSearchSpec): Promise<void>;
  searchPatientCandidates(
    spec: CandidateSearchSpec,
    subjectEvidence: PatientLinkSubjectEvidence,
  ): Promise<readonly PatientCandidateMatch[]>;
  saveCandidateSet(input: {
    readonly candidateSetRef: string;
    readonly candidateSearchSpecRef: string;
    readonly candidateRefs: readonly string[];
    readonly frozenAt: string;
  }): Promise<void>;
  saveMatchEvidenceBasis(basis: MatchEvidenceBasis): Promise<void>;
  saveDecision(decision: PatientLinkDecision): Promise<void>;
  saveAuthorityIntent(intent: PatientLinkerAuthorityIntent): Promise<void>;
  savePdsAudit(input: {
    readonly subjectRef: string;
    readonly seamRef: string;
    readonly status: PdsEnrichmentStatus;
    readonly reasonCodes: readonly string[];
    readonly recordedAt: string;
  }): Promise<void>;
}

export interface PatientLinkCalibrationRepository {
  getProfile(
    routeSensitivityFamily: RouteSensitivityFamily,
  ): Promise<PatientLinkCalibrationProfile | null>;
}

export interface PatientLinkerService {
  evaluatePatientLink(input: EvaluatePatientLinkInput): Promise<EvaluatePatientLinkResult>;
}

export interface PatientLinkerApplication {
  readonly patientLinker: PatientLinkerService;
  readonly repository: PatientLinkerRepository;
  readonly calibrationRepository: PatientLinkCalibrationRepository;
  readonly pdsProvider: PdsEnrichmentProvider;
  readonly bindingAuthorityIntentPort: IdentityBindingAuthorityIntentPort;
  readonly migrationPlanRef: (typeof patientLinkerMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof patientLinkerMigrationPlanRefs;
  readonly persistenceTables: typeof patientLinkerPersistenceTables;
  readonly parallelInterfaceGaps: typeof patientLinkerParallelInterfaceGaps;
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
  return `${prefix}_${sha256(`${prefix}:${stableJson(value)}`).slice(0, 24)}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function sigmoid(logit: number): number {
  return 1 / (1 + Math.exp(-logit));
}

function normalizeToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gu, "") || null
  );
}

function tokenSet(value: readonly string[] | undefined): ReadonlySet<string> {
  return new Set(
    value?.map((token) => normalizeToken(token)).filter((token): token is string => Boolean(token)),
  );
}

function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const item of left) {
    if (right.has(item)) {
      intersection += 1;
    }
  }
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function stringAgreement(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  const normalizedLeft = normalizeToken(left);
  const normalizedRight = normalizeToken(right);
  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }
  if (normalizedLeft === normalizedRight) {
    return 1;
  }
  const leftChars = tokenSet([...normalizedLeft]);
  const rightChars = tokenSet([...normalizedRight]);
  return jaccard(leftChars, rightChars);
}

function hasSearchValue(
  attributes: PatientLinkSearchAttributes,
  key: PatientLinkSearchKey,
): boolean {
  switch (key) {
    case "nhs_number_hash_exact":
      return Boolean(attributes.nhsNumberHashExact);
    case "date_of_birth":
      return Boolean(attributes.dateOfBirth);
    case "normalized_family_name":
      return Boolean(attributes.normalizedFamilyName);
    case "normalized_given_name":
      return Boolean(attributes.normalizedGivenName);
    case "postcode_prefix":
      return Boolean(attributes.postcodePrefix);
    case "address_token_set":
      return (attributes.addressTokenSet?.length ?? 0) > 0;
    case "contact_claim_digest":
      return Boolean(attributes.contactClaimDigest);
    case "pds_demographic_ref":
      return Boolean(attributes.pdsDemographicRef);
  }
}

function searchKeyMatches(
  key: PatientLinkSearchKey,
  subject: PatientLinkSearchAttributes,
  candidate: PatientLinkSearchAttributes,
): boolean {
  switch (key) {
    case "nhs_number_hash_exact":
      return Boolean(
        subject.nhsNumberHashExact && subject.nhsNumberHashExact === candidate.nhsNumberHashExact,
      );
    case "date_of_birth":
      return Boolean(subject.dateOfBirth && subject.dateOfBirth === candidate.dateOfBirth);
    case "normalized_family_name":
      return stringAgreement(subject.normalizedFamilyName, candidate.normalizedFamilyName) >= 0.92;
    case "normalized_given_name":
      return stringAgreement(subject.normalizedGivenName, candidate.normalizedGivenName) >= 0.92;
    case "postcode_prefix":
      return Boolean(
        normalizeToken(subject.postcodePrefix) &&
          normalizeToken(subject.postcodePrefix) === normalizeToken(candidate.postcodePrefix),
      );
    case "address_token_set":
      return jaccard(tokenSet(subject.addressTokenSet), tokenSet(candidate.addressTokenSet)) >= 0.4;
    case "contact_claim_digest":
      return Boolean(
        subject.contactClaimDigest && subject.contactClaimDigest === candidate.contactClaimDigest,
      );
    case "pds_demographic_ref":
      return Boolean(
        subject.pdsDemographicRef && subject.pdsDemographicRef === candidate.pdsDemographicRef,
      );
  }
}

function defaultPermittedSearchKeys(
  input: PatientLinkSubjectEvidence,
): readonly PatientLinkSearchKey[] {
  const candidateKeys: PatientLinkSearchKey[] = [
    "nhs_number_hash_exact",
    "date_of_birth",
    "normalized_family_name",
    "normalized_given_name",
    "postcode_prefix",
    "address_token_set",
    "contact_claim_digest",
    "pds_demographic_ref",
  ];
  const permitted = candidateKeys.filter((key) => hasSearchValue(input.searchAttributes, key));
  return permitted.length > 0 ? permitted : ["date_of_birth"];
}

function buildCandidateSearchSpec(input: {
  readonly subjectEvidence: PatientLinkSubjectEvidence;
  readonly routeSensitivityFamily: RouteSensitivityFamily;
  readonly permittedSearchKeys: readonly PatientLinkSearchKey[];
  readonly pdsOutcome: PdsEnrichmentOutcome;
  readonly createdAt: string;
}): CandidateSearchSpec {
  const ignoredSearchKeys: IgnoredSearchKey[] = [];
  for (const key of [
    "nhs_number_hash_exact",
    "date_of_birth",
    "normalized_family_name",
    "normalized_given_name",
    "postcode_prefix",
    "address_token_set",
    "contact_claim_digest",
    "pds_demographic_ref",
  ] satisfies PatientLinkSearchKey[]) {
    if (!input.permittedSearchKeys.includes(key)) {
      ignoredSearchKeys.push({
        searchKey: key,
        ignoreReasonCode: `LINK_172_${key.toUpperCase()}_NOT_AVAILABLE`,
      });
    }
  }
  ignoredSearchKeys.push({
    searchKey: "patientPreferredComms",
    ignoreReasonCode: "LINK_172_PATIENT_PREFS_DO_NOT_PROVE_IDENTITY",
  });
  if (input.pdsOutcome.status !== "enriched") {
    ignoredSearchKeys.push({
      searchKey: "pds_demographic_ref",
      ignoreReasonCode: "LINK_172_PDS_DISABLED_OR_UNAVAILABLE",
    });
  }

  return Object.freeze({
    candidateSearchSpecId: deterministicId("css", {
      subjectRef: input.subjectEvidence.subjectRef,
      routeSensitivityFamily: input.routeSensitivityFamily,
      permittedSearchKeys: input.permittedSearchKeys,
      createdAt: input.createdAt,
    }),
    schemaVersion: PATIENT_LINKER_SCHEMA_VERSION,
    policyVersion: PATIENT_LINKER_POLICY_VERSION,
    subjectRef: input.subjectEvidence.subjectRef,
    routeSensitivityFamily: input.routeSensitivityFamily,
    permittedSearchKeys: Object.freeze([...input.permittedSearchKeys]),
    ignoredSearchKeys: Object.freeze(ignoredSearchKeys),
    provenanceSources: Object.freeze([...input.subjectEvidence.provenanceSources]),
    searchBoundaries: Object.freeze({
      freeTextRummaging: "forbidden",
      routeLocalHeuristics: "forbidden",
      maxCandidateCount: 12,
      candidateSetFreezeRule: "freeze_before_scoring_and_binding_intent",
      noCandidateFallback:
        input.routeSensitivityFamily === "identity_repair" ? "correction_pending" : "ambiguous",
    }),
    pdsEnrichmentSeamRef: PDS_ENRICHMENT_SEAM_REF,
    gpLinkagePosture: "disabled_until_live_im1_prerequisites",
    createdAt: input.createdAt,
  });
}

function missingnessForEvidence(evidence: PatientLinkSubjectEvidence): MissingnessFlag[] {
  const missing: MissingnessFlag[] = [];
  if (!evidence.searchAttributes.nhsNumberHashExact) {
    missing.push("missing_nhs_number_hash");
  }
  if (!evidence.searchAttributes.postcodePrefix) {
    missing.push("missing_postcode");
  }
  if (!evidence.searchAttributes.contactClaimDigest) {
    missing.push("missing_contact_claim");
  }
  if (!evidence.searchAttributes.pdsDemographicRef) {
    missing.push("missing_pds_demographic_ref");
  }
  if ((evidence.stepUpEvidenceRefs?.length ?? 0) === 0) {
    missing.push("missing_step_up_support");
  }
  if ((evidence.searchAttributes.addressTokenSet?.length ?? 0) === 0) {
    missing.push("missing_address_tokens");
  }
  return missing;
}

function featureValuesForCandidate(
  subject: PatientLinkSubjectEvidence,
  candidate: PatientIndexRecord,
): NormalizedFeatureValues {
  const family = stringAgreement(
    subject.searchAttributes.normalizedFamilyName,
    candidate.searchAttributes.normalizedFamilyName,
  );
  const given = stringAgreement(
    subject.searchAttributes.normalizedGivenName,
    candidate.searchAttributes.normalizedGivenName,
  );
  const contactAgreement =
    subject.searchAttributes.contactClaimDigest &&
    subject.searchAttributes.contactClaimDigest === candidate.searchAttributes.contactClaimDigest
      ? 0.92
      : 0;
  return Object.freeze({
    nhsNumberHashAgreement: subject.searchAttributes.nhsNumberHashExact
      ? Number(
          subject.searchAttributes.nhsNumberHashExact ===
            candidate.searchAttributes.nhsNumberHashExact,
        )
      : 0,
    dateOfBirthAgreement: subject.searchAttributes.dateOfBirth
      ? Number(subject.searchAttributes.dateOfBirth === candidate.searchAttributes.dateOfBirth)
      : 0,
    nameSimilarity: round((family + given) / 2),
    postcodeSimilarity: round(
      stringAgreement(
        subject.searchAttributes.postcodePrefix,
        candidate.searchAttributes.postcodePrefix,
      ),
    ),
    phoneEmailAgreementWithProvenancePenalty: contactAgreement,
    addressTokenSimilarity: round(
      jaccard(
        tokenSet(subject.searchAttributes.addressTokenSet),
        tokenSet(candidate.searchAttributes.addressTokenSet),
      ),
    ),
    sourceReliability: clamp01(subject.sourceReliability),
    stepUpSupport: (subject.stepUpEvidenceRefs?.length ?? 0) > 0 ? 1 : 0,
  });
}

function provenancePenaltiesForEvidence(
  subject: PatientLinkSubjectEvidence,
  pdsOutcome: PdsEnrichmentOutcome,
): ProvenancePenalty[] {
  const penalties: ProvenancePenalty[] = [];
  if (subject.searchAttributes.contactClaimDigest) {
    penalties.push({
      featureName: "phoneEmailAgreementWithProvenancePenalty",
      penalty: 0.08,
      reasonCode: "LINK_172_CONTACT_CLAIM_PROVENANCE_PENALTY",
    });
  }
  if (pdsOutcome.status !== "enriched") {
    penalties.push({
      featureName: "pdsDemographics",
      penalty: pdsOutcome.pdsProvenancePenalty,
      reasonCode: "LINK_172_PDS_DISABLED_OR_UNAVAILABLE",
    });
  }
  if (subject.contactPreferenceSeparationRef !== CONTACT_PREFERENCE_SEPARATION_RULESET_REF) {
    penalties.push({
      featureName: "patientPreferredComms",
      penalty: 0.2,
      reasonCode: "LINK_172_CONTACT_CLAIMS_DO_NOT_SET_PREFS",
    });
  }
  return penalties;
}

function driftScoreForBasis(input: {
  readonly features: NormalizedFeatureValues;
  readonly missingnessFlags: readonly MissingnessFlag[];
  readonly provenancePenalties: readonly ProvenancePenalty[];
  readonly candidateCount: number;
}): number {
  const missingPenalty = input.missingnessFlags.length * 0.07;
  const provenancePenalty = input.provenancePenalties.reduce(
    (total, penalty) => total + penalty.penalty,
    0,
  );
  const competitionPenalty = input.candidateCount > 4 ? 0.1 : input.candidateCount > 1 ? 0.04 : 0;
  const sourcePenalty = 1 - input.features.sourceReliability;
  return round(
    Math.max(0, missingPenalty + provenancePenalty + competitionPenalty + sourcePenalty * 0.3),
  );
}

function modelStateForDrift(
  driftScore: number,
  profile: PatientLinkCalibrationProfile | null,
): PatientLinkConfidenceModelState {
  if (!profile) {
    return "out_of_domain";
  }
  if (driftScore > profile.deltaDrift) {
    return "out_of_domain";
  }
  if (driftScore > profile.deltaDrift * 0.72) {
    return "drift_review";
  }
  return "calibrated";
}

function createMatchEvidenceBasis(input: {
  readonly spec: CandidateSearchSpec;
  readonly subjectEvidence: PatientLinkSubjectEvidence;
  readonly candidate: PatientCandidateMatch;
  readonly profile: PatientLinkCalibrationProfile | null;
  readonly pdsOutcome: PdsEnrichmentOutcome;
  readonly candidateCount: number;
  readonly createdAt: string;
}): MatchEvidenceBasis {
  const features = featureValuesForCandidate(input.subjectEvidence, input.candidate.record);
  const missingnessFlags = missingnessForEvidence(input.subjectEvidence);
  const provenancePenalties = provenancePenaltiesForEvidence(
    input.subjectEvidence,
    input.pdsOutcome,
  );
  const driftScore = driftScoreForBasis({
    features,
    missingnessFlags,
    provenancePenalties,
    candidateCount: input.candidateCount,
  });
  return Object.freeze({
    matchEvidenceBasisId: deterministicId("meb", {
      candidateSetRef: input.candidate.candidateSetRef,
      subjectRef: input.subjectEvidence.subjectRef,
      candidatePatientRef: input.candidate.candidatePatientRef,
    }),
    schemaVersion: PATIENT_LINKER_SCHEMA_VERSION,
    policyVersion: PATIENT_LINKER_POLICY_VERSION,
    candidateSetRef: input.candidate.candidateSetRef,
    subjectRef: input.subjectEvidence.subjectRef,
    candidatePatientRef: input.candidate.candidatePatientRef,
    rawEvidenceRefs: Object.freeze([
      ...input.subjectEvidence.rawEvidenceRefs,
      ...input.candidate.record.rawEvidenceRefs,
    ]),
    normalizedFeatureValues: features,
    provenancePenalties: Object.freeze(provenancePenalties),
    missingnessFlags: Object.freeze(missingnessFlags),
    calibratorVersionRef: input.profile?.calibrationVersionRef ?? "missing_calibration_fail_closed",
    thresholdVersionRef: input.profile?.thresholdVersionRef ?? "missing_threshold_fail_closed",
    policyVersionRef: PATIENT_LINKER_POLICY_VERSION,
    confidenceModelState: modelStateForDrift(driftScore, input.profile),
    driftScore,
    createdAt: input.createdAt,
  });
}

function scoreBasis(
  basis: MatchEvidenceBasis,
  profile: PatientLinkCalibrationProfile | null,
): PatientLinkScore {
  if (!profile) {
    return Object.freeze({
      candidatePatientRef: basis.candidatePatientRef,
      basisRef: basis.matchEvidenceBasisId,
      logit: 0,
      P_link: 0,
      LCB_link_alpha: 0,
      UCB_link_alpha: 0,
      P_subject: 0,
      LCB_subject_alpha: 0,
      confidenceModelState: "out_of_domain",
      driftScore: basis.driftScore,
    });
  }
  const f = basis.normalizedFeatureValues;
  const c = profile.coefficients;
  const rawLogit =
    c.intercept +
    f.nhsNumberHashAgreement * c.nhsNumberHashAgreement +
    f.dateOfBirthAgreement * c.dateOfBirthAgreement +
    f.nameSimilarity * c.nameSimilarity +
    f.postcodeSimilarity * c.postcodeSimilarity +
    f.phoneEmailAgreementWithProvenancePenalty * c.phoneEmailAgreementWithProvenancePenalty +
    f.addressTokenSimilarity * c.addressTokenSimilarity +
    f.sourceReliability * c.sourceReliability +
    f.stepUpSupport * c.stepUpSupport;
  const P_link = round(sigmoid(rawLogit));
  const uncertainty = clamp01(
    profile.alphaLink * (0.05 + basis.missingnessFlags.length * 0.025 + basis.driftScore * 0.16),
  );
  const subjectProbability = round(
    clamp01(P_link * 0.72 + f.stepUpSupport * 0.18 + f.sourceReliability * 0.1),
  );
  const subjectUncertainty = clamp01(
    profile.alphaSubject * (0.04 + basis.missingnessFlags.length * 0.02 + basis.driftScore * 0.14),
  );
  return Object.freeze({
    candidatePatientRef: basis.candidatePatientRef,
    basisRef: basis.matchEvidenceBasisId,
    logit: round(rawLogit),
    P_link,
    LCB_link_alpha: round(clamp01(P_link - uncertainty)),
    UCB_link_alpha: round(clamp01(P_link + uncertainty / 1.35)),
    P_subject: subjectProbability,
    LCB_subject_alpha: round(clamp01(subjectProbability - subjectUncertainty)),
    confidenceModelState: basis.confidenceModelState,
    driftScore: basis.driftScore,
  });
}

function noCandidateDecision(input: {
  readonly spec: CandidateSearchSpec;
  readonly subjectEvidence: PatientLinkSubjectEvidence;
  readonly decidedAt: string;
}): PatientLinkDecision {
  return Object.freeze({
    patientLinkDecisionId: deterministicId("pld", {
      subjectRef: input.subjectEvidence.subjectRef,
      candidateSearchSpecRef: input.spec.candidateSearchSpecId,
      noCandidate: true,
      decidedAt: input.decidedAt,
    }),
    schemaVersion: PATIENT_LINKER_SCHEMA_VERSION,
    policyVersion: PATIENT_LINKER_POLICY_VERSION,
    candidateSearchSpecRef: input.spec.candidateSearchSpecId,
    matchEvidenceBasisRefs: Object.freeze(["meb_none_no_candidate"]),
    subjectRef: input.subjectEvidence.subjectRef,
    winnerCandidateRef: "none",
    runnerUpCandidateRef: null,
    P_link: 0,
    LCB_link_alpha: 0,
    UCB_link_alpha: 0,
    P_subject: 0,
    LCB_subject_alpha: 0,
    runnerUpProbabilityUpperBound: 0,
    gap_logit: 0,
    confidenceModelState: "drift_review",
    linkState: "none",
    decisionClass: "candidate_refresh",
    autoLinkChecks: Object.freeze({
      winnerLowerBoundPass: false,
      runnerUpCeilingPass: true,
      gapLogitPass: false,
      subjectProofFloorPass: false,
      driftPass: false,
      policyAllowsAutoLink: false,
    }),
    identityBindingAuthorityIntent: "submit_candidate_refresh",
    reasonCodes: Object.freeze(["LINK_172_NO_CANDIDATE_LIMITED_MODE"]),
    decidedAt: input.decidedAt,
  });
}

function choosePatientFacingState(decision: PatientLinkDecision): PatientLinkPatientFacingState {
  if (decision.linkState === "verified_patient") {
    return "signed_in_ready";
  }
  if (decision.linkState === "provisional_verified") {
    return "details_found_confirmation_needed";
  }
  if (decision.linkState === "none" || decision.linkState === "candidate") {
    return "limited_or_provisional_mode";
  }
  if (decision.linkState === "correction_pending") {
    return "identity_hold_bounded_recovery";
  }
  return "unable_to_confidently_match";
}

function reasonForFailedChecks(checks: PatientLinkAutoLinkChecks): string {
  if (!checks.driftPass) {
    return "LINK_172_MODEL_OUT_OF_DOMAIN_FAIL_CLOSED";
  }
  if (!checks.runnerUpCeilingPass || !checks.gapLogitPass) {
    return "LINK_172_RUNNER_UP_TOO_CLOSE";
  }
  if (!checks.subjectProofFloorPass) {
    return "LINK_172_SUBJECT_PROOF_BELOW_FLOOR";
  }
  if (!checks.winnerLowerBoundPass) {
    return "LINK_172_CONFIDENCE_BELOW_PROVISIONAL";
  }
  return "LINK_172_MANUAL_REVIEW_REQUIRED";
}

function buildPatientLinkDecision(input: {
  readonly spec: CandidateSearchSpec;
  readonly profile: PatientLinkCalibrationProfile | null;
  readonly bases: readonly MatchEvidenceBasis[];
  readonly scores: readonly PatientLinkScore[];
  readonly decidedAt: string;
}): PatientLinkDecision {
  if (input.scores.length === 0) {
    throw new Error("PATIENT_LINKER_DECISION_REQUIRES_SCORE");
  }
  const sorted = [...input.scores].sort((left, right) => right.P_link - left.P_link);
  const winner = sorted[0];
  if (!winner) {
    throw new Error("PATIENT_LINKER_WINNER_MISSING");
  }
  const runnerUp = sorted[1] ?? null;
  const thresholds = input.profile?.thresholds ?? {
    autoLinkLcbMin: 1,
    provisionalLcbMin: 1,
    runnerUpUcbMax: 0,
    subjectLcbMin: 1,
    gapLogitMin: 8,
    driftFailClosedPosture: "manual_review_only" as const,
  };
  const runnerUpProbabilityUpperBound = runnerUp?.UCB_link_alpha ?? 0;
  const gap_logit = runnerUp ? round(winner.logit - runnerUp.logit) : round(winner.logit);
  const policyAllowsAutoLink = input.profile?.minimumCalibrationPosture === "auto_link_allowed";
  const driftPass = winner.confidenceModelState === "calibrated";
  const autoLinkChecks = Object.freeze({
    winnerLowerBoundPass: winner.LCB_link_alpha >= thresholds.autoLinkLcbMin,
    runnerUpCeilingPass: runnerUpProbabilityUpperBound <= thresholds.runnerUpUcbMax,
    gapLogitPass: gap_logit >= thresholds.gapLogitMin,
    subjectProofFloorPass: winner.LCB_subject_alpha >= thresholds.subjectLcbMin,
    driftPass,
    policyAllowsAutoLink,
  });
  const provisionalChecksPass =
    input.profile?.minimumCalibrationPosture !== "manual_review_only" &&
    winner.LCB_link_alpha >= thresholds.provisionalLcbMin &&
    autoLinkChecks.runnerUpCeilingPass &&
    autoLinkChecks.gapLogitPass &&
    autoLinkChecks.subjectProofFloorPass &&
    driftPass;

  let linkState: PatientLinkState = "ambiguous";
  let decisionClass: PatientLinkDecisionClass = "manual_review_required";
  let identityBindingAuthorityIntent: PatientLinkAuthorityIntentKind = "submit_candidate_refresh";
  const reasonCodes: string[] = [];

  if (input.spec.routeSensitivityFamily === "identity_repair") {
    linkState = "correction_pending";
    decisionClass = "correction_pending";
    identityBindingAuthorityIntent = "submit_repair_signal";
    reasonCodes.push("LINK_172_REPAIR_AUTHORITY_ONLY");
  } else if (!input.profile) {
    reasonCodes.push("LINK_172_CALIBRATION_MISSING_FAIL_CLOSED");
  } else if (!driftPass) {
    linkState =
      thresholds.driftFailClosedPosture === "provisional_verified"
        ? "provisional_verified"
        : "ambiguous";
    decisionClass = "manual_review_required";
    identityBindingAuthorityIntent = "submit_repair_signal";
    reasonCodes.push("LINK_172_MODEL_OUT_OF_DOMAIN_FAIL_CLOSED");
  } else if (
    autoLinkChecks.winnerLowerBoundPass &&
    autoLinkChecks.runnerUpCeilingPass &&
    autoLinkChecks.gapLogitPass &&
    autoLinkChecks.subjectProofFloorPass &&
    autoLinkChecks.policyAllowsAutoLink
  ) {
    linkState = "verified_patient";
    decisionClass = "verified_bind";
    identityBindingAuthorityIntent = "submit_verified_bind";
    reasonCodes.push("LINK_172_STATUS_AUTO_LINK_ALLOWED");
  } else if (provisionalChecksPass) {
    linkState = "provisional_verified";
    decisionClass = "provisional_verify";
    identityBindingAuthorityIntent = "submit_provisional_verify";
    reasonCodes.push(
      input.spec.routeSensitivityFamily === "sms_continuation"
        ? "LINK_172_SMS_CONTINUATION_NO_AUTO_BIND"
        : "LINK_172_DRAFT_PROVISIONAL_ONLY",
    );
  } else {
    reasonCodes.push(reasonForFailedChecks(autoLinkChecks));
  }

  return Object.freeze({
    patientLinkDecisionId: deterministicId("pld", {
      candidateSearchSpecRef: input.spec.candidateSearchSpecId,
      winnerCandidateRef: winner.candidatePatientRef,
      runnerUpCandidateRef: runnerUp?.candidatePatientRef ?? null,
      decidedAt: input.decidedAt,
    }),
    schemaVersion: PATIENT_LINKER_SCHEMA_VERSION,
    policyVersion: PATIENT_LINKER_POLICY_VERSION,
    candidateSearchSpecRef: input.spec.candidateSearchSpecId,
    matchEvidenceBasisRefs: Object.freeze(input.bases.map((basis) => basis.matchEvidenceBasisId)),
    subjectRef: input.spec.subjectRef,
    winnerCandidateRef: winner.candidatePatientRef,
    runnerUpCandidateRef: runnerUp?.candidatePatientRef ?? null,
    P_link: winner.P_link,
    LCB_link_alpha: winner.LCB_link_alpha,
    UCB_link_alpha: winner.UCB_link_alpha,
    P_subject: winner.P_subject,
    LCB_subject_alpha: winner.LCB_subject_alpha,
    runnerUpProbabilityUpperBound,
    gap_logit,
    confidenceModelState: winner.confidenceModelState,
    linkState,
    decisionClass,
    autoLinkChecks,
    identityBindingAuthorityIntent,
    reasonCodes: Object.freeze(reasonCodes),
    decidedAt: input.decidedAt,
  });
}

function buildAuthorityIntent(input: {
  readonly decision: PatientLinkDecision;
  readonly subjectEvidence: PatientLinkSubjectEvidence;
  readonly submittedAt: string;
}): PatientLinkerAuthorityIntent {
  return Object.freeze({
    authorityIntentId: deterministicId("plai", {
      subjectRef: input.decision.subjectRef,
      patientLinkDecisionRef: input.decision.patientLinkDecisionId,
      intentKind: input.decision.identityBindingAuthorityIntent,
    }),
    subjectRef: input.decision.subjectRef,
    patientLinkDecisionRef: input.decision.patientLinkDecisionId,
    candidatePatientRef:
      input.decision.winnerCandidateRef === "none" ? null : input.decision.winnerCandidateRef,
    intentKind: input.decision.identityBindingAuthorityIntent,
    linkState: input.decision.linkState,
    decisionClass: input.decision.decisionClass,
    confidenceValues: Object.freeze({
      P_link: input.decision.P_link,
      LCB_link_alpha: input.decision.LCB_link_alpha,
      P_subject: input.decision.P_subject,
      LCB_subject_alpha: input.decision.LCB_subject_alpha,
      runnerUpProbabilityUpperBound: input.decision.runnerUpProbabilityUpperBound,
      gap_logit: input.decision.gap_logit,
    }),
    provenanceRefs: Object.freeze([...input.subjectEvidence.rawEvidenceRefs]),
    reasonCodes: Object.freeze([
      ...input.decision.reasonCodes,
      "LINK_172_LINKER_RECOMMENDS_AUTHORITY_SETTLES",
    ]),
    submittedAt: input.submittedAt,
  });
}

function cloneSearchAttributes(
  attributes: PatientLinkSearchAttributes,
): PatientLinkSearchAttributes {
  return Object.freeze({
    ...attributes,
    addressTokenSet: attributes.addressTokenSet
      ? Object.freeze([...attributes.addressTokenSet])
      : undefined,
  });
}

function cloneCandidateRecord(record: PatientIndexRecord): PatientIndexRecord {
  return Object.freeze({
    ...record,
    searchAttributes: cloneSearchAttributes(record.searchAttributes),
    rawEvidenceRefs: Object.freeze([...record.rawEvidenceRefs]),
  });
}

function cloneSpec(spec: CandidateSearchSpec): CandidateSearchSpec {
  return Object.freeze({
    ...spec,
    permittedSearchKeys: Object.freeze([...spec.permittedSearchKeys]),
    ignoredSearchKeys: Object.freeze(
      spec.ignoredSearchKeys.map((entry) => Object.freeze({ ...entry })),
    ),
    provenanceSources: Object.freeze([...spec.provenanceSources]),
    searchBoundaries: Object.freeze({ ...spec.searchBoundaries }),
  });
}

function cloneCandidate(candidate: PatientCandidateMatch): PatientCandidateMatch {
  return Object.freeze({
    ...candidate,
    matchedSearchKeys: Object.freeze([...candidate.matchedSearchKeys]),
    record: cloneCandidateRecord(candidate.record),
  });
}

function cloneBasis(basis: MatchEvidenceBasis): MatchEvidenceBasis {
  return Object.freeze({
    ...basis,
    rawEvidenceRefs: Object.freeze([...basis.rawEvidenceRefs]),
    normalizedFeatureValues: Object.freeze({ ...basis.normalizedFeatureValues }),
    provenancePenalties: Object.freeze(
      basis.provenancePenalties.map((penalty) => Object.freeze({ ...penalty })),
    ),
    missingnessFlags: Object.freeze([...basis.missingnessFlags]),
  });
}

function cloneDecision(decision: PatientLinkDecision): PatientLinkDecision {
  return Object.freeze({
    ...decision,
    matchEvidenceBasisRefs: Object.freeze([...decision.matchEvidenceBasisRefs]),
    autoLinkChecks: Object.freeze({ ...decision.autoLinkChecks }),
    reasonCodes: Object.freeze([...decision.reasonCodes]),
  });
}

function cloneAuthorityIntent(intent: PatientLinkerAuthorityIntent): PatientLinkerAuthorityIntent {
  return Object.freeze({
    ...intent,
    confidenceValues: Object.freeze({ ...intent.confidenceValues }),
    provenanceRefs: Object.freeze([...intent.provenanceRefs]),
    reasonCodes: Object.freeze([...intent.reasonCodes]),
  });
}

function cloneProfile(profile: PatientLinkCalibrationProfile): PatientLinkCalibrationProfile {
  return Object.freeze({
    ...profile,
    thresholds: Object.freeze({ ...profile.thresholds }),
    metrics: Object.freeze({
      ...profile.metrics,
      calibrationSlopeRange: Object.freeze([...profile.metrics.calibrationSlopeRange]) as readonly [
        number,
        number,
      ],
    }),
    coefficients: Object.freeze({ ...profile.coefficients }),
  });
}

export function createSeedPatientLinkCalibrationProfiles(): readonly PatientLinkCalibrationProfile[] {
  const createdAt = "2026-04-15T11:30:00Z";
  const baseCoefficients = {
    intercept: -4.2,
    nhsNumberHashAgreement: 4.4,
    dateOfBirthAgreement: 1.35,
    nameSimilarity: 1.2,
    postcodeSimilarity: 0.95,
    phoneEmailAgreementWithProvenancePenalty: 0.7,
    addressTokenSimilarity: 0.55,
    sourceReliability: 0.95,
    stepUpSupport: 0.9,
  };
  const profile = (
    routeSensitivityFamily: RouteSensitivityFamily,
    thresholdVersionRef: string,
    thresholds: PatientLinkThresholds,
    minimumCalibrationPosture: PatientLinkCalibrationProfile["minimumCalibrationPosture"],
  ): PatientLinkCalibrationProfile =>
    Object.freeze({
      linkCalibrationProfileId: deterministicId("lcp", {
        routeSensitivityFamily,
        thresholdVersionRef,
      }),
      schemaVersion: PATIENT_LINKER_SCHEMA_VERSION,
      policyVersion: PATIENT_LINKER_POLICY_VERSION,
      calibrationVersionRef: "LINK_CAL_178_SYNTHETIC_ADJUDICATED_V1",
      thresholdVersionRef,
      routeSensitivityFamily,
      calibratorType:
        minimumCalibrationPosture === "manual_review_only"
          ? "conservative_placeholder"
          : "platt_logistic",
      alphaLink: 0.12,
      alphaSubject: 0.1,
      deltaDrift: minimumCalibrationPosture === "manual_review_only" ? 0.28 : 0.45,
      thresholds,
      minimumCalibrationPosture,
      metrics: Object.freeze({
        brierScoreMax: minimumCalibrationPosture === "manual_review_only" ? 0.24 : 0.12,
        calibrationSlopeRange: Object.freeze([0.92, 1.08]) as readonly [number, number],
        minimumAdjudicatedExamples: minimumCalibrationPosture === "manual_review_only" ? 0 : 250,
      }),
      coefficients: Object.freeze(baseCoefficients),
      createdAt,
    });

  return Object.freeze([
    profile(
      "public_intake",
      "LINK_THRESH_172_PUBLIC_V1",
      {
        autoLinkLcbMin: 1,
        provisionalLcbMin: 0.82,
        runnerUpUcbMax: 0.05,
        subjectLcbMin: 0.95,
        gapLogitMin: 3.2,
        driftFailClosedPosture: "manual_review_only",
      },
      "manual_review_only",
    ),
    profile(
      "signed_in_draft_start",
      "LINK_THRESH_172_AUTH_DRAFT_V1",
      {
        autoLinkLcbMin: 0.965,
        provisionalLcbMin: 0.84,
        runnerUpUcbMax: 0.04,
        subjectLcbMin: 0.94,
        gapLogitMin: 3.6,
        driftFailClosedPosture: "ambiguous",
      },
      "provisional_only",
    ),
    profile(
      "authenticated_request_status",
      "LINK_THRESH_172_STATUS_V1",
      {
        autoLinkLcbMin: 0.97,
        provisionalLcbMin: 0.88,
        runnerUpUcbMax: 0.025,
        subjectLcbMin: 0.97,
        gapLogitMin: 4.2,
        driftFailClosedPosture: "ambiguous",
      },
      "auto_link_allowed",
    ),
    profile(
      "post_sign_in_attachment_write",
      "LINK_THRESH_172_ATTACHMENT_V1",
      {
        autoLinkLcbMin: 0.985,
        provisionalLcbMin: 0.92,
        runnerUpUcbMax: 0.015,
        subjectLcbMin: 0.985,
        gapLogitMin: 4.6,
        driftFailClosedPosture: "ambiguous",
      },
      "auto_link_allowed",
    ),
    profile(
      "sms_continuation",
      "LINK_THRESH_172_SMS_V1",
      {
        autoLinkLcbMin: 1,
        provisionalLcbMin: 0.9,
        runnerUpUcbMax: 0.02,
        subjectLcbMin: 0.975,
        gapLogitMin: 4.4,
        driftFailClosedPosture: "manual_review_only",
      },
      "provisional_only",
    ),
    profile(
      "identity_repair",
      "LINK_THRESH_172_REPAIR_V1",
      {
        autoLinkLcbMin: 1,
        provisionalLcbMin: 1,
        runnerUpUcbMax: 0,
        subjectLcbMin: 1,
        gapLogitMin: 8,
        driftFailClosedPosture: "manual_review_only",
      },
      "manual_review_only",
    ),
    profile(
      "future_protected_records",
      "LINK_THRESH_172_FUTURE_RECORDS_V1",
      {
        autoLinkLcbMin: 1,
        provisionalLcbMin: 1,
        runnerUpUcbMax: 0,
        subjectLcbMin: 1,
        gapLogitMin: 8,
        driftFailClosedPosture: "manual_review_only",
      },
      "manual_review_only",
    ),
    profile(
      "future_booking_surfaces",
      "LINK_THRESH_172_FUTURE_BOOKING_V1",
      {
        autoLinkLcbMin: 1,
        provisionalLcbMin: 1,
        runnerUpUcbMax: 0,
        subjectLcbMin: 1,
        gapLogitMin: 8,
        driftFailClosedPosture: "manual_review_only",
      },
      "manual_review_only",
    ),
  ]);
}

export function createSeedPatientLinkCalibrationRepository(
  profiles: readonly PatientLinkCalibrationProfile[] = createSeedPatientLinkCalibrationProfiles(),
): PatientLinkCalibrationRepository & {
  readonly snapshots: () => { readonly profiles: readonly PatientLinkCalibrationProfile[] };
} {
  const byRoute = new Map<RouteSensitivityFamily, PatientLinkCalibrationProfile>(
    profiles.map((profile) => [profile.routeSensitivityFamily, cloneProfile(profile)]),
  );
  return {
    async getProfile(routeSensitivityFamily) {
      const profile = byRoute.get(routeSensitivityFamily);
      return profile ? cloneProfile(profile) : null;
    },
    snapshots() {
      return Object.freeze({
        profiles: Object.freeze([...byRoute.values()].map(cloneProfile)),
      });
    },
  };
}

export function createDisabledPdsEnrichmentProvider(): PdsEnrichmentProvider {
  return {
    async enrich(input) {
      if (!input.featureFlagEnabled) {
        return Object.freeze({
          seamRef: PDS_ENRICHMENT_SEAM_REF,
          status: "disabled",
          pdsDemographicsRef: null,
          pdsLookupOutcome: "not_called",
          pdsProvenancePenalty: 0.04,
          reasonCodes: Object.freeze(["LINK_172_PDS_DISABLED_OR_UNAVAILABLE"]),
        });
      }
      if (!input.legalBasisEvidenceRef) {
        return Object.freeze({
          seamRef: PDS_ENRICHMENT_SEAM_REF,
          status: "legal_basis_missing",
          pdsDemographicsRef: null,
          pdsLookupOutcome: "not_called",
          pdsProvenancePenalty: 0.2,
          reasonCodes: Object.freeze(["LINK_172_PDS_LEGAL_BASIS_MISSING"]),
        });
      }
      return Object.freeze({
        seamRef: PDS_ENRICHMENT_SEAM_REF,
        status: "unavailable",
        pdsDemographicsRef: null,
        pdsLookupOutcome: "not_available",
        pdsProvenancePenalty: 0.1,
        reasonCodes: Object.freeze(["LINK_172_PDS_DISABLED_OR_UNAVAILABLE"]),
      });
    },
  };
}

export function createReferenceOnlyPdsEnrichmentProvider(
  pdsDemographicsRef: string,
): PdsEnrichmentProvider {
  return {
    async enrich(input) {
      if (!input.featureFlagEnabled) {
        return createDisabledPdsEnrichmentProvider().enrich(input);
      }
      if (!input.legalBasisEvidenceRef) {
        return createDisabledPdsEnrichmentProvider().enrich(input);
      }
      return Object.freeze({
        seamRef: PDS_ENRICHMENT_SEAM_REF,
        status: "enriched",
        pdsDemographicsRef,
        pdsLookupOutcome: "reference_returned",
        pdsProvenancePenalty: 0,
        reasonCodes: Object.freeze(["LINK_172_PDS_ENRICHMENT_REFERENCE_ONLY"]),
      });
    },
  };
}

export function createInMemoryIdentityBindingAuthorityIntentPort(): IdentityBindingAuthorityIntentPort & {
  readonly snapshots: () => {
    readonly intents: readonly PatientLinkerAuthorityIntent[];
  };
} {
  const intents = new Map<string, PatientLinkerAuthorityIntent>();
  return {
    async submitLinkIntent(input) {
      intents.set(input.authorityIntentId, cloneAuthorityIntent(input));
      return Object.freeze({
        authorityIntentRef: input.authorityIntentId,
        accepted: true,
        reasonCodes: Object.freeze([
          "LINK_172_AUTHORITY_INTENT_RECORDED",
          "LINK_172_LINKER_RECOMMENDS_AUTHORITY_SETTLES",
        ]),
      });
    },
    snapshots() {
      return Object.freeze({
        intents: Object.freeze([...intents.values()].map(cloneAuthorityIntent)),
      });
    },
  };
}

export function createInMemoryPatientLinkerRepository(options?: {
  readonly patientIndex?: readonly PatientIndexRecord[];
}): PatientLinkerRepository & {
  readonly snapshots: () => {
    readonly candidateSearchSpecs: readonly CandidateSearchSpec[];
    readonly candidateSets: readonly {
      readonly candidateSetRef: string;
      readonly candidateSearchSpecRef: string;
      readonly candidateRefs: readonly string[];
      readonly frozenAt: string;
    }[];
    readonly matchEvidenceBasis: readonly MatchEvidenceBasis[];
    readonly decisions: readonly PatientLinkDecision[];
    readonly authorityIntents: readonly PatientLinkerAuthorityIntent[];
    readonly pdsAudit: readonly {
      readonly subjectRef: string;
      readonly seamRef: string;
      readonly status: PdsEnrichmentStatus;
      readonly reasonCodes: readonly string[];
      readonly recordedAt: string;
    }[];
  };
} {
  const patientIndex = Object.freeze((options?.patientIndex ?? []).map(cloneCandidateRecord));
  const candidateSearchSpecs = new Map<string, CandidateSearchSpec>();
  const candidateSets: {
    readonly candidateSetRef: string;
    readonly candidateSearchSpecRef: string;
    readonly candidateRefs: readonly string[];
    readonly frozenAt: string;
  }[] = [];
  const matchEvidenceBasis = new Map<string, MatchEvidenceBasis>();
  const decisions = new Map<string, PatientLinkDecision>();
  const authorityIntents = new Map<string, PatientLinkerAuthorityIntent>();
  const pdsAudit: {
    readonly subjectRef: string;
    readonly seamRef: string;
    readonly status: PdsEnrichmentStatus;
    readonly reasonCodes: readonly string[];
    readonly recordedAt: string;
  }[] = [];

  return {
    async saveCandidateSearchSpec(spec) {
      candidateSearchSpecs.set(spec.candidateSearchSpecId, cloneSpec(spec));
    },
    async searchPatientCandidates(spec, subjectEvidence) {
      const matches = patientIndex
        .map((record) => {
          const matchedSearchKeys = spec.permittedSearchKeys.filter((key) =>
            searchKeyMatches(key, subjectEvidence.searchAttributes, record.searchAttributes),
          );
          return { record, matchedSearchKeys };
        })
        .filter((entry) => entry.matchedSearchKeys.length > 0)
        .sort((left, right) => {
          const countDelta = right.matchedSearchKeys.length - left.matchedSearchKeys.length;
          if (countDelta !== 0) {
            return countDelta;
          }
          return left.record.candidatePatientRef.localeCompare(right.record.candidatePatientRef);
        })
        .slice(0, spec.searchBoundaries.maxCandidateCount);
      const candidateSetRef = deterministicId("pcs", {
        candidateSearchSpecRef: spec.candidateSearchSpecId,
        candidateRefs: matches.map((entry) => entry.record.candidatePatientRef),
      });
      return Object.freeze(
        matches.map((entry, index) =>
          cloneCandidate({
            candidatePatientRef: entry.record.candidatePatientRef,
            candidateLabel: entry.record.candidateLabel,
            candidateRank: index + 1,
            candidateSetRef,
            matchedSearchKeys: Object.freeze([...entry.matchedSearchKeys]),
            record: entry.record,
          }),
        ),
      );
    },
    async saveCandidateSet(input) {
      candidateSets.push(
        Object.freeze({
          candidateSetRef: input.candidateSetRef,
          candidateSearchSpecRef: input.candidateSearchSpecRef,
          candidateRefs: Object.freeze([...input.candidateRefs]),
          frozenAt: input.frozenAt,
        }),
      );
    },
    async saveMatchEvidenceBasis(basis) {
      matchEvidenceBasis.set(basis.matchEvidenceBasisId, cloneBasis(basis));
    },
    async saveDecision(decision) {
      decisions.set(decision.patientLinkDecisionId, cloneDecision(decision));
    },
    async saveAuthorityIntent(intent) {
      authorityIntents.set(intent.authorityIntentId, cloneAuthorityIntent(intent));
    },
    async savePdsAudit(input) {
      pdsAudit.push(
        Object.freeze({
          subjectRef: input.subjectRef,
          seamRef: input.seamRef,
          status: input.status,
          reasonCodes: Object.freeze([...input.reasonCodes]),
          recordedAt: input.recordedAt,
        }),
      );
    },
    snapshots() {
      return Object.freeze({
        candidateSearchSpecs: Object.freeze([...candidateSearchSpecs.values()].map(cloneSpec)),
        candidateSets: Object.freeze(
          candidateSets.map((candidateSet) =>
            Object.freeze({
              ...candidateSet,
              candidateRefs: Object.freeze([...candidateSet.candidateRefs]),
            }),
          ),
        ),
        matchEvidenceBasis: Object.freeze([...matchEvidenceBasis.values()].map(cloneBasis)),
        decisions: Object.freeze([...decisions.values()].map(cloneDecision)),
        authorityIntents: Object.freeze([...authorityIntents.values()].map(cloneAuthorityIntent)),
        pdsAudit: Object.freeze(
          pdsAudit.map((entry) =>
            Object.freeze({
              ...entry,
              reasonCodes: Object.freeze([...entry.reasonCodes]),
            }),
          ),
        ),
      });
    },
  };
}

export function createPatientLinkerService(options: {
  readonly repository: PatientLinkerRepository;
  readonly calibrationRepository: PatientLinkCalibrationRepository;
  readonly pdsProvider: PdsEnrichmentProvider;
  readonly bindingAuthorityIntentPort: IdentityBindingAuthorityIntentPort;
}): PatientLinkerService {
  const repository = options.repository;
  const calibrationRepository = options.calibrationRepository;
  const pdsProvider = options.pdsProvider;
  const bindingAuthorityIntentPort = options.bindingAuthorityIntentPort;

  return {
    async evaluatePatientLink(input) {
      const observedAt = input.observedAt ?? nowIso();
      const pdsOutcome = await pdsProvider.enrich({
        subjectRef: input.subjectEvidence.subjectRef,
        routeSensitivityFamily: input.routeSensitivityFamily,
        permittedSearchKeys:
          input.permittedSearchKeys ?? defaultPermittedSearchKeys(input.subjectEvidence),
        localEvidenceRefs: input.subjectEvidence.rawEvidenceRefs,
        featureFlagEnabled: input.enablePdsEnrichment === true,
        legalBasisEvidenceRef: input.pdsLegalBasisEvidenceRef ?? null,
        observedAt,
      });
      await repository.savePdsAudit({
        subjectRef: input.subjectEvidence.subjectRef,
        seamRef: pdsOutcome.seamRef,
        status: pdsOutcome.status,
        reasonCodes: pdsOutcome.reasonCodes,
        recordedAt: observedAt,
      });

      const subjectEvidence: PatientLinkSubjectEvidence = Object.freeze({
        ...input.subjectEvidence,
        rawEvidenceRefs: Object.freeze([...input.subjectEvidence.rawEvidenceRefs]),
        provenanceSources: Object.freeze([...input.subjectEvidence.provenanceSources]),
        searchAttributes: Object.freeze({
          ...cloneSearchAttributes(input.subjectEvidence.searchAttributes),
          pdsDemographicRef:
            pdsOutcome.pdsDemographicsRef ??
            input.subjectEvidence.searchAttributes.pdsDemographicRef ??
            null,
        }),
        stepUpEvidenceRefs: input.subjectEvidence.stepUpEvidenceRefs
          ? Object.freeze([...input.subjectEvidence.stepUpEvidenceRefs])
          : undefined,
        contactPreferenceSeparationRef:
          input.subjectEvidence.contactPreferenceSeparationRef ??
          CONTACT_PREFERENCE_SEPARATION_RULESET_REF,
      });
      const permittedSearchKeys =
        input.permittedSearchKeys ?? defaultPermittedSearchKeys(subjectEvidence);
      const spec = buildCandidateSearchSpec({
        subjectEvidence,
        routeSensitivityFamily: input.routeSensitivityFamily,
        permittedSearchKeys,
        pdsOutcome,
        createdAt: observedAt,
      });
      await repository.saveCandidateSearchSpec(spec);
      const candidates = await repository.searchPatientCandidates(spec, subjectEvidence);
      const candidateSetRef =
        candidates[0]?.candidateSetRef ??
        deterministicId("pcs", {
          candidateSearchSpecRef: spec.candidateSearchSpecId,
          empty: true,
        });
      await repository.saveCandidateSet({
        candidateSetRef,
        candidateSearchSpecRef: spec.candidateSearchSpecId,
        candidateRefs: candidates.map((candidate) => candidate.candidatePatientRef),
        frozenAt: observedAt,
      });

      const profile = await calibrationRepository.getProfile(input.routeSensitivityFamily);
      const bases: MatchEvidenceBasis[] = [];
      for (const candidate of candidates) {
        const basis = createMatchEvidenceBasis({
          spec,
          subjectEvidence,
          candidate,
          profile,
          pdsOutcome,
          candidateCount: candidates.length,
          createdAt: observedAt,
        });
        bases.push(basis);
        await repository.saveMatchEvidenceBasis(basis);
      }
      const scores = bases.map((basis) => scoreBasis(basis, profile));
      const decision =
        candidates.length === 0
          ? noCandidateDecision({ spec, subjectEvidence, decidedAt: observedAt })
          : buildPatientLinkDecision({ spec, profile, bases, scores, decidedAt: observedAt });
      await repository.saveDecision(decision);

      const authorityIntent = buildAuthorityIntent({
        decision,
        subjectEvidence,
        submittedAt: observedAt,
      });
      await repository.saveAuthorityIntent(authorityIntent);
      const authoritySettlement =
        await bindingAuthorityIntentPort.submitLinkIntent(authorityIntent);

      return Object.freeze({
        candidateSearchSpec: spec,
        candidates: Object.freeze(candidates.map(cloneCandidate)),
        evidenceBases: Object.freeze(bases.map(cloneBasis)),
        scores: Object.freeze(scores),
        decision,
        authorityIntent,
        authoritySettlement,
        pdsOutcome,
        patientFacingState: choosePatientFacingState(decision),
      });
    },
  };
}

export function createPatientLinkerApplication(options?: {
  readonly repository?: PatientLinkerRepository;
  readonly calibrationRepository?: PatientLinkCalibrationRepository;
  readonly pdsProvider?: PdsEnrichmentProvider;
  readonly bindingAuthorityIntentPort?: IdentityBindingAuthorityIntentPort;
}): PatientLinkerApplication {
  const repository = options?.repository ?? createInMemoryPatientLinkerRepository();
  const calibrationRepository =
    options?.calibrationRepository ?? createSeedPatientLinkCalibrationRepository();
  const pdsProvider = options?.pdsProvider ?? createDisabledPdsEnrichmentProvider();
  const bindingAuthorityIntentPort =
    options?.bindingAuthorityIntentPort ?? createInMemoryIdentityBindingAuthorityIntentPort();
  return Object.freeze({
    patientLinker: createPatientLinkerService({
      repository,
      calibrationRepository,
      pdsProvider,
      bindingAuthorityIntentPort,
    }),
    repository,
    calibrationRepository,
    pdsProvider,
    bindingAuthorityIntentPort,
    migrationPlanRef: patientLinkerMigrationPlanRefs[0],
    migrationPlanRefs: patientLinkerMigrationPlanRefs,
    persistenceTables: patientLinkerPersistenceTables,
    parallelInterfaceGaps: patientLinkerParallelInterfaceGaps,
  });
}
