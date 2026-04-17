import { teardownPreviewEnvironment } from "./preview-environment-runtime.mjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1] ?? "true");
}

const previewEnvironmentRef = args.get("--preview-ref") ?? "pev_branch_patient_care";
const stateDir = args.get("--state-dir");
if (!stateDir) {
  throw new Error("Missing required --state-dir argument");
}

const report = teardownPreviewEnvironment({ previewEnvironmentRef, stateDir });
process.stdout.write(JSON.stringify(report));
