import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import { PHASE3_PATIENT_CONVERSATION_PROJECTION_QUERY_SURFACES } from "../src/phase3-patient-conversation-projections.ts";
import {
  createPhase3PatientConversationProjectionApplication,
  PHASE3_PATIENT_CONVERSATION_PROJECTION_SCHEMA_VERSION,
  PHASE3_PATIENT_CONVERSATION_PROJECTION_SERVICE_NAME,
  phase3PatientConversationProjectionRoutes,
} from "../src/phase3-patient-conversation-projections.ts";
import { createPhase3ConversationControlApplication } from "../src/phase3-conversation-control.ts";
import { createPhase3TriageKernelApplication } from "../src/phase3-triage-kernel.ts";

async function seedTask(triageApplication, seed) {
  const taskId = `task_${seed}`;
  await triageApplication.createTask({
    taskId,
    requestId: `request_${seed}`,
    queueKey: "messages",
    sourceQueueRankSnapshotRef: `queue_rank_snapshot_${seed}`,
    returnAnchorRef: `queue_row_${seed}`,
    returnAnchorTupleHash: `return_anchor_tuple_hash_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHash: `selected_anchor_tuple_hash_${seed}`,
    workspaceTrustEnvelopeRef: `workspace_trust_${seed}`,
    surfaceRouteContractRef: `surface_contract_${seed}`,
    surfacePublicationRef: `patient_shell_consistency_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    taskCompletionSettlementEnvelopeRef: `continuity_${seed}`,
    createdAt: "2026-04-17T16:00:00.000Z",
    episodeId: `episode_${seed}`,
    requestLineageRef: `request_lineage_${seed}`,
  });
  return taskId;
}

function makeAppSources(taskId) {
  return {
    callbackApplication: {
      async queryTaskCallbackDomain(queriedTaskId) {
        if (queriedTaskId !== taskId) {
          return null;
        }
        return {
          task: {
            taskId,
          },
          callbackSeedRef: "callback_seed_247_a",
          callbackCase: {
            callbackCaseId: "callback_case_247_a",
            sourceTriageTaskRef: taskId,
            callbackSeedRef: "callback_seed_247_a",
            episodeRef: "episode_247_a",
            requestId: "request_247_a",
            requestLineageRef: "request_lineage_247_a",
            lineageCaseLinkRef: "lineage_case_link_247_a",
            decisionEpochRef: "decision_epoch_247_a",
            decisionId: "decision_247_a",
            state: "scheduled",
            callbackUrgencyRef: "routine",
            preferredWindowRef: "window_247_a",
            serviceWindowRef: "service_window_247_a",
            contactRouteRef: "contact_route_247_a",
            fallbackRouteRef: "fallback_route_247_a",
            activeIntentLeaseRef: "callback_intent_lease_247_a",
            attemptCounter: 0,
            latestSettledAttemptRef: null,
            currentExpectationEnvelopeRef: "callback_expectation_247_a",
            latestOutcomeEvidenceBundleRef: null,
            activeResolutionGateRef: "callback_resolution_gate_247_a",
            retryPolicyRef: "retry_policy_standard",
            reachabilityDependencyRef: "reachability_dependency_247_a",
            patientVisibleExpectationState: "scheduled",
            latestAttemptOutcome: null,
            stalePromiseSuppressedAt: null,
            closedAt: null,
            createdAt: "2026-04-17T12:00:00.000Z",
            updatedAt: "2026-04-17T13:00:00.000Z",
            version: 4,
          },
          currentIntentLease: {
            callbackIntentLeaseId: "callback_intent_lease_247_a",
            callbackCaseRef: "callback_case_247_a",
            requestLifecycleLeaseRef: "request_lifecycle_lease_247_a",
            leaseAuthorityRef: "callback_lease_authority",
            ownedByActorRef: "clinician_247",
            ownedBySessionRef: null,
            serviceWindowRef: "service_window_247_a",
            contactRouteRef: "contact_route_247_a",
            routeIntentBindingRef: "route_intent_247_a",
            lineageFenceEpoch: 7,
            ownershipEpoch: 3,
            fencingToken: "callback_fence_247_a",
            leaseMode: "scheduled",
            caseVersionRef: "callback_case_247_a_v4",
            lastHeartbeatAt: "2026-04-17T13:00:00.000Z",
            staleOwnerRecoveryRef: null,
            expiresAt: "2026-04-17T17:00:00.000Z",
            monotoneRevision: 4,
            version: 1,
          },
          latestAttempt: null,
          currentExpectationEnvelope: {
            expectationEnvelopeId: "callback_expectation_247_a",
            callbackCaseRef: "callback_case_247_a",
            identityRepairBranchDispositionRef: null,
            patientVisibleState: "scheduled",
            expectedWindowRef: "window_247_a",
            windowLowerAt: "2026-04-17T14:00:00.000Z",
            windowUpperAt: "2026-04-17T16:00:00.000Z",
            windowRiskState: "on_track",
            stateConfidenceBand: "high",
            predictionModelRef: "callback_window_model_v1",
            fallbackGuidanceRef: "callback_guidance_247_a",
            grantSetRef: null,
            routeIntentBindingRef: "route_intent_247_a",
            requiredReleaseApprovalFreezeRef: null,
            channelReleaseFreezeState: "permitted",
            requiredAssuranceSliceTrustRefs: [],
            transitionEnvelopeRef: "transition_envelope_247_a",
            continuityEvidenceRef: "continuity_247_a",
            causalToken: "causal_247_callback",
            freezeDispositionRef: null,
            expectationReasonRef: "routine_follow_up",
            monotoneRevision: 4,
            createdAt: "2026-04-17T13:00:00.000Z",
            version: 1,
          },
          latestOutcomeEvidenceBundle: null,
          currentResolutionGate: {
            callbackResolutionGateId: "callback_resolution_gate_247_a",
            callbackCaseRef: "callback_case_247_a",
            latestAttemptRef: "callback_attempt_none",
            latestOutcomeEvidenceRef: "callback_outcome_none",
            latestExpectationEnvelopeRef: "callback_expectation_247_a",
            decision: "retry",
            decisionReasonRef: "scheduled_callback_open",
            nextActionAt: "2026-04-17T14:00:00.000Z",
            stalePromiseRevocationRef: null,
            requiresLifecycleReview: false,
            causalToken: "causal_resolution_247_a",
            monotoneRevision: 2,
            decidedAt: "2026-04-17T13:00:00.000Z",
            version: 1,
          },
        };
      },
    },
    clinicianMessageApplication: {
      async queryTaskClinicianMessageDomain(queriedTaskId) {
        if (queriedTaskId !== taskId) {
          return null;
        }
        return {
          task: {
            taskId,
          },
          clinicianMessageSeedRef: "message_seed_247_a",
          messageThread: {
            threadId: "message_thread_247_a",
            sourceTriageTaskRef: taskId,
            clinicianMessageSeedRef: "message_seed_247_a",
            episodeRef: "episode_247_a",
            requestId: "request_247_a",
            requestLineageRef: "request_lineage_247_a",
            lineageCaseLinkRef: "lineage_case_link_message_247_a",
            decisionEpochRef: "decision_epoch_247_a",
            decisionId: "decision_247_a",
            state: "reply_received",
            threadPurposeRef: "clinical_follow_up",
            closureRuleRef: "await_clinician_review",
            authorActorRef: "clinician_247",
            approverActorRef: null,
            approvalRequiredState: "not_required",
            latestDraftRef: "draft_247_a",
            messageSubject: "The clinician asked for a clearer photo and symptom update.",
            messageBody: "Please send a clearer photo and confirm whether the rash is spreading.",
            dispatchFenceCounter: 1,
            activeDispatchEnvelopeRef: "message_dispatch_247_a",
            latestDeliveryEvidenceBundleRef: "message_delivery_247_a",
            currentExpectationEnvelopeRef: "message_expectation_247_a",
            activeResolutionGateRef: "message_resolution_gate_247_a",
            latestReplyRef: "message_reply_247_a",
            reachabilityDependencyRef: "reachability_dependency_247_a",
            requestLifecycleLeaseRef: "request_lifecycle_lease_247_a",
            leaseAuthorityRef: "message_lease_authority",
            ownershipEpoch: 3,
            fencingToken: "message_fence_247_a",
            currentLineageFenceEpoch: 7,
            patientVisibleExpectationState: "awaiting_review",
            reSafetyRequired: true,
            callbackEscalationRef: null,
            closedAt: null,
            createdAt: "2026-04-17T12:00:00.000Z",
            updatedAt: "2026-04-17T12:45:00.000Z",
            version: 5,
          },
          currentDispatchEnvelope: {
            messageDispatchEnvelopeId: "message_dispatch_247_a",
            threadRef: "message_thread_247_a",
            threadVersionRef: "message_thread_247_a_v5",
            draftRef: "draft_247_a",
            approvedByRef: null,
            deliveryPlanRef: "delivery_plan_247_a",
            contactRouteRef: "contact_route_247_a",
            routeIntentBindingRef: "route_intent_247_a",
            requestLifecycleLeaseRef: "request_lifecycle_lease_247_a",
            dispatchFenceEpoch: 1,
            ownershipEpochRef: 3,
            fencingToken: "message_fence_247_a",
            commandActionRecordRef: "message_action_247_a",
            idempotencyRecordRef: "message_idempotency_247_a",
            adapterDispatchAttemptRef: "adapter_dispatch_247_a",
            adapterEffectKey: "effect_key_247_a",
            latestReceiptCheckpointRef: "message_receipt_247_a",
            supportMutationAttemptRef: null,
            supportActionRecordRef: null,
            repairIntent: "none",
            channelTemplateRef: "secure_message_template_v1",
            transportState: "provider_accepted",
            deliveryEvidenceState: "delivered",
            currentDeliveryConfidenceRef: "delivery_confidence_high",
            deliveryModelVersionRef: "delivery_model_v1",
            calibrationVersion: "calibration_v1",
            causalToken: "causal_dispatch_247_a",
            monotoneRevision: 2,
            idempotencyKey: "message_dispatch_key_247_a",
            createdAt: "2026-04-17T12:05:00.000Z",
            version: 2,
          },
          currentDeliveryEvidenceBundle: {
            messageDeliveryEvidenceBundleId: "message_delivery_247_a",
            threadRef: "message_thread_247_a",
            dispatchEnvelopeRef: "message_dispatch_247_a",
            dispatchFenceEpoch: 1,
            threadVersionRef: "message_thread_247_a_v5",
            receiptCheckpointRef: "message_receipt_247_a",
            deliveryState: "delivered",
            evidenceStrength: "direct_provider_receipt",
            providerDispositionRef: "provider_delivered",
            deliveryArtifactRefs: ["delivery_artifact_247_a"],
            reachabilityDependencyRef: "reachability_dependency_247_a",
            supportActionSettlementRef: "support_action_settlement_247_a",
            causalToken: "causal_delivery_247_a",
            recordedAt: "2026-04-17T12:06:00.000Z",
            version: 1,
          },
          currentExpectationEnvelope: {
            threadExpectationEnvelopeId: "message_expectation_247_a",
            threadRef: "message_thread_247_a",
            reachabilityDependencyRef: "reachability_dependency_247_a",
            contactRepairJourneyRef: null,
            identityRepairBranchDispositionRef: null,
            patientVisibleState: "awaiting_review",
            replyWindowRef: "reply_window_247_a",
            deliveryRiskState: "at_risk",
            stateConfidenceBand: "high",
            fallbackGuidanceRef: "message_guidance_247_a",
            routeIntentBindingRef: "route_intent_247_a",
            requiredReleaseApprovalFreezeRef: null,
            channelReleaseFreezeState: "permitted",
            requiredAssuranceSliceTrustRefs: [],
            latestSupportActionSettlementRef: "support_action_settlement_247_a",
            transitionEnvelopeRef: "transition_envelope_247_a",
            continuityEvidenceRef: "continuity_247_a",
            freezeDispositionRef: null,
            causalToken: "causal_expectation_247_a",
            monotoneRevision: 3,
            createdAt: "2026-04-17T12:07:00.000Z",
            version: 1,
          },
          currentResolutionGate: {
            threadResolutionGateId: "message_resolution_gate_247_a",
            threadRef: "message_thread_247_a",
            latestDispatchRef: "message_dispatch_247_a",
            latestReplyRef: "message_reply_247_a",
            latestExpectationEnvelopeRef: "message_expectation_247_a",
            latestSupportActionSettlementRef: "support_action_settlement_247_a",
            decision: "review_pending",
            decisionReasonRef: "patient_reply_requires_review",
            sameShellRecoveryRef: null,
            requiresLifecycleReview: true,
            causalToken: "causal_resolution_247_a",
            monotoneRevision: 1,
            decidedAt: "2026-04-17T12:45:00.000Z",
            version: 1,
          },
          latestReply: {
            messagePatientReplyId: "message_reply_247_a",
            threadRef: "message_thread_247_a",
            requestId: "request_247_a",
            requestLineageRef: "request_lineage_247_a",
            dispatchEnvelopeRef: "message_dispatch_247_a",
            threadVersionRef: "message_thread_247_a_v5",
            replyRouteFamilyRef: "patient_messages",
            replyChannelRef: "secure_message",
            replyText: "I have sent a clearer photo and the rash is still itchy.",
            replyArtifactRefs: ["attachment_247_a"],
            providerCorrelationRef: "provider_reply_247_a",
            secureEntryGrantRef: "grant_247_a",
            classificationHint: "potentially_clinical",
            reSafetyRequired: true,
            needsAssimilation: true,
            causalToken: "causal_reply_247_a",
            repliedAt: "2026-04-17T12:40:00.000Z",
            version: 1,
          },
        };
      },
    },
    moreInfoApplication: {
      async queryTaskMoreInfo(queriedTaskId) {
        if (queriedTaskId !== taskId) {
          return null;
        }
        return {
          cycle: {
            cycleId: "more_info_cycle_247_a",
            taskId,
            requestId: "request_247_a",
            requestLineageRef: "request_lineage_247_a",
            state: "response_received",
            promptSetRef: "prompt_set_247_a",
            channelRef: "secure_message",
            responseRouteFamilyRef: "patient_messages",
            dueAt: "2026-04-17T18:00:00.000Z",
            lateReviewStartsAt: "2026-04-17T19:00:00.000Z",
            expiresAt: "2026-04-18T12:00:00.000Z",
            lifecycleLeaseRef: "more_info_lease_247_a",
            leaseAuthorityRef: "more_info_authority",
            ownershipEpoch: 2,
            fencingToken: "more_info_fence_247_a",
            currentLineageFenceEpoch: 7,
            activeCheckpointRef: "more_info_checkpoint_247_a",
            reminderScheduleRef: "more_info_schedule_247_a",
            responseGrantRef: "response_grant_247_a",
            responseGrantExpiresAt: "2026-04-17T18:00:00.000Z",
            supersedesCycleRef: null,
            supersededByCycleRef: null,
            latestResponseClassification: "accepted_on_time",
            responseReceivedAt: "2026-04-17T12:35:00.000Z",
            callbackFallbackSeedRef: null,
            createdAt: "2026-04-17T11:00:00.000Z",
            updatedAt: "2026-04-17T12:35:00.000Z",
            version: 2,
          },
          checkpoint: {
            checkpointId: "more_info_checkpoint_247_a",
            cycleId: "more_info_cycle_247_a",
            requestId: "request_247_a",
            requestLineageRef: "request_lineage_247_a",
            checkpointRevision: 3,
            replyWindowState: "reminder_due",
            opensAt: "2026-04-17T11:00:00.000Z",
            dueAt: "2026-04-17T18:00:00.000Z",
            lateReviewStartsAt: "2026-04-17T19:00:00.000Z",
            expiresAt: "2026-04-18T12:00:00.000Z",
            nextReminderDueAt: "2026-04-17T13:30:00.000Z",
            grantNarrowingExpiresAt: null,
            repairRequiredReasonRef: null,
            settledAt: null,
            supersededAt: null,
            currentLineageFenceEpoch: 7,
            createdAt: "2026-04-17T11:00:00.000Z",
            updatedAt: "2026-04-17T13:30:00.000Z",
            version: 3,
          },
          schedule: {
            scheduleId: "more_info_schedule_247_a",
            cycleId: "more_info_cycle_247_a",
            checkpointRef: "more_info_checkpoint_247_a",
            scheduleState: "scheduled",
            cadencePolicyRef: "more_info_standard",
            reminderOffsetsMinutes: [60, 120],
            maxReminderCount: 2,
            dispatchedReminderCount: 1,
            quietHoursPolicyRef: null,
            quietHoursWindow: null,
            lastReminderSentAt: "2026-04-17T13:30:00.000Z",
            nextQuietHoursReleaseAt: null,
            suppressedReasonRef: null,
            callbackFallbackState: "not_eligible",
            callbackFallbackSeedRef: null,
            completedAt: null,
            cancelledAt: null,
            createdAt: "2026-04-17T11:00:00.000Z",
            updatedAt: "2026-04-17T13:30:00.000Z",
            version: 2,
          },
          taskTransition: null,
          responseGrant: {
            grantRef: "response_grant_247_a",
            materializedToken: null,
          },
          supersededCycle: null,
          initialOutboxEntry: {
            outboxEntryId: "outbox_247_a",
            cycleId: "more_info_cycle_247_a",
            checkpointRef: "more_info_checkpoint_247_a",
            scheduleRef: "more_info_schedule_247_a",
            requestLineageRef: "request_lineage_247_a",
            effectType: "initial_delivery",
            effectKey: "effect_247_a",
            reminderOrdinal: null,
            dispatchState: "dispatched",
            reasonRef: null,
            dueAt: "2026-04-17T11:00:00.000Z",
            createdAt: "2026-04-17T11:00:00.000Z",
            dispatchedAt: "2026-04-17T11:01:00.000Z",
            cancelledAt: null,
            version: 1,
          },
        };
      },
    },
    communicationRepairApplication: {
      async queryTaskCommunicationRepair(queriedTaskId) {
        if (queriedTaskId !== taskId) {
          return {
            taskId: queriedTaskId,
            callbackRepair: null,
            messageRepair: null,
          };
        }
        return {
          taskId,
          callbackRepair: null,
          messageRepair: {
            binding: {
              bindingId: "repair_binding_247_a",
              taskId,
              communicationDomain: "clinician_message_thread",
              communicationObjectRef: "message_thread_247_a",
              episodeRef: "episode_247_a",
              requestId: "request_247_a",
              requestLineageRef: "request_lineage_247_a",
              contactRouteRef: "contact_route_247_a",
              reachabilityDependencyRef: "reachability_dependency_247_a",
              currentContactRouteSnapshotRef: "contact_route_snapshot_247_a",
              currentReachabilityAssessmentRef: "reachability_assessment_247_a",
              currentReachabilityEpoch: 4,
              activeRepairJourneyRef: "repair_journey_247_a",
              activeRepairEntryGrantRef: "grant_247_repair",
              activeVerificationCheckpointRef: "verification_checkpoint_247_a",
              lastCommunicationObservationRef: "observation_247_a",
              lastAuthorizationRef: "authorization_247_a",
              lastReboundRecordRef: null,
              bindingState: "repair_active",
              selectedAnchorRef: "repair_anchor_247_a",
              recoveryRouteRef:
                "/v1/me/messages/patient_conversation_cluster_request_lineage_247_a/recover",
              createdAt: "2026-04-17T12:10:00.000Z",
              updatedAt: "2026-04-17T12:12:00.000Z",
              version: 2,
            },
            dependency: {
              dependencyId: "reachability_dependency_247_a",
              episodeId: "episode_247_a",
              requestId: "request_247_a",
              domain: "external_message_delivery",
              domainObjectRef: "message_thread_247_a",
              requiredRouteRef: "contact_route_247_a",
              contactRouteVersionRef: "contact_route_247_a_v1",
              currentContactRouteSnapshotRef: "contact_route_snapshot_247_a",
              currentReachabilityAssessmentRef: "reachability_assessment_247_a",
              reachabilityEpoch: 4,
              purpose: "message_delivery",
              blockedActionScopeRefs: ["contact_route_repair"],
              selectedAnchorRef: "repair_anchor_247_a",
              requestReturnBundleRef: "return_bundle_247_a",
              resumeContinuationRef: null,
              repairJourneyRef: "repair_journey_247_a",
              routeAuthorityState: "current",
              routeHealthState: "blocked",
              deliveryRiskState: "likely_failed",
              repairState: "repair_required",
              deadlineAt: "2026-04-17T18:00:00.000Z",
              failureEffect: "delivery_blocked",
              state: "active",
              createdAt: "2026-04-17T12:10:00.000Z",
              updatedAt: "2026-04-17T12:12:00.000Z",
              version: 1,
            },
            assessment: {
              reachabilityAssessmentId: "reachability_assessment_247_a",
              reachabilityDependencyRef: "reachability_dependency_247_a",
              governingObjectRef: "message_thread_247_a",
              contactRouteSnapshotRef: "contact_route_snapshot_247_a",
              consideredObservationRefs: ["observation_247_a"],
              priorAssessmentRef: null,
              routeAuthorityState: "current",
              deliverabilityState: "undeliverable",
              deliveryRiskState: "likely_failed",
              assessmentState: "blocked",
              falseNegativeGuardState: "pass",
              dominantReasonCode: "route_bounced",
              resultingRepairState: "repair_required",
              resultingReachabilityEpoch: 4,
              assessedAt: "2026-04-17T12:11:00.000Z",
              version: 1,
            },
            repairJourney: {
              repairJourneyId: "repair_journey_247_a",
              reachabilityDependencyRef: "reachability_dependency_247_a",
              governingObjectRef: "message_thread_247_a",
              blockedActionScopeRefs: ["contact_route_repair"],
              selectedAnchorRef: "repair_anchor_247_a",
              requestReturnBundleRef: "return_bundle_247_a",
              resumeContinuationRef: null,
              patientRecoveryLoopRef: "patient_recovery_loop_247_a",
              blockedAssessmentRef: "reachability_assessment_247_a",
              currentContactRouteSnapshotRef: "contact_route_snapshot_247_a",
              candidateContactRouteSnapshotRef: "candidate_contact_route_247_a",
              verificationCheckpointRef: "verification_checkpoint_247_a",
              resultingReachabilityAssessmentRef: null,
              journeyState: "verification_pending",
              issuedAt: "2026-04-17T12:12:00.000Z",
              updatedAt: "2026-04-17T12:12:00.000Z",
              completedAt: null,
              version: 1,
            },
            verificationCheckpoint: {
              checkpointId: "verification_checkpoint_247_a",
              repairJourneyRef: "repair_journey_247_a",
              contactRouteRef: "contact_route_247_a",
              contactRouteVersionRef: "contact_route_247_a_v1",
              preVerificationAssessmentRef: "reachability_assessment_247_a",
              verificationMethod: "sms_code",
              verificationState: "pending",
              resultingContactRouteSnapshotRef: null,
              resultingReachabilityAssessmentRef: null,
              rebindState: "pending",
              dependentGrantRefs: ["grant_247_repair"],
              dependentRouteIntentRefs: ["route_intent_247_a"],
              evaluatedAt: "2026-04-17T12:12:00.000Z",
              version: 1,
            },
            activeAuthorization: {
              authorizationId: "authorization_247_a",
              bindingRef: "repair_binding_247_a",
              taskId,
              communicationDomain: "clinician_message_thread",
              communicationObjectRef: "message_thread_247_a",
              authorizationKind: "controlled_resend",
              repairJourneyRef: "repair_journey_247_a",
              governingGateRef: "message_resolution_gate_247_a",
              governingGateDecision: "repair_route",
              governingEvidenceRef: "reachability_assessment_247_a",
              reachabilityEpoch: 4,
              repairEntryGrantRef: "grant_247_repair",
              authorizationState: "active",
              sameShellRecoveryRef:
                "/v1/me/messages/patient_conversation_cluster_request_lineage_247_a/recover",
              reasonCode: "route_bounced",
              createdAt: "2026-04-17T12:12:00.000Z",
              expiresAt: "2026-04-17T18:00:00.000Z",
              updatedAt: "2026-04-17T12:12:00.000Z",
              version: 1,
            },
            lastReboundRecord: null,
          },
        };
      },
    },
  };
}

describe("phase3 patient conversation threading and visibility projections", () => {
  it("publishes the 247 patient-conversation routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    expect(routeIds).toContain("workspace_task_patient_conversation_projection_current");
    expect(routeIds).toContain("patient_portal_conversation_thread_projection_current");
    expect(routeIds).toContain("internal_workspace_task_refresh_patient_conversation_projection");
    expect(routeIds).toContain("internal_conversation_legacy_backfill");
    expect(PHASE3_PATIENT_CONVERSATION_PROJECTION_SERVICE_NAME).toBe(
      "Phase3PatientConversationProjectionApplication",
    );
    expect(PHASE3_PATIENT_CONVERSATION_PROJECTION_SCHEMA_VERSION).toBe(
      "247.phase3.patient-conversation-tuple.v1",
    );
    expect(phase3PatientConversationProjectionRoutes).toHaveLength(4);
    expect(PHASE3_PATIENT_CONVERSATION_PROJECTION_QUERY_SURFACES).toContain(
      "GET /v1/workspace/tasks/{taskId}/patient-conversation",
    );
  });

  it("refreshes one request-centered cluster across callback, message, more-info, reminder, and repair, then publishes the 246 tuple consumer seam", async () => {
    const triageApplication = createPhase3TriageKernelApplication();
    const taskId = await seedTask(triageApplication, "247_a");
    const conversationControlApplication = createPhase3ConversationControlApplication({
      triageApplication,
    });
    const app = createPhase3PatientConversationProjectionApplication({
      triageApplication,
      conversationControlApplication,
      ...makeAppSources(taskId),
    });

    const result = await app.refreshTaskPatientConversationProjection({ taskId });
    expect(result).not.toBeNull();
    expect(result.cluster.clusterRef).toBe("patient_conversation_cluster_request_lineage_247_a");
    expect(result.thread.threadId).toBe("patient_conversation_thread_request_lineage_247_a");
    expect(result.subthreads.map((subthread) => subthread.subthreadType)).toContain(
      "secure_message",
    );
    expect(result.subthreads.map((subthread) => subthread.subthreadType)).toContain("callback");
    expect(result.subthreads.map((subthread) => subthread.subthreadType)).toContain("more_info");
    expect(result.subthreads.map((subthread) => subthread.subthreadType)).toContain(
      "repair_guidance",
    );
    expect(result.communicationEnvelopes.map((row) => row.communicationKind)).toContain(
      "clinician_message",
    );
    expect(result.communicationEnvelopes.map((row) => row.communicationKind)).toContain(
      "patient_message_reply",
    );
    expect(result.communicationEnvelopes.map((row) => row.communicationKind)).toContain(
      "callback_update",
    );
    expect(result.communicationEnvelopes.map((row) => row.communicationKind)).toContain("reminder");
    expect(result.communicationEnvelopes.map((row) => row.communicationKind)).toContain(
      "repair_notice",
    );
    expect(result.visibilityProjection.previewMode).toBe("authenticated_summary");
    expect(result.tupleCompatibility.previewMode).toBe("full");
    expect(result.controlCluster?.tuple.clusterRef).toBe(result.cluster.clusterRef);
    expect(result.controlCluster?.digest.clusterRef).toBe(result.cluster.clusterRef);
    expect(result.thread.latestDigestRef).toBe(result.controlCluster?.digest.digestId ?? null);
  });

  it("holds preview depth in explicit public-safe, step-up, and suppressed modes instead of dropping the cluster", async () => {
    const triageApplication = createPhase3TriageKernelApplication();
    const taskId = await seedTask(triageApplication, "247_modes");
    const conversationControlApplication = createPhase3ConversationControlApplication({
      triageApplication,
    });
    const app = createPhase3PatientConversationProjectionApplication({
      triageApplication,
      conversationControlApplication,
      ...makeAppSources(taskId),
    });

    const publicResult = await app.refreshTaskPatientConversationProjection({
      taskId,
      audienceTier: "patient_public",
      publishToConversationControl: false,
    });
    const stepUpResult = await app.refreshTaskPatientConversationProjection({
      taskId,
      trustPosture: "step_up_required",
      publishToConversationControl: false,
    });
    const suppressedResult = await app.refreshTaskPatientConversationProjection({
      taskId,
      trustPosture: "repair_hold",
      publishToConversationControl: false,
    });

    expect(publicResult?.visibilityProjection.previewMode).toBe("public_safe_summary");
    expect(stepUpResult?.visibilityProjection.previewMode).toBe("step_up_required");
    expect(stepUpResult?.cluster.clusterRef).toBeTruthy();
    expect(suppressedResult?.visibilityProjection.previewMode).toBe("suppressed_recovery_only");
    expect(suppressedResult?.thread.surfaceState).toBe("recovery_only");
  });

  it("backfills legacy callback or message history into placeholder recovery posture before calm settled copy is allowed", async () => {
    const triageApplication = createPhase3TriageKernelApplication();
    const taskId = await seedTask(triageApplication, "247_legacy");
    const conversationControlApplication = createPhase3ConversationControlApplication({
      triageApplication,
    });
    const app = createPhase3PatientConversationProjectionApplication({
      triageApplication,
      conversationControlApplication,
      callbackApplication: {
        async queryTaskCallbackDomain() {
          return null;
        },
      },
      clinicianMessageApplication: {
        async queryTaskClinicianMessageDomain() {
          return null;
        },
      },
      moreInfoApplication: {
        async queryTaskMoreInfo() {
          return null;
        },
      },
      communicationRepairApplication: {
        async queryTaskCommunicationRepair(queriedTaskId) {
          return { taskId: queriedTaskId, callbackRepair: null, messageRepair: null };
        },
      },
    });

    await app.backfillLegacyConversationHistory({
      recordedAt: "2026-04-17T16:10:00.000Z",
      rows: [
        {
          backfillRowId: "legacy_message_247_a",
          taskId,
          requestId: "request_247_legacy",
          requestLineageRef: "request_lineage_247_legacy",
          episodeRef: "episode_247_legacy",
          sourceDomain: "clinician_message_thread",
          sourceRef: "legacy_thread_247_legacy",
          occurredAt: "2026-04-16T10:00:00.000Z",
          patientSafeSummary:
            "Historic message delivery is being reconciled before full thread hydration.",
          publicSafeSummary: "Historic message delivery is being reconciled.",
          deliveryRiskState: "likely_failed",
          authoritativeOutcomeState: "recovery_required",
          repairRequired: true,
        },
      ],
    });

    const result = await app.refreshTaskPatientConversationProjection({
      taskId,
      publishToConversationControl: false,
    });

    expect(result?.legacyBackfillApplied).toBe(true);
    expect(result?.tupleCompatibility.tupleAvailabilityState).toBe("placeholder");
    expect(result?.tupleCompatibility.authoritativeOutcomeState).toBe("recovery_required");
    expect(result?.thread.surfaceState).toBe("placeholder");
    expect(result?.communicationEnvelopes[0].communicationKind).toBe("legacy_placeholder");
  });
});
