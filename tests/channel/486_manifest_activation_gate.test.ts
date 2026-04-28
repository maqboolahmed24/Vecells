import { describe, expect, it } from "vitest";
import {
  build486Records,
  build486ScenarioRecords,
  hashValue,
  required486EdgeCases,
} from "../../tools/channel/enable_486_nhs_app_channel";

describe("486 NHS App manifest activation gate", () => {
  it("enables the NHS App channel only for the exact approved manifest and live tuple", () => {
    const approved = build486ScenarioRecords("approved_embedded", []);

    expect(approved.plan.activeManifestVersionRef).toBe("nhsapp-manifest-v0.1.0-freeze-374");
    expect(approved.plan.activationDecisionState).toBe("approved");
    expect(approved.plan.channelExposureState).toBe("enabled");
    expect(approved.command.commandState).toBe("accepted");
    expect(approved.command.commandType).toBe("enable_channel");
    expect(approved.settlement.result).toBe("applied");
    expect(approved.settlement.enabled).toBe(true);
    expect(approved.settlement.blockerRefs).toEqual([]);
  });

  it("hides exposure when manifest scope is deferred or release tuple drifts", () => {
    const deferred = build486ScenarioRecords("deferred_scope", []);
    const mismatch = build486ScenarioRecords("blocked_tuple_mismatch", []);

    expect(deferred.plan.activationDecisionState).toBe("deferred");
    expect(deferred.plan.channelExposureState).toBe("deferred_hidden");
    expect(deferred.command.commandState).toBe("blocked");
    expect(deferred.settlement.result).toBe("deferred_hidden");
    expect(deferred.settlement.enabled).toBe(false);

    expect(mismatch.plan.activationDecisionState).toBe("blocked");
    expect(mismatch.plan.channelExposureState).toBe("blocked_hidden");
    expect(mismatch.settlement.result).toBe("blocked_tuple");
    expect(mismatch.settlement.enabled).toBe(false);
    expect(mismatch.settlement.blockerRefs).toContain(
      "blocker:486:release-watch-runtime-manifest-tuple-mismatch",
    );
  });

  it("blocks AOS-approved manifests when the live profile is missing", () => {
    const liveMissing = build486ScenarioRecords("aos_approved_live_profile_missing", []);

    expect(liveMissing.limitedReleaseScope.environmentProfileState).toBe("live_profile_missing");
    expect(liveMissing.plan.channelExposureState).toBe("blocked_hidden");
    expect(liveMissing.command.commandState).toBe("blocked");
    expect(liveMissing.settlement.result).toBe("blocked_environment");
  });

  it("blocks active limited release when monthly data or journey-change obligations are missing", () => {
    const monthlyMissing = build486ScenarioRecords("monthly_data_missing_active_release", []);
    const journeyChanged = build486ScenarioRecords("journey_text_changed_without_notice", []);

    expect(monthlyMissing.monthlyDataBinding.obligationState).toBe("missing");
    expect(monthlyMissing.settlement.result).toBe("blocked_obligation");
    expect(monthlyMissing.settlement.channelExposureState).toBe("blocked_hidden");

    expect(journeyChanged.journeyChangeBinding.journeyTextChangeState).toBe(
      "changed_after_approval",
    );
    expect(journeyChanged.journeyChangeBinding.noticeState).toBe("missing");
    expect(journeyChanged.settlement.result).toBe("blocked_change_control");
  });

  it("covers every required 486 edge case and hashes the plan deterministically", () => {
    const records = build486Records([]);
    const edgeCaseIds = new Set(
      (records.edgeCaseFixtures.fixtures as any[]).map((fixture) => fixture.edgeCaseId),
    );
    for (const edgeCase of required486EdgeCases) {
      expect(edgeCaseIds.has(edgeCase)).toBe(true);
    }

    const { recordHash, ...withoutHash } = records.activeScenario.plan;
    expect(recordHash).toBe(hashValue(withoutHash));
  });
});
