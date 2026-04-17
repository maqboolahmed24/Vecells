import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

const PREVIEW_CASES_PATH = path.join(ROOT, "data", "test", "136_preview_shell_cases.csv");
const ACCESSIBILITY_CASES_PATH = path.join(ROOT, "data", "test", "136_accessibility_cases.csv");
const SMOKE_EXPECTATIONS_PATH = path.join(ROOT, "data", "test", "136_shell_smoke_expectations.json");
const SUITE_RESULTS_PATH = path.join(ROOT, "data", "test", "136_preview_environment_suite_results.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function csvRowCount(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .trim()
    .split("\n")
    .slice(1).length;
}

test("seq_136 publishes a full cross-shell preview/accessibility result set", () => {
  assert.equal(fs.existsSync(PREVIEW_CASES_PATH), true, "Missing preview cases CSV.");
  assert.equal(fs.existsSync(ACCESSIBILITY_CASES_PATH), true, "Missing accessibility cases CSV.");
  assert.equal(fs.existsSync(SMOKE_EXPECTATIONS_PATH), true, "Missing shell smoke expectations JSON.");
  assert.equal(fs.existsSync(SUITE_RESULTS_PATH), true, "Missing suite results JSON.");

  const previewCaseCount = csvRowCount(PREVIEW_CASES_PATH);
  const accessibilityCaseCount = csvRowCount(ACCESSIBILITY_CASES_PATH);
  const previewCasesText = fs.readFileSync(PREVIEW_CASES_PATH, "utf8");
  const accessibilityCasesText = fs.readFileSync(ACCESSIBILITY_CASES_PATH, "utf8");
  const smokeExpectations = readJson(SMOKE_EXPECTATIONS_PATH);
  const suiteResults = readJson(SUITE_RESULTS_PATH);

  assert.equal(suiteResults.task_id, "seq_136");
  assert.equal(suiteResults.visual_mode, "Shell_Conformance_Atlas");
  assert.equal(smokeExpectations.task_id, "seq_136");
  assert.equal(suiteResults.summary.preview_shell_case_count, previewCaseCount);
  assert.equal(suiteResults.summary.accessibility_case_count, accessibilityCaseCount);
  assert.equal(suiteResults.summary.shell_family_count, 6);
  assert.equal(smokeExpectations.liveSweepCases.length, 6);

  const shellFamilies = new Set(suiteResults.shellFamilyResults.map((row) => row.shellFamily));
  assert.deepEqual(shellFamilies, new Set(["patient", "staff", "operations", "hub", "governance", "pharmacy"]));

  assert.equal(
    suiteResults.summary.failure_class_counts.publication_tuple_failure,
    previewCaseCount,
    "Every current smoke case should remain publication-sensitive.",
  );
  assert.equal(
    previewCasesText.includes("embedded_strip"),
    true,
    "The embedded-strip shell case is missing.",
  );
  assert.equal(
    previewCasesText.includes("shared_shell_preview_only"),
    true,
    "Shared-shell preview coverage is missing.",
  );
  assert.equal(
    accessibilityCasesText.includes(",blocked,"),
    true,
    "Blocked accessibility posture coverage is missing.",
  );
});
