import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

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

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must include a CSV header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} has a malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asRecord(value: unknown, label: string): JsonRecord {
  invariant(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object.`,
  );
  return value as JsonRecord;
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

const REQUIRED_FILES = [
  "docs/release/372_phase6_exit_gate_decision.md",
  "docs/architecture/372_phase6_completion_and_phase7_handoff_map.md",
  "docs/testing/372_phase6_evidence_review_guide.md",
  "docs/safety/372_phase6_release_hazard_and_control_summary.md",
  "docs/frontend/372_phase6_exit_gate_board.html",
  "data/contracts/372_phase6_exit_verdict.json",
  "data/contracts/372_phase6_release_readiness_registry.json",
  "data/contracts/372_phase6_to_phase7_handoff_contract.json",
  "data/contracts/372_phase6_rollout_guardrail_pack.json",
  "data/analysis/372_external_reference_notes.json",
  "data/analysis/372_phase6_contract_consistency_matrix.csv",
  "data/analysis/372_phase6_evidence_matrix.csv",
  "data/analysis/372_phase6_blocker_ledger.json",
  "data/analysis/372_phase6_carry_forward_ledger.json",
  "data/analysis/372_phase6_hazard_coverage_matrix.csv",
  "data/launchpacks/372_phase7_seed_packet_373.json",
  "data/launchpacks/372_phase7_seed_packet_374.json",
  "data/launchpacks/372_phase7_seed_packet_375.json",
  "data/launchpacks/372_phase7_seed_packet_376.json",
  "tests/playwright/372_phase6_exit_gate_board.spec.ts",
  "tools/analysis/validate_372_phase6_exit_gate.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:372-phase6-exit-gate"] ===
    "pnpm exec tsx ./tools/analysis/validate_372_phase6_exit_gate.ts",
  "package.json missing validate:372-phase6-exit-gate script.",
);

const checklist = readText("prompt/checklist.md");
for (let task = 342; task <= 371; task += 1) {
  invariant(
    new RegExp(`^- \\[X\\] (?:seq|par)_${task}_`, "m").test(checklist),
    `Checklist task ${task} must be complete.`,
  );
}
invariant(
  /^- \[(?:-|X)\] seq_372_/m.test(checklist),
  "Checklist task 372 must be claimed or complete while this validator runs.",
);

const verdict = readJson<{
  taskId?: string;
  verdict?: string;
  releaseClass?: string;
  blockingDefectCount?: number;
  carryForwardCount?: number;
  hazardGapCount?: number;
  capabilitySummaries?: JsonRecord[];
  criticalEvidenceRefs?: string[];
  blockingRefs?: string[];
  carryForwardRefs?: string[];
  launchConditionRefs?: string[];
}>("data/contracts/372_phase6_exit_verdict.json");

invariant(verdict.taskId === "seq_372", "Verdict must belong to seq_372.");
invariant(verdict.verdict === "go_with_constraints", "Verdict must be go_with_constraints.");
invariant(
  verdict.releaseClass ===
    "controlled_phase6_completion_with_external_partner_and_assurance_constraints",
  "Verdict release class drifted.",
);
invariant(verdict.blockingDefectCount === 0, "Verdict must record zero blocking defects.");
invariant(verdict.carryForwardCount === 6, "Verdict must record six carry-forwards.");
invariant(verdict.hazardGapCount === 0, "Verdict must record zero hazard gaps.");
const capabilitySummaries = asArray<JsonRecord>(
  verdict.capabilitySummaries,
  "verdict.capabilitySummaries",
);
invariant(capabilitySummaries.length === 10, "Verdict must summarize 10 Phase 6 capabilities.");
invariant(
  capabilitySummaries.filter((entry) => entry.proofStatus === "proved_with_constraints").length ===
    4,
  "Verdict must record four constrained capabilities.",
);
invariant(
  asArray(verdict.blockingRefs, "verdict.blockingRefs").length === 0,
  "Verdict blockers must be empty.",
);
invariant(
  asArray(verdict.carryForwardRefs, "verdict.carryForwardRefs").join("|") ===
    "CF372_001|CF372_002|CF372_003|CF372_004|CF372_005|CF372_006",
  "Verdict carry-forward refs drifted.",
);
invariant(
  asArray(verdict.launchConditionRefs, "verdict.launchConditionRefs").join("|") ===
    "LC372_001|LC372_002|LC372_003|LC372_004|LC372_005|LC372_006",
  "Verdict launch condition refs drifted.",
);

for (const evidenceRef of [
  "data/test/369_suite_results.json",
  "data/test/370_suite_results.json",
  "data/test/371_suite_results.json",
  "data/contracts/366_directory_and_dispatch_binding_contract.json",
  "data/contracts/367_sandbox_readiness_contract.json",
  "data/contracts/368_pharmacy_loop_merge_contract.json",
  "data/analysis/372_phase6_evidence_matrix.csv",
  "data/analysis/372_phase6_hazard_coverage_matrix.csv",
] as const) {
  invariant(
    asArray<string>(verdict.criticalEvidenceRefs, "verdict.criticalEvidenceRefs").includes(
      evidenceRef,
    ),
    `Verdict critical evidence missing ${evidenceRef}.`,
  );
}

const readiness = readJson<{ taskId?: string; capabilities?: JsonRecord[] }>(
  "data/contracts/372_phase6_release_readiness_registry.json",
);
invariant(readiness.taskId === "seq_372", "Readiness registry must belong to seq_372.");
const capabilities = asArray<JsonRecord>(readiness.capabilities, "readiness.capabilities");
invariant(capabilities.length === 10, "Readiness registry must list 10 capabilities.");
for (const capability of capabilities) {
  invariant(
    /^CAP372_\d\d$/.test(String(capability.capabilityId)),
    "Capability id must use CAP372_nn.",
  );
  invariant(
    ["proved", "proved_with_constraints"].includes(String(capability.proofStatus)),
    `Unexpected proof status for ${String(capability.capabilityId)}.`,
  );
  invariant(
    asArray(capability.blockingGapRefs, `${String(capability.capabilityId)}.blockingGapRefs`)
      .length === 0,
    `${String(capability.capabilityId)} must not carry blocking gaps.`,
  );
}
invariant(
  capabilities.filter((entry) => entry.proofStatus === "proved").length === 6 &&
    capabilities.filter((entry) => entry.proofStatus === "proved_with_constraints").length === 4,
  "Readiness registry release mix must be six proved and four constrained.",
);

const blockers = readJson<{ blockingDefectCount?: number; blockers?: unknown[] }>(
  "data/analysis/372_phase6_blocker_ledger.json",
);
invariant(blockers.blockingDefectCount === 0, "Blocker ledger must record zero blockers.");
invariant(
  asArray(blockers.blockers, "blockers.blockers").length === 0,
  "Blocker ledger blockers must be empty.",
);

const carryLedger = readJson<{ carryForwardCount?: number; carryForwards?: JsonRecord[] }>(
  "data/analysis/372_phase6_carry_forward_ledger.json",
);
const carryForwards = asArray<JsonRecord>(carryLedger.carryForwards, "carryLedger.carryForwards");
invariant(carryLedger.carryForwardCount === 6, "Carry-forward ledger must record six rows.");
invariant(carryForwards.length === 6, "Carry-forward ledger must include six rows.");
for (const carryId of [
  "CF372_001",
  "CF372_002",
  "CF372_003",
  "CF372_004",
  "CF372_005",
  "CF372_006",
] as const) {
  const row = carryForwards.find((entry) => entry.carryForwardId === carryId);
  invariant(row, `Carry-forward ledger missing ${carryId}.`);
  invariant(row.blocking === false, `${carryId} must be non-blocking for the local exit verdict.`);
  invariant(
    String(row.nextOwnerTask).match(/^37[36]$/),
    `${carryId} must hand to task 373 or 376.`,
  );
}

const guardrails = readJson<{
  rolloutClass?: string;
  allowedCurrentUse?: string[];
  notAllowedCurrentUse?: string[];
  metrics?: string[];
  stopCriteria?: string[];
  rollbackControls?: JsonRecord[];
}>("data/contracts/372_phase6_rollout_guardrail_pack.json");
invariant(
  guardrails.rolloutClass === "controlled_nonprod_to_limited_pilot_only",
  "Rollout class drifted.",
);
for (const notAllowed of [
  "unbounded_live_pharmacy_dispatch",
  "nhs_app_limited_release",
  "full_production_rollout_without_external_signoff",
] as const) {
  invariant(
    asArray<string>(guardrails.notAllowedCurrentUse, "guardrails.notAllowedCurrentUse").includes(
      notAllowed,
    ),
    `Rollout guardrails must forbid ${notAllowed}.`,
  );
}
for (const metric of [
  "dispatch_success_rate_by_transport",
  "urgent_return_rate",
  "provider_discovery_failure_rate",
  "urgent_return_reachability_repair_latency",
] as const) {
  invariant(
    asArray<string>(guardrails.metrics, "guardrails.metrics").includes(metric),
    `Missing metric ${metric}.`,
  );
}
for (const stopCriterion of [
  "urgent_returns_not_acknowledged",
  "accessibility_regression_in_keyboard_reflow_or_status_messages",
] as const) {
  invariant(
    asArray<string>(guardrails.stopCriteria, "guardrails.stopCriteria").includes(stopCriterion),
    `Missing stop criterion ${stopCriterion}.`,
  );
}
invariant(
  asArray(guardrails.rollbackControls, "guardrails.rollbackControls").length >= 3,
  "Rollout guardrails must include rollback controls.",
);

const handoff = readJson<{
  phase7LaunchCondition?: string;
  phase7MayAssumeComplete?: string[];
  phase7MustInheritAsConstrained?: string[];
  phase7MustNotReopenWithoutNewGate?: string[];
  handoffSeedPackets?: string[];
  launchConditions?: JsonRecord[];
}>("data/contracts/372_phase6_to_phase7_handoff_contract.json");
invariant(
  handoff.phase7LaunchCondition === "open_only_through_seq_373_with_constraints",
  "Handoff phase7LaunchCondition drifted.",
);
for (const assumedComplete of [
  "dispatch_package_and_proof_gate_semantics",
  "bounce_back_urgent_return_no_contact_and_loop_prevention_law",
  "pharmacy_console_and_patient_routes_with_browser_proof",
] as const) {
  invariant(
    asArray<string>(handoff.phase7MayAssumeComplete, "handoff.phase7MayAssumeComplete").includes(
      assumedComplete,
    ),
    `Handoff may-assume list missing ${assumedComplete}.`,
  );
}
for (const constrained of [
  "live_directory_dispatch_and_transport_approval",
  "nhs_app_scal_clinical_safety_and_connection_agreement",
  "manual_assistive_technology_and_device_lab_assessment",
] as const) {
  invariant(
    asArray<string>(
      handoff.phase7MustInheritAsConstrained,
      "handoff.phase7MustInheritAsConstrained",
    ).includes(constrained),
    `Handoff constrained list missing ${constrained}.`,
  );
}
for (const forbiddenReopen of [
  "LifecycleCoordinator_closure_authority",
  "Update_Record_observation_not_urgent_return_channel",
  "visible_choice_set_and_patient_choice_truth",
] as const) {
  invariant(
    asArray<string>(
      handoff.phase7MustNotReopenWithoutNewGate,
      "handoff.phase7MustNotReopenWithoutNewGate",
    ).includes(forbiddenReopen),
    `Handoff must-not-reopen list missing ${forbiddenReopen}.`,
  );
}
invariant(
  asArray(handoff.handoffSeedPackets, "handoff.handoffSeedPackets").length === 4,
  "Handoff must list 4 seeds.",
);
invariant(
  asArray(handoff.launchConditions, "handoff.launchConditions").length === 6,
  "Handoff must list 6 launch conditions.",
);

for (const [task, relativePath] of [
  ["373", "data/launchpacks/372_phase7_seed_packet_373.json"],
  ["374", "data/launchpacks/372_phase7_seed_packet_374.json"],
  ["375", "data/launchpacks/372_phase7_seed_packet_375.json"],
  ["376", "data/launchpacks/372_phase7_seed_packet_376.json"],
] as const) {
  const seedPacket = readJson<{
    packetId?: string;
    targetTask?: string;
    sourceVerdictRef?: string;
  }>(relativePath);
  invariant(seedPacket.targetTask === task, `${relativePath} target task drifted.`);
  invariant(
    seedPacket.sourceVerdictRef === "data/contracts/372_phase6_exit_verdict.json",
    `${relativePath} must reference the 372 verdict.`,
  );
}

const consistencyRows = readCsv("data/analysis/372_phase6_contract_consistency_matrix.csv");
invariant(consistencyRows.length === 10, "Consistency matrix must include 10 capability rows.");
for (const capability of capabilities) {
  invariant(
    consistencyRows.some((row) => row.capability_id === capability.capabilityId),
    `Consistency matrix missing ${String(capability.capabilityId)}.`,
  );
}
invariant(
  consistencyRows.every((row) => row.blocking_gap === "none"),
  "Consistency matrix must not include blocking gaps.",
);
invariant(
  consistencyRows.filter((row) => row.proof_status === "proved_with_constraints").length === 4,
  "Consistency matrix must record four constrained capability rows.",
);

const evidenceRows = readCsv("data/analysis/372_phase6_evidence_matrix.csv");
invariant(evidenceRows.length === 11, "Evidence matrix must include 11 rows.");
invariant(
  evidenceRows.every((row) => row.status === "passed"),
  "Every evidence row must be passed.",
);
invariant(
  evidenceRows.every((row) =>
    ["proved", "proved_with_constraints"].includes(String(row.classification)),
  ),
  "Evidence rows must be classified as proved or constrained.",
);
for (const capabilityId of capabilitySummaries.map((entry) => String(entry.capabilityId))) {
  invariant(
    evidenceRows.some((row) => row.capability_id === capabilityId),
    `Evidence matrix missing capability ${capabilityId}.`,
  );
}

const hazardRows = readCsv("data/analysis/372_phase6_hazard_coverage_matrix.csv");
invariant(hazardRows.length === 10, "Hazard coverage matrix must include 10 hazards.");
invariant(
  hazardRows.every((row) => row.coverage_status === "covered"),
  "Every Phase 6 hazard row must be covered.",
);
invariant(
  hazardRows.filter((row) => String(row.remaining_action).includes("live_")).length >= 3,
  "Hazard matrix must preserve live external carry-forward actions.",
);

const externalRefs = readJson<{ sources?: JsonRecord[] }>(
  "data/analysis/372_external_reference_notes.json",
);
const externalUrls = asArray<JsonRecord>(externalRefs.sources, "externalRefs.sources").map(
  (source) => String(source.url),
);
for (const url of [
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/accessibility-testing",
  "https://playwright.dev/docs/test-snapshots",
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
  "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards",
  "https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://service-manual.nhs.uk/accessibility/testing",
  "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html",
] as const) {
  invariant(externalUrls.includes(url), `External reference notes missing ${url}.`);
}

for (const suiteTask of ["369", "370", "371"] as const) {
  const suite = readJson<{
    taskId?: string;
    status?: string;
    commands?: JsonRecord[];
    caseCounts?: JsonRecord;
  }>(`data/test/${suiteTask}_suite_results.json`);
  invariant(suite.taskId === `seq_${suiteTask}`, `${suiteTask} suite task id drifted.`);
  invariant(suite.status === "passed", `${suiteTask} suite must be passed.`);
  invariant(
    asArray<JsonRecord>(suite.commands, `${suiteTask}.commands`).every(
      (command) => command.status === "passed",
    ),
    `${suiteTask} suite command did not pass.`,
  );
  if (suiteTask === "371") {
    invariant(
      asRecord(suite.caseCounts, "371.caseCounts").visualBaselines === 6,
      "371 visual baseline count drifted.",
    );
  }

  const defectLog = readJson<{ defects?: JsonRecord[]; boundedExternalBoundaries?: JsonRecord[] }>(
    `data/test/${suiteTask}_defect_log_and_remediation.json`,
  );
  invariant(
    asArray<JsonRecord>(defectLog.defects, `${suiteTask}.defects`).every(
      (defect) => defect.status === "fixed" || defect.releaseImpact === "fixed_not_gating",
    ),
    `${suiteTask} defect log contains an unresolved defect.`,
  );
  invariant(
    asArray(defectLog.boundedExternalBoundaries, `${suiteTask}.boundedExternalBoundaries`).length >=
      2,
    `${suiteTask} defect log must record bounded external boundaries.`,
  );
}

const directoryBinding = readJson<{
  automationModes?: string[];
  strategicDirectoryModes?: string[];
  dispatchTransportModes?: string[];
  manualBridgeSourceIds?: string[];
  manualBridgeBindingIds?: string[];
}>("data/contracts/366_directory_and_dispatch_binding_contract.json");
for (const mode of ["dry_run", "rehearsal", "apply", "verify"] as const) {
  invariant(
    asArray<string>(directoryBinding.automationModes, "directoryBinding.automationModes").includes(
      mode,
    ),
    `366 automation modes missing ${mode}.`,
  );
}
for (const transportMode of ["mesh", "nhsmail_shared_mailbox"] as const) {
  invariant(
    asArray<string>(
      directoryBinding.dispatchTransportModes,
      "directoryBinding.dispatchTransportModes",
    ).includes(transportMode),
    `366 dispatch modes missing ${transportMode}.`,
  );
}
invariant(
  asArray(directoryBinding.manualBridgeSourceIds, "directoryBinding.manualBridgeSourceIds").length >
    0 &&
    asArray(directoryBinding.manualBridgeBindingIds, "directoryBinding.manualBridgeBindingIds")
      .length > 0,
  "366 must preserve manual bridge rows.",
);

const sandboxReadiness = readJson<{
  updateRecordOutcomeSourceClass?: string;
  updateRecordOutboundSendingAllowed?: boolean;
  urgentReturnUpdateRecordForbidden?: boolean;
  supportedTransportModes?: string[];
}>("data/contracts/367_sandbox_readiness_contract.json");
invariant(
  sandboxReadiness.updateRecordOutcomeSourceClass === "gp_workflow_observation",
  "367 must keep Update Record as observation.",
);
invariant(
  sandboxReadiness.updateRecordOutboundSendingAllowed === false,
  "367 must forbid outbound Update Record sending.",
);
invariant(
  sandboxReadiness.urgentReturnUpdateRecordForbidden === true,
  "367 must forbid urgent return via Update Record.",
);
invariant(
  asArray<string>(
    sandboxReadiness.supportedTransportModes,
    "sandboxReadiness.supportedTransportModes",
  ).includes("manual_assisted_dispatch"),
  "367 must preserve manual assisted dispatch fallback.",
);

const mergeContract = readJson<{ cases?: JsonRecord[]; gapFileRequired?: boolean }>(
  "data/contracts/368_pharmacy_loop_merge_contract.json",
);
invariant(
  asArray(mergeContract.cases, "mergeContract.cases").length === 3,
  "368 merge contract case count drifted.",
);
invariant(
  mergeContract.gapFileRequired === false,
  "368 merge contract must not require a gap file.",
);

const board = readText("docs/frontend/372_phase6_exit_gate_board.html");
for (const testId of [
  "Phase6ExitGateBoard",
  "GateMasthead",
  "VerdictStrip",
  "CapabilityRailPanel",
  "CapabilityRail",
  "CapabilityCount",
  "EvidenceCanvas",
  "SelectedCapabilityTitle",
  "SelectedProofStatus",
  "GateFilters",
  "ContractFamilyFilter",
  "AudienceFilter",
  "SeverityFilter",
  "OwnerTrackFilter",
  "ProofStatusFilter",
  "ProofSummary",
  "ReleaseBand",
  "ConsistencyMatrix",
  "InspectorPanel",
  "BlockingDefectCount",
  "BlockerList",
  "CarryForwardRows",
  "HazardRows",
  "OwnerList",
  "TraceabilityTables",
] as const) {
  requireIncludes(board, `data-testid="${testId}"`, "Exit gate board");
}
for (const cssNeedle of [
  "max-width: 1760px",
  "height: 76px",
  "grid-template-columns: 320px minmax(0, 1fr) 420px",
  "@media (prefers-reduced-motion: reduce)",
  "Release posture mix: 6 proved, 4 constrained, 0 withheld",
] as const) {
  requireIncludes(board, cssNeedle, "Exit gate board");
}
invariant(
  (board.match(/id: "CAP372_/g) ?? []).length === 10,
  "Exit gate board must render 10 capability data rows.",
);
invariant(
  (board.match(/proof: "proved_with_constraints"/g) ?? []).length === 4,
  "Exit gate board must render four constrained capability rows.",
);

const boardSpec = readText("tests/playwright/372_phase6_exit_gate_board.spec.ts");
for (const needle of [
  "Phase6ExitGateBoard",
  "go_with_constraints",
  "CapabilityButton-CAP372_03",
  "ProofStatusFilter",
  '=== "4"',
] as const) {
  requireIncludes(boardSpec, needle, "372 Playwright spec");
}

for (const docPath of [
  "docs/release/372_phase6_exit_gate_decision.md",
  "docs/architecture/372_phase6_completion_and_phase7_handoff_map.md",
  "docs/testing/372_phase6_evidence_review_guide.md",
  "docs/safety/372_phase6_release_hazard_and_control_summary.md",
] as const) {
  const doc = readText(docPath);
  requireIncludes(doc, "go_with_constraints", docPath);
  requireIncludes(doc, "CF372_", docPath);
}

console.log(
  JSON.stringify(
    {
      taskId: "seq_372",
      verdict: verdict.verdict,
      blockingDefectCount: verdict.blockingDefectCount,
      carryForwardCount: verdict.carryForwardCount,
      capabilityCount: capabilities.length,
      constrainedCapabilityCount: capabilitySummaries.filter(
        (entry) => entry.proofStatus === "proved_with_constraints",
      ).length,
      hazardCoverageCount: hazardRows.length,
      status: "passed",
    },
    null,
    2,
  ),
);
