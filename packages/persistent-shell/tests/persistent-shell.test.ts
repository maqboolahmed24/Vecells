import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PersistentShellApp,
  createContinuityCarryForwardPlan,
  createContinuityRestorePlan,
  createPersistentShellSimulationHarness,
  getPersistentShellRouteClaim,
  getPersistentShellSpec,
  getPersistentShellRuntimeBinding,
  listPersistentShellSpecs,
  resolvePersistentShellProfile,
  resolveShellBoundaryDecision,
} from "../src/index";

describe("persistent shell framework", () => {
  it("publishes every primary shell family plus the existing support extension", () => {
    const slugs = listPersistentShellSpecs().map((shell) => shell.shellSlug);
    expect(slugs).toEqual([
      "patient-web",
      "clinical-workspace",
      "support-workspace",
      "ops-console",
      "hub-desk",
      "governance-console",
      "pharmacy-console",
    ]);
  });

  it("resolves patient-shell route residency and same-shell morph decisions", () => {
    const boundary = resolveShellBoundaryDecision({
      currentRouteFamilyRef: "rf_patient_requests",
      candidateRouteFamilyRef: "rf_intake_self_service",
      runtimeScenario: "live",
    });

    expect(boundary.boundaryState).toBe("morph_child_surface");
    expect(boundary.checkpoint.transitionState).toBe("morph_in_place");
    expect(boundary.runtimeDecision.effectiveBrowserPosture).toBe("live");
  });

  it("fails closed to read-only preserve when runtime posture drifts", () => {
    const boundary = resolveShellBoundaryDecision({
      currentRouteFamilyRef: "rf_staff_workspace",
      candidateRouteFamilyRef: "rf_staff_workspace_child",
      runtimeScenario: "read_only",
    });
    const carryForward = createContinuityCarryForwardPlan(boundary);

    expect(boundary.boundaryState).toBe("preserve_shell_read_only");
    expect(carryForward.selectedAnchorDisposition).toBe("freeze");
    expect(carryForward.preserveDecisionDock).toBe(true);
  });

  it("keeps mission stack as a fold of the same shell", () => {
    const profile = resolvePersistentShellProfile("clinical-workspace", {
      breakpointClass: "compact",
      routeFamilyRef: "rf_staff_workspace_child",
    });
    expect(profile.topology).toBe("mission_stack");
  });

  it("builds restore plans with stable local continuity storage keys", () => {
    const restorePlan = createContinuityRestorePlan({
      shellSlug: "hub-desk",
      routeFamilyRef: "rf_hub_case_management",
      selectedAnchor: "hub-candidate",
      foldState: "folded",
      runtimeScenario: "stale_review",
    });

    expect(restorePlan.restoreStorageKey).toBe("persistent-shell::hub-desk");
    expect(restorePlan.foldState).toBe("folded");
    expect(restorePlan.returnRouteFamilyRef).toBe("rf_hub_case_management");
  });

  it("creates runtime bindings from the shared browser runtime governor", () => {
    const binding = getPersistentShellRuntimeBinding(
      "ops-console",
      "rf_operations_board",
      "recovery_only",
    );

    expect(binding.runtimeDecision.effectiveBrowserPosture).toBe("recovery_only");
    expect(binding.releasePosture.owner).toBe("operations");
  });

  it("renders each shell specimen from the shared React framework", () => {
    for (const shell of listPersistentShellSpecs()) {
      const firstRoute = shell.routeClaims[0];
      expect(firstRoute).toBeDefined();
      if (!firstRoute) {
        continue;
      }
      const markup = renderToStaticMarkup(
        createElement(PersistentShellApp, { shellSlug: shell.shellSlug }),
      );
      expect(markup).toContain(`${shell.shellSlug}-shell-root`);
      expect(markup).toContain(shell.shellTitle);
      expect(markup).toContain(firstRoute.dominantActionLabel);
      expect(markup).toContain("persistent-shell__brand-mark");
      expect(markup).toContain('viewBox="35 49 889 232"');
    }
  });

  it("simulates shell reuse and preserves continuity within the harness", () => {
    const harness = createPersistentShellSimulationHarness("patient-web");
    const firstRoute = harness.currentRoute.routeFamilyRef;
    const result = harness.transitionTo("rf_patient_messages", "live");

    expect(firstRoute).toBe("rf_patient_home");
    expect(result.boundaryDecision.boundaryState).toBe("morph_child_surface");
    expect(result.carryForwardPlan.preserveSelectedAnchor).toBe(true);
    expect(result.restorePlan.restoreStorageKey).toBe("persistent-shell::patient-web");
  });

  it("publishes ownership and residency information for the active shell", () => {
    const shell = getPersistentShellSpec("governance-console");
    const route = getPersistentShellRouteClaim("rf_governance_shell");

    expect(shell.ownership.ownershipContractId).toBe("SFOC_106_GOVERNANCE_V1");
    expect(route.shellSlug).toBe("governance-console");
    expect(route.residency).toBe("resident_root");
  });
});
