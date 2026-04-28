import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const GENERATED_AT = "2026-04-28T00:00:00.000Z";
const TASK_ID = "seq_474";
const SCHEMA_VERSION = "474.programme.migration-cutover.v1";
const TENANT_SCOPE_FALLBACK = "tenant-demo-gp:programme-core-release";

type ReadinessState = "ready" | "ready_with_constraints" | "blocked" | "rollback_only";
type MigrationPlanState = "ready" | "ready_with_constraints" | "blocked" | "deferred";
type ProjectionConvergenceState = "exact" | "stale" | "blocked" | "deferred";
type ScenarioState =
  | "dry_run"
  | "ready_with_constraints"
  | "blocked"
  | "rollback_only"
  | "poison_record"
  | "ready";

export interface CutoverExecutionBinding {
  readonly executionBindingId: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly migrationTupleHash: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly roleAuthorizationRef: string;
  readonly idempotencyKeyRequired: true;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly wormAuditOutputRef: string;
  readonly destructiveExecutionPermitted: boolean;
  readonly dryRunPermitted: boolean;
  readonly authorityState: "exact" | "release_candidate_authority_missing" | "rollback_only";
  readonly bindingHash: string;
}

export interface CutoverDependency {
  readonly dependencyId: string;
  readonly owner: string;
  readonly dependencyKind:
    | "runtime_bundle"
    | "release_wave"
    | "projection"
    | "read_path"
    | "reference_data"
    | "resilience"
    | "channel";
  readonly state: "exact" | "ready_with_constraints" | "missing" | "blocked" | "deferred";
  readonly sourceRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly dependencyHash: string;
}

export interface CutoverStep {
  readonly stepId: string;
  readonly order: number;
  readonly title: string;
  readonly owner: string;
  readonly settlementState:
    | "not_started"
    | "dry_run_exact"
    | "waiting"
    | "blocked"
    | "rollback_only";
  readonly privilegedMutation: boolean;
  readonly requiredRoleRef: string;
  readonly idempotencyKeyScope: string;
  readonly commandSettlementSchemaRef: string;
  readonly wormAuditRef: string;
  readonly preconditionRefs: readonly string[];
  readonly stopTriggerRefs: readonly string[];
  readonly resumeCheckpointRef: string;
  readonly rollbackDecisionRef: string;
  readonly stepHash: string;
}

export interface ProgrammeCutoverPlan {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly cutoverPlanId: string;
  readonly cutoverDecision: ReadinessState;
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly migrationTupleHash: string;
  readonly executionBinding: CutoverExecutionBinding;
  readonly dependencies: readonly CutoverDependency[];
  readonly steps: readonly CutoverStep[];
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly dryRunPermitted: boolean;
  readonly destructiveExecutionPermitted: boolean;
  readonly sourceRefs: readonly string[];
  readonly cutoverPlanHash: string;
}

export interface MigrationPlanRecord {
  readonly migrationPlanId: string;
  readonly migrationKind: "schema" | "projection_cursor" | "records_lifecycle" | "contract_removal";
  readonly storeScope: string;
  readonly changeType: "additive" | "backfill" | "contractive" | "rollforward_only";
  readonly owner: string;
  readonly state: MigrationPlanState;
  readonly releaseApprovalFreezeRef: string;
  readonly sourceSchemaVersionRefs: readonly string[];
  readonly targetSchemaVersionRefs: readonly string[];
  readonly affectedStoreRefs: readonly string[];
  readonly affectedEventFamilyRefs: readonly string[];
  readonly affectedProjectionFamilyRefs: readonly string[];
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly commandContractRefs: readonly string[];
  readonly readPathCompatibilityWindowRef: string;
  readonly rollbackMode: "rollback" | "rollforward_only" | "flag_only" | "manual_fallback";
  readonly manualFallbackBindingRef: string | null;
  readonly contractiveRemovalPermitted: boolean;
  readonly blockerRefs: readonly string[];
  readonly verificationRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly migrationPlanHash: string;
}

export interface SchemaMigrationPlan {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly planSetId: string;
  readonly releaseRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly tenantScope: string;
  readonly executionOrder: readonly ["expand", "migrate", "contract"];
  readonly migrationPlans: readonly MigrationPlanRecord[];
  readonly edgeCaseGuards: readonly {
    readonly edgeCaseId: string;
    readonly expectedState: "blocked" | "ready_with_constraints";
    readonly guard: string;
    readonly evidenceRefs: readonly string[];
    readonly guardHash: string;
  }[];
  readonly sourceFileHashes: readonly { readonly ref: string; readonly sha256: string }[];
  readonly sourceRefs: readonly string[];
  readonly planSetHash: string;
}

export interface BackfillConvergenceRecord {
  readonly convergenceRecordId: string;
  readonly projectionFamily: string;
  readonly tenantScope: string;
  readonly routeFamilyRefs: readonly string[];
  readonly convergenceState: ProjectionConvergenceState;
  readonly currentSequence: number;
  readonly targetSequence: number;
  readonly lagEvents: number;
  readonly lagBudgetEvents: number;
  readonly compareHash: string;
  readonly deterministicFixtureRef: string;
  readonly stableClockRef: string;
  readonly boundedCursorProgress: true;
  readonly duplicateWormRowsPrevented: true;
  readonly safeToContinue: boolean;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly convergenceHash: string;
}

export interface ProjectionBackfillCursor {
  readonly cursorId: string;
  readonly projectionFamily: string;
  readonly cursorState: "ready" | "paused" | "stale" | "deferred";
  readonly sourceEventWindow: {
    readonly fromInclusive: number;
    readonly toInclusive: number;
  };
  readonly lastProcessedEventId: string;
  readonly checkpointEveryEvents: number;
  readonly resumeCheckpointRef: string;
  readonly crashRestartProofRef: string;
  readonly cursorHash: string;
}

export interface PoisonBackfillRecord {
  readonly poisonRecordId: string;
  readonly projectionFamily: string;
  readonly tenantScope: string;
  readonly poisonState: "quarantined" | "blocking";
  readonly tenantWideBlock: boolean;
  readonly safeToContinue: boolean;
  readonly affectedRecordHash: string;
  readonly reasonCode: string;
  readonly quarantineLedgerRef: string;
  readonly quarantineHash: string;
}

export interface BackfillResumeCheckpoint {
  readonly checkpointId: string;
  readonly projectionFamily: string;
  readonly stopReason: string;
  readonly stoppedAtEventId: string;
  readonly resumedAtEventId: string;
  readonly duplicateWormRowsAfterResume: 0;
  readonly checkpointHash: string;
}

export interface ProjectionBackfillPlan {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly backfillPlanId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly cutoverReadinessState: ReadinessState;
  readonly projectionFamilies: readonly string[];
  readonly cursors: readonly ProjectionBackfillCursor[];
  readonly convergenceRecords: readonly BackfillConvergenceRecord[];
  readonly poisonRecords: readonly PoisonBackfillRecord[];
  readonly resumeCheckpoints: readonly BackfillResumeCheckpoint[];
  readonly stopResumeFenceRef: string;
  readonly readPathCompatibilityWindowRef: string;
  readonly migrationExecutionBindingRef: string;
  readonly sourceRefs: readonly string[];
  readonly planHash: string;
}

export interface ReferenceDatasetRecordClass {
  readonly recordClassId: string;
  readonly datasetRef: string;
  readonly owner: string;
  readonly tenantScope: string;
  readonly provenanceRef: string;
  readonly phiClassification: "none" | "rejected_unmasked_phi";
  readonly piiClassification: "none" | "masked" | "rejected_cross_tenant";
  readonly maskingState: "masked" | "synthetic_only" | "rejected";
  readonly retentionClass: "reference_operational" | "clinical_reference" | "audit_metadata";
  readonly allowedUsageContexts: readonly string[];
  readonly rawIdentifierFields: readonly string[];
  readonly approvalRef: string;
  readonly recordClassHash: string;
}

export interface SyntheticDatasetPrivacyAttestation {
  readonly attestationId: string;
  readonly syntheticOnly: true;
  readonly noPhi: true;
  readonly noPii: true;
  readonly tenantCrossingIdentifiersPresent: false;
  readonly rawIdentifierFields: readonly [];
  readonly forbiddenPatternSetRef: string;
  readonly evidenceRefs: readonly string[];
  readonly attestationHash: string;
}

export interface ReferenceDatasetManifest {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly manifestId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly privacyAttestation: SyntheticDatasetPrivacyAttestation;
  readonly recordClasses: readonly ReferenceDatasetRecordClass[];
  readonly rejectedEdgeCases: readonly {
    readonly edgeCaseId: string;
    readonly rejectedReason: string;
    readonly safeFixtureRef: string;
    readonly rejectionHash: string;
  }[];
  readonly changeApprovals: readonly {
    readonly approvalId: string;
    readonly owner: string;
    readonly approvalState: "approved_for_dry_run" | "blocked";
    readonly wormAuditRef: string;
    readonly approvalHash: string;
  }[];
  readonly sourceRefs: readonly string[];
  readonly manifestHash: string;
}

export interface ReadPathCompatibilityWindow {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly windowSetId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly runtimePublicationBundleRef: string;
  readonly routeBindings: readonly {
    readonly routeBindingId: string;
    readonly routeFamily: string;
    readonly compatibilityState: "exact" | "stale" | "deferred" | "blocked";
    readonly runtimeBundleRef: string;
    readonly routeContractDigestRef: string;
    readonly frontendContractDigestRef: string;
    readonly projectionQueryDigestRef: string;
    readonly mutationCommandDigestRef: string;
    readonly commandSettlementSchemaRef: string;
    readonly transitionEnvelopeSchemaRef: string;
    readonly requiredReleaseRecoveryDispositionRef: string;
    readonly bindingHash: string;
  }[];
  readonly windows: readonly {
    readonly windowId: string;
    readonly windowKind: "additive" | "backfill" | "contractive" | "rollforward_only";
    readonly state: "exact" | "constrained" | "blocked";
    readonly opensAt: string;
    readonly closesAt: string | null;
    readonly legacyReadPathActive: boolean;
    readonly featureFlagRefs: readonly string[];
    readonly blockerRefs: readonly string[];
    readonly windowHash: string;
  }[];
  readonly featureFlagGuards: readonly {
    readonly guardId: string;
    readonly flagRef: string;
    readonly state: "blocked" | "exact";
    readonly reason: string;
    readonly guardHash: string;
  }[];
  readonly sourceRefs: readonly string[];
  readonly windowSetHash: string;
}

export interface CutoverRollbackDecision {
  readonly rollbackDecisionId: string;
  readonly targetRef: string;
  readonly decisionState: "ready" | "manual_fallback_required" | "rollback_only" | "blocked";
  readonly stopCondition: string;
  readonly rollbackPath: string;
  readonly rollforwardPath: string;
  readonly manualFallbackBindingRef: string;
  readonly wormAuditRef: string;
  readonly decisionHash: string;
}

export interface StopResumeRollbackMatrix {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly matrixId: string;
  readonly rollbackDecisions: readonly CutoverRollbackDecision[];
  readonly manualFallbackBindings: readonly {
    readonly bindingId: string;
    readonly routeFamily: string;
    readonly owner: string;
    readonly fallbackMode: "manual_route" | "last_known_good_read_model" | "rollback_only";
    readonly settlementRequired: true;
    readonly bindingHash: string;
  }[];
  readonly sourceRefs: readonly string[];
  readonly matrixHash: string;
}

export interface ProjectionReadinessVerdict {
  readonly verdictId: string;
  readonly projectionFamily: string;
  readonly tenantScope: string;
  readonly verdictState: ReadinessState;
  readonly convergenceState: ProjectionConvergenceState;
  readonly allowDryRun: boolean;
  readonly allowDestructiveCutover: boolean;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly verdictHash: string;
}

export interface ProjectionReadinessVerdicts {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof GENERATED_AT;
  readonly verdictSetId: string;
  readonly overallState: ReadinessState;
  readonly dryRunPermitted: boolean;
  readonly destructiveExecutionPermitted: boolean;
  readonly verdicts: readonly ProjectionReadinessVerdict[];
  readonly edgeCaseOutcomes: readonly {
    readonly edgeCaseId: string;
    readonly expectedState: ReadinessState;
    readonly assertion: string;
    readonly outcomeHash: string;
  }[];
  readonly sourceRefs: readonly string[];
  readonly verdictSetHash: string;
}

export interface CutoverArtifacts {
  readonly schemaMigrationPlan: SchemaMigrationPlan;
  readonly projectionBackfillPlan: ProjectionBackfillPlan;
  readonly referenceDatasetManifest: ReferenceDatasetManifest;
  readonly readPathCompatibilityWindow: ReadPathCompatibilityWindow;
  readonly cutoverRunbook: {
    readonly schemaVersion: typeof SCHEMA_VERSION;
    readonly taskId: typeof TASK_ID;
    readonly generatedAt: typeof GENERATED_AT;
    readonly runbookId: string;
    readonly programmeCutoverPlan: ProgrammeCutoverPlan;
    readonly orderedStepRefs: readonly string[];
    readonly operatorChecklist: readonly string[];
    readonly runbookHash: string;
  };
  readonly stopResumeRollbackMatrix: StopResumeRollbackMatrix;
  readonly projectionReadinessVerdicts: ProjectionReadinessVerdicts;
  readonly contractSchema: Record<string, unknown>;
  readonly interfaceGap: Record<string, unknown>;
  readonly algorithmNotes: string;
  readonly externalReferenceNotes: Record<string, unknown>;
}

const sourceAlgorithmRefs = [
  "prompt/474.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/platform-runtime-and-release-blueprint.md",
  "blueprint/phase-9-the-assurance-ledger.md",
  "blueprint/phase-0-the-foundation-protocol.md",
  "docs/architecture/95_schema_migration_and_projection_backfill_design.md",
] as const;

const upstreamEvidenceRefs = [
  "data/conformance/472_cross_phase_conformance_scorecard.json",
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/evidence/467_retention_legal_hold_worm_replay_results.json",
  "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
  "data/evidence/470_full_regression_and_defensive_security_results.json",
  "data/evidence/471_phase9_exit_gate_decision.json",
  "data/release/release_candidate_tuple.json",
  "data/analysis/runtime_publication_bundles.json",
] as const;

function toAbsolute(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value === undefined ? null : value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertFile(relativePath: string): void {
  if (!fs.existsSync(toAbsolute(relativePath))) {
    throw new Error(`Missing task 474 source artifact: ${relativePath}`);
  }
}

function readJson<T>(relativePath: string): T {
  assertFile(relativePath);
  return JSON.parse(fs.readFileSync(toAbsolute(relativePath), "utf8")) as T;
}

function fileHash(relativePath: string): string {
  const fileRef = relativePath.split("#")[0] ?? relativePath;
  assertFile(fileRef);
  return sha256(fs.readFileSync(toAbsolute(fileRef)));
}

function withHash<T extends object, K extends string>(
  record: T,
  hashKey: K,
): T & Record<K, string> {
  return {
    ...record,
    [hashKey]: sha256(stableStringify(record)),
  } as T & Record<K, string>;
}

function digestRef(prefix: string, value: unknown): string {
  return `${prefix}::${sha256(stableStringify(value)).slice(0, 16)}`;
}

function writeJson(relativePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(toAbsolute(relativePath)), { recursive: true });
  fs.writeFileSync(toAbsolute(relativePath), `${JSON.stringify(sortValue(value), null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  fs.mkdirSync(path.dirname(toAbsolute(relativePath)), { recursive: true });
  fs.writeFileSync(toAbsolute(relativePath), value.endsWith("\n") ? value : `${value}\n`);
}

function sourceFileHashes() {
  return [...sourceAlgorithmRefs, ...upstreamEvidenceRefs].map((ref) => ({
    ref,
    sha256: fileHash(ref),
  }));
}

function routeBinding(routeFamily: string, state: "exact" | "stale" | "deferred" | "blocked") {
  const base = {
    routeBindingId: `rpb_474_${routeFamily}`,
    routeFamily,
    compatibilityState: state,
    runtimeBundleRef: "rpb::local::authoritative",
    routeContractDigestRef: digestRef("route-contract-digest", routeFamily),
    frontendContractDigestRef: digestRef("frontend-contract-digest", `${routeFamily}:frontend`),
    projectionQueryDigestRef: digestRef("projection-query-digest", `${routeFamily}:query`),
    mutationCommandDigestRef: digestRef("mutation-command-digest", `${routeFamily}:mutation`),
    commandSettlementSchemaRef: "data/contracts/229_admin_resolution_settlement.schema.json",
    transitionEnvelopeSchemaRef: "data/contracts/144_draft_autosave_patch_envelope.schema.json",
    requiredReleaseRecoveryDispositionRef: `release-recovery-disposition:${routeFamily}`,
  };
  return withHash(base, "bindingHash");
}

function migrationPlan(input: Omit<MigrationPlanRecord, "migrationPlanHash">): MigrationPlanRecord {
  return withHash(input, "migrationPlanHash");
}

function convergenceRecord(
  input: Omit<BackfillConvergenceRecord, "compareHash" | "convergenceHash">,
): BackfillConvergenceRecord {
  const withCompare = {
    ...input,
    compareHash: digestRef("projection-compare", {
      projectionFamily: input.projectionFamily,
      currentSequence: input.currentSequence,
      targetSequence: input.targetSequence,
      state: input.convergenceState,
    }),
  };
  return withHash(withCompare, "convergenceHash");
}

function projectionCursor(
  input: Omit<ProjectionBackfillCursor, "cursorHash">,
): ProjectionBackfillCursor {
  return withHash(input, "cursorHash");
}

function poisonRecord(input: Omit<PoisonBackfillRecord, "quarantineHash">): PoisonBackfillRecord {
  return withHash(input, "quarantineHash");
}

function resumeCheckpoint(
  input: Omit<BackfillResumeCheckpoint, "checkpointHash">,
): BackfillResumeCheckpoint {
  return withHash(input, "checkpointHash");
}

function referenceRecord(
  input: Omit<ReferenceDatasetRecordClass, "recordClassHash">,
): ReferenceDatasetRecordClass {
  return withHash(input, "recordClassHash");
}

function cutoverDependency(input: Omit<CutoverDependency, "dependencyHash">): CutoverDependency {
  return withHash(input, "dependencyHash");
}

function cutoverStep(input: Omit<CutoverStep, "stepHash">): CutoverStep {
  return withHash(input, "stepHash");
}

function rollbackDecision(
  input: Omit<CutoverRollbackDecision, "decisionHash">,
): CutoverRollbackDecision {
  return withHash(input, "decisionHash");
}

function readinessVerdict(
  input: Omit<ProjectionReadinessVerdict, "verdictHash">,
): ProjectionReadinessVerdict {
  return withHash(input, "verdictHash");
}

function scenarioShape(scenarioState: ScenarioState) {
  if (scenarioState === "ready") {
    return {
      overallState: "ready" as const,
      destructiveExecutionPermitted: true,
      dryRunPermitted: true,
      pharmacyConvergenceState: "exact" as const,
      rollbackOnly: false,
      poisonSafe: false,
    };
  }
  if (scenarioState === "blocked") {
    return {
      overallState: "blocked" as const,
      destructiveExecutionPermitted: false,
      dryRunPermitted: false,
      pharmacyConvergenceState: "blocked" as const,
      rollbackOnly: false,
      poisonSafe: false,
    };
  }
  if (scenarioState === "rollback_only") {
    return {
      overallState: "rollback_only" as const,
      destructiveExecutionPermitted: false,
      dryRunPermitted: false,
      pharmacyConvergenceState: "stale" as const,
      rollbackOnly: true,
      poisonSafe: false,
    };
  }
  return {
    overallState: "ready_with_constraints" as const,
    destructiveExecutionPermitted: false,
    dryRunPermitted: true,
    pharmacyConvergenceState: "stale" as const,
    rollbackOnly: false,
    poisonSafe: scenarioState === "poison_record",
  };
}

export function build474CutoverArtifacts(
  scenarioState: ScenarioState = "ready_with_constraints",
): CutoverArtifacts {
  for (const ref of [...sourceAlgorithmRefs, ...upstreamEvidenceRefs]) {
    assertFile(ref);
  }

  const scorecard473 = readJson<{
    releaseRef?: string;
    tenantScope?: string;
    scorecardHash?: string;
    sourceScorecardHash?: string;
    phase7ChannelReadinessState?: string;
    channelActivationPermitted?: boolean;
  }>("data/conformance/473_master_scorecard_after_phase7_reconciliation.json");
  const phase7 = readJson<{
    releaseRef?: string;
    tenantScope?: string;
    reconciliationHash?: string;
    readinessPredicate?: {
      state?: string;
      manifestVersionRef?: string;
      optionalFutureInputStates?: readonly {
        taskId: string;
        expectedArtifactRef: string;
        availabilityState: "available" | "not_yet_available";
      }[];
    };
  }>("data/conformance/473_phase7_channel_readiness_reconciliation.json");
  const releaseTuple = readJson<{
    releaseCandidateTuple?: {
      releaseRef?: string;
      releaseApprovalFreezeRef?: string;
      runtimePublicationBundleRef?: string;
      releasePublicationParityRef?: string;
    };
  }>("data/release/release_candidate_tuple.json");

  const shape = scenarioShape(scenarioState);
  const releaseRef = scorecard473.releaseRef ?? phase7.releaseRef ?? "release:programme-core:474";
  const tenantScope = scorecard473.tenantScope ?? phase7.tenantScope ?? TENANT_SCOPE_FALLBACK;
  const releaseCandidateRef = releaseTuple.releaseCandidateTuple?.releaseRef ?? "RC_LOCAL_V1";
  const releaseApprovalFreezeRef =
    releaseTuple.releaseCandidateTuple?.releaseApprovalFreezeRef ?? "RAF_LOCAL_V1";
  const runtimePublicationBundleRef =
    releaseTuple.releaseCandidateTuple?.runtimePublicationBundleRef ?? "rpb::local::authoritative";
  const releasePublicationParityRef =
    releaseTuple.releaseCandidateTuple?.releasePublicationParityRef ?? "rpp::local::authoritative";

  const commonSourceRefs = [...sourceAlgorithmRefs, ...upstreamEvidenceRefs];
  const hashes = sourceFileHashes();

  const readPathCompatibilityWindowBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    windowSetId: "rpcw_474_programme_cutover",
    releaseRef,
    tenantScope,
    runtimePublicationBundleRef,
    routeBindings: [
      routeBinding("patient_status", "exact"),
      routeBinding("staff_workspace", "exact"),
      routeBinding(
        "pharmacy_console",
        shape.pharmacyConvergenceState === "exact" ? "exact" : "stale",
      ),
      routeBinding("ops_assurance", "exact"),
      routeBinding("nhs_app_channel", "deferred"),
    ],
    windows: [
      withHash(
        {
          windowId: "rpcw_474_additive_event_lineage",
          windowKind: "additive" as const,
          state: "exact" as const,
          opensAt: "2026-04-28T00:15:00.000Z",
          closesAt: null,
          legacyReadPathActive: true,
          featureFlagRefs: ["feature:474:additive-lineage-columns"],
          blockerRefs: [],
        },
        "windowHash",
      ),
      withHash(
        {
          windowId: "rpcw_474_backfill_shadow_compare",
          windowKind: "backfill" as const,
          state: shape.overallState === "blocked" ? ("blocked" as const) : ("constrained" as const),
          opensAt: "2026-04-28T01:00:00.000Z",
          closesAt: null,
          legacyReadPathActive: true,
          featureFlagRefs: ["feature:474:projection-shadow-read"],
          blockerRefs:
            shape.pharmacyConvergenceState === "exact"
              ? []
              : ["blocker:474:pharmacy-console-projection-stale"],
        },
        "windowHash",
      ),
      withHash(
        {
          windowId: "rpcw_474_contractive_patient_status",
          windowKind: "contractive" as const,
          state: "blocked" as const,
          opensAt: "2026-04-28T04:00:00.000Z",
          closesAt: null,
          legacyReadPathActive: true,
          featureFlagRefs: ["feature:474:remove-legacy-patient-status-columns"],
          blockerRefs: ["blocker:474:legacy-patient-status-read-path-active"],
        },
        "windowHash",
      ),
      withHash(
        {
          windowId: "rpcw_474_rollforward_fhir_index_hardening",
          windowKind: "rollforward_only" as const,
          state: "constrained" as const,
          opensAt: "2026-04-28T02:15:00.000Z",
          closesAt: null,
          legacyReadPathActive: true,
          featureFlagRefs: ["feature:474:fhir-index-v2"],
          blockerRefs: [],
        },
        "windowHash",
      ),
      withHash(
        {
          windowId: "rpcw_474_new_command_schema_flag",
          windowKind: "additive" as const,
          state: "blocked" as const,
          opensAt: "2026-04-28T03:00:00.000Z",
          closesAt: null,
          legacyReadPathActive: true,
          featureFlagRefs: ["feature:474:new-command-schema"],
          blockerRefs: ["blocker:474:new-command-schema-before-read-path-window"],
        },
        "windowHash",
      ),
    ],
    featureFlagGuards: [
      withHash(
        {
          guardId: "ffg_474_new_command_schema_window_start",
          flagRef: "feature:474:new-command-schema",
          state: "blocked" as const,
          reason:
            "The new command schema feature flag cannot enable before the read-path compatibility window opens and publishes exact route/query/settlement digests.",
        },
        "guardHash",
      ),
      withHash(
        {
          guardId: "ffg_474_shadow_read_observe_only",
          flagRef: "feature:474:projection-shadow-read",
          state: "exact" as const,
          reason:
            "Shadow read can run observe-only with stale pharmacy projection surfaced as a blocker.",
        },
        "guardHash",
      ),
    ],
    sourceRefs: commonSourceRefs,
  };
  const readPathCompatibilityWindow = withHash(
    readPathCompatibilityWindowBase,
    "windowSetHash",
  ) satisfies ReadPathCompatibilityWindow;

  const schemaMigrationPlanBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    planSetId: "smp_474_programme_cutover",
    releaseRef,
    runtimePublicationBundleRef,
    releasePublicationParityRef,
    tenantScope,
    executionOrder: ["expand", "migrate", "contract"] as const,
    migrationPlans: [
      migrationPlan({
        migrationPlanId: "smp_474_expand_event_lineage_columns",
        migrationKind: "schema",
        storeScope: "store:command-api:event-lineage",
        changeType: "additive",
        owner: "platform-data",
        state: "ready",
        releaseApprovalFreezeRef,
        sourceSchemaVersionRefs: ["event-lineage:v1"],
        targetSchemaVersionRefs: ["event-lineage:v2-additive"],
        affectedStoreRefs: ["store:command-api:event-store", "store:assurance-ledger"],
        affectedEventFamilyRefs: ["submission", "identity", "booking", "pharmacy", "assurance"],
        affectedProjectionFamilyRefs: ["patient_status", "staff_workspace", "ops_assurance"],
        affectedRouteFamilyRefs: ["patient_status", "staff_workspace", "ops_assurance"],
        commandContractRefs: ["command-contract:474:additive-lineage"],
        readPathCompatibilityWindowRef: "rpcw_474_additive_event_lineage",
        rollbackMode: "flag_only",
        manualFallbackBindingRef: null,
        contractiveRemovalPermitted: false,
        blockerRefs: [],
        verificationRefs: ["tests/migration/474_schema_migration_plan.test.ts"],
        sourceRefs: [
          "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
          "blueprint/phase-0-the-foundation-protocol.md#event-lineage",
        ],
      }),
      migrationPlan({
        migrationPlanId: "smp_474_projection_cursor_ledger",
        migrationKind: "projection_cursor",
        storeScope: "store:projection-worker:cursor-ledger",
        changeType: "backfill",
        owner: "platform-projections",
        state: shape.overallState === "blocked" ? "blocked" : "ready_with_constraints",
        releaseApprovalFreezeRef,
        sourceSchemaVersionRefs: ["projection-cursor:v1"],
        targetSchemaVersionRefs: ["projection-cursor:v2-resume-ledger"],
        affectedStoreRefs: ["store:projection-worker:read-models", "store:assurance-ledger"],
        affectedEventFamilyRefs: ["submission", "booking", "pharmacy", "ops_assurance"],
        affectedProjectionFamilyRefs: [
          "patient_status",
          "staff_workspace",
          "pharmacy_console",
          "ops_assurance",
        ],
        affectedRouteFamilyRefs: [
          "patient_status",
          "staff_workspace",
          "pharmacy_console",
          "ops_assurance",
        ],
        commandContractRefs: ["command-contract:474:backfill-cursor-resume"],
        readPathCompatibilityWindowRef: "rpcw_474_backfill_shadow_compare",
        rollbackMode: "manual_fallback",
        manualFallbackBindingRef: "manual-fallback:474:last-known-good-read-model",
        contractiveRemovalPermitted: false,
        blockerRefs:
          shape.pharmacyConvergenceState === "exact"
            ? []
            : ["blocker:474:pharmacy-console-projection-stale"],
        verificationRefs: ["tests/migration/474_projection_backfill_plan.test.ts"],
        sourceRefs: [
          "blueprint/platform-runtime-and-release-blueprint.md#ProjectionBackfillPlan",
          "blueprint/phase-9-the-assurance-ledger.md#projection-rebuild",
        ],
      }),
      migrationPlan({
        migrationPlanId: "smp_474_records_lifecycle_worm_binding",
        migrationKind: "records_lifecycle",
        storeScope: "store:records-lifecycle:archive-pointer",
        changeType: "additive",
        owner: "records-governance",
        state: "ready",
        releaseApprovalFreezeRef,
        sourceSchemaVersionRefs: ["records-lifecycle:v1"],
        targetSchemaVersionRefs: ["records-lifecycle:v2-worm-pointer"],
        affectedStoreRefs: ["store:records-lifecycle", "store:worm-ledger"],
        affectedEventFamilyRefs: ["retention", "legal_hold", "deletion_certificate"],
        affectedProjectionFamilyRefs: ["ops_assurance"],
        affectedRouteFamilyRefs: ["ops_assurance"],
        commandContractRefs: ["command-contract:474:records-pointer-additive"],
        readPathCompatibilityWindowRef: "rpcw_474_additive_event_lineage",
        rollbackMode: "flag_only",
        manualFallbackBindingRef: null,
        contractiveRemovalPermitted: false,
        blockerRefs: [],
        verificationRefs: ["data/evidence/467_retention_legal_hold_worm_replay_results.json"],
        sourceRefs: [
          "blueprint/phase-9-the-assurance-ledger.md#records-lifecycle",
          "blueprint/phase-0-the-foundation-protocol.md#WORM-ledger",
        ],
      }),
      migrationPlan({
        migrationPlanId: "smp_474_contract_legacy_patient_status_columns",
        migrationKind: "contract_removal",
        storeScope: "store:patient-status:legacy-columns",
        changeType: "contractive",
        owner: "platform-data",
        state: "blocked",
        releaseApprovalFreezeRef,
        sourceSchemaVersionRefs: ["patient-status:v1-legacy-columns"],
        targetSchemaVersionRefs: ["patient-status:v2-canonical-status"],
        affectedStoreRefs: ["store:patient-status-read-model"],
        affectedEventFamilyRefs: ["submission", "pharmacy"],
        affectedProjectionFamilyRefs: ["patient_status"],
        affectedRouteFamilyRefs: ["patient_status"],
        commandContractRefs: ["command-contract:474:patient-status-contract"],
        readPathCompatibilityWindowRef: "rpcw_474_contractive_patient_status",
        rollbackMode: "rollback",
        manualFallbackBindingRef: "manual-fallback:474:legacy-patient-status-read-path",
        contractiveRemovalPermitted: false,
        blockerRefs: ["blocker:474:legacy-patient-status-read-path-active"],
        verificationRefs: ["tests/migration/474_read_path_compatibility.test.ts"],
        sourceRefs: [
          "blueprint/platform-runtime-and-release-blueprint.md#ReadPathCompatibilityWindow",
        ],
      }),
      migrationPlan({
        migrationPlanId: "smp_474_rollforward_fhir_index_hardening",
        migrationKind: "schema",
        storeScope: "store:fhir-representation:index-v2",
        changeType: "rollforward_only",
        owner: "platform-data",
        state: "ready_with_constraints",
        releaseApprovalFreezeRef,
        sourceSchemaVersionRefs: ["fhir-index:v1"],
        targetSchemaVersionRefs: ["fhir-index:v2-rollforward"],
        affectedStoreRefs: ["store:fhir-representation"],
        affectedEventFamilyRefs: ["health_record", "identity"],
        affectedProjectionFamilyRefs: ["patient_status", "staff_workspace"],
        affectedRouteFamilyRefs: ["patient_status", "staff_workspace"],
        commandContractRefs: ["command-contract:474:fhir-index-rebuild"],
        readPathCompatibilityWindowRef: "rpcw_474_rollforward_fhir_index_hardening",
        rollbackMode: "rollforward_only",
        manualFallbackBindingRef: "manual-fallback:474:fhir-last-known-good-route",
        contractiveRemovalPermitted: false,
        blockerRefs: [],
        verificationRefs: ["tests/migration/474_schema_migration_plan.test.ts"],
        sourceRefs: [
          "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
        ],
      }),
    ],
    edgeCaseGuards: [
      withHash(
        {
          edgeCaseId: "contractive_migration_legacy_patient_status_active",
          expectedState: "blocked" as const,
          guard:
            "Contractive removal cannot run while the legacy patient-status read path is active.",
          evidenceRefs: ["rpcw_474_contractive_patient_status"],
        },
        "guardHash",
      ),
      withHash(
        {
          edgeCaseId: "rollforward_only_requires_manual_fallback_route",
          expectedState: "ready_with_constraints" as const,
          guard:
            "Rollforward-only FHIR index hardening is constrained unless the last-known-good manual route is bound.",
          evidenceRefs: ["manual-fallback:474:fhir-last-known-good-route"],
        },
        "guardHash",
      ),
      withHash(
        {
          edgeCaseId: "new_command_schema_before_read_path_window",
          expectedState: "blocked" as const,
          guard: "The new command schema flag is blocked until the read-path window opens.",
          evidenceRefs: ["ffg_474_new_command_schema_window_start"],
        },
        "guardHash",
      ),
    ],
    sourceFileHashes: hashes,
    sourceRefs: commonSourceRefs,
  };
  const schemaMigrationPlan = withHash(
    schemaMigrationPlanBase,
    "planSetHash",
  ) satisfies SchemaMigrationPlan;

  const convergenceRecords = [
    convergenceRecord({
      convergenceRecordId: "bcr_474_patient_status_exact",
      projectionFamily: "patient_status",
      tenantScope,
      routeFamilyRefs: ["patient_status"],
      convergenceState: "exact",
      currentSequence: 182000,
      targetSequence: 182000,
      lagEvents: 0,
      lagBudgetEvents: 0,
      deterministicFixtureRef: "fixture:474:patient-status:seeded-event-window",
      stableClockRef: "clock:474:fixed-2026-04-28T00:00:00Z",
      boundedCursorProgress: true,
      duplicateWormRowsPrevented: true,
      safeToContinue: true,
      blockerRefs: [],
      evidenceRefs: ["data/evidence/470_full_regression_and_defensive_security_results.json"],
    }),
    convergenceRecord({
      convergenceRecordId: "bcr_474_staff_workspace_exact",
      projectionFamily: "staff_workspace",
      tenantScope,
      routeFamilyRefs: ["staff_workspace"],
      convergenceState: "exact",
      currentSequence: 151240,
      targetSequence: 151240,
      lagEvents: 0,
      lagBudgetEvents: 0,
      deterministicFixtureRef: "fixture:474:staff-workspace:seeded-event-window",
      stableClockRef: "clock:474:fixed-2026-04-28T00:00:00Z",
      boundedCursorProgress: true,
      duplicateWormRowsPrevented: true,
      safeToContinue: true,
      blockerRefs: [],
      evidenceRefs: ["data/evidence/471_phase9_exit_gate_decision.json"],
    }),
    convergenceRecord({
      convergenceRecordId: "bcr_474_ops_assurance_exact",
      projectionFamily: "ops_assurance",
      tenantScope,
      routeFamilyRefs: ["ops_assurance"],
      convergenceState: "exact",
      currentSequence: 90320,
      targetSequence: 90320,
      lagEvents: 0,
      lagBudgetEvents: 0,
      deterministicFixtureRef: "fixture:474:ops-assurance:seeded-event-window",
      stableClockRef: "clock:474:fixed-2026-04-28T00:00:00Z",
      boundedCursorProgress: true,
      duplicateWormRowsPrevented: true,
      safeToContinue: true,
      blockerRefs: [],
      evidenceRefs: ["data/evidence/468_restore_failover_chaos_slice_quarantine_results.json"],
    }),
    convergenceRecord({
      convergenceRecordId: "bcr_474_pharmacy_console_stale",
      projectionFamily: "pharmacy_console",
      tenantScope,
      routeFamilyRefs: ["pharmacy_console"],
      convergenceState: shape.pharmacyConvergenceState,
      currentSequence: shape.pharmacyConvergenceState === "exact" ? 128040 : 127612,
      targetSequence: 128040,
      lagEvents: shape.pharmacyConvergenceState === "exact" ? 0 : 428,
      lagBudgetEvents: 0,
      deterministicFixtureRef: "fixture:474:pharmacy-console:seeded-event-window",
      stableClockRef: "clock:474:fixed-2026-04-28T00:00:00Z",
      boundedCursorProgress: true,
      duplicateWormRowsPrevented: true,
      safeToContinue: shape.pharmacyConvergenceState !== "blocked",
      blockerRefs:
        shape.pharmacyConvergenceState === "exact"
          ? []
          : ["blocker:474:pharmacy-console-projection-stale"],
      evidenceRefs: ["tests/migration/474_projection_backfill_plan.test.ts"],
    }),
    convergenceRecord({
      convergenceRecordId: "bcr_474_nhs_app_channel_deferred",
      projectionFamily: "nhs_app_channel",
      tenantScope,
      routeFamilyRefs: ["nhs_app_channel"],
      convergenceState: "deferred",
      currentSequence: 0,
      targetSequence: 0,
      lagEvents: 0,
      lagBudgetEvents: 0,
      deterministicFixtureRef: "fixture:474:nhs-app-channel:deferred",
      stableClockRef: "clock:474:fixed-2026-04-28T00:00:00Z",
      boundedCursorProgress: true,
      duplicateWormRowsPrevented: true,
      safeToContinue: true,
      blockerRefs: ["blocker:474:phase7-channel-activation-deferred"],
      evidenceRefs: ["data/conformance/473_phase7_channel_readiness_reconciliation.json"],
    }),
  ];

  const cursors = convergenceRecords.map((record) =>
    projectionCursor({
      cursorId: `pbc_474_${record.projectionFamily}`,
      projectionFamily: record.projectionFamily,
      cursorState:
        record.convergenceState === "exact"
          ? "ready"
          : record.convergenceState === "stale"
            ? "stale"
            : record.convergenceState === "blocked"
              ? "paused"
              : "deferred",
      sourceEventWindow: {
        fromInclusive: 1,
        toInclusive: Math.max(record.targetSequence, 1),
      },
      lastProcessedEventId: `${record.projectionFamily}:event:${String(
        record.currentSequence,
      ).padStart(8, "0")}`,
      checkpointEveryEvents: 500,
      resumeCheckpointRef: `brc_474_${record.projectionFamily}`,
      crashRestartProofRef: `crash-proof:474:${record.projectionFamily}:no-duplicate-worm`,
    }),
  );

  const projectionBackfillPlanBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    backfillPlanId: "pbp_474_programme_projection_backfill",
    releaseRef,
    tenantScope,
    runtimePublicationBundleRef,
    releasePublicationParityRef,
    cutoverReadinessState: shape.overallState,
    projectionFamilies: convergenceRecords.map((record) => record.projectionFamily),
    cursors,
    convergenceRecords,
    poisonRecords: [
      poisonRecord({
        poisonRecordId: "pbr_474_pharmacy_unknown_supplier",
        projectionFamily: "pharmacy_console",
        tenantScope,
        poisonState: "quarantined",
        tenantWideBlock: false,
        safeToContinue: true,
        affectedRecordHash: digestRef("masked-poison-record", {
          eventFamily: "pharmacy_outcome",
          fixture: "synthetic-unknown-supplier",
        }),
        reasonCode: "unknown_supplier_code_synthetic_fixture",
        quarantineLedgerRef: "worm-ledger:474:poison-record-quarantine",
      }),
    ],
    resumeCheckpoints: [
      resumeCheckpoint({
        checkpointId: "brc_474_patient_status",
        projectionFamily: "patient_status",
        stopReason: "simulated_worker_crash_after_checkpoint",
        stoppedAtEventId: "patient_status:event:00181500",
        resumedAtEventId: "patient_status:event:00181501",
        duplicateWormRowsAfterResume: 0,
      }),
      resumeCheckpoint({
        checkpointId: "brc_474_staff_workspace",
        projectionFamily: "staff_workspace",
        stopReason: "operator_pause_shadow_compare",
        stoppedAtEventId: "staff_workspace:event:00151000",
        resumedAtEventId: "staff_workspace:event:00151001",
        duplicateWormRowsAfterResume: 0,
      }),
      resumeCheckpoint({
        checkpointId: "brc_474_pharmacy_console",
        projectionFamily: "pharmacy_console",
        stopReason: "stale_projection_lag_budget_breach",
        stoppedAtEventId: "pharmacy_console:event:00127612",
        resumedAtEventId: "pharmacy_console:event:00127613",
        duplicateWormRowsAfterResume: 0,
      }),
    ],
    stopResumeFenceRef: "stop-resume-fence:474:projection-backfill",
    readPathCompatibilityWindowRef: readPathCompatibilityWindow.windowSetId,
    migrationExecutionBindingRef: "ceb_474_programme_cutover",
    sourceRefs: commonSourceRefs,
  };
  const projectionBackfillPlan = withHash(
    projectionBackfillPlanBase,
    "planHash",
  ) satisfies ProjectionBackfillPlan;

  const referenceDatasetManifestBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    manifestId: "rdm_474_reference_dataset_manifest",
    releaseRef,
    tenantScope,
    privacyAttestation: withHash(
      {
        attestationId: "sdpa_474_reference_data",
        syntheticOnly: true as const,
        noPhi: true as const,
        noPii: true as const,
        tenantCrossingIdentifiersPresent: false as const,
        rawIdentifierFields: [] as const,
        forbiddenPatternSetRef: "forbidden-patterns:474:no-phi-secrets-urls",
        evidenceRefs: [
          "tests/migration/474_reference_dataset_masking.test.ts",
          "data/analysis/474_external_reference_notes.json",
        ],
      },
      "attestationHash",
    ),
    recordClasses: [
      referenceRecord({
        recordClassId: "rdrc_474_request_status_reason_codes",
        datasetRef: "reference-data:request-status-reason-codes:v474",
        owner: "platform-product",
        tenantScope,
        provenanceRef: "provenance:synthetic:474:request-status",
        phiClassification: "none",
        piiClassification: "none",
        maskingState: "synthetic_only",
        retentionClass: "reference_operational",
        allowedUsageContexts: ["cutover-dry-run", "projection-compare", "ops-readiness-ui"],
        rawIdentifierFields: [],
        approvalRef: "reference-change-approval:474:request-status",
      }),
      referenceRecord({
        recordClassId: "rdrc_474_pharmacy_directory_synthetic",
        datasetRef: "reference-data:pharmacy-directory-synthetic:v474",
        owner: "pharmacy-operations",
        tenantScope,
        provenanceRef: "provenance:synthetic:474:pharmacy-directory",
        phiClassification: "none",
        piiClassification: "masked",
        maskingState: "masked",
        retentionClass: "reference_operational",
        allowedUsageContexts: ["projection-compare", "pharmacy-console-stale-fixture"],
        rawIdentifierFields: [],
        approvalRef: "reference-change-approval:474:pharmacy-directory",
      }),
      referenceRecord({
        recordClassId: "rdrc_474_staff_role_reference_set",
        datasetRef: "reference-data:staff-role-reference-set:v474",
        owner: "governance",
        tenantScope,
        provenanceRef: "provenance:synthetic:474:staff-roles",
        phiClassification: "none",
        piiClassification: "none",
        maskingState: "synthetic_only",
        retentionClass: "audit_metadata",
        allowedUsageContexts: ["role-authorization-dry-run", "cutover-step-settlement"],
        rawIdentifierFields: [],
        approvalRef: "reference-change-approval:474:staff-roles",
      }),
    ],
    rejectedEdgeCases: [
      withHash(
        {
          edgeCaseId: "reference_dataset_unmasked_phi_rejected",
          rejectedReason:
            "A fixture carrying unmasked patient identifiers is rejected before manifest publication; only its synthetic rejection hash is retained.",
          safeFixtureRef: "fixture:474:rejected-unmasked-phi:no-raw-values",
        },
        "rejectionHash",
      ),
      withHash(
        {
          edgeCaseId: "reference_dataset_tenant_crossing_identifier_rejected",
          rejectedReason:
            "Tenant-crossing source identifiers are rejected and replaced with tenant-scoped synthetic aliases.",
          safeFixtureRef: "fixture:474:tenant-crossing-alias-rejection:no-raw-values",
        },
        "rejectionHash",
      ),
    ],
    changeApprovals: [
      withHash(
        {
          approvalId: "rdca_474_reference_data_dry_run",
          owner: "release-governance",
          approvalState: "approved_for_dry_run" as const,
          wormAuditRef: "worm-ledger:474:reference-data-dry-run-approval",
        },
        "approvalHash",
      ),
      withHash(
        {
          approvalId: "rdca_474_reference_data_production_cutover",
          owner: "release-governance",
          approvalState: "blocked" as const,
          wormAuditRef: "worm-ledger:474:reference-data-production-blocked",
        },
        "approvalHash",
      ),
    ],
    sourceRefs: commonSourceRefs,
  };
  const referenceDatasetManifest = withHash(
    referenceDatasetManifestBase,
    "manifestHash",
  ) satisfies ReferenceDatasetManifest;

  const rollbackDecisions = [
    rollbackDecision({
      rollbackDecisionId: "crd_474_patient_status",
      targetRef: "patient_status",
      decisionState: "ready",
      stopCondition: "Shadow compare digest drift or patient status read-path freshness breach.",
      rollbackPath: "Flip patient-status read path to last-known-good v1 read model.",
      rollforwardPath: "Replay canonical events into v2 projection and recompare before contract.",
      manualFallbackBindingRef: "manual-fallback:474:legacy-patient-status-read-path",
      wormAuditRef: "worm-ledger:474:patient-status-rollback-decision",
    }),
    rollbackDecision({
      rollbackDecisionId: "crd_474_pharmacy_console",
      targetRef: "pharmacy_console",
      decisionState:
        shape.overallState === "rollback_only" ? "rollback_only" : "manual_fallback_required",
      stopCondition:
        "Pharmacy projection remains stale or poison rate exceeds safe quarantine cap.",
      rollbackPath:
        "Keep pharmacy console on last-known-good projection and route stale state to ops.",
      rollforwardPath: "Resume cursor from brc_474_pharmacy_console after quarantine settlement.",
      manualFallbackBindingRef: "manual-fallback:474:pharmacy-last-known-good-read-model",
      wormAuditRef: "worm-ledger:474:pharmacy-rollback-decision",
    }),
    rollbackDecision({
      rollbackDecisionId: "crd_474_fhir_index",
      targetRef: "fhir_index_v2",
      decisionState: "manual_fallback_required",
      stopCondition: "Rollforward-only index build lacks a current manual fallback route.",
      rollbackPath:
        "No destructive rollback; retain v1 query route while v2 rebuild rolls forward.",
      rollforwardPath:
        "Complete v2 rebuild, compare query digest, and publish recovery disposition.",
      manualFallbackBindingRef: "manual-fallback:474:fhir-last-known-good-route",
      wormAuditRef: "worm-ledger:474:fhir-rollforward-decision",
    }),
  ];

  const stopResumeRollbackMatrixBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    matrixId: "srrm_474_stop_resume_rollback",
    rollbackDecisions,
    manualFallbackBindings: [
      withHash(
        {
          bindingId: "manual-fallback:474:legacy-patient-status-read-path",
          routeFamily: "patient_status",
          owner: "platform-data",
          fallbackMode: "last_known_good_read_model" as const,
          settlementRequired: true as const,
        },
        "bindingHash",
      ),
      withHash(
        {
          bindingId: "manual-fallback:474:pharmacy-last-known-good-read-model",
          routeFamily: "pharmacy_console",
          owner: "pharmacy-operations",
          fallbackMode: "last_known_good_read_model" as const,
          settlementRequired: true as const,
        },
        "bindingHash",
      ),
      withHash(
        {
          bindingId: "manual-fallback:474:fhir-last-known-good-route",
          routeFamily: "patient_status",
          owner: "platform-data",
          fallbackMode: "manual_route" as const,
          settlementRequired: true as const,
        },
        "bindingHash",
      ),
    ],
    sourceRefs: commonSourceRefs,
  };
  const stopResumeRollbackMatrix = withHash(
    stopResumeRollbackMatrixBase,
    "matrixHash",
  ) satisfies StopResumeRollbackMatrix;

  const projectionReadinessVerdictsBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    verdictSetId: "prv_474_projection_readiness",
    overallState: shape.overallState,
    dryRunPermitted: shape.dryRunPermitted,
    destructiveExecutionPermitted: shape.destructiveExecutionPermitted,
    verdicts: convergenceRecords.map((record) => {
      const isPharmacy = record.projectionFamily === "pharmacy_console";
      const isNhsApp = record.projectionFamily === "nhs_app_channel";
      const exact = record.convergenceState === "exact";
      return readinessVerdict({
        verdictId: `prv_474_${record.projectionFamily}`,
        projectionFamily: record.projectionFamily,
        tenantScope,
        verdictState:
          shape.overallState === "rollback_only"
            ? "rollback_only"
            : exact
              ? "ready"
              : isNhsApp
                ? "ready_with_constraints"
                : isPharmacy && record.convergenceState === "stale"
                  ? "ready_with_constraints"
                  : "blocked",
        convergenceState: record.convergenceState,
        allowDryRun: shape.dryRunPermitted && record.convergenceState !== "blocked",
        allowDestructiveCutover: shape.destructiveExecutionPermitted && exact,
        blockerRefs: record.blockerRefs,
        evidenceRefs: record.evidenceRefs,
        wormAuditRef: `worm-ledger:474:${record.projectionFamily}:readiness-verdict`,
      });
    }),
    edgeCaseOutcomes: [
      withHash(
        {
          edgeCaseId: "staff_exact_pharmacy_stale",
          expectedState: "ready_with_constraints" as const,
          assertion:
            "Staff workspace convergence can be exact while pharmacy console is stale; destructive cutover remains disabled.",
        },
        "outcomeHash",
      ),
      withHash(
        {
          edgeCaseId: "poison_record_quarantined_without_tenant_block",
          expectedState: "ready_with_constraints" as const,
          assertion:
            "A synthetic pharmacy poison record is quarantined without blocking the whole tenant when the cursor can safely continue.",
        },
        "outcomeHash",
      ),
      withHash(
        {
          edgeCaseId: "stale_projection_blocks_cutover",
          expectedState: "blocked" as const,
          assertion: "Any stale projection verdict blocks destructive cutover execution.",
        },
        "outcomeHash",
      ),
    ],
    sourceRefs: commonSourceRefs,
  };
  const projectionReadinessVerdicts = withHash(
    projectionReadinessVerdictsBase,
    "verdictSetHash",
  ) satisfies ProjectionReadinessVerdicts;

  const migrationTupleHash = sha256(
    stableStringify({
      schemaMigrationPlanHash: schemaMigrationPlan.planSetHash,
      projectionBackfillPlanHash: projectionBackfillPlan.planHash,
      readPathCompatibilityWindowHash: readPathCompatibilityWindow.windowSetHash,
      referenceDatasetManifestHash: referenceDatasetManifest.manifestHash,
      rollbackMatrixHash: stopResumeRollbackMatrix.matrixHash,
      projectionReadinessVerdictSetHash: projectionReadinessVerdicts.verdictSetHash,
      releaseRef,
      tenantScope,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
    }),
  );

  const futureAuthorityBlockers =
    phase7.readinessPredicate?.optionalFutureInputStates
      ?.filter((input) => input.availabilityState !== "available")
      .map((input) => `blocker:474:${input.taskId}:not-yet-available`) ?? [];
  const blockerRefs = [
    ...futureAuthorityBlockers,
    ...(shape.pharmacyConvergenceState === "exact"
      ? []
      : ["blocker:474:pharmacy-console-projection-stale"]),
    "blocker:474:legacy-patient-status-read-path-active",
    "blocker:474:new-command-schema-before-read-path-window",
  ];

  const executionBindingBase = {
    executionBindingId: "ceb_474_programme_cutover",
    releaseCandidateRef,
    runtimePublicationBundleRef,
    releasePublicationParityRef,
    migrationTupleHash,
    tenantScope,
    cohortScope: "cohort:wave1:dry-run-only",
    channelScope: "channel:core-web-and-staff;nhs-app-deferred",
    roleAuthorizationRef: "role-auth:release-governance:programme-cutover-approver",
    idempotencyKeyRequired: true as const,
    purposeBindingRef: "purpose:programme-data-migration-cutover-dry-run",
    injectedClockRef: "clock:474:fixed-2026-04-28T00:00:00Z",
    wormAuditOutputRef: "worm-ledger:474:cutover-execution-binding",
    destructiveExecutionPermitted: shape.destructiveExecutionPermitted,
    dryRunPermitted: shape.dryRunPermitted,
    authorityState: shape.rollbackOnly
      ? ("rollback_only" as const)
      : shape.destructiveExecutionPermitted
        ? ("exact" as const)
        : ("release_candidate_authority_missing" as const),
  };
  const executionBinding = withHash(
    executionBindingBase,
    "bindingHash",
  ) satisfies CutoverExecutionBinding;

  const dependencies = [
    cutoverDependency({
      dependencyId: "dep_474_runtime_bundle",
      owner: "release-engineering",
      dependencyKind: "runtime_bundle",
      state: "exact",
      sourceRefs: ["data/release/release_candidate_tuple.json"],
      evidenceRefs: [runtimePublicationBundleRef, releasePublicationParityRef],
      blockerRefs: [],
    }),
    cutoverDependency({
      dependencyId: "dep_474_release_wave_authority",
      owner: "release-governance",
      dependencyKind: "release_wave",
      state: shape.destructiveExecutionPermitted ? "exact" : "missing",
      sourceRefs: ["prompt/476.md", "prompt/482.md"],
      evidenceRefs: [
        "data/release/476_release_wave_manifest.json",
        "data/release/482_wave1_promotion_settlement.json",
      ],
      blockerRefs: futureAuthorityBlockers,
    }),
    cutoverDependency({
      dependencyId: "dep_474_projection_convergence",
      owner: "platform-projections",
      dependencyKind: "projection",
      state: shape.pharmacyConvergenceState === "exact" ? "exact" : "ready_with_constraints",
      sourceRefs: ["data/migration/474_projection_backfill_plan.json"],
      evidenceRefs: convergenceRecords.map((record) => record.convergenceRecordId),
      blockerRefs:
        shape.pharmacyConvergenceState === "exact"
          ? []
          : ["blocker:474:pharmacy-console-projection-stale"],
    }),
    cutoverDependency({
      dependencyId: "dep_474_reference_data",
      owner: "governance",
      dependencyKind: "reference_data",
      state: "exact",
      sourceRefs: ["data/migration/474_reference_dataset_manifest.json"],
      evidenceRefs: [referenceDatasetManifest.privacyAttestation.attestationId],
      blockerRefs: [],
    }),
    cutoverDependency({
      dependencyId: "dep_474_phase7_channel",
      owner: "release-governance",
      dependencyKind: "channel",
      state: "deferred",
      sourceRefs: ["data/conformance/473_phase7_channel_readiness_reconciliation.json"],
      evidenceRefs: [phase7.reconciliationHash ?? "phase7:deferred"],
      blockerRefs: ["blocker:474:phase7-channel-activation-deferred"],
    }),
  ];

  const steps = [
    cutoverStep({
      stepId: "step_474_freeze_inputs",
      order: 1,
      title: "Freeze release, reference data, and read-path digests",
      owner: "release-governance",
      settlementState: "dry_run_exact",
      privilegedMutation: false,
      requiredRoleRef: "role:release-viewer",
      idempotencyKeyScope: "read-only",
      commandSettlementSchemaRef: "data/contracts/474_migration_cutover.schema.json#CutoverStep",
      wormAuditRef: "worm-ledger:474:freeze-inputs",
      preconditionRefs: [runtimePublicationBundleRef, releasePublicationParityRef],
      stopTriggerRefs: ["blocker:474:runtime-parity-drift"],
      resumeCheckpointRef: "checkpoint:474:freeze-inputs",
      rollbackDecisionRef: "crd_474_patient_status",
    }),
    cutoverStep({
      stepId: "step_474_run_additive_schema",
      order: 2,
      title: "Apply additive schema and event-lineage columns",
      owner: "platform-data",
      settlementState: "dry_run_exact",
      privilegedMutation: true,
      requiredRoleRef: "role:platform-migration-operator",
      idempotencyKeyScope: "tenant+release+schema-plan",
      commandSettlementSchemaRef:
        "data/contracts/474_migration_cutover.schema.json#CutoverExecutionBinding",
      wormAuditRef: "worm-ledger:474:additive-schema",
      preconditionRefs: ["smp_474_expand_event_lineage_columns"],
      stopTriggerRefs: ["blocker:474:additive-schema-drift"],
      resumeCheckpointRef: "checkpoint:474:additive-schema",
      rollbackDecisionRef: "crd_474_patient_status",
    }),
    cutoverStep({
      stepId: "step_474_backfill_shadow_compare",
      order: 3,
      title: "Run projection backfill with shadow compare",
      owner: "platform-projections",
      settlementState:
        shape.overallState === "blocked"
          ? "blocked"
          : shape.rollbackOnly
            ? "rollback_only"
            : "waiting",
      privilegedMutation: true,
      requiredRoleRef: "role:projection-backfill-operator",
      idempotencyKeyScope: "tenant+projection+cursor",
      commandSettlementSchemaRef:
        "data/contracts/474_migration_cutover.schema.json#BackfillConvergenceRecord",
      wormAuditRef: "worm-ledger:474:projection-backfill",
      preconditionRefs: ["pbp_474_programme_projection_backfill"],
      stopTriggerRefs: ["blocker:474:pharmacy-console-projection-stale"],
      resumeCheckpointRef: "brc_474_pharmacy_console",
      rollbackDecisionRef: "crd_474_pharmacy_console",
    }),
    cutoverStep({
      stepId: "step_474_verify_read_path_window",
      order: 4,
      title: "Verify compatible read paths and feature-flag timing",
      owner: "platform-runtime",
      settlementState: "blocked",
      privilegedMutation: false,
      requiredRoleRef: "role:release-viewer",
      idempotencyKeyScope: "read-only",
      commandSettlementSchemaRef:
        "data/contracts/474_migration_cutover.schema.json#ReadPathCompatibilityWindow",
      wormAuditRef: "worm-ledger:474:read-path-window",
      preconditionRefs: ["rpcw_474_programme_cutover"],
      stopTriggerRefs: [
        "blocker:474:legacy-patient-status-read-path-active",
        "blocker:474:new-command-schema-before-read-path-window",
      ],
      resumeCheckpointRef: "checkpoint:474:read-path-window",
      rollbackDecisionRef: "crd_474_patient_status",
    }),
    cutoverStep({
      stepId: "step_474_approve_dry_run",
      order: 5,
      title: "Approve dry run only",
      owner: "release-governance",
      settlementState: shape.dryRunPermitted ? "dry_run_exact" : "blocked",
      privilegedMutation: true,
      requiredRoleRef: "role:release-governance:dual-control",
      idempotencyKeyScope: "tenant+release+dry-run",
      commandSettlementSchemaRef:
        "data/contracts/474_migration_cutover.schema.json#ProgrammeCutoverPlan",
      wormAuditRef: "worm-ledger:474:approve-dry-run",
      preconditionRefs: ["ceb_474_programme_cutover"],
      stopTriggerRefs: futureAuthorityBlockers,
      resumeCheckpointRef: "checkpoint:474:dry-run-approval",
      rollbackDecisionRef: "crd_474_pharmacy_console",
    }),
    cutoverStep({
      stepId: "step_474_execute_production_cutover",
      order: 6,
      title: "Execute production cutover",
      owner: "release-governance",
      settlementState: shape.destructiveExecutionPermitted ? "dry_run_exact" : "blocked",
      privilegedMutation: true,
      requiredRoleRef: "role:release-governance:production-cutover",
      idempotencyKeyScope: "tenant+release+wave+production",
      commandSettlementSchemaRef:
        "data/contracts/474_migration_cutover.schema.json#CutoverExecutionBinding",
      wormAuditRef: "worm-ledger:474:production-cutover",
      preconditionRefs: [
        "data/release/476_release_wave_manifest.json",
        "data/release/482_wave1_promotion_settlement.json",
      ],
      stopTriggerRefs: blockerRefs,
      resumeCheckpointRef: "checkpoint:474:production-cutover-blocked",
      rollbackDecisionRef: "crd_474_pharmacy_console",
    }),
  ];

  const programmeCutoverPlanBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    cutoverPlanId: "pcp_474_programme_cutover",
    cutoverDecision: shape.overallState,
    releaseRef,
    releaseCandidateRef,
    runtimePublicationBundleRef,
    releasePublicationParityRef,
    tenantScope,
    cohortScope: "cohort:wave1:dry-run-only",
    channelScope: "channel:core-web-and-staff;nhs-app-deferred",
    migrationTupleHash,
    executionBinding,
    dependencies,
    steps,
    blockerRefs,
    evidenceRefs: [
      "data/migration/474_schema_migration_plan.json",
      "data/migration/474_projection_backfill_plan.json",
      "data/migration/474_reference_dataset_manifest.json",
      "data/migration/474_read_path_compatibility_window.json",
      "data/migration/474_projection_readiness_verdicts.json",
    ],
    dryRunPermitted: shape.dryRunPermitted,
    destructiveExecutionPermitted: shape.destructiveExecutionPermitted,
    sourceRefs: commonSourceRefs,
  };
  const programmeCutoverPlan = withHash(
    programmeCutoverPlanBase,
    "cutoverPlanHash",
  ) satisfies ProgrammeCutoverPlan;

  const cutoverRunbookBase = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    runbookId: "runbook_474_data_migration_backfill_cutover",
    programmeCutoverPlan,
    orderedStepRefs: steps.map((step) => step.stepId),
    operatorChecklist: [
      "Confirm runtime bundle and publication parity refs match the release candidate tuple.",
      "Run additive schema in dry-run rehearsal before any production mutation.",
      "Resume every projection cursor from its checkpoint and verify zero duplicate WORM rows.",
      "Keep production cutover disabled while future release/wave authority inputs are missing.",
      "Use rollback matrix decisions before changing route exposure.",
    ],
  };
  const cutoverRunbook = withHash(cutoverRunbookBase, "runbookHash");

  const contractSchema = buildContractSchema();
  const interfaceGap = withHash(
    {
      schemaVersion: "PROGRAMME_BATCH_473_489_INTERFACE_GAP.v1",
      taskId: TASK_ID,
      gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_474_RELEASE_CANDIDATE_AUTHORITY",
      title: "Future release and wave authority are not available to task 474",
      gapState: "bridged_dry_run_only",
      missingAuthorityRefs: [
        "data/release/476_release_wave_manifest.json",
        "data/release/482_wave1_promotion_settlement.json",
      ],
      bridgeContract:
        "Task 474 may publish migration, backfill, reference-data, and dry-run cutover evidence, but production cutover remains fail-closed.",
      destructiveExecutionPermitted: false,
      dryRunPermitted: shape.dryRunPermitted,
      sourceRefs: ["prompt/474.md", "prompt/shared_operating_contract_473_to_489.md"],
    },
    "gapHash",
  );

  return {
    schemaMigrationPlan,
    projectionBackfillPlan,
    referenceDatasetManifest,
    readPathCompatibilityWindow,
    cutoverRunbook,
    stopResumeRollbackMatrix,
    projectionReadinessVerdicts,
    contractSchema,
    interfaceGap,
    algorithmNotes: buildAlgorithmNotes(programmeCutoverPlan, projectionBackfillPlan),
    externalReferenceNotes: buildExternalReferenceNotes(),
  };
}

function buildContractSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/474_migration_cutover.schema.json",
    title: "Task 474 migration, backfill, reference-data, and cutover contract",
    type: "object",
    required: ["schemaVersion", "taskId", "generatedAt"],
    definitions: {
      ProgrammeCutoverPlan: {
        type: "object",
        required: [
          "cutoverPlanId",
          "cutoverDecision",
          "releaseCandidateRef",
          "runtimePublicationBundleRef",
          "migrationTupleHash",
          "executionBinding",
          "dependencies",
          "steps",
          "cutoverPlanHash",
        ],
      },
      CutoverStep: {
        type: "object",
        required: [
          "stepId",
          "order",
          "owner",
          "settlementState",
          "idempotencyKeyScope",
          "wormAuditRef",
          "stepHash",
        ],
      },
      CutoverDependency: {
        type: "object",
        required: ["dependencyId", "dependencyKind", "state", "evidenceRefs", "dependencyHash"],
      },
      CutoverExecutionBinding: {
        type: "object",
        required: [
          "executionBindingId",
          "roleAuthorizationRef",
          "idempotencyKeyRequired",
          "purposeBindingRef",
          "injectedClockRef",
          "wormAuditOutputRef",
          "destructiveExecutionPermitted",
          "dryRunPermitted",
          "bindingHash",
        ],
      },
      ReferenceDatasetManifest: {
        type: "object",
        required: ["manifestId", "privacyAttestation", "recordClasses", "manifestHash"],
      },
      ReferenceDatasetRecordClass: {
        type: "object",
        required: [
          "recordClassId",
          "tenantScope",
          "phiClassification",
          "piiClassification",
          "maskingState",
          "retentionClass",
          "allowedUsageContexts",
          "recordClassHash",
        ],
      },
      SyntheticDatasetPrivacyAttestation: {
        type: "object",
        required: [
          "attestationId",
          "syntheticOnly",
          "noPhi",
          "noPii",
          "tenantCrossingIdentifiersPresent",
          "rawIdentifierFields",
          "attestationHash",
        ],
      },
      BackfillConvergenceRecord: {
        type: "object",
        required: [
          "convergenceRecordId",
          "projectionFamily",
          "convergenceState",
          "currentSequence",
          "targetSequence",
          "lagEvents",
          "boundedCursorProgress",
          "duplicateWormRowsPrevented",
          "convergenceHash",
        ],
      },
      ProjectionBackfillCursor: {
        type: "object",
        required: [
          "cursorId",
          "projectionFamily",
          "cursorState",
          "resumeCheckpointRef",
          "crashRestartProofRef",
          "cursorHash",
        ],
      },
      PoisonBackfillRecord: {
        type: "object",
        required: [
          "poisonRecordId",
          "projectionFamily",
          "poisonState",
          "tenantWideBlock",
          "safeToContinue",
          "quarantineLedgerRef",
          "quarantineHash",
        ],
      },
      BackfillResumeCheckpoint: {
        type: "object",
        required: [
          "checkpointId",
          "projectionFamily",
          "stoppedAtEventId",
          "resumedAtEventId",
          "duplicateWormRowsAfterResume",
          "checkpointHash",
        ],
      },
      CutoverRollbackDecision: {
        type: "object",
        required: [
          "rollbackDecisionId",
          "targetRef",
          "decisionState",
          "stopCondition",
          "rollbackPath",
          "rollforwardPath",
          "manualFallbackBindingRef",
          "wormAuditRef",
          "decisionHash",
        ],
      },
      CutoverManualFallbackBinding: {
        type: "object",
        required: ["bindingId", "routeFamily", "fallbackMode", "settlementRequired", "bindingHash"],
      },
      ReferenceDataChangeApproval: {
        type: "object",
        required: ["approvalId", "owner", "approvalState", "wormAuditRef", "approvalHash"],
      },
    },
  };
}

function buildAlgorithmNotes(
  programmeCutoverPlan: ProgrammeCutoverPlan,
  projectionBackfillPlan: ProjectionBackfillPlan,
): string {
  return [
    "# Task 474 Algorithm Alignment Notes",
    "",
    `Generated at ${GENERATED_AT}.`,
    "",
    "## Source Alignment",
    "",
    "- `SchemaMigrationPlan`, `ProjectionBackfillPlan`, `ReadPathCompatibilityWindow`, `ProjectionReadinessVerdict`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, and `ReleaseRecoveryDisposition` are represented as machine-readable records under `data/migration/`.",
    "- The release/runtime tuple is read from tasks 472 and 473 plus the existing release candidate tuple. Missing future wave authority is not inferred.",
    "- Production cutover is fail-closed; task 474 permits dry-run approval only until tasks 476 and 482 publish exact wave authority.",
    "- Hashes use stable sorted JSON with explicit null handling and are tied to WORM/audit references for privileged decisions.",
    "",
    "## Edge Cases Covered",
    "",
    "- Contractive patient-status column removal is blocked while the legacy read path is active.",
    "- Backfill cursor restart proves zero duplicate WORM rows after crash/resume.",
    "- Reference-data manifests reject unmasked PHI and tenant-crossing identifiers without committing raw values.",
    "- Rollforward-only FHIR index hardening is constrained by a manual fallback route.",
    "- Staff workspace convergence is exact while pharmacy console remains stale, disabling destructive cutover.",
    "- A synthetic poison record is quarantined without blocking the whole tenant.",
    "- New command schema feature flag is blocked before read-path compatibility starts.",
    "",
    "## Current Decision",
    "",
    `Cutover decision: \`${programmeCutoverPlan.cutoverDecision}\``,
    `Migration tuple hash: \`${programmeCutoverPlan.migrationTupleHash}\``,
    `Dry run permitted: \`${programmeCutoverPlan.dryRunPermitted}\``,
    `Production cutover permitted: \`${programmeCutoverPlan.destructiveExecutionPermitted}\``,
    `Projection plan hash: \`${projectionBackfillPlan.planHash}\``,
  ].join("\n");
}

function buildExternalReferenceNotes(): Record<string, unknown> {
  return withHash(
    {
      schemaVersion: "474.external-reference-notes.v1",
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      lastCheckedDate: "2026-04-28",
      references: [
        {
          referenceId: "nhs-records-management-code-2023",
          publisher: "NHS England Transformation Directorate",
          title: "Records Management Code of Practice",
          url: "https://transform.england.nhs.uk/information-governance/guidance/records-management-code/",
          appliedTo: ["retentionClass", "records lifecycle", "deletion/audit stub posture"],
        },
        {
          referenceId: "ico-pseudonymisation-guidance",
          publisher: "Information Commissioner's Office",
          title: "Pseudonymisation",
          url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/pseudonymisation/",
          appliedTo: ["synthetic data attestation", "re-identification guard", "masking state"],
        },
        {
          referenceId: "ncsc-caf",
          publisher: "National Cyber Security Centre",
          title: "Cyber Assessment Framework",
          url: "https://www.ncsc.gov.uk/collection/cyber-assessment-framework",
          appliedTo: ["cyber resilience", "essential-function recovery", "fail-closed cutover"],
        },
        {
          referenceId: "nhs-dspt",
          publisher: "NHS England Digital",
          title: "Data Security and Protection Toolkit",
          url: "https://digital.nhs.uk/services/data-security-and-protection-toolkit",
          appliedTo: ["NHS patient-data assurance", "data security posture"],
        },
        {
          referenceId: "playwright-aria-snapshots",
          publisher: "Playwright",
          title: "Snapshot testing - ARIA snapshots",
          url: "https://playwright.dev/docs/aria-snapshots",
          appliedTo: ["readiness board ARIA evidence"],
        },
        {
          referenceId: "playwright-trace-viewer",
          publisher: "Playwright",
          title: "Trace viewer",
          url: "https://playwright.dev/docs/next/trace-viewer",
          appliedTo: ["trace/screenshot verification"],
        },
      ],
    },
    "referenceNotesHash",
  );
}

function writeRunbookMarkdown(artifacts: CutoverArtifacts): void {
  const plan = artifacts.cutoverRunbook.programmeCutoverPlan;
  const rows = plan.steps
    .map(
      (step) =>
        `| ${step.order} | ${step.title} | ${step.owner} | ${step.settlementState} | ${step.rollbackDecisionRef} |`,
    )
    .join("\n");
  writeText(
    "docs/runbooks/474_data_migration_backfill_cutover_runbook.md",
    [
      "# Task 474 Data Migration, Backfill, and Cutover Runbook",
      "",
      `Cutover decision: \`${plan.cutoverDecision}\``,
      `Migration tuple hash: \`${plan.migrationTupleHash}\``,
      `Runtime bundle: \`${plan.runtimePublicationBundleRef}\``,
      `Production execution permitted: \`${plan.destructiveExecutionPermitted}\``,
      "",
      "## Ordered Ladder",
      "",
      "| Order | Step | Owner | Settlement | Rollback decision |",
      "| --- | --- | --- | --- | --- |",
      rows,
      "",
      "## Operating Rule",
      "",
      "Dry-run approval may be recorded using the bound execution tuple. Production cutover remains disabled until release wave authority, exact projection convergence, compatible read paths, and rollback/fallback bindings are all exact.",
    ].join("\n"),
  );
}

function writeTopology(): void {
  writeText(
    "docs/architecture/474_migration_backfill_topology.mmd",
    [
      "flowchart LR",
      '  A["Release/runtime tuple"] --> B["Schema migration plan"]',
      '  B --> C["Projection backfill cursors"]',
      '  C --> D["Projection readiness verdicts"]',
      '  E["Reference dataset manifest"] --> D',
      '  F["Read-path compatibility windows"] --> G["Cutover execution binding"]',
      "  D --> G",
      '  H["Stop/resume/rollback matrix"] --> G',
      '  G --> I["Dry-run approval"]',
      '  G -. blocked until 476/482 .-> J["Production cutover"]',
    ].join("\n"),
  );
}

export function write474CutoverArtifacts(): CutoverArtifacts {
  const artifacts = build474CutoverArtifacts("ready_with_constraints");
  writeJson("data/migration/474_schema_migration_plan.json", artifacts.schemaMigrationPlan);
  writeJson("data/migration/474_projection_backfill_plan.json", artifacts.projectionBackfillPlan);
  writeJson(
    "data/migration/474_reference_dataset_manifest.json",
    artifacts.referenceDatasetManifest,
  );
  writeJson(
    "data/migration/474_read_path_compatibility_window.json",
    artifacts.readPathCompatibilityWindow,
  );
  writeJson("data/migration/474_cutover_runbook.json", artifacts.cutoverRunbook);
  writeJson(
    "data/migration/474_stop_resume_and_rollback_matrix.json",
    artifacts.stopResumeRollbackMatrix,
  );
  writeJson(
    "data/migration/474_projection_readiness_verdicts.json",
    artifacts.projectionReadinessVerdicts,
  );
  writeJson("data/contracts/474_migration_cutover.schema.json", artifacts.contractSchema);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_474_RELEASE_CANDIDATE_AUTHORITY.json",
    artifacts.interfaceGap,
  );
  writeText("data/analysis/474_algorithm_alignment_notes.md", artifacts.algorithmNotes);
  writeJson("data/analysis/474_external_reference_notes.json", artifacts.externalReferenceNotes);
  writeRunbookMarkdown(artifacts);
  writeTopology();
  return artifacts;
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const artifacts = write474CutoverArtifacts();
  console.log(
    `Task 474 cutover artifacts written: ${artifacts.cutoverRunbook.programmeCutoverPlan.migrationTupleHash}`,
  );
}
