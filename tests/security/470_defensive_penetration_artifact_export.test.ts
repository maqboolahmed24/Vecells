import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPhase9FullRegressionAndDefensiveSecuritySuite,
  writePhase9FullRegressionAndDefensiveSecurityArtifacts,
} from "../../tools/testing/run_470_full_regression_and_defensive_security";

const root = path.resolve(__dirname, "..", "..");

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/470_cross_phase_synthetic_programme_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9FullRegressionAndDefensiveSecuritySuite
  >["fixture"];
}

describe("470 defensive artifact/export penetration cases", () => {
  it("requires presentation contracts and outbound grants for every artifact boundary", () => {
    const fixture = loadFixture();
    expect(fixture.artifactBoundaryCases.map((artifact) => artifact.caseId)).toEqual(
      expect.arrayContaining([
        "audit-search-export",
        "assurance-pack-export",
        "deletion-certificate",
        "archive-manifest",
        "restore-report",
        "incident-reportability-handoff",
        "conformance-scorecard-export",
      ]),
    );
    for (const artifact of fixture.artifactBoundaryCases) {
      expect(artifact.artifactPresentationContract).toBe("required_and_verified");
      expect(artifact.outboundNavigationGrant).toBe("required_and_verified");
      expect(artifact.rawBlobUrlExposure).toBe(false);
      expect(artifact.routeParamsCarryOnlyOpaqueRefs).toBe(true);
      expect(artifact.safeReturnTokenRequired).toBe(true);
      expect(artifact.telemetryPayloadClass).toBe("metadata_only");
    }
  });

  it("asserts defensive export misuse outcomes instead of relying on a scanner pass", () => {
    const fixture = loadFixture();
    const cases = fixture.securityCases.filter((securityCase) => securityCase.suiteId === "artifactExport");
    expect(cases.map((securityCase) => securityCase.caseId)).toEqual(
      expect.arrayContaining([
        "artifact-export-missing-grant-denied",
        "raw-blob-url-not-rendered",
        "grant-replay-denied",
        "export-name-injection-sanitized",
      ]),
    );
    expect(cases.map((securityCase) => securityCase.actualOutcomeState)).toEqual(
      expect.arrayContaining(["denied", "no_raw_url", "sanitized"]),
    );
    for (const securityCase of cases) {
      expect(securityCase.actualOutcomeAsserted).toBe(true);
      expect(securityCase.externalTargets).toEqual([]);
      expect(securityCase.usesRealSecretsOrPhi).toBe(false);
    }
  });
});
