import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_488";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "488.programme.launch-evidence-archive.v1";
export const OUTPUT_ROOT = "output/playwright/488-evidence-vault";

type JsonObject = Record<string, unknown>;
type ArchiveVerdict = "sealed" | "sealed_with_exceptions" | "blocked";
type EvidenceFamily =
  | "Scorecard"
  | "Migration"
  | "Signoff"
  | "Tests"
  | "DR"
  | "Waves"
  | "Assistive"
  | "Channel"
  | "BAU"
  | "Lessons";
type RetentionClass = "clinical_safety_8y" | "launch_assurance_8y" | "security_6y" | "records_governance_8y";
type ConfidentialityClass = "internal" | "restricted" | "confidential";
type ExportEligibility = "eligible" | "restricted" | "blocked" | "quarantined";
type LegalHoldState = "none" | "active" | "conflict";

export type Archive488ScenarioState =
  | "sealed"
  | "sealed_with_exceptions"
  | "missing_source_tuple"
  | "legal_hold_deletion_conflict"
  | "unstable_worm_hash"
  | "lesson_without_owner"
  | "trace_sensitive_quarantine"
  | "unauthorized_export"
  | "open_wave_observation";

interface ReleaseBinding488 {
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

interface EvidenceDefinition {
  readonly family: EvidenceFamily;
  readonly evidenceRef: string;
  readonly title: string;
  readonly owner: string;
  readonly retentionClass: RetentionClass;
  readonly confidentialityClass: ConfidentialityClass;
  readonly sourceRefs: readonly string[];
}

export interface ArchivedEvidenceItem {
  readonly recordType: "ArchivedEvidenceItem";
  readonly archivedEvidenceItemId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly family: EvidenceFamily;
  readonly title: string;
  readonly evidenceRef: string;
  readonly sourceTupleRef: string | null;
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly owner: string;
  readonly retentionClass: RetentionClass;
  readonly legalHoldState: LegalHoldState;
  readonly confidentialityClass: ConfidentialityClass;
  readonly exportEligibility: ExportEligibility;
  readonly quarantineState: "none" | "quarantined";
  readonly sealState: "sealed" | "blocked" | "quarantined";
  readonly evidenceHash: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly archivedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface WORMSealRecord {
  readonly recordType: "WORMSealRecord";
  readonly wormSealRecordId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly archivedEvidenceItemRef: string;
  readonly evidenceRef: string;
  readonly canonicalEvidenceHash: string;
  readonly sealHash: string;
  readonly sealAlgorithm: "sha256-canonical-json-v1";
  readonly sealedAt: string;
  readonly chainPreviousSealRef: string | null;
  readonly sealState: "sealed" | "blocked" | "quarantined";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface EvidenceLineageChain {
  readonly recordType: "EvidenceLineageChain";
  readonly lineageChainId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly family: EvidenceFamily;
  readonly sourceEvidenceRefs: readonly string[];
  readonly derivedEvidenceRefs: readonly string[];
  readonly authorityTupleRef: string;
  readonly lineageHash: string;
  readonly lineageState: "complete" | "blocked" | "quarantined";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface RetentionClassification {
  readonly recordType: "RetentionClassification";
  readonly retentionClassificationId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly archivedEvidenceItemRef: string;
  readonly retentionClass: RetentionClass;
  readonly minimumRetainUntil: string;
  readonly dispositionPolicyRef: string;
  readonly classificationState: "classified" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface LegalHoldBinding {
  readonly recordType: "LegalHoldBinding";
  readonly legalHoldBindingId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly archivedEvidenceItemRef: string;
  readonly legalHoldState: LegalHoldState;
  readonly legalHoldRef: string | null;
  readonly scheduledDeletionRef: string | null;
  readonly conflictState: "none" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface DeletionProtectionVerdict {
  readonly recordType: "DeletionProtectionVerdict";
  readonly deletionProtectionVerdictId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly archivedEvidenceItemRef: string;
  readonly replayDependencyProtected: boolean;
  readonly wormProtected: boolean;
  readonly legalHoldProtected: boolean;
  readonly deletionPermitted: boolean;
  readonly verdictState: "protected" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ArchiveAccessGrant {
  readonly recordType: "ArchiveAccessGrant";
  readonly archiveAccessGrantId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly requestedByRole: "governance_admin" | "records_manager" | "viewer";
  readonly evidenceFamilyRefs: readonly EvidenceFamily[];
  readonly exportPostureRef: string;
  readonly grantState: "granted" | "denied";
  readonly reasonCodeRefs: readonly string[];
  readonly expiresAt: string | null;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface EvidenceExportPosture {
  readonly recordType: "EvidenceExportPosture";
  readonly evidenceExportPostureId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly archiveManifestRef: string;
  readonly requestedRole: "governance_admin" | "records_manager" | "viewer";
  readonly exportState: "permitted" | "permitted_with_redaction" | "blocked" | "quarantined";
  readonly redactionPolicyRef: string;
  readonly artifactPresentationContractRef: string;
  readonly outboundNavigationGrantPolicyRef: string;
  readonly accessGrantRef: string;
  readonly blockedArtifactRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface LessonsLearnedRegister {
  readonly recordType: "LessonsLearnedRegister";
  readonly lessonsLearnedRegisterId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly lessons: readonly LessonLearnedEntry[];
  readonly registerState: "complete" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

interface LessonLearnedEntry {
  readonly lessonId: string;
  readonly title: string;
  readonly sourceEvidenceRef: string;
  readonly owner: string | null;
  readonly severity: "low" | "medium" | "high";
  readonly capaActionRef: string | null;
  readonly continuousImprovementLinkRef: string | null;
  readonly closureCriteria: string;
  readonly blockerRefs: readonly string[];
}

export interface CAPAAction {
  readonly recordType: "CAPAAction";
  readonly capaActionId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly lessonRef: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly severity: "low" | "medium" | "high";
  readonly sourceEvidenceRef: string;
  readonly closureCriteria: string;
  readonly state: "open" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ContinuousImprovementLink {
  readonly recordType: "ContinuousImprovementLink";
  readonly continuousImprovementLinkId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly lessonRef: string;
  readonly backlogSeedRef: string;
  readonly outcomeMetricRef: string;
  readonly owner: string;
  readonly reviewCadence: string;
  readonly state: "seeded" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordHash: string;
}

export interface ArchiveCommand {
  readonly recordType: "LaunchEvidenceArchiveCommand";
  readonly archiveCommandId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly requestedVerdict: ArchiveVerdict;
  readonly roleAuthorizationRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ArchiveSettlement {
  readonly recordType: "LaunchEvidenceArchiveSettlement";
  readonly archiveSettlementId: string;
  readonly scenarioId: Archive488ScenarioState;
  readonly archiveCommandRef: string;
  readonly result: ArchiveVerdict;
  readonly wormSealDigest: string;
  readonly sealedEvidenceCount: number;
  readonly quarantinedEvidenceCount: number;
  readonly legalHoldCount: number;
  readonly exportState: "permitted" | "permitted_with_redaction" | "blocked" | "quarantined";
  readonly archiveRecoveryActionRef: string;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface LaunchEvidenceArchiveManifest {
  readonly recordType: "LaunchEvidenceArchiveManifest";
  readonly launchEvidenceArchiveManifestId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: Archive488ScenarioState;
  readonly archiveVerdict: ArchiveVerdict;
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly retentionPolicyVersion: string;
  readonly archivedEvidenceItemRefs: readonly string[];
  readonly wormSealRecordRefs: readonly string[];
  readonly evidenceLineageChainRefs: readonly string[];
  readonly retentionClassificationRefs: readonly string[];
  readonly legalHoldBindingRefs: readonly string[];
  readonly deletionProtectionVerdictRefs: readonly string[];
  readonly lessonsLearnedRegisterRef: string;
  readonly capaActionRefs: readonly string[];
  readonly continuousImprovementLinkRefs: readonly string[];
  readonly evidenceExportPostureRef: string;
  readonly archiveCommandRef: string;
  readonly archiveSettlementRef: string;
  readonly wormSealDigest: string;
  readonly legalHoldCount: number;
  readonly quarantinedArtifactRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly exceptionRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export const required488EdgeCases: readonly Archive488ScenarioState[] = [
  "missing_source_tuple",
  "legal_hold_deletion_conflict",
  "unstable_worm_hash",
  "lesson_without_owner",
  "trace_sensitive_quarantine",
  "unauthorized_export",
  "open_wave_observation",
] as const;

const releaseBinding: ReleaseBinding488 = {
  releaseRef: "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
  releaseCandidateRef: "RC_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releasePublicationParityRef: "rpp::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  watchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
  tenantScope: "tenant-demo-gp:programme-core-release",
  cohortScope: "cohort:launch-evidence-archive",
  channelScope: "channel:core-web-staff-pharmacy-nhs-app-assistive",
};

const sourceRefs = [
  "prompt/488.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md#9i-full-program-exercises-bau-transfer-and-formal-exit-gate",
  "blueprint/phase-0-the-foundation-protocol.md#retention-freeze-record",
  "blueprint/platform-runtime-and-release-blueprint.md#release-evidence-and-publication-parity",
  "blueprint/governance-admin-console-frontend-blueprint.md#records-lifecycle-governance",
] as const;

const requiredInputPaths = [
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/migration/474_schema_migration_plan.json",
  "data/signoff/477_final_signoff_register.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/evidence/479_dress_rehearsal_report.json",
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/481_dr_and_go_live_smoke_report.json",
  "data/release/482_wave1_promotion_settlement.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
  "data/assistive/485_assistive_enablement_settlements.json",
  "data/channel/486_nhs_app_channel_enablement_settlement.json",
  "data/bau/487_bau_handover_pack.json",
] as const;

const evidenceDefinitions: readonly EvidenceDefinition[] = [
  {
    family: "Scorecard",
    evidenceRef: "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    title: "Cross-phase scorecard after Phase 7 reconciliation",
    owner: "svc-owner:programme-governance",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/473.md", "blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard"],
  },
  {
    family: "Migration",
    evidenceRef: "data/migration/474_schema_migration_plan.json",
    title: "Schema migration and cutover plan",
    owner: "svc-owner:migration",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/474.md", "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan"],
  },
  {
    family: "Signoff",
    evidenceRef: "data/signoff/477_final_signoff_register.json",
    title: "Security, clinical safety, privacy and regulatory signoff register",
    owner: "svc-owner:assurance",
    retentionClass: "clinical_safety_8y",
    confidentialityClass: "confidential",
    sourceRefs: ["prompt/477.md", "blueprint/phase-9-the-assurance-ledger.md#assurance"],
  },
  {
    family: "Tests",
    evidenceRef: "data/evidence/479_dress_rehearsal_report.json",
    title: "Production-like dress rehearsal report",
    owner: "svc-owner:test-assurance",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/479.md", "blueprint/phase-9-the-assurance-ledger.md#full-program-exercises"],
  },
  {
    family: "Tests",
    evidenceRef: "data/evidence/480_uat_result_matrix.json",
    title: "Final UAT and visual regression matrix",
    owner: "svc-owner:test-assurance",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/480.md", "blueprint/phase-9-the-assurance-ledger.md#full-program-exercises"],
  },
  {
    family: "DR",
    evidenceRef: "data/evidence/481_dr_and_go_live_smoke_report.json",
    title: "Disaster recovery and go-live smoke evidence",
    owner: "svc-owner:resilience",
    retentionClass: "security_6y",
    confidentialityClass: "confidential",
    sourceRefs: ["prompt/481.md", "blueprint/phase-9-the-assurance-ledger.md#9f-resilience"],
  },
  {
    family: "Waves",
    evidenceRef: "data/release/482_wave1_promotion_settlement.json",
    title: "Wave 1 promotion settlement",
    owner: "svc-owner:release",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/482.md", "blueprint/platform-runtime-and-release-blueprint.md#WaveActionSettlement"],
  },
  {
    family: "Waves",
    evidenceRef: "data/release/483_wave1_stability_verdict.json",
    title: "Wave 1 stability verdict",
    owner: "svc-owner:release",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/483.md", "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy"],
  },
  {
    family: "Waves",
    evidenceRef: "data/release/484_wave_widening_evidence.json",
    title: "Guardrailed canary widening evidence",
    owner: "svc-owner:release",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/484.md", "blueprint/platform-runtime-and-release-blueprint.md#DeploymentWave"],
  },
  {
    family: "Assistive",
    evidenceRef: "data/assistive/485_assistive_enablement_settlements.json",
    title: "Assistive visible mode enablement settlements",
    owner: "svc-owner:assistive-trust",
    retentionClass: "clinical_safety_8y",
    confidentialityClass: "confidential",
    sourceRefs: ["prompt/485.md", "blueprint/phase-8-the-assistive-layer.md#assistive-rollout"],
  },
  {
    family: "Channel",
    evidenceRef: "data/channel/486_nhs_app_channel_enablement_settlement.json",
    title: "NHS App channel enablement settlement",
    owner: "svc-owner:nhs-app-channel",
    retentionClass: "launch_assurance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/486.md", "blueprint/phase-7-inside-the-nhs-app.md#limited-release"],
  },
  {
    family: "BAU",
    evidenceRef: "data/bau/487_bau_handover_pack.json",
    title: "BAU handover pack and support rota transfer",
    owner: "svc-owner:operations-control",
    retentionClass: "records_governance_8y",
    confidentialityClass: "restricted",
    sourceRefs: ["prompt/487.md", "blueprint/phase-9-the-assurance-ledger.md#ReleaseToBAURecord"],
  },
  {
    family: "Lessons",
    evidenceRef: "data/bau/487_bau_open_actions_register.json",
    title: "Launch open actions and improvement inputs",
    owner: "svc-owner:continuous-improvement",
    retentionClass: "records_governance_8y",
    confidentialityClass: "internal",
    sourceRefs: ["prompt/487.md", "blueprint/phase-9-the-assurance-ledger.md#BAU-transfer"],
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

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
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
  if (missing.length > 0) throw new Error(`488 required inputs missing: ${missing.join(", ")}`);
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

function scenarioLabel(scenarioId: Archive488ScenarioState): string {
  return scenarioId.replace(/_/g, "-");
}

function evidenceItemId(scenarioId: Archive488ScenarioState, definition: EvidenceDefinition): string {
  return `archived_evidence_488_${scenarioLabel(scenarioId)}_${definition.family.toLowerCase()}_${hashValue(definition.evidenceRef).slice(0, 8)}`;
}

function evidenceContentHash(definition: EvidenceDefinition): string {
  const absolutePath = path.join(ROOT, definition.evidenceRef);
  const content = fs.existsSync(absolutePath) ? readText(definition.evidenceRef) : definition.evidenceRef;
  return hashValue({ evidenceRef: definition.evidenceRef, content });
}

function blockersForEvidence(scenarioId: Archive488ScenarioState, definition: EvidenceDefinition): string[] {
  if (scenarioId === "missing_source_tuple" && definition.family === "Signoff") {
    return ["blocker:488:evidence-source-tuple-missing"];
  }
  if (scenarioId === "legal_hold_deletion_conflict" && definition.family === "DR") {
    return ["blocker:488:legal-hold-conflicts-with-deletion"];
  }
  if (scenarioId === "unstable_worm_hash" && definition.family === "Scorecard") {
    return ["blocker:488:worm-seal-hash-unstable"];
  }
  if (scenarioId === "trace_sensitive_quarantine" && definition.family === "Tests") {
    return ["exception:488:trace-artifact-quarantined-for-redaction"];
  }
  if (scenarioId === "open_wave_observation" && definition.family === "Waves") {
    return ["blocker:488:open-wave-observation-cannot-seal-complete"];
  }
  return [];
}

function buildArchivedEvidenceItems(scenarioId: Archive488ScenarioState): readonly ArchivedEvidenceItem[] {
  return evidenceDefinitions.map((definition) => {
    const blockers = blockersForEvidence(scenarioId, definition);
    const quarantineState =
      scenarioId === "trace_sensitive_quarantine" && definition.family === "Tests" ? "quarantined" : "none";
    const sourceTupleRef =
      scenarioId === "missing_source_tuple" && definition.family === "Signoff"
        ? null
        : `authority-tuple:488:${definition.family.toLowerCase()}:${releaseBinding.releaseWatchTupleRef}`;
    const legalHoldState =
      scenarioId === "legal_hold_deletion_conflict" && definition.family === "DR"
        ? "conflict"
        : definition.family === "Signoff" || definition.family === "DR"
          ? "active"
          : "none";
    const exportEligibility: ExportEligibility =
      quarantineState === "quarantined"
        ? "quarantined"
        : definition.confidentialityClass === "confidential"
          ? "restricted"
          : "eligible";
    const blocking = blockers.some((blocker) => blocker.startsWith("blocker:"));
    return withHash<ArchivedEvidenceItem>({
      recordType: "ArchivedEvidenceItem",
      archivedEvidenceItemId: evidenceItemId(scenarioId, definition),
      scenarioId,
      family: definition.family,
      title: definition.title,
      evidenceRef: definition.evidenceRef,
      sourceTupleRef,
      ...releaseBinding,
      owner: definition.owner,
      retentionClass: definition.retentionClass,
      legalHoldState,
      confidentialityClass: definition.confidentialityClass,
      exportEligibility,
      quarantineState,
      sealState: blocking ? "blocked" : quarantineState === "quarantined" ? "quarantined" : "sealed",
      evidenceHash: evidenceContentHash(definition),
      blockerRefs: blockers,
      sourceRefs: uniq([...sourceRefs, ...definition.sourceRefs]),
      archivedAt: FIXED_NOW,
      wormAuditRef: `worm-ledger:488:archived-evidence:${scenarioLabel(scenarioId)}:${definition.family.toLowerCase()}`,
    });
  });
}

function buildWormSealRecords(
  scenarioId: Archive488ScenarioState,
  items: readonly ArchivedEvidenceItem[],
): readonly WORMSealRecord[] {
  let previousSealRef: string | null = null;
  return items.map((item) => {
    const stableSealInput = {
      evidenceRef: item.evidenceRef,
      evidenceHash: item.evidenceHash,
      sourceTupleRef: item.sourceTupleRef,
      releaseWatchTupleRef: item.releaseWatchTupleRef,
      sealedAt: FIXED_NOW,
    };
    const unstable = item.blockerRefs.includes("blocker:488:worm-seal-hash-unstable");
    const sealState = item.sealState;
    const record = withHash<WORMSealRecord>({
      recordType: "WORMSealRecord",
      wormSealRecordId: `worm_seal_488_${scenarioLabel(scenarioId)}_${hashValue(item.archivedEvidenceItemId).slice(0, 10)}`,
      scenarioId,
      archivedEvidenceItemRef: item.archivedEvidenceItemId,
      evidenceRef: item.evidenceRef,
      canonicalEvidenceHash: item.evidenceHash,
      sealHash: unstable ? hashValue({ ...stableSealInput, unstableTimestamp: "non-canonical" }) : hashValue(stableSealInput),
      sealAlgorithm: "sha256-canonical-json-v1",
      sealedAt: FIXED_NOW,
      chainPreviousSealRef: previousSealRef,
      sealState,
      blockerRefs: item.blockerRefs.filter((blocker) => blocker.startsWith("blocker:")),
      sourceRefs,
      wormAuditRef: `worm-ledger:488:worm-seal:${item.archivedEvidenceItemId}`,
    });
    previousSealRef = record.wormSealRecordId;
    return record;
  });
}

function buildLineageChains(
  scenarioId: Archive488ScenarioState,
  items: readonly ArchivedEvidenceItem[],
): readonly EvidenceLineageChain[] {
  const families = [...new Set(items.map((item) => item.family))] as EvidenceFamily[];
  return families.map((family) => {
    const familyItems = items.filter((item) => item.family === family);
    const blockers = familyItems.flatMap((item) => item.blockerRefs).filter((blocker) => blocker.startsWith("blocker:"));
    const quarantined = familyItems.some((item) => item.quarantineState === "quarantined");
    const sourceEvidenceRefs = familyItems.map((item) => item.evidenceRef);
    return withHash<EvidenceLineageChain>({
      recordType: "EvidenceLineageChain",
      lineageChainId: `lineage_chain_488_${scenarioLabel(scenarioId)}_${family.toLowerCase()}`,
      scenarioId,
      family,
      sourceEvidenceRefs,
      derivedEvidenceRefs: sourceEvidenceRefs.map((ref) => `archive-derived:${hashValue(ref).slice(0, 12)}`),
      authorityTupleRef: `authority-tuple:488:${family.toLowerCase()}:${releaseBinding.watchTupleHash.slice(0, 16)}`,
      lineageHash: hashValue({ family, sourceEvidenceRefs, releaseBinding }),
      lineageState: blockers.length > 0 ? "blocked" : quarantined ? "quarantined" : "complete",
      blockerRefs: blockers,
      sourceRefs,
    });
  });
}

function buildRetentionClassifications(
  scenarioId: Archive488ScenarioState,
  items: readonly ArchivedEvidenceItem[],
): readonly RetentionClassification[] {
  return items.map((item) =>
    withHash<RetentionClassification>({
      recordType: "RetentionClassification",
      retentionClassificationId: `retention_classification_488_${hashValue(item.archivedEvidenceItemId).slice(0, 10)}`,
      scenarioId,
      archivedEvidenceItemRef: item.archivedEvidenceItemId,
      retentionClass: item.retentionClass,
      minimumRetainUntil: item.retentionClass === "security_6y" ? "2032-04-28" : "2034-04-28",
      dispositionPolicyRef: `retention-policy:${item.retentionClass}:v1`,
      classificationState: item.sourceTupleRef ? "classified" : "blocked",
      blockerRefs: item.sourceTupleRef ? [] : ["blocker:488:evidence-source-tuple-missing"],
      sourceRefs,
    }),
  );
}

function buildLegalHoldBindings(
  scenarioId: Archive488ScenarioState,
  items: readonly ArchivedEvidenceItem[],
): readonly LegalHoldBinding[] {
  return items.map((item) => {
    const conflict = item.legalHoldState === "conflict";
    return withHash<LegalHoldBinding>({
      recordType: "LegalHoldBinding",
      legalHoldBindingId: `legal_hold_binding_488_${hashValue(item.archivedEvidenceItemId).slice(0, 10)}`,
      scenarioId,
      archivedEvidenceItemRef: item.archivedEvidenceItemId,
      legalHoldState: item.legalHoldState,
      legalHoldRef: item.legalHoldState === "none" ? null : `legal-hold:488:${item.family.toLowerCase()}`,
      scheduledDeletionRef: conflict ? "disposition-job:conflicting-delete-candidate" : null,
      conflictState: conflict ? "blocked" : "none",
      blockerRefs: conflict ? ["blocker:488:legal-hold-conflicts-with-deletion"] : [],
      sourceRefs,
    });
  });
}

function buildDeletionVerdicts(
  scenarioId: Archive488ScenarioState,
  items: readonly ArchivedEvidenceItem[],
): readonly DeletionProtectionVerdict[] {
  return items.map((item) => {
    const blockers = item.blockerRefs.filter((blocker) => blocker.startsWith("blocker:"));
    return withHash<DeletionProtectionVerdict>({
      recordType: "DeletionProtectionVerdict",
      deletionProtectionVerdictId: `deletion_protection_488_${hashValue(item.archivedEvidenceItemId).slice(0, 10)}`,
      scenarioId,
      archivedEvidenceItemRef: item.archivedEvidenceItemId,
      replayDependencyProtected: true,
      wormProtected: item.sealState !== "blocked",
      legalHoldProtected: item.legalHoldState === "active" || item.legalHoldState === "conflict",
      deletionPermitted: false,
      verdictState: blockers.length > 0 ? "blocked" : "protected",
      blockerRefs: blockers,
      sourceRefs,
    });
  });
}

function buildLessons(
  scenarioId: Archive488ScenarioState,
): readonly LessonLearnedEntry[] {
  return [
    {
      lessonId: `lesson_488_${scenarioLabel(scenarioId)}_manual_fallback_rehearsal`,
      title: "Manual fallback drills need a named post-launch retest owner",
      sourceEvidenceRef: "data/readiness/478_fallback_rehearsal_evidence.json",
      owner: "svc-owner:supplier-management",
      severity: "medium",
      capaActionRef: `capa_488_${scenarioLabel(scenarioId)}_fallback_retest`,
      continuousImprovementLinkRef: `ci_link_488_${scenarioLabel(scenarioId)}_fallback_retest`,
      closureCriteria: "Next supplier fallback retest has evidence, owner and cadence.",
      blockerRefs: [],
    },
    {
      lessonId: `lesson_488_${scenarioLabel(scenarioId)}_uat_copy_drift`,
      title: "UAT copy drift should convert to governed content checks",
      sourceEvidenceRef: "data/evidence/480_uat_result_matrix.json",
      owner: scenarioId === "lesson_without_owner" ? null : "svc-owner:content-governance",
      severity: "low",
      capaActionRef: scenarioId === "lesson_without_owner" ? null : `capa_488_${scenarioLabel(scenarioId)}_content_check`,
      continuousImprovementLinkRef:
        scenarioId === "lesson_without_owner" ? null : `ci_link_488_${scenarioLabel(scenarioId)}_content_check`,
      closureCriteria: "Content check is added to monthly assurance pack generation.",
      blockerRefs: scenarioId === "lesson_without_owner" ? ["blocker:488:lesson-has-no-owner-or-capa-link"] : [],
    },
    {
      lessonId: `lesson_488_${scenarioLabel(scenarioId)}_wave_observation`,
      title: "Wave observation should stay linked to release watch evidence",
      sourceEvidenceRef: "data/release/483_wave1_stability_verdict.json",
      owner: "svc-owner:release",
      severity: "medium",
      capaActionRef: `capa_488_${scenarioLabel(scenarioId)}_wave_watch_linkage`,
      continuousImprovementLinkRef: `ci_link_488_${scenarioLabel(scenarioId)}_wave_watch_linkage`,
      closureCriteria: "Release watch evidence cockpit link is checked before archive export.",
      blockerRefs: [],
    },
  ];
}

function buildLessonsRegister(scenarioId: Archive488ScenarioState): LessonsLearnedRegister {
  const lessons = buildLessons(scenarioId);
  const blockers = lessons.flatMap((lesson) => lesson.blockerRefs);
  return withHash<LessonsLearnedRegister>({
    recordType: "LessonsLearnedRegister",
    lessonsLearnedRegisterId: `lessons_learned_register_488_${scenarioLabel(scenarioId)}`,
    scenarioId,
    lessons,
    registerState: blockers.length > 0 ? "blocked" : "complete",
    blockerRefs: blockers,
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildCapaActions(
  scenarioId: Archive488ScenarioState,
  lessonsRegister: LessonsLearnedRegister,
): readonly CAPAAction[] {
  return lessonsRegister.lessons
    .filter((lesson) => lesson.capaActionRef)
    .map((lesson) =>
      withHash<CAPAAction>({
        recordType: "CAPAAction",
        capaActionId: lesson.capaActionRef as string,
        scenarioId,
        lessonRef: lesson.lessonId,
        owner: lesson.owner as string,
        dueDate: lesson.severity === "medium" ? "2026-05-28" : "2026-06-28",
        severity: lesson.severity,
        sourceEvidenceRef: lesson.sourceEvidenceRef,
        closureCriteria: lesson.closureCriteria,
        state: "open",
        blockerRefs: [],
        sourceRefs,
      }),
    );
}

function buildContinuousImprovementLinks(
  scenarioId: Archive488ScenarioState,
  lessonsRegister: LessonsLearnedRegister,
): readonly ContinuousImprovementLink[] {
  return lessonsRegister.lessons
    .filter((lesson) => lesson.continuousImprovementLinkRef)
    .map((lesson) =>
      withHash<ContinuousImprovementLink>({
        recordType: "ContinuousImprovementLink",
        continuousImprovementLinkId: lesson.continuousImprovementLinkRef as string,
        scenarioId,
        lessonRef: lesson.lessonId,
        backlogSeedRef: "data/archive/488_capa_and_continuous_improvement_actions.json",
        outcomeMetricRef: `outcome-metric:488:${lesson.lessonId}`,
        owner: lesson.owner as string,
        reviewCadence: "monthly",
        state: "seeded",
        blockerRefs: [],
        sourceRefs,
      }),
    );
}

function buildAccessGrant(scenarioId: Archive488ScenarioState): ArchiveAccessGrant {
  const denied = scenarioId === "unauthorized_export";
  return withHash<ArchiveAccessGrant>({
    recordType: "ArchiveAccessGrant",
    archiveAccessGrantId: `archive_access_grant_488_${scenarioLabel(scenarioId)}`,
    scenarioId,
    requestedByRole: denied ? "viewer" : "governance_admin",
    evidenceFamilyRefs: ["Scorecard", "Migration", "Signoff", "Tests", "DR", "Waves", "Assistive", "Channel", "BAU", "Lessons"],
    exportPostureRef: `evidence_export_posture_488_${scenarioLabel(scenarioId)}`,
    grantState: denied ? "denied" : "granted",
    reasonCodeRefs: denied ? ["reason:archive-export-role-denied"] : ["reason:governed-archive-review"],
    expiresAt: denied ? null : "2026-04-29T00:00:00.000Z",
    wormAuditRef: `worm-ledger:488:archive-access-grant:${scenarioLabel(scenarioId)}`,
  });
}

function buildExportPosture(
  scenarioId: Archive488ScenarioState,
  items: readonly ArchivedEvidenceItem[],
  accessGrant: ArchiveAccessGrant,
): EvidenceExportPosture {
  const quarantined = items.filter((item) => item.quarantineState === "quarantined").map((item) => item.evidenceRef);
  const blocked = accessGrant.grantState === "denied";
  return withHash<EvidenceExportPosture>({
    recordType: "EvidenceExportPosture",
    evidenceExportPostureId: `evidence_export_posture_488_${scenarioLabel(scenarioId)}`,
    scenarioId,
    archiveManifestRef: `launch_evidence_archive_manifest_488_${scenarioLabel(scenarioId)}`,
    requestedRole: accessGrant.requestedByRole,
    exportState: blocked
      ? "blocked"
      : quarantined.length > 0
        ? "quarantined"
        : items.some((item) => item.exportEligibility === "restricted")
          ? "permitted_with_redaction"
          : "permitted",
    redactionPolicyRef: "redaction-policy:launch-evidence-export:minimum-necessary",
    artifactPresentationContractRef: "artifact-presentation-contract:governance-evidence-vault-summary-first",
    outboundNavigationGrantPolicyRef: "outbound-navigation-grant:archive-export:return-safe",
    accessGrantRef: accessGrant.archiveAccessGrantId,
    blockedArtifactRefs: blocked ? items.map((item) => item.evidenceRef) : quarantined,
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function buildArchiveVerdict(
  scenarioId: Archive488ScenarioState,
  blockerRefs: readonly string[],
  exceptionRefs: readonly string[],
): ArchiveVerdict {
  if (blockerRefs.length > 0) return "blocked";
  if (scenarioId === "sealed") return "sealed";
  if (exceptionRefs.length > 0 || scenarioId === "trace_sensitive_quarantine") return "sealed_with_exceptions";
  return "sealed_with_exceptions";
}

function buildCommand(
  scenarioId: Archive488ScenarioState,
  verdict: ArchiveVerdict,
  items: readonly ArchivedEvidenceItem[],
  blockerRefs: readonly string[],
): ArchiveCommand {
  return withHash<ArchiveCommand>({
    recordType: "LaunchEvidenceArchiveCommand",
    archiveCommandId: `launch_evidence_archive_command_488_${scenarioLabel(scenarioId)}`,
    scenarioId,
    requestedVerdict: verdict,
    roleAuthorizationRef: "role-auth:records-governance:archive-seal",
    tenantScope: releaseBinding.tenantScope,
    cohortScope: releaseBinding.cohortScope,
    channelScope: releaseBinding.channelScope,
    idempotencyKey: `idem:488:launch-evidence-archive:${scenarioLabel(scenarioId)}:2026-04-28`,
    purposeBindingRef: "purpose:launch-evidence-archive-and-lessons",
    injectedClockRef: `clock:${FIXED_NOW}`,
    releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
    watchTupleHash: releaseBinding.watchTupleHash,
    evidenceRefs: items.map((item) => item.evidenceRef),
    blockerRefs,
    sourceRefs,
    createdAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:488:archive-command:${scenarioLabel(scenarioId)}`,
  });
}

function buildSettlement(
  scenarioId: Archive488ScenarioState,
  verdict: ArchiveVerdict,
  command: ArchiveCommand,
  seals: readonly WORMSealRecord[],
  items: readonly ArchivedEvidenceItem[],
  exportPosture: EvidenceExportPosture,
  blockerRefs: readonly string[],
): ArchiveSettlement {
  const wormSealDigest = hashValue(seals.map((seal) => seal.sealHash));
  return withHash<ArchiveSettlement>({
    recordType: "LaunchEvidenceArchiveSettlement",
    archiveSettlementId: `launch_evidence_archive_settlement_488_${scenarioLabel(scenarioId)}`,
    scenarioId,
    archiveCommandRef: command.archiveCommandId,
    result: verdict,
    wormSealDigest,
    sealedEvidenceCount: items.filter((item) => item.sealState === "sealed").length,
    quarantinedEvidenceCount: items.filter((item) => item.quarantineState === "quarantined").length,
    legalHoldCount: items.filter((item) => item.legalHoldState === "active" || item.legalHoldState === "conflict").length,
    exportState: exportPosture.exportState,
    archiveRecoveryActionRef:
      verdict === "blocked" ? "recovery:488:hold-archive-unsealed" : "recovery:488:archive-review-cadence",
    blockerRefs,
    sourceRefs,
    recordedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:488:archive-settlement:${scenarioLabel(scenarioId)}`,
  });
}

export function build488ScenarioRecords(
  scenarioId: Archive488ScenarioState = "sealed_with_exceptions",
  artifactRefs: readonly string[] = [],
) {
  ensureRequiredInputs();
  const items = buildArchivedEvidenceItems(scenarioId);
  const seals = buildWormSealRecords(scenarioId, items);
  const lineageChains = buildLineageChains(scenarioId, items);
  const retentionClassifications = buildRetentionClassifications(scenarioId, items);
  const legalHoldBindings = buildLegalHoldBindings(scenarioId, items);
  const deletionVerdicts = buildDeletionVerdicts(scenarioId, items);
  const lessonsRegister = buildLessonsRegister(scenarioId);
  const capaActions = buildCapaActions(scenarioId, lessonsRegister);
  const continuousImprovementLinks = buildContinuousImprovementLinks(scenarioId, lessonsRegister);
  const accessGrant = buildAccessGrant(scenarioId);
  const exportPosture = buildExportPosture(scenarioId, items, accessGrant);
  const blockerRefs = uniq([
    ...items.flatMap((item) => item.blockerRefs.filter((blocker) => blocker.startsWith("blocker:"))),
    ...seals.flatMap((seal) => seal.blockerRefs),
    ...lineageChains.flatMap((chain) => chain.blockerRefs),
    ...retentionClassifications.flatMap((classification) => classification.blockerRefs),
    ...legalHoldBindings.flatMap((binding) => binding.blockerRefs),
    ...deletionVerdicts.flatMap((verdict) => verdict.blockerRefs),
    ...lessonsRegister.blockerRefs,
    ...(accessGrant.grantState === "denied" ? ["blocker:488:archive-export-role-denied"] : []),
  ]);
  const exceptionRefs = uniq([
    ...items.flatMap((item) => item.blockerRefs.filter((blocker) => blocker.startsWith("exception:"))),
    ...items.filter((item) => item.exportEligibility === "restricted").map((item) => `exception:488:restricted-export:${item.family}`),
    ...items.filter((item) => item.quarantineState === "quarantined").map((item) => `exception:488:quarantined:${item.family}`),
  ]);
  const verdict = buildArchiveVerdict(scenarioId, blockerRefs, exceptionRefs);
  const command = buildCommand(scenarioId, verdict, items, blockerRefs);
  const settlement = buildSettlement(scenarioId, verdict, command, seals, items, exportPosture, blockerRefs);
  const manifest = withHash<LaunchEvidenceArchiveManifest>({
    recordType: "LaunchEvidenceArchiveManifest",
    launchEvidenceArchiveManifestId: `launch_evidence_archive_manifest_488_${scenarioLabel(scenarioId)}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    archiveVerdict: verdict,
    ...releaseBinding,
    retentionPolicyVersion: "retention-policy:launch-evidence:v1",
    archivedEvidenceItemRefs: items.map((item) => item.archivedEvidenceItemId),
    wormSealRecordRefs: seals.map((seal) => seal.wormSealRecordId),
    evidenceLineageChainRefs: lineageChains.map((chain) => chain.lineageChainId),
    retentionClassificationRefs: retentionClassifications.map((classification) => classification.retentionClassificationId),
    legalHoldBindingRefs: legalHoldBindings.map((binding) => binding.legalHoldBindingId),
    deletionProtectionVerdictRefs: deletionVerdicts.map((verdictRecord) => verdictRecord.deletionProtectionVerdictId),
    lessonsLearnedRegisterRef: lessonsRegister.lessonsLearnedRegisterId,
    capaActionRefs: capaActions.map((action) => action.capaActionId),
    continuousImprovementLinkRefs: continuousImprovementLinks.map((link) => link.continuousImprovementLinkId),
    evidenceExportPostureRef: exportPosture.evidenceExportPostureId,
    archiveCommandRef: command.archiveCommandId,
    archiveSettlementRef: settlement.archiveSettlementId,
    wormSealDigest: settlement.wormSealDigest,
    legalHoldCount: settlement.legalHoldCount,
    quarantinedArtifactRefs: items.filter((item) => item.quarantineState === "quarantined").map((item) => item.evidenceRef),
    blockerRefs,
    exceptionRefs,
    artifactRefs,
    sourceRefs,
    owner: "svc-owner:records-governance",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:488:launch-evidence-archive:${scenarioLabel(scenarioId)}`,
  });

  return {
    manifest,
    items,
    seals,
    lineageChains,
    retentionClassifications,
    legalHoldBindings,
    deletionVerdicts,
    lessonsRegister,
    capaActions,
    continuousImprovementLinks,
    accessGrant,
    exportPosture,
    command,
    settlement,
  };
}

export function build488Records(artifactRefs: readonly string[] = []) {
  const activeScenario = build488ScenarioRecords("sealed_with_exceptions", artifactRefs);
  const edgeCaseFixtures = required488EdgeCases.map((scenarioId) => {
    const records = build488ScenarioRecords(scenarioId, []);
    return {
      scenarioId,
      expectedVerdict: records.manifest.archiveVerdict,
      blockerRefs: records.manifest.blockerRefs,
      exceptionRefs: records.manifest.exceptionRefs,
      exportState: records.exportPosture.exportState,
      quarantinedArtifactRefs: records.manifest.quarantinedArtifactRefs,
    };
  });
  return { activeScenario, edgeCaseFixtures };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/488_launch_archive.schema.json",
    title: "Task 488 Launch evidence archive contract",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "generatedAt", "recordHash"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      archiveVerdict: { enum: ["sealed", "sealed_with_exceptions", "blocked"] },
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
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_488_LAUNCH_ARCHIVE_AUTHORITY",
    gapSummary:
      "The repository had launch evidence artifacts but no single typed authority joining archive manifest, WORM seal, legal-hold/retention posture, export posture, and lessons/CAPA linkage.",
    sourceRefs,
    failClosedBridge: {
      bridgeId: "fail_closed_launch_archive_authority_bridge_488",
      privilegedMutationPermitted: false,
      archiveSealedOnlyWhen: [
        "every_evidence_item_has_source_tuple",
        "worm_seal_hashes_are_deterministic",
        "legal_hold_never_conflicts_with_deletion",
        "sensitive_trace_artifacts_are_quarantined_before_export",
        "lessons_have_owner_and_capa_or_ci_link",
        "open_wave_observation_is_not_marked_complete",
        "export_request_has_authorized_archive_access_grant",
      ],
      safeState: "archive_unsealed_or_sealed_with_exceptions_until_blockers_clear",
    },
    generatedAt: FIXED_NOW,
    recordHash: hashValue({
      gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_488_LAUNCH_ARCHIVE_AUTHORITY",
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
        topic: "Records management and legal hold",
        relevance: "Launch evidence must remain retention-aware and deletion protected when legal hold or WORM rules apply.",
        appliedAs: "RetentionClassification, LegalHoldBinding and DeletionProtectionVerdict records",
      },
      {
        topic: "Security and privacy",
        relevance: "Export and traces must be redacted and blocked for unauthorized roles.",
        appliedAs: "EvidenceExportPosture and ArchiveAccessGrant fail-closed checks",
      },
      {
        topic: "Clinical safety",
        relevance: "Clinical safety signoff and assistive evidence are confidential and carry long retention.",
        appliedAs: "clinical_safety_8y retention and restricted export posture",
      },
      {
        topic: "NHS App governance",
        relevance: "NHS App channel evidence remains tied to activation, monthly data and journey-change control.",
        appliedAs: "Channel family evidence shelf and CAPA linkage",
      },
      {
        topic: "Accessibility and governance UI",
        relevance: "Evidence Vault uses semantic shelves, tables, drawers, dialogs and keyboard focus restoration.",
        appliedAs: "Playwright ARIA snapshots and Evidence Vault route",
      },
    ],
  };
}

function buildAlgorithmAlignmentNotes(records: ReturnType<typeof build488Records>): string {
  return `# 488 Algorithm Alignment Notes

Generated: ${FIXED_NOW}

## Source alignment

- Implements Prompt 488 and the shared operating contract for tasks 473-489.
- Enumerates evidence from scorecard, migration, signoff, tests, DR, waves, assistive, channel, BAU and lessons families.
- Preserves archive posture through typed \`LaunchEvidenceArchiveManifest\`, \`ArchivedEvidenceItem\`, \`WORMSealRecord\`, retention/legal-hold bindings, export posture, lessons, CAPA and CI links.
- Uses deterministic canonical hashes and WORM refs for archive command, settlement, evidence items and access grants.

## Active archive

- Manifest: ${records.activeScenario.manifest.launchEvidenceArchiveManifestId}
- Verdict: ${records.activeScenario.manifest.archiveVerdict}
- Evidence items: ${records.activeScenario.items.length}
- WORM digest: ${records.activeScenario.manifest.wormSealDigest}
- Legal holds: ${records.activeScenario.manifest.legalHoldCount}
- Export posture: ${records.activeScenario.exportPosture.exportState}

## Edge cases covered

${records.edgeCaseFixtures
  .map(
    (edgeCase) =>
      `- ${edgeCase.scenarioId}: ${edgeCase.expectedVerdict}; blockers=${edgeCase.blockerRefs.join(", ")}; exceptions=${edgeCase.exceptionRefs.join(", ")}`,
  )
  .join("\n")}
`;
}

function buildArchiveReport(records: ReturnType<typeof build488Records>): string {
  return `# Launch Evidence Archive Report

Generated: ${FIXED_NOW}

The launch evidence archive is ${records.activeScenario.manifest.archiveVerdict}. The active WORM seal digest is \`${records.activeScenario.manifest.wormSealDigest}\` and all evidence remains tied to release watch tuple ${releaseBinding.releaseWatchTupleRef}.

## Evidence families

${[...new Set(records.activeScenario.items.map((item) => item.family))]
  .map((family) => `- ${family}: ${records.activeScenario.items.filter((item) => item.family === family).length} item(s)`)
  .join("\n")}

## Export posture

- State: ${records.activeScenario.exportPosture.exportState}
- Legal holds: ${records.activeScenario.manifest.legalHoldCount}
- Quarantined artifacts: ${records.activeScenario.manifest.quarantinedArtifactRefs.length}
`;
}

function buildLessonsReport(records: ReturnType<typeof build488Records>): string {
  return `# Lessons Learned And CAPA Report

Generated: ${FIXED_NOW}

## Lessons

${records.activeScenario.lessonsRegister.lessons
  .map(
    (lesson) =>
      `- ${lesson.title}: owner=${lesson.owner}; capa=${lesson.capaActionRef}; ci=${lesson.continuousImprovementLinkRef}`,
  )
  .join("\n")}

## CAPA actions

${records.activeScenario.capaActions
  .map((action) => `- ${action.capaActionId}: ${action.owner}; due=${action.dueDate}; severity=${action.severity}`)
  .join("\n")}
`;
}

export function write488LaunchEvidenceArchiveArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build488Records(artifactRefs);
  writeJson(
    "data/archive/488_launch_evidence_archive_manifest.json",
    withHash<JsonObject>({
      recordType: "LaunchEvidenceArchiveManifestEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activeManifest: records.activeScenario.manifest,
      activeCommand: records.activeScenario.command,
      activeSettlement: records.activeScenario.settlement,
      archivedEvidenceItems: records.activeScenario.items,
      evidenceLineageChains: records.activeScenario.lineageChains,
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );
  writeJson(
    "data/archive/488_worm_seal_records.json",
    withHash<JsonObject>({
      recordType: "WORMSealRecordEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      wormSealRecords: records.activeScenario.seals,
      wormSealDigest: records.activeScenario.manifest.wormSealDigest,
      sourceRefs,
    }),
  );
  writeJson(
    "data/archive/488_retention_and_legal_hold_matrix.json",
    withHash<JsonObject>({
      recordType: "RetentionAndLegalHoldMatrix",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      retentionClassifications: records.activeScenario.retentionClassifications,
      legalHoldBindings: records.activeScenario.legalHoldBindings,
      deletionProtectionVerdicts: records.activeScenario.deletionVerdicts,
      sourceRefs,
    }),
  );
  writeJson(
    "data/archive/488_lessons_learned_register.json",
    withHash<JsonObject>({
      recordType: "LessonsLearnedRegisterEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      lessonsLearnedRegister: records.activeScenario.lessonsRegister,
      sourceRefs,
    }),
  );
  writeJson(
    "data/archive/488_capa_and_continuous_improvement_actions.json",
    withHash<JsonObject>({
      recordType: "CAPAAndContinuousImprovementActions",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      capaActions: records.activeScenario.capaActions,
      continuousImprovementLinks: records.activeScenario.continuousImprovementLinks,
      sourceRefs,
    }),
  );
  writeJson(
    "data/archive/488_evidence_export_posture.json",
    withHash<JsonObject>({
      recordType: "EvidenceExportPostureEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      evidenceExportPosture: records.activeScenario.exportPosture,
      archiveAccessGrant: records.activeScenario.accessGrant,
      sourceRefs,
    }),
  );
  writeJson("data/contracts/488_launch_archive.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_488_LAUNCH_ARCHIVE_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/488_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/488_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes(records));
  writeText("docs/programme/488_launch_evidence_archive_report.md", buildArchiveReport(records));
  writeText("docs/programme/488_lessons_learned_and_capa_report.md", buildLessonsReport(records));
  formatFiles([
    "data/archive/488_launch_evidence_archive_manifest.json",
    "data/archive/488_worm_seal_records.json",
    "data/archive/488_retention_and_legal_hold_matrix.json",
    "data/archive/488_lessons_learned_register.json",
    "data/archive/488_capa_and_continuous_improvement_actions.json",
    "data/archive/488_evidence_export_posture.json",
    "data/contracts/488_launch_archive.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_488_LAUNCH_ARCHIVE_AUTHORITY.json",
    "data/analysis/488_external_reference_notes.json",
    "data/analysis/488_algorithm_alignment_notes.md",
    "docs/programme/488_launch_evidence_archive_report.md",
    "docs/programme/488_lessons_learned_and_capa_report.md",
  ]);
}

if (process.argv[1]?.endsWith("archive_488_launch_evidence.ts")) {
  write488LaunchEvidenceArchiveArtifacts();
}
