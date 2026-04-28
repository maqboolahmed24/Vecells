import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  evaluatePhase8ExitGate,
  phase8ExitChecksToCsv,
  summarizePhase8ExitPacket,
  type Phase8ExitEvidenceRecord,
  type Phase8ExitGateEvidenceInput,
} from "../../packages/domains/assistive_evaluation/src/phase8-exit-gate.ts";

const root = process.cwd();
const fixturePath = path.join(root, "data", "fixtures", "431_phase8_exit_gate_evidence.json");
const contractsDir = path.join(root, "data", "contracts");
const analysisDir = path.join(root, "data", "analysis");
const packetPath = path.join(contractsDir, "431_phase8_exit_packet.json");
const summaryPath = path.join(analysisDir, "431_phase8_exit_gate_summary.md");
const failedChecksPath = path.join(analysisDir, "431_phase8_exit_gate_failed_checks.json");
const checkTablePath = path.join(analysisDir, "431_phase8_exit_gate_check_table.csv");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function currentCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown-local";
  }
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
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

  const filePath = path.join(root, record.path);
  const exists = fs.existsSync(filePath);
  const enriched: Phase8ExitEvidenceRecord = {
    ...record,
    exists,
    contentHash: exists ? sha256File(filePath) : record.contentHash,
  };

  if (exists && record.kind === "test_report" && record.path.endsWith(".json")) {
    const report = readJson<{
      commit?: string;
      generatedAt?: string;
      summary?: { suitePassed?: boolean };
      reportVersion?: string;
    }>(filePath);
    return {
      ...enriched,
      commitRef: report.commit ?? enriched.commitRef,
      generatedAt: report.generatedAt ?? enriched.generatedAt,
      status: report.summary?.suitePassed === false ? "failed" : enriched.status,
      schemaVersion: report.reportVersion ?? enriched.schemaVersion,
    };
  }

  if (exists && record.path.endsWith(".json")) {
    const artifact = readJson<{ generatedAt?: string; schemaVersion?: string; status?: string }>(filePath);
    return {
      ...enriched,
      generatedAt: artifact.generatedAt ?? enriched.generatedAt,
      schemaVersion: artifact.schemaVersion ?? enriched.schemaVersion,
      status:
        artifact.status === "failed" || artifact.status === "open" || artifact.status === "missing"
          ? artifact.status
          : enriched.status,
    };
  }

  return enriched;
}

const sourceInput = readJson<Phase8ExitGateEvidenceInput>(fixturePath);
const input: Phase8ExitGateEvidenceInput = {
  ...sourceInput,
  commitRef: currentCommit(),
  evidenceRecords: sourceInput.evidenceRecords.map(materializeRecord),
};
const packet = evaluatePhase8ExitGate(input);

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase8ExitPacket(packet));
fs.writeFileSync(
  failedChecksPath,
  `${JSON.stringify(
    packet.requiredChecks.filter((check) => check.state === "failed"),
    null,
    2,
  )}\n`,
);
fs.writeFileSync(checkTablePath, phase8ExitChecksToCsv(packet));

console.log(`Phase 8 exit gate packet: ${path.relative(root, packetPath)}`);
console.log(`Verdict: ${packet.verdict}`);
console.log(
  `Checks: ${packet.requiredChecks.filter((check) => check.state === "passed").length}/${packet.requiredChecks.length}`,
);
console.log(`Evidence bundle hash: ${packet.evidenceBundleHash}`);

if (packet.verdict !== "approved_for_phase9") {
  process.exitCode = 1;
}
