import fs from "node:fs";
import path from "node:path";
import type {
  Phase8ExitGateEvidenceInput,
  Phase8ExitPacket,
} from "../../packages/domains/assistive_evaluation/src/phase8-exit-gate.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/assistive_evaluation/src/phase8-exit-gate.ts",
  "data/fixtures/431_phase8_exit_gate_evidence.json",
  "data/contracts/431_phase8_exit_gate_contract.json",
  "data/contracts/431_phase8_exit_packet.json",
  "data/analysis/431_algorithm_alignment_notes.md",
  "data/analysis/431_phase8_open_defects.json",
  "data/analysis/431_phase8_rollback_rehearsal_evidence.json",
  "data/analysis/431_phase8_training_runbook_and_incident_paths.json",
  "data/analysis/431_phase8_exit_gate_summary.md",
  "data/analysis/431_phase8_exit_gate_failed_checks.json",
  "data/analysis/431_phase8_exit_gate_check_table.csv",
  "tools/test/run_phase8_exit_gate.ts",
  "tools/analysis/validate_431_phase8_exit_gate.ts",
  "tests/unit/431_exit_gate_evaluator.spec.ts",
  "tests/integration/431_phase8_exit_packet.spec.ts",
];

const requiredEvidenceTasks = Array.from({ length: 27 }, (_, index) => `par_${404 + index}`);

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(packageJson.scripts?.["test:phase8:exit-gate"], "PACKAGE_SCRIPT_MISSING:test:phase8:exit-gate");
assert(
  packageJson.scripts?.["validate:431-phase8-exit-gate"] ===
    "pnpm exec tsx ./tools/analysis/validate_431_phase8_exit_gate.ts",
  "PACKAGE_SCRIPT_MISSING:validate:431-phase8-exit-gate",
);

const checklist = readText("prompt/checklist.md");
for (let task = 404; task <= 430; task += 1) {
  assert(new RegExp(`^- \\[X\\] par_${task}_`, "m").test(checklist), `CHECKLIST_TASK_NOT_COMPLETE:${task}`);
}
assert(/^- \[(?:-|X)\] par_431_/m.test(checklist), "CHECKLIST_TASK_431_NOT_CLAIMED_OR_COMPLETE");

const fixture = readJson<Phase8ExitGateEvidenceInput>("data/fixtures/431_phase8_exit_gate_evidence.json");
assert(fixture.schemaVersion === "431.phase8.exit-gate.evidence.v1", "FIXTURE_SCHEMA_DRIFT");
assert(fixture.evidenceRecords.length >= 31, "FIXTURE_EVIDENCE_TOO_SMALL");
assert(fixture.checkEvidenceBindings.length === 20, "FIXTURE_REQUIRED_CHECK_BINDING_COUNT_DRIFT");
assert(fixture.openDefects.length === 0, "FIXTURE_OPEN_DEFECTS_NOT_EMPTY");

const producedTasks = new Set(fixture.evidenceRecords.map((record) => record.producedByTask));
for (const task of requiredEvidenceTasks) {
  assert(producedTasks.has(task), `FIXTURE_MISSING_TASK_EVIDENCE:${task}`);
}

for (const command of [
  "pnpm test:phase8:eval",
  "pnpm test:phase8:invocation",
  "pnpm test:phase8:trust-rollout",
  "pnpm test:phase8:exit-gate",
  "pnpm validate:431-phase8-exit-gate",
]) {
  assert(fixture.reproducibleCommands.includes(command), `REPRO_COMMAND_MISSING:${command}`);
}

const packet = readJson<Phase8ExitPacket>("data/contracts/431_phase8_exit_packet.json");
assert(packet.phase === 8, "PACKET_PHASE_DRIFT");
assert(packet.gate === "assistive_layer_completion", "PACKET_GATE_DRIFT");
assert(packet.verdict === "approved_for_phase9", "PACKET_NOT_APPROVED");
assert(packet.requiredChecks.length === 20, "PACKET_REQUIRED_CHECK_COUNT_DRIFT");
assert(packet.requiredChecks.every((check) => check.state === "passed"), "PACKET_HAS_FAILED_CHECK");
assert(packet.requiredChecks.every((check) => check.evidenceFreshnessState === "current"), "PACKET_EVIDENCE_NOT_CURRENT");
assert(packet.blockedReasons.length === 0, "PACKET_HAS_BLOCKED_REASONS");
assert(packet.openDefects.length === 0, "PACKET_OPEN_DEFECTS_NOT_EMPTY");
assert(packet.evidenceBundleHash.length === 64, "PACKET_HASH_NOT_SHA256_HEX");
assert(packet.testReports.length === 3, "PACKET_TEST_REPORT_COUNT_DRIFT");

for (const evidenceRef of ["EV428_OFFLINE_EVAL_REPORT", "EV429_INVOCATION_REPORT", "EV430_TRUST_ROLLOUT_REPORT"]) {
  assert(packet.testReports.some((report) => report.evidenceRef === evidenceRef), `PACKET_TEST_REPORT_MISSING:${evidenceRef}`);
}

for (const requiredRef of [
  "EV405_RELEASE_CANDIDATE_CONTRACTS",
  "EV417_CHANGE_CONTROL_EVIDENCE",
  "EV431_ROLLBACK_REHEARSAL",
  "EV431_TRAINING_RUNBOOK_INCIDENT_PATHS",
]) {
  const joined = JSON.stringify(packet);
  assert(joined.includes(requiredRef), `PACKET_REQUIRED_REF_MISSING:${requiredRef}`);
}

const failedChecks = readJson<unknown[]>("data/analysis/431_phase8_exit_gate_failed_checks.json");
assert(failedChecks.length === 0, "FAILED_CHECKS_NOT_EMPTY");

const summary = readText("data/analysis/431_phase8_exit_gate_summary.md");
for (const token of [
  "Verdict: approved_for_phase9",
  "Evidence bundle hash",
  "PH8_EXIT_001",
  "PH8_EXIT_020",
  "pnpm test:phase8:exit-gate",
]) {
  assert(summary.includes(token), `SUMMARY_TOKEN_MISSING:${token}`);
}

const testText = readText("tests/unit/431_exit_gate_evaluator.spec.ts");
for (const token of [
  "missing",
  "rollback rehearsal",
  "Sev-1",
  "no-autonomous-write",
  "contradictory",
  "wrong-commit",
  "different order",
]) {
  assert(testText.includes(token), `UNIT_TEST_TOKEN_MISSING:${token}`);
}

const contract = readJson<{ allowedVerdicts?: string[]; requiredCheckCount?: number; failClosedRules?: string[] }>(
  "data/contracts/431_phase8_exit_gate_contract.json",
);
assert(contract.allowedVerdicts?.includes("approved_for_phase9"), "CONTRACT_APPROVAL_VERDICT_MISSING");
assert(contract.allowedVerdicts?.includes("blocked"), "CONTRACT_BLOCKED_VERDICT_MISSING");
assert(contract.requiredCheckCount === 20, "CONTRACT_REQUIRED_CHECK_COUNT_DRIFT");
assert((contract.failClosedRules ?? []).includes("contradictory_hash_blocks"), "CONTRACT_CONTRADICTION_RULE_MISSING");

console.log("431 phase8 exit gate validated.");
