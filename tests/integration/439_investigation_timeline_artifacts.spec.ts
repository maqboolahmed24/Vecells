import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  createPhase9InvestigationTimelineFixture,
  type Phase9InvestigationTimelineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("439 Phase 9 investigation timeline artifacts", () => {
  it("publishes investigation timeline contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      deterministicReplay: {
        baselineTimelineHash: string;
        supportReplayTimelineHash: string;
      };
    }>("data/contracts/439_phase9_investigation_timeline_service_contract.json");
    const fixture = readJson<Phase9InvestigationTimelineFixture>(
      "data/fixtures/439_phase9_investigation_timeline_service_fixtures.json",
    );
    const recomputed = createPhase9InvestigationTimelineFixture();

    expect(contract.schemaVersion).toBe(PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "InvestigationScopeEnvelope",
        "AuditQuerySession",
        "InvestigationTimelineReconstruction",
        "SupportReplaySession",
        "DataSubjectTrace",
      ]),
    );
    expect(contract.deterministicReplay.baselineTimelineHash).toBe(
      contract.deterministicReplay.supportReplayTimelineHash,
    );
    expect(fixture.baselineResult.timelineReconstruction.timelineHash).toBe(
      recomputed.baselineResult.timelineReconstruction.timelineHash,
    );
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("records mandatory scope envelope and audit session fields", () => {
    const contract = readJson<{
      scopeEnvelopeFields: string[];
      auditQuerySessionFields: string[];
    }>("data/contracts/439_phase9_investigation_timeline_service_contract.json");

    expect(contract.scopeEnvelopeFields).toEqual(
      expect.arrayContaining([
        "originAudienceSurface",
        "purposeOfUse",
        "actingContextRef",
        "maskingPolicyRef",
        "visibilityCoverageRefs",
        "scopeEntityRefs",
        "selectedAnchorTupleHashRef",
        "investigationQuestionHash",
        "scopeHash",
      ]),
    );
    expect(contract.auditQuerySessionFields).toEqual(
      expect.arrayContaining([
        "filtersRef",
        "coverageState",
        "causalityState",
        "baseLedgerWatermarkRef",
        "reconstructionInputHash",
        "timelineHash",
        "graphHash",
      ]),
    );
  });

  it("stores fail-closed scenarios for graph visibility break-glass and export policy", () => {
    const fixture = readJson<Phase9InvestigationTimelineFixture>(
      "data/fixtures/439_phase9_investigation_timeline_service_fixtures.json",
    );

    expect(fixture.missingGraphVerdictResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.orphanGraphEdgeResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.visibilityGapResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.breakGlassAbsentResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.breakGlassExpiredResult.auditQuerySession.coverageState).toBe("blocked");
    expect(fixture.exportDeniedPreview.previewState).toBe("denied");
  });

  it("materializes access index data subject trace and read audit records", () => {
    const fixture = readJson<Phase9InvestigationTimelineFixture>(
      "data/fixtures/439_phase9_investigation_timeline_service_fixtures.json",
    );
    const result = fixture.baselineResult;

    expect(result.accessEventIndex.length).toBe(result.returnedAuditRecords.length);
    expect(result.dataSubjectTrace.timelineReconstructionRef).toBe(
      result.timelineReconstruction.investigationTimelineReconstructionId,
    );
    expect(result.dataSubjectTrace.traceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.privilegedReadAuditRecords.length).toBeGreaterThanOrEqual(
      result.returnedAuditRecords.length + 1,
    );
  });

  it("stores operator-readable summary alignment notes and no gap artifact", () => {
    const summary = readText("data/analysis/439_phase9_investigation_timeline_service_summary.md");
    const notes = readText("data/analysis/439_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/439_investigation_timeline_source_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_439_INVESTIGATION_TIMELINE_SOURCES.json",
    );

    expect(summary).toContain("Scope envelope");
    expect(summary).toContain("Timeline hash");
    expect(notes).toContain("InvestigationScopeEnvelope is issued before any sensitive audit search");
    expect(matrix).toContain("AssuranceLedgerEntry");
    expect(matrix).toContain("OutboundNavigationGrant");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
