import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/test/Code/V";
const RESULTS_PATH = path.join(ROOT, "data", "test", "137_rehearsal_results.json");
const EXPECTATIONS_PATH = path.join(ROOT, "data", "test", "137_release_rehearsal_expectations.json");

test("seq_137 publishes a tuple-bound release, canary, and restore rehearsal suite", () => {
  assert.equal(fs.existsSync(RESULTS_PATH), true, "Missing seq_137 results payload.");
  assert.equal(fs.existsSync(EXPECTATIONS_PATH), true, "Missing seq_137 expectations payload.");

  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  const expectations = JSON.parse(fs.readFileSync(EXPECTATIONS_PATH, "utf8"));

  assert.equal(results.task_id, "seq_137");
  assert.equal(results.visual_mode, "Release_Rehearsal_Cockpit");
  assert.equal(results.suiteVerdict, "rehearsal_exact_live_withheld");
  assert.equal(results.summary.rehearsal_case_count, 11);
  assert.equal(results.summary.wave_observation_case_count, 6);
  assert.equal(results.summary.restore_readiness_case_count, 6);
  assert.equal(results.summary.applied_allowed_case_count, 0);
  assert.equal(results.summary.live_control_reopened_count, 0);
  assert.equal(results.summary.preview_live_advertisement_count, 0);

  assert.deepEqual(
    results.cases.map((row) => row.caseId),
    expectations.required_case_ids,
    "Main case ids drifted from expectations.",
  );
  assert.deepEqual(
    results.waveObservationCases.map((row) => row.observationCaseId),
    expectations.required_wave_observation_case_ids,
    "Wave observation case ids drifted from expectations.",
  );
  assert.deepEqual(
    results.restoreReadinessCases.map((row) => row.restoreCaseId),
    expectations.required_restore_case_ids,
    "Restore readiness case ids drifted from expectations.",
  );

  const localRestore = results.restoreReadinessCases.find((row) => row.restoreCaseId === "LOCAL_EXACT_READY");
  assert.equal(localRestore?.liveAuthorityRestored, "no");
  const rollbackCase = results.cases.find(
    (row) => row.caseId === "INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH",
  );
  assert.equal(rollbackCase?.outcomeState, "rollback_required");
});
