import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
  selectOpsHealthCell,
} from "./operations-shell-seed.model";
import {
  OPS_OVERVIEW_SCHEMA_VERSION,
  createOpsOverviewFixture,
  createOpsOverviewProjection,
  normalizeOpsOverviewScenarioState,
} from "./operations-overview-phase9.model";

describe("task 450 operations overview projection", () => {
  it("normalizes route scenario aliases", () => {
    expect(normalizeOpsOverviewScenarioState("stable")).toBe("stable_service");
    expect(normalizeOpsOverviewScenarioState("permission-denied")).toBe("permission_denied");
    expect(normalizeOpsOverviewScenarioState("settlement-pending")).toBe("settlement_pending");
    expect(normalizeOpsOverviewScenarioState("unknown")).toBe("normal");
  });

  it("publishes stable-service digest without hiding fail-closed states", () => {
    const stable = createOpsOverviewProjection("stable_service");
    const quarantined = createOpsOverviewProjection("quarantined");

    expect(stable.stableServiceDigest?.topHealthySignals).toHaveLength(3);
    expect(stable.serviceHealth.every((cell) => cell.blockerCount === 0)).toBe(true);
    expect(quarantined.stableServiceDigest).toBeNull();
    expect(quarantined.freshnessStrip.trustState).toBe("quarantined");
    expect(
      quarantined.serviceHealth.some(
        (cell) =>
          cell.requiredTrustState === "quarantined" &&
          cell.blockingNamespaceRefs.includes("comms.delivery.receipt"),
      ),
    ).toBe(true);
  });

  it("binds shell continuity, digest, health selection, and return token into the snapshot", () => {
    const state = createInitialOpsShellState("/ops/overview", {
      overviewState: "freeze",
      selectedHealthCellRef: "svc_notification",
    });
    const snapshot = resolveOpsBoardSnapshot(state, 1440);

    expect(snapshot.shellContinuityKey).toContain("operations:");
    expect(snapshot.boardStateDigestRef).toContain("FREEZE");
    expect(snapshot.selectedHealthCellRef).toBe("svc_notification");
    expect(snapshot.returnToken?.selectedHealthCellRef).toBe("svc_notification");
    expect(snapshot.returnToken?.boardTupleHash).toBe(snapshot.boardTupleHash);
    expect(snapshot.freshnessStrip.freezeState).toBe("release_freeze");
    expect(snapshot.workbenchState).toBe("observe_only");
  });

  it("selecting a health cell creates a new digest-bound selection lease", () => {
    const state = createInitialOpsShellState("/ops/overview");
    const selected = selectOpsHealthCell(state, "svc_notification");
    const snapshot = resolveOpsBoardSnapshot(selected, 1440);

    expect(snapshot.selectedHealthCellRef).toBe("svc_notification");
    expect(snapshot.selectionLease.selectedHealthCellRef).toBe("svc_notification");
    expect(snapshot.selectionLease.selectedHealthCellTupleHash).toContain("svc_notification");
    expect(snapshot.boardStateDigestRef).toContain("SVC_NOTIFICATION");
  });

  it("publishes all task 450 scenario fixtures deterministically", () => {
    const fixture = createOpsOverviewFixture();
    const recomputed = createOpsOverviewFixture();

    expect(fixture.schemaVersion).toBe(OPS_OVERVIEW_SCHEMA_VERSION);
    expect(Object.keys(fixture.scenarioProjections)).toEqual(
      expect.arrayContaining([
        "normal",
        "stable_service",
        "empty",
        "stale",
        "degraded",
        "quarantined",
        "blocked",
        "permission_denied",
        "freeze",
        "settlement_pending",
      ]),
    );
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
    expect(fixture.automationAnchors).toEqual(
      expect.arrayContaining([
        "ops-overview",
        "north-star-band",
        "service-health-grid",
        "ops-freshness-strip",
        "ops-stable-service-digest",
        "ops-health-cell",
        "ops-return-token-target",
      ]),
    );
  });
});
