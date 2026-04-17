import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  type PersistedRequestRow,
  type RequestAggregate,
  type RequestIdentityState,
  RequestBackboneInvariantError,
  hydrateRequest,
  serializeRequest,
} from "@vecells/domain-kernel";
import { EpisodeAggregate, type EpisodeSnapshot } from "./submission-lineage-backbone";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
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
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function assertProbability(value: number, field: string): void {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
  );
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

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmacSha256Hex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function timingSafeHexEqual(left: string, right: string): boolean {
  if (left.length !== right.length || left.length % 2 !== 0 || right.length % 2 !== 0) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextIdentityAccessId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function bindingVersionRef(bindingId: string, bindingVersion: number): string {
  return `${bindingId}@v${bindingVersion}`;
}

function requestIdentityStateFromBinding(snapshot: IdentityBindingSnapshot): RequestIdentityState {
  if (snapshot.patientRef && snapshot.ownershipState === "claimed") {
    return "claimed";
  }
  if (snapshot.patientRef) {
    return "matched";
  }
  if (snapshot.subjectRef || snapshot.candidatePatientRefs.length > 0) {
    return "partial_match";
  }
  return "anonymous";
}

function ensureRequestIdentityState(
  snapshot: PersistedRequestRow,
  binding: IdentityBindingSnapshot,
  updatedAt: string,
): RequestAggregate {
  const nextState = requestIdentityStateFromBinding(binding);
  return hydrateRequest({
    ...snapshot,
    currentIdentityBindingRef: binding.bindingId,
    patientRef: binding.patientRef,
    identityState: nextState,
    updatedAt,
    requestVersion: nextVersion(snapshot.requestVersion),
    version: nextVersion(snapshot.version),
  });
}

function ensureEpisodeIdentityState(
  snapshot: EpisodeSnapshot,
  binding: IdentityBindingSnapshot,
  updatedAt: string,
): EpisodeAggregate {
  return EpisodeAggregate.hydrate({
    ...snapshot,
    currentIdentityBindingRef: binding.bindingId,
    patientRef: binding.patientRef,
    updatedAt,
    version: nextVersion(snapshot.version),
  });
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

export type AccessGrantUseCase =
  | "draft_resume"
  | "request_claim"
  | "secure_continuation"
  | "callback_reply"
  | "message_reply"
  | "booking_manage"
  | "waitlist_action"
  | "network_alternative_choice"
  | "pharmacy_choice"
  | "support_reissue"
  | "recover_only";

export type AccessGrantIssuanceOutcome = "issued" | "manual_only" | "recover_only";
export type AccessGrantSessionRequirement = "none" | "fresh_or_rotated" | "bound_session";

export interface AccessGrantUseCasePolicy {
  readonly useCase: AccessGrantUseCase;
  readonly grantFamily: AccessGrantFamily | null;
  readonly defaultActionScope: AccessGrantActionScope | null;
  readonly allowedActionScopes: readonly AccessGrantActionScope[];
  readonly defaultRouteFamilyRef: string;
  readonly allowedRouteFamilyRefs: readonly string[];
  readonly lineageScope: AccessGrantLineageScope;
  readonly phiExposureClass: AccessGrantPhiExposureClass;
  readonly subjectBindingMode: AccessGrantSubjectBindingMode;
  readonly sessionRequirement: AccessGrantSessionRequirement;
  readonly issuanceOutcome: AccessGrantIssuanceOutcome;
  readonly defaultExpiryMinutes: number;
  readonly supersessionTriggers: readonly AccessGrantSupersessionCauseClass[];
  readonly rationale: string;
}

export type AccessGrantTokenTransportClass =
  | "url_query"
  | "sms"
  | "email"
  | "portal_session"
  | "support_reissue"
  | "browser_callback";

export interface AccessGrantMaterializedToken {
  readonly opaqueToken: string;
  readonly tokenHash: string;
  readonly tokenId: string;
  readonly tokenKeyVersionRef: string;
  readonly validatorFamily: AccessGrantValidatorFamily;
  readonly signatureHex: string;
  readonly transportClass: AccessGrantTokenTransportClass;
  readonly entropyBits: number;
  readonly issuedAt: string;
}

export interface AccessGrantTokenEntropySource {
  nextOpaqueNonce(bits: number): string;
}

export class DeterministicAccessGrantTokenEntropySource implements AccessGrantTokenEntropySource {
  private readonly idGenerator: BackboneIdGenerator;

  constructor(idGenerator: BackboneIdGenerator) {
    this.idGenerator = idGenerator;
  }

  nextOpaqueNonce(bits: number): string {
    const kind = `access_grant_opaque_nonce_${bits}`;
    const seed = (this.idGenerator.nextId as unknown as (value: string) => string)(kind);
    return sha256Hex(seed).slice(0, Math.max(32, Math.ceil(bits / 4)));
  }
}

export class SecureAccessGrantTokenEntropySource implements AccessGrantTokenEntropySource {
  nextOpaqueNonce(bits: number): string {
    const requiredHexChars = Math.max(32, Math.ceil(bits / 4));
    return randomBytes(Math.ceil(requiredHexChars / 2))
      .toString("hex")
      .slice(0, requiredHexChars);
  }
}

export interface AccessGrantTokenKeyring {
  readonly activeKeyVersionRef: string;
  getSigningSecret(tokenKeyVersionRef: string): string;
  hasSigningSecret(tokenKeyVersionRef: string): boolean;
}

export class InMemoryAccessGrantTokenKeyring implements AccessGrantTokenKeyring {
  readonly activeKeyVersionRef: string;
  private readonly secrets: ReadonlyMap<string, string>;

  constructor(input: { activeKeyVersionRef: string; secrets: Readonly<Record<string, string>> }) {
    this.activeKeyVersionRef = requireRef(input.activeKeyVersionRef, "activeKeyVersionRef");
    this.secrets = new Map(
      Object.entries(input.secrets).map(([tokenKeyVersionRef, secret]) => [
        requireRef(tokenKeyVersionRef, "tokenKeyVersionRef"),
        requireRef(secret, "secret"),
      ]),
    );
    invariant(
      this.secrets.has(this.activeKeyVersionRef),
      "ACTIVE_TOKEN_KEY_MISSING",
      `Keyring is missing active key ${this.activeKeyVersionRef}.`,
    );
  }

  getSigningSecret(tokenKeyVersionRef: string): string {
    const secret = this.secrets.get(tokenKeyVersionRef);
    invariant(
      secret,
      "TOKEN_KEY_SECRET_MISSING",
      `No signing secret is configured for ${tokenKeyVersionRef}.`,
    );
    return secret;
  }

  hasSigningSecret(tokenKeyVersionRef: string): boolean {
    return this.secrets.has(tokenKeyVersionRef);
  }
}

export interface AccessGrantTokenMaterializationInput {
  readonly tokenKeyVersionRef: string;
  readonly validatorFamily: AccessGrantValidatorFamily;
  readonly transportClass: AccessGrantTokenTransportClass;
  readonly issuedAt: string;
  readonly entropyBits?: number;
}

export interface AccessGrantTokenVerificationResult {
  readonly valid: boolean;
  readonly tokenKeyVersionRef: string | null;
  readonly signatureHex: string | null;
  readonly nonce: string | null;
  readonly format: "opaque_hmac_v1" | "legacy_plaintext";
}

export interface AccessGrantTokenMaterializer {
  materializeToken(input: AccessGrantTokenMaterializationInput): AccessGrantMaterializedToken;
  verifyPresentedToken(input: {
    presentedToken: string;
    tokenKeyVersionRef: string;
    validatorFamily: AccessGrantValidatorFamily;
  }): AccessGrantTokenVerificationResult;
}

function buildOpaqueTokenSignature(input: {
  keyring: AccessGrantTokenKeyring;
  tokenKeyVersionRef: string;
  validatorFamily: AccessGrantValidatorFamily;
  nonce: string;
}): string {
  return hmacSha256Hex(
    input.keyring.getSigningSecret(input.tokenKeyVersionRef),
    `${input.validatorFamily}::${input.nonce}`,
  );
}

function parseOpaqueAccessGrantToken(
  presentedToken: string,
): { tokenKeyVersionRef: string; nonce: string; signatureHex: string } | null {
  const trimmed = requireRef(presentedToken, "presentedToken");
  const segments = trimmed.split(".");
  if (segments.length !== 4 || segments[0] !== "ag") {
    return null;
  }
  const [, tokenKeyVersionRef, nonce, signatureHex] = segments;
  if (!tokenKeyVersionRef || !nonce || !signatureHex) {
    return null;
  }
  return {
    tokenKeyVersionRef,
    nonce,
    signatureHex,
  };
}

export class OpaqueAccessGrantTokenMaterializer implements AccessGrantTokenMaterializer {
  private readonly keyring: AccessGrantTokenKeyring;
  private readonly entropySource: AccessGrantTokenEntropySource;

  constructor(input: {
    keyring: AccessGrantTokenKeyring;
    entropySource: AccessGrantTokenEntropySource;
  }) {
    this.keyring = input.keyring;
    this.entropySource = input.entropySource;
  }

  materializeToken(input: AccessGrantTokenMaterializationInput): AccessGrantMaterializedToken {
    const tokenKeyVersionRef = requireRef(input.tokenKeyVersionRef, "tokenKeyVersionRef");
    const issuedAt = ensureIsoTimestamp(input.issuedAt, "issuedAt");
    const entropyBits = Math.max(input.entropyBits ?? 128, 128);
    const nonce = this.entropySource.nextOpaqueNonce(entropyBits);
    const tokenId = sha256Hex(`${tokenKeyVersionRef}::${input.validatorFamily}::${nonce}`).slice(
      0,
      24,
    );
    const signatureHex = buildOpaqueTokenSignature({
      keyring: this.keyring,
      tokenKeyVersionRef,
      validatorFamily: input.validatorFamily,
      nonce,
    });
    const opaqueToken = `ag.${tokenKeyVersionRef}.${nonce}.${signatureHex}`;
    return {
      opaqueToken,
      tokenHash: hashAccessGrantToken({
        presentedToken: opaqueToken,
        tokenKeyVersionRef,
        validatorFamily: input.validatorFamily,
      }),
      tokenId,
      tokenKeyVersionRef,
      validatorFamily: input.validatorFamily,
      signatureHex,
      transportClass: input.transportClass,
      entropyBits,
      issuedAt,
    };
  }

  verifyPresentedToken(input: {
    presentedToken: string;
    tokenKeyVersionRef: string;
    validatorFamily: AccessGrantValidatorFamily;
  }): AccessGrantTokenVerificationResult {
    const parsed = parseOpaqueAccessGrantToken(input.presentedToken);
    if (!parsed) {
      return {
        valid: true,
        tokenKeyVersionRef: input.tokenKeyVersionRef,
        signatureHex: null,
        nonce: null,
        format: "legacy_plaintext",
      };
    }
    if (!this.keyring.hasSigningSecret(parsed.tokenKeyVersionRef)) {
      return {
        valid: false,
        tokenKeyVersionRef: parsed.tokenKeyVersionRef,
        signatureHex: parsed.signatureHex,
        nonce: parsed.nonce,
        format: "opaque_hmac_v1",
      };
    }
    if (parsed.tokenKeyVersionRef !== input.tokenKeyVersionRef) {
      return {
        valid: false,
        tokenKeyVersionRef: parsed.tokenKeyVersionRef,
        signatureHex: parsed.signatureHex,
        nonce: parsed.nonce,
        format: "opaque_hmac_v1",
      };
    }
    const expectedSignatureHex = buildOpaqueTokenSignature({
      keyring: this.keyring,
      tokenKeyVersionRef: parsed.tokenKeyVersionRef,
      validatorFamily: input.validatorFamily,
      nonce: parsed.nonce,
    });
    return {
      valid: timingSafeHexEqual(expectedSignatureHex, parsed.signatureHex),
      tokenKeyVersionRef: parsed.tokenKeyVersionRef,
      signatureHex: parsed.signatureHex,
      nonce: parsed.nonce,
      format: "opaque_hmac_v1",
    };
  }
}

export type AccessGrantSessionState =
  | "anonymous"
  | "establishing"
  | "active"
  | "step_up_required"
  | "restricted"
  | "recovery_only"
  | "revoked"
  | "expired_idle"
  | "expired_absolute"
  | "terminated";

export type AccessGrantRouteAuthorityState =
  | "none"
  | "auth_read_only"
  | "claim_pending"
  | "writable";

export interface AccessGrantSessionSnapshot {
  readonly sessionRef: string;
  readonly subjectRef: string | null;
  readonly identityBindingRef: string | null;
  readonly sessionState: AccessGrantSessionState;
  readonly routeAuthorityState: AccessGrantRouteAuthorityState;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly csrfSecretRef: string | null;
}

export type SessionEstablishmentComparisonState =
  | "no_session"
  | "anonymous_session"
  | "same_subject_same_binding"
  | "same_subject_binding_advanced"
  | "different_subject"
  | "mismatched_secure_link_subject"
  | "stale_existing";

export type SessionEstablishmentDecisionValue =
  | "create_fresh"
  | "rotate_existing"
  | "reuse_existing"
  | "deny"
  | "bounded_recovery";

export type AccessGrantWritableAuthorityState =
  | "none"
  | "auth_read_only"
  | "claim_pending"
  | "writable";

export interface SessionEstablishmentDecisionSnapshot {
  readonly decisionId: string;
  readonly existingSessionRef: string | null;
  readonly resolvedSessionRef: string | null;
  readonly subjectComparisonState: SessionEstablishmentComparisonState;
  readonly writableAuthorityState: AccessGrantWritableAuthorityState;
  readonly decision: SessionEstablishmentDecisionValue;
  readonly decidedAt: string;
  readonly sessionEpochRef: string | null;
  readonly csrfSecretRef: string | null;
  readonly reasonCodes: readonly string[];
}

export interface SessionGovernor {
  decideSessionEstablishment(input: {
    existingSession?: AccessGrantSessionSnapshot | null;
    requestedSubjectRef?: string | null;
    requiredIdentityBindingRef?: string | null;
    requiredSubjectBindingVersionRef?: string | null;
    requestedAuthorityState: AccessGrantWritableAuthorityState;
    decidedAt: string;
  }): Promise<SessionEstablishmentDecisionSnapshot>;
}

export class LocalSessionGovernor implements SessionGovernor {
  private readonly idGenerator: BackboneIdGenerator;

  constructor(idGenerator: BackboneIdGenerator) {
    this.idGenerator = idGenerator;
  }

  async decideSessionEstablishment(input: {
    existingSession?: AccessGrantSessionSnapshot | null;
    requestedSubjectRef?: string | null;
    requiredIdentityBindingRef?: string | null;
    requiredSubjectBindingVersionRef?: string | null;
    requestedAuthorityState: AccessGrantWritableAuthorityState;
    decidedAt: string;
  }): Promise<SessionEstablishmentDecisionSnapshot> {
    const existingSession = input.existingSession ?? null;
    const requestedSubjectRef = optionalRef(input.requestedSubjectRef);
    const requiredIdentityBindingRef = optionalRef(input.requiredIdentityBindingRef);
    const requiredSubjectBindingVersionRef = optionalRef(input.requiredSubjectBindingVersionRef);
    const reasonCodes: string[] = [];
    let subjectComparisonState: SessionEstablishmentComparisonState;
    let decision: SessionEstablishmentDecisionValue = "create_fresh";
    let resolvedSessionRef: string | null = null;
    let sessionEpochRef: string | null = null;
    let csrfSecretRef: string | null = null;

    if (!existingSession) {
      subjectComparisonState = "no_session";
      reasonCodes.push("NO_EXISTING_SESSION");
    } else if (existingSession.sessionState === "anonymous") {
      subjectComparisonState = "anonymous_session";
      decision = "create_fresh";
      reasonCodes.push("ANONYMOUS_SESSION_MAY_NOT_BE_UPGRADED_IN_PLACE");
    } else if (
      existingSession.sessionState === "revoked" ||
      existingSession.sessionState === "expired_idle" ||
      existingSession.sessionState === "expired_absolute" ||
      existingSession.sessionState === "terminated"
    ) {
      subjectComparisonState = "stale_existing";
      decision = "bounded_recovery";
      reasonCodes.push("STALE_EXISTING_SESSION");
    } else if (
      requestedSubjectRef &&
      existingSession.subjectRef &&
      existingSession.subjectRef != requestedSubjectRef
    ) {
      subjectComparisonState = "different_subject";
      decision = "rotate_existing";
      reasonCodes.push("DIFFERENT_SUBJECT_REQUIRES_ROTATION");
    } else if (
      requiredSubjectBindingVersionRef &&
      existingSession.subjectBindingVersionRef &&
      existingSession.subjectBindingVersionRef !== requiredSubjectBindingVersionRef
    ) {
      subjectComparisonState = "same_subject_binding_advanced";
      decision = "rotate_existing";
      reasonCodes.push("SUBJECT_BINDING_VERSION_ADVANCED");
    } else if (
      requiredIdentityBindingRef &&
      existingSession.identityBindingRef !== requiredIdentityBindingRef
    ) {
      subjectComparisonState = "mismatched_secure_link_subject";
      decision = "rotate_existing";
      reasonCodes.push("IDENTITY_BINDING_MISMATCH");
    } else {
      subjectComparisonState = "same_subject_same_binding";
      decision = "reuse_existing";
      reasonCodes.push("SESSION_REUSE_ALLOWED");
      resolvedSessionRef = existingSession.sessionRef;
      sessionEpochRef = existingSession.sessionEpochRef;
      csrfSecretRef = existingSession.csrfSecretRef;
    }

    if (decision !== "reuse_existing") {
      const seed = nextIdentityAccessId(this.idGenerator, "session_establishment");
      resolvedSessionRef = `session_${seed}`;
      sessionEpochRef = `session_epoch_${seed}`;
      csrfSecretRef = sha256Hex(`csrf::${seed}`).slice(0, 32);
    }

    return {
      decisionId: nextIdentityAccessId(this.idGenerator, "session_establishment_decision"),
      existingSessionRef: existingSession?.sessionRef ?? null,
      resolvedSessionRef,
      subjectComparisonState,
      writableAuthorityState: input.requestedAuthorityState,
      decision,
      decidedAt: ensureIsoTimestamp(input.decidedAt, "decidedAt"),
      sessionEpochRef,
      csrfSecretRef,
      reasonCodes,
    };
  }
}

export type AuthBridgeRequiredSessionState =
  | "active"
  | "step_up_required"
  | "restricted"
  | "recovery_only";

export type AuthBridgeReturnAuthority =
  | "auth_only"
  | "claim_pending"
  | "writable_resume"
  | "recovery_only";

export interface AuthScopeBundleSnapshot {
  readonly scopeBundleId: string;
  readonly requestedScopes: readonly string[];
  readonly minimumClaims: readonly string[];
  readonly minimumAssuranceBand: string;
  readonly capabilityCeiling: string;
  readonly policyVersion: string;
  readonly consentCopyVariantRef: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface PostAuthReturnIntentSnapshot {
  readonly returnIntentId: string;
  readonly routeFamilyRef: string;
  readonly actionScope: AccessGrantActionScope;
  readonly routeTargetRef: string;
  readonly requestLineageRef: string;
  readonly draftRef: string | null;
  readonly submissionPromotionRecordRef: string | null;
  readonly draftContinuityEvidenceRef: string | null;
  readonly continuationAccessGrantRef: string | null;
  readonly fallbackRouteRef: string;
  readonly resumeContinuationRef: string | null;
  readonly subjectRef: string | null;
  readonly requiredIdentityBindingRef: string | null;
  readonly requiredCapabilityDecisionRef: string | null;
  readonly requiredPatientLinkRef: string | null;
  readonly requiredSessionState: AuthBridgeRequiredSessionState;
  readonly returnAuthority: AuthBridgeReturnAuthority;
  readonly sessionEpochRef: string | null;
  readonly subjectBindingVersionRef: string | null;
  readonly lineageFenceEpoch: number;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string | null;
  readonly minimumBridgeCapabilitiesRef: string | null;
  readonly channelReleaseFreezeState: string;
  readonly routeFreezeDispositionRef: string | null;
  readonly expiresAt: string;
  readonly intentState: "pending" | "consumed" | "superseded" | "recovered";
}

export interface AuthTransactionSnapshot {
  readonly transactionId: string;
  readonly stateHash: string;
  readonly nonceHash: string;
  readonly pkceVerifierRef: string;
  readonly scopeBundleRef: string;
  readonly capabilityIntentRef: string;
  readonly returnIntentRef: string;
  readonly requestContextHash: string;
  readonly transactionFenceEpoch: number;
  readonly callbackSettlementRef: string | null;
  readonly sessionEstablishmentDecisionRef: string | null;
  readonly maxAuthAgeSeconds: number;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly callbackReceivedAt: string | null;
  readonly completedAt: string | null;
  readonly errorRef: string | null;
  readonly transactionState:
    | "opened"
    | "awaiting_callback"
    | "callback_received"
    | "verified"
    | "consumed"
    | "denied"
    | "expired"
    | "replayed";
}

export interface AuthBridge {
  freezeAuthScopeBundle(
    input: Omit<AuthScopeBundleSnapshot, "scopeBundleId">,
  ): Promise<AuthScopeBundleSnapshot>;
  openPostAuthReturnIntent(
    input: Omit<PostAuthReturnIntentSnapshot, "returnIntentId" | "intentState">,
  ): Promise<PostAuthReturnIntentSnapshot>;
  openAuthTransaction(
    input: Omit<
      AuthTransactionSnapshot,
      | "transactionId"
      | "callbackSettlementRef"
      | "sessionEstablishmentDecisionRef"
      | "callbackReceivedAt"
      | "completedAt"
      | "errorRef"
      | "transactionState"
    >,
  ): Promise<AuthTransactionSnapshot>;
  settleAuthCallback(input: {
    transactionId: string;
    callbackSettlementRef?: string | null;
    sessionEstablishmentDecisionRef?: string | null;
    callbackReceivedAt: string;
    completedAt: string;
    verified: boolean;
    errorRef?: string | null;
  }): Promise<AuthTransactionSnapshot>;
}

export class LocalAuthBridge implements AuthBridge {
  private readonly idGenerator: BackboneIdGenerator;
  private readonly scopeBundles = new Map<string, AuthScopeBundleSnapshot>();
  private readonly returnIntents = new Map<string, PostAuthReturnIntentSnapshot>();
  private readonly transactions = new Map<string, AuthTransactionSnapshot>();

  constructor(idGenerator: BackboneIdGenerator) {
    this.idGenerator = idGenerator;
  }

  async freezeAuthScopeBundle(
    input: Omit<AuthScopeBundleSnapshot, "scopeBundleId">,
  ): Promise<AuthScopeBundleSnapshot> {
    const scopeBundle: AuthScopeBundleSnapshot = {
      scopeBundleId: nextIdentityAccessId(this.idGenerator, "auth_scope_bundle"),
      requestedScopes: uniqueSortedRefs(input.requestedScopes),
      minimumClaims: uniqueSortedRefs(input.minimumClaims),
      minimumAssuranceBand: requireRef(input.minimumAssuranceBand, "minimumAssuranceBand"),
      capabilityCeiling: requireRef(input.capabilityCeiling, "capabilityCeiling"),
      policyVersion: requireRef(input.policyVersion, "policyVersion"),
      consentCopyVariantRef: requireRef(input.consentCopyVariantRef, "consentCopyVariantRef"),
      createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
      expiresAt: ensureIsoTimestamp(input.expiresAt, "expiresAt"),
    };
    this.scopeBundles.set(scopeBundle.scopeBundleId, scopeBundle);
    return scopeBundle;
  }

  async openPostAuthReturnIntent(
    input: Omit<PostAuthReturnIntentSnapshot, "returnIntentId" | "intentState">,
  ): Promise<PostAuthReturnIntentSnapshot> {
    const returnIntent: PostAuthReturnIntentSnapshot = {
      returnIntentId: nextIdentityAccessId(this.idGenerator, "post_auth_return_intent"),
      routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
      actionScope: input.actionScope,
      routeTargetRef: requireRef(input.routeTargetRef, "routeTargetRef"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      draftRef: optionalRef(input.draftRef),
      submissionPromotionRecordRef: optionalRef(input.submissionPromotionRecordRef),
      draftContinuityEvidenceRef: optionalRef(input.draftContinuityEvidenceRef),
      continuationAccessGrantRef: optionalRef(input.continuationAccessGrantRef),
      fallbackRouteRef: requireRef(input.fallbackRouteRef, "fallbackRouteRef"),
      resumeContinuationRef: optionalRef(input.resumeContinuationRef),
      subjectRef: optionalRef(input.subjectRef),
      requiredIdentityBindingRef: optionalRef(input.requiredIdentityBindingRef),
      requiredCapabilityDecisionRef: optionalRef(input.requiredCapabilityDecisionRef),
      requiredPatientLinkRef: optionalRef(input.requiredPatientLinkRef),
      requiredSessionState: input.requiredSessionState,
      returnAuthority: input.returnAuthority,
      sessionEpochRef: optionalRef(input.sessionEpochRef),
      subjectBindingVersionRef: optionalRef(input.subjectBindingVersionRef),
      lineageFenceEpoch: input.lineageFenceEpoch,
      manifestVersionRef: requireRef(input.manifestVersionRef, "manifestVersionRef"),
      releaseApprovalFreezeRef: optionalRef(input.releaseApprovalFreezeRef),
      minimumBridgeCapabilitiesRef: optionalRef(input.minimumBridgeCapabilitiesRef),
      channelReleaseFreezeState: requireRef(
        input.channelReleaseFreezeState,
        "channelReleaseFreezeState",
      ),
      routeFreezeDispositionRef: optionalRef(input.routeFreezeDispositionRef),
      expiresAt: ensureIsoTimestamp(input.expiresAt, "expiresAt"),
      intentState: "pending",
    };
    this.returnIntents.set(returnIntent.returnIntentId, returnIntent);
    return returnIntent;
  }

  async openAuthTransaction(
    input: Omit<
      AuthTransactionSnapshot,
      | "transactionId"
      | "callbackSettlementRef"
      | "sessionEstablishmentDecisionRef"
      | "callbackReceivedAt"
      | "completedAt"
      | "errorRef"
      | "transactionState"
    >,
  ): Promise<AuthTransactionSnapshot> {
    const transaction: AuthTransactionSnapshot = {
      transactionId: nextIdentityAccessId(this.idGenerator, "auth_transaction"),
      stateHash: requireRef(input.stateHash, "stateHash"),
      nonceHash: requireRef(input.nonceHash, "nonceHash"),
      pkceVerifierRef: requireRef(input.pkceVerifierRef, "pkceVerifierRef"),
      scopeBundleRef: requireRef(input.scopeBundleRef, "scopeBundleRef"),
      capabilityIntentRef: requireRef(input.capabilityIntentRef, "capabilityIntentRef"),
      returnIntentRef: requireRef(input.returnIntentRef, "returnIntentRef"),
      requestContextHash: requireRef(input.requestContextHash, "requestContextHash"),
      transactionFenceEpoch: input.transactionFenceEpoch,
      callbackSettlementRef: null,
      sessionEstablishmentDecisionRef: null,
      maxAuthAgeSeconds: input.maxAuthAgeSeconds,
      startedAt: ensureIsoTimestamp(input.startedAt, "startedAt"),
      expiresAt: ensureIsoTimestamp(input.expiresAt, "expiresAt"),
      callbackReceivedAt: null,
      completedAt: null,
      errorRef: null,
      transactionState: "awaiting_callback",
    };
    this.transactions.set(transaction.transactionId, transaction);
    return transaction;
  }

  async settleAuthCallback(input: {
    transactionId: string;
    callbackSettlementRef?: string | null;
    sessionEstablishmentDecisionRef?: string | null;
    callbackReceivedAt: string;
    completedAt: string;
    verified: boolean;
    errorRef?: string | null;
  }): Promise<AuthTransactionSnapshot> {
    const current = this.transactions.get(input.transactionId);
    invariant(
      current,
      "AUTH_TRANSACTION_NOT_FOUND",
      `AuthTransaction ${input.transactionId} was not found.`,
    );
    if (current.transactionState === "consumed" || current.transactionState === "verified") {
      const replayed: AuthTransactionSnapshot = {
        ...current,
        transactionState: "replayed",
      };
      this.transactions.set(replayed.transactionId, replayed);
      return replayed;
    }
    const settled: AuthTransactionSnapshot = {
      ...current,
      callbackSettlementRef: optionalRef(input.callbackSettlementRef),
      sessionEstablishmentDecisionRef: optionalRef(input.sessionEstablishmentDecisionRef),
      callbackReceivedAt: ensureIsoTimestamp(input.callbackReceivedAt, "callbackReceivedAt"),
      completedAt: ensureIsoTimestamp(input.completedAt, "completedAt"),
      errorRef: optionalRef(input.errorRef),
      transactionState: input.verified ? "verified" : "denied",
    };
    this.transactions.set(settled.transactionId, settled);
    return settled;
  }
}

export type IdentityBindingState =
  | "candidate"
  | "provisional_verified"
  | "ambiguous"
  | "verified_patient"
  | "correction_pending"
  | "corrected"
  | "revoked";

export type IdentityOwnershipState =
  | "unclaimed"
  | "claim_pending"
  | "claimed"
  | "blocked_other_subject";

export type IdentityBindingDecisionClass =
  | "candidate_refresh"
  | "provisional_verify"
  | "verified_bind"
  | "claim_confirmed"
  | "correction_applied"
  | "revoked";

export type IdentityAssuranceLevel = "none" | "low" | "medium" | "high";
export type ConfidenceModelState = "calibrated" | "drift_review" | "out_of_domain";

export interface IdentityBindingSnapshot {
  bindingId: string;
  episodeId: string;
  requestId: string;
  subjectRef: string;
  patientRef: string | null;
  runnerUpPatientRef: string | null;
  candidatePatientRefs: readonly string[];
  candidateSetRef: string;
  bindingState: IdentityBindingState;
  ownershipState: IdentityOwnershipState;
  decisionClass: IdentityBindingDecisionClass;
  assuranceLevel: IdentityAssuranceLevel;
  verifiedContactRouteRef: string | null;
  matchEvidenceRef: string;
  linkProbability: number;
  linkProbabilityLowerBound: number;
  runnerUpProbabilityUpperBound: number;
  subjectProofProbabilityLowerBound: number;
  gapLogit: number;
  calibrationVersionRef: string;
  confidenceModelState: ConfidenceModelState;
  bindingVersion: number;
  bindingAuthorityRef: string;
  stepUpMethod: string | null;
  supersedesBindingRef: string | null;
  supersededByRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedIdentityBindingRow extends IdentityBindingSnapshot {
  aggregateType: "IdentityBinding";
  persistenceSchemaVersion: 1;
}

export class IdentityBindingDocument {
  private readonly snapshot: IdentityBindingSnapshot;

  private constructor(snapshot: IdentityBindingSnapshot) {
    this.snapshot = IdentityBindingDocument.normalize(snapshot);
  }

  static create(input: Omit<IdentityBindingSnapshot, "version">): IdentityBindingDocument {
    return new IdentityBindingDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: IdentityBindingSnapshot): IdentityBindingDocument {
    return new IdentityBindingDocument(snapshot);
  }

  private static normalize(snapshot: IdentityBindingSnapshot): IdentityBindingSnapshot {
    invariant(
      snapshot.bindingVersion >= 1,
      "INVALID_BINDING_VERSION",
      "IdentityBinding.bindingVersion must be >= 1.",
    );
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "IdentityBinding.version must be >= 1.",
    );
    assertProbability(snapshot.linkProbability, "linkProbability");
    assertProbability(snapshot.linkProbabilityLowerBound, "linkProbabilityLowerBound");
    assertProbability(snapshot.runnerUpProbabilityUpperBound, "runnerUpProbabilityUpperBound");
    assertProbability(
      snapshot.subjectProofProbabilityLowerBound,
      "subjectProofProbabilityLowerBound",
    );
    invariant(
      snapshot.linkProbabilityLowerBound <= snapshot.linkProbability,
      "LINK_PROBABILITY_ORDERING_INVALID",
      "IdentityBinding.linkProbabilityLowerBound cannot exceed linkProbability.",
    );
    invariant(
      snapshot.runnerUpPatientRef === null || snapshot.runnerUpPatientRef !== snapshot.patientRef,
      "RUNNER_UP_PATIENT_COLLIDES_WITH_PATIENT",
      "runnerUpPatientRef must differ from patientRef.",
    );
    invariant(
      snapshot.supersedesBindingRef !== snapshot.bindingId &&
        snapshot.supersededByRef !== snapshot.bindingId,
      "BINDING_SELF_REFERENCE_FORBIDDEN",
      "IdentityBinding cannot supersede itself.",
    );
    invariant(
      snapshot.bindingVersion === 1 ? snapshot.supersedesBindingRef === null : true,
      "ROOT_BINDING_SUPERSEDES_FORBIDDEN",
      "The first IdentityBinding version cannot supersede another binding.",
    );
    if (
      snapshot.bindingState === "verified_patient" ||
      snapshot.bindingState === "corrected" ||
      snapshot.ownershipState === "claimed"
    ) {
      invariant(
        snapshot.patientRef !== null,
        "BOUND_PATIENT_REQUIRED",
        "Verified, corrected, or claimed identity states require patientRef.",
      );
    }
    if (snapshot.decisionClass === "claim_confirmed") {
      invariant(
        snapshot.ownershipState === "claimed" && snapshot.patientRef !== null,
        "CLAIM_DECISION_REQUIRES_CLAIMED_OWNERSHIP",
        "claim_confirmed requires a claimed ownership state and patientRef.",
      );
    }
    if (snapshot.decisionClass === "verified_bind") {
      invariant(
        snapshot.bindingState === "verified_patient" && snapshot.patientRef !== null,
        "VERIFIED_BIND_REQUIRES_VERIFIED_PATIENT",
        "verified_bind requires bindingState verified_patient and patientRef.",
      );
    }
    if (snapshot.decisionClass === "provisional_verify") {
      invariant(
        snapshot.bindingState === "provisional_verified",
        "PROVISIONAL_VERIFY_REQUIRES_PROVISIONAL_STATE",
        "provisional_verify requires bindingState provisional_verified.",
      );
    }
    if (snapshot.decisionClass === "candidate_refresh") {
      invariant(
        snapshot.bindingState === "candidate" || snapshot.bindingState === "ambiguous",
        "CANDIDATE_REFRESH_REQUIRES_CANDIDATE_OR_AMBIGUOUS",
        "candidate_refresh requires candidate or ambiguous state.",
      );
    }
    if (snapshot.decisionClass === "correction_applied") {
      invariant(
        snapshot.bindingState === "corrected",
        "CORRECTION_APPLIED_REQUIRES_CORRECTED_STATE",
        "correction_applied requires bindingState corrected.",
      );
    }
    if (snapshot.decisionClass === "revoked") {
      invariant(
        snapshot.bindingState === "revoked",
        "REVOKED_DECISION_REQUIRES_REVOKED_STATE",
        "revoked requires bindingState revoked.",
      );
    }
    return {
      ...snapshot,
      patientRef: optionalRef(snapshot.patientRef),
      runnerUpPatientRef: optionalRef(snapshot.runnerUpPatientRef),
      verifiedContactRouteRef: optionalRef(snapshot.verifiedContactRouteRef),
      stepUpMethod: optionalRef(snapshot.stepUpMethod),
      supersedesBindingRef: optionalRef(snapshot.supersedesBindingRef),
      supersededByRef: optionalRef(snapshot.supersededByRef),
      candidatePatientRefs: uniqueSortedRefs(snapshot.candidatePatientRefs),
    };
  }

  get bindingId(): string {
    return this.snapshot.bindingId;
  }

  get bindingVersion(): number {
    return this.snapshot.bindingVersion;
  }

  get requestId(): string {
    return this.snapshot.requestId;
  }

  get episodeId(): string {
    return this.snapshot.episodeId;
  }

  get subjectRef(): string {
    return this.snapshot.subjectRef;
  }

  get patientRef(): string | null {
    return this.snapshot.patientRef;
  }

  get supersededByRef(): string | null {
    return this.snapshot.supersededByRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): IdentityBindingSnapshot {
    return {
      ...this.snapshot,
      candidatePatientRefs: [...this.snapshot.candidatePatientRefs],
    };
  }

  markSuperseded(input: { supersededByRef: string; updatedAt: string }): IdentityBindingDocument {
    invariant(
      this.snapshot.supersededByRef === null ||
        this.snapshot.supersededByRef === input.supersededByRef,
      "BINDING_ALREADY_SUPERSEDED",
      "IdentityBinding supersession cannot be rewritten to a different successor.",
    );
    if (this.snapshot.supersededByRef === input.supersededByRef) {
      return this;
    }
    return new IdentityBindingDocument({
      ...this.snapshot,
      supersededByRef: requireRef(input.supersededByRef, "supersededByRef"),
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type PatientLinkState =
  | "none"
  | "candidate"
  | "provisional_verified"
  | "verified_patient"
  | "ambiguous"
  | "correction_pending"
  | "revoked";

export interface PatientLinkSnapshot {
  patientLinkId: string;
  subjectRef: string;
  patientRef: string | null;
  identityBindingRef: string;
  linkState: PatientLinkState;
  linkProbability: number;
  linkProbabilityLowerBound: number;
  runnerUpProbabilityUpperBound: number;
  subjectProofProbabilityLowerBound: number;
  gapLogit: number;
  calibrationVersionRef: string;
  confidenceModelState: ConfidenceModelState;
  bindingVersionRef: string;
  provenanceRef: string;
  evaluatedAt: string;
  expiresAt: string;
  version: number;
}

export interface PersistedPatientLinkRow extends PatientLinkSnapshot {
  aggregateType: "PatientLink";
  persistenceSchemaVersion: 1;
}

export class PatientLinkDocument {
  private readonly snapshot: PatientLinkSnapshot;

  private constructor(snapshot: PatientLinkSnapshot) {
    this.snapshot = PatientLinkDocument.normalize(snapshot);
  }

  static create(input: Omit<PatientLinkSnapshot, "version">): PatientLinkDocument {
    return new PatientLinkDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: PatientLinkSnapshot): PatientLinkDocument {
    return new PatientLinkDocument(snapshot);
  }

  static deriveFromBinding(input: {
    patientLinkId: string;
    binding: IdentityBindingDocument;
    provenanceRef: string;
    evaluatedAt: string;
    expiresAt: string;
  }): PatientLinkDocument {
    const binding = input.binding.toSnapshot();
    const linkState: PatientLinkState =
      binding.bindingState === "corrected"
        ? "correction_pending"
        : binding.bindingState === "revoked"
          ? "revoked"
          : binding.bindingState;
    return PatientLinkDocument.create({
      patientLinkId: requireRef(input.patientLinkId, "patientLinkId"),
      subjectRef: binding.subjectRef,
      patientRef: binding.patientRef ?? binding.candidatePatientRefs[0] ?? null,
      identityBindingRef: binding.bindingId,
      linkState,
      linkProbability: binding.linkProbability,
      linkProbabilityLowerBound: binding.linkProbabilityLowerBound,
      runnerUpProbabilityUpperBound: binding.runnerUpProbabilityUpperBound,
      subjectProofProbabilityLowerBound: binding.subjectProofProbabilityLowerBound,
      gapLogit: binding.gapLogit,
      calibrationVersionRef: binding.calibrationVersionRef,
      confidenceModelState: binding.confidenceModelState,
      bindingVersionRef: bindingVersionRef(binding.bindingId, binding.bindingVersion),
      provenanceRef: requireRef(input.provenanceRef, "provenanceRef"),
      evaluatedAt: input.evaluatedAt,
      expiresAt: input.expiresAt,
    });
  }

  private static normalize(snapshot: PatientLinkSnapshot): PatientLinkSnapshot {
    invariant(snapshot.version >= 1, "INVALID_ROW_VERSION", "PatientLink.version must be >= 1.");
    assertProbability(snapshot.linkProbability, "linkProbability");
    assertProbability(snapshot.linkProbabilityLowerBound, "linkProbabilityLowerBound");
    assertProbability(snapshot.runnerUpProbabilityUpperBound, "runnerUpProbabilityUpperBound");
    assertProbability(
      snapshot.subjectProofProbabilityLowerBound,
      "subjectProofProbabilityLowerBound",
    );
    if (snapshot.linkState === "verified_patient") {
      invariant(
        snapshot.patientRef !== null,
        "PATIENT_LINK_VERIFIED_REQUIRES_PATIENT",
        "Verified PatientLink requires patientRef.",
      );
    }
    return {
      ...snapshot,
      patientRef: optionalRef(snapshot.patientRef),
    };
  }

  get patientLinkId(): string {
    return this.snapshot.patientLinkId;
  }

  get identityBindingRef(): string {
    return this.snapshot.identityBindingRef;
  }

  get subjectRef(): string {
    return this.snapshot.subjectRef;
  }

  get patientRef(): string | null {
    return this.snapshot.patientRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): PatientLinkSnapshot {
    return { ...this.snapshot };
  }
}

export type AccessGrantFamily =
  | "draft_resume_minimal"
  | "public_status_minimal"
  | "claim_step_up"
  | "continuation_seeded_verified"
  | "continuation_challenge"
  | "transaction_action_minimal"
  | "support_recovery_minimal";

export type AccessGrantActionScope =
  | "envelope_resume"
  | "status_view"
  | "claim"
  | "respond_more_info"
  | "waitlist_offer"
  | "alternative_offer"
  | "appointment_manage_entry"
  | "pharmacy_status_entry"
  | "callback_status_entry"
  | "callback_response"
  | "message_thread_entry"
  | "message_reply"
  | "contact_route_repair"
  | "secure_resume";

export type AccessGrantLineageScope = "envelope" | "request" | "episode";
export type AccessGrantPhiExposureClass = "none" | "minimal" | "scoped";
export type AccessGrantReplayPolicy = "one_time" | "rotating" | "multi_use_minimal";
export type AccessGrantState =
  | "live"
  | "redeeming"
  | "redeemed"
  | "rotated"
  | "superseded"
  | "revoked"
  | "expired";

export type AccessGrantSubjectBindingMode = "none" | "soft_subject" | "hard_subject";
export type AccessGrantValidatorFamily =
  | "draft_resume_minimal_validator"
  | "public_status_minimal_validator"
  | "claim_step_up_validator"
  | "continuation_seeded_verified_validator"
  | "continuation_challenge_validator"
  | "transaction_action_minimal_validator"
  | "support_recovery_minimal_validator";

export interface AccessGrantFamilyPolicy {
  readonly grantFamily: AccessGrantFamily;
  readonly validatorFamily: AccessGrantValidatorFamily;
  readonly replayPolicy: AccessGrantReplayPolicy;
  readonly defaultMaxRedemptions: number;
  readonly allowedActionScopes: readonly AccessGrantActionScope[];
  readonly maxPhiExposureClass: AccessGrantPhiExposureClass;
}

export const accessGrantFamilyPolicies = {
  draft_resume_minimal: {
    grantFamily: "draft_resume_minimal",
    validatorFamily: "draft_resume_minimal_validator",
    replayPolicy: "one_time",
    defaultMaxRedemptions: 1,
    allowedActionScopes: ["envelope_resume", "secure_resume"],
    maxPhiExposureClass: "minimal",
  },
  public_status_minimal: {
    grantFamily: "public_status_minimal",
    validatorFamily: "public_status_minimal_validator",
    replayPolicy: "multi_use_minimal",
    defaultMaxRedemptions: 3,
    allowedActionScopes: ["status_view"],
    maxPhiExposureClass: "minimal",
  },
  claim_step_up: {
    grantFamily: "claim_step_up",
    validatorFamily: "claim_step_up_validator",
    replayPolicy: "one_time",
    defaultMaxRedemptions: 1,
    allowedActionScopes: ["claim"],
    maxPhiExposureClass: "none",
  },
  continuation_seeded_verified: {
    grantFamily: "continuation_seeded_verified",
    validatorFamily: "continuation_seeded_verified_validator",
    replayPolicy: "one_time",
    defaultMaxRedemptions: 1,
    allowedActionScopes: ["secure_resume", "envelope_resume"],
    maxPhiExposureClass: "scoped",
  },
  continuation_challenge: {
    grantFamily: "continuation_challenge",
    validatorFamily: "continuation_challenge_validator",
    replayPolicy: "one_time",
    defaultMaxRedemptions: 1,
    allowedActionScopes: ["secure_resume", "contact_route_repair"],
    maxPhiExposureClass: "none",
  },
  transaction_action_minimal: {
    grantFamily: "transaction_action_minimal",
    validatorFamily: "transaction_action_minimal_validator",
    replayPolicy: "one_time",
    defaultMaxRedemptions: 1,
    allowedActionScopes: [
      "respond_more_info",
      "waitlist_offer",
      "alternative_offer",
      "appointment_manage_entry",
      "pharmacy_status_entry",
      "callback_status_entry",
      "callback_response",
      "message_thread_entry",
      "message_reply",
      "contact_route_repair",
    ],
    maxPhiExposureClass: "minimal",
  },
  support_recovery_minimal: {
    grantFamily: "support_recovery_minimal",
    validatorFamily: "support_recovery_minimal_validator",
    replayPolicy: "rotating",
    defaultMaxRedemptions: 1,
    allowedActionScopes: [
      "status_view",
      "contact_route_repair",
      "secure_resume",
      "appointment_manage_entry",
      "pharmacy_status_entry",
      "callback_status_entry",
      "message_thread_entry",
    ],
    maxPhiExposureClass: "minimal",
  },
} as const satisfies Record<AccessGrantFamily, AccessGrantFamilyPolicy>;

function phiExposureRank(value: AccessGrantPhiExposureClass): number {
  switch (value) {
    case "none":
      return 0;
    case "minimal":
      return 1;
    case "scoped":
      return 2;
  }
}

export function resolveGrantPolicy(grantFamily: AccessGrantFamily): AccessGrantFamilyPolicy {
  return accessGrantFamilyPolicies[grantFamily];
}

export const accessGrantUseCasePolicies = {
  draft_resume: {
    useCase: "draft_resume",
    grantFamily: "draft_resume_minimal",
    defaultActionScope: "envelope_resume",
    allowedActionScopes: ["envelope_resume", "secure_resume"],
    defaultRouteFamilyRef: "rf_intake_self_service",
    allowedRouteFamilyRefs: ["rf_intake_self_service", "rf_patient_secure_link_recovery"],
    lineageScope: "envelope",
    phiExposureClass: "minimal",
    subjectBindingMode: "none",
    sessionRequirement: "fresh_or_rotated",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 45,
    supersessionTriggers: ["draft_promoted", "logout", "manual_revoke", "route_drift"],
    rationale:
      "Draft resume stays envelope-bound and minimal until governed promotion or stronger identity proof occurs.",
  },
  request_claim: {
    useCase: "request_claim",
    grantFamily: "claim_step_up",
    defaultActionScope: "claim",
    allowedActionScopes: ["claim"],
    defaultRouteFamilyRef: "rf_patient_secure_link_recovery",
    allowedRouteFamilyRefs: ["rf_patient_secure_link_recovery"],
    lineageScope: "request",
    phiExposureClass: "none",
    subjectBindingMode: "soft_subject",
    sessionRequirement: "fresh_or_rotated",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 20,
    supersessionTriggers: ["claim_completed", "logout", "identity_repair", "route_drift"],
    rationale:
      "Claim grants may guide the user into subject proof but may not expose PHI before binding succeeds.",
  },
  secure_continuation: {
    useCase: "secure_continuation",
    grantFamily: "continuation_seeded_verified",
    defaultActionScope: "secure_resume",
    allowedActionScopes: ["secure_resume", "envelope_resume"],
    defaultRouteFamilyRef: "rf_patient_secure_link_recovery",
    allowedRouteFamilyRefs: ["rf_patient_secure_link_recovery"],
    lineageScope: "request",
    phiExposureClass: "scoped",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "fresh_or_rotated",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 30,
    supersessionTriggers: ["rotation", "logout", "identity_repair", "route_drift"],
    rationale:
      "Verified continuation grants bind one current lineage and must rotate immediately on drift or stronger proof demand.",
  },
  callback_reply: {
    useCase: "callback_reply",
    grantFamily: "transaction_action_minimal",
    defaultActionScope: "callback_response",
    allowedActionScopes: ["callback_status_entry", "callback_response"],
    defaultRouteFamilyRef: "rf_patient_messages",
    allowedRouteFamilyRefs: ["rf_patient_messages", "rf_patient_requests"],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "bound_session",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 30,
    supersessionTriggers: ["rotation", "identity_repair", "route_drift", "logout"],
    rationale:
      "Callback reply grants are single-purpose transaction grants and may not silently authorize adjacent communication actions.",
  },
  message_reply: {
    useCase: "message_reply",
    grantFamily: "transaction_action_minimal",
    defaultActionScope: "message_reply",
    allowedActionScopes: ["message_thread_entry", "message_reply"],
    defaultRouteFamilyRef: "rf_patient_messages",
    allowedRouteFamilyRefs: ["rf_patient_messages"],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "bound_session",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 30,
    supersessionTriggers: ["rotation", "identity_repair", "route_drift", "logout"],
    rationale:
      "Message reply must reuse canonical communication scope and may not drift into generic request visibility.",
  },
  booking_manage: {
    useCase: "booking_manage",
    grantFamily: "transaction_action_minimal",
    defaultActionScope: "appointment_manage_entry",
    allowedActionScopes: ["appointment_manage_entry"],
    defaultRouteFamilyRef: "rf_patient_appointments",
    allowedRouteFamilyRefs: ["rf_patient_appointments"],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "bound_session",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 30,
    supersessionTriggers: ["rotation", "identity_repair", "route_drift", "logout"],
    rationale:
      "Booking manage grants stay bound to one booking-capable patient shell and the current governing tuple.",
  },
  waitlist_action: {
    useCase: "waitlist_action",
    grantFamily: "transaction_action_minimal",
    defaultActionScope: "waitlist_offer",
    allowedActionScopes: ["waitlist_offer"],
    defaultRouteFamilyRef: "rf_patient_appointments",
    allowedRouteFamilyRefs: ["rf_patient_appointments"],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "bound_session",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 20,
    supersessionTriggers: ["rotation", "route_drift", "logout", "manual_revoke"],
    rationale:
      "Waitlist actions are tightly time-bound and must expire or rotate once the current offer tuple changes.",
  },
  network_alternative_choice: {
    useCase: "network_alternative_choice",
    grantFamily: "transaction_action_minimal",
    defaultActionScope: "alternative_offer",
    allowedActionScopes: ["alternative_offer"],
    defaultRouteFamilyRef: "rf_patient_appointments",
    allowedRouteFamilyRefs: ["rf_patient_appointments"],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "bound_session",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 20,
    supersessionTriggers: ["rotation", "route_drift", "logout", "manual_revoke"],
    rationale:
      "Alternative-choice grants remain single-purpose and must narrow to the current ranked offer chain only.",
  },
  pharmacy_choice: {
    useCase: "pharmacy_choice",
    grantFamily: "transaction_action_minimal",
    defaultActionScope: "pharmacy_status_entry",
    allowedActionScopes: ["pharmacy_status_entry"],
    defaultRouteFamilyRef: "rf_patient_requests",
    allowedRouteFamilyRefs: ["rf_patient_requests", "rf_pharmacy_console"],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "bound_session",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 30,
    supersessionTriggers: ["rotation", "identity_repair", "route_drift", "logout"],
    rationale:
      "Pharmacy-choice entry grants stay on the current request-linked pharmacy tuple and cannot widen into broader booking or hub flows.",
  },
  support_reissue: {
    useCase: "support_reissue",
    grantFamily: "support_recovery_minimal",
    defaultActionScope: "secure_resume",
    allowedActionScopes: [
      "status_view",
      "contact_route_repair",
      "secure_resume",
      "appointment_manage_entry",
      "pharmacy_status_entry",
      "callback_status_entry",
      "message_thread_entry",
    ],
    defaultRouteFamilyRef: "rf_patient_secure_link_recovery",
    allowedRouteFamilyRefs: [
      "rf_patient_secure_link_recovery",
      "rf_patient_appointments",
      "rf_patient_messages",
      "rf_patient_requests",
    ],
    lineageScope: "request",
    phiExposureClass: "minimal",
    subjectBindingMode: "hard_subject",
    sessionRequirement: "fresh_or_rotated",
    issuanceOutcome: "issued",
    defaultExpiryMinutes: 30,
    supersessionTriggers: ["secure_link_reissue", "identity_repair", "route_drift", "logout"],
    rationale:
      "Support reissue may only recreate the immediately prior minimal scope under the current authoritative tuple.",
  },
  recover_only: {
    useCase: "recover_only",
    grantFamily: null,
    defaultActionScope: null,
    allowedActionScopes: [],
    defaultRouteFamilyRef: "rf_patient_secure_link_recovery",
    allowedRouteFamilyRefs: ["rf_patient_secure_link_recovery"],
    lineageScope: "request",
    phiExposureClass: "none",
    subjectBindingMode: "none",
    sessionRequirement: "none",
    issuanceOutcome: "recover_only",
    defaultExpiryMinutes: 0,
    supersessionTriggers: [],
    rationale:
      "Recover-only is an explicit no-grant routing outcome for legacy, stale, or drifted continuity that must not materialize a redeemable link.",
  },
} as const satisfies Record<AccessGrantUseCase, AccessGrantUseCasePolicy>;

export function resolveAccessGrantUseCasePolicy(
  useCase: AccessGrantUseCase,
): AccessGrantUseCasePolicy {
  return accessGrantUseCasePolicies[useCase];
}

export const accessGrantParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_AUTH_BRIDGE_CALLBACK_PROVIDER",
  "PARALLEL_INTERFACE_GAP_SESSION_COOKIE_RUNTIME",
] as const;

export function hashAccessGrantToken(input: {
  presentedToken: string;
  tokenKeyVersionRef: string;
  validatorFamily: AccessGrantValidatorFamily;
}): string {
  return sha256Hex(
    `${requireRef(input.tokenKeyVersionRef, "tokenKeyVersionRef")}::${input.validatorFamily}::${requireRef(input.presentedToken, "presentedToken")}`,
  );
}

export interface AccessGrantScopeEnvelopeSnapshot {
  scopeEnvelopeId: string;
  grantFamily: AccessGrantFamily;
  actionScope: AccessGrantActionScope;
  lineageScope: AccessGrantLineageScope;
  routeFamilyRef: string;
  governingObjectRef: string;
  governingVersionRef: string;
  phiExposureClass: AccessGrantPhiExposureClass;
  issuedRouteIntentBindingRef: string | null;
  requiredIdentityBindingRef: string | null;
  requiredReleaseApprovalFreezeRef: string | null;
  requiredChannelReleaseFreezeRef: string | null;
  requiredAudienceSurfaceRuntimeBindingRef: string | null;
  minimumBridgeCapabilitiesRef: string | null;
  requiredAssuranceSliceTrustRefs: readonly string[];
  recoveryRouteRef: string;
  scopeHash: string;
  createdAt: string;
  version: number;
}

export interface PersistedAccessGrantScopeEnvelopeRow extends AccessGrantScopeEnvelopeSnapshot {
  aggregateType: "AccessGrantScopeEnvelope";
  persistenceSchemaVersion: 1;
}

function computeScopeEnvelopeHash(
  snapshot: Omit<AccessGrantScopeEnvelopeSnapshot, "scopeHash" | "version">,
): string {
  return sha256Hex(
    stableStringify({
      grantFamily: snapshot.grantFamily,
      actionScope: snapshot.actionScope,
      lineageScope: snapshot.lineageScope,
      routeFamilyRef: snapshot.routeFamilyRef,
      governingObjectRef: snapshot.governingObjectRef,
      governingVersionRef: snapshot.governingVersionRef,
      phiExposureClass: snapshot.phiExposureClass,
      issuedRouteIntentBindingRef: optionalRef(snapshot.issuedRouteIntentBindingRef),
      requiredIdentityBindingRef: optionalRef(snapshot.requiredIdentityBindingRef),
      requiredReleaseApprovalFreezeRef: optionalRef(snapshot.requiredReleaseApprovalFreezeRef),
      requiredChannelReleaseFreezeRef: optionalRef(snapshot.requiredChannelReleaseFreezeRef),
      requiredAudienceSurfaceRuntimeBindingRef: optionalRef(
        snapshot.requiredAudienceSurfaceRuntimeBindingRef,
      ),
      minimumBridgeCapabilitiesRef: optionalRef(snapshot.minimumBridgeCapabilitiesRef),
      requiredAssuranceSliceTrustRefs: uniqueSortedRefs(snapshot.requiredAssuranceSliceTrustRefs),
      recoveryRouteRef: snapshot.recoveryRouteRef,
    }),
  );
}

export class AccessGrantScopeEnvelopeDocument {
  private readonly snapshot: AccessGrantScopeEnvelopeSnapshot;

  private constructor(snapshot: AccessGrantScopeEnvelopeSnapshot) {
    this.snapshot = AccessGrantScopeEnvelopeDocument.normalize(snapshot);
  }

  static create(
    input: Omit<AccessGrantScopeEnvelopeSnapshot, "scopeHash" | "version">,
  ): AccessGrantScopeEnvelopeDocument {
    return new AccessGrantScopeEnvelopeDocument({
      ...input,
      scopeHash: computeScopeEnvelopeHash(input),
      version: 1,
    });
  }

  static hydrate(snapshot: AccessGrantScopeEnvelopeSnapshot): AccessGrantScopeEnvelopeDocument {
    return new AccessGrantScopeEnvelopeDocument(snapshot);
  }

  private static normalize(
    snapshot: AccessGrantScopeEnvelopeSnapshot,
  ): AccessGrantScopeEnvelopeSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_SCOPE_ENVELOPE_VERSION",
      "AccessGrantScopeEnvelope.version must be >= 1.",
    );
    const expectedHash = computeScopeEnvelopeHash({
      scopeEnvelopeId: snapshot.scopeEnvelopeId,
      grantFamily: snapshot.grantFamily,
      actionScope: snapshot.actionScope,
      lineageScope: snapshot.lineageScope,
      routeFamilyRef: snapshot.routeFamilyRef,
      governingObjectRef: snapshot.governingObjectRef,
      governingVersionRef: snapshot.governingVersionRef,
      phiExposureClass: snapshot.phiExposureClass,
      issuedRouteIntentBindingRef: snapshot.issuedRouteIntentBindingRef,
      requiredIdentityBindingRef: snapshot.requiredIdentityBindingRef,
      requiredReleaseApprovalFreezeRef: snapshot.requiredReleaseApprovalFreezeRef,
      requiredChannelReleaseFreezeRef: snapshot.requiredChannelReleaseFreezeRef,
      requiredAudienceSurfaceRuntimeBindingRef: snapshot.requiredAudienceSurfaceRuntimeBindingRef,
      minimumBridgeCapabilitiesRef: snapshot.minimumBridgeCapabilitiesRef,
      requiredAssuranceSliceTrustRefs: snapshot.requiredAssuranceSliceTrustRefs,
      recoveryRouteRef: snapshot.recoveryRouteRef,
      createdAt: snapshot.createdAt,
    });
    invariant(
      snapshot.scopeHash === expectedHash,
      "SCOPE_ENVELOPE_HASH_DRIFT",
      "AccessGrantScopeEnvelope.scopeHash must match its immutable contract.",
    );
    return {
      ...snapshot,
      issuedRouteIntentBindingRef: optionalRef(snapshot.issuedRouteIntentBindingRef),
      requiredIdentityBindingRef: optionalRef(snapshot.requiredIdentityBindingRef),
      requiredReleaseApprovalFreezeRef: optionalRef(snapshot.requiredReleaseApprovalFreezeRef),
      requiredChannelReleaseFreezeRef: optionalRef(snapshot.requiredChannelReleaseFreezeRef),
      requiredAudienceSurfaceRuntimeBindingRef: optionalRef(
        snapshot.requiredAudienceSurfaceRuntimeBindingRef,
      ),
      minimumBridgeCapabilitiesRef: optionalRef(snapshot.minimumBridgeCapabilitiesRef),
      requiredAssuranceSliceTrustRefs: uniqueSortedRefs(snapshot.requiredAssuranceSliceTrustRefs),
    };
  }

  get scopeEnvelopeId(): string {
    return this.snapshot.scopeEnvelopeId;
  }

  get scopeHash(): string {
    return this.snapshot.scopeHash;
  }

  get grantFamily(): AccessGrantFamily {
    return this.snapshot.grantFamily;
  }

  get actionScope(): AccessGrantActionScope {
    return this.snapshot.actionScope;
  }

  get routeFamilyRef(): string {
    return this.snapshot.routeFamilyRef;
  }

  get lineageScope(): AccessGrantLineageScope {
    return this.snapshot.lineageScope;
  }

  get governingObjectRef(): string {
    return this.snapshot.governingObjectRef;
  }

  toSnapshot(): AccessGrantScopeEnvelopeSnapshot {
    return {
      ...this.snapshot,
      requiredAssuranceSliceTrustRefs: [...this.snapshot.requiredAssuranceSliceTrustRefs],
    };
  }
}

export interface AccessGrantSnapshot {
  grantId: string;
  grantFamily: AccessGrantFamily;
  actionScope: AccessGrantActionScope;
  lineageScope: AccessGrantLineageScope;
  grantScopeEnvelopeRef: string;
  routeFamilyRef: string;
  subjectRef: string | null;
  boundPatientRef: string | null;
  issuedIdentityBindingRef: string | null;
  boundContactRouteRef: string | null;
  subjectBindingMode: AccessGrantSubjectBindingMode;
  phiExposureClass: AccessGrantPhiExposureClass;
  replayPolicy: AccessGrantReplayPolicy;
  tokenHash: string;
  tokenKeyVersionRef: string;
  validatorVersionRef: string;
  validatorFamily: AccessGrantValidatorFamily;
  issuedRouteIntentBindingRef: string | null;
  issuedSessionEpochRef: string | null;
  issuedSubjectBindingVersionRef: string | null;
  issuedLineageFenceEpoch: number;
  requiredReleaseApprovalFreezeRef: string | null;
  requiredChannelReleaseFreezeRef: string | null;
  requiredAudienceSurfaceRuntimeBindingRef: string | null;
  grantState: AccessGrantState;
  maxRedemptions: number;
  redemptionCount: number;
  currentRedemptionRef: string | null;
  latestSupersessionRef: string | null;
  expiresAt: string;
  redeemedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  supersedesGrantRef: string | null;
  supersededByGrantRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedAccessGrantRow extends AccessGrantSnapshot {
  aggregateType: "AccessGrant";
  persistenceSchemaVersion: 1;
}

export class AccessGrantDocument {
  private readonly snapshot: AccessGrantSnapshot;

  private constructor(snapshot: AccessGrantSnapshot) {
    this.snapshot = AccessGrantDocument.normalize(snapshot);
  }

  static create(input: Omit<AccessGrantSnapshot, "version">): AccessGrantDocument {
    return new AccessGrantDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: AccessGrantSnapshot): AccessGrantDocument {
    return new AccessGrantDocument(snapshot);
  }

  private static normalize(snapshot: AccessGrantSnapshot): AccessGrantSnapshot {
    invariant(snapshot.version >= 1, "INVALID_GRANT_VERSION", "AccessGrant.version must be >= 1.");
    invariant(
      snapshot.maxRedemptions >= 1,
      "GRANT_MAX_REDEMPTIONS_INVALID",
      "AccessGrant.maxRedemptions must be >= 1.",
    );
    invariant(
      snapshot.redemptionCount >= 0 && snapshot.redemptionCount <= snapshot.maxRedemptions,
      "GRANT_REDEMPTION_COUNT_INVALID",
      "AccessGrant.redemptionCount must stay within maxRedemptions.",
    );
    const policy = resolveGrantPolicy(snapshot.grantFamily);
    invariant(
      policy.allowedActionScopes.includes(snapshot.actionScope),
      "GRANT_ACTION_SCOPE_NOT_ALLOWED",
      `${snapshot.grantFamily} cannot issue actionScope ${snapshot.actionScope}.`,
    );
    invariant(
      phiExposureRank(snapshot.phiExposureClass) <= phiExposureRank(policy.maxPhiExposureClass),
      "GRANT_PHI_SCOPE_WIDENED",
      `${snapshot.grantFamily} cannot widen PHI exposure beyond ${policy.maxPhiExposureClass}.`,
    );
    invariant(
      snapshot.validatorFamily === policy.validatorFamily,
      "GRANT_VALIDATOR_FAMILY_DRIFT",
      "AccessGrant.validatorFamily must match the grant family validator.",
    );
    invariant(
      snapshot.replayPolicy === policy.replayPolicy,
      "GRANT_REPLAY_POLICY_DRIFT",
      "AccessGrant.replayPolicy must match the grant family replay policy.",
    );
    if (snapshot.currentRedemptionRef) {
      invariant(
        snapshot.redemptionCount >= 1,
        "GRANT_CURRENT_REDEMPTION_WITHOUT_COUNT",
        "AccessGrant.currentRedemptionRef requires redemptionCount >= 1.",
      );
    }
    if (snapshot.latestSupersessionRef || snapshot.supersededByGrantRef) {
      invariant(
        snapshot.grantState !== "live" && snapshot.grantState !== "redeeming",
        "SUPERSEDED_GRANT_MAY_NOT_STAY_LIVE",
        "A superseded or replaced grant may not remain live.",
      );
    }
    if (snapshot.grantState === "redeemed") {
      invariant(
        snapshot.currentRedemptionRef !== null,
        "REDEEMED_GRANT_REQUIRES_REDEMPTION_REF",
        "redeemed AccessGrant requires currentRedemptionRef.",
      );
    }
    return {
      ...snapshot,
      subjectRef: optionalRef(snapshot.subjectRef),
      boundPatientRef: optionalRef(snapshot.boundPatientRef),
      issuedIdentityBindingRef: optionalRef(snapshot.issuedIdentityBindingRef),
      boundContactRouteRef: optionalRef(snapshot.boundContactRouteRef),
      issuedRouteIntentBindingRef: optionalRef(snapshot.issuedRouteIntentBindingRef),
      issuedSessionEpochRef: optionalRef(snapshot.issuedSessionEpochRef),
      issuedSubjectBindingVersionRef: optionalRef(snapshot.issuedSubjectBindingVersionRef),
      requiredReleaseApprovalFreezeRef: optionalRef(snapshot.requiredReleaseApprovalFreezeRef),
      requiredChannelReleaseFreezeRef: optionalRef(snapshot.requiredChannelReleaseFreezeRef),
      requiredAudienceSurfaceRuntimeBindingRef: optionalRef(
        snapshot.requiredAudienceSurfaceRuntimeBindingRef,
      ),
      currentRedemptionRef: optionalRef(snapshot.currentRedemptionRef),
      latestSupersessionRef: optionalRef(snapshot.latestSupersessionRef),
      redeemedAt: optionalRef(snapshot.redeemedAt),
      revokedAt: optionalRef(snapshot.revokedAt),
      revocationReason: optionalRef(snapshot.revocationReason),
      supersedesGrantRef: optionalRef(snapshot.supersedesGrantRef),
      supersededByGrantRef: optionalRef(snapshot.supersededByGrantRef),
    };
  }

  get grantId(): string {
    return this.snapshot.grantId;
  }

  get grantState(): AccessGrantState {
    return this.snapshot.grantState;
  }

  get replayPolicy(): AccessGrantReplayPolicy {
    return this.snapshot.replayPolicy;
  }

  get tokenHash(): string {
    return this.snapshot.tokenHash;
  }

  get grantFamily(): AccessGrantFamily {
    return this.snapshot.grantFamily;
  }

  get currentRedemptionRef(): string | null {
    return this.snapshot.currentRedemptionRef;
  }

  get latestSupersessionRef(): string | null {
    return this.snapshot.latestSupersessionRef;
  }

  get redemptionCount(): number {
    return this.snapshot.redemptionCount;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): AccessGrantSnapshot {
    return { ...this.snapshot };
  }

  claimRedeeming(recordedAt: string): AccessGrantDocument {
    invariant(
      this.snapshot.grantState === "live",
      "GRANT_NOT_LIVE",
      `Grant ${this.snapshot.grantId} is not live.`,
    );
    return new AccessGrantDocument({
      ...this.snapshot,
      grantState: "redeeming",
      updatedAt: recordedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  settleRedemption(input: {
    grantState: AccessGrantState;
    redemptionRef: string;
    recordedAt: string;
    revocationReason?: string | null;
  }): AccessGrantDocument {
    const nextRedemptionCount = this.snapshot.redemptionCount + 1;
    invariant(
      nextRedemptionCount <= this.snapshot.maxRedemptions,
      "GRANT_REDEMPTION_LIMIT_EXCEEDED",
      "AccessGrant redemption limit exceeded.",
    );
    return new AccessGrantDocument({
      ...this.snapshot,
      grantState: input.grantState,
      redemptionCount: nextRedemptionCount,
      currentRedemptionRef: requireRef(input.redemptionRef, "redemptionRef"),
      redeemedAt:
        input.grantState === "redeemed" || input.grantState === "rotated"
          ? input.recordedAt
          : this.snapshot.redeemedAt,
      revokedAt:
        input.grantState === "revoked" || input.grantState === "expired"
          ? input.recordedAt
          : this.snapshot.revokedAt,
      revocationReason: optionalRef(input.revocationReason) ?? this.snapshot.revocationReason,
      updatedAt: input.recordedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markSuperseded(input: {
    supersessionRef: string;
    replacementGrantRef?: string | null;
    nextState: Extract<AccessGrantState, "rotated" | "superseded" | "revoked" | "expired">;
    recordedAt: string;
    revocationReason?: string | null;
  }): AccessGrantDocument {
    return new AccessGrantDocument({
      ...this.snapshot,
      grantState: input.nextState,
      latestSupersessionRef: requireRef(input.supersessionRef, "supersessionRef"),
      supersededByGrantRef: optionalRef(input.replacementGrantRef),
      revokedAt:
        input.nextState === "revoked" || input.nextState === "expired"
          ? input.recordedAt
          : this.snapshot.revokedAt,
      revocationReason: optionalRef(input.revocationReason) ?? this.snapshot.revocationReason,
      updatedAt: input.recordedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type AccessGrantRedemptionDecision = "allow" | "step_up" | "recover" | "deny";

export interface AccessGrantRedemptionRecordSnapshot {
  redemptionId: string;
  grantRef: string;
  grantScopeEnvelopeRef: string;
  requestContextHash: string;
  authorizationFenceHash: string;
  decision: AccessGrantRedemptionDecision;
  decisionReasonCodes: readonly string[];
  grantStateAfterDecision: AccessGrantState;
  resultingSessionRef: string | null;
  resultingRouteIntentBindingRef: string | null;
  replacementGrantRef: string | null;
  supersessionRecordRef: string | null;
  recoveryRouteRef: string | null;
  recordedAt: string;
  version: number;
}

export interface PersistedAccessGrantRedemptionRecordRow
  extends AccessGrantRedemptionRecordSnapshot {
  aggregateType: "AccessGrantRedemptionRecord";
  persistenceSchemaVersion: 1;
}

export class AccessGrantRedemptionRecordDocument {
  private readonly snapshot: AccessGrantRedemptionRecordSnapshot;

  private constructor(snapshot: AccessGrantRedemptionRecordSnapshot) {
    this.snapshot = AccessGrantRedemptionRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<AccessGrantRedemptionRecordSnapshot, "version">,
  ): AccessGrantRedemptionRecordDocument {
    return new AccessGrantRedemptionRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: AccessGrantRedemptionRecordSnapshot,
  ): AccessGrantRedemptionRecordDocument {
    return new AccessGrantRedemptionRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: AccessGrantRedemptionRecordSnapshot,
  ): AccessGrantRedemptionRecordSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_REDEMPTION_VERSION",
      "AccessGrantRedemptionRecord.version must be >= 1.",
    );
    if (snapshot.decision === "allow") {
      invariant(
        snapshot.grantStateAfterDecision === "redeemed" ||
          snapshot.grantStateAfterDecision === "rotated" ||
          snapshot.grantStateAfterDecision === "live",
        "ALLOW_DECISION_STATE_INVALID",
        "allow decisions must settle the grant to live, redeemed, or rotated.",
      );
    }
    if (snapshot.decision === "step_up") {
      invariant(
        snapshot.grantStateAfterDecision === "rotated" ||
          snapshot.grantStateAfterDecision === "superseded",
        "STEP_UP_DECISION_STATE_INVALID",
        "step_up decisions require a rotated or superseded grant.",
      );
    }
    return {
      ...snapshot,
      decisionReasonCodes: uniqueSortedRefs(snapshot.decisionReasonCodes),
      resultingSessionRef: optionalRef(snapshot.resultingSessionRef),
      resultingRouteIntentBindingRef: optionalRef(snapshot.resultingRouteIntentBindingRef),
      replacementGrantRef: optionalRef(snapshot.replacementGrantRef),
      supersessionRecordRef: optionalRef(snapshot.supersessionRecordRef),
      recoveryRouteRef: optionalRef(snapshot.recoveryRouteRef),
    };
  }

  get redemptionId(): string {
    return this.snapshot.redemptionId;
  }

  get grantRef(): string {
    return this.snapshot.grantRef;
  }

  get requestContextHash(): string {
    return this.snapshot.requestContextHash;
  }

  toSnapshot(): AccessGrantRedemptionRecordSnapshot {
    return {
      ...this.snapshot,
      decisionReasonCodes: [...this.snapshot.decisionReasonCodes],
    };
  }
}

export type AccessGrantSupersessionCauseClass =
  | "rotation"
  | "claim_completed"
  | "draft_promoted"
  | "secure_link_reissue"
  | "identity_repair"
  | "session_drift"
  | "route_drift"
  | "publication_drift"
  | "expiry_sweep"
  | "logout"
  | "manual_revoke";

export interface AccessGrantSupersessionRecordSnapshot {
  supersessionId: string;
  causeClass: AccessGrantSupersessionCauseClass;
  supersededGrantRefs: readonly string[];
  replacementGrantRef: string | null;
  governingObjectRef: string;
  lineageFenceEpoch: number;
  sessionEpochRef: string | null;
  subjectBindingVersionRef: string | null;
  reasonCodes: readonly string[];
  recordedAt: string;
  version: number;
}

export interface PersistedAccessGrantSupersessionRecordRow
  extends AccessGrantSupersessionRecordSnapshot {
  aggregateType: "AccessGrantSupersessionRecord";
  persistenceSchemaVersion: 1;
}

export class AccessGrantSupersessionRecordDocument {
  private readonly snapshot: AccessGrantSupersessionRecordSnapshot;

  private constructor(snapshot: AccessGrantSupersessionRecordSnapshot) {
    this.snapshot = AccessGrantSupersessionRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<AccessGrantSupersessionRecordSnapshot, "version">,
  ): AccessGrantSupersessionRecordDocument {
    return new AccessGrantSupersessionRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: AccessGrantSupersessionRecordSnapshot,
  ): AccessGrantSupersessionRecordDocument {
    return new AccessGrantSupersessionRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: AccessGrantSupersessionRecordSnapshot,
  ): AccessGrantSupersessionRecordSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_SUPERSESSION_VERSION",
      "AccessGrantSupersessionRecord.version must be >= 1.",
    );
    invariant(
      snapshot.supersededGrantRefs.length >= 1,
      "SUPERSESSION_REQUIRES_SUPERSEDED_GRANTS",
      "AccessGrantSupersessionRecord must name at least one superseded grant.",
    );
    return {
      ...snapshot,
      supersededGrantRefs: uniqueSortedRefs(snapshot.supersededGrantRefs),
      replacementGrantRef: optionalRef(snapshot.replacementGrantRef),
      sessionEpochRef: optionalRef(snapshot.sessionEpochRef),
      subjectBindingVersionRef: optionalRef(snapshot.subjectBindingVersionRef),
      reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
    };
  }

  get supersessionId(): string {
    return this.snapshot.supersessionId;
  }

  get supersededGrantRefs(): readonly string[] {
    return this.snapshot.supersededGrantRefs;
  }

  toSnapshot(): AccessGrantSupersessionRecordSnapshot {
    return {
      ...this.snapshot,
      supersededGrantRefs: [...this.snapshot.supersededGrantRefs],
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface IdentityBindingRepository {
  getIdentityBinding(bindingId: string): Promise<IdentityBindingDocument | undefined>;
  saveIdentityBinding(
    binding: IdentityBindingDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listIdentityBindings(): Promise<readonly IdentityBindingDocument[]>;
  listIdentityBindingsForRequest(requestId: string): Promise<readonly IdentityBindingDocument[]>;
}

export interface PatientLinkRepository {
  getPatientLink(patientLinkId: string): Promise<PatientLinkDocument | undefined>;
  savePatientLink(link: PatientLinkDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listPatientLinks(): Promise<readonly PatientLinkDocument[]>;
  listPatientLinksForSubject(subjectRef: string): Promise<readonly PatientLinkDocument[]>;
}

export interface AccessGrantScopeEnvelopeRepository {
  getAccessGrantScopeEnvelope(
    scopeEnvelopeId: string,
  ): Promise<AccessGrantScopeEnvelopeDocument | undefined>;
  saveAccessGrantScopeEnvelope(
    scopeEnvelope: AccessGrantScopeEnvelopeDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAccessGrantScopeEnvelopes(): Promise<readonly AccessGrantScopeEnvelopeDocument[]>;
}

export interface AccessGrantRepository {
  getAccessGrant(grantId: string): Promise<AccessGrantDocument | undefined>;
  getAccessGrantByTokenHash(tokenHash: string): Promise<AccessGrantDocument | undefined>;
  saveAccessGrant(grant: AccessGrantDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listAccessGrants(): Promise<readonly AccessGrantDocument[]>;
  listAccessGrantsForGoverningObject(
    governingObjectRef: string,
  ): Promise<readonly AccessGrantDocument[]>;
}

export interface AccessGrantRedemptionRepository {
  getAccessGrantRedemption(
    redemptionId: string,
  ): Promise<AccessGrantRedemptionRecordDocument | undefined>;
  getAccessGrantRedemptionByGrant(
    grantRef: string,
  ): Promise<AccessGrantRedemptionRecordDocument | undefined>;
  getAccessGrantRedemptionByGrantAndContext(
    grantRef: string,
    requestContextHash: string,
  ): Promise<AccessGrantRedemptionRecordDocument | undefined>;
  saveAccessGrantRedemption(
    redemption: AccessGrantRedemptionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAccessGrantRedemptions(): Promise<readonly AccessGrantRedemptionRecordDocument[]>;
}

export interface AccessGrantSupersessionRepository {
  getAccessGrantSupersession(
    supersessionId: string,
  ): Promise<AccessGrantSupersessionRecordDocument | undefined>;
  saveAccessGrantSupersession(
    supersession: AccessGrantSupersessionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAccessGrantSupersessions(): Promise<readonly AccessGrantSupersessionRecordDocument[]>;
  listAccessGrantSupersessionsForGrant(
    grantRef: string,
  ): Promise<readonly AccessGrantSupersessionRecordDocument[]>;
}

export interface IdentityAccessDependencies
  extends IdentityBindingRepository,
    PatientLinkRepository,
    AccessGrantScopeEnvelopeRepository,
    AccessGrantRepository,
    AccessGrantRedemptionRepository,
    AccessGrantSupersessionRepository {
  getRequest(requestId: string): Promise<RequestAggregate | undefined>;
  saveRequest(request: RequestAggregate, options?: CompareAndSetWriteOptions): Promise<void>;
  listRequests(): Promise<readonly RequestAggregate[]>;
  getEpisode(episodeId: string): Promise<EpisodeAggregate | undefined>;
  saveEpisode(episode: EpisodeAggregate, options?: CompareAndSetWriteOptions): Promise<void>;
  listEpisodes(): Promise<readonly EpisodeAggregate[]>;
}

export class InMemoryIdentityAccessStore implements IdentityAccessDependencies {
  private readonly requests = new Map<string, PersistedRequestRow>();
  private readonly episodes = new Map<string, EpisodeSnapshot>();
  private readonly identityBindings = new Map<string, PersistedIdentityBindingRow>();
  private readonly patientLinks = new Map<string, PersistedPatientLinkRow>();
  private readonly scopeEnvelopes = new Map<string, PersistedAccessGrantScopeEnvelopeRow>();
  private readonly grants = new Map<string, PersistedAccessGrantRow>();
  private readonly redemptions = new Map<string, PersistedAccessGrantRedemptionRecordRow>();
  private readonly supersessions = new Map<string, PersistedAccessGrantSupersessionRecordRow>();
  private readonly grantsByTokenHash = new Map<string, string>();
  private readonly redemptionByGrantAndContext = new Map<string, string>();

  async getRequest(requestId: string): Promise<RequestAggregate | undefined> {
    const row = this.requests.get(requestId);
    return row ? hydrateRequest(row) : undefined;
  }

  async saveRequest(request: RequestAggregate, options?: CompareAndSetWriteOptions): Promise<void> {
    saveWithCas(this.requests, request.requestId, serializeRequest(request), options);
  }

  async listRequests(): Promise<readonly RequestAggregate[]> {
    return [...this.requests.values()].map(hydrateRequest);
  }

  async getEpisode(episodeId: string): Promise<EpisodeAggregate | undefined> {
    const row = this.episodes.get(episodeId);
    return row ? EpisodeAggregate.hydrate(row) : undefined;
  }

  async saveEpisode(episode: EpisodeAggregate, options?: CompareAndSetWriteOptions): Promise<void> {
    saveWithCas(this.episodes, episode.episodeId, episode.toSnapshot(), options);
  }

  async listEpisodes(): Promise<readonly EpisodeAggregate[]> {
    return [...this.episodes.values()].map((row) => EpisodeAggregate.hydrate(row));
  }

  async getIdentityBinding(bindingId: string): Promise<IdentityBindingDocument | undefined> {
    const row = this.identityBindings.get(bindingId);
    return row ? IdentityBindingDocument.hydrate(row) : undefined;
  }

  async saveIdentityBinding(
    binding: IdentityBindingDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = binding.toSnapshot();
    saveWithCas(
      this.identityBindings,
      snapshot.bindingId,
      {
        ...snapshot,
        aggregateType: "IdentityBinding",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listIdentityBindings(): Promise<readonly IdentityBindingDocument[]> {
    return [...this.identityBindings.values()].map((row) => IdentityBindingDocument.hydrate(row));
  }

  async listIdentityBindingsForRequest(
    requestId: string,
  ): Promise<readonly IdentityBindingDocument[]> {
    return [...this.identityBindings.values()]
      .filter((row) => row.requestId === requestId)
      .sort((left, right) => left.bindingVersion - right.bindingVersion)
      .map((row) => IdentityBindingDocument.hydrate(row));
  }

  async getPatientLink(patientLinkId: string): Promise<PatientLinkDocument | undefined> {
    const row = this.patientLinks.get(patientLinkId);
    return row ? PatientLinkDocument.hydrate(row) : undefined;
  }

  async savePatientLink(
    link: PatientLinkDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = link.toSnapshot();
    saveWithCas(
      this.patientLinks,
      snapshot.patientLinkId,
      {
        ...snapshot,
        aggregateType: "PatientLink",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listPatientLinks(): Promise<readonly PatientLinkDocument[]> {
    return [...this.patientLinks.values()].map((row) => PatientLinkDocument.hydrate(row));
  }

  async listPatientLinksForSubject(subjectRef: string): Promise<readonly PatientLinkDocument[]> {
    return [...this.patientLinks.values()]
      .filter((row) => row.subjectRef === subjectRef)
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt))
      .map((row) => PatientLinkDocument.hydrate(row));
  }

  async getAccessGrantScopeEnvelope(
    scopeEnvelopeId: string,
  ): Promise<AccessGrantScopeEnvelopeDocument | undefined> {
    const row = this.scopeEnvelopes.get(scopeEnvelopeId);
    return row ? AccessGrantScopeEnvelopeDocument.hydrate(row) : undefined;
  }

  async saveAccessGrantScopeEnvelope(
    scopeEnvelope: AccessGrantScopeEnvelopeDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = scopeEnvelope.toSnapshot();
    saveWithCas(
      this.scopeEnvelopes,
      snapshot.scopeEnvelopeId,
      {
        ...snapshot,
        aggregateType: "AccessGrantScopeEnvelope",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listAccessGrantScopeEnvelopes(): Promise<readonly AccessGrantScopeEnvelopeDocument[]> {
    return [...this.scopeEnvelopes.values()].map((row) =>
      AccessGrantScopeEnvelopeDocument.hydrate(row),
    );
  }

  async getAccessGrant(grantId: string): Promise<AccessGrantDocument | undefined> {
    const row = this.grants.get(grantId);
    return row ? AccessGrantDocument.hydrate(row) : undefined;
  }

  async getAccessGrantByTokenHash(tokenHash: string): Promise<AccessGrantDocument | undefined> {
    const grantId = this.grantsByTokenHash.get(tokenHash);
    return grantId ? this.getAccessGrant(grantId) : undefined;
  }

  async saveAccessGrant(
    grant: AccessGrantDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = grant.toSnapshot();
    const currentGrantId = this.grantsByTokenHash.get(snapshot.tokenHash);
    invariant(
      currentGrantId === undefined || currentGrantId === snapshot.grantId,
      "TOKEN_HASH_ALREADY_BOUND",
      `tokenHash ${snapshot.tokenHash} is already bound to ${currentGrantId}.`,
    );
    saveWithCas(
      this.grants,
      snapshot.grantId,
      {
        ...snapshot,
        aggregateType: "AccessGrant",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.grantsByTokenHash.set(snapshot.tokenHash, snapshot.grantId);
  }

  async listAccessGrants(): Promise<readonly AccessGrantDocument[]> {
    return [...this.grants.values()].map((row) => AccessGrantDocument.hydrate(row));
  }

  async listAccessGrantsForGoverningObject(
    governingObjectRef: string,
  ): Promise<readonly AccessGrantDocument[]> {
    const scopeEnvelopeIds = [...this.scopeEnvelopes.values()]
      .filter((row) => row.governingObjectRef === governingObjectRef)
      .map((row) => row.scopeEnvelopeId);
    return [...this.grants.values()]
      .filter((row) => scopeEnvelopeIds.includes(row.grantScopeEnvelopeRef))
      .map((row) => AccessGrantDocument.hydrate(row));
  }

  async getAccessGrantRedemption(
    redemptionId: string,
  ): Promise<AccessGrantRedemptionRecordDocument | undefined> {
    const row = this.redemptions.get(redemptionId);
    return row ? AccessGrantRedemptionRecordDocument.hydrate(row) : undefined;
  }

  async getAccessGrantRedemptionByGrant(
    grantRef: string,
  ): Promise<AccessGrantRedemptionRecordDocument | undefined> {
    const rows = [...this.redemptions.values()]
      .filter((row) => row.grantRef === grantRef)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
    const row = rows.at(-1);
    return row ? AccessGrantRedemptionRecordDocument.hydrate(row) : undefined;
  }

  async getAccessGrantRedemptionByGrantAndContext(
    grantRef: string,
    requestContextHash: string,
  ): Promise<AccessGrantRedemptionRecordDocument | undefined> {
    const redemptionId = this.redemptionByGrantAndContext.get(`${grantRef}::${requestContextHash}`);
    return redemptionId ? this.getAccessGrantRedemption(redemptionId) : undefined;
  }

  async saveAccessGrantRedemption(
    redemption: AccessGrantRedemptionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = redemption.toSnapshot();
    const key = `${snapshot.grantRef}::${snapshot.requestContextHash}`;
    const currentRedemptionId = this.redemptionByGrantAndContext.get(key);
    invariant(
      currentRedemptionId === undefined || currentRedemptionId === snapshot.redemptionId,
      "REDEMPTION_CONTEXT_ALREADY_BOUND",
      "Grant requestContextHash is already bound to a different redemption.",
    );
    saveWithCas(
      this.redemptions,
      snapshot.redemptionId,
      {
        ...snapshot,
        aggregateType: "AccessGrantRedemptionRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.redemptionByGrantAndContext.set(key, snapshot.redemptionId);
  }

  async listAccessGrantRedemptions(): Promise<readonly AccessGrantRedemptionRecordDocument[]> {
    return [...this.redemptions.values()].map((row) =>
      AccessGrantRedemptionRecordDocument.hydrate(row),
    );
  }

  async getAccessGrantSupersession(
    supersessionId: string,
  ): Promise<AccessGrantSupersessionRecordDocument | undefined> {
    const row = this.supersessions.get(supersessionId);
    return row ? AccessGrantSupersessionRecordDocument.hydrate(row) : undefined;
  }

  async saveAccessGrantSupersession(
    supersession: AccessGrantSupersessionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = supersession.toSnapshot();
    saveWithCas(
      this.supersessions,
      snapshot.supersessionId,
      {
        ...snapshot,
        aggregateType: "AccessGrantSupersessionRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listAccessGrantSupersessions(): Promise<readonly AccessGrantSupersessionRecordDocument[]> {
    return [...this.supersessions.values()].map((row) =>
      AccessGrantSupersessionRecordDocument.hydrate(row),
    );
  }

  async listAccessGrantSupersessionsForGrant(
    grantRef: string,
  ): Promise<readonly AccessGrantSupersessionRecordDocument[]> {
    return [...this.supersessions.values()]
      .filter((row) => row.supersededGrantRefs.includes(grantRef))
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => AccessGrantSupersessionRecordDocument.hydrate(row));
  }
}

export function createIdentityAccessStore(): IdentityAccessDependencies {
  return new InMemoryIdentityAccessStore();
}

export interface SettleIdentityBindingInput {
  requestId: string;
  episodeId: string;
  subjectRef: string;
  patientRef?: string | null;
  runnerUpPatientRef?: string | null;
  candidatePatientRefs?: readonly string[];
  candidateSetRef: string;
  bindingState: IdentityBindingState;
  ownershipState: IdentityOwnershipState;
  decisionClass: IdentityBindingDecisionClass;
  assuranceLevel: IdentityAssuranceLevel;
  verifiedContactRouteRef?: string | null;
  matchEvidenceRef: string;
  linkProbability: number;
  linkProbabilityLowerBound: number;
  runnerUpProbabilityUpperBound: number;
  subjectProofProbabilityLowerBound: number;
  gapLogit: number;
  calibrationVersionRef: string;
  confidenceModelState: ConfidenceModelState;
  bindingAuthorityRef: string;
  stepUpMethod?: string | null;
  expectedCurrentBindingRef?: string | null;
  patientLinkProvenanceRef?: string;
  patientLinkEvaluatedAt?: string;
  patientLinkExpiresAt?: string;
  repairCaseRef?: string | null;
  repairFreezeRef?: string | null;
  repairReleaseSettlementRef?: string | null;
  createdAt: string;
}

export interface IdentityBindingAuthorityResult {
  readonly binding: IdentityBindingDocument;
  readonly patientLink: PatientLinkDocument;
  readonly request: RequestAggregate;
  readonly episode: EpisodeAggregate;
  readonly previousBinding: IdentityBindingDocument | null;
}

export class IdentityBindingAuthorityService {
  private readonly repositories: IdentityAccessDependencies;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(repositories: IdentityAccessDependencies, idGenerator: BackboneIdGenerator) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  async settleBinding(input: SettleIdentityBindingInput): Promise<IdentityBindingAuthorityResult> {
    const request = await this.repositories.getRequest(input.requestId);
    const episode = await this.repositories.getEpisode(input.episodeId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${input.requestId} was not found.`);
    invariant(episode, "EPISODE_NOT_FOUND", `Episode ${input.episodeId} was not found.`);
    invariant(
      request.toSnapshot().episodeId === episode.episodeId,
      "REQUEST_EPISODE_MISMATCH",
      "Request and Episode must stay aligned before binding changes.",
    );
    if (input.decisionClass === "correction_applied" || input.decisionClass === "revoked") {
      invariant(
        optionalRef(input.repairCaseRef) &&
          optionalRef(input.repairFreezeRef) &&
          optionalRef(input.repairReleaseSettlementRef),
        "IDENTITY_REPAIR_GUARD_REQUIRED",
        "Correction-applied and revoked bindings require active repair case, freeze, and release refs.",
      );
    }

    const requestSnapshot = serializeRequest(request);
    const episodeSnapshot = episode.toSnapshot();
    const currentBindingRef =
      requestSnapshot.currentIdentityBindingRef ?? episodeSnapshot.currentIdentityBindingRef;
    invariant(
      requestSnapshot.currentIdentityBindingRef === episodeSnapshot.currentIdentityBindingRef,
      "LINEAGE_BINDING_POINTER_DRIFT",
      "Request and Episode must reference the same currentIdentityBindingRef.",
    );
    if (input.expectedCurrentBindingRef !== undefined) {
      invariant(
        currentBindingRef === optionalRef(input.expectedCurrentBindingRef),
        "IDENTITY_BINDING_EXPECTATION_MISMATCH",
        "IdentityBinding compare-and-set guard failed.",
      );
    }
    const previousBinding = currentBindingRef
      ? await this.repositories.getIdentityBinding(currentBindingRef)
      : undefined;
    invariant(
      currentBindingRef === null || previousBinding,
      "MISSING_CURRENT_IDENTITY_BINDING",
      `Current IdentityBinding ${currentBindingRef} is missing.`,
    );

    const binding = IdentityBindingDocument.create({
      bindingId: nextIdentityAccessId(this.idGenerator, "identityBinding"),
      episodeId: requireRef(input.episodeId, "episodeId"),
      requestId: requireRef(input.requestId, "requestId"),
      subjectRef: requireRef(input.subjectRef, "subjectRef"),
      patientRef: input.patientRef ?? null,
      runnerUpPatientRef: input.runnerUpPatientRef ?? null,
      candidatePatientRefs: input.candidatePatientRefs ?? [],
      candidateSetRef: requireRef(input.candidateSetRef, "candidateSetRef"),
      bindingState: input.bindingState,
      ownershipState: input.ownershipState,
      decisionClass: input.decisionClass,
      assuranceLevel: input.assuranceLevel,
      verifiedContactRouteRef: input.verifiedContactRouteRef ?? null,
      matchEvidenceRef: requireRef(input.matchEvidenceRef, "matchEvidenceRef"),
      linkProbability: input.linkProbability,
      linkProbabilityLowerBound: input.linkProbabilityLowerBound,
      runnerUpProbabilityUpperBound: input.runnerUpProbabilityUpperBound,
      subjectProofProbabilityLowerBound: input.subjectProofProbabilityLowerBound,
      gapLogit: input.gapLogit,
      calibrationVersionRef: requireRef(input.calibrationVersionRef, "calibrationVersionRef"),
      confidenceModelState: input.confidenceModelState,
      bindingVersion: (previousBinding?.bindingVersion ?? 0) + 1,
      bindingAuthorityRef: requireRef(input.bindingAuthorityRef, "bindingAuthorityRef"),
      stepUpMethod: input.stepUpMethod ?? null,
      supersedesBindingRef: previousBinding?.bindingId ?? null,
      supersededByRef: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    });

    await this.repositories.saveIdentityBinding(binding);
    if (previousBinding) {
      await this.repositories.saveIdentityBinding(
        previousBinding.markSuperseded({
          supersededByRef: binding.bindingId,
          updatedAt: input.createdAt,
        }),
        { expectedVersion: previousBinding.version },
      );
    }

    const nextRequest = ensureRequestIdentityState(
      requestSnapshot,
      binding.toSnapshot(),
      input.createdAt,
    );
    const nextEpisode = ensureEpisodeIdentityState(
      episodeSnapshot,
      binding.toSnapshot(),
      input.createdAt,
    );
    await this.repositories.saveRequest(nextRequest, { expectedVersion: request.version });
    await this.repositories.saveEpisode(nextEpisode, { expectedVersion: episode.version });

    const patientLink = PatientLinkDocument.deriveFromBinding({
      patientLinkId: nextIdentityAccessId(this.idGenerator, "patientLink"),
      binding,
      provenanceRef: input.patientLinkProvenanceRef ?? "identity_binding_authority",
      evaluatedAt: input.patientLinkEvaluatedAt ?? input.createdAt,
      expiresAt: input.patientLinkExpiresAt ?? input.createdAt,
    });
    await this.repositories.savePatientLink(patientLink);

    return {
      binding,
      patientLink,
      request: nextRequest,
      episode: nextEpisode,
      previousBinding: previousBinding ?? null,
    };
  }

  async refreshPatientLink(input: {
    identityBindingRef: string;
    provenanceRef: string;
    evaluatedAt: string;
    expiresAt: string;
  }): Promise<PatientLinkDocument> {
    const binding = await this.repositories.getIdentityBinding(input.identityBindingRef);
    invariant(
      binding,
      "IDENTITY_BINDING_NOT_FOUND",
      `Binding ${input.identityBindingRef} was not found.`,
    );
    const patientLink = PatientLinkDocument.deriveFromBinding({
      patientLinkId: nextIdentityAccessId(this.idGenerator, "patientLink"),
      binding,
      provenanceRef: input.provenanceRef,
      evaluatedAt: input.evaluatedAt,
      expiresAt: input.expiresAt,
    });
    await this.repositories.savePatientLink(patientLink);
    return patientLink;
  }
}

export function createIdentityBindingAuthorityService(
  repositories: IdentityAccessDependencies,
  idGenerator: BackboneIdGenerator,
): IdentityBindingAuthorityService {
  return new IdentityBindingAuthorityService(repositories, idGenerator);
}

export interface IssueAccessGrantInput {
  grantFamily: AccessGrantFamily;
  actionScope: AccessGrantActionScope;
  lineageScope: AccessGrantLineageScope;
  routeFamilyRef: string;
  governingObjectRef: string;
  governingVersionRef: string;
  phiExposureClass: AccessGrantPhiExposureClass;
  issuedRouteIntentBindingRef?: string | null;
  requiredIdentityBindingRef?: string | null;
  requiredReleaseApprovalFreezeRef?: string | null;
  requiredChannelReleaseFreezeRef?: string | null;
  requiredAudienceSurfaceRuntimeBindingRef?: string | null;
  minimumBridgeCapabilitiesRef?: string | null;
  requiredAssuranceSliceTrustRefs?: readonly string[];
  recoveryRouteRef: string;
  subjectRef?: string | null;
  boundPatientRef?: string | null;
  issuedIdentityBindingRef?: string | null;
  boundContactRouteRef?: string | null;
  subjectBindingMode: AccessGrantSubjectBindingMode;
  tokenKeyVersionRef: string;
  validatorVersionRef?: string | null;
  issuedSessionEpochRef?: string | null;
  issuedSubjectBindingVersionRef?: string | null;
  issuedLineageFenceEpoch: number;
  presentedToken: string;
  transportClass?: AccessGrantTokenTransportClass;
  expiresAt: string;
  supersedesGrantRef?: string | null;
  createdAt: string;
}

export interface IssueAccessGrantForUseCaseInput
  extends Omit<
    IssueAccessGrantInput,
    "grantFamily" | "actionScope" | "lineageScope" | "phiExposureClass" | "subjectBindingMode"
  > {
  useCase: AccessGrantUseCase;
  actionScope?: AccessGrantActionScope | null;
  requestedOutcome?: Exclude<AccessGrantIssuanceOutcome, "issued"> | null;
}

export interface AccessGrantRequestContext {
  routeFamily: string;
  actionScope: AccessGrantActionScope;
  lineageScope: AccessGrantLineageScope;
  governingObjectRef: string;
  governingVersionRef: string;
  routeIntentBindingRef?: string | null;
  routeIntentTupleHash?: string | null;
  routeContractDigestRef?: string | null;
  routeIntentBindingState?: "live" | "stale" | "superseded" | "recovery_only";
  identityBindingRef?: string | null;
  releaseApprovalFreezeRef?: string | null;
  channelReleaseFreezeRef?: string | null;
  audienceSurfaceRuntimeBindingRef?: string | null;
  minimumBridgeCapabilitiesRef?: string | null;
  assuranceSliceTrustRefs?: readonly string[];
  lineageFenceEpoch: number;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  tokenKeyVersionRef: string;
  requiresStrongerAssurance?: boolean;
}

export type ReplacementAccessGrantInput = Omit<IssueAccessGrantInput, "supersedesGrantRef">;

export interface RedeemAccessGrantInput {
  presentedToken: string;
  grantFamily?: AccessGrantFamily;
  context: AccessGrantRequestContext;
  recordedAt: string;
  currentSession?: AccessGrantSessionSnapshot | null;
  resultingSessionRef?: string | null;
  resultingRouteIntentBindingRef?: string | null;
  replacementGrant?: ReplacementAccessGrantInput | null;
  supersessionCauseClass?: AccessGrantSupersessionCauseClass;
}

export interface SupersedeAccessGrantInput {
  causeClass: AccessGrantSupersessionCauseClass;
  supersededGrantRefs: readonly string[];
  governingObjectRef: string;
  lineageFenceEpoch: number;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  reasonCodes?: readonly string[];
  recordedAt: string;
  replacementGrant?: ReplacementAccessGrantInput | null;
}

export interface AccessGrantIssueResult {
  readonly outcome: AccessGrantIssuanceOutcome;
  readonly scopeEnvelope: AccessGrantScopeEnvelopeDocument;
  readonly grant: AccessGrantDocument;
  readonly materializedToken: AccessGrantMaterializedToken | null;
}

export interface AccessGrantRoutingOutcome {
  readonly outcome: Exclude<AccessGrantIssuanceOutcome, "issued">;
  readonly reasonCodes: readonly string[];
  readonly recoveryRouteRef: string;
}

export interface AccessGrantReplaceResult {
  readonly supersession: AccessGrantSupersessionRecordDocument;
  readonly priorGrant: AccessGrantDocument;
  readonly replacement: AccessGrantIssueResult;
}

export interface AccessGrantRevokeResult {
  readonly supersession: AccessGrantSupersessionRecordDocument;
  readonly revokedGrant: AccessGrantDocument;
}

export interface BeginAccessGrantAuthFlowInput {
  readonly routeFamilyRef: string;
  readonly actionScope: AccessGrantActionScope;
  readonly routeTargetRef: string;
  readonly requestLineageRef: string;
  readonly fallbackRouteRef: string;
  readonly resumeContinuationRef?: string | null;
  readonly subjectRef?: string | null;
  readonly requiredIdentityBindingRef?: string | null;
  readonly requiredCapabilityDecisionRef?: string | null;
  readonly requiredPatientLinkRef?: string | null;
  readonly requiredSessionState: AuthBridgeRequiredSessionState;
  readonly returnAuthority: AuthBridgeReturnAuthority;
  readonly sessionEpochRef?: string | null;
  readonly subjectBindingVersionRef?: string | null;
  readonly lineageFenceEpoch: number;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef?: string | null;
  readonly minimumBridgeCapabilitiesRef?: string | null;
  readonly channelReleaseFreezeState: string;
  readonly routeFreezeDispositionRef?: string | null;
  readonly expiresAt: string;
  readonly requestedScopes: readonly string[];
  readonly minimumClaims: readonly string[];
  readonly minimumAssuranceBand: string;
  readonly capabilityCeiling: string;
  readonly policyVersion: string;
  readonly consentCopyVariantRef: string;
  readonly maxAuthAgeSeconds: number;
  readonly requestContextHash: string;
  readonly startedAt: string;
}

export interface BeginAccessGrantAuthFlowResult {
  readonly scopeBundle: AuthScopeBundleSnapshot;
  readonly returnIntent: PostAuthReturnIntentSnapshot;
  readonly transaction: AuthTransactionSnapshot;
}

export interface AccessGrantRedemptionResult {
  readonly replayed: boolean;
  readonly grant: AccessGrantDocument;
  readonly scopeEnvelope: AccessGrantScopeEnvelopeDocument;
  readonly redemption: AccessGrantRedemptionRecordDocument | null;
  readonly supersession: AccessGrantSupersessionRecordDocument | null;
  readonly replacementGrant: AccessGrantDocument | null;
  readonly sessionDecision: SessionEstablishmentDecisionSnapshot | null;
}

export interface AccessGrantSupersessionResult {
  readonly supersession: AccessGrantSupersessionRecordDocument;
  readonly supersededGrants: readonly AccessGrantDocument[];
  readonly replacementGrant: AccessGrantDocument | null;
  readonly replacementScopeEnvelope: AccessGrantScopeEnvelopeDocument | null;
}

function computeRequestContextHash(context: AccessGrantRequestContext): string {
  return sha256Hex(
    stableStringify({
      routeFamily: context.routeFamily,
      actionScope: context.actionScope,
      lineageScope: context.lineageScope,
      governingObjectRef: context.governingObjectRef,
      governingVersionRef: context.governingVersionRef,
      routeIntentBindingRef: optionalRef(context.routeIntentBindingRef),
      routeIntentTupleHash: optionalRef(context.routeIntentTupleHash),
      routeContractDigestRef: optionalRef(context.routeContractDigestRef),
      routeIntentBindingState: optionalRef(context.routeIntentBindingState),
      identityBindingRef: optionalRef(context.identityBindingRef),
      releaseApprovalFreezeRef: optionalRef(context.releaseApprovalFreezeRef),
      channelReleaseFreezeRef: optionalRef(context.channelReleaseFreezeRef),
      audienceSurfaceRuntimeBindingRef: optionalRef(context.audienceSurfaceRuntimeBindingRef),
      minimumBridgeCapabilitiesRef: optionalRef(context.minimumBridgeCapabilitiesRef),
      assuranceSliceTrustRefs: uniqueSortedRefs(context.assuranceSliceTrustRefs ?? []),
      lineageFenceEpoch: context.lineageFenceEpoch,
      sessionEpochRef: optionalRef(context.sessionEpochRef),
      subjectBindingVersionRef: optionalRef(context.subjectBindingVersionRef),
      tokenKeyVersionRef: context.tokenKeyVersionRef,
      requiresStrongerAssurance: Boolean(context.requiresStrongerAssurance),
    }),
  );
}

function computeAuthorizationFenceHash(
  grant: AccessGrantSnapshot,
  envelope: AccessGrantScopeEnvelopeSnapshot,
  context: AccessGrantRequestContext,
): string {
  return sha256Hex(
    stableStringify({
      grantId: grant.grantId,
      grantFamily: grant.grantFamily,
      actionScope: grant.actionScope,
      lineageScope: grant.lineageScope,
      issuedLineageFenceEpoch: grant.issuedLineageFenceEpoch,
      issuedSessionEpochRef: optionalRef(grant.issuedSessionEpochRef),
      issuedSubjectBindingVersionRef: optionalRef(grant.issuedSubjectBindingVersionRef),
      issuedIdentityBindingRef: optionalRef(grant.issuedIdentityBindingRef),
      tokenKeyVersionRef: grant.tokenKeyVersionRef,
      scopeHash: envelope.scopeHash,
      contextHash: computeRequestContextHash(context),
    }),
  );
}

function isRecoverableReason(reasonCode: string): boolean {
  return new Set([
    "GRANT_ALREADY_SUPERSEDED",
    "GRANT_EXPIRED",
    "LINEAGE_FENCE_DRIFT",
    "SESSION_EPOCH_DRIFT",
    "SUBJECT_BINDING_VERSION_DRIFT",
    "IDENTITY_BINDING_DRIFT",
    "GOVERNING_VERSION_DRIFT",
    "IDENTITY_BINDING_REQUIRED",
    "RELEASE_FREEZE_DRIFT",
    "CHANNEL_FREEZE_DRIFT",
    "AUDIENCE_RUNTIME_DRIFT",
    "BRIDGE_CAPABILITY_DRIFT",
    "ASSURANCE_SLICE_TRUST_DRIFT",
    "ROUTE_FAMILY_DRIFT",
    "ROUTE_INTENT_BINDING_DRIFT",
    "ROUTE_INTENT_NOT_LIVE",
  ]).has(reasonCode);
}

function determineGrantDecision(
  grant: AccessGrantSnapshot,
  envelope: AccessGrantScopeEnvelopeSnapshot,
  context: AccessGrantRequestContext,
  recordedAt: string,
): { decision: AccessGrantRedemptionDecision; reasonCodes: string[] } {
  const reasonCodes: string[] = [];
  if (
    grant.latestSupersessionRef ||
    grant.supersededByGrantRef ||
    grant.grantState === "superseded"
  ) {
    reasonCodes.push("GRANT_ALREADY_SUPERSEDED");
  }
  if (grant.grantState === "revoked") {
    reasonCodes.push("GRANT_REVOKED");
  }
  if (grant.grantState === "expired" || compareIso(recordedAt, grant.expiresAt) >= 0) {
    reasonCodes.push("GRANT_EXPIRED");
  }
  if (context.routeFamily !== envelope.routeFamilyRef) {
    reasonCodes.push("ROUTE_FAMILY_DRIFT");
  }
  if (
    grant.issuedRouteIntentBindingRef &&
    optionalRef(context.routeIntentBindingRef) &&
    grant.issuedRouteIntentBindingRef !== optionalRef(context.routeIntentBindingRef)
  ) {
    reasonCodes.push("ROUTE_INTENT_BINDING_DRIFT");
  }
  if (context.routeIntentBindingState && context.routeIntentBindingState !== "live") {
    reasonCodes.push("ROUTE_INTENT_NOT_LIVE");
  }
  if (context.actionScope !== envelope.actionScope) {
    reasonCodes.push("ACTION_SCOPE_DRIFT");
  }
  if (context.lineageScope !== envelope.lineageScope) {
    reasonCodes.push("LINEAGE_SCOPE_DRIFT");
  }
  if (context.governingObjectRef !== envelope.governingObjectRef) {
    reasonCodes.push("GOVERNING_OBJECT_DRIFT");
  }
  if (context.governingVersionRef !== envelope.governingVersionRef) {
    reasonCodes.push("GOVERNING_VERSION_DRIFT");
  }
  if (grant.issuedLineageFenceEpoch !== context.lineageFenceEpoch) {
    reasonCodes.push("LINEAGE_FENCE_DRIFT");
  }
  if (
    envelope.requiredIdentityBindingRef &&
    envelope.requiredIdentityBindingRef !== optionalRef(context.identityBindingRef)
  ) {
    reasonCodes.push("IDENTITY_BINDING_REQUIRED");
  }
  if (
    grant.issuedIdentityBindingRef &&
    grant.issuedIdentityBindingRef !== optionalRef(context.identityBindingRef)
  ) {
    reasonCodes.push("IDENTITY_BINDING_DRIFT");
  }
  if (
    grant.issuedSessionEpochRef &&
    grant.issuedSessionEpochRef !== optionalRef(context.sessionEpochRef)
  ) {
    reasonCodes.push("SESSION_EPOCH_DRIFT");
  }
  if (
    grant.issuedSubjectBindingVersionRef &&
    grant.issuedSubjectBindingVersionRef !== optionalRef(context.subjectBindingVersionRef)
  ) {
    reasonCodes.push("SUBJECT_BINDING_VERSION_DRIFT");
  }
  if (grant.tokenKeyVersionRef !== context.tokenKeyVersionRef) {
    reasonCodes.push("TOKEN_KEY_VERSION_DRIFT");
  }
  if (
    envelope.requiredReleaseApprovalFreezeRef &&
    envelope.requiredReleaseApprovalFreezeRef !== optionalRef(context.releaseApprovalFreezeRef)
  ) {
    reasonCodes.push("RELEASE_FREEZE_DRIFT");
  }
  if (
    envelope.requiredChannelReleaseFreezeRef &&
    envelope.requiredChannelReleaseFreezeRef !== optionalRef(context.channelReleaseFreezeRef)
  ) {
    reasonCodes.push("CHANNEL_FREEZE_DRIFT");
  }
  if (
    envelope.requiredAudienceSurfaceRuntimeBindingRef &&
    envelope.requiredAudienceSurfaceRuntimeBindingRef !==
      optionalRef(context.audienceSurfaceRuntimeBindingRef)
  ) {
    reasonCodes.push("AUDIENCE_RUNTIME_DRIFT");
  }
  if (
    envelope.minimumBridgeCapabilitiesRef &&
    envelope.minimumBridgeCapabilitiesRef !== optionalRef(context.minimumBridgeCapabilitiesRef)
  ) {
    reasonCodes.push("BRIDGE_CAPABILITY_DRIFT");
  }
  const requiredAssuranceSliceTrustRefs = envelope.requiredAssuranceSliceTrustRefs;
  const contextAssuranceSliceTrustRefs = new Set(
    uniqueSortedRefs(context.assuranceSliceTrustRefs ?? []),
  );
  if (requiredAssuranceSliceTrustRefs.some((ref) => !contextAssuranceSliceTrustRefs.has(ref))) {
    reasonCodes.push("ASSURANCE_SLICE_TRUST_DRIFT");
  }
  if (context.requiresStrongerAssurance && reasonCodes.length === 0) {
    return { decision: "step_up", reasonCodes: ["STRONGER_ASSURANCE_REQUIRED"] };
  }
  if (reasonCodes.length === 0) {
    return { decision: "allow", reasonCodes: ["GRANT_SCOPE_MATCHED"] };
  }
  const recoverableOnly = reasonCodes.every((reasonCode) => isRecoverableReason(reasonCode));
  if (recoverableOnly && envelope.recoveryRouteRef) {
    return { decision: "recover", reasonCodes };
  }
  return { decision: "deny", reasonCodes };
}

function grantStateAfterRedemptionDecision(input: {
  decision: AccessGrantRedemptionDecision;
  grant: AccessGrantSnapshot;
  replacementGrantIssued: boolean;
}): AccessGrantState {
  if (input.decision === "allow") {
    if (
      input.grant.replayPolicy === "multi_use_minimal" &&
      input.grant.redemptionCount + 1 < input.grant.maxRedemptions
    ) {
      return "live";
    }
    return input.replacementGrantIssued ? "rotated" : "redeemed";
  }
  if (input.decision === "step_up") {
    return input.replacementGrantIssued ? "rotated" : "superseded";
  }
  if (input.decision === "recover") {
    return "superseded";
  }
  return compareIso(input.grant.expiresAt, input.grant.updatedAt) <= 0 ? "expired" : "revoked";
}

function requiredAuthorityStateForGrantFamily(
  grantFamily: AccessGrantFamily,
): AccessGrantWritableAuthorityState {
  switch (grantFamily) {
    case "draft_resume_minimal":
    case "public_status_minimal":
      return "auth_read_only";
    case "claim_step_up":
      return "claim_pending";
    default:
      return "writable";
  }
}

function resolvePresentedTokenAndHash(input: {
  issue: IssueAccessGrantInput;
  policy: AccessGrantFamilyPolicy;
  tokenMaterializer: AccessGrantTokenMaterializer;
}): { presentedToken: string; materializedToken: AccessGrantMaterializedToken | null } {
  if (input.issue.presentedToken.trim().length > 0) {
    return {
      presentedToken: input.issue.presentedToken,
      materializedToken: null,
    };
  }
  const materializedToken = input.tokenMaterializer.materializeToken({
    tokenKeyVersionRef: input.issue.tokenKeyVersionRef,
    validatorFamily: input.policy.validatorFamily,
    transportClass: input.issue.transportClass ?? "url_query",
    issuedAt: input.issue.createdAt,
  });
  return {
    presentedToken: materializedToken.opaqueToken,
    materializedToken,
  };
}

export interface AccessGrantServiceOptions {
  readonly tokenMaterializer?: AccessGrantTokenMaterializer;
  readonly tokenKeyring?: AccessGrantTokenKeyring;
  readonly tokenEntropySource?: AccessGrantTokenEntropySource;
  readonly sessionGovernor?: SessionGovernor;
  readonly authBridge?: AuthBridge;
}

export class AccessGrantService {
  private readonly repositories: IdentityAccessDependencies;
  private readonly idGenerator: BackboneIdGenerator;
  private readonly tokenMaterializer: AccessGrantTokenMaterializer;
  private readonly sessionGovernor: SessionGovernor;
  private readonly authBridge: AuthBridge;

  constructor(
    repositories: IdentityAccessDependencies,
    idGenerator: BackboneIdGenerator,
    options?: AccessGrantServiceOptions,
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
    const keyring =
      options?.tokenKeyring ??
      new InMemoryAccessGrantTokenKeyring({
        activeKeyVersionRef: "token_key_local_v1",
        secrets: {
          token_key_local_v1: "vecells-local-access-grant-signing-secret",
        },
      });
    this.tokenMaterializer =
      options?.tokenMaterializer ??
      new OpaqueAccessGrantTokenMaterializer({
        keyring,
        entropySource:
          options?.tokenEntropySource ??
          new DeterministicAccessGrantTokenEntropySource(idGenerator),
      });
    this.sessionGovernor = options?.sessionGovernor ?? new LocalSessionGovernor(idGenerator);
    this.authBridge = options?.authBridge ?? new LocalAuthBridge(idGenerator);
  }

  private async resolveGrantByPresentedToken(input: {
    presentedToken: string;
    grantFamily?: AccessGrantFamily;
  }): Promise<AccessGrantDocument> {
    const candidateGrants = await this.repositories.listAccessGrants();
    const parsedOpaqueToken = parseOpaqueAccessGrantToken(input.presentedToken);
    const matchingGrant = candidateGrants.find((candidate) => {
      const snapshot = candidate.toSnapshot();
      if (input.grantFamily && snapshot.grantFamily !== input.grantFamily) {
        return false;
      }
      if (
        parsedOpaqueToken &&
        parsedOpaqueToken.tokenKeyVersionRef !== snapshot.tokenKeyVersionRef
      ) {
        return false;
      }
      const familyPolicy = resolveGrantPolicy(snapshot.grantFamily);
      const verification = this.tokenMaterializer.verifyPresentedToken({
        presentedToken: input.presentedToken,
        tokenKeyVersionRef: snapshot.tokenKeyVersionRef,
        validatorFamily: familyPolicy.validatorFamily,
      });
      if (!verification.valid) {
        return false;
      }
      const tokenHash = hashAccessGrantToken({
        presentedToken: input.presentedToken,
        tokenKeyVersionRef: snapshot.tokenKeyVersionRef,
        validatorFamily: familyPolicy.validatorFamily,
      });
      return tokenHash === snapshot.tokenHash;
    });
    invariant(matchingGrant, "ACCESS_GRANT_NOT_FOUND", "No matching AccessGrant was found.");
    return matchingGrant;
  }

  private async issueGrantCore(input: IssueAccessGrantInput): Promise<AccessGrantIssueResult> {
    const policy = resolveGrantPolicy(input.grantFamily);
    const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
    const expiresAt = ensureIsoTimestamp(input.expiresAt, "expiresAt");
    invariant(
      compareIso(createdAt, expiresAt) < 0,
      "ACCESS_GRANT_EXPIRY_NOT_AFTER_CREATION",
      "expiresAt must be later than createdAt.",
    );
    const validatorVersionRef =
      optionalRef(input.validatorVersionRef) ?? `${policy.validatorFamily}::v1`;
    const scopeEnvelope = AccessGrantScopeEnvelopeDocument.create({
      scopeEnvelopeId: nextIdentityAccessId(this.idGenerator, "accessGrantScopeEnvelope"),
      grantFamily: input.grantFamily,
      actionScope: input.actionScope,
      lineageScope: input.lineageScope,
      routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
      governingObjectRef: requireRef(input.governingObjectRef, "governingObjectRef"),
      governingVersionRef: requireRef(input.governingVersionRef, "governingVersionRef"),
      phiExposureClass: input.phiExposureClass,
      issuedRouteIntentBindingRef: input.issuedRouteIntentBindingRef ?? null,
      requiredIdentityBindingRef: input.requiredIdentityBindingRef ?? null,
      requiredReleaseApprovalFreezeRef: input.requiredReleaseApprovalFreezeRef ?? null,
      requiredChannelReleaseFreezeRef: input.requiredChannelReleaseFreezeRef ?? null,
      requiredAudienceSurfaceRuntimeBindingRef:
        input.requiredAudienceSurfaceRuntimeBindingRef ?? null,
      minimumBridgeCapabilitiesRef: input.minimumBridgeCapabilitiesRef ?? null,
      requiredAssuranceSliceTrustRefs: input.requiredAssuranceSliceTrustRefs ?? [],
      recoveryRouteRef: requireRef(input.recoveryRouteRef, "recoveryRouteRef"),
      createdAt,
    });
    const { presentedToken, materializedToken } = resolvePresentedTokenAndHash({
      issue: input,
      policy,
      tokenMaterializer: this.tokenMaterializer,
    });
    const tokenHash =
      materializedToken?.tokenHash ??
      hashAccessGrantToken({
        presentedToken,
        tokenKeyVersionRef: input.tokenKeyVersionRef,
        validatorFamily: policy.validatorFamily,
      });
    const grant = AccessGrantDocument.create({
      grantId: nextIdentityAccessId(this.idGenerator, "accessGrant"),
      grantFamily: input.grantFamily,
      actionScope: input.actionScope,
      lineageScope: input.lineageScope,
      grantScopeEnvelopeRef: scopeEnvelope.scopeEnvelopeId,
      routeFamilyRef: input.routeFamilyRef,
      subjectRef: input.subjectRef ?? null,
      boundPatientRef: input.boundPatientRef ?? null,
      issuedIdentityBindingRef: input.issuedIdentityBindingRef ?? null,
      boundContactRouteRef: input.boundContactRouteRef ?? null,
      subjectBindingMode: input.subjectBindingMode,
      phiExposureClass: input.phiExposureClass,
      replayPolicy: policy.replayPolicy,
      tokenHash,
      tokenKeyVersionRef: requireRef(input.tokenKeyVersionRef, "tokenKeyVersionRef"),
      validatorVersionRef,
      validatorFamily: policy.validatorFamily,
      issuedRouteIntentBindingRef: input.issuedRouteIntentBindingRef ?? null,
      issuedSessionEpochRef: input.issuedSessionEpochRef ?? null,
      issuedSubjectBindingVersionRef: input.issuedSubjectBindingVersionRef ?? null,
      issuedLineageFenceEpoch: input.issuedLineageFenceEpoch,
      requiredReleaseApprovalFreezeRef: input.requiredReleaseApprovalFreezeRef ?? null,
      requiredChannelReleaseFreezeRef: input.requiredChannelReleaseFreezeRef ?? null,
      requiredAudienceSurfaceRuntimeBindingRef:
        input.requiredAudienceSurfaceRuntimeBindingRef ?? null,
      grantState: "live",
      maxRedemptions: policy.defaultMaxRedemptions,
      redemptionCount: 0,
      currentRedemptionRef: null,
      latestSupersessionRef: null,
      expiresAt,
      redeemedAt: null,
      revokedAt: null,
      revocationReason: null,
      supersedesGrantRef: input.supersedesGrantRef ?? null,
      supersededByGrantRef: null,
      createdAt,
      updatedAt: createdAt,
    });
    await this.repositories.saveAccessGrantScopeEnvelope(scopeEnvelope);
    await this.repositories.saveAccessGrant(grant);
    return {
      outcome: "issued",
      scopeEnvelope,
      grant,
      materializedToken,
    };
  }

  async issueGrant(input: IssueAccessGrantInput): Promise<AccessGrantIssueResult> {
    return this.issueGrantCore(input);
  }

  async issueGrantForUseCase(
    input: IssueAccessGrantForUseCaseInput,
  ): Promise<AccessGrantIssueResult | AccessGrantRoutingOutcome> {
    const policy = resolveAccessGrantUseCasePolicy(input.useCase);
    if (input.requestedOutcome === "manual_only") {
      return {
        outcome: "manual_only",
        reasonCodes: ["MANUAL_ONLY_REQUESTED"],
        recoveryRouteRef: input.recoveryRouteRef,
      };
    }
    if (policy.issuanceOutcome !== "issued" || input.requestedOutcome === "recover_only") {
      return {
        outcome: "recover_only",
        reasonCodes: ["RECOVER_ONLY_POLICY"],
        recoveryRouteRef: input.recoveryRouteRef,
      };
    }
    const actionScope = input.actionScope ?? policy.defaultActionScope;
    invariant(
      actionScope,
      "ACCESS_GRANT_ACTION_SCOPE_REQUIRED",
      "The use-case policy requires an actionScope.",
    );
    invariant(
      policy.allowedActionScopes.includes(actionScope),
      "ACCESS_GRANT_USE_CASE_ACTION_SCOPE_INVALID",
      `${input.useCase} may not issue actionScope ${actionScope}.`,
    );
    invariant(
      policy.allowedRouteFamilyRefs.includes(input.routeFamilyRef),
      "ACCESS_GRANT_USE_CASE_ROUTE_DRIFT",
      `${input.useCase} may not issue routeFamily ${input.routeFamilyRef}.`,
    );
    return this.issueGrantCore({
      ...input,
      grantFamily: requireRef(policy.grantFamily, "grantFamily") as AccessGrantFamily,
      actionScope,
      lineageScope: policy.lineageScope,
      phiExposureClass: policy.phiExposureClass,
      subjectBindingMode: policy.subjectBindingMode,
    });
  }

  async openAuthBridgeFlow(
    input: BeginAccessGrantAuthFlowInput,
  ): Promise<BeginAccessGrantAuthFlowResult> {
    const scopeBundle = await this.authBridge.freezeAuthScopeBundle({
      requestedScopes: input.requestedScopes,
      minimumClaims: input.minimumClaims,
      minimumAssuranceBand: input.minimumAssuranceBand,
      capabilityCeiling: input.capabilityCeiling,
      policyVersion: input.policyVersion,
      consentCopyVariantRef: input.consentCopyVariantRef,
      createdAt: input.startedAt,
      expiresAt: input.expiresAt,
    });
    const returnIntent = await this.authBridge.openPostAuthReturnIntent({
      routeFamilyRef: input.routeFamilyRef,
      actionScope: input.actionScope,
      routeTargetRef: input.routeTargetRef,
      requestLineageRef: input.requestLineageRef,
      draftRef: null,
      submissionPromotionRecordRef: null,
      draftContinuityEvidenceRef: null,
      continuationAccessGrantRef: null,
      fallbackRouteRef: input.fallbackRouteRef,
      resumeContinuationRef: input.resumeContinuationRef ?? null,
      subjectRef: input.subjectRef ?? null,
      requiredIdentityBindingRef: input.requiredIdentityBindingRef ?? null,
      requiredCapabilityDecisionRef: input.requiredCapabilityDecisionRef ?? null,
      requiredPatientLinkRef: input.requiredPatientLinkRef ?? null,
      requiredSessionState: input.requiredSessionState,
      returnAuthority: input.returnAuthority,
      sessionEpochRef: input.sessionEpochRef ?? null,
      subjectBindingVersionRef: input.subjectBindingVersionRef ?? null,
      lineageFenceEpoch: input.lineageFenceEpoch,
      manifestVersionRef: input.manifestVersionRef,
      releaseApprovalFreezeRef: input.releaseApprovalFreezeRef ?? null,
      minimumBridgeCapabilitiesRef: input.minimumBridgeCapabilitiesRef ?? null,
      channelReleaseFreezeState: input.channelReleaseFreezeState,
      routeFreezeDispositionRef: input.routeFreezeDispositionRef ?? null,
      expiresAt: input.expiresAt,
    });
    const transaction = await this.authBridge.openAuthTransaction({
      stateHash: sha256Hex(`state::${returnIntent.returnIntentId}`),
      nonceHash: sha256Hex(`nonce::${scopeBundle.scopeBundleId}`),
      pkceVerifierRef: `pkce_${nextIdentityAccessId(this.idGenerator, "auth_pkce")}`,
      scopeBundleRef: scopeBundle.scopeBundleId,
      capabilityIntentRef: `${input.routeFamilyRef}::${input.actionScope}`,
      returnIntentRef: returnIntent.returnIntentId,
      requestContextHash: input.requestContextHash,
      transactionFenceEpoch: input.lineageFenceEpoch,
      maxAuthAgeSeconds: input.maxAuthAgeSeconds,
      startedAt: input.startedAt,
      expiresAt: input.expiresAt,
    });
    return {
      scopeBundle,
      returnIntent,
      transaction,
    };
  }

  private async buildReplayRedemptionResult(input: {
    grant: AccessGrantDocument;
    scopeEnvelope: AccessGrantScopeEnvelopeDocument;
    redemption: AccessGrantRedemptionRecordDocument | null;
    supersession: AccessGrantSupersessionRecordDocument | null;
    replacementGrant: AccessGrantDocument | null;
  }): Promise<AccessGrantRedemptionResult> {
    return {
      replayed: true,
      grant: input.grant,
      scopeEnvelope: input.scopeEnvelope,
      redemption: input.redemption,
      supersession: input.supersession,
      replacementGrant: input.replacementGrant,
      sessionDecision: null,
    };
  }

  async redeemGrant(input: RedeemAccessGrantInput): Promise<AccessGrantRedemptionResult> {
    const grant = await this.resolveGrantByPresentedToken({
      presentedToken: input.presentedToken,
      grantFamily: input.grantFamily,
    });
    const envelope = await this.repositories.getAccessGrantScopeEnvelope(
      grant.toSnapshot().grantScopeEnvelopeRef,
    );
    invariant(
      envelope,
      "GRANT_SCOPE_ENVELOPE_NOT_FOUND",
      `Scope envelope ${grant.toSnapshot().grantScopeEnvelopeRef} is missing.`,
    );

    const requestContextHash = computeRequestContextHash(input.context);
    const existingContextRedemption =
      await this.repositories.getAccessGrantRedemptionByGrantAndContext(
        grant.grantId,
        requestContextHash,
      );
    if (existingContextRedemption) {
      const supersession = existingContextRedemption.toSnapshot().supersessionRecordRef
        ? ((await this.repositories.getAccessGrantSupersession(
            existingContextRedemption.toSnapshot().supersessionRecordRef!,
          )) ?? null)
        : null;
      const replacementGrant = existingContextRedemption.toSnapshot().replacementGrantRef
        ? ((await this.repositories.getAccessGrant(
            existingContextRedemption.toSnapshot().replacementGrantRef!,
          )) ?? null)
        : null;
      return this.buildReplayRedemptionResult({
        grant,
        scopeEnvelope: envelope,
        redemption: existingContextRedemption,
        supersession,
        replacementGrant,
      });
    }

    if (
      (grant.replayPolicy === "one_time" || grant.replayPolicy === "rotating") &&
      grant.currentRedemptionRef
    ) {
      const redemption = await this.repositories.getAccessGrantRedemption(
        grant.currentRedemptionRef,
      );
      invariant(
        redemption,
        "MISSING_CURRENT_REDEMPTION",
        `Grant ${grant.grantId} references missing redemption ${grant.currentRedemptionRef}.`,
      );
      const supersession = redemption.toSnapshot().supersessionRecordRef
        ? ((await this.repositories.getAccessGrantSupersession(
            redemption.toSnapshot().supersessionRecordRef!,
          )) ?? null)
        : null;
      const replacementGrant = redemption.toSnapshot().replacementGrantRef
        ? ((await this.repositories.getAccessGrant(redemption.toSnapshot().replacementGrantRef!)) ??
          null)
        : null;
      return this.buildReplayRedemptionResult({
        grant,
        scopeEnvelope: envelope,
        redemption,
        supersession,
        replacementGrant,
      });
    }

    if (grant.latestSupersessionRef) {
      const supersession = await this.repositories.getAccessGrantSupersession(
        grant.latestSupersessionRef,
      );
      invariant(
        supersession,
        "MISSING_GRANT_SUPERSESSION",
        `Grant ${grant.grantId} references missing supersession ${grant.latestSupersessionRef}.`,
      );
      const replacementGrant = supersession.toSnapshot().replacementGrantRef
        ? ((await this.repositories.getAccessGrant(
            supersession.toSnapshot().replacementGrantRef!,
          )) ?? null)
        : null;
      return this.buildReplayRedemptionResult({
        grant,
        scopeEnvelope: envelope,
        redemption: null,
        supersession,
        replacementGrant,
      });
    }

    let workingGrant = grant;
    if (grant.replayPolicy === "one_time" || grant.replayPolicy === "rotating") {
      workingGrant = grant.claimRedeeming(input.recordedAt);
      await this.repositories.saveAccessGrant(workingGrant, { expectedVersion: grant.version });
    }

    const decisionEvaluation = determineGrantDecision(
      workingGrant.toSnapshot(),
      envelope.toSnapshot(),
      input.context,
      input.recordedAt,
    );
    let decision = decisionEvaluation.decision;
    const reasonCodes = [...decisionEvaluation.reasonCodes];
    let sessionDecision: SessionEstablishmentDecisionSnapshot | null = null;

    if (decision === "allow") {
      if (input.resultingSessionRef) {
        sessionDecision = {
          decisionId: nextIdentityAccessId(this.idGenerator, "session_establishment_decision"),
          existingSessionRef: input.currentSession?.sessionRef ?? null,
          resolvedSessionRef: input.resultingSessionRef,
          subjectComparisonState: input.currentSession ? "same_subject_same_binding" : "no_session",
          writableAuthorityState: requiredAuthorityStateForGrantFamily(workingGrant.grantFamily),
          decision: input.currentSession ? "reuse_existing" : "create_fresh",
          decidedAt: input.recordedAt,
          sessionEpochRef: input.context.sessionEpochRef ?? null,
          csrfSecretRef: null,
          reasonCodes: ["CALLER_PROVIDED_RESULTING_SESSION_REF"],
        };
      } else {
        sessionDecision = await this.sessionGovernor.decideSessionEstablishment({
          existingSession: input.currentSession ?? null,
          requestedSubjectRef: workingGrant.toSnapshot().subjectRef,
          requiredIdentityBindingRef: workingGrant.toSnapshot().issuedIdentityBindingRef,
          requiredSubjectBindingVersionRef:
            workingGrant.toSnapshot().issuedSubjectBindingVersionRef,
          requestedAuthorityState: requiredAuthorityStateForGrantFamily(workingGrant.grantFamily),
          decidedAt: input.recordedAt,
        });
      }
      if (sessionDecision.decision === "bounded_recovery") {
        decision = "recover";
        reasonCodes.push(...sessionDecision.reasonCodes, "SESSION_GOVERNOR_RECOVERY_REQUIRED");
      } else if (sessionDecision.decision === "deny") {
        decision = "deny";
        reasonCodes.push(...sessionDecision.reasonCodes, "SESSION_GOVERNOR_DENIED");
      }
    }

    let replacementGrant: AccessGrantDocument | null = null;
    let replacementScopeEnvelope: AccessGrantScopeEnvelopeDocument | null = null;
    if (input.replacementGrant) {
      const replacement = await this.issueGrantCore({
        ...input.replacementGrant,
        supersedesGrantRef: workingGrant.grantId,
      });
      replacementGrant = replacement.grant;
      replacementScopeEnvelope = replacement.scopeEnvelope;
    }

    let supersession: AccessGrantSupersessionRecordDocument | null = null;
    const stateAfterDecision = grantStateAfterRedemptionDecision({
      decision,
      grant: workingGrant.toSnapshot(),
      replacementGrantIssued: Boolean(replacementGrant),
    });
    if (
      replacementGrant ||
      stateAfterDecision === "rotated" ||
      stateAfterDecision === "superseded" ||
      stateAfterDecision === "expired" ||
      stateAfterDecision === "revoked"
    ) {
      supersession = AccessGrantSupersessionRecordDocument.create({
        supersessionId: nextIdentityAccessId(this.idGenerator, "accessGrantSupersession"),
        causeClass:
          input.supersessionCauseClass ??
          (decision === "step_up"
            ? "rotation"
            : decision === "recover"
              ? "route_drift"
              : "manual_revoke"),
        supersededGrantRefs: [workingGrant.grantId],
        replacementGrantRef: replacementGrant?.grantId ?? null,
        governingObjectRef: envelope.toSnapshot().governingObjectRef,
        lineageFenceEpoch: input.context.lineageFenceEpoch,
        sessionEpochRef: sessionDecision?.sessionEpochRef ?? input.context.sessionEpochRef ?? null,
        subjectBindingVersionRef: input.context.subjectBindingVersionRef ?? null,
        reasonCodes,
        recordedAt: input.recordedAt,
      });
      await this.repositories.saveAccessGrantSupersession(supersession);
      workingGrant = workingGrant.markSuperseded({
        supersessionRef: supersession.supersessionId,
        replacementGrantRef: replacementGrant?.grantId ?? null,
        nextState:
          stateAfterDecision === "rotated" ||
          stateAfterDecision === "superseded" ||
          stateAfterDecision === "revoked" ||
          stateAfterDecision === "expired"
            ? stateAfterDecision
            : "superseded",
        recordedAt: input.recordedAt,
        revocationReason:
          decision === "deny"
            ? reasonCodes.join(",")
            : stateAfterDecision === "expired"
              ? "expired"
              : null,
      });
      await this.repositories.saveAccessGrant(workingGrant, {
        expectedVersion:
          grant.replayPolicy === "one_time" || grant.replayPolicy === "rotating"
            ? grant.version + 1
            : grant.version,
      });
    }

    const redemption = AccessGrantRedemptionRecordDocument.create({
      redemptionId: nextIdentityAccessId(this.idGenerator, "accessGrantRedemption"),
      grantRef: grant.grantId,
      grantScopeEnvelopeRef: envelope.scopeEnvelopeId,
      requestContextHash,
      authorizationFenceHash: computeAuthorizationFenceHash(
        grant.toSnapshot(),
        envelope.toSnapshot(),
        input.context,
      ),
      decision,
      decisionReasonCodes: reasonCodes,
      grantStateAfterDecision: stateAfterDecision,
      resultingSessionRef: input.resultingSessionRef ?? sessionDecision?.resolvedSessionRef ?? null,
      resultingRouteIntentBindingRef:
        input.resultingRouteIntentBindingRef ?? input.context.routeIntentBindingRef ?? null,
      replacementGrantRef: replacementGrant?.grantId ?? null,
      supersessionRecordRef: supersession?.supersessionId ?? null,
      recoveryRouteRef: decision === "recover" ? envelope.toSnapshot().recoveryRouteRef : null,
      recordedAt: input.recordedAt,
    });
    await this.repositories.saveAccessGrantRedemption(redemption);

    if (!supersession) {
      const settledGrant = workingGrant.settleRedemption({
        grantState: stateAfterDecision,
        redemptionRef: redemption.redemptionId,
        recordedAt: input.recordedAt,
        revocationReason: decision === "deny" ? reasonCodes.join(",") : null,
      });
      await this.repositories.saveAccessGrant(settledGrant, {
        expectedVersion:
          grant.replayPolicy === "one_time" || grant.replayPolicy === "rotating"
            ? grant.version + 1
            : grant.version,
      });
      workingGrant = settledGrant;
    } else if (workingGrant.currentRedemptionRef === null && stateAfterDecision !== "superseded") {
      const settledGrant = workingGrant.settleRedemption({
        grantState: stateAfterDecision,
        redemptionRef: redemption.redemptionId,
        recordedAt: input.recordedAt,
      });
      await this.repositories.saveAccessGrant(settledGrant, {
        expectedVersion: workingGrant.version,
      });
      workingGrant = settledGrant;
    }

    return {
      replayed: false,
      grant: workingGrant,
      scopeEnvelope: replacementScopeEnvelope ?? envelope,
      redemption,
      supersession,
      replacementGrant,
      sessionDecision,
    };
  }

  async supersedeGrants(input: SupersedeAccessGrantInput): Promise<AccessGrantSupersessionResult> {
    invariant(
      input.supersededGrantRefs.length >= 1,
      "SUPERSEDE_GRANTS_EMPTY",
      "supersededGrantRefs must not be empty.",
    );
    const supersededGrants = await Promise.all(
      uniqueSortedRefs(input.supersededGrantRefs).map(async (grantRef) => {
        const grant = await this.repositories.getAccessGrant(grantRef);
        invariant(grant, "ACCESS_GRANT_NOT_FOUND", `Grant ${grantRef} was not found.`);
        return grant;
      }),
    );
    let replacementGrant: AccessGrantDocument | null = null;
    let replacementScopeEnvelope: AccessGrantScopeEnvelopeDocument | null = null;
    if (input.replacementGrant) {
      const issued = await this.issueGrantCore({
        ...input.replacementGrant,
        supersedesGrantRef:
          supersededGrants.length === 1 ? (supersededGrants.at(0)?.grantId ?? null) : null,
      });
      replacementGrant = issued.grant;
      replacementScopeEnvelope = issued.scopeEnvelope;
    }
    const supersession = AccessGrantSupersessionRecordDocument.create({
      supersessionId: nextIdentityAccessId(this.idGenerator, "accessGrantSupersession"),
      causeClass: input.causeClass,
      supersededGrantRefs: supersededGrants.map((grant) => grant.grantId),
      replacementGrantRef: replacementGrant?.grantId ?? null,
      governingObjectRef: requireRef(input.governingObjectRef, "governingObjectRef"),
      lineageFenceEpoch: input.lineageFenceEpoch,
      sessionEpochRef: input.sessionEpochRef ?? null,
      subjectBindingVersionRef: input.subjectBindingVersionRef ?? null,
      reasonCodes: input.reasonCodes ?? [],
      recordedAt: input.recordedAt,
    });
    await this.repositories.saveAccessGrantSupersession(supersession);
    const updatedGrants: AccessGrantDocument[] = [];
    for (const grant of supersededGrants) {
      const nextState: Extract<AccessGrantState, "rotated" | "superseded" | "revoked" | "expired"> =
        replacementGrant
          ? "rotated"
          : input.causeClass === "expiry_sweep"
            ? "expired"
            : input.causeClass === "manual_revoke" || input.causeClass === "logout"
              ? "revoked"
              : "superseded";
      const updatedGrant = grant.markSuperseded({
        supersessionRef: supersession.supersessionId,
        replacementGrantRef: replacementGrant?.grantId ?? null,
        nextState,
        recordedAt: input.recordedAt,
        revocationReason: input.reasonCodes?.join(",") ?? input.causeClass,
      });
      await this.repositories.saveAccessGrant(updatedGrant, { expectedVersion: grant.version });
      updatedGrants.push(updatedGrant);
    }
    return {
      supersession,
      supersededGrants: updatedGrants,
      replacementGrant,
      replacementScopeEnvelope,
    };
  }

  async rotateGrant(input: {
    priorGrantRef: string;
    recordedAt: string;
    lineageFenceEpoch: number;
    governingObjectRef: string;
    replacementGrant: ReplacementAccessGrantInput;
    reasonCodes?: readonly string[];
  }): Promise<AccessGrantReplaceResult> {
    const priorGrant = await this.repositories.getAccessGrant(input.priorGrantRef);
    invariant(priorGrant, "ACCESS_GRANT_NOT_FOUND", `Grant ${input.priorGrantRef} was not found.`);
    const supersession = await this.supersedeGrants({
      causeClass: "rotation",
      supersededGrantRefs: [input.priorGrantRef],
      governingObjectRef: input.governingObjectRef,
      lineageFenceEpoch: input.lineageFenceEpoch,
      reasonCodes: input.reasonCodes ?? ["ROTATION_REQUESTED"],
      recordedAt: input.recordedAt,
      replacementGrant: input.replacementGrant,
    });
    invariant(
      supersession.replacementGrant && supersession.replacementScopeEnvelope,
      "ROTATION_REQUIRES_REPLACEMENT",
      "rotateGrant requires a replacement grant.",
    );
    return {
      supersession: supersession.supersession,
      priorGrant,
      replacement: {
        outcome: "issued",
        scopeEnvelope: supersession.replacementScopeEnvelope,
        grant: supersession.replacementGrant,
        materializedToken: null,
      },
    };
  }

  async replaceGrant(input: {
    priorGrantRef: string;
    causeClass: Exclude<
      AccessGrantSupersessionCauseClass,
      "logout" | "manual_revoke" | "expiry_sweep"
    >;
    recordedAt: string;
    lineageFenceEpoch: number;
    governingObjectRef: string;
    replacementGrant: ReplacementAccessGrantInput;
    reasonCodes?: readonly string[];
  }): Promise<AccessGrantReplaceResult> {
    const priorGrant = await this.repositories.getAccessGrant(input.priorGrantRef);
    invariant(priorGrant, "ACCESS_GRANT_NOT_FOUND", `Grant ${input.priorGrantRef} was not found.`);
    const supersession = await this.supersedeGrants({
      causeClass: input.causeClass,
      supersededGrantRefs: [input.priorGrantRef],
      governingObjectRef: input.governingObjectRef,
      lineageFenceEpoch: input.lineageFenceEpoch,
      reasonCodes: input.reasonCodes ?? [input.causeClass.toUpperCase()],
      recordedAt: input.recordedAt,
      replacementGrant: input.replacementGrant,
    });
    invariant(
      supersession.replacementGrant && supersession.replacementScopeEnvelope,
      "REPLACEMENT_REQUIRES_NEW_GRANT",
      "replaceGrant requires a replacement grant.",
    );
    return {
      supersession: supersession.supersession,
      priorGrant,
      replacement: {
        outcome: "issued",
        scopeEnvelope: supersession.replacementScopeEnvelope,
        grant: supersession.replacementGrant,
        materializedToken: null,
      },
    };
  }

  async revokeGrant(input: {
    grantRef: string;
    governingObjectRef: string;
    lineageFenceEpoch: number;
    causeClass?: "logout" | "manual_revoke" | "identity_repair";
    reasonCodes?: readonly string[];
    recordedAt: string;
  }): Promise<AccessGrantRevokeResult> {
    const grant = await this.repositories.getAccessGrant(input.grantRef);
    invariant(grant, "ACCESS_GRANT_NOT_FOUND", `Grant ${input.grantRef} was not found.`);
    const supersession = await this.supersedeGrants({
      causeClass: input.causeClass ?? "manual_revoke",
      supersededGrantRefs: [input.grantRef],
      governingObjectRef: input.governingObjectRef,
      lineageFenceEpoch: input.lineageFenceEpoch,
      reasonCodes: input.reasonCodes ?? ["GRANT_REVOKED"],
      recordedAt: input.recordedAt,
    });
    const revokedGrant = supersession.supersededGrants[0] ?? grant;
    return {
      supersession: supersession.supersession,
      revokedGrant,
    };
  }
}

export function createAccessGrantService(
  repositories: IdentityAccessDependencies,
  idGenerator: BackboneIdGenerator,
  options?: AccessGrantServiceOptions,
): AccessGrantService {
  return new AccessGrantService(repositories, idGenerator, options);
}

export interface IdentityAccessLedgerIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  reference: string;
}

export async function validateIdentityAccessLedgerState(
  repositories: IdentityAccessDependencies,
): Promise<readonly IdentityAccessLedgerIssue[]> {
  const issues: IdentityAccessLedgerIssue[] = [];
  const requests = await repositories.listRequests();
  const episodes = await repositories.listEpisodes();
  const bindings = await repositories.listIdentityBindings();
  const links = await repositories.listPatientLinks();
  const envelopes = await repositories.listAccessGrantScopeEnvelopes();
  const grants = await repositories.listAccessGrants();
  const redemptions = await repositories.listAccessGrantRedemptions();

  const bindingsById = new Map(bindings.map((binding) => [binding.bindingId, binding]));
  for (const request of requests) {
    const snapshot = request.toSnapshot();
    if (snapshot.patientRef && !snapshot.currentIdentityBindingRef) {
      issues.push({
        code: "PATIENT_REF_OUTSIDE_IDENTITY_BINDING",
        severity: "error",
        message: "Request.patientRef was set without currentIdentityBindingRef.",
        reference: `request:${snapshot.requestId}`,
      });
    }
    if (snapshot.currentIdentityBindingRef) {
      const binding = bindingsById.get(snapshot.currentIdentityBindingRef);
      if (!binding) {
        issues.push({
          code: "MISSING_REQUEST_IDENTITY_BINDING",
          severity: "error",
          message: "Request references a missing IdentityBinding.",
          reference: `request:${snapshot.requestId}`,
        });
      } else {
        const bindingSnapshot = binding.toSnapshot();
        if (snapshot.patientRef !== bindingSnapshot.patientRef) {
          issues.push({
            code: "REQUEST_PATIENT_REF_DRIFT",
            severity: "error",
            message: "Request.patientRef drifted from the latest bound IdentityBinding.patientRef.",
            reference: `request:${snapshot.requestId}`,
          });
        }
      }
    }
  }
  for (const episode of episodes) {
    const snapshot = episode.toSnapshot();
    if (snapshot.patientRef && !snapshot.currentIdentityBindingRef) {
      issues.push({
        code: "EPISODE_PATIENT_REF_OUTSIDE_IDENTITY_BINDING",
        severity: "error",
        message: "Episode.patientRef was set without currentIdentityBindingRef.",
        reference: `episode:${snapshot.episodeId}`,
      });
    }
    if (snapshot.currentIdentityBindingRef) {
      const binding = bindingsById.get(snapshot.currentIdentityBindingRef);
      if (!binding) {
        issues.push({
          code: "MISSING_EPISODE_IDENTITY_BINDING",
          severity: "error",
          message: "Episode references a missing IdentityBinding.",
          reference: `episode:${snapshot.episodeId}`,
        });
      } else if (snapshot.patientRef !== binding.toSnapshot().patientRef) {
        issues.push({
          code: "EPISODE_PATIENT_REF_DRIFT",
          severity: "error",
          message: "Episode.patientRef drifted from the latest bound IdentityBinding.patientRef.",
          reference: `episode:${snapshot.episodeId}`,
        });
      }
    }
  }

  const envelopeById = new Map(envelopes.map((envelope) => [envelope.scopeEnvelopeId, envelope]));
  for (const grant of grants) {
    const snapshot = grant.toSnapshot();
    const envelope = envelopeById.get(snapshot.grantScopeEnvelopeRef);
    if (!envelope) {
      issues.push({
        code: "MISSING_GRANT_SCOPE_ENVELOPE",
        severity: "error",
        message: "AccessGrant references a missing AccessGrantScopeEnvelope.",
        reference: `grant:${snapshot.grantId}`,
      });
      continue;
    }
    const envelopeSnapshot = envelope.toSnapshot();
    if (
      snapshot.routeFamilyRef !== envelopeSnapshot.routeFamilyRef ||
      snapshot.actionScope !== envelopeSnapshot.actionScope ||
      snapshot.lineageScope !== envelopeSnapshot.lineageScope ||
      snapshot.requiredAudienceSurfaceRuntimeBindingRef !==
        envelopeSnapshot.requiredAudienceSurfaceRuntimeBindingRef ||
      snapshot.requiredReleaseApprovalFreezeRef !==
        envelopeSnapshot.requiredReleaseApprovalFreezeRef ||
      snapshot.requiredChannelReleaseFreezeRef !==
        envelopeSnapshot.requiredChannelReleaseFreezeRef ||
      snapshot.issuedRouteIntentBindingRef !== envelopeSnapshot.issuedRouteIntentBindingRef ||
      snapshot.issuedIdentityBindingRef !== envelopeSnapshot.requiredIdentityBindingRef
    ) {
      issues.push({
        code: "GRANT_SCOPE_WIDENING_DETECTED",
        severity: "error",
        message:
          "AccessGrant widened or drifted from its immutable AccessGrantScopeEnvelope contract.",
        reference: `grant:${snapshot.grantId}`,
      });
    }
    if (
      (snapshot.replayPolicy === "one_time" || snapshot.replayPolicy === "rotating") &&
      redemptions.filter((redemption) => redemption.toSnapshot().grantRef === snapshot.grantId)
        .length > 1
    ) {
      issues.push({
        code: "GRANT_REDEEMED_TWICE",
        severity: "error",
        message: "A one-time or rotating AccessGrant has more than one redemption record.",
        reference: `grant:${snapshot.grantId}`,
      });
    }
    if (
      snapshot.latestSupersessionRef &&
      (snapshot.grantState === "live" || snapshot.grantState === "redeeming")
    ) {
      issues.push({
        code: "SUPERSEDED_GRANT_STILL_LIVE",
        severity: "error",
        message: "A superseded AccessGrant remains live or redeeming.",
        reference: `grant:${snapshot.grantId}`,
      });
    }
  }

  for (const link of links) {
    const snapshot = link.toSnapshot();
    const binding = bindingsById.get(snapshot.identityBindingRef);
    if (!binding) {
      issues.push({
        code: "PATIENT_LINK_WITHOUT_BINDING",
        severity: "error",
        message: "PatientLink references a missing IdentityBinding.",
        reference: `patientLink:${snapshot.patientLinkId}`,
      });
      continue;
    }
    const bindingSnapshot = binding.toSnapshot();
    if (snapshot.subjectRef !== bindingSnapshot.subjectRef) {
      issues.push({
        code: "PATIENT_LINK_SUBJECT_DRIFT",
        severity: "error",
        message: "PatientLink.subjectRef drifted from the bound IdentityBinding subject.",
        reference: `patientLink:${snapshot.patientLinkId}`,
      });
    }
  }

  return issues;
}
