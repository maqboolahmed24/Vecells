import { describe, expect, it } from "vitest";
import {
  createReleaseWatchPipelineSimulationHarness,
  createReleaseWatchTuple,
  createRuntimePublicationSimulationHarness,
  createWaveObservationPolicy,
  deriveReleaseWatchTupleHash,
  deriveWaveObservationPolicyHash,
  ReleaseWatchPipelineCoordinator,
  type ReleaseWatchTupleMembers,
  type WaveObservationPolicyMembers,
  type WaveObservationProbeDefinition,
  type WaveObservationProbeReading,
} from "../src/index.ts";

function createProbeCatalog(): WaveObservationProbeDefinition[] {
  return [
    {
      probeRef: "probe.test.parity",
      probeClass: "publication_parity",
      label: "Publication parity",
      description: "Checks exact publication parity.",
      staleAfterMinutes: 20,
      requiredForSatisfaction: true,
      failureSeverity: "critical",
      sourceRefs: ["release-watch-pipeline.test.ts"],
    },
    {
      probeRef: "probe.test.synthetic",
      probeClass: "synthetic_user_journey",
      label: "Critical synthetic path",
      description: "Checks one critical end-to-end path.",
      staleAfterMinutes: 20,
      requiredForSatisfaction: true,
      failureSeverity: "critical",
      sourceRefs: ["release-watch-pipeline.test.ts"],
    },
  ];
}

function createPassingReadings(
  overrides: Partial<Record<string, Partial<WaveObservationProbeReading>>> = {},
): WaveObservationProbeReading[] {
  return [
    {
      probeRef: "probe.test.parity",
      state: "passed",
      observedAt: "2026-04-13T12:20:00.000Z",
      evidenceRefs: ["evidence::parity"],
      severity: "info",
      summary: "Parity stayed exact.",
      ...(overrides["probe.test.parity"] ?? {}),
    },
    {
      probeRef: "probe.test.synthetic",
      state: "passed",
      observedAt: "2026-04-13T12:21:00.000Z",
      evidenceRefs: ["evidence::synthetic"],
      severity: "info",
      summary: "Synthetic journey stayed healthy.",
      ...(overrides["probe.test.synthetic"] ?? {}),
    },
  ];
}

function createPublishedWatch() {
  const publicationHarness = createRuntimePublicationSimulationHarness();
  const coordinator = new ReleaseWatchPipelineCoordinator();
  const published = coordinator.publish({
    tuple: {
      releaseWatchTupleId: "rwt::test",
      releaseRef: "rc::test",
      promotionIntentRef: "promotion-intent::test",
      approvalEvidenceBundleRef: "approval-evidence::test",
      baselineTupleHash: "baseline::test",
      approvalTupleHash: "approval::test",
      releaseApprovalFreezeRef: publicationHarness.bundle.releaseApprovalFreezeRef,
      runtimePublicationBundleRef: publicationHarness.bundle.runtimePublicationBundleId,
      releasePublicationParityRef: publicationHarness.parityRecord.publicationParityRecordId,
      waveRef: "wave::test",
      waveEligibilitySnapshotRef: "wave-eligibility::test",
      waveGuardrailSnapshotRef: "wave-guardrail::test",
      waveObservationPolicyRef: "wop::test",
      waveControlFenceRef: "wave-control-fence::test",
      tenantScopeMode: "platform",
      tenantScopeRef: "scope://test/platform",
      affectedTenantCount: 0,
      affectedOrganisationCount: 0,
      tenantScopeTupleHash: "tenant-scope::test",
      requiredAssuranceSliceRefs: ["asr::watch", "asr::publication"],
      releaseTrustFreezeVerdictRefs: ["rtfv::test::live"],
      requiredContinuityControlRefs: ["patient_nav", "workspace_task_completion"],
      continuityEvidenceDigestRefs: ["continuity::patient-nav", "continuity::workspace-task"],
      activeChannelFreezeRefs: ["channel-freeze::browser"],
      recoveryDispositionRefs: ["recovery-disposition::read-only"],
      publishedAt: "2026-04-13T12:00:00.000Z",
      sourceRefs: ["release-watch-pipeline.test.ts"],
    },
    policy: {
      waveObservationPolicyId: "wop::test",
      releaseRef: "rc::test",
      waveRef: "wave::test",
      promotionIntentRef: "promotion-intent::test",
      releaseApprovalFreezeRef: publicationHarness.bundle.releaseApprovalFreezeRef,
      waveEligibilitySnapshotRef: "wave-eligibility::test",
      watchTupleHash: "placeholder",
      minimumDwellDuration: "PT15M",
      minimumObservationSamples: 2,
      requiredProbeRefs: ["probe.test.parity", "probe.test.synthetic"],
      requiredContinuityControlRefs: ["patient_nav", "workspace_task_completion"],
      requiredContinuityEvidenceDigestRefs: [
        "continuity::patient-nav",
        "continuity::workspace-task",
      ],
      requiredPublicationParityState: "exact",
      requiredRoutePostureState: "converged",
      requiredProvenanceState: "verified",
      stabilizationCriteriaRef: "STAB_TEST_EXACT",
      rollbackTriggerRefs: ["rollback.test.parity-drift", "rollback.test.synthetic-journey"],
      gapResolutionRefs: [
        "GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT",
        "GAP_RESOLUTION_WAVE_POLICY_PROBE_STALENESS_BUDGET",
      ],
      operationalReadinessSnapshotRef:
        "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT",
      publishedAt: "2026-04-13T12:00:00.000Z",
      sourceRefs: ["release-watch-pipeline.test.ts"],
    },
  });
  return {
    coordinator,
    publicationHarness,
    published,
    currentTuple: {
      releaseRef: published.tuple.releaseRef,
      promotionIntentRef: published.tuple.promotionIntentRef,
      approvalEvidenceBundleRef: published.tuple.approvalEvidenceBundleRef,
      baselineTupleHash: published.tuple.baselineTupleHash,
      approvalTupleHash: published.tuple.approvalTupleHash,
      releaseApprovalFreezeRef: published.tuple.releaseApprovalFreezeRef,
      runtimePublicationBundleRef: published.tuple.runtimePublicationBundleRef,
      releasePublicationParityRef: published.tuple.releasePublicationParityRef,
      waveRef: published.tuple.waveRef,
      waveEligibilitySnapshotRef: published.tuple.waveEligibilitySnapshotRef,
      waveGuardrailSnapshotRef: published.tuple.waveGuardrailSnapshotRef,
      waveObservationPolicyRef: published.tuple.waveObservationPolicyRef,
      waveControlFenceRef: published.tuple.waveControlFenceRef,
      tenantScopeMode: published.tuple.tenantScopeMode,
      tenantScopeRef: published.tuple.tenantScopeRef,
      affectedTenantCount: published.tuple.affectedTenantCount,
      affectedOrganisationCount: published.tuple.affectedOrganisationCount,
      tenantScopeTupleHash: published.tuple.tenantScopeTupleHash,
      requiredAssuranceSliceRefs: published.tuple.requiredAssuranceSliceRefs,
      releaseTrustFreezeVerdictRefs: published.tuple.releaseTrustFreezeVerdictRefs,
      requiredContinuityControlRefs: published.tuple.requiredContinuityControlRefs,
      continuityEvidenceDigestRefs: published.tuple.continuityEvidenceDigestRefs,
      activeChannelFreezeRefs: published.tuple.activeChannelFreezeRefs,
      recoveryDispositionRefs: published.tuple.recoveryDispositionRefs,
    } satisfies ReleaseWatchTupleMembers,
    currentPolicy: {
      releaseRef: published.policy.releaseRef,
      waveRef: published.policy.waveRef,
      promotionIntentRef: published.policy.promotionIntentRef,
      releaseApprovalFreezeRef: published.policy.releaseApprovalFreezeRef,
      waveEligibilitySnapshotRef: published.policy.waveEligibilitySnapshotRef,
      watchTupleHash: published.tuple.watchTupleHash,
      minimumDwellDuration: published.policy.minimumDwellDuration,
      minimumObservationSamples: published.policy.minimumObservationSamples,
      requiredProbeRefs: published.policy.requiredProbeRefs,
      requiredContinuityControlRefs: published.policy.requiredContinuityControlRefs,
      requiredContinuityEvidenceDigestRefs: published.policy.requiredContinuityEvidenceDigestRefs,
      requiredPublicationParityState: published.policy.requiredPublicationParityState,
      requiredRoutePostureState: published.policy.requiredRoutePostureState,
      requiredProvenanceState: published.policy.requiredProvenanceState,
      stabilizationCriteriaRef: published.policy.stabilizationCriteriaRef,
      rollbackTriggerRefs: published.policy.rollbackTriggerRefs,
      gapResolutionRefs: published.policy.gapResolutionRefs,
      operationalReadinessSnapshotRef: published.policy.operationalReadinessSnapshotRef,
    } satisfies WaveObservationPolicyMembers,
  };
}

describe("release watch pipeline", () => {
  it("derives deterministic watch tuple and policy hashes", () => {
    const tuple = createReleaseWatchTuple({
      releaseWatchTupleId: "rwt::hash",
      releaseRef: "rc::hash",
      promotionIntentRef: "promotion-intent::hash",
      approvalEvidenceBundleRef: "approval-evidence::hash",
      baselineTupleHash: "baseline::hash",
      approvalTupleHash: "approval::hash",
      releaseApprovalFreezeRef: "raf::hash",
      runtimePublicationBundleRef: "rpb::hash",
      releasePublicationParityRef: "rpp::hash",
      waveRef: "wave::hash",
      waveEligibilitySnapshotRef: "wave-eligibility::hash",
      waveGuardrailSnapshotRef: "wave-guardrail::hash",
      waveObservationPolicyRef: "wop::hash",
      waveControlFenceRef: "wave-control-fence::hash",
      tenantScopeMode: "platform",
      tenantScopeRef: "scope://hash/platform",
      affectedTenantCount: 0,
      affectedOrganisationCount: 0,
      tenantScopeTupleHash: "tenant-scope::hash",
      requiredAssuranceSliceRefs: ["asr::hash"],
      releaseTrustFreezeVerdictRefs: ["rtfv::hash"],
      requiredContinuityControlRefs: ["patient_nav"],
      continuityEvidenceDigestRefs: ["continuity::hash"],
      activeChannelFreezeRefs: ["channel-freeze::hash"],
      recoveryDispositionRefs: ["recovery-disposition::hash"],
      publishedAt: "2026-04-13T12:00:00.000Z",
      sourceRefs: ["release-watch-pipeline.test.ts"],
    });
    const policy = createWaveObservationPolicy({
      waveObservationPolicyId: "wop::hash",
      releaseRef: "rc::hash",
      waveRef: "wave::hash",
      promotionIntentRef: "promotion-intent::hash",
      releaseApprovalFreezeRef: "raf::hash",
      waveEligibilitySnapshotRef: "wave-eligibility::hash",
      watchTupleHash: tuple.watchTupleHash,
      minimumDwellDuration: "PT15M",
      minimumObservationSamples: 1,
      requiredProbeRefs: ["probe.hash"],
      requiredContinuityControlRefs: ["patient_nav"],
      requiredContinuityEvidenceDigestRefs: ["continuity::hash"],
      requiredPublicationParityState: "exact",
      requiredRoutePostureState: "converged",
      requiredProvenanceState: "verified",
      stabilizationCriteriaRef: "STAB_HASH",
      rollbackTriggerRefs: ["rollback.hash.parity"],
      gapResolutionRefs: ["GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT"],
      operationalReadinessSnapshotRef: null,
      publishedAt: "2026-04-13T12:00:00.000Z",
      sourceRefs: ["release-watch-pipeline.test.ts"],
    });

    expect(tuple.watchTupleHash).toBe(
      deriveReleaseWatchTupleHash({
        releaseRef: tuple.releaseRef,
        promotionIntentRef: tuple.promotionIntentRef,
        approvalEvidenceBundleRef: tuple.approvalEvidenceBundleRef,
        baselineTupleHash: tuple.baselineTupleHash,
        approvalTupleHash: tuple.approvalTupleHash,
        releaseApprovalFreezeRef: tuple.releaseApprovalFreezeRef,
        runtimePublicationBundleRef: tuple.runtimePublicationBundleRef,
        releasePublicationParityRef: tuple.releasePublicationParityRef,
        waveRef: tuple.waveRef,
        waveEligibilitySnapshotRef: tuple.waveEligibilitySnapshotRef,
        waveGuardrailSnapshotRef: tuple.waveGuardrailSnapshotRef,
        waveObservationPolicyRef: tuple.waveObservationPolicyRef,
        waveControlFenceRef: tuple.waveControlFenceRef,
        tenantScopeMode: tuple.tenantScopeMode,
        tenantScopeRef: tuple.tenantScopeRef,
        affectedTenantCount: tuple.affectedTenantCount,
        affectedOrganisationCount: tuple.affectedOrganisationCount,
        tenantScopeTupleHash: tuple.tenantScopeTupleHash,
        requiredAssuranceSliceRefs: tuple.requiredAssuranceSliceRefs,
        releaseTrustFreezeVerdictRefs: tuple.releaseTrustFreezeVerdictRefs,
        requiredContinuityControlRefs: tuple.requiredContinuityControlRefs,
        continuityEvidenceDigestRefs: tuple.continuityEvidenceDigestRefs,
        activeChannelFreezeRefs: tuple.activeChannelFreezeRefs,
        recoveryDispositionRefs: tuple.recoveryDispositionRefs,
      }),
    );
    expect(policy.policyHash).toBe(
      deriveWaveObservationPolicyHash({
        releaseRef: policy.releaseRef,
        waveRef: policy.waveRef,
        promotionIntentRef: policy.promotionIntentRef,
        releaseApprovalFreezeRef: policy.releaseApprovalFreezeRef,
        waveEligibilitySnapshotRef: policy.waveEligibilitySnapshotRef,
        watchTupleHash: policy.watchTupleHash,
        minimumDwellDuration: policy.minimumDwellDuration,
        minimumObservationSamples: policy.minimumObservationSamples,
        requiredProbeRefs: policy.requiredProbeRefs,
        requiredContinuityControlRefs: policy.requiredContinuityControlRefs,
        requiredContinuityEvidenceDigestRefs: policy.requiredContinuityEvidenceDigestRefs,
        requiredPublicationParityState: policy.requiredPublicationParityState,
        requiredRoutePostureState: policy.requiredRoutePostureState,
        requiredProvenanceState: policy.requiredProvenanceState,
        stabilizationCriteriaRef: policy.stabilizationCriteriaRef,
        rollbackTriggerRefs: policy.rollbackTriggerRefs,
        gapResolutionRefs: policy.gapResolutionRefs,
        operationalReadinessSnapshotRef: policy.operationalReadinessSnapshotRef,
      }),
    );
  });

  it("supersedes the active tuple when scope changes", () => {
    const { coordinator, published } = createPublishedWatch();

    coordinator.publish({
      tuple: {
        ...published.tuple,
        releaseWatchTupleId: "rwt::test::superseding",
        tenantScopeRef: "scope://test/narrowed",
        tenantScopeTupleHash: "tenant-scope::narrowed",
        affectedTenantCount: 2,
        publishedAt: "2026-04-13T12:10:00.000Z",
      },
      policy: {
        ...published.policy,
        waveObservationPolicyId: "wop::test::superseding",
        minimumDwellDuration: "PT20M",
        publishedAt: "2026-04-13T12:10:00.000Z",
      },
      reasonRefs: ["SCOPE_NARROWED"],
    });

    expect(coordinator.store.getTuple("rwt::test")?.tupleState).toBe("superseded");
    expect(coordinator.store.getPolicy("wop::test")?.policyState).toBe("superseded");
    expect(coordinator.store.getActiveTuple("rc::test", "wave::test")?.releaseWatchTupleId).toBe(
      "rwt::test::superseding",
    );
    expect(
      coordinator.store
        .getTimeline()
        .some(
          (event) =>
            event.eventType === "tuple_superseded" && event.reasonRefs.includes("SCOPE_NARROWED"),
        ),
    ).toBe(true);
  });

  it("blocks widen and close when tuple drift makes the watch stale", () => {
    const { coordinator, publicationHarness, currentTuple, currentPolicy } = createPublishedWatch();

    const result = coordinator.evaluate({
      releaseRef: "rc::test",
      waveRef: "wave::test",
      currentTuple: {
        ...currentTuple,
        activeChannelFreezeRefs: ["channel-freeze::drifted"],
      },
      currentPolicy,
      publicationVerdict: publicationHarness.verdict,
      probeCatalog: createProbeCatalog(),
      probeReadings: createPassingReadings(),
      routePostureState: "converged",
      provenanceState: "verified",
      currentContinuityEvidenceDigestRefs: currentPolicy.requiredContinuityEvidenceDigestRefs,
      currentAssuranceSliceRefs: currentTuple.requiredAssuranceSliceRefs,
      now: "2026-04-13T12:30:00.000Z",
      observedSamples: 2,
    });

    expect(result.watchState).toBe("stale");
    expect(result.tuple.tupleState).toBe("stale");
    expect(result.actionEligibility.find((row) => row.waveActionType === "widen")?.allowed).toBe(
      false,
    );
    expect(result.actionEligibility.find((row) => row.waveActionType === "close")?.allowed).toBe(
      false,
    );
  });

  it("expires the observation window and blocks the policy when dwell proof stays incomplete", () => {
    const { coordinator, publicationHarness, currentTuple, currentPolicy } = createPublishedWatch();

    const result = coordinator.evaluate({
      releaseRef: "rc::test",
      waveRef: "wave::test",
      currentTuple,
      currentPolicy,
      publicationVerdict: publicationHarness.verdict,
      probeCatalog: createProbeCatalog(),
      probeReadings: createPassingReadings({
        "probe.test.synthetic": {
          observedAt: "2026-04-13T12:03:00.000Z",
          state: "pending",
          summary: "Synthetic path is still waiting for proof.",
        },
      }),
      routePostureState: "converged",
      provenanceState: "verified",
      currentContinuityEvidenceDigestRefs: currentPolicy.requiredContinuityEvidenceDigestRefs,
      currentAssuranceSliceRefs: currentTuple.requiredAssuranceSliceRefs,
      now: "2026-04-13T12:45:00.000Z",
      observedSamples: 1,
    });

    expect(result.watchState).toBe("blocked");
    expect(result.policy.policyState).toBe("blocked");
    expect(result.observationWindow.observationState).toBe("expired");
  });

  it("arms rollback when a critical synthetic journey fails", () => {
    const { coordinator, publicationHarness, currentTuple, currentPolicy } = createPublishedWatch();

    const result = coordinator.evaluate({
      releaseRef: "rc::test",
      waveRef: "wave::test",
      currentTuple,
      currentPolicy,
      publicationVerdict: publicationHarness.verdict,
      probeCatalog: createProbeCatalog(),
      probeReadings: createPassingReadings({
        "probe.test.synthetic": {
          state: "failed",
          severity: "critical",
          summary: "Critical synthetic journey failed for the active tuple.",
        },
      }),
      routePostureState: "rollback_required",
      provenanceState: "verified",
      currentContinuityEvidenceDigestRefs: currentPolicy.requiredContinuityEvidenceDigestRefs,
      currentAssuranceSliceRefs: currentTuple.requiredAssuranceSliceRefs,
      now: "2026-04-13T12:20:00.000Z",
      observedSamples: 2,
    });

    expect(result.watchState).toBe("rollback_required");
    expect(result.triggerEvaluations.some((row) => row.triggerState === "triggered")).toBe(true);
    expect(result.actionEligibility.find((row) => row.waveActionType === "rollback")?.allowed).toBe(
      true,
    );
  });

  it("records deterministic timeline events for publish, evaluate, and close", () => {
    const harness = createReleaseWatchPipelineSimulationHarness();
    const closeEligibility = harness.evaluation.actionEligibility.find(
      (row) => row.waveActionType === "close",
    );

    expect(closeEligibility?.allowed).toBe(true);
    const closed = harness.coordinator.close({
      releaseRef: harness.tuple.releaseRef,
      waveRef: harness.tuple.waveRef,
      now: "2026-04-13T12:31:00.000Z",
    });

    expect(closed.tupleState).toBe("closed");
    expect(harness.store.getTimeline().map((row) => row.eventType)).toEqual([
      "tuple_published",
      "policy_published",
      "observation_window_opened",
      "observation_evaluated",
      "rollback_trigger_evaluated",
      "action_eligibility_refreshed",
      "tuple_closed",
    ]);
  });
});
