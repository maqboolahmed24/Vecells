import { describe, expect, it } from "vitest";

import {
  buildCaseBinding,
  buildNoTrustedSupplyBindings,
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
  timerByType,
} from "./319_hub_queue.helpers.ts";

describe("319 hub queue projections and timers", () => {
  it("materializes typed banners and timers from authoritative queue facts", async () => {
    const harness = await setupHubQueueHarness("319_projection");
    const noTrusted = await createHubQueueCase(harness, {
      name: "no_trusted",
      dueMinute: 70,
      originPracticeOds: "PRA_NO_TRUST",
      state: "candidates_ready",
      snapshotBindings: buildNoTrustedSupplyBindings("319_projection_no_trusted"),
    });
    const patientChoice = await createHubQueueCase(harness, {
      name: "patient_choice",
      dueMinute: 60,
      originPracticeOds: "PRA_PATIENT",
      state: "patient_choice_pending",
    });
    const callbackBlocked = await createHubQueueCase(harness, {
      name: "callback_blocked",
      dueMinute: 75,
      originPracticeOds: "PRA_CALLBACK",
      state: "callback_transfer_pending",
    });
    const practiceAck = await createHubQueueCase(harness, {
      name: "practice_ack",
      dueMinute: 80,
      originPracticeOds: "PRA_ACK",
      state: "booked_pending_practice_ack",
      practiceAckDueMinute: 3,
    });
    const supplierDrift = await createHubQueueCase(harness, {
      name: "supplier_drift",
      dueMinute: 85,
      originPracticeOds: "PRA_DRIFT",
      state: "coordinator_selecting",
      policyTupleHashOverride: "policy_tuple_drifted_projection",
    });
    const staleOwner = await createHubQueueCase(harness, {
      name: "stale_owner",
      dueMinute: 95,
      originPracticeOds: "PRA_STALE",
      state: "stale_owner_recovery",
    });

    const result = await publishQueue(harness, [
      noTrusted,
      patientChoice,
      callbackBlocked,
      practiceAck,
      supplierDrift,
      staleOwner,
    ], {
      selectedAnchorRef: patientChoice.current.hubCase.hubCoordinationCaseId,
      caseBindings: [
        buildCaseBinding(noTrusted),
        buildCaseBinding(patientChoice),
        buildCaseBinding(callbackBlocked, {
          callbackTransferBlocked: true,
        }),
        buildCaseBinding(practiceAck),
        buildCaseBinding(supplierDrift),
        buildCaseBinding(staleOwner),
      ],
    });

    expect(
      result.escalationBanners.map((banner) => banner.bannerType).sort(),
    ).toEqual(
      expect.arrayContaining([
        "callback_transfer_blocked",
        "no_trusted_supply",
        "practice_ack_overdue",
        "stale_owner",
        "supplier_drift",
      ]),
    );

    expect(
      timerByType(
        result,
        patientChoice.current.hubCase.hubCoordinationCaseId,
        "patient_choice_expiry",
      )?.timerState,
    ).toBe("blocked_by_upstream_gap");
    expect(
      timerByType(
        result,
        practiceAck.current.hubCase.hubCoordinationCaseId,
        "practice_notification_overdue",
      )?.timerState,
    ).toBe("overdue");

    expect(result.workbenchProjection.visibleRowRefs.length).toBe(result.rankEntries.length);
    expect(result.caseConsoleProjections.length).toBeGreaterThanOrEqual(5);
    expect(result.optionCardProjections.length).toBeGreaterThan(0);
    expect(result.consistencyProjection.freezeControls).toBe(true);
    expect(result.postureProjection.postureState).toMatch(/recovery_only|warning|mutation_frozen/);
  });
});
