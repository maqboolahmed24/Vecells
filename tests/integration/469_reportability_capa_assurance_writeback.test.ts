import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPhase9IncidentTenantGovernanceDependencyHygieneSuite,
  writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts,
} from "../../tools/test/run_phase9_incident_tenant_governance_dependency_hygiene";

const root = path.resolve(__dirname, "..", "..");
const forbiddenPayloadPattern =
  /https?:\/\/|Bearer|access_token|clinicalNarrative|patientNhs|nhsNumber|rawRouteParam|route-param:raw|artifact-fragment:raw|artifactFragment=|inlineSecret|secretRef|rawExportUrl/i;

function readJson<T>(relativePath: string): T {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    writePhase9IncidentTenantGovernanceDependencyHygieneArtifacts();
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as T;
}

function loadFixture() {
  return readJson<ReturnType<typeof buildPhase9IncidentTenantGovernanceDependencyHygieneSuite>["fixture"]>(
    "tests/fixtures/469_incident_tenant_hygiene_cases.json",
  );
}

describe("469 reportability, CAPA, and assurance writeback", () => {
  it("walks blocked, pending, superseded, and reported reportability decisions", () => {
    const fixture = loadFixture();
    const reportability = fixture.incidentCases.reportability;
    expect(reportability.blocked.decision).toBe("insufficient_facts_blocked");
    expect(reportability.pending.decision).toBe("reportable_pending_submission");
    expect(reportability.superseded.decision).toBe("superseded");
    expect(reportability.reported.decision).toBe("reported");
    expect(reportability.reported.supersedesAssessmentRef).toBe(reportability.pending.assessmentId);
    expect(reportability.localHandoff.handoffState).toBe("acknowledged");
    expect(reportability.localHandoff.assessmentRef).toBe(reportability.reported.assessmentId);
  });

  it("binds reported incidents and near misses to task 463 governed destinations", () => {
    const fixture = loadFixture();
    const reportability = fixture.incidentCases.reportability;
    expect(reportability.task463Destination.destinationClass).toBe(
      "reportable_data_security_incident_handoff",
    );
    expect(reportability.task463Destination.artifactPresentationContractRef).toBe(
      "ArtifactPresentationContract",
    );
    expect(reportability.task463Destination.outboundNavigationGrantPolicyRef).toBe(
      "OutboundNavigationGrant",
    );
    expect(reportability.task463Destination.secretMaterialInline).toBe(false);
    expect(reportability.task463Handoff.frameworkRef).toBe("DSPT");
    expect(reportability.task463Handoff.handoffState).toBe("verified");
    expect(reportability.nearMissDestination.destinationClass).toBe(
      "near_miss_learning_summary_destination",
    );
    expect(reportability.fakeReceiverRecords.every((record) => record.accepted)).toBe(true);
    expect(JSON.stringify(reportability.fakeReceiverRecords)).not.toMatch(forbiddenPayloadPattern);
  });

  it("writes PIR, CAPA, training drill, pack propagation, and ledger evidence", () => {
    const fixture = loadFixture();
    const postIncident = fixture.incidentCases.postIncident;
    expect(postIncident.completedReview.state).toBe("completed");
    expect(postIncident.completedReview.ownerRef).toMatch(/^actor:/);
    expect(postIncident.completedReview.capaRefs).toContain(
      postIncident.completedCapaAction.capaActionId,
    );
    expect(postIncident.completedCapaAction.status).toBe("completed");
    expect(postIncident.capaPropagation.evidenceGapRefs).toEqual(
      expect.arrayContaining(["gap:incident-follow-up:447"]),
    );
    expect(postIncident.trainingDrills.map((drill) => drill.sourceType).sort()).toEqual([
      "incident",
      "near_miss",
    ]);
    expect(postIncident.trainingDrills.flatMap((drill) => drill.followUpRefs).length).toBeGreaterThan(
      0,
    );
    expect(postIncident.assurancePackPropagation.incidentRefs).toContain(
      postIncident.completedReview.incidentRef,
    );
    expect(postIncident.assurancePackPropagation.graphEdgeRefs.length).toBeGreaterThan(0);
    expect(postIncident.ledgerWriteback.writtenAt).toMatch(/^2026-04-27/);
    expect(postIncident.ledgerWriteback.graphEdgeRefs).toEqual(
      expect.arrayContaining(postIncident.assurancePackPropagation.graphEdgeRefs),
    );
  });

  it("keeps incident telemetry summary-only and closes required coverage", () => {
    const fixture = loadFixture();
    const evidence = readJson<any>(
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
    );
    expect(fixture.incidentCases.redaction.permittedDisclosureClass).toBe("metadata_only");
    expect(fixture.incidentCases.redaction.redactedFields).toEqual(
      expect.arrayContaining([
        "incidentSummary",
        "patientIdentifier",
        "routeParams",
        "artifactFragment",
        "investigationKey",
      ]),
    );
    expect(JSON.stringify(fixture.incidentCases.redaction.safeTelemetryPayload)).not.toMatch(
      forbiddenPayloadPattern,
    );
    expect(evidence.coverage.reportabilityDecisionAndHandoff).toBe(true);
    expect(evidence.coverage.incidentToAssurancePackPropagation).toBe(true);
    expect(evidence.gapClosures.reportabilityHandoffGap).toBe(true);
  });
});
