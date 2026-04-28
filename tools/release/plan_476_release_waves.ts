import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

const TASK_ID = "seq_476";
const SCHEMA_VERSION = "476.programme.release-wave-manifest.v1";
const FIXED_NOW = "2026-04-28T00:00:00.000Z";

export type ReleaseWave476Scenario =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "blocked"
  | "superseded";

type WaveState =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "rolled_back"
  | "completed"
  | "superseded";

type EligibilityVerdict =
  | "eligible"
  | "eligible_with_constraints"
  | "observe_only"
  | "blocked"
  | "superseded";

type JsonObject = Record<string, unknown>;

interface WaveDefinition {
  readonly waveId: string;
  readonly label: string;
  readonly ladderLabel: string;
  readonly sequence: number;
  readonly tenantCohortId: string;
  readonly channelScopeId: string;
  readonly assistiveScopeId: string;
  readonly guardrailSnapshotId: string;
  readonly observationPolicyId: string;
  readonly rollbackBindingId: string;
  readonly manualFallbackBindingId: string;
  readonly communicationPlanId: string;
  readonly eligibilityVerdictId: string;
  readonly blastRadiusId: string;
  readonly owner: string;
  readonly exposure: Record<BlastRadiusAudience, number>;
  readonly routeFamilies: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly constraintRefs: readonly string[];
}

type BlastRadiusAudience = "patients" | "staff" | "pharmacy" | "hub" | "nhs_app" | "assistive";

const sourceRefs = [
  "prompt/476.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/platform-runtime-and-release-blueprint.md",
  "blueprint/phase-9-the-assurance-ledger.md",
  "blueprint/phase-7-inside-the-nhs-app.md",
  "blueprint/phase-8-the-assistive-layer.md",
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/migration/474_cutover_runbook.json",
  "data/migration/474_projection_readiness_verdicts.json",
  "data/bau/475_operating_model.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/release/release_candidate_tuple.json",
] as const;

const requiredInputPaths = [
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/migration/474_cutover_runbook.json",
  "data/migration/474_projection_readiness_verdicts.json",
  "data/bau/475_operating_model.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/release/release_candidate_tuple.json",
] as const;

const releaseActionBlockers = [
  "blocker:476:security-clinical-privacy-regulatory-signoffs-pending-seq-477",
  "blocker:476:external-dependency-manual-fallback-readiness-pending-seq-478",
  "blocker:476:dress-rehearsal-pending-seq-479",
  "blocker:476:uat-visual-regression-pending-seq-480",
  "blocker:476:dr-go-live-smoke-pending-seq-481",
  "blocker:476:wave-action-settlement-pending-seq-482",
  "blocker:476:wave-observation-settlement-pending-seq-483",
] as const;

const waveDefinitions: readonly WaveDefinition[] = [
  {
    waveId: "wave_476_1_core_web_canary",
    label: "Wave 1 core web canary",
    ladderLabel: "Wave 1",
    sequence: 1,
    tenantCohortId: "wtc_476_wave1_core_web_smallest_safe",
    channelScopeId: "wcs_476_wave1_core_web_only",
    assistiveScopeId: "was_476_wave1_assistive_shadow_only",
    guardrailSnapshotId: "wgs_476_wave1_core_web",
    observationPolicyId: "wop_476_wave1_24h",
    rollbackBindingId: "wrb_476_wave1_feature_surface_and_cutover",
    manualFallbackBindingId: "wmfb_476_wave1_core_web_manual_fallback",
    communicationPlanId: "wcp_476_wave1_core_web",
    eligibilityVerdictId: "wev_476_wave1_core_web_canary",
    blastRadiusId: "brm_476_wave1_core_web_canary",
    owner: "release-governance",
    exposure: { patients: 25, staff: 6, pharmacy: 0, hub: 2, nhs_app: 0, assistive: 0 },
    routeFamilies: ["patient_request_start", "patient_status", "staff_workspace", "ops_hub"],
    blockerRefs: releaseActionBlockers,
    constraintRefs: [
      "constraint:476:nhs-app-channel-excluded-from-wave1",
      "constraint:476:assistive-visible-mode-excluded-from-wave1",
      "constraint:476:pharmacy-dispatch-excluded-until-projection-exact",
    ],
  },
  {
    waveId: "wave_476_2_core_web_staff_pharmacy_after_projection",
    label: "Wave 2 staff and pharmacy after projection convergence",
    ladderLabel: "Wave 2",
    sequence: 2,
    tenantCohortId: "wtc_476_wave2_staff_pharmacy_after_projection",
    channelScopeId: "wcs_476_wave2_core_web_pharmacy",
    assistiveScopeId: "was_476_wave2_assistive_shadow_only",
    guardrailSnapshotId: "wgs_476_wave2_projection_lag",
    observationPolicyId: "wop_476_wave2_48h",
    rollbackBindingId: "wrb_476_wave2_feature_surface_reference_data_gap",
    manualFallbackBindingId: "wmfb_476_wave2_pharmacy_manual_dispatch",
    communicationPlanId: "wcp_476_wave2_staff_pharmacy",
    eligibilityVerdictId: "wev_476_wave2_patient_routes_no_pharmacy_yet",
    blastRadiusId: "brm_476_wave2_staff_pharmacy",
    owner: "release-governance",
    exposure: { patients: 80, staff: 24, pharmacy: 4, hub: 6, nhs_app: 0, assistive: 0 },
    routeFamilies: [
      "patient_request_start",
      "patient_status",
      "staff_workspace",
      "ops_hub",
      "pharmacy_dispatch",
    ],
    blockerRefs: [
      "blocker:476:pharmacy-console-projection-stale",
      "blocker:476:reference-data-rollback-gap",
      ...releaseActionBlockers,
    ],
    constraintRefs: ["constraint:476:pharmacy-dispatch-requires-exact-projection"],
  },
  {
    waveId: "wave_476_remaining_tenant_waves",
    label: "Remaining tenant cohorts",
    ladderLabel: "Remaining tenants",
    sequence: 3,
    tenantCohortId: "wtc_476_remaining_tenant_cohorts",
    channelScopeId: "wcs_476_core_web_remaining_tenants",
    assistiveScopeId: "was_476_remaining_assistive_shadow_only",
    guardrailSnapshotId: "wgs_476_remaining_tenant_waves",
    observationPolicyId: "wop_476_remaining_72h",
    rollbackBindingId: "wrb_476_remaining_tenants",
    manualFallbackBindingId: "wmfb_476_remaining_tenants",
    communicationPlanId: "wcp_476_remaining_tenants",
    eligibilityVerdictId: "wev_476_remaining_tenants_observe_only",
    blastRadiusId: "brm_476_remaining_tenants",
    owner: "release-governance",
    exposure: { patients: 420, staff: 120, pharmacy: 18, hub: 12, nhs_app: 0, assistive: 0 },
    routeFamilies: [
      "patient_request_start",
      "patient_status",
      "staff_workspace",
      "ops_hub",
      "pharmacy_dispatch",
    ],
    blockerRefs: [
      "blocker:476:tenant-regrouping-requires-new-selector-digest",
      ...releaseActionBlockers,
    ],
    constraintRefs: ["constraint:476:no-tenant-regroup-widening-without-new-wave-record"],
  },
  {
    waveId: "wave_476_channel_nhs_app_limited_release",
    label: "NHS App limited channel wave",
    ladderLabel: "Channel wave",
    sequence: 4,
    tenantCohortId: "wtc_476_nhs_app_limited_release",
    channelScopeId: "wcs_476_nhs_app_limited_release_blocked",
    assistiveScopeId: "was_476_nhs_app_assistive_not_applicable",
    guardrailSnapshotId: "wgs_476_nhs_app_channel_deferred",
    observationPolicyId: "wop_476_nhs_app_monthly_pack",
    rollbackBindingId: "wrb_476_nhs_app_route_freeze",
    manualFallbackBindingId: "wmfb_476_nhs_app_channel_deferred",
    communicationPlanId: "wcp_476_nhs_app_supplier_coordination",
    eligibilityVerdictId: "wev_476_nhs_app_channel_blocked",
    blastRadiusId: "brm_476_nhs_app_channel",
    owner: "release-governance",
    exposure: { patients: 0, staff: 0, pharmacy: 0, hub: 0, nhs_app: 0, assistive: 0 },
    routeFamilies: ["nhs_app_embedded_entry", "nhs_app_status", "nhs_app_artifact_delivery"],
    blockerRefs: [
      "blocker:476:phase7-nhs-app-channel-activation-deferred",
      "blocker:476:nhs-app-scal-and-connection-agreement-not-current",
      ...releaseActionBlockers,
    ],
    constraintRefs: ["constraint:476:monthly-data-pack-and-route-freeze-required"],
  },
  {
    waveId: "wave_476_assistive_narrow_staff_cohort",
    label: "Assistive narrow staff cohort",
    ladderLabel: "Assistive cohort",
    sequence: 5,
    tenantCohortId: "wtc_476_assistive_supervised_staff_cohort",
    channelScopeId: "wcs_476_assistive_core_staff_only",
    assistiveScopeId: "was_476_assistive_visible_narrow_staff",
    guardrailSnapshotId: "wgs_476_assistive_visible_ceiling",
    observationPolicyId: "wop_476_assistive_7d",
    rollbackBindingId: "wrb_476_assistive_freeze_disposition",
    manualFallbackBindingId: "wmfb_476_assistive_human_review",
    communicationPlanId: "wcp_476_assistive_staff_cohort",
    eligibilityVerdictId: "wev_476_assistive_narrow_visible_mode",
    blastRadiusId: "brm_476_assistive_staff_cohort",
    owner: "clinical-safety-officer",
    exposure: { patients: 0, staff: 10, pharmacy: 0, hub: 0, nhs_app: 0, assistive: 10 },
    routeFamilies: ["staff_workspace", "assistive_review_queue", "clinical_safety_review"],
    blockerRefs: [
      "blocker:476:assistive-all-staff-visible-mode-not-approved",
      "blocker:476:assistive-observation-window-not-satisfied",
      ...releaseActionBlockers,
    ],
    constraintRefs: ["constraint:476:visible-assistive-mode-supervised-staff-only"],
  },
];

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function withHash<T extends JsonObject>(
  record: T,
  hashField = "recordHash",
): T & { readonly recordHash: string } {
  return { ...record, [hashField]: hashValue(record) } as T & { readonly recordHash: string };
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function writeJson(relativePath: string, value: unknown): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value.endsWith("\n") ? value : `${value}\n`);
}

function scenarioState(scenario: ReleaseWave476Scenario): WaveState {
  if (scenario === "blocked") return "paused";
  return scenario;
}

function normalize476ScenarioState(value: string | null | undefined): ReleaseWave476Scenario {
  if (
    value === "draft" ||
    value === "approved" ||
    value === "active" ||
    value === "paused" ||
    value === "blocked" ||
    value === "superseded"
  ) {
    return value;
  }
  return "approved";
}

export { normalize476ScenarioState };

function waveStateFor(definition: WaveDefinition, scenario: ReleaseWave476Scenario): WaveState {
  if (scenario === "superseded") return "superseded";
  if (scenario === "draft") return "draft";
  if (scenario === "active" && definition.sequence === 1) return "active";
  if (scenario === "paused" && definition.sequence === 1) return "paused";
  if (scenario === "blocked" && definition.sequence === 1) return "paused";
  if (definition.sequence === 1) return "approved";
  return "draft";
}

function verdictFor(
  definition: WaveDefinition,
  scenario: ReleaseWave476Scenario,
): EligibilityVerdict {
  if (scenario === "superseded") return "superseded";
  if (scenario === "blocked" && definition.sequence === 1) return "blocked";
  if (definition.sequence === 1) return "eligible_with_constraints";
  if (definition.waveId === "wave_476_channel_nhs_app_limited_release") return "blocked";
  if (definition.waveId === "wave_476_assistive_narrow_staff_cohort") return "observe_only";
  if (definition.waveId === "wave_476_remaining_tenant_waves") return "observe_only";
  return "eligible_with_constraints";
}

function activationBlockersForScenario(scenario: ReleaseWave476Scenario): readonly string[] {
  if (scenario === "superseded") return ["blocker:476:runtime-publication-bundle-superseded"];
  if (scenario === "blocked") {
    return [
      "blocker:476:phase7-channel-reconciliation-stale",
      "blocker:476:bau-readiness-feed-stale",
      ...releaseActionBlockers,
    ];
  }
  return releaseActionBlockers;
}

function buildWaveTenantCohorts(releaseRefs: ReleaseRefs) {
  const cohorts = [
    {
      recordType: "WaveTenantCohort",
      cohortId: "wtc_476_wave1_core_web_smallest_safe",
      tenantScope: releaseRefs.tenantScope,
      cohortSelector:
        "tenant == tenant-demo-gp AND registered_patients.synthetic == true AND staff.role IN (clinician, care_navigator, support_analyst) AND cohort.wave == 1",
      selectorDigest: hashValue({
        tenant: releaseRefs.tenantScope,
        patientCount: 25,
        staffCount: 6,
        excludes: ["nhs_app", "assistive_visible_mode", "pharmacy_dispatch"],
      }),
      selectorAuthorityRef: "selector-authority:476:wave1-core-web-smallest-safe",
      allowedTenantCount: 1,
      allowedPatientCount: 25,
      allowedStaffCount: 6,
      regroupingPolicy:
        "selector digest must be republished before tenant regrouping can widen scope",
      owner: "release-governance",
      state: "approved",
      sourceRefs,
      evidenceRefs: [
        "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
        "data/bau/475_operating_model.json",
      ],
      wormAuditRef: "worm-ledger:476:tenant-cohort:wave1",
    },
    {
      recordType: "WaveTenantCohort",
      cohortId: "wtc_476_wave2_staff_pharmacy_after_projection",
      tenantScope: releaseRefs.tenantScope,
      cohortSelector:
        "tenant == tenant-demo-gp AND wave1.settled == true AND pharmacy_projection.state == exact",
      selectorDigest: hashValue({
        tenant: releaseRefs.tenantScope,
        patientCount: 80,
        staffCount: 24,
        pharmacyUsers: 4,
        requires: ["pharmacy_projection_exact"],
      }),
      selectorAuthorityRef: "selector-authority:476:wave2-pharmacy-after-projection",
      allowedTenantCount: 1,
      allowedPatientCount: 80,
      allowedStaffCount: 24,
      regroupingPolicy: "blocked until pharmacy projection and reference-data rollback are exact",
      owner: "release-governance",
      state: "draft",
      sourceRefs,
      evidenceRefs: ["data/migration/474_projection_readiness_verdicts.json"],
      wormAuditRef: "worm-ledger:476:tenant-cohort:wave2",
    },
    {
      recordType: "WaveTenantCohort",
      cohortId: "wtc_476_remaining_tenant_cohorts",
      tenantScope: "tenant-group:remaining-programme-tenants",
      cohortSelector:
        "tenant.group == remaining-programme-tenants AND previous_waves.completed == true",
      selectorDigest: hashValue({
        tenantGroup: "remaining-programme-tenants",
        requires: ["previous_waves_completed", "new_selector_digest_after_regrouping"],
      }),
      selectorAuthorityRef: "selector-authority:476:remaining-tenants",
      allowedTenantCount: 6,
      allowedPatientCount: 420,
      allowedStaffCount: 120,
      regroupingPolicy: "blocked if the tenant grouping changes without a new selector digest",
      owner: "release-governance",
      state: "draft",
      sourceRefs,
      evidenceRefs: ["data/bau/475_operating_model.json"],
      wormAuditRef: "worm-ledger:476:tenant-cohort:remaining",
    },
    {
      recordType: "WaveTenantCohort",
      cohortId: "wtc_476_nhs_app_limited_release",
      tenantScope: releaseRefs.tenantScope,
      cohortSelector:
        "tenant == tenant-demo-gp AND nhs_app_limited_release_approval == true AND sample_users <= agreed_plan",
      selectorDigest: hashValue({
        tenant: releaseRefs.tenantScope,
        channel: "nhs_app",
        activationPermitted: false,
        sampleUsers: 0,
      }),
      selectorAuthorityRef: "selector-authority:476:nhs-app-limited-release-blocked",
      allowedTenantCount: 0,
      allowedPatientCount: 0,
      allowedStaffCount: 0,
      regroupingPolicy: "NHS App cohort remains zero until Phase 7 channel authority is current",
      owner: "release-governance",
      state: "draft",
      sourceRefs,
      evidenceRefs: ["data/conformance/473_phase7_channel_readiness_reconciliation.json"],
      wormAuditRef: "worm-ledger:476:tenant-cohort:nhs-app",
    },
    {
      recordType: "WaveTenantCohort",
      cohortId: "wtc_476_assistive_supervised_staff_cohort",
      tenantScope: releaseRefs.tenantScope,
      cohortSelector:
        "tenant == tenant-demo-gp AND staff.role IN (clinical_safety_officer, clinician_superuser) AND assistive.mode == visible_summary",
      selectorDigest: hashValue({
        tenant: releaseRefs.tenantScope,
        staffRoles: ["clinical_safety_officer", "clinician_superuser"],
        allStaffPermitted: false,
      }),
      selectorAuthorityRef: "selector-authority:476:assistive-narrow-staff",
      allowedTenantCount: 1,
      allowedPatientCount: 0,
      allowedStaffCount: 10,
      regroupingPolicy: "all-staff assistive exposure requires a separate slice contract",
      owner: "clinical-safety-officer",
      state: "draft",
      sourceRefs,
      evidenceRefs: ["blueprint/phase-8-the-assistive-layer.md"],
      wormAuditRef: "worm-ledger:476:tenant-cohort:assistive",
    },
  ];
  return cohorts.map((record) => withHash(record));
}

function buildChannelScopes(releaseRefs: ReleaseRefs) {
  return [
    {
      scopeId: "wcs_476_wave1_core_web_only",
      recordType: "WaveChannelScope",
      tenantScope: releaseRefs.tenantScope,
      allowedChannels: ["core_web", "staff_workspace", "ops_hub"],
      explicitlyExcludedChannels: ["nhs_app", "pharmacy_dispatch"],
      routeFamilies: ["patient_request_start", "patient_status", "staff_workspace", "ops_hub"],
      routeFreezeDispositionRef: "RouteFreezeDisposition:476:core-web-only",
      informalFeatureFlagsPermitted: false,
      channelActivationPermitted: true,
      owner: "release-governance",
      sourceRefs,
      blockerRefs: [],
      state: "approved",
    },
    {
      scopeId: "wcs_476_wave2_core_web_pharmacy",
      recordType: "WaveChannelScope",
      tenantScope: releaseRefs.tenantScope,
      allowedChannels: ["core_web", "staff_workspace", "ops_hub", "pharmacy_console"],
      explicitlyExcludedChannels: ["nhs_app"],
      routeFamilies: [
        "patient_request_start",
        "patient_status",
        "staff_workspace",
        "ops_hub",
        "pharmacy_dispatch",
      ],
      routeFreezeDispositionRef: "RouteFreezeDisposition:476:pharmacy-waits-for-projection",
      informalFeatureFlagsPermitted: false,
      channelActivationPermitted: false,
      owner: "release-governance",
      sourceRefs,
      blockerRefs: ["blocker:476:pharmacy-console-projection-stale"],
      state: "draft",
    },
    {
      scopeId: "wcs_476_core_web_remaining_tenants",
      recordType: "WaveChannelScope",
      tenantScope: "tenant-group:remaining-programme-tenants",
      allowedChannels: ["core_web", "staff_workspace", "ops_hub", "pharmacy_console"],
      explicitlyExcludedChannels: ["nhs_app"],
      routeFamilies: [
        "patient_request_start",
        "patient_status",
        "staff_workspace",
        "ops_hub",
        "pharmacy_dispatch",
      ],
      routeFreezeDispositionRef: "RouteFreezeDisposition:476:remaining-tenants",
      informalFeatureFlagsPermitted: false,
      channelActivationPermitted: false,
      owner: "release-governance",
      sourceRefs,
      blockerRefs: ["blocker:476:tenant-regrouping-requires-new-selector-digest"],
      state: "draft",
    },
    {
      scopeId: "wcs_476_nhs_app_limited_release_blocked",
      recordType: "WaveChannelScope",
      tenantScope: releaseRefs.tenantScope,
      allowedChannels: [],
      explicitlyExcludedChannels: ["nhs_app"],
      routeFamilies: ["nhs_app_embedded_entry", "nhs_app_status", "nhs_app_artifact_delivery"],
      routeFreezeDispositionRef: "RouteFreezeDisposition:476:nhs-app-deferred",
      informalFeatureFlagsPermitted: false,
      channelActivationPermitted: false,
      owner: "release-governance",
      sourceRefs,
      blockerRefs: ["blocker:476:phase7-nhs-app-channel-activation-deferred"],
      state: "draft",
    },
    {
      scopeId: "wcs_476_assistive_core_staff_only",
      recordType: "WaveChannelScope",
      tenantScope: releaseRefs.tenantScope,
      allowedChannels: ["staff_workspace"],
      explicitlyExcludedChannels: ["nhs_app", "patient_web", "pharmacy_console"],
      routeFamilies: ["staff_workspace", "assistive_review_queue", "clinical_safety_review"],
      routeFreezeDispositionRef: "RouteFreezeDisposition:476:assistive-staff-only",
      informalFeatureFlagsPermitted: false,
      channelActivationPermitted: true,
      owner: "clinical-safety-officer",
      sourceRefs,
      blockerRefs: ["blocker:476:assistive-all-staff-visible-mode-not-approved"],
      state: "draft",
    },
  ].map((record) => withHash(record));
}

function buildAssistiveScopes(releaseRefs: ReleaseRefs) {
  return [
    {
      assistiveScopeId: "was_476_wave1_assistive_shadow_only",
      recordType: "WaveAssistiveScope",
      tenantScope: releaseRefs.tenantScope,
      mode: "shadow_only",
      visibleModePermitted: false,
      visibleStaffCohort: [],
      allStaffPermitted: false,
      patientFacingPermitted: false,
      trustEnvelopeRef: "AssistiveTrustEnvelope:476:shadow-only",
      freezeDispositionRef: "AssistiveFreezeDisposition:476:wave1-shadow-only",
      owner: "clinical-safety-officer",
      state: "approved",
      sourceRefs,
      blockerRefs: [],
    },
    {
      assistiveScopeId: "was_476_wave2_assistive_shadow_only",
      recordType: "WaveAssistiveScope",
      tenantScope: releaseRefs.tenantScope,
      mode: "shadow_only",
      visibleModePermitted: false,
      visibleStaffCohort: [],
      allStaffPermitted: false,
      patientFacingPermitted: false,
      trustEnvelopeRef: "AssistiveTrustEnvelope:476:wave2-shadow-only",
      freezeDispositionRef: "AssistiveFreezeDisposition:476:wave2-shadow-only",
      owner: "clinical-safety-officer",
      state: "draft",
      sourceRefs,
      blockerRefs: [],
    },
    {
      assistiveScopeId: "was_476_remaining_assistive_shadow_only",
      recordType: "WaveAssistiveScope",
      tenantScope: "tenant-group:remaining-programme-tenants",
      mode: "shadow_only",
      visibleModePermitted: false,
      visibleStaffCohort: [],
      allStaffPermitted: false,
      patientFacingPermitted: false,
      trustEnvelopeRef: "AssistiveTrustEnvelope:476:remaining-shadow-only",
      freezeDispositionRef: "AssistiveFreezeDisposition:476:remaining-shadow-only",
      owner: "clinical-safety-officer",
      state: "draft",
      sourceRefs,
      blockerRefs: ["blocker:476:tenant-regrouping-requires-new-selector-digest"],
    },
    {
      assistiveScopeId: "was_476_nhs_app_assistive_not_applicable",
      recordType: "WaveAssistiveScope",
      tenantScope: releaseRefs.tenantScope,
      mode: "not_applicable",
      visibleModePermitted: false,
      visibleStaffCohort: [],
      allStaffPermitted: false,
      patientFacingPermitted: false,
      trustEnvelopeRef: "AssistiveTrustEnvelope:476:nhs-app-not-applicable",
      freezeDispositionRef: "AssistiveFreezeDisposition:476:nhs-app-not-applicable",
      owner: "clinical-safety-officer",
      state: "draft",
      sourceRefs,
      blockerRefs: ["blocker:476:phase7-nhs-app-channel-activation-deferred"],
    },
    {
      assistiveScopeId: "was_476_assistive_visible_narrow_staff",
      recordType: "WaveAssistiveScope",
      tenantScope: releaseRefs.tenantScope,
      mode: "visible_summary",
      visibleModePermitted: true,
      visibleStaffCohort: ["clinical_safety_officer", "clinician_superuser"],
      allStaffPermitted: false,
      patientFacingPermitted: false,
      trustEnvelopeRef: "AssistiveTrustEnvelope:476:visible-narrow-staff",
      freezeDispositionRef: "AssistiveFreezeDisposition:476:visible-narrow-staff",
      owner: "clinical-safety-officer",
      state: "draft",
      sourceRefs,
      blockerRefs: ["blocker:476:assistive-all-staff-visible-mode-not-approved"],
    },
  ].map((record) => withHash(record));
}

interface ReleaseRefs {
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly releaseWatchTupleHash: string;
  readonly approvalTupleHash: string;
  readonly baselineTupleHash: string;
  readonly candidateTupleHash: string;
  readonly migrationTupleHash: string;
  readonly operatingModelHash: string;
  readonly runbookBundleVersionRef: string;
  readonly tenantScope: string;
  readonly channelScope: string;
}

function buildReleaseRefs() {
  const releaseCandidate = readJson<any>(
    "data/release/release_candidate_tuple.json",
  ).releaseCandidateTuple;
  const bau = readJson<any>("data/bau/475_operating_model.json");
  const cutover = readJson<any>("data/migration/474_cutover_runbook.json").programmeCutoverPlan;
  return {
    releaseRef:
      bau.releaseRef ??
      cutover.releaseRef ??
      "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
    releaseCandidateRef: bau.releaseCandidateRef ?? releaseCandidate.releaseRef,
    releaseApprovalFreezeRef: releaseCandidate.releaseApprovalFreezeRef,
    runtimePublicationBundleRef:
      bau.runtimePublicationBundleRef ?? releaseCandidate.runtimePublicationBundleRef,
    releasePublicationParityRef:
      bau.releasePublicationParityRef ?? releaseCandidate.releasePublicationParityRef,
    releaseWatchTupleRef: releaseCandidate.activeReleaseWatchTupleRefs?.[0] ?? "RWT_LOCAL_V1",
    releaseWatchTupleHash: releaseCandidate.watchTupleHash,
    approvalTupleHash: releaseCandidate.approvalTupleHash,
    baselineTupleHash: releaseCandidate.baselineTupleHash,
    candidateTupleHash: releaseCandidate.candidateTupleHash,
    migrationTupleHash: bau.migrationTupleHash ?? cutover.migrationTupleHash,
    operatingModelHash: bau.operatingModelHash,
    runbookBundleVersionRef: bau.runbookBundleVersionRef,
    tenantScope: bau.tenantScope,
    channelScope: bau.channelScope,
  } satisfies ReleaseRefs;
}

function buildGuardrailSnapshots(releaseRefs: ReleaseRefs, scenario: ReleaseWave476Scenario) {
  const baselineRules = [
    {
      ruleId: "guardrail:476:latency-p95",
      ruleKind: "latency_budget",
      interval: "PT5M",
      comparator: "<=",
      threshold: 900,
      unit: "ms",
      metricRef: "metric:ops:request-latency-p95",
    },
    {
      ruleId: "guardrail:476:error-rate",
      ruleKind: "error_budget",
      interval: "PT5M",
      comparator: "<=",
      threshold: 0.5,
      unit: "percent",
      metricRef: "metric:ops:http-5xx-rate",
    },
    {
      ruleId: "guardrail:476:incident-ceiling",
      ruleKind: "incident_ceiling",
      interval: "PT24H",
      comparator: "<=",
      threshold: 0,
      unit: "sev1_or_sev2",
      metricRef: "metric:ops:major-incident-count",
    },
    {
      ruleId: "guardrail:476:support-load",
      ruleKind: "support_load",
      interval: "PT24H",
      comparator: "<=",
      threshold: 3,
      unit: "launch-related-tickets",
      metricRef: "metric:support:launch-ticket-count",
    },
    {
      ruleId: "guardrail:476:projection-lag",
      ruleKind: "projection_lag",
      interval: "PT15M",
      comparator: "<=",
      threshold: 120,
      unit: "seconds",
      metricRef: "metric:projection:max-lag-seconds",
    },
    {
      ruleId: "guardrail:476:safety-signal",
      ruleKind: "clinical_safety",
      interval: "PT24H",
      comparator: "==",
      threshold: 0,
      unit: "untriaged-safety-signals",
      metricRef: "metric:safety:untriaged-release-signal-count",
    },
  ];

  const snapshots = waveDefinitions.map((definition) => {
    const verdict = verdictFor(definition, scenario);
    const isWave1 = definition.sequence === 1;
    const guardrailState =
      verdict === "superseded"
        ? "superseded"
        : verdict === "blocked"
          ? "blocked"
          : isWave1
            ? "green"
            : "amber";
    return withHash({
      recordType: "WaveGuardrailSnapshot",
      snapshotId: definition.guardrailSnapshotId,
      waveId: definition.waveId,
      state: guardrailState,
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      releaseApprovalFreezeRef: releaseRefs.releaseApprovalFreezeRef,
      runtimePublicationBundleRef:
        scenario === "superseded"
          ? "rpb::local::superseded-by-476-test-fixture"
          : releaseRefs.runtimePublicationBundleRef,
      releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
      releaseWatchTupleRef: releaseRefs.releaseWatchTupleRef,
      releaseWatchTupleHash: releaseRefs.releaseWatchTupleHash,
      approvalTupleHash: releaseRefs.approvalTupleHash,
      baselineTupleHash: releaseRefs.baselineTupleHash,
      tenantScope:
        definition.sequence === 3
          ? "tenant-group:remaining-programme-tenants"
          : releaseRefs.tenantScope,
      tenantCount: definition.sequence === 3 ? 6 : definition.sequence === 4 ? 0 : 1,
      channelFreezeRefs:
        definition.sequence === 4
          ? ["ChannelReleaseFreezeRecord:473:nhs-app-deferred"]
          : ["ChannelReleaseFreezeRecord:476:core-web-only"],
      recoveryDispositionRefs: [
        `ReleaseRecoveryDisposition:476:${definition.waveId}`,
        definition.rollbackBindingId,
      ],
      guardrailRules:
        definition.sequence === 4
          ? [
              ...baselineRules,
              {
                ruleId: "guardrail:476:nhs-app-channel-activation",
                ruleKind: "channel_constraint",
                interval: "P1D",
                comparator: "==",
                threshold: 0,
                unit: "exposed-users",
                metricRef: "metric:nhs-app:limited-release-users",
              },
            ]
          : baselineRules,
      staleEvidencePolicy:
        "missing, partial, stale, contradictory, or tenant-crossing evidence blocks widening",
      blockerRefs:
        verdict === "superseded"
          ? ["blocker:476:runtime-publication-bundle-superseded"]
          : definition.blockerRefs,
      evidenceRefs: [
        "data/release/release_candidate_tuple.json",
        "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
        "data/migration/474_projection_readiness_verdicts.json",
        "data/bau/475_operating_model.json",
      ],
      sourceRefs,
      generatedAt: FIXED_NOW,
      owner: definition.owner,
      wormAuditRef: `worm-ledger:476:guardrail:${definition.waveId}`,
    });
  });

  snapshots.push(
    withHash({
      recordType: "WaveGuardrailSnapshot",
      snapshotId: "wgs_476_superseded_runtime_bundle_edge_case",
      waveId: "edge_case_476_superseded_runtime_bundle",
      state: "blocked",
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      releaseApprovalFreezeRef: releaseRefs.releaseApprovalFreezeRef,
      runtimePublicationBundleRef: "rpb::local::superseded-by-476-edge-case",
      releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
      releaseWatchTupleRef: releaseRefs.releaseWatchTupleRef,
      releaseWatchTupleHash: releaseRefs.releaseWatchTupleHash,
      approvalTupleHash: releaseRefs.approvalTupleHash,
      baselineTupleHash: releaseRefs.baselineTupleHash,
      tenantScope: releaseRefs.tenantScope,
      tenantCount: 1,
      channelFreezeRefs: ["ChannelReleaseFreezeRecord:476:runtime-superseded"],
      recoveryDispositionRefs: ["ReleaseRecoveryDisposition:476:superseded-runtime"],
      guardrailRules: baselineRules,
      staleEvidencePolicy: "superseded runtime bundles block approval and widening",
      blockerRefs: ["blocker:476:runtime-publication-bundle-superseded"],
      evidenceRefs: ["data/release/release_candidate_tuple.json"],
      sourceRefs: [
        "prompt/476.md#Required-edge-cases",
        "blueprint/platform-runtime-and-release-blueprint.md",
      ],
      generatedAt: FIXED_NOW,
      owner: "release-engineering",
      wormAuditRef: "worm-ledger:476:guardrail:superseded-runtime-edge-case",
    }),
  );

  return {
    schemaVersion: "476.programme.wave-guardrail-snapshots.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    sourceRefs,
    snapshots,
    snapshotSetHash: hashValue(snapshots),
  };
}

function buildObservationPolicies(releaseRefs: ReleaseRefs) {
  const policies = waveDefinitions.map((definition) => {
    const minimumObservationHours =
      definition.sequence === 1
        ? 24
        : definition.sequence === 2
          ? 48
          : definition.sequence === 5
            ? 168
            : 72;
    return withHash({
      recordType: "WaveObservationPolicy",
      policyId: definition.observationPolicyId,
      waveId: definition.waveId,
      state: definition.sequence === 1 ? "approved" : "draft",
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
      minimumObservationHours,
      dwellWindow: `PT${minimumObservationHours}H`,
      requiredProbeRefs: [
        "probe:476:latency-p95",
        "probe:476:error-rate",
        "probe:476:incident-ceiling",
        "probe:476:support-load",
        "probe:476:projection-lag",
        "probe:476:clinical-safety-signal",
      ],
      exitCriteria: [
        {
          criterionId: `wec_476_${definition.sequence}_no_major_incidents`,
          recordType: "WaveExitCriterion",
          metricRef: "metric:ops:major-incident-count",
          comparator: "==",
          threshold: 0,
          observationWindow: `PT${minimumObservationHours}H`,
          blockerOnFailRef: "blocker:476:major-incident-during-observation",
        },
        {
          criterionId: `wec_476_${definition.sequence}_support_load`,
          recordType: "WaveExitCriterion",
          metricRef: "metric:support:launch-ticket-count",
          comparator: "<=",
          threshold: definition.sequence === 1 ? 3 : 8,
          observationWindow: `PT${minimumObservationHours}H`,
          blockerOnFailRef: "blocker:476:support-load-above-threshold",
        },
      ],
      pauseCriteria: [
        {
          criterionId: `wpc_476_${definition.sequence}_safety_signal`,
          recordType: "WavePauseCriterion",
          metricRef: "metric:safety:untriaged-release-signal-count",
          comparator: ">",
          threshold: 0,
          observationWindow: "PT5M",
          pauseActionRef: `WaveActionRecord:476:${definition.waveId}:pause`,
        },
        {
          criterionId: `wpc_476_${definition.sequence}_projection_lag`,
          recordType: "WavePauseCriterion",
          metricRef: "metric:projection:max-lag-seconds",
          comparator: ">",
          threshold: 120,
          observationWindow: "PT15M",
          pauseActionRef: `WaveActionRecord:476:${definition.waveId}:pause`,
        },
      ],
      continuityControlRefs: ["SCF_050_OPERATIONS_CONSOLE_V1", "SCF_050_PATIENT_PUBLIC_ENTRY_V1"],
      channelSpecificConstraints:
        definition.sequence === 4
          ? ["monthly-data-pack-required", "nhs-app-route-change-notice-required"]
          : ["core-web-observation-only"],
      sourceRefs,
      evidenceRefs: [
        "data/release/release_candidate_tuple.json",
        "data/bau/475_operating_model.json",
      ],
      owner: definition.owner,
      wormAuditRef: `worm-ledger:476:observation-policy:${definition.waveId}`,
    });
  });

  policies.push(
    withHash({
      recordType: "WaveObservationPolicy",
      policyId: "wop_476_too_short_observation_edge_case",
      waveId: "edge_case_476_observation_window_too_short",
      state: "blocked",
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
      minimumObservationHours: 24,
      dwellWindow: "PT4H",
      requiredProbeRefs: ["probe:476:incident-ceiling", "probe:476:support-load"],
      exitCriteria: [],
      pauseCriteria: [],
      continuityControlRefs: [],
      channelSpecificConstraints: ["incident-support-window-too-short"],
      blockerRefs: ["blocker:476:observation-window-too-short-for-incident-support-metrics"],
      sourceRefs: ["prompt/476.md#Required-edge-cases"],
      evidenceRefs: [],
      owner: "release-governance",
      wormAuditRef: "worm-ledger:476:observation-policy:too-short-edge-case",
    }),
  );

  return {
    schemaVersion: "476.programme.wave-observation-policies.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    sourceRefs,
    policies,
    policySetHash: hashValue(policies),
  };
}

function buildRollbackBindings(releaseRefs: ReleaseRefs) {
  return waveDefinitions.map((definition) => {
    const referenceDataGap = definition.sequence === 2;
    return withHash({
      recordType: "WaveRollbackBinding",
      rollbackBindingId: definition.rollbackBindingId,
      waveId: definition.waveId,
      state: referenceDataGap ? "blocked" : "approved",
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
      featureSurfaceRollbackRef: `rollback:476:${definition.waveId}:feature-surface`,
      referenceDataRollbackRef: referenceDataGap
        ? null
        : `rollback:476:${definition.waveId}:reference-data-last-known-good`,
      recoveryDispositionRef: `ReleaseRecoveryDisposition:476:${definition.waveId}`,
      rollbackCommandRequires: {
        roleAuthorizationRef: "role-auth:release-governance:rollback-operator",
        idempotencyKeyScope: "tenant+wave+rollback",
        purposeBindingRef: `purpose:476:${definition.waveId}:rollback`,
        injectedClockRef: "clock:476:fixed-2026-04-28T00:00:00Z",
        wormAuditOutputRef: `worm-ledger:476:rollback:${definition.waveId}`,
      },
      blockerRefs: referenceDataGap ? ["blocker:476:reference-data-rollback-gap"] : [],
      sourceRefs,
      evidenceRefs: [
        "data/migration/474_stop_resume_and_rollback_matrix.json",
        "data/bau/475_runbook_bundle_manifest.json",
      ],
      owner: "release-governance",
    });
  });
}

function buildManualFallbackBindings(releaseRefs: ReleaseRefs) {
  return waveDefinitions.map((definition) =>
    withHash({
      recordType: "WaveManualFallbackBinding",
      manualFallbackBindingId: definition.manualFallbackBindingId,
      waveId: definition.waveId,
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      fallbackModes:
        definition.sequence === 4
          ? ["nhs_app_channel_freeze", "core_web_direct_access"]
          : definition.sequence === 5
            ? ["assistive_disabled", "human_review_only"]
            : ["core_web_last_known_good", "support_lineage_handoff", "manual_triage_queue"],
      owner: definition.sequence === 5 ? "clinical-safety-officer" : "support-lead",
      evidenceRefs: [
        "data/bau/475_runbook_bundle_manifest.json",
        "data/bau/475_support_escalation_paths.json",
      ],
      sourceRefs,
      blockerRefs: [],
      wormAuditRef: `worm-ledger:476:manual-fallback:${definition.waveId}`,
      state: definition.sequence === 1 ? "approved" : "draft",
    }),
  );
}

function buildCommunicationPlans(releaseRefs: ReleaseRefs) {
  return waveDefinitions.map((definition) =>
    withHash({
      recordType: "WaveCommunicationPlan",
      communicationPlanId: definition.communicationPlanId,
      waveId: definition.waveId,
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      audiences:
        definition.sequence === 4
          ? ["release-governance", "nhs-app-integration-manager", "support-lead"]
          : definition.sequence === 5
            ? ["clinical-safety-officer", "clinician-superusers", "support-lead"]
            : ["release-governance", "tenant-service-owner", "support-lead", "clinical-ops"],
      noticeCadence:
        definition.sequence === 1
          ? "pre-wave huddle, 4h watch update, 24h exit review"
          : definition.sequence === 4
            ? "supplier coordination, monthly data pack, route-change notice"
            : "pre-approval review, daily watch update, exit review",
      escalationPathRefs: ["ep_475_support_ops_out_of_hours", "ep_475_release_rollback"],
      requiredArtifacts: [
        "data/release/476_release_wave_manifest.json",
        "data/release/476_wave_guardrail_snapshots.json",
        "data/release/476_wave_observation_policies.json",
      ],
      sourceRefs,
      owner: "release-governance",
      blockerRefs:
        definition.sequence === 4 ? ["blocker:476:nhs-app-channel-activation-deferred"] : [],
      wormAuditRef: `worm-ledger:476:communications:${definition.waveId}`,
      state: definition.sequence === 1 ? "approved" : "draft",
    }),
  );
}

function buildEligibilityVerdicts(releaseRefs: ReleaseRefs, scenario: ReleaseWave476Scenario) {
  const verdicts = waveDefinitions.map((definition) => {
    const verdict = verdictFor(definition, scenario);
    return withHash({
      recordType: "WaveEligibilityVerdict",
      verdictId: definition.eligibilityVerdictId,
      waveId: definition.waveId,
      verdict,
      state: verdict,
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      runtimePublicationBundleRef:
        verdict === "superseded"
          ? "rpb::local::superseded-by-476-test-fixture"
          : releaseRefs.runtimePublicationBundleRef,
      releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
      releaseWatchTupleHash: releaseRefs.releaseWatchTupleHash,
      tenantCohortRef: definition.tenantCohortId,
      channelScopeRef: definition.channelScopeId,
      assistiveScopeRef: definition.assistiveScopeId,
      guardrailSnapshotRef: definition.guardrailSnapshotId,
      observationPolicyRef: definition.observationPolicyId,
      rollbackBindingRef: definition.rollbackBindingId,
      manualFallbackBindingRef: definition.manualFallbackBindingId,
      activationPermitted: false,
      approvalPermitted:
        definition.sequence === 1 && (scenario === "approved" || scenario === "draft"),
      wideningPermitted: false,
      blockerRefs:
        verdict === "superseded"
          ? ["blocker:476:runtime-publication-bundle-superseded"]
          : definition.blockerRefs,
      constraintRefs: definition.constraintRefs,
      sourceRefs,
      evidenceRefs: [
        "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
        "data/migration/474_cutover_runbook.json",
        "data/bau/475_operating_model.json",
      ],
      owner: definition.owner,
      wormAuditRef: `worm-ledger:476:eligibility:${definition.waveId}`,
    });
  });

  const edgeCaseVerdicts = [
    {
      verdictId: "wev_476_edge_core_web_not_nhs_app",
      edgeCase: "tenant eligible for core web but not NHS App channel",
      verdict: "eligible_with_constraints",
      blockerRefs: ["blocker:476:phase7-nhs-app-channel-activation-deferred"],
      allowedScopes: ["core_web", "staff_workspace"],
      deniedScopes: ["nhs_app"],
    },
    {
      verdictId: "wev_476_edge_patient_routes_not_pharmacy",
      edgeCase: "tenant eligible for patient routes but not pharmacy dispatch",
      verdict: "eligible_with_constraints",
      blockerRefs: ["blocker:476:pharmacy-console-projection-stale"],
      allowedScopes: ["patient_request_start", "patient_status"],
      deniedScopes: ["pharmacy_dispatch"],
    },
    {
      verdictId: "wev_476_edge_assistive_narrow_not_all_staff",
      edgeCase: "assistive visible mode approved for narrow staff cohort but not all staff",
      verdict: "observe_only",
      blockerRefs: ["blocker:476:assistive-all-staff-visible-mode-not-approved"],
      allowedScopes: ["clinical_safety_officer", "clinician_superuser"],
      deniedScopes: ["all_staff", "patient_facing"],
    },
    {
      verdictId: "wev_476_edge_superseded_runtime_bundle",
      edgeCase: "wave guardrail references superseded runtime publication bundle",
      verdict: "superseded",
      blockerRefs: ["blocker:476:runtime-publication-bundle-superseded"],
      allowedScopes: [],
      deniedScopes: ["all_widening", "activation", "approval"],
    },
    {
      verdictId: "wev_476_edge_reference_data_rollback_gap",
      edgeCase: "rollback path exists for feature surface but not reference data",
      verdict: "blocked",
      blockerRefs: ["blocker:476:reference-data-rollback-gap"],
      allowedScopes: ["feature_surface_rollback"],
      deniedScopes: ["reference_data_widening", "pharmacy_dispatch"],
    },
    {
      verdictId: "wev_476_edge_observation_too_short",
      edgeCase: "observation window too short for required incident/support metrics",
      verdict: "blocked",
      blockerRefs: ["blocker:476:observation-window-too-short-for-incident-support-metrics"],
      allowedScopes: [],
      deniedScopes: ["wave_exit", "widening"],
    },
    {
      verdictId: "wev_476_edge_cohort_selector_widened",
      edgeCase: "cohort selector accidentally widens after tenant regrouping",
      verdict: "blocked",
      blockerRefs: ["blocker:476:tenant-regrouping-requires-new-selector-digest"],
      allowedScopes: ["old_selector_scope"],
      deniedScopes: ["regrouped_scope_without_digest"],
    },
  ].map((record) =>
    withHash({
      recordType: "WaveEligibilityVerdict",
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
      releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
      sourceRefs: ["prompt/476.md#Required-edge-cases"],
      evidenceRefs: [],
      owner: "release-governance",
      wormAuditRef: `worm-ledger:476:eligibility:${record.verdictId}`,
      ...record,
    }),
  );

  const allVerdicts = [...verdicts, ...edgeCaseVerdicts];
  return {
    schemaVersion: "476.programme.wave-eligibility-verdicts.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    sourceRefs,
    verdicts,
    edgeCaseVerdicts,
    verdictSetHash: hashValue(allVerdicts),
  };
}

function buildBlastRadiusMatrix(releaseRefs: ReleaseRefs) {
  const rows = waveDefinitions.flatMap((definition) =>
    (Object.keys(definition.exposure) as BlastRadiusAudience[]).map((audience) =>
      withHash({
        recordType: "WaveBlastRadiusCell",
        blastRadiusId: definition.blastRadiusId,
        waveId: definition.waveId,
        audience,
        exposureCount: definition.exposure[audience],
        exposureUnit: audience === "nhs_app" ? "limited-release-users" : "synthetic-users",
        percentageOfProgramme:
          audience === "nhs_app"
            ? 0
            : Number(((definition.exposure[audience] / 500) * 100).toFixed(2)),
        channelScopeRef: definition.channelScopeId,
        assistiveScopeRef: definition.assistiveScopeId,
        tenantCohortRef: definition.tenantCohortId,
        permittedByScope:
          definition.sequence === 1
            ? definition.exposure[audience] === 0 ||
              (audience !== "nhs_app" && audience !== "assistive" && audience !== "pharmacy")
            : definition.sequence !== 4 || definition.exposure[audience] === 0,
        noHiddenWideningProofRef: `proof:476:no-hidden-widening:${definition.waveId}:${audience}`,
      }),
    ),
  );

  const waveScores = waveDefinitions.map((definition) => ({
    waveId: definition.waveId,
    totalExposureScore: Object.values(definition.exposure).reduce((sum, value) => sum + value, 0),
    routeFamilyCount: definition.routeFamilies.length,
    channelScopeRef: definition.channelScopeId,
    assistiveScopeRef: definition.assistiveScopeId,
  }));

  return {
    schemaVersion: "476.programme.blast-radius-matrix.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    releaseCandidateRef: releaseRefs.releaseCandidateRef,
    runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
    sourceRefs,
    rows,
    waveScores,
    smallestApprovedWaveProof: {
      waveId: "wave_476_1_core_web_canary",
      proofState: "exact",
      reason:
        "Wave 1 has the lowest non-zero exposure, excludes NHS App, excludes pharmacy dispatch, and excludes assistive visible mode.",
      comparedWaveIds: waveDefinitions.slice(1).map((definition) => definition.waveId),
      noInformalFeatureFlagsPermitted: true,
    },
    edgeCaseProofs: [
      withHash({
        edgeCaseId: "edge_476_cohort_selector_regrouping",
        proofState: "blocked",
        originalSelectorDigest: hashValue({ tenant: releaseRefs.tenantScope, wave: 1 }),
        regroupedSelectorDigest: hashValue({ tenantGroup: "regrouped-tenant-demo-gp", wave: 1 }),
        blockerRefs: ["blocker:476:tenant-regrouping-requires-new-selector-digest"],
        deniedWidening: ["patients", "staff", "nhs_app", "assistive"],
      }),
      withHash({
        edgeCaseId: "edge_476_no_nhs_app_hidden_flag",
        proofState: "exact",
        waveId: "wave_476_1_core_web_canary",
        channelExposure: { core_web: true, nhs_app: false },
        deniedWidening: ["nhs_app"],
      }),
      withHash({
        edgeCaseId: "edge_476_no_assistive_hidden_flag",
        proofState: "exact",
        waveId: "wave_476_1_core_web_canary",
        assistiveExposure: { shadow_only: true, visible_summary: false },
        deniedWidening: ["assistive_visible_mode", "patient_facing_assistive"],
      }),
    ],
    matrixHash: hashValue(rows),
  };
}

function buildDeploymentWaves(releaseRefs: ReleaseRefs, scenario: ReleaseWave476Scenario) {
  return waveDefinitions.map((definition) => {
    const verdict = verdictFor(definition, scenario);
    const state = waveStateFor(definition, scenario);
    return withHash({
      recordType: "DeploymentWave",
      waveId: definition.waveId,
      label: definition.label,
      ladderLabel: definition.ladderLabel,
      sequence: definition.sequence,
      state,
      verdict,
      releaseRef: releaseRefs.releaseRef,
      releaseCandidateRef: releaseRefs.releaseCandidateRef,
      releaseApprovalFreezeRef: releaseRefs.releaseApprovalFreezeRef,
      runtimePublicationBundleRef:
        verdict === "superseded"
          ? "rpb::local::superseded-by-476-test-fixture"
          : releaseRefs.runtimePublicationBundleRef,
      releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
      releaseWatchTupleRef: releaseRefs.releaseWatchTupleRef,
      releaseWatchTupleHash: releaseRefs.releaseWatchTupleHash,
      tenantCohortRef: definition.tenantCohortId,
      channelScopeRef: definition.channelScopeId,
      assistiveScopeRef: definition.assistiveScopeId,
      guardrailSnapshotRef: definition.guardrailSnapshotId,
      observationPolicyRef: definition.observationPolicyId,
      rollbackBindingRef: definition.rollbackBindingId,
      manualFallbackBindingRef: definition.manualFallbackBindingId,
      communicationPlanRef: definition.communicationPlanId,
      eligibilityVerdictRef: definition.eligibilityVerdictId,
      blastRadiusRef: definition.blastRadiusId,
      routeFamilies: definition.routeFamilies,
      blastRadiusExposure: definition.exposure,
      owner: definition.owner,
      blockerRefs:
        verdict === "superseded"
          ? ["blocker:476:runtime-publication-bundle-superseded"]
          : definition.blockerRefs,
      constraintRefs: definition.constraintRefs,
      evidenceRefs: [
        "data/release/476_tenant_cohort_rollout_plan.json",
        "data/release/476_wave_guardrail_snapshots.json",
        "data/release/476_wave_observation_policies.json",
        "data/release/476_wave_eligibility_verdicts.json",
        "data/release/476_blast_radius_matrix.json",
      ],
      sourceRefs,
      commandTransitionPolicy: {
        allowedStateTransitions: [
          "draft->approved",
          "approved->active",
          "active->paused",
          "paused->active",
          "active->rolled_back",
          "active->completed",
          "draft|approved|paused->superseded",
        ],
        mutationRequires: {
          roleAuthorizationRef: "role-auth:release-governance:wave-controller",
          idempotencyKeyScope: "tenant+cohort+channel+wave",
          purposeBindingRef: `purpose:476:${definition.waveId}:state-transition`,
          injectedClockRef: "clock:476:fixed-2026-04-28T00:00:00Z",
          wormAuditOutputRef: `worm-ledger:476:wave-action:${definition.waveId}`,
        },
        settlementRecordRequired: true,
        informalFeatureFlagsPermitted: false,
      },
      wormAuditRef: `worm-ledger:476:deployment-wave:${definition.waveId}`,
    });
  });
}

function buildTenantCohortRolloutPlan(releaseRefs: ReleaseRefs) {
  const waveTenantCohorts = buildWaveTenantCohorts(releaseRefs);
  const channelScopes = buildChannelScopes(releaseRefs);
  const assistiveScopes = buildAssistiveScopes(releaseRefs);
  const rollbackBindings = buildRollbackBindings(releaseRefs);
  const manualFallbackBindings = buildManualFallbackBindings(releaseRefs);
  const communicationPlans = buildCommunicationPlans(releaseRefs);
  const rolloutPlan = {
    schemaVersion: "476.programme.tenant-cohort-rollout-plan.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    releaseRef: releaseRefs.releaseRef,
    releaseCandidateRef: releaseRefs.releaseCandidateRef,
    runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
    releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
    tenantScope: releaseRefs.tenantScope,
    channelScope: releaseRefs.channelScope,
    sourceRefs,
    waveTenantCohorts,
    channelScopes,
    assistiveScopes,
    rollbackBindings,
    manualFallbackBindings,
    communicationPlans,
    edgeCaseCoverage: [
      "tenant eligible for core web but not NHS App channel",
      "tenant eligible for patient routes but not pharmacy dispatch",
      "assistive visible mode approved for narrow staff cohort but not all staff",
      "rollback path exists for feature surface but not reference data",
      "cohort selector accidentally widens after tenant regrouping",
    ],
  };
  return { ...rolloutPlan, rolloutPlanHash: hashValue(rolloutPlan) };
}

function buildManifest(
  releaseRefs: ReleaseRefs,
  scenario: ReleaseWave476Scenario,
  deploymentWaves: readonly JsonObject[],
  rolloutPlanHash: string,
  guardrailHash: string,
  observationHash: string,
  verdictHash: string,
  matrixHash: string,
) {
  const prerequisiteStates = {
    phase7ChannelReadiness: readJson<any>(
      "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    ).phase7ChannelReadinessState,
    channelActivationPermitted: readJson<any>(
      "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    ).channelActivationPermitted,
    migrationReadiness: readJson<any>("data/migration/474_cutover_runbook.json")
      .programmeCutoverPlan.cutoverDecision,
    bauReadiness: readJson<any>("data/bau/475_operating_model.json").readinessState,
    releaseWaveReadinessFeed: readJson<any>("data/bau/475_operating_model.json")
      .releaseWaveReadinessFeed,
  };
  const manifestBody = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    manifestId: `prwm_476_${releaseRefs.releaseCandidateRef.toLowerCase()}`,
    recordType: "ProgrammeReleaseWaveManifest",
    state: scenarioState(scenario),
    scenarioState: scenario,
    overallReadinessVerdict:
      scenario === "superseded"
        ? "superseded"
        : scenario === "blocked"
          ? "blocked"
          : "eligible_with_constraints",
    activationPermitted: false,
    approvalPermitted: scenario === "draft" || scenario === "approved",
    wideningPermitted: false,
    nextSafeAction:
      scenario === "superseded"
        ? "rebuild guardrail snapshot from current runtime publication bundle before any approval"
        : scenario === "blocked"
          ? "resolve stale prerequisite evidence and regenerate manifest"
          : "approve manifest only; activation waits for signed signoffs, DR smoke, promotion settlement, and observation authority",
    releaseRef: releaseRefs.releaseRef,
    releaseCandidateRef: releaseRefs.releaseCandidateRef,
    releaseApprovalFreezeRef: releaseRefs.releaseApprovalFreezeRef,
    runtimePublicationBundleRef:
      scenario === "superseded"
        ? "rpb::local::superseded-by-476-test-fixture"
        : releaseRefs.runtimePublicationBundleRef,
    releasePublicationParityRef: releaseRefs.releasePublicationParityRef,
    releaseWatchTupleRef: releaseRefs.releaseWatchTupleRef,
    releaseWatchTupleHash: releaseRefs.releaseWatchTupleHash,
    approvalTupleHash: releaseRefs.approvalTupleHash,
    baselineTupleHash: releaseRefs.baselineTupleHash,
    candidateTupleHash: releaseRefs.candidateTupleHash,
    migrationTupleHash: releaseRefs.migrationTupleHash,
    operatingModelHash: releaseRefs.operatingModelHash,
    runbookBundleVersionRef: releaseRefs.runbookBundleVersionRef,
    tenantScope: releaseRefs.tenantScope,
    channelScope: releaseRefs.channelScope,
    prerequisiteStates,
    sourceRefs,
    evidenceRefs: requiredInputPaths,
    artifactRefs: {
      tenantCohortRolloutPlanRef: "data/release/476_tenant_cohort_rollout_plan.json",
      waveGuardrailSnapshotsRef: "data/release/476_wave_guardrail_snapshots.json",
      waveObservationPoliciesRef: "data/release/476_wave_observation_policies.json",
      waveEligibilityVerdictsRef: "data/release/476_wave_eligibility_verdicts.json",
      blastRadiusMatrixRef: "data/release/476_blast_radius_matrix.json",
    },
    artifactHashes: {
      rolloutPlanHash,
      guardrailHash,
      observationHash,
      verdictHash,
      matrixHash,
    },
    blockerRefs: activationBlockersForScenario(scenario),
    constraintRefs: [
      "constraint:476:nhs-app-channel-deferred",
      "constraint:476:release-wave-promotion-owned-by-seq-482",
      "constraint:476:wave-observation-owned-by-seq-483",
      "constraint:476:no-informal-feature-flag-widening",
    ],
    deploymentWaves,
    commandAuthority: {
      recordType: "WaveActionRecord",
      commandHandlerRef: "WaveActionRecord:476:command-handler",
      settlementRecordSchemaRef:
        "data/contracts/476_release_wave_manifest.schema.json#WaveActionSettlement",
      mutationRequires: {
        roleAuthorizationRef: "role-auth:release-governance:wave-controller",
        tenantCohortChannelScopeRequired: true,
        idempotencyKeyScope: "tenant+cohort+channel+assistive+wave",
        purposeBindingRequired: true,
        injectedClockRequired: true,
        wormAuditOutputRequired: true,
      },
      activationSettlementRequiredRefs: [
        "data/signoffs/477_security_clinical_privacy_regulatory_signoffs.json",
        "data/rehearsal/481_dr_go_live_smoke_results.json",
        "data/release/482_wave1_promotion_settlement.json",
        "data/release/483_wave1_observation_settlement.json",
      ],
    },
    wormAuditRef: "worm-ledger:476:programme-release-wave-manifest",
  };
  return { ...manifestBody, waveManifestHash: hashValue(manifestBody) };
}

function buildSchema() {
  return {
    $id: "https://vecells.local/contracts/476_release_wave_manifest.schema.json",
    title: "Task 476 release wave manifest contract",
    type: "object",
    required: [
      "schemaVersion",
      "taskId",
      "manifestId",
      "recordType",
      "state",
      "overallReadinessVerdict",
      "deploymentWaves",
      "waveManifestHash",
    ],
    properties: {
      schemaVersion: { const: SCHEMA_VERSION },
      taskId: { const: TASK_ID },
      recordType: { const: "ProgrammeReleaseWaveManifest" },
      state: {
        enum: ["draft", "approved", "active", "paused", "rolled_back", "completed", "superseded"],
      },
      overallReadinessVerdict: {
        enum: ["eligible", "eligible_with_constraints", "observe_only", "blocked", "superseded"],
      },
      activationPermitted: { const: false },
      wideningPermitted: { const: false },
      deploymentWaves: {
        type: "array",
        minItems: 5,
        items: { $ref: "#/$defs/DeploymentWave" },
      },
    },
    $defs: {
      DeploymentWave: {
        type: "object",
        required: [
          "recordType",
          "waveId",
          "state",
          "verdict",
          "tenantCohortRef",
          "channelScopeRef",
          "assistiveScopeRef",
          "guardrailSnapshotRef",
          "observationPolicyRef",
          "rollbackBindingRef",
          "manualFallbackBindingRef",
          "blastRadiusRef",
          "commandTransitionPolicy",
          "recordHash",
        ],
        properties: {
          recordType: { const: "DeploymentWave" },
          state: {
            enum: [
              "draft",
              "approved",
              "active",
              "paused",
              "rolled_back",
              "completed",
              "superseded",
            ],
          },
          verdict: {
            enum: [
              "eligible",
              "eligible_with_constraints",
              "observe_only",
              "blocked",
              "superseded",
            ],
          },
          commandTransitionPolicy: {
            type: "object",
            required: ["settlementRecordRequired", "informalFeatureFlagsPermitted"],
            properties: {
              settlementRecordRequired: { const: true },
              informalFeatureFlagsPermitted: { const: false },
            },
          },
        },
      },
      WaveActionSettlement: {
        type: "object",
        required: [
          "settlementId",
          "waveId",
          "fromState",
          "toState",
          "roleAuthorizationRef",
          "idempotencyKey",
          "purposeBindingRef",
          "injectedClock",
          "wormAuditOutputRef",
          "settlementHash",
        ],
      },
      WaveTenantCohort: {
        type: "object",
        required: ["cohortId", "cohortSelector", "selectorDigest"],
      },
      WaveChannelScope: {
        type: "object",
        required: ["scopeId", "allowedChannels", "explicitlyExcludedChannels"],
      },
      WaveAssistiveScope: {
        type: "object",
        required: ["assistiveScopeId", "mode", "visibleModePermitted", "allStaffPermitted"],
      },
    },
  };
}

function buildInterfaceGap(releaseRefs: ReleaseRefs) {
  const gap = {
    schemaVersion: "PROGRAMME_BATCH_473_489_INTERFACE_GAP.v1",
    taskId: TASK_ID,
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_476_WAVE_ACTION_SETTLEMENT_AUTHORITY",
    title: "Wave action settlements and production activation are future-owned",
    sourceRefs: ["prompt/476.md", "prompt/482.md", "prompt/483.md"],
    releaseCandidateRef: releaseRefs.releaseCandidateRef,
    runtimePublicationBundleRef: releaseRefs.runtimePublicationBundleRef,
    state: "fail_closed_bridge",
    bridgeContract:
      "Task 476 may publish typed release waves and approve a manifest plan, but active production exposure requires later authoritative settlement records.",
    activationPermitted: false,
    wideningPermitted: false,
    requiredFutureAuthorityRefs: [
      "seq_477_security_clinical_safety_privacy_and_regulatory_signoffs",
      "seq_481_final_disaster_recovery_and_go_live_smoke_suite",
      "seq_482_promote_signed_release_candidate_to_production_wave_1",
      "seq_483_monitor_release_watch_tuple_and_wave_observation_policy_for_wave_1",
    ],
    blockerRefs: releaseActionBlockers,
    generatedAt: FIXED_NOW,
  };
  return { ...gap, gapHash: hashValue(gap) };
}

function buildAlgorithmNotes(releaseRefs: ReleaseRefs) {
  return [
    "# Task 476 Algorithm Alignment Notes",
    "",
    "- Loaded the release candidate tuple, runtime publication bundle, publication parity record, Phase 7 reconciliation, task 474 migration/cutover evidence, and task 475 BAU/runbook evidence.",
    "- Wave 1 is the smallest safe blast radius: one synthetic tenant cohort, core web/staff/hub only, pharmacy dispatch excluded, NHS App exposure zero, and assistive visible mode zero.",
    "- Every wave binds a tenant selector, channel scope, assistive scope, guardrail snapshot, observation policy, rollback binding, manual fallback binding, communication plan, and eligibility verdict.",
    "- The manifest carries an approved-plan state but keeps activation and widening fail-closed until future signoff, disaster-recovery smoke, promotion settlement, and observation settlement records are current.",
    "- Guardrails include latency, error budget, incident ceiling, projection lag, support load, clinical safety signal, and channel-specific constraints.",
    "- Required edge cases are explicit records: core web without NHS App, patient routes without pharmacy dispatch, narrow assistive visible cohort, superseded runtime bundle, reference-data rollback gap, too-short observation, and selector widening after regrouping.",
    "- No route, channel, tenant, cohort, or assistive exposure is controlled by informal feature flags; every exposure is typed and hash-bound.",
    "",
    `Release candidate: ${releaseRefs.releaseCandidateRef}`,
    `Runtime publication bundle: ${releaseRefs.runtimePublicationBundleRef}`,
    `Release watch tuple hash: ${releaseRefs.releaseWatchTupleHash}`,
  ].join("\n");
}

function buildExternalReferenceNotes() {
  return {
    schemaVersion: "476.external-reference-notes.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    references: [
      {
        referenceId: "external:476:nhs-app-web-integration",
        title: "NHS App web integration",
        url: "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
        accessedOn: "2026-04-28",
        appliedTo:
          "NHS App channel wave remains blocked until limited-release plan, SCAL/connection agreement, monthly data, and route-change obligations are current.",
      },
      {
        referenceId: "external:476:nhs-service-manual-accessibility",
        title: "NHS digital service manual accessibility guidance",
        url: "https://service-manual.nhs.uk/accessibility",
        accessedOn: "2026-04-28",
        appliedTo:
          "Release Wave Planner uses semantic controls, role-first test locators, table fallbacks, keyboard focus restoration, and reduced-motion/high-contrast checks.",
      },
      {
        referenceId: "external:476:nhs-england-ai-ambient-scribing",
        title: "NHS England guidance on AI-enabled ambient scribing products",
        url: "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
        accessedOn: "2026-04-28",
        appliedTo:
          "Assistive visible mode is limited to a supervised staff cohort, keeps human review, monitoring, training, safety signal reporting, and support obligations explicit.",
      },
    ],
  };
}

function buildRunbook(manifestHash: string) {
  return [
    "# Task 476 Release Wave Runbook",
    "",
    `Manifest hash: \`${manifestHash}\``,
    "",
    "## Wave Approval",
    "",
    "1. Confirm task 473 Phase 7 reconciliation is current and that NHS App channel activation remains deferred unless a later authority record supersedes it.",
    "2. Confirm task 474 cutover and projection evidence is current. Pharmacy dispatch must remain out of Wave 1 while pharmacy projection is stale.",
    "3. Confirm task 475 BAU readiness, support escalation paths, training evidence, and rollback runbooks are current.",
    "4. Review Wave 1 cohort selector, guardrail snapshot, observation policy, rollback binding, and manual fallback binding.",
    "5. Approve the manifest plan only. Do not activate production exposure until signoff, DR smoke, promotion settlement, and observation settlement records are current.",
    "",
    "## Pause Or Rollback",
    "",
    "- Pause immediately on major incident, untriaged clinical safety signal, projection lag over threshold, support load above threshold, runtime tuple drift, or tenant/cohort digest mismatch.",
    "- Roll back feature surfaces through the wave rollback binding. If reference data rollback is absent, the wave is blocked from widening.",
    "- Disable assistive visible mode through the assistive freeze disposition and return to human review only.",
    "- Keep NHS App routes frozen until Phase 7 channel activation authority is current and supplier obligations are met.",
    "",
    "## Manual Fallback",
    "",
    "- Use the task 475 support escalation paths and runbook bundle for clinical operations, support triage, release rollback, and out-of-hours coverage.",
    "- Support staff must not use local dashboard labels, informal flags, or raw route parameters as evidence of release state.",
  ].join("\n");
}

function buildProgrammePlanDoc(manifest: any, rolloutPlan: any) {
  return [
    "# Task 476 Tenant Cohort Rollout Plan",
    "",
    `Release candidate: \`${manifest.releaseCandidateRef}\``,
    `Runtime bundle: \`${manifest.runtimePublicationBundleRef}\``,
    `Manifest hash: \`${manifest.waveManifestHash}\``,
    "",
    "## Wave Ladder",
    "",
    ...manifest.deploymentWaves.map(
      (wave: any) =>
        `- ${wave.ladderLabel}: ${wave.label}; state ${wave.state}; verdict ${wave.verdict}; cohort ${wave.tenantCohortRef}; blockers ${wave.blockerRefs.length}.`,
    ),
    "",
    "## Cohort Controls",
    "",
    ...rolloutPlan.waveTenantCohorts.map(
      (cohort: any) =>
        `- ${cohort.cohortId}: ${cohort.cohortSelector}; selector digest ${cohort.selectorDigest}.`,
    ),
    "",
    "## Channel And Assistive Controls",
    "",
    "- Wave 1 allows core web/staff/hub only and explicitly excludes NHS App, pharmacy dispatch, and assistive visible mode.",
    "- NHS App exposure remains zero until Phase 7 channel release authority, SCAL/connection agreement, limited-release plan, monthly data, and route-change notice obligations are current.",
    "- Assistive visible mode is limited to clinical safety officer and clinician superuser cohorts; all-staff and patient-facing assistive exposure are denied.",
  ].join("\n");
}

export interface ReleaseWave476Artifacts {
  readonly releaseWaveManifest: any;
  readonly tenantCohortRolloutPlan: any;
  readonly waveGuardrailSnapshots: any;
  readonly waveObservationPolicies: any;
  readonly waveEligibilityVerdicts: any;
  readonly blastRadiusMatrix: any;
  readonly contractSchema: any;
  readonly interfaceGap: any;
  readonly algorithmNotes: string;
  readonly externalReferenceNotes: any;
  readonly releaseRunbook: string;
  readonly programmePlanDoc: string;
}

export function build476ReleaseWaveArtifacts(
  scenarioInput: ReleaseWave476Scenario = "approved",
): ReleaseWave476Artifacts {
  for (const relativePath of requiredInputPaths) {
    if (!fs.existsSync(path.join(ROOT, relativePath))) {
      throw new Error(`Task 476 missing required input: ${relativePath}`);
    }
  }
  const scenario = normalize476ScenarioState(scenarioInput);
  const releaseRefs = buildReleaseRefs();
  const tenantCohortRolloutPlan = buildTenantCohortRolloutPlan(releaseRefs);
  const waveGuardrailSnapshots = buildGuardrailSnapshots(releaseRefs, scenario);
  const waveObservationPolicies = buildObservationPolicies(releaseRefs);
  const waveEligibilityVerdicts = buildEligibilityVerdicts(releaseRefs, scenario);
  const blastRadiusMatrix = buildBlastRadiusMatrix(releaseRefs);
  const deploymentWaves = buildDeploymentWaves(releaseRefs, scenario);
  const releaseWaveManifest = buildManifest(
    releaseRefs,
    scenario,
    deploymentWaves,
    tenantCohortRolloutPlan.rolloutPlanHash,
    waveGuardrailSnapshots.snapshotSetHash,
    waveObservationPolicies.policySetHash,
    waveEligibilityVerdicts.verdictSetHash,
    blastRadiusMatrix.matrixHash,
  );
  const contractSchema = buildSchema();
  const interfaceGap = buildInterfaceGap(releaseRefs);
  const algorithmNotes = buildAlgorithmNotes(releaseRefs);
  const externalReferenceNotes = buildExternalReferenceNotes();
  const releaseRunbook = buildRunbook(releaseWaveManifest.waveManifestHash);
  const programmePlanDoc = buildProgrammePlanDoc(releaseWaveManifest, tenantCohortRolloutPlan);

  return {
    releaseWaveManifest,
    tenantCohortRolloutPlan,
    waveGuardrailSnapshots,
    waveObservationPolicies,
    waveEligibilityVerdicts,
    blastRadiusMatrix,
    contractSchema,
    interfaceGap,
    algorithmNotes,
    externalReferenceNotes,
    releaseRunbook,
    programmePlanDoc,
  };
}

export function write476ReleaseWaveArtifacts(
  scenario: ReleaseWave476Scenario = "approved",
): ReleaseWave476Artifacts {
  const artifacts = build476ReleaseWaveArtifacts(scenario);
  writeJson("data/release/476_release_wave_manifest.json", artifacts.releaseWaveManifest);
  writeJson("data/release/476_tenant_cohort_rollout_plan.json", artifacts.tenantCohortRolloutPlan);
  writeJson("data/release/476_wave_guardrail_snapshots.json", artifacts.waveGuardrailSnapshots);
  writeJson("data/release/476_wave_observation_policies.json", artifacts.waveObservationPolicies);
  writeJson("data/release/476_wave_eligibility_verdicts.json", artifacts.waveEligibilityVerdicts);
  writeJson("data/release/476_blast_radius_matrix.json", artifacts.blastRadiusMatrix);
  writeJson("data/contracts/476_release_wave_manifest.schema.json", artifacts.contractSchema);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_476_WAVE_ACTION_SETTLEMENT_AUTHORITY.json",
    artifacts.interfaceGap,
  );
  writeText("data/analysis/476_algorithm_alignment_notes.md", artifacts.algorithmNotes);
  writeJson("data/analysis/476_external_reference_notes.json", artifacts.externalReferenceNotes);
  writeText("docs/runbooks/476_release_wave_runbook.md", artifacts.releaseRunbook);
  writeText("docs/programme/476_tenant_cohort_rollout_plan.md", artifacts.programmePlanDoc);
  return artifacts;
}

if (process.argv[1] === __filename) {
  const scenario = normalize476ScenarioState(process.argv[2] ?? "approved");
  const artifacts = write476ReleaseWaveArtifacts(scenario);
  console.log(
    `Task 476 release wave manifest written: ${artifacts.releaseWaveManifest.waveManifestHash}`,
  );
}
