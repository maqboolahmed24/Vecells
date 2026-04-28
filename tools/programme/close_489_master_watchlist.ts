import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_489";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "489.programme.master-watchlist-closure.v1";
export const OUTPUT_ROOT = "output/playwright/489-continuous-improvement";

type JsonObject = Record<string, unknown>;
type ClosureDecision =
  | "closed"
  | "transferred_to_bau"
  | "transferred_to_ci"
  | "blocked_release"
  | "not_applicable"
  | "duplicate_superseded";
type ResidualRisk = "none" | "low" | "medium" | "high" | "blocking";
type OutcomeArea =
  | "safety"
  | "reliability"
  | "usability"
  | "accessibility"
  | "channel"
  | "assistive"
  | "records"
  | "security"
  | "support";

export type Programme489ScenarioState =
  | "complete_with_transfers"
  | "superseded_evidence_hash_closed"
  | "ci_downgrade_without_signoff_authority"
  | "conflicting_bau_ci_owner"
  | "assistive_action_missing_metric"
  | "nhs_app_old_manifest_after_activation"
  | "supplier_closed_without_contact_hygiene"
  | "active_wave_observation_final_complete";

interface ReleaseBinding489 {
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
}

interface WatchlistDefinition {
  readonly itemCode: string;
  readonly title: string;
  readonly itemType: "dependency" | "risk" | "exception" | "open_action" | "improvement";
  readonly sourceTaskRef: string;
  readonly evidenceRef: string;
  readonly defaultDecision: ClosureDecision;
  readonly owner: string;
  readonly targetOwner: string;
  readonly outcomeArea: OutcomeArea;
  readonly residualRisk: ResidualRisk;
  readonly nextReviewDate: string | null;
  readonly targetOutcomeMetric: string | null;
  readonly closureRationale: string;
  readonly signoffAuthorityRef: string | null;
}

export interface WatchlistItemClosureDecision {
  readonly recordType: "WatchlistItemClosureDecision";
  readonly watchlistItemClosureDecisionId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly itemCode: string;
  readonly itemType: WatchlistDefinition["itemType"];
  readonly title: string;
  readonly sourceTaskRef: string;
  readonly sourceEvidenceRef: string;
  readonly sourceEvidenceHash: string;
  readonly sourceEvidenceState: "current" | "superseded" | "missing";
  readonly closureDecision: ClosureDecision;
  readonly owner: string;
  readonly targetOwner: string;
  readonly closureRationale: string;
  readonly residualRisk: ResidualRisk;
  readonly nextReviewDate: string | null;
  readonly targetOutcomeMetricRef: string | null;
  readonly signoffAuthorityRef: string | null;
  readonly constrainedLaunchApprovalRef: string | null;
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface UnresolvedItemTransfer {
  readonly recordType: "UnresolvedItemTransfer";
  readonly unresolvedItemTransferId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly watchlistItemRef: string;
  readonly transferTarget: "bau" | "continuous_improvement" | "blocked_release";
  readonly owner: string;
  readonly targetCadenceRef: string | null;
  readonly targetBacklogItemRef: string | null;
  readonly residualRisk: ResidualRisk;
  readonly nextReviewDate: string | null;
  readonly targetOutcomeMetricRef: string | null;
  readonly transferState: "accepted" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ImprovementOutcomeMetric {
  readonly recordType: "ImprovementOutcomeMetric";
  readonly outcomeMetricId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly outcomeArea: OutcomeArea;
  readonly metricCode: string;
  readonly title: string;
  readonly baselineValue: string;
  readonly targetValue: string;
  readonly measurementSourceRef: string;
  readonly owner: string;
  readonly reviewCadenceRef: string;
  readonly state: "current" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ContinuousImprovementBacklogItem {
  readonly recordType: "ContinuousImprovementBacklogItem";
  readonly backlogItemId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly watchlistItemRef: string;
  readonly outcomeArea: OutcomeArea;
  readonly title: string;
  readonly owner: string;
  readonly outcomeMetricRef: string | null;
  readonly reviewCadenceRef: string | null;
  readonly dueDate: string;
  readonly sourceEvidenceRef: string;
  readonly closureCriteria: string;
  readonly backlogState: "seeded" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ReviewTrigger {
  readonly recordType: "ReviewTrigger";
  readonly reviewTriggerId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly triggerCode: string;
  readonly title: string;
  readonly outcomeArea: OutcomeArea;
  readonly cadenceOwnerRef: string;
  readonly triggerCondition: string;
  readonly targetMetricRef: string;
  readonly triggerState: "armed" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ContinuousImprovementBacklogSeed {
  readonly recordType: "ContinuousImprovementBacklogSeed";
  readonly continuousImprovementBacklogSeedId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Programme489ScenarioState;
  readonly backlogItems: readonly ContinuousImprovementBacklogItem[];
  readonly improvementOutcomeMetrics: readonly ImprovementOutcomeMetric[];
  readonly reviewTriggers: readonly ReviewTrigger[];
  readonly backlogState: "seeded" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface CadenceOwner {
  readonly recordType: "CadenceOwner";
  readonly cadenceOwnerId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly domain: OutcomeArea | "privacy" | "dependency_hygiene" | "release_verification" | "incident_lessons";
  readonly owner: string;
  readonly deputy: string;
  readonly cadence: "weekly" | "monthly" | "quarterly";
  readonly nextReviewAt: string;
  readonly metricRefs: readonly string[];
  readonly escalationRef: string;
  readonly cadenceState: "active" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface BAUMetricOwnership {
  readonly recordType: "BAUMetricOwnership";
  readonly bauMetricOwnershipId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly metricRef: string;
  readonly owner: string;
  readonly cadenceOwnerRef: string;
  readonly measurementSourceRef: string;
  readonly reportingCadence: "weekly" | "monthly" | "quarterly";
  readonly ownershipState: "accepted" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface PostLaunchAssuranceCadence {
  readonly recordType: "PostLaunchAssuranceCadence";
  readonly postLaunchAssuranceCadenceId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly cadenceOwnerRefs: readonly string[];
  readonly reviewTriggerRefs: readonly string[];
  readonly nextAssurancePackAt: string;
  readonly cadenceState: "active" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface DependencyReassessmentSchedule {
  readonly recordType: "DependencyReassessmentSchedule";
  readonly dependencyReassessmentScheduleId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly dependencyRefs: readonly string[];
  readonly owner: string;
  readonly nextReviewAt: string;
  readonly contactHygieneCadenceRef: string | null;
  readonly standardsWatchlistRef: string;
  readonly scheduleState: "active" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ClosureEvidenceSeal {
  readonly recordType: "ClosureEvidenceSeal";
  readonly closureEvidenceSealId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly closureRef: string;
  readonly archiveManifestRef: string;
  readonly archiveWormSealDigest: string;
  readonly watchlistDecisionHash: string;
  readonly transferRegisterHash: string;
  readonly ciBacklogHash: string;
  readonly cadenceHash: string;
  readonly sealHash: string;
  readonly sealAlgorithm: "sha256-canonical-json-v1";
  readonly sealedAt: string;
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ProgrammeClosureCommand {
  readonly recordType: "ProgrammeClosureCommand";
  readonly programmeClosureCommandId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly roleAuthorizationRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly requestedFinalState: "complete" | "complete_with_transfers" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ProgrammeClosureSettlement {
  readonly recordType: "ProgrammeClosureSettlement";
  readonly programmeClosureSettlementId: string;
  readonly scenarioId: Programme489ScenarioState;
  readonly programmeClosureCommandRef: string;
  readonly result: "settled" | "blocked";
  readonly authoritativeOutcomeState: "settled" | "recovery_required";
  readonly finalProgrammeStateRef: string;
  readonly closureEvidenceSealRef: string;
  readonly unresolvedTransferCount: number;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ProgrammeFinalState {
  readonly recordType: "ProgrammeFinalState";
  readonly programmeFinalStateId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Programme489ScenarioState;
  readonly finalState: "complete" | "complete_with_transfers" | "blocked";
  readonly completionLanguageGuard: "ongoing_ownership_explicit";
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly archiveManifestRef: string;
  readonly archiveWormSealDigest: string;
  readonly activeWaveStatus: "closed" | "active" | "blocked";
  readonly activeWaveObservationState: "satisfied" | "active" | "blocked";
  readonly masterWatchlistClosureRef: string;
  readonly continuousImprovementBacklogSeedRef: string;
  readonly bauCadenceOwnershipRef: string;
  readonly unresolvedItemTransferRegisterRef: string;
  readonly closureEvidenceSealRef: string;
  readonly programmeClosureCommandRef: string;
  readonly programmeClosureSettlementRef: string;
  readonly unresolvedTransferCount: number;
  readonly blockedReleaseCount: number;
  readonly nextProgrammeReviewAt: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface MasterDependencyWatchlistClosure {
  readonly recordType: "MasterDependencyWatchlistClosure";
  readonly masterDependencyWatchlistClosureId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Programme489ScenarioState;
  readonly closureState: "complete" | "complete_with_transfers" | "blocked";
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly archiveManifestRef: string;
  readonly programmeFinalStateRef: string;
  readonly watchlistItemClosureDecisionRefs: readonly string[];
  readonly unresolvedItemTransferRefs: readonly string[];
  readonly continuousImprovementBacklogSeedRef: string;
  readonly bauCadenceOwnershipRef: string;
  readonly closureEvidenceSealRef: string;
  readonly unresolvedTransferCount: number;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export const required489EdgeCases: readonly Programme489ScenarioState[] = [
  "superseded_evidence_hash_closed",
  "ci_downgrade_without_signoff_authority",
  "conflicting_bau_ci_owner",
  "assistive_action_missing_metric",
  "nhs_app_old_manifest_after_activation",
  "supplier_closed_without_contact_hygiene",
  "active_wave_observation_final_complete",
] as const;

const releaseBinding: ReleaseBinding489 = {
  releaseRef: "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
  releaseCandidateRef: "RC_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releasePublicationParityRef: "rpp::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  watchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
  tenantScope: "tenant-demo-gp:programme-core-release",
  cohortScope: "cohort:programme-closure-to-ci",
  channelScope: "channel:core-web-staff-pharmacy-nhs-app-assistive",
};

const sourceRefs = [
  "prompt/489.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md#9h-tenant-governance-config-immutability-and-dependency-hygiene",
  "blueprint/phase-9-the-assurance-ledger.md#9i-full-program-exercises-bau-transfer-and-formal-exit-gate",
  "blueprint/platform-runtime-and-release-blueprint.md#releasewatchtuple",
  "blueprint/platform-runtime-and-release-blueprint.md#operational-readiness-contract",
  "blueprint/phase-0-the-foundation-protocol.md#commandsettlementrecord",
  "blueprint/governance-admin-console-frontend-blueprint.md#standardsdependencywatchlist",
] as const;

const requiredInputPaths = [
  "data/conformance/472_cross_phase_conformance_scorecard.json",
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/release/476_release_wave_manifest.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
  "data/assistive/485_assistive_enablement_settlements.json",
  "data/channel/486_nhs_app_channel_enablement_settlement.json",
  "data/bau/487_bau_handover_pack.json",
  "data/bau/487_bau_open_actions_register.json",
  "data/archive/488_launch_evidence_archive_manifest.json",
  "data/archive/488_capa_and_continuous_improvement_actions.json",
] as const;

const watchlistDefinitions: readonly WatchlistDefinition[] = [
  {
    itemCode: "phase7_channel_reconciliation",
    title: "Phase 7 deferred channel reconciliation carried into the master scorecard",
    itemType: "dependency",
    sourceTaskRef: "seq_473",
    evidenceRef: "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    defaultDecision: "closed",
    owner: "svc-owner:programme-governance",
    targetOwner: "svc-owner:programme-governance",
    outcomeArea: "channel",
    residualRisk: "none",
    nextReviewDate: null,
    targetOutcomeMetric: null,
    closureRationale: "Master conformance scorecard includes Phase 7 channel readiness with exact source refs.",
    signoffAuthorityRef: "role-auth:programme-governance:scorecard-close",
  },
  {
    itemCode: "release_wave_observation",
    title: "Release watch tuple and wave observation remain closed for programme exit",
    itemType: "risk",
    sourceTaskRef: "seq_483",
    evidenceRef: "data/release/483_wave1_stability_verdict.json",
    defaultDecision: "closed",
    owner: "svc-owner:release",
    targetOwner: "svc-owner:release",
    outcomeArea: "reliability",
    residualRisk: "none",
    nextReviewDate: null,
    targetOutcomeMetric: null,
    closureRationale: "Wave observation is satisfied and later widening evidence is archived.",
    signoffAuthorityRef: "role-auth:release-governance:stabilization-close",
  },
  {
    itemCode: "supplier_contact_retest",
    title: "Supplier escalation route retest after BAU contact rotation",
    itemType: "open_action",
    sourceTaskRef: "seq_487",
    evidenceRef: "data/bau/487_bau_open_actions_register.json",
    defaultDecision: "transferred_to_bau",
    owner: "svc-owner:supplier-management",
    targetOwner: "svc-owner:supplier-management",
    outcomeArea: "support",
    residualRisk: "low",
    nextReviewDate: "2026-05-03",
    targetOutcomeMetric: "metric_489_supplier_contact_hygiene",
    closureRationale: "Launch is not blocked, but the retest remains owned by supplier BAU cadence.",
    signoffAuthorityRef: "role-auth:service-owner:bau-transfer",
  },
  {
    itemCode: "support_feedback_triage",
    title: "First-week support feedback converted into outcome-driven improvement",
    itemType: "improvement",
    sourceTaskRef: "seq_487",
    evidenceRef: "data/bau/487_bau_open_actions_register.json",
    defaultDecision: "transferred_to_ci",
    owner: "svc-owner:continuous-improvement",
    targetOwner: "svc-owner:continuous-improvement",
    outcomeArea: "support",
    residualRisk: "low",
    nextReviewDate: "2026-05-08",
    targetOutcomeMetric: "metric_489_support_feedback_triage",
    closureRationale: "Support feedback is explicitly non-release-blocking and has a CI owner.",
    signoffAuthorityRef: "role-auth:service-owner:bau-transfer",
  },
  {
    itemCode: "manual_fallback_retest",
    title: "Manual fallback drill retest seeded from lessons learned",
    itemType: "improvement",
    sourceTaskRef: "seq_488",
    evidenceRef: "data/archive/488_capa_and_continuous_improvement_actions.json",
    defaultDecision: "transferred_to_ci",
    owner: "svc-owner:supplier-management",
    targetOwner: "svc-owner:supplier-management",
    outcomeArea: "reliability",
    residualRisk: "medium",
    nextReviewDate: "2026-05-28",
    targetOutcomeMetric: "metric_489_manual_fallback_retest",
    closureRationale: "The launch lesson has a CAPA and measurable fallback retest cadence.",
    signoffAuthorityRef: "role-auth:records-governance:archive-seal",
  },
  {
    itemCode: "content_copy_drift",
    title: "UAT content drift converted into monthly governed content checks",
    itemType: "improvement",
    sourceTaskRef: "seq_488",
    evidenceRef: "data/archive/488_capa_and_continuous_improvement_actions.json",
    defaultDecision: "transferred_to_ci",
    owner: "svc-owner:content-governance",
    targetOwner: "svc-owner:content-governance",
    outcomeArea: "usability",
    residualRisk: "low",
    nextReviewDate: "2026-06-28",
    targetOutcomeMetric: "metric_489_content_copy_drift",
    closureRationale: "The finding is captured as an outcome check rather than a vague backlog note.",
    signoffAuthorityRef: "role-auth:records-governance:archive-seal",
  },
  {
    itemCode: "assistive_trust_monitoring",
    title: "Assistive visible-mode monitoring transferred to trust cadence",
    itemType: "dependency",
    sourceTaskRef: "seq_485",
    evidenceRef: "data/assistive/485_assistive_enablement_settlements.json",
    defaultDecision: "transferred_to_ci",
    owner: "svc-owner:assistive-trust",
    targetOwner: "svc-owner:assistive-trust",
    outcomeArea: "assistive",
    residualRisk: "medium",
    nextReviewDate: "2026-05-14",
    targetOutcomeMetric: "metric_489_assistive_trust_monitoring",
    closureRationale: "Visible modes remain approved only while trust metrics and review cadence stay current.",
    signoffAuthorityRef: "role-auth:assistive-governance:cohort-enable",
  },
  {
    itemCode: "nhs_app_monthly_data",
    title: "NHS App monthly data and journey-change governance remains owned post activation",
    itemType: "dependency",
    sourceTaskRef: "seq_486",
    evidenceRef: "data/channel/486_nhs_app_channel_enablement_settlement.json",
    defaultDecision: "transferred_to_bau",
    owner: "svc-owner:nhs-app-channel",
    targetOwner: "svc-owner:nhs-app-channel",
    outcomeArea: "channel",
    residualRisk: "low",
    nextReviewDate: "2026-05-28",
    targetOutcomeMetric: "metric_489_nhs_app_monthly_data",
    closureRationale: "Channel activation is applied and ongoing obligations transfer to channel BAU cadence.",
    signoffAuthorityRef: "role-auth:channel-governance:nhs-app-enable",
  },
  {
    itemCode: "records_archive_review",
    title: "Launch archive retention, legal hold and export posture remain sealed",
    itemType: "dependency",
    sourceTaskRef: "seq_488",
    evidenceRef: "data/archive/488_launch_evidence_archive_manifest.json",
    defaultDecision: "closed",
    owner: "svc-owner:records-governance",
    targetOwner: "svc-owner:records-governance",
    outcomeArea: "records",
    residualRisk: "none",
    nextReviewDate: null,
    targetOutcomeMetric: null,
    closureRationale: "The evidence vault is sealed with explicit retention and export posture.",
    signoffAuthorityRef: "role-auth:records-governance:archive-seal",
  },
  {
    itemCode: "dependency_hygiene_legacy_scan",
    title: "Standards and dependency hygiene cadence replaces the launch watchlist",
    itemType: "dependency",
    sourceTaskRef: "phase9-9h",
    evidenceRef: "data/readiness/478_external_dependency_readiness_matrix.json",
    defaultDecision: "transferred_to_ci",
    owner: "svc-owner:dependency-hygiene",
    targetOwner: "svc-owner:dependency-hygiene",
    outcomeArea: "security",
    residualRisk: "medium",
    nextReviewDate: "2026-05-28",
    targetOutcomeMetric: "metric_489_dependency_hygiene",
    closureRationale: "Standards and supplier drift move into recurring reassessment with owner and cadence.",
    signoffAuthorityRef: "role-auth:security-governance:dependency-hygiene",
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

function uniq(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function scenarioLabel(scenarioId: Programme489ScenarioState): string {
  return scenarioId.replace(/_/g, "-");
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
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
  const missing = requiredInputPaths.filter((relativePath) => !fs.existsSync(path.join(ROOT, relativePath)));
  if (missing.length > 0) throw new Error(`489 required inputs missing: ${missing.join(", ")}`);
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

function evidenceHash(relativePath: string): string {
  const absolutePath = path.join(ROOT, relativePath);
  const content = fs.existsSync(absolutePath) ? readText(relativePath) : relativePath;
  return hashValue({ evidenceRef: relativePath, content });
}

function archiveManifest() {
  return readJson<any>("data/archive/488_launch_evidence_archive_manifest.json").activeManifest;
}

function defaultMetricTitle(metricRef: string): string {
  return metricRef
    .replace(/^metric_489_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function blockersForDefinition(
  scenarioId: Programme489ScenarioState,
  definition: WatchlistDefinition,
  decision: ClosureDecision,
): string[] {
  if (scenarioId === "superseded_evidence_hash_closed" && definition.itemCode === "content_copy_drift") {
    return ["blocker:489:closed-item-uses-superseded-evidence-hash"];
  }
  if (scenarioId === "ci_downgrade_without_signoff_authority" && definition.itemCode === "release_wave_observation") {
    return ["blocker:489:blocker-downgraded-to-ci-without-authority"];
  }
  if (scenarioId === "assistive_action_missing_metric" && definition.itemCode === "assistive_trust_monitoring") {
    return ["blocker:489:assistive-monitoring-missing-metric-or-cadence"];
  }
  if (scenarioId === "nhs_app_old_manifest_after_activation" && definition.itemCode === "nhs_app_monthly_data") {
    return ["blocker:489:nhs-app-item-references-old-manifest-after-activation"];
  }
  if (scenarioId === "supplier_closed_without_contact_hygiene" && definition.itemCode === "supplier_contact_retest") {
    return ["blocker:489:supplier-dependency-closed-without-contact-hygiene-cadence"];
  }
  if (decision === "blocked_release") return ["blocker:489:launch-blocking-item-unresolved"];
  return [];
}

function scenarioDecision(
  scenarioId: Programme489ScenarioState,
  definition: WatchlistDefinition,
): ClosureDecision {
  if (scenarioId === "ci_downgrade_without_signoff_authority" && definition.itemCode === "release_wave_observation") {
    return "transferred_to_ci";
  }
  if (scenarioId === "supplier_closed_without_contact_hygiene" && definition.itemCode === "supplier_contact_retest") {
    return "closed";
  }
  return definition.defaultDecision;
}

function buildWatchlistDecisions(
  scenarioId: Programme489ScenarioState,
): readonly WatchlistItemClosureDecision[] {
  return watchlistDefinitions.map((definition) => {
    const decision = scenarioDecision(scenarioId, definition);
    const blockers = blockersForDefinition(scenarioId, definition, decision);
    const sourceEvidenceState =
      scenarioId === "superseded_evidence_hash_closed" && definition.itemCode === "content_copy_drift"
        ? "superseded"
        : fs.existsSync(path.join(ROOT, definition.evidenceRef))
          ? "current"
          : "missing";
    const missingMetric =
      scenarioId === "assistive_action_missing_metric" && definition.itemCode === "assistive_trust_monitoring";
    const oldManifest =
      scenarioId === "nhs_app_old_manifest_after_activation" && definition.itemCode === "nhs_app_monthly_data";
    return withHash<WatchlistItemClosureDecision>({
      recordType: "WatchlistItemClosureDecision",
      watchlistItemClosureDecisionId: `watchlist_decision_489_${scenarioLabel(scenarioId)}_${definition.itemCode}`,
      scenarioId,
      itemCode: definition.itemCode,
      itemType: definition.itemType,
      title: definition.title,
      sourceTaskRef: definition.sourceTaskRef,
      sourceEvidenceRef: oldManifest ? "nhsapp-manifest-v0.0.legacy" : definition.evidenceRef,
      sourceEvidenceHash:
        sourceEvidenceState === "superseded"
          ? hashValue({ superseded: definition.evidenceRef, version: "previous" })
          : evidenceHash(definition.evidenceRef),
      sourceEvidenceState,
      closureDecision: decision,
      owner: definition.owner,
      targetOwner: definition.targetOwner,
      closureRationale: definition.closureRationale,
      residualRisk: decision === "closed" ? (blockers.length > 0 ? "blocking" : "none") : definition.residualRisk,
      nextReviewDate:
        missingMetric || (scenarioId === "supplier_closed_without_contact_hygiene" && definition.itemCode === "supplier_contact_retest")
          ? null
          : definition.nextReviewDate,
      targetOutcomeMetricRef: missingMetric ? null : definition.targetOutcomeMetric,
      signoffAuthorityRef:
        scenarioId === "ci_downgrade_without_signoff_authority" && definition.itemCode === "release_wave_observation"
          ? null
          : definition.signoffAuthorityRef,
      constrainedLaunchApprovalRef:
        decision === "blocked_release" ? null : decision === "closed" ? null : "approval:489:constrained-launch-transfer",
      evidenceRefs: [definition.evidenceRef],
      blockerRefs: blockers,
      sourceRefs,
      wormAuditRef: `worm-ledger:489:watchlist-decision:${scenarioLabel(scenarioId)}:${definition.itemCode}`,
    });
  });
}

function buildTransfers(
  scenarioId: Programme489ScenarioState,
  decisions: readonly WatchlistItemClosureDecision[],
): readonly UnresolvedItemTransfer[] {
  const transfers = decisions
    .filter((decision) =>
      ["transferred_to_bau", "transferred_to_ci", "blocked_release"].includes(decision.closureDecision),
    )
    .map((decision) => {
      const transferTarget =
        decision.closureDecision === "transferred_to_bau"
          ? "bau"
          : decision.closureDecision === "transferred_to_ci"
            ? "continuous_improvement"
            : "blocked_release";
      const blockers = [...decision.blockerRefs];
      return withHash<UnresolvedItemTransfer>({
        recordType: "UnresolvedItemTransfer",
        unresolvedItemTransferId: `unresolved_transfer_489_${scenarioLabel(scenarioId)}_${decision.itemCode}_${transferTarget}`,
        scenarioId,
        watchlistItemRef: decision.watchlistItemClosureDecisionId,
        transferTarget,
        owner: decision.targetOwner,
        targetCadenceRef:
          transferTarget === "blocked_release" ? null : `cadence_owner_489_${scenarioLabel(scenarioId)}_${decision.itemCode}`,
        targetBacklogItemRef:
          transferTarget === "continuous_improvement"
            ? `ci_backlog_item_489_${scenarioLabel(scenarioId)}_${decision.itemCode}`
            : null,
        residualRisk: decision.residualRisk,
        nextReviewDate: decision.nextReviewDate,
        targetOutcomeMetricRef: decision.targetOutcomeMetricRef,
        transferState: blockers.length > 0 ? "blocked" : "accepted",
        blockerRefs: blockers,
        sourceRefs,
        wormAuditRef: `worm-ledger:489:unresolved-transfer:${scenarioLabel(scenarioId)}:${decision.itemCode}:${transferTarget}`,
      });
    });

  if (scenarioId !== "conflicting_bau_ci_owner") return transfers;
  const base = transfers.find((transfer) => transfer.watchlistItemRef.includes("supplier_contact_retest"));
  if (!base) return transfers;
  const conflict = withHash<UnresolvedItemTransfer>({
    ...base,
    unresolvedItemTransferId: `unresolved_transfer_489_${scenarioLabel(scenarioId)}_supplier_contact_retest_continuous_improvement_conflict`,
    transferTarget: "continuous_improvement",
    owner: "svc-owner:operations-control",
    targetBacklogItemRef: `ci_backlog_item_489_${scenarioLabel(scenarioId)}_supplier_contact_retest`,
    transferState: "blocked",
    blockerRefs: ["blocker:489:unresolved-item-has-conflicting-bau-and-ci-owners"],
    wormAuditRef: `worm-ledger:489:unresolved-transfer:${scenarioLabel(scenarioId)}:supplier_contact_retest:conflict`,
  });
  return [...transfers, conflict];
}

function buildMetrics(
  scenarioId: Programme489ScenarioState,
  decisions: readonly WatchlistItemClosureDecision[],
): readonly ImprovementOutcomeMetric[] {
  return decisions
    .filter((decision) => decision.targetOutcomeMetricRef)
    .map((decision) =>
      withHash<ImprovementOutcomeMetric>({
        recordType: "ImprovementOutcomeMetric",
        outcomeMetricId: decision.targetOutcomeMetricRef as string,
        scenarioId,
        outcomeArea: watchlistDefinitions.find((definition) => definition.itemCode === decision.itemCode)?.outcomeArea ?? "support",
        metricCode: (decision.targetOutcomeMetricRef as string).replace(/^metric_489_/, ""),
        title: defaultMetricTitle(decision.targetOutcomeMetricRef as string),
        baselineValue: "launch-baseline-established",
        targetValue: decision.residualRisk === "medium" ? "two-clean-review-cycles" : "one-clean-review-cycle",
        measurementSourceRef: decision.sourceEvidenceRef,
        owner: decision.targetOwner,
        reviewCadenceRef: `cadence_owner_489_${scenarioLabel(scenarioId)}_${decision.itemCode}`,
        state: decision.blockerRefs.length > 0 ? "blocked" : "current",
        blockerRefs: decision.blockerRefs,
        sourceRefs,
      }),
    );
}

function buildBacklogItems(
  scenarioId: Programme489ScenarioState,
  decisions: readonly WatchlistItemClosureDecision[],
): readonly ContinuousImprovementBacklogItem[] {
  return decisions
    .filter((decision) => decision.closureDecision === "transferred_to_ci")
    .map((decision) =>
      withHash<ContinuousImprovementBacklogItem>({
        recordType: "ContinuousImprovementBacklogItem",
        backlogItemId: `ci_backlog_item_489_${scenarioLabel(scenarioId)}_${decision.itemCode}`,
        scenarioId,
        watchlistItemRef: decision.watchlistItemClosureDecisionId,
        outcomeArea: watchlistDefinitions.find((definition) => definition.itemCode === decision.itemCode)?.outcomeArea ?? "support",
        title: decision.title,
        owner: decision.targetOwner,
        outcomeMetricRef: decision.targetOutcomeMetricRef,
        reviewCadenceRef: decision.nextReviewDate ? `cadence_owner_489_${scenarioLabel(scenarioId)}_${decision.itemCode}` : null,
        dueDate: decision.nextReviewDate ?? "2026-05-28",
        sourceEvidenceRef: decision.sourceEvidenceRef,
        closureCriteria: `Outcome metric ${decision.targetOutcomeMetricRef ?? "missing"} demonstrates controlled residual risk.`,
        backlogState:
          decision.blockerRefs.length > 0 || !decision.targetOutcomeMetricRef || !decision.nextReviewDate ? "blocked" : "seeded",
        blockerRefs: uniq([
          ...decision.blockerRefs,
          ...(!decision.targetOutcomeMetricRef ? ["blocker:489:ci-backlog-item-missing-outcome-metric"] : []),
          ...(!decision.nextReviewDate ? ["blocker:489:ci-backlog-item-missing-review-cadence"] : []),
        ]),
        sourceRefs,
      }),
    );
}

function buildReviewTriggers(
  scenarioId: Programme489ScenarioState,
  metrics: readonly ImprovementOutcomeMetric[],
): readonly ReviewTrigger[] {
  return metrics.map((metric) =>
    withHash<ReviewTrigger>({
      recordType: "ReviewTrigger",
      reviewTriggerId: `review_trigger_489_${scenarioLabel(scenarioId)}_${metric.metricCode}`,
      scenarioId,
      triggerCode: metric.metricCode,
      title: `Review ${metric.title}`,
      outcomeArea: metric.outcomeArea,
      cadenceOwnerRef: metric.reviewCadenceRef,
      triggerCondition: "metric misses target, evidence hash drifts, or owner does not attest by review date",
      targetMetricRef: metric.outcomeMetricId,
      triggerState: metric.blockerRefs.length > 0 ? "blocked" : "armed",
      blockerRefs: metric.blockerRefs,
      sourceRefs,
    }),
  );
}

function buildBacklogSeed(
  scenarioId: Programme489ScenarioState,
  decisions: readonly WatchlistItemClosureDecision[],
): ContinuousImprovementBacklogSeed {
  const metrics = buildMetrics(scenarioId, decisions);
  const backlogItems = buildBacklogItems(scenarioId, decisions);
  const reviewTriggers = buildReviewTriggers(scenarioId, metrics);
  const blockerRefs = uniq([
    ...backlogItems.flatMap((item) => item.blockerRefs),
    ...metrics.flatMap((metric) => metric.blockerRefs),
    ...reviewTriggers.flatMap((trigger) => trigger.blockerRefs),
  ]);
  return withHash<ContinuousImprovementBacklogSeed>({
    recordType: "ContinuousImprovementBacklogSeed",
    continuousImprovementBacklogSeedId: `ci_backlog_seed_489_${scenarioLabel(scenarioId)}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    backlogItems,
    improvementOutcomeMetrics: metrics,
    reviewTriggers,
    backlogState: blockerRefs.length > 0 ? "blocked" : "seeded",
    blockerRefs,
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:489:ci-backlog-seed:${scenarioLabel(scenarioId)}`,
  });
}

function buildCadenceOwners(
  scenarioId: Programme489ScenarioState,
  backlogSeed: ContinuousImprovementBacklogSeed,
): readonly CadenceOwner[] {
  const domains: readonly CadenceOwner["domain"][] = [
    "safety",
    "security",
    "privacy",
    "records",
    "accessibility",
    "assistive",
    "channel",
    "dependency_hygiene",
    "release_verification",
    "incident_lessons",
    "support",
  ] as const;
  return domains.map((domain) => {
    const metricRefs = backlogSeed.improvementOutcomeMetrics
      .filter((metric) => metric.outcomeArea === domain || (domain === "dependency_hygiene" && metric.outcomeArea === "security"))
      .map((metric) => metric.outcomeMetricId);
    const supplierCadenceMissing = scenarioId === "supplier_closed_without_contact_hygiene" && domain === "dependency_hygiene";
    return withHash<CadenceOwner>({
      recordType: "CadenceOwner",
      cadenceOwnerId: `cadence_owner_489_${scenarioLabel(scenarioId)}_${domain}`,
      scenarioId,
      domain,
      owner: domain === "privacy" ? "svc-owner:privacy" : domain === "records" ? "svc-owner:records-governance" : `svc-owner:${String(domain).replace(/_/g, "-")}`,
      deputy: domain === "privacy" ? "svc-deputy:privacy" : `svc-deputy:${String(domain).replace(/_/g, "-")}`,
      cadence: domain === "release_verification" ? "weekly" : "monthly",
      nextReviewAt: supplierCadenceMissing ? "" : "2026-05-28",
      metricRefs,
      escalationRef: supplierCadenceMissing ? "" : `escalation:489:${domain}`,
      cadenceState: supplierCadenceMissing ? "blocked" : "active",
      blockerRefs: supplierCadenceMissing
        ? ["blocker:489:supplier-dependency-closed-without-contact-hygiene-cadence"]
        : [],
      sourceRefs,
    });
  });
}

function buildMetricOwnership(
  scenarioId: Programme489ScenarioState,
  metrics: readonly ImprovementOutcomeMetric[],
): readonly BAUMetricOwnership[] {
  return metrics.map((metric) =>
    withHash<BAUMetricOwnership>({
      recordType: "BAUMetricOwnership",
      bauMetricOwnershipId: `bau_metric_ownership_489_${scenarioLabel(scenarioId)}_${metric.metricCode}`,
      scenarioId,
      metricRef: metric.outcomeMetricId,
      owner: metric.owner,
      cadenceOwnerRef: metric.reviewCadenceRef,
      measurementSourceRef: metric.measurementSourceRef,
      reportingCadence: "monthly",
      ownershipState: metric.blockerRefs.length > 0 ? "blocked" : "accepted",
      blockerRefs: metric.blockerRefs,
      sourceRefs,
    }),
  );
}

function buildPostLaunchCadence(
  scenarioId: Programme489ScenarioState,
  cadenceOwners: readonly CadenceOwner[],
  backlogSeed: ContinuousImprovementBacklogSeed,
): PostLaunchAssuranceCadence {
  const blockerRefs = uniq([...cadenceOwners.flatMap((owner) => owner.blockerRefs), ...backlogSeed.blockerRefs]);
  return withHash<PostLaunchAssuranceCadence>({
    recordType: "PostLaunchAssuranceCadence",
    postLaunchAssuranceCadenceId: `post_launch_assurance_cadence_489_${scenarioLabel(scenarioId)}`,
    scenarioId,
    cadenceOwnerRefs: cadenceOwners.map((owner) => owner.cadenceOwnerId),
    reviewTriggerRefs: backlogSeed.reviewTriggers.map((trigger) => trigger.reviewTriggerId),
    nextAssurancePackAt: "2026-05-28",
    cadenceState: blockerRefs.length > 0 ? "blocked" : "active",
    blockerRefs,
    sourceRefs,
  });
}

function buildDependencySchedule(scenarioId: Programme489ScenarioState): DependencyReassessmentSchedule {
  const missingCadence = scenarioId === "supplier_closed_without_contact_hygiene";
  return withHash<DependencyReassessmentSchedule>({
    recordType: "DependencyReassessmentSchedule",
    dependencyReassessmentScheduleId: `dependency_reassessment_489_${scenarioLabel(scenarioId)}`,
    scenarioId,
    dependencyRefs: [
      "dependency:nhs-app-channel",
      "dependency:supplier-escalation",
      "dependency:standards-baseline",
      "dependency:assistive-model-provider",
    ],
    owner: "svc-owner:dependency-hygiene",
    nextReviewAt: "2026-05-28",
    contactHygieneCadenceRef: missingCadence ? null : `cadence_owner_489_${scenarioLabel(scenarioId)}_dependency_hygiene`,
    standardsWatchlistRef: "standards-dependency-watchlist:programme-closure:489",
    scheduleState: missingCadence ? "blocked" : "active",
    blockerRefs: missingCadence
      ? ["blocker:489:supplier-dependency-closed-without-contact-hygiene-cadence"]
      : [],
    sourceRefs,
  });
}

function buildClosureState(blockerRefs: readonly string[], transfers: readonly UnresolvedItemTransfer[]) {
  if (blockerRefs.length > 0) return "blocked" as const;
  if (transfers.length > 0) return "complete_with_transfers" as const;
  return "complete" as const;
}

function buildCommand(
  scenarioId: Programme489ScenarioState,
  requestedFinalState: ProgrammeFinalState["finalState"],
  blockerRefs: readonly string[],
): ProgrammeClosureCommand {
  return withHash<ProgrammeClosureCommand>({
    recordType: "ProgrammeClosureCommand",
    programmeClosureCommandId: `programme_closure_command_489_${scenarioLabel(scenarioId)}`,
    scenarioId,
    roleAuthorizationRef: "role-auth:programme-governance:final-closure",
    tenantScope: releaseBinding.tenantScope,
    cohortScope: releaseBinding.cohortScope,
    channelScope: releaseBinding.channelScope,
    idempotencyKey: `idem:489:programme-closure:${scenarioLabel(scenarioId)}:2026-04-28`,
    purposeBindingRef: "purpose:close-master-watchlist-and-transition-to-ci",
    injectedClockRef: `clock:${FIXED_NOW}`,
    releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
    watchTupleHash: releaseBinding.watchTupleHash,
    requestedFinalState,
    blockerRefs,
    evidenceRefs: requiredInputPaths,
    sourceRefs,
    createdAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:489:programme-closure-command:${scenarioLabel(scenarioId)}`,
  });
}

function buildSettlement(
  scenarioId: Programme489ScenarioState,
  command: ProgrammeClosureCommand,
  finalStateRef: string,
  closureEvidenceSealRef: string,
  unresolvedTransferCount: number,
  blockerRefs: readonly string[],
): ProgrammeClosureSettlement {
  return withHash<ProgrammeClosureSettlement>({
    recordType: "ProgrammeClosureSettlement",
    programmeClosureSettlementId: `programme_closure_settlement_489_${scenarioLabel(scenarioId)}`,
    scenarioId,
    programmeClosureCommandRef: command.programmeClosureCommandId,
    result: blockerRefs.length > 0 ? "blocked" : "settled",
    authoritativeOutcomeState: blockerRefs.length > 0 ? "recovery_required" : "settled",
    finalProgrammeStateRef: finalStateRef,
    closureEvidenceSealRef,
    unresolvedTransferCount,
    blockerRefs,
    sourceRefs,
    recordedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:489:programme-closure-settlement:${scenarioLabel(scenarioId)}`,
  });
}

export function build489ScenarioRecords(
  scenarioId: Programme489ScenarioState = "complete_with_transfers",
  artifactRefs: readonly string[] = [],
) {
  ensureRequiredInputs();
  const archive = archiveManifest();
  const decisions = buildWatchlistDecisions(scenarioId);
  const transfers = buildTransfers(scenarioId, decisions);
  const backlogSeed = buildBacklogSeed(scenarioId, decisions);
  const cadenceOwners = buildCadenceOwners(scenarioId, backlogSeed);
  const metricOwnership = buildMetricOwnership(scenarioId, backlogSeed.improvementOutcomeMetrics);
  const postLaunchCadence = buildPostLaunchCadence(scenarioId, cadenceOwners, backlogSeed);
  const dependencySchedule = buildDependencySchedule(scenarioId);
  const transferBlockers = transfers.flatMap((transfer) => transfer.blockerRefs);
  const conflictingOwnerBlockers =
    scenarioId === "conflicting_bau_ci_owner" ? ["blocker:489:unresolved-item-has-conflicting-bau-and-ci-owners"] : [];
  const waveBlockers =
    scenarioId === "active_wave_observation_final_complete"
      ? ["blocker:489:programme-complete-while-wave-observation-active"]
      : [];
  const blockerRefs = uniq([
    ...decisions.flatMap((decision) => decision.blockerRefs),
    ...transferBlockers,
    ...backlogSeed.blockerRefs,
    ...cadenceOwners.flatMap((owner) => owner.blockerRefs),
    ...metricOwnership.flatMap((ownership) => ownership.blockerRefs),
    ...postLaunchCadence.blockerRefs,
    ...dependencySchedule.blockerRefs,
    ...conflictingOwnerBlockers,
    ...waveBlockers,
  ]);
  const closureState = buildClosureState(blockerRefs, transfers);
  const finalStateRef = `programme_final_state_489_${scenarioLabel(scenarioId)}`;
  const closureEvidenceSealRef = `closure_evidence_seal_489_${scenarioLabel(scenarioId)}`;
  const command = buildCommand(scenarioId, closureState, blockerRefs);
  const settlement = buildSettlement(
    scenarioId,
    command,
    finalStateRef,
    closureEvidenceSealRef,
    transfers.length,
    blockerRefs,
  );
  const closure = withHash<MasterDependencyWatchlistClosure>({
    recordType: "MasterDependencyWatchlistClosure",
    masterDependencyWatchlistClosureId: `master_dependency_watchlist_closure_489_${scenarioLabel(scenarioId)}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    closureState,
    ...releaseBinding,
    archiveManifestRef: archive.launchEvidenceArchiveManifestId,
    programmeFinalStateRef: finalStateRef,
    watchlistItemClosureDecisionRefs: decisions.map((decision) => decision.watchlistItemClosureDecisionId),
    unresolvedItemTransferRefs: transfers.map((transfer) => transfer.unresolvedItemTransferId),
    continuousImprovementBacklogSeedRef: backlogSeed.continuousImprovementBacklogSeedId,
    bauCadenceOwnershipRef: postLaunchCadence.postLaunchAssuranceCadenceId,
    closureEvidenceSealRef,
    unresolvedTransferCount: transfers.length,
    blockerRefs,
    evidenceRefs: requiredInputPaths,
    artifactRefs,
    sourceRefs,
    owner: "svc-owner:programme-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:489:master-watchlist-closure:${scenarioLabel(scenarioId)}`,
  });
  const evidenceSeal = withHash<ClosureEvidenceSeal>({
    recordType: "ClosureEvidenceSeal",
    closureEvidenceSealId: closureEvidenceSealRef,
    scenarioId,
    closureRef: closure.masterDependencyWatchlistClosureId,
    archiveManifestRef: archive.launchEvidenceArchiveManifestId,
    archiveWormSealDigest: archive.wormSealDigest,
    watchlistDecisionHash: hashValue(decisions.map((decision) => decision.recordHash)),
    transferRegisterHash: hashValue(transfers.map((transfer) => transfer.recordHash)),
    ciBacklogHash: backlogSeed.recordHash,
    cadenceHash: hashValue([
      ...cadenceOwners.map((owner) => owner.recordHash),
      ...metricOwnership.map((ownership) => ownership.recordHash),
      postLaunchCadence.recordHash,
      dependencySchedule.recordHash,
    ]),
    sealHash: hashValue({
      closureRef: closure.masterDependencyWatchlistClosureId,
      archiveWormSealDigest: archive.wormSealDigest,
      decisions: decisions.map((decision) => decision.recordHash),
      transfers: transfers.map((transfer) => transfer.recordHash),
      backlogSeed: backlogSeed.recordHash,
      cadence: postLaunchCadence.recordHash,
    }),
    sealAlgorithm: "sha256-canonical-json-v1",
    sealedAt: FIXED_NOW,
    sourceRefs,
    wormAuditRef: `worm-ledger:489:closure-evidence-seal:${scenarioLabel(scenarioId)}`,
  });
  const finalState = withHash<ProgrammeFinalState>({
    recordType: "ProgrammeFinalState",
    programmeFinalStateId: finalStateRef,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    finalState: closureState,
    completionLanguageGuard: "ongoing_ownership_explicit",
    ...releaseBinding,
    archiveManifestRef: archive.launchEvidenceArchiveManifestId,
    archiveWormSealDigest: archive.wormSealDigest,
    activeWaveStatus: scenarioId === "active_wave_observation_final_complete" ? "active" : "closed",
    activeWaveObservationState: scenarioId === "active_wave_observation_final_complete" ? "active" : "satisfied",
    masterWatchlistClosureRef: closure.masterDependencyWatchlistClosureId,
    continuousImprovementBacklogSeedRef: backlogSeed.continuousImprovementBacklogSeedId,
    bauCadenceOwnershipRef: postLaunchCadence.postLaunchAssuranceCadenceId,
    unresolvedItemTransferRegisterRef: `unresolved_transfer_register_489_${scenarioLabel(scenarioId)}`,
    closureEvidenceSealRef: evidenceSeal.closureEvidenceSealId,
    programmeClosureCommandRef: command.programmeClosureCommandId,
    programmeClosureSettlementRef: settlement.programmeClosureSettlementId,
    unresolvedTransferCount: transfers.length,
    blockedReleaseCount: decisions.filter((decision) => decision.closureDecision === "blocked_release").length,
    nextProgrammeReviewAt: "2026-05-28T09:00:00.000Z",
    blockerRefs,
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:489:programme-final-state:${scenarioLabel(scenarioId)}`,
  });

  return {
    closure,
    decisions,
    transfers,
    backlogSeed,
    cadenceOwners,
    metricOwnership,
    postLaunchCadence,
    dependencySchedule,
    evidenceSeal,
    command,
    settlement,
    finalState,
  };
}

export function build489Records(artifactRefs: readonly string[] = []) {
  const activeScenario = build489ScenarioRecords("complete_with_transfers", artifactRefs);
  const edgeCaseFixtures = required489EdgeCases.map((scenarioId) => {
    const records = build489ScenarioRecords(scenarioId, []);
    return {
      scenarioId,
      closureState: records.closure.closureState,
      finalState: records.finalState.finalState,
      blockerRefs: records.closure.blockerRefs,
      unresolvedTransferCount: records.closure.unresolvedTransferCount,
      backlogState: records.backlogSeed.backlogState,
      activeWaveObservationState: records.finalState.activeWaveObservationState,
    };
  });
  return { activeScenario, edgeCaseFixtures };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/489_programme_closure.schema.json",
    title: "Task 489 programme closure and continuous improvement contract",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "generatedAt", "recordHash"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      closureState: { enum: ["complete", "complete_with_transfers", "blocked"] },
      finalState: { enum: ["complete", "complete_with_transfers", "blocked"] },
      blockerRefs: { type: "array", items: { type: "string" } },
      recordHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    },
    additionalProperties: true,
  };
}

function buildInterfaceGap(): JsonObject {
  return {
    recordType: "ProgrammeBatchInterfaceGap",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_489_PROGRAMME_CLOSURE_AUTHORITY",
    gapSummary:
      "The repository had launch, archive, BAU and CI evidence but no single typed authority joining master watchlist closure decisions, unresolved-item transfers, final programme state and post-launch cadence ownership.",
    sourceRefs,
    failClosedBridge: {
      bridgeId: "fail_closed_programme_closure_authority_bridge_489",
      privilegedMutationPermitted: false,
      closurePermittedOnlyWhen: [
        "every_watchlist_item_has_current_evidence_hash",
        "every_transferred_item_has_owner_residual_risk_metric_and_review_date",
        "launch_blocking_items_have_valid_constraint_or_remain_blocked",
        "bau_and_ci_transfers_do_not_conflict_on_owner",
        "nhs_app_items_reference_current_channel_manifest",
        "supplier_dependencies_have_contact_hygiene_cadence",
        "release_wave_observation_is_closed_before_final_state_claims_complete",
      ],
      safeState: "programme_closure_blocked_or_complete_with_transfers_until_ownership_is_explicit",
    },
    generatedAt: FIXED_NOW,
    recordHash: hashValue({
      gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_489_PROGRAMME_CLOSURE_AUTHORITY",
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
    }),
  };
}

function buildExternalReferenceNotes(): JsonObject {
  return {
    recordType: "ExternalReferenceNotes",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    references: [
      {
        topic: "NHS App post-live governance",
        relevance: "Deferred-channel closure must reference current activation evidence and monthly data obligations.",
        appliedAs: "NHS App watchlist decision and channel cadence owner",
      },
      {
        topic: "Accessibility and design",
        relevance: "Continuous Improvement Transition Board uses semantic tables, filters, drawer focus restoration and reduced-motion friendly states.",
        appliedAs: "Playwright ARIA snapshots and keyboard filter checks",
      },
      {
        topic: "Security and dependency hygiene",
        relevance: "Standards drift, supplier contact hygiene and unsupported references continue after launch.",
        appliedAs: "DependencyReassessmentSchedule and security/dependency cadence ownership",
      },
      {
        topic: "Clinical safety and assistive monitoring",
        relevance: "Assistive visible modes require current trust metrics and review cadence.",
        appliedAs: "Assistive CI backlog metric and review trigger",
      },
      {
        topic: "Records governance",
        relevance: "Final programme state links back to the task 488 archive manifest and WORM seal.",
        appliedAs: "ClosureEvidenceSeal and ProgrammeFinalState archive linkage",
      },
      {
        topic: "Resilience and response planning",
        relevance: "Manual fallback and supplier retest actions become measured BAU/CI work rather than hidden launch residue.",
        appliedAs: "Backlog seed and BAU metric ownership",
      },
    ],
  };
}

function buildAlgorithmAlignmentNotes(records: ReturnType<typeof build489Records>): string {
  return `# 489 Algorithm Alignment Notes

Generated: ${FIXED_NOW}

## Source alignment

- Implements Prompt 489 and the shared operating contract for tasks 473-489.
- Consumes release, wave, channel, BAU and archive outputs, especially tasks 472, 476, 483, 487 and 488.
- Creates typed closure decisions, unresolved transfers, CI backlog metrics, BAU cadence owners, dependency reassessment, command/settlement, final programme state and closure evidence seal.
- Keeps final programme language constrained to explicit ongoing ownership; no unresolved item is hidden as complete.

## Active closure

- Closure: ${records.activeScenario.closure.masterDependencyWatchlistClosureId}
- State: ${records.activeScenario.closure.closureState}
- Decisions: ${records.activeScenario.decisions.length}
- Transfers: ${records.activeScenario.transfers.length}
- CI backlog items: ${records.activeScenario.backlogSeed.backlogItems.length}
- Evidence seal: ${records.activeScenario.evidenceSeal.sealHash}
- Next review: ${records.activeScenario.finalState.nextProgrammeReviewAt}

## Edge cases covered

${records.edgeCaseFixtures
  .map(
    (edgeCase) =>
      `- ${edgeCase.scenarioId}: ${edgeCase.closureState}; blockers=${edgeCase.blockerRefs.join(", ")}`,
  )
  .join("\n")}
`;
}

function buildWatchlistClosureReport(records: ReturnType<typeof build489Records>): string {
  return `# Master Watchlist Closure Report

Generated: ${FIXED_NOW}

The master dependency watchlist is ${records.activeScenario.closure.closureState}. The final programme state is ${records.activeScenario.finalState.finalState}, with ${records.activeScenario.transfers.length} explicit transfer(s) and ${records.activeScenario.closure.blockerRefs.length} launch blocker(s).

## Closure decisions

${records.activeScenario.decisions
  .map(
    (decision) =>
      `- ${decision.itemCode}: ${decision.closureDecision}; owner=${decision.targetOwner}; residual=${decision.residualRisk}; metric=${decision.targetOutcomeMetricRef ?? "n/a"}`,
  )
  .join("\n")}

## Evidence seal

- Archive manifest: ${records.activeScenario.finalState.archiveManifestRef}
- Archive WORM digest: ${records.activeScenario.finalState.archiveWormSealDigest}
- Closure seal: ${records.activeScenario.evidenceSeal.sealHash}
`;
}

function buildCIOperatingPlan(records: ReturnType<typeof build489Records>): string {
  return `# Continuous Improvement Operating Plan

Generated: ${FIXED_NOW}

## Backlog seed

${records.activeScenario.backlogSeed.backlogItems
  .map(
    (item) =>
      `- ${item.title}: owner=${item.owner}; metric=${item.outcomeMetricRef}; cadence=${item.reviewCadenceRef}; due=${item.dueDate}`,
  )
  .join("\n")}

## Cadence ownership

${records.activeScenario.cadenceOwners
  .map((owner) => `- ${owner.domain}: ${owner.owner}; cadence=${owner.cadence}; next=${owner.nextReviewAt}`)
  .join("\n")}

## Dependency reassessment

- Owner: ${records.activeScenario.dependencySchedule.owner}
- Next review: ${records.activeScenario.dependencySchedule.nextReviewAt}
- Contact hygiene cadence: ${records.activeScenario.dependencySchedule.contactHygieneCadenceRef}
`;
}

export function write489ProgrammeClosureArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build489Records(artifactRefs);
  writeJson(
    "data/programme/489_master_dependency_watchlist_closure.json",
    withHash<JsonObject>({
      recordType: "MasterDependencyWatchlistClosureEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeClosure: records.activeScenario.closure,
      activeCommand: records.activeScenario.command,
      activeSettlement: records.activeScenario.settlement,
      watchlistItemClosureDecisions: records.activeScenario.decisions,
      closureEvidenceSeal: records.activeScenario.evidenceSeal,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );
  writeJson(
    "data/programme/489_continuous_improvement_backlog_seed.json",
    withHash<JsonObject>({
      recordType: "ContinuousImprovementBacklogSeedEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeBacklogSeed: records.activeScenario.backlogSeed,
      sourceRefs,
    }),
  );
  writeJson(
    "data/programme/489_bau_cadence_and_metric_ownership.json",
    withHash<JsonObject>({
      recordType: "BAUCadenceAndMetricOwnershipEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      cadenceOwners: records.activeScenario.cadenceOwners,
      metricOwnership: records.activeScenario.metricOwnership,
      postLaunchAssuranceCadence: records.activeScenario.postLaunchCadence,
      dependencyReassessmentSchedule: records.activeScenario.dependencySchedule,
      sourceRefs,
    }),
  );
  writeJson(
    "data/programme/489_closed_programme_final_state.json",
    withHash<JsonObject>({
      recordType: "ClosedProgrammeFinalStateEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      finalState: records.activeScenario.finalState,
      activeCommand: records.activeScenario.command,
      activeSettlement: records.activeScenario.settlement,
      closureEvidenceSeal: records.activeScenario.evidenceSeal,
      sourceRefs,
    }),
  );
  writeJson(
    "data/programme/489_unresolved_item_transfer_register.json",
    withHash<JsonObject>({
      recordType: "UnresolvedItemTransferRegister",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      transfers: records.activeScenario.transfers,
      sourceRefs,
    }),
  );
  writeJson("data/contracts/489_programme_closure.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_489_PROGRAMME_CLOSURE_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/489_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/489_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes(records));
  writeText("docs/programme/489_master_watchlist_closure_report.md", buildWatchlistClosureReport(records));
  writeText("docs/programme/489_continuous_improvement_operating_plan.md", buildCIOperatingPlan(records));
  formatFiles([
    "data/programme/489_master_dependency_watchlist_closure.json",
    "data/programme/489_continuous_improvement_backlog_seed.json",
    "data/programme/489_bau_cadence_and_metric_ownership.json",
    "data/programme/489_closed_programme_final_state.json",
    "data/programme/489_unresolved_item_transfer_register.json",
    "data/contracts/489_programme_closure.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_489_PROGRAMME_CLOSURE_AUTHORITY.json",
    "data/analysis/489_external_reference_notes.json",
    "data/analysis/489_algorithm_alignment_notes.md",
    "docs/programme/489_master_watchlist_closure_report.md",
    "docs/programme/489_continuous_improvement_operating_plan.md",
  ]);
}

if (process.argv[1]?.endsWith("close_489_master_watchlist.ts")) {
  write489ProgrammeClosureArtifacts();
}
