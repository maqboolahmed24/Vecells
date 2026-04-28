import type { AggregateRef } from "./phase6-pharmacy-case-kernel";
import type {
  PharmacyChoiceDisclosurePolicy,
  PharmacyChoiceExplanation,
  PharmacyChoiceOverrideAcknowledgement,
  PharmacyChoiceOverrideRequirementState,
  PharmacyChoiceProof,
  PharmacyChoiceProjectionState,
  PharmacyChoiceSession,
  PharmacyChoiceTruthProjection,
  PharmacyOpeningState,
  PharmacyChoiceVisibilityState,
} from "./phase6-pharmacy-directory-choice-engine";

const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_342 = "seq_342" as const;

type Task343 = typeof TASK_343;
type Task342 = typeof TASK_342;

export const PHARMACY_CHOOSER_PREMIUM_VISUAL_MODE = "Pharmacy_Chooser_Premium";

export type PharmacyChoiceGroupKey = "recommended" | "all_valid";
export type PharmacyChoiceFilterBucketKey = "all" | "open_now" | "open_later";
export type PharmacyChoiceChipTone =
  | "recommendation"
  | "guidance"
  | "warning"
  | "urgent"
  | "neutral";

export interface PharmacyChoiceReasonChip {
  label: string;
  tone: PharmacyChoiceChipTone;
}

export interface PharmacyChoiceMapPoint {
  xPercent: number;
  yPercent: number;
  areaLabel: string;
}

export interface PharmacyChoiceProviderCardSnapshot {
  providerId: string;
  providerRef: AggregateRef<"PharmacyProvider", Task343>;
  explanationRef: AggregateRef<"PharmacyChoiceExplanation", Task343>;
  rankOrdinal: number;
  displayName: string;
  groupKey: PharmacyChoiceGroupKey;
  visibilityDisposition: PharmacyChoiceVisibilityState;
  overrideRequirementState: PharmacyChoiceOverrideRequirementState;
  openingState: PharmacyOpeningState;
  openBucket: Exclude<PharmacyChoiceFilterBucketKey, "all">;
  openingLabel: string;
  nextContactLabel: string;
  distanceLabel: string;
  travelLabel: string;
  consultationLabel: string;
  accessLabel: string;
  warningTitle: string | null;
  warningSummary: string | null;
  reasonChips: readonly PharmacyChoiceReasonChip[];
  mapPoint: PharmacyChoiceMapPoint;
}

export interface PharmacyChoiceFilterBucketSnapshot {
  key: PharmacyChoiceFilterBucketKey;
  label: string;
  count: number;
  warnedCount: number;
  summary: string;
}

export interface PharmacyChoiceWarningAcknowledgementSnapshot {
  title: string;
  summary: string;
  checkboxLabel: string;
  acknowledgeLabel: string;
  scriptRef: string;
  talkingPoints: readonly string[];
}

export interface PharmacyChoiceDriftRecoverySnapshot {
  state: "stable" | "visible_choice_set_changed" | "warning_posture_changed";
  title: string;
  summary: string;
  previousVisibleChoiceSetHash: string;
  currentVisibleChoiceSetHash: string;
  previousSelectionProviderId: string | null;
  previousSelectionLabel: string | null;
  previousSelectionSummary: string | null;
  actionLabel: string;
  requiresSafeReselection: boolean;
}

export interface PharmacyChosenProviderReviewSnapshot {
  reviewTitle: string;
  reviewSummary: string;
  changeActionLabel: string;
  noSelectionLabel: string;
}

export interface PharmacyChoicePreviewSnapshot {
  pharmacyCaseId: string;
  visualMode: typeof PHARMACY_CHOOSER_PREMIUM_VISUAL_MODE;
  pageTitle: string;
  pageSummary: string;
  recommendedSummary: string;
  allValidSummary: string;
  mapSummary: string;
  suggestedMapDefault: boolean;
  choiceProof: PharmacyChoiceProof;
  disclosurePolicy: PharmacyChoiceDisclosurePolicy;
  choiceSession: PharmacyChoiceSession;
  truthProjection: PharmacyChoiceTruthProjection;
  explanations: readonly PharmacyChoiceExplanation[];
  overrideAcknowledgement: PharmacyChoiceOverrideAcknowledgement | null;
  providerCards: readonly PharmacyChoiceProviderCardSnapshot[];
  filterBuckets: readonly PharmacyChoiceFilterBucketSnapshot[];
  warningAcknowledgement: PharmacyChoiceWarningAcknowledgementSnapshot | null;
  driftRecovery: PharmacyChoiceDriftRecoverySnapshot | null;
  chosenReview: PharmacyChosenProviderReviewSnapshot;
}

function makeRef<TTarget extends string>(
  targetFamily: TTarget,
  refId: string,
): AggregateRef<TTarget, Task343> {
  return {
    targetFamily,
    refId,
    ownerTask: TASK_343,
  };
}

function makeCaseRef(refId: string): AggregateRef<"PharmacyCase", Task342> {
  return {
    targetFamily: "PharmacyCase",
    refId,
    ownerTask: TASK_342,
  };
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `phc_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function buildProof(input: {
  proofId: string;
  directorySnapshotId: string;
  orderedProviderIds: readonly string[];
  recommendedProviderIds: readonly string[];
  warningProviderIds: readonly string[];
  fullVisibleProviderCount: number;
}): PharmacyChoiceProof {
  return {
    pharmacyChoiceProofId: input.proofId,
    directorySnapshotRef: makeRef("PharmacyDirectorySnapshot", input.directorySnapshotId),
    visibleProviderRefs: input.orderedProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    recommendedProviderRefs: input.recommendedProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    warningVisibleProviderRefs: input.warningProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    suppressedUnsafeProviderRefs: [],
    fullVisibleProviderCount: input.fullVisibleProviderCount,
    frontierToleranceRatio: 0.05,
    rankingFormula:
      "timingBand desc -> serviceFitClass desc -> recommendationScore desc -> displayName asc",
    visibleChoiceSetHash: stableHash(input.orderedProviderIds.join("|")),
    calculatedAt: "2026-04-24T11:18:00.000Z",
    version: 1,
  };
}

function buildExplanation(input: {
  proof: PharmacyChoiceProof;
  providerId: string;
  rankOrdinal: number;
  serviceFitClass: 0 | 1 | 2;
  timingBand: 0 | 1 | 2;
  recommendationScore: number;
  visibilityDisposition: PharmacyChoiceVisibilityState;
  reasonCodeRefs: readonly string[];
  patientReasonCueRefs: readonly string[];
  staffExplanationRefs: readonly string[];
  warningCopyRef: string | null;
  overrideRequirementState: PharmacyChoiceOverrideRequirementState;
}): PharmacyChoiceExplanation {
  return {
    pharmacyChoiceExplanationId: `choice_expl_${input.providerId}`,
    pharmacyChoiceProofRef: makeRef("PharmacyChoiceProof", input.proof.pharmacyChoiceProofId),
    providerRef: makeRef("PharmacyProvider", input.providerId),
    rankOrdinal: input.rankOrdinal,
    serviceFitClass: input.serviceFitClass,
    timingBand: input.timingBand,
    recommendationScore: input.recommendationScore,
    visibilityDisposition: input.visibilityDisposition,
    reasonCodeRefs: input.reasonCodeRefs,
    patientReasonCueRefs: input.patientReasonCueRefs,
    staffExplanationRefs: input.staffExplanationRefs,
    warningCopyRef: input.warningCopyRef,
    suppressionReasonCodeRef: null,
    overrideRequirementState: input.overrideRequirementState,
    disclosureTupleHash: stableHash(
      [
        input.providerId,
        String(input.rankOrdinal),
        input.visibilityDisposition,
        input.overrideRequirementState,
      ].join("::"),
    ),
    generatedAt: "2026-04-24T11:19:00.000Z",
    version: 1,
  };
}

function buildSession(input: {
  sessionId: string;
  caseId: string;
  directorySnapshotId: string;
  proof: PharmacyChoiceProof;
  disclosurePolicyId: string;
  orderedProviderIds: readonly string[];
  recommendedProviderIds: readonly string[];
  selectedProviderId: string | null;
  selectedExplanationId: string | null;
  patientOverrideRequired: boolean;
  sessionState: PharmacyChoiceSession["sessionState"];
  visibleChoiceSetHash?: string;
  selectionBindingHash?: string | null;
}): PharmacyChoiceSession {
  return {
    pharmacyChoiceSessionId: input.sessionId,
    pharmacyCaseRef: makeCaseRef(input.caseId),
    directorySnapshotRef: makeRef("PharmacyDirectorySnapshot", input.directorySnapshotId),
    choiceProofRef: makeRef("PharmacyChoiceProof", input.proof.pharmacyChoiceProofId),
    choiceDisclosurePolicyRef: makeRef(
      "PharmacyChoiceDisclosurePolicy",
      input.disclosurePolicyId,
    ),
    visibleProviderRefs: input.orderedProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    recommendedProviderRefs: input.recommendedProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    selectedProviderRef: input.selectedProviderId
      ? makeRef("PharmacyProvider", input.selectedProviderId)
      : null,
    selectedProviderExplanationRef: input.selectedExplanationId
      ? makeRef("PharmacyChoiceExplanation", input.selectedExplanationId)
      : null,
    selectedProviderCapabilitySnapshotRef: input.selectedProviderId
      ? makeRef(
          "PharmacyProviderCapabilitySnapshot",
          `capability_${input.selectedProviderId}`,
        )
      : null,
    overrideAcknowledgementRef: null,
    patientOverrideRequired: input.patientOverrideRequired,
    selectionBindingHash: input.selectionBindingHash ?? null,
    visibleChoiceSetHash: input.visibleChoiceSetHash ?? input.proof.visibleChoiceSetHash,
    sessionState: input.sessionState,
    directoryTupleHash: stableHash(
      `${input.directorySnapshotId}::${input.proof.visibleChoiceSetHash}`,
    ),
    freshnessPosture: "current",
    revision: 1,
    createdAt: "2026-04-24T11:20:00.000Z",
    updatedAt: "2026-04-24T11:21:00.000Z",
    version: 1,
  };
}

function buildTruthProjection(input: {
  projectionId: string;
  caseId: string;
  directorySnapshotId: string;
  proof: PharmacyChoiceProof;
  disclosurePolicyId: string;
  session: PharmacyChoiceSession;
  orderedProviderIds: readonly string[];
  recommendedProviderIds: readonly string[];
  warningProviderIds: readonly string[];
  selectedProviderId: string | null;
  selectedExplanationId: string | null;
  projectionState: PharmacyChoiceProjectionState;
}): PharmacyChoiceTruthProjection {
  return {
    pharmacyChoiceTruthProjectionId: input.projectionId,
    pharmacyCaseId: input.caseId,
    choiceSessionRef: makeRef("PharmacyChoiceSession", input.session.pharmacyChoiceSessionId),
    directorySnapshotRef: makeRef("PharmacyDirectorySnapshot", input.directorySnapshotId),
    choiceProofRef: makeRef("PharmacyChoiceProof", input.proof.pharmacyChoiceProofId),
    choiceDisclosurePolicyRef: makeRef(
      "PharmacyChoiceDisclosurePolicy",
      input.disclosurePolicyId,
    ),
    directoryTupleHash: input.session.directoryTupleHash,
    visibleProviderRefs: input.orderedProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    recommendedProviderRefs: input.recommendedProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    warningVisibleProviderRefs: input.warningProviderIds.map((providerId) =>
      makeRef("PharmacyProvider", providerId),
    ),
    suppressedUnsafeSummaryRef: "suppressed_unsafe.none",
    selectedProviderRef: input.selectedProviderId
      ? makeRef("PharmacyProvider", input.selectedProviderId)
      : null,
    selectedProviderExplanationRef: input.selectedExplanationId
      ? makeRef("PharmacyChoiceExplanation", input.selectedExplanationId)
      : null,
    selectedProviderCapabilitySnapshotRef: input.selectedProviderId
      ? makeRef(
          "PharmacyProviderCapabilitySnapshot",
          `capability_${input.selectedProviderId}`,
        )
      : null,
    patientOverrideRequired: input.session.patientOverrideRequired,
    overrideAcknowledgementRef: input.session.overrideAcknowledgementRef,
    selectionBindingHash: input.session.selectionBindingHash,
    visibleChoiceSetHash: input.proof.visibleChoiceSetHash,
    projectionState: input.projectionState,
    computedAt: "2026-04-24T11:21:00.000Z",
    version: 1,
  };
}

function buildDisclosurePolicy(input: {
  policyId: string;
  proof: PharmacyChoiceProof;
}): PharmacyChoiceDisclosurePolicy {
  return {
    pharmacyChoiceDisclosurePolicyId: input.policyId,
    choiceProofRef: makeRef("PharmacyChoiceProof", input.proof.pharmacyChoiceProofId),
    suppressedUnsafeSummaryRef: "suppressed_unsafe.none",
    warnedChoicePolicyRef: "warned_choice.keep_full_set_visible",
    hiddenStatePolicyRef: "hidden_state.none",
    generatedAt: "2026-04-24T11:18:30.000Z",
    version: 1,
  };
}

function providerCard(input: PharmacyChoiceProviderCardSnapshot): PharmacyChoiceProviderCardSnapshot {
  return input;
}

function filterBuckets(
  providers: readonly PharmacyChoiceProviderCardSnapshot[],
): readonly PharmacyChoiceFilterBucketSnapshot[] {
  const openNow = providers.filter((provider) => provider.openBucket === "open_now");
  const openLater = providers.filter((provider) => provider.openBucket === "open_later");
  return [
    {
      key: "all",
      label: "All valid",
      count: providers.length,
      warnedCount: providers.filter((provider) => provider.warningTitle !== null).length,
      summary: "Keep the full visible choice set in view.",
    },
    {
      key: "open_now",
      label: "Open now",
      count: openNow.length,
      warnedCount: openNow.filter((provider) => provider.warningTitle !== null).length,
      summary: "Show current options without hiding warned pharmacies.",
    },
    {
      key: "open_later",
      label: "Open later",
      count: openLater.length,
      warnedCount: openLater.filter((provider) => provider.warningTitle !== null).length,
      summary: "Keep later options visible and explain timing trade-offs.",
    },
  ];
}

function buildPreview(input: {
  pharmacyCaseId: string;
  pageTitle: string;
  pageSummary: string;
  recommendedSummary: string;
  allValidSummary: string;
  mapSummary: string;
  suggestedMapDefault: boolean;
  providers: readonly PharmacyChoiceProviderCardSnapshot[];
  recommendedProviderIds: readonly string[];
  warningProviderIds: readonly string[];
  selectedProviderId: string | null;
  selectedExplanationId: string | null;
  patientOverrideRequired: boolean;
  sessionState: PharmacyChoiceSession["sessionState"];
  projectionState: PharmacyChoiceProjectionState;
  warningAcknowledgement: PharmacyChoiceWarningAcknowledgementSnapshot | null;
  overrideAcknowledgement: PharmacyChoiceOverrideAcknowledgement | null;
  driftRecovery: PharmacyChoiceDriftRecoverySnapshot | null;
  chosenReview: PharmacyChosenProviderReviewSnapshot;
  visibleChoiceSetHash?: string;
  sessionSelectionBindingHash?: string | null;
}): PharmacyChoicePreviewSnapshot {
  const orderedProviderIds = input.providers.map((provider) => provider.providerId);
  const proof = buildProof({
    proofId: `choice_proof_${input.pharmacyCaseId}`,
    directorySnapshotId: `directory_snapshot_${input.pharmacyCaseId}`,
    orderedProviderIds,
    recommendedProviderIds: input.recommendedProviderIds,
    warningProviderIds: input.warningProviderIds,
    fullVisibleProviderCount: input.providers.length,
  });
  const disclosurePolicy = buildDisclosurePolicy({
    policyId: `choice_policy_${input.pharmacyCaseId}`,
    proof,
  });
  const explanations = input.providers.map((provider) =>
    buildExplanation({
      proof,
      providerId: provider.providerId,
      rankOrdinal: provider.rankOrdinal,
      serviceFitClass: provider.groupKey === "recommended" ? 2 : 1,
      timingBand:
        provider.openBucket === "open_now" ? 2 : provider.warningTitle ? 0 : 1,
      recommendationScore:
        provider.groupKey === "recommended"
          ? Math.max(0.85, 1 - provider.rankOrdinal * 0.04)
          : Math.max(0.62, 1 - provider.rankOrdinal * 0.05),
      visibilityDisposition: provider.visibilityDisposition,
      reasonCodeRefs: provider.reasonChips.map((chip) => chip.label.toLowerCase().replace(/\s+/g, "_")),
      patientReasonCueRefs: provider.reasonChips.map((chip) => chip.label),
      staffExplanationRefs: provider.reasonChips.map((chip) => `${provider.providerId}:${chip.label}`),
      warningCopyRef:
        provider.overrideRequirementState === "warned_choice_ack_required"
          ? "warning.manual_route.same_day"
          : provider.warningTitle
            ? "warning.late_option.visible"
            : null,
      overrideRequirementState: provider.overrideRequirementState,
    }),
  );
  const session = buildSession({
    sessionId: `choice_session_${input.pharmacyCaseId}`,
    caseId: input.pharmacyCaseId,
    directorySnapshotId: `directory_snapshot_${input.pharmacyCaseId}`,
    proof,
    disclosurePolicyId: disclosurePolicy.pharmacyChoiceDisclosurePolicyId,
    orderedProviderIds,
    recommendedProviderIds: input.recommendedProviderIds,
    selectedProviderId: input.selectedProviderId,
    selectedExplanationId: input.selectedExplanationId,
    patientOverrideRequired: input.patientOverrideRequired,
    sessionState: input.sessionState,
    visibleChoiceSetHash: input.visibleChoiceSetHash,
    selectionBindingHash: input.sessionSelectionBindingHash,
  });
  const truthProjection = buildTruthProjection({
    projectionId: `choice_truth_${input.pharmacyCaseId}`,
    caseId: input.pharmacyCaseId,
    directorySnapshotId: `directory_snapshot_${input.pharmacyCaseId}`,
    proof,
    disclosurePolicyId: disclosurePolicy.pharmacyChoiceDisclosurePolicyId,
    session,
    orderedProviderIds,
    recommendedProviderIds: input.recommendedProviderIds,
    warningProviderIds: input.warningProviderIds,
    selectedProviderId: input.selectedProviderId,
    selectedExplanationId: input.selectedExplanationId,
    projectionState: input.projectionState,
  });

  return {
    pharmacyCaseId: input.pharmacyCaseId,
    visualMode: PHARMACY_CHOOSER_PREMIUM_VISUAL_MODE,
    pageTitle: input.pageTitle,
    pageSummary: input.pageSummary,
    recommendedSummary: input.recommendedSummary,
    allValidSummary: input.allValidSummary,
    mapSummary: input.mapSummary,
    suggestedMapDefault: input.suggestedMapDefault,
    choiceProof: proof,
    disclosurePolicy,
    choiceSession: session,
    truthProjection,
    explanations,
    overrideAcknowledgement: input.overrideAcknowledgement,
    providerCards: input.providers,
    filterBuckets: filterBuckets(input.providers),
    warningAcknowledgement: input.warningAcknowledgement,
    driftRecovery: input.driftRecovery,
    chosenReview: input.chosenReview,
  };
}

const commonWarningPanel: PharmacyChoiceWarningAcknowledgementSnapshot = {
  title: "This pharmacy needs an extra acknowledgement",
  summary:
    "This option is still valid, but the referral will need a manual handoff and may not move as quickly as the recommended route.",
  checkboxLabel:
    "I understand this pharmacy may use a manual route and could take longer to reach.",
  acknowledgeLabel: "Acknowledge and keep this pharmacy",
  scriptRef: "warn.manual_route.same_day",
  talkingPoints: [
    "The pharmacy remains a valid choice.",
    "The safer or quicker recommendation is still shown above.",
    "The referral may use a manual dispatch route instead of a direct transport path.",
  ],
};

export const pharmacyChoicePreviewCases = [
  buildPreview({
    pharmacyCaseId: "PHC-2048",
    pageTitle: "Choose a pharmacy that works for you",
    pageSummary:
      "Browse the full visible choice set, keep the ranked recommendations in view, and only move forward when the selected pharmacy still matches the current proof.",
    recommendedSummary:
      "Recommended options stay first because they are open now and fit the pathway without extra handling.",
    allValidSummary:
      "All valid pharmacies stay visible even when timing or manual-handoff warnings apply.",
    mapSummary:
      "The map is optional and mirrors the same provider order, group membership, and warning posture as the list.",
    suggestedMapDefault: false,
    providers: [
      providerCard({
        providerId: "provider_A10001",
        providerRef: makeRef("PharmacyProvider", "provider_A10001"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10001"),
        rankOrdinal: 1,
        displayName: "Riverside Pharmacy",
        groupKey: "recommended",
        visibilityDisposition: "recommended_visible",
        overrideRequirementState: "none",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 6:00pm",
        distanceLabel: "0.6 miles",
        travelLabel: "8 min walk",
        consultationLabel: "In person or video",
        accessLabel: "Step-free and hearing loop",
        warningTitle: null,
        warningSummary: null,
        reasonChips: [
          { label: "Open now", tone: "recommendation" },
          { label: "Fastest direct route", tone: "recommendation" },
          { label: "Step-free", tone: "guidance" },
        ],
        mapPoint: { xPercent: 38, yPercent: 48, areaLabel: "Riverside Walk" },
      }),
      providerCard({
        providerId: "provider_A10002",
        providerRef: makeRef("PharmacyProvider", "provider_A10002"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10002"),
        rankOrdinal: 2,
        displayName: "Market Square Pharmacy",
        groupKey: "all_valid",
        visibilityDisposition: "visible_with_warning",
        overrideRequirementState: "warned_choice_ack_required",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 6:30pm",
        distanceLabel: "0.7 miles",
        travelLabel: "9 min walk",
        consultationLabel: "In person or telephone",
        accessLabel: "Quiet room and step-free",
        warningTitle: "Manual handoff warning",
        warningSummary:
          "Still valid, but this option uses a manual dispatch route and needs acknowledgement before consent can continue.",
        reasonChips: [
          { label: "Open now", tone: "guidance" },
          { label: "Manual route", tone: "warning" },
          { label: "Quiet room", tone: "neutral" },
        ],
        mapPoint: { xPercent: 58, yPercent: 42, areaLabel: "Market Square" },
      }),
      providerCard({
        providerId: "provider_A10003",
        providerRef: makeRef("PharmacyProvider", "provider_A10003"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10003"),
        rankOrdinal: 3,
        displayName: "Hilltop Pharmacy",
        groupKey: "all_valid",
        visibilityDisposition: "visible_with_warning",
        overrideRequirementState: "none",
        openingState: "opens_later_today",
        openBucket: "open_later",
        openingLabel: "Opens later today",
        nextContactLabel: "Opens at 5:00pm",
        distanceLabel: "1.0 miles",
        travelLabel: "12 min walk",
        consultationLabel: "In person",
        accessLabel: "Wheelchair access",
        warningTitle: "Later availability",
        warningSummary:
          "Visible because it is still valid, but the timing is later than the recommended frontier.",
        reasonChips: [
          { label: "Opens later", tone: "warning" },
          { label: "Longer wait", tone: "urgent" },
          { label: "Wheelchair access", tone: "guidance" },
        ],
        mapPoint: { xPercent: 75, yPercent: 26, areaLabel: "Hilltop Rise" },
      }),
    ],
    recommendedProviderIds: ["provider_A10001"],
    warningProviderIds: ["provider_A10002", "provider_A10003"],
    selectedProviderId: null,
    selectedExplanationId: null,
    patientOverrideRequired: false,
    sessionState: "choosing",
    projectionState: "choosing",
    warningAcknowledgement: commonWarningPanel,
    overrideAcknowledgement: null,
    driftRecovery: null,
    chosenReview: {
      reviewTitle: "Current choice",
      reviewSummary:
        "No pharmacy is locked in yet. Select one option, then continue in the same shell.",
      changeActionLabel: "Change pharmacy",
      noSelectionLabel: "No pharmacy chosen yet",
    },
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2148",
    pageTitle: "Review this warned pharmacy choice",
    pageSummary:
      "The full choice set is still visible, but this selected pharmacy needs an explicit acknowledgement before consent can advance.",
    recommendedSummary:
      "Recommended options are still visible if you want to switch to a lower-friction route.",
    allValidSummary:
      "Valid options stay visible below so changing pharmacy does not require leaving the shell.",
    mapSummary:
      "Map and list stay synchronized while the current selection and warning state remain visible.",
    suggestedMapDefault: false,
    providers: [
      providerCard({
        providerId: "provider_A10001",
        providerRef: makeRef("PharmacyProvider", "provider_A10001"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10001"),
        rankOrdinal: 1,
        displayName: "Riverside Pharmacy",
        groupKey: "recommended",
        visibilityDisposition: "recommended_visible",
        overrideRequirementState: "none",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 6:00pm",
        distanceLabel: "0.6 miles",
        travelLabel: "8 min walk",
        consultationLabel: "In person or video",
        accessLabel: "Step-free and hearing loop",
        warningTitle: null,
        warningSummary: null,
        reasonChips: [
          { label: "Open now", tone: "recommendation" },
          { label: "Fastest direct route", tone: "recommendation" },
          { label: "Step-free", tone: "guidance" },
        ],
        mapPoint: { xPercent: 38, yPercent: 48, areaLabel: "Riverside Walk" },
      }),
      providerCard({
        providerId: "provider_A10002",
        providerRef: makeRef("PharmacyProvider", "provider_A10002"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10002"),
        rankOrdinal: 2,
        displayName: "Market Square Pharmacy",
        groupKey: "all_valid",
        visibilityDisposition: "visible_with_warning",
        overrideRequirementState: "warned_choice_ack_required",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 6:30pm",
        distanceLabel: "0.7 miles",
        travelLabel: "9 min walk",
        consultationLabel: "In person or telephone",
        accessLabel: "Quiet room and step-free",
        warningTitle: "Manual handoff warning",
        warningSummary:
          "This selected pharmacy needs an acknowledgement before the consent checkpoint can continue.",
        reasonChips: [
          { label: "Open now", tone: "guidance" },
          { label: "Manual route", tone: "warning" },
          { label: "Chosen", tone: "neutral" },
        ],
        mapPoint: { xPercent: 58, yPercent: 42, areaLabel: "Market Square" },
      }),
      providerCard({
        providerId: "provider_A10003",
        providerRef: makeRef("PharmacyProvider", "provider_A10003"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10003"),
        rankOrdinal: 3,
        displayName: "Hilltop Pharmacy",
        groupKey: "all_valid",
        visibilityDisposition: "visible_with_warning",
        overrideRequirementState: "none",
        openingState: "opens_later_today",
        openBucket: "open_later",
        openingLabel: "Opens later today",
        nextContactLabel: "Opens at 5:00pm",
        distanceLabel: "1.0 miles",
        travelLabel: "12 min walk",
        consultationLabel: "In person",
        accessLabel: "Wheelchair access",
        warningTitle: "Later availability",
        warningSummary: "Visible, but later than the recommended option.",
        reasonChips: [
          { label: "Opens later", tone: "warning" },
          { label: "Longer wait", tone: "urgent" },
          { label: "Wheelchair access", tone: "guidance" },
        ],
        mapPoint: { xPercent: 75, yPercent: 26, areaLabel: "Hilltop Rise" },
      }),
    ],
    recommendedProviderIds: ["provider_A10001"],
    warningProviderIds: ["provider_A10002", "provider_A10003"],
    selectedProviderId: "provider_A10002",
    selectedExplanationId: "choice_expl_provider_A10002",
    patientOverrideRequired: true,
    sessionState: "selected_waiting_consent",
    projectionState: "selected_waiting_consent",
    warningAcknowledgement: commonWarningPanel,
    overrideAcknowledgement: null,
    driftRecovery: null,
    chosenReview: {
      reviewTitle: "Chosen pharmacy",
      reviewSummary:
        "You can keep this selection, acknowledge the warning in place, or change to another valid pharmacy without leaving the shell.",
      changeActionLabel: "Change pharmacy",
      noSelectionLabel: "No pharmacy chosen yet",
    },
    sessionSelectionBindingHash: stableHash("PHC-2148::provider_A10002::binding"),
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2156",
    pageTitle: "Review the updated pharmacy list",
    pageSummary:
      "The choice proof changed since the earlier selection. The previous pharmacy stays visible as read-only provenance while you choose a current option from the refreshed list.",
    recommendedSummary:
      "The recommended frontier changed after the proof refresh, so the current safest options are shown first.",
    allValidSummary:
      "All still-valid options remain visible. The older selection is preserved as provenance rather than silently carried forward.",
    mapSummary:
      "The refreshed map follows the same current order and excludes the superseded selection from the active set.",
    suggestedMapDefault: true,
    providers: [
      providerCard({
        providerId: "provider_A10005",
        providerRef: makeRef("PharmacyProvider", "provider_A10005"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10005"),
        rankOrdinal: 1,
        displayName: "Canal View Pharmacy",
        groupKey: "recommended",
        visibilityDisposition: "recommended_visible",
        overrideRequirementState: "none",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 7:00pm",
        distanceLabel: "0.5 miles",
        travelLabel: "7 min walk",
        consultationLabel: "In person or video",
        accessLabel: "Step-free and quiet room",
        warningTitle: null,
        warningSummary: null,
        reasonChips: [
          { label: "Open now", tone: "recommendation" },
          { label: "New fastest route", tone: "recommendation" },
          { label: "Step-free", tone: "guidance" },
        ],
        mapPoint: { xPercent: 32, yPercent: 50, areaLabel: "Canal View" },
      }),
      providerCard({
        providerId: "provider_A10001",
        providerRef: makeRef("PharmacyProvider", "provider_A10001"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10001"),
        rankOrdinal: 2,
        displayName: "Riverside Pharmacy",
        groupKey: "all_valid",
        visibilityDisposition: "visible_with_warning",
        overrideRequirementState: "none",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 6:00pm",
        distanceLabel: "0.6 miles",
        travelLabel: "8 min walk",
        consultationLabel: "In person or video",
        accessLabel: "Step-free and hearing loop",
        warningTitle: "Recommendation changed",
        warningSummary:
          "Still valid, but the refreshed proof moved another pharmacy ahead for this pathway and timing band.",
        reasonChips: [
          { label: "Open now", tone: "guidance" },
          { label: "Recommendation changed", tone: "warning" },
          { label: "Hearing loop", tone: "neutral" },
        ],
        mapPoint: { xPercent: 52, yPercent: 44, areaLabel: "Riverside Walk" },
      }),
      providerCard({
        providerId: "provider_A10002",
        providerRef: makeRef("PharmacyProvider", "provider_A10002"),
        explanationRef: makeRef("PharmacyChoiceExplanation", "choice_expl_provider_A10002"),
        rankOrdinal: 3,
        displayName: "Market Square Pharmacy",
        groupKey: "all_valid",
        visibilityDisposition: "visible_with_warning",
        overrideRequirementState: "warned_choice_ack_required",
        openingState: "open_now",
        openBucket: "open_now",
        openingLabel: "Open now",
        nextContactLabel: "Open until 6:30pm",
        distanceLabel: "0.7 miles",
        travelLabel: "9 min walk",
        consultationLabel: "In person or telephone",
        accessLabel: "Quiet room and step-free",
        warningTitle: "Manual handoff warning",
        warningSummary:
          "Still valid, but needs explicit acknowledgement if you pick it after the refresh.",
        reasonChips: [
          { label: "Open now", tone: "guidance" },
          { label: "Manual route", tone: "warning" },
          { label: "Still valid", tone: "neutral" },
        ],
        mapPoint: { xPercent: 72, yPercent: 30, areaLabel: "Market Square" },
      }),
    ],
    recommendedProviderIds: ["provider_A10005"],
    warningProviderIds: ["provider_A10001", "provider_A10002"],
    selectedProviderId: null,
    selectedExplanationId: null,
    patientOverrideRequired: false,
    sessionState: "superseded",
    projectionState: "recovery_required",
    warningAcknowledgement: commonWarningPanel,
    overrideAcknowledgement: null,
    driftRecovery: {
      state: "visible_choice_set_changed",
      title: "The pharmacy list changed",
      summary:
        "Hilltop Pharmacy is preserved as your earlier choice, but it is no longer in the current visible set. Choose a current option before you continue.",
      previousVisibleChoiceSetHash: stableHash(
        ["provider_A10001", "provider_A10002", "provider_A10003"].join("|"),
      ),
      currentVisibleChoiceSetHash: stableHash(
        ["provider_A10005", "provider_A10001", "provider_A10002"].join("|"),
      ),
      previousSelectionProviderId: "provider_A10003",
      previousSelectionLabel: "Hilltop Pharmacy",
      previousSelectionSummary:
        "Previously chosen when it was still part of the visible proof. It is now held as read-only provenance.",
      actionLabel: "Review the updated pharmacies",
      requiresSafeReselection: true,
    },
    chosenReview: {
      reviewTitle: "Previous choice preserved",
      reviewSummary:
        "The earlier selection is still visible as provenance, but it cannot advance until you choose a pharmacy from the current proof.",
      changeActionLabel: "Choose a current pharmacy",
      noSelectionLabel: "No current pharmacy selected",
    },
    visibleChoiceSetHash: stableHash(
      ["provider_A10005", "provider_A10001", "provider_A10002"].join("|"),
    ),
  }),
] as const satisfies readonly PharmacyChoicePreviewSnapshot[];

const pharmacyChoicePreviewCaseMap = new Map(
  pharmacyChoicePreviewCases.map((preview) => [preview.pharmacyCaseId, preview] as const),
);

export function resolvePharmacyChoicePreview(
  pharmacyCaseId: string | null | undefined,
): PharmacyChoicePreviewSnapshot | null {
  const preview = pharmacyChoicePreviewCaseMap.get(pharmacyCaseId ?? "");
  return preview ? structuredClone(preview) : null;
}
