import { describe, expect, it } from "vitest";
import { build489ScenarioRecords } from "../../tools/programme/close_489_master_watchlist";

describe("489 CI backlog transfer and cadence ownership", () => {
  it("seeds outcome-oriented CI items with metrics, owners and review cadence", () => {
    const records = build489ScenarioRecords("complete_with_transfers", []);

    expect(records.backlogSeed.backlogState).toBe("seeded");
    expect(records.backlogSeed.backlogItems.length).toBeGreaterThanOrEqual(4);
    expect(records.backlogSeed.backlogItems.every((item) => item.outcomeMetricRef)).toBe(true);
    expect(records.backlogSeed.backlogItems.every((item) => item.reviewCadenceRef)).toBe(true);
    expect(records.backlogSeed.backlogItems.every((item) => item.owner.startsWith("svc-owner:"))).toBe(true);
    expect(records.backlogSeed.improvementOutcomeMetrics.length).toBeGreaterThanOrEqual(
      records.backlogSeed.backlogItems.length,
    );
    expect(records.backlogSeed.reviewTriggers.every((trigger) => trigger.triggerState === "armed")).toBe(true);
  });

  it("covers required BAU/CI cadence domains without hidden launch residue", () => {
    const records = build489ScenarioRecords("complete_with_transfers", []);
    const domains = new Set(records.cadenceOwners.map((owner) => owner.domain));

    for (const domain of [
      "safety",
      "security",
      "privacy",
      "records",
      "accessibility",
      "assistive",
      "channel",
      "dependency_hygiene",
      "release_verification",
      "incident_lessons",
      "support",
    ]) {
      expect(domains.has(domain), domain).toBe(true);
    }
    expect(records.dependencySchedule.scheduleState).toBe("active");
    expect(records.dependencySchedule.contactHygieneCadenceRef).toBeTruthy();
    expect(records.metricOwnership.every((ownership) => ownership.ownershipState === "accepted")).toBe(true);
  });

  it("blocks transfer conflicts, missing assistive metrics and stale NHS App manifests", () => {
    const conflict = build489ScenarioRecords("conflicting_bau_ci_owner", []);
    expect(conflict.closure.blockerRefs).toContain(
      "blocker:489:unresolved-item-has-conflicting-bau-and-ci-owners",
    );

    const assistive = build489ScenarioRecords("assistive_action_missing_metric", []);
    expect(assistive.backlogSeed.backlogState).toBe("blocked");
    expect(assistive.closure.blockerRefs).toContain(
      "blocker:489:assistive-monitoring-missing-metric-or-cadence",
    );

    const channel = build489ScenarioRecords("nhs_app_old_manifest_after_activation", []);
    expect(channel.closure.blockerRefs).toContain(
      "blocker:489:nhs-app-item-references-old-manifest-after-activation",
    );
  });
});
