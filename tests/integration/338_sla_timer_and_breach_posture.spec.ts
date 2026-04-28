import { describe, expect, it } from "vitest";

import {
  buildCaseBinding,
  buildNoTrustedSupplyBindings,
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
  timerByType,
} from "./319_hub_queue.helpers.ts";

describe("338 SLA timer and breach posture", () => {
  it("materializes timers and escalation banners from authoritative queue facts", async () => {
    const harness = await setupHubQueueHarness("338_sla");
    const urgent = await createHubQueueCase(harness, {
      name: "urgent",
      priorityBand: "urgent",
      dueMinute: 18,
      latestSafeOfferMinute: 11,
      originPracticeOds: "PRA_338_SLA_URGENT",
      state: "coordinator_selecting",
    });
    const noTrusted = await createHubQueueCase(harness, {
      name: "no_trusted",
      dueMinute: 70,
      originPracticeOds: "PRA_338_SLA_NO_TRUST",
      state: "candidates_ready",
      snapshotBindings: buildNoTrustedSupplyBindings("338_sla_no_trusted"),
    });
    const selecting = await createHubQueueCase(harness, {
      name: "selecting",
      dueMinute: 55,
      originPracticeOds: "PRA_338_SLA_SELECTING",
      state: "coordinator_selecting",
    });

    const result = await publishQueue(harness, [selecting, urgent, noTrusted], {
      selectedAnchorRef: selecting.current.hubCase.hubCoordinationCaseId,
      caseBindings: [
        buildCaseBinding(selecting),
        buildCaseBinding(urgent),
        buildCaseBinding(noTrusted),
      ],
    });

    expect(timerByType(result, urgent.current.hubCase.hubCoordinationCaseId, "required_window_breach")?.timerState).toBe(
      "overdue",
    );
    expect(timerByType(result, urgent.current.hubCase.hubCoordinationCaseId, "too_urgent_for_network")?.timerState).toBe(
      "overdue",
    );
    expect(timerByType(result, noTrusted.current.hubCase.hubCoordinationCaseId, "required_window_breach")?.timerState).toBe(
      "armed",
    );
    expect(timerByType(result, selecting.current.hubCase.hubCoordinationCaseId, "candidate_refresh")?.timerState).toBe(
      "armed",
    );

    expect(result.escalationBanners.map((banner) => banner.bannerType)).toEqual(
      expect.arrayContaining(["too_urgent", "no_trusted_supply"]),
    );
    expect(result.postureProjection.postureState).toBe("warning");
    expect(result.postureProjection.noTrustedSupplyCount).toBe(1);
    expect(result.postureProjection.criticalCaseCount).toBe(1);
    expect(result.workbenchProjection.visibleRowRefs[0]).toBe(
      urgent.current.hubCase.hubCoordinationCaseId,
    );
  });
});

