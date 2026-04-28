import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluatePhase8TrustRolloutCorpus,
  evaluatePhase8TrustRolloutFixture,
  evaluateRolloutVerdict,
  expectedTrustLabel,
  type Phase8TrustRolloutCorpus,
  type Phase8TrustRolloutFixture,
  type Phase8TrustRolloutThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function corpus(): Phase8TrustRolloutCorpus {
  return readJson<Phase8TrustRolloutCorpus>("data/fixtures/430_phase8_trust_rollout_fixtures.json");
}

function thresholds(): Phase8TrustRolloutThresholdConfig {
  return readJson<Phase8TrustRolloutThresholdConfig>("data/config/430_phase8_trust_rollout_thresholds.json");
}

function cloneFixture(fixture: Phase8TrustRolloutFixture): Phase8TrustRolloutFixture {
  return JSON.parse(JSON.stringify(fixture)) as Phase8TrustRolloutFixture;
}

function fixtureById(fixtureId: string): Phase8TrustRolloutFixture {
  const fixture = corpus().fixtures.find((candidate) => candidate.fixtureId === fixtureId);
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureId}`);
  }
  return cloneFixture(fixture);
}

describe("430 trust envelope and rollout policy", () => {
  it("passes the canonical trust and rollout corpus", () => {
    const report = evaluatePhase8TrustRolloutCorpus(corpus(), thresholds(), {
      commit: "unit-test",
      generatedAt: "2026-04-27T11:00:00.000Z",
      evaluatorVersion: "unit-test-evaluator",
      command: "vitest",
    });

    expect(report.summary.suitePassed).toBe(true);
    expect(report.failedFixtures).toEqual([]);
    expect(report.metrics.trustStateCoverageRate).toBe(1);
    expect(report.metrics.rolloutScenarioCoverageRate).toBe(1);
  });

  it("keeps degraded trust labels distinct instead of flattening them", () => {
    expect(expectedTrustLabel("low_confidence")).toBe("Low confidence");
    expect(expectedTrustLabel("drift_warning")).toBe("Drift warning");
    expect(expectedTrustLabel("fairness_variance")).toBe("Fairness variance");
    expect(expectedTrustLabel("rolled_back")).toBe("Rolled back");

    const fixture = fixtureById("PH8-430-DRIFT-WARNING-005");
    fixture.observed.trustLabel = "Unavailable";

    const verdict = evaluatePhase8TrustRolloutFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("trust_state_flattened");
  });

  it("requires provenance before visible confidence is shown", () => {
    const fixture = fixtureById("PH8-430-TRUSTED-GROUNDED-001");
    fixture.observed.rationaleProvenanceChips = [];

    const verdict = evaluatePhase8TrustRolloutFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("confidence_without_provenance");
  });

  it("does not allow stale or rolled-back publication to look current", () => {
    const stale = fixtureById("PH8-430-STALE-SOURCE-004");
    stale.observed.freshnessState = "current";

    const rollback = fixtureById("PH8-430-ROLLED-BACK-010");
    rollback.observed.rolloutLanguage = "Current visible rollout";

    expect(evaluatePhase8TrustRolloutFixture(stale).failures.map((failure) => failure.failureType)).toContain(
      "freshness_mismatch",
    );
    expect(evaluatePhase8TrustRolloutFixture(rollback).failures.map((failure) => failure.failureType)).toContain(
      "rollout_publication_not_pinned",
    );
  });

  it("computes rollout verdicts monotonically from slice and publication state", () => {
    expect(evaluateRolloutVerdict(fixtureById("PH8-430-TRUSTED-GROUNDED-001").rolloutVerdict)).toMatchObject({
      renderPosture: "visible",
      insertPosture: "enabled",
    });
    expect(evaluateRolloutVerdict(fixtureById("PH8-430-UNGROUNDED-CITATION-003").rolloutVerdict)).toMatchObject({
      renderPosture: "shadow_only",
      insertPosture: "blocked",
    });
    expect(evaluateRolloutVerdict(fixtureById("PH8-430-ROLLED-BACK-010").rolloutVerdict)).toMatchObject({
      renderPosture: "read_only_provenance",
      insertPosture: "blocked",
    });
  });
});
