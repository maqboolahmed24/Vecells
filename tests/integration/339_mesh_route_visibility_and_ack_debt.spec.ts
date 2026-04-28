import { describe, expect, it } from "vitest";

import {
  atMinute,
  createMeshAcknowledgementFlow,
  createReminderRecoveryFlow,
} from "./339_commit_mesh_no_slot.helpers.ts";

describe("339 mesh route visibility and acknowledgement debt", () => {
  it("keeps MESH transport, practice informed, and explicit acknowledgement debt separate across dispatch checkpoints", async () => {
    const flow = await createMeshAcknowledgementFlow("339_mesh_ack");

    expect(flow.enqueued.message?.transportState).toBe("queued");
    expect(flow.enqueued.truthProjection.practiceVisibilityState).toBe("continuity_pending");
    expect(flow.enqueued.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );

    expect(flow.dispatched.dispatchAttempt?.dispatchState).toBe("accepted");
    expect(flow.dispatched.message?.transportAckState).toBe("accepted");
    expect(flow.dispatched.truthProjection.practiceVisibilityState).toBe("continuity_pending");

    expect(flow.downloaded.deliveryEvidence?.deliveryState).toBe("delivered");
    expect(flow.downloaded.truthProjection.practiceVisibilityState).toBe("ack_pending");
    expect(flow.downloaded.appointment.practiceAcknowledgementState).toBe("ack_pending");
    expect(flow.downloaded.truthProjection.confirmationTruthState).toBe(
      "confirmed_pending_practice_ack",
    );

    expect(flow.acknowledged.acknowledgement?.ackState).toBe("received");
    expect(flow.acknowledged.message?.ackState).toBe("acknowledged");
    expect(flow.acknowledged.truthProjection.practiceVisibilityState).toBe("acknowledged");
    expect(flow.acknowledged.truthProjection.confirmationTruthState).toBe("confirmed");
    expect(flow.acknowledged.hubTransition?.hubCase.status).toBe("booked");
  });

  it("reopens practice visibility debt when later route risk invalidates previously calm reminder posture", async () => {
    const recovery = await createReminderRecoveryFlow("339_mesh_reopen");

    expect(recovery.refreshed.projection.projectionState).toBe("acknowledged");
    expect(recovery.refreshed.projection.practiceAcknowledgementState).toBe("acknowledged");
    expect(recovery.planned.reminderPlan.scheduleState).toBe("scheduled");
    expect(recovery.planned.timelinePublication?.publicationKind).toBe("reminder_scheduled");

    expect(recovery.failed.reminderPlan.authoritativeOutcomeState).toBe("recovery_required");
    expect(recovery.failed.reminderPlan.scheduleState).toBe("delivery_blocked");
    expect(recovery.failed.timelinePublication.publicationKind).toBe("reminder_failed");
    expect(recovery.failed.deltaRecord?.deltaReason).toBe("reminder_failure");
    expect(recovery.failed.visibilityProjection?.practiceAcknowledgementState).toBe(
      "ack_pending",
    );
    expect(recovery.failed.visibilityProjection?.notificationState).toBe(
      "reminder_recovery_required",
    );
    expect(recovery.failed.visibilityProjection?.actionRequiredState).toBe(
      "contact_route_repair",
    );

    expect(recovery.currentState.latestTimelinePublication?.publicationKind).toBe(
      "reminder_failed",
    );
    expect(recovery.currentState.truthProjection?.practiceVisibilityState).toBe(
      "recovery_required",
    );
    expect(recovery.currentState.practiceVisibilityProjection?.practiceAcknowledgementState).toBe(
      "ack_pending",
    );
  });
});
