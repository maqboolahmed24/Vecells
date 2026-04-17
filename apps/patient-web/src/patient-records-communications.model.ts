import {
  makePatientRequestReturnBundle215,
  type PatientRequestReturnBundle,
} from "./patient-home-requests-detail-routes.model";

export const PATIENT_RECORDS_COMMUNICATIONS_TASK_ID =
  "par_217_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_health_record_and_communications_timeline_views";
export const PATIENT_RECORDS_COMMUNICATIONS_VISUAL_MODE = "Quiet_Clinical_Correspondence";
export const RECORDS_COMMUNICATIONS_FORBIDDEN_TRUTH_SOURCES = [
  "chart_pixel_output_as_meaning_authority",
  "browser_download_event_as_artifact_truth",
  "PatientResultInsightProjection_as_second_interpretation_source",
  "frontend_local_message_body_filter",
  "ConversationCallbackCardProjection_as_second_callback_truth",
  "local_ack_as_authoritative_settlement",
  "transport_acceptance_as_settled_delivery",
] as const;

export type RecordsCommunicationsRouteKey =
  | "records_overview"
  | "result_detail"
  | "document_detail"
  | "messages_index"
  | "message_cluster"
  | "message_thread"
  | "message_callback"
  | "message_repair";

export type RecordReleaseState =
  | "visible"
  | "delayed_release"
  | "step_up_required"
  | "restricted"
  | "identity_hold"
  | "recovery_required";
export type RecordPresentationMode =
  | "governed_preview"
  | "structured_summary"
  | "governed_download"
  | "placeholder_only"
  | "recovery_only";
export type VisualizationParityState =
  | "visual_and_table"
  | "table_only"
  | "summary_only"
  | "placeholder_only";
export type MessagePreviewMode =
  | "public_safe_summary"
  | "authenticated_summary"
  | "step_up_required"
  | "suppressed_recovery_only";
export type ConversationState =
  | "unread"
  | "reply_needed"
  | "awaiting_review"
  | "callback_risk"
  | "closed"
  | "delivery_failed"
  | "disputed"
  | "step_up_required";

export interface PatientRecordSurfaceContext {
  readonly projectionName: "PatientRecordSurfaceContext";
  readonly recordSurfaceContextId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly patientShellConsistencyRef: string;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordStepUpCheckpointRef: string | null;
  readonly recordArtifactProjectionRefs: readonly string[];
  readonly artifactParityDigestRefs: readonly string[];
  readonly recordArtifactParityWitnessRefs: readonly string[];
  readonly summarySafetyTier: "patient_safe_summary" | "same_patient_detail" | "placeholder_only";
  readonly renderMode: "overview" | "detail" | "trend" | "document_summary" | "attachment";
  readonly selectedAnchorRef: string;
  readonly oneExpandedItemGroupRef: string;
  readonly recordOriginContinuationRef: string;
  readonly experienceContinuityEvidenceRef: string;
  readonly surfaceTupleHash: string;
  readonly continuationState: "aligned" | "stale" | "blocked";
  readonly surfaceState: "visible" | "gated_placeholder" | "stale_recovery" | "read_only";
}

export interface PatientResultInterpretationProjection {
  readonly projectionName: "PatientResultInterpretationProjection";
  readonly resultInterpretationId: string;
  readonly recordRef: string;
  readonly observationRef: string;
  readonly displayName: string;
  readonly displayValue: string;
  readonly displayUnit: string;
  readonly originalValue: string;
  readonly originalUnit: string;
  readonly referenceRangeRef: string;
  readonly comparatorBasisRef: string;
  readonly trendWindowRef: string;
  readonly specimenRef: string;
  readonly sourceOrganisationRef: string;
  readonly abnormalityBasisRef: string;
  readonly interpretationSummary: string;
  readonly comparisonState: "comparable" | "not_comparable" | "stale_source" | "partial_history";
  readonly detailBlocks: readonly {
    readonly blockId:
      | "what_this_test_is"
      | "latest_result"
      | "what_changed"
      | "patient_next_step"
      | "urgent_help"
      | "technical_details";
    readonly heading: string;
    readonly body: string;
  }[];
}

export interface PatientResultInsightProjection {
  readonly projectionName: "PatientResultInsightProjection";
  readonly aliasStrategy: "adapter_alias_only";
  readonly sourceProjectionRef: "PatientResultInterpretationProjection";
}

export interface PatientRecordArtifactProjection {
  readonly projectionName: "PatientRecordArtifactProjection";
  readonly recordArtifactProjectionId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly structuredSummaryRef: string;
  readonly structuredSummaryHash: string;
  readonly summaryDerivationPackageRef: string;
  readonly sourceArtifactRef: string;
  readonly sourceArtifactBundleRef: string;
  readonly sourceArtifactHash: string;
  readonly artifactPresentationContractRef: string;
  readonly artifactSurfaceFrameRef: string;
  readonly artifactModeTruthProjectionRef: string;
  readonly binaryArtifactDeliveryRef: string | null;
  readonly artifactByteGrantRef: string | null;
  readonly artifactParityDigestRef: string;
  readonly recordArtifactParityWitnessRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly artifactFallbackDispositionRef: string;
  readonly recordVisibilityEnvelopeRef: string;
  readonly recordReleaseGateRef: string;
  readonly recordStepUpCheckpointRef: string | null;
  readonly recordOriginContinuationRef: string;
  readonly recoveryContinuationTokenRef: string;
  readonly presentationMode: RecordPresentationMode;
  readonly downloadEligibilityState: "available" | "secondary" | "gated" | "blocked";
  readonly embeddedNavigationGrantRef: string | null;
  readonly summaryParityState:
    | "verified"
    | "provisional"
    | "stale"
    | "source_only"
    | "download_only"
    | "recovery_only";
  readonly sourceAuthorityState:
    | "source_authoritative"
    | "summary_verified"
    | "summary_provisional"
    | "source_only"
    | "placeholder_only"
    | "recovery_only";
  readonly parityTupleHash: string;
  readonly generatedAt: string;
}

export interface RecordArtifactParityWitness {
  readonly projectionName: "RecordArtifactParityWitness";
  readonly recordArtifactParityWitnessRef: string;
  readonly recordRef: string;
  readonly summaryParityState: PatientRecordArtifactProjection["summaryParityState"];
  readonly sourceAuthorityState: PatientRecordArtifactProjection["sourceAuthorityState"];
  readonly recordGateState:
    | "visible"
    | "delayed_release"
    | "step_up_required"
    | "restricted"
    | "identity_hold"
    | "blocked";
  readonly visualizationParityState: VisualizationParityState;
  readonly parityTupleHash: string;
}

export interface PatientRecordFollowUpEligibilityProjection {
  readonly projectionName: "PatientRecordFollowUpEligibilityProjection";
  readonly recordFollowUpEligibilityId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly recordActionContextTokenRef: string;
  readonly recordOriginContinuationRef: string;
  readonly capabilityRef: string;
  readonly releaseState: RecordReleaseState;
  readonly visibilityTier: "full" | "partial" | "placeholder_only" | "suppressed";
  readonly allowedNextActionRefs: readonly string[];
  readonly blockingDependencyRefs: readonly string[];
  readonly eligibilityFenceState: "aligned" | "stale" | "blocked";
  readonly eligibilityState: "available" | "gated" | "recovery_only" | "unavailable";
}

export interface PatientRecordContinuityState {
  readonly projectionName: "PatientRecordContinuityState";
  readonly recordContinuityStateId: string;
  readonly recordRef: string;
  readonly recordVersionRef: string;
  readonly selectedAnchorRef: string;
  readonly oneExpandedItemGroupRef: string;
  readonly recordOriginContinuationRef: string;
  readonly recoveryContinuationTokenRef: string;
  readonly summarySafetyTier: PatientRecordSurfaceContext["summarySafetyTier"];
  readonly placeholderContractRef: string | null;
  readonly continuationState:
    | "stable"
    | "child_route_active"
    | "awaiting_step_up"
    | "delayed_release"
    | "identity_hold"
    | "recovering"
    | "blocked";
}

export interface VisualizationFallbackContract {
  readonly projectionName: "VisualizationFallbackContract";
  readonly fallbackRef: string;
  readonly allowedFallbackModes: readonly ("chart" | "table" | "summary" | "placeholder")[];
  readonly demotionReasonRef: string | null;
}

export interface VisualizationTableContract {
  readonly projectionName: "VisualizationTableContract";
  readonly tableRef: string;
  readonly units: string;
  readonly selectionContextRef: string;
  readonly rows: readonly {
    readonly collectedAt: string;
    readonly value: string;
    readonly unit: string;
    readonly referenceRange: string;
    readonly source: string;
  }[];
}

export interface VisualizationParityProjection {
  readonly projectionName: "VisualizationParityProjection";
  readonly visualizationParityProjectionId: string;
  readonly parityState: VisualizationParityState;
  readonly unitsPreserved: boolean;
  readonly selectionContextPreserved: boolean;
  readonly filterContextRef: string;
  readonly tableContractRef: string;
  readonly fallbackContractRef: string;
}

export interface RecordSummaryItem {
  readonly itemRef: string;
  readonly groupRef:
    | "latest_updates"
    | "test_results"
    | "medicines_allergies"
    | "conditions_care_plans"
    | "letters_documents"
    | "action_needed";
  readonly title: string;
  readonly summary: string;
  readonly routeRef: string;
  readonly releaseState: RecordReleaseState;
  readonly sourceAuthorityState: PatientRecordArtifactProjection["sourceAuthorityState"];
  readonly placeholderVisible: boolean;
  readonly updatedLabel: string;
}

export interface PatientCommunicationVisibilityProjection {
  readonly projectionName: "PatientCommunicationVisibilityProjection";
  readonly communicationVisibilityProjectionId: string;
  readonly clusterOrThreadRef: string;
  readonly patientShellConsistencyRef: string;
  readonly audienceTier: "patient_public" | "patient_authenticated" | "secure_link_recovery";
  readonly releaseState: "visible" | "step_up_required" | "recovery_required";
  readonly stepUpRequirementRef: string | null;
  readonly visibilityTier: "public_safe" | "authenticated" | "placeholder_only";
  readonly summarySafetyTier: "public_safe_summary" | "same_patient_detail" | "recovery_only";
  readonly minimumNecessaryContractRef: string;
  readonly previewVisibilityContractRef: string;
  readonly visibleSnippetRefs: readonly string[];
  readonly previewMode: MessagePreviewMode;
  readonly placeholderContractRef: string | null;
  readonly hiddenContentReasonRefs: readonly string[];
  readonly safeContinuationRef: string;
  readonly latestReceiptEnvelopeRef: string;
  readonly latestSettlementRef: string;
  readonly experienceContinuityEvidenceRef: string;
  readonly computedAt: string;
}

export interface PatientConversationPreviewDigest {
  readonly projectionName: "PatientConversationPreviewDigest";
  readonly previewDigestRef: string;
  readonly clusterRef: string;
  readonly title: string;
  readonly preview: string;
  readonly state: ConversationState;
  readonly replyNeededState: "needed" | "not_needed" | "blocked";
  readonly awaitingReviewState: "awaiting_review" | "not_awaiting" | "blocked";
  readonly repairRequiredState: "none" | "contact_route" | "consent" | "identity";
  readonly dominantNextActionRef:
    | "open_cluster"
    | "send_secure_reply"
    | "contact_route_repair"
    | "complete_step_up"
    | "await_authoritative_outcome";
  readonly updatedLabel: string;
}

export interface PatientConversationCluster {
  readonly projectionName: "PatientConversationCluster";
  readonly clusterRef: string;
  readonly governingObjectRef: string;
  readonly careEpisodeLabel: string;
  readonly selectedAnchorRef: string;
  readonly clusterRouteRef: string;
  readonly previewDigest: PatientConversationPreviewDigest;
  readonly visibility: PatientCommunicationVisibilityProjection;
}

export interface ConversationThreadProjection {
  readonly projectionName: "ConversationThreadProjection";
  readonly threadId: string;
  readonly clusterRef: string;
  readonly threadTupleHash: string;
  readonly receiptGrammarVersionRef: string;
  readonly monotoneRevision: number;
  readonly previewVisibilityContractRef: string;
  readonly summarySafetyTier: PatientCommunicationVisibilityProjection["summarySafetyTier"];
  readonly subject: string;
  readonly composerLeaseRef: string;
}

export interface ConversationSubthreadProjection {
  readonly projectionName: "ConversationSubthreadProjection";
  readonly subthreadRef: string;
  readonly threadId: string;
  readonly subthreadType:
    | "clinician_reply"
    | "patient_reply"
    | "callback"
    | "reminder"
    | "repair"
    | "receipt";
  readonly timestampLabel: string;
  readonly title: string;
  readonly body: string;
  readonly visibilityProjectionRef: string;
  readonly receiptEnvelopeRef: string;
}

export interface ConversationCallbackCardProjection {
  readonly projectionName: "ConversationCallbackCardProjection";
  readonly callbackCardProjectionRef: string;
  readonly sourceProjection: "PatientCallbackStatusProjection";
  readonly patientVisibleState: "scheduled" | "route_repair_required" | "closed";
  readonly windowRiskState: "on_track" | "repair_required" | "missed_window";
  readonly callbackExpectationEnvelopeRef: string;
}

export interface PatientCallbackStatusProjection {
  readonly projectionName: "PatientCallbackStatusProjection";
  readonly callbackStatusProjectionId: string;
  readonly patientVisibleState: "scheduled" | "route_repair_required" | "closed";
  readonly windowRiskState: "on_track" | "repair_required" | "missed_window";
  readonly dominantActionRef: "view_callback" | "contact_route_repair" | "return_to_messages";
}

export interface PatientReceiptEnvelope {
  readonly projectionName: "PatientReceiptEnvelope";
  readonly receiptEnvelopeRef: string;
  readonly localAckState: "none" | "shown" | "superseded";
  readonly transportAckState: "not_started" | "accepted" | "failed";
  readonly deliveryEvidenceState: "pending" | "delivered" | "delivery_failure" | "disputed";
  readonly deliveryRiskState: "clear" | "at_risk" | "failed" | "disputed";
  readonly receiptLabel: string;
}

export interface ConversationCommandSettlement {
  readonly projectionName: "ConversationCommandSettlement";
  readonly commandSettlementRef: string;
  readonly authoritativeOutcomeState:
    | "pending"
    | "awaiting_review"
    | "settled"
    | "reconciliation_required"
    | "recovery_required";
  readonly calmSettledLanguageAllowed: boolean;
}

export interface PatientComposerLease {
  readonly projectionName: "PatientComposerLease";
  readonly composerLeaseRef: string;
  readonly selectedAnchorRef: string;
  readonly leaseState: "available" | "blocked" | "read_only";
  readonly blockedReasonRef: string | null;
}

export interface ConversationTimelineAnchor {
  readonly projectionName: "ConversationTimelineAnchor";
  readonly anchorRef: string;
  readonly clusterRef: string;
  readonly selectedSubthreadRef: string;
  readonly continuityEvidenceRef: string;
}

export interface PatientCommunicationsTimelineProjection {
  readonly projectionName: "PatientCommunicationsTimelineProjection";
  readonly communicationsTimelineProjectionId: string;
  readonly clusters: readonly PatientConversationCluster[];
  readonly selectedClusterRef: string | null;
  readonly conversationContinuityEvidenceRef: string;
  readonly computedAt: string;
}

export interface RecordsCommunicationsEntryProjection {
  readonly projectionName: "PatientRecordsCommunicationsEntryProjection";
  readonly routeKey: RecordsCommunicationsRouteKey;
  readonly visualMode: typeof PATIENT_RECORDS_COMMUNICATIONS_VISUAL_MODE;
  readonly pathname: string;
  readonly activeSection: "records" | "messages";
  readonly maskedPatientRef: string;
  readonly recordReturnBundle: PatientRequestReturnBundle;
  readonly recordSurfaceContext: PatientRecordSurfaceContext;
  readonly recordSummaryItems: readonly RecordSummaryItem[];
  readonly resultInterpretation: PatientResultInterpretationProjection;
  readonly resultInsightAlias: PatientResultInsightProjection;
  readonly recordArtifact: PatientRecordArtifactProjection;
  readonly parityWitness: RecordArtifactParityWitness;
  readonly followUpEligibility: PatientRecordFollowUpEligibilityProjection;
  readonly recordContinuity: PatientRecordContinuityState;
  readonly visualizationFallback: VisualizationFallbackContract;
  readonly visualizationTable: VisualizationTableContract;
  readonly visualizationParity: VisualizationParityProjection;
  readonly communicationsTimeline: PatientCommunicationsTimelineProjection;
  readonly activeCluster: PatientConversationCluster;
  readonly conversationThread: ConversationThreadProjection;
  readonly subthreads: readonly ConversationSubthreadProjection[];
  readonly callbackCard: ConversationCallbackCardProjection;
  readonly callbackStatus: PatientCallbackStatusProjection;
  readonly receiptEnvelope: PatientReceiptEnvelope;
  readonly commandSettlement: ConversationCommandSettlement;
  readonly composerLease: PatientComposerLease;
  readonly timelineAnchor: ConversationTimelineAnchor;
  readonly sourceProjectionRefs: readonly string[];
}

function tuple(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `tuple_217_${hash.toString(16).padStart(8, "0")}`;
}

const recordSummaryItems: readonly RecordSummaryItem[] = [
  {
    itemRef: "record_213_result_a",
    groupRef: "latest_updates",
    title: "Full blood count result",
    summary: "Verified summary available with a table-first trend and source metadata.",
    routeRef: "/records/results/result_213_fbc",
    releaseState: "visible",
    sourceAuthorityState: "summary_verified",
    placeholderVisible: false,
    updatedLabel: "Updated today, 09:20",
  },
  {
    itemRef: "record_213_stale_summary",
    groupRef: "test_results",
    title: "Kidney function trend",
    summary: "The chart was removed because parity drifted; the table remains authoritative.",
    routeRef: "/records/results/result_213_stale",
    releaseState: "visible",
    sourceAuthorityState: "summary_provisional",
    placeholderVisible: false,
    updatedLabel: "Updated yesterday",
  },
  {
    itemRef: "record_213_delayed_release",
    groupRef: "test_results",
    title: "Microbiology result",
    summary:
      "A result exists but is in delayed release. Detail stays hidden until release settles.",
    routeRef: "/records/results/result_213_delayed_release",
    releaseState: "delayed_release",
    sourceAuthorityState:
      "placeholder_only" as PatientRecordArtifactProjection["sourceAuthorityState"],
    placeholderVisible: true,
    updatedLabel: "Visible after clinical review",
  },
  {
    itemRef: "record_213_step_up",
    groupRef: "action_needed",
    title: "Sensitive result needs step-up",
    summary: "The record anchor stays visible while extra verification is required.",
    routeRef: "/records/results/result_213_step_up",
    releaseState: "step_up_required",
    sourceAuthorityState:
      "placeholder_only" as PatientRecordArtifactProjection["sourceAuthorityState"],
    placeholderVisible: true,
    updatedLabel: "Verification required",
  },
  {
    itemRef: "record_213_letter",
    groupRef: "letters_documents",
    title: "Dermatology letter",
    summary: "Structured summary is verified. The source document is a secondary action.",
    routeRef: "/records/documents/document_213_letter",
    releaseState: "visible",
    sourceAuthorityState: "summary_verified",
    placeholderVisible: false,
    updatedLabel: "Added 15 Apr",
  },
  {
    itemRef: "record_213_source_only",
    groupRef: "letters_documents",
    title: "Hospital discharge document",
    summary: "Source artifact is available, but the structured summary is provisional.",
    routeRef: "/records/documents/document_213_source_only",
    releaseState: "visible",
    sourceAuthorityState: "source_only",
    placeholderVisible: false,
    updatedLabel: "Source only",
  },
  {
    itemRef: "record_213_restricted",
    groupRef: "conditions_care_plans",
    title: "Restricted care-plan attachment",
    summary: "A restricted item is present. The shell shows reason and safe next step.",
    routeRef: "/records/documents/document_213_restricted",
    releaseState: "restricted",
    sourceAuthorityState:
      "placeholder_only" as PatientRecordArtifactProjection["sourceAuthorityState"],
    placeholderVisible: true,
    updatedLabel: "Restricted",
  },
  {
    itemRef: "record_217_medicines",
    groupRef: "medicines_allergies",
    title: "Medicines and allergies summary",
    summary: "No medicines have changed in this fixture. Allergy summary is source-labelled.",
    routeRef: "/records",
    releaseState: "visible",
    sourceAuthorityState: "summary_verified",
    placeholderVisible: false,
    updatedLabel: "Checked today",
  },
];

const resultCopy: Record<string, Omit<PatientResultInterpretationProjection, "projectionName">> = {
  result_213_fbc: {
    resultInterpretationId: "result_interpretation_213_fbc",
    recordRef: "record_213_result_a",
    observationRef: "obs_fbc_2026_04_15",
    displayName: "Full blood count",
    displayValue: "132",
    displayUnit: "g/L",
    originalValue: "132",
    originalUnit: "g/L",
    referenceRangeRef: "range_hb_115_160_g_l",
    comparatorBasisRef: "same_lab_same_unit",
    trendWindowRef: "trend_12_months",
    specimenRef: "specimen_2026_04_15",
    sourceOrganisationRef: "Riverside Pathology",
    abnormalityBasisRef: "within_reference_range",
    interpretationSummary: "This haemoglobin result is within the reference range used by the lab.",
    comparisonState: "comparable",
    detailBlocks: [
      {
        blockId: "what_this_test_is",
        heading: "What this test is",
        body: "A full blood count measures several parts of your blood, including haemoglobin.",
      },
      {
        blockId: "latest_result",
        heading: "What the latest result says",
        body: "Haemoglobin is 132 g/L, within the reference range shown by the source lab.",
      },
      {
        blockId: "what_changed",
        heading: "What changed since last time",
        body: "The value is 4 g/L higher than the previous comparable result.",
      },
      {
        blockId: "patient_next_step",
        heading: "What you may need to do next",
        body: "No patient action is currently required from this result.",
      },
      {
        blockId: "urgent_help",
        heading: "When to get urgent help",
        body: "Seek urgent help if you feel severely unwell, breathless, faint, or have symptoms that are rapidly worsening.",
      },
      {
        blockId: "technical_details",
        heading: "Technical details",
        body: "Source: Riverside Pathology. Specimen date 15 Apr 2026. Reference range 115 to 160 g/L.",
      },
    ],
  },
  result_213_stale: {
    resultInterpretationId: "result_interpretation_213_stale",
    recordRef: "record_213_stale_summary",
    observationRef: "obs_egfr_2026_04_10",
    displayName: "Kidney function",
    displayValue: "72",
    displayUnit: "mL/min/1.73m2",
    originalValue: "72",
    originalUnit: "mL/min/1.73m2",
    referenceRangeRef: "range_egfr_over_60",
    comparatorBasisRef: "same_lab_but_stale_summary",
    trendWindowRef: "trend_6_months",
    specimenRef: "specimen_2026_04_10",
    sourceOrganisationRef: "Riverside Pathology",
    abnormalityBasisRef: "above_threshold",
    interpretationSummary:
      "The table remains visible, but the chart is not available because the structured summary is stale.",
    comparisonState: "stale_source",
    detailBlocks: [
      {
        blockId: "what_this_test_is",
        heading: "What this test is",
        body: "This result estimates how well the kidneys are filtering blood.",
      },
      {
        blockId: "latest_result",
        heading: "What the latest result says",
        body: "The latest source value is 72 mL/min/1.73m2.",
      },
      {
        blockId: "what_changed",
        heading: "What changed since last time",
        body: "The comparison is shown only in the source table until parity is rebuilt.",
      },
      {
        blockId: "patient_next_step",
        heading: "What you may need to do next",
        body: "Keep any follow-up already agreed with the practice.",
      },
      {
        blockId: "urgent_help",
        heading: "When to get urgent help",
        body: "Seek urgent help if you become very unwell or cannot pass urine.",
      },
      {
        blockId: "technical_details",
        heading: "Technical details",
        body: "Chart parity is table_only because the artifact parity witness demoted the visualization.",
      },
    ],
  },
};

const communicationClusters: readonly PatientConversationCluster[] = [
  makeCluster({
    clusterRef: "cluster_214_derm",
    title: "Dermatology request",
    preview: "The practice asked for a photo note and will review your reply.",
    state: "reply_needed",
    route: "/messages/cluster_214_derm",
    action: "send_secure_reply",
    visibilityMode: "authenticated_summary",
    updatedLabel: "Today, 10:45",
  }),
  makeCluster({
    clusterRef: "cluster_214_callback",
    title: "Callback follow-up",
    preview: "Callback updates are paused until the contact route is repaired.",
    state: "callback_risk",
    route: "/messages/cluster_214_callback",
    action: "contact_route_repair",
    visibilityMode: "authenticated_summary",
    updatedLabel: "Today, 09:10",
  }),
  makeCluster({
    clusterRef: "cluster_214_stepup",
    title: "Hospital letter message",
    preview: "A message exists, but extra verification is required before the preview can show.",
    state: "step_up_required",
    route: "/messages/cluster_214_stepup",
    action: "complete_step_up",
    visibilityMode: "step_up_required",
    updatedLabel: "Yesterday",
  }),
  makeCluster({
    clusterRef: "cluster_214_dispute",
    title: "Reminder delivery issue",
    preview: "A reminder delivery dispute is still visible until repaired.",
    state: "disputed",
    route: "/messages/cluster_214_dispute",
    action: "contact_route_repair",
    visibilityMode: "suppressed_recovery_only",
    updatedLabel: "15 Apr",
  }),
];

function defaultResultInterpretationFixture(): Omit<
  PatientResultInterpretationProjection,
  "projectionName"
> {
  const result = resultCopy.result_213_fbc;
  if (!result) throw new Error("PATIENT_RECORDS_COMMUNICATIONS_217_RESULT_FIXTURE_EMPTY");
  return result;
}

function firstCommunicationCluster(): PatientConversationCluster {
  const cluster = communicationClusters[0];
  if (!cluster) throw new Error("PATIENT_RECORDS_COMMUNICATIONS_217_CLUSTER_FIXTURE_EMPTY");
  return cluster;
}

function makeCluster(input: {
  clusterRef: string;
  title: string;
  preview: string;
  state: ConversationState;
  route: string;
  action: PatientConversationPreviewDigest["dominantNextActionRef"];
  visibilityMode: MessagePreviewMode;
  updatedLabel: string;
}): PatientConversationCluster {
  const placeholder =
    input.visibilityMode === "step_up_required" ||
    input.visibilityMode === "suppressed_recovery_only";
  return {
    projectionName: "PatientConversationCluster",
    clusterRef: input.clusterRef,
    governingObjectRef:
      input.clusterRef === "cluster_214_derm" ? "request_211_a" : input.clusterRef,
    careEpisodeLabel:
      input.clusterRef === "cluster_214_derm" ? "Dermatology" : "Practice communications",
    selectedAnchorRef: `${input.clusterRef}_anchor`,
    clusterRouteRef: input.route,
    previewDigest: {
      projectionName: "PatientConversationPreviewDigest",
      previewDigestRef: `preview_digest_${input.clusterRef}`,
      clusterRef: input.clusterRef,
      title: input.title,
      preview: input.preview,
      state: input.state,
      replyNeededState:
        input.state === "reply_needed"
          ? "needed"
          : input.state === "callback_risk"
            ? "blocked"
            : "not_needed",
      awaitingReviewState: input.state === "awaiting_review" ? "awaiting_review" : "not_awaiting",
      repairRequiredState:
        input.state === "callback_risk" ||
        input.state === "delivery_failed" ||
        input.state === "disputed"
          ? "contact_route"
          : "none",
      dominantNextActionRef: input.action,
      updatedLabel: input.updatedLabel,
    },
    visibility: {
      projectionName: "PatientCommunicationVisibilityProjection",
      communicationVisibilityProjectionId: `communication_visibility_${input.clusterRef}`,
      clusterOrThreadRef: input.clusterRef,
      patientShellConsistencyRef: "patient_shell_consistency_217",
      audienceTier:
        input.visibilityMode === "public_safe_summary" ? "patient_public" : "patient_authenticated",
      releaseState:
        input.visibilityMode === "step_up_required"
          ? "step_up_required"
          : input.visibilityMode === "suppressed_recovery_only"
            ? "recovery_required"
            : "visible",
      stepUpRequirementRef:
        input.visibilityMode === "step_up_required" ? "step_up_214_message_preview" : null,
      visibilityTier: placeholder ? "placeholder_only" : "authenticated",
      summarySafetyTier:
        input.visibilityMode === "suppressed_recovery_only"
          ? "recovery_only"
          : "same_patient_detail",
      minimumNecessaryContractRef: "minimum_necessary_patient_message_preview",
      previewVisibilityContractRef: `preview_visibility_${input.clusterRef}`,
      visibleSnippetRefs: placeholder ? [] : [`snippet_${input.clusterRef}`],
      previewMode: input.visibilityMode,
      placeholderContractRef: placeholder ? `placeholder_${input.clusterRef}` : null,
      hiddenContentReasonRefs: placeholder ? ["preview_limited_by_visibility"] : [],
      safeContinuationRef: input.action,
      latestReceiptEnvelopeRef: `receipt_${input.clusterRef}`,
      latestSettlementRef: `settlement_${input.clusterRef}`,
      experienceContinuityEvidenceRef: `conversation_continuity_${input.clusterRef}`,
      computedAt: "2026-04-16T12:35:00.000Z",
    },
  };
}

function routeKeyFor(pathname: string): RecordsCommunicationsRouteKey {
  if (/^\/records\/results\/[^/]+$/.test(pathname)) return "result_detail";
  if (/^\/records\/documents\/[^/]+$/.test(pathname)) return "document_detail";
  if (/^\/messages\/[^/]+\/thread\/[^/]+$/.test(pathname)) return "message_thread";
  if (/^\/messages\/[^/]+\/callback\/[^/]+$/.test(pathname)) return "message_callback";
  if (/^\/messages\/[^/]+\/repair$/.test(pathname)) return "message_repair";
  if (/^\/messages\/[^/]+$/.test(pathname)) return "message_cluster";
  if (pathname === "/messages") return "messages_index";
  return "records_overview";
}

function resultIdFor(pathname: string): string {
  return pathname.match(/^\/records\/results\/([^/]+)$/)?.[1] ?? "result_213_fbc";
}

function documentIdFor(pathname: string): string {
  return pathname.match(/^\/records\/documents\/([^/]+)$/)?.[1] ?? "document_213_letter";
}

function clusterRefFor(pathname: string): string {
  return pathname.match(/^\/messages\/([^/]+)/)?.[1] ?? "cluster_214_derm";
}

export function isRecordsCommunicationsPath(pathname: string): boolean {
  return (
    pathname === "/records" ||
    /^\/records\/results\/[^/]+$/.test(pathname) ||
    /^\/records\/documents\/[^/]+$/.test(pathname) ||
    pathname === "/messages" ||
    /^\/messages\/[^/]+(?:\/thread\/[^/]+|\/callback\/[^/]+|\/repair)?$/.test(pathname)
  );
}

export function resolveRecordsCommunicationsEntry(
  pathname: string,
): RecordsCommunicationsEntryProjection {
  const routeKey = routeKeyFor(pathname);
  const resultId = resultIdFor(pathname);
  const documentId = documentIdFor(pathname);
  const activeSection =
    routeKey === "records_overview" ||
    routeKey === "result_detail" ||
    routeKey === "document_detail"
      ? "records"
      : "messages";
  const result = resultCopy[resultId] ?? defaultResultInterpretationFixture();
  const documentMode = documentId.includes("source_only")
    ? "governed_download"
    : documentId.includes("restricted")
      ? "placeholder_only"
      : "structured_summary";
  const recordRef =
    routeKey === "document_detail"
      ? documentId.includes("restricted")
        ? "record_213_restricted"
        : documentId.includes("source_only")
          ? "record_213_source_only"
          : "record_213_letter"
      : result.recordRef;
  const delayed = resultId.includes("delayed_release");
  const stepUp = resultId.includes("step_up");
  const restricted = documentId.includes("restricted");
  const placeholder = delayed || stepUp || restricted;
  const releaseState: RecordReleaseState = delayed
    ? "delayed_release"
    : stepUp
      ? "step_up_required"
      : restricted
        ? "restricted"
        : "visible";
  const parityState: VisualizationParityState = placeholder
    ? "placeholder_only"
    : resultId.includes("stale")
      ? "table_only"
      : "visual_and_table";
  const sourceAuthorityState: PatientRecordArtifactProjection["sourceAuthorityState"] = placeholder
    ? "source_only"
    : resultId.includes("stale")
      ? "summary_provisional"
      : documentMode === "governed_download"
        ? "source_only"
        : "summary_verified";
  const summaryParityState: PatientRecordArtifactProjection["summaryParityState"] = placeholder
    ? "source_only"
    : resultId.includes("stale")
      ? "stale"
      : documentMode === "governed_download"
        ? "source_only"
        : "verified";
  const cluster =
    communicationClusters.find((item) => item.clusterRef === clusterRefFor(pathname)) ??
    firstCommunicationCluster();
  const repair =
    routeKey === "message_repair" || cluster.previewDigest.repairRequiredState !== "none";
  const threadId = pathname.match(/\/thread\/([^/]+)$/)?.[1] ?? "thread_214_primary";
  const receiptKind =
    cluster.clusterRef === "cluster_214_dispute"
      ? "disputed"
      : repair
        ? "delivery_failure"
        : "pending";
  const returnBundle = {
    ...makePatientRequestReturnBundle215("request_211_a", "all", "soft_navigation"),
    disclosurePosture: "child_route" as const,
  };

  return {
    projectionName: "PatientRecordsCommunicationsEntryProjection",
    routeKey,
    visualMode: PATIENT_RECORDS_COMMUNICATIONS_VISUAL_MODE,
    pathname,
    activeSection,
    maskedPatientRef: "NHS 943 *** 7812",
    recordReturnBundle: returnBundle,
    recordSurfaceContext: {
      projectionName: "PatientRecordSurfaceContext",
      recordSurfaceContextId: `record_surface_217_${routeKey}`,
      recordRef,
      recordVersionRef: `${recordRef}_v1`,
      patientShellConsistencyRef: "patient_shell_consistency_217",
      recordVisibilityEnvelopeRef: `record_visibility_${recordRef}`,
      recordReleaseGateRef: `record_release_gate_${releaseState}`,
      recordStepUpCheckpointRef: stepUp ? "record_step_up_213_sensitive" : null,
      recordArtifactProjectionRefs: [`record_artifact_projection_${recordRef}`],
      artifactParityDigestRefs: [`artifact_parity_digest_${recordRef}`],
      recordArtifactParityWitnessRefs: [`record_artifact_parity_witness_${recordRef}`],
      summarySafetyTier: placeholder ? "placeholder_only" : "same_patient_detail",
      renderMode:
        routeKey === "document_detail"
          ? "document_summary"
          : routeKey === "result_detail"
            ? "detail"
            : "overview",
      selectedAnchorRef: routeKey === "records_overview" ? "records_overview_anchor" : recordRef,
      oneExpandedItemGroupRef:
        routeKey === "document_detail" ? "letters_documents" : "test_results",
      recordOriginContinuationRef: `record_origin_continuation_${recordRef}`,
      experienceContinuityEvidenceRef: `record_continuity_evidence_${recordRef}`,
      surfaceTupleHash: tuple(`${recordRef}:${releaseState}:${parityState}`),
      continuationState: placeholder ? "blocked" : "aligned",
      surfaceState: placeholder ? "gated_placeholder" : "visible",
    },
    recordSummaryItems,
    resultInterpretation: {
      projectionName: "PatientResultInterpretationProjection",
      ...result,
    },
    resultInsightAlias: {
      projectionName: "PatientResultInsightProjection",
      aliasStrategy: "adapter_alias_only",
      sourceProjectionRef: "PatientResultInterpretationProjection",
    },
    recordArtifact: {
      projectionName: "PatientRecordArtifactProjection",
      recordArtifactProjectionId: `record_artifact_projection_${recordRef}`,
      recordRef,
      recordVersionRef: `${recordRef}_v1`,
      structuredSummaryRef: `structured_summary_${recordRef}`,
      structuredSummaryHash: tuple(`summary:${recordRef}`),
      summaryDerivationPackageRef: `summary_derivation_${recordRef}`,
      sourceArtifactRef: `source_artifact_${recordRef}`,
      sourceArtifactBundleRef: `source_bundle_${recordRef}`,
      sourceArtifactHash: tuple(`source:${recordRef}`),
      artifactPresentationContractRef: "ArtifactPresentationContract::217",
      artifactSurfaceFrameRef: "ArtifactSurfaceFrame::217",
      artifactModeTruthProjectionRef: "ArtifactModeTruthProjection::217",
      binaryArtifactDeliveryRef:
        documentMode === "placeholder_only" ? null : `binary_delivery_${recordRef}`,
      artifactByteGrantRef:
        documentMode === "placeholder_only" ? null : `artifact_byte_grant_${recordRef}`,
      artifactParityDigestRef: `artifact_parity_digest_${recordRef}`,
      recordArtifactParityWitnessRef: `record_artifact_parity_witness_${recordRef}`,
      artifactTransferSettlementRef: `artifact_transfer_settlement_${recordRef}`,
      artifactFallbackDispositionRef: placeholder ? "placeholder_only" : "structured_summary",
      recordVisibilityEnvelopeRef: `record_visibility_${recordRef}`,
      recordReleaseGateRef: `record_release_gate_${releaseState}`,
      recordStepUpCheckpointRef: stepUp ? "record_step_up_213_sensitive" : null,
      recordOriginContinuationRef: `record_origin_continuation_${recordRef}`,
      recoveryContinuationTokenRef: `record_recovery_token_${recordRef}`,
      presentationMode:
        routeKey === "document_detail"
          ? documentMode
          : placeholder
            ? "placeholder_only"
            : "governed_preview",
      downloadEligibilityState: documentMode === "placeholder_only" ? "gated" : "secondary",
      embeddedNavigationGrantRef:
        documentMode === "placeholder_only" ? null : "OutboundNavigationGrant::record_artifact_217",
      summaryParityState,
      sourceAuthorityState,
      parityTupleHash: tuple(`artifact:${recordRef}:${sourceAuthorityState}`),
      generatedAt: "2026-04-16T12:35:00.000Z",
    },
    parityWitness: {
      projectionName: "RecordArtifactParityWitness",
      recordArtifactParityWitnessRef: `record_artifact_parity_witness_${recordRef}`,
      recordRef,
      summaryParityState,
      sourceAuthorityState,
      recordGateState: delayed
        ? "delayed_release"
        : stepUp
          ? "step_up_required"
          : restricted
            ? "restricted"
            : "visible",
      visualizationParityState: parityState,
      parityTupleHash: tuple(`artifact:${recordRef}:${sourceAuthorityState}`),
    },
    followUpEligibility: {
      projectionName: "PatientRecordFollowUpEligibilityProjection",
      recordFollowUpEligibilityId: `record_follow_up_eligibility_${recordRef}`,
      recordRef,
      recordVersionRef: `${recordRef}_v1`,
      recordActionContextTokenRef: `record_action_context_${recordRef}`,
      recordOriginContinuationRef: `record_origin_continuation_${recordRef}`,
      capabilityRef: "message_practice_about_record",
      releaseState,
      visibilityTier: placeholder ? "placeholder_only" : "full",
      allowedNextActionRefs: placeholder ? [] : ["message_practice_about_record"],
      blockingDependencyRefs: placeholder ? [`record_gate_${releaseState}`] : [],
      eligibilityFenceState: placeholder ? "blocked" : "aligned",
      eligibilityState: placeholder ? "gated" : "available",
    },
    recordContinuity: {
      projectionName: "PatientRecordContinuityState",
      recordContinuityStateId: `record_continuity_${recordRef}`,
      recordRef,
      recordVersionRef: `${recordRef}_v1`,
      selectedAnchorRef: recordRef,
      oneExpandedItemGroupRef:
        routeKey === "document_detail" ? "letters_documents" : "test_results",
      recordOriginContinuationRef: `record_origin_continuation_${recordRef}`,
      recoveryContinuationTokenRef: `record_recovery_token_${recordRef}`,
      summarySafetyTier: placeholder ? "placeholder_only" : "same_patient_detail",
      placeholderContractRef: placeholder ? `record_placeholder_${releaseState}` : null,
      continuationState: delayed
        ? "delayed_release"
        : stepUp
          ? "awaiting_step_up"
          : restricted
            ? "blocked"
            : "stable",
    },
    visualizationFallback: {
      projectionName: "VisualizationFallbackContract",
      fallbackRef: `visualization_fallback_${recordRef}`,
      allowedFallbackModes: placeholder
        ? ["placeholder"]
        : parityState === "table_only"
          ? ["table", "summary"]
          : ["chart", "table", "summary"],
      demotionReasonRef:
        parityState === "table_only"
          ? "PORTAL_213_VISUALIZATION_TABLE_FALLBACK"
          : placeholder
            ? `PORTAL_213_${releaseState.toUpperCase()}_PLACEHOLDER`
            : null,
    },
    visualizationTable: {
      projectionName: "VisualizationTableContract",
      tableRef: `visualization_table_${recordRef}`,
      units: result.displayUnit,
      selectionContextRef: result.trendWindowRef,
      rows: [
        {
          collectedAt: "2026-04-15",
          value: result.displayValue,
          unit: result.displayUnit,
          referenceRange: result.referenceRangeRef,
          source: result.sourceOrganisationRef,
        },
        {
          collectedAt: "2026-01-18",
          value: resultId.includes("stale") ? "76" : "128",
          unit: result.displayUnit,
          referenceRange: result.referenceRangeRef,
          source: result.sourceOrganisationRef,
        },
      ],
    },
    visualizationParity: {
      projectionName: "VisualizationParityProjection",
      visualizationParityProjectionId: `visualization_parity_${recordRef}`,
      parityState,
      unitsPreserved: true,
      selectionContextPreserved: true,
      filterContextRef: result.trendWindowRef,
      tableContractRef: `visualization_table_${recordRef}`,
      fallbackContractRef: `visualization_fallback_${recordRef}`,
    },
    communicationsTimeline: {
      projectionName: "PatientCommunicationsTimelineProjection",
      communicationsTimelineProjectionId: "communications_timeline_217",
      clusters: communicationClusters,
      selectedClusterRef: activeSection === "messages" ? cluster.clusterRef : null,
      conversationContinuityEvidenceRef: "conversation_continuity_evidence_217",
      computedAt: "2026-04-16T12:35:00.000Z",
    },
    activeCluster: cluster,
    conversationThread: {
      projectionName: "ConversationThreadProjection",
      threadId,
      clusterRef: cluster.clusterRef,
      threadTupleHash: tuple(`${cluster.clusterRef}:${threadId}`),
      receiptGrammarVersionRef: "receipt_grammar_214_v1",
      monotoneRevision: repair ? 7 : 5,
      previewVisibilityContractRef: cluster.visibility.previewVisibilityContractRef,
      summarySafetyTier: cluster.visibility.summarySafetyTier,
      subject: cluster.previewDigest.title,
      composerLeaseRef: `composer_lease_${cluster.clusterRef}`,
    },
    subthreads: makeSubthreads(cluster, receiptKind),
    callbackCard: {
      projectionName: "ConversationCallbackCardProjection",
      callbackCardProjectionRef: `callback_card_${cluster.clusterRef}`,
      sourceProjection: "PatientCallbackStatusProjection",
      patientVisibleState: repair ? "route_repair_required" : "scheduled",
      windowRiskState: repair ? "repair_required" : "on_track",
      callbackExpectationEnvelopeRef: "CallbackExpectationEnvelope::217_cluster",
    },
    callbackStatus: {
      projectionName: "PatientCallbackStatusProjection",
      callbackStatusProjectionId: `callback_status_${cluster.clusterRef}`,
      patientVisibleState: repair ? "route_repair_required" : "scheduled",
      windowRiskState: repair ? "repair_required" : "on_track",
      dominantActionRef: repair ? "contact_route_repair" : "view_callback",
    },
    receiptEnvelope: {
      projectionName: "PatientReceiptEnvelope",
      receiptEnvelopeRef: `receipt_${cluster.clusterRef}`,
      localAckState: "shown",
      transportAckState: receiptKind === "delivery_failure" ? "failed" : "accepted",
      deliveryEvidenceState: receiptKind,
      deliveryRiskState:
        receiptKind === "disputed"
          ? "disputed"
          : receiptKind === "delivery_failure"
            ? "failed"
            : "clear",
      receiptLabel:
        receiptKind === "disputed"
          ? "Provider dispute visible"
          : receiptKind === "delivery_failure"
            ? "Reminder delivery failed"
            : "Awaiting authoritative review",
    },
    commandSettlement: {
      projectionName: "ConversationCommandSettlement",
      commandSettlementRef: `settlement_${cluster.clusterRef}`,
      authoritativeOutcomeState:
        cluster.previewDigest.state === "awaiting_review"
          ? "awaiting_review"
          : repair
            ? "recovery_required"
            : "pending",
      calmSettledLanguageAllowed: false,
    },
    composerLease: {
      projectionName: "PatientComposerLease",
      composerLeaseRef: `composer_lease_${cluster.clusterRef}`,
      selectedAnchorRef: cluster.selectedAnchorRef,
      leaseState:
        repair || cluster.visibility.previewMode !== "authenticated_summary"
          ? "blocked"
          : "available",
      blockedReasonRef: repair
        ? "contact_route_repair_required"
        : cluster.visibility.placeholderContractRef,
    },
    timelineAnchor: {
      projectionName: "ConversationTimelineAnchor",
      anchorRef: `timeline_anchor_${cluster.clusterRef}`,
      clusterRef: cluster.clusterRef,
      selectedSubthreadRef: "subthread_214_latest",
      continuityEvidenceRef: cluster.visibility.experienceContinuityEvidenceRef,
    },
    sourceProjectionRefs: [
      "PatientRecordSurfaceContext",
      "PatientResultInterpretationProjection",
      "PatientResultInsightProjection",
      "PatientRecordArtifactProjection",
      "RecordArtifactParityWitness",
      "PatientRecordFollowUpEligibilityProjection",
      "PatientRecordContinuityState",
      "VisualizationFallbackContract",
      "VisualizationTableContract",
      "VisualizationParityProjection",
      "PatientCommunicationsTimelineProjection",
      "PatientConversationCluster",
      "ConversationThreadProjection",
      "ConversationSubthreadProjection",
      "PatientConversationPreviewDigest",
      "PatientCommunicationVisibilityProjection",
      "ConversationCallbackCardProjection",
      "PatientCallbackStatusProjection",
      "PatientReceiptEnvelope",
      "ConversationCommandSettlement",
      "PatientComposerLease",
      "ConversationTimelineAnchor",
    ],
  };
}

function makeSubthreads(
  cluster: PatientConversationCluster,
  receiptKind: PatientReceiptEnvelope["deliveryEvidenceState"],
): readonly ConversationSubthreadProjection[] {
  return [
    {
      projectionName: "ConversationSubthreadProjection",
      subthreadRef: "subthread_214_latest",
      threadId: "thread_214_primary",
      subthreadType:
        cluster.previewDigest.state === "callback_risk" ? "callback" : "clinician_reply",
      timestampLabel: cluster.previewDigest.updatedLabel,
      title: cluster.previewDigest.title,
      body: cluster.visibility.placeholderContractRef
        ? "Preview is limited by the current visibility envelope. The item stays visible as a governed placeholder."
        : cluster.previewDigest.preview,
      visibilityProjectionRef: cluster.visibility.communicationVisibilityProjectionId,
      receiptEnvelopeRef: cluster.visibility.latestReceiptEnvelopeRef,
    },
    {
      projectionName: "ConversationSubthreadProjection",
      subthreadRef: "subthread_214_receipt",
      threadId: "thread_214_primary",
      subthreadType:
        receiptKind === "delivery_failure" || receiptKind === "disputed" ? "reminder" : "receipt",
      timestampLabel: "Receipt state",
      title:
        receiptKind === "disputed"
          ? "Provider-channel dispute visible"
          : receiptKind === "delivery_failure"
            ? "Reminder delivery failed"
            : "Reply is awaiting review",
      body:
        receiptKind === "pending"
          ? "Local acknowledgement is not final settlement. The shell waits for the authoritative outcome."
          : "The delivery issue remains in the same chronology until repaired.",
      visibilityProjectionRef: cluster.visibility.communicationVisibilityProjectionId,
      receiptEnvelopeRef: cluster.visibility.latestReceiptEnvelopeRef,
    },
  ];
}
