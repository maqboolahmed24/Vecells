import { describe, expect, it } from "vitest";

import { setupBookingCoreFlow } from "./307_booking_core.helpers.ts";

function buildPendingCommitInput(
  flow: Awaited<ReturnType<typeof setupBookingCoreFlow>>,
  overrides?: Partial<{
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    payloadArtifactRef: string;
    edgeCorrelationId: string;
    idempotencyKey: string;
    occurredAt: string;
  }>,
) {
  return {
    bookingCaseId: `booking_case_${flow.seed}`,
    offerSessionId: flow.offerSession!.offerSessionId,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef:
      overrides?.commandActionRecordRef ?? `begin_commit_action_${flow.seed}`,
    commandSettlementRecordRef:
      overrides?.commandSettlementRecordRef ??
      `begin_commit_settlement_${flow.seed}`,
    occurredAt: overrides?.occurredAt ?? "2026-04-22T12:25:00.000Z",
    idempotencyKey: overrides?.idempotencyKey ?? `idempotency_key_${flow.seed}`,
    dispatchOutcome: {
      kind: "confirmation_pending" as const,
      blockerReasonCode: "awaiting_supplier_commit",
      recoveryMode: "awaiting_external_confirmation",
      externalConfirmationGateRef: null,
      providerReference: `provider_reference_${flow.seed}`,
    },
    expectedSelectionProofHash: flow.offerSession!.selectionProofHash,
    expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
    expectedOwnershipEpochRef: 4,
    expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
    expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
    expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
    reviewActionLeaseRef: `review_action_lease_${flow.seed}`,
    payloadArtifactRef:
      overrides?.payloadArtifactRef ?? `artifact://booking/commit/${flow.seed}`,
    edgeCorrelationId: overrides?.edgeCorrelationId ?? `edge_commit_${flow.seed}`,
  };
}

describe("307 commit replay and fencing", () => {
  it("replays duplicate pending submits onto one transaction chain even across different idempotency keys", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_pending_replay",
      forceExclusiveHold: true,
    });

    const first = await flow.bookingCommitApplication.beginCommitFromSelectedOffer(
      buildPendingCommitInput(flow),
    );
    const second = await flow.bookingCommitApplication.beginCommitFromSelectedOffer(
      buildPendingCommitInput(flow, {
        commandActionRecordRef: `begin_commit_action_${flow.seed}_same_key_replay`,
        commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}_same_key_replay`,
        payloadArtifactRef: `artifact://booking/commit/${flow.seed}/same-key-replay`,
        edgeCorrelationId: `edge_commit_${flow.seed}_same_key_replay`,
      }),
    );
    const third = await flow.bookingCommitApplication.beginCommitFromSelectedOffer(
      buildPendingCommitInput(flow, {
        commandActionRecordRef: `begin_commit_action_${flow.seed}_other_key_replay`,
        commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}_other_key_replay`,
        payloadArtifactRef: `artifact://booking/commit/${flow.seed}/other-key-replay`,
        edgeCorrelationId: `edge_commit_${flow.seed}_other_key_replay`,
        idempotencyKey: `idempotency_key_${flow.seed}_alt`,
      }),
    );

    expect(first.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(second.replayed).toBe(true);
    expect(third.replayed).toBe(true);
    expect(second.transaction.bookingTransactionId).toBe(first.transaction.bookingTransactionId);
    expect(third.transaction.bookingTransactionId).toBe(first.transaction.bookingTransactionId);
  });

  it("fails closed on stale selection proof and stale snapshot preflight before dispatch", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_stale_preflight",
    });

    await expect(
      flow.bookingCommitApplication.beginCommitFromSelectedOffer({
        ...buildPendingCommitInput(flow, {
          commandActionRecordRef: `begin_commit_action_${flow.seed}_stale_proof`,
          commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}_stale_proof`,
          payloadArtifactRef: `artifact://booking/commit/${flow.seed}/stale-proof`,
          edgeCorrelationId: `edge_commit_${flow.seed}_stale_proof`,
        }),
        expectedSelectionProofHash: `${flow.offerSession!.selectionProofHash}_stale`,
      }),
    ).rejects.toThrow(/STALE_SELECTION_PROOF/);

    const failed = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      ...buildPendingCommitInput(flow, {
        commandActionRecordRef: `begin_commit_action_${flow.seed}_expired_snapshot`,
        commandSettlementRecordRef:
          `begin_commit_settlement_${flow.seed}_expired_snapshot`,
        payloadArtifactRef: `artifact://booking/commit/${flow.seed}/expired-snapshot`,
        edgeCorrelationId: `edge_commit_${flow.seed}_expired_snapshot`,
        occurredAt: "2026-04-22T12:40:00.000Z",
      }),
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${flow.seed}`,
        settlementRef: `settlement_${flow.seed}`,
      },
    });

    expect(failed.transaction.commitState).toBe("preflight_failed");
    expect(failed.transaction.authoritativeOutcomeState).toBe("failed");
    expect(failed.transaction.blockerReasonCodes).toContain("slot_snapshot_expired");
    expect(failed.bookingException?.exceptionClass).toBe("preflight_failure");
  });

  it("replays authoritative observations without creating a second appointment record", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_observation_replay",
      forceExclusiveHold: true,
    });
    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer(
      buildPendingCommitInput(flow),
    );

    const observed = await flow.bookingCommitApplication.recordAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      observationKind: "durable_provider_reference",
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `record_observation_action_${flow.seed}`,
      commandSettlementRecordRef: `record_observation_settlement_${flow.seed}`,
      observedAt: "2026-04-22T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: `ordering_key_${flow.seed}`,
      rawReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      semanticReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/receipt`,
      edgeCorrelationId: `edge_receipt_${flow.seed}`,
    });
    const replayed = await flow.bookingCommitApplication.recordAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      observationKind: "durable_provider_reference",
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `record_observation_action_${flow.seed}_replay`,
      commandSettlementRecordRef:
        `record_observation_settlement_${flow.seed}_replay`,
      observedAt: "2026-04-22T12:26:30.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: `ordering_key_${flow.seed}`,
      rawReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      semanticReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/receipt/replay`,
      edgeCorrelationId: `edge_receipt_${flow.seed}_replay`,
    });

    expect(observed.transaction.authoritativeOutcomeState).toBe("booked");
    expect(replayed.replayed).toBe(true);
    expect(replayed.transaction.bookingTransactionId).toBe(
      observed.transaction.bookingTransactionId,
    );
    expect(replayed.appointmentRecord?.appointmentRecordId).toBe(
      observed.appointmentRecord?.appointmentRecordId,
    );
  });
});
