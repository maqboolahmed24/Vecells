import { describe, expect, it } from "vitest";
import { createRoleScopeStudioProjection } from "../../apps/governance-console/src/role-scope-studio-phase9.model";

describe("458 role scope studio projection contract", () => {
  it("binds selected route family to the access preview object type", () => {
    const projection = createRoleScopeStudioProjection({
      selectedRouteFamilyRef: "route-family:incident-command",
      selectedPersonaRef: "persona:incident-commander",
    });

    expect(projection.roleGrantMatrix.selectedRouteFamilyRef).toBe("route-family:incident-command");
    expect(projection.effectiveAccessPreview.objectTypeRef).toBe("incident_review");
    expect(projection.breakGlassElevationSummary.reviewState).toBe("active");
    expect(projection.breakGlassElevationSummary.reasonAdequacyState).toBe("adequate");
  });

  it("keeps audience-tier and tenant isolation visible", () => {
    const projection = createRoleScopeStudioProjection();

    expect(projection.governanceScopeRibbon.tenantRef).toBe("tenant:north-river-ics");
    expect(projection.governanceScopeRibbon.organisationRef).toBe(
      "organisation:north-river-governance",
    );
    expect(
      projection.roleGrantMatrix.rows.every((row) =>
        row.audienceTierRef.startsWith("audience-tier:"),
      ),
    ).toBe(true);
  });

  it("redacts telemetry and never admits outbound artifact export", () => {
    const projection = createRoleScopeStudioProjection({ scenarioState: "masked" });

    expect(projection.accessPreviewArtifactMask.syntheticFixtureOnly).toBe(true);
    expect(projection.accessPreviewArtifactMask.hiddenFieldsNotRendered).toBe(true);
    expect(projection.accessPreviewArtifactMask.telemetryRedacted).toBe(true);
    expect(
      projection.actionRail.find((action) => action.actionType === "export_preview")?.allowed,
    ).toBe(false);
    expect(projection.telemetryDisclosureFence.allowedPayloadKeys).toEqual([
      "routeFamilyRef",
      "personaRef",
      "scopeTupleHash",
      "redactionClass",
    ]);
  });

  it("explains denied actions with source object, predicate, consequence, and next step", () => {
    const projection = createRoleScopeStudioProjection();

    expect(projection.deniedActionExplainers).toHaveLength(3);
    for (const explainer of projection.deniedActionExplainers) {
      expect(explainer.sourceObjectRef.length).toBeGreaterThan(0);
      expect(explainer.failedPredicate.length).toBeGreaterThan(0);
      expect(explainer.consequence.length).toBeGreaterThan(0);
      expect(explainer.nextSafeAction.length).toBeGreaterThan(0);
    }
  });
});
