import manifestArtifact from "../../../data/release/476_release_wave_manifest.json";
import rolloutPlanArtifact from "../../../data/release/476_tenant_cohort_rollout_plan.json";
import guardrailArtifact from "../../../data/release/476_wave_guardrail_snapshots.json";
import observationArtifact from "../../../data/release/476_wave_observation_policies.json";
import verdictArtifact from "../../../data/release/476_wave_eligibility_verdicts.json";
import blastRadiusArtifact from "../../../data/release/476_blast_radius_matrix.json";

export type ReleaseWave476ScenarioState =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "blocked"
  | "superseded";

export type ReleaseWave476WaveState =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "rolled_back"
  | "completed"
  | "superseded";

export interface ReleaseWave476Exposure {
  readonly audience: "patients" | "staff" | "pharmacy" | "hub" | "nhs_app" | "assistive";
  readonly label: string;
  readonly count: number;
  readonly percentageOfProgramme: number;
  readonly permittedByScope: boolean;
}

export interface ReleaseWave476ProjectionWave {
  readonly waveId: string;
  readonly label: string;
  readonly ladderLabel: string;
  readonly sequence: number;
  readonly state: ReleaseWave476WaveState;
  readonly scenarioDisplayState: ReleaseWave476ScenarioState;
  readonly verdict: string;
  readonly selected: boolean;
  readonly owner: string;
  readonly tenantCohortRef: string;
  readonly channelScopeRef: string;
  readonly assistiveScopeRef: string;
  readonly guardrailSnapshotRef: string;
  readonly observationPolicyRef: string;
  readonly rollbackBindingRef: string;
  readonly manualFallbackBindingRef: string;
  readonly communicationPlanRef: string;
  readonly exposure: readonly ReleaseWave476Exposure[];
  readonly totalExposureScore: number;
  readonly blockerRefs: readonly string[];
  readonly constraintRefs: readonly string[];
  readonly routeFamilies: readonly string[];
  readonly nhsAppExposureAllowed: boolean;
  readonly assistiveVisibleExposureAllowed: boolean;
}

export interface ReleaseWave476Projection {
  readonly visualMode: "Release_Wave_Planner_476";
  readonly scenarioState: ReleaseWave476ScenarioState;
  readonly readinessVerdict: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveManifestHash: string;
  readonly waveManifestHashPrefix: string;
  readonly nextSafeAction: string;
  readonly activationPermitted: false;
  readonly approvalActionState:
    | "approval_review_available"
    | "activation_settlement_pending"
    | "approval_disabled_stale_prerequisites"
    | "approval_disabled_superseded_runtime";
  readonly sourceBlockers: readonly string[];
  readonly selectedWaveId: string;
  readonly waves: readonly ReleaseWave476ProjectionWave[];
  readonly selectedWave: ReleaseWave476ProjectionWave;
  readonly selectedCohort: any;
  readonly selectedChannelScope: any;
  readonly selectedAssistiveScope: any;
  readonly selectedGuardrailSnapshot: any;
  readonly selectedObservationPolicy: any;
  readonly selectedRollbackBinding: any;
  readonly selectedManualFallbackBinding: any;
  readonly selectedCommunicationPlan: any;
  readonly commandDialog: {
    readonly title: string;
    readonly confirmButtonDisabled: true;
    readonly reason: string;
    readonly requiredSettlementRefs: readonly string[];
  };
  readonly blastRadiusTableRows: readonly {
    readonly waveLabel: string;
    readonly audience: string;
    readonly exposureCount: number;
    readonly permittedByScope: boolean;
  }[];
  readonly smallestApprovedWaveProof: {
    readonly waveId: string;
    readonly proofState: string;
    readonly reason: string;
    readonly noInformalFeatureFlagsPermitted: boolean;
  };
  readonly responsiveContract: "release_wave_tables_preserved";
  readonly noRawArtifactUrls: true;
}

const manifest = manifestArtifact as any;
const rolloutPlan = rolloutPlanArtifact as any;
const guardrails = guardrailArtifact as any;
const observations = observationArtifact as any;
const verdicts = verdictArtifact as any;
const blastRadius = blastRadiusArtifact as any;

const fallbackWaveId = "wave_476_1_core_web_canary";

const exposureLabels: Record<ReleaseWave476Exposure["audience"], string> = {
  patients: "Patients",
  staff: "Staff",
  pharmacy: "Pharmacy",
  hub: "Hub",
  nhs_app: "NHS App",
  assistive: "Assistive",
};

export function normalizeReleaseWave476ScenarioState(
  value: string | null | undefined,
): ReleaseWave476ScenarioState {
  if (
    value === "draft" ||
    value === "approved" ||
    value === "active" ||
    value === "paused" ||
    value === "blocked" ||
    value === "superseded"
  ) {
    return value;
  }
  return "approved";
}

export function normalizeReleaseWave476WaveId(value: string | null | undefined): string {
  return manifest.deploymentWaves.some((wave: any) => wave.waveId === value)
    ? String(value)
    : fallbackWaveId;
}

function scenarioWaveState(
  wave: any,
  scenarioState: ReleaseWave476ScenarioState,
): ReleaseWave476WaveState {
  if (scenarioState === "superseded") return "superseded";
  if (scenarioState === "draft") return wave.waveId === fallbackWaveId ? "draft" : wave.state;
  if (scenarioState === "active") return wave.waveId === fallbackWaveId ? "active" : wave.state;
  if (scenarioState === "paused" || scenarioState === "blocked") {
    return wave.waveId === fallbackWaveId ? "paused" : wave.state;
  }
  return wave.state;
}

function scenarioWaveVerdict(wave: any, scenarioState: ReleaseWave476ScenarioState): string {
  if (scenarioState === "superseded") return "superseded";
  if (scenarioState === "blocked" && wave.waveId === fallbackWaveId) return "blocked";
  return wave.verdict;
}

function scenarioBlockers(
  wave: any,
  scenarioState: ReleaseWave476ScenarioState,
): readonly string[] {
  if (scenarioState === "superseded") return ["blocker:476:runtime-publication-bundle-superseded"];
  if (scenarioState === "blocked" && wave.waveId === fallbackWaveId) {
    return [
      "blocker:476:phase7-channel-reconciliation-stale",
      "blocker:476:bau-readiness-feed-stale",
      "blocker:476:wave-action-settlement-pending-seq-482",
    ];
  }
  return wave.blockerRefs;
}

function approvalActionState(
  scenarioState: ReleaseWave476ScenarioState,
): ReleaseWave476Projection["approvalActionState"] {
  if (scenarioState === "superseded") return "approval_disabled_superseded_runtime";
  if (scenarioState === "blocked") return "approval_disabled_stale_prerequisites";
  if (scenarioState === "draft") return "approval_review_available";
  return "activation_settlement_pending";
}

function readinessVerdict(scenarioState: ReleaseWave476ScenarioState): string {
  if (scenarioState === "superseded") return "superseded";
  if (scenarioState === "blocked") return "blocked";
  return manifest.overallReadinessVerdict;
}

function nextSafeAction(scenarioState: ReleaseWave476ScenarioState): string {
  if (scenarioState === "superseded") {
    return "Rebuild guardrail snapshot from the current runtime bundle before approval.";
  }
  if (scenarioState === "blocked") {
    return "Resolve stale prerequisite evidence before approval.";
  }
  if (scenarioState === "draft") {
    return "Review and approve the manifest plan; production activation remains blocked.";
  }
  if (scenarioState === "active") {
    return "Observe the active wave; do not widen until the watch policy settles.";
  }
  if (scenarioState === "paused") {
    return "Keep the wave paused and follow rollback or resume settlement.";
  }
  return manifest.nextSafeAction;
}

function exposureForWave(waveId: string): readonly ReleaseWave476Exposure[] {
  return blastRadius.rows
    .filter((row: any) => row.waveId === waveId)
    .map((row: any) => ({
      audience: row.audience,
      label: exposureLabels[row.audience as ReleaseWave476Exposure["audience"]],
      count: row.exposureCount,
      percentageOfProgramme: row.percentageOfProgramme,
      permittedByScope: row.permittedByScope,
    }));
}

function totalExposureScore(waveId: string): number {
  return (
    blastRadius.waveScores.find((score: any) => score.waveId === waveId)?.totalExposureScore ?? 0
  );
}

export function createReleaseWave476Projection(
  scenarioState: ReleaseWave476ScenarioState = "approved",
  selectedWaveId: string | null = fallbackWaveId,
): ReleaseWave476Projection {
  const normalizedScenario = normalizeReleaseWave476ScenarioState(scenarioState);
  const normalizedWaveId = normalizeReleaseWave476WaveId(selectedWaveId);
  const waves: ReleaseWave476ProjectionWave[] = manifest.deploymentWaves.map((wave: any) => {
    const blockerRefs = scenarioBlockers(wave, normalizedScenario);
    const exposure = exposureForWave(wave.waveId);
    const assistiveScope = rolloutPlan.assistiveScopes.find(
      (scope: any) => scope.assistiveScopeId === wave.assistiveScopeRef,
    );
    const channelScope = rolloutPlan.channelScopes.find(
      (scope: any) => scope.scopeId === wave.channelScopeRef,
    );
    return {
      waveId: wave.waveId,
      label: wave.label,
      ladderLabel: wave.ladderLabel,
      sequence: wave.sequence,
      state: scenarioWaveState(wave, normalizedScenario),
      scenarioDisplayState: normalizedScenario,
      verdict: scenarioWaveVerdict(wave, normalizedScenario),
      selected: wave.waveId === normalizedWaveId,
      owner: wave.owner,
      tenantCohortRef: wave.tenantCohortRef,
      channelScopeRef: wave.channelScopeRef,
      assistiveScopeRef: wave.assistiveScopeRef,
      guardrailSnapshotRef: wave.guardrailSnapshotRef,
      observationPolicyRef: wave.observationPolicyRef,
      rollbackBindingRef: wave.rollbackBindingRef,
      manualFallbackBindingRef: wave.manualFallbackBindingRef,
      communicationPlanRef: wave.communicationPlanRef,
      exposure,
      totalExposureScore: totalExposureScore(wave.waveId),
      blockerRefs,
      constraintRefs: wave.constraintRefs,
      routeFamilies: wave.routeFamilies,
      nhsAppExposureAllowed: !(channelScope?.explicitlyExcludedChannels ?? []).includes("nhs_app"),
      assistiveVisibleExposureAllowed: Boolean(assistiveScope?.visibleModePermitted),
    } satisfies ReleaseWave476ProjectionWave;
  });

  const selectedWave = waves.find((wave) => wave.waveId === normalizedWaveId) ?? waves[0];
  if (!selectedWave) {
    throw new Error("Task 476 release wave projection has no deployment waves.");
  }
  const selectedCohort = rolloutPlan.waveTenantCohorts.find(
    (cohort: any) => cohort.cohortId === selectedWave.tenantCohortRef,
  );
  const selectedChannelScope = rolloutPlan.channelScopes.find(
    (scope: any) => scope.scopeId === selectedWave.channelScopeRef,
  );
  const selectedAssistiveScope = rolloutPlan.assistiveScopes.find(
    (scope: any) => scope.assistiveScopeId === selectedWave.assistiveScopeRef,
  );
  const selectedGuardrailSnapshot = guardrails.snapshots.find(
    (snapshot: any) => snapshot.snapshotId === selectedWave.guardrailSnapshotRef,
  );
  const selectedObservationPolicy = observations.policies.find(
    (policy: any) => policy.policyId === selectedWave.observationPolicyRef,
  );
  const selectedRollbackBinding = rolloutPlan.rollbackBindings.find(
    (binding: any) => binding.rollbackBindingId === selectedWave.rollbackBindingRef,
  );
  const selectedManualFallbackBinding = rolloutPlan.manualFallbackBindings.find(
    (binding: any) => binding.manualFallbackBindingId === selectedWave.manualFallbackBindingRef,
  );
  const selectedCommunicationPlan = rolloutPlan.communicationPlans.find(
    (plan: any) => plan.communicationPlanId === selectedWave.communicationPlanRef,
  );
  const actionState = approvalActionState(normalizedScenario);
  const sourceBlockers =
    actionState === "approval_disabled_stale_prerequisites"
      ? [
          "blocker:476:phase7-channel-reconciliation-stale",
          "blocker:476:bau-readiness-feed-stale",
          "blocker:476:wave-action-settlement-pending-seq-482",
        ]
      : actionState === "approval_disabled_superseded_runtime"
        ? ["blocker:476:runtime-publication-bundle-superseded"]
        : manifest.blockerRefs;

  return {
    visualMode: "Release_Wave_Planner_476",
    scenarioState: normalizedScenario,
    readinessVerdict: readinessVerdict(normalizedScenario),
    releaseCandidateRef: manifest.releaseCandidateRef,
    runtimePublicationBundleRef:
      normalizedScenario === "superseded"
        ? "rpb::local::superseded-by-476-test-fixture"
        : manifest.runtimePublicationBundleRef,
    waveManifestHash: manifest.waveManifestHash,
    waveManifestHashPrefix: manifest.waveManifestHash.slice(0, 16),
    nextSafeAction: nextSafeAction(normalizedScenario),
    activationPermitted: false,
    approvalActionState: actionState,
    sourceBlockers,
    selectedWaveId: selectedWave.waveId,
    waves,
    selectedWave,
    selectedCohort,
    selectedChannelScope,
    selectedAssistiveScope,
    selectedGuardrailSnapshot,
    selectedObservationPolicy,
    selectedRollbackBinding,
    selectedManualFallbackBinding,
    selectedCommunicationPlan,
    commandDialog: {
      title: `Wave command review for ${selectedWave.ladderLabel}`,
      confirmButtonDisabled: true,
      reason:
        actionState === "approval_review_available"
          ? "Plan approval can be reviewed, but production activation waits for later settlement records."
          : actionState === "activation_settlement_pending"
            ? "No activation may be confirmed until 477/481/482/483 settlement evidence is current."
            : "Approval is disabled because source evidence is blocked or superseded.",
      requiredSettlementRefs: manifest.commandAuthority.activationSettlementRequiredRefs,
    },
    blastRadiusTableRows: blastRadius.rows.map((row: any) => ({
      waveLabel:
        manifest.deploymentWaves.find((wave: any) => wave.waveId === row.waveId)?.ladderLabel ??
        row.waveId,
      audience: exposureLabels[row.audience as ReleaseWave476Exposure["audience"]],
      exposureCount: row.exposureCount,
      permittedByScope: row.permittedByScope,
    })),
    smallestApprovedWaveProof: blastRadius.smallestApprovedWaveProof,
    responsiveContract: "release_wave_tables_preserved",
    noRawArtifactUrls: true,
  };
}

export { verdicts as releaseWave476VerdictsArtifact };
