import { createPreviewEnvironment } from "./preview-environment-runtime.mjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1] ?? "true");
}

const previewEnvironmentRef = args.get("--preview-ref") ?? "pev_branch_patient_care";
const stateDir = args.get("--state-dir");
const dryRun = process.argv.includes("--dry-run");

if (dryRun || !stateDir) {
  const report = createPreviewEnvironment({
    previewEnvironmentRef,
    stateDir: stateDir ?? "/tmp/vecells-preview-dry-run",
  });
  process.stdout.write(JSON.stringify(report));
  process.exit(0);
}

const report = createPreviewEnvironment({ previewEnvironmentRef, stateDir });
process.stdout.write(JSON.stringify(report));
