import { describe, expect, it } from "vitest";
import { build477FinalSignoffArtifacts } from "../../tools/assurance/prepare_477_final_signoffs";

describe("Task 477 final signoff register", () => {
  it("binds every required authority to the exact release tuple and evidence hash", () => {
    const { finalSignoffRegister: register } = build477FinalSignoffArtifacts();

    expect(register.recordType).toBe("FinalLaunchSignoffRegister");
    expect(register.scenarioState).toBe("ready_with_constraints");
    expect(register.launchDecision.signoffBlockerCount).toBe(0);
    expect(register.signoffReviewPermitted).toBe(true);
    expect(register.launchApprovalPermitted).toBe(false);
    expect(register.launchDecision.backendCommandSettlementState).toBe("pending");

    expect(register.authorities.map((authority) => authority.laneId).sort()).toEqual([
      "accessibility_usability",
      "clinical_safety",
      "privacy_records",
      "regulatory_dtac",
      "security",
    ]);

    for (const authority of register.authorities) {
      expect(authority.releaseBinding.releaseCandidateRef).toBe(
        register.releaseBinding.releaseCandidateRef,
      );
      expect(authority.releaseBinding.runtimePublicationBundleRef).toBe(
        register.releaseBinding.runtimePublicationBundleRef,
      );
      expect(authority.releaseBinding.waveManifestRef).toBe(register.releaseBinding.waveManifestRef);
      expect(authority.authorityTupleHash).toContain(authority.authorityId);
      expect(authority.wormAuditRef).toContain(authority.authorityId);
      expect(authority.signerDisplayName).not.toMatch(/@|token|secret|Bearer/i);
    }

    for (const binding of register.evidenceBindings) {
      expect(binding.releaseBinding.releaseCandidateRef).toBe(
        register.releaseBinding.releaseCandidateRef,
      );
      expect(binding.evidenceHash).toContain(binding.evidenceBindingId);
      expect(binding.recordHash).toHaveLength(64);
    }
  });

  it("covers all typed records required by the prompt", () => {
    const { finalSignoffRegister: register } = build477FinalSignoffArtifacts();
    expect(register.typedRecordCoverage).toEqual(
      expect.arrayContaining([
        "FinalLaunchSignoffRegister",
        "SignoffAuthority",
        "SignoffEvidenceBinding",
        "SignoffException",
        "ClinicalSafetyCaseDelta",
        "HazardLogDeltaBinding",
        "DeploymentSafetyAcceptance",
        "AssistiveClinicalSafetyApproval",
        "PrivacyDPIAClosureRecord",
        "DataProtectionImpactException",
        "RecordsRetentionApproval",
        "LegalHoldReadinessProof",
        "SecurityAssuranceEvidenceRow",
        "PenTestClosureBinding",
        "VulnerabilityExceptionWaiver",
        "SupplyChainAttestation",
      ]),
    );
  });
});
