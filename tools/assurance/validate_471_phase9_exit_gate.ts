import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_EXIT_GATE_VERSION,
  createPhase9ExitGateFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertExists(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} missing ${fragment}`);
}

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-exit-gate.ts",
  "tools/assurance/run_471_phase9_exit_gate.ts",
  "tools/assurance/validate_471_phase9_exit_gate.ts",
  "docs/runbooks/471_phase9_exit_gate_approval_runbook.md",
  "data/contracts/471_phase9_exit_gate.schema.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_471_PHASE9_EXIT_GATE_CONTRACT.json",
  "data/evidence/471_phase9_exit_gate_decision.json",
  "data/analysis/471_algorithm_alignment_notes.md",
  "data/analysis/471_external_reference_notes.json",
  "tests/integration/471_phase9_exit_gate_exact.test.ts",
  "tests/integration/471_phase9_exit_gate_blockers.test.ts",
  "tests/integration/471_phase9_exit_gate_hash_parity.test.ts",
  "tests/playwright/471_phase9_exit_gate_status.spec.ts",
  "apps/ops-console/src/phase9-exit-gate-status.model.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const scriptName of [
  "test:phase9:exit-gate-approval",
  "validate:471-phase9-exit-gate",
]) {
  assertIncludes("package.json", scriptName);
}

for (const objectName of [
  "Phase9ExitGateDecision",
  "Phase9ExitGateChecklistRow",
  "Phase9ExitGateBlocker",
  "Phase9CompletionEvidenceBundle",
  "Phase9ExitGateSettlement",
  "attemptExitGateApproval",
  "getExitGateStatus",
]) {
  assertIncludes("packages/domains/analytics_assurance/src/phase9-exit-gate.ts", objectName);
}

for (const fragment of [
  "Checklist-as-truth",
  "green-dashboard",
  "deferred-scope",
  "evidence freshness",
  "BAU shortcut",
  "CrossPhaseConformanceScorecard.scorecardState = exact",
]) {
  assertIncludes("data/analysis/471_algorithm_alignment_notes.md", fragment);
}

const evidence = readJson<any>("data/evidence/471_phase9_exit_gate_decision.json");
assertCondition(evidence.schemaVersion === PHASE9_EXIT_GATE_VERSION, "Unexpected evidence schema");
assertCondition(evidence.decision.schemaVersion === PHASE9_EXIT_GATE_VERSION, "Unexpected decision schema");
assertCondition(evidence.decision.decisionState === "approved", "Exact decision must approve");
assertCondition(evidence.decision.approvalPermitted === true, "Approval not permitted");
assertCondition(evidence.decision.blockers.length === 0, "Approved decision has blockers");
assertCondition(
  evidence.decision.crossPhaseConformanceScorecardState === "exact",
  "Scorecard is not exact",
);
assertCondition(
  evidence.decision.releaseToBAURecordGuard.guardState === "permitted" &&
    evidence.decision.releaseToBAURecordGuard.releaseToBAURecordMayBeMinted === true,
  "ReleaseToBAU guard is not permitted for exact decision",
);
assertCondition(evidence.decision.auditRecord.wormAppendState === "appended", "WORM audit missing");
assertCondition(
  evidence.decision.auditRecord.payloadClass === "metadata_only",
  "Audit payload is not metadata-only",
);
assertCondition(
  evidence.decision.settlement.settledDecisionState === "approved" &&
    evidence.decision.settlement.settlementHash.match(/^[a-f0-9]{64}$/),
  "Settlement is not approved and hash-bound",
);
assertCondition(
  evidence.decision.completionEvidenceBundle.completionEvidenceBundleHash.match(/^[a-f0-9]{64}$/),
  "Completion bundle hash invalid",
);
assertCondition(
  evidence.decision.checklistRows.length >= 16,
  "Missing required exit-gate checklist rows",
);
for (const row of evidence.decision.checklistRows) {
  if (row.mandatory) {
    assertCondition(row.rowState === "exact", `Mandatory row not exact: ${row.proofFamilyId}`);
  } else {
    assertCondition(
      row.rowState === "deferred_scope" && row.permittedDeferredScope === true,
      `Optional row is not a permitted deferred scope: ${row.proofFamilyId}`,
    );
    assertCondition(row.deferredScopeNote.length > 0, "Deferred scope row lacks source-backed note");
  }
  assertCondition(row.rowHash.match(/^[a-f0-9]{64}$/), `Row hash invalid: ${row.proofFamilyId}`);
  assertCondition(row.proofRefs.length > 0, `Row proof refs missing: ${row.proofFamilyId}`);
}

const blocked = evidence.blockedDecisionExample;
assertCondition(blocked.decisionState === "blocked", "Blocked example did not block");
assertCondition(blocked.blockers.length > 0, "Blocked example lacks blockers");
assertCondition(
  blocked.releaseToBAURecordGuard.guardState === "blocked" &&
    blocked.releaseToBAURecordGuard.releaseToBAURecordMayBeMinted === false,
  "Blocked example permits ReleaseToBAU",
);
for (const blocker of blocked.blockers) {
  assertCondition(blocker.owner.length > 0, "Blocker owner missing");
  assertCondition(blocker.evidenceRefs.length > 0, "Blocker evidence refs missing");
  assertCondition(blocker.nextSafeAction.length > 0, "Blocker next action missing");
}

const missing = evidence.missingProofDecisionExample;
assertCondition(missing.decisionState === "blocked", "Missing proof example did not block");
assertCondition(
  missing.blockers.some((blocker: { blockerState: string }) => blocker.blockerState === "missing"),
  "Missing proof example lacks missing blocker",
);

const fixture = createPhase9ExitGateFixture();
assertCondition(
  fixture.exactDecision.completionEvidenceBundle.completionEvidenceBundleHash ===
    createPhase9ExitGateFixture().exactDecision.completionEvidenceBundle.completionEvidenceBundleHash,
  "Fixture completion hash is nondeterministic",
);
assertCondition(fixture.exactDecision.decisionState === "approved", "Fixture exact decision failed");
assertCondition(fixture.blockedDecision.decisionState === "blocked", "Fixture blocked decision failed");

const schema = readJson<any>("data/contracts/471_phase9_exit_gate.schema.json");
assertCondition(schema.properties.schemaVersion.const === PHASE9_EXIT_GATE_VERSION, "Schema version drift");

const gap = readJson<any>(
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_471_PHASE9_EXIT_GATE_CONTRACT.json",
);
assertCondition(gap.gapClosed === true, "Exit-gate contract gap not closed");
assertCondition(gap.whyFallbackPreservesAlgorithm.length > 0, "Gap note lacks algorithm rationale");

const externalNotes = readJson<any>("data/analysis/471_external_reference_notes.json");
for (const expectedFragment of [
  "playwright.dev/docs/accessibility-testing",
  "playwright.dev/docs/aria-snapshots",
  "w3.org/TR/WCAG22",
  "owasp.org/www-project-web-security-testing-guide",
  "ncsc.gov.uk/collection/cyber-assessment-framework",
  "service-manual.nhs.uk/accessibility",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) =>
      reference.url.includes(expectedFragment),
    ),
    `Missing external reference ${expectedFragment}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_471_phase9_exit_gate_approve_assurance_ledger_completion/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_471 must be claimed or complete",
);

console.log("Task 471 Phase 9 exit gate validation passed.");
