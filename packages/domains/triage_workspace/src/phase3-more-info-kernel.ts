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

function ensureUtcHour(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0 && value <= 23,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be an integer between 0 and 23.`,
  );
  return value;
}

function ensureIntegerMinutes(values: readonly number[], field: string): number[] {
  const normalized = [...new Set(values)].sort((left, right) => left - right);
  normalized.forEach((value, index) => {
    invariant(
      Number.isInteger(value) && value >= 0,
      `INVALID_${field.toUpperCase()}_${index}`,
      `${field}[${index}] must be a non-negative integer.`,
    );
  });
  return normalized;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function addMinutes(isoTimestamp: string, minutes: number): string {
  return new Date(Date.parse(isoTimestamp) + minutes * 60_000).toISOString();
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

function nextMoreInfoId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
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

export type MoreInfoCycleState =
  | "draft"
  | "awaiting_delivery"
  | "awaiting_patient_reply"
  | "awaiting_late_review"
  | "response_received"
  | "review_resumed"
  | "expired"
  | "superseded"
  | "cancelled";

export type MoreInfoReplyWindowState =
  | "open"
  | "reminder_due"
  | "late_review"
  | "expired"
  | "superseded"
  | "settled"
  | "blocked_repair";

export type MoreInfoReminderScheduleState =
  | "scheduled"
  | "suppressed"
  | "exhausted"
  | "completed"
  | "cancelled";

export type MoreInfoResponseClassification =
  | "accepted_on_time"
  | "accepted_late_review"
  | "superseded_duplicate"
  | "expired_rejected"
  | "blocked_repair";

export type MoreInfoCallbackFallbackState = "not_eligible" | "eligible" | "seeded";

const cycleStates: readonly MoreInfoCycleState[] = [
  "draft",
  "awaiting_delivery",
  "awaiting_patient_reply",
  "awaiting_late_review",
  "response_received",
  "review_resumed",
  "expired",
  "superseded",
  "cancelled",
];

const replyWindowStates: readonly MoreInfoReplyWindowState[] = [
  "open",
  "reminder_due",
  "late_review",
  "expired",
  "superseded",
  "settled",
  "blocked_repair",
];

const scheduleStates: readonly MoreInfoReminderScheduleState[] = [
  "scheduled",
  "suppressed",
  "exhausted",
  "completed",
  "cancelled",
];

const callbackFallbackStates: readonly MoreInfoCallbackFallbackState[] = [
  "not_eligible",
  "eligible",
  "seeded",
];

export interface MoreInfoQuietHoursWindow {
  readonly policyRef: string;
  readonly startHourUtc: number;
  readonly endHourUtc: number;
}

export interface MoreInfoCycleSnapshot {
  cycleId: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  state: MoreInfoCycleState;
  promptSetRef: string;
  channelRef: string;
  responseRouteFamilyRef: string;
  dueAt: string;
  lateReviewStartsAt: string;
  expiresAt: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  activeCheckpointRef: string;
  reminderScheduleRef: string;
  responseGrantRef: string | null;
  responseGrantExpiresAt: string | null;
  supersedesCycleRef: string | null;
  supersededByCycleRef: string | null;
  latestResponseClassification: MoreInfoResponseClassification | null;
  responseReceivedAt: string | null;
  callbackFallbackSeedRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MoreInfoReplyWindowCheckpointSnapshot {
  checkpointId: string;
  cycleId: string;
  requestId: string;
  requestLineageRef: string;
  checkpointRevision: number;
  replyWindowState: MoreInfoReplyWindowState;
  opensAt: string;
  dueAt: string;
  lateReviewStartsAt: string;
  expiresAt: string;
  nextReminderDueAt: string | null;
  grantNarrowingExpiresAt: string | null;
  repairRequiredReasonRef: string | null;
  settledAt: string | null;
  supersededAt: string | null;
  currentLineageFenceEpoch: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MoreInfoReminderScheduleSnapshot {
  scheduleId: string;
  cycleId: string;
  checkpointRef: string;
  scheduleState: MoreInfoReminderScheduleState;
  cadencePolicyRef: string;
  reminderOffsetsMinutes: readonly number[];
  maxReminderCount: number;
  dispatchedReminderCount: number;
  quietHoursPolicyRef: string | null;
  quietHoursWindow: MoreInfoQuietHoursWindow | null;
  lastReminderSentAt: string | null;
  nextQuietHoursReleaseAt: string | null;
  suppressedReasonRef: string | null;
  callbackFallbackState: MoreInfoCallbackFallbackState;
  callbackFallbackSeedRef: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedMoreInfoCycleRow extends MoreInfoCycleSnapshot {
  aggregateType: "MoreInfoCycle";
  persistenceSchemaVersion: 1;
}

export interface PersistedMoreInfoReplyWindowCheckpointRow
  extends MoreInfoReplyWindowCheckpointSnapshot {
  aggregateType: "MoreInfoReplyWindowCheckpoint";
  persistenceSchemaVersion: 1;
}

export interface PersistedMoreInfoReminderScheduleRow extends MoreInfoReminderScheduleSnapshot {
  aggregateType: "MoreInfoReminderSchedule";
  persistenceSchemaVersion: 1;
}

function isCycleTerminal(state: MoreInfoCycleState): boolean {
  return (
    state === "review_resumed" ||
    state === "expired" ||
    state === "superseded" ||
    state === "cancelled"
  );
}

function isCheckpointTerminal(state: MoreInfoReplyWindowState): boolean {
  return state === "expired" || state === "superseded" || state === "settled";
}

function normalizeQuietHoursWindow(
  quietHoursWindow: MoreInfoQuietHoursWindow | null | undefined,
): MoreInfoQuietHoursWindow | null {
  if (!quietHoursWindow) {
    return null;
  }
  return {
    policyRef: requireRef(quietHoursWindow.policyRef, "policyRef"),
    startHourUtc: ensureUtcHour(quietHoursWindow.startHourUtc, "startHourUtc"),
    endHourUtc: ensureUtcHour(quietHoursWindow.endHourUtc, "endHourUtc"),
  };
}

function inQuietHours(isoTimestamp: string, quietHoursWindow: MoreInfoQuietHoursWindow): boolean {
  const date = new Date(isoTimestamp);
  const hour = date.getUTCHours();
  if (quietHoursWindow.startHourUtc === quietHoursWindow.endHourUtc) {
    return false;
  }
  if (quietHoursWindow.startHourUtc < quietHoursWindow.endHourUtc) {
    return hour >= quietHoursWindow.startHourUtc && hour < quietHoursWindow.endHourUtc;
  }
  return hour >= quietHoursWindow.startHourUtc || hour < quietHoursWindow.endHourUtc;
}

export function resolveQuietHoursReleaseAt(input: {
  evaluatedAt: string;
  quietHoursWindow: MoreInfoQuietHoursWindow;
}): string {
  const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
  const quietHoursWindow = normalizeQuietHoursWindow(input.quietHoursWindow)!;
  if (!inQuietHours(evaluatedAt, quietHoursWindow)) {
    return evaluatedAt;
  }
  const current = new Date(evaluatedAt);
  const release = new Date(current);
  release.setUTCMinutes(0, 0, 0);
  if (quietHoursWindow.startHourUtc < quietHoursWindow.endHourUtc) {
    release.setUTCHours(quietHoursWindow.endHourUtc, 0, 0, 0);
    if (release <= current) {
      release.setUTCDate(release.getUTCDate() + 1);
    }
    return release.toISOString();
  }
  if (current.getUTCHours() >= quietHoursWindow.startHourUtc) {
    release.setUTCDate(release.getUTCDate() + 1);
  }
  release.setUTCHours(quietHoursWindow.endHourUtc, 0, 0, 0);
  return release.toISOString();
}

export function resolveReplyWindowState(input: {
  checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
  evaluatedAt: string;
  repairBlocked: boolean;
}): MoreInfoReplyWindowState {
  const checkpoint = MoreInfoReplyWindowCheckpointDocument.hydrate(input.checkpoint).toSnapshot();
  const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
  if (checkpoint.replyWindowState === "superseded" || checkpoint.replyWindowState === "settled") {
    return checkpoint.replyWindowState;
  }
  if (compareIso(evaluatedAt, checkpoint.expiresAt) >= 0) {
    return "expired";
  }
  if (input.repairBlocked) {
    return "blocked_repair";
  }
  if (compareIso(evaluatedAt, checkpoint.lateReviewStartsAt) >= 0) {
    return "late_review";
  }
  if (
    checkpoint.nextReminderDueAt !== null &&
    compareIso(evaluatedAt, checkpoint.nextReminderDueAt) >= 0
  ) {
    return "reminder_due";
  }
  return "open";
}

export function deriveCycleStateFromCheckpoint(input: {
  cycle: MoreInfoCycleSnapshot;
  checkpointState: MoreInfoReplyWindowState;
}): MoreInfoCycleState {
  const cycle = MoreInfoCycleDocument.hydrate(input.cycle).toSnapshot();
  if (isCycleTerminal(cycle.state) || cycle.state === "response_received") {
    return cycle.state;
  }
  if (input.checkpointState === "expired") {
    return "expired";
  }
  if (input.checkpointState === "late_review") {
    return "awaiting_late_review";
  }
  if (input.checkpointState === "open" || input.checkpointState === "reminder_due") {
    return cycle.state === "awaiting_delivery" ? "awaiting_delivery" : "awaiting_patient_reply";
  }
  if (input.checkpointState === "blocked_repair") {
    return "awaiting_patient_reply";
  }
  return cycle.state;
}

function computeNextReminderDueAt(input: {
  createdAt: string;
  reminderOffsetsMinutes: readonly number[];
  dispatchedReminderCount: number;
  dueAt: string;
}): string | null {
  const nextOffset = input.reminderOffsetsMinutes[input.dispatchedReminderCount];
  if (nextOffset === undefined) {
    return null;
  }
  const nextDueAt = addMinutes(input.createdAt, nextOffset);
  return compareIso(nextDueAt, input.dueAt) < 0 ? nextDueAt : null;
}

export class MoreInfoCycleDocument {
  private readonly snapshot: MoreInfoCycleSnapshot;

  private constructor(snapshot: MoreInfoCycleSnapshot) {
    this.snapshot = MoreInfoCycleDocument.normalize(snapshot);
  }

  static create(input: Omit<MoreInfoCycleSnapshot, "version">): MoreInfoCycleDocument {
    return new MoreInfoCycleDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: MoreInfoCycleSnapshot): MoreInfoCycleDocument {
    return new MoreInfoCycleDocument(snapshot);
  }

  static normalize(snapshot: MoreInfoCycleSnapshot): MoreInfoCycleSnapshot {
    ensureNonNegativeInteger(snapshot.ownershipEpoch, "ownershipEpoch");
    ensureNonNegativeInteger(snapshot.currentLineageFenceEpoch, "currentLineageFenceEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      cycleStates.includes(snapshot.state),
      "INVALID_MORE_INFO_CYCLE_STATE",
      "Unsupported MoreInfoCycle.state.",
    );
    const normalized = {
      ...snapshot,
      cycleId: requireRef(snapshot.cycleId, "cycleId"),
      taskId: requireRef(snapshot.taskId, "taskId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      promptSetRef: requireRef(snapshot.promptSetRef, "promptSetRef"),
      channelRef: requireRef(snapshot.channelRef, "channelRef"),
      responseRouteFamilyRef: requireRef(snapshot.responseRouteFamilyRef, "responseRouteFamilyRef"),
      dueAt: ensureIsoTimestamp(snapshot.dueAt, "dueAt"),
      lateReviewStartsAt: ensureIsoTimestamp(snapshot.lateReviewStartsAt, "lateReviewStartsAt"),
      expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
      lifecycleLeaseRef: requireRef(snapshot.lifecycleLeaseRef, "lifecycleLeaseRef"),
      leaseAuthorityRef: requireRef(snapshot.leaseAuthorityRef, "leaseAuthorityRef"),
      fencingToken: requireRef(snapshot.fencingToken, "fencingToken"),
      activeCheckpointRef: requireRef(snapshot.activeCheckpointRef, "activeCheckpointRef"),
      reminderScheduleRef: requireRef(snapshot.reminderScheduleRef, "reminderScheduleRef"),
      responseGrantRef: optionalRef(snapshot.responseGrantRef),
      responseGrantExpiresAt: snapshot.responseGrantExpiresAt
        ? ensureIsoTimestamp(snapshot.responseGrantExpiresAt, "responseGrantExpiresAt")
        : null,
      supersedesCycleRef: optionalRef(snapshot.supersedesCycleRef),
      supersededByCycleRef: optionalRef(snapshot.supersededByCycleRef),
      latestResponseClassification: snapshot.latestResponseClassification ?? null,
      responseReceivedAt: snapshot.responseReceivedAt
        ? ensureIsoTimestamp(snapshot.responseReceivedAt, "responseReceivedAt")
        : null,
      callbackFallbackSeedRef: optionalRef(snapshot.callbackFallbackSeedRef),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
    invariant(
      compareIso(normalized.createdAt, normalized.dueAt) < 0,
      "MORE_INFO_DUE_AT_INVALID",
      "MoreInfoCycle.dueAt must be after createdAt.",
    );
    invariant(
      compareIso(normalized.dueAt, normalized.lateReviewStartsAt) <= 0,
      "MORE_INFO_LATE_REVIEW_INVALID",
      "MoreInfoCycle.lateReviewStartsAt must be on or after dueAt.",
    );
    invariant(
      compareIso(normalized.lateReviewStartsAt, normalized.expiresAt) < 0,
      "MORE_INFO_EXPIRY_INVALID",
      "MoreInfoCycle.expiresAt must be after lateReviewStartsAt.",
    );
    return normalized;
  }

  get cycleId(): string {
    return this.snapshot.cycleId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): MoreInfoCycleSnapshot {
    return { ...this.snapshot };
  }

  update(changes: Partial<MoreInfoCycleSnapshot>): MoreInfoCycleDocument {
    return new MoreInfoCycleDocument({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export class MoreInfoReplyWindowCheckpointDocument {
  private readonly snapshot: MoreInfoReplyWindowCheckpointSnapshot;

  private constructor(snapshot: MoreInfoReplyWindowCheckpointSnapshot) {
    this.snapshot = MoreInfoReplyWindowCheckpointDocument.normalize(snapshot);
  }

  static create(
    input: Omit<MoreInfoReplyWindowCheckpointSnapshot, "version">,
  ): MoreInfoReplyWindowCheckpointDocument {
    return new MoreInfoReplyWindowCheckpointDocument({ ...input, version: 1 });
  }

  static hydrate(
    snapshot: MoreInfoReplyWindowCheckpointSnapshot,
  ): MoreInfoReplyWindowCheckpointDocument {
    return new MoreInfoReplyWindowCheckpointDocument(snapshot);
  }

  static normalize(
    snapshot: MoreInfoReplyWindowCheckpointSnapshot,
  ): MoreInfoReplyWindowCheckpointSnapshot {
    ensurePositiveInteger(snapshot.checkpointRevision, "checkpointRevision");
    ensureNonNegativeInteger(snapshot.currentLineageFenceEpoch, "currentLineageFenceEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      replyWindowStates.includes(snapshot.replyWindowState),
      "INVALID_MORE_INFO_REPLY_WINDOW_STATE",
      "Unsupported MoreInfoReplyWindowCheckpoint.replyWindowState.",
    );
    const normalized = {
      ...snapshot,
      checkpointId: requireRef(snapshot.checkpointId, "checkpointId"),
      cycleId: requireRef(snapshot.cycleId, "cycleId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      opensAt: ensureIsoTimestamp(snapshot.opensAt, "opensAt"),
      dueAt: ensureIsoTimestamp(snapshot.dueAt, "dueAt"),
      lateReviewStartsAt: ensureIsoTimestamp(snapshot.lateReviewStartsAt, "lateReviewStartsAt"),
      expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
      nextReminderDueAt: snapshot.nextReminderDueAt
        ? ensureIsoTimestamp(snapshot.nextReminderDueAt, "nextReminderDueAt")
        : null,
      grantNarrowingExpiresAt: snapshot.grantNarrowingExpiresAt
        ? ensureIsoTimestamp(snapshot.grantNarrowingExpiresAt, "grantNarrowingExpiresAt")
        : null,
      repairRequiredReasonRef: optionalRef(snapshot.repairRequiredReasonRef),
      settledAt: snapshot.settledAt ? ensureIsoTimestamp(snapshot.settledAt, "settledAt") : null,
      supersededAt: snapshot.supersededAt
        ? ensureIsoTimestamp(snapshot.supersededAt, "supersededAt")
        : null,
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
    invariant(
      compareIso(normalized.opensAt, normalized.dueAt) < 0,
      "CHECKPOINT_DUE_AT_INVALID",
      "MoreInfoReplyWindowCheckpoint.dueAt must be after opensAt.",
    );
    invariant(
      compareIso(normalized.dueAt, normalized.lateReviewStartsAt) <= 0,
      "CHECKPOINT_LATE_REVIEW_INVALID",
      "MoreInfoReplyWindowCheckpoint.lateReviewStartsAt must be on or after dueAt.",
    );
    invariant(
      compareIso(normalized.lateReviewStartsAt, normalized.expiresAt) < 0,
      "CHECKPOINT_EXPIRES_AT_INVALID",
      "MoreInfoReplyWindowCheckpoint.expiresAt must be after lateReviewStartsAt.",
    );
    return normalized;
  }

  get checkpointId(): string {
    return this.snapshot.checkpointId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): MoreInfoReplyWindowCheckpointSnapshot {
    return { ...this.snapshot };
  }

  update(
    changes: Partial<MoreInfoReplyWindowCheckpointSnapshot>,
  ): MoreInfoReplyWindowCheckpointDocument {
    return new MoreInfoReplyWindowCheckpointDocument({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export class MoreInfoReminderScheduleDocument {
  private readonly snapshot: MoreInfoReminderScheduleSnapshot;

  private constructor(snapshot: MoreInfoReminderScheduleSnapshot) {
    this.snapshot = MoreInfoReminderScheduleDocument.normalize(snapshot);
  }

  static create(
    input: Omit<MoreInfoReminderScheduleSnapshot, "version">,
  ): MoreInfoReminderScheduleDocument {
    return new MoreInfoReminderScheduleDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: MoreInfoReminderScheduleSnapshot): MoreInfoReminderScheduleDocument {
    return new MoreInfoReminderScheduleDocument(snapshot);
  }

  static normalize(snapshot: MoreInfoReminderScheduleSnapshot): MoreInfoReminderScheduleSnapshot {
    ensureNonNegativeInteger(snapshot.maxReminderCount, "maxReminderCount");
    ensureNonNegativeInteger(snapshot.dispatchedReminderCount, "dispatchedReminderCount");
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      scheduleStates.includes(snapshot.scheduleState),
      "INVALID_MORE_INFO_REMINDER_SCHEDULE_STATE",
      "Unsupported MoreInfoReminderSchedule.scheduleState.",
    );
    invariant(
      callbackFallbackStates.includes(snapshot.callbackFallbackState),
      "INVALID_CALLBACK_FALLBACK_STATE",
      "Unsupported MoreInfoReminderSchedule.callbackFallbackState.",
    );
    const reminderOffsetsMinutes = ensureIntegerMinutes(
      snapshot.reminderOffsetsMinutes,
      "reminderOffsetsMinutes",
    );
    invariant(
      snapshot.maxReminderCount === reminderOffsetsMinutes.length,
      "MAX_REMINDER_COUNT_MISMATCH",
      "maxReminderCount must equal reminderOffsetsMinutes.length.",
    );
    return {
      ...snapshot,
      scheduleId: requireRef(snapshot.scheduleId, "scheduleId"),
      cycleId: requireRef(snapshot.cycleId, "cycleId"),
      checkpointRef: requireRef(snapshot.checkpointRef, "checkpointRef"),
      cadencePolicyRef: requireRef(snapshot.cadencePolicyRef, "cadencePolicyRef"),
      reminderOffsetsMinutes,
      quietHoursPolicyRef: optionalRef(snapshot.quietHoursPolicyRef),
      quietHoursWindow: normalizeQuietHoursWindow(snapshot.quietHoursWindow),
      lastReminderSentAt: snapshot.lastReminderSentAt
        ? ensureIsoTimestamp(snapshot.lastReminderSentAt, "lastReminderSentAt")
        : null,
      nextQuietHoursReleaseAt: snapshot.nextQuietHoursReleaseAt
        ? ensureIsoTimestamp(snapshot.nextQuietHoursReleaseAt, "nextQuietHoursReleaseAt")
        : null,
      suppressedReasonRef: optionalRef(snapshot.suppressedReasonRef),
      callbackFallbackSeedRef: optionalRef(snapshot.callbackFallbackSeedRef),
      completedAt: snapshot.completedAt
        ? ensureIsoTimestamp(snapshot.completedAt, "completedAt")
        : null,
      cancelledAt: snapshot.cancelledAt
        ? ensureIsoTimestamp(snapshot.cancelledAt, "cancelledAt")
        : null,
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
  }

  get scheduleId(): string {
    return this.snapshot.scheduleId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): MoreInfoReminderScheduleSnapshot {
    return { ...this.snapshot };
  }

  update(changes: Partial<MoreInfoReminderScheduleSnapshot>): MoreInfoReminderScheduleDocument {
    return new MoreInfoReminderScheduleDocument({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface MoreInfoKernelRepositories {
  getCycle(cycleId: string): Promise<MoreInfoCycleDocument | undefined>;
  saveCycle(cycle: MoreInfoCycleDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listCycles(): Promise<readonly MoreInfoCycleDocument[]>;
  findLatestCycleForTask(taskId: string): Promise<MoreInfoCycleDocument | undefined>;
  findLiveCycleForLineage(requestLineageRef: string): Promise<MoreInfoCycleDocument | undefined>;

  getReplyWindowCheckpoint(
    checkpointId: string,
  ): Promise<MoreInfoReplyWindowCheckpointDocument | undefined>;
  saveReplyWindowCheckpoint(
    checkpoint: MoreInfoReplyWindowCheckpointDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReplyWindowCheckpoints(): Promise<readonly MoreInfoReplyWindowCheckpointDocument[]>;
  findActiveCheckpointForLineage(
    requestLineageRef: string,
  ): Promise<MoreInfoReplyWindowCheckpointDocument | undefined>;

  getReminderSchedule(scheduleId: string): Promise<MoreInfoReminderScheduleDocument | undefined>;
  saveReminderSchedule(
    schedule: MoreInfoReminderScheduleDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReminderSchedules(): Promise<readonly MoreInfoReminderScheduleDocument[]>;

  withMoreInfoBoundary<TValue>(callback: () => Promise<TValue>): Promise<TValue>;
}

export class InMemoryMoreInfoKernelStore implements MoreInfoKernelRepositories {
  private readonly cycles = new Map<string, PersistedMoreInfoCycleRow>();
  private readonly checkpoints = new Map<string, PersistedMoreInfoReplyWindowCheckpointRow>();
  private readonly schedules = new Map<string, PersistedMoreInfoReminderScheduleRow>();

  async getCycle(cycleId: string): Promise<MoreInfoCycleDocument | undefined> {
    const row = this.cycles.get(requireRef(cycleId, "cycleId"));
    return row ? MoreInfoCycleDocument.hydrate(row) : undefined;
  }

  async saveCycle(cycle: MoreInfoCycleDocument, options?: CompareAndSetWriteOptions): Promise<void> {
    const snapshot = cycle.toSnapshot();
    saveWithCas(
      this.cycles,
      snapshot.cycleId,
      {
        ...snapshot,
        aggregateType: "MoreInfoCycle",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listCycles(): Promise<readonly MoreInfoCycleDocument[]> {
    return [...this.cycles.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => MoreInfoCycleDocument.hydrate(row));
  }

  async findLatestCycleForTask(taskId: string): Promise<MoreInfoCycleDocument | undefined> {
    const rows = [...this.cycles.values()]
      .filter((row) => row.taskId === requireRef(taskId, "taskId"))
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
    const row = rows.at(-1);
    return row ? MoreInfoCycleDocument.hydrate(row) : undefined;
  }

  async findLiveCycleForLineage(
    requestLineageRef: string,
  ): Promise<MoreInfoCycleDocument | undefined> {
    const rows = [...this.cycles.values()]
      .filter(
        (row) =>
          row.requestLineageRef === requireRef(requestLineageRef, "requestLineageRef") &&
          !isCycleTerminal(row.state),
      )
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
    const row = rows.at(-1);
    return row ? MoreInfoCycleDocument.hydrate(row) : undefined;
  }

  async getReplyWindowCheckpoint(
    checkpointId: string,
  ): Promise<MoreInfoReplyWindowCheckpointDocument | undefined> {
    const row = this.checkpoints.get(requireRef(checkpointId, "checkpointId"));
    return row ? MoreInfoReplyWindowCheckpointDocument.hydrate(row) : undefined;
  }

  async saveReplyWindowCheckpoint(
    checkpoint: MoreInfoReplyWindowCheckpointDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = checkpoint.toSnapshot();
    saveWithCas(
      this.checkpoints,
      snapshot.checkpointId,
      {
        ...snapshot,
        aggregateType: "MoreInfoReplyWindowCheckpoint",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listReplyWindowCheckpoints(): Promise<readonly MoreInfoReplyWindowCheckpointDocument[]> {
    return [...this.checkpoints.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => MoreInfoReplyWindowCheckpointDocument.hydrate(row));
  }

  async findActiveCheckpointForLineage(
    requestLineageRef: string,
  ): Promise<MoreInfoReplyWindowCheckpointDocument | undefined> {
    const rows = [...this.checkpoints.values()]
      .filter(
        (row) =>
          row.requestLineageRef === requireRef(requestLineageRef, "requestLineageRef") &&
          (row.replyWindowState === "open" ||
            row.replyWindowState === "reminder_due" ||
            row.replyWindowState === "late_review"),
      )
      .sort((left, right) => left.checkpointRevision - right.checkpointRevision);
    const row = rows.at(-1);
    return row ? MoreInfoReplyWindowCheckpointDocument.hydrate(row) : undefined;
  }

  async getReminderSchedule(
    scheduleId: string,
  ): Promise<MoreInfoReminderScheduleDocument | undefined> {
    const row = this.schedules.get(requireRef(scheduleId, "scheduleId"));
    return row ? MoreInfoReminderScheduleDocument.hydrate(row) : undefined;
  }

  async saveReminderSchedule(
    schedule: MoreInfoReminderScheduleDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = schedule.toSnapshot();
    saveWithCas(
      this.schedules,
      snapshot.scheduleId,
      {
        ...snapshot,
        aggregateType: "MoreInfoReminderSchedule",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listReminderSchedules(): Promise<readonly MoreInfoReminderScheduleDocument[]> {
    return [...this.schedules.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => MoreInfoReminderScheduleDocument.hydrate(row));
  }

  async withMoreInfoBoundary<TValue>(callback: () => Promise<TValue>): Promise<TValue> {
    return callback();
  }
}

export function createPhase3MoreInfoKernelStore(): MoreInfoKernelRepositories {
  return new InMemoryMoreInfoKernelStore();
}

export interface MoreInfoKernelBundle {
  cycle: MoreInfoCycleSnapshot;
  checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
  schedule: MoreInfoReminderScheduleSnapshot;
}

export interface CreateMoreInfoCycleInput {
  cycleId?: string;
  taskId: string;
  requestId: string;
  requestLineageRef: string;
  promptSetRef: string;
  channelRef: string;
  responseRouteFamilyRef: string;
  dueAt: string;
  lateReviewStartsAt?: string | null;
  expiresAt: string;
  reminderOffsetsMinutes: readonly number[];
  cadencePolicyRef: string;
  quietHoursWindow?: MoreInfoQuietHoursWindow | null;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  responseGrantRef?: string | null;
  responseGrantExpiresAt?: string | null;
  supersedesCycleRef?: string | null;
  createdAt: string;
}

export interface MarkMoreInfoDeliveryInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  deliveredAt: string;
}

export interface MarkMoreInfoReminderDispatchedInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  reminderSentAt: string;
}

export interface SuppressMoreInfoReminderInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  suppressedAt: string;
  suppressionReasonRef: string;
  nextQuietHoursReleaseAt?: string | null;
  replyWindowState?: "reminder_due" | "blocked_repair";
  repairRequiredReasonRef?: string | null;
}

export interface SeedMoreInfoCallbackFallbackInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  callbackFallbackSeedRef: string;
  seededAt: string;
  repairRequiredReasonRef: string;
}

export interface FinalizeMoreInfoCycleInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  nextLineageFenceEpoch: number;
  recordedAt: string;
}

export interface SupersedeMoreInfoCycleInput extends FinalizeMoreInfoCycleInput {
  supersededByCycleRef: string;
}

export interface ReceivePatientResponseInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  receivedAt: string;
  repairBlocked: boolean;
}

export interface RefreshMoreInfoReplyWindowInput {
  cycleId: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  evaluatedAt: string;
  repairBlocked: boolean;
  repairRequiredReasonRef?: string | null;
}

export interface MoreInfoResponseReceipt {
  classification: MoreInfoResponseClassification;
  cycle: MoreInfoCycleSnapshot;
  checkpoint: MoreInfoReplyWindowCheckpointSnapshot;
  schedule: MoreInfoReminderScheduleSnapshot;
}

export interface MoreInfoKernelService {
  createCycle(input: CreateMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  refreshReplyWindowState(input: RefreshMoreInfoReplyWindowInput): Promise<MoreInfoKernelBundle>;
  markDelivered(input: MarkMoreInfoDeliveryInput): Promise<MoreInfoKernelBundle>;
  markReminderDispatched(input: MarkMoreInfoReminderDispatchedInput): Promise<MoreInfoKernelBundle>;
  markReminderSuppressed(input: SuppressMoreInfoReminderInput): Promise<MoreInfoKernelBundle>;
  markCallbackFallbackSeeded(
    input: SeedMoreInfoCallbackFallbackInput,
  ): Promise<MoreInfoKernelBundle>;
  markExpired(input: FinalizeMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  supersedeCycle(input: SupersedeMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  cancelCycle(input: FinalizeMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
  receivePatientResponse(input: ReceivePatientResponseInput): Promise<MoreInfoResponseReceipt>;
  resumeReview(input: FinalizeMoreInfoCycleInput): Promise<MoreInfoKernelBundle>;
}

class Phase3MoreInfoKernelServiceImpl implements MoreInfoKernelService {
  constructor(
    private readonly repositories: MoreInfoKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  private async requireBundle(
    cycleId: string,
  ): Promise<{
    cycle: MoreInfoCycleDocument;
    checkpoint: MoreInfoReplyWindowCheckpointDocument;
    schedule: MoreInfoReminderScheduleDocument;
  }> {
    const cycle = await this.repositories.getCycle(cycleId);
    invariant(cycle, "MORE_INFO_CYCLE_NOT_FOUND", `MoreInfoCycle ${cycleId} was not found.`);
    const checkpoint = await this.repositories.getReplyWindowCheckpoint(
      cycle.toSnapshot().activeCheckpointRef,
    );
    invariant(
      checkpoint,
      "MORE_INFO_CHECKPOINT_NOT_FOUND",
      `MoreInfoReplyWindowCheckpoint ${cycle.toSnapshot().activeCheckpointRef} was not found.`,
    );
    const schedule = await this.repositories.getReminderSchedule(cycle.toSnapshot().reminderScheduleRef);
    invariant(
      schedule,
      "MORE_INFO_SCHEDULE_NOT_FOUND",
      `MoreInfoReminderSchedule ${cycle.toSnapshot().reminderScheduleRef} was not found.`,
    );
    return { cycle, checkpoint, schedule };
  }

  private assertPresentedTuple(input: {
    cycle: MoreInfoCycleDocument;
    presentedOwnershipEpoch: number;
    presentedFencingToken: string;
    presentedLineageFenceEpoch: number;
  }): void {
    const snapshot = input.cycle.toSnapshot();
    invariant(
      snapshot.ownershipEpoch === input.presentedOwnershipEpoch,
      "MORE_INFO_OWNERSHIP_EPOCH_DRIFT",
      "MoreInfoCycle mutation requires the current ownership epoch.",
    );
    invariant(
      snapshot.fencingToken === requireRef(input.presentedFencingToken, "presentedFencingToken"),
      "MORE_INFO_FENCING_TOKEN_DRIFT",
      "MoreInfoCycle mutation requires the current fencing token.",
    );
    invariant(
      snapshot.currentLineageFenceEpoch === input.presentedLineageFenceEpoch,
      "MORE_INFO_LINEAGE_FENCE_DRIFT",
      "MoreInfoCycle mutation requires the current lineage fence epoch.",
    );
  }

  async createCycle(input: CreateMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
      const dueAt = ensureIsoTimestamp(input.dueAt, "dueAt");
      const lateReviewStartsAt = ensureIsoTimestamp(
        input.lateReviewStartsAt ?? dueAt,
        "lateReviewStartsAt",
      );
      const expiresAt = ensureIsoTimestamp(input.expiresAt, "expiresAt");
      const existingActiveCheckpoint = await this.repositories.findActiveCheckpointForLineage(
        input.requestLineageRef,
      );
      invariant(
        !existingActiveCheckpoint,
        "LIVE_MORE_INFO_CHECKPOINT_ALREADY_EXISTS",
        "A request lineage may not hold two active MoreInfoReplyWindowCheckpoint rows.",
      );
      const liveCycle = await this.repositories.findLiveCycleForLineage(input.requestLineageRef);
      if (liveCycle) {
        invariant(
          liveCycle.toSnapshot().cycleId === optionalRef(input.supersedesCycleRef),
          "LIVE_MORE_INFO_CYCLE_REQUIRES_EXPLICIT_SUPERSESSION",
          "A replacement MoreInfoCycle requires the live predecessor to be explicitly superseded first.",
        );
      }
      const cycleId = optionalRef(input.cycleId) ?? nextMoreInfoId(this.idGenerator, "moreInfoCycle");
      const checkpointId = nextMoreInfoId(this.idGenerator, "moreInfoReplyWindowCheckpoint");
      const scheduleId = nextMoreInfoId(this.idGenerator, "moreInfoReminderSchedule");
      const reminderOffsetsMinutes = ensureIntegerMinutes(
        input.reminderOffsetsMinutes,
        "reminderOffsetsMinutes",
      );
      const nextReminderDueAt = computeNextReminderDueAt({
        createdAt,
        reminderOffsetsMinutes,
        dispatchedReminderCount: 0,
        dueAt,
      });
      const scheduleState: MoreInfoReminderScheduleState =
        reminderOffsetsMinutes.length > 0 ? "scheduled" : "exhausted";
      const checkpoint = MoreInfoReplyWindowCheckpointDocument.create({
        checkpointId,
        cycleId,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        checkpointRevision: 1,
        replyWindowState: nextReminderDueAt !== null && compareIso(createdAt, nextReminderDueAt) >= 0 ? "reminder_due" : "open",
        opensAt: createdAt,
        dueAt,
        lateReviewStartsAt,
        expiresAt,
        nextReminderDueAt,
        grantNarrowingExpiresAt: input.responseGrantExpiresAt ?? null,
        repairRequiredReasonRef: null,
        settledAt: null,
        supersededAt: null,
        currentLineageFenceEpoch: input.currentLineageFenceEpoch,
        createdAt,
        updatedAt: createdAt,
      });
      const schedule = MoreInfoReminderScheduleDocument.create({
        scheduleId,
        cycleId,
        checkpointRef: checkpointId,
        scheduleState,
        cadencePolicyRef: requireRef(input.cadencePolicyRef, "cadencePolicyRef"),
        reminderOffsetsMinutes,
        maxReminderCount: reminderOffsetsMinutes.length,
        dispatchedReminderCount: 0,
        quietHoursPolicyRef: input.quietHoursWindow?.policyRef ?? null,
        quietHoursWindow: input.quietHoursWindow ?? null,
        lastReminderSentAt: null,
        nextQuietHoursReleaseAt: null,
        suppressedReasonRef: null,
        callbackFallbackState: "not_eligible",
        callbackFallbackSeedRef: null,
        completedAt: null,
        cancelledAt: null,
        createdAt,
        updatedAt: createdAt,
      });
      const cycle = MoreInfoCycleDocument.create({
        cycleId,
        taskId: input.taskId,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        state: "awaiting_delivery",
        promptSetRef: input.promptSetRef,
        channelRef: input.channelRef,
        responseRouteFamilyRef: input.responseRouteFamilyRef,
        dueAt,
        lateReviewStartsAt,
        expiresAt,
        lifecycleLeaseRef: input.lifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        ownershipEpoch: input.ownershipEpoch,
        fencingToken: input.fencingToken,
        currentLineageFenceEpoch: input.currentLineageFenceEpoch,
        activeCheckpointRef: checkpointId,
        reminderScheduleRef: scheduleId,
        responseGrantRef: input.responseGrantRef ?? null,
        responseGrantExpiresAt: input.responseGrantExpiresAt ?? null,
        supersedesCycleRef: input.supersedesCycleRef ?? null,
        supersededByCycleRef: null,
        latestResponseClassification: null,
        responseReceivedAt: null,
        callbackFallbackSeedRef: null,
        createdAt,
        updatedAt: createdAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(checkpoint);
      await this.repositories.saveReminderSchedule(schedule);
      await this.repositories.saveCycle(cycle);
      return {
        cycle: cycle.toSnapshot(),
        checkpoint: checkpoint.toSnapshot(),
        schedule: schedule.toSnapshot(),
      };
    });
  }

  async markDelivered(input: MarkMoreInfoDeliveryInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        cycle.toSnapshot().state === "awaiting_delivery",
        "MORE_INFO_DELIVERY_STATE_INVALID",
        "Only awaiting_delivery cycles may be marked delivered.",
      );
      const deliveredAt = ensureIsoTimestamp(input.deliveredAt, "deliveredAt");
      const checkpointState = resolveReplyWindowState({
        checkpoint: checkpoint.toSnapshot(),
        evaluatedAt: deliveredAt,
        repairBlocked: false,
      });
      const updatedCheckpoint = checkpoint.update({
        replyWindowState: checkpointState,
        updatedAt: deliveredAt,
      });
      const updatedCycle = cycle.update({
        state:
          checkpointState === "late_review"
            ? "awaiting_late_review"
            : checkpointState === "expired"
              ? "expired"
              : "awaiting_patient_reply",
        updatedAt: deliveredAt,
      });
      const updatedSchedule =
        checkpointState === "expired"
          ? schedule.update({
              scheduleState: "completed",
              completedAt: deliveredAt,
              updatedAt: deliveredAt,
            })
          : schedule.update({ updatedAt: deliveredAt });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async refreshReplyWindowState(
    input: RefreshMoreInfoReplyWindowInput,
  ): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
      const nextCheckpointState = resolveReplyWindowState({
        checkpoint: checkpoint.toSnapshot(),
        evaluatedAt,
        repairBlocked: input.repairBlocked,
      });
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: nextCheckpointState,
        repairRequiredReasonRef:
          nextCheckpointState === "blocked_repair"
            ? requireRef(
                optionalRef(input.repairRequiredReasonRef) ?? "reachability_dependency_active",
                "repairRequiredReasonRef",
              )
            : null,
        updatedAt: evaluatedAt,
      });
      const updatedSchedule =
        nextCheckpointState === "expired" && schedule.toSnapshot().scheduleState !== "cancelled"
          ? schedule.update({
              scheduleState: "completed",
              completedAt: evaluatedAt,
              updatedAt: evaluatedAt,
            })
          : schedule.update({ updatedAt: evaluatedAt });
      const updatedCycle = cycle.update({
        state:
          nextCheckpointState === "expired"
            ? "expired"
            : cycle.toSnapshot().state === "awaiting_delivery"
              ? "awaiting_delivery"
              : nextCheckpointState === "late_review"
                ? "awaiting_late_review"
                : nextCheckpointState === "open" ||
                    nextCheckpointState === "reminder_due" ||
                    nextCheckpointState === "blocked_repair"
                  ? "awaiting_patient_reply"
                  : cycle.toSnapshot().state,
        updatedAt: evaluatedAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async markReminderDispatched(
    input: MarkMoreInfoReminderDispatchedInput,
  ): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        !isCycleTerminal(cycle.toSnapshot().state) && cycle.toSnapshot().state !== "response_received",
        "MORE_INFO_REMINDER_CYCLE_TERMINAL",
        "Terminal MoreInfoCycle rows may not dispatch new reminders.",
      );
      invariant(
        checkpoint.toSnapshot().replyWindowState === "reminder_due" ||
          checkpoint.toSnapshot().replyWindowState === "open",
        "MORE_INFO_REMINDER_NOT_ELIGIBLE",
        "Reminders may dispatch only while the reply window is open or due.",
      );
      invariant(
        schedule.toSnapshot().scheduleState === "scheduled" ||
          schedule.toSnapshot().scheduleState === "suppressed",
        "MORE_INFO_REMINDER_SCHEDULE_NOT_LIVE",
        "Only scheduled or suppressed reminder ledgers may dispatch reminders.",
      );
      const reminderSentAt = ensureIsoTimestamp(input.reminderSentAt, "reminderSentAt");
      const nextDispatchedReminderCount = schedule.toSnapshot().dispatchedReminderCount + 1;
      const nextReminderDueAt = computeNextReminderDueAt({
        createdAt: cycle.toSnapshot().createdAt,
        reminderOffsetsMinutes: schedule.toSnapshot().reminderOffsetsMinutes,
        dispatchedReminderCount: nextDispatchedReminderCount,
        dueAt: checkpoint.toSnapshot().dueAt,
      });
      const nextCheckpointState = resolveReplyWindowState({
        checkpoint: {
          ...checkpoint.toSnapshot(),
          replyWindowState: "open",
          nextReminderDueAt,
        },
        evaluatedAt: reminderSentAt,
        repairBlocked: false,
      });
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: nextCheckpointState,
        nextReminderDueAt,
        repairRequiredReasonRef: null,
        updatedAt: reminderSentAt,
      });
      const updatedSchedule = schedule.update({
        scheduleState: nextReminderDueAt ? "scheduled" : "exhausted",
        dispatchedReminderCount: nextDispatchedReminderCount,
        lastReminderSentAt: reminderSentAt,
        nextQuietHoursReleaseAt: null,
        suppressedReasonRef: null,
        updatedAt: reminderSentAt,
      });
      const updatedCycle = cycle.update({
        state:
          nextCheckpointState === "late_review"
            ? "awaiting_late_review"
            : nextCheckpointState === "expired"
              ? "expired"
              : "awaiting_patient_reply",
        updatedAt: reminderSentAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async markReminderSuppressed(input: SuppressMoreInfoReminderInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      const suppressedAt = ensureIsoTimestamp(input.suppressedAt, "suppressedAt");
      const nextCheckpointState = input.replyWindowState ?? checkpoint.toSnapshot().replyWindowState;
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: nextCheckpointState,
        repairRequiredReasonRef:
          optionalRef(input.repairRequiredReasonRef) ??
          (nextCheckpointState === "blocked_repair"
            ? requireRef(input.suppressionReasonRef, "suppressionReasonRef")
            : null),
        updatedAt: suppressedAt,
      });
      const updatedSchedule = schedule.update({
        scheduleState: "suppressed",
        nextQuietHoursReleaseAt: input.nextQuietHoursReleaseAt ?? null,
        suppressedReasonRef: requireRef(input.suppressionReasonRef, "suppressionReasonRef"),
        updatedAt: suppressedAt,
      });
      const updatedCycle = cycle.update({
        state:
          nextCheckpointState === "late_review"
            ? "awaiting_late_review"
            : nextCheckpointState === "expired"
              ? "expired"
              : "awaiting_patient_reply",
        updatedAt: suppressedAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async markCallbackFallbackSeeded(
    input: SeedMoreInfoCallbackFallbackInput,
  ): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      const seededAt = ensureIsoTimestamp(input.seededAt, "seededAt");
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: "blocked_repair",
        repairRequiredReasonRef: requireRef(input.repairRequiredReasonRef, "repairRequiredReasonRef"),
        updatedAt: seededAt,
      });
      const updatedSchedule = schedule.update({
        scheduleState: "exhausted",
        suppressedReasonRef: requireRef(input.repairRequiredReasonRef, "repairRequiredReasonRef"),
        callbackFallbackState: "seeded",
        callbackFallbackSeedRef: requireRef(input.callbackFallbackSeedRef, "callbackFallbackSeedRef"),
        updatedAt: seededAt,
      });
      const updatedCycle = cycle.update({
        callbackFallbackSeedRef: requireRef(input.callbackFallbackSeedRef, "callbackFallbackSeedRef"),
        updatedAt: seededAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async markExpired(input: FinalizeMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        input.nextLineageFenceEpoch > cycle.toSnapshot().currentLineageFenceEpoch,
        "MORE_INFO_EXPIRY_REQUIRES_FENCE_ADVANCE",
        "Expiry must advance the cycle lineage fence epoch after lease release.",
      );
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: "expired",
        updatedAt: recordedAt,
      });
      const updatedSchedule =
        schedule.toSnapshot().scheduleState === "cancelled"
          ? schedule.update({ updatedAt: recordedAt })
          : schedule.update({
              scheduleState: "completed",
              completedAt: recordedAt,
              updatedAt: recordedAt,
            });
      const updatedCycle = cycle.update({
        state: "expired",
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        updatedAt: recordedAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async supersedeCycle(input: SupersedeMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        !isCycleTerminal(cycle.toSnapshot().state),
        "MORE_INFO_CYCLE_ALREADY_TERMINAL",
        "Only live MoreInfoCycle rows may be superseded.",
      );
      invariant(
        input.nextLineageFenceEpoch > cycle.toSnapshot().currentLineageFenceEpoch,
        "MORE_INFO_SUPERSESSION_REQUIRES_FENCE_ADVANCE",
        "Supersession must advance the cycle lineage fence epoch after lease release.",
      );
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: "superseded",
        supersededAt: recordedAt,
        updatedAt: recordedAt,
      });
      const updatedSchedule = schedule.update({
        scheduleState: "cancelled",
        cancelledAt: recordedAt,
        updatedAt: recordedAt,
      });
      const updatedCycle = cycle.update({
        state: "superseded",
        supersededByCycleRef: requireRef(input.supersededByCycleRef, "supersededByCycleRef"),
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        updatedAt: recordedAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async cancelCycle(input: FinalizeMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        !isCycleTerminal(cycle.toSnapshot().state),
        "MORE_INFO_CYCLE_ALREADY_TERMINAL",
        "Only live MoreInfoCycle rows may be cancelled.",
      );
      invariant(
        input.nextLineageFenceEpoch > cycle.toSnapshot().currentLineageFenceEpoch,
        "MORE_INFO_CANCEL_REQUIRES_FENCE_ADVANCE",
        "Cancellation must advance the cycle lineage fence epoch after lease release.",
      );
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: "settled",
        settledAt: recordedAt,
        repairRequiredReasonRef: null,
        updatedAt: recordedAt,
      });
      const updatedSchedule = schedule.update({
        scheduleState: "cancelled",
        cancelledAt: recordedAt,
        updatedAt: recordedAt,
      });
      const updatedCycle = cycle.update({
        state: "cancelled",
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        updatedAt: recordedAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async receivePatientResponse(input: ReceivePatientResponseInput): Promise<MoreInfoResponseReceipt> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      const receivedAt = ensureIsoTimestamp(input.receivedAt, "receivedAt");
      const resolvedCheckpointState = resolveReplyWindowState({
        checkpoint: checkpoint.toSnapshot(),
        evaluatedAt: receivedAt,
        repairBlocked: input.repairBlocked,
      });
      let classification: MoreInfoResponseClassification;
      if (cycle.toSnapshot().state === "superseded" || resolvedCheckpointState === "superseded") {
        classification = "superseded_duplicate";
        return {
          classification,
          cycle: cycle.toSnapshot(),
          checkpoint: checkpoint.toSnapshot(),
          schedule: schedule.toSnapshot(),
        };
      }
      if (resolvedCheckpointState === "blocked_repair") {
        classification = "blocked_repair";
        return {
          classification,
          cycle: cycle.toSnapshot(),
          checkpoint: checkpoint.toSnapshot(),
          schedule: schedule.toSnapshot(),
        };
      }
      if (resolvedCheckpointState === "expired") {
        classification = "expired_rejected";
        return {
          classification,
          cycle: cycle.toSnapshot(),
          checkpoint: checkpoint.update({
            checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
            replyWindowState: "expired",
            updatedAt: receivedAt,
          }).toSnapshot(),
          schedule: schedule.toSnapshot(),
        };
      }
      classification =
        resolvedCheckpointState === "late_review" ? "accepted_late_review" : "accepted_on_time";
      const updatedCheckpoint = checkpoint.update({
        checkpointRevision: checkpoint.toSnapshot().checkpointRevision + 1,
        replyWindowState: "settled",
        settledAt: receivedAt,
        repairRequiredReasonRef: null,
        updatedAt: receivedAt,
      });
      const updatedSchedule = schedule.update({
        scheduleState: "completed",
        completedAt: receivedAt,
        suppressedReasonRef: null,
        nextQuietHoursReleaseAt: null,
        updatedAt: receivedAt,
      });
      const updatedCycle = cycle.update({
        state: "response_received",
        latestResponseClassification: classification,
        responseReceivedAt: receivedAt,
        updatedAt: receivedAt,
      });
      await this.repositories.saveReplyWindowCheckpoint(updatedCheckpoint, {
        expectedVersion: checkpoint.version,
      });
      await this.repositories.saveReminderSchedule(updatedSchedule, {
        expectedVersion: schedule.version,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        classification,
        cycle: updatedCycle.toSnapshot(),
        checkpoint: updatedCheckpoint.toSnapshot(),
        schedule: updatedSchedule.toSnapshot(),
      };
    });
  }

  async resumeReview(input: FinalizeMoreInfoCycleInput): Promise<MoreInfoKernelBundle> {
    return this.repositories.withMoreInfoBoundary(async () => {
      const { cycle, checkpoint, schedule } = await this.requireBundle(input.cycleId);
      this.assertPresentedTuple({
        cycle,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        cycle.toSnapshot().state === "response_received",
        "MORE_INFO_REVIEW_RESUME_STATE_INVALID",
        "Only response_received cycles may settle review_resumed.",
      );
      invariant(
        input.nextLineageFenceEpoch > cycle.toSnapshot().currentLineageFenceEpoch,
        "MORE_INFO_REVIEW_RESUME_REQUIRES_FENCE_ADVANCE",
        "Review resume must advance the cycle lineage fence epoch after lease release.",
      );
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const updatedCycle = cycle.update({
        state: "review_resumed",
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        updatedAt: recordedAt,
      });
      await this.repositories.saveCycle(updatedCycle, { expectedVersion: cycle.version });
      return {
        cycle: updatedCycle.toSnapshot(),
        checkpoint: checkpoint.toSnapshot(),
        schedule: schedule.toSnapshot(),
      };
    });
  }
}

export function createPhase3MoreInfoKernelService(
  repositories: MoreInfoKernelRepositories = createPhase3MoreInfoKernelStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): MoreInfoKernelService {
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("phase3_more_info_kernel");
  return new Phase3MoreInfoKernelServiceImpl(repositories, idGenerator);
}

export function computeMoreInfoWorkerEffectKey(input: {
  cycleId: string;
  effectType: "initial_delivery" | "reminder_send" | "callback_fallback_seed";
  ordinal?: number;
  checkpointRevision: number;
}): string {
  return sha256Hex(
    stableStringify({
      cycleId: requireRef(input.cycleId, "cycleId"),
      effectType: input.effectType,
      ordinal: input.ordinal ?? 0,
      checkpointRevision: ensurePositiveInteger(input.checkpointRevision, "checkpointRevision"),
    }),
  );
}
