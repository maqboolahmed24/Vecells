import {
  atMinute,
  beginNativeCommit,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";
import {
  createPhase5PracticeContinuityService,
  createPhase5PracticeContinuityStore,
  type CapturePracticeAcknowledgementInput,
  type EnqueuePracticeContinuityMessageInput,
  type ReopenPracticeAcknowledgementDebtInput,
  type RecordPracticeContinuityReceiptInput,
} from "../../packages/domains/hub_coordination/src/phase5-practice-continuity-engine.ts";

export { atMinute };

export async function setupPracticeContinuityHarness(seed = "322") {
  const commitHarness = await setupHubCommitHarness(seed);
  const begin = await beginNativeCommit(commitHarness);
  const commitResult = await commitHarness.commitService.submitNativeApiCommit(
    await buildNativeSubmitInput(commitHarness, begin, {
      response: {
        responseClass: "authoritative_confirmed",
        receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
        adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
        providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
        supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
        sourceFamilies: [
          "adapter_receipt",
          "provider_authoritative_confirmation",
        ],
        hardMatchRefsPassed: [
          "selected_candidate",
          "capacity_unit",
          "provider_binding",
        ],
      },
    }),
  );
  const repositories = createPhase5PracticeContinuityStore();
  const continuityService = createPhase5PracticeContinuityService({
    repositories,
    hubCaseService: commitHarness.service,
    offerRepositories: commitHarness.offerRepositories,
    commitRepositories: commitHarness.commitRepositories,
    policyService: commitHarness.policyService,
    actingScopeService: commitHarness.visibilityService,
  });
  return {
    ...commitHarness,
    begin,
    commitResult,
    repositories,
    continuityService,
  };
}

export function buildEnqueuePracticeContinuityInput(
  harness: Awaited<ReturnType<typeof setupPracticeContinuityHarness>>,
  overrides: Partial<EnqueuePracticeContinuityMessageInput> = {},
): EnqueuePracticeContinuityMessageInput {
  const hubCoordinationCaseId =
    harness.commitResult.hubTransition?.hubCase.hubCoordinationCaseId ??
    harness.accepted.hubTransition.hubCase.hubCoordinationCaseId;
  return {
    hubCoordinationCaseId,
    actorRef: `continuity_actor_${hubCoordinationCaseId}`,
    routeIntentBindingRef: `route_practice_continuity_${hubCoordinationCaseId}`,
    commandActionRecordRef: `action_practice_continuity_${hubCoordinationCaseId}`,
    commandSettlementRecordRef: `settlement_practice_continuity_${hubCoordinationCaseId}`,
    recordedAt: atMinute(15),
    crossOrganisationVisibilityEnvelopeId:
      harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    continuityChannel: "mesh",
    dispatchWorkflowId: `workflow_${hubCoordinationCaseId}`,
    sourceRefs: ["tests/integration/322_practice_continuity.helpers.ts"],
    ...overrides,
  };
}

export function buildReceiptInput(
  practiceContinuityMessageId: string,
  checkpointKind: RecordPracticeContinuityReceiptInput["checkpointKind"],
  overrides: Partial<RecordPracticeContinuityReceiptInput> = {},
): RecordPracticeContinuityReceiptInput {
  return {
    practiceContinuityMessageId,
    recordedAt: atMinute(16),
    checkpointKind,
    sourceRefs: ["tests/integration/322_practice_continuity.helpers.ts"],
    ...overrides,
  };
}

export async function buildAcknowledgementInput(
  harness: Awaited<ReturnType<typeof setupPracticeContinuityHarness>>,
  practiceContinuityMessageId: string,
  overrides: Partial<CapturePracticeAcknowledgementInput> = {},
): Promise<CapturePracticeAcknowledgementInput> {
  const hubCoordinationCaseId =
    harness.commitResult.hubTransition?.hubCase.hubCoordinationCaseId ??
    harness.accepted.hubTransition.hubCase.hubCoordinationCaseId;
  const hubCase = (
    await harness.service.queryHubCaseBundle(hubCoordinationCaseId)
  )!.hubCase;
  const liveTruthTupleHash = (
    await harness.offerRepositories.getTruthProjectionForCase(hubCoordinationCaseId)
  )!.toSnapshot().truthTupleHash;
  return {
    hubCoordinationCaseId,
    practiceContinuityMessageId,
    actorRef: `ack_actor_${hubCoordinationCaseId}`,
    routeIntentBindingRef: `route_practice_ack_${hubCoordinationCaseId}`,
    commandActionRecordRef: `action_practice_ack_${hubCoordinationCaseId}`,
    commandSettlementRecordRef: `settlement_practice_ack_${hubCoordinationCaseId}`,
    recordedAt: atMinute(18),
    ackEvidenceKind: "message_reply",
    acknowledgedByRef: `origin_practice_mailbox_${hubCoordinationCaseId}`,
    presentedAckGeneration: hubCase.practiceAckGeneration,
    presentedTruthTupleHash: liveTruthTupleHash,
    presentedVisibilityEnvelopeVersionRef:
      harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    sourceRefs: ["tests/integration/322_practice_continuity.helpers.ts"],
    ...overrides,
  };
}

export function buildReopenInput(
  harness: Awaited<ReturnType<typeof setupPracticeContinuityHarness>>,
  overrides: Partial<ReopenPracticeAcknowledgementDebtInput> = {},
): ReopenPracticeAcknowledgementDebtInput {
  const hubCoordinationCaseId =
    harness.commitResult.hubTransition?.hubCase.hubCoordinationCaseId ??
    harness.accepted.hubTransition.hubCase.hubCoordinationCaseId;
  return {
    hubCoordinationCaseId,
    actorRef: `reopen_actor_${hubCoordinationCaseId}`,
    routeIntentBindingRef: `route_practice_reopen_${hubCoordinationCaseId}`,
    commandActionRecordRef: `action_practice_reopen_${hubCoordinationCaseId}`,
    commandSettlementRecordRef: `settlement_practice_reopen_${hubCoordinationCaseId}`,
    recordedAt: atMinute(19),
    changeClass: "supplier_drift",
    deltaReason: "truth_changed",
    sourceRefs: ["tests/integration/322_practice_continuity.helpers.ts"],
    ...overrides,
  };
}
