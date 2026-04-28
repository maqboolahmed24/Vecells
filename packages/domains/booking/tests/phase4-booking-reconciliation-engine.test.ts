import { describe, expect, it } from "vitest";
import {
  createPhase4BookingReconciliationService,
  createPhase4BookingReconciliationStore,
  parseBookingReconciliationEvidenceAtoms,
  type RecordBookingReconciliationAttemptInput,
  type SyncBookingReconciliationInput,
} from "../src/phase4-booking-reconciliation-engine.ts";

function buildSyncInput(
  seed = "292",
  overrides: Partial<SyncBookingReconciliationInput> = {},
): SyncBookingReconciliationInput {
  return {
    bookingCaseRef: `booking_case_${seed}`,
    bookingTransactionRef: `booking_transaction_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
    offerSessionRef: `offer_session_${seed}`,
    selectedSlotRef: `selected_slot_${seed}`,
    reservationTruthProjectionRef: `reservation_truth_${seed}`,
    confirmationTruthProjectionRef: `confirmation_truth_${seed}`,
    appointmentRecordRef: null,
    externalConfirmationGateRef: `external_gate_${seed}`,
    latestReceiptCheckpointRef: null,
    queueEntryRef: null,
    authoritativeReadAndConfirmationPolicyRef: `policy_${seed}`,
    authoritativeReadMode: "read_after_write",
    reconcileState: "poll_due",
    manualAttentionRequired: false,
    manualDisputeState: "none",
    gateState: "pending",
    gateConfidence: 0.55,
    competingGateMargin: 1,
    confirmationDeadlineAt: "2026-04-19T09:10:00.000Z",
    nextAttemptAt: "2026-04-19T09:00:30.000Z",
    finalOutcomeState: "confirmation_pending",
    latestReasonCodes: ["awaiting_authoritative_read"],
    evidenceRefs: ["initial_gate"],
    observedAt: "2026-04-19T09:00:00.000Z",
    ...overrides,
  };
}

function buildAttemptInput(
  recordRef: string,
  seed = "292",
  overrides: Partial<RecordBookingReconciliationAttemptInput> = {},
): RecordBookingReconciliationAttemptInput {
  return {
    bookingReconciliationRecordRef: recordRef,
    bookingCaseRef: `booking_case_${seed}`,
    bookingTransactionRef: `booking_transaction_${seed}`,
    trigger: "scheduled_read",
    workerRunRef: `worker_run_${seed}`,
    action: "observe_pending",
    outcome: "pending",
    observationKind: "confirmation_pending",
    authoritativeProofClass: null,
    providerReference: null,
    receiptCheckpointRef: `receipt_checkpoint_${seed}`,
    gateRef: `external_gate_${seed}`,
    reasonCodes: ["awaiting_authoritative_read"],
    evidenceRefs: [`evidence_${seed}`],
    evidenceAtoms: [
      {
        evidenceRef: `evidence_${seed}`,
        sourceFamily: "authoritative_read",
        proofRef: null,
        logLikelihoodWeight: 0.2,
        polarity: "positive",
      },
    ],
    competingGateConfidences: [0.3],
    manualOverrideRequested: false,
    nextAttemptAt: "2026-04-19T09:02:00.000Z",
    startedAt: "2026-04-19T09:01:00.000Z",
    completedAt: "2026-04-19T09:01:00.000Z",
    ...overrides,
  };
}

describe("phase4 booking reconciliation engine", () => {
  it("keeps one durable reconciliation record per booking transaction and does not regress final settlement state", async () => {
    const service = createPhase4BookingReconciliationService({
      repositories: createPhase4BookingReconciliationStore(),
    });

    const created = await service.syncBookingReconciliation(buildSyncInput("292_record"));
    expect(created.record.reconcileState).toBe("poll_due");
    expect(created.record.finalOutcomeState).toBe("confirmation_pending");

    const confirmed = await service.syncBookingReconciliation(
      buildSyncInput("292_record", {
        bookingReconciliationRecordId: created.record.bookingReconciliationRecordId,
        reconcileState: "confirmed",
        finalOutcomeState: "booked",
        appointmentRecordRef: "appointment_record_292_record",
        nextAttemptAt: null,
        observedAt: "2026-04-19T09:03:00.000Z",
      }),
    );
    expect(confirmed.record.reconcileState).toBe("confirmed");
    expect(confirmed.record.finalOutcomeState).toBe("booked");

    const replayedPending = await service.syncBookingReconciliation(
      buildSyncInput("292_record", {
        bookingReconciliationRecordId: created.record.bookingReconciliationRecordId,
        reconcileState: "poll_due",
        finalOutcomeState: "confirmation_pending",
        observedAt: "2026-04-19T09:04:00.000Z",
      }),
    );
    expect(replayedPending.record.reconcileState).toBe("confirmed");
    expect(replayedPending.record.finalOutcomeState).toBe("booked");
    expect(replayedPending.record.appointmentRecordRef).toBe("appointment_record_292_record");
  });

  it("records append-only attempts and replays the same attempt key without widening history", async () => {
    const service = createPhase4BookingReconciliationService({
      repositories: createPhase4BookingReconciliationStore(),
    });

    const created = await service.syncBookingReconciliation(buildSyncInput("292_attempt"));
    const first = await service.recordBookingReconciliationAttempt(
      buildAttemptInput(created.record.bookingReconciliationRecordId, "292_attempt", {
        attemptKey: "stable_attempt_key_292",
      }),
    );
    expect(first.replayed).toBe(false);
    expect(first.attempt.attemptOrdinal).toBe(1);
    expect(parseBookingReconciliationEvidenceAtoms(first.attempt)).toHaveLength(1);

    const replay = await service.recordBookingReconciliationAttempt(
      buildAttemptInput(created.record.bookingReconciliationRecordId, "292_attempt", {
        attemptKey: "stable_attempt_key_292",
      }),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.attempt.bookingReconciliationAttemptId).toBe(
      first.attempt.bookingReconciliationAttemptId,
    );

    const bundle = await service.queryCurrentBookingReconciliation({
      bookingTransactionRef: "booking_transaction_292_attempt",
    });
    expect(bundle?.attempts).toHaveLength(1);
    expect(bundle?.record.currentAttemptOrdinal).toBe(1);
  });

  it("lists due reconciliations by nextAttemptAt while excluding final records", async () => {
    const service = createPhase4BookingReconciliationService({
      repositories: createPhase4BookingReconciliationStore(),
    });

    await service.syncBookingReconciliation(buildSyncInput("292_due_a"));
    await service.syncBookingReconciliation(
      buildSyncInput("292_due_b", {
        nextAttemptAt: "2026-04-19T09:05:00.000Z",
        observedAt: "2026-04-19T09:00:10.000Z",
      }),
    );
    await service.syncBookingReconciliation(
      buildSyncInput("292_due_final", {
        reconcileState: "failed",
        finalOutcomeState: "failed",
        nextAttemptAt: null,
        observedAt: "2026-04-19T09:00:20.000Z",
      }),
    );

    const due = await service.listDueBookingReconciliations("2026-04-19T09:03:00.000Z");
    expect(due.map((entry) => entry.record.bookingTransactionRef)).toEqual([
      "booking_transaction_292_due_a",
    ]);
  });
});
