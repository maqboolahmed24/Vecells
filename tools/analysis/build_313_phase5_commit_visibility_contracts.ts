import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const TODAY = new Date().toISOString().slice(0, 10);

const TASK_ID =
  "seq_313_phase5_freeze_cross_org_booking_commit_and_practice_visibility_contracts";
const SHORT_TASK_ID = "seq_313";
const CONTRACT_VERSION = "313.phase5.commit-visibility-freeze.v1";
const VISUAL_MODE = "Phase5_Commit_Confirmation_Practice_Visibility_Atlas";

const SOURCE_REFS = {
  phase5Offers:
    "blueprint/phase-5-the-network-horizon.md#5E. Alternative offer generation, open choice, callback fallback, and patient continuity",
  phase5Commit:
    "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
  phase5Visibility:
    "blueprint/phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility",
  phaseCards: "blueprint/phase-cards.md#Card-6",
  phase4Truth:
    "blueprint/phase-4-the-booking-engine.md#booking-truth-confirmation-and-practice-visibility-carry-forward",
  phase4Manage:
    "blueprint/phase-4-the-booking-engine.md#manage-and-artifact-exposure-must-follow-current-truth",
  phase0Replay:
    "blueprint/phase-0-the-foundation-protocol.md#replay-idempotency-and-external-effect-discipline",
  phase0Receipt:
    "blueprint/phase-0-the-foundation-protocol.md#adapter-receipts-checkpoints-and-external-settlement",
  phase311Hub:
    "docs/architecture/311_phase5_hub_case_and_acting_context_contract.md",
  phase312Policy:
    "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
  phase312Rank:
    "docs/api/312_phase5_candidate_snapshot_and_rank_contract.md",
};

const ALL_SOURCE_REFS = Object.values(SOURCE_REFS);

type GapSeam = {
  seamId: string;
  fileName: string;
  ownerTask: string;
  area: string;
  purpose: string;
  consumerRefs: string[];
  requiredObjects: Array<{
    objectName: string;
    status: string;
    requiredFields: string[];
  }>;
};

type MessageRow = {
  messageId: string;
  label: string;
  channel: string;
  transportState: string;
  deliveryState: string;
  ackEvidenceState: string;
  ackGeneration: number;
  projectionState: string;
  note: string;
};

type TruthState = {
  stateId: string;
  label: string;
  railNote: string;
  summary: string;
  projection: {
    offerState: string;
    confirmationTruthState: string;
    patientConfirmationState: string;
    practiceVisibilityState: string;
    closureState: string;
    fallbackLinkageState: string;
  };
  tupleRows: Array<{ field: string; value: string }>;
  blockerRows: Array<{ blockerId: string; label: string; impact: string }>;
  manage: {
    capabilityState: string;
    readOnlyMode: string;
    allowedActions: string[];
    blockers: string[];
  };
  lanes: {
    patientChoice: { title: string; cue: string; bullets: string[] };
    commitEvidence: { title: string; cue: string; bullets: string[] };
    patientConfirmation: { title: string; cue: string; bullets: string[] };
    practiceVisibility: { title: string; cue: string; bullets: string[] };
  };
  messageRows: MessageRow[];
  ackRows: Array<{
    generation: number;
    status: string;
    source: string;
    clearsDebt: boolean;
    note: string;
  }>;
};

function repoPath(relative: string): string {
  return path.join(ROOT, relative);
}

function writeText(relative: string, content: string): void {
  const filePath = repoPath(relative);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trimEnd()}\n`, "utf8");
}

function writeJson(relative: string, payload: unknown): void {
  writeText(relative, JSON.stringify(payload, null, 2));
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(
  relative: string,
  rows: Array<Record<string, unknown>>,
  fieldnames: string[],
): void {
  const header = fieldnames.join(",");
  const body = rows.map((row) => fieldnames.map((field) => escapeCsvCell(row[field])).join(","));
  writeText(relative, [header, ...body].join("\n"));
}

function mdTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`,
  );
  return [head, rule, ...body].join("\n");
}

function hashOf(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function refField(description: string, nullable = false): Record<string, unknown> {
  return {
    type: nullable ? ["string", "null"] : "string",
    minLength: nullable ? 0 : 1,
    description,
  };
}

function dateTimeField(description: string, nullable = false): Record<string, unknown> {
  return {
    type: nullable ? ["string", "null"] : "string",
    format: "date-time",
    description,
  };
}

function integerField(description: string, minimum?: number): Record<string, unknown> {
  return {
    type: "integer",
    ...(typeof minimum === "number" ? { minimum } : {}),
    description,
  };
}

function numberField(
  description: string,
  minimum?: number,
  maximum?: number,
): Record<string, unknown> {
  return {
    type: "number",
    ...(typeof minimum === "number" ? { minimum } : {}),
    ...(typeof maximum === "number" ? { maximum } : {}),
    description,
  };
}

function booleanField(description: string): Record<string, unknown> {
  return { type: "boolean", description };
}

function enumField(values: readonly string[], description: string): Record<string, unknown> {
  return {
    type: "string",
    enum: [...values],
    description,
  };
}

function stringArrayField(description: string, minItems = 0): Record<string, unknown> {
  return {
    type: "array",
    minItems,
    items: { type: "string", minLength: 1 },
    description,
  };
}

function schemaDocument(
  fileName: string,
  title: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[],
): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://vecells.local/contracts/${fileName}`,
    title,
    description,
    type: "object",
    additionalProperties: false,
    properties,
    required,
    "x-taskId": SHORT_TASK_ID,
    "x-contractVersion": CONTRACT_VERSION,
    "x-sourceRefs": ALL_SOURCE_REFS,
  };
}

const OFFER_SESSION_STATES = [
  "live",
  "selected",
  "callback_selected",
  "expired",
  "superseded",
  "closed",
] as const;
const OFFER_ENTRY_SELECTION_STATES = [
  "offerable",
  "selected",
  "expired",
  "superseded",
  "withdrawn",
] as const;
const FALLBACK_KINDS = ["callback_request", "return_to_practice", "urgent_bounce_back"] as const;
const COMMIT_MODES = ["native_api", "manual_pending_confirmation", "imported_confirmation"] as const;
const COMMIT_ATTEMPT_STATES = [
  "draft",
  "executing",
  "awaiting_confirmation",
  "reconciliation_required",
  "disputed",
  "confirmed",
  "failed",
  "superseded",
] as const;
const INDEPENDENT_CONFIRMATION_STATES = ["none", "pending", "disputed", "confirmed"] as const;
const HARD_MATCH_RESULTS = ["pending", "passed", "failed"] as const;
const APPOINTMENT_STATES = [
  "pending_confirmation",
  "confirmed_pending_practice_ack",
  "confirmed",
  "disputed",
  "cancelled",
] as const;
const EXTERNAL_CONFIRMATION_STATES = ["none", "pending", "disputed", "confirmed"] as const;
const PRACTICE_ACK_STATES = [
  "not_required",
  "ack_pending",
  "acknowledged",
  "exception_recorded",
  "superseded",
] as const;
const OFFER_TO_CONFIRMATION_OFFER_STATES = [
  "no_live_offer",
  "live_offer",
  "selected",
  "fallback_selected",
  "superseded",
] as const;
const CONFIRMATION_TRUTH_STATES = [
  "offer_only",
  "commit_pending",
  "confirmation_pending",
  "confirmed_pending_practice_ack",
  "confirmed",
  "disputed",
  "blocked_by_drift",
] as const;
const PATIENT_CONFIRMATION_STATES = [
  "not_shown",
  "pending_copy",
  "calm_confirmed",
  "blocked",
] as const;
const PRACTICE_VISIBILITY_STATES = [
  "not_informed",
  "transport_pending",
  "delivered_pending_ack",
  "ack_pending",
  "acknowledged",
  "stale_generation",
  "blocked",
] as const;
const CLOSURE_STATES = ["not_closable", "closable", "closed"] as const;
const FALLBACK_LINKAGE_STATES = [
  "none",
  "callback_pending",
  "callback_linked",
  "returned_to_practice",
  "linkage_debt",
] as const;
const CONTINUITY_CHANNELS = ["mesh", "direct_api", "manual_secure_mail", "internal_transfer"] as const;
const TRANSPORT_STATES = ["not_dispatched", "queued", "accepted", "rejected"] as const;
const DELIVERY_STATES = ["unknown", "available_for_collection", "downloaded", "expired", "failed"] as const;
const DELIVERY_RISK_STATES = ["none", "awaiting_download", "non_delivery_risk", "failed"] as const;
const ACK_EVIDENCE_STATES = [
  "ack_missing",
  "ack_received",
  "ack_superseded",
  "ack_exception_recorded",
] as const;
const ACK_RECORD_STATES = ["pending", "received", "superseded", "exception_recorded"] as const;
const ACK_EVIDENCE_KINDS = [
  "message_reply",
  "api_receipt",
  "manual_attestation",
  "policy_exception",
] as const;
const PROJECTION_STATES = ["not_published", "published_pending_ack", "acknowledged", "stale", "superseded"] as const;
const MANAGE_CAPABILITY_STATES = ["live", "stale", "blocked", "expired"] as const;
const READ_ONLY_MODES = ["interactive", "read_only"] as const;
const VISIBILITY_DELTA_REASONS = [
  "truth_changed",
  "ack_generation_incremented",
  "manage_capability_degraded",
  "appointment_version_changed",
  "policy_tuple_changed",
  "reminder_failure",
] as const;
const MONOTONE_VALIDATIONS = ["valid", "rejected_lower_generation", "rejected_stale_envelope"] as const;

const VISIBLE_FIELD_REFS = [
  "appointmentMacroStatus",
  "appointmentDateTime",
  "siteDisplayName",
  "practiceContinuityState",
  "ackGenerationState",
  "manageCapabilityState",
] as const;

const HIDDEN_FIELD_REFS = [
  "providerAdapterBindingHash",
  "competingAttemptMargin",
  "rawEvidencePayloadRef",
  "internalStaffNotes",
  "patientExplanationVectors",
  "supplierMirrorDriftAudit",
] as const;

const POLICY_TUPLE = {
  routingPolicyPackRef: "routing_policy_312_default",
  serviceObligationPolicyRef: "service_obligation_policy_312_default",
  practiceVisibilityPolicyRef: "practice_visibility_policy_312_default",
  visibilityEnvelopeVersionRef: "visibility_envelope_313_v4",
  minimumNecessaryContractRef: "minimum_necessary_origin_practice_v1",
};

const POLICY_TUPLE_HASH = hashOf(POLICY_TUPLE);

const OFFER_ENTRY_ROWS = [
  {
    alternativeOfferEntryId: "offer_entry_313_001",
    alternativeOfferSessionId: "offer_session_313_001",
    hubCoordinationCaseId: "hub_case_313_001",
    candidateRef: "candidate_trusted_required_001",
    slotCandidateRef: "network_slot_candidate_312_001",
    rankOrdinal: 1,
    availabilityWindowStartAt: "2026-04-28T09:10:00Z",
    availabilityWindowEndAt: "2026-04-28T09:20:00Z",
    patientFacingLabel: "Riverside Hub, Tuesday 28 April at 9:10am",
    staffReasonCueRefs: ["required_window=true", "trust=trusted", "robust_fit=0.91"],
    selectionState: "selected",
    routeFamilyRef: "patient_network_booking",
    truthTupleHash: "pending_truth_tuple_hash",
    policyTupleHash: POLICY_TUPLE_HASH,
    sourceRefs: ALL_SOURCE_REFS,
  },
  {
    alternativeOfferEntryId: "offer_entry_313_002",
    alternativeOfferSessionId: "offer_session_313_001",
    hubCoordinationCaseId: "hub_case_313_001",
    candidateRef: "candidate_trusted_required_002",
    slotCandidateRef: "network_slot_candidate_312_002",
    rankOrdinal: 2,
    availabilityWindowStartAt: "2026-04-28T09:25:00Z",
    availabilityWindowEndAt: "2026-04-28T09:35:00Z",
    patientFacingLabel: "Riverside Hub, Tuesday 28 April at 9:25am",
    staffReasonCueRefs: ["required_window=true", "trust=trusted", "robust_fit=0.87"],
    selectionState: "offerable",
    routeFamilyRef: "patient_network_booking",
    truthTupleHash: "pending_truth_tuple_hash",
    policyTupleHash: POLICY_TUPLE_HASH,
    sourceRefs: ALL_SOURCE_REFS,
  },
  {
    alternativeOfferEntryId: "offer_entry_313_003",
    alternativeOfferSessionId: "offer_session_313_001",
    hubCoordinationCaseId: "hub_case_313_001",
    candidateRef: "candidate_variance_offerable_003",
    slotCandidateRef: "network_slot_candidate_312_003",
    rankOrdinal: 3,
    availabilityWindowStartAt: "2026-04-28T10:05:00Z",
    availabilityWindowEndAt: "2026-04-28T10:15:00Z",
    patientFacingLabel: "Central Hub, Tuesday 28 April at 10:05am",
    staffReasonCueRefs: ["variance_window=true", "trust=trusted", "patient_offerable=true"],
    selectionState: "offerable",
    routeFamilyRef: "patient_network_booking",
    truthTupleHash: "pending_truth_tuple_hash",
    policyTupleHash: POLICY_TUPLE_HASH,
    sourceRefs: ALL_SOURCE_REFS,
  },
  {
    alternativeOfferEntryId: "offer_entry_313_004",
    alternativeOfferSessionId: "offer_session_313_001",
    hubCoordinationCaseId: "hub_case_313_001",
    candidateRef: "candidate_callback_reasoning_004",
    slotCandidateRef: "network_slot_candidate_312_004",
    rankOrdinal: 4,
    availabilityWindowStartAt: "2026-04-28T11:20:00Z",
    availabilityWindowEndAt: "2026-04-28T11:30:00Z",
    patientFacingLabel: "Northway Clinic, Tuesday 28 April at 11:20am",
    staffReasonCueRefs: ["trust=degraded", "callback_reasoning_only=true"],
    selectionState: "offerable",
    routeFamilyRef: "patient_network_booking",
    truthTupleHash: "pending_truth_tuple_hash",
    policyTupleHash: POLICY_TUPLE_HASH,
    sourceRefs: ALL_SOURCE_REFS,
  },
] as const;

const OFFER_SET_HASH = hashOf(
  OFFER_ENTRY_ROWS.map((entry) => ({
    id: entry.alternativeOfferEntryId,
    candidate: entry.candidateRef,
    rank: entry.rankOrdinal,
    start: entry.availabilityWindowStartAt,
  })),
);

const TRUTH_TUPLE = {
  hubCoordinationCaseId: "hub_case_313_001",
  selectedCandidateRef: "candidate_trusted_required_001",
  candidateSnapshotRef: "network_candidate_snapshot_312_001",
  offerSetHash: OFFER_SET_HASH,
  reservationFenceToken: "reservation_fence_313_001",
  providerAdapterBindingHash: "binding_hash_313_provider_a",
  visibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  policyTupleHash: POLICY_TUPLE_HASH,
  ackGeneration: 4,
  appointmentVersionRef: "hub_appointment_version_4",
};

const TRUTH_TUPLE_HASH = hashOf(TRUTH_TUPLE);

const OFFER_ENTRIES = OFFER_ENTRY_ROWS.map((entry) => ({ ...entry, truthTupleHash: TRUTH_TUPLE_HASH }));

const FALLBACK_CARD = {
  alternativeOfferFallbackCardId: "fallback_card_313_001",
  alternativeOfferSessionId: "offer_session_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  fallbackKind: "callback_request",
  displayMode: "separate_card",
  rankOrdinal: null,
  sameShellContinuationRef: "same_shell_anchor_313_001",
  actionPath: "/patient/hub/hub_case_313_001/request-callback",
  fallbackNarrative:
    "Request a callback from the hub if none of the currently visible offers work. This card remains outside the ranked slot list.",
  provenanceState: "live_fallback",
  truthTupleHash: TRUTH_TUPLE_HASH,
  sourceRefs: ALL_SOURCE_REFS,
};

const OFFER_SESSION = {
  alternativeOfferSessionId: "offer_session_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  candidateSnapshotRef: "network_candidate_snapshot_312_001",
  offerSetHash: OFFER_SET_HASH,
  truthTupleHash: TRUTH_TUPLE_HASH,
  policyTupleHash: POLICY_TUPLE_HASH,
  visibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  offerState: "selected",
  callbackFallbackCardRef: FALLBACK_CARD.alternativeOfferFallbackCardId,
  selectedOfferEntryRef: "offer_entry_313_001",
  selectedFallbackPath: null,
  sameShellContinuationRef: "same_shell_anchor_313_001",
  routeFamilyRef: "patient_network_booking",
  patientChoiceDeadlineAt: "2026-04-22T14:30:00Z",
  offerEntryRefs: OFFER_ENTRIES.map((entry) => entry.alternativeOfferEntryId),
  provenanceMode: "live_current",
  supersededBySessionRef: null,
  sourceRefs: ALL_SOURCE_REFS,
};

const COMMIT_ATTEMPT = {
  commitAttemptId: "hub_commit_attempt_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  commitMode: "native_api",
  selectedCandidateRef: "candidate_trusted_required_001",
  selectedOfferSessionRef: OFFER_SESSION.alternativeOfferSessionId,
  selectedOfferEntryRef: "offer_entry_313_001",
  reservationFenceToken: TRUTH_TUPLE.reservationFenceToken,
  providerAdapterBindingHash: TRUTH_TUPLE.providerAdapterBindingHash,
  truthTupleHash: TRUTH_TUPLE_HASH,
  policyTupleHash: POLICY_TUPLE_HASH,
  idempotencyKey: "hub_commit_idempotency_313_001",
  attemptState: "confirmed",
  commandActionRef: "command_action_313_commit_001",
  commandSettlementRef: "command_settlement_313_commit_001",
  commitStartedAt: "2026-04-22T10:11:00Z",
  commitFinishedAt: "2026-04-22T10:13:30Z",
  blockingReasonRefs: [],
  sourceRefs: ALL_SOURCE_REFS,
};

const BOOKING_EVIDENCE_BUNDLE = {
  evidenceBundleId: "hub_evidence_bundle_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  commitAttemptId: COMMIT_ATTEMPT.commitAttemptId,
  commitMode: COMMIT_ATTEMPT.commitMode,
  independentConfirmationState: "confirmed",
  confirmationConfidence: 0.97,
  competingAttemptMargin: 0.62,
  importedEvidenceRef: null,
  nativeBookingReceiptRef: "native_receipt_313_001",
  hardMatchResult: "passed",
  evidenceCapturedAt: "2026-04-22T10:13:45Z",
  truthTupleHash: TRUTH_TUPLE_HASH,
  sourceRefs: ALL_SOURCE_REFS,
};

const APPOINTMENT_RECORD = {
  hubAppointmentId: "hub_appointment_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  commitAttemptId: COMMIT_ATTEMPT.commitAttemptId,
  sourceBookingReference: "supplier_booking_ref_913104",
  supplierAppointmentRef: "supplier_appointment_913104",
  patientFacingReference: "booking_ref_313_ACK4",
  appointmentVersionRef: TRUTH_TUPLE.appointmentVersionRef,
  appointmentState: "confirmed",
  externalConfirmationState: "confirmed",
  practiceAcknowledgementState: "acknowledged",
  manageCapabilitiesRef: "network_manage_capabilities_313_001",
  truthTupleHash: TRUTH_TUPLE_HASH,
  sourceRefs: ALL_SOURCE_REFS,
};

const PRACTICE_CONTINUITY_MESSAGE = {
  practiceContinuityMessageId: "practice_continuity_message_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  appointmentRecordRef: APPOINTMENT_RECORD.hubAppointmentId,
  continuityChannel: "mesh",
  dispatchWorkflowId: "mesh_workflow_313_practice_booked",
  visibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  practiceVisibilityPolicyRef: POLICY_TUPLE.practiceVisibilityPolicyRef,
  serviceObligationPolicyRef: POLICY_TUPLE.serviceObligationPolicyRef,
  policyEvaluationRef: "policy_eval_312_practice_visibility_current",
  ackGeneration: 4,
  truthTupleHash: TRUTH_TUPLE_HASH,
  causalToken: "causal_313_visibility_4",
  transportState: "accepted",
  transportAcceptedAt: "2026-04-22T10:14:12Z",
  deliveryState: "downloaded",
  deliveryEvidenceRef: "delivery_receipt_313_001",
  deliveryRiskState: "none",
  acknowledgementEvidenceState: "ack_received",
  acknowledgementEvidenceRef: "practice_ack_313_001",
  payloadChecksum: hashOf({
    status: "confirmed",
    appointment: "2026-04-28T09:10:00Z",
    site: "Riverside Hub",
  }),
  dedupeKey: "practice_message_dedupe_313_case_001_gen_4",
  sourceRefs: ALL_SOURCE_REFS,
};

const PRACTICE_ACKNOWLEDGEMENT_RECORD = {
  acknowledgementId: "practice_ack_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  practiceContinuityMessageRef: PRACTICE_CONTINUITY_MESSAGE.practiceContinuityMessageId,
  ackGeneration: 4,
  truthTupleHash: TRUTH_TUPLE_HASH,
  causalToken: PRACTICE_CONTINUITY_MESSAGE.causalToken,
  ackState: "received",
  ackEvidenceKind: "message_reply",
  acknowledgedAt: "2026-04-22T10:19:20Z",
  acknowledgedByRef: "practice_mailbox_PRAC123",
  visibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  policyEvaluationRef: "policy_eval_312_practice_visibility_current",
  sourceRefs: ALL_SOURCE_REFS,
};

const PRACTICE_VISIBILITY_PROJECTION = {
  practiceVisibilityProjectionId: "practice_visibility_projection_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  visibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  crossOrganisationVisibilityEnvelopeRef: "cross_org_visibility_envelope_311_001",
  actingScopeTupleRef: "acting_scope_tuple_311_hub_practice",
  practiceVisibilityPolicyRef: POLICY_TUPLE.practiceVisibilityPolicyRef,
  serviceObligationPolicyRef: POLICY_TUPLE.serviceObligationPolicyRef,
  policyEvaluationRef: "policy_eval_312_practice_visibility_current",
  minimumNecessaryContractRef: POLICY_TUPLE.minimumNecessaryContractRef,
  policyTupleHash: POLICY_TUPLE_HASH,
  ackGeneration: 4,
  practiceAcknowledgementState: "acknowledged",
  truthTupleHash: TRUTH_TUPLE_HASH,
  patientSafeStatus: "booked",
  projectionState: "acknowledged",
  visibleFieldRefs: [...VISIBLE_FIELD_REFS],
  hiddenFieldRefs: [...HIDDEN_FIELD_REFS],
  sourceRefs: ALL_SOURCE_REFS,
};

const NETWORK_MANAGE_CAPABILITIES = {
  networkManageCapabilitiesId: "network_manage_capabilities_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  hubAppointmentId: APPOINTMENT_RECORD.hubAppointmentId,
  appointmentVersionRef: APPOINTMENT_RECORD.appointmentVersionRef,
  capabilityState: "live",
  readOnlyMode: "interactive",
  reasonCode: "current_supplier_truth_and_ack_are_live",
  policyTupleHash: POLICY_TUPLE_HASH,
  truthTupleHash: TRUTH_TUPLE_HASH,
  visibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  supplierTruthVersionRef: "supplier_truth_313_revision_5",
  sessionFenceToken: "session_fence_313_patient_001",
  subjectFenceToken: "subject_fence_313_patient_001",
  manageWindowEndsAt: "2026-04-28T08:10:00Z",
  allowedActions: ["view", "reschedule_request", "cancel_request", "callback_request"],
  blockedReasonRefs: [],
  fallbackRouteRef: FALLBACK_CARD.alternativeOfferFallbackCardId,
  sourceRefs: ALL_SOURCE_REFS,
};

const PRACTICE_VISIBILITY_DELTA_RECORD = {
  practiceVisibilityDeltaRecordId: "practice_visibility_delta_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  priorProjectionRef: "practice_visibility_projection_313_000",
  nextProjectionRef: PRACTICE_VISIBILITY_PROJECTION.practiceVisibilityProjectionId,
  priorAckGeneration: 3,
  nextAckGeneration: 4,
  priorVisibilityEnvelopeVersionRef: "visibility_envelope_313_v3",
  nextVisibilityEnvelopeVersionRef: POLICY_TUPLE.visibilityEnvelopeVersionRef,
  truthTupleHash: TRUTH_TUPLE_HASH,
  deltaReason: "truth_changed",
  monotoneValidation: "valid",
  recordedAt: "2026-04-22T10:14:00Z",
  sourceRefs: ALL_SOURCE_REFS,
};

const HUB_OFFER_TO_CONFIRMATION_TRUTH_PROJECTION = {
  hubOfferToConfirmationTruthProjectionId: "truth_projection_313_001",
  hubCoordinationCaseId: "hub_case_313_001",
  offerSessionRef: OFFER_SESSION.alternativeOfferSessionId,
  selectedOfferEntryRef: "offer_entry_313_001",
  fallbackCardRef: FALLBACK_CARD.alternativeOfferFallbackCardId,
  commitAttemptRef: COMMIT_ATTEMPT.commitAttemptId,
  evidenceBundleRef: BOOKING_EVIDENCE_BUNDLE.evidenceBundleId,
  appointmentRecordRef: APPOINTMENT_RECORD.hubAppointmentId,
  continuityMessageRef: PRACTICE_CONTINUITY_MESSAGE.practiceContinuityMessageId,
  acknowledgementRecordRef: PRACTICE_ACKNOWLEDGEMENT_RECORD.acknowledgementId,
  visibilityProjectionRef: PRACTICE_VISIBILITY_PROJECTION.practiceVisibilityProjectionId,
  offerState: "selected",
  confirmationTruthState: "confirmed",
  patientConfirmationState: "calm_confirmed",
  practiceVisibilityState: "acknowledged",
  fallbackLinkageState: "none",
  closureState: "closable",
  openBlockerRefs: [],
  currentAckGeneration: 4,
  policyTupleHash: POLICY_TUPLE_HASH,
  truthTupleHash: TRUTH_TUPLE_HASH,
  generatedAt: "2026-04-22T10:19:20Z",
  sourceRefs: ALL_SOURCE_REFS,
};

const CONTRACT_SUMMARIES = [
  {
    name: "AlternativeOfferSession",
    file: "data/contracts/313_alternative_offer_session.schema.json",
    law: "Preserves open choice, live offer-set hash, and same-shell continuity.",
  },
  {
    name: "AlternativeOfferEntry",
    file: "data/contracts/313_alternative_offer_entry.schema.json",
    law: "Represents ranked offer rows only; callback never takes a rank ordinal.",
  },
  {
    name: "AlternativeOfferFallbackCard",
    file: "data/contracts/313_alternative_offer_fallback_card.schema.json",
    law: "Remains a separate fallback card and preserves callback provenance.",
  },
  {
    name: "HubCommitAttempt",
    file: "data/contracts/313_hub_commit_attempt.schema.json",
    law: "The only object allowed to talk to a native booking adapter or ingest imported confirmation.",
  },
  {
    name: "HubBookingEvidenceBundle",
    file: "data/contracts/313_hub_booking_evidence_bundle.schema.json",
    law: "Carries confirmation confidence, hard-match result, and current tuple correlation.",
  },
  {
    name: "HubAppointmentRecord",
    file: "data/contracts/313_hub_appointment_record.schema.json",
    law: "Durable appointment truth only after the confirmation gate passes on the live tuple.",
  },
  {
    name: "HubOfferToConfirmationTruthProjection",
    file: "data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json",
    law: "Single monotone truth bridge from offer through practice-visible confirmation.",
  },
  {
    name: "PracticeContinuityMessage",
    file: "data/contracts/313_practice_continuity_message.schema.json",
    law: "Separates transport acceptance, delivery evidence, risk, and acknowledgement evidence.",
  },
  {
    name: "PracticeAcknowledgementRecord",
    file: "data/contracts/313_practice_acknowledgement_record.schema.json",
    law: "Generation-bound acknowledgement debt clearance only for the live tuple and live generation.",
  },
  {
    name: "PracticeVisibilityProjection",
    file: "data/contracts/313_practice_visibility_projection.schema.json",
    law: "Minimum-necessary, envelope-bound, scope-bound origin-practice projection.",
  },
  {
    name: "NetworkManageCapabilities",
    file: "data/contracts/313_network_manage_capabilities.schema.json",
    law: "Leased manage authority that degrades to stale, blocked, or expired instead of leaving stale CTAs live.",
  },
  {
    name: "PracticeVisibilityDeltaRecord",
    file: "data/contracts/313_practice_visibility_delta_record.schema.json",
    law: "Monotone-safe delta that may not lower ackGeneration or supersede newer envelopes.",
  },
] as const;

const API_SURFACES = [
  {
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}/offer-sessions",
    contract: "AlternativeOfferSession",
    rule: "Publish one live offer set without collapsing callback into the ranked rows.",
  },
  {
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}/offer-selection",
    contract: "AlternativeOfferEntry | AlternativeOfferFallbackCard",
    rule: "Accept only the current truthTupleHash; stale selections are auditable only.",
  },
  {
    method: "POST",
    path: "/v1/hub/cases/{hubCoordinationCaseId}/commit-attempts",
    contract: "HubCommitAttempt",
    rule: "Bind commit mode, reservation fence, provider binding, and truthTupleHash before side effects.",
  },
  {
    method: "POST",
    path: "/v1/hub/commit-attempts/{commitAttemptId}/evidence",
    contract: "HubBookingEvidenceBundle",
    rule: "Persist manual, native, or imported proof without minting calm booked truth prematurely.",
  },
  {
    method: "GET",
    path: "/v1/hub/cases/{hubCoordinationCaseId}/truth-projection",
    contract: "HubOfferToConfirmationTruthProjection",
    rule: "Expose one current monotone projection that joins offer, commit, continuity, and blockers.",
  },
  {
    method: "POST",
    path: "/v1/practice-continuity/messages/{practiceContinuityMessageId}:dispatch-receipt",
    contract: "PracticeContinuityMessage",
    rule: "Update transport, delivery, and risk lanes separately.",
  },
  {
    method: "POST",
    path: "/v1/practice-continuity/messages/{practiceContinuityMessageId}:acknowledge",
    contract: "PracticeAcknowledgementRecord",
    rule: "Clear debt only when ackGeneration and truthTupleHash both match live truth.",
  },
  {
    method: "GET",
    path: "/v1/hub/appointments/{hubAppointmentId}/manage-capabilities",
    contract: "NetworkManageCapabilities",
    rule: "Compile a leased manage posture from current supplier, visibility, policy, and tuple truth.",
  },
] as const;

const EVENT_CATALOG = {
  taskId: SHORT_TASK_ID,
  contractVersion: CONTRACT_VERSION,
  vocabularies: {
    commitModes: [...COMMIT_MODES],
    commitAttemptStates: [...COMMIT_ATTEMPT_STATES],
    confirmationTruthStates: [...CONFIRMATION_TRUTH_STATES],
    practiceVisibilityStates: [...PRACTICE_VISIBILITY_STATES],
    transportStates: [...TRANSPORT_STATES],
    deliveryStates: [...DELIVERY_STATES],
    acknowledgementStates: [...ACK_RECORD_STATES],
    manageCapabilityStates: [...MANAGE_CAPABILITY_STATES],
  },
  events: [
    {
      eventName: "hub.offer.session_opened",
      aggregate: "AlternativeOfferSession",
      outcome: "One live offer set plus one separate fallback card become visible.",
      monotoneEffect: "Starts open-choice provenance under one offerSetHash.",
    },
    {
      eventName: "hub.offer.entry_selected",
      aggregate: "AlternativeOfferEntry",
      outcome: "One ranked offer row becomes the selected anchor for commit.",
      monotoneEffect: "Pins selection to the current truthTupleHash.",
    },
    {
      eventName: "hub.offer.fallback_selected",
      aggregate: "AlternativeOfferFallbackCard",
      outcome: "Callback or return fallback becomes the live branch without consuming rank ordinal.",
      monotoneEffect: "Preserves the prior ranked set as read-only provenance.",
    },
    {
      eventName: "hub.commit.attempt_started",
      aggregate: "HubCommitAttempt",
      outcome: "Commit begins under current reservation fence and provider binding.",
      monotoneEffect: "Prevents stale tuple commit from taking side effects.",
    },
    {
      eventName: "hub.commit.confirmation_pending",
      aggregate: "HubBookingEvidenceBundle",
      outcome: "Weak or partial proof widens pending posture only.",
      monotoneEffect: "Does not mint calm booked truth.",
    },
    {
      eventName: "hub.commit.authoritatively_confirmed",
      aggregate: "HubAppointmentRecord",
      outcome: "Durable appointment truth exists and the hub case becomes booked_pending_practice_ack.",
      monotoneEffect: "Patient confirmation may calm; practice acknowledgement debt remains open.",
    },
    {
      eventName: "hub.practice.message_queued",
      aggregate: "PracticeContinuityMessage",
      outcome: "One current-generation continuity obligation exists.",
      monotoneEffect: "Starts transport, delivery, and acknowledgement evidence lanes separately.",
    },
    {
      eventName: "hub.practice.transport_accepted",
      aggregate: "PracticeContinuityMessage",
      outcome: "Cross-organisation transport accepted the message.",
      monotoneEffect: "May widen pending guidance but does not clear acknowledgement debt.",
    },
    {
      eventName: "hub.practice.delivery_evidence_recorded",
      aggregate: "PracticeContinuityMessage",
      outcome: "Delivery evidence or non-delivery risk becomes durable.",
      monotoneEffect: "Still separate from acknowledgement clearance.",
    },
    {
      eventName: "hub.practice.acknowledged_current_generation",
      aggregate: "PracticeAcknowledgementRecord",
      outcome: "Current-generation acknowledgement evidence is durable.",
      monotoneEffect: "Allows practiceVisibilityState to advance to acknowledged only on the live tuple.",
    },
    {
      eventName: "hub.practice.acknowledgement_superseded",
      aggregate: "PracticeVisibilityDeltaRecord",
      outcome: "Older acknowledgement becomes auditable only after a new generation or new tuple.",
      monotoneEffect: "Prevents stale generations from clearing fresh debt.",
    },
    {
      eventName: "hub.manage.capabilities_degraded",
      aggregate: "NetworkManageCapabilities",
      outcome: "Manage posture becomes stale, blocked, or expired.",
      monotoneEffect: "Removes stale CTAs instead of leaving optimistic buttons live.",
    },
    {
      eventName: "hub.truth.projection_advanced",
      aggregate: "HubOfferToConfirmationTruthProjection",
      outcome: "One current projection resolves offer, confirmation, practice, and closure facets.",
      monotoneEffect: "Replaces route-local status stitching.",
    },
  ],
  sourceRefs: ALL_SOURCE_REFS,
};

const TRUTH_TUPLE_ACK_MATRIX_ROWS = [
  {
    scenarioId: "transport_only_current_generation",
    truthTupleStatus: "current",
    ackGenerationStatus: "current",
    transportState: "accepted",
    deliveryState: "unknown",
    ackState: "pending",
    policyEvaluationStatus: "current",
    clearsCurrentDebt: "no",
    resultingPracticeVisibilityState: "transport_pending",
    explanation: "Transport acceptance is progress only; it is not acknowledgement.",
  },
  {
    scenarioId: "delivery_without_ack",
    truthTupleStatus: "current",
    ackGenerationStatus: "current",
    transportState: "accepted",
    deliveryState: "downloaded",
    ackState: "pending",
    policyEvaluationStatus: "current",
    clearsCurrentDebt: "no",
    resultingPracticeVisibilityState: "delivered_pending_ack",
    explanation: "Downloaded evidence does not satisfy acknowledgement debt on its own.",
  },
  {
    scenarioId: "superseded_generation_ack",
    truthTupleStatus: "current",
    ackGenerationStatus: "superseded",
    transportState: "accepted",
    deliveryState: "downloaded",
    ackState: "received",
    policyEvaluationStatus: "current",
    clearsCurrentDebt: "no",
    resultingPracticeVisibilityState: "stale_generation",
    explanation: "Older generations remain auditable only after the case has moved on.",
  },
  {
    scenarioId: "current_generation_explicit_ack",
    truthTupleStatus: "current",
    ackGenerationStatus: "current",
    transportState: "accepted",
    deliveryState: "downloaded",
    ackState: "received",
    policyEvaluationStatus: "current",
    clearsCurrentDebt: "yes",
    resultingPracticeVisibilityState: "acknowledged",
    explanation: "Only current-generation acknowledgement on the live tuple may clear debt.",
  },
  {
    scenarioId: "current_generation_policy_exception",
    truthTupleStatus: "current",
    ackGenerationStatus: "current",
    transportState: "accepted",
    deliveryState: "failed",
    ackState: "exception_recorded",
    policyEvaluationStatus: "current",
    clearsCurrentDebt: "yes",
    resultingPracticeVisibilityState: "acknowledged",
    explanation: "Audited no-ack exception may settle the debt when the algorithm explicitly allows it.",
  },
  {
    scenarioId: "stale_tuple_ack",
    truthTupleStatus: "stale",
    ackGenerationStatus: "current",
    transportState: "accepted",
    deliveryState: "downloaded",
    ackState: "received",
    policyEvaluationStatus: "stale",
    clearsCurrentDebt: "no",
    resultingPracticeVisibilityState: "blocked",
    explanation: "Evidence bound to an older truth tuple may not calm the new case posture.",
  },
  {
    scenarioId: "new_tuple_reopens_ack",
    truthTupleStatus: "current_new_tuple",
    ackGenerationStatus: "pending_new",
    transportState: "queued",
    deliveryState: "unknown",
    ackState: "pending",
    policyEvaluationStatus: "current",
    clearsCurrentDebt: "no",
    resultingPracticeVisibilityState: "ack_pending",
    explanation: "Any new material change reopens the current continuity obligation and current acknowledgement debt.",
  },
] as const;

const GAP_SEAMS: GapSeam[] = [
  {
    seamId: "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_MESH_DISPATCH_AND_DELIVERY.json",
    ownerTask: "par_322",
    area: "mesh_dispatch_and_delivery",
    purpose:
      "Freeze the later-owned dispatch, receipt, and delivery checkpoints that must keep PracticeContinuityMessage transport, delivery, and acknowledgement lanes separate.",
    consumerRefs: [
      "PracticeContinuityMessage.transportState",
      "PracticeContinuityMessage.deliveryState",
      "HubOfferToConfirmationTruthProjection.practiceVisibilityState",
      "PracticeVisibilityDeltaRecord.deltaReason",
    ],
    requiredObjects: [
      {
        objectName: "PracticeContinuityDispatchAttempt",
        status: "typed_seam_only",
        requiredFields: [
          "dispatchAttemptId",
          "practiceContinuityMessageId",
          "channel",
          "dedupeKey",
          "transportAckState",
        ],
      },
      {
        objectName: "PracticeContinuityReceiptCheckpoint",
        status: "typed_seam_only",
        requiredFields: [
          "receiptCheckpointId",
          "practiceContinuityMessageId",
          "deliveryEvidenceState",
          "transportReceiptRef",
          "truthTupleHash",
        ],
      },
    ],
  },
  {
    seamId: "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_REMINDERS_AND_MANAGE_REFRESH.json",
    ownerTask: "par_324",
    area: "reminders_and_manage_refresh",
    purpose:
      "Freeze the later-owned reminder and manage surfaces that can reopen acknowledgement debt or degrade manage posture after booking truth is already durable.",
    consumerRefs: [
      "NetworkManageCapabilities.capabilityState",
      "PracticeVisibilityDeltaRecord.deltaReason",
      "HubOfferToConfirmationTruthProjection.practiceVisibilityState",
      "HubOfferToConfirmationTruthProjection.closureState",
    ],
    requiredObjects: [
      {
        objectName: "NetworkReminderPlan",
        status: "typed_seam_only",
        requiredFields: [
          "reminderPlanId",
          "hubAppointmentId",
          "appointmentVersionRef",
          "truthTupleHash",
          "reminderLifecycleState",
        ],
      },
      {
        objectName: "HubManageSettlement",
        status: "typed_seam_only",
        requiredFields: [
          "manageSettlementId",
          "hubAppointmentId",
          "capabilityLeaseRef",
          "truthTupleHash",
          "resultState",
        ],
      },
    ],
  },
  {
    seamId: "PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR",
    fileName: "data/contracts/PHASE5_INTERFACE_GAP_COMMIT_VISIBILITY_RECONCILIATION_AND_SUPPLIER_MIRROR.json",
    ownerTask: "par_325",
    area: "reconciliation_and_supplier_mirror",
    purpose:
      "Freeze the later-owned worker inputs that may dispute, reopen, or degrade confirmed posture without minting a calmer state from stale evidence.",
    consumerRefs: [
      "HubCommitAttempt.attemptState",
      "HubOfferToConfirmationTruthProjection.confirmationTruthState",
      "NetworkManageCapabilities.capabilityState",
      "PracticeVisibilityDeltaRecord.deltaReason",
    ],
    requiredObjects: [
      {
        objectName: "HubSupplierMirrorState",
        status: "typed_seam_only",
        requiredFields: [
          "hubSupplierMirrorStateId",
          "hubAppointmentId",
          "supplierObservationRevision",
          "driftState",
          "truthTupleHash",
        ],
      },
      {
        objectName: "HubCoordinationException",
        status: "typed_seam_only",
        requiredFields: [
          "exceptionId",
          "hubCoordinationCaseId",
          "exceptionClass",
          "retryState",
          "truthTupleHash",
        ],
      },
    ],
  },
] as const;

const GAP_LOG = {
  taskId: SHORT_TASK_ID,
  contractVersion: CONTRACT_VERSION,
  discharges: [
    {
      sourceGapFile:
        "data/contracts/PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY.json",
      closedObjects: ["PracticeAcknowledgementRecord", "PracticeVisibilityProjection"],
      stillOpenObjects: ["HubFallbackRecord", "CallbackExpectationEnvelope"],
      note: "313 closes the acknowledgement and practice-visibility portion of the 311 seam while fallback workflow execution remains owned later.",
    },
    {
      sourceGapFile:
        "data/contracts/PHASE5_INTERFACE_GAP_POLICY_CAPACITY_PATIENT_CHOICE_AND_DISCLOSURE.json",
      closedObjects: ["AlternativeOfferEntry"],
      stillOpenObjects: ["AlternativeOfferOptimisationPlan", "CapacityRankDisclosurePolicy"],
      note: "313 consumes the ordered frontier and disclosure law from 312 without redefining capacity rank semantics.",
    },
  ],
  activeGaps: GAP_SEAMS.map((seam) => ({
    seamId: seam.seamId,
    ownerTask: seam.ownerTask,
    area: seam.area,
    purpose: seam.purpose,
  })),
  sourceRefs: ALL_SOURCE_REFS,
};

const TRUTH_STATES: TruthState[] = [
  {
    stateId: "offer_live",
    label: "Offer Live",
    railNote: "Open choice is current and callback is still a separate card.",
    summary:
      "The current offer set is visible, the callback fallback remains separate, and no commit-side calmness exists yet.",
    projection: {
      offerState: "live_offer",
      confirmationTruthState: "offer_only",
      patientConfirmationState: "not_shown",
      practiceVisibilityState: "not_informed",
      closureState: "not_closable",
      fallbackLinkageState: "none",
    },
    tupleRows: [
      { field: "truthTupleHash", value: `${TRUTH_TUPLE_HASH.slice(0, 18)}… (pre-commit draft)` },
      { field: "policyTupleHash", value: `${POLICY_TUPLE_HASH.slice(0, 18)}…` },
      { field: "offerSetHash", value: `${OFFER_SET_HASH.slice(0, 18)}…` },
      { field: "selectedOfferEntryRef", value: "null" },
      { field: "currentAckGeneration", value: "0" },
      { field: "visibilityEnvelopeVersionRef", value: POLICY_TUPLE.visibilityEnvelopeVersionRef },
    ],
    blockerRows: [
      {
        blockerId: "selection_not_final",
        label: "Selection not final",
        impact: "No commit may begin until one current entry or one current fallback card is selected.",
      },
      {
        blockerId: "confirmation_truth_pending",
        label: "Confirmation truth pending",
        impact: "Calm booked reassurance is illegal before the confirmation gate runs.",
      },
      {
        blockerId: "practice_message_not_emitted",
        label: "Practice message not emitted",
        impact: "Continuity must wait for authoritative confirmation rather than fire from offer visibility.",
      },
    ],
    manage: {
      capabilityState: "blocked",
      readOnlyMode: "read_only",
      allowedActions: ["view_offer_context"],
      blockers: ["No appointment record exists yet.", "Manage is leased only from current booked truth."],
    },
    lanes: {
      patientChoice: {
        title: "Patient choice",
        cue: "Open choice preserved",
        bullets: [
          "All ranked entries remain visible together under one current offer set.",
          "The callback fallback card stays outside the ranked ordinal list.",
          "Selections must validate against the current truthTupleHash before they mutate state.",
        ],
      },
      commitEvidence: {
        title: "Commit and evidence",
        cue: "No side effects yet",
        bullets: [
          "No HubCommitAttempt exists in live execution.",
          "Commit mode is not inferred from UI posture; it must be selected and fenced explicitly.",
          "Stale tuple or stale candidate drift blocks commit before any supplier side effect.",
        ],
      },
      patientConfirmation: {
        title: "Patient-facing confirmation",
        cue: "No calm copy",
        bullets: [
          "No green confirmation panel or calm booked message is legal here.",
          "Patient copy may describe the live offer set and pending choice deadline only.",
        ],
      },
      practiceVisibility: {
        title: "Practice visibility and acknowledgement",
        cue: "No continuity debt yet",
        bullets: [
          "No PracticeContinuityMessage exists before authoritative confirmation.",
          "No acknowledgement debt is open because no current continuity generation exists.",
        ],
      },
    },
    messageRows: [
      {
        messageId: "message_not_started",
        label: "Continuity not started",
        channel: "mesh",
        transportState: "not_dispatched",
        deliveryState: "unknown",
        ackEvidenceState: "ack_missing",
        ackGeneration: 0,
        projectionState: "not_informed",
        note: "Outward practice continuity does not begin from offer visibility alone.",
      },
    ],
    ackRows: [
      {
        generation: 0,
        status: "idle",
        source: "No continuity generation emitted",
        clearsDebt: false,
        note: "There is no acknowledgement obligation before authoritative confirmation.",
      },
    ],
  },
  {
    stateId: "confirmation_pending",
    label: "Confirmation Pending",
    railNote: "A commit exists, but the evidence is not yet authoritative.",
    summary:
      "Manual, imported, or weak native evidence may widen pending posture, but calm booked truth and practice continuity remain gated.",
    projection: {
      offerState: "selected",
      confirmationTruthState: "confirmation_pending",
      patientConfirmationState: "pending_copy",
      practiceVisibilityState: "not_informed",
      closureState: "not_closable",
      fallbackLinkageState: "none",
    },
    tupleRows: [
      { field: "truthTupleHash", value: `${TRUTH_TUPLE_HASH.slice(0, 18)}…` },
      { field: "providerAdapterBindingHash", value: TRUTH_TUPLE.providerAdapterBindingHash },
      { field: "reservationFenceToken", value: TRUTH_TUPLE.reservationFenceToken },
      { field: "commitMode", value: "manual_pending_confirmation or imported_confirmation" },
      { field: "currentAckGeneration", value: "0" },
      { field: "visibilityEnvelopeVersionRef", value: POLICY_TUPLE.visibilityEnvelopeVersionRef },
    ],
    blockerRows: [
      {
        blockerId: "authoritative_confirmation_missing",
        label: "Authoritative confirmation missing",
        impact: "Patient reassurance must remain provisional and no practice continuity message may clear booked truth yet.",
      },
      {
        blockerId: "weak_or_ambiguous_evidence",
        label: "Weak or ambiguous evidence",
        impact: "Imported or manual evidence remains auditable only until the confirmation gate passes.",
      },
      {
        blockerId: "practice_message_not_emitted",
        label: "Practice message not emitted",
        impact: "Origin-practice continuity still waits for confirmed_pending_practice_ack posture.",
      },
    ],
    manage: {
      capabilityState: "blocked",
      readOnlyMode: "read_only",
      allowedActions: ["view_pending_evidence"],
      blockers: ["Manage requires authoritative appointment truth.", "Pending confirmation cannot expose stale CTAs."],
    },
    lanes: {
      patientChoice: {
        title: "Patient choice",
        cue: "Selection pinned",
        bullets: [
          "One selected entry is pinned to the current tuple for commit-side work.",
          "The prior offer set remains auditable provenance rather than disappearing.",
          "Callback can still exist as a recorded fallback option without becoming the selected slot.",
        ],
      },
      commitEvidence: {
        title: "Commit and evidence",
        cue: "Pending only",
        bullets: [
          "A HubCommitAttempt exists, but the confirmation gate has not cleared it.",
          "Weak manual proof and imported signals stay pending_confirmation until hard-match and confidence gates pass.",
          "Split-brain or stale-binding conditions widen recovery, not calmness.",
        ],
      },
      patientConfirmation: {
        title: "Patient-facing confirmation",
        cue: "Provisional copy only",
        bullets: [
          "Patient copy may explain that booking is being checked or confirmed.",
          "It may not use calm booked confirmation language or hide dispute risk.",
        ],
      },
      practiceVisibility: {
        title: "Practice visibility and acknowledgement",
        cue: "Still dark",
        bullets: [
          "No continuity generation is sent until the current tuple is authoritatively confirmed.",
          "Transport or supplier optimism does not create acknowledgement debt on its own.",
        ],
      },
    },
    messageRows: [
      {
        messageId: "message_pending_gate",
        label: "Continuity blocked by confirmation gate",
        channel: "mesh",
        transportState: "not_dispatched",
        deliveryState: "unknown",
        ackEvidenceState: "ack_missing",
        ackGeneration: 0,
        projectionState: "not_informed",
        note: "Practice messaging waits until the truth projection reaches confirmed_pending_practice_ack.",
      },
    ],
    ackRows: [
      {
        generation: 0,
        status: "blocked",
        source: "Confirmation truth pending",
        clearsDebt: false,
        note: "No practice acknowledgement may clear debt before the continuity generation exists.",
      },
    ],
  },
  {
    stateId: "confirmed_pending_ack",
    label: "Confirmed Pending Ack",
    railNote: "Booked truth is durable, but the origin practice still owes current-generation acknowledgement.",
    summary:
      "The confirmation gate has passed, the patient can receive calm booked truth, and the practice continuity chain is active under generation 4.",
    projection: {
      offerState: "selected",
      confirmationTruthState: "confirmed_pending_practice_ack",
      patientConfirmationState: "calm_confirmed",
      practiceVisibilityState: "ack_pending",
      closureState: "not_closable",
      fallbackLinkageState: "none",
    },
    tupleRows: [
      { field: "truthTupleHash", value: `${TRUTH_TUPLE_HASH.slice(0, 18)}…` },
      { field: "appointmentVersionRef", value: TRUTH_TUPLE.appointmentVersionRef },
      { field: "ackGeneration", value: "4" },
      { field: "visibilityEnvelopeVersionRef", value: POLICY_TUPLE.visibilityEnvelopeVersionRef },
      { field: "policyTupleHash", value: `${POLICY_TUPLE_HASH.slice(0, 18)}…` },
      { field: "manageLeaseState", value: "stale / read_only until current ack clears" },
    ],
    blockerRows: [
      {
        blockerId: "current_ack_generation_open",
        label: "Current acknowledgement generation open",
        impact: "Practice-informed and practice-acknowledged remain separate facets until generation 4 is settled.",
      },
      {
        blockerId: "manage_capability_degraded",
        label: "Manage capability degraded",
        impact: "Manage posture is read-only while acknowledgement debt remains open.",
      },
    ],
    manage: {
      capabilityState: "stale",
      readOnlyMode: "read_only",
      allowedActions: ["view", "contact_practice"],
      blockers: [
        "Current practice acknowledgement debt is still open.",
        "Leased manage capability has not revalidated after continuity delivery.",
      ],
    },
    lanes: {
      patientChoice: {
        title: "Patient choice",
        cue: "Choice closed",
        bullets: [
          "The selected offer has settled into durable booked truth.",
          "Prior offer rows remain visible as provenance only and may not reopen hidden choice paths.",
        ],
      },
      commitEvidence: {
        title: "Commit and evidence",
        cue: "Confirmed tuple",
        bullets: [
          "The current HubCommitAttempt, evidence bundle, and appointment record all carry the live truthTupleHash.",
          "Booked truth exists only because the confirmation gate passed on the current tuple and binding.",
        ],
      },
      patientConfirmation: {
        title: "Patient-facing confirmation",
        cue: "Calm booked copy legal",
        bullets: [
          "Patient confirmation may now use calm confirmation copy and booked appointment details.",
          "This still does not imply the origin practice has acknowledged the change.",
        ],
      },
      practiceVisibility: {
        title: "Practice visibility and acknowledgement",
        cue: "Generation 4 active",
        bullets: [
          "Practice continuity generation 4 is live and tied to the current visibility envelope and truth tuple.",
          "Transport, delivery, and acknowledgement remain separate rows in the same chain.",
        ],
      },
    },
    messageRows: [
      {
        messageId: "message_transport_only",
        label: "Transport accepted only",
        channel: "mesh",
        transportState: "accepted",
        deliveryState: "unknown",
        ackEvidenceState: "ack_missing",
        ackGeneration: 4,
        projectionState: "transport_pending",
        note: "Transport acceptance widens pending guidance but does not clear current acknowledgement debt.",
      },
      {
        messageId: "message_delivered_pending_ack",
        label: "Delivered, awaiting practice acknowledgement",
        channel: "mesh",
        transportState: "accepted",
        deliveryState: "downloaded",
        ackEvidenceState: "ack_missing",
        ackGeneration: 4,
        projectionState: "delivered_pending_ack",
        note: "Delivery evidence exists, but the current practice acknowledgement is still missing.",
      },
      {
        messageId: "message_stale_generation",
        label: "Older generation acknowledged",
        channel: "mesh",
        transportState: "accepted",
        deliveryState: "downloaded",
        ackEvidenceState: "ack_superseded",
        ackGeneration: 3,
        projectionState: "stale_generation",
        note: "Generation 3 acknowledgement remains auditable only after the generation 4 material change.",
      },
    ],
    ackRows: [
      {
        generation: 3,
        status: "received_superseded",
        source: "Older acknowledgement",
        clearsDebt: false,
        note: "Superseded acknowledgement may not clear the current material change.",
      },
      {
        generation: 4,
        status: "pending_current",
        source: "Current booked continuity message",
        clearsDebt: false,
        note: "This is the live generation that must be acknowledged or excepted.",
      },
    ],
  },
  {
    stateId: "confirmed_acknowledged",
    label: "Confirmed and Acknowledged",
    railNote: "The practice has acknowledged the current generation on the current truth tuple.",
    summary:
      "Patient confirmation is calm, practice acknowledgement is current, and the case can become closable without hiding provenance.",
    projection: {
      offerState: "selected",
      confirmationTruthState: "confirmed",
      patientConfirmationState: "calm_confirmed",
      practiceVisibilityState: "acknowledged",
      closureState: "closable",
      fallbackLinkageState: "none",
    },
    tupleRows: [
      { field: "truthTupleHash", value: `${TRUTH_TUPLE_HASH.slice(0, 18)}…` },
      { field: "appointmentVersionRef", value: TRUTH_TUPLE.appointmentVersionRef },
      { field: "ackGeneration", value: "4" },
      { field: "acknowledgementId", value: PRACTICE_ACKNOWLEDGEMENT_RECORD.acknowledgementId },
      { field: "visibilityProjectionRef", value: PRACTICE_VISIBILITY_PROJECTION.practiceVisibilityProjectionId },
      { field: "manageLeaseState", value: "live / interactive" },
    ],
    blockerRows: [],
    manage: {
      capabilityState: "live",
      readOnlyMode: "interactive",
      allowedActions: ["view", "reschedule_request", "cancel_request", "callback_request"],
      blockers: [],
    },
    lanes: {
      patientChoice: {
        title: "Patient choice",
        cue: "Provenance preserved",
        bullets: [
          "The chosen offer remains the durable origin of booking truth.",
          "Prior alternatives and fallback remain visible as history, not hidden control flow.",
        ],
      },
      commitEvidence: {
        title: "Commit and evidence",
        cue: "Current tuple settled",
        bullets: [
          "Commit attempt, evidence bundle, appointment record, continuity message, and acknowledgement record all carry the same live truthTupleHash.",
          "No weaker evidence family may supersede this calmer state unless a later tuple reopens it.",
        ],
      },
      patientConfirmation: {
        title: "Patient-facing confirmation",
        cue: "Booked copy stable",
        bullets: [
          "Calm booked copy is legal and consistent with the current appointment record.",
          "The confirmation page may reassure users there is nothing more for them to do before the appointment when that is true.",
        ],
      },
      practiceVisibility: {
        title: "Practice visibility and acknowledgement",
        cue: "Current generation cleared",
        bullets: [
          "Generation 4 acknowledgement evidence is current, tuple-bound, and policy-bound.",
          "The origin practice sees only the minimum-necessary projection, not hub-only replay detail.",
        ],
      },
    },
    messageRows: [
      {
        messageId: "message_current_ack",
        label: "Current generation acknowledged",
        channel: "mesh",
        transportState: "accepted",
        deliveryState: "downloaded",
        ackEvidenceState: "ack_received",
        ackGeneration: 4,
        projectionState: "acknowledged",
        note: "Current-generation acknowledgement evidence clears current debt.",
      },
      {
        messageId: "message_old_ack",
        label: "Older acknowledgement retained as provenance",
        channel: "mesh",
        transportState: "accepted",
        deliveryState: "downloaded",
        ackEvidenceState: "ack_superseded",
        ackGeneration: 3,
        projectionState: "stale_generation",
        note: "Older generations remain auditable and cannot replace the current one.",
      },
    ],
    ackRows: [
      {
        generation: 3,
        status: "received_superseded",
        source: "Prior material state",
        clearsDebt: false,
        note: "Provenance only.",
      },
      {
        generation: 4,
        status: "received_current",
        source: "Current booked continuity message",
        clearsDebt: true,
        note: "This generation lawfully clears current acknowledgement debt.",
      },
    ],
  },
  {
    stateId: "stale_tuple_blocked",
    label: "Tuple Drift Reopened",
    railNote: "A newer tuple or newer generation exists, so older acknowledgements are auditable only.",
    summary:
      "Supplier drift, correction, or other material change has reopened the continuity obligation and degraded manage posture. The older calmer state is preserved as provenance only.",
    projection: {
      offerState: "selected",
      confirmationTruthState: "blocked_by_drift",
      patientConfirmationState: "blocked",
      practiceVisibilityState: "blocked",
      closureState: "not_closable",
      fallbackLinkageState: "linkage_debt",
    },
    tupleRows: [
      { field: "truthTupleHash", value: "newer truth tuple required; prior hash superseded" },
      { field: "supersededTruthTupleHash", value: `${TRUTH_TUPLE_HASH.slice(0, 18)}…` },
      { field: "ackGeneration", value: "5 current / 4 superseded" },
      { field: "visibilityEnvelopeVersionRef", value: "visibility_envelope_313_v5" },
      { field: "manageLeaseState", value: "blocked / read_only" },
      { field: "deltaReason", value: "policy_tuple_changed or appointment_version_changed" },
    ],
    blockerRows: [
      {
        blockerId: "truth_tuple_drift",
        label: "Truth tuple drift",
        impact: "Older commit and acknowledgement evidence remain auditable only and cannot calm the new case.",
      },
      {
        blockerId: "manage_capability_stale",
        label: "Manage capability stale",
        impact: "Manage posture must degrade to blocked or expired instead of leaving stale CTAs live.",
      },
      {
        blockerId: "current_ack_reopened",
        label: "Current acknowledgement reopened",
        impact: "A new generation or new tuple now requires a fresh continuity chain and fresh acknowledgement.",
      },
    ],
    manage: {
      capabilityState: "blocked",
      readOnlyMode: "read_only",
      allowedActions: ["view", "contact_practice"],
      blockers: [
        "Supplier drift or material change invalidated the prior interactive lease.",
        "New continuity evidence and new acknowledgement generation are required.",
      ],
    },
    lanes: {
      patientChoice: {
        title: "Patient choice",
        cue: "Historic only",
        bullets: [
          "The original selected offer remains provenance, not current actionable truth.",
          "Any fresh mutation must bind to the newer tuple rather than reuse historic choice state.",
        ],
      },
      commitEvidence: {
        title: "Commit and evidence",
        cue: "Older proof retained",
        bullets: [
          "Older confirmation evidence remains auditable, but drift or correction prevents it from calming the live state.",
          "Reconciliation or supplier-mirror work may widen recovery, not calmness.",
        ],
      },
      patientConfirmation: {
        title: "Patient-facing confirmation",
        cue: "Calm copy withdrawn",
        bullets: [
          "Patient reassurance must degrade when the live tuple no longer matches the calmer appointment truth.",
          "The shell stays the same; the posture becomes blocked or recovery-oriented.",
        ],
      },
      practiceVisibility: {
        title: "Practice visibility and acknowledgement",
        cue: "Generation 5 required",
        bullets: [
          "Current acknowledgement debt is reopened by the material change.",
          "Older acknowledgement evidence and older visibility envelopes remain provenance only.",
        ],
      },
    },
    messageRows: [
      {
        messageId: "message_old_tuple_ack",
        label: "Older tuple acknowledged",
        channel: "mesh",
        transportState: "accepted",
        deliveryState: "downloaded",
        ackEvidenceState: "ack_superseded",
        ackGeneration: 4,
        projectionState: "stale_generation",
        note: "The old tuple's acknowledgement may not clear the new material change.",
      },
      {
        messageId: "message_new_generation_pending",
        label: "Generation 5 continuity reopened",
        channel: "mesh",
        transportState: "queued",
        deliveryState: "unknown",
        ackEvidenceState: "ack_missing",
        ackGeneration: 5,
        projectionState: "ack_pending",
        note: "The new tuple requires a fresh continuity message and fresh acknowledgement evidence.",
      },
    ],
    ackRows: [
      {
        generation: 4,
        status: "received_superseded",
        source: "Previous tuple",
        clearsDebt: false,
        note: "No stale tuple may clear current debt.",
      },
      {
        generation: 5,
        status: "pending_current",
        source: "Current drift response",
        clearsDebt: false,
        note: "Fresh acknowledgement is required under the new tuple and new envelope.",
      },
    ],
  },
] as const;

function buildAlternativeOfferSessionSchema() {
  return schemaDocument(
    "313_alternative_offer_session.schema.json",
    "AlternativeOfferSession",
    "Open-choice offer session for one hub case. Preserves offer set provenance, current truth tuple, and same-shell continuity while keeping callback fallback separate from ranked rows.",
    {
      alternativeOfferSessionId: refField("Stable identifier for the offer session."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      candidateSnapshotRef: refField("Current NetworkCandidateSnapshot used to build the offer set."),
      offerSetHash: refField("Stable hash of the ranked offer set shown to the patient or coordinator."),
      truthTupleHash: refField("Current truth tuple hash that governs live selection and commit."),
      policyTupleHash: refField("Policy tuple hash inherited from 312."),
      visibilityEnvelopeVersionRef: refField("Visibility envelope version that governed offer disclosure."),
      offerState: enumField(
        OFFER_SESSION_STATES,
        "Current offer-session posture. Superseded or expired sessions remain auditable only.",
      ),
      callbackFallbackCardRef: refField("Separate callback fallback card associated with the offer set.", true),
      selectedOfferEntryRef: refField("Currently selected ranked offer entry.", true),
      selectedFallbackPath: refField("Selected fallback path when the separate fallback card wins.", true),
      sameShellContinuationRef: refField("Shell continuity anchor that keeps offer review in the same route family."),
      routeFamilyRef: refField("Owning route family for the offer session."),
      patientChoiceDeadlineAt: dateTimeField("Deadline for live selection before the session expires."),
      offerEntryRefs: stringArrayField("Ranked offer entry identifiers shown in the current session.", 1),
      provenanceMode: enumField(
        ["live_current", "read_only_provenance"],
        "Whether the session is still live or has become read-only provenance after supersession.",
      ),
      supersededBySessionRef: refField("Later session that superseded this one.", true),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "alternativeOfferSessionId",
      "hubCoordinationCaseId",
      "candidateSnapshotRef",
      "offerSetHash",
      "truthTupleHash",
      "policyTupleHash",
      "visibilityEnvelopeVersionRef",
      "offerState",
      "sameShellContinuationRef",
      "routeFamilyRef",
      "patientChoiceDeadlineAt",
      "offerEntryRefs",
      "provenanceMode",
      "sourceRefs",
    ],
  );
}

function buildAlternativeOfferEntrySchema() {
  return schemaDocument(
    "313_alternative_offer_entry.schema.json",
    "AlternativeOfferEntry",
    "One ranked row inside an AlternativeOfferSession. Rank ordinals belong only to ranked offers, never to callback fallback.",
    {
      alternativeOfferEntryId: refField("Stable identifier for the ranked offer row."),
      alternativeOfferSessionId: refField("Owning AlternativeOfferSession."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      candidateRef: refField("Candidate reference carried forward from the 312 candidate snapshot."),
      slotCandidateRef: refField("Specific NetworkSlotCandidate or equivalent slot source."),
      rankOrdinal: integerField("Visible rank ordinal. Callback fallback may never occupy this field.", 1),
      availabilityWindowStartAt: dateTimeField("Visible appointment start time for the offer."),
      availabilityWindowEndAt: dateTimeField("Visible appointment end time for the offer."),
      patientFacingLabel: refField("Patient-safe label for the offered appointment."),
      staffReasonCueRefs: stringArrayField("Staff-only explanation cues for replay and audit."),
      selectionState: enumField(
        OFFER_ENTRY_SELECTION_STATES,
        "Current row selection posture. Superseded entries remain provenance only.",
      ),
      routeFamilyRef: refField("Owning route family."),
      truthTupleHash: refField("Current truth tuple hash at the time of publication."),
      policyTupleHash: refField("Current policy tuple hash."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "alternativeOfferEntryId",
      "alternativeOfferSessionId",
      "hubCoordinationCaseId",
      "candidateRef",
      "slotCandidateRef",
      "rankOrdinal",
      "availabilityWindowStartAt",
      "availabilityWindowEndAt",
      "patientFacingLabel",
      "selectionState",
      "routeFamilyRef",
      "truthTupleHash",
      "policyTupleHash",
      "sourceRefs",
    ],
  );
}

function buildAlternativeOfferFallbackCardSchema() {
  return schemaDocument(
    "313_alternative_offer_fallback_card.schema.json",
    "AlternativeOfferFallbackCard",
    "Separate callback or return fallback card shown alongside ranked offers. It may never consume a rank ordinal or replace the open-choice list.",
    {
      alternativeOfferFallbackCardId: refField("Stable identifier for the fallback card."),
      alternativeOfferSessionId: refField("Owning offer session."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      fallbackKind: enumField(
        FALLBACK_KINDS,
        "Fallback path exposed separately from ranked offer entries.",
      ),
      displayMode: enumField(
        ["separate_card"],
        "Fallback presentation mode. Always separate from ranked rows.",
      ),
      rankOrdinal: {
        type: ["integer", "null"],
        description: "Must remain null because fallback may not occupy ranked ordinal space.",
      },
      sameShellContinuationRef: refField("Shell continuity anchor for fallback routing."),
      actionPath: refField("Route or command path for the fallback action."),
      fallbackNarrative: refField("Human-readable fallback explanation."),
      provenanceState: enumField(
        ["live_fallback", "read_only_provenance"],
        "Whether the card is the current live fallback or read-only provenance after supersession.",
      ),
      truthTupleHash: refField("Current truth tuple hash."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "alternativeOfferFallbackCardId",
      "alternativeOfferSessionId",
      "hubCoordinationCaseId",
      "fallbackKind",
      "displayMode",
      "sameShellContinuationRef",
      "actionPath",
      "fallbackNarrative",
      "provenanceState",
      "truthTupleHash",
      "sourceRefs",
    ],
  );
}

function buildHubCommitAttemptSchema() {
  return schemaDocument(
    "313_hub_commit_attempt.schema.json",
    "HubCommitAttempt",
    "Fenced, tuple-bound commit attempt. This is the only object allowed to perform native booking side effects or ingest imported confirmation toward booked outcome.",
    {
      commitAttemptId: refField("Stable identifier for the commit attempt."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      commitMode: enumField(COMMIT_MODES, "Commit mode preserved explicitly; never inferred later."),
      selectedCandidateRef: refField("Selected candidate reference carried into commit."),
      selectedOfferSessionRef: refField("Offer session that produced the selected candidate.", true),
      selectedOfferEntryRef: refField("Selected ranked offer entry when applicable.", true),
      reservationFenceToken: refField("Current reservation or reservation-fence token."),
      providerAdapterBindingHash: refField("Current provider adapter binding hash."),
      truthTupleHash: refField("Current truth tuple hash."),
      policyTupleHash: refField("Current policy tuple hash."),
      idempotencyKey: refField("Idempotency key for replay-safe commit execution."),
      attemptState: enumField(
        COMMIT_ATTEMPT_STATES,
        "Current commit state. Superseded or reconciliation-required attempts remain explicit.",
      ),
      commandActionRef: refField("CommandActionRecord reference for the writable action."),
      commandSettlementRef: refField("CommandSettlementRecord reference for settlement."),
      commitStartedAt: dateTimeField("Time at which commit execution began."),
      commitFinishedAt: dateTimeField("Time at which commit execution finished.", true),
      blockingReasonRefs: stringArrayField("Typed blocking reasons or stale-write reasons."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "commitAttemptId",
      "hubCoordinationCaseId",
      "commitMode",
      "selectedCandidateRef",
      "reservationFenceToken",
      "providerAdapterBindingHash",
      "truthTupleHash",
      "policyTupleHash",
      "idempotencyKey",
      "attemptState",
      "commandActionRef",
      "commandSettlementRef",
      "commitStartedAt",
      "blockingReasonRefs",
      "sourceRefs",
    ],
  );
}

function buildHubBookingEvidenceBundleSchema() {
  return schemaDocument(
    "313_hub_booking_evidence_bundle.schema.json",
    "HubBookingEvidenceBundle",
    "Evidence bundle for native, manual, or imported confirmation. Carries proof strength without implying calm booked truth automatically.",
    {
      evidenceBundleId: refField("Stable identifier for the evidence bundle."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      commitAttemptId: refField("HubCommitAttempt that produced or consumed this evidence."),
      commitMode: enumField(COMMIT_MODES, "Commit mode carried from the commit attempt."),
      independentConfirmationState: enumField(
        INDEPENDENT_CONFIRMATION_STATES,
        "State of independent confirmation evidence after evaluation.",
      ),
      confirmationConfidence: numberField("Confirmation confidence from the gate evaluation.", 0, 1),
      competingAttemptMargin: numberField("Margin over competing attempts or competing evidence."),
      importedEvidenceRef: refField("Imported evidence reference when commitMode = imported_confirmation.", true),
      nativeBookingReceiptRef: refField("Native booking receipt or equivalent provider receipt.", true),
      hardMatchResult: enumField(HARD_MATCH_RESULTS, "Hard-match result from authoritative confirmation."),
      evidenceCapturedAt: dateTimeField("Time the evidence bundle became durable."),
      truthTupleHash: refField("Current truth tuple hash."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "evidenceBundleId",
      "hubCoordinationCaseId",
      "commitAttemptId",
      "commitMode",
      "independentConfirmationState",
      "confirmationConfidence",
      "competingAttemptMargin",
      "hardMatchResult",
      "evidenceCapturedAt",
      "truthTupleHash",
      "sourceRefs",
    ],
  );
}

function buildHubAppointmentRecordSchema() {
  return schemaDocument(
    "313_hub_appointment_record.schema.json",
    "HubAppointmentRecord",
    "Durable appointment truth emitted only after authoritative confirmation on the current tuple.",
    {
      hubAppointmentId: refField("Stable identifier for the hub appointment record."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      commitAttemptId: refField("Commit attempt that lawfully created or updated this record."),
      sourceBookingReference: refField("Supplier-side booking reference or equivalent booking identifier."),
      supplierAppointmentRef: refField("Supplier appointment identifier where provided.", true),
      patientFacingReference: refField("Patient-facing booking or reference number."),
      appointmentVersionRef: refField("Current appointment version used by manage and visibility layers."),
      appointmentState: enumField(APPOINTMENT_STATES, "Current appointment posture."),
      externalConfirmationState: enumField(
        EXTERNAL_CONFIRMATION_STATES,
        "External confirmation posture after the confirmation gate ran.",
      ),
      practiceAcknowledgementState: enumField(
        PRACTICE_ACK_STATES,
        "Practice acknowledgement posture kept separate from patient confirmation.",
      ),
      manageCapabilitiesRef: refField("Current NetworkManageCapabilities lease.", true),
      truthTupleHash: refField("Current truth tuple hash."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "hubAppointmentId",
      "hubCoordinationCaseId",
      "commitAttemptId",
      "sourceBookingReference",
      "patientFacingReference",
      "appointmentVersionRef",
      "appointmentState",
      "externalConfirmationState",
      "practiceAcknowledgementState",
      "truthTupleHash",
      "sourceRefs",
    ],
  );
}

function buildHubTruthProjectionSchema() {
  return schemaDocument(
    "313_hub_offer_to_confirmation_truth_projection.schema.json",
    "HubOfferToConfirmationTruthProjection",
    "Single monotone truth object that resolves offer, selection, commit, appointment truth, practice continuity, acknowledgement, visibility, and closure blockers into one current projection.",
    {
      hubOfferToConfirmationTruthProjectionId: refField("Stable identifier for the projection."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      offerSessionRef: refField("Current or most recent offer session.", true),
      selectedOfferEntryRef: refField("Current selected ranked offer entry.", true),
      fallbackCardRef: refField("Current fallback card where callback or return posture is live.", true),
      commitAttemptRef: refField("Current or winning HubCommitAttempt.", true),
      evidenceBundleRef: refField("Current or winning evidence bundle.", true),
      appointmentRecordRef: refField("Current HubAppointmentRecord.", true),
      continuityMessageRef: refField("Current PracticeContinuityMessage.", true),
      acknowledgementRecordRef: refField("Current PracticeAcknowledgementRecord.", true),
      visibilityProjectionRef: refField("Current PracticeVisibilityProjection.", true),
      offerState: enumField(
        OFFER_TO_CONFIRMATION_OFFER_STATES,
        "Offer-side posture resolved into the current projection.",
      ),
      confirmationTruthState: enumField(
        CONFIRMATION_TRUTH_STATES,
        "Current confirmation truth posture after applying the confirmation gate and drift laws.",
      ),
      patientConfirmationState: enumField(
        PATIENT_CONFIRMATION_STATES,
        "Patient-facing confirmation posture kept separate from practice acknowledgement.",
      ),
      practiceVisibilityState: enumField(
        PRACTICE_VISIBILITY_STATES,
        "Practice-side continuity or acknowledgement posture.",
      ),
      fallbackLinkageState: enumField(
        FALLBACK_LINKAGE_STATES,
        "Callback or return linkage posture kept explicit in the same projection.",
      ),
      closureState: enumField(CLOSURE_STATES, "Current closure legality."),
      openBlockerRefs: stringArrayField("Current closure or mutation blockers."),
      currentAckGeneration: integerField("Live acknowledgement generation.", 0),
      policyTupleHash: refField("Current policy tuple hash."),
      truthTupleHash: refField("Current truth tuple hash."),
      generatedAt: dateTimeField("Time the projection was computed or refreshed."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "hubOfferToConfirmationTruthProjectionId",
      "hubCoordinationCaseId",
      "offerState",
      "confirmationTruthState",
      "patientConfirmationState",
      "practiceVisibilityState",
      "fallbackLinkageState",
      "closureState",
      "openBlockerRefs",
      "currentAckGeneration",
      "policyTupleHash",
      "truthTupleHash",
      "generatedAt",
      "sourceRefs",
    ],
  );
}

function buildPracticeContinuityMessageSchema() {
  return schemaDocument(
    "313_practice_continuity_message.schema.json",
    "PracticeContinuityMessage",
    "Outward origin-practice message contract. Separates transport acceptance, delivery evidence, delivery risk, and acknowledgement evidence while binding them to the current tuple and current generation.",
    {
      practiceContinuityMessageId: refField("Stable identifier for the continuity message."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      appointmentRecordRef: refField("HubAppointmentRecord referenced by the message."),
      continuityChannel: enumField(CONTINUITY_CHANNELS, "Delivery channel selected for cross-organisation continuity."),
      dispatchWorkflowId: refField("Workflow or routing identifier used by the transport."),
      visibilityEnvelopeVersionRef: refField("Visibility envelope version used to assemble the payload."),
      practiceVisibilityPolicyRef: refField("Current practice visibility policy ref."),
      serviceObligationPolicyRef: refField("Current service-obligation policy ref."),
      policyEvaluationRef: refField("Current policy evaluation ref used for message emission."),
      ackGeneration: integerField("Current acknowledgement generation carried by this message.", 0),
      truthTupleHash: refField("Current truth tuple hash."),
      causalToken: refField("Causal token that correlates message, projection, and acknowledgement."),
      transportState: enumField(TRANSPORT_STATES, "Transport acceptance state."),
      transportAcceptedAt: dateTimeField("Time at which transport acceptance occurred.", true),
      deliveryState: enumField(DELIVERY_STATES, "Delivery evidence state."),
      deliveryEvidenceRef: refField("Delivery evidence or receipt checkpoint ref.", true),
      deliveryRiskState: enumField(DELIVERY_RISK_STATES, "Current delivery risk posture."),
      acknowledgementEvidenceState: enumField(
        ACK_EVIDENCE_STATES,
        "Whether acknowledgement evidence is missing, current, superseded, or legally excepted.",
      ),
      acknowledgementEvidenceRef: refField("Current acknowledgement evidence ref.", true),
      payloadChecksum: refField("Checksum of the emitted payload."),
      dedupeKey: refField("Dedupe contract for retries and replay-safe resends."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "practiceContinuityMessageId",
      "hubCoordinationCaseId",
      "appointmentRecordRef",
      "continuityChannel",
      "dispatchWorkflowId",
      "visibilityEnvelopeVersionRef",
      "practiceVisibilityPolicyRef",
      "serviceObligationPolicyRef",
      "policyEvaluationRef",
      "ackGeneration",
      "truthTupleHash",
      "causalToken",
      "transportState",
      "deliveryState",
      "deliveryRiskState",
      "acknowledgementEvidenceState",
      "payloadChecksum",
      "dedupeKey",
      "sourceRefs",
    ],
  );
}

function buildPracticeAcknowledgementRecordSchema() {
  return schemaDocument(
    "313_practice_acknowledgement_record.schema.json",
    "PracticeAcknowledgementRecord",
    "Generation-bound acknowledgement record. Only current-generation evidence on the live tuple may clear current debt.",
    {
      acknowledgementId: refField("Stable acknowledgement identifier."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      practiceContinuityMessageRef: refField("PracticeContinuityMessage being acknowledged."),
      ackGeneration: integerField("Acknowledgement generation referenced by this evidence.", 0),
      truthTupleHash: refField("Current truth tuple hash."),
      causalToken: refField("Causal token matching the message and projection."),
      ackState: enumField(ACK_RECORD_STATES, "Acknowledgement state."),
      ackEvidenceKind: enumField(ACK_EVIDENCE_KINDS, "Kind of acknowledgement evidence received."),
      acknowledgedAt: dateTimeField("Time at which acknowledgement was recorded.", true),
      acknowledgedByRef: refField("Mailbox, API principal, or attesting actor.", true),
      visibilityEnvelopeVersionRef: refField("Visibility envelope version used by the acknowledged payload."),
      policyEvaluationRef: refField("Policy evaluation ref active when the acknowledgement was accepted."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "acknowledgementId",
      "hubCoordinationCaseId",
      "practiceContinuityMessageRef",
      "ackGeneration",
      "truthTupleHash",
      "causalToken",
      "ackState",
      "ackEvidenceKind",
      "visibilityEnvelopeVersionRef",
      "policyEvaluationRef",
      "sourceRefs",
    ],
  );
}

function buildPracticeVisibilityProjectionSchema() {
  return schemaDocument(
    "313_practice_visibility_projection.schema.json",
    "PracticeVisibilityProjection",
    "Minimum-necessary origin-practice projection. Bound to one envelope version, one acting scope, one policy tuple, and one acknowledgement generation.",
    {
      practiceVisibilityProjectionId: refField("Stable projection identifier."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      visibilityEnvelopeVersionRef: refField("Current visibility envelope version."),
      crossOrganisationVisibilityEnvelopeRef: refField("Cross-organisation visibility envelope reference."),
      actingScopeTupleRef: refField("Acting scope tuple reference."),
      practiceVisibilityPolicyRef: refField("Practice visibility policy ref."),
      serviceObligationPolicyRef: refField("Service-obligation policy ref."),
      policyEvaluationRef: refField("Current policy evaluation ref."),
      minimumNecessaryContractRef: refField("Current minimum-necessary contract ref."),
      policyTupleHash: refField("Current policy tuple hash."),
      ackGeneration: integerField("Acknowledgement generation represented by this projection.", 0),
      practiceAcknowledgementState: enumField(PRACTICE_ACK_STATES, "Acknowledgement state carried into the projection."),
      truthTupleHash: refField("Current truth tuple hash."),
      patientSafeStatus: refField("Patient-safe macro status visible to the origin practice."),
      projectionState: enumField(PROJECTION_STATES, "Projection freshness or supersession state."),
      visibleFieldRefs: stringArrayField("Allowed visible field refs for origin-practice surfaces.", 1),
      hiddenFieldRefs: stringArrayField("Fields that must remain hidden from origin-practice visibility.", 1),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "practiceVisibilityProjectionId",
      "hubCoordinationCaseId",
      "visibilityEnvelopeVersionRef",
      "crossOrganisationVisibilityEnvelopeRef",
      "actingScopeTupleRef",
      "practiceVisibilityPolicyRef",
      "serviceObligationPolicyRef",
      "policyEvaluationRef",
      "minimumNecessaryContractRef",
      "policyTupleHash",
      "ackGeneration",
      "practiceAcknowledgementState",
      "truthTupleHash",
      "patientSafeStatus",
      "projectionState",
      "visibleFieldRefs",
      "hiddenFieldRefs",
      "sourceRefs",
    ],
  );
}

function buildNetworkManageCapabilitiesSchema() {
  return schemaDocument(
    "313_network_manage_capabilities.schema.json",
    "NetworkManageCapabilities",
    "Leased manage authority for one current appointment version. May degrade to stale, blocked, or expired without leaving stale CTAs live.",
    {
      networkManageCapabilitiesId: refField("Stable manage-capability identifier."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      hubAppointmentId: refField("HubAppointmentRecord that manage posture refers to."),
      appointmentVersionRef: refField("Current appointment version used for manage decisions."),
      capabilityState: enumField(MANAGE_CAPABILITY_STATES, "Current capability lease state."),
      readOnlyMode: enumField(READ_ONLY_MODES, "Interactive or read-only posture."),
      reasonCode: refField("Primary reason for the current capability posture."),
      policyTupleHash: refField("Current policy tuple hash."),
      truthTupleHash: refField("Current truth tuple hash."),
      visibilityEnvelopeVersionRef: refField("Visibility envelope version active for manage posture."),
      supplierTruthVersionRef: refField("Supplier truth version or mirror revision used to compile the lease."),
      sessionFenceToken: refField("Current session fence."),
      subjectFenceToken: refField("Current subject fence."),
      manageWindowEndsAt: dateTimeField("Time at which the current lease naturally expires."),
      allowedActions: stringArrayField("Currently allowed actions under the lease.", 0),
      blockedReasonRefs: stringArrayField("Typed blockers that demoted the lease.", 0),
      fallbackRouteRef: refField("Fallback route for blocked or stale manage posture.", true),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "networkManageCapabilitiesId",
      "hubCoordinationCaseId",
      "hubAppointmentId",
      "appointmentVersionRef",
      "capabilityState",
      "readOnlyMode",
      "reasonCode",
      "policyTupleHash",
      "truthTupleHash",
      "visibilityEnvelopeVersionRef",
      "supplierTruthVersionRef",
      "sessionFenceToken",
      "subjectFenceToken",
      "manageWindowEndsAt",
      "allowedActions",
      "blockedReasonRefs",
      "sourceRefs",
    ],
  );
}

function buildPracticeVisibilityDeltaRecordSchema() {
  return schemaDocument(
    "313_practice_visibility_delta_record.schema.json",
    "PracticeVisibilityDeltaRecord",
    "Monotone-safe practice-visibility delta. May not lower ackGeneration or supersede newer envelope versions.",
    {
      practiceVisibilityDeltaRecordId: refField("Stable delta identifier."),
      hubCoordinationCaseId: refField("Owning hub coordination case."),
      priorProjectionRef: refField("Previous projection reference.", true),
      nextProjectionRef: refField("Next projection reference."),
      priorAckGeneration: integerField("Previous acknowledgement generation.", 0),
      nextAckGeneration: integerField("Next acknowledgement generation.", 0),
      priorVisibilityEnvelopeVersionRef: refField("Previous visibility envelope version.", true),
      nextVisibilityEnvelopeVersionRef: refField("Next visibility envelope version."),
      truthTupleHash: refField("Current truth tuple hash used for the delta."),
      deltaReason: enumField(VISIBILITY_DELTA_REASONS, "Reason for the delta emission."),
      monotoneValidation: enumField(
        MONOTONE_VALIDATIONS,
        "Validation outcome proving the delta did not move backward in generation or envelope ordering.",
      ),
      recordedAt: dateTimeField("Time the delta was recorded."),
      sourceRefs: stringArrayField("Algorithm source refs carried into the contract pack.", 1),
    },
    [
      "practiceVisibilityDeltaRecordId",
      "hubCoordinationCaseId",
      "nextProjectionRef",
      "priorAckGeneration",
      "nextAckGeneration",
      "nextVisibilityEnvelopeVersionRef",
      "truthTupleHash",
      "deltaReason",
      "monotoneValidation",
      "recordedAt",
      "sourceRefs",
    ],
  );
}

function buildExternalReferenceNotes() {
  return {
    taskId: SHORT_TASK_ID,
    reviewedAt: `${TODAY}T12:00:00Z`,
    summary:
      "Official references were used only to support current terminology, transport realism, NHS transactional-copy patterns, and browser-proof technique. The local blueprint remained authoritative where semantics diverged.",
    sources: [
      {
        sourceId: "hl7_appointment_r4",
        title: "Appointment - FHIR v4.0.1",
        url: "https://hl7.org/fhir/R4/appointment.html",
        publisher: "HL7",
        observedOn: TODAY,
        borrowedInto: [
          "AlternativeOfferSession and HubCommitAttempt docs: slot discovery does not guarantee booking.",
          "Truth rules: Appointment.status='proposed' and later overall status updates reinforce that confirmation is not immediate booked certainty.",
          "Waitlist and alternative-offer examples support keeping booked slot and waitlisted preference as distinct objects.",
        ],
        rejectedOrConstrained: [
          "Did not replace the local monotone confirmation gate with raw FHIR status transitions.",
        ],
      },
      {
        sourceId: "hl7_slot_r4",
        title: "Slot - FHIR v4.0.1",
        url: "https://hl7.org/fhir/R4/slot.html",
        publisher: "HL7",
        observedOn: TODAY,
        borrowedInto: [
          "312-to-313 boundary notes: slots are free/busy intervals and may be overbooked or reserved for specific uses.",
          "313 commit law: slot visibility may increase chances of successful booking but is not booking truth.",
        ],
        rejectedOrConstrained: [
          "Did not let slot identity overstate authoritative appointment truth or practice acknowledgement.",
        ],
      },
      {
        sourceId: "hl7_appointment_response_r4",
        title: "AppointmentResponse - FHIR v4.0.1",
        url: "https://www.hl7.org/fhir/R4/appointmentresponse.html",
        publisher: "HL7",
        observedOn: TODAY,
        borrowedInto: [
          "Acknowledgement vocabulary notes: participant responses remain separate facts from the appointment request itself.",
        ],
        rejectedOrConstrained: [
          "Did not equate FHIR participantStatus with the local practice acknowledgement debt contract.",
        ],
      },
      {
        sourceId: "nhs_mesh_service",
        title: "Message Exchange for Social Care and Health",
        url: "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
        publisher: "NHS England Digital",
        observedOn: TODAY,
        borrowedInto: [
          "PracticeContinuityMessage docs: MESH is the nationally recognised secure cross-organisation transfer mechanism.",
          "Continuity chain law: transport, recipient retrieval, message tracking, and non-delivery reports are separate observable facts.",
        ],
        rejectedOrConstrained: [
          "Did not treat MESH transport acceptance or download acknowledgement as equivalent to clinical practice acknowledgement.",
        ],
      },
      {
        sourceId: "nhs_mesh_client_user_guide",
        title: "Message Exchange for Social Care and Health: client user guide",
        url: "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/client-user-guide",
        publisher: "NHS England Digital",
        observedOn: TODAY,
        borrowedInto: [
          "PracticeContinuityMessage docs: sent, failed, in, and out folders reinforce separate transport and receive-side states.",
          "Gap seams for later dispatch chains: receiving and monitoring are explicit operational concerns, not hidden send side effects.",
        ],
        rejectedOrConstrained: [
          "Did not assume mailbox download proves the origin practice has reviewed or acknowledged the change.",
        ],
      },
      {
        sourceId: "nhs_question_pages",
        title: "Question pages",
        url: "https://service-manual.nhs.uk/design-system/patterns/question-pages",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Atlas layout: the offer lane keeps one primary question focus at a time and preserves the back path.",
          "Choice review notes: browser back state must preserve the last seen state rather than silently rebuilding a different flow.",
        ],
        rejectedOrConstrained: [
          "Did not turn the atlas into a generic form wizard; the atlas stays an operational truth board.",
        ],
      },
      {
        sourceId: "nhs_check_answers",
        title: "Check answers",
        url: "https://service-manual.nhs.uk/design-system/patterns/check-answers",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Atlas copy: confirmation and review surfaces keep explicit change paths and pre-populated return expectations.",
          "Patient-facing confirmation lane: action labels remain explicit about whether the user is confirming, saving, or sending.",
        ],
        rejectedOrConstrained: [
          "Did not add a generic check-answers page inside the operational atlas; only the copy discipline was borrowed.",
        ],
      },
      {
        sourceId: "nhs_back_link",
        title: "Back link",
        url: "https://service-manual.nhs.uk/design-system/components/back-link",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Atlas navigation: state rail and offer review preserve go-back behaviour without losing previously entered context.",
        ],
        rejectedOrConstrained: [
          "Did not rely on browser-only history as a substitute for same-shell continuity references.",
        ],
      },
      {
        sourceId: "nhs_confirmation_page",
        title: "Confirmation page",
        url: "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
        publisher: "NHS digital service manual",
        observedOn: TODAY,
        borrowedInto: [
          "Patient confirmation lane: calm booked posture uses a reassuring confirmation cue only after authoritative confirmation.",
          "Copy guidance: next-step detail is kept concise so the confirmation surface does not overwhelm users.",
        ],
        rejectedOrConstrained: [
          "Did not show a green booked confirmation panel in pending or disputed states.",
        ],
      },
      {
        sourceId: "playwright_best_practices",
        title: "Best Practices",
        url: "https://playwright.dev/docs/best-practices",
        publisher: "Playwright",
        observedOn: TODAY,
        borrowedInto: [
          "313 browser proof: locator strategy uses user-facing roles and test IDs plus web-first assertions.",
          "No external-request proof and reduced-motion/mobile passes follow Playwright isolation guidance.",
        ],
        rejectedOrConstrained: [
          "Did not add third-party dependency probing to the atlas tests.",
        ],
      },
      {
        sourceId: "playwright_trace_viewer",
        title: "Trace viewer",
        url: "https://playwright.dev/docs/trace-viewer-intro",
        publisher: "Playwright",
        observedOn: TODAY,
        borrowedInto: [
          "313 browser proof: the spec records trace.zip artifacts for desktop and mobile atlas runs.",
        ],
        rejectedOrConstrained: [
          "Did not enable always-on tracing for every local test run because the atlas proof stays lightweight.",
        ],
      },
      {
        sourceId: "playwright_aria_snapshots",
        title: "Snapshot testing",
        url: "https://playwright.dev/docs/aria-snapshots",
        publisher: "Playwright",
        observedOn: TODAY,
        borrowedInto: [
          "313 browser proof: ARIA snapshots are captured for the atlas root and parity tables.",
        ],
        rejectedOrConstrained: [
          "Did not turn the spec into snapshot-only testing; explicit state assertions remain primary.",
        ],
      },
      {
        sourceId: "linear_peek",
        title: "Peek preview",
        url: "https://linear.app/docs/peek",
        publisher: "Linear Docs",
        observedOn: TODAY,
        borrowedInto: [],
        rejectedOrConstrained: [
          "Rejected as the main atlas interaction model because the truth board needs a persistent synchronized inspector, not an ephemeral preview overlay.",
        ],
      },
      {
        sourceId: "vercel_observability",
        title: "Observability",
        url: "https://vercel.com/docs/observability",
        publisher: "Vercel",
        observedOn: TODAY,
        borrowedInto: [],
        rejectedOrConstrained: [
          "Rejected as a visual pattern source because route-analytics dashboards would over-emphasize telemetry over the monotone truth model.",
        ],
      },
      {
        sourceId: "carbon_data_table",
        title: "Data table usage",
        url: "https://carbondesignsystem.com/components/data-table/usage/",
        publisher: "IBM Carbon Design System",
        observedOn: TODAY,
        borrowedInto: [
          "Atlas parity tables: wide, dense tables are kept in the main content region with concise column titles.",
        ],
        rejectedOrConstrained: [
          "Did not adopt Carbon styling directly; only dense-table layout discipline informed the atlas.",
        ],
      },
      {
        sourceId: "carbon_right_panel",
        title: "UI shell right panel usage",
        url: "https://carbondesignsystem.com/components/UI-shell-right-panel/usage/",
        publisher: "IBM Carbon Design System",
        observedOn: TODAY,
        borrowedInto: [
          "Atlas inspector: fixed-width right-edge inspector remains structurally separate from the truth canvas.",
        ],
        rejectedOrConstrained: [
          "Did not copy Carbon shell icons or product-level UI shell conventions into the atlas.",
        ],
      },
    ],
    sourceRefs: ALL_SOURCE_REFS,
  };
}

function buildArchitectureDoc() {
  return `# 313 Phase 5 offer, commit, confirmation, and practice visibility contract

Task: \`${TASK_ID}\`  
Date: \`${TODAY}\`

## Outcome

This freeze pack establishes one authoritative Phase 5 contract family for:

- alternative offers and callback fallback
- fenced commit attempts and proof bundles
- monotone offer-to-confirmation truth
- outward practice continuity messaging
- generation-bound acknowledgement debt
- minimum-necessary origin-practice visibility
- leased network manage exposure

The local blueprint remains authoritative. Official references only shaped transport realism, NHS transactional copy discipline, and browser-proof technique.

## Source order

1. \`${SOURCE_REFS.phaseCards}\`
2. \`${SOURCE_REFS.phase5Offers}\`
3. \`${SOURCE_REFS.phase5Commit}\`
4. \`${SOURCE_REFS.phase5Visibility}\`
5. \`${SOURCE_REFS.phase4Truth}\`
6. \`${SOURCE_REFS.phase4Manage}\`
7. \`${SOURCE_REFS.phase0Replay}\`
8. \`${SOURCE_REFS.phase0Receipt}\`
9. \`${SOURCE_REFS.phase311Hub}\`
10. \`${SOURCE_REFS.phase312Policy}\`
11. \`${SOURCE_REFS.phase312Rank}\`

## Frozen object pack

${mdTable(
    ["Object", "Artifact", "Key law"],
    CONTRACT_SUMMARIES.map((entry) => [entry.name, entry.file, entry.law]),
  )}

## Commit modes

${mdTable(
    ["Mode", "What it means", "What it may never imply"],
    [
      [
        "native_api",
        "A live supplier-side commit path executed under the current reservation fence and provider binding.",
        "Booked truth before the confirmation gate clears.",
      ],
      [
        "manual_pending_confirmation",
        "Structured manual proof exists, but it remains provisional until authoritative confirmation is correlated.",
        "Calm booked reassurance or automatic practice acknowledgement.",
      ],
      [
        "imported_confirmation",
        "Imported evidence exists and may support confirmation only after lawful correlation to the live tuple and live binding.",
        "Quietly minting booked truth from unsolicited, wrong-case, or ambiguous evidence.",
      ],
    ],
  )}

## Monotone projection contract

${mdTable(
    ["Facet", "Current values carried in the projection", "Why it stays separate"],
    [
      [
        "Offer posture",
        OFFER_TO_CONFIRMATION_OFFER_STATES.join(", "),
        "Prevents open choice, selected choice, fallback choice, and superseded provenance from collapsing.",
      ],
      [
        "Confirmation truth",
        CONFIRMATION_TRUTH_STATES.join(", "),
        "Prevents manual or imported proof from quietly looking confirmed.",
      ],
      [
        "Patient confirmation",
        PATIENT_CONFIRMATION_STATES.join(", "),
        "Lets patient reassurance calm only after authoritative confirmation.",
      ],
      [
        "Practice visibility",
        PRACTICE_VISIBILITY_STATES.join(", "),
        "Keeps practice informed and practice acknowledged distinct.",
      ],
      [
        "Closure",
        CLOSURE_STATES.join(", "),
        "Prevents close while acknowledgement, fallback, or manage drift blockers remain open.",
      ],
    ],
  )}

## Truth-tuple law

The following artifacts are required to carry the same live \`truthTupleHash\`:

- \`AlternativeOfferSession\`
- \`HubCommitAttempt\`
- \`HubBookingEvidenceBundle\`
- \`HubAppointmentRecord\`
- \`PracticeContinuityMessage\`
- \`PracticeAcknowledgementRecord\`
- \`PracticeVisibilityProjection\`
- \`NetworkManageCapabilities\`

If a later tuple supersedes that hash, older objects remain auditable only. They may not settle booked calmness, clear acknowledgement debt, or keep stale manage CTAs live.

## Practice continuity and acknowledgement law

${mdTable(
    ["Lane", "Carrier object", "Meaning"],
    [
      [
        "Transport acceptance",
        "PracticeContinuityMessage.transportState",
        "Cross-organisation transport accepted or rejected the send attempt.",
      ],
      [
        "Delivery evidence",
        "PracticeContinuityMessage.deliveryState",
        "A message became available, downloaded, expired, or failed independently of acknowledgement.",
      ],
      [
        "Delivery risk",
        "PracticeContinuityMessage.deliveryRiskState",
        "Operational risk lane for non-delivery, timeout, or failure.",
      ],
      [
        "Acknowledgement evidence",
        "PracticeAcknowledgementRecord",
        "Current-generation acknowledgement or audited exception under the live tuple.",
      ],
    ],
  )}

## Minimum-necessary visibility

Visible fields for the origin practice are frozen to:

- ${VISIBLE_FIELD_REFS.join("\n- ")}

Hidden hub-only fields remain hidden:

- ${HIDDEN_FIELD_REFS.join("\n- ")}

The projection is bound to one visibility envelope version, one acting scope tuple, one minimum-necessary contract, one policy tuple, and one live acknowledgement generation.

## Manage exposure is leased

\`NetworkManageCapabilities\` is compiled from:

- current supplier truth version
- current policy tuple
- current visibility envelope version
- current appointment version
- current session fence
- current subject fence
- current truth tuple

The lease may degrade to \`stale\`, \`blocked\`, or \`expired\` and may force \`read_only\` posture. This is required to prevent stale buttons from surviving drift, reconciliation, or acknowledgement debt.

## Typed later-owned seams

${mdTable(
    ["Seam", "Owner", "Why it remains separate now"],
    GAP_SEAMS.map((seam) => [seam.seamId, seam.ownerTask, seam.purpose]),
  )}

## Official support references

See [313_external_reference_notes.json](/Users/test/Code/V/data/analysis/313_external_reference_notes.json) for the current official references that were borrowed, constrained, or rejected while building this pack.
`;
}

function buildApiDoc() {
  return `# 313 Phase 5 commit and practice visibility API contract

Task: \`${TASK_ID}\`

## Purpose

This document freezes the command and query surfaces that later implementation tracks must preserve while implementing the 313 contract pack.

## API surfaces

${mdTable(
    ["Method", "Path", "Primary contract", "Guardrail"],
    API_SURFACES.map((surface) => [surface.method, surface.path, surface.contract, surface.rule]),
  )}

## Event vocabulary

${mdTable(
    ["Event", "Aggregate", "Outcome"],
    EVENT_CATALOG.events.map((event) => [event.eventName, event.aggregate, event.outcome]),
  )}

## Current machine-readable contracts

${CONTRACT_SUMMARIES.map((entry) => `- [${entry.file}](/Users/test/Code/V/${entry.file})`).join("\n")}

## State vocabulary that downstream tracks may not redefine

- Offer session states: \`${OFFER_SESSION_STATES.join(" | ")}\`
- Commit attempt states: \`${COMMIT_ATTEMPT_STATES.join(" | ")}\`
- Confirmation truth states: \`${CONFIRMATION_TRUTH_STATES.join(" | ")}\`
- Practice visibility states: \`${PRACTICE_VISIBILITY_STATES.join(" | ")}\`
- Manage capability states: \`${MANAGE_CAPABILITY_STATES.join(" | ")}\`

## Hard rules

1. \`HubCommitAttempt\` is the only commit-side object allowed to talk to a native booking adapter or ingest imported confirmation toward booked truth.
2. \`HubOfferToConfirmationTruthProjection\` is the only current projection allowed to calm patient confirmation, practice visibility, or close posture.
3. \`PracticeContinuityMessage\` keeps transport, delivery, risk, and acknowledgement lanes separate.
4. \`PracticeAcknowledgementRecord\` must match the live \`ackGeneration\`, live \`truthTupleHash\`, and live visibility policy evaluation before it can clear debt.
5. \`NetworkManageCapabilities\` is leased and may degrade to \`blocked\`, \`stale\`, or \`expired\` with \`read_only\` posture.

## Later implementation ownership

- \`par_321\` implements commit orchestration, evidence bundles, appointment records, and confirmation-gate updates.
- \`par_322\` implements continuity dispatch, delivery evidence, and acknowledgement routing while preserving this vocabulary.
- \`par_324\` implements reminder, manage, and practice-visibility refresh flows against these contracts.
- \`par_325\` implements reconciliation, supplier-mirror drift, and background integrity against these contracts.
`;
}

function buildSecurityDoc() {
  return `# 313 Phase 5 truth tuple, ack generation, and minimum-necessary rules

Task: \`${TASK_ID}\`

## Mandatory laws

1. No booked truth before authoritative confirmation.
2. \`truthTupleHash\` correlation is mandatory across offer, commit, evidence, appointment, continuity, acknowledgement, visibility, and manage lease objects.
3. Patient confirmation, practice informed, and practice acknowledged remain separate facets.
4. Transport acceptance is not practice acknowledgement.
5. \`NetworkManageCapabilities\` is leased, not static.
6. \`PracticeVisibilityProjection\` is minimum-necessary, envelope-bound, and scope-bound.
7. \`PracticeVisibilityDeltaRecord\` may not lower \`ackGeneration\` or supersede newer visibility envelopes.
8. Stale tuples and stale generations remain auditable only.

## Debt-clearance matrix

${mdTable(
    [
      "Scenario",
      "Tuple status",
      "Generation status",
      "Transport",
      "Delivery",
      "Ack state",
      "Clears debt?",
      "Resulting visibility state",
    ],
    TRUTH_TUPLE_ACK_MATRIX_ROWS.map((row) => [
      row.scenarioId,
      row.truthTupleStatus,
      row.ackGenerationStatus,
      row.transportState,
      row.deliveryState,
      row.ackState,
      row.clearsCurrentDebt,
      row.resultingPracticeVisibilityState,
    ]),
  )}

## Minimum-necessary visibility boundary

${mdTable(
    ["Visible to origin practice", "Never widen from 313"],
    VISIBLE_FIELD_REFS.map((field, index) => [
      field,
      HIDDEN_FIELD_REFS[index] ?? "Additional hub-only replay and evidence detail",
    ]),
  )}

## Rejected shortcuts

- MESH receipt or download does not equal practice acknowledgement.
- A stale generation acknowledgement does not clear current debt.
- A stale tuple acknowledgement does not clear current debt.
- A weak imported confirmation does not calm patient confirmation or manage posture.
- A cached or browser-local manage button set does not survive supplier drift or acknowledgement drift.
- Practice visibility may not be reconstructed from the latest message text without the current projection, envelope, and generation.

## Manage lease degradation

${mdTable(
    ["Capability state", "Read-only mode", "Typical trigger", "User-facing consequence"],
    [
      ["live", "interactive", "Current supplier, tuple, and acknowledgement truth all align.", "Manage actions may remain interactive."],
      ["stale", "read_only", "Booked truth exists but current acknowledgement or supplier drift posture is unresolved.", "View only plus typed guidance."],
      ["blocked", "read_only", "Tuple drift, identity hold, unsupported route, or current reconciliation dispute.", "No stale CTA survives."],
      ["expired", "read_only", "Lease window or appointment version has expired.", "A fresh capability compilation is required."],
    ],
  )}

## Supporting artifacts

- [313_truth_tuple_and_ack_generation_matrix.csv](/Users/test/Code/V/data/analysis/313_truth_tuple_and_ack_generation_matrix.csv)
- [313_commit_visibility_gap_log.json](/Users/test/Code/V/data/analysis/313_commit_visibility_gap_log.json)
- [313_commit_and_visibility_event_catalog.json](/Users/test/Code/V/data/contracts/313_commit_and_visibility_event_catalog.json)
`;
}

function buildAtlasHtml() {
  const atlasData = {
    visualMode: VISUAL_MODE,
    truthTupleHash: TRUTH_TUPLE_HASH,
    policyTupleHash: POLICY_TUPLE_HASH,
    activeObjects: {
      offerSessionRef: OFFER_SESSION.alternativeOfferSessionId,
      commitAttemptRef: COMMIT_ATTEMPT.commitAttemptId,
      appointmentRecordRef: APPOINTMENT_RECORD.hubAppointmentId,
      continuityMessageRef: PRACTICE_CONTINUITY_MESSAGE.practiceContinuityMessageId,
      acknowledgementRecordRef: PRACTICE_ACKNOWLEDGEMENT_RECORD.acknowledgementId,
    },
    states: TRUTH_STATES,
  };

  const escapedData = JSON.stringify(atlasData).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>313 Phase 5 Confirmation And Practice Visibility Atlas</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F7F8FA;
        --panel: #FFFFFF;
        --inset: #E8EEF3;
        --text-strong: #0F172A;
        --text-default: #334155;
        --text-muted: #64748B;
        --offer-accent: #3158E0;
        --pending-accent: #B7791F;
        --confirmed-accent: #0F766E;
        --practice-accent: #5B61F6;
        --blocked-accent: #B42318;
        --line: #D6DEE6;
        --shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
        --radius: 12px;
        --transition: 180ms ease;
        font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
      }

      @media (prefers-reduced-motion: reduce) {
        :root {
          --transition: 0ms linear;
        }
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--text-default);
        background:
          radial-gradient(circle at top right, rgba(49, 88, 224, 0.09), transparent 26%),
          linear-gradient(180deg, #f4f7fb 0%, var(--canvas) 45%, #edf2f7 100%);
      }

      .skip-link {
        position: absolute;
        left: 16px;
        top: -44px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--text-strong);
        color: white;
        z-index: 10;
      }

      .skip-link:focus {
        top: 12px;
      }

      .page {
        min-height: 100vh;
        padding: 20px;
      }

      .atlas {
        max-width: 1740px;
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .masthead {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 18px 24px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82));
      }

      .brand h1 {
        margin: 0;
        font-family: "Iowan Old Style", Georgia, serif;
        font-size: 24px;
        line-height: 1.08;
        color: var(--text-strong);
      }

      .brand p {
        margin: 5px 0 0;
        font-size: 13px;
        color: var(--text-muted);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 11px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--inset);
        color: var(--text-default);
      }

      .layout {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 420px;
        min-height: 980px;
      }

      .rail,
      .canvas,
      .inspector {
        min-width: 0;
      }

      .rail,
      .inspector {
        background: rgba(255, 255, 255, 0.88);
      }

      .rail {
        border-right: 1px solid var(--line);
        padding: 20px;
      }

      .canvas {
        padding: 20px;
      }

      .inspector {
        border-left: 1px solid var(--line);
        padding: 20px;
      }

      .section-label {
        margin: 0 0 12px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .stack {
        display: grid;
        gap: 16px;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        padding: 16px;
        min-width: 0;
      }

      .card h2,
      .card h3 {
        margin: 0 0 8px;
        color: var(--text-strong);
      }

      .card h2 {
        font-size: 18px;
      }

      .card h3 {
        font-size: 15px;
      }

      .card p,
      .card li,
      .card td,
      .card th {
        font-size: 14px;
        line-height: 1.5;
      }

      .state-list {
        display: grid;
        gap: 8px;
      }

      .state-button,
      .message-row-button {
        width: 100%;
        text-align: left;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--panel);
        color: inherit;
        font: inherit;
        cursor: pointer;
        transition:
          border-color var(--transition),
          box-shadow var(--transition),
          background var(--transition),
          transform var(--transition);
      }

      .state-button {
        padding: 12px 13px;
      }

      .message-row-button {
        padding: 0;
        overflow: hidden;
      }

      .state-button:hover,
      .state-button:focus-visible,
      .message-row-button:hover,
      .message-row-button:focus-visible {
        outline: none;
        border-color: var(--offer-accent);
        box-shadow: 0 0 0 3px rgba(49, 88, 224, 0.12);
      }

      .state-button[data-active="true"] {
        border-color: var(--offer-accent);
        background: rgba(49, 88, 224, 0.08);
        transform: translateX(2px);
      }

      .message-row-button[data-active="true"] {
        border-color: var(--practice-accent);
        box-shadow: 0 0 0 3px rgba(91, 97, 246, 0.12);
      }

      .button-title {
        display: block;
        font-weight: 600;
        color: var(--text-strong);
      }

      .button-note {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-muted);
      }

      .truth-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .lane {
        position: relative;
      }

      .lane::before {
        content: "";
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
        border-radius: 999px;
      }

      .lane[data-accent="offer"]::before {
        background: var(--offer-accent);
      }

      .lane[data-accent="pending"]::before {
        background: var(--pending-accent);
      }

      .lane[data-accent="confirmed"]::before {
        background: var(--confirmed-accent);
      }

      .lane[data-accent="practice"]::before {
        background: var(--practice-accent);
      }

      .lane-cue {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--inset);
        color: var(--text-default);
      }

      .lane ul,
      .inspector ul {
        margin: 0;
        padding-left: 18px;
      }

      .parity-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .slim-grid {
        display: grid;
        grid-template-columns: 160px minmax(0, 1fr);
        gap: 12px;
      }

      .ack-ladder {
        display: grid;
        gap: 8px;
      }

      .ladder-step {
        padding: 10px;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: var(--inset);
      }

      .ladder-step[data-highlight="true"] {
        border-color: var(--practice-accent);
        background: rgba(91, 97, 246, 0.08);
      }

      .ladder-step strong {
        color: var(--text-strong);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      caption {
        text-align: left;
        margin-bottom: 10px;
        color: var(--text-strong);
        font-weight: 600;
      }

      th,
      td {
        border-bottom: 1px solid var(--line);
        padding: 10px 8px;
        vertical-align: top;
        text-align: left;
      }

      th {
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .subdued {
        color: var(--text-muted);
      }

      .projection-strip {
        display: grid;
        gap: 10px;
      }

      .projection-row {
        display: grid;
        grid-template-columns: 170px minmax(0, 1fr);
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--inset);
      }

      .projection-row strong {
        color: var(--text-strong);
      }

      @media (max-width: 1380px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .rail,
        .inspector {
          border: 0;
          border-top: 1px solid var(--line);
        }

        .truth-grid,
        .parity-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .page {
          padding: 12px;
        }

        .masthead {
          padding: 16px;
        }

        .slim-grid,
        .projection-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#atlas-main">Skip to atlas</a>
    <div class="page">
      <div
        class="atlas"
        data-testid="Phase5CommitVisibilityAtlas"
        data-visual-mode="${VISUAL_MODE}"
        data-active-state="offer_live"
        data-active-message="message_not_started"
      >
        <header class="masthead">
          <div class="brand">
            <h1>Confirmation and practice visibility atlas</h1>
            <p>313 freeze pack: monotone truth, generation-bound acknowledgement, and leased manage posture.</p>
          </div>
          <div class="meta">
            <span class="pill">Truth tuple <strong>${TRUTH_TUPLE_HASH.slice(0, 12)}</strong></span>
            <span class="pill">Policy tuple <strong>${POLICY_TUPLE_HASH.slice(0, 12)}</strong></span>
            <span class="pill">Ack generation <strong>4</strong></span>
          </div>
        </header>
        <div class="layout">
          <aside class="rail">
            <div class="stack">
              <section>
                <p class="section-label">Lifecycle rail</p>
                <div class="state-list" id="state-list" data-testid="TruthStateRail"></div>
              </section>
              <section class="card">
                <p class="section-label">Current objects</p>
                <ul id="current-object-list"></ul>
              </section>
            </div>
          </aside>
          <main class="canvas" id="atlas-main">
            <div class="stack">
              <section class="truth-grid" data-testid="TruthCanvas">
                <article class="card lane" data-accent="offer" data-testid="PatientChoiceLane">
                  <p class="section-label">Lane 1</p>
                  <h2 id="patient-choice-title"></h2>
                  <div class="lane-cue" id="patient-choice-cue"></div>
                  <ul id="patient-choice-bullets"></ul>
                </article>
                <article class="card lane" data-accent="pending" data-testid="CommitEvidenceLane">
                  <p class="section-label">Lane 2</p>
                  <h2 id="commit-evidence-title"></h2>
                  <div class="lane-cue" id="commit-evidence-cue"></div>
                  <ul id="commit-evidence-bullets"></ul>
                </article>
                <article class="card lane" data-accent="confirmed" data-testid="PatientConfirmationLane">
                  <p class="section-label">Lane 3</p>
                  <h2 id="patient-confirmation-title"></h2>
                  <div class="lane-cue" id="patient-confirmation-cue"></div>
                  <ul id="patient-confirmation-bullets"></ul>
                </article>
                <article class="card lane" data-accent="practice" data-testid="PracticeVisibilityLane">
                  <p class="section-label">Lane 4</p>
                  <h2 id="practice-visibility-title"></h2>
                  <div class="lane-cue" id="practice-visibility-cue"></div>
                  <ul id="practice-visibility-bullets"></ul>
                  <div class="slim-grid" style="margin-top: 14px;">
                    <div>
                      <h3>Slim generation ladder</h3>
                      <div class="ack-ladder" id="ack-ladder" data-testid="AckGenerationLadder"></div>
                    </div>
                    <div>
                      <table data-testid="MessageChainTable">
                        <caption>Message chain strip</caption>
                        <thead>
                          <tr>
                            <th scope="col">Message</th>
                            <th scope="col">Transport</th>
                            <th scope="col">Delivery</th>
                            <th scope="col">Ack</th>
                          </tr>
                        </thead>
                        <tbody id="message-chain-body"></tbody>
                      </table>
                    </div>
                  </div>
                </article>
              </section>
              <section class="parity-grid">
                <div class="card">
                  <table data-testid="TruthTupleParityTable">
                    <caption>Truth tuple parity</caption>
                    <thead>
                      <tr>
                        <th scope="col">Field</th>
                        <th scope="col">Current value</th>
                      </tr>
                    </thead>
                    <tbody id="tuple-parity-body"></tbody>
                  </table>
                </div>
                <div class="card">
                  <table data-testid="AckGenerationParityTable">
                    <caption>Acknowledgement generation parity</caption>
                    <thead>
                      <tr>
                        <th scope="col">Generation</th>
                        <th scope="col">Status</th>
                        <th scope="col">Clears debt?</th>
                      </tr>
                    </thead>
                    <tbody id="ack-parity-body"></tbody>
                  </table>
                </div>
                <div class="card">
                  <table data-testid="BlockerParityTable">
                    <caption>Blocker parity</caption>
                    <thead>
                      <tr>
                        <th scope="col">Blocker</th>
                        <th scope="col">Impact</th>
                      </tr>
                    </thead>
                    <tbody id="blocker-parity-body"></tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
          <aside class="inspector">
            <div class="stack">
              <section class="card">
                <p class="section-label">Active truth state</p>
                <h2 id="active-state-title"></h2>
                <p id="active-state-summary"></p>
                <div class="projection-strip" id="projection-strip"></div>
              </section>
              <section class="card" data-testid="ManageCapabilityCard">
                <p class="section-label">Manage capability lease</p>
                <h2 id="manage-title"></h2>
                <table>
                  <tbody id="manage-body"></tbody>
                </table>
                <ul id="manage-blockers"></ul>
              </section>
              <section class="card" data-testid="MessageDetailCard">
                <p class="section-label">Selected message row</p>
                <h2 id="message-detail-title"></h2>
                <table>
                  <tbody id="message-detail-body"></tbody>
                </table>
                <p id="message-detail-note" class="subdued"></p>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
    <script>
      const atlasData = ${escapedData};
      const root = document.querySelector("[data-testid='Phase5CommitVisibilityAtlas']");
      const stateMap = new Map(atlasData.states.map((entry) => [entry.stateId, entry]));
      let activeStateId = atlasData.states[0].stateId;
      let activeMessageId = atlasData.states[0].messageRows[0].messageId;

      function create(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
      }

      function currentState() {
        return stateMap.get(activeStateId);
      }

      function currentMessage() {
        return currentState().messageRows.find((row) => row.messageId === activeMessageId) || currentState().messageRows[0];
      }

      function renderStateButtons() {
        const container = document.getElementById("state-list");
        container.innerHTML = "";
        atlasData.states.forEach((state, index) => {
          const button = create("button", "state-button");
          button.type = "button";
          button.dataset.id = state.stateId;
          button.dataset.index = String(index);
          button.dataset.active = String(state.stateId === activeStateId);
          button.setAttribute("aria-pressed", String(state.stateId === activeStateId));
          button.appendChild(create("span", "button-title", state.label));
          button.appendChild(create("span", "button-note", state.railNote));
          button.addEventListener("click", () => {
            activeStateId = state.stateId;
            sync();
          });
          button.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const nextIndex =
              event.key === "ArrowDown"
                ? Math.min(index + 1, atlasData.states.length - 1)
                : Math.max(index - 1, 0);
            activeStateId = atlasData.states[nextIndex].stateId;
            sync();
            requestAnimationFrame(() => {
              const next = document.querySelector('.state-button[data-id="' + atlasData.states[nextIndex].stateId + '"]');
              if (next) next.focus();
            });
          });
          container.appendChild(button);
        });
      }

      function renderCurrentObjects() {
        const container = document.getElementById("current-object-list");
        container.innerHTML = "";
        Object.entries(atlasData.activeObjects).forEach(([key, value]) => {
          const item = create("li", "", key + ": " + value);
          container.appendChild(item);
        });
      }

      function renderLane(prefix, lane) {
        document.getElementById(prefix + "-title").textContent = lane.title;
        const cue = document.getElementById(prefix + "-cue");
        cue.textContent = lane.cue;
        const list = document.getElementById(prefix + "-bullets");
        list.innerHTML = "";
        lane.bullets.forEach((bullet) => list.appendChild(create("li", "", bullet)));
      }

      function renderPracticeLane(state) {
        renderLane("practice-visibility", state.lanes.practiceVisibility);

        const ladder = document.getElementById("ack-ladder");
        ladder.innerHTML = "";
        const activeMessage = currentMessage();
        state.ackRows.forEach((row) => {
          const step = create("div", "ladder-step");
          step.dataset.highlight = String(row.generation === activeMessage.ackGeneration);
          step.appendChild(create("strong", "", "Gen " + row.generation + " · " + row.status));
          step.appendChild(create("div", "subdued", row.source));
          step.appendChild(create("div", "", row.note));
          ladder.appendChild(step);
        });

        const tbody = document.getElementById("message-chain-body");
        tbody.innerHTML = "";
        state.messageRows.forEach((row, index) => {
          const tr = document.createElement("tr");
          const button = create("button", "message-row-button");
          button.type = "button";
          button.dataset.id = row.messageId;
          button.dataset.index = String(index);
          button.dataset.active = String(row.messageId === activeMessageId);
          button.setAttribute("aria-pressed", String(row.messageId === activeMessageId));
          const inner = document.createElement("table");
          inner.innerHTML =
            "<tbody><tr>" +
            "<td>" + row.label + "</td>" +
            "<td>" + row.transportState + "</td>" +
            "<td>" + row.deliveryState + "</td>" +
            "<td>" + row.ackEvidenceState + " / gen " + row.ackGeneration + "</td>" +
            "</tr></tbody>";
          button.appendChild(inner);
          button.addEventListener("click", () => {
            activeMessageId = row.messageId;
            sync(false);
          });
          button.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const nextIndex =
              event.key === "ArrowDown"
                ? Math.min(index + 1, state.messageRows.length - 1)
                : Math.max(index - 1, 0);
            activeMessageId = state.messageRows[nextIndex].messageId;
            sync(false);
            requestAnimationFrame(() => {
              const next = document.querySelector('.message-row-button[data-id="' + state.messageRows[nextIndex].messageId + '"]');
              if (next) next.focus();
            });
          });
          const td = document.createElement("td");
          td.colSpan = 4;
          td.style.padding = "0";
          td.appendChild(button);
          tr.appendChild(td);
          tbody.appendChild(tr);
        });
      }

      function renderParityTables(state) {
        const tupleBody = document.getElementById("tuple-parity-body");
        tupleBody.innerHTML = "";
        state.tupleRows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML = "<th scope='row'>" + row.field + "</th><td>" + row.value + "</td>";
          tupleBody.appendChild(tr);
        });

        const ackBody = document.getElementById("ack-parity-body");
        ackBody.innerHTML = "";
        state.ackRows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<th scope='row'>Gen " + row.generation + "</th>" +
            "<td>" + row.status + "</td>" +
            "<td>" + (row.clearsDebt ? "yes" : "no") + "</td>";
          ackBody.appendChild(tr);
        });

        const blockerBody = document.getElementById("blocker-parity-body");
        blockerBody.innerHTML = "";
        if (state.blockerRows.length === 0) {
          const tr = document.createElement("tr");
          tr.innerHTML = "<td colspan='2'>No active blockers. Closure may become legal once the current case-level rules are also clear.</td>";
          blockerBody.appendChild(tr);
          return;
        }
        state.blockerRows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML = "<th scope='row'>" + row.label + "</th><td>" + row.impact + "</td>";
          blockerBody.appendChild(tr);
        });
      }

      function renderInspector(state) {
        document.getElementById("active-state-title").textContent = state.label;
        document.getElementById("active-state-summary").textContent = state.summary;
        const strip = document.getElementById("projection-strip");
        strip.innerHTML = "";
        [
          ["Offer", state.projection.offerState],
          ["Confirmation truth", state.projection.confirmationTruthState],
          ["Patient confirmation", state.projection.patientConfirmationState],
          ["Practice visibility", state.projection.practiceVisibilityState],
          ["Fallback linkage", state.projection.fallbackLinkageState],
          ["Closure", state.projection.closureState],
        ].forEach(([label, value]) => {
          const row = create("div", "projection-row");
          row.appendChild(create("strong", "", label));
          row.appendChild(create("div", "", value));
          strip.appendChild(row);
        });

        const manage = state.manage;
        document.getElementById("manage-title").textContent =
          manage.capabilityState + " / " + manage.readOnlyMode;
        const manageBody = document.getElementById("manage-body");
        manageBody.innerHTML = "";
        [
          ["Capability state", manage.capabilityState],
          ["Read-only mode", manage.readOnlyMode],
          ["Allowed actions", manage.allowedActions.join(", ") || "none"],
        ].forEach(([label, value]) => {
          const tr = document.createElement("tr");
          tr.innerHTML = "<th scope='row'>" + label + "</th><td>" + value + "</td>";
          manageBody.appendChild(tr);
        });
        const manageBlockers = document.getElementById("manage-blockers");
        manageBlockers.innerHTML = "";
        if (manage.blockers.length === 0) {
          manageBlockers.appendChild(create("li", "", "No active lease blockers."));
        } else {
          manage.blockers.forEach((entry) => manageBlockers.appendChild(create("li", "", entry)));
        }

        const message = currentMessage();
        document.getElementById("message-detail-title").textContent = message.label;
        const messageBody = document.getElementById("message-detail-body");
        messageBody.innerHTML = "";
        [
          ["Channel", message.channel],
          ["Transport", message.transportState],
          ["Delivery", message.deliveryState],
          ["Ack evidence", message.ackEvidenceState],
          ["Ack generation", String(message.ackGeneration)],
          ["Projection cue", message.projectionState],
        ].forEach(([label, value]) => {
          const tr = document.createElement("tr");
          tr.innerHTML = "<th scope='row'>" + label + "</th><td>" + value + "</td>";
          messageBody.appendChild(tr);
        });
        document.getElementById("message-detail-note").textContent = message.note;
      }

      function sync(resetMessage = true) {
        const state = currentState();
        if (resetMessage || !state.messageRows.some((row) => row.messageId === activeMessageId)) {
          activeMessageId = state.messageRows[0].messageId;
        }
        root.setAttribute("data-active-state", activeStateId);
        root.setAttribute("data-active-message", activeMessageId);
        renderStateButtons();
        renderCurrentObjects();
        renderLane("patient-choice", state.lanes.patientChoice);
        renderLane("commit-evidence", state.lanes.commitEvidence);
        renderLane("patient-confirmation", state.lanes.patientConfirmation);
        renderPracticeLane(state);
        renderParityTables(state);
        renderInspector(state);
      }

      sync();
      window.__phase5CommitVisibilityAtlasData = { loaded: true, ...atlasData };
    </script>
  </body>
</html>`;
}

function buildSeamFiles() {
  for (const seam of GAP_SEAMS) {
    writeJson(seam.fileName, {
      taskId: SHORT_TASK_ID,
      contractVersion: CONTRACT_VERSION,
      ...seam,
      xSourceRefs: ALL_SOURCE_REFS,
    });
  }
}

function main() {
  buildSeamFiles();

  writeJson(
    "data/contracts/313_alternative_offer_session.schema.json",
    buildAlternativeOfferSessionSchema(),
  );
  writeJson(
    "data/contracts/313_alternative_offer_entry.schema.json",
    buildAlternativeOfferEntrySchema(),
  );
  writeJson(
    "data/contracts/313_alternative_offer_fallback_card.schema.json",
    buildAlternativeOfferFallbackCardSchema(),
  );
  writeJson("data/contracts/313_hub_commit_attempt.schema.json", buildHubCommitAttemptSchema());
  writeJson(
    "data/contracts/313_hub_booking_evidence_bundle.schema.json",
    buildHubBookingEvidenceBundleSchema(),
  );
  writeJson(
    "data/contracts/313_hub_appointment_record.schema.json",
    buildHubAppointmentRecordSchema(),
  );
  writeJson(
    "data/contracts/313_hub_offer_to_confirmation_truth_projection.schema.json",
    buildHubTruthProjectionSchema(),
  );
  writeJson(
    "data/contracts/313_practice_continuity_message.schema.json",
    buildPracticeContinuityMessageSchema(),
  );
  writeJson(
    "data/contracts/313_practice_acknowledgement_record.schema.json",
    buildPracticeAcknowledgementRecordSchema(),
  );
  writeJson(
    "data/contracts/313_practice_visibility_projection.schema.json",
    buildPracticeVisibilityProjectionSchema(),
  );
  writeJson(
    "data/contracts/313_network_manage_capabilities.schema.json",
    buildNetworkManageCapabilitiesSchema(),
  );
  writeJson(
    "data/contracts/313_practice_visibility_delta_record.schema.json",
    buildPracticeVisibilityDeltaRecordSchema(),
  );
  writeJson("data/contracts/313_commit_and_visibility_event_catalog.json", EVENT_CATALOG);

  writeJson("data/analysis/313_external_reference_notes.json", buildExternalReferenceNotes());
  writeCsv(
    "data/analysis/313_truth_tuple_and_ack_generation_matrix.csv",
    [...TRUTH_TUPLE_ACK_MATRIX_ROWS],
    [
      "scenarioId",
      "truthTupleStatus",
      "ackGenerationStatus",
      "transportState",
      "deliveryState",
      "ackState",
      "policyEvaluationStatus",
      "clearsCurrentDebt",
      "resultingPracticeVisibilityState",
      "explanation",
    ],
  );
  writeJson("data/analysis/313_commit_visibility_gap_log.json", GAP_LOG);

  writeText(
    "docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md",
    buildArchitectureDoc(),
  );
  writeText(
    "docs/api/313_phase5_commit_and_practice_visibility_api_contract.md",
    buildApiDoc(),
  );
  writeText(
    "docs/security/313_phase5_truth_tuple_ack_generation_and_minimum_necessary_rules.md",
    buildSecurityDoc(),
  );
  writeText(
    "docs/frontend/313_phase5_confirmation_and_practice_visibility_atlas.html",
    buildAtlasHtml(),
  );

  writeJson(
    "data/contracts/313_examples.alternative_offer_session.json",
    OFFER_SESSION,
  );
  writeJson("data/contracts/313_examples.alternative_offer_entry.json", OFFER_ENTRIES[0]);
  writeJson("data/contracts/313_examples.alternative_offer_fallback_card.json", FALLBACK_CARD);
  writeJson("data/contracts/313_examples.hub_commit_attempt.json", COMMIT_ATTEMPT);
  writeJson("data/contracts/313_examples.hub_booking_evidence_bundle.json", BOOKING_EVIDENCE_BUNDLE);
  writeJson("data/contracts/313_examples.hub_appointment_record.json", APPOINTMENT_RECORD);
  writeJson(
    "data/contracts/313_examples.hub_offer_to_confirmation_truth_projection.json",
    HUB_OFFER_TO_CONFIRMATION_TRUTH_PROJECTION,
  );
  writeJson(
    "data/contracts/313_examples.practice_continuity_message.json",
    PRACTICE_CONTINUITY_MESSAGE,
  );
  writeJson(
    "data/contracts/313_examples.practice_acknowledgement_record.json",
    PRACTICE_ACKNOWLEDGEMENT_RECORD,
  );
  writeJson(
    "data/contracts/313_examples.practice_visibility_projection.json",
    PRACTICE_VISIBILITY_PROJECTION,
  );
  writeJson(
    "data/contracts/313_examples.network_manage_capabilities.json",
    NETWORK_MANAGE_CAPABILITIES,
  );
  writeJson(
    "data/contracts/313_examples.practice_visibility_delta_record.json",
    PRACTICE_VISIBILITY_DELTA_RECORD,
  );
}

main();
