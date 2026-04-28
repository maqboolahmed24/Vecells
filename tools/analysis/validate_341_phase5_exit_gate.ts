import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  "docs/release/341_phase5_exit_gate_decision.md",
  "docs/architecture/341_phase5_completion_and_carry_forward_map.md",
  "docs/frontend/341_phase5_exit_gate_board.html",
  "docs/testing/341_phase5_evidence_review_guide.md",
  "data/contracts/341_phase5_exit_verdict.json",
  "data/contracts/341_phase5_release_readiness_registry.json",
  "data/contracts/341_phase5_to_phase6_handoff_contract.json",
  "data/analysis/341_external_reference_notes.json",
  "data/analysis/341_phase5_contract_consistency_matrix.csv",
  "data/analysis/341_phase5_evidence_matrix.csv",
  "data/analysis/341_phase5_blocker_ledger.json",
  "data/analysis/341_phase5_carry_forward_ledger.json",
  "data/launchpacks/341_phase6_seed_packet_342.json",
  "data/launchpacks/341_phase6_seed_packet_343.json",
  "data/launchpacks/341_phase6_seed_packet_344.json",
  "data/launchpacks/341_phase6_seed_packet_345.json",
  "tools/analysis/build_341_phase5_exit_gate.ts",
  "tools/analysis/validate_341_phase5_exit_gate.ts",
  "tests/playwright/341_phase5_exit_gate_board.spec.ts",
  "data/analysis/310_phase4_exit_gate_decision.json",
  "data/contracts/335_mesh_route_contract.json",
  "data/analysis/335_mesh_setup_gap_register.json",
  "data/contracts/336_capacity_feed_configuration_contract.json",
  "data/analysis/336_partner_feed_gap_register.json",
  "data/test-reports/338_scope_capacity_ranking_sla_results.json",
  "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
  "data/test-results/340_phase5_browser_suite_summary.json",
] as const;

const REQUIRED_SCRIPT =
  '"validate:341-phase5-exit-gate": "pnpm exec tsx ./tools/analysis/validate_341_phase5_exit_gate.ts"';

const EXPECTED_VERDICT = "go_with_constraints";
const EXPECTED_RELEASE_CLASS = "controlled_phase5_foundation_only";
const EXPECTED_PHASE6_LAUNCH_CONDITION =
  "open_seq_342_to_seq_345_from_phase5_foundation_with_inherited_constraints";
const EXPECTED_ENVIRONMENT_REF = "local_nonprod_foundation_with_partner_boundaries";

const REQUIRED_CAPABILITY_IDS = [
  "CAP341_00",
  "CAP341_01",
  "CAP341_02",
  "CAP341_03",
  "CAP341_04",
  "CAP341_05",
  "CAP341_06",
  "CAP341_07",
  "CAP341_08",
  "CAP341_09",
  "CAP341_10",
] as const;

const REQUIRED_BLOCKER_IDS = [
  "BLK341_001",
  "BLK341_002",
  "BLK341_003",
  "BLK341_004",
] as const;

const REQUIRED_CARRY_FORWARD_IDS = [
  "CF341_001",
  "CF341_002",
  "CF341_003",
  "CF341_004",
  "CF341_005",
  "CF341_006",
] as const;

const REQUIRED_EVIDENCE_IDS = [
  "EV341_001",
  "EV341_002",
  "EV341_003",
  "EV341_004",
  "EV341_005",
  "EV341_006",
  "EV341_007",
  "EV341_008",
  "EV341_009",
  "EV341_010",
  "EV341_011",
] as const;

const REQUIRED_NOTES_URLS = [
  "https://playwright.dev/docs/trace-viewer-intro",
  "https://playwright.dev/docs/test-reporters",
  "https://playwright.dev/docs/test-cli",
  "https://digital.nhs.uk/services/care-identity-service",
  "https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication/guidance-for-developers/detailed-guidance/role-selection",
  "https://digital.nhs.uk/services/care-identity-service/applications-and-services/care-identity-management",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
  "https://www.w3.org/WAI/WCAG22/Understanding/status-messages",
  "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
  "https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance",
  "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
  "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
  "https://linear.app/docs/triage",
  "https://vercel.com/design",
  "https://carbondesignsystem.com/components/data-table/usage/",
] as const;

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function parseCsv(relativePath: string): Record<string, string>[] {
  const text = read(relativePath).trim();
  requireCondition(text.length > 0, `CSV_EMPTY:${relativePath}`);
  const lines = text.split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length >= 2, `CSV_MISSING_ROWS:${relativePath}`);

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function checklistStateByNumber(taskNumber: number): string {
  const checklist = fs.readFileSync(CHECKLIST_PATH, "utf8");
  const match = checklist.match(new RegExp(`^- \\[([ Xx-])\\] (?:seq|par)_${taskNumber}(?:_|\\b)`, "m"));
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskNumber}`);
  return match[1]!.toUpperCase();
}

function ensureRepoRefExists(ref: string, context: string): void {
  if (!ref || ref.startsWith("BLK341_") || ref.startsWith("CF341_")) {
    return;
  }
  if (/^https?:\/\//.test(ref)) {
    return;
  }
  const targetPath = path.join(ROOT, ref);
  requireCondition(fs.existsSync(targetPath), `REFERENCE_MISSING:${context}:${ref}`);
}

function ensureRepoRefsExist(refs: Iterable<string>, context: string): void {
  for (const ref of refs) {
    ensureRepoRefExists(ref, context);
  }
}

function validateChecklist(): void {
  requireCondition(checklistStateByNumber(310) === "X", "DEPENDENCY_INCOMPLETE:310");
  for (let taskNumber = 311; taskNumber <= 340; taskNumber += 1) {
    requireCondition(checklistStateByNumber(taskNumber) === "X", `DEPENDENCY_INCOMPLETE:${taskNumber}`);
  }
  requireCondition(["-", "X"].includes(checklistStateByNumber(341)), "TASK_NOT_CLAIMED:341");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(
    fs.readFileSync(PACKAGE_JSON_PATH, "utf8").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:341-phase5-exit-gate",
  );
}

function validateUpstreamProofs(): void {
  const phase4Exit = readJson<{
    verdict?: string;
    phase5EntryVerdict?: string;
    widenedRolloutVerdict?: string;
  }>("data/analysis/310_phase4_exit_gate_decision.json");
  requireCondition(phase4Exit.verdict === "go_with_constraints", "PHASE4_EXIT_VERDICT_DRIFT");
  requireCondition(phase4Exit.phase5EntryVerdict === "approved", "PHASE4_ENTRY_VERDICT_DRIFT");
  requireCondition(phase4Exit.widenedRolloutVerdict === "withheld", "PHASE4_WIDENED_ROLLOUT_DRIFT");

  const results338 = readJson<{
    taskId?: string;
    overallStatus?: string;
    suiteResults?: Array<{ suiteId?: string; status?: string }>;
  }>("data/test-reports/338_scope_capacity_ranking_sla_results.json");
  requireCondition(results338.taskId?.includes("338"), "RESULTS_338_TASK_ID_DRIFT");
  requireCondition(results338.overallStatus === "passed", "RESULTS_338_STATUS_DRIFT");
  for (const suiteId of [
    "acting_context_and_visibility_truth",
    "capacity_feed_admission_and_quarantine",
    "candidate_ranking_and_queue_projection",
    "sla_timer_and_breach_posture",
    "org_boundary_and_scope_switcher_browser",
    "hub_queue_ranking_and_sla_browser",
    "hub_mission_stack_responsive_browser",
    "capacity_degraded_and_quarantined_browser",
  ]) {
    requireCondition(
      results338.suiteResults?.some((entry) => entry.suiteId === suiteId && entry.status === "passed"),
      `RESULTS_338_SUITE_MISSING_OR_NOT_PASSED:${suiteId}`,
    );
  }

  const results339 = readJson<{
    taskId?: string;
    overallStatus?: string;
    suiteResults?: Array<{ suiteId?: string; status?: string }>;
  }>("data/test-reports/339_commit_mesh_no_slot_reopen_results.json");
  requireCondition(results339.taskId?.includes("339"), "RESULTS_339_TASK_ID_DRIFT");
  requireCondition(results339.overallStatus === "passed", "RESULTS_339_STATUS_DRIFT");
  for (const suiteId of [
    "commit_truth_and_confirmation_gate",
    "mesh_route_visibility_and_ack_debt",
    "no_slot_callback_return_and_reopen",
    "monotone_truth_and_fallback_properties",
  ]) {
    requireCondition(
      results339.suiteResults?.some((entry) => entry.suiteId === suiteId && entry.status === "passed"),
      `RESULTS_339_SUITE_MISSING_OR_NOT_PASSED:${suiteId}`,
    );
  }

  const results340 = readJson<{
    overallStatus?: string;
    gateRecommendation?: string;
    environmentRef?: string;
  }>("data/test-results/340_phase5_browser_suite_summary.json");
  requireCondition(results340.overallStatus === "passed", "RESULTS_340_STATUS_DRIFT");
  requireCondition(
    results340.gateRecommendation === "ready_for_seq_341_exit_gate_review",
    "RESULTS_340_GATE_RECOMMENDATION_DRIFT",
  );
  requireCondition(
    results340.environmentRef?.startsWith("local_nonprod_browser_matrix:"),
    "RESULTS_340_ENVIRONMENT_REF_DRIFT",
  );
}

function validateExternalNotes(): void {
  const notes = readJson<{
    taskId?: string;
    reviewedOn?: string;
    accessedOn?: string;
    localSourceOfTruth?: string[];
    sources?: Array<{
      url?: string;
      borrowedInto?: string[];
      rejectedOrConstrained?: string[];
    }>;
  }>("data/analysis/341_external_reference_notes.json");

  requireCondition(
    notes.taskId === "seq_341_phase5_exit_gate_approve_network_horizon_completion",
    "NOTES_TASK_ID_DRIFT",
  );
  requireCondition(notes.reviewedOn === "2026-04-23", "NOTES_REVIEWED_ON_DRIFT");
  requireCondition(notes.accessedOn === "2026-04-23", "NOTES_ACCESSED_ON_DRIFT");

  for (const ref of [
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-cards.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/accessibility-and-content-system-contract.md",
    "data/test-reports/338_scope_capacity_ranking_sla_results.json",
    "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
    "data/test-results/340_phase5_browser_suite_summary.json",
  ]) {
    requireCondition(notes.localSourceOfTruth?.includes(ref), `NOTES_LOCAL_SOURCE_MISSING:${ref}`);
  }

  const noteUrls = new Set((notes.sources ?? []).map((entry) => entry.url));
  for (const url of REQUIRED_NOTES_URLS) {
    requireCondition(noteUrls.has(url), `NOTES_URL_MISSING:${url}`);
  }

  for (const entry of notes.sources ?? []) {
    requireCondition((entry.borrowedInto ?? []).length > 0, `NOTES_BORROWED_EMPTY:${entry.url ?? "unknown"}`);
    requireCondition(
      (entry.rejectedOrConstrained ?? []).length > 0,
      `NOTES_REJECTED_EMPTY:${entry.url ?? "unknown"}`,
    );
  }
}

function validateVerdictAndLedgers(): void {
  const verdict = readJson<{
    taskId?: string;
    verdict?: string;
    releaseClass?: string;
    commitRef?: string;
    environmentRef?: string;
    decidedAt?: string;
    blockingDefectCount?: number;
    carryForwardCount?: number;
    phase6LaunchCondition?: string;
    capabilitySummaries?: Array<{
      capabilityId?: string;
      evidenceStatus?: string;
      releaseInterpretation?: string;
      frozenContractRefs?: string[];
      executableRefs?: string[];
      proofRefs?: string[];
      blockerRefs?: string[];
      carryForwardRefs?: string[];
      summary?: string;
    }>;
    criticalEvidenceRefs?: string[];
    blockingRefs?: string[];
    carryForwardRefs?: string[];
    requiredRemediations?: Array<{ ref?: string; ownerTask?: string; summary?: string }>;
  }>("data/contracts/341_phase5_exit_verdict.json");

  requireCondition(verdict.taskId === "seq_341_phase5_exit_gate", "VERDICT_TASK_ID_DRIFT");
  requireCondition(verdict.verdict === EXPECTED_VERDICT, "VERDICT_VALUE_DRIFT");
  requireCondition(verdict.releaseClass === EXPECTED_RELEASE_CLASS, "VERDICT_RELEASE_CLASS_DRIFT");
  requireCondition(verdict.commitRef && verdict.commitRef.length >= 7, "VERDICT_COMMIT_REF_INVALID");
  requireCondition(verdict.environmentRef === EXPECTED_ENVIRONMENT_REF, "VERDICT_ENVIRONMENT_REF_DRIFT");
  requireCondition(verdict.decidedAt?.includes("T"), "VERDICT_DECIDED_AT_INVALID");
  requireCondition(verdict.blockingDefectCount === 4, "VERDICT_BLOCKER_COUNT_DRIFT");
  requireCondition(verdict.carryForwardCount === 6, "VERDICT_CARRY_FORWARD_COUNT_DRIFT");
  requireCondition(
    verdict.phase6LaunchCondition === EXPECTED_PHASE6_LAUNCH_CONDITION,
    "VERDICT_PHASE6_LAUNCH_CONDITION_DRIFT",
  );

  const capabilityIds = new Set((verdict.capabilitySummaries ?? []).map((entry) => entry.capabilityId));
  requireCondition(capabilityIds.size === REQUIRED_CAPABILITY_IDS.length, "VERDICT_CAPABILITY_COUNT_DRIFT");
  for (const capabilityId of REQUIRED_CAPABILITY_IDS) {
    requireCondition(capabilityIds.has(capabilityId), `VERDICT_CAPABILITY_MISSING:${capabilityId}`);
  }

  requireCondition(
    JSON.stringify(verdict.blockingRefs) === JSON.stringify([...REQUIRED_BLOCKER_IDS]),
    "VERDICT_BLOCKING_REFS_DRIFT",
  );
  requireCondition(
    JSON.stringify(verdict.carryForwardRefs) === JSON.stringify([...REQUIRED_CARRY_FORWARD_IDS]),
    "VERDICT_CARRY_FORWARD_REFS_DRIFT",
  );
  requireCondition((verdict.criticalEvidenceRefs ?? []).length === 6, "VERDICT_CRITICAL_EVIDENCE_COUNT_DRIFT");
  requireCondition((verdict.requiredRemediations ?? []).length === 4, "VERDICT_REMEDIATION_COUNT_DRIFT");

  ensureRepoRefsExist(verdict.criticalEvidenceRefs ?? [], "VERDICT_CRITICAL_EVIDENCE");
  for (const entry of verdict.capabilitySummaries ?? []) {
    ensureRepoRefsExist(entry.frozenContractRefs ?? [], `VERDICT_FROZEN_CONTRACTS:${entry.capabilityId}`);
    ensureRepoRefsExist(entry.executableRefs ?? [], `VERDICT_EXECUTABLE_REFS:${entry.capabilityId}`);
    ensureRepoRefsExist(entry.proofRefs ?? [], `VERDICT_PROOF_REFS:${entry.capabilityId}`);
    requireCondition((entry.summary ?? "").length > 30, `VERDICT_CAPABILITY_SUMMARY_TOO_SHORT:${entry.capabilityId}`);
  }

  const capabilityById = Object.fromEntries(
    (verdict.capabilitySummaries ?? []).map((entry) => [entry.capabilityId, entry]),
  );
  requireCondition(
    capabilityById.CAP341_00?.releaseInterpretation === "go_with_constraints" &&
      capabilityById.CAP341_00?.evidenceStatus === "proved_with_constraints",
    "VERDICT_CAP341_00_DRIFT",
  );
  requireCondition(
    capabilityById.CAP341_01?.releaseInterpretation === "approved" &&
      capabilityById.CAP341_01?.evidenceStatus === "proved",
    "VERDICT_CAP341_01_DRIFT",
  );
  requireCondition(
    capabilityById.CAP341_08?.blockerRefs?.includes("BLK341_004") &&
      capabilityById.CAP341_08?.carryForwardRefs?.includes("CF341_002"),
    "VERDICT_CAP341_08_DRIFT",
  );
  requireCondition(
    capabilityById.CAP341_10?.blockerRefs?.includes("BLK341_003") &&
      capabilityById.CAP341_10?.carryForwardRefs?.includes("CF341_006"),
    "VERDICT_CAP341_10_DRIFT",
  );

  const blockerLedger = readJson<
    Array<{ blockerId?: string; severity?: string; nextTrack?: string; evidenceRefs?: string[] }>
  >("data/analysis/341_phase5_blocker_ledger.json");
  requireCondition(blockerLedger.length === REQUIRED_BLOCKER_IDS.length, "BLOCKER_LEDGER_COUNT_DRIFT");
  requireCondition(
    JSON.stringify(blockerLedger.map((entry) => entry.blockerId)) === JSON.stringify([...REQUIRED_BLOCKER_IDS]),
    "BLOCKER_LEDGER_IDS_DRIFT",
  );
  for (const entry of blockerLedger) {
    requireCondition(entry.nextTrack === "seq_345", `BLOCKER_LEDGER_NEXT_TRACK_DRIFT:${entry.blockerId}`);
    requireCondition(["sev2", "sev3"].includes(entry.severity ?? ""), `BLOCKER_LEDGER_SEVERITY_DRIFT:${entry.blockerId}`);
    ensureRepoRefsExist(entry.evidenceRefs ?? [], `BLOCKER_LEDGER_EVIDENCE:${entry.blockerId}`);
  }

  const carryLedger = readJson<
    Array<{ carryForwardId?: string; nextTrack?: string; evidenceRefs?: string[] }>
  >("data/analysis/341_phase5_carry_forward_ledger.json");
  requireCondition(carryLedger.length === REQUIRED_CARRY_FORWARD_IDS.length, "CARRY_LEDGER_COUNT_DRIFT");
  requireCondition(
    JSON.stringify(carryLedger.map((entry) => entry.carryForwardId)) ===
      JSON.stringify([...REQUIRED_CARRY_FORWARD_IDS]),
    "CARRY_LEDGER_IDS_DRIFT",
  );
  for (const entry of carryLedger) {
    requireCondition(entry.nextTrack === "seq_345", `CARRY_LEDGER_NEXT_TRACK_DRIFT:${entry.carryForwardId}`);
    ensureRepoRefsExist(entry.evidenceRefs ?? [], `CARRY_LEDGER_EVIDENCE:${entry.carryForwardId}`);
  }
}

function validateReadinessAndHandoff(): void {
  const readiness = readJson<{
    taskId?: string;
    verdict?: string;
    releaseClass?: string;
    capabilityEntries?: Array<{ capabilityId?: string }>;
  }>("data/contracts/341_phase5_release_readiness_registry.json");
  requireCondition(readiness.taskId === "seq_341_phase5_exit_gate", "READINESS_TASK_ID_DRIFT");
  requireCondition(readiness.verdict === EXPECTED_VERDICT, "READINESS_VERDICT_DRIFT");
  requireCondition(readiness.releaseClass === EXPECTED_RELEASE_CLASS, "READINESS_RELEASE_CLASS_DRIFT");
  requireCondition(
    (readiness.capabilityEntries ?? []).length === REQUIRED_CAPABILITY_IDS.length,
    "READINESS_CAPABILITY_COUNT_DRIFT",
  );
  for (const capabilityId of REQUIRED_CAPABILITY_IDS) {
    requireCondition(
      readiness.capabilityEntries?.some((entry) => entry.capabilityId === capabilityId),
      `READINESS_CAPABILITY_MISSING:${capabilityId}`,
    );
  }

  const handoff = readJson<{
    taskId?: string;
    verdictRef?: string;
    launchCondition?: string;
    allowedLaunchTasks?: string[];
    boundedDebtRefs?: string[];
    blockingRefs?: string[];
    nonNegotiables?: string[];
    sourceRefs?: string[];
  }>("data/contracts/341_phase5_to_phase6_handoff_contract.json");
  requireCondition(handoff.taskId === "seq_341_phase5_exit_gate", "HANDOFF_TASK_ID_DRIFT");
  requireCondition(handoff.verdictRef === "data/contracts/341_phase5_exit_verdict.json", "HANDOFF_VERDICT_REF_DRIFT");
  requireCondition(handoff.launchCondition === EXPECTED_PHASE6_LAUNCH_CONDITION, "HANDOFF_LAUNCH_CONDITION_DRIFT");
  requireCondition(
    JSON.stringify(handoff.allowedLaunchTasks) ===
      JSON.stringify([
        "seq_342_phase6_freeze_pharmacy_case_model_eligibility_and_policy_pack_contracts",
        "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts",
        "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts",
        "seq_345_phase6_open_parallel_pharmacy_tracks_gate",
      ]),
    "HANDOFF_ALLOWED_LAUNCH_TASKS_DRIFT",
  );
  requireCondition(
    JSON.stringify(handoff.boundedDebtRefs) === JSON.stringify([...REQUIRED_CARRY_FORWARD_IDS]),
    "HANDOFF_BOUNDED_DEBT_REFS_DRIFT",
  );
  requireCondition(
    JSON.stringify(handoff.blockingRefs) === JSON.stringify([...REQUIRED_BLOCKER_IDS]),
    "HANDOFF_BLOCKING_REFS_DRIFT",
  );
  requireCondition((handoff.nonNegotiables ?? []).length >= 6, "HANDOFF_NON_NEGOTIABLES_TOO_SMALL");
  ensureRepoRefsExist(handoff.sourceRefs ?? [], "HANDOFF_SOURCE_REFS");

  for (const relativePath of [
    "data/launchpacks/341_phase6_seed_packet_342.json",
    "data/launchpacks/341_phase6_seed_packet_343.json",
    "data/launchpacks/341_phase6_seed_packet_344.json",
    "data/launchpacks/341_phase6_seed_packet_345.json",
  ]) {
    const packet = readJson<{
      taskId?: string;
      seedForTask?: string;
      allowedToProceed?: boolean;
      verdictRef?: string;
      reliedOnCapabilityIds?: string[];
      boundedDebtRefs?: string[];
      nonNegotiables?: string[];
      whatPhase5Proved?: string[];
      patternsMustNotBeRebroken?: string[];
    }>(relativePath);
    requireCondition(packet.taskId === "seq_341_phase5_exit_gate", `SEED_TASK_ID_DRIFT:${relativePath}`);
    requireCondition(packet.seedForTask?.startsWith("seq_34"), `SEED_FOR_TASK_DRIFT:${relativePath}`);
    requireCondition(packet.allowedToProceed === true, `SEED_ALLOWED_TO_PROCEED_DRIFT:${relativePath}`);
    requireCondition(packet.verdictRef === "data/contracts/341_phase5_exit_verdict.json", `SEED_VERDICT_REF_DRIFT:${relativePath}`);
    requireCondition((packet.reliedOnCapabilityIds ?? []).length >= 2, `SEED_CAPABILITY_BINDING_TOO_SMALL:${relativePath}`);
    requireCondition((packet.boundedDebtRefs ?? []).length >= 1, `SEED_BOUNDED_DEBT_EMPTY:${relativePath}`);
    requireCondition((packet.nonNegotiables ?? []).length >= 3, `SEED_NON_NEGOTIABLES_TOO_SMALL:${relativePath}`);
    requireCondition((packet.whatPhase5Proved ?? []).length >= 1, `SEED_PROVED_SURFACES_TOO_SMALL:${relativePath}`);
    requireCondition(
      (packet.patternsMustNotBeRebroken ?? []).length >= 2,
      `SEED_REBROKEN_PATTERNS_TOO_SMALL:${relativePath}`,
    );
  }
}

function validateCsvs(): void {
  const consistencyRows = parseCsv("data/analysis/341_phase5_contract_consistency_matrix.csv");
  requireCondition(consistencyRows.length === REQUIRED_CAPABILITY_IDS.length, "CONSISTENCY_ROW_COUNT_DRIFT");
  const capabilityIds = new Set(consistencyRows.map((row) => row.capabilityId));
  for (const capabilityId of REQUIRED_CAPABILITY_IDS) {
    requireCondition(capabilityIds.has(capabilityId), `CONSISTENCY_CAPABILITY_MISSING:${capabilityId}`);
  }

  const cap00 = consistencyRows.find((row) => row.capabilityId === "CAP341_00");
  requireCondition(
    cap00?.releaseInterpretation === "go_with_constraints" &&
      cap00?.evidenceStatus === "proved_with_constraints" &&
      cap00?.blockerRefs.includes("BLK341_001"),
    "CONSISTENCY_CAP341_00_DRIFT",
  );
  const cap08 = consistencyRows.find((row) => row.capabilityId === "CAP341_08");
  requireCondition(
    cap08?.environmentClass === "controlled_partner_boundary" &&
      cap08?.releaseInterpretation === "go_with_constraints",
    "CONSISTENCY_CAP341_08_DRIFT",
  );
  const cap10 = consistencyRows.find((row) => row.capabilityId === "CAP341_10");
  requireCondition(
    cap10?.releaseInterpretation === "approved" && cap10?.carryForwardRefs.includes("CF341_006"),
    "CONSISTENCY_CAP341_10_DRIFT",
  );
  for (const row of consistencyRows) {
    ensureRepoRefsExist(row.frozenContractRefs.split(" | ").filter(Boolean), `CONSISTENCY_FROZEN:${row.capabilityId}`);
    ensureRepoRefsExist(row.executableRefs.split(" | ").filter(Boolean), `CONSISTENCY_EXECUTABLE:${row.capabilityId}`);
    ensureRepoRefsExist(row.proofRefs.split(" | ").filter(Boolean), `CONSISTENCY_PROOF:${row.capabilityId}`);
  }

  const evidenceRows = parseCsv("data/analysis/341_phase5_evidence_matrix.csv");
  requireCondition(evidenceRows.length === REQUIRED_EVIDENCE_IDS.length, "EVIDENCE_ROW_COUNT_DRIFT");
  const evidenceIds = new Set(evidenceRows.map((row) => row.evidenceId));
  for (const evidenceId of REQUIRED_EVIDENCE_IDS) {
    requireCondition(evidenceIds.has(evidenceId), `EVIDENCE_ID_MISSING:${evidenceId}`);
  }
  requireCondition(
    evidenceRows.some(
      (row) =>
        row.evidenceId === "EV341_011" &&
        row.capabilityId === "CAP341_00" &&
        row.status === "constrained",
    ),
    "EVIDENCE_EV341_011_DRIFT",
  );
  requireCondition(
    evidenceRows.some(
      (row) =>
        row.evidenceId === "EV341_010" &&
        row.capabilityId === "CAP341_10" &&
        row.status === "passed",
    ),
    "EVIDENCE_EV341_010_DRIFT",
  );
  for (const row of evidenceRows) {
    ensureRepoRefsExist(row.artifactRefs.split(" | ").filter(Boolean), `EVIDENCE_ARTIFACTS:${row.evidenceId}`);
  }
}

function validateDocsAndBoard(): void {
  const decision = read("docs/release/341_phase5_exit_gate_decision.md");
  for (const token of [
    "The authoritative verdict is `go_with_constraints`.",
    "Release class: `controlled_phase5_foundation_only`.",
    "Phase 6 launch condition: `open_seq_342_to_seq_345_from_phase5_foundation_with_inherited_constraints`.",
    "This is a **go** for:",
    "This is a **no-go** for:",
    "## Why the verdict is not `approved`",
    "## Blocking defects",
    "## Carry-forward debt",
  ]) {
    requireCondition(decision.includes(token), `DECISION_TOKEN_MISSING:${token}`);
  }

  const mapDoc = read("docs/architecture/341_phase5_completion_and_carry_forward_map.md");
  for (const token of [
    "# 341 Phase 5 Completion And Carry-Forward Map",
    "## Completion map",
    "## Carry-forward law",
    "## Non-negotiable patterns for Phase 6",
  ]) {
    requireCondition(mapDoc.includes(token), `MAP_DOC_TOKEN_MISSING:${token}`);
  }

  const reviewGuide = read("docs/testing/341_phase5_evidence_review_guide.md");
  for (const token of [
    "# 341 Phase 5 Evidence Review Guide",
    "## Review order",
    "338_scope_capacity_ranking_sla_results.json",
    "339_commit_mesh_no_slot_reopen_results.json",
    "340_phase5_browser_suite_summary.json",
    "341_phase5_blocker_ledger.json",
    "341_phase5_carry_forward_ledger.json",
  ]) {
    requireCondition(reviewGuide.includes(token), `REVIEW_GUIDE_TOKEN_MISSING:${token}`);
  }

  const board = read("docs/frontend/341_phase5_exit_gate_board.html");
  for (const token of [
    'data-testid="Phase5ExitGateBoard"',
    'data-testid="Phase5ExitGateMasthead"',
    'data-testid="Phase5ExitVerdictStrip"',
    'data-testid="Phase5ExitSummaryStrip"',
    'data-testid="Phase5CapabilityRail"',
    'data-testid="Phase5ExitGateFilters"',
    'data-testid="Phase5EvidenceCanvas"',
    'data-testid="Phase5TraceabilityTables"',
    'data-testid="Phase5BlockerInspector"',
    'data-testid="Phase5EvidenceTimeline"',
    "max-width: 1760px",
    "grid-template-columns: 320px minmax(0, 1fr) 420px",
    "window.__phase5ExitBoardData = { ...boardData, loaded: true };",
    'data-current-verdict',
    'data-release-class',
    'data-reduced-motion',
    "renderFilters()",
    "renderCapabilityRail()",
    "renderInspector()",
  ]) {
    requireCondition(board.includes(token), `BOARD_TOKEN_MISSING:${token}`);
  }
}

function run(): void {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateUpstreamProofs();
  validateExternalNotes();
  validateVerdictAndLedgers();
  validateReadinessAndHandoff();
  validateCsvs();
  validateDocsAndBoard();
  console.log("validate_341_phase5_exit_gate: ok");
}

run();
