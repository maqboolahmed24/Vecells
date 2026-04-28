import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data", "analysis", "event_broker_topology_manifest.json"),
    "utf8",
  ),
);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1] ?? "true");
}

const stateDir = args.get("--state-dir") ?? path.join(ROOT, ".tmp", "event-spine-state");
const dryRun = args.has("--dry-run");
const plan = {
  brokerCount: manifest.localBrokerEnvironments.length,
  streamCount: manifest.namespaceStreams.length,
  queueCount: manifest.queueGroups.length,
  dlqRefs: manifest.queueGroups.map((row) => row.dlqRef),
  stateDir,
};

if (dryRun) {
  process.stdout.write(JSON.stringify(plan));
  process.exit(0);
}

fs.mkdirSync(stateDir, { recursive: true });
for (const folder of ["streams", "queues", "dlq"]) {
  fs.mkdirSync(path.join(stateDir, folder), { recursive: true });
}
for (const stream of manifest.namespaceStreams) {
  fs.mkdirSync(path.join(stateDir, "streams", stream.streamRef), { recursive: true });
}
for (const queue of manifest.queueGroups) {
  const queueDir = path.join(stateDir, "queues", queue.queueRef);
  fs.mkdirSync(queueDir, { recursive: true });
  fs.writeFileSync(
    path.join(queueDir, "subscription.json"),
    JSON.stringify(
      {
        consumerGroupRef: queue.consumerGroupRef,
        retryPosture: queue.retryPosture,
        dlqRef: queue.dlqRef,
      },
      null,
      2,
    ),
  );
  fs.mkdirSync(path.join(stateDir, "dlq", queue.dlqRef), { recursive: true });
}
process.stdout.write(JSON.stringify(plan));
