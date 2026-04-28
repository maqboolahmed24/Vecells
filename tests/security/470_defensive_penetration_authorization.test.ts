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

describe("470 defensive authorization penetration cases", () => {
  it("asserts denied outcomes for unauthenticated, unauthorized, expired, and purpose-mismatch probes", () => {
    const fixture = loadFixture();
    const cases = fixture.securityCases.filter((securityCase) => securityCase.suiteId === "authorization");
    expect(cases.map((securityCase) => securityCase.caseId)).toEqual(
      expect.arrayContaining([
        "unauthenticated-route-denied",
        "role-scope-action-denied",
        "break-glass-expired-denied",
        "purpose-mismatch-denied",
      ]),
    );

    for (const securityCase of cases) {
      expect(securityCase.defensiveOnly).toBe(true);
      expect(securityCase.externalTargets).toEqual([]);
      expect(securityCase.usesRealSecretsOrPhi).toBe(false);
      expect(securityCase.usesLiveExploitPayloads).toBe(false);
      expect(securityCase.actualOutcomeAsserted).toBe(true);
      expect(securityCase.actualOutcomeState).toBe(securityCase.expectedOutcomeState);
      expect(["denied", "blocked"]).toContain(securityCase.actualOutcomeState);
      expect(securityCase.auditRecordState).toBe("written_redacted");
    }
  });
});
