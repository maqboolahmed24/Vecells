import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createComplianceExportSyntheticPayload,
  createSecurityComplianceExportRegistryProjection,
  createSecurityReportingSyntheticPayload,
  requiredExportDestinationClasses,
} from "../../packages/domains/operations/src/index";
import {
  buildPhase9AuditAssuranceSyntheticCases,
  runPhase9AuditBreakGlassAssuranceRedactionSuite,
} from "../../tools/test/run_phase9_audit_break_glass_assurance_redaction";

const forbidden =
  /rawDomainEventRef|rawPayload|clinicalNarrative|patientNhs|nhsNumber|rawWebhookUrl|Bearer |access_token|sk_live|BEGIN PRIVATE|https?:\/\/|s3:\/\/|blob:/i;

describe("task 466 artifact presentation and redaction contract", () => {
  it("routes exports through artifact presentation and outbound grant contracts", () => {
    const registry = createSecurityComplianceExportRegistryProjection({
      scenarioState: "normal",
      destinationClass: "audit_investigation_bundle_export",
    });

    expect(registry.noRawExportUrls).toBe(true);
    expect(registry.selectedDestinationClass).toBe("audit_investigation_bundle_export");
    expect(
      requiredExportDestinationClasses.every((destinationClass) =>
        registry.bindings.some((binding) => binding.destinationClass === destinationClass),
      ),
    ).toBe(true);
    for (const binding of registry.bindings) {
      expect(binding.artifactPresentationContractRef).toBe("ArtifactPresentationContract");
      expect(binding.policyBinding.artifactSurfaceFrameRef).toBe("ArtifactSurfaceFrame");
      expect(binding.policyBinding.artifactModeTruthProjectionRef).toBe(
        "ArtifactModeTruthProjection",
      );
      expect(binding.outboundNavigationGrantPolicyRef).toBe("OutboundNavigationGrant");
      expect(binding.policyBinding.rawExportUrlsAllowed).toBe(false);
      expect(binding.policyBinding.unmanagedDownloadAllowed).toBe(false);
    }
  });

  it("keeps synthetic compliance and reporting payloads redacted", () => {
    const registry = createSecurityComplianceExportRegistryProjection({
      scenarioState: "normal",
      destinationClass: "audit_investigation_bundle_export",
    });
    const compliancePayloads = registry.complianceExportBindings.map((binding) =>
      createComplianceExportSyntheticPayload(binding),
    );
    const securityPayloads = registry.securityReportingBindings.map((binding) =>
      createSecurityReportingSyntheticPayload(binding),
    );

    expect(JSON.stringify(compliancePayloads)).not.toMatch(forbidden);
    expect(JSON.stringify(securityPayloads)).not.toMatch(forbidden);
    expect(compliancePayloads.every((payload) => payload.safeSummaryHash.length > 0)).toBe(true);
    expect(securityPayloads.every((payload) => payload.safeSummaryHash.length > 0)).toBe(true);
  });

  it("persists task 466 fixture, evidence, and interface-gap artifacts", () => {
    const root = process.cwd();
    const fixture = buildPhase9AuditAssuranceSyntheticCases();
    const evidence = runPhase9AuditBreakGlassAssuranceRedactionSuite();

    for (const relativePath of [
      "tests/fixtures/466_audit_assurance_synthetic_cases.json",
      "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_466_AUDIT_ASSURANCE_TEST_FIXTURE.json",
    ]) {
      expect(fs.existsSync(path.join(root, relativePath))).toBe(true);
    }

    expect(fixture.artifactPresentation.rawExportUrlsAllowed).toBe(true);
    expect(evidence.artifactPresentation.noRawExportUrls).toBe(true);
    expect(evidence.redaction.redactionLeakageGapClosed).toBe(true);
    expect(evidence.noPhi).toBe(true);
    expect(evidence.noSecrets).toBe(true);
  });
});
