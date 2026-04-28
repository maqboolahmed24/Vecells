import {
  atMinute,
  beginNativeCommit,
  buildBeginCommitInput,
  buildImportedIngestInput,
  buildManualCaptureInput,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";
import {
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  setupPracticeContinuityHarness,
} from "./322_practice_continuity.helpers.ts";
import {
  buildLinkCallbackInput,
  buildLinkReturnInput,
  buildResolveNoSlotInput,
  openFallbackOfferSession,
  setupHubFallbackHarness,
} from "./323_hub_fallback.helpers.ts";
import {
  buildReminderEvidenceInput,
  buildReminderPlanInput,
  currentHubCoordinationCaseId,
  settlePracticeAcknowledgement,
  setupReminderManageHarness,
} from "./324_hub_manage_reminders.helpers.ts";

export { atMinute };

export async function createAuthoritativeBookedCommit(seed: string) {
  const harness = await setupHubCommitHarness(seed);
  const begin = await beginNativeCommit(harness);
  const booked = await harness.commitService.submitNativeApiCommit(
    await buildNativeSubmitInput(harness, begin, {
      response: {
        responseClass: "authoritative_confirmed",
        receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
        adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
        providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
        supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
        sourceFamilies: ["same_commit_read_after_write", "durable_provider_reference"],
        hardMatchRefsPassed: [
          "selected_candidate",
          "capacity_unit",
          "provider_binding",
        ],
      },
    }),
  );
  return {
    harness,
    begin,
    booked,
  };
}

export async function createImportedDisputedCommit(seed: string) {
  const harness = await setupHubCommitHarness(seed);
  const begin = await harness.commitService.beginCommitAttempt(
    await buildBeginCommitInput(harness, "imported_confirmation", {
      recordedAt: atMinute(13),
    }),
  );
  const disputed = await harness.commitService.ingestImportedConfirmation(
    await buildImportedIngestInput(harness, begin, {
      importedEvidence: {
        importedEvidenceRef: `imported_evidence_${seed}`,
        sourceVersion: "wrong_source_version",
        supplierBookingReference: `imported_booking_${seed}`,
        supplierAppointmentRef: `supplier_appt_${seed}`,
        supplierCorrelationKey: `supplier_corr_${seed}`,
        matchedWindowMinutes: 15,
        evidenceSourceFamilies: ["imported_supplier_message"],
      },
    }),
  );
  return {
    harness,
    begin,
    disputed,
  };
}

export async function createMeshAcknowledgementFlow(seed: string) {
  const harness = await setupPracticeContinuityHarness(seed);
  const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
    buildEnqueuePracticeContinuityInput(harness, {
      continuityChannel: "mesh",
      recordedAt: atMinute(15),
    }),
  );
  if (!enqueued.message) {
    throw new Error("Expected current practice continuity message for mesh flow.");
  }
  const dispatched = await harness.continuityService.dispatchPracticeContinuityMessage({
    practiceContinuityMessageId: enqueued.message.practiceContinuityMessageId,
    attemptedAt: atMinute(16),
    sourceRefs: ["tests/integration/339_commit_mesh_no_slot.helpers.ts"],
  });
  const downloaded = await harness.continuityService.recordReceiptCheckpoint(
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
    harness,
    enqueued,
    dispatched,
    downloaded,
    acknowledged,
  };
}

export async function createReminderRecoveryFlow(seed: string) {
  const harness = await setupReminderManageHarness(seed);
  const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);
  await settlePracticeAcknowledgement(harness);
  const refreshed = await harness.manageService.refreshPracticeVisibilityProjection({
    hubCoordinationCaseId,
    visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    recordedAt: atMinute(20),
    sourceRefs: ["tests/integration/339_commit_mesh_no_slot.helpers.ts"],
  });
  const planned = await harness.manageService.createOrRefreshReminderPlan(
    buildReminderPlanInput(harness, {
      recordedAt: atMinute(21),
      scheduledFor: atMinute(121),
    }),
  );
  const failed = await harness.manageService.recordReminderDeliveryEvidence(
    buildReminderEvidenceInput(
      harness,
      planned.reminderPlan.networkReminderPlanId,
      planned.reminderSchedule!.networkReminderScheduleId,
      {
        observedAt: atMinute(122),
        evidenceState: "failed",
        transportAckState: "rejected",
        deliveryRiskState: "likely_failed",
        sourceRefs: ["tests/integration/339_commit_mesh_no_slot.helpers.ts"],
      },
    ),
  );
  const currentState = await harness.manageService.queryCurrentReminderManageVisibilityState(
    hubCoordinationCaseId,
  );
  return {
    harness,
    refreshed,
    planned,
    failed,
    currentState,
  };
}

export async function createCallbackFallbackFlow(seed: string) {
  const harness = await setupHubFallbackHarness(seed);
  const opened = await openFallbackOfferSession(harness);
  const created = await harness.fallbackService.resolveNoSlotFallback(
    buildResolveNoSlotInput(harness, {
      callbackRequested: true,
      trustedAlternativeFrontierExists: true,
      offerLeadMinutes: 40,
      callbackLeadMinutes: 8,
      alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
    }),
  );
  const linked = await harness.fallbackService.linkCallbackFallback(
    buildLinkCallbackInput(created.fallbackRecord!.hubFallbackRecordId, seed),
  );
  return {
    harness,
    opened,
    created,
    linked,
  };
}

export async function createReturnFallbackFlow(seed: string) {
  const harness = await setupHubFallbackHarness(seed);
  const opened = await openFallbackOfferSession(harness);
  const created = await harness.fallbackService.resolveNoSlotFallback(
    buildResolveNoSlotInput(harness, {
      trustedAlternativeFrontierExists: true,
      callbackRequested: true,
      offerLeadMinutes: 50,
      callbackLeadMinutes: 40,
      alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
      bestTrustedFit: 0.33,
      trustGap: 0.71,
      pBreach: 0.82,
    }),
  );
  const linked = await harness.fallbackService.linkReturnToPractice(
    buildLinkReturnInput(created.fallbackRecord!.hubFallbackRecordId, seed),
  );
  return {
    harness,
    opened,
    created,
    linked,
  };
}
