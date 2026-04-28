import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildOpenAlternativeOfferInput,
  buildMutationFence,
  openAndDeliverAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "./320_alternative_offer.helpers.ts";

describe("320 alternative offer regeneration and callback", () => {
  it("keeps callback as a governed fallback path instead of a ranked row", async () => {
    const harness = await setupAlternativeOfferHarness("320_callback");
    const { openResult, delivered } = await openAndDeliverAlternativeOfferSession(harness);

    const callback = await harness.offerService.requestCallbackFromAlternativeOffer({
      alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
      actorRef: "patient_callback",
      routeIntentBindingRef: "route_patient_callback",
      commandActionRecordRef: "action_patient_callback",
      commandSettlementRecordRef: "settlement_patient_callback",
      recordedAt: atMinute(12),
      activeFallbackRef: "gap_callback_request_320",
      ...buildMutationFence(openResult.session, delivered.truthProjection.truthTupleHash),
    });

    expect(callback.fallbackCard.eligibilityState).toBe("selected");
    expect(callback.truthProjection.fallbackLinkState).toBe("callback_pending_link");
    expect(callback.hubTransition.hubCase.status).toBe("callback_transfer_pending");
  });

  it("supersedes the stale session before publishing a regenerated replacement in-shell", async () => {
    const harness = await setupAlternativeOfferHarness("320_regen");
    const opened = await harness.offerService.openAlternativeOfferSession(
      buildOpenAlternativeOfferInput(harness, {
        actorRef: "coordinator_regen",
        routeIntentBindingRef: "route_regen_offer",
        commandActionRecordRef: "action_regen_offer",
        commandSettlementRecordRef: "settlement_regen_offer",
        recordedAt: atMinute(9),
      }),
    );

    const regenerated = await harness.offerService.regenerateAlternativeOfferSession({
      ...buildOpenAlternativeOfferInput(harness, {
        actorRef: "coordinator_regen",
        routeIntentBindingRef: "route_regen_offer_refresh",
        commandActionRecordRef: "action_regen_refresh",
        commandSettlementRecordRef: "settlement_regen_refresh",
        recordedAt: atMinute(13),
      }),
      alternativeOfferSessionId: opened.session.alternativeOfferSessionId,
      triggerClass: "candidate_snapshot_superseded",
    });

    expect(regenerated.settlement.resultState).toBe("regenerated_in_shell");
    expect(regenerated.priorSession.patientChoiceState).toBe("superseded");
    expect(regenerated.nextSession?.alternativeOfferSessionId).not.toBe(
      opened.session.alternativeOfferSessionId,
    );
    expect(regenerated.truthProjection.offerSessionRef).toBe(
      regenerated.nextSession?.alternativeOfferSessionId ?? null,
    );
  });
});
