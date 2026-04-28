import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/architecture/402_phase7_exit_gate_and_readiness_map.md",
  "docs/release/402_phase7_exit_gate.md",
  "docs/frontend/402_phase7_exit_gate_board.html",
  "docs/api/402_phase7_contract_traceability_registry.md",
  "docs/accessibility/402_phase7_accessibility_and_release_readiness_summary.md",
  "data/contracts/402_phase7_exit_verdict.json",
  "data/contracts/402_phase7_capability_readiness_registry.json",
  "data/contracts/402_phase7_carry_forward_registry.json",
  "data/contracts/402_phase8_launch_conditions.json",
  "data/analysis/402_external_reference_notes.json",
  "data/analysis/402_phase7_contract_consistency_matrix.csv",
  "data/analysis/402_phase7_gate_risk_and_hazard_log.json",
  "tools/analysis/validate_402_phase7_exit_gate.ts",
  "tests/playwright/402_phase7_exit_gate_board.spec.ts",
] as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:402-phase7-exit-gate"] ===
      "pnpm exec tsx ./tools/analysis/validate_402_phase7_exit_gate.ts",
    "package.json missing validate:402-phase7-exit-gate script.",
  );

  const checklist = readText("prompt/checklist.md");
  for (let task = 374; task <= 401; task += 1) {
    invariant(
      new RegExp(`^- \\[X\\] (?:seq|par)_${task}_`, "m").test(checklist),
      `Checklist task ${task} must be complete.`,
    );
  }
  invariant(
    /^- \[(?:-|X)\] par_402_/m.test(checklist),
    "Checklist task 402 must be claimed or complete while this validator runs.",
  );

  const verdict = readJson<{
    taskId?: string;
    verdict?: string;
    releaseClass?: string;
    decisionTimestamp?: string;
    manifestVersionRef?: string;
    blockingRefs?: unknown[];
    carryForwardRefs?: unknown[];
    phase8LaunchConditionRefs?: string[];
    capabilitySummaries?: JsonRecord[];
    operatorSummary?: string;
  }>("data/contracts/402_phase7_exit_verdict.json");
  invariant(verdict.taskId === "seq_402", "402 verdict task id drifted.");
  invariant(verdict.verdict === "approved", "402 verdict must be approved.");
  invariant(
    verdict.releaseClass === "approved_phase7_completion_with_phase8_launch_conditions",
    "402 release class drifted.",
  );
  invariant(
    verdict.manifestVersionRef === "nhsapp-manifest-v0.1.0-freeze-374",
    "402 manifest version drifted.",
  );
  invariant(
    asArray(verdict.blockingRefs, "verdict.blockingRefs").length === 0,
    "402 blockers exist.",
  );
  invariant(
    asArray(verdict.carryForwardRefs, "verdict.carryForwardRefs").length === 0,
    "402 carry-forward refs should be empty.",
  );
  invariant(
    asArray(verdict.phase8LaunchConditionRefs, "verdict.phase8LaunchConditionRefs").length === 6,
    "402 must publish six Phase 8 launch conditions.",
  );
  const summaries = asArray<JsonRecord>(verdict.capabilitySummaries, "verdict.capabilitySummaries");
  invariant(summaries.length === 10, "402 verdict must summarize ten capabilities.");
  invariant(
    summaries.every(
      (entry) => entry.proofStatus === "proved" && entry.releasePosture === "approved",
    ),
    "402 capability summaries must all be proved and approved.",
  );
  invariant(
    String(verdict.operatorSummary ?? "").includes("Phase 7 is approved"),
    "402 operator summary must state the approval.",
  );

  for (const resultPath of [
    "data/test/399_suite_results.json",
    "data/test/400_suite_results.json",
    "data/test/401_suite_results.json",
  ] as const) {
    const result = readJson<{ status?: string; proofs?: JsonRecord[] }>(resultPath);
    invariant(result.status === "passed", `${resultPath} must be passed.`);
    invariant(
      asArray(result.proofs, `${resultPath}.proofs`).length >= 5,
      `${resultPath} missing proofs.`,
    );
  }

  for (const defectPath of [
    "data/test/399_defect_log_and_remediation.json",
    "data/test/400_defect_log_and_remediation.json",
    "data/test/401_defect_log_and_remediation.json",
  ] as const) {
    const defectLog = readJson<{ status?: string; defects?: unknown[] }>(defectPath);
    invariant(defectLog.status === "no_open_defects", `${defectPath} has open defects.`);
    invariant(
      asArray(defectLog.defects, `${defectPath}.defects`).length === 0,
      `${defectPath} should be empty.`,
    );
  }

  const readiness = readJson<{ taskId?: string; capabilities?: JsonRecord[] }>(
    "data/contracts/402_phase7_capability_readiness_registry.json",
  );
  invariant(readiness.taskId === "seq_402", "402 readiness registry task id drifted.");
  const capabilities = asArray<JsonRecord>(readiness.capabilities, "readiness.capabilities");
  invariant(capabilities.length === 10, "402 readiness registry must list ten capabilities.");
  for (const capability of capabilities) {
    invariant(
      /^CAP402_\d\d$/.test(String(capability.capabilityId)),
      "Capability id must use CAP402_nn.",
    );
    invariant(
      capability.proofStatus === "proved",
      `${String(capability.capabilityId)} is not proved.`,
    );
    invariant(
      capability.releasePosture === "approved",
      `${String(capability.capabilityId)} is not approved.`,
    );
    invariant(
      asArray(capability.blockingGapRefs, `${String(capability.capabilityId)}.blockingGapRefs`)
        .length === 0,
      `${String(capability.capabilityId)} has blocking gaps.`,
    );
    invariant(
      asArray(capability.phase8HandoffRefs, `${String(capability.capabilityId)}.phase8HandoffRefs`)
        .length >= 1,
      `${String(capability.capabilityId)} missing Phase 8 handoff refs.`,
    );
  }

  const carryForward = readJson<{
    carryForwardCount?: number;
    blockingCount?: number;
    carryForwards?: unknown[];
  }>("data/contracts/402_phase7_carry_forward_registry.json");
  invariant(carryForward.carryForwardCount === 0, "402 carry-forward count must be zero.");
  invariant(carryForward.blockingCount === 0, "402 blocking count must be zero.");
  invariant(
    asArray(carryForward.carryForwards, "carryForward.carryForwards").length === 0,
    "402 carry-forward rows must be empty.",
  );

  const launchConditions = readJson<{ conditions?: JsonRecord[] }>(
    "data/contracts/402_phase8_launch_conditions.json",
  );
  const conditions = asArray<JsonRecord>(
    launchConditions.conditions,
    "launchConditions.conditions",
  );
  invariant(conditions.length === 6, "402 launch conditions must include six rows.");
  for (let index = 1; index <= 6; index += 1) {
    invariant(
      conditions.some((condition) => condition.conditionId === `LC402_00${index}`),
      `402 launch conditions missing LC402_00${index}.`,
    );
  }

  const riskLog = readJson<{
    openRiskCount?: number;
    openHazardCount?: number;
    risks?: JsonRecord[];
    hazards?: JsonRecord[];
  }>("data/analysis/402_phase7_gate_risk_and_hazard_log.json");
  invariant(riskLog.openRiskCount === 0, "402 risk log has open risks.");
  invariant(riskLog.openHazardCount === 0, "402 risk log has open hazards.");
  invariant(asArray(riskLog.risks, "riskLog.risks").length >= 5, "402 risk log missing risks.");
  invariant(
    asArray(riskLog.hazards, "riskLog.hazards").length >= 3,
    "402 hazard log missing hazards.",
  );

  const rows = readCsv("data/analysis/402_phase7_contract_consistency_matrix.csv");
  invariant(rows.length === 10, "402 consistency matrix must include ten rows.");
  invariant(
    rows.every((row) => row.proof_status === "proved" && row.release_interpretation === "approved"),
    "402 consistency matrix must prove and approve every row.",
  );
  invariant(
    rows.every((row) => row.blocking_gaps === ""),
    "402 consistency matrix has blocking gaps.",
  );

  const externalNotes = readJson<{ sources?: JsonRecord[] }>(
    "data/analysis/402_external_reference_notes.json",
  );
  const sourceUrls = asArray<JsonRecord>(externalNotes.sources, "externalNotes.sources").map(
    (entry) => String(entry.url),
  );
  for (const url of [
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
    "https://service-manual.nhs.uk/accessibility",
    "https://service-manual.nhs.uk/accessibility/testing",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
  ]) {
    invariant(sourceUrls.includes(url), `402 external notes missing ${url}.`);
  }

  const board = readText("docs/frontend/402_phase7_exit_gate_board.html");
  for (const needle of [
    'data-testid="Phase7ExitGateBoard"',
    'data-testid="VerdictStrip"',
    'data-testid="CapabilityRail"',
    'data-testid="EvidenceCanvas"',
    'data-testid="InspectorPanel"',
    'data-testid="TraceabilityTables"',
    "max-width: 1760px",
    "grid-template-columns: 320px minmax(0, 1fr) 420px",
    "height: 76px",
    "#F6F8FB".toLowerCase(),
    "prefers-reduced-motion",
  ]) {
    requireIncludes(board.toLowerCase(), needle.toLowerCase(), "402 gate board");
  }

  const playwrightSpec = readText("tests/playwright/402_phase7_exit_gate_board.spec.ts");
  for (const needle of [
    "Phase7ExitGateBoard",
    "CapabilityButton-CAP402_09",
    "ProofStatusFilter",
    "--run",
  ]) {
    requireIncludes(playwrightSpec, needle, "402 Playwright proof");
  }

  console.log("validate_402_phase7_exit_gate: ok");
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): Record<string, string>[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must include a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} has a malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
