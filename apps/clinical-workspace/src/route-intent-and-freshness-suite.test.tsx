import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createInitialContinuitySnapshot,
  invalidateSelectedAnchor,
} from "@vecells/persistent-shell";
import {
  buildSurfacePosture,
  createInitialLedger,
  createStaffRouteAuthority,
  listQueueCases,
  parseStaffPath,
  reduceLedgerForNavigation,
} from "./staff-shell-seed.data";

const suite = JSON.parse(
  fs.readFileSync(
    new URL("../../../data/test/continuity_gate_suite_results.json", import.meta.url),
    "utf8",
  ),
);

describe("seq_134 workspace continuity and freshness joins", () => {
  it("keeps live transport stale-truth cases in bounded recovery instead of live task posture", () => {
    const suiteCase = suite.continuityScenarios.find(
      (row: { caseId: string }) => row.caseId === "CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH",
    );
    const route = parseStaffPath("/workspace/task/task-311/decision");
    const authority = createStaffRouteAuthority(route, "recovery_only");
    const posture = buildSurfacePosture(route, authority, {
      queueRows: listQueueCases("returned-evidence"),
      selectedAnchorId: "decision-preview-task-311",
      searchQuery: "",
    });

    expect(suiteCase.effectiveShellPosture).toBe("recovery_only");
    expect(authority.guardDecision.effectivePosture).toBe("recovery_only");
    expect(posture?.postureClass).toBe("bounded_recovery");
    expect(posture?.nextSafeActionLabel).toBe("Restore draft and review delta");
  });

  it("keeps same-shell recovery scoped to the active workspace task during child navigation", () => {
    const suiteCase = suite.continuityScenarios.find(
      (row: { caseId: string }) => row.caseId === "CG_134_STAFF_SELECTED_ANCHOR_RECOVERY",
    );
    const currentRoute = parseStaffPath("/workspace/queue/returned-evidence");
    const nextRoute = parseStaffPath("/workspace/task/task-311/more-info");
    const ledger = {
      ...createInitialLedger(currentRoute, "live"),
      queueKey: "returned-evidence",
      selectedTaskId: "task-311",
      previewTaskId: "task-311",
      selectedAnchorId: "queue-row-task-311",
    };

    const reduced = reduceLedgerForNavigation({
      ledger,
      currentRoute,
      nextRoute,
      runtimeScenario: "recovery_only",
    });

    expect(suiteCase.selectedAnchorDisposition).toBe("freeze");
    expect(reduced.boundaryState).toBe("recover_in_place");
    expect(reduced.ledger.selectedAnchorId).toBe("more-info-compose-task-311");
    expect(reduced.ledger.selectedTaskId).toBe("task-311");
    expect(reduced.ledger.path).toBe("/workspace/task/task-311/more-info");
  });

  it("keeps a selected-anchor stub and focus target when the exact anchor is invalidated", () => {
    const snapshot = createInitialContinuitySnapshot({
      shellSlug: "clinical-workspace",
      routeFamilyRef: "rf_staff_workspace_child",
      anchorKey: "queue-evidence",
      runtimeScenario: "recovery_only",
    });
    const invalidated = invalidateSelectedAnchor(snapshot, {
      reasonRefs: ["projection_review_required", "route_tuple_rebind_required"],
      nearestSafeAnchorKey: "queue-decision",
      runtimeScenario: "recovery_only",
      timestamp: "2026-04-14T11:20:00Z",
    });

    expect(invalidated.currentStub?.invalidationState).toBe("anchor_unavailable_preserve_stub");
    expect(invalidated.currentStub?.nearestSafeAnchorRef).toContain("queue-decision");
    expect(invalidated.currentStub?.explanation).toContain("preserves a stub");
    expect(invalidated.focusRestoreTargetRef).toBe("focus.recovery.notice");
    expect(invalidated.timeline.at(-1)?.kind).toBe("invalidation");
  });
});
