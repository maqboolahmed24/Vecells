import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  CommandActionRecordDocument,
  InMemoryLeaseFenceCommandStore,
  type LeaseFenceCommandDependencies,
} from "./lease-fence-command-backbone";

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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

function nextSettlementId(idGenerator: BackboneIdGenerator): string {
  return (idGenerator.nextId as unknown as (value: string) => string)("command_settlement_record");
}

function sourceCommandKey(input: {
  governingObjectRef: string;
  sourceCommandId: string;
  actionScope: string;
}): string {
  return `${requireRef(input.governingObjectRef, "governingObjectRef")}::${requireRef(input.sourceCommandId, "sourceCommandId")}::${requireRef(input.actionScope, "actionScope")}`;
}

export type ReplayDecisionClass =
  | "exact_replay"
  | "semantic_replay"
  | "distinct"
  | "collision_review";

export type CommandSettlementResult =
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

export type ProcessingAcceptanceState =
  | "not_started"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "externally_accepted"
  | "externally_rejected"
  | "timed_out";

export type ExternalObservationState =
  | "unobserved"
  | "projection_visible"
  | "external_effect_observed"
  | "review_disposition_observed"
  | "recovery_observed"
  | "disputed"
  | "failed"
  | "expired";

export type AuthoritativeOutcomeState =
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

export type AuthoritativeProofClass =
  | "not_yet_authoritative"
  | "projection_visible"
  | "external_confirmation"
  | "review_disposition"
  | "recovery_disposition";

export interface CommandSettlementRecordSnapshot {
  settlementId: string;
  actionRecordRef: string;
  replayDecisionClass: ReplayDecisionClass;
  result: CommandSettlementResult;
  processingAcceptanceState: ProcessingAcceptanceState;
  externalObservationState: ExternalObservationState;
  authoritativeOutcomeState: AuthoritativeOutcomeState;
  authoritativeProofClass: AuthoritativeProofClass;
  settlementRevision: number;
  supersedesSettlementRef: string | null;
  externalEffectRefs: readonly string[];
  sameShellRecoveryRef: string | null;
  projectionVersionRef: string | null;
  uiTransitionSettlementRef: string | null;
  projectionVisibilityRef: string | null;
  auditRecordRef: string | null;
  blockingRefs: readonly string[];
  quietEligibleAt: string | null;
  staleAfterAt: string | null;
  lastSafeAnchorRef: string | null;
  allowedSummaryTier: string | null;
  recordedAt: string;
  version: number;
}

export interface PersistedCommandSettlementRecordRow extends CommandSettlementRecordSnapshot {
  aggregateType: "CommandSettlementRecord";
  persistenceSchemaVersion: 1;
}

function isRecoverableResult(result: CommandSettlementResult): boolean {
  return (
    result === "stale_recoverable" ||
    result === "blocked_policy" ||
    result === "denied_scope" ||
    result === "expired"
  );
}

function normalizeCommandSettlementRecord(
  snapshot: CommandSettlementRecordSnapshot,
): CommandSettlementRecordSnapshot {
  ensurePositiveInteger(snapshot.version, "version");
  ensurePositiveInteger(snapshot.settlementRevision, "settlementRevision");
  const normalized = {
    ...snapshot,
    settlementId: requireRef(snapshot.settlementId, "settlementId"),
    actionRecordRef: requireRef(snapshot.actionRecordRef, "actionRecordRef"),
    supersedesSettlementRef: optionalRef(snapshot.supersedesSettlementRef),
    externalEffectRefs: uniqueSortedRefs(snapshot.externalEffectRefs),
    sameShellRecoveryRef: optionalRef(snapshot.sameShellRecoveryRef),
    projectionVersionRef: optionalRef(snapshot.projectionVersionRef),
    uiTransitionSettlementRef: optionalRef(snapshot.uiTransitionSettlementRef),
    projectionVisibilityRef: optionalRef(snapshot.projectionVisibilityRef),
    auditRecordRef: optionalRef(snapshot.auditRecordRef),
    blockingRefs: uniqueSortedRefs(snapshot.blockingRefs),
    quietEligibleAt: snapshot.quietEligibleAt
      ? ensureIsoTimestamp(snapshot.quietEligibleAt, "quietEligibleAt")
      : null,
    staleAfterAt: snapshot.staleAfterAt
      ? ensureIsoTimestamp(snapshot.staleAfterAt, "staleAfterAt")
      : null,
    lastSafeAnchorRef: optionalRef(snapshot.lastSafeAnchorRef),
    allowedSummaryTier: optionalRef(snapshot.allowedSummaryTier),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
  };

  if (normalized.authoritativeOutcomeState === "settled") {
    invariant(
      normalized.authoritativeProofClass !== "not_yet_authoritative",
      "SETTLED_OUTCOME_REQUIRES_PROOF",
      "Settled outcomes require an authoritative proof class.",
    );
    invariant(
      normalized.quietEligibleAt !== null,
      "SETTLED_OUTCOME_REQUIRES_QUIET_ELIGIBILITY",
      "Settled outcomes must publish quietEligibleAt before calm return is legal.",
    );
    invariant(
      normalized.auditRecordRef !== null,
      "SETTLED_OUTCOME_REQUIRES_AUDIT_RECORD",
      "Settled outcomes must point to an audit record before quiet return is legal.",
    );
    if (normalized.authoritativeProofClass === "projection_visible") {
      invariant(
        normalized.projectionVisibilityRef !== null,
        "SETTLED_PROJECTION_PROOF_REQUIRES_VISIBILITY_REF",
        "Projection-visible proof requires projectionVisibilityRef.",
      );
    }
    if (normalized.authoritativeProofClass === "external_confirmation") {
      invariant(
        normalized.externalEffectRefs.length > 0,
        "SETTLED_EXTERNAL_PROOF_REQUIRES_EFFECT_REFS",
        "External confirmation proof requires at least one externalEffectRef.",
      );
    }
  } else {
    invariant(
      normalized.quietEligibleAt === null,
      "NON_SETTLED_OUTCOME_CANNOT_BE_QUIET",
      "quietEligibleAt is illegal before authoritativeOutcomeState = settled.",
    );
  }

  if (isRecoverableResult(normalized.result)) {
    invariant(
      normalized.sameShellRecoveryRef !== null,
      "RECOVERABLE_SETTLEMENT_REQUIRES_SAME_SHELL_RECOVERY",
      "Recoverable results must carry sameShellRecoveryRef.",
    );
    invariant(
      normalized.lastSafeAnchorRef !== null,
      "RECOVERABLE_SETTLEMENT_REQUIRES_LAST_SAFE_ANCHOR",
      "Recoverable results must preserve lastSafeAnchorRef.",
    );
    invariant(
      normalized.allowedSummaryTier !== null,
      "RECOVERABLE_SETTLEMENT_REQUIRES_SUMMARY_TIER",
      "Recoverable results must preserve allowedSummaryTier.",
    );
  }

  return normalized;
}

export class CommandSettlementRecordDocument {
  private readonly snapshot: CommandSettlementRecordSnapshot;

  private constructor(snapshot: CommandSettlementRecordSnapshot) {
    this.snapshot = normalizeCommandSettlementRecord(snapshot);
  }

  static create(
    input: Omit<CommandSettlementRecordSnapshot, "version">,
  ): CommandSettlementRecordDocument {
    return new CommandSettlementRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: CommandSettlementRecordSnapshot): CommandSettlementRecordDocument {
    return new CommandSettlementRecordDocument(snapshot);
  }

  get settlementId(): string {
    return this.snapshot.settlementId;
  }

  get actionRecordRef(): string {
    return this.snapshot.actionRecordRef;
  }

  get settlementRevision(): number {
    return this.snapshot.settlementRevision;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): CommandSettlementRecordSnapshot {
    return {
      ...this.snapshot,
    };
  }
}

export interface CommandSettlementRecordRepository {
  getCommandSettlementRecord(
    settlementId: string,
  ): Promise<CommandSettlementRecordDocument | undefined>;
  saveCommandSettlementRecord(
    settlement: CommandSettlementRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listCommandSettlementRecords(): Promise<readonly CommandSettlementRecordDocument[]>;
  findLatestCommandSettlementForAction(
    actionRecordRef: string,
  ): Promise<CommandSettlementRecordDocument | undefined>;
}

export interface CommandSettlementDependencies
  extends LeaseFenceCommandDependencies,
    CommandSettlementRecordRepository {}

export class InMemoryCommandSettlementStore
  extends InMemoryLeaseFenceCommandStore
  implements CommandSettlementDependencies
{
  private readonly settlements = new Map<string, PersistedCommandSettlementRecordRow>();
  private readonly latestSettlementByAction = new Map<string, string>();

  async getCommandSettlementRecord(
    settlementId: string,
  ): Promise<CommandSettlementRecordDocument | undefined> {
    const row = this.settlements.get(settlementId);
    return row ? CommandSettlementRecordDocument.hydrate(row) : undefined;
  }

  async saveCommandSettlementRecord(
    settlement: CommandSettlementRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = settlement.toSnapshot();
    saveWithCas(
      this.settlements,
      row.settlementId,
      {
        ...row,
        aggregateType: "CommandSettlementRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    const latestId = this.latestSettlementByAction.get(row.actionRecordRef);
    if (!latestId) {
      this.latestSettlementByAction.set(row.actionRecordRef, row.settlementId);
      return;
    }
    const latest = this.settlements.get(latestId);
    if (
      !latest ||
      latest.settlementRevision < row.settlementRevision ||
      (latest.settlementRevision === row.settlementRevision &&
        compareIso(latest.recordedAt, row.recordedAt) <= 0)
    ) {
      this.latestSettlementByAction.set(row.actionRecordRef, row.settlementId);
    }
  }

  async listCommandSettlementRecords(): Promise<readonly CommandSettlementRecordDocument[]> {
    return [...this.settlements.values()]
      .sort(
        (left, right) =>
          left.settlementRevision - right.settlementRevision ||
          compareIso(left.recordedAt, right.recordedAt),
      )
      .map((row) => CommandSettlementRecordDocument.hydrate(row));
  }

  async findLatestCommandSettlementForAction(
    actionRecordRef: string,
  ): Promise<CommandSettlementRecordDocument | undefined> {
    const settlementId = this.latestSettlementByAction.get(actionRecordRef);
    if (!settlementId) {
      return undefined;
    }
    const row = this.settlements.get(settlementId);
    return row ? CommandSettlementRecordDocument.hydrate(row) : undefined;
  }
}

export function createCommandSettlementStore(): CommandSettlementDependencies {
  return new InMemoryCommandSettlementStore();
}

export interface RecordCommandSettlementInput {
  actionRecordRef: string;
  replayDecisionClass: ReplayDecisionClass;
  result: CommandSettlementResult;
  processingAcceptanceState: ProcessingAcceptanceState;
  externalObservationState: ExternalObservationState;
  authoritativeOutcomeState: AuthoritativeOutcomeState;
  authoritativeProofClass: AuthoritativeProofClass;
  externalEffectRefs?: readonly string[];
  sameShellRecoveryRef?: string | null;
  projectionVersionRef?: string | null;
  uiTransitionSettlementRef?: string | null;
  projectionVisibilityRef?: string | null;
  auditRecordRef?: string | null;
  blockingRefs?: readonly string[];
  quietEligibleAt?: string | null;
  staleAfterAt?: string | null;
  lastSafeAnchorRef?: string | null;
  allowedSummaryTier?: string | null;
  recordedAt: string;
}

export interface RecordCommandSettlementResult {
  settlement: CommandSettlementRecordDocument;
  priorSettlement: CommandSettlementRecordDocument | null;
  actionRecord: CommandActionRecordDocument;
}

function requiresRecoveryDisposition(input: {
  result: CommandSettlementResult;
  authoritativeOutcomeState: AuthoritativeOutcomeState;
}): boolean {
  return (
    isRecoverableResult(input.result) ||
    input.authoritativeOutcomeState === "recovery_required" ||
    input.authoritativeOutcomeState === "stale_recoverable"
  );
}

function shouldRejectDriftedSettlementAdvance(input: {
  latestAction: CommandActionRecordDocument;
  targetAction: CommandActionRecordDocument;
  result: CommandSettlementResult;
  authoritativeOutcomeState: AuthoritativeOutcomeState;
}): boolean {
  if (input.latestAction.actionRecordId === input.targetAction.actionRecordId) {
    return false;
  }
  return !requiresRecoveryDisposition({
    result: input.result,
    authoritativeOutcomeState: input.authoritativeOutcomeState,
  });
}

export class CommandSettlementAuthorityService {
  constructor(
    private readonly repositories: CommandSettlementDependencies,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async recordSettlement(
    input: RecordCommandSettlementInput,
  ): Promise<RecordCommandSettlementResult> {
    return this.repositories.withControlPlaneBoundary(async () => {
      const actionRecord = await this.repositories.getCommandActionRecord(input.actionRecordRef);
      invariant(
        actionRecord,
        "UNKNOWN_ACTION_RECORD",
        `CommandActionRecord ${input.actionRecordRef} is required before settlement can be recorded.`,
      );

      const sourceKey = sourceCommandKey({
        governingObjectRef: actionRecord.toSnapshot().governingObjectRef,
        sourceCommandId: actionRecord.toSnapshot().sourceCommandId,
        actionScope: actionRecord.toSnapshot().actionScope,
      });
      const latestAction =
        await this.repositories.findLatestCommandActionRecordForSourceCommand(sourceKey);
      invariant(latestAction, "MISSING_SOURCE_ACTION_HEAD", "Source action head is required.");
      invariant(
        !shouldRejectDriftedSettlementAdvance({
          latestAction,
          targetAction: actionRecord,
          result: input.result,
          authoritativeOutcomeState: input.authoritativeOutcomeState,
        }),
        "SETTLEMENT_DRIFT_REQUIRES_NEW_ACTION_CHAIN",
        "Tuple or governing-version drift requires a new CommandActionRecord instead of appending settlement to the stale chain.",
      );

      const priorSettlement = await this.repositories.findLatestCommandSettlementForAction(
        input.actionRecordRef,
      );
      const settlementRevision = priorSettlement ? priorSettlement.settlementRevision + 1 : 1;
      const settlement = CommandSettlementRecordDocument.create({
        settlementId: nextSettlementId(this.idGenerator),
        actionRecordRef: input.actionRecordRef,
        replayDecisionClass: input.replayDecisionClass,
        result: input.result,
        processingAcceptanceState: input.processingAcceptanceState,
        externalObservationState: input.externalObservationState,
        authoritativeOutcomeState: input.authoritativeOutcomeState,
        authoritativeProofClass: input.authoritativeProofClass,
        settlementRevision,
        supersedesSettlementRef: priorSettlement?.settlementId ?? null,
        externalEffectRefs: input.externalEffectRefs ?? [],
        sameShellRecoveryRef: input.sameShellRecoveryRef ?? null,
        projectionVersionRef: input.projectionVersionRef ?? null,
        uiTransitionSettlementRef: input.uiTransitionSettlementRef ?? null,
        projectionVisibilityRef: input.projectionVisibilityRef ?? null,
        auditRecordRef: input.auditRecordRef ?? null,
        blockingRefs: input.blockingRefs ?? [],
        quietEligibleAt: input.quietEligibleAt ?? null,
        staleAfterAt: input.staleAfterAt ?? null,
        lastSafeAnchorRef: input.lastSafeAnchorRef ?? null,
        allowedSummaryTier: input.allowedSummaryTier ?? null,
        recordedAt: input.recordedAt,
      });

      await this.repositories.saveCommandSettlementRecord(settlement);
      return {
        settlement,
        priorSettlement: priorSettlement ?? null,
        actionRecord,
      };
    });
  }
}

export function createCommandSettlementAuthorityService(
  repositories: CommandSettlementDependencies,
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "command_settlement_authority",
  ),
): CommandSettlementAuthorityService {
  return new CommandSettlementAuthorityService(repositories, idGenerator);
}

export function validateCommandSettlementRevisionChain(
  settlements: readonly CommandSettlementRecordDocument[],
): void {
  const byAction = new Map<string, CommandSettlementRecordSnapshot[]>();
  for (const settlement of settlements) {
    const snapshot = settlement.toSnapshot();
    const bucket = byAction.get(snapshot.actionRecordRef) ?? [];
    bucket.push(snapshot);
    byAction.set(snapshot.actionRecordRef, bucket);
  }

  for (const [actionRecordRef, chain] of byAction.entries()) {
    const ordered = [...chain].sort(
      (left, right) => left.settlementRevision - right.settlementRevision,
    );
    let previous: CommandSettlementRecordSnapshot | null = null;
    for (const settlement of ordered) {
      if (!previous) {
        invariant(
          settlement.settlementRevision === 1,
          "SETTLEMENT_CHAIN_MUST_START_AT_ONE",
          `Settlement chain for ${actionRecordRef} must start at revision 1.`,
        );
      } else {
        invariant(
          settlement.settlementRevision === previous.settlementRevision + 1,
          "SETTLEMENT_REVISION_GAP",
          `Settlement chain for ${actionRecordRef} skipped a revision.`,
        );
        invariant(
          settlement.supersedesSettlementRef === previous.settlementId,
          "SETTLEMENT_SUPERSESSION_DRIFT",
          `Settlement chain for ${actionRecordRef} must supersede the immediately prior revision.`,
        );
      }
      previous = settlement;
    }
  }
}

export function validateCommandSettlementAgainstActionRecords(input: {
  settlements: readonly CommandSettlementRecordDocument[];
  actions: readonly CommandActionRecordDocument[];
}): void {
  const actionsById = new Map(
    input.actions.map((action) => [action.toSnapshot().actionRecordId, action.toSnapshot()]),
  );

  for (const settlement of input.settlements) {
    const snapshot = settlement.toSnapshot();
    const action = actionsById.get(snapshot.actionRecordRef);
    invariant(
      action,
      "SETTLEMENT_ACTION_MISSING",
      `Settlement ${snapshot.settlementId} references an unknown CommandActionRecord.`,
    );
    if (snapshot.authoritativeOutcomeState === "settled") {
      invariant(
        snapshot.replayDecisionClass === "distinct" ||
          snapshot.replayDecisionClass === "exact_replay",
        "SETTLED_OUTCOME_REQUIRES_NON_COLLISION_REPLAY_CLASS",
        "Settled outcomes cannot emerge from unresolved collision review.",
      );
    }
    const driftFingerprint = sha256Hex(
      stableStringify({
        actionRecordRef: action.actionRecordId,
        governingObjectVersionRef: action.governingObjectVersionRef,
        routeIntentTupleHash: action.routeIntentTupleHash,
      }),
    );
    invariant(
      driftFingerprint.length === 64,
      "SETTLEMENT_ACTION_FINGERPRINT_DRIFT",
      `Settlement ${snapshot.settlementId} failed to reconstruct the authoritative action tuple.`,
    );
  }
}

export function validateCommandSettlementCalmReturnLaw(
  settlements: readonly CommandSettlementRecordDocument[],
): void {
  for (const settlement of settlements) {
    const snapshot = settlement.toSnapshot();
    if (snapshot.authoritativeOutcomeState === "settled") {
      invariant(
        snapshot.quietEligibleAt !== null,
        "SETTLED_OUTCOME_MISSING_QUIET_ELIGIBILITY",
        `Settlement ${snapshot.settlementId} cannot return to calm without quietEligibleAt.`,
      );
      invariant(
        snapshot.authoritativeProofClass !== "not_yet_authoritative",
        "SETTLED_OUTCOME_MISSING_PROOF_CLASS",
        `Settlement ${snapshot.settlementId} cannot return to calm without authoritative proof.`,
      );
    } else {
      invariant(
        snapshot.quietEligibleAt === null,
        "NON_SETTLED_OUTCOME_EXPOSED_AS_QUIET",
        `Settlement ${snapshot.settlementId} exposed calm-return timing before authoritative settlement.`,
      );
    }
  }
}
