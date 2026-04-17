import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestAggregate,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  type EpisodeRepository,
  EpisodeAggregate,
  InMemorySubmissionLineageFoundationStore,
} from "./submission-lineage-backbone";

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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
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

function addSeconds(isoTimestamp: string, seconds: number): string {
  return new Date(Date.parse(isoTimestamp) + seconds * 1000).toISOString();
}

function authorityKey(domain: string, domainObjectRef: string): string {
  return `${requireRef(domain, "domain")}::${requireRef(domainObjectRef, "domainObjectRef")}`;
}

function leaseExpiryAt(snapshot: RequestLifecycleLeaseSnapshot): string {
  return addSeconds(snapshot.heartbeatAt, snapshot.leaseTtlSeconds);
}

function computeBreakEligibleAt(
  snapshot: RequestLifecycleLeaseSnapshot,
  breakGuardSeconds: number,
): string {
  return addSeconds(leaseExpiryAt(snapshot), breakGuardSeconds);
}

function mintFencingToken(authorityRef: string, ownershipEpoch: number, leaseId: string): string {
  return sha256Hex(`${authorityRef}::${ownershipEpoch}::${leaseId}`);
}

function nextControlPlaneId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function buildLeaseScopeHash(input: {
  domain: string;
  domainObjectRef: string;
  leaseAuthorityRef: string;
  scopeComponents: readonly string[];
}): string {
  return sha256Hex(
    stableStringify({
      domain: requireRef(input.domain, "domain"),
      domainObjectRef: requireRef(input.domainObjectRef, "domainObjectRef"),
      leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
      scopeComponents: uniqueSortedRefs(input.scopeComponents),
    }),
  );
}

export function buildRouteIntentTupleHash(input: {
  actionScope: string;
  governingObjectRef: string;
  canonicalObjectDescriptorRef: string;
  routeIntentRef: string;
  routeContractDigestRef: string;
  parentAnchorRef: string;
  governingObjectVersionRef: string;
  lineageScope: string;
  requiredContextBoundaryRefs: readonly string[];
  actingContextRef: string;
  initiatingBoundedContextRef: string;
  governingBoundedContextRef: string;
}): string {
  return sha256Hex(
    stableStringify({
      actionScope: requireRef(input.actionScope, "actionScope"),
      actingContextRef: requireRef(input.actingContextRef, "actingContextRef"),
      canonicalObjectDescriptorRef: requireRef(
        input.canonicalObjectDescriptorRef,
        "canonicalObjectDescriptorRef",
      ),
      governingBoundedContextRef: requireRef(
        input.governingBoundedContextRef,
        "governingBoundedContextRef",
      ),
      governingObjectRef: requireRef(input.governingObjectRef, "governingObjectRef"),
      governingObjectVersionRef: requireRef(
        input.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      initiatingBoundedContextRef: requireRef(
        input.initiatingBoundedContextRef,
        "initiatingBoundedContextRef",
      ),
      lineageScope: requireRef(input.lineageScope, "lineageScope"),
      parentAnchorRef: requireRef(input.parentAnchorRef, "parentAnchorRef"),
      requiredContextBoundaryRefs: uniqueSortedRefs(input.requiredContextBoundaryRefs),
      routeContractDigestRef: requireRef(input.routeContractDigestRef, "routeContractDigestRef"),
      routeIntentRef: requireRef(input.routeIntentRef, "routeIntentRef"),
    }),
  );
}

export function buildExpectedEffectSetHash(expectedEffectSetRefs: readonly string[]): string {
  return sha256Hex(stableStringify(uniqueSortedRefs(expectedEffectSetRefs)));
}

export function buildSemanticPayloadHash(semanticPayload: unknown): string {
  return sha256Hex(stableStringify(semanticPayload));
}

export type RequestLifecycleLeaseState = "active" | "releasing" | "released" | "expired" | "broken";

export type StaleOwnershipRecoveryReason =
  | "heartbeat_missed"
  | "stale_write_rejected"
  | "superseded_reacquire"
  | "supervisor_takeover"
  | "lineage_drift";

export type StaleOwnershipRecoveryResolutionState =
  | "open"
  | "reacquire_in_progress"
  | "takeover_pending"
  | "resolved"
  | "superseded";

export type LeaseTakeoverState = "pending" | "committed" | "cancelled";

export type LineageFenceIssuedFor =
  | "close"
  | "reopen"
  | "identity_repair"
  | "ownership_change"
  | "urgent_preemption"
  | "cross_domain_commit";

export interface RequestLifecycleLeaseSnapshot {
  leaseId: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  domain: string;
  domainObjectRef: string;
  leaseAuthorityRef: string;
  ownerActorRef: string;
  ownerSessionRef: string | null;
  ownerWorkerRef: string | null;
  ownershipEpoch: number;
  leaseScopeHash: string;
  state: RequestLifecycleLeaseState;
  closeBlockReason: string | null;
  leaseTtlSeconds: number;
  heartbeatAt: string;
  fencingToken: string;
  staleOwnerRecoveryRef: string | null;
  supersededByLeaseRef: string | null;
  acquiredAt: string;
  releasedAt: string | null;
  breakEligibleAt: string | null;
  brokenByActorRef: string | null;
  breakReason: string | null;
  version: number;
}

export interface PersistedRequestLifecycleLeaseRow extends RequestLifecycleLeaseSnapshot {
  aggregateType: "RequestLifecycleLease";
  persistenceSchemaVersion: 1;
}

export class RequestLifecycleLeaseDocument {
  private readonly snapshot: RequestLifecycleLeaseSnapshot;

  private constructor(snapshot: RequestLifecycleLeaseSnapshot) {
    this.snapshot = RequestLifecycleLeaseDocument.normalize(snapshot);
  }

  static create(
    input: Omit<RequestLifecycleLeaseSnapshot, "version">,
  ): RequestLifecycleLeaseDocument {
    return new RequestLifecycleLeaseDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: RequestLifecycleLeaseSnapshot): RequestLifecycleLeaseDocument {
    return new RequestLifecycleLeaseDocument(snapshot);
  }

  private static normalize(snapshot: RequestLifecycleLeaseSnapshot): RequestLifecycleLeaseSnapshot {
    const state = snapshot.state;
    invariant(
      snapshot.ownerSessionRef !== null || snapshot.ownerWorkerRef !== null,
      "LEASE_OWNER_REFERENCE_REQUIRED",
      "RequestLifecycleLease requires ownerSessionRef or ownerWorkerRef.",
    );
    ensurePositiveInteger(snapshot.ownershipEpoch, "ownershipEpoch");
    ensurePositiveInteger(snapshot.leaseTtlSeconds, "leaseTtlSeconds");
    ensurePositiveInteger(snapshot.version, "version");
    const normalized = {
      ...snapshot,
      leaseId: requireRef(snapshot.leaseId, "leaseId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      domain: requireRef(snapshot.domain, "domain"),
      domainObjectRef: requireRef(snapshot.domainObjectRef, "domainObjectRef"),
      leaseAuthorityRef: requireRef(snapshot.leaseAuthorityRef, "leaseAuthorityRef"),
      ownerActorRef: requireRef(snapshot.ownerActorRef, "ownerActorRef"),
      ownerSessionRef: optionalRef(snapshot.ownerSessionRef),
      ownerWorkerRef: optionalRef(snapshot.ownerWorkerRef),
      leaseScopeHash: ensureHexHash(snapshot.leaseScopeHash, "leaseScopeHash"),
      closeBlockReason: optionalRef(snapshot.closeBlockReason),
      heartbeatAt: ensureIsoTimestamp(snapshot.heartbeatAt, "heartbeatAt"),
      fencingToken: ensureHexHash(snapshot.fencingToken, "fencingToken"),
      staleOwnerRecoveryRef: optionalRef(snapshot.staleOwnerRecoveryRef),
      supersededByLeaseRef: optionalRef(snapshot.supersededByLeaseRef),
      acquiredAt: ensureIsoTimestamp(snapshot.acquiredAt, "acquiredAt"),
      releasedAt: snapshot.releasedAt
        ? ensureIsoTimestamp(snapshot.releasedAt, "releasedAt")
        : null,
      breakEligibleAt: snapshot.breakEligibleAt
        ? ensureIsoTimestamp(snapshot.breakEligibleAt, "breakEligibleAt")
        : null,
      brokenByActorRef: optionalRef(snapshot.brokenByActorRef),
      breakReason: optionalRef(snapshot.breakReason),
    };

    invariant(
      Date.parse(normalized.heartbeatAt) >= Date.parse(normalized.acquiredAt),
      "LEASE_HEARTBEAT_BEFORE_ACQUIRE",
      "RequestLifecycleLease.heartbeatAt cannot precede acquiredAt.",
    );
    if (state === "active" || state === "releasing") {
      invariant(
        normalized.releasedAt === null && normalized.breakEligibleAt === null,
        "LEASE_ACTIVE_STATE_HAS_RELEASE_MARKERS",
        "Active or releasing leases cannot carry release or break markers.",
      );
    }
    if (state === "released") {
      invariant(
        normalized.releasedAt !== null,
        "LEASE_RELEASED_AT_REQUIRED",
        "Released leases must carry releasedAt.",
      );
    }
    if (state === "expired") {
      invariant(
        normalized.breakEligibleAt !== null && normalized.staleOwnerRecoveryRef !== null,
        "LEASE_EXPIRED_RECOVERY_REQUIRED",
        "Expired leases require breakEligibleAt and staleOwnerRecoveryRef.",
      );
    }
    if (state === "broken") {
      invariant(
        normalized.breakEligibleAt !== null &&
          normalized.staleOwnerRecoveryRef !== null &&
          normalized.brokenByActorRef !== null &&
          normalized.breakReason !== null,
        "LEASE_BROKEN_FIELDS_REQUIRED",
        "Broken leases require breakEligibleAt, staleOwnerRecoveryRef, brokenByActorRef, and breakReason.",
      );
    }
    if (normalized.supersededByLeaseRef) {
      invariant(
        state !== "active" && state !== "releasing",
        "ACTIVE_LEASE_CANNOT_BE_SUPERSEDED",
        "Active or releasing leases cannot already be superseded.",
      );
    }
    return normalized;
  }

  get leaseId(): string {
    return this.snapshot.leaseId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): RequestLifecycleLeaseSnapshot {
    return {
      ...this.snapshot,
    };
  }

  withHeartbeat(heartbeatAt: string): RequestLifecycleLeaseDocument {
    invariant(
      this.snapshot.state === "active" || this.snapshot.state === "releasing",
      "LEASE_NOT_HEARTBEATABLE",
      "Only active or releasing leases may heartbeat.",
    );
    return new RequestLifecycleLeaseDocument({
      ...this.snapshot,
      heartbeatAt: ensureIsoTimestamp(heartbeatAt, "heartbeatAt"),
      version: nextVersion(this.snapshot.version),
    });
  }

  withRelease(input: {
    releasedAt: string;
    closeBlockReason?: string | null;
  }): RequestLifecycleLeaseDocument {
    invariant(
      this.snapshot.state === "active" || this.snapshot.state === "releasing",
      "LEASE_NOT_RELEASABLE",
      "Only active or releasing leases may release.",
    );
    return new RequestLifecycleLeaseDocument({
      ...this.snapshot,
      state: "released",
      releasedAt: ensureIsoTimestamp(input.releasedAt, "releasedAt"),
      closeBlockReason: optionalRef(input.closeBlockReason ?? null),
      version: nextVersion(this.snapshot.version),
    });
  }

  withExpired(input: {
    staleOwnerRecoveryRef: string;
    breakEligibleAt: string;
  }): RequestLifecycleLeaseDocument {
    invariant(
      this.snapshot.state === "active" || this.snapshot.state === "releasing",
      "LEASE_NOT_EXPIRABLE",
      "Only active or releasing leases may expire.",
    );
    return new RequestLifecycleLeaseDocument({
      ...this.snapshot,
      state: "expired",
      staleOwnerRecoveryRef: requireRef(input.staleOwnerRecoveryRef, "staleOwnerRecoveryRef"),
      breakEligibleAt: ensureIsoTimestamp(input.breakEligibleAt, "breakEligibleAt"),
      version: nextVersion(this.snapshot.version),
    });
  }

  withBroken(input: {
    staleOwnerRecoveryRef: string;
    breakEligibleAt: string;
    brokenByActorRef: string;
    breakReason: string;
  }): RequestLifecycleLeaseDocument {
    invariant(
      this.snapshot.state === "expired" ||
        this.snapshot.state === "active" ||
        this.snapshot.state === "releasing",
      "LEASE_NOT_BREAKABLE",
      "Only expired, active, or releasing leases may be broken.",
    );
    return new RequestLifecycleLeaseDocument({
      ...this.snapshot,
      state: "broken",
      staleOwnerRecoveryRef: requireRef(input.staleOwnerRecoveryRef, "staleOwnerRecoveryRef"),
      breakEligibleAt: ensureIsoTimestamp(input.breakEligibleAt, "breakEligibleAt"),
      brokenByActorRef: requireRef(input.brokenByActorRef, "brokenByActorRef"),
      breakReason: requireRef(input.breakReason, "breakReason"),
      version: nextVersion(this.snapshot.version),
    });
  }

  withSupersededByLease(
    supersededByLeaseRef: string,
    options?: { preserveState?: RequestLifecycleLeaseState },
  ): RequestLifecycleLeaseDocument {
    const targetState =
      options?.preserveState ??
      (this.snapshot.state === "active" || this.snapshot.state === "releasing"
        ? "released"
        : this.snapshot.state);
    return new RequestLifecycleLeaseDocument({
      ...this.snapshot,
      state: targetState,
      supersededByLeaseRef: requireRef(supersededByLeaseRef, "supersededByLeaseRef"),
      releasedAt:
        targetState === "released" && this.snapshot.releasedAt === null
          ? this.snapshot.heartbeatAt
          : this.snapshot.releasedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface StaleOwnershipRecoveryRecordSnapshot {
  staleOwnershipRecoveryId: string;
  requestId: string;
  leaseRef: string;
  domain: string;
  domainObjectRef: string;
  lastOwnershipEpoch: number;
  lastFencingToken: string;
  detectedAt: string;
  detectedByRef: string;
  recoveryReason: StaleOwnershipRecoveryReason;
  blockedActionScopeRefs: readonly string[];
  operatorVisibleWorkRef: string;
  sameShellRecoveryRouteRef: string;
  resolutionState: StaleOwnershipRecoveryResolutionState;
  resolvedAt: string | null;
  version: number;
}

export interface PersistedStaleOwnershipRecoveryRecordRow
  extends StaleOwnershipRecoveryRecordSnapshot {
  aggregateType: "StaleOwnershipRecoveryRecord";
  persistenceSchemaVersion: 1;
}

export class StaleOwnershipRecoveryRecordDocument {
  private readonly snapshot: StaleOwnershipRecoveryRecordSnapshot;

  private constructor(snapshot: StaleOwnershipRecoveryRecordSnapshot) {
    this.snapshot = StaleOwnershipRecoveryRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<StaleOwnershipRecoveryRecordSnapshot, "version">,
  ): StaleOwnershipRecoveryRecordDocument {
    return new StaleOwnershipRecoveryRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: StaleOwnershipRecoveryRecordSnapshot,
  ): StaleOwnershipRecoveryRecordDocument {
    return new StaleOwnershipRecoveryRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: StaleOwnershipRecoveryRecordSnapshot,
  ): StaleOwnershipRecoveryRecordSnapshot {
    ensurePositiveInteger(snapshot.lastOwnershipEpoch, "lastOwnershipEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    const normalized = {
      ...snapshot,
      staleOwnershipRecoveryId: requireRef(
        snapshot.staleOwnershipRecoveryId,
        "staleOwnershipRecoveryId",
      ),
      requestId: requireRef(snapshot.requestId, "requestId"),
      leaseRef: requireRef(snapshot.leaseRef, "leaseRef"),
      domain: requireRef(snapshot.domain, "domain"),
      domainObjectRef: requireRef(snapshot.domainObjectRef, "domainObjectRef"),
      lastFencingToken: ensureHexHash(snapshot.lastFencingToken, "lastFencingToken"),
      detectedAt: ensureIsoTimestamp(snapshot.detectedAt, "detectedAt"),
      detectedByRef: requireRef(snapshot.detectedByRef, "detectedByRef"),
      blockedActionScopeRefs: uniqueSortedRefs(snapshot.blockedActionScopeRefs),
      operatorVisibleWorkRef: requireRef(snapshot.operatorVisibleWorkRef, "operatorVisibleWorkRef"),
      sameShellRecoveryRouteRef: requireRef(
        snapshot.sameShellRecoveryRouteRef,
        "sameShellRecoveryRouteRef",
      ),
      resolvedAt: snapshot.resolvedAt
        ? ensureIsoTimestamp(snapshot.resolvedAt, "resolvedAt")
        : null,
    };
    if (normalized.resolutionState === "resolved" || normalized.resolutionState === "superseded") {
      invariant(
        normalized.resolvedAt !== null,
        "RECOVERY_RESOLVED_AT_REQUIRED",
        "Resolved or superseded stale-owner recovery records require resolvedAt.",
      );
    }
    return normalized;
  }

  get staleOwnershipRecoveryId(): string {
    return this.snapshot.staleOwnershipRecoveryId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): StaleOwnershipRecoveryRecordSnapshot {
    return {
      ...this.snapshot,
    };
  }

  withResolution(
    resolutionState: StaleOwnershipRecoveryResolutionState,
    resolvedAt?: string | null,
  ): StaleOwnershipRecoveryRecordDocument {
    return new StaleOwnershipRecoveryRecordDocument({
      ...this.snapshot,
      resolutionState,
      resolvedAt:
        resolutionState === "resolved" || resolutionState === "superseded"
          ? ensureIsoTimestamp(resolvedAt ?? this.snapshot.detectedAt, "resolvedAt")
          : null,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface LeaseTakeoverRecordSnapshot {
  leaseTakeoverRecordId: string;
  priorLeaseRef: string;
  replacementLeaseRef: string | null;
  fromOwnerRef: string;
  toOwnerRef: string;
  authorizedByRef: string;
  takeoverReason: string;
  takeoverState: LeaseTakeoverState;
  issuedAt: string;
  committedAt: string | null;
  cancelledAt: string | null;
  version: number;
}

export interface PersistedLeaseTakeoverRecordRow extends LeaseTakeoverRecordSnapshot {
  aggregateType: "LeaseTakeoverRecord";
  persistenceSchemaVersion: 1;
}

export class LeaseTakeoverRecordDocument {
  private readonly snapshot: LeaseTakeoverRecordSnapshot;

  private constructor(snapshot: LeaseTakeoverRecordSnapshot) {
    this.snapshot = LeaseTakeoverRecordDocument.normalize(snapshot);
  }

  static create(input: Omit<LeaseTakeoverRecordSnapshot, "version">): LeaseTakeoverRecordDocument {
    return new LeaseTakeoverRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: LeaseTakeoverRecordSnapshot): LeaseTakeoverRecordDocument {
    return new LeaseTakeoverRecordDocument(snapshot);
  }

  private static normalize(snapshot: LeaseTakeoverRecordSnapshot): LeaseTakeoverRecordSnapshot {
    ensurePositiveInteger(snapshot.version, "version");
    const normalized = {
      ...snapshot,
      leaseTakeoverRecordId: requireRef(snapshot.leaseTakeoverRecordId, "leaseTakeoverRecordId"),
      priorLeaseRef: requireRef(snapshot.priorLeaseRef, "priorLeaseRef"),
      replacementLeaseRef: optionalRef(snapshot.replacementLeaseRef),
      fromOwnerRef: requireRef(snapshot.fromOwnerRef, "fromOwnerRef"),
      toOwnerRef: requireRef(snapshot.toOwnerRef, "toOwnerRef"),
      authorizedByRef: requireRef(snapshot.authorizedByRef, "authorizedByRef"),
      takeoverReason: requireRef(snapshot.takeoverReason, "takeoverReason"),
      issuedAt: ensureIsoTimestamp(snapshot.issuedAt, "issuedAt"),
      committedAt: snapshot.committedAt
        ? ensureIsoTimestamp(snapshot.committedAt, "committedAt")
        : null,
      cancelledAt: snapshot.cancelledAt
        ? ensureIsoTimestamp(snapshot.cancelledAt, "cancelledAt")
        : null,
    };
    if (normalized.takeoverState === "committed") {
      invariant(
        normalized.replacementLeaseRef !== null && normalized.committedAt !== null,
        "TAKEOVER_COMMIT_FIELDS_REQUIRED",
        "Committed takeover records require replacementLeaseRef and committedAt.",
      );
    }
    if (normalized.takeoverState === "cancelled") {
      invariant(
        normalized.cancelledAt !== null,
        "TAKEOVER_CANCELLED_AT_REQUIRED",
        "Cancelled takeover records require cancelledAt.",
      );
    }
    return normalized;
  }

  get leaseTakeoverRecordId(): string {
    return this.snapshot.leaseTakeoverRecordId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): LeaseTakeoverRecordSnapshot {
    return {
      ...this.snapshot,
    };
  }

  withCommitted(replacementLeaseRef: string, committedAt: string): LeaseTakeoverRecordDocument {
    return new LeaseTakeoverRecordDocument({
      ...this.snapshot,
      replacementLeaseRef: requireRef(replacementLeaseRef, "replacementLeaseRef"),
      takeoverState: "committed",
      committedAt: ensureIsoTimestamp(committedAt, "committedAt"),
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface LineageFenceSnapshot {
  fenceId: string;
  episodeId: string;
  currentEpoch: number;
  issuedFor: LineageFenceIssuedFor;
  issuedAt: string;
  expiresAt: string;
  version: number;
}

export interface PersistedLineageFenceRow extends LineageFenceSnapshot {
  aggregateType: "LineageFence";
  persistenceSchemaVersion: 1;
}

export class LineageFenceDocument {
  private readonly snapshot: LineageFenceSnapshot;

  private constructor(snapshot: LineageFenceSnapshot) {
    this.snapshot = LineageFenceDocument.normalize(snapshot);
  }

  static create(input: Omit<LineageFenceSnapshot, "version">): LineageFenceDocument {
    return new LineageFenceDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: LineageFenceSnapshot): LineageFenceDocument {
    return new LineageFenceDocument(snapshot);
  }

  private static normalize(snapshot: LineageFenceSnapshot): LineageFenceSnapshot {
    ensurePositiveInteger(snapshot.currentEpoch, "currentEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    const normalized = {
      ...snapshot,
      fenceId: requireRef(snapshot.fenceId, "fenceId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      issuedAt: ensureIsoTimestamp(snapshot.issuedAt, "issuedAt"),
      expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
    };
    invariant(
      Date.parse(normalized.expiresAt) > Date.parse(normalized.issuedAt),
      "LINEAGE_FENCE_EXPIRY_ORDER_INVALID",
      "LineageFence.expiresAt must be after issuedAt.",
    );
    return normalized;
  }

  get fenceId(): string {
    return this.snapshot.fenceId;
  }

  get currentEpoch(): number {
    return this.snapshot.currentEpoch;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): LineageFenceSnapshot {
    return {
      ...this.snapshot,
    };
  }
}

export interface CommandActionRecordSnapshot {
  actionRecordId: string;
  actionScope: string;
  governingObjectRef: string;
  canonicalObjectDescriptorRef: string;
  initiatingBoundedContextRef: string;
  governingBoundedContextRef: string;
  governingObjectVersionRef: string;
  lineageScope: string;
  routeIntentRef: string;
  routeContractDigestRef: string;
  requiredContextBoundaryRefs: readonly string[];
  parentAnchorRef: string;
  routeIntentTupleHash: string;
  edgeCorrelationId: string;
  initiatingUiEventRef: string;
  initiatingUiEventCausalityFrameRef: string;
  actingContextRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: number;
  sourceCommandId: string;
  transportCorrelationId: string;
  semanticPayloadHash: string;
  idempotencyKey: string;
  idempotencyRecordRef: string;
  commandFollowingTokenRef: string;
  expectedEffectSetHash: string;
  causalToken: string;
  createdAt: string;
  settledAt: string | null;
  supersedesActionRecordRef: string | null;
  version: number;
}

export interface PersistedCommandActionRecordRow extends CommandActionRecordSnapshot {
  aggregateType: "CommandActionRecord";
  persistenceSchemaVersion: 1;
}

export class CommandActionRecordDocument {
  private readonly snapshot: CommandActionRecordSnapshot;

  private constructor(snapshot: CommandActionRecordSnapshot) {
    this.snapshot = CommandActionRecordDocument.normalize(snapshot);
  }

  static create(input: Omit<CommandActionRecordSnapshot, "version">): CommandActionRecordDocument {
    return new CommandActionRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: CommandActionRecordSnapshot): CommandActionRecordDocument {
    return new CommandActionRecordDocument(snapshot);
  }

  private static normalize(snapshot: CommandActionRecordSnapshot): CommandActionRecordSnapshot {
    ensurePositiveInteger(snapshot.version, "version");
    ensurePositiveInteger(snapshot.lineageFenceEpoch, "lineageFenceEpoch");
    const normalized = {
      ...snapshot,
      actionRecordId: requireRef(snapshot.actionRecordId, "actionRecordId"),
      actionScope: requireRef(snapshot.actionScope, "actionScope"),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      canonicalObjectDescriptorRef: requireRef(
        snapshot.canonicalObjectDescriptorRef,
        "canonicalObjectDescriptorRef",
      ),
      initiatingBoundedContextRef: requireRef(
        snapshot.initiatingBoundedContextRef,
        "initiatingBoundedContextRef",
      ),
      governingBoundedContextRef: requireRef(
        snapshot.governingBoundedContextRef,
        "governingBoundedContextRef",
      ),
      governingObjectVersionRef: requireRef(
        snapshot.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      lineageScope: requireRef(snapshot.lineageScope, "lineageScope"),
      routeIntentRef: requireRef(snapshot.routeIntentRef, "routeIntentRef"),
      routeContractDigestRef: requireRef(snapshot.routeContractDigestRef, "routeContractDigestRef"),
      requiredContextBoundaryRefs: uniqueSortedRefs(snapshot.requiredContextBoundaryRefs),
      parentAnchorRef: requireRef(snapshot.parentAnchorRef, "parentAnchorRef"),
      routeIntentTupleHash: ensureHexHash(snapshot.routeIntentTupleHash, "routeIntentTupleHash"),
      edgeCorrelationId: requireRef(snapshot.edgeCorrelationId, "edgeCorrelationId"),
      initiatingUiEventRef: requireRef(snapshot.initiatingUiEventRef, "initiatingUiEventRef"),
      initiatingUiEventCausalityFrameRef: requireRef(
        snapshot.initiatingUiEventCausalityFrameRef,
        "initiatingUiEventCausalityFrameRef",
      ),
      actingContextRef: requireRef(snapshot.actingContextRef, "actingContextRef"),
      policyBundleRef: requireRef(snapshot.policyBundleRef, "policyBundleRef"),
      sourceCommandId: requireRef(snapshot.sourceCommandId, "sourceCommandId"),
      transportCorrelationId: requireRef(snapshot.transportCorrelationId, "transportCorrelationId"),
      semanticPayloadHash: ensureHexHash(snapshot.semanticPayloadHash, "semanticPayloadHash"),
      idempotencyKey: requireRef(snapshot.idempotencyKey, "idempotencyKey"),
      idempotencyRecordRef: requireRef(snapshot.idempotencyRecordRef, "idempotencyRecordRef"),
      commandFollowingTokenRef: requireRef(
        snapshot.commandFollowingTokenRef,
        "commandFollowingTokenRef",
      ),
      expectedEffectSetHash: ensureHexHash(snapshot.expectedEffectSetHash, "expectedEffectSetHash"),
      causalToken: requireRef(snapshot.causalToken, "causalToken"),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      settledAt: snapshot.settledAt ? ensureIsoTimestamp(snapshot.settledAt, "settledAt") : null,
      supersedesActionRecordRef: optionalRef(snapshot.supersedesActionRecordRef),
    };
    if (
      normalized.initiatingBoundedContextRef !== normalized.governingBoundedContextRef &&
      normalized.requiredContextBoundaryRefs.length === 0
    ) {
      throw new RequestBackboneInvariantError(
        "ACTION_CONTEXT_BOUNDARY_REQUIRED",
        "Cross-context command actions require requiredContextBoundaryRefs.",
      );
    }
    return normalized;
  }

  get actionRecordId(): string {
    return this.snapshot.actionRecordId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): CommandActionRecordSnapshot {
    return {
      ...this.snapshot,
    };
  }
}

interface LeaseAuthorityStateSnapshot {
  authorityKey: string;
  episodeId: string;
  requestId: string;
  requestLineageRef: string;
  domain: string;
  domainObjectRef: string;
  governingObjectVersionRef: string;
  currentLeaseRef: string | null;
  currentOwnershipEpoch: number;
  currentFencingToken: string | null;
  currentLineageEpoch: number;
  updatedAt: string;
  version: number;
}

interface LeaseAuthorityLookup {
  state: LeaseAuthorityStateSnapshot;
  existed: boolean;
}

interface PersistedLeaseAuthorityStateRow extends LeaseAuthorityStateSnapshot {
  aggregateType: "LeaseAuthorityState";
  persistenceSchemaVersion: 1;
}

function normalizeLeaseAuthorityState(
  snapshot: LeaseAuthorityStateSnapshot,
): LeaseAuthorityStateSnapshot {
  ensureNonNegativeInteger(snapshot.currentOwnershipEpoch, "currentOwnershipEpoch");
  ensureNonNegativeInteger(snapshot.currentLineageEpoch, "currentLineageEpoch");
  ensurePositiveInteger(snapshot.version, "version");
  return {
    ...snapshot,
    authorityKey: requireRef(snapshot.authorityKey, "authorityKey"),
    episodeId: requireRef(snapshot.episodeId, "episodeId"),
    requestId: requireRef(snapshot.requestId, "requestId"),
    requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
    domain: requireRef(snapshot.domain, "domain"),
    domainObjectRef: requireRef(snapshot.domainObjectRef, "domainObjectRef"),
    governingObjectVersionRef: requireRef(
      snapshot.governingObjectVersionRef,
      "governingObjectVersionRef",
    ),
    currentLeaseRef: optionalRef(snapshot.currentLeaseRef),
    currentFencingToken: snapshot.currentFencingToken
      ? ensureHexHash(snapshot.currentFencingToken, "currentFencingToken")
      : null,
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
  };
}

function actionIdempotencyFingerprint(input: {
  governingObjectRef: string;
  routeIntentTupleHash: string;
  idempotencyKey: string;
  semanticPayloadHash: string;
}): string {
  return sha256Hex(
    stableStringify({
      governingObjectRef: input.governingObjectRef,
      idempotencyKey: input.idempotencyKey,
      routeIntentTupleHash: input.routeIntentTupleHash,
      semanticPayloadHash: input.semanticPayloadHash,
    }),
  );
}

function sourceCommandKey(input: {
  governingObjectRef: string;
  sourceCommandId: string;
  actionScope: string;
}): string {
  return `${requireRef(input.governingObjectRef, "governingObjectRef")}::${requireRef(input.sourceCommandId, "sourceCommandId")}::${requireRef(input.actionScope, "actionScope")}`;
}

export interface RequestLifecycleLeaseRepository {
  getRequestLifecycleLease(leaseId: string): Promise<RequestLifecycleLeaseDocument | undefined>;
  saveRequestLifecycleLease(
    lease: RequestLifecycleLeaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listRequestLifecycleLeases(): Promise<readonly RequestLifecycleLeaseDocument[]>;
}

export interface StaleOwnershipRecoveryRecordRepository {
  getStaleOwnershipRecoveryRecord(
    staleOwnershipRecoveryId: string,
  ): Promise<StaleOwnershipRecoveryRecordDocument | undefined>;
  saveStaleOwnershipRecoveryRecord(
    record: StaleOwnershipRecoveryRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findOpenStaleOwnershipRecoveryForLease(
    leaseRef: string,
  ): Promise<StaleOwnershipRecoveryRecordDocument | undefined>;
  listStaleOwnershipRecoveryRecords(): Promise<readonly StaleOwnershipRecoveryRecordDocument[]>;
}

export interface LeaseTakeoverRecordRepository {
  getLeaseTakeoverRecord(
    leaseTakeoverRecordId: string,
  ): Promise<LeaseTakeoverRecordDocument | undefined>;
  saveLeaseTakeoverRecord(
    record: LeaseTakeoverRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listLeaseTakeoverRecords(): Promise<readonly LeaseTakeoverRecordDocument[]>;
}

export interface LineageFenceRepository {
  getLineageFence(fenceId: string): Promise<LineageFenceDocument | undefined>;
  saveLineageFence(fence: LineageFenceDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  getCurrentLineageFenceForEpisode(episodeId: string): Promise<LineageFenceDocument | undefined>;
  listLineageFences(): Promise<readonly LineageFenceDocument[]>;
}

export interface CommandActionRecordRepository {
  getCommandActionRecord(actionRecordId: string): Promise<CommandActionRecordDocument | undefined>;
  saveCommandActionRecord(
    record: CommandActionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findCommandActionRecordByIdempotencyFingerprint(
    fingerprint: string,
  ): Promise<CommandActionRecordDocument | undefined>;
  findLatestCommandActionRecordForSourceCommand(
    sourceKey: string,
  ): Promise<CommandActionRecordDocument | undefined>;
  listCommandActionRecords(): Promise<readonly CommandActionRecordDocument[]>;
}

export interface LeaseAuthorityStateRepository {
  getLeaseAuthorityState(authorityRef: string): Promise<LeaseAuthorityStateSnapshot | undefined>;
  saveLeaseAuthorityState(
    state: LeaseAuthorityStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ControlPlaneBoundaryRepository {
  withControlPlaneBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

export interface LeaseFenceCommandDependencies
  extends EpisodeRepository,
    RequestLifecycleLeaseRepository,
    StaleOwnershipRecoveryRecordRepository,
    LeaseTakeoverRecordRepository,
    LineageFenceRepository,
    CommandActionRecordRepository,
    LeaseAuthorityStateRepository,
    ControlPlaneBoundaryRepository {
  getRequest(requestId: string): Promise<RequestAggregate | undefined>;
  saveRequest(request: RequestAggregate, options?: CompareAndSetWriteOptions): Promise<void>;
  listRequests(): Promise<readonly RequestAggregate[]>;
}

export class InMemoryLeaseFenceCommandStore
  extends InMemorySubmissionLineageFoundationStore
  implements LeaseFenceCommandDependencies
{
  private readonly leases = new Map<string, PersistedRequestLifecycleLeaseRow>();
  private readonly staleOwnershipRecoveries = new Map<
    string,
    PersistedStaleOwnershipRecoveryRecordRow
  >();
  private readonly leaseTakeovers = new Map<string, PersistedLeaseTakeoverRecordRow>();
  private readonly fences = new Map<string, PersistedLineageFenceRow>();
  private readonly actions = new Map<string, PersistedCommandActionRecordRow>();
  private readonly authorityStates = new Map<string, PersistedLeaseAuthorityStateRow>();
  private readonly openRecoveryByLeaseRef = new Map<string, string>();
  private readonly currentFenceByEpisode = new Map<string, string>();
  private readonly actionByIdempotencyFingerprint = new Map<string, string>();
  private readonly latestActionBySourceCommand = new Map<string, string>();
  private boundaryQueue: Promise<void> = Promise.resolve();

  async withControlPlaneBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.boundaryQueue;
    let release: () => void = () => undefined;
    this.boundaryQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  override async saveRequest(
    request: RequestAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    return super.saveRequest(request, options);
  }

  override async listRequests(): Promise<readonly RequestAggregate[]> {
    return super.listRequests();
  }

  async getRequestLifecycleLease(
    leaseId: string,
  ): Promise<RequestLifecycleLeaseDocument | undefined> {
    const row = this.leases.get(leaseId);
    return row ? RequestLifecycleLeaseDocument.hydrate(row) : undefined;
  }

  async saveRequestLifecycleLease(
    lease: RequestLifecycleLeaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = lease.toSnapshot();
    saveWithCas(
      this.leases,
      row.leaseId,
      {
        ...row,
        aggregateType: "RequestLifecycleLease",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listRequestLifecycleLeases(): Promise<readonly RequestLifecycleLeaseDocument[]> {
    return [...this.leases.values()]
      .sort((left, right) => compareIso(left.acquiredAt, right.acquiredAt))
      .map((row) => RequestLifecycleLeaseDocument.hydrate(row));
  }

  async getStaleOwnershipRecoveryRecord(
    staleOwnershipRecoveryId: string,
  ): Promise<StaleOwnershipRecoveryRecordDocument | undefined> {
    const row = this.staleOwnershipRecoveries.get(staleOwnershipRecoveryId);
    return row ? StaleOwnershipRecoveryRecordDocument.hydrate(row) : undefined;
  }

  async saveStaleOwnershipRecoveryRecord(
    record: StaleOwnershipRecoveryRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = record.toSnapshot();
    saveWithCas(
      this.staleOwnershipRecoveries,
      row.staleOwnershipRecoveryId,
      {
        ...row,
        aggregateType: "StaleOwnershipRecoveryRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    if (
      row.resolutionState === "open" ||
      row.resolutionState === "reacquire_in_progress" ||
      row.resolutionState === "takeover_pending"
    ) {
      this.openRecoveryByLeaseRef.set(row.leaseRef, row.staleOwnershipRecoveryId);
    } else if (this.openRecoveryByLeaseRef.get(row.leaseRef) === row.staleOwnershipRecoveryId) {
      this.openRecoveryByLeaseRef.delete(row.leaseRef);
    }
  }

  async findOpenStaleOwnershipRecoveryForLease(
    leaseRef: string,
  ): Promise<StaleOwnershipRecoveryRecordDocument | undefined> {
    const recoveryId = this.openRecoveryByLeaseRef.get(leaseRef);
    if (!recoveryId) {
      return undefined;
    }
    const row = this.staleOwnershipRecoveries.get(recoveryId);
    return row ? StaleOwnershipRecoveryRecordDocument.hydrate(row) : undefined;
  }

  async listStaleOwnershipRecoveryRecords(): Promise<
    readonly StaleOwnershipRecoveryRecordDocument[]
  > {
    return [...this.staleOwnershipRecoveries.values()]
      .sort((left, right) => compareIso(left.detectedAt, right.detectedAt))
      .map((row) => StaleOwnershipRecoveryRecordDocument.hydrate(row));
  }

  async getLeaseTakeoverRecord(
    leaseTakeoverRecordId: string,
  ): Promise<LeaseTakeoverRecordDocument | undefined> {
    const row = this.leaseTakeovers.get(leaseTakeoverRecordId);
    return row ? LeaseTakeoverRecordDocument.hydrate(row) : undefined;
  }

  async saveLeaseTakeoverRecord(
    record: LeaseTakeoverRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = record.toSnapshot();
    saveWithCas(
      this.leaseTakeovers,
      row.leaseTakeoverRecordId,
      {
        ...row,
        aggregateType: "LeaseTakeoverRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listLeaseTakeoverRecords(): Promise<readonly LeaseTakeoverRecordDocument[]> {
    return [...this.leaseTakeovers.values()]
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt))
      .map((row) => LeaseTakeoverRecordDocument.hydrate(row));
  }

  async getLineageFence(fenceId: string): Promise<LineageFenceDocument | undefined> {
    const row = this.fences.get(fenceId);
    return row ? LineageFenceDocument.hydrate(row) : undefined;
  }

  async saveLineageFence(
    fence: LineageFenceDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = fence.toSnapshot();
    saveWithCas(
      this.fences,
      row.fenceId,
      {
        ...row,
        aggregateType: "LineageFence",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    const currentFenceId = this.currentFenceByEpisode.get(row.episodeId);
    if (!currentFenceId) {
      this.currentFenceByEpisode.set(row.episodeId, row.fenceId);
      return;
    }
    const currentFence = this.fences.get(currentFenceId);
    if (!currentFence || currentFence.currentEpoch <= row.currentEpoch) {
      this.currentFenceByEpisode.set(row.episodeId, row.fenceId);
    }
  }

  async getCurrentLineageFenceForEpisode(
    episodeId: string,
  ): Promise<LineageFenceDocument | undefined> {
    const fenceId = this.currentFenceByEpisode.get(episodeId);
    if (!fenceId) {
      return undefined;
    }
    const row = this.fences.get(fenceId);
    return row ? LineageFenceDocument.hydrate(row) : undefined;
  }

  async listLineageFences(): Promise<readonly LineageFenceDocument[]> {
    return [...this.fences.values()]
      .sort(
        (left, right) =>
          left.currentEpoch - right.currentEpoch || compareIso(left.issuedAt, right.issuedAt),
      )
      .map((row) => LineageFenceDocument.hydrate(row));
  }

  async getCommandActionRecord(
    actionRecordId: string,
  ): Promise<CommandActionRecordDocument | undefined> {
    const row = this.actions.get(actionRecordId);
    return row ? CommandActionRecordDocument.hydrate(row) : undefined;
  }

  async saveCommandActionRecord(
    record: CommandActionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = record.toSnapshot();
    saveWithCas(
      this.actions,
      row.actionRecordId,
      {
        ...row,
        aggregateType: "CommandActionRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.actionByIdempotencyFingerprint.set(
      actionIdempotencyFingerprint({
        governingObjectRef: row.governingObjectRef,
        routeIntentTupleHash: row.routeIntentTupleHash,
        idempotencyKey: row.idempotencyKey,
        semanticPayloadHash: row.semanticPayloadHash,
      }),
      row.actionRecordId,
    );
    this.latestActionBySourceCommand.set(
      sourceCommandKey({
        governingObjectRef: row.governingObjectRef,
        sourceCommandId: row.sourceCommandId,
        actionScope: row.actionScope,
      }),
      row.actionRecordId,
    );
  }

  async findCommandActionRecordByIdempotencyFingerprint(
    fingerprint: string,
  ): Promise<CommandActionRecordDocument | undefined> {
    const actionRecordId = this.actionByIdempotencyFingerprint.get(fingerprint);
    if (!actionRecordId) {
      return undefined;
    }
    const row = this.actions.get(actionRecordId);
    return row ? CommandActionRecordDocument.hydrate(row) : undefined;
  }

  async findLatestCommandActionRecordForSourceCommand(
    sourceKey: string,
  ): Promise<CommandActionRecordDocument | undefined> {
    const actionRecordId = this.latestActionBySourceCommand.get(sourceKey);
    if (!actionRecordId) {
      return undefined;
    }
    const row = this.actions.get(actionRecordId);
    return row ? CommandActionRecordDocument.hydrate(row) : undefined;
  }

  async listCommandActionRecords(): Promise<readonly CommandActionRecordDocument[]> {
    return [...this.actions.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => CommandActionRecordDocument.hydrate(row));
  }

  async getLeaseAuthorityState(
    authorityRef: string,
  ): Promise<LeaseAuthorityStateSnapshot | undefined> {
    const row = this.authorityStates.get(authorityRef);
    return row ? normalizeLeaseAuthorityState(row) : undefined;
  }

  async saveLeaseAuthorityState(
    state: LeaseAuthorityStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = normalizeLeaseAuthorityState(state);
    saveWithCas(
      this.authorityStates,
      normalized.authorityKey,
      {
        ...normalized,
        aggregateType: "LeaseAuthorityState",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }
}

export function createLeaseFenceCommandStore(): LeaseFenceCommandDependencies {
  return new InMemoryLeaseFenceCommandStore();
}

export interface AcquireLeaseInput {
  requestId: string;
  episodeId: string;
  requestLineageRef: string;
  domain: string;
  domainObjectRef: string;
  leaseAuthorityRef: string;
  ownerActorRef: string;
  ownerSessionRef?: string | null;
  ownerWorkerRef?: string | null;
  governingObjectVersionRef: string;
  leaseScopeComponents: readonly string[];
  leaseTtlSeconds: number;
  acquiredAt: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
  closeBlockReason?: string | null;
}

export interface HeartbeatLeaseInput {
  leaseId: string;
  domain: string;
  domainObjectRef: string;
  ownerSessionRef?: string | null;
  ownerWorkerRef?: string | null;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  heartbeatAt: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
  detectedByRef: string;
}

export interface ReleaseLeaseInput {
  leaseId: string;
  domain: string;
  domainObjectRef: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  releasedAt: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
  detectedByRef: string;
  closeBlockReason?: string | null;
}

export interface BreakLeaseInput {
  leaseId: string;
  domain: string;
  domainObjectRef: string;
  brokenAt: string;
  breakReason: string;
  breakGuardSeconds?: number;
  authorizedByRef: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
}

export interface SupervisorTakeoverInput {
  priorLeaseId: string;
  domain: string;
  domainObjectRef: string;
  requestId: string;
  episodeId: string;
  requestLineageRef: string;
  leaseAuthorityRef: string;
  governingObjectVersionRef: string;
  toOwnerActorRef: string;
  toOwnerSessionRef?: string | null;
  toOwnerWorkerRef?: string | null;
  authorizedByRef: string;
  takeoverReason: string;
  leaseScopeComponents: readonly string[];
  leaseTtlSeconds: number;
  committedAt: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
}

export interface IssueLineageFenceInput {
  leaseId: string;
  domain: string;
  domainObjectRef: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  issuedFor: LineageFenceIssuedFor;
  issuedAt: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
  detectedByRef: string;
  expiresInSeconds?: number;
}

export interface RegisterCommandActionInput {
  leaseId: string;
  domain: string;
  domainObjectRef: string;
  governingObjectVersionRef: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  actionScope: string;
  governingObjectRef: string;
  canonicalObjectDescriptorRef: string;
  initiatingBoundedContextRef: string;
  governingBoundedContextRef: string;
  lineageScope: string;
  routeIntentRef: string;
  routeContractDigestRef: string;
  requiredContextBoundaryRefs: readonly string[];
  parentAnchorRef: string;
  edgeCorrelationId: string;
  initiatingUiEventRef: string;
  initiatingUiEventCausalityFrameRef: string;
  actingContextRef: string;
  policyBundleRef: string;
  sourceCommandId: string;
  transportCorrelationId: string;
  semanticPayload: unknown;
  idempotencyKey: string;
  idempotencyRecordRef: string;
  commandFollowingTokenRef: string;
  expectedEffectSetRefs: readonly string[];
  causalToken: string;
  createdAt: string;
  sameShellRecoveryRouteRef: string;
  operatorVisibleWorkRef: string;
  blockedActionScopeRefs: readonly string[];
  detectedByRef: string;
  routeIntentTupleHash?: string;
  settledAt?: string | null;
}

export interface MutationContextValidationResult {
  lease: RequestLifecycleLeaseDocument;
  currentLineageEpoch: number;
}

export interface CommandActionRegistrationResult {
  actionRecord: CommandActionRecordDocument;
  reusedExisting: boolean;
  supersededActionRecordRef: string | null;
}

export class LeaseFenceCommandAuthorityService {
  constructor(
    private readonly repositories: LeaseFenceCommandDependencies,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  private async requireRequestContext(input: {
    requestId: string;
    episodeId: string;
    requestLineageRef: string;
  }): Promise<void> {
    const request = await this.repositories.getRequest(input.requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${input.requestId} is required.`);
    invariant(
      request.episodeId === input.episodeId,
      "REQUEST_EPISODE_MISMATCH",
      `Request ${input.requestId} does not belong to episode ${input.episodeId}.`,
    );
    invariant(
      request.requestLineageRef === input.requestLineageRef,
      "REQUEST_LINEAGE_MISMATCH",
      `Request ${input.requestId} does not belong to lineage ${input.requestLineageRef}.`,
    );
    const episode = await this.repositories.getEpisode(input.episodeId);
    invariant(episode, "EPISODE_NOT_FOUND", `Episode ${input.episodeId} is required.`);
  }

  private async getOrCreateAuthorityState(input: {
    requestId: string;
    episodeId: string;
    requestLineageRef: string;
    domain: string;
    domainObjectRef: string;
    governingObjectVersionRef: string;
    updatedAt: string;
  }): Promise<LeaseAuthorityLookup> {
    const key = authorityKey(input.domain, input.domainObjectRef);
    const existing = await this.repositories.getLeaseAuthorityState(key);
    if (existing) {
      return {
        state: existing,
        existed: true,
      };
    }
    return {
      existed: false,
      state: {
        authorityKey: key,
        episodeId: input.episodeId,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        domain: input.domain,
        domainObjectRef: input.domainObjectRef,
        governingObjectVersionRef: requireRef(
          input.governingObjectVersionRef,
          "governingObjectVersionRef",
        ),
        currentLeaseRef: null,
        currentOwnershipEpoch: 0,
        currentFencingToken: null,
        currentLineageEpoch: 0,
        updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
        version: 1,
      },
    };
  }

  private async maybeExpireCurrentLease(input: {
    authorityState: LeaseAuthorityStateSnapshot;
    currentLease: RequestLifecycleLeaseDocument | undefined;
    at: string;
    detectedByRef: string;
    sameShellRecoveryRouteRef: string;
    operatorVisibleWorkRef: string;
    blockedActionScopeRefs: readonly string[];
    breakGuardSeconds?: number;
  }): Promise<{
    authorityState: LeaseAuthorityStateSnapshot;
    currentLease: RequestLifecycleLeaseDocument | undefined;
    recovery: StaleOwnershipRecoveryRecordDocument | null;
  }> {
    if (!input.currentLease) {
      return {
        authorityState: input.authorityState,
        currentLease: undefined,
        recovery: null,
      };
    }
    const snapshot = input.currentLease.toSnapshot();
    if (snapshot.state !== "active" && snapshot.state !== "releasing") {
      return {
        authorityState: input.authorityState,
        currentLease: input.currentLease,
        recovery: null,
      };
    }
    if (Date.parse(leaseExpiryAt(snapshot)) > Date.parse(input.at)) {
      return {
        authorityState: input.authorityState,
        currentLease: input.currentLease,
        recovery: null,
      };
    }
    const recovery = await this.ensureRecovery({
      requestId: snapshot.requestId,
      leaseRef: snapshot.leaseId,
      domain: snapshot.domain,
      domainObjectRef: snapshot.domainObjectRef,
      lastOwnershipEpoch: snapshot.ownershipEpoch,
      lastFencingToken: snapshot.fencingToken,
      detectedAt: input.at,
      detectedByRef: input.detectedByRef,
      recoveryReason: "heartbeat_missed",
      blockedActionScopeRefs: input.blockedActionScopeRefs,
      operatorVisibleWorkRef: input.operatorVisibleWorkRef,
      sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
    });
    const expired = input.currentLease.withExpired({
      staleOwnerRecoveryRef: recovery.staleOwnershipRecoveryId,
      breakEligibleAt: computeBreakEligibleAt(snapshot, input.breakGuardSeconds ?? 120),
    });
    await this.repositories.saveRequestLifecycleLease(expired, {
      expectedVersion: input.currentLease.version,
    });
    const nextAuthorityState = {
      ...input.authorityState,
      currentLeaseRef: expired.leaseId,
      updatedAt: input.at,
      version: nextVersion(input.authorityState.version),
    };
    await this.repositories.saveLeaseAuthorityState(nextAuthorityState, {
      expectedVersion: input.authorityState.version,
    });
    return {
      authorityState: nextAuthorityState,
      currentLease: expired,
      recovery,
    };
  }

  private async ensureRecovery(input: {
    requestId: string;
    leaseRef: string;
    domain: string;
    domainObjectRef: string;
    lastOwnershipEpoch: number;
    lastFencingToken: string;
    detectedAt: string;
    detectedByRef: string;
    recoveryReason: StaleOwnershipRecoveryReason;
    blockedActionScopeRefs: readonly string[];
    operatorVisibleWorkRef: string;
    sameShellRecoveryRouteRef: string;
  }): Promise<StaleOwnershipRecoveryRecordDocument> {
    const open = await this.repositories.findOpenStaleOwnershipRecoveryForLease(input.leaseRef);
    if (open) {
      const updated = StaleOwnershipRecoveryRecordDocument.hydrate({
        ...open.toSnapshot(),
        blockedActionScopeRefs: uniqueSortedRefs([
          ...open.toSnapshot().blockedActionScopeRefs,
          ...input.blockedActionScopeRefs,
        ]),
        resolutionState:
          input.recoveryReason === "supervisor_takeover"
            ? "takeover_pending"
            : input.recoveryReason === "superseded_reacquire"
              ? "reacquire_in_progress"
              : open.toSnapshot().resolutionState,
        version: open.version,
      });
      await this.repositories.saveStaleOwnershipRecoveryRecord(updated, {
        expectedVersion: open.version,
      });
      return updated;
    }
    const recovery = StaleOwnershipRecoveryRecordDocument.create({
      staleOwnershipRecoveryId: nextControlPlaneId(this.idGenerator, "stale_ownership_recovery"),
      requestId: input.requestId,
      leaseRef: input.leaseRef,
      domain: input.domain,
      domainObjectRef: input.domainObjectRef,
      lastOwnershipEpoch: input.lastOwnershipEpoch,
      lastFencingToken: input.lastFencingToken,
      detectedAt: input.detectedAt,
      detectedByRef: input.detectedByRef,
      recoveryReason: input.recoveryReason,
      blockedActionScopeRefs: input.blockedActionScopeRefs,
      operatorVisibleWorkRef: input.operatorVisibleWorkRef,
      sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
      resolutionState:
        input.recoveryReason === "supervisor_takeover"
          ? "takeover_pending"
          : input.recoveryReason === "superseded_reacquire"
            ? "reacquire_in_progress"
            : "open",
      resolvedAt: null,
    });
    await this.repositories.saveStaleOwnershipRecoveryRecord(recovery);
    return recovery;
  }

  private async validateCurrentLeaseContext(input: {
    authorityState: LeaseAuthorityStateSnapshot;
    leaseId: string;
    presentedOwnershipEpoch: number;
    presentedFencingToken: string;
    ownerSessionRef?: string | null;
    ownerWorkerRef?: string | null;
    at: string;
    sameShellRecoveryRouteRef: string;
    operatorVisibleWorkRef: string;
    blockedActionScopeRefs: readonly string[];
    detectedByRef: string;
  }): Promise<MutationContextValidationResult> {
    const currentLease = input.authorityState.currentLeaseRef
      ? await this.repositories.getRequestLifecycleLease(input.authorityState.currentLeaseRef)
      : undefined;
    const expired = await this.maybeExpireCurrentLease({
      authorityState: input.authorityState,
      currentLease,
      at: input.at,
      detectedByRef: input.detectedByRef,
      sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
      operatorVisibleWorkRef: input.operatorVisibleWorkRef,
      blockedActionScopeRefs: input.blockedActionScopeRefs,
    });
    const lease = expired.currentLease;
    invariant(lease, "LEASE_NOT_FOUND", "A current RequestLifecycleLease is required.");
    const snapshot = lease.toSnapshot();
    if (
      snapshot.leaseId !== input.leaseId ||
      snapshot.state !== "active" ||
      snapshot.ownershipEpoch !== input.presentedOwnershipEpoch ||
      snapshot.fencingToken !== input.presentedFencingToken
    ) {
      await this.ensureRecovery({
        requestId: snapshot.requestId,
        leaseRef: input.leaseId,
        domain: snapshot.domain,
        domainObjectRef: snapshot.domainObjectRef,
        lastOwnershipEpoch: input.presentedOwnershipEpoch,
        lastFencingToken: input.presentedFencingToken,
        detectedAt: input.at,
        detectedByRef: input.detectedByRef,
        recoveryReason: "stale_write_rejected",
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
      });
      throw new RequestBackboneInvariantError(
        "STALE_LEASE_CONTEXT",
        "Presented leaseId, ownershipEpoch, or fencingToken is stale.",
      );
    }
    if (input.ownerSessionRef) {
      if (snapshot.ownerSessionRef !== requireRef(input.ownerSessionRef, "ownerSessionRef")) {
        await this.ensureRecovery({
          requestId: snapshot.requestId,
          leaseRef: snapshot.leaseId,
          domain: snapshot.domain,
          domainObjectRef: snapshot.domainObjectRef,
          lastOwnershipEpoch: snapshot.ownershipEpoch,
          lastFencingToken: snapshot.fencingToken,
          detectedAt: input.at,
          detectedByRef: input.detectedByRef,
          recoveryReason: "stale_write_rejected",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        });
        throw new RequestBackboneInvariantError(
          "STALE_OWNER_SESSION",
          "ownerSessionRef no longer matches the governing lease owner.",
        );
      }
    }
    if (input.ownerWorkerRef) {
      if (snapshot.ownerWorkerRef !== requireRef(input.ownerWorkerRef, "ownerWorkerRef")) {
        await this.ensureRecovery({
          requestId: snapshot.requestId,
          leaseRef: snapshot.leaseId,
          domain: snapshot.domain,
          domainObjectRef: snapshot.domainObjectRef,
          lastOwnershipEpoch: snapshot.ownershipEpoch,
          lastFencingToken: snapshot.fencingToken,
          detectedAt: input.at,
          detectedByRef: input.detectedByRef,
          recoveryReason: "stale_write_rejected",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        });
        throw new RequestBackboneInvariantError(
          "STALE_OWNER_WORKER",
          "ownerWorkerRef no longer matches the governing lease owner.",
        );
      }
    }
    return {
      lease,
      currentLineageEpoch: expired.authorityState.currentLineageEpoch,
    };
  }

  async acquireLease(input: AcquireLeaseInput): Promise<{
    lease: RequestLifecycleLeaseDocument;
    lineageFence: LineageFenceDocument;
  }> {
    return this.repositories.withControlPlaneBoundary(async () => {
      await this.requireRequestContext(input);
      const acquiredAt = ensureIsoTimestamp(input.acquiredAt, "acquiredAt");
      const authorityLookup = await this.getOrCreateAuthorityState({
        requestId: input.requestId,
        episodeId: input.episodeId,
        requestLineageRef: input.requestLineageRef,
        domain: input.domain,
        domainObjectRef: input.domainObjectRef,
        governingObjectVersionRef: input.governingObjectVersionRef,
        updatedAt: acquiredAt,
      });
      const currentLease = authorityLookup.state.currentLeaseRef
        ? await this.repositories.getRequestLifecycleLease(authorityLookup.state.currentLeaseRef)
        : undefined;
      const expired = await this.maybeExpireCurrentLease({
        authorityState: authorityLookup.state,
        currentLease,
        at: acquiredAt,
        detectedByRef: input.ownerActorRef,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        blockedActionScopeRefs: input.blockedActionScopeRefs,
      });
      const activeLease = expired.currentLease;
      invariant(
        !activeLease || activeLease.toSnapshot().state !== "active",
        "LEASE_ALREADY_ACTIVE",
        "A current RequestLifecycleLease already owns this domain object.",
      );
      const nextOwnershipEpoch = expired.authorityState.currentOwnershipEpoch + 1;
      const leaseId = nextControlPlaneId(this.idGenerator, "request_lifecycle_lease");
      const authorityRef = authorityKey(input.domain, input.domainObjectRef);
      const lease = RequestLifecycleLeaseDocument.create({
        leaseId,
        episodeId: input.episodeId,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        domain: input.domain,
        domainObjectRef: input.domainObjectRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        ownerActorRef: input.ownerActorRef,
        ownerSessionRef: optionalRef(input.ownerSessionRef),
        ownerWorkerRef: optionalRef(input.ownerWorkerRef),
        ownershipEpoch: nextOwnershipEpoch,
        leaseScopeHash: buildLeaseScopeHash({
          domain: input.domain,
          domainObjectRef: input.domainObjectRef,
          leaseAuthorityRef: input.leaseAuthorityRef,
          scopeComponents: input.leaseScopeComponents,
        }),
        state: "active",
        closeBlockReason: optionalRef(input.closeBlockReason),
        leaseTtlSeconds: input.leaseTtlSeconds,
        heartbeatAt: acquiredAt,
        fencingToken: mintFencingToken(authorityRef, nextOwnershipEpoch, leaseId),
        staleOwnerRecoveryRef: null,
        supersededByLeaseRef: null,
        acquiredAt,
        releasedAt: null,
        breakEligibleAt: null,
        brokenByActorRef: null,
        breakReason: null,
      });
      const lineageFence = LineageFenceDocument.create({
        fenceId: nextControlPlaneId(this.idGenerator, "lineage_fence"),
        episodeId: input.episodeId,
        currentEpoch: expired.authorityState.currentLineageEpoch + 1,
        issuedFor: "ownership_change",
        issuedAt: acquiredAt,
        expiresAt: addSeconds(acquiredAt, 86400),
      });
      await this.repositories.saveRequestLifecycleLease(lease);
      await this.repositories.saveLineageFence(lineageFence);
      await this.repositories.saveLeaseAuthorityState(
        {
          ...expired.authorityState,
          governingObjectVersionRef: input.governingObjectVersionRef,
          currentLeaseRef: lease.leaseId,
          currentOwnershipEpoch: nextOwnershipEpoch,
          currentFencingToken: lease.toSnapshot().fencingToken,
          currentLineageEpoch: lineageFence.currentEpoch,
          updatedAt: acquiredAt,
          version: nextVersion(expired.authorityState.version),
        },
        authorityLookup.existed
          ? {
              expectedVersion: expired.authorityState.version,
            }
          : undefined,
      );
      return {
        lease,
        lineageFence,
      };
    });
  }

  async heartbeatLease(input: HeartbeatLeaseInput): Promise<RequestLifecycleLeaseDocument> {
    return this.repositories.withControlPlaneBoundary(async () => {
      const authorityState = await this.repositories.getLeaseAuthorityState(
        authorityKey(input.domain, input.domainObjectRef),
      );
      invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", "Lease authority state is missing.");
      const heartbeatAt = ensureIsoTimestamp(input.heartbeatAt, "heartbeatAt");
      const context = await this.validateCurrentLeaseContext({
        authorityState,
        leaseId: input.leaseId,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        ownerSessionRef: input.ownerSessionRef,
        ownerWorkerRef: input.ownerWorkerRef,
        at: heartbeatAt,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        detectedByRef: input.detectedByRef,
      });
      const updated = context.lease.withHeartbeat(heartbeatAt);
      await this.repositories.saveRequestLifecycleLease(updated, {
        expectedVersion: context.lease.version,
      });
      await this.repositories.saveLeaseAuthorityState(
        {
          ...authorityState,
          updatedAt: heartbeatAt,
          version: nextVersion(authorityState.version),
        },
        {
          expectedVersion: authorityState.version,
        },
      );
      return updated;
    });
  }

  async releaseLease(input: ReleaseLeaseInput): Promise<{
    lease: RequestLifecycleLeaseDocument;
    lineageFence: LineageFenceDocument;
  }> {
    return this.repositories.withControlPlaneBoundary(async () => {
      const authorityState = await this.repositories.getLeaseAuthorityState(
        authorityKey(input.domain, input.domainObjectRef),
      );
      invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", "Lease authority state is missing.");
      const releasedAt = ensureIsoTimestamp(input.releasedAt, "releasedAt");
      const context = await this.validateCurrentLeaseContext({
        authorityState,
        leaseId: input.leaseId,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        at: releasedAt,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        detectedByRef: input.detectedByRef,
      });
      const released = context.lease.withRelease({
        releasedAt,
        closeBlockReason: input.closeBlockReason ?? null,
      });
      const fence = LineageFenceDocument.create({
        fenceId: nextControlPlaneId(this.idGenerator, "lineage_fence"),
        episodeId: authorityState.episodeId,
        currentEpoch: context.currentLineageEpoch + 1,
        issuedFor: "ownership_change",
        issuedAt: releasedAt,
        expiresAt: addSeconds(releasedAt, 86400),
      });
      await this.repositories.saveRequestLifecycleLease(released, {
        expectedVersion: context.lease.version,
      });
      await this.repositories.saveLineageFence(fence);
      await this.repositories.saveLeaseAuthorityState(
        {
          ...authorityState,
          currentLeaseRef: null,
          currentFencingToken: null,
          currentLineageEpoch: fence.currentEpoch,
          updatedAt: releasedAt,
          version: nextVersion(authorityState.version),
        },
        {
          expectedVersion: authorityState.version,
        },
      );
      return {
        lease: released,
        lineageFence: fence,
      };
    });
  }

  async breakLease(input: BreakLeaseInput): Promise<{
    lease: RequestLifecycleLeaseDocument;
    recovery: StaleOwnershipRecoveryRecordDocument;
    lineageFence: LineageFenceDocument;
  }> {
    return this.repositories.withControlPlaneBoundary(async () => {
      const authorityState = await this.repositories.getLeaseAuthorityState(
        authorityKey(input.domain, input.domainObjectRef),
      );
      invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", "Lease authority state is missing.");
      const lease = await this.repositories.getRequestLifecycleLease(input.leaseId);
      invariant(lease, "LEASE_NOT_FOUND", `Lease ${input.leaseId} is required.`);
      const brokenAt = ensureIsoTimestamp(input.brokenAt, "brokenAt");
      const maybeExpired = await this.maybeExpireCurrentLease({
        authorityState,
        currentLease: lease,
        at: brokenAt,
        detectedByRef: input.authorizedByRef,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        breakGuardSeconds: input.breakGuardSeconds,
      });
      const currentLease = maybeExpired.currentLease ?? lease;
      const currentSnapshot = currentLease.toSnapshot();
      invariant(
        currentSnapshot.state === "expired" || currentSnapshot.state === "active",
        "LEASE_NOT_BREAKABLE",
        "Only expired or force-audited active leases may be broken.",
      );
      if (currentSnapshot.breakEligibleAt) {
        invariant(
          Date.parse(currentSnapshot.breakEligibleAt) <= Date.parse(brokenAt),
          "LEASE_BREAK_GUARD_NOT_SATISFIED",
          "breakEligibleAt must have passed before stale-lease break.",
        );
      }
      const recovery =
        maybeExpired.recovery ??
        (await this.ensureRecovery({
          requestId: currentSnapshot.requestId,
          leaseRef: currentSnapshot.leaseId,
          domain: currentSnapshot.domain,
          domainObjectRef: currentSnapshot.domainObjectRef,
          lastOwnershipEpoch: currentSnapshot.ownershipEpoch,
          lastFencingToken: currentSnapshot.fencingToken,
          detectedAt: brokenAt,
          detectedByRef: input.authorizedByRef,
          recoveryReason: "heartbeat_missed",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        }));
      const broken = currentLease.withBroken({
        staleOwnerRecoveryRef: recovery.staleOwnershipRecoveryId,
        breakEligibleAt:
          currentSnapshot.breakEligibleAt ??
          computeBreakEligibleAt(currentSnapshot, input.breakGuardSeconds ?? 120),
        brokenByActorRef: input.authorizedByRef,
        breakReason: input.breakReason,
      });
      const fence = LineageFenceDocument.create({
        fenceId: nextControlPlaneId(this.idGenerator, "lineage_fence"),
        episodeId: authorityState.episodeId,
        currentEpoch: maybeExpired.authorityState.currentLineageEpoch + 1,
        issuedFor: "ownership_change",
        issuedAt: brokenAt,
        expiresAt: addSeconds(brokenAt, 86400),
      });
      await this.repositories.saveRequestLifecycleLease(broken, {
        expectedVersion: currentLease.version,
      });
      await this.repositories.saveLineageFence(fence);
      await this.repositories.saveLeaseAuthorityState(
        {
          ...maybeExpired.authorityState,
          currentLeaseRef: null,
          currentFencingToken: null,
          currentLineageEpoch: fence.currentEpoch,
          updatedAt: brokenAt,
          version: nextVersion(maybeExpired.authorityState.version),
        },
        {
          expectedVersion: maybeExpired.authorityState.version,
        },
      );
      return {
        lease: broken,
        recovery,
        lineageFence: fence,
      };
    });
  }

  async takeoverLease(input: SupervisorTakeoverInput): Promise<{
    priorLease: RequestLifecycleLeaseDocument;
    replacementLease: RequestLifecycleLeaseDocument;
    recovery: StaleOwnershipRecoveryRecordDocument;
    takeover: LeaseTakeoverRecordDocument;
    lineageFence: LineageFenceDocument;
  }> {
    return this.repositories.withControlPlaneBoundary(async () => {
      await this.requireRequestContext(input);
      const authorityLookup = await this.getOrCreateAuthorityState({
        requestId: input.requestId,
        episodeId: input.episodeId,
        requestLineageRef: input.requestLineageRef,
        domain: input.domain,
        domainObjectRef: input.domainObjectRef,
        governingObjectVersionRef: input.governingObjectVersionRef,
        updatedAt: input.committedAt,
      });
      const priorLease = await this.repositories.getRequestLifecycleLease(input.priorLeaseId);
      invariant(priorLease, "LEASE_NOT_FOUND", `Lease ${input.priorLeaseId} is required.`);
      const committedAt = ensureIsoTimestamp(input.committedAt, "committedAt");
      const recovery = await this.ensureRecovery({
        requestId: input.requestId,
        leaseRef: priorLease.leaseId,
        domain: input.domain,
        domainObjectRef: input.domainObjectRef,
        lastOwnershipEpoch: priorLease.toSnapshot().ownershipEpoch,
        lastFencingToken: priorLease.toSnapshot().fencingToken,
        detectedAt: committedAt,
        detectedByRef: input.authorizedByRef,
        recoveryReason: "supervisor_takeover",
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
      });
      const takeoverPending = LeaseTakeoverRecordDocument.create({
        leaseTakeoverRecordId: nextControlPlaneId(this.idGenerator, "lease_takeover_record"),
        priorLeaseRef: priorLease.leaseId,
        replacementLeaseRef: null,
        fromOwnerRef: priorLease.toSnapshot().ownerActorRef,
        toOwnerRef: input.toOwnerActorRef,
        authorizedByRef: input.authorizedByRef,
        takeoverReason: input.takeoverReason,
        takeoverState: "pending",
        issuedAt: committedAt,
        committedAt: null,
        cancelledAt: null,
      });
      await this.repositories.saveLeaseTakeoverRecord(takeoverPending);
      const currentAuthorityState = authorityLookup.state;
      const nextOwnershipEpoch = currentAuthorityState.currentOwnershipEpoch + 1;
      const replacementLeaseId = nextControlPlaneId(this.idGenerator, "request_lifecycle_lease");
      const authorityRef = authorityKey(input.domain, input.domainObjectRef);
      const replacementLease = RequestLifecycleLeaseDocument.create({
        leaseId: replacementLeaseId,
        episodeId: input.episodeId,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        domain: input.domain,
        domainObjectRef: input.domainObjectRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        ownerActorRef: input.toOwnerActorRef,
        ownerSessionRef: optionalRef(input.toOwnerSessionRef),
        ownerWorkerRef: optionalRef(input.toOwnerWorkerRef),
        ownershipEpoch: nextOwnershipEpoch,
        leaseScopeHash: buildLeaseScopeHash({
          domain: input.domain,
          domainObjectRef: input.domainObjectRef,
          leaseAuthorityRef: input.leaseAuthorityRef,
          scopeComponents: input.leaseScopeComponents,
        }),
        state: "active",
        closeBlockReason: "supervisor_takeover_active",
        leaseTtlSeconds: input.leaseTtlSeconds,
        heartbeatAt: committedAt,
        fencingToken: mintFencingToken(authorityRef, nextOwnershipEpoch, replacementLeaseId),
        staleOwnerRecoveryRef: null,
        supersededByLeaseRef: null,
        acquiredAt: committedAt,
        releasedAt: null,
        breakEligibleAt: null,
        brokenByActorRef: null,
        breakReason: null,
      });
      const priorSnapshot = priorLease.toSnapshot();
      const priorBroken =
        priorSnapshot.state === "broken"
          ? priorLease.withSupersededByLease(replacementLeaseId, { preserveState: "broken" })
          : priorLease
              .withBroken({
                staleOwnerRecoveryRef: recovery.staleOwnershipRecoveryId,
                breakEligibleAt: computeBreakEligibleAt(priorSnapshot, 0),
                brokenByActorRef: input.authorizedByRef,
                breakReason: input.takeoverReason,
              })
              .withSupersededByLease(replacementLeaseId, { preserveState: "broken" });
      const takeover = takeoverPending.withCommitted(replacementLeaseId, committedAt);
      const lineageFence = LineageFenceDocument.create({
        fenceId: nextControlPlaneId(this.idGenerator, "lineage_fence"),
        episodeId: input.episodeId,
        currentEpoch: currentAuthorityState.currentLineageEpoch + 1,
        issuedFor: "ownership_change",
        issuedAt: committedAt,
        expiresAt: addSeconds(committedAt, 86400),
      });
      await this.repositories.saveRequestLifecycleLease(priorBroken, {
        expectedVersion: priorLease.version,
      });
      await this.repositories.saveRequestLifecycleLease(replacementLease);
      await this.repositories.saveLeaseTakeoverRecord(takeover, {
        expectedVersion: takeoverPending.version,
      });
      await this.repositories.saveStaleOwnershipRecoveryRecord(
        recovery.withResolution("resolved", committedAt),
        {
          expectedVersion: recovery.version,
        },
      );
      await this.repositories.saveLineageFence(lineageFence);
      await this.repositories.saveLeaseAuthorityState(
        {
          ...currentAuthorityState,
          governingObjectVersionRef: input.governingObjectVersionRef,
          currentLeaseRef: replacementLease.leaseId,
          currentOwnershipEpoch: nextOwnershipEpoch,
          currentFencingToken: replacementLease.toSnapshot().fencingToken,
          currentLineageEpoch: lineageFence.currentEpoch,
          updatedAt: committedAt,
          version: nextVersion(currentAuthorityState.version),
        },
        authorityLookup.existed
          ? {
              expectedVersion: currentAuthorityState.version,
            }
          : undefined,
      );
      return {
        priorLease: priorBroken,
        replacementLease,
        recovery,
        takeover,
        lineageFence,
      };
    });
  }

  async issueLineageFence(input: IssueLineageFenceInput): Promise<LineageFenceDocument> {
    return this.repositories.withControlPlaneBoundary(async () => {
      const authorityState = await this.repositories.getLeaseAuthorityState(
        authorityKey(input.domain, input.domainObjectRef),
      );
      invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", "Lease authority state is missing.");
      const issuedAt = ensureIsoTimestamp(input.issuedAt, "issuedAt");
      const context = await this.validateCurrentLeaseContext({
        authorityState,
        leaseId: input.leaseId,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        at: issuedAt,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        detectedByRef: input.detectedByRef,
      });
      if (context.currentLineageEpoch !== input.presentedLineageFenceEpoch) {
        await this.ensureRecovery({
          requestId: authorityState.requestId,
          leaseRef: input.leaseId,
          domain: input.domain,
          domainObjectRef: input.domainObjectRef,
          lastOwnershipEpoch: input.presentedOwnershipEpoch,
          lastFencingToken: input.presentedFencingToken,
          detectedAt: issuedAt,
          detectedByRef: input.detectedByRef,
          recoveryReason: "lineage_drift",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        });
        throw new RequestBackboneInvariantError(
          "STALE_LINEAGE_EPOCH",
          "LineageFence issuance requires the current lineage epoch.",
        );
      }
      const fence = LineageFenceDocument.create({
        fenceId: nextControlPlaneId(this.idGenerator, "lineage_fence"),
        episodeId: authorityState.episodeId,
        currentEpoch: context.currentLineageEpoch + 1,
        issuedFor: input.issuedFor,
        issuedAt,
        expiresAt: addSeconds(issuedAt, input.expiresInSeconds ?? 86400),
      });
      await this.repositories.saveLineageFence(fence);
      await this.repositories.saveLeaseAuthorityState(
        {
          ...authorityState,
          currentLineageEpoch: fence.currentEpoch,
          updatedAt: issuedAt,
          version: nextVersion(authorityState.version),
        },
        {
          expectedVersion: authorityState.version,
        },
      );
      return fence;
    });
  }

  async registerCommandAction(
    input: RegisterCommandActionInput,
  ): Promise<CommandActionRegistrationResult> {
    return this.repositories.withControlPlaneBoundary(async () => {
      const authorityState = await this.repositories.getLeaseAuthorityState(
        authorityKey(input.domain, input.domainObjectRef),
      );
      invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", "Lease authority state is missing.");
      const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
      const context = await this.validateCurrentLeaseContext({
        authorityState,
        leaseId: input.leaseId,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        at: createdAt,
        sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        operatorVisibleWorkRef: input.operatorVisibleWorkRef,
        blockedActionScopeRefs: input.blockedActionScopeRefs,
        detectedByRef: input.detectedByRef,
      });
      if (context.currentLineageEpoch !== input.presentedLineageFenceEpoch) {
        await this.ensureRecovery({
          requestId: authorityState.requestId,
          leaseRef: input.leaseId,
          domain: input.domain,
          domainObjectRef: input.domainObjectRef,
          lastOwnershipEpoch: input.presentedOwnershipEpoch,
          lastFencingToken: input.presentedFencingToken,
          detectedAt: createdAt,
          detectedByRef: input.detectedByRef,
          recoveryReason: "lineage_drift",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        });
        throw new RequestBackboneInvariantError(
          "STALE_LINEAGE_EPOCH",
          "Cross-domain writes must present the current lineage epoch.",
        );
      }
      if (authorityState.governingObjectVersionRef !== input.governingObjectVersionRef) {
        await this.ensureRecovery({
          requestId: authorityState.requestId,
          leaseRef: input.leaseId,
          domain: input.domain,
          domainObjectRef: input.domainObjectRef,
          lastOwnershipEpoch: input.presentedOwnershipEpoch,
          lastFencingToken: input.presentedFencingToken,
          detectedAt: createdAt,
          detectedByRef: input.detectedByRef,
          recoveryReason: "stale_write_rejected",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        });
        throw new RequestBackboneInvariantError(
          "GOVERNING_OBJECT_VERSION_DRIFT",
          "CommandActionRecord must bind the current governingObjectVersionRef.",
        );
      }
      if (input.presentedOwnershipEpoch !== context.lease.toSnapshot().ownershipEpoch) {
        throw new RequestBackboneInvariantError(
          "STALE_OWNERSHIP_EPOCH",
          "Presented ownershipEpoch no longer matches the current lease.",
        );
      }
      const routeIntentTupleHash =
        input.routeIntentTupleHash ??
        buildRouteIntentTupleHash({
          actionScope: input.actionScope,
          governingObjectRef: input.governingObjectRef,
          canonicalObjectDescriptorRef: input.canonicalObjectDescriptorRef,
          routeIntentRef: input.routeIntentRef,
          routeContractDigestRef: input.routeContractDigestRef,
          parentAnchorRef: input.parentAnchorRef,
          governingObjectVersionRef: input.governingObjectVersionRef,
          lineageScope: input.lineageScope,
          requiredContextBoundaryRefs: input.requiredContextBoundaryRefs,
          actingContextRef: input.actingContextRef,
          initiatingBoundedContextRef: input.initiatingBoundedContextRef,
          governingBoundedContextRef: input.governingBoundedContextRef,
        });
      if (input.routeIntentTupleHash) {
        invariant(
          routeIntentTupleHash === input.routeIntentTupleHash,
          "ROUTE_INTENT_TUPLE_HASH_MISMATCH",
          "routeIntentTupleHash does not reconstruct the exact governing tuple.",
        );
      }
      const semanticPayloadHash = buildSemanticPayloadHash(input.semanticPayload);
      const expectedEffectSetHash = buildExpectedEffectSetHash(input.expectedEffectSetRefs);
      const fingerprint = actionIdempotencyFingerprint({
        governingObjectRef: input.governingObjectRef,
        routeIntentTupleHash,
        idempotencyKey: input.idempotencyKey,
        semanticPayloadHash,
      });
      const existing =
        await this.repositories.findCommandActionRecordByIdempotencyFingerprint(fingerprint);
      if (existing) {
        return {
          actionRecord: existing,
          reusedExisting: true,
          supersededActionRecordRef: existing.toSnapshot().supersedesActionRecordRef,
        };
      }
      if (input.presentedOwnershipEpoch !== authorityState.currentOwnershipEpoch) {
        const recovery = await this.ensureRecovery({
          requestId: authorityState.requestId,
          leaseRef: input.leaseId,
          domain: input.domain,
          domainObjectRef: input.domainObjectRef,
          lastOwnershipEpoch: input.presentedOwnershipEpoch,
          lastFencingToken: input.presentedFencingToken,
          detectedAt: createdAt,
          detectedByRef: input.detectedByRef,
          recoveryReason: "stale_write_rejected",
          blockedActionScopeRefs: input.blockedActionScopeRefs,
          operatorVisibleWorkRef: input.operatorVisibleWorkRef,
          sameShellRecoveryRouteRef: input.sameShellRecoveryRouteRef,
        });
        void recovery;
        throw new RequestBackboneInvariantError(
          "STALE_OWNERSHIP_EPOCH_REJECTED",
          "stale ownership tokens are rejected after takeover or expiry.",
        );
      }
      const currentFence = await this.repositories.getCurrentLineageFenceForEpisode(
        authorityState.episodeId,
      );
      invariant(
        currentFence !== undefined,
        "LINEAGE_FENCE_MISSING",
        "A current LineageFence is required before recording command actions.",
      );
      invariant(
        currentFence.currentEpoch === authorityState.currentLineageEpoch,
        "LINEAGE_FENCE_POINTER_MISMATCH",
        "LineageFence currentEpoch drifted from the authority pointer.",
      );
      const latestBySourceCommand =
        await this.repositories.findLatestCommandActionRecordForSourceCommand(
          sourceCommandKey({
            governingObjectRef: input.governingObjectRef,
            sourceCommandId: input.sourceCommandId,
            actionScope: input.actionScope,
          }),
        );
      const actionRecord = CommandActionRecordDocument.create({
        actionRecordId: nextControlPlaneId(this.idGenerator, "command_action_record"),
        actionScope: input.actionScope,
        governingObjectRef: input.governingObjectRef,
        canonicalObjectDescriptorRef: input.canonicalObjectDescriptorRef,
        initiatingBoundedContextRef: input.initiatingBoundedContextRef,
        governingBoundedContextRef: input.governingBoundedContextRef,
        governingObjectVersionRef: input.governingObjectVersionRef,
        lineageScope: input.lineageScope,
        routeIntentRef: input.routeIntentRef,
        routeContractDigestRef: input.routeContractDigestRef,
        requiredContextBoundaryRefs: input.requiredContextBoundaryRefs,
        parentAnchorRef: input.parentAnchorRef,
        routeIntentTupleHash,
        edgeCorrelationId: input.edgeCorrelationId,
        initiatingUiEventRef: input.initiatingUiEventRef,
        initiatingUiEventCausalityFrameRef: input.initiatingUiEventCausalityFrameRef,
        actingContextRef: input.actingContextRef,
        policyBundleRef: input.policyBundleRef,
        lineageFenceEpoch: input.presentedLineageFenceEpoch,
        sourceCommandId: input.sourceCommandId,
        transportCorrelationId: input.transportCorrelationId,
        semanticPayloadHash,
        idempotencyKey: input.idempotencyKey,
        idempotencyRecordRef: input.idempotencyRecordRef,
        commandFollowingTokenRef: input.commandFollowingTokenRef,
        expectedEffectSetHash,
        causalToken: input.causalToken,
        createdAt,
        settledAt: input.settledAt ?? null,
        supersedesActionRecordRef: latestBySourceCommand?.actionRecordId ?? null,
      });
      await this.repositories.saveCommandActionRecord(actionRecord);
      return {
        actionRecord,
        reusedExisting: false,
        supersededActionRecordRef: latestBySourceCommand?.actionRecordId ?? null,
      };
    });
  }
}

export function createLeaseFenceCommandAuthorityService(
  repositories: LeaseFenceCommandDependencies,
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "lease_fence_command_authority",
  ),
): LeaseFenceCommandAuthorityService {
  return new LeaseFenceCommandAuthorityService(repositories, idGenerator);
}

export interface LeaseFenceSimulationScenarioResult {
  scenarioId: string;
  title: string;
  leases: readonly RequestLifecycleLeaseDocument[];
  recoveries: readonly StaleOwnershipRecoveryRecordDocument[];
  takeovers: readonly LeaseTakeoverRecordDocument[];
  fences: readonly LineageFenceDocument[];
  actions: readonly CommandActionRecordDocument[];
}

export class LeaseFenceCommandSimulationHarness {
  constructor(private readonly idNamespace = "lease_fence_command_simulation") {}

  async runAllScenarios(): Promise<readonly LeaseFenceSimulationScenarioResult[]> {
    return [
      await this.runCompetingReviewersScenario(),
      await this.runStaleWorkerRestartScenario(),
      await this.runSupervisorTakeoverScenario(),
      await this.runStaleLineageScenario(),
      await this.runActionReuseAndSupersessionScenario(),
    ];
  }

  private async seedContext(input: {
    repositories: LeaseFenceCommandDependencies;
    requestId: string;
    episodeId: string;
    requestLineageRef: string;
  }): Promise<void> {
    const episode = await input.repositories.getEpisode(input.episodeId);
    if (!episode) {
      await input.repositories.saveEpisode(
        EpisodeAggregate.create({
          episodeId: input.episodeId,
          episodeFingerprint: `fp_${input.episodeId}`,
          openedAt: "2026-04-12T09:00:00Z",
        }),
      );
    }
    const request = await input.repositories.getRequest(input.requestId);
    if (!request) {
      await input.repositories.saveRequest(
        RequestAggregate.create({
          requestId: input.requestId,
          episodeId: input.episodeId,
          originEnvelopeRef: `envelope_${input.requestId}`,
          promotionRecordRef: `promotion_${input.requestId}`,
          tenantId: "tenant_071",
          sourceChannel: "support_assisted_capture",
          originIngressRecordRef: `ingress_${input.requestId}`,
          normalizedSubmissionRef: `normalized_${input.requestId}`,
          requestType: "clinical_question",
          requestLineageRef: input.requestLineageRef,
          createdAt: "2026-04-12T09:00:00Z",
        }),
      );
    }
  }

  private async runCompetingReviewersScenario(): Promise<LeaseFenceSimulationScenarioResult> {
    const repositories = createLeaseFenceCommandStore();
    await this.seedContext({
      repositories,
      requestId: "request_071_competing",
      episodeId: "episode_071_competing",
      requestLineageRef: "lineage_071_competing",
    });
    const authority = createLeaseFenceCommandAuthorityService(
      repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_competing`),
    );
    await authority.acquireLease({
      requestId: "request_071_competing",
      episodeId: "episode_071_competing",
      requestLineageRef: "lineage_071_competing",
      domain: "triage_workspace",
      domainObjectRef: "task_071_competing",
      leaseAuthorityRef: "lease_authority_triage_workspace",
      ownerActorRef: "actor_reviewer_alpha",
      ownerSessionRef: "session_alpha",
      governingObjectVersionRef: "task_071_competing@v3",
      leaseScopeComponents: ["task_claim", "queue_snapshot::A"],
      leaseTtlSeconds: 300,
      acquiredAt: "2026-04-12T09:01:00Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_071_competing/recover",
      operatorVisibleWorkRef: "work_071_competing",
      blockedActionScopeRefs: ["task_claim", "start_review"],
    });
    try {
      await authority.acquireLease({
        requestId: "request_071_competing",
        episodeId: "episode_071_competing",
        requestLineageRef: "lineage_071_competing",
        domain: "triage_workspace",
        domainObjectRef: "task_071_competing",
        leaseAuthorityRef: "lease_authority_triage_workspace",
        ownerActorRef: "actor_reviewer_bravo",
        ownerSessionRef: "session_bravo",
        governingObjectVersionRef: "task_071_competing@v3",
        leaseScopeComponents: ["task_claim", "queue_snapshot::A"],
        leaseTtlSeconds: 300,
        acquiredAt: "2026-04-12T09:01:20Z",
        sameShellRecoveryRouteRef: "/workspace/tasks/task_071_competing/recover",
        operatorVisibleWorkRef: "work_071_competing",
        blockedActionScopeRefs: ["task_claim", "start_review"],
      });
    } catch {
      // Expected conflict for the deterministic harness.
    }
    return {
      scenarioId: "competing_reviewers_same_task",
      title: "Two reviewers attempt to claim the same task.",
      leases: await repositories.listRequestLifecycleLeases(),
      recoveries: await repositories.listStaleOwnershipRecoveryRecords(),
      takeovers: await repositories.listLeaseTakeoverRecords(),
      fences: await repositories.listLineageFences(),
      actions: await repositories.listCommandActionRecords(),
    };
  }

  private async runStaleWorkerRestartScenario(): Promise<LeaseFenceSimulationScenarioResult> {
    const repositories = createLeaseFenceCommandStore();
    await this.seedContext({
      repositories,
      requestId: "request_071_restart",
      episodeId: "episode_071_restart",
      requestLineageRef: "lineage_071_restart",
    });
    const authority = createLeaseFenceCommandAuthorityService(
      repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_restart`),
    );
    const initial = await authority.acquireLease({
      requestId: "request_071_restart",
      episodeId: "episode_071_restart",
      requestLineageRef: "lineage_071_restart",
      domain: "booking",
      domainObjectRef: "booking_case_071_restart",
      leaseAuthorityRef: "lease_authority_booking",
      ownerActorRef: "worker_alpha",
      ownerWorkerRef: "worker_runtime_alpha",
      governingObjectVersionRef: "booking_case_071_restart@v2",
      leaseScopeComponents: ["booking_commit", "supplier_refresh"],
      leaseTtlSeconds: 120,
      acquiredAt: "2026-04-12T09:02:00Z",
      sameShellRecoveryRouteRef: "/ops/bookings/booking_case_071_restart/recover",
      operatorVisibleWorkRef: "work_071_restart",
      blockedActionScopeRefs: ["booking_commit"],
    });
    await authority.issueLineageFence({
      leaseId: initial.lease.leaseId,
      domain: "booking",
      domainObjectRef: "booking_case_071_restart",
      presentedOwnershipEpoch: initial.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: initial.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: initial.lineageFence.currentEpoch,
      issuedFor: "cross_domain_commit",
      issuedAt: "2026-04-12T09:02:20Z",
      sameShellRecoveryRouteRef: "/ops/bookings/booking_case_071_restart/recover",
      operatorVisibleWorkRef: "work_071_restart",
      blockedActionScopeRefs: ["booking_commit"],
      detectedByRef: "worker_alpha",
    });
    const takeover = await authority.takeoverLease({
      priorLeaseId: initial.lease.leaseId,
      domain: "booking",
      domainObjectRef: "booking_case_071_restart",
      requestId: "request_071_restart",
      episodeId: "episode_071_restart",
      requestLineageRef: "lineage_071_restart",
      leaseAuthorityRef: "lease_authority_booking",
      governingObjectVersionRef: "booking_case_071_restart@v3",
      toOwnerActorRef: "worker_bravo",
      toOwnerWorkerRef: "worker_runtime_bravo",
      authorizedByRef: "supervisor_runtime",
      takeoverReason: "runtime_restart_reassignment",
      leaseScopeComponents: ["booking_commit", "supplier_refresh"],
      leaseTtlSeconds: 120,
      committedAt: "2026-04-12T09:03:00Z",
      sameShellRecoveryRouteRef: "/ops/bookings/booking_case_071_restart/recover",
      operatorVisibleWorkRef: "work_071_restart",
      blockedActionScopeRefs: ["booking_commit"],
    });
    try {
      await authority.registerCommandAction({
        leaseId: initial.lease.leaseId,
        domain: "booking",
        domainObjectRef: "booking_case_071_restart",
        governingObjectVersionRef: "booking_case_071_restart@v2",
        presentedOwnershipEpoch: initial.lease.toSnapshot().ownershipEpoch,
        presentedFencingToken: initial.lease.toSnapshot().fencingToken,
        actionScope: "booking_commit",
        governingObjectRef: "booking_case_071_restart",
        canonicalObjectDescriptorRef: "BookingCase",
        initiatingBoundedContextRef: "booking",
        governingBoundedContextRef: "booking",
        lineageScope: "request",
        routeIntentRef: "route_booking_commit",
        routeContractDigestRef: "digest_booking_commit_v1",
        requiredContextBoundaryRefs: [],
        parentAnchorRef: "anchor_booking_case_071_restart",
        edgeCorrelationId: "edge_restart_stale",
        initiatingUiEventRef: "evt_restart_click",
        initiatingUiEventCausalityFrameRef: "evt_frame_restart",
        actingContextRef: "ops_worker",
        policyBundleRef: "policy_booking_v1",
        presentedLineageFenceEpoch: initial.lineageFence.currentEpoch,
        sourceCommandId: "cmd_restart_stale",
        transportCorrelationId: "transport_restart_stale",
        semanticPayload: { slotRef: "slot_071_restart" },
        idempotencyKey: "idem_restart_stale",
        idempotencyRecordRef: "idem_record_restart_stale",
        commandFollowingTokenRef: "follow_restart_stale",
        expectedEffectSetRefs: ["booking_case.updated"],
        causalToken: "cause_restart_stale",
        createdAt: "2026-04-12T09:03:10Z",
        sameShellRecoveryRouteRef: "/ops/bookings/booking_case_071_restart/recover",
        operatorVisibleWorkRef: "work_071_restart",
        blockedActionScopeRefs: ["booking_commit"],
        detectedByRef: "worker_alpha",
      });
    } catch {
      // Expected stale write rejection after takeover.
    }
    return {
      scenarioId: "worker_restart_with_stale_fencing_token",
      title: "A restarted worker attempts a write with stale fencing tokens.",
      leases: await repositories.listRequestLifecycleLeases(),
      recoveries: await repositories.listStaleOwnershipRecoveryRecords(),
      takeovers: [takeover.takeover],
      fences: await repositories.listLineageFences(),
      actions: await repositories.listCommandActionRecords(),
    };
  }

  private async runSupervisorTakeoverScenario(): Promise<LeaseFenceSimulationScenarioResult> {
    const repositories = createLeaseFenceCommandStore();
    await this.seedContext({
      repositories,
      requestId: "request_071_takeover",
      episodeId: "episode_071_takeover",
      requestLineageRef: "lineage_071_takeover",
    });
    const authority = createLeaseFenceCommandAuthorityService(
      repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_takeover`),
    );
    const lease = await authority.acquireLease({
      requestId: "request_071_takeover",
      episodeId: "episode_071_takeover",
      requestLineageRef: "lineage_071_takeover",
      domain: "hub_coordination",
      domainObjectRef: "hub_case_071_takeover",
      leaseAuthorityRef: "lease_authority_hub",
      ownerActorRef: "actor_hub_alpha",
      ownerSessionRef: "session_hub_alpha",
      governingObjectVersionRef: "hub_case_071_takeover@v6",
      leaseScopeComponents: ["next_task_launch", "handoff_pending"],
      leaseTtlSeconds: 60,
      acquiredAt: "2026-04-12T09:04:00Z",
      sameShellRecoveryRouteRef: "/hub/cases/hub_case_071_takeover/recover",
      operatorVisibleWorkRef: "work_071_takeover",
      blockedActionScopeRefs: ["next_task_launch", "close"],
    });
    await authority.breakLease({
      leaseId: lease.lease.leaseId,
      domain: "hub_coordination",
      domainObjectRef: "hub_case_071_takeover",
      brokenAt: "2026-04-12T09:06:05Z",
      breakReason: "lease_expired_under_watch",
      breakGuardSeconds: 0,
      authorizedByRef: "supervisor_hub",
      sameShellRecoveryRouteRef: "/hub/cases/hub_case_071_takeover/recover",
      operatorVisibleWorkRef: "work_071_takeover",
      blockedActionScopeRefs: ["next_task_launch", "close"],
    });
    const takeover = await authority.takeoverLease({
      priorLeaseId: lease.lease.leaseId,
      domain: "hub_coordination",
      domainObjectRef: "hub_case_071_takeover",
      requestId: "request_071_takeover",
      episodeId: "episode_071_takeover",
      requestLineageRef: "lineage_071_takeover",
      leaseAuthorityRef: "lease_authority_hub",
      governingObjectVersionRef: "hub_case_071_takeover@v7",
      toOwnerActorRef: "actor_hub_supervisor",
      toOwnerSessionRef: "session_hub_supervisor",
      authorizedByRef: "director_hub",
      takeoverReason: "supervisor_takeover_after_expiry",
      leaseScopeComponents: ["next_task_launch", "handoff_pending"],
      leaseTtlSeconds: 180,
      committedAt: "2026-04-12T09:06:20Z",
      sameShellRecoveryRouteRef: "/hub/cases/hub_case_071_takeover/recover",
      operatorVisibleWorkRef: "work_071_takeover",
      blockedActionScopeRefs: ["next_task_launch", "close"],
    });
    return {
      scenarioId: "supervisor_takeover_while_stale_owner_open",
      title: "A supervisor takes over after stale-owner recovery opens.",
      leases: await repositories.listRequestLifecycleLeases(),
      recoveries: await repositories.listStaleOwnershipRecoveryRecords(),
      takeovers: [takeover.takeover],
      fences: await repositories.listLineageFences(),
      actions: await repositories.listCommandActionRecords(),
    };
  }

  private async runStaleLineageScenario(): Promise<LeaseFenceSimulationScenarioResult> {
    const repositories = createLeaseFenceCommandStore();
    await this.seedContext({
      repositories,
      requestId: "request_071_lineage",
      episodeId: "episode_071_lineage",
      requestLineageRef: "lineage_071_lineage",
    });
    const authority = createLeaseFenceCommandAuthorityService(
      repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_lineage`),
    );
    const lease = await authority.acquireLease({
      requestId: "request_071_lineage",
      episodeId: "episode_071_lineage",
      requestLineageRef: "lineage_071_lineage",
      domain: "governance_admin",
      domainObjectRef: "governance_case_071_lineage",
      leaseAuthorityRef: "lease_authority_governance",
      ownerActorRef: "actor_governance_alpha",
      ownerSessionRef: "session_governance_alpha",
      governingObjectVersionRef: "governance_case_071_lineage@v4",
      leaseScopeComponents: ["close", "reopen"],
      leaseTtlSeconds: 240,
      acquiredAt: "2026-04-12T09:07:00Z",
      sameShellRecoveryRouteRef: "/governance/cases/governance_case_071_lineage/recover",
      operatorVisibleWorkRef: "work_071_lineage",
      blockedActionScopeRefs: ["close", "reopen"],
    });
    const closeFence = await authority.issueLineageFence({
      leaseId: lease.lease.leaseId,
      domain: "governance_admin",
      domainObjectRef: "governance_case_071_lineage",
      presentedOwnershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: lease.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: lease.lineageFence.currentEpoch,
      issuedFor: "close",
      issuedAt: "2026-04-12T09:07:20Z",
      sameShellRecoveryRouteRef: "/governance/cases/governance_case_071_lineage/recover",
      operatorVisibleWorkRef: "work_071_lineage",
      blockedActionScopeRefs: ["close", "reopen"],
      detectedByRef: "actor_governance_alpha",
    });
    const reopenFence = await authority.issueLineageFence({
      leaseId: lease.lease.leaseId,
      domain: "governance_admin",
      domainObjectRef: "governance_case_071_lineage",
      presentedOwnershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: lease.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: closeFence.currentEpoch,
      issuedFor: "reopen",
      issuedAt: "2026-04-12T09:07:40Z",
      sameShellRecoveryRouteRef: "/governance/cases/governance_case_071_lineage/recover",
      operatorVisibleWorkRef: "work_071_lineage",
      blockedActionScopeRefs: ["close", "reopen"],
      detectedByRef: "actor_governance_alpha",
    });
    try {
      await authority.registerCommandAction({
        leaseId: lease.lease.leaseId,
        domain: "governance_admin",
        domainObjectRef: "governance_case_071_lineage",
        governingObjectVersionRef: "governance_case_071_lineage@v4",
        presentedOwnershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
        presentedFencingToken: lease.lease.toSnapshot().fencingToken,
        actionScope: "close",
        governingObjectRef: "governance_case_071_lineage",
        canonicalObjectDescriptorRef: "GovernanceCase",
        initiatingBoundedContextRef: "governance_admin",
        governingBoundedContextRef: "governance_admin",
        lineageScope: "request",
        routeIntentRef: "route_governance_close",
        routeContractDigestRef: "digest_governance_close_v1",
        requiredContextBoundaryRefs: [],
        parentAnchorRef: "anchor_governance_case_071_lineage",
        edgeCorrelationId: "edge_governance_stale",
        initiatingUiEventRef: "evt_governance_close",
        initiatingUiEventCausalityFrameRef: "evt_frame_governance_close",
        actingContextRef: "governance_operator",
        policyBundleRef: "policy_governance_v1",
        presentedLineageFenceEpoch: closeFence.currentEpoch,
        sourceCommandId: "cmd_governance_close",
        transportCorrelationId: "transport_governance_close",
        semanticPayload: { closeReason: "stale_epoch_test" },
        idempotencyKey: "idem_governance_close",
        idempotencyRecordRef: "idem_record_governance_close",
        commandFollowingTokenRef: "follow_governance_close",
        expectedEffectSetRefs: ["request.closed"],
        causalToken: "cause_governance_close",
        createdAt: "2026-04-12T09:07:50Z",
        sameShellRecoveryRouteRef: "/governance/cases/governance_case_071_lineage/recover",
        operatorVisibleWorkRef: "work_071_lineage",
        blockedActionScopeRefs: ["close"],
        detectedByRef: "actor_governance_alpha",
        routeIntentTupleHash: buildRouteIntentTupleHash({
          actionScope: "close",
          governingObjectRef: "governance_case_071_lineage",
          canonicalObjectDescriptorRef: "GovernanceCase",
          routeIntentRef: "route_governance_close",
          routeContractDigestRef: "digest_governance_close_v1",
          parentAnchorRef: "anchor_governance_case_071_lineage",
          governingObjectVersionRef: "governance_case_071_lineage@v4",
          lineageScope: "request",
          requiredContextBoundaryRefs: [],
          actingContextRef: "governance_operator",
          initiatingBoundedContextRef: "governance_admin",
          governingBoundedContextRef: "governance_admin",
        }),
      });
    } catch {
      // Validation stays fail-closed for stale lineage scenarios.
    }
    return {
      scenarioId: "cross_domain_close_reopen_stale_lineage_epochs",
      title: "Close/reopen attempts race on stale lineage epochs.",
      leases: await repositories.listRequestLifecycleLeases(),
      recoveries: await repositories.listStaleOwnershipRecoveryRecords(),
      takeovers: await repositories.listLeaseTakeoverRecords(),
      fences: [closeFence, reopenFence],
      actions: await repositories.listCommandActionRecords(),
    };
  }

  private async runActionReuseAndSupersessionScenario(): Promise<LeaseFenceSimulationScenarioResult> {
    const repositories = createLeaseFenceCommandStore();
    await this.seedContext({
      repositories,
      requestId: "request_071_action",
      episodeId: "episode_071_action",
      requestLineageRef: "lineage_071_action",
    });
    const authority = createLeaseFenceCommandAuthorityService(
      repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_actions`),
    );
    const lease = await authority.acquireLease({
      requestId: "request_071_action",
      episodeId: "episode_071_action",
      requestLineageRef: "lineage_071_action",
      domain: "pharmacy",
      domainObjectRef: "pharmacy_case_071_action",
      leaseAuthorityRef: "lease_authority_pharmacy",
      ownerActorRef: "actor_pharmacy_alpha",
      ownerSessionRef: "session_pharmacy_alpha",
      governingObjectVersionRef: "pharmacy_case_071_action@v8",
      leaseScopeComponents: ["dispatch_update", "contact_repair"],
      leaseTtlSeconds: 240,
      acquiredAt: "2026-04-12T09:08:00Z",
      sameShellRecoveryRouteRef: "/pharmacy/cases/pharmacy_case_071_action/recover",
      operatorVisibleWorkRef: "work_071_action",
      blockedActionScopeRefs: ["dispatch_update"],
    });
    const exact = await authority.registerCommandAction({
      leaseId: lease.lease.leaseId,
      domain: "pharmacy",
      domainObjectRef: "pharmacy_case_071_action",
      governingObjectVersionRef: "pharmacy_case_071_action@v8",
      presentedOwnershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: lease.lease.toSnapshot().fencingToken,
      actionScope: "dispatch_update",
      governingObjectRef: "pharmacy_case_071_action",
      canonicalObjectDescriptorRef: "PharmacyCase",
      initiatingBoundedContextRef: "pharmacy",
      governingBoundedContextRef: "pharmacy",
      lineageScope: "request",
      routeIntentRef: "route_pharmacy_dispatch_update",
      routeContractDigestRef: "digest_pharmacy_dispatch_update_v1",
      requiredContextBoundaryRefs: [],
      parentAnchorRef: "anchor_pharmacy_case_071_action",
      edgeCorrelationId: "edge_pharmacy_dispatch_1",
      initiatingUiEventRef: "evt_pharmacy_dispatch_1",
      initiatingUiEventCausalityFrameRef: "evt_frame_pharmacy_dispatch_1",
      actingContextRef: "pharmacy_operator",
      policyBundleRef: "policy_pharmacy_v1",
      presentedLineageFenceEpoch: lease.lineageFence.currentEpoch,
      sourceCommandId: "cmd_pharmacy_dispatch",
      transportCorrelationId: "transport_pharmacy_dispatch_1",
      semanticPayload: { route: "sms", summaryTier: "quiet" },
      idempotencyKey: "idem_pharmacy_dispatch_1",
      idempotencyRecordRef: "idem_record_pharmacy_dispatch_1",
      commandFollowingTokenRef: "follow_pharmacy_dispatch_1",
      expectedEffectSetRefs: ["pharmacy.dispatch.updated"],
      causalToken: "cause_pharmacy_dispatch_1",
      createdAt: "2026-04-12T09:08:20Z",
      sameShellRecoveryRouteRef: "/pharmacy/cases/pharmacy_case_071_action/recover",
      operatorVisibleWorkRef: "work_071_action",
      blockedActionScopeRefs: ["dispatch_update"],
      detectedByRef: "actor_pharmacy_alpha",
    });
    const reused = await authority.registerCommandAction({
      ...exact.actionRecord.toSnapshot(),
      leaseId: lease.lease.leaseId,
      domain: "pharmacy",
      domainObjectRef: "pharmacy_case_071_action",
      governingObjectVersionRef: "pharmacy_case_071_action@v8",
      presentedOwnershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: lease.lease.toSnapshot().fencingToken,
      semanticPayload: { route: "sms", summaryTier: "quiet" },
      expectedEffectSetRefs: ["pharmacy.dispatch.updated"],
      presentedLineageFenceEpoch: lease.lineageFence.currentEpoch,
      sameShellRecoveryRouteRef: "/pharmacy/cases/pharmacy_case_071_action/recover",
      operatorVisibleWorkRef: "work_071_action",
      blockedActionScopeRefs: ["dispatch_update"],
      detectedByRef: "actor_pharmacy_alpha",
    });
    void reused;
    await authority.registerCommandAction({
      leaseId: lease.lease.leaseId,
      domain: "pharmacy",
      domainObjectRef: "pharmacy_case_071_action",
      governingObjectVersionRef: "pharmacy_case_071_action@v8",
      presentedOwnershipEpoch: lease.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: lease.lease.toSnapshot().fencingToken,
      actionScope: "dispatch_update",
      governingObjectRef: "pharmacy_case_071_action",
      canonicalObjectDescriptorRef: "PharmacyCase",
      initiatingBoundedContextRef: "pharmacy",
      governingBoundedContextRef: "pharmacy",
      lineageScope: "request",
      routeIntentRef: "route_pharmacy_dispatch_update",
      routeContractDigestRef: "digest_pharmacy_dispatch_update_v1",
      requiredContextBoundaryRefs: [],
      parentAnchorRef: "anchor_pharmacy_case_071_action",
      edgeCorrelationId: "edge_pharmacy_dispatch_2",
      initiatingUiEventRef: "evt_pharmacy_dispatch_2",
      initiatingUiEventCausalityFrameRef: "evt_frame_pharmacy_dispatch_2",
      actingContextRef: "pharmacy_operator",
      policyBundleRef: "policy_pharmacy_v1",
      presentedLineageFenceEpoch: lease.lineageFence.currentEpoch,
      sourceCommandId: "cmd_pharmacy_dispatch",
      transportCorrelationId: "transport_pharmacy_dispatch_2",
      semanticPayload: { route: "voice", summaryTier: "recovery" },
      idempotencyKey: "idem_pharmacy_dispatch_2",
      idempotencyRecordRef: "idem_record_pharmacy_dispatch_2",
      commandFollowingTokenRef: "follow_pharmacy_dispatch_2",
      expectedEffectSetRefs: ["pharmacy.dispatch.updated", "contact.repair.required"],
      causalToken: "cause_pharmacy_dispatch_2",
      createdAt: "2026-04-12T09:08:40Z",
      sameShellRecoveryRouteRef: "/pharmacy/cases/pharmacy_case_071_action/recover",
      operatorVisibleWorkRef: "work_071_action",
      blockedActionScopeRefs: ["dispatch_update"],
      detectedByRef: "actor_pharmacy_alpha",
    });
    return {
      scenarioId: "repeated_ui_actions_reuse_or_supersede",
      title: "Repeated UI actions reuse exact tuples and supersede changed tuples.",
      leases: await repositories.listRequestLifecycleLeases(),
      recoveries: await repositories.listStaleOwnershipRecoveryRecords(),
      takeovers: await repositories.listLeaseTakeoverRecords(),
      fences: await repositories.listLineageFences(),
      actions: await repositories.listCommandActionRecords(),
    };
  }
}

export function createLeaseFenceCommandSimulationHarness(
  authority: LeaseFenceCommandAuthorityService,
): LeaseFenceCommandSimulationHarness {
  void authority;
  return new LeaseFenceCommandSimulationHarness();
}

export function validateActionRecordReconstruction(
  actionRecord: CommandActionRecordDocument,
): void {
  const snapshot = actionRecord.toSnapshot();
  invariant(
    snapshot.governingObjectRef.length > 0 &&
      snapshot.routeIntentRef.length > 0 &&
      snapshot.routeContractDigestRef.length > 0 &&
      snapshot.parentAnchorRef.length > 0,
    "ACTION_RECONSTRUCTION_FIELDS_MISSING",
    "CommandActionRecord cannot reconstruct the exact governing target and route-intent tuple proven at write time.",
  );
}

export function validateLeaseLedgerState(input: {
  leases: readonly RequestLifecycleLeaseDocument[];
  recoveries: readonly StaleOwnershipRecoveryRecordDocument[];
  takeovers: readonly LeaseTakeoverRecordDocument[];
  fences: readonly LineageFenceDocument[];
  actions: readonly CommandActionRecordDocument[];
}): void {
  const activeByObject = new Map<string, RequestLifecycleLeaseDocument[]>();
  for (const lease of input.leases) {
    const snapshot = lease.toSnapshot();
    const key = authorityKey(snapshot.domain, snapshot.domainObjectRef);
    if (snapshot.state === "active") {
      const current = activeByObject.get(key) ?? [];
      current.push(lease);
      activeByObject.set(key, current);
    }
  }
  for (const [key, leases] of activeByObject.entries()) {
    invariant(
      leases.length <= 1,
      "MULTIPLE_ACTIVE_LEASES",
      `Only one active RequestLifecycleLease may own ${key} at a time.`,
    );
  }

  const openRecoveryByLease = new Map<string, number>();
  for (const recovery of input.recoveries) {
    const snapshot = recovery.toSnapshot();
    if (
      snapshot.resolutionState === "open" ||
      snapshot.resolutionState === "reacquire_in_progress" ||
      snapshot.resolutionState === "takeover_pending"
    ) {
      openRecoveryByLease.set(
        snapshot.leaseRef,
        (openRecoveryByLease.get(snapshot.leaseRef) ?? 0) + 1,
      );
    }
  }
  for (const [leaseRef, count] of openRecoveryByLease.entries()) {
    invariant(
      count === 1,
      "MULTIPLE_OPEN_STALE_OWNER_RECOVERIES",
      `Lease ${leaseRef} may only have one open stale-owner recovery record.`,
    );
  }

  const fenceEpochsByEpisode = new Map<string, number[]>();
  for (const fence of input.fences) {
    const snapshot = fence.toSnapshot();
    const current = fenceEpochsByEpisode.get(snapshot.episodeId) ?? [];
    current.push(snapshot.currentEpoch);
    fenceEpochsByEpisode.set(snapshot.episodeId, current);
  }
  for (const [episodeId, epochs] of fenceEpochsByEpisode.entries()) {
    const sorted = [...epochs].sort((left, right) => left - right);
    for (let index = 1; index < sorted.length; index += 1) {
      invariant(
        sorted[index]! > sorted[index - 1]!,
        "NON_MONOTONE_LINEAGE_EPOCH",
        `Episode ${episodeId} has non-monotone lineage fence epochs.`,
      );
    }
  }

  for (const action of input.actions) {
    validateActionRecordReconstruction(action);
  }

  for (const takeover of input.takeovers) {
    const snapshot = takeover.toSnapshot();
    if (snapshot.takeoverState === "committed") {
      invariant(
        snapshot.replacementLeaseRef !== null,
        "TAKEOVER_MISSING_REPLACEMENT_LEASE",
        "Committed LeaseTakeoverRecord must reference replacementLeaseRef.",
      );
    }
  }
}
