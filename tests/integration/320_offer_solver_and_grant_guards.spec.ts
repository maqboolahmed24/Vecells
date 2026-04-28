import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildMutationFence,
  openAndDeliverAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "./320_alternative_offer.helpers.ts";

describe("320 alternative offer solver and grant guards", () => {
  it("issues an open-choice set with a separate callback fallback and a live secure link", async () => {
    const harness = await setupAlternativeOfferHarness("320_solver");
    const { openResult, delivered } = await openAndDeliverAlternativeOfferSession(harness);

    expect(openResult.optimisationPlan.visibleCandidateRefs).toEqual(openResult.session.candidateRefs);
    expect(openResult.fallbackCard?.cardType).toBe("callback");
    expect(openResult.materializedToken).toBeTruthy();
    expect(openResult.secureLinkBinding.visibleOfferSetHash).toBe(openResult.session.visibleOfferSetHash);

    const redemption = await harness.offerService.redeemAlternativeOfferLink({
      alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
      presentedToken: openResult.materializedToken!,
      recordedAt: atMinute(11),
      ...buildMutationFence(openResult.session, delivered.truthProjection.truthTupleHash),
    });

    expect(redemption.reasonCodes).toEqual([]);
    expect(redemption.liveActionabilityState).toBe("live_open_choice");
    expect(redemption.redemption.redemption?.toSnapshot().decision).toBe("allow");
  });

  it("fails closed to provenance when the subject fence drifts", async () => {
    const harness = await setupAlternativeOfferHarness("320_guard_drift");
    const { openResult, delivered } = await openAndDeliverAlternativeOfferSession(harness);

    const redemption = await harness.offerService.redeemAlternativeOfferLink({
      alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
      presentedToken: openResult.materializedToken!,
      recordedAt: atMinute(11),
      ...buildMutationFence(openResult.session, delivered.truthProjection.truthTupleHash, {
        subjectRef: "subject_wrong_patient",
      }),
    });

    expect(redemption.liveActionabilityState).toBe("read_only_provenance");
    expect(redemption.reasonCodes).toContain("SUBJECT_DRIFT");
  });
});
