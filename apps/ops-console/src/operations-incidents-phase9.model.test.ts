import { describe, expect, it } from "vitest";
import {
  createOpsIncidentsFixture,
  createOpsIncidentsProjection,
} from "./operations-incidents-phase9.model";

describe("operations incidents Phase 9 projection", () => {
  it("binds incident desk surfaces to task 447 reportability workflow", () => {
    const projection = createOpsIncidentsProjection({ scenarioState: "normal" });

    expect(projection.route).toBe("/ops/incidents");
    expect(projection.runtimeBinding.incidentWorkflowVersion).toBe(
      "447.phase9.incident-reportability-workflow.v1",
    );
    expect(projection.commandStrip.openIncidentCount).toBeGreaterThanOrEqual(2);
    expect(projection.reportabilityChecklist.decision).toBe("reported");
    expect(projection.externalReportingHandoff.handoffState).toBe("acknowledged");
    expect(projection.pirPanel.closureState).toBe("blocked");
  });

  it("keeps insufficient facts and pending submission states distinct", () => {
    const blocked = createOpsIncidentsProjection({ scenarioState: "blocked" });
    const pending = createOpsIncidentsProjection({ scenarioState: "settlement_pending" });

    expect(blocked.reportabilityChecklist.decision).toBe("insufficient_facts_blocked");
    expect(blocked.actionRail.every((action) => action.allowed === false)).toBe(true);
    expect(pending.reportabilityChecklist.decision).toBe("reportable_pending_submission");
    expect(pending.containmentTimeline.some((event) => event.state === "pending")).toBe(true);
  });

  it("publishes redaction fence metadata and no gap artifact requirement inputs", () => {
    const projection = createOpsIncidentsProjection({ scenarioState: "normal" });

    expect(projection.telemetryRedaction.permittedPayloadClass).toBe("metadata_only");
    expect(projection.telemetryRedaction.redactedFields).toEqual([
      "incidentSummary",
      "patientIdentifier",
      "routeParams",
      "artifactFragment",
      "investigationKey",
    ]);
    expect(projection.upstreamSchemaVersions["447"]).toBe(
      "447.phase9.incident-reportability-workflow.v1",
    );
  });

  it("creates deterministic fixture coverage for every incident scenario", () => {
    const fixture = createOpsIncidentsFixture();

    expect(Object.keys(fixture.scenarioProjections)).toEqual(
      expect.arrayContaining([
        "normal",
        "empty",
        "stale",
        "degraded",
        "blocked",
        "permission_denied",
        "settlement_pending",
      ]),
    );
    expect(fixture.scenarioProjections.permission_denied.runtimeBinding.artifactState).toBe(
      "summary_only",
    );
    expect(fixture.scenarioProjections.empty.incidentQueue).toHaveLength(0);
  });
});
