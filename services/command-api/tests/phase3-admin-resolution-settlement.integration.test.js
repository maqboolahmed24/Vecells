import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_ADMIN_RESOLUTION_SETTLEMENT_QUERY_SURFACES,
  PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SCHEMA_VERSION,
  PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SERVICE_NAME,
  createPhase3AdminResolutionSettlementApplication,
  phase3AdminResolutionSettlementMigrationPlanRefs,
  phase3AdminResolutionSettlementPersistenceTables,
  phase3AdminResolutionSettlementRoutes,
} from "../src/phase3-admin-resolution-settlement.ts";

function buildContinuityBundle(seed, mode = "interactive") {
  const isRecovery = mode === "recovery_required";
  return {
    task: {
      taskId: `task_${seed}`,
      taskCompletionSettlementEnvelopeRef: `task_completion_envelope_${seed}_${mode}`,
      fencingToken: `fencing_token_${seed}_${mode}`,
    },
    reviewSession: {
      reviewSessionId: `review_session_${seed}_${mode}`,
      surfaceRouteContractRef: "surface_route_contract.workspace.admin_resolution",
      surfacePublicationRef: "surface_publication.workspace.admin_resolution.current",
      runtimePublicationBundleRef: "runtime_publication_bundle.workspace.admin_resolution.current",
      selectedAnchorRef: `anchor_${seed}_${mode}`,
      reviewActionLeaseRef: `review_action_lease_${seed}_${mode}`,
    },
    launchContext: {},
    completionEnvelope: {
      taskCompletionSettlementEnvelopeId: `task_completion_envelope_${seed}_${mode}`,
    },
    operatorHandoffFrame: null,
    workspaceContinuityEvidenceProjection: {
      workspaceContinuityEvidenceProjectionId: `workspace_continuity_projection_${seed}_${mode}`,
      validationState: isRecovery ? "blocked" : "trusted",
    },
    workspaceTrustEnvelope: {
      workspaceTrustEnvelopeId: `workspace_trust_envelope_${seed}_${mode}`,
      envelopeState: mode,
      mutationAuthorityState: isRecovery ? "recovery_only" : "live",
      workspaceConsistencyProjectionRef: `workspace_consistency_projection_${seed}_${mode}`,
      workspaceSliceTrustProjectionRef: `workspace_slice_trust_projection_${seed}_${mode}`,
      blockingReasonRefs: isRecovery ? ["reopen_requires_review"] : [],
    },
    nextTaskLaunchLease: null,
    directResolution: {},
    approval: {},
    reopenRecord: null,
  };
}

function buildFixture(seed, overrides = {}) {
  const boundaryDecision = {
    selfCareBoundaryDecisionId: `boundary_${seed}`,
    requestRef: `request_${seed}`,
    boundaryTupleHash: `boundary_tuple_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionSupersessionRecordRef: null,
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reopenState: "stable",
    boundaryState: "live",
    reasonCodeRefs: ["admin_resolution_boundary_current"],
    routeIntentBindingRef: `route_intent_binding_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
  };
  const currentCase = {
    adminResolutionCaseId: `admin_case_${seed}`,
    boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
    boundaryTupleHash: boundaryDecision.boundaryTupleHash,
    decisionEpochRef: boundaryDecision.decisionEpochRef,
    dependencySetRef: `dependency_set_${seed}`,
    policyBundleRef: "policy_bundle_254_v1",
    lineageFenceEpoch: 4,
    clinicalMeaningState: "bounded_admin_only",
    operationalFollowUpScope: "bounded_admin_resolution",
    adminMutationAuthorityState: "bounded_admin_only",
    reopenState: "stable",
    waitingState: "none",
    releaseWatchRef: `release_watch_${seed}`,
    caseState: "queued",
  };
  const currentCompletionArtifact = {
    adminResolutionCompletionArtifactId: `completion_artifact_${seed}`,
    patientExpectationTemplateRef: `patient_expectation_template_${seed}`,
    visibilityTier: "patient_authenticated",
    summarySafetyTier: "clinical_safe_summary",
    placeholderContractRef: "placeholder_contract.admin_resolution.default",
    releaseState: "current",
  };
  const currentSubtypeProfile = {
    patientExpectationTemplateRef: `patient_expectation_template_${seed}`,
  };
  const dependencySet = {
    adviceAdminDependencySetId: `dependency_set_${seed}`,
    reasonCodeRefs: [],
  };
  const dependencyProjection = {
    canContinueCurrentConsequence: true,
    reopenState: "stable",
    dominantRecoveryRouteRef: `/workspace/task/task_${seed}/admin-resolution`,
    dominantBlockerRef: null,
  };
  const continuity = {
    current: buildContinuityBundle(seed, "interactive"),
    recovery: buildContinuityBundle(seed, "recovery_required"),
  };

  const fixture = {
    boundaryDecision,
    currentCase,
    currentCompletionArtifact,
    currentSubtypeProfile,
    dependencySet,
    dependencyProjection,
    continuity,
  };

  if (overrides.boundaryDecision) {
    Object.assign(boundaryDecision, overrides.boundaryDecision);
  }
  if (overrides.currentCase) {
    Object.assign(currentCase, overrides.currentCase);
  }
  if (overrides.currentCompletionArtifact) {
    Object.assign(currentCompletionArtifact, overrides.currentCompletionArtifact);
  }
  if (overrides.dependencySet) {
    Object.assign(dependencySet, overrides.dependencySet);
  }
  if (overrides.dependencyProjection) {
    Object.assign(dependencyProjection, overrides.dependencyProjection);
  }

  return fixture;
}

function buildApplication(fixture) {
  const selfCareBoundaryBundle = {
    boundaryBundle: {
      currentBoundaryDecision: fixture.boundaryDecision,
      currentAdviceEligibilityGrant: {
        audienceTier: "patient_authenticated",
      },
    },
    endpointBundle: null,
    approvalBundle: null,
    directResolutionBundle: null,
    effectiveAdviceGrantState: "issued",
    effectiveAdviceGrantReasonCodeRefs: [],
  };
  const adminResolutionPolicyBundle = {
    adminResolutionBundle: {
      currentAdminResolutionCase: fixture.currentCase,
      currentCompletionArtifact: fixture.currentCompletionArtifact,
      currentSubtypeProfile: fixture.currentSubtypeProfile,
    },
    selfCareBoundaryBundle,
    continuityEvaluation: {},
    effectiveCaseState: fixture.currentCase.caseState,
    effectiveReasonCodeRefs: [],
    normalizedBoundarySubtypeRef: "registration_or_demographic_update",
    normalizedStarterSubtypeRef: "registration_or_demographic_update",
  };
  const dependencyBundle = {
    dependencyBundle: {
      currentAdviceAdminDependencySet: fixture.dependencySet,
    },
    projection: fixture.dependencyProjection,
    triageTask: null,
    selfCareBoundaryBundle,
    adviceRenderBundle: null,
    adminResolutionBundle: adminResolutionPolicyBundle,
    communicationRepairBundle: null,
    conversationProjection: null,
    identityBlocking: null,
    currentBoundaryTupleHash: fixture.boundaryDecision.boundaryTupleHash,
    currentDecisionEpochRef: fixture.boundaryDecision.decisionEpochRef,
    currentDependencySetRef: fixture.currentCase.dependencySetRef,
  };
  const analyticsBundle = {
    analyticsBundle: {
      patientExpectationTemplates: [],
      templateVersions: [],
      templateVariants: [],
      analyticsRecords: [],
      watchWindows: [],
    },
    selfCareBoundaryBundle,
    adviceRenderBundle: null,
    adminResolutionBundle: adminResolutionPolicyBundle,
    dependencyBundle,
    currentExpectationResolution: {
      patientExpectationTemplateRef: fixture.currentCompletionArtifact.patientExpectationTemplateRef,
    },
    currentFollowUpWatchWindow: null,
  };

  return createPhase3AdminResolutionSettlementApplication({
    selfCareBoundaryApplication: {
      async queryTaskSelfCareBoundary(taskId) {
        expect(taskId).toBe(`task_${fixture.boundaryDecision.selfCareBoundaryDecisionId.replace("boundary_", "")}`);
        return selfCareBoundaryBundle;
      },
    },
    adminResolutionPolicyApplication: {
      async queryTaskAdminResolution() {
        return adminResolutionPolicyBundle;
      },
    },
    dependencyApplication: {
      async queryTaskAdviceAdminDependency() {
        return dependencyBundle;
      },
    },
    analyticsApplication: {
      async queryTaskSelfCareOutcomeAnalytics() {
        return analyticsBundle;
      },
    },
    taskCompletionContinuityApplication: {
      async queryTaskCompletionContinuity() {
        return fixture.continuity.current;
      },
      async settleTaskCompletion() {
        return fixture.continuity.current;
      },
      async computeContinuityEvidence() {
        return fixture.continuity.current;
      },
      async invalidateStaleContinuity() {
        return fixture.continuity.recovery;
      },
    },
    reopenLaunchApplication: {
      async reopenFromInvalidation() {
        return {
          reopenRecord: {
            reopenRecordId: `reopen_record_${fixture.currentCase.adminResolutionCaseId}`,
          },
          decisionSupersessionRecordRef: `decision_supersession_${fixture.currentCase.adminResolutionCaseId}`,
          reopenedTaskTransition: null,
          queuedTaskTransition: {
            task: {
              taskId: `task_${fixture.currentCase.adminResolutionCaseId.replace("admin_case_", "")}`,
            },
          },
          launchContext: {},
          priorityAdjustment: {},
        };
      },
    },
  });
}

describe("phase 3 admin-resolution settlement application", () => {
  it("publishes the 254 settlement routes and metadata in the command-api route catalog", () => {
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    for (const route of phase3AdminResolutionSettlementRoutes) {
      expect(routeIds.has(route.routeId)).toBe(true);
    }

    expect(PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SERVICE_NAME).toBe(
      "Phase3AdminResolutionSettlementApplication",
    );
    expect(PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SCHEMA_VERSION).toBe(
      "254.phase3.admin-resolution-settlement-and-reentry.v1",
    );
    expect(PHASE3_ADMIN_RESOLUTION_SETTLEMENT_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/{taskId}/admin-resolution-settlement",
    ]);
    expect(phase3AdminResolutionSettlementPersistenceTables).toContain(
      "phase3_admin_resolution_settlements",
    );
    expect(phase3AdminResolutionSettlementMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/130_phase3_admin_resolution_settlement_and_reentry.sql",
    );
  });

  it("settles completed admin work only through the authoritative artifact and expectation tuple", async () => {
    const fixture = buildFixture("254_complete");
    const app = buildApplication(fixture);

    const settled = await app.settleAdminCompletion({
      taskId: "task_254_complete",
      adminResolutionCaseId: "admin_case_254_complete",
      actorRef: "actor_254",
      recordedAt: "2026-04-17T12:10:00.000Z",
    });

    expect(settled.settlementBundle.currentSettlement.result).toBe("completed");
    expect(settled.settlementBundle.currentSettlement.completionArtifactRef).toBe(
      "completion_artifact_254_complete",
    );
    expect(settled.settlementBundle.currentExperienceProjection.dominantNextActionRef).toBe(
      "dominant_next_action.next_task_launch",
    );
    expect(settled.recommendedReentry).toBeNull();
  });

  it("settles stale_recoverable when the caller presents an old boundary tuple", async () => {
    const fixture = buildFixture("254_stale");
    const app = buildApplication(fixture);

    const settled = await app.settleAdminCompletion({
      taskId: "task_254_stale",
      adminResolutionCaseId: "admin_case_254_stale",
      actorRef: "actor_254",
      recordedAt: "2026-04-17T12:10:00.000Z",
      presentedBoundaryTupleHash: "boundary_tuple_old",
      presentedDecisionEpochRef: "decision_epoch_old",
    });

    expect(settled.settlementBundle.currentSettlement.result).toBe("stale_recoverable");
    expect(settled.settlementBundle.currentSettlement.reasonCodeRefs).toContain(
      "presented_boundary_tuple_hash_drift",
    );
    expect(settled.settlementBundle.currentExperienceProjection.projectionState).toBe("stale");
  });

  it("reopens bounded admin work through governed re-entry and refreshes projection trust from the invalidated continuity bundle", async () => {
    const fixture = buildFixture("254_reopen");
    const app = buildApplication(fixture);

    const reopened = await app.reopenAdminResolutionForReview({
      taskId: "task_254_reopen",
      adminResolutionCaseId: "admin_case_254_reopen",
      actorRef: "actor_254",
      recordedAt: "2026-04-17T12:12:00.000Z",
      reopenReasonCodeRefs: ["manual_clinical_review_requested"],
    });

    expect(reopened.settlementBundle.currentSettlement.result).toBe("reopened_for_review");
    expect(reopened.settlementBundle.currentCrossDomainReentry.destination).toBe(
      "clinician_review",
    );
    expect(reopened.settlementBundle.currentExperienceProjection.trustState).toBe(
      "quarantined",
    );
    expect(reopened.settlementBundle.currentExperienceProjection.dominantNextActionRef).toBe(
      "dominant_next_action.clinician_review",
    );
  });

  it("resolves repair-route re-entry without inventing a support-only admin truth path", async () => {
    const fixture = buildFixture("254_repair", {
      dependencyProjection: {
        canContinueCurrentConsequence: false,
        dominantBlockerRef: "contact_route_repair_required",
        dominantRecoveryRouteRef: "/workspace/task/task_254_repair/contact-repair",
      },
      dependencySet: {
        reasonCodeRefs: ["contact_route_repair_required"],
      },
    });
    const app = buildApplication(fixture);

    await app.recordAdminResolutionSettlement({
      taskId: "task_254_repair",
      adminResolutionCaseId: "admin_case_254_repair",
      actorRef: "actor_254",
      recordedAt: "2026-04-17T12:00:00.000Z",
      actionType: "queue_admin_resolution",
      desiredResult: "queued",
    });

    const reentry = await app.resolveAdminCrossDomainReentry({
      taskId: "task_254_repair",
      adminResolutionCaseId: "admin_case_254_repair",
      actorRef: "actor_254",
      recordedAt: "2026-04-17T12:15:00.000Z",
      preferredDestination: "contact_route_repair",
    });

    expect(reentry.settlementBundle.currentCrossDomainReentry.destination).toBe(
      "contact_route_repair",
    );
    expect(reentry.settlementBundle.currentExperienceProjection.dominantNextActionRef).toBe(
      "dominant_next_action.contact_route_repair",
    );
  });
});
