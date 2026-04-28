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

const topology = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "event_broker_topology_manifest.json"), "utf8"),
);
const policy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "event-spine", "local", "broker-access-policy.json"), "utf8"),
);

test("runtime topology binds the event spine manifests", () => {
  assert.equal(
    topology.event_broker_topology_manifest_ref,
    "data/analysis/event_broker_topology_manifest.json",
  );
  assert.equal(
    topology.outbox_inbox_policy_matrix_ref,
    "data/analysis/outbox_inbox_policy_matrix.csv",
  );
  assert.equal(
    topology.canonical_event_to_transport_mapping_ref,
    "data/analysis/canonical_event_to_transport_mapping.json",
  );
});

test("browser access remains blocked for every broker queue", () => {
  assert.equal(policy.browser_direct_publish_blocked, true);
  assert.equal(policy.browser_direct_consume_blocked, true);
  assert.equal(policy.blocked_browser_targets.includes("q_event_integration_effects"), true);
  assert.equal(policy.blocked_browser_targets.includes("q_event_replay_quarantine"), true);
});

test("bootstrap and reset flows remain deterministic", () => {
  const bootstrap = path.join(ROOT, "infra", "event-spine", "local", "bootstrap-event-spine.mjs");
  const reset = path.join(ROOT, "infra", "event-spine", "local", "reset-event-spine.mjs");
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-event-spine-"));

  const bootstrapResult = spawnSync(process.execPath, [bootstrap, "--state-dir", stateDir], {
    encoding: "utf8",
  });
  assert.equal(bootstrapResult.status, 0, bootstrapResult.stderr);
  const plan = JSON.parse(bootstrapResult.stdout);
  assert.equal(plan.streamCount, manifest.summary.stream_count);
  assert.equal(fs.existsSync(path.join(stateDir, "streams", "stream_request")), true);
  assert.equal(fs.existsSync(path.join(stateDir, "queues", "q_event_callback_correlation")), true);

  const resetResult = spawnSync(process.execPath, [reset, "--state-dir", stateDir], {
    encoding: "utf8",
  });
  assert.equal(resetResult.status, 0, resetResult.stderr);
  assert.equal(fs.existsSync(path.join(stateDir, "streams")), false);

  fs.rmSync(stateDir, { recursive: true, force: true });
});
