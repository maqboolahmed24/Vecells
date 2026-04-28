import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluatePhase8ExitGate,
  type Phase8ExitEvidenceRecord,
  type Phase8ExitGateEvidenceInput,
  type Phase8ExitPacket,
} from "../../packages/domains/assistive_evaluation/src/phase8-exit-gate.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function fileHash(relativePath: string): string {
  return createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function materializeRecord(record: Phase8ExitEvidenceRecord): Phase8ExitEvidenceRecord {
  if (!record.path) {
    return {
      ...record,
      contentHash:
        record.contentHash ??
        createHash("sha256")
          .update(JSON.stringify({ evidenceRef: record.evidenceRef, command: record.command, status: record.status }))
          .digest("hex"),
    };
  }

  const exists = fs.existsSync(path.join(root, record.path));
  const enriched: Phase8ExitEvidenceRecord = {
    ...record,
    exists,
    contentHash: exists ? fileHash(record.path) : record.contentHash,
  };

  if (exists && record.kind === "test_report" && record.path.endsWith(".json")) {
    const report = readJson<{
      commit?: string;
      generatedAt?: string;
      summary?: { suitePassed?: boolean };
      reportVersion?: string;
    }>(record.path);
    return {
      ...enriched,
      commitRef: report.commit ?? enriched.commitRef,
      generatedAt: report.generatedAt ?? enriched.generatedAt,
      status: report.summary?.suitePassed === false ? "failed" : enriched.status,
      schemaVersion: report.reportVersion ?? enriched.schemaVersion,
    };
  }

  if (exists && record.path.endsWith(".json")) {
    const artifact = readJson<{ generatedAt?: string; schemaVersion?: string; status?: string }>(record.path);
    return {
      ...enriched,
      generatedAt: artifact.generatedAt ?? enriched.generatedAt,
      schemaVersion: artifact.schemaVersion ?? enriched.schemaVersion,
    };
  }

  return enriched;
}

describe("431 Phase 8 exit packet", () => {
  it("recomputes the approved packet deterministically from the evidence fixture", () => {
    const fixture = readJson<Phase8ExitGateEvidenceInput>("data/fixtures/431_phase8_exit_gate_evidence.json");
    const packet = readJson<Phase8ExitPacket>("data/contracts/431_phase8_exit_packet.json");
    const recomputed = evaluatePhase8ExitGate({
      ...fixture,
      commitRef: packet.commitRef,
      evidenceRecords: fixture.evidenceRecords.map(materializeRecord),
    });

    expect(packet.verdict).toBe("approved_for_phase9");
    expect(packet.requiredChecks).toHaveLength(20);
    expect(packet.blockedReasons).toEqual([]);
    expect(packet.evidenceBundleHash).toBe(recomputed.evidenceBundleHash);
    expect(packet.requiredChecks).toEqual(recomputed.requiredChecks);
  });

  it("writes Phase 9 consumable gate evidence artifacts", () => {
    const packet = readJson<Phase8ExitPacket>("data/contracts/431_phase8_exit_packet.json");
    const summary = fs.readFileSync(path.join(root, "data/analysis/431_phase8_exit_gate_summary.md"), "utf8");
    const failed = readJson<unknown[]>("data/analysis/431_phase8_exit_gate_failed_checks.json");
    const table = fs.readFileSync(path.join(root, "data/analysis/431_phase8_exit_gate_check_table.csv"), "utf8");

    expect(packet.phase).toBe(8);
    expect(packet.gate).toBe("assistive_layer_completion");
    expect(packet.phase9PrerequisiteContractRefs).toEqual(expect.arrayContaining(["prompt/432.md", "prompt/433.md"]));
    expect(packet.testReports.map((report) => report.evidenceRef)).toEqual([
      "EV428_OFFLINE_EVAL_REPORT",
      "EV429_INVOCATION_REPORT",
      "EV430_TRUST_ROLLOUT_REPORT",
    ]);
    expect(summary).toContain("Verdict: approved_for_phase9");
    expect(summary).toContain("pnpm test:phase8:exit-gate");
    expect(table).toContain("PH8_EXIT_020");
    expect(failed).toEqual([]);
  });
});
