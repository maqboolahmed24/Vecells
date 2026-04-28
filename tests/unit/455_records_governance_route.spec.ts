import { describe, expect, it } from "vitest";
import {
  createRecordsGovernanceFixture,
  createRecordsGovernanceProjection,
  recordsGovernanceAutomationAnchors,
} from "../../apps/governance-console/src/records-governance-phase9.model";

describe("455 records governance route contract", () => {
  it("publishes mandatory automation anchors and upstream schema versions", () => {
    const fixture = createRecordsGovernanceFixture();

    expect(fixture.upstreamSchemaVersions["442"]).toBe("442.phase9.retention-lifecycle-engine.v1");
    expect(fixture.upstreamSchemaVersions["443"]).toBe(
      "443.phase9.disposition-execution-engine.v1",
    );
    expect(fixture.automationAnchors).toEqual(recordsGovernanceAutomationAnchors);
  });

  it("covers required scenario states without creating raw batch candidates", () => {
    const fixture = createRecordsGovernanceFixture();

    expect(Object.keys(fixture.scenarioProjections).sort()).toEqual([
      "blocked",
      "degraded",
      "empty",
      "normal",
      "permission_denied",
      "settlement_pending",
      "stale",
    ]);
    expect(
      Object.values(fixture.scenarioProjections).every((projection) =>
        projection.lifecycleLedgerRows.every((row) => row.rawBatchCandidate === false),
      ),
    ).toBe(true);
  });

  it("uses current DispositionEligibilityAssessment rows as disposition admission basis", () => {
    const projection = createRecordsGovernanceProjection({
      routePath: "/ops/governance/records/disposition",
      selectedObjectId: "records-disposition-31",
    });

    expect(projection.dispositionJobs.length).toBeGreaterThan(0);
    expect(
      projection.dispositionJobs.every((job) => job.admissionBasis === "current_assessment"),
    ).toBe(true);
    expect(
      projection.dispositionJobs
        .flatMap((job) => job.candidateAssessmentRefs)
        .every((ref) => ref.startsWith("dea_442")),
    ).toBe(true);
  });

  it("pins hold and freeze scope hashes in hold review", () => {
    const projection = createRecordsGovernanceProjection({
      routePath: "/ops/governance/records/holds",
      selectedObjectId: "records-hold-09",
    });

    expect(projection.holdScopeReview?.scopeHash).toContain("scopehashh09");
    expect(projection.holdScopeReview?.freezeScopeHash).toContain("freezescopeh09");
    expect(projection.holdScopeReview?.blockerRefs).toContain(
      "superseding-assessment:required-before-delete",
    );
  });
});
