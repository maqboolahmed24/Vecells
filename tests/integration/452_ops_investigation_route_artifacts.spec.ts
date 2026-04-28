import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_INVESTIGATION_SCHEMA_VERSION,
  createOpsInvestigationFixture,
} from "../../apps/ops-console/src/operations-investigation-phase9.model";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("452 operations investigation artifacts", () => {
  it("publishes deterministic route contract and fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      routes: string[];
      requiredSurfaces: string[];
      automationAnchors: string[];
      routeContinuityProof: {
        preservedQuestionStableUnderDrift: boolean;
        drawerDeltaStateWhenStale: string;
      };
      graphAndExportProof: {
        normalGraphVerdict: string;
        normalExportState: string;
        staleGraphVerdict: string;
        staleExportState: string;
        blockedExportState: string;
      };
      auditExplorerProof: {
        eventCount: number;
        graphRowCount: number;
        breakGlassAuthorizedVisibility: boolean;
        supportReplayBlockedState: string;
      };
      noGapArtifactRequired: boolean;
    }>("data/contracts/452_phase9_ops_investigation_route_contract.json");
    const fixture = readJson<ReturnType<typeof createOpsInvestigationFixture>>(
      "data/fixtures/452_phase9_ops_investigation_route_fixtures.json",
    );
    const recomputed = createOpsInvestigationFixture();

    expect(contract.schemaVersion).toBe(OPS_INVESTIGATION_SCHEMA_VERSION);
    expect(contract.routes).toEqual(
      expect.arrayContaining([
        "/ops/overview/investigations/:opsRouteIntentId",
        "/ops/queues/investigations/:opsRouteIntentId",
        "/ops/audit",
      ]),
    );
    expect(contract.requiredSurfaces).toEqual(
      expect.arrayContaining([
        "InvestigationDrawer",
        "AuditExplorer",
        "TimelineLadder",
        "EvidenceGraphMiniMap",
        "BreakGlassReview",
        "SupportReplayBoundary",
        "InvestigationBundleExport",
      ]),
    );
    expect(contract.automationAnchors).toEqual(
      expect.arrayContaining([
        "investigation-drawer",
        "investigation-question",
        "timeline-ladder",
        "audit-explorer",
        "break-glass-review",
        "support-replay-boundary",
        "evidence-graph-mini-map",
        "safe-return-anchor",
      ]),
    );
    expect(contract.routeContinuityProof.preservedQuestionStableUnderDrift).toBe(true);
    expect(contract.routeContinuityProof.drawerDeltaStateWhenStale).toBe("drifted");
    expect(contract.graphAndExportProof.normalGraphVerdict).toBe("complete");
    expect(contract.graphAndExportProof.normalExportState).toBe("export_ready");
    expect(contract.graphAndExportProof.staleGraphVerdict).toBe("stale");
    expect(contract.graphAndExportProof.staleExportState).toBe("summary_only");
    expect(contract.graphAndExportProof.blockedExportState).toBe("blocked");
    expect(contract.auditExplorerProof.eventCount).toBe(4);
    expect(contract.auditExplorerProof.graphRowCount).toBe(3);
    expect(contract.auditExplorerProof.breakGlassAuthorizedVisibility).toBe(false);
    expect(contract.auditExplorerProof.supportReplayBlockedState).toBe("blocked");
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.scenarioProjections.audit.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.audit.normal.boardStateDigestRef,
    );
  });

  it("records investigation visual grammar and safety notes", () => {
    const notes = readText("data/analysis/452_ops_investigation_implementation_note.md");

    expect(notes).toContain("InvestigationDrawer");
    expect(notes).toContain("AuditExplorer");
    expect(notes).toContain("question hash");
    expect(notes).toContain("fails closed");
  });

  it("does not publish a task 452 investigation contract gap", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_452_INVESTIGATION_CONTRACTS.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
