import { createHash } from "node:crypto";

export const IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME = "IdentityAuditAndMaskingService";
export const IDENTITY_AUDIT_SCHEMA_VERSION = "186.phase2.identity-audit.v1";
export const IDENTITY_AUDIT_POLICY_VERSION = "phase2-identity-audit-masking-v1";
export const IDENTITY_AUDIT_MASKING_POLICY_VERSION = "phase2-identity-redaction-v1";

export const identityAuditAndMaskingPersistenceTables = [
  "phase2_identity_canonical_event_contracts",
  "phase2_identity_canonical_event_envelopes",
  "phase2_identity_event_outbox_entries",
  "phase2_identity_audit_records",
  "phase2_identity_audit_duplicate_receipts",
  "phase2_identity_masking_policy_rules",
  "phase2_identity_observability_scrub_records",
] as const;

export const identityAuditAndMaskingMigrationPlanRefs = [
  "services/command-api/migrations/101_phase2_identity_audit_and_masking.sql",
] as const;

export const identityAuditAndMaskingGapClosures = [
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_REPAIR_CLAIM_EVENTS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_ROUTE_LOCAL_MASKING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_OBSERVABILITY_SCRUBBING_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_RECONSTRUCTABLE_DECISIONS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_APPEND_ONLY_HISTORY_V1",
] as const;

export const IDENTITY_AUDIT_REASON_CODES = [
  "IDAUD_186_CANONICAL_ENVELOPE_PUBLISHED",
  "IDAUD_186_EVENT_CONTRACT_RESOLVED",
  "IDAUD_186_PAYLOAD_REDACTED",
  "IDAUD_186_OPERATIONAL_LOG_MASKED",
  "IDAUD_186_TRACE_BAGGAGE_MASKED",
  "IDAUD_186_METRIC_LABEL_MASKED",
  "IDAUD_186_AUDIT_RECORD_APPENDED",
  "IDAUD_186_DUPLICATE_RECEIPT_COLLAPSED",
  "IDAUD_186_REPAIR_LIFECYCLE_RECONSTRUCTABLE",
  "IDAUD_186_CLAIM_GRANT_RECONSTRUCTABLE",
  "IDAUD_186_PDS_PROVENANCE_RECONSTRUCTABLE",
  "IDAUD_186_NO_RAW_IDENTITY_VALUES",
] as const;

export type IdentityAuditReasonCode = (typeof IDENTITY_AUDIT_REASON_CODES)[number];

export const IDENTITY_AUDIT_EVENT_NAMES = [
  "auth.login.started",
  "auth.callback.received",
  "auth.session.created",
  "auth.session.ended",
  "auth.session.revoked",
  "identity.patient.match_attempted",
  "identity.patient.matched",
  "identity.patient.ambiguous",
  "identity.capability.changed",
  "identity.capability.denied",
  "identity.age.restricted",
  "identity.binding.created",
  "identity.binding.settled",
  "identity.binding.verified",
  "identity.binding.superseded",
  "identity.binding.corrected",
  "identity.binding.revoked",
  "identity.repair_signal.recorded",
  "identity.repair_case.opened",
  "identity.repair_case.freeze_committed",
  "identity.repair_freeze.committed",
  "identity.repair_branch.quarantined",
  "identity.repair_case.corrected",
  "identity.repair_authority.corrected",
  "identity.repair_release.settled",
  "identity.repair_case.closed",
  "identity.request.claim.started",
  "identity.request.claim.confirmed",
  "identity.request.claim.denied",
  "identity.request.ownership.uplifted",
  "identity.pds.enrichment.requested",
  "identity.pds.enrichment.succeeded",
  "identity.pds.enrichment.denied",
  "identity.pds.change_signal.recorded",
  "access.grant.issued",
  "access.grant.redeemed",
  "access.grant.revoked",
  "access.grant.rotated",
  "access.grant.superseded",
  "telephony.continuation.context.created",
  "telephony.continuation.context.resolved",
] as const;

export type IdentityAuditEventName = (typeof IDENTITY_AUDIT_EVENT_NAMES)[number];

export type IdentityAuditNamespaceRef = "identity" | "access" | "telephony" | "audit";
export type IdentityAuditReplaySemantics =
  | "append_only"
  | "idempotent_replace"
  | "superseding"
  | "observational";
export type IdentityAuditEventPurpose =
  | "lifecycle"
  | "settlement"
  | "continuity"
  | "recovery"
  | "policy"
  | "observability";
export type IdentityAuditPiiClass =
  | "none"
  | "masked_identity"
  | "masked_contact"
  | "secret_digest"
  | "artifact_reference";
export type IdentityAuditDisclosureClass =
  | "operational_masked"
  | "audit_safe"
  | "governance_export"
  | "vault_internal";
export type IdentityAuditActorType = "patient" | "staff" | "support" | "system" | "adapter";
export type IdentityAuditReplayDisposition = "accepted" | "duplicate_replayed";
export type IdentityAuditOutboxDispatchState = "pending" | "published" | "quarantined";
export type IdentityAuditScrubSurface = "log" | "trace" | "metric";
export type IdentityAuditDisclosureAudience =
  | "operational_log"
  | "audit_operator"
  | "governance_export"
  | "vault_internal";
export type IdentityMaskingDataClass =
  | "nhs_number"
  | "phone_number"
  | "email_address"
  | "oauth_token"
  | "oidc_claim"
  | "jwt_payload"
  | "access_grant"
  | "evidence_identifier"
  | "voice_or_transcript_ref"
  | "safe_ref"
  | "unknown_sensitive";

export interface IdentityCanonicalEventContract {
  readonly canonicalEventContractRef: string;
  readonly eventName: IdentityAuditEventName;
  readonly namespaceRef: IdentityAuditNamespaceRef;
  readonly owningBoundedContextRef: "identity_access" | "telephony_edge";
  readonly governingObjectType: string;
  readonly eventPurpose: IdentityAuditEventPurpose;
  readonly requiredIdentifierRefs: readonly string[];
  readonly requiredCausalityRefs: readonly string[];
  readonly requiredPrivacyRefs: readonly string[];
  readonly schemaVersionRef: typeof IDENTITY_AUDIT_SCHEMA_VERSION;
  readonly compatibilityMode: "additive_only";
  readonly replaySemantics: IdentityAuditReplaySemantics;
  readonly defaultDisclosureClass: IdentityAuditDisclosureClass;
  readonly contractState: "active";
  readonly policyVersion: typeof IDENTITY_AUDIT_POLICY_VERSION;
}

export interface IdentityMaskingPolicyRule {
  readonly maskingPolicyRuleRef: string;
  readonly dataClass: IdentityMaskingDataClass;
  readonly fieldMatchers: readonly string[];
  readonly defaultAudience: IdentityAuditDisclosureAudience;
  readonly replacementMode:
    | "hash_only"
    | "masked_fragment"
    | "claim_digest"
    | "artifact_ref"
    | "drop";
  readonly operationalLogAllowed: false;
  readonly policyVersion: typeof IDENTITY_AUDIT_MASKING_POLICY_VERSION;
}

export interface IdentityRedactionResult<TValue = unknown> {
  readonly redactedValue: TValue;
  readonly payloadHash: string;
  readonly redactedFieldPaths: readonly string[];
  readonly maskingRuleRefs: readonly string[];
  readonly piiClasses: readonly IdentityAuditPiiClass[];
  readonly disclosureClass: IdentityAuditDisclosureClass;
  readonly reasonCodes: readonly string[];
}

export interface PublishIdentityAuditEventInput {
  readonly tenantId: string;
  readonly eventName: IdentityAuditEventName;
  readonly producerRef?: string | null;
  readonly producerScopeRef: string;
  readonly sourceBoundedContextRef?: string | null;
  readonly governingBoundedContextRef?: string | null;
  readonly governingAggregateRef: string;
  readonly governingLineageRef: string;
  readonly routeIntentRef?: string | null;
  readonly commandActionRecordRef?: string | null;
  readonly commandSettlementRef?: string | null;
  readonly edgeCorrelationId: string;
  readonly causalToken: string;
  readonly effectKeyRef?: string | null;
  readonly continuityFrameRef?: string | null;
  readonly subjectRef?: string | null;
  readonly actorType: IdentityAuditActorType;
  readonly policyVersion?: string | null;
  readonly routeProfileRef?: string | null;
  readonly sessionRef?: string | null;
  readonly decisionRef?: string | null;
  readonly grantRef?: string | null;
  readonly repairCaseRef?: string | null;
  readonly evidenceRefs?: readonly string[];
  readonly reasonCodes?: readonly string[];
  readonly occurredAt: string;
  readonly emittedAt?: string;
  readonly payload?: Record<string, unknown>;
  readonly payloadArtifactRef?: string | null;
  readonly disclosureAudience?: IdentityAuditDisclosureAudience;
}

export interface IdentityCanonicalEventEnvelope {
  readonly eventId: string;
  readonly eventName: IdentityAuditEventName;
  readonly canonicalEventContractRef: string;
  readonly namespaceRef: IdentityAuditNamespaceRef;
  readonly schemaVersionRef: typeof IDENTITY_AUDIT_SCHEMA_VERSION;
  readonly tenantId: string;
  readonly producerRef: string;
  readonly producerScopeRef: string;
  readonly sourceBoundedContextRef: string;
  readonly governingBoundedContextRef: string;
  readonly governingAggregateRef: string;
  readonly governingLineageRef: string;
  readonly routeIntentRef: string | null;
  readonly commandActionRecordRef: string | null;
  readonly commandSettlementRef: string | null;
  readonly edgeCorrelationId: string;
  readonly causalToken: string;
  readonly effectKeyRef: string;
  readonly continuityFrameRef: string | null;
  readonly subjectRef: string | null;
  readonly piiClass: IdentityAuditPiiClass;
  readonly disclosureClass: IdentityAuditDisclosureClass;
  readonly payloadArtifactRef: string | null;
  readonly payloadHash: string;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: string;
  readonly emittedAt: string;
  readonly actorType: IdentityAuditActorType;
  readonly policyVersion: string;
  readonly routeProfileRef: string | null;
  readonly sessionRef: string | null;
  readonly decisionRef: string | null;
  readonly grantRef: string | null;
  readonly repairCaseRef: string | null;
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly createdByAuthority: typeof IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME;
}

export interface IdentityAuditRecord {
  readonly identityAuditRecordId: string;
  readonly auditSequence: number;
  readonly eventEnvelopeRef: string;
  readonly eventName: IdentityAuditEventName;
  readonly governingLineageRef: string;
  readonly routeIntentRef: string | null;
  readonly sessionRef: string | null;
  readonly decisionRef: string | null;
  readonly grantRef: string | null;
  readonly repairCaseRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly replayDisposition: IdentityAuditReplayDisposition;
  readonly previousHash: string | null;
  readonly recordHash: string;
  readonly immutable: true;
  readonly recordedAt: string;
  readonly createdByAuthority: typeof IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME;
}

export interface IdentityAuditDuplicateReceipt {
  readonly duplicateReceiptId: string;
  readonly existingEventEnvelopeRef: string;
  readonly attemptedEventName: IdentityAuditEventName;
  readonly effectKeyRef: string;
  readonly edgeCorrelationId: string;
  readonly causalToken: string;
  readonly duplicatePayloadHash: string;
  readonly replayDisposition: "duplicate_replayed";
  readonly receivedAt: string;
  readonly createdByAuthority: typeof IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME;
}

export interface IdentityAuditOutboxEntry {
  readonly outboxEntryId: string;
  readonly eventEnvelopeRef: string;
  readonly queueRef: "q_event_assurance_audit";
  readonly orderingKey: string;
  readonly effectKeyRef: string;
  readonly dispatchState: IdentityAuditOutboxDispatchState;
  readonly event: IdentityCanonicalEventEnvelope;
  readonly createdAt: string;
}

export interface IdentityObservabilityScrubRecord {
  readonly scrubRecordId: string;
  readonly surface: IdentityAuditScrubSurface;
  readonly sourceRef: string;
  readonly redactedFieldPaths: readonly string[];
  readonly maskingRuleRefs: readonly string[];
  readonly payloadHash: string;
  readonly reasonCodes: readonly string[];
  readonly scrubbedAt: string;
  readonly createdByAuthority: typeof IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME;
}

export interface IdentityEventPublicationResult {
  readonly envelope: IdentityCanonicalEventEnvelope;
  readonly auditRecord: IdentityAuditRecord | null;
  readonly outboxEntry: IdentityAuditOutboxEntry | null;
  readonly duplicateReceipt: IdentityAuditDuplicateReceipt | null;
  readonly replayDisposition: IdentityAuditReplayDisposition;
  readonly redaction: IdentityRedactionResult<Record<string, unknown>>;
}

export interface IdentityDecisionReconstruction {
  readonly governingLineageRef: string;
  readonly eventNames: readonly IdentityAuditEventName[];
  readonly eventEnvelopeRefs: readonly string[];
  readonly routeIntentRefs: readonly string[];
  readonly sessionRefs: readonly string[];
  readonly decisionRefs: readonly string[];
  readonly grantRefs: readonly string[];
  readonly repairCaseRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly reconstructionState: "complete" | "partial";
  readonly missingDecisionClasses: readonly string[];
}

export interface IdentityAuditAndMaskingRepository {
  readonly saveCanonicalEventContract: (contract: IdentityCanonicalEventContract) => Promise<void>;
  readonly saveMaskingPolicyRule: (rule: IdentityMaskingPolicyRule) => Promise<void>;
  readonly findEventEnvelopeByEffectKey: (
    effectKeyRef: string,
  ) => Promise<IdentityCanonicalEventEnvelope | undefined>;
  readonly saveEventEnvelope: (envelope: IdentityCanonicalEventEnvelope) => Promise<void>;
  readonly saveAuditRecord: (record: IdentityAuditRecord) => Promise<void>;
  readonly saveOutboxEntry: (entry: IdentityAuditOutboxEntry) => Promise<void>;
  readonly saveDuplicateReceipt: (receipt: IdentityAuditDuplicateReceipt) => Promise<void>;
  readonly saveScrubRecord: (record: IdentityObservabilityScrubRecord) => Promise<void>;
  readonly nextAuditSequence: () => Promise<number>;
  readonly latestAuditHash: () => Promise<string | null>;
  readonly listEventEnvelopes: () => Promise<readonly IdentityCanonicalEventEnvelope[]>;
  readonly listAuditRecords: () => Promise<readonly IdentityAuditRecord[]>;
  readonly listDuplicateReceipts: () => Promise<readonly IdentityAuditDuplicateReceipt[]>;
  readonly listOutboxEntries: () => Promise<readonly IdentityAuditOutboxEntry[]>;
  readonly listScrubRecords: () => Promise<readonly IdentityObservabilityScrubRecord[]>;
}

export interface IdentityAuditAndMaskingService {
  readonly eventContracts: readonly IdentityCanonicalEventContract[];
  readonly maskingPolicyRules: readonly IdentityMaskingPolicyRule[];
  readonly publishIdentityEvent: (
    input: PublishIdentityAuditEventInput,
  ) => Promise<IdentityEventPublicationResult>;
  readonly redactIdentityPayload: (
    payload: Record<string, unknown>,
    audience?: IdentityAuditDisclosureAudience,
  ) => IdentityRedactionResult<Record<string, unknown>>;
  readonly scrubLogRecord: (input: {
    sourceRef: string;
    record: Record<string, unknown>;
    observedAt?: string;
  }) => Promise<IdentityRedactionResult<Record<string, unknown>>>;
  readonly scrubTraceAttributes: (input: {
    sourceRef: string;
    attributes: Record<string, unknown>;
    observedAt?: string;
  }) => Promise<IdentityRedactionResult<Record<string, unknown>>>;
  readonly scrubMetricLabels: (input: {
    sourceRef: string;
    labels: Record<string, string>;
    observedAt?: string;
  }) => Promise<IdentityRedactionResult<Record<string, string>>>;
  readonly reconstructDecision: (input: {
    governingLineageRef: string;
  }) => Promise<IdentityDecisionReconstruction>;
}

export interface IdentityAuditAndMaskingApplication {
  readonly migrationPlanRef: (typeof identityAuditAndMaskingMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof identityAuditAndMaskingMigrationPlanRefs;
  readonly persistenceTables: typeof identityAuditAndMaskingPersistenceTables;
  readonly gapClosures: typeof identityAuditAndMaskingGapClosures;
  readonly policyVersion: typeof IDENTITY_AUDIT_POLICY_VERSION;
  readonly maskingPolicyVersion: typeof IDENTITY_AUDIT_MASKING_POLICY_VERSION;
  readonly identityAuditAndMaskingService: IdentityAuditAndMaskingService;
  readonly repository: IdentityAuditAndMaskingRepository;
}

const eventNameSet = new Set<string>(IDENTITY_AUDIT_EVENT_NAMES);

export const identityMaskingPolicyRules: readonly IdentityMaskingPolicyRule[] = [
  {
    maskingPolicyRuleRef: "mask_186_nhs_number",
    dataClass: "nhs_number",
    fieldMatchers: ["nhsnumber", "nhs_number", "nhs-number"],
    defaultAudience: "operational_log",
    replacementMode: "masked_fragment",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_phone_number",
    dataClass: "phone_number",
    fieldMatchers: ["phone", "mobile", "msisdn", "caller"],
    defaultAudience: "operational_log",
    replacementMode: "masked_fragment",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_email",
    dataClass: "email_address",
    fieldMatchers: ["email", "mail"],
    defaultAudience: "operational_log",
    replacementMode: "masked_fragment",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_oauth_token",
    dataClass: "oauth_token",
    fieldMatchers: [
      "token",
      "access_token",
      "refresh_token",
      "authorization",
      "authorizationcode",
      "authcode",
      "callbackcode",
      "routequerystring",
      "querystring",
      "pkce",
      "verifier",
    ],
    defaultAudience: "operational_log",
    replacementMode: "hash_only",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_oidc_claims",
    dataClass: "oidc_claim",
    fieldMatchers: ["claim", "claims", "userinfo", "id_token"],
    defaultAudience: "operational_log",
    replacementMode: "claim_digest",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_jwt_payload",
    dataClass: "jwt_payload",
    fieldMatchers: ["jwt", "jws", "payload"],
    defaultAudience: "operational_log",
    replacementMode: "hash_only",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_access_grant",
    dataClass: "access_grant",
    fieldMatchers: [
      "grantvalue",
      "grant_value",
      "opaquegrant",
      "presentedgrant",
      "presented_grant",
      "accessgrantvalue",
    ],
    defaultAudience: "operational_log",
    replacementMode: "hash_only",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_evidence_identifier",
    dataClass: "evidence_identifier",
    fieldMatchers: ["evidenceblob", "evidence_blob", "raw_evidence", "rawEvidence"],
    defaultAudience: "audit_operator",
    replacementMode: "artifact_ref",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
  {
    maskingPolicyRuleRef: "mask_186_voice_transcript",
    dataClass: "voice_or_transcript_ref",
    fieldMatchers: ["transcript", "voice", "recording", "audio"],
    defaultAudience: "audit_operator",
    replacementMode: "artifact_ref",
    operationalLogAllowed: false,
    policyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
  },
] as const;

function namespaceForEvent(eventName: IdentityAuditEventName): IdentityAuditNamespaceRef {
  if (eventName.startsWith("access.")) return "access";
  if (eventName.startsWith("telephony.")) return "telephony";
  if (eventName.startsWith("audit.")) return "audit";
  return "identity";
}

function purposeForEvent(eventName: IdentityAuditEventName): IdentityAuditEventPurpose {
  if (eventName.includes("denied") || eventName.includes("restricted")) return "policy";
  if (
    eventName.includes("redeemed") ||
    eventName.includes("superseded") ||
    eventName.includes("revoked") ||
    eventName.includes("settled") ||
    eventName.includes("confirmed")
  ) {
    return "settlement";
  }
  if (eventName.includes("repair")) return "recovery";
  if (eventName.includes("continuation")) return "continuity";
  return "lifecycle";
}

function replayForEvent(eventName: IdentityAuditEventName): IdentityAuditReplaySemantics {
  if (
    eventName.includes("superseded") ||
    eventName.includes("revoked") ||
    eventName.includes("rotated") ||
    eventName.includes("corrected")
  ) {
    return "superseding";
  }
  if (eventName.includes("callback") || eventName.includes("redeemed")) {
    return "idempotent_replace";
  }
  return "append_only";
}

function governingObjectForEvent(eventName: IdentityAuditEventName): string {
  if (eventName.startsWith("auth.")) return "AuthTransaction";
  if (eventName.includes("session")) return "Session";
  if (eventName.includes("capability")) return "CapabilityDecision";
  if (eventName.includes("grant")) return "AccessGrant";
  if (eventName.includes("repair")) return "IdentityRepairCase";
  if (eventName.includes("pds")) return "PdsEnrichmentDecision";
  if (eventName.includes("claim") || eventName.includes("ownership")) return "RequestLineage";
  if (eventName.startsWith("telephony.")) return "TelephonyContinuationContext";
  return "IdentityBinding";
}

export const identityAuditEventContracts: readonly IdentityCanonicalEventContract[] =
  IDENTITY_AUDIT_EVENT_NAMES.map((eventName) => ({
    canonicalEventContractRef: `cec_186_${eventName.replaceAll(".", "_")}`,
    eventName,
    namespaceRef: namespaceForEvent(eventName),
    owningBoundedContextRef: eventName.startsWith("telephony.")
      ? "telephony_edge"
      : "identity_access",
    governingObjectType: governingObjectForEvent(eventName),
    eventPurpose: purposeForEvent(eventName),
    requiredIdentifierRefs: ["tenantId", "governingAggregateRef", "governingLineageRef"],
    requiredCausalityRefs: ["edgeCorrelationId", "causalToken", "effectKeyRef"],
    requiredPrivacyRefs: ["piiClass", "disclosureClass", "payloadHash"],
    schemaVersionRef: IDENTITY_AUDIT_SCHEMA_VERSION,
    compatibilityMode: "additive_only",
    replaySemantics: replayForEvent(eventName),
    defaultDisclosureClass: "audit_safe",
    contractState: "active",
    policyVersion: IDENTITY_AUDIT_POLICY_VERSION,
  }));

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    const error = new Error(message);
    error.name = code;
    throw error;
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

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function digest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableRef(prefix: string, value: unknown): string {
  return `${prefix}_${digest(value).slice(0, 24)}`;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function classifyField(path: string, value: unknown): IdentityMaskingPolicyRule | null {
  const normalizedPath = path.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const segments = path.split(".");
  const lastSegment = (segments.at(-1) ?? path).toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (lastSegment.includes("reasoncode")) return null;
  const isReferenceLike = /(ref|refs|id|ids)$/.test(lastSegment);
  if (
    isReferenceLike &&
    !/(token|secret|verifier|authorization|code|querystring|opaque|raw)/.test(lastSegment)
  ) {
    return null;
  }
  const stringValue = typeof value === "string" ? value : "";
  const direct = identityMaskingPolicyRules.find((rule) =>
    rule.fieldMatchers.some((matcher) =>
      normalizedPath.includes(matcher.toLowerCase().replace(/[^a-z0-9_]/g, "")),
    ),
  );
  if (direct) return direct;
  if (/\b\d{10}\b/.test(stringValue)) return identityMaskingPolicyRules[0] ?? null;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(stringValue)) {
    return identityMaskingPolicyRules[2] ?? null;
  }
  if (/\+?\d[\d\s().-]{7,}\d/.test(stringValue)) return identityMaskingPolicyRules[1] ?? null;
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(stringValue)) {
    return identityMaskingPolicyRules[5] ?? null;
  }
  return null;
}

function piiClassForRule(rule: IdentityMaskingPolicyRule): IdentityAuditPiiClass {
  if (rule.dataClass === "phone_number") return "masked_contact";
  if (rule.dataClass === "email_address") return "masked_contact";
  if (rule.dataClass === "oauth_token") return "secret_digest";
  if (rule.dataClass === "jwt_payload") return "secret_digest";
  if (rule.dataClass === "access_grant") return "secret_digest";
  if (rule.dataClass === "evidence_identifier") return "artifact_reference";
  if (rule.dataClass === "voice_or_transcript_ref") return "artifact_reference";
  return "masked_identity";
}

function maskFragment(value: string, kind: string): string {
  const compact = value.replace(/\s+/g, "");
  const suffix = compact.slice(-4);
  return `${kind}::masked::${suffix || digest(value).slice(0, 6)}`;
}

function maskEmail(value: string): string {
  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) {
    return `email::masked::${digest(value).slice(0, 8)}`;
  }
  return `email::masked::${localPart.slice(0, 1)}***@${domainPart.slice(0, 1)}***`;
}

function redactLeaf(
  path: string,
  value: unknown,
  audience: IdentityAuditDisclosureAudience,
): {
  redactedValue: unknown;
  fieldPath: string | null;
  ruleRef: string | null;
  piiClass: IdentityAuditPiiClass | null;
} {
  const rule = classifyField(path, value);
  if (!rule) {
    return { redactedValue: value, fieldPath: null, ruleRef: null, piiClass: null };
  }

  const raw = typeof value === "string" ? value : stableStringify(value);
  let redactedValue: string | null;
  if (audience === "vault_internal" && rule.dataClass === "safe_ref") {
    redactedValue = raw;
  } else if (rule.replacementMode === "masked_fragment" && rule.dataClass === "email_address") {
    redactedValue = maskEmail(raw);
  } else if (rule.replacementMode === "masked_fragment") {
    redactedValue = maskFragment(raw, rule.dataClass);
  } else if (rule.replacementMode === "claim_digest") {
    redactedValue = `claim_digest::${digest(raw).slice(0, 16)}`;
  } else if (rule.replacementMode === "artifact_ref") {
    redactedValue = `artifact_ref::${digest(raw).slice(0, 16)}`;
  } else if (rule.replacementMode === "drop") {
    redactedValue = null;
  } else {
    redactedValue = `${rule.dataClass}::digest::${digest(raw).slice(0, 16)}`;
  }
  return {
    redactedValue,
    fieldPath: path,
    ruleRef: rule.maskingPolicyRuleRef,
    piiClass: piiClassForRule(rule),
  };
}

function redactUnknown(
  value: unknown,
  path: string,
  audience: IdentityAuditDisclosureAudience,
  redactedFieldPaths: string[],
  maskingRuleRefs: string[],
  piiClasses: IdentityAuditPiiClass[],
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      redactUnknown(
        entry,
        `${path}[${index}]`,
        audience,
        redactedFieldPaths,
        maskingRuleRefs,
        piiClasses,
      ),
    );
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        redactUnknown(
          entry,
          path ? `${path}.${key}` : key,
          audience,
          redactedFieldPaths,
          maskingRuleRefs,
          piiClasses,
        ),
      ]),
    );
  }
  const redacted = redactLeaf(path, value, audience);
  if (redacted.fieldPath && redacted.ruleRef && redacted.piiClass) {
    redactedFieldPaths.push(redacted.fieldPath);
    maskingRuleRefs.push(redacted.ruleRef);
    piiClasses.push(redacted.piiClass);
  }
  return redacted.redactedValue;
}

function disclosureForAudience(
  audience: IdentityAuditDisclosureAudience,
  redactedFieldPaths: readonly string[],
): IdentityAuditDisclosureClass {
  if (audience === "vault_internal" && redactedFieldPaths.length === 0) return "vault_internal";
  if (audience === "governance_export") return "governance_export";
  if (audience === "audit_operator") return "audit_safe";
  return "operational_masked";
}

function redactPayload(
  payload: Record<string, unknown>,
  audience: IdentityAuditDisclosureAudience = "audit_operator",
): IdentityRedactionResult<Record<string, unknown>> {
  const redactedFieldPaths: string[] = [];
  const maskingRuleRefs: string[] = [];
  const piiClasses: IdentityAuditPiiClass[] = [];
  const redacted = redactUnknown(
    payload,
    "",
    audience,
    redactedFieldPaths,
    maskingRuleRefs,
    piiClasses,
  );
  const redactedValue = isRecord(redacted) ? redacted : { value: redacted };
  return {
    redactedValue,
    payloadHash: digest(redactedValue),
    redactedFieldPaths: unique(redactedFieldPaths),
    maskingRuleRefs: unique(maskingRuleRefs),
    piiClasses: unique(piiClasses) as IdentityAuditPiiClass[],
    disclosureClass: disclosureForAudience(audience, redactedFieldPaths),
    reasonCodes:
      redactedFieldPaths.length > 0
        ? ["IDAUD_186_PAYLOAD_REDACTED", "IDAUD_186_NO_RAW_IDENTITY_VALUES"]
        : ["IDAUD_186_NO_RAW_IDENTITY_VALUES"],
  };
}

function contractFor(eventName: IdentityAuditEventName): IdentityCanonicalEventContract {
  const contract = identityAuditEventContracts.find(
    (candidate) => candidate.eventName === eventName,
  );
  invariant(contract, "UNKNOWN_IDENTITY_AUDIT_EVENT", `Unknown eventName ${eventName}.`);
  return contract;
}

function normalizeEventName(value: IdentityAuditEventName): IdentityAuditEventName {
  invariant(eventNameSet.has(value), "UNKNOWN_IDENTITY_AUDIT_EVENT", `Unknown eventName ${value}.`);
  return value;
}

function buildEffectKey(input: PublishIdentityAuditEventInput): string {
  return (
    optionalRef(input.effectKeyRef) ??
    stableRef("effect_186", {
      eventName: input.eventName,
      governingAggregateRef: input.governingAggregateRef,
      governingLineageRef: input.governingLineageRef,
      causalToken: input.causalToken,
      occurredAt: input.occurredAt,
    })
  );
}

function createAuditRecord(input: {
  envelope: IdentityCanonicalEventEnvelope;
  sequence: number;
  previousHash: string | null;
}): IdentityAuditRecord {
  const base = {
    auditSequence: input.sequence,
    eventEnvelopeRef: input.envelope.eventId,
    eventName: input.envelope.eventName,
    governingLineageRef: input.envelope.governingLineageRef,
    routeIntentRef: input.envelope.routeIntentRef,
    sessionRef: input.envelope.sessionRef,
    decisionRef: input.envelope.decisionRef,
    grantRef: input.envelope.grantRef,
    repairCaseRef: input.envelope.repairCaseRef,
    reasonCodes: input.envelope.reasonCodes,
    replayDisposition: "accepted" as const,
    previousHash: input.previousHash,
    immutable: true as const,
    recordedAt: input.envelope.emittedAt,
    createdByAuthority: IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME,
  } satisfies Omit<IdentityAuditRecord, "identityAuditRecordId" | "recordHash">;
  return {
    identityAuditRecordId: stableRef("idaud_record", base),
    ...base,
    recordHash: digest(base),
  };
}

function createOutboxEntry(envelope: IdentityCanonicalEventEnvelope): IdentityAuditOutboxEntry {
  return {
    outboxEntryId: stableRef("idaud_outbox", {
      eventId: envelope.eventId,
      effectKeyRef: envelope.effectKeyRef,
    }),
    eventEnvelopeRef: envelope.eventId,
    queueRef: "q_event_assurance_audit",
    orderingKey: envelope.governingLineageRef,
    effectKeyRef: envelope.effectKeyRef,
    dispatchState: "pending",
    event: envelope,
    createdAt: envelope.emittedAt,
  };
}

function createDuplicateReceipt(input: {
  existing: IdentityCanonicalEventEnvelope;
  attempted: PublishIdentityAuditEventInput;
  duplicatePayloadHash: string;
  receivedAt: string;
  effectKeyRef: string;
}): IdentityAuditDuplicateReceipt {
  return {
    duplicateReceiptId: stableRef("idaud_duplicate", {
      eventName: input.attempted.eventName,
      effectKeyRef: input.effectKeyRef,
      edgeCorrelationId: input.attempted.edgeCorrelationId,
      causalToken: input.attempted.causalToken,
      receivedAt: input.receivedAt,
      duplicatePayloadHash: input.duplicatePayloadHash,
    }),
    existingEventEnvelopeRef: input.existing.eventId,
    attemptedEventName: input.attempted.eventName,
    effectKeyRef: input.effectKeyRef,
    edgeCorrelationId: input.attempted.edgeCorrelationId,
    causalToken: input.attempted.causalToken,
    duplicatePayloadHash: input.duplicatePayloadHash,
    replayDisposition: "duplicate_replayed",
    receivedAt: input.receivedAt,
    createdByAuthority: IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME,
  };
}

function createScrubRecord(input: {
  surface: IdentityAuditScrubSurface;
  sourceRef: string;
  redaction: IdentityRedactionResult;
  observedAt: string;
}): IdentityObservabilityScrubRecord {
  return {
    scrubRecordId: stableRef("idaud_scrub", {
      surface: input.surface,
      sourceRef: input.sourceRef,
      payloadHash: input.redaction.payloadHash,
      observedAt: input.observedAt,
    }),
    surface: input.surface,
    sourceRef: input.sourceRef,
    redactedFieldPaths: input.redaction.redactedFieldPaths,
    maskingRuleRefs: input.redaction.maskingRuleRefs,
    payloadHash: input.redaction.payloadHash,
    reasonCodes: [
      ...input.redaction.reasonCodes,
      input.surface === "log"
        ? "IDAUD_186_OPERATIONAL_LOG_MASKED"
        : input.surface === "trace"
          ? "IDAUD_186_TRACE_BAGGAGE_MASKED"
          : "IDAUD_186_METRIC_LABEL_MASKED",
    ],
    scrubbedAt: input.observedAt,
    createdByAuthority: IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME,
  };
}

export function createInMemoryIdentityAuditAndMaskingRepository(): IdentityAuditAndMaskingRepository {
  const contracts = new Map<string, IdentityCanonicalEventContract>();
  const maskingRules = new Map<string, IdentityMaskingPolicyRule>();
  const envelopes = new Map<string, IdentityCanonicalEventEnvelope>();
  const envelopesByEffectKey = new Map<string, IdentityCanonicalEventEnvelope>();
  const auditRecords: IdentityAuditRecord[] = [];
  const outboxEntries = new Map<string, IdentityAuditOutboxEntry>();
  const duplicateReceipts: IdentityAuditDuplicateReceipt[] = [];
  const scrubRecords: IdentityObservabilityScrubRecord[] = [];

  return {
    async saveCanonicalEventContract(contract) {
      contracts.set(contract.canonicalEventContractRef, contract);
    },
    async saveMaskingPolicyRule(rule) {
      maskingRules.set(rule.maskingPolicyRuleRef, rule);
    },
    async findEventEnvelopeByEffectKey(effectKeyRef) {
      return envelopesByEffectKey.get(effectKeyRef);
    },
    async saveEventEnvelope(envelope) {
      invariant(
        !envelopes.has(envelope.eventId),
        "IDENTITY_AUDIT_EVENT_APPEND_ONLY_VIOLATION",
        "Canonical event envelopes are append-only.",
      );
      envelopes.set(envelope.eventId, envelope);
      envelopesByEffectKey.set(envelope.effectKeyRef, envelope);
    },
    async saveAuditRecord(record) {
      invariant(
        !auditRecords.some(
          (candidate) => candidate.identityAuditRecordId === record.identityAuditRecordId,
        ),
        "IDENTITY_AUDIT_RECORD_APPEND_ONLY_VIOLATION",
        "Audit records are append-only.",
      );
      auditRecords.push(record);
    },
    async saveOutboxEntry(entry) {
      outboxEntries.set(entry.outboxEntryId, entry);
    },
    async saveDuplicateReceipt(receipt) {
      duplicateReceipts.push(receipt);
    },
    async saveScrubRecord(record) {
      scrubRecords.push(record);
    },
    async nextAuditSequence() {
      return auditRecords.length + 1;
    },
    async latestAuditHash() {
      return auditRecords.at(-1)?.recordHash ?? null;
    },
    async listEventEnvelopes() {
      return [...envelopes.values()];
    },
    async listAuditRecords() {
      return [...auditRecords];
    },
    async listDuplicateReceipts() {
      return [...duplicateReceipts];
    },
    async listOutboxEntries() {
      return [...outboxEntries.values()];
    },
    async listScrubRecords() {
      return [...scrubRecords];
    },
  };
}

export function createIdentityAuditAndMaskingService(
  repository: IdentityAuditAndMaskingRepository,
): IdentityAuditAndMaskingService {
  async function scrubAndRecord<TValue extends Record<string, unknown> | Record<string, string>>(
    surface: IdentityAuditScrubSurface,
    sourceRef: string,
    payload: TValue,
    observedAt?: string,
  ): Promise<IdentityRedactionResult<TValue>> {
    const redaction = redactPayload(payload, "operational_log") as IdentityRedactionResult<TValue>;
    const scrubRecord = createScrubRecord({
      surface,
      sourceRef: requireRef(sourceRef, "sourceRef"),
      redaction,
      observedAt: ensureIsoTimestamp(observedAt ?? new Date(0).toISOString(), "observedAt"),
    });
    await repository.saveScrubRecord(scrubRecord);
    return {
      ...redaction,
      reasonCodes: scrubRecord.reasonCodes,
    };
  }

  return {
    eventContracts: identityAuditEventContracts,
    maskingPolicyRules: identityMaskingPolicyRules,
    async publishIdentityEvent(input) {
      const eventName = normalizeEventName(input.eventName);
      const contract = contractFor(eventName);
      const occurredAt = ensureIsoTimestamp(input.occurredAt, "occurredAt");
      const emittedAt = ensureIsoTimestamp(input.emittedAt ?? occurredAt, "emittedAt");
      const effectKeyRef = requireRef(buildEffectKey(input), "effectKeyRef");
      const payload = {
        ...(input.payload ?? {}),
        sessionRef: optionalRef(input.sessionRef),
        decisionRef: optionalRef(input.decisionRef),
        grantRef: optionalRef(input.grantRef),
        repairCaseRef: optionalRef(input.repairCaseRef),
        evidenceRefs: [...(input.evidenceRefs ?? [])],
        reasonCodes: [...(input.reasonCodes ?? [])],
      };
      const redaction = redactPayload(payload, input.disclosureAudience ?? "audit_operator");
      const existing = await repository.findEventEnvelopeByEffectKey(effectKeyRef);
      if (existing) {
        const duplicateReceipt = createDuplicateReceipt({
          existing,
          attempted: input,
          duplicatePayloadHash: redaction.payloadHash,
          receivedAt: emittedAt,
          effectKeyRef,
        });
        await repository.saveDuplicateReceipt(duplicateReceipt);
        return {
          envelope: existing,
          auditRecord: null,
          outboxEntry: null,
          duplicateReceipt,
          replayDisposition: "duplicate_replayed",
          redaction,
        };
      }

      const reasonCodes = unique([
        "IDAUD_186_CANONICAL_ENVELOPE_PUBLISHED",
        "IDAUD_186_EVENT_CONTRACT_RESOLVED",
        ...redaction.reasonCodes,
        ...(input.reasonCodes ?? []),
      ]);
      const piiClass = redaction.piiClasses[0] ?? "none";
      const envelopeBase = {
        eventName,
        canonicalEventContractRef: contract.canonicalEventContractRef,
        namespaceRef: contract.namespaceRef,
        schemaVersionRef: IDENTITY_AUDIT_SCHEMA_VERSION,
        tenantId: requireRef(input.tenantId, "tenantId"),
        producerRef: optionalRef(input.producerRef) ?? IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME,
        producerScopeRef: requireRef(input.producerScopeRef, "producerScopeRef"),
        sourceBoundedContextRef:
          optionalRef(input.sourceBoundedContextRef) ?? contract.owningBoundedContextRef,
        governingBoundedContextRef:
          optionalRef(input.governingBoundedContextRef) ?? contract.owningBoundedContextRef,
        governingAggregateRef: requireRef(input.governingAggregateRef, "governingAggregateRef"),
        governingLineageRef: requireRef(input.governingLineageRef, "governingLineageRef"),
        routeIntentRef: optionalRef(input.routeIntentRef),
        commandActionRecordRef: optionalRef(input.commandActionRecordRef),
        commandSettlementRef: optionalRef(input.commandSettlementRef),
        edgeCorrelationId: requireRef(input.edgeCorrelationId, "edgeCorrelationId"),
        causalToken: requireRef(input.causalToken, "causalToken"),
        effectKeyRef,
        continuityFrameRef: optionalRef(input.continuityFrameRef),
        subjectRef: optionalRef(input.subjectRef),
        piiClass,
        disclosureClass: redaction.disclosureClass,
        payloadArtifactRef: optionalRef(input.payloadArtifactRef),
        payloadHash: redaction.payloadHash,
        payload: redaction.redactedValue,
        occurredAt,
        emittedAt,
        actorType: input.actorType,
        policyVersion: optionalRef(input.policyVersion) ?? IDENTITY_AUDIT_POLICY_VERSION,
        routeProfileRef: optionalRef(input.routeProfileRef),
        sessionRef: optionalRef(input.sessionRef),
        decisionRef: optionalRef(input.decisionRef),
        grantRef: optionalRef(input.grantRef),
        repairCaseRef: optionalRef(input.repairCaseRef),
        evidenceRefs: [...(input.evidenceRefs ?? [])],
        reasonCodes,
        createdByAuthority: IDENTITY_AUDIT_AND_MASKING_SERVICE_NAME,
      } satisfies Omit<IdentityCanonicalEventEnvelope, "eventId">;
      const envelope: IdentityCanonicalEventEnvelope = {
        eventId: stableRef("evt_186", {
          eventName,
          effectKeyRef,
          edgeCorrelationId: envelopeBase.edgeCorrelationId,
          causalToken: envelopeBase.causalToken,
          payloadHash: redaction.payloadHash,
        }),
        ...envelopeBase,
      };
      await repository.saveEventEnvelope(envelope);
      const sequence = await repository.nextAuditSequence();
      const auditRecord = createAuditRecord({
        envelope,
        sequence,
        previousHash: await repository.latestAuditHash(),
      });
      await repository.saveAuditRecord(auditRecord);
      const outboxEntry = createOutboxEntry(envelope);
      await repository.saveOutboxEntry(outboxEntry);
      return {
        envelope,
        auditRecord,
        outboxEntry,
        duplicateReceipt: null,
        replayDisposition: "accepted",
        redaction,
      };
    },
    redactIdentityPayload(payload, audience = "audit_operator") {
      return redactPayload(payload, audience);
    },
    async scrubLogRecord(input) {
      return scrubAndRecord("log", input.sourceRef, input.record, input.observedAt);
    },
    async scrubTraceAttributes(input) {
      return scrubAndRecord("trace", input.sourceRef, input.attributes, input.observedAt);
    },
    async scrubMetricLabels(input) {
      return scrubAndRecord("metric", input.sourceRef, input.labels, input.observedAt);
    },
    async reconstructDecision(input) {
      const governingLineageRef = requireRef(input.governingLineageRef, "governingLineageRef");
      const envelopes = (await repository.listEventEnvelopes())
        .filter((envelope) => envelope.governingLineageRef === governingLineageRef)
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
      const eventNames = unique(
        envelopes.map((envelope) => envelope.eventName),
      ) as IdentityAuditEventName[];
      const routeIntentRefs = unique(
        envelopes
          .map((envelope) => envelope.routeIntentRef)
          .filter((value): value is string => !!value),
      );
      const sessionRefs = unique(
        envelopes
          .map((envelope) => envelope.sessionRef)
          .filter((value): value is string => !!value),
      );
      const decisionRefs = unique(
        envelopes
          .map((envelope) => envelope.decisionRef)
          .filter((value): value is string => !!value),
      );
      const grantRefs = unique(
        envelopes.map((envelope) => envelope.grantRef).filter((value): value is string => !!value),
      );
      const repairCaseRefs = unique(
        envelopes
          .map((envelope) => envelope.repairCaseRef)
          .filter((value): value is string => !!value),
      );
      const evidenceRefs = unique(envelopes.flatMap((envelope) => envelope.evidenceRefs));
      const reasonCodes = unique(envelopes.flatMap((envelope) => envelope.reasonCodes));
      const missingDecisionClasses = [
        sessionRefs.length === 0 ? "sessionRef" : "",
        decisionRefs.length === 0 ? "decisionRef" : "",
        routeIntentRefs.length === 0 ? "routeIntentRef" : "",
      ].filter(Boolean);
      return {
        governingLineageRef,
        eventNames,
        eventEnvelopeRefs: envelopes.map((envelope) => envelope.eventId),
        routeIntentRefs,
        sessionRefs,
        decisionRefs,
        grantRefs,
        repairCaseRefs,
        evidenceRefs,
        reasonCodes,
        reconstructionState: missingDecisionClasses.length === 0 ? "complete" : "partial",
        missingDecisionClasses,
      };
    },
  };
}

export async function createIdentityAuditAndMaskingApplication(options?: {
  readonly repository?: IdentityAuditAndMaskingRepository;
}): Promise<IdentityAuditAndMaskingApplication> {
  const repository = options?.repository ?? createInMemoryIdentityAuditAndMaskingRepository();
  for (const contract of identityAuditEventContracts) {
    await repository.saveCanonicalEventContract(contract);
  }
  for (const rule of identityMaskingPolicyRules) {
    await repository.saveMaskingPolicyRule(rule);
  }
  return {
    migrationPlanRef: identityAuditAndMaskingMigrationPlanRefs[0],
    migrationPlanRefs: identityAuditAndMaskingMigrationPlanRefs,
    persistenceTables: identityAuditAndMaskingPersistenceTables,
    gapClosures: identityAuditAndMaskingGapClosures,
    policyVersion: IDENTITY_AUDIT_POLICY_VERSION,
    maskingPolicyVersion: IDENTITY_AUDIT_MASKING_POLICY_VERSION,
    identityAuditAndMaskingService: createIdentityAuditAndMaskingService(repository),
    repository,
  };
}
