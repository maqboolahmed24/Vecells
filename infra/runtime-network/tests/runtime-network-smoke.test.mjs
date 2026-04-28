
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const topology = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
);
const allowlists = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "private_egress_allowlist_manifest.json"), "utf8"),
);
const localPolicy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "runtime-network", "local", "network-policy.json"), "utf8"),
);

test("network foundation covers every runtime workload instance", () => {
  const foundation = topology.network_foundation;
  const segmentCount = foundation.environment_network_realizations
    .flatMap((environment) => environment.region_placements)
    .flatMap((placement) => placement.workload_segments).length;
  assert.equal(
    segmentCount,
    topology.runtime_workload_families.length,
    "every runtime workload instance should have a segment realization",
  );
});

test("browser reachability stays limited to the published bridge", () => {
  assert.deepEqual(localPolicy.blocked_direct_browser_services.includes("data-plane"), true);
  assert.deepEqual(localPolicy.blocked_direct_browser_services.includes("integration-dispatch"), true);
  assert.deepEqual(localPolicy.browser_addressable_services.includes("published-gateway"), true);
});

test("every workload family remains covered by one default-deny allowlist", () => {
  const coveredFamilies = new Set(
    allowlists.allowlists.flatMap((row) => row.family_refs),
  );
  const familyRefs = topology.workload_family_catalog.map((row) => row.runtime_workload_family_ref);
  assert.equal(coveredFamilies.size, familyRefs.length);
  for (const familyRef of familyRefs) {
    assert.equal(coveredFamilies.has(familyRef), true, familyRef);
  }
  for (const allowlist of allowlists.allowlists) {
    assert.equal(allowlist.default_action, "deny");
  }
});
