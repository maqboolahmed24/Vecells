import { describe, expect, it } from "vitest";

import { setupBookingCoreFlow } from "./307_booking_core.helpers.ts";

describe("307 reservation and hold truth", () => {
  it("keeps truthful nonexclusive selections explicit about non-exclusivity", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_nonexclusive",
    });
    const soft = await flow.bookingReservationApplication.createOrRefreshSoftSelection({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_soft_select_${flow.seed}`,
      commandSettlementRecordRef: `reservation_soft_select_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:22:00.000Z",
      ttlSeconds: 300,
    });

    expect(soft.scope.currentReservationState).toBe("soft_selected");
    expect(soft.projection.truthState).toBe("truthful_nonexclusive");
    expect(soft.projection.displayExclusivityState).toBe("nonexclusive");
    expect(soft.projection.countdownMode).toBe("none");
  });

  it("proves the exclusive hold lifecycle through held, pending_confirmation, and confirmed", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_exclusive",
      forceExclusiveHold: true,
    });
    const soft = await flow.bookingReservationApplication.createOrRefreshSoftSelection({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_soft_select_${flow.seed}`,
      commandSettlementRecordRef: `reservation_soft_select_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:22:00.000Z",
      ttlSeconds: 300,
    });
    const held = await flow.bookingReservationApplication.acquireOrRefreshHold({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_hold_${flow.seed}`,
      commandSettlementRecordRef: `reservation_hold_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:23:00.000Z",
      fenceToken: soft.fence.fenceToken,
      expectedReservationVersionRef: soft.scope.currentReservationVersionRef,
      holdTtlSeconds: 120,
    });
    const pending = await flow.bookingReservationApplication.markPendingConfirmation({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_pending_${flow.seed}`,
      commandSettlementRecordRef: `reservation_pending_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:24:00.000Z",
      fenceToken: held.fence.fenceToken,
      expectedReservationVersionRef: held.scope.currentReservationVersionRef,
    });
    const confirmed = await flow.bookingReservationApplication.markConfirmed({
      scopeFamily: "offer_session",
      scopeObjectRef: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `reservation_confirmed_${flow.seed}`,
      commandSettlementRecordRef: `reservation_confirmed_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:25:00.000Z",
      fenceToken: pending.fence.fenceToken,
      expectedReservationVersionRef: pending.scope.currentReservationVersionRef,
    });

    expect(held.projection.truthState).toBe("exclusive_held");
    expect(held.projection.displayExclusivityState).toBe("exclusive");
    expect(held.projection.countdownMode).toBe("hold_expiry");
    expect(pending.projection.truthState).toBe("pending_confirmation");
    expect(confirmed.projection.truthState).toBe("confirmed");
  });

  it("covers replacement, expiry, and unavailable-disputed reservation postures without false exclusivity", async () => {
    const replacedFlow = await setupBookingCoreFlow({
      seed: "307_replaced",
    });
    const replacedSoft =
      await replacedFlow.bookingReservationApplication.createOrRefreshSoftSelection({
        scopeFamily: "offer_session",
        scopeObjectRef: replacedFlow.offerSession!.offerSessionId,
        actorRef: `actor_${replacedFlow.seed}`,
        subjectRef: `${replacedFlow.selectionAudience}_actor_${replacedFlow.seed}`,
        commandActionRecordRef: `reservation_soft_select_${replacedFlow.seed}`,
        commandSettlementRecordRef: `reservation_soft_select_settlement_${replacedFlow.seed}`,
        occurredAt: "2026-04-22T12:22:00.000Z",
        ttlSeconds: 300,
      });
    const replaced = await replacedFlow.bookingReservationApplication.releaseReservation({
      scopeFamily: "offer_session",
      scopeObjectRef: replacedFlow.offerSession!.offerSessionId,
      actorRef: `actor_${replacedFlow.seed}`,
      subjectRef: `${replacedFlow.selectionAudience}_actor_${replacedFlow.seed}`,
      commandActionRecordRef: `reservation_release_${replacedFlow.seed}`,
      commandSettlementRecordRef: `reservation_release_settlement_${replacedFlow.seed}`,
      occurredAt: "2026-04-22T12:23:00.000Z",
      fenceToken: replacedSoft.fence.fenceToken,
      expectedReservationVersionRef: replacedSoft.scope.currentReservationVersionRef,
      terminalReasonCode: "selection_replaced",
    });

    const expiredFlow = await setupBookingCoreFlow({
      seed: "307_expired",
      forceExclusiveHold: true,
    });
    const expiring =
      await expiredFlow.bookingReservationApplication.createOrRefreshSoftSelection({
        scopeFamily: "offer_session",
        scopeObjectRef: expiredFlow.offerSession!.offerSessionId,
        actorRef: `actor_${expiredFlow.seed}`,
        subjectRef: `${expiredFlow.selectionAudience}_actor_${expiredFlow.seed}`,
        commandActionRecordRef: `reservation_soft_select_${expiredFlow.seed}`,
        commandSettlementRecordRef: `reservation_soft_select_settlement_${expiredFlow.seed}`,
        occurredAt: "2026-04-22T12:22:00.000Z",
        ttlSeconds: 30,
      });
    const swept = await expiredFlow.bookingReservationApplication.sweepExpiredReservations({
      asOf: "2026-04-22T12:23:05.000Z",
      actorRef: `actor_${expiredFlow.seed}`,
      subjectRef: `${expiredFlow.selectionAudience}_actor_${expiredFlow.seed}`,
      commandActionRecordRef: `reservation_sweep_${expiredFlow.seed}`,
      commandSettlementRecordRef: `reservation_sweep_settlement_${expiredFlow.seed}`,
    });
    const expired = await expiredFlow.bookingReservationApplication.queryReservationTruth({
      scopeFamily: "offer_session",
      scopeObjectRef: expiredFlow.offerSession!.offerSessionId,
      requestedAt: "2026-04-22T12:23:10.000Z",
    });

    const disputedFlow = await setupBookingCoreFlow({
      seed: "307_unavailable",
      forceExclusiveHold: true,
    });
    const unavailableSeed =
      await disputedFlow.bookingReservationApplication.createOrRefreshSoftSelection({
        scopeFamily: "offer_session",
        scopeObjectRef: disputedFlow.offerSession!.offerSessionId,
        actorRef: `actor_${disputedFlow.seed}`,
        subjectRef: `${disputedFlow.selectionAudience}_actor_${disputedFlow.seed}`,
        commandActionRecordRef: `reservation_soft_select_${disputedFlow.seed}`,
        commandSettlementRecordRef: `reservation_soft_select_settlement_${disputedFlow.seed}`,
        occurredAt: "2026-04-22T12:22:00.000Z",
        ttlSeconds: 300,
      });
    const disputed = await disputedFlow.bookingReservationApplication.markDisputed({
      scopeFamily: "offer_session",
      scopeObjectRef: disputedFlow.offerSession!.offerSessionId,
      actorRef: `actor_${disputedFlow.seed}`,
      subjectRef: `${disputedFlow.selectionAudience}_actor_${disputedFlow.seed}`,
      commandActionRecordRef: `reservation_dispute_${disputedFlow.seed}`,
      commandSettlementRecordRef: `reservation_dispute_settlement_${disputedFlow.seed}`,
      occurredAt: "2026-04-22T12:23:00.000Z",
      fenceToken: unavailableSeed.fence.fenceToken,
      expectedReservationVersionRef: unavailableSeed.scope.currentReservationVersionRef,
      terminalReasonCode: "slot_unavailable_after_refresh",
    });

    expect(replaced.projection.truthState).toBe("released");
    expect(replaced.reservation.terminalReasonCode).toBe("selection_replaced");
    expect(swept.expiredScopeRefs).toContain(expiring.scope.bookingReservationScopeId);
    expect(expired?.projection.truthState).toBe("expired");
    expect(disputed.projection.truthState).toBe("disputed");
    expect(disputed.reservation.terminalReasonCode).toBe("slot_unavailable_after_refresh");
    expect(disputed.projection.displayExclusivityState).toBe("none");
  });
});
