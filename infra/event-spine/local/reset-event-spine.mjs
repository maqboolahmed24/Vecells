import fs from "node:fs";
import path from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1] ?? "true");
}

const stateDir = args.get("--state-dir");
const dryRun = args.has("--dry-run");
const plan = {
  action: "reset",
  stateDir,
  removedPaths: stateDir ? [path.join(stateDir, "streams"), path.join(stateDir, "queues"), path.join(stateDir, "dlq")] : [],
};

if (dryRun || !stateDir) {
  process.stdout.write(JSON.stringify(plan));
  process.exit(0);
}

fs.rmSync(stateDir, { recursive: true, force: true });
fs.mkdirSync(stateDir, { recursive: true });
process.stdout.write(JSON.stringify(plan));
