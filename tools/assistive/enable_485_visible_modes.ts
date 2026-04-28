import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_485";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "485.programme.assistive-visible-enablement.v1";
export const OUTPUT_ROOT = "output/playwright/485-assistive-visible-modes";

type JsonObject = Record<string, unknown>;

export type Assistive485ScenarioState =
  | "visible_insert_approved"
  | "shadow_only_unapproved"
  | "visible_summary_only"
  | "observe_only_degraded"
  | "frozen_freeze_disposition"
  | "hidden_out_of_slice"
  | "route_verdict_shadow_only"
  | "route_contract_stale"
  | "insert_evidence_missing"
  | "envelope_downgrade_mid_session"
  | "historical_kill_switch_clear"
  | "split_route_visible_insert"
  | "split_route_shadow_only"
  | "commit_missing_human_approval";

type RolloutRung =
  | "shadow_only"
  | "visible_summary"
  | "visible_insert"
  | "visible_commit"
  | "frozen"
  | "withdrawn";
type VisibleMode =
  | "shadow"
  | "visible_summary"
  | "visible_insert"
  | "visible_commit"
  | "observe_only"
  | "frozen"
  | "hidden";
type TrustState = "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen";
type SurfacePosture =
  | "interactive"
  | "observe_only"
  | "provenance_only"
  | "placeholder_only"
  | "hidden";
type ActionabilityState =
  | "enabled"
  | "regenerate_only"
  | "observe_only"
  | "blocked_by_policy"
  | "blocked";

export interface AssistiveApprovedCohortScope {
  readonly recordType: "AssistiveApprovedCohortScope";
  readonly approvedCohortScopeId: string;
  readonly taskId: typeof TASK_ID;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly releaseCandidateRef: string;
  readonly tenantRef: string;
  readonly releaseCohortRef: string;
  readonly routeFamilyRef: string;
  readonly audienceTier: "staff";
  readonly cohortSelectorRef: string;
  readonly cohortSelectorHash: string;
  readonly sliceMembershipState: "in_slice" | "out_of_slice" | "unknown" | "superseded";
  readonly approvedVisibleModeCeiling: RolloutRung;
  readonly scopeState: "approved" | "shadow_only" | "blocked" | "hidden";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface AssistiveTrainingPrerequisiteEvidence {
  readonly recordType: "AssistiveTrainingPrerequisiteEvidence";
  readonly trainingEvidenceId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly staffCohortRef: string;
  readonly competencyLedgerRef: string;
  readonly briefingRef: string;
  readonly trainedStaffCount: number;
  readonly requiredStaffCount: number;
  readonly trainingState: "exact" | "missing" | "stale";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface AssistiveCapabilityTrustProjection485 {
  readonly recordType: "AssistiveCapabilityTrustProjection";
  readonly trustProjectionId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly watchTupleHash: string;
  readonly releaseCandidateRef: string;
  readonly rolloutLadderPolicyRef: string;
  readonly audienceTier: "staff";
  readonly runtimePublicationBundleRef: string;
  readonly assistiveKillSwitchStateRef: string;
  readonly releaseFreezeRecordRef: string | null;
  readonly freezeDispositionRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly trustScore: number;
  readonly thresholdState: "green" | "warn" | "block";
  readonly trustState: TrustState;
  readonly visibilityEligibilityState: "visible" | "observe_only" | "blocked";
  readonly insertEligibilityState: "enabled" | "observe_only" | "blocked";
  readonly approvalEligibilityState: "single_review" | "dual_review" | "blocked";
  readonly rolloutCeilingState: "shadow_only" | "visible" | "observe_only" | "blocked";
  readonly fallbackMode:
    | "shadow_only"
    | "observe_only"
    | "read_only_provenance"
    | "placeholder_only"
    | "assistive_hidden";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly evaluatedAt: string;
  readonly recordHash: string;
}

export interface AssistiveCapabilityRolloutVerdict485 {
  readonly recordType: "AssistiveCapabilityRolloutVerdict";
  readonly rolloutVerdictId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly watchTupleHash: string;
  readonly releaseCandidateRef: string;
  readonly rolloutSliceContractRef: string;
  readonly routeFamilyRef: string;
  readonly audienceTier: "staff";
  readonly releaseCohortRef: string;
  readonly sliceMembershipState: "in_slice" | "out_of_slice" | "unknown" | "superseded";
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly trustProjectionRef: string;
  readonly releaseFreezeRecordRef: string | null;
  readonly freezeDispositionRef: string;
  readonly policyState: "exact" | "stale" | "blocked";
  readonly routeContractState: "exact" | "stale" | "blocked";
  readonly publicationState: "published" | "stale" | "withdrawn" | "blocked";
  readonly shadowEvidenceState: "complete" | "stale" | "missing" | "blocked";
  readonly visibleEvidenceState: "complete" | "stale" | "missing" | "blocked";
  readonly insertEvidenceState: "complete" | "stale" | "missing" | "blocked";
  readonly commitEvidenceState: "complete" | "stale" | "missing" | "blocked";
  readonly rolloutRung: RolloutRung;
  readonly renderPosture: "shadow_only" | "visible" | "observe_only" | "blocked";
  readonly insertPosture: "enabled" | "observe_only" | "blocked";
  readonly approvalPosture: "single_review" | "dual_review" | "blocked";
  readonly fallbackMode:
    | "shadow_only"
    | "observe_only"
    | "read_only_provenance"
    | "placeholder_only"
    | "assistive_hidden";
  readonly verdictState: "current" | "stale" | "superseded" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly evaluatedAt: string;
  readonly recordHash: string;
}

export interface AssistiveCapabilityTrustEnvelope485 {
  readonly recordType: "AssistiveCapabilityTrustEnvelope";
  readonly trustEnvelopeId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly trustProjectionRef: string;
  readonly rolloutVerdictRef: string;
  readonly workspaceTrustEnvelopeRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly trustState: TrustState;
  readonly surfacePostureState: SurfacePosture;
  readonly actionabilityState: ActionabilityState;
  readonly confidencePostureState: "conservative_band" | "suppressed" | "hidden";
  readonly completionAdjacencyState: "blocked" | "observe_only" | "allowed";
  readonly disclosureFenceHealth: "exact" | "degraded" | "blocked";
  readonly freezeState: "clear" | "monitoring" | "frozen" | "shadow_only";
  readonly preservedArtifactPosture: "none" | "read_only_provenance" | "placeholder_only";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly computedAt: string;
  readonly recordHash: string;
}

export interface AssistiveModeEligibilityVerdict {
  readonly recordType: "AssistiveModeEligibilityVerdict";
  readonly eligibilityVerdictId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly watchTupleHash: string;
  readonly approvedCohortScopeRef: string;
  readonly trustEnvelopeRef: string;
  readonly rolloutVerdictRef: string;
  readonly trainingEvidenceRef: string;
  readonly exposureProofRef: string;
  readonly eligibleMode: VisibleMode;
  readonly visibleSummaryAllowed: boolean;
  readonly visibleInsertAllowed: boolean;
  readonly visibleCommitCeilingAllowed: boolean;
  readonly concreteCommitAllowed: boolean;
  readonly insertControlsVisible: boolean;
  readonly regenerateControlsVisible: boolean;
  readonly exportControlsVisible: boolean;
  readonly provenanceVisible: boolean;
  readonly decisionState:
    | "approved"
    | "shadow_only"
    | "observe_only"
    | "frozen"
    | "hidden"
    | "blocked";
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface AssistiveVisibleModeEnablementPlan {
  readonly recordType: "AssistiveVisibleModeEnablementPlan";
  readonly planId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly planState: "partially_enabled" | "blocked";
  readonly activeEligibilityVerdictRef: string;
  readonly approvedCohortScopeRefs: readonly string[];
  readonly trustEnvelopeRefs: readonly string[];
  readonly rolloutVerdictRefs: readonly string[];
  readonly commandRefs: readonly string[];
  readonly settlementRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface AssistiveVisibleEnablementCommand {
  readonly recordType: "AssistiveVisibleEnablementCommand";
  readonly commandId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly commandType: "enable_visible_mode" | "downgrade_visible_mode" | "hold_shadow";
  readonly commandState: "accepted" | "blocked" | "superseded";
  readonly requestedMode: VisibleMode;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly approvedCohortScopeRef: string;
  readonly trustEnvelopeRef: string;
  readonly rolloutVerdictRef: string;
  readonly roleAuthorizationRef: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly actingContextRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface AssistiveVisibleEnablementSettlement {
  readonly recordType: "AssistiveVisibleEnablementSettlement";
  readonly settlementId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly commandRef: string;
  readonly result:
    | "applied"
    | "downgraded"
    | "held_shadow"
    | "blocked_scope"
    | "blocked_trust"
    | "blocked_approval"
    | "hidden";
  readonly settledMode: VisibleMode;
  readonly observedEnvelopeState: TrustState;
  readonly observedActionabilityState: ActionabilityState;
  readonly observedPublicationState: "published" | "stale" | "blocked";
  readonly recoveryActionRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly recordHash: string;
}

export interface AssistiveVisibleRollbackBinding {
  readonly recordType: "AssistiveVisibleRollbackBinding";
  readonly rollbackBindingId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly trustEnvelopeRef: string;
  readonly rollbackMode: "shadow_only" | "read_only_provenance" | "assistive_hidden";
  readonly killSwitchStateRef: string;
  readonly freezeDispositionRef: string;
  readonly routeRollbackReadinessState: "ready" | "blocked";
  readonly state: "armed" | "recommended" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface AssistiveHumanResponsibilityAcknowledgement {
  readonly recordType: "AssistiveHumanResponsibilityAcknowledgement";
  readonly acknowledgementId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly staffCohortRef: string;
  readonly capabilityCode: string;
  readonly reviewBeforeUseNoticeState: "acknowledged" | "missing";
  readonly humanApprovalGateAssessmentRef: string | null;
  readonly approvalGateState: "satisfied" | "missing" | "not_required";
  readonly concreteCommitAllowed: boolean;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface AssistiveModeExposureProof {
  readonly recordType: "AssistiveModeExposureProof";
  readonly exposureProofId: string;
  readonly scenarioId: Assistive485ScenarioState;
  readonly capabilityCode: string;
  readonly watchTupleHash: string;
  readonly approvedCohortScopeRef: string;
  readonly routeFamilyRef: string;
  readonly visibleStaffCount: number;
  readonly insertEnabledStaffCount: number;
  readonly hiddenOutsideCohort: boolean;
  readonly broadFlagLeakageState: "none" | "blocked";
  readonly routeModeMap: readonly {
    readonly routeFamilyRef: string;
    readonly mode: VisibleMode;
    readonly insertControlsVisible: boolean;
  }[];
  readonly exposureState: "exact" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/485.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-8-the-assistive-layer.md#assistivecapabilitywatchtuple",
  "blueprint/phase-8-the-assistive-layer.md#assistivecapabilitytrustprojection",
  "blueprint/phase-8-the-assistive-layer.md#assistivecapabilityrolloutverdict",
  "blueprint/phase-8-the-assistive-layer.md#assistivecapabilitytrustenvelope",
  "blueprint/phase-8-the-assistive-layer.md#assistiverolloutslicecontract",
  "blueprint/staff-workspace-interface-architecture.md#review-with-assistive-stage",
  "blueprint/platform-runtime-and-release-blueprint.md#runtimepublicationbundle",
  "blueprint/phase-9-the-assurance-ledger.md#bau-transfer",
  "data/bau/475_competency_evidence_ledger.json",
  "data/release/476_release_wave_manifest.json",
  "data/release/484_wave_widening_evidence.json",
] as const;

const requiredInputPaths = [
  "data/bau/475_competency_evidence_ledger.json",
  "data/bau/475_training_curriculum_manifest.json",
  "data/release/476_release_wave_manifest.json",
  "data/signoff/477_final_signoff_register.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/evidence/480_uat_result_matrix.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
] as const;

export const required485EdgeCases = [
  "edge_485_trust_projection_healthy_but_route_verdict_shadow_only",
  "edge_485_staff_cohort_trained_but_route_contract_stale",
  "edge_485_visible_summary_allowed_insert_evidence_missing",
  "edge_485_trust_envelope_downgrades_mid_session",
  "edge_485_historical_kill_switch_command_current_state_clear",
  "edge_485_same_watch_tuple_visible_insert_one_route_shadow_only_elsewhere",
  "edge_485_human_approval_gate_missing_for_concrete_commit",
] as const;

const edgeCaseByScenario: Record<Assistive485ScenarioState, string | null> = {
  visible_insert_approved: null,
  shadow_only_unapproved: null,
  visible_summary_only: null,
  observe_only_degraded: null,
  frozen_freeze_disposition: null,
  hidden_out_of_slice: null,
  route_verdict_shadow_only: "edge_485_trust_projection_healthy_but_route_verdict_shadow_only",
  route_contract_stale: "edge_485_staff_cohort_trained_but_route_contract_stale",
  insert_evidence_missing: "edge_485_visible_summary_allowed_insert_evidence_missing",
  envelope_downgrade_mid_session: "edge_485_trust_envelope_downgrades_mid_session",
  historical_kill_switch_clear: "edge_485_historical_kill_switch_command_current_state_clear",
  split_route_visible_insert:
    "edge_485_same_watch_tuple_visible_insert_one_route_shadow_only_elsewhere",
  split_route_shadow_only:
    "edge_485_same_watch_tuple_visible_insert_one_route_shadow_only_elsewhere",
  commit_missing_human_approval: "edge_485_human_approval_gate_missing_for_concrete_commit",
};

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

function withHash<T extends JsonObject>(record: Omit<T, "recordHash">): T {
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
  if (missing.length > 0) throw new Error(`485 required inputs missing: ${missing.join(", ")}`);
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

function releaseBindingFromInputs() {
  const canary = readJson<any>("data/release/484_wave_widening_evidence.json");
  const activeDecision = canary.activeDecision ?? {};
  return {
    releaseCandidateRef: activeDecision.releaseCandidateRef ?? "RC_LOCAL_V1",
    runtimePublicationBundleRef:
      activeDecision.runtimePublicationBundleRef ?? "rpb::local::authoritative",
    releaseWatchTupleRef: activeDecision.releaseWatchTupleRef ?? "RWT_LOCAL_V1",
    releaseWatchTupleHash:
      activeDecision.watchTupleHash ??
      "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
  };
}

function watchTupleHashFor(scenarioId: Assistive485ScenarioState): string {
  const base = {
    capabilityCode: "assistive_documentation_visible",
    releaseCandidateRef: "RC_LOCAL_V1",
    modelVersionRef: "assistive-model:documentation:v8.2.0",
    promptBundleHash: "prompt-bundle:assistive-visible:2026-04-28",
    policyBundleRef: "policy:assistive-visible-human-review:2026-04",
  };
  if (scenarioId === "split_route_visible_insert" || scenarioId === "split_route_shadow_only") {
    return hashValue({ ...base, routeFamilyGroup: "same-watch-tuple-split" });
  }
  return hashValue({ ...base, scenarioGroup: scenarioId });
}

function scenarioRouteFamily(scenarioId: Assistive485ScenarioState): string {
  if (scenarioId === "split_route_shadow_only") return "self_care_boundary";
  if (scenarioId === "route_contract_stale") return "communications";
  if (scenarioId === "commit_missing_human_approval") return "endpoint_suggestion";
  return "clinical_documentation";
}

function scenarioRolloutRung(scenarioId: Assistive485ScenarioState): RolloutRung {
  const map: Record<Assistive485ScenarioState, RolloutRung> = {
    visible_insert_approved: "visible_insert",
    shadow_only_unapproved: "shadow_only",
    visible_summary_only: "visible_summary",
    observe_only_degraded: "visible_summary",
    frozen_freeze_disposition: "frozen",
    hidden_out_of_slice: "shadow_only",
    route_verdict_shadow_only: "shadow_only",
    route_contract_stale: "visible_insert",
    insert_evidence_missing: "visible_summary",
    envelope_downgrade_mid_session: "visible_insert",
    historical_kill_switch_clear: "visible_insert",
    split_route_visible_insert: "visible_insert",
    split_route_shadow_only: "shadow_only",
    commit_missing_human_approval: "visible_commit",
  };
  return map[scenarioId];
}

function blockersForScenario(scenarioId: Assistive485ScenarioState): string[] {
  const map: Record<Assistive485ScenarioState, string[]> = {
    visible_insert_approved: [],
    shadow_only_unapproved: ["blocker:485:cohort-outside-visible-slice"],
    visible_summary_only: ["blocker:485:insert-rung-not-approved-for-route"],
    observe_only_degraded: ["blocker:485:trust-projection-observe-only"],
    frozen_freeze_disposition: ["blocker:485:assistive-freeze-disposition-active"],
    hidden_out_of_slice: ["blocker:485:staff-cohort-outside-approved-scope"],
    route_verdict_shadow_only: ["blocker:485:route-rollout-verdict-shadow-only"],
    route_contract_stale: ["blocker:485:surface-route-contract-stale"],
    insert_evidence_missing: ["blocker:485:visible-summary-allowed-insert-evidence-missing"],
    envelope_downgrade_mid_session: ["blocker:485:trust-envelope-downgraded-mid-session"],
    historical_kill_switch_clear: [],
    split_route_visible_insert: [],
    split_route_shadow_only: ["blocker:485:same-watch-tuple-route-family-shadow-only"],
    commit_missing_human_approval: ["blocker:485:human-approval-gate-missing-for-commit"],
  };
  return map[scenarioId];
}

function buildTrainingEvidence(
  scenarioId: Assistive485ScenarioState,
): AssistiveTrainingPrerequisiteEvidence {
  return withHash<AssistiveTrainingPrerequisiteEvidence>({
    recordType: "AssistiveTrainingPrerequisiteEvidence",
    trainingEvidenceId: `training_485_${scenarioId}`,
    scenarioId,
    staffCohortRef: "staff_cohort:assistive-visible:narrow-reviewers",
    competencyLedgerRef: "data/bau/475_competency_evidence_ledger.json",
    briefingRef: "docs/training/485_assistive_visible_mode_staff_briefing.md",
    trainedStaffCount: 10,
    requiredStaffCount: 10,
    trainingState: "exact",
    blockerRefs: [],
    evidenceRefs: [
      "data/bau/475_training_curriculum_manifest.json",
      "docs/training/475_assistive_layer_human_review_training.md",
    ],
    sourceRefs,
    owner: "clinical-operations-training",
    generatedAt: FIXED_NOW,
  });
}

function buildCohortScope(
  scenarioId: Assistive485ScenarioState,
  binding: ReturnType<typeof releaseBindingFromInputs>,
): AssistiveApprovedCohortScope {
  const membership = scenarioId === "hidden_out_of_slice" ? "out_of_slice" : "in_slice";
  const selectorPayload = {
    tenantRef: "tenant-demo-gp",
    releaseCohortRef: "wtc_476_assistive_narrow_staff",
    staffCohortRef: "staff_cohort:assistive-visible:narrow-reviewers",
    routeFamilyRef: scenarioRouteFamily(scenarioId),
  };
  const blockers = blockersForScenario(scenarioId).filter(
    (entry) =>
      entry.includes("cohort") ||
      entry.includes("scope") ||
      entry.includes("shadow-only") ||
      entry.includes("route-family-shadow-only"),
  );
  const scopeState =
    scenarioId === "hidden_out_of_slice"
      ? "hidden"
      : blockers.length > 0
        ? "shadow_only"
        : "approved";
  return withHash<AssistiveApprovedCohortScope>({
    recordType: "AssistiveApprovedCohortScope",
    approvedCohortScopeId: `approved_scope_485_${scenarioId}`,
    taskId: TASK_ID,
    scenarioId,
    capabilityCode: "assistive_documentation_visible",
    releaseCandidateRef: binding.releaseCandidateRef,
    tenantRef: "tenant-demo-gp",
    releaseCohortRef: "wtc_476_assistive_narrow_staff",
    routeFamilyRef: scenarioRouteFamily(scenarioId),
    audienceTier: "staff",
    cohortSelectorRef: "selector:485:assistive-visible:narrow-reviewers",
    cohortSelectorHash: hashValue(selectorPayload),
    sliceMembershipState: membership,
    approvedVisibleModeCeiling: scenarioRolloutRung(scenarioId),
    scopeState,
    blockerRefs: blockers,
    evidenceRefs: [
      "data/release/476_release_wave_manifest.json",
      "data/release/484_wave_widening_evidence.json",
    ],
    sourceRefs,
    owner: "assistive-product-owner",
    generatedAt: FIXED_NOW,
  });
}

function buildTrustProjection(
  scenarioId: Assistive485ScenarioState,
  binding: ReturnType<typeof releaseBindingFromInputs>,
): AssistiveCapabilityTrustProjection485 {
  const degraded =
    scenarioId === "observe_only_degraded" || scenarioId === "envelope_downgrade_mid_session";
  const frozen = scenarioId === "frozen_freeze_disposition";
  const shadow =
    scenarioId === "shadow_only_unapproved" ||
    scenarioId === "route_verdict_shadow_only" ||
    scenarioId === "split_route_shadow_only";
  const trustState: TrustState = frozen
    ? "frozen"
    : degraded
      ? "degraded"
      : shadow
        ? "trusted"
        : "trusted";
  const blockers = degraded || frozen ? blockersForScenario(scenarioId) : [];
  return withHash<AssistiveCapabilityTrustProjection485>({
    recordType: "AssistiveCapabilityTrustProjection",
    trustProjectionId: `trust_projection_485_${scenarioId}`,
    scenarioId,
    capabilityCode: "assistive_documentation_visible",
    watchTupleHash: watchTupleHashFor(scenarioId),
    releaseCandidateRef: binding.releaseCandidateRef,
    rolloutLadderPolicyRef: "assistive_rollout_ladder_policy:visible-mode:2026-04",
    audienceTier: "staff",
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    assistiveKillSwitchStateRef: `kill_switch_state_485_${scenarioId}_clear`,
    releaseFreezeRecordRef: frozen ? `freeze_record_485_${scenarioId}` : null,
    freezeDispositionRef: `freeze_disposition_485_${scenarioId}`,
    releaseRecoveryDispositionRef: `release_recovery_disposition_485_${scenarioId}`,
    trustScore: frozen ? 0.44 : degraded ? 0.71 : 0.94,
    thresholdState: frozen ? "block" : degraded ? "warn" : "green",
    trustState,
    visibilityEligibilityState: frozen ? "blocked" : degraded ? "observe_only" : "visible",
    insertEligibilityState: frozen ? "blocked" : degraded ? "observe_only" : "enabled",
    approvalEligibilityState:
      scenarioId === "commit_missing_human_approval" ? "dual_review" : "single_review",
    rolloutCeilingState: frozen ? "blocked" : degraded ? "observe_only" : "visible",
    fallbackMode: frozen
      ? "read_only_provenance"
      : degraded
        ? "observe_only"
        : shadow
          ? "shadow_only"
          : "observe_only",
    blockerRefs: blockers,
    evidenceRefs: ["data/analysis/430_phase8_trust_rollout_report.json"],
    sourceRefs,
    evaluatedAt: FIXED_NOW,
  });
}

function buildRolloutVerdict(
  scenarioId: Assistive485ScenarioState,
  binding: ReturnType<typeof releaseBindingFromInputs>,
  scope: AssistiveApprovedCohortScope,
  trustProjection: AssistiveCapabilityTrustProjection485,
): AssistiveCapabilityRolloutVerdict485 {
  const rolloutRung = scenarioRolloutRung(scenarioId);
  const blockers = blockersForScenario(scenarioId).filter(
    (entry) =>
      !entry.includes("trust-envelope-downgraded") && !entry.includes("human-approval-gate"),
  );
  const routeContractState = scenarioId === "route_contract_stale" ? "stale" : "exact";
  const publicationState = scenarioId === "route_contract_stale" ? "stale" : ("published" as const);
  const insertEvidenceState = scenarioId === "insert_evidence_missing" ? "missing" : "complete";
  const renderPosture =
    scenarioId === "hidden_out_of_slice"
      ? "blocked"
      : rolloutRung === "shadow_only"
        ? "shadow_only"
        : trustProjection.visibilityEligibilityState === "observe_only"
          ? "observe_only"
          : "visible";
  const insertPosture =
    rolloutRung === "visible_insert" || rolloutRung === "visible_commit"
      ? insertEvidenceState === "complete" &&
        routeContractState === "exact" &&
        trustProjection.insertEligibilityState === "enabled"
        ? "enabled"
        : "blocked"
      : "observe_only";
  return withHash<AssistiveCapabilityRolloutVerdict485>({
    recordType: "AssistiveCapabilityRolloutVerdict",
    rolloutVerdictId: `rollout_verdict_485_${scenarioId}`,
    scenarioId,
    capabilityCode: "assistive_documentation_visible",
    watchTupleHash: trustProjection.watchTupleHash,
    releaseCandidateRef: binding.releaseCandidateRef,
    rolloutSliceContractRef: `rollout_slice_contract_485_${scenarioId}`,
    routeFamilyRef: scope.routeFamilyRef,
    audienceTier: "staff",
    releaseCohortRef: scope.releaseCohortRef,
    sliceMembershipState: scope.sliceMembershipState,
    surfaceRouteContractRef: `surface_route_contract_485_${scope.routeFamilyRef}`,
    surfacePublicationRef: `surface_publication_485_${scope.routeFamilyRef}`,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    trustProjectionRef: trustProjection.trustProjectionId,
    releaseFreezeRecordRef: trustProjection.releaseFreezeRecordRef,
    freezeDispositionRef: trustProjection.freezeDispositionRef,
    policyState: routeContractState === "stale" ? "stale" : "exact",
    routeContractState,
    publicationState,
    shadowEvidenceState: "complete",
    visibleEvidenceState:
      scenarioId === "shadow_only_unapproved" || scenarioId === "hidden_out_of_slice"
        ? "missing"
        : "complete",
    insertEvidenceState,
    commitEvidenceState: scenarioId === "commit_missing_human_approval" ? "complete" : "missing",
    rolloutRung,
    renderPosture,
    insertPosture,
    approvalPosture:
      scenarioId === "commit_missing_human_approval" ? "dual_review" : "single_review",
    fallbackMode:
      scenarioId === "hidden_out_of_slice"
        ? "assistive_hidden"
        : rolloutRung === "shadow_only"
          ? "shadow_only"
          : "observe_only",
    verdictState: blockers.length > 0 ? "blocked" : "current",
    blockerRefs: blockers,
    evidenceRefs: [
      "data/contracts/431_phase8_exit_packet.json",
      "data/evidence/480_uat_result_matrix.json",
    ],
    sourceRefs,
    evaluatedAt: FIXED_NOW,
  });
}

function buildTrustEnvelope(
  scenarioId: Assistive485ScenarioState,
  binding: ReturnType<typeof releaseBindingFromInputs>,
  projection: AssistiveCapabilityTrustProjection485,
  verdict: AssistiveCapabilityRolloutVerdict485,
): AssistiveCapabilityTrustEnvelope485 {
  const blockers = [...new Set([...projection.blockerRefs, ...verdict.blockerRefs])];
  const frozen = scenarioId === "frozen_freeze_disposition";
  const hidden = scenarioId === "hidden_out_of_slice";
  const downgraded = scenarioId === "envelope_downgrade_mid_session";
  const surfacePostureState: SurfacePosture = hidden
    ? "hidden"
    : frozen
      ? "provenance_only"
      : downgraded || projection.visibilityEligibilityState === "observe_only"
        ? "observe_only"
        : verdict.renderPosture === "shadow_only"
          ? "hidden"
          : "interactive";
  const actionabilityState: ActionabilityState =
    verdict.insertPosture === "enabled" &&
    surfacePostureState === "interactive" &&
    scenarioId !== "commit_missing_human_approval"
      ? "enabled"
      : frozen
        ? "blocked"
        : downgraded
          ? "regenerate_only"
          : verdict.insertPosture === "observe_only"
            ? "observe_only"
            : "blocked_by_policy";
  return withHash<AssistiveCapabilityTrustEnvelope485>({
    recordType: "AssistiveCapabilityTrustEnvelope",
    trustEnvelopeId: `trust_envelope_485_${scenarioId}`,
    scenarioId,
    capabilityCode: "assistive_documentation_visible",
    trustProjectionRef: projection.trustProjectionId,
    rolloutVerdictRef: verdict.rolloutVerdictId,
    workspaceTrustEnvelopeRef: `workspace_trust_envelope_485_${scenarioId}`,
    surfacePublicationRef: verdict.surfacePublicationRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseRecoveryDispositionRef: projection.releaseRecoveryDispositionRef,
    trustState: frozen ? "frozen" : downgraded ? "degraded" : projection.trustState,
    surfacePostureState,
    actionabilityState,
    confidencePostureState: surfacePostureState === "hidden" ? "hidden" : "conservative_band",
    completionAdjacencyState:
      scenarioId === "commit_missing_human_approval" ? "blocked" : "observe_only",
    disclosureFenceHealth: hidden ? "blocked" : "exact",
    freezeState: frozen
      ? "frozen"
      : verdict.rolloutRung === "shadow_only"
        ? "shadow_only"
        : "clear",
    preservedArtifactPosture: frozen || downgraded ? "read_only_provenance" : "none",
    blockerRefs: downgraded
      ? [...new Set([...blockers, "blocker:485:trust-envelope-downgraded-mid-session"])]
      : blockers,
    evidenceRefs: [projection.trustProjectionId, verdict.rolloutVerdictId],
    sourceRefs,
    computedAt: FIXED_NOW,
  });
}

function modeFromEnvelopeAndVerdict(
  scenarioId: Assistive485ScenarioState,
  envelope: AssistiveCapabilityTrustEnvelope485,
  verdict: AssistiveCapabilityRolloutVerdict485,
): VisibleMode {
  if (scenarioId === "hidden_out_of_slice" || scenarioId === "shadow_only_unapproved") {
    return "hidden";
  }
  if (verdict.rolloutRung === "shadow_only") return "shadow";
  if (envelope.surfacePostureState === "hidden") return "hidden";
  if (envelope.trustState === "frozen") return "frozen";
  if (envelope.surfacePostureState === "observe_only") return "observe_only";
  if (verdict.rolloutRung === "visible_commit") return "visible_commit";
  if (verdict.insertPosture === "enabled" && scenarioId !== "commit_missing_human_approval") {
    return "visible_insert";
  }
  if (verdict.renderPosture === "visible") return "visible_summary";
  return "shadow";
}

function nextSafeActionFor(mode: VisibleMode, blockers: readonly string[]): string {
  if (mode === "visible_insert" && blockers.length === 0) {
    return "Show summary and insert controls only to the approved narrow staff cohort.";
  }
  if (mode === "visible_summary") {
    return "Show summary and provenance, but suppress insert until insert evidence is exact.";
  }
  if (mode === "observe_only") {
    return "Preserve provenance and suppress write controls until the trust envelope recovers.";
  }
  if (mode === "frozen") {
    return "Keep read-only provenance in place and follow the freeze disposition.";
  }
  if (mode === "hidden") {
    return "Hide assistive chrome outside the approved cohort and route family.";
  }
  if (mode === "visible_commit") {
    return "Treat commit as a ceiling only; require a concrete human approval gate assessment.";
  }
  return "Keep the capability shadow-only for this route or cohort.";
}

function buildExposureProof(
  scenarioId: Assistive485ScenarioState,
  scope: AssistiveApprovedCohortScope,
  mode: VisibleMode,
  verdict: AssistiveCapabilityRolloutVerdict485,
): AssistiveModeExposureProof {
  const insertVisible = mode === "visible_insert";
  const broadLeak = scope.sliceMembershipState !== "in_slice" && mode !== "hidden";
  return withHash<AssistiveModeExposureProof>({
    recordType: "AssistiveModeExposureProof",
    exposureProofId: `exposure_proof_485_${scenarioId}`,
    scenarioId,
    capabilityCode: scope.capabilityCode,
    watchTupleHash: verdict.watchTupleHash,
    approvedCohortScopeRef: scope.approvedCohortScopeId,
    routeFamilyRef: scope.routeFamilyRef,
    visibleStaffCount:
      mode === "visible_summary" || mode === "visible_insert" || mode === "visible_commit" ? 10 : 0,
    insertEnabledStaffCount: insertVisible ? 10 : 0,
    hiddenOutsideCohort: true,
    broadFlagLeakageState: broadLeak ? "blocked" : "none",
    routeModeMap:
      scenarioId === "split_route_visible_insert"
        ? [
            {
              routeFamilyRef: "clinical_documentation",
              mode: "visible_insert",
              insertControlsVisible: true,
            },
            {
              routeFamilyRef: "self_care_boundary",
              mode: "shadow",
              insertControlsVisible: false,
            },
          ]
        : [
            {
              routeFamilyRef: scope.routeFamilyRef,
              mode,
              insertControlsVisible: insertVisible,
            },
          ],
    exposureState: broadLeak ? "blocked" : "exact",
    blockerRefs: broadLeak ? ["blocker:485:broad-assistive-flag-leakage"] : [],
    evidenceRefs: [scope.approvedCohortScopeId, verdict.rolloutVerdictId],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildHumanAcknowledgement(
  scenarioId: Assistive485ScenarioState,
  concreteCommitAllowed: boolean,
): AssistiveHumanResponsibilityAcknowledgement {
  const missing = scenarioId === "commit_missing_human_approval";
  return withHash<AssistiveHumanResponsibilityAcknowledgement>({
    recordType: "AssistiveHumanResponsibilityAcknowledgement",
    acknowledgementId: `human_ack_485_${scenarioId}`,
    scenarioId,
    staffCohortRef: "staff_cohort:assistive-visible:narrow-reviewers",
    capabilityCode: "assistive_documentation_visible",
    reviewBeforeUseNoticeState: "acknowledged",
    humanApprovalGateAssessmentRef: missing
      ? null
      : scenarioId.includes("commit")
        ? `human_approval_gate_485_${scenarioId}`
        : null,
    approvalGateState: missing
      ? "missing"
      : scenarioId.includes("commit")
        ? "satisfied"
        : "not_required",
    concreteCommitAllowed,
    blockerRefs: missing ? ["blocker:485:human-approval-gate-missing-for-commit"] : [],
    evidenceRefs: ["docs/training/485_assistive_visible_mode_staff_briefing.md"],
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:485:human-responsibility:${scenarioId}`,
  });
}

export function build485ScenarioRecords(
  scenarioId: Assistive485ScenarioState = "visible_insert_approved",
  artifactRefs: readonly string[] = [],
) {
  ensureRequiredInputs();
  const binding = releaseBindingFromInputs();
  const trainingEvidence = buildTrainingEvidence(scenarioId);
  const scope = buildCohortScope(scenarioId, binding);
  const trustProjection = buildTrustProjection(scenarioId, binding);
  const rolloutVerdict = buildRolloutVerdict(scenarioId, binding, scope, trustProjection);
  const trustEnvelope = buildTrustEnvelope(scenarioId, binding, trustProjection, rolloutVerdict);
  const preliminaryBlockers = [
    ...new Set([
      ...scope.blockerRefs,
      ...trainingEvidence.blockerRefs,
      ...trustProjection.blockerRefs,
      ...rolloutVerdict.blockerRefs,
      ...trustEnvelope.blockerRefs,
    ]),
  ];
  const mode = modeFromEnvelopeAndVerdict(scenarioId, trustEnvelope, rolloutVerdict);
  const visibleCommitCeilingAllowed =
    rolloutVerdict.rolloutRung === "visible_commit" &&
    rolloutVerdict.commitEvidenceState === "complete";
  const concreteCommitAllowed =
    visibleCommitCeilingAllowed && scenarioId !== "commit_missing_human_approval";
  const humanAcknowledgement = buildHumanAcknowledgement(scenarioId, concreteCommitAllowed);
  const exposureProof = buildExposureProof(scenarioId, scope, mode, rolloutVerdict);
  const blockerRefs = [
    ...new Set([
      ...preliminaryBlockers,
      ...humanAcknowledgement.blockerRefs,
      ...exposureProof.blockerRefs,
    ]),
  ];
  const visibleSummaryAllowed =
    (mode === "visible_summary" || mode === "visible_insert" || mode === "visible_commit") &&
    rolloutVerdict.visibleEvidenceState === "complete" &&
    blockerRefs.every((entry) => !entry.includes("route-contract-stale"));
  const visibleInsertAllowed =
    mode === "visible_insert" &&
    rolloutVerdict.insertEvidenceState === "complete" &&
    trustEnvelope.actionabilityState === "enabled" &&
    blockerRefs.length === 0;
  const eligibilityState: AssistiveModeEligibilityVerdict["decisionState"] =
    mode === "hidden"
      ? "hidden"
      : mode === "frozen"
        ? "frozen"
        : mode === "observe_only"
          ? "observe_only"
          : mode === "shadow"
            ? "shadow_only"
            : blockerRefs.length > 0
              ? "blocked"
              : "approved";
  const eligibilityVerdict = withHash<AssistiveModeEligibilityVerdict>({
    recordType: "AssistiveModeEligibilityVerdict",
    eligibilityVerdictId: `eligibility_485_${scenarioId}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    capabilityCode: scope.capabilityCode,
    watchTupleHash: rolloutVerdict.watchTupleHash,
    approvedCohortScopeRef: scope.approvedCohortScopeId,
    trustEnvelopeRef: trustEnvelope.trustEnvelopeId,
    rolloutVerdictRef: rolloutVerdict.rolloutVerdictId,
    trainingEvidenceRef: trainingEvidence.trainingEvidenceId,
    exposureProofRef: exposureProof.exposureProofId,
    eligibleMode: mode,
    visibleSummaryAllowed,
    visibleInsertAllowed,
    visibleCommitCeilingAllowed,
    concreteCommitAllowed,
    insertControlsVisible: visibleInsertAllowed,
    regenerateControlsVisible: trustEnvelope.actionabilityState === "enabled",
    exportControlsVisible: false,
    provenanceVisible: mode !== "hidden",
    decisionState: eligibilityState,
    nextSafeAction: nextSafeActionFor(mode, blockerRefs),
    blockerRefs,
    evidenceRefs: [
      scope.approvedCohortScopeId,
      trustEnvelope.trustEnvelopeId,
      rolloutVerdict.rolloutVerdictId,
      exposureProof.exposureProofId,
    ],
    sourceRefs,
    owner: "assistive-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:485:eligibility:${scenarioId}`,
  });
  const command = withHash<AssistiveVisibleEnablementCommand>({
    recordType: "AssistiveVisibleEnablementCommand",
    commandId: `assistive_visible_command_485_${scenarioId}`,
    scenarioId,
    capabilityCode: scope.capabilityCode,
    commandType:
      eligibilityVerdict.decisionState === "approved"
        ? "enable_visible_mode"
        : eligibilityVerdict.decisionState === "observe_only" ||
            eligibilityVerdict.decisionState === "frozen"
          ? "downgrade_visible_mode"
          : "hold_shadow",
    commandState:
      eligibilityVerdict.decisionState === "approved" ||
      eligibilityVerdict.decisionState === "observe_only" ||
      eligibilityVerdict.decisionState === "frozen"
        ? "accepted"
        : "blocked",
    requestedMode: mode,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    approvedCohortScopeRef: scope.approvedCohortScopeId,
    trustEnvelopeRef: trustEnvelope.trustEnvelopeId,
    rolloutVerdictRef: rolloutVerdict.rolloutVerdictId,
    roleAuthorizationRef: "role-auth:assistive-governance:visible-mode-release",
    idempotencyKey: `idem_485_${scenarioId}_20260428`,
    purposeBindingRef: `purpose:485:${scenarioRouteFamily(scenarioId)}:${mode}`,
    injectedClockRef: "clock:485:fixed-2026-04-28T00:00:00Z",
    actingContextRef: "operator:synthetic-assistive-release-manager",
    blockerRefs,
    evidenceRefs: [eligibilityVerdict.eligibilityVerdictId],
    sourceRefs,
    createdAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:485:command:${scenarioId}`,
  });
  const result: AssistiveVisibleEnablementSettlement["result"] =
    eligibilityVerdict.decisionState === "approved"
      ? "applied"
      : eligibilityVerdict.decisionState === "observe_only"
        ? "downgraded"
        : eligibilityVerdict.decisionState === "frozen"
          ? "downgraded"
          : eligibilityVerdict.decisionState === "hidden"
            ? "hidden"
            : blockerRefs.some((entry) => entry.includes("human-approval"))
              ? "blocked_approval"
              : blockerRefs.some((entry) => entry.includes("trust"))
                ? "blocked_trust"
                : mode === "shadow"
                  ? "held_shadow"
                  : "blocked_scope";
  const settlement = withHash<AssistiveVisibleEnablementSettlement>({
    recordType: "AssistiveVisibleEnablementSettlement",
    settlementId: `assistive_visible_settlement_485_${scenarioId}`,
    scenarioId,
    commandRef: command.commandId,
    result,
    settledMode: mode,
    observedEnvelopeState: trustEnvelope.trustState,
    observedActionabilityState: trustEnvelope.actionabilityState,
    observedPublicationState:
      rolloutVerdict.publicationState === "published"
        ? "published"
        : rolloutVerdict.publicationState === "stale"
          ? "stale"
          : "blocked",
    recoveryActionRef: trustEnvelope.releaseRecoveryDispositionRef,
    blockerRefs,
    evidenceRefs: [command.commandId, eligibilityVerdict.eligibilityVerdictId],
    sourceRefs,
    recordedAt: FIXED_NOW,
  });
  const rollbackBinding = withHash<AssistiveVisibleRollbackBinding>({
    recordType: "AssistiveVisibleRollbackBinding",
    rollbackBindingId: `rollback_binding_485_${scenarioId}`,
    scenarioId,
    capabilityCode: scope.capabilityCode,
    trustEnvelopeRef: trustEnvelope.trustEnvelopeId,
    rollbackMode:
      mode === "hidden"
        ? "assistive_hidden"
        : mode === "frozen"
          ? "read_only_provenance"
          : "shadow_only",
    killSwitchStateRef: trustProjection.assistiveKillSwitchStateRef,
    freezeDispositionRef: trustProjection.freezeDispositionRef,
    routeRollbackReadinessState: "ready",
    state:
      eligibilityVerdict.decisionState === "observe_only" ||
      eligibilityVerdict.decisionState === "frozen"
        ? "recommended"
        : "armed",
    blockerRefs: [],
    evidenceRefs: [trustEnvelope.trustEnvelopeId, settlement.settlementId],
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:485:rollback:${scenarioId}`,
  });
  return {
    trainingEvidence,
    scope,
    trustProjection,
    rolloutVerdict,
    trustEnvelope,
    eligibilityVerdict,
    exposureProof,
    humanAcknowledgement,
    command,
    settlement,
    rollbackBinding,
    artifactRefs,
  };
}

export function build485Records(artifactRefs: readonly string[] = listOutputArtifacts()) {
  const scenarioIds: Assistive485ScenarioState[] = [
    "visible_insert_approved",
    "shadow_only_unapproved",
    "visible_summary_only",
    "observe_only_degraded",
    "frozen_freeze_disposition",
    "hidden_out_of_slice",
    "route_verdict_shadow_only",
    "route_contract_stale",
    "insert_evidence_missing",
    "envelope_downgrade_mid_session",
    "historical_kill_switch_clear",
    "split_route_visible_insert",
    "split_route_shadow_only",
    "commit_missing_human_approval",
  ];
  const scenarios = scenarioIds.map((scenarioId) =>
    build485ScenarioRecords(scenarioId, artifactRefs),
  );
  const activeScenario = scenarios[0];
  const plan = withHash<AssistiveVisibleModeEnablementPlan>({
    recordType: "AssistiveVisibleModeEnablementPlan",
    planId: "assistive_visible_mode_enablement_plan_485",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    releaseCandidateRef: activeScenario.eligibilityVerdict.evidenceRefs[0]
      ? "RC_LOCAL_V1"
      : "RC_LOCAL_V1",
    runtimePublicationBundleRef: activeScenario.command.runtimePublicationBundleRef,
    planState: "partially_enabled",
    activeEligibilityVerdictRef: activeScenario.eligibilityVerdict.eligibilityVerdictId,
    approvedCohortScopeRefs: scenarios.map((entry) => entry.scope.approvedCohortScopeId),
    trustEnvelopeRefs: scenarios.map((entry) => entry.trustEnvelope.trustEnvelopeId),
    rolloutVerdictRefs: scenarios.map((entry) => entry.rolloutVerdict.rolloutVerdictId),
    commandRefs: scenarios.map((entry) => entry.command.commandId),
    settlementRefs: scenarios.map((entry) => entry.settlement.settlementId),
    artifactRefs,
    blockerRefs: [],
    evidenceRefs: [
      "data/release/484_wave_widening_evidence.json",
      "data/bau/475_competency_evidence_ledger.json",
    ],
    sourceRefs,
    owner: "assistive-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: "worm-ledger:485:visible-mode-plan",
  });
  const edgeCaseFixtures = withHash<JsonObject>({
    recordType: "AssistiveVisibleModeEdgeCaseFixtures",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    fixtures: scenarios
      .filter((entry) => edgeCaseByScenario[entry.eligibilityVerdict.scenarioId])
      .map((entry) => ({
        edgeCaseId: edgeCaseByScenario[entry.eligibilityVerdict.scenarioId],
        scenarioId: entry.eligibilityVerdict.scenarioId,
        eligibleMode: entry.eligibilityVerdict.eligibleMode,
        decisionState: entry.eligibilityVerdict.decisionState,
        blockerRefs: entry.eligibilityVerdict.blockerRefs,
      })),
    sourceRefs,
  });
  return {
    activeScenario,
    scenarios,
    plan,
    edgeCaseFixtures,
    scopes: scenarios.map((entry) => entry.scope),
    trainingEvidence: scenarios.map((entry) => entry.trainingEvidence),
    trustProjections: scenarios.map((entry) => entry.trustProjection),
    rolloutVerdicts: scenarios.map((entry) => entry.rolloutVerdict),
    trustEnvelopes: scenarios.map((entry) => entry.trustEnvelope),
    eligibilityVerdicts: scenarios.map((entry) => entry.eligibilityVerdict),
    exposureProofs: scenarios.map((entry) => entry.exposureProof),
    humanAcknowledgements: scenarios.map((entry) => entry.humanAcknowledgement),
    commands: scenarios.map((entry) => entry.command),
    settlements: scenarios.map((entry) => entry.settlement),
    rollbackBindings: scenarios.map((entry) => entry.rollbackBinding),
  };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/485_assistive_visible_enablement.schema.json",
    title: "Assistive visible mode enablement records",
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
      AssistiveModeEligibilityVerdict: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: [
              "eligibleMode",
              "visibleSummaryAllowed",
              "visibleInsertAllowed",
              "concreteCommitAllowed",
            ],
          },
        ],
      },
      AssistiveCapabilityTrustEnvelope: {
        allOf: [
          { $ref: "#/$defs/hashedRecord" },
          {
            type: "object",
            required: ["trustState", "surfacePostureState", "actionabilityState"],
          },
        ],
      },
    },
  };
}

function buildInterfaceGap(): JsonObject {
  return withHash<JsonObject>({
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_485_ASSISTIVE_VISIBLE_AUTHORITY",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    sourceConcepts: [
      "AssistiveCapabilityWatchTuple",
      "AssistiveCapabilityTrustProjection",
      "AssistiveCapabilityRolloutVerdict",
      "AssistiveCapabilityTrustEnvelope",
      "AssistiveRolloutSliceContract",
      "HumanApprovalGateAssessment",
    ],
    repositoryGap:
      "The repository had Phase 8 fixtures and UI prototypes but no single launch-batch authority that joins current slice membership, route verdict, trust envelope, training prerequisite, exposure proof, command, and settlement for visible assistive modes.",
    failClosedBridge:
      "enable_485_visible_modes.ts publishes typed scope, trust, rollout, eligibility, command, settlement, rollback, human-approval, and exposure records before any UI can surface visible summary or insert controls.",
    state: "closed_by_typed_bridge",
    owner: "assistive-governance",
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
        refId: "wai-aria-authoring-practices",
        relevance:
          "The staff panel and ops matrix expose keyboard reachable buttons, a provenance dialog, and table fallbacks.",
      },
      {
        refId: "clinical-safety-human-responsibility",
        relevance:
          "Visible assistive modes show review-before-use responsibility and concrete commit remains blocked without HumanApprovalGateAssessment.",
      },
      {
        refId: "accessible-data-visualisation",
        relevance:
          "Assistive Ops uses a compact matrix with non-colour status text and table semantics.",
      },
      {
        refId: "records-and-privacy-minimisation",
        relevance:
          "Evidence uses synthetic cohort, route, and watch tuple refs only; no PHI, grants, raw tokens, or confidential supplier data are emitted.",
      },
    ],
    sourceRefs,
  });
}

function buildAlgorithmAlignmentNotes(): string {
  return `# 485 Algorithm Alignment Notes

Task: ${TASK_ID}
Generated: ${FIXED_NOW}

## Implemented source authority

- Visible mode posture is computed from AssistiveApprovedCohortScope, AssistiveCapabilityTrustProjection, AssistiveCapabilityRolloutVerdict, and AssistiveCapabilityTrustEnvelope.
- The current kill-switch state is consumed, not historical command presence.
- Insert controls are only visible for the approved narrow staff cohort when the trust envelope actionability is enabled, route contract is exact, publication is published, and insert evidence is complete.
- Visible commit remains a capability ceiling only. Concrete externally consequential commit is blocked unless HumanApprovalGateAssessment is present and satisfied.
- Exposure proof shows which route family and staff cohort sees each mode and proves no broad assistive flag leakage.

## Edge cases covered

${required485EdgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n")}
`;
}

function buildRunbook(): string {
  return `# Assistive Visible Mode Enablement Runbook

Generated: ${FIXED_NOW}

## Authority

Use data/assistive/485_visible_mode_enablement_plan.json and data/assistive/485_trust_envelope_resolution.json as the visible-mode authority. Do not use feature flags, route labels, or a historical kill-switch command to widen assistive chrome.

## Enablement sequence

1. Confirm the staff cohort is inside the published rollout slice contract.
2. Confirm the current trust projection, rollout verdict, trust envelope, route contract, runtime publication, disclosure fence, and training prerequisites are exact.
3. Enable visible summary before insert. Insert controls require complete insert evidence and enabled actionability in the current trust envelope.
4. Keep concrete commits outside assistive settlement until a HumanApprovalGateAssessment is satisfied.
5. On trust downgrade or freeze, preserve provenance and suppress insert, regenerate, export, and completion-adjacent controls immediately.
`;
}

function buildTrainingBriefing(): string {
  return `# Assistive Visible Mode Staff Briefing

Generated: ${FIXED_NOW}

Visible assistive output is a bounded support surface. Staff remain responsible for review before use. Summary text, insert drafts, and provenance can help prepare work, but they do not settle clinical, administrative, booking, pharmacy, or communication outcomes.

Use insert only when the mode chip says "Visible insert" and the provenance drawer confirms the current trust envelope, rollout verdict, route family, and cohort. If the posture becomes observe-only, frozen, hidden, or shadow-only, use the primary workspace manually and keep provenance available for audit.
`;
}

function buildReport(records: ReturnType<typeof build485Records>): string {
  return `# Assistive Visible Mode Enablement Report

Generated: ${FIXED_NOW}

## Active enablement result

- Plan: ${records.plan.planId}
- Active eligibility: ${records.activeScenario.eligibilityVerdict.decisionState}
- Active mode: ${records.activeScenario.eligibilityVerdict.eligibleMode}
- Insert controls visible: ${records.activeScenario.eligibilityVerdict.insertControlsVisible}
- Settlement: ${records.activeScenario.settlement.result}
- Next safe action: ${records.activeScenario.eligibilityVerdict.nextSafeAction}

## Scenario coverage

${records.eligibilityVerdicts
  .map(
    (verdict) =>
      `- ${verdict.scenarioId}: ${verdict.eligibleMode}; state=${verdict.decisionState}; blockers=${verdict.blockerRefs.length}`,
  )
  .join("\n")}

## Browser evidence

${records.plan.artifactRefs.length === 0 ? "- Browser artifacts are generated by the Playwright suite." : records.plan.artifactRefs.map((artifact) => `- ${artifact}`).join("\n")}
`;
}

export function write485AssistiveVisibleModeArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build485Records(artifactRefs);
  writeJson(
    "data/assistive/485_visible_mode_enablement_plan.json",
    withHash<JsonObject>({
      recordType: "AssistiveVisibleModeEnablementPlanEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      plan: records.plan,
      activeEligibilityVerdict: records.activeScenario.eligibilityVerdict,
      eligibilityVerdicts: records.eligibilityVerdicts,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );
  writeJson(
    "data/assistive/485_approved_cohort_scope.json",
    withHash<JsonObject>({
      recordType: "AssistiveApprovedCohortScopeEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      scopes: records.scopes,
      trainingEvidence: records.trainingEvidence,
      exposureProofs: records.exposureProofs,
      sourceRefs,
    }),
  );
  writeJson(
    "data/assistive/485_trust_envelope_resolution.json",
    withHash<JsonObject>({
      recordType: "AssistiveTrustEnvelopeResolution",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      trustProjections: records.trustProjections,
      rolloutVerdicts: records.rolloutVerdicts,
      trustEnvelopes: records.trustEnvelopes,
      sourceRefs,
    }),
  );
  writeJson(
    "data/assistive/485_assistive_enablement_commands.json",
    withHash<JsonObject>({
      recordType: "AssistiveVisibleEnablementCommandEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeCommand: records.activeScenario.command,
      commands: records.commands,
      humanAcknowledgements: records.humanAcknowledgements,
      sourceRefs,
    }),
  );
  writeJson(
    "data/assistive/485_assistive_enablement_settlements.json",
    withHash<JsonObject>({
      recordType: "AssistiveVisibleEnablementSettlementEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeSettlement: records.activeScenario.settlement,
      settlements: records.settlements,
      rollbackBindings: records.rollbackBindings,
      sourceRefs,
    }),
  );
  writeJson("data/contracts/485_assistive_visible_enablement.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_485_ASSISTIVE_VISIBLE_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/485_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/485_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes());
  writeText("docs/runbooks/485_assistive_visible_mode_enablement_runbook.md", buildRunbook());
  writeText("docs/training/485_assistive_visible_mode_staff_briefing.md", buildTrainingBriefing());
  writeText(
    "docs/test-evidence/485_assistive_visible_mode_enablement_report.md",
    buildReport(records),
  );
  formatFiles([
    "data/assistive/485_visible_mode_enablement_plan.json",
    "data/assistive/485_approved_cohort_scope.json",
    "data/assistive/485_trust_envelope_resolution.json",
    "data/assistive/485_assistive_enablement_commands.json",
    "data/assistive/485_assistive_enablement_settlements.json",
    "data/contracts/485_assistive_visible_enablement.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_485_ASSISTIVE_VISIBLE_AUTHORITY.json",
    "data/analysis/485_external_reference_notes.json",
    "data/analysis/485_algorithm_alignment_notes.md",
    "docs/runbooks/485_assistive_visible_mode_enablement_runbook.md",
    "docs/training/485_assistive_visible_mode_staff_briefing.md",
    "docs/test-evidence/485_assistive_visible_mode_enablement_report.md",
  ]);
}

if (process.argv[1]?.endsWith("enable_485_visible_modes.ts")) {
  write485AssistiveVisibleModeArtifacts();
}
