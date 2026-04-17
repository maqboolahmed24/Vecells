import path from "node:path";
import { parseArgs, readJson, writeJson } from "./shared";

const args = parseArgs(process.argv);
const targetRing = args["--target-ring"] ?? "integration";
const inputDir = path.resolve(
  args["--input-dir"] ?? path.join(".artifacts", "build-provenance", "ci-preview"),
);
const verificationResult = readJson(path.join(inputDir, "verification-result.json"));
const record = readJson(path.join(inputDir, "build-provenance-record.json"));
const allowedTargets = new Set(["integration", "preprod"]);
const decision = {
  promotionDecisionId: `promotion::${record.buildFamilyRef}::${targetRing}`,
  buildProvenanceRecordRef: record.provenanceId,
  targetRing,
  runtimePublicationBundleRef: record.runtimePublicationBundleRef,
  releasePublicationParityRef: record.releasePublicationParityRef,
  decisionState:
    verificationResult.decision.decisionState === "approved" &&
    record.verificationState === "verified" &&
    record.runtimeConsumptionState === "publishable" &&
    allowedTargets.has(targetRing)
      ? "approved"
      : "blocked",
  blockerRefs:
    verificationResult.decision.decisionState === "approved" &&
    record.verificationState === "verified" &&
    record.runtimeConsumptionState === "publishable" &&
    allowedTargets.has(targetRing)
      ? []
      : [
          ...verificationResult.decision.blockerRefs,
          ...(record.verificationState === "verified" ? [] : [record.verificationState]),
          ...(record.runtimeConsumptionState === "publishable"
            ? []
            : [`runtime_consumption_${record.runtimeConsumptionState}`]),
          ...(allowedTargets.has(targetRing) ? [] : ["TARGET_RING_NOT_NONPROD"]),
        ],
};
writeJson(path.join(inputDir, "promotion-decision.json"), decision);
if (decision.decisionState !== "approved") {
  process.stderr.write(`${JSON.stringify(decision, null, 2)}\n`);
  process.exitCode = 1;
}
