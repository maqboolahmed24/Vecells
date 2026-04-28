import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluatePhase8Corpus,
  evaluatePhase8Fixture,
  type Phase8OfflineEvalCorpus,
  type Phase8OfflineEvalFixture,
  type Phase8ThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-offline-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function corpus(): Phase8OfflineEvalCorpus {
  return readJson<Phase8OfflineEvalCorpus>("data/fixtures/428_phase8_offline_eval_corpus.json");
}

function thresholds(): Phase8ThresholdConfig {
  return readJson<Phase8ThresholdConfig>("data/config/428_phase8_eval_thresholds.json");
}

function cloneFixture(fixture: Phase8OfflineEvalFixture): Phase8OfflineEvalFixture {
  return JSON.parse(JSON.stringify(fixture)) as Phase8OfflineEvalFixture;
}

function fixtureById(fixtureId: string): Phase8OfflineEvalFixture {
  const fixture = corpus().fixtures.find((candidate) => candidate.fixtureId === fixtureId);
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureId}`);
  }
  return cloneFixture(fixture);
}

describe("428 hallucination and grounding checks", () => {
  it("passes the canonical corpus without live model calls", () => {
    const report = evaluatePhase8Corpus(corpus(), thresholds(), {
      commit: "unit-test",
      generatedAt: "2026-04-27T09:00:00.000Z",
      evaluatorVersion: "unit-test-evaluator",
      command: "vitest",
    });

    expect(report.summary.suitePassed).toBe(true);
    expect(report.failedFixtures).toEqual([]);
    expect(report.metrics.hallucinationRate).toBe(0);
    expect(report.metrics.citationValidityRate).toBe(1);
  });

  it("fails closed when a plausible but absent fact is introduced", () => {
    const fixture = fixtureById("PH8-428-HALLUCINATION-TRAP-008");
    fixture.generatedOutput.claims = [
      ...fixture.generatedOutput.claims,
      {
        claimRef: "claim:hallucination:invented-travel",
        text: "Recent travel explains the fatigue.",
        kind: "clinical_reassurance",
        sourceRefs: ["src:hallucination:review"],
        certainty: "high",
        requiresEvidence: true,
      },
    ];

    const verdict = evaluatePhase8Fixture(fixture);

    expect(verdict.observedOutcome).toBe("fail_closed");
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("unsupported_clinical_reassurance");
  });

  it("detects fabricated and unrelated citations", () => {
    const fabricated = fixtureById("PH8-428-CITATION-TRAP-009");
    fabricated.generatedOutput.citations = [
      {
        citationRef: "cite:citation:wrong",
        sourceRef: "src:citation:missing",
        claimRef: "claim:citation:receipt-only",
        relationship: "supports",
      },
    ];
    fabricated.generatedOutput.rationaleSourceRefs = ["src:citation:missing"];

    const unrelated = fixtureById("PH8-428-CITATION-TRAP-009");
    unrelated.generatedOutput.citations = [
      {
        citationRef: "cite:citation:policy-wrong",
        sourceRef: "src:citation:policy",
        claimRef: "claim:citation:receipt-only",
        relationship: "supports",
      },
    ];
    unrelated.generatedOutput.rationaleSourceRefs = ["src:citation:policy"];

    expect(evaluatePhase8Fixture(fabricated).failures.map((failure) => failure.failureType)).toContain(
      "fabricated_citation",
    );
    expect(evaluatePhase8Fixture(unrelated).failures.map((failure) => failure.failureType)).toContain("unrelated_citation");
  });

  it("requires stale evidence warnings before stale output can remain visible as provenance", () => {
    const fixture = fixtureById("PH8-428-STALE-SOURCE-004");
    delete fixture.generatedOutput.freshnessWarning;

    const verdict = evaluatePhase8Fixture(fixture);

    expect(verdict.observedOutcome).toBe("fail_closed");
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("stale_evidence_without_warning");
  });
});
