import { describe, expect, it } from "vitest";
import {
  createInitialHubShellState,
  hubOptionTimerMatrixRows,
  navigateHubShell,
  parseHubPath,
  returnFromHubChildRoute,
  selectHubOption,
} from "./hub-shell-seed.model";

describe("hub shell seed model", () => {
  it("parses queue, alternatives, exceptions, and audit into the canonical route families", () => {
    expect(parseHubPath("/hub/queue")).toMatchObject({
      routeFamilyRef: "rf_hub_queue",
      viewMode: "queue",
    });

    expect(parseHubPath("/hub/exceptions")).toMatchObject({
      routeFamilyRef: "rf_hub_queue",
      viewMode: "exceptions",
    });

    expect(parseHubPath("/hub/alternatives/ofs_104")).toMatchObject({
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "alternatives",
      offerSessionId: "ofs_104",
    });

    expect(parseHubPath("/hub/audit/hub-case-066")).toMatchObject({
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "audit",
      hubCoordinationCaseId: "hub-case-066",
    });
  });

  it("only allows countdown authority for exclusive holds", () => {
    const heldRows = hubOptionTimerMatrixRows.filter(
      (row) => row.countdownAuthority === "exclusive_held",
    );

    expect(heldRows).toHaveLength(1);
    expect(heldRows[0]).toMatchObject({
      optionTruthMode: "exclusive_hold",
      timerMode: "hold_expiry",
      reservedCopyAllowed: "yes",
    });
    expect(
      hubOptionTimerMatrixRows.every(
        (row) =>
          row.optionTruthMode === "exclusive_hold" ||
          row.countdownAuthority === "none",
      ),
    ).toBe(true);
  });

  it("returns from alternatives back to the case route instead of dropping to queue", () => {
    const initial = createInitialHubShellState("/hub/queue");
    const selected = selectHubOption(initial, "hub-opt-104-river");
    const alternatives = navigateHubShell(selected, "/hub/alternatives/ofs_104");
    const returned = returnFromHubChildRoute(alternatives);

    expect(alternatives.location.viewMode).toBe("alternatives");
    expect(returned.location.pathname).toBe("/hub/case/hub-case-104");
    expect(returned.selectedOptionId).toBe("hub-opt-104-river");
  });

  it("keeps callback transfer pending routed to the same shell case-management family", () => {
    const state = createInitialHubShellState("/hub/case/hub-case-052");

    expect(state.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("hub.queue");
    expect(state.location.routeFamilyRef).toBe("rf_hub_case_management");
    expect(state.selectedOptionId).toBe("hub-opt-052-callback");
  });
});
