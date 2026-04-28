import type { AggregateRef } from "./phase6-pharmacy-case-kernel";
import type { PharmacyPatientMacroState } from "./phase6-pharmacy-eligibility-engine";
import type {
  PharmacyOutcomeTruthProjectionSnapshot,
  PharmacyPatientProviderSummarySnapshot,
  PharmacyPatientReachabilityRepairProjectionSnapshot,
  PharmacyPatientReferralReferenceSummarySnapshot,
  PharmacyPatientStatusProjectionSnapshot,
  PharmacyPatientInstructionPanelSnapshot,
} from "./phase6-pharmacy-patient-status-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;
const TASK_351 =
  "par_351_phase6_track_backend_build_patient_instruction_generation_and_referral_status_projections" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task344 = typeof TASK_344;
type Task351 = typeof TASK_351;

export const PHARMACY_PATIENT_STATUS_VISUAL_MODE = "Pharmacy_Patient_Status";

export type PharmacyPatientStatusSurfaceState =
  | "dispatch_pending"
  | "referral_confirmed"
  | "contact_repair"
  | "review_next_steps"
  | "completed"
  | "urgent_action";

export type PharmacyOpeningStateChipTone = "open" | "closed" | "watch" | "complete";

export interface PharmacyOpeningStateChipSnapshot {
  label: string;
  tone: PharmacyOpeningStateChipTone;
  detail: string;
}

export interface PatientPharmacyChosenAnchorSnapshot {
  requestLineageLabel: string;
  providerLabel: string;
  providerSummary: string;
  preservedSelectionLabel: string | null;
  continuityKey: string;
  audienceLabel: string;
  anchorState: "current" | "read_only" | "stale";
  chips: readonly string[];
}

export interface PharmacyContactCardSnapshot {
  title: string;
  summary: string;
  providerLabel: string;
  openingState: PharmacyOpeningStateChipSnapshot;
  consultationModes: readonly string[];
  contactEndpoints: readonly string[];
  reasonCues: readonly string[];
}

export interface PharmacyReferralReferenceCardSnapshot {
  title: string;
  summary: string;
  displayMode: "available" | "pending" | "suppressed";
  referenceLabel: string | null;
  referenceHashLabel: string | null;
  keepNote: string | null;
}

export interface PharmacyStatusTrackerStepSnapshot {
  stepId: string;
  label: string;
  state: "complete" | "current" | "pending" | "attention";
  summary: string;
  detail: string;
}

export interface PharmacyStatusTrackerSnapshot {
  title: string;
  summary: string;
  steps: readonly PharmacyStatusTrackerStepSnapshot[];
}

export interface ChosenPharmacyConfirmationPageSnapshot {
  title: string;
  summary: string;
  panelText: string;
  nextLabel: string;
}

export interface PharmacyNextStepPageSnapshot {
  title: string;
  summary: string;
  whoOrWhereText: string | null;
  whenExpectationText: string | null;
  symptomsWorsenText: string;
  warningText: string | null;
}

export interface PharmacyOutcomePageSnapshot {
  title: string;
  summary: string;
  calmCompletionText: string | null;
  warningText: string | null;
}

export interface PharmacyReviewNextStepPageSnapshot {
  title: string;
  summary: string;
  reviewText: string;
  warningText: string | null;
  tone: "review" | "urgent";
  announcementRole: "status" | "alert";
}

export interface PharmacyContactRouteRepairStateSnapshot {
  title: string;
  summary: string;
  detail: string;
  actionLabel: string;
  announcementRole: "alert";
}

export interface PharmacyPatientStatusPreviewSnapshot {
  pharmacyCaseId: string;
  visualMode: typeof PHARMACY_PATIENT_STATUS_VISUAL_MODE;
  surfaceState: PharmacyPatientStatusSurfaceState;
  statusProjection: PharmacyPatientStatusProjectionSnapshot;
  providerSummary: PharmacyPatientProviderSummarySnapshot | null;
  referralReferenceSummary: PharmacyPatientReferralReferenceSummarySnapshot | null;
  repairProjection: PharmacyPatientReachabilityRepairProjectionSnapshot | null;
  instructionPanel: PharmacyPatientInstructionPanelSnapshot;
  outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot;
  chosenPharmacyAnchor: PatientPharmacyChosenAnchorSnapshot;
  contactCard: PharmacyContactCardSnapshot | null;
  referralReferenceCard: PharmacyReferralReferenceCardSnapshot | null;
  statusTracker: PharmacyStatusTrackerSnapshot;
  confirmationPage: ChosenPharmacyConfirmationPageSnapshot | null;
  nextStepPage: PharmacyNextStepPageSnapshot | null;
  outcomePage: PharmacyOutcomePageSnapshot | null;
  reviewNextStepPage: PharmacyReviewNextStepPageSnapshot | null;
  contactRouteRepairState: PharmacyContactRouteRepairStateSnapshot | null;
  primaryActionLabel: string;
  primaryActionRoute: "choose" | "instructions" | "status";
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `php_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return { targetFamily, refId, ownerTask };
}

function makeCaseRef(refId: string): AggregateRef<"PharmacyCase", Task342> {
  return makeRef("PharmacyCase", refId, TASK_342);
}

function makeProviderRef(refId: string): AggregateRef<"PharmacyProvider", Task343> {
  return makeRef("PharmacyProvider", refId, TASK_343);
}

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function openingTone(label: string): PharmacyOpeningStateChipTone {
  if (/closed/i.test(label)) {
    return "closed";
  }
  if (/review|reply|pending/i.test(label)) {
    return "watch";
  }
  if (/recorded|complete/i.test(label)) {
    return "complete";
  }
  return "open";
}

interface PreviewSeedConfig {
  pharmacyCaseId: string;
  providerId: string | null;
  providerLabel: string;
  providerSummary: string;
  requestLineageLabel: string;
  continuityKey: string;
  anchorState: "current" | "read_only" | "stale";
  preservedSelectionLabel: string | null;
  openingLabel: string | null;
  openingDetail: string | null;
  consultationModes: readonly string[];
  contactEndpoints: readonly string[];
  reasonCues: readonly string[];
  referenceMode: "available" | "pending" | "suppressed";
  referenceLabel: string | null;
  referenceHashLabel: string | null;
  keepNote: string | null;
  macroState: PharmacyPatientMacroState;
  surfaceState: PharmacyPatientStatusSurfaceState;
  staleOrBlockedPosture: PharmacyPatientStatusProjectionSnapshot["staleOrBlockedPosture"];
  calmCopyAllowed: boolean;
  outcomeTruthState: PharmacyOutcomeTruthProjectionSnapshot["outcomeTruthState"];
  patientVisibilityState: PharmacyOutcomeTruthProjectionSnapshot["patientVisibilityState"];
  closeEligibilityState: PharmacyOutcomeTruthProjectionSnapshot["closeEligibilityState"];
  resolutionClass: string | null;
  dominantBrokenDependency: PharmacyPatientReachabilityRepairProjectionSnapshot["dominantBrokenDependency"];
  repairProjectionState: PharmacyPatientReachabilityRepairProjectionSnapshot["repairProjectionState"];
  nextRepairAction: PharmacyPatientReachabilityRepairProjectionSnapshot["nextRepairAction"];
  headlineText: string;
  nextStepText: string;
  whoOrWhereText: string | null;
  whenExpectationText: string | null;
  symptomsWorsenText: string;
  warningText: string | null;
  reviewText: string | null;
  calmCompletionText: string | null;
  confirmationPage: ChosenPharmacyConfirmationPageSnapshot | null;
  nextStepPage: PharmacyNextStepPageSnapshot | null;
  outcomePage: PharmacyOutcomePageSnapshot | null;
  reviewNextStepPage: PharmacyReviewNextStepPageSnapshot | null;
  contactRouteRepairState: PharmacyContactRouteRepairStateSnapshot | null;
  statusTracker: PharmacyStatusTrackerSnapshot;
  primaryActionLabel: string;
  primaryActionRoute: "choose" | "instructions" | "status";
}

function buildPreview(config: PreviewSeedConfig): PharmacyPatientStatusPreviewSnapshot {
  const providerSummary: PharmacyPatientProviderSummarySnapshot | null =
    config.providerId === null
      ? null
      : {
          pharmacyPatientProviderSummaryId: `pharmacy_patient_provider_summary_${config.pharmacyCaseId}`,
          pharmacyCaseRef: makeCaseRef(config.pharmacyCaseId),
          providerRef: makeProviderRef(config.providerId),
          detailVisibilityState:
            config.anchorState === "stale" ? "provenance_only" : "full",
          providerDisplayName: config.providerLabel,
          openingState: config.openingLabel,
          consultationModeHints: [...config.consultationModes],
          contactEndpoints: [...config.contactEndpoints],
          patientReasonCueRefs: [...config.reasonCues],
          warningCopyRef:
            config.warningText === null
              ? null
              : `phase6_pharmacy_patient_copy_v1.warning.${stableHash(config.warningText)}`,
          selectedAnchorRef: config.providerLabel,
          computedAt: "2026-04-24T11:42:00.000Z",
          version: 1,
        };

  const referralReferenceSummary: PharmacyPatientReferralReferenceSummarySnapshot | null = {
    pharmacyPatientReferralReferenceSummaryId: `pharmacy_patient_reference_${config.pharmacyCaseId}`,
    pharmacyCaseRef: makeCaseRef(config.pharmacyCaseId),
    dispatchTruthProjectionRef: null,
    correlationRecordRef: null,
    displayMode: config.referenceMode,
    displayReference: config.referenceMode === "available" ? config.referenceLabel : null,
    outboundReferenceSetHash: config.referenceHashLabel,
    selectedAnchorRef: config.providerLabel,
    computedAt: "2026-04-24T11:43:00.000Z",
    version: 1,
  };

  const repairProjection: PharmacyPatientReachabilityRepairProjectionSnapshot | null =
    config.dominantBrokenDependency === "none" &&
    config.repairProjectionState === "not_required"
      ? null
      : {
          pharmacyPatientReachabilityRepairProjectionId: `pharmacy_patient_repair_${config.pharmacyCaseId}`,
          pharmacyCaseRef: makeCaseRef(config.pharmacyCaseId),
          dominantBrokenDependency: config.dominantBrokenDependency,
          reachabilityDependencyRef:
            config.dominantBrokenDependency === "none"
              ? null
              : `reachability_dependency_${config.pharmacyCaseId}`,
          currentContactRouteSnapshotRef:
            config.dominantBrokenDependency === "none"
              ? null
              : `contact_route_snapshot_${config.pharmacyCaseId}`,
          currentReachabilityAssessmentRef:
            config.dominantBrokenDependency === "none"
              ? null
              : `reachability_assessment_${config.pharmacyCaseId}`,
          contactRepairJourneyRef:
            config.repairProjectionState === "not_required"
              ? null
              : `contact_repair_journey_${config.pharmacyCaseId}`,
          selectedProviderSummaryRef:
            providerSummary === null
              ? null
              : makeRef(
                  "PharmacyPatientProviderSummary",
                  providerSummary.pharmacyPatientProviderSummaryId,
                  TASK_351,
                ),
          referralReferenceSummaryRef: makeRef(
            "PharmacyPatientReferralReferenceSummary",
            referralReferenceSummary.pharmacyPatientReferralReferenceSummaryId,
            TASK_351,
          ),
          referralAnchorRef: config.providerLabel,
          resumeContinuationRef:
            config.repairProjectionState === "rebound_pending"
              ? `resume_continuation_${config.pharmacyCaseId}`
              : null,
          selectedAnchorRef: config.providerLabel,
          governingStatusTruthRevision: stableHash(
            `${config.pharmacyCaseId}::${config.surfaceState}::repair`,
          ),
          nextRepairAction: config.nextRepairAction,
          repairProjectionState: config.repairProjectionState,
          computedAt: "2026-04-24T11:44:00.000Z",
          version: 1,
        };

  const outcomeTruth: PharmacyOutcomeTruthProjectionSnapshot = {
    pharmacyOutcomeTruthProjectionId: `pharmacy_outcome_truth_${config.pharmacyCaseId}`,
    pharmacyCaseId: config.pharmacyCaseId,
    latestOutcomeSettlementRef:
      config.outcomeTruthState === "settled_resolved"
        ? `outcome_settlement_${config.pharmacyCaseId}`
        : null,
    latestOutcomeRecordRef:
      config.outcomeTruthState === "waiting_for_outcome"
        ? null
        : `outcome_record_${config.pharmacyCaseId}`,
    latestIngestAttemptRef:
      config.outcomeTruthState === "waiting_for_outcome"
        ? null
        : `outcome_ingest_${config.pharmacyCaseId}`,
    outcomeReconciliationGateRef:
      config.outcomeTruthState === "review_required" ||
      config.outcomeTruthState === "reopened_for_safety"
        ? `outcome_gate_${config.pharmacyCaseId}`
        : null,
    outcomeTruthState: config.outcomeTruthState,
    resolutionClass: config.resolutionClass,
    matchConfidenceBand:
      config.outcomeTruthState === "review_required" ||
      config.outcomeTruthState === "reopened_for_safety"
        ? "medium"
        : "high",
    contradictionScore:
      config.outcomeTruthState === "review_required" ||
      config.outcomeTruthState === "reopened_for_safety"
        ? 0.42
        : 0,
    manualReviewState:
      config.outcomeTruthState === "review_required" ||
      config.outcomeTruthState === "reopened_for_safety"
        ? "required"
        : null,
    closeEligibilityState: config.closeEligibilityState,
    patientVisibilityState: config.patientVisibilityState,
    continuityEvidenceRef: `patient_continuity_${config.pharmacyCaseId}`,
    audienceMessageRef: `patient_message_${config.pharmacyCaseId}`,
    computedAt: "2026-04-24T11:45:00.000Z",
    version: 1,
  };

  const statusProjection: PharmacyPatientStatusProjectionSnapshot = {
    pharmacyPatientStatusProjectionId: `pharmacy_patient_status_${config.pharmacyCaseId}`,
    pharmacyCaseRef: makeCaseRef(config.pharmacyCaseId),
    selectedProviderRef: config.providerId === null ? null : makeProviderRef(config.providerId),
    dispatchTruthProjectionRef: null,
    outcomeTruthProjectionRef: makeRef(
      "PharmacyOutcomeTruthProjection",
      outcomeTruth.pharmacyOutcomeTruthProjectionId,
      TASK_343,
    ),
    bounceBackRecordRef:
      config.surfaceState === "urgent_action"
        ? makeRef("PharmacyBounceBackRecord", `bounce_back_${config.pharmacyCaseId}`, TASK_344)
        : null,
    reachabilityPlanRef:
      repairProjection === null
        ? null
        : makeRef("PharmacyReachabilityPlan", `reachability_plan_${config.pharmacyCaseId}`, TASK_344),
    currentMacroState: config.macroState,
    nextSafeActionCopyRef: `phase6_pharmacy_patient_copy_v1.next.${stableHash(config.nextStepText)}`,
    warningCopyRef:
      config.warningText === null
        ? null
        : `phase6_pharmacy_patient_copy_v1.warning.${stableHash(config.warningText)}`,
    reviewCopyRef:
      config.reviewText === null
        ? null
        : `phase6_pharmacy_patient_copy_v1.review.${stableHash(config.reviewText)}`,
    continuityEvidenceRef: `patient_continuity_${config.pharmacyCaseId}`,
    staleOrBlockedPosture: config.staleOrBlockedPosture,
    dominantReachabilityDependencyRef:
      repairProjection?.reachabilityDependencyRef ?? null,
    lastMeaningfulEventAt: "2026-04-24T11:46:00.000Z",
    calmCopyAllowed: config.calmCopyAllowed,
    currentClosureBlockerRefs:
      config.outcomeTruthState === "settled_resolved" ? [] : ["outcome_pending"],
    currentIdentityRepairDispositionRef: null,
    audienceMessageRef: outcomeTruth.audienceMessageRef,
    computedAt: "2026-04-24T11:46:00.000Z",
    version: 1,
  };

  const instructionPanel: PharmacyPatientInstructionPanelSnapshot = {
    pharmacyPatientInstructionPanelId: `pharmacy_patient_instruction_${config.pharmacyCaseId}`,
    pharmacyCaseRef: makeCaseRef(config.pharmacyCaseId),
    patientStatusProjectionRef: makeRef(
      "PharmacyPatientStatusProjection",
      statusProjection.pharmacyPatientStatusProjectionId,
      TASK_351,
    ),
    providerSummaryRef:
      providerSummary === null
        ? null
        : makeRef(
            "PharmacyPatientProviderSummary",
            providerSummary.pharmacyPatientProviderSummaryId,
            TASK_351,
          ),
    repairProjectionRef:
      repairProjection === null
        ? null
        : makeRef(
            "PharmacyPatientReachabilityRepairProjection",
            repairProjection.pharmacyPatientReachabilityRepairProjectionId,
            TASK_351,
          ),
    referralReferenceSummaryRef: makeRef(
      "PharmacyPatientReferralReferenceSummary",
      referralReferenceSummary.pharmacyPatientReferralReferenceSummaryId,
      TASK_351,
    ),
    contentGrammarVersionRef: "phase6_pharmacy_patient_copy_v1",
    macroState: config.macroState,
    headlineCopyRef: `phase6_pharmacy_patient_copy_v1.headline.${stableHash(config.headlineText)}`,
    headlineText: config.headlineText,
    nextStepCopyRef: statusProjection.nextSafeActionCopyRef,
    nextStepText: config.nextStepText,
    whoOrWhereCopyRef:
      config.whoOrWhereText === null
        ? null
        : `phase6_pharmacy_patient_copy_v1.where.${stableHash(config.whoOrWhereText)}`,
    whoOrWhereText: config.whoOrWhereText,
    whenExpectationCopyRef:
      config.whenExpectationText === null
        ? null
        : `phase6_pharmacy_patient_copy_v1.when.${stableHash(config.whenExpectationText)}`,
    whenExpectationText: config.whenExpectationText,
    symptomsWorsenCopyRef: `phase6_pharmacy_patient_copy_v1.worsen.${stableHash(config.symptomsWorsenText)}`,
    symptomsWorsenText: config.symptomsWorsenText,
    warningCopyRef: statusProjection.warningCopyRef,
    warningText: config.warningText,
    reviewCopyRef: statusProjection.reviewCopyRef,
    reviewText: config.reviewText,
    calmCompletionCopyRef:
      config.calmCompletionText === null
        ? null
        : `phase6_pharmacy_patient_copy_v1.calm.${stableHash(config.calmCompletionText)}`,
    calmCompletionText: config.calmCompletionText,
    generatedAt: "2026-04-24T11:47:00.000Z",
    version: 1,
  };

  const contactCard: PharmacyContactCardSnapshot | null =
    providerSummary === null || config.openingLabel === null
      ? null
      : {
          title: "Chosen pharmacy",
          summary:
            config.surfaceState === "completed"
              ? "These are the pharmacy details held with the completed referral."
              : "These are the current details for the chosen pharmacy.",
          providerLabel: config.providerLabel,
          openingState: {
            label: config.openingLabel,
            tone: openingTone(config.openingLabel),
            detail: config.openingDetail ?? "Opening information held with the current referral.",
          },
          consultationModes: [...config.consultationModes],
          contactEndpoints: [...config.contactEndpoints],
          reasonCues: [...config.reasonCues],
        };

  const referralReferenceCard: PharmacyReferralReferenceCardSnapshot | null = {
    title: "Referral reference",
    summary:
      config.referenceMode === "available"
        ? "Keep this reference in case the pharmacy or your practice asks for it."
        : config.referenceMode === "pending"
          ? "We are still preparing the reference for this pharmacy referral."
          : "We are not showing the referral reference right now.",
    displayMode: config.referenceMode,
    referenceLabel: config.referenceMode === "available" ? config.referenceLabel : null,
    referenceHashLabel: config.referenceHashLabel,
    keepNote: config.keepNote,
  };

  return {
    pharmacyCaseId: config.pharmacyCaseId,
    visualMode: PHARMACY_PATIENT_STATUS_VISUAL_MODE,
    surfaceState: config.surfaceState,
    statusProjection,
    providerSummary,
    referralReferenceSummary,
    repairProjection,
    instructionPanel,
    outcomeTruth,
    chosenPharmacyAnchor: {
      requestLineageLabel: config.requestLineageLabel,
      providerLabel: config.providerLabel,
      providerSummary: config.providerSummary,
      preservedSelectionLabel: config.preservedSelectionLabel,
      continuityKey: config.continuityKey,
      audienceLabel: "Chosen pharmacy",
      anchorState: config.anchorState,
      chips: [
        titleCase(config.surfaceState),
        config.referenceMode === "available" ? "Reference available" : titleCase(config.referenceMode),
      ],
    },
    contactCard,
    referralReferenceCard,
    statusTracker: config.statusTracker,
    confirmationPage: config.confirmationPage,
    nextStepPage: config.nextStepPage,
    outcomePage: config.outcomePage,
    reviewNextStepPage: config.reviewNextStepPage,
    contactRouteRepairState: config.contactRouteRepairState,
    primaryActionLabel: config.primaryActionLabel,
    primaryActionRoute: config.primaryActionRoute,
  };
}

export const pharmacyPatientStatusPreviewCases = [
  buildPreview({
    pharmacyCaseId: "PHC-2057",
    providerId: "provider_harbour_pending",
    providerLabel: "Harbour Pharmacy Group",
    providerSummary:
      "The chosen pharmacy is still current, but the referral proof is still converging so the page stays explicit about what is pending.",
    requestLineageLabel: "Acute cough pathway / lineage 2057",
    continuityKey: "pharmacy.patient::PHC-2057::harbour",
    anchorState: "current",
    preservedSelectionLabel: null,
    openingLabel: "Opening details held for this referral",
    openingDetail: "Use the details below only if the pharmacy asks you to get in touch.",
    consultationModes: ["Phone", "Video", "In person"],
    contactEndpoints: [
      "Call 020 7946 2057",
      "Visit 12 Harbour Parade, London SE1",
      "Video consultation if the pharmacist offers one",
    ],
    reasonCues: [
      "You do not need to arrange anything else yet.",
      "We will keep this page updated with the next safe step.",
    ],
    referenceMode: "pending",
    referenceLabel: null,
    referenceHashLabel: "REFSET-PENDING-2057",
    keepNote: null,
    macroState: "action_in_progress",
    surfaceState: "dispatch_pending",
    staleOrBlockedPosture: "stale",
    calmCopyAllowed: false,
    outcomeTruthState: "waiting_for_outcome",
    patientVisibilityState: "hidden",
    closeEligibilityState: "not_closable",
    resolutionClass: null,
    dominantBrokenDependency: "none",
    repairProjectionState: "not_required",
    nextRepairAction: "none",
    headlineText: "Your pharmacy referral is still being confirmed.",
    nextStepText: "Keep this page available while we finish the handoff to Harbour Pharmacy Group.",
    whoOrWhereText:
      "Harbour Pharmacy Group remains your chosen pharmacy for this referral.",
    whenExpectationText:
      "You do not need to call them yet unless the pharmacy or your practice asks you to.",
    symptomsWorsenText:
      "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice.",
    warningText:
      "This page does not show a final confirmation yet because the referral proof is still pending.",
    reviewText: null,
    calmCompletionText: null,
    confirmationPage: null,
    nextStepPage: {
      title: "What happens next",
      summary: "We are still confirming the referral handoff for the chosen pharmacy.",
      whoOrWhereText:
        "You do not need to arrange anything else yet. We will show the next safe update here.",
      whenExpectationText:
        "Check this page again later if you have not heard from the pharmacy.",
      symptomsWorsenText:
        "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice.",
      warningText:
        "We are not showing calm completion wording while the referral proof is still pending.",
    },
    outcomePage: null,
    reviewNextStepPage: null,
    contactRouteRepairState: null,
    statusTracker: {
      title: "Referral status",
      summary: "The chosen pharmacy is current, but the referral proof is still pending.",
      steps: [
        {
          stepId: "chosen_pharmacy",
          label: "Chosen pharmacy",
          state: "complete",
          summary: "Harbour Pharmacy Group is still the current pharmacy.",
          detail: "The chosen provider anchor remains stable while the referral proof catches up.",
        },
        {
          stepId: "handoff_pending",
          label: "Referral handoff",
          state: "current",
          summary: "The handoff is still being confirmed.",
          detail: "This page stays explicit about what is pending and does not overstate completion.",
        },
        {
          stepId: "pharmacy_review",
          label: "Pharmacy review",
          state: "pending",
          summary: "The pharmacy review step starts after the handoff is confirmed.",
          detail: "We will show that next step here when it is ready.",
        },
        {
          stepId: "outcome",
          label: "Outcome recorded",
          state: "pending",
          summary: "No pharmacy outcome is recorded yet.",
          detail: "Outcome calmness stays blocked until the pharmacy route is fully settled.",
        },
      ],
    },
    primaryActionLabel: "Check status",
    primaryActionRoute: "status",
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2184",
    providerId: "provider_cedar_2184",
    providerLabel: "Cedar Pharmacy",
    providerSummary:
      "The referral has been sent to the chosen pharmacy, and this page keeps the next step, contact details, and reference in one place.",
    requestLineageLabel: "Same-day sore throat referral / lineage 2184",
    continuityKey: "pharmacy.patient::PHC-2184::cedar",
    anchorState: "current",
    preservedSelectionLabel: null,
    openingLabel: "Open now",
    openingDetail: "Open until 8pm today",
    consultationModes: ["Phone", "Video", "In person"],
    contactEndpoints: [
      "Call 020 7946 2184",
      "Visit 18 Cedar Parade, London SE1",
      "Video consultation if the pharmacist offers one",
    ],
    reasonCues: [
      "You do not need to arrange anything else right now.",
      "Check this page for the latest pharmacy update.",
    ],
    referenceMode: "available",
    referenceLabel: "PF-2184-91C2",
    referenceHashLabel: "REFSET-3A91B7",
    keepNote: "Keep this reference in case the pharmacy or your practice asks for it.",
    macroState: "action_in_progress",
    surfaceState: "referral_confirmed",
    staleOrBlockedPosture: "clear",
    calmCopyAllowed: false,
    outcomeTruthState: "waiting_for_outcome",
    patientVisibilityState: "hidden",
    closeEligibilityState: "not_closable",
    resolutionClass: null,
    dominantBrokenDependency: "none",
    repairProjectionState: "not_required",
    nextRepairAction: "none",
    headlineText: "Cedar Pharmacy is the current pharmacy for this referral.",
    nextStepText: "Follow the next steps below while Cedar Pharmacy reviews the referral.",
    whoOrWhereText:
      "The pharmacist may speak to you by phone, video, or in person, depending on what is safest and available.",
    whenExpectationText:
      "You do not need to arrange anything else right now. Check this page again if you have not heard from the pharmacy.",
    symptomsWorsenText:
      "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice.",
    warningText: null,
    reviewText: null,
    calmCompletionText: null,
    confirmationPage: {
      title: "Your referral has been sent to Cedar Pharmacy",
      summary: "We have kept the chosen pharmacy, the next step, and the reference together on this page.",
      panelText: "Reference PF-2184-91C2",
      nextLabel: "What happens next",
    },
    nextStepPage: {
      title: "What happens next",
      summary: "Cedar Pharmacy will review your referral and contact you if they need more information.",
      whoOrWhereText:
        "The pharmacist may speak to you by phone, video, or in person.",
      whenExpectationText:
        "You do not need to arrange anything else while this referral is in progress.",
      symptomsWorsenText:
        "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice.",
      warningText: null,
    },
    outcomePage: null,
    reviewNextStepPage: null,
    contactRouteRepairState: null,
    statusTracker: {
      title: "Referral status",
      summary: "The referral has been sent to the chosen pharmacy and is waiting for the pharmacy review step.",
      steps: [
        {
          stepId: "chosen_pharmacy",
          label: "Chosen pharmacy",
          state: "complete",
          summary: "Cedar Pharmacy is the active pharmacy for this referral.",
          detail: "The chosen pharmacy anchor remains visible across instruction and status routes.",
        },
        {
          stepId: "referral_sent",
          label: "Referral sent",
          state: "complete",
          summary: "The pharmacy has received the current referral package.",
          detail: "This confirmation is about the referral handoff, not the clinical outcome.",
        },
        {
          stepId: "pharmacy_review",
          label: "Pharmacy review",
          state: "current",
          summary: "The pharmacy is reviewing the referral.",
          detail: "The next safe update will appear here when the pharmacy route changes state.",
        },
        {
          stepId: "outcome",
          label: "Outcome recorded",
          state: "pending",
          summary: "No outcome has been recorded yet.",
          detail: "Outcome calmness stays blocked until the pharmacy route is actually completed.",
        },
      ],
    },
    primaryActionLabel: "Check status",
    primaryActionRoute: "status",
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2188",
    providerId: "provider_harbour_2188",
    providerLabel: "Harbour Pharmacy Group",
    providerSummary:
      "The chosen pharmacy stays visible while you repair the contact route needed for this referral.",
    requestLineageLabel: "Sinusitis referral / lineage 2188",
    continuityKey: "pharmacy.patient::PHC-2188::contact-repair",
    anchorState: "read_only",
    preservedSelectionLabel: null,
    openingLabel: "Open now",
    openingDetail: "Open until 7pm today",
    consultationModes: ["Phone", "In person"],
    contactEndpoints: [
      "Call 020 7946 2188",
      "Visit 12 Harbour Parade, London SE1",
    ],
    reasonCues: [
      "Repair the contact route in this request shell.",
      "The chosen pharmacy stays visible while you do this.",
    ],
    referenceMode: "available",
    referenceLabel: "PF-2188-77AF",
    referenceHashLabel: "REFSET-7D14E0",
    keepNote: "Keep this reference while you repair the contact route.",
    macroState: "reviewing_next_steps",
    surfaceState: "contact_repair",
    staleOrBlockedPosture: "repair_required",
    calmCopyAllowed: false,
    outcomeTruthState: "review_required",
    patientVisibilityState: "review_placeholder",
    closeEligibilityState: "blocked_by_reconciliation",
    resolutionClass: "reachability_repair",
    dominantBrokenDependency: "pharmacy_contact",
    repairProjectionState: "awaiting_verification",
    nextRepairAction: "verify_candidate_route",
    headlineText: "Update or confirm how we can contact you.",
    nextStepText: "Complete the contact repair step so this pharmacy referral can continue safely.",
    whoOrWhereText:
      "Harbour Pharmacy Group remains visible here while the contact route is checked.",
    whenExpectationText:
      "Finish the verification step in this request shell before the pharmacy route continues.",
    symptomsWorsenText:
      "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice.",
    warningText:
      "We cannot safely continue this pharmacy referral until the contact route is checked.",
    reviewText:
      "We have paused routine pharmacy progress while the contact route is repaired.",
    calmCompletionText: null,
    confirmationPage: null,
    nextStepPage: null,
    outcomePage: null,
    reviewNextStepPage: null,
    contactRouteRepairState: {
      title: "Update or confirm how we can contact you",
      summary: "We cannot safely continue this pharmacy referral until the contact route is checked.",
      detail:
        "The chosen pharmacy, request lineage, and referral reference stay visible while you complete this repair step.",
      actionLabel: "Update contact route",
      announcementRole: "alert",
    },
    statusTracker: {
      title: "Referral status",
      summary: "This referral is paused for contact-route repair.",
      steps: [
        {
          stepId: "chosen_pharmacy",
          label: "Chosen pharmacy",
          state: "complete",
          summary: "Harbour Pharmacy Group is still the chosen pharmacy.",
          detail: "The provider anchor remains visible while the contact route is repaired.",
        },
        {
          stepId: "contact_route",
          label: "Contact route repair",
          state: "attention",
          summary: "We need a checked contact route before the referral can continue.",
          detail: "Complete the verification step in this same shell so the pharmacy route can resume safely.",
        },
        {
          stepId: "pharmacy_review",
          label: "Pharmacy review",
          state: "pending",
          summary: "The pharmacy review step will resume after contact repair.",
          detail: "We will show the next safe update here after the repair step is complete.",
        },
        {
          stepId: "outcome",
          label: "Outcome recorded",
          state: "pending",
          summary: "No pharmacy outcome is recorded yet.",
          detail: "Outcome calmness stays blocked while the referral is paused for repair.",
        },
      ],
    },
    primaryActionLabel: "Open status",
    primaryActionRoute: "status",
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2090",
    providerId: null,
    providerLabel: "Practice review route",
    providerSummary:
      "The request stays in the same shell while the next safe step is reviewed outside routine pharmacy flow.",
    requestLineageLabel: "Pharmacy suitability review / lineage 2090",
    continuityKey: "pharmacy.patient::PHC-2090::practice-return",
    anchorState: "read_only",
    preservedSelectionLabel: null,
    openingLabel: null,
    openingDetail: null,
    consultationModes: [],
    contactEndpoints: [],
    reasonCues: [],
    referenceMode: "pending",
    referenceLabel: null,
    referenceHashLabel: "REFSET-PENDING-2090",
    keepNote: null,
    macroState: "reviewing_next_steps",
    surfaceState: "review_next_steps",
    staleOrBlockedPosture: "clear",
    calmCopyAllowed: false,
    outcomeTruthState: "review_required",
    patientVisibilityState: "review_placeholder",
    closeEligibilityState: "blocked_by_reconciliation",
    resolutionClass: "practice_review_required",
    dominantBrokenDependency: "none",
    repairProjectionState: "not_required",
    nextRepairAction: "none",
    headlineText: "We’re reviewing the next step from the pharmacy route.",
    nextStepText: "Keep this request available. We’ll show the next safe step here once the review is complete.",
    whoOrWhereText: null,
    whenExpectationText:
      "You do not need to arrange anything with the pharmacy while this review is happening.",
    symptomsWorsenText:
      "If your symptoms get worse while this review is happening, use NHS 111 or contact your GP practice.",
    warningText: null,
    reviewText:
      "The request has been returned for review, and we are keeping the next safe step visible here.",
    calmCompletionText: null,
    confirmationPage: null,
    nextStepPage: null,
    outcomePage: null,
    reviewNextStepPage: {
      title: "We’re reviewing the next step from the pharmacy route",
      summary: "The request has been returned for review and is no longer in routine pharmacy progress.",
      reviewText:
        "Keep this request available. We will show the next safe step here once the review is complete.",
      warningText: null,
      tone: "review",
      announcementRole: "status",
    },
    contactRouteRepairState: null,
    statusTracker: {
      title: "Referral status",
      summary: "The request is in review instead of routine pharmacy progress.",
      steps: [
        {
          stepId: "eligibility_review",
          label: "Safety review",
          state: "current",
          summary: "The next safe step is being reviewed.",
          detail: "The request stays in the same shell while we work out what should happen next.",
        },
        {
          stepId: "practice_follow_up",
          label: "Practice follow-up",
          state: "pending",
          summary: "Practice follow-up starts after the review is complete.",
          detail: "We will show that next step here instead of sending you to a detached page.",
        },
      ],
    },
    primaryActionLabel: "Review next step",
    primaryActionRoute: "instructions",
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2103",
    providerId: "provider_riverside_2103",
    providerLabel: "Riverside Pharmacy",
    providerSummary:
      "The provider anchor is still visible, but the pharmacy route has reopened for urgent review.",
    requestLineageLabel: "Chest infection urgent pathway / lineage 2103",
    continuityKey: "pharmacy.patient::PHC-2103::riverside",
    anchorState: "read_only",
    preservedSelectionLabel: null,
    openingLabel: "Contact your practice urgently",
    openingDetail: "Routine pharmacy progress is paused for safety.",
    consultationModes: ["Phone"],
    contactEndpoints: [
      "Use NHS 111 if you need urgent advice",
      "Contact your GP practice urgently",
    ],
    reasonCues: [
      "Routine pharmacy progress is paused.",
      "Use the urgent guidance shown on this page now.",
    ],
    referenceMode: "available",
    referenceLabel: "PF-2103-URG1",
    referenceHashLabel: "REFSET-URG-2103",
    keepNote: "Keep the reference available if your practice asks for it.",
    macroState: "urgent_action",
    surfaceState: "urgent_action",
    staleOrBlockedPosture: "repair_required",
    calmCopyAllowed: false,
    outcomeTruthState: "reopened_for_safety",
    patientVisibilityState: "recovery_required",
    closeEligibilityState: "blocked_by_safety",
    resolutionClass: "urgent_return",
    dominantBrokenDependency: "urgent_return",
    repairProjectionState: "manual_recovery",
    nextRepairAction: "manual_recovery",
    headlineText: "Please act on this urgently.",
    nextStepText: "Do not wait for routine pharmacy contact. Follow the urgent return guidance shown in this request shell now.",
    whoOrWhereText: "Use the urgent support route shown on this page.",
    whenExpectationText: "Act now rather than waiting for a routine pharmacy update.",
    symptomsWorsenText:
      "If symptoms get worse or you feel you need urgent help, use NHS 111 or contact your GP practice straight away.",
    warningText:
      "The pharmacy route has escalated this so routine progress guidance is no longer safe.",
    reviewText:
      "This request has been reopened for urgent review and should not be treated as a completed pharmacy journey.",
    calmCompletionText: null,
    confirmationPage: null,
    nextStepPage: null,
    outcomePage: null,
    reviewNextStepPage: {
      title: "Please act on this urgently",
      summary: "Routine pharmacy progress is paused while this request is reviewed for safety.",
      reviewText:
        "Do not wait for a routine pharmacy call. Use the urgent support route shown on this page now.",
      warningText:
        "This request has reopened for urgent review and should not look completed.",
      tone: "urgent",
      announcementRole: "alert",
    },
    contactRouteRepairState: null,
    statusTracker: {
      title: "Referral status",
      summary: "The pharmacy route has reopened for urgent review.",
      steps: [
        {
          stepId: "chosen_pharmacy",
          label: "Chosen pharmacy",
          state: "complete",
          summary: "Riverside Pharmacy remains part of the request history.",
          detail: "The provider anchor is preserved as context while urgent review takes over.",
        },
        {
          stepId: "urgent_review",
          label: "Urgent review",
          state: "attention",
          summary: "This request needs urgent action now.",
          detail: "Routine pharmacy progress is paused while the urgent route is reviewed.",
        },
        {
          stepId: "routine_progress",
          label: "Routine pharmacy progress",
          state: "attention",
          summary: "Routine progress is no longer safe for this request.",
          detail: "The page keeps this state explicit so it does not read like a completed referral.",
        },
      ],
    },
    primaryActionLabel: "Read urgent guidance",
    primaryActionRoute: "instructions",
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2196",
    providerId: "provider_northbank_2196",
    providerLabel: "North Bank Pharmacy",
    providerSummary:
      "The completed referral stays visible here as a record of what happened and where it was handled.",
    requestLineageLabel: "UTI pathway referral / lineage 2196",
    continuityKey: "pharmacy.patient::PHC-2196::north-bank",
    anchorState: "current",
    preservedSelectionLabel: null,
    openingLabel: "Outcome recorded",
    openingDetail: "The pharmacy outcome is now part of the referral record",
    consultationModes: ["Phone", "In person"],
    contactEndpoints: [
      "Call 020 7946 2196",
      "Visit 44 North Bank Road, London SE1",
    ],
    reasonCues: [
      "This is the completed referral record.",
      "Use this page again if you need to check what happened.",
    ],
    referenceMode: "available",
    referenceLabel: "PF-2196-20BE",
    referenceHashLabel: "REFSET-20BE44",
    keepNote: "Keep this reference if you need to speak to the pharmacy or your practice about this referral.",
    macroState: "completed",
    surfaceState: "completed",
    staleOrBlockedPosture: "clear",
    calmCopyAllowed: true,
    outcomeTruthState: "settled_resolved",
    patientVisibilityState: "quiet_result",
    closeEligibilityState: "eligible_pending_projection",
    resolutionClass: "completed",
    dominantBrokenDependency: "none",
    repairProjectionState: "not_required",
    nextRepairAction: "none",
    headlineText: "The pharmacy outcome has been recorded.",
    nextStepText: "You do not need to do anything else right now unless your symptoms change.",
    whoOrWhereText: "North Bank Pharmacy handled the completed referral.",
    whenExpectationText: null,
    symptomsWorsenText:
      "If your symptoms get worse after this referral outcome, use NHS 111 or contact your GP practice.",
    warningText: null,
    reviewText: null,
    calmCompletionText:
      "We’ve kept the pharmacy summary here as a record of the completed referral outcome.",
    confirmationPage: null,
    nextStepPage: null,
    outcomePage: {
      title: "The pharmacy outcome has been recorded",
      summary: "You do not need to do anything else right now unless your symptoms change.",
      calmCompletionText:
        "We’ve kept the pharmacy summary here as a record of the completed referral outcome.",
      warningText: null,
    },
    reviewNextStepPage: null,
    contactRouteRepairState: null,
    statusTracker: {
      title: "Referral status",
      summary: "The referral outcome is recorded and the request reads as complete.",
      steps: [
        {
          stepId: "chosen_pharmacy",
          label: "Chosen pharmacy",
          state: "complete",
          summary: "North Bank Pharmacy handled the referral.",
          detail: "The chosen provider remains visible as part of the completed record.",
        },
        {
          stepId: "referral_sent",
          label: "Referral sent",
          state: "complete",
          summary: "The referral reached the chosen pharmacy.",
          detail: "The handoff completed before the outcome was recorded.",
        },
        {
          stepId: "pharmacy_review",
          label: "Pharmacy review",
          state: "complete",
          summary: "The pharmacy completed the review step.",
          detail: "The completed journey remains visible without turning into generic appointment copy.",
        },
        {
          stepId: "outcome",
          label: "Outcome recorded",
          state: "complete",
          summary: "The final outcome is on the record.",
          detail: "This is the point where calm completion wording becomes lawful.",
        },
      ],
    },
    primaryActionLabel: "Review instructions",
    primaryActionRoute: "instructions",
  }),
] as const satisfies readonly PharmacyPatientStatusPreviewSnapshot[];

const previewMap = new Map(
  pharmacyPatientStatusPreviewCases.map((preview) => [preview.pharmacyCaseId, preview] as const),
);

export function resolvePharmacyPatientStatusPreview(
  pharmacyCaseId: string,
): PharmacyPatientStatusPreviewSnapshot | null {
  return previewMap.get(pharmacyCaseId) ?? null;
}
