import { createHash } from "node:crypto";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_MINIMUM_BRIDGE_REF,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  type NhsAppEnvironment,
} from "./phase7-nhs-app-manifest-service";
import {
  createDefaultPhase7EmbeddedContextApplication,
  type BridgeCapabilitySnapshot,
  type EmbeddedContextResolutionResult,
  type LocalSessionBinding,
  type Phase7EmbeddedContextApplication,
  type ResolveEmbeddedContextInput,
} from "./phase7-embedded-context-service";

export const PHASE7_NHS_APP_SSO_BRIDGE_SERVICE_NAME = "Phase7NhsAppSsoBridge";
export const PHASE7_NHS_APP_SSO_BRIDGE_SCHEMA_VERSION = "379.phase7.nhs-app-sso-bridge.v1";

const RECORDED_AT = "2026-04-27T00:10:15.000Z";
const DEFAULT_EXPIRES_AT = "2026-04-27T00:15:15.000Z";
const DEFAULT_CALLBACK_EXPIRES_AT = "2026-04-27T00:20:15.000Z";
const NHS_LOGIN_AUTHORIZE_URL = "https://auth.sandpit.signin.nhs.uk/authorize";
const NHS_APP_SSO_CLIENT_ID = "vecells-phase7-nhs-app-sandpit";
const NHS_APP_SSO_REDIRECT_URI = "https://sandpit.vecells.invalid/nhs-app/sso/callback";

export type SSOEntryGrantState = "pending" | "consumed" | "superseded" | "expired" | "denied";
export type AuthBridgeTransactionState =
  | "opened"
  | "awaiting_callback"
  | "callback_received"
  | "verified"
  | "recovery_required"
  | "denied";
export type IdentityAssertionBindingState = "matched" | "mismatched" | "repair_required" | "denied";
export type SubjectComparisonState =
  | "no_session"
  | "anonymous_session"
  | "same_subject_same_binding"
  | "same_subject_binding_advanced"
  | "different_subject"
  | "mismatched_secure_link_subject"
  | "stale_existing";
export type DraftClaimDisposition =
  | "none"
  | "claim_route_required"
  | "draft_claim_allowed"
  | "request_shell_required"
  | "blocked_other_subject";
export type ResumeIntentDisposition =
  | "consume_intent"
  | "consume_to_recovery"
  | "supersede_intent"
  | "deny_intent";
export type SessionMergeDecisionValue = "reuse" | "rotate" | "terminate_and_reenter" | "deny";
export type ReturnIntentState = "pending" | "consumed" | "superseded" | "recovered" | "denied";
export type EmbeddedReturnState = "embedded" | "standalone" | "recovery";
export type AppReturnTarget =
  | "HOME_PAGE"
  | "SERVICES"
  | "YOUR_HEALTH"
  | "MESSAGES"
  | "UPLIFT"
  | "ACCOUNT"
  | "GO_BACK";
export type SSOReturnOutcome =
  | "silent_success"
  | "consent_denied"
  | "silent_failure"
  | "manifest_drift"
  | "context_drift"
  | "session_conflict"
  | "safe_reentry_required";
export type ReturnIntentInvalidReason =
  | "none"
  | "expired"
  | "manifest_drift"
  | "context_drift"
  | "session_epoch_mismatch"
  | "subject_binding_mismatch"
  | "subject_mismatch"
  | "draft_already_promoted"
  | "bridge_floor_mismatch"
  | "route_family_mismatch"
  | "embedded_eligibility_not_live";

export interface SSOEntryGrant {
  entryGrantId: string;
  journeyPathId: string;
  assertedIdentityHash: string;
  requestHash: string;
  receivedAt: string;
  expiresAt: string;
  consumedAt: string | null;
  redactedAt: string;
  stateRef: string;
  returnIntentRef: string;
  consumptionFenceEpoch: string;
  originChannelRef: string;
  maxRedemptions: 1;
  redemptionCount: number;
  grantState: SSOEntryGrantState;
}

export interface AuthBridgeTransaction {
  transactionId: string;
  entryGrantId: string;
  stateHash: string;
  nonceHash: string;
  codeVerifierRef: string;
  promptMode: "none";
  responseMode: "query" | "form_post";
  status: string;
  errorRef: string | null;
  completedAt: string | null;
  manifestVersionRef: string;
  bridgeCapabilityMatrixRef: string;
  contextFenceRef: string;
  transactionState: AuthBridgeTransactionState;
  expiresAt: string;
}

export interface IdentityAssertionBinding {
  bindingId: string;
  entryGrantRef: string;
  assertedIdentityHash: string;
  nhsLoginSubjectRef: string;
  claimSetHash: string;
  localSubjectBindingRef: string;
  bindingState: IdentityAssertionBindingState;
  evaluatedAt: string;
}

export interface SessionMergeDecision {
  mergeDecisionId: string;
  transactionRef: string;
  existingSessionRef: string | null;
  resolvedSessionRef: string | null;
  subjectComparisonState: SubjectComparisonState;
  draftClaimDisposition: DraftClaimDisposition;
  resumeIntentDisposition: ResumeIntentDisposition;
  decision: SessionMergeDecisionValue;
  decidedAt: string;
}

export interface ReturnIntent {
  returnIntentId: string;
  postAuthRoute: string;
  postAuthParams: Record<string, string>;
  embeddedState: EmbeddedReturnState;
  fallbackAppPage: AppReturnTarget;
  submissionEnvelopeRef: string | null;
  submissionPromotionRecordRef: string | null;
  draftLeaseRef: string | null;
  draftContinuityEvidenceRef: string | null;
  subjectRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  manifestVersionRef: string;
  routeFamilyRef: string;
  minimumBridgeCapabilitiesRef: string;
  lineageFenceEpoch: string;
  releaseApprovalFreezeRef: string;
  continuityEvidenceRef: string;
  routeFreezeDispositionRef: string;
  expiresAt: string;
  intentState: ReturnIntentState;
}

export interface ReturnIntentValidation {
  valid: boolean;
  invalidReason: ReturnIntentInvalidReason;
  outcome: SSOReturnOutcome;
}

export interface SSOReturnDisposition {
  returnDispositionId: string;
  transactionRef: string;
  outcome: SSOReturnOutcome;
  patientRouteRef: string;
  appReturnTargetRef: AppReturnTarget;
  copyVariantRef: string;
  allowRetry: boolean;
  evidenceRef: string;
}

export interface NhsAppSsoBridgeAuditRecord {
  auditId: string;
  eventType:
    | "sso_entry_grant_created"
    | "raw_asserted_identity_redacted"
    | "auth_bridge_transaction_opened"
    | "auth_bridge_callback_received"
    | "identity_assertion_binding_evaluated"
    | "session_merge_decision_emitted"
    | "return_intent_validated"
    | "sso_return_disposition_emitted";
  entryGrantRef: string | null;
  transactionRef: string | null;
  returnIntentRef: string | null;
  outcome: SSOReturnOutcome | null;
  reasonRefs: string[];
  redactionState: "raw_absent" | "raw_scrubbed" | "redacted_only";
  recordedAt: string;
}

export interface ExistingLocalSession {
  sessionRef: string;
  subjectRef: string;
  identityBindingRef: string;
  sessionEpochRef: string;
  subjectBindingVersionRef: string;
  sessionState: "active" | "anonymous" | "expired" | "terminated";
}

export interface CaptureAssertedIdentityInput {
  environment: NhsAppEnvironment;
  journeyPathId: string;
  routePath: string;
  rawUrl: string;
  assertedLoginIdentity: string;
  expectedSubjectRef: string;
  expectedIdentityBindingRef: string;
  expectedSubjectBindingVersionRef: string;
  sessionEpochRef: string;
  routeFamilyRef?: string;
  postAuthRoute?: string;
  postAuthParams?: Record<string, string>;
  fallbackAppPage?: AppReturnTarget;
  submissionEnvelopeRef?: string | null;
  submissionPromotionRecordRef?: string | null;
  draftLeaseRef?: string | null;
  draftContinuityEvidenceRef?: string | null;
  embeddedContextInput?: Omit<
    ResolveEmbeddedContextInput,
    "environment" | "journeyPathId" | "routePath"
  >;
  embeddedContext?: EmbeddedContextResolutionResult;
  localSession?: LocalSessionBinding | null;
  bridgeCapability?: BridgeCapabilitySnapshot | null;
  now?: string;
}

export interface AuthorizeRequest {
  method: "GET";
  url: string;
  parameters: Record<string, string>;
  loggingQueryString: string;
  promptMode: "none";
  convertedAssertedIdentityParameter: "asserted_login_identity";
  rawAssertedIdentityPersisted: false;
}

export interface SsoCaptureAndAuthorizeResult {
  entryGrant: SSOEntryGrant;
  transaction: AuthBridgeTransaction;
  returnIntent: ReturnIntent;
  authorizeRequest: AuthorizeRequest;
  redactedRequest: {
    redirectUrl: string;
    responseHeaders: Record<string, string>;
    removedQueryKeys: string[];
  };
  callbackFixture: {
    state: string;
    nonce: string;
    pkceVerifier: string;
  };
  auditRecords: NhsAppSsoBridgeAuditRecord[];
}

export interface HandleSsoCallbackInput {
  state: string;
  nonce: string;
  pkceVerifier: string;
  code?: string;
  error?: string;
  errorDescription?: string;
  returnedSubjectRef?: string;
  returnedIdentityBindingRef?: string;
  returnedSubjectBindingVersionRef?: string;
  assertedIdentityHash?: string;
  claimSet?: Record<string, string>;
  existingSession?: ExistingLocalSession | null;
  currentEmbeddedContext?: EmbeddedContextResolutionResult;
  now?: string;
}

export interface SsoCallbackResult {
  entryGrant: SSOEntryGrant | null;
  transaction: AuthBridgeTransaction | null;
  returnIntent: ReturnIntent | null;
  identityAssertionBinding: IdentityAssertionBinding | null;
  sessionMergeDecision: SessionMergeDecision | null;
  returnIntentValidation: ReturnIntentValidation;
  ssoReturnDisposition: SSOReturnDisposition;
  responseHeaders: Record<string, string>;
  auditRecords: NhsAppSsoBridgeAuditRecord[];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  if (value === undefined) {
    return "undefined";
  }
  return JSON.stringify(value);
}

function hashString(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`INVALID_TIME:${value}`);
  }
  return parsed;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function shortHash(value: unknown, length = 16): string {
  return hashString(value).slice(7, 7 + length);
}

function noStoreHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Vecells-Redaction": "assertedLoginIdentity",
  };
}

function redactAssertedIdentityFromUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl, "https://vecells.invalid");
  parsed.searchParams.delete("assertedLoginIdentity");
  const query = parsed.searchParams.toString();
  return `${parsed.pathname}${query ? `?${query}` : ""}`;
}

function buildDisposition(input: {
  transactionRef: string;
  outcome: SSOReturnOutcome;
  evidenceRef: string;
  returnIntent?: ReturnIntent | null;
}): SSOReturnDisposition {
  const routeByOutcome: Record<SSOReturnOutcome, string> = {
    silent_success: input.returnIntent?.postAuthRoute ?? "/nhs-app/requests",
    consent_denied: "/nhs-app/auth/recovery",
    silent_failure: "/nhs-app/auth/recovery",
    manifest_drift: "/nhs-app/recovery/manifest-drift",
    context_drift: "/nhs-app/recovery/context-drift",
    session_conflict: "/nhs-app/auth/recovery",
    safe_reentry_required: "/nhs-app/auth/recovery",
  };
  const appReturnByOutcome: Record<SSOReturnOutcome, AppReturnTarget> = {
    silent_success: input.returnIntent?.fallbackAppPage ?? "SERVICES",
    consent_denied: "HOME_PAGE",
    silent_failure: "HOME_PAGE",
    manifest_drift: "SERVICES",
    context_drift: "SERVICES",
    session_conflict: "HOME_PAGE",
    safe_reentry_required: "HOME_PAGE",
  };
  const copyByOutcome: Record<SSOReturnOutcome, string> = {
    silent_success: "copy:nhsapp-silent-success-v1",
    consent_denied: "copy:nhsapp-consent-denied-v1",
    silent_failure: "copy:nhsapp-silent-failure-v1",
    manifest_drift: "copy:nhsapp-manifest-drift-v1",
    context_drift: "copy:nhsapp-context-drift-v1",
    session_conflict: "copy:nhsapp-subject-mismatch-v1",
    safe_reentry_required: "copy:nhsapp-safe-reentry-required-v1",
  };
  return {
    returnDispositionId: `sso_return_379_${shortHash(input, 12)}`,
    transactionRef: input.transactionRef,
    outcome: input.outcome,
    patientRouteRef: routeByOutcome[input.outcome],
    appReturnTargetRef: appReturnByOutcome[input.outcome],
    copyVariantRef: copyByOutcome[input.outcome],
    allowRetry: input.outcome === "consent_denied" || input.outcome === "silent_failure",
    evidenceRef: input.evidenceRef,
  };
}

function terminalValidation(
  outcome: SSOReturnOutcome,
  reason: ReturnIntentInvalidReason,
): ReturnIntentValidation {
  return {
    valid: outcome === "silent_success",
    invalidReason: reason,
    outcome,
  };
}

export const phase7NhsAppSsoBridgeRoutes = [
  {
    routeId: "phase7_nhs_app_sso_entry_capture",
    method: "POST",
    path: "/internal/v1/nhs-app/sso/entry:capture",
    contractFamily: "SSOEntryGrantCaptureContract",
    purpose:
      "Capture assertedLoginIdentity, hash and redact it, and create a single-redemption SSOEntryGrant.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_sso_authorize",
    method: "POST",
    path: "/internal/v1/nhs-app/sso/authorize",
    contractFamily: "NHSAppSsoAuthorizeRequestContract",
    purpose:
      "Build the NHS login authorize request with prompt=none and asserted_login_identity conversion.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_sso_callback",
    method: "POST",
    path: "/internal/v1/nhs-app/sso/callback",
    contractFamily: "NHSAppSsoCallbackContract",
    purpose:
      "Verify callback state, nonce, PKCE, grant redemption, identity binding, session merge, and return intent fences.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_identity_assertion_bind",
    method: "POST",
    path: "/internal/v1/nhs-app/sso/identity-assertion:bind",
    contractFamily: "IdentityAssertionBindingContract",
    purpose:
      "Create an audit-safe proof that asserted identity, NHS login subject, and local subject binding agree.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_sso_return_disposition",
    method: "POST",
    path: "/internal/v1/nhs-app/sso/return-disposition:evaluate",
    contractFamily: "SSOReturnDispositionContract",
    purpose:
      "Evaluate silent success, denial, drift, session conflict, and safe re-entry outcomes.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
] as const;

export class SSOEntryGrantStore {
  private readonly grants = new Map<string, SSOEntryGrant>();

  save(grant: SSOEntryGrant): SSOEntryGrant {
    this.grants.set(grant.entryGrantId, clone(grant));
    return clone(grant);
  }

  get(entryGrantId: string): SSOEntryGrant | null {
    const grant = this.grants.get(entryGrantId);
    return grant ? clone(grant) : null;
  }

  redeem(
    entryGrantId: string,
    input: { now: string; terminalState: "consumed" | "denied" },
  ): {
    ok: boolean;
    grant: SSOEntryGrant | null;
    reason: "redeemed" | "missing" | "expired" | "replayed";
  } {
    const grant = this.grants.get(entryGrantId);
    if (!grant) {
      return { ok: false, grant: null, reason: "missing" };
    }
    if (parseTime(grant.expiresAt) <= parseTime(input.now)) {
      const expired: SSOEntryGrant = { ...grant, grantState: "expired" };
      this.grants.set(entryGrantId, expired);
      return { ok: false, grant: clone(expired), reason: "expired" };
    }
    if (grant.grantState !== "pending" || grant.redemptionCount >= grant.maxRedemptions) {
      return { ok: false, grant: clone(grant), reason: "replayed" };
    }
    const updated: SSOEntryGrant = {
      ...grant,
      consumedAt: input.now,
      redemptionCount: 1,
      grantState: input.terminalState,
    };
    this.grants.set(entryGrantId, updated);
    return { ok: true, grant: clone(updated), reason: "redeemed" };
  }

  list(): SSOEntryGrant[] {
    return [...this.grants.values()].map(clone);
  }
}

export class AuthBridgeTransactionStore {
  private readonly transactions = new Map<string, AuthBridgeTransaction>();
  private readonly transactionIdsByStateHash = new Map<string, string>();

  save(transaction: AuthBridgeTransaction): AuthBridgeTransaction {
    this.transactions.set(transaction.transactionId, clone(transaction));
    this.transactionIdsByStateHash.set(transaction.stateHash, transaction.transactionId);
    return clone(transaction);
  }

  get(transactionId: string): AuthBridgeTransaction | null {
    const transaction = this.transactions.get(transactionId);
    return transaction ? clone(transaction) : null;
  }

  getByState(state: string): AuthBridgeTransaction | null {
    const transactionId = this.transactionIdsByStateHash.get(hashString(state));
    return transactionId ? this.get(transactionId) : null;
  }

  receiveCallback(
    transactionId: string,
    now: string,
  ): {
    ok: boolean;
    transaction: AuthBridgeTransaction | null;
    reason: "accepted" | "missing" | "expired" | "replayed";
  } {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { ok: false, transaction: null, reason: "missing" };
    }
    if (parseTime(transaction.expiresAt) <= parseTime(now)) {
      const updated: AuthBridgeTransaction = {
        ...transaction,
        status: "expired",
        errorRef: "AuthBridgeTransaction:expired",
        completedAt: now,
        transactionState: "denied",
      };
      this.transactions.set(transactionId, updated);
      return { ok: false, transaction: clone(updated), reason: "expired" };
    }
    if (transaction.transactionState !== "awaiting_callback") {
      return { ok: false, transaction: clone(transaction), reason: "replayed" };
    }
    const updated: AuthBridgeTransaction = {
      ...transaction,
      status: "callback_received",
      transactionState: "callback_received",
    };
    this.transactions.set(transactionId, updated);
    return { ok: true, transaction: clone(updated), reason: "accepted" };
  }

  settle(
    transactionId: string,
    input: {
      status: string;
      transactionState: AuthBridgeTransactionState;
      now: string;
      errorRef?: string | null;
    },
  ): AuthBridgeTransaction {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`UNKNOWN_AUTH_BRIDGE_TRANSACTION:${transactionId}`);
    }
    const updated: AuthBridgeTransaction = {
      ...transaction,
      status: input.status,
      transactionState: input.transactionState,
      completedAt: input.now,
      errorRef: input.errorRef ?? null,
    };
    this.transactions.set(transactionId, updated);
    return clone(updated);
  }

  list(): AuthBridgeTransaction[] {
    return [...this.transactions.values()].map(clone);
  }
}

export class NhsAppSsoBridgeRecordStore {
  private readonly returnIntents = new Map<string, ReturnIntent>();
  private readonly identityBindings = new Map<string, IdentityAssertionBinding>();
  private readonly mergeDecisions = new Map<string, SessionMergeDecision>();
  private readonly returnDispositions = new Map<string, SSOReturnDisposition>();
  private readonly auditRecords: NhsAppSsoBridgeAuditRecord[] = [];

  saveReturnIntent(returnIntent: ReturnIntent): ReturnIntent {
    this.returnIntents.set(returnIntent.returnIntentId, clone(returnIntent));
    return clone(returnIntent);
  }

  getReturnIntent(returnIntentId: string): ReturnIntent | null {
    const returnIntent = this.returnIntents.get(returnIntentId);
    return returnIntent ? clone(returnIntent) : null;
  }

  saveIdentityBinding(binding: IdentityAssertionBinding): IdentityAssertionBinding {
    this.identityBindings.set(binding.bindingId, clone(binding));
    return clone(binding);
  }

  saveMergeDecision(decision: SessionMergeDecision): SessionMergeDecision {
    this.mergeDecisions.set(decision.mergeDecisionId, clone(decision));
    return clone(decision);
  }

  saveReturnDisposition(disposition: SSOReturnDisposition): SSOReturnDisposition {
    this.returnDispositions.set(disposition.returnDispositionId, clone(disposition));
    return clone(disposition);
  }

  recordAudit(
    input: Omit<NhsAppSsoBridgeAuditRecord, "auditId" | "recordedAt">,
  ): NhsAppSsoBridgeAuditRecord {
    const auditId = `audit:379:${input.eventType}:${shortHash(input, 12)}`;
    const record: NhsAppSsoBridgeAuditRecord = {
      ...input,
      auditId,
      recordedAt: RECORDED_AT,
    };
    this.auditRecords.push(record);
    return clone(record);
  }

  listAuditRecords(): NhsAppSsoBridgeAuditRecord[] {
    return this.auditRecords.map(clone);
  }

  snapshot(): {
    returnIntents: ReturnIntent[];
    identityBindings: IdentityAssertionBinding[];
    mergeDecisions: SessionMergeDecision[];
    returnDispositions: SSOReturnDisposition[];
    auditRecords: NhsAppSsoBridgeAuditRecord[];
  } {
    return {
      returnIntents: [...this.returnIntents.values()].map(clone),
      identityBindings: [...this.identityBindings.values()].map(clone),
      mergeDecisions: [...this.mergeDecisions.values()].map(clone),
      returnDispositions: [...this.returnDispositions.values()].map(clone),
      auditRecords: this.listAuditRecords(),
    };
  }
}

function resolveEmbeddedContextForCapture(
  embeddedContextApplication: Phase7EmbeddedContextApplication,
  input: CaptureAssertedIdentityInput,
): EmbeddedContextResolutionResult {
  if (input.embeddedContext) {
    return input.embeddedContext;
  }
  return embeddedContextApplication.resolve({
    environment: input.environment,
    journeyPathId: input.journeyPathId,
    routePath: input.routePath,
    ssoHandoffState: "pending",
    localSession: input.localSession ?? null,
    bridgeCapability: input.bridgeCapability ?? null,
    ...(input.embeddedContextInput ?? {}),
  });
}

function buildReturnIntent(input: {
  capture: CaptureAssertedIdentityInput;
  embeddedContext: EmbeddedContextResolutionResult;
  returnIntentId: string;
}): ReturnIntent {
  const navEligibility = input.embeddedContext.patientEmbeddedNavEligibility;
  const sessionProjection = input.embeddedContext.patientEmbeddedSessionProjection;
  return {
    returnIntentId: input.returnIntentId,
    postAuthRoute: input.capture.postAuthRoute ?? input.capture.routePath,
    postAuthParams: input.capture.postAuthParams ?? {},
    embeddedState: input.embeddedContext.channelContext.isEmbedded ? "embedded" : "recovery",
    fallbackAppPage: input.capture.fallbackAppPage ?? "SERVICES",
    submissionEnvelopeRef: input.capture.submissionEnvelopeRef ?? null,
    submissionPromotionRecordRef: input.capture.submissionPromotionRecordRef ?? null,
    draftLeaseRef: input.capture.draftLeaseRef ?? null,
    draftContinuityEvidenceRef: input.capture.draftContinuityEvidenceRef ?? null,
    subjectRef: input.capture.expectedSubjectRef,
    sessionEpochRef: input.capture.sessionEpochRef,
    subjectBindingVersionRef: input.capture.expectedSubjectBindingVersionRef,
    manifestVersionRef: sessionProjection.manifestVersionRef,
    routeFamilyRef: input.capture.routeFamilyRef ?? navEligibility.routeFamilyRef,
    minimumBridgeCapabilitiesRef: sessionProjection.minimumBridgeCapabilitiesRef,
    lineageFenceEpoch: `lineage-fence:379:${shortHash(input.returnIntentId, 10)}`,
    releaseApprovalFreezeRef: sessionProjection.releaseApprovalFreezeRef,
    continuityEvidenceRef: sessionProjection.experienceContinuityEvidenceRef,
    routeFreezeDispositionRef: sessionProjection.routeFreezeDispositionRef,
    expiresAt: DEFAULT_CALLBACK_EXPIRES_AT,
    intentState: "pending",
  };
}

function buildAuthorizeRequest(input: {
  assertedIdentityHash: string;
  state: string;
  nonce: string;
  pkceVerifier: string;
}): AuthorizeRequest {
  const parameters = {
    client_id: NHS_APP_SSO_CLIENT_ID,
    response_type: "code",
    redirect_uri: NHS_APP_SSO_REDIRECT_URI,
    scope: "openid profile",
    state: input.state,
    nonce: input.nonce,
    code_challenge: shortHash(input.pkceVerifier, 43),
    code_challenge_method: "S256",
    prompt: "none",
    asserted_login_identity: `redacted:${input.assertedIdentityHash}`,
  };
  const url = `${NHS_LOGIN_AUTHORIZE_URL}?${new URLSearchParams(parameters).toString()}`;
  const loggingQueryString = new URLSearchParams({
    ...parameters,
    state: "redacted",
    nonce: "redacted",
    asserted_login_identity: "redacted",
  }).toString();
  return {
    method: "GET",
    url,
    parameters,
    loggingQueryString,
    promptMode: "none",
    convertedAssertedIdentityParameter: "asserted_login_identity",
    rawAssertedIdentityPersisted: false,
  };
}

function createIdentityAssertionBinding(input: {
  entryGrant: SSOEntryGrant;
  returnIntent: ReturnIntent;
  returnedSubjectRef: string | undefined;
  returnedIdentityBindingRef: string | undefined;
  assertedIdentityHash: string | undefined;
  claimSet: Record<string, string> | undefined;
  now: string;
}): IdentityAssertionBinding {
  const returnedSubjectRef = input.returnedSubjectRef ?? "subject:missing";
  const returnedIdentityBindingRef =
    input.returnedIdentityBindingRef ??
    `IdentityBinding:${returnedSubjectRef}:${input.returnIntent.subjectBindingVersionRef}`;
  const assertedHashMatches =
    !input.assertedIdentityHash ||
    input.assertedIdentityHash === input.entryGrant.assertedIdentityHash;
  const subjectMatches = returnedSubjectRef === input.returnIntent.subjectRef;
  const bindingMatches =
    returnedIdentityBindingRef === input.returnIntent.postAuthParams.identityBindingRef;
  const bindingState: IdentityAssertionBindingState =
    subjectMatches &&
    assertedHashMatches &&
    (bindingMatches || !input.returnIntent.postAuthParams.identityBindingRef)
      ? "matched"
      : "mismatched";
  return {
    bindingId: `identity_assertion_379_${shortHash(
      `${input.entryGrant.entryGrantId}:${returnedSubjectRef}:${bindingState}`,
      12,
    )}`,
    entryGrantRef: input.entryGrant.entryGrantId,
    assertedIdentityHash: input.entryGrant.assertedIdentityHash,
    nhsLoginSubjectRef: returnedSubjectRef,
    claimSetHash: hashString(input.claimSet ?? {}),
    localSubjectBindingRef: returnedIdentityBindingRef,
    bindingState,
    evaluatedAt: input.now,
  };
}

function resolveSessionMergeDecision(input: {
  transaction: AuthBridgeTransaction;
  binding: IdentityAssertionBinding;
  returnIntent: ReturnIntent;
  existingSession: ExistingLocalSession | null | undefined;
  now: string;
}): SessionMergeDecision {
  const existingSession = input.existingSession ?? null;
  if (input.binding.bindingState !== "matched") {
    return {
      mergeDecisionId: `session_merge_379_${shortHash(`${input.transaction.transactionId}:mismatch`, 12)}`,
      transactionRef: input.transaction.transactionId,
      existingSessionRef: existingSession?.sessionRef ?? null,
      resolvedSessionRef: null,
      subjectComparisonState: "different_subject",
      draftClaimDisposition: "blocked_other_subject",
      resumeIntentDisposition: "deny_intent",
      decision: "terminate_and_reenter",
      decidedAt: input.now,
    };
  }
  if (!existingSession) {
    return {
      mergeDecisionId: `session_merge_379_${shortHash(`${input.transaction.transactionId}:new`, 12)}`,
      transactionRef: input.transaction.transactionId,
      existingSessionRef: null,
      resolvedSessionRef: `Session:phase7:${shortHash(input.binding.nhsLoginSubjectRef, 12)}`,
      subjectComparisonState: "no_session",
      draftClaimDisposition: input.returnIntent.submissionEnvelopeRef
        ? "draft_claim_allowed"
        : "none",
      resumeIntentDisposition: "consume_intent",
      decision: "rotate",
      decidedAt: input.now,
    };
  }
  if (existingSession.sessionState !== "active") {
    return {
      mergeDecisionId: `session_merge_379_${shortHash(`${input.transaction.transactionId}:stale`, 12)}`,
      transactionRef: input.transaction.transactionId,
      existingSessionRef: existingSession.sessionRef,
      resolvedSessionRef: `Session:phase7:${shortHash(input.binding.nhsLoginSubjectRef, 12)}`,
      subjectComparisonState: "stale_existing",
      draftClaimDisposition: input.returnIntent.submissionEnvelopeRef
        ? "draft_claim_allowed"
        : "none",
      resumeIntentDisposition: "consume_intent",
      decision: "rotate",
      decidedAt: input.now,
    };
  }
  if (existingSession.subjectRef !== input.binding.nhsLoginSubjectRef) {
    return {
      mergeDecisionId: `session_merge_379_${shortHash(`${input.transaction.transactionId}:conflict`, 12)}`,
      transactionRef: input.transaction.transactionId,
      existingSessionRef: existingSession.sessionRef,
      resolvedSessionRef: null,
      subjectComparisonState: "different_subject",
      draftClaimDisposition: "blocked_other_subject",
      resumeIntentDisposition: "deny_intent",
      decision: "terminate_and_reenter",
      decidedAt: input.now,
    };
  }
  if (existingSession.identityBindingRef !== input.binding.localSubjectBindingRef) {
    return {
      mergeDecisionId: `session_merge_379_${shortHash(`${input.transaction.transactionId}:rotate`, 12)}`,
      transactionRef: input.transaction.transactionId,
      existingSessionRef: existingSession.sessionRef,
      resolvedSessionRef: `Session:phase7:${shortHash(input.binding.nhsLoginSubjectRef, 12)}`,
      subjectComparisonState: "same_subject_binding_advanced",
      draftClaimDisposition: input.returnIntent.submissionEnvelopeRef
        ? "draft_claim_allowed"
        : "none",
      resumeIntentDisposition: "consume_intent",
      decision: "rotate",
      decidedAt: input.now,
    };
  }
  return {
    mergeDecisionId: `session_merge_379_${shortHash(`${input.transaction.transactionId}:reuse`, 12)}`,
    transactionRef: input.transaction.transactionId,
    existingSessionRef: existingSession.sessionRef,
    resolvedSessionRef: existingSession.sessionRef,
    subjectComparisonState: "same_subject_same_binding",
    draftClaimDisposition: input.returnIntent.submissionEnvelopeRef
      ? "draft_claim_allowed"
      : "none",
    resumeIntentDisposition: "consume_intent",
    decision: "reuse",
    decidedAt: input.now,
  };
}

function validateReturnIntent(input: {
  returnIntent: ReturnIntent;
  binding: IdentityAssertionBinding;
  mergeDecision: SessionMergeDecision;
  existingSession: ExistingLocalSession | null | undefined;
  currentEmbeddedContext: EmbeddedContextResolutionResult | undefined;
  now: string;
}): ReturnIntentValidation {
  if (parseTime(input.returnIntent.expiresAt) <= parseTime(input.now)) {
    return terminalValidation("safe_reentry_required", "expired");
  }
  if (input.returnIntent.submissionPromotionRecordRef) {
    return terminalValidation("safe_reentry_required", "draft_already_promoted");
  }
  if (input.binding.bindingState !== "matched") {
    return terminalValidation("session_conflict", "subject_mismatch");
  }
  if (
    input.mergeDecision.decision === "terminate_and_reenter" ||
    input.mergeDecision.decision === "deny"
  ) {
    return terminalValidation("session_conflict", "subject_mismatch");
  }
  if (input.binding.nhsLoginSubjectRef !== input.returnIntent.subjectRef) {
    return terminalValidation("session_conflict", "subject_mismatch");
  }
  if (
    input.existingSession &&
    input.existingSession.subjectRef === input.returnIntent.subjectRef &&
    input.existingSession.sessionEpochRef !== input.returnIntent.sessionEpochRef
  ) {
    return terminalValidation("session_conflict", "session_epoch_mismatch");
  }
  if (
    input.existingSession &&
    input.existingSession.subjectRef === input.returnIntent.subjectRef &&
    input.existingSession.subjectBindingVersionRef !== input.returnIntent.subjectBindingVersionRef
  ) {
    return terminalValidation("session_conflict", "subject_binding_mismatch");
  }
  const current = input.currentEmbeddedContext;
  if (!current) {
    return terminalValidation("silent_success", "none");
  }
  if (current.blockedReasons.includes("manifest_drift")) {
    return terminalValidation("manifest_drift", "manifest_drift");
  }
  if (
    current.patientEmbeddedSessionProjection.manifestVersionRef !==
    input.returnIntent.manifestVersionRef
  ) {
    return terminalValidation("manifest_drift", "manifest_drift");
  }
  if (
    current.patientEmbeddedSessionProjection.minimumBridgeCapabilitiesRef !==
    input.returnIntent.minimumBridgeCapabilitiesRef
  ) {
    return terminalValidation("context_drift", "bridge_floor_mismatch");
  }
  if (current.patientEmbeddedNavEligibility.routeFamilyRef !== input.returnIntent.routeFamilyRef) {
    return terminalValidation("context_drift", "route_family_mismatch");
  }
  if (current.patientEmbeddedNavEligibility.eligibilityState !== "live") {
    return terminalValidation("context_drift", "embedded_eligibility_not_live");
  }
  return terminalValidation("silent_success", "none");
}

export interface Phase7NhsAppSsoBridgeApplication {
  entryGrantStore: SSOEntryGrantStore;
  transactionStore: AuthBridgeTransactionStore;
  recordStore: NhsAppSsoBridgeRecordStore;
  captureAndAuthorize(input: CaptureAssertedIdentityInput): SsoCaptureAndAuthorizeResult;
  handleCallback(input: HandleSsoCallbackInput): SsoCallbackResult;
  listAuditRecords(): NhsAppSsoBridgeAuditRecord[];
}

export function createPhase7NhsAppSsoBridgeApplication(input?: {
  entryGrantStore?: SSOEntryGrantStore;
  transactionStore?: AuthBridgeTransactionStore;
  recordStore?: NhsAppSsoBridgeRecordStore;
  embeddedContextApplication?: Phase7EmbeddedContextApplication;
}): Phase7NhsAppSsoBridgeApplication {
  const entryGrantStore = input?.entryGrantStore ?? new SSOEntryGrantStore();
  const transactionStore = input?.transactionStore ?? new AuthBridgeTransactionStore();
  const recordStore = input?.recordStore ?? new NhsAppSsoBridgeRecordStore();
  const embeddedContextApplication =
    input?.embeddedContextApplication ?? createDefaultPhase7EmbeddedContextApplication();

  function captureAndAuthorize(
    captureInput: CaptureAssertedIdentityInput,
  ): SsoCaptureAndAuthorizeResult {
    const now = captureInput.now ?? RECORDED_AT;
    const assertedIdentityHash = hashString(captureInput.assertedLoginIdentity);
    const redactedUrl = redactAssertedIdentityFromUrl(captureInput.rawUrl);
    const requestHash = hashString({
      url: redactedUrl,
      journeyPathId: captureInput.journeyPathId,
      routePath: captureInput.routePath,
      environment: captureInput.environment,
    });
    const state = `state:379:${shortHash(`${requestHash}:${now}`, 16)}`;
    const nonce = `nonce:379:${shortHash(`${assertedIdentityHash}:${now}`, 16)}`;
    const pkceVerifier = `pkce:379:${shortHash(`${state}:${nonce}`, 32)}`;
    const embeddedContext = resolveEmbeddedContextForCapture(
      embeddedContextApplication,
      captureInput,
    );
    const returnIntentId = `return_intent_379_${shortHash(`${requestHash}:${captureInput.expectedSubjectRef}`, 12)}`;
    const returnIntent = recordStore.saveReturnIntent({
      ...buildReturnIntent({ capture: captureInput, embeddedContext, returnIntentId }),
      postAuthParams: {
        ...(captureInput.postAuthParams ?? {}),
        identityBindingRef: captureInput.expectedIdentityBindingRef,
        configFingerprintRef: PHASE7_CONFIG_FINGERPRINT,
      },
    });
    const entryGrant = entryGrantStore.save({
      entryGrantId: `sso_grant_379_${shortHash(`${assertedIdentityHash}:${state}`, 12)}`,
      journeyPathId: captureInput.journeyPathId,
      assertedIdentityHash,
      requestHash,
      receivedAt: now,
      expiresAt: captureInput.now ? DEFAULT_EXPIRES_AT : DEFAULT_EXPIRES_AT,
      consumedAt: null,
      redactedAt: now,
      stateRef: state,
      returnIntentRef: returnIntent.returnIntentId,
      consumptionFenceEpoch: `sso-fence:379:${shortHash(state, 10)}`,
      originChannelRef: `ChannelContext:${embeddedContext.channelContext.trustTier}`,
      maxRedemptions: 1,
      redemptionCount: 0,
      grantState: "pending",
    });
    const transaction = transactionStore.save({
      transactionId: `auth_tx_379_${shortHash(`${entryGrant.entryGrantId}:${state}`, 12)}`,
      entryGrantId: entryGrant.entryGrantId,
      stateHash: hashString(state),
      nonceHash: hashString(nonce),
      codeVerifierRef: hashString(pkceVerifier),
      promptMode: "none",
      responseMode: "query",
      status: "awaiting_callback",
      errorRef: null,
      completedAt: null,
      manifestVersionRef: embeddedContext.patientEmbeddedSessionProjection.manifestVersionRef,
      bridgeCapabilityMatrixRef:
        embeddedContext.patientEmbeddedSessionProjection.currentBridgeCapabilityMatrixRef,
      contextFenceRef: embeddedContext.hydrationBinding.serverContextRef,
      transactionState: "awaiting_callback",
      expiresAt: DEFAULT_CALLBACK_EXPIRES_AT,
    });
    const authorizeRequest = buildAuthorizeRequest({
      assertedIdentityHash,
      state,
      nonce,
      pkceVerifier,
    });
    const auditRecords = [
      recordStore.recordAudit({
        eventType: "sso_entry_grant_created",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: null,
        reasonRefs: ["asserted_identity_hashed"],
        redactionState: "raw_scrubbed",
      }),
      recordStore.recordAudit({
        eventType: "raw_asserted_identity_redacted",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: null,
        reasonRefs: ["assertedLoginIdentity_removed_from_supplier_url"],
        redactionState: "raw_scrubbed",
      }),
      recordStore.recordAudit({
        eventType: "auth_bridge_transaction_opened",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: null,
        reasonRefs: ["prompt_none", "asserted_login_identity_converted"],
        redactionState: "redacted_only",
      }),
    ];
    return {
      entryGrant,
      transaction,
      returnIntent,
      authorizeRequest,
      redactedRequest: {
        redirectUrl: redactedUrl,
        responseHeaders: noStoreHeaders(),
        removedQueryKeys: ["assertedLoginIdentity"],
      },
      callbackFixture: {
        state,
        nonce,
        pkceVerifier,
      },
      auditRecords,
    };
  }

  function handleCallback(callbackInput: HandleSsoCallbackInput): SsoCallbackResult {
    const now = callbackInput.now ?? RECORDED_AT;
    const transaction = transactionStore.getByState(callbackInput.state);
    if (!transaction) {
      const disposition = recordStore.saveReturnDisposition(
        buildDisposition({
          transactionRef: "AuthBridgeTransaction:unknown",
          outcome: "silent_failure",
          evidenceRef: "AuthBridgeTransaction:state-missing",
        }),
      );
      return {
        entryGrant: null,
        transaction: null,
        returnIntent: null,
        identityAssertionBinding: null,
        sessionMergeDecision: null,
        returnIntentValidation: terminalValidation("silent_failure", "context_drift"),
        ssoReturnDisposition: disposition,
        responseHeaders: noStoreHeaders(),
        auditRecords: [
          recordStore.recordAudit({
            eventType: "auth_bridge_callback_received",
            entryGrantRef: null,
            transactionRef: null,
            returnIntentRef: null,
            outcome: "silent_failure",
            reasonRefs: ["state_missing"],
            redactionState: "raw_absent",
          }),
        ],
      };
    }

    const callbackReceive = transactionStore.receiveCallback(transaction.transactionId, now);
    const entryGrant = entryGrantStore.get(transaction.entryGrantId);
    const returnIntent = entryGrant
      ? recordStore.getReturnIntent(entryGrant.returnIntentRef)
      : null;
    const initialAudit = recordStore.recordAudit({
      eventType: "auth_bridge_callback_received",
      entryGrantRef: entryGrant?.entryGrantId ?? null,
      transactionRef: transaction.transactionId,
      returnIntentRef: returnIntent?.returnIntentId ?? null,
      outcome: null,
      reasonRefs: [callbackReceive.reason],
      redactionState: "raw_absent",
    });

    if (!callbackReceive.ok || !entryGrant || !returnIntent) {
      const disposition = recordStore.saveReturnDisposition(
        buildDisposition({
          transactionRef: transaction.transactionId,
          outcome: "safe_reentry_required",
          evidenceRef:
            callbackReceive.reason === "replayed"
              ? "AuthBridgeTransaction:replayed"
              : "AuthBridgeTransaction:invalid",
          returnIntent,
        }),
      );
      return {
        entryGrant,
        transaction: callbackReceive.transaction ?? transaction,
        returnIntent,
        identityAssertionBinding: null,
        sessionMergeDecision: null,
        returnIntentValidation: terminalValidation("safe_reentry_required", "context_drift"),
        ssoReturnDisposition: disposition,
        responseHeaders: noStoreHeaders(),
        auditRecords: [initialAudit],
      };
    }

    const terminalGrantState =
      callbackInput.error === "access_denied" &&
      callbackInput.errorDescription === "ConsentNotGiven"
        ? "denied"
        : "consumed";
    const grantRedemption = entryGrantStore.redeem(entryGrant.entryGrantId, {
      now,
      terminalState: terminalGrantState,
    });
    const redeemedGrant = grantRedemption.grant;
    if (!grantRedemption.ok || !redeemedGrant) {
      const settledTransaction = transactionStore.settle(transaction.transactionId, {
        status: "replayed_entry_grant",
        transactionState: "recovery_required",
        now,
        errorRef: "SSOEntryGrant:already-consumed",
      });
      const disposition = recordStore.saveReturnDisposition(
        buildDisposition({
          transactionRef: transaction.transactionId,
          outcome: "safe_reentry_required",
          evidenceRef: "SSOEntryGrant:already-consumed",
          returnIntent,
        }),
      );
      return {
        entryGrant: grantRedemption.grant,
        transaction: settledTransaction,
        returnIntent,
        identityAssertionBinding: null,
        sessionMergeDecision: null,
        returnIntentValidation: terminalValidation("safe_reentry_required", "context_drift"),
        ssoReturnDisposition: disposition,
        responseHeaders: noStoreHeaders(),
        auditRecords: [initialAudit],
      };
    }

    if (
      callbackInput.error === "access_denied" &&
      callbackInput.errorDescription === "ConsentNotGiven"
    ) {
      const settledTransaction = transactionStore.settle(transaction.transactionId, {
        status: "consent_denied",
        transactionState: "denied",
        now,
        errorRef: "AuthBridgeTransaction:error-consent-not-given",
      });
      const disposition = recordStore.saveReturnDisposition(
        buildDisposition({
          transactionRef: transaction.transactionId,
          outcome: "consent_denied",
          evidenceRef: "AuthBridgeTransaction:error-consent-not-given",
          returnIntent,
        }),
      );
      const auditRecord = recordStore.recordAudit({
        eventType: "sso_return_disposition_emitted",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: "consent_denied",
        reasonRefs: ["ConsentNotGiven"],
        redactionState: "raw_absent",
      });
      return {
        entryGrant: grantRedemption.grant,
        transaction: settledTransaction,
        returnIntent,
        identityAssertionBinding: null,
        sessionMergeDecision: null,
        returnIntentValidation: terminalValidation("consent_denied", "none"),
        ssoReturnDisposition: disposition,
        responseHeaders: noStoreHeaders(),
        auditRecords: [initialAudit, auditRecord],
      };
    }

    const nonceValid = transaction.nonceHash === hashString(callbackInput.nonce);
    const pkceValid = transaction.codeVerifierRef === hashString(callbackInput.pkceVerifier);
    if (!nonceValid || !pkceValid || !callbackInput.code) {
      const settledTransaction = transactionStore.settle(transaction.transactionId, {
        status: "callback_validation_failed",
        transactionState: "denied",
        now,
        errorRef: "AuthBridgeTransaction:nonce-or-pkce-failed",
      });
      const disposition = recordStore.saveReturnDisposition(
        buildDisposition({
          transactionRef: transaction.transactionId,
          outcome: "silent_failure",
          evidenceRef: "AuthBridgeTransaction:nonce-or-pkce-failed",
          returnIntent,
        }),
      );
      return {
        entryGrant: grantRedemption.grant,
        transaction: settledTransaction,
        returnIntent,
        identityAssertionBinding: null,
        sessionMergeDecision: null,
        returnIntentValidation: terminalValidation("silent_failure", "context_drift"),
        ssoReturnDisposition: disposition,
        responseHeaders: noStoreHeaders(),
        auditRecords: [initialAudit],
      };
    }

    const binding = recordStore.saveIdentityBinding(
      createIdentityAssertionBinding({
        entryGrant: redeemedGrant,
        returnIntent,
        returnedSubjectRef: callbackInput.returnedSubjectRef,
        returnedIdentityBindingRef: callbackInput.returnedIdentityBindingRef,
        assertedIdentityHash: callbackInput.assertedIdentityHash,
        claimSet: callbackInput.claimSet,
        now,
      }),
    );
    const mergeDecision = recordStore.saveMergeDecision(
      resolveSessionMergeDecision({
        transaction,
        binding,
        returnIntent,
        existingSession: callbackInput.existingSession,
        now,
      }),
    );
    const returnIntentValidation = validateReturnIntent({
      returnIntent,
      binding,
      mergeDecision,
      existingSession: callbackInput.existingSession,
      currentEmbeddedContext: callbackInput.currentEmbeddedContext,
      now,
    });
    const settledTransaction = transactionStore.settle(transaction.transactionId, {
      status: returnIntentValidation.outcome,
      transactionState: returnIntentValidation.valid ? "verified" : "recovery_required",
      now,
      errorRef:
        returnIntentValidation.outcome === "silent_success"
          ? null
          : `SSOReturnDisposition:${returnIntentValidation.invalidReason}`,
    });
    const disposition = recordStore.saveReturnDisposition(
      buildDisposition({
        transactionRef: transaction.transactionId,
        outcome: returnIntentValidation.outcome,
        evidenceRef:
          returnIntentValidation.outcome === "silent_success"
            ? binding.bindingId
            : `SSOReturnDisposition:${returnIntentValidation.invalidReason}`,
        returnIntent,
      }),
    );
    const auditRecords = [
      initialAudit,
      recordStore.recordAudit({
        eventType: "identity_assertion_binding_evaluated",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: null,
        reasonRefs: [binding.bindingState],
        redactionState: "redacted_only",
      }),
      recordStore.recordAudit({
        eventType: "session_merge_decision_emitted",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: null,
        reasonRefs: [mergeDecision.decision, mergeDecision.subjectComparisonState],
        redactionState: "redacted_only",
      }),
      recordStore.recordAudit({
        eventType: "return_intent_validated",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: returnIntentValidation.outcome,
        reasonRefs: [returnIntentValidation.invalidReason],
        redactionState: "redacted_only",
      }),
      recordStore.recordAudit({
        eventType: "sso_return_disposition_emitted",
        entryGrantRef: entryGrant.entryGrantId,
        transactionRef: transaction.transactionId,
        returnIntentRef: returnIntent.returnIntentId,
        outcome: disposition.outcome,
        reasonRefs: [disposition.evidenceRef],
        redactionState: "redacted_only",
      }),
    ];
    return {
      entryGrant: redeemedGrant,
      transaction: settledTransaction,
      returnIntent,
      identityAssertionBinding: binding,
      sessionMergeDecision: mergeDecision,
      returnIntentValidation,
      ssoReturnDisposition: disposition,
      responseHeaders: noStoreHeaders(),
      auditRecords,
    };
  }

  return {
    entryGrantStore,
    transactionStore,
    recordStore,
    captureAndAuthorize,
    handleCallback,
    listAuditRecords() {
      return recordStore.listAuditRecords();
    },
  };
}

export function createDefaultPhase7NhsAppSsoBridgeApplication(): Phase7NhsAppSsoBridgeApplication {
  return createPhase7NhsAppSsoBridgeApplication();
}

export function createPhase7SsoLocalSession(
  input?: Partial<LocalSessionBinding>,
): LocalSessionBinding {
  return {
    subjectRef: input?.subjectRef ?? "subject:test-patient",
    identityBindingRef: input?.identityBindingRef ?? "IdentityBinding:test-patient-v4",
    sessionEpochRef: input?.sessionEpochRef ?? "SessionEpoch:7",
    subjectBindingVersionRef: input?.subjectBindingVersionRef ?? "SubjectBindingVersion:4",
    sessionState: input?.sessionState ?? "active",
    patientShellContinuityKey:
      input?.patientShellContinuityKey ?? "patient-shell-continuity:test-patient",
    entityContinuityKey: input?.entityContinuityKey ?? "entity-continuity:request-123",
    selectedAnchorRef: input?.selectedAnchorRef ?? "SelectedAnchor:request-status",
    returnContractRef: input?.returnContractRef ?? "ReturnIntent:request-status",
  };
}

export function createPhase7SsoVerifiedBridge(): BridgeCapabilitySnapshot {
  return {
    bridgeCapabilityMatrixRef: "BridgeCapabilityMatrix:nhs-app-js-v2-minimum",
    capabilityState: "verified",
    supportedBridgeActionRefs: [
      "navigation.goToPage",
      "navigation.setBackAction",
      "navigation.clearBackAction",
    ],
    detectedPlatform: "ios",
  };
}

export const PHASE7_SSO_DEFAULT_MANIFEST_FENCE = {
  manifestVersionRef: PHASE7_MANIFEST_VERSION,
  releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  minimumBridgeCapabilitiesRef: PHASE7_MINIMUM_BRIDGE_REF,
} as const;
