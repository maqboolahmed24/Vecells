import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

const runtimeTopology = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
);
const previewManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "preview_environment_manifest.json"), "utf8"),
);
const seedPackManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "preview_seed_pack_manifest.json"), "utf8"),
);
const browserPolicy = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "infra", "preview-environments", "local", "preview-browser-policy.json"),
    "utf8",
  ),
);

test("runtime topology binds preview manifest refs", () => {
  assert.equal(
    runtimeTopology.preview_environment_manifest_ref,
    "data/analysis/preview_environment_manifest.json",
  );
  assert.equal(
    runtimeTopology.preview_seed_pack_manifest_ref,
    "data/analysis/preview_seed_pack_manifest.json",
  );
  assert.equal(runtimeTopology.preview_reset_matrix_ref, "data/analysis/preview_reset_matrix.csv");
});

test("preview manifests keep governed synthetic-only posture", () => {
  assert.equal(previewManifest.summary.preview_environment_count, 6);
  assert.equal(seedPackManifest.summary.seed_pack_count, 5);
  assert.equal(
    previewManifest.preview_environments.some((row) => row.state === "expired"),
    true,
  );
  assert.equal(
    previewManifest.preview_environments.some((row) => row.state === "drifted"),
    true,
  );
  assert.equal(
    seedPackManifest.seed_packs.every((row) => row.syntheticOnly === true && row.previewSafe === true),
    true,
  );
});

test("local bootstrap, drift detect, reset, and teardown remain deterministic", () => {
  const bootstrapScript = path.join(
    ROOT,
    "infra",
    "preview-environments",
    "local",
    "bootstrap-preview-environment.mjs",
  );
  const driftScript = path.join(
    ROOT,
    "infra",
    "preview-environments",
    "local",
    "detect-preview-drift.mjs",
  );
  const resetScript = path.join(
    ROOT,
    "infra",
    "preview-environments",
    "local",
    "reset-preview-environment.mjs",
  );
  const teardownScript = path.join(
    ROOT,
    "infra",
    "preview-environments",
    "local",
    "teardown-preview-environment.mjs",
  );

  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-preview-env-"));
  const previewRef = "pev_branch_patient_care";

  const bootstrapResult = spawnSync(
    process.execPath,
    [bootstrapScript, "--preview-ref", previewRef, "--state-dir", stateDir],
    { encoding: "utf8" },
  );
  assert.equal(bootstrapResult.status, 0, bootstrapResult.stderr);
  const bootstrapReport = JSON.parse(bootstrapResult.stdout);
  assert.equal(bootstrapReport.previewEnvironmentRef, previewRef);
  assert.equal(bootstrapReport.substrateCount, 8);
  const envRoot = path.join(stateDir, previewRef);
  assert.equal(fs.existsSync(path.join(envRoot, "environment.json")), true);
  const banner = JSON.parse(
    fs.readFileSync(path.join(envRoot, "browser", "surface-banner.json"), "utf8"),
  );
  assert.equal(banner.bannerMarker, "vecells-preview-synthetic");
  assert.equal(
    browserPolicy.preview_truth_markers.every((marker) => banner.domMarkers.includes(marker)),
    true,
  );

  const mutatedSubstratePath = path.join(envRoot, "substrates", "domain_store.json");
  const mutatedSubstrate = JSON.parse(fs.readFileSync(mutatedSubstratePath, "utf8"));
  mutatedSubstrate.expectedTupleHash = "mutated-preview-seed";
  fs.writeFileSync(mutatedSubstratePath, JSON.stringify(mutatedSubstrate, null, 2) + "\n", "utf8");

  const driftResult = spawnSync(
    process.execPath,
    [driftScript, "--preview-ref", previewRef, "--state-dir", stateDir],
    { encoding: "utf8" },
  );
  assert.equal(driftResult.status, 0, driftResult.stderr);
  const driftReport = JSON.parse(driftResult.stdout);
  assert.equal(driftReport.driftState, "seed_drift");
  assert.equal(driftReport.mismatches.includes("domain_store"), true);

  const resetResult = spawnSync(
    process.execPath,
    [resetScript, "--preview-ref", previewRef, "--state-dir", stateDir],
    { encoding: "utf8" },
  );
  assert.equal(resetResult.status, 0, resetResult.stderr);
  const resetReport = JSON.parse(resetResult.stdout);
  assert.equal(resetReport.mode, "reset");

  const cleanDriftResult = spawnSync(
    process.execPath,
    [driftScript, "--preview-ref", previewRef, "--state-dir", stateDir],
    { encoding: "utf8" },
  );
  const cleanDriftReport = JSON.parse(cleanDriftResult.stdout);
  assert.equal(cleanDriftReport.driftState, "clean");

  const teardownResult = spawnSync(
    process.execPath,
    [teardownScript, "--preview-ref", previewRef, "--state-dir", stateDir],
    { encoding: "utf8" },
  );
  assert.equal(teardownResult.status, 0, teardownResult.stderr);
  assert.equal(fs.existsSync(envRoot), false);

  fs.rmSync(stateDir, { recursive: true, force: true });
});
