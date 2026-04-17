import { createHash, randomBytes, randomUUID } from "node:crypto";

export const sessionGovernorPersistenceTables = [
  "local_sessions",
  "session_establishment_decisions",
  "session_termination_settlements",
  "session_projection_materializations",
] as const;

export const sessionGovernorMigrationPlanRefs = [
  "services/command-api/migrations/091_phase2_session_governor.sql",
] as const;

export const sessionGovernorParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_ESTABLISHMENT_DECISION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_COOKIE_CSRF_ROTATION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_TIMEOUT_SETTLEMENT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_AUTH_BRIDGE_PORT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_PROJECTION_POSTURE_V1",
] as const;

export const SESSION_GOVERNOR_POLICY_VERSION = "phase2-auth-session-v1";
export const SESSION_GOVERNOR_SCHEMA_VERSION = "171.phase2.auth-session.v1";
export const SESSION_COOKIE_NAME = "__Host-vecells.sid";
export const SESSION_COOKIE_PATH = "/";
export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60;
export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 12 * 60 * 60;

export type SessionDecision =
  | "create_fresh"
  | "rotate_existing"
  | "reuse_existing"
  | "deny"
  | "bounded_recovery";
export type WritableAuthorityState = "writable" | "read_only" | "blocked";
export type SessionEpochAction = "create" | "rotate" | "reuse" | "terminate" | "no_session";
export type CookieRotationAction =
  | "set_secure_http_only"
  | "rotate_secure_http_only"
  | "clear"
  | "preserve_read_only"
  | "none";
export type CsrfRotationAction = "issue" | "rotate" | "clear" | "preserve_read_only" | "none";
export type MaxGrantCeiling =
  | "none"
  | "authenticated_draft_only"
  | "request_status_read"
  | "request_attachment_write"
  | "continuation_recovery_only";
export type SessionProjectionPosture =
  | "signed_in"
  | "claim_pending"
  | "read_only"
  | "re_auth_required"
  | "session_expired"
  | "consent_declined"
  | "subject_conflict"
  | "stale_return"
  | "bounded_recovery";
export type SessionMaterializedPosture =
  | "active"
  | "step_up_required"
  | "restricted"
  | "recovery_only"
  | "expired_idle"
  | "expired_absolute"
  | "revoked"
  | "terminated";
export type SessionRecordState =
  | "active"
  | "restricted"
  | "recovery_only"
  | "rotated"
  | "revoked"
  | "terminated";
export type SubjectComparisonState =
  | "no_existing_session"
  | "same_subject"
  | "subject_switch"
  | "unknown_existing_session";
export type DraftClaimDisposition =
  | "not_applicable"
  | "claim_ready"
  | "claim_pending"
  | "claim_blocked";
export type ReturnIntentDisposition =
  | "bind_current_route_intent"
  | "preserve_last_safe_anchor"
  | "same_shell_re_auth"
  | "safe_re_entry"
  | "bounded_safe_options"
  | "identity_hold";
export type SessionTerminationType =
  | "logout"
  | "idle_timeout"
  | "absolute_timeout"
  | "revocation"
  | "downgrade"
  | "forced_termination"
  | "subject_conflict"
  | "stale_return";
export type SessionTerminationDecision =
  | "terminated"
  | "rotated_down"
  | "bounded_recovery"
  | "deny";
export type SessionCookieAction = "clear" | "rotate" | "preserve_read_only" | "none";
export type SessionGrantAction =
  | "supersede_all"
  | "supersede_writable"
  | "preserve_read_only"
  | "none";

export interface SessionEstablishmentDecision {
  readonly sessionEstablishmentDecisionId: string;
  readonly schemaVersion: typeof SESSION_GOVERNOR_SCHEMA_VERSION;
  readonly policyVersion: typeof SESSION_GOVERNOR_POLICY_VERSION;
  readonly authTransactionRef: string;
  readonly postAuthReturnIntentRef: string;
  readonly subjectComparisonState: SubjectComparisonState;
  readonly draftClaimDisposition: DraftClaimDisposition;
  readonly returnIntentDisposition: ReturnIntentDisposition;
  readonly decision: SessionDecision;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly sessionEpochAction: SessionEpochAction;
  readonly cookieRotationAction: CookieRotationAction;
  readonly csrfRotationAction: CsrfRotationAction;
  readonly maxGrantCeiling: MaxGrantCeiling;
  readonly projectionPosture: SessionProjectionPosture;
  readonly materializedPosture: SessionMaterializedPosture;
  readonly reasonCodes: readonly string[];
  readonly decidedAt: string;
}

export interface SessionTerminationSettlement {
  readonly sessionTerminationSettlementId: string;
  readonly schemaVersion: typeof SESSION_GOVERNOR_SCHEMA_VERSION;
  readonly policyVersion: typeof SESSION_GOVERNOR_POLICY_VERSION;
  readonly sessionEpochRef: string;
  readonly sessionRef: string;
  readonly idempotencyKey: string;
  readonly terminationType: SessionTerminationType;
  readonly settlementDecision: SessionTerminationDecision;
  readonly cookieAction: SessionCookieAction;
  readonly csrfAction: SessionCookieAction;
  readonly grantAction: SessionGrantAction;
  readonly projectionPosture:
    | "signed_out"
    | "read_only"
    | "re_auth_required"
    | "session_expired"
    | "subject_conflict"
    | "stale_return"
    | "bounded_recovery";
  readonly materializedPosture: SessionMaterializedPosture;
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
}

export interface LocalSession {
  readonly sessionRef: string;
  readonly sessionEpochRef: string;
  readonly subjectRef: string;
  readonly identityBindingRef: string | null;
  readonly bindingVersionRef: string | null;
  readonly patientLinkRef: string | null;
  readonly capabilityDecisionRef: string | null;
  readonly postAuthReturnIntentRef: string;
  readonly routeIntentBindingRef: string;
  readonly sessionState: SessionRecordState;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly maxGrantCeiling: MaxGrantCeiling;
  readonly cookieDigest: string;
  readonly csrfSecretDigest: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly idleExpiresAt: string;
  readonly absoluteExpiresAt: string;
  readonly reauthDueAt: string;
  readonly rotatedFromSessionRef: string | null;
  readonly terminatedBySettlementRef: string | null;
  readonly version: number;
}

export interface SessionCookieEnvelope {
  readonly cookieName: typeof SESSION_COOKIE_NAME;
  readonly cookieValue: string;
  readonly csrfToken: string;
  readonly setCookieHeader: string;
  readonly maxAgeSeconds: number;
  readonly httpOnly: true;
  readonly secure: true;
  readonly sameSite: "Lax";
  readonly path: typeof SESSION_COOKIE_PATH;
}

export interface SessionProjectionMaterialization {
  readonly projectionId: string;
  readonly sessionRef: string | null;
  readonly sessionEpochRef: string | null;
  readonly posture: SessionMaterializedPosture;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly routeIntentBindingRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly materializedAt: string;
}

export interface EstablishSessionInput {
  readonly authTransactionRef: string;
  readonly postAuthReturnIntentRef: string;
  readonly routeIntentBindingRef: string;
  readonly subjectRef: string;
  readonly identityBindingRef?: string | null;
  readonly bindingVersionRef?: string | null;
  readonly patientLinkRef?: string | null;
  readonly capabilityDecisionRef?: string | null;
  readonly existingCookieValue?: string | null;
  readonly requestedWritableAuthorityState?: WritableAuthorityState;
  readonly draftClaimDisposition?: DraftClaimDisposition;
  readonly observedAt?: string;
  readonly idempotencyKey?: string;
}

export interface EstablishSessionResult {
  readonly decision: SessionEstablishmentDecision;
  readonly session: LocalSession | null;
  readonly cookie: SessionCookieEnvelope | null;
  readonly projection: SessionProjectionMaterialization;
  readonly rotatedFromSession: LocalSession | null;
  readonly terminationSettlement: SessionTerminationSettlement | null;
}

export interface SessionGuardInput {
  readonly cookieValue?: string | null;
  readonly csrfToken?: string | null;
  readonly method?: string;
  readonly observedAt?: string;
  readonly routeIntentBindingRef?: string | null;
}

export interface SessionGuardResult {
  readonly accepted: boolean;
  readonly session: LocalSession | null;
  readonly projection: SessionProjectionMaterialization;
  readonly terminationSettlement: SessionTerminationSettlement | null;
  readonly clearCookieHeader: string | null;
}

export interface TerminateSessionInput {
  readonly sessionRef?: string;
  readonly cookieValue?: string | null;
  readonly terminationType: SessionTerminationType;
  readonly observedAt?: string;
  readonly idempotencyKey?: string;
}

export interface TerminateSessionResult {
  readonly settlement: SessionTerminationSettlement;
  readonly session: LocalSession | null;
  readonly projection: SessionProjectionMaterialization;
  readonly clearCookieHeader: string;
  readonly replayed: boolean;
}

export interface SessionGovernorAuthBridgePortInput {
  readonly transactionId: string;
  readonly subjectRef: string;
  readonly evidenceVaultRef: string;
  readonly bindingIntentRef: string;
  readonly capabilityIntentRef: string;
  readonly postAuthReturnIntent: {
    readonly returnIntentId: string;
    readonly routeIntentBindingRef: string;
    readonly sessionEpochRef: string | null;
  };
  readonly requestedAt: string;
}

export interface SessionGovernorAuthBridgePortResult {
  readonly sessionGovernorDecisionRef: string;
}

export interface SessionGovernorRepository {
  saveSession(session: LocalSession): Promise<void>;
  findSessionByRef(sessionRef: string): Promise<LocalSession | undefined>;
  findSessionByCookieDigest(cookieDigest: string): Promise<LocalSession | undefined>;
  compareAndSetSession(input: {
    readonly sessionRef: string;
    readonly expectedVersion: number;
    readonly patch: SessionPatch;
  }): Promise<{ readonly ok: boolean; readonly session: LocalSession | undefined }>;
  appendEstablishmentDecision(decision: SessionEstablishmentDecision): Promise<void>;
  appendTerminationSettlement(settlement: SessionTerminationSettlement): Promise<void>;
  findTerminationByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<SessionTerminationSettlement | undefined>;
  appendProjection(projection: SessionProjectionMaterialization): Promise<void>;
}

export interface SessionPatch {
  readonly sessionState?: SessionRecordState;
  readonly writableAuthorityState?: WritableAuthorityState;
  readonly maxGrantCeiling?: MaxGrantCeiling;
  readonly lastSeenAt?: string;
  readonly idleExpiresAt?: string;
  readonly cookieDigest?: string;
  readonly csrfSecretDigest?: string;
  readonly terminatedBySettlementRef?: string | null;
}

export interface SessionGovernorService {
  establishSession(input: EstablishSessionInput): Promise<EstablishSessionResult>;
  guardRequest(input: SessionGuardInput): Promise<SessionGuardResult>;
  terminateSession(input: TerminateSessionInput): Promise<TerminateSessionResult>;
  settleSessionEstablishment(
    input: SessionGovernorAuthBridgePortInput,
  ): Promise<SessionGovernorAuthBridgePortResult>;
}

export interface SessionGovernorApplication {
  readonly sessionGovernor: SessionGovernorService;
  readonly repositories: SessionGovernorRepository;
  readonly migrationPlanRef: (typeof sessionGovernorMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof sessionGovernorMigrationPlanRefs;
  readonly persistenceTables: typeof sessionGovernorPersistenceTables;
  readonly parallelInterfaceGaps: typeof sessionGovernorParallelInterfaceGaps;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addSeconds(isoTimestamp: string, seconds: number): string {
  return new Date(new Date(isoTimestamp).getTime() + seconds * 1000).toISOString();
}

function digestSecret(namespace: string, value: string): string {
  return createHash("sha256").update(`${namespace}:${value}`).digest("hex");
}

function secureToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

function deterministicId(prefix: string, value: string): string {
  return `${prefix}_${digestSecret(prefix, value).slice(0, 24)}`;
}

function cloneDecision(decision: SessionEstablishmentDecision): SessionEstablishmentDecision {
  return Object.freeze({
    ...decision,
    reasonCodes: Object.freeze([...decision.reasonCodes]),
  });
}

function cloneSettlement(settlement: SessionTerminationSettlement): SessionTerminationSettlement {
  return Object.freeze({
    ...settlement,
    reasonCodes: Object.freeze([...settlement.reasonCodes]),
  });
}

function cloneSession(session: LocalSession): LocalSession {
  return Object.freeze({ ...session });
}

function cloneProjection(
  projection: SessionProjectionMaterialization,
): SessionProjectionMaterialization {
  return Object.freeze({
    ...projection,
    reasonCodes: Object.freeze([...projection.reasonCodes]),
  });
}

function createCookieEnvelope(cookieValue: string, csrfToken: string): SessionCookieEnvelope {
  const maxAgeSeconds = SESSION_ABSOLUTE_TIMEOUT_SECONDS;
  return Object.freeze({
    cookieName: SESSION_COOKIE_NAME,
    cookieValue,
    csrfToken,
    setCookieHeader: `${SESSION_COOKIE_NAME}=${cookieValue}; Path=${SESSION_COOKIE_PATH}; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`,
    maxAgeSeconds,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: SESSION_COOKIE_PATH,
  });
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=${SESSION_COOKIE_PATH}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function hasSettledAuthority(input: EstablishSessionInput): boolean {
  return Boolean(input.identityBindingRef && input.patientLinkRef && input.capabilityDecisionRef);
}

function maxGrantCeilingForState(state: WritableAuthorityState): MaxGrantCeiling {
  if (state === "writable") {
    return "request_attachment_write";
  }
  if (state === "read_only") {
    return "request_status_read";
  }
  return "continuation_recovery_only";
}

function materializedPostureForDecision(decision: SessionDecision): SessionMaterializedPosture {
  if (
    decision === "create_fresh" ||
    decision === "rotate_existing" ||
    decision === "reuse_existing"
  ) {
    return "active";
  }
  if (decision === "deny") {
    return "terminated";
  }
  return "recovery_only";
}

function projectionPostureForDecision(
  decision: SessionDecision,
  writableState: WritableAuthorityState,
): SessionProjectionPosture {
  if (decision === "create_fresh" || decision === "rotate_existing") {
    return "signed_in";
  }
  if (decision === "reuse_existing") {
    return writableState === "writable" ? "signed_in" : "read_only";
  }
  if (decision === "deny") {
    return "subject_conflict";
  }
  return "bounded_recovery";
}

function returnIntentForDecision(decision: SessionDecision): ReturnIntentDisposition {
  if (decision === "create_fresh" || decision === "rotate_existing") {
    return "bind_current_route_intent";
  }
  if (decision === "reuse_existing") {
    return "preserve_last_safe_anchor";
  }
  if (decision === "deny") {
    return "identity_hold";
  }
  return "bounded_safe_options";
}

function createDecision(input: {
  readonly authTransactionRef: string;
  readonly postAuthReturnIntentRef: string;
  readonly subjectComparisonState: SubjectComparisonState;
  readonly draftClaimDisposition: DraftClaimDisposition;
  readonly decision: SessionDecision;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly reasonCodes: readonly string[];
  readonly decidedAt: string;
}): SessionEstablishmentDecision {
  const projectionPosture = projectionPostureForDecision(
    input.decision,
    input.writableAuthorityState,
  );
  const materializedPosture = materializedPostureForDecision(input.decision);
  return cloneDecision({
    sessionEstablishmentDecisionId: deterministicId(
      "sed",
      `${input.authTransactionRef}:${input.postAuthReturnIntentRef}:${input.decision}:${input.decidedAt}`,
    ),
    schemaVersion: SESSION_GOVERNOR_SCHEMA_VERSION,
    policyVersion: SESSION_GOVERNOR_POLICY_VERSION,
    authTransactionRef: input.authTransactionRef,
    postAuthReturnIntentRef: input.postAuthReturnIntentRef,
    subjectComparisonState: input.subjectComparisonState,
    draftClaimDisposition: input.draftClaimDisposition,
    returnIntentDisposition: returnIntentForDecision(input.decision),
    decision: input.decision,
    writableAuthorityState: input.writableAuthorityState,
    sessionEpochAction:
      input.decision === "create_fresh"
        ? "create"
        : input.decision === "rotate_existing"
          ? "rotate"
          : input.decision === "reuse_existing"
            ? "reuse"
            : input.decision === "deny"
              ? "terminate"
              : "no_session",
    cookieRotationAction:
      input.decision === "create_fresh"
        ? "set_secure_http_only"
        : input.decision === "rotate_existing"
          ? "rotate_secure_http_only"
          : input.decision === "reuse_existing"
            ? "none"
            : input.decision === "deny"
              ? "clear"
              : "none",
    csrfRotationAction:
      input.decision === "create_fresh"
        ? "issue"
        : input.decision === "rotate_existing"
          ? "rotate"
          : input.decision === "reuse_existing"
            ? "none"
            : input.decision === "deny"
              ? "clear"
              : "none",
    maxGrantCeiling: maxGrantCeilingForState(input.writableAuthorityState),
    projectionPosture,
    materializedPosture,
    reasonCodes: Object.freeze([...input.reasonCodes]),
    decidedAt: input.decidedAt,
  });
}

function createProjection(input: {
  readonly session: LocalSession | null;
  readonly posture: SessionMaterializedPosture;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly routeIntentBindingRef: string | null;
  readonly reasonCodes: readonly string[];
  readonly materializedAt: string;
}): SessionProjectionMaterialization {
  return cloneProjection({
    projectionId: deterministicId(
      "session_projection",
      `${input.session?.sessionRef ?? "none"}:${input.posture}:${input.materializedAt}`,
    ),
    sessionRef: input.session?.sessionRef ?? null,
    sessionEpochRef: input.session?.sessionEpochRef ?? null,
    posture: input.posture,
    writableAuthorityState: input.writableAuthorityState,
    routeIntentBindingRef: input.routeIntentBindingRef,
    reasonCodes: Object.freeze([...input.reasonCodes]),
    materializedAt: input.materializedAt,
  });
}

function createSession(input: {
  readonly subjectRef: string;
  readonly identityBindingRef: string;
  readonly bindingVersionRef: string;
  readonly patientLinkRef: string;
  readonly capabilityDecisionRef: string;
  readonly postAuthReturnIntentRef: string;
  readonly routeIntentBindingRef: string;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly maxGrantCeiling: MaxGrantCeiling;
  readonly cookieValue: string;
  readonly csrfToken: string;
  readonly createdAt: string;
  readonly rotatedFromSessionRef: string | null;
}): LocalSession {
  return cloneSession({
    sessionRef: `session_${randomUUID().replace(/-/g, "")}`,
    sessionEpochRef: `session_epoch_${randomUUID().replace(/-/g, "")}`,
    subjectRef: input.subjectRef,
    identityBindingRef: input.identityBindingRef,
    bindingVersionRef: input.bindingVersionRef,
    patientLinkRef: input.patientLinkRef,
    capabilityDecisionRef: input.capabilityDecisionRef,
    postAuthReturnIntentRef: input.postAuthReturnIntentRef,
    routeIntentBindingRef: input.routeIntentBindingRef,
    sessionState: input.writableAuthorityState === "writable" ? "active" : "restricted",
    writableAuthorityState: input.writableAuthorityState,
    maxGrantCeiling: input.maxGrantCeiling,
    cookieDigest: digestSecret("session-cookie", input.cookieValue),
    csrfSecretDigest: digestSecret("session-csrf", input.csrfToken),
    createdAt: input.createdAt,
    lastSeenAt: input.createdAt,
    idleExpiresAt: addSeconds(input.createdAt, SESSION_IDLE_TIMEOUT_SECONDS),
    absoluteExpiresAt: addSeconds(input.createdAt, SESSION_ABSOLUTE_TIMEOUT_SECONDS),
    reauthDueAt: addSeconds(input.createdAt, SESSION_ABSOLUTE_TIMEOUT_SECONDS),
    rotatedFromSessionRef: input.rotatedFromSessionRef,
    terminatedBySettlementRef: null,
    version: 1,
  });
}

function compareSessionAuthority(
  existing: LocalSession,
  input: EstablishSessionInput,
): "same" | "rotate" {
  if (existing.bindingVersionRef !== input.bindingVersionRef) {
    return "rotate";
  }
  if (existing.identityBindingRef !== input.identityBindingRef) {
    return "rotate";
  }
  if (existing.capabilityDecisionRef !== input.capabilityDecisionRef) {
    return "rotate";
  }
  if (existing.writableAuthorityState !== (input.requestedWritableAuthorityState ?? "writable")) {
    return "rotate";
  }
  return "same";
}

function mutatingMethod(method: string | undefined): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(normalized);
}

function expiredType(
  session: LocalSession,
  observedAt: string,
): "idle_timeout" | "absolute_timeout" | null {
  const observed = new Date(observedAt).getTime();
  if (observed >= new Date(session.absoluteExpiresAt).getTime()) {
    return "absolute_timeout";
  }
  if (observed >= new Date(session.idleExpiresAt).getTime()) {
    return "idle_timeout";
  }
  return null;
}

function settlementPosture(
  type: SessionTerminationType,
): SessionTerminationSettlement["projectionPosture"] {
  if (type === "idle_timeout" || type === "absolute_timeout") {
    return "session_expired";
  }
  if (type === "subject_conflict") {
    return "subject_conflict";
  }
  if (type === "stale_return") {
    return "stale_return";
  }
  if (type === "downgrade") {
    return "read_only";
  }
  return "signed_out";
}

function materializedPostureForTermination(
  type: SessionTerminationType,
): SessionMaterializedPosture {
  if (type === "idle_timeout") {
    return "expired_idle";
  }
  if (type === "absolute_timeout") {
    return "expired_absolute";
  }
  if (type === "revocation") {
    return "revoked";
  }
  if (type === "downgrade") {
    return "restricted";
  }
  return "terminated";
}

function reasonForTermination(type: SessionTerminationType): string {
  const map: Record<SessionTerminationType, string> = {
    logout: "AUTH_171_LOGOUT_SETTLED",
    idle_timeout: "AUTH_171_IDLE_TIMEOUT",
    absolute_timeout: "AUTH_171_ABSOLUTE_TIMEOUT",
    revocation: "AUTH_171_SESSION_REVOKED",
    downgrade: "AUTH_171_SESSION_DOWNGRADED",
    forced_termination: "AUTH_171_FORCED_TERMINATION",
    subject_conflict: "AUTH_171_SUBJECT_SWITCH_TEARDOWN",
    stale_return: "AUTH_171_STALE_RETURN_BLOCKED",
  };
  return map[type];
}

function createTerminationSettlement(input: {
  readonly session: LocalSession;
  readonly terminationType: SessionTerminationType;
  readonly idempotencyKey: string;
  readonly settledAt: string;
}): SessionTerminationSettlement {
  const projectionPosture = settlementPosture(input.terminationType);
  const materializedPosture = materializedPostureForTermination(input.terminationType);
  return cloneSettlement({
    sessionTerminationSettlementId: deterministicId(
      "sts",
      `${input.session.sessionRef}:${input.terminationType}:${input.idempotencyKey}`,
    ),
    schemaVersion: SESSION_GOVERNOR_SCHEMA_VERSION,
    policyVersion: SESSION_GOVERNOR_POLICY_VERSION,
    sessionEpochRef: input.session.sessionEpochRef,
    sessionRef: input.session.sessionRef,
    idempotencyKey: input.idempotencyKey,
    terminationType: input.terminationType,
    settlementDecision: input.terminationType === "downgrade" ? "rotated_down" : "terminated",
    cookieAction: input.terminationType === "downgrade" ? "preserve_read_only" : "clear",
    csrfAction: input.terminationType === "downgrade" ? "preserve_read_only" : "clear",
    grantAction: input.terminationType === "downgrade" ? "supersede_writable" : "supersede_all",
    projectionPosture,
    materializedPosture,
    reasonCodes: Object.freeze([reasonForTermination(input.terminationType)]),
    settledAt: input.settledAt,
  });
}

export function createInMemorySessionGovernorRepository(): SessionGovernorRepository & {
  readonly snapshots: () => {
    readonly sessions: readonly LocalSession[];
    readonly establishmentDecisions: readonly SessionEstablishmentDecision[];
    readonly terminationSettlements: readonly SessionTerminationSettlement[];
    readonly projections: readonly SessionProjectionMaterialization[];
  };
} {
  const sessions = new Map<string, LocalSession>();
  const sessionByCookieDigest = new Map<string, string>();
  const establishmentDecisions: SessionEstablishmentDecision[] = [];
  const terminationSettlements = new Map<string, SessionTerminationSettlement>();
  const terminationByIdempotencyKey = new Map<string, string>();
  const projections: SessionProjectionMaterialization[] = [];

  return {
    async saveSession(session) {
      const snapshot = cloneSession(session);
      sessions.set(snapshot.sessionRef, snapshot);
      sessionByCookieDigest.set(snapshot.cookieDigest, snapshot.sessionRef);
    },
    async findSessionByRef(sessionRef) {
      const session = sessions.get(sessionRef);
      return session ? cloneSession(session) : undefined;
    },
    async findSessionByCookieDigest(cookieDigest) {
      const sessionRef = sessionByCookieDigest.get(cookieDigest);
      if (!sessionRef) {
        return undefined;
      }
      const session = sessions.get(sessionRef);
      return session ? cloneSession(session) : undefined;
    },
    async compareAndSetSession(input) {
      const existing = sessions.get(input.sessionRef);
      if (!existing || existing.version !== input.expectedVersion) {
        return { ok: false, session: existing ? cloneSession(existing) : undefined };
      }
      if (input.patch.cookieDigest && input.patch.cookieDigest !== existing.cookieDigest) {
        sessionByCookieDigest.delete(existing.cookieDigest);
        sessionByCookieDigest.set(input.patch.cookieDigest, existing.sessionRef);
      }
      const next = cloneSession({
        ...existing,
        sessionState: input.patch.sessionState ?? existing.sessionState,
        writableAuthorityState:
          input.patch.writableAuthorityState ?? existing.writableAuthorityState,
        maxGrantCeiling: input.patch.maxGrantCeiling ?? existing.maxGrantCeiling,
        lastSeenAt: input.patch.lastSeenAt ?? existing.lastSeenAt,
        idleExpiresAt: input.patch.idleExpiresAt ?? existing.idleExpiresAt,
        cookieDigest: input.patch.cookieDigest ?? existing.cookieDigest,
        csrfSecretDigest: input.patch.csrfSecretDigest ?? existing.csrfSecretDigest,
        terminatedBySettlementRef:
          input.patch.terminatedBySettlementRef === undefined
            ? existing.terminatedBySettlementRef
            : input.patch.terminatedBySettlementRef,
        version: existing.version + 1,
      });
      sessions.set(next.sessionRef, next);
      return { ok: true, session: cloneSession(next) };
    },
    async appendEstablishmentDecision(decision) {
      establishmentDecisions.push(cloneDecision(decision));
    },
    async appendTerminationSettlement(settlement) {
      if (terminationByIdempotencyKey.has(settlement.idempotencyKey)) {
        return;
      }
      const snapshot = cloneSettlement(settlement);
      terminationSettlements.set(snapshot.sessionTerminationSettlementId, snapshot);
      terminationByIdempotencyKey.set(
        snapshot.idempotencyKey,
        snapshot.sessionTerminationSettlementId,
      );
    },
    async findTerminationByIdempotencyKey(idempotencyKey) {
      const settlementRef = terminationByIdempotencyKey.get(idempotencyKey);
      if (!settlementRef) {
        return undefined;
      }
      const settlement = terminationSettlements.get(settlementRef);
      return settlement ? cloneSettlement(settlement) : undefined;
    },
    async appendProjection(projection) {
      projections.push(cloneProjection(projection));
    },
    snapshots() {
      return Object.freeze({
        sessions: Object.freeze([...sessions.values()].map(cloneSession)),
        establishmentDecisions: Object.freeze(establishmentDecisions.map(cloneDecision)),
        terminationSettlements: Object.freeze(
          [...terminationSettlements.values()].map(cloneSettlement),
        ),
        projections: Object.freeze(projections.map(cloneProjection)),
      });
    },
  };
}

export function createSessionGovernorService(
  repository: SessionGovernorRepository,
): SessionGovernorService {
  async function resolveExistingSession(
    cookieValue: string | null | undefined,
  ): Promise<LocalSession | undefined> {
    if (!cookieValue) {
      return undefined;
    }
    return repository.findSessionByCookieDigest(digestSecret("session-cookie", cookieValue));
  }

  async function persistProjection(
    projection: SessionProjectionMaterialization,
  ): Promise<SessionProjectionMaterialization> {
    await repository.appendProjection(projection);
    return projection;
  }

  async function settleTermination(
    session: LocalSession,
    type: SessionTerminationType,
    observedAt: string,
    idempotencyKey?: string,
  ): Promise<TerminateSessionResult> {
    const key = idempotencyKey ?? `${type}:${session.sessionRef}`;
    const existing = await repository.findTerminationByIdempotencyKey(key);
    if (existing) {
      const projection = await persistProjection(
        createProjection({
          session,
          posture: existing.materializedPosture,
          writableAuthorityState: type === "downgrade" ? "read_only" : "blocked",
          routeIntentBindingRef: session.routeIntentBindingRef,
          reasonCodes: existing.reasonCodes,
          materializedAt: observedAt,
        }),
      );
      return {
        settlement: existing,
        session,
        projection,
        clearCookieHeader: clearSessionCookieHeader(),
        replayed: true,
      };
    }

    const settlement = createTerminationSettlement({
      session,
      terminationType: type,
      idempotencyKey: key,
      settledAt: observedAt,
    });
    const nextState: SessionRecordState =
      type === "downgrade" ? "restricted" : type === "revocation" ? "revoked" : "terminated";
    const updated = await repository.compareAndSetSession({
      sessionRef: session.sessionRef,
      expectedVersion: session.version,
      patch: {
        sessionState: nextState,
        writableAuthorityState: type === "downgrade" ? "read_only" : "blocked",
        maxGrantCeiling: type === "downgrade" ? "request_status_read" : "none",
        terminatedBySettlementRef: settlement.sessionTerminationSettlementId,
      },
    });
    await repository.appendTerminationSettlement(settlement);
    const storedSession = updated.session ?? session;
    const projection = await persistProjection(
      createProjection({
        session: storedSession,
        posture: settlement.materializedPosture,
        writableAuthorityState: storedSession.writableAuthorityState,
        routeIntentBindingRef: storedSession.routeIntentBindingRef,
        reasonCodes: settlement.reasonCodes,
        materializedAt: observedAt,
      }),
    );
    return {
      settlement,
      session: storedSession,
      projection,
      clearCookieHeader: clearSessionCookieHeader(),
      replayed: false,
    };
  }

  return {
    async establishSession(input) {
      const observedAt = input.observedAt ?? nowIso();
      const requestedWritable = input.requestedWritableAuthorityState ?? "writable";
      const existing = await resolveExistingSession(input.existingCookieValue);
      const existingExpiry = existing ? expiredType(existing, observedAt) : null;
      let rotatedFromSession: LocalSession | null = null;
      let terminationSettlement: SessionTerminationSettlement | null = null;

      if (existing && existingExpiry) {
        const terminated = await settleTermination(existing, existingExpiry, observedAt);
        terminationSettlement = terminated.settlement;
      }

      const liveExisting = existing && !existingExpiry ? existing : undefined;
      const subjectComparisonState: SubjectComparisonState = !liveExisting
        ? "no_existing_session"
        : liveExisting.subjectRef === input.subjectRef
          ? "same_subject"
          : "subject_switch";

      if (!hasSettledAuthority(input)) {
        const decision = createDecision({
          authTransactionRef: input.authTransactionRef,
          postAuthReturnIntentRef: input.postAuthReturnIntentRef,
          subjectComparisonState,
          draftClaimDisposition: input.draftClaimDisposition ?? "claim_pending",
          decision: "bounded_recovery",
          writableAuthorityState: "blocked",
          reasonCodes: ["AUTH_171_BINDING_OR_CAPABILITY_PENDING"],
          decidedAt: observedAt,
        });
        await repository.appendEstablishmentDecision(decision);
        const projection = await persistProjection(
          createProjection({
            session: null,
            posture: "recovery_only",
            writableAuthorityState: "blocked",
            routeIntentBindingRef: input.routeIntentBindingRef,
            reasonCodes: decision.reasonCodes,
            materializedAt: observedAt,
          }),
        );
        return {
          decision,
          session: null,
          cookie: null,
          projection,
          rotatedFromSession: null,
          terminationSettlement,
        };
      }

      if (liveExisting && liveExisting.subjectRef !== input.subjectRef) {
        const terminated = await settleTermination(liveExisting, "subject_conflict", observedAt);
        const decision = createDecision({
          authTransactionRef: input.authTransactionRef,
          postAuthReturnIntentRef: input.postAuthReturnIntentRef,
          subjectComparisonState: "subject_switch",
          draftClaimDisposition: "claim_blocked",
          decision: "bounded_recovery",
          writableAuthorityState: "blocked",
          reasonCodes: ["AUTH_171_SUBJECT_SWITCH_TEARDOWN"],
          decidedAt: observedAt,
        });
        await repository.appendEstablishmentDecision(decision);
        const projection = await persistProjection(
          createProjection({
            session: null,
            posture: "recovery_only",
            writableAuthorityState: "blocked",
            routeIntentBindingRef: input.routeIntentBindingRef,
            reasonCodes: decision.reasonCodes,
            materializedAt: observedAt,
          }),
        );
        return {
          decision,
          session: null,
          cookie: null,
          projection,
          rotatedFromSession: liveExisting,
          terminationSettlement: terminated.settlement,
        };
      }

      const authorityComparison =
        liveExisting && compareSessionAuthority(liveExisting, input) === "same" ? "same" : "rotate";
      const decisionKind: SessionDecision = !liveExisting
        ? "create_fresh"
        : authorityComparison === "same"
          ? "reuse_existing"
          : "rotate_existing";
      const decision = createDecision({
        authTransactionRef: input.authTransactionRef,
        postAuthReturnIntentRef: input.postAuthReturnIntentRef,
        subjectComparisonState,
        draftClaimDisposition: input.draftClaimDisposition ?? "claim_ready",
        decision: decisionKind,
        writableAuthorityState: requestedWritable,
        reasonCodes:
          decisionKind === "create_fresh"
            ? ["AUTH_171_CREATE_FRESH_APPROVED"]
            : decisionKind === "rotate_existing"
              ? ["AUTH_171_ROTATE_ON_BINDING_OR_PRIVILEGE_CHANGE"]
              : ["AUTH_171_REUSE_EXISTING_SESSION"],
        decidedAt: observedAt,
      });
      await repository.appendEstablishmentDecision(decision);

      if (decisionKind === "reuse_existing" && liveExisting) {
        const touched = await repository.compareAndSetSession({
          sessionRef: liveExisting.sessionRef,
          expectedVersion: liveExisting.version,
          patch: {
            lastSeenAt: observedAt,
            idleExpiresAt: addSeconds(observedAt, SESSION_IDLE_TIMEOUT_SECONDS),
          },
        });
        const session = touched.session ?? liveExisting;
        const projection = await persistProjection(
          createProjection({
            session,
            posture: "active",
            writableAuthorityState: session.writableAuthorityState,
            routeIntentBindingRef: session.routeIntentBindingRef,
            reasonCodes: decision.reasonCodes,
            materializedAt: observedAt,
          }),
        );
        return {
          decision,
          session,
          cookie: null,
          projection,
          rotatedFromSession: null,
          terminationSettlement,
        };
      }

      if (decisionKind === "rotate_existing" && liveExisting) {
        rotatedFromSession = liveExisting;
        await repository.compareAndSetSession({
          sessionRef: liveExisting.sessionRef,
          expectedVersion: liveExisting.version,
          patch: {
            sessionState: "rotated",
            writableAuthorityState: "blocked",
            maxGrantCeiling: "none",
          },
        });
      }

      const cookieValue = secureToken("sid");
      const csrfToken = secureToken("csrf");
      const session = createSession({
        subjectRef: input.subjectRef,
        identityBindingRef: input.identityBindingRef ?? "",
        bindingVersionRef: input.bindingVersionRef ?? "",
        patientLinkRef: input.patientLinkRef ?? "",
        capabilityDecisionRef: input.capabilityDecisionRef ?? "",
        postAuthReturnIntentRef: input.postAuthReturnIntentRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        writableAuthorityState: requestedWritable,
        maxGrantCeiling: maxGrantCeilingForState(requestedWritable),
        cookieValue,
        csrfToken,
        createdAt: observedAt,
        rotatedFromSessionRef: rotatedFromSession?.sessionRef ?? null,
      });
      await repository.saveSession(session);
      const cookie = createCookieEnvelope(cookieValue, csrfToken);
      const projection = await persistProjection(
        createProjection({
          session,
          posture: requestedWritable === "writable" ? "active" : "restricted",
          writableAuthorityState: requestedWritable,
          routeIntentBindingRef: input.routeIntentBindingRef,
          reasonCodes: decision.reasonCodes,
          materializedAt: observedAt,
        }),
      );
      return {
        decision,
        session,
        cookie,
        projection,
        rotatedFromSession,
        terminationSettlement,
      };
    },
    async guardRequest(input) {
      const observedAt = input.observedAt ?? nowIso();
      const session = await resolveExistingSession(input.cookieValue);
      if (!session) {
        const projection = await persistProjection(
          createProjection({
            session: null,
            posture: "recovery_only",
            writableAuthorityState: "blocked",
            routeIntentBindingRef: input.routeIntentBindingRef ?? null,
            reasonCodes: ["AUTH_171_COOKIE_MISSING_NOT_AUTHORITY"],
            materializedAt: observedAt,
          }),
        );
        return {
          accepted: false,
          session: null,
          projection,
          terminationSettlement: null,
          clearCookieHeader: null,
        };
      }

      const expiryType = expiredType(session, observedAt);
      if (expiryType) {
        const terminated = await settleTermination(session, expiryType, observedAt);
        return {
          accepted: false,
          session: terminated.session,
          projection: terminated.projection,
          terminationSettlement: terminated.settlement,
          clearCookieHeader: terminated.clearCookieHeader,
        };
      }

      if (mutatingMethod(input.method)) {
        const csrfMatches =
          typeof input.csrfToken === "string" &&
          digestSecret("session-csrf", input.csrfToken) === session.csrfSecretDigest;
        if (!csrfMatches) {
          const downgraded = await settleTermination(
            session,
            "downgrade",
            observedAt,
            `downgrade:${session.sessionRef}:csrf`,
          );
          return {
            accepted: false,
            session: downgraded.session,
            projection: downgraded.projection,
            terminationSettlement: downgraded.settlement,
            clearCookieHeader: null,
          };
        }
      }

      const touched = await repository.compareAndSetSession({
        sessionRef: session.sessionRef,
        expectedVersion: session.version,
        patch: {
          lastSeenAt: observedAt,
          idleExpiresAt: addSeconds(observedAt, SESSION_IDLE_TIMEOUT_SECONDS),
        },
      });
      const current = touched.session ?? session;
      const projection = await persistProjection(
        createProjection({
          session: current,
          posture: current.writableAuthorityState === "writable" ? "active" : "restricted",
          writableAuthorityState: current.writableAuthorityState,
          routeIntentBindingRef: current.routeIntentBindingRef,
          reasonCodes: ["AUTH_171_SESSION_GUARD_ACCEPTED"],
          materializedAt: observedAt,
        }),
      );
      return {
        accepted: true,
        session: current,
        projection,
        terminationSettlement: null,
        clearCookieHeader: null,
      };
    },
    async terminateSession(input) {
      const observedAt = input.observedAt ?? nowIso();
      const session = input.sessionRef
        ? await repository.findSessionByRef(input.sessionRef)
        : await resolveExistingSession(input.cookieValue);
      if (!session) {
        const fallbackSession = createSession({
          subjectRef: "subject_unknown",
          identityBindingRef: "identity_binding_unknown",
          bindingVersionRef: "binding_version_unknown",
          patientLinkRef: "patient_link_unknown",
          capabilityDecisionRef: "capability_unknown",
          postAuthReturnIntentRef: "post_auth_return_intent_unknown",
          routeIntentBindingRef: "route_intent_unknown",
          writableAuthorityState: "blocked",
          maxGrantCeiling: "none",
          cookieValue: secureToken("missing_sid"),
          csrfToken: secureToken("missing_csrf"),
          createdAt: observedAt,
          rotatedFromSessionRef: null,
        });
        const settlement = createTerminationSettlement({
          session: fallbackSession,
          terminationType: input.terminationType,
          idempotencyKey: input.idempotencyKey ?? `${input.terminationType}:missing-cookie`,
          settledAt: observedAt,
        });
        const projection = await persistProjection(
          createProjection({
            session: null,
            posture: "terminated",
            writableAuthorityState: "blocked",
            routeIntentBindingRef: null,
            reasonCodes: ["AUTH_171_COOKIE_MISSING_NOT_AUTHORITY", ...settlement.reasonCodes],
            materializedAt: observedAt,
          }),
        );
        return {
          settlement,
          session: null,
          projection,
          clearCookieHeader: clearSessionCookieHeader(),
          replayed: false,
        };
      }
      return settleTermination(session, input.terminationType, observedAt, input.idempotencyKey);
    },
    async settleSessionEstablishment(input) {
      const decision = createDecision({
        authTransactionRef: input.transactionId,
        postAuthReturnIntentRef: input.postAuthReturnIntent.returnIntentId,
        subjectComparisonState: input.postAuthReturnIntent.sessionEpochRef
          ? "unknown_existing_session"
          : "no_existing_session",
        draftClaimDisposition: "claim_pending",
        decision: "bounded_recovery",
        writableAuthorityState: "blocked",
        reasonCodes: [
          "AUTH_171_AUTH_SUCCESS_NOT_SESSION",
          "AUTH_171_BINDING_OR_CAPABILITY_PENDING",
        ],
        decidedAt: input.requestedAt,
      });
      await repository.appendEstablishmentDecision(decision);
      await persistProjection(
        createProjection({
          session: null,
          posture: "recovery_only",
          writableAuthorityState: "blocked",
          routeIntentBindingRef: input.postAuthReturnIntent.routeIntentBindingRef,
          reasonCodes: decision.reasonCodes,
          materializedAt: input.requestedAt,
        }),
      );
      return { sessionGovernorDecisionRef: decision.sessionEstablishmentDecisionId };
    },
  };
}

export function createSessionGovernorApplication(options?: {
  readonly repository?: SessionGovernorRepository;
}): SessionGovernorApplication {
  const repository = options?.repository ?? createInMemorySessionGovernorRepository();
  return Object.freeze({
    sessionGovernor: createSessionGovernorService(repository),
    repositories: repository,
    migrationPlanRef: sessionGovernorMigrationPlanRefs[0],
    migrationPlanRefs: sessionGovernorMigrationPlanRefs,
    persistenceTables: sessionGovernorPersistenceTables,
    parallelInterfaceGaps: sessionGovernorParallelInterfaceGaps,
  });
}
