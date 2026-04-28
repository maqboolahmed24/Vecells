import { describe, expect, it } from "vitest";
import { evaluateGovernedApprovalRequirement } from "../../packages/domains/triage_workspace/src/phase3-approval-escalation-kernel.ts";

import { createPhase4BookingTriageNotificationApplication } from "../../services/command-api/src/phase4-booking-triage-notification-integration.ts";
import { createPhase3DirectResolutionApplication } from "../../services/command-api/src/phase3-direct-resolution-handoffs.ts";

function createTaskInput(seed: string) {
  return {
    taskId: `task_${seed}`,
    requestId: `request_${seed}`,
    episodeId: `episode_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    queueKey: `queue_${seed}`,
    sourceQueueRankSnapshotRef: `rank_${seed}`,
    returnAnchorRef: `anchor_${seed}`,
    returnAnchorTupleHash: `anchor_hash_${seed}`,
    selectedAnchorRef: `anchor_${seed}`,
    selectedAnchorTupleHash: `anchor_hash_${seed}`,
    workspaceTrustEnvelopeRef: `trust_${seed}`,
    surfaceRouteContractRef: `route_contract_${seed}`,
    surfacePublicationRef: `publication_${seed}`,
    runtimePublicationBundleRef: `runtime_${seed}`,
    taskCompletionSettlementEnvelopeRef: `completion_${seed}`,
    createdAt: "2026-04-20T09:00:00.000Z",
  };
}

async function seedReviewTask(
  application: ReturnType<typeof createPhase3DirectResolutionApplication>,
  seed: string,
) {
  const created = await application.triageApplication.createTask(createTaskInput(seed));
  const queued = await application.triageApplication.moveTaskToQueue({
    taskId: created.task.taskId,
    actorRef: `actor_${seed}`,
    queuedAt: "2026-04-20T09:01:00.000Z",
  });
  const claimed = await application.triageApplication.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-20T09:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: claimed.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-20T09:03:00.000Z",
    staffWorkspaceConsistencyProjectionRef: `workspace_consistency_${seed}`,
    workspaceSliceTrustProjectionRef: `workspace_slice_${seed}`,
    audienceSurfaceRuntimeBindingRef: `runtime_binding_${seed}`,
    reviewActionLeaseRef: `review_action_${seed}`,
    selectedAnchorRef: `anchor_review_${seed}`,
    selectedAnchorTupleHashRef: `anchor_review_hash_${seed}`,
  });
}

function payloadForAppointment() {
  return {
    appointmentReason: "Needs clinician assessment.",
    priorityBand: "same_day",
    timeframe: "today",
    modality: "telephone",
    clinicianType: "gp",
    continuityPreference: "usual_team",
    patientPreferenceSummary: "Prefers late-afternoon call.",
  };
}

async function materializeApprovedCheckpoint(
  application: ReturnType<typeof createPhase3DirectResolutionApplication>,
  taskId: string,
  seed: string,
) {
  const bundle = await application.endpointApplication.queryTaskEndpointDecision(taskId);
  const evaluatedRequirement = evaluateGovernedApprovalRequirement({
    taskId,
    requestId: bundle.epoch.requestId,
    decisionEpochRef: bundle.epoch.epochId,
    decisionId: bundle.decision.decisionId,
    endpointCode: bundle.decision.chosenEndpoint,
    payload: bundle.decision.payload,
    evaluatedAt: "2026-04-20T09:05:00.000Z",
  });
  const evaluated = await application.approvalApplication.service.evaluateApprovalRequirement({
    assessment: {
      assessmentId: `approval_assessment_${seed}`,
      taskId,
      requestId: bundle.epoch.requestId,
      decisionEpochRef: bundle.epoch.epochId,
      decisionId: bundle.decision.decisionId,
      endpointClass: bundle.decision.chosenEndpoint,
      approvalPolicyMatrixRef: evaluatedRequirement.approvalPolicyMatrixRef,
      tenantPolicyRef: evaluatedRequirement.tenantPolicyRef,
      pathwayRef: evaluatedRequirement.pathwayRef,
      riskBurdenClass: evaluatedRequirement.riskBurdenClass,
      assistiveProvenanceState: evaluatedRequirement.assistiveProvenanceState,
      sensitiveOverrideState: evaluatedRequirement.sensitiveOverrideState,
      matchedPolicyRuleRefs: evaluatedRequirement.matchedPolicyRuleRefs,
      requiredApprovalMode: bundle.approvalAssessment.requiredApprovalMode,
      checkpointState: bundle.approvalAssessment.requiredApprovalMode,
      reasonCodeRefs: evaluatedRequirement.reasonCodeRefs,
      evaluatedAt: "2026-04-20T09:05:00.000Z",
      tupleHash: evaluatedRequirement.tupleHash,
      version: 1,
    },
    checkpointId: `checkpoint_${seed}`,
    actionType: evaluatedRequirement.actionType,
    requestedBy: `actor_${seed}`,
    requestedAt: "2026-04-20T09:05:00.000Z",
    lifecycleLeaseRef: `lease_${seed}`,
    leaseAuthorityRef: "lease_authority_triage_approval",
    leaseTtlSeconds: 1800,
    lastHeartbeatAt: "2026-04-20T09:05:00.000Z",
    fencingToken: `fence_${seed}`,
    ownershipEpoch: 1,
    currentLineageFenceEpoch: bundle.epoch.lineageFenceEpoch ?? 1,
  });
  await application.approvalApplication.service.requestApproval({
    checkpointId: evaluated.checkpoint.checkpointId,
    requestedBy: `actor_${seed}`,
    requestedAt: "2026-04-20T09:05:30.000Z",
  });
  await application.approvalApplication.service.approveCheckpoint({
    checkpointId: evaluated.checkpoint.checkpointId,
    approvedBy: `approver_${seed}`,
    approvedAt: "2026-04-20T09:06:00.000Z",
    presentedRoleRefs: ["clinical_supervisor"],
  });
}

describe("306 booking reopen and supersession", () => {
  it("returns superseded booking handoffs to governed triage reopen and preserves patient-safe notification entry", async () => {
    const directResolutionApplication = createPhase3DirectResolutionApplication();
    await seedReviewTask(directResolutionApplication, "306_reopen");

    const selected = await directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: "task_306_reopen",
      actorRef: "actor_306_reopen",
      recordedAt: "2026-04-20T09:04:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "Telephone GP follow-up is required.",
      payload: payloadForAppointment(),
    });
    await directResolutionApplication.endpointApplication.submitEndpointDecision({
      taskId: "task_306_reopen",
      decisionId: selected.decision.decisionId,
      actorRef: "actor_306_reopen",
      recordedAt: "2026-04-20T09:04:30.000Z",
    });
    await materializeApprovedCheckpoint(
      directResolutionApplication,
      "task_306_reopen",
      "306_reopen",
    );
    const committed = await directResolutionApplication.commitDirectResolution({
      taskId: "task_306_reopen",
      actorRef: "actor_306_reopen",
      recordedAt: "2026-04-20T09:06:30.000Z",
    });

    let superseded = false;
    const wrappedDirectResolution = {
      ...directResolutionApplication,
      async queryTaskDirectResolution(taskId: string) {
        const bundle = await directResolutionApplication.queryTaskDirectResolution(taskId);
        if (!superseded || !bundle.bookingIntent) {
          return bundle;
        }
        return {
          ...bundle,
          bookingIntent: {
            ...bundle.bookingIntent,
            decisionSupersessionRecordRef: "decision_supersession_record_306",
          },
        };
      },
    };

    const application = createPhase4BookingTriageNotificationApplication({
      triageApplication: directResolutionApplication.triageApplication,
      directResolutionApplication: wrappedDirectResolution,
    });

    await application.acceptBookingHandoff({
      taskId: "task_306_reopen",
      bookingCaseId: "booking_case_306_reopened",
      patientRef: "patient_306_reopen",
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "vecells_local_gateway",
        careSetting: "general_practice",
      },
      actorRef: "actor_306_reopen",
      routeIntentBindingRef: "route_intent_306_reopen",
      commandActionRecordRef: "accept_booking_handoff_action_306_reopen",
      commandSettlementRecordRef: "accept_booking_handoff_settlement_306_reopen",
      acceptedAt: "2026-04-20T09:07:00.000Z",
      entryOriginKey: "secure_link",
      returnRouteRef: "/recovery/secure-link",
      contactRoute: {
        preferredChannel: "sms",
        maskedDestination: "+44******999",
        routeAuthorityState: "current",
        reachabilityAssessmentState: "clear",
        deliveryRiskState: "on_track",
      },
    });

    superseded = true;

    const refreshed = await application.refreshBookingTriageNotification({
      bookingCaseId: "booking_case_306_reopened",
      actorRef: "actor_306_reopen",
      routeIntentBindingRef: "route_intent_306_reopen_refresh",
      commandActionRecordRef: "refresh_booking_handoff_action_306_reopen",
      commandSettlementRecordRef: "refresh_booking_handoff_settlement_306_reopen",
      refreshedAt: "2026-04-20T09:08:00.000Z",
      entryOriginKey: "secure_link",
      returnRouteRef: "/recovery/secure-link",
      contactRoute: {
        preferredChannel: "sms",
        maskedDestination: "+44******999",
        routeAuthorityState: "current",
        reachabilityAssessmentState: "clear",
        deliveryRiskState: "on_track",
      },
    });

    const request = await directResolutionApplication.triageApplication.controlPlaneRepositories.getRequest(
      "request_306_reopen",
    );
    const link =
      await directResolutionApplication.triageApplication.controlPlaneRepositories.getLineageCaseLink(
        committed.bookingIntent.lineageCaseLinkRef,
      );

    expect(refreshed.patientStatus.statusCode).toBe("booking_reopened");
    expect(refreshed.notification?.notificationClass).toBe("reopened_to_triage");
    expect(refreshed.reopenRecordRef).toBeTruthy();
    expect(refreshed.lifecycleSignalRef).toBeTruthy();
    expect(refreshed.integration.deepLinkOriginKey).toBe("secure_link");
    expect(refreshed.patientStatus.deepLinkPath).toContain(
      "/bookings/booking_case_306_reopened?origin=secure_link",
    );
    expect(refreshed.requestWorkflowState).toBe("triage_active");

    expect(request?.toSnapshot().workflowState).toBe("triage_active");
    expect(link?.toSnapshot()).toMatchObject({
      lineageCaseLinkId: committed.bookingIntent.lineageCaseLinkRef,
      ownershipState: "returned",
      returnToTriageRef: refreshed.reopenRecordRef,
    });
  });
});
