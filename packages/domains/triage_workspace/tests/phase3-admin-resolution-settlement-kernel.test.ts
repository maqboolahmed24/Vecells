import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  AdminResolutionReentryResolver,
  createPhase3AdminResolutionSettlementKernelService,
  createPhase3AdminResolutionSettlementKernelStore,
  type AdminResolutionLiveTupleSnapshot,
  type AdminResolutionSettlementMutationInput,
} from "../src/index.ts";

function buildLiveTuple(
  taskId: string,
  overrides: Partial<AdminResolutionLiveTupleSnapshot> = {},
): AdminResolutionLiveTupleSnapshot {
  return {
    taskId,
    currentBoundaryDecisionRef: `boundary_${taskId}`,
    currentBoundaryTupleHash: `boundary_tuple_${taskId}`,
    currentBoundaryState: "live",
    currentClinicalMeaningState: "bounded_admin_only",
    currentOperationalFollowUpScope: "bounded_admin_resolution",
    currentAdminMutationAuthorityState: "bounded_admin_only",
    currentDecisionEpochRef: `decision_epoch_${taskId}`,
    currentDecisionSupersessionRecordRef: null,
    currentDependencySetRef: `dependency_set_${taskId}`,
    currentDependencyReopenState: "stable",
    canContinueCurrentConsequence: true,
    currentLineageFenceEpoch: 4,
    currentCompletionArtifactRef: `completion_artifact_${taskId}`,
    currentPatientExpectationTemplateRef: `patient_expectation_template_${taskId}`,
    currentReopenState: "stable",
    currentVisibilityTier: "patient_authenticated",
    currentSummarySafetyTier: "clinical_safe_summary",
    currentPlaceholderContractRef: "placeholder_contract.admin_resolution.default",
    currentReleaseState: "current",
    currentTrustState: "trusted",
    currentSurfaceRouteContractRef: "surface_route_contract.workspace.admin_resolution",
    currentSurfacePublicationRef: "surface_publication.workspace.admin_resolution.current",
    currentRuntimePublicationBundleRef: "runtime_publication_bundle.workspace.admin_resolution.current",
    currentTaskCompletionSettlementEnvelopeRef: `task_completion_envelope_${taskId}`,
    currentSelectedAnchorRef: `anchor_${taskId}`,
    currentRouteFamilyRef: "rf_workspace_phase3_triage",
    currentPatientShellConsistencyProjectionRef: `patient_shell_projection_${taskId}`,
    currentPatientEmbeddedSessionProjectionRef: `patient_session_projection_${taskId}`,
    currentStaffWorkspaceConsistencyProjectionRef: `staff_workspace_projection_${taskId}`,
    currentWorkspaceSliceTrustProjectionRef: `workspace_slice_trust_${taskId}`,
    currentConsistencyProjectionRef: `workspace_continuity_projection_${taskId}`,
    currentVisibilityPolicyRef: "visibility_policy.admin_resolution.current",
    currentAudienceTier: "patient_authenticated",
    currentTransitionEnvelopeRef: `transition_envelope_${taskId}`,
    currentReleaseWatchRef: `release_watch_${taskId}`,
    currentRouteIntentBindingRef: `route_intent_binding_${taskId}`,
    currentReviewActionLeaseRef: `review_action_lease_${taskId}`,
    currentReviewActionOwnershipEpochRef: `review_action_ownership_epoch_${taskId}`,
    currentReviewActionFencingToken: `review_action_fencing_token_${taskId}`,
    currentWorkspaceConsistencyProjectionRef: `workspace_consistency_projection_${taskId}`,
    currentWorkspaceTrustProjectionRef: `workspace_trust_projection_${taskId}`,
    currentCommandActionRef: `command_action_${taskId}`,
    currentCommandSettlementRef: `command_settlement_${taskId}`,
    currentReleaseApprovalFreezeRef: "release_approval_freeze.current",
    currentChannelReleaseFreezeRef: "channel_release_freeze.current",
    ...overrides,
  };
}

function buildMutationInput(
  taskId: string,
  overrides: Partial<AdminResolutionSettlementMutationInput> = {},
): AdminResolutionSettlementMutationInput {
  return {
    adminResolutionCaseRef: `admin_case_${taskId}`,
    caseBoundaryDecisionRef: `boundary_${taskId}`,
    caseBoundaryTupleHash: `boundary_tuple_${taskId}`,
    caseDecisionEpochRef: `decision_epoch_${taskId}`,
    caseLineageFenceEpoch: 4,
    actionType: "record_completion",
    desiredResult: "completed",
    actorRef: `actor_${taskId}`,
    recordedAt: "2026-04-17T12:00:00.000Z",
    policyBundleRef: "policy_bundle_254_v1",
    liveTuple: buildLiveTuple(taskId),
    completionArtifactRef: `completion_artifact_${taskId}`,
    patientExpectationTemplateRef: `patient_expectation_template_${taskId}`,
    reasonCodeRefs: ["admin_resolution_completion_ready"],
    ...overrides,
  };
}

describe("phase 3 admin-resolution settlement kernel", () => {
  it("records completed only with current artifact parity and projects the authoritative completion state", async () => {
    const repositories = createPhase3AdminResolutionSettlementKernelStore();
    const service = createPhase3AdminResolutionSettlementKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_settlement_complete"),
    });

    const recorded = await service.recordAdminResolutionSettlement(
      buildMutationInput("task_254_complete"),
    );

    expect(recorded.settlement.result).toBe("completed");
    expect(recorded.settlement.completionArtifactRef).toBe(
      "completion_artifact_task_254_complete",
    );
    expect(recorded.settlement.patientExpectationTemplateRef).toBe(
      "patient_expectation_template_task_254_complete",
    );
    expect(recorded.experienceProjection.currentSettlementRef).toBe(
      recorded.settlement.adminResolutionSettlementId,
    );
    expect(recorded.experienceProjection.adminMutationAuthorityState).toBe(
      "bounded_admin_only",
    );
    expect(recorded.experienceProjection.dominantNextActionRef).toBe(
      "dominant_next_action.next_task_launch",
    );
  });

  it("settles stale_recoverable on tuple drift and preserves chronology instead of retargeting to the latest tuple", async () => {
    const repositories = createPhase3AdminResolutionSettlementKernelStore();
    const service = createPhase3AdminResolutionSettlementKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_settlement_stale"),
    });

    const stale = await service.recordAdminResolutionSettlement(
      buildMutationInput("task_254_stale", {
        presentedBoundaryTupleHash: "boundary_tuple_old",
        presentedDecisionEpochRef: "decision_epoch_old",
      }),
    );
    expect(stale.settlement.result).toBe("stale_recoverable");
    expect(stale.staleTupleEvaluation.stale).toBe(true);
    expect(stale.settlement.reasonCodeRefs).toContain("presented_boundary_tuple_hash_drift");
    expect(stale.settlement.reasonCodeRefs).toContain("presented_decision_epoch_drift");

    await service.recordAdminResolutionSettlement(
      buildMutationInput("task_254_stale", {
        actionType: "queue_admin_resolution",
        desiredResult: "queued",
        recordedAt: "2026-04-17T12:05:00.000Z",
        reasonCodeRefs: ["admin_resolution_recovered_after_stale_tuple"],
      }),
    );

    const bundle = await service.queryTaskBundle("task_254_stale");
    expect(bundle.settlements.map((entry) => entry.result)).toEqual([
      "stale_recoverable",
      "queued",
    ]);
  });

  it("reuses one exact-once settlement chain for concurrent same-tuple mutations", async () => {
    const repositories = createPhase3AdminResolutionSettlementKernelStore();
    const service = createPhase3AdminResolutionSettlementKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_settlement_exact_once"),
    });

    const [first, second, third] = await Promise.all([
      service.recordAdminResolutionSettlement(
        buildMutationInput("task_254_exact_once", {
          actionType: "queue_admin_resolution",
          desiredResult: "queued",
          completionArtifactRef: null,
          patientExpectationTemplateRef: null,
          recordedAt: "2026-04-17T12:00:00.000Z",
          reasonCodeRefs: ["admin_resolution_queued"],
        }),
      ),
      service.recordAdminResolutionSettlement(
        buildMutationInput("task_254_exact_once", {
          actionType: "queue_admin_resolution",
          desiredResult: "queued",
          completionArtifactRef: null,
          patientExpectationTemplateRef: null,
          recordedAt: "2026-04-17T12:00:01.000Z",
          reasonCodeRefs: ["admin_resolution_queued"],
        }),
      ),
      service.recordAdminResolutionSettlement(
        buildMutationInput("task_254_exact_once", {
          actionType: "queue_admin_resolution",
          desiredResult: "queued",
          completionArtifactRef: null,
          patientExpectationTemplateRef: null,
          recordedAt: "2026-04-17T12:00:02.000Z",
          reasonCodeRefs: ["admin_resolution_queued"],
        }),
      ),
    ]);

    const bundle = await service.queryTaskBundle("task_254_exact_once");
    expect(bundle.actionRecords).toHaveLength(1);
    expect(bundle.settlements).toHaveLength(1);
    expect(first.settlement.adminResolutionSettlementId).toBe(
      second.settlement.adminResolutionSettlementId,
    );
    expect(third.settlement.adminResolutionSettlementId).toBe(
      first.settlement.adminResolutionSettlementId,
    );
    expect(first.actionRecord.adminResolutionActionRecordId).toBe(
      second.actionRecord.adminResolutionActionRecordId,
    );
    expect(third.actionRecord.adminResolutionActionRecordId).toBe(
      first.actionRecord.adminResolutionActionRecordId,
    );
  });

  it("resolves governed review and repair re-entry destinations from the live blocker shape", () => {
    const resolver = new AdminResolutionReentryResolver();

    const governedReview = resolver.resolve({
      settlement: {
        result: "waiting_dependency",
        taskId: "task_254_reentry_review",
        adminResolutionCaseRef: "admin_case_task_254_reentry_review",
        boundaryDecisionRef: "boundary_task_254_reentry_review",
        boundaryTupleHash: "boundary_tuple_task_254_reentry_review",
        decisionEpochRef: "decision_epoch_task_254_reentry_review",
        dependencySetRef: "dependency_set_task_254_reentry_review",
        recoveryRouteRef: "/workspace/task/task_254_reentry_review/decision",
      },
      liveTuple: {
        currentClinicalMeaningState: "clinician_reentry_required",
        currentBoundaryState: "reopened",
        currentReopenState: "reopened",
        currentDependencyReopenState: null,
        currentDependencySetRef: "dependency_set_task_254_reentry_review",
        canContinueCurrentConsequence: false,
      },
      reasonCodeRefs: ["safety_preemption_requires_clinician_reentry"],
      dominantRecoveryRouteRef: "/workspace/task/task_254_reentry_review/decision",
      dominantBlockerRef: "clinical_reentry_required",
    });
    expect(governedReview.destination).toBe("triage_review");
    expect(governedReview.resolverMode).toBe("reopen_launch");
    expect(governedReview.reasonClass).toBe("boundary_reopened");

    const repairRoute = resolver.resolve({
      settlement: {
        result: "waiting_dependency",
        taskId: "task_254_reentry_identity",
        adminResolutionCaseRef: "admin_case_task_254_reentry_identity",
        boundaryDecisionRef: "boundary_task_254_reentry_identity",
        boundaryTupleHash: "boundary_tuple_task_254_reentry_identity",
        decisionEpochRef: "decision_epoch_task_254_reentry_identity",
        dependencySetRef: "dependency_set_task_254_reentry_identity",
        recoveryRouteRef: "/workspace/task/task_254_reentry_identity/admin-resolution",
      },
      liveTuple: {
        currentClinicalMeaningState: "bounded_admin_only",
        currentBoundaryState: "live",
        currentReopenState: "stable",
        currentDependencyReopenState: null,
        currentDependencySetRef: "dependency_set_task_254_reentry_identity",
        canContinueCurrentConsequence: false,
      },
      reasonCodeRefs: ["identity_repair_active"],
      dominantRecoveryRouteRef: "/workspace/task/task_254_reentry_identity/admin-resolution",
      dominantBlockerRef: "identity_repair_case_open",
    });
    expect(repairRoute.destination).toBe("identity_repair");
    expect(repairRoute.resolverMode).toBe("repair_route_only");
    expect(repairRoute.reasonClass).toBe("identity_repair");
  });
});
