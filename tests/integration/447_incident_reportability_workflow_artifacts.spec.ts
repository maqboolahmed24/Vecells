import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  createPhase9IncidentReportabilityWorkflowFixture,
  type Phase9IncidentReportabilityWorkflowFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("447 Phase 9 incident reportability workflow artifacts", () => {
  it("publishes incident workflow contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: { replayHash: string };
      incidentAuthority: { containmentReplayDecision: string };
      noGapArtifactRequired: boolean;
    }>("data/contracts/447_phase9_incident_reportability_workflow_contract.json");
    const fixture = readJson<Phase9IncidentReportabilityWorkflowFixture>(
      "data/fixtures/447_phase9_incident_reportability_workflow_fixtures.json",
    );
    const recomputed = createPhase9IncidentReportabilityWorkflowFixture();

    expect(contract.schemaVersion).toBe(PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "SecurityIncident",
        "NearMissReport",
        "ReportabilityAssessment",
        "ContainmentAction",
        "PostIncidentReview",
        "TrainingDrillRecord",
        "IncidentWorkflowLedgerWriteback",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "createIncident",
        "createNearMiss",
        "runReportabilityAssessment",
        "createCapaFromIncident",
        "writeIncidentLedgerEvidence",
      ]),
    );
    expect(contract.incidentAuthority.containmentReplayDecision).toBe("exact_replay");
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.replayHash).toBe(recomputed.replayHash);
    expect(contract.deterministicReplay.replayHash).toBe(fixture.replayHash);
  });

  it("stores incident queue matrix reportability register and runbook notes", () => {
    const summary = readText("data/analysis/447_phase9_incident_reportability_workflow_summary.md");
    const notes = readText("data/analysis/447_algorithm_alignment_notes.md");
    const queueMatrix = readText("data/analysis/447_incident_queue_matrix.csv");
    const register = readText("data/analysis/447_reportability_and_capa_register.csv");

    expect(summary).toContain("Near miss retained as first-class report");
    expect(notes).toContain("Post-incident review blocks closure");
    expect(queueMatrix).toContain("blocked_containment_before_evidence");
    expect(queueMatrix).toContain("completed_review");
    expect(register).toContain("reported");
  });

  it("does not publish a CAPA workflow gap artifact because task 441 is available", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_447_CAPA_WORKFLOW.json",
    );
    const fixture = readJson<Phase9IncidentReportabilityWorkflowFixture>(
      "data/fixtures/447_phase9_incident_reportability_workflow_fixtures.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
    expect(fixture.upstreamCapaSchemaVersion).toBe("441.phase9.capa-attestation-workflow.v1");
    expect(fixture.capaPropagation.capaAction.sourceRef).toBe(
      fixture.evidencePreservedIncident.securityIncidentId,
    );
  });
});
