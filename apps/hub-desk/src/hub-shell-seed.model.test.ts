import { describe, expect, it } from "vitest";
import {
  activateHubBreakGlass,
  createInitialHubShellState,
  navigateHubShell,
  revokeHubBreakGlass,
  resolveHubShellSnapshot,
  selectHubOrganisation,
  selectHubPurposeOfUse,
  selectHubSavedView,
  parseHubPath,
  returnFromHubChildRoute,
  selectHubCase,
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

  it("restores the selected saved view and queue anchor from history state", () => {
    const state = createInitialHubShellState("/hub/queue", {
      historySnapshot: {
        selectedSavedViewId: "ack_watch",
        selectedCaseId: "hub-case-066",
        selectedQueueAnchorId: "hub-case-066",
        activeCaseAnchorId: "hub-case-066",
      },
    });

    const snapshot = resolveHubShellSnapshot(state, 1440);

    expect(snapshot.savedView.savedViewId).toBe("ack_watch");
    expect(snapshot.currentCase.caseId).toBe("hub-case-066");
    expect(snapshot.selectedAnchorId).toBe("hub-case-066");
    expect(snapshot.layoutMode).toBe("two_plane");
  });

  it("keeps the requested URL authoritative when stored history came from a different case", () => {
    const state = createInitialHubShellState("/hub/case/hub-case-087", {
      historySnapshot: {
        pathname: "/hub/case/hub-case-104",
        selectedSavedViewId: "resume_today",
        selectedCaseId: "hub-case-104",
        selectedQueueAnchorId: "hub-case-104",
        activeCaseAnchorId: "hub-case-104",
      },
    });

    const snapshot = resolveHubShellSnapshot(state, 1440);

    expect(state.location.pathname).toBe("/hub/case/hub-case-087");
    expect(state.location.hubCoordinationCaseId).toBe("hub-case-087");
    expect(snapshot.currentCase.caseId).toBe("hub-case-087");
  });

  it("returns from alternatives back to the case route instead of dropping to queue", () => {
    const initial = createInitialHubShellState("/hub/queue");
    const selected = selectHubCase(initial, "hub-case-104");
    const alternatives = navigateHubShell(selected, "/hub/alternatives/offer-session-104");
    const returned = returnFromHubChildRoute(alternatives);

    expect(alternatives.location.viewMode).toBe("alternatives");
    expect(returned.location.pathname).toBe("/hub/case/hub-case-104");
    expect(returned.selectedCaseId).toBe("hub-case-104");
  });

  it("degrades observe-only viewing to read-only posture without leaving the shell", () => {
    const queue = createInitialHubShellState("/hub/queue");
    const observeOnly = selectHubSavedView(queue, "observe_only");
    const caseView = navigateHubShell(observeOnly, "/hub/case/hub-case-041");
    const snapshot = resolveHubShellSnapshot(caseView, 1440);

    expect(caseView.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("hub.queue");
    expect(caseView.location.routeFamilyRef).toBe("rf_hub_case_management");
    expect(snapshot.routeShellPosture).toBe("shell_read_only");
    expect(snapshot.routeMutationEnabled).toBe(false);
  });

  it("preserves the current case anchor when organisation switching demotes the shell to read-only", () => {
    const queue = createInitialHubShellState("/hub/case/hub-case-104");
    const switched = selectHubOrganisation(queue, "riverside_medical");
    const snapshot = resolveHubShellSnapshot(switched, 1440);

    expect(switched.selectedCaseId).toBe("hub-case-104");
    expect(switched.selectedOrganisationId).toBe("riverside_medical");
    expect(snapshot.actingContextControlPlane.accessPosture).toBe("read_only");
    expect(snapshot.actingContextControlPlane.minimumNecessaryPlaceholders).toHaveLength(3);
  });

  it("freezes writable posture when purpose-of-use drifts under the current case", () => {
    const queue = createInitialHubShellState("/hub/case/hub-case-041");
    const drifted = selectHubPurposeOfUse(queue, "service_recovery_review");
    const snapshot = resolveHubShellSnapshot(drifted, 1440);

    expect(drifted.selectedCaseId).toBe("hub-case-041");
    expect(snapshot.actingContextControlPlane.accessPosture).toBe("frozen");
    expect(snapshot.actingContextControlPlane.scopeDriftFreezeBanner?.title).toContain("drift");
  });

  it("records active and revoked break-glass states without dropping the route", () => {
    const queue = createInitialHubShellState("/hub/case/hub-case-031");
    const active = activateHubBreakGlass(queue, "urgent_clinical_safety");
    const activeSnapshot = resolveHubShellSnapshot(active, 1440);
    const revoked = revokeHubBreakGlass(active);
    const revokedSnapshot = resolveHubShellSnapshot(revoked, 1440);

    expect(active.location.pathname).toBe("/hub/case/hub-case-031");
    expect(activeSnapshot.actingContextControlPlane.scopeSummaryStrip.breakGlassState).toBe(
      "active",
    );
    expect(revokedSnapshot.actingContextControlPlane.accessPosture).toBe("denied");
  });
});
