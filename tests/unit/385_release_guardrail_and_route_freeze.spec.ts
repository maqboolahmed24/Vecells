import { describe, expect, it } from "vitest";
import {
  ChannelReleaseCohortRegistry,
  createDefaultPhase7LiveControlApplication,
  type ChannelReleaseCohort,
} from "../../services/command-api/src/phase7-live-control-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("385 release guardrail and route freeze", () => {
  it("enables a limited-release cohort only when readiness, telemetry, continuity, and compatibility are current", () => {
    const application = createDefaultPhase7LiveControlApplication();

    const result = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
    });

    expect(result.decision).toBe("enable");
    expect(result.failureReasons).toEqual([]);
    expect(result.environmentProfile.parityState).toBe("matching");
    expect(result.promotionReadiness.promotionState).toBe("promotable");
    expect(result.guardrailEvaluation.guardrailState).toBe("green");
    expect(result.cohort.cohortState).toBe("enabled");
  });

  it("opens a telemetry-missing freeze and resolves a read-only disposition under the same tuple", () => {
    const application = createDefaultPhase7LiveControlApplication();

    const result = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
      observationWindow: { telemetryPresent: false },
    });
    const disposition = result.routeDispositions[0];

    expect(result.decision).toBe("freeze");
    expect(result.freezeRecord?.triggerType).toBe("telemetry_missing");
    expect(result.freezeRecord?.manifestVersionRef).toBe(PHASE7_MANIFEST_VERSION);
    expect(result.freezeRecord?.releaseApprovalFreezeRef).toBe(PHASE7_RELEASE_APPROVAL_FREEZE_REF);
    expect(disposition?.freezeMode).toBe("read_only");
    expect(disposition?.manifestVersionRef).toBe(result.freezeRecord?.manifestVersionRef);
    expect(disposition?.releaseApprovalFreezeRef).toBe(
      result.freezeRecord?.releaseApprovalFreezeRef,
    );
  });

  it("recommends rollback for severe threshold breach and preserves rollback action evidence", () => {
    const application = createDefaultPhase7LiveControlApplication();

    const result = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
      observationWindow: {
        authFailureRate: 0.05,
        safetyIssueCount: 1,
      },
    });

    expect(result.decision).toBe("rollback_recommendation");
    expect(result.guardrailEvaluation.rollbackRecommended).toBe(true);
    expect(result.freezeRecord?.freezeState).toBe("rollback_recommended");
    expect(result.freezeRecord?.rollbackActionRef).toBe(
      "disable_jump_off_and_restore_browser_route",
    );
    expect(result.failureReasons).toContain("threshold_breach");
  });

  it("blocks expansion when a cohort includes an unready route", () => {
    const seeded: ChannelReleaseCohort = {
      cohortId: "ChannelReleaseCohort:385:custom-unready-route",
      odsRules: ["A83001"],
      patientPopulationRules: ["test-only"],
      enabledJourneys: ["jp_request_status"],
      releaseStage: "limited_release",
      environment: "limited_release",
      manifestVersionRef: PHASE7_MANIFEST_VERSION,
      releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      guardrailPolicyRef: "ReleaseGuardrailPolicy:385:phase7-default",
      killSwitchRef: "KillSwitch:385:nhs-app-channel-disable-jump-off",
      cohortState: "monitoring",
      startAt: "2026-05-04T09:00:00.000Z",
      endAt: null,
    };
    const application = createDefaultPhase7LiveControlApplication({
      cohortRegistry: new ChannelReleaseCohortRegistry([seeded]),
    });

    const result = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:385:custom-unready-route",
    });

    expect(result.decision).toBe("blocked");
    expect(result.failureReasons).toContain("readiness_not_ready");
    expect(result.promotionReadiness.failureReasonsByRoute.jp_request_status).toContain(
      "continuity_evidence_missing",
    );
  });

  it("records journey change notices with one-month and three-month lead-time enforcement", () => {
    const application = createDefaultPhase7LiveControlApplication();

    const minor = application.submitJourneyChangeNotice({
      changeType: "minor",
      affectedJourneys: ["jp_pharmacy_status"],
      submittedAt: "2026-04-27T00:00:00.000Z",
      plannedChangeAt: "2026-05-30T00:00:00.000Z",
    });
    const significant = application.submitJourneyChangeNotice({
      changeType: "significant",
      affectedJourneys: ["jp_pharmacy_status"],
      submittedAt: "2026-04-27T00:00:00.000Z",
      plannedChangeAt: "2026-06-01T00:00:00.000Z",
    });

    expect(minor.leadTimeRequired).toBe("P1M");
    expect(minor.approvalState).toBe("submitted");
    expect(significant.leadTimeRequired).toBe("P3M");
    expect(significant.approvalState).toBe("blocked_lead_time");
    expect(application.listEvidence().auditEvents.at(-1)?.failureReasons).toContain(
      "change_notice_lead_time_unmet",
    );
  });
});
