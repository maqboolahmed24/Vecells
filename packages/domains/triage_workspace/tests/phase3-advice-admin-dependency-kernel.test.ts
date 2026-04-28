import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3AdviceAdminDependencyKernelService,
  createPhase3AdviceAdminDependencyKernelStore,
  type EvaluateAdviceAdminDependencySetInput,
} from "../src/index.ts";

function buildInput(
  taskId: string,
  overrides: Partial<EvaluateAdviceAdminDependencySetInput> = {},
): EvaluateAdviceAdminDependencySetInput {
  return {
    taskId,
    requestRef: `request_${taskId}`,
    boundaryDecisionRef: `boundary_${taskId}`,
    boundaryTupleHash: `boundary_tuple_${taskId}`,
    boundaryDecisionState: "admin_resolution",
    boundaryState: "live",
    boundaryReopenState: "stable",
    boundaryEvidenceSnapshotRef: `evidence_${taskId}`,
    decisionEpochRef: `decision_epoch_${taskId}`,
    decisionSupersessionRecordRef: null,
    lineageFenceEpoch: 4,
    adminResolutionSubtypeRef: "registration_or_demographic_update",
    currentDecisionEpochRef: `decision_epoch_${taskId}`,
    currentLineageFenceEpoch: 4,
    currentEvidenceSnapshotRef: `evidence_${taskId}`,
    currentSafetyPreemptionRef: null,
    currentUrgentDiversionSettlementRef: null,
    taskStatus: "resolved_without_appointment",
    adviceRenderSettlementRef: `advice_render_${taskId}`,
    currentAdviceRenderState: "renderable",
    currentAdviceRenderTrustState: "trusted",
    adminResolutionCaseRef: `admin_case_${taskId}`,
    currentAdminResolutionCaseState: "queued",
    currentAdminResolutionWaitingState: "none",
    currentAdminResolutionDependencyShape: null,
    currentAdminResolutionReasonRef: null,
    currentAdminResolutionContinuityState: "current",
    currentAdminResolutionContinuityReasons: [],
    reachabilityDependencyRef: null,
    contactRepairJourneyRef: null,
    reachabilityEpoch: null,
    reachabilityAssessmentState: null,
    reachabilityRouteAuthorityState: null,
    reachabilityRecoveryRouteRef: null,
    deliveryDisputeRef: null,
    deliveryDisputeRecoveryRouteRef: null,
    consentCheckpointRef: null,
    consentRecoveryRouteRef: null,
    identityRepairCaseRef: null,
    identityBlockingVersionRef: null,
    identityRecoveryRouteRef: null,
    externalDependencyRef: null,
    externalDependencyVersionRef: null,
    externalRecoveryRouteRef: null,
    reasonCodeRefs: [],
    evaluationTriggerRef: "evaluate_advice_admin_dependency_set",
    evaluatedByRef: "actor_252",
    evaluatedAt: "2026-04-17T12:00:00.000Z",
    ...overrides,
  };
}

describe("phase 3 advice-admin dependency kernel", () => {
  it("keeps dependency repair blockers distinct from reopen and clinical reentry triggers", async () => {
    const repositories = createPhase3AdviceAdminDependencyKernelStore();
    const service = createPhase3AdviceAdminDependencyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_admin_dependency_distinct"),
    });

    const result = await service.evaluateAdviceAdminDependencySet(
      buildInput("task_252_distinct", {
        contactRepairJourneyRef: "repair_journey_252",
        reachabilityDependencyRef: "reachability_dependency_252",
        reachabilityAssessmentState: "blocked",
        currentSafetyPreemptionRef: "safety_preemption_252",
      }),
    );

    expect(result.adviceAdminDependencySet.dependencyState).toBe("repair_required");
    expect(result.adviceAdminDependencySet.reopenState).toBe("reopen_required");
    expect(result.adviceAdminDependencySet.activeBlockerRefs).toContain("repair_journey_252");
    expect(result.adviceAdminDependencySet.clinicalReentryTriggerRefs).toContain(
      "safety_preemption_requires_clinician_reentry",
    );
    expect(result.projection.canContinueCurrentConsequence).toBe(false);
  });

  it("reuses an idempotent evaluation on the same tuple and digest", async () => {
    const repositories = createPhase3AdviceAdminDependencyKernelStore();
    const service = createPhase3AdviceAdminDependencyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_admin_dependency_replay"),
    });

    const first = await service.evaluateAdviceAdminDependencySet(
      buildInput("task_252_replay"),
    );
    const replay = await service.evaluateAdviceAdminDependencySet(
      buildInput("task_252_replay", {
        evaluatedAt: "2026-04-17T12:01:00.000Z",
        evaluationTriggerRef: "refresh_advice_admin_dependency_set",
      }),
    );

    expect(replay.reusedExisting).toBe(true);
    expect(replay.adviceAdminDependencySet.adviceAdminDependencySetId).toBe(
      first.adviceAdminDependencySet.adviceAdminDependencySetId,
    );
  });

  it("forces reopen when advice render invalidates or material evidence drifts", async () => {
    const repositories = createPhase3AdviceAdminDependencyKernelStore();
    const service = createPhase3AdviceAdminDependencyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_admin_dependency_reopen"),
    });

    const result = await service.evaluateAdviceAdminDependencySet(
      buildInput("task_252_reopen", {
        currentAdviceRenderState: "invalidated",
        currentEvidenceSnapshotRef: "evidence_252_reopen_v2",
      }),
    );

    expect(result.adviceAdminDependencySet.reopenState).toBe("reopen_required");
    expect(result.adviceAdminDependencySet.reopenTriggerRefs).toContain(
      "advice_render_invalidated_requires_reopen",
    );
    expect(result.adviceAdminDependencySet.clinicalReentryTriggerRefs).toContain(
      "material_evidence_drift_requires_boundary_review",
    );
  });

  it("applies stable blocker precedence across blocker combinations", async () => {
    const repositories = createPhase3AdviceAdminDependencyKernelStore();
    const service = createPhase3AdviceAdminDependencyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_admin_dependency_precedence"),
    });

    const cases: Array<{
      label: string;
      overrides: Partial<EvaluateAdviceAdminDependencySetInput>;
      expectedDependencyState: string;
    }> = [
      {
        label: "identity outranks every non-clinical blocker",
        overrides: {
          identityRepairCaseRef: "identity_case_252",
          deliveryDisputeRef: "delivery_dispute_252",
          contactRepairJourneyRef: "repair_journey_252",
          reachabilityDependencyRef: "reachability_dependency_252",
          reachabilityAssessmentState: "blocked",
        },
        expectedDependencyState: "blocked_pending_identity",
      },
      {
        label: "consent outranks reachability and dispute when identity is clear",
        overrides: {
          consentCheckpointRef: "consent_checkpoint_252",
          deliveryDisputeRef: "delivery_dispute_252",
          contactRepairJourneyRef: "repair_journey_252",
          reachabilityDependencyRef: "reachability_dependency_252",
          reachabilityAssessmentState: "blocked",
        },
        expectedDependencyState: "blocked_pending_consent",
      },
      {
        label: "reachability outranks delivery dispute and external dependency",
        overrides: {
          deliveryDisputeRef: "delivery_dispute_252",
          externalDependencyRef: "external_dependency_252",
          contactRepairJourneyRef: "repair_journey_252",
          reachabilityDependencyRef: "reachability_dependency_252",
          reachabilityAssessmentState: "blocked",
        },
        expectedDependencyState: "repair_required",
      },
      {
        label: "delivery dispute outranks external dependency when route repair is absent",
        overrides: {
          deliveryDisputeRef: "delivery_dispute_252",
          externalDependencyRef: "external_dependency_252",
        },
        expectedDependencyState: "disputed",
      },
      {
        label: "external dependency is last ordinary blocker",
        overrides: {
          externalDependencyRef: "external_dependency_252",
        },
        expectedDependencyState: "blocked_pending_external_confirmation",
      },
    ];

    for (const [index, testCase] of cases.entries()) {
      const result = await service.evaluateAdviceAdminDependencySet(
        buildInput(`task_252_precedence_${index}`, testCase.overrides),
      );
      expect(result.adviceAdminDependencySet.dependencyState, testCase.label).toBe(
        testCase.expectedDependencyState,
      );
    }
  });

  it("serializes concurrent evaluations onto one current set per tuple", async () => {
    const repositories = createPhase3AdviceAdminDependencyKernelStore();
    const service = createPhase3AdviceAdminDependencyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_admin_dependency_concurrency"),
    });

    const [first, second, third] = await Promise.all([
      service.evaluateAdviceAdminDependencySet(buildInput("task_252_concurrency")),
      service.evaluateAdviceAdminDependencySet(buildInput("task_252_concurrency")),
      service.refreshAdviceAdminDependencySet(
        buildInput("task_252_concurrency", {
          evaluatedAt: "2026-04-17T12:00:01.000Z",
        }),
      ),
    ]);

    const bundle = await service.queryTaskBundle("task_252_concurrency");
    expect(bundle.adviceAdminDependencySets).toHaveLength(1);
    expect(first.adviceAdminDependencySet.adviceAdminDependencySetId).toBe(
      second.adviceAdminDependencySet.adviceAdminDependencySetId,
    );
    expect(third.adviceAdminDependencySet.adviceAdminDependencySetId).toBe(
      first.adviceAdminDependencySet.adviceAdminDependencySetId,
    );
  });
});
