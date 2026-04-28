import { describe, expect, it } from "vitest";

import {
  PHASE7_397_REQUIRED_JOURNEY_REFS,
  assert397MonthlyPackRedactionSafe,
  create397ReleaseControlApplication,
  evaluate397ReleaseGuardrails,
  generate397MonthlyPerformancePack,
  buildDefault397ReleaseGuardrailPolicyManifest,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";

describe("397 release control properties", () => {
  it("keeps an active freeze until explicit release even after a green refresh", () => {
    const application = create397ReleaseControlApplication();
    const frozen = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:397:limited-release-first-wave",
      observationWindow: { telemetryPresent: false },
    });
    const refreshed = application.evaluateCohort({
      cohortId: "ChannelReleaseCohort:397:limited-release-first-wave",
    });

    expect(frozen.decision).toBe("freeze");
    expect(refreshed.decision).toBe("freeze");
    expect(refreshed.failureReasons).toContain("active_freeze");
    expect(refreshed.freezeRecord?.freezeRecordId).toBe(frozen.freezeRecord?.freezeRecordId);
  });

  it("treats each freeze trigger as monotonic freeze-required evidence", () => {
    const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
    const observations = [
      { telemetryPresent: false },
      { authFailureRate: 0.021 },
      { journeyErrorRate: 0.031 },
      { downloadFailureRate: 0.051 },
      { supportContactRate: 0.021 },
      { bridgeFailureRate: 0.031 },
      { assuranceSliceState: "degraded" as const },
      { compatibilityEvidenceState: "stale" as const },
      { continuityEvidenceState: "degraded" as const },
    ];

    for (const observationWindow of observations) {
      const result = evaluate397ReleaseGuardrails({ guardrailManifest, observationWindow });

      expect(result.guardrailState).toBe("freeze_required");
      expect(result.triggerTypes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps monthly pack counts bounded and redaction-safe for representative sample sizes", () => {
    for (const sampleSize of [25, 50, 100, 250]) {
      const pack = generate397MonthlyPerformancePack({
        environment: "limited_release",
        period: `2026-${String(5 + sampleSize / 25).padStart(2, "0")}`,
        observationWindow: { sampleSize },
      });

      expect(pack.journeyUsage.map((usage) => usage.journeyPathRef)).toEqual(
        expect.arrayContaining([...PHASE7_397_REQUIRED_JOURNEY_REFS]),
      );
      expect(
        pack.journeyUsage.every(
          (usage) =>
            usage.routeEntryCount === sampleSize &&
            usage.successfulCompletionCount <= usage.routeEntryCount,
        ),
      ).toBe(true);
      expect(assert397MonthlyPackRedactionSafe(pack).safeForExport).toBe(true);
    }
  });
});
