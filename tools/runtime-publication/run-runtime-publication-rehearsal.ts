import path from "node:path";
import {
  ROOT,
  evaluatePublicationArtifacts,
  loadPublicationArtifacts,
  parseArgs,
  writeJson,
} from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "ci-preview";
const outputDir = path.resolve(
  args["--output-dir"] ?? path.join(ROOT, ".artifacts", "runtime-publication", environment),
);

const artifacts = loadPublicationArtifacts(environment);
const verdict = evaluatePublicationArtifacts(artifacts);

writeJson(path.join(outputDir, "runtime-publication-bundle.json"), artifacts.bundle);
writeJson(path.join(outputDir, "release-publication-parity.json"), artifacts.parity);
writeJson(path.join(outputDir, "publication-authority-verdict.json"), verdict);

process.stdout.write(
  `${JSON.stringify(
    {
      environment,
      outputDir,
      bundle: artifacts.bundle.runtimePublicationBundleId,
      parity: artifacts.parity.publicationParityRecordId,
      publishable: verdict.publishable,
      refusalReasonRefs: verdict.refusalReasonRefs,
    },
    null,
    2,
  )}\n`,
);
