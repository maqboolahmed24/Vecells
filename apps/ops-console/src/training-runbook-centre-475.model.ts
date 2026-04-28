import operatingModelArtifact from "../../../data/bau/475_operating_model.json";
import roleMatrixArtifact from "../../../data/bau/475_role_responsibility_matrix.json";
import trainingManifestArtifact from "../../../data/bau/475_training_curriculum_manifest.json";
import competencyLedgerArtifact from "../../../data/bau/475_competency_evidence_ledger.json";
import runbookBundleArtifact from "../../../data/bau/475_runbook_bundle_manifest.json";
import cadenceCalendarArtifact from "../../../data/bau/475_governance_cadence_calendar.json";
import escalationPathsArtifact from "../../../data/bau/475_support_escalation_paths.json";

export type TrainingRunbook475ScenarioState =
  | "complete"
  | "constrained"
  | "blocked"
  | "superseded_runbook";

export type TrainingRunbook475RoleId =
  | "clinician"
  | "care_navigator"
  | "admin"
  | "hub_operator"
  | "pharmacist"
  | "support_analyst"
  | "governance_admin"
  | "clinical_safety_officer"
  | "security_privacy_owner"
  | "incident_commander"
  | "service_owner"
  | "release_manager"
  | "supplier_contact";

export interface TrainingRunbook475RoleCard {
  readonly roleId: TrainingRunbook475RoleId;
  readonly roleLabel: string;
  readonly responsibilityRibbon: string;
  readonly requiredModules: readonly string[];
  readonly competencyState: "exact" | "missing" | "superseded";
  readonly completionPercent: number;
  readonly completionRingState: "evidence_backed" | "muted_evidence_missing";
  readonly escalationPathLabel: string;
  readonly unresolvedBlockers: readonly string[];
  readonly selected: boolean;
}

export interface TrainingRunbook475Projection {
  readonly visualMode: "Training_Runbook_Centre_475";
  readonly scenarioState: TrainingRunbook475ScenarioState;
  readonly readinessState: "complete" | "complete_with_constraints" | "blocked";
  readonly bauModelHash: string;
  readonly bauModelHashPrefix: string;
  readonly trainingCompletionState: string;
  readonly runbookBundleVersionRef: string;
  readonly nextRehearsalAt: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly selectedRoleId: TrainingRunbook475RoleId;
  readonly roleCards: readonly TrainingRunbook475RoleCard[];
  readonly selectedRole: TrainingRunbook475RoleCard;
  readonly selectedRoleModules: readonly {
    readonly moduleId: string;
    readonly title: string;
    readonly evidenceRequirement: string;
    readonly failureRetrainingPath: string;
  }[];
  readonly evidenceRows: readonly {
    readonly evidenceEntryId: string;
    readonly roleId: TrainingRunbook475RoleId;
    readonly moduleTitle: string;
    readonly evidenceState: string;
    readonly releaseCandidateRef: string;
    readonly currentReleaseTuple: boolean;
  }[];
  readonly runbookRows: readonly {
    readonly runbookId: string;
    readonly title: string;
    readonly owner: string;
    readonly reviewCadenceDays: number;
    readonly state: string;
    readonly currentReleaseTuple: boolean;
    readonly blockerRefs: readonly string[];
  }[];
  readonly supportRail: {
    readonly todaysOperationalPosture: string;
    readonly openRunbookGaps: readonly string[];
    readonly pendingCadenceEvents: readonly string[];
  };
  readonly cadenceEvents: readonly {
    readonly cadenceEventId: string;
    readonly title: string;
    readonly cadence: string;
    readonly owner: string;
    readonly state: string;
    readonly nextOccurrence: string;
  }[];
  readonly markCompleteActionState:
    | "enabled"
    | "disabled_constraints"
    | "disabled_missing_evidence"
    | "disabled_superseded_runbook"
    | "disabled_blocked";
  readonly assistiveResponsibilityMessage: string;
  readonly channelResponsibilityMessage: string;
  readonly noRawArtifactUrls: true;
  readonly responsiveContract: "training_runbook_tables_preserved";
}

type OperatingModelArtifact = {
  readonly readinessState: "complete" | "complete_with_constraints" | "blocked";
  readonly operatingModelHash: string;
  readonly trainingCompletionState: string;
  readonly runbookBundleVersionRef: string;
  readonly nextRehearsalAt: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly assistiveReviewResponsibilityNotice: { readonly requiredMessage: string };
  readonly channelSupportResponsibilityNotice: { readonly requiredMessage: string };
};

type RoleMatrixArtifact = {
  readonly launchRoles: readonly {
    readonly roleId: TrainingRunbook475RoleId;
    readonly roleLabel: string;
    readonly responsibilityRibbon: string;
    readonly trainingModuleRefs: readonly string[];
    readonly escalationPathRefs: readonly string[];
    readonly blockerRefs: readonly string[];
  }[];
};

type TrainingManifestArtifact = {
  readonly modules: readonly {
    readonly moduleId: string;
    readonly title: string;
    readonly competencyEvidenceRequirement: string;
    readonly failureRetrainingPath: string;
  }[];
};

type CompetencyLedgerArtifact = {
  readonly entries: readonly {
    readonly evidenceEntryId: string;
    readonly roleId: TrainingRunbook475RoleId;
    readonly moduleId: string;
    readonly evidenceState: "exact" | "missing" | "stale" | "superseded" | "blocked";
    readonly releaseCandidateRef: string;
  }[];
};

type RunbookBundleArtifact = {
  readonly runbookBindingRecords: readonly {
    readonly runbookId: string;
    readonly title: string;
    readonly owner: string | null;
    readonly reviewCadenceDays: number | null;
    readonly state: "complete" | "complete_with_constraints" | "blocked";
    readonly releaseCandidateRef: string;
    readonly blockerRefs: readonly string[];
  }[];
};

type CadenceCalendarArtifact = {
  readonly events: readonly {
    readonly cadenceEventId: string;
    readonly title: string;
    readonly cadence: string;
    readonly owner: string;
    readonly state: string;
    readonly nextOccurrence: string;
  }[];
};

type EscalationPathsArtifact = {
  readonly escalationPaths: readonly {
    readonly escalationPathId: string;
    readonly title: string;
  }[];
};

const operatingModel = operatingModelArtifact as OperatingModelArtifact;
const roleMatrix = roleMatrixArtifact as RoleMatrixArtifact;
const trainingManifest = trainingManifestArtifact as TrainingManifestArtifact;
const competencyLedger = competencyLedgerArtifact as CompetencyLedgerArtifact;
const runbookBundle = runbookBundleArtifact as RunbookBundleArtifact;
const cadenceCalendar = cadenceCalendarArtifact as CadenceCalendarArtifact;
const escalationPaths = escalationPathsArtifact as EscalationPathsArtifact;

const defaultRoleId: TrainingRunbook475RoleId = "clinician";

export function normalizeTrainingRunbook475ScenarioState(
  value: string | null | undefined,
): TrainingRunbook475ScenarioState {
  if (
    value === "complete" ||
    value === "constrained" ||
    value === "blocked" ||
    value === "superseded_runbook"
  ) {
    return value;
  }
  if (value === "complete_with_constraints") return "constrained";
  return "constrained";
}

export function normalizeTrainingRunbook475RoleId(
  value: string | null | undefined,
): TrainingRunbook475RoleId {
  const role = roleMatrix.launchRoles.find((candidate) => candidate.roleId === value);
  return role?.roleId ?? defaultRoleId;
}

function moduleTitle(moduleId: string): string {
  return trainingManifest.modules.find((module) => module.moduleId === moduleId)?.title ?? moduleId;
}

function scenarioReadiness(
  scenarioState: TrainingRunbook475ScenarioState,
): TrainingRunbook475Projection["readinessState"] {
  if (scenarioState === "complete") return "complete";
  if (scenarioState === "blocked" || scenarioState === "superseded_runbook") return "blocked";
  return operatingModel.readinessState;
}

function roleCompetencyState(
  roleId: TrainingRunbook475RoleId,
  scenarioState: TrainingRunbook475ScenarioState,
): TrainingRunbook475RoleCard["competencyState"] {
  if (scenarioState === "blocked" && roleId === "clinical_safety_officer") return "missing";
  if (scenarioState === "superseded_runbook" && roleId === "release_manager") return "superseded";
  return "exact";
}

function markCompleteActionState(
  scenarioState: TrainingRunbook475ScenarioState,
  selectedRole: TrainingRunbook475RoleCard,
): TrainingRunbook475Projection["markCompleteActionState"] {
  if (scenarioState === "complete" && selectedRole.competencyState === "exact") return "enabled";
  if (scenarioState === "blocked") return "disabled_missing_evidence";
  if (scenarioState === "superseded_runbook") return "disabled_superseded_runbook";
  if (selectedRole.competencyState !== "exact") return "disabled_missing_evidence";
  return "disabled_constraints";
}

function escalationLabel(role: RoleMatrixArtifact["launchRoles"][number]): string {
  const ref = role.escalationPathRefs[0] ?? "ep_475_support_ops_out_of_hours";
  return escalationPaths.escalationPaths.find((path) => path.escalationPathId === ref)?.title ?? ref;
}

function roleBlockers(
  role: RoleMatrixArtifact["launchRoles"][number],
  scenarioState: TrainingRunbook475ScenarioState,
): readonly string[] {
  if (scenarioState === "blocked" && role.roleId === "clinical_safety_officer") {
    return [
      ...role.blockerRefs,
      "blocker:475:clinical-safety-owner-competency-missing",
    ];
  }
  if (scenarioState === "superseded_runbook" && role.roleId === "release_manager") {
    return [...role.blockerRefs, "blocker:475:runbook-release-tuple-superseded"];
  }
  return role.blockerRefs;
}

function buildRoleCard(
  role: RoleMatrixArtifact["launchRoles"][number],
  scenarioState: TrainingRunbook475ScenarioState,
  selectedRoleId: TrainingRunbook475RoleId,
): TrainingRunbook475RoleCard {
  const competencyState = roleCompetencyState(role.roleId, scenarioState);
  const blockers = roleBlockers(role, scenarioState);
  const completionPercent = competencyState === "exact" ? 100 : 67;
  return {
    roleId: role.roleId,
    roleLabel: role.roleLabel,
    responsibilityRibbon: role.responsibilityRibbon,
    requiredModules: role.trainingModuleRefs.map(moduleTitle),
    competencyState,
    completionPercent,
    completionRingState: competencyState === "exact" ? "evidence_backed" : "muted_evidence_missing",
    escalationPathLabel: escalationLabel(role),
    unresolvedBlockers: blockers,
    selected: role.roleId === selectedRoleId,
  };
}

function runbookRowsForScenario(
  scenarioState: TrainingRunbook475ScenarioState,
): TrainingRunbook475Projection["runbookRows"] {
  return runbookBundle.runbookBindingRecords.map((runbook) => {
    const superseded = scenarioState === "superseded_runbook" && runbook.runbookId === "rb_475_rollback_cutover_rehearsal";
    return {
      runbookId: runbook.runbookId,
      title: runbook.title,
      owner: runbook.owner ?? "Missing owner",
      reviewCadenceDays: runbook.reviewCadenceDays ?? 0,
      state: superseded ? "blocked" : runbook.state,
      currentReleaseTuple: !superseded && runbook.releaseCandidateRef === operatingModel.releaseCandidateRef,
      blockerRefs: superseded
        ? [...runbook.blockerRefs, "blocker:475:runbook-release-tuple-superseded"]
        : runbook.blockerRefs,
    };
  });
}

export function createTrainingRunbook475Projection(
  scenarioState: TrainingRunbook475ScenarioState = "constrained",
  selectedRoleId: TrainingRunbook475RoleId = defaultRoleId,
): TrainingRunbook475Projection {
  const selected = normalizeTrainingRunbook475RoleId(selectedRoleId);
  const roleCards = roleMatrix.launchRoles.map((role) =>
    buildRoleCard(role, scenarioState, selected),
  );
  const selectedRole = roleCards.find((role) => role.roleId === selected) ?? roleCards[0];
  if (!selectedRole) {
    throw new Error("Task 475 role card projection has no launch roles.");
  }
  const runbookRows = runbookRowsForScenario(scenarioState);
  const selectedRoleArtifact = roleMatrix.launchRoles.find((role) => role.roleId === selected);
  const selectedModuleRefs = selectedRoleArtifact?.trainingModuleRefs ?? [];
  const evidenceRows = competencyLedger.entries
    .filter((entry) => entry.roleId === selected)
    .map((entry) => {
      const forcedState =
        scenarioState === "blocked" && selected === "clinical_safety_officer"
          ? "missing"
          : scenarioState === "superseded_runbook" && selected === "release_manager"
            ? "superseded"
            : entry.evidenceState;
      return {
        evidenceEntryId: entry.evidenceEntryId,
        roleId: entry.roleId,
        moduleTitle: moduleTitle(entry.moduleId),
        evidenceState: forcedState,
        releaseCandidateRef: entry.releaseCandidateRef,
        currentReleaseTuple:
          scenarioState !== "superseded_runbook" &&
          entry.releaseCandidateRef === operatingModel.releaseCandidateRef,
      };
    });
  const openRunbookGaps = runbookRows
    .filter((runbook) => runbook.state !== "complete" || !runbook.currentReleaseTuple)
    .map((runbook) => `${runbook.title}: ${runbook.blockerRefs.join(", ") || runbook.state}`);
  const pendingCadenceEvents = cadenceCalendar.events
    .filter((event) => event.state !== "complete")
    .map((event) => `${event.title}: ${event.state}`);

  return {
    visualMode: "Training_Runbook_Centre_475",
    scenarioState,
    readinessState: scenarioReadiness(scenarioState),
    bauModelHash: operatingModel.operatingModelHash,
    bauModelHashPrefix: operatingModel.operatingModelHash.slice(0, 16),
    trainingCompletionState:
      scenarioState === "complete" ? "complete" : scenarioState === "blocked" ? "blocked" : operatingModel.trainingCompletionState,
    runbookBundleVersionRef: operatingModel.runbookBundleVersionRef,
    nextRehearsalAt: operatingModel.nextRehearsalAt,
    releaseCandidateRef: operatingModel.releaseCandidateRef,
    runtimePublicationBundleRef: operatingModel.runtimePublicationBundleRef,
    selectedRoleId: selected,
    roleCards,
    selectedRole,
    selectedRoleModules: selectedModuleRefs.map((moduleId) => {
      const trainingModule = trainingManifest.modules.find((module) => module.moduleId === moduleId);
      return {
        moduleId,
        title: trainingModule?.title ?? moduleId,
        evidenceRequirement: trainingModule?.competencyEvidenceRequirement ?? "Exact competency evidence required.",
        failureRetrainingPath: trainingModule?.failureRetrainingPath ?? "Repeat role-specific training.",
      };
    }),
    evidenceRows,
    runbookRows,
    supportRail: {
      todaysOperationalPosture:
        scenarioState === "complete"
          ? "Core training evidence is exact. Future channel activation remains separately governed."
          : scenarioState === "blocked"
            ? "Blocked: clinical safety owner evidence or escalation coverage is missing."
            : scenarioState === "superseded_runbook"
              ? "Blocked: one runbook points at a superseded release tuple."
              : "Complete with constraints: NHS App remains deferred and release-wave promotion authority is future-owned.",
      openRunbookGaps,
      pendingCadenceEvents,
    },
    cadenceEvents: cadenceCalendar.events,
    markCompleteActionState: markCompleteActionState(scenarioState, selectedRole),
    assistiveResponsibilityMessage: operatingModel.assistiveReviewResponsibilityNotice.requiredMessage,
    channelResponsibilityMessage: operatingModel.channelSupportResponsibilityNotice.requiredMessage,
    noRawArtifactUrls: true,
    responsiveContract: "training_runbook_tables_preserved",
  };
}
