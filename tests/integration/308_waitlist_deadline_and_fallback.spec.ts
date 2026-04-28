import { describe, expect, it } from "vitest";

import {
  buildReleasedCapacity,
  setupWaitlistFlow,
} from "./308_manage_waitlist_assisted.helpers.ts";

function joinWaitlistInput(flow: any, overrides: Record<string, unknown> = {}) {
  return {
    bookingCaseId: `booking_case_${flow.seed}`,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `join_waitlist_action_${flow.seed}`,
    commandSettlementRecordRef: `join_waitlist_settlement_${flow.seed}`,
    occurredAt: "2026-04-24T09:00:00.000Z",
    routeIntentBindingRef: `route_intent_waitlist_${flow.seed}`,
    payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/join`,
    edgeCorrelationId: `edge_waitlist_join_${flow.seed}`,
    ...overrides,
  };
}

function processReleasedCapacityInput(flow: any, overrides: Record<string, unknown> = {}) {
  return {
    releasedCapacity: [buildReleasedCapacity(flow.seed)],
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `process_released_capacity_${flow.seed}`,
    commandSettlementRecordRef: `process_released_capacity_settlement_${flow.seed}`,
    processedAt: "2026-04-24T09:50:00.000Z",
    payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/process`,
    edgeCorrelationId: `edge_waitlist_process_${flow.seed}`,
    ...overrides,
  };
}

describe("308 waitlist deadline and fallback", () => {
  it("keeps one authoritative deadline through offer acceptance and only satisfies fallback debt on booked truth", async () => {
    const flow = await setupWaitlistFlow({
      seed: "308_waitlist_booked",
      forceExclusiveHold: true,
    });

    const joined = await flow.waitlistApplication.joinWaitlist(
      joinWaitlistInput(flow, {
        deadlineAt: "2026-04-24T18:00:00.000Z",
      }),
    );
    const initialDeadline = joined.waitlist.entry.deadlineAt;

    const processed = await flow.waitlistApplication.processReleasedCapacity(
      processReleasedCapacityInput(flow),
    );
    const accepted = await flow.waitlistApplication.acceptWaitlistOffer({
      waitlistOfferId: processed.issuedOffers[0]!.activeOffer!.waitlistOfferId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `accept_waitlist_offer_${flow.seed}`,
      commandSettlementRecordRef: `accept_waitlist_offer_settlement_${flow.seed}`,
      acceptedAt: "2026-04-24T09:55:00.000Z",
      idempotencyKey: `waitlist_accept_idempotency_${flow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${flow.seed}`,
        settlementRef: `provider_settlement_${flow.seed}`,
      },
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/accept`,
      edgeCorrelationId: `edge_waitlist_accept_${flow.seed}`,
    });

    expect(accepted.waitlist.entry.deadlineAt).toBe(initialDeadline);
    expect(accepted.waitlist.deadlineEvaluation.deadlineAt).toBe(initialDeadline);
    expect(accepted.waitlist.fallbackObligation.requiredFallbackRoute).toBe("stay_local_waitlist");
    expect(accepted.waitlist.fallbackObligation.transferState).toBe("satisfied");
    expect(accepted.waitlist.continuationTruth.fallbackObligationRef).toBe(
      accepted.waitlist.fallbackObligation.waitlistFallbackObligationId,
    );
    expect(accepted.bookingCommit.transaction.authoritativeOutcomeState).toBe("booked");
    expect(accepted.bookingCase.bookingCase.status).toBe("booked");
  });

  it("expires a patient-visible offer into callback fallback without resetting the authoritative deadline", async () => {
    const flow = await setupWaitlistFlow({
      seed: "308_waitlist_callback",
    });

    const joined = await flow.waitlistApplication.joinWaitlist(
      joinWaitlistInput(flow, {
        deadlineAt: "2026-04-24T10:20:00.000Z",
        expectedOfferServiceMinutes: 30,
      }),
    );
    const initialDeadline = joined.waitlist.entry.deadlineAt;
    const processed = await flow.waitlistApplication.processReleasedCapacity(
      processReleasedCapacityInput(flow),
    );

    const expired = await flow.waitlistApplication.expireWaitlistOffer({
      waitlistOfferId: processed.issuedOffers[0]!.activeOffer!.waitlistOfferId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `expire_waitlist_offer_${flow.seed}`,
      commandSettlementRecordRef: `expire_waitlist_offer_settlement_${flow.seed}`,
      expiredAt: "2026-04-24T10:15:00.000Z",
      reasonCode: "offer_ttl_elapsed",
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/expire`,
      edgeCorrelationId: `edge_waitlist_expire_${flow.seed}`,
    });

    expect(expired.waitlist.entry.deadlineAt).toBe(initialDeadline);
    expect(expired.waitlist.deadlineEvaluation.deadlineAt).toBe(initialDeadline);
    expect(expired.waitlist.deadlineEvaluation.offerabilityState).toBe("fallback_required");
    expect(expired.waitlist.fallbackObligation.requiredFallbackRoute).toBe("callback");
    expect(expired.waitlist.fallbackObligation.callbackCaseRef).toBeTruthy();
    expect(expired.bookingCase.bookingCase.status).toBe("callback_fallback");
    expect(expired.bookingCase.bookingCase.activeWaitlistFallbackObligationRef).toBe(
      expired.waitlist.fallbackObligation.waitlistFallbackObligationId,
    );
  });

  it("preserves deadline authority across supersession and stale-capacity hub fallback refresh", async () => {
    const flow = await setupWaitlistFlow({
      seed: "308_waitlist_hub",
    });

    const joined = await flow.waitlistApplication.joinWaitlist(
      joinWaitlistInput(flow, {
        deadlineAt: "2026-04-24T18:00:00.000Z",
      }),
    );
    const initialDeadline = joined.waitlist.entry.deadlineAt;
    const processed = await flow.waitlistApplication.processReleasedCapacity(
      processReleasedCapacityInput(flow),
    );

    const superseded = await flow.waitlistApplication.supersedeWaitlistOffer({
      waitlistOfferId: processed.issuedOffers[0]!.activeOffer!.waitlistOfferId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `supersede_waitlist_offer_${flow.seed}`,
      commandSettlementRecordRef: `supersede_waitlist_offer_settlement_${flow.seed}`,
      supersededAt: "2026-04-24T10:05:00.000Z",
      supersededByRef: `waitlist_offer_newer_${flow.seed}`,
      reasonCode: "newer_offer_issued",
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/supersede`,
      edgeCorrelationId: `edge_waitlist_supersede_${flow.seed}`,
    });

    expect(superseded.waitlist.entry.deadlineAt).toBe(initialDeadline);
    expect(superseded.waitlist.deadlineEvaluation.deadlineAt).toBe(initialDeadline);

    await flow.waitlistApplication.waitlistService.refreshFallbackObligation({
      waitlistEntryId: superseded.waitlist.entry.waitlistEntryId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `refresh_fallback_${flow.seed}`,
      commandSettlementRecordRef: `refresh_fallback_settlement_${flow.seed}`,
      evaluatedAt: "2026-04-24T10:10:00.000Z",
      staleCapacityTruth: true,
      noEligibleSupply: false,
      policyCutoff: false,
      callbackAllowed: false,
      hubAllowed: true,
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/refresh`,
      edgeCorrelationId: `edge_waitlist_refresh_${flow.seed}`,
    });
    const refreshed = await flow.waitlistApplication.queryCurrentWaitlist({
      bookingCaseId: `booking_case_${flow.seed}`,
    });

    expect(refreshed?.waitlist.entry.deadlineAt).toBe(initialDeadline);
    expect(refreshed?.waitlist.fallbackObligation.requiredFallbackRoute).toBe("hub");
    expect(refreshed?.waitlist.deadlineEvaluation.deadlineAt).toBe(initialDeadline);
    expect(refreshed?.waitlist.continuationTruth.fallbackObligationRef).toBe(
      refreshed?.waitlist.fallbackObligation.waitlistFallbackObligationId,
    );
  });
});
