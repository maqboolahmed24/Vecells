import { createHash, randomUUID } from "node:crypto";

export const authBridgePersistenceTables = [
  "auth_scope_bundles",
  "post_auth_return_intents",
  "auth_transactions",
  "auth_callback_settlements",
  "auth_provider_token_exchanges",
] as const;

export const authBridgeMigrationPlanRefs = [
  "services/command-api/migrations/090_phase2_auth_bridge.sql",
] as const;

export const authBridgeParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_BRIDGE_ISOLATED_OIDC_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_TRANSACTION_FENCE_CAS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_RETURN_INTENT_ONLY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_SESSION_GOVERNOR_PORT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_EVIDENCE_VAULT_ONLY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_REPLAY_EXACT_ONCE_V1",
] as const;

export type AuthProviderMode = "nhs_login_simulator" | "nhs_login_live";
export type AuthFlow = "server_authorization_code_pkce";
export type AuthRequestedScope = "openid" | "profile" | "email" | "nhs_login_identity";
export type AuthAssuranceRequirement = "nhs_low" | "nhs_p9" | "nhs_p5_plus";
export type AuthLifecycleState =
  | "initialized"
  | "authorize_redirect_issued"
  | "callback_received"
  | "callback_consumed"
  | "token_validated"
  | "session_decision_emitted"
  | "settled_success"
  | "settled_recovery"
  | "settled_denied"
  | "expired"
  | "replayed"
  | "failed_validation";
export type AuthConsumptionState = "unconsumed" | "consumed" | "expired" | "replayed" | "invalid";
export type AuthCallbackOutcome =
  | "pending"
  | "success"
  | "consent_declined"
  | "insufficient_assurance"
  | "expired_transaction"
  | "replayed_callback"
  | "token_validation_failure"
  | "linkage_unavailable"
  | "internal_fallback";
export type AuthAllowedNextSurface =
  | "signed_in_track_request"
  | "signed_in_intake_resume"
  | "identity_repair"
  | "session_recovery"
  | "anonymous_return";
export type AuthStaleDisposition =
  | "recover_with_same_route_family"
  | "recover_to_identity_repair"
  | "deny_and_restart";

export interface AuthScopeBundle {
  readonly scopeBundleId: string;
  readonly requestedScopes: readonly AuthRequestedScope[];
  readonly assuranceRequirement: AuthAssuranceRequirement;
  readonly rawClaimStorageRule: "vault_reference_only";
  readonly offlineAccessPolicy: "offline_access_forbidden";
  readonly createdAt: string;
}

export interface PostAuthReturnIntent {
  readonly returnIntentId: string;
  readonly routeIntentBindingRef: string;
  readonly lineageRef: string;
  readonly routeFamilyRef: string;
  readonly subjectRef: string | null;
  readonly bindingVersionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly channelManifestRef: string;
  readonly selectedAnchorRef: string;
  readonly allowedNextSurface: AuthAllowedNextSurface;
  readonly redirectMode: "route_intent_binding_only";
  readonly staleDisposition: AuthStaleDisposition;
  readonly createdAt: string;
}

export interface AuthTransaction {
  readonly transactionId: string;
  readonly providerMode: AuthProviderMode;
  readonly flow: AuthFlow;
  readonly lifecycle: AuthLifecycleState;
  readonly consumptionState: AuthConsumptionState;
  readonly authScopeBundleRef: string;
  readonly postAuthReturnIntentRef: string;
  readonly stateDigest: string;
  readonly nonceDigest: string;
  readonly codeVerifierDigest: string;
  readonly codeChallenge: string;
  readonly redirectUri: string;
  readonly providerIssuer: string;
  readonly transactionFenceEpoch: number;
  readonly version: number;
  readonly callbackOutcome: AuthCallbackOutcome;
  readonly firstConsumedAt: string | null;
  readonly tokenEvidenceRef: string | null;
  readonly settlementRef: string | null;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly updatedAt: string;
}

export interface AuthCallbackSettlement {
  readonly settlementId: string;
  readonly transactionId: string;
  readonly outcome: AuthCallbackOutcome;
  readonly lifecycleAfter: AuthLifecycleState;
  readonly consumptionStateAfter: AuthConsumptionState;
  readonly reasonCodes: readonly string[];
  readonly evidenceVaultRef: string | null;
  readonly bindingIntentRef: string | null;
  readonly capabilityIntentRef: string | null;
  readonly sessionGovernorDecisionRef: string | null;
  readonly postAuthReturnIntentRef: string;
  readonly replayOfSettlementRef: string | null;
  readonly createdAt: string;
}

export interface AuthProviderTokenExchangeRecord {
  readonly exchangeId: string;
  readonly transactionId: string;
  readonly providerMode: AuthProviderMode;
  readonly outcome: "token_validated" | "token_rejected";
  readonly providerIssuer: string;
  readonly reasonCodes: readonly string[];
  readonly recordedAt: string;
}

export interface AuthBridgeCallbackResult {
  readonly transaction: AuthTransaction | null;
  readonly scopeBundle: AuthScopeBundle | null;
  readonly returnIntent: PostAuthReturnIntent | null;
  readonly settlement: AuthCallbackSettlement;
  readonly replayed: boolean;
  readonly sideEffects: {
    readonly evidenceVaultWrite: boolean;
    readonly bindingIntentWrite: boolean;
    readonly capabilityIntentWrite: boolean;
    readonly sessionGovernorCall: boolean;
    readonly directSessionWrite: false;
    readonly requestPatientReferenceWrite: false;
    readonly episodePatientReferenceWrite: false;
  };
}

export interface BeginAuthorizeInput {
  readonly routeIntentBindingRef: string;
  readonly lineageRef: string;
  readonly routeFamilyRef: string;
  readonly subjectRef?: string | null;
  readonly bindingVersionRef?: string | null;
  readonly sessionEpochRef?: string | null;
  readonly channelManifestRef: string;
  readonly selectedAnchorRef: string;
  readonly allowedNextSurface?: AuthAllowedNextSurface;
  readonly staleDisposition?: AuthStaleDisposition;
  readonly requestedScopes?: readonly AuthRequestedScope[];
  readonly assuranceRequirement?: AuthAssuranceRequirement;
  readonly providerMode?: AuthProviderMode;
  readonly issuedAt?: string;
  readonly ttlSeconds?: number;
}

export interface BeginAuthorizeResult {
  readonly authorizeUrl: string;
  readonly stateToken: string;
  readonly transaction: AuthTransaction;
  readonly scopeBundle: AuthScopeBundle;
  readonly returnIntent: PostAuthReturnIntent;
}

export interface AuthCallbackInput {
  readonly state: string;
  readonly code?: string;
  readonly error?: string;
  readonly errorDescription?: string;
  readonly redirectUri: string;
  readonly observedAt?: string;
}

export interface AuthBridgeRepository {
  saveScopeBundle(scopeBundle: AuthScopeBundle): Promise<void>;
  saveReturnIntent(returnIntent: PostAuthReturnIntent): Promise<void>;
  saveTransaction(transaction: AuthTransaction): Promise<void>;
  findTransactionByStateDigest(stateDigest: string): Promise<AuthTransaction | undefined>;
  getScopeBundle(scopeBundleId: string): Promise<AuthScopeBundle | undefined>;
  getReturnIntent(returnIntentId: string): Promise<PostAuthReturnIntent | undefined>;
  compareAndSetTransaction(input: {
    readonly transactionId: string;
    readonly expectedVersion: number;
    readonly allowedConsumptionStates: readonly AuthConsumptionState[];
    readonly patch: TransactionPatch;
  }): Promise<{ readonly ok: boolean; readonly transaction: AuthTransaction | undefined }>;
  saveCallbackSettlement(settlement: AuthCallbackSettlement): Promise<void>;
  findSettlementByTransactionId(transactionId: string): Promise<AuthCallbackSettlement | undefined>;
  appendProviderTokenExchange(record: AuthProviderTokenExchangeRecord): Promise<void>;
}

export interface TransactionPatch {
  readonly lifecycle: AuthLifecycleState;
  readonly consumptionState: AuthConsumptionState;
  readonly callbackOutcome: AuthCallbackOutcome;
  readonly firstConsumedAt?: string | null;
  readonly tokenEvidenceRef?: string | null;
  readonly settlementRef?: string | null;
  readonly updatedAt: string;
}

export interface IdentityEvidenceVaultPort {
  writeAuthClaimSnapshot(input: {
    readonly transactionId: string;
    readonly providerMode: AuthProviderMode;
    readonly issuer: string;
    readonly subjectRef: string;
    readonly rawClaims: Record<string, unknown>;
    readonly rawTokenEnvelope: SimulatorTokenEnvelope;
    readonly storageRule: "vault_reference_only";
    readonly recordedAt: string;
  }): Promise<{ readonly evidenceRef: string }>;
}

export interface IdentityBindingAuthorityPort {
  submitBindingIntent(input: {
    readonly transactionId: string;
    readonly subjectRef: string;
    readonly evidenceVaultRef: string;
    readonly assuranceRequirement: AuthAssuranceRequirement;
    readonly routeIntentBindingRef: string;
    readonly recordedAt: string;
  }): Promise<{ readonly bindingIntentRef: string }>;
}

export interface CapabilityDecisionPort {
  prepareCapabilityIntent(input: {
    readonly transactionId: string;
    readonly subjectRef: string;
    readonly authScopeBundleRef: string;
    readonly postAuthReturnIntentRef: string;
    readonly bindingIntentRef: string;
    readonly recordedAt: string;
  }): Promise<{ readonly capabilityIntentRef: string }>;
}

export interface SessionGovernorPort {
  settleSessionEstablishment(input: {
    readonly transactionId: string;
    readonly subjectRef: string;
    readonly evidenceVaultRef: string;
    readonly bindingIntentRef: string;
    readonly capabilityIntentRef: string;
    readonly postAuthReturnIntent: PostAuthReturnIntent;
    readonly requestedAt: string;
  }): Promise<{ readonly sessionGovernorDecisionRef: string }>;
}

export interface AuthBridgePorts {
  readonly evidenceVault: IdentityEvidenceVaultPort;
  readonly bindingAuthority: IdentityBindingAuthorityPort;
  readonly capabilityDecision: CapabilityDecisionPort;
  readonly sessionGovernor: SessionGovernorPort;
}

export interface OidcDiscoveryMetadata {
  readonly issuer: string;
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  readonly jwksUri: string;
  readonly codeChallengeMethodsSupported: readonly ["S256"];
  readonly jwks: {
    readonly keys: readonly { readonly kid: string; readonly alg: "RS256"; readonly use: "sig" }[];
  };
}

export interface SimulatorTokenEnvelope {
  readonly header: {
    readonly alg: "RS256";
    readonly kid: string;
    readonly typ: "JWT";
  };
  readonly claims: Record<string, unknown>;
  readonly signature: string;
}

export interface TokenExchangeInput {
  readonly transaction: AuthTransaction;
  readonly scopeBundle: AuthScopeBundle;
  readonly code: string;
  readonly codeVerifier: string;
  readonly observedAt: string;
}

export interface TokenValidationInput {
  readonly transaction: AuthTransaction;
  readonly scopeBundle: AuthScopeBundle;
  readonly tokenEnvelope: SimulatorTokenEnvelope;
  readonly nonceToken: string;
  readonly observedAt: string;
}

export interface ValidatedTokenEnvelope {
  readonly subjectRef: string;
  readonly issuer: string;
  readonly rawClaims: Record<string, unknown>;
  readonly rawTokenEnvelope: SimulatorTokenEnvelope;
}

export interface NhsLoginOidcAdapter {
  discover(): Promise<OidcDiscoveryMetadata>;
  buildAuthorizeUrl(input: {
    readonly transaction: AuthTransaction;
    readonly scopeBundle: AuthScopeBundle;
    readonly returnIntent: PostAuthReturnIntent;
    readonly stateToken: string;
    readonly nonceToken: string;
  }): Promise<string>;
  exchangeCode(input: TokenExchangeInput): Promise<SimulatorTokenEnvelope>;
  validateTokenEnvelope(input: TokenValidationInput): Promise<ValidatedTokenEnvelope>;
}

export interface AuthBridgeService {
  beginAuthorize(input: BeginAuthorizeInput): Promise<BeginAuthorizeResult>;
  settleCallback(input: AuthCallbackInput): Promise<AuthBridgeCallbackResult>;
}

export interface AuthBridgeApplication {
  readonly authBridge: AuthBridgeService;
  readonly repositories: AuthBridgeRepository;
  readonly ports: AuthBridgePorts;
  readonly oidcAdapter: NhsLoginOidcAdapter;
  readonly migrationPlanRef: (typeof authBridgeMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof authBridgeMigrationPlanRefs;
  readonly persistenceTables: typeof authBridgePersistenceTables;
  readonly parallelInterfaceGaps: typeof authBridgeParallelInterfaceGaps;
}

interface RuntimeOidcSecretRecord {
  readonly codeVerifier: string;
  readonly nonceToken: string;
}

const DEFAULT_REDIRECT_URI = "https://patient.vecells.local/auth/nhs/callback";
const DEFAULT_CLIENT_ID = "vecells-command-api";
const DEFAULT_PROVIDER_ISSUER = "https://auth.login.nhs.uk";

function digestSecret(namespace: string, value: string): string {
  return createHash("sha256").update(`${namespace}:${value}`).digest("hex");
}

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function codeChallengeFromVerifier(codeVerifier: string): string {
  return toBase64Url(createHash("sha256").update(codeVerifier).digest());
}

function makeToken(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addSeconds(isoTimestamp: string, seconds: number): string {
  return new Date(new Date(isoTimestamp).getTime() + seconds * 1000).toISOString();
}

function cloneScopeBundle(scopeBundle: AuthScopeBundle): AuthScopeBundle {
  return Object.freeze({
    ...scopeBundle,
    requestedScopes: Object.freeze([...scopeBundle.requestedScopes]),
  });
}

function cloneReturnIntent(returnIntent: PostAuthReturnIntent): PostAuthReturnIntent {
  return Object.freeze({ ...returnIntent });
}

function cloneTransaction(transaction: AuthTransaction): AuthTransaction {
  return Object.freeze({ ...transaction });
}

function cloneSettlement(settlement: AuthCallbackSettlement): AuthCallbackSettlement {
  return Object.freeze({
    ...settlement,
    reasonCodes: Object.freeze([...settlement.reasonCodes]),
  });
}

function cloneTokenExchange(
  exchange: AuthProviderTokenExchangeRecord,
): AuthProviderTokenExchangeRecord {
  return Object.freeze({
    ...exchange,
    reasonCodes: Object.freeze([...exchange.reasonCodes]),
  });
}

function uniqueScopes(scopes: readonly AuthRequestedScope[]): readonly AuthRequestedScope[] {
  const normalized = scopes.length === 0 ? defaultRequestedScopes() : scopes;
  const seen = new Set<AuthRequestedScope>();
  const result: AuthRequestedScope[] = [];
  for (const scope of normalized) {
    if (!seen.has(scope)) {
      seen.add(scope);
      result.push(scope);
    }
  }
  if (!seen.has("openid")) {
    result.unshift("openid");
  }
  return Object.freeze(result);
}

function defaultRequestedScopes(): readonly AuthRequestedScope[] {
  return Object.freeze(["openid", "profile", "email", "nhs_login_identity"] as const);
}

function assuranceRank(assurance: AuthAssuranceRequirement | string): number {
  if (assurance === "nhs_p9" || assurance === "P9") {
    return 3;
  }
  if (assurance === "nhs_p5_plus" || assurance === "P5") {
    return 2;
  }
  if (assurance === "nhs_low" || assurance === "P0") {
    return 1;
  }
  return 0;
}

function callbackErrorToOutcome(error: string | undefined): AuthCallbackOutcome {
  if (error === "access_denied" || error === "consent_declined") {
    return "consent_declined";
  }
  if (error === "insufficient_assurance") {
    return "insufficient_assurance";
  }
  if (error === "linkage_unavailable") {
    return "linkage_unavailable";
  }
  return "internal_fallback";
}

function outcomeToLifecycle(outcome: AuthCallbackOutcome): AuthLifecycleState {
  if (outcome === "success") {
    return "settled_success";
  }
  if (outcome === "expired_transaction") {
    return "expired";
  }
  if (outcome === "replayed_callback") {
    return "replayed";
  }
  if (outcome === "token_validation_failure") {
    return "failed_validation";
  }
  if (outcome === "consent_declined" || outcome === "insufficient_assurance") {
    return "settled_denied";
  }
  return "settled_recovery";
}

function outcomeToConsumption(outcome: AuthCallbackOutcome): AuthConsumptionState {
  if (outcome === "expired_transaction") {
    return "expired";
  }
  if (outcome === "replayed_callback") {
    return "replayed";
  }
  if (outcome === "token_validation_failure" || outcome === "internal_fallback") {
    return "invalid";
  }
  return "consumed";
}

function createSettlement(input: {
  readonly transaction: AuthTransaction | null;
  readonly outcome: AuthCallbackOutcome;
  readonly reasonCodes: readonly string[];
  readonly returnIntentRef: string;
  readonly evidenceVaultRef?: string | null;
  readonly bindingIntentRef?: string | null;
  readonly capabilityIntentRef?: string | null;
  readonly sessionGovernorDecisionRef?: string | null;
  readonly replayOfSettlementRef?: string | null;
  readonly createdAt: string;
}): AuthCallbackSettlement {
  const transactionId = input.transaction?.transactionId ?? "auth_transaction_unresolved";
  const lifecycleAfter = outcomeToLifecycle(input.outcome);
  const consumptionStateAfter = outcomeToConsumption(input.outcome);
  return cloneSettlement({
    settlementId: `auth_settlement_${transactionId}_${digestSecret(
      "auth-settlement",
      `${input.outcome}:${input.createdAt}:${input.replayOfSettlementRef ?? "first"}`,
    ).slice(0, 16)}`,
    transactionId,
    outcome: input.outcome,
    lifecycleAfter,
    consumptionStateAfter,
    reasonCodes: Object.freeze([...input.reasonCodes]),
    evidenceVaultRef: input.evidenceVaultRef ?? null,
    bindingIntentRef: input.bindingIntentRef ?? null,
    capabilityIntentRef: input.capabilityIntentRef ?? null,
    sessionGovernorDecisionRef: input.sessionGovernorDecisionRef ?? null,
    postAuthReturnIntentRef: input.returnIntentRef,
    replayOfSettlementRef: input.replayOfSettlementRef ?? null,
    createdAt: input.createdAt,
  });
}

function buildCallbackResult(input: {
  readonly transaction: AuthTransaction | null;
  readonly scopeBundle: AuthScopeBundle | null;
  readonly returnIntent: PostAuthReturnIntent | null;
  readonly settlement: AuthCallbackSettlement;
  readonly replayed: boolean;
}): AuthBridgeCallbackResult {
  return Object.freeze({
    transaction: input.transaction,
    scopeBundle: input.scopeBundle,
    returnIntent: input.returnIntent,
    settlement: input.settlement,
    replayed: input.replayed,
    sideEffects: Object.freeze({
      evidenceVaultWrite: input.settlement.evidenceVaultRef !== null && !input.replayed,
      bindingIntentWrite: input.settlement.bindingIntentRef !== null && !input.replayed,
      capabilityIntentWrite: input.settlement.capabilityIntentRef !== null && !input.replayed,
      sessionGovernorCall: input.settlement.sessionGovernorDecisionRef !== null && !input.replayed,
      directSessionWrite: false,
      requestPatientReferenceWrite: false,
      episodePatientReferenceWrite: false,
    }),
  });
}

export function createInMemoryAuthBridgeRepository(): AuthBridgeRepository & {
  readonly snapshots: () => {
    readonly scopeBundles: readonly AuthScopeBundle[];
    readonly returnIntents: readonly PostAuthReturnIntent[];
    readonly transactions: readonly AuthTransaction[];
    readonly settlements: readonly AuthCallbackSettlement[];
    readonly tokenExchanges: readonly AuthProviderTokenExchangeRecord[];
  };
} {
  const scopeBundles = new Map<string, AuthScopeBundle>();
  const returnIntents = new Map<string, PostAuthReturnIntent>();
  const transactions = new Map<string, AuthTransaction>();
  const transactionsByStateDigest = new Map<string, string>();
  const settlements = new Map<string, AuthCallbackSettlement>();
  const settlementsByTransactionId = new Map<string, string>();
  const tokenExchanges: AuthProviderTokenExchangeRecord[] = [];

  return {
    async saveScopeBundle(scopeBundle) {
      scopeBundles.set(scopeBundle.scopeBundleId, cloneScopeBundle(scopeBundle));
    },
    async saveReturnIntent(returnIntent) {
      returnIntents.set(returnIntent.returnIntentId, cloneReturnIntent(returnIntent));
    },
    async saveTransaction(transaction) {
      const snapshot = cloneTransaction(transaction);
      transactions.set(snapshot.transactionId, snapshot);
      transactionsByStateDigest.set(snapshot.stateDigest, snapshot.transactionId);
    },
    async findTransactionByStateDigest(stateDigest) {
      const transactionId = transactionsByStateDigest.get(stateDigest);
      if (!transactionId) {
        return undefined;
      }
      const transaction = transactions.get(transactionId);
      return transaction ? cloneTransaction(transaction) : undefined;
    },
    async getScopeBundle(scopeBundleId) {
      const scopeBundle = scopeBundles.get(scopeBundleId);
      return scopeBundle ? cloneScopeBundle(scopeBundle) : undefined;
    },
    async getReturnIntent(returnIntentId) {
      const returnIntent = returnIntents.get(returnIntentId);
      return returnIntent ? cloneReturnIntent(returnIntent) : undefined;
    },
    async compareAndSetTransaction(input) {
      const existing = transactions.get(input.transactionId);
      if (!existing || existing.version !== input.expectedVersion) {
        return { ok: false, transaction: existing ? cloneTransaction(existing) : undefined };
      }
      if (!input.allowedConsumptionStates.includes(existing.consumptionState)) {
        return { ok: false, transaction: cloneTransaction(existing) };
      }
      const next = cloneTransaction({
        ...existing,
        lifecycle: input.patch.lifecycle,
        consumptionState: input.patch.consumptionState,
        callbackOutcome: input.patch.callbackOutcome,
        firstConsumedAt:
          input.patch.firstConsumedAt === undefined
            ? existing.firstConsumedAt
            : input.patch.firstConsumedAt,
        tokenEvidenceRef:
          input.patch.tokenEvidenceRef === undefined
            ? existing.tokenEvidenceRef
            : input.patch.tokenEvidenceRef,
        settlementRef:
          input.patch.settlementRef === undefined
            ? existing.settlementRef
            : input.patch.settlementRef,
        updatedAt: input.patch.updatedAt,
        version: existing.version + 1,
      });
      transactions.set(next.transactionId, next);
      return { ok: true, transaction: cloneTransaction(next) };
    },
    async saveCallbackSettlement(settlement) {
      if (settlementsByTransactionId.has(settlement.transactionId)) {
        return;
      }
      const snapshot = cloneSettlement(settlement);
      settlements.set(snapshot.settlementId, snapshot);
      settlementsByTransactionId.set(snapshot.transactionId, snapshot.settlementId);
    },
    async findSettlementByTransactionId(transactionId) {
      const settlementId = settlementsByTransactionId.get(transactionId);
      if (!settlementId) {
        return undefined;
      }
      const settlement = settlements.get(settlementId);
      return settlement ? cloneSettlement(settlement) : undefined;
    },
    async appendProviderTokenExchange(record) {
      tokenExchanges.push(cloneTokenExchange(record));
    },
    snapshots() {
      return Object.freeze({
        scopeBundles: Object.freeze([...scopeBundles.values()].map(cloneScopeBundle)),
        returnIntents: Object.freeze([...returnIntents.values()].map(cloneReturnIntent)),
        transactions: Object.freeze([...transactions.values()].map(cloneTransaction)),
        settlements: Object.freeze([...settlements.values()].map(cloneSettlement)),
        tokenExchanges: Object.freeze(tokenExchanges.map(cloneTokenExchange)),
      });
    },
  };
}

export function createRecordingAuthBridgePorts(): AuthBridgePorts & {
  readonly snapshots: () => {
    readonly evidenceWrites: readonly unknown[];
    readonly bindingWrites: readonly unknown[];
    readonly capabilityWrites: readonly unknown[];
    readonly sessionGovernorCalls: readonly unknown[];
  };
} {
  const evidenceWrites: unknown[] = [];
  const bindingWrites: unknown[] = [];
  const capabilityWrites: unknown[] = [];
  const sessionGovernorCalls: unknown[] = [];

  return {
    evidenceVault: {
      async writeAuthClaimSnapshot(input) {
        evidenceWrites.push(Object.freeze({ ...input }));
        return {
          evidenceRef: `auth_claim_snapshot_${input.transactionId}_${evidenceWrites.length}`,
        };
      },
    },
    bindingAuthority: {
      async submitBindingIntent(input) {
        bindingWrites.push(Object.freeze({ ...input }));
        return {
          bindingIntentRef: `identity_binding_intent_${input.transactionId}_${bindingWrites.length}`,
        };
      },
    },
    capabilityDecision: {
      async prepareCapabilityIntent(input) {
        capabilityWrites.push(Object.freeze({ ...input }));
        return {
          capabilityIntentRef: `capability_intent_${input.transactionId}_${capabilityWrites.length}`,
        };
      },
    },
    sessionGovernor: {
      async settleSessionEstablishment(input) {
        sessionGovernorCalls.push(Object.freeze({ ...input }));
        return {
          sessionGovernorDecisionRef: `session_governor_decision_${input.transactionId}_${sessionGovernorCalls.length}`,
        };
      },
    },
    snapshots() {
      return Object.freeze({
        evidenceWrites: Object.freeze([...evidenceWrites]),
        bindingWrites: Object.freeze([...bindingWrites]),
        capabilityWrites: Object.freeze([...capabilityWrites]),
        sessionGovernorCalls: Object.freeze([...sessionGovernorCalls]),
      });
    },
  };
}

export function createSimulatorNhsLoginOidcAdapter(options?: {
  readonly clientId?: string;
  readonly redirectUri?: string;
  readonly issuer?: string;
  readonly authorizationEndpoint?: string;
  readonly tokenEndpoint?: string;
  readonly jwksUri?: string;
}): NhsLoginOidcAdapter {
  const clientId = options?.clientId ?? DEFAULT_CLIENT_ID;
  const redirectUri = options?.redirectUri ?? DEFAULT_REDIRECT_URI;
  const issuer = options?.issuer ?? DEFAULT_PROVIDER_ISSUER;
  const authorizationEndpoint =
    options?.authorizationEndpoint ?? "https://auth.login.nhs.uk/authorize";
  const tokenEndpoint = options?.tokenEndpoint ?? "https://auth.login.nhs.uk/token";
  const jwksUri = options?.jwksUri ?? "https://auth.login.nhs.uk/.well-known/jwks.json";
  const keyId = "nhs-login-simulator-rs256-2026";

  return {
    async discover() {
      return Object.freeze({
        issuer,
        authorizationEndpoint,
        tokenEndpoint,
        jwksUri,
        codeChallengeMethodsSupported: Object.freeze(["S256"] as const),
        jwks: Object.freeze({
          keys: Object.freeze([
            Object.freeze({ kid: keyId, alg: "RS256" as const, use: "sig" as const }),
          ]),
        }),
      });
    },
    async buildAuthorizeUrl(input) {
      if (input.transaction.redirectUri !== redirectUri) {
        throw new Error("AUTH_BRIDGE_REDIRECT_URI_NOT_ALLOWLISTED");
      }
      if (input.returnIntent.redirectMode !== "route_intent_binding_only") {
        throw new Error("AUTH_BRIDGE_RETURN_INTENT_REDIRECT_MODE_INVALID");
      }
      const discovery = await this.discover();
      const url = new URL(discovery.authorizationEndpoint);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", input.transaction.redirectUri);
      url.searchParams.set("scope", input.scopeBundle.requestedScopes.join(" "));
      url.searchParams.set("state", input.stateToken);
      url.searchParams.set("nonce", input.nonceToken);
      url.searchParams.set("code_challenge", input.transaction.codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("auth_scope_bundle_ref", input.scopeBundle.scopeBundleId);
      url.searchParams.set("post_auth_return_intent_ref", input.returnIntent.returnIntentId);
      return url.toString();
    },
    async exchangeCode(input) {
      if (
        input.transaction.codeVerifierDigest !== digestSecret("pkce-verifier", input.codeVerifier)
      ) {
        throw new Error("AUTH_BRIDGE_PKCE_VERIFIER_MISMATCH");
      }
      if (input.code === "simulator_invalid_signature") {
        return {
          header: { alg: "RS256", kid: "wrong-kid", typ: "JWT" },
          claims: {
            iss: issuer,
            aud: clientId,
            sub: "nhs_login_subject_invalid_signature",
            nonce: "wrong_nonce",
            exp: Math.floor(new Date(input.observedAt).getTime() / 1000) + 300,
            iat: Math.floor(new Date(input.observedAt).getTime() / 1000),
            identity_proofing_level: "P9",
          },
          signature: "invalid-signature",
        };
      }
      if (input.code === "simulator_low_assurance") {
        return {
          header: { alg: "RS256", kid: keyId, typ: "JWT" },
          claims: {
            iss: issuer,
            aud: clientId,
            sub: "nhs_login_subject_low_assurance",
            nonce: "nonce-bound-by-auth-bridge-runtime-vault",
            exp: Math.floor(new Date(input.observedAt).getTime() / 1000) + 300,
            iat: Math.floor(new Date(input.observedAt).getTime() / 1000),
            identity_proofing_level: "P0",
          },
          signature: `simulated-signature:${digestSecret("sim-token", input.code)}`,
        };
      }
      return {
        header: { alg: "RS256", kid: keyId, typ: "JWT" },
        claims: {
          iss: issuer,
          aud: clientId,
          sub: `nhs_login_subject_${digestSecret("subject", input.code).slice(0, 16)}`,
          nonce: "nonce-bound-by-auth-bridge-runtime-vault",
          exp: Math.floor(new Date(input.observedAt).getTime() / 1000) + 300,
          iat: Math.floor(new Date(input.observedAt).getTime() / 1000),
          identity_proofing_level: "P9",
          email_verified: true,
          nhs_login_claim_source: "simulator",
        },
        signature: `simulated-signature:${digestSecret("sim-token", input.code)}`,
      };
    },
    async validateTokenEnvelope(input) {
      const discovery = await this.discover();
      const kidAllowed = discovery.jwks.keys.some(
        (key) => key.kid === input.tokenEnvelope.header.kid,
      );
      if (!kidAllowed || !input.tokenEnvelope.signature.startsWith("simulated-signature:")) {
        throw new Error("AUTH_BRIDGE_JWKS_SIGNATURE_VALIDATION_FAILED");
      }
      if (input.tokenEnvelope.claims.iss !== discovery.issuer) {
        throw new Error("AUTH_BRIDGE_ISSUER_MISMATCH");
      }
      if (input.tokenEnvelope.claims.aud !== clientId) {
        throw new Error("AUTH_BRIDGE_AUDIENCE_MISMATCH");
      }
      const nonceClaim =
        input.tokenEnvelope.claims.nonce === "nonce-bound-by-auth-bridge-runtime-vault"
          ? input.nonceToken
          : input.tokenEnvelope.claims.nonce;
      if (
        typeof nonceClaim !== "string" ||
        digestSecret("oidc-nonce", nonceClaim) !== input.transaction.nonceDigest
      ) {
        throw new Error("AUTH_BRIDGE_NONCE_MISMATCH");
      }
      const exp = input.tokenEnvelope.claims.exp;
      if (typeof exp !== "number" || exp * 1000 <= new Date(input.observedAt).getTime()) {
        throw new Error("AUTH_BRIDGE_TOKEN_EXPIRED");
      }
      const proofingLevel = String(input.tokenEnvelope.claims.identity_proofing_level ?? "");
      if (assuranceRank(proofingLevel) < assuranceRank(input.scopeBundle.assuranceRequirement)) {
        throw new Error("AUTH_BRIDGE_ASSURANCE_TOO_LOW");
      }
      const subjectRef = input.tokenEnvelope.claims.sub;
      if (typeof subjectRef !== "string" || subjectRef.length === 0) {
        throw new Error("AUTH_BRIDGE_SUBJECT_MISSING");
      }
      return Object.freeze({
        subjectRef,
        issuer: discovery.issuer,
        rawClaims: Object.freeze({ ...input.tokenEnvelope.claims }),
        rawTokenEnvelope: Object.freeze({
          header: Object.freeze({ ...input.tokenEnvelope.header }),
          claims: Object.freeze({ ...input.tokenEnvelope.claims }),
          signature: input.tokenEnvelope.signature,
        }),
      });
    },
  };
}

export function createAuthBridgeService(options: {
  readonly repository: AuthBridgeRepository;
  readonly ports: AuthBridgePorts;
  readonly oidcAdapter: NhsLoginOidcAdapter;
  readonly clientId?: string;
  readonly redirectUri?: string;
}): AuthBridgeService {
  const repository = options.repository;
  const ports = options.ports;
  const oidcAdapter = options.oidcAdapter;
  const redirectUri = options.redirectUri ?? DEFAULT_REDIRECT_URI;
  const runtimeSecrets = new Map<string, RuntimeOidcSecretRecord>();

  async function loadBundleAndIntent(transaction: AuthTransaction): Promise<{
    readonly scopeBundle: AuthScopeBundle;
    readonly returnIntent: PostAuthReturnIntent;
  }> {
    const scopeBundle = await repository.getScopeBundle(transaction.authScopeBundleRef);
    const returnIntent = await repository.getReturnIntent(transaction.postAuthReturnIntentRef);
    if (!scopeBundle || !returnIntent) {
      throw new Error("AUTH_BRIDGE_TRANSACTION_REFERENCES_MISSING");
    }
    return { scopeBundle, returnIntent };
  }

  async function persistTerminalSettlement(input: {
    readonly transaction: AuthTransaction;
    readonly scopeBundle: AuthScopeBundle;
    readonly returnIntent: PostAuthReturnIntent;
    readonly outcome: AuthCallbackOutcome;
    readonly reasonCodes: readonly string[];
    readonly observedAt: string;
  }): Promise<AuthBridgeCallbackResult> {
    const settlement = createSettlement({
      transaction: input.transaction,
      outcome: input.outcome,
      reasonCodes: input.reasonCodes,
      returnIntentRef: input.returnIntent.returnIntentId,
      createdAt: input.observedAt,
    });
    const patched = await repository.compareAndSetTransaction({
      transactionId: input.transaction.transactionId,
      expectedVersion: input.transaction.version,
      allowedConsumptionStates: ["unconsumed"],
      patch: {
        lifecycle: settlement.lifecycleAfter,
        consumptionState: settlement.consumptionStateAfter,
        callbackOutcome: settlement.outcome,
        firstConsumedAt: input.observedAt,
        settlementRef: settlement.settlementId,
        updatedAt: input.observedAt,
      },
    });
    const storedTransaction = patched.transaction ?? input.transaction;
    await repository.saveCallbackSettlement(settlement);
    return buildCallbackResult({
      transaction: storedTransaction,
      scopeBundle: input.scopeBundle,
      returnIntent: input.returnIntent,
      settlement,
      replayed: false,
    });
  }

  function replayFromExisting(input: {
    readonly transaction: AuthTransaction;
    readonly scopeBundle: AuthScopeBundle | null;
    readonly returnIntent: PostAuthReturnIntent | null;
    readonly existingSettlement: AuthCallbackSettlement | undefined;
    readonly observedAt: string;
  }): AuthBridgeCallbackResult {
    const replaySettlement = createSettlement({
      transaction: input.transaction,
      outcome: "replayed_callback",
      reasonCodes: [
        "AUTH_CALLBACK_REPLAYED",
        input.existingSettlement ? "EXISTING_SETTLEMENT_RETURNED" : "TRANSACTION_ALREADY_CONSUMED",
      ],
      returnIntentRef:
        input.returnIntent?.returnIntentId ?? input.transaction.postAuthReturnIntentRef,
      replayOfSettlementRef: input.existingSettlement?.settlementId ?? null,
      createdAt: input.observedAt,
    });
    return buildCallbackResult({
      transaction: input.transaction,
      scopeBundle: input.scopeBundle,
      returnIntent: input.returnIntent,
      settlement: replaySettlement,
      replayed: true,
    });
  }

  return {
    async beginAuthorize(input) {
      const issuedAt = input.issuedAt ?? nowIso();
      const ttlSeconds = input.ttlSeconds ?? 300;
      const discovery = await oidcAdapter.discover();
      const stateToken = makeToken("auth_state");
      const nonceToken = makeToken("auth_nonce");
      const codeVerifier = makeToken("pkce_verifier");
      const transactionId = makeToken("auth_txn");
      const scopeBundle = cloneScopeBundle({
        scopeBundleId: makeToken("auth_scope_bundle"),
        requestedScopes: uniqueScopes(input.requestedScopes ?? defaultRequestedScopes()),
        assuranceRequirement: input.assuranceRequirement ?? "nhs_p9",
        rawClaimStorageRule: "vault_reference_only",
        offlineAccessPolicy: "offline_access_forbidden",
        createdAt: issuedAt,
      });
      const returnIntent = cloneReturnIntent({
        returnIntentId: makeToken("post_auth_return_intent"),
        routeIntentBindingRef: input.routeIntentBindingRef,
        lineageRef: input.lineageRef,
        routeFamilyRef: input.routeFamilyRef,
        subjectRef: input.subjectRef ?? null,
        bindingVersionRef: input.bindingVersionRef ?? null,
        sessionEpochRef: input.sessionEpochRef ?? null,
        channelManifestRef: input.channelManifestRef,
        selectedAnchorRef: input.selectedAnchorRef,
        allowedNextSurface: input.allowedNextSurface ?? "signed_in_track_request",
        redirectMode: "route_intent_binding_only",
        staleDisposition: input.staleDisposition ?? "recover_with_same_route_family",
        createdAt: issuedAt,
      });
      const transaction = cloneTransaction({
        transactionId,
        providerMode: input.providerMode ?? "nhs_login_simulator",
        flow: "server_authorization_code_pkce",
        lifecycle: "authorize_redirect_issued",
        consumptionState: "unconsumed",
        authScopeBundleRef: scopeBundle.scopeBundleId,
        postAuthReturnIntentRef: returnIntent.returnIntentId,
        stateDigest: digestSecret("oidc-state", stateToken),
        nonceDigest: digestSecret("oidc-nonce", nonceToken),
        codeVerifierDigest: digestSecret("pkce-verifier", codeVerifier),
        codeChallenge: codeChallengeFromVerifier(codeVerifier),
        redirectUri,
        providerIssuer: discovery.issuer,
        transactionFenceEpoch: 1,
        version: 1,
        callbackOutcome: "pending",
        firstConsumedAt: null,
        tokenEvidenceRef: null,
        settlementRef: null,
        createdAt: issuedAt,
        expiresAt: addSeconds(issuedAt, ttlSeconds),
        updatedAt: issuedAt,
      });

      await repository.saveScopeBundle(scopeBundle);
      await repository.saveReturnIntent(returnIntent);
      await repository.saveTransaction(transaction);
      runtimeSecrets.set(transaction.transactionId, Object.freeze({ codeVerifier, nonceToken }));

      const authorizeUrl = await oidcAdapter.buildAuthorizeUrl({
        transaction,
        scopeBundle,
        returnIntent,
        stateToken,
        nonceToken,
      });

      return Object.freeze({
        authorizeUrl,
        stateToken,
        transaction,
        scopeBundle,
        returnIntent,
      });
    },
    async settleCallback(input) {
      const observedAt = input.observedAt ?? nowIso();
      const stateDigest = digestSecret("oidc-state", input.state);
      const transaction = await repository.findTransactionByStateDigest(stateDigest);
      if (!transaction) {
        const settlement = createSettlement({
          transaction: null,
          outcome: "internal_fallback",
          reasonCodes: ["AUTH_TRANSACTION_NOT_FOUND"],
          returnIntentRef: "post_auth_return_intent_unresolved",
          createdAt: observedAt,
        });
        return buildCallbackResult({
          transaction: null,
          scopeBundle: null,
          returnIntent: null,
          settlement,
          replayed: false,
        });
      }

      const { scopeBundle, returnIntent } = await loadBundleAndIntent(transaction);
      const existingSettlement = await repository.findSettlementByTransactionId(
        transaction.transactionId,
      );
      if (transaction.consumptionState !== "unconsumed" || existingSettlement) {
        return replayFromExisting({
          transaction,
          scopeBundle,
          returnIntent,
          existingSettlement,
          observedAt,
        });
      }

      if (input.redirectUri !== transaction.redirectUri) {
        return persistTerminalSettlement({
          transaction,
          scopeBundle,
          returnIntent,
          outcome: "token_validation_failure",
          reasonCodes: ["AUTH_CALLBACK_REDIRECT_URI_MISMATCH"],
          observedAt,
        });
      }

      if (new Date(observedAt).getTime() > new Date(transaction.expiresAt).getTime()) {
        return persistTerminalSettlement({
          transaction,
          scopeBundle,
          returnIntent,
          outcome: "expired_transaction",
          reasonCodes: ["AUTH_TRANSACTION_EXPIRED"],
          observedAt,
        });
      }

      if (input.error) {
        const outcome = callbackErrorToOutcome(input.error);
        return persistTerminalSettlement({
          transaction,
          scopeBundle,
          returnIntent,
          outcome,
          reasonCodes: [
            `AUTH_PROVIDER_ERROR_${input.error.toUpperCase()}`,
            ...(input.errorDescription ? ["AUTH_PROVIDER_ERROR_DESCRIPTION_PRESENT"] : []),
          ],
          observedAt,
        });
      }

      if (!input.code) {
        return persistTerminalSettlement({
          transaction,
          scopeBundle,
          returnIntent,
          outcome: "token_validation_failure",
          reasonCodes: ["AUTH_CALLBACK_CODE_MISSING"],
          observedAt,
        });
      }

      const consumed = await repository.compareAndSetTransaction({
        transactionId: transaction.transactionId,
        expectedVersion: transaction.version,
        allowedConsumptionStates: ["unconsumed"],
        patch: {
          lifecycle: "callback_consumed",
          consumptionState: "consumed",
          callbackOutcome: "pending",
          firstConsumedAt: observedAt,
          updatedAt: observedAt,
        },
      });
      if (!consumed.ok || !consumed.transaction) {
        const current = consumed.transaction ?? transaction;
        const currentSettlement = await repository.findSettlementByTransactionId(
          current.transactionId,
        );
        return replayFromExisting({
          transaction: current,
          scopeBundle,
          returnIntent,
          existingSettlement: currentSettlement,
          observedAt,
        });
      }

      const secrets = runtimeSecrets.get(transaction.transactionId);
      if (!secrets) {
        return persistTerminalSettlement({
          transaction: consumed.transaction,
          scopeBundle,
          returnIntent,
          outcome: "token_validation_failure",
          reasonCodes: ["AUTH_OIDC_RUNTIME_SECRET_MISSING"],
          observedAt,
        });
      }

      try {
        const tokenEnvelope = await oidcAdapter.exchangeCode({
          transaction: consumed.transaction,
          scopeBundle,
          code: input.code,
          codeVerifier: secrets.codeVerifier,
          observedAt,
        });
        const validated = await oidcAdapter.validateTokenEnvelope({
          transaction: consumed.transaction,
          scopeBundle,
          tokenEnvelope,
          nonceToken: secrets.nonceToken,
          observedAt,
        });
        const evidence = await ports.evidenceVault.writeAuthClaimSnapshot({
          transactionId: consumed.transaction.transactionId,
          providerMode: consumed.transaction.providerMode,
          issuer: validated.issuer,
          subjectRef: validated.subjectRef,
          rawClaims: validated.rawClaims,
          rawTokenEnvelope: validated.rawTokenEnvelope,
          storageRule: scopeBundle.rawClaimStorageRule,
          recordedAt: observedAt,
        });
        const binding = await ports.bindingAuthority.submitBindingIntent({
          transactionId: consumed.transaction.transactionId,
          subjectRef: validated.subjectRef,
          evidenceVaultRef: evidence.evidenceRef,
          assuranceRequirement: scopeBundle.assuranceRequirement,
          routeIntentBindingRef: returnIntent.routeIntentBindingRef,
          recordedAt: observedAt,
        });
        const capability = await ports.capabilityDecision.prepareCapabilityIntent({
          transactionId: consumed.transaction.transactionId,
          subjectRef: validated.subjectRef,
          authScopeBundleRef: scopeBundle.scopeBundleId,
          postAuthReturnIntentRef: returnIntent.returnIntentId,
          bindingIntentRef: binding.bindingIntentRef,
          recordedAt: observedAt,
        });
        const sessionDecision = await ports.sessionGovernor.settleSessionEstablishment({
          transactionId: consumed.transaction.transactionId,
          subjectRef: validated.subjectRef,
          evidenceVaultRef: evidence.evidenceRef,
          bindingIntentRef: binding.bindingIntentRef,
          capabilityIntentRef: capability.capabilityIntentRef,
          postAuthReturnIntent: returnIntent,
          requestedAt: observedAt,
        });
        const settlement = createSettlement({
          transaction: consumed.transaction,
          outcome: "success",
          reasonCodes: ["AUTH_CALLBACK_TOKEN_VALIDATED", "SESSION_GOVERNOR_PORT_EMITTED"],
          evidenceVaultRef: evidence.evidenceRef,
          bindingIntentRef: binding.bindingIntentRef,
          capabilityIntentRef: capability.capabilityIntentRef,
          sessionGovernorDecisionRef: sessionDecision.sessionGovernorDecisionRef,
          returnIntentRef: returnIntent.returnIntentId,
          createdAt: observedAt,
        });
        await repository.appendProviderTokenExchange({
          exchangeId: `auth_token_exchange_${consumed.transaction.transactionId}`,
          transactionId: consumed.transaction.transactionId,
          providerMode: consumed.transaction.providerMode,
          outcome: "token_validated",
          providerIssuer: validated.issuer,
          reasonCodes: ["SIMULATOR_JWKS_RS256_KID_MATCHED", "NONCE_DIGEST_MATCHED"],
          recordedAt: observedAt,
        });
        const finalTransaction = await repository.compareAndSetTransaction({
          transactionId: consumed.transaction.transactionId,
          expectedVersion: consumed.transaction.version,
          allowedConsumptionStates: ["consumed"],
          patch: {
            lifecycle: "settled_success",
            consumptionState: "consumed",
            callbackOutcome: "success",
            tokenEvidenceRef: evidence.evidenceRef,
            settlementRef: settlement.settlementId,
            updatedAt: observedAt,
          },
        });
        await repository.saveCallbackSettlement(settlement);
        runtimeSecrets.delete(transaction.transactionId);
        return buildCallbackResult({
          transaction: finalTransaction.transaction ?? consumed.transaction,
          scopeBundle,
          returnIntent,
          settlement,
          replayed: false,
        });
      } catch (error) {
        runtimeSecrets.delete(transaction.transactionId);
        await repository.appendProviderTokenExchange({
          exchangeId: `auth_token_exchange_${consumed.transaction.transactionId}`,
          transactionId: consumed.transaction.transactionId,
          providerMode: consumed.transaction.providerMode,
          outcome: "token_rejected",
          providerIssuer: consumed.transaction.providerIssuer,
          reasonCodes: [error instanceof Error ? error.message : "AUTH_TOKEN_UNKNOWN_ERROR"],
          recordedAt: observedAt,
        });
        const settlement = createSettlement({
          transaction: consumed.transaction,
          outcome:
            error instanceof Error && error.message === "AUTH_BRIDGE_ASSURANCE_TOO_LOW"
              ? "insufficient_assurance"
              : "token_validation_failure",
          reasonCodes: [error instanceof Error ? error.message : "AUTH_TOKEN_UNKNOWN_ERROR"],
          returnIntentRef: returnIntent.returnIntentId,
          createdAt: observedAt,
        });
        const finalTransaction = await repository.compareAndSetTransaction({
          transactionId: consumed.transaction.transactionId,
          expectedVersion: consumed.transaction.version,
          allowedConsumptionStates: ["consumed"],
          patch: {
            lifecycle: settlement.lifecycleAfter,
            consumptionState: settlement.consumptionStateAfter,
            callbackOutcome: settlement.outcome,
            settlementRef: settlement.settlementId,
            updatedAt: observedAt,
          },
        });
        await repository.saveCallbackSettlement(settlement);
        return buildCallbackResult({
          transaction: finalTransaction.transaction ?? consumed.transaction,
          scopeBundle,
          returnIntent,
          settlement,
          replayed: false,
        });
      }
    },
  };
}

export function createAuthBridgeApplication(options?: {
  readonly repository?: AuthBridgeRepository;
  readonly ports?: AuthBridgePorts;
  readonly oidcAdapter?: NhsLoginOidcAdapter;
  readonly redirectUri?: string;
  readonly clientId?: string;
}): AuthBridgeApplication {
  const repository = options?.repository ?? createInMemoryAuthBridgeRepository();
  const ports = options?.ports ?? createRecordingAuthBridgePorts();
  const oidcAdapter =
    options?.oidcAdapter ??
    createSimulatorNhsLoginOidcAdapter({
      clientId: options?.clientId,
      redirectUri: options?.redirectUri,
    });

  return Object.freeze({
    authBridge: createAuthBridgeService({
      repository,
      ports,
      oidcAdapter,
      clientId: options?.clientId,
      redirectUri: options?.redirectUri,
    }),
    repositories: repository,
    ports,
    oidcAdapter,
    migrationPlanRef: authBridgeMigrationPlanRefs[0],
    migrationPlanRefs: authBridgeMigrationPlanRefs,
    persistenceTables: authBridgePersistenceTables,
    parallelInterfaceGaps: authBridgeParallelInterfaceGaps,
  });
}
