import { describe, expect, it } from "vitest";
import {
  assertReleaseTrustFreezeVerdictPrecedence,
  createReleaseTrustFreezeAuthorityService,
  createReleaseTrustFreezeStore,
} from "../src/index.ts";

async function seedAuthority(seed: string) {
  const repositories = createReleaseTrustFreezeStore();
  const authority = createReleaseTrustFreezeAuthorityService(repositories);
  const review = await authority.recordGovernanceReviewPackage({
    scopeTupleHash: `scope_hash_${seed}`,
    baselineTupleHash: `baseline_hash_${seed}`,
    compiledPolicyBundleRef: `policy_bundle_${seed}`,
    releaseWatchTupleRef: `watch_tuple_${seed}`,
    watchTupleHash: `watch_hash_${seed}`,
    compilationTupleHash: `compilation_hash_${seed}`,
    approvalTupleHash: `approval_hash_${seed}`,
    standardsWatchlistHash: `watchlist_hash_${seed}`,
    settlementLineageRef: `settlement_lineage_${seed}`,
    reviewPackageHash: `review_hash_${seed}`,
    packageState: "current",
    assembledAt: "2026-04-12T21:10:00Z",
  });
  const watchlist = await authority.recordStandardsDependencyWatchlist({
    candidateBundleHash: `candidate_hash_${seed}`,
    liveBundleHash: `live_hash_${seed}`,
    environmentRef: "staging",
    tenantScopeRef: `tenant_${seed}`,
    scopeTupleHash: review.scopeTupleHash,
    reviewPackageHash: review.reviewPackageHash,
    blockingFindingRefs: [],
    advisoryFindingRefs: [],
    compileGateState: "pass",
    promotionGateState: "pass",
    watchlistState: "current",
    watchlistHash: review.standardsWatchlistHash,
    generatedAt: "2026-04-12T21:11:00Z",
  });
  const freeze = await authority.approveReleaseFreeze({
    releaseCandidateRef: `release_candidate_${seed}`,
    governanceReviewPackageRef: review.governanceReviewPackageId,
    standardsDependencyWatchlistRef: watchlist.standardsDependencyWatchlistId,
    compiledPolicyBundleRef: review.compiledPolicyBundleRef,
    baselineTupleHash: review.baselineTupleHash,
    scopeTupleHash: review.scopeTupleHash,
    compilationTupleHash: review.compilationTupleHash,
    approvalTupleHash: review.approvalTupleHash,
    reviewPackageHash: review.reviewPackageHash,
    standardsWatchlistHash: watchlist.watchlistHash,
    artifactDigestSetHash: `artifact_digest_${seed}`,
    surfaceSchemaSetHash: `surface_schema_${seed}`,
    bridgeCapabilitySetHash: `bridge_capability_${seed}`,
    migrationPlanHash: `migration_plan_${seed}`,
    compatibilityEvidenceRef: `compatibility_${seed}`,
    approvedBy: `approver_${seed}`,
    approvedAt: "2026-04-12T21:12:00Z",
    freezeState: "active",
  });
  const channel = await authority.recordChannelFreeze({
    channelFamily: "browser_web",
    manifestVersionRef: `manifest_${seed}`,
    releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
    minimumBridgeCapabilitiesRef: `bridge_${seed}`,
    channelState: "monitoring",
    effectiveAt: "2026-04-12T21:12:30Z",
    updatedAt: "2026-04-12T21:12:30Z",
  });

  return { authority, repositories, review, watchlist, freeze, channel };
}

describe("release trust freeze backbone", () => {
  it("publishes live authority only when freeze, parity, channels, and trust are all exact", async () => {
    const { authority, freeze, channel } = await seedAuthority("live");

    const verdict = await authority.publishReleaseTrustFreezeVerdict({
      audienceSurface: "patient-web",
      routeFamilyRef: "rf_patient_home",
      releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
      releaseWatchTupleRef: "watch_tuple_live",
      releaseWatchTupleState: "active",
      waveGuardrailSnapshotRef: "guardrail_live",
      waveGuardrailState: "green",
      runtimePublicationBundleRef: "runtime_bundle_live",
      runtimePublicationState: "published",
      releasePublicationParityRef: "parity_live",
      releasePublicationParityState: "exact",
      requiredChannelFreezeRefs: [channel.channelFreezeId],
      requiredAssuranceSlices: [
        {
          sliceTrustId: "slice_live_a",
          sliceNamespace: "patient.surface",
          trustState: "trusted",
          completenessState: "complete",
          trustLowerBound: 0.93,
          hardBlockState: false,
          blockingProducerRefs: [],
          blockingNamespaceRefs: [],
          evaluationModelRef: "assurance_slice_trust_model::par_075_v1",
          reviewDueAt: "2026-04-12T22:00:00Z",
          updatedAt: "2026-04-12T21:20:00Z",
        },
      ],
      provenanceConsumptionState: "publishable",
      governingRecoveryDispositionRef: "recovery_live",
      evaluatedAt: "2026-04-12T21:21:00Z",
    });

    expect(verdict.snapshot.surfaceAuthorityState).toBe("live");
    expect(verdict.snapshot.calmTruthState).toBe("allowed");
    expect(verdict.snapshot.mutationAuthorityState).toBe("enabled");
    expect(verdict.blockers).toHaveLength(0);
  });

  it("downgrades to diagnostic_only when required slices are degraded", async () => {
    const { authority, freeze, channel } = await seedAuthority("diagnostic");

    const verdict = await authority.publishReleaseTrustFreezeVerdict({
      audienceSurface: "ops-console",
      routeFamilyRef: "rf_ops_overview",
      releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
      releaseWatchTupleRef: "watch_tuple_diagnostic",
      releaseWatchTupleState: "active",
      waveGuardrailSnapshotRef: "guardrail_diagnostic",
      waveGuardrailState: "green",
      runtimePublicationBundleRef: "runtime_bundle_diagnostic",
      runtimePublicationState: "published",
      releasePublicationParityRef: "parity_diagnostic",
      releasePublicationParityState: "exact",
      requiredChannelFreezeRefs: [channel.channelFreezeId],
      requiredAssuranceSlices: [
        {
          sliceTrustId: "slice_diag_a",
          sliceNamespace: "ops.surface",
          trustState: "degraded",
          completenessState: "partial",
          trustLowerBound: 0.61,
          hardBlockState: false,
          blockingProducerRefs: [],
          blockingNamespaceRefs: [],
          evaluationModelRef: "assurance_slice_trust_model::par_075_v1",
          reviewDueAt: "2026-04-12T22:00:00Z",
          updatedAt: "2026-04-12T21:20:00Z",
        },
      ],
      provenanceConsumptionState: "publishable",
      governingRecoveryDispositionRef: "recovery_diag",
      evaluatedAt: "2026-04-12T21:21:00Z",
    });

    expect(verdict.snapshot.surfaceAuthorityState).toBe("diagnostic_only");
    expect(verdict.snapshot.calmTruthState).toBe("suppressed");
    expect(verdict.snapshot.mutationAuthorityState).toBe("observe_only");
  });

  it("forces recovery_only when an active channel freeze exists", async () => {
    const { authority, freeze, channel } = await seedAuthority("recovery");
    await authority.recordChannelFreeze({
      channelFreezeId: channel.channelFreezeId,
      channelFamily: channel.channelFamily,
      manifestVersionRef: channel.manifestVersionRef,
      releaseApprovalFreezeRef: channel.releaseApprovalFreezeRef,
      minimumBridgeCapabilitiesRef: channel.minimumBridgeCapabilitiesRef,
      channelState: "rollback_recommended",
      effectiveAt: channel.effectiveAt,
      updatedAt: "2026-04-12T21:25:00Z",
    });

    const verdict = await authority.publishReleaseTrustFreezeVerdict({
      audienceSurface: "governance-console",
      routeFamilyRef: "rf_governance_release",
      releaseApprovalFreezeRef: freeze.releaseApprovalFreezeId,
      releaseWatchTupleRef: "watch_tuple_recovery",
      releaseWatchTupleState: "active",
      waveGuardrailSnapshotRef: "guardrail_recovery",
      waveGuardrailState: "green",
      runtimePublicationBundleRef: "runtime_bundle_recovery",
      runtimePublicationState: "published",
      releasePublicationParityRef: "parity_recovery",
      releasePublicationParityState: "exact",
      requiredChannelFreezeRefs: [channel.channelFreezeId],
      requiredAssuranceSlices: [
        {
          sliceTrustId: "slice_recovery_a",
          sliceNamespace: "governance.surface",
          trustState: "trusted",
          completenessState: "complete",
          trustLowerBound: 0.9,
          hardBlockState: false,
          blockingProducerRefs: [],
          blockingNamespaceRefs: [],
          evaluationModelRef: "assurance_slice_trust_model::par_075_v1",
          reviewDueAt: "2026-04-12T22:00:00Z",
          updatedAt: "2026-04-12T21:20:00Z",
        },
      ],
      provenanceConsumptionState: "publishable",
      governingRecoveryDispositionRef: "recovery_route",
      evaluatedAt: "2026-04-12T21:26:00Z",
    });

    expect(verdict.snapshot.surfaceAuthorityState).toBe("recovery_only");
    expect(verdict.snapshot.mutationAuthorityState).toBe("governed_recovery");
    expect(verdict.blockers.some((blocker) => blocker.includes("CHANNEL_FREEZE"))).toBe(true);
  });

  it("blocks stale or drifted freeze tuples instead of reusing the approval row", async () => {
    const { authority, review, watchlist } = await seedAuthority("blocked");

    await expect(
      authority.approveReleaseFreeze({
        releaseCandidateRef: "release_candidate_blocked",
        governanceReviewPackageRef: review.governanceReviewPackageId,
        standardsDependencyWatchlistRef: watchlist.standardsDependencyWatchlistId,
        compiledPolicyBundleRef: review.compiledPolicyBundleRef,
        baselineTupleHash: "different_baseline_hash",
        scopeTupleHash: review.scopeTupleHash,
        compilationTupleHash: review.compilationTupleHash,
        approvalTupleHash: review.approvalTupleHash,
        reviewPackageHash: review.reviewPackageHash,
        standardsWatchlistHash: watchlist.watchlistHash,
        artifactDigestSetHash: "artifact_digest_blocked",
        surfaceSchemaSetHash: "surface_schema_blocked",
        bridgeCapabilitySetHash: "bridge_capability_blocked",
        migrationPlanHash: "migration_plan_blocked",
        compatibilityEvidenceRef: "compatibility_blocked",
        approvedBy: "approver_blocked",
        approvedAt: "2026-04-12T21:12:00Z",
        freezeState: "active",
      }),
    ).rejects.toThrow(/tuple drift/i);
  });

  it("enforces verdict precedence over fragment-based authority reconstruction", () => {
    expect(() =>
      assertReleaseTrustFreezeVerdictPrecedence(
        {
          releaseTrustFreezeVerdictId: "verdict_precedence",
          audienceSurface: "patient-web",
          routeFamilyRef: "rf_patient_home",
          releaseApprovalFreezeRef: "freeze_precedence",
          releaseWatchTupleRef: "watch_precedence",
          waveGuardrailSnapshotRef: "guardrail_precedence",
          runtimePublicationBundleRef: "runtime_precedence",
          releasePublicationParityRef: "parity_precedence",
          requiredChannelFreezeRefs: ["channel_precedence"],
          requiredAssuranceSliceTrustRefs: ["slice_precedence"],
          provenanceConsumptionState: "publishable",
          surfaceAuthorityState: "diagnostic_only",
          calmTruthState: "suppressed",
          mutationAuthorityState: "observe_only",
          governingRecoveryDispositionRef: "recovery_precedence",
          blockerRefs: ["BLOCKER_ASSURANCE_DEGRADED_PATIENT.SURFACE"],
          evaluatedAt: "2026-04-12T21:30:00Z",
          version: 1,
        },
        true,
      ),
    ).toThrow(/may not reopen authority/i);
  });
});
