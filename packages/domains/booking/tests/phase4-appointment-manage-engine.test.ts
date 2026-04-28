import { describe, expect, it } from "vitest";
import {
  createPhase4AppointmentManageService,
  createPhase4AppointmentManageStore,
  evaluateCancelablePredicate,
  evaluateReschedulablePredicate,
  type PersistAppointmentManageOutcomeInput,
} from "../src/phase4-appointment-manage-engine.ts";

function buildOutcomeInput(
  seed = "288",
  overrides: Partial<PersistAppointmentManageOutcomeInput> = {},
): PersistAppointmentManageOutcomeInput {
  return {
    appointmentId: `appointment_${seed}`,
    bookingCaseId: `booking_case_${seed}`,
    actionScope: "appointment_cancel",
    routeIntentBindingRef: `route_intent_${seed}`,
    routeIntentTupleHash: `route_tuple_${seed}`,
    canonicalObjectDescriptorRef: "AppointmentRecord",
    governingObjectVersionRef: `appointment_record::appointment_${seed}::v1`,
    routeContractDigest: `route_digest_${seed}`,
    policyBundleRef: `policy_bundle_${seed}`,
    capabilityResolutionRef: `capability_resolution_${seed}`,
    capabilityTupleHash: `capability_tuple_${seed}`,
    providerAdapterBindingRef: `provider_binding_${seed}`,
    providerAdapterBindingHash: `provider_binding_hash_${seed}`,
    freshnessToken: `freshness_${seed}`,
    governingFenceEpoch: 7,
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    idempotencyKey: `idempotency_${seed}`,
    actorMode: "staff",
    selectedAnchorRef: `appointment_${seed}`,
    routeFamilyRef: "staff_booking_manage",
    experienceContinuityEvidenceRef: `experience_continuity_${seed}`,
    continuityState: "summary_only",
    writableState: "summary_only",
    bookingConfirmationTruthProjectionRef: `confirmation_truth_${seed}`,
    appointmentLineageRef: `appointment_lineage_${seed}`,
    appointmentRecordRef: `appointment_${seed}`,
    result: "applied",
    reasonCodes: ["seeded_manage_outcome"],
    recordedAt: "2026-04-18T16:00:00.000Z",
    ...overrides,
  };
}

describe("phase4 appointment manage engine", () => {
  it("persists a cancellation bundle, emits canonical events, and replays by idempotency key", async () => {
    const service = createPhase4AppointmentManageService({
      repositories: createPhase4AppointmentManageStore(),
    });

    const created = await service.submitCancellation(
      buildOutcomeInput("288_cancel", {
        emitBookingCancelledEvent: true,
      }),
    );

    expect(created.replayed).toBe(false);
    expect(created.command.actionScope).toBe("appointment_cancel");
    expect(created.settlement.result).toBe("applied");
    expect(created.continuityEvidence.latestManageCommandRef).toBe(
      created.command.appointmentManageCommandId,
    );
    expect(created.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.manage.continuity.updated",
      "booking.cancelled",
    ]);

    const replay = await service.submitCancellation(
      buildOutcomeInput("288_cancel", {
        emitBookingCancelledEvent: true,
      }),
    );

    expect(replay.replayed).toBe(true);
    expect(replay.command.appointmentManageCommandId).toBe(created.command.appointmentManageCommandId);
    expect(replay.settlement.bookingManageSettlementId).toBe(
      created.settlement.bookingManageSettlementId,
    );
    expect(replay.emittedEvents).toEqual([]);
  });

  it("persists reschedule start and refreshes current continuity evidence deterministically", async () => {
    const service = createPhase4AppointmentManageService({
      repositories: createPhase4AppointmentManageStore(),
    });

    const created = await service.submitReschedule(
      buildOutcomeInput("288_reschedule", {
        actionScope: "appointment_reschedule",
        continuityState: "summary_only",
        writableState: "summary_only",
        emitBookingRescheduleStartedEvent: true,
      }),
    );

    expect(created.settlement.actionScope).toBe("appointment_reschedule");
    expect(created.emittedEvents.map((event) => event.eventType)).toEqual([
      "booking.manage.continuity.updated",
      "booking.reschedule.started",
    ]);

    const refreshed = await service.refreshContinuityEvidence({
      bookingCaseId: "booking_case_288_reschedule",
      appointmentId: "appointment_288_reschedule",
      appointmentRecordRef: "appointment_288_reschedule",
      bookingConfirmationTruthProjectionRef: "confirmation_truth_288_reschedule",
      appointmentLineageRef: "appointment_lineage_288_reschedule",
      selectedAnchorRef: "appointment_288_reschedule",
      routeFamilyRef: "staff_booking_manage",
      routeIntentBindingRef: "route_intent_288_reschedule",
      routeIntentTupleHash: "route_tuple_refresh_288_reschedule",
      capabilityResolutionRef: "capability_resolution_288_reschedule",
      capabilityTupleHash: "capability_tuple_288_reschedule",
      providerAdapterBindingRef: "provider_binding_288_reschedule",
      providerAdapterBindingHash: "provider_binding_hash_288_reschedule",
      surfacePublicationRef: "surface_publication_288_reschedule",
      runtimePublicationBundleRef: "runtime_publication_288_reschedule",
      latestManageSettlementRef: created.settlement.bookingManageSettlementId,
      latestManageCommandRef: created.command.appointmentManageCommandId,
      experienceContinuityEvidenceRef: "experience_continuity_288_reschedule",
      continuityState: "live",
      writableState: "writable",
      generatedAt: "2026-04-18T16:05:00.000Z",
    });

    expect(refreshed.continuityState).toBe("live");
    expect(refreshed.writableState).toBe("writable");

    const current = await service.queryCurrentAppointmentManage("appointment_288_reschedule");
    expect(current?.continuityEvidence.bookingContinuityEvidenceProjectionId).toBe(
      refreshed.bookingContinuityEvidenceProjectionId,
    );
    expect(current?.settlement.bookingManageSettlementId).toBe(
      created.settlement.bookingManageSettlementId,
    );
  });

  it("stores detail-update and reminder-change outcomes through the same command law", async () => {
    const service = createPhase4AppointmentManageService({
      repositories: createPhase4AppointmentManageStore(),
    });

    const detailUpdate = await service.submitDetailUpdate(
      buildOutcomeInput("288_detail", {
        actionScope: "appointment_detail_update",
        continuityState: "live",
        writableState: "writable",
        semanticPayload: {
          details: {
            contactPhone: "07123456789",
            accessibilityNotes: "Wheelchair access requested",
          },
        },
      }),
    );

    expect(detailUpdate.settlement.actionScope).toBe("appointment_detail_update");
    expect(detailUpdate.settlement.result).toBe("applied");

    const reminderChange = await service.submitDetailUpdate(
      buildOutcomeInput("288_reminder", {
        actionScope: "reminder_change",
        continuityState: "summary_only",
        writableState: "summary_only",
        semanticPayload: {
          details: {
            reminderChannel: "sms",
          },
        },
      }),
    );

    expect(reminderChange.settlement.actionScope).toBe("reminder_change");
    expect(reminderChange.settlement.result).toBe("applied");
  });

  it("evaluates cancelable and reschedulable predicates from cutoff and fence state", () => {
    expect(
      evaluateCancelablePredicate({
        appointmentStartAt: "2026-04-18T17:00:00.000Z",
        evaluatedAt: "2026-04-18T15:00:00.000Z",
        cutoffMinutes: 60,
        hasLiveFence: false,
        appointmentStatus: "booked",
      }),
    ).toBe(true);
    expect(
      evaluateCancelablePredicate({
        appointmentStartAt: "2026-04-18T15:20:00.000Z",
        evaluatedAt: "2026-04-18T15:00:00.000Z",
        cutoffMinutes: 30,
        hasLiveFence: false,
        appointmentStatus: "booked",
      }),
    ).toBe(false);
    expect(
      evaluateReschedulablePredicate({
        appointmentStartAt: "2026-04-18T18:00:00.000Z",
        evaluatedAt: "2026-04-18T15:00:00.000Z",
        cutoffMinutes: 90,
        hasLiveFence: false,
        appointmentStatus: "booked",
      }),
    ).toBe(true);
    expect(
      evaluateReschedulablePredicate({
        appointmentStartAt: "2026-04-18T18:00:00.000Z",
        evaluatedAt: "2026-04-18T15:00:00.000Z",
        cutoffMinutes: 90,
        hasLiveFence: true,
        appointmentStatus: "booked",
      }),
    ).toBe(false);
  });
});
