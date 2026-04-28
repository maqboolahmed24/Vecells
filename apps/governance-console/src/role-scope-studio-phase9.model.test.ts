import { describe, expect, it } from "vitest";
import {
  ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
  createRoleScopeStudioFixture,
  createRoleScopeStudioProjection,
  normalizeRoleScopeStudioScenarioState,
} from "./role-scope-studio-phase9.model";

describe("458 role scope studio model", () => {
  it("normalizes all supported scenario aliases", () => {
    expect(normalizeRoleScopeStudioScenarioState("permission-denied")).toBe("permission_denied");
    expect(normalizeRoleScopeStudioScenarioState("settlement-pending")).toBe("settlement_pending");
    expect(normalizeRoleScopeStudioScenarioState("unknown")).toBe("normal");
  });

  it("publishes required nested projections and gap artifact", () => {
    const projection = createRoleScopeStudioProjection();

    expect(projection.schemaVersion).toBe("458.phase9.governance-role-scope-studio.v1");
    expect(projection.visualMode).toBe("Role_Scope_Proof_Studio");
    expect(projection.gapArtifactRef).toBe(ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF);
    expect(projection.governanceScopeRibbon.governanceScopeTokenRef).toContain(
      "GovernanceScopeToken",
    );
    expect(projection.roleGrantMatrix.capabilityColumns).toHaveLength(7);
    expect(projection.releaseFreezeCards).toHaveLength(6);
    expect(projection.telemetryDisclosureFence.rawSensitiveTextAbsent).toBe(true);
  });

  it("keeps navigation separate from authorization", () => {
    const projection = createRoleScopeStudioProjection();

    for (const row of projection.roleGrantMatrix.rows) {
      for (const cell of row.cells) {
        expect(cell.authorityRef).toBe("phase5-acting-context-visibility-kernel");
        expect(cell.mutableControlState).toBe("not_mutable_in_preview");
      }
    }
    expect(
      projection.actionRail.find((action) => action.actionType === "approve_role")?.allowed,
    ).toBe(false);
    expect(
      projection.actionRail.find((action) => action.actionType === "export_preview")?.allowed,
    ).toBe(false);
  });

  it("distinguishes frozen, stale, masked, and permission-denied previews", () => {
    const frozen = createRoleScopeStudioProjection({ scenarioState: "frozen" });
    const stale = createRoleScopeStudioProjection({ scenarioState: "stale" });
    const masked = createRoleScopeStudioProjection({ scenarioState: "masked" });
    const denied = createRoleScopeStudioProjection({ scenarioState: "permission_denied" });

    expect(
      frozen.roleGrantMatrix.rows.every((row) =>
        row.cells
          .filter((cell) => ["export", "approval", "admin"].includes(cell.columnRef))
          .every((cell) => cell.state === "frozen"),
      ),
    ).toBe(true);
    expect(stale.effectiveAccessPreview.previewState).toBe("stale");
    expect(masked.accessPreviewArtifactMask.telemetryRedacted).toBe(true);
    expect(denied.effectiveAccessPreview.decision).toBe("deny");
    expect(denied.effectiveAccessPreview.artifactMode).toBe("metadata_only");
  });

  it("covers every required fixture state", () => {
    const fixture = createRoleScopeStudioFixture();

    expect(Object.keys(fixture.scenarioProjections).sort()).toEqual([
      "blocked",
      "degraded",
      "empty",
      "frozen",
      "masked",
      "normal",
      "permission_denied",
      "settlement_pending",
      "stale",
    ]);
  });
});
