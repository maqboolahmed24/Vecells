import { describe, expect, it } from "vitest";

import {
  PHASE7_397_REQUIRED_FREEZE_TRIGGERS,
  PHASE7_397_REQUIRED_JOURNEY_REFS,
  assert397MonthlyPackRedactionSafe,
  buildDefault397ChannelReleaseCohortManifest,
  buildDefault397ReleaseGuardrailPolicyManifest,
  buildDefault397RouteFreezeDispositionManifest,
  create397ReleaseControlApplication,
  evaluate397ReleaseGuardrails,
  generate397MonthlyPerformancePack,
  release397FreezeWithFreshGreenWindow,
  submit397JourneyChangeNotice,
  validateChannelReleaseCohortManifest,
  validateReleaseGuardrailPolicyManifest,
  validateRouteFreezeDispositionManifest,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("397 NHS App release controls", () => {
  it("validates cohort, guardrail, and route-freeze manifests", () => {
    const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
    const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
    const dispositionManifest = buildDefault397RouteFreezeDispositionManifest();

    expect(validateChannelReleaseCohortManifest(cohortManifest).readinessState).toBe("ready");
    expect(validateReleaseGuardrailPolicyManifest(guardrailManifest).readinessState).toBe("ready");
    expect(validateRouteFreezeDispositionManifest(dispositionManifest).readinessState).toBe(
      "ready",
    );
    for (const journey of PHASE7_397_REQUIRED_JOURNEY_REFS) {
      expect(cohortManifest.cohorts[0]?.enabledJourneys).toContain(journey);
    }
    for (const trigger of PHASE7_397_REQUIRED_FREEZE_TRIGGERS) {
      expect(guardrailManifest.policies[0]?.requiredFreezeTriggers).toContain(trigger);
    }
  });

  it("opens freeze conditions for each required guardrail trigger", () => {
    const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
    const cases = [
      { trigger: "telemetry_missing", observationWindow: { telemetryPresent: false } },
      { trigger: "threshold_breach", observationWindow: { journeyErrorRate: 0.04 } },
      {
        trigger: "assurance_slice_degraded",
        observationWindow: { assuranceSliceState: "degraded" as const },
      },
      {
        trigger: "compatibility_drift",
        observationWindow: { compatibilityEvidenceState: "stale" as const },
      },
      {
        trigger: "continuity_evidence_degraded",
        observationWindow: { continuityEvidenceState: "degraded" as const },
      },
    ] as const;

    for (const scenario of cases) {
      const result = evaluate397ReleaseGuardrails({
        guardrailManifest,
        observationWindow: scenario.observationWindow,
      });

      expect(result.guardrailState).toBe("freeze_required");
      expect(result.triggerTypes).toContain(scenario.trigger);
    }
  });

  it("maps frozen routes to patient-safe dispositions", () => {
    const application = create397ReleaseControlApplication();

    const result = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:397:limited-release-first-wave",
      observationWindow: { telemetryPresent: false },
    });

    expect(result.decision).toBe("freeze");
    expect(result.freezeRecord?.journeyPathRefs).toEqual(
      expect.arrayContaining([...PHASE7_397_REQUIRED_JOURNEY_REFS]),
    );
    expect(result.routeDispositions.map((entry) => entry.freezeMode)).toEqual(
      expect.arrayContaining(["read_only", "placeholder_only", "redirect_to_safe_route"]),
    );
  });

  it("requires explicit operator release and a fresh green window", () => {
    const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
    const application = create397ReleaseControlApplication();
    const frozen = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:397:limited-release-first-wave",
      observationWindow: { telemetryPresent: false },
    });
    const freezeRecordId = frozen.freezeRecord?.freezeRecordId ?? "missing";

    expect(() =>
      release397FreezeWithFreshGreenWindow({
        application,
        guardrailManifest,
        freezeRecordId,
        expectedManifestVersion: PHASE7_MANIFEST_VERSION,
        expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
        operatorNoteRef: "OperatorNote:397:test-release",
        greenWindowDays: 6,
      }),
    ).toThrow("397_FRESH_GREEN_WINDOW_REQUIRED");

    const released = release397FreezeWithFreshGreenWindow({
      application,
      guardrailManifest,
      freezeRecordId,
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      operatorNoteRef: "OperatorNote:397:test-release",
      greenWindowDays: 7,
    });

    expect(released.freezeState).toBe("released");
  });

  it("generates a privacy-minimized monthly pack and enforces change-notice lead times", () => {
    const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
    const application = create397ReleaseControlApplication();
    const pack = generate397MonthlyPerformancePack({
      application,
      cohortManifest,
      environment: "limited_release",
      period: "2026-05",
    });
    const notice = submit397JourneyChangeNotice({
      application,
      cohortManifest,
      changeType: "significant",
      affectedJourneys: ["jp_manage_local_appointment"],
      submittedAt: "2026-04-27T00:00:00.000Z",
      plannedChangeAt: "2026-06-01T00:00:00.000Z",
    });

    expect(pack.packId).toBe("NHSAppPerformancePack:397:limited_release:2026-05");
    expect(pack.journeyUsage.map((usage) => usage.journeyPathRef)).toEqual(
      expect.arrayContaining([...PHASE7_397_REQUIRED_JOURNEY_REFS]),
    );
    expect(assert397MonthlyPackRedactionSafe(pack).safeForExport).toBe(true);
    expect(notice.manifestVersion).toBe(PHASE7_MANIFEST_VERSION);
    expect(notice.approvalState).toBe("blocked_lead_time");
  });
});
