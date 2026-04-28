import { describe, expect, it } from "vitest";
import {
  acknowledgeSelectedAnchorReplacement,
  createInitialContinuitySnapshot,
  getRouteAdjacencyContract,
  getSelectedAnchorPolicy,
  invalidateSelectedAnchor,
  listReturnContractScenarios,
  listRouteAdjacencyContracts,
  listSelectedAnchorPolicies,
  navigateWithinShell,
  restoreSnapshotFromRefresh,
  selectedAnchorManagerCatalog,
} from "../src/index";

describe("selected anchor and return-contract manager", () => {
  it("publishes a selected-anchor policy for every persistent-shell route family", () => {
    const policies = listSelectedAnchorPolicies();

    expect(policies).toHaveLength(19);
    expect(selectedAnchorManagerCatalog.policyCount).toBe(19);
    expect(getSelectedAnchorPolicy("rf_governance_shell").replacementRequirementRef).toBe(
      "acknowledgement_required",
    );
    expect(getSelectedAnchorPolicy("rf_patient_health_record").restoreOrder).toEqual([
      "anchor",
      "scroll",
      "disclosure",
      "focus",
    ]);
  });

  it("publishes route-adjacency contracts for every same-shell route pair", () => {
    const contracts = listRouteAdjacencyContracts();
    const patientChild = getRouteAdjacencyContract(
      "rf_patient_requests",
      "rf_intake_self_service",
    );
    const workspaceSwitch = getRouteAdjacencyContract(
      "rf_staff_workspace",
      "rf_staff_workspace_child",
    );

    expect(contracts).toHaveLength(99);
    expect(patientChild.adjacencyType).toBe("same_object_child");
    expect(patientChild.historyPolicy).toBe("replace");
    expect(workspaceSwitch.adjacencyType).toBe("same_object_peer");
    expect(workspaceSwitch.defaultReturnPosture).toBe("partial_restore");
  });

  it("restores the preserved origin anchor when a patient child route exits", () => {
    const start = createInitialContinuitySnapshot({
      shellSlug: "patient-web",
      routeFamilyRef: "rf_patient_requests",
      anchorKey: "request-needs-attention",
    });
    const child = navigateWithinShell(start, "rf_intake_self_service");
    const returned = navigateWithinShell(child.snapshot, "rf_patient_requests");

    expect(child.returnContract?.preservedAnchorId).toContain("request-needs-attention");
    expect(child.snapshot.selectedAnchor.anchorKey).toBe("request-start");
    expect(returned.snapshot.selectedAnchor.anchorKey).toBe("request-needs-attention");
    expect(returned.snapshot.currentReturnContract).toBeNull();
    expect(returned.snapshot.focusRestoreTargetRef).toContain("request-needs-attention");
  });

  it("keeps a visible stub and recovery posture when refresh cannot restore the exact record anchor", () => {
    const start = createInitialContinuitySnapshot({
      shellSlug: "patient-web",
      routeFamilyRef: "rf_patient_health_record",
      anchorKey: "record-latest",
    });
    const invalidated = invalidateSelectedAnchor(start, {
      reasonRefs: ["reason.artifact_mode_truth_drift"],
      nearestSafeAnchorKey: "record-summary",
      runtimeScenario: "recovery_only",
    });
    const restored = restoreSnapshotFromRefresh(invalidated, {
      availableAnchorKeys: ["record-summary", "record-follow-up"],
      runtimeScenario: "recovery_only",
    });

    expect(invalidated.currentStub?.invalidationState).toBe(
      "anchor_unavailable_preserve_stub",
    );
    expect(restored.currentStub?.invalidationState).toBe("anchor_unavailable_preserve_stub");
    expect(restored.selectedAnchor.anchorKey).toBe("record-summary");
    expect(restored.disclosurePosture).toBe("recovery_notice");
    expect(restored.focusRestoreTargetRef).toContain("focus.stub");
    expect(restored.restoreOrder[0]?.stepKey).toBe("anchor");
  });

  it("requires explicit acknowledgement before a governance replacement anchor becomes dominant", () => {
    const start = createInitialContinuitySnapshot({
      shellSlug: "governance-console",
      routeFamilyRef: "rf_governance_shell",
      anchorKey: "governance-diff",
    });
    const replaced = invalidateSelectedAnchor(start, {
      reasonRefs: ["reason.diff_scope_superseded"],
      replacementAnchorKey: "governance-approval",
    });
    const acknowledged = acknowledgeSelectedAnchorReplacement(replaced);

    expect(replaced.currentStub?.acknowledgementRequired).toBe(true);
    expect(replaced.currentStub?.replacementAnchorRef).toContain("governance-approval");
    expect(replaced.selectedAnchor.stabilityState).toBe("replaced");
    expect(acknowledged.currentStub).toBeNull();
    expect(acknowledged.selectedAnchor.anchorKey).toBe("governance-approval");
    expect(acknowledged.selectedAnchor.stabilityState).toBe("recovered");
  });

  it("publishes the required scenario families with explicit return postures", () => {
    const scenarios = listReturnContractScenarios();
    const ids = scenarios.map((scenario) => scenario.scenarioId);

    expect(selectedAnchorManagerCatalog.scenarioCount).toBe(5);
    expect(ids).toEqual([
      "SCN_PATIENT_CHILD_RETURN_FULL",
      "SCN_PATIENT_RECORD_RECOVERY_RETURN",
      "SCN_WORKSPACE_QUIET_RETURN",
      "SCN_OPERATIONS_STALE_RETURN",
      "SCN_GOVERNANCE_DIFF_REPLACEMENT",
    ]);
    expect(scenarios[1]?.steps.at(-1)?.returnPosture).toBe("recovery_required_return");
    expect(scenarios[3]?.steps.at(-1)?.returnPosture).toBe("read_only_preserve");
  });
});
