import { describe, expect, it } from "vitest";
import { evaluateGovernedApprovalRequirement } from "../../packages/domains/triage_workspace/src/phase3-approval-escalation-kernel.ts";
import { createPhase3DirectResolutionApplication } from "../../services/command-api/src/phase3-direct-resolution-handoffs.ts";
import { createPhase4BookingTriageNotificationApplication } from "../../services/command-api/src/phase4-booking-triage-notification-integration.ts";

import {
  buildReleasedCapacity,
  setupReconciliationFlow,
  setupWaitlistFlow,
} from "./308_manage_waitlist_assisted.helpers.ts";

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
    createdAt: "2026-04-22T09:00:00.000Z",
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
    queuedAt: "2026-04-22T09:01:00.000Z",
  });
  const claimed = await application.triageApplication.claimTask({
    taskId: queued.task.taskId,
    actorRef: `actor_${seed}`,
    claimedAt: "2026-04-22T09:02:00.000Z",
  });
  return application.triageApplication.enterReview({
    taskId: claimed.task.taskId,
    actorRef: `actor_${seed}`,
    openedAt: "2026-04-22T09:03:00.000Z",
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
    evaluatedAt: "2026-04-22T09:05:00.000Z",
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
      evaluatedAt: "2026-04-22T09:05:00.000Z",
      tupleHash: evaluatedRequirement.tupleHash,
      version: 1,
    },
    checkpointId: `checkpoint_${seed}`,
    actionType: evaluatedRequirement.actionType,
    requestedBy: `actor_${seed}`,
    requestedAt: "2026-04-22T09:05:00.000Z",
    lifecycleLeaseRef: `lease_${seed}`,
    leaseAuthorityRef: "lease_authority_triage_approval",
    leaseTtlSeconds: 1800,
    lastHeartbeatAt: "2026-04-22T09:05:00.000Z",
    fencingToken: `fence_${seed}`,
    ownershipEpoch: 1,
    currentLineageFenceEpoch: bundle.epoch.lineageFenceEpoch ?? 1,
  });
  await application.approvalApplication.service.requestApproval({
    checkpointId: evaluated.checkpoint.checkpointId,
    requestedBy: `actor_${seed}`,
    requestedAt: "2026-04-22T09:05:30.000Z",
  });
  await application.approvalApplication.service.approveCheckpoint({
    checkpointId: evaluated.checkpoint.checkpointId,
    approvedBy: `approver_${seed}`,
    approvedAt: "2026-04-22T09:06:00.000Z",
    presentedRoleRefs: ["clinical_supervisor"],
  });
}

function joinWaitlistInput(flow: any, overrides: Record<string, unknown> = {}) {
  return {
    bookingCaseId: `booking_case_${flow.seed}`,
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `join_waitlist_action_${flow.seed}`,
    commandSettlementRecordRef: `join_waitlist_settlement_${flow.seed}`,
    occurredAt: "2026-04-24T09:00:00.000Z",
    routeIntentBindingRef: `route_intent_waitlist_${flow.seed}`,
    payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/join`,
    edgeCorrelationId: `edge_waitlist_join_${flow.seed}`,
    ...overrides,
  };
}

function processReleasedCapacityInput(flow: any, overrides: Record<string, unknown> = {}) {
  return {
    releasedCapacity: [buildReleasedCapacity(flow.seed)],
    actorRef: `actor_${flow.seed}`,
    subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
    commandActionRecordRef: `process_released_capacity_${flow.seed}`,
    commandSettlementRecordRef: `process_released_capacity_settlement_${flow.seed}`,
    processedAt: "2026-04-24T09:50:00.000Z",
    payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/process`,
    edgeCorrelationId: `edge_waitlist_process_${flow.seed}`,
    ...overrides,
  };
}

describe("309 end-to-end lifecycle and notification truth", () => {
  it("keeps one pending-to-booked lifecycle chain until an authoritative read confirms the appointment", async () => {
    const flow = await setupReconciliationFlow({
      seed: "309_reconcile_lifecycle",
      supplierRef: "optum_emis_web",
      integrationMode: "im1_patient_api",
      deploymentType: "internet_patient_shell",
      audience: "patient",
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession!.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-22T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
        blockerReasonCode: "awaiting_supplier_commit",
        recoveryMode: "awaiting_external_confirmation",
        externalConfirmationGateRef: null,
        providerReference: `provider_reference_${flow.seed}`,
      },
      expectedSelectionProofHash: flow.offerSession!.selectionProofHash,
      expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
      expectedOwnershipEpochRef: 4,
      expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
      expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
      expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}`,
      edgeCorrelationId: `edge_commit_${flow.seed}`,
    });

    const callbackPending = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}`,
      observedAt: "2026-04-22T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "confirmed", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "confirmed",
      providerReference: `provider_reference_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}`,
    });

    expect(callbackPending.bookingCommit.transaction.authoritativeOutcomeState).toBe(
      "confirmation_pending",
    );
    expect(callbackPending.bookingCommit.appointmentRecord).toBeNull();
    expect(callbackPending.externalConfirmationGate?.state).not.toBe("confirmed");

    const confirmed = await flow.reconciliationApplication.forceReconcileAttempt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `force_reconcile_action_${flow.seed}`,
      commandSettlementRecordRef: `force_reconcile_settlement_${flow.seed}`,
      attemptedAt: "2026-04-22T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-22T12:27:00.000Z",
        outcome: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
        sourceFamily: "authoritative_read",
        hardMatchRefs: {
          selected_slot: "matched",
          patient_identity: "matched",
          appointment_window: "matched",
        },
        competingGateConfidences: [0.2],
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/read`,
      edgeCorrelationId: `edge_reconciliation_read_${flow.seed}`,
    });

    expect(confirmed.bookingCommit.transaction.authoritativeOutcomeState).toBe("booked");
    expect(confirmed.bookingCommit.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(confirmed.externalConfirmationGate?.state).toBe("confirmed");
    expect(confirmed.reconciliation.attempts.length).toBe(2);
  });

  it("keeps waitlist deadline authority monotone across offer expiry and hub fallback refresh", async () => {
    const flow = await setupWaitlistFlow({
      seed: "309_waitlist_hub_refresh",
    });

    const joined = await flow.waitlistApplication.joinWaitlist(
      joinWaitlistInput(flow, {
        deadlineAt: "2026-04-24T18:00:00.000Z",
      }),
    );
    const initialDeadline = joined.waitlist.entry.deadlineAt;
    const processed = await flow.waitlistApplication.processReleasedCapacity(
      processReleasedCapacityInput(flow),
    );

    const expired = await flow.waitlistApplication.expireWaitlistOffer({
      waitlistOfferId: processed.issuedOffers[0]!.activeOffer!.waitlistOfferId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `expire_waitlist_offer_${flow.seed}`,
      commandSettlementRecordRef: `expire_waitlist_offer_settlement_${flow.seed}`,
      expiredAt: "2026-04-24T10:15:00.000Z",
      reasonCode: "offer_ttl_elapsed",
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/expire`,
      edgeCorrelationId: `edge_waitlist_expire_${flow.seed}`,
    });

    expect(expired.waitlist.entry.deadlineAt).toBe(initialDeadline);
    expect(expired.waitlist.deadlineEvaluation.deadlineAt).toBe(initialDeadline);
    expect(expired.waitlist.fallbackObligation.requiredFallbackRoute).toBe("callback");
    expect(expired.bookingCase.bookingCase.status).toBe("callback_fallback");

    await flow.waitlistApplication.waitlistService.refreshFallbackObligation({
      waitlistEntryId: expired.waitlist.entry.waitlistEntryId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `${flow.selectionAudience}_actor_${flow.seed}`,
      commandActionRecordRef: `refresh_fallback_${flow.seed}`,
      commandSettlementRecordRef: `refresh_fallback_settlement_${flow.seed}`,
      evaluatedAt: "2026-04-24T10:20:00.000Z",
      staleCapacityTruth: true,
      noEligibleSupply: false,
      policyCutoff: false,
      callbackAllowed: false,
      hubAllowed: true,
      payloadArtifactRef: `artifact://booking/waitlist/${flow.seed}/refresh`,
      edgeCorrelationId: `edge_waitlist_refresh_${flow.seed}`,
    });
    const refreshed = await flow.waitlistApplication.queryCurrentWaitlist({
      bookingCaseId: `booking_case_${flow.seed}`,
    });

    expect(refreshed?.waitlist.entry.deadlineAt).toBe(initialDeadline);
    expect(refreshed?.waitlist.deadlineEvaluation.deadlineAt).toBe(initialDeadline);
    expect(refreshed?.waitlist.fallbackObligation.requiredFallbackRoute).toBe("hub");
    expect(refreshed?.waitlist.continuationTruth.fallbackObligationRef).toBe(
      refreshed?.waitlist.fallbackObligation.waitlistFallbackObligationId,
    );
  });

  it("keeps notification handoff and reopen flows tied to one lifecycle request without losing patient-safe deep links", async () => {
    const seed = "309_notification_truth";
    const directResolutionApplication = createPhase3DirectResolutionApplication();
    await seedReviewTask(directResolutionApplication, seed);

    const selected = await directResolutionApplication.endpointApplication.selectEndpoint({
      taskId: `task_${seed}`,
      actorRef: `actor_${seed}`,
      recordedAt: "2026-04-22T09:04:00.000Z",
      chosenEndpoint: "appointment_required",
      reasoningText: "Telephone GP follow-up is required.",
      payload: payloadForAppointment(),
    });
    await directResolutionApplication.endpointApplication.submitEndpointDecision({
      taskId: `task_${seed}`,
      decisionId: selected.decision.decisionId,
      actorRef: `actor_${seed}`,
      recordedAt: "2026-04-22T09:04:30.000Z",
    });
    await materializeApprovedCheckpoint(
      directResolutionApplication,
      `task_${seed}`,
      seed,
    );
    const committed = await directResolutionApplication.commitDirectResolution({
      taskId: `task_${seed}`,
      actorRef: `actor_${seed}`,
      recordedAt: "2026-04-22T09:06:30.000Z",
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
            decisionSupersessionRecordRef: "decision_supersession_record_309",
          },
        };
      },
    };

    const application = createPhase4BookingTriageNotificationApplication({
      triageApplication: directResolutionApplication.triageApplication,
      directResolutionApplication: wrappedDirectResolution,
    });

    const accepted = await application.acceptBookingHandoff({
      taskId: `task_${seed}`,
      bookingCaseId: "booking_case_309_handoff_live",
      patientRef: `patient_${seed}`,
      tenantId: "tenant_vecells_beta",
      providerContext: {
        practiceRef: "ods_A83002",
        supplierHintRef: "vecells_local_gateway",
        careSetting: "general_practice",
      },
      actorRef: `actor_${seed}`,
      routeIntentBindingRef: `route_intent_${seed}`,
      commandActionRecordRef: `accept_booking_handoff_action_${seed}`,
      commandSettlementRecordRef: `accept_booking_handoff_settlement_${seed}`,
      acceptedAt: "2026-04-22T09:07:00.000Z",
      entryOriginKey: "secure_link",
      returnRouteRef: "/recovery/secure-link",
      contactRoute: {
        preferredChannel: "sms",
        maskedDestination: "+44******309",
        routeAuthorityState: "current",
        reachabilityAssessmentState: "clear",
        deliveryRiskState: "on_track",
      },
    });

    expect(accepted.patientStatus.statusCode).toBe("booking_handoff_active");
    expect(accepted.notification?.notificationClass).toBe("handoff_entry");
    expect(accepted.integration.deepLinkOriginKey).toBe("secure_link");
    expect(accepted.patientStatus.deepLinkPath).toContain(
      "/bookings/booking_case_309_handoff_live?origin=secure_link",
    );

    superseded = true;

    const refreshed = await application.refreshBookingTriageNotification({
      bookingCaseId: "booking_case_309_handoff_live",
      actorRef: `actor_${seed}`,
      routeIntentBindingRef: `route_intent_refresh_${seed}`,
      commandActionRecordRef: `refresh_booking_handoff_action_${seed}`,
      commandSettlementRecordRef: `refresh_booking_handoff_settlement_${seed}`,
      refreshedAt: "2026-04-22T09:08:00.000Z",
      entryOriginKey: "secure_link",
      returnRouteRef: "/recovery/secure-link",
      contactRoute: {
        preferredChannel: "sms",
        maskedDestination: "+44******309",
        routeAuthorityState: "current",
        reachabilityAssessmentState: "clear",
        deliveryRiskState: "on_track",
      },
    });

    const request =
      await directResolutionApplication.triageApplication.controlPlaneRepositories.getRequest(
        `request_${seed}`,
      );
    const link =
      await directResolutionApplication.triageApplication.controlPlaneRepositories.getLineageCaseLink(
        committed.bookingIntent.lineageCaseLinkRef,
      );

    expect(refreshed.patientStatus.statusCode).toBe("booking_reopened");
    expect(refreshed.notification?.notificationClass).toBe("reopened_to_triage");
    expect(refreshed.requestWorkflowState).toBe("triage_active");
    expect(refreshed.reopenRecordRef).toBeTruthy();
    expect(request?.toSnapshot().workflowState).toBe("triage_active");
    expect(link?.toSnapshot()).toMatchObject({
      lineageCaseLinkId: committed.bookingIntent.lineageCaseLinkRef,
      ownershipState: "returned",
      returnToTriageRef: refreshed.reopenRecordRef,
    });
  });
});
