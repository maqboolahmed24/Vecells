import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7LiveControlApplication,
  phase7LiveControlRoutes,
} from "../../services/command-api/src/phase7-live-control-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("385 limited release freeze and monthly pack", () => {
  it("registers the live-control routes in command API", () => {
    for (const route of phase7LiveControlRoutes) {
      expect(serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId)).toBe(
        true,
      );
    }
  });

  it("runs limited release enable, freeze, release, and monthly-pack generation", () => {
    const application = createDefaultPhase7LiveControlApplication();

    const enabled = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
    });
    const frozen = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
      observationWindow: { journeyErrorRate: 0.04 },
      operatorNoteRef: "OperatorNote:385:test-freeze",
    });
    const resolvedDisposition = application.resolveRouteFreezeDisposition({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
      journeyPathRef: "jp_pharmacy_status",
    });
    const released = application.releaseFreeze({
      freezeRecordId: frozen.freezeRecord?.freezeRecordId ?? "missing",
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      operatorNoteRef: "OperatorNote:385:test-release",
    });
    const pack = application.generatePerformancePack({
      environment: "limited_release",
      period: "2026-05",
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
    });

    expect(enabled.decision).toBe("enable");
    expect(frozen.decision).toBe("freeze");
    expect(frozen.freezeRecord?.triggerType).toBe("threshold_breach");
    expect(resolvedDisposition?.freezeMode).toBe("read_only");
    expect(released.freezeState).toBe("released");
    expect(pack.packId).toBe("NHSAppPerformancePack:385:limited_release:2026-05");
    expect(pack.telemetryPlanRef).toBe("ChannelTelemetryPlan:384:limited_release");
    expect(pack.eventContractRefs.length).toBeGreaterThanOrEqual(7);
    expect(pack.journeyUsage[0]?.journeyPathRef).toBe("jp_pharmacy_status");
    expect(pack.guardrailBreaches).toEqual([]);
    expect(application.listEvidence().auditEvents.map((event) => event.decision)).toEqual(
      expect.arrayContaining(["enable", "freeze", "release"]),
    );
  });

  it("freezes on compatibility drift and continuity degradation before cohort expansion", () => {
    const compatibilityApp = createDefaultPhase7LiveControlApplication();
    const continuityApp = createDefaultPhase7LiveControlApplication();

    const compatibility = compatibilityApp.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
      observationWindow: { compatibilityEvidenceState: "stale" },
    });
    const continuity = continuityApp.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
      observationWindow: { continuityEvidenceState: "degraded" },
    });

    expect(compatibility.decision).toBe("freeze");
    expect(compatibility.freezeRecord?.triggerType).toBe("compatibility_drift");
    expect(continuity.decision).toBe("freeze");
    expect(continuity.freezeRecord?.triggerType).toBe("continuity_evidence_degraded");
  });

  it("activates kill switch without changing the release tuple", () => {
    const application = createDefaultPhase7LiveControlApplication();

    const result = application.activateKillSwitch({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
    });

    expect(result.decision).toBe("kill_switch_activation");
    expect(result.cohort.cohortState).toBe("kill_switch_active");
    expect(result.freezeRecord?.freezeState).toBe("kill_switch_active");
    expect(result.freezeRecord?.manifestVersionRef).toBe(PHASE7_MANIFEST_VERSION);
    expect(result.freezeRecord?.releaseApprovalFreezeRef).toBe(PHASE7_RELEASE_APPROVAL_FREEZE_REF);
    expect(result.routeDispositions[0]?.freezeMode).toBe("read_only");
  });
});
