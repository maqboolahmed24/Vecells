import { describe, expect, it } from "vitest";
import {
  createBuildProvenanceSimulationHarness,
  evaluateArtifactPublication,
  signBuildProvenanceRecord,
  verifyBuildProvenanceRecord,
  type ArtifactQuarantineRule,
  type DependencyPolicyVerdictRecord,
  type BuildGateEvidenceRecord,
} from "../src/build-provenance.ts";

const dependencyPolicyVerdict: DependencyPolicyVerdictRecord = {
  dependencyPolicyVerdictId: "dep-policy::test",
  policyRef: "dependency_policy_091_foundation_v1",
  decisionState: "passed",
  blockedReasonRefs: [],
  watchlistHash: "hash",
  evaluatedAt: "2026-04-12T00:00:00+00:00",
};

const gateEvidence: BuildGateEvidenceRecord[] = [
  {
    gateEvidenceRef: "gate::package",
    gateRef: "build_package",
    gateLabel: "build",
    state: "passed",
    evidenceDigest: "gatehash",
  },
];

const quarantineRules: ArtifactQuarantineRule[] = [
  {
    ruleRef: "qr_signature_invalid",
    triggerRef: "SIGNATURE_MISMATCH",
    artifactState: "quarantined",
    runtimeConsumptionState: "quarantined",
    publishDecisionState: "quarantined",
    supersessionAllowed: false,
    operatorAction: "quarantine",
  },
  {
    ruleRef: "qr_revoked",
    triggerRef: "PROVENANCE_REVOKED",
    artifactState: "revoked",
    runtimeConsumptionState: "revoked",
    publishDecisionState: "revoked",
    supersessionAllowed: false,
    operatorAction: "revoke",
  },
];

describe("build provenance controls", () => {
  it("signs and verifies a record round-trip", () => {
    const harness = createBuildProvenanceSimulationHarness();
    expect(harness.verification.verified).toBe(true);
    expect(harness.publishDecision.decisionState).toBe("approved");
  });

  it("quarantines a tampered signature", () => {
    const harness = createBuildProvenanceSimulationHarness();
    const tampered = { ...harness.record, signature: `${harness.record.signature}tampered` };
    const verification = verifyBuildProvenanceRecord({
      record: tampered,
      signingKey: "mock-safe-provenance-key",
      dependencyPolicyVerdict,
      gateEvidence,
    });
    const decision = evaluateArtifactPublication({ verification, quarantineRules });
    expect(verification.issues[0]?.code).toBe("SIGNATURE_MISMATCH");
    expect(decision.decisionState).toBe("quarantined");
  });

  it("revokes build publication when provenance is revoked", () => {
    const harness = createBuildProvenanceSimulationHarness();
    const revokedRecord = signBuildProvenanceRecord({
      signingKey: "mock-safe-provenance-key",
      record: {
        ...harness.record,
        provenanceState: "revoked",
        artifactState: "revoked",
        runtimeConsumptionState: "revoked",
        revokedAt: "2026-04-12T01:00:00+00:00",
        revocationReasonRef: "PROVENANCE_REVOKED",
      },
    });
    const verification = verifyBuildProvenanceRecord({
      record: revokedRecord,
      signingKey: "mock-safe-provenance-key",
      dependencyPolicyVerdict,
      gateEvidence,
    });
    const decision = evaluateArtifactPublication({ verification, quarantineRules });
    expect(decision.decisionState).toBe("revoked");
  });
});
