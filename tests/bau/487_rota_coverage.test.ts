import { describe, expect, it } from "vitest";
import { build487ScenarioRecords } from "../../tools/bau/complete_487_bau_handover";

describe("487 rota coverage and ownership transfer", () => {
  it("requires owner, deputy, out-of-hours, bank-holiday, runbook, and competency evidence", () => {
    const records = build487ScenarioRecords("accepted_with_constraints", []);

    const launchCritical = records.rotaAssignments.filter((assignment) =>
      assignment.rotaWindowRefs.includes("out_of_hours"),
    );
    expect(launchCritical.length).toBeGreaterThan(0);
    expect(
      launchCritical.every(
        (assignment) =>
          assignment.owner &&
          assignment.deputy &&
          assignment.outOfHoursCoverageState === "covered" &&
          assignment.bankHolidayCoverageState === "covered" &&
          assignment.competencyEvidenceState === "exact" &&
          assignment.runbookOwnershipState === "accepted",
      ),
    ).toBe(true);

    expect(records.incidentCommanderRota.coverageState).toBe("exact");
    expect(records.incidentCommanderRota.outOfHoursCommander).toBeTruthy();
    expect(records.runbookTransfers.every((transfer) => transfer.transferState === "accepted")).toBe(
      true,
    );
  });

  it("does not permit owner acceptance when out-of-hours deputy coverage is missing", () => {
    const records = build487ScenarioRecords("deputy_missing_ooh", []);
    const incident = records.rotaAssignments.find(
      (assignment) => assignment.domainId === "incident_command",
    );

    expect(incident?.deputy).toBeNull();
    expect(incident?.outOfHoursCoverageState).toBe("missing");
    expect(records.incidentCommanderRota.coverageState).toBe("blocked");
    expect(records.pack.blockerRefs).toContain("blocker:487:incident-command-deputy-missing-ooh");
  });

  it("blocks assistive, channel, records, supplier, and open-action ownership gaps", () => {
    const assistive = build487ScenarioRecords("assistive_no_freeze_authority", []);
    expect(assistive.assistiveOwnership.freezeAuthorityState).toBe("missing");
    expect(assistive.pack.blockerRefs).toContain(
      "blocker:487:assistive-freeze-downgrade-authority-missing",
    );

    const channel = build487ScenarioRecords("channel_monthly_owner_missing", []);
    expect(channel.channelOwnership.monthlyDataOwner).toBeNull();
    expect(channel.pack.blockerRefs).toContain("blocker:487:nhs-app-monthly-data-owner-missing");

    const records = build487ScenarioRecords("records_archive_owner_missing", []);
    expect(records.recordsOwnership.owner).toBeNull();
    expect(records.pack.blockerRefs).toContain("blocker:487:records-archive-owner-missing");

    const supplier = build487ScenarioRecords("supplier_programme_only", []);
    expect(supplier.pack.blockerRefs).toContain("blocker:487:supplier-escalation-held-by-programme");

    const action = build487ScenarioRecords("action_misclassified_release_blocking", []);
    expect(
      action.openActions.some(
        (openAction) =>
          openAction.releaseBlocking &&
          openAction.actionClass === "bau_follow_up" &&
          openAction.classificationState === "misclassified",
      ),
    ).toBe(true);
    expect(action.pack.blockerRefs).toContain("blocker:487:release-blocking-action-misclassified");
  });
});
