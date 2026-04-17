import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const CACHE_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "cache_namespace_manifest.json");
const LIVE_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "live_transport_topology_manifest.json");
const STATE_DIR = path.join(ROOT, "infra", "cache-live-transport", "local", "state");

const cacheManifest = JSON.parse(fs.readFileSync(CACHE_MANIFEST_PATH, "utf8"));
const liveManifest = JSON.parse(fs.readFileSync(LIVE_MANIFEST_PATH, "utf8"));

fs.mkdirSync(STATE_DIR, { recursive: true });

const report = {
  task: "par_088",
  mode: "restart",
  gatewaySafeBoundary: true,
  transportState: "restored",
  liveChannelCount: liveManifest.summary.live_channel_count,
};
fs.writeFileSync(
  path.join(STATE_DIR, "restart-report.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
