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

describe("470 defensive input and replay penetration cases", () => {
  it("sanitizes benign input probes and routes replay/idempotency collisions to controlled outcomes", () => {
    const fixture = loadFixture();
    const cases = fixture.securityCases.filter((securityCase) => securityCase.suiteId === "inputReplay");
    expect(cases.map((securityCase) => securityCase.caseId)).toEqual(
      expect.arrayContaining([
        "search-filter-injection-sanitized",
        "exact-replay-idempotent",
        "idempotency-collision-review",
        "stale-action-lease-blocked",
        "csrf-missing-token-denied",
        "abuse-rate-limit-throttled",
      ]),
    );
    expect(cases.find((securityCase) => securityCase.caseId === "search-filter-injection-sanitized"))
      .toMatchObject({
        actualOutcomeState: "sanitized",
        observedControlState: "literal_filter_no_query_expansion",
      });
    expect(cases.find((securityCase) => securityCase.caseId === "exact-replay-idempotent"))
      .toMatchObject({
        actualOutcomeState: "exact_replay",
        observedControlState: "original_settlement_returned",
      });
    expect(cases.find((securityCase) => securityCase.caseId === "idempotency-collision-review"))
      .toMatchObject({
        actualOutcomeState: "collision_review",
        observedControlState: "ReplayCollisionReview_opened",
      });
    expect(cases.find((securityCase) => securityCase.caseId === "abuse-rate-limit-throttled"))
      .toMatchObject({
        actualOutcomeState: "throttled",
        observedControlState: "rate_limit_redacted_audit",
      });

    for (const securityCase of cases) {
      expect(securityCase.actualOutcomeState).toBe(securityCase.expectedOutcomeState);
      expect(securityCase.auditRecordState).toBe("written_redacted");
    }
  });
});
