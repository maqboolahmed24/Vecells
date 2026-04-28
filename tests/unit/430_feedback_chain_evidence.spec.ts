import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectTrustRolloutProhibitedRequests,
  evaluateFeedbackRecord,
  evaluatePhase8TrustRolloutFixture,
  type Phase8TrustRolloutCorpus,
  type Phase8TrustRolloutFixture,
} from "../../packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function corpus(): Phase8TrustRolloutCorpus {
  return readJson<Phase8TrustRolloutCorpus>("data/fixtures/430_phase8_trust_rollout_fixtures.json");
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

describe("430 feedback chain evidence", () => {
  it("covers governed feedback event types with actor, state, audit, evidence, and idempotency", () => {
    const feedbackEvents = new Set(
      corpus()
        .fixtures.map((fixture) => fixture.feedbackRecord?.eventType)
        .filter(Boolean),
    );

    expect(feedbackEvents).toEqual(
      new Set([
        "accepted_suggestion",
        "rejected_suggestion",
        "edited_suggestion",
        "override_reason",
        "reliance_without_insertion",
        "rationale_quality",
        "citation_correctness",
        "stale_frozen_feedback",
        "feedback_cancellation",
      ]),
    );
    for (const fixture of corpus().fixtures.filter((candidate) => candidate.feedbackRecord)) {
      expect(evaluateFeedbackRecord(fixture.feedbackRecord).passed).toBe(true);
    }
  });

  it("fails feedback without idempotency or audit evidence", () => {
    const fixture = fixtureById("PH8-430-TRUSTED-GROUNDED-001");
    fixture.feedbackRecord = {
      ...fixture.feedbackRecord!,
      idempotencyKey: "",
      dedupeKey: "",
      auditRef: "",
    };

    const verdict = evaluatePhase8TrustRolloutFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toEqual(
      expect.arrayContaining(["feedback_idempotency_missing", "feedback_audit_missing"]),
    );
  });

  it("fails closed when feedback implies an authoritative workflow mutation", () => {
    const fixture = fixtureById("PH8-430-LOW-CONFIDENCE-002");
    fixture.feedbackRecord = {
      ...fixture.feedbackRecord!,
      authoritativeMutation: true,
    };
    fixture.observed.networkRequests = ["/api/assistive/feedback-audit", "/api/request/save-authoritative"];

    const verdict = evaluatePhase8TrustRolloutFixture(fixture);

    expect(detectTrustRolloutProhibitedRequests(fixture.observed.networkRequests)).toEqual([
      "/api/request/save-authoritative",
    ]);
    expect(verdict.failures.map((failure) => failure.failureType)).toEqual(
      expect.arrayContaining(["feedback_authoritative_mutation", "prohibited_network_mutation"]),
    );
  });

  it("detects hidden blocked content and support disclosure leakage", () => {
    const fixture = fixtureById("PH8-430-PARTIAL-DISCLOSURE-011");
    fixture.observed.hiddenDomText = "CLINICIAN_ONLY_RATIONALE";

    const verdict = evaluatePhase8TrustRolloutFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("hidden_dom_leak");
  });
});
