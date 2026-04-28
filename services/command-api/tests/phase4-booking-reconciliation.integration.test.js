import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_BOOKING_RECONCILIATION_QUERY_SURFACES,
  PHASE4_BOOKING_RECONCILIATION_SERVICE_NAME,
  createPhase4BookingReconciliationApplication,
  phase4BookingReconciliationMigrationPlanRefs,
  phase4BookingReconciliationPersistenceTables,
  phase4BookingReconciliationRoutes,
} from "../src/phase4-booking-reconciliation.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";
import { createPhase4CapacityRankApplication } from "../src/phase4-capacity-rank-offers.ts";
import { createPhase4BookingReservationApplication } from "../src/phase4-booking-reservations.ts";
import { createPhase4BookingCommitApplication } from "../src/phase4-booking-commit.ts";

function buildDirectResolutionBundle(seed = "292") {
  return {
    settlement: null,
    callbackSeed: null,
    clinicianMessageSeed: null,
    selfCareStarter: null,
    adminResolutionStarter: null,
    bookingIntent: {
      intentId: `booking_intent_${seed}`,
      episodeRef: `episode_${seed}`,
      requestId: `request_${seed}`,
      requestLineageRef: `request_lineage_${seed}`,
      sourceTriageTaskRef: `task_${seed}`,
      lineageCaseLinkRef: `lineage_case_link_${seed}`,
      priorityBand: "soon",
      timeframe: "within_14_days",
      modality: "in_person",
      clinicianType: "general_practice",
      continuityPreference: "preferred_clinician_if_available",
      accessNeeds: "step_free_access",
      patientPreferenceSummary: "Prefers mornings at the preferred site.",
      createdFromDecisionId: `decision_${seed}`,
      decisionEpochRef: `decision_epoch_${seed}`,
      decisionSupersessionRecordRef: null,
      lifecycleLeaseRef: `request_lease_${seed}`,
      leaseAuthorityRef: "lease_authority_booking_intent",
      leaseTtlSeconds: 600,
      ownershipEpoch: 4,
      fencingToken: `fencing_token_${seed}`,
      currentLineageFenceEpoch: 7,
      intentState: "seeded",
      commandActionRecordRef: `handoff_action_${seed}`,
      commandSettlementRecordRef: `handoff_settlement_${seed}`,
      createdAt: "2026-04-18T09:00:00.000Z",
      updatedAt: "2026-04-18T09:00:00.000Z",
      version: 1,
    },
    pharmacyIntent: null,
    presentationArtifact: null,
    patientStatusProjection: null,
    outboxEntries: [],
  };
}

function buildSearchPolicy(seed = "292", audience = "patient") {
  const isPatient = audience === "patient";
  return {
    policyId: `search_policy_${seed}`,
    timeframeEarliest: "2026-04-20T08:00:00.000Z",
    timeframeLatest: "2026-04-21T18:00:00.000Z",
    modality: "in_person",
    clinicianType: "general_practice",
    continuityPreference: "preferred_clinician_if_available",
    sitePreference: ["site_a", "site_b"],
    accessibilityNeeds: ["step_free_access"],
    maxTravelTime: 45,
    bookabilityPolicy: isPatient ? "patient_visible_slots_only" : "include_staff_assistable",
    selectionAudience: isPatient ? "patient_self_service" : "staff_assist",
    patientChannelMode: isPatient ? "signed_in_shell" : "staff_proxy",
    policyBundleHash: `policy_bundle_hash_${seed}`,
    sameBandReorderSlackMinutesByWindow: { early: 10, standard: 20 },
  };
}

function buildSearchWindows(seed = "292", supplierRef = "vecells_local_gateway") {
  return [
    {
      supplierRef,
      supplierWindowRef: `supplier_window_a_${seed}`,
      searchWindowStartAt: "2026-04-20T08:00:00.000Z",
      searchWindowEndAt: "2026-04-20T18:00:00.000Z",
      fetchStartedAt: "2026-04-18T12:00:00.000Z",
      fetchCompletedAt: "2026-04-18T12:00:05.000Z",
      rawRows: [
        {
          supplierSlotRef: `slot_a_0900_${seed}`,
          capacityUnitRef: `cap_u1_${seed}`,
          scheduleRef: `schedule_a_${seed}`,
          scheduleOwnerRef: `schedule_owner_a_${seed}`,
          locationRef: `location_a_${seed}`,
          locationName: "Preferred Site",
          practitionerRef: `practitioner_a_${seed}`,
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T09:00:00.000Z",
          endAt: "2026-04-20T09:15:00.000Z",
          siteId: "site_a",
          siteName: "Preferred Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.95,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_a_${seed}`,
          sourceVersionRef: `supplier_version_a_${seed}`,
        },
      ],
    },
  ];
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function enableExclusiveHold(capabilityRepositories) {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows
    .map((row) => row.toSnapshot())
    .find(
      (row) =>
        row.supplierRef === "vecells_local_gateway" &&
        row.integrationMode === "local_gateway_component" &&
        row.deploymentType === "practice_local_gateway",
    );
  if (!target) {
    throw new Error("TARGET_CAPABILITY_ROW_NOT_FOUND");
  }
  await capabilityRepositories.saveProviderCapabilityMatrixRow({
    ...target,
    reservationMode: "exclusive_hold",
    rowHash: `${target.rowHash}_exclusive_hold`,
  });
}

async function setupReconciliationFlow(options = {}) {
  const seed = options.seed ?? "292";
  const supplierRef = options.supplierRef ?? "vecells_local_gateway";
  const integrationMode = options.integrationMode ?? "local_gateway_component";
  const deploymentType = options.deploymentType ?? "practice_local_gateway";
  const audience = options.audience ?? "staff";
  const selectionAudience = audience === "patient" ? "patient" : "staff";
  const requiresGpLinkage = selectionAudience === "patient" && integrationMode === "im1_patient_api";
  const bookingCaseApplication = createPhase4BookingCaseApplication({
    directResolutionApplication: {
      async queryTaskDirectResolution() {
        return structuredClone(buildDirectResolutionBundle(seed));
      },
    },
  });
  const capabilityRepositories = createPhase4BookingCapabilityEngineStore();
  if (options.forceExclusiveHold) {
    await enableExclusiveHold(capabilityRepositories);
  }
  const bookingCapabilityApplication = createPhase4BookingCapabilityApplication({
    bookingCaseApplication,
    repositories: capabilityRepositories,
  });
  const slotSearchApplication = createPhase4SlotSearchApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
  });
  const capacityRankApplication = createPhase4CapacityRankApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
  });
  const bookingReservationApplication = createPhase4BookingReservationApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
  });
  const bookingCommitApplication = createPhase4BookingCommitApplication({
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
  });
  const reconciliationApplication = createPhase4BookingReconciliationApplication({
    bookingCaseApplication,
    bookingReservationApplication,
    bookingCommitApplication,
  });

  await bookingCaseApplication.createBookingCaseFromTaskHandoff({
    taskId: `task_${seed}`,
    bookingCaseId: `booking_case_${seed}`,
    patientRef: `patient_${seed}`,
    tenantId: "tenant_vecells_beta",
    providerContext: {
      practiceRef: "ods_A83002",
      supplierHintRef: supplierRef,
      careSetting: "general_practice",
    },
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `create_case_action_${seed}`,
    commandSettlementRecordRef: `create_case_settlement_${seed}`,
    createdAt: "2026-04-18T09:30:00.000Z",
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
  });

  const capability = await bookingCapabilityApplication.resolveBookingCaseCapability({
    bookingCaseId: `booking_case_${seed}`,
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef,
      integrationMode,
      deploymentType,
      selectionAudience,
      requestedActionScope: "search_slots",
      gpLinkageCheckpointRef: requiresGpLinkage ? `gp_linkage_checkpoint_${seed}` : null,
      gpLinkageStatus: requiresGpLinkage ? "linked" : "not_required",
      localConsumerCheckpointRef:
        supplierRef === "vecells_local_gateway" ? `local_component_checkpoint_${seed}` : null,
      localConsumerStatus: supplierRef === "vecells_local_gateway" ? "ready" : "not_required",
    supplierDegradationStatus: "nominal",
    publicationState: "published",
    assuranceTrustState: "writable",
    routeIntentBindingRef: `route_intent_booking_${seed}`,
    surfaceRouteContractRef: `surface_route_booking_${seed}`,
    surfacePublicationRef: `surface_publication_booking_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_booking_${seed}`,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: `booking_case_${seed}`,
    governingObjectVersionRef: `booking_case_${seed}_v1`,
    parentAnchorRef: `booking_anchor_${seed}`,
    commandActionRecordRef: `resolve_capability_case_${seed}`,
    commandSettlementRecordRef: `resolve_capability_case_settlement_${seed}`,
    subjectRef: `${selectionAudience}_actor_${seed}`,
    evaluatedAt: "2026-04-18T12:00:00.000Z",
  });

  await bookingCaseApplication.markCapabilityChecked({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `mark_capability_checked_${seed}`,
    commandSettlementRecordRef: `mark_capability_checked_settlement_${seed}`,
    recordedAt: "2026-04-18T12:01:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "capability_checked",
    activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
    activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
    activeProviderAdapterBindingRef:
      capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    capabilityState: capability.resolution.capabilityState,
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
  });

  await bookingCaseApplication.beginLocalSearch({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `begin_local_search_${seed}`,
    commandSettlementRecordRef: `begin_local_search_settlement_${seed}`,
    recordedAt: "2026-04-18T12:02:00.000Z",
    sourceDecisionEpochRef: `decision_epoch_${seed}`,
    sourceDecisionSupersessionRef: null,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    requestLifecycleLeaseRef: `request_lease_${seed}`,
    ownershipEpoch: 4,
    fencingToken: `fencing_token_${seed}`,
    currentLineageFenceEpoch: 7,
    reasonCode: "begin_local_search",
    activeCapabilityResolutionRef: capability.resolution.bookingCapabilityResolutionId,
    activeCapabilityProjectionRef: capability.projection.bookingCapabilityProjectionId,
    activeProviderAdapterBindingRef:
      capability.providerAdapterBinding.bookingProviderAdapterBindingId,
    capabilityState: capability.resolution.capabilityState,
    surfaceRouteContractRef: "booking_route_contract_v1",
    surfacePublicationRef: `surface_publication_${seed}`,
    runtimePublicationBundleRef: `runtime_publication_${seed}`,
    searchPolicy: buildSearchPolicy(seed, audience),
  });

  const slotSearch = await slotSearchApplication.startSlotSearch({
    bookingCaseId: `booking_case_${seed}`,
    displayTimeZone: "Europe/London",
    supplierWindows: buildSearchWindows(seed, supplierRef),
    commandActionRecordRef: `slot_search_action_${seed}`,
    commandSettlementRecordRef: `slot_search_settlement_${seed}`,
    subjectRef: `${selectionAudience}_actor_${seed}`,
    occurredAt: "2026-04-18T12:10:00.000Z",
    payloadArtifactRef: `artifact://booking/search/${seed}`,
    edgeCorrelationId: `edge_correlation_${seed}`,
    expiresInSeconds: 900,
  });

  const created = await capacityRankApplication.createOfferSessionFromCurrentSnapshot({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    subjectRef: `${selectionAudience}_actor_${seed}`,
    commandActionRecordRef: `offer_session_action_${seed}`,
    commandSettlementRecordRef: `offer_session_settlement_${seed}`,
    occurredAt: "2026-04-18T12:20:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}`,
    edgeCorrelationId: `offer_edge_${seed}`,
  });

  const selectedCandidate = created.offerCandidates[0];
  const selectionProofHash = createHash("sha256")
    .update(
      canonicalize({
        offerSessionId: created.offerSession.offerSessionId,
        slotSetSnapshotRef: created.offerSession.slotSetSnapshotRef,
        capacityRankProofRef: created.capacityRankProof.capacityRankProofId,
        selectionToken: created.offerSession.selectionToken,
        truthMode: created.offerSession.truthMode,
        reservationTruthProjectionRef: created.offerSession.reservationTruthProjectionRef,
        providerAdapterBindingHash: created.offerSession.providerAdapterBindingHash,
        capabilityTupleHash: created.offerSession.capabilityTupleHash,
        selectedCandidateHash: selectedCandidate.candidateHash,
        selectedCanonicalSlotIdentityRef: selectedCandidate.canonicalSlotIdentityRef,
      }),
    )
    .digest("hex");

  const selected = await capacityRankApplication.selectOfferCandidate({
    offerSessionId: created.offerSession.offerSessionId,
    offerCandidateId: selectedCandidate.offerCandidateId,
    selectionToken: created.offerSession.selectionToken,
    selectionProofHash,
    actorRef: `actor_${seed}`,
    subjectRef: `${selectionAudience}_actor_${seed}`,
    commandActionRecordRef: `select_offer_candidate_${seed}`,
    commandSettlementRecordRef: `select_offer_candidate_settlement_${seed}`,
    occurredAt: "2026-04-18T12:21:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}/selection`,
    edgeCorrelationId: `offer_selection_edge_${seed}`,
  });

  return {
    seed,
    audience,
    selectionAudience,
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    reconciliationApplication,
    slotSearch,
    offerSession: selected.offerSession,
    selectedCandidate,
  };
}

describe("phase4 booking reconciliation application", () => {
  it("publishes the 292 metadata surface and route catalog entries", () => {
    expect(PHASE4_BOOKING_RECONCILIATION_SERVICE_NAME).toBe(
      "Phase4BookingReconciliationAndConfirmationWorkerApplication",
    );
    expect(PHASE4_BOOKING_RECONCILIATION_QUERY_SURFACES).toEqual([
      "GET /v1/bookings/cases/{bookingCaseId}/reconciliation/current",
    ]);
    expect(phase4BookingReconciliationPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_booking_reconciliation_records",
        "phase4_booking_reconciliation_attempts",
        "external_confirmation_gates",
        "adapter_receipt_checkpoints",
      ]),
    );
    expect(phase4BookingReconciliationMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/141_phase4_booking_reconciliation_worker.sql",
    );
    for (const route of phase4BookingReconciliationRoutes) {
      expect(serviceDefinition.routeCatalog).toEqual(expect.arrayContaining([route]));
    }
  });

  it("keeps provider-reference callbacks pending until authoritative read confirms and replays the same read without creating a second appointment", async () => {
    const flow = await setupReconciliationFlow({
      seed: "292_read_after_write",
      supplierRef: "optum_emis_web",
      integrationMode: "im1_patient_api",
      deploymentType: "internet_patient_shell",
      audience: "patient",
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
        blockerReasonCode: "awaiting_supplier_commit",
        recoveryMode: "awaiting_external_confirmation",
        externalConfirmationGateRef: null,
        providerReference: `provider_reference_${flow.seed}`,
      },
      expectedSelectionProofHash: flow.offerSession.selectionProofHash,
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
      observedAt: "2026-04-18T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "confirmed", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: { state: "confirmed", providerReference: `provider_reference_${flow.seed}` },
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
      attemptedAt: "2026-04-18T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-18T12:27:00.000Z",
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

    const replayed = await flow.reconciliationApplication.forceReconcileAttempt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `patient_actor_${flow.seed}`,
      commandActionRecordRef: `force_reconcile_action_${flow.seed}_replay`,
      commandSettlementRecordRef: `force_reconcile_settlement_${flow.seed}_replay`,
      attemptedAt: "2026-04-18T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-18T12:27:00.000Z",
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
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/read/replay`,
      edgeCorrelationId: `edge_reconciliation_read_${flow.seed}_replay`,
    });

    expect(replayed.bookingCommit.appointmentRecord?.appointmentRecordId).toBe(
      confirmed.bookingCommit.appointmentRecord?.appointmentRecordId,
    );
    expect(replayed.reconciliation.attempts.length).toBe(2);
  });

  it("collapses duplicate and stale callbacks onto one pending transaction chain for gate-required suppliers", async () => {
    const flow = await setupReconciliationFlow({
      seed: "292_callbacks",
      supplierRef: "vecells_local_gateway",
      integrationMode: "local_gateway_component",
      deploymentType: "practice_local_gateway",
      audience: "staff",
      forceExclusiveHold: true,
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
        blockerReasonCode: "awaiting_supplier_commit",
        recoveryMode: "awaiting_external_confirmation",
        externalConfirmationGateRef: null,
        providerReference: `provider_reference_${flow.seed}`,
      },
      expectedSelectionProofHash: flow.offerSession.selectionProofHash,
      expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
      expectedOwnershipEpochRef: 4,
      expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
      expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
      expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
      reviewActionLeaseRef: `review_action_lease_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}`,
      edgeCorrelationId: `edge_commit_${flow.seed}`,
    });

    const first = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}`,
      observedAt: "2026-04-18T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "accepted",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt/first`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_first`,
    });

    const duplicate = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}_duplicate`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}_duplicate`,
      observedAt: "2026-04-18T12:26:10.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: "0002",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "accepted",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt/duplicate`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_duplicate`,
    });

    const stale = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `assimilate_receipt_action_${flow.seed}_stale`,
      commandSettlementRecordRef: `assimilate_receipt_settlement_${flow.seed}_stale`,
      observedAt: "2026-04-18T12:26:20.000Z",
      transportMessageId: `transport_message_${flow.seed}_stale`,
      orderingKey: "0001",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "accepted",
        providerReference: `provider_reference_${flow.seed}`,
      },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      signatureVerification: "verified",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/receipt/stale`,
      edgeCorrelationId: `edge_reconciliation_receipt_${flow.seed}_stale`,
    });

    expect(first.bookingCommit.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(duplicate.bookingCommit.appointmentRecord).toBeNull();
    expect(stale.bookingCommit.appointmentRecord).toBeNull();
    expect(stale.bookingCommit.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(stale.reconciliation.record.currentAttemptOrdinal).toBeGreaterThanOrEqual(1);
  });

  it("opens manual attention on secure-callback failure and resolves governed manual disputes after a conflicting read", async () => {
    const flow = await setupReconciliationFlow({
      seed: "292_manual",
      supplierRef: "vecells_local_gateway",
      integrationMode: "local_gateway_component",
      deploymentType: "practice_local_gateway",
      audience: "staff",
      forceExclusiveHold: true,
    });

    const created = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "confirmation_pending",
        blockerReasonCode: "awaiting_supplier_commit",
        recoveryMode: "awaiting_external_confirmation",
        externalConfirmationGateRef: null,
        providerReference: `provider_reference_${flow.seed}`,
      },
      expectedSelectionProofHash: flow.offerSession.selectionProofHash,
      expectedRequestLifecycleLeaseRef: `request_lease_${flow.seed}`,
      expectedOwnershipEpochRef: 4,
      expectedSourceDecisionEpochRef: `decision_epoch_${flow.seed}`,
      expectedRuntimePublicationBundleRef: `runtime_publication_${flow.seed}`,
      expectedSurfacePublicationRef: `surface_publication_${flow.seed}`,
      reviewActionLeaseRef: `review_action_lease_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}`,
      edgeCorrelationId: `edge_commit_${flow.seed}`,
    });

    const failedSecurity = await flow.reconciliationApplication.assimilateBookingReceipt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `secure_receipt_action_${flow.seed}`,
      commandSettlementRecordRef: `secure_receipt_settlement_${flow.seed}`,
      observedAt: "2026-04-18T12:26:00.000Z",
      transportMessageId: `transport_message_${flow.seed}_secure`,
      orderingKey: "0002",
      rawReceipt: { state: "accepted", providerReference: `provider_reference_${flow.seed}` },
      callbackState: "accepted_for_processing",
      providerReference: `provider_reference_${flow.seed}`,
      signatureVerification: "failed",
      schemaVerified: true,
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/secure`,
      edgeCorrelationId: `edge_reconciliation_secure_${flow.seed}`,
    });

    expect(failedSecurity.manualQueueEntry?.exceptionFamily).toBe("ambiguous_commit");
    expect(failedSecurity.reconciliation.record.manualAttentionRequired).toBe(true);
    expect(failedSecurity.bookingCommit.transaction.authoritativeOutcomeState).toBe(
      "confirmation_pending",
    );

    const conflicting = await flow.reconciliationApplication.forceReconcileAttempt({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `force_reconcile_action_${flow.seed}`,
      commandSettlementRecordRef: `force_reconcile_settlement_${flow.seed}`,
      attemptedAt: "2026-04-18T12:27:00.000Z",
      authoritativeReadResult: {
        observedAt: "2026-04-18T12:27:00.000Z",
        outcome: "conflict",
        providerReference: `provider_reference_${flow.seed}`,
        sourceFamily: "authoritative_read",
        reasonCode: "provider_reference_slot_conflict",
        hardMatchRefs: {
          selected_slot: "failed",
          patient_identity: "matched",
          appointment_window: "matched",
        },
        competingGateConfidences: [0.79],
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/conflict`,
      edgeCorrelationId: `edge_reconciliation_conflict_${flow.seed}`,
    });

    expect(conflicting.bookingCommit.transaction.authoritativeOutcomeState).toBe(
      "reconciliation_required",
    );
    expect(conflicting.externalConfirmationGate?.state).toBe("disputed");

    const resolved = await flow.reconciliationApplication.resolveManualDispute({
      bookingTransactionId: created.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `resolve_manual_dispute_action_${flow.seed}`,
      commandSettlementRecordRef: `resolve_manual_dispute_settlement_${flow.seed}`,
      resolvedAt: "2026-04-18T12:29:00.000Z",
      auditReasonCode: "operator_confirmed_after_manual_check",
      resolution: {
        kind: "confirmed",
        authoritativeProofClass: "reconciled_confirmation",
        providerReference: `provider_reference_${flow.seed}`,
      },
      payloadArtifactRef: `artifact://booking/reconciliation/${flow.seed}/manual_resolution`,
      edgeCorrelationId: `edge_reconciliation_manual_resolution_${flow.seed}`,
    });

    expect(resolved.bookingCommit.transaction.authoritativeOutcomeState).toBe("booked");
    expect(resolved.bookingCommit.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(resolved.manualQueueEntry).toBeNull();
    expect(resolved.reconciliation.record.manualAttentionRequired).toBe(false);
  });
});
