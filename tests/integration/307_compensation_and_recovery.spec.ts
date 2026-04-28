import { describe, expect, it } from "vitest";

import { setupBookingCoreFlow } from "./307_booking_core.helpers.ts";

function buildPendingCommitInput(
  flow: Awaited<ReturnType<typeof setupBookingCoreFlow>>,
) {
  return {
    bookingCaseId: `booking_case_${flow.seed}`,
    offerSessionId: flow.offerSession!.offerSessionId,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `begin_commit_action_${flow.seed}`,
    commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
    occurredAt: "2026-04-22T12:25:00.000Z",
    idempotencyKey: `idempotency_key_${flow.seed}`,
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
    payloadArtifactRef: `artifact://booking/commit/${flow.seed}`,
    edgeCorrelationId: `edge_commit_${flow.seed}`,
  };
}

describe("307 compensation and recovery", () => {
  it("reconciles a pending transaction to failed truth with released reservation and an open exception", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_reconcile_failed",
      forceExclusiveHold: true,
    });
    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer(
      buildPendingCommitInput(flow),
    );

    const reconciled = await flow.bookingCommitApplication.reconcileAmbiguousTransaction({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `reconcile_ambiguous_action_${flow.seed}`,
      commandSettlementRecordRef: `reconcile_ambiguous_settlement_${flow.seed}`,
      reconciledAt: "2026-04-22T12:27:00.000Z",
      resolution: {
        kind: "failed",
        failureReasonCode: "supplier_rejected_after_local_pending",
      },
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/reconcile-failed`,
      edgeCorrelationId: `edge_reconcile_failed_${flow.seed}`,
    });

    expect(reconciled.transaction.authoritativeOutcomeState).toBe("failed");
    expect(reconciled.transaction.commitState).toBe("failed");
    expect(reconciled.reservationTruth?.projection.truthState).toBe("released");
    expect(reconciled.reservationTruth?.reservation.terminalReasonCode).toBe(
      "supplier_rejected_after_local_pending",
    );
    expect(reconciled.bookingCase.bookingCase.status).toBe("booking_failed");
    expect(reconciled.bookingException).toMatchObject({
      exceptionClass: "authoritative_failure",
      exceptionState: "open",
      reasonCode: "supplier_rejected_after_local_pending",
    });
  });

  it("keeps failed-transaction supersession append-only and resolves the recovery chain without double-booking", async () => {
    const flow = await setupBookingCoreFlow({
      seed: "307_supersede_failed",
    });
    const failed = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:40:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${flow.seed}`,
        settlementRef: `settlement_${flow.seed}`,
      },
      expectedSelectionProofHash: flow.offerSession!.selectionProofHash,
      expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
      expectedOwnershipEpochRef: 4,
      expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
      expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
      expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
      reviewActionLeaseRef: `review_action_lease_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/failed`,
      edgeCorrelationId: `edge_commit_failed_${flow.seed}`,
    });
    const superseded = await flow.bookingCommitApplication.releaseOrSupersedeFailedTransaction({
      bookingTransactionId: failed.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `release_failed_action_${flow.seed}`,
      commandSettlementRecordRef: `release_failed_settlement_${flow.seed}`,
      releasedAt: "2026-04-22T12:42:00.000Z",
      reasonCodes: ["superseded_by_fresh_retry"],
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/supersede`,
      edgeCorrelationId: `edge_supersede_${flow.seed}`,
    });

    expect(failed.transaction.authoritativeOutcomeState).toBe("failed");
    expect(superseded.transaction.authoritativeOutcomeState).toBe("superseded");
    expect(superseded.confirmationTruthProjection.confirmationTruthState).toBe("superseded");
    expect(superseded.bookingException?.exceptionState).toBe("superseded");
    expect(superseded.reservationTruth).toBeNull();
    expect(superseded.appointmentRecord).toBeNull();
  });
});
