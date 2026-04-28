import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_469_SCHEMA_VERSION,
  buildPhase9IncidentTenantGovernanceDependencyHygieneSuite,
  writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts,
} from "../../tools/test/run_phase9_incident_tenant_governance_dependency_hygiene";

const root = path.resolve(__dirname, "..", "..");

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/469_incident_tenant_hygiene_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9IncidentTenantGovernanceDependencyHygieneSuite
  >["fixture"];
}

describe("469 incident workflow contract", () => {
  it("covers telemetry, operator, and near-miss incident intake paths", () => {
    const fixture = loadFixture();
    expect(fixture.schemaVersion).toBe(PHASE9_469_SCHEMA_VERSION);
    expect(fixture.incidentCases.detectionSources.map((row) => row.detectionSource).sort()).toEqual(
      ["near_miss", "operator_report", "telemetry"],
    );
    expect(fixture.incidentCases.detectionSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ caseId: "telemetry-detected-incident", severity: "sev3" }),
        expect.objectContaining({ caseId: "operator-reported-incident", severity: "sev2" }),
        expect.objectContaining({
          caseId: "near-miss-report",
          detectionSource: "near_miss",
          justCultureState: "first_class_learning_record",
          breachClassificationState: "not_immediately_classified_as_breach",
        }),
      ]),
    );
  });

  it("preserves severity triage, impact scope, and investigation evidence links", () => {
    const fixture = loadFixture();
    const triage = fixture.incidentCases.severityTriage;
    expect(triage.severity).toBe("sev1");
    expect(triage.status).toBe("triaged");
    expect(triage.impactScope).toMatch(/^scope:/);
    expect(triage.affectedDataRefs.length).toBeGreaterThan(0);
    expect(triage.affectedSystemRefs.length).toBeGreaterThan(0);

    const evidence = fixture.incidentCases.evidencePreservation;
    expect(evidence.timelineIntegrityState).toBe("exact");
    expect(evidence.timelineRef).toMatch(/^itrec_/);
    expect(evidence.investigationGraphRef).toMatch(/^aegs_/);
    expect(evidence.preservedEvidenceRefs).toEqual(
      expect.arrayContaining(["preserved-evidence:447:graph-cut"]),
    );
  });

  it("blocks unsafe containment, settles preserved actions, and keeps replay idempotent", () => {
    const fixture = loadFixture();
    const containment = fixture.incidentCases.containment;
    expect(containment.blockedBeforeEvidence.resultState).toBe("blocked");
    expect(containment.blockedBeforeEvidence.evidencePreservedBeforeAction).toBe(false);
    expect(containment.blockedBeforeEvidence.blockerRefs).toContain(
      "containment:evidence-preservation-required",
    );
    expect(containment.completed.resultState).toBe("settled");
    expect(containment.completed.evidencePreservedBeforeAction).toBe(true);
    expect(containment.completed.evidenceRefs.length).toBeGreaterThan(0);
    expect(containment.replay.idempotencyDecision).toBe("exact_replay");
    expect(containment.replay.containmentActionId).toBe(containment.completed.containmentActionId);
  });
});
