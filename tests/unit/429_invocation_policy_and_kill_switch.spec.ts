import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDraftInsertionCommand,
  evaluateInvocationPolicy,
  evaluatePhase8InvocationCorpus,
  evaluatePhase8InvocationFixture,
  evaluateRolloutSlice,
  highestPrecedenceKillSwitch,
  type Phase8InvocationRegressionCorpus,
  type Phase8InvocationRegressionFixture,
  type Phase8InvocationThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function corpus(): Phase8InvocationRegressionCorpus {
  return readJson<Phase8InvocationRegressionCorpus>("data/fixtures/429_phase8_invocation_regression_fixtures.json");
}

function thresholds(): Phase8InvocationThresholdConfig {
  return readJson<Phase8InvocationThresholdConfig>("data/config/429_phase8_invocation_thresholds.json");
}

function cloneFixture(fixture: Phase8InvocationRegressionFixture): Phase8InvocationRegressionFixture {
  return JSON.parse(JSON.stringify(fixture)) as Phase8InvocationRegressionFixture;
}

function fixtureById(fixtureId: string): Phase8InvocationRegressionFixture {
  const fixture = corpus().fixtures.find((candidate) => candidate.fixtureId === fixtureId);
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureId}`);
  }
  return cloneFixture(fixture);
}

describe("429 invocation policy and kill-switch regression", () => {
  it("passes the canonical invocation corpus and all thresholds", () => {
    const report = evaluatePhase8InvocationCorpus(corpus(), thresholds(), {
      commit: "unit-test",
      generatedAt: "2026-04-27T10:00:00.000Z",
      evaluatorVersion: "unit-test-evaluator",
      command: "vitest",
    });

    expect(report.summary.suitePassed).toBe(true);
    expect(report.failedFixtures).toEqual([]);
    expect(report.metrics.fixturePassRate).toBe(1);
    expect(report.metrics.killSwitchCoverageRate).toBe(1);
    expect(report.metrics.prohibitedNetworkMutationRate).toBe(0);
  });

  it("evaluates role, rollout, trust, publication, and disclosure gates before invocation", () => {
    const allowed = evaluateInvocationPolicy(fixtureById("PH8-429-ALLOWED-TRIAGE-001"));
    expect(allowed.invocationAllowed).toBe(true);
    expect(allowed.draftInsertionPermitted).toBe(true);
    expect(allowed.reasonCodes).toEqual([]);

    const denied = evaluateInvocationPolicy(fixtureById("PH8-429-HARD-BLOCK-015"));
    expect(denied.invocationAllowed).toBe(false);
    expect(denied.reasonCodes).toEqual(
      expect.arrayContaining(["rollout_disabled", "trust_hard_blocked", "publication_mismatch", "disclosure_denied"]),
    );
  });

  it("keeps rollout-slice visibility pinned to current runtime publication", () => {
    expect(evaluateRolloutSlice("visible_assistive", "current")).toEqual({
      visibleControls: true,
      observeOnly: false,
      reasonCodes: [],
    });
    expect(evaluateRolloutSlice("shadow", "current")).toEqual({
      visibleControls: false,
      observeOnly: true,
      reasonCodes: ["rollout_shadow"],
    });
    expect(evaluateRolloutSlice("visible_assistive", "mismatch")).toEqual({
      visibleControls: false,
      observeOnly: false,
      reasonCodes: ["publication_mismatch"],
    });
  });

  it("applies kill-switch precedence and freezes already-open output", () => {
    expect(highestPrecedenceKillSwitch(["cohort_slice", "tenant", "route_family"])).toBe("tenant");
    expect(highestPrecedenceKillSwitch(["runtime_publication_rollback", "artifact_quarantine"])).toBe(
      "artifact_quarantine",
    );

    const fixture = fixtureById("PH8-429-GLOBAL-KILL-010");
    const verdict = evaluatePhase8InvocationFixture(fixture);

    expect(verdict.passed).toBe(true);
    expect(fixture.observed.outputState).toBe("frozen");
    expect(fixture.observed.blockedActions).toEqual(expect.arrayContaining(["invoke_assistive", "insert_draft"]));
  });

  it("fails closed when a kill switch leaves invocation or insertion available", () => {
    const fixture = fixtureById("PH8-429-TENANT-KILL-011");
    fixture.observed.allowedActions = [...fixture.observed.allowedActions, "invoke_assistive", "insert_draft"];

    const verdict = evaluatePhase8InvocationFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("kill_switch_not_enforced");
  });

  it("blocks draft commands when policy does not permit insertion", () => {
    const blockedCommand = buildDraftInsertionCommand(fixtureById("PH8-429-SESSION-STALE-FREEZE-016"), "clinician");

    expect(blockedCommand.status).toBe("blocked");
    expect(blockedCommand.reasonCodes).toEqual(
      expect.arrayContaining(["trust_stale", "kill_switch_workspace_session_stale_freeze"]),
    );
  });
});
