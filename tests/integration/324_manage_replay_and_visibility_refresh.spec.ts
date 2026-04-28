import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildManageActionInput,
  buildManageCapabilitiesInput,
  buildReminderEvidenceInput,
  buildReminderPlanInput,
  currentHubCoordinationCaseId,
  settlePracticeAcknowledgement,
  setupReminderManageHarness,
} from "./324_hub_manage_reminders.helpers.ts";

describe("324 replay, reminder failure, and visibility refresh", () => {
  it("replays identical reminder-plan compilation without duplicating schedule or timeline rows", async () => {
    const harness = await setupReminderManageHarness("324_reminder_replay");

    await settlePracticeAcknowledgement(harness);
    const planned = await harness.manageService.createOrRefreshReminderPlan(
      buildReminderPlanInput(harness),
    );
    const replayed = await harness.manageService.createOrRefreshReminderPlan(
      buildReminderPlanInput(harness),
    );

    expect(replayed.replayed).toBe(true);
    expect(replayed.reminderPlan.networkReminderPlanId).toBe(
      planned.reminderPlan.networkReminderPlanId,
    );
    expect(replayed.reminderSchedule?.networkReminderScheduleId).toBe(
      planned.reminderSchedule?.networkReminderScheduleId,
    );

    const schedules = await harness.repositories.listReminderSchedulesForPlan(
      planned.reminderPlan.networkReminderPlanId,
    );
    const publications = await harness.repositories.listTimelinePublicationsForPlan(
      planned.reminderPlan.networkReminderPlanId,
    );
    expect(schedules).toHaveLength(1);
    expect(publications).toHaveLength(1);
  });

  it("replays an identical manage action idempotently and returns the same settlement", async () => {
    const harness = await setupReminderManageHarness("324_manage_replay");

    await settlePracticeAcknowledgement(harness);
    const compiled = await harness.manageService.compileNetworkManageCapabilities(
      buildManageCapabilitiesInput(harness, {
        recordedAt: atMinute(21),
      }),
    );

    const command = buildManageActionInput(
      harness,
      compiled.capabilities.networkManageCapabilitiesId,
      "reschedule",
      {
        recordedAt: atMinute(22),
      },
    );
    const first = await harness.manageService.executeHubManageAction(command);
    const replayed = await harness.manageService.executeHubManageAction(command);

    expect(first.replayed).toBe(false);
    expect(first.settlement.result).toBe("provider_pending");
    expect(replayed.replayed).toBe(true);
    expect(replayed.settlement.hubManageSettlementId).toBe(
      first.settlement.hubManageSettlementId,
    );
    expect(replayed.capabilities.networkManageCapabilitiesId).toBe(
      first.capabilities.networkManageCapabilitiesId,
    );
  });

  it("reopens practice visibility debt when reminder delivery fails and records the failure in the unified timeline", async () => {
    const harness = await setupReminderManageHarness("324_reminder_failure");
    const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);

    await settlePracticeAcknowledgement(harness);
    await harness.manageService.refreshPracticeVisibilityProjection({
      hubCoordinationCaseId,
      visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      recordedAt: atMinute(20),
      sourceRefs: ["tests/integration/324_manage_replay_and_visibility_refresh.spec.ts"],
    });
    const planned = await harness.manageService.createOrRefreshReminderPlan(
      buildReminderPlanInput(harness, {
        recordedAt: atMinute(21),
        scheduledFor: atMinute(121),
      }),
    );

    const failed = await harness.manageService.recordReminderDeliveryEvidence(
      buildReminderEvidenceInput(
        harness,
        planned.reminderPlan.networkReminderPlanId,
        planned.reminderSchedule!.networkReminderScheduleId,
        {
          observedAt: atMinute(122),
          evidenceState: "failed",
          transportAckState: "rejected",
          deliveryRiskState: "likely_failed",
          sourceRefs: ["tests/integration/324_manage_replay_and_visibility_refresh.spec.ts"],
        },
      ),
    );

    expect(failed.reminderPlan.authoritativeOutcomeState).toBe("recovery_required");
    expect(failed.reminderPlan.scheduleState).toBe("delivery_blocked");
    expect(failed.timelinePublication.publicationKind).toBe("reminder_failed");
    expect(failed.deltaRecord?.deltaReason).toBe("reminder_failure");
    expect(failed.deltaRecord?.changeClass).toBe("reminder_failed");
    expect(failed.visibilityProjection?.practiceAcknowledgementState).toBe("ack_pending");
    expect(failed.visibilityProjection?.notificationState).toBe("reminder_recovery_required");
    expect(failed.visibilityProjection?.actionRequiredState).toBe("contact_route_repair");

    const currentState =
      await harness.manageService.queryCurrentReminderManageVisibilityState(hubCoordinationCaseId);
    expect(currentState.latestTimelinePublication?.publicationKind).toBe("reminder_failed");
    expect(currentState.latestDeltaRecord?.practiceVisibilityDeltaRecordId).toBe(
      failed.deltaRecord?.practiceVisibilityDeltaRecordId,
    );
    expect(currentState.truthProjection?.practiceVisibilityState).toBe("recovery_required");
  });
});
