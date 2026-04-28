import fs from "node:fs";
import path from "node:path";
import {
  SECURITY_COMPLIANCE_EXPORT_GAP_ARTIFACT_REF,
  SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
  createSecurityComplianceExportRegistryFixture,
  createSecurityComplianceExportRegistryProjection,
  requiredExportArtifactClasses,
  requiredExportDestinationClasses,
} from "../../packages/domains/operations/src/index";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "463_phase9_security_compliance_export_registry_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "463_security_compliance_export_registry_fixtures.json",
);
const evidencePath = path.join(
  analysisDir,
  "463_security_compliance_export_verification_evidence.json",
);

function aggregateSourceReadiness(
  projection: ReturnType<typeof createSecurityComplianceExportRegistryProjection>,
): string {
  if (projection.sourceReadiness.some((source) => source.readinessState === "permission_denied")) {
    return "permission_denied";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "blocked")) {
    return "blocked";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "stale")) {
    return "stale";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "pending")) {
    return "pending";
  }
  return "ready";
}

const fixture = createSecurityComplianceExportRegistryFixture();
const normal = fixture.scenarioProjections.normal;
const staleGraph = fixture.scenarioProjections.stale_graph;
const blockedRedaction = fixture.scenarioProjections.blocked_redaction;

const contractArtifact = {
  schemaVersion: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
  visualMode: fixture.visualMode,
  route: "/ops/config/security-compliance-exports",
  opsRoute: "/ops/assurance",
  recordsRoute: "/ops/governance/records",
  interfaceGapArtifactRef: SECURITY_COMPLIANCE_EXPORT_GAP_ARTIFACT_REF,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  automationAnchors: fixture.automationAnchors,
  requiredExportDestinationClasses,
  requiredExportArtifactClasses,
  destinationCoverage: {
    bindingCount: normal.bindings.length,
    allDestinationClassesCovered: requiredExportDestinationClasses.every((destinationClass) =>
      normal.bindings.some((binding) => binding.destinationClass === destinationClass),
    ),
    allSecretRefsAreVaultRefs: normal.bindings.every((binding) =>
      binding.secretRef.startsWith("vault-ref/"),
    ),
    allSecretMaterialInlineFalse: normal.bindings.every(
      (binding) => binding.secretMaterialInline === false,
    ),
    allArtifactPresentationBound: normal.bindings.every(
      (binding) => binding.artifactPresentationContractRef === "ArtifactPresentationContract",
    ),
    allOutboundGrantBound: normal.bindings.every(
      (binding) => binding.outboundNavigationGrantPolicyRef === "OutboundNavigationGrant",
    ),
    noRawExportUrls: normal.noRawExportUrls === true,
  },
  fakeReceiverCoverage: {
    securityReportingCount: normal.fakeSecurityReportingReceiverRecords.length,
    complianceExportCount: normal.fakeComplianceExportReceiverRecords.length,
    allSecurityPayloadsRedacted: normal.fakeSecurityReportingReceiverRecords.every(
      (record) =>
        !JSON.stringify(record.payload).match(
          /https?:\/\/|Bearer|access_token|clinicalNarrative|inlineSecret/,
        ),
    ),
    allCompliancePayloadsRedacted: normal.fakeComplianceExportReceiverRecords.every(
      (record) =>
        !JSON.stringify(record.payload).match(
          /https?:\/\/|Bearer|access_token|clinicalNarrative|inlineSecret/,
        ),
    ),
  },
  sourceSurfaceCoverage: Object.fromEntries(
    normal.sourceReadiness.map((source) => [source.surface, source.readinessState]),
  ),
  staleGraphInvalidatesReadiness:
    aggregateSourceReadiness(staleGraph) === "stale" &&
    staleGraph.selectedBinding.latestVerificationRecord.reproductionState === "drifted",
  blockedRedactionInvalidatesDelivery:
    aggregateSourceReadiness(blockedRedaction) === "blocked" &&
    blockedRedaction.selectedBinding.latestDeliverySettlement.result === "blocked_redaction",
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        selectedVerificationState: projection.selectedBinding.latestVerificationRecord.status,
        selectedDeliveryResult: projection.selectedBinding.latestDeliverySettlement.result,
        sourceReadinessState: aggregateSourceReadiness(projection),
        noRawExportUrls: projection.noRawExportUrls,
      },
    ]),
  ),
};

const evidence = {
  schemaVersion: "463.phase9.security-compliance-export-evidence.v1",
  generatedAt: "2026-04-28T11:45:00Z",
  normalVerificationRecords: normal.verificationRecords,
  normalSettlements: normal.deliverySettlements,
  reportabilityHandoffRecords: normal.reportabilityHandoffRecords,
  artifactFixtures: normal.artifactFixtures,
  fakeSecurityReportingReceiverRecords: normal.fakeSecurityReportingReceiverRecords,
  fakeComplianceExportReceiverRecords: normal.fakeComplianceExportReceiverRecords,
  replayProjection: createSecurityComplianceExportRegistryProjection({
    scenarioState: "normal",
    destinationClass: normal.selectedDestinationClass,
  }),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`Phase 9 security compliance export contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 security compliance export fixture: ${path.relative(root, fixturePath)}`);
console.log(`Phase 9 security compliance export evidence: ${path.relative(root, evidencePath)}`);
