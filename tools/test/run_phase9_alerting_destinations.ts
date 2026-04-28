import fs from "node:fs";
import path from "node:path";
import {
  OPERATIONAL_DESTINATION_GAP_ARTIFACT_REF,
  OPERATIONAL_DESTINATION_SCHEMA_VERSION,
  createOperationalDestinationRegistryFixture,
  createOperationalDestinationRegistryProjection,
} from "../../packages/domains/operations/src/index";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "461_phase9_operational_destination_registry_contract.json",
);
const fixturePath = path.join(fixturesDir, "461_operational_destination_registry_fixtures.json");
const evidencePath = path.join(analysisDir, "461_destination_verification_evidence.json");

const fixture = createOperationalDestinationRegistryFixture();
const normal = fixture.scenarioProjections.normal;
const deliveryFailed = fixture.scenarioProjections.delivery_failed;

const contractArtifact = {
  schemaVersion: OPERATIONAL_DESTINATION_SCHEMA_VERSION,
  visualMode: fixture.visualMode,
  route: "/ops/config/destinations",
  interfaceGapArtifactRef: OPERATIONAL_DESTINATION_GAP_ARTIFACT_REF,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  automationAnchors: fixture.automationAnchors,
  requiredDestinationClasses: fixture.requiredDestinationClasses,
  downstreamReadiness: normal.downstreamReadiness.map((readiness) => ({
    surface: readiness.surface,
    route: readiness.route,
    readinessState: readiness.readinessState,
    destinationCount: readiness.destinationRefs.length,
  })),
  destinationCoverage: {
    classCount: normal.bindings.length,
    allSecretRefsAreVaultRefs: normal.bindings.every((binding) =>
      binding.secretRef.startsWith("vault-ref/"),
    ),
    noInlineSecretMaterial: normal.bindings.every(
      (binding) => binding.secretMaterialInline === false,
    ),
    allHaveRedactionPolicyHash: normal.bindings.every((binding) =>
      binding.redactionPolicyHash.startsWith("sha256:"),
    ),
    allHaveFailClosedPolicy: normal.bindings.every(
      (binding) =>
        binding.failClosedPolicy.staleSecret &&
        binding.failClosedPolicy.staleRedactionPolicy &&
        binding.failClosedPolicy.staleRuntimePublication &&
        binding.failClosedPolicy.missingVerification,
    ),
    fallbackTriggeredOnDeliveryFailure: deliveryFailed.settlements.some(
      (settlement) => settlement.fallbackTriggered === true,
    ),
  },
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        selectedVerificationState: projection.selectedBinding.lastVerification.status,
        readyCount: projection.readyCount,
        blockedCount: projection.blockedCount,
        staleCount: projection.staleCount,
        failedCount: projection.failedCount,
      },
    ]),
  ),
};

const evidence = {
  schemaVersion: "461.phase9.destination-verification-evidence.v1",
  generatedAt: "2026-04-28T09:46:00Z",
  normalVerificationRecords: normal.verificationRecords,
  normalSettlements: normal.settlements,
  fakeReceiverRecords: normal.fakeReceiverRecords,
  replayProjection: createOperationalDestinationRegistryProjection({
    scenarioState: "normal",
    selectedBindingId: normal.selectedBindingId,
  }),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`Phase 9 destination contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 destination fixture: ${path.relative(root, fixturePath)}`);
console.log(`Phase 9 destination evidence: ${path.relative(root, evidencePath)}`);
