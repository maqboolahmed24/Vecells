import { describe, expect, it } from "vitest";
import {
  CapacityReservationDocument,
  ExternalConfirmationGateDocument,
  createReservationConfirmationAuthorityService,
  createReservationConfirmationSimulationHarness,
  createReservationConfirmationStore,
  defaultReservationConfirmationThresholdPolicy,
  validateExternalConfirmationGateState,
  validateReservationConfirmationBundle,
} from "../src/index.ts";

describe("reservation confirmation backbone", () => {
  it("rejects soft-selected reservations that pretend to be exclusive holds", async () => {
    const authority = createReservationConfirmationAuthorityService(
      createReservationConfirmationStore(),
    );

    await expect(
      authority.recordCapacityReservation({
        reservationId: "reservation_074_invalid_soft",
        capacityIdentityRef: "capacity_074_invalid_soft",
        canonicalReservationKey: "canonical_reservation_key_074_invalid_soft",
        sourceDomain: "booking_local",
        holderRef: "offer_session_invalid_soft",
        state: "soft_selected",
        commitMode: "exclusive_hold",
        supplierObservedAt: "2026-04-12T21:00:00Z",
      }),
    ).rejects.toThrow(/soft_selected.*exclusive_hold/i);
  });

  it("keeps weak or manual confirmation pending until two source families corroborate", () => {
    const gate = ExternalConfirmationGateDocument.create({
      gateId: "gate_074_manual_pending",
      episodeId: "episode_074_manual_pending",
      domain: "pharmacy_dispatch",
      domainObjectRef: "dispatch_attempt_074_manual_pending",
      transportMode: "manual_partner_phone",
      assuranceLevel: "manual",
      evidenceModelVersionRef: "evidence_model_074_v1",
      requiredHardMatchRefs: ["package_hash_match", "patient_identity_match"],
      positiveEvidenceRefs: ["ev_074_single_family"],
      negativeEvidenceRefs: [],
      proofRefs: ["proof_074_single_family"],
      confirmationDeadlineAt: "2026-04-12T21:10:00Z",
      priorProbability: 0.48,
      posteriorLogOdds: 2.2,
      confirmationConfidence: 1 / (1 + Math.exp(-2.2)),
      competingGateMargin: 0.66,
      state: "pending",
      createdAt: "2026-04-12T21:00:00Z",
      updatedAt: "2026-04-12T21:01:00Z",
      gateRevision: 1,
      thresholdPolicyRef: defaultReservationConfirmationThresholdPolicy.policyRef,
      tauHold: defaultReservationConfirmationThresholdPolicy.tauHold,
      tauConfirm: defaultReservationConfirmationThresholdPolicy.tauConfirm,
      deltaConfirm: defaultReservationConfirmationThresholdPolicy.deltaConfirm,
      sourceFamilyRefs: ["phone_witness"],
      satisfiedHardMatchRefs: ["package_hash_match", "patient_identity_match"],
      failedHardMatchRefs: [],
      contradictoryEvidenceRefs: [],
      manualOverrideRequested: false,
    });

    expect(gate.toSnapshot().state).toBe("pending");
    expect(() => validateExternalConfirmationGateState(gate.toSnapshot())).not.toThrow();
  });

  it("maps the lawful reservation state family to truthful projection semantics", async () => {
    const authority = createReservationConfirmationAuthorityService(
      createReservationConfirmationStore(),
    );
    const cases = [
      {
        state: "soft_selected" as const,
        commitMode: "truthful_nonexclusive" as const,
        expiresAt: "2026-04-18T12:05:00.000Z",
        confirmedAt: null,
        releasedAt: null,
        terminalReasonCode: null,
        truthState: "truthful_nonexclusive",
        displayExclusivityState: "nonexclusive",
        countdownMode: "none",
      },
      {
        state: "held" as const,
        commitMode: "exclusive_hold" as const,
        expiresAt: "2026-04-18T12:05:00.000Z",
        confirmedAt: null,
        releasedAt: null,
        terminalReasonCode: null,
        truthState: "exclusive_held",
        displayExclusivityState: "exclusive",
        countdownMode: "hold_expiry",
      },
      {
        state: "pending_confirmation" as const,
        commitMode: "degraded_manual_pending" as const,
        expiresAt: null,
        confirmedAt: null,
        releasedAt: null,
        terminalReasonCode: null,
        truthState: "pending_confirmation",
        displayExclusivityState: "none",
        countdownMode: "none",
      },
      {
        state: "confirmed" as const,
        commitMode: "degraded_manual_pending" as const,
        expiresAt: null,
        confirmedAt: "2026-04-18T12:06:00.000Z",
        releasedAt: null,
        terminalReasonCode: null,
        truthState: "confirmed",
        displayExclusivityState: "none",
        countdownMode: "none",
      },
      {
        state: "released" as const,
        commitMode: "truthful_nonexclusive" as const,
        expiresAt: null,
        confirmedAt: null,
        releasedAt: "2026-04-18T12:06:30.000Z",
        terminalReasonCode: "user_cancelled",
        truthState: "released",
        displayExclusivityState: "none",
        countdownMode: "none",
      },
      {
        state: "expired" as const,
        commitMode: "exclusive_hold" as const,
        expiresAt: "2026-04-18T12:07:00.000Z",
        confirmedAt: null,
        releasedAt: null,
        terminalReasonCode: "hold_ttl_elapsed",
        truthState: "expired",
        displayExclusivityState: "none",
        countdownMode: "none",
      },
      {
        state: "disputed" as const,
        commitMode: "degraded_manual_pending" as const,
        expiresAt: null,
        confirmedAt: null,
        releasedAt: null,
        terminalReasonCode: "supplier_conflict_detected",
        truthState: "disputed",
        displayExclusivityState: "none",
        countdownMode: "none",
      },
    ];

    for (const entry of cases) {
      const reservation = await authority.recordCapacityReservation({
        reservationId: `reservation_286_projection_${entry.state}`,
        capacityIdentityRef: `capacity_286_projection_${entry.state}`,
        canonicalReservationKey: `canonical_reservation_key_286_projection_${entry.state}`,
        sourceDomain: "booking_local",
        holderRef: `holder_286_projection_${entry.state}`,
        state: entry.state,
        commitMode: entry.commitMode,
        supplierObservedAt: "2026-04-18T12:00:00.000Z",
        expiresAt: entry.expiresAt,
        confirmedAt: entry.confirmedAt,
        releasedAt: entry.releasedAt,
        terminalReasonCode: entry.terminalReasonCode,
      });
      const projection = await authority.refreshReservationTruthProjection({
        reservationId: reservation.reservationId,
        sourceObjectRef: `source_object_286_projection_${entry.state}`,
        selectedAnchorRef: `selected_anchor_286_projection_${entry.state}`,
        projectionFreshnessEnvelopeRef: `freshness::286_projection_${entry.state}`,
        generatedAt: "2026-04-18T12:00:05.000Z",
        capacityIdentitySupportsExclusivity: true,
      });
      expect(projection.toSnapshot().truthState).toBe(entry.truthState);
      expect(projection.toSnapshot().displayExclusivityState).toBe(
        entry.displayExclusivityState,
      );
      expect(projection.toSnapshot().countdownMode).toBe(entry.countdownMode);
    }
  });

  it("forces contradictory evidence into disputed gate state", async () => {
    const harness = createReservationConfirmationSimulationHarness();
    const results = await harness.runAllScenarios();
    const disputed = results.find(
      (result) => result.scenarioId === "contradictory_competing_confirmation",
    );

    expect(disputed?.gate?.toSnapshot().state).toBe("disputed");
    expect(disputed?.gate?.toSnapshot().contradictoryEvidenceRefs).toContain(
      "ev_074_disputed_conflicting_callback",
    );
  });

  it("requires a confirmed gate before weak/manual confirmed reservations may reassure", () => {
    const reservation = CapacityReservationDocument.create({
      reservationId: "reservation_074_invalid_manual_confirmed",
      capacityIdentityRef: "capacity_074_invalid_manual_confirmed",
      canonicalReservationKey: "canonical_reservation_key_074_invalid_manual_confirmed",
      sourceDomain: "pharmacy_dispatch",
      holderRef: "dispatch_attempt_074_invalid_manual_confirmed",
      state: "confirmed",
      commitMode: "degraded_manual_pending",
      reservationVersion: 1,
      activeFencingToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      truthBasisHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      supplierObservedAt: "2026-04-12T21:20:00Z",
      revalidatedAt: null,
      expiresAt: null,
      confirmedAt: "2026-04-12T21:21:00Z",
      releasedAt: null,
      supersededByReservationRef: null,
      terminalReasonCode: null,
    }).toSnapshot();

    const projection = {
      reservationTruthProjectionId: "projection_074_invalid_manual_confirmed",
      capacityReservationRef: reservation.reservationId,
      canonicalReservationKey: reservation.canonicalReservationKey,
      sourceDomain: reservation.sourceDomain,
      sourceObjectRef: "dispatch_attempt_074_invalid_manual_confirmed",
      selectedAnchorRef: "pharmacy_row_074_invalid_manual_confirmed",
      truthState: "confirmed",
      displayExclusivityState: "none",
      countdownMode: "none",
      exclusiveUntilAt: null,
      reservationVersionRef: `${reservation.reservationId}@v1`,
      truthBasisHash: reservation.truthBasisHash,
      projectionFreshnessEnvelopeRef: "freshness::074_invalid_manual_confirmed",
      reasonRefs: ["authoritative_confirmation_seen"],
      generatedAt: "2026-04-12T21:21:02Z",
      projectionRevision: 1,
    } as const;

    const pendingGate = ExternalConfirmationGateDocument.create({
      gateId: "gate_074_invalid_manual_confirmed",
      episodeId: "episode_074_invalid_manual_confirmed",
      domain: "pharmacy_dispatch",
      domainObjectRef: "dispatch_attempt_074_invalid_manual_confirmed",
      transportMode: "manual_partner_phone",
      assuranceLevel: "manual",
      evidenceModelVersionRef: "evidence_model_074_v1",
      requiredHardMatchRefs: ["package_hash_match", "patient_identity_match"],
      positiveEvidenceRefs: ["ev_074_single_family_pending"],
      negativeEvidenceRefs: [],
      proofRefs: ["proof_074_single_family_pending"],
      confirmationDeadlineAt: "2026-04-12T21:40:00Z",
      priorProbability: 0.48,
      posteriorLogOdds: 0.9,
      confirmationConfidence: 1 / (1 + Math.exp(-0.9)),
      competingGateMargin: 0.3,
      state: "pending",
      createdAt: "2026-04-12T21:20:00Z",
      updatedAt: "2026-04-12T21:21:00Z",
      gateRevision: 1,
      thresholdPolicyRef: defaultReservationConfirmationThresholdPolicy.policyRef,
      tauHold: defaultReservationConfirmationThresholdPolicy.tauHold,
      tauConfirm: defaultReservationConfirmationThresholdPolicy.tauConfirm,
      deltaConfirm: defaultReservationConfirmationThresholdPolicy.deltaConfirm,
      sourceFamilyRefs: ["phone_witness"],
      satisfiedHardMatchRefs: ["package_hash_match", "patient_identity_match"],
      failedHardMatchRefs: [],
      contradictoryEvidenceRefs: [],
      manualOverrideRequested: false,
    }).toSnapshot();

    expect(() =>
      validateReservationConfirmationBundle({
        reservation,
        projection,
        gate: pendingGate,
      }),
    ).toThrow(/require a confirmed gate/i);
  });

  it("keeps the deterministic simulator aligned with the authoritative truth rules", async () => {
    const harness = createReservationConfirmationSimulationHarness();
    const results = await harness.runAllScenarios();

    expect(results).toHaveLength(8);

    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));
    expect(
      byScenario.soft_selection_without_hold.projection.toSnapshot().displayExclusivityState,
    ).toBe("nonexclusive");
    expect(
      byScenario.exclusive_hold_with_real_expiry.projection.toSnapshot().exclusiveUntilAt,
    ).toBe("2026-04-12T20:14:00Z");
    expect(byScenario.pending_external_confirmation.reservation.toSnapshot().state).toBe(
      "pending_confirmation",
    );
    expect(
      byScenario.weak_manual_two_family_confirmation.gate?.toSnapshot().sourceFamilyRefs,
    ).toEqual(["document_scan", "phone_witness"]);
  });
});
