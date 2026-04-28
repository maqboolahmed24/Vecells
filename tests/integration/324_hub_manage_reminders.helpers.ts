import {
  atMinute,
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  setupPracticeContinuityHarness,
} from "./322_practice_continuity.helpers.ts";
import {
  createPhase5ReminderManageVisibilityService,
  createPhase5ReminderManageVisibilityStore,
  type CompileNetworkManageCapabilitiesInput,
  type CreateOrRefreshReminderPlanInput,
  type ExecuteHubManageActionInput,
  type RecordReminderDeliveryEvidenceInput,
} from "../../packages/domains/hub_coordination/src/phase5-reminders-manage-visibility-engine.ts";

export { atMinute };

export async function setupReminderManageHarness(seed = "324") {
  const continuityHarness = await setupPracticeContinuityHarness(seed);
  const repositories = createPhase5ReminderManageVisibilityStore();
  const manageService = createPhase5ReminderManageVisibilityService({
    repositories,
    hubCaseService: continuityHarness.service,
    offerRepositories: continuityHarness.offerRepositories,
    commitRepositories: continuityHarness.commitRepositories,
    policyService: continuityHarness.policyService,
    actingScopeService: continuityHarness.visibilityService,
    practiceContinuityService: continuityHarness.continuityService,
  });
  return {
    ...continuityHarness,
    repositories,
    manageService,
  };
}

export async function settlePracticeAcknowledgement(
  harness: Awaited<ReturnType<typeof setupReminderManageHarness>>,
) {
  const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
    buildEnqueuePracticeContinuityInput(harness, {
      continuityChannel: "direct_api",
      recordedAt: atMinute(15),
    }),
  );
  if (!enqueued.message) {
    throw new Error("Expected a current PracticeContinuityMessage.");
  }
  await harness.continuityService.recordReceiptCheckpoint(
    buildReceiptInput(enqueued.message.practiceContinuityMessageId, "delivery_available", {
      recordedAt: atMinute(16),
    }),
  );
  await harness.continuityService.recordReceiptCheckpoint(
    buildReceiptInput(enqueued.message.practiceContinuityMessageId, "delivery_downloaded", {
      recordedAt: atMinute(17),
    }),
  );
  const acknowledged = await harness.continuityService.capturePracticeAcknowledgement(
    await buildAcknowledgementInput(harness, enqueued.message.practiceContinuityMessageId, {
      recordedAt: atMinute(18),
    }),
  );
  return {
    enqueued,
    acknowledged,
  };
}

export function currentHubCoordinationCaseId(
  harness: Awaited<ReturnType<typeof setupReminderManageHarness>>,
): string {
  return (
    harness.commitResult.hubTransition?.hubCase.hubCoordinationCaseId ??
    harness.accepted.hubTransition.hubCase.hubCoordinationCaseId
  );
}

export function buildReminderPlanInput(
  harness: Awaited<ReturnType<typeof setupReminderManageHarness>>,
  overrides: Partial<CreateOrRefreshReminderPlanInput> = {},
): CreateOrRefreshReminderPlanInput {
  const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);
  return {
    hubCoordinationCaseId,
    scheduledFor: atMinute(120),
    recordedAt: atMinute(20),
    threadId: `thread_${hubCoordinationCaseId}`,
    conversationClusterRef: `cluster_${hubCoordinationCaseId}`,
    conversationSubthreadRef: `subthread_reminder_${hubCoordinationCaseId}`,
    communicationEnvelopeRef: `comm_envelope_${hubCoordinationCaseId}`,
    templateSetRef: `template_set_${hubCoordinationCaseId}`,
    templateVersionRef: `template_v1_${hubCoordinationCaseId}`,
    routeProfileRef: `route_profile_${hubCoordinationCaseId}`,
    channel: "sms",
    payloadRef: `payload_${hubCoordinationCaseId}`,
    contactRouteRef: `contact_route_${hubCoordinationCaseId}`,
    contactRouteVersionRef: `contact_route_v1_${hubCoordinationCaseId}`,
    currentContactRouteSnapshotRef: `contact_route_snapshot_${hubCoordinationCaseId}`,
    reachabilityDependencyRef: `reachability_dependency_${hubCoordinationCaseId}`,
    currentReachabilityAssessmentRef: `reachability_clear_${hubCoordinationCaseId}`,
    assessmentState: "clear",
    routeAuthorityState: "current",
    reachabilityEpoch: 3,
    contactRepairJourneyRef: `contact_repair_${hubCoordinationCaseId}`,
    rebindState: "rebound",
    deliveryModelVersionRef: "phase5.network_reminder.delivery.v1",
    artifactPresentationContractRef: `artifact_contract_${hubCoordinationCaseId}`,
    outboundNavigationGrantPolicyRef: `nav_grant_${hubCoordinationCaseId}`,
    transitionEnvelopeRef: `transition_reminder_${hubCoordinationCaseId}`,
    releaseRecoveryDispositionRef: `recovery_reminder_${hubCoordinationCaseId}`,
    sourceRefs: ["tests/integration/324_hub_manage_reminders.helpers.ts"],
    ...overrides,
  };
}

export function buildManageCapabilitiesInput(
  harness: Awaited<ReturnType<typeof setupReminderManageHarness>>,
  overrides: Partial<CompileNetworkManageCapabilitiesInput> = {},
): CompileNetworkManageCapabilitiesInput {
  const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);
  return {
    hubCoordinationCaseId,
    recordedAt: atMinute(21),
    visibilityEnvelopeVersionRef: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    sessionFenceToken: `session_fence_${hubCoordinationCaseId}`,
    subjectFenceToken: `subject_fence_${hubCoordinationCaseId}`,
    routeIntentRef: `route_manage_${hubCoordinationCaseId}`,
    subjectRef: `patient_${hubCoordinationCaseId}`,
    sessionEpochRef: `session_epoch_${hubCoordinationCaseId}`,
    subjectBindingVersionRef: `subject_binding_${hubCoordinationCaseId}`,
    manifestVersionRef: `manifest_${hubCoordinationCaseId}`,
    releaseApprovalFreezeRef: `release_approval_${hubCoordinationCaseId}`,
    channelReleaseFreezeState: "released",
    supportedActions: ["cancel", "reschedule", "callback_request", "details_update"],
    capabilityLeaseMinutes: 30,
    identityHoldState: false,
    assessmentState: "clear",
    routeAuthorityState: "current",
    rebindState: "rebound",
    sessionCurrent: true,
    subjectBindingCurrent: true,
    publicationCurrent: true,
    minimumNecessaryContractRef: "MinimumNecessaryContract.patient_manage",
    sourceRefs: ["tests/integration/324_hub_manage_reminders.helpers.ts"],
    ...overrides,
  };
}

export function buildManageActionInput(
  harness: Awaited<ReturnType<typeof setupReminderManageHarness>>,
  networkManageCapabilitiesId: string,
  actionScope: ExecuteHubManageActionInput["actionScope"],
  overrides: Partial<ExecuteHubManageActionInput> = {},
): ExecuteHubManageActionInput {
  const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);
  return {
    hubCoordinationCaseId,
    networkManageCapabilitiesId,
    actionScope,
    idempotencyKey: `${actionScope}_${hubCoordinationCaseId}`,
    actorRef: `manage_actor_${hubCoordinationCaseId}`,
    routeIntentRef: `route_manage_${hubCoordinationCaseId}`,
    commandActionRecordRef: `action_manage_${actionScope}_${hubCoordinationCaseId}`,
    commandSettlementRecordRef: `settlement_manage_${actionScope}_${hubCoordinationCaseId}`,
    recordedAt: atMinute(22),
    transitionEnvelopeRef: `transition_manage_${actionScope}_${hubCoordinationCaseId}`,
    surfaceRouteContractRef: `surface_route_manage_${hubCoordinationCaseId}`,
    surfacePublicationRef: `surface_publication_manage_${hubCoordinationCaseId}`,
    runtimePublicationBundleRef: `runtime_bundle_manage_${hubCoordinationCaseId}`,
    releaseRecoveryDispositionRef: `release_recovery_manage_${hubCoordinationCaseId}`,
    mutationGateRef: "ScopedMutationGate.hub_manage",
    presentationArtifactRef: `artifact_manage_${actionScope}_${hubCoordinationCaseId}`,
    practiceVisibilityEnvelopeId:
      harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    materialChange: true,
    containsClinicalText: false,
    sourceRefs: ["tests/integration/324_hub_manage_reminders.helpers.ts"],
    ...overrides,
  };
}

export function buildReminderEvidenceInput(
  harness: Awaited<ReturnType<typeof setupReminderManageHarness>>,
  reminderPlanId: string,
  reminderScheduleId: string,
  overrides: Partial<RecordReminderDeliveryEvidenceInput> = {},
): RecordReminderDeliveryEvidenceInput {
  const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);
  return {
    reminderPlanId,
    reminderScheduleId,
    observedAt: atMinute(23),
    evidenceState: "failed",
    transportAckState: "rejected",
    deliveryRiskState: "likely_failed",
    adapterName: "sms",
    adapterCorrelationKey: `sms_corr_${hubCoordinationCaseId}`,
    externalDispatchRef: `sms_dispatch_${hubCoordinationCaseId}`,
    suppressionReasonRefs: ["delivery_failure"],
    actorRef: `reminder_actor_${hubCoordinationCaseId}`,
    routeIntentBindingRef: `route_reminder_${hubCoordinationCaseId}`,
    commandActionRecordRef: `action_reminder_${hubCoordinationCaseId}`,
    commandSettlementRecordRef: `settlement_reminder_${hubCoordinationCaseId}`,
    practiceVisibilityEnvelopeId:
      harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    reopenPracticeAcknowledgement: true,
    sourceRefs: ["tests/integration/324_hub_manage_reminders.helpers.ts"],
    ...overrides,
  };
}
