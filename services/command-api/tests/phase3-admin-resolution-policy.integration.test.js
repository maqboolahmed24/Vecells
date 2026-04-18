import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_ADMIN_RESOLUTION_POLICY_QUERY_SURFACES,
  PHASE3_ADMIN_RESOLUTION_POLICY_SCHEMA_VERSION,
  PHASE3_ADMIN_RESOLUTION_POLICY_SERVICE_NAME,
  createPhase3AdminResolutionPolicyApplication,
  phase3AdminResolutionPolicyMigrationPlanRefs,
  phase3AdminResolutionPolicyPersistenceTables,
  phase3AdminResolutionPolicyRoutes,
} from "../src/phase3-admin-resolution-policy.ts";

function buildFixture(seed, overrides = {}) {
  const boundaryDecision = {
    selfCareBoundaryDecisionId: `boundary_${seed}`,
    taskId: `task_${seed}`,
    requestRef: `request_${seed}`,
    evidenceSnapshotRef: `evidence_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionSupersessionRecordRef: null,
    decisionState: "admin_resolution",
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reasonCodeRefs: ["current_endpoint_admin_resolution"],
    adminResolutionSubtypeRef: "demographic_correction",
    routeIntentBindingRef: `route_intent_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    lineageFenceEpoch: 4,
    dependencySetRef: `dependency_${seed}`,
    adviceRenderSettlementRef: null,
    adminResolutionCaseRef: null,
    selfCareExperienceProjectionRef: null,
    adminResolutionExperienceProjectionRef: null,
    reopenTriggerRefs: [],
    reopenState: "stable",
    boundaryState: "live",
    boundaryTupleHash: `boundary_tuple_${seed}`,
    compiledPolicyBundleRef: "policy_bundle_251_v1",
    decidedAt: "2026-04-17T12:00:00.000Z",
    version: 1,
  };
  const adminResolutionStarter = {
    adminResolutionStarterId: `admin_resolution_starter_${seed}`,
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
    episodeRef: `episode_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionId: `decision_${seed}`,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    lifecycleLeaseRef: `lifecycle_lease_${seed}`,
    leaseAuthorityRef: "lease_authority_admin_resolution_seed",
    leaseTtlSeconds: 600,
    ownershipEpoch: 2,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 4,
    adminResolutionSubtypeRef: "demographic_correction",
    summaryText: "Update demographics through bounded admin flow.",
    commandActionRecordRef: `command_action_${seed}`,
    commandSettlementRecordRef: `command_settlement_${seed}`,
    starterState: "live",
    decisionSupersessionRecordRef: null,
    createdAt: "2026-04-17T12:00:00.000Z",
    updatedAt: "2026-04-17T12:00:00.000Z",
    version: 1,
  };

  const fixture = {
    boundaryDecision,
    adminResolutionStarter,
    bundle: {
      boundaryBundle: {
        currentBoundaryDecision: boundaryDecision,
        currentAdviceEligibilityGrant: null,
        boundaryDecisions: [boundaryDecision],
        adviceEligibilityGrants: [],
        latestBoundarySupersessionRecord: null,
        latestGrantTransitionRecord: null,
      },
      endpointBundle: null,
      approvalBundle: null,
      directResolutionBundle: {
        settlement: {
          settlementId: `settlement_${seed}`,
          taskId: `task_${seed}`,
          requestId: `request_${seed}`,
          requestLineageRef: `request_lineage_${seed}`,
          decisionEpochRef: `decision_epoch_${seed}`,
          decisionId: `decision_${seed}`,
          endpointCode: "admin_resolution",
          settlementClass: "direct_resolution",
          triageTaskStatus: "resolved_without_appointment",
          callbackSeedRef: null,
          clinicianMessageSeedRef: null,
          selfCareStarterRef: null,
          adminResolutionStarterRef: `admin_resolution_starter_${seed}`,
          bookingIntentRef: null,
          pharmacyIntentRef: null,
          lineageCaseLinkRef: `lineage_case_link_${seed}`,
          presentationArtifactRef: `presentation_${seed}`,
          patientStatusProjectionRef: `status_projection_${seed}`,
          lifecycleHookEffectRef: `lifecycle_hook_${seed}`,
          closureEvaluationEffectRef: null,
          settlementState: "settled",
          commandActionRecordRef: `command_action_${seed}`,
          commandSettlementRecordRef: `command_settlement_${seed}`,
          routeIntentBindingRef: `route_intent_${seed}`,
          decisionSupersessionRecordRef: null,
          recordedAt: "2026-04-17T12:00:00.000Z",
          version: 1,
        },
        callbackSeed: null,
        clinicianMessageSeed: null,
        selfCareStarter: null,
        adminResolutionStarter,
        bookingIntent: null,
        pharmacyIntent: null,
        presentationArtifact: null,
        patientStatusProjection: null,
        outboxEntries: [],
      },
      effectiveAdviceGrantState: null,
      effectiveAdviceGrantReasonCodeRefs: [],
    },
  };

  if (overrides.boundaryDecision) {
    Object.assign(boundaryDecision, overrides.boundaryDecision);
  }
  if (overrides.adminResolutionStarter) {
    Object.assign(adminResolutionStarter, overrides.adminResolutionStarter);
  }

  return fixture;
}

describe("phase 3 admin-resolution policy application", () => {
  it("publishes the 251 admin-resolution routes in the command-api route catalog", () => {
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    for (const route of phase3AdminResolutionPolicyRoutes) {
      expect(routeIds.has(route.routeId)).toBe(true);
    }

    expect(PHASE3_ADMIN_RESOLUTION_POLICY_SERVICE_NAME).toBe(
      "Phase3AdminResolutionPolicyApplication",
    );
    expect(PHASE3_ADMIN_RESOLUTION_POLICY_SCHEMA_VERSION).toBe(
      "251.phase3.admin-resolution-case-policy.v1",
    );
    expect(PHASE3_ADMIN_RESOLUTION_POLICY_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/admin-resolution",
    ]);
    expect(phase3AdminResolutionPolicyPersistenceTables).toContain(
      "phase3_admin_resolution_cases",
    );
    expect(phase3AdminResolutionPolicyMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/127_phase3_admin_resolution_case_policy_kernel.sql",
    );
  });

  it("opens bounded admin work from the live 249 boundary tuple and normalizes legacy subtype labels", async () => {
    const fixture = buildFixture("251_open");
    const application = createPhase3AdminResolutionPolicyApplication({
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary(taskId) {
          expect(taskId).toBe("task_251_open");
          return fixture.bundle;
        },
      },
    });

    const opened = await application.openAdminResolutionCase({
      taskId: "task_251_open",
      actorRef: "actor_251",
      openedAt: "2026-04-17T12:05:00.000Z",
    });
    expect(
      opened.adminResolutionBundle.currentAdminResolutionCase.adminResolutionSubtypeRef,
    ).toBe("registration_or_demographic_update");

    const policy = await application.querySubtypePolicy("demographic_correction");
    expect(policy?.adminResolutionSubtypeRef).toBe("registration_or_demographic_update");

    const waiting = await application.enterAdminResolutionWaitingState({
      taskId: "task_251_open",
      adminResolutionCaseId:
        opened.adminResolutionBundle.currentAdminResolutionCase.adminResolutionCaseId,
      waitingState: "identity_verification",
      waitingReasonCodeRef: "identity_evidence_requested",
      dependencyShape: "identity_verification",
      ownerRef: "actor_251",
      slaClockSourceRef: "sla_clock.identity_verification",
      expiryOrRepairRuleRef: "expiry_or_repair.identity_verification",
      recordedAt: "2026-04-17T12:10:00.000Z",
    });
    expect(waiting.adminResolutionBundle.currentAdminResolutionCase.caseState).toBe("waiting");

    const resumed = await application.cancelAdminResolutionWait({
      taskId: "task_251_open",
      adminResolutionCaseId:
        waiting.adminResolutionBundle.currentAdminResolutionCase.adminResolutionCaseId,
      actorRef: "actor_251",
      recordedAt: "2026-04-17T12:12:00.000Z",
    });
    expect(resumed.adminResolutionBundle.currentAdminResolutionCase.waitingState).toBe("none");

    const completed = await application.recordAdminResolutionCompletionArtifact({
      taskId: "task_251_open",
      adminResolutionCaseId:
        resumed.adminResolutionBundle.currentAdminResolutionCase.adminResolutionCaseId,
      completionType: "demographics_updated",
      completionEvidenceRefs: ["evidence_demographics_updated_1"],
      patientVisibleSummaryRef: "summary_demographics_updated",
      recordedAt: "2026-04-17T12:20:00.000Z",
    });
    expect(completed.effectiveCaseState).toBe("completion_artifact_recorded");
    expect(
      completed.adminResolutionBundle.currentCompletionArtifact.completionType,
    ).toBe("demographics_updated");
  });

  it("rejects admin case opening when the current decision epoch has drifted from the stored starter tuple", async () => {
    const fixture = buildFixture("251_epoch_drift", {
      adminResolutionStarter: {
        decisionEpochRef: "decision_epoch_251_epoch_drift_v2",
      },
    });
    const application = createPhase3AdminResolutionPolicyApplication({
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary() {
          return fixture.bundle;
        },
      },
    });

    await expect(
      application.openAdminResolutionCase({
        taskId: "task_251_epoch_drift",
        actorRef: "actor_251",
        openedAt: "2026-04-17T12:05:00.000Z",
      }),
    ).rejects.toThrowError();
  });

  it("freezes further admin consequence when the upstream 249 boundary drifts out of bounded-admin posture", async () => {
    const fixture = buildFixture("251_boundary_drift");
    const application = createPhase3AdminResolutionPolicyApplication({
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary() {
          return fixture.bundle;
        },
      },
    });

    const opened = await application.openAdminResolutionCase({
      taskId: "task_251_boundary_drift",
      actorRef: "actor_251",
      openedAt: "2026-04-17T12:05:00.000Z",
    });

    fixture.boundaryDecision.decisionState = "clinician_review_required";
    fixture.boundaryDecision.clinicalMeaningState = "clinician_reentry_required";
    fixture.boundaryDecision.operationalFollowUpScope = "none";
    fixture.boundaryDecision.adminMutationAuthorityState = "frozen";
    fixture.boundaryDecision.reopenState = "reopen_required";
    fixture.boundaryDecision.boundaryState = "reopened";

    const frozen = await application.queryTaskAdminResolution("task_251_boundary_drift");
    expect(frozen.effectiveCaseState).toBe("frozen");
    expect(frozen.effectiveReasonCodeRefs).toContain(
      "clinical_meaning_not_bounded_admin_only",
    );

    await expect(
      application.reclassifyAdminResolutionSubtype({
        taskId: "task_251_boundary_drift",
        adminResolutionCaseId:
          opened.adminResolutionBundle.currentAdminResolutionCase.adminResolutionCaseId,
        nextSubtypeRef: "form_workflow",
        actorRef: "actor_251",
        recordedAt: "2026-04-17T12:10:00.000Z",
      }),
    ).rejects.toThrowError();
  });
});
