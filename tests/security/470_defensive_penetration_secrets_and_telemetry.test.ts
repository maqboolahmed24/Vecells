import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPhase9FullRegressionAndDefensiveSecuritySuite,
  writePhase9FullRegressionAndDefensiveSecurityArtifacts,
} from "../../tools/testing/run_470_full_regression_and_defensive_security";

const root = path.resolve(__dirname, "..", "..");
const forbiddenSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawIncidentDetail|rawRouteParam|route-param:raw|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|secretRef|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/470_cross_phase_synthetic_programme_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9FullRegressionAndDefensiveSecuritySuite
  >["fixture"];
}

function loadEvidence() {
  const evidencePath = path.join(
    root,
    "data/evidence/470_full_regression_and_defensive_security_results.json",
  );
  if (!fs.existsSync(evidencePath)) {
    writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  }
  return JSON.parse(fs.readFileSync(evidencePath, "utf8")) as ReturnType<
    typeof buildPhase9FullRegressionAndDefensiveSecuritySuite
  >["evidence"];
}

describe("470 defensive secrets and telemetry penetration cases", () => {
  it("keeps fixture and evidence artifacts free of secret, PHI, raw-route, blob, and trace markers", () => {
    const fixture = loadFixture();
    const evidence = loadEvidence();
    expect(JSON.stringify(fixture)).not.toMatch(forbiddenSensitivePattern);
    expect(JSON.stringify(evidence)).not.toMatch(forbiddenSensitivePattern);
    expect(evidence.noSensitiveFixtureMarkers).toBe(true);
    expect(evidence.noSensitiveEvidenceMarkers).toBe(true);
    expect(evidence.noTracePersistence).toBe(true);
    expect(evidence.noRealSecretsOrPhi).toBe(true);
  });

  it("asserts metadata-only telemetry disclosure fence outcomes", () => {
    const fixture = loadFixture();
    const cases = fixture.securityCases.filter((securityCase) => securityCase.suiteId === "secretsTelemetry");
    expect(cases.map((securityCase) => securityCase.caseId)).toEqual(
      expect.arrayContaining([
        "logs-network-dom-screenshots-redacted",
        "ui-telemetry-disclosure-fence",
      ]),
    );
    for (const securityCase of cases) {
      expect(securityCase.actualOutcomeAsserted).toBe(true);
      expect(["redacted", "metadata_only"]).toContain(securityCase.actualOutcomeState);
      expect(securityCase.usesRealSecretsOrPhi).toBe(false);
      expect(securityCase.externalTargets).toEqual([]);
    }
  });
});
