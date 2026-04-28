import { describe, expect, it } from "vitest";
import { build478DependencyReadinessArtifacts } from "../../tools/readiness/plan_478_dependencies";

const sensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|postgres:\/\/|mysql:\/\/|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

describe("478 manual fallback runbook bundle", () => {
  it("binds each runbook to pending activation commands and current exit criteria", () => {
    const artifacts = build478DependencyReadinessArtifacts();
    const bundle = artifacts.manualFallbackBundle as any;
    const commandIds = new Set(
      (bundle.fallbackActivationCommands as any[]).map((command) => command.commandId),
    );
    const exitCriterionIds = new Set(
      (bundle.fallbackExitCriteria as any[]).map((criterion) => criterion.exitCriterionId),
    );

    expect(bundle.noCompletionClaimBeforeSettlement).toBe(true);
    expect((artifacts.interfaceGap as any).commandRequirements).toMatchObject({
      roleAuthorizationRequired: true,
      tenantCohortChannelScopeRequired: true,
      idempotencyKeyRequired: true,
      purposeBindingRequired: true,
      injectedClockRequired: true,
      wormAuditOutputRequired: true,
      settlementRequiredBeforeCompletionClaim: true,
    });

    for (const runbook of bundle.runbooks as any[]) {
      expect(runbook.activationCommandRefs.length).toBeGreaterThan(0);
      expect(runbook.exitCriterionRefs.length).toBeGreaterThan(0);
      expect(runbook.privacyRetentionControls.length).toBeGreaterThan(0);
      expect(
        runbook.activationCommandRefs.every((commandRef: string) => commandIds.has(commandRef)),
      ).toBe(true);
      expect(
        runbook.exitCriterionRefs.every((criterionRef: string) =>
          exitCriterionIds.has(criterionRef),
        ),
      ).toBe(true);
    }

    for (const command of bundle.fallbackActivationCommands as any[]) {
      expect(command.settlementState).toBe("pending_backend_command_settlement");
      expect(command.completionClaimPermitted).toBe(false);
      expect(command.authorizedRoleRefs).toContain("ROLE_INCIDENT_COMMANDER");
      expect(command.idempotencyKeyTemplate).toContain("{incidentRef}");
    }
  });

  it("blocks unsafe manual fallback paths and represents untested pharmacy fallback as a gap", () => {
    const blocked = build478DependencyReadinessArtifacts("blocked");
    const blockedNotification = (blocked.degradationProfileBundle as any).fallbackModes.find(
      (mode: any) => mode.fallbackModeId === "fb_478_manual_patient_contact",
    );
    const blockedMatrix = blocked.matrix as any;

    expect(blockedMatrix.overallReadinessState).toBe("blocked");
    expect(blockedNotification.readinessState).toBe("blocked");
    expect(blockedNotification.privacyRetentionPosture).toBe("privacy_retention_violation_blocked");

    const defaultArtifacts = build478DependencyReadinessArtifacts();
    const pharmacyRehearsal = (defaultArtifacts.rehearsalEvidenceBundle as any).rehearsals.find(
      (rehearsal: any) => rehearsal.rehearsalEvidenceId === "rehearsal_478_pharmacy_manual_path",
    );
    expect(pharmacyRehearsal.result).toBe("not_exercised_wave1_observe_only");
    expect(pharmacyRehearsal.openGapRefs).toContain(
      "gap:478:manual-pharmacy-prescription-path-untested",
    );
  });

  it("keeps generated reports synthetic and redacted", () => {
    const artifacts = build478DependencyReadinessArtifacts();
    const serialized = JSON.stringify(artifacts);

    expect(serialized).not.toMatch(sensitivePattern);
    expect(
      (artifacts.contactLedger as any).contacts.every(
        (contact: any) => contact.noRawContactDetails,
      ),
    ).toBe(true);
    expect((artifacts.matrix as any).noRawSecretsOrPhi).toBe(true);
  });
});
