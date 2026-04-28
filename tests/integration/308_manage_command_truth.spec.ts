import { describe, expect, it } from "vitest";

import {
  buildManageInput,
  buildSearchWindows,
  setupManagedAppointmentFlow,
} from "./308_manage_waitlist_assisted.helpers.ts";

describe("308 manage command truth", () => {
  it("never exposes writable manage posture from frozen publication, blocked continuity, or pending settlement", async () => {
    const flow = await setupManagedAppointmentFlow("308_manage_posture");

    const frozen = await flow.appointmentManageApplication.queryCurrentAppointmentManage({
      appointmentId: flow.appointmentRecord.appointmentRecordId,
      actorMode: "staff",
      publicationState: "frozen",
      assuranceTrustState: "read_only",
    });
    expect(frozen?.capability.resolved.resolution.capabilityState).toBe("recovery_only");
    expect(frozen?.capability.resolved.resolution.blockedActionReasonCodes).toEqual(
      expect.arrayContaining(["reason_publication_frozen", "reason_assurance_read_only"]),
    );

    const blocked = await flow.appointmentManageApplication.queryCurrentAppointmentManage({
      appointmentId: flow.appointmentRecord.appointmentRecordId,
      actorMode: "staff",
      continuityEvidenceState: "blocked",
    });
    expect(blocked?.continuityEvidence.continuityState).toBe("blocked_recovery");
    expect(blocked?.continuityEvidence.writableState).toBe("recovery_only");

    const pending = await flow.appointmentManageApplication.submitCancelAppointment({
      ...buildManageInput(flow, {
        commandActionRecordRef: "cancel_action_308_manage_posture",
        commandSettlementRecordRef: "cancel_settlement_308_manage_posture",
        idempotencyKey: "cancel_idempotency_308_manage_posture",
      }),
      cancelReasonCode: "patient_requested_cancellation",
      supplierOutcome: {
        kind: "supplier_pending",
        blockerReasonCode: "awaiting_supplier_cancellation",
        recoveryMode: "awaiting_cancellation_confirmation",
      },
    });

    expect(pending.currentManage?.settlement.result).toBe("supplier_pending");
    expect(pending.continuityEvidence.continuityState).toBe("summary_only");
    expect(pending.continuityEvidence.writableState).toBe("summary_only");
  });

  it("keeps cancel replay-safe and fails detail or reminder changes closed on stale tuples or route drift", async () => {
    const replayFlow = await setupManagedAppointmentFlow("308_manage_replay");
    const cancelInput = {
      ...buildManageInput(replayFlow, {
        commandActionRecordRef: "cancel_action_308_manage_replay",
        commandSettlementRecordRef: "cancel_settlement_308_manage_replay",
        idempotencyKey: "cancel_idempotency_308_manage_replay",
      }),
      cancelReasonCode: "patient_requested_cancellation",
      supplierOutcome: {
        kind: "supplier_pending" as const,
        blockerReasonCode: "awaiting_supplier_cancellation",
        recoveryMode: "awaiting_cancellation_confirmation",
      },
    };

    const first =
      await replayFlow.appointmentManageApplication.submitCancelAppointment(cancelInput);
    const replay =
      await replayFlow.appointmentManageApplication.submitCancelAppointment(cancelInput);
    expect(first.currentManage?.settlement.result).toBe("supplier_pending");
    expect(replay.replayed).toBe(true);
    expect(replay.currentManage?.command.appointmentManageCommandId).toBe(
      first.currentManage?.command.appointmentManageCommandId,
    );
    expect(replay.currentManage?.settlement.bookingManageSettlementId).toBe(
      first.currentManage?.settlement.bookingManageSettlementId,
    );

    const staleDetailFlow = await setupManagedAppointmentFlow("308_manage_detail_stale");
    const staleDetail =
      await staleDetailFlow.appointmentManageApplication.submitAppointmentDetailUpdate({
        ...buildManageInput(staleDetailFlow, {
          commandActionRecordRef: "detail_action_308_manage_detail_stale",
          commandSettlementRecordRef: "detail_settlement_308_manage_detail_stale",
          idempotencyKey: "detail_idempotency_308_manage_detail_stale",
          expectedRouteIntentTupleHash: "stale_route_tuple_hash",
          expectedCapabilityTupleHash: "stale_capability_tuple_hash",
          expectedContinuityEvidenceRef: "stale_continuity_ref",
        }),
        details: {
          administrativeNote: "Please leave at reception",
        },
      });

    expect(staleDetail.currentManage?.settlement.result).toBe("stale_recoverable");
    expect(staleDetail.currentManage?.settlement.reasonCodes).toEqual(
      expect.arrayContaining([
        "stale_route_tuple",
        "stale_capability_tuple",
        "stale_continuity_evidence",
      ]),
    );
    expect(staleDetail.appointmentRecord.administrativeDetails).toEqual({});

    const staleReminderFlow = await setupManagedAppointmentFlow("308_manage_reminder_stale");
    const staleReminder =
      await staleReminderFlow.appointmentManageApplication.submitAppointmentDetailUpdate({
        ...buildManageInput(staleReminderFlow, {
          commandActionRecordRef: "detail_action_308_manage_reminder_stale",
          commandSettlementRecordRef: "detail_settlement_308_manage_reminder_stale",
          idempotencyKey: "detail_idempotency_308_manage_reminder_stale",
          expectedRouteIntentTupleHash: "stale_reminder_route_tuple_hash",
        }),
        updateScope: "reminder_change",
        details: {
          reminderChannel: "email",
        },
      });

    expect(staleReminder.currentManage?.settlement.result).toBe("stale_recoverable");
    expect(staleReminder.currentManage?.settlement.reasonCodes).toContain("stale_route_tuple");
    expect(staleReminder.appointmentRecord.administrativeDetails).toEqual({});
  });

  it("starts a governed reschedule chain and can abandon it back to the source appointment linearly", async () => {
    const flow = await setupManagedAppointmentFlow("308_manage_reschedule");

    const started = await flow.appointmentManageApplication.submitRescheduleAppointment({
      ...buildManageInput(flow, {
        commandActionRecordRef: "reschedule_action_308_manage_reschedule",
        commandSettlementRecordRef: "reschedule_settlement_308_manage_reschedule",
        idempotencyKey: "reschedule_idempotency_308_manage_reschedule",
      }),
      bootstrapReplacementSearch: {
        displayTimeZone: "Europe/London",
        supplierWindows: buildSearchWindows("308_manage_reschedule_replacement").map((window) => ({
          ...window,
          supplierRef: "gp_connect_existing",
        })),
        searchCommandActionRecordRef: "replacement_search_action_308_manage_reschedule",
        searchCommandSettlementRecordRef: "replacement_search_settlement_308_manage_reschedule",
        offerCommandActionRecordRef: "replacement_offer_action_308_manage_reschedule",
        offerCommandSettlementRecordRef: "replacement_offer_settlement_308_manage_reschedule",
      },
    });

    expect(started.appointmentRecord.appointmentStatus).toBe("reschedule_in_progress");
    expect(started.currentManage?.settlement.result).toBe("applied");
    expect(started.bookingCase.bookingCase.status).toBe("offers_ready");
    expect(started.replacementOfferSessionId).not.toBeNull();
    expect(started.replacementSlotSnapshotId).not.toBeNull();

    const restored = await flow.appointmentManageApplication.abandonAppointmentReschedule({
      ...buildManageInput(flow, {
        commandActionRecordRef: "reschedule_restore_action_308_manage_reschedule",
        commandSettlementRecordRef: "reschedule_restore_settlement_308_manage_reschedule",
        idempotencyKey: "reschedule_restore_idempotency_308_manage_reschedule",
      }),
      reasonCodes: ["patient_stopped_reschedule"],
    });

    expect(restored.appointmentRecord.appointmentStatus).toBe("booked");
    expect(restored.currentManage?.settlement.actionScope).toBe("appointment_reschedule_abandon");
    expect(restored.currentManage?.settlement.result).toBe("applied");
    expect(restored.bookingCase.bookingCase.status).toBe("managed");
    expect(restored.continuityEvidence.writableState).toBe("writable");
  });
});
