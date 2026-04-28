export const PATIENT_NETWORK_ALTERNATIVE_CHOICE_TASK_ID =
  "par_328_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_network_alternatives_choice_and_callback_fallback_views";
export const PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE = "Patient_Network_Open_Choice";

export type NetworkChoiceScenarioId =
  | "offer_session_328_live"
  | "offer_session_328_contact_repair"
  | "offer_session_328_stale_link"
  | "offer_session_328_wrong_patient"
  | "offer_session_328_expired"
  | "offer_session_328_superseded"
  | "offer_session_328_regenerated"
  | "offer_session_328_embedded_drift"
  | "offer_session_328_publication_drift";
export type NetworkChoiceOriginKey = "home" | "requests" | "appointments" | "secure_link";
export type NetworkChoiceEntryMode = "authenticated" | "secure_link";
export type NetworkChoiceRecoveryReason =
  | "none"
  | "contact_route_repair"
  | "stale_link"
  | "wrong_patient"
  | "expired"
  | "superseded"
  | "embedded_drift"
  | "publication_drift";
export type AlternativeOfferRecommendationState = "recommended" | "neutral";
export type AlternativeOfferEntrySelectionState =
  | "available"
  | "selected"
  | "declined"
  | "expired"
  | "superseded"
  | "read_only_provenance";
export type AlternativeOfferOpenChoiceState =
  | "full_set_visible"
  | "callback_only"
  | "read_only_provenance";
export type AlternativeOfferPatientChoiceState =
  | "prepared"
  | "delivered"
  | "opened"
  | "selected"
  | "declined"
  | "callback_requested"
  | "expired"
  | "superseded"
  | "recovery_only";
export type AlternativeOfferCallbackState =
  | "hidden"
  | "available"
  | "selected"
  | "transferred"
  | "blocked";
export type AlternativeOfferOfferMode =
  | "patient_secure_link"
  | "staff_read_back"
  | "callback_recovery_only";
export type AlternativeOfferChannelReleaseFreezeState =
  | "monitoring"
  | "frozen"
  | "kill_switch_active"
  | "rollback_recommended"
  | "released";
export type HubOfferProjectionOfferState =
  | "not_used"
  | "prepared"
  | "delivered"
  | "patient_choice_pending"
  | "selected"
  | "declined"
  | "expired"
  | "superseded";
export type HubOfferProjectionActionabilityState =
  | "live_open_choice"
  | "read_only_provenance"
  | "fallback_only"
  | "blocked";
export type HubOfferProjectionFallbackLinkState =
  | "none"
  | "callback_pending_link"
  | "callback_linked"
  | "return_pending_link"
  | "return_linked";
export type HubOfferProjectionConfirmationTruthState =
  | "no_commit"
  | "candidate_revalidating"
  | "native_booking_pending"
  | "confirmation_pending"
  | "confirmed_pending_practice_ack"
  | "confirmed"
  | "disputed"
  | "expired"
  | "blocked_by_drift"
  | "superseded";
export type HubOfferProjectionPatientVisibilityState =
  | "choice_visible"
  | "provisional_receipt"
  | "confirmed_visible"
  | "fallback_visible"
  | "recovery_required";
export type HubOfferProjectionPracticeVisibilityState =
  | "not_started"
  | "continuity_pending"
  | "ack_pending"
  | "acknowledged"
  | "exception_granted"
  | "recovery_required";
export type HubOfferProjectionClosureState =
  | "blocked_by_offer"
  | "blocked_by_confirmation"
  | "blocked_by_practice_visibility"
  | "blocked_by_fallback_linkage"
  | "blocked_by_supplier_drift"
  | "closable";
export type AlternativeOfferFallbackEligibilityState =
  | "hidden"
  | "visible"
  | "selected"
  | "transferred"
  | "blocked"
  | "read_only_provenance";
export type AlternativeOfferRegenerationTriggerClass =
  | "expiry"
  | "candidate_snapshot_superseded"
  | "subject_binding_drift"
  | "publication_drift"
  | "embedded_drift"
  | "continuity_drift"
  | "callback_linkage_change";
export type AlternativeOfferRegenerationResultState =
  | "regenerated_in_shell"
  | "read_only_provenance"
  | "callback_only_recovery"
  | "escalated_back"
  | "blocked";

export interface NetworkChoiceSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface AlternativeOfferReasonChip {
  readonly label: string;
  readonly tone: "recommended" | "neutral" | "warn" | "blocked";
  readonly advisoryOnly: boolean;
}

export interface AlternativeOfferEntryProjection328 {
  readonly alternativeOfferEntryId: string;
  readonly candidateRef: string;
  readonly rankOrdinal: number;
  readonly siteId: string;
  readonly localDayBucket: string;
  readonly modality: string;
  readonly windowClass: number;
  readonly windowLabel: string;
  readonly recommendationState: AlternativeOfferRecommendationState;
  readonly selectionState: AlternativeOfferEntrySelectionState;
  readonly patientFacingLabel: string;
  readonly siteLabel: string;
  readonly localityLabel: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly modalityLabel: string;
  readonly travelLabel: string;
  readonly waitLabel: string;
  readonly accessibilityLabel: string;
  readonly guidanceLabel: string;
  readonly recommendationSummary: string;
  readonly reasonChips: readonly AlternativeOfferReasonChip[];
}

export type AlternativeOfferCardProjection328 = AlternativeOfferEntryProjection328;

export interface AlternativeOfferFallbackCardProjection328 {
  readonly alternativeOfferFallbackCardId: string;
  readonly eligibilityState: AlternativeOfferFallbackEligibilityState;
  readonly title: string;
  readonly body: string;
  readonly reasonCodeRefs: readonly string[];
  readonly actionLabel: string | null;
}

export interface AlternativeOfferExpiryStripProjection328 {
  readonly mode: "reply_by" | "expired" | "superseded" | "recovery";
  readonly tone: "primary" | "warn" | "blocked";
  readonly heading: string;
  readonly body: string;
}

export interface AlternativeOfferProvenanceStubProjection328 {
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly NetworkChoiceSummaryRow[];
  readonly actionLabel: string | null;
  readonly transitionScenarioId: NetworkChoiceScenarioId | null;
}

export interface OfferRouteRepairPanelProjection328 {
  readonly repairState: "required" | "applied";
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly NetworkChoiceSummaryRow[];
  readonly actionLabel: string;
  readonly transitionScenarioId: NetworkChoiceScenarioId;
}

export interface NetworkChoiceSupportStubProjection328 {
  readonly heading: string;
  readonly body: string;
  readonly returnLabel: string;
  readonly supportLabel: string;
}

export interface AlternativeOfferSessionRouteSnapshot328 {
  readonly alternativeOfferSessionId: string;
  readonly hubCoordinationCaseId: string;
  readonly candidateSnapshotRef: string;
  readonly offerEntryRefs: readonly string[];
  readonly fallbackCardRef: string | null;
  readonly offerSetHash: string;
  readonly visibleOfferSetHash: string;
  readonly openChoiceState: AlternativeOfferOpenChoiceState;
  readonly offerMode: AlternativeOfferOfferMode;
  readonly patientChoiceState: AlternativeOfferPatientChoiceState;
  readonly callbackOfferState: AlternativeOfferCallbackState;
  readonly subjectRef: string;
  readonly routeFamilyRef: string;
  readonly sessionEpochRef: string;
  readonly subjectBindingVersionRef: string;
  readonly manifestVersionRef: string | null;
  readonly releaseApprovalFreezeRef: string;
  readonly channelReleaseFreezeState: AlternativeOfferChannelReleaseFreezeState;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly experienceContinuityEvidenceRef: string;
  readonly truthProjectionRef: string;
  readonly truthTupleHash: string;
  readonly policyTupleHash: string;
  readonly visibilityEnvelopeVersionRef: string;
  readonly offerFenceEpoch: number;
  readonly sameShellContinuationRef: string;
  readonly patientChoiceDeadlineAt: string;
  readonly expiresAt: string;
  readonly selectedCandidateRef: string | null;
  readonly latestRegenerationSettlementRef: string | null;
  readonly supersededByOfferSessionRef: string | null;
  readonly monotoneRevision: number;
}

export interface HubOfferToConfirmationTruthProjectionRouteSnapshot328 {
  readonly hubOfferToConfirmationTruthProjectionId: string;
  readonly hubCoordinationCaseId: string;
  readonly candidateSnapshotRef: string | null;
  readonly selectedCandidateRef: string | null;
  readonly offerSessionRef: string | null;
  readonly fallbackCardRef: string | null;
  readonly offerSetHash: string | null;
  readonly offerState: HubOfferProjectionOfferState;
  readonly offerActionabilityState: HubOfferProjectionActionabilityState;
  readonly latestRegenerationSettlementRef: string | null;
  readonly fallbackRef: string | null;
  readonly fallbackLinkState: HubOfferProjectionFallbackLinkState;
  readonly confirmationTruthState: HubOfferProjectionConfirmationTruthState;
  readonly patientVisibilityState: HubOfferProjectionPatientVisibilityState;
  readonly practiceVisibilityState: HubOfferProjectionPracticeVisibilityState;
  readonly closureState: HubOfferProjectionClosureState;
  readonly experienceContinuityEvidenceRef: string | null;
  readonly policyTupleHash: string;
  readonly truthTupleHash: string;
  readonly blockingRefs: readonly string[];
  readonly monotoneRevision: number;
  readonly generatedAt: string;
}

export interface AlternativeOfferRegenerationSettlementRouteSnapshot328 {
  readonly alternativeOfferRegenerationSettlementId: string;
  readonly triggerClass: AlternativeOfferRegenerationTriggerClass;
  readonly resultState: AlternativeOfferRegenerationResultState;
  readonly previousOfferSessionRef: string;
  readonly nextOfferSessionRef: string | null;
  readonly preservedSelectedAnchorRef: string;
  readonly preservedSelectedAnchorTupleHashRef: string;
  readonly recordedAt: string;
}

export interface PatientNetworkAlternativeChoiceProjection {
  readonly projectionName: "PatientNetworkAlternativeChoiceProjection";
  readonly scenarioId: NetworkChoiceScenarioId;
  readonly taskId: typeof PATIENT_NETWORK_ALTERNATIVE_CHOICE_TASK_ID;
  readonly visualMode: typeof PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE;
  readonly routeFamilyRef: "rf_patient_network_alternative_choice";
  readonly entryMode: NetworkChoiceEntryMode;
  readonly recoveryReason: NetworkChoiceRecoveryReason;
  readonly sameShellContinuationRef: string;
  readonly session: AlternativeOfferSessionRouteSnapshot328;
  readonly truthProjection: HubOfferToConfirmationTruthProjectionRouteSnapshot328;
  readonly regeneration: AlternativeOfferRegenerationSettlementRouteSnapshot328 | null;
  readonly selectedOfferEntryId: string | null;
  readonly offerCards: readonly AlternativeOfferEntryProjection328[];
  readonly callbackFallbackCard: AlternativeOfferFallbackCardProjection328;
  readonly expiryStrip: AlternativeOfferExpiryStripProjection328;
  readonly provenanceStub: AlternativeOfferProvenanceStubProjection328 | null;
  readonly routeRepairPanel: OfferRouteRepairPanelProjection328 | null;
  readonly supportStub: NetworkChoiceSupportStubProjection328;
  readonly heroTitle: string;
  readonly heroBody: string;
  readonly heroRows: readonly NetworkChoiceSummaryRow[];
  readonly guidanceLabel: string;
  readonly secureLinkNote: string | null;
  readonly declineAllAllowed: boolean;
  readonly groupedOfferLabels: readonly string[];
  readonly serviceRows: readonly NetworkChoiceSummaryRow[];
  readonly preferenceRows: readonly NetworkChoiceSummaryRow[];
}

const liveOfferCards = [
  {
    alternativeOfferEntryId: "offer_entry_328_riverside_1830",
    candidateRef: "candidate_328_riverside_1830",
    rankOrdinal: 1,
    siteId: "site_riverside",
    localDayBucket: "2026-04-23_evening",
    modality: "face_to_face",
    windowClass: 1,
    windowLabel: "Closest fit right now",
    recommendationState: "recommended",
    selectionState: "available",
    patientFacingLabel: "Today at 6:30pm",
    siteLabel: "Riverside network clinic",
    localityLabel: "18 minute trip, lift access confirmed",
    dateLabel: "Today",
    timeLabel: "18:30",
    modalityLabel: "Face-to-face",
    travelLabel: "18 min travel",
    waitLabel: "Same evening",
    accessibilityLabel: "Lift access and quieter waiting area",
    guidanceLabel: "Recommended, but still advisory.",
    recommendationSummary: "Shortest travel from the current safe open-choice set.",
    reasonChips: [
      { label: "Recommended", tone: "recommended", advisoryOnly: true },
      { label: "Lower travel", tone: "neutral", advisoryOnly: true },
      { label: "Lift access", tone: "neutral", advisoryOnly: true },
    ],
  },
  {
    alternativeOfferEntryId: "offer_entry_328_wharf_1910",
    candidateRef: "candidate_328_wharf_1910",
    rankOrdinal: 2,
    siteId: "site_north_wharf",
    localDayBucket: "2026-04-23_evening",
    modality: "face_to_face",
    windowClass: 1,
    windowLabel: "Closest fit right now",
    recommendationState: "neutral",
    selectionState: "available",
    patientFacingLabel: "Today at 7:10pm",
    siteLabel: "North Wharf hub",
    localityLabel: "26 minute trip, later evening arrival",
    dateLabel: "Today",
    timeLabel: "19:10",
    modalityLabel: "Face-to-face",
    travelLabel: "26 min travel",
    waitLabel: "Later today",
    accessibilityLabel: "Ground-floor entrance",
    guidanceLabel: "Open choice option.",
    recommendationSummary: "Later evening timing if you need more time to travel.",
    reasonChips: [
      { label: "Later arrival", tone: "neutral", advisoryOnly: true },
      { label: "Ground floor", tone: "neutral", advisoryOnly: true },
    ],
  },
  {
    alternativeOfferEntryId: "offer_entry_328_remote_0740",
    candidateRef: "candidate_328_remote_0740",
    rankOrdinal: 3,
    siteId: "site_remote",
    localDayBucket: "2026-04-24_morning",
    modality: "video",
    windowClass: 2,
    windowLabel: "Later but still safe",
    recommendationState: "neutral",
    selectionState: "available",
    patientFacingLabel: "Tomorrow at 7:40am",
    siteLabel: "Network video clinic",
    localityLabel: "No travel, camera and quiet space needed",
    dateLabel: "Tomorrow",
    timeLabel: "07:40",
    modalityLabel: "Video",
    travelLabel: "No travel",
    waitLabel: "Next morning",
    accessibilityLabel: "Closed captions can be enabled",
    guidanceLabel: "Open choice option.",
    recommendationSummary: "Keeps the choice set open if travel today no longer works.",
    reasonChips: [
      { label: "No travel", tone: "neutral", advisoryOnly: true },
      { label: "Caption support", tone: "neutral", advisoryOnly: true },
    ],
  },
  {
    alternativeOfferEntryId: "offer_entry_328_central_0845",
    candidateRef: "candidate_328_central_0845",
    rankOrdinal: 4,
    siteId: "site_central",
    localDayBucket: "2026-04-24_morning",
    modality: "face_to_face",
    windowClass: 2,
    windowLabel: "Later but still safe",
    recommendationState: "neutral",
    selectionState: "available",
    patientFacingLabel: "Tomorrow at 8:45am",
    siteLabel: "Central Broadway practice",
    localityLabel: "22 minute trip, near station entrance",
    dateLabel: "Tomorrow",
    timeLabel: "08:45",
    modalityLabel: "Face-to-face",
    travelLabel: "22 min travel",
    waitLabel: "Next morning",
    accessibilityLabel: "Step-free station route",
    guidanceLabel: "Open choice option.",
    recommendationSummary: "Keeps a face-to-face option open for the next morning.",
    reasonChips: [
      { label: "Morning option", tone: "neutral", advisoryOnly: true },
      { label: "Step-free route", tone: "neutral", advisoryOnly: true },
    ],
  },
] as const satisfies readonly AlternativeOfferEntryProjection328[];

function mutateOfferCards(
  cards: readonly AlternativeOfferEntryProjection328[],
  input: {
    selectionState?:
      | AlternativeOfferEntrySelectionState
      | ((card: AlternativeOfferEntryProjection328) => AlternativeOfferEntrySelectionState);
  },
): AlternativeOfferEntryProjection328[] {
  return cards.map((card) => ({
    ...card,
    selectionState:
      typeof input.selectionState === "function"
        ? input.selectionState(card)
        : input.selectionState ?? card.selectionState,
  }));
}

function buildSession(input: {
  alternativeOfferSessionId: NetworkChoiceScenarioId;
  offerEntryRefs: readonly string[];
  fallbackCardRef: string;
  openChoiceState: AlternativeOfferOpenChoiceState;
  patientChoiceState: AlternativeOfferPatientChoiceState;
  callbackOfferState: AlternativeOfferCallbackState;
  entryMode: NetworkChoiceEntryMode;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  patientChoiceDeadlineAt: string;
  expiresAt: string;
  selectedCandidateRef?: string | null;
  latestRegenerationSettlementRef?: string | null;
  supersededByOfferSessionRef?: string | null;
  manifestVersionRef?: string | null;
  channelReleaseFreezeState?: AlternativeOfferChannelReleaseFreezeState;
  monotoneRevision: number;
}): AlternativeOfferSessionRouteSnapshot328 {
  return {
    alternativeOfferSessionId: input.alternativeOfferSessionId,
    hubCoordinationCaseId: "hub_case_328_alt_choice",
    candidateSnapshotRef: `candidate_snapshot::${input.alternativeOfferSessionId}`,
    offerEntryRefs: input.offerEntryRefs,
    fallbackCardRef: input.fallbackCardRef,
    offerSetHash: `offer_set_hash::${input.alternativeOfferSessionId}`,
    visibleOfferSetHash: `visible_offer_set_hash::${input.alternativeOfferSessionId}`,
    openChoiceState: input.openChoiceState,
    offerMode:
      input.entryMode === "secure_link" ? "patient_secure_link" : "staff_read_back",
    patientChoiceState: input.patientChoiceState,
    callbackOfferState: input.callbackOfferState,
    subjectRef: "patient::masked::328",
    routeFamilyRef: "rf_patient_network_alternative_choice",
    sessionEpochRef: "session_epoch::328::current",
    subjectBindingVersionRef: "subject_binding::328::v3",
    manifestVersionRef: input.manifestVersionRef ?? "manifest::patient::2026-04-23",
    releaseApprovalFreezeRef: "release_freeze::patient_network_choice::current",
    channelReleaseFreezeState: input.channelReleaseFreezeState ?? "released",
    surfacePublicationRef: "surface_publication::patient_network_choice::current",
    runtimePublicationBundleRef: "runtime_bundle::patient_network_choice::2026-04-23",
    selectedAnchorRef: input.selectedAnchorRef,
    selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
    experienceContinuityEvidenceRef:
      "experience_continuity::patient_network_choice::booking_manage",
    truthProjectionRef: `truth_projection::${input.alternativeOfferSessionId}`,
    truthTupleHash: `truth_tuple::${input.alternativeOfferSessionId}`,
    policyTupleHash: "policy_tuple::phase5::patient_network_choice::v1",
    visibilityEnvelopeVersionRef: "visibility_envelope::patient_authenticated::v4",
    offerFenceEpoch: 4,
    sameShellContinuationRef: "same_shell_continuation::patient_network_choice",
    patientChoiceDeadlineAt: input.patientChoiceDeadlineAt,
    expiresAt: input.expiresAt,
    selectedCandidateRef: input.selectedCandidateRef ?? null,
    latestRegenerationSettlementRef: input.latestRegenerationSettlementRef ?? null,
    supersededByOfferSessionRef: input.supersededByOfferSessionRef ?? null,
    monotoneRevision: input.monotoneRevision,
  };
}

function buildTruth(input: {
  scenarioId: NetworkChoiceScenarioId;
  offerSetHash: string | null;
  offerState: HubOfferProjectionOfferState;
  offerActionabilityState: HubOfferProjectionActionabilityState;
  fallbackLinkState: HubOfferProjectionFallbackLinkState;
  confirmationTruthState: HubOfferProjectionConfirmationTruthState;
  patientVisibilityState: HubOfferProjectionPatientVisibilityState;
  practiceVisibilityState: HubOfferProjectionPracticeVisibilityState;
  closureState: HubOfferProjectionClosureState;
  selectedCandidateRef?: string | null;
  latestRegenerationSettlementRef?: string | null;
  blockingRefs?: readonly string[];
  monotoneRevision: number;
}): HubOfferToConfirmationTruthProjectionRouteSnapshot328 {
  return {
    hubOfferToConfirmationTruthProjectionId: `hub_offer_truth::${input.scenarioId}`,
    hubCoordinationCaseId: "hub_case_328_alt_choice",
    candidateSnapshotRef: `candidate_snapshot::${input.scenarioId}`,
    selectedCandidateRef: input.selectedCandidateRef ?? null,
    offerSessionRef: input.scenarioId,
    fallbackCardRef: "callback_fallback_card_328",
    offerSetHash: input.offerSetHash,
    offerState: input.offerState,
    offerActionabilityState: input.offerActionabilityState,
    latestRegenerationSettlementRef: input.latestRegenerationSettlementRef ?? null,
    fallbackRef:
      input.fallbackLinkState === "none"
        ? null
        : "fallback_record::hub_case_328_alt_choice::callback",
    fallbackLinkState: input.fallbackLinkState,
    confirmationTruthState: input.confirmationTruthState,
    patientVisibilityState: input.patientVisibilityState,
    practiceVisibilityState: input.practiceVisibilityState,
    closureState: input.closureState,
    experienceContinuityEvidenceRef:
      "experience_continuity::patient_network_choice::booking_manage",
    policyTupleHash: "policy_tuple::phase5::patient_network_choice::v1",
    truthTupleHash: `truth_tuple::${input.scenarioId}`,
    blockingRefs: input.blockingRefs ?? [],
    monotoneRevision: input.monotoneRevision,
    generatedAt: "2026-04-23T17:32:00Z",
  };
}

function buildFallbackCard(
  input: Pick<
    AlternativeOfferFallbackCardProjection328,
    "eligibilityState" | "title" | "body" | "reasonCodeRefs" | "actionLabel"
  >,
): AlternativeOfferFallbackCardProjection328 {
  return {
    alternativeOfferFallbackCardId: "callback_fallback_card_328",
    ...input,
  };
}

function buildScenario(input: {
  scenarioId: NetworkChoiceScenarioId;
  entryMode: NetworkChoiceEntryMode;
  recoveryReason: NetworkChoiceRecoveryReason;
  session: AlternativeOfferSessionRouteSnapshot328;
  truthProjection: HubOfferToConfirmationTruthProjectionRouteSnapshot328;
  regeneration?: AlternativeOfferRegenerationSettlementRouteSnapshot328 | null;
  selectedOfferEntryId?: string | null;
  offerCards: readonly AlternativeOfferEntryProjection328[];
  callbackFallbackCard: AlternativeOfferFallbackCardProjection328;
  expiryStrip: AlternativeOfferExpiryStripProjection328;
  provenanceStub?: AlternativeOfferProvenanceStubProjection328 | null;
  routeRepairPanel?: OfferRouteRepairPanelProjection328 | null;
  heroTitle: string;
  heroBody: string;
  heroRows: readonly NetworkChoiceSummaryRow[];
  guidanceLabel: string;
  secureLinkNote?: string | null;
  declineAllAllowed: boolean;
  serviceRows: readonly NetworkChoiceSummaryRow[];
  preferenceRows: readonly NetworkChoiceSummaryRow[];
  supportStub: NetworkChoiceSupportStubProjection328;
}): PatientNetworkAlternativeChoiceProjection {
  return {
    projectionName: "PatientNetworkAlternativeChoiceProjection",
    scenarioId: input.scenarioId,
    taskId: PATIENT_NETWORK_ALTERNATIVE_CHOICE_TASK_ID,
    visualMode: PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE,
    routeFamilyRef: "rf_patient_network_alternative_choice",
    entryMode: input.entryMode,
    recoveryReason: input.recoveryReason,
    sameShellContinuationRef: input.session.sameShellContinuationRef,
    session: input.session,
    truthProjection: input.truthProjection,
    regeneration: input.regeneration ?? null,
    selectedOfferEntryId: input.selectedOfferEntryId ?? null,
    offerCards: input.offerCards,
    callbackFallbackCard: input.callbackFallbackCard,
    expiryStrip: input.expiryStrip,
    provenanceStub: input.provenanceStub ?? null,
    routeRepairPanel: input.routeRepairPanel ?? null,
    supportStub: input.supportStub,
    heroTitle: input.heroTitle,
    heroBody: input.heroBody,
    heroRows: input.heroRows,
    guidanceLabel: input.guidanceLabel,
    secureLinkNote: input.secureLinkNote ?? null,
    declineAllAllowed: input.declineAllAllowed,
    groupedOfferLabels: Array.from(new Set(input.offerCards.map((card) => card.windowLabel))),
    serviceRows: input.serviceRows,
    preferenceRows: input.preferenceRows,
  };
}

const serviceRows = [
  { label: "Need", value: "Same care need as the local booking route" },
  { label: "Window", value: "Today evening or tomorrow morning still safe" },
  { label: "Open-choice set", value: "4 current patient-offerable options" },
] as const satisfies readonly NetworkChoiceSummaryRow[];

const preferenceRows = [
  { label: "Travel limit", value: "Up to 30 minutes by train or bus" },
  { label: "Format", value: "Face-to-face first, video still acceptable" },
  { label: "Access", value: "Lift access preferred where possible" },
  { label: "Fallback", value: "Callback is acceptable if the live set can no longer continue" },
] as const satisfies readonly NetworkChoiceSummaryRow[];

const heroRows = [
  { label: "Reference time", value: "Thu 23 Apr, 17:32" },
  { label: "Offer set hash", value: "open-choice-v1" },
  { label: "Action posture", value: "Live open choice" },
] as const satisfies readonly NetworkChoiceSummaryRow[];

const supportStub = {
  heading: "Need help with this network choice?",
  body: "You can return to your request or ask for support without losing the same offer context.",
  returnLabel: "Return to request",
  supportLabel: "Open support path",
} as const satisfies NetworkChoiceSupportStubProjection328;

const scenariosById: Readonly<Record<NetworkChoiceScenarioId, PatientNetworkAlternativeChoiceProjection>> = {
  offer_session_328_live: buildScenario({
    scenarioId: "offer_session_328_live",
    entryMode: "authenticated",
    recoveryReason: "none",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_live",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "full_set_visible",
      patientChoiceState: "opened",
      callbackOfferState: "available",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_riverside_1830",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_riverside_1830",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      monotoneRevision: 7,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_live",
      offerSetHash: "offer_set_hash::offer_session_328_live",
      offerState: "patient_choice_pending",
      offerActionabilityState: "live_open_choice",
      fallbackLinkState: "none",
      confirmationTruthState: "no_commit",
      patientVisibilityState: "choice_visible",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      monotoneRevision: 7,
    }),
    offerCards: liveOfferCards,
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "visible",
      title: "Request a callback instead",
      body:
        "Callback stays separate from the ranked options. Use it when none of these times can work safely for you.",
      reasonCodeRefs: ["callback_fallback", "governed_separate_path"],
      actionLabel: "Request callback instead",
    }),
    expiryStrip: {
      mode: "reply_by",
      tone: "primary",
      heading: "Reply by 6:40pm",
      body:
        "Recommendation chips are advisory only. The full current set stays visible until the session expires or is regenerated.",
    },
    heroTitle: "Choose a network appointment that still works for you",
    heroBody:
      "These are the current safe options for this request across the network. Nothing is preselected for you. Recommendation chips guide the choice set without hiding the other options.",
    heroRows,
    guidanceLabel: "Recommendation is advisory only. Select one option to continue.",
    secureLinkNote: null,
    declineAllAllowed: true,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_contact_repair: buildScenario({
    scenarioId: "offer_session_328_contact_repair",
    entryMode: "authenticated",
    recoveryReason: "contact_route_repair",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_contact_repair",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "full_set_visible",
      patientChoiceState: "recovery_only",
      callbackOfferState: "blocked",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_wharf_1910",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_wharf_1910",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_wharf_1910",
      monotoneRevision: 8,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_contact_repair",
      offerSetHash: "offer_set_hash::offer_session_328_contact_repair",
      offerState: "patient_choice_pending",
      offerActionabilityState: "blocked",
      fallbackLinkState: "none",
      confirmationTruthState: "blocked_by_drift",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      selectedCandidateRef: "candidate_328_wharf_1910",
      blockingRefs: ["reachability_dependency::sms_route_stale"],
      monotoneRevision: 8,
    }),
    selectedOfferEntryId: "offer_entry_328_wharf_1910",
    offerCards: mutateOfferCards(liveOfferCards, {
      selectionState: (card) =>
        card.alternativeOfferEntryId === "offer_entry_328_wharf_1910"
          ? "selected"
          : "available",
    }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "blocked",
      title: "Callback is held until the contact route is repaired",
      body:
        "The callback path stays separate, but it is fenced while the current reply route cannot be trusted.",
      reasonCodeRefs: ["callback_blocked", "contact_route_repair_required"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "recovery",
      tone: "blocked",
      heading: "Choice is frozen while the route is repaired",
      body:
        "The selected option stays visible in place, but accept and callback stay blocked until contact-route trust is current again.",
    },
    routeRepairPanel: {
      repairState: "required",
      heading: "Repair the contact route before you continue",
      body:
        "We cannot safely move this network choice forward until the SMS route used for reminders and fallback is verified again.",
      rows: [
        { label: "Blocked route", value: "SMS first" },
        { label: "Masked destination", value: "07••• •••218" },
        { label: "Preserved option", value: "North Wharf hub at 7:10pm" },
      ],
      actionLabel: "Repair contact route",
      transitionScenarioId: "offer_session_328_regenerated",
    },
    heroTitle: "Your choice stays visible while we repair the route",
    heroBody:
      "The open-choice set is still shown in the same shell. Fresh actions are blocked until reminder and fallback delivery trust is repaired.",
    heroRows: [
      { label: "Reference time", value: "Thu 23 Apr, 17:34" },
      { label: "Blocked by", value: "Contact-route drift" },
      { label: "Preserved card", value: "North Wharf hub at 7:10pm" },
    ],
    guidanceLabel: "Frozen for repair. Last safe option stays pinned.",
    secureLinkNote: null,
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_stale_link: buildScenario({
    scenarioId: "offer_session_328_stale_link",
    entryMode: "secure_link",
    recoveryReason: "stale_link",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_stale_link",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "read_only_provenance",
      patientChoiceState: "recovery_only",
      callbackOfferState: "blocked",
      entryMode: "secure_link",
      selectedAnchorRef: "offer_entry_328_riverside_1830",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_riverside_1830",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_riverside_1830",
      manifestVersionRef: "manifest::patient::2026-04-22",
      monotoneRevision: 9,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_stale_link",
      offerSetHash: "offer_set_hash::offer_session_328_stale_link",
      offerState: "patient_choice_pending",
      offerActionabilityState: "blocked",
      fallbackLinkState: "none",
      confirmationTruthState: "blocked_by_drift",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      selectedCandidateRef: "candidate_328_riverside_1830",
      blockingRefs: ["secure_link::stale_binding"],
      monotoneRevision: 9,
    }),
    selectedOfferEntryId: "offer_entry_328_riverside_1830",
    offerCards: mutateOfferCards(liveOfferCards, { selectionState: "read_only_provenance" }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "read_only_provenance",
      title: "Callback fallback is preserved as reference only",
      body:
        "This secure link no longer matches the current subject or session fence, so no fresh patient action can be taken from it.",
      reasonCodeRefs: ["secure_link_stale", "subject_binding_drift"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "recovery",
      tone: "blocked",
      heading: "This secure link is no longer current",
      body:
        "The last safe option set remains visible as provenance while the shell fails closed on the stale link.",
    },
    provenanceStub: {
      heading: "Read-only provenance kept in place",
      body:
        "You can still review the previously visible options, but the current route must be refreshed under the latest secure-link fence before anything can be accepted or declined.",
      rows: [
        { label: "Preserved choice", value: "Riverside network clinic at 6:30pm" },
        { label: "Fence state", value: "Stale secure-link binding" },
        { label: "Next safe step", value: "Open the current choice set" },
      ],
      actionLabel: "Open current choice set",
      transitionScenarioId: "offer_session_328_regenerated",
    },
    heroTitle: "The link changed before your choice could continue",
    heroBody:
      "The same shell preserves the last safe option set, but stale-link recovery blocks fresh mutations until the current session is re-established.",
    heroRows: [
      { label: "Entry mode", value: "Secure link" },
      { label: "Fence state", value: "Stale binding" },
      { label: "Action posture", value: "Read-only provenance" },
    ],
    guidanceLabel: "Read-only provenance only.",
    secureLinkNote:
      "This route came from a secure link. The shell preserves the last safe set instead of reopening stale accept or callback controls.",
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_wrong_patient: buildScenario({
    scenarioId: "offer_session_328_wrong_patient",
    entryMode: "secure_link",
    recoveryReason: "wrong_patient",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_wrong_patient",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "read_only_provenance",
      patientChoiceState: "recovery_only",
      callbackOfferState: "blocked",
      entryMode: "secure_link",
      selectedAnchorRef: "offer_entry_328_riverside_1830",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_riverside_1830",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_riverside_1830",
      monotoneRevision: 10,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_wrong_patient",
      offerSetHash: "offer_set_hash::offer_session_328_wrong_patient",
      offerState: "patient_choice_pending",
      offerActionabilityState: "blocked",
      fallbackLinkState: "none",
      confirmationTruthState: "blocked_by_drift",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      selectedCandidateRef: "candidate_328_riverside_1830",
      blockingRefs: ["identity_hold::wrong_patient"],
      monotoneRevision: 10,
    }),
    selectedOfferEntryId: "offer_entry_328_riverside_1830",
    offerCards: mutateOfferCards(liveOfferCards, { selectionState: "read_only_provenance" }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "read_only_provenance",
      title: "Fallback remains hidden behind the identity hold",
      body:
        "Only summary-tier context stays visible until the patient identity is corrected.",
      reasonCodeRefs: ["wrong_patient_hold", "summary_only"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "recovery",
      tone: "blocked",
      heading: "We paused live controls while identity is checked",
      body:
        "The previously shown network options stay visible at summary tier, but fresh choices are blocked on the wrong-patient hold.",
    },
    provenanceStub: {
      heading: "Summary-only provenance preserved",
      body:
        "The patient shell keeps the last safe option context without exposing fresh choice or fallback actions to the wrong person.",
      rows: [
        { label: "Hold class", value: "Wrong-patient correction" },
        { label: "Visible tier", value: "Summary only" },
        { label: "Preserved option", value: "Riverside network clinic at 6:30pm" },
      ],
      actionLabel: null,
      transitionScenarioId: null,
    },
    heroTitle: "Only summary context is visible while identity is repaired",
    heroBody:
      "The route fails closed instead of switching patient. The last safe option set remains on screen so support and recovery can continue in place.",
    heroRows: [
      { label: "Identity posture", value: "Wrong-patient hold" },
      { label: "Visible tier", value: "Summary only" },
      { label: "Fresh actions", value: "Blocked" },
    ],
    guidanceLabel: "Identity hold. No fresh patient mutation allowed.",
    secureLinkNote:
      "Secure-link and authenticated recovery must converge on the same bounded patient-safe posture.",
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_expired: buildScenario({
    scenarioId: "offer_session_328_expired",
    entryMode: "authenticated",
    recoveryReason: "expired",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_expired",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "read_only_provenance",
      patientChoiceState: "expired",
      callbackOfferState: "blocked",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_riverside_1830",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_riverside_1830",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_riverside_1830",
      monotoneRevision: 11,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_expired",
      offerSetHash: "offer_set_hash::offer_session_328_expired",
      offerState: "expired",
      offerActionabilityState: "read_only_provenance",
      fallbackLinkState: "none",
      confirmationTruthState: "expired",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      selectedCandidateRef: "candidate_328_riverside_1830",
      blockingRefs: ["offer_deadline_elapsed"],
      monotoneRevision: 11,
    }),
    selectedOfferEntryId: "offer_entry_328_riverside_1830",
    offerCards: mutateOfferCards(liveOfferCards, { selectionState: "expired" }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "read_only_provenance",
      title: "Callback from this offer set is no longer live",
      body:
        "The separate fallback card is preserved as provenance, not as a still-live action from an expired session.",
      reasonCodeRefs: ["expired_session", "stale_fallback_blocked"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "expired",
      tone: "warn",
      heading: "This choice set has expired",
      body:
        "The previous options stay visible as read-only provenance. Fresh accept, decline, and callback actions are fenced until a current set exists.",
    },
    provenanceStub: {
      heading: "Last safe option set kept for reference",
      body:
        "Expiry does not collapse the route to a generic page. The set remains visible so the patient can see what changed.",
      rows: [
        { label: "Expired at", value: "Today 6:40pm" },
        { label: "Preserved option", value: "Riverside network clinic at 6:30pm" },
        { label: "Next safe step", value: "Ask for support or wait for a regenerated set" },
      ],
      actionLabel: null,
      transitionScenarioId: null,
    },
    heroTitle: "The previous option set is now reference only",
    heroBody:
      "Expiry freezes the route in place. The same shell keeps the last safe options visible while new supply is awaited or support takes over.",
    heroRows: [
      { label: "Offer state", value: "Expired" },
      { label: "Visible posture", value: "Read-only provenance" },
      { label: "Fallback", value: "Not live from this old session" },
    ],
    guidanceLabel: "Expired sessions stay visible, but not actionable.",
    secureLinkNote: null,
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_superseded: buildScenario({
    scenarioId: "offer_session_328_superseded",
    entryMode: "authenticated",
    recoveryReason: "superseded",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_superseded",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "read_only_provenance",
      patientChoiceState: "superseded",
      callbackOfferState: "blocked",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_wharf_1910",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_wharf_1910",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_wharf_1910",
      latestRegenerationSettlementRef: "alt_regen_328_superseded",
      supersededByOfferSessionRef: "offer_session_328_regenerated",
      monotoneRevision: 12,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_superseded",
      offerSetHash: "offer_set_hash::offer_session_328_superseded",
      offerState: "superseded",
      offerActionabilityState: "read_only_provenance",
      fallbackLinkState: "none",
      confirmationTruthState: "superseded",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      selectedCandidateRef: "candidate_328_wharf_1910",
      latestRegenerationSettlementRef: "alt_regen_328_superseded",
      blockingRefs: ["candidate_snapshot_superseded"],
      monotoneRevision: 12,
    }),
    regeneration: {
      alternativeOfferRegenerationSettlementId: "alt_regen_328_superseded",
      triggerClass: "candidate_snapshot_superseded",
      resultState: "regenerated_in_shell",
      previousOfferSessionRef: "offer_session_328_superseded",
      nextOfferSessionRef: "offer_session_328_regenerated",
      preservedSelectedAnchorRef: "offer_entry_328_wharf_1910",
      preservedSelectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_wharf_1910",
      recordedAt: "2026-04-23T17:39:00Z",
    },
    selectedOfferEntryId: "offer_entry_328_wharf_1910",
    offerCards: mutateOfferCards(liveOfferCards, { selectionState: "superseded" }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "read_only_provenance",
      title: "Callback from the previous set is preserved as provenance",
      body:
        "A newer choice set already replaced this one. The separate fallback card stays visible so the patient can see the prior safe path.",
      reasonCodeRefs: ["superseded_session", "callback_provenance_only"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "superseded",
      tone: "warn",
      heading: "A newer choice set replaced this one",
      body:
        "The previously selected card stays visible in place. Fresh actions move to the regenerated set instead of reopening stale controls here.",
    },
    provenanceStub: {
      heading: "Open the current choice set",
      body:
        "The shell preserved the previous set first, then published the new one. That keeps provenance visible while blocking stale accept, decline, and callback actions.",
      rows: [
        { label: "Regeneration trigger", value: "Candidate snapshot superseded" },
        { label: "Preserved card", value: "North Wharf hub at 7:10pm" },
        { label: "Next session", value: "Current open-choice set ready" },
      ],
      actionLabel: "Open current choice set",
      transitionScenarioId: "offer_session_328_regenerated",
    },
    heroTitle: "The previous set is still visible, but a newer one is current",
    heroBody:
      "Supersession keeps the last safe cards in place as provenance instead of quietly moving the patient to a new page or leaving stale buttons armed.",
    heroRows: [
      { label: "Offer state", value: "Superseded" },
      { label: "Regeneration", value: "In shell" },
      { label: "Preserved card", value: "North Wharf hub at 7:10pm" },
    ],
    guidanceLabel: "Superseded sessions stay visible, but not actionable.",
    secureLinkNote: null,
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_regenerated: buildScenario({
    scenarioId: "offer_session_328_regenerated",
    entryMode: "authenticated",
    recoveryReason: "none",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_regenerated",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "full_set_visible",
      patientChoiceState: "opened",
      callbackOfferState: "available",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_wharf_1910",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_wharf_1910",
      patientChoiceDeadlineAt: "2026-04-23T18:55:00Z",
      expiresAt: "2026-04-23T18:55:00Z",
      selectedCandidateRef: "candidate_328_wharf_1910",
      latestRegenerationSettlementRef: "alt_regen_328_superseded",
      monotoneRevision: 13,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_regenerated",
      offerSetHash: "offer_set_hash::offer_session_328_regenerated",
      offerState: "patient_choice_pending",
      offerActionabilityState: "live_open_choice",
      fallbackLinkState: "none",
      confirmationTruthState: "no_commit",
      patientVisibilityState: "choice_visible",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_offer",
      selectedCandidateRef: "candidate_328_wharf_1910",
      latestRegenerationSettlementRef: "alt_regen_328_superseded",
      monotoneRevision: 13,
    }),
    selectedOfferEntryId: "offer_entry_328_wharf_1910",
    offerCards: mutateOfferCards(liveOfferCards, {
      selectionState: (card) =>
        card.alternativeOfferEntryId === "offer_entry_328_wharf_1910"
          ? "selected"
          : "available",
    }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "visible",
      title: "Request a callback instead",
      body:
        "The separate fallback card is live again under the current session. The previous stale card remains suppressed.",
      reasonCodeRefs: ["callback_fallback", "current_session_live"],
      actionLabel: "Request callback instead",
    }),
    expiryStrip: {
      mode: "reply_by",
      tone: "primary",
      heading: "Current choice set refreshed until 6:55pm",
      body:
        "The selected card anchor was preserved through recovery, but it is still only a selected option. Accept requires an explicit action.",
    },
    heroTitle: "The current network choice set is live again",
    heroBody:
      "Recovery kept the same shell and preserved the selected card anchor. The refreshed set is open and fully selectable again.",
    heroRows: [
      { label: "Regenerated at", value: "Thu 23 Apr, 17:39" },
      { label: "Preserved card", value: "North Wharf hub at 7:10pm" },
      { label: "Action posture", value: "Live open choice" },
    ],
    guidanceLabel: "Recovered in shell. Selection is preserved, not auto-accepted.",
    secureLinkNote: null,
    declineAllAllowed: true,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_embedded_drift: buildScenario({
    scenarioId: "offer_session_328_embedded_drift",
    entryMode: "authenticated",
    recoveryReason: "embedded_drift",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_embedded_drift",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "read_only_provenance",
      patientChoiceState: "recovery_only",
      callbackOfferState: "blocked",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_wharf_1910",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_wharf_1910",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_wharf_1910",
      manifestVersionRef: "manifest::patient::2026-04-22",
      channelReleaseFreezeState: "monitoring",
      monotoneRevision: 14,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_embedded_drift",
      offerSetHash: "offer_set_hash::offer_session_328_embedded_drift",
      offerState: "patient_choice_pending",
      offerActionabilityState: "blocked",
      fallbackLinkState: "none",
      confirmationTruthState: "blocked_by_drift",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_supplier_drift",
      selectedCandidateRef: "candidate_328_wharf_1910",
      blockingRefs: ["embedded_session::manifest_drift"],
      monotoneRevision: 14,
    }),
    selectedOfferEntryId: "offer_entry_328_wharf_1910",
    offerCards: mutateOfferCards(liveOfferCards, { selectionState: "read_only_provenance" }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "read_only_provenance",
      title: "Fallback is preserved, not active",
      body:
        "Embedded drift blocks fresh callback movement until the current app session and manifest are aligned again.",
      reasonCodeRefs: ["embedded_drift", "callback_blocked"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "recovery",
      tone: "blocked",
      heading: "The embedded session drifted",
      body:
        "The active option set remains visible as provenance, but stale accept, decline, and callback controls are fenced in embedded mode.",
    },
    provenanceStub: {
      heading: "Reopen under the current app session",
      body:
        "Embedded recovery keeps the selected card in place but fails closed on stale manifest or bridge context.",
      rows: [
        { label: "Embedded posture", value: "Manifest drift" },
        { label: "Preserved card", value: "North Wharf hub at 7:10pm" },
        { label: "Current action", value: "Open current choice set" },
      ],
      actionLabel: "Open current choice set",
      transitionScenarioId: "offer_session_328_regenerated",
    },
    heroTitle: "Your last safe option set stays visible in the NHS App",
    heroBody:
      "Embedded mode uses the same route semantics. When the app session drifts, the shell preserves provenance and blocks stale mutation in place.",
    heroRows: [
      { label: "Embedded mode", value: "NHS App" },
      { label: "Drift", value: "Manifest or bridge mismatch" },
      { label: "Fresh actions", value: "Blocked" },
    ],
    guidanceLabel: "Embedded drift recovery. Last safe card preserved.",
    secureLinkNote: null,
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
  offer_session_328_publication_drift: buildScenario({
    scenarioId: "offer_session_328_publication_drift",
    entryMode: "authenticated",
    recoveryReason: "publication_drift",
    session: buildSession({
      alternativeOfferSessionId: "offer_session_328_publication_drift",
      offerEntryRefs: liveOfferCards.map((card) => card.alternativeOfferEntryId),
      fallbackCardRef: "callback_fallback_card_328",
      openChoiceState: "read_only_provenance",
      patientChoiceState: "recovery_only",
      callbackOfferState: "blocked",
      entryMode: "authenticated",
      selectedAnchorRef: "offer_entry_328_riverside_1830",
      selectedAnchorTupleHashRef: "anchor_tuple::offer_entry_328_riverside_1830",
      patientChoiceDeadlineAt: "2026-04-23T18:40:00Z",
      expiresAt: "2026-04-23T18:40:00Z",
      selectedCandidateRef: "candidate_328_riverside_1830",
      channelReleaseFreezeState: "rollback_recommended",
      monotoneRevision: 15,
    }),
    truthProjection: buildTruth({
      scenarioId: "offer_session_328_publication_drift",
      offerSetHash: "offer_set_hash::offer_session_328_publication_drift",
      offerState: "patient_choice_pending",
      offerActionabilityState: "blocked",
      fallbackLinkState: "none",
      confirmationTruthState: "blocked_by_drift",
      patientVisibilityState: "recovery_required",
      practiceVisibilityState: "continuity_pending",
      closureState: "blocked_by_supplier_drift",
      selectedCandidateRef: "candidate_328_riverside_1830",
      blockingRefs: ["publication_tuple::drifted"],
      monotoneRevision: 15,
    }),
    selectedOfferEntryId: "offer_entry_328_riverside_1830",
    offerCards: mutateOfferCards(liveOfferCards, { selectionState: "read_only_provenance" }),
    callbackFallbackCard: buildFallbackCard({
      eligibilityState: "read_only_provenance",
      title: "Fallback is paused with the publication tuple",
      body:
        "The shell keeps the last safe open-choice set visible, but publication drift blocks fresh actions until the current bundle is restored.",
      reasonCodeRefs: ["publication_drift", "release_recovery"],
      actionLabel: null,
    }),
    expiryStrip: {
      mode: "recovery",
      tone: "blocked",
      heading: "Publication drift blocked fresh choice",
      body:
        "The same shell preserves the last safe card anchor while the runtime bundle or route publication tuple is brought back into line.",
    },
    provenanceStub: {
      heading: "Refresh under the current publication tuple",
      body:
        "Publication drift keeps the option cards visible, but it must not leave stale accept or callback controls armed.",
      rows: [
        { label: "Publication state", value: "Rollback recommended" },
        { label: "Preserved card", value: "Riverside network clinic at 6:30pm" },
        { label: "Next safe step", value: "Open current choice set" },
      ],
      actionLabel: "Open current choice set",
      transitionScenarioId: "offer_session_328_regenerated",
    },
    heroTitle: "The route kept your last safe option set while publication recovered",
    heroBody:
      "Runtime or publication drift changes the route posture without disconnecting the patient from the same booking family or throwing away the last safe card anchor.",
    heroRows: [
      { label: "Publication", value: "Rollback recommended" },
      { label: "Action posture", value: "Blocked" },
      { label: "Preserved card", value: "Riverside network clinic at 6:30pm" },
    ],
    guidanceLabel: "Publication drift recovery. Last safe card preserved.",
    secureLinkNote: null,
    declineAllAllowed: false,
    serviceRows,
    preferenceRows,
    supportStub,
  }),
};

export function resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
  scenarioId: string,
): PatientNetworkAlternativeChoiceProjection | null {
  return scenariosById[scenarioId as NetworkChoiceScenarioId] ?? null;
}

export function resolvePatientNetworkAlternativeChoiceProjection(
  offerSessionId: string,
): PatientNetworkAlternativeChoiceProjection | null {
  return resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(offerSessionId);
}

export function isPatientNetworkAlternativeChoicePath(pathname: string): boolean {
  return /^\/bookings\/network\/[^/]+$/.test(pathname);
}

export function resolvePatientNetworkAlternativeChoiceScenarioId(
  pathname: string,
): NetworkChoiceScenarioId | null {
  const match = /^\/bookings\/network\/([^/]+)$/.exec(pathname);
  if (!match) {
    return null;
  }
  const scenarioId = match[1] as NetworkChoiceScenarioId;
  return resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(scenarioId)
    ? scenarioId
    : null;
}
