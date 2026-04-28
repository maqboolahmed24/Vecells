export const RECEIPT_STATUS_PARITY_TASK_ID = "par_201";
export const RECEIPT_STATUS_PARITY_VISUAL_MODE = "Parity_Status_Atlas";
export const RECEIPT_STATUS_PARITY_ENTRY = "/portal/receipt-status-parity";
export const RECEIPT_STATUS_PARITY_ROUTE_FAMILY = "rf_cross_channel_receipt_status_parity";
export const RECEIPT_STATUS_CANONICAL_REQUEST_ID = "REQ-4219";

export type ReceiptChannelContext =
  | "web_public"
  | "authenticated"
  | "phone_origin"
  | "sms_continuation";

export type ReceiptSurfaceKind =
  | "receipt_page"
  | "request_list_row"
  | "request_detail_header"
  | "signed_out_minimal_status";

export type CanonicalStatusState =
  | "provisional"
  | "confirmed"
  | "pending_review"
  | "awaiting_more_information"
  | "blocked"
  | "settled";

export type CanonicalEtaBucket =
  | "same_day"
  | "next_working_day"
  | "within_2_working_days"
  | "after_2_working_days"
  | "not_applicable";

export type CanonicalPromiseState =
  | "on_track"
  | "pending_review"
  | "waiting_for_patient"
  | "recovery_required"
  | "settled";

export type AudienceCoverageMode = "public_safe" | "authenticated_summary" | "authenticated_detail";

export type RecoveryPosture =
  | "not_required"
  | "same_shell_restore"
  | "contact_repair_required"
  | "bounded_recovery";

export type ProvenanceNoteId =
  | "started_on_web"
  | "signed_in_to_continue"
  | "started_by_phone"
  | "added_more_detail_after_call"
  | "used_sms_continuation";

export interface PatientReceiptConsistencyEnvelope {
  projectionName: "PatientReceiptConsistencyEnvelope";
  consistencyEnvelopeId: "PHASE2_PATIENT_RECEIPT_STATUS_PARITY_ENVELOPE_V1";
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  requestLineageRef: string;
  canonicalMeaningHash: string;
  sameFactsSameSafetyKey: string;
}

export interface PatientReceiptEnvelope {
  projectionName: "PatientReceiptEnvelope";
  requestId: typeof RECEIPT_STATUS_CANONICAL_REQUEST_ID;
  canonicalStatusState: CanonicalStatusState;
  etaBucket: CanonicalEtaBucket;
  promiseState: CanonicalPromiseState;
  recoveryPosture: RecoveryPosture;
  nextSafeAction: string;
  receiptIssued: boolean;
}

export interface PatientAudienceCoverageProjection {
  projectionName: "PatientAudienceCoverageProjection";
  mode: AudienceCoverageMode;
  allowedFields: readonly string[];
  suppressedFields: readonly string[];
  publicSafeNarrowingApplied: boolean;
}

export interface PatientRequestSummaryProjection {
  projectionName: "PatientRequestSummaryProjection";
  requestId: typeof RECEIPT_STATUS_CANONICAL_REQUEST_ID;
  title: string;
  canonicalTruthRef: string;
  statusState: CanonicalStatusState;
  etaBucket: CanonicalEtaBucket;
  promiseState: CanonicalPromiseState;
}

export interface PatientRequestDetailProjection {
  projectionName: "PatientRequestDetailProjection";
  requestId: typeof RECEIPT_STATUS_CANONICAL_REQUEST_ID;
  title: string;
  canonicalTruthRef: string;
  patientSafeDetail: string;
  statusState: CanonicalStatusState;
  etaBucket: CanonicalEtaBucket;
  promiseState: CanonicalPromiseState;
}

export interface ProvenanceContextNote {
  noteId: ProvenanceNoteId;
  label: string;
  body: string;
  additiveOnly: true;
  primaryStatusForbidden: true;
}

export interface SharedStatusGrammarEntry {
  statusState: CanonicalStatusState;
  statusHeadline: string;
  explanation: string;
  etaBucket: CanonicalEtaBucket;
  etaLabel: string;
  promiseState: CanonicalPromiseState;
  promiseLabel: string;
  nextSafeAction: string;
  recoveryPosture: RecoveryPosture;
  tone: "active" | "waiting" | "settled" | "recovery";
}

export interface ReceiptStatusSurfaceProjection {
  projectionName: "ReceiptStatusSurfaceProjection";
  taskId: typeof RECEIPT_STATUS_PARITY_TASK_ID;
  visualMode: typeof RECEIPT_STATUS_PARITY_VISUAL_MODE;
  channelContext: ReceiptChannelContext;
  surfaceKind: ReceiptSurfaceKind;
  audienceCoverage: PatientAudienceCoverageProjection;
  consistencyEnvelope: PatientReceiptConsistencyEnvelope;
  receiptEnvelope: PatientReceiptEnvelope;
  requestSummary: PatientRequestSummaryProjection;
  requestDetail: PatientRequestDetailProjection;
  grammar: SharedStatusGrammarEntry;
  provenanceNotes: readonly ProvenanceContextNote[];
  provenanceNotesArePrimaryStatus: false;
  semanticStatusKey: string;
  sameStatusMeaningAcrossChannels: true;
}

export interface ReceiptParityRouteProjection {
  projectionName: "ReceiptParityRouteProjection";
  taskId: typeof RECEIPT_STATUS_PARITY_TASK_ID;
  visualMode: typeof RECEIPT_STATUS_PARITY_VISUAL_MODE;
  routeFamily: typeof RECEIPT_STATUS_PARITY_ROUTE_FAMILY;
  pathname: string;
  selectedChannel: ReceiptChannelContext;
  selectedSurface: ReceiptStatusSurfaceProjection;
  channelSurfaces: readonly ReceiptStatusSurfaceProjection[];
  listSurface: ReceiptStatusSurfaceProjection;
  detailSurface: ReceiptStatusSurfaceProjection;
  signedOutSurface: ReceiptStatusSurfaceProjection;
  outcomeBridge: {
    projectionName: "ReceiptOutcomeBridgeProjection";
    sourceReceiptKey: string;
    sourceStatusKey: string;
    listRowAgreesWithReceipt: true;
    detailHeaderAgreesWithReceipt: true;
    publicSafeNarrowingChangesCoreMeaning: false;
    mappedRecoveryOutcome: RecoveryPosture;
  };
}

const statusGrammar: Record<CanonicalStatusState, SharedStatusGrammarEntry> = {
  provisional: {
    statusState: "provisional",
    statusHeadline: "We are checking your request",
    explanation:
      "The request is captured, but the receipt is still provisional until the request line settles.",
    etaBucket: "within_2_working_days",
    etaLabel: "Within 2 working days",
    promiseState: "pending_review",
    promiseLabel: "Pending confirmation",
    nextSafeAction: "Keep this reference and check the same status page.",
    recoveryPosture: "same_shell_restore",
    tone: "active",
  },
  confirmed: {
    statusState: "confirmed",
    statusHeadline: "Your request has been received",
    explanation: "The request has a confirmed receipt and is waiting for the first review step.",
    etaBucket: "within_2_working_days",
    etaLabel: "Within 2 working days",
    promiseState: "on_track",
    promiseLabel: "On track",
    nextSafeAction: "You do not need to do anything else right now.",
    recoveryPosture: "not_required",
    tone: "active",
  },
  pending_review: {
    statusState: "pending_review",
    statusHeadline: "Your request is being reviewed",
    explanation:
      "The first review pass is under way. We will update this same request if anything changes.",
    etaBucket: "within_2_working_days",
    etaLabel: "Within 2 working days",
    promiseState: "on_track",
    promiseLabel: "On track",
    nextSafeAction: "Wait for the review update in this same request.",
    recoveryPosture: "not_required",
    tone: "active",
  },
  awaiting_more_information: {
    statusState: "awaiting_more_information",
    statusHeadline: "We need one more detail from you",
    explanation:
      "The review is paused until you add the requested detail. The request reference stays the same.",
    etaBucket: "next_working_day",
    etaLabel: "Next working day after your reply",
    promiseState: "waiting_for_patient",
    promiseLabel: "Waiting for you",
    nextSafeAction: "Open the request and add the requested detail.",
    recoveryPosture: "same_shell_restore",
    tone: "waiting",
  },
  blocked: {
    statusState: "blocked",
    statusHeadline: "A repair is needed before this request can move",
    explanation:
      "The current path is blocked, so the safest next step is the governed repair action.",
    etaBucket: "after_2_working_days",
    etaLabel: "After repair",
    promiseState: "recovery_required",
    promiseLabel: "Recovery required",
    nextSafeAction: "Repair the blocked path, then return to this request.",
    recoveryPosture: "contact_repair_required",
    tone: "recovery",
  },
  settled: {
    statusState: "settled",
    statusHeadline: "This request is complete",
    explanation: "The routine review path is settled and this page is now a quiet reference.",
    etaBucket: "not_applicable",
    etaLabel: "No wait",
    promiseState: "settled",
    promiseLabel: "Settled",
    nextSafeAction: "Keep the reference if you need it later.",
    recoveryPosture: "not_required",
    tone: "settled",
  },
};

const provenanceAllowlist: Record<ProvenanceNoteId, ProvenanceContextNote> = {
  started_on_web: {
    noteId: "started_on_web",
    label: "Started on web",
    body: "This explains the entry point only; it does not change the status.",
    additiveOnly: true,
    primaryStatusForbidden: true,
  },
  signed_in_to_continue: {
    noteId: "signed_in_to_continue",
    label: "Signed in to continue",
    body: "Sign-in restored the same request lineage.",
    additiveOnly: true,
    primaryStatusForbidden: true,
  },
  started_by_phone: {
    noteId: "started_by_phone",
    label: "Started by phone",
    body: "The call created the same canonical request truth.",
    additiveOnly: true,
    primaryStatusForbidden: true,
  },
  added_more_detail_after_call: {
    noteId: "added_more_detail_after_call",
    label: "Added more detail after your call",
    body: "This clarifies sequence without creating a phone-only status.",
    additiveOnly: true,
    primaryStatusForbidden: true,
  },
  used_sms_continuation: {
    noteId: "used_sms_continuation",
    label: "Used SMS continuation",
    body: "The secure link continued the same request lineage.",
    additiveOnly: true,
    primaryStatusForbidden: true,
  },
};

function notesForChannel(channel: ReceiptChannelContext): readonly ProvenanceContextNote[] {
  switch (channel) {
    case "web_public":
      return [provenanceAllowlist.started_on_web];
    case "authenticated":
      return [provenanceAllowlist.started_on_web, provenanceAllowlist.signed_in_to_continue];
    case "phone_origin":
      return [
        provenanceAllowlist.started_by_phone,
        provenanceAllowlist.added_more_detail_after_call,
      ];
    case "sms_continuation":
      return [provenanceAllowlist.started_by_phone, provenanceAllowlist.used_sms_continuation];
  }
}

function audienceForChannel(channel: ReceiptChannelContext): PatientAudienceCoverageProjection {
  if (channel === "web_public") {
    return {
      projectionName: "PatientAudienceCoverageProjection",
      mode: "public_safe",
      allowedFields: ["reference", "statusHeadline", "etaBucket", "nextSafeAction"],
      suppressedFields: ["messageBodies", "attachmentNames", "staffNotes", "fullPatientIdentifier"],
      publicSafeNarrowingApplied: true,
    };
  }
  if (channel === "authenticated") {
    return {
      projectionName: "PatientAudienceCoverageProjection",
      mode: "authenticated_detail",
      allowedFields: [
        "reference",
        "statusHeadline",
        "etaBucket",
        "nextSafeAction",
        "safeRequestSummary",
        "sameLineageDetail",
      ],
      suppressedFields: ["staffNotes", "rawIdentifiers", "clinicalReasoning"],
      publicSafeNarrowingApplied: false,
    };
  }
  return {
    projectionName: "PatientAudienceCoverageProjection",
    mode: "authenticated_summary",
    allowedFields: ["reference", "statusHeadline", "etaBucket", "nextSafeAction", "channelNote"],
    suppressedFields: ["messageBodies", "attachmentPreviews", "staffNotes", "rawIdentifiers"],
    publicSafeNarrowingApplied: false,
  };
}

function channelForPath(pathname: string): ReceiptChannelContext {
  if (pathname.startsWith("/status/")) {
    return "web_public";
  }
  if (pathname.startsWith("/phone/")) {
    return "phone_origin";
  }
  if (pathname.startsWith("/continue/")) {
    return "sms_continuation";
  }
  return "authenticated";
}

function stateForPath(pathname: string): CanonicalStatusState {
  if (pathname.includes("/provisional")) {
    return "provisional";
  }
  if (pathname.includes("/more-info")) {
    return "awaiting_more_information";
  }
  if (pathname.includes("/blocked")) {
    return "blocked";
  }
  if (pathname.includes("/settled")) {
    return "settled";
  }
  if (pathname.includes("/confirmed")) {
    return "confirmed";
  }
  return "pending_review";
}

function consistencyEnvelopeFor(state: CanonicalStatusState): PatientReceiptConsistencyEnvelope {
  return {
    projectionName: "PatientReceiptConsistencyEnvelope",
    consistencyEnvelopeId: "PHASE2_PATIENT_RECEIPT_STATUS_PARITY_ENVELOPE_V1",
    receiptConsistencyKey: `receipt_consistency::${RECEIPT_STATUS_CANONICAL_REQUEST_ID}::${state}`,
    statusConsistencyKey: `status_consistency::${RECEIPT_STATUS_CANONICAL_REQUEST_ID}::${state}`,
    requestLineageRef: `lineage::${RECEIPT_STATUS_CANONICAL_REQUEST_ID}`,
    canonicalMeaningHash: `meaning_hash::${state}::within_single_pipeline`,
    sameFactsSameSafetyKey: `same_facts_same_safety::${RECEIPT_STATUS_CANONICAL_REQUEST_ID}`,
  };
}

function buildSurface(
  channelContext: ReceiptChannelContext,
  surfaceKind: ReceiptSurfaceKind,
  statusState: CanonicalStatusState,
): ReceiptStatusSurfaceProjection {
  const grammar = statusGrammar[statusState];
  const consistencyEnvelope = consistencyEnvelopeFor(statusState);
  const receiptEnvelope: PatientReceiptEnvelope = {
    projectionName: "PatientReceiptEnvelope",
    requestId: RECEIPT_STATUS_CANONICAL_REQUEST_ID,
    canonicalStatusState: statusState,
    etaBucket: grammar.etaBucket,
    promiseState: grammar.promiseState,
    recoveryPosture: grammar.recoveryPosture,
    nextSafeAction: grammar.nextSafeAction,
    receiptIssued: statusState !== "provisional",
  };
  const requestSummary: PatientRequestSummaryProjection = {
    projectionName: "PatientRequestSummaryProjection",
    requestId: RECEIPT_STATUS_CANONICAL_REQUEST_ID,
    title: "Dermatology photo timing",
    canonicalTruthRef: `request_truth::${RECEIPT_STATUS_CANONICAL_REQUEST_ID}::${statusState}`,
    statusState,
    etaBucket: grammar.etaBucket,
    promiseState: grammar.promiseState,
  };
  const audienceCoverage = audienceForChannel(channelContext);
  const requestDetail: PatientRequestDetailProjection = {
    projectionName: "PatientRequestDetailProjection",
    requestId: RECEIPT_STATUS_CANONICAL_REQUEST_ID,
    title: "Dermatology photo timing",
    canonicalTruthRef: requestSummary.canonicalTruthRef,
    patientSafeDetail:
      audienceCoverage.mode === "public_safe"
        ? "Public-safe view: detail is narrowed, but the status meaning is unchanged."
        : "The same request lineage carries receipt, list-row, and detail status without channel-specific semantics.",
    statusState,
    etaBucket: grammar.etaBucket,
    promiseState: grammar.promiseState,
  };
  return {
    projectionName: "ReceiptStatusSurfaceProjection",
    taskId: RECEIPT_STATUS_PARITY_TASK_ID,
    visualMode: RECEIPT_STATUS_PARITY_VISUAL_MODE,
    channelContext,
    surfaceKind,
    audienceCoverage,
    consistencyEnvelope,
    receiptEnvelope,
    requestSummary,
    requestDetail,
    grammar,
    provenanceNotes: notesForChannel(channelContext),
    provenanceNotesArePrimaryStatus: false,
    semanticStatusKey: `${statusState}|${grammar.etaBucket}|${grammar.promiseState}|${grammar.recoveryPosture}`,
    sameStatusMeaningAcrossChannels: true,
  };
}

export function ReceiptParityResolver(pathname: string): ReceiptParityRouteProjection {
  const selectedChannel = channelForPath(pathname);
  const selectedState = stateForPath(pathname);
  const selectedSurface = buildSurface(selectedChannel, "receipt_page", selectedState);
  const channelSurfaces: readonly ReceiptStatusSurfaceProjection[] = [
    buildSurface("web_public", "receipt_page", selectedState),
    buildSurface("authenticated", "receipt_page", selectedState),
    buildSurface("phone_origin", "receipt_page", selectedState),
    buildSurface("sms_continuation", "receipt_page", selectedState),
  ];
  const listSurface = buildSurface("authenticated", "request_list_row", selectedState);
  const detailSurface = buildSurface("authenticated", "request_detail_header", selectedState);
  const signedOutSurface = buildSurface("web_public", "signed_out_minimal_status", selectedState);
  return {
    projectionName: "ReceiptParityRouteProjection",
    taskId: RECEIPT_STATUS_PARITY_TASK_ID,
    visualMode: RECEIPT_STATUS_PARITY_VISUAL_MODE,
    routeFamily: RECEIPT_STATUS_PARITY_ROUTE_FAMILY,
    pathname,
    selectedChannel,
    selectedSurface,
    channelSurfaces,
    listSurface,
    detailSurface,
    signedOutSurface,
    outcomeBridge: {
      projectionName: "ReceiptOutcomeBridgeProjection",
      sourceReceiptKey: selectedSurface.consistencyEnvelope.receiptConsistencyKey,
      sourceStatusKey: selectedSurface.consistencyEnvelope.statusConsistencyKey,
      listRowAgreesWithReceipt: true,
      detailHeaderAgreesWithReceipt: true,
      publicSafeNarrowingChangesCoreMeaning: false,
      mappedRecoveryOutcome: selectedSurface.grammar.recoveryPosture,
    },
  };
}

export function isCrossChannelReceiptStatusParityPath(pathname: string): boolean {
  return (
    pathname === RECEIPT_STATUS_PARITY_ENTRY ||
    pathname.startsWith(`${RECEIPT_STATUS_PARITY_ENTRY}/`) ||
    pathname.startsWith("/status/") ||
    pathname.startsWith("/phone/receipt/") ||
    pathname.startsWith("/continue/receipt/")
  );
}
