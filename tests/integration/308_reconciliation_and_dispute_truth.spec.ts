import { describe, expect, it } from "vitest";

import { setupReconciliationFlow } from "./308_manage_waitlist_assisted.helpers.ts";

describe("308 reconciliation and dispute truth", () => {
  it("keeps callbacks pending until authoritative read confirms and replays the same read onto one appointment chain", async () => {
    const flow = await setupReconciliationFlow({
      seed: "308_read_after_write",
      supplierRef: "optum_emis_web",
      integrationMode: "im1_patient_api",
      deploymentType: "internet_patient_shell",
      audience: "patient",
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
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
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}`,
      edgeCorrelationId: `edge_commit_${flow.seed}`,
    });

    const callbackPending = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}`,
      observedAt: "2026-04-22T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "confirmed", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "confirmed",
      providerReference: `provider_reference_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}`,
    });

    expect(callbackPending.bookingCommit.transaction.authoritativeOutcomeState).toBe(
      "confirmation_pending",
    );
    expect(callbackPending.bookingCommit.appointmentRecord).toBeNull();
    expect(callbackPending.externalConfirmationGate?.state).not.toBe("confirmed");

    const confirmed = await flow.reconciliationApplication.forceReconcileAttempt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `force_reconcile_action_${flow.seed}`,
      commandSettlementRecordRef: `force_reconcile_settlement_${flow.seed}`,
      attemptedAt: "2026-04-22T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-22T12:27:00.000Z",
        outcome: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
        sourceFamily: "authoritative_read",
        hardMatchRefs: {
          selected_slot: "matched",
          patient_identity: "matched",
          appointment_window: "matched",
        },
        competingGateConfidences: [0.2],
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/read`,
      edgeCorrelationId: `edge_reconciliation_read_${flow.seed}`,
    });

    expect(confirmed.bookingCommit.transaction.authoritativeOutcomeState).toBe("booked");
    expect(confirmed.bookingCommit.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(confirmed.externalConfirmationGate?.state).toBe("confirmed");
    expect(confirmed.reconciliation.attempts.length).toBe(2);

    const replayed = await flow.reconciliationApplication.forceReconcileAttempt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `force_reconcile_action_${flow.seed}_replay`,
      commandSettlementRecordRef: `force_reconcile_settlement_${flow.seed}_replay`,
      attemptedAt: "2026-04-22T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-22T12:27:00.000Z",
        outcome: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
        sourceFamily: "authoritative_read",
        hardMatchRefs: {
          selected_slot: "matched",
          patient_identity: "matched",
          appointment_window: "matched",
        },
        competingGateConfidences: [0.2],
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/read/replay`,
      edgeCorrelationId: `edge_reconciliation_read_${flow.seed}_replay`,
    });

    expect(replayed.bookingCommit.appointmentRecord?.appointmentRecordId).toBe(
      confirmed.bookingCommit.appointmentRecord?.appointmentRecordId,
    );
    expect(replayed.reconciliation.attempts.length).toBe(2);
  });

  it("collapses duplicate and stale callbacks onto one pending transaction chain", async () => {
    const flow = await setupReconciliationFlow({
      seed: "308_duplicate_callbacks",
      supplierRef: "vecells_local_gateway",
      integrationMode: "local_gateway_component",
      deploymentType: "practice_local_gateway",
      audience: "staff",
      forceExclusiveHold: true,
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
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
    });

    const first = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}`,
      observedAt: "2026-04-22T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "accepted",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt/first`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_first`,
    });

    const duplicate = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}_duplicate`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}_duplicate`,
      observedAt: "2026-04-22T12:26:10.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "accepted",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt/duplicate`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_duplicate`,
    });

    const stale = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}_stale`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}_stale`,
      observedAt: "2026-04-22T12:26:20.000Z",
      transportMessageId: `transport_message_${flow.seed}_stale`,
      orderingKey: "0001",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "accepted",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt/stale`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_stale`,
    });

    expect(first.bookingCommit.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(duplicate.bookingCommit.appointmentRecord).toBeNull();
    expect(stale.bookingCommit.appointmentRecord).toBeNull();
    expect(stale.bookingCommit.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(stale.reconciliation.record.currentAttemptOrdinal).toBeGreaterThanOrEqual(1);
  });

  it("opens manual attention on secure-callback failure and closes the dispute with one final booked truth", async () => {
    const flow = await setupReconciliationFlow({
      seed: "308_manual_attention",
      supplierRef: "vecells_local_gateway",
      integrationMode: "local_gateway_component",
      deploymentType: "practice_local_gateway",
      audience: "staff",
      forceExclusiveHold: true,
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
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
    });

    const failedSecurity = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `secure_receipt_action_${flow.seed}`,
      commandSettlementRecordRef: `secure_receipt_settlement_${flow.seed}`,
      observedAt: "2026-04-22T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}_secure`,
      orderingKey: "0002",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      signatureVerification: "failed",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/secure`,
      edgeCorrelationId: `edge_reconciliation_secure_${flow.seed}`,
    });

    expect(failedSecurity.manualQueueEntry?.exceptionFamily).toBe("ambiguous_commit");
    expect(failedSecurity.reconciliation.record.manualAttentionRequired).toBe(true);
    expect(failedSecurity.bookingCommit.transaction.authoritativeOutcomeState).toBe(
      "confirmation_pending",
    );

    const conflicting = await flow.reconciliationApplication.forceReconcileAttempt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `force_reconcile_action_${flow.seed}`,
      commandSettlementRecordRef: `force_reconcile_settlement_${flow.seed}`,
      attemptedAt: "2026-04-22T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-22T12:27:00.000Z",
        outcome: "conflict",
        providerReference: `provider_reference_${flow.seed}`,
        sourceFamily: "authoritative_read",
        reasonCode: "provider_reference_slot_conflict",
        hardMatchRefs: {
          selected_slot: "failed",
          patient_identity: "matched",
          appointment_window: "matched",
        },
        competingGateConfidences: [0.79],
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/conflict`,
      edgeCorrelationId: `edge_reconciliation_conflict_${flow.seed}`,
    });

    expect(conflicting.bookingCommit.transaction.authoritativeOutcomeState).toBe(
      "reconciliation_required",
    );
    expect(conflicting.externalConfirmationGate?.state).toBe("disputed");

    const resolved = await flow.reconciliationApplication.resolveManualDispute({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `resolve_manual_dispute_action_${flow.seed}`,
      commandSettlementRecordRef: `resolve_manual_dispute_settlement_${flow.seed}`,
      resolvedAt: "2026-04-22T12:29:00.000Z",
      auditReasonCode: "operator_confirmed_after_manual_check",
      resolution: {
        kind: "confirmed",
        authoritativeProofClass: "reconciled_confirmation",
        providerReference: `provider_reference_${flow.seed}`,
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/manual_resolution`,
      edgeCorrelationId: `edge_reconciliation_manual_resolution_${flow.seed}`,
    });

    expect(resolved.bookingCommit.transaction.authoritativeOutcomeState).toBe("booked");
    expect(resolved.bookingCommit.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(resolved.manualQueueEntry).toBeNull();
    expect(resolved.reconciliation.record.manualAttentionRequired).toBe(false);
  });
});
