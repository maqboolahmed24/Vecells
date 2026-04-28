import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  ChannelReleaseCohortRegistry,
  ReleaseGuardrailPolicyRegistry,
  RouteFreezeDispositionResolver,
  createDefaultPhase7LiveControlApplication,
  type ChannelReleaseCohort,
  type ChannelReleaseStage,
  type CohortEvaluationResult,
  type FreezeMode,
  type FreezeTriggerType,
  type GuardrailEvaluationResult,
  type GuardrailObservationWindow,
  type JourneyChangeNotice,
  type JourneyChangeType,
  type LiveControlFailureReason,
  type NHSAppPerformancePack,
  type Phase7LiveControlApplication,
  type ReleaseGuardrailPolicy,
  type RouteFreezeDisposition,
} from "./phase7-live-control-service";
import {
  PHASE7_COMPATIBILITY_EVIDENCE_REF,
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  PHASE7_RELEASE_CANDIDATE_REF,
  type NhsAppEnvironment,
} from "./phase7-nhs-app-manifest-service";
import { redactSensitiveText, redactUrl } from "./phase7-nhs-app-onboarding-service";

export const PHASE7_NHS_APP_RELEASE_CONTROL_SERVICE_NAME =
  "Phase7NHSAppLimitedReleaseControlsAndPerformancePacks";
export const PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION =
  "397.phase7.nhs-app-release-controls.v1";

const RECORDED_AT = "2026-04-27T08:15:00.000Z";
const DEFAULT_POLICY_REF = "ReleaseGuardrailPolicy:397:nhs-app-limited-release";
const DEFAULT_KILL_SWITCH_REF = "KillSwitch:397:disable-nhs-app-jump-off-without-redeploy";
const DEFAULT_OPERATOR_NOTE_REF = "OperatorNote:397:fresh-green-window-release";

export const PHASE7_397_REQUIRED_JOURNEY_REFS = [
  "jp_start_medical_request",
  "jp_request_status",
  "jp_manage_local_appointment",
  "jp_pharmacy_status",
] as const;

export const PHASE7_397_REQUIRED_FREEZE_TRIGGERS = [
  "telemetry_missing",
  "threshold_breach",
  "assurance_slice_degraded",
  "compatibility_drift",
  "continuity_evidence_degraded",
] as const satisfies readonly FreezeTriggerType[];

export type ReleaseControlReadinessState = "ready" | "blocked";
export type ReleaseControlValidationFailureReason =
  | "cohort_manifest_empty"
  | "cohort_manifest_missing_required_journey"
  | "cohort_manifest_missing_limited_release"
  | "cohort_manifest_not_reversible_without_redeploy"
  | "cohort_manifest_release_tuple_drift"
  | "guardrail_policy_missing"
  | "guardrail_policy_missing_required_trigger"
  | "guardrail_policy_operator_release_not_required"
  | "guardrail_policy_rollback_action_missing"
  | "route_disposition_missing_required_journey"
  | "route_disposition_missing_patient_safe_mode"
  | "monthly_pack_unsafe_field_detected"
  | "change_notice_manifest_mismatch";

export interface ReleaseControlTuple {
  readonly manifestVersionRef: string;
  readonly configFingerprint: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly compatibilityEvidenceRef: string;
}

export interface ChannelReleaseCohortManifestEntry extends ChannelReleaseCohort {
  readonly cohortDisplayName: string;
  readonly stageGateRef: string;
  readonly exposureCeiling: number;
  readonly operatorApprovalRef: string;
  readonly reversibleWithoutRedeploy: boolean;
}

export interface ChannelReleaseCohortManifest {
  readonly taskId: "397";
  readonly schemaVersion: typeof PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly releaseTuple: ReleaseControlTuple;
  readonly cohorts: readonly ChannelReleaseCohortManifestEntry[];
}

export interface ReleaseGuardrailPolicyManifestEntry extends ReleaseGuardrailPolicy {
  readonly policyDisplayName: string;
  readonly requiredFreezeTriggers: readonly FreezeTriggerType[];
  readonly requiredAssuranceSliceRefs: readonly string[];
  readonly operatorReleaseRequired: boolean;
  readonly rollbackRehearsalRef: string;
  readonly monthlyPackMetricRefs: readonly string[];
}

export interface ReleaseGuardrailPolicyManifest {
  readonly taskId: "397";
  readonly schemaVersion: typeof PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly releaseTuple: ReleaseControlTuple;
  readonly policies: readonly ReleaseGuardrailPolicyManifestEntry[];
}

export interface RouteFreezeDispositionManifestEntry {
  readonly dispositionTemplateId: string;
  readonly journeyPathRef: string;
  readonly freezeMode: FreezeMode;
  readonly patientMessageRef: string;
  readonly safeRouteRef: string | null;
  readonly supportRecoveryRef: string;
  readonly operatorRunbookRef: string;
}

export interface RouteFreezeDispositionManifest {
  readonly taskId: "397";
  readonly schemaVersion: typeof PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly releaseTuple: ReleaseControlTuple;
  readonly dispositions: readonly RouteFreezeDispositionManifestEntry[];
}

export interface ReleaseControlValidationResult {
  readonly readinessState: ReleaseControlReadinessState;
  readonly failureReasons: readonly ReleaseControlValidationFailureReason[];
  readonly validatedJourneyRefs: readonly string[];
  readonly validatedCohortRefs: readonly string[];
  readonly validatedPolicyRefs: readonly string[];
  readonly validatedDispositionRefs: readonly string[];
}

export interface ReleaseControlReadinessReport {
  readonly taskId: "397";
  readonly schemaVersion: typeof PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly readinessState: ReleaseControlReadinessState;
  readonly cohortValidation: ReleaseControlValidationResult;
  readonly guardrailValidation: ReleaseControlValidationResult;
  readonly dispositionValidation: ReleaseControlValidationResult;
  readonly monthlyPackRedaction: MonthlyPackRedactionResult;
  readonly machineReadableSummary: {
    readonly cohortsCoverRequiredJourneys: boolean;
    readonly allFreezeTriggersConfigured: boolean;
    readonly routeFreezeDispositionModesComplete: boolean;
    readonly monthlyPackSafeForExport: boolean;
    readonly rollbackWithoutRedeploy: boolean;
  };
}

export interface MonthlyPackRedactionResult {
  readonly safeForExport: boolean;
  readonly failureReasons: readonly ReleaseControlValidationFailureReason[];
  readonly redactedPreviewHash: string;
}

export interface ReleaseControlRehearsalResult {
  readonly rehearsalId: string;
  readonly freezeDecision: CohortEvaluationResult;
  readonly killSwitchDecision: CohortEvaluationResult;
  readonly routeDispositions: readonly RouteFreezeDisposition[];
  readonly disabledJumpOffWithoutRedeploy: boolean;
  readonly rollbackActionRef: string | null;
  readonly generatedAt: string;
}

type RouteFreezeDispositionTemplate = Omit<
  RouteFreezeDisposition,
  | "dispositionId"
  | "manifestVersionRef"
  | "releaseApprovalFreezeRef"
  | "freezeRecordRef"
  | "activatedAt"
  | "releasedAt"
>;

const DEFAULT_RELEASE_TUPLE: ReleaseControlTuple = {
  manifestVersionRef: PHASE7_MANIFEST_VERSION,
  configFingerprint: PHASE7_CONFIG_FINGERPRINT,
  releaseCandidateRef: PHASE7_RELEASE_CANDIDATE_REF,
  releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  compatibilityEvidenceRef: PHASE7_COMPATIBILITY_EVIDENCE_REF,
};

const DEFAULT_GREEN_OBSERVATION_WINDOW: GuardrailObservationWindow = {
  sampleSize: 75,
  telemetryPresent: true,
  authFailureRate: 0.004,
  journeyErrorRate: 0.006,
  downloadFailureRate: 0.003,
  supportContactRate: 0.002,
  bridgeFailureRate: 0.002,
  routeResolutionFailureRate: 0.001,
  assuranceSliceState: "current",
  compatibilityEvidenceState: "current",
  continuityEvidenceState: "current",
  incidentCount: 0,
  accessibilityIssueCount: 0,
  safetyIssueCount: 0,
  observedAt: RECORDED_AT,
};

const SENSITIVE_MONTHLY_PACK_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/iu,
  /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/u,
  /\b(assertedLoginIdentity|asserted_login_identity|access_token|id_token)\b/iu,
  /\b(grantId|grant_id|patientId|patient_id|subjectRef|subject_ref)\s*[:=]/iu,
  /\b(NHS\s*number|nhsNumber|nhs_number)\s*[:=]\s*[0-9 ]{10,13}\b/iu,
] as const;

export const phase7NhsAppReleaseControlRoutes = [
  {
    routeId: "phase7_nhs_app_release_control_cohort_manifest_validate",
    method: "POST",
    path: "/internal/v1/nhs-app/release-controls/cohort-manifest:validate",
    contractFamily: "ChannelReleaseCohortManifestContract",
    purpose:
      "Validate NHS App limited-release cohorts by journey, ODS rule, population slice, stage, and explicit kill-switch binding.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_release_control_guardrails_evaluate",
    method: "POST",
    path: "/internal/v1/nhs-app/release-controls/guardrails:evaluate",
    contractFamily: "ReleaseGuardrailPolicyContract",
    purpose:
      "Evaluate release guardrails and open freeze conditions for telemetry, thresholds, assurance slices, compatibility, and continuity.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_release_control_route_freeze_resolve",
    method: "GET",
    path: "/internal/v1/nhs-app/release-controls/route-freeze-dispositions/current",
    contractFamily: "RouteFreezeDispositionContract",
    purpose:
      "Resolve patient-safe frozen route disposition as read-only, placeholder-only, or redirect-to-safe-route.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_release_control_kill_switch_rehearse",
    method: "POST",
    path: "/internal/v1/nhs-app/release-controls/kill-switches:rehearse",
    contractFamily: "ChannelReleaseFreezeRecordContract",
    purpose:
      "Rehearse rollback to disabled NHS App jump-off without redeploy while preserving the manifest tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_release_control_monthly_pack_generate",
    method: "GET",
    path: "/internal/v1/nhs-app/release-controls/performance-packs/monthly",
    contractFamily: "NHSAppPerformancePackContract",
    purpose:
      "Generate a privacy-minimized monthly NHS App performance pack from validated telemetry event contracts.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_release_control_change_notice_submit",
    method: "POST",
    path: "/internal/v1/nhs-app/release-controls/change-notices",
    contractFamily: "JourneyChangeNoticeContract",
    purpose:
      "Track NHS App journey change notices against manifest version, affected journeys, and required lead time.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export function load397JsonFile<T>(filePath: string, root = process.cwd()): T {
  return JSON.parse(fs.readFileSync(path.join(root, filePath), "utf8")) as T;
}

export function buildDefault397ChannelReleaseCohortManifest(): ChannelReleaseCohortManifest {
  return freeze({
    taskId: "397",
    schemaVersion: PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION,
    generatedAt: RECORDED_AT,
    releaseTuple: DEFAULT_RELEASE_TUPLE,
    cohorts: [
      buildCohortManifestEntry({
        cohortId: "ChannelReleaseCohort:397:limited-release-first-wave",
        cohortDisplayName: "Limited release first wave",
        releaseStage: "limited_release",
        environment: "limited_release",
        odsRules: ["A83001", "B82001"],
        patientPopulationRules: [
          "nhs_app_team_agreed_sample_users",
          "integration_manager_observers",
          "accessibility_assurance_users",
        ],
        enabledJourneys: PHASE7_397_REQUIRED_JOURNEY_REFS,
        exposureCeiling: 100,
        cohortState: "monitoring",
        startAt: "2026-05-04T09:00:00.000Z",
      }),
      buildCohortManifestEntry({
        cohortId: "ChannelReleaseCohort:397:full-release-after-green-window",
        cohortDisplayName: "Full release after green window",
        releaseStage: "full_release",
        environment: "full_release",
        odsRules: ["*"],
        patientPopulationRules: ["all_eligible_users_after_nhs_app_team_approval"],
        enabledJourneys: PHASE7_397_REQUIRED_JOURNEY_REFS,
        exposureCeiling: 0,
        cohortState: "disabled",
        startAt: "2026-06-01T09:00:00.000Z",
      }),
    ],
  });
}

export function buildDefault397ReleaseGuardrailPolicyManifest(): ReleaseGuardrailPolicyManifest {
  return freeze({
    taskId: "397",
    schemaVersion: PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION,
    generatedAt: RECORDED_AT,
    releaseTuple: DEFAULT_RELEASE_TUPLE,
    policies: [
      {
        policyId: DEFAULT_POLICY_REF,
        policyDisplayName: "NHS App limited release guardrails",
        minimumSampleSize: 25,
        maxAuthFailureRate: 0.02,
        maxJourneyErrorRate: 0.03,
        maxDownloadFailureRate: 0.05,
        maxSupportContactRate: 0.02,
        maxBridgeFailureRate: 0.03,
        sustainedGreenWindow: "P7D",
        freezeDuration: "PT24H",
        rollbackAction: "disable_jump_off_and_restore_browser_route",
        requiredFreezeTriggers: PHASE7_397_REQUIRED_FREEZE_TRIGGERS,
        requiredAssuranceSliceRefs: [
          "AssuranceSliceTrust:397:accessibility",
          "AssuranceSliceTrust:397:clinical-safety",
          "AssuranceSliceTrust:397:service-management",
        ],
        operatorReleaseRequired: true,
        rollbackRehearsalRef: "RollbackRehearsal:397:disable-jump-off-without-redeploy",
        monthlyPackMetricRefs: [
          "route_entry_count",
          "successful_completion_count",
          "completion_rate",
          "drop_off_rate",
          "guardrail_breach_reason",
          "incident_summary_ref",
        ],
      },
    ],
  });
}

export function buildDefault397RouteFreezeDispositionManifest(): RouteFreezeDispositionManifest {
  return freeze({
    taskId: "397",
    schemaVersion: PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION,
    generatedAt: RECORDED_AT,
    releaseTuple: DEFAULT_RELEASE_TUPLE,
    dispositions: [
      disposition("jp_start_medical_request", "placeholder_only", {
        patientMessageRef: "PatientMessage:397:start-request-paused",
        safeRouteRef: "/requests",
        supportRecoveryRef: "SupportRecovery:397:start-request-contact-practice",
      }),
      disposition("jp_request_status", "read_only", {
        patientMessageRef: "PatientMessage:397:status-read-only",
        safeRouteRef: "/requests/:requestId/status",
        supportRecoveryRef: "SupportRecovery:397:status-safe-summary",
      }),
      disposition("jp_manage_local_appointment", "redirect_to_safe_route", {
        patientMessageRef: "PatientMessage:397:appointment-safe-route",
        safeRouteRef: "/appointments",
        supportRecoveryRef: "SupportRecovery:397:appointment-practice-contact",
      }),
      disposition("jp_pharmacy_status", "read_only", {
        patientMessageRef: "PatientMessage:397:pharmacy-status-read-only",
        safeRouteRef: "/pharmacy/status",
        supportRecoveryRef: "SupportRecovery:397:pharmacy-status-safe-summary",
      }),
    ],
  });
}

export function validateChannelReleaseCohortManifest(
  manifest: ChannelReleaseCohortManifest,
): ReleaseControlValidationResult {
  const failureReasons: ReleaseControlValidationFailureReason[] = [];
  if (manifest.cohorts.length === 0) {
    appendUnique(failureReasons, "cohort_manifest_empty");
  }
  if (!manifest.cohorts.some((cohort) => cohort.releaseStage === "limited_release")) {
    appendUnique(failureReasons, "cohort_manifest_missing_limited_release");
  }
  for (const required of PHASE7_397_REQUIRED_JOURNEY_REFS) {
    if (!manifest.cohorts.some((cohort) => cohort.enabledJourneys.includes(required))) {
      appendUnique(failureReasons, "cohort_manifest_missing_required_journey");
    }
  }
  for (const cohort of manifest.cohorts) {
    if (!cohort.reversibleWithoutRedeploy || !cohort.killSwitchRef.includes("397")) {
      appendUnique(failureReasons, "cohort_manifest_not_reversible_without_redeploy");
    }
    if (
      cohort.manifestVersionRef !== manifest.releaseTuple.manifestVersionRef ||
      cohort.releaseApprovalFreezeRef !== manifest.releaseTuple.releaseApprovalFreezeRef
    ) {
      appendUnique(failureReasons, "cohort_manifest_release_tuple_drift");
    }
  }
  return validationResult({
    failureReasons,
    journeyRefs: unique(manifest.cohorts.flatMap((cohort) => [...cohort.enabledJourneys])),
    cohortRefs: manifest.cohorts.map((cohort) => cohort.cohortId),
    policyRefs: unique(manifest.cohorts.map((cohort) => cohort.guardrailPolicyRef)),
    dispositionRefs: [],
  });
}

export function validateReleaseGuardrailPolicyManifest(
  manifest: ReleaseGuardrailPolicyManifest,
): ReleaseControlValidationResult {
  const failureReasons: ReleaseControlValidationFailureReason[] = [];
  if (manifest.policies.length === 0) {
    appendUnique(failureReasons, "guardrail_policy_missing");
  }
  for (const policy of manifest.policies) {
    for (const required of PHASE7_397_REQUIRED_FREEZE_TRIGGERS) {
      if (!policy.requiredFreezeTriggers.includes(required)) {
        appendUnique(failureReasons, "guardrail_policy_missing_required_trigger");
      }
    }
    if (!policy.operatorReleaseRequired) {
      appendUnique(failureReasons, "guardrail_policy_operator_release_not_required");
    }
    if (policy.rollbackAction !== "disable_jump_off_and_restore_browser_route") {
      appendUnique(failureReasons, "guardrail_policy_rollback_action_missing");
    }
  }
  return validationResult({
    failureReasons,
    journeyRefs: [],
    cohortRefs: [],
    policyRefs: manifest.policies.map((policy) => policy.policyId),
    dispositionRefs: [],
  });
}

export function validateRouteFreezeDispositionManifest(
  manifest: RouteFreezeDispositionManifest,
): ReleaseControlValidationResult {
  const failureReasons: ReleaseControlValidationFailureReason[] = [];
  for (const required of PHASE7_397_REQUIRED_JOURNEY_REFS) {
    if (!manifest.dispositions.some((entry) => entry.journeyPathRef === required)) {
      appendUnique(failureReasons, "route_disposition_missing_required_journey");
    }
  }
  for (const requiredMode of ["read_only", "placeholder_only", "redirect_to_safe_route"] as const) {
    if (!manifest.dispositions.some((entry) => entry.freezeMode === requiredMode)) {
      appendUnique(failureReasons, "route_disposition_missing_patient_safe_mode");
    }
  }
  return validationResult({
    failureReasons,
    journeyRefs: unique(manifest.dispositions.map((entry) => entry.journeyPathRef)),
    cohortRefs: [],
    policyRefs: [],
    dispositionRefs: manifest.dispositions.map((entry) => entry.dispositionTemplateId),
  });
}

export function create397ReleaseControlApplication(input?: {
  readonly cohortManifest?: ChannelReleaseCohortManifest;
  readonly guardrailManifest?: ReleaseGuardrailPolicyManifest;
  readonly dispositionManifest?: RouteFreezeDispositionManifest;
}): Phase7LiveControlApplication {
  const cohortManifest = input?.cohortManifest ?? buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest =
    input?.guardrailManifest ?? buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest =
    input?.dispositionManifest ?? buildDefault397RouteFreezeDispositionManifest();
  return createDefaultPhase7LiveControlApplication({
    cohortRegistry: new ChannelReleaseCohortRegistry(cohortManifest.cohorts.map(toLiveCohort)),
    guardrailPolicyRegistry: new ReleaseGuardrailPolicyRegistry(
      guardrailManifest.policies.map(toLivePolicy),
    ),
    routeFreezeDispositionResolver: new RouteFreezeDispositionResolver(
      toDispositionTemplateMap(dispositionManifest),
    ),
  });
}

export function evaluate397ReleaseGuardrails(input: {
  readonly guardrailManifest: ReleaseGuardrailPolicyManifest;
  readonly policyId?: string;
  readonly observationWindow?: Partial<GuardrailObservationWindow>;
}): GuardrailEvaluationResult {
  const policyId = input.policyId ?? input.guardrailManifest.policies[0]?.policyId;
  if (!policyId) {
    throw new Error("397_RELEASE_GUARDRAIL_POLICY_MISSING");
  }
  const registry = new ReleaseGuardrailPolicyRegistry(
    input.guardrailManifest.policies.map(toLivePolicy),
  );
  return registry.evaluate(policyId, mergeObservationWindow(input.observationWindow));
}

export function resolve397RouteFreezeDisposition(input: {
  readonly dispositionManifest: RouteFreezeDispositionManifest;
  readonly activeFreeze: CohortEvaluationResult["freezeRecord"];
  readonly journeyPathRef: string;
}): RouteFreezeDisposition | null {
  if (!input.activeFreeze) {
    return null;
  }
  const template = toDispositionTemplateMap(input.dispositionManifest)[input.journeyPathRef];
  if (!template) {
    return null;
  }
  const core = {
    ...template,
    manifestVersionRef: input.activeFreeze.manifestVersionRef,
    releaseApprovalFreezeRef: input.activeFreeze.releaseApprovalFreezeRef,
    freezeRecordRef: input.activeFreeze.freezeRecordId,
    activatedAt: input.activeFreeze.openedAt,
    releasedAt: input.activeFreeze.releasedAt,
  };
  return freeze({
    dispositionId: `RouteFreezeDisposition:397:${hashString(stableStringify(core)).slice(7, 23)}`,
    ...core,
  });
}

export function release397FreezeWithFreshGreenWindow(input: {
  readonly application: Phase7LiveControlApplication;
  readonly guardrailManifest: ReleaseGuardrailPolicyManifest;
  readonly freezeRecordId: string;
  readonly expectedManifestVersion: string;
  readonly expectedReleaseApprovalFreezeRef: string;
  readonly operatorNoteRef: string;
  readonly greenWindowDays: number;
  readonly observationWindow?: Partial<GuardrailObservationWindow>;
  readonly now?: string;
}): ReturnType<Phase7LiveControlApplication["releaseFreeze"]> {
  if (!input.operatorNoteRef) {
    throw new Error("397_OPERATOR_RELEASE_NOTE_REQUIRED");
  }
  const policy = input.guardrailManifest.policies[0];
  if (!policy) {
    throw new Error("397_RELEASE_GUARDRAIL_POLICY_MISSING");
  }
  const requiredDays = parseDurationDays(policy.sustainedGreenWindow);
  if (input.greenWindowDays < requiredDays) {
    throw new Error("397_FRESH_GREEN_WINDOW_REQUIRED");
  }
  const guardrails = evaluate397ReleaseGuardrails({
    guardrailManifest: input.guardrailManifest,
    policyId: policy.policyId,
    observationWindow: input.observationWindow,
  });
  if (guardrails.guardrailState !== "green") {
    throw new Error(`397_GREEN_WINDOW_NOT_GREEN:${guardrails.failureReasons.join(",")}`);
  }
  return input.application.releaseFreeze({
    freezeRecordId: input.freezeRecordId,
    expectedManifestVersion: input.expectedManifestVersion,
    expectedReleaseApprovalFreezeRef: input.expectedReleaseApprovalFreezeRef,
    operatorNoteRef: input.operatorNoteRef,
    now: input.now,
  });
}

export function rehearse397GuardrailFreezeAndKillSwitch(input?: {
  readonly cohortManifest?: ChannelReleaseCohortManifest;
  readonly guardrailManifest?: ReleaseGuardrailPolicyManifest;
  readonly dispositionManifest?: RouteFreezeDispositionManifest;
  readonly cohortId?: string;
  readonly now?: string;
}): ReleaseControlRehearsalResult {
  const cohortManifest = input?.cohortManifest ?? buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest =
    input?.guardrailManifest ?? buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest =
    input?.dispositionManifest ?? buildDefault397RouteFreezeDispositionManifest();
  const freezeApplication = create397ReleaseControlApplication({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  const killSwitchApplication = create397ReleaseControlApplication({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  const cohortId = input?.cohortId ?? cohortManifest.cohorts[0]?.cohortId;
  if (!cohortId) {
    throw new Error("397_COHORT_MISSING_FOR_REHEARSAL");
  }
  const freezeDecision = freezeApplication.evaluateCohort({
    cohortId,
    observationWindow: {
      telemetryPresent: false,
      observedAt: input?.now ?? RECORDED_AT,
    },
    operatorNoteRef: "OperatorNote:397:guardrail-freeze-rehearsal",
    now: input?.now,
  });
  const killSwitchDecision = killSwitchApplication.activateKillSwitch({
    cohortId,
    operatorNoteRef: "OperatorNote:397:kill-switch-rehearsal",
    now: input?.now,
  });
  return freeze({
    rehearsalId: `ReleaseControlRehearsal:397:${hashString(stableStringify(killSwitchDecision.auditEvent)).slice(7, 23)}`,
    freezeDecision,
    killSwitchDecision,
    routeDispositions: killSwitchDecision.routeDispositions,
    disabledJumpOffWithoutRedeploy:
      killSwitchDecision.freezeRecord?.freezeState === "kill_switch_active" &&
      killSwitchDecision.freezeRecord.rollbackActionRef ===
        "disable_jump_off_and_restore_browser_route",
    rollbackActionRef: killSwitchDecision.freezeRecord?.rollbackActionRef ?? null,
    generatedAt: input?.now ?? RECORDED_AT,
  });
}

export function generate397MonthlyPerformancePack(input: {
  readonly cohortManifest?: ChannelReleaseCohortManifest;
  readonly guardrailManifest?: ReleaseGuardrailPolicyManifest;
  readonly dispositionManifest?: RouteFreezeDispositionManifest;
  readonly application?: Phase7LiveControlApplication;
  readonly environment: NhsAppEnvironment;
  readonly period: string;
  readonly cohortId?: string;
  readonly observationWindow?: Partial<GuardrailObservationWindow>;
  readonly now?: string;
}): NHSAppPerformancePack {
  const cohortManifest = input.cohortManifest ?? buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest =
    input.guardrailManifest ?? buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest =
    input.dispositionManifest ?? buildDefault397RouteFreezeDispositionManifest();
  const application =
    input.application ??
    create397ReleaseControlApplication({ cohortManifest, guardrailManifest, dispositionManifest });
  const cohort =
    (input.cohortId
      ? cohortManifest.cohorts.find((candidate) => candidate.cohortId === input.cohortId)
      : null) ??
    cohortManifest.cohorts.find((candidate) => candidate.environment === input.environment) ??
    cohortManifest.cohorts[0];
  if (!cohort) {
    throw new Error("397_MONTHLY_PACK_COHORT_MISSING");
  }
  const observation = mergeObservationWindow(input.observationWindow);
  const basePack = application.generatePerformancePack({
    environment: input.environment,
    period: input.period,
    cohortId: cohort.cohortId,
    observationWindow: input.observationWindow,
    now: input.now,
  });
  const journeyRefs = unique([...cohort.enabledJourneys, ...PHASE7_397_REQUIRED_JOURNEY_REFS]);
  const journeyUsage = journeyRefs.map((journeyPathRef) => {
    const routeEntryCount = observation.sampleSize;
    return {
      journeyPathRef,
      cohortRef: cohort.cohortId,
      routeEntryCount,
      successfulCompletionCount: Math.max(
        0,
        Math.round(
          routeEntryCount * (1 - observation.journeyErrorRate - observation.authFailureRate),
        ),
      ),
    };
  });
  const completionRates = journeyUsage.map((usage) => ({
    journeyPathRef: usage.journeyPathRef,
    rate: usage.routeEntryCount === 0 ? 0 : usage.successfulCompletionCount / usage.routeEntryCount,
  }));
  const dropOffs = journeyUsage.map((usage) => ({
    journeyPathRef: usage.journeyPathRef,
    rate: Math.min(1, observation.journeyErrorRate + observation.authFailureRate),
  }));
  const core = {
    ...basePack,
    packId: `NHSAppPerformancePack:397:${input.environment}:${input.period}`,
    manifestVersionRef: cohort.manifestVersionRef,
    releaseApprovalFreezeRef: cohort.releaseApprovalFreezeRef,
    journeyUsage,
    completionRates,
    dropOffs,
    generatedAt: input.now ?? RECORDED_AT,
  };
  const pack = freeze({
    ...core,
    packHash: hashString(stableStringify(core)),
  });
  const redaction = assert397MonthlyPackRedactionSafe(pack);
  if (!redaction.safeForExport) {
    throw new Error(`397_MONTHLY_PACK_UNSAFE:${redaction.failureReasons.join(",")}`);
  }
  return pack;
}

export function submit397JourneyChangeNotice(input: {
  readonly application: Phase7LiveControlApplication;
  readonly cohortManifest: ChannelReleaseCohortManifest;
  readonly changeType: JourneyChangeType;
  readonly affectedJourneys: readonly string[];
  readonly submittedAt?: string;
  readonly plannedChangeAt: string;
  readonly integrationManagerRef?: string;
}): JourneyChangeNotice {
  const configuredJourneys = new Set(
    input.cohortManifest.cohorts.flatMap((cohort) => [...cohort.enabledJourneys]),
  );
  for (const journey of input.affectedJourneys) {
    if (!configuredJourneys.has(journey)) {
      throw new Error(`397_CHANGE_NOTICE_UNKNOWN_JOURNEY:${journey}`);
    }
  }
  return input.application.submitJourneyChangeNotice({
    changeType: input.changeType,
    affectedJourneys: input.affectedJourneys,
    manifestVersion: input.cohortManifest.releaseTuple.manifestVersionRef,
    submittedAt: input.submittedAt,
    plannedChangeAt: input.plannedChangeAt,
    integrationManagerRef: input.integrationManagerRef,
  });
}

export function assert397MonthlyPackRedactionSafe(
  pack: NHSAppPerformancePack,
): MonthlyPackRedactionResult {
  const serialized = JSON.stringify(pack);
  const failureReasons: ReleaseControlValidationFailureReason[] = [];
  if (SENSITIVE_MONTHLY_PACK_PATTERNS.some((pattern) => pattern.test(serialized))) {
    appendUnique(failureReasons, "monthly_pack_unsafe_field_detected");
  }
  const redactedPreview = redact397SensitiveText(redactUrl(serialized));
  return freeze({
    safeForExport: failureReasons.length === 0,
    failureReasons,
    redactedPreviewHash: hashString(redactedPreview),
  });
}

export function redact397SensitiveText(value: string): string {
  return redactSensitiveText(value);
}

export function create397ReleaseControlReadinessReport(input: {
  readonly cohortManifest: ChannelReleaseCohortManifest;
  readonly guardrailManifest: ReleaseGuardrailPolicyManifest;
  readonly dispositionManifest: RouteFreezeDispositionManifest;
}): ReleaseControlReadinessReport {
  const cohortValidation = validateChannelReleaseCohortManifest(input.cohortManifest);
  const guardrailValidation = validateReleaseGuardrailPolicyManifest(input.guardrailManifest);
  const dispositionValidation = validateRouteFreezeDispositionManifest(input.dispositionManifest);
  const monthlyPack = generate397MonthlyPerformancePack({
    cohortManifest: input.cohortManifest,
    guardrailManifest: input.guardrailManifest,
    dispositionManifest: input.dispositionManifest,
    environment: "limited_release",
    period: "2026-05",
  });
  const monthlyPackRedaction = assert397MonthlyPackRedactionSafe(monthlyPack);
  const validations = [cohortValidation, guardrailValidation, dispositionValidation];
  const readinessState =
    validations.every((validation) => validation.readinessState === "ready") &&
    monthlyPackRedaction.safeForExport
      ? "ready"
      : "blocked";
  return freeze({
    taskId: "397",
    schemaVersion: PHASE7_NHS_APP_RELEASE_CONTROL_SCHEMA_VERSION,
    generatedAt: RECORDED_AT,
    readinessState,
    cohortValidation,
    guardrailValidation,
    dispositionValidation,
    monthlyPackRedaction,
    machineReadableSummary: {
      cohortsCoverRequiredJourneys: cohortValidation.failureReasons.every(
        (reason) => reason !== "cohort_manifest_missing_required_journey",
      ),
      allFreezeTriggersConfigured: guardrailValidation.failureReasons.every(
        (reason) => reason !== "guardrail_policy_missing_required_trigger",
      ),
      routeFreezeDispositionModesComplete: dispositionValidation.failureReasons.every(
        (reason) => reason !== "route_disposition_missing_patient_safe_mode",
      ),
      monthlyPackSafeForExport: monthlyPackRedaction.safeForExport,
      rollbackWithoutRedeploy: input.cohortManifest.cohorts.every(
        (cohort) => cohort.reversibleWithoutRedeploy,
      ),
    },
  });
}

export function validateReleaseControlsFromFiles(input: {
  readonly root?: string;
  readonly cohortManifestPath: string;
  readonly guardrailManifestPath: string;
  readonly dispositionManifestPath: string;
}): ReleaseControlReadinessReport {
  const root = input.root ?? process.cwd();
  return create397ReleaseControlReadinessReport({
    cohortManifest: load397JsonFile<ChannelReleaseCohortManifest>(input.cohortManifestPath, root),
    guardrailManifest: load397JsonFile<ReleaseGuardrailPolicyManifest>(
      input.guardrailManifestPath,
      root,
    ),
    dispositionManifest: load397JsonFile<RouteFreezeDispositionManifest>(
      input.dispositionManifestPath,
      root,
    ),
  });
}

function buildCohortManifestEntry(input: {
  readonly cohortId: string;
  readonly cohortDisplayName: string;
  readonly releaseStage: ChannelReleaseStage;
  readonly environment: NhsAppEnvironment;
  readonly odsRules: readonly string[];
  readonly patientPopulationRules: readonly string[];
  readonly enabledJourneys: readonly string[];
  readonly exposureCeiling: number;
  readonly cohortState: ChannelReleaseCohort["cohortState"];
  readonly startAt: string;
}): ChannelReleaseCohortManifestEntry {
  return freeze({
    cohortId: input.cohortId,
    cohortDisplayName: input.cohortDisplayName,
    odsRules: Array.from(input.odsRules),
    patientPopulationRules: Array.from(input.patientPopulationRules),
    enabledJourneys: Array.from(input.enabledJourneys),
    releaseStage: input.releaseStage,
    environment: input.environment,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    guardrailPolicyRef: DEFAULT_POLICY_REF,
    killSwitchRef: DEFAULT_KILL_SWITCH_REF,
    cohortState: input.cohortState,
    startAt: input.startAt,
    endAt: null,
    stageGateRef: `StageGate:397:${input.releaseStage}`,
    exposureCeiling: input.exposureCeiling,
    operatorApprovalRef: "OperatorApproval:397:nhs-app-implementation-manager",
    reversibleWithoutRedeploy: true,
  });
}

function disposition(
  journeyPathRef: string,
  freezeMode: FreezeMode,
  input: {
    readonly patientMessageRef: string;
    readonly safeRouteRef: string | null;
    readonly supportRecoveryRef: string;
  },
): RouteFreezeDispositionManifestEntry {
  return freeze({
    dispositionTemplateId: `RouteFreezeDispositionTemplate:397:${journeyPathRef}`,
    journeyPathRef,
    freezeMode,
    patientMessageRef: input.patientMessageRef,
    safeRouteRef: input.safeRouteRef,
    supportRecoveryRef: input.supportRecoveryRef,
    operatorRunbookRef: "ops/release/397_nhs_app_limited_release_runbook.md",
  });
}

function toLiveCohort(entry: ChannelReleaseCohortManifestEntry): ChannelReleaseCohort {
  return freeze({
    cohortId: entry.cohortId,
    odsRules: Array.from(entry.odsRules),
    patientPopulationRules: Array.from(entry.patientPopulationRules),
    enabledJourneys: Array.from(entry.enabledJourneys),
    releaseStage: entry.releaseStage,
    environment: entry.environment,
    manifestVersionRef: entry.manifestVersionRef,
    releaseApprovalFreezeRef: entry.releaseApprovalFreezeRef,
    guardrailPolicyRef: entry.guardrailPolicyRef,
    killSwitchRef: entry.killSwitchRef,
    cohortState: entry.cohortState,
    startAt: entry.startAt,
    endAt: entry.endAt,
  });
}

function toLivePolicy(entry: ReleaseGuardrailPolicyManifestEntry): ReleaseGuardrailPolicy {
  return freeze({
    policyId: entry.policyId,
    minimumSampleSize: entry.minimumSampleSize,
    maxAuthFailureRate: entry.maxAuthFailureRate,
    maxJourneyErrorRate: entry.maxJourneyErrorRate,
    maxDownloadFailureRate: entry.maxDownloadFailureRate,
    maxSupportContactRate: entry.maxSupportContactRate,
    maxBridgeFailureRate: entry.maxBridgeFailureRate,
    sustainedGreenWindow: entry.sustainedGreenWindow,
    freezeDuration: entry.freezeDuration,
    rollbackAction: entry.rollbackAction,
  });
}

function toDispositionTemplateMap(
  manifest: RouteFreezeDispositionManifest,
): Readonly<Record<string, RouteFreezeDispositionTemplate>> {
  return Object.fromEntries(
    manifest.dispositions.map((entry) => [
      entry.journeyPathRef,
      {
        journeyPathRef: entry.journeyPathRef,
        freezeMode: entry.freezeMode,
        patientMessageRef: entry.patientMessageRef,
        safeRouteRef: entry.safeRouteRef,
        supportRecoveryRef: entry.supportRecoveryRef,
      },
    ]),
  ) as Record<string, RouteFreezeDispositionTemplate>;
}

function mergeObservationWindow(
  input?: Partial<GuardrailObservationWindow>,
): GuardrailObservationWindow {
  return freeze({
    ...DEFAULT_GREEN_OBSERVATION_WINDOW,
    ...input,
  });
}

function validationResult(input: {
  readonly failureReasons: readonly ReleaseControlValidationFailureReason[];
  readonly journeyRefs: readonly string[];
  readonly cohortRefs: readonly string[];
  readonly policyRefs: readonly string[];
  readonly dispositionRefs: readonly string[];
}): ReleaseControlValidationResult {
  return freeze({
    readinessState: input.failureReasons.length === 0 ? "ready" : "blocked",
    failureReasons: unique(input.failureReasons),
    validatedJourneyRefs: unique(input.journeyRefs),
    validatedCohortRefs: unique(input.cohortRefs),
    validatedPolicyRefs: unique(input.policyRefs),
    validatedDispositionRefs: unique(input.dispositionRefs),
  });
}

function parseDurationDays(value: string): number {
  const match = /^P(?<days>\d+)D$/u.exec(value);
  return Number(match?.groups?.days ?? 0);
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue) &&
      !(nestedValue instanceof Date)
    ) {
      return Object.keys(nestedValue as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((accumulator, key) => {
          accumulator[key] = (nestedValue as Record<string, unknown>)[key];
          return accumulator;
        }, {});
    }
    return nestedValue;
  });
}

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}
