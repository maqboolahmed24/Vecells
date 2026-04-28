import {
  createPhase5ActingScopeVisibilityService,
  type HubCommandAuthorityInput,
  type Phase5HubMutationCommandId,
  type Phase5HubRouteFamily,
} from "../../packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts";
import {
  createPhase5HubCommitEngineService,
  createPhase5HubCommitEngineStore,
  providerAdapterBindingHashFromSnapshot,
  type BeginHubCommitAttemptResult,
  type BeginHubCommitAttemptInput,
  type CaptureManualHubBookingEvidenceInput,
  type IngestImportedHubConfirmationInput,
  type SubmitNativeHubCommitInput,
} from "../../packages/domains/hub_coordination/src/phase5-hub-commit-engine.ts";
import type {
  HubCapacityAdapterBindingSnapshot,
  NetworkSlotCandidateSnapshot,
} from "../../packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts";
import {
  buildBootstrapStaffCommand,
  buildHubAuthorityCommand,
  atMinute as authorityMinute,
} from "./316_hub_scope_visibility.helpers.ts";
import {
  atMinute,
  buildDefaultBindings,
} from "./318_network_capacity.helpers.ts";
import {
  buildMutationFence,
  buildReservationBinding,
  openAndDeliverAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "./320_alternative_offer.helpers.ts";

export { atMinute };

export async function setupHubCommitHarness(seed = "321") {
  const offerHarness = await setupAlternativeOfferHarness(seed);
  const visibilityService = createPhase5ActingScopeVisibilityService({
    hubCaseService: offerHarness.service,
  });
  const bootstrap = await visibilityService.bootstrapActingContextFromAuthenticatedStaff(
    buildBootstrapStaffCommand(seed),
  );
  const visibilityEnvelope =
    await visibilityService.materializeCurrentCrossOrganisationVisibilityEnvelope({
      actingContextId: bootstrap.actingContext.actingContextId,
      sourceOrganisationRef: offerHarness.request.networkBookingRequest.originPracticeOds,
      targetOrganisationRef: bootstrap.actingContext.activeOrganisationRef,
      requiredCoverageRowRefs: [`coverage_row_${seed}`],
      generatedAt: authorityMinute(1),
    });

  const opened = await openAndDeliverAlternativeOfferSession(offerHarness);
  const accepted = await offerHarness.offerService.acceptAlternativeOfferEntry({
    alternativeOfferSessionId: opened.openResult.session.alternativeOfferSessionId,
    alternativeOfferEntryId: opened.openResult.entries[0]!.alternativeOfferEntryId,
    actorRef: `coordinator_${seed}`,
    routeIntentBindingRef: `route_${seed}_accept_direct_commit`,
    commandActionRecordRef: `action_${seed}_accept_direct_commit`,
    commandSettlementRecordRef: `settlement_${seed}_accept_direct_commit`,
    recordedAt: atMinute(12),
    reservationBinding: buildReservationBinding(
      opened.openResult.session,
      opened.openResult.entries[0]!.candidateRef,
    ),
    ...buildMutationFence(
      opened.openResult.session,
      opened.delivered.truthProjection.truthTupleHash,
    ),
  });

  const directCommitCandidateRef = offerHarness.snapshotResult.decisionPlan?.directCommitFrontierRefs[0];
  if (!directCommitCandidateRef) {
    throw new Error("Expected a direct-commit frontier candidate for the hub commit harness.");
  }
  const selectedCandidate = (
    await offerHarness.repositories.getCandidate(directCommitCandidateRef)
  )!.toSnapshot();
  const providerAdapterBinding = resolveProviderAdapterBinding(seed, selectedCandidate);

  const commitRepositories = createPhase5HubCommitEngineStore();
  const commitService = createPhase5HubCommitEngineService({
    repositories: commitRepositories,
    hubCaseService: offerHarness.service,
    offerRepositories: offerHarness.offerRepositories,
    capacityRepositories: offerHarness.repositories,
    policyService: offerHarness.policyService,
    actingScopeService: visibilityService,
  });

  return {
    ...offerHarness,
    visibilityService,
    bootstrap,
    visibilityEnvelope,
    opened,
    accepted,
    selectedCandidate,
    providerAdapterBinding,
    commitRepositories,
    commitService,
  };
}

export function resolveProviderAdapterBinding(
  seed: string,
  candidate: NetworkSlotCandidateSnapshot,
): HubCapacityAdapterBindingSnapshot {
  const binding = buildDefaultBindings(seed).find((entry) =>
    entry.capacityRows.some((row) => row.capacityUnitRef === candidate.capacityUnitRef),
  );
  if (!binding) {
    throw new Error(`No provider adapter binding found for ${candidate.capacityUnitRef}.`);
  }
  return binding;
}

export async function currentHubCase(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
) {
  return (
    await harness.service.queryHubCaseBundle(harness.accepted.hubTransition.hubCase.hubCoordinationCaseId)
  )!.hubCase;
}

export async function buildCommitAuthority(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
  commandId: Phase5HubMutationCommandId,
  minuteOffset: number,
  routeId: Phase5HubRouteFamily = "hub_case_detail",
  overrides: Partial<HubCommandAuthorityInput> = {},
): Promise<HubCommandAuthorityInput> {
  const hubCase = await currentHubCase(harness);
  return buildHubAuthorityCommand(
    {
      seed: harness.request.networkBookingRequest.networkBookingRequestId.replace("network_request_", ""),
      staffIdentityContextId: harness.bootstrap.staffIdentityContext.staffIdentityContextId,
      actingContextId: harness.bootstrap.actingContext.actingContextId,
      scopeTupleHash: harness.bootstrap.actingContext.scopeTupleHash,
      minimumNecessaryContractRef: harness.bootstrap.actingContext.minimumNecessaryContractRef,
      visibilityEnvelopeId: harness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
      hubCoordinationCaseId: hubCase.hubCoordinationCaseId,
      expectedOwnershipEpoch: hubCase.ownershipEpoch,
      expectedOwnershipFenceToken: hubCase.ownershipFenceToken,
    },
    commandId,
    routeId,
    minuteOffset,
    overrides,
  );
}

export async function buildBeginCommitInput(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
  commitMode: BeginHubCommitAttemptInput["commitMode"] = "native_api",
  overrides: Partial<BeginHubCommitAttemptInput> = {},
): Promise<BeginHubCommitAttemptInput> {
  return {
    hubCoordinationCaseId: harness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
    commitMode,
    actorRef: `coordinator_${commitMode}_${harness.selectedCandidate.candidateId}`,
    routeIntentBindingRef: `route_${commitMode}_${harness.selectedCandidate.candidateId}`,
    commandActionRecordRef: `action_${commitMode}_${harness.selectedCandidate.candidateId}`,
    commandSettlementRecordRef: `settlement_${commitMode}_${harness.selectedCandidate.candidateId}`,
    recordedAt: atMinute(13),
    idempotencyKey: `commit_${commitMode}_${harness.selectedCandidate.candidateId}`,
    providerAdapterBinding: harness.providerAdapterBinding,
    presentedTruthTupleHash: harness.accepted.truthProjection.truthTupleHash,
    selectedCandidateRef: harness.selectedCandidate.candidateId,
    selectedOfferSessionRef: harness.accepted.session.alternativeOfferSessionId,
    sourceRefs: ["tests/integration/321_hub_commit.helpers.ts"],
    authority: await buildCommitAuthority(harness, "enter_candidate_revalidating", 13),
    ...overrides,
  };
}

export async function beginNativeCommit(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
  overrides: Partial<BeginHubCommitAttemptInput> = {},
) {
  return harness.commitService.beginCommitAttempt(
    await buildBeginCommitInput(harness, "native_api", overrides),
  );
}

export async function buildNativeSubmitInput(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
  begin: BeginHubCommitAttemptResult,
  overrides: Partial<SubmitNativeHubCommitInput> = {},
): Promise<SubmitNativeHubCommitInput> {
  return {
    commitAttemptId: begin.commitAttempt.commitAttemptId,
    actorRef: begin.actionRecord.createdByRef,
    routeIntentBindingRef: `route_native_submit_${begin.commitAttempt.commitAttemptId}`,
    commandActionRecordRef: `action_native_submit_${begin.commitAttempt.commitAttemptId}`,
    commandSettlementRecordRef: `settlement_native_submit_${begin.commitAttempt.commitAttemptId}`,
    recordedAt: atMinute(14),
    presentedTruthTupleHash: begin.commitAttempt.truthTupleHash,
    presentedProviderAdapterBindingHash: providerAdapterBindingHashFromSnapshot(
      harness.providerAdapterBinding,
    ),
    presentedReservationFenceToken: begin.commitAttempt.reservationFenceToken,
    sourceRefs: ["tests/integration/321_hub_commit.helpers.ts"],
    authority: await buildCommitAuthority(harness, "mark_confirmation_pending", 14),
    response: {
      responseClass: "accepted_pending",
      receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
      adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
      providerBookingReference: `booking_${begin.commitAttempt.commitAttemptId}`,
      supplierAppointmentRef: `supplier_appt_${begin.commitAttempt.commitAttemptId}`,
      sourceFamilies: ["adapter_receipt"],
    },
    ...overrides,
  };
}

export async function buildManualCaptureInput(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
  begin: BeginHubCommitAttemptResult,
  overrides: Partial<CaptureManualHubBookingEvidenceInput> = {},
): Promise<CaptureManualHubBookingEvidenceInput> {
  return {
    commitAttemptId: begin.commitAttempt.commitAttemptId,
    actorRef: `manual_actor_${begin.commitAttempt.commitAttemptId}`,
    routeIntentBindingRef: `route_manual_capture_${begin.commitAttempt.commitAttemptId}`,
    commandActionRecordRef: `action_manual_capture_${begin.commitAttempt.commitAttemptId}`,
    commandSettlementRecordRef: `settlement_manual_capture_${begin.commitAttempt.commitAttemptId}`,
    recordedAt: atMinute(15),
    presentedTruthTupleHash: begin.commitAttempt.truthTupleHash,
    presentedProviderAdapterBindingHash: providerAdapterBindingHashFromSnapshot(
      harness.providerAdapterBinding,
    ),
    presentedReservationFenceToken: begin.commitAttempt.reservationFenceToken,
    sourceRefs: ["tests/integration/321_hub_commit.helpers.ts"],
    authority: await buildCommitAuthority(harness, "mark_confirmation_pending", 15),
    evidence: {
      hubSiteRef: `hub_site_${begin.commitAttempt.commitAttemptId}`,
      dateAt: harness.selectedCandidate.startAt.slice(0, 10),
      timeAt: harness.selectedCandidate.startAt.slice(11, 16),
      modality: harness.selectedCandidate.modality,
      clinicianRef: null,
      clinicianType: harness.selectedCandidate.clinicianType,
      nativeBookingReference: `manual_booking_${begin.commitAttempt.commitAttemptId}`,
      operatorIdentityRef: `operator_${begin.commitAttempt.commitAttemptId}`,
      confirmationSource: "hub_desk_native_console",
      independentConfirmationMethod: "supplier_portal_export",
      confirmationDueAt: atMinute(70),
      evidenceSourceFamilies: ["manual_operator_entry"],
    },
    ...overrides,
  };
}

export async function buildImportedIngestInput(
  harness: Awaited<ReturnType<typeof setupHubCommitHarness>>,
  begin: BeginHubCommitAttemptResult,
  overrides: Partial<IngestImportedHubConfirmationInput> = {},
): Promise<IngestImportedHubConfirmationInput> {
  return {
    hubCoordinationCaseId: begin.commitAttempt.hubCoordinationCaseId,
    commitAttemptId: begin.commitAttempt.commitAttemptId,
    actorRef: `import_actor_${begin.commitAttempt.commitAttemptId}`,
    routeIntentBindingRef: `route_import_${begin.commitAttempt.commitAttemptId}`,
    commandActionRecordRef: `action_import_${begin.commitAttempt.commitAttemptId}`,
    commandSettlementRecordRef: `settlement_import_${begin.commitAttempt.commitAttemptId}`,
    recordedAt: atMinute(16),
    idempotencyKey: `import_${begin.commitAttempt.commitAttemptId}`,
    providerAdapterBinding: harness.providerAdapterBinding,
    presentedTruthTupleHash: begin.commitAttempt.truthTupleHash,
    selectedCandidateRef: begin.commitAttempt.selectedCandidateRef,
    selectedOfferSessionRef: begin.commitAttempt.selectedOfferSessionRef,
    sourceRefs: ["tests/integration/321_hub_commit.helpers.ts"],
    authority: await buildCommitAuthority(harness, "mark_confirmation_pending", 16),
    importedEvidence: {
      importedEvidenceRef: `imported_evidence_${begin.commitAttempt.commitAttemptId}`,
      sourceVersion: harness.providerAdapterBinding.sourceVersion,
      supplierBookingReference: `imported_booking_${begin.commitAttempt.commitAttemptId}`,
      supplierAppointmentRef: `imported_supplier_appt_${begin.commitAttempt.commitAttemptId}`,
      supplierCorrelationKey: `imported_corr_${begin.commitAttempt.commitAttemptId}`,
      matchedWindowMinutes: 15,
      evidenceSourceFamilies: ["imported_supplier_message", "supplier_webhook"],
    },
    ...overrides,
  };
}
