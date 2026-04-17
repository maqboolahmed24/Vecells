import assert from "node:assert/strict";
import fs from "node:fs";
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
const domainManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "domain_store_manifest.json"), "utf8"),
);
const fhirManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "fhir_store_manifest.json"), "utf8"),
);
const localPolicy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "data-storage", "local", "connectivity-policy.json"), "utf8"),
);

test("runtime topology binds the two store manifests", () => {
  assert.equal(runtimeTopology.domain_store_manifest_ref, "data/analysis/domain_store_manifest.json");
  assert.equal(runtimeTopology.fhir_store_manifest_ref, "data/analysis/fhir_store_manifest.json");
  const dataStoreRefs = runtimeTopology.data_store_catalog.map((row) => row.data_store_ref);
  assert.equal(dataStoreRefs.includes("ds_transactional_domain_authority"), true);
  assert.equal(dataStoreRefs.includes("ds_relational_fhir"), true);
});

test("domain and FHIR manifests keep the same regional footprint but separate authority modes", () => {
  assert.equal(domainManifest.summary.store_realization_count, 7);
  assert.equal(fhirManifest.summary.store_realization_count, 7);
  const domainStates = new Set(domainManifest.store_realizations.map((row) => row.binding_state));
  const fhirStates = new Set(fhirManifest.store_realizations.map((row) => row.binding_state));
  assert.equal(domainStates.has("writable_authority"), true);
  assert.equal(fhirStates.has("derived_materialization"), true);
});

test("local policy keeps browsers out of both stores", () => {
  assert.deepEqual(localPolicy.browser_addressable_services, []);
  assert.equal(localPolicy.blocked_browser_targets.includes("ds_transactional_domain_authority"), true);
  assert.equal(localPolicy.blocked_browser_targets.includes("ds_relational_fhir"), true);
});

test("bootstrap SQL keeps domain and FHIR tables separate", () => {
  const domainSql = fs.readFileSync(
    path.join(ROOT, "infra", "data-storage", "bootstrap", "001_domain_transaction_bootstrap.sql"),
    "utf8",
  );
  const fhirSql = fs.readFileSync(
    path.join(ROOT, "infra", "data-storage", "bootstrap", "001_fhir_representation_bootstrap.sql"),
    "utf8",
  );
  assert.equal(domainSql.includes("vecells_request.requests"), true);
  assert.equal(domainSql.includes("vecells_identity.identity_bindings"), true);
  assert.equal(fhirSql.includes("vecells_fhir.fhir_representation_sets"), true);
  assert.equal(fhirSql.includes("vecells_fhir.fhir_exchange_bundles"), true);
});

test("local bootstrap script emits a deterministic dry-run plan", () => {
  const scriptPath = path.join(
    ROOT,
    "infra",
    "data-storage",
    "local",
    "bootstrap-domain-fhir-storage.mjs",
  );
  const result = spawnSync(process.execPath, [scriptPath, "--dry-run"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.stores.length, 2);
  assert.equal(plan.stores[0].defaultDsnEnv, "VECELLS_DOMAIN_STORE_DSN");
  assert.equal(plan.stores[1].defaultDsnEnv, "VECELLS_FHIR_STORE_DSN");
});
