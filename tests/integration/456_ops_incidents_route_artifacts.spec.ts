import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_INCIDENTS_SCHEMA_VERSION,
  createOpsIncidentsFixture,
} from "../../apps/ops-console/src/operations-incidents-phase9.model";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("456 operations incidents artifacts", () => {
  it("publishes deterministic route contract and fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      routes: string[];
      requiredSurfaces: string[];
      automationAnchors: string[];
      reportabilityAuthority: {
        normalDecision: string;
        pendingDecision: string;
        blockedDecision: string;
        staleDecision: string;
      };
      containmentAuthority: {
        normalStates: string[];
        pendingStates: string[];
        blockedStates: string[];
      };
      closureAuthority: {
        normalClosureState: string;
        normalClosureBlockers: string[];
        emptyClosureState: string;
      };
      redactionAuthority: {
        permittedPayloadClass: string;
        redactedFields: string[];
      };
      noGapArtifactRequired: boolean;
    }>("data/contracts/456_phase9_ops_incidents_route_contract.json");
    const fixture = readJson<ReturnType<typeof createOpsIncidentsFixture>>(
      "data/fixtures/456_phase9_ops_incidents_route_fixtures.json",
    );
    const recomputed = createOpsIncidentsFixture();

    expect(contract.schemaVersion).toBe(OPS_INCIDENTS_SCHEMA_VERSION);
    expect(contract.routes).toContain("/ops/incidents");
    expect(contract.requiredSurfaces).toEqual(
      expect.arrayContaining([
        "IncidentDesk",
        "IncidentQueue",
        "NearMissIntake",
        "SeverityBoard",
        "ReportabilityChecklist",
        "PostIncidentReview",
        "IncidentEvidenceLinks",
      ]),
    );
    expect(contract.automationAnchors).toEqual(
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
    expect(contract.reportabilityAuthority.normalDecision).toBe("reported");
    expect(contract.reportabilityAuthority.pendingDecision).toBe("reportable_pending_submission");
    expect(contract.reportabilityAuthority.blockedDecision).toBe("insufficient_facts_blocked");
    expect(contract.reportabilityAuthority.staleDecision).toBe("superseded");
    expect(contract.containmentAuthority.normalStates).toContain("applied");
    expect(contract.containmentAuthority.pendingStates).toContain("pending");
    expect(contract.containmentAuthority.blockedStates).toContain("failed");
    expect(contract.closureAuthority.normalClosureState).toBe("blocked");
    expect(contract.closureAuthority.normalClosureBlockers).toContain(
      "capa:training-drill-pending",
    );
    expect(contract.closureAuthority.emptyClosureState).toBe("complete");
    expect(contract.redactionAuthority.permittedPayloadClass).toBe("metadata_only");
    expect(contract.redactionAuthority.redactedFields).toEqual(
      expect.arrayContaining([
        "incidentSummary",
        "patientIdentifier",
        "routeParams",
        "artifactFragment",
        "investigationKey",
      ]),
    );
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
  });

  it("records task 456 implementation notes", () => {
    const notes = readText("data/analysis/456_ops_incidents_implementation_note.md");

    expect(notes).toContain("Incident Desk");
    expect(notes).toContain("near-miss");
    expect(notes).toContain("UIEventEnvelope");
    expect(notes).toContain(
      "no `PHASE9_BATCH_443_457_INTERFACE_GAP_456_REPORTABILITY_INPUTS.json`",
    );
  });

  it("does not publish a task 456 reportability input gap artifact", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_456_REPORTABILITY_INPUTS.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
