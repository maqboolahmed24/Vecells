import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StaffShellSeedApp } from "./staff-shell-seed";
import {
  buildStaffPath,
  buildSurfacePosture,
  buildWorkspaceStatus,
  createInitialLedger,
  createStaffRouteAuthority,
  deriveVisibleQueueRows,
  listQueueCases,
  parseStaffPath,
  reduceLedgerForNavigation,
  staffHomeModules,
} from "./staff-shell-seed.data";

describe("staff shell seed routes: unit contracts", () => {
  it("publishes the exact home module priority order and seed route grammar", () => {
    expect(staffHomeModules.map((module) => module.title)).toEqual([
      "TodayWorkbenchHero",
      "InterruptionDigest",
      "TeamRiskDigest",
      "RecentResumptionStrip",
    ]);

    expect(buildStaffPath({ kind: "home" })).toBe("/workspace");
    expect(buildStaffPath({ kind: "queue", queueKey: "returned-evidence" })).toBe(
      "/workspace/queue/returned-evidence",
    );
    expect(buildStaffPath({ kind: "task", taskId: "task-311" })).toBe("/workspace/task/task-311");
    expect(buildStaffPath({ kind: "more-info", taskId: "task-311" })).toBe(
      "/workspace/task/task-311/more-info",
    );
    expect(buildStaffPath({ kind: "decision", taskId: "task-311" })).toBe(
      "/workspace/task/task-311/decision",
    );
    expect(buildStaffPath({ kind: "search", searchQuery: "Asha Patel" })).toBe(
      "/workspace/search?q=Asha%20Patel",
    );

    const searchRoute = parseStaffPath("/workspace/search", "?q=Asha%20Patel");
    expect(searchRoute.kind).toBe("search");
    expect(searchRoute.routeFamilyRef).toBe("rf_staff_workspace_child");
    expect(searchRoute.searchQuery).toBe("Asha Patel");
  });

  it("keeps the active queue row pinned when a re-rank batch lands", () => {
    const route = parseStaffPath("/workspace/queue/recommended");
    const before = listQueueCases("recommended");
    const beforeIndex = before.findIndex((row) => row.id === "task-507");
    const ledger = {
      ...createInitialLedger(route, "live"),
      selectedTaskId: "task-507",
      previewTaskId: "task-507",
      queuedBatchPending: false,
    };

    const after = deriveVisibleQueueRows(route, ledger);
    const afterIndex = after.findIndex((row) => row.id === "task-507");

    expect(beforeIndex).toBe(3);
    expect(afterIndex).toBe(beforeIndex);
  });
});

describe("staff shell seed routes: integration continuity", () => {
  it("morphs from queue to more-info inside the same shell while preserving the origin anchor", () => {
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
      runtimeScenario: "live",
    });

    expect(reduced.boundaryState).toBe("morph_child_surface");
    expect(reduced.ledger.selectedAnchorId).toBe("queue-row-task-311");
    expect(reduced.ledger.path).toBe("/workspace/task/task-311/more-info");
    expect(reduced.restoreStorageKey).toBe("persistent-shell::clinical-workspace");
  });

  it("localizes recovery-only posture to the current task surface instead of replacing the shell", () => {
    const route = parseStaffPath("/workspace/task/task-311/decision");
    const authority = createStaffRouteAuthority(route, "recovery_only");
    const posture = buildSurfacePosture(route, authority, {
      queueRows: listQueueCases("returned-evidence"),
      selectedAnchorId: "decision-preview-task-311",
      searchQuery: "",
    });

    expect(authority.guardDecision.effectivePosture).toBe("recovery_only");
    expect(posture?.postureClass).toBe("bounded_recovery");
    expect(posture?.nextSafeActionLabel).toBe("Restore draft and review delta");
  });
});

describe("staff shell seed routes: accessibility and regression", () => {
  it("renders the default shell with stable navigation, queue, and telemetry markers", () => {
    const html = renderToStaticMarkup(<StaffShellSeedApp />);

    expect(html).toContain('data-testid="staff-shell-root"');
    expect(html).toContain('aria-label="Clinical workspace sections"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('data-testid="today-workbench-hero"');
    expect(html).toContain('data-testid="decision-dock"');
    expect(html).toContain('data-dom-marker="selected-anchor"');
    expect(html).toContain('data-automation-surface="rf_staff_workspace"');
  });

  it("keeps more-info posture copy and shared status truth aligned", () => {
    const route = parseStaffPath("/workspace/task/task-311/more-info");
    const status = buildWorkspaceStatus(route, "read_only", null);

    expect(status.statusInput.dominantActionLabel).toBe("Send bounded more-info request");
    expect(status.pulse.primaryNextActionLabel).toBe("Send bounded more-info request");
    expect(status.pulse.confirmationPosture).toBe("Read-only preserve");
  });
});
