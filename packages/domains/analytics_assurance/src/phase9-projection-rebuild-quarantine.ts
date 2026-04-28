import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  buildAssuranceLedgerEntry,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceIngestCheckpoint,
  type AssuranceLedgerEntry,
  type AssuranceSliceTrustRecord,
  type ControlStatusSnapshot,
  type Phase9AssuranceCompletenessState,
  type Phase9AssuranceTrustState,
  type ProjectionHealthSnapshot,
} from "./phase9-assurance-ledger-contracts";
import {
  PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
  createPhase9AssuranceIngestFixture,
} from "./phase9-assurance-ingest-service";
import { PHASE9_GRAPH_VERDICT_ENGINE_VERSION } from "./phase9-assurance-graph-verdict-engine";
import {
  PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  createPhase9OperationalProjectionEngineFixture,
} from "./phase9-operational-projection-engine";
import {
  PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  createPhase9EssentialFunctionMetricsFixture,
} from "./phase9-essential-function-metrics";
import {
  PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  createPhase9ResilienceActionSettlementFixture,
} from "./phase9-resilience-action-settlement";
import type {
  OperationalActionEligibilityState,
  OperationalFreshnessState,
  OperationalRenderMode,
  OperationalSurfaceCode,
  OpsOverviewSliceEnvelope,
} from "./phase9-operational-projection-contracts";

export const PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION =
  "446.phase9.projection-rebuild-quarantine.v1";

export type ProjectionRawEventKind =
  | "projection_input"
  | "command_settlement"
  | "trust_record"
  | "graph_verdict"
  | "recovery_evidence";
export type ProjectionRebuildRunState = "queued" | "running" | "matched" | "diverged" | "blocked";
export type ProjectionRebuildInputCoverageState =
  | "complete"
  | "missing"
  | "duplicated"
  | "out_of_order"
  | "tenant_crossing"
  | "incompatible";
export type ProducerNamespaceQuarantineState = "clear" | "quarantined" | "released";
export type ProducerNamespaceQuarantineReason =
  | "none"
  | "out_of_order_sequence"
  | "conflicting_duplicate"
  | "incompatible_schema"
  | "unknown_mandatory_namespace"
  | "tenant_crossing"
  | "manual_governance_hold"
  | "replay_divergence";
export type ProjectionReplayRequirement = "exact" | "deterministic_summary";
export type DegradedSliceAttestationGateState =
  | "not_required"
  | "attestation_required"
  | "attested_degraded_allowed"
  | "blocked_quarantined";
export type QuarantineImpactSurface = "operations" | "assurance_pack" | "retention" | "resilience";
export type ProjectionQuarantineLedgerEventType = "quarantine" | "release";

export interface ProjectionRebuildActorContext {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly generatedAt: string;
}

export interface ProjectionRawEvent {
  readonly eventRef: string;
  readonly eventKind: ProjectionRawEventKind;
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly tenantId: string;
  readonly sequence: number;
  readonly occurredAt: string;
  readonly payload: unknown;
  readonly mandatory: boolean;
  readonly sourceHash: string;
}

export interface ProducerNamespaceRegistration {
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly tenantIds: readonly string[];
  readonly mandatory: boolean;
  readonly dependentSliceRefs: readonly string[];
  readonly dependentProjectionCodes: readonly string[];
}

export interface ProjectionRebuildRun {
  readonly projectionRebuildRunId: string;
  readonly projectionCode: string;
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly timeWindow: string;
  readonly producerNamespaceRefs: readonly string[];
  readonly schemaVersionRefs: readonly string[];
  readonly normalizationVersionRef: string;
  readonly projectionVersionRef: string;
  readonly replayRequirement: ProjectionReplayRequirement;
  readonly expectedInputRefs: readonly string[];
  readonly observedInputRefs: readonly string[];
  readonly inputCoverageState: ProjectionRebuildInputCoverageState;
  readonly coverageScore: number;
  readonly replayMatchScore: number;
  readonly determinismState: "deterministic" | "approximate" | "diverged" | "unknown";
  readonly lagMs: number;
  readonly stalenessState: "fresh" | "near_stale" | "stale" | "blocked";
  readonly snapshotHash: string;
  readonly rebuildHash: string;
  readonly integrityScore: number;
  readonly affectedAudienceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly runState: ProjectionRebuildRunState;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly runHash: string;
}

export interface ProjectionSnapshotComparison {
  readonly projectionCode: string;
  readonly snapshotHash: string;
  readonly rebuildHash: string;
  readonly equal: boolean;
  readonly exactReplayRequired: boolean;
  readonly actionabilityFrozen: boolean;
  readonly comparisonHash: string;
}

export interface ProducerNamespaceQuarantineRecord {
  readonly producerNamespaceQuarantineRecordId: string;
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly tenantId: string;
  readonly sourceEventRef: string;
  readonly sourceSequenceRef: string;
  readonly quarantineState: ProducerNamespaceQuarantineState;
  readonly quarantineReason: ProducerNamespaceQuarantineReason;
  readonly affectedSliceRefs: readonly string[];
  readonly affectedProjectionCodes: readonly string[];
  readonly blockingProducerRefs: readonly string[];
  readonly blockingNamespaceRefs: readonly string[];
  readonly idempotencyKey: string;
  readonly recordedAt: string;
  readonly supersedesQuarantineRecordRef?: string;
  readonly recordHash: string;
}

export interface ProjectionCheckpointDecision {
  readonly decision: "accepted" | "idempotent_duplicate" | "quarantined";
  readonly checkpoint: AssuranceIngestCheckpoint;
  readonly quarantineRecord?: ProducerNamespaceQuarantineRecord;
  readonly eventHash: string;
}

export interface SliceTrustEvaluationInput {
  readonly sliceRef: string;
  readonly scopeRef: string;
  readonly audienceTier: string;
  readonly freshnessScore: number;
  readonly coverageScore: number;
  readonly lineageScore: number;
  readonly replayScore: number;
  readonly consistencyScore: number;
  readonly hardBlockState?: boolean;
  readonly blockingProducerRefs?: readonly string[];
  readonly blockingNamespaceRefs?: readonly string[];
  readonly evaluationModelRef: string;
  readonly evaluatedAt: string;
  readonly previousRecords?: readonly AssuranceSliceTrustRecord[];
}

export interface QuarantineImpactExplanation {
  readonly quarantineImpactExplanationId: string;
  readonly scopeRef: string;
  readonly sliceRef: string;
  readonly trustRecordRef: string;
  readonly impactedSurfaces: readonly QuarantineImpactSurface[];
  readonly affectedControlRefs: readonly string[];
  readonly affectedPackRefs: readonly string[];
  readonly affectedRetentionJobRefs: readonly string[];
  readonly affectedResiliencePostureRefs: readonly string[];
  readonly operationsActionEligibilityState: OperationalActionEligibilityState;
  readonly operationsRenderMode: OperationalRenderMode;
  readonly blockerRefs: readonly string[];
  readonly generatedAt: string;
  readonly explanationHash: string;
}

export interface DegradedSliceAttestationGate {
  readonly degradedSliceAttestationGateId: string;
  readonly packRef: string;
  readonly requiredTrustRecordRefs: readonly string[];
  readonly degradedTrustRecordRefs: readonly string[];
  readonly quarantinedTrustRecordRefs: readonly string[];
  readonly attestationRef?: string;
  readonly gateState: DegradedSliceAttestationGateState;
  readonly blockerRefs: readonly string[];
  readonly evaluatedAt: string;
  readonly gateHash: string;
}

export interface ProjectionQuarantineLedgerWriteback {
  readonly writebackId: string;
  readonly eventType: ProjectionQuarantineLedgerEventType;
  readonly quarantineRecordRef: string;
  readonly supersedingTrustRecordRef: string;
  readonly assuranceLedgerEntry: AssuranceLedgerEntry;
  readonly graphEdgeRefs: readonly string[];
  readonly affectedProjectionRefs: readonly string[];
  readonly writebackHash: string;
  readonly writtenAt: string;
}

export interface Phase9ProjectionRebuildQuarantineFixture {
  readonly schemaVersion: typeof PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION;
  readonly upstreamIngestSchemaVersion: typeof PHASE9_ASSURANCE_INGEST_SERVICE_VERSION;
  readonly upstreamGraphVerdictSchemaVersion: typeof PHASE9_GRAPH_VERDICT_ENGINE_VERSION;
  readonly upstreamOperationalProjectionSchemaVersion: typeof PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION;
  readonly upstreamMetricSchemaVersion: typeof PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION;
  readonly upstreamResilienceSchemaVersion: typeof PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly deterministicRebuildRun: ProjectionRebuildRun;
  readonly matchingComparison: ProjectionSnapshotComparison;
  readonly divergentRebuildRun: ProjectionRebuildRun;
  readonly divergentComparison: ProjectionSnapshotComparison;
  readonly commandFollowingRun: ProjectionRebuildRun;
  readonly exactDuplicateDecision: ProjectionCheckpointDecision;
  readonly conflictingDuplicateDecision: ProjectionCheckpointDecision;
  readonly outOfOrderDecision: ProjectionCheckpointDecision;
  readonly incompatibleSchemaDecision: ProjectionCheckpointDecision;
  readonly unknownNamespaceDecision: ProjectionCheckpointDecision;
  readonly trustedSliceFirstEvaluation: AssuranceSliceTrustRecord;
  readonly trustedSliceSecondEvaluation: AssuranceSliceTrustRecord;
  readonly degradedSliceEvaluation: AssuranceSliceTrustRecord;
  readonly hardBlockedSliceEvaluation: AssuranceSliceTrustRecord;
  readonly unaffectedSliceEvaluation: AssuranceSliceTrustRecord;
  readonly quarantinedControlStatus: ControlStatusSnapshot;
  readonly downgradedOpsSliceEnvelope: OpsOverviewSliceEnvelope;
  readonly degradedSliceAttestationGate: DegradedSliceAttestationGate;
  readonly releasedQuarantineRecord: ProducerNamespaceQuarantineRecord;
  readonly releaseTrustRecord: AssuranceSliceTrustRecord;
  readonly quarantineImpactExplanation: QuarantineImpactExplanation;
  readonly quarantineLedgerWriteback: ProjectionQuarantineLedgerWriteback;
  readonly releaseLedgerWriteback: ProjectionQuarantineLedgerWriteback;
  readonly tenantDeniedErrorCode: string;
  readonly authorizationDeniedErrorCode: string;
  readonly replayHash: string;
}

export class Phase9ProjectionRebuildQuarantineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9ProjectionRebuildQuarantineError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9ProjectionRebuildQuarantineError(code, message);
  }
}

function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => compact(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, compact(entry)]),
    );
  }
  return value;
}

function projectionQuarantineHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(compact(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, Number(value.toFixed(6))));
}

function sourceEventHash(input: Omit<ProjectionRawEvent, "sourceHash">): string {
  return projectionQuarantineHash(
    {
      eventRef: input.eventRef,
      eventKind: input.eventKind,
      producerRef: input.producerRef,
      namespaceRef: input.namespaceRef,
      schemaVersionRef: input.schemaVersionRef,
      tenantId: input.tenantId,
      sequence: input.sequence,
      payload: input.payload,
    },
    "phase9.446.raw-event",
  );
}

function scopeMatchesTenant(scopeTokenRef: string, tenantId: string): boolean {
  return scopeTokenRef.includes(tenantId);
}

function sequenceRef(sequence: number): string {
  return `seq:${sequence.toString().padStart(6, "0")}`;
}

function checkpointKey(input: {
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly tenantId: string;
}): string {
  return `${input.tenantId}|${input.producerRef}|${input.namespaceRef}|${input.schemaVersionRef}`;
}

function requireProjectionActor(actor: ProjectionRebuildActorContext, action: string): void {
  invariant(
    actor.roleRefs.includes("assurance_operator") ||
      actor.roleRefs.includes("assurance_governance"),
    "PROJECTION_QUARANTINE_ROLE_DENIED",
    `${action} requires assurance operator or governance role.`,
  );
  invariant(
    actor.purposeOfUseRef.startsWith("assurance:projection") ||
      actor.purposeOfUseRef.startsWith("assurance:quarantine"),
    "PROJECTION_QUARANTINE_PURPOSE_DENIED",
    `${action} requires assurance projection or quarantine purpose.`,
  );
  invariant(
    actor.reasonRef.length > 0,
    "PROJECTION_QUARANTINE_REASON_REQUIRED",
    `${action} requires an immutable reason ref.`,
  );
  invariant(
    actor.idempotencyKey.length > 0,
    "PROJECTION_QUARANTINE_IDEMPOTENCY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  invariant(
    scopeMatchesTenant(actor.scopeTokenRef, actor.tenantId),
    "PROJECTION_QUARANTINE_TENANT_DENIED",
    `${action} scope token must match tenant.`,
  );
}

function buildCheckpoint(input: {
  readonly event: ProjectionRawEvent;
  readonly quarantineState: ProducerNamespaceQuarantineState;
  readonly quarantineReason?: ProducerNamespaceQuarantineReason;
  readonly updatedAt: string;
}): AssuranceIngestCheckpoint {
  const checkpointBase = {
    producerRef: input.event.producerRef,
    namespaceRef: input.event.namespaceRef,
    schemaVersionRef: input.event.schemaVersionRef,
    tenantId: input.event.tenantId,
    lastAcceptedSequenceRef: sequenceRef(input.event.sequence),
    lastAcceptedEventRef: input.event.eventRef,
    lastAcceptedHash: input.event.sourceHash,
    quarantineState: input.quarantineState,
    quarantineReason: input.quarantineReason === "none" ? undefined : input.quarantineReason,
    updatedAt: input.updatedAt,
  };
  return {
    assuranceIngestCheckpointId: `aic_446_${projectionQuarantineHash(
      checkpointBase,
      "phase9.446.checkpoint",
    ).slice(0, 16)}`,
    producerRef: input.event.producerRef,
    namespaceRef: input.event.namespaceRef,
    schemaVersionRef: input.event.schemaVersionRef,
    lastAcceptedSequenceRef: sequenceRef(input.event.sequence),
    lastAcceptedEventRef: input.event.eventRef,
    lastAcceptedHash: input.event.sourceHash,
    quarantineState: input.quarantineState === "released" ? "released" : input.quarantineState,
    quarantineReason: input.quarantineReason === "none" ? undefined : input.quarantineReason,
    updatedAt: input.updatedAt,
  };
}

export class Phase9ProjectionRebuildQuarantineService {
  private readonly registrations = new Map<string, ProducerNamespaceRegistration>();
  private readonly checkpoints = new Map<string, AssuranceIngestCheckpoint>();
  private readonly eventHashesBySequence = new Map<string, string>();
  private readonly quarantineRecords = new Map<string, ProducerNamespaceQuarantineRecord>();
  private readonly rebuildRuns = new Map<string, ProjectionRebuildRun>();

  constructor(registrations: readonly ProducerNamespaceRegistration[] = []) {
    for (const registration of registrations) {
      this.registerProducerNamespace(registration);
    }
  }

  registerProducerNamespace(registration: ProducerNamespaceRegistration): void {
    this.registrations.set(
      `${registration.producerRef}|${registration.namespaceRef}|${registration.schemaVersionRef}`,
      registration,
    );
  }

  triggerProjectionRebuild(input: {
    readonly actor: ProjectionRebuildActorContext;
    readonly projectionCode: string;
    readonly scopeRef: string;
    readonly timeWindow: string;
    readonly rawEvents: readonly ProjectionRawEvent[];
    readonly expectedInputRefs: readonly string[];
    readonly storedSnapshotHash?: string;
    readonly replayRequirement?: ProjectionReplayRequirement;
    readonly projectionVersionRef?: string;
    readonly affectedAudienceRefs: readonly string[];
    readonly lagMs?: number;
  }): ProjectionRebuildRun {
    requireProjectionActor(input.actor, "triggerProjectionRebuild");
    const replayRequirement = input.replayRequirement ?? "exact";
    const orderedEvents = [...input.rawEvents].sort(
      (left, right) =>
        left.tenantId.localeCompare(right.tenantId) ||
        left.producerRef.localeCompare(right.producerRef) ||
        left.namespaceRef.localeCompare(right.namespaceRef) ||
        left.sequence - right.sequence ||
        left.eventRef.localeCompare(right.eventRef),
    );
    const observedInputRefs = sortedUnique(orderedEvents.map((event) => event.eventRef));
    const missingInputRefs = input.expectedInputRefs.filter(
      (ref) => !observedInputRefs.includes(ref),
    );
    const hasTenantCrossing = orderedEvents.some(
      (event) => event.tenantId !== input.actor.tenantId,
    );
    const hasIncompatible = orderedEvents.some((event) => !this.registrationFor(event));
    const duplicateGroups = new Map<string, Set<string>>();
    for (const event of orderedEvents) {
      const key = `${event.producerRef}|${event.namespaceRef}|${event.schemaVersionRef}|${event.tenantId}|${event.sequence}`;
      duplicateGroups.set(key, new Set([...(duplicateGroups.get(key) ?? []), event.sourceHash]));
    }
    const hasConflictingDuplicate = [...duplicateGroups.values()].some((hashes) => hashes.size > 1);
    const hasOutOfOrder = this.hasOutOfOrderGap(orderedEvents);
    const inputCoverageState: ProjectionRebuildInputCoverageState = hasTenantCrossing
      ? "tenant_crossing"
      : hasIncompatible
        ? "incompatible"
        : hasConflictingDuplicate
          ? "duplicated"
          : hasOutOfOrder
            ? "out_of_order"
            : missingInputRefs.length > 0
              ? "missing"
              : "complete";
    const projectionOutput = {
      projectionCode: input.projectionCode,
      scopeRef: input.scopeRef,
      timeWindow: input.timeWindow,
      eventRefs: observedInputRefs,
      eventHashRoot: orderedSetHash(
        orderedEvents.map((event) => event.sourceHash),
        "phase9.446.rebuild-event-root",
      ),
      eventCount: orderedEvents.length,
    };
    const rebuildHash = projectionQuarantineHash(projectionOutput, "phase9.446.rebuild-output");
    const snapshotHash = input.storedSnapshotHash ?? rebuildHash;
    const equal = snapshotHash === rebuildHash;
    const coverageScore = clampScore(
      input.expectedInputRefs.length === 0
        ? 1
        : observedInputRefs.filter((ref) => input.expectedInputRefs.includes(ref)).length /
            input.expectedInputRefs.length,
    );
    const replayMatchScore = equal ? 1 : replayRequirement === "exact" ? 0 : 0.72;
    const integrityScore = clampScore((coverageScore + replayMatchScore + (equal ? 1 : 0)) / 3);
    const blockerRefs = sortedUnique([
      ...missingInputRefs.map((ref) => `missing-input:${ref}`),
      ...(hasTenantCrossing ? ["tenant-crossing"] : []),
      ...(hasIncompatible ? ["incompatible-schema-or-namespace"] : []),
      ...(hasConflictingDuplicate ? ["conflicting-duplicate"] : []),
      ...(hasOutOfOrder ? ["out-of-order-sequence"] : []),
      ...(!equal ? ["rebuild-hash-mismatch"] : []),
    ]);
    const runState: ProjectionRebuildRunState =
      inputCoverageState !== "complete"
        ? "blocked"
        : equal
          ? "matched"
          : replayRequirement === "exact"
            ? "blocked"
            : "diverged";
    const base = {
      projectionCode: input.projectionCode,
      tenantId: input.actor.tenantId,
      scopeRef: input.scopeRef,
      timeWindow: input.timeWindow,
      producerNamespaceRefs: sortedUnique(
        orderedEvents.map((event) => `${event.producerRef}:${event.namespaceRef}`),
      ),
      schemaVersionRefs: sortedUnique(orderedEvents.map((event) => event.schemaVersionRef)),
      normalizationVersionRef: "normalization:446:projection-replay:v1",
      projectionVersionRef:
        input.projectionVersionRef ?? PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
      replayRequirement,
      expectedInputRefs: sortedUnique(input.expectedInputRefs),
      observedInputRefs,
      inputCoverageState,
      coverageScore,
      replayMatchScore,
      determinismState:
        inputCoverageState === "complete" && equal
          ? ("deterministic" as const)
          : replayRequirement === "exact"
            ? ("diverged" as const)
            : ("approximate" as const),
      lagMs: input.lagMs ?? 0,
      stalenessState:
        inputCoverageState !== "complete"
          ? ("blocked" as const)
          : input.lagMs && input.lagMs > 300000
            ? ("stale" as const)
            : ("fresh" as const),
      snapshotHash,
      rebuildHash,
      integrityScore,
      affectedAudienceRefs: sortedUnique(input.affectedAudienceRefs),
      blockerRefs,
      runState,
      startedAt: input.actor.generatedAt,
      completedAt: input.actor.generatedAt,
    };
    const runHash = projectionQuarantineHash(base, "phase9.446.rebuild-run");
    const run: ProjectionRebuildRun = {
      projectionRebuildRunId: `prr_446_${runHash.slice(0, 16)}`,
      ...base,
      runHash,
    };
    this.rebuildRuns.set(run.projectionRebuildRunId, run);
    return run;
  }

  createProjectionHealthSnapshot(input: {
    readonly run: ProjectionRebuildRun;
  }): ProjectionHealthSnapshot {
    return {
      projectionHealthSnapshotId: `phs_446_${input.run.runHash.slice(0, 16)}`,
      projectionCode: input.run.projectionCode,
      lagMs: input.run.lagMs,
      stalenessState: input.run.stalenessState,
      rebuildState:
        input.run.runState === "matched" || input.run.runState === "diverged"
          ? "rebuilt"
          : "failed",
      trustState:
        input.run.runState === "matched"
          ? "trusted"
          : input.run.replayRequirement === "exact"
            ? "quarantined"
            : "degraded",
      completenessState: input.run.inputCoverageState === "complete" ? "complete" : "blocked",
      expectedInputRefs: input.run.expectedInputRefs,
      observedInputRefs: input.run.observedInputRefs,
      coverageScore: input.run.coverageScore,
      replayMatchScore: input.run.replayMatchScore,
      determinismState: input.run.determinismState,
      snapshotHash: input.run.snapshotHash,
      rebuildHash: input.run.rebuildHash,
      integrityScore: input.run.integrityScore,
      affectedAudienceRefs: input.run.affectedAudienceRefs,
      capturedAt: input.run.completedAt,
    };
  }

  compareSnapshotVsRebuild(input: {
    readonly run: ProjectionRebuildRun;
  }): ProjectionSnapshotComparison {
    const equal = input.run.snapshotHash === input.run.rebuildHash;
    const base = {
      projectionCode: input.run.projectionCode,
      snapshotHash: input.run.snapshotHash,
      rebuildHash: input.run.rebuildHash,
      equal,
      exactReplayRequired: input.run.replayRequirement === "exact",
      actionabilityFrozen: !equal && input.run.replayRequirement === "exact",
    };
    return {
      ...base,
      comparisonHash: projectionQuarantineHash(base, "phase9.446.snapshot-comparison"),
    };
  }

  processProducerEvent(input: {
    readonly actor: ProjectionRebuildActorContext;
    readonly event: ProjectionRawEvent;
  }): ProjectionCheckpointDecision {
    requireProjectionActor(input.actor, "processProducerEvent");
    const registration = this.registrationFor(input.event);
    if (!registration) {
      const namespaceRegisteredWithDifferentSchema = [...this.registrations.values()].some(
        (candidate) =>
          candidate.producerRef === input.event.producerRef &&
          candidate.namespaceRef === input.event.namespaceRef,
      );
      return this.quarantineEvent(
        input,
        namespaceRegisteredWithDifferentSchema
          ? "incompatible_schema"
          : "unknown_mandatory_namespace",
      );
    }
    if (
      !registration.tenantIds.includes(input.event.tenantId) ||
      input.event.tenantId !== input.actor.tenantId
    ) {
      return this.quarantineEvent(input, "tenant_crossing");
    }
    const identityKey = `${checkpointKey(input.event)}|${input.event.sequence}`;
    const previousEventHash = this.eventHashesBySequence.get(identityKey);
    if (previousEventHash) {
      if (previousEventHash === input.event.sourceHash) {
        const checkpoint = this.checkpoints.get(checkpointKey(input.event));
        invariant(
          checkpoint,
          "PROJECTION_CHECKPOINT_MISSING",
          "Idempotent duplicate needs checkpoint.",
        );
        return { decision: "idempotent_duplicate", checkpoint, eventHash: input.event.sourceHash };
      }
      return this.quarantineEvent(input, "conflicting_duplicate");
    }
    const checkpoint = this.checkpoints.get(checkpointKey(input.event));
    const lastSequence = checkpoint
      ? Number(checkpoint.lastAcceptedSequenceRef.slice("seq:".length))
      : 0;
    if (input.event.sequence !== lastSequence + 1) {
      return this.quarantineEvent(input, "out_of_order_sequence");
    }
    const nextCheckpoint = buildCheckpoint({
      event: input.event,
      quarantineState: "clear",
      quarantineReason: "none",
      updatedAt: input.actor.generatedAt,
    });
    this.checkpoints.set(checkpointKey(input.event), nextCheckpoint);
    this.eventHashesBySequence.set(identityKey, input.event.sourceHash);
    return { decision: "accepted", checkpoint: nextCheckpoint, eventHash: input.event.sourceHash };
  }

  evaluateSliceTrustForScope(input: SliceTrustEvaluationInput): AssuranceSliceTrustRecord {
    const scores = [
      input.freshnessScore,
      input.coverageScore,
      input.lineageScore,
      input.replayScore,
      input.consistencyScore,
    ].map(clampScore);
    const trustScore = clampScore(
      scores.reduce((product, score) => product * Math.max(0.000001, score), 1) **
        (1 / scores.length),
    );
    const trustLowerBound = clampScore(Math.min(...scores, trustScore));
    const hardBlockState = input.hardBlockState === true;
    const previousSameModel = (input.previousRecords ?? []).filter(
      (record) => record.evaluationModelRef === input.evaluationModelRef,
    );
    const previousTrusted = previousSameModel.some((record) => record.trustState === "trusted");
    const previousHigh = previousSameModel.some((record) => record.trustLowerBound >= 0.88);
    const trustState: Phase9AssuranceTrustState = hardBlockState
      ? "quarantined"
      : trustLowerBound < 0.4
        ? "quarantined"
        : previousTrusted && trustLowerBound >= 0.82
          ? "trusted"
          : trustLowerBound >= 0.88 && previousHigh
            ? "trusted"
            : trustLowerBound <= 0
              ? "unknown"
              : "degraded";
    const completenessState: Phase9AssuranceCompletenessState =
      hardBlockState || trustState === "quarantined"
        ? "blocked"
        : input.coverageScore >= 0.98
          ? "complete"
          : "partial";
    const evaluationInputHash = projectionQuarantineHash(
      {
        sliceRef: input.sliceRef,
        scopeRef: input.scopeRef,
        scores,
        hardBlockState,
        blockingProducerRefs: input.blockingProducerRefs ?? [],
        blockingNamespaceRefs: input.blockingNamespaceRefs ?? [],
        previousTrustRefs: previousSameModel.map((record) => record.assuranceSliceTrustRecordId),
      },
      "phase9.446.slice-trust-input",
    );
    return {
      assuranceSliceTrustRecordId: `astr_446_${evaluationInputHash.slice(0, 16)}`,
      sliceRef: input.sliceRef,
      scopeRef: input.scopeRef,
      audienceTier: input.audienceTier,
      trustState,
      completenessState,
      trustScore,
      trustLowerBound,
      freshnessScore: clampScore(input.freshnessScore),
      coverageScore: clampScore(input.coverageScore),
      lineageScore: clampScore(input.lineageScore),
      replayScore: clampScore(input.replayScore),
      consistencyScore: clampScore(input.consistencyScore),
      hardBlockState,
      blockingProducerRefs: sortedUnique(input.blockingProducerRefs ?? []),
      blockingNamespaceRefs: sortedUnique(input.blockingNamespaceRefs ?? []),
      evaluationModelRef: input.evaluationModelRef,
      evaluationInputHash,
      lastEvaluatedAt: input.evaluatedAt,
    };
  }

  createControlStatusSnapshot(input: {
    readonly controlObjectiveId: string;
    readonly tenantId: string;
    readonly latestEvidenceRef: string;
    readonly trustRecords: readonly AssuranceSliceTrustRecord[];
    readonly assuranceEvidenceGraphSnapshotRef: string;
    readonly assuranceGraphCompletenessVerdictRef: string;
    readonly graphHash: string;
    readonly generatedAt: string;
  }): ControlStatusSnapshot {
    const hardBlocked = input.trustRecords.some(
      (record) => record.hardBlockState || record.trustState === "quarantined",
    );
    const lowerBound = Math.min(...input.trustRecords.map((record) => record.trustLowerBound));
    const state = hardBlocked ? "blocked" : lowerBound >= 0.82 ? "satisfied" : "degraded";
    const coverageState = hardBlocked ? "blocked" : lowerBound >= 0.82 ? "satisfied" : "partial";
    const gapReasonRefs = sortedUnique(
      input.trustRecords.flatMap((record) => [
        ...record.blockingProducerRefs.map((ref) => `producer:${ref}`),
        ...record.blockingNamespaceRefs.map((ref) => `namespace:${ref}`),
        ...(record.trustState === "quarantined"
          ? [`trust:${record.assuranceSliceTrustRecordId}`]
          : []),
      ]),
    );
    const decisionHash = projectionQuarantineHash(
      {
        controlObjectiveId: input.controlObjectiveId,
        state,
        coverageState,
        lowerBound,
        gapReasonRefs,
        graphHash: input.graphHash,
      },
      "phase9.446.control-status",
    );
    return {
      controlStatusSnapshotId: `css_446_${decisionHash.slice(0, 16)}`,
      controlObjectiveId: input.controlObjectiveId,
      tenantId: input.tenantId,
      state,
      coverageState,
      freshnessState: hardBlocked ? "quarantined" : "current",
      latestEvidenceRef: input.latestEvidenceRef,
      latestValidatedAt: input.generatedAt,
      coverageScore: clampScore(lowerBound),
      coverageLowerBound: clampScore(lowerBound),
      lineageScore: clampScore(
        Math.min(...input.trustRecords.map((record) => record.lineageScore)),
      ),
      reproducibilityScore: clampScore(
        Math.min(...input.trustRecords.map((record) => record.replayScore)),
      ),
      decisionHash,
      evidenceSetHash: orderedSetHash(
        input.trustRecords.map((record) => record.evaluationInputHash),
        "phase9.446.control-evidence-set",
      ),
      assuranceEvidenceGraphSnapshotRef: input.assuranceEvidenceGraphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: input.assuranceGraphCompletenessVerdictRef,
      graphHash: input.graphHash,
      gapReasonRefs,
      generatedAt: input.generatedAt,
    };
  }

  createOpsOverviewSliceEnvelope(input: {
    readonly surfaceCode: OperationalSurfaceCode;
    readonly projectionRef: string;
    readonly boardTupleHash: string;
    readonly selectedEntityTupleHash: string;
    readonly trustRecord: AssuranceSliceTrustRecord;
    readonly integrityScore: number;
    readonly releaseTrustFreezeVerdictRef: string;
  }): OpsOverviewSliceEnvelope {
    const freshnessState: OperationalFreshnessState =
      input.trustRecord.trustState === "trusted"
        ? "fresh"
        : input.trustRecord.trustState === "degraded"
          ? "stale_review"
          : "read_only";
    const actionEligibilityState: OperationalActionEligibilityState =
      input.trustRecord.trustState === "trusted"
        ? "interactive"
        : input.trustRecord.trustState === "degraded"
          ? "observe_only"
          : "blocked";
    const renderMode: OperationalRenderMode =
      actionEligibilityState === "interactive"
        ? "interactive"
        : actionEligibilityState === "observe_only"
          ? "observe_only"
          : "blocked";
    const envelopeHash = projectionQuarantineHash(
      {
        surfaceCode: input.surfaceCode,
        projectionRef: input.projectionRef,
        boardTupleHash: input.boardTupleHash,
        trustRecordRef: input.trustRecord.assuranceSliceTrustRecordId,
        actionEligibilityState,
        renderMode,
      },
      "phase9.446.ops-slice-envelope",
    );
    return {
      sliceEnvelopeId: `osse_446_${envelopeHash.slice(0, 16)}`,
      surfaceCode: input.surfaceCode,
      projectionRef: input.projectionRef,
      boardTupleHash: input.boardTupleHash,
      selectedEntityTupleHash: input.selectedEntityTupleHash,
      freshnessState,
      trustState: input.trustRecord.trustState,
      trustLowerBound: input.trustRecord.trustLowerBound,
      integrityScore: clampScore(input.integrityScore),
      completenessState: input.trustRecord.completenessState,
      confidenceBandRef: `confidence:446:${input.trustRecord.assuranceSliceTrustRecordId}`,
      blockingDependencyRefs: sortedUnique([
        ...input.trustRecord.blockingProducerRefs,
        ...input.trustRecord.blockingNamespaceRefs,
      ]),
      releaseTrustFreezeVerdictRef: input.releaseTrustFreezeVerdictRef,
      actionEligibilityState,
      diagnosticOnlyReasonRef:
        input.trustRecord.trustState === "trusted"
          ? undefined
          : `slice-trust:${input.trustRecord.trustState}`,
      renderMode,
    };
  }

  evaluateDegradedSliceAttestationGate(input: {
    readonly packRef: string;
    readonly requiredTrustRecords: readonly AssuranceSliceTrustRecord[];
    readonly attestationRef?: string;
    readonly evaluatedAt: string;
  }): DegradedSliceAttestationGate {
    const degradedTrustRecordRefs = input.requiredTrustRecords
      .filter((record) => record.trustState === "degraded")
      .map((record) => record.assuranceSliceTrustRecordId);
    const quarantinedTrustRecordRefs = input.requiredTrustRecords
      .filter((record) => record.trustState === "quarantined")
      .map((record) => record.assuranceSliceTrustRecordId);
    const gateState: DegradedSliceAttestationGateState =
      quarantinedTrustRecordRefs.length > 0
        ? "blocked_quarantined"
        : degradedTrustRecordRefs.length === 0
          ? "not_required"
          : input.attestationRef
            ? "attested_degraded_allowed"
            : "attestation_required";
    const blockerRefs = sortedUnique([
      ...degradedTrustRecordRefs.map((ref) => `degraded:${ref}`),
      ...quarantinedTrustRecordRefs.map((ref) => `quarantined:${ref}`),
      ...(gateState === "attestation_required" ? ["missing-degraded-slice-attestation"] : []),
    ]);
    const gateBase = {
      packRef: input.packRef,
      requiredTrustRecordRefs: input.requiredTrustRecords.map(
        (record) => record.assuranceSliceTrustRecordId,
      ),
      degradedTrustRecordRefs,
      quarantinedTrustRecordRefs,
      attestationRef: input.attestationRef,
      gateState,
      blockerRefs,
      evaluatedAt: input.evaluatedAt,
    };
    const gateHash = projectionQuarantineHash(gateBase, "phase9.446.degraded-slice-gate");
    return {
      degradedSliceAttestationGateId: `dsag_446_${gateHash.slice(0, 16)}`,
      ...gateBase,
      gateHash,
    };
  }

  placeProducerNamespaceQuarantine(input: {
    readonly actor: ProjectionRebuildActorContext;
    readonly producerRef: string;
    readonly namespaceRef: string;
    readonly schemaVersionRef: string;
    readonly sourceEventRef: string;
    readonly sourceSequenceRef: string;
    readonly reason: ProducerNamespaceQuarantineReason;
  }): ProducerNamespaceQuarantineRecord {
    requireProjectionActor(input.actor, "placeProducerNamespaceQuarantine");
    const registration = [...this.registrations.values()].find(
      (candidate) =>
        candidate.producerRef === input.producerRef &&
        candidate.namespaceRef === input.namespaceRef &&
        candidate.schemaVersionRef === input.schemaVersionRef,
    );
    const base = {
      producerRef: input.producerRef,
      namespaceRef: input.namespaceRef,
      schemaVersionRef: input.schemaVersionRef,
      tenantId: input.actor.tenantId,
      sourceEventRef: input.sourceEventRef,
      sourceSequenceRef: input.sourceSequenceRef,
      quarantineState: "quarantined" as const,
      quarantineReason: input.reason,
      affectedSliceRefs: sortedUnique(
        registration?.dependentSliceRefs ?? [`slice:${input.namespaceRef}`],
      ),
      affectedProjectionCodes: sortedUnique(registration?.dependentProjectionCodes ?? []),
      blockingProducerRefs: [input.producerRef],
      blockingNamespaceRefs: [input.namespaceRef],
      idempotencyKey: input.actor.idempotencyKey,
      recordedAt: input.actor.generatedAt,
    };
    const recordHash = projectionQuarantineHash(base, "phase9.446.quarantine-record");
    const record: ProducerNamespaceQuarantineRecord = {
      producerNamespaceQuarantineRecordId: `pnqr_446_${recordHash.slice(0, 16)}`,
      ...base,
      recordHash,
    };
    this.quarantineRecords.set(record.producerNamespaceQuarantineRecordId, record);
    return record;
  }

  releaseProducerNamespaceQuarantine(input: {
    readonly actor: ProjectionRebuildActorContext;
    readonly quarantineRecord: ProducerNamespaceQuarantineRecord;
    readonly causeResolutionRef: string;
    readonly replayEquality: boolean;
    readonly graphCompletenessVerdictState: "complete" | "stale" | "blocked";
  }): ProducerNamespaceQuarantineRecord {
    requireProjectionActor(input.actor, "releaseProducerNamespaceQuarantine");
    invariant(
      input.causeResolutionRef.length > 0 &&
        input.replayEquality &&
        input.graphCompletenessVerdictState === "complete",
      "PROJECTION_QUARANTINE_RELEASE_DENIED",
      "Quarantine release requires cause resolution, exact replay equality, and complete graph verdict.",
    );
    const base = {
      producerRef: input.quarantineRecord.producerRef,
      namespaceRef: input.quarantineRecord.namespaceRef,
      schemaVersionRef: input.quarantineRecord.schemaVersionRef,
      tenantId: input.actor.tenantId,
      sourceEventRef: input.quarantineRecord.sourceEventRef,
      sourceSequenceRef: input.quarantineRecord.sourceSequenceRef,
      quarantineState: "released" as const,
      quarantineReason: "none" as const,
      affectedSliceRefs: input.quarantineRecord.affectedSliceRefs,
      affectedProjectionCodes: input.quarantineRecord.affectedProjectionCodes,
      blockingProducerRefs: [] as readonly string[],
      blockingNamespaceRefs: [] as readonly string[],
      idempotencyKey: input.actor.idempotencyKey,
      recordedAt: input.actor.generatedAt,
      supersedesQuarantineRecordRef: input.quarantineRecord.producerNamespaceQuarantineRecordId,
    };
    const recordHash = projectionQuarantineHash(
      {
        ...base,
        causeResolutionRef: input.causeResolutionRef,
        replayEquality: input.replayEquality,
      },
      "phase9.446.quarantine-release",
    );
    const record: ProducerNamespaceQuarantineRecord = {
      producerNamespaceQuarantineRecordId: `pnqr_446_${recordHash.slice(0, 16)}`,
      ...base,
      recordHash,
    };
    this.quarantineRecords.set(record.producerNamespaceQuarantineRecordId, record);
    return record;
  }

  explainSliceTrustBlockers(input: {
    readonly trustRecord: AssuranceSliceTrustRecord;
  }): readonly string[] {
    if (input.trustRecord.trustState === "trusted") {
      return ["trusted:two-consecutive-evaluations"];
    }
    return sortedUnique([
      ...input.trustRecord.blockingProducerRefs.map((ref) => `blocking-producer:${ref}`),
      ...input.trustRecord.blockingNamespaceRefs.map((ref) => `blocking-namespace:${ref}`),
      ...(input.trustRecord.hardBlockState ? ["hard-block"] : []),
      `trust-lower-bound:${input.trustRecord.trustLowerBound}`,
    ]);
  }

  createQuarantineImpactExplanation(input: {
    readonly scopeRef: string;
    readonly trustRecord: AssuranceSliceTrustRecord;
    readonly impactedSurfaces: readonly QuarantineImpactSurface[];
    readonly affectedControlRefs: readonly string[];
    readonly affectedPackRefs: readonly string[];
    readonly affectedRetentionJobRefs: readonly string[];
    readonly affectedResiliencePostureRefs: readonly string[];
    readonly generatedAt: string;
  }): QuarantineImpactExplanation {
    const operationsActionEligibilityState: OperationalActionEligibilityState =
      input.trustRecord.trustState === "trusted"
        ? "interactive"
        : input.trustRecord.trustState === "degraded"
          ? "observe_only"
          : "blocked";
    const operationsRenderMode: OperationalRenderMode =
      operationsActionEligibilityState === "interactive"
        ? "interactive"
        : operationsActionEligibilityState === "observe_only"
          ? "observe_only"
          : "blocked";
    const blockerRefs = this.explainSliceTrustBlockers({ trustRecord: input.trustRecord });
    const base = {
      scopeRef: input.scopeRef,
      sliceRef: input.trustRecord.sliceRef,
      trustRecordRef: input.trustRecord.assuranceSliceTrustRecordId,
      impactedSurfaces: [...new Set(input.impactedSurfaces)].sort() as QuarantineImpactSurface[],
      affectedControlRefs: sortedUnique(input.affectedControlRefs),
      affectedPackRefs: sortedUnique(input.affectedPackRefs),
      affectedRetentionJobRefs: sortedUnique(input.affectedRetentionJobRefs),
      affectedResiliencePostureRefs: sortedUnique(input.affectedResiliencePostureRefs),
      operationsActionEligibilityState,
      operationsRenderMode,
      blockerRefs,
      generatedAt: input.generatedAt,
    };
    const explanationHash = projectionQuarantineHash(base, "phase9.446.quarantine-impact");
    return {
      quarantineImpactExplanationId: `qie_446_${explanationHash.slice(0, 16)}`,
      ...base,
      explanationHash,
    };
  }

  writeQuarantineLedgerEvidence(input: {
    readonly actor: ProjectionRebuildActorContext;
    readonly eventType: ProjectionQuarantineLedgerEventType;
    readonly quarantineRecord: ProducerNamespaceQuarantineRecord;
    readonly trustRecord: AssuranceSliceTrustRecord;
    readonly affectedProjectionRefs: readonly string[];
    readonly previousHash?: string;
  }): ProjectionQuarantineLedgerWriteback {
    requireProjectionActor(input.actor, "writeQuarantineLedgerEvidence");
    const graphEdgeRefs = sortedUnique([
      `aege_446_quarantine_${input.quarantineRecord.producerNamespaceQuarantineRecordId}`,
      `aege_446_trust_${input.trustRecord.assuranceSliceTrustRecordId}`,
      ...input.affectedProjectionRefs.map((ref) => `aege_446_projection_${ref}`),
    ]);
    const canonicalPayload = {
      eventType: input.eventType,
      quarantineRecordRef: input.quarantineRecord.producerNamespaceQuarantineRecordId,
      trustRecordRef: input.trustRecord.assuranceSliceTrustRecordId,
      affectedProjectionRefs: sortedUnique(input.affectedProjectionRefs),
      trustState: input.trustRecord.trustState,
      blockingProducerRefs: input.trustRecord.blockingProducerRefs,
      blockingNamespaceRefs: input.trustRecord.blockingNamespaceRefs,
    };
    const ledgerEntry = buildAssuranceLedgerEntry({
      assuranceLedgerEntryId: `ale_446_${projectionQuarantineHash(
        canonicalPayload,
        "phase9.446.ledger.id",
      ).slice(0, 16)}`,
      sourceEventRef: `event:projection-quarantine:${input.quarantineRecord.producerNamespaceQuarantineRecordId}`,
      entryType: "trust_evaluation",
      tenantId: input.actor.tenantId,
      producerRef: PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
      namespaceRef: "analytics_assurance.projection_rebuild",
      schemaVersionRef: PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
      normalizationVersionRef: "normalization:446:quarantine-writeback:v1",
      sourceSequenceRef: `seq:${input.quarantineRecord.producerNamespaceQuarantineRecordId}`,
      sourceBoundedContextRef: "analytics_assurance",
      governingBoundedContextRef: "assurance_and_governance",
      requiredContextBoundaryRefs: ["phase9:assurance-ledger", "phase9:projection-integrity"],
      edgeCorrelationId: input.quarantineRecord.producerNamespaceQuarantineRecordId,
      auditRecordRef: input.quarantineRecord.recordHash,
      causalTokenRef: input.actor.idempotencyKey,
      replayDecisionClass: "exact_replay",
      effectKeyRef: `${input.eventType}:${input.quarantineRecord.producerNamespaceQuarantineRecordId}`,
      controlRefs: ["control:projection-integrity:446", "control:slice-bounded-quarantine"],
      evidenceRefs: [
        input.quarantineRecord.producerNamespaceQuarantineRecordId,
        input.trustRecord.assuranceSliceTrustRecordId,
      ],
      graphEdgeRefs,
      previousHash: input.previousHash ?? GENESIS_ASSURANCE_LEDGER_HASH,
      createdAt: input.actor.generatedAt,
      canonicalPayload,
      inputSetValues: [
        input.quarantineRecord.recordHash,
        input.trustRecord.evaluationInputHash,
        input.affectedProjectionRefs,
      ],
    });
    const writebackBase = {
      eventType: input.eventType,
      quarantineRecordRef: input.quarantineRecord.producerNamespaceQuarantineRecordId,
      trustRecordRef: input.trustRecord.assuranceSliceTrustRecordId,
      ledgerHash: ledgerEntry.hash,
      graphEdgeRefs,
      affectedProjectionRefs: sortedUnique(input.affectedProjectionRefs),
      writtenAt: input.actor.generatedAt,
    };
    const writebackHash = projectionQuarantineHash(writebackBase, "phase9.446.ledger-writeback");
    return {
      writebackId: `pqw_446_${writebackHash.slice(0, 16)}`,
      eventType: input.eventType,
      quarantineRecordRef: input.quarantineRecord.producerNamespaceQuarantineRecordId,
      supersedingTrustRecordRef: input.trustRecord.assuranceSliceTrustRecordId,
      assuranceLedgerEntry: ledgerEntry,
      graphEdgeRefs,
      affectedProjectionRefs: sortedUnique(input.affectedProjectionRefs),
      writebackHash,
      writtenAt: input.actor.generatedAt,
    };
  }

  getRebuildStatus(input: {
    readonly projectionRebuildRunId: string;
  }): ProjectionRebuildRun | undefined {
    return this.rebuildRuns.get(input.projectionRebuildRunId);
  }

  listQuarantinedProducerNamespaces(): readonly ProducerNamespaceQuarantineRecord[] {
    return [...this.quarantineRecords.values()]
      .filter((record) => record.quarantineState === "quarantined")
      .sort((left, right) =>
        left.producerNamespaceQuarantineRecordId.localeCompare(
          right.producerNamespaceQuarantineRecordId,
        ),
      );
  }

  listAffectedControlsPacksRetentionAndResilience(input: {
    readonly explanation: QuarantineImpactExplanation;
  }): Pick<
    QuarantineImpactExplanation,
    | "affectedControlRefs"
    | "affectedPackRefs"
    | "affectedRetentionJobRefs"
    | "affectedResiliencePostureRefs"
    | "impactedSurfaces"
  > {
    return {
      affectedControlRefs: input.explanation.affectedControlRefs,
      affectedPackRefs: input.explanation.affectedPackRefs,
      affectedRetentionJobRefs: input.explanation.affectedRetentionJobRefs,
      affectedResiliencePostureRefs: input.explanation.affectedResiliencePostureRefs,
      impactedSurfaces: input.explanation.impactedSurfaces,
    };
  }

  listWithCursor<T>(
    rows: readonly T[],
    cursor?: string,
    limit = 25,
  ): {
    readonly rows: readonly T[];
    readonly nextCursor?: string;
  } {
    const offset = cursor?.startsWith("cursor:") ? Number(cursor.slice("cursor:".length)) : 0;
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }

  private quarantineEvent(
    input: {
      readonly actor: ProjectionRebuildActorContext;
      readonly event: ProjectionRawEvent;
    },
    reason: ProducerNamespaceQuarantineReason,
  ): ProjectionCheckpointDecision {
    const checkpoint = buildCheckpoint({
      event: input.event,
      quarantineState: "quarantined",
      quarantineReason: reason,
      updatedAt: input.actor.generatedAt,
    });
    this.checkpoints.set(checkpointKey(input.event), checkpoint);
    const record = this.placeProducerNamespaceQuarantine({
      actor: input.actor,
      producerRef: input.event.producerRef,
      namespaceRef: input.event.namespaceRef,
      schemaVersionRef: input.event.schemaVersionRef,
      sourceEventRef: input.event.eventRef,
      sourceSequenceRef: sequenceRef(input.event.sequence),
      reason,
    });
    return {
      decision: "quarantined",
      checkpoint,
      quarantineRecord: record,
      eventHash: input.event.sourceHash,
    };
  }

  private registrationFor(event: ProjectionRawEvent): ProducerNamespaceRegistration | undefined {
    return this.registrations.get(
      `${event.producerRef}|${event.namespaceRef}|${event.schemaVersionRef}`,
    );
  }

  private hasOutOfOrderGap(events: readonly ProjectionRawEvent[]): boolean {
    const lastByScope = new Map<string, number>();
    for (const event of events) {
      const key = checkpointKey(event);
      const previous = lastByScope.get(key) ?? 0;
      if (event.sequence !== previous + 1) {
        return true;
      }
      lastByScope.set(key, event.sequence);
    }
    return false;
  }
}

function rawEvent(input: Omit<ProjectionRawEvent, "sourceHash">): ProjectionRawEvent {
  return { ...input, sourceHash: sourceEventHash(input) };
}

function defaultRegistrations(): ProducerNamespaceRegistration[] {
  return [
    {
      producerRef: "producer:ops-projection",
      namespaceRef: "ops.queue.health",
      schemaVersionRef: "schema:ops.queue.health:v1",
      tenantIds: ["tenant:demo-gp"],
      mandatory: true,
      dependentSliceRefs: ["slice:ops-overview:queue-health"],
      dependentProjectionCodes: ["ops_overview_queue_health"],
    },
    {
      producerRef: "producer:assurance-pack",
      namespaceRef: "assurance.pack.trust",
      schemaVersionRef: "schema:assurance.pack.trust:v1",
      tenantIds: ["tenant:demo-gp"],
      mandatory: true,
      dependentSliceRefs: ["slice:assurance:pack-factory"],
      dependentProjectionCodes: ["assurance_pack_admissibility"],
    },
    {
      producerRef: "producer:resilience",
      namespaceRef: "resilience.recovery.evidence",
      schemaVersionRef: "schema:resilience.recovery.evidence:v1",
      tenantIds: ["tenant:demo-gp"],
      mandatory: true,
      dependentSliceRefs: ["slice:ops-resilience:readiness"],
      dependentProjectionCodes: ["resilience_readiness"],
    },
  ];
}

export function createPhase9ProjectionRebuildQuarantineFixture(): Phase9ProjectionRebuildQuarantineFixture {
  const generatedAt = "2026-04-27T15:10:00.000Z";
  const ingestFixture = createPhase9AssuranceIngestFixture();
  const operationalFixture = createPhase9OperationalProjectionEngineFixture();
  const metricFixture = createPhase9EssentialFunctionMetricsFixture();
  const resilienceFixture = createPhase9ResilienceActionSettlementFixture();
  const service = new Phase9ProjectionRebuildQuarantineService(defaultRegistrations());
  const actor: ProjectionRebuildActorContext = {
    tenantId: "tenant:demo-gp",
    actorRef: "actor:assurance-operator-446",
    roleRefs: ["assurance_operator", "assurance_governance"],
    purposeOfUseRef: "assurance:projection:rebuild",
    reasonRef: "reason:446:projection-replay",
    idempotencyKey: "idem:446:rebuild",
    scopeTokenRef: "scope-token:tenant:demo-gp:assurance",
    generatedAt,
  };
  const event1 = rawEvent({
    eventRef: "event:446:ops:001",
    eventKind: "projection_input",
    producerRef: "producer:ops-projection",
    namespaceRef: "ops.queue.health",
    schemaVersionRef: "schema:ops.queue.health:v1",
    tenantId: "tenant:demo-gp",
    sequence: 1,
    occurredAt: "2026-04-27T15:00:00.000Z",
    payload: { queueCode: "triage_queue", depth: 18, p95Age: "PT42M" },
    mandatory: true,
  });
  const event2 = rawEvent({
    eventRef: "event:446:ops:002",
    eventKind: "command_settlement",
    producerRef: "producer:ops-projection",
    namespaceRef: "ops.queue.health",
    schemaVersionRef: "schema:ops.queue.health:v1",
    tenantId: "tenant:demo-gp",
    sequence: 2,
    occurredAt: "2026-04-27T15:01:00.000Z",
    payload: { queueCode: "triage_queue", settledRef: "settlement:queue:446" },
    mandatory: true,
  });
  const deterministicRebuildRun = service.triggerProjectionRebuild({
    actor,
    projectionCode: "ops_overview_queue_health",
    scopeRef: "scope:tenant:demo-gp:ops",
    timeWindow: "2026-04-27T15:00:00.000Z/2026-04-27T15:10:00.000Z",
    rawEvents: [event2, event1],
    expectedInputRefs: [event1.eventRef, event2.eventRef],
    replayRequirement: "exact",
    affectedAudienceRefs: ["operations", "governance"],
  });
  const matchingComparison = service.compareSnapshotVsRebuild({ run: deterministicRebuildRun });
  const divergentRebuildRun = service.triggerProjectionRebuild({
    actor: { ...actor, idempotencyKey: "idem:446:divergent" },
    projectionCode: "ops_overview_queue_health",
    scopeRef: "scope:tenant:demo-gp:ops",
    timeWindow: "2026-04-27T15:00:00.000Z/2026-04-27T15:10:00.000Z",
    rawEvents: [event1, event2],
    expectedInputRefs: [event1.eventRef, event2.eventRef],
    storedSnapshotHash: "1".repeat(64),
    replayRequirement: "deterministic_summary",
    affectedAudienceRefs: ["operations"],
  });
  const divergentComparison = service.compareSnapshotVsRebuild({ run: divergentRebuildRun });
  const commandFollowingRun = service.triggerProjectionRebuild({
    actor: { ...actor, idempotencyKey: "idem:446:command-following" },
    projectionCode: "command_following_settlement_projection",
    scopeRef: "scope:tenant:demo-gp:ops",
    timeWindow: "2026-04-27T15:00:00.000Z/2026-04-27T15:10:00.000Z",
    rawEvents: [event1, event2],
    expectedInputRefs: [event1.eventRef, event2.eventRef],
    storedSnapshotHash: "2".repeat(64),
    replayRequirement: "exact",
    affectedAudienceRefs: ["operations"],
  });
  const firstDecision = service.processProducerEvent({
    actor: { ...actor, idempotencyKey: "idem:446:accept-1" },
    event: event1,
  });
  const exactDuplicateDecision = service.processProducerEvent({
    actor: { ...actor, idempotencyKey: "idem:446:duplicate-exact" },
    event: event1,
  });
  const conflictingDuplicateEvent = rawEvent({
    ...event1,
    payload: { queueCode: "triage_queue", depth: 999, p95Age: "PT42M" },
  });
  const conflictingDuplicateDecision = service.processProducerEvent({
    actor: { ...actor, idempotencyKey: "idem:446:duplicate-conflict" },
    event: conflictingDuplicateEvent,
  });
  const outOfOrderDecision = service.processProducerEvent({
    actor: { ...actor, idempotencyKey: "idem:446:out-of-order" },
    event: rawEvent({ ...event2, sequence: 4, eventRef: "event:446:ops:004" }),
  });
  const incompatibleSchemaDecision = service.processProducerEvent({
    actor: { ...actor, idempotencyKey: "idem:446:bad-schema" },
    event: rawEvent({
      ...event2,
      eventRef: "event:446:ops:bad-schema",
      sequence: 3,
      schemaVersionRef: "schema:ops.queue.health:v0",
    }),
  });
  const unknownNamespaceDecision = service.processProducerEvent({
    actor: { ...actor, idempotencyKey: "idem:446:unknown-namespace" },
    event: rawEvent({
      ...event2,
      eventRef: "event:446:unknown:001",
      producerRef: "producer:unknown",
      namespaceRef: "unknown.mandatory",
      schemaVersionRef: "schema:unknown:v1",
      sequence: 1,
    }),
  });
  void firstDecision;

  const trustedSliceFirstEvaluation = service.evaluateSliceTrustForScope({
    sliceRef: "slice:ops-overview:queue-health",
    scopeRef: "scope:tenant:demo-gp:ops",
    audienceTier: "operations",
    freshnessScore: 0.96,
    coverageScore: 0.94,
    lineageScore: 0.95,
    replayScore: 0.97,
    consistencyScore: 0.96,
    evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
    evaluatedAt: generatedAt,
  });
  const trustedSliceSecondEvaluation = service.evaluateSliceTrustForScope({
    sliceRef: "slice:ops-overview:queue-health",
    scopeRef: "scope:tenant:demo-gp:ops",
    audienceTier: "operations",
    freshnessScore: 0.96,
    coverageScore: 0.94,
    lineageScore: 0.95,
    replayScore: 0.97,
    consistencyScore: 0.96,
    evaluationModelRef: trustedSliceFirstEvaluation.evaluationModelRef,
    evaluatedAt: generatedAt,
    previousRecords: [trustedSliceFirstEvaluation],
  });
  const degradedSliceEvaluation = service.evaluateSliceTrustForScope({
    sliceRef: "slice:assurance:pack-factory",
    scopeRef: "scope:tenant:demo-gp:assurance",
    audienceTier: "governance",
    freshnessScore: 0.83,
    coverageScore: 0.84,
    lineageScore: 0.86,
    replayScore: 0.84,
    consistencyScore: 0.83,
    evaluationModelRef: trustedSliceFirstEvaluation.evaluationModelRef,
    evaluatedAt: generatedAt,
  });
  const hardBlockedSliceEvaluation = service.evaluateSliceTrustForScope({
    sliceRef: "slice:ops-resilience:readiness",
    scopeRef: "scope:tenant:demo-gp:resilience",
    audienceTier: "operations",
    freshnessScore: 0.9,
    coverageScore: 0.92,
    lineageScore: 0.91,
    replayScore: 0,
    consistencyScore: 0.93,
    hardBlockState: true,
    blockingProducerRefs: ["producer:resilience"],
    blockingNamespaceRefs: ["resilience.recovery.evidence"],
    evaluationModelRef: trustedSliceFirstEvaluation.evaluationModelRef,
    evaluatedAt: generatedAt,
  });
  const unaffectedSliceEvaluation = service.evaluateSliceTrustForScope({
    sliceRef: "slice:communications:delivery",
    scopeRef: "scope:tenant:demo-gp:ops",
    audienceTier: "operations",
    freshnessScore: 0.97,
    coverageScore: 0.96,
    lineageScore: 0.96,
    replayScore: 0.97,
    consistencyScore: 0.95,
    evaluationModelRef: trustedSliceFirstEvaluation.evaluationModelRef,
    evaluatedAt: generatedAt,
    previousRecords: [trustedSliceFirstEvaluation],
  });
  const quarantinedControlStatus = service.createControlStatusSnapshot({
    controlObjectiveId: "control:projection-integrity:446",
    tenantId: "tenant:demo-gp",
    latestEvidenceRef: hardBlockedSliceEvaluation.assuranceSliceTrustRecordId,
    trustRecords: [hardBlockedSliceEvaluation],
    assuranceEvidenceGraphSnapshotRef: ingestFixture.snapshot.assuranceEvidenceGraphSnapshotId,
    assuranceGraphCompletenessVerdictRef: "agcv_446_complete",
    graphHash: ingestFixture.snapshot.graphHash,
    generatedAt,
  });
  const downgradedOpsSliceEnvelope = service.createOpsOverviewSliceEnvelope({
    surfaceCode: "ServiceHealthGrid",
    projectionRef: deterministicRebuildRun.projectionRebuildRunId,
    boardTupleHash: deterministicRebuildRun.runHash,
    selectedEntityTupleHash: event1.sourceHash,
    trustRecord: hardBlockedSliceEvaluation,
    integrityScore: deterministicRebuildRun.integrityScore,
    releaseTrustFreezeVerdictRef: "rtfv_446_live",
  });
  const degradedSliceAttestationGate = service.evaluateDegradedSliceAttestationGate({
    packRef: "pack:446:dspt-monthly",
    requiredTrustRecords: [degradedSliceEvaluation],
    evaluatedAt: generatedAt,
  });
  const manualQuarantineRecord = service.placeProducerNamespaceQuarantine({
    actor: {
      ...actor,
      idempotencyKey: "idem:446:manual-quarantine",
      purposeOfUseRef: "assurance:quarantine:place",
    },
    producerRef: "producer:resilience",
    namespaceRef: "resilience.recovery.evidence",
    schemaVersionRef: "schema:resilience.recovery.evidence:v1",
    sourceEventRef: "event:446:resilience:hold",
    sourceSequenceRef: "seq:000001",
    reason: "replay_divergence",
  });
  const releasedQuarantineRecord = service.releaseProducerNamespaceQuarantine({
    actor: {
      ...actor,
      idempotencyKey: "idem:446:release",
      purposeOfUseRef: "assurance:quarantine:release",
    },
    quarantineRecord: manualQuarantineRecord,
    causeResolutionRef: "cause-resolution:446:replay-equality",
    replayEquality: true,
    graphCompletenessVerdictState: "complete",
  });
  const releaseTrustRecord = service.evaluateSliceTrustForScope({
    sliceRef: "slice:ops-resilience:readiness",
    scopeRef: "scope:tenant:demo-gp:resilience",
    audienceTier: "operations",
    freshnessScore: 0.96,
    coverageScore: 0.95,
    lineageScore: 0.94,
    replayScore: 0.98,
    consistencyScore: 0.96,
    evaluationModelRef: trustedSliceFirstEvaluation.evaluationModelRef,
    evaluatedAt: generatedAt,
    previousRecords: [hardBlockedSliceEvaluation, trustedSliceFirstEvaluation],
  });
  const quarantineImpactExplanation = service.createQuarantineImpactExplanation({
    scopeRef: "scope:tenant:demo-gp:resilience",
    trustRecord: hardBlockedSliceEvaluation,
    impactedSurfaces: ["operations", "assurance_pack", "retention", "resilience"],
    affectedControlRefs: [quarantinedControlStatus.controlStatusSnapshotId],
    affectedPackRefs: ["pack:446:dspt-monthly"],
    affectedRetentionJobRefs: ["disposition-job:443:archive"],
    affectedResiliencePostureRefs: [
      resilienceFixture.recoveryEvidencePack.recoveryEvidencePackId,
      resilienceFixture.surfaceBindingLive.resilienceSurfaceRuntimeBindingId,
    ],
    generatedAt,
  });
  const quarantineLedgerWriteback = service.writeQuarantineLedgerEvidence({
    actor: { ...actor, idempotencyKey: "idem:446:ledger-quarantine" },
    eventType: "quarantine",
    quarantineRecord: manualQuarantineRecord,
    trustRecord: hardBlockedSliceEvaluation,
    affectedProjectionRefs: [deterministicRebuildRun.projectionRebuildRunId],
  });
  const releaseLedgerWriteback = service.writeQuarantineLedgerEvidence({
    actor: { ...actor, idempotencyKey: "idem:446:ledger-release" },
    eventType: "release",
    quarantineRecord: releasedQuarantineRecord,
    trustRecord: releaseTrustRecord,
    affectedProjectionRefs: [deterministicRebuildRun.projectionRebuildRunId],
    previousHash: quarantineLedgerWriteback.assuranceLedgerEntry.hash,
  });
  let tenantDeniedErrorCode = "";
  try {
    service.triggerProjectionRebuild({
      actor: {
        ...actor,
        idempotencyKey: "idem:446:tenant-denied",
        scopeTokenRef: "scope-token:tenant:other",
      },
      projectionCode: "ops_overview_queue_health",
      scopeRef: "scope:tenant:demo-gp:ops",
      timeWindow: "2026-04-27T15:00:00.000Z/2026-04-27T15:10:00.000Z",
      rawEvents: [event1],
      expectedInputRefs: [event1.eventRef],
      affectedAudienceRefs: ["operations"],
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9ProjectionRebuildQuarantineError ? error.code : "UNKNOWN";
  }
  let authorizationDeniedErrorCode = "";
  try {
    service.placeProducerNamespaceQuarantine({
      actor: {
        ...actor,
        idempotencyKey: "idem:446:role-denied",
        roleRefs: ["support_agent"],
        purposeOfUseRef: "assurance:quarantine:place",
      },
      producerRef: "producer:resilience",
      namespaceRef: "resilience.recovery.evidence",
      schemaVersionRef: "schema:resilience.recovery.evidence:v1",
      sourceEventRef: "event:446:resilience:hold",
      sourceSequenceRef: "seq:000002",
      reason: "manual_governance_hold",
    });
  } catch (error) {
    authorizationDeniedErrorCode =
      error instanceof Phase9ProjectionRebuildQuarantineError ? error.code : "UNKNOWN";
  }

  return {
    schemaVersion: PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
    upstreamIngestSchemaVersion: PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
    upstreamGraphVerdictSchemaVersion: PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
    upstreamOperationalProjectionSchemaVersion: PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
    upstreamMetricSchemaVersion: PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
    upstreamResilienceSchemaVersion: PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9B",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9F",
      "data/contracts/435_phase9_assurance_ingest_service_contract.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      "data/contracts/437_phase9_operational_projection_engine_contract.json",
      "data/contracts/438_phase9_essential_function_metrics_contract.json",
      "data/contracts/445_phase9_resilience_action_settlement_contract.json",
    ],
    producedObjects: [
      "ProjectionRebuildRun",
      "ProjectionHealthSnapshot",
      "AssuranceIngestCheckpoint",
      "AssuranceSliceTrustRecord",
      "ProducerNamespaceQuarantineRecord",
      "ControlStatusSnapshot",
      "OpsOverviewSliceEnvelope",
      "DegradedSliceAttestationGate",
      "QuarantineImpactExplanation",
      "ProjectionQuarantineLedgerWriteback",
    ],
    apiSurface: [
      "triggerProjectionRebuild",
      "getRebuildStatus",
      "compareSnapshotVsRebuild",
      "listQuarantinedProducerNamespaces",
      "explainSliceTrustBlockers",
      "placeProducerNamespaceQuarantine",
      "releaseProducerNamespaceQuarantine",
      "evaluateSliceTrustForScope",
      "listAffectedControlsPacksRetentionAndResilience",
      "createProjectionHealthSnapshot",
      "createControlStatusSnapshot",
      "createOpsOverviewSliceEnvelope",
      "evaluateDegradedSliceAttestationGate",
      "writeQuarantineLedgerEvidence",
      "listWithCursor",
    ],
    deterministicRebuildRun,
    matchingComparison,
    divergentRebuildRun,
    divergentComparison,
    commandFollowingRun,
    exactDuplicateDecision,
    conflictingDuplicateDecision,
    outOfOrderDecision,
    incompatibleSchemaDecision,
    unknownNamespaceDecision,
    trustedSliceFirstEvaluation,
    trustedSliceSecondEvaluation,
    degradedSliceEvaluation,
    hardBlockedSliceEvaluation,
    unaffectedSliceEvaluation,
    quarantinedControlStatus,
    downgradedOpsSliceEnvelope,
    degradedSliceAttestationGate,
    releasedQuarantineRecord,
    releaseTrustRecord,
    quarantineImpactExplanation,
    quarantineLedgerWriteback,
    releaseLedgerWriteback,
    tenantDeniedErrorCode,
    authorizationDeniedErrorCode,
    replayHash: orderedSetHash(
      [
        deterministicRebuildRun.runHash,
        divergentRebuildRun.runHash,
        commandFollowingRun.runHash,
        trustedSliceSecondEvaluation.evaluationInputHash,
        hardBlockedSliceEvaluation.evaluationInputHash,
        releaseTrustRecord.evaluationInputHash,
        quarantineLedgerWriteback.assuranceLedgerEntry.hash,
        releaseLedgerWriteback.assuranceLedgerEntry.hash,
        operationalFixture.replayHash,
        metricFixture.replayHash,
      ],
      "phase9.446.fixture.replay",
    ),
  };
}

export function phase9ProjectionRebuildQuarantineSummary(
  fixture: Phase9ProjectionRebuildQuarantineFixture = createPhase9ProjectionRebuildQuarantineFixture(),
): string {
  return [
    "# Phase 9 Projection Rebuild And Slice Quarantine",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Deterministic rebuild hash: ${fixture.deterministicRebuildRun.rebuildHash}`,
    `Divergent rebuild state: ${fixture.divergentRebuildRun.runState}`,
    `Command-following exact replay state: ${fixture.commandFollowingRun.runState}`,
    `Hard-blocked slice trust state: ${fixture.hardBlockedSliceEvaluation.trustState}`,
    `Ops render mode after quarantine: ${fixture.downgradedOpsSliceEnvelope.renderMode}`,
    `Quarantine ledger hash: ${fixture.quarantineLedgerWriteback.assuranceLedgerEntry.hash}`,
    `Release ledger hash: ${fixture.releaseLedgerWriteback.assuranceLedgerEntry.hash}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
  ].join("\n");
}

export function phase9ProjectionRebuildQuarantineMatrixCsv(
  fixture: Phase9ProjectionRebuildQuarantineFixture = createPhase9ProjectionRebuildQuarantineFixture(),
): string {
  const rows = [
    ["case", "recordRef", "state", "blocker"],
    [
      "deterministic_rebuild",
      fixture.deterministicRebuildRun.projectionRebuildRunId,
      fixture.deterministicRebuildRun.runState,
      fixture.deterministicRebuildRun.inputCoverageState,
    ],
    [
      "rebuild_inequality",
      fixture.divergentRebuildRun.projectionRebuildRunId,
      fixture.divergentComparison.equal ? "equal" : "diverged",
      fixture.divergentRebuildRun.blockerRefs.join("|"),
    ],
    [
      "command_following_exact",
      fixture.commandFollowingRun.projectionRebuildRunId,
      fixture.commandFollowingRun.runState,
      fixture.commandFollowingRun.blockerRefs.join("|"),
    ],
    [
      "conflicting_duplicate",
      fixture.conflictingDuplicateDecision.quarantineRecord?.producerNamespaceQuarantineRecordId ??
        "",
      fixture.conflictingDuplicateDecision.decision,
      fixture.conflictingDuplicateDecision.quarantineRecord?.quarantineReason ?? "",
    ],
    [
      "hard_block",
      fixture.hardBlockedSliceEvaluation.assuranceSliceTrustRecordId,
      fixture.hardBlockedSliceEvaluation.trustState,
      fixture.hardBlockedSliceEvaluation.blockingNamespaceRefs.join("|"),
    ],
    [
      "degraded_attestation",
      fixture.degradedSliceAttestationGate.degradedSliceAttestationGateId,
      fixture.degradedSliceAttestationGate.gateState,
      fixture.degradedSliceAttestationGate.blockerRefs.join("|"),
    ],
    [
      "quarantine_release",
      fixture.releasedQuarantineRecord.producerNamespaceQuarantineRecordId,
      fixture.releasedQuarantineRecord.quarantineState,
      fixture.releaseTrustRecord.trustState,
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
