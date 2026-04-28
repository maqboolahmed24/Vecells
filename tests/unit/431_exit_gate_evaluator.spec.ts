import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluatePhase8ExitGate,
  type Phase8ExitEvidenceRecord,
  type Phase8ExitGateEvidenceInput,
} from "../../packages/domains/assistive_evaluation/src/phase8-exit-gate.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function canonicalInput(): Phase8ExitGateEvidenceInput {
  return readJson<Phase8ExitGateEvidenceInput>("data/fixtures/431_phase8_exit_gate_evidence.json");
}

function cloneInput(input: Phase8ExitGateEvidenceInput = canonicalInput()): Phase8ExitGateEvidenceInput {
  return JSON.parse(JSON.stringify(input)) as Phase8ExitGateEvidenceInput;
}

function replaceRecord(
  input: Phase8ExitGateEvidenceInput,
  evidenceRef: string,
  patch: Partial<Phase8ExitEvidenceRecord>,
): Phase8ExitGateEvidenceInput {
  return {
    ...input,
    evidenceRecords: input.evidenceRecords.map((record) =>
      record.evidenceRef === evidenceRef ? { ...record, ...patch } : record,
    ),
  };
}

function check(input: Phase8ExitGateEvidenceInput, checkId: string) {
  const packet = evaluatePhase8ExitGate(input);
  const result = packet.requiredChecks.find((candidate) => candidate.checkId === checkId);
  if (!result) {
    throw new Error(`Missing check ${checkId}`);
  }
  return result;
}

describe("431 Phase 8 exit gate evaluator", () => {
  it("approves Phase 9 only when every required Phase 8 exit check passes", () => {
    const packet = evaluatePhase8ExitGate(canonicalInput());

    expect(packet.verdict).toBe("approved_for_phase9");
    expect(packet.requiredChecks).toHaveLength(20);
    expect(packet.requiredChecks.every((requiredCheck) => requiredCheck.state === "passed")).toBe(true);
    expect(packet.blockedReasons).toEqual([]);
    expect(packet.testReports.map((report) => report.evidenceRef)).toEqual([
      "EV428_OFFLINE_EVAL_REPORT",
      "EV429_INVOCATION_REPORT",
      "EV430_TRUST_ROLLOUT_REPORT",
    ]);
  });

  it("blocks when the hallucination and citation regression report is missing", () => {
    const input = replaceRecord(cloneInput(), "EV428_OFFLINE_EVAL_REPORT", { exists: false, status: "missing" });
    const packet = evaluatePhase8ExitGate(input);

    expect(packet.verdict).toBe("blocked");
    expect(check(input, "PH8_EXIT_004")).toMatchObject({
      state: "failed",
      evidenceFreshnessState: "missing",
    });
  });

  it("blocks when rollback rehearsal evidence is stale", () => {
    const input = replaceRecord(cloneInput(), "EV431_ROLLBACK_REHEARSAL", {
      expiresAt: "2026-04-26T23:00:00.000Z",
    });

    expect(evaluatePhase8ExitGate(input).verdict).toBe("blocked");
    expect(check(input, "PH8_EXIT_017")).toMatchObject({
      state: "failed",
      evidenceFreshnessState: "stale",
    });
  });

  it("blocks when an open Sev-1 or Sev-2 visible assistive defect remains", () => {
    const input: Phase8ExitGateEvidenceInput = {
      ...cloneInput(),
      openDefects: [
        {
          defectId: "DEF431_SEV1_VISIBLE_INSERT",
          severity: "sev1",
          status: "open",
          surfaceRef: "assistive_stage",
          summary: "Insert affordance remains live after freeze.",
        },
      ],
    };

    const packet = evaluatePhase8ExitGate(input);

    expect(packet.verdict).toBe("blocked");
    expect(check(input, "PH8_EXIT_001").deterministicReason).toContain("Sev-1 or Sev-2");
  });

  it("blocks when no-autonomous-write evidence is not explicitly tagged", () => {
    const source = cloneInput();
    const checkTwoRefs = new Set(
      source.checkEvidenceBindings.find((binding) => binding.checkId === "PH8_EXIT_002")?.evidenceRefs ?? [],
    );
    const input: Phase8ExitGateEvidenceInput = {
      ...source,
      evidenceRecords: source.evidenceRecords.map((record) =>
        checkTwoRefs.has(record.evidenceRef)
          ? { ...record, tags: record.tags?.filter((tag) => tag !== "no_autonomous_write") ?? [] }
          : record,
      ),
    };

    expect(evaluatePhase8ExitGate(input).verdict).toBe("blocked");
    expect(check(input, "PH8_EXIT_002").deterministicReason).toContain("no_autonomous_write");
  });

  it("blocks contradictory report hashes", () => {
    const source = cloneInput();
    const report = source.evidenceRecords.find((record) => record.evidenceRef === "EV430_TRUST_ROLLOUT_REPORT");
    if (!report) {
      throw new Error("Missing trust rollout report evidence");
    }
    const input: Phase8ExitGateEvidenceInput = {
      ...source,
      evidenceRecords: [...source.evidenceRecords, { ...report, contentHash: "sha256:contradictory" }],
    };

    expect(evaluatePhase8ExitGate(input).verdict).toBe("blocked");
    expect(check(input, "PH8_EXIT_011").evidenceFreshnessState).toBe("contradictory");
  });

  it("blocks wrong-commit test reports", () => {
    const input = replaceRecord(cloneInput(), "EV429_INVOCATION_REPORT", { commitRef: "000000000000" });

    expect(evaluatePhase8ExitGate(input).verdict).toBe("blocked");
    expect(check(input, "PH8_EXIT_002").evidenceFreshnessState).toBe("wrong_commit");
  });

  it("recomputes the same bundle hash from the same inputs in a different order", () => {
    const source = cloneInput();
    const reordered: Phase8ExitGateEvidenceInput = {
      ...source,
      evidenceRecords: [...source.evidenceRecords].reverse(),
      checkEvidenceBindings: [...source.checkEvidenceBindings].reverse(),
      reproducibleCommands: [...source.reproducibleCommands].reverse(),
    };

    const first = evaluatePhase8ExitGate(source);
    const second = evaluatePhase8ExitGate(reordered);

    expect(first.verdict).toBe("approved_for_phase9");
    expect(second.verdict).toBe("approved_for_phase9");
    expect(second.evidenceBundleHash).toBe(first.evidenceBundleHash);
  });
});
