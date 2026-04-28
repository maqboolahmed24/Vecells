import { describe, expect, it } from "vitest";

import {
  computeHubFallbackNoveltyScore,
  evaluateHubFallbackLeadTimeDecision,
  shouldEscalateHubFallbackLoop,
} from "../src/phase5-hub-fallback-engine.ts";

describe("phase5 hub fallback engine", () => {
  it("keeps alternatives lawful only when offer lead fits the remaining clinical window", () => {
    const legal = evaluateHubFallbackLeadTimeDecision({
      remainingClinicalWindowMinutes: 30,
      offerLeadMinutes: 20,
      callbackLeadMinutes: 25,
      trustedAlternativeFrontierExists: true,
      callbackRequested: false,
      policyRequiresCallback: false,
      degradedOnlyEvidence: false,
    });
    const illegal = evaluateHubFallbackLeadTimeDecision({
      remainingClinicalWindowMinutes: 30,
      offerLeadMinutes: 35,
      callbackLeadMinutes: 20,
      trustedAlternativeFrontierExists: true,
      callbackRequested: false,
      policyRequiresCallback: false,
      degradedOnlyEvidence: false,
    });

    expect(legal.decision).toBe("alternatives");
    expect(illegal.decision).toBe("return_to_practice");
    expect(illegal.reasonCode).toBe("offer_lead_exceeds_clinical_window");
  });

  it("prefers callback only when callback lead is legal for the current window", () => {
    const callback = evaluateHubFallbackLeadTimeDecision({
      remainingClinicalWindowMinutes: 25,
      offerLeadMinutes: 35,
      callbackLeadMinutes: 15,
      trustedAlternativeFrontierExists: false,
      callbackRequested: true,
      policyRequiresCallback: false,
      degradedOnlyEvidence: false,
    });
    const tooSlow = evaluateHubFallbackLeadTimeDecision({
      remainingClinicalWindowMinutes: 25,
      offerLeadMinutes: 35,
      callbackLeadMinutes: 30,
      trustedAlternativeFrontierExists: false,
      callbackRequested: true,
      policyRequiresCallback: false,
      degradedOnlyEvidence: false,
    });

    expect(callback.decision).toBe("callback");
    expect(tooSlow.decision).toBe("return_to_practice");
    expect(tooSlow.reasonCode).toBe("callback_lead_exceeds_clinical_window");
  });

  it("escalates repeated hub-practice bounce loops when novelty stays below threshold", () => {
    const novelty = computeHubFallbackNoveltyScore({
      previousBestTrustedFit: 0.42,
      currentBestTrustedFit: 0.44,
      previousPriorityBand: "priority",
      currentPriorityBand: "priority",
      newClinicalContextScore: 0.1,
    });

    expect(novelty).toBeLessThan(0.35);
    expect(
      shouldEscalateHubFallbackLoop({
        bounceCount: 3,
        noveltyScore: novelty,
      }),
    ).toBe(true);
  });
});
