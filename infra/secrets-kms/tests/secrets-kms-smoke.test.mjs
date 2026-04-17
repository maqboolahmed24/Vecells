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

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "secret_class_manifest.json"), "utf8"),
);
const keyManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "key_hierarchy_manifest.json"), "utf8"),
);
const breakGlassPolicy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "secrets-kms", "local", "break-glass-policy.json"), "utf8"),
);
const accessLogPolicy = JSON.parse(
  fs.readFileSync(path.join(ROOT, "infra", "secrets-kms", "local", "access-log-policy.json"), "utf8"),
);

test("manifest and key hierarchy stay aligned", () => {
  assert.equal(manifest.task_id, "par_089");
  assert.equal(keyManifest.task_id, "par_089");
  assert.equal(manifest.environment_backends.length, 5);
  assert.equal(keyManifest.root_keys.length, 5);
  assert.equal(keyManifest.branch_keys.length, 6);
});

test("break-glass and audit log policy remain redaction-safe", () => {
  assert.equal(breakGlassPolicy.ticket_required, true);
  assert.equal(breakGlassPolicy.second_approver_required, true);
  assert.equal(accessLogPolicy.log_secret_values, false);
  assert.equal(accessLogPolicy.forbidden_patterns.includes("BEGIN PRIVATE KEY"), true);
});

test("bootstrap script seeds encrypted local state without plaintext values", () => {
  const scriptPath = path.join(
    ROOT,
    "infra",
    "secrets-kms",
    "local",
    "bootstrap-secrets-kms.mjs",
  );
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-secret-kms-"));
  const result = spawnSync(process.execPath, [scriptPath, "--environment", "local", "--state-dir", stateDir], {
    encoding: "utf8",
    env: {
      ...process.env,
      VECELLS_KMS_MASTER_KEY_BASE64: Buffer.alloc(32, 1).toString("base64"),
    },
  });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.environmentRing, "local");
  const state = JSON.parse(fs.readFileSync(path.join(stateDir, "secret-store.json"), "utf8"));
  assert.equal(
    state.records.length,
    manifest.secret_classes.filter((row) => row.allowed_environment_rings.includes("local")).length,
  );
  const stateText = JSON.stringify(state);
  assert.equal(stateText.includes("master_key_b64"), false);
  assert.equal(stateText.includes("\"value\""), false);
  assert.equal(stateText.includes("synthetic:"), false);
  fs.rmSync(stateDir, { recursive: true, force: true });
});
