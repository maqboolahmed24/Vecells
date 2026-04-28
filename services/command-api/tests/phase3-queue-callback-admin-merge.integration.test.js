import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_QUERY_SURFACES,
  PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SCHEMA_VERSION,
  PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SERVICE_NAME,
  createPhase3QueueCallbackAdminMergeApplication,
  phase3QueueCallbackAdminMergeFixture,
  phase3QueueCallbackAdminMergeMigrationPlanRefs,
  phase3QueueCallbackAdminMergePersistenceTables,
  phase3QueueCallbackAdminMergeRoutes,
} from "../src/phase3-queue-callback-admin-merge.ts";

function buildCompletionBundle(taskId, queueKey = "repair", launchEligibilityState = "ready") {
  return {
    task: {
      taskId,
      requestId: `request_${taskId}`,
      queueKey,
      taskCompletionSettlementEnvelopeRef: `completion_envelope_${taskId}`,
    },
    reviewSession: {
      reviewSessionId: `review_session_${taskId}`,
    },
    launchContext: {
      launchContextId: `launch_context_${taskId}`,
      taskId,
      sourceQueueKey: queueKey,
      sourceQueueRankSnapshotRef: "queue_rank_snapshot_270",
      returnAnchorRef: `queue-row-${taskId}`,
      returnAnchorTupleHash: `queue-row-${taskId}::tuple`,
      nextTaskCandidateRefs: [],
      nextTaskRankSnapshotRef: "queue_rank_snapshot_270",
      selectedAnchorRef: `queue-row-${taskId}`,
      selectedAnchorTupleHash: `queue-row-${taskId}::tuple`,
      nextTaskBlockingReasonRefs: [],
      nextTaskLaunchState: "ready",
      departingTaskReturnStubState: "pinned",
      prefetchWindowRef: `prefetch_window_${taskId}`,
      updatedAt: "2026-04-18T09:00:00.000Z",
    },
    completionEnvelope: {
      taskCompletionSettlementEnvelopeId: `completion_envelope_${taskId}`,
      authoritativeSettlementState: taskId === "task_507" ? "pending" : "settled",
      nextTaskLaunchState: taskId === "task_507" ? "gated" : "ready",
      experienceContinuityEvidenceRef: `continuity_evidence_${taskId}`,
    },
    operatorHandoffFrame: null,
    workspaceContinuityEvidenceProjection: {
      workspaceContinuityEvidenceProjectionId: `continuity_projection_${taskId}`,
    },
    workspaceTrustEnvelope: null,
    nextTaskLaunchLease: {
      nextTaskLaunchLeaseId: `next_task_launch_lease_${taskId}`,
      launchEligibilityState,
      sourceRankSnapshotRef: "queue_rank_snapshot_270",
      continuityEvidenceRef: `continuity_evidence_${taskId}`,
    },
    directResolution: {},
    approval: {},
    reopenRecord: null,
  };
}

describe("phase 3 queue callback admin merge application", () => {
  it("publishes the 270 query surfaces, route catalog coverage, and fixture metadata", () => {
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    for (const route of phase3QueueCallbackAdminMergeRoutes) {
      expect(routeIds.has(route.routeId)).toBe(true);
    }

    const application = createPhase3QueueCallbackAdminMergeApplication({
      queueApplication: {
        async queryQueue() {
          return null;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary() {
          return null;
        },
      },
      adviceRenderApplication: {
        async queryTaskAdviceRender() {
          return null;
        },
      },
      adminResolutionApplication: {
        async queryTaskAdminResolution() {
          return null;
        },
      },
      adminResolutionSettlementApplication: {
        async queryTaskAdminResolutionSettlement() {
          return null;
        },
      },
      analyticsApplication: {
        async queryTaskSelfCareOutcomeAnalytics() {
          return null;
        },
      },
      completionContinuityApplication: {
        async queryTaskCompletionContinuity() {
          return null;
        },
      },
    });

    expect(application.serviceName).toBe(PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SCHEMA_VERSION);
    expect(application.querySurfaces).toEqual(PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_QUERY_SURFACES);
    expect(application.persistenceTables).toEqual(
      expect.arrayContaining([...phase3QueueCallbackAdminMergePersistenceTables]),
    );
    expect(application.migrationPlanRefs).toEqual(
      expect.arrayContaining([...phase3QueueCallbackAdminMergeMigrationPlanRefs]),
    );
    expect(phase3QueueCallbackAdminMergeFixture.requiredRouteFamilies).toEqual(
      expect.arrayContaining([
        "/workspace/queue/:queueKey",
        "/workspace/callbacks",
        "/workspace/consequences",
        "/workspace/task/:taskId",
      ]),
    );
  });

  it("joins callback repair, admin waiting, and completion truth into one queue bundle", async () => {
    const application = createPhase3QueueCallbackAdminMergeApplication({
      queueApplication: {
        async queryQueue(queueKey) {
          expect(queueKey).toBe("repair");
          return {
            plan: { queuePlanId: "queue_plan_270" },
            snapshot: {
              rankSnapshotId: "queue_rank_snapshot_270",
              rowOrderHash: "task_412|task_507",
              generatedAt: "2026-04-18T09:00:00.000Z",
            },
            entries: [
              { rankEntryId: "rank_entry_412", taskRef: "task_412" },
              { rankEntryId: "rank_entry_507", taskRef: "task_507" },
            ],
            suggestion: null,
          };
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain(taskId) {
          if (taskId !== "task_412") {
            return null;
          }
          return {
            task: {
              taskId,
            },
            callbackSeedRef: "callback_seed_412",
            callbackCase: {
              callbackCaseId: "callback_case_412",
              sourceTriageTaskRef: taskId,
              requestLineageRef: "request_lineage_412",
              decisionEpochRef: "decision_epoch_412",
              state: "contact_route_repair_pending",
              patientVisibleExpectationState: "route_repair_required",
            },
            currentIntentLease: {
              callbackIntentLeaseId: "callback_lease_412",
            },
            latestAttempt: {
              callbackAttemptRecordId: "callback_attempt_412",
              settlementState: "settled",
            },
            currentExpectationEnvelope: {
              patientVisibleState: "route_repair_required",
            },
            latestOutcomeEvidenceBundle: {
              callbackOutcomeEvidenceBundleId: "callback_outcome_412",
            },
            currentResolutionGate: {
              callbackResolutionGateId: "callback_gate_412",
              decision: "retry",
            },
          };
        },
      },
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary(taskId) {
          if (taskId !== "task_507") {
            return null;
          }
          return {
            boundaryBundle: {
              currentBoundaryDecision: {
                selfCareBoundaryDecisionId: "boundary_507",
                taskId,
                requestRef: "request_507",
                decisionEpochRef: "decision_epoch_507",
                decisionState: "admin_resolution",
              },
              currentAdviceEligibilityGrant: {
                adviceBundleVersionRef: "advice_bundle_507",
              },
            },
          };
        },
      },
      adviceRenderApplication: {
        async queryTaskAdviceRender() {
          return null;
        },
      },
      adminResolutionApplication: {
        async queryTaskAdminResolution(taskId) {
          if (taskId !== "task_507") {
            return null;
          }
          return {
            adminResolutionBundle: {
              currentAdminResolutionCase: {
                adminResolutionCaseId: "admin_case_507",
                caseState: "waiting",
              },
              currentCompletionArtifact: null,
              currentSubtypeProfile: {
                patientExpectationTemplateRef:
                  "patient_expectation_template.admin.registration_or_demographic_update",
              },
            },
          };
        },
      },
      adminResolutionSettlementApplication: {
        async queryTaskAdminResolutionSettlement(taskId) {
          if (taskId !== "task_507") {
            return null;
          }
          return {
            settlementBundle: {
              currentSettlement: {
                adminResolutionSettlementId: "admin_settlement_507",
                result: "waiting_dependency",
                patientExpectationTemplateRef:
                  "patient_expectation_template.admin.registration_or_demographic_update",
              },
            },
          };
        },
      },
      analyticsApplication: {
        async queryTaskSelfCareOutcomeAnalytics(taskId) {
          if (taskId !== "task_507") {
            return null;
          }
          return {
            currentExpectationResolution: {
              patientExpectationTemplateRef:
                "patient_expectation_template.admin.registration_or_demographic_update",
            },
          };
        },
      },
      completionContinuityApplication: {
        async queryTaskCompletionContinuity(taskId) {
          return buildCompletionBundle(taskId);
        },
      },
    });

    const queueBundle = await application.queryIntegratedQueueSurface("repair");
    expect(queueBundle.rankSnapshotRef).toBe("queue_rank_snapshot_270");
    expect(queueBundle.digests).toHaveLength(2);

    const callbackDigest = queueBundle.digests.find((digest) => digest.taskId === "task_412");
    const adminDigest = queueBundle.digests.find((digest) => digest.taskId === "task_507");
    expect(callbackDigest).toMatchObject({
      executionFamily: "callback",
      dominantPosture: "repair_required",
      patientExpectationDigest: "route_repair_required",
      rankEntryRef: "rank_entry_412",
    });
    expect(callbackDigest?.launchActions[0]).toMatchObject({
      routePath: "/workspace/callbacks",
      actionState: "repair_required",
    });

    expect(adminDigest).toMatchObject({
      executionFamily: "admin_resolution",
      dominantPosture: "waiting_dependency",
      patientExpectationDigest:
        "patient_expectation_template.admin.registration_or_demographic_update",
      rankEntryRef: "rank_entry_507",
      completionSettlementState: "pending",
      nextTaskGateState: "ready",
    });
    expect(adminDigest?.launchActions[0]).toMatchObject({
      routePath: "/workspace/consequences",
      actionState: "waiting_dependency",
    });
  });

  it("returns one merged task execution bundle even when no queue snapshot is supplied", async () => {
    const application = createPhase3QueueCallbackAdminMergeApplication({
      queueApplication: {
        async queryQueue() {
          return null;
        },
      },
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary() {
          return {
            boundaryBundle: {
              currentBoundaryDecision: {
                selfCareBoundaryDecisionId: "boundary_118",
                taskId: "task_118",
                requestRef: "request_118",
                decisionEpochRef: "decision_epoch_118",
                decisionState: "self_care",
              },
              currentAdviceEligibilityGrant: {
                adviceBundleVersionRef: "advice_bundle_118",
              },
            },
          };
        },
      },
      adviceRenderApplication: {
        async queryTaskAdviceRender() {
          return {
            renderBundle: {
              currentRenderSettlement: {
                adviceRenderSettlementId: "advice_render_settlement_118",
                renderState: "renderable",
                artifactPresentationContractRef: "artifact_presentation_contract_118",
              },
            },
          };
        },
      },
      adminResolutionApplication: {
        async queryTaskAdminResolution() {
          return null;
        },
      },
      adminResolutionSettlementApplication: {
        async queryTaskAdminResolutionSettlement() {
          return null;
        },
      },
      analyticsApplication: {
        async queryTaskSelfCareOutcomeAnalytics() {
          return {
            currentExpectationResolution: {
              patientExpectationTemplateRef: "patient_expectation_template.self_care.guidance",
            },
          };
        },
      },
      completionContinuityApplication: {
        async queryTaskCompletionContinuity(taskId) {
          return buildCompletionBundle(taskId, "recommended", "stale");
        },
      },
    });

    const taskBundle = await application.queryIntegratedTaskExecution("task_118");
    expect(taskBundle.queueBundle).toBeNull();
    expect(taskBundle.digest).toMatchObject({
      taskId: "task_118",
      executionFamily: "self_care",
      dominantPosture: "ready",
      nextTaskGateState: "stale",
      rankSnapshotRef: "queue_rank_snapshot_270",
    });
  });
});
