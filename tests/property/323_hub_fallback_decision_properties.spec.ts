import { describe, expect, it } from "vitest";

import {
  evaluateHubFallbackLeadTimeDecision,
  shouldEscalateHubFallbackLoop,
} from "../../packages/domains/hub_coordination/src/phase5-hub-fallback-engine.ts";

describe("323 fallback decision properties", () => {
  it("never permits callback when callback lead exceeds the remaining clinical window", () => {
    for (let remaining = 0; remaining <= 40; remaining += 5) {
      const result = evaluateHubFallbackLeadTimeDecision({
        remainingClinicalWindowMinutes: remaining,
        offerLeadMinutes: remaining + 20,
        callbackLeadMinutes: remaining + 1,
        trustedAlternativeFrontierExists: false,
        callbackRequested: true,
        policyRequiresCallback: false,
        degradedOnlyEvidence: false,
      });
      expect(result.decision).not.toBe("callback");
    }
  });

  it("escalates only once bounce threshold is met and novelty stays below threshold", () => {
    for (let bounceCount = 0; bounceCount <= 4; bounceCount += 1) {
      const lowNovelty = shouldEscalateHubFallbackLoop({
        bounceCount,
        noveltyScore: 0.1,
      });
      const highNovelty = shouldEscalateHubFallbackLoop({
        bounceCount,
        noveltyScore: 0.9,
      });

      expect(highNovelty).toBe(false);
      expect(lowNovelty).toBe(bounceCount >= 3);
    }
  });
});
