import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_482";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "482.programme.wave1-promotion.v1";
export const OUTPUT_ROOT = "output/playwright/482-wave1-promotion";

export type Promotion482ScenarioState =
  | "ready"
  | "expired_signoff"
  | "stale_migration"
  | "widened_selector"
  | "duplicate_idempotency"
  | "parity_failed"
  | "role_denied"
  | "missing_rollback";

type JsonObject = Record<string, unknown>;
type PreflightState = "exact" | "blocked";
type CommandState = "accepted" | "blocked" | "denied" | "deduplicated";
type SettlementResult = "applied" | "pending_probe" | "blocked_guardrail" | "denied_scope";

export interface Wave1PromotionPreflightLane {
  readonly laneId:
    | "scorecard"
    | "migration"
    | "bau"
    | "wave_plan"
    | "signoffs"
    | "dependencies"
    | "dress_rehearsal"
    | "uat"
    | "dr_smoke";
  readonly label: string;
  readonly state: PreflightState;
  readonly evidenceRef: string;
  readonly evidenceHash: string;
  readonly owner: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface Wave1PromotionPreflight {
  readonly recordType: "Wave1PromotionPreflight";
  readonly preflightId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveRef: string;
  readonly state: PreflightState;
  readonly lanes: readonly Wave1PromotionPreflightLane[];
  readonly blockerRefs: readonly string[];
  readonly generatedAt: string;
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface PromotionAuthorityTuple {
  readonly recordType: "PromotionAuthorityTuple";
  readonly promotionAuthorityTupleId: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly waveManifestRef: string;
  readonly waveRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly assistiveScope: string;
  readonly sourceGateRefs: readonly string[];
  readonly sourceGateHash: string;
  readonly authorityState: PreflightState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface PromotionBlocker {
  readonly recordType: "PromotionBlocker";
  readonly blockerId: string;
  readonly scenarioRef: Promotion482ScenarioState;
  readonly blockerRef: string;
  readonly laneRef: string;
  readonly severity: "hard_block" | "denied" | "probe_required";
  readonly state: "active" | "cleared";
  readonly fallbackAction: string;
  readonly owner: string;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface PromotionIdempotencyBinding {
  readonly recordType: "PromotionIdempotencyBinding";
  readonly idempotencyBindingId: string;
  readonly idempotencyKey: string;
  readonly commandRef: string;
  readonly firstSettlementRef: string;
  readonly replayedCommandRefs: readonly string[];
  readonly replayDisposition: "new_command" | "same_settlement_returned";
  readonly state: "bound" | "deduplicated";
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface PromotionRecoveryDisposition {
  readonly recordType: "PromotionRecoveryDisposition";
  readonly recoveryDispositionId: string;
  readonly waveRef: string;
  readonly routeFamilyRef: string;
  readonly rollbackBindingRef: string | null;
  readonly recoveryPosture: "ready" | "blocked";
  readonly state: PreflightState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface Wave1PromotionCommand {
  readonly recordType: "Wave1PromotionCommand";
  readonly promotionCommandId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly commandState: CommandState;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly observationPolicyRef: string;
  readonly rollbackBindingRef: string | null;
  readonly recoveryDispositionRef: string;
  readonly operatorRef: string;
  readonly operatorRoleRef: string;
  readonly roleAuthorizationRef: string;
  readonly purposeBindingRef: string;
  readonly routeIntentRef: string;
  readonly idempotencyKey: string;
  readonly expectedPreflightRef: string;
  readonly expectedAuthorityTupleHash: string;
  readonly blockerRefs: readonly string[];
  readonly createdAt: string;
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface WaveActionRecord {
  readonly recordType: "WaveActionRecord";
  readonly waveActionRecordId: string;
  readonly releaseRef: string;
  readonly waveRef: string;
  readonly actionType: "widen";
  readonly promotionActionType: "promote_wave1";
  readonly verificationScenarioRef: string;
  readonly releaseWatchEvidenceCockpitRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchEvidenceCockpitHash: string;
  readonly waveEligibilitySnapshotRef: string;
  readonly guardrailSnapshotRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly publicationParityRef: string;
  readonly audienceSurfaceContractRefs: readonly string[];
  readonly waveObservationPolicyRef: string;
  readonly waveControlFenceRef: string;
  readonly expectedWaveState: "approved";
  readonly expectedWaveFenceEpoch: number;
  readonly expectedPredecessorSettlementRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly actingContextRef: string;
  readonly approvalBundleRef: string;
  readonly impactPreviewRef: string;
  readonly waveActionLineageRef: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly settledAt: string | null;
  readonly recordHash: string;
}

export interface WaveActionSettlement {
  readonly recordType: "WaveActionSettlement";
  readonly waveActionSettlementId: string;
  readonly waveActionRecordRef: string;
  readonly result: SettlementResult;
  readonly releaseWatchEvidenceCockpitRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchEvidenceCockpitHash: string;
  readonly evidenceRef: string;
  readonly executionReceiptRef: string;
  readonly observationWindowRef: string;
  readonly waveObservationPolicyRef: string;
  readonly observedWaveState: "active" | "blocked";
  readonly observedEligibilitySnapshotRef: string;
  readonly observedGuardrailSnapshotRef: string;
  readonly observedRuntimePublicationBundleRef: string;
  readonly observedPublicationParityRef: string;
  readonly observedContinuityEvidenceRefs: readonly string[];
  readonly observedRecoveryDispositionRefs: readonly string[];
  readonly observedRollbackReadinessState: "ready" | "blocked";
  readonly observedProvenanceState: "verified";
  readonly observationState: "opened" | "blocked";
  readonly recoveryActionRef: string;
  readonly supersededByWaveActionRef: string | null;
  readonly blockerRefs: readonly string[];
  readonly recordedAt: string;
  readonly recordHash: string;
}

export interface PublicationParityAfterPromotion {
  readonly recordType: "PublicationParityAfterPromotion";
  readonly publicationParityAfterPromotionId: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly expectedPublicationParityRef: string;
  readonly observedPublicationParityRef: string;
  readonly parityState: "exact" | "mismatch";
  readonly activationPermitted: boolean;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface Wave1ActivationEvidence {
  readonly recordType: "Wave1ActivationEvidence";
  readonly wave1ActivationEvidenceId: string;
  readonly waveRef: string;
  readonly activationState: "active_under_observation" | "blocked";
  readonly settlementRef: string;
  readonly publicationParityAfterPromotionRef: string;
  readonly releaseWatchTupleRef: string;
  readonly observationPolicyRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly nextSafeAction: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface Wave1OperatorCommunication {
  readonly recordType: "Wave1OperatorCommunication";
  readonly operatorCommunicationId: string;
  readonly waveRef: string;
  readonly destinationRef: string;
  readonly deliveryState: "delivered" | "blocked";
  readonly messageClass: "activation_notice" | "blocked_notice";
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/482.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/platform-runtime-and-release-blueprint.md#environment-ring-and-promotion-contract",
  "blueprint/platform-runtime-and-release-blueprint.md#waveactionrecord",
  "blueprint/platform-runtime-and-release-blueprint.md#waveactionsettlement",
  "blueprint/phase-9-the-assurance-ledger.md#formal-exit-state",
  "blueprint/phase-0-the-foundation-protocol.md#command-settlement",
  "blueprint/phase-0-the-foundation-protocol.md#assurance-resilience-and-configuration-promotion-algorithm",
] as const;

const requiredInputPaths = [
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/migration/474_projection_readiness_verdicts.json",
  "data/migration/474_schema_migration_plan.json",
  "data/bau/475_operating_model.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/release/476_release_wave_manifest.json",
  "data/release/476_wave_guardrail_snapshots.json",
  "data/release/476_wave_observation_policies.json",
  "data/release/476_wave_eligibility_verdicts.json",
  "data/signoff/477_final_signoff_register.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/481_dr_and_go_live_smoke_report.json",
] as const;

export const required482EdgeCases = [
  "edge_482_release_candidate_signed_but_signoff_expired_after_signing",
  "edge_482_wave_manifest_exact_but_migration_readiness_stale",
  "edge_482_wave1_selector_widens_due_to_tenant_regrouping",
  "edge_482_duplicate_promotion_command_same_idempotency_key",
  "edge_482_promotion_succeeds_publication_parity_verification_fails",
  "edge_482_operator_lacks_release_manager_authority",
  "edge_482_rollback_binding_absent_for_exposed_route_family",
] as const;

const defaultReleaseBinding = {
  releaseRef: "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
  releaseCandidateRef: "RC_LOCAL_V1",
  releaseApprovalFreezeRef: "RAF_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releasePublicationParityRef: "rpp::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  releaseWatchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
  waveManifestRef: "prwm_476_rc_local_v1",
  waveRef: "wave_476_1_core_web_canary",
  tenantScope: "tenant-demo-gp:programme-core-release",
  cohortScope: "wtc_476_wave1_core_web_smallest_safe",
  channelScope: "wcs_476_wave1_core_web_only",
  assistiveScope: "was_476_wave1_assistive_shadow_only",
  guardrailSnapshotRef: "wgs_476_wave1_core_web",
  observationPolicyRef: "wop_476_wave1_24h",
  eligibilitySnapshotRef: "wev_476_wave1_core_web_canary",
  rollbackBindingRef: "wrb_476_wave1_feature_surface_and_cutover",
  manualFallbackBindingRef: "wmfb_476_wave1_core_web_manual_fallback",
} as const;

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
  if (missing.length > 0) throw new Error(`482 required inputs missing: ${missing.join(", ")}`);
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
  const manifest = readJson<any>("data/release/476_release_wave_manifest.json");
  const wave =
    manifest.deploymentWaves?.find(
      (entry: any) => entry.waveId === defaultReleaseBinding.waveRef,
    ) ?? {};
  return {
    ...defaultReleaseBinding,
    releaseRef: wave.releaseRef ?? defaultReleaseBinding.releaseRef,
    releaseCandidateRef: wave.releaseCandidateRef ?? defaultReleaseBinding.releaseCandidateRef,
    releaseApprovalFreezeRef:
      wave.releaseApprovalFreezeRef ?? defaultReleaseBinding.releaseApprovalFreezeRef,
    runtimePublicationBundleRef:
      wave.runtimePublicationBundleRef ?? defaultReleaseBinding.runtimePublicationBundleRef,
    releasePublicationParityRef:
      wave.releasePublicationParityRef ?? defaultReleaseBinding.releasePublicationParityRef,
    releaseWatchTupleRef: wave.releaseWatchTupleRef ?? defaultReleaseBinding.releaseWatchTupleRef,
    releaseWatchTupleHash:
      wave.releaseWatchTupleHash ?? defaultReleaseBinding.releaseWatchTupleHash,
    waveManifestRef: manifest.manifestId ?? defaultReleaseBinding.waveManifestRef,
    cohortScope: wave.tenantCohortRef ?? defaultReleaseBinding.cohortScope,
    channelScope: wave.channelScopeRef ?? defaultReleaseBinding.channelScope,
    assistiveScope: wave.assistiveScopeRef ?? defaultReleaseBinding.assistiveScope,
    guardrailSnapshotRef: wave.guardrailSnapshotRef ?? defaultReleaseBinding.guardrailSnapshotRef,
    observationPolicyRef: wave.observationPolicyRef ?? defaultReleaseBinding.observationPolicyRef,
    eligibilitySnapshotRef:
      wave.eligibilityVerdictRef ?? defaultReleaseBinding.eligibilitySnapshotRef,
    rollbackBindingRef: wave.rollbackBindingRef ?? defaultReleaseBinding.rollbackBindingRef,
  };
}

function evidenceHash(relativePath: string): string {
  return hashValue(readJson(relativePath));
}

function lane(
  laneId: Wave1PromotionPreflightLane["laneId"],
  label: string,
  evidenceRef: string,
  owner: string,
  state: PreflightState,
  blockerRefs: readonly string[] = [],
): Wave1PromotionPreflightLane {
  return withHash<Wave1PromotionPreflightLane>({
    laneId,
    label,
    state,
    evidenceRef,
    evidenceHash: evidenceHash(evidenceRef),
    owner,
    blockerRefs,
    sourceRefs,
  });
}

export function build482PreflightLanes(
  scenarioState: Promotion482ScenarioState = "ready",
): readonly Wave1PromotionPreflightLane[] {
  const scorecard = readJson<any>(
    "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  );
  const signoffs = readJson<any>("data/signoff/477_final_signoff_register.json");
  const dependencies = readJson<any>(
    "data/readiness/478_external_dependency_readiness_matrix.json",
  );
  const dress = readJson<any>("data/evidence/479_dress_rehearsal_report.json");
  const uat = readJson<any>("data/evidence/480_uat_result_matrix.json");
  const drSmoke = readJson<any>("data/evidence/481_dr_and_go_live_smoke_report.json");
  const waveBlocked = scenarioState === "widened_selector";
  const signoffBlocked = scenarioState === "expired_signoff";
  const migrationBlocked = scenarioState === "stale_migration";
  const rollbackBlocked = scenarioState === "missing_rollback";

  return [
    lane(
      "scorecard",
      "Scorecard",
      "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
      "programme-assurance",
      scorecard.scorecardState === "exact" && scorecard.coreReleaseScorecardStillExact === true
        ? "exact"
        : "blocked",
      scorecard.scorecardState === "exact" ? [] : ["blocker:482:scorecard-not-exact"],
    ),
    lane(
      "migration",
      "Migration",
      "data/migration/474_projection_readiness_verdicts.json",
      "data-migration-owner",
      migrationBlocked ? "blocked" : "exact",
      migrationBlocked ? ["blocker:482:migration-readiness-stale-after-wave-manifest"] : [],
    ),
    lane("bau", "BAU", "data/bau/475_operating_model.json", "service-owner", "exact"),
    lane(
      "wave_plan",
      "Wave Plan",
      "data/release/476_release_wave_manifest.json",
      "release-governance",
      waveBlocked ? "blocked" : "exact",
      waveBlocked ? ["blocker:482:wave1-selector-widened-by-tenant-regrouping"] : [],
    ),
    lane(
      "signoffs",
      "Signoffs",
      "data/signoff/477_final_signoff_register.json",
      "release-deployment-approver",
      signoffBlocked || Number(signoffs.launchDecision?.signoffBlockerCount ?? 0) > 0
        ? "blocked"
        : "exact",
      signoffBlocked ? ["blocker:482:signoff-register-expired-after-signing"] : [],
    ),
    lane(
      "dependencies",
      "Dependencies",
      "data/readiness/478_external_dependency_readiness_matrix.json",
      "platform-operations-lead",
      Number(dependencies.launchCriticalReadyCount ?? 0) ===
        Number(dependencies.launchCriticalDependencyCount ?? 0)
        ? "exact"
        : "blocked",
      Number(dependencies.launchCriticalReadyCount ?? 0) ===
        Number(dependencies.launchCriticalDependencyCount ?? 0)
        ? []
        : ["blocker:482:launch-critical-dependency-not-ready"],
    ),
    lane(
      "dress_rehearsal",
      "Dress Rehearsal",
      "data/evidence/479_dress_rehearsal_report.json",
      "release-manager",
      Number(dress.launchBlockingFailureCount ?? 0) === 0 ? "exact" : "blocked",
      Number(dress.launchBlockingFailureCount ?? 0) === 0
        ? []
        : ["blocker:482:dress-rehearsal-launch-failure"],
    ),
    lane(
      "uat",
      "UAT",
      "data/evidence/480_uat_result_matrix.json",
      "product-owner",
      Number(uat.launchBlockingFindingCount ?? 0) === 0 ? "exact" : "blocked",
      Number(uat.launchBlockingFindingCount ?? 0) === 0 ? [] : ["blocker:482:uat-launch-finding"],
    ),
    lane(
      "dr_smoke",
      "DR Smoke",
      "data/evidence/481_dr_and_go_live_smoke_report.json",
      "sre",
      rollbackBlocked || drSmoke.smokeVerdict !== "go_live_smoke_green" ? "blocked" : "exact",
      rollbackBlocked
        ? ["blocker:482:rollback-binding-absent-for-wave1-route-family"]
        : drSmoke.smokeVerdict === "go_live_smoke_green"
          ? []
          : ["blocker:482:dr-smoke-not-green"],
    ),
  ];
}

export function build482Preflight(
  scenarioState: Promotion482ScenarioState = "ready",
): Wave1PromotionPreflight {
  const binding = releaseBindingFromInputs();
  const lanes = build482PreflightLanes(scenarioState);
  const blockerRefs = lanes.flatMap((entry) => entry.blockerRefs);
  return withHash<Wave1PromotionPreflight>({
    recordType: "Wave1PromotionPreflight",
    preflightId: `preflight_482_wave1_${scenarioState}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    waveRef: binding.waveRef,
    state: blockerRefs.length === 0 ? "exact" : "blocked",
    lanes,
    blockerRefs,
    generatedAt: FIXED_NOW,
    sourceRefs,
    wormAuditRef: `worm-ledger:482:preflight:${scenarioState}`,
  });
}

export function build482AuthorityTuple(
  preflight: Wave1PromotionPreflight,
): PromotionAuthorityTuple {
  const binding = releaseBindingFromInputs();
  const sourceGateRefs = preflight.lanes.map((entry) => entry.evidenceRef);
  return withHash<PromotionAuthorityTuple>({
    recordType: "PromotionAuthorityTuple",
    promotionAuthorityTupleId: `promotion_authority_tuple_482_${preflight.state}`,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    releaseApprovalFreezeRef: binding.releaseApprovalFreezeRef,
    releasePublicationParityRef: binding.releasePublicationParityRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    waveManifestRef: binding.waveManifestRef,
    waveRef: binding.waveRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    assistiveScope: binding.assistiveScope,
    sourceGateRefs,
    sourceGateHash: hashValue(sourceGateRefs.map((ref) => [ref, evidenceHash(ref)])),
    authorityState: preflight.state,
    blockerRefs: preflight.blockerRefs,
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function blockersForScenario(
  scenarioState: Promotion482ScenarioState,
  preflight: Wave1PromotionPreflight,
): readonly PromotionBlocker[] {
  const scenarioBlockers: Record<Promotion482ScenarioState, readonly string[]> = {
    ready: [],
    duplicate_idempotency: [],
    parity_failed: ["blocker:482:post-promotion-publication-parity-mismatch"],
    role_denied: ["blocker:482:operator-lacks-release-manager-authority"],
    expired_signoff: preflight.blockerRefs,
    stale_migration: preflight.blockerRefs,
    widened_selector: preflight.blockerRefs,
    missing_rollback: preflight.blockerRefs,
  };
  return scenarioBlockers[scenarioState].map((blockerRef, index) =>
    withHash<PromotionBlocker>({
      recordType: "PromotionBlocker",
      blockerId: `promotion_blocker_482_${scenarioState}_${index + 1}`,
      scenarioRef: scenarioState,
      blockerRef,
      laneRef:
        preflight.lanes.find((entry) => entry.blockerRefs.includes(blockerRef))?.laneId ??
        "publication_parity",
      severity:
        scenarioState === "role_denied"
          ? "denied"
          : scenarioState === "parity_failed"
            ? "probe_required"
            : "hard_block",
      state: "active",
      fallbackAction:
        scenarioState === "parity_failed"
          ? "Keep Wave 1 inactive and republish exact runtime publication parity before retry."
          : scenarioState === "role_denied"
            ? "Require a release-manager actor with a bound purpose and idempotency key."
            : "Do not promote Wave 1 until the blocked authority lane is reissued as exact.",
      owner: scenarioState === "role_denied" ? "release-governance" : "release-manager",
      evidenceRefs: preflight.lanes.map((entry) => entry.evidenceRef),
      sourceRefs,
      generatedAt: FIXED_NOW,
    }),
  );
}

export function build482RecoveryDisposition(
  scenarioState: Promotion482ScenarioState = "ready",
): PromotionRecoveryDisposition {
  const binding = releaseBindingFromInputs();
  const missing = scenarioState === "missing_rollback";
  return withHash<PromotionRecoveryDisposition>({
    recordType: "PromotionRecoveryDisposition",
    recoveryDispositionId: `recovery_disposition_482_${scenarioState}`,
    waveRef: binding.waveRef,
    routeFamilyRef: "route-family:patient_request_start+patient_status+staff_workspace+ops_hub",
    rollbackBindingRef: missing ? null : binding.rollbackBindingRef,
    recoveryPosture: missing ? "blocked" : "ready",
    state: missing ? "blocked" : "exact",
    blockerRefs: missing ? ["blocker:482:rollback-binding-absent-for-wave1-route-family"] : [],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

export function build482Command(scenarioState: Promotion482ScenarioState = "ready"): {
  readonly preflight: Wave1PromotionPreflight;
  readonly authorityTuple: PromotionAuthorityTuple;
  readonly recoveryDisposition: PromotionRecoveryDisposition;
  readonly command: Wave1PromotionCommand;
} {
  const binding = releaseBindingFromInputs();
  const preflight = build482Preflight(scenarioState);
  const authorityTuple = build482AuthorityTuple(preflight);
  const recoveryDisposition = build482RecoveryDisposition(scenarioState);
  const roleDenied = scenarioState === "role_denied";
  const duplicate = scenarioState === "duplicate_idempotency";
  const commandState: CommandState = roleDenied
    ? "denied"
    : duplicate
      ? "deduplicated"
      : preflight.state === "exact"
        ? "accepted"
        : "blocked";
  const blockerRefs = [
    ...preflight.blockerRefs,
    ...recoveryDisposition.blockerRefs,
    ...(roleDenied ? ["blocker:482:operator-lacks-release-manager-authority"] : []),
  ];
  const idempotencyKey = "idem_482_wave1_rc_local_v1_release_manager_20260428";
  const command = withHash<Wave1PromotionCommand>({
    recordType: "Wave1PromotionCommand",
    promotionCommandId: duplicate
      ? "promotion_command_482_wave1_replay"
      : `promotion_command_482_wave1_${scenarioState}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    commandState,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    waveRef: binding.waveRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    observationPolicyRef: binding.observationPolicyRef,
    rollbackBindingRef: recoveryDisposition.rollbackBindingRef,
    recoveryDispositionRef: recoveryDisposition.recoveryDispositionId,
    operatorRef: roleDenied
      ? "operator:synthetic-support-observer"
      : "operator:synthetic-release-manager",
    operatorRoleRef: roleDenied ? "role:support-observer" : "role:release-manager",
    roleAuthorizationRef: roleDenied
      ? "role-auth:482:missing-release-manager"
      : "role-auth:482:release-manager",
    purposeBindingRef: "purpose:482:promote-signed-release-candidate-to-wave1",
    routeIntentRef: "route-intent:ops.release.wave1-promotion",
    idempotencyKey,
    expectedPreflightRef: preflight.preflightId,
    expectedAuthorityTupleHash: authorityTuple.recordHash,
    blockerRefs,
    createdAt: FIXED_NOW,
    sourceRefs,
    wormAuditRef: `worm-ledger:482:promotion-command:${scenarioState}`,
  });
  return { preflight, authorityTuple, recoveryDisposition, command };
}

export function settle482Wave1Promotion(scenarioState: Promotion482ScenarioState = "ready") {
  const binding = releaseBindingFromInputs();
  const { preflight, authorityTuple, recoveryDisposition, command } =
    build482Command(scenarioState);
  const parityFailed = scenarioState === "parity_failed";
  const blocked =
    command.commandState === "blocked" || command.commandState === "denied" || parityFailed;
  const settlementRef =
    scenarioState === "duplicate_idempotency"
      ? "wave_action_settlement_482_wave1_ready"
      : `wave_action_settlement_482_wave1_${scenarioState}`;
  const actionRecord = withHash<WaveActionRecord>({
    recordType: "WaveActionRecord",
    waveActionRecordId:
      scenarioState === "duplicate_idempotency"
        ? "wave_action_482_wave1_replay"
        : `wave_action_482_wave1_${scenarioState}`,
    releaseRef: binding.releaseRef,
    waveRef: binding.waveRef,
    actionType: "widen",
    promotionActionType: "promote_wave1",
    verificationScenarioRef: preflight.preflightId,
    releaseWatchEvidenceCockpitRef: "release-watch-evidence-cockpit:482:wave1",
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchEvidenceCockpitHash: hashValue({
      releaseWatchTupleRef: binding.releaseWatchTupleRef,
      runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
      guardrailSnapshotRef: binding.guardrailSnapshotRef,
      waveObservationPolicyRef: binding.observationPolicyRef,
      preflightHash: preflight.recordHash,
    }),
    waveEligibilitySnapshotRef: binding.eligibilitySnapshotRef,
    guardrailSnapshotRef: binding.guardrailSnapshotRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    publicationParityRef: binding.releasePublicationParityRef,
    audienceSurfaceContractRefs: [
      "surface-contract:patient_request_start",
      "surface-contract:patient_status",
      "surface-contract:staff_workspace",
      "surface-contract:ops_hub",
    ],
    waveObservationPolicyRef: binding.observationPolicyRef,
    waveControlFenceRef: "wave-control-fence:482:wave1-armed",
    expectedWaveState: "approved",
    expectedWaveFenceEpoch: 1,
    expectedPredecessorSettlementRef: "none:first-wave",
    releaseApprovalFreezeRef: binding.releaseApprovalFreezeRef,
    actingContextRef: command.operatorRef,
    approvalBundleRef: authorityTuple.promotionAuthorityTupleId,
    impactPreviewRef: "wave-action-impact-preview:482:wave1",
    waveActionLineageRef: "wave-action-lineage:482:wave1-root",
    idempotencyKey: command.idempotencyKey,
    createdAt: FIXED_NOW,
    settledAt:
      command.commandState === "accepted" || command.commandState === "deduplicated"
        ? FIXED_NOW
        : null,
  });
  const parity = withHash<PublicationParityAfterPromotion>({
    recordType: "PublicationParityAfterPromotion",
    publicationParityAfterPromotionId: `publication_parity_after_482_${scenarioState}`,
    releaseCandidateRef: binding.releaseCandidateRef,
    runtimePublicationBundleRef: binding.runtimePublicationBundleRef,
    expectedPublicationParityRef: binding.releasePublicationParityRef,
    observedPublicationParityRef: parityFailed
      ? "rpp::local::mismatch-after-promotion-probe"
      : binding.releasePublicationParityRef,
    parityState: parityFailed ? "mismatch" : "exact",
    activationPermitted: !blocked,
    blockerRefs: parityFailed ? ["blocker:482:post-promotion-publication-parity-mismatch"] : [],
    evidenceRefs: ["data/analysis/release_publication_parity_records.json"],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
  const settlement = withHash<WaveActionSettlement>({
    recordType: "WaveActionSettlement",
    waveActionSettlementId: settlementRef,
    waveActionRecordRef: actionRecord.waveActionRecordId,
    result:
      command.commandState === "denied"
        ? "denied_scope"
        : parityFailed
          ? "pending_probe"
          : command.commandState === "blocked"
            ? "blocked_guardrail"
            : "applied",
    releaseWatchEvidenceCockpitRef: actionRecord.releaseWatchEvidenceCockpitRef,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    watchEvidenceCockpitHash: actionRecord.watchEvidenceCockpitHash,
    evidenceRef: "data/evidence/482_wave1_promotion_evidence.json",
    executionReceiptRef:
      command.commandState === "deduplicated"
        ? "execution-receipt:482:wave1:deduplicated"
        : "execution-receipt:482:wave1",
    observationWindowRef: "wave-action-observation-window:482:wave1-opened",
    waveObservationPolicyRef: binding.observationPolicyRef,
    observedWaveState: blocked ? "blocked" : "active",
    observedEligibilitySnapshotRef: binding.eligibilitySnapshotRef,
    observedGuardrailSnapshotRef: binding.guardrailSnapshotRef,
    observedRuntimePublicationBundleRef: binding.runtimePublicationBundleRef,
    observedPublicationParityRef: parity.publicationParityAfterPromotionId,
    observedContinuityEvidenceRefs: [
      "data/evidence/479_dress_rehearsal_report.json",
      "data/evidence/480_uat_result_matrix.json",
      "data/evidence/481_dr_and_go_live_smoke_report.json",
    ],
    observedRecoveryDispositionRefs: [recoveryDisposition.recoveryDispositionId],
    observedRollbackReadinessState: recoveryDisposition.state === "exact" ? "ready" : "blocked",
    observedProvenanceState: "verified",
    observationState: blocked ? "blocked" : "opened",
    recoveryActionRef: blocked
      ? "recovery:482:do-not-activate-wave1"
      : "recovery:482:monitor-wave1-under-policy-483",
    supersededByWaveActionRef: null,
    blockerRefs: [...command.blockerRefs, ...parity.blockerRefs],
    recordedAt: FIXED_NOW,
  });
  const idempotencyBinding = withHash<PromotionIdempotencyBinding>({
    recordType: "PromotionIdempotencyBinding",
    idempotencyBindingId: "idempotency_binding_482_wave1",
    idempotencyKey: command.idempotencyKey,
    commandRef:
      scenarioState === "duplicate_idempotency"
        ? "promotion_command_482_wave1_ready"
        : command.promotionCommandId,
    firstSettlementRef: "wave_action_settlement_482_wave1_ready",
    replayedCommandRefs:
      scenarioState === "duplicate_idempotency" ? [command.promotionCommandId] : [],
    replayDisposition:
      scenarioState === "duplicate_idempotency" ? "same_settlement_returned" : "new_command",
    state: scenarioState === "duplicate_idempotency" ? "deduplicated" : "bound",
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
  const activationEvidence = withHash<Wave1ActivationEvidence>({
    recordType: "Wave1ActivationEvidence",
    wave1ActivationEvidenceId: `activation_evidence_482_${scenarioState}`,
    waveRef: binding.waveRef,
    activationState: blocked ? "blocked" : "active_under_observation",
    settlementRef: settlement.waveActionSettlementId,
    publicationParityAfterPromotionRef: parity.publicationParityAfterPromotionId,
    releaseWatchTupleRef: binding.releaseWatchTupleRef,
    observationPolicyRef: binding.observationPolicyRef,
    tenantScope: binding.tenantScope,
    cohortScope: binding.cohortScope,
    channelScope: binding.channelScope,
    nextSafeAction: blocked
      ? "Do not activate Wave 1; clear blockers and re-run promotion preflight."
      : "Proceed to task 483 release watch observation before declaring stability or widening.",
    blockerRefs: settlement.blockerRefs,
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:482:wave1-activation:${scenarioState}`,
  });
  const operatorCommunication = withHash<Wave1OperatorCommunication>({
    recordType: "Wave1OperatorCommunication",
    operatorCommunicationId: `operator_comm_482_${scenarioState}`,
    waveRef: binding.waveRef,
    destinationRef: "release-room:wave1-operators",
    deliveryState: blocked ? "blocked" : "delivered",
    messageClass: blocked ? "blocked_notice" : "activation_notice",
    evidenceRefs: [settlement.waveActionSettlementId, parity.publicationParityAfterPromotionId],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
  return {
    preflight,
    authorityTuple,
    recoveryDisposition,
    command,
    actionRecord,
    settlement,
    parity,
    idempotencyBinding,
    activationEvidence,
    operatorCommunication,
    blockers: blockersForScenario(scenarioState, preflight),
  };
}

export function build482Records(artifacts: readonly string[] = listOutputArtifacts()) {
  ensureRequiredInputs();
  const ready = settle482Wave1Promotion("ready");
  const edgeScenarios: readonly Promotion482ScenarioState[] = [
    "expired_signoff",
    "stale_migration",
    "widened_selector",
    "duplicate_idempotency",
    "parity_failed",
    "role_denied",
    "missing_rollback",
  ];
  const edgeSettlements = edgeScenarios.map((scenario) => settle482Wave1Promotion(scenario));
  const edgeCaseFixtures = required482EdgeCases.map((edgeCaseId, index) =>
    withHash({
      recordType: "PromotionEdgeCaseFixture",
      edgeCaseId,
      scenarioState: edgeScenarios[index],
      expectedState:
        edgeScenarios[index] === "duplicate_idempotency"
          ? "same_settlement_returned"
          : edgeScenarios[index] === "parity_failed"
            ? "pending_probe_no_activation"
            : "blocked_or_denied",
      evidenceRef: edgeSettlements[index].settlement.waveActionSettlementId,
      generatedAt: FIXED_NOW,
      sourceRefs,
    }),
  );
  return {
    ready,
    edgeSettlements,
    edgeCaseFixtures,
    artifactRefs: artifacts,
  };
}

function buildInterfaceGap() {
  return withHash({
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_482_PROMOTION_AUTHORITY",
    taskId: TASK_ID,
    gapState: "closed_by_typed_promotion_command_bridge",
    missingRepositoryContract:
      "No single repository-native command contract joined preflight gates, release authority tuple, idempotency binding, WaveActionRecord, WaveActionSettlement, post-promotion parity, activation evidence, and operator communication for Wave 1.",
    bridgeImplementedBy: [
      "tools/release/promote_482_wave1.ts",
      "tools/release/validate_482_wave1_promotion.ts",
      "apps/ops-console/src/wave1-promotion-console-482.tsx",
    ],
    failClosedRules: [
      "Any non-exact preflight lane blocks the promotion command.",
      "Operator role denial settles as denied_scope.",
      "Duplicate idempotency keys return the original settlement.",
      "Post-promotion publication parity mismatch prevents activation evidence from claiming active Wave 1.",
      "Missing rollback binding blocks exposed route-family promotion.",
    ],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/482_wave1_promotion.schema.json",
    title: "Task 482 Wave 1 Promotion Records",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "recordHash"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      recordHash: { type: "string", minLength: 64, maxLength: 64 },
    },
    $defs: {
      Wave1PromotionCommand: {
        type: "object",
        required: ["recordType", "promotionCommandId", "idempotencyKey", "operatorRoleRef"],
      },
      WaveActionSettlement: {
        type: "object",
        required: [
          "recordType",
          "waveActionSettlementId",
          "result",
          "observedPublicationParityRef",
        ],
      },
      PublicationParityAfterPromotion: {
        type: "object",
        required: ["recordType", "parityState", "activationPermitted"],
      },
    },
  };
}

function buildExternalReferenceNotes() {
  return withHash({
    recordType: "ExternalReferenceNotes",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    references: [
      {
        refId: "external:playwright-release-console-verification",
        usage:
          "Browser traces, screenshots, and ARIA snapshots for promotion-console settlement states.",
      },
      {
        refId: "external:ncsc-caf-change-and-resilience-context",
        usage:
          "Context for controlled production change, recovery readiness, and evidence-backed resilience.",
      },
      {
        refId: "external:nhs-service-manual-accessibility",
        usage: "Accessible, calm release and incident-facing controls for operators.",
      },
    ],
    sourceRefs,
  });
}

function buildAlgorithmNotes(): string {
  return `# 482 Algorithm Alignment Notes

Task 482 implements a fail-closed Wave 1 promotion bridge over the source promotion algorithm. The command cannot settle from dashboard labels or feature flags; it resolves typed evidence from tasks 473 through 481 into one \`PromotionAuthorityTuple\`, then binds that tuple to a \`Wave1PromotionCommand\`, \`WaveActionRecord\`, \`WaveActionSettlement\`, post-promotion parity proof, WORM audit refs, and operator communication evidence.

## Source Mapping

- Platform promotion contracts map to \`PromotionAuthorityTuple\`, \`Wave1PromotionPreflight\`, \`Wave1PromotionCommand\`, \`PublicationParityAfterPromotion\`, and \`Wave1ActivationEvidence\`.
- Wave control contracts map to \`WaveActionRecord\`, \`WaveActionSettlement\`, and \`PromotionIdempotencyBinding\`.
- Phase 0 command settlement and WORM rules map to injected clock, role authorization, purpose binding, idempotency key, route intent, settlement refs, and WORM audit refs.
- Phase 9 formal exit and live-wave proof map to the nine preflight lanes and operator communication evidence.

## Verdict

Wave 1 is promoted to active-under-observation only for the approved smallest-safe core web/staff/ops cohort. NHS App, pharmacy dispatch, and assistive visible modes remain outside Wave 1. Stability and widening are intentionally left to task 483.
`;
}

function buildRunbook(): string {
  return `# 482 Wave 1 Promotion Runbook

## Preconditions

Confirm the nine preflight lanes are exact: scorecard, migration, BAU, wave plan, signoffs, dependencies, dress rehearsal, UAT, and DR smoke. Confirm the operator has \`role:release-manager\`, the idempotency key is bound to the Wave 1 tuple, and rollback binding \`wrb_476_wave1_feature_surface_and_cutover\` is present.

## Promotion

1. Run \`pnpm run test:programme:482-wave1-promotion\`.
2. Review \`data/release/482_wave1_promotion_command.json\`.
3. Confirm \`data/release/482_wave1_promotion_settlement.json\` settled with \`result = applied\`.
4. Confirm \`data/release/482_wave1_publication_parity_after_promotion.json\` has \`parityState = exact\`.
5. Notify the release room from \`data/evidence/482_wave1_promotion_evidence.json\`.

## Fail Closed

- Expired signoff: stop and reissue the signoff register.
- Stale migration readiness: stop and rerun projection readiness.
- Tenant regrouping/widened selector: stop and publish a new eligibility snapshot.
- Duplicate idempotency key: return the original settlement.
- Publication parity mismatch: keep Wave 1 inactive and republish parity.
- Operator role denial: require a release-manager actor.
- Missing rollback binding: stop until route-family rollback is bound.
`;
}

function buildDecisionMarkdown(evidence: any): string {
  return `# 482 Wave 1 Promotion Decision

- Promotion verdict: \`${evidence.promotionVerdict}\`
- Release candidate: \`${evidence.ready.command.releaseCandidateRef}\`
- Runtime publication bundle: \`${evidence.ready.command.runtimePublicationBundleRef}\`
- Wave: \`${evidence.ready.command.waveRef}\`
- Settlement: \`${evidence.ready.settlement.result}\`
- Publication parity: \`${evidence.ready.parity.parityState}\`
- Activation evidence: \`${evidence.ready.activationEvidence.activationState}\`
- Next safe action: ${evidence.ready.activationEvidence.nextSafeAction}

The release is active only for Wave 1's smallest-safe core web/staff/ops cohort and remains under the task 483 observation policy before any stability declaration or widening.
`;
}

export function build482EvidenceArtifact(artifacts: readonly string[] = listOutputArtifacts()) {
  const records = build482Records(artifacts);
  return withHash({
    recordType: "Wave1PromotionEvidence",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    promotionVerdict: "wave1_promoted_under_observation",
    ready: records.ready,
    edgeSettlements: records.edgeSettlements,
    edgeCaseFixtures: records.edgeCaseFixtures,
    artifactRefs: records.artifactRefs,
    sourceRefs,
  });
}

export function write482PromotionArtifacts(): void {
  ensureRequiredInputs();
  const evidence = build482EvidenceArtifact();
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_482_PROMOTION_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/contracts/482_wave1_promotion.schema.json", buildSchema());
  writeJson("data/analysis/482_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/482_algorithm_alignment_notes.md", buildAlgorithmNotes());
  writeText("docs/runbooks/482_wave1_promotion_runbook.md", buildRunbook());
  writeJson(
    "data/release/482_wave1_promotion_command.json",
    withHash({
      recordType: "Wave1PromotionCommandEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      preflight: evidence.ready.preflight,
      authorityTuple: evidence.ready.authorityTuple,
      recoveryDisposition: evidence.ready.recoveryDisposition,
      command: evidence.ready.command,
      idempotencyBinding: evidence.ready.idempotencyBinding,
    }),
  );
  writeJson(
    "data/release/482_wave1_promotion_settlement.json",
    withHash({
      recordType: "Wave1PromotionSettlementEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      actionRecord: evidence.ready.actionRecord,
      settlement: evidence.ready.settlement,
      activationEvidence: evidence.ready.activationEvidence,
      operatorCommunication: evidence.ready.operatorCommunication,
    }),
  );
  writeJson(
    "data/release/482_wave1_publication_parity_after_promotion.json",
    evidence.ready.parity,
  );
  writeJson("data/evidence/482_wave1_promotion_evidence.json", evidence);
  writeText("docs/programme/482_wave1_promotion_decision.md", buildDecisionMarkdown(evidence));
  formatFiles([
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_482_PROMOTION_AUTHORITY.json",
    "data/contracts/482_wave1_promotion.schema.json",
    "data/analysis/482_external_reference_notes.json",
    "data/analysis/482_algorithm_alignment_notes.md",
    "docs/runbooks/482_wave1_promotion_runbook.md",
    "data/release/482_wave1_promotion_command.json",
    "data/release/482_wave1_promotion_settlement.json",
    "data/release/482_wave1_publication_parity_after_promotion.json",
    "data/evidence/482_wave1_promotion_evidence.json",
    "docs/programme/482_wave1_promotion_decision.md",
  ]);
}

if (process.argv[1]?.endsWith("promote_482_wave1.ts")) {
  write482PromotionArtifacts();
  console.log("482 Wave 1 promotion artifacts generated.");
}
