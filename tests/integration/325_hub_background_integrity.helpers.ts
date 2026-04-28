import {
  atMinute,
  beginNativeCommit,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";
import {
  createPhase5PracticeContinuityService,
  createPhase5PracticeContinuityStore,
} from "../../packages/domains/hub_coordination/src/phase5-practice-continuity-engine.ts";
import {
  createPhase5HubFallbackEngineService,
  createPhase5HubFallbackStore,
} from "../../packages/domains/hub_coordination/src/phase5-hub-fallback-engine.ts";
import {
  createPhase5HubBackgroundIntegrityService,
  createPhase5HubBackgroundIntegrityStore,
  type CorrelateImportedConfirmationInput,
  type IngestHubSupplierMirrorObservationInput,
} from "../../packages/domains/hub_coordination/src/phase5-hub-background-integrity-engine.ts";
import {
  buildManageCapabilitiesInput,
  buildReminderPlanInput,
  currentHubCoordinationCaseId,
  settlePracticeAcknowledgement,
  setupReminderManageHarness,
} from "./324_hub_manage_reminders.helpers.ts";

export { atMinute };

export async function setupReconciliationIntegrityHarness(seed = "325_reconciliation") {
  const commitHarness = await setupHubCommitHarness(seed);
  const begin = await beginNativeCommit(commitHarness);
  const reconciliationResult = await commitHarness.commitService.submitNativeApiCommit(
    await buildNativeSubmitInput(commitHarness, begin, {
      response: {
        responseClass: "timeout_unknown",
        receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
        adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
        providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
        supplierAppointmentRef: `supplier_${begin.commitAttempt.commitAttemptId}`,
        sourceFamilies: ["adapter_receipt"],
        reconciliationDueAt: atMinute(60),
      },
    }),
  );
  const continuityRepositories = createPhase5PracticeContinuityStore();
  const continuityService = createPhase5PracticeContinuityService({
    repositories: continuityRepositories,
    hubCaseService: commitHarness.service,
    offerRepositories: commitHarness.offerRepositories,
    commitRepositories: commitHarness.commitRepositories,
    policyService: commitHarness.policyService,
    actingScopeService: commitHarness.visibilityService,
  });
  const fallbackRepositories = createPhase5HubFallbackStore();
  const fallbackService = createPhase5HubFallbackEngineService({
    repositories: fallbackRepositories,
    hubCaseService: commitHarness.service,
    offerRepositories: commitHarness.offerRepositories,
  });
  const repositories = createPhase5HubBackgroundIntegrityStore();
  const integrityService = createPhase5HubBackgroundIntegrityService({
    repositories,
    hubCaseService: commitHarness.service,
    offerRepositories: commitHarness.offerRepositories,
    commitRepositories: commitHarness.commitRepositories,
    commitService: commitHarness.commitService,
    practiceContinuityService: continuityService,
    fallbackRepositories,
    fallbackService,
  });

  return {
    ...commitHarness,
    begin,
    reconciliationResult,
    continuityRepositories,
    continuityService,
    fallbackRepositories,
    fallbackService,
    integrityRepositories: repositories,
    integrityService,
  };
}

export async function setupBookedIntegrityHarness(seed = "325_booked") {
  const reminderHarness = await setupReminderManageHarness(seed);
  const fallbackRepositories = createPhase5HubFallbackStore();
  const fallbackService = createPhase5HubFallbackEngineService({
    repositories: fallbackRepositories,
    hubCaseService: reminderHarness.service,
    offerRepositories: reminderHarness.offerRepositories,
  });
  const repositories = createPhase5HubBackgroundIntegrityStore();
  const integrityService = createPhase5HubBackgroundIntegrityService({
    repositories,
    hubCaseService: reminderHarness.service,
    offerRepositories: reminderHarness.offerRepositories,
    commitRepositories: reminderHarness.commitRepositories,
    commitService: reminderHarness.commitService,
    practiceContinuityService: reminderHarness.continuityService,
    reminderManageService: reminderHarness.manageService,
    fallbackRepositories,
    fallbackService,
  });

  return {
    ...reminderHarness,
    fallbackRepositories,
    fallbackService,
    integrityRepositories: repositories,
    integrityService,
  };
}

export async function prepareBookedManageHarness(
  harness: Awaited<ReturnType<typeof setupBookedIntegrityHarness>>,
) {
  const hubCoordinationCaseId = currentHubCoordinationCaseId(harness);
  await settlePracticeAcknowledgement(harness);
  await harness.manageService.createOrRefreshReminderPlan(
    buildReminderPlanInput(harness, {
      recordedAt: atMinute(20),
      scheduledFor: atMinute(120),
    }),
  );
  await harness.manageService.refreshPracticeVisibilityProjection({
    hubCoordinationCaseId,
    visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    recordedAt: atMinute(21),
    sourceRefs: ["tests/integration/325_hub_background_integrity.helpers.ts"],
  });
  const compiled = await harness.manageService.compileNetworkManageCapabilities(
    buildManageCapabilitiesInput(harness, {
      recordedAt: atMinute(22),
    }),
  );
  return {
    hubCoordinationCaseId,
    compiled,
  };
}

export async function buildImportedCorrelationInput(
  harness: Awaited<ReturnType<typeof setupReconciliationIntegrityHarness>>,
  overrides: Partial<CorrelateImportedConfirmationInput> = {},
): Promise<CorrelateImportedConfirmationInput> {
  const truthProjection = (
    await harness.offerRepositories.getTruthProjectionForCase(
      harness.reconciliationResult.commitAttempt.hubCoordinationCaseId,
    )
  )!.toSnapshot();
  return {
    hubCoordinationCaseId: harness.reconciliationResult.commitAttempt.hubCoordinationCaseId,
    actorRef: `worker_import_actor_${harness.begin.commitAttempt.commitAttemptId}`,
    routeIntentBindingRef: `worker_route_import_${harness.begin.commitAttempt.commitAttemptId}`,
    commandActionRecordRef: `worker_action_import_${harness.begin.commitAttempt.commitAttemptId}`,
    commandSettlementRecordRef: `worker_settlement_import_${harness.begin.commitAttempt.commitAttemptId}`,
    recordedAt: atMinute(30),
    idempotencyKey: `worker_import_${harness.begin.commitAttempt.commitAttemptId}`,
    providerAdapterBinding: harness.providerAdapterBinding,
    presentedTruthTupleHash: truthProjection.truthTupleHash,
    selectedCandidateRef: truthProjection.selectedCandidateRef ?? harness.begin.commitAttempt.selectedCandidateRef,
    selectedOfferSessionRef: truthProjection.offerSessionRef ?? harness.begin.commitAttempt.selectedOfferSessionRef ?? undefined,
    sourceRefs: ["tests/integration/325_hub_background_integrity.helpers.ts"],
    importedEvidence: {
      importedEvidenceRef: `worker_imported_evidence_${harness.begin.commitAttempt.commitAttemptId}`,
      sourceVersion: harness.providerAdapterBinding.sourceVersion,
      supplierBookingReference: `worker_booking_${harness.begin.commitAttempt.commitAttemptId}`,
      supplierAppointmentRef: `worker_supplier_appt_${harness.begin.commitAttempt.commitAttemptId}`,
      supplierCorrelationKey: `worker_supplier_corr_${harness.begin.commitAttempt.commitAttemptId}`,
      matchedWindowMinutes: 15,
      evidenceSourceFamilies: ["imported_supplier_message", "supplier_webhook"],
    },
    ...overrides,
  };
}

export function buildSupplierObservationInput(
  harness: Awaited<ReturnType<typeof setupBookedIntegrityHarness>>,
  overrides: Partial<IngestHubSupplierMirrorObservationInput> = {},
): IngestHubSupplierMirrorObservationInput {
  const appointment = harness.commitResult.appointment;
  if (!appointment) {
    throw new Error("Expected a booked HubAppointmentRecord for the supplier observation harness.");
  }
  return {
    hubAppointmentId: appointment.hubAppointmentId,
    payloadId: `supplier_payload_${appointment.hubAppointmentId}`,
    supplierSystem: "simulated_supplier",
    supplierVersion: "supplier_v2",
    observedAt: atMinute(30),
    recordedAt: atMinute(30),
    observedStatus: "cancelled",
    confidenceBand: "high",
    driftReasonRefs: ["supplier_cancelled_after_booking"],
    sourceRefs: ["tests/integration/325_hub_background_integrity.helpers.ts"],
    ...overrides,
  };
}
