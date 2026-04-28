import { describe, expect, it } from "vitest";
import {
  createOpsIncidentsFixture,
  createOpsIncidentsProjection,
} from "../../apps/ops-console/src/operations-incidents-phase9.model";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
} from "../../apps/ops-console/src/operations-shell-seed.model";

describe("456 operations incidents route contracts", () => {
  it("renders required incident desk proof surfaces", () => {
    const projection = createOpsIncidentsProjection({ scenarioState: "normal" });

    expect(projection.route).toBe("/ops/incidents");
    expect(projection.automationAnchors).toEqual(
      expect.arrayContaining([
        "incident-desk",
        "incident-command-strip",
        "incident-queue",
        "near-miss-intake",
        "severity-board",
        "containment-timeline",
        "reportability-checklist",
        "pir-panel",
        "incident-capa-links",
        "incident-evidence-links",
      ]),
    );
    expect(projection.incidentQueue.length).toBeGreaterThanOrEqual(3);
    expect(projection.severityBoard.evidencePreservationState).toBe("preserved");
  });

  it("keeps reportability closure and containment settlement-bound", () => {
    const normal = createOpsIncidentsProjection({ scenarioState: "normal" });
    const blocked = createOpsIncidentsProjection({ scenarioState: "blocked" });
    const pending = createOpsIncidentsProjection({ scenarioState: "settlement_pending" });

    expect(normal.reportabilityChecklist.decision).toBe("reported");
    expect(normal.pirPanel.closureState).toBe("blocked");
    expect(normal.actionRail.find((action) => action.actionType === "close_review")?.allowed).toBe(
      false,
    );
    expect(blocked.reportabilityChecklist.decision).toBe("insufficient_facts_blocked");
    expect(blocked.containmentTimeline.some((event) => event.state === "failed")).toBe(true);
    expect(pending.reportabilityChecklist.decision).toBe("reportable_pending_submission");
  });

  it("preserves incident projection through the operations shell", () => {
    const snapshot = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/incidents"), 1440);

    expect(snapshot.incidentsProjection.route).toBe("/ops/incidents");
    expect(snapshot.incidentsProjection.runtimeBinding.routeFamilyRef).toBe("/ops/incidents");
    expect(snapshot.incidentsProjection.boardTupleHash).toContain("ops-incidents-board-tuple-456");
    expect(snapshot.frameMode).toBe("three_plane");
  });

  it("publishes deterministic fixture coverage", () => {
    const fixture = createOpsIncidentsFixture();

    expect(fixture.scenarioProjections.normal.externalReportingHandoff.handoffState).toBe(
      "acknowledged",
    );
    expect(fixture.scenarioProjections.empty.incidentQueue).toHaveLength(0);
    expect(
      fixture.scenarioProjections.permission_denied.telemetryRedaction.redactedFields,
    ).toContain("patientIdentifier");
  });
});
