import { describe, expect, it } from "vitest";
import { buildPhase9RestoreFailoverChaosSliceQuarantineSuite } from "../../tools/test/run_phase9_restore_failover_chaos_slice_quarantine";

describe("468 recovery evidence pack contract", () => {
  it("attests a current recovery pack and writes graph-bound evidence", () => {
    const { fixture, evidence } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.recoveryEvidence.pack.packState).toBe("current");
    expect(fixture.recoveryEvidence.pack.attestationState).toBe("attested");
    expect(fixture.recoveryEvidence.graphWriteback.assuranceLedgerEntry.entryType).toBe(
      "evidence_materialization",
    );
    expect(fixture.recoveryEvidence.graphWriteback.graphEdgeRefs.length).toBeGreaterThan(0);
    expect(evidence.coverage.recoveryPackAdmissibilityAndGraphWriteback).toBe(true);
  });

  it("covers required artifact presentation and governed outbound grants", () => {
    const { fixture, evidence } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.recoveryEvidence.artifactPresentationCases.map((row) => row.artifactType)).toEqual([
      "restore_report",
      "failover_report",
      "chaos_report",
      "recovery_pack_export",
      "dependency_restore_explainer",
      "journey_recovery_proof",
      "backup_manifest_report",
      "runbook_bundle",
      "readiness_snapshot_summary",
    ]);
    for (const artifact of fixture.recoveryEvidence.artifactPresentationCases) {
      expect(artifact.summaryFirst).toBe(true);
      expect(artifact.graphBound).toBe(true);
      expect(artifact.rawObjectStoreUrlExposed).toBe(false);
      expect(artifact.artifactPresentationContractRef).toMatch(/^apc_|^apc_|^APC_/i);
      expect(artifact.outboundNavigationGrantPolicyRef).toMatch(/^ongp_/);
      expect(artifact.reportChannelCovered).toBe(true);
    }
    for (const channel of fixture.recoveryEvidence.reportChannels) {
      expect(channel.result).toBe("delivered");
      expect(channel.rawObjectStoreUrlsAllowed).toBe(false);
      expect(channel.outboundGrantRequired).toBe(true);
      expect(channel.secretMaterialInline).toBe(false);
    }
    expect(evidence.coverage.recoveryArtifactPresentationAndOutboundGrant).toBe(true);
    expect(evidence.noRawArtifactUrls).toBe(true);
    expect(evidence.noPhi).toBe(true);
    expect(evidence.noSecrets).toBe(true);
  });
});
