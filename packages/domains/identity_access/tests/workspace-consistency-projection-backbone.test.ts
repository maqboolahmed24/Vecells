import { describe, expect, it } from "vitest";
import {
  createWorkspaceProjectionAuthorityService,
  createWorkspaceProjectionStore,
  type AssembleWorkspaceProjectionBundleInput,
} from "../src/workspace-consistency-projection-backbone";

function releaseTrustVerdict(overrides = {}) {
  return {
    releaseTrustFreezeVerdictId: "release_trust_freeze_verdict_232_live",
    audienceSurface: "clinical-workspace",
    routeFamilyRef: "rf_workspace_phase3_triage",
    releaseApprovalFreezeRef: "release_approval_freeze_232",
    releaseWatchTupleRef: "release_watch_tuple_232",
    waveGuardrailSnapshotRef: "wave_guardrail_232",
    runtimePublicationBundleRef: "runtime_publication_workspace_task_v1",
    releasePublicationParityRef: "release_parity_232",
    requiredChannelFreezeRefs: ["channel_freeze_232"],
    requiredAssuranceSliceTrustRefs: ["assurance_slice_232_workspace"],
    provenanceConsumptionState: "publishable",
    surfaceAuthorityState: "live",
    calmTruthState: "allowed",
    mutationAuthorityState: "enabled",
    governingRecoveryDispositionRef: "recovery_disposition_232",
    blockerRefs: [],
    evaluatedAt: "2026-04-16T09:05:00.000Z",
    version: 1,
    ...overrides,
  } as const;
}

function baseInput(overrides: Partial<AssembleWorkspaceProjectionBundleInput> = {}): AssembleWorkspaceProjectionBundleInput {
  return {
    workspaceRef: "/workspace/task/task_232_primary",
    workspaceFamily: "staff_review",
    taskId: "task_232_primary",
    requestId: "request_232_primary",
    queueKey: "repair",
    routeFamilyRef: "rf_workspace_phase3_triage",
    routeContinuityEvidenceContractRef: "route_continuity_workspace_task_completion_v1",
    audienceTier: "staff_triage",
    governingObjectRefs: ["task_232_primary", "request_232_primary", "review_session_232_primary"],
    entityVersionRefs: ["task_232_primary@v1", "review_session_232_primary@v1", "review_version_1"],
    queueChangeBatchRef: null,
    reviewVersionRef: 1,
    workspaceSnapshotVersion: 1,
    reviewFreshnessState: "fresh",
    currentRouteFamilyRef: "rf_workspace_phase3_triage",
    expectedSurfaceRouteContractRef: "route_contract_workspace_task_v1",
    currentSurfaceRouteContractRef: "route_contract_workspace_task_v1",
    expectedSurfacePublicationRef: "surface_publication_workspace_task_v1",
    surfacePublicationRef: "surface_publication_workspace_task_v1",
    expectedRuntimePublicationBundleRef: "runtime_publication_workspace_task_v1",
    runtimePublicationBundleRef: "runtime_publication_workspace_task_v1",
    surfaceRuntimeBindingRef: "audsurf_runtime_binding_workspace_task_v1",
    selectedAnchorRef: "anchor_patient_summary_232",
    selectedAnchorTupleHashRef: "anchor_tuple_hash_232_primary",
    continuitySelectedAnchorTupleHashRef: "anchor_tuple_hash_232_primary",
    continuitySourceQueueRankSnapshotRef: "queue_rank_snapshot_232_primary",
    sourceQueueRankSnapshotRef: "queue_rank_snapshot_232_primary",
    latestTaskCompletionSettlementRef: "task_settlement_232_primary",
    taskCompletionSettlementEnvelopeRef: "task_completion_envelope_232_primary",
    latestPrefetchWindowRef: "prefetch_window_232_primary",
    latestNextTaskLaunchLeaseRef: "next_task_launch_lease_232_primary",
    experienceContinuityEvidenceRef: "experience_continuity_evidence_232_primary",
    completionSettlementState: "settled",
    nextTaskLaunchState: "ready",
    releaseTrustVerdict: releaseTrustVerdict(),
    reviewActionLeaseRef: "review_action_lease_232_primary",
    reviewActionLeaseState: "live",
    requestLifecycleLeaseRef: "request_lifecycle_lease_232_primary",
    requestLifecycleLeaseState: "live",
    consequenceState: "current",
    staleOwnerRecoveryRef: null,
    ownershipEpochRef: 1,
    presentedOwnershipEpoch: 1,
    fencingToken: "fencing_token_232_primary",
    presentedFencingToken: "fencing_token_232_primary",
    lineageFenceEpoch: 1,
    presentedLineageFenceEpoch: 1,
    computedAt: "2026-04-16T09:05:00.000Z",
    staleAt: "2026-04-16T09:15:00.000Z",
    ...overrides,
  };
}

describe("workspace consistency projection backbone", () => {
  it("derives interactive posture only from trust plus live leases", async () => {
    const service = createWorkspaceProjectionAuthorityService(createWorkspaceProjectionStore());
    const liveBundle = await service.assembleWorkspaceProjectionBundle(baseInput());
    const previewBundle = await service.assembleWorkspaceProjectionBundle(
      baseInput({
        reviewActionLeaseState: "missing",
      }),
    );

    expect(liveBundle.workspaceTrustEnvelope.envelopeState).toBe("interactive");
    expect(liveBundle.workspaceTrustEnvelope.mutationAuthorityState).toBe("live");
    expect(previewBundle.workspaceTrustEnvelope.envelopeState).toBe("recovery_required");
    expect(previewBundle.workspaceTrustEnvelope.mutationAuthorityState).toBe("blocked");
    expect(previewBundle.workspaceTrustEnvelope.blockingReasonRefs).toContain(
      "WORKSPACE_232_REVIEW_ACTION_LEASE_MISSING",
    );
  });

  it("freezes protected composition on trust invalidation without dropping continuity evidence", async () => {
    const service = createWorkspaceProjectionAuthorityService(createWorkspaceProjectionStore());
    const bundle = await service.assembleWorkspaceProjectionBundle(
      baseInput({
        releaseTrustVerdict: releaseTrustVerdict({
          surfaceAuthorityState: "diagnostic_only",
          calmTruthState: "suppressed",
          mutationAuthorityState: "observe_only",
          blockerRefs: ["BLOCKER_ASSURANCE_DEGRADED_CLINICAL_WORKSPACE.AUTHORITY"],
        }),
        compositionMode: "drafting",
        focusProtectionLeaseRef: "focus_protection_lease_232_primary",
        focusProtectionLeaseState: "invalidated",
        invalidatingDriftState: "trust",
        draftArtifactRefs: ["draft_232_primary"],
        releaseGateRef: "release_gate_232_primary",
      }),
    );

    expect(bundle.protectedCompositionState?.stateValidity).toBe("stale_recoverable");
    expect(bundle.workspaceTrustEnvelope.mutationAuthorityState).toBe("frozen");
    expect(bundle.workspaceTrustEnvelope.interruptionPacingState).toBe("blocking_only");
    expect(bundle.workspaceContinuityEvidenceProjection.workspaceContinuityEvidenceProjectionId).toBeTruthy();
  });

  it("emits explicit anchor repair reason codes", async () => {
    const service = createWorkspaceProjectionAuthorityService(createWorkspaceProjectionStore());
    const bundle = await service.assembleWorkspaceProjectionBundle(
      baseInput({
        continuitySelectedAnchorTupleHashRef: "anchor_tuple_hash_232_repair_required",
        anchorRepairTargetRef: "anchor_patient_summary_232_repaired",
      }),
    );

    expect(bundle.workspaceContinuityEvidenceProjection.anchorContinuityState).toBe(
      "stale_remappable",
    );
    expect(bundle.workspaceContinuityEvidenceProjection.blockingRefs).toContain(
      "WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE",
    );
    expect(bundle.workspaceTrustEnvelope.requiredRecoveryAction).toBe("repair_anchor");
  });
});
