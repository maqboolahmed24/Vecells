import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
  WORKSPACE_CONTEXT_PROJECTION_SERVICE_NAME,
  WORKSPACE_CONTEXT_QUERY_SURFACES,
  createWorkspaceConsistencyProjectionApplication,
  workspaceContextScenarioIds,
  workspaceContextRoutes,
} from "../src/workspace-consistency-projection.ts";

describe("workspace consistency projection command-api seam", () => {
  it("publishes the workspace context query surfaces in the service route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    expect(routeIds).toContain("workspace_task_context_current");
    expect(routeIds).toContain("workspace_task_trust_envelope_current");
    expect(workspaceContextRoutes).toHaveLength(2);
    expect(WORKSPACE_CONTEXT_QUERY_SURFACES).toContain("GET /v1/workspace/tasks/:taskId/context");
  });

  it("derives writable, continuity, composition, and recovery posture through one workspace bundle", async () => {
    const application = createWorkspaceConsistencyProjectionApplication();
    const scenarios = await application.simulation.runAllScenarios();
    const byScenario = Object.fromEntries(scenarios.map((scenario) => [scenario.scenarioId, scenario]));

    expect(WORKSPACE_CONTEXT_PROJECTION_SERVICE_NAME).toBe("WorkspaceContextProjectionService");
    expect(WORKSPACE_CONTEXT_FIXTURE_TASK_ID).toBe("phase3_workspace_task_232_primary");
    expect(workspaceContextScenarioIds).toHaveLength(6);
    expect(scenarios).toHaveLength(6);

    expect(
      byScenario.fresh_writable_live_lease.bundle.workspaceTrustEnvelope.envelopeState,
    ).toBe("interactive");
    expect(
      byScenario.fresh_writable_live_lease.bundle.workspaceTrustEnvelope.mutationAuthorityState,
    ).toBe("live");

    expect(
      byScenario.preview_only_without_live_lease.bundle.workspaceTrustEnvelope.mutationAuthorityState,
    ).toBe("blocked");
    expect(
      byScenario.preview_only_without_live_lease.bundle.workspaceTrustEnvelope.blockingReasonRefs,
    ).toContain("WORKSPACE_232_REVIEW_ACTION_LEASE_MISSING");

    expect(
      byScenario.same_shell_route_change_continuity.bundle.workspaceContinuityEvidenceProjection.continuityTupleHash,
    ).toBeTruthy();
    const rootBundle = await application.queryWorkspaceTaskContext({
      taskId: WORKSPACE_CONTEXT_FIXTURE_TASK_ID,
      workspaceRef: "/workspace/task/phase3_workspace_task_232_primary",
      releaseScenarioId: "live_exact_parity_trusted_slices",
    });
    expect(
      byScenario.same_shell_route_change_continuity.bundle.workspaceContinuityEvidenceProjection
        .continuityTupleHash,
    ).toBe(rootBundle.workspaceContinuityEvidenceProjection.continuityTupleHash);

    expect(
      byScenario.trust_downgrade_protected_composition.bundle.protectedCompositionState.stateValidity,
    ).toBe("stale_recoverable");
    expect(
      byScenario.trust_downgrade_protected_composition.bundle.workspaceTrustEnvelope.mutationAuthorityState,
    ).toBe("frozen");

    expect(
      byScenario.anchor_repair_required.bundle.workspaceContinuityEvidenceProjection.blockingRefs,
    ).toContain("WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE");
    expect(
      byScenario.anchor_repair_required.bundle.workspaceTrustEnvelope.requiredRecoveryAction,
    ).toBe("repair_anchor");

    expect(
      byScenario.ownership_drift_reacquire_required.bundle.workspaceTrustEnvelope.requiredRecoveryAction,
    ).toBe("reacquire_lease");
    expect(
      byScenario.ownership_drift_reacquire_required.bundle.workspaceTrustEnvelope.envelopeState,
    ).toBe("recovery_required");
  });
});
