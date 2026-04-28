import { describe, expect, it } from "vitest";
import { evaluateGovernedApprovalRequirement } from "../../packages/domains/triage_workspace/src/phase3-approval-escalation-kernel.ts";

import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES,
  PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION,
  PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME,
  createPhase4BookingTriageNotificationApplication,
  phase4BookingTriageNotificationMigrationPlanRefs,
  phase4BookingTriageNotificationPersistenceTables,
  phase4BookingTriageNotificationRoutes,
} from "../../services/command-api/src/phase4-booking-triage-notification-integration.ts";
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
    createdAt: "2026-04-20T08:00:00.000Z",
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
    queuedAt: "2026-04-20T08:01:00.000Z",
  });
  const claimed = await application.triageApplication.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-20T08:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: claimed.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-20T08:03:00.000Z",
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
    evaluatedAt: "2026-04-20T08:05:00.000Z",
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
      evaluatedAt: "2026-04-20T08:05:00.000Z",
      tupleHash: evaluatedRequirement.tupleHash,
      version: 1,
    },
    checkpointId: `checkpoint_${seed}`,
    actionType: evaluatedRequirement.actionType,
    requestedBy: `actor_${seed}`,
    requestedAt: "2026-04-20T08:05:00.000Z",
    lifecycleLeaseRef: `lease_${seed}`,
    leaseAuthorityRef: "lease_authority_triage_approval",
    leaseTtlSeconds: 1800,
    lastHeartbeatAt: "2026-04-20T08:05:00.000Z",
    fencingToken: `fence_${seed}`,
    ownershipEpoch: 1,
    currentLineageFenceEpoch: bundle.epoch.lineageFenceEpoch ?? 1,
  });
  await application.approvalApplication.service.requestApproval({
    checkpointId: evaluated.checkpoint.checkpointId,
    requestedBy: `actor_${seed}`,
    requestedAt: "2026-04-20T08:05:30.000Z",
  });
  await application.approvalApplication.service.approveCheckpoint({
    checkpointId: evaluated.checkpoint.checkpointId,
    approvedBy: `approver_${seed}`,
    approvedAt: "2026-04-20T08:06:00.000Z",
    presentedRoleRefs: ["clinical_supervisor"],
  });
}

describe("306 booking handoff idempotency", () => {
  it("publishes the 306 routes and keeps booking handoff acceptance replay-safe", async () => {
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    for (const routeId of [
      "booking_case_triage_notification_current",
      "workspace_task_accept_booking_handoff",
      "booking_case_refresh_triage_notification",
      "booking_case_dispatch_latest_notification",
    ]) {
      expect(routeIds.has(routeId)).toBe(true);
    }

    const directResolutionApplication = createPhase3DirectResolutionApplication();
    await seedReviewTask(directResolutionApplication, "306_handoff");

    const selected = await directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: "task_306_handoff",
      actorRef: "actor_306_handoff",
      recordedAt: "2026-04-20T08:04:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "Telephone GP follow-up is required.",
      payload: payloadForAppointment(),
    });
    await directResolutionApplication.endpointApplication.submitEndpointDecision({
      taskId: "task_306_handoff",
      decisionId: selected.decision.decisionId,
      actorRef: "actor_306_handoff",
      recordedAt: "2026-04-20T08:04:30.000Z",
    });
    await materializeApprovedCheckpoint(
      directResolutionApplication,
      "task_306_handoff",
      "306_handoff",
    );
    const committed = await directResolutionApplication.commitDirectResolution({
      taskId: "task_306_handoff",
      actorRef: "actor_306_handoff",
      recordedAt: "2026-04-20T08:06:30.000Z",
    });

    const application = createPhase4BookingTriageNotificationApplication({
      triageApplication: directResolutionApplication.triageApplication,
      directResolutionApplication,
    });

    const accepted = await application.acceptBookingHandoff({
      taskId: "task_306_handoff",
      bookingCaseId: "booking_case_306_handoff_live",
      patientRef: "patient_306_handoff",
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "vecells_local_gateway",
        careSetting: "general_practice",
      },
      actorRef: "actor_306_handoff",
      routeIntentBindingRef: "route_intent_306_handoff",
      commandActionRecordRef: "accept_booking_handoff_action_306",
      commandSettlementRecordRef: "accept_booking_handoff_settlement_306",
      acceptedAt: "2026-04-20T08:07:00.000Z",
      entryOriginKey: "secure_link",
      returnRouteRef: "/recovery/secure-link",
      contactRoute: {
        preferredChannel: "sms",
        maskedDestination: "+44******306",
        routeAuthorityState: "current",
        reachabilityAssessmentState: "clear",
        deliveryRiskState: "on_track",
      },
    });
    const replay = await application.acceptBookingHandoff({
      taskId: "task_306_handoff",
      bookingCaseId: "booking_case_306_handoff_live",
      patientRef: "patient_306_handoff",
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "vecells_local_gateway",
        careSetting: "general_practice",
      },
      actorRef: "actor_306_handoff",
      routeIntentBindingRef: "route_intent_306_handoff",
      commandActionRecordRef: "accept_booking_handoff_action_306",
      commandSettlementRecordRef: "accept_booking_handoff_settlement_306",
      acceptedAt: "2026-04-20T08:07:30.000Z",
      entryOriginKey: "secure_link",
      returnRouteRef: "/recovery/secure-link",
    });

    const request = await directResolutionApplication.triageApplication.controlPlaneRepositories.getRequest(
      "request_306_handoff",
    );
    const link =
      await directResolutionApplication.triageApplication.controlPlaneRepositories.getLineageCaseLink(
        committed.bookingIntent.lineageCaseLinkRef,
      );

    expect(application.serviceName).toBe(PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION);
    expect(PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES).toEqual([
      "GET /v1/bookings/cases/{bookingCaseId}/triage-notification/current",
    ]);
    expect(phase4BookingTriageNotificationRoutes).toHaveLength(4);
    expect(phase4BookingTriageNotificationMigrationPlanRefs).toContain(
      "services/command-api/migrations/142_phase4_booking_triage_notification_integration.sql",
    );
    expect(phase4BookingTriageNotificationPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_booking_triage_notification_integrations",
        "phase4_booking_patient_status_projections",
        "phase4_booking_status_notifications",
        "lifecycle_signals",
        "governed_reopen_records",
      ]),
    );

    expect(accepted.integration.bookingCaseId).toBe("booking_case_306_handoff_live");
    expect(accepted.patientStatus.statusCode).toBe("booking_handoff_active");
    expect(accepted.notification?.notificationClass).toBe("handoff_entry");
    expect(accepted.communicationEnvelope?.dispatchEligibilityState).toBe("dispatchable");
    expect(accepted.communicationEnvelope?.queueState).toBe("queued");
    expect(accepted.receiptBridge?.patientPostureState).toBe("delivery_pending");
    expect(accepted.integration.deepLinkOriginKey).toBe("secure_link");
    expect(accepted.patientStatus.deepLinkPath).toContain(
      "/bookings/booking_case_306_handoff_live?origin=secure_link",
    );
    expect(accepted.requestWorkflowState).toBe("handoff_active");
    expect(accepted.lifecycleSignalRef).toBeTruthy();

    expect(replay.replayed).toBe(true);
    // The second accept is the semantic_replay path for the same request lineage.
    expect(replay.integration.integrationId).toBe(accepted.integration.integrationId);
    expect(replay.notification?.bookingStatusNotificationId).toBe(
      accepted.notification?.bookingStatusNotificationId,
    );

    expect(request?.toSnapshot().workflowState).toBe("handoff_active");
    expect(link?.toSnapshot()).toMatchObject({
      lineageCaseLinkId: committed.bookingIntent.lineageCaseLinkRef,
      ownershipState: "acknowledged",
      caseFamily: "booking",
    });
  });

  it("fails closed when a superseded booking intent is handed to booking acknowledgement", async () => {
    const directResolutionApplication = createPhase3DirectResolutionApplication();
    await seedReviewTask(directResolutionApplication, "306_stale");

    const selected = await directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: "task_306_stale",
      actorRef: "actor_306_stale",
      recordedAt: "2026-04-20T10:04:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "Telephone GP follow-up is required.",
      payload: payloadForAppointment(),
    });
    await directResolutionApplication.endpointApplication.submitEndpointDecision({
      taskId: "task_306_stale",
      decisionId: selected.decision.decisionId,
      actorRef: "actor_306_stale",
      recordedAt: "2026-04-20T10:04:30.000Z",
    });
    await materializeApprovedCheckpoint(
      directResolutionApplication,
      "task_306_stale",
      "306_stale",
    );
    await directResolutionApplication.commitDirectResolution({
      taskId: "task_306_stale",
      actorRef: "actor_306_stale",
      recordedAt: "2026-04-20T10:06:30.000Z",
    });

    const wrappedDirectResolution = {
      ...directResolutionApplication,
      async queryTaskDirectResolution(taskId: string) {
        const bundle = await directResolutionApplication.queryTaskDirectResolution(taskId);
        if (!bundle.bookingIntent) {
          return bundle;
        }
        return {
          ...bundle,
          bookingIntent: {
            ...bundle.bookingIntent,
            decisionSupersessionRecordRef: "decision_supersession_record_306_stale",
          },
        };
      },
    };

    const application = createPhase4BookingTriageNotificationApplication({
      triageApplication: directResolutionApplication.triageApplication,
      directResolutionApplication: wrappedDirectResolution,
    });

    await expect(
      application.acceptBookingHandoff({
        taskId: "task_306_stale",
        bookingCaseId: "booking_case_306_handoff_live",
        patientRef: "patient_306_stale",
        tenantId: "tenant_vecells_beta",
        providerContext: {
          practiceRef: "ods_A83002",
          supplierHintRef: "vecells_local_gateway",
          careSetting: "general_practice",
        },
        actorRef: "actor_306_stale",
        routeIntentBindingRef: "route_intent_306_stale",
        commandActionRecordRef: "accept_booking_handoff_action_306_stale",
        commandSettlementRecordRef: "accept_booking_handoff_settlement_306_stale",
        acceptedAt: "2026-04-20T10:07:00.000Z",
        entryOriginKey: "secure_link",
        returnRouteRef: "/recovery/secure-link",
      }),
    ).rejects.toMatchObject({
      code: "SOURCE_DECISION_SUPERSEDED",
    });
  });
});
