import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3AdminResolutionPolicyKernelService,
  createPhase3AdminResolutionPolicyKernelStore,
  type AdminResolutionSubtypeRef,
  type OpenAdminResolutionCaseInput,
} from "../src/index.ts";

function buildOpenInput(
  taskId: string,
  adminResolutionSubtypeRef: AdminResolutionSubtypeRef = "registration_or_demographic_update",
  overrides: Partial<OpenAdminResolutionCaseInput> = {},
): OpenAdminResolutionCaseInput {
  return {
    episodeRef: `episode_${taskId}`,
    requestRef: `request_${taskId}`,
    requestLineageRef: `request_lineage_${taskId}`,
    lineageCaseLinkRef: `lineage_case_link_${taskId}`,
    sourceTriageTaskRef: taskId,
    sourceAdminResolutionStarterRef: `admin_resolution_starter_${taskId}`,
    sourceDomainRef: "phase3_direct_resolution",
    sourceDecisionRef: `decision_${taskId}`,
    sourceLineageRef: `request_lineage_${taskId}`,
    adminResolutionSubtypeRef,
    boundaryDecisionRef: `boundary_${taskId}`,
    boundaryTupleHash: `boundary_tuple_${taskId}`,
    boundaryState: "live",
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    decisionEpochRef: `decision_epoch_${taskId}`,
    decisionSupersessionRecordRef: null,
    policyBundleRef: "policy_bundle_251_v1",
    lineageFenceEpoch: 3,
    currentOwnerRef: `actor_${taskId}`,
    dependencySetRef: `dependency_${taskId}`,
    reopenState: "stable",
    openedAt: "2026-04-17T12:00:00.000Z",
    ...overrides,
  };
}

describe("phase 3 admin-resolution policy kernel", () => {
  it("accepts only legal bounded-admin case opening tuples", async () => {
    const repositories = createPhase3AdminResolutionPolicyKernelStore();
    const service = createPhase3AdminResolutionPolicyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_tuple_law"),
    });

    const legalInputs: OpenAdminResolutionCaseInput[] = [
      buildOpenInput("task_251_legal_registration"),
      buildOpenInput("task_251_legal_routed", "routed_admin_task"),
      buildOpenInput("task_251_legal_form", "form_workflow"),
    ];

    for (const input of legalInputs) {
      const opened = await service.openAdminResolutionCase(input);
      expect(opened.adminResolutionCase.boundaryDecisionRef).toBe(input.boundaryDecisionRef);
      expect(opened.adminResolutionCase.adminResolutionSubtypeRef).toBe(
        input.adminResolutionSubtypeRef,
      );
    }

    const illegalInputs: Array<{
      label: string;
      overrides: Partial<OpenAdminResolutionCaseInput>;
    }> = [
      {
        label: "boundary must stay live",
        overrides: {
          boundaryState: "blocked",
        },
      },
      {
        label: "clinical meaning must remain bounded admin only",
        overrides: {
          clinicalMeaningState: "informational_only",
        },
      },
      {
        label: "follow-up scope must remain bounded admin resolution",
        overrides: {
          operationalFollowUpScope: "self_serve_guidance",
        },
      },
      {
        label: "admin mutation authority must remain bounded",
        overrides: {
          adminMutationAuthorityState: "frozen",
        },
      },
      {
        label: "reopen state must remain stable",
        overrides: {
          reopenState: "reopened",
        },
      },
    ];

    for (const [index, entry] of illegalInputs.entries()) {
      await expect(
        service.openAdminResolutionCase(
          buildOpenInput(
            `task_251_illegal_${index}`,
            "registration_or_demographic_update",
            entry.overrides,
          ),
        ),
        entry.label,
      ).rejects.toThrowError();
    }
  });

  it("publishes the canonical initial subtype set and reuses idempotent open on the same tuple", async () => {
    const repositories = createPhase3AdminResolutionPolicyKernelStore();
    const service = createPhase3AdminResolutionPolicyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_registry"),
    });

    const profiles = await service.listSubtypeProfiles();
    expect(profiles.map((profile) => profile.adminResolutionSubtypeRef)).toEqual([
      "document_or_letter_workflow",
      "form_workflow",
      "medication_admin_query",
      "registration_or_demographic_update",
      "result_follow_up_workflow",
      "routed_admin_task",
    ]);

    const first = await service.openAdminResolutionCase(
      buildOpenInput("task_251_idempotent_open"),
    );
    const replay = await service.openAdminResolutionCase(
      buildOpenInput("task_251_idempotent_open", "registration_or_demographic_update", {
        openedAt: "2026-04-17T12:01:00.000Z",
      }),
    );

    expect(replay.reusedExisting).toBe(true);
    expect(replay.adminResolutionCase.adminResolutionCaseId).toBe(
      first.adminResolutionCase.adminResolutionCaseId,
    );
  });

  it("requires owner, dependency shape, sla clock, and expiry or repair rules for waiting state transitions", async () => {
    const repositories = createPhase3AdminResolutionPolicyKernelStore();
    const service = createPhase3AdminResolutionPolicyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_waiting"),
    });

    const opened = await service.openAdminResolutionCase(
      buildOpenInput("task_251_waiting"),
    );

    await expect(
      service.enterAdminResolutionWaitingState({
        adminResolutionCaseId: opened.adminResolutionCase.adminResolutionCaseId,
        waitingState: "identity_verification",
        waitingReasonCodeRef: "identity_evidence_requested",
        dependencyShape: "internal_team",
        ownerRef: "actor_waiting",
        slaClockSourceRef: "sla_clock.identity_verification",
        expiryOrRepairRuleRef: "expiry_or_repair.identity_verification",
        enteredAt: "2026-04-17T12:05:00.000Z",
      }),
    ).rejects.toThrowError();

    const waiting = await service.enterAdminResolutionWaitingState({
      adminResolutionCaseId: opened.adminResolutionCase.adminResolutionCaseId,
      waitingState: "identity_verification",
      waitingReasonCodeRef: "identity_evidence_requested",
      dependencyShape: "identity_verification",
      ownerRef: "actor_waiting",
      slaClockSourceRef: "sla_clock.identity_verification",
      expiryOrRepairRuleRef: "expiry_or_repair.identity_verification",
      enteredAt: "2026-04-17T12:05:00.000Z",
    });

    expect(waiting.adminResolutionCase.caseState).toBe("waiting");
    expect(waiting.adminResolutionCase.waitingOwnerRoleRef).toBe("identity_repair_team");
    expect(waiting.adminResolutionCase.waitingSlaClockSourceRef).toBe(
      "sla_clock.identity_verification",
    );
  });

  it("rejects generic done and requires typed completion artifacts", async () => {
    const repositories = createPhase3AdminResolutionPolicyKernelStore();
    const service = createPhase3AdminResolutionPolicyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_completion"),
    });

    const formCase = await service.openAdminResolutionCase(
      buildOpenInput("task_251_completion_form", "form_workflow"),
    );
    await expect(
      service.recordAdminResolutionCompletionArtifact({
        adminResolutionCaseId: formCase.adminResolutionCase.adminResolutionCaseId,
        completionType: "form_submitted",
        completionEvidenceRefs: [],
        patientVisibleSummaryRef: "summary_form_submitted",
        recordedAt: "2026-04-17T12:20:00.000Z",
      }),
    ).rejects.toThrowError();

    const resultCase = await service.openAdminResolutionCase(
      buildOpenInput("task_251_completion_results", "result_follow_up_workflow"),
    );
    await expect(
      service.recordAdminResolutionCompletionArtifact({
        adminResolutionCaseId: resultCase.adminResolutionCase.adminResolutionCaseId,
        completionType: "result_notice_delivered",
        completionEvidenceRefs: ["result_notice_evidence_1"],
        patientVisibleSummaryRef: "summary_result_notice",
        recordedAt: "2026-04-17T12:21:00.000Z",
      }),
    ).rejects.toThrowError();

    const completed = await service.recordAdminResolutionCompletionArtifact({
      adminResolutionCaseId: formCase.adminResolutionCase.adminResolutionCaseId,
      completionType: "form_submitted",
      completionEvidenceRefs: ["form_submission_evidence_1"],
      patientVisibleSummaryRef: "summary_form_submitted",
      recordedAt: "2026-04-17T12:22:00.000Z",
    });

    expect(completed.completionArtifact.artifactState).toBe("recorded");
    expect(completed.adminResolutionCase.caseState).toBe("completion_artifact_recorded");
  });

  it("freezes routed_admin_task after the governed reclassification window elapses", async () => {
    const repositories = createPhase3AdminResolutionPolicyKernelStore();
    const service = createPhase3AdminResolutionPolicyKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_admin_resolution_routed"),
    });

    const opened = await service.openAdminResolutionCase(
      buildOpenInput("task_251_routed_timeout", "routed_admin_task", {
        openedAt: "2026-04-17T08:00:00.000Z",
      }),
    );

    const continuity = await service.evaluateCaseContinuity({
      taskId: "task_251_routed_timeout",
      currentBoundaryDecisionRef: "boundary_task_251_routed_timeout",
      currentBoundaryTupleHash: "boundary_tuple_task_251_routed_timeout",
      currentBoundaryState: "live",
      currentClinicalMeaningState: "bounded_admin_only",
      currentOperationalFollowUpScope: "bounded_admin_resolution",
      currentAdminMutationAuthorityState: "bounded_admin_only",
      currentDecisionEpochRef: "decision_epoch_task_251_routed_timeout",
      currentDecisionSupersessionRecordRef: null,
      currentReopenState: "stable",
      evaluatedAt: "2026-04-17T13:00:01.000Z",
    });

    expect(continuity.effectiveCaseState).toBe("frozen");
    expect(continuity.reclassificationDeadlineState).toBe("elapsed");
    expect(continuity.effectiveReasonCodeRefs).toContain(
      "routed_admin_task_reclassification_window_elapsed",
    );

    await expect(
      service.reclassifyAdminResolutionSubtype({
        adminResolutionCaseId: opened.adminResolutionCase.adminResolutionCaseId,
        nextSubtypeRef: "registration_or_demographic_update",
        currentOwnerRef: "actor_timeout",
        recordedAt: "2026-04-17T13:00:01.000Z",
      }),
    ).rejects.toThrowError();
  });
});
