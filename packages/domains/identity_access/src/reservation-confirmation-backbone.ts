import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";

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

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function optionalIsoTimestamp(value: string | null | undefined, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return ensureIsoTimestamp(value, field);
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureBoundedProbability(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value > 0 && value < 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
  );
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function ensureHexHash(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    /^[a-f0-9]{64}$/i.test(normalized),
    `INVALID_${field.toUpperCase()}_HASH`,
    `${field} must be a 64-character hexadecimal digest.`,
  );
  return normalized.toLowerCase();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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

function nextReservationControlPlaneId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function logistic(logOdds: number): number {
  return 1 / (1 + Math.exp(-logOdds));
}

function logit(probability: number): number {
  return Math.log(probability / (1 - probability));
}

export type CapacityReservationState =
  | "none"
  | "soft_selected"
  | "held"
  | "pending_confirmation"
  | "confirmed"
  | "released"
  | "expired"
  | "disputed";

export type CapacityCommitMode =
  | "exclusive_hold"
  | "truthful_nonexclusive"
  | "degraded_manual_pending";

export interface CapacityReservationSnapshot {
  reservationId: string;
  capacityIdentityRef: string;
  canonicalReservationKey: string;
  sourceDomain: string;
  holderRef: string;
  state: CapacityReservationState;
  commitMode: CapacityCommitMode;
  reservationVersion: number;
  activeFencingToken: string;
  truthBasisHash: string;
  supplierObservedAt: string;
  revalidatedAt: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  releasedAt: string | null;
  supersededByReservationRef: string | null;
  terminalReasonCode: string | null;
}

function validateCapacityReservationSnapshot(
  snapshot: CapacityReservationSnapshot,
): CapacityReservationSnapshot {
  const reservationVersion = ensurePositiveInteger(
    snapshot.reservationVersion,
    "reservationVersion",
  );
  const supplierObservedAt = ensureIsoTimestamp(snapshot.supplierObservedAt, "supplierObservedAt");
  const expiresAt = optionalIsoTimestamp(snapshot.expiresAt, "expiresAt");
  const confirmedAt = optionalIsoTimestamp(snapshot.confirmedAt, "confirmedAt");
  const releasedAt = optionalIsoTimestamp(snapshot.releasedAt, "releasedAt");
  const revalidatedAt = optionalIsoTimestamp(snapshot.revalidatedAt, "revalidatedAt");
  const supersededByReservationRef = optionalRef(snapshot.supersededByReservationRef);
  const terminalReasonCode = optionalRef(snapshot.terminalReasonCode);

  if (snapshot.state === "held") {
    invariant(
      snapshot.commitMode === "exclusive_hold",
      "HELD_REQUIRES_EXCLUSIVE_COMMIT_MODE",
      "held reservations must use exclusive_hold commit mode.",
    );
    invariant(
      expiresAt !== null,
      "HELD_RESERVATION_REQUIRES_EXPIRY",
      "A held reservation must carry the real hold expiry timestamp.",
    );
  }

  if (snapshot.state === "soft_selected") {
    invariant(
      snapshot.commitMode !== "exclusive_hold",
      "SOFT_SELECTED_FORBIDS_EXCLUSIVE_COMMIT_MODE",
      "soft_selected is focus posture only and may not carry exclusive_hold semantics.",
    );
  }

  if (snapshot.state === "confirmed") {
    invariant(
      confirmedAt !== null,
      "CONFIRMED_REQUIRES_CONFIRMED_AT",
      "confirmed reservations require confirmedAt.",
    );
  }

  if (snapshot.state === "released") {
    invariant(
      releasedAt !== null,
      "RELEASED_REQUIRES_RELEASED_AT",
      "released reservations require releasedAt.",
    );
  }

  if (snapshot.state === "expired") {
    invariant(
      expiresAt !== null,
      "EXPIRED_REQUIRES_EXPIRY",
      "expired reservations must preserve the hold or offer expiry timestamp.",
    );
  }

  if (["released", "expired", "disputed"].includes(snapshot.state)) {
    invariant(
      terminalReasonCode !== null,
      "TERMINAL_RESERVATION_REQUIRES_REASON",
      "released, expired, and disputed reservations require a terminalReasonCode.",
    );
  }

  if (supersededByReservationRef !== null) {
    invariant(
      terminalReasonCode !== null,
      "SUPERSESSION_REQUIRES_TERMINAL_REASON",
      "Superseded reservations must preserve a terminalReasonCode.",
    );
  }

  if (expiresAt !== null) {
    invariant(
      compareIso(expiresAt, supplierObservedAt) >= 0,
      "EXPIRY_PRECEDES_SUPPLIER_OBSERVED_AT",
      "expiresAt may not precede supplierObservedAt.",
    );
  }

  if (revalidatedAt !== null) {
    invariant(
      compareIso(revalidatedAt, supplierObservedAt) >= 0,
      "REVALIDATED_PRECEDES_SUPPLIER_OBSERVED_AT",
      "revalidatedAt may not precede supplierObservedAt.",
    );
  }

  if (confirmedAt !== null) {
    invariant(
      compareIso(confirmedAt, supplierObservedAt) >= 0,
      "CONFIRMED_PRECEDES_SUPPLIER_OBSERVED_AT",
      "confirmedAt may not precede supplierObservedAt.",
    );
  }

  if (releasedAt !== null) {
    invariant(
      compareIso(releasedAt, supplierObservedAt) >= 0,
      "RELEASED_PRECEDES_SUPPLIER_OBSERVED_AT",
      "releasedAt may not precede supplierObservedAt.",
    );
  }

  return {
    reservationId: requireRef(snapshot.reservationId, "reservationId"),
    capacityIdentityRef: requireRef(snapshot.capacityIdentityRef, "capacityIdentityRef"),
    canonicalReservationKey: requireRef(
      snapshot.canonicalReservationKey,
      "canonicalReservationKey",
    ),
    sourceDomain: requireRef(snapshot.sourceDomain, "sourceDomain"),
    holderRef: requireRef(snapshot.holderRef, "holderRef"),
    state: snapshot.state,
    commitMode: snapshot.commitMode,
    reservationVersion,
    activeFencingToken: ensureHexHash(snapshot.activeFencingToken, "activeFencingToken"),
    truthBasisHash: ensureHexHash(snapshot.truthBasisHash, "truthBasisHash"),
    supplierObservedAt,
    revalidatedAt,
    expiresAt,
    confirmedAt,
    releasedAt,
    supersededByReservationRef,
    terminalReasonCode,
  };
}

export class CapacityReservationDocument {
  constructor(private readonly snapshot: CapacityReservationSnapshot) {}

  static create(snapshot: CapacityReservationSnapshot): CapacityReservationDocument {
    return new CapacityReservationDocument(validateCapacityReservationSnapshot(snapshot));
  }

  get reservationId(): string {
    return this.snapshot.reservationId;
  }

  get version(): number {
    return this.snapshot.reservationVersion;
  }

  toSnapshot(): CapacityReservationSnapshot {
    return { ...this.snapshot };
  }
}

export function buildCapacityReservationTruthBasisHash(input: {
  capacityIdentityRef: string;
  canonicalReservationKey: string;
  sourceDomain: string;
  holderRef: string;
  state: CapacityReservationState;
  commitMode: CapacityCommitMode;
  reservationVersion: number;
  supplierObservedAt: string;
  revalidatedAt?: string | null;
  expiresAt?: string | null;
  confirmedAt?: string | null;
  releasedAt?: string | null;
  terminalReasonCode?: string | null;
}): string {
  return sha256Hex(
    stableStringify({
      capacityIdentityRef: requireRef(input.capacityIdentityRef, "capacityIdentityRef"),
      canonicalReservationKey: requireRef(input.canonicalReservationKey, "canonicalReservationKey"),
      sourceDomain: requireRef(input.sourceDomain, "sourceDomain"),
      holderRef: requireRef(input.holderRef, "holderRef"),
      state: input.state,
      commitMode: input.commitMode,
      reservationVersion: ensurePositiveInteger(input.reservationVersion, "reservationVersion"),
      supplierObservedAt: ensureIsoTimestamp(input.supplierObservedAt, "supplierObservedAt"),
      revalidatedAt: optionalRef(input.revalidatedAt),
      expiresAt: optionalRef(input.expiresAt),
      confirmedAt: optionalRef(input.confirmedAt),
      releasedAt: optionalRef(input.releasedAt),
      terminalReasonCode: optionalRef(input.terminalReasonCode),
    }),
  );
}

export function buildCapacityReservationFencingToken(input: {
  canonicalReservationKey: string;
  reservationVersion: number;
  holderRef: string;
  sourceDomain: string;
}): string {
  return sha256Hex(
    stableStringify({
      canonicalReservationKey: requireRef(input.canonicalReservationKey, "canonicalReservationKey"),
      reservationVersion: ensurePositiveInteger(input.reservationVersion, "reservationVersion"),
      holderRef: requireRef(input.holderRef, "holderRef"),
      sourceDomain: requireRef(input.sourceDomain, "sourceDomain"),
    }),
  );
}

export function buildReservationVersionRef(input: {
  reservationId: string;
  reservationVersion: number;
}): string {
  return `${requireRef(input.reservationId, "reservationId")}@v${ensurePositiveInteger(
    input.reservationVersion,
    "reservationVersion",
  )}`;
}

export type ReservationTruthState =
  | "exclusive_held"
  | "truthful_nonexclusive"
  | "pending_confirmation"
  | "confirmed"
  | "disputed"
  | "released"
  | "expired"
  | "revalidation_required"
  | "unavailable";

export type DisplayExclusivityState = "exclusive" | "nonexclusive" | "none";
export type ReservationCountdownMode = "none" | "hold_expiry";
export type ProjectionFreshnessState = "fresh" | "stale" | "invalid";

export interface ReservationTruthProjectionSnapshot {
  reservationTruthProjectionId: string;
  capacityReservationRef: string;
  canonicalReservationKey: string;
  sourceDomain: string;
  sourceObjectRef: string;
  selectedAnchorRef: string;
  truthState: ReservationTruthState;
  displayExclusivityState: DisplayExclusivityState;
  countdownMode: ReservationCountdownMode;
  exclusiveUntilAt: string | null;
  reservationVersionRef: string;
  truthBasisHash: string;
  projectionFreshnessEnvelopeRef: string;
  reasonRefs: readonly string[];
  generatedAt: string;
  projectionRevision: number;
}

function validateReservationTruthProjectionSnapshot(
  snapshot: ReservationTruthProjectionSnapshot,
): ReservationTruthProjectionSnapshot {
  const exclusiveUntilAt = optionalIsoTimestamp(snapshot.exclusiveUntilAt, "exclusiveUntilAt");
  const generatedAt = ensureIsoTimestamp(snapshot.generatedAt, "generatedAt");
  const projectionRevision = ensurePositiveInteger(
    snapshot.projectionRevision,
    "projectionRevision",
  );

  if (snapshot.displayExclusivityState === "exclusive") {
    invariant(
      snapshot.truthState === "exclusive_held",
      "EXCLUSIVE_DISPLAY_REQUIRES_HELD_TRUTH",
      "displayExclusivityState=exclusive is legal only for exclusive_held truth.",
    );
    invariant(
      snapshot.countdownMode === "hold_expiry",
      "EXCLUSIVE_DISPLAY_REQUIRES_HOLD_COUNTDOWN",
      "Exclusive display requires hold_expiry countdown mode.",
    );
    invariant(
      exclusiveUntilAt !== null,
      "EXCLUSIVE_DISPLAY_REQUIRES_EXPIRY",
      "Exclusive display requires exclusiveUntilAt.",
    );
  }

  if (snapshot.countdownMode === "hold_expiry") {
    invariant(
      snapshot.truthState === "exclusive_held" && exclusiveUntilAt !== null,
      "COUNTDOWN_MODE_REQUIRES_LIVE_HELD_RESERVATION",
      "hold_expiry countdown is legal only for an exclusive held reservation with a real expiry.",
    );
  }

  if (snapshot.truthState === "truthful_nonexclusive") {
    invariant(
      snapshot.displayExclusivityState === "nonexclusive",
      "TRUTHFUL_NONEXCLUSIVE_REQUIRES_NONEXCLUSIVE_DISPLAY",
      "truthful_nonexclusive projections must render nonexclusive wording.",
    );
    invariant(
      snapshot.countdownMode === "none",
      "TRUTHFUL_NONEXCLUSIVE_FORBIDS_COUNTDOWN",
      "truthful_nonexclusive projections may not render hold countdowns.",
    );
  }

  if (snapshot.truthState === "pending_confirmation") {
    invariant(
      snapshot.displayExclusivityState !== "exclusive",
      "PENDING_CONFIRMATION_FORBIDS_EXCLUSIVE_COPY",
      "pending_confirmation may not render exclusive hold language.",
    );
  }

  return {
    reservationTruthProjectionId: requireRef(
      snapshot.reservationTruthProjectionId,
      "reservationTruthProjectionId",
    ),
    capacityReservationRef: requireRef(snapshot.capacityReservationRef, "capacityReservationRef"),
    canonicalReservationKey: requireRef(
      snapshot.canonicalReservationKey,
      "canonicalReservationKey",
    ),
    sourceDomain: requireRef(snapshot.sourceDomain, "sourceDomain"),
    sourceObjectRef: requireRef(snapshot.sourceObjectRef, "sourceObjectRef"),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    truthState: snapshot.truthState,
    displayExclusivityState: snapshot.displayExclusivityState,
    countdownMode: snapshot.countdownMode,
    exclusiveUntilAt,
    reservationVersionRef: requireRef(snapshot.reservationVersionRef, "reservationVersionRef"),
    truthBasisHash: ensureHexHash(snapshot.truthBasisHash, "truthBasisHash"),
    projectionFreshnessEnvelopeRef: requireRef(
      snapshot.projectionFreshnessEnvelopeRef,
      "projectionFreshnessEnvelopeRef",
    ),
    reasonRefs: uniqueSortedRefs(snapshot.reasonRefs),
    generatedAt,
    projectionRevision,
  };
}

export class ReservationTruthProjectionDocument {
  constructor(private readonly snapshot: ReservationTruthProjectionSnapshot) {}

  static create(snapshot: ReservationTruthProjectionSnapshot): ReservationTruthProjectionDocument {
    return new ReservationTruthProjectionDocument(
      validateReservationTruthProjectionSnapshot(snapshot),
    );
  }

  get reservationTruthProjectionId(): string {
    return this.snapshot.reservationTruthProjectionId;
  }

  get version(): number {
    return this.snapshot.projectionRevision;
  }

  toSnapshot(): ReservationTruthProjectionSnapshot {
    return {
      ...this.snapshot,
      reasonRefs: [...this.snapshot.reasonRefs],
    };
  }
}

export interface BuildReservationTruthProjectionInput {
  reservationTruthProjectionId: string;
  reservation: CapacityReservationSnapshot;
  sourceObjectRef: string;
  selectedAnchorRef: string;
  projectionFreshnessEnvelopeRef: string;
  generatedAt: string;
  projectionRevision: number;
  capacityIdentitySupportsExclusivity?: boolean;
  freshnessState?: ProjectionFreshnessState;
  currentTruthBasisHash?: string | null;
}

export function buildReservationTruthProjection(
  input: BuildReservationTruthProjectionInput,
): ReservationTruthProjectionDocument {
  const reservation = validateCapacityReservationSnapshot(input.reservation);
  const capacityIdentitySupportsExclusivity = input.capacityIdentitySupportsExclusivity ?? true;
  const freshnessState = input.freshnessState ?? "fresh";
  const currentTruthBasisHash = optionalRef(input.currentTruthBasisHash);

  let displayExclusivityState: DisplayExclusivityState = "none";
  let countdownMode: ReservationCountdownMode = "none";
  let exclusiveUntilAt: string | null = null;
  const reasonRefs: string[] = [];

  const basisMismatch =
    currentTruthBasisHash !== null && currentTruthBasisHash !== reservation.truthBasisHash;
  if (basisMismatch) {
    reasonRefs.push("truth_basis_hash_mismatch");
  }
  if (freshnessState !== "fresh") {
    reasonRefs.push(`projection_${freshnessState}`);
  }

  const truthState: ReservationTruthState = (() => {
    if (reservation.state === "released") {
      reasonRefs.push("reservation_released");
      return "released";
    }
    if (reservation.state === "expired") {
      reasonRefs.push("reservation_expired");
      return "expired";
    }
    if (reservation.state === "disputed") {
      reasonRefs.push("reservation_disputed");
      return "disputed";
    }
    if (basisMismatch || freshnessState !== "fresh") {
      return freshnessState === "invalid" ? "unavailable" : "revalidation_required";
    }
    if (reservation.state === "confirmed") {
      reasonRefs.push("authoritative_confirmation_seen");
      return "confirmed";
    }
    if (reservation.state === "pending_confirmation") {
      reasonRefs.push("awaiting_external_confirmation");
      return "pending_confirmation";
    }
    if (
      reservation.state === "held" &&
      reservation.commitMode === "exclusive_hold" &&
      capacityIdentitySupportsExclusivity &&
      reservation.expiresAt !== null
    ) {
      displayExclusivityState = "exclusive";
      countdownMode = "hold_expiry";
      exclusiveUntilAt = reservation.expiresAt;
      reasonRefs.push("real_exclusive_hold");
      return "exclusive_held";
    }
    if (
      reservation.state === "soft_selected" ||
      reservation.commitMode === "truthful_nonexclusive" ||
      reservation.commitMode === "degraded_manual_pending" ||
      reservation.state === "held"
    ) {
      displayExclusivityState = "nonexclusive";
      reasonRefs.push("selection_is_not_exclusivity");
      if (reservation.commitMode === "degraded_manual_pending") {
        reasonRefs.push("subject_to_live_confirmation");
      }
      return "truthful_nonexclusive";
    }
    reasonRefs.push("reservation_unavailable");
    return "unavailable";
  })();

  return ReservationTruthProjectionDocument.create({
    reservationTruthProjectionId: requireRef(
      input.reservationTruthProjectionId,
      "reservationTruthProjectionId",
    ),
    capacityReservationRef: reservation.reservationId,
    canonicalReservationKey: reservation.canonicalReservationKey,
    sourceDomain: reservation.sourceDomain,
    sourceObjectRef: requireRef(input.sourceObjectRef, "sourceObjectRef"),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    truthState,
    displayExclusivityState,
    countdownMode,
    exclusiveUntilAt,
    reservationVersionRef: buildReservationVersionRef({
      reservationId: reservation.reservationId,
      reservationVersion: reservation.reservationVersion,
    }),
    truthBasisHash: reservation.truthBasisHash,
    projectionFreshnessEnvelopeRef: requireRef(
      input.projectionFreshnessEnvelopeRef,
      "projectionFreshnessEnvelopeRef",
    ),
    reasonRefs,
    generatedAt: ensureIsoTimestamp(input.generatedAt, "generatedAt"),
    projectionRevision: ensurePositiveInteger(input.projectionRevision, "projectionRevision"),
  });
}

export interface ReservationTruthValidationOptions {
  capacityIdentitySupportsExclusivity?: boolean;
  freshnessState?: ProjectionFreshnessState;
  currentTruthBasisHash?: string | null;
}

export function validateReservationTruthProjection(
  reservation: CapacityReservationSnapshot,
  projection: ReservationTruthProjectionSnapshot,
  options?: ReservationTruthValidationOptions,
): void {
  const normalizedReservation = validateCapacityReservationSnapshot(reservation);
  const normalizedProjection = validateReservationTruthProjectionSnapshot(projection);
  invariant(
    normalizedProjection.capacityReservationRef === normalizedReservation.reservationId,
    "PROJECTION_RESERVATION_REF_MISMATCH",
    "ReservationTruthProjection must bind to the same capacity reservation.",
  );
  invariant(
    normalizedProjection.canonicalReservationKey === normalizedReservation.canonicalReservationKey,
    "PROJECTION_CANONICAL_KEY_MISMATCH",
    "ReservationTruthProjection canonicalReservationKey drifted from the reservation.",
  );

  const expected = buildReservationTruthProjection({
    reservationTruthProjectionId: normalizedProjection.reservationTruthProjectionId,
    reservation: normalizedReservation,
    sourceObjectRef: normalizedProjection.sourceObjectRef,
    selectedAnchorRef: normalizedProjection.selectedAnchorRef,
    projectionFreshnessEnvelopeRef: normalizedProjection.projectionFreshnessEnvelopeRef,
    generatedAt: normalizedProjection.generatedAt,
    projectionRevision: normalizedProjection.projectionRevision,
    capacityIdentitySupportsExclusivity: options?.capacityIdentitySupportsExclusivity,
    freshnessState: options?.freshnessState,
    currentTruthBasisHash: options?.currentTruthBasisHash,
  }).toSnapshot();

  invariant(
    normalizedProjection.truthState === expected.truthState,
    "TRUTH_STATE_DRIFT",
    `Projection truthState drifted from the reservation law: expected ${expected.truthState}, found ${normalizedProjection.truthState}.`,
  );
  invariant(
    normalizedProjection.displayExclusivityState === expected.displayExclusivityState,
    "DISPLAY_EXCLUSIVITY_DRIFT",
    "Projection displayExclusivityState drifted from the reservation law.",
  );
  invariant(
    normalizedProjection.countdownMode === expected.countdownMode,
    "COUNTDOWN_MODE_DRIFT",
    "Projection countdownMode drifted from the reservation law.",
  );
  invariant(
    normalizedProjection.exclusiveUntilAt === expected.exclusiveUntilAt,
    "EXCLUSIVE_UNTIL_DRIFT",
    "Projection exclusiveUntilAt drifted from the reservation law.",
  );
}

export interface ExternalConfirmationThresholdPolicy {
  policyRef: string;
  tauHold: number;
  tauConfirm: number;
  deltaConfirm: number;
  weakManualMinSourceFamilies: number;
}

export const defaultReservationConfirmationThresholdPolicy = {
  policyRef: "external_confirmation_thresholds::par_074_v1",
  tauHold: 0.55,
  tauConfirm: 0.82,
  deltaConfirm: 0.18,
  weakManualMinSourceFamilies: 2,
} as const satisfies ExternalConfirmationThresholdPolicy;

export interface ConfirmationEvidenceAtom {
  evidenceRef: string;
  sourceFamily: string;
  proofRef?: string | null;
  logLikelihoodWeight: number;
  polarity: "positive" | "negative";
  satisfiesHardMatchRefs?: readonly string[];
  failsHardMatchRefs?: readonly string[];
  contradictory?: boolean;
}

export type ConfirmationAssuranceLevel = "strong" | "moderate" | "weak" | "manual";
export type ExternalConfirmationGateState =
  | "pending"
  | "confirmed"
  | "expired"
  | "disputed"
  | "cancelled";

export interface ExternalConfirmationGateSnapshot {
  gateId: string;
  episodeId: string;
  domain: string;
  domainObjectRef: string;
  transportMode: string;
  assuranceLevel: ConfirmationAssuranceLevel;
  evidenceModelVersionRef: string;
  requiredHardMatchRefs: readonly string[];
  positiveEvidenceRefs: readonly string[];
  negativeEvidenceRefs: readonly string[];
  proofRefs: readonly string[];
  confirmationDeadlineAt: string;
  priorProbability: number;
  posteriorLogOdds: number;
  confirmationConfidence: number;
  competingGateMargin: number;
  state: ExternalConfirmationGateState;
  createdAt: string;
  updatedAt: string;
  gateRevision: number;
  thresholdPolicyRef: string;
  tauHold: number;
  tauConfirm: number;
  deltaConfirm: number;
  sourceFamilyRefs: readonly string[];
  satisfiedHardMatchRefs: readonly string[];
  failedHardMatchRefs: readonly string[];
  contradictoryEvidenceRefs: readonly string[];
  manualOverrideRequested: boolean;
}

function validateThresholdPolicy(
  policy: ExternalConfirmationThresholdPolicy,
): ExternalConfirmationThresholdPolicy {
  const tauHold = ensureUnitInterval(policy.tauHold, "tauHold");
  const tauConfirm = ensureUnitInterval(policy.tauConfirm, "tauConfirm");
  const deltaConfirm = ensureUnitInterval(policy.deltaConfirm, "deltaConfirm");
  invariant(
    tauHold < tauConfirm,
    "TAU_HOLD_MUST_BE_BELOW_TAU_CONFIRM",
    "tauHold must be below tauConfirm.",
  );
  return {
    policyRef: requireRef(policy.policyRef, "policyRef"),
    tauHold,
    tauConfirm,
    deltaConfirm,
    weakManualMinSourceFamilies: ensurePositiveInteger(
      policy.weakManualMinSourceFamilies,
      "weakManualMinSourceFamilies",
    ),
  };
}

function validateExternalConfirmationGateSnapshot(
  snapshot: ExternalConfirmationGateSnapshot,
): ExternalConfirmationGateSnapshot {
  const createdAt = ensureIsoTimestamp(snapshot.createdAt, "createdAt");
  const updatedAt = ensureIsoTimestamp(snapshot.updatedAt, "updatedAt");
  const confirmationDeadlineAt = ensureIsoTimestamp(
    snapshot.confirmationDeadlineAt,
    "confirmationDeadlineAt",
  );
  invariant(
    compareIso(updatedAt, createdAt) >= 0,
    "UPDATED_AT_PRECEDES_CREATED_AT",
    "updatedAt may not precede createdAt.",
  );
  const policy = validateThresholdPolicy({
    policyRef: snapshot.thresholdPolicyRef,
    tauHold: snapshot.tauHold,
    tauConfirm: snapshot.tauConfirm,
    deltaConfirm: snapshot.deltaConfirm,
    weakManualMinSourceFamilies: 2,
  });

  const priorProbability = ensureBoundedProbability(snapshot.priorProbability, "priorProbability");
  const confirmationConfidence = ensureUnitInterval(
    snapshot.confirmationConfidence,
    "confirmationConfidence",
  );
  invariant(
    Math.abs(logistic(snapshot.posteriorLogOdds) - confirmationConfidence) < 1e-9,
    "POSTERIOR_LOG_ODDS_DRIFT",
    "posteriorLogOdds and confirmationConfidence must agree under the logistic transform.",
  );

  return {
    gateId: requireRef(snapshot.gateId, "gateId"),
    episodeId: requireRef(snapshot.episodeId, "episodeId"),
    domain: requireRef(snapshot.domain, "domain"),
    domainObjectRef: requireRef(snapshot.domainObjectRef, "domainObjectRef"),
    transportMode: requireRef(snapshot.transportMode, "transportMode"),
    assuranceLevel: snapshot.assuranceLevel,
    evidenceModelVersionRef: requireRef(
      snapshot.evidenceModelVersionRef,
      "evidenceModelVersionRef",
    ),
    requiredHardMatchRefs: uniqueSortedRefs(snapshot.requiredHardMatchRefs),
    positiveEvidenceRefs: uniqueSortedRefs(snapshot.positiveEvidenceRefs),
    negativeEvidenceRefs: uniqueSortedRefs(snapshot.negativeEvidenceRefs),
    proofRefs: uniqueSortedRefs(snapshot.proofRefs),
    confirmationDeadlineAt,
    priorProbability,
    posteriorLogOdds: snapshot.posteriorLogOdds,
    confirmationConfidence,
    competingGateMargin: snapshot.competingGateMargin,
    state: snapshot.state,
    createdAt,
    updatedAt,
    gateRevision: ensurePositiveInteger(snapshot.gateRevision, "gateRevision"),
    thresholdPolicyRef: policy.policyRef,
    tauHold: policy.tauHold,
    tauConfirm: policy.tauConfirm,
    deltaConfirm: policy.deltaConfirm,
    sourceFamilyRefs: uniqueSortedRefs(snapshot.sourceFamilyRefs),
    satisfiedHardMatchRefs: uniqueSortedRefs(snapshot.satisfiedHardMatchRefs),
    failedHardMatchRefs: uniqueSortedRefs(snapshot.failedHardMatchRefs),
    contradictoryEvidenceRefs: uniqueSortedRefs(snapshot.contradictoryEvidenceRefs),
    manualOverrideRequested: snapshot.manualOverrideRequested,
  };
}

export class ExternalConfirmationGateDocument {
  constructor(private readonly snapshot: ExternalConfirmationGateSnapshot) {}

  static create(snapshot: ExternalConfirmationGateSnapshot): ExternalConfirmationGateDocument {
    return new ExternalConfirmationGateDocument(validateExternalConfirmationGateSnapshot(snapshot));
  }

  get gateId(): string {
    return this.snapshot.gateId;
  }

  get version(): number {
    return this.snapshot.gateRevision;
  }

  toSnapshot(): ExternalConfirmationGateSnapshot {
    return {
      ...this.snapshot,
      requiredHardMatchRefs: [...this.snapshot.requiredHardMatchRefs],
      positiveEvidenceRefs: [...this.snapshot.positiveEvidenceRefs],
      negativeEvidenceRefs: [...this.snapshot.negativeEvidenceRefs],
      proofRefs: [...this.snapshot.proofRefs],
      sourceFamilyRefs: [...this.snapshot.sourceFamilyRefs],
      satisfiedHardMatchRefs: [...this.snapshot.satisfiedHardMatchRefs],
      failedHardMatchRefs: [...this.snapshot.failedHardMatchRefs],
      contradictoryEvidenceRefs: [...this.snapshot.contradictoryEvidenceRefs],
    };
  }
}

export interface BuildExternalConfirmationGateInput {
  gateId: string;
  episodeId: string;
  domain: string;
  domainObjectRef: string;
  transportMode: string;
  assuranceLevel: ConfirmationAssuranceLevel;
  evidenceModelVersionRef: string;
  requiredHardMatchRefs: readonly string[];
  evidenceAtoms: readonly ConfirmationEvidenceAtom[];
  confirmationDeadlineAt: string;
  priorProbability: number;
  createdAt: string;
  updatedAt: string;
  gateRevision: number;
  thresholdPolicy: ExternalConfirmationThresholdPolicy;
  competingGateConfidences?: readonly number[];
  manualOverrideRequested?: boolean;
}

export function buildExternalConfirmationGate(
  input: BuildExternalConfirmationGateInput,
): ExternalConfirmationGateDocument {
  const thresholdPolicy = validateThresholdPolicy(input.thresholdPolicy);
  const requiredHardMatchRefs = uniqueSortedRefs(input.requiredHardMatchRefs);
  const positiveEvidenceRefs: string[] = [];
  const negativeEvidenceRefs: string[] = [];
  const proofRefs = new Set<string>();
  const sourceFamilies = new Set<string>();
  const satisfiedHardMatchRefs = new Set<string>();
  const failedHardMatchRefs = new Set<string>();
  const contradictoryEvidenceRefs = new Set<string>();
  let posteriorLogOdds = logit(
    ensureBoundedProbability(input.priorProbability, "priorProbability"),
  );

  for (const atom of input.evidenceAtoms) {
    const evidenceRef = requireRef(atom.evidenceRef, "evidenceRef");
    const sourceFamily = requireRef(atom.sourceFamily, "sourceFamily");
    sourceFamilies.add(sourceFamily);
    if (atom.proofRef) {
      proofRefs.add(requireRef(atom.proofRef, "proofRef"));
    }
    if (atom.polarity === "positive") {
      positiveEvidenceRefs.push(evidenceRef);
      posteriorLogOdds += atom.logLikelihoodWeight;
    } else {
      negativeEvidenceRefs.push(evidenceRef);
      posteriorLogOdds -= Math.abs(atom.logLikelihoodWeight);
    }
    for (const hardMatchRef of atom.satisfiesHardMatchRefs ?? []) {
      satisfiedHardMatchRefs.add(requireRef(hardMatchRef, "satisfiesHardMatchRefs"));
    }
    for (const hardMatchRef of atom.failsHardMatchRefs ?? []) {
      failedHardMatchRefs.add(requireRef(hardMatchRef, "failsHardMatchRefs"));
    }
    if (atom.contradictory) {
      contradictoryEvidenceRefs.add(evidenceRef);
    }
  }

  const confirmationConfidence = logistic(posteriorLogOdds);
  const competingGateConfidences = (input.competingGateConfidences ?? []).map((value) =>
    ensureUnitInterval(value, "competingGateConfidence"),
  );
  const competingGateMargin =
    competingGateConfidences.length === 0
      ? 1
      : confirmationConfidence - Math.max(...competingGateConfidences);
  const hardMatchesSatisfied = requiredHardMatchRefs.every((ref) =>
    satisfiedHardMatchRefs.has(ref),
  );
  const hardMatchFailed = failedHardMatchRefs.size > 0;
  const contradictoryEvidence = contradictoryEvidenceRefs.size > 0;
  const weakManualSourceFamiliesSatisfied =
    input.assuranceLevel === "strong" ||
    input.assuranceLevel === "moderate" ||
    sourceFamilies.size >= thresholdPolicy.weakManualMinSourceFamilies;
  const confirmationDeadlineAt = ensureIsoTimestamp(
    input.confirmationDeadlineAt,
    "confirmationDeadlineAt",
  );
  const updatedAt = ensureIsoTimestamp(input.updatedAt, "updatedAt");
  const manualOverrideRequested = input.manualOverrideRequested ?? false;

  const state: ExternalConfirmationGateState =
    manualOverrideRequested && !weakManualSourceFamiliesSatisfied
      ? "disputed"
      : contradictoryEvidence ||
          hardMatchFailed ||
          (competingGateConfidences.length > 0 &&
            competingGateMargin < thresholdPolicy.deltaConfirm &&
            confirmationConfidence >= thresholdPolicy.tauHold)
        ? "disputed"
        : compareIso(updatedAt, confirmationDeadlineAt) > 0 &&
            (!hardMatchesSatisfied || confirmationConfidence < thresholdPolicy.tauHold)
          ? "expired"
          : hardMatchesSatisfied &&
              confirmationConfidence >= thresholdPolicy.tauConfirm &&
              competingGateMargin >= thresholdPolicy.deltaConfirm &&
              weakManualSourceFamiliesSatisfied
            ? "confirmed"
            : "pending";

  return ExternalConfirmationGateDocument.create({
    gateId: requireRef(input.gateId, "gateId"),
    episodeId: requireRef(input.episodeId, "episodeId"),
    domain: requireRef(input.domain, "domain"),
    domainObjectRef: requireRef(input.domainObjectRef, "domainObjectRef"),
    transportMode: requireRef(input.transportMode, "transportMode"),
    assuranceLevel: input.assuranceLevel,
    evidenceModelVersionRef: requireRef(input.evidenceModelVersionRef, "evidenceModelVersionRef"),
    requiredHardMatchRefs,
    positiveEvidenceRefs,
    negativeEvidenceRefs,
    proofRefs: [...proofRefs].sort(),
    confirmationDeadlineAt,
    priorProbability: input.priorProbability,
    posteriorLogOdds,
    confirmationConfidence,
    competingGateMargin,
    state,
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt,
    gateRevision: ensurePositiveInteger(input.gateRevision, "gateRevision"),
    thresholdPolicyRef: thresholdPolicy.policyRef,
    tauHold: thresholdPolicy.tauHold,
    tauConfirm: thresholdPolicy.tauConfirm,
    deltaConfirm: thresholdPolicy.deltaConfirm,
    sourceFamilyRefs: [...sourceFamilies].sort(),
    satisfiedHardMatchRefs: [...satisfiedHardMatchRefs].sort(),
    failedHardMatchRefs: [...failedHardMatchRefs].sort(),
    contradictoryEvidenceRefs: [...contradictoryEvidenceRefs].sort(),
    manualOverrideRequested,
  });
}

export function validateExternalConfirmationGateState(
  gate: ExternalConfirmationGateSnapshot,
): void {
  const normalized = validateExternalConfirmationGateSnapshot(gate);
  const hardMatchesSatisfied = normalized.requiredHardMatchRefs.every((ref) =>
    normalized.satisfiedHardMatchRefs.includes(ref),
  );
  const contradictoryEvidence = normalized.contradictoryEvidenceRefs.length > 0;
  const hardMatchFailed = normalized.failedHardMatchRefs.length > 0;
  const weakManualNeedsCorroboration =
    (normalized.assuranceLevel === "weak" || normalized.assuranceLevel === "manual") &&
    normalized.sourceFamilyRefs.length < 2;

  if (normalized.state === "confirmed") {
    invariant(
      hardMatchesSatisfied,
      "CONFIRMED_GATE_MISSING_HARD_MATCH",
      "confirmed gates require every required hard match.",
    );
    invariant(
      normalized.confirmationConfidence >= normalized.tauConfirm,
      "CONFIRMED_GATE_BELOW_TAU_CONFIRM",
      "confirmed gates require confirmationConfidence >= tauConfirm.",
    );
    invariant(
      normalized.competingGateMargin >= normalized.deltaConfirm,
      "CONFIRMED_GATE_BELOW_DELTA_CONFIRM",
      "confirmed gates require competingGateMargin >= deltaConfirm.",
    );
    invariant(
      !weakManualNeedsCorroboration,
      "WEAK_MANUAL_GATE_MISSING_INDEPENDENT_CORROBORATION",
      "weak or manual confirmed gates require at least two independent source families.",
    );
  }

  if (normalized.state === "pending") {
    invariant(
      !contradictoryEvidence && !hardMatchFailed,
      "PENDING_GATE_WITH_CONTRADICTION",
      "pending gates may not suppress contradictory evidence or hard-match failure.",
    );
  }

  if (normalized.state === "expired") {
    invariant(
      normalized.confirmationConfidence < normalized.tauHold || !hardMatchesSatisfied,
      "EXPIRED_GATE_WITH_SUFFICIENT_CONFIDENCE",
      "expired gates require low confidence or unsatisfied hard matches at the deadline.",
    );
  }

  if (normalized.state === "disputed") {
    invariant(
      contradictoryEvidence ||
        hardMatchFailed ||
        normalized.manualOverrideRequested ||
        normalized.competingGateMargin < normalized.deltaConfirm,
      "DISPUTED_GATE_MISSING_CAUSE",
      "disputed gates require contradiction, hard-match failure, competing ambiguity, or invalid manual override.",
    );
  }
}

export function validateReservationConfirmationBundle(input: {
  reservation: CapacityReservationSnapshot;
  projection: ReservationTruthProjectionSnapshot;
  gate?: ExternalConfirmationGateSnapshot | null;
  truthOptions?: ReservationTruthValidationOptions;
}): void {
  validateReservationTruthProjection(input.reservation, input.projection, input.truthOptions);
  if (input.gate) {
    validateExternalConfirmationGateState(input.gate);
  }
  if (input.reservation.state === "pending_confirmation") {
    invariant(
      input.gate !== null && input.gate !== undefined,
      "PENDING_CONFIRMATION_REQUIRES_GATE",
      "pending_confirmation reservations require an ExternalConfirmationGate.",
    );
  }
  if (
    input.reservation.state === "confirmed" &&
    input.reservation.commitMode === "degraded_manual_pending"
  ) {
    invariant(
      input.gate?.state === "confirmed",
      "WEAK_MANUAL_CONFIRMATION_REQUIRES_CONFIRMED_GATE",
      "weak or manual confirmed reservations require a confirmed gate.",
    );
  }
  if (input.projection.truthState === "confirmed") {
    invariant(
      input.reservation.state === "confirmed",
      "CONFIRMED_PROJECTION_WITHOUT_CONFIRMED_RESERVATION",
      "confirmed projections require a confirmed reservation.",
    );
  }
}

export function validateCapacityReservationLedger(
  reservations: readonly CapacityReservationSnapshot[],
): void {
  const byKey = new Map<string, CapacityReservationSnapshot[]>();
  for (const reservation of reservations.map((entry) =>
    validateCapacityReservationSnapshot(entry),
  )) {
    const list = byKey.get(reservation.canonicalReservationKey) ?? [];
    list.push(reservation);
    byKey.set(reservation.canonicalReservationKey, list);
  }

  for (const [canonicalReservationKey, chain] of byKey) {
    const liveExclusive = chain.filter(
      (reservation) =>
        reservation.commitMode === "exclusive_hold" &&
        ["held", "pending_confirmation", "confirmed"].includes(reservation.state),
    );
    invariant(
      liveExclusive.length <= 1,
      "MULTIPLE_LIVE_EXCLUSIVE_RESERVATIONS",
      `canonicalReservationKey ${canonicalReservationKey} has competing exclusive live reservations.`,
    );

    const sortedByVersion = [...chain].sort(
      (left, right) => left.reservationVersion - right.reservationVersion,
    );
    for (let index = 1; index < sortedByVersion.length; index += 1) {
      const previous = sortedByVersion[index - 1]!;
      const current = sortedByVersion[index]!;
      invariant(
        current.reservationVersion > previous.reservationVersion,
        "NON_MONOTONE_RESERVATION_VERSION",
        `canonicalReservationKey ${canonicalReservationKey} must increase reservationVersion monotonically.`,
      );
      if (["released", "expired", "disputed"].includes(previous.state)) {
        invariant(
          previous.supersededByReservationRef !== null ||
            current.reservationVersion > previous.reservationVersion,
          "TERMINAL_RESERVATION_REVIVED",
          `Terminal reservation ${previous.reservationId} may not revive without supersession or version advance.`,
        );
      }
    }
  }
}

export interface CapacityReservationRepository {
  getCapacityReservation(reservationId: string): Promise<CapacityReservationDocument | null>;
  listCapacityReservations(): Promise<readonly CapacityReservationDocument[]>;
  listCapacityReservationsByCanonicalKey(
    canonicalReservationKey: string,
  ): Promise<readonly CapacityReservationDocument[]>;
  saveCapacityReservation(
    reservation: CapacityReservationDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ReservationTruthProjectionRepository {
  getReservationTruthProjection(
    reservationTruthProjectionId: string,
  ): Promise<ReservationTruthProjectionDocument | null>;
  listReservationTruthProjections(): Promise<readonly ReservationTruthProjectionDocument[]>;
  getLatestReservationTruthProjectionForReservation(
    reservationId: string,
  ): Promise<ReservationTruthProjectionDocument | null>;
  saveReservationTruthProjection(
    projection: ReservationTruthProjectionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ExternalConfirmationGateRepository {
  getExternalConfirmationGate(gateId: string): Promise<ExternalConfirmationGateDocument | null>;
  listExternalConfirmationGates(): Promise<readonly ExternalConfirmationGateDocument[]>;
  listExternalConfirmationGatesForDomainObject(
    domain: string,
    domainObjectRef: string,
  ): Promise<readonly ExternalConfirmationGateDocument[]>;
  saveExternalConfirmationGate(
    gate: ExternalConfirmationGateDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ReservationConfirmationDependencies
  extends CapacityReservationRepository,
    ReservationTruthProjectionRepository,
    ExternalConfirmationGateRepository {}

export class InMemoryReservationConfirmationStore implements ReservationConfirmationDependencies {
  private readonly reservations = new Map<
    string,
    CapacityReservationDocument & { version: number }
  >();
  private readonly projections = new Map<
    string,
    ReservationTruthProjectionDocument & { version: number }
  >();
  private readonly gates = new Map<
    string,
    ExternalConfirmationGateDocument & { version: number }
  >();
  private readonly latestProjectionByReservation = new Map<string, string>();

  async getCapacityReservation(reservationId: string): Promise<CapacityReservationDocument | null> {
    return this.reservations.get(reservationId) ?? null;
  }

  async listCapacityReservations(): Promise<readonly CapacityReservationDocument[]> {
    return [...this.reservations.values()].sort((left, right) =>
      left
        .toSnapshot()
        .canonicalReservationKey.localeCompare(right.toSnapshot().canonicalReservationKey),
    );
  }

  async listCapacityReservationsByCanonicalKey(
    canonicalReservationKey: string,
  ): Promise<readonly CapacityReservationDocument[]> {
    return (await this.listCapacityReservations()).filter(
      (entry) => entry.toSnapshot().canonicalReservationKey === canonicalReservationKey,
    );
  }

  async saveCapacityReservation(
    reservation: CapacityReservationDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.reservations, reservation.reservationId, reservation as never, options);
  }

  async getReservationTruthProjection(
    reservationTruthProjectionId: string,
  ): Promise<ReservationTruthProjectionDocument | null> {
    return this.projections.get(reservationTruthProjectionId) ?? null;
  }

  async listReservationTruthProjections(): Promise<readonly ReservationTruthProjectionDocument[]> {
    return [...this.projections.values()].sort((left, right) =>
      left
        .toSnapshot()
        .capacityReservationRef.localeCompare(right.toSnapshot().capacityReservationRef),
    );
  }

  async getLatestReservationTruthProjectionForReservation(
    reservationId: string,
  ): Promise<ReservationTruthProjectionDocument | null> {
    const projectionId = this.latestProjectionByReservation.get(reservationId);
    return projectionId ? (this.projections.get(projectionId) ?? null) : null;
  }

  async saveReservationTruthProjection(
    projection: ReservationTruthProjectionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.projections,
      projection.reservationTruthProjectionId,
      projection as never,
      options,
    );
    this.latestProjectionByReservation.set(
      projection.toSnapshot().capacityReservationRef,
      projection.reservationTruthProjectionId,
    );
  }

  async getExternalConfirmationGate(
    gateId: string,
  ): Promise<ExternalConfirmationGateDocument | null> {
    return this.gates.get(gateId) ?? null;
  }

  async listExternalConfirmationGates(): Promise<readonly ExternalConfirmationGateDocument[]> {
    return [...this.gates.values()].sort((left, right) =>
      left.toSnapshot().gateId.localeCompare(right.toSnapshot().gateId),
    );
  }

  async listExternalConfirmationGatesForDomainObject(
    domain: string,
    domainObjectRef: string,
  ): Promise<readonly ExternalConfirmationGateDocument[]> {
    return (await this.listExternalConfirmationGates()).filter((entry) => {
      const snapshot = entry.toSnapshot();
      return snapshot.domain === domain && snapshot.domainObjectRef === domainObjectRef;
    });
  }

  async saveExternalConfirmationGate(
    gate: ExternalConfirmationGateDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.gates, gate.gateId, gate as never, options);
  }
}

export function createReservationConfirmationStore(): ReservationConfirmationDependencies {
  return new InMemoryReservationConfirmationStore();
}

export interface RecordCapacityReservationInput {
  reservationId?: string;
  capacityIdentityRef: string;
  canonicalReservationKey: string;
  sourceDomain: string;
  holderRef: string;
  state: CapacityReservationState;
  commitMode: CapacityCommitMode;
  reservationVersion?: number;
  activeFencingToken?: string;
  truthBasisHash?: string;
  supplierObservedAt: string;
  revalidatedAt?: string | null;
  expiresAt?: string | null;
  confirmedAt?: string | null;
  releasedAt?: string | null;
  supersededByReservationRef?: string | null;
  terminalReasonCode?: string | null;
}

export interface RefreshReservationTruthProjectionInput {
  reservationId: string;
  reservationTruthProjectionId?: string;
  sourceObjectRef: string;
  selectedAnchorRef: string;
  projectionFreshnessEnvelopeRef: string;
  generatedAt: string;
  projectionRevision?: number;
  capacityIdentitySupportsExclusivity?: boolean;
  freshnessState?: ProjectionFreshnessState;
  currentTruthBasisHash?: string | null;
}

export interface RefreshExternalConfirmationGateInput {
  gateId?: string;
  episodeId: string;
  domain: string;
  domainObjectRef: string;
  transportMode: string;
  assuranceLevel: ConfirmationAssuranceLevel;
  evidenceModelVersionRef: string;
  requiredHardMatchRefs: readonly string[];
  evidenceAtoms: readonly ConfirmationEvidenceAtom[];
  confirmationDeadlineAt: string;
  priorProbability: number;
  createdAt: string;
  updatedAt: string;
  gateRevision?: number;
  thresholdPolicy: ExternalConfirmationThresholdPolicy;
  competingGateConfidences?: readonly number[];
  manualOverrideRequested?: boolean;
}

export class ReservationConfirmationAuthorityService {
  constructor(
    private readonly repositories: ReservationConfirmationDependencies,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async recordCapacityReservation(
    input: RecordCapacityReservationInput,
    options?: CompareAndSetWriteOptions,
  ): Promise<CapacityReservationDocument> {
    const reservationId =
      optionalRef(input.reservationId) ??
      nextReservationControlPlaneId(this.idGenerator, "capacityReservation");
    const existing = await this.repositories.getCapacityReservation(reservationId);
    const reservationVersion = input.reservationVersion ?? (existing?.version ?? 0) + 1;
    if (existing) {
      invariant(
        reservationVersion > existing.version,
        "RESERVATION_VERSION_MUST_ADVANCE",
        "Reservation updates must increase reservationVersion.",
      );
    }

    const truthBasisHash =
      optionalRef(input.truthBasisHash) ??
      buildCapacityReservationTruthBasisHash({
        capacityIdentityRef: input.capacityIdentityRef,
        canonicalReservationKey: input.canonicalReservationKey,
        sourceDomain: input.sourceDomain,
        holderRef: input.holderRef,
        state: input.state,
        commitMode: input.commitMode,
        reservationVersion,
        supplierObservedAt: input.supplierObservedAt,
        revalidatedAt: input.revalidatedAt,
        expiresAt: input.expiresAt,
        confirmedAt: input.confirmedAt,
        releasedAt: input.releasedAt,
        terminalReasonCode: input.terminalReasonCode,
      });
    const activeFencingToken =
      optionalRef(input.activeFencingToken) ??
      buildCapacityReservationFencingToken({
        canonicalReservationKey: input.canonicalReservationKey,
        reservationVersion,
        holderRef: input.holderRef,
        sourceDomain: input.sourceDomain,
      });

    const reservation = CapacityReservationDocument.create({
      reservationId,
      capacityIdentityRef: input.capacityIdentityRef,
      canonicalReservationKey: input.canonicalReservationKey,
      sourceDomain: input.sourceDomain,
      holderRef: input.holderRef,
      state: input.state,
      commitMode: input.commitMode,
      reservationVersion,
      activeFencingToken,
      truthBasisHash,
      supplierObservedAt: input.supplierObservedAt,
      revalidatedAt: input.revalidatedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      confirmedAt: input.confirmedAt ?? null,
      releasedAt: input.releasedAt ?? null,
      supersededByReservationRef: input.supersededByReservationRef ?? null,
      terminalReasonCode: input.terminalReasonCode ?? null,
    });

    await this.repositories.saveCapacityReservation(
      reservation,
      options ?? { expectedVersion: existing?.version },
    );
    validateCapacityReservationLedger(
      (await this.repositories.listCapacityReservations()).map((entry) => entry.toSnapshot()),
    );
    return reservation;
  }

  async refreshReservationTruthProjection(
    input: RefreshReservationTruthProjectionInput,
    options?: CompareAndSetWriteOptions,
  ): Promise<ReservationTruthProjectionDocument> {
    const reservation = await this.repositories.getCapacityReservation(input.reservationId);
    invariant(
      reservation !== null,
      "CAPACITY_RESERVATION_NOT_FOUND",
      `CapacityReservation ${input.reservationId} is required before truth projection can be computed.`,
    );

    const existing =
      (input.reservationTruthProjectionId
        ? await this.repositories.getReservationTruthProjection(input.reservationTruthProjectionId)
        : null) ??
      (await this.repositories.getLatestReservationTruthProjectionForReservation(
        input.reservationId,
      ));
    const reservationTruthProjectionId =
      optionalRef(input.reservationTruthProjectionId) ??
      existing?.reservationTruthProjectionId ??
      nextReservationControlPlaneId(this.idGenerator, "reservationTruthProjection");
    const projectionRevision = input.projectionRevision ?? (existing?.version ?? 0) + 1;

    const projection = buildReservationTruthProjection({
      reservationTruthProjectionId,
      reservation: reservation.toSnapshot(),
      sourceObjectRef: input.sourceObjectRef,
      selectedAnchorRef: input.selectedAnchorRef,
      projectionFreshnessEnvelopeRef: input.projectionFreshnessEnvelopeRef,
      generatedAt: input.generatedAt,
      projectionRevision,
      capacityIdentitySupportsExclusivity: input.capacityIdentitySupportsExclusivity,
      freshnessState: input.freshnessState,
      currentTruthBasisHash: input.currentTruthBasisHash,
    });

    await this.repositories.saveReservationTruthProjection(
      projection,
      options ?? { expectedVersion: existing?.version },
    );
    return projection;
  }

  async refreshExternalConfirmationGate(
    input: RefreshExternalConfirmationGateInput,
    options?: CompareAndSetWriteOptions,
  ): Promise<ExternalConfirmationGateDocument> {
    const existing = input.gateId
      ? await this.repositories.getExternalConfirmationGate(input.gateId)
      : null;
    const gateId =
      optionalRef(input.gateId) ??
      existing?.gateId ??
      nextReservationControlPlaneId(this.idGenerator, "externalConfirmationGate");
    const gateRevision = input.gateRevision ?? (existing?.version ?? 0) + 1;
    const otherOpenGates = await this.repositories.listExternalConfirmationGatesForDomainObject(
      input.domain,
      input.domainObjectRef,
    );
    const competingGateConfidences =
      input.competingGateConfidences ??
      otherOpenGates
        .filter((gate) => gate.gateId !== gateId && gate.toSnapshot().state !== "cancelled")
        .map((gate) => gate.toSnapshot().confirmationConfidence);

    const gate = buildExternalConfirmationGate({
      ...input,
      gateId,
      gateRevision,
      competingGateConfidences,
    });
    await this.repositories.saveExternalConfirmationGate(
      gate,
      options ?? { expectedVersion: existing?.version },
    );
    return gate;
  }
}

export function createReservationConfirmationAuthorityService(
  repositories: ReservationConfirmationDependencies = createReservationConfirmationStore(),
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "reservation_confirmation_backbone",
  ),
): ReservationConfirmationAuthorityService {
  return new ReservationConfirmationAuthorityService(repositories, idGenerator);
}

export const reservationConfirmationParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_074_RESERVATION_AUTHORITY_PORT",
    stubInterface: "ReservationAuthorityPort",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "par_074 publishes the reservation and gate substrate before the later reservation authority coordinator in par_081 claims live hold orchestration and supplier reconciliation sequencing.",
    sourceRefs: [
      "prompt/074.md",
      "prompt/shared_operating_contract_066_to_075.md",
      "blueprint/phase-0-the-foundation-protocol.md#1.14 CapacityReservation",
    ],
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_074_BOOKING_CONFIRMATION_TRUTH_PORT",
    stubInterface: "BookingConfirmationTruthProjectionPort",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "Booking, hub, and pharmacy flows consume reservation truth and external confirmation gates now, but the later confirmation coordinator that binds those facts into booking-outcome projections lives in downstream tracks.",
    sourceRefs: [
      "prompt/074.md",
      "blueprint/phase-4-the-booking-engine.md#BookingConfirmationTruthProjection",
      "blueprint/phase-6-the-pharmacy-loop.md",
    ],
  },
] as const;

export interface ReservationConfirmationScenarioResult {
  scenarioId: string;
  title: string;
  reservation: CapacityReservationDocument;
  projection: ReservationTruthProjectionDocument;
  gate: ExternalConfirmationGateDocument | null;
}

class ReservationConfirmationSimulationHarness {
  constructor(
    private readonly authority: ReservationConfirmationAuthorityService,
    private readonly repositories: ReservationConfirmationDependencies,
  ) {}

  async runAllScenarios(): Promise<readonly ReservationConfirmationScenarioResult[]> {
    return [
      await this.runSoftSelectionNonexclusiveScenario(),
      await this.runExclusiveHoldScenario(),
      await this.runTruthfulNonexclusiveScenario(),
      await this.runImmediateAuthoritativeConfirmationScenario(),
      await this.runPendingExternalConfirmationScenario(),
      await this.runContradictoryEvidenceScenario(),
      await this.runWeakManualCorroboratedScenario(),
      await this.runExpiredReservationScenario(),
    ];
  }

  private async buildReservationScenario(input: {
    scenarioId: string;
    title: string;
    reservation: RecordCapacityReservationInput;
    projection: Omit<RefreshReservationTruthProjectionInput, "reservationId">;
    gate?: RefreshExternalConfirmationGateInput;
  }): Promise<ReservationConfirmationScenarioResult> {
    const reservation = await this.authority.recordCapacityReservation(input.reservation);
    const projection = await this.authority.refreshReservationTruthProjection({
      reservationId: reservation.reservationId,
      ...input.projection,
    });
    const gate = input.gate
      ? await this.authority.refreshExternalConfirmationGate(input.gate)
      : null;
    validateReservationConfirmationBundle({
      reservation: reservation.toSnapshot(),
      projection: projection.toSnapshot(),
      gate: gate?.toSnapshot() ?? null,
      truthOptions: {
        capacityIdentitySupportsExclusivity:
          input.projection.capacityIdentitySupportsExclusivity ?? true,
        freshnessState: input.projection.freshnessState,
        currentTruthBasisHash: input.projection.currentTruthBasisHash,
      },
    });
    return {
      scenarioId: input.scenarioId,
      title: input.title,
      reservation,
      projection,
      gate,
    };
  }

  private async runSoftSelectionNonexclusiveScenario() {
    return this.buildReservationScenario({
      scenarioId: "soft_selection_without_hold",
      title: "Soft selection keeps focus but never claims exclusivity.",
      reservation: {
        reservationId: "reservation_074_soft_selection",
        capacityIdentityRef: "capacity_unit_074_triage_soft",
        canonicalReservationKey: "canonical_reservation_key_074_soft_selection",
        sourceDomain: "booking_local",
        holderRef: "offer_session_074_soft",
        state: "soft_selected",
        commitMode: "truthful_nonexclusive",
        supplierObservedAt: "2026-04-12T20:00:00Z",
        revalidatedAt: "2026-04-12T20:00:05Z",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_soft_selection",
        sourceObjectRef: "offer_session_074_soft",
        selectedAnchorRef: "slot_card_074_soft",
        projectionFreshnessEnvelopeRef: "freshness::074_soft_selection",
        generatedAt: "2026-04-12T20:00:06Z",
      },
    });
  }

  private async runExclusiveHoldScenario() {
    return this.buildReservationScenario({
      scenarioId: "exclusive_hold_with_real_expiry",
      title: "Real held reservations alone may show reserved-for-you countdown language.",
      reservation: {
        reservationId: "reservation_074_exclusive_hold",
        capacityIdentityRef: "capacity_unit_074_exclusive",
        canonicalReservationKey: "canonical_reservation_key_074_exclusive",
        sourceDomain: "booking_local",
        holderRef: "offer_session_074_exclusive",
        state: "held",
        commitMode: "exclusive_hold",
        supplierObservedAt: "2026-04-12T20:05:00Z",
        expiresAt: "2026-04-12T20:14:00Z",
        revalidatedAt: "2026-04-12T20:05:03Z",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_exclusive_hold",
        sourceObjectRef: "offer_session_074_exclusive",
        selectedAnchorRef: "slot_card_074_exclusive",
        projectionFreshnessEnvelopeRef: "freshness::074_exclusive_hold",
        generatedAt: "2026-04-12T20:05:05Z",
      },
    });
  }

  private async runTruthfulNonexclusiveScenario() {
    return this.buildReservationScenario({
      scenarioId: "truthful_nonexclusive_offer",
      title:
        "Truthful nonexclusive offers stay patient-actionable without inventing reserved status.",
      reservation: {
        reservationId: "reservation_074_truthful_nonexclusive",
        capacityIdentityRef: "capacity_unit_074_truthful",
        canonicalReservationKey: "canonical_reservation_key_074_truthful_nonexclusive",
        sourceDomain: "booking_waitlist",
        holderRef: "waitlist_offer_074_truthful",
        state: "soft_selected",
        commitMode: "truthful_nonexclusive",
        supplierObservedAt: "2026-04-12T20:10:00Z",
        revalidatedAt: "2026-04-12T20:10:04Z",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_truthful_nonexclusive",
        sourceObjectRef: "waitlist_offer_074_truthful",
        selectedAnchorRef: "waitlist_card_074_truthful",
        projectionFreshnessEnvelopeRef: "freshness::074_truthful_nonexclusive",
        generatedAt: "2026-04-12T20:10:05Z",
      },
    });
  }

  private async runImmediateAuthoritativeConfirmationScenario() {
    return this.buildReservationScenario({
      scenarioId: "immediate_authoritative_confirmation",
      title:
        "Immediate provider reference or read-after-write proof can confirm without weak/manual gate dependence.",
      reservation: {
        reservationId: "reservation_074_immediate_confirmation",
        capacityIdentityRef: "capacity_unit_074_immediate_confirmation",
        canonicalReservationKey: "canonical_reservation_key_074_immediate_confirmation",
        sourceDomain: "hub_booking",
        holderRef: "hub_commit_attempt_074_immediate",
        state: "confirmed",
        commitMode: "exclusive_hold",
        supplierObservedAt: "2026-04-12T20:15:00Z",
        confirmedAt: "2026-04-12T20:15:06Z",
        expiresAt: "2026-04-12T20:16:00Z",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_immediate_confirmation",
        sourceObjectRef: "hub_commit_attempt_074_immediate",
        selectedAnchorRef: "hub_card_074_immediate",
        projectionFreshnessEnvelopeRef: "freshness::074_immediate_confirmation",
        generatedAt: "2026-04-12T20:15:07Z",
      },
    });
  }

  private async runPendingExternalConfirmationScenario() {
    return this.buildReservationScenario({
      scenarioId: "pending_external_confirmation",
      title:
        "Async supplier acceptance stays explicit as pending confirmation until the gate clears.",
      reservation: {
        reservationId: "reservation_074_pending_confirmation",
        capacityIdentityRef: "capacity_unit_074_pending_confirmation",
        canonicalReservationKey: "canonical_reservation_key_074_pending_confirmation",
        sourceDomain: "hub_booking",
        holderRef: "hub_commit_attempt_074_pending",
        state: "pending_confirmation",
        commitMode: "exclusive_hold",
        supplierObservedAt: "2026-04-12T20:20:00Z",
        expiresAt: "2026-04-12T20:28:00Z",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_pending_confirmation",
        sourceObjectRef: "hub_commit_attempt_074_pending",
        selectedAnchorRef: "hub_card_074_pending",
        projectionFreshnessEnvelopeRef: "freshness::074_pending_confirmation",
        generatedAt: "2026-04-12T20:20:05Z",
      },
      gate: {
        gateId: "external_confirmation_gate_074_pending",
        episodeId: "episode_074_pending",
        domain: "hub_booking",
        domainObjectRef: "hub_commit_attempt_074_pending",
        transportMode: "partner_api_async",
        assuranceLevel: "moderate",
        evidenceModelVersionRef: "evidence_model_074_v1",
        requiredHardMatchRefs: ["provider_reference_match"],
        evidenceAtoms: [
          {
            evidenceRef: "ev_074_pending_ack",
            sourceFamily: "adapter_receipt",
            proofRef: "proof_074_pending_ack",
            logLikelihoodWeight: 0.35,
            polarity: "positive",
          },
        ],
        confirmationDeadlineAt: "2026-04-12T20:40:00Z",
        priorProbability: 0.42,
        createdAt: "2026-04-12T20:20:00Z",
        updatedAt: "2026-04-12T20:20:10Z",
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      },
    });
  }

  private async runContradictoryEvidenceScenario() {
    return this.buildReservationScenario({
      scenarioId: "contradictory_competing_confirmation",
      title:
        "Contradictory evidence and competing candidate confidence must surface as disputed truth.",
      reservation: {
        reservationId: "reservation_074_disputed",
        capacityIdentityRef: "capacity_unit_074_disputed",
        canonicalReservationKey: "canonical_reservation_key_074_disputed",
        sourceDomain: "pharmacy_dispatch",
        holderRef: "dispatch_attempt_074_disputed",
        state: "disputed",
        commitMode: "degraded_manual_pending",
        supplierObservedAt: "2026-04-12T20:25:00Z",
        terminalReasonCode: "CONTRADICTORY_CONFIRMATION_EVIDENCE",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_disputed",
        sourceObjectRef: "dispatch_attempt_074_disputed",
        selectedAnchorRef: "pharmacy_row_074_disputed",
        projectionFreshnessEnvelopeRef: "freshness::074_disputed",
        generatedAt: "2026-04-12T20:25:04Z",
      },
      gate: {
        gateId: "external_confirmation_gate_074_disputed",
        episodeId: "episode_074_disputed",
        domain: "pharmacy_dispatch",
        domainObjectRef: "dispatch_attempt_074_disputed",
        transportMode: "manual_partner_fax",
        assuranceLevel: "weak",
        evidenceModelVersionRef: "evidence_model_074_v1",
        requiredHardMatchRefs: ["package_hash_match", "recipient_route_match"],
        evidenceAtoms: [
          {
            evidenceRef: "ev_074_disputed_transport_ack",
            sourceFamily: "transport_receipt",
            proofRef: "proof_074_disputed_transport_ack",
            logLikelihoodWeight: 0.55,
            polarity: "positive",
            satisfiesHardMatchRefs: ["package_hash_match"],
          },
          {
            evidenceRef: "ev_074_disputed_conflicting_callback",
            sourceFamily: "callback_feed",
            proofRef: "proof_074_disputed_conflicting_callback",
            logLikelihoodWeight: 0.71,
            polarity: "negative",
            failsHardMatchRefs: ["recipient_route_match"],
            contradictory: true,
          },
        ],
        confirmationDeadlineAt: "2026-04-12T20:45:00Z",
        priorProbability: 0.5,
        createdAt: "2026-04-12T20:25:00Z",
        updatedAt: "2026-04-12T20:25:20Z",
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
        competingGateConfidences: [0.74],
      },
    });
  }

  private async runWeakManualCorroboratedScenario() {
    return this.buildReservationScenario({
      scenarioId: "weak_manual_two_family_confirmation",
      title:
        "Weak or manual paths confirm only after two independent source families satisfy the gate.",
      reservation: {
        reservationId: "reservation_074_manual_confirmed",
        capacityIdentityRef: "capacity_unit_074_manual_confirmed",
        canonicalReservationKey: "canonical_reservation_key_074_manual_confirmed",
        sourceDomain: "pharmacy_dispatch",
        holderRef: "dispatch_attempt_074_manual_confirmed",
        state: "confirmed",
        commitMode: "degraded_manual_pending",
        supplierObservedAt: "2026-04-12T20:30:00Z",
        confirmedAt: "2026-04-12T20:32:00Z",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_manual_confirmed",
        sourceObjectRef: "dispatch_attempt_074_manual_confirmed",
        selectedAnchorRef: "pharmacy_row_074_manual_confirmed",
        projectionFreshnessEnvelopeRef: "freshness::074_manual_confirmed",
        generatedAt: "2026-04-12T20:32:02Z",
      },
      gate: {
        gateId: "external_confirmation_gate_074_manual_confirmed",
        episodeId: "episode_074_manual_confirmed",
        domain: "pharmacy_dispatch",
        domainObjectRef: "dispatch_attempt_074_manual_confirmed",
        transportMode: "manual_partner_phone",
        assuranceLevel: "manual",
        evidenceModelVersionRef: "evidence_model_074_v1",
        requiredHardMatchRefs: ["package_hash_match", "patient_identity_match"],
        evidenceAtoms: [
          {
            evidenceRef: "ev_074_manual_phone_witness",
            sourceFamily: "phone_witness",
            proofRef: "proof_074_manual_phone_witness",
            logLikelihoodWeight: 1.15,
            polarity: "positive",
            satisfiesHardMatchRefs: ["patient_identity_match"],
          },
          {
            evidenceRef: "ev_074_manual_document_scan",
            sourceFamily: "document_scan",
            proofRef: "proof_074_manual_document_scan",
            logLikelihoodWeight: 0.95,
            polarity: "positive",
            satisfiesHardMatchRefs: ["package_hash_match"],
          },
        ],
        confirmationDeadlineAt: "2026-04-12T20:50:00Z",
        priorProbability: 0.48,
        createdAt: "2026-04-12T20:30:00Z",
        updatedAt: "2026-04-12T20:32:00Z",
        thresholdPolicy: defaultReservationConfirmationThresholdPolicy,
      },
    });
  }

  private async runExpiredReservationScenario() {
    return this.buildReservationScenario({
      scenarioId: "expired_hold_without_confirmation",
      title: "Expired claims degrade immediately and suppress stale exclusivity in place.",
      reservation: {
        reservationId: "reservation_074_expired",
        capacityIdentityRef: "capacity_unit_074_expired",
        canonicalReservationKey: "canonical_reservation_key_074_expired",
        sourceDomain: "booking_local",
        holderRef: "offer_session_074_expired",
        state: "expired",
        commitMode: "exclusive_hold",
        supplierObservedAt: "2026-04-12T20:35:00Z",
        expiresAt: "2026-04-12T20:36:00Z",
        terminalReasonCode: "HOLD_EXPIRED",
      },
      projection: {
        reservationTruthProjectionId: "reservation_truth_projection_074_expired",
        sourceObjectRef: "offer_session_074_expired",
        selectedAnchorRef: "slot_card_074_expired",
        projectionFreshnessEnvelopeRef: "freshness::074_expired",
        generatedAt: "2026-04-12T20:36:05Z",
      },
    });
  }
}

export function createReservationConfirmationSimulationHarness(options?: {
  repositories?: ReservationConfirmationDependencies;
  idGenerator?: BackboneIdGenerator;
}) {
  const repositories = options?.repositories ?? createReservationConfirmationStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("reservation_confirmation_simulation");
  const authority = createReservationConfirmationAuthorityService(repositories, idGenerator);
  return new ReservationConfirmationSimulationHarness(authority, repositories);
}
