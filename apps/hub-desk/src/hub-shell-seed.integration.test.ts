import { describe, expect, it } from "vitest";
import {
  createInitialHubShellState,
  navigateHubShell,
  resolveHubShellSnapshot,
  returnFromHubChildRoute,
  selectHubOrganisation,
  selectHubCase,
  selectHubSavedView,
} from "./hub-shell-seed.model";

describe("hub shell continuity integration", () => {
  it("preserves the same shell continuity key across queue, case, and alternatives", () => {
    const queue = createInitialHubShellState("/hub/queue");
    const caseView = navigateHubShell(queue, "/hub/case/hub-case-104");
    const alternatives = navigateHubShell(caseView, "/hub/alternatives/offer-session-104");

    expect(queue.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("hub.queue");
    expect(caseView.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("hub.queue");
    expect(alternatives.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("hub.queue");
    expect(alternatives.location.routeFamilyRef).toBe("rf_hub_case_management");
  });

  it("keeps exceptions in the queue family and marks recovery-required shell posture explicitly", () => {
    const queue = createInitialHubShellState("/hub/queue");
    const recovery = selectHubSavedView(queue, "supplier_drift");
    const state = navigateHubShell(recovery, "/hub/exceptions");
    const snapshot = resolveHubShellSnapshot(state, 1440);

    expect(state.location.routeFamilyRef).toBe("rf_hub_queue");
    expect(snapshot.artifactModeState).toBe("table_only");
    expect(snapshot.routeMutationEnabled).toBe(false);
    expect(snapshot.routeShellPosture).toBe("shell_recovery_only");
  });

  it("returns from audit back to the selected case instead of reconstructing a detached audit page", () => {
    const queue = createInitialHubShellState("/hub/queue");
    const selected = selectHubCase(queue, "hub-case-066");
    const audit = navigateHubShell(selected, "/hub/audit/hub-case-066");
    const returned = returnFromHubChildRoute(audit);

    expect(audit.location.viewMode).toBe("audit");
    expect(returned.location.pathname).toBe("/hub/case/hub-case-066");
    expect(returned.selectedCaseId).toBe("hub-case-066");
  });

  it("keeps the same route family and selected anchor when a scope switch denies the current route", () => {
    const caseView = createInitialHubShellState("/hub/case/hub-case-052");
    const denied = selectHubOrganisation(caseView, "south_vale_network");
    const snapshot = resolveHubShellSnapshot(denied, 1440);

    expect(denied.location.routeFamilyRef).toBe("rf_hub_case_management");
    expect(denied.selectedCaseId).toBe("hub-case-052");
    expect(snapshot.actingContextControlPlane.accessDeniedState?.title).toBe(
      "HubAccessDeniedState",
    );
  });
});
