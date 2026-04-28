import fs from "node:fs";
import path from "node:path";
import {
  build488ScenarioRecords,
  canonicalize,
  hashValue,
  required488EdgeCases,
  write488LaunchEvidenceArchiveArtifacts,
} from "./archive_488_launch_evidence";

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

write488LaunchEvidenceArchiveArtifacts();

const requiredFiles = [
  "tools/archive/archive_488_launch_evidence.ts",
  "tools/archive/validate_488_launch_evidence.ts",
  "data/archive/488_launch_evidence_archive_manifest.json",
  "data/archive/488_worm_seal_records.json",
  "data/archive/488_retention_and_legal_hold_matrix.json",
  "data/archive/488_lessons_learned_register.json",
  "data/archive/488_capa_and_continuous_improvement_actions.json",
  "data/archive/488_evidence_export_posture.json",
  "data/contracts/488_launch_archive.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_488_LAUNCH_ARCHIVE_AUTHORITY.json",
  "docs/programme/488_launch_evidence_archive_report.md",
  "docs/programme/488_lessons_learned_and_capa_report.md",
  "data/analysis/488_algorithm_alignment_notes.md",
  "data/analysis/488_external_reference_notes.json",
  "tests/archive/488_archive_manifest.test.ts",
  "tests/archive/488_retention_legal_hold.test.ts",
  "tests/playwright/488_evidence_vault.spec.ts",
  "apps/governance-console/src/evidence-vault-488.model.ts",
  "apps/governance-console/src/evidence-vault-488.tsx",
  "apps/governance-console/src/evidence-vault-488.css",
];

for (const requiredFile of requiredFiles) assertFile(requiredFile);

const manifestEnvelope = readJson<any>("data/archive/488_launch_evidence_archive_manifest.json");
const wormSeals = readJson<any>("data/archive/488_worm_seal_records.json");
const retention = readJson<any>("data/archive/488_retention_and_legal_hold_matrix.json");
const lessons = readJson<any>("data/archive/488_lessons_learned_register.json");
const capa = readJson<any>("data/archive/488_capa_and_continuous_improvement_actions.json");
const exportPosture = readJson<any>("data/archive/488_evidence_export_posture.json");
const gap = readJson<any>(
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_488_LAUNCH_ARCHIVE_AUTHORITY.json",
);

for (const [label, record] of [
  ["manifest envelope", manifestEnvelope],
  ["active manifest", manifestEnvelope.activeManifest],
  ["active command", manifestEnvelope.activeCommand],
  ["active settlement", manifestEnvelope.activeSettlement],
  ["worm seal envelope", wormSeals],
  ["retention envelope", retention],
  ["lessons envelope", lessons],
  ["capa envelope", capa],
  ["export envelope", exportPosture],
] as const) {
  assertHash(record, label);
}

assertCondition(
  manifestEnvelope.activeManifest.archiveVerdict === "sealed_with_exceptions",
  "Active archive should seal with exceptions",
);
assertCondition(
  manifestEnvelope.activeManifest.blockerRefs.length === 0,
  "Active archive must not have blockers",
);
assertCondition(
  manifestEnvelope.activeManifest.archivedEvidenceItemRefs.length >= 10,
  "Archive manifest must enumerate all evidence families",
);
assertCondition(
  new Set(manifestEnvelope.archivedEvidenceItems.map((item: any) => item.family)).size >= 10,
  "Archive must cover Scorecard, Migration, Signoff, Tests, DR, Waves, Assistive, Channel, BAU and Lessons",
);
assertCondition(
  wormSeals.wormSealRecords.every((seal: any) => seal.sealAlgorithm === "sha256-canonical-json-v1"),
  "All WORM seals must use canonical hash algorithm",
);
assertCondition(
  retention.legalHoldBindings.some((binding: any) => binding.legalHoldState === "active"),
  "Retention matrix must carry active legal holds",
);
assertCondition(
  retention.deletionProtectionVerdicts.every((verdict: any) => verdict.deletionPermitted === false),
  "Deletion must be blocked for archived launch evidence",
);
assertCondition(
  lessons.lessonsLearnedRegister.lessons.every((lesson: any) => lesson.owner && (lesson.capaActionRef || lesson.continuousImprovementLinkRef)),
  "Every active lesson must have owner and CAPA or CI link",
);
assertCondition(capa.capaActions.length > 0, "CAPA actions must be created");
assertCondition(capa.continuousImprovementLinks.length > 0, "CI links must be created");
assertCondition(
  ["permitted", "permitted_with_redaction"].includes(exportPosture.evidenceExportPosture.exportState),
  "Active export posture must be permitted or redacted",
);
assertCondition(
  gap.failClosedBridge.privilegedMutationPermitted === false,
  "Interface gap bridge must fail closed",
);

for (const scenarioId of required488EdgeCases) {
  const records = build488ScenarioRecords(scenarioId, []);
  if (scenarioId === "trace_sensitive_quarantine") {
    assertCondition(
      records.manifest.archiveVerdict === "sealed_with_exceptions",
      "Sensitive traces should quarantine and seal with exceptions",
    );
    assertCondition(records.manifest.quarantinedArtifactRefs.length > 0, "Sensitive trace scenario must quarantine artifacts");
  } else {
    assertCondition(records.manifest.archiveVerdict === "blocked", `${scenarioId} must block archive sealing`);
    assertCondition(records.manifest.blockerRefs.length > 0, `${scenarioId} must name blockers`);
  }
}

for (const anchor of [
  'data-testid="evidence-vault-488"',
  'data-testid="evidence-vault-488-top-strip"',
  'data-testid="evidence-vault-488-shelves"',
  'data-testid="evidence-vault-488-cards"',
  'data-testid="evidence-vault-488-retention-drawer"',
  'data-testid="evidence-vault-488-capa-table"',
  'data-testid="evidence-vault-488-export-dialog"',
  'data-testid="evidence-vault-488-right-rail"',
]) {
  assertIncludes("apps/governance-console/src/evidence-vault-488.tsx", anchor);
}

for (const script of ["test:programme:488-launch-archive", "validate:488-launch-archive"]) {
  assertIncludes("package.json", script);
}

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
for (const artifact of [
  "data/archive/488_launch_evidence_archive_manifest.json",
  "data/archive/488_worm_seal_records.json",
  "data/archive/488_retention_and_legal_hold_matrix.json",
  "data/archive/488_lessons_learned_register.json",
  "data/archive/488_capa_and_continuous_improvement_actions.json",
  "data/archive/488_evidence_export_posture.json",
]) {
  assertCondition(!read(artifact).match(forbiddenSurfacePatterns), `${artifact} leaked sensitive text`);
}

console.log("488 launch evidence archive artifacts validated.");
