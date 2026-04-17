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
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "object_storage_class_manifest.json"), "utf8"),
);
const keyRules = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "object_key_manifest_rules.json"), "utf8"),
);
const localPolicy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "object-storage", "local", "object-storage-policy.json"), "utf8"),
);
const scanHandoff = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "object-storage", "local", "malware-scan-handoff.json"), "utf8"),
);

test("runtime topology binds the object storage manifests", () => {
  assert.equal(
    runtimeTopology.object_storage_class_manifest_ref,
    "data/analysis/object_storage_class_manifest.json",
  );
  assert.equal(
    runtimeTopology.object_retention_policy_matrix_ref,
    "data/analysis/object_retention_policy_matrix.csv",
  );
  assert.equal(
    runtimeTopology.object_key_manifest_rules_ref,
    "data/analysis/object_key_manifest_rules.json",
  );
});

test("browser delivery remains blocked for raw and quarantine classes", () => {
  assert.deepEqual(localPolicy.browser_addressable_services, []);
  assert.equal(localPolicy.blocked_browser_targets.includes("quarantine_raw"), true);
  assert.equal(localPolicy.blocked_browser_targets.includes("evidence_source_immutable"), true);
});

test("scan handoff preserves quarantine until verdict and manifest settle", () => {
  assert.equal(scanHandoff.source_storage_class_ref, "quarantine_raw");
  assert.equal(scanHandoff.clean_target_storage_class_ref, "evidence_source_immutable");
  assert.equal(scanHandoff.blocked_browser_paths, true);
});

test("bootstrap script seeds deterministic object fixtures", () => {
  const scriptPath = path.join(
    ROOT,
    "infra",
    "object-storage",
    "local",
    "bootstrap-object-storage.mjs",
  );
  const seedDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-object-storage-"));
  const result = spawnSync(process.execPath, [scriptPath, "--seed-dir", seedDir], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const seededClasses = fs
    .readdirSync(seedDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(seededClasses, [
    "derived_internal",
    "evidence_source_immutable",
    "ops_recovery_staging",
    "outbound_ephemeral",
    "quarantine_raw",
    "redacted_presentation",
  ]);
  fs.rmSync(seedDir, { recursive: true, force: true });
});

test("key rules forbid PHI-bearing segments", () => {
  assert.equal(keyRules.prohibited_key_material.includes("nhs_number"), true);
  assert.equal(keyRules.prohibited_key_material.includes("patient_name"), true);
});
