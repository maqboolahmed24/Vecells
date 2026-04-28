import { createHash } from "node:crypto";
import path from "node:path";

import { createPhase4BookingCapabilityEngineStore } from "../../packages/domains/booking/src/phase4-booking-capability-engine.ts";
import type { ProviderSearchWindowInput } from "../../packages/domains/booking/src/phase4-slot-search-snapshot-pipeline.ts";

import { resetProviderSandboxes } from "../../scripts/providers/304_provider_sandbox_lib.ts";
import {
  buildProviderCapabilityEvidenceRegistry,
  captureProviderCapabilityEvidence,
  validateProviderCapabilityEvidence,
} from "../../scripts/providers/305_provider_capability_evidence_lib.ts";
import { createPhase4BookingCapabilityApplication } from "../../services/command-api/src/phase4-booking-capability.ts";
import { createPhase4BookingCaseApplication } from "../../services/command-api/src/phase4-booking-case.ts";
import { createPhase4BookingCommitApplication } from "../../services/command-api/src/phase4-booking-commit.ts";
import { createPhase4BookingReconciliationApplication } from "../../services/command-api/src/phase4-booking-reconciliation.ts";
import { createPhase4BookingReservationApplication } from "../../services/command-api/src/phase4-booking-reservations.ts";
import { createPhase4CapacityRankApplication } from "../../services/command-api/src/phase4-capacity-rank-offers.ts";
import { createPhase4SlotSearchApplication } from "../../services/command-api/src/phase4-slot-search.ts";

export type BookingCoreAudience = "patient" | "staff";

export interface BookingCoreFlowOptions {
  seed: string;
  supplierRef?: string;
  integrationMode?: string;
  deploymentType?: string;
  audience?: BookingCoreAudience;
  forceExclusiveHold?: boolean;
  searchWindows?: readonly ProviderSearchWindowInput[];
  skipOfferSelection?: boolean;
}

export interface ProviderEvidenceCaptureOptions {
  outputDir?: string;
  sandboxOutputDir?: string;
}

export interface ProviderEvidenceCaptureResult {
  registry: Awaited<ReturnType<typeof buildProviderCapabilityEvidenceRegistry>>;
  validation: Awaited<ReturnType<typeof validateProviderCapabilityEvidence>>;
  capture: Awaited<ReturnType<typeof captureProviderCapabilityEvidence>>;
  outputDir: string;
  sandboxOutputDir: string;
}

function requiresGpLinkage(integrationMode: string, audience: BookingCoreAudience): boolean {
  return audience === "patient" && integrationMode === "im1_patient_api";
}

function usesLocalConsumerCheckpoint(supplierRef: string): boolean {
  return supplierRef === "vecells_local_gateway";
}

export function canonicalize(value: unknown): string {
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

export function buildDirectResolutionBundle(seed: string) {
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
      createdAt: "2026-04-22T09:00:00.000Z",
      updatedAt: "2026-04-22T09:00:00.000Z",
      version: 1,
    },
    pharmacyIntent: null,
    presentationArtifact: null,
    patientStatusProjection: null,
    outboxEntries: [],
  };
}

export function buildSearchPolicy(seed: string, audience: BookingCoreAudience = "staff") {
  const patientAudience = audience === "patient";
  return {
    policyId: `search_policy_${seed}`,
    timeframeEarliest: "2026-04-24T08:00:00.000Z",
    timeframeLatest: "2026-04-25T18:00:00.000Z",
    modality: "in_person",
    clinicianType: "general_practice",
    continuityPreference: "preferred_clinician_if_available",
    sitePreference: ["site_a", "site_b"],
    accessibilityNeeds: ["step_free_access"],
    maxTravelTime: 45,
    bookabilityPolicy: patientAudience
      ? "patient_visible_slots_only"
      : "include_staff_assistable",
    selectionAudience: patientAudience ? "patient_self_service" : "staff_assist",
    patientChannelMode: patientAudience ? "signed_in_shell" : "staff_proxy",
    policyBundleHash: `policy_bundle_hash_${seed}`,
    sameBandReorderSlackMinutesByWindow: { early: 10, standard: 20 },
  };
}

export function buildSearchWindows(
  seed: string,
  options?: {
    supplierRef?: string;
    coverageStateHint?: "complete" | "partial_coverage" | "failed";
    empty?: boolean;
    includeSecondWindow?: boolean;
  },
): readonly ProviderSearchWindowInput[] {
  const supplierRef = options?.supplierRef ?? "vecells_local_gateway";
  const coverageStateHint = options?.coverageStateHint ?? "complete";
  const includeSecondWindow = options?.includeSecondWindow ?? true;
  const empty = options?.empty ?? false;
  const firstRows = empty
    ? []
    : [
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
          startAt: "2026-04-24T09:00:00.000Z",
          endAt: "2026-04-24T09:15:00.000Z",
          siteId: "site_a",
          siteName: "Preferred Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.95,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_a_${seed}`,
          sourceVersionRef: `supplier_version_a_${seed}`,
        },
      ];
  const secondRows = empty
    ? []
    : [
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
          startAt: "2026-04-24T10:30:00.000Z",
          endAt: "2026-04-24T10:45:00.000Z",
          siteId: "site_b",
          siteName: "Fallback Site",
          accessibilityTags: ["step_free_access"],
          continuityScore: 0.4,
          restrictions: [],
          bookabilityMode: "dual",
          inventoryLineageRef: `inventory_lineage_b_${seed}`,
          sourceVersionRef: `supplier_version_b_${seed}`,
        },
      ];

  const windows: ProviderSearchWindowInput[] = [
    {
      supplierRef,
      supplierWindowRef: `supplier_window_a_${seed}`,
      searchWindowStartAt: "2026-04-24T08:00:00.000Z",
      searchWindowEndAt: "2026-04-24T12:00:00.000Z",
      fetchStartedAt: "2026-04-22T12:00:00.000Z",
      fetchCompletedAt: "2026-04-22T12:00:05.000Z",
      coverageStateHint,
      rawRows: firstRows,
    },
  ];

  if (includeSecondWindow) {
    windows.push({
      supplierRef,
      supplierWindowRef: `supplier_window_b_${seed}`,
      searchWindowStartAt: "2026-04-24T12:00:00.000Z",
      searchWindowEndAt: "2026-04-24T18:00:00.000Z",
      fetchStartedAt: "2026-04-22T12:00:06.000Z",
      fetchCompletedAt: "2026-04-22T12:00:10.000Z",
      coverageStateHint,
      rawRows: secondRows,
    });
  }

  return windows;
}

export async function prepareProviderEvidence(
  options?: ProviderEvidenceCaptureOptions,
): Promise<ProviderEvidenceCaptureResult> {
  const outputDir =
    options?.outputDir ??
    path.resolve(process.cwd(), ".artifacts", "provider-evidence", "307-integration");
  const sandboxOutputDir =
    options?.sandboxOutputDir ??
    path.resolve(process.cwd(), ".artifacts", "provider-sandboxes", "307-integration");

  await resetProviderSandboxes({ outputDir: sandboxOutputDir });
  const capture = await captureProviderCapabilityEvidence({
    outputDir,
    sandboxOutputDir,
  });
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const validation = await validateProviderCapabilityEvidence({ outputDir });

  return {
    registry,
    validation,
    capture,
    outputDir,
    sandboxOutputDir,
  };
}

async function overrideReservationMode(
  capabilityRepositories: ReturnType<typeof createPhase4BookingCapabilityEngineStore>,
  input: {
    supplierRef: string;
    integrationMode: string;
    deploymentType: string;
    reservationMode: "exclusive_hold" | "truthful_nonexclusive";
  },
): Promise<void> {
  const rows = await capabilityRepositories.listProviderCapabilityMatrixRows();
  const target = rows
    .map((row) => row.toSnapshot())
    .find(
      (row) =>
        row.supplierRef === input.supplierRef &&
        row.integrationMode === input.integrationMode &&
        row.deploymentType === input.deploymentType,
    );
  if (!target) {
    throw new Error(
      `TARGET_CAPABILITY_ROW_NOT_FOUND:${input.supplierRef}:${input.integrationMode}:${input.deploymentType}`,
    );
  }
  await capabilityRepositories.saveProviderCapabilityMatrixRow({
    ...target,
    reservationMode: input.reservationMode,
    rowHash: `${target.rowHash}_${input.reservationMode}`,
  });
}

export function buildSelectionProofHash(input: {
  offerSessionId: string;
  slotSetSnapshotRef: string;
  capacityRankProofRef: string;
  selectionToken: string;
  truthMode: string;
  reservationTruthProjectionRef: string;
  providerAdapterBindingHash: string;
  capabilityTupleHash: string;
  selectedCandidateHash: string;
  selectedCanonicalSlotIdentityRef: string;
}): string {
  return createHash("sha256")
    .update(canonicalize(input))
    .digest("hex");
}

export async function setupBookingCoreFlow(options: BookingCoreFlowOptions) {
  const seed = options.seed;
  const supplierRef = options.supplierRef ?? "vecells_local_gateway";
  const integrationMode = options.integrationMode ?? "local_gateway_component";
  const deploymentType = options.deploymentType ?? "practice_local_gateway";
  const audience = options.audience ?? "staff";
  const selectionAudience = audience === "patient" ? "patient" : "staff";

  const bookingCaseApplication = createPhase4BookingCaseApplication({
    directResolutionApplication: {
      async queryTaskDirectResolution() {
        return structuredClone(buildDirectResolutionBundle(seed));
      },
    },
  });
  const capabilityRepositories = createPhase4BookingCapabilityEngineStore();
  if (options.forceExclusiveHold) {
    await overrideReservationMode(capabilityRepositories, {
      supplierRef,
      integrationMode,
      deploymentType,
      reservationMode: "exclusive_hold",
    });
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
    createdAt: "2026-04-22T09:30:00.000Z",
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
    gpLinkageCheckpointRef: requiresGpLinkage(integrationMode, audience)
      ? `gp_linkage_checkpoint_${seed}`
      : null,
    gpLinkageStatus: requiresGpLinkage(integrationMode, audience) ? "linked" : "not_required",
    localConsumerCheckpointRef: usesLocalConsumerCheckpoint(supplierRef)
      ? `local_component_checkpoint_${seed}`
      : null,
    localConsumerStatus: usesLocalConsumerCheckpoint(supplierRef) ? "ready" : "not_required",
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
    evaluatedAt: "2026-04-22T12:00:00.000Z",
  });

  await bookingCaseApplication.markCapabilityChecked({
    bookingCaseId: `booking_case_${seed}`,
    actorRef: `actor_${seed}`,
    routeIntentBindingRef: `route_intent_${seed}`,
    commandActionRecordRef: `mark_capability_checked_${seed}`,
    commandSettlementRecordRef: `mark_capability_checked_settlement_${seed}`,
    recordedAt: "2026-04-22T12:01:00.000Z",
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
    recordedAt: "2026-04-22T12:02:00.000Z",
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
    supplierWindows: options.searchWindows ?? buildSearchWindows(seed, { supplierRef }),
    commandActionRecordRef: `slot_search_action_${seed}`,
    commandSettlementRecordRef: `slot_search_settlement_${seed}`,
    subjectRef: `${selectionAudience}_actor_${seed}`,
    occurredAt: "2026-04-22T12:10:00.000Z",
    payloadArtifactRef: `artifact://booking/search/${seed}`,
    edgeCorrelationId: `edge_correlation_${seed}`,
    expiresInSeconds: 900,
  });

  let createdOfferSession: Awaited<
    ReturnType<typeof capacityRankApplication.createOfferSessionFromCurrentSnapshot>
  > | null = null;
  let offerSession: (typeof createdOfferSession extends null ? never : NonNullable<
    Awaited<ReturnType<typeof capacityRankApplication.selectOfferCandidate>>
  >["offerSession"]) | null = null;
  let selectedCandidate:
    | NonNullable<Awaited<ReturnType<typeof capacityRankApplication.createOfferSessionFromCurrentSnapshot>>>["offerCandidates"][number]
    | null = null;
  let selectionProofHash: string | null = null;

  if (!options.skipOfferSelection && slotSearch.slotSetSnapshot.candidateCount > 0) {
    createdOfferSession = await capacityRankApplication.createOfferSessionFromCurrentSnapshot({
      bookingCaseId: `booking_case_${seed}`,
      actorRef: `actor_${seed}`,
      subjectRef: `${selectionAudience}_actor_${seed}`,
      commandActionRecordRef: `offer_session_action_${seed}`,
      commandSettlementRecordRef: `offer_session_settlement_${seed}`,
      occurredAt: "2026-04-22T12:20:00.000Z",
      payloadArtifactRef: `artifact://booking/offers/${seed}`,
      edgeCorrelationId: `offer_edge_${seed}`,
    });
    selectedCandidate = createdOfferSession.offerCandidates[0] ?? null;
    if (selectedCandidate) {
      selectionProofHash = buildSelectionProofHash({
        offerSessionId: createdOfferSession.offerSession.offerSessionId,
        slotSetSnapshotRef: createdOfferSession.offerSession.slotSetSnapshotRef,
        capacityRankProofRef: createdOfferSession.capacityRankProof.capacityRankProofId,
        selectionToken: createdOfferSession.offerSession.selectionToken,
        truthMode: createdOfferSession.offerSession.truthMode,
        reservationTruthProjectionRef:
          createdOfferSession.offerSession.reservationTruthProjectionRef,
        providerAdapterBindingHash: createdOfferSession.offerSession.providerAdapterBindingHash,
        capabilityTupleHash: createdOfferSession.offerSession.capabilityTupleHash,
        selectedCandidateHash: selectedCandidate.candidateHash,
        selectedCanonicalSlotIdentityRef: selectedCandidate.canonicalSlotIdentityRef,
      });
      const selected = await capacityRankApplication.selectOfferCandidate({
        offerSessionId: createdOfferSession.offerSession.offerSessionId,
        offerCandidateId: selectedCandidate.offerCandidateId,
        selectionToken: createdOfferSession.offerSession.selectionToken,
        selectionProofHash,
        actorRef: `actor_${seed}`,
        subjectRef: `${selectionAudience}_actor_${seed}`,
        commandActionRecordRef: `select_offer_candidate_${seed}`,
        commandSettlementRecordRef: `select_offer_candidate_settlement_${seed}`,
        occurredAt: "2026-04-22T12:21:00.000Z",
        payloadArtifactRef: `artifact://booking/offers/${seed}/selection`,
        edgeCorrelationId: `offer_selection_edge_${seed}`,
      });
      offerSession = selected.offerSession;
    }
  }

  return {
    seed,
    audience,
    selectionAudience,
    supplierRef,
    integrationMode,
    deploymentType,
    bookingCaseApplication,
    bookingCapabilityApplication,
    slotSearchApplication,
    capacityRankApplication,
    bookingReservationApplication,
    bookingCommitApplication,
    reconciliationApplication,
    capability,
    slotSearch,
    createdOfferSession,
    offerSession,
    selectedCandidate,
    selectionProofHash,
  };
}
