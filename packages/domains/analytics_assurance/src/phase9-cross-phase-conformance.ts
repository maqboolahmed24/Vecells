import { hashAssurancePayload, orderedSetHash } from "./phase9-assurance-ledger-contracts";
import { PHASE9_ASSURANCE_CONTRACT_VERSION } from "./phase9-assurance-ledger-contracts";
import { PHASE9_ASSURANCE_PACK_FACTORY_VERSION } from "./phase9-assurance-pack-factory";
import { PHASE9_GRAPH_VERDICT_ENGINE_VERSION } from "./phase9-assurance-graph-verdict-engine";
import { PHASE9_ASSURANCE_INGEST_SERVICE_VERSION } from "./phase9-assurance-ingest-service";
import { PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION } from "./phase9-capa-attestation-workflow";
import { PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION } from "./phase9-disposition-execution-engine";
import { PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION } from "./phase9-essential-function-metrics";
import { PHASE9_GOVERNANCE_CONTRACT_VERSION } from "./phase9-governance-control-contracts";
import { PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION } from "./phase9-incident-reportability-workflow";
import { PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION } from "./phase9-investigation-timeline-service";
import { PHASE9_OPERATIONAL_CONTRACT_VERSION } from "./phase9-operational-projection-contracts";
import { PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION } from "./phase9-operational-projection-engine";
import { PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION } from "./phase9-operational-readiness-posture";
import { PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION } from "./phase9-projection-rebuild-quarantine";
import { PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION } from "./phase9-resilience-action-settlement";
import { PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION } from "./phase9-retention-lifecycle-engine";
import { PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION } from "./phase9-tenant-config-governance";

export const PHASE9_CROSS_PHASE_CONFORMANCE_VERSION = "449.phase9.cross-phase-conformance.v1";

export type ConformanceState = "exact" | "stale" | "blocked";
export type ContractAdoptionState = "exact" | "partial" | "blocked";
export type ScorecardState = ConformanceState;
export type BAUSignoffState = "draft" | "blocked" | "signed_off";
export type ContactValidationState = "validated" | "stale" | "blocked";
export type RunbookRehearsalState = "current" | "stale" | "blocked";
export type ReleaseToBAUAttemptState = "created" | "blocked";

export type ExerciseEvidenceType =
  | "full_load_soak_patient_staff"
  | "projection_rebuild_raw_events"
  | "backup_restore_clean_environment"
  | "failover_rehearsal"
  | "security_incident_rehearsal"
  | "reportable_incident_drill"
  | "monthly_assurance_pack_generation"
  | "retention_deletion_dry_run"
  | "tenant_baseline_diff_approval_audit"
  | "full_end_to_end_regression"
  | "continuity_evidence_convergence";

export interface CrossPhaseConformanceActorContext {
  readonly tenantScope: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly generatedAt: string;
}

export interface PhaseConformanceRow {
  readonly phaseConformanceRowId: string;
  readonly phaseCode: string;
  readonly summarySourceRefs: readonly string[];
  readonly canonicalBlueprintRefs: readonly string[];
  readonly requiredControlStatusSnapshotRefs: readonly string[];
  readonly requiredAssuranceSliceTrustRefs: readonly string[];
  readonly requiredExperienceContinuityEvidenceRefs: readonly string[];
  readonly requiredOpsContinuityEvidenceSliceRefs: readonly string[];
  readonly requiredGovernanceContinuityEvidenceBundleRefs: readonly string[];
  readonly requiredRuntimePublicationBundleRefs: readonly string[];
  readonly requiredVerificationScenarioRefs: readonly string[];
  readonly requiredReleaseRecoveryDispositionRefs: readonly string[];
  readonly requiredEndStateProofRefs: readonly string[];
  readonly summaryAlignmentState: ConformanceState;
  readonly contractAdoptionState: ContractAdoptionState;
  readonly verificationCoverageState: ConformanceState;
  readonly operationalProofState: ConformanceState;
  readonly endStateProofState: ConformanceState;
  readonly rowState: ConformanceState;
  readonly rowHash: string;
  readonly generatedAt: string;
}

export interface CrossPhaseConformanceScorecard {
  readonly crossPhaseConformanceScorecardId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly summarySourceRefs: readonly string[];
  readonly phaseConformanceRowRefs: readonly string[];
  readonly requiredVerificationScenarioRefs: readonly string[];
  readonly requiredRuntimePublicationBundleRefs: readonly string[];
  readonly requiredControlStatusSnapshotRefs: readonly string[];
  readonly requiredAssuranceSliceTrustRefs: readonly string[];
  readonly requiredExperienceContinuityEvidenceRefs: readonly string[];
  readonly requiredOpsContinuityEvidenceSliceRefs: readonly string[];
  readonly requiredGovernanceContinuityEvidenceBundleRefs: readonly string[];
  readonly requiredReleaseRecoveryDispositionRefs: readonly string[];
  readonly requiredEndStateProofRefs: readonly string[];
  readonly summaryAlignmentState: ConformanceState;
  readonly contractAdoptionState: ContractAdoptionState;
  readonly verificationCoverageState: ConformanceState;
  readonly operationalProofState: ConformanceState;
  readonly endStateProofState: ConformanceState;
  readonly scorecardState: ScorecardState;
  readonly scorecardHash: string;
  readonly generatedAt: string;
}

export interface BAUReadinessPack {
  readonly bauReadinessPackId: string;
  readonly tenantScope: string;
  readonly sloRefs: readonly string[];
  readonly runbookRefs: readonly string[];
  readonly exerciseRefs: readonly string[];
  readonly openRiskRefs: readonly string[];
  readonly continuityEvidenceRefs: readonly string[];
  readonly crossPhaseConformanceScorecardRef: string;
  readonly requiredPhaseConformanceRowRefs: readonly string[];
  readonly continuityEvidenceReviewState: ConformanceState;
  readonly signoffState: BAUSignoffState;
  readonly blockerRefs: readonly string[];
  readonly packHash: string;
  readonly generatedAt: string;
}

export interface OnCallMatrix {
  readonly onCallMatrixId: string;
  readonly serviceScope: string;
  readonly rotaRefs: readonly string[];
  readonly escalationPaths: readonly string[];
  readonly contactValidationState: ContactValidationState;
  readonly blockerRefs: readonly string[];
  readonly matrixHash: string;
  readonly validatedAt: string;
}

export interface RunbookBundle {
  readonly runbookBundleId: string;
  readonly scope: string;
  readonly versionRef: string;
  readonly dependencyRefs: readonly string[];
  readonly lastRehearsedAt: string;
  readonly rehearsalFreshnessState: RunbookRehearsalState;
  readonly blockerRefs: readonly string[];
  readonly bundleHash: string;
}

export interface ReleaseToBAURecord {
  readonly releaseToBAURecordId: string;
  readonly effectiveDate: string;
  readonly supportModelRef: string;
  readonly acceptanceRefs: readonly string[];
  readonly crossPhaseConformanceScorecardRef: string;
  readonly scorecardHash: string;
  readonly rollbackPlanRef: string;
  readonly releaseToBAUHash: string;
  readonly createdAt: string;
}

export interface ReleaseToBAUAttempt {
  readonly attemptId: string;
  readonly state: ReleaseToBAUAttemptState;
  readonly blockerRefs: readonly string[];
  readonly releaseToBAURecord: ReleaseToBAURecord | null;
  readonly attemptHash: string;
  readonly generatedAt: string;
}

export interface ExerciseEvidenceRecord {
  readonly exerciseEvidenceId: string;
  readonly exerciseType: ExerciseEvidenceType;
  readonly tenantScope: string;
  readonly evidenceRefs: readonly string[];
  readonly verificationScenarioRef: string;
  readonly continuityEvidenceRefs: readonly string[];
  readonly resultState: ConformanceState;
  readonly evidenceHash: string;
  readonly ingestedAt: string;
}

export interface ConformanceBlockerExplanation {
  readonly blockerRefs: readonly string[];
  readonly missingProofRefs: readonly string[];
  readonly phaseBlockerRefs: readonly string[];
  readonly bauBlockerRefs: readonly string[];
  readonly explanationHash: string;
}

export interface Phase9CrossPhaseConformanceFixture {
  readonly schemaVersion: typeof PHASE9_CROSS_PHASE_CONFORMANCE_VERSION;
  readonly generatedAt: string;
  readonly upstreamSchemaVersions: Record<string, string>;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly exerciseEvidenceRecords: readonly ExerciseEvidenceRecord[];
  readonly exactPhaseRows: readonly PhaseConformanceRow[];
  readonly summaryContradictionRow: PhaseConformanceRow;
  readonly missingRuntimePublicationRow: PhaseConformanceRow;
  readonly missingVerificationScenarioRow: PhaseConformanceRow;
  readonly staleControlSliceTrustRow: PhaseConformanceRow;
  readonly staleContinuityEvidenceRow: PhaseConformanceRow;
  readonly missingGovernanceOpsProofRow: PhaseConformanceRow;
  readonly exactScorecard: CrossPhaseConformanceScorecard;
  readonly staleScorecardAfterProofDrift: CrossPhaseConformanceScorecard;
  readonly blockedScorecard: CrossPhaseConformanceScorecard;
  readonly signedOffBauReadinessPack: BAUReadinessPack;
  readonly blockedBauReadinessPack: BAUReadinessPack;
  readonly validOnCallMatrix: OnCallMatrix;
  readonly blockedOnCallMatrix: OnCallMatrix;
  readonly currentRunbookBundle: RunbookBundle;
  readonly staleRunbookBundle: RunbookBundle;
  readonly releaseToBAURecord: ReleaseToBAURecord;
  readonly blockedReleaseToBAUAttempt: ReleaseToBAUAttempt;
  readonly blockerExplanation: ConformanceBlockerExplanation;
  readonly missingProofRefs: readonly string[];
  readonly tenantDeniedErrorCode: string;
  readonly authorizationDeniedErrorCode: string;
  readonly replayHash: string;
}

export class Phase9CrossPhaseConformanceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9CrossPhaseConformanceError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Phase9CrossPhaseConformanceError(code, message);
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    fail(code, message);
  }
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function conformanceHash(value: unknown, namespace = "phase9.449.cross-phase-conformance"): string {
  return hashAssurancePayload(value, namespace);
}

function toMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  invariant(
    !Number.isNaN(parsed),
    "CONFORMANCE_INVALID_TIMESTAMP",
    `Invalid timestamp ${timestamp}.`,
  );
  return parsed;
}

function requireConformanceActor(actor: CrossPhaseConformanceActorContext, action: string): void {
  invariant(
    actor.roleRefs.some((role) =>
      ["service_owner", "platform_governance", "release_manager", "bau_signoff_owner"].includes(
        role,
      ),
    ),
    "CONFORMANCE_ROLE_DENIED",
    `${action} requires service-owner, governance, release, or BAU signoff role.`,
  );
  invariant(
    actor.purposeOfUseRef.startsWith("governance:cross-phase-conformance") ||
      actor.purposeOfUseRef.startsWith("assurance:bau-signoff"),
    "CONFORMANCE_PURPOSE_DENIED",
    `${action} requires cross-phase conformance purpose-of-use.`,
  );
  invariant(
    actor.reasonRef.length > 0,
    "CONFORMANCE_REASON_REQUIRED",
    `${action} requires a reason.`,
  );
  invariant(
    actor.idempotencyKey.length > 0,
    "CONFORMANCE_IDEMPOTENCY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  invariant(
    actor.scopeTokenRef.includes(actor.tenantScope),
    "CONFORMANCE_TENANT_SCOPE_DENIED",
    `${action} requires a tenant-bound scope token.`,
  );
}

function worstConformanceState(states: readonly ConformanceState[]): ConformanceState {
  if (states.includes("blocked")) {
    return "blocked";
  }
  if (states.includes("stale")) {
    return "stale";
  }
  return "exact";
}

function worstContractState(states: readonly ContractAdoptionState[]): ContractAdoptionState {
  if (states.includes("blocked")) {
    return "blocked";
  }
  if (states.includes("partial")) {
    return "partial";
  }
  return "exact";
}

function conformanceFromContractState(state: ContractAdoptionState): ConformanceState {
  return state === "exact" ? "exact" : state === "partial" ? "stale" : "blocked";
}

function missingRef(label: string): string {
  return `missing:${label}`;
}

function ensureHasRefs(
  refs: readonly string[],
  state: ConformanceState,
  label: string,
): ConformanceState {
  return refs.length === 0 || refs.some((ref) => ref.startsWith("missing:")) ? "blocked" : state;
}

function isFresh(lastRehearsedAt: string, generatedAt: string, maxAgeDays: number): boolean {
  const ageMs = toMs(generatedAt) - toMs(lastRehearsedAt);
  return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

export class Phase9CrossPhaseConformanceService {
  ingestExerciseEvidence(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly exerciseType: ExerciseEvidenceType;
    readonly evidenceRefs: readonly string[];
    readonly verificationScenarioRef: string;
    readonly continuityEvidenceRefs: readonly string[];
    readonly resultState: ConformanceState;
  }): ExerciseEvidenceRecord {
    requireConformanceActor(input.actor, "ingestExerciseEvidence");
    const state = ensureHasRefs(input.evidenceRefs, input.resultState, input.exerciseType);
    const base = {
      tenantScope: input.actor.tenantScope,
      exerciseType: input.exerciseType,
      evidenceRefs: sortedUnique(input.evidenceRefs),
      verificationScenarioRef: input.verificationScenarioRef,
      continuityEvidenceRefs: sortedUnique(input.continuityEvidenceRefs),
      resultState: state,
    };
    const evidenceHash = conformanceHash(base, "phase9.449.exercise-evidence.hash");
    return {
      exerciseEvidenceId: `eer_449_${evidenceHash.slice(0, 16)}`,
      ...base,
      evidenceHash,
      ingestedAt: input.actor.generatedAt,
    };
  }

  generatePhaseConformanceRow(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly phaseCode: string;
    readonly summarySourceRefs: readonly string[];
    readonly canonicalBlueprintRefs: readonly string[];
    readonly requiredControlStatusSnapshotRefs: readonly string[];
    readonly requiredAssuranceSliceTrustRefs: readonly string[];
    readonly requiredExperienceContinuityEvidenceRefs: readonly string[];
    readonly requiredOpsContinuityEvidenceSliceRefs: readonly string[];
    readonly requiredGovernanceContinuityEvidenceBundleRefs: readonly string[];
    readonly requiredRuntimePublicationBundleRefs: readonly string[];
    readonly requiredVerificationScenarioRefs: readonly string[];
    readonly requiredReleaseRecoveryDispositionRefs: readonly string[];
    readonly requiredEndStateProofRefs: readonly string[];
    readonly summaryAlignmentState?: ConformanceState;
    readonly contractAdoptionState?: ContractAdoptionState;
    readonly verificationCoverageState?: ConformanceState;
    readonly operationalProofState?: ConformanceState;
    readonly endStateProofState?: ConformanceState;
    readonly summaryContradictionRefs?: readonly string[];
  }): PhaseConformanceRow {
    requireConformanceActor(input.actor, "generatePhaseConformanceRow");
    const summarySourceRefs = sortedUnique(input.summarySourceRefs);
    const canonicalBlueprintRefs = sortedUnique(input.canonicalBlueprintRefs);
    const requiredControlStatusSnapshotRefs = sortedUnique(input.requiredControlStatusSnapshotRefs);
    const requiredAssuranceSliceTrustRefs = sortedUnique(input.requiredAssuranceSliceTrustRefs);
    const requiredExperienceContinuityEvidenceRefs = sortedUnique(
      input.requiredExperienceContinuityEvidenceRefs,
    );
    const requiredOpsContinuityEvidenceSliceRefs = sortedUnique(
      input.requiredOpsContinuityEvidenceSliceRefs,
    );
    const requiredGovernanceContinuityEvidenceBundleRefs = sortedUnique(
      input.requiredGovernanceContinuityEvidenceBundleRefs,
    );
    const requiredRuntimePublicationBundleRefs = sortedUnique(
      input.requiredRuntimePublicationBundleRefs,
    );
    const requiredVerificationScenarioRefs = sortedUnique(input.requiredVerificationScenarioRefs);
    const requiredReleaseRecoveryDispositionRefs = sortedUnique(
      input.requiredReleaseRecoveryDispositionRefs,
    );
    const requiredEndStateProofRefs = sortedUnique(input.requiredEndStateProofRefs);
    const summaryContradictionRefs = sortedUnique(input.summaryContradictionRefs ?? []);
    const summaryAlignmentState: ConformanceState =
      summaryContradictionRefs.length > 0
        ? "blocked"
        : ensureHasRefs(
            summarySourceRefs,
            input.summaryAlignmentState ?? "exact",
            "summary-source",
          );
    const contractAdoptionState: ContractAdoptionState =
      canonicalBlueprintRefs.length === 0 ||
      canonicalBlueprintRefs.some((ref) => ref.startsWith("missing:"))
        ? "blocked"
        : (input.contractAdoptionState ?? "exact");
    const verificationCoverageState = worstConformanceState([
      ensureHasRefs(
        requiredRuntimePublicationBundleRefs,
        input.verificationCoverageState ?? "exact",
        "runtime-publication",
      ),
      ensureHasRefs(
        requiredVerificationScenarioRefs,
        input.verificationCoverageState ?? "exact",
        "verification-scenario",
      ),
      ensureHasRefs(
        requiredReleaseRecoveryDispositionRefs,
        input.verificationCoverageState ?? "exact",
        "release-recovery-disposition",
      ),
    ]);
    const operationalProofState = worstConformanceState([
      ensureHasRefs(
        requiredControlStatusSnapshotRefs,
        input.operationalProofState ?? "exact",
        "control-status",
      ),
      ensureHasRefs(
        requiredAssuranceSliceTrustRefs,
        input.operationalProofState ?? "exact",
        "slice-trust",
      ),
      ensureHasRefs(
        requiredExperienceContinuityEvidenceRefs,
        input.operationalProofState ?? "exact",
        "experience-continuity",
      ),
      ensureHasRefs(
        requiredOpsContinuityEvidenceSliceRefs,
        input.operationalProofState ?? "exact",
        "ops-continuity",
      ),
      ensureHasRefs(
        requiredGovernanceContinuityEvidenceBundleRefs,
        input.operationalProofState ?? "exact",
        "governance-continuity",
      ),
    ]);
    const endStateProofState = ensureHasRefs(
      requiredEndStateProofRefs,
      input.endStateProofState ?? "exact",
      "end-state-proof",
    );
    const rowState = worstConformanceState([
      summaryAlignmentState,
      conformanceFromContractState(contractAdoptionState),
      verificationCoverageState,
      operationalProofState,
      endStateProofState,
    ]);
    const base = {
      phaseCode: input.phaseCode,
      summarySourceRefs,
      canonicalBlueprintRefs,
      requiredControlStatusSnapshotRefs,
      requiredAssuranceSliceTrustRefs,
      requiredExperienceContinuityEvidenceRefs,
      requiredOpsContinuityEvidenceSliceRefs,
      requiredGovernanceContinuityEvidenceBundleRefs,
      requiredRuntimePublicationBundleRefs,
      requiredVerificationScenarioRefs,
      requiredReleaseRecoveryDispositionRefs,
      requiredEndStateProofRefs,
      summaryAlignmentState,
      contractAdoptionState,
      verificationCoverageState,
      operationalProofState,
      endStateProofState,
      rowState,
    };
    const rowHash = conformanceHash(base, "phase9.449.phase-row.hash");
    return {
      phaseConformanceRowId: `pcr_449_${rowHash.slice(0, 16)}`,
      ...base,
      rowHash,
      generatedAt: input.actor.generatedAt,
    };
  }

  generateCrossPhaseScorecard(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly releaseRef: string;
    readonly phaseRows: readonly PhaseConformanceRow[];
    readonly expectedPreviousScorecardHash?: string;
    readonly additionalSummarySourceRefs?: readonly string[];
  }): CrossPhaseConformanceScorecard {
    requireConformanceActor(input.actor, "generateCrossPhaseScorecard");
    const rows = [...input.phaseRows].sort((left, right) =>
      left.phaseConformanceRowId.localeCompare(right.phaseConformanceRowId),
    );
    const summarySourceRefs = sortedUnique([
      ...(input.additionalSummarySourceRefs ?? []),
      ...rows.flatMap((row) => row.summarySourceRefs),
    ]);
    const summaryAlignmentState = worstConformanceState(
      rows.map((row) => row.summaryAlignmentState),
    );
    const contractAdoptionState = worstContractState(rows.map((row) => row.contractAdoptionState));
    const verificationCoverageState = worstConformanceState(
      rows.map((row) => row.verificationCoverageState),
    );
    const operationalProofState = worstConformanceState(
      rows.map((row) => row.operationalProofState),
    );
    const endStateProofState = worstConformanceState(rows.map((row) => row.endStateProofState));
    const scorecardStateBeforeDrift = worstConformanceState([
      ...rows.map((row) => row.rowState),
      summaryAlignmentState,
      conformanceFromContractState(contractAdoptionState),
      verificationCoverageState,
      operationalProofState,
      endStateProofState,
    ]);
    const baseWithoutState = {
      releaseRef: input.releaseRef,
      tenantScope: input.actor.tenantScope,
      summarySourceRefs,
      phaseConformanceRowRefs: rows.map((row) => row.phaseConformanceRowId),
      requiredVerificationScenarioRefs: sortedUnique(
        rows.flatMap((row) => row.requiredVerificationScenarioRefs),
      ),
      requiredRuntimePublicationBundleRefs: sortedUnique(
        rows.flatMap((row) => row.requiredRuntimePublicationBundleRefs),
      ),
      requiredControlStatusSnapshotRefs: sortedUnique(
        rows.flatMap((row) => row.requiredControlStatusSnapshotRefs),
      ),
      requiredAssuranceSliceTrustRefs: sortedUnique(
        rows.flatMap((row) => row.requiredAssuranceSliceTrustRefs),
      ),
      requiredExperienceContinuityEvidenceRefs: sortedUnique(
        rows.flatMap((row) => row.requiredExperienceContinuityEvidenceRefs),
      ),
      requiredOpsContinuityEvidenceSliceRefs: sortedUnique(
        rows.flatMap((row) => row.requiredOpsContinuityEvidenceSliceRefs),
      ),
      requiredGovernanceContinuityEvidenceBundleRefs: sortedUnique(
        rows.flatMap((row) => row.requiredGovernanceContinuityEvidenceBundleRefs),
      ),
      requiredReleaseRecoveryDispositionRefs: sortedUnique(
        rows.flatMap((row) => row.requiredReleaseRecoveryDispositionRefs),
      ),
      requiredEndStateProofRefs: sortedUnique(rows.flatMap((row) => row.requiredEndStateProofRefs)),
      summaryAlignmentState,
      contractAdoptionState,
      verificationCoverageState,
      operationalProofState,
      endStateProofState,
    };
    const provisionalHash = conformanceHash(
      { ...baseWithoutState, scorecardState: scorecardStateBeforeDrift },
      "phase9.449.scorecard.hash",
    );
    const scorecardState =
      scorecardStateBeforeDrift === "exact" &&
      input.expectedPreviousScorecardHash &&
      input.expectedPreviousScorecardHash !== provisionalHash
        ? "stale"
        : scorecardStateBeforeDrift;
    const scorecardHash = conformanceHash(
      { ...baseWithoutState, scorecardState },
      "phase9.449.scorecard.hash",
    );
    return {
      crossPhaseConformanceScorecardId: `cpcs_449_${scorecardHash.slice(0, 16)}`,
      ...baseWithoutState,
      scorecardState,
      scorecardHash,
      generatedAt: input.actor.generatedAt,
    };
  }

  getScorecardStateAndHash(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly scorecard: CrossPhaseConformanceScorecard;
  }): Pick<CrossPhaseConformanceScorecard, "scorecardState" | "scorecardHash"> {
    requireConformanceActor(input.actor, "getScorecardStateAndHash");
    return {
      scorecardState: input.scorecard.scorecardState,
      scorecardHash: input.scorecard.scorecardHash,
    };
  }

  listBlockersByPhase(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly phaseRows: readonly PhaseConformanceRow[];
  }): readonly string[] {
    requireConformanceActor(input.actor, "listBlockersByPhase");
    return sortedUnique(
      input.phaseRows.flatMap((row) => {
        const blockers: string[] = [];
        if (row.summaryAlignmentState !== "exact") {
          blockers.push(`${row.phaseCode}:summary:${row.summaryAlignmentState}`);
        }
        if (row.contractAdoptionState !== "exact") {
          blockers.push(`${row.phaseCode}:contract:${row.contractAdoptionState}`);
        }
        if (row.verificationCoverageState !== "exact") {
          blockers.push(`${row.phaseCode}:verification:${row.verificationCoverageState}`);
        }
        if (row.operationalProofState !== "exact") {
          blockers.push(`${row.phaseCode}:operational:${row.operationalProofState}`);
        }
        if (row.endStateProofState !== "exact") {
          blockers.push(`${row.phaseCode}:end-state:${row.endStateProofState}`);
        }
        return blockers;
      }),
    );
  }

  listMissingProofRefs(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly phaseRows: readonly PhaseConformanceRow[];
  }): readonly string[] {
    requireConformanceActor(input.actor, "listMissingProofRefs");
    return sortedUnique(
      input.phaseRows.flatMap((row) =>
        [
          ...row.summarySourceRefs,
          ...row.canonicalBlueprintRefs,
          ...row.requiredControlStatusSnapshotRefs,
          ...row.requiredAssuranceSliceTrustRefs,
          ...row.requiredExperienceContinuityEvidenceRefs,
          ...row.requiredOpsContinuityEvidenceSliceRefs,
          ...row.requiredGovernanceContinuityEvidenceBundleRefs,
          ...row.requiredRuntimePublicationBundleRefs,
          ...row.requiredVerificationScenarioRefs,
          ...row.requiredReleaseRecoveryDispositionRefs,
          ...row.requiredEndStateProofRefs,
        ].filter((ref) => ref.startsWith("missing:")),
      ),
    );
  }

  createOrUpdateBAUReadinessPack(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly sloRefs: readonly string[];
    readonly runbookBundles: readonly RunbookBundle[];
    readonly exerciseEvidenceRecords: readonly ExerciseEvidenceRecord[];
    readonly openRiskRefs: readonly string[];
    readonly continuityEvidenceRefs: readonly string[];
    readonly scorecard: CrossPhaseConformanceScorecard;
    readonly requiredPhaseRows: readonly PhaseConformanceRow[];
    readonly continuityEvidenceReviewState: ConformanceState;
    readonly requestedSignoffState: BAUSignoffState;
  }): BAUReadinessPack {
    requireConformanceActor(input.actor, "createOrUpdateBAUReadinessPack");
    const blockerRefs = sortedUnique([
      ...(input.scorecard.scorecardState === "exact"
        ? []
        : [`scorecard:${input.scorecard.scorecardState}`]),
      ...input.requiredPhaseRows
        .filter((row) => row.rowState !== "exact")
        .map((row) => `phase-row:${row.phaseCode}:${row.rowState}`),
      ...(input.continuityEvidenceReviewState === "exact"
        ? []
        : [`continuity-review:${input.continuityEvidenceReviewState}`]),
      ...input.openRiskRefs.map((riskRef) => `open-risk:${riskRef}`),
      ...input.runbookBundles
        .filter((runbook) => runbook.rehearsalFreshnessState !== "current")
        .map((runbook) => `runbook:${runbook.runbookBundleId}:${runbook.rehearsalFreshnessState}`),
      ...input.exerciseEvidenceRecords
        .filter((exercise) => exercise.resultState !== "exact")
        .map((exercise) => `exercise:${exercise.exerciseEvidenceId}:${exercise.resultState}`),
    ]);
    const signoffState: BAUSignoffState =
      input.requestedSignoffState === "signed_off" && blockerRefs.length === 0
        ? "signed_off"
        : blockerRefs.length > 0
          ? "blocked"
          : input.requestedSignoffState;
    const base = {
      tenantScope: input.actor.tenantScope,
      sloRefs: sortedUnique(input.sloRefs),
      runbookRefs: sortedUnique(input.runbookBundles.map((runbook) => runbook.runbookBundleId)),
      exerciseRefs: sortedUnique(
        input.exerciseEvidenceRecords.map((exercise) => exercise.exerciseEvidenceId),
      ),
      openRiskRefs: sortedUnique(input.openRiskRefs),
      continuityEvidenceRefs: sortedUnique(input.continuityEvidenceRefs),
      crossPhaseConformanceScorecardRef: input.scorecard.crossPhaseConformanceScorecardId,
      requiredPhaseConformanceRowRefs: sortedUnique(
        input.requiredPhaseRows.map((row) => row.phaseConformanceRowId),
      ),
      continuityEvidenceReviewState: input.continuityEvidenceReviewState,
      signoffState,
      blockerRefs,
    };
    const packHash = conformanceHash(base, "phase9.449.bau-readiness-pack.hash");
    return {
      bauReadinessPackId: `brp_449_${packHash.slice(0, 16)}`,
      ...base,
      packHash,
      generatedAt: input.actor.generatedAt,
    };
  }

  validateOnCallMatrix(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly serviceScope: string;
    readonly rotaRefs: readonly string[];
    readonly escalationPaths: readonly string[];
    readonly contactValidationState: ContactValidationState;
  }): OnCallMatrix {
    requireConformanceActor(input.actor, "validateOnCallMatrix");
    const blockerRefs = sortedUnique([
      ...(input.rotaRefs.length === 0 ? ["on-call:rota-missing"] : []),
      ...(input.escalationPaths.length === 0 ? ["on-call:escalation-path-missing"] : []),
      ...(input.contactValidationState === "validated"
        ? []
        : [`on-call:contact-validation:${input.contactValidationState}`]),
    ]);
    const base = {
      serviceScope: input.serviceScope,
      rotaRefs: sortedUnique(input.rotaRefs),
      escalationPaths: sortedUnique(input.escalationPaths),
      contactValidationState: blockerRefs.length > 0 ? input.contactValidationState : "validated",
      blockerRefs,
    };
    const matrixHash = conformanceHash(base, "phase9.449.on-call-matrix.hash");
    return {
      onCallMatrixId: `ocm_449_${matrixHash.slice(0, 16)}`,
      ...base,
      matrixHash,
      validatedAt: input.actor.generatedAt,
    };
  }

  validateRunbookBundle(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly scope: string;
    readonly versionRef: string;
    readonly dependencyRefs: readonly string[];
    readonly lastRehearsedAt: string;
    readonly maxAgeDays: number;
  }): RunbookBundle {
    requireConformanceActor(input.actor, "validateRunbookBundle");
    const rehearsalFreshnessState: RunbookRehearsalState = isFresh(
      input.lastRehearsedAt,
      input.actor.generatedAt,
      input.maxAgeDays,
    )
      ? "current"
      : "stale";
    const blockerRefs = sortedUnique([
      ...(input.dependencyRefs.length === 0 ? ["runbook:dependency-missing"] : []),
      ...(rehearsalFreshnessState === "current"
        ? []
        : [`runbook:rehearsal:${rehearsalFreshnessState}`]),
    ]);
    const base = {
      scope: input.scope,
      versionRef: input.versionRef,
      dependencyRefs: sortedUnique(input.dependencyRefs),
      lastRehearsedAt: input.lastRehearsedAt,
      rehearsalFreshnessState: blockerRefs.length > 0 ? rehearsalFreshnessState : "current",
      blockerRefs,
    };
    const bundleHash = conformanceHash(base, "phase9.449.runbook-bundle.hash");
    return {
      runbookBundleId: `rbb_449_${bundleHash.slice(0, 16)}`,
      ...base,
      bundleHash,
    };
  }

  attemptReleaseToBAURecordCreation(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly effectiveDate: string;
    readonly supportModelRef: string;
    readonly acceptanceRefs: readonly string[];
    readonly scorecard: CrossPhaseConformanceScorecard;
    readonly rollbackPlanRef: string;
  }): ReleaseToBAUAttempt {
    requireConformanceActor(input.actor, "attemptReleaseToBAURecordCreation");
    const blockerRefs = sortedUnique([
      ...(input.scorecard.scorecardState === "exact"
        ? []
        : [`scorecard:${input.scorecard.scorecardState}`]),
      ...(input.acceptanceRefs.length === 0 ? ["release-to-bau:acceptance-missing"] : []),
      ...(input.rollbackPlanRef.length === 0 ? ["release-to-bau:rollback-plan-missing"] : []),
    ]);
    const releaseBase = {
      effectiveDate: input.effectiveDate,
      supportModelRef: input.supportModelRef,
      acceptanceRefs: sortedUnique(input.acceptanceRefs),
      crossPhaseConformanceScorecardRef: input.scorecard.crossPhaseConformanceScorecardId,
      scorecardHash: input.scorecard.scorecardHash,
      rollbackPlanRef: input.rollbackPlanRef,
    };
    const releaseToBAUHash = conformanceHash(releaseBase, "phase9.449.release-to-bau.hash");
    const releaseToBAURecord: ReleaseToBAURecord | null =
      blockerRefs.length === 0
        ? {
            releaseToBAURecordId: `rtb_449_${releaseToBAUHash.slice(0, 16)}`,
            ...releaseBase,
            releaseToBAUHash,
            createdAt: input.actor.generatedAt,
          }
        : null;
    const attemptBase = {
      state: blockerRefs.length === 0 ? "created" : "blocked",
      blockerRefs,
      releaseToBAURecordRef:
        releaseToBAURecord?.releaseToBAURecordId ?? "release-to-bau:not-created",
      scorecardHash: input.scorecard.scorecardHash,
    };
    const attemptHash = conformanceHash(attemptBase, "phase9.449.release-to-bau-attempt.hash");
    return {
      attemptId: `rtba_449_${attemptHash.slice(0, 16)}`,
      state: blockerRefs.length === 0 ? "created" : "blocked",
      blockerRefs,
      releaseToBAURecord,
      attemptHash,
      generatedAt: input.actor.generatedAt,
    };
  }

  explainBAUSignoffBlockers(input: {
    readonly actor: CrossPhaseConformanceActorContext;
    readonly phaseRows: readonly PhaseConformanceRow[];
    readonly bauReadinessPack: BAUReadinessPack;
    readonly releaseAttempt?: ReleaseToBAUAttempt;
  }): ConformanceBlockerExplanation {
    requireConformanceActor(input.actor, "explainBAUSignoffBlockers");
    const phaseBlockerRefs = this.listBlockersByPhase({
      actor: input.actor,
      phaseRows: input.phaseRows,
    });
    const missingProofRefs = this.listMissingProofRefs({
      actor: input.actor,
      phaseRows: input.phaseRows,
    });
    const bauBlockerRefs = sortedUnique([
      ...input.bauReadinessPack.blockerRefs,
      ...(input.releaseAttempt?.blockerRefs ?? []),
    ]);
    const blockerRefs = sortedUnique([...phaseBlockerRefs, ...missingProofRefs, ...bauBlockerRefs]);
    return {
      blockerRefs,
      missingProofRefs,
      phaseBlockerRefs,
      bauBlockerRefs,
      explanationHash: conformanceHash(
        { blockerRefs, missingProofRefs, phaseBlockerRefs, bauBlockerRefs },
        "phase9.449.blocker-explanation.hash",
      ),
    };
  }
}

function createActor(generatedAt: string): CrossPhaseConformanceActorContext {
  return {
    tenantScope: "tenant:demo-gp",
    actorRef: "actor:cross-phase-conformance-449",
    roleRefs: ["service_owner", "platform_governance", "release_manager", "bau_signoff_owner"],
    purposeOfUseRef: "governance:cross-phase-conformance:bau-signoff",
    reasonRef: "reason:449:cross-phase-conformance",
    idempotencyKey: "idem:449:base",
    scopeTokenRef: "scope-token:tenant:demo-gp:cross-phase-conformance",
    generatedAt,
  };
}

function exactRowInput(phaseCode: string, generatedAt: string, index: number) {
  const prefix = `${phaseCode}:${index}`;
  return {
    actor: { ...createActor(generatedAt), idempotencyKey: `idem:449:row:${phaseCode}` },
    phaseCode,
    summarySourceRefs: [`phase-cards:${phaseCode}`, `blueprint-init:${phaseCode}`],
    canonicalBlueprintRefs: [
      `blueprint:${phaseCode}:canonical`,
      "blueprint/phase-9-the-assurance-ledger.md#9I",
    ],
    requiredControlStatusSnapshotRefs: [`control-status:${prefix}:current`],
    requiredAssuranceSliceTrustRefs: [`slice-trust:${prefix}:trusted`],
    requiredExperienceContinuityEvidenceRefs: [`experience-continuity:${prefix}:exact`],
    requiredOpsContinuityEvidenceSliceRefs: [`ops-continuity:${prefix}:exact`],
    requiredGovernanceContinuityEvidenceBundleRefs: [`governance-continuity:${prefix}:exact`],
    requiredRuntimePublicationBundleRefs: [`runtime-publication:${prefix}:current`],
    requiredVerificationScenarioRefs: [`verification-scenario:${prefix}:pinned`],
    requiredReleaseRecoveryDispositionRefs: [`release-recovery:${prefix}:declared`],
    requiredEndStateProofRefs: [`end-state-proof:${prefix}:hash-matched`],
  };
}

function requiredExerciseTypes(): readonly ExerciseEvidenceType[] {
  return [
    "full_load_soak_patient_staff",
    "projection_rebuild_raw_events",
    "backup_restore_clean_environment",
    "failover_rehearsal",
    "security_incident_rehearsal",
    "reportable_incident_drill",
    "monthly_assurance_pack_generation",
    "retention_deletion_dry_run",
    "tenant_baseline_diff_approval_audit",
    "full_end_to_end_regression",
    "continuity_evidence_convergence",
  ];
}

export function createPhase9CrossPhaseConformanceFixture(): Phase9CrossPhaseConformanceFixture {
  const generatedAt = "2026-04-27T14:00:00.000Z";
  const service = new Phase9CrossPhaseConformanceService();
  const actor = createActor(generatedAt);
  const exerciseEvidenceRecords = requiredExerciseTypes().map((exerciseType) =>
    service.ingestExerciseEvidence({
      actor: { ...actor, idempotencyKey: `idem:449:exercise:${exerciseType}` },
      exerciseType,
      evidenceRefs: [`evidence:449:${exerciseType}:complete`],
      verificationScenarioRef: `verification-scenario:449:${exerciseType}`,
      continuityEvidenceRefs: [`continuity:449:${exerciseType}`],
      resultState: "exact",
    }),
  );
  const exactPhaseRows = [
    "phase0_foundation",
    "phase6_pharmacy_loop",
    "phase8_assistive_layer",
    "phase9_assurance_governance",
    "cross_phase_runtime_release",
  ].map((phaseCode, index) =>
    service.generatePhaseConformanceRow(exactRowInput(phaseCode, generatedAt, index)),
  );
  const summaryContradictionRow = service.generatePhaseConformanceRow({
    ...exactRowInput("phase3_duplicate_resolution", generatedAt, 10),
    actor: { ...actor, idempotencyKey: "idem:449:row:summary-contradiction" },
    summaryContradictionRefs: ["summary-contradiction:duplicate-merge-flattened"],
  });
  const missingRuntimePublicationRow = service.generatePhaseConformanceRow({
    ...exactRowInput("runtime_publication_tuple", generatedAt, 11),
    actor: { ...actor, idempotencyKey: "idem:449:row:missing-runtime" },
    requiredRuntimePublicationBundleRefs: [missingRef("runtime-publication-bundle")],
  });
  const missingVerificationScenarioRow = service.generatePhaseConformanceRow({
    ...exactRowInput("verification_ladder", generatedAt, 12),
    actor: { ...actor, idempotencyKey: "idem:449:row:missing-verification" },
    requiredVerificationScenarioRefs: [missingRef("verification-scenario")],
  });
  const staleControlSliceTrustRow = service.generatePhaseConformanceRow({
    ...exactRowInput("slice_trust_control_status", generatedAt, 13),
    actor: { ...actor, idempotencyKey: "idem:449:row:stale-control-slice" },
    operationalProofState: "stale",
  });
  const staleContinuityEvidenceRow = service.generatePhaseConformanceRow({
    ...exactRowInput("continuity_evidence", generatedAt, 14),
    actor: { ...actor, idempotencyKey: "idem:449:row:stale-continuity" },
    operationalProofState: "stale",
    requiredExperienceContinuityEvidenceRefs: ["experience-continuity:stale"],
  });
  const missingGovernanceOpsProofRow = service.generatePhaseConformanceRow({
    ...exactRowInput("governance_ops_proof", generatedAt, 15),
    actor: { ...actor, idempotencyKey: "idem:449:row:missing-gov-ops" },
    requiredOpsContinuityEvidenceSliceRefs: [missingRef("ops-continuity-evidence-slice")],
    requiredGovernanceContinuityEvidenceBundleRefs: [
      missingRef("governance-continuity-evidence-bundle"),
    ],
  });
  const exactScorecard = service.generateCrossPhaseScorecard({
    actor: { ...actor, idempotencyKey: "idem:449:scorecard:exact" },
    releaseRef: "release:phase9:bau-wave-1",
    phaseRows: exactPhaseRows,
    additionalSummarySourceRefs: ["phase-cards.md", "blueprint-init.md"],
  });
  const driftedRows = [
    ...exactPhaseRows.slice(0, -1),
    service.generatePhaseConformanceRow({
      ...exactRowInput("cross_phase_runtime_release", generatedAt, 99),
      actor: { ...actor, idempotencyKey: "idem:449:row:drifted-runtime" },
      requiredEndStateProofRefs: ["end-state-proof:cross_phase_runtime_release:drifted"],
    }),
  ];
  const staleScorecardAfterProofDrift = service.generateCrossPhaseScorecard({
    actor: { ...actor, idempotencyKey: "idem:449:scorecard:stale-drift" },
    releaseRef: "release:phase9:bau-wave-1",
    phaseRows: driftedRows,
    expectedPreviousScorecardHash: exactScorecard.scorecardHash,
    additionalSummarySourceRefs: ["phase-cards.md", "blueprint-init.md"],
  });
  const blockedRows = [
    summaryContradictionRow,
    missingRuntimePublicationRow,
    missingVerificationScenarioRow,
    staleControlSliceTrustRow,
    staleContinuityEvidenceRow,
    missingGovernanceOpsProofRow,
  ];
  const blockedScorecard = service.generateCrossPhaseScorecard({
    actor: { ...actor, idempotencyKey: "idem:449:scorecard:blocked" },
    releaseRef: "release:phase9:bau-wave-1",
    phaseRows: blockedRows,
    additionalSummarySourceRefs: ["phase-cards.md", "blueprint-init.md"],
  });
  const validOnCallMatrix = service.validateOnCallMatrix({
    actor: { ...actor, idempotencyKey: "idem:449:on-call:valid" },
    serviceScope: "service:vecells:bau",
    rotaRefs: ["rota:primary", "rota:secondary"],
    escalationPaths: ["escalation:clinical-safety", "escalation:platform"],
    contactValidationState: "validated",
  });
  const blockedOnCallMatrix = service.validateOnCallMatrix({
    actor: { ...actor, idempotencyKey: "idem:449:on-call:blocked" },
    serviceScope: "service:vecells:bau",
    rotaRefs: [],
    escalationPaths: ["escalation:platform"],
    contactValidationState: "stale",
  });
  const currentRunbookBundle = service.validateRunbookBundle({
    actor: { ...actor, idempotencyKey: "idem:449:runbook:current" },
    scope: "service:vecells:bau",
    versionRef: "runbook-version:2026-04-20",
    dependencyRefs: ["dependency:restore", "dependency:incident", "dependency:tenant-config"],
    lastRehearsedAt: "2026-04-20T10:00:00.000Z",
    maxAgeDays: 30,
  });
  const staleRunbookBundle = service.validateRunbookBundle({
    actor: { ...actor, idempotencyKey: "idem:449:runbook:stale" },
    scope: "service:vecells:bau",
    versionRef: "runbook-version:2026-01-01",
    dependencyRefs: ["dependency:restore"],
    lastRehearsedAt: "2026-01-01T10:00:00.000Z",
    maxAgeDays: 30,
  });
  const signedOffBauReadinessPack = service.createOrUpdateBAUReadinessPack({
    actor: { ...actor, idempotencyKey: "idem:449:bau:signed" },
    sloRefs: ["slo:queue", "slo:breach", "slo:continuity"],
    runbookBundles: [currentRunbookBundle],
    exerciseEvidenceRecords,
    openRiskRefs: [],
    continuityEvidenceRefs: exactScorecard.requiredExperienceContinuityEvidenceRefs,
    scorecard: exactScorecard,
    requiredPhaseRows: exactPhaseRows,
    continuityEvidenceReviewState: "exact",
    requestedSignoffState: "signed_off",
  });
  const blockedBauReadinessPack = service.createOrUpdateBAUReadinessPack({
    actor: { ...actor, idempotencyKey: "idem:449:bau:blocked" },
    sloRefs: ["slo:queue"],
    runbookBundles: [staleRunbookBundle],
    exerciseEvidenceRecords,
    openRiskRefs: ["risk:open:manual-fallback-owner"],
    continuityEvidenceRefs: staleContinuityEvidenceRow.requiredExperienceContinuityEvidenceRefs,
    scorecard: blockedScorecard,
    requiredPhaseRows: blockedRows,
    continuityEvidenceReviewState: "stale",
    requestedSignoffState: "signed_off",
  });
  const releaseAttempt = service.attemptReleaseToBAURecordCreation({
    actor: { ...actor, idempotencyKey: "idem:449:release-to-bau:created" },
    effectiveDate: "2026-05-05",
    supportModelRef: "support-model:bau:wave-1",
    acceptanceRefs: [
      signedOffBauReadinessPack.bauReadinessPackId,
      validOnCallMatrix.onCallMatrixId,
    ],
    scorecard: exactScorecard,
    rollbackPlanRef: "rollback-plan:bau-wave-1",
  });
  invariant(
    releaseAttempt.releaseToBAURecord,
    "CONFORMANCE_FIXTURE_RELEASE_TO_BAU_NOT_CREATED",
    "Exact scorecard should create release-to-BAU record.",
  );
  const blockedReleaseToBAUAttempt = service.attemptReleaseToBAURecordCreation({
    actor: { ...actor, idempotencyKey: "idem:449:release-to-bau:blocked" },
    effectiveDate: "2026-05-05",
    supportModelRef: "support-model:bau:wave-1",
    acceptanceRefs: [],
    scorecard: blockedScorecard,
    rollbackPlanRef: "",
  });
  const blockerExplanation = service.explainBAUSignoffBlockers({
    actor: { ...actor, idempotencyKey: "idem:449:explain-blockers" },
    phaseRows: blockedRows,
    bauReadinessPack: blockedBauReadinessPack,
    releaseAttempt: blockedReleaseToBAUAttempt,
  });
  const missingProofRefs = service.listMissingProofRefs({
    actor: { ...actor, idempotencyKey: "idem:449:missing-proof" },
    phaseRows: blockedRows,
  });
  let tenantDeniedErrorCode = "";
  try {
    service.generatePhaseConformanceRow({
      ...exactRowInput("tenant_scope_denied", generatedAt, 20),
      actor: {
        ...actor,
        tenantScope: "tenant:other",
        scopeTokenRef: "scope-token:tenant:demo-gp:cross-phase-conformance",
        idempotencyKey: "idem:449:tenant-denied",
      },
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9CrossPhaseConformanceError ? error.code : "UNKNOWN";
  }
  let authorizationDeniedErrorCode = "";
  try {
    service.generateCrossPhaseScorecard({
      actor: { ...actor, roleRefs: [], idempotencyKey: "idem:449:auth-denied" },
      releaseRef: "release:denied",
      phaseRows: exactPhaseRows,
    });
  } catch (error) {
    authorizationDeniedErrorCode =
      error instanceof Phase9CrossPhaseConformanceError ? error.code : "UNKNOWN";
  }
  return {
    schemaVersion: PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
    generatedAt,
    upstreamSchemaVersions: {
      "432": PHASE9_ASSURANCE_CONTRACT_VERSION,
      "433": PHASE9_OPERATIONAL_CONTRACT_VERSION,
      "434": PHASE9_GOVERNANCE_CONTRACT_VERSION,
      "435": PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
      "436": PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
      "437": PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
      "438": PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
      "439": PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
      "440": PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
      "441": PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
      "442": PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
      "443": PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
      "444": PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
      "445": PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
      "446": PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
      "447": PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
      "448": PHASE9_TENANT_CONFIG_GOVERNANCE_VERSION,
    },
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9I",
      "blueprint/phase-cards.md#Cross-Phase-Conformance-Scorecard",
      "blueprint/blueprint-init.md#CrossPhaseConformanceScorecard",
      "blueprint/platform-runtime-and-release-blueprint.md#VerificationScenario",
      "data/contracts/432_phase9_assurance_ledger_contracts.json",
      "data/contracts/433_phase9_operational_projection_contracts.json",
      "data/contracts/434_phase9_governance_control_contracts.json",
      "data/contracts/444_phase9_operational_readiness_posture_contract.json",
      "data/contracts/445_phase9_resilience_action_settlement_contract.json",
      "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
      "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
      "data/contracts/448_phase9_tenant_config_governance_contract.json",
    ],
    producedObjects: [
      "BAUReadinessPack",
      "OnCallMatrix",
      "RunbookBundle",
      "PhaseConformanceRow",
      "CrossPhaseConformanceScorecard",
      "ReleaseToBAURecord",
      "ExerciseEvidenceRecord",
      "ReleaseToBAUAttempt",
      "ConformanceBlockerExplanation",
    ],
    apiSurface: [
      "ingestExerciseEvidence",
      "generatePhaseConformanceRow",
      "generateCrossPhaseScorecard",
      "getScorecardStateAndHash",
      "listBlockersByPhase",
      "listMissingProofRefs",
      "createOrUpdateBAUReadinessPack",
      "validateOnCallMatrix",
      "validateRunbookBundle",
      "attemptReleaseToBAURecordCreation",
      "explainBAUSignoffBlockers",
    ],
    exerciseEvidenceRecords,
    exactPhaseRows,
    summaryContradictionRow,
    missingRuntimePublicationRow,
    missingVerificationScenarioRow,
    staleControlSliceTrustRow,
    staleContinuityEvidenceRow,
    missingGovernanceOpsProofRow,
    exactScorecard,
    staleScorecardAfterProofDrift,
    blockedScorecard,
    signedOffBauReadinessPack,
    blockedBauReadinessPack,
    validOnCallMatrix,
    blockedOnCallMatrix,
    currentRunbookBundle,
    staleRunbookBundle,
    releaseToBAURecord: releaseAttempt.releaseToBAURecord,
    blockedReleaseToBAUAttempt,
    blockerExplanation,
    missingProofRefs,
    tenantDeniedErrorCode,
    authorizationDeniedErrorCode,
    replayHash: orderedSetHash(
      [
        exactScorecard.scorecardHash,
        staleScorecardAfterProofDrift.scorecardHash,
        blockedScorecard.scorecardHash,
        signedOffBauReadinessPack.packHash,
        blockedBauReadinessPack.packHash,
        releaseAttempt.releaseToBAURecord.releaseToBAUHash,
        blockedReleaseToBAUAttempt.attemptHash,
        blockerExplanation.explanationHash,
      ],
      "phase9.449.fixture.replay",
    ),
  };
}

export function phase9CrossPhaseConformanceSummary(
  fixture: Phase9CrossPhaseConformanceFixture = createPhase9CrossPhaseConformanceFixture(),
): string {
  return [
    "# 449 Phase 9 Cross-Phase Conformance",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Exact scorecard: ${fixture.exactScorecard.crossPhaseConformanceScorecardId}`,
    `Exact scorecard hash: ${fixture.exactScorecard.scorecardHash}`,
    `Blocked scorecard state: ${fixture.blockedScorecard.scorecardState}`,
    `BAU signoff state: ${fixture.signedOffBauReadinessPack.signoffState}`,
    `Blocked BAU signoff state: ${fixture.blockedBauReadinessPack.signoffState}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Workflow Contract",
    "",
    "- PhaseConformanceRow binds phase summaries, canonical blueprints, control snapshots, slice trust, continuity evidence, operations proof, governance proof, runtime publication, verification scenarios, recovery dispositions, and end-state proof.",
    "- CrossPhaseConformanceScorecard is exact only when every required row is exact and the scorecard hash still matches the current planning, verification, runtime, continuity, and final-proof tuple.",
    "- BAUReadinessPack signoff remains blocked when the scorecard is stale or blocked, continuity review is not exact, open risks exist, runbooks are stale, or exercises are not exact.",
    "- ReleaseToBAURecord creation is blocked while the scorecard is stale or blocked.",
    "",
  ].join("\n");
}

export function phase9ConformanceRowsCsv(
  fixture: Phase9CrossPhaseConformanceFixture = createPhase9CrossPhaseConformanceFixture(),
): string {
  const rows = [
    [
      "phaseCode",
      "rowState",
      "summaryAlignmentState",
      "contractAdoptionState",
      "verificationCoverageState",
      "operationalProofState",
      "endStateProofState",
      "rowHash",
    ],
    ...[
      ...fixture.exactPhaseRows,
      fixture.summaryContradictionRow,
      fixture.missingRuntimePublicationRow,
      fixture.missingVerificationScenarioRow,
      fixture.staleControlSliceTrustRow,
      fixture.staleContinuityEvidenceRow,
      fixture.missingGovernanceOpsProofRow,
    ].map((row) => [
      row.phaseCode,
      row.rowState,
      row.summaryAlignmentState,
      row.contractAdoptionState,
      row.verificationCoverageState,
      row.operationalProofState,
      row.endStateProofState,
      row.rowHash,
    ]),
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}

export function phase9BAUSignoffBlockersCsv(
  fixture: Phase9CrossPhaseConformanceFixture = createPhase9CrossPhaseConformanceFixture(),
): string {
  const rows = [
    ["scope", "state", "blockerRefs"],
    [
      fixture.signedOffBauReadinessPack.bauReadinessPackId,
      fixture.signedOffBauReadinessPack.signoffState,
      fixture.signedOffBauReadinessPack.blockerRefs.join("|"),
    ],
    [
      fixture.blockedBauReadinessPack.bauReadinessPackId,
      fixture.blockedBauReadinessPack.signoffState,
      fixture.blockedBauReadinessPack.blockerRefs.join("|"),
    ],
    [
      fixture.blockedReleaseToBAUAttempt.attemptId,
      fixture.blockedReleaseToBAUAttempt.state,
      fixture.blockedReleaseToBAUAttempt.blockerRefs.join("|"),
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
