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

describe("470 defensive tenant-isolation penetration cases", () => {
  it("blocks tenant tampering and keeps object guessing at metadata-only or denied boundaries", () => {
    const fixture = loadFixture();
    const cases = fixture.securityCases.filter((securityCase) => securityCase.suiteId === "tenantIsolation");
    expect(cases.map((securityCase) => securityCase.caseId)).toEqual(
      expect.arrayContaining([
        "tenant-param-tamper-blocked",
        "object-id-guessing-metadata-only",
        "release-candidate-drift-blocked",
      ]),
    );
    expect(cases.find((securityCase) => securityCase.caseId === "tenant-param-tamper-blocked"))
      .toMatchObject({
        attemptedState: "read another tenant config",
        actualOutcomeState: "blocked",
        observedControlState: "compiled_policy_bundle_tenant_mismatch",
      });
    expect(cases.find((securityCase) => securityCase.caseId === "object-id-guessing-metadata-only"))
      .toMatchObject({
        actualOutcomeState: "metadata_only",
        observedControlState: "object_grant_missing",
      });
    for (const securityCase of cases) {
      expect(securityCase.externalTargets).toEqual([]);
      expect(securityCase.actualOutcomeAsserted).toBe(true);
      expect(securityCase.proofRefs.length).toBeGreaterThan(0);
    }
  });
});
