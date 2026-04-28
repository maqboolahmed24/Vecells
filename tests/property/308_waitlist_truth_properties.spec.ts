import { describe, expect, it } from "vitest";

import {
  buildReleasedCapacity,
  setupWaitlistFlow,
} from "../integration/308_manage_waitlist_assisted.helpers.ts";

async function joinAndIssue(flow: any, overrides: Record<string, unknown> = {}) {
  const joined = await flow.waitlistApplication.joinWaitlist({
    bookingCaseId: `booking_case_${flow.seed}`,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `join_waitlist_action_${flow.seed}`,
    commandSettlementRecordRef: `join_waitlist_settlement_${flow.seed}`,
    occurredAt: "2026-04-24T09:00:00.000Z",
    routeIntentBindingRef: `route_intent_waitlist_${flow.seed}`,
    deadlineAt: "2026-04-24T18:00:00.000Z",
    payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/join`,
    edgeCorrelationId: `edge_waitlist_join_${flow.seed}`,
    ...overrides,
  });
  const processed = await flow.waitlistApplication.processReleasedCapacity({
    releasedCapacity: [buildReleasedCapacity(flow.seed)],
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `process_released_capacity_${flow.seed}`,
    commandSettlementRecordRef: `process_released_capacity_settlement_${flow.seed}`,
    processedAt: "2026-04-24T09:50:00.000Z",
    payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/process`,
    edgeCorrelationId: `edge_waitlist_process_${flow.seed}`,
  });
  return {
    joined,
    issuedOfferId: processed.issuedOffers[0]!.activeOffer!.waitlistOfferId,
  };
}

describe("308 waitlist truth properties", () => {
  it("keeps deadline and fallback authority monotone across acceptance, expiry, supersession, and repeat refreshes", async () => {
    const scenarios = [
      {
        seed: "308_prop_booked",
        audience: "staff" as const,
        async run(flow: any) {
          const { joined, issuedOfferId } = await joinAndIssue(flow);
          const accepted = await flow.waitlistApplication.acceptWaitlistOffer({
            waitlistOfferId: issuedOfferId,
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
          return { joined, final: accepted.waitlist };
        },
      },
      {
        seed: "308_prop_callback",
        audience: "staff" as const,
        async run(flow: any) {
          const { joined, issuedOfferId } = await joinAndIssue(flow, {
            expectedOfferServiceMinutes: 30,
          });
          const expired = await flow.waitlistApplication.expireWaitlistOffer({
            waitlistOfferId: issuedOfferId,
            actorRef: `actor_${flow.seed}`,
            subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
            commandActionRecordRef: `expire_waitlist_offer_${flow.seed}`,
            commandSettlementRecordRef: `expire_waitlist_offer_settlement_${flow.seed}`,
            expiredAt: "2026-04-24T10:15:00.000Z",
            reasonCode: "offer_ttl_elapsed",
            payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/expire`,
            edgeCorrelationId: `edge_waitlist_expire_${flow.seed}`,
          });
          const refreshed = await flow.waitlistApplication.refreshFallbackObligation({
            waitlistEntryId: expired.waitlist.entry.waitlistEntryId,
            actorRef: `actor_${flow.seed}`,
            commandActionRecordRef: `refresh_fallback_${flow.seed}`,
            commandSettlementRecordRef: `refresh_fallback_settlement_${flow.seed}`,
            evaluatedAt: "2026-04-24T10:16:00.000Z",
            staleCapacityTruth: false,
            noEligibleSupply: true,
            policyCutoff: false,
            payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/refresh`,
            edgeCorrelationId: `edge_waitlist_refresh_${flow.seed}`,
          });
          return { joined, final: refreshed.waitlist };
        },
      },
      {
        seed: "308_prop_hub",
        audience: "staff" as const,
        async run(flow: any) {
          const { joined, issuedOfferId } = await joinAndIssue(flow);
          const superseded = await flow.waitlistApplication.supersedeWaitlistOffer({
            waitlistOfferId: issuedOfferId,
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
            payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/refresh/first`,
            edgeCorrelationId: `edge_waitlist_refresh_${flow.seed}_first`,
          });
          const firstRefresh = await flow.waitlistApplication.queryCurrentWaitlist({
            bookingCaseId: `booking_case_${flow.seed}`,
          });
          await flow.waitlistApplication.waitlistService.refreshFallbackObligation({
            waitlistEntryId: superseded.waitlist.entry.waitlistEntryId,
            actorRef: `actor_${flow.seed}`,
            subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
            commandActionRecordRef: `refresh_fallback_second_${flow.seed}`,
            commandSettlementRecordRef: `refresh_fallback_second_settlement_${flow.seed}`,
            evaluatedAt: "2026-04-24T10:11:00.000Z",
            staleCapacityTruth: true,
            noEligibleSupply: false,
            policyCutoff: false,
            callbackAllowed: false,
            hubAllowed: true,
            payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/refresh/second`,
            edgeCorrelationId: `edge_waitlist_refresh_${flow.seed}_second`,
          });
          const secondRefresh = await flow.waitlistApplication.queryCurrentWaitlist({
            bookingCaseId: `booking_case_${flow.seed}`,
          });
          expect(secondRefresh?.waitlist.fallbackObligation.requiredFallbackRoute).toBe(
            firstRefresh?.waitlist.fallbackObligation.requiredFallbackRoute,
          );
          return { joined, final: secondRefresh!.waitlist };
        },
      },
    ];

    for (const scenario of scenarios) {
      const flow = await setupWaitlistFlow({
        seed: scenario.seed,
        audience: scenario.audience,
      });
      const { joined, final } = await scenario.run(flow);

      expect(final.entry.deadlineAt).toBe(joined.waitlist.entry.deadlineAt);
      expect(final.deadlineEvaluation.deadlineAt).toBe(
        joined.waitlist.deadlineEvaluation.deadlineAt,
      );
      expect(final.continuationTruth.fallbackObligationRef).toBe(
        final.fallbackObligation.waitlistFallbackObligationId,
      );
      expect(Date.parse(final.continuationTruth.nextEvaluationAt)).toBeGreaterThanOrEqual(
        Date.parse(joined.waitlist.continuationTruth.nextEvaluationAt),
      );
    }
  });
});
