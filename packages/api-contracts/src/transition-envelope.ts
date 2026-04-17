function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(typeof value === "string" && value.trim().length > 0, `${field} is required.`);
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(!Number.isNaN(Date.parse(normalized)), `${field} must be a valid ISO-8601 timestamp.`);
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

function stableTransitionDigestHex(value: string): string {
  let left = 0x811c9dc5 ^ value.length;
  let right = 0x9e3779b9 ^ value.length;
  let upper = 0xc2b2ae35 ^ value.length;
  let lower = 0x27d4eb2f ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ code, 0x85ebca6b);
    upper = Math.imul(upper ^ code, 0xc2b2ae35);
    lower = Math.imul(lower ^ code, 0x27d4eb2f);
  }

  left = Math.imul(left ^ (right >>> 16), 0x85ebca6b);
  right = Math.imul(right ^ (upper >>> 15), 0xc2b2ae35);
  upper = Math.imul(upper ^ (lower >>> 13), 0x27d4eb2f);
  lower = Math.imul(lower ^ (left >>> 16), 0x165667b1);

  return [left, right, upper, lower]
    .map((segment) => (segment >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

export type TransitionEnvelopeLocalAckState =
  | "queued"
  | "local_ack"
  | "optimistic_applied"
  | "superseded";

export type TransitionEnvelopeProcessingAcceptanceState =
  | "not_sent"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "externally_accepted"
  | "externally_rejected"
  | "timed_out";

export type TransitionEnvelopeExternalObservationState =
  | "unobserved"
  | "projection_visible"
  | "external_effect_observed"
  | "review_disposition_observed"
  | "recovery_observed"
  | "disputed"
  | "failed"
  | "expired";

export type TransitionEnvelopeAuthoritativeOutcomeState =
  | "pending"
  | "review_required"
  | "recovery_required"
  | "reconciliation_required"
  | "settled"
  | "reverted"
  | "failed"
  | "expired";

export type TransitionEnvelopeSettlementPolicy =
  | "projection_token"
  | "external_ack"
  | "manual_review";

export type TransitionEnvelopeVisibleScope = "local_component" | "active_card" | "active_shell";

export interface CommandSettlementRecordLike {
  settlementId: string;
  actionRecordRef: string;
  processingAcceptanceState:
    | "not_started"
    | "accepted_for_processing"
    | "awaiting_external_confirmation"
    | "externally_accepted"
    | "externally_rejected"
    | "timed_out";
  externalObservationState:
    | "unobserved"
    | "projection_visible"
    | "external_effect_observed"
    | "review_disposition_observed"
    | "recovery_observed"
    | "disputed"
    | "failed"
    | "expired";
  authoritativeOutcomeState:
    | "pending"
    | "projection_pending"
    | "awaiting_external"
    | "review_required"
    | "stale_recoverable"
    | "recovery_required"
    | "reconciliation_required"
    | "settled"
    | "failed"
    | "expired"
    | "superseded";
  authoritativeProofClass:
    | "not_yet_authoritative"
    | "projection_visible"
    | "external_confirmation"
    | "review_disposition"
    | "recovery_disposition";
  settlementRevision: number;
  sameShellRecoveryRef: string | null;
  quietEligibleAt: string | null;
  staleAfterAt: string | null;
  projectionVisibilityRef: string | null;
  auditRecordRef: string | null;
  lastSafeAnchorRef: string | null;
  allowedSummaryTier: string | null;
  recordedAt: string;
  result:
    | "pending"
    | "applied"
    | "projection_pending"
    | "awaiting_external"
    | "stale_recoverable"
    | "blocked_policy"
    | "denied_scope"
    | "review_required"
    | "reconciliation_required"
    | "failed"
    | "expired";
}

export interface TransitionEnvelope {
  transitionId: string;
  entityRef: string;
  commandRef: string;
  commandSettlementRef: string;
  affectedAnchorRef: string | null;
  originState: string;
  targetIntent: string;
  localAckState: TransitionEnvelopeLocalAckState;
  processingAcceptanceState: TransitionEnvelopeProcessingAcceptanceState;
  externalObservationState: TransitionEnvelopeExternalObservationState;
  authoritativeOutcomeState: TransitionEnvelopeAuthoritativeOutcomeState;
  causalToken: string;
  settlementRevisionRef: string;
  settlementPolicy: TransitionEnvelopeSettlementPolicy;
  userVisibleMessage: string;
  visibleScope: TransitionEnvelopeVisibleScope;
  startedAt: string;
  updatedAt: string;
  failureReason: string | null;
  recoveryActionRef: string | null;
  invalidateOnConflict: boolean;
  lastSafeAnchorRef: string | null;
  allowedSummaryTier: string | null;
  quietEligibleAt: string | null;
  staleAfterAt: string | null;
}

export interface BuildTransitionEnvelopeInput {
  settlement: CommandSettlementRecordLike;
  entityRef: string;
  commandRef?: string | null;
  affectedAnchorRef?: string | null;
  originState: string;
  targetIntent: string;
  localAckState: TransitionEnvelopeLocalAckState;
  causalToken: string;
  settlementPolicy: TransitionEnvelopeSettlementPolicy;
  userVisibleMessage?: string | null;
  visibleScope: TransitionEnvelopeVisibleScope;
  startedAt: string;
  updatedAt?: string | null;
  failureReason?: string | null;
  lastSafeAnchorRef?: string | null;
  allowedSummaryTier?: string | null;
}

function mapProcessingAcceptanceState(
  settlement: CommandSettlementRecordLike,
): TransitionEnvelopeProcessingAcceptanceState {
  return settlement.processingAcceptanceState === "not_started"
    ? "not_sent"
    : settlement.processingAcceptanceState;
}

function mapAuthoritativeOutcomeState(
  settlement: CommandSettlementRecordLike,
): TransitionEnvelopeAuthoritativeOutcomeState {
  switch (settlement.authoritativeOutcomeState) {
    case "review_required":
      return "review_required";
    case "stale_recoverable":
    case "recovery_required":
    case "superseded":
      return "recovery_required";
    case "reconciliation_required":
      return "reconciliation_required";
    case "settled":
      return "settled";
    case "failed":
      return "failed";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

function defaultVisibleMessage(
  outcomeState: TransitionEnvelopeAuthoritativeOutcomeState,
  settlement: CommandSettlementRecordLike,
): string {
  switch (outcomeState) {
    case "settled":
      return "Authoritative settlement confirmed.";
    case "review_required":
      return "Later evidence disputed the assumed path. Review is required in place.";
    case "recovery_required":
      return settlement.sameShellRecoveryRef
        ? "Recovery is required in the current shell before mutation can continue."
        : "Recovery is required before mutation can continue.";
    case "reconciliation_required":
      return "Authoritative reconciliation is still required.";
    case "failed":
      return "The command failed before authoritative completion.";
    case "expired":
      return "The command expired before authoritative completion.";
    default:
      return "The command is still awaiting authoritative settlement.";
  }
}

export function buildTransitionEnvelope(input: BuildTransitionEnvelopeInput): TransitionEnvelope {
  const settlement = input.settlement;
  const authoritativeOutcomeState = mapAuthoritativeOutcomeState(settlement);
  const envelope: TransitionEnvelope = {
    transitionId: stableTransitionDigestHex(
      stableStringify({
        settlementId: settlement.settlementId,
        settlementRevision: settlement.settlementRevision,
        localAckState: input.localAckState,
        targetIntent: input.targetIntent,
      }),
    ),
    entityRef: requireRef(input.entityRef, "entityRef"),
    commandRef: requireRef(input.commandRef ?? settlement.actionRecordRef, "commandRef"),
    commandSettlementRef: requireRef(settlement.settlementId, "settlementId"),
    affectedAnchorRef: optionalRef(input.affectedAnchorRef ?? settlement.lastSafeAnchorRef),
    originState: requireRef(input.originState, "originState"),
    targetIntent: requireRef(input.targetIntent, "targetIntent"),
    localAckState: input.localAckState,
    processingAcceptanceState: mapProcessingAcceptanceState(settlement),
    externalObservationState: settlement.externalObservationState,
    authoritativeOutcomeState,
    causalToken: requireRef(input.causalToken, "causalToken"),
    settlementRevisionRef: requireRef(settlement.settlementId, "settlementRevisionRef"),
    settlementPolicy: input.settlementPolicy,
    userVisibleMessage:
      optionalRef(input.userVisibleMessage) ??
      defaultVisibleMessage(authoritativeOutcomeState, settlement),
    visibleScope: input.visibleScope,
    startedAt: ensureIsoTimestamp(input.startedAt, "startedAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt ?? settlement.recordedAt, "updatedAt"),
    failureReason: optionalRef(input.failureReason),
    recoveryActionRef: settlement.sameShellRecoveryRef,
    invalidateOnConflict:
      authoritativeOutcomeState === "review_required" ||
      authoritativeOutcomeState === "reconciliation_required",
    lastSafeAnchorRef: optionalRef(input.lastSafeAnchorRef ?? settlement.lastSafeAnchorRef),
    allowedSummaryTier: optionalRef(input.allowedSummaryTier ?? settlement.allowedSummaryTier),
    quietEligibleAt: settlement.quietEligibleAt,
    staleAfterAt: settlement.staleAfterAt,
  };

  validateTransitionEnvelope(envelope, settlement);
  return envelope;
}

export function validateTransitionEnvelope(
  envelope: TransitionEnvelope,
  settlement: CommandSettlementRecordLike,
): void {
  ensureIsoTimestamp(envelope.startedAt, "startedAt");
  ensureIsoTimestamp(envelope.updatedAt, "updatedAt");

  invariant(
    envelope.commandSettlementRef === settlement.settlementId,
    "TransitionEnvelope must point to the originating settlement revision.",
  );
  invariant(
    envelope.processingAcceptanceState !== "accepted_for_processing" ||
      envelope.authoritativeOutcomeState !== "settled" ||
      settlement.authoritativeOutcomeState === "settled",
    "Processing acceptance cannot be rendered as authoritative success.",
  );

  if (envelope.authoritativeOutcomeState === "settled") {
    invariant(
      settlement.authoritativeOutcomeState === "settled",
      "Calm success requires authoritativeOutcomeState = settled on the settlement record.",
    );
    invariant(
      settlement.authoritativeProofClass !== "not_yet_authoritative",
      "Calm success requires authoritative proof.",
    );
    invariant(
      settlement.quietEligibleAt !== null,
      "Calm success requires quietEligibleAt on the settlement record.",
    );
    invariant(
      settlement.auditRecordRef !== null,
      "Calm success requires auditRecordRef on the settlement record.",
    );
    if (settlement.authoritativeProofClass === "projection_visible") {
      invariant(
        settlement.projectionVisibilityRef !== null,
        "Projection-visible calm success requires projectionVisibilityRef.",
      );
    }
  }

  if (envelope.authoritativeOutcomeState === "recovery_required") {
    invariant(
      settlement.sameShellRecoveryRef !== null && envelope.recoveryActionRef !== null,
      "Recoverable settlement must publish a same-shell recovery ref.",
    );
    invariant(
      envelope.lastSafeAnchorRef !== null,
      "Recoverable settlement must preserve lastSafeAnchorRef.",
    );
    invariant(
      envelope.allowedSummaryTier !== null,
      "Recoverable settlement must preserve allowedSummaryTier.",
    );
  }
}
