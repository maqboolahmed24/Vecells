import { describe, expect, it } from "vitest";

import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  buildDefault397ChannelReleaseCohortManifest,
  buildDefault397ReleaseGuardrailPolicyManifest,
  create397ReleaseControlApplication,
  create397ReleaseControlReadinessReport,
  generate397MonthlyPerformancePack,
  phase7NhsAppReleaseControlRoutes,
  rehearse397GuardrailFreezeAndKillSwitch,
  submit397JourneyChangeNotice,
  validateReleaseControlsFromFiles,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";

const ROOT = "/Users/test/Code/V";

describe("397 NHS App release control integration", () => {
  it("registers release-control routes in command API", () => {
    for (const route of phase7NhsAppReleaseControlRoutes) {
      expect(serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId)).toBe(
        true,
      );
    }
  });

  it("validates release-control assets from checked-in manifests", () => {
    const report = validateReleaseControlsFromFiles({
      root: ROOT,
      cohortManifestPath: "data/config/397_channel_release_cohort_manifest.example.json",
      guardrailManifestPath: "data/config/397_release_guardrail_policy_manifest.example.json",
      dispositionManifestPath: "data/config/397_route_freeze_disposition_manifest.example.json",
    });

    expect(report.readinessState).toBe("ready");
    expect(report.machineReadableSummary.cohortsCoverRequiredJourneys).toBe(true);
    expect(report.machineReadableSummary.allFreezeTriggersConfigured).toBe(true);
    expect(report.machineReadableSummary.monthlyPackSafeForExport).toBe(true);
  });

  it("rehearses freeze, kill switch, monthly pack, and change notice as one operator flow", () => {
    const rehearsal = rehearse397GuardrailFreezeAndKillSwitch();
    const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
    const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
    const report = create397ReleaseControlReadinessReport({
      cohortManifest,
      guardrailManifest,
      dispositionManifest: {
        taskId: "397",
        schemaVersion: "397.phase7.nhs-app-release-controls.v1",
        generatedAt: "2026-04-27T08:15:00.000Z",
        releaseTuple: cohortManifest.releaseTuple,
        dispositions: rehearsal.routeDispositions.map((entry) => ({
          dispositionTemplateId: `RouteFreezeDispositionTemplate:397:${entry.journeyPathRef}`,
          journeyPathRef: entry.journeyPathRef,
          freezeMode: entry.freezeMode,
          patientMessageRef: entry.patientMessageRef,
          safeRouteRef: entry.safeRouteRef,
          supportRecoveryRef: entry.supportRecoveryRef,
          operatorRunbookRef: "ops/release/397_nhs_app_limited_release_runbook.md",
        })),
      },
    });
    const pack = generate397MonthlyPerformancePack({
      cohortManifest,
      guardrailManifest,
      environment: "limited_release",
      period: "2026-05",
    });
    const notice = submit397JourneyChangeNotice({
      application: create397ReleaseControlApplication(),
      cohortManifest,
      changeType: "minor",
      affectedJourneys: ["jp_request_status"],
      submittedAt: "2026-04-27T00:00:00.000Z",
      plannedChangeAt: "2026-05-30T00:00:00.000Z",
    });

    expect(rehearsal.freezeDecision.decision).toBe("freeze");
    expect(rehearsal.killSwitchDecision.decision).toBe("kill_switch_activation");
    expect(rehearsal.disabledJumpOffWithoutRedeploy).toBe(true);
    expect(report.readinessState).toBe("ready");
    expect(pack.guardrailBreaches).toEqual([]);
    expect(notice.approvalState).toBe("submitted");
  });
});
