import fs from "node:fs";
import path from "node:path";
import {
  SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
  createComplianceExportSyntheticPayload,
  createSecurityComplianceExportRegistryProjection,
  createSecurityReportingSyntheticPayload,
  verifyGovernedExportDestinationBinding,
} from "../../packages/domains/operations/src/index";

export interface SecurityComplianceExportAutomationResult {
  readonly schemaVersion: typeof SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION;
  readonly runId: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly route: "/ops/config/security-compliance-exports";
  readonly verifiedBindingCount: number;
  readonly securityReportingPayloadCount: number;
  readonly complianceExportPayloadCount: number;
  readonly sourceReadinessState: string;
  readonly noRawExportUrls: true;
  readonly evidencePath: string;
}

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

export function configureSecurityReportingAndComplianceExports(
  options: {
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly outputDir?: string;
  } = {},
): SecurityComplianceExportAutomationResult {
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const projection = createSecurityComplianceExportRegistryProjection({
    tenantRef,
    environmentRef,
    scenarioState: "normal",
  });
  const verifiedBindings = projection.bindings.map((binding) =>
    verifyGovernedExportDestinationBinding(binding),
  );
  const securityReportingPayloads = projection.securityReportingBindings.map((binding) =>
    createSecurityReportingSyntheticPayload(binding),
  );
  const complianceExportPayloads = projection.complianceExportBindings.map((binding) =>
    createComplianceExportSyntheticPayload(binding),
  );
  const evidence = {
    schemaVersion: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
    generatedAt: "2026-04-28T11:45:00Z",
    route: "/ops/config/security-compliance-exports",
    tenantRef,
    environmentRef,
    registryHash: projection.registryHash,
    sourceReadinessState: aggregateSourceReadiness(projection),
    sourceReadiness: projection.sourceReadiness,
    verificationRecords: verifiedBindings.map((record) => record.verification),
    deliverySettlements: verifiedBindings.map((record) => record.settlement),
    reportabilityHandoffRecords: projection.reportabilityHandoffRecords,
    securityReportingPayloads,
    complianceExportPayloads,
    fakeSecurityReportingReceiverRecords: projection.fakeSecurityReportingReceiverRecords,
    fakeComplianceExportReceiverRecords: projection.fakeComplianceExportReceiverRecords,
    artifactFixtures: projection.artifactFixtures,
    noRawExportUrls: projection.noRawExportUrls,
  };
  const outputDir =
    options.outputDir ??
    path.join(process.cwd(), ".artifacts", "security-compliance-exports-463");
  fs.mkdirSync(outputDir, { recursive: true });
  const evidencePath = path.join(outputDir, "security-compliance-export-automation.json");
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return {
    schemaVersion: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
    runId: "automation-463-security-compliance-exports",
    tenantRef,
    environmentRef,
    route: "/ops/config/security-compliance-exports",
    verifiedBindingCount: verifiedBindings.length,
    securityReportingPayloadCount: securityReportingPayloads.length,
    complianceExportPayloadCount: complianceExportPayloads.length,
    sourceReadinessState: aggregateSourceReadiness(projection),
    noRawExportUrls: true,
    evidencePath,
  };
}

if (process.argv.includes("--run")) {
  const result = configureSecurityReportingAndComplianceExports();
  console.log(JSON.stringify(result, null, 2));
}
