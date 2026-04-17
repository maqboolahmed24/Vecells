import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3SelfCareBoundaryKernelService,
  createPhase3SelfCareBoundaryKernelStore,
  type ClassifySelfCareBoundaryInput,
  type IssueAdviceEligibilityGrantInput,
} from "../src/index.ts";

function buildBoundaryInput(
  taskId: string,
  overrides: Partial<ClassifySelfCareBoundaryInput> = {},
): ClassifySelfCareBoundaryInput {
  return {
    taskId,
    requestRef: `request_${taskId}`,
    evidenceSnapshotRef: `evidence_${taskId}`,
    decisionEpochRef: `decision_epoch_${taskId}`,
    decisionState: "self_care",
    clinicalMeaningState: "informational_only",
    operationalFollowUpScope: "self_serve_guidance",
    adminMutationAuthorityState: "none",
    reasonCodeRefs: ["current_endpoint_self_care"],
    adminResolutionSubtypeRef: null,
    routeIntentBindingRef: `route_intent_${taskId}`,
    selectedAnchorRef: `anchor_${taskId}`,
    lineageFenceEpoch: 3,
    dependencySetRef: `dependency_${taskId}`,
    adviceRenderSettlementRef: null,
    adminResolutionCaseRef: null,
    selfCareExperienceProjectionRef: null,
    adminResolutionExperienceProjectionRef: null,
    reopenTriggerRefs: [],
    reopenState: "stable",
    boundaryState: "live",
    compiledPolicyBundleRef: "policy_bundle_249_v1",
    decidedAt: "2026-04-17T09:00:00.000Z",
    ...overrides,
  };
}

function buildGrantInput(
  taskId: string,
  boundaryDecisionRef: string,
  overrides: Partial<IssueAdviceEligibilityGrantInput> = {},
): IssueAdviceEligibilityGrantInput {
  return {
    taskId,
    requestRef: `request_${taskId}`,
    boundaryDecisionRef,
    evidenceSnapshotRef: `evidence_${taskId}`,
    decisionEpochRef: `decision_epoch_${taskId}`,
    decisionSupersessionRecordRef: null,
    safetyState: "clear",
    routeFamily: "patient_portal",
    audienceTier: "authenticated",
    channelRef: "portal_web",
    localeRef: "en-GB",
    compiledPolicyBundleRef: "policy_bundle_249_v1",
    adviceBundleVersionRef: "advice_bundle_249_v1",
    lineageFenceEpoch: 3,
    routeIntentRef: `route_intent_${taskId}`,
    subjectBindingVersionRef: `subject_binding_${taskId}_v1`,
    sessionEpochRef: `review_session_${taskId}_v1`,
    assuranceSliceTrustRefs: [`trust_projection_${taskId}_v1`],
    surfaceRouteContractRef: `surface_route_contract_${taskId}_v1`,
    surfacePublicationRef: `surface_publication_${taskId}_v1`,
    runtimePublicationBundleRef: `runtime_publication_${taskId}_v1`,
    reasonCodeRefs: ["grant_requested"],
    issuedAt: "2026-04-17T09:10:00.000Z",
    expiresAt: "2030-01-01T00:00:00.000Z",
    grantState: "live",
    transitionCauseClass: "manual_replace",
    ...overrides,
  };
}

describe("phase 3 self-care boundary kernel", () => {
  it("accepts only the legal self-care, bounded-admin, and clinician-review tuples", async () => {
    const repositories = createPhase3SelfCareBoundaryKernelStore();
    const service = createPhase3SelfCareBoundaryKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_self_care_tuple_law"),
    });

    const legalCases: Array<{
      taskId: string;
      overrides: Partial<ClassifySelfCareBoundaryInput>;
    }> = [
      {
        taskId: "task_249_legal_self_care",
        overrides: {},
      },
      {
        taskId: "task_249_legal_admin",
        overrides: {
          decisionState: "admin_resolution",
          clinicalMeaningState: "bounded_admin_only",
          operationalFollowUpScope: "bounded_admin_resolution",
          adminMutationAuthorityState: "bounded_admin_only",
          adminResolutionSubtypeRef: "demographic_correction",
          reasonCodeRefs: ["current_endpoint_admin_resolution"],
        },
      },
      {
        taskId: "task_249_legal_review",
        overrides: {
          decisionState: "clinician_review_required",
          clinicalMeaningState: "clinician_reentry_required",
          operationalFollowUpScope: "none",
          adminMutationAuthorityState: "frozen",
          reasonCodeRefs: ["current_endpoint_requires_clinician_review"],
          reopenState: "reopen_required",
        },
      },
    ];

    for (const entry of legalCases) {
      const result = await service.classifyBoundaryDecision(
        buildBoundaryInput(entry.taskId, entry.overrides),
      );
      expect(result.boundaryDecision.taskId).toBe(entry.taskId);
      expect(result.boundaryDecision.boundaryState).not.toBe("superseded");
    }

    const illegalCases: Array<{
      label: string;
      overrides: Partial<ClassifySelfCareBoundaryInput>;
    }> = [
      {
        label: "self-care cannot widen into bounded-admin meaning",
        overrides: {
          decisionState: "self_care",
          clinicalMeaningState: "bounded_admin_only",
          operationalFollowUpScope: "bounded_admin_resolution",
          adminMutationAuthorityState: "bounded_admin_only",
        },
      },
      {
        label: "admin-resolution cannot strip bounded-admin authority",
        overrides: {
          decisionState: "admin_resolution",
          clinicalMeaningState: "informational_only",
          operationalFollowUpScope: "self_serve_guidance",
          adminMutationAuthorityState: "none",
        },
      },
      {
        label: "clinician-review states must freeze admin mutation authority",
        overrides: {
          decisionState: "blocked_pending_review",
          clinicalMeaningState: "clinician_reentry_required",
          operationalFollowUpScope: "self_serve_guidance",
          adminMutationAuthorityState: "none",
        },
      },
    ];

    for (const [index, entry] of illegalCases.entries()) {
      await expect(
        service.classifyBoundaryDecision(
          buildBoundaryInput(`task_249_illegal_${index}`, entry.overrides),
        ),
        entry.label,
      ).rejects.toThrowError();
    }
  });

  it("reuses idempotent boundary replay and writes one supersession record when the tuple drifts", async () => {
    const repositories = createPhase3SelfCareBoundaryKernelStore();
    const service = createPhase3SelfCareBoundaryKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_self_care_boundary_replay"),
    });

    const first = await service.classifyBoundaryDecision(
      buildBoundaryInput("task_249_boundary_replay"),
    );
    const replay = await service.classifyBoundaryDecision(
      buildBoundaryInput("task_249_boundary_replay", {
        decidedAt: "2026-04-17T09:01:00.000Z",
        reasonCodeRefs: ["current_endpoint_self_care", "replayed_submit"],
      }),
    );
    const replacement = await service.classifyBoundaryDecision(
      buildBoundaryInput("task_249_boundary_replay", {
        decisionEpochRef: "decision_epoch_task_249_boundary_replay_v2",
        decisionState: "admin_resolution",
        clinicalMeaningState: "bounded_admin_only",
        operationalFollowUpScope: "bounded_admin_resolution",
        adminMutationAuthorityState: "bounded_admin_only",
        adminResolutionSubtypeRef: "booking_support",
        reasonCodeRefs: ["current_endpoint_admin_resolution"],
        decidedAt: "2026-04-17T09:02:00.000Z",
      }),
    );
    const bundle = await service.queryTaskBundle("task_249_boundary_replay");

    expect(replay.boundaryDecision.selfCareBoundaryDecisionId).toBe(
      first.boundaryDecision.selfCareBoundaryDecisionId,
    );
    expect(replay.supersessionRecord).toBeNull();
    expect(replacement.supersededBoundaryDecision?.boundaryState).toBe("superseded");
    expect(replacement.supersessionRecord?.priorBoundaryDecisionRef).toBe(
      first.boundaryDecision.selfCareBoundaryDecisionId,
    );
    expect(bundle.currentBoundaryDecision?.decisionState).toBe("admin_resolution");
    expect(bundle.latestBoundarySupersessionRecord?.replacementBoundaryDecisionRef).toBe(
      replacement.boundaryDecision.selfCareBoundaryDecisionId,
    );
  });

  it("deduplicates grant replay, supersedes replaced grants, and expires due live grants", async () => {
    const repositories = createPhase3SelfCareBoundaryKernelStore();
    const service = createPhase3SelfCareBoundaryKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_self_care_grant_replay"),
    });

    const boundary = await service.classifyBoundaryDecision(
      buildBoundaryInput("task_249_grant_replay"),
    );
    const first = await service.issueAdviceEligibilityGrant(
      buildGrantInput(
        "task_249_grant_replay",
        boundary.boundaryDecision.selfCareBoundaryDecisionId,
      ),
    );
    const replay = await service.issueAdviceEligibilityGrant(
      buildGrantInput(
        "task_249_grant_replay",
        boundary.boundaryDecision.selfCareBoundaryDecisionId,
        {
          issuedAt: "2026-04-17T09:11:00.000Z",
        },
      ),
    );
    const replacement = await service.issueAdviceEligibilityGrant(
      buildGrantInput(
        "task_249_grant_replay",
        boundary.boundaryDecision.selfCareBoundaryDecisionId,
        {
          adviceBundleVersionRef: "advice_bundle_249_v2",
          issuedAt: "2026-04-17T09:12:00.000Z",
          expiresAt: "2026-04-17T09:13:00.000Z",
        },
      ),
    );
    const expired = await service.expireDueAdviceEligibilityGrants("2026-04-17T09:14:00.000Z");
    const bundle = await service.queryTaskBundle("task_249_grant_replay");

    expect(replay.adviceEligibilityGrant.adviceEligibilityGrantId).toBe(
      first.adviceEligibilityGrant.adviceEligibilityGrantId,
    );
    expect(replay.transitionRecord).toBeNull();
    expect(replacement.supersededGrant?.grantState).toBe("superseded");
    expect(replacement.transitionRecord?.replacementGrantRef).toBe(
      replacement.adviceEligibilityGrant.adviceEligibilityGrantId,
    );
    expect(expired).toHaveLength(1);
    expect(expired[0].adviceEligibilityGrant.adviceEligibilityGrantId).toBe(
      replacement.adviceEligibilityGrant.adviceEligibilityGrantId,
    );
    expect(expired[0].adviceEligibilityGrant.grantState).toBe("expired");
    expect(bundle.currentAdviceEligibilityGrant).toBeNull();
  });
});
