import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPhase4BookingCapabilityEngineStore } from "@vecells/domain-booking";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE4_BOOKING_COMMIT_QUERY_SURFACES,
  PHASE4_BOOKING_COMMIT_SCHEMA_VERSION,
  PHASE4_BOOKING_COMMIT_SERVICE_NAME,
  createPhase4BookingCommitApplication,
  phase4BookingCommitMigrationPlanRefs,
  phase4BookingCommitPersistenceTables,
  phase4BookingCommitRoutes,
} from "../src/phase4-booking-commit.ts";
import { createPhase4BookingCaseApplication } from "../src/phase4-booking-case.ts";
import { createPhase4BookingCapabilityApplication } from "../src/phase4-booking-capability.ts";
import { createPhase4SlotSearchApplication } from "../src/phase4-slot-search.ts";
import { createPhase4CapacityRankApplication } from "../src/phase4-capacity-rank-offers.ts";
import { createPhase4BookingReservationApplication } from "../src/phase4-booking-reservations.ts";

function buildDirectResolutionBundle(seed = "287") {
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

function buildSearchPolicy(seed = "287") {
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
    bookabilityPolicy: "patient_visible_slots_only",
    selectionAudience: "staff_assist",
    patientChannelMode: "staff_proxy",
    policyBundleHash: `policy_bundle_hash_${seed}`,
    sameBandReorderSlackMinutesByWindow: { early: 10, standard: 20 },
  };
}

function buildSearchWindows(seed = "287") {
  return [
    {
      supplierRef: "vecells_local_gateway",
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
        {
          supplierSlotRef: `slot_b_1030_${seed}`,
          capacityUnitRef: `cap_u2_${seed}`,
          scheduleRef: `schedule_b_${seed}`,
          scheduleOwnerRef: `schedule_owner_b_${seed}`,
          locationRef: `location_b_${seed}`,
          locationName: "Fallback Site",
          practitionerRef: `practitioner_b_${seed}`,
          serviceRef: "service_gp",
          clinicianType: "general_practice",
          modality: "in_person",
          startAt: "2026-04-20T10:30:00.000Z",
          endAt: "2026-04-20T10:45:00.000Z",
          siteId: "site_b",
          siteName: "Fallback Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.4,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_b_${seed}`,
          sourceVersionRef: `supplier_version_b_${seed}`,
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

async function setupCommitFlow(options = {}) {
  const seed = options.seed ?? "287";
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

  await bookingCaseApplication.createBookingCaseFromTaskHandoff({
    taskId: `task_${seed}`,
    bookingCaseId: `booking_case_${seed}`,
    patientRef: `patient_${seed}`,
    tenantId: "tenant_vecells_beta",
    providerContext: {
      practiceRef: "ods_A83002",
      supplierHintRef: "vecells_local_gateway",
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
    supplierRef: "vecells_local_gateway",
    integrationMode: "local_gateway_component",
    deploymentType: "practice_local_gateway",
    selectionAudience: "staff",
    requestedActionScope: "search_slots",
    gpLinkageCheckpointRef: null,
    gpLinkageStatus: "not_required",
    localConsumerCheckpointRef: `local_component_checkpoint_${seed}`,
    localConsumerStatus: "ready",
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
    subjectRef: `staff_actor_${seed}`,
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
    searchPolicy: buildSearchPolicy(seed),
  });

  const slotSearch = await slotSearchApplication.startSlotSearch({
    bookingCaseId: `booking_case_${seed}`,
    displayTimeZone: "Europe/London",
    supplierWindows: buildSearchWindows(seed),
    commandActionRecordRef: `slot_search_action_${seed}`,
    commandSettlementRecordRef: `slot_search_settlement_${seed}`,
    subjectRef: `staff_actor_${seed}`,
    occurredAt: "2026-04-18T12:10:00.000Z",
    payloadArtifactRef: `artifact://booking/search/${seed}`,
    edgeCorrelationId: `edge_correlation_${seed}`,
    expiresInSeconds: 900,
  });

  const created = await capacityRankApplication.createOfferSessionFromCurrentSnapshot({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    subjectRef: `staff_actor_${seed}`,
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
    subjectRef: `staff_actor_${seed}`,
    commandActionRecordRef: `select_offer_candidate_${seed}`,
    commandSettlementRecordRef: `select_offer_candidate_settlement_${seed}`,
    occurredAt: "2026-04-18T12:21:00.000Z",
    payloadArtifactRef: `artifact://booking/offers/${seed}/selection`,
    edgeCorrelationId: `offer_selection_edge_${seed}`,
  });

  return {
    seed,
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    slotSearch,
    offerSession: selected.offerSession,
    selectedCandidate,
  };
}

describe("phase4 booking commit application", () => {
  it("confirms a selected offer on authoritative success and advances the booking case", async () => {
    const flow = await setupCommitFlow({ seed: "287_success", forceExclusiveHold: true });

    const result = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:25:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${flow.seed}`,
        settlementRef: `settlement_${flow.seed}`,
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

    expect(result.transaction.authoritativeOutcomeState).toBe("booked");
    expect(result.confirmationTruthProjection.confirmationTruthState).toBe("confirmed");
    expect(result.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(result.reservationTruth?.projection.truthState).toBe("confirmed");
    expect(result.bookingCase.bookingCase.status).toBe("booked");
    expect(result.dispatchAttemptRef).not.toBeNull();

    const current = await flow.bookingCommitApplication.queryCurrentBookingCommit({
      bookingCaseId: `booking_case_${flow.seed}`,
      requestedAt: "2026-04-18T12:26:00.000Z",
    });
    expect(current?.transaction.bookingTransactionId).toBe(result.transaction.bookingTransactionId);
    expect(current?.appointmentRecord?.appointmentRecordId).toBe(
      result.appointmentRecord?.appointmentRecordId,
    );
  });

  it("moves async acceptance to confirmation_pending and collapses duplicate callbacks onto one transaction chain", async () => {
    const flow = await setupCommitFlow({ seed: "287_pending", forceExclusiveHold: true });

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

    expect(created.transaction.authoritativeOutcomeState).toBe("confirmation_pending");
    expect(created.confirmationTruthProjection.confirmationTruthState).toBe(
      "confirmation_pending",
    );
    expect(created.appointmentRecord).toBeNull();
    expect(created.bookingCase.bookingCase.status).toBe("confirmation_pending");
    expect(created.reservationTruth?.projection.truthState).toBe("pending_confirmation");

    const observed = await flow.bookingCommitApplication.recordAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      observationKind: "durable_provider_reference",
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `record_observation_action_${flow.seed}`,
      commandSettlementRecordRef: `record_observation_settlement_${flow.seed}`,
      observedAt: "2026-04-18T12:25:30.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: `ordering_key_${flow.seed}`,
      rawReceipt: { state: "confirmed", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/receipt`,
      edgeCorrelationId: `edge_receipt_${flow.seed}`,
    });

    expect(observed.transaction.authoritativeOutcomeState).toBe("booked");
    expect(observed.confirmationTruthProjection.confirmationTruthState).toBe("confirmed");
    expect(observed.appointmentRecord?.appointmentStatus).toBe("booked");
    expect(observed.bookingCase.bookingCase.status).toBe("managed");
    expect(observed.replayDecisionClass).toBe("accepted_new");

    const replayed = await flow.bookingCommitApplication.recordAuthoritativeObservation({
      bookingTransactionId: created.transaction.bookingTransactionId,
      observationKind: "durable_provider_reference",
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `record_observation_action_${flow.seed}_replay`,
      commandSettlementRecordRef: `record_observation_settlement_${flow.seed}_replay`,
      observedAt: "2026-04-18T12:25:45.000Z",
      transportMessageId: `transport_message_${flow.seed}`,
      orderingKey: `ordering_key_${flow.seed}`,
      rawReceipt: { state: "confirmed", providerReference: `provider_reference_${flow.seed}` },
      semanticReceipt: {
        state: "confirmed",
        providerReference: `provider_reference_${flow.seed}`,
      },
      authoritativeProofClass: "durable_provider_reference",
      providerReference: `provider_reference_${flow.seed}`,
      providerCorrelationRef: `provider_correlation_${flow.seed}`,
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/receipt/replay`,
      edgeCorrelationId: `edge_receipt_${flow.seed}_replay`,
    });

    expect(replayed.replayed).toBe(true);
    expect(["exact_replay", "semantic_replay"]).toContain(replayed.replayDecisionClass);
    expect(replayed.transaction.bookingTransactionId).toBe(created.transaction.bookingTransactionId);
    expect(replayed.journal).toHaveLength(observed.journal.length);
  });

  it("fails closed when preflight revalidation is stale and can later supersede the failed transaction", async () => {
    const flow = await setupCommitFlow({ seed: "287_stale" });

    const failed = await flow.bookingCommitApplication.beginCommitFromSelectedOffer({
      bookingCaseId: `booking_case_${flow.seed}`,
      offerSessionId: flow.offerSession.offerSessionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `begin_commit_action_${flow.seed}`,
      commandSettlementRecordRef: `begin_commit_settlement_${flow.seed}`,
      occurredAt: "2026-04-18T12:40:00.000Z",
      idempotencyKey: `idempotency_key_${flow.seed}`,
      dispatchOutcome: {
        kind: "authoritative_success",
        authoritativeProofClass: "durable_provider_reference",
        providerReference: `provider_reference_${flow.seed}`,
        settlementRef: `settlement_${flow.seed}`,
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

    expect(failed.transaction.commitState).toBe("preflight_failed");
    expect(failed.transaction.authoritativeOutcomeState).toBe("failed");
    expect(failed.bookingException?.exceptionClass).toBe("preflight_failure");
    expect(failed.bookingCase.bookingCase.status).toBe("booking_failed");

    const superseded = await flow.bookingCommitApplication.releaseOrSupersedeFailedTransaction({
      bookingTransactionId: failed.transaction.bookingTransactionId,
      actorRef: `actor_${flow.seed}`,
      subjectRef: `staff_actor_${flow.seed}`,
      commandActionRecordRef: `release_failed_action_${flow.seed}`,
      commandSettlementRecordRef: `release_failed_settlement_${flow.seed}`,
      releasedAt: "2026-04-18T12:42:00.000Z",
      reasonCodes: ["superseded_by_fresh_retry"],
      payloadArtifactRef: `artifact://booking/commit/${flow.seed}/supersede`,
      edgeCorrelationId: `edge_supersede_${flow.seed}`,
    });

    expect(superseded.transaction.authoritativeOutcomeState).toBe("superseded");
    expect(superseded.confirmationTruthProjection.confirmationTruthState).toBe("superseded");
    expect(superseded.bookingException?.exceptionState).toBe("superseded");
  });

  it("publishes the expected metadata surfaces and route catalog entries", () => {
    expect(PHASE4_BOOKING_COMMIT_SERVICE_NAME).toBe(
      "Phase4BookingCommitConfirmationApplication",
    );
    expect(PHASE4_BOOKING_COMMIT_SCHEMA_VERSION).toBe(
      "287.phase4.booking-commit-confirmation.v1",
    );
    expect(PHASE4_BOOKING_COMMIT_QUERY_SURFACES).toContain(
      "GET /v1/bookings/cases/{bookingCaseId}/commit/current",
    );
    expect(phase4BookingCommitPersistenceTables).toEqual(
      expect.arrayContaining([
        "phase4_booking_transactions",
        "phase4_booking_confirmation_truth_projections",
        "phase4_appointment_records",
        "phase4_booking_exceptions",
        "phase4_booking_transaction_journal",
      ]),
    );
    expect(phase4BookingCommitMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/136_phase4_booking_commit_pipeline.sql",
    );
    expect(phase4BookingCommitRoutes.map((route) => route.routeId)).toEqual(
      expect.arrayContaining([
        "booking_case_commit_current",
        "booking_case_begin_commit",
        "booking_transaction_record_authoritative_observation",
        "booking_transaction_reconcile_ambiguous",
        "booking_transaction_release_or_supersede_failed",
      ]),
    );

    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));
    expect(routeIds.has("booking_case_commit_current")).toBe(true);
    expect(routeIds.has("booking_case_begin_commit")).toBe(true);
    expect(routeIds.has("booking_transaction_record_authoritative_observation")).toBe(true);
    expect(routeIds.has("booking_transaction_reconcile_ambiguous")).toBe(true);
    expect(routeIds.has("booking_transaction_release_or_supersede_failed")).toBe(true);
  });
});
