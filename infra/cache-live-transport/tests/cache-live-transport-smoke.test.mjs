import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INFRA_ROOT = path.resolve(__dirname, "..");
const LOCAL_DIR = path.join(INFRA_ROOT, "local");
const STATE_DIR = path.join(LOCAL_DIR, "state");

function runScript(name) {
  execFileSync(process.execPath, [path.join(LOCAL_DIR, name)], {
    cwd: INFRA_ROOT,
    stdio: "pipe",
  });
}

function readState(name) {
  return JSON.parse(
    fs.readFileSync(path.join(STATE_DIR, name), "utf8"),
  );
}

runScript("bootstrap-cache-live-transport.mjs");
runScript("restart-live-transport.mjs");
runScript("drill-heartbeat-loss.mjs");
runScript("drill-replay-window.mjs");
runScript("drill-cache-reset.mjs");
runScript("reset-cache-live-transport.mjs");

const bootstrap = readState("bootstrap-report.json");
const restart = readState("restart-report.json");
const heartbeat = readState("heartbeat-loss-report.json");
const replay = readState("replay-window-report.json");
const cacheReset = readState("cache-reset-drill-report.json");
const reset = readState("reset-report.json");

assert.equal(bootstrap.cacheNamespaceCount, 21);
assert.equal(bootstrap.liveChannelCount, 15);
assert.equal(restart.gatewaySafeBoundary, true);
assert.equal(heartbeat.degradedState, "heartbeat_missed");
assert.equal(heartbeat.connectionHealthImpliesFreshTruth, false);
assert.equal(replay.replayState, "window_exhausted");
assert.equal(cacheReset.cacheHealthState, "reset");
assert.equal(cacheReset.writablePosture, false);
assert.equal(reset.visibleReset, true);
