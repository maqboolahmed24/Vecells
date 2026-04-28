import { describe, expect, it } from "vitest";
import {
  applySupplyChainVerificationResult,
  createAttestationEnvelopeId,
  createRuntimeBindingProof,
  createSupplyChainVerificationSimulationHarness,
  issueSupplyChainAttestation,
  revokeSupplyChainProvenanceRecord,
  signSupplyChainProvenanceRecord,
  supersedeSupplyChainProvenanceRecord,
  verifySupplyChainProvenance,
  type SupplyChainAttestationEnvelope,
  type SupplyChainProvenanceRecord,
} from "../src/supply-chain-provenance.ts";

function buildAttestations(
  record: SupplyChainProvenanceRecord,
  signingKey: string,
): SupplyChainAttestationEnvelope[] {
  return [
    issueSupplyChainAttestation({
      record,
      attestationType: "build_provenance",
      signingKey,
      attestedAt: record.signedAt,
    }),
    issueSupplyChainAttestation({
      record,
      attestationType: "runtime_binding",
      signingKey,
      attestedAt: record.signedAt,
    }),
    issueSupplyChainAttestation({
      record,
      attestationType: "sbom_binding",
      signingKey,
      attestedAt: record.signedAt,
    }),
  ];
}

describe("supply-chain provenance controls", () => {
  it("verifies the canonical simulation harness", () => {
    const harness = createSupplyChainVerificationSimulationHarness();
    expect(harness.verification.verified).toBe(true);
    expect(harness.record.verificationState).toBe("verified");
    expect(harness.record.runtimeConsumptionState).toBe("publishable");
    expect(harness.attestations).toHaveLength(3);
  });

  it("quarantines attestation tampering", () => {
    const signingKey = "mock-safe-supply-chain-key";
    const harness = createSupplyChainVerificationSimulationHarness();
    const tampered = [
      {
        ...harness.attestations[0],
        signature: `${harness.attestations[0].signature}tampered`,
      },
      ...harness.attestations.slice(1),
    ];
    const verification = verifySupplyChainProvenance({
      record: harness.record,
      signingKey,
      attestations: tampered,
      dependencyPolicyVerdict: {
        dependencyPolicyVerdictId: "dep-policy::test",
        policyRef: "dependency_policy_091_foundation_v1",
        decisionState: "passed",
        blockedReasonRefs: [],
        watchlistHash: "watch",
        evaluatedAt: harness.record.signedAt,
      },
      gateEvidence: [
        {
          gateEvidenceRef: "gate::build",
          gateRef: "build_package",
          gateLabel: "Build package",
          state: "passed",
          evidenceDigest: "gate-build",
        },
      ],
      expectedRuntimeBinding: harness.record.runtimeBindingProof,
      expectedSbomDigest: harness.record.sbomDigest,
      verifiedAt: harness.record.signedAt,
      verifiedBy: "svc_release_supply_chain_verifier",
    });
    expect(verification.decisionState).toBe("quarantined");
    expect(verification.blockerRefs).toContain("ATTESTATION_SIGNATURE_MISMATCH");
    expect(verification.runtimeConsumptionState).toBe("blocked");
  });

  it("blocks runtime consumption on binding drift", () => {
    const signingKey = "mock-safe-supply-chain-key";
    const harness = createSupplyChainVerificationSimulationHarness();
    const driftedBinding = createRuntimeBindingProof({
      ...harness.record.runtimeBindingProof,
      targetGatewaySurfaceRefs: ["gws_patient_home"],
    });
    const verification = verifySupplyChainProvenance({
      record: harness.record,
      signingKey,
      attestations: harness.attestations,
      dependencyPolicyVerdict: {
        dependencyPolicyVerdictId: "dep-policy::test",
        policyRef: "dependency_policy_091_foundation_v1",
        decisionState: "passed",
        blockedReasonRefs: [],
        watchlistHash: "watch",
        evaluatedAt: harness.record.signedAt,
      },
      gateEvidence: [
        {
          gateEvidenceRef: "gate::build",
          gateRef: "build_package",
          gateLabel: "Build package",
          state: "passed",
          evidenceDigest: "gate-build",
        },
      ],
      expectedRuntimeBinding: driftedBinding,
      expectedSbomDigest: harness.record.sbomDigest,
      verifiedAt: harness.record.signedAt,
      verifiedBy: "svc_release_supply_chain_verifier",
    });
    expect(verification.decisionState).toBe("quarantined");
    expect(verification.blockerRefs).toContain("RUNTIME_BINDING_DRIFT");
    expect(verification.runtimeConsumptionState).toBe("blocked");
  });

  it("preserves explicit revocation and supersession transitions", () => {
    const harness = createSupplyChainVerificationSimulationHarness();
    const revoked = revokeSupplyChainProvenanceRecord({
      record: harness.record,
      reasonRef: "ATTESTATION_REVOKED",
      revokedAt: "2026-04-13T05:00:00+00:00",
    });
    const superseded = supersedeSupplyChainProvenanceRecord({
      record: harness.record,
      supersededByProvenanceRef: "prov::fresh::v2",
      supersededAt: "2026-04-13T06:00:00+00:00",
    });
    expect(revoked.verificationState).toBe("revoked");
    expect(revoked.runtimeConsumptionState).toBe("withdrawn");
    expect(superseded.verificationState).toBe("superseded");
    expect(superseded.runtimeConsumptionState).toBe("withdrawn");
  });

  it("requires a fresh record to recover from quarantine", () => {
    const signingKey = "mock-safe-supply-chain-key";
    const harness = createSupplyChainVerificationSimulationHarness();
    const quarantined = {
      ...harness.record,
      verificationState: "quarantined" as const,
      runtimeConsumptionState: "blocked" as const,
      verificationIssues: ["ATTESTATION_SIGNATURE_MISMATCH"],
      quarantineReasonRefs: ["ATTESTATION_SIGNATURE_MISMATCH"],
    };
    const cleanUnsigned = {
      ...quarantined,
      provenanceId: "prov::simulated::fresh",
      buildProvenanceRecordId: "prov::simulated::fresh",
      verificationState: "pending" as const,
      runtimeConsumptionState: "blocked" as const,
      verificationIssues: [],
      quarantineReasonRefs: [],
      revokedAt: null,
      revocationReasonRef: null,
      supersededByProvenanceRef: null,
      supersededAt: null,
      attestationEnvelopeRefs: [
        createAttestationEnvelopeId({
          provenanceId: "prov::simulated::fresh",
          attestationType: "build_provenance",
          buildInvocationRef: quarantined.buildInvocationRef,
        }),
        createAttestationEnvelopeId({
          provenanceId: "prov::simulated::fresh",
          attestationType: "runtime_binding",
          buildInvocationRef: quarantined.buildInvocationRef,
        }),
        createAttestationEnvelopeId({
          provenanceId: "prov::simulated::fresh",
          attestationType: "sbom_binding",
          buildInvocationRef: quarantined.buildInvocationRef,
        }),
      ],
    };
    const freshRecord = signSupplyChainProvenanceRecord({
      record: cleanUnsigned,
      signingKey,
    });
    const freshAttestations = buildAttestations(freshRecord, signingKey);
    const verification = verifySupplyChainProvenance({
      record: freshRecord,
      signingKey,
      attestations: freshAttestations,
      dependencyPolicyVerdict: {
        dependencyPolicyVerdictId: "dep-policy::test",
        policyRef: "dependency_policy_091_foundation_v1",
        decisionState: "passed",
        blockedReasonRefs: [],
        watchlistHash: "watch",
        evaluatedAt: freshRecord.signedAt,
      },
      gateEvidence: [
        {
          gateEvidenceRef: "gate::build",
          gateRef: "build_package",
          gateLabel: "Build package",
          state: "passed",
          evidenceDigest: "gate-build",
        },
      ],
      expectedRuntimeBinding: freshRecord.runtimeBindingProof,
      expectedSbomDigest: freshRecord.sbomDigest,
      verifiedAt: freshRecord.signedAt,
      verifiedBy: "svc_release_supply_chain_verifier",
    });
    expect(() =>
      applySupplyChainVerificationResult({
        record: quarantined,
        verification,
        verifiedAt: freshRecord.signedAt,
        verifiedBy: "svc_release_supply_chain_verifier",
      }),
    ).toThrow(/fresh record is required/i);
    const refreshed = applySupplyChainVerificationResult({
      record: freshRecord,
      verification,
      verifiedAt: freshRecord.signedAt,
      verifiedBy: "svc_release_supply_chain_verifier",
    });
    expect(refreshed.provenanceId).toBe("prov::simulated::fresh");
    expect(refreshed.verificationState).toBe("verified");
  });
});
