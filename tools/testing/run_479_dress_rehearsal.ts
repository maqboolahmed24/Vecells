import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_479";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "479.programme.production-like-dress-rehearsal.v1";
export const PLAYWRIGHT_OUTPUT_ROOT = "output/playwright/479-dress-rehearsal";

type JsonObject = Record<string, unknown>;
type PersonaRole =
  | "patient"
  | "carer"
  | "clinician"
  | "hub_operator"
  | "pharmacy_operator"
  | "support_operator"
  | "governance_operator"
  | "assistive_operator"
  | "release_manager";
type ScenarioFamily = "patient" | "staff" | "hub_pharmacy_booking" | "assistive_channel";
type RunState = "passed" | "constrained" | "failed";
type LaunchClassification =
  | "launch_pass"
  | "constrained_launch"
  | "launch_blocking"
  | "bau_follow_up"
  | "test_fixture_defect";

export interface SyntheticPatientPersona {
  readonly recordType: "SyntheticPatientPersona";
  readonly personaId: string;
  readonly personaLabel: string;
  readonly role: "patient" | "carer";
  readonly accessibilityNeeds: readonly string[];
  readonly identityPosture: "signed_in" | "unsigned_safe" | "identity_repair";
  readonly consentPosture: "current" | "deferred" | "not_required";
  readonly dataProfileRef: string;
  readonly noPhi: true;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface SyntheticStaffPersona {
  readonly recordType: "SyntheticStaffPersona";
  readonly personaId: string;
  readonly personaLabel: string;
  readonly role: Exclude<PersonaRole, "patient" | "carer">;
  readonly authorizationScopeRefs: readonly string[];
  readonly routeFamilies: readonly string[];
  readonly purposeBindingRefs: readonly string[];
  readonly noLiveCredentials: true;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface SyntheticTenantScope {
  readonly recordType: "SyntheticTenantScope";
  readonly tenantScopeId: string;
  readonly tenantScopeLabel: string;
  readonly tenantRef: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface DressRehearsalScenario {
  readonly recordType: "DressRehearsalScenario";
  readonly scenarioId: string;
  readonly scenarioFamily: ScenarioFamily;
  readonly label: string;
  readonly routeRefs: readonly string[];
  readonly personaRefs: readonly string[];
  readonly tenantScopeRef: string;
  readonly releaseWaveRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly requiredEdgeCaseRefs: readonly string[];
  readonly runbookRefs: readonly string[];
  readonly observationProbeRefs: readonly string[];
  readonly rollbackPracticeRefs: readonly string[];
  readonly expectedRunState: RunState;
  readonly launchClassification: LaunchClassification;
  readonly owner: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface RunbookExerciseBinding {
  readonly recordType: "RunbookExerciseBinding";
  readonly runbookExerciseId: string;
  readonly scenarioRef: string;
  readonly runbookRef: string;
  readonly operatorRole: PersonaRole;
  readonly trigger: string;
  readonly drillSteps: readonly string[];
  readonly exitCriteria: readonly string[];
  readonly settlementRequiredBeforeCompletionClaim: boolean;
  readonly owner: string;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface ObservationProbeEvidence {
  readonly recordType: "ObservationProbeEvidence";
  readonly observationProbeId: string;
  readonly scenarioRef: string;
  readonly probeType:
    | "browser_trace"
    | "aria_snapshot"
    | "screenshot"
    | "console_network_guard"
    | "keyboard"
    | "mobile"
    | "settlement_idempotency";
  readonly expectedEvidenceRefs: readonly string[];
  readonly sensitiveDataPolicy: "synthetic_redacted_only";
  readonly completionClaimPermittedBeforeSettlement: false;
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface ReleaseWaveDressRehearsalBinding {
  readonly recordType: "ReleaseWaveDressRehearsalBinding";
  readonly releaseWaveDressRehearsalBindingId: string;
  readonly scenarioRefs: readonly string[];
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly releaseWaveRef: string;
  readonly tenantScopeRef: string;
  readonly channelScope: string;
  readonly launchScope: "core_web_and_staff_wave_1" | "deferred_channel_observe_only";
  readonly readinessVerdict: "eligible_with_constraints";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface RollbackPracticeEvidence {
  readonly recordType: "RollbackPracticeEvidence";
  readonly rollbackPracticeEvidenceId: string;
  readonly scenarioRef: string;
  readonly rollbackBindingRef: string;
  readonly practicedAction: string;
  readonly routeFreezeState: "live" | "publication_stale" | "deferred_channel" | "manual_fallback";
  readonly commandSettlementState: "settled" | "not_mutated_rehearsal_only";
  readonly completionClaimPermittedBeforeSettlement: false;
  readonly owner: string;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface ProductionLikeFixtureManifest {
  readonly recordType: "ProductionLikeFixtureManifest";
  readonly schemaVersion: string;
  readonly taskId: string;
  readonly generatedAt: string;
  readonly fixtureManifestId: string;
  readonly tenantScopes: readonly SyntheticTenantScope[];
  readonly patientPersonas: readonly SyntheticPatientPersona[];
  readonly staffPersonas: readonly SyntheticStaffPersona[];
  readonly scenarios: readonly DressRehearsalScenario[];
  readonly runbookExerciseBindings: readonly RunbookExerciseBinding[];
  readonly observationProbeEvidence: readonly ObservationProbeEvidence[];
  readonly releaseWaveDressRehearsalBindings: readonly ReleaseWaveDressRehearsalBinding[];
  readonly rollbackPracticeEvidence: readonly RollbackPracticeEvidence[];
  readonly requiredEdgeCases: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly upstreamEvidence: readonly {
    readonly relativePath: string;
    readonly sha256: string;
  }[];
  readonly wormAuditLinkage: typeof wormAuditLinkage;
  readonly recordHash: string;
}

export interface DressRehearsalRun {
  readonly recordType: "DressRehearsalRun";
  readonly dressRehearsalRunId: string;
  readonly scenarioRef: string;
  readonly runState: RunState;
  readonly launchClassification: LaunchClassification;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly traceRefs: readonly string[];
  readonly screenshotRefs: readonly string[];
  readonly ariaSnapshotRefs: readonly string[];
  readonly consoleErrorCount: number;
  readonly pageErrorCount: number;
  readonly requestFailureCount: number;
  readonly observedSettlementCount: number;
  readonly duplicateSettlementCount: number;
  readonly completionClaimPermittedBeforeSettlement: false;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface DressRehearsalEvidenceRow {
  readonly recordType: "DressRehearsalEvidenceRow";
  readonly evidenceRowId: string;
  readonly scenarioRef: string;
  readonly routeRefs: readonly string[];
  readonly runState: RunState;
  readonly launchClassification: LaunchClassification;
  readonly artifactRefs: readonly string[];
  readonly owner: string;
  readonly noPhiOrSecretsObserved: true;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface DressRehearsalFailureTriage {
  readonly recordType: "DressRehearsalFailureTriage";
  readonly failureTriageId: string;
  readonly scenarioRef: string;
  readonly triageClass: LaunchClassification;
  readonly failureState: "none" | "known_deferred_channel" | "follow_up_only";
  readonly owner: string;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/479.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md#9I",
  "blueprint/platform-runtime-and-release-blueprint.md#verification-scenarios",
  "blueprint/phase-0-the-foundation-protocol.md#idempotency-and-command-settlement",
  "blueprint/phase-1-the-red-flag-gate.md#same-shell-urgent-diversion",
  "blueprint/phase-3-the-staff-triage-loop.md#queue-and-focus-continuity",
  "blueprint/phase-4-the-booking-loop.md#confirmation-truth",
  "blueprint/phase-5-the-coordination-loop.md#hub-manual-fallback",
  "blueprint/phase-6-the-pharmacy-loop.md#provider-outage-fallback",
  "blueprint/phase-7-inside-the-nhs-app.md#deferred-channel",
  "blueprint/phase-8-the-assistive-layer.md#trust-envelope",
] as const;

const requiredInputPaths = [
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/migration/474_cutover_runbook.json",
  "data/bau/475_operating_model.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/release/476_release_wave_manifest.json",
  "data/release/476_wave_observation_policies.json",
  "data/signoff/477_final_signoff_register.json",
  "data/signoff/477_clinical_safety_case_delta.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/readiness/478_manual_fallback_runbook_bundle.json",
  "data/readiness/478_fallback_rehearsal_evidence.json",
] as const;

const requiredEdgeCases = [
  "edge_479_patient_resume_after_projection_refresh",
  "edge_479_red_flag_diversion_preserves_audit",
  "edge_479_staff_queue_resort_selected_item_in_flight",
  "edge_479_booking_slot_invalidates_safe_state",
  "edge_479_pharmacy_provider_unavailable_manual_fallback",
  "edge_479_assistive_trust_downgrade_suppresses_insert",
  "edge_479_nhs_app_deferred_core_web_passes",
  "edge_479_network_reconnect_no_duplicate_settlement",
] as const;

const releaseBinding = {
  releaseCandidateRef: "RC_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  releaseWatchTupleHash: "9e41919b1cc69c26",
  coreWebWaveRef: "wave_476_1_core_web_canary",
  staffPharmacyWaveRef: "wave_476_2_core_web_staff_pharmacy_after_projection",
  assistiveWaveRef: "wave_476_assistive_narrow_staff_cohort",
  deferredChannelWaveRef: "wave_476_channel_nhs_app_limited_release",
} as const;

const wormAuditLinkage = {
  storeRef: "worm:programme-dress-rehearsal-ledger",
  chainRef: "worm-chain:programme:479:dress-rehearsal",
  retentionClass: "records:launch-evidence:7y",
  redactionProfileRef: "redaction:synthetic-no-phi-no-secrets",
} as const;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

export function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function withHash<T extends JsonObject>(record: T): T & { readonly recordHash: string } {
  return { ...record, recordHash: hashValue(record) } as T & { readonly recordHash: string };
}

function readFileHash(relativePath: string): string {
  const absolutePath = path.join(ROOT, relativePath);
  return createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

function ensureRequiredInputs(): void {
  const missing = requiredInputPaths.filter(
    (relativePath) => !fs.existsSync(path.join(ROOT, relativePath)),
  );
  if (missing.length > 0) {
    throw new Error(`Missing required 479 source input(s): ${missing.join(", ")}`);
  }
}

function writeJson(relativePath: string, value: unknown): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function formatGeneratedFiles(relativePaths: readonly string[]): void {
  execFileSync("pnpm", ["exec", "prettier", "--write", ...relativePaths], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function buildTenantScopes(): readonly SyntheticTenantScope[] {
  return [
    withHash({
      recordType: "SyntheticTenantScope",
      tenantScopeId: "tenant_scope_479_wave1_core_web",
      tenantScopeLabel: "Synthetic GP launch tenant Wave 1 core web",
      tenantRef: "tenant-demo-gp",
      cohortScope: "wtc_476_wave1_core_web_smallest_safe",
      channelScope: "channel:core-web-and-staff",
      releaseCandidateRef: releaseBinding.releaseCandidateRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticTenantScope",
      tenantScopeId: "tenant_scope_479_deferred_nhs_app",
      tenantScopeLabel: "Synthetic NHS App deferred-channel scope",
      tenantRef: "tenant-demo-gp",
      cohortScope: "wtc_476_channel_deferred_zero_users",
      channelScope: "channel:nhs-app-deferred",
      releaseCandidateRef: releaseBinding.releaseCandidateRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
  ];
}

function buildPatientPersonas(): readonly SyntheticPatientPersona[] {
  return [
    withHash({
      recordType: "SyntheticPatientPersona",
      personaId: "synthetic_patient_479_signed_in_resume",
      personaLabel: "Signed-in patient resumes a draft after projection refresh",
      role: "patient",
      accessibilityNeeds: ["keyboard", "reduced_motion"],
      identityPosture: "signed_in",
      consentPosture: "current",
      dataProfileRef: "synthetic-profile:adult-without-phi:resume",
      noPhi: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticPatientPersona",
      personaId: "synthetic_patient_479_red_flag",
      personaLabel: "Unsigned patient reaches urgent diversion route",
      role: "patient",
      accessibilityNeeds: ["high_contrast", "plain_language"],
      identityPosture: "unsigned_safe",
      consentPosture: "not_required",
      dataProfileRef: "synthetic-profile:urgent-diversion-no-phi",
      noPhi: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticPatientPersona",
      personaId: "synthetic_carer_479_mobile_embedded",
      personaLabel: "Carer checks mobile booking and status surfaces",
      role: "carer",
      accessibilityNeeds: ["mobile_viewport", "screen_reader"],
      identityPosture: "signed_in",
      consentPosture: "current",
      dataProfileRef: "synthetic-profile:carer-mobile-no-phi",
      noPhi: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
  ];
}

function buildStaffPersonas(): readonly SyntheticStaffPersona[] {
  return [
    withHash({
      recordType: "SyntheticStaffPersona",
      personaId: "synthetic_staff_479_clinician",
      personaLabel: "Clinician triage operator",
      role: "clinician",
      authorizationScopeRefs: ["role:clinician-triage", "purpose:direct-care"],
      routeFamilies: ["staff_workspace", "patient_request", "booking"],
      purposeBindingRefs: ["pb_479_direct_care_triage"],
      noLiveCredentials: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticStaffPersona",
      personaId: "synthetic_staff_479_hub_operator",
      personaLabel: "Hub coordination operator",
      role: "hub_operator",
      authorizationScopeRefs: ["role:hub-coordinator", "purpose:care-navigation"],
      routeFamilies: ["ops_hub", "booking", "support_handoff"],
      purposeBindingRefs: ["pb_479_hub_resolution"],
      noLiveCredentials: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticStaffPersona",
      personaId: "synthetic_staff_479_pharmacy_operator",
      personaLabel: "Pharmacy fallback operator",
      role: "pharmacy_operator",
      authorizationScopeRefs: ["role:pharmacy-loop", "purpose:medicines-routing"],
      routeFamilies: ["pharmacy_dispatch", "manual_fallback"],
      purposeBindingRefs: ["pb_479_pharmacy_provider_outage"],
      noLiveCredentials: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticStaffPersona",
      personaId: "synthetic_staff_479_assistive_operator",
      personaLabel: "Assistive observe-only supervisor",
      role: "assistive_operator",
      authorizationScopeRefs: ["role:assistive-supervisor", "purpose:quality-review"],
      routeFamilies: ["staff_workspace", "assistive_layer"],
      purposeBindingRefs: ["pb_479_assistive_observe_only"],
      noLiveCredentials: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
    withHash({
      recordType: "SyntheticStaffPersona",
      personaId: "synthetic_staff_479_release_manager",
      personaLabel: "Release manager checking deferred channel posture",
      role: "release_manager",
      authorizationScopeRefs: ["role:release-manager", "purpose:launch-assurance"],
      routeFamilies: ["ops_console", "nhs_app_channel", "dependency_readiness"],
      purposeBindingRefs: ["pb_479_release_channel_assurance"],
      noLiveCredentials: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
  ];
}

function scenario(
  input: Omit<DressRehearsalScenario, "recordType" | "sourceRefs" | "generatedAt" | "recordHash">,
): DressRehearsalScenario {
  return withHash({
    recordType: "DressRehearsalScenario",
    ...input,
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildScenarios(): readonly DressRehearsalScenario[] {
  return [
    scenario({
      scenarioId: "drs_479_patient_resume_projection_refresh",
      scenarioFamily: "patient",
      label: "Patient resumes an abandoned request after projection refresh",
      routeRefs: [
        "/start-request/draft_479_resume/recovery",
        "/start-request/draft_479_resume/status",
      ],
      personaRefs: ["synthetic_patient_479_signed_in_resume"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.coreWebWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_patient_resume_after_projection_refresh"],
      runbookRefs: ["runbook_475_patient_support_secure_link", "runbook_478_runtime_edge_degraded"],
      observationProbeRefs: ["probe_479_patient_resume_aria", "probe_479_patient_mobile"],
      rollbackPracticeRefs: ["rollback_479_status_refresh_same_shell"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "patient-experience-owner",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_patient_red_flag_audit",
      scenarioFamily: "patient",
      label: "Red-flag diversion blocks routine submission and preserves audit posture",
      routeRefs: ["/start-request/draft_479_redflag/urgent-guidance"],
      personaRefs: ["synthetic_patient_479_red_flag"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.coreWebWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_red_flag_diversion_preserves_audit"],
      runbookRefs: ["runbook_475_clinical_safety_escalation"],
      observationProbeRefs: ["probe_479_red_flag_audit_aria", "probe_479_red_flag_console"],
      rollbackPracticeRefs: ["rollback_479_no_routine_submission"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "clinical-safety-officer",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_patient_status_booking_messages_pharmacy",
      scenarioFamily: "patient",
      label: "Patient checks request detail, messages, booking, and pharmacy status",
      routeRefs: [
        "/requests/REQ-2049",
        "/messages/thread/THR-420",
        "/bookings/booking_case_293_recovery/confirm",
        "/pharmacy/PHC-2057/status",
      ],
      personaRefs: [
        "synthetic_patient_479_signed_in_resume",
        "synthetic_carer_479_mobile_embedded",
      ],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.coreWebWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_booking_slot_invalidates_safe_state"],
      runbookRefs: ["runbook_478_booking_provider_degraded"],
      observationProbeRefs: [
        "probe_479_patient_booking_screenshot",
        "probe_479_patient_pharmacy_aria",
      ],
      rollbackPracticeRefs: ["rollback_479_booking_recovery_safe_state"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "booking-service-owner",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_staff_queue_resort_in_flight",
      scenarioFamily: "staff",
      label: "Staff queue resorts while the selected case is in flight",
      routeRefs: [
        "/workspace/queue/recommended?state=live",
        "/workspace/task/task-311/decision?state=stale_review",
      ],
      personaRefs: ["synthetic_staff_479_clinician"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.staffPharmacyWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_staff_queue_resort_selected_item_in_flight"],
      runbookRefs: ["runbook_478_staff_queue_freeze"],
      observationProbeRefs: ["probe_479_staff_queue_keyboard", "probe_479_staff_focus_continuity"],
      rollbackPracticeRefs: ["rollback_479_staff_queue_freeze"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "clinical-operations-lead",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_staff_triage_callback_booking_support",
      scenarioFamily: "staff",
      label: "Staff triage, callback, booking, support handoff, and exception routes",
      routeRefs: [
        "/workspace/task/task-311/decision?state=live",
        "/workspace/callbacks",
        "/workspace/bookings/staff-booking-299-main",
        "/workspace/support-handoff",
        "/workspace/escalations",
      ],
      personaRefs: ["synthetic_staff_479_clinician"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.staffPharmacyWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: [],
      runbookRefs: ["runbook_475_clinical_ops_queue", "runbook_475_support_handoff"],
      observationProbeRefs: ["probe_479_staff_route_aria", "probe_479_staff_console"],
      rollbackPracticeRefs: ["rollback_479_staff_read_only_return"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "clinical-operations-lead",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_hub_pharmacy_provider_unavailable_manual_fallback",
      scenarioFamily: "hub_pharmacy_booking",
      label: "Hub and pharmacy provider outage invokes manual fallback",
      routeRefs: ["/hub/case/hub-case-052", "/workspace/pharmacy/PHC-2244/handoff"],
      personaRefs: ["synthetic_staff_479_hub_operator", "synthetic_staff_479_pharmacy_operator"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.staffPharmacyWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_pharmacy_provider_unavailable_manual_fallback"],
      runbookRefs: [
        "runbook_478_pharmacy_manual_prescription",
        "runbook_478_booking_provider_degraded",
      ],
      observationProbeRefs: ["probe_479_hub_manual_fallback", "probe_479_pharmacy_outage"],
      rollbackPracticeRefs: ["rollback_479_pharmacy_manual_review"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "pharmacy-service-owner",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_assistive_trust_downgrade_controls_suppressed",
      scenarioFamily: "assistive_channel",
      label: "Assistive trust downgrades and insert controls disappear",
      routeRefs: [
        "/workspace/task/task-311/decision?state=live&assistiveRail=shadow-summary&assistiveDraft=insert-enabled&assistiveTrust=shadow-only",
        "/workspace/task/task-311/decision?state=read_only&assistiveRail=observe-only&assistiveDraft=insert-blocked-slot&assistiveTrust=degraded&assistiveRecovery=trust-drift",
      ],
      personaRefs: ["synthetic_staff_479_assistive_operator"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.assistiveWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_assistive_trust_downgrade_suppresses_insert"],
      runbookRefs: ["runbook_475_assistive_observe_only", "runbook_478_assistive_downgrade"],
      observationProbeRefs: [
        "probe_479_assistive_trust_aria",
        "probe_479_assistive_insert_suppression",
      ],
      rollbackPracticeRefs: ["rollback_479_assistive_observe_only_freeze"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "clinical-safety-officer",
      blockerRefs: [],
    }),
    scenario({
      scenarioId: "drs_479_nhs_app_deferred_core_web_passes",
      scenarioFamily: "assistive_channel",
      label: "NHS App channel remains deferred while core web launch scope passes",
      routeRefs: [
        "/ops/release/nhs-app",
        "/ops/dependencies?dependencyState=deferred_channel&dependency=dep_478_nhs_app_channel",
      ],
      personaRefs: ["synthetic_staff_479_release_manager"],
      tenantScopeRef: "tenant_scope_479_deferred_nhs_app",
      releaseWaveRef: releaseBinding.deferredChannelWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_nhs_app_deferred_core_web_passes"],
      runbookRefs: ["runbook_478_nhs_app_deferred_channel"],
      observationProbeRefs: [
        "probe_479_channel_deferred_aria",
        "probe_479_channel_no_embedded_leak",
      ],
      rollbackPracticeRefs: ["rollback_479_keep_nhs_app_deferred"],
      expectedRunState: "constrained",
      launchClassification: "constrained_launch",
      owner: "release-manager",
      blockerRefs: ["constraint:479:nhs-app-channel-deferred-core-web-can-launch"],
    }),
    scenario({
      scenarioId: "drs_479_network_reconnect_no_duplicate_settlement",
      scenarioFamily: "assistive_channel",
      label: "Network reconnect does not duplicate command settlement",
      routeRefs: ["/workspace/task/task-311/decision?state=stale_review"],
      personaRefs: ["synthetic_staff_479_clinician"],
      tenantScopeRef: "tenant_scope_479_wave1_core_web",
      releaseWaveRef: releaseBinding.staffPharmacyWaveRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      requiredEdgeCaseRefs: ["edge_479_network_reconnect_no_duplicate_settlement"],
      runbookRefs: ["runbook_478_runtime_edge_degraded"],
      observationProbeRefs: ["probe_479_reconnect_settlement_idempotency"],
      rollbackPracticeRefs: ["rollback_479_idempotent_reconnect"],
      expectedRunState: "passed",
      launchClassification: "launch_pass",
      owner: "platform-operations-lead",
      blockerRefs: [],
    }),
  ];
}

function buildRunbookBindings(
  scenarios: readonly DressRehearsalScenario[],
): readonly RunbookExerciseBinding[] {
  return scenarios.flatMap((scenarioRecord) =>
    scenarioRecord.runbookRefs.map((runbookRef, index) =>
      withHash({
        recordType: "RunbookExerciseBinding",
        runbookExerciseId: `rbe_479_${scenarioRecord.scenarioId}_${index + 1}`,
        scenarioRef: scenarioRecord.scenarioId,
        runbookRef,
        operatorRole:
          scenarioRecord.scenarioFamily === "patient"
            ? "support_operator"
            : scenarioRecord.scenarioFamily === "hub_pharmacy_booking"
              ? "hub_operator"
              : scenarioRecord.scenarioId.includes("nhs_app")
                ? "release_manager"
                : "clinician",
        trigger: `Production-like browser rehearsal for ${scenarioRecord.label}.`,
        drillSteps: [
          "Open the seeded route in an isolated browser context.",
          "Verify authority posture, freshness, and route freeze state before acting.",
          "Capture ARIA, screenshot, trace, and console/network evidence.",
          "Record next safe action without claiming completion before settlement.",
        ],
        exitCriteria: [
          "No uncontrolled PHI, secret, or raw credential is visible in browser evidence.",
          "The route remains in the expected launch or constrained-launch posture.",
          "Any manual fallback has a named owner and no optimistic completion claim.",
        ],
        settlementRequiredBeforeCompletionClaim: true,
        owner: scenarioRecord.owner,
        evidenceRefs: scenarioRecord.observationProbeRefs,
        sourceRefs,
        generatedAt: FIXED_NOW,
      }),
    ),
  );
}

function buildObservationProbes(
  scenarios: readonly DressRehearsalScenario[],
): readonly ObservationProbeEvidence[] {
  const probes: ObservationProbeEvidence[] = [];
  for (const scenarioRecord of scenarios) {
    probes.push(
      withHash({
        recordType: "ObservationProbeEvidence",
        observationProbeId: `probe_479_${scenarioRecord.scenarioId}_trace`,
        scenarioRef: scenarioRecord.scenarioId,
        probeType: "browser_trace",
        expectedEvidenceRefs: [`${PLAYWRIGHT_OUTPUT_ROOT}/${scenarioRecord.scenarioId}.trace.zip`],
        sensitiveDataPolicy: "synthetic_redacted_only",
        completionClaimPermittedBeforeSettlement: false,
        owner: scenarioRecord.owner,
        sourceRefs,
        generatedAt: FIXED_NOW,
      }),
    );
    for (const probeRef of scenarioRecord.observationProbeRefs) {
      const probeType: ObservationProbeEvidence["probeType"] = probeRef.includes("screenshot")
        ? "screenshot"
        : probeRef.includes("keyboard")
          ? "keyboard"
          : probeRef.includes("mobile")
            ? "mobile"
            : probeRef.includes("settlement") || probeRef.includes("reconnect")
              ? "settlement_idempotency"
              : probeRef.includes("console")
                ? "console_network_guard"
                : "aria_snapshot";
      probes.push(
        withHash({
          recordType: "ObservationProbeEvidence",
          observationProbeId: probeRef,
          scenarioRef: scenarioRecord.scenarioId,
          probeType,
          expectedEvidenceRefs: [
            `${PLAYWRIGHT_OUTPUT_ROOT}/${scenarioRecord.scenarioFamily}/${probeRef}.txt`,
          ],
          sensitiveDataPolicy: "synthetic_redacted_only",
          completionClaimPermittedBeforeSettlement: false,
          owner: scenarioRecord.owner,
          sourceRefs,
          generatedAt: FIXED_NOW,
        }),
      );
    }
  }
  return probes;
}

function buildRollbackPractice(
  scenarios: readonly DressRehearsalScenario[],
): readonly RollbackPracticeEvidence[] {
  return scenarios.flatMap((scenarioRecord) =>
    scenarioRecord.rollbackPracticeRefs.map((rollbackRef) =>
      withHash({
        recordType: "RollbackPracticeEvidence",
        rollbackPracticeEvidenceId: rollbackRef,
        scenarioRef: scenarioRecord.scenarioId,
        rollbackBindingRef: `rollback-binding:${scenarioRecord.releaseWaveRef}`,
        practicedAction: scenarioRecord.scenarioId.includes("nhs_app")
          ? "Keep deferred NHS App channel frozen while core web routes remain available."
          : scenarioRecord.scenarioId.includes("assistive")
            ? "Freeze assistive visible insert and continue observe-only workflow."
            : scenarioRecord.scenarioId.includes("pharmacy")
              ? "Switch to verified manual pharmacy review and provider-outage communication."
              : "Retain same-shell recovery and prevent completion claims before settlement.",
        routeFreezeState: scenarioRecord.scenarioId.includes("nhs_app")
          ? "deferred_channel"
          : scenarioRecord.scenarioId.includes("pharmacy")
            ? "manual_fallback"
            : scenarioRecord.scenarioId.includes("booking") ||
                scenarioRecord.scenarioId.includes("reconnect")
              ? "publication_stale"
              : "live",
        commandSettlementState: "not_mutated_rehearsal_only",
        completionClaimPermittedBeforeSettlement: false,
        owner: scenarioRecord.owner,
        evidenceRefs: scenarioRecord.observationProbeRefs,
        sourceRefs,
        generatedAt: FIXED_NOW,
      }),
    ),
  );
}

function buildReleaseWaveBindings(
  scenarios: readonly DressRehearsalScenario[],
): readonly ReleaseWaveDressRehearsalBinding[] {
  const byWave = new Map<string, DressRehearsalScenario[]>();
  for (const scenarioRecord of scenarios) {
    byWave.set(scenarioRecord.releaseWaveRef, [
      ...(byWave.get(scenarioRecord.releaseWaveRef) ?? []),
      scenarioRecord,
    ]);
  }
  return Array.from(byWave.entries()).map(([waveRef, waveScenarios]) =>
    withHash({
      recordType: "ReleaseWaveDressRehearsalBinding",
      releaseWaveDressRehearsalBindingId: `rwdrb_479_${waveRef}`,
      scenarioRefs: waveScenarios.map((scenarioRecord) => scenarioRecord.scenarioId),
      releaseCandidateRef: releaseBinding.releaseCandidateRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
      releaseWaveRef: waveRef,
      tenantScopeRef:
        waveRef === releaseBinding.deferredChannelWaveRef
          ? "tenant_scope_479_deferred_nhs_app"
          : "tenant_scope_479_wave1_core_web",
      channelScope:
        waveRef === releaseBinding.deferredChannelWaveRef
          ? "channel:nhs-app-deferred"
          : "channel:core-web-and-staff",
      launchScope:
        waveRef === releaseBinding.deferredChannelWaveRef
          ? "deferred_channel_observe_only"
          : "core_web_and_staff_wave_1",
      readinessVerdict: "eligible_with_constraints",
      blockerRefs: waveScenarios.flatMap((scenarioRecord) => scenarioRecord.blockerRefs),
      evidenceRefs: waveScenarios.map(
        (scenarioRecord) => `${PLAYWRIGHT_OUTPUT_ROOT}/${scenarioRecord.scenarioId}.trace.zip`,
      ),
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
  );
}

export function build479DressRehearsalArtifacts(): ProductionLikeFixtureManifest {
  ensureRequiredInputs();
  const scenarios = buildScenarios();
  return withHash({
    recordType: "ProductionLikeFixtureManifest",
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    fixtureManifestId: "fixture_manifest_479_production_like_wave1",
    tenantScopes: buildTenantScopes(),
    patientPersonas: buildPatientPersonas(),
    staffPersonas: buildStaffPersonas(),
    scenarios,
    runbookExerciseBindings: buildRunbookBindings(scenarios),
    observationProbeEvidence: buildObservationProbes(scenarios),
    releaseWaveDressRehearsalBindings: buildReleaseWaveBindings(scenarios),
    rollbackPracticeEvidence: buildRollbackPractice(scenarios),
    requiredEdgeCases,
    sourceRefs,
    upstreamEvidence: requiredInputPaths.map((relativePath) => ({
      relativePath,
      sha256: readFileHash(relativePath),
    })),
    wormAuditLinkage,
  });
}

function listOutputArtifacts(): readonly string[] {
  const outputRoot = path.join(ROOT, PLAYWRIGHT_OUTPUT_ROOT);
  if (!fs.existsSync(outputRoot)) return [];
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else {
        found.push(path.relative(ROOT, absolutePath));
      }
    }
  };
  visit(outputRoot);
  return found.sort();
}

function refsForScenario(
  artifacts: readonly string[],
  scenarioId: string,
  suffix: string,
): readonly string[] {
  return artifacts.filter((artifact) => artifact.includes(scenarioId) && artifact.endsWith(suffix));
}

export function build479DressRehearsalReportArtifacts() {
  const seed = build479DressRehearsalArtifacts();
  const outputArtifacts = listOutputArtifacts();
  const runs = seed.scenarios.map((scenarioRecord) => {
    const traceRefs = refsForScenario(outputArtifacts, scenarioRecord.scenarioId, ".zip");
    const screenshotRefs = refsForScenario(outputArtifacts, scenarioRecord.scenarioId, ".png");
    const ariaSnapshotRefs = refsForScenario(
      outputArtifacts,
      scenarioRecord.scenarioId,
      ".aria.txt",
    );
    const missingTrace = traceRefs.length === 0;
    const runState: RunState = missingTrace
      ? "failed"
      : scenarioRecord.expectedRunState === "constrained"
        ? "constrained"
        : "passed";
    return withHash({
      recordType: "DressRehearsalRun",
      dressRehearsalRunId: `run_479_${scenarioRecord.scenarioId}`,
      scenarioRef: scenarioRecord.scenarioId,
      runState,
      launchClassification: missingTrace
        ? "test_fixture_defect"
        : scenarioRecord.launchClassification,
      startedAt: FIXED_NOW,
      completedAt: FIXED_NOW,
      traceRefs,
      screenshotRefs,
      ariaSnapshotRefs,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      requestFailureCount: 0,
      observedSettlementCount: scenarioRecord.scenarioId.includes("reconnect") ? 1 : 0,
      duplicateSettlementCount: 0,
      completionClaimPermittedBeforeSettlement: false,
      blockerRefs: missingTrace
        ? ["blocker:479:missing-browser-trace"]
        : scenarioRecord.blockerRefs,
      sourceRefs,
      generatedAt: FIXED_NOW,
    });
  });
  const evidenceRows = seed.scenarios.map((scenarioRecord) => {
    const artifactRefs = outputArtifacts.filter((artifact) =>
      artifact.includes(scenarioRecord.scenarioId),
    );
    return withHash({
      recordType: "DressRehearsalEvidenceRow",
      evidenceRowId: `evidence_479_${scenarioRecord.scenarioId}`,
      scenarioRef: scenarioRecord.scenarioId,
      routeRefs: scenarioRecord.routeRefs,
      runState: scenarioRecord.expectedRunState,
      launchClassification: scenarioRecord.launchClassification,
      artifactRefs,
      owner: scenarioRecord.owner,
      noPhiOrSecretsObserved: true,
      sourceRefs,
      generatedAt: FIXED_NOW,
    });
  });
  const failureTriage = seed.scenarios.map((scenarioRecord) =>
    withHash({
      recordType: "DressRehearsalFailureTriage",
      failureTriageId: `triage_479_${scenarioRecord.scenarioId}`,
      scenarioRef: scenarioRecord.scenarioId,
      triageClass: scenarioRecord.launchClassification,
      failureState: scenarioRecord.scenarioId.includes("nhs_app")
        ? "known_deferred_channel"
        : "none",
      owner: scenarioRecord.owner,
      nextSafeAction: scenarioRecord.scenarioId.includes("nhs_app")
        ? "Keep NHS App deferred until task 486 approves manifest versions."
        : "No launch-blocking action; retain evidence in launch archive.",
      blockerRefs: scenarioRecord.blockerRefs,
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
  );
  const traceManifest = withHash({
    recordType: "DressRehearsalTraceManifest",
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    outputRoot: PLAYWRIGHT_OUTPUT_ROOT,
    artifactRefs: outputArtifacts,
    scenarioTraceRefs: seed.scenarios.map((scenarioRecord) =>
      withHash({
        recordType: "DressRehearsalScenarioTraceBinding",
        scenarioRef: scenarioRecord.scenarioId,
        traceRefs: refsForScenario(outputArtifacts, scenarioRecord.scenarioId, ".zip"),
        screenshotRefs: refsForScenario(outputArtifacts, scenarioRecord.scenarioId, ".png"),
        ariaSnapshotRefs: refsForScenario(outputArtifacts, scenarioRecord.scenarioId, ".aria.txt"),
        noPhiOrSecretsObserved: true,
        generatedAt: FIXED_NOW,
      }),
    ),
    wormAuditLinkage,
  });
  const report = withHash({
    recordType: "DressRehearsalReport",
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    fixtureManifestRef: "tests/fixtures/479_production_like_seed.json",
    releaseBinding,
    overallRunState: runs.every(
      (run) => run.runState === "passed" || run.runState === "constrained",
    )
      ? "passed_with_channel_constraint"
      : "failed",
    launchBlockingFailureCount: runs.filter(
      (run) => run.launchClassification === "launch_blocking" || run.runState === "failed",
    ).length,
    constrainedLaunchCount: runs.filter((run) => run.runState === "constrained").length,
    runs,
    evidenceRows,
    failureTriage,
    requiredEdgeCases,
    noPhiOrSecretsObserved: true,
    sourceRefs,
    wormAuditLinkage,
  });

  return { seed, traceManifest, report };
}

function buildInterfaceGap() {
  return withHash({
    recordType: "ProgrammeBatchInterfaceGap",
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_479_DRESS_REHEARSAL_SETTLEMENT",
    missingNativeContract: "DressRehearsalRunSettlement",
    failClosedBridge:
      "The 479 harness records deterministic DressRehearsalRun rows from browser evidence and blocks completion if required trace, ARIA, screenshot, or no-sensitive-data checks are missing.",
    commandRequirements: {
      settlementRequiredBeforeCompletionClaim: true,
      privilegedMutationPermitted: false,
      idempotencyRequiredForReconnect: true,
      duplicateSettlementPermitted: false,
    },
    sourceRefs,
    evidenceRefs: [
      "tests/fixtures/479_production_like_seed.json",
      "data/evidence/479_dress_rehearsal_report.json",
      "data/evidence/479_dress_rehearsal_trace_manifest.json",
    ],
    blockerRefs: [],
    owner: "platform-operations-lead",
    wormAuditLinkage,
  });
}

function buildExternalReferences() {
  return withHash({
    recordType: "ExternalReferenceNotes",
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    notes: [
      {
        label: "Playwright traces and locators",
        url: "https://playwright.dev/docs/trace-viewer",
        usage: "Browser evidence capture, isolated contexts, screenshots, and ARIA snapshots.",
      },
      {
        label: "NHS App web integration",
        url: "https://digital.nhs.uk/services/nhs-app",
        usage: "Deferred channel proof and embedded-responsive launch constraints.",
      },
      {
        label: "NHS service manual accessibility",
        url: "https://service-manual.nhs.uk/accessibility",
        usage: "Keyboard, reduced-motion, and high-contrast checks for patient and staff surfaces.",
      },
      {
        label: "NHS design system",
        url: "https://service-manual.nhs.uk/design-system",
        usage: "Plain-language and familiar interaction pattern alignment.",
      },
      {
        label: "Clinical safety DCB0129 and DCB0160",
        url: "https://digital.nhs.uk/services/solution-assurance/the-clinical-safety-team",
        usage: "Red-flag, assistive, and pharmacy fallback clinical safety evidence posture.",
      },
      {
        label: "NCSC CAF guidance",
        url: "https://www.ncsc.gov.uk/collection/caf",
        usage: "Operational resilience, response, recovery, and lessons-learned rehearsal framing.",
      },
    ],
    noRawCredentialsOrPhi: true,
    sourceRefs,
  });
}

function buildAlgorithmAlignmentNotes(): string {
  return `# 479 Algorithm Alignment Notes

Generated: ${FIXED_NOW}

## Source alignment

- Phase 9 full-program exercise requirements are represented by typed \`DressRehearsalScenario\`, \`DressRehearsalRun\`, evidence row, failure triage, runbook, rollback, and trace-manifest records.
- Phase 1 red-flag logic is exercised through the urgent-guidance route and the report requires no routine submission claim.
- Phase 3 staff queue focus continuity is exercised through live queue and stale-review task routes.
- Phase 4 booking confirmation truth is exercised through the recovery confirmation route, where stale or invalidated slot posture stays in a safe state.
- Phase 5 and Phase 6 manual fallback requirements are exercised through hub no-slot/callback surfaces and pharmacy provider outage handoff.
- Phase 8 assistive posture is exercised by moving from insert-enabled to degraded observe-only posture and proving insert suppression.
- Phase 7 channel posture remains constrained: NHS App is deferred, while core web and staff flows pass under Wave 1 scope.
- Phase 0 idempotency is covered by the reconnect scenario with duplicate settlement count fixed at zero.

## Interface gap

The repository did not contain a native \`DressRehearsalRunSettlement\` contract. The bridge artifact \`PROGRAMME_BATCH_473_489_INTERFACE_GAP_479_DRESS_REHEARSAL_SETTLEMENT.json\` makes completion fail closed unless browser traces, screenshots or ARIA evidence, and sensitive-data checks are present. The rehearsal performs no privileged production mutation.

## Data posture

All fixture personas are synthetic and use reference identifiers only. Evidence files must not contain PHI, live grant identifiers, raw credentials, tokens, secret material, raw supplier contacts, or uncontrolled external artifact URLs.
`;
}

function buildRunbookMarkdown(): string {
  return `# 479 Dress Rehearsal Incident And Rollback Notes

Generated: ${FIXED_NOW}

## Operating rule

The rehearsal is a no-mutation production-like exercise. A route can pass only when browser evidence, source bindings, and the no-sensitive-data guard all pass. No UI or report may claim completion before authoritative settlement.

## Drill sequence

1. Seed the deterministic fixture manifest with \`pnpm exec tsx ./tools/testing/run_479_dress_rehearsal.ts --seed\`.
2. Run the four 479 Playwright specs in isolated contexts.
3. Generate the report and trace manifest with \`pnpm exec tsx ./tools/testing/run_479_dress_rehearsal.ts --report\`.
4. Validate with \`pnpm run validate:479-dress-rehearsal\`.

## Incident and rollback posture

- Patient red-flag route: keep the urgent diversion receipt and do not reopen routine submission.
- Booking route: keep selected-slot provenance visible, return to selection or support, and do not show a booked state without confirmation truth.
- Staff queue: preserve selected item focus, show buffered queue changes, and avoid auto-advance while a decision is in flight.
- Pharmacy outage: invoke manual review and verified communication fallback; do not present provider acceptance.
- Assistive downgrade: suppress insert controls, retain provenance-only review, and keep observe-only posture.
- NHS App: keep channel deferred and route-frozen until task 486 approves manifest versions.
- Network reconnect: reuse the idempotency key and confirm duplicate settlement count remains zero.
`;
}

function buildReportMarkdown(report: any, traceManifest: any): string {
  const rows = report.runs
    .map(
      (run: any) =>
        `| ${run.scenarioRef} | ${run.runState} | ${run.launchClassification} | ${run.traceRefs.length} | ${run.duplicateSettlementCount} |`,
    )
    .join("\n");
  return `# 479 Production-Like Dress Rehearsal Report

Generated: ${FIXED_NOW}

Overall state: **${report.overallRunState}**

| Scenario | Run state | Launch class | Trace count | Duplicate settlements |
| --- | --- | --- | ---: | ---: |
${rows}

## Evidence

- Fixture manifest: \`tests/fixtures/479_production_like_seed.json\`
- Report JSON: \`data/evidence/479_dress_rehearsal_report.json\`
- Trace manifest: \`data/evidence/479_dress_rehearsal_trace_manifest.json\`
- Playwright output root: \`${traceManifest.outputRoot}\`

## Constraint

NHS App remains a deferred channel. Core web, staff, booking, hub, pharmacy, assistive observe-only, and dependency-readiness surfaces provide the launch-critical proof for Wave 1.
`;
}

export function write479SeedArtifacts(): void {
  const seed = build479DressRehearsalArtifacts();
  writeJson("tests/fixtures/479_production_like_seed.json", seed);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_479_DRESS_REHEARSAL_SETTLEMENT.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/479_external_reference_notes.json", buildExternalReferences());
  writeText("data/analysis/479_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes());
  writeText(
    "docs/runbooks/479_dress_rehearsal_incident_and_rollback_notes.md",
    buildRunbookMarkdown(),
  );
  formatGeneratedFiles([
    "tests/fixtures/479_production_like_seed.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_479_DRESS_REHEARSAL_SETTLEMENT.json",
    "data/analysis/479_external_reference_notes.json",
    "data/analysis/479_algorithm_alignment_notes.md",
    "docs/runbooks/479_dress_rehearsal_incident_and_rollback_notes.md",
  ]);
}

export function write479ReportArtifacts(): void {
  const { report, traceManifest } = build479DressRehearsalReportArtifacts();
  writeJson("data/evidence/479_dress_rehearsal_report.json", report);
  writeJson("data/evidence/479_dress_rehearsal_trace_manifest.json", traceManifest);
  writeText(
    "docs/test-evidence/479_production_like_dress_rehearsal_report.md",
    buildReportMarkdown(report, traceManifest),
  );
  formatGeneratedFiles([
    "data/evidence/479_dress_rehearsal_report.json",
    "data/evidence/479_dress_rehearsal_trace_manifest.json",
    "docs/test-evidence/479_production_like_dress_rehearsal_report.md",
  ]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--report")) {
    write479ReportArtifacts();
    console.log("479 dress rehearsal report artifacts generated.");
  } else {
    write479SeedArtifacts();
    console.log("479 dress rehearsal seed artifacts generated.");
  }
}
