import fs from "node:fs";
import path from "node:path";
import { parseArgs, buildRecord, writeRehearsalOutputs } from "./shared";

const args = parseArgs(process.argv);
const environment = (args["--environment"] ?? "ci-preview") as
  | "local"
  | "ci-preview"
  | "integration"
  | "preprod"
  | "production";
const outputDir = path.resolve(
  args["--output-dir"] ?? path.join(".artifacts", "build-provenance", environment),
);
const buildFamilyRef = args["--build-family"] ?? "bf_release_control_bundle";
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "analysis", "build_provenance_manifest.json"),
    "utf8",
  ),
);
const family = manifest.buildFamilies.find((row) => row.buildFamilyRef === buildFamilyRef);
if (!family) {
  throw new Error(`Unknown build family ${buildFamilyRef}.`);
}
const outputs = buildRecord({
  buildFamilyRef,
  environmentRing: environment,
  artifactRoots: family.artifactRoots,
  outputDir,
  failedGateRef: args["--failed-gate"],
  sourceTreeState: (args["--source-tree-state"] as
    | "clean_tagged"
    | "clean_commit"
    | "dirty_rejected"
    | undefined) ?? "clean_commit",
});
writeRehearsalOutputs(outputDir, outputs);
process.stdout.write(
  `${JSON.stringify(
    {
      outputDir,
      buildFamilyRef,
      environment,
      provenanceId: outputs.record.provenanceId,
      verificationState: outputs.record.verificationState,
      runtimeConsumptionState: outputs.record.runtimeConsumptionState,
      decision: outputs.verification.decisionState,
    },
    null,
    2,
  )}\n`,
);
