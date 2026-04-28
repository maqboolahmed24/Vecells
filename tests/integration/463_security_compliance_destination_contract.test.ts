import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
  createComplianceExportSyntheticPayload,
  createGovernedExportDestinationBinding,
  createSecurityComplianceExportRegistryProjection,
  createSecurityReportingSyntheticPayload,
  requiredExportArtifactClasses,
  requiredExportDestinationClasses,
  secretRefForExportDestination,
  upsertGovernedExportDestinationBinding,
  verifyGovernedExportDestinationBinding,
} from "../../packages/domains/operations/src/index";

describe("task 463 security compliance export destination registry", () => {
  it("covers every required destination class with vault refs and governed artifact handoff", () => {
    const projection = createSecurityComplianceExportRegistryProjection();
    expect(projection.schemaVersion).toBe(SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION);
    expect(projection.bindings.map((binding) => binding.destinationClass)).toEqual(
      requiredExportDestinationClasses,
    );
    expect(projection.bindings).toHaveLength(12);
    for (const binding of projection.bindings) {
      expect(binding.secretMaterialInline).toBe(false);
      expect(binding.secretRef).toMatch(/^vault-ref\//);
      expect(binding.artifactPresentationContractRef).toBe("ArtifactPresentationContract");
      expect(binding.outboundNavigationGrantPolicyRef).toBe("OutboundNavigationGrant");
      expect(binding.policyBinding.rawExportUrlsAllowed).toBe(false);
      expect(binding.policyBinding.unmanagedDownloadAllowed).toBe(false);
      expect(binding.latestDeliverySettlement.outboundNavigationGrantRef).toMatch(
        /^outbound-navigation-grant:/,
      );
      expect(binding.latestVerificationRecord.exportManifestHash).toMatch(/^sha256:/);
      expect(binding.latestVerificationRecord.redactionPolicyHash).toMatch(/^sha256:/);
      expect(binding.latestVerificationRecord.reproductionHash).toMatch(/^sha256:/);
    }
  });

  it("covers framework and artifact classes needed for reportability, assurance, records, recovery, and conformance", () => {
    const projection = createSecurityComplianceExportRegistryProjection();
    for (const artifactClass of [
      "reportable_incident_handoff",
      "internal_security_incident_report",
      "near_miss_learning_summary",
      "dspt_operational_evidence_pack",
      "dtac_evidence_refresh_pack",
      "dcb0129_manufacturer_safety_pack_delta",
      "dcb0160_deployment_handoff_pack",
      "nhs_app_operational_pack",
      "audit_investigation_bundle",
      "archive_manifest",
      "deletion_certificate",
      "recovery_evidence_pack",
      "cross_phase_conformance_scorecard",
    ]) {
      expect(requiredExportArtifactClasses).toContain(artifactClass);
    }
    for (const frameworkCode of [
      "DSPT",
      "DTAC",
      "DCB0129",
      "DCB0160",
      "NHS_APP_CHANNEL",
      "AUDIT",
      "RECORDS",
      "RESILIENCE",
      "CONFORMANCE",
      "LOCAL_TENANT",
    ]) {
      expect(projection.bindings.some((binding) => binding.frameworkCode === frameworkCode)).toBe(
        true,
      );
    }
    expect(projection.artifactFixtures.map((fixture) => fixture.artifactClass)).toEqual([
      "dspt_operational_evidence_pack",
      "audit_investigation_bundle",
      "deletion_certificate",
      "archive_manifest",
      "recovery_evidence_pack",
      "cross_phase_conformance_scorecard",
    ]);
  });

  it("upserts bindings idempotently with tenant and environment isolation", () => {
    const projection = createSecurityComplianceExportRegistryProjection();
    const candidate = createGovernedExportDestinationBinding(
      {
        destinationClass: "dspt_operational_evidence_pack_export",
        destinationKind: "compliance_export",
        label: "DSPT operational evidence pack export",
        frameworkCode: "DSPT",
        artifactClassesAllowed: ["dspt_operational_evidence_pack"],
        sourceSurfaceRefs: ["assurance", "conformance"],
        audience: "DSPT assurance owner",
        purposeOfUse: "Export DSPT operational evidence.",
        allowedHandoffMode: "governed_secure_delivery",
        retentionClass: "compliance_export_evidence_8y",
        legalHoldBehavior: "preserve_on_hold_or_inquiry",
      },
      { tenantRef: projection.tenantRef, environmentRef: projection.environmentRef, selected: true },
    );
    const replay = upsertGovernedExportDestinationBinding(projection.bindings, candidate);
    expect(replay).toHaveLength(projection.bindings.length);
    expect(replay.filter((binding) => binding.destinationClass === candidate.destinationClass)).toHaveLength(
      1,
    );

    const otherTenant = createSecurityComplianceExportRegistryProjection({
      tenantRef: "tenant-assurance-lab",
      environmentRef: "preview",
    });
    expect(otherTenant.bindings[0]?.secretRef).not.toBe(projection.bindings[0]?.secretRef);
    expect(
      secretRefForExportDestination(
        "reportable_data_security_incident_handoff",
        "tenant-assurance-lab",
        "preview",
      ),
    ).toMatch(/^vault-ref\/tenant-assurance-lab\/preview/);
  });

  it("verifies and settles only redacted synthetic payloads", () => {
    const projection = createSecurityComplianceExportRegistryProjection();
    const verified = verifyGovernedExportDestinationBinding(projection.selectedBinding);
    expect(verified.verification.status).toBe("verified");
    expect(verified.settlement.result).toBe("delivered");

    const securityPayload = createSecurityReportingSyntheticPayload(
      projection.securityReportingBindings[0]!,
    );
    const compliancePayload = createComplianceExportSyntheticPayload(
      projection.complianceExportBindings[0]!,
    );
    for (const payload of [securityPayload, compliancePayload]) {
      const serialized = JSON.stringify(payload);
      expect(serialized).not.toMatch(/https?:\/\//);
      expect(serialized).not.toMatch(/Bearer|access_token|credential|inlineSecret|clinicalNarrative/);
      expect(serialized).toMatch(/safeSummaryHash/);
    }
  });

  it("fails closed for missing, stale, blocked, denied, and delivery failure fixtures", () => {
    const expectations = [
      ["missing_secret", "missing_secret", "missing_destination", "blocked"],
      ["missing_destination", "missing_destination", "missing_destination", "blocked"],
      ["denied_scope", "denied_scope", "denied_scope", "blocked"],
      ["stale_graph", "stale_graph", "stale", "stale"],
      ["stale_redaction_policy", "stale_redaction_policy", "stale", "stale"],
      ["blocked_graph", "blocked_graph", "blocked_graph", "blocked"],
      ["blocked_redaction", "blocked_redaction", "blocked_redaction", "blocked"],
      ["delivery_failed", "failed", "failed", "blocked"],
      ["permission_denied", "permission_denied", "permission_denied", "permission_denied"],
      ["reportability_pending", "reportability_pending", "pending_reportability", "pending"],
    ] as const;
    for (const [scenarioState, verificationState, deliveryResult, sourceReadinessState] of expectations) {
      const projection = createSecurityComplianceExportRegistryProjection({ scenarioState });
      expect(projection.selectedBinding.latestVerificationRecord.status).toBe(verificationState);
      expect(projection.selectedBinding.latestDeliverySettlement.result).toBe(deliveryResult);
      expect(projection.sourceReadiness.some((source) => source.readinessState === sourceReadinessState))
        .toBe(true);
    }
  });

  it("keeps schema, gap, and generated contract artifacts available", () => {
    const root = process.cwd();
    expect(
      fs.existsSync(
        path.join(root, "data/contracts/463_security_compliance_export_destination.schema.json"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_463_SECURITY_COMPLIANCE_EXPORT_DESTINATIONS.json",
        ),
      ),
    ).toBe(true);
  });
});
