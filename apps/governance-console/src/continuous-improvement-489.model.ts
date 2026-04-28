import closureArtifact from "../../../data/programme/489_master_dependency_watchlist_closure.json";
import backlogArtifact from "../../../data/programme/489_continuous_improvement_backlog_seed.json";
import cadenceArtifact from "../../../data/programme/489_bau_cadence_and_metric_ownership.json";
import finalStateArtifact from "../../../data/programme/489_closed_programme_final_state.json";
import transferArtifact from "../../../data/programme/489_unresolved_item_transfer_register.json";

export const CONTINUOUS_IMPROVEMENT_489_PATH = "/ops/governance/continuous-improvement";
export const CONTINUOUS_IMPROVEMENT_489_TASK_ID = "seq_489";
export const CONTINUOUS_IMPROVEMENT_489_VISUAL_MODE = "Continuous_Improvement_Transition_Board_489";

export type ContinuousImprovement489State = "complete" | "constrained" | "blocked" | "transfer_conflict";
export type ContinuousImprovement489Role = "programme_owner" | "service_owner" | "viewer";

export interface ContinuousImprovement489Filters {
  readonly decision: string;
  readonly risk: string;
  readonly owner: string;
  readonly cadence: string;
}

export interface ContinuousImprovement489DecisionRow {
  readonly rowId: string;
  readonly itemCode: string;
  readonly title: string;
  readonly decision: string;
  readonly evidenceHash: string;
  readonly residualRisk: string;
  readonly owner: string;
  readonly nextReviewDate: string;
  readonly sourceEvidenceRef: string;
  readonly signoffAuthorityRef: string;
  readonly metricRef: string;
  readonly blockerRefs: readonly string[];
}

export interface ContinuousImprovement489OutcomeGroup {
  readonly area: string;
  readonly items: readonly {
    readonly itemId: string;
    readonly title: string;
    readonly owner: string;
    readonly metricRef: string;
    readonly dueDate: string;
    readonly state: string;
  }[];
}

export interface ContinuousImprovement489Projection {
  readonly taskId: typeof CONTINUOUS_IMPROVEMENT_489_TASK_ID;
  readonly visualMode: typeof CONTINUOUS_IMPROVEMENT_489_VISUAL_MODE;
  readonly boardState: ContinuousImprovement489State;
  readonly role: ContinuousImprovement489Role;
  readonly programmeFinalState: "complete" | "complete_with_transfers" | "blocked";
  readonly closureState: "complete" | "complete_with_transfers" | "blocked";
  readonly evidenceVaultSeal: string;
  readonly activeWaveStatus: "closed" | "active" | "blocked";
  readonly unresolvedTransferCount: number;
  readonly nextReviewAt: string;
  readonly archiveManifestRef: string;
  readonly archiveHref: string;
  readonly watchlistRows: readonly ContinuousImprovement489DecisionRow[];
  readonly filteredRows: readonly ContinuousImprovement489DecisionRow[];
  readonly outcomeGroups: readonly ContinuousImprovement489OutcomeGroup[];
  readonly cadenceRows: readonly {
    readonly cadenceOwnerId: string;
    readonly domain: string;
    readonly owner: string;
    readonly cadence: string;
    readonly nextReviewAt: string;
    readonly state: string;
  }[];
  readonly reviewTriggers: readonly {
    readonly reviewTriggerId: string;
    readonly title: string;
    readonly area: string;
    readonly condition: string;
    readonly state: string;
  }[];
  readonly transferRows: readonly {
    readonly transferId: string;
    readonly target: string;
    readonly owner: string;
    readonly residualRisk: string;
    readonly metricRef: string;
  }[];
  readonly blockers: readonly string[];
  readonly closureActionState: "settled" | "blocked" | "disabled_role";
}

type ClosureEnvelope = {
  readonly activeClosure: {
    readonly closureState: "complete" | "complete_with_transfers" | "blocked";
    readonly blockerRefs: readonly string[];
  };
  readonly watchlistItemClosureDecisions: readonly {
    readonly watchlistItemClosureDecisionId: string;
    readonly itemCode: string;
    readonly title: string;
    readonly closureDecision: string;
    readonly sourceEvidenceHash: string;
    readonly residualRisk: string;
    readonly targetOwner: string;
    readonly nextReviewDate: string | null;
    readonly sourceEvidenceRef: string;
    readonly signoffAuthorityRef: string | null;
    readonly targetOutcomeMetricRef: string | null;
    readonly blockerRefs: readonly string[];
  }[];
};

const closure = closureArtifact as unknown as ClosureEnvelope;
const backlog = backlogArtifact as any;
const cadence = cadenceArtifact as any;
const finalState = finalStateArtifact as any;
const transfers = transferArtifact as any;

export function isContinuousImprovement489Path(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === CONTINUOUS_IMPROVEMENT_489_PATH;
}

export function normalizeContinuousImprovement489State(
  value: string | null | undefined,
): ContinuousImprovement489State {
  if (value === "complete" || value === "constrained" || value === "blocked" || value === "transfer_conflict") {
    return value;
  }
  return "constrained";
}

export function normalizeContinuousImprovement489Role(
  value: string | null | undefined,
): ContinuousImprovement489Role {
  if (value === "programme_owner" || value === "service_owner" || value === "viewer") return value;
  return "programme_owner";
}

function normalizeFilter(value: string | null | undefined): string {
  return value && value !== "all" ? value : "all";
}

export function readContinuousImprovement489Filters(search: string): ContinuousImprovement489Filters {
  const params = new URLSearchParams(search);
  return {
    decision: normalizeFilter(params.get("decision")),
    risk: normalizeFilter(params.get("risk")),
    owner: normalizeFilter(params.get("owner")),
    cadence: normalizeFilter(params.get("cadence")),
  };
}

function applyScenarioRows(
  rows: readonly ContinuousImprovement489DecisionRow[],
  boardState: ContinuousImprovement489State,
): readonly ContinuousImprovement489DecisionRow[] {
  if (boardState === "blocked") {
    return rows.map((row) =>
      row.itemCode === "release_wave_observation"
        ? {
            ...row,
            decision: "blocked_release",
            residualRisk: "blocking",
            blockerRefs: ["blocker:489:programme-complete-while-wave-observation-active"],
          }
        : row,
    );
  }
  if (boardState === "transfer_conflict") {
    const supplier = rows.find((row) => row.itemCode === "supplier_contact_retest");
    return supplier
      ? [
          ...rows,
          {
            ...supplier,
            rowId: `${supplier.rowId}_conflict`,
            decision: "transferred_to_ci",
            owner: "svc-owner:operations-control",
            blockerRefs: ["blocker:489:unresolved-item-has-conflicting-bau-and-ci-owners"],
          },
        ]
      : rows;
  }
  if (boardState === "complete") {
    return rows.map((row) =>
      row.decision === "transferred_to_bau" ? { ...row, residualRisk: "low" } : row,
    );
  }
  return rows;
}

function filterRows(
  rows: readonly ContinuousImprovement489DecisionRow[],
  filters: ContinuousImprovement489Filters,
): readonly ContinuousImprovement489DecisionRow[] {
  return rows.filter((row) => {
    const cadenceMatch =
      filters.cadence === "all" ||
      (filters.cadence === "has_review" ? row.nextReviewDate !== "n/a" : row.nextReviewDate === "n/a");
    return (
      (filters.decision === "all" || row.decision === filters.decision) &&
      (filters.risk === "all" || row.residualRisk === filters.risk) &&
      (filters.owner === "all" || row.owner === filters.owner) &&
      cadenceMatch
    );
  });
}

function groupOutcomeItems(): readonly ContinuousImprovement489OutcomeGroup[] {
  const items = backlog.activeBacklogSeed.backlogItems as any[];
  const areas = [...new Set(items.map((item) => item.outcomeArea))].sort();
  return areas.map((area) => ({
    area,
    items: items
      .filter((item) => item.outcomeArea === area)
      .map((item) => ({
        itemId: item.backlogItemId,
        title: item.title,
        owner: item.owner,
        metricRef: item.outcomeMetricRef ?? "missing",
        dueDate: item.dueDate,
        state: item.backlogState,
      })),
  }));
}

export function createContinuousImprovement489Projection(
  boardState = normalizeContinuousImprovement489State(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("transitionState"),
  ),
  role = normalizeContinuousImprovement489Role(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("transitionRole"),
  ),
  filters = readContinuousImprovement489Filters(typeof window === "undefined" ? "" : window.location.search),
): ContinuousImprovement489Projection {
  const baseRows = closure.watchlistItemClosureDecisions.map((decision) => ({
    rowId: decision.watchlistItemClosureDecisionId,
    itemCode: decision.itemCode,
    title: decision.title,
    decision: decision.closureDecision,
    evidenceHash: decision.sourceEvidenceHash.slice(0, 12),
    residualRisk: decision.residualRisk,
    owner: decision.targetOwner,
    nextReviewDate: decision.nextReviewDate ?? "n/a",
    sourceEvidenceRef: decision.sourceEvidenceRef,
    signoffAuthorityRef: decision.signoffAuthorityRef ?? "n/a",
    metricRef: decision.targetOutcomeMetricRef ?? "n/a",
    blockerRefs: decision.blockerRefs,
  }));
  const rows = applyScenarioRows(baseRows, boardState);
  const blockers = rows.flatMap((row) => row.blockerRefs);
  const programmeFinalState = boardState === "blocked" || boardState === "transfer_conflict" ? "blocked" : finalState.finalState.finalState;
  return {
    taskId: CONTINUOUS_IMPROVEMENT_489_TASK_ID,
    visualMode: CONTINUOUS_IMPROVEMENT_489_VISUAL_MODE,
    boardState,
    role,
    programmeFinalState,
    closureState: blockers.length > 0 ? "blocked" : closure.activeClosure.closureState,
    evidenceVaultSeal: finalState.finalState.archiveWormSealDigest,
    activeWaveStatus: boardState === "blocked" ? "active" : finalState.finalState.activeWaveStatus,
    unresolvedTransferCount: boardState === "complete" ? transfers.transfers.length : transfers.transfers.length,
    nextReviewAt: finalState.finalState.nextProgrammeReviewAt,
    archiveManifestRef: finalState.finalState.archiveManifestRef,
    archiveHref: "/ops/governance/evidence-vault?vaultState=sealed_with_exceptions&vaultRole=governance_admin",
    watchlistRows: rows,
    filteredRows: filterRows(rows, filters),
    outcomeGroups: groupOutcomeItems(),
    cadenceRows: cadence.cadenceOwners.map((owner: any) => ({
      cadenceOwnerId: owner.cadenceOwnerId,
      domain: owner.domain,
      owner: owner.owner,
      cadence: owner.cadence,
      nextReviewAt: owner.nextReviewAt,
      state: owner.cadenceState,
    })),
    reviewTriggers: backlog.activeBacklogSeed.reviewTriggers.map((trigger: any) => ({
      reviewTriggerId: trigger.reviewTriggerId,
      title: trigger.title,
      area: trigger.outcomeArea,
      condition: trigger.triggerCondition,
      state: trigger.triggerState,
    })),
    transferRows: transfers.transfers.map((transfer: any) => ({
      transferId: transfer.unresolvedItemTransferId,
      target: transfer.transferTarget,
      owner: transfer.owner,
      residualRisk: transfer.residualRisk,
      metricRef: transfer.targetOutcomeMetricRef ?? "n/a",
    })),
    blockers,
    closureActionState: role === "viewer" ? "disabled_role" : blockers.length > 0 ? "blocked" : "settled",
  };
}
