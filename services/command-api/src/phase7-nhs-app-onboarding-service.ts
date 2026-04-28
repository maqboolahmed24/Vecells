import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  createDefaultPhase7EnvironmentTelemetryApplication,
  type ChannelTelemetryPlan,
  type NHSAppEnvironmentProfile,
  type Phase7EnvironmentTelemetryApplication,
} from "./phase7-environment-telemetry-service";
import {
  PHASE7_BEHAVIOR_CONTRACT_SET_REF,
  PHASE7_COMPATIBILITY_EVIDENCE_REF,
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  PHASE7_RELEASE_CANDIDATE_REF,
  PHASE7_SURFACE_SCHEMA_SET_REF,
} from "./phase7-nhs-app-manifest-service";

export const PHASE7_NHS_APP_ONBOARDING_SERVICE_NAME =
  "Phase7NhsAppSandpitAosAndSCALEvidenceOnboardingService";
export const PHASE7_NHS_APP_ONBOARDING_SCHEMA_VERSION = "396.phase7.nhs-app-onboarding.v1";

const RECORDED_AT = "2026-04-27T09:00:00.000Z";
const REQUIRED_ENVIRONMENTS = ["sandpit", "aos"] as const;
const REQUIRED_DEMO_JOURNEYS = [
  "start_request",
  "request_status",
  "booking_manage",
  "pharmacy",
] as const;

const REQUIRED_JOURNEY_PATH_BY_DEMO_KIND: Record<DemoWalkthroughKind, string> = {
  start_request: "jp_start_medical_request",
  request_status: "jp_request_status",
  booking_manage: "jp_manage_local_appointment",
  pharmacy: "jp_pharmacy_status",
};

const SENSITIVE_QUERY_KEYS = [
  "assertedLoginIdentity",
  "asserted_login_identity",
  "access_token",
  "id_token",
  "refresh_token",
  "authorization",
  "code",
  "state",
  "nonce",
  "session",
  "sid",
  "jwt",
  "nhsNumber",
  "nhs_number",
  "patientId",
  "patient_id",
  "subjectRef",
] as const;

export type OnboardingAutomationMode = "dry-run" | "verify-only" | "capture-evidence";
export type OnboardingReadinessState = "ready" | "needs_action" | "blocked";
export type OnboardingParityState = "matching" | "drift" | "blocked";
export type DemoWalkthroughKind = (typeof REQUIRED_DEMO_JOURNEYS)[number];
export type EvidenceFreshnessState = "current" | "stale" | "expired";
export type EvidenceRedactionClass =
  | "public"
  | "internal"
  | "sensitive"
  | "secret"
  | "session_artifact"
  | "phi_url";

export type OnboardingFailureReason =
  | "environment_missing"
  | "environment_not_supported"
  | "manifest_tuple_drift"
  | "route_inventory_missing_required_journey"
  | "sandpit_aos_route_inventory_drift"
  | "sandpit_aos_tuple_drift"
  | "telemetry_plan_missing"
  | "demo_dataset_missing"
  | "demo_dataset_invalid"
  | "demo_reset_not_deterministic"
  | "scal_evidence_missing"
  | "scal_evidence_stale"
  | "redaction_policy_missing"
  | "redaction_required";

export interface OnboardingReleaseTuple {
  readonly manifestVersion: string;
  readonly configFingerprint: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly behaviorContractSetRef: string;
  readonly surfaceSchemaSetRef: string;
  readonly compatibilityEvidenceRef: string;
  readonly telemetryContractSetRef: string;
}

export interface OnboardingEnvironmentProfile extends OnboardingReleaseTuple {
  readonly environment: "sandpit" | "aos";
  readonly profileRef: string;
  readonly baseUrl: string;
  readonly routeInventoryRefs: readonly string[];
  readonly ssoConfigRef: string;
  readonly siteLinkConfigRef: string;
  readonly telemetryPlanRef: string;
  readonly demoDatasetRef: string;
  readonly scalBundleRef: string;
  readonly allowedCohorts: readonly string[];
  readonly browserAutomationMode: OnboardingAutomationMode;
  readonly evidenceExportPolicyRef: string;
  readonly redactionPolicyRef: string;
}

export interface NHSAppEnvironmentProfileManifest {
  readonly taskId: "396";
  readonly schemaVersion: typeof PHASE7_NHS_APP_ONBOARDING_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly promotedReleaseTuple: OnboardingReleaseTuple;
  readonly environments: readonly OnboardingEnvironmentProfile[];
}

export interface DemoJourneyRegistration {
  readonly journeyKind: DemoWalkthroughKind;
  readonly journeyPathRef: string;
  readonly scenarioRef: string;
  readonly syntheticSubjectRef: string;
  readonly resetAnchorRef: string;
  readonly expectedLandingState: string;
}

export interface DemoDatasetEnvironmentRegistration {
  readonly environment: "sandpit" | "aos";
  readonly datasetId: string;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly deterministicResetSeed: string;
  readonly resetOrdinal: number;
  readonly journeys: readonly DemoJourneyRegistration[];
}

export interface IntegrationDemoDatasetManifest {
  readonly taskId: "396";
  readonly schemaVersion: typeof PHASE7_NHS_APP_ONBOARDING_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly environments: readonly DemoDatasetEnvironmentRegistration[];
}

export interface SCALRequirementEvidence {
  readonly requirementId: string;
  readonly requirementTitle: string;
  readonly owner: string;
  readonly evidenceArtifacts: readonly SCALEvidenceArtifact[];
}

export interface SCALEvidenceArtifact {
  readonly artifactRef: string;
  readonly artifactPath: string;
  readonly artifactKind: string;
  readonly capturedAt: string;
  readonly freshnessDays: number;
  readonly redactionClass: EvidenceRedactionClass;
  readonly exportPolicy: "include_redacted" | "index_only" | "withhold";
  readonly sourceRefs: readonly string[];
}

export interface SCALSubmissionBundleManifest {
  readonly taskId: "396";
  readonly schemaVersion: typeof PHASE7_NHS_APP_ONBOARDING_SCHEMA_VERSION;
  readonly bundleId: string;
  readonly generatedAt: string;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly owner: string;
  readonly requirements: readonly SCALRequirementEvidence[];
}

export interface EnvironmentValidationResult {
  readonly environment: "sandpit" | "aos";
  readonly readinessState: OnboardingReadinessState;
  readonly failureReasons: readonly OnboardingFailureReason[];
  readonly profileRef: string | null;
  readonly tupleHash: string | null;
  readonly routeInventoryRefs: readonly string[];
}

export interface EnvironmentParityReport {
  readonly parityState: OnboardingParityState;
  readonly failureReasons: readonly OnboardingFailureReason[];
  readonly environmentResults: readonly EnvironmentValidationResult[];
  readonly comparedTupleHash: string | null;
  readonly checkedAt: string;
}

export interface DemoDatasetValidationResult {
  readonly readinessState: OnboardingReadinessState;
  readonly failureReasons: readonly OnboardingFailureReason[];
  readonly environmentResults: readonly DemoEnvironmentValidationResult[];
  readonly checkedAt: string;
}

export interface DemoEnvironmentValidationResult {
  readonly environment: "sandpit" | "aos";
  readonly datasetId: string | null;
  readonly missingJourneyKinds: readonly DemoWalkthroughKind[];
  readonly resetPlan: DemoResetPlan | null;
}

export interface DemoResetPlan {
  readonly resetRunId: string;
  readonly environment: "sandpit" | "aos";
  readonly datasetId: string;
  readonly resetOrdinal: number;
  readonly resetSeed: string;
  readonly beforeHash: string;
  readonly afterHash: string;
  readonly deterministic: boolean;
  readonly resetSteps: readonly string[];
}

export interface SCALEvidenceIndexRow {
  readonly requirementId: string;
  readonly requirementTitle: string;
  readonly owner: string;
  readonly artifactRef: string;
  readonly artifactPath: string;
  readonly artifactKind: string;
  readonly freshnessState: EvidenceFreshnessState;
  readonly capturedAt: string;
  readonly freshnessDays: number;
  readonly redactionClass: EvidenceRedactionClass;
  readonly exportPolicy: SCALEvidenceArtifact["exportPolicy"];
  readonly redactedArtifactPath: string;
  readonly redactionRequired: boolean;
  readonly sourceRefs: readonly string[];
}

export interface SCALEvidenceIndex {
  readonly bundleId: string;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly owner: string;
  readonly readinessState: OnboardingReadinessState;
  readonly failureReasons: readonly OnboardingFailureReason[];
  readonly rows: readonly SCALEvidenceIndexRow[];
  readonly indexedAt: string;
  readonly indexHash: string;
}

export interface RedactedEvidenceArtifact extends SCALEvidenceArtifact {
  readonly artifactPath: string;
  readonly redactionApplied: boolean;
}

export interface OnboardingSignoffChecklistRow {
  readonly checkId: string;
  readonly owner: string;
  readonly evidenceRef: string;
  readonly readinessState: OnboardingReadinessState;
  readonly blocker: string;
}

export interface OnboardingSignoffReadinessReport {
  readonly taskId: "396";
  readonly readinessState: OnboardingReadinessState;
  readonly generatedAt: string;
  readonly environmentParity: EnvironmentParityReport;
  readonly demoDatasetValidation: DemoDatasetValidationResult;
  readonly scalEvidenceIndex: SCALEvidenceIndex;
  readonly checklistRows: readonly OnboardingSignoffChecklistRow[];
  readonly machineReadableSummary: {
    readonly sandpitReady: boolean;
    readonly aosReady: boolean;
    readonly demoResetDeterministic: boolean;
    readonly scalEvidenceExportable: boolean;
    readonly promotedTupleHash: string | null;
  };
}

export const phase7NhsAppOnboardingRoutes = [
  {
    routeId: "phase7_nhs_app_onboarding_environment_parity",
    method: "POST",
    path: "/internal/v1/nhs-app/onboarding/environment-parity:validate",
    contractFamily: "NHSAppEnvironmentProfileOnboardingContract",
    purpose:
      "Validate Sandpit and AOS onboarding packs against the promoted NHS App manifest and release tuple.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_onboarding_demo_reset_plan",
    method: "POST",
    path: "/internal/v1/nhs-app/onboarding/demo-datasets:plan-reset",
    contractFamily: "IntegrationDemoDatasetOnboardingContract",
    purpose:
      "Build deterministic reset plans for Sandpit and AOS NHS App demo walkthrough datasets.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_onboarding_scal_index",
    method: "POST",
    path: "/internal/v1/nhs-app/onboarding/scal-bundles:index",
    contractFamily: "SCALBundleEvidenceIndexContract",
    purpose:
      "Index SCAL-supporting evidence by requirement, artifact, owner, freshness, and redaction class.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_onboarding_signoff_readiness",
    method: "POST",
    path: "/internal/v1/nhs-app/onboarding/signoff-readiness:evaluate",
    contractFamily: "NHSAppOnboardingSignoffReadinessContract",
    purpose:
      "Produce machine-readable sign-off readiness from Sandpit/AOS parity, demo reset, and SCAL evidence truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export function default396PromotedReleaseTuple(): OnboardingReleaseTuple {
  return freeze({
    manifestVersion: PHASE7_MANIFEST_VERSION,
    configFingerprint: PHASE7_CONFIG_FINGERPRINT,
    releaseCandidateRef: PHASE7_RELEASE_CANDIDATE_REF,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    behaviorContractSetRef: PHASE7_BEHAVIOR_CONTRACT_SET_REF,
    surfaceSchemaSetRef: PHASE7_SURFACE_SCHEMA_SET_REF,
    compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
    telemetryContractSetRef: "TelemetryContractSet:384:privacy-minimized",
  });
}

export function load396JsonFile<T>(filePath: string, root = process.cwd()): T {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  return JSON.parse(fs.readFileSync(resolvedPath, "utf8")) as T;
}

export function validateEnvironmentProfileManifest(
  manifest: NHSAppEnvironmentProfileManifest,
  application: Phase7EnvironmentTelemetryApplication = createDefaultPhase7EnvironmentTelemetryApplication(),
): EnvironmentParityReport {
  const failureReasons: OnboardingFailureReason[] = [];
  const environmentResults = REQUIRED_ENVIRONMENTS.map((environment) =>
    validateSingleEnvironmentProfile(manifest, environment, application),
  );

  appendAll(
    failureReasons,
    environmentResults.flatMap((result) => result.failureReasons),
  );

  const [sandpit, aos] = REQUIRED_ENVIRONMENTS.map((environment) =>
    manifest.environments.find((profile) => profile.environment === environment),
  );
  if (sandpit && aos) {
    if (stableStringify(sandpit.routeInventoryRefs) !== stableStringify(aos.routeInventoryRefs)) {
      appendUnique(failureReasons, "sandpit_aos_route_inventory_drift");
    }
    if (tupleHash(sandpit) !== tupleHash(aos)) {
      appendUnique(failureReasons, "sandpit_aos_tuple_drift");
    }
  }

  const comparedTupleHash =
    sandpit && aos && failureReasons.length === 0 ? tupleHash(manifest.promotedReleaseTuple) : null;
  return freeze({
    parityState: failureReasons.length === 0 ? "matching" : "drift",
    failureReasons: unique(failureReasons),
    environmentResults,
    comparedTupleHash,
    checkedAt: RECORDED_AT,
  });
}

export function compareSandpitAOSParity(
  manifest: NHSAppEnvironmentProfileManifest,
): EnvironmentParityReport {
  return validateEnvironmentProfileManifest(manifest);
}

export function validateDemoDatasetManifest(
  manifest: IntegrationDemoDatasetManifest,
): DemoDatasetValidationResult {
  const environmentResults = REQUIRED_ENVIRONMENTS.map((environment) => {
    const registration = manifest.environments.find((entry) => entry.environment === environment);
    if (!registration) {
      return freeze({
        environment,
        datasetId: null,
        missingJourneyKinds: [...REQUIRED_DEMO_JOURNEYS],
        resetPlan: null,
      });
    }
    const presentKinds = new Set(registration.journeys.map((journey) => journey.journeyKind));
    const missingJourneyKinds = REQUIRED_DEMO_JOURNEYS.filter((kind) => !presentKinds.has(kind));
    const resetPlan = createDemoResetPlan(registration);
    return freeze({
      environment,
      datasetId: registration.datasetId,
      missingJourneyKinds,
      resetPlan,
    });
  });

  const failureReasons: OnboardingFailureReason[] = [];
  for (const result of environmentResults) {
    if (!result.datasetId) {
      appendUnique(failureReasons, "demo_dataset_missing");
    }
    if (result.missingJourneyKinds.length > 0) {
      appendUnique(failureReasons, "demo_dataset_invalid");
    }
    if (result.resetPlan && !result.resetPlan.deterministic) {
      appendUnique(failureReasons, "demo_reset_not_deterministic");
    }
  }
  return freeze({
    readinessState: readinessFromFailures(failureReasons),
    failureReasons,
    environmentResults,
    checkedAt: RECORDED_AT,
  });
}

export function createDemoResetPlan(
  registration: DemoDatasetEnvironmentRegistration,
): DemoResetPlan {
  const resetMaterial = stableStringify({
    datasetId: registration.datasetId,
    environment: registration.environment,
    manifestVersionRef: registration.manifestVersionRef,
    releaseApprovalFreezeRef: registration.releaseApprovalFreezeRef,
    deterministicResetSeed: registration.deterministicResetSeed,
    journeys: registration.journeys.map((journey) => ({
      journeyKind: journey.journeyKind,
      journeyPathRef: journey.journeyPathRef,
      scenarioRef: journey.scenarioRef,
      resetAnchorRef: journey.resetAnchorRef,
    })),
  });
  const resetHash = hashString(resetMaterial);
  return freeze({
    resetRunId: `DemoDatasetReset:396:${registration.environment}:${registration.resetOrdinal}:${resetHash.slice(7, 19)}`,
    environment: registration.environment,
    datasetId: registration.datasetId,
    resetOrdinal: registration.resetOrdinal,
    resetSeed: registration.deterministicResetSeed,
    beforeHash: resetHash,
    afterHash: resetHash,
    deterministic: registration.deterministicResetSeed.length > 0,
    resetSteps: registration.journeys.map(
      (journey) =>
        `reset ${journey.journeyKind} via ${journey.resetAnchorRef} and verify ${journey.expectedLandingState}`,
    ),
  });
}

export function indexSCALBundle(
  manifest: SCALSubmissionBundleManifest,
  now = RECORDED_AT,
): SCALEvidenceIndex {
  const rows = manifest.requirements.flatMap((requirement) =>
    requirement.evidenceArtifacts.map((artifact) =>
      indexEvidenceArtifact(requirement, artifact, now),
    ),
  );
  const failureReasons: OnboardingFailureReason[] = [];
  if (rows.length === 0) {
    appendUnique(failureReasons, "scal_evidence_missing");
  }
  if (rows.some((row) => row.freshnessState !== "current")) {
    appendUnique(failureReasons, "scal_evidence_stale");
  }
  if (
    rows.some(
      (row) =>
        row.redactionRequired &&
        row.exportPolicy !== "include_redacted" &&
        row.exportPolicy !== "index_only" &&
        row.exportPolicy !== "withhold",
    )
  ) {
    appendUnique(failureReasons, "redaction_policy_missing");
  }
  const indexCore = {
    bundleId: manifest.bundleId,
    manifestVersionRef: manifest.manifestVersionRef,
    releaseApprovalFreezeRef: manifest.releaseApprovalFreezeRef,
    owner: manifest.owner,
    rows,
  };
  return freeze({
    ...indexCore,
    readinessState: readinessFromFailures(failureReasons),
    failureReasons,
    indexedAt: now,
    indexHash: hashString(stableStringify(indexCore)),
  });
}

export function redactSensitiveText(value: string): string {
  let redacted = value;
  redacted = redacted.replace(
    /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/giu,
    "Bearer [REDACTED:bearer-token]",
  );
  redacted = redacted.replace(
    /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/gu,
    "[REDACTED:jwt]",
  );
  redacted = redacted.replace(
    /\b(NHS\s*number|nhsNumber|nhs_number)\s*[:=]\s*[0-9 ]{10,13}\b/giu,
    "$1=[REDACTED:nhs-number]",
  );
  redacted = redacted.replace(
    /\b(patientId|patient_id|subjectRef|subject_ref|grantId|grant_id)\s*[:=]\s*[^&\s,;]+/giu,
    "$1=[REDACTED:identifier]",
  );
  for (const key of SENSITIVE_QUERY_KEYS) {
    redacted = redacted.replace(
      new RegExp(`([?&]${escapeRegExp(key)}=)[^&#\\s]+`, "giu"),
      `$1[REDACTED:${key}]`,
    );
  }
  return redacted;
}

export function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, `[REDACTED:${key}]`);
      }
    }
    return redactSensitiveText(url.toString());
  } catch {
    return redactSensitiveText(value);
  }
}

export function redactEvidenceRecord(artifact: SCALEvidenceArtifact): RedactedEvidenceArtifact {
  const redactionRequired = requiresRedaction(artifact.redactionClass);
  return freeze({
    ...artifact,
    artifactPath: redactionRequired
      ? redactUrl(artifact.artifactPath).replace(/\/[^/?#]+$/u, "/[REDACTED:artifact-name]")
      : artifact.artifactPath,
    redactionApplied: redactionRequired,
  });
}

export function createSignoffReadinessReport(
  environmentManifest: NHSAppEnvironmentProfileManifest,
  demoDatasetManifest: IntegrationDemoDatasetManifest,
  scalBundleManifest: SCALSubmissionBundleManifest,
): OnboardingSignoffReadinessReport {
  const environmentParity = validateEnvironmentProfileManifest(environmentManifest);
  const demoDatasetValidation = validateDemoDatasetManifest(demoDatasetManifest);
  const scalEvidenceIndex = indexSCALBundle(scalBundleManifest);
  const checklistRows = buildChecklistRows(
    environmentParity,
    demoDatasetValidation,
    scalEvidenceIndex,
  );
  const readinessState: OnboardingReadinessState = checklistRows.some(
    (row) => row.readinessState === "blocked",
  )
    ? "blocked"
    : checklistRows.some((row) => row.readinessState === "needs_action")
      ? "needs_action"
      : "ready";

  return freeze({
    taskId: "396",
    readinessState,
    generatedAt: RECORDED_AT,
    environmentParity,
    demoDatasetValidation,
    scalEvidenceIndex,
    checklistRows,
    machineReadableSummary: {
      sandpitReady: environmentParity.environmentResults.some(
        (result) => result.environment === "sandpit" && result.readinessState === "ready",
      ),
      aosReady: environmentParity.environmentResults.some(
        (result) => result.environment === "aos" && result.readinessState === "ready",
      ),
      demoResetDeterministic: demoDatasetValidation.environmentResults.every(
        (result) => result.resetPlan?.deterministic === true,
      ),
      scalEvidenceExportable:
        scalEvidenceIndex.readinessState === "ready" &&
        scalEvidenceIndex.rows.every(
          (row) =>
            !row.redactionRequired ||
            row.exportPolicy !== "include_redacted" ||
            row.redactedArtifactPath.includes("[REDACTED") ||
            row.redactionClass === "sensitive",
        ),
      promotedTupleHash: environmentParity.comparedTupleHash,
    },
  });
}

export function validateOnboardingAssetsFromFiles(input: {
  readonly environmentProfilePath: string;
  readonly demoDatasetPath: string;
  readonly scalBundlePath: string;
  readonly root?: string;
}): OnboardingSignoffReadinessReport {
  const root = input.root ?? process.cwd();
  return createSignoffReadinessReport(
    load396JsonFile<NHSAppEnvironmentProfileManifest>(input.environmentProfilePath, root),
    load396JsonFile<IntegrationDemoDatasetManifest>(input.demoDatasetPath, root),
    load396JsonFile<SCALSubmissionBundleManifest>(input.scalBundlePath, root),
  );
}

export function toCsvRows(rows: readonly Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0] ?? {});
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

function validateSingleEnvironmentProfile(
  manifest: NHSAppEnvironmentProfileManifest,
  environment: "sandpit" | "aos",
  application: Phase7EnvironmentTelemetryApplication,
): EnvironmentValidationResult {
  const profile = manifest.environments.find((entry) => entry.environment === environment);
  if (!profile) {
    return freeze({
      environment,
      readinessState: "blocked",
      failureReasons: ["environment_missing"],
      profileRef: null,
      tupleHash: null,
      routeInventoryRefs: [],
    });
  }

  const failureReasons: OnboardingFailureReason[] = [];
  const upstreamProfile = application.getEnvironmentProfile(environment);
  const upstreamTelemetryPlan = safeBuildTelemetryPlan(application, environment);
  const upstreamDataset = application.resetDemoDataset({ environment });
  const upstreamSCAL = application.assembleSCALBundle({ environment });

  if (!tuplesMatch(profile, manifest.promotedReleaseTuple)) {
    appendUnique(failureReasons, "manifest_tuple_drift");
  }
  if (upstreamProfile && !tuplesMatch(profile, onboardingTupleFromProfile(upstreamProfile))) {
    appendUnique(failureReasons, "manifest_tuple_drift");
  }
  if (!upstreamTelemetryPlan || upstreamTelemetryPlan.eventContractRefs.length === 0) {
    appendUnique(failureReasons, "telemetry_plan_missing");
  }
  if (!upstreamDataset || upstreamDataset.integrity.integrityState !== "valid") {
    appendUnique(failureReasons, "demo_dataset_invalid");
  }
  if (upstreamSCAL.submissionState === "blocked") {
    appendUnique(failureReasons, "scal_evidence_missing");
  }

  const routeInventory = new Set(profile.routeInventoryRefs);
  for (const journeyKind of REQUIRED_DEMO_JOURNEYS) {
    if (!routeInventory.has(REQUIRED_JOURNEY_PATH_BY_DEMO_KIND[journeyKind])) {
      appendUnique(failureReasons, "route_inventory_missing_required_journey");
    }
  }

  return freeze({
    environment,
    readinessState: readinessFromFailures(failureReasons),
    failureReasons,
    profileRef: profile.profileRef,
    tupleHash: tupleHash(profile),
    routeInventoryRefs: [...profile.routeInventoryRefs],
  });
}

function safeBuildTelemetryPlan(
  application: Phase7EnvironmentTelemetryApplication,
  environment: "sandpit" | "aos",
): ChannelTelemetryPlan | null {
  try {
    return application.buildTelemetryPlan({ environment });
  } catch {
    return null;
  }
}

function onboardingTupleFromProfile(profile: NHSAppEnvironmentProfile): OnboardingReleaseTuple {
  return {
    manifestVersion: profile.manifestVersionRef,
    configFingerprint: profile.configFingerprint,
    releaseCandidateRef: profile.releaseCandidateRef,
    releaseApprovalFreezeRef: profile.releaseApprovalFreezeRef,
    behaviorContractSetRef: profile.behaviorContractSetRef,
    surfaceSchemaSetRef: profile.surfaceSchemaSetRef,
    compatibilityEvidenceRef: profile.compatibilityEvidenceRef,
    telemetryContractSetRef: "TelemetryContractSet:384:privacy-minimized",
  };
}

function indexEvidenceArtifact(
  requirement: SCALRequirementEvidence,
  artifact: SCALEvidenceArtifact,
  now: string,
): SCALEvidenceIndexRow {
  const freshnessState = freshnessStateFor(artifact.capturedAt, artifact.freshnessDays, now);
  const redacted = redactEvidenceRecord(artifact);
  const redactionRequired = requiresRedaction(artifact.redactionClass);
  return freeze({
    requirementId: requirement.requirementId,
    requirementTitle: requirement.requirementTitle,
    owner: requirement.owner,
    artifactRef: artifact.artifactRef,
    artifactPath: redactionRequired ? redacted.artifactPath : artifact.artifactPath,
    artifactKind: artifact.artifactKind,
    freshnessState,
    capturedAt: artifact.capturedAt,
    freshnessDays: artifact.freshnessDays,
    redactionClass: artifact.redactionClass,
    exportPolicy: artifact.exportPolicy,
    redactedArtifactPath: redacted.artifactPath,
    redactionRequired,
    sourceRefs: artifact.sourceRefs,
  });
}

function freshnessStateFor(
  capturedAt: string,
  freshnessDays: number,
  now: string,
): EvidenceFreshnessState {
  const capturedTime = Date.parse(capturedAt);
  const nowTime = Date.parse(now);
  if (Number.isNaN(capturedTime) || Number.isNaN(nowTime)) {
    return "expired";
  }
  const ageDays = Math.max(0, (nowTime - capturedTime) / 86_400_000);
  if (ageDays <= freshnessDays) {
    return "current";
  }
  if (ageDays <= freshnessDays * 1.5) {
    return "stale";
  }
  return "expired";
}

function requiresRedaction(redactionClass: EvidenceRedactionClass): boolean {
  return (
    redactionClass === "secret" ||
    redactionClass === "session_artifact" ||
    redactionClass === "phi_url"
  );
}

function buildChecklistRows(
  environmentParity: EnvironmentParityReport,
  demoDatasetValidation: DemoDatasetValidationResult,
  scalEvidenceIndex: SCALEvidenceIndex,
): OnboardingSignoffChecklistRow[] {
  const sandpit = environmentParity.environmentResults.find(
    (result) => result.environment === "sandpit",
  );
  const aos = environmentParity.environmentResults.find((result) => result.environment === "aos");
  return [
    {
      checkId: "396_SIGNOFF_SANDPIT_TUPLE_READY",
      owner: "phase7-channel-assurance",
      evidenceRef: sandpit?.profileRef ?? "NHSAppEnvironmentProfile:396:sandpit:missing",
      readinessState: sandpit?.readinessState ?? "blocked",
      blocker: (sandpit?.failureReasons ?? ["environment_missing"]).join("|"),
    },
    {
      checkId: "396_SIGNOFF_AOS_TUPLE_READY",
      owner: "phase7-channel-assurance",
      evidenceRef: aos?.profileRef ?? "NHSAppEnvironmentProfile:396:aos:missing",
      readinessState: aos?.readinessState ?? "blocked",
      blocker: (aos?.failureReasons ?? ["environment_missing"]).join("|"),
    },
    {
      checkId: "396_SIGNOFF_DEMO_RESET_DETERMINISTIC",
      owner: "demo-environment-owner",
      evidenceRef: "IntegrationDemoDatasetManifest:396:current",
      readinessState: demoDatasetValidation.readinessState,
      blocker: demoDatasetValidation.failureReasons.join("|"),
    },
    {
      checkId: "396_SIGNOFF_SCAL_EVIDENCE_INDEX_CURRENT",
      owner: scalEvidenceIndex.owner,
      evidenceRef: scalEvidenceIndex.bundleId,
      readinessState: scalEvidenceIndex.readinessState,
      blocker: scalEvidenceIndex.failureReasons.join("|"),
    },
  ];
}

function readinessFromFailures(
  failureReasons: readonly OnboardingFailureReason[],
): OnboardingReadinessState {
  if (failureReasons.length === 0) {
    return "ready";
  }
  if (
    failureReasons.some((reason) =>
      [
        "environment_missing",
        "manifest_tuple_drift",
        "sandpit_aos_tuple_drift",
        "demo_dataset_missing",
        "demo_dataset_invalid",
        "scal_evidence_missing",
      ].includes(reason),
    )
  ) {
    return "blocked";
  }
  return "needs_action";
}

function tupleHash(value: OnboardingReleaseTuple): string {
  return hashString(
    stableStringify({
      manifestVersion: value.manifestVersion,
      configFingerprint: value.configFingerprint,
      releaseCandidateRef: value.releaseCandidateRef,
      releaseApprovalFreezeRef: value.releaseApprovalFreezeRef,
      behaviorContractSetRef: value.behaviorContractSetRef,
      surfaceSchemaSetRef: value.surfaceSchemaSetRef,
      compatibilityEvidenceRef: value.compatibilityEvidenceRef,
      telemetryContractSetRef: value.telemetryContractSetRef,
    }),
  );
}

function tuplesMatch(left: OnboardingReleaseTuple, right: OnboardingReleaseTuple): boolean {
  return tupleHash(left) === tupleHash(right);
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function appendAll<T>(values: T[], additions: readonly T[]): void {
  for (const value of additions) {
    appendUnique(values, value);
  }
}

function unique<T>(values: readonly T[]): T[] {
  const result: T[] = [];
  for (const value of values) {
    appendUnique(result, value);
  }
  return result;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(JSON.parse(JSON.stringify(value)) as T);
}
