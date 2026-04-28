import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildMutationFence,
  buildReservationBinding,
  openAndDeliverAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "./320_alternative_offer.helpers.ts";

describe("320 offer replay and accept flow", () => {
  it("replays the stored offer-session fixture exactly", async () => {
    const harness = await setupAlternativeOfferHarness("320_replay");
    const { openResult } = await openAndDeliverAlternativeOfferSession(harness);

    const replay = await harness.offerService.replayAlternativeOfferSession({
      alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
      replayedAt: atMinute(12),
    });

    expect(replay.matchesStoredSession).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
  });

  it("accepts a visible entry and moves the case back into coordinator selecting", async () => {
    const harness = await setupAlternativeOfferHarness("320_accept");
    const { openResult, delivered } = await openAndDeliverAlternativeOfferSession(harness);
    const selectedEntry = openResult.entries[0]!;

    const accepted = await harness.offerService.acceptAlternativeOfferEntry({
      alternativeOfferSessionId: openResult.session.alternativeOfferSessionId,
      alternativeOfferEntryId: selectedEntry.alternativeOfferEntryId,
      actorRef: "patient_accept",
      routeIntentBindingRef: "route_patient_accept",
      commandActionRecordRef: "action_patient_accept",
      commandSettlementRecordRef: "settlement_patient_accept",
      recordedAt: atMinute(12),
      reservationBinding: buildReservationBinding(openResult.session, selectedEntry.candidateRef),
      ...buildMutationFence(openResult.session, delivered.truthProjection.truthTupleHash),
    });

    expect(accepted.entry.selectionState).toBe("selected");
    expect(accepted.session.selectedCandidateRef).toBe(selectedEntry.candidateRef);
    expect(accepted.hubTransition.hubCase.status).toBe("coordinator_selecting");
    expect(accepted.truthProjection.offerState).toBe("selected");
  });
});
