import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

type JsonObject = Record<string, unknown>;

const requiredFiles = [
  "tests/playwright/480_final_uat_patient.spec.ts",
  "tests/playwright/480_final_uat_staff_operations.spec.ts",
  "tests/playwright/480_final_uat_governance_release.spec.ts",
  "tests/playwright/480_final_visual_regression.spec.ts",
  "tests/playwright/480_final_accessibility_and_aria_snapshots.spec.ts",
  "data/evidence/480_uat_result_matrix.json",
  "data/evidence/480_visual_regression_baseline_manifest.json",
  "data/evidence/480_accessibility_snapshot_manifest.json",
  "docs/test-evidence/480_final_uat_and_visual_regression_report.md",
  "docs/design/480_quiet_clarity_visual_acceptance_notes.md",
  "data/analysis/480_algorithm_alignment_notes.md",
  "data/analysis/480_external_reference_notes.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_480_VISUAL_ACCEPTANCE_SETTLEMENT.json",
] as const;

const requiredRecordTypes = [
  "FinalUATScenario",
  "UATAcceptanceEvidence",
  "VisualRegressionBaseline",
  "VisualRegressionVerdict",
  "AccessibilitySnapshotEvidence",
  "KeyboardJourneyEvidence",
  "FocusRestorationEvidence",
  "ReducedMotionEvidence",
  "QuietClarityAcceptanceFinding",
  "TokenComplianceEvidence",
  "ContentPlainLanguageFinding",
] as const;

const requiredEdgeCases = [
  "edge_480_nondeterministic_timestamp_or_skeleton_masked",
  "edge_480_dense_ops_table_not_patient_editable",
  "edge_480_support_drawer_focus_live_update",
  "edge_480_blocked_state_visible",
  "edge_480_chart_table_fallback_labels",
  "edge_480_nhs_app_mobile_no_fixed_rail_overflow",
  "edge_480_assistive_provenance_not_authority",
] as const;

const forbiddenRawSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function assertFileExists(relativePath: string): void {
  assert(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} must exist`);
}

function assertNoSensitiveSerialized(value: unknown, label: string): void {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  assert(!forbiddenRawSensitivePattern.test(serialized), `${label} contains raw sensitive marker`);
}

function assertHashRecord(value: unknown, pathLabel = "record"): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertHashRecord(entry, `${pathLabel}[${index}]`));
    return;
  }
  const record = value as JsonObject;
  if (typeof record.recordHash === "string") {
    const { recordHash, ...withoutHash } = record;
    assert.equal(
      recordHash,
      hashValue(withoutHash),
      `${pathLabel} recordHash must be deterministic`,
    );
  }
  for (const [key, nested] of Object.entries(record)) {
    if (key !== "recordHash") assertHashRecord(nested, `${pathLabel}.${key}`);
  }
}

function collectRecordTypes(value: unknown, found = new Set<string>()): Set<string> {
  if (value === null || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectRecordTypes(entry, found));
    return found;
  }
  const record = value as JsonObject;
  if (typeof record.recordType === "string") found.add(record.recordType);
  Object.values(record).forEach((entry) => collectRecordTypes(entry, found));
  return found;
}

function asArray(value: unknown, label: string): JsonObject[] {
  assert(Array.isArray(value), `${label} must be an array`);
  return value as JsonObject[];
}

export function validate480FinalUATVisualArtifacts(): void {
  requiredFiles.forEach(assertFileExists);

  const matrix = readJson<JsonObject>("data/evidence/480_uat_result_matrix.json");
  const visual = readJson<JsonObject>("data/evidence/480_visual_regression_baseline_manifest.json");
  const accessibility = readJson<JsonObject>(
    "data/evidence/480_accessibility_snapshot_manifest.json",
  );
  const interfaceGap = readJson<JsonObject>(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_480_VISUAL_ACCEPTANCE_SETTLEMENT.json",
  );
  const externalRefs = readJson<JsonObject>("data/analysis/480_external_reference_notes.json");

  for (const [label, value] of Object.entries({
    matrix,
    visual,
    accessibility,
    interfaceGap,
    externalRefs,
  })) {
    assertNoSensitiveSerialized(value, label);
    assertHashRecord(value, label);
  }

  for (const relativePath of [
    "docs/test-evidence/480_final_uat_and_visual_regression_report.md",
    "docs/design/480_quiet_clarity_visual_acceptance_notes.md",
    "data/analysis/480_algorithm_alignment_notes.md",
  ]) {
    assertNoSensitiveSerialized(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      relativePath,
    );
  }

  assert.equal(matrix.taskId, "seq_480");
  assert.equal(matrix.schemaVersion, "480.programme.final-uat-visual-regression.v1");
  assert.equal(matrix.overallState, "accepted_with_deferred_channel_constraint");
  assert.equal(matrix.launchBlockingFindingCount, 0, "launch-blocking findings must be closed");

  const recordTypes = collectRecordTypes({ matrix, visual, accessibility, interfaceGap });
  requiredRecordTypes.forEach((recordType) => {
    assert(recordTypes.has(recordType), `${recordType} must be represented`);
  });

  const scenarios = asArray(matrix.scenarios, "matrix.scenarios");
  const edgeCaseRefs = new Set(
    scenarios.flatMap((scenario) =>
      asArray(scenario.requiredEdgeCaseRefs, `${scenario.scenarioId}.requiredEdgeCaseRefs`),
    ),
  );
  requiredEdgeCases.forEach((edgeCase) => {
    assert(edgeCaseRefs.has(edgeCase), `${edgeCase} must be covered`);
  });

  const acceptanceEvidence = asArray(matrix.acceptanceEvidence, "matrix.acceptanceEvidence");
  assert.equal(acceptanceEvidence.length, scenarios.length, "every scenario needs evidence");
  for (const evidence of acceptanceEvidence) {
    assert.notEqual(evidence.acceptanceState, "blocked", `${evidence.scenarioRef} is blocked`);
    assert.equal(
      evidence.noCompletionClaimBeforeSettlement,
      true,
      `${evidence.scenarioRef} must keep settlement guard`,
    );
    assert.equal(evidence.noPhiOrSecretsObserved, true, `${evidence.scenarioRef} must be redacted`);
    assert(
      asArray(evidence.artifactRefs, `${evidence.scenarioRef}.artifactRefs`).length > 0,
      `${evidence.scenarioRef} must have artifacts`,
    );
  }

  const tokenEvidence = asArray(matrix.tokenComplianceEvidence, "matrix.tokenComplianceEvidence");
  assert(
    tokenEvidence.every((entry) => entry.hardCodedBypassCount === 0 && entry.state === "passed"),
    "token compliance must pass without local bypasses",
  );
  const contentFindings = asArray(
    matrix.contentPlainLanguageFindings,
    "matrix.contentPlainLanguageFindings",
  );
  assert(
    contentFindings.every((entry) => entry.duplicateStatusBannerCount === 0),
    "duplicate status banners must be absent",
  );

  const visualBaselines = asArray(visual.visualBaselines, "visual.visualBaselines");
  const visualVerdicts = asArray(visual.visualVerdicts, "visual.visualVerdicts");
  assert(visualBaselines.length >= 5, "representative visual baselines must be captured");
  assert(
    visualVerdicts.every((verdict) => verdict.verdictState === "passed"),
    "visual verdicts must pass",
  );
  visualBaselines.forEach((baseline) => {
    const artifactRef = String(baseline.baselineArtifactRef);
    assert(
      artifactRef.startsWith("output/playwright/480-final-uat-visual/"),
      `${artifactRef} must stay under 480 output root`,
    );
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
    assert.equal(
      baseline.baselineHash,
      createHash("sha256")
        .update(fs.readFileSync(path.join(ROOT, artifactRef)))
        .digest("hex"),
      `${artifactRef} hash must match baseline`,
    );
  });

  const snapshots = asArray(
    accessibility.accessibilitySnapshots,
    "accessibility.accessibilitySnapshots",
  );
  assert(snapshots.length >= 8, "cross-shell ARIA snapshots must be captured");
  snapshots.forEach((snapshot) => {
    const artifactRef = String(snapshot.artifactRef);
    assert(fs.existsSync(path.join(ROOT, artifactRef)), `${artifactRef} must exist`);
  });
  assert(
    snapshots.some((snapshot) => snapshot.tableFallbackVerified === true),
    "at least one table fallback snapshot must be verified",
  );
  assert(
    snapshots.some((snapshot) => snapshot.mobileOverflowVerified === true),
    "mobile overflow evidence must be present",
  );
  assert(
    asArray(accessibility.focusRestorationEvidence, "accessibility.focusRestorationEvidence").every(
      (entry) => entry.liveUpdateStealsFocus === false,
    ),
    "live update must not steal focus",
  );
  assert(
    asArray(accessibility.reducedMotionEvidence, "accessibility.reducedMotionEvidence").every(
      (entry) => entry.layoutOrderPreserved === true,
    ),
    "reduced motion must preserve layout order",
  );

  assert.equal(
    (interfaceGap as any).commandRequirements?.settlementRequiredBeforeCompletionClaim,
    true,
    "interface gap must require settlement before completion claim",
  );
  assert.equal(
    (interfaceGap as any).commandRequirements?.visualBaselineMustBeStable,
    true,
    "interface gap must require stable visual baselines",
  );

  const notes = asArray(externalRefs.notes, "externalRefs.notes");
  assert(
    notes.some((note) => String(note.url).includes("playwright.dev")),
    "external notes must cite Playwright",
  );
  assert(
    notes.some((note) => String(note.url).includes("service-manual.nhs.uk/accessibility")),
    "external notes must cite NHS accessibility guidance",
  );
  assert(
    notes.some((note) => String(note.url).includes("www.w3.org/TR/WCAG22")),
    "external notes must cite WCAG 2.2",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validate480FinalUATVisualArtifacts();
  console.log("480 final UAT and visual regression artifacts validated.");
}
