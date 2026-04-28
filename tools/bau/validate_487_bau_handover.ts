import fs from "node:fs";
import path from "node:path";
import {
  build487ScenarioRecords,
  canonicalize,
  hashValue,
  required487EdgeCases,
  write487BAUHandoverArtifacts,
} from "./complete_487_bau_handover";

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
  assertCondition(
    hashValue(withoutHash) === record.recordHash,
    `${label} hash mismatch after canonical serialization`,
  );
  assertCondition(canonicalize(withoutHash).includes('"sourceRefs"'), `${label} lacks source refs`);
}

write487BAUHandoverArtifacts();

const requiredFiles = [
  "tools/bau/complete_487_bau_handover.ts",
  "tools/bau/validate_487_bau_handover.ts",
  "data/bau/487_bau_handover_pack.json",
  "data/bau/487_support_rota_matrix.json",
  "data/bau/487_service_owner_acceptance_register.json",
  "data/bau/487_incident_commander_rota.json",
  "data/bau/487_governance_review_calendar.json",
  "data/bau/487_bau_open_actions_register.json",
  "data/contracts/487_bau_handover.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_487_BAU_HANDOVER_AUTHORITY.json",
  "docs/runbooks/487_bau_handover_runbook.md",
  "docs/programme/487_service_owner_handover_report.md",
  "data/analysis/487_algorithm_alignment_notes.md",
  "data/analysis/487_external_reference_notes.json",
  "tests/bau/487_handover_pack.test.ts",
  "tests/bau/487_rota_coverage.test.ts",
  "tests/playwright/487_bau_handover_board.spec.ts",
  "apps/ops-console/src/bau-handover-board-487.model.ts",
  "apps/ops-console/src/bau-handover-board-487.tsx",
  "apps/ops-console/src/bau-handover-board-487.css",
];

for (const requiredFile of requiredFiles) {
  assertFile(requiredFile);
}

const packEnvelope = readJson<any>("data/bau/487_bau_handover_pack.json");
const rotaMatrix = readJson<any>("data/bau/487_support_rota_matrix.json");
const acceptanceRegister = readJson<any>("data/bau/487_service_owner_acceptance_register.json");
const incidentRota = readJson<any>("data/bau/487_incident_commander_rota.json");
const governanceCalendar = readJson<any>("data/bau/487_governance_review_calendar.json");
const openActions = readJson<any>("data/bau/487_bau_open_actions_register.json");
const gap = readJson<any>(
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_487_BAU_HANDOVER_AUTHORITY.json",
);

assertHash(packEnvelope, "handover pack envelope");
assertHash(packEnvelope.activePack, "active BAU handover pack");
assertHash(packEnvelope.activeCommand, "active BAU handover command");
assertHash(packEnvelope.activeSettlement, "active BAU handover settlement");
assertHash(rotaMatrix, "rota matrix envelope");
assertHash(acceptanceRegister, "acceptance register envelope");
assertHash(incidentRota, "incident rota envelope");
assertHash(governanceCalendar, "governance calendar envelope");
assertHash(openActions, "open actions envelope");

assertCondition(
  packEnvelope.activePack.verdict === "accepted_with_constraints",
  "Active handover verdict should be accepted with constraints",
);
assertCondition(
  packEnvelope.activePack.blockerRefs.length === 0,
  "Active handover must not carry blockers",
);
assertCondition(
  packEnvelope.activeSettlement.result === packEnvelope.activePack.verdict,
  "Settlement must match pack verdict",
);
assertCondition(
  packEnvelope.activeCommand.roleAuthorizationRef.includes("service-owner"),
  "BAU handover command must require service owner role authorization",
);
assertCondition(
  packEnvelope.activeCommand.idempotencyKey && packEnvelope.activeCommand.purposeBindingRef,
  "BAU handover command must carry idempotency and purpose binding",
);
assertCondition(
  rotaMatrix.rotaAssignments.length >= 13,
  "Rota matrix must cover every BAU responsibility domain",
);
assertCondition(
  rotaMatrix.rotaAssignments
    .filter((assignment: any) => assignment.rotaWindowRefs.includes("out_of_hours"))
    .every((assignment: any) => assignment.deputy && assignment.outOfHoursCoverageState === "covered"),
  "Every launch-critical rota must have deputy and out-of-hours coverage",
);
assertCondition(
  acceptanceRegister.acceptances.every((acceptance: any) => acceptance.wormAuditRef),
  "Every service owner acceptance must be WORM linked",
);
assertCondition(
  incidentRota.incidentCommanderRota.coverageState === "exact" &&
    incidentRota.incidentCommanderRota.outOfHoursCommander,
  "Incident commander rota must cover out-of-hours",
);
assertCondition(
  governanceCalendar.calendar.events.some((event: any) =>
    event.title.includes("NHS App monthly data"),
  ),
  "Governance calendar must include NHS App monthly data ownership",
);
assertCondition(
  openActions.openActions.every(
    (action: any) => !(action.releaseBlocking && action.actionClass === "bau_follow_up"),
  ),
  "Active open actions must not misclassify release-blocking work as BAU follow-up",
);
assertCondition(
  packEnvelope.ownershipTransfers.assistive.freezeAuthorityState === "present" &&
    packEnvelope.ownershipTransfers.assistive.downgradeAuthorityState === "present",
  "Assistive BAU ownership must include freeze and downgrade authority",
);
assertCondition(
  packEnvelope.ownershipTransfers.channel.monthlyDataOwner,
  "NHS App channel monthly data owner must be assigned",
);
assertCondition(
  packEnvelope.ownershipTransfers.records.owner && packEnvelope.ownershipTransfers.records.deputy,
  "Records/archive owner and deputy must be assigned",
);
assertCondition(
  gap.failClosedBridge.privilegedMutationPermitted === false,
  "Interface gap bridge must fail closed",
);

for (const scenarioId of required487EdgeCases) {
  const records = build487ScenarioRecords(scenarioId, []);
  assertCondition(records.pack.verdict === "blocked", `${scenarioId} must block BAU handover`);
  assertCondition(records.pack.blockerRefs.length > 0, `${scenarioId} must name blockers`);
  assertCondition(records.settlement.releaseToBAURecordRef === null, `${scenarioId} must not create ReleaseToBAURecord`);
}

for (const anchor of [
  'data-testid="bau-487-board"',
  'data-testid="bau-487-status-strip"',
  'data-testid="bau-487-responsibility-lanes"',
  'data-testid="bau-487-rota-table"',
  'data-testid="bau-487-open-actions"',
  'data-testid="bau-487-acceptance-dialog"',
  'data-testid="bau-487-right-rail"',
]) {
  assertIncludes("apps/ops-console/src/bau-handover-board-487.tsx", anchor);
}

for (const script of ["test:programme:487-bau-handover", "validate:487-bau-handover"]) {
  assertIncludes("package.json", script);
}

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
for (const artifact of [
  "data/bau/487_bau_handover_pack.json",
  "data/bau/487_support_rota_matrix.json",
  "data/bau/487_service_owner_acceptance_register.json",
  "data/bau/487_incident_commander_rota.json",
  "data/bau/487_governance_review_calendar.json",
  "data/bau/487_bau_open_actions_register.json",
]) {
  assertCondition(!read(artifact).match(forbiddenSurfacePatterns), `${artifact} leaked sensitive text`);
}

console.log("487 BAU handover artifacts validated.");
