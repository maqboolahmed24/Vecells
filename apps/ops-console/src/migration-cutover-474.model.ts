import cutoverRunbookArtifact from "../../../data/migration/474_cutover_runbook.json";
import projectionBackfillArtifact from "../../../data/migration/474_projection_backfill_plan.json";
import referenceManifestArtifact from "../../../data/migration/474_reference_dataset_manifest.json";
import readPathWindowArtifact from "../../../data/migration/474_read_path_compatibility_window.json";
import rollbackMatrixArtifact from "../../../data/migration/474_stop_resume_and_rollback_matrix.json";
import readinessVerdictsArtifact from "../../../data/migration/474_projection_readiness_verdicts.json";

export type MigrationCutover474ScenarioState =
  | "dry_run"
  | "ready_with_constraints"
  | "blocked"
  | "rollback_only"
  | "poison_record";

export type MigrationCutover474Decision =
  | "ready"
  | "ready_with_constraints"
  | "blocked"
  | "rollback_only";

export interface MigrationCutover474StepProjection {
  readonly stepId: string;
  readonly order: number;
  readonly title: string;
  readonly owner: string;
  readonly settlementState: string;
  readonly privilegedMutation: boolean;
  readonly rollbackDecisionRef: string;
  readonly selected: boolean;
}

export interface MigrationCutover474HeatstripRow {
  readonly projectionFamily: string;
  readonly convergenceState: "exact" | "stale" | "blocked" | "deferred";
  readonly verdictState: MigrationCutover474Decision;
  readonly lagEvents: number;
  readonly lagBudgetEvents: number;
  readonly allowDryRun: boolean;
  readonly allowDestructiveCutover: boolean;
  readonly selected: boolean;
  readonly blockerRefs: readonly string[];
}

export interface MigrationCutover474Projection {
  readonly visualMode: "Migration_Cutover_474_Readiness_Board";
  readonly scenarioState: MigrationCutover474ScenarioState;
  readonly cutoverDecision: MigrationCutover474Decision;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly migrationTupleHash: string;
  readonly migrationTupleHashPrefix: string;
  readonly rollbackMode: "manual_fallback" | "rollback_only" | "last_known_good";
  readonly dryRunActionState: "enabled" | "blocked";
  readonly destructiveActionState:
    | "enabled"
    | "disabled_until_authority_exact"
    | "disabled_rollback_only"
    | "disabled_blocked";
  readonly dryRunPermitted: boolean;
  readonly destructiveExecutionPermitted: boolean;
  readonly tenantScope: string;
  readonly channelScope: string;
  readonly selectedProjectionFamily: string;
  readonly steps: readonly MigrationCutover474StepProjection[];
  readonly heatstripRows: readonly MigrationCutover474HeatstripRow[];
  readonly blockers: readonly string[];
  readonly rollbackDecisions: readonly {
    readonly rollbackDecisionId: string;
    readonly targetRef: string;
    readonly decisionState: string;
    readonly stopCondition: string;
    readonly rollbackPath: string;
    readonly manualFallbackBindingRef: string;
  }[];
  readonly manualFallbackBindings: readonly {
    readonly bindingId: string;
    readonly routeFamily: string;
    readonly fallbackMode: string;
    readonly owner: string;
  }[];
  readonly poisonRecords: readonly {
    readonly poisonRecordId: string;
    readonly projectionFamily: string;
    readonly poisonState: string;
    readonly tenantWideBlock: boolean;
    readonly safeToContinue: boolean;
    readonly reasonCode: string;
  }[];
  readonly referenceManifest: {
    readonly manifestId: string;
    readonly privacyAttestationId: string;
    readonly noPhi: boolean;
    readonly noPii: boolean;
    readonly recordClasses: readonly {
      readonly recordClassId: string;
      readonly datasetRef: string;
      readonly maskingState: string;
      readonly retentionClass: string;
      readonly allowedUsageContexts: readonly string[];
    }[];
    readonly rejectedEdgeCases: readonly {
      readonly edgeCaseId: string;
      readonly rejectedReason: string;
    }[];
  };
  readonly readPathRows: readonly {
    readonly routeFamily: string;
    readonly compatibilityState: string;
    readonly routeContractDigestRef: string;
    readonly projectionQueryDigestRef: string;
    readonly requiredReleaseRecoveryDispositionRef: string;
  }[];
  readonly sourceTraceRefs: readonly string[];
  readonly noRawArtifactUrls: true;
  readonly responsiveContract: "cutover_board_tables_preserved";
}

type CutoverRunbookArtifact = {
  readonly programmeCutoverPlan: {
    readonly cutoverDecision: MigrationCutover474Decision;
    readonly releaseCandidateRef: string;
    readonly runtimePublicationBundleRef: string;
    readonly migrationTupleHash: string;
    readonly dryRunPermitted: boolean;
    readonly destructiveExecutionPermitted: boolean;
    readonly tenantScope: string;
    readonly channelScope: string;
    readonly blockerRefs: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly steps: readonly {
      readonly stepId: string;
      readonly order: number;
      readonly title: string;
      readonly owner: string;
      readonly settlementState: string;
      readonly privilegedMutation: boolean;
      readonly rollbackDecisionRef: string;
    }[];
  };
};

type ProjectionBackfillArtifact = {
  readonly convergenceRecords: readonly {
    readonly projectionFamily: string;
    readonly convergenceState: "exact" | "stale" | "blocked" | "deferred";
    readonly lagEvents: number;
    readonly lagBudgetEvents: number;
    readonly blockerRefs: readonly string[];
  }[];
  readonly poisonRecords: readonly MigrationCutover474Projection["poisonRecords"][number][];
};

type ReadinessVerdictsArtifact = {
  readonly verdicts: readonly {
    readonly projectionFamily: string;
    readonly verdictState: MigrationCutover474Decision;
    readonly allowDryRun: boolean;
    readonly allowDestructiveCutover: boolean;
    readonly blockerRefs: readonly string[];
  }[];
};

const cutoverRunbook = cutoverRunbookArtifact as CutoverRunbookArtifact;
const projectionBackfill = projectionBackfillArtifact as ProjectionBackfillArtifact;
const readinessVerdicts = readinessVerdictsArtifact as ReadinessVerdictsArtifact;
const referenceManifest = referenceManifestArtifact as {
  readonly manifestId: string;
  readonly privacyAttestation: {
    readonly attestationId: string;
    readonly noPhi: boolean;
    readonly noPii: boolean;
  };
  readonly recordClasses: readonly MigrationCutover474Projection["referenceManifest"]["recordClasses"][number][];
  readonly rejectedEdgeCases: readonly MigrationCutover474Projection["referenceManifest"]["rejectedEdgeCases"][number][];
};
const readPathWindow = readPathWindowArtifact as {
  readonly routeBindings: readonly MigrationCutover474Projection["readPathRows"][number][];
  readonly sourceRefs: readonly string[];
};
const rollbackMatrix = rollbackMatrixArtifact as {
  readonly rollbackDecisions: readonly MigrationCutover474Projection["rollbackDecisions"][number][];
  readonly manualFallbackBindings: readonly MigrationCutover474Projection["manualFallbackBindings"][number][];
};

export function normalizeMigrationCutover474ScenarioState(
  value: string | null | undefined,
): MigrationCutover474ScenarioState {
  if (
    value === "dry_run" ||
    value === "ready_with_constraints" ||
    value === "blocked" ||
    value === "rollback_only" ||
    value === "poison_record"
  ) {
    return value;
  }
  return "ready_with_constraints";
}

function decisionForScenario(
  scenarioState: MigrationCutover474ScenarioState,
): MigrationCutover474Decision {
  if (scenarioState === "blocked") return "blocked";
  if (scenarioState === "rollback_only") return "rollback_only";
  return "ready_with_constraints";
}

function convergenceForScenario(
  scenarioState: MigrationCutover474ScenarioState,
  family: string,
): "exact" | "stale" | "blocked" | "deferred" {
  if (scenarioState === "blocked" && family === "pharmacy_console") return "blocked";
  if (family === "pharmacy_console") return "stale";
  if (family === "nhs_app_channel") return "deferred";
  return "exact";
}

function dryRunPermitted(scenarioState: MigrationCutover474ScenarioState): boolean {
  return (
    scenarioState === "dry_run" ||
    scenarioState === "ready_with_constraints" ||
    scenarioState === "poison_record"
  );
}

function destructiveActionState(
  scenarioState: MigrationCutover474ScenarioState,
): MigrationCutover474Projection["destructiveActionState"] {
  if (scenarioState === "blocked") return "disabled_blocked";
  if (scenarioState === "rollback_only") return "disabled_rollback_only";
  return "disabled_until_authority_exact";
}

function selectedProjectionOrDefault(value: string | null | undefined): string {
  return value ?? "pharmacy_console";
}

export function createMigrationCutover474Projection(
  scenarioState: MigrationCutover474ScenarioState = "ready_with_constraints",
  selectedProjectionFamily: string | null = null,
): MigrationCutover474Projection {
  const plan = cutoverRunbook.programmeCutoverPlan;
  const cutoverDecision = decisionForScenario(scenarioState);
  const selectedFamily = selectedProjectionOrDefault(selectedProjectionFamily);
  const dryRunAllowed = dryRunPermitted(scenarioState);
  const heatstripRows = projectionBackfill.convergenceRecords.map((record) => {
    const verdict = readinessVerdicts.verdicts.find(
      (candidate) => candidate.projectionFamily === record.projectionFamily,
    );
    const convergenceState = convergenceForScenario(scenarioState, record.projectionFamily);
    const verdictState: MigrationCutover474Decision =
      cutoverDecision === "blocked" && record.projectionFamily === "pharmacy_console"
        ? "blocked"
        : cutoverDecision === "rollback_only"
          ? "rollback_only"
          : convergenceState === "exact"
            ? "ready"
            : "ready_with_constraints";
    return {
      projectionFamily: record.projectionFamily,
      convergenceState,
      verdictState,
      lagEvents: convergenceState === "exact" ? 0 : record.lagEvents,
      lagBudgetEvents: record.lagBudgetEvents,
      allowDryRun: dryRunAllowed && convergenceState !== "blocked",
      allowDestructiveCutover: false,
      selected: record.projectionFamily === selectedFamily,
      blockerRefs:
        convergenceState === "exact"
          ? []
          : verdict?.blockerRefs.length
            ? verdict.blockerRefs
            : record.blockerRefs,
    };
  });

  return {
    visualMode: "Migration_Cutover_474_Readiness_Board",
    scenarioState,
    cutoverDecision,
    releaseCandidateRef: plan.releaseCandidateRef,
    runtimePublicationBundleRef: plan.runtimePublicationBundleRef,
    migrationTupleHash: plan.migrationTupleHash,
    migrationTupleHashPrefix: plan.migrationTupleHash.slice(0, 16),
    rollbackMode:
      scenarioState === "rollback_only"
        ? "rollback_only"
        : scenarioState === "poison_record"
          ? "last_known_good"
          : "manual_fallback",
    dryRunActionState: dryRunAllowed ? "enabled" : "blocked",
    destructiveActionState: destructiveActionState(scenarioState),
    dryRunPermitted: dryRunAllowed,
    destructiveExecutionPermitted: false,
    tenantScope: plan.tenantScope,
    channelScope: plan.channelScope,
    selectedProjectionFamily: selectedFamily,
    steps: plan.steps.map((step) => ({
      ...step,
      settlementState:
        scenarioState === "blocked" && step.stepId !== "step_474_freeze_inputs"
          ? "blocked"
          : scenarioState === "rollback_only"
            ? "rollback_only"
            : step.stepId === "step_474_approve_dry_run" && dryRunAllowed
              ? "dry_run_exact"
              : step.settlementState,
      selected: step.rollbackDecisionRef.includes(selectedFamily),
    })),
    heatstripRows,
    blockers:
      scenarioState === "poison_record"
        ? [
            "blocker:474:pharmacy-console-projection-stale",
            "quarantine:474:synthetic-poison-record-safe-to-continue",
            ...plan.blockerRefs.filter((blocker) => blocker.includes("seq_")),
          ]
        : scenarioState === "dry_run"
          ? plan.blockerRefs.filter((blocker) => !blocker.includes("pharmacy-console"))
          : plan.blockerRefs,
    rollbackDecisions: rollbackMatrix.rollbackDecisions.map((decision) => ({
      ...decision,
      decisionState:
        scenarioState === "rollback_only" && decision.targetRef === "pharmacy_console"
          ? "rollback_only"
          : decision.decisionState,
    })),
    manualFallbackBindings: rollbackMatrix.manualFallbackBindings,
    poisonRecords:
      scenarioState === "poison_record"
        ? projectionBackfill.poisonRecords
        : projectionBackfill.poisonRecords,
    referenceManifest: {
      manifestId: referenceManifest.manifestId,
      privacyAttestationId: referenceManifest.privacyAttestation.attestationId,
      noPhi: referenceManifest.privacyAttestation.noPhi,
      noPii: referenceManifest.privacyAttestation.noPii,
      recordClasses: referenceManifest.recordClasses,
      rejectedEdgeCases: referenceManifest.rejectedEdgeCases,
    },
    readPathRows: readPathWindow.routeBindings,
    sourceTraceRefs: Array.from(
      new Set([
        ...plan.sourceRefs.slice(0, 6),
        ...readPathWindow.sourceRefs.slice(0, 4),
        "data/migration/474_projection_readiness_verdicts.json",
        "data/migration/474_stop_resume_and_rollback_matrix.json",
      ]),
    ),
    noRawArtifactUrls: true,
    responsiveContract: "cutover_board_tables_preserved",
  };
}
