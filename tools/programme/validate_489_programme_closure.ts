import fs from "node:fs";
import path from "node:path";
import {
  build489ScenarioRecords,
  canonicalize,
  hashValue,
  required489EdgeCases,
  write489ProgrammeClosureArtifacts,
} from "./close_489_master_watchlist";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertFile(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(ROOT, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} missing ${fragment}`);
}

function assertHash(record: any, label: string): void {
  assertCondition(record.recordHash && /^[a-f0-9]{64}$/.test(record.recordHash), `${label} missing hash`);
  const { recordHash: _recordHash, ...withoutHash } = record;
  assertCondition(hashValue(withoutHash) === record.recordHash, `${label} hash mismatch`);
  assertCondition(canonicalize(withoutHash).includes('"sourceRefs"'), `${label} lacks source refs`);
}

write489ProgrammeClosureArtifacts();

const requiredFiles = [
  "tools/programme/close_489_master_watchlist.ts",
  "tools/programme/validate_489_programme_closure.ts",
  "data/programme/489_master_dependency_watchlist_closure.json",
  "data/programme/489_continuous_improvement_backlog_seed.json",
  "data/programme/489_bau_cadence_and_metric_ownership.json",
  "data/programme/489_closed_programme_final_state.json",
  "data/programme/489_unresolved_item_transfer_register.json",
  "data/contracts/489_programme_closure.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_489_PROGRAMME_CLOSURE_AUTHORITY.json",
  "docs/programme/489_master_watchlist_closure_report.md",
  "docs/programme/489_continuous_improvement_operating_plan.md",
  "data/analysis/489_algorithm_alignment_notes.md",
  "data/analysis/489_external_reference_notes.json",
  "tests/programme/489_watchlist_closure.test.ts",
  "tests/programme/489_ci_backlog_transfer.test.ts",
  "tests/playwright/489_continuous_improvement_board.spec.ts",
  "apps/governance-console/src/continuous-improvement-489.model.ts",
  "apps/governance-console/src/continuous-improvement-489.tsx",
  "apps/governance-console/src/continuous-improvement-489.css",
];

for (const requiredFile of requiredFiles) assertFile(requiredFile);

const closure = readJson<any>("data/programme/489_master_dependency_watchlist_closure.json");
const backlog = readJson<any>("data/programme/489_continuous_improvement_backlog_seed.json");
const cadence = readJson<any>("data/programme/489_bau_cadence_and_metric_ownership.json");
const finalState = readJson<any>("data/programme/489_closed_programme_final_state.json");
const transfers = readJson<any>("data/programme/489_unresolved_item_transfer_register.json");
const gap = readJson<any>(
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_489_PROGRAMME_CLOSURE_AUTHORITY.json",
);

for (const [label, record] of [
  ["closure envelope", closure],
  ["active closure", closure.activeClosure],
  ["active command", closure.activeCommand],
  ["active settlement", closure.activeSettlement],
  ["closure seal", closure.closureEvidenceSeal],
  ["backlog envelope", backlog],
  ["active backlog seed", backlog.activeBacklogSeed],
  ["cadence envelope", cadence],
  ["final state envelope", finalState],
  ["programme final state", finalState.finalState],
  ["transfer register", transfers],
] as const) {
  assertHash(record, label);
}

assertCondition(closure.activeClosure.closureState === "complete_with_transfers", "Active closure must retain transfers");
assertCondition(closure.activeClosure.blockerRefs.length === 0, "Active closure must have no blockers");
assertCondition(transfers.transfers.length === closure.activeClosure.unresolvedTransferCount, "Transfer count mismatch");
assertCondition(backlog.activeBacklogSeed.backlogState === "seeded", "Active CI backlog must be seeded");
assertCondition(finalState.finalState.finalState === "complete_with_transfers", "Final state must not hide transfers");
assertCondition(finalState.finalState.archiveWormSealDigest, "Final state must link archive WORM seal");
assertCondition(finalState.finalState.activeWaveObservationState === "satisfied", "Wave observation must be satisfied");
assertCondition(gap.failClosedBridge.privilegedMutationPermitted === false, "489 gap bridge must fail closed");

for (const transfer of transfers.transfers) {
  assertCondition(transfer.owner, `${transfer.unresolvedItemTransferId} missing owner`);
  assertCondition(transfer.nextReviewDate, `${transfer.unresolvedItemTransferId} missing review date`);
  if (transfer.transferTarget === "continuous_improvement") {
    assertCondition(transfer.targetOutcomeMetricRef, `${transfer.unresolvedItemTransferId} missing metric`);
    assertCondition(transfer.targetBacklogItemRef, `${transfer.unresolvedItemTransferId} missing backlog item`);
  }
}

for (const domain of [
  "safety",
  "security",
  "privacy",
  "records",
  "accessibility",
  "assistive",
  "channel",
  "dependency_hygiene",
  "release_verification",
  "incident_lessons",
  "support",
]) {
  assertCondition(
    cadence.cadenceOwners.some((owner: any) => owner.domain === domain),
    `Missing cadence owner for ${domain}`,
  );
}

for (const scenarioId of required489EdgeCases) {
  const records = build489ScenarioRecords(scenarioId, []);
  assertCondition(records.closure.closureState === "blocked", `${scenarioId} must block closure`);
  assertCondition(records.closure.blockerRefs.length > 0, `${scenarioId} must name blockers`);
}

for (const anchor of [
  'data-testid="continuous-improvement-489"',
  'data-testid="ci-489-top-strip"',
  'data-testid="ci-489-watchlist-table"',
  'data-testid="ci-489-outcome-tree"',
  'data-testid="ci-489-cadence-calendar"',
  'data-testid="ci-489-source-lineage-drawer"',
  'data-testid="ci-489-filter-decision"',
  'data-testid="ci-489-filter-risk"',
  'data-testid="ci-489-filter-owner"',
  'data-testid="ci-489-filter-cadence"',
  'data-testid="ci-489-evidence-vault-link"',
]) {
  assertIncludes("apps/governance-console/src/continuous-improvement-489.tsx", anchor);
}

for (const script of ["test:programme:489-programme-closure", "validate:489-programme-closure"]) {
  assertIncludes("package.json", script);
}

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
for (const artifact of [
  "data/programme/489_master_dependency_watchlist_closure.json",
  "data/programme/489_continuous_improvement_backlog_seed.json",
  "data/programme/489_bau_cadence_and_metric_ownership.json",
  "data/programme/489_closed_programme_final_state.json",
  "data/programme/489_unresolved_item_transfer_register.json",
]) {
  assertCondition(!read(artifact).match(forbiddenSurfacePatterns), `${artifact} leaked sensitive text`);
}

console.log("489 programme closure artifacts validated.");
