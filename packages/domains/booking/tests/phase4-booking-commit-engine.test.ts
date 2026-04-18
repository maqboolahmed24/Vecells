import { describe, expect, it } from "vitest";
import {
  createPhase4BookingCommitService,
  createPhase4BookingCommitStore,
  type BeginBookingCommitInput,
  type BookingCommitPolicySnapshot,
} from "../src/phase4-booking-commit-engine.ts";

function buildPolicy(
  overrides: Partial<BookingCommitPolicySnapshot> = {},
): BookingCommitPolicySnapshot {
  return {
    authoritativeReadAndConfirmationPolicyRef: "confirmation_policy_287",
    authoritativeReadMode: "durable_provider_reference",
    allowedAuthoritativeProofClasses: [
      "durable_provider_reference",
      "same_commit_read_after_write",
      "reconciled_confirmation",
    ],
    supportsAsyncCommitConfirmation: true,
    supportsDisputeRecovery: true,
    manageExposureBeforeProof: "summary_only",
    patientVisibilityBeforeProof: "provisional_receipt",
    ...overrides,
  };
}

function buildBeginCommitInput(
  seed = "287",
  overrides: Partial<BeginBookingCommitInput> = {},
): BeginBookingCommitInput {
  return {
    bookingTransactionId: `booking_transaction_${seed}`,
    bookingCaseId: `booking_case_${seed}`,
    episodeRef: `episode_${seed}`,
    requestId: `request_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    snapshotId: `slot_snapshot_${seed}`,
    offerSessionRef: `offer_session_${seed}`,
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    selectedSlotRef: `normalized_slot_${seed}`,
    canonicalReservationKey: `canonical_reservation_key_${seed}`,
    selectedCandidateHash: `selected_candidate_hash_${seed}`,
    selectionProofHash: `selection_proof_hash_${seed}`,
    policyBundleHash: `policy_bundle_hash_${seed}`,
    capabilityResolutionRef: `capability_resolution_${seed}`,
    providerAdapterBindingRef: `provider_binding_${seed}`,
    providerAdapterBindingHash: `provider_binding_hash_${seed}`,
    adapterContractProfileRef: `adapter_profile_${seed}`,
    capabilityTupleHash: `capability_tuple_hash_${seed}`,
    authoritativeReadAndConfirmationPolicy: buildPolicy(),
    reservationTruthProjectionRef: `reservation_truth_projection_${seed}`,
    idempotencyKey: `idempotency_key_${seed}`,
    preflightVersion: `preflight_version_${seed}`,
    reservationVersion: 1,
    reservationVersionRef: `reservation_version_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    requestOwnershipEpochRef: 3,
    reviewActionLeaseRef: null,
    fencingToken: `fence_${seed}`,
    dispatchEffectKeyRef: `dispatch_effect_${seed}`,
    dispatchAttemptRef: `dispatch_attempt_${seed}`,
    latestReceiptCheckpointRef: null,
    holdState: "held",
    commandActionRecordRef: `command_action_${seed}`,
    commandSettlementRecordRef: `command_settlement_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    subjectRef: `actor_${seed}`,
    payloadArtifactRef: `artifact://booking/commit/${seed}`,
    edgeCorrelationId: `edge_${seed}`,
    surfaceRouteContractRef: `surface_route_${seed}`,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    releaseRecoveryDispositionRef: null,
    transitionEnvelopeRef: null,
    occurredAt: "2026-04-18T15:00:00.000Z",
    preflightFailureReasonCodes: [],
    guardedRecheckFailureReasonCodes: [],
    safetyPreemptionReasonCode: null,
    compensationReasonCodes: [],
    dispatchOutcome: {
      kind: "authoritative_success",
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_ref_${seed}`,
      settlementRef: `settlement_${seed}`,
    },
    ...overrides,
  };
}

describe("phase4 booking commit engine", () => {
  it("creates authoritative success by durable provider reference and replays by idempotency key", async () => {
    const service = createPhase4BookingCommitService({
      repositories: createPhase4BookingCommitStore(),
    });

    const created = await service.beginCommit(buildBeginCommitInput("287_success"));
    expect(created.replayed).toBe(false);
    expect(created.transaction.authoritativeOutcomeState).toBe("booked");
    expect(created.confirmationTruthProjection.confirmationTruthState).toBe("confirmed");
    expect(created.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(created.bookingException).toBeNull();
    expect(created.emittedEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "booking.commit.started",
        "booking.commit.confirmed",
        "booking.confirmation.truth.updated",
        "booking.appointment.created",
      ]),
    );

    const replay = await service.beginCommit(buildBeginCommitInput("287_success"));
    expect(replay.replayed).toBe(true);
    expect(replay.transaction.bookingTransactionId).toBe(created.transaction.bookingTransactionId);
    expect(replay.journal).toHaveLength(1);
  });

  it("keeps async acceptance in confirmation_pending until a later authoritative observation arrives", async () => {
    const service = createPhase4BookingCommitService({
      repositories: createPhase4BookingCommitStore(),
    });

    const created = await service.beginCommit(
      buildBeginCommitInput("287_pending", {
        dispatchOutcome: {
          kind: "confirmation_pending",
          blockerReasonCode: "awaiting_supplier_commit",
          recoveryMode: "awaiting_external_confirmation",
          externalConfirmationGateRef: "external_gate_287_pending",
          providerReference: "provider_reference_pending",
        },
      }),
    );

    expect(created.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(created.confirmationTruthProjection.confirmationTruthState).toBe("confirmation_pending");
    expect(created.appointmentRecord).toBeNull();

    const observed = await service.ingestAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      latestReceiptCheckpointRef: "receipt_checkpoint_287_pending",
      receiptDecisionClass: "accepted_new",
      providerCorrelationRef: "provider_correlation_287_pending",
      observedAt: "2026-04-18T15:05:00.000Z",
      observationKind: "same_commit_read_after_write",
      authoritativeProofClass: "same_commit_read_after_write",
      providerReference: "provider_reference_pending",
      externalConfirmationGateRef: null,
      blockerReasonCode: null,
      recoveryMode: null,
      failureReasonCode: null,
      commandActionRecordRef: "observation_action_287_pending",
      commandSettlementRecordRef: "observation_settlement_287_pending",
      routeIntentBindingRef: "route_intent_287_pending",
      subjectRef: "actor_287_pending",
      payloadArtifactRef: "artifact://booking/commit/287_pending/receipt",
      edgeCorrelationId: "edge_287_pending_receipt",
    });

    expect(observed.transaction.authoritativeOutcomeState).toBe("booked");
    expect(observed.confirmationTruthProjection.confirmationTruthState).toBe("confirmed");
    expect(observed.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(
      observed.journal.map((entry) => entry.nextConfirmationTruthState),
    ).toEqual(["confirmation_pending", "confirmed"]);
  });

  it("routes divergent callbacks into reconciliation instead of minting a second appointment narrative", async () => {
    const service = createPhase4BookingCommitService({
      repositories: createPhase4BookingCommitStore(),
    });

    const created = await service.beginCommit(
      buildBeginCommitInput("287_conflict", {
        dispatchOutcome: {
          kind: "confirmation_pending",
          blockerReasonCode: "awaiting_supplier_commit",
          recoveryMode: "awaiting_external_confirmation",
          externalConfirmationGateRef: "external_gate_287_conflict",
          providerReference: "provider_reference_conflict",
        },
      }),
    );

    expect(created.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(created.appointmentRecord).toBeNull();

    const observed = await service.ingestAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      latestReceiptCheckpointRef: "receipt_checkpoint_287_conflict",
      receiptDecisionClass: "collision_review",
      providerCorrelationRef: "provider_correlation_287_conflict",
      observedAt: "2026-04-18T15:06:00.000Z",
      observationKind: "reconciliation_required",
      authoritativeProofClass: null,
      providerReference: "provider_reference_conflict",
      externalConfirmationGateRef: "external_gate_287_conflict",
      blockerReasonCode: "receipt_collision_review",
      recoveryMode: "reconcile_divergent_receipt",
      failureReasonCode: null,
      commandActionRecordRef: "observation_action_287_conflict",
      commandSettlementRecordRef: "observation_settlement_287_conflict",
      routeIntentBindingRef: "route_intent_287_conflict",
      subjectRef: "actor_287_conflict",
      payloadArtifactRef: "artifact://booking/commit/287_conflict/receipt",
      edgeCorrelationId: "edge_287_conflict_receipt",
    });

    expect(observed.transaction.authoritativeOutcomeState).toBe("reconciliation_required");
    expect(observed.confirmationTruthProjection.confirmationTruthState).toBe(
      "reconciliation_required",
    );
    expect(observed.appointmentRecord).toBeNull();
    expect(observed.bookingException?.reasonCode).toBe("receipt_collision_review");
  });

  it("supersedes failed transactions without rewriting the original chain", async () => {
    const service = createPhase4BookingCommitService({
      repositories: createPhase4BookingCommitStore(),
    });

    const created = await service.beginCommit(
      buildBeginCommitInput("287_release", {
        dispatchOutcome: {
          kind: "dispatch_failed",
          failureReasonCode: "dispatch_transport_timeout",
        },
      }),
    );

    const superseded = await service.releaseOrSupersedeFailedTransaction({
      bookingTransactionId: created.transaction.bookingTransactionId,
      releasedAt: "2026-04-18T15:08:00.000Z",
      reasonCodes: ["superseded_by_fresh_retry"],
      commandActionRecordRef: "release_action_287",
      commandSettlementRecordRef: "release_settlement_287",
      routeIntentBindingRef: "route_intent_287_release",
      subjectRef: "actor_287_release",
      payloadArtifactRef: "artifact://booking/commit/287_release/supersede",
      edgeCorrelationId: "edge_287_release_supersede",
    });

    expect(superseded.transaction.authoritativeOutcomeState).toBe("superseded");
    expect(superseded.confirmationTruthProjection.confirmationTruthState).toBe("superseded");
    expect(superseded.bookingException?.exceptionState).toBe("superseded");
  });

  it("preserves monotone confirmation truth progression across pending, reconciliation, and confirmation", async () => {
    const service = createPhase4BookingCommitService({
      repositories: createPhase4BookingCommitStore(),
    });

    const created = await service.beginCommit(
      buildBeginCommitInput("287_monotone", {
        dispatchOutcome: {
          kind: "confirmation_pending",
          blockerReasonCode: "awaiting_supplier_commit",
          recoveryMode: "awaiting_external_confirmation",
          externalConfirmationGateRef: "external_gate_287_monotone",
          providerReference: "provider_reference_monotone",
        },
      }),
    );

    const disputed = await service.ingestAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      latestReceiptCheckpointRef: "receipt_checkpoint_287_monotone_disputed",
      receiptDecisionClass: "collision_review",
      providerCorrelationRef: "provider_correlation_287_monotone",
      observedAt: "2026-04-18T15:11:00.000Z",
      observationKind: "reconciliation_required",
      authoritativeProofClass: null,
      providerReference: "provider_reference_monotone",
      externalConfirmationGateRef: "external_gate_287_monotone",
      blockerReasonCode: "receipt_collision_review",
      recoveryMode: "reconcile_divergent_receipt",
      failureReasonCode: null,
      commandActionRecordRef: "observation_action_287_monotone_disputed",
      commandSettlementRecordRef: "observation_settlement_287_monotone_disputed",
      routeIntentBindingRef: "route_intent_287_monotone",
      subjectRef: "actor_287_monotone",
      payloadArtifactRef: "artifact://booking/commit/287_monotone/disputed",
      edgeCorrelationId: "edge_287_monotone_disputed",
    });

    const reconciled = await service.reconcileAmbiguousTransaction({
      bookingTransactionId: disputed.transaction.bookingTransactionId,
      reconciledAt: "2026-04-18T15:15:00.000Z",
      resolution: {
        kind: "confirmed",
        authoritativeProofClass: "reconciled_confirmation",
        providerReference: "provider_reference_monotone",
        externalConfirmationGateRef: "external_gate_287_monotone",
      },
      commandActionRecordRef: "reconcile_action_287_monotone",
      commandSettlementRecordRef: "reconcile_settlement_287_monotone",
      routeIntentBindingRef: "route_intent_287_monotone",
      subjectRef: "actor_287_monotone",
      payloadArtifactRef: "artifact://booking/commit/287_monotone/reconciled",
      edgeCorrelationId: "edge_287_monotone_reconciled",
    });

    expect(
      reconciled.journal.map((entry) => entry.nextConfirmationTruthState),
    ).toEqual(["confirmation_pending", "reconciliation_required", "confirmed"]);
    expect(reconciled.confirmationTruthProjection.confirmationTruthState).toBe("confirmed");
  });
});
