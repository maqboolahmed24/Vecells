import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import type {
  MoreInfoCycleState,
  MoreInfoReplyWindowState,
} from "./phase3-more-info-kernel";
import type {
  RequestedSafetyState,
  SafetyDecisionOutcome,
} from "@vecells/domain-intake-safety";

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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function appendOnlyInsert<T>(map: Map<string, T>, key: string, row: T, aggregateLabel: string): void {
  invariant(
    !map.has(key),
    `IMMUTABLE_${aggregateLabel.toUpperCase()}_REWRITE_FORBIDDEN`,
    `${aggregateLabel} is append-only and may not be rewritten in place.`,
  );
  map.set(key, row);
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function subtractHours(isoTimestamp: string, hours: number): string {
  return new Date(Date.parse(isoTimestamp) - hours * 60 * 60 * 1000).toISOString();
}

function nextResponseId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type MoreInfoResponseDispositionClass =
  | "accepted_in_window"
  | "accepted_late_review"
  | "blocked_repair"
  | "superseded_duplicate"
  | "expired_rejected";

export type MoreInfoResponseReplayDisposition =
  | "distinct"
  | "idempotent_replay"
  | "semantic_replay";

export type ResponseAssimilationRoutingOutcome =
  | "urgent_return"
  | "review_resumed_only"
  | "review_resumed_then_queued"
  | "supervisor_review_required"
  | "manual_review_blocked";

export interface MoreInfoResponseDispositionSnapshot {
  dispositionId: string;
  taskId: string;
  cycleId: string;
  checkpointRef: string;
  requestId: string;
  requestLineageRef: string;
  responseGrantRef: string | null;
  checkpointRevision: number;
  ownershipEpoch: number;
  currentLineageFenceEpoch: number;
  idempotencyKey: string;
  replayKey: string;
  sourcePayloadHash: string;
  replayDisposition: MoreInfoResponseReplayDisposition;
  dispositionClass: MoreInfoResponseDispositionClass;
  accepted: boolean;
  lateReview: boolean;
  reasonCodeRefs: readonly string[];
  blockedRecoveryRouteRef: string | null;
  resultingResponseAssimilationRef: string | null;
  resultingEvidenceAssimilationRef: string | null;
  receivedAt: string;
  recordedAt: string;
  version: 1;
}

export interface ResponseAssimilationRecordSnapshot {
  responseAssimilationRecordId: string;
  dispositionRef: string;
  taskId: string;
  cycleId: string;
  requestId: string;
  requestLineageRef: string;
  evidenceCaptureBundleRef: string;
  evidenceSnapshotRef: string | null;
  evidenceAssimilationRef: string;
  materialDeltaAssessmentRef: string;
  classificationDecisionRef: string;
  safetyPreemptionRef: string | null;
  safetyDecisionRef: string | null;
  urgentDiversionSettlementRef: string | null;
  deltaFeatureRefs: readonly string[];
  impactedRuleRefs: readonly string[];
  conflictVectorRef: string | null;
  requestedSafetyState: RequestedSafetyState | null;
  safetyDecisionOutcome: SafetyDecisionOutcome | null;
  resultingSafetyDecisionEpoch: number;
  routingOutcome: ResponseAssimilationRoutingOutcome;
  recordedAt: string;
  version: 1;
}

export interface MoreInfoSupervisorReviewRequirementSnapshot {
  supervisorReviewRequirementId: string;
  taskId: string;
  cycleId: string;
  requestId: string;
  requestLineageRef: string;
  triggeringResponseAssimilationRef: string;
  windowStartAt: string;
  windowEndsAt: string;
  reopenCountWithinWindow: number;
  suppressAutomaticRoutineQueue: boolean;
  reasonCodeRefs: readonly string[];
  createdAt: string;
  version: 1;
}

export interface PersistedMoreInfoResponseDispositionRow
  extends MoreInfoResponseDispositionSnapshot {
  aggregateType: "MoreInfoResponseDisposition";
  persistenceSchemaVersion: 1;
}

export interface PersistedResponseAssimilationRecordRow
  extends ResponseAssimilationRecordSnapshot {
  aggregateType: "ResponseAssimilationRecord";
  persistenceSchemaVersion: 1;
}

export interface PersistedMoreInfoSupervisorReviewRequirementRow
  extends MoreInfoSupervisorReviewRequirementSnapshot {
  aggregateType: "MoreInfoSupervisorReviewRequirement";
  persistenceSchemaVersion: 1;
}

export interface ResolveMoreInfoResponseDispositionInput {
  targetCycleId: string;
  currentCycleId: string | null;
  cycleState: MoreInfoCycleState;
  checkpointState: MoreInfoReplyWindowState | "superseded";
  requestClosed: boolean;
  repairBlockReasonRefs?: readonly string[];
  replayAlreadyAssimilated?: boolean;
  policyAllowsLateReview?: boolean;
}

export interface ResolvedMoreInfoResponseDisposition {
  dispositionClass: MoreInfoResponseDispositionClass;
  accepted: boolean;
  lateReview: boolean;
  reasonCodeRefs: readonly string[];
}

export function resolveMoreInfoResponseDisposition(
  input: ResolveMoreInfoResponseDispositionInput,
): ResolvedMoreInfoResponseDisposition {
  const repairBlockReasonRefs = uniqueSortedRefs(input.repairBlockReasonRefs ?? []);
  const policyAllowsLateReview = input.policyAllowsLateReview ?? true;

  if (
    input.currentCycleId !== null &&
    requireRef(input.targetCycleId, "targetCycleId") !== input.currentCycleId
  ) {
    return {
      dispositionClass: "superseded_duplicate",
      accepted: false,
      lateReview: false,
      reasonCodeRefs: ["reply_targets_non_current_cycle"],
    };
  }

  if (
    input.cycleState === "superseded" ||
    input.checkpointState === "superseded" ||
    Boolean(input.replayAlreadyAssimilated)
  ) {
    return {
      dispositionClass: "superseded_duplicate",
      accepted: false,
      lateReview: false,
      reasonCodeRefs: uniqueSortedRefs([
        input.cycleState === "superseded" || input.checkpointState === "superseded"
          ? "reply_targets_superseded_cycle"
          : "",
        input.replayAlreadyAssimilated ? "reply_replays_existing_assimilation" : "",
      ]),
    };
  }

  if (repairBlockReasonRefs.length > 0 || input.checkpointState === "blocked_repair") {
    return {
      dispositionClass: "blocked_repair",
      accepted: false,
      lateReview: false,
      reasonCodeRefs:
        repairBlockReasonRefs.length > 0
          ? repairBlockReasonRefs
          : ["reply_assimilation_blocked_by_repair_posture"],
    };
  }

  if (input.requestClosed) {
    return {
      dispositionClass: "expired_rejected",
      accepted: false,
      lateReview: false,
      reasonCodeRefs: ["request_already_closed"],
    };
  }

  if (input.checkpointState === "late_review") {
    return policyAllowsLateReview
      ? {
          dispositionClass: "accepted_late_review",
          accepted: true,
          lateReview: true,
          reasonCodeRefs: ["reply_accepted_during_late_review"],
        }
      : {
          dispositionClass: "expired_rejected",
          accepted: false,
          lateReview: false,
          reasonCodeRefs: ["late_review_policy_forbids_acceptance"],
        };
  }

  if (input.checkpointState === "open" || input.checkpointState === "reminder_due") {
    return {
      dispositionClass: "accepted_in_window",
      accepted: true,
      lateReview: false,
      reasonCodeRefs: ["reply_accepted_in_live_window"],
    };
  }

  return {
    dispositionClass: "expired_rejected",
    accepted: false,
    lateReview: false,
    reasonCodeRefs: [
      input.checkpointState === "settled"
        ? "reply_window_already_settled"
        : input.checkpointState === "expired"
          ? "reply_window_expired"
          : "reply_window_not_actionable",
    ],
  };
}

export interface EvaluateMoreInfoResponseChurnGuardInput {
  priorResponseAssimilations: readonly Pick<
    ResponseAssimilationRecordSnapshot,
    "recordedAt" | "requestedSafetyState" | "routingOutcome"
  >[];
  clinicianResolutionEventAt?: string | null;
  currentRecordedAt: string;
  maxReopenCount?: number;
  reopenWindowHours?: number;
  currentRequestedSafetyState: RequestedSafetyState | null;
}

export interface MoreInfoResponseChurnGuardResult {
  requiresSupervisorReview: boolean;
  windowStartAt: string;
  windowEndsAt: string;
  reopenCountWithinWindow: number;
  suppressAutomaticRoutineQueue: boolean;
  reasonCodeRefs: readonly string[];
}

export function evaluateMoreInfoResponseChurnGuard(
  input: EvaluateMoreInfoResponseChurnGuardInput,
): MoreInfoResponseChurnGuardResult {
  const maxReopenCount = input.maxReopenCount ?? 3;
  const reopenWindowHours = input.reopenWindowHours ?? 24;
  const windowEndsAt = ensureIsoTimestamp(input.currentRecordedAt, "currentRecordedAt");
  const windowStartAt = subtractHours(windowEndsAt, reopenWindowHours);
  const clinicianResolutionEventAt = optionalRef(input.clinicianResolutionEventAt);
  const lastStableClearAt = input.priorResponseAssimilations
    .filter((record) => record.requestedSafetyState === "screen_clear")
    .map((record) => record.recordedAt)
    .sort(compareIso)
    .at(-1);
  const resetAt = [lastStableClearAt ?? null, clinicianResolutionEventAt]
    .filter((value): value is string => value !== null)
    .sort(compareIso)
    .at(-1);

  const baseline = resetAt && compareIso(resetAt, windowStartAt) > 0 ? resetAt : windowStartAt;
  const reopenCountWithinWindow =
    input.priorResponseAssimilations.filter(
      (record) =>
        compareIso(record.recordedAt, baseline) >= 0 &&
        compareIso(record.recordedAt, windowEndsAt) <= 0 &&
        (record.routingOutcome === "review_resumed_only" ||
          record.routingOutcome === "review_resumed_then_queued"),
    ).length + 1;

  const requiresSupervisorReview =
    input.currentRequestedSafetyState !== "screen_clear" &&
    reopenCountWithinWindow > maxReopenCount;

  return {
    requiresSupervisorReview,
    windowStartAt: baseline,
    windowEndsAt,
    reopenCountWithinWindow,
    suppressAutomaticRoutineQueue: requiresSupervisorReview,
    reasonCodeRefs: requiresSupervisorReview
      ? ["reopen_oscillation_threshold_exceeded", `reopen_window_${reopenWindowHours}h`]
      : [],
  };
}

export function buildMoreInfoResponsePayloadHash(input: {
  cycleId: string;
  messageText?: string | null;
  structuredFacts?: Record<string, unknown> | null;
  attachmentRefs?: readonly string[];
  sourceArtifactRefs?: readonly string[];
  responseGrantRef?: string | null;
}): string {
  return sha256Hex({
    cycleId: requireRef(input.cycleId, "cycleId"),
    messageText: optionalRef(input.messageText),
    structuredFacts: input.structuredFacts ?? {},
    attachmentRefs: uniqueSortedRefs(input.attachmentRefs ?? []),
    sourceArtifactRefs: uniqueSortedRefs(input.sourceArtifactRefs ?? []),
    responseGrantRef: optionalRef(input.responseGrantRef),
  });
}

export function buildMoreInfoResponseReplayKey(input: {
  requestLineageRef: string;
  cycleId: string;
  payloadHash: string;
}): string {
  return sha256Hex({
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    cycleId: requireRef(input.cycleId, "cycleId"),
    payloadHash: requireRef(input.payloadHash, "payloadHash"),
  });
}

export interface MoreInfoResponseResafetyRepositories {
  saveDisposition(row: PersistedMoreInfoResponseDispositionRow): Promise<void>;
  getDisposition(dispositionId: string): Promise<PersistedMoreInfoResponseDispositionRow | null>;
  findDispositionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PersistedMoreInfoResponseDispositionRow | null>;
  findDispositionByReplayKey(
    replayKey: string,
  ): Promise<PersistedMoreInfoResponseDispositionRow | null>;
  listDispositionsByCycle(cycleId: string): Promise<readonly PersistedMoreInfoResponseDispositionRow[]>;
  listDispositionsByRequest(
    requestId: string,
  ): Promise<readonly PersistedMoreInfoResponseDispositionRow[]>;
  saveResponseAssimilationRecord(row: PersistedResponseAssimilationRecordRow): Promise<void>;
  getResponseAssimilationRecord(
    responseAssimilationRecordId: string,
  ): Promise<PersistedResponseAssimilationRecordRow | null>;
  findAssimilationByDispositionRef(
    dispositionRef: string,
  ): Promise<PersistedResponseAssimilationRecordRow | null>;
  listResponseAssimilationRecordsByRequest(
    requestId: string,
  ): Promise<readonly PersistedResponseAssimilationRecordRow[]>;
  saveSupervisorReviewRequirement(
    row: PersistedMoreInfoSupervisorReviewRequirementRow,
  ): Promise<void>;
  listSupervisorReviewRequirementsByTask(
    taskId: string,
  ): Promise<readonly PersistedMoreInfoSupervisorReviewRequirementRow[]>;
  withResponseBoundary<TValue>(callback: () => Promise<TValue>): Promise<TValue>;
}

class InMemoryMoreInfoResponseResafetyStore implements MoreInfoResponseResafetyRepositories {
  private readonly dispositions = new Map<string, PersistedMoreInfoResponseDispositionRow>();
  private readonly dispositionsByIdempotencyKey = new Map<string, string>();
  private readonly dispositionsByReplayKey = new Map<string, string>();
  private readonly responseAssimilations = new Map<string, PersistedResponseAssimilationRecordRow>();
  private readonly responseAssimilationByDispositionRef = new Map<string, string>();
  private readonly supervisorRequirements = new Map<
    string,
    PersistedMoreInfoSupervisorReviewRequirementRow
  >();

  async saveDisposition(row: PersistedMoreInfoResponseDispositionRow): Promise<void> {
    appendOnlyInsert(this.dispositions, row.dispositionId, row, "MoreInfoResponseDisposition");
    this.dispositionsByIdempotencyKey.set(row.idempotencyKey, row.dispositionId);
    this.dispositionsByReplayKey.set(row.replayKey, row.dispositionId);
  }

  async getDisposition(
    dispositionId: string,
  ): Promise<PersistedMoreInfoResponseDispositionRow | null> {
    return this.dispositions.get(requireRef(dispositionId, "dispositionId")) ?? null;
  }

  async findDispositionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PersistedMoreInfoResponseDispositionRow | null> {
    const dispositionId = this.dispositionsByIdempotencyKey.get(
      requireRef(idempotencyKey, "idempotencyKey"),
    );
    return dispositionId ? (this.dispositions.get(dispositionId) ?? null) : null;
  }

  async findDispositionByReplayKey(
    replayKey: string,
  ): Promise<PersistedMoreInfoResponseDispositionRow | null> {
    const dispositionId = this.dispositionsByReplayKey.get(requireRef(replayKey, "replayKey"));
    return dispositionId ? (this.dispositions.get(dispositionId) ?? null) : null;
  }

  async listDispositionsByCycle(
    cycleId: string,
  ): Promise<readonly PersistedMoreInfoResponseDispositionRow[]> {
    return [...this.dispositions.values()]
      .filter((row) => row.cycleId === requireRef(cycleId, "cycleId"))
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async listDispositionsByRequest(
    requestId: string,
  ): Promise<readonly PersistedMoreInfoResponseDispositionRow[]> {
    return [...this.dispositions.values()]
      .filter((row) => row.requestId === requireRef(requestId, "requestId"))
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async saveResponseAssimilationRecord(
    row: PersistedResponseAssimilationRecordRow,
  ): Promise<void> {
    appendOnlyInsert(
      this.responseAssimilations,
      row.responseAssimilationRecordId,
      row,
      "ResponseAssimilationRecord",
    );
    this.responseAssimilationByDispositionRef.set(row.dispositionRef, row.responseAssimilationRecordId);
  }

  async getResponseAssimilationRecord(
    responseAssimilationRecordId: string,
  ): Promise<PersistedResponseAssimilationRecordRow | null> {
    return (
      this.responseAssimilations.get(
        requireRef(responseAssimilationRecordId, "responseAssimilationRecordId"),
      ) ?? null
    );
  }

  async findAssimilationByDispositionRef(
    dispositionRef: string,
  ): Promise<PersistedResponseAssimilationRecordRow | null> {
    const assimilationId = this.responseAssimilationByDispositionRef.get(
      requireRef(dispositionRef, "dispositionRef"),
    );
    return assimilationId ? (this.responseAssimilations.get(assimilationId) ?? null) : null;
  }

  async listResponseAssimilationRecordsByRequest(
    requestId: string,
  ): Promise<readonly PersistedResponseAssimilationRecordRow[]> {
    return [...this.responseAssimilations.values()]
      .filter((row) => row.requestId === requireRef(requestId, "requestId"))
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async saveSupervisorReviewRequirement(
    row: PersistedMoreInfoSupervisorReviewRequirementRow,
  ): Promise<void> {
    appendOnlyInsert(
      this.supervisorRequirements,
      row.supervisorReviewRequirementId,
      row,
      "MoreInfoSupervisorReviewRequirement",
    );
  }

  async listSupervisorReviewRequirementsByTask(
    taskId: string,
  ): Promise<readonly PersistedMoreInfoSupervisorReviewRequirementRow[]> {
    return [...this.supervisorRequirements.values()]
      .filter((row) => row.taskId === requireRef(taskId, "taskId"))
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async withResponseBoundary<TValue>(callback: () => Promise<TValue>): Promise<TValue> {
    return callback();
  }
}

export function createPhase3MoreInfoResponseResafetyStore(): MoreInfoResponseResafetyRepositories {
  return new InMemoryMoreInfoResponseResafetyStore();
}

export interface CreateMoreInfoResponseDispositionInput {
  dispositionId?: string;
  taskId: string;
  cycleId: string;
  checkpointRef: string;
  requestId: string;
  requestLineageRef: string;
  responseGrantRef?: string | null;
  checkpointRevision: number;
  ownershipEpoch: number;
  currentLineageFenceEpoch: number;
  idempotencyKey: string;
  replayKey: string;
  sourcePayloadHash: string;
  replayDisposition?: MoreInfoResponseReplayDisposition;
  dispositionClass: MoreInfoResponseDispositionClass;
  reasonCodeRefs?: readonly string[];
  blockedRecoveryRouteRef?: string | null;
  resultingResponseAssimilationRef?: string | null;
  resultingEvidenceAssimilationRef?: string | null;
  receivedAt: string;
  recordedAt?: string;
}

export interface CreateResponseAssimilationRecordInput {
  responseAssimilationRecordId?: string;
  dispositionRef: string;
  taskId: string;
  cycleId: string;
  requestId: string;
  requestLineageRef: string;
  evidenceCaptureBundleRef: string;
  evidenceSnapshotRef?: string | null;
  evidenceAssimilationRef: string;
  materialDeltaAssessmentRef: string;
  classificationDecisionRef: string;
  safetyPreemptionRef?: string | null;
  safetyDecisionRef?: string | null;
  urgentDiversionSettlementRef?: string | null;
  deltaFeatureRefs?: readonly string[];
  impactedRuleRefs?: readonly string[];
  conflictVectorRef?: string | null;
  requestedSafetyState?: RequestedSafetyState | null;
  safetyDecisionOutcome?: SafetyDecisionOutcome | null;
  resultingSafetyDecisionEpoch?: number;
  routingOutcome: ResponseAssimilationRoutingOutcome;
  recordedAt: string;
}

export interface CreateSupervisorReviewRequirementInput {
  supervisorReviewRequirementId?: string;
  taskId: string;
  cycleId: string;
  requestId: string;
  requestLineageRef: string;
  triggeringResponseAssimilationRef: string;
  windowStartAt: string;
  windowEndsAt: string;
  reopenCountWithinWindow: number;
  suppressAutomaticRoutineQueue: boolean;
  reasonCodeRefs?: readonly string[];
  createdAt: string;
}

export interface Phase3MoreInfoResponseResafetyService {
  createDisposition(
    input: CreateMoreInfoResponseDispositionInput,
  ): Promise<MoreInfoResponseDispositionSnapshot>;
  createResponseAssimilationRecord(
    input: CreateResponseAssimilationRecordInput,
  ): Promise<ResponseAssimilationRecordSnapshot>;
  createSupervisorReviewRequirement(
    input: CreateSupervisorReviewRequirementInput,
  ): Promise<MoreInfoSupervisorReviewRequirementSnapshot>;
}

class Phase3MoreInfoResponseResafetyServiceImpl
  implements Phase3MoreInfoResponseResafetyService
{
  constructor(
    private readonly repositories: MoreInfoResponseResafetyRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async createDisposition(
    input: CreateMoreInfoResponseDispositionInput,
  ): Promise<MoreInfoResponseDispositionSnapshot> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt ?? input.receivedAt, "recordedAt");
    const disposition: PersistedMoreInfoResponseDispositionRow = {
      aggregateType: "MoreInfoResponseDisposition",
      persistenceSchemaVersion: 1,
      dispositionId:
        optionalRef(input.dispositionId) ?? nextResponseId(this.idGenerator, "moreInfoResponseDisposition"),
      taskId: requireRef(input.taskId, "taskId"),
      cycleId: requireRef(input.cycleId, "cycleId"),
      checkpointRef: requireRef(input.checkpointRef, "checkpointRef"),
      requestId: requireRef(input.requestId, "requestId"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      responseGrantRef: optionalRef(input.responseGrantRef),
      checkpointRevision: ensurePositiveInteger(input.checkpointRevision, "checkpointRevision"),
      ownershipEpoch: ensureNonNegativeInteger(input.ownershipEpoch, "ownershipEpoch"),
      currentLineageFenceEpoch: ensureNonNegativeInteger(
        input.currentLineageFenceEpoch,
        "currentLineageFenceEpoch",
      ),
      idempotencyKey: requireRef(input.idempotencyKey, "idempotencyKey"),
      replayKey: requireRef(input.replayKey, "replayKey"),
      sourcePayloadHash: requireRef(input.sourcePayloadHash, "sourcePayloadHash"),
      replayDisposition: input.replayDisposition ?? "distinct",
      dispositionClass: input.dispositionClass,
      accepted:
        input.dispositionClass === "accepted_in_window" ||
        input.dispositionClass === "accepted_late_review",
      lateReview: input.dispositionClass === "accepted_late_review",
      reasonCodeRefs: uniqueSortedRefs(input.reasonCodeRefs ?? []),
      blockedRecoveryRouteRef: optionalRef(input.blockedRecoveryRouteRef),
      resultingResponseAssimilationRef: optionalRef(input.resultingResponseAssimilationRef),
      resultingEvidenceAssimilationRef: optionalRef(input.resultingEvidenceAssimilationRef),
      receivedAt: ensureIsoTimestamp(input.receivedAt, "receivedAt"),
      recordedAt,
      version: 1,
    };
    await this.repositories.saveDisposition(disposition);
    return disposition;
  }

  async createResponseAssimilationRecord(
    input: CreateResponseAssimilationRecordInput,
  ): Promise<ResponseAssimilationRecordSnapshot> {
    const record: PersistedResponseAssimilationRecordRow = {
      aggregateType: "ResponseAssimilationRecord",
      persistenceSchemaVersion: 1,
      responseAssimilationRecordId:
        optionalRef(input.responseAssimilationRecordId) ??
        nextResponseId(this.idGenerator, "responseAssimilationRecord"),
      dispositionRef: requireRef(input.dispositionRef, "dispositionRef"),
      taskId: requireRef(input.taskId, "taskId"),
      cycleId: requireRef(input.cycleId, "cycleId"),
      requestId: requireRef(input.requestId, "requestId"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      evidenceCaptureBundleRef: requireRef(input.evidenceCaptureBundleRef, "evidenceCaptureBundleRef"),
      evidenceSnapshotRef: optionalRef(input.evidenceSnapshotRef),
      evidenceAssimilationRef: requireRef(input.evidenceAssimilationRef, "evidenceAssimilationRef"),
      materialDeltaAssessmentRef: requireRef(
        input.materialDeltaAssessmentRef,
        "materialDeltaAssessmentRef",
      ),
      classificationDecisionRef: requireRef(
        input.classificationDecisionRef,
        "classificationDecisionRef",
      ),
      safetyPreemptionRef: optionalRef(input.safetyPreemptionRef),
      safetyDecisionRef: optionalRef(input.safetyDecisionRef),
      urgentDiversionSettlementRef: optionalRef(input.urgentDiversionSettlementRef),
      deltaFeatureRefs: uniqueSortedRefs(input.deltaFeatureRefs ?? []),
      impactedRuleRefs: uniqueSortedRefs(input.impactedRuleRefs ?? []),
      conflictVectorRef: optionalRef(input.conflictVectorRef),
      requestedSafetyState: input.requestedSafetyState ?? null,
      safetyDecisionOutcome: input.safetyDecisionOutcome ?? null,
      resultingSafetyDecisionEpoch: ensureNonNegativeInteger(
        input.resultingSafetyDecisionEpoch ?? 0,
        "resultingSafetyDecisionEpoch",
      ),
      routingOutcome: input.routingOutcome,
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: 1,
    };
    await this.repositories.saveResponseAssimilationRecord(record);
    return record;
  }

  async createSupervisorReviewRequirement(
    input: CreateSupervisorReviewRequirementInput,
  ): Promise<MoreInfoSupervisorReviewRequirementSnapshot> {
    const requirement: PersistedMoreInfoSupervisorReviewRequirementRow = {
      aggregateType: "MoreInfoSupervisorReviewRequirement",
      persistenceSchemaVersion: 1,
      supervisorReviewRequirementId:
        optionalRef(input.supervisorReviewRequirementId) ??
        nextResponseId(this.idGenerator, "moreInfoSupervisorReviewRequirement"),
      taskId: requireRef(input.taskId, "taskId"),
      cycleId: requireRef(input.cycleId, "cycleId"),
      requestId: requireRef(input.requestId, "requestId"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      triggeringResponseAssimilationRef: requireRef(
        input.triggeringResponseAssimilationRef,
        "triggeringResponseAssimilationRef",
      ),
      windowStartAt: ensureIsoTimestamp(input.windowStartAt, "windowStartAt"),
      windowEndsAt: ensureIsoTimestamp(input.windowEndsAt, "windowEndsAt"),
      reopenCountWithinWindow: ensurePositiveInteger(
        input.reopenCountWithinWindow,
        "reopenCountWithinWindow",
      ),
      suppressAutomaticRoutineQueue: Boolean(input.suppressAutomaticRoutineQueue),
      reasonCodeRefs: uniqueSortedRefs(input.reasonCodeRefs ?? []),
      createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
      version: 1,
    };
    await this.repositories.saveSupervisorReviewRequirement(requirement);
    return requirement;
  }
}

export function createPhase3MoreInfoResponseResafetyService(
  repositories: MoreInfoResponseResafetyRepositories = createPhase3MoreInfoResponseResafetyStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3MoreInfoResponseResafetyService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_more_info_response_resafety");
  return new Phase3MoreInfoResponseResafetyServiceImpl(repositories, idGenerator);
}
