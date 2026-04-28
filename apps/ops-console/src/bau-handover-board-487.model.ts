import handoverPackArtifact from "../../../data/bau/487_bau_handover_pack.json";
import rotaMatrixArtifact from "../../../data/bau/487_support_rota_matrix.json";
import acceptanceRegisterArtifact from "../../../data/bau/487_service_owner_acceptance_register.json";
import incidentCommanderArtifact from "../../../data/bau/487_incident_commander_rota.json";
import governanceCalendarArtifact from "../../../data/bau/487_governance_review_calendar.json";
import openActionsArtifact from "../../../data/bau/487_bau_open_actions_register.json";

export const BAU_HANDOVER_487_TASK_ID = "seq_487";
export const BAU_HANDOVER_487_PATH = "/ops/bau/handover";
export const BAU_HANDOVER_487_VISUAL_MODE = "BAU_Handover_Board_487";

export type BAUHandover487ScenarioState = "accepted" | "constrained" | "blocked" | "ooh_gap";
export type BAUHandover487Role = "service_owner" | "rota_manager" | "viewer";
export type BAUHandover487Verdict = "accepted" | "accepted_with_constraints" | "blocked";

export interface BAUHandover487Lane {
  readonly lane: string;
  readonly domains: readonly BAUHandover487DomainCard[];
}

export interface BAUHandover487DomainCard {
  readonly domainId: string;
  readonly lane: string;
  readonly title: string;
  readonly owner: string;
  readonly deputy: string;
  readonly rotaCoverage: "covered" | "missing" | "not_required";
  readonly bankHolidayCoverage: "covered" | "missing" | "not_required";
  readonly runbookRef: string;
  readonly trainingEvidence: string;
  readonly openActionCount: number;
  readonly blockerRefs: readonly string[];
}

export interface BAUHandover487Projection {
  readonly taskId: typeof BAU_HANDOVER_487_TASK_ID;
  readonly visualMode: typeof BAU_HANDOVER_487_VISUAL_MODE;
  readonly scenarioState: BAUHandover487ScenarioState;
  readonly role: BAUHandover487Role;
  readonly verdict: BAUHandover487Verdict;
  readonly releaseState: string;
  readonly rotaCoverageState: "exact" | "blocked";
  readonly blockerCount: number;
  readonly nextReviewAt: string;
  readonly releaseCandidateRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHashPrefix: string;
  readonly lanes: readonly BAUHandover487Lane[];
  readonly rotaRows: readonly BAUHandover487DomainCard[];
  readonly openActions: readonly {
    readonly openActionId: string;
    readonly title: string;
    readonly owner: string;
    readonly dueDate: string;
    readonly severity: string;
    readonly actionClass: string;
    readonly releaseBlocking: boolean;
    readonly state: string;
  }[];
  readonly rightRail: {
    readonly currentOnCall: string;
    readonly incidentCommander: string;
    readonly supplierEscalation: string;
    readonly upcomingGovernanceEvents: readonly {
      readonly eventId: string;
      readonly title: string;
      readonly owner: string;
      readonly nextOccurrence: string;
      readonly state: string;
    }[];
  };
  readonly acceptanceActionState: "enabled" | "disabled_role" | "disabled_blocked";
  readonly rotaModifyActionState: "enabled" | "disabled_role" | "disabled_blocked";
}

type PackEnvelope = {
  readonly activePack: {
    readonly verdict: BAUHandover487Verdict;
    readonly releaseCandidateRef: string;
    readonly releaseWatchTupleRef: string;
    readonly watchTupleHash: string;
    readonly rotaCoverageState: "exact" | "blocked";
    readonly blockerRefs: readonly string[];
  };
};

type RotaMatrixArtifact = {
  readonly rotaAssignments: readonly {
    readonly domainId: string;
    readonly lane: string;
    readonly serviceScope: string;
    readonly owner: string;
    readonly deputy: string | null;
    readonly outOfHoursCoverageState: "covered" | "missing" | "not_required";
    readonly bankHolidayCoverageState: "covered" | "missing" | "not_required";
    readonly runbookOwnershipState: string;
    readonly competencyEvidenceState: string;
    readonly blockerRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
  }[];
};

const packEnvelope = handoverPackArtifact as unknown as PackEnvelope;
const rotaMatrix = rotaMatrixArtifact as unknown as RotaMatrixArtifact;
const acceptanceRegister = acceptanceRegisterArtifact as any;
const incidentCommander = incidentCommanderArtifact as any;
const governanceCalendar = governanceCalendarArtifact as any;
const openActionsRegister = openActionsArtifact as any;

const domainTitles: Record<string, string> = {
  patient_support: "Patient support",
  staff_support: "Staff support",
  operations_monitoring: "Operations monitoring",
  incident_command: "Incident command",
  release_wave_monitoring: "Release and wave monitoring",
  assistive_trust_monitoring: "Assistive trust monitoring",
  nhs_app_channel_governance: "NHS App channel governance",
  records_archive: "Records and archive",
  clinical_safety: "Clinical safety",
  privacy: "Privacy",
  security: "Security",
  supplier_management: "Supplier management",
  continuous_improvement: "Continuous improvement",
};

export function isBAUHandover487Path(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === BAU_HANDOVER_487_PATH;
}

export function normalizeBAUHandover487ScenarioState(
  value: string | null | undefined,
): BAUHandover487ScenarioState {
  if (value === "accepted" || value === "constrained" || value === "blocked" || value === "ooh_gap") {
    return value;
  }
  if (value === "accepted_with_constraints") return "constrained";
  return "constrained";
}

export function normalizeBAUHandover487Role(value: string | null | undefined): BAUHandover487Role {
  if (value === "service_owner" || value === "rota_manager" || value === "viewer") return value;
  return "service_owner";
}

function scenarioVerdict(scenarioState: BAUHandover487ScenarioState): BAUHandover487Verdict {
  if (scenarioState === "accepted") return "accepted";
  if (scenarioState === "blocked" || scenarioState === "ooh_gap") return "blocked";
  return packEnvelope.activePack.verdict;
}

function scenarioBlockerCount(scenarioState: BAUHandover487ScenarioState): number {
  if (scenarioState === "accepted" || scenarioState === "constrained") return 0;
  if (scenarioState === "ooh_gap") return 1;
  return 3;
}

function scenarioRotaCoverage(
  scenarioState: BAUHandover487ScenarioState,
): BAUHandover487Projection["rotaCoverageState"] {
  return scenarioState === "blocked" || scenarioState === "ooh_gap" ? "blocked" : "exact";
}

function cardFromAssignment(
  assignment: RotaMatrixArtifact["rotaAssignments"][number],
  scenarioState: BAUHandover487ScenarioState,
): BAUHandover487DomainCard {
  const isOohGap = scenarioState === "ooh_gap" && assignment.domainId === "incident_command";
  const isBlockedScenario =
    scenarioState === "blocked" &&
    ["assistive_trust_monitoring", "nhs_app_channel_governance", "records_archive"].includes(
      assignment.domainId,
    );
  return {
    domainId: assignment.domainId,
    lane: assignment.lane,
    title: domainTitles[assignment.domainId] ?? assignment.serviceScope,
    owner: assignment.owner,
    deputy: isOohGap ? "Missing deputy" : assignment.deputy ?? "Missing deputy",
    rotaCoverage: isOohGap ? "missing" : assignment.outOfHoursCoverageState,
    bankHolidayCoverage: isOohGap ? "missing" : assignment.bankHolidayCoverageState,
    runbookRef: assignment.evidenceRefs[0] ?? assignment.serviceScope,
    trainingEvidence: isBlockedScenario ? "missing" : assignment.competencyEvidenceState,
    openActionCount: openActionsRegister.openActions.filter((action: any) =>
      action.owner.includes(assignment.owner.split(":").at(-1) ?? assignment.domainId),
    ).length,
    blockerRefs: isOohGap
      ? ["blocker:487:incident-command-deputy-missing-ooh"]
      : isBlockedScenario
        ? [`blocker:487:${assignment.domainId}:ownership-gap`]
        : assignment.blockerRefs,
  };
}

function lanesFromRows(rows: readonly BAUHandover487DomainCard[]): readonly BAUHandover487Lane[] {
  const lanes = [...new Set(rows.map((row) => row.lane))];
  return lanes.map((lane) => ({
    lane,
    domains: rows.filter((row) => row.lane === lane),
  }));
}

export function createBAUHandover487Projection(
  scenarioState = normalizeBAUHandover487ScenarioState(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("handoverState"),
  ),
  role = normalizeBAUHandover487Role(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("handoverRole"),
  ),
): BAUHandover487Projection {
  const verdict = scenarioVerdict(scenarioState);
  const blockerCount = scenarioBlockerCount(scenarioState);
  const rotaRows = rotaMatrix.rotaAssignments.map((assignment) =>
    cardFromAssignment(assignment, scenarioState),
  );
  const blocked = verdict === "blocked";
  return {
    taskId: BAU_HANDOVER_487_TASK_ID,
    visualMode: BAU_HANDOVER_487_VISUAL_MODE,
    scenarioState,
    role,
    verdict,
    releaseState: blocked ? "Programme launch mode retained" : "Release-to-BAU ready",
    rotaCoverageState: scenarioRotaCoverage(scenarioState),
    blockerCount,
    nextReviewAt: governanceCalendar.calendar.nextReviewAt,
    releaseCandidateRef: packEnvelope.activePack.releaseCandidateRef,
    releaseWatchTupleRef: packEnvelope.activePack.releaseWatchTupleRef,
    watchTupleHashPrefix: packEnvelope.activePack.watchTupleHash.slice(0, 12),
    lanes: lanesFromRows(rotaRows),
    rotaRows,
    openActions: openActionsRegister.openActions.map((action: any) => ({
      openActionId: action.openActionId,
      title: action.title,
      owner: action.owner,
      dueDate: action.dueDate,
      severity: action.severity,
      actionClass:
        scenarioState === "blocked" && action.openActionId.includes("supplier")
          ? "release_blocking"
          : action.actionClass,
      releaseBlocking: scenarioState === "blocked" && action.openActionId.includes("supplier")
        ? true
        : action.releaseBlocking,
      state: scenarioState === "blocked" && action.openActionId.includes("supplier") ? "blocked" : action.state,
    })),
    rightRail: {
      currentOnCall:
        scenarioState === "ooh_gap" ? "Coverage gap" : incidentCommander.incidentCommanderRota.outOfHoursCommander,
      incidentCommander: incidentCommander.incidentCommanderRota.primaryCommander,
      supplierEscalation:
        scenarioState === "blocked" ? "Programme-only escalation blocked" : "svc-owner:supplier-management",
      upcomingGovernanceEvents: governanceCalendar.calendar.events,
    },
    acceptanceActionState:
      role !== "service_owner" ? "disabled_role" : blocked ? "disabled_blocked" : "enabled",
    rotaModifyActionState:
      role !== "service_owner" && role !== "rota_manager"
        ? "disabled_role"
        : blocked && role !== "rota_manager"
          ? "disabled_blocked"
          : "enabled",
  };
}

export const BAU_HANDOVER_487_ACCEPTANCE_COUNT = acceptanceRegister.acceptances.length;
