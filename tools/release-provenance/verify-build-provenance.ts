import path from "node:path";
import { FileSecretStoreBackend } from "../../packages/runtime-secrets/src/index.ts";
import { stableDigest } from "../../packages/release-controls/src/build-provenance.ts";
import {
  applySupplyChainVerificationResult,
  createRuntimeBindingProof,
  verifySupplyChainProvenance,
} from "../../packages/release-controls/src/supply-chain-provenance.ts";
import { parseArgs, readJson, writeJson } from "./shared";

const args = parseArgs(process.argv);
const environment = (args["--environment"] ?? "ci-preview") as
  | "local"
  | "ci-preview"
  | "integration"
  | "preprod"
  | "production";
const inputDir = path.resolve(
  args["--input-dir"] ?? path.join(".artifacts", "build-provenance", environment),
);
const record = readJson(path.join(inputDir, "build-provenance-record.json"));
const gateEvidence = readJson(path.join(inputDir, "gate-evidence.json"));
const dependencyPolicyVerdict = readJson(path.join(inputDir, "dependency-policy-verdict.json"));
const sbom = readJson(path.join(inputDir, "sbom.cdx.json"));
const runtimeBindingProof = readJson(path.join(inputDir, "runtime-binding-proof.json"));
const attestations = readJson(path.join(inputDir, "attestation-envelopes.json"));
const backend = new FileSecretStoreBackend({
  environmentRing: environment,
  env: {
    VECELLS_SECRET_STATE_DIR: path.join(inputDir, "secret-store"),
    VECELLS_KMS_MASTER_KEY_PATH: path.join(inputDir, "secret-store", "master-key.json"),
  },
});
const signingKey = backend.loadSecret({
  secretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
  actorRef: "ci_release_attestation",
}).value;
const verification = verifySupplyChainProvenance({
  record,
  signingKey,
  attestations,
  dependencyPolicyVerdict,
  gateEvidence,
  expectedRuntimeBinding: createRuntimeBindingProof(runtimeBindingProof),
  expectedSbomDigest: stableDigest(sbom),
  verifiedAt: new Date().toISOString(),
  verifiedBy: "svc_release_supply_chain_verifier",
});
const finalizedRecord = applySupplyChainVerificationResult({
  record,
  verification,
  verifiedAt: new Date().toISOString(),
  verifiedBy: "svc_release_supply_chain_verifier",
});
const decision = {
  decisionState: verification.decisionState,
  publicationEligibilityState: verification.publicationEligibilityState,
  runtimeConsumptionState: verification.runtimeConsumptionState,
  blockerRefs: verification.blockerRefs,
  warningRefs: verification.warningRefs,
};
writeJson(path.join(inputDir, "build-provenance-record.json"), finalizedRecord);
writeJson(path.join(inputDir, "verification-result.json"), {
  verification,
  decision,
});
writeJson(path.join(inputDir, "supply-chain-audit-trail.json"), verification.auditTrail);
writeJson(path.join(inputDir, "sbom-digest.json"), {
  sbomDigest: record.sbomDigest,
  actualDigest: stableDigest(sbom),
  componentCount: Array.isArray((sbom as { components?: unknown[] }).components)
    ? (sbom as { components?: unknown[] }).components?.length ?? 0
    : 0,
});
if (verification.decisionState !== "approved" || verification.runtimeConsumptionState !== "publishable") {
  process.stderr.write(`${JSON.stringify({ verification, decision }, null, 2)}\n`);
  process.exitCode = 1;
}
