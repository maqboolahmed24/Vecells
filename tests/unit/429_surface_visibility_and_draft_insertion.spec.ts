import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDraftInsertionCommand,
  detectProhibitedMutationRequests,
  enforceDisclosureFence,
  evaluatePhase8InvocationFixture,
  settleDraftInsertionCommand,
  type Phase8InvocationRegressionCorpus,
  type Phase8InvocationRegressionFixture,
} from "../../packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function corpus(): Phase8InvocationRegressionCorpus {
  return readJson<Phase8InvocationRegressionCorpus>("data/fixtures/429_phase8_invocation_regression_fixtures.json");
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

describe("429 surface visibility and draft insertion boundaries", () => {
  it("denies raw patient-facing assistive content while allowing human-settled transformed copy", () => {
    const denied = fixtureById("PH8-429-PATIENT-SURFACE-DENIED-007");
    const transformed = fixtureById("PH8-429-HUMAN-SETTLED-PATIENT-017");

    expect(enforceDisclosureFence(denied)).toEqual({
      allowed: false,
      ceiling: "none",
      reasonCodes: ["wrong_audience_surface"],
    });
    expect(evaluatePhase8InvocationFixture(denied).passed).toBe(true);

    expect(enforceDisclosureFence(transformed)).toEqual({
      allowed: true,
      ceiling: "human_transformed",
      reasonCodes: [],
    });
    expect(evaluatePhase8InvocationFixture(transformed).passed).toBe(true);
  });

  it("enforces support replay partial disclosure ceilings", () => {
    const fixture = fixtureById("PH8-429-SUPPORT-REPLAY-004");
    expect(enforceDisclosureFence(fixture)).toEqual({
      allowed: true,
      ceiling: "partial",
      reasonCodes: [],
    });

    fixture.observed.visibleText = "Masked context plus clinician-only rationale";
    const verdict = evaluatePhase8InvocationFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("disclosure_fence_violation");
  });

  it("binds draft insertion to a visible human command and settlement identity", () => {
    const fixture = fixtureById("PH8-429-DRAFT-COMMS-002");
    const command = buildDraftInsertionCommand(fixture, "clinician");
    const settlement = settleDraftInsertionCommand(command);

    expect(command.status).toBe("ready");
    expect(settlement.initiatedBy).toBe("human");
    expect(settlement.finalAuthority).toBe("human_command");
    expect(settlement.suggestionMarked).toBe(true);
    expect(settlement.undoAvailable).toBe(true);
  });

  it("fails closed when inserted draft text is model-authoritative or not reversible", () => {
    const fixture = fixtureById("PH8-429-DRAFT-COMMS-002");
    fixture.observed.commandSettlement = {
      ...fixture.observed.commandSettlement!,
      finalAuthority: "model_command",
      undoAvailable: false,
    };

    const verdict = evaluatePhase8InvocationFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("autonomous_write_path");
  });

  it("detects hidden DOM and prohibited mutation endpoint leaks", () => {
    const fixture = fixtureById("PH8-429-PATIENT-SURFACE-DENIED-007");
    fixture.observed.hiddenDomText = "RAW_ASSISTIVE_RATIONALE";
    fixture.observed.networkRequests = [
      "/api/assistive/surface-denial-audit",
      "/api/patient/send",
      "/api/booking/commit",
    ];

    expect(detectProhibitedMutationRequests(fixture.observed.networkRequests)).toEqual([
      "/api/patient/send",
      "/api/booking/commit",
    ]);

    const verdict = evaluatePhase8InvocationFixture(fixture);
    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toEqual(
      expect.arrayContaining(["hidden_dom_leak", "prohibited_network_mutation"]),
    );
  });

  it("requires artifact previews to carry presentation contract proof", () => {
    const fixture = fixtureById("PH8-429-ARTIFACT-QUARANTINE-009");
    delete fixture.observed.artifactPresentation;

    const verdict = evaluatePhase8InvocationFixture(fixture);

    expect(verdict.passed).toBe(false);
    expect(verdict.failures.map((failure) => failure.failureType)).toContain("artifact_contract_missing");
  });
});
