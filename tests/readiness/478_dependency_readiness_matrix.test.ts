import { describe, expect, it } from "vitest";
import { build478DependencyReadinessArtifacts } from "../../tools/readiness/plan_478_dependencies";

describe("478 external dependency readiness matrix", () => {
  it("requires every launch-critical dependency to carry verdict, fallback, contact, runbook, and rehearsal evidence", () => {
    const artifacts = build478DependencyReadinessArtifacts();
    const matrix = artifacts.matrix as any;
    const contacts = artifacts.contactLedger.contacts as any[];
    const runbooks = artifacts.manualFallbackBundle.runbooks as any[];
    const rehearsals = artifacts.rehearsalEvidenceBundle.rehearsals as any[];
    const fallbackModes = artifacts.degradationProfileBundle.fallbackModes as any[];
    const serviceLevelBindings = new Set(
      (matrix.serviceLevelBindings as any[]).map((binding) => binding.serviceLevelBindingId),
    );

    expect(matrix.overallReadinessState).toBe("ready_with_constraints");
    expect(matrix.launchCriticalDependencyCount).toBeGreaterThanOrEqual(8);
    expect(matrix.launchCriticalBlockedCount).toBe(0);

    for (const verdict of matrix.dependencyVerdicts.filter((entry: any) => entry.launchCritical)) {
      expect(verdict.readinessState).not.toBe("blocked");
      expect(serviceLevelBindings.has(verdict.serviceLevelBindingRef)).toBe(true);
      expect(verdict.fallbackModeRefs.length).toBeGreaterThan(0);
      expect(
        verdict.fallbackModeRefs.every((modeRef: string) =>
          fallbackModes.some((mode) => mode.fallbackModeId === modeRef),
        ),
      ).toBe(true);
      expect(
        verdict.escalationContactRefs.every((contactRef: string) =>
          contacts.some((contact) => contact.contactId === contactRef),
        ),
      ).toBe(true);
      expect(
        verdict.escalationContactRefs.some((contactRef: string) =>
          contacts.some(
            (contact) => contact.contactId === contactRef && contact.outOfHoursCoverage === true,
          ),
        ),
      ).toBe(true);
      expect(
        verdict.runbookRefs.every((runbookRef: string) =>
          runbooks.some((runbook) => runbook.runbookId === runbookRef),
        ),
      ).toBe(true);
      expect(
        verdict.rehearsalEvidenceRefs.every((rehearsalRef: string) =>
          rehearsals.some((rehearsal) => rehearsal.rehearsalEvidenceId === rehearsalRef),
        ),
      ).toBe(true);
    }
  });

  it("keeps NHS App and pharmacy deferred/observe-only without blocking Wave 1 core web launch", () => {
    const artifacts = build478DependencyReadinessArtifacts("deferred_channel");
    const verdicts = (artifacts.matrix as any).dependencyVerdicts as any[];
    const nhsApp = verdicts.find((verdict) => verdict.dependencyRef === "dep_478_nhs_app_channel");
    const pharmacy = verdicts.find(
      (verdict) => verdict.dependencyRef === "dep_478_pharmacy_eps_provider_directory",
    );

    expect((artifacts.matrix as any).overallReadinessState).toBe("ready_with_constraints");
    expect(nhsApp).toMatchObject({
      launchCritical: false,
      readinessState: "not_applicable",
    });
    expect(nhsApp.constraintRefs).toContain(
      "constraint:478:nhs-app-channel-deferred-core-web-can-launch",
    );
    expect(pharmacy).toMatchObject({
      launchCritical: false,
      readinessState: "observe_only",
    });
  });

  it("fails closed for stale supplier contacts and required blocking edge cases", () => {
    const stale = build478DependencyReadinessArtifacts("stale_contact");
    const staleMatrix = stale.matrix as any;
    const supplier = staleMatrix.dependencyVerdicts.find(
      (verdict: any) => verdict.dependencyRef === "dep_478_supplier_support_channel",
    );
    const staleContacts = (stale.contactLedger as any).contacts.filter((contact: any) =>
      String(contact.verificationState).includes("expired"),
    );

    expect(staleMatrix.overallReadinessState).toBe("blocked");
    expect(supplier.readinessState).toBe("blocked");
    expect(supplier.blockerRefs).toContain(
      "blocker:478:supplier-contact-role-phone-email-unverified",
    );
    expect(staleContacts.length).toBeGreaterThan(0);

    const blocked = build478DependencyReadinessArtifacts("blocked");
    const blockedVerdicts = (blocked.matrix as any).dependencyVerdicts as any[];
    expect((blocked.matrix as any).overallReadinessState).toBe("blocked");
    expect(
      blockedVerdicts.find(
        (verdict) => verdict.dependencyRef === "dep_478_monitoring_alerting_destination",
      )?.blockerRefs,
    ).toContain("blocker:478:alert-owner-rota-missing");
    expect(
      blockedVerdicts.find((verdict) => verdict.dependencyRef === "dep_478_backup_restore_target")
        ?.blockerRefs,
    ).toContain("blocker:478:restore-report-channel-absent");

    const edgeCaseIds = new Set(
      ((blocked.rehearsalEvidenceBundle as any).edgeCaseProofs as any[]).map(
        (edge) => edge.edgeCaseId,
      ),
    );
    expect(edgeCaseIds).toEqual(
      new Set([
        "edge_478_business_hours_ready_no_ooh",
        "edge_478_nhs_app_deferred_core_web_launch",
        "edge_478_pharmacy_manual_path_untested",
        "edge_478_monitoring_configured_no_owner_rota",
        "edge_478_backup_ready_no_restore_report_channel",
        "edge_478_supplier_contact_expired_unverified",
        "edge_478_manual_fallback_privacy_retention_violation",
      ]),
    );
  });
});
