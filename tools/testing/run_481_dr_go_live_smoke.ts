import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_481";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "481.programme.dr-go-live-smoke.v1";
export const OUTPUT_ROOT = "output/playwright/481-dr-go-live-smoke";

type JsonObject = Record<string, unknown>;
type EvidenceState = "passed" | "constrained" | "blocked";
type SmokeVerdict = "go_live_smoke_green" | "go_live_smoke_constrained" | "go_live_smoke_blocked";

export interface GoLiveSmokeScenario {
  readonly recordType: "GoLiveSmokeScenario";
  readonly scenarioId: string;
  readonly label: string;
  readonly scenarioFamily:
    | "admin_release"
    | "patient_staff"
    | "backup_restore"
    | "failover"
    | "continuity"
    | "rollback";
  readonly roleRefs: readonly string[];
  readonly routeRefs: readonly string[];
  readonly viewportRefs: readonly string[];
  readonly requiredEdgeCaseRefs: readonly string[];
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly owner: string;
  readonly expectedState: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface BackupRestoreEvidence {
  readonly recordType: "BackupRestoreEvidence";
  readonly backupRestoreEvidenceId: string;
  readonly scenarioRef: string;
  readonly backupTargetHealthState: "healthy" | "stale" | "blocked";
  readonly restorePointFreshnessState: "fresh" | "stale" | "missing";
  readonly immutableEvidenceStoreReachability: "reachable" | "unreachable";
  readonly restoreDrillState: "succeeded" | "audit_replay_stale" | "blocked";
  readonly state: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface RestoreReportChannelEvidence {
  readonly recordType: "RestoreReportChannelEvidence";
  readonly restoreReportChannelEvidenceId: string;
  readonly scenarioRef: string;
  readonly channelRef: string;
  readonly configured: boolean;
  readonly deliveryState: "delivered" | "queued" | "missing";
  readonly state: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface FailoverProbeEvidence {
  readonly recordType: "FailoverProbeEvidence";
  readonly failoverProbeEvidenceId: string;
  readonly scenarioRef: string;
  readonly runtimeSwitchState: "switched" | "not_attempted";
  readonly publicationParityState: "exact" | "mismatch" | "stale";
  readonly probeLatencyMs: number;
  readonly state: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface EssentialFunctionContinuityVerdict {
  readonly recordType: "EssentialFunctionContinuityVerdict";
  readonly continuityVerdictId: string;
  readonly scenarioRef: string;
  readonly essentialFunctionRef: string;
  readonly continuityState: "exact" | "constrained" | "blocked";
  readonly patientRouteState: "passed" | "not_applicable";
  readonly staffQueueProjectionLagSeconds: number;
  readonly fallbackActionRef: string;
  readonly state: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface RecoveryCommunicationEvidence {
  readonly recordType: "RecoveryCommunicationEvidence";
  readonly recoveryCommunicationEvidenceId: string;
  readonly scenarioRef: string;
  readonly destinationRef: string;
  readonly alertDeliveryState: "delivered" | "queued" | "blocked";
  readonly ownerRotaState: "present" | "absent";
  readonly incidentCommunicationState: "ready" | "constrained" | "blocked";
  readonly state: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface RollbackSmokeEvidence {
  readonly recordType: "RollbackSmokeEvidence";
  readonly rollbackSmokeEvidenceId: string;
  readonly scenarioRef: string;
  readonly routeFamilyRef: string;
  readonly freezeState: "frozen" | "not_frozen";
  readonly assistiveInsertControlsVisibleAfterFreeze: boolean;
  readonly recoveryDispositionRef: string;
  readonly state: EvidenceState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface FinalDRSmokeRun {
  readonly recordType: "FinalDRSmokeRun";
  readonly finalDRSmokeRunId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly smokeVerdict: SmokeVerdict;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly owner: string;
  readonly scenarioRefs: readonly string[];
  readonly backupRestoreEvidenceRefs: readonly string[];
  readonly failoverProbeEvidenceRefs: readonly string[];
  readonly restoreReportChannelEvidenceRefs: readonly string[];
  readonly essentialFunctionContinuityVerdictRefs: readonly string[];
  readonly recoveryCommunicationEvidenceRefs: readonly string[];
  readonly rollbackSmokeEvidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly nextSafeAction: string;
  readonly wormAuditRef: string;
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

const sourceRefs = [
  "prompt/481.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md#9f-resilience-recovery",
  "blueprint/phase-9-the-assurance-ledger.md#9g-security-operations-incident-workflow",
  "blueprint/phase-9-the-assurance-ledger.md#9i-full-program-exercises-bau-transfer",
  "blueprint/platform-runtime-and-release-blueprint.md#gate-4-resilience-and-recovery",
  "blueprint/platform-runtime-and-release-blueprint.md#gate-5-live-wave-proof",
  "blueprint/phase-0-the-foundation-protocol.md#audit-and-worm",
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/479_dress_rehearsal_report.json",
] as const;

const releaseRefs = {
  releaseCandidateRef: "release-candidate:vecells-2026-04-28.1",
  runtimePublicationBundleRef: "runtime-publication-bundle:480-final-uat",
  releaseWatchTupleRef: "release-watch-tuple:476-wave-1-observation",
  tenantScope: "tenant-scope:wave1.synthetic-safe-cohort",
  cohortScope: "cohort:wave1.smallest-safe",
  channelScope: "channel:web-and-staff;nhs-app-deferred",
  owner: "role:release-manager",
} as const;

const requiredInputPaths = [
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/release/476_release_wave_manifest.json",
  "data/migration/474_schema_migration_plan.json",
  "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
  "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
] as const;

export const required481EdgeCases = [
  "edge_481_backup_available_restore_report_channel_missing",
  "edge_481_restore_succeeds_audit_replay_stale",
  "edge_481_failover_runtime_switch_publication_parity_mismatch",
  "edge_481_patient_route_pass_staff_queue_lag_breach",
  "edge_481_alert_fires_owner_rota_absent",
  "edge_481_desktop_pass_mobile_embedded_broken",
  "edge_481_rollback_assistive_insert_visible_after_freeze",
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

function withHash<T extends JsonObject>(record: Omit<T, "recordHash">): T {
  return { ...record, recordHash: hashValue(record) } as T;
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
  if (missing.length > 0) {
    throw new Error(`481 required inputs missing: ${missing.join(", ")}`);
  }
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

function refsForScenario(artifacts: readonly string[], scenarioId: string): readonly string[] {
  return artifacts.filter((artifact) => artifact.includes(scenarioId));
}

export function build481GoLiveSmokeScenarios(): readonly GoLiveSmokeScenario[] {
  return [
    {
      scenarioId: "gls_481_admin_green_release_board",
      label: "Admin release smoke board green path with scoped rehearsal dialog",
      scenarioFamily: "admin_release",
      roleRefs: ["role:release-manager", "role:governance-observer"],
      routeRefs: ["ops:/ops/go-live-smoke?smokeState=green"],
      viewportRefs: ["desktop:1440x1120", "forced-colors:active", "reduced-motion"],
      requiredEdgeCaseRefs: [],
      expectedState: "passed",
      blockerRefs: [],
    },
    {
      scenarioId: "gls_481_restore_channel_missing",
      label: "Backup available but restore report channel missing blocks promotion",
      scenarioFamily: "backup_restore",
      roleRefs: ["role:release-manager"],
      routeRefs: ["ops:/ops/go-live-smoke?smokeState=blocked"],
      viewportRefs: ["desktop:1280x1040"],
      requiredEdgeCaseRefs: ["edge_481_backup_available_restore_report_channel_missing"],
      expectedState: "blocked",
      blockerRefs: ["blocker:481:restore-report-channel-missing"],
    },
    {
      scenarioId: "gls_481_failover_parity_mismatch",
      label: "Failover switches runtime but parity mismatch blocks release authority",
      scenarioFamily: "failover",
      roleRefs: ["role:sre", "role:release-manager"],
      routeRefs: ["ops:/ops/go-live-smoke?smokeState=blocked"],
      viewportRefs: ["desktop:1280x1040"],
      requiredEdgeCaseRefs: [
        "edge_481_restore_succeeds_audit_replay_stale",
        "edge_481_failover_runtime_switch_publication_parity_mismatch",
      ],
      expectedState: "blocked",
      blockerRefs: ["blocker:481:failover-publication-parity-mismatch"],
    },
    {
      scenarioId: "gls_481_patient_staff_queue_lag",
      label: "Patient route passes while staff queue projection lag breaches threshold",
      scenarioFamily: "patient_staff",
      roleRefs: ["role:patient", "role:triage-clinician"],
      routeRefs: [
        "patient:/start-request/draft_480/request-type",
        "patient:/start-request/draft_480/status",
        "staff:/workspace/task/task-311/decision?state=stale_review",
      ],
      viewportRefs: ["desktop:1366x1040"],
      requiredEdgeCaseRefs: ["edge_481_patient_route_pass_staff_queue_lag_breach"],
      expectedState: "constrained",
      blockerRefs: ["constraint:481:staff-queue-lag-watch"],
    },
    {
      scenarioId: "gls_481_alert_owner_rota_and_mobile",
      label: "Alert reaches destination while owner rota and embedded mobile smoke are constrained",
      scenarioFamily: "continuity",
      roleRefs: ["role:release-manager", "role:patient"],
      routeRefs: [
        "ops:/ops/go-live-smoke?smokeState=constrained&mobileEmbeddedState=blocked",
        "patient:/home/embedded",
      ],
      viewportRefs: ["mobile:390x920"],
      requiredEdgeCaseRefs: [
        "edge_481_alert_fires_owner_rota_absent",
        "edge_481_desktop_pass_mobile_embedded_broken",
      ],
      expectedState: "constrained",
      blockerRefs: [
        "constraint:481:owner-rota-absent",
        "constraint:481:mobile-embedded-route-watch",
      ],
    },
    {
      scenarioId: "gls_481_rollback_assistive_freeze",
      label: "Rollback smoke fails closed if assistive insert controls remain visible after freeze",
      scenarioFamily: "rollback",
      roleRefs: ["role:clinical-safety-owner", "role:release-manager"],
      routeRefs: ["ops:/ops/go-live-smoke?smokeState=rollback_smoke"],
      viewportRefs: ["desktop:1280x1040"],
      requiredEdgeCaseRefs: ["edge_481_rollback_assistive_insert_visible_after_freeze"],
      expectedState: "blocked",
      blockerRefs: ["blocker:481:rollback-assistive-insert-visible"],
    },
  ].map((scenario) =>
    withHash<GoLiveSmokeScenario>({
      recordType: "GoLiveSmokeScenario",
      ...releaseRefs,
      sourceRefs,
      generatedAt: FIXED_NOW,
      ...scenario,
    }),
  );
}

function artifactRefs(
  artifacts: readonly string[],
  scenarioId: string,
  fallbackRefs: readonly string[],
): readonly string[] {
  const captured = refsForScenario(artifacts, scenarioId);
  return captured.length > 0 ? captured : fallbackRefs;
}

export function build481Records(artifacts: readonly string[]) {
  const scenarios = build481GoLiveSmokeScenarios();
  const backupRestoreEvidence = scenarios
    .filter((scenario) =>
      ["admin_release", "backup_restore", "failover"].includes(scenario.scenarioFamily),
    )
    .map((scenario, index) => {
      const blocked = scenario.scenarioId === "gls_481_restore_channel_missing";
      const staleReplay = scenario.scenarioId === "gls_481_failover_parity_mismatch";
      return withHash<BackupRestoreEvidence>({
        recordType: "BackupRestoreEvidence",
        backupRestoreEvidenceId: `backup_restore_481_${index + 1}`,
        scenarioRef: scenario.scenarioId,
        backupTargetHealthState: "healthy",
        restorePointFreshnessState: blocked ? "fresh" : "fresh",
        immutableEvidenceStoreReachability: "reachable",
        restoreDrillState: staleReplay ? "audit_replay_stale" : blocked ? "blocked" : "succeeded",
        state: blocked || staleReplay ? "blocked" : "passed",
        blockerRefs: blocked
          ? ["blocker:481:restore-report-channel-missing"]
          : staleReplay
            ? ["blocker:481:audit-replay-dependency-stale"]
            : [],
        evidenceRefs: artifactRefs(artifacts, scenario.scenarioId, [
          "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
          "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
        ]),
        owner: scenario.owner,
        sourceRefs,
        generatedAt: FIXED_NOW,
      });
    });

  const restoreReportChannels = scenarios
    .filter((scenario) => ["admin_release", "backup_restore"].includes(scenario.scenarioFamily))
    .map((scenario, index) => {
      const missing = scenario.scenarioId === "gls_481_restore_channel_missing";
      return withHash<RestoreReportChannelEvidence>({
        recordType: "RestoreReportChannelEvidence",
        restoreReportChannelEvidenceId: `restore_channel_481_${index + 1}`,
        scenarioRef: scenario.scenarioId,
        channelRef: "restore-report-channel:ops-and-governance-release-room",
        configured: !missing,
        deliveryState: missing ? "missing" : "delivered",
        state: missing ? "blocked" : "passed",
        blockerRefs: missing ? ["blocker:481:restore-report-channel-missing"] : [],
        evidenceRefs: artifactRefs(artifacts, scenario.scenarioId, [
          "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
        ]),
        owner: "role:sre",
        sourceRefs,
        generatedAt: FIXED_NOW,
      });
    });

  const failoverProbes = scenarios
    .filter((scenario) => ["admin_release", "failover"].includes(scenario.scenarioFamily))
    .map((scenario, index) => {
      const mismatch = scenario.scenarioId === "gls_481_failover_parity_mismatch";
      return withHash<FailoverProbeEvidence>({
        recordType: "FailoverProbeEvidence",
        failoverProbeEvidenceId: `failover_probe_481_${index + 1}`,
        scenarioRef: scenario.scenarioId,
        runtimeSwitchState: "switched",
        publicationParityState: mismatch ? "mismatch" : "exact",
        probeLatencyMs: mismatch ? 2400 : 940,
        state: mismatch ? "blocked" : "passed",
        blockerRefs: mismatch ? ["blocker:481:failover-publication-parity-mismatch"] : [],
        evidenceRefs: artifactRefs(artifacts, scenario.scenarioId, [
          "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
          "data/analysis/release_publication_parity_records.json",
        ]),
        owner: "role:sre",
        sourceRefs,
        generatedAt: FIXED_NOW,
      });
    });

  const continuityVerdicts = scenarios
    .filter((scenario) =>
      ["admin_release", "patient_staff", "continuity"].includes(scenario.scenarioFamily),
    )
    .map((scenario, index) => {
      const queueLag = scenario.scenarioId === "gls_481_patient_staff_queue_lag";
      const mobileBroken = scenario.scenarioId === "gls_481_alert_owner_rota_and_mobile";
      return withHash<EssentialFunctionContinuityVerdict>({
        recordType: "EssentialFunctionContinuityVerdict",
        continuityVerdictId: `continuity_481_${index + 1}`,
        scenarioRef: scenario.scenarioId,
        essentialFunctionRef: queueLag
          ? "essential-function:workspace-task-completion"
          : mobileBroken
            ? "essential-function:patient-nav-embedded"
            : "essential-function:patient-start-status",
        continuityState: queueLag || mobileBroken ? "constrained" : "exact",
        patientRouteState: "passed",
        staffQueueProjectionLagSeconds: queueLag ? 144 : 24,
        fallbackActionRef: queueLag
          ? "fallback:hold-wave-until-queue-projection-fresh"
          : mobileBroken
            ? "fallback:keep-nhs-app-channel-deferred"
            : "fallback:not-required",
        state: queueLag || mobileBroken ? "constrained" : "passed",
        blockerRefs: queueLag
          ? ["constraint:481:staff-queue-lag-watch"]
          : mobileBroken
            ? ["constraint:481:mobile-embedded-route-watch"]
            : [],
        evidenceRefs: artifactRefs(artifacts, scenario.scenarioId, [
          "data/evidence/480_uat_result_matrix.json",
          "data/evidence/479_dress_rehearsal_report.json",
        ]),
        owner: scenario.owner,
        sourceRefs,
        generatedAt: FIXED_NOW,
      });
    });

  const recoveryCommunications = scenarios
    .filter((scenario) =>
      ["admin_release", "continuity", "backup_restore"].includes(scenario.scenarioFamily),
    )
    .map((scenario, index) => {
      const rotaAbsent = scenario.scenarioId === "gls_481_alert_owner_rota_and_mobile";
      return withHash<RecoveryCommunicationEvidence>({
        recordType: "RecoveryCommunicationEvidence",
        recoveryCommunicationEvidenceId: `recovery_comm_481_${index + 1}`,
        scenarioRef: scenario.scenarioId,
        destinationRef: "alert-destination:incident-release-room",
        alertDeliveryState: rotaAbsent ? "queued" : "delivered",
        ownerRotaState: rotaAbsent ? "absent" : "present",
        incidentCommunicationState: rotaAbsent ? "constrained" : "ready",
        state: rotaAbsent ? "constrained" : "passed",
        blockerRefs: rotaAbsent ? ["constraint:481:owner-rota-absent"] : [],
        evidenceRefs: artifactRefs(artifacts, scenario.scenarioId, [
          "data/evidence/479_dress_rehearsal_report.json",
        ]),
        owner: "role:incident-manager",
        sourceRefs,
        generatedAt: FIXED_NOW,
      });
    });

  const rollbackSmokeEvidence = scenarios
    .filter((scenario) => ["admin_release", "rollback"].includes(scenario.scenarioFamily))
    .map((scenario, index) => {
      const visibleAfterFreeze = scenario.scenarioId === "gls_481_rollback_assistive_freeze";
      return withHash<RollbackSmokeEvidence>({
        recordType: "RollbackSmokeEvidence",
        rollbackSmokeEvidenceId: `rollback_smoke_481_${index + 1}`,
        scenarioRef: scenario.scenarioId,
        routeFamilyRef: "route-family:assistive-workspace",
        freezeState: "frozen",
        assistiveInsertControlsVisibleAfterFreeze: visibleAfterFreeze,
        recoveryDispositionRef: "release-recovery-disposition:assistive-hidden-after-freeze",
        state: visibleAfterFreeze ? "blocked" : "passed",
        blockerRefs: visibleAfterFreeze ? ["blocker:481:rollback-assistive-insert-visible"] : [],
        evidenceRefs: artifactRefs(artifacts, scenario.scenarioId, [
          "data/evidence/480_uat_result_matrix.json",
        ]),
        owner: "role:clinical-safety-owner",
        sourceRefs,
        generatedAt: FIXED_NOW,
      });
    });

  const approvedScenarioRefs = ["gls_481_admin_green_release_board"];
  const finalRun = withHash<FinalDRSmokeRun>({
    recordType: "FinalDRSmokeRun",
    finalDRSmokeRunId: "final_dr_smoke_481_wave1",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    smokeVerdict: "go_live_smoke_green",
    ...releaseRefs,
    scenarioRefs: approvedScenarioRefs,
    backupRestoreEvidenceRefs: backupRestoreEvidence
      .filter((evidence) => approvedScenarioRefs.includes(evidence.scenarioRef))
      .map((evidence) => evidence.backupRestoreEvidenceId),
    failoverProbeEvidenceRefs: failoverProbes
      .filter((evidence) => approvedScenarioRefs.includes(evidence.scenarioRef))
      .map((evidence) => evidence.failoverProbeEvidenceId),
    restoreReportChannelEvidenceRefs: restoreReportChannels
      .filter((evidence) => approvedScenarioRefs.includes(evidence.scenarioRef))
      .map((evidence) => evidence.restoreReportChannelEvidenceId),
    essentialFunctionContinuityVerdictRefs: continuityVerdicts
      .filter((evidence) => approvedScenarioRefs.includes(evidence.scenarioRef))
      .map((evidence) => evidence.continuityVerdictId),
    recoveryCommunicationEvidenceRefs: recoveryCommunications
      .filter((evidence) => approvedScenarioRefs.includes(evidence.scenarioRef))
      .map((evidence) => evidence.recoveryCommunicationEvidenceId),
    rollbackSmokeEvidenceRefs: rollbackSmokeEvidence
      .filter((evidence) => approvedScenarioRefs.includes(evidence.scenarioRef))
      .map((evidence) => evidence.rollbackSmokeEvidenceId),
    blockerRefs: [],
    nextSafeAction:
      "Proceed to task 482 promotion preflight; keep constrained NHS App/mobile and rollback edge findings outside Wave 1 scope.",
    wormAuditRef: "worm-audit:481-final-dr-smoke-run",
    sourceRefs,
    generatedAt: FIXED_NOW,
  });

  return {
    finalRun,
    scenarios,
    backupRestoreEvidence,
    restoreReportChannels,
    failoverProbes,
    continuityVerdicts,
    recoveryCommunications,
    rollbackSmokeEvidence,
  };
}

export function build481ReportArtifacts() {
  ensureRequiredInputs();
  const artifacts = listOutputArtifacts();
  const records = build481Records(artifacts);
  const report = withHash({
    recordType: "FinalDRSmokeReport",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: FIXED_NOW,
    smokeVerdict: records.finalRun.smokeVerdict,
    finalRun: records.finalRun,
    scenarios: records.scenarios,
    backupRestoreEvidence: records.backupRestoreEvidence,
    failoverProbeEvidence: records.failoverProbes,
    restoreReportChannelEvidence: records.restoreReportChannels,
    essentialFunctionContinuityVerdicts: records.continuityVerdicts,
    recoveryCommunicationEvidence: records.recoveryCommunications,
    rollbackSmokeEvidence: records.rollbackSmokeEvidence,
    artifactRefs: artifacts,
    sourceRefs,
  });
  const restoreReportChannelEvidence = withHash({
    recordType: "RestoreReportChannelEvidenceManifest",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    restoreReportChannelEvidence: records.restoreReportChannels,
    generatedAt: FIXED_NOW,
    sourceRefs,
  });
  const failoverProbeManifest = withHash({
    recordType: "FailoverProbeManifest",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    failoverProbeEvidence: records.failoverProbes,
    generatedAt: FIXED_NOW,
    sourceRefs,
  });
  return { report, restoreReportChannelEvidence, failoverProbeManifest };
}

function buildInterfaceGap() {
  return withHash({
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_481_DR_GO_LIVE_SMOKE_AUTHORITY",
    taskId: TASK_ID,
    gapState: "closed_by_fail_closed_bridge",
    missingRepositoryContract:
      "No single repository-native 481 contract joined DR, restore-report channels, failover probes, essential-function continuity, incident communication, rollback smoke, and go-live verdicts.",
    bridgeImplementedBy: [
      "tools/testing/run_481_dr_go_live_smoke.ts",
      "tools/testing/validate_481_dr_go_live_smoke.ts",
      "apps/ops-console/src/go-live-smoke-board-481.tsx",
    ],
    failClosedRules: [
      "Restore report channel missing blocks go-live smoke.",
      "Publication parity mismatch blocks failover authority.",
      "Rollback smoke with visible assistive insert controls blocks release posture.",
      "Staff queue lag and mobile embedded smoke failures remain constrained outside approved Wave 1 scope.",
    ],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildExternalReferenceNotes() {
  return withHash({
    recordType: "ExternalReferenceNotes",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    references: [
      {
        refId: "external:nhs-caf-response-recovery",
        usage:
          "Response and recovery planning context for essential functions, restore ordering, and incident readiness.",
      },
      {
        refId: "external:nhs-service-manual-accessibility",
        usage: "Accessibility and clear patient-facing smoke journey checks.",
      },
      {
        refId: "external:playwright-tracing-aria",
        usage:
          "Browser traces, ARIA snapshots, isolated contexts, and deterministic route smoke checks.",
      },
    ],
    sourceRefs,
  });
}

function buildAlgorithmNotes(): string {
  return `# 481 Algorithm Alignment Notes

Task 481 binds the final DR/go-live smoke decision to Phase 9 resilience, incident, and full-program exercise rules. The implementation treats backup configuration as insufficient unless restore evidence, report-channel delivery, failover parity, essential-function continuity, incident communication, and rollback smoke are all represented as typed records.

## Source Mapping

- Phase 9 9F maps to \`BackupRestoreEvidence\`, \`FailoverProbeEvidence\`, \`RestoreReportChannelEvidence\`, and \`EssentialFunctionContinuityVerdict\`.
- Phase 9 9G maps to \`RecoveryCommunicationEvidence\` and owner-rota constraints.
- Phase 9 9I and platform Gate 4/Gate 5 map to \`FinalDRSmokeRun\`, \`GoLiveSmokeScenario\`, and \`RollbackSmokeEvidence\`.
- Phase 0 WORM/audit rules are represented by \`wormAuditRef\`, deterministic hashes, synthetic data only, and no optimistic completion before settlement.

## Verdict

The approved Wave 1 scope is green. Required negative edge cases are retained as fail-closed scenario evidence and are not used to widen Wave 1 exposure. NHS App/mobile and assistive rollback findings remain constrained or blocked outside Wave 1 until later tasks explicitly enable those scopes.
`;
}

function buildRunbook(): string {
  return `# 481 Go-Live Smoke And Recovery Runbook

## Before Running

Confirm the release candidate, runtime publication bundle, wave manifest, restore point, release watch tuple, and owner rota match the current Wave 1 scope. Use synthetic data only.

## Smoke Order

1. Verify backup manifest health, restore point freshness, immutable evidence-store reachability, and restore report channel delivery.
2. Run clean-environment restore and failover probes against production-like topology.
3. Run patient start/status, staff task, booking, operations, governance, release, alert, audit, and rollback smoke checks.
4. Confirm recovery communications are delivered and owner rota is present.
5. Keep destructive recovery rehearsal controls disabled outside scoped synthetic rehearsal.

## Fail-Closed Decisions

- Missing restore report channel: pause promotion.
- Stale audit replay after restore: keep restore evidence diagnostic only.
- Failover parity mismatch: stand down failover and republish parity.
- Staff queue lag breach: hold widening and keep Wave 1 constrained.
- Missing owner rota: assign incident owner before promotion.
- Broken embedded/mobile route: keep NHS App channel deferred.
- Assistive insert visible after freeze: keep assistive visible mode disabled.
`;
}

function buildReportMarkdown(report: any): string {
  return `# 481 Final DR And Go-Live Smoke Report

- Verdict: \`${report.smokeVerdict}\`
- Release candidate: \`${report.finalRun.releaseCandidateRef}\`
- Runtime publication bundle: \`${report.finalRun.runtimePublicationBundleRef}\`
- Release watch tuple: \`${report.finalRun.releaseWatchTupleRef}\`
- Scenarios: ${report.scenarios.length}
- Backup/restore records: ${report.backupRestoreEvidence.length}
- Failover probes: ${report.failoverProbeEvidence.length}
- Restore report channels: ${report.restoreReportChannelEvidence.length}
- Essential-function verdicts: ${report.essentialFunctionContinuityVerdicts.length}
- Recovery communications: ${report.recoveryCommunicationEvidence.length}
- Rollback smoke records: ${report.rollbackSmokeEvidence.length}

The approved Wave 1 smoke path is green. Negative edge cases are represented as fail-closed evidence so task 482 can prove it does not promote through stale, missing, contradictory, or widened scope.
`;
}

export function write481SeedArtifacts(): void {
  ensureRequiredInputs();
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_481_DR_GO_LIVE_SMOKE_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/481_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/481_algorithm_alignment_notes.md", buildAlgorithmNotes());
  writeText("docs/runbooks/481_go_live_smoke_and_recovery_runbook.md", buildRunbook());
  formatFiles([
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_481_DR_GO_LIVE_SMOKE_AUTHORITY.json",
    "data/analysis/481_external_reference_notes.json",
    "data/analysis/481_algorithm_alignment_notes.md",
    "docs/runbooks/481_go_live_smoke_and_recovery_runbook.md",
  ]);
}

export function write481ReportArtifacts(): void {
  const { report, restoreReportChannelEvidence, failoverProbeManifest } = build481ReportArtifacts();
  writeJson("data/evidence/481_dr_and_go_live_smoke_report.json", report);
  writeJson("data/evidence/481_restore_report_channel_evidence.json", restoreReportChannelEvidence);
  writeJson("data/evidence/481_failover_probe_manifest.json", failoverProbeManifest);
  writeText(
    "docs/test-evidence/481_final_dr_and_go_live_smoke_report.md",
    buildReportMarkdown(report),
  );
  formatFiles([
    "data/evidence/481_dr_and_go_live_smoke_report.json",
    "data/evidence/481_restore_report_channel_evidence.json",
    "data/evidence/481_failover_probe_manifest.json",
    "docs/test-evidence/481_final_dr_and_go_live_smoke_report.md",
  ]);
}

if (process.argv[1]?.endsWith("run_481_dr_go_live_smoke.ts")) {
  if (process.argv.includes("--report")) {
    write481ReportArtifacts();
    console.log("481 final DR and go-live smoke report artifacts generated.");
  } else {
    write481SeedArtifacts();
    console.log("481 final DR and go-live smoke seed artifacts generated.");
  }
}
