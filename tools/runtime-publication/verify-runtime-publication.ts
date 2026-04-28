import path from "node:path";
import {
  ROOT,
  evaluatePublicationArtifacts,
  parseArgs,
  readJson,
  toCurrentBundle,
  toCurrentParity,
  type PublicationArtifacts,
} from "./shared.ts";

const args = parseArgs(process.argv);
const environment = args["--environment"] ?? "ci-preview";
const inputDir = path.resolve(
  args["--input-dir"] ?? path.join(ROOT, ".artifacts", "runtime-publication", environment),
);

const artifacts: PublicationArtifacts = {
  bundle: readJson(path.join(inputDir, "runtime-publication-bundle.json")),
  parity: readJson(path.join(inputDir, "release-publication-parity.json")),
};
const recordedVerdict = readJson<{
  publishable: boolean;
  refusalReasonRefs: string[];
}>(path.join(inputDir, "publication-authority-verdict.json"));

const verdict = evaluatePublicationArtifacts(artifacts);

if (
  verdict.publishable !== recordedVerdict.publishable ||
  JSON.stringify(verdict.refusalReasonRefs) !== JSON.stringify(recordedVerdict.refusalReasonRefs)
) {
  throw new Error("Runtime publication verdict drifted from the rehearsed artifact.");
}

if (!verdict.publishable) {
  throw new Error(
    `Runtime publication is not publishable for ${environment}: ${verdict.refusalReasonRefs.join(", ")}`,
  );
}

process.stdout.write(
  `${JSON.stringify(
    {
      environment,
      bundleRef: artifacts.bundle.runtimePublicationBundleId,
      parityRef: artifacts.parity.publicationParityRecordId,
      bundleTupleHash: toCurrentBundle(artifacts.bundle).buildProvenanceRef
        ? artifacts.bundle.bundleTupleHash
        : "missing",
      parityTupleHash: toCurrentParity(artifacts.parity).bundleTupleHash,
      publishable: verdict.publishable,
    },
    null,
    2,
  )}\n`,
);
