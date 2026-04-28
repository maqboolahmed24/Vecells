import {
  createPhase4CapacityRankService,
  createPhase4CapacityRankStore,
  type OfferSessionCompilationResult,
  type OfferSessionCompareResult,
  type OfferSessionPageResult,
  type OfferSessionReadResult,
  type Phase4CapacityRankRepositories,
  type Phase4CapacityRankService,
} from "@vecells/domain-booking";
import type { BookingCaseBundle, BookingSelectionAudience } from "@vecells/domain-booking";
import type { QueryBookingCapabilityDiagnosticsInput } from "./phase4-booking-capability";
import { createPhase4SlotSearchApplication, type Phase4SlotSearchApplication } from "./phase4-slot-search";
import type { Phase4BookingCapabilityApplication } from "./phase4-booking-capability";
import type { Phase4BookingCaseApplication } from "./phase4-booking-case";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

export const PHASE4_CAPACITY_RANK_SERVICE_NAME =
  "Phase4CapacityRankOfferSessionApplication";
export const PHASE4_CAPACITY_RANK_SCHEMA_VERSION =
  "285.phase4.slot-scoring-offer-orchestration.v1";
export const PHASE4_CAPACITY_RANK_QUERY_SURFACES = [
  "GET /v1/bookings/cases/{bookingCaseId}/offers/current",
  "GET /v1/bookings/offer-sessions/{offerSessionId}/pages/{pageNumber}",
  "GET /v1/bookings/offer-sessions/{offerSessionId}/compare",
] as const;

export const phase4CapacityRankRoutes = [
  {
    routeId: "booking_case_offer_session_current",
    method: "GET",
    path: "/v1/bookings/cases/{bookingCaseId}/offers/current",
    contractFamily: "OfferSessionContract",
    purpose:
      "Resolve the current authoritative OfferSession, CapacityRankProof, explanation rows, and branch posture for one booking case.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_offer_session_page",
    method: "GET",
    path: "/v1/bookings/offer-sessions/{offerSessionId}/pages/{pageNumber}",
    contractFamily: "OfferSessionPageContract",
    purpose:
      "Slice the persisted CapacityRankProof into one stable page without rescoring the current slot snapshot.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_offer_session_compare",
    method: "GET",
    path: "/v1/bookings/offer-sessions/{offerSessionId}/compare",
    contractFamily: "OfferSessionCompareContract",
    purpose:
      "Return a compare subset in the persisted proof order so browser compare mode cannot fork ranking or reason-cue truth.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "booking_case_offer_session_create",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:create-offer-session",
    contractFamily: "CreateOfferSessionCommandContract",
    purpose:
      "Compile one deterministic RankPlan, CapacityRankProof, explanation set, and OfferSession from the current lawful slot snapshot.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_case_offer_session_refresh",
    method: "POST",
    path: "/internal/v1/bookings/cases/{bookingCaseId}:refresh-offer-session",
    contractFamily: "RefreshOfferSessionCommandContract",
    purpose:
      "Supersede the current OfferSession from the latest lawful slot snapshot while keeping ranking replay append-only.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "booking_offer_session_select_candidate",
    method: "POST",
    path: "/internal/v1/bookings/offer-sessions/{offerSessionId}:select-candidate",
    contractFamily: "SelectOfferCandidateCommandContract",
    purpose:
      "Verify one selection token and selection-proof hash, then move the BookingCase into selecting without claiming hold or commit truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase4CapacityRankPersistenceTables = [
  "phase4_rank_plans",
  "phase4_capacity_rank_disclosure_policies",
  "phase4_capacity_rank_proofs",
  "phase4_capacity_rank_explanations",
  "phase4_offer_sessions",
  "phase4_offer_candidates",
] as const;

export const phase4CapacityRankMigrationPlanRefs = [
  "services/command-api/migrations/134_phase4_capacity_rank_and_offer_session.sql",
] as const;

interface CreateOfferSessionInput {
  bookingCaseId: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
  offerSessionTtlSeconds?: number;
}

type RefreshOfferSessionInput = CreateOfferSessionInput;

interface QueryCurrentOfferSessionInput {
  bookingCaseId: string;
}

interface FetchOfferSessionPageInput {
  offerSessionId: string;
  pageNumber: number;
  requestedAt: string;
}

interface FetchOfferSessionCompareInput {
  offerSessionId: string;
  candidateRefs: readonly string[];
  requestedAt: string;
}

interface SelectOfferCandidateInput {
  offerSessionId: string;
  offerCandidateId: string;
  selectionToken: string;
  selectionProofHash: string;
  actorRef: string;
  subjectRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  occurredAt: string;
  payloadArtifactRef?: string | null;
  edgeCorrelationId?: string | null;
}

export interface Phase4CapacityRankApplication {
  capacityRankService: Phase4CapacityRankService;
  capacityRankRepositories: Phase4CapacityRankRepositories;
  createOfferSessionFromCurrentSnapshot(
    input: CreateOfferSessionInput,
  ): Promise<OfferSessionCompilationResult>;
  refreshOfferSessionFromCurrentSnapshot(
    input: RefreshOfferSessionInput,
  ): Promise<OfferSessionCompilationResult>;
  queryCurrentOfferSession(
    input: QueryCurrentOfferSessionInput,
  ): Promise<OfferSessionReadResult | null>;
  fetchOfferSessionPage(input: FetchOfferSessionPageInput): Promise<OfferSessionPageResult>;
  fetchOfferSessionCompare(
    input: FetchOfferSessionCompareInput,
  ): Promise<OfferSessionCompareResult>;
  selectOfferCandidate(input: SelectOfferCandidateInput): Promise<OfferSessionCompilationResult>;
}

function resolveSelectionAudience(
  bundle: BookingCaseBundle,
): BookingSelectionAudience {
  invariant(
    bundle.searchPolicy !== null,
    "BOOKING_SEARCH_POLICY_NOT_FOUND",
    "SearchPolicy must exist before offer sessions can be compiled.",
  );
  return bundle.searchPolicy.selectionAudience === "patient_self_service" ? "patient" : "staff";
}

function buildCapabilityDiagnosticsQuery(
  bookingCase: BookingCaseBundle,
): QueryBookingCapabilityDiagnosticsInput {
  return {
    bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    governingObjectDescriptorRef: "BookingCase",
    governingObjectRef: bookingCase.bookingCase.bookingCaseId,
    selectionAudience: resolveSelectionAudience(bookingCase),
    requestedActionScope: "search_slots",
  };
}

function buildTransitionInput(
  bookingCase: BookingCaseBundle,
  command: {
    actorRef: string;
    commandActionRecordRef: string;
    commandSettlementRecordRef: string;
    occurredAt: string;
  },
  reasonCode: string,
  extras?: {
    routeIntentBindingRef?: string;
    currentOfferSessionRef?: string | null;
    selectedSlotRef?: string | null;
  },
) {
  return {
    bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    actorRef: command.actorRef,
    routeIntentBindingRef:
      extras?.routeIntentBindingRef ?? bookingCase.bookingCase.surfaceRouteContractRef,
    commandActionRecordRef: command.commandActionRecordRef,
    commandSettlementRecordRef: command.commandSettlementRecordRef,
    recordedAt: command.occurredAt,
    sourceDecisionEpochRef: bookingCase.bookingCase.sourceDecisionEpochRef,
    sourceDecisionSupersessionRef: bookingCase.bookingCase.sourceDecisionSupersessionRef,
    lineageCaseLinkRef: bookingCase.bookingCase.lineageCaseLinkRef,
    requestLifecycleLeaseRef: bookingCase.bookingCase.requestLifecycleLeaseRef,
    ownershipEpoch: bookingCase.bookingCase.ownershipEpoch,
    fencingToken: bookingCase.bookingIntent.fencingToken,
    currentLineageFenceEpoch: bookingCase.bookingIntent.currentLineageFenceEpoch,
    reasonCode,
    activeCapabilityResolutionRef: bookingCase.bookingCase.activeCapabilityResolutionRef,
    activeCapabilityProjectionRef: bookingCase.bookingCase.activeCapabilityProjectionRef,
    activeProviderAdapterBindingRef: bookingCase.bookingCase.activeProviderAdapterBindingRef,
    capabilityState: null,
    currentOfferSessionRef: extras?.currentOfferSessionRef ?? bookingCase.bookingCase.currentOfferSessionRef,
    selectedSlotRef: extras?.selectedSlotRef ?? bookingCase.bookingCase.selectedSlotRef,
    surfaceRouteContractRef: bookingCase.bookingCase.surfaceRouteContractRef,
    surfacePublicationRef: bookingCase.bookingCase.surfacePublicationRef,
    runtimePublicationBundleRef: bookingCase.bookingCase.runtimePublicationBundleRef,
  };
}

export function createPhase4CapacityRankApplication(input: {
  bookingCaseApplication: Phase4BookingCaseApplication;
  bookingCapabilityApplication: Phase4BookingCapabilityApplication;
  slotSearchApplication?: Phase4SlotSearchApplication;
  repositories?: ReturnType<typeof createPhase4CapacityRankStore>;
}): Phase4CapacityRankApplication {
  const capacityRankRepositories = input.repositories ?? createPhase4CapacityRankStore();
  const capacityRankService = createPhase4CapacityRankService({
    repositories: capacityRankRepositories,
  });
  const slotSearchApplication =
    input.slotSearchApplication ??
    createPhase4SlotSearchApplication({
      bookingCaseApplication: input.bookingCaseApplication,
      bookingCapabilityApplication: input.bookingCapabilityApplication,
    });

  async function requireBookingCase(bookingCaseId: string): Promise<BookingCaseBundle> {
    const bookingCase = await input.bookingCaseApplication.queryBookingCase(bookingCaseId);
    invariant(bookingCase !== null, "BOOKING_CASE_NOT_FOUND", `BookingCase ${bookingCaseId} was not found.`);
    return bookingCase;
  }

  async function requireCurrentSearchContext(bookingCase: BookingCaseBundle) {
    const currentSearch = await slotSearchApplication.queryCurrentSlotSearch({
      bookingCaseId: bookingCase.bookingCase.bookingCaseId,
    });
    invariant(
      currentSearch !== null,
      "CURRENT_SLOT_SNAPSHOT_NOT_FOUND",
      "A current lawful SlotSetSnapshot is required before offers can be compiled.",
    );
    const diagnostics = await input.bookingCapabilityApplication.queryCapabilityDiagnostics(
      buildCapabilityDiagnosticsQuery(bookingCase),
    );
    invariant(
      diagnostics?.isCurrentScope,
      "CURRENT_BOOKING_CAPABILITY_NOT_FOUND",
      "A current booking capability tuple is required before offers can be compiled.",
    );
    invariant(
      diagnostics.resolution.bookingCapabilityResolutionId ===
        currentSearch.slotSetSnapshot.capabilityResolutionRef,
      "CAPABILITY_SNAPSHOT_DRIFT",
      "Current slot snapshot capability tuple no longer matches the current capability resolution.",
    );
    invariant(
      diagnostics.providerAdapterBinding.bookingProviderAdapterBindingId ===
        currentSearch.slotSetSnapshot.providerAdapterBindingRef,
      "BINDING_SNAPSHOT_DRIFT",
      "Current slot snapshot binding no longer matches the current provider adapter binding.",
    );
    return { currentSearch, diagnostics };
  }

  async function buildCurrentTuple(offerSessionId: string, requestedAt: string) {
    const sessionDocument = await capacityRankRepositories.getOfferSession(offerSessionId);
    invariant(sessionDocument, "OFFER_SESSION_NOT_FOUND", `OfferSession ${offerSessionId} was not found.`);
    const session = sessionDocument.toSnapshot();
    const bookingCase = await requireBookingCase(session.bookingCaseId);
    const currentSearch = await slotSearchApplication.queryCurrentSlotSearch({
      bookingCaseId: session.bookingCaseId,
    });
    const diagnostics = await input.bookingCapabilityApplication.queryCapabilityDiagnostics(
      buildCapabilityDiagnosticsQuery(bookingCase),
    );
    return {
      bookingCaseId: session.bookingCaseId,
      caseVersionRef:
        diagnostics?.resolution.governingObjectVersionRef ?? `${session.bookingCaseId}::stale_case_version`,
      policyBundleHash:
        currentSearch?.slotSetSnapshot.policyBundleHash ?? `${session.bookingCaseId}::stale_policy_bundle`,
      providerAdapterBindingHash:
        diagnostics?.providerAdapterBinding.bindingHash ??
        `${session.bookingCaseId}::stale_provider_binding_hash`,
      capabilityTupleHash:
        diagnostics?.resolution.capabilityTupleHash ?? `${session.bookingCaseId}::stale_capability_tuple`,
      currentSlotSetSnapshotRef:
        currentSearch?.slotSetSnapshot.slotSetSnapshotId ??
        `${session.bookingCaseId}::stale_slot_snapshot`,
      now: requestedAt,
    };
  }

  async function compileFromCurrentSnapshot(
    command: CreateOfferSessionInput,
  ): Promise<OfferSessionCompilationResult> {
    const bookingCase = await requireBookingCase(command.bookingCaseId);
    const { currentSearch, diagnostics } = await requireCurrentSearchContext(bookingCase);
    const result = await capacityRankService.createOfferSession({
      bookingCaseId: command.bookingCaseId,
      searchPolicy: bookingCase.searchPolicy!,
      capabilityResolution: diagnostics.resolution,
      providerAdapterBinding: diagnostics.providerAdapterBinding,
      slotSetSnapshot: currentSearch.slotSetSnapshot,
      recoveryState: currentSearch.recoveryState,
      candidateIndex: currentSearch.candidateIndex,
      normalizedSlots: currentSearch.normalizedSlots,
      patientPreferenceSummary: bookingCase.bookingIntent.patientPreferenceSummary,
      commandActionRecordRef: command.commandActionRecordRef,
      commandSettlementRecordRef: command.commandSettlementRecordRef,
      routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
      subjectRef: command.subjectRef,
      occurredAt: command.occurredAt,
      payloadArtifactRef: command.payloadArtifactRef,
      edgeCorrelationId: command.edgeCorrelationId,
      offerSessionTtlSeconds: command.offerSessionTtlSeconds,
    });

    if (bookingCase.bookingCase.status === "searching_local") {
      await input.bookingCaseApplication.publishOffersReady(
        buildTransitionInput(
          bookingCase,
          command,
          result.offerSession.sessionState === "branch_only"
            ? "offer_session_branch_only_ready"
            : "offer_session_ranked_ready",
          {
            routeIntentBindingRef: diagnostics.resolution.routeTuple.routeIntentBindingRef,
            currentOfferSessionRef: result.offerSession.offerSessionId,
          },
        ),
      );
    }

    return result;
  }

  return {
    capacityRankService,
    capacityRankRepositories,
    createOfferSessionFromCurrentSnapshot(command) {
      return compileFromCurrentSnapshot(command);
    },
    refreshOfferSessionFromCurrentSnapshot(command) {
      return compileFromCurrentSnapshot(command);
    },
    async queryCurrentOfferSession(input) {
      const bookingCase = await requireBookingCase(input.bookingCaseId);
      return capacityRankService.queryCurrentOfferSession(
        input.bookingCaseId,
        resolveSelectionAudience(bookingCase),
      );
    },
    async fetchOfferSessionPage(input) {
      return capacityRankService.fetchOfferPage(
        input.offerSessionId,
        input.pageNumber,
        await buildCurrentTuple(input.offerSessionId, input.requestedAt),
      );
    },
    async fetchOfferSessionCompare(input) {
      return capacityRankService.fetchCompareCandidates(
        input.offerSessionId,
        input.candidateRefs,
        await buildCurrentTuple(input.offerSessionId, input.requestedAt),
      );
    },
    async selectOfferCandidate(command) {
      const currentTuple = await buildCurrentTuple(command.offerSessionId, command.occurredAt);
      const selected = await capacityRankService.selectOfferCandidate({
        offerSessionId: command.offerSessionId,
        offerCandidateId: command.offerCandidateId,
        selectionToken: command.selectionToken,
        selectionProofHash: command.selectionProofHash,
        currentTuple,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        routeIntentBindingRef:
          (await requireOfferRouteIntent(command.offerSessionId)) ?? "booking_offer_session_route",
        subjectRef: command.subjectRef,
        occurredAt: command.occurredAt,
        payloadArtifactRef: command.payloadArtifactRef,
        edgeCorrelationId: command.edgeCorrelationId,
      });
      const bookingCase = await requireBookingCase(selected.offerSession.bookingCaseId);
      if (bookingCase.bookingCase.status === "selecting") {
        await input.bookingCaseApplication.publishOffersReady(
          buildTransitionInput(
            bookingCase,
            command,
            "offer_session_selection_reset",
            {
              currentOfferSessionRef: selected.offerSession.offerSessionId,
            },
          ),
        );
      }
      await input.bookingCaseApplication.startSelection(
        buildTransitionInput(
          bookingCase,
          command,
          "offer_session_selection_verified",
          {
            currentOfferSessionRef: selected.offerSession.offerSessionId,
            selectedSlotRef: selected.offerSession.selectedNormalizedSlotRef,
          },
        ),
      );
      return selected;
    },
  };

  async function requireOfferRouteIntent(offerSessionId: string): Promise<string | null> {
    const sessionDocument = await capacityRankRepositories.getOfferSession(offerSessionId);
    invariant(sessionDocument, "OFFER_SESSION_NOT_FOUND", `OfferSession ${offerSessionId} was not found.`);
    const session = sessionDocument.toSnapshot();
    const bookingCase = await requireBookingCase(session.bookingCaseId);
    const diagnostics = await input.bookingCapabilityApplication.queryCapabilityDiagnostics(
      buildCapabilityDiagnosticsQuery(bookingCase),
    );
    return diagnostics?.resolution.routeTuple.routeIntentBindingRef ?? null;
  }
}
