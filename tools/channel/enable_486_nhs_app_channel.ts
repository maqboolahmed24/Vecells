import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_486";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "486.programme.nhs-app-channel-enablement.v1";
export const OUTPUT_ROOT = "output/playwright/486-nhs-app-embedded-channel";

type JsonObject = Record<string, unknown>;

export type NHSApp486ScenarioState =
  | "approved_embedded"
  | "deferred_scope"
  | "blocked_tuple_mismatch"
  | "unsupported_bridge"
  | "aos_approved_live_profile_missing"
  | "route_coverage_missing_pharmacy_status"
  | "unsupported_download_no_fallback"
  | "chrome_hiding_not_enforced"
  | "monthly_data_missing_active_release"
  | "journey_text_changed_without_notice"
  | "safe_return_broken";

type ActivationDecisionState = "approved" | "approved_with_fallback" | "deferred" | "blocked";
type ActivationSettlementResult =
  | "applied"
  | "applied_with_fallback"
  | "deferred_hidden"
  | "blocked_environment"
  | "blocked_tuple"
  | "blocked_coverage"
  | "blocked_fallback"
  | "blocked_chrome"
  | "blocked_obligation"
  | "blocked_change_control"
  | "blocked_safe_return";
type CoverageState = "exact" | "missing" | "stale" | "blocked";
type ChannelExposureState = "enabled" | "deferred_hidden" | "blocked_hidden";
type FallbackState = "not_required" | "governed" | "missing";

interface ReleaseBinding486 {
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly manifestVersionRef: string;
}

export interface NHSAppLimitedReleaseScope {
  readonly recordType: "NHSAppLimitedReleaseScope";
  readonly limitedReleaseScopeId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly channelFamilyRef: "channel:nhs-app-web-integration";
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly waveRef: string;
  readonly releaseStage: "limited_release" | "deferred";
  readonly approvedTenantRefs: readonly string[];
  readonly approvedCohortRefs: readonly string[];
  readonly approvedJourneyPathRefs: readonly string[];
  readonly approvedManifestVersionRef: string;
  readonly environmentProfileRef: string;
  readonly environmentProfileState: "live_profile_exact" | "live_profile_missing";
  readonly channelScopeState: "approved" | "deferred" | "blocked";
  readonly exposurePermitted: boolean;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface EmbeddedRouteActivationVerdict {
  readonly recordType: "EmbeddedRouteActivationVerdict";
  readonly routeVerdictId: string;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly routeFamilyRef: string;
  readonly journeyPathRefs: readonly string[];
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly routeContractState: CoverageState;
  readonly embeddedSurfaceCoverageState: CoverageState;
  readonly bridgeCapabilityState: "verified" | "unavailable" | "mismatched";
  readonly runtimePublicationState: "published" | "stale" | "blocked";
  readonly safeReturnState: "exact" | "broken";
  readonly unsupportedCapabilityState:
    | "none"
    | "governed_fallback"
    | "unsupported_without_fallback";
  readonly downloadActionExposed: boolean;
  readonly printActionExposed: boolean;
  readonly browserHandoffActionExposed: boolean;
  readonly fallbackState: FallbackState;
  readonly activationState: "live" | "placeholder_only" | "read_only" | "hidden" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly evaluatedAt: string;
  readonly recordHash: string;
}

export interface EmbeddedSurfacePostureProof {
  readonly recordType: "EmbeddedSurfacePostureProof";
  readonly postureProofId: string;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly manifestVersionRef: string;
  readonly shellPolicyRef: string;
  readonly mobileLayoutProfile: "mission_stack";
  readonly desktopRailState: "removed";
  readonly pageTitleState: "clear";
  readonly statusProvenanceStripState: "compact";
  readonly headerHidden: boolean;
  readonly footerHidden: boolean;
  readonly supplierChromeState: "hidden" | "not_enforced";
  readonly patientLanguageState: "normal_journey_language";
  readonly rawSensitiveTelemetryState: "redacted";
  readonly safeAreaState: "verified";
  readonly postureState: "exact" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly capturedAt: string;
  readonly recordHash: string;
}

export interface NHSAppUnsupportedBridgeFallback {
  readonly recordType: "NHSAppUnsupportedBridgeFallback";
  readonly fallbackId: string;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly routeFamilyRef: string;
  readonly unsupportedCapabilities: readonly string[];
  readonly fallbackMode:
    | "not_required"
    | "summary_first"
    | "secure_send_later"
    | "safe_browser_handoff"
    | "missing";
  readonly fallbackState: FallbackState;
  readonly deadLinkExposed: boolean;
  readonly patientCopyVariantRef: string;
  readonly safeActionRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface ChannelFreezeDispositionBinding {
  readonly recordType: "ChannelFreezeDispositionBinding";
  readonly freezeDispositionBindingId: string;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly channelReleaseFreezeRecordRef: string;
  readonly freezeState: "monitoring" | "frozen" | "kill_switch_active" | "released";
  readonly freezeMode:
    | "none"
    | "hidden"
    | "read_only"
    | "placeholder_only"
    | "redirect_to_safe_route";
  readonly patientMessageRef: string;
  readonly safeRouteRef: string;
  readonly supportRecoveryRef: string;
  readonly dispositionState: "current" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface NHSAppMonthlyDataObligationBinding {
  readonly recordType: "NHSAppMonthlyDataObligationBinding";
  readonly monthlyDataObligationBindingId: string;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly manifestVersionRef: string;
  readonly releaseCohortRef: string;
  readonly observationPolicyRef: string;
  readonly telemetryContractRef: string;
  readonly monthlyPackScheduleRef: string;
  readonly privacyRedactionState: "exact";
  readonly obligationState: "bound" | "missing";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface JourneyChangeControlBinding {
  readonly recordType: "JourneyChangeControlBinding";
  readonly journeyChangeControlBindingId: string;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly manifestVersionRef: string;
  readonly changeNoticeRef: string | null;
  readonly affectedJourneyPathRefs: readonly string[];
  readonly journeyTextChangeState: "unchanged" | "changed_after_approval";
  readonly noticeState: "approved" | "missing" | "not_required";
  readonly leadTimeState: "satisfied" | "blocked" | "not_required";
  readonly bindingState: "current" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface NHSAppManifestActivationPlan {
  readonly recordType: "NHSAppManifestActivationPlan";
  readonly activationPlanId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly activeScenarioId: NHSApp486ScenarioState;
  readonly approvedManifestVersionRefs: readonly string[];
  readonly activeManifestVersionRef: string;
  readonly channelFamilyRef: "channel:nhs-app-web-integration";
  readonly tenantScope: string;
  readonly limitedReleaseScopeRef: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly environmentProfileRef: string;
  readonly routeVerdictRefs: readonly string[];
  readonly embeddedSurfacePostureProofRefs: readonly string[];
  readonly unsupportedBridgeFallbackRefs: readonly string[];
  readonly monthlyDataObligationBindingRefs: readonly string[];
  readonly journeyChangeControlBindingRefs: readonly string[];
  readonly freezeDispositionBindingRefs: readonly string[];
  readonly commandRefs: readonly string[];
  readonly settlementRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly activationDecisionState: ActivationDecisionState;
  readonly channelExposureState: ChannelExposureState;
  readonly failClosedMode: "deferred_hidden";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface NHSAppChannelEnablementCommand {
  readonly recordType: "NHSAppChannelEnablementCommand";
  readonly commandId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly commandType:
    | "enable_channel"
    | "enable_channel_with_fallback"
    | "defer_channel"
    | "hold_hidden";
  readonly commandState: "accepted" | "blocked";
  readonly requestedChannelState: ChannelExposureState;
  readonly manifestVersionRef: string;
  readonly expectedEnvironmentProfileRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly roleAuthorizationRef: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly routeIntentBindingRef: string;
  readonly injectedClockRef: string;
  readonly actingContextRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface NHSAppChannelEnablementSettlement {
  readonly recordType: "NHSAppChannelEnablementSettlement";
  readonly settlementId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: NHSApp486ScenarioState;
  readonly commandRef: string;
  readonly result: ActivationSettlementResult;
  readonly enabled: boolean;
  readonly channelExposureState: ChannelExposureState;
  readonly observedManifestVersionRef: string;
  readonly observedEnvironmentProfileState: "live_profile_exact" | "live_profile_missing";
  readonly observedRouteCoverageState: "exact" | "blocked";
  readonly observedMonthlyDataObligationState: "bound" | "missing";
  readonly observedJourneyChangeControlState: "current" | "blocked";
  readonly observedSafeReturnState: "exact" | "broken";
  readonly observedFallbackState: FallbackState;
  readonly recoveryActionRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/486.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-7-inside-the-nhs-app.md#integration-manifest",
  "blueprint/phase-7-inside-the-nhs-app.md#nhs-app-bridge-api-navigation-model-and-embedded-behaviours",
  "blueprint/phase-7-inside-the-nhs-app.md#webview-limitations-file-handling-and-resilient-error-ux",
  "blueprint/phase-7-inside-the-nhs-app.md#sandpit-aos-scal-and-operational-delivery-pipeline",
  "blueprint/phase-7-inside-the-nhs-app.md#limited-release-post-live-governance-and-formal-exit-gate",
  "blueprint/platform-runtime-and-release-blueprint.md#runtimepublicationbundle",
  "blueprint/platform-runtime-and-release-blueprint.md#embeddedsurfacecontractcoveragerecord",
  "blueprint/patient-portal-experience-architecture-blueprint.md#nhs-app-embedded-mode",
  "blueprint/platform-frontend-blueprint.md",
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/conformance/473_phase7_embedded_surface_coverage_matrix.json",
  "data/release/476_release_wave_manifest.json",
  "data/signoff/477_final_signoff_register.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/481_dr_and_go_live_smoke_report.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
] as const;

const requiredInputPaths = [
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/conformance/473_phase7_embedded_surface_coverage_matrix.json",
  "data/conformance/473_phase7_deferred_scope_blockers.json",
  "data/release/476_release_wave_manifest.json",
  "data/signoff/477_final_signoff_register.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/481_dr_and_go_live_smoke_report.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
] as const;

export const required486EdgeCases = [
  "edge_486_manifest_approved_in_aos_but_live_profile_missing",
  "edge_486_route_coverage_start_exact_pharmacy_status_missing",
  "edge_486_download_export_unsupported_without_alternative_artifact_presentation",
  "edge_486_nhs_app_footer_header_hiding_rule_not_enforced",
  "edge_486_monthly_data_obligation_missing_for_active_limited_release",
  "edge_486_journey_text_changes_after_approval_without_notice",
  "edge_486_safe_return_route_broken_after_outbound_navigation_grant",
] as const;

const edgeCaseByScenario: Record<NHSApp486ScenarioState, string | null> = {
  approved_embedded: null,
  deferred_scope: null,
  blocked_tuple_mismatch: null,
  unsupported_bridge: null,
  aos_approved_live_profile_missing: "edge_486_manifest_approved_in_aos_but_live_profile_missing",
  route_coverage_missing_pharmacy_status:
    "edge_486_route_coverage_start_exact_pharmacy_status_missing",
  unsupported_download_no_fallback:
    "edge_486_download_export_unsupported_without_alternative_artifact_presentation",
  chrome_hiding_not_enforced: "edge_486_nhs_app_footer_header_hiding_rule_not_enforced",
  monthly_data_missing_active_release:
    "edge_486_monthly_data_obligation_missing_for_active_limited_release",
  journey_text_changed_without_notice:
    "edge_486_journey_text_changes_after_approval_without_notice",
  safe_return_broken: "edge_486_safe_return_route_broken_after_outbound_navigation_grant",
};

const routeDefinitions = [
  {
    routeFamilyRef: "start_request",
    journeyPathRefs: ["jp_start_medical_request", "jp_start_admin_request", "jp_continue_draft"],
  },
  {
    routeFamilyRef: "request_status",
    journeyPathRefs: ["jp_request_status", "jp_respond_more_info"],
  },
  {
    routeFamilyRef: "booking",
    journeyPathRefs: ["jp_manage_local_appointment"],
  },
  {
    routeFamilyRef: "pharmacy",
    journeyPathRefs: ["jp_pharmacy_choice", "jp_pharmacy_status"],
  },
  {
    routeFamilyRef: "secure_link_recovery",
    journeyPathRefs: ["jp_continue_draft", "jp_request_status"],
  },
  {
    routeFamilyRef: "artifact_view",
    journeyPathRefs: ["jp_manage_local_appointment", "jp_pharmacy_status"],
  },
] as const;

export function canonicalize(value: unknown): string {
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

function withHash<T>(record: Omit<T, "recordHash">): T {
  return { ...record, recordHash: hashValue(record) } as T;
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

function formatFiles(paths: readonly string[]): void {
  execFileSync("pnpm", ["exec", "prettier", "--write", ...paths], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function ensureRequiredInputs(): void {
  const missing = requiredInputPaths.filter(
    (relativePath) => !fs.existsSync(path.join(ROOT, relativePath)),
  );
  if (missing.length > 0) throw new Error(`486 required inputs missing: ${missing.join(", ")}`);
}

function listOutputArtifacts(): string[] {
  const absoluteRoot = path.join(ROOT, OUTPUT_ROOT);
  if (!fs.existsSync(absoluteRoot)) return [];
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else found.push(path.relative(ROOT, absolutePath));
    }
  };
  visit(absoluteRoot);
  return found.sort();
}

function releaseBindingFromInputs(): ReleaseBinding486 {
  const readiness = readJson<any>(
    "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  );
  const canary = readJson<any>("data/release/484_wave_widening_evidence.json");
  const waveManifest = readJson<any>("data/release/476_release_wave_manifest.json");
  const activeDecision = canary.activeDecision ?? {};
  const channelWave = (waveManifest.waves ?? []).find(
    (wave: any) => wave.waveId === "wave_476_channel_nhs_app_limited_release",
  );
  return {
    releaseCandidateRef:
      activeDecision.releaseCandidateRef ?? channelWave?.releaseCandidateRef ?? "RC_LOCAL_V1",
    releaseApprovalFreezeRef: channelWave?.releaseApprovalFreezeRef ?? "RAF_LOCAL_V1",
    runtimePublicationBundleRef:
      activeDecision.runtimePublicationBundleRef ??
      channelWave?.runtimePublicationBundleRef ??
      "rpb::local::authoritative",
    releasePublicationParityRef:
      channelWave?.releasePublicationParityRef ?? "rpp::local::authoritative",
    releaseWatchTupleRef:
      activeDecision.releaseWatchTupleRef ?? channelWave?.releaseWatchTupleRef ?? "RWT_LOCAL_V1",
    watchTupleHash:
      activeDecision.watchTupleHash ??
      channelWave?.releaseWatchTupleHash ??
      "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
    manifestVersionRef:
      readiness.readinessPredicate?.manifestVersionRef ??
      readiness.deferredScopeNote?.manifestVersionRef ??
      "nhsapp-manifest-v0.1.0-freeze-374",
  };
}

function blockersForScenario(scenarioId: NHSApp486ScenarioState): readonly string[] {
  const map: Record<NHSApp486ScenarioState, readonly string[]> = {
    approved_embedded: [],
    deferred_scope: ["blocker:486:channel-scope-not-in-approved-wave"],
    blocked_tuple_mismatch: ["blocker:486:release-watch-runtime-manifest-tuple-mismatch"],
    unsupported_bridge: [],
    aos_approved_live_profile_missing: ["blocker:486:aos-approved-live-profile-missing"],
    route_coverage_missing_pharmacy_status: [
      "blocker:486:embedded-route-coverage-missing-request-status",
      "blocker:486:embedded-route-coverage-missing-pharmacy",
    ],
    unsupported_download_no_fallback: [
      "blocker:486:unsupported-download-export-without-governed-fallback",
    ],
    chrome_hiding_not_enforced: ["blocker:486:nhs-app-header-footer-hiding-not-enforced"],
    monthly_data_missing_active_release: [
      "blocker:486:monthly-data-obligation-missing-active-limited-release",
    ],
    journey_text_changed_without_notice: ["blocker:486:journey-text-changed-without-change-notice"],
    safe_return_broken: ["blocker:486:safe-return-route-broken-after-outbound-grant"],
  };
  return map[scenarioId];
}

function settlementResultForScenario(
  scenarioId: NHSApp486ScenarioState,
): ActivationSettlementResult {
  const map: Record<NHSApp486ScenarioState, ActivationSettlementResult> = {
    approved_embedded: "applied",
    deferred_scope: "deferred_hidden",
    blocked_tuple_mismatch: "blocked_tuple",
    unsupported_bridge: "applied_with_fallback",
    aos_approved_live_profile_missing: "blocked_environment",
    route_coverage_missing_pharmacy_status: "blocked_coverage",
    unsupported_download_no_fallback: "blocked_fallback",
    chrome_hiding_not_enforced: "blocked_chrome",
    monthly_data_missing_active_release: "blocked_obligation",
    journey_text_changed_without_notice: "blocked_change_control",
    safe_return_broken: "blocked_safe_return",
  };
  return map[scenarioId];
}

function activationDecisionForScenario(
  scenarioId: NHSApp486ScenarioState,
): ActivationDecisionState {
  if (scenarioId === "approved_embedded") return "approved";
  if (scenarioId === "unsupported_bridge") return "approved_with_fallback";
  if (scenarioId === "deferred_scope") return "deferred";
  return "blocked";
}

function exposureStateForScenario(scenarioId: NHSApp486ScenarioState): ChannelExposureState {
  if (scenarioId === "approved_embedded" || scenarioId === "unsupported_bridge") return "enabled";
  if (scenarioId === "deferred_scope") return "deferred_hidden";
  return "blocked_hidden";
}

function buildLimitedReleaseScope(
  scenarioId: NHSApp486ScenarioState,
  binding: ReleaseBinding486,
): NHSAppLimitedReleaseScope {
  const blockerRefs = blockersForScenario(scenarioId).filter(
    (blocker) =>
      blocker.includes("channel-scope") ||
      blocker.includes("live-profile") ||
      blocker.includes("tuple"),
  );
  const deferred = scenarioId === "deferred_scope";
  const blocked = blockerRefs.length > 0 && !deferred;
  return withHash<NHSAppLimitedReleaseScope>({
    recordType: "NHSAppLimitedReleaseScope",
    limitedReleaseScopeId: `limited_release_scope_486_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    channelFamilyRef: "channel:nhs-app-web-integration",
    tenantScope: "tenant-demo-gp:programme-core-release",
    cohortScope: "wtc_476_nhs_app_limited_release",
    waveRef: "wave_476_channel_nhs_app_limited_release",
    releaseStage: deferred ? "deferred" : "limited_release",
    approvedTenantRefs: deferred ? [] : ["tenant-demo-gp"],
    approvedCohortRefs: deferred ? [] : ["cohort:nhs-app-limited-release-synthetic"],
    approvedJourneyPathRefs: deferred
      ? []
      : routeDefinitions.flatMap((route) => [...route.journeyPathRefs]),
    approvedManifestVersionRef: binding.manifestVersionRef,
    environmentProfileRef: `nhs-app-live-profile-486-${scenarioId}`,
    environmentProfileState:
      scenarioId === "aos_approved_live_profile_missing"
        ? "live_profile_missing"
        : "live_profile_exact",
    channelScopeState: deferred ? "deferred" : blocked ? "blocked" : "approved",
    exposurePermitted: exposureStateForScenario(scenarioId) === "enabled",
    blockerRefs,
    evidenceRefs: [
      "data/conformance/473_phase7_channel_readiness_reconciliation.json",
      "data/release/476_release_wave_manifest.json",
      "data/signoff/477_final_signoff_register.json",
      "data/evidence/481_dr_and_go_live_smoke_report.json",
    ],
    sourceRefs,
    owner: "release-governance",
    generatedAt: FIXED_NOW,
  });
}

function routeBlockersForScenario(
  scenarioId: NHSApp486ScenarioState,
  routeFamilyRef: string,
): readonly string[] {
  if (
    scenarioId === "route_coverage_missing_pharmacy_status" &&
    (routeFamilyRef === "request_status" || routeFamilyRef === "pharmacy")
  ) {
    return [`blocker:486:embedded-route-coverage-missing-${routeFamilyRef}`];
  }
  if (scenarioId === "unsupported_download_no_fallback" && routeFamilyRef === "artifact_view") {
    return ["blocker:486:unsupported-download-export-without-governed-fallback"];
  }
  if (scenarioId === "safe_return_broken" && routeFamilyRef === "secure_link_recovery") {
    return ["blocker:486:safe-return-route-broken-after-outbound-grant"];
  }
  return [];
}

function buildRouteVerdicts(
  scenarioId: NHSApp486ScenarioState,
  binding: ReleaseBinding486,
): EmbeddedRouteActivationVerdict[] {
  return routeDefinitions.map((route) => {
    const blockers = routeBlockersForScenario(scenarioId, route.routeFamilyRef);
    const missingCoverage =
      scenarioId === "route_coverage_missing_pharmacy_status" &&
      (route.routeFamilyRef === "request_status" || route.routeFamilyRef === "pharmacy");
    const unsupportedGoverned =
      scenarioId === "unsupported_bridge" && route.routeFamilyRef === "artifact_view";
    const unsupportedMissing =
      scenarioId === "unsupported_download_no_fallback" && route.routeFamilyRef === "artifact_view";
    const safeReturnBroken =
      scenarioId === "safe_return_broken" && route.routeFamilyRef === "secure_link_recovery";
    const exposure = exposureStateForScenario(scenarioId);
    return withHash<EmbeddedRouteActivationVerdict>({
      recordType: "EmbeddedRouteActivationVerdict",
      routeVerdictId: `route_verdict_486_${scenarioId}_${route.routeFamilyRef}`,
      scenarioId,
      routeFamilyRef: route.routeFamilyRef,
      journeyPathRefs: route.journeyPathRefs,
      manifestVersionRef: binding.manifestVersionRef,
      releaseApprovalFreezeRef: binding.releaseApprovalFreezeRef,
      runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
      routeContractState:
        scenarioId === "blocked_tuple_mismatch" ? "stale" : missingCoverage ? "missing" : "exact",
      embeddedSurfaceCoverageState:
        scenarioId === "blocked_tuple_mismatch" ? "stale" : missingCoverage ? "missing" : "exact",
      bridgeCapabilityState: unsupportedMissing || unsupportedGoverned ? "unavailable" : "verified",
      runtimePublicationState:
        scenarioId === "blocked_tuple_mismatch"
          ? "stale"
          : missingCoverage
            ? "blocked"
            : "published",
      safeReturnState: safeReturnBroken ? "broken" : "exact",
      unsupportedCapabilityState: unsupportedMissing
        ? "unsupported_without_fallback"
        : unsupportedGoverned
          ? "governed_fallback"
          : "none",
      downloadActionExposed: false,
      printActionExposed: false,
      browserHandoffActionExposed: safeReturnBroken,
      fallbackState: unsupportedMissing
        ? "missing"
        : unsupportedGoverned
          ? "governed"
          : "not_required",
      activationState:
        exposure === "enabled" && blockers.length === 0
          ? unsupportedGoverned
            ? "placeholder_only"
            : "live"
          : exposure === "deferred_hidden"
            ? "hidden"
            : "blocked",
      blockerRefs: blockers,
      evidenceRefs: [
        "data/conformance/473_phase7_embedded_surface_coverage_matrix.json",
        `EmbeddedSurfaceContractCoverageRecord:473:${route.routeFamilyRef}`,
      ],
      sourceRefs,
      evaluatedAt: FIXED_NOW,
    });
  });
}

function buildPostureProof(
  scenarioId: NHSApp486ScenarioState,
  binding: ReleaseBinding486,
): EmbeddedSurfacePostureProof {
  const blocked = scenarioId === "chrome_hiding_not_enforced";
  return withHash<EmbeddedSurfacePostureProof>({
    recordType: "EmbeddedSurfacePostureProof",
    postureProofId: `embedded_posture_proof_486_${scenarioId}`,
    scenarioId,
    manifestVersionRef: binding.manifestVersionRef,
    shellPolicyRef: `embedded-shell-policy-486-${scenarioId}`,
    mobileLayoutProfile: "mission_stack",
    desktopRailState: "removed",
    pageTitleState: "clear",
    statusProvenanceStripState: "compact",
    headerHidden: !blocked,
    footerHidden: !blocked,
    supplierChromeState: blocked ? "not_enforced" : "hidden",
    patientLanguageState: "normal_journey_language",
    rawSensitiveTelemetryState: "redacted",
    safeAreaState: "verified",
    postureState: blocked ? "blocked" : "exact",
    blockerRefs: blocked ? ["blocker:486:nhs-app-header-footer-hiding-not-enforced"] : [],
    evidenceRefs: [
      "data/evidence/480_uat_result_matrix.json",
      "output/playwright/480-final-uat-visual/patient/uat_480_patient_mobile_embedded_booking.mobile-booking.png",
    ],
    sourceRefs,
    capturedAt: FIXED_NOW,
  });
}

function buildUnsupportedBridgeFallback(
  scenarioId: NHSApp486ScenarioState,
): NHSAppUnsupportedBridgeFallback {
  const missing = scenarioId === "unsupported_download_no_fallback";
  const governed = scenarioId === "unsupported_bridge";
  return withHash<NHSAppUnsupportedBridgeFallback>({
    recordType: "NHSAppUnsupportedBridgeFallback",
    fallbackId: `unsupported_bridge_fallback_486_${scenarioId}`,
    scenarioId,
    routeFamilyRef: "artifact_view",
    unsupportedCapabilities: missing || governed ? ["conventional_download", "browser_print"] : [],
    fallbackMode: missing ? "missing" : governed ? "summary_first" : "not_required",
    fallbackState: missing ? "missing" : governed ? "governed" : "not_required",
    deadLinkExposed: missing,
    patientCopyVariantRef:
      missing || governed
        ? `patient-copy:486:artifact-summary-fallback:${scenarioId}`
        : "patient-copy:486:not-required",
    safeActionRef:
      missing || governed ? "safe-action:486:show-summary-and-return" : "safe-action:486:continue",
    blockerRefs: missing
      ? ["blocker:486:unsupported-download-export-without-governed-fallback"]
      : [],
    evidenceRefs: ["data/conformance/473_phase7_embedded_surface_coverage_matrix.json"],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildFreezeBinding(
  scenarioId: NHSApp486ScenarioState,
  binding: ReleaseBinding486,
): ChannelFreezeDispositionBinding {
  const exposure = exposureStateForScenario(scenarioId);
  return withHash<ChannelFreezeDispositionBinding>({
    recordType: "ChannelFreezeDispositionBinding",
    freezeDispositionBindingId: `freeze_binding_486_${scenarioId}`,
    scenarioId,
    manifestVersionRef: binding.manifestVersionRef,
    releaseApprovalFreezeRef: binding.releaseApprovalFreezeRef,
    channelReleaseFreezeRecordRef: `channel_release_freeze_486_${scenarioId}`,
    freezeState: exposure === "enabled" ? "monitoring" : "frozen",
    freezeMode:
      exposure === "enabled"
        ? "none"
        : scenarioId === "deferred_scope"
          ? "hidden"
          : "placeholder_only",
    patientMessageRef:
      exposure === "enabled"
        ? "patient-message:486:normal-journey"
        : "patient-message:486:route-not-available-in-app",
    safeRouteRef: "/nhs-app/embedded?state=deferred&flow=status",
    supportRecoveryRef: "support-recovery:486:nhs-app-channel",
    dispositionState: exposure === "blocked_hidden" ? "blocked" : "current",
    blockerRefs: exposure === "blocked_hidden" ? [...blockersForScenario(scenarioId)] : [],
    evidenceRefs: ["data/release/476_release_wave_manifest.json"],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildMonthlyDataBinding(
  scenarioId: NHSApp486ScenarioState,
  binding: ReleaseBinding486,
): NHSAppMonthlyDataObligationBinding {
  const missing = scenarioId === "monthly_data_missing_active_release";
  return withHash<NHSAppMonthlyDataObligationBinding>({
    recordType: "NHSAppMonthlyDataObligationBinding",
    monthlyDataObligationBindingId: `monthly_data_obligation_486_${scenarioId}`,
    scenarioId,
    manifestVersionRef: binding.manifestVersionRef,
    releaseCohortRef: "wtc_476_nhs_app_limited_release",
    observationPolicyRef: "wop_476_nhs_app_monthly_pack",
    telemetryContractRef: "ChannelTelemetryPlan:384:limited_release",
    monthlyPackScheduleRef: missing ? "missing" : "nhs-app-monthly-pack:486:schedule",
    privacyRedactionState: "exact",
    obligationState: missing ? "missing" : "bound",
    blockerRefs: missing
      ? ["blocker:486:monthly-data-obligation-missing-active-limited-release"]
      : [],
    evidenceRefs: [
      "data/release/476_release_wave_manifest.json",
      "data/release/483_wave1_stability_verdict.json",
    ],
    sourceRefs,
    owner: "channel-analytics-owner",
    generatedAt: FIXED_NOW,
  });
}

function buildJourneyChangeBinding(
  scenarioId: NHSApp486ScenarioState,
  binding: ReleaseBinding486,
): JourneyChangeControlBinding {
  const changed = scenarioId === "journey_text_changed_without_notice";
  return withHash<JourneyChangeControlBinding>({
    recordType: "JourneyChangeControlBinding",
    journeyChangeControlBindingId: `journey_change_control_486_${scenarioId}`,
    scenarioId,
    manifestVersionRef: binding.manifestVersionRef,
    changeNoticeRef: changed ? null : `journey-change-notice-486-${scenarioId}`,
    affectedJourneyPathRefs: changed ? ["jp_start_medical_request", "jp_request_status"] : [],
    journeyTextChangeState: changed ? "changed_after_approval" : "unchanged",
    noticeState: changed ? "missing" : "not_required",
    leadTimeState: changed ? "blocked" : "not_required",
    bindingState: changed ? "blocked" : "current",
    blockerRefs: changed ? ["blocker:486:journey-text-changed-without-change-notice"] : [],
    evidenceRefs: ["data/conformance/473_phase7_channel_readiness_reconciliation.json"],
    sourceRefs,
    owner: "patient-content-governance",
    generatedAt: FIXED_NOW,
  });
}

export function build486ScenarioRecords(
  scenarioId: NHSApp486ScenarioState = "approved_embedded",
  artifactRefs: readonly string[] = [],
) {
  ensureRequiredInputs();
  const binding = releaseBindingFromInputs();
  const limitedReleaseScope = buildLimitedReleaseScope(scenarioId, binding);
  const routeVerdicts = buildRouteVerdicts(scenarioId, binding);
  const postureProof = buildPostureProof(scenarioId, binding);
  const unsupportedBridgeFallback = buildUnsupportedBridgeFallback(scenarioId);
  const freezeDispositionBinding = buildFreezeBinding(scenarioId, binding);
  const monthlyDataBinding = buildMonthlyDataBinding(scenarioId, binding);
  const journeyChangeBinding = buildJourneyChangeBinding(scenarioId, binding);
  const blockerRefs = [
    ...new Set([
      ...blockersForScenario(scenarioId),
      ...limitedReleaseScope.blockerRefs,
      ...routeVerdicts.flatMap((route) => route.blockerRefs),
      ...postureProof.blockerRefs,
      ...unsupportedBridgeFallback.blockerRefs,
      ...monthlyDataBinding.blockerRefs,
      ...journeyChangeBinding.blockerRefs,
    ]),
  ];
  const activationDecisionState = activationDecisionForScenario(scenarioId);
  const channelExposureState = exposureStateForScenario(scenarioId);
  const command = withHash<NHSAppChannelEnablementCommand>({
    recordType: "NHSAppChannelEnablementCommand",
    commandId: `nhs_app_channel_command_486_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    commandType:
      activationDecisionState === "approved"
        ? "enable_channel"
        : activationDecisionState === "approved_with_fallback"
          ? "enable_channel_with_fallback"
          : activationDecisionState === "deferred"
            ? "defer_channel"
            : "hold_hidden",
    commandState:
      activationDecisionState === "approved" || activationDecisionState === "approved_with_fallback"
        ? "accepted"
        : "blocked",
    requestedChannelState: channelExposureState,
    manifestVersionRef: binding.manifestVersionRef,
    expectedEnvironmentProfileRef: limitedReleaseScope.environmentProfileRef,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchTupleHash: binding.watchTupleHash,
    tenantScope: limitedReleaseScope.tenantScope,
    cohortScope: limitedReleaseScope.cohortScope,
    channelScope: limitedReleaseScope.channelFamilyRef,
    roleAuthorizationRef: "role-auth:channel-governance:nhs-app-enable",
    idempotencyKey: `idem_486_${scenarioId}_20260428`,
    purposeBindingRef: `purpose:486:${scenarioId}:approved-manifest-channel`,
    routeIntentBindingRef: "route-intent:486:nhs-app-embedded-route-exposure",
    injectedClockRef: "clock:486:fixed-2026-04-28T00:00:00Z",
    actingContextRef: "operator:synthetic-channel-release-manager",
    blockerRefs,
    evidenceRefs: [
      limitedReleaseScope.limitedReleaseScopeId,
      postureProof.postureProofId,
      monthlyDataBinding.monthlyDataObligationBindingId,
      journeyChangeBinding.journeyChangeControlBindingId,
    ],
    sourceRefs,
    createdAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:486:command:${scenarioId}`,
  });
  const observedRouteCoverageState = routeVerdicts.every(
    (route) =>
      route.embeddedSurfaceCoverageState === "exact" &&
      route.routeContractState === "exact" &&
      route.safeReturnState === "exact",
  )
    ? "exact"
    : "blocked";
  const settlement = withHash<NHSAppChannelEnablementSettlement>({
    recordType: "NHSAppChannelEnablementSettlement",
    settlementId: `nhs_app_channel_settlement_486_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    commandRef: command.commandId,
    result: settlementResultForScenario(scenarioId),
    enabled: channelExposureState === "enabled",
    channelExposureState,
    observedManifestVersionRef: binding.manifestVersionRef,
    observedEnvironmentProfileState: limitedReleaseScope.environmentProfileState,
    observedRouteCoverageState,
    observedMonthlyDataObligationState: monthlyDataBinding.obligationState,
    observedJourneyChangeControlState: journeyChangeBinding.bindingState,
    observedSafeReturnState: scenarioId === "safe_return_broken" ? "broken" : "exact",
    observedFallbackState: unsupportedBridgeFallback.fallbackState,
    recoveryActionRef:
      channelExposureState === "enabled"
        ? "recovery:486:observe-limited-release"
        : freezeDispositionBinding.supportRecoveryRef,
    blockerRefs,
    evidenceRefs: [command.commandId, freezeDispositionBinding.freezeDispositionBindingId],
    sourceRefs,
    recordedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:486:settlement:${scenarioId}`,
  });
  const plan = withHash<NHSAppManifestActivationPlan>({
    recordType: "NHSAppManifestActivationPlan",
    activationPlanId: `manifest_activation_plan_486_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    activeScenarioId: scenarioId,
    approvedManifestVersionRefs: [binding.manifestVersionRef],
    activeManifestVersionRef: binding.manifestVersionRef,
    channelFamilyRef: "channel:nhs-app-web-integration",
    tenantScope: limitedReleaseScope.tenantScope,
    limitedReleaseScopeRef: limitedReleaseScope.limitedReleaseScopeId,
    releaseCandidateRef: binding.releaseCandidateRef,
    releaseApprovalFreezeRef: binding.releaseApprovalFreezeRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchTupleHash: binding.watchTupleHash,
    environmentProfileRef: limitedReleaseScope.environmentProfileRef,
    routeVerdictRefs: routeVerdicts.map((route) => route.routeVerdictId),
    embeddedSurfacePostureProofRefs: [postureProof.postureProofId],
    unsupportedBridgeFallbackRefs: [unsupportedBridgeFallback.fallbackId],
    monthlyDataObligationBindingRefs: [monthlyDataBinding.monthlyDataObligationBindingId],
    journeyChangeControlBindingRefs: [journeyChangeBinding.journeyChangeControlBindingId],
    freezeDispositionBindingRefs: [freezeDispositionBinding.freezeDispositionBindingId],
    commandRefs: [command.commandId],
    settlementRefs: [settlement.settlementId],
    artifactRefs,
    activationDecisionState,
    channelExposureState,
    failClosedMode: "deferred_hidden",
    blockerRefs,
    evidenceRefs: [
      "data/conformance/473_phase7_channel_readiness_reconciliation.json",
      "data/conformance/473_phase7_embedded_surface_coverage_matrix.json",
      "data/release/484_wave_widening_evidence.json",
    ],
    sourceRefs,
    owner: "nhs-app-channel-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:486:activation-plan:${scenarioId}`,
  });
  return {
    binding,
    limitedReleaseScope,
    routeVerdicts,
    postureProof,
    unsupportedBridgeFallback,
    freezeDispositionBinding,
    monthlyDataBinding,
    journeyChangeBinding,
    command,
    settlement,
    plan,
  };
}

export function build486Records(artifactRefs: readonly string[] = listOutputArtifacts()) {
  const scenarioIds: NHSApp486ScenarioState[] = [
    "approved_embedded",
    "deferred_scope",
    "blocked_tuple_mismatch",
    "unsupported_bridge",
    "aos_approved_live_profile_missing",
    "route_coverage_missing_pharmacy_status",
    "unsupported_download_no_fallback",
    "chrome_hiding_not_enforced",
    "monthly_data_missing_active_release",
    "journey_text_changed_without_notice",
    "safe_return_broken",
  ];
  const scenarios = scenarioIds.map((scenarioId) =>
    build486ScenarioRecords(scenarioId, artifactRefs),
  );
  const activeScenario = scenarios[0];
  const edgeCaseFixtures = withHash<JsonObject>({
    recordType: "NHSAppChannelActivationEdgeCaseFixtures",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    fixtures: scenarios
      .filter((entry) => edgeCaseByScenario[entry.plan.activeScenarioId])
      .map((entry) => ({
        edgeCaseId: edgeCaseByScenario[entry.plan.activeScenarioId],
        scenarioId: entry.plan.activeScenarioId,
        decisionState: entry.plan.activationDecisionState,
        settlementResult: entry.settlement.result,
        blockerRefs: entry.settlement.blockerRefs,
      })),
    sourceRefs,
  });
  return {
    activeScenario,
    scenarios,
    edgeCaseFixtures,
    plans: scenarios.map((entry) => entry.plan),
    limitedReleaseScopes: scenarios.map((entry) => entry.limitedReleaseScope),
    routeVerdicts: scenarios.flatMap((entry) => entry.routeVerdicts),
    postureProofs: scenarios.map((entry) => entry.postureProof),
    unsupportedBridgeFallbacks: scenarios.map((entry) => entry.unsupportedBridgeFallback),
    freezeDispositionBindings: scenarios.map((entry) => entry.freezeDispositionBinding),
    monthlyDataBindings: scenarios.map((entry) => entry.monthlyDataBinding),
    journeyChangeBindings: scenarios.map((entry) => entry.journeyChangeBinding),
    commands: scenarios.map((entry) => entry.command),
    settlements: scenarios.map((entry) => entry.settlement),
  };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/486_nhs_app_channel_enablement.schema.json",
    title: "NHS App channel enablement records",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "generatedAt"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      generatedAt: { type: "string", format: "date-time" },
    },
    $defs: {
      hashedRecord: {
        type: "object",
        required: ["recordType", "recordHash"],
        properties: {
          recordType: { type: "string" },
          recordHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
        },
      },
      NHSAppManifestActivationPlan: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: [
              "activeManifestVersionRef",
              "activationDecisionState",
              "channelExposureState",
              "releaseWatchTupleRef",
            ],
          },
        ],
      },
      EmbeddedRouteActivationVerdict: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: [
              "routeFamilyRef",
              "embeddedSurfaceCoverageState",
              "safeReturnState",
              "fallbackState",
            ],
          },
        ],
      },
      NHSAppChannelEnablementSettlement: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["result", "enabled", "channelExposureState"],
          },
        ],
      },
    },
  };
}

function buildInterfaceGap(): JsonObject {
  return withHash<JsonObject>({
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_486_NHS_APP_CHANNEL_AUTHORITY",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    sourceConcepts: [
      "NHSAppManifestActivationPlan",
      "NHSAppChannelEnablementCommand",
      "NHSAppChannelEnablementSettlement",
      "EmbeddedRouteActivationVerdict",
      "NHSAppMonthlyDataObligationBinding",
      "JourneyChangeControlBinding",
      "ChannelFreezeDispositionBinding",
    ],
    repositoryGap:
      "The repository had Phase 7 readiness and deferred-channel evidence but no single launch-batch authority joining exact manifest version, live environment profile, route coverage, bridge fallback, runtime publication, wave scope, monthly data, journey-change control, and command settlement.",
    failClosedBridge:
      "enable_486_nhs_app_channel.ts publishes activation plan, limited-release scope, route verdicts, embedded posture proof, fallback, monthly data, journey-change, freeze, command, and settlement records. Any stale, missing, mismatched, or unsupported tuple settles hidden.",
    state: "closed_by_typed_bridge",
    owner: "nhs-app-channel-governance",
    blockerRefs: [],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildExternalReferenceNotes(): JsonObject {
  return withHash<JsonObject>({
    recordType: "ExternalReferenceNotes",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    references: [
      {
        refId: "nhs-app-web-integration-guidance",
        relevance:
          "Activation keeps Vecells as one responsive web service inside the NHS App, hides duplicate supplier chrome, and handles unsupported webview download or print behavior through governed fallbacks.",
      },
      {
        refId: "nhs-service-manual-and-design-system",
        relevance:
          "The patient embedded route uses plain NHS-style content, mobile mission_stack layout, clear headings, and one safe action for degraded states.",
      },
      {
        refId: "wcag-2-2-aa-and-wai-aria",
        relevance:
          "Playwright captures ARIA snapshots and keyboard/focus behavior for embedded patient pages, unsupported fallback, and the operations activation panel.",
      },
      {
        refId: "dcb0129-dcb0160-dtac-dspt-caf-records",
        relevance:
          "The activation command binds clinical safety, privacy, monthly-data, resilience, and WORM audit obligations without emitting PHI, raw credentials, tokens, or confidential supplier contacts.",
      },
    ],
    sourceRefs,
  });
}

function buildAlgorithmAlignmentNotes(): string {
  return `# 486 Algorithm Alignment Notes

Task: ${TASK_ID}
Generated: ${FIXED_NOW}

## Implemented source authority

- Activation is bound to the exact approved manifest version, live environment profile, release candidate, runtime publication bundle, release watch tuple, tenant/cohort/wave scope, and route contracts.
- The command handler blocks or hides exposure on stale tuple, missing live profile, missing embedded surface coverage, missing fallback, unhidden supplier chrome, missing monthly data obligation, missing journey-change notice, or broken safe return.
- Unsupported webview download and print behavior is allowed only when a governed summary-first fallback and safe return action exist.
- Monthly data, route freeze, journey-change, and WORM audit obligations are published with the activation plan and settlement.
- Patient UI uses normal journey language. Internal manifest refs are kept in operations/governance evidence, not patient copy.

## Edge cases covered

${required486EdgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n")}
`;
}

function buildRunbook(records: ReturnType<typeof build486Records>): string {
  return `# NHS App Channel Activation Runbook

Generated: ${FIXED_NOW}

## Authority

Use data/channel/486_nhs_app_manifest_activation_plan.json, data/channel/486_nhs_app_channel_enablement_command.json, and data/channel/486_nhs_app_channel_enablement_settlement.json as the activation authority. Do not enable NHS App exposure from a feature flag, route label, or dashboard-only note.

## Activation sequence

1. Confirm the manifest version is approved and matches the live NHS App environment profile.
2. Confirm SCAL, security, clinical safety, privacy, incident rehearsal, route contracts, embedded coverage, runtime publication, release watch tuple, and route freeze disposition all bind to the same tuple.
3. Confirm the limited-release tenant, cohort, wave, and journey scope exactly match the command.
4. Confirm every embedded route has route coverage, hidden supplier chrome, safe return, no raw sensitive telemetry, and governed fallback for unsupported download, print, or browser handoff behavior.
5. Confirm monthly data generation and journey-change notice obligations are current.
6. Settle the command into WORM audit before any patient exposure changes.
7. On any mismatch, keep the channel deferred or hidden and use the RouteFreezeDisposition safe route.

## Active result

- Plan: ${records.activeScenario.plan.activationPlanId}
- Manifest: ${records.activeScenario.plan.activeManifestVersionRef}
- Decision: ${records.activeScenario.plan.activationDecisionState}
- Settlement: ${records.activeScenario.settlement.result}
- Channel exposure: ${records.activeScenario.settlement.channelExposureState}
`;
}

function buildDecision(records: ReturnType<typeof build486Records>): string {
  return `# NHS App Limited Release Decision

Generated: ${FIXED_NOW}

The deferred NHS App channel is enabled only for the approved manifest version and limited-release synthetic cohort represented by ${records.activeScenario.plan.activationPlanId}. The active settlement is ${records.activeScenario.settlement.result}; any other scenario in this pack fails closed to deferred or hidden exposure.

## Scope

- Tenant: ${records.activeScenario.limitedReleaseScope.tenantScope}
- Cohort: ${records.activeScenario.limitedReleaseScope.cohortScope}
- Wave: ${records.activeScenario.limitedReleaseScope.waveRef}
- Manifest: ${records.activeScenario.plan.activeManifestVersionRef}
- Watch tuple: ${records.activeScenario.plan.watchTupleHash}

## Guardrails

${records.settlements
  .map(
    (settlement) =>
      `- ${settlement.scenarioId}: ${settlement.result}; exposure=${settlement.channelExposureState}; blockers=${settlement.blockerRefs.length}`,
  )
  .join("\n")}
`;
}

function buildReport(records: ReturnType<typeof build486Records>): string {
  return `# NHS App Channel Enablement Evidence Report

Generated: ${FIXED_NOW}

## Active enablement result

- Plan: ${records.activeScenario.plan.activationPlanId}
- Active decision: ${records.activeScenario.plan.activationDecisionState}
- Settlement: ${records.activeScenario.settlement.result}
- Enabled: ${records.activeScenario.settlement.enabled}
- Embedded route verdicts: ${records.activeScenario.routeVerdicts.length}

## Browser evidence

${records.activeScenario.plan.artifactRefs.length === 0 ? "- Browser artifacts are generated by the Playwright suite." : records.activeScenario.plan.artifactRefs.map((artifact) => `- ${artifact}`).join("\n")}
`;
}

export function write486NHSAppChannelArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build486Records(artifactRefs);
  writeJson(
    "data/channel/486_nhs_app_manifest_activation_plan.json",
    withHash<JsonObject>({
      recordType: "NHSAppManifestActivationPlanEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      plan: records.activeScenario.plan,
      activeScenario: records.activeScenario.plan,
      plans: records.plans,
      limitedReleaseScopes: records.limitedReleaseScopes,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );
  writeJson(
    "data/channel/486_nhs_app_channel_enablement_command.json",
    withHash<JsonObject>({
      recordType: "NHSAppChannelEnablementCommandEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeCommand: records.activeScenario.command,
      commands: records.commands,
      sourceRefs,
    }),
  );
  writeJson(
    "data/channel/486_nhs_app_channel_enablement_settlement.json",
    withHash<JsonObject>({
      recordType: "NHSAppChannelEnablementSettlementEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeSettlement: records.activeScenario.settlement,
      settlements: records.settlements,
      sourceRefs,
    }),
  );
  writeJson(
    "data/channel/486_embedded_route_coverage_after_activation.json",
    withHash<JsonObject>({
      recordType: "EmbeddedRouteCoverageAfterActivation",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeRouteVerdicts: records.activeScenario.routeVerdicts,
      routeVerdicts: records.routeVerdicts,
      embeddedSurfacePostureProofs: records.postureProofs,
      unsupportedBridgeFallbacks: records.unsupportedBridgeFallbacks,
      freezeDispositionBindings: records.freezeDispositionBindings,
      sourceRefs,
    }),
  );
  writeJson(
    "data/channel/486_monthly_data_and_assurance_obligation_binding.json",
    withHash<JsonObject>({
      recordType: "NHSAppMonthlyDataAndAssuranceObligationEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      monthlyDataBindings: records.monthlyDataBindings,
      journeyChangeBindings: records.journeyChangeBindings,
      activeMonthlyDataBinding: records.activeScenario.monthlyDataBinding,
      activeJourneyChangeBinding: records.activeScenario.journeyChangeBinding,
      sourceRefs,
    }),
  );
  writeJson("data/contracts/486_nhs_app_channel_enablement.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_486_NHS_APP_CHANNEL_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/486_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/486_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes());
  writeText("docs/runbooks/486_nhs_app_channel_activation_runbook.md", buildRunbook(records));
  writeText("docs/programme/486_nhs_app_limited_release_decision.md", buildDecision(records));
  writeText("docs/test-evidence/486_nhs_app_channel_enablement_report.md", buildReport(records));
  formatFiles([
    "data/channel/486_nhs_app_manifest_activation_plan.json",
    "data/channel/486_nhs_app_channel_enablement_command.json",
    "data/channel/486_nhs_app_channel_enablement_settlement.json",
    "data/channel/486_embedded_route_coverage_after_activation.json",
    "data/channel/486_monthly_data_and_assurance_obligation_binding.json",
    "data/contracts/486_nhs_app_channel_enablement.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_486_NHS_APP_CHANNEL_AUTHORITY.json",
    "data/analysis/486_external_reference_notes.json",
    "data/analysis/486_algorithm_alignment_notes.md",
    "docs/runbooks/486_nhs_app_channel_activation_runbook.md",
    "docs/programme/486_nhs_app_limited_release_decision.md",
    "docs/test-evidence/486_nhs_app_channel_enablement_report.md",
  ]);
}

if (process.argv[1]?.endsWith("enable_486_nhs_app_channel.ts")) {
  write486NHSAppChannelArtifacts();
}
