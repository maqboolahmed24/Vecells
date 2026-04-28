import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildReminderPlanInput,
  currentHubCoordinationCaseId,
  settlePracticeAcknowledgement,
  setupReminderManageHarness,
} from "./324_hub_manage_reminders.helpers.ts";

describe("324 reminder planning and practice visibility projection", () => {
  it("refreshes practice visibility from pending acknowledgement to acknowledged and schedules reminders only after authoritative confirmation", async () => {
    const harness = await setupReminderManageHarness("324_projection_refresh");
    const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);

    const pendingProjection = await harness.manageService.refreshPracticeVisibilityProjection({
      hubCoordinationCaseId,
      visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      recordedAt: atMinute(19),
      sourceRefs: ["tests/integration/324_reminder_plan_and_visibility_projection.spec.ts"],
    });

    expect(pendingProjection.projection.projectionState).toBe("published_pending_ack");
    expect(pendingProjection.projection.practiceAcknowledgementState).toBe("ack_pending");
    expect(pendingProjection.projection.actionRequiredState).toBe("practice_ack_required");

    const acknowledged = await settlePracticeAcknowledgement(harness);
    expect(acknowledged.acknowledged.acknowledgement?.ackState).toBe("received");

    const refreshedProjection = await harness.manageService.refreshPracticeVisibilityProjection({
      hubCoordinationCaseId,
      visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      recordedAt: atMinute(20),
      sourceRefs: ["tests/integration/324_reminder_plan_and_visibility_projection.spec.ts"],
    });

    expect(refreshedProjection.projection.projectionState).toBe("acknowledged");
    expect(refreshedProjection.projection.practiceAcknowledgementState).toBe("acknowledged");
    expect(refreshedProjection.projection.notificationState).toMatch(/^continuity_/);

    const reminder = await harness.manageService.createOrRefreshReminderPlan(
      buildReminderPlanInput(harness),
    );

    expect(reminder.replayed).toBe(false);
    expect(reminder.reminderPlan.scheduleState).toBe("scheduled");
    expect(reminder.reminderPlan.authoritativeOutcomeState).toBe("scheduled");
    expect(reminder.reminderSchedule?.scheduleState).toBe("scheduled");
    expect(reminder.timelinePublication?.publicationKind).toBe("reminder_scheduled");
    expect(reminder.timelinePublication?.threadId).toBe(reminder.reminderPlan.threadId);

    const currentState =
      await harness.manageService.queryCurrentReminderManageVisibilityState(hubCoordinationCaseId);
    expect(currentState.practiceVisibilityProjection?.projectionState).toBe("acknowledged");
    expect(currentState.reminderPlan?.networkReminderPlanId).toBe(
      reminder.reminderPlan.networkReminderPlanId,
    );
    expect(currentState.latestTimelinePublication?.publicationKind).toBe("reminder_scheduled");
  });

  it("publishes reminder dispatch truth into the same conversation lineage as the reminder plan", async () => {
    const harness = await setupReminderManageHarness("324_timeline_lineage");
    const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);

    await settlePracticeAcknowledgement(harness);
    await harness.manageService.refreshPracticeVisibilityProjection({
      hubCoordinationCaseId,
      visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      recordedAt: atMinute(20),
      sourceRefs: ["tests/integration/324_reminder_plan_and_visibility_projection.spec.ts"],
    });

    const planned = await harness.manageService.createOrRefreshReminderPlan(
      buildReminderPlanInput(harness, {
        recordedAt: atMinute(21),
        scheduledFor: atMinute(121),
      }),
    );
    const dispatched = await harness.manageService.dispatchReminderSchedule({
      reminderPlanId: planned.reminderPlan.networkReminderPlanId,
      reminderScheduleId: planned.reminderSchedule!.networkReminderScheduleId,
      attemptedAt: atMinute(121),
      sourceRefs: ["tests/integration/324_reminder_plan_and_visibility_projection.spec.ts"],
    });

    expect(dispatched.deliveryEvidence.adapterName).toBe("sms");
    expect(dispatched.deliveryEvidence.transportAckState).toBe("accepted");
    expect(dispatched.deliveryEvidence.externalDispatchRef).toContain(
      planned.reminderSchedule!.networkReminderScheduleId,
    );
    expect(dispatched.timelinePublication.threadId).toBe(planned.reminderPlan.threadId);
    expect(dispatched.timelinePublication.conversationSubthreadRef).toBe(
      planned.reminderPlan.conversationSubthreadRef,
    );
    expect(dispatched.timelinePublication.communicationEnvelopeRef).toBe(
      planned.reminderPlan.communicationEnvelopeRef,
    );

    const currentState =
      await harness.manageService.queryCurrentReminderManageVisibilityState(hubCoordinationCaseId);
    expect(currentState.reminderPlan?.scheduleState).toBe("sent");
    expect(currentState.latestReminderDeliveryEvidence?.networkReminderDeliveryEvidenceId).toBe(
      dispatched.deliveryEvidence.networkReminderDeliveryEvidenceId,
    );
    expect(currentState.latestTimelinePublication?.reminderTimelinePublicationId).toBe(
      dispatched.timelinePublication.reminderTimelinePublicationId,
    );
  });
});
