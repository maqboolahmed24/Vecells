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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
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

function ensureUnitInterval(value: number, field: string): number {
  invariant(Number.isFinite(value), `INVALID_${field.toUpperCase()}`, `${field} must be finite.`);
  invariant(
    value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
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

function dominantDuplicateProbability(snapshot: DuplicatePairEvidenceSnapshot): number {
  return Math.max(
    snapshot.piRetry,
    snapshot.piSameRequestAttach,
    snapshot.piSameEpisode,
    snapshot.piRelatedEpisode,
  );
}

function summarizeReasonCodes(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export type DuplicateClusterRelationType =
  | "retry"
  | "same_episode_candidate"
  | "same_episode_confirmed"
  | "related_episode"
  | "review_required";

export type DuplicateClusterReviewStatus =
  | "open"
  | "in_review"
  | "resolved_confirmed"
  | "resolved_separate"
  | "resolved_related"
  | "resolved_retry"
  | "superseded";

export type DuplicateInstabilityState = "stable" | "oscillating" | "blocked_conflict";

export type DuplicatePairEvidenceState = "active" | "superseded";

export type DuplicateDecisionClass =
  | "exact_retry_collapse"
  | "same_request_attach"
  | "same_episode_link"
  | "related_episode_link"
  | "separate_request"
  | "review_required";

export type DuplicateContinuityWitnessClass =
  | "deterministic_replay"
  | "submit_lineage"
  | "workflow_return"
  | "more_info_cycle"
  | "telephony_continuation"
  | "human_review"
  | "none";

export type DuplicateReviewMode = "auto" | "human_review" | "replay_authority";
export type DuplicateDecisionState = "applied" | "superseded" | "reverted";
export type DuplicateUncertaintyBand = "low" | "guarded" | "high";

export interface DuplicateThresholdPolicy {
  thresholdPolicyRef: string;
  retryAutoMin: number;
  sameRequestAttachAutoMin: number;
  sameEpisodeCandidateMin: number;
  sameEpisodeLinkAutoMin: number;
  relatedEpisodeAutoMin: number;
  separateRequestMin: number;
  maxAutoUncertainty: number;
  minClassMargin: number;
  minCandidateMargin: number;
  canonicalConflictDelta: number;
}

export const defaultDuplicateThresholdPolicy = {
  thresholdPolicyRef: "duplicate_threshold_policy::2026-04-12",
  retryAutoMin: 0.93,
  sameRequestAttachAutoMin: 0.58,
  sameEpisodeCandidateMin: 0.4,
  sameEpisodeLinkAutoMin: 0.6,
  relatedEpisodeAutoMin: 0.65,
  separateRequestMin: 0.65,
  maxAutoUncertainty: 0.16,
  minClassMargin: 0.12,
  minCandidateMargin: 0.1,
  canonicalConflictDelta: 0.05,
} as const satisfies DuplicateThresholdPolicy;

export const duplicateThresholdPolicies = [defaultDuplicateThresholdPolicy] as const;

export interface ParallelDuplicateResolutionInterfaceGap {
  gapId: string;
  stubInterface: string;
  lifecycleState: "stubbed_parallel_interface_gap";
  rationale: string;
  sourceRefs: readonly string[];
}

export interface DuplicateLineageSettlementPort {
  applyDuplicateResolutionDecision(input: {
    duplicateResolutionDecisionRef: string;
    decisionClass: DuplicateDecisionClass;
    duplicateClusterRef: string;
    targetRequestRef: string | null;
    targetEpisodeRef: string | null;
  }): Promise<void>;
}

export const duplicateResolutionParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_070_DUPLICATE_LINEAGE_SETTLEMENT_PORT",
    stubInterface: "DuplicateLineageSettlementPort",
    lifecycleState: "stubbed_parallel_interface_gap",
    rationale:
      "par_070 owns immutable duplicate evidence and decision truth, but the later intake/triage orchestration that materializes RequestLineage or child-case side effects is still on a sibling track. The bridge stays bounded behind an explicit settlement port instead of leaking ad hoc merge heuristics into this backbone.",
    sourceRefs: [
      "prompt/070.md",
      "prompt/shared_operating_contract_066_to_075.md",
      "blueprint/phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
      "blueprint/phase-0-the-foundation-protocol.md#1.7B DuplicateResolutionDecision",
    ],
  },
] as const satisfies readonly ParallelDuplicateResolutionInterfaceGap[];

export interface DuplicatePairEvidenceSnapshot {
  pairEvidenceId: string;
  incomingLineageRef: string;
  incomingSnapshotRef: string;
  candidateRequestRef: string;
  candidateEpisodeRef: string;
  replaySignalRefs: readonly string[];
  continuitySignalRefs: readonly string[];
  conflictSignalRefs: readonly string[];
  relationModelVersionRef: string;
  channelCalibrationRef: string;
  thresholdPolicyRef: string;
  featureVectorHash: string;
  piRetry: number;
  piSameRequestAttach: number;
  piSameEpisode: number;
  piRelatedEpisode: number;
  piNewEpisode: number;
  classMargin: number;
  candidateMargin: number;
  uncertaintyScore: number;
  hardBlockerRefs: readonly string[];
  evidenceState: DuplicatePairEvidenceState;
  createdAt: string;
  version: number;
}

export interface PersistedDuplicatePairEvidenceRow extends DuplicatePairEvidenceSnapshot {
  aggregateType: "DuplicatePairEvidence";
  persistenceSchemaVersion: 1;
}

export class DuplicatePairEvidenceDocument {
  private readonly snapshot: DuplicatePairEvidenceSnapshot;

  private constructor(snapshot: DuplicatePairEvidenceSnapshot) {
    this.snapshot = DuplicatePairEvidenceDocument.normalize(snapshot);
  }

  static create(
    input: Omit<DuplicatePairEvidenceSnapshot, "version">,
  ): DuplicatePairEvidenceDocument {
    return new DuplicatePairEvidenceDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DuplicatePairEvidenceSnapshot): DuplicatePairEvidenceDocument {
    return new DuplicatePairEvidenceDocument(snapshot);
  }

  private static normalize(snapshot: DuplicatePairEvidenceSnapshot): DuplicatePairEvidenceSnapshot {
    const createdAt = ensureIsoTimestamp(snapshot.createdAt, "createdAt");
    invariant(
      snapshot.version >= 1,
      "INVALID_DUPLICATE_PAIR_EVIDENCE_VERSION",
      "DuplicatePairEvidence.version must be >= 1.",
    );
    const piRetry = ensureUnitInterval(snapshot.piRetry, "piRetry");
    const piSameRequestAttach = ensureUnitInterval(
      snapshot.piSameRequestAttach,
      "piSameRequestAttach",
    );
    const piSameEpisode = ensureUnitInterval(snapshot.piSameEpisode, "piSameEpisode");
    const piRelatedEpisode = ensureUnitInterval(snapshot.piRelatedEpisode, "piRelatedEpisode");
    const piNewEpisode = ensureUnitInterval(snapshot.piNewEpisode, "piNewEpisode");
    const probabilitySum =
      piRetry + piSameRequestAttach + piSameEpisode + piRelatedEpisode + piNewEpisode;
    invariant(
      Math.abs(probabilitySum - 1) <= 0.001,
      "DUPLICATE_PAIR_EVIDENCE_PROBABILITIES_MUST_SUM_TO_ONE",
      "DuplicatePairEvidence class probabilities must sum to 1.",
    );
    return {
      ...snapshot,
      incomingLineageRef: requireRef(snapshot.incomingLineageRef, "incomingLineageRef"),
      incomingSnapshotRef: requireRef(snapshot.incomingSnapshotRef, "incomingSnapshotRef"),
      candidateRequestRef: requireRef(snapshot.candidateRequestRef, "candidateRequestRef"),
      candidateEpisodeRef: requireRef(snapshot.candidateEpisodeRef, "candidateEpisodeRef"),
      replaySignalRefs: uniqueSortedRefs(snapshot.replaySignalRefs),
      continuitySignalRefs: uniqueSortedRefs(snapshot.continuitySignalRefs),
      conflictSignalRefs: uniqueSortedRefs(snapshot.conflictSignalRefs),
      relationModelVersionRef: requireRef(
        snapshot.relationModelVersionRef,
        "relationModelVersionRef",
      ),
      channelCalibrationRef: requireRef(snapshot.channelCalibrationRef, "channelCalibrationRef"),
      thresholdPolicyRef: requireRef(snapshot.thresholdPolicyRef, "thresholdPolicyRef"),
      featureVectorHash: requireRef(snapshot.featureVectorHash, "featureVectorHash"),
      piRetry,
      piSameRequestAttach,
      piSameEpisode,
      piRelatedEpisode,
      piNewEpisode,
      classMargin: ensureUnitInterval(snapshot.classMargin, "classMargin"),
      candidateMargin: ensureUnitInterval(snapshot.candidateMargin, "candidateMargin"),
      uncertaintyScore: ensureUnitInterval(snapshot.uncertaintyScore, "uncertaintyScore"),
      hardBlockerRefs: uniqueSortedRefs(snapshot.hardBlockerRefs),
      createdAt,
    };
  }

  get pairEvidenceId(): string {
    return this.snapshot.pairEvidenceId;
  }

  get incomingLineageRef(): string {
    return this.snapshot.incomingLineageRef;
  }

  get candidateRequestRef(): string {
    return this.snapshot.candidateRequestRef;
  }

  get candidateEpisodeRef(): string {
    return this.snapshot.candidateEpisodeRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): DuplicatePairEvidenceSnapshot {
    return {
      ...this.snapshot,
      replaySignalRefs: [...this.snapshot.replaySignalRefs],
      continuitySignalRefs: [...this.snapshot.continuitySignalRefs],
      conflictSignalRefs: [...this.snapshot.conflictSignalRefs],
      hardBlockerRefs: [...this.snapshot.hardBlockerRefs],
    };
  }
}

export interface DuplicateClusterSnapshot {
  clusterId: string;
  episodeId: string;
  canonicalRequestId: string;
  memberRequestRefs: readonly string[];
  memberSnapshotRefs: readonly string[];
  candidateRequestRefs: readonly string[];
  pairwiseEvidenceRefs: readonly string[];
  currentResolutionDecisionRef: string | null;
  resolutionDecisionRefs: readonly string[];
  relationType: DuplicateClusterRelationType;
  reviewStatus: DuplicateClusterReviewStatus;
  decisionRef: string | null;
  clusterConfidence: number;
  thresholdPolicyRef: string;
  channelCalibrationRef: string;
  instabilityState: DuplicateInstabilityState;
  lastRecomputedAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedDuplicateClusterRow extends DuplicateClusterSnapshot {
  aggregateType: "DuplicateCluster";
  persistenceSchemaVersion: 1;
}

function clusterReviewStatusForDecision(
  decisionClass: DuplicateDecisionClass,
  decisionState: DuplicateDecisionState,
): DuplicateClusterReviewStatus {
  if (decisionState === "superseded") {
    return "superseded";
  }
  if (decisionState === "reverted") {
    return "open";
  }
  switch (decisionClass) {
    case "exact_retry_collapse":
      return "resolved_retry";
    case "same_request_attach":
    case "same_episode_link":
      return "resolved_confirmed";
    case "related_episode_link":
      return "resolved_related";
    case "separate_request":
      return "resolved_separate";
    case "review_required":
      return "open";
  }
}

function relationTypeForDecision(
  decisionClass: DuplicateDecisionClass,
  fallback: DuplicateClusterRelationType,
): DuplicateClusterRelationType {
  switch (decisionClass) {
    case "exact_retry_collapse":
      return "retry";
    case "same_request_attach":
    case "same_episode_link":
      return "same_episode_confirmed";
    case "related_episode_link":
      return "related_episode";
    case "separate_request":
    case "review_required":
      return fallback;
  }
}

export class DuplicateClusterDocument {
  private readonly snapshot: DuplicateClusterSnapshot;

  private constructor(snapshot: DuplicateClusterSnapshot) {
    this.snapshot = DuplicateClusterDocument.normalize(snapshot);
  }

  static create(input: Omit<DuplicateClusterSnapshot, "version">): DuplicateClusterDocument {
    return new DuplicateClusterDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DuplicateClusterSnapshot): DuplicateClusterDocument {
    return new DuplicateClusterDocument(snapshot);
  }

  private static normalize(snapshot: DuplicateClusterSnapshot): DuplicateClusterSnapshot {
    const createdAt = ensureIsoTimestamp(snapshot.createdAt, "createdAt");
    const updatedAt = ensureIsoTimestamp(snapshot.updatedAt, "updatedAt");
    const lastRecomputedAt = ensureIsoTimestamp(snapshot.lastRecomputedAt, "lastRecomputedAt");
    invariant(
      snapshot.version >= 1,
      "INVALID_DUPLICATE_CLUSTER_VERSION",
      "DuplicateCluster.version must be >= 1.",
    );
    const resolutionDecisionRefs = uniqueSortedRefs(snapshot.resolutionDecisionRefs);
    const currentResolutionDecisionRef = optionalRef(snapshot.currentResolutionDecisionRef);
    const decisionRef = optionalRef(snapshot.decisionRef);
    if (currentResolutionDecisionRef !== null) {
      invariant(
        resolutionDecisionRefs.includes(currentResolutionDecisionRef),
        "DUPLICATE_CLUSTER_CURRENT_DECISION_MUST_BE_RECORDED",
        "DuplicateCluster.currentResolutionDecisionRef must also appear in resolutionDecisionRefs.",
      );
    }
    if (decisionRef !== null) {
      invariant(
        resolutionDecisionRefs.includes(decisionRef),
        "DUPLICATE_CLUSTER_DECISION_REF_MUST_BE_RECORDED",
        "DuplicateCluster.decisionRef must also appear in resolutionDecisionRefs.",
      );
    }
    return {
      ...snapshot,
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      canonicalRequestId: requireRef(snapshot.canonicalRequestId, "canonicalRequestId"),
      memberRequestRefs: uniqueSortedRefs(snapshot.memberRequestRefs),
      memberSnapshotRefs: uniqueSortedRefs(snapshot.memberSnapshotRefs),
      candidateRequestRefs: uniqueSortedRefs(snapshot.candidateRequestRefs),
      pairwiseEvidenceRefs: uniqueSortedRefs(snapshot.pairwiseEvidenceRefs),
      currentResolutionDecisionRef,
      resolutionDecisionRefs,
      decisionRef,
      clusterConfidence: ensureUnitInterval(snapshot.clusterConfidence, "clusterConfidence"),
      thresholdPolicyRef: requireRef(snapshot.thresholdPolicyRef, "thresholdPolicyRef"),
      channelCalibrationRef: requireRef(snapshot.channelCalibrationRef, "channelCalibrationRef"),
      lastRecomputedAt,
      createdAt,
      updatedAt,
    };
  }

  get clusterId(): string {
    return this.snapshot.clusterId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get reviewStatus(): DuplicateClusterReviewStatus {
    return this.snapshot.reviewStatus;
  }

  get currentResolutionDecisionRef(): string | null {
    return this.snapshot.currentResolutionDecisionRef;
  }

  toSnapshot(): DuplicateClusterSnapshot {
    return {
      ...this.snapshot,
      memberRequestRefs: [...this.snapshot.memberRequestRefs],
      memberSnapshotRefs: [...this.snapshot.memberSnapshotRefs],
      candidateRequestRefs: [...this.snapshot.candidateRequestRefs],
      pairwiseEvidenceRefs: [...this.snapshot.pairwiseEvidenceRefs],
      resolutionDecisionRefs: [...this.snapshot.resolutionDecisionRefs],
    };
  }

  recompute(input: {
    episodeId?: string;
    canonicalRequestId?: string;
    memberRequestRefs?: readonly string[];
    memberSnapshotRefs?: readonly string[];
    candidateRequestRefs?: readonly string[];
    pairwiseEvidenceRefs?: readonly string[];
    relationType: DuplicateClusterRelationType;
    clusterConfidence: number;
    thresholdPolicyRef?: string;
    channelCalibrationRef?: string;
    instabilityState: DuplicateInstabilityState;
    lastRecomputedAt: string;
    updatedAt: string;
  }): DuplicateClusterDocument {
    return new DuplicateClusterDocument({
      ...this.snapshot,
      episodeId: input.episodeId ?? this.snapshot.episodeId,
      canonicalRequestId: input.canonicalRequestId ?? this.snapshot.canonicalRequestId,
      memberRequestRefs: input.memberRequestRefs ?? this.snapshot.memberRequestRefs,
      memberSnapshotRefs: input.memberSnapshotRefs ?? this.snapshot.memberSnapshotRefs,
      candidateRequestRefs: input.candidateRequestRefs ?? this.snapshot.candidateRequestRefs,
      pairwiseEvidenceRefs: input.pairwiseEvidenceRefs ?? this.snapshot.pairwiseEvidenceRefs,
      relationType: input.relationType,
      clusterConfidence: input.clusterConfidence,
      thresholdPolicyRef: input.thresholdPolicyRef ?? this.snapshot.thresholdPolicyRef,
      channelCalibrationRef: input.channelCalibrationRef ?? this.snapshot.channelCalibrationRef,
      instabilityState: input.instabilityState,
      lastRecomputedAt: input.lastRecomputedAt,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markInReview(input: { updatedAt: string }): DuplicateClusterDocument {
    invariant(
      this.snapshot.reviewStatus === "open",
      "DUPLICATE_CLUSTER_NOT_OPEN",
      "Only open DuplicateCluster records may move to in_review.",
    );
    return new DuplicateClusterDocument({
      ...this.snapshot,
      reviewStatus: "in_review",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  applyDecision(
    decision: DuplicateResolutionDecisionDocument,
    input: {
      updatedAt: string;
      relationTypeFallback?: DuplicateClusterRelationType;
      clusterConfidence?: number;
    },
  ): DuplicateClusterDocument {
    const decisionSnapshot = decision.toSnapshot();
    const relationType = relationTypeForDecision(
      decisionSnapshot.decisionClass,
      input.relationTypeFallback ?? this.snapshot.relationType,
    );
    return new DuplicateClusterDocument({
      ...this.snapshot,
      relationType,
      reviewStatus: clusterReviewStatusForDecision(
        decisionSnapshot.decisionClass,
        decisionSnapshot.decisionState,
      ),
      currentResolutionDecisionRef:
        decisionSnapshot.decisionState === "applied"
          ? decision.duplicateResolutionDecisionId
          : this.snapshot.currentResolutionDecisionRef,
      decisionRef:
        decisionSnapshot.decisionState === "applied"
          ? decision.duplicateResolutionDecisionId
          : this.snapshot.decisionRef,
      resolutionDecisionRefs: uniqueSortedRefs([
        ...this.snapshot.resolutionDecisionRefs,
        decision.duplicateResolutionDecisionId,
      ]),
      clusterConfidence: input.clusterConfidence ?? this.snapshot.clusterConfidence,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  reopen(input: {
    relationType: DuplicateClusterRelationType;
    instabilityState: DuplicateInstabilityState;
    updatedAt: string;
  }): DuplicateClusterDocument {
    invariant(
      this.snapshot.reviewStatus !== "superseded",
      "SUPERSEDED_CLUSTER_CANNOT_REOPEN",
      "Superseded clusters cannot be reopened.",
    );
    return new DuplicateClusterDocument({
      ...this.snapshot,
      reviewStatus: "open",
      relationType: input.relationType,
      instabilityState: input.instabilityState,
      currentResolutionDecisionRef: null,
      decisionRef: null,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  supersede(input: { updatedAt: string }): DuplicateClusterDocument {
    return new DuplicateClusterDocument({
      ...this.snapshot,
      reviewStatus: "superseded",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface DuplicateResolutionDecisionSnapshot {
  duplicateResolutionDecisionId: string;
  duplicateClusterRef: string;
  incomingLineageRef: string;
  incomingSnapshotRef: string;
  targetRequestRef: string | null;
  targetEpisodeRef: string | null;
  winningPairEvidenceRef: string;
  competingPairEvidenceRefs: readonly string[];
  decisionClass: DuplicateDecisionClass;
  continuityWitnessClass: DuplicateContinuityWitnessClass;
  continuityWitnessRef: string | null;
  reviewMode: DuplicateReviewMode;
  reasonCodes: readonly string[];
  decisionState: DuplicateDecisionState;
  supersedesDecisionRef: string | null;
  downstreamInvalidationRefs: readonly string[];
  decidedByRef: string;
  decidedAt: string;
  revertedAt: string | null;
  version: number;
}

export interface PersistedDuplicateResolutionDecisionRow
  extends DuplicateResolutionDecisionSnapshot {
  aggregateType: "DuplicateResolutionDecision";
  persistenceSchemaVersion: 1;
}

export class DuplicateResolutionDecisionDocument {
  private readonly snapshot: DuplicateResolutionDecisionSnapshot;

  private constructor(snapshot: DuplicateResolutionDecisionSnapshot) {
    this.snapshot = DuplicateResolutionDecisionDocument.normalize(snapshot);
  }

  static create(
    input: Omit<DuplicateResolutionDecisionSnapshot, "version">,
  ): DuplicateResolutionDecisionDocument {
    return new DuplicateResolutionDecisionDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: DuplicateResolutionDecisionSnapshot,
  ): DuplicateResolutionDecisionDocument {
    return new DuplicateResolutionDecisionDocument(snapshot);
  }

  private static normalize(
    snapshot: DuplicateResolutionDecisionSnapshot,
  ): DuplicateResolutionDecisionSnapshot {
    const decidedAt = ensureIsoTimestamp(snapshot.decidedAt, "decidedAt");
    const revertedAt =
      snapshot.revertedAt === null ? null : ensureIsoTimestamp(snapshot.revertedAt, "revertedAt");
    invariant(
      snapshot.version >= 1,
      "INVALID_DUPLICATE_RESOLUTION_DECISION_VERSION",
      "DuplicateResolutionDecision.version must be >= 1.",
    );
    invariant(
      snapshot.decisionClass !== "review_required" || snapshot.reviewMode === "human_review",
      "REVIEW_REQUIRED_DECISION_MUST_BE_HUMAN_VISIBLE",
      "review_required decisions must stay on the human_review path.",
    );
    if (snapshot.decisionClass === "same_request_attach") {
      invariant(
        snapshot.continuityWitnessClass !== "none" && optionalRef(snapshot.continuityWitnessRef),
        "SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
        "same_request_attach requires an explicit continuity witness.",
      );
    }
    if (snapshot.decisionState === "reverted") {
      invariant(
        revertedAt !== null,
        "REVERTED_DECISION_REQUIRES_REVERTED_AT",
        "reverted decisions require revertedAt.",
      );
    }
    return {
      ...snapshot,
      duplicateClusterRef: requireRef(snapshot.duplicateClusterRef, "duplicateClusterRef"),
      incomingLineageRef: requireRef(snapshot.incomingLineageRef, "incomingLineageRef"),
      incomingSnapshotRef: requireRef(snapshot.incomingSnapshotRef, "incomingSnapshotRef"),
      targetRequestRef: optionalRef(snapshot.targetRequestRef),
      targetEpisodeRef: optionalRef(snapshot.targetEpisodeRef),
      winningPairEvidenceRef: requireRef(snapshot.winningPairEvidenceRef, "winningPairEvidenceRef"),
      competingPairEvidenceRefs: uniqueSortedRefs(snapshot.competingPairEvidenceRefs),
      continuityWitnessRef: optionalRef(snapshot.continuityWitnessRef),
      reasonCodes: summarizeReasonCodes(snapshot.reasonCodes),
      supersedesDecisionRef: optionalRef(snapshot.supersedesDecisionRef),
      downstreamInvalidationRefs: uniqueSortedRefs(snapshot.downstreamInvalidationRefs),
      decidedByRef: requireRef(snapshot.decidedByRef, "decidedByRef"),
      decidedAt,
      revertedAt,
    };
  }

  get duplicateResolutionDecisionId(): string {
    return this.snapshot.duplicateResolutionDecisionId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): DuplicateResolutionDecisionSnapshot {
    return {
      ...this.snapshot,
      competingPairEvidenceRefs: [...this.snapshot.competingPairEvidenceRefs],
      reasonCodes: [...this.snapshot.reasonCodes],
      downstreamInvalidationRefs: [...this.snapshot.downstreamInvalidationRefs],
    };
  }

  markSuperseded(): DuplicateResolutionDecisionDocument {
    invariant(
      this.snapshot.decisionState === "applied",
      "ONLY_APPLIED_DECISIONS_CAN_BE_SUPERSEDED",
      "Only applied DuplicateResolutionDecision records may be superseded.",
    );
    return new DuplicateResolutionDecisionDocument({
      ...this.snapshot,
      decisionState: "superseded",
      version: nextVersion(this.snapshot.version),
    });
  }

  markReverted(input: { revertedAt: string }): DuplicateResolutionDecisionDocument {
    invariant(
      this.snapshot.decisionState === "applied",
      "ONLY_APPLIED_DECISIONS_CAN_BE_REVERTED",
      "Only applied DuplicateResolutionDecision records may be reverted.",
    );
    return new DuplicateResolutionDecisionDocument({
      ...this.snapshot,
      decisionState: "reverted",
      revertedAt: input.revertedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  withDownstreamInvalidationRefs(
    downstreamInvalidationRefs: readonly string[],
  ): DuplicateResolutionDecisionDocument {
    return new DuplicateResolutionDecisionDocument({
      ...this.snapshot,
      downstreamInvalidationRefs,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface DuplicatePairEvidenceRepository {
  getDuplicatePairEvidence(
    pairEvidenceId: string,
  ): Promise<DuplicatePairEvidenceDocument | undefined>;
  listDuplicatePairEvidences(): Promise<readonly DuplicatePairEvidenceDocument[]>;
  listDuplicatePairEvidencesForIncomingLineage(
    incomingLineageRef: string,
  ): Promise<readonly DuplicatePairEvidenceDocument[]>;
  saveDuplicatePairEvidence(
    evidence: DuplicatePairEvidenceDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface DuplicateClusterRepository {
  getDuplicateCluster(clusterId: string): Promise<DuplicateClusterDocument | undefined>;
  listDuplicateClusters(): Promise<readonly DuplicateClusterDocument[]>;
  listDuplicateClustersForCanonicalRequest(
    canonicalRequestId: string,
  ): Promise<readonly DuplicateClusterDocument[]>;
  saveDuplicateCluster(
    cluster: DuplicateClusterDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface DuplicateResolutionDecisionRepository {
  getDuplicateResolutionDecision(
    duplicateResolutionDecisionId: string,
  ): Promise<DuplicateResolutionDecisionDocument | undefined>;
  listDuplicateResolutionDecisions(): Promise<readonly DuplicateResolutionDecisionDocument[]>;
  listDuplicateResolutionDecisionsForCluster(
    duplicateClusterRef: string,
  ): Promise<readonly DuplicateResolutionDecisionDocument[]>;
  saveDuplicateResolutionDecision(
    decision: DuplicateResolutionDecisionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface DuplicateReviewDependencies
  extends EpisodeRepository,
    DuplicatePairEvidenceRepository,
    DuplicateClusterRepository,
    DuplicateResolutionDecisionRepository {
  getRequest(requestId: string): Promise<RequestAggregate | undefined>;
  saveRequest(request: RequestAggregate, options?: CompareAndSetWriteOptions): Promise<void>;
}

export class InMemoryDuplicateReviewStore
  extends InMemorySubmissionLineageFoundationStore
  implements DuplicateReviewDependencies
{
  private readonly pairEvidences = new Map<string, PersistedDuplicatePairEvidenceRow>();
  private readonly clusters = new Map<string, PersistedDuplicateClusterRow>();
  private readonly decisions = new Map<string, PersistedDuplicateResolutionDecisionRow>();

  async getDuplicatePairEvidence(
    pairEvidenceId: string,
  ): Promise<DuplicatePairEvidenceDocument | undefined> {
    const row = this.pairEvidences.get(pairEvidenceId);
    return row ? DuplicatePairEvidenceDocument.hydrate(row) : undefined;
  }

  async listDuplicatePairEvidences(): Promise<readonly DuplicatePairEvidenceDocument[]> {
    return [...this.pairEvidences.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => DuplicatePairEvidenceDocument.hydrate(row));
  }

  async listDuplicatePairEvidencesForIncomingLineage(
    incomingLineageRef: string,
  ): Promise<readonly DuplicatePairEvidenceDocument[]> {
    return [...this.pairEvidences.values()]
      .filter((row) => row.incomingLineageRef === incomingLineageRef)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => DuplicatePairEvidenceDocument.hydrate(row));
  }

  async saveDuplicatePairEvidence(
    evidence: DuplicatePairEvidenceDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = evidence.toSnapshot();
    saveWithCas(
      this.pairEvidences,
      row.pairEvidenceId,
      {
        ...row,
        aggregateType: "DuplicatePairEvidence",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getDuplicateCluster(clusterId: string): Promise<DuplicateClusterDocument | undefined> {
    const row = this.clusters.get(clusterId);
    return row ? DuplicateClusterDocument.hydrate(row) : undefined;
  }

  async listDuplicateClusters(): Promise<readonly DuplicateClusterDocument[]> {
    return [...this.clusters.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => DuplicateClusterDocument.hydrate(row));
  }

  async listDuplicateClustersForCanonicalRequest(
    canonicalRequestId: string,
  ): Promise<readonly DuplicateClusterDocument[]> {
    return [...this.clusters.values()]
      .filter((row) => row.canonicalRequestId === canonicalRequestId)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => DuplicateClusterDocument.hydrate(row));
  }

  async saveDuplicateCluster(
    cluster: DuplicateClusterDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = cluster.toSnapshot();
    saveWithCas(
      this.clusters,
      row.clusterId,
      {
        ...row,
        aggregateType: "DuplicateCluster",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getDuplicateResolutionDecision(
    duplicateResolutionDecisionId: string,
  ): Promise<DuplicateResolutionDecisionDocument | undefined> {
    const row = this.decisions.get(duplicateResolutionDecisionId);
    return row ? DuplicateResolutionDecisionDocument.hydrate(row) : undefined;
  }

  async listDuplicateResolutionDecisions(): Promise<
    readonly DuplicateResolutionDecisionDocument[]
  > {
    return [...this.decisions.values()]
      .sort((left, right) => compareIso(left.decidedAt, right.decidedAt))
      .map((row) => DuplicateResolutionDecisionDocument.hydrate(row));
  }

  async listDuplicateResolutionDecisionsForCluster(
    duplicateClusterRef: string,
  ): Promise<readonly DuplicateResolutionDecisionDocument[]> {
    return [...this.decisions.values()]
      .filter((row) => row.duplicateClusterRef === duplicateClusterRef)
      .sort((left, right) => compareIso(left.decidedAt, right.decidedAt))
      .map((row) => DuplicateResolutionDecisionDocument.hydrate(row));
  }

  async saveDuplicateResolutionDecision(
    decision: DuplicateResolutionDecisionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = decision.toSnapshot();
    saveWithCas(
      this.decisions,
      row.duplicateResolutionDecisionId,
      {
        ...row,
        aggregateType: "DuplicateResolutionDecision",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }
}

export function createDuplicateReviewStore(): DuplicateReviewDependencies {
  return new InMemoryDuplicateReviewStore();
}

export interface DuplicatePairEvidenceCandidateInput {
  pairEvidenceId?: string;
  candidateRequestRef: string;
  candidateEpisodeRef: string;
  replaySignalRefs?: readonly string[];
  continuitySignalRefs?: readonly string[];
  conflictSignalRefs?: readonly string[];
  relationModelVersionRef: string;
  channelCalibrationRef: string;
  thresholdPolicyRef?: string;
  featureVectorHash?: string;
  piRetry: number;
  piSameRequestAttach: number;
  piSameEpisode: number;
  piRelatedEpisode: number;
  piNewEpisode: number;
  classMargin: number;
  candidateMargin: number;
  uncertaintyScore: number;
  hardBlockerRefs?: readonly string[];
}

export interface AssessIncomingDuplicateInput {
  clusterId?: string;
  incomingLineageRef: string;
  incomingSnapshotRef: string;
  candidatePairs: readonly DuplicatePairEvidenceCandidateInput[];
  continuityWitnessClass?: DuplicateContinuityWitnessClass;
  continuityWitnessRef?: string | null;
  reviewMode?: DuplicateReviewMode;
  decidedByRef: string;
  decidedAt: string;
}

export interface DuplicateDecisionRecommendation {
  decisionClass: DuplicateDecisionClass;
  relationType: DuplicateClusterRelationType;
  reviewMode: DuplicateReviewMode;
  winningPairEvidenceId: string;
  competingPairEvidenceRefs: readonly string[];
  targetRequestRef: string | null;
  targetEpisodeRef: string | null;
  continuityWitnessClass: DuplicateContinuityWitnessClass;
  continuityWitnessRef: string | null;
  reasonCodes: readonly string[];
  clusterConfidence: number;
  instabilityState: DuplicateInstabilityState;
}

export function uncertaintyBandFor(score: number): DuplicateUncertaintyBand {
  const normalized = ensureUnitInterval(score, "uncertaintyScore");
  if (normalized < 0.12) {
    return "low";
  }
  if (normalized < 0.25) {
    return "guarded";
  }
  return "high";
}

function topDuplicateEvidence(
  evidences: readonly DuplicatePairEvidenceDocument[],
): DuplicatePairEvidenceDocument {
  const best = [...evidences].sort((left, right) => {
    const leftSnapshot = left.toSnapshot();
    const rightSnapshot = right.toSnapshot();
    return (
      dominantDuplicateProbability(rightSnapshot) - dominantDuplicateProbability(leftSnapshot) ||
      rightSnapshot.candidateMargin - leftSnapshot.candidateMargin ||
      rightSnapshot.classMargin - leftSnapshot.classMargin ||
      rightSnapshot.candidateRequestRef.localeCompare(leftSnapshot.candidateRequestRef)
    );
  })[0];
  invariant(best, "NO_DUPLICATE_PAIR_EVIDENCE", "At least one DuplicatePairEvidence is required.");
  return best;
}

export function recommendDuplicateResolution(input: {
  pairEvidences: readonly DuplicatePairEvidenceDocument[];
  continuityWitnessClass?: DuplicateContinuityWitnessClass;
  continuityWitnessRef?: string | null;
  reviewMode?: DuplicateReviewMode;
  thresholdPolicy?: DuplicateThresholdPolicy;
}): DuplicateDecisionRecommendation {
  invariant(
    input.pairEvidences.length > 0,
    "NO_DUPLICATE_PAIR_EVIDENCE",
    "recommendDuplicateResolution requires at least one pair evidence row.",
  );
  const thresholds = input.thresholdPolicy ?? defaultDuplicateThresholdPolicy;
  const bestEvidence = topDuplicateEvidence(input.pairEvidences);
  const best = bestEvidence.toSnapshot();
  const competingPairEvidenceRefs = input.pairEvidences
    .filter((evidence) => evidence.pairEvidenceId !== bestEvidence.pairEvidenceId)
    .map((evidence) => evidence.pairEvidenceId);
  const competitor = input.pairEvidences
    .filter((evidence) => evidence.pairEvidenceId !== bestEvidence.pairEvidenceId)
    .sort((left, right) => {
      const leftSnapshot = left.toSnapshot();
      const rightSnapshot = right.toSnapshot();
      return (
        dominantDuplicateProbability(rightSnapshot) - dominantDuplicateProbability(leftSnapshot)
      );
    })[0];
  const competitorSnapshot = competitor?.toSnapshot();
  const canonicalConflict =
    competitorSnapshot !== undefined &&
    Math.abs(
      dominantDuplicateProbability(best) - dominantDuplicateProbability(competitorSnapshot),
    ) < thresholds.canonicalConflictDelta;
  const hardBlocked = best.hardBlockerRefs.length > 0;
  const lowClassMargin = best.classMargin < thresholds.minClassMargin;
  const lowCandidateMargin = best.candidateMargin < thresholds.minCandidateMargin;
  const uncertain = best.uncertaintyScore > thresholds.maxAutoUncertainty;
  const baseReviewMode =
    input.reviewMode ?? (best.piRetry >= thresholds.retryAutoMin ? "replay_authority" : "auto");

  const clusterConfidence = Math.max(
    best.piRetry,
    best.piSameRequestAttach,
    best.piSameEpisode,
    best.piRelatedEpisode,
    best.piNewEpisode,
  );

  const reviewRequiredReasonCodes = summarizeReasonCodes([
    hardBlocked ? "HARD_BLOCKER_PRESENT" : "",
    lowClassMargin ? "CLASS_MARGIN_TOO_LOW" : "",
    lowCandidateMargin ? "CANDIDATE_MARGIN_TOO_LOW" : "",
    uncertain ? "UNCERTAINTY_TOO_HIGH" : "",
    canonicalConflict ? "CANONICAL_CENTER_CONFLICT" : "",
  ]);
  const blockedConflict = hardBlocked || lowCandidateMargin || canonicalConflict;
  const instabilityState: DuplicateInstabilityState = blockedConflict
    ? "blocked_conflict"
    : uncertain
      ? "oscillating"
      : "stable";

  if (blockedConflict || uncertain || lowClassMargin) {
    return {
      decisionClass: "review_required",
      relationType:
        best.piSameEpisode >= thresholds.sameEpisodeCandidateMin
          ? "same_episode_candidate"
          : "review_required",
      reviewMode: "human_review",
      winningPairEvidenceId: best.pairEvidenceId,
      competingPairEvidenceRefs,
      targetRequestRef: best.candidateRequestRef,
      targetEpisodeRef: best.candidateEpisodeRef,
      continuityWitnessClass: "human_review",
      continuityWitnessRef: null,
      reasonCodes: reviewRequiredReasonCodes,
      clusterConfidence,
      instabilityState,
    };
  }

  if (best.piRetry >= thresholds.retryAutoMin && best.replaySignalRefs.length > 0) {
    return {
      decisionClass: "exact_retry_collapse",
      relationType: "retry",
      reviewMode: "replay_authority",
      winningPairEvidenceId: best.pairEvidenceId,
      competingPairEvidenceRefs,
      targetRequestRef: best.candidateRequestRef,
      targetEpisodeRef: best.candidateEpisodeRef,
      continuityWitnessClass: "deterministic_replay",
      continuityWitnessRef: best.replaySignalRefs[0] ?? null,
      reasonCodes: ["REPLAY_SIGNAL_PRESENT", "RETRY_THRESHOLD_MET"],
      clusterConfidence: best.piRetry,
      instabilityState,
    };
  }

  if (best.piSameRequestAttach >= thresholds.sameRequestAttachAutoMin) {
    const witnessClass = input.continuityWitnessClass ?? "none";
    const witnessRef = optionalRef(input.continuityWitnessRef);
    if (witnessClass === "none" || witnessRef === null) {
      return {
        decisionClass: "review_required",
        relationType: "same_episode_candidate",
        reviewMode: "human_review",
        winningPairEvidenceId: best.pairEvidenceId,
        competingPairEvidenceRefs,
        targetRequestRef: best.candidateRequestRef,
        targetEpisodeRef: best.candidateEpisodeRef,
        continuityWitnessClass: "human_review",
        continuityWitnessRef: null,
        reasonCodes: ["CONTINUITY_WITNESS_REQUIRED", "ATTACH_THRESHOLD_MET"],
        clusterConfidence: best.piSameRequestAttach,
        instabilityState: "blocked_conflict",
      };
    }
    return {
      decisionClass: "same_request_attach",
      relationType: "same_episode_confirmed",
      reviewMode: baseReviewMode,
      winningPairEvidenceId: best.pairEvidenceId,
      competingPairEvidenceRefs,
      targetRequestRef: best.candidateRequestRef,
      targetEpisodeRef: best.candidateEpisodeRef,
      continuityWitnessClass: witnessClass,
      continuityWitnessRef: witnessRef,
      reasonCodes: ["CONTINUITY_WITNESS_PRESENT", "ATTACH_THRESHOLD_MET"],
      clusterConfidence: best.piSameRequestAttach,
      instabilityState,
    };
  }

  if (best.piSameEpisode >= thresholds.sameEpisodeLinkAutoMin) {
    return {
      decisionClass: "same_episode_link",
      relationType: "same_episode_confirmed",
      reviewMode: baseReviewMode,
      winningPairEvidenceId: best.pairEvidenceId,
      competingPairEvidenceRefs,
      targetRequestRef: best.candidateRequestRef,
      targetEpisodeRef: best.candidateEpisodeRef,
      continuityWitnessClass: "human_review",
      continuityWitnessRef: null,
      reasonCodes: ["SAME_EPISODE_LINK_THRESHOLD_MET"],
      clusterConfidence: best.piSameEpisode,
      instabilityState,
    };
  }

  if (best.piRelatedEpisode >= thresholds.relatedEpisodeAutoMin) {
    return {
      decisionClass: "related_episode_link",
      relationType: "related_episode",
      reviewMode: baseReviewMode,
      winningPairEvidenceId: best.pairEvidenceId,
      competingPairEvidenceRefs,
      targetRequestRef: best.candidateRequestRef,
      targetEpisodeRef: best.candidateEpisodeRef,
      continuityWitnessClass: "human_review",
      continuityWitnessRef: null,
      reasonCodes: ["RELATED_EPISODE_THRESHOLD_MET"],
      clusterConfidence: best.piRelatedEpisode,
      instabilityState,
    };
  }

  if (best.piNewEpisode >= thresholds.separateRequestMin) {
    return {
      decisionClass: "separate_request",
      relationType: "review_required",
      reviewMode: "auto",
      winningPairEvidenceId: best.pairEvidenceId,
      competingPairEvidenceRefs,
      targetRequestRef: best.candidateRequestRef,
      targetEpisodeRef: best.candidateEpisodeRef,
      continuityWitnessClass: "none",
      continuityWitnessRef: null,
      reasonCodes: ["SEPARATE_REQUEST_THRESHOLD_MET"],
      clusterConfidence: best.piNewEpisode,
      instabilityState,
    };
  }

  return {
    decisionClass: "review_required",
    relationType:
      best.piSameEpisode >= thresholds.sameEpisodeCandidateMin
        ? "same_episode_candidate"
        : "review_required",
    reviewMode: "human_review",
    winningPairEvidenceId: best.pairEvidenceId,
    competingPairEvidenceRefs,
    targetRequestRef: best.candidateRequestRef,
    targetEpisodeRef: best.candidateEpisodeRef,
    continuityWitnessClass: "human_review",
    continuityWitnessRef: null,
    reasonCodes: ["REVIEW_REQUIRED_DEFAULT"],
    clusterConfidence,
    instabilityState: "oscillating",
  };
}

export function duplicateReviewBlocksClosure(cluster: DuplicateClusterDocument): boolean {
  const snapshot = cluster.toSnapshot();
  return snapshot.reviewStatus === "open" || snapshot.reviewStatus === "in_review";
}

function deriveFeatureVectorHash(input: {
  incomingLineageRef: string;
  incomingSnapshotRef: string;
  candidateRequestRef: string;
  candidateEpisodeRef: string;
  piRetry: number;
  piSameRequestAttach: number;
  piSameEpisode: number;
  piRelatedEpisode: number;
  piNewEpisode: number;
}): string {
  return sha256Hex(stableStringify(input));
}

export interface AssessedIncomingDuplicateResult {
  readonly pairEvidences: readonly DuplicatePairEvidenceDocument[];
  readonly cluster: DuplicateClusterDocument;
  readonly decision: DuplicateResolutionDecisionDocument;
  readonly recommendation: DuplicateDecisionRecommendation;
}

export class DuplicateReviewAuthorityService {
  private readonly repositories: DuplicateReviewDependencies;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(repositories: DuplicateReviewDependencies, idGenerator: BackboneIdGenerator) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  async assessIncomingDuplicate(
    input: AssessIncomingDuplicateInput,
  ): Promise<AssessedIncomingDuplicateResult> {
    invariant(
      input.candidatePairs.length > 0,
      "NO_DUPLICATE_PAIR_INPUTS",
      "assessIncomingDuplicate requires at least one candidate pair.",
    );

    const pairEvidences = await Promise.all(
      input.candidatePairs.map(async (candidate, index) => {
        await this.requireCandidateRequest(candidate.candidateRequestRef);
        await this.requireEpisode(candidate.candidateEpisodeRef);
        const pairEvidence = DuplicatePairEvidenceDocument.create({
          pairEvidenceId:
            candidate.pairEvidenceId ??
            this.nextId(`pair_evidence_${index}_${candidate.candidateRequestRef}`),
          incomingLineageRef: input.incomingLineageRef,
          incomingSnapshotRef: input.incomingSnapshotRef,
          candidateRequestRef: candidate.candidateRequestRef,
          candidateEpisodeRef: candidate.candidateEpisodeRef,
          replaySignalRefs: candidate.replaySignalRefs ?? [],
          continuitySignalRefs: candidate.continuitySignalRefs ?? [],
          conflictSignalRefs: candidate.conflictSignalRefs ?? [],
          relationModelVersionRef: candidate.relationModelVersionRef,
          channelCalibrationRef: candidate.channelCalibrationRef,
          thresholdPolicyRef:
            candidate.thresholdPolicyRef ?? defaultDuplicateThresholdPolicy.thresholdPolicyRef,
          featureVectorHash:
            candidate.featureVectorHash ??
            deriveFeatureVectorHash({
              incomingLineageRef: input.incomingLineageRef,
              incomingSnapshotRef: input.incomingSnapshotRef,
              candidateRequestRef: candidate.candidateRequestRef,
              candidateEpisodeRef: candidate.candidateEpisodeRef,
              piRetry: candidate.piRetry,
              piSameRequestAttach: candidate.piSameRequestAttach,
              piSameEpisode: candidate.piSameEpisode,
              piRelatedEpisode: candidate.piRelatedEpisode,
              piNewEpisode: candidate.piNewEpisode,
            }),
          piRetry: candidate.piRetry,
          piSameRequestAttach: candidate.piSameRequestAttach,
          piSameEpisode: candidate.piSameEpisode,
          piRelatedEpisode: candidate.piRelatedEpisode,
          piNewEpisode: candidate.piNewEpisode,
          classMargin: candidate.classMargin,
          candidateMargin: candidate.candidateMargin,
          uncertaintyScore: candidate.uncertaintyScore,
          hardBlockerRefs: candidate.hardBlockerRefs ?? [],
          evidenceState: "active",
          createdAt: input.decidedAt,
        });
        await this.repositories.saveDuplicatePairEvidence(pairEvidence);
        return pairEvidence;
      }),
    );

    const recommendation = recommendDuplicateResolution({
      pairEvidences,
      continuityWitnessClass: input.continuityWitnessClass,
      continuityWitnessRef: input.continuityWitnessRef,
      reviewMode: input.reviewMode,
    });

    const clusterId = input.clusterId ?? this.nextId("duplicate_cluster");
    const cluster = DuplicateClusterDocument.create({
      clusterId,
      episodeId: requireRef(recommendation.targetEpisodeRef, "episodeId"),
      canonicalRequestId: requireRef(recommendation.targetRequestRef, "canonicalRequestId"),
      memberRequestRefs: [requireRef(recommendation.targetRequestRef, "canonicalRequestId")],
      memberSnapshotRefs: [input.incomingSnapshotRef],
      candidateRequestRefs: pairEvidences.map((evidence) => evidence.candidateRequestRef),
      pairwiseEvidenceRefs: pairEvidences.map((evidence) => evidence.pairEvidenceId),
      currentResolutionDecisionRef: null,
      resolutionDecisionRefs: [],
      relationType: recommendation.relationType,
      reviewStatus: "open",
      decisionRef: null,
      clusterConfidence: recommendation.clusterConfidence,
      thresholdPolicyRef: defaultDuplicateThresholdPolicy.thresholdPolicyRef,
      channelCalibrationRef: requireRef(
        pairEvidences[0]?.toSnapshot().channelCalibrationRef,
        "channelCalibrationRef",
      ),
      instabilityState: recommendation.instabilityState,
      lastRecomputedAt: input.decidedAt,
      createdAt: input.decidedAt,
      updatedAt: input.decidedAt,
    });

    const decision = DuplicateResolutionDecisionDocument.create({
      duplicateResolutionDecisionId: this.nextId("duplicate_resolution_decision"),
      duplicateClusterRef: cluster.clusterId,
      incomingLineageRef: input.incomingLineageRef,
      incomingSnapshotRef: input.incomingSnapshotRef,
      targetRequestRef: recommendation.targetRequestRef,
      targetEpisodeRef: recommendation.targetEpisodeRef,
      winningPairEvidenceRef: recommendation.winningPairEvidenceId,
      competingPairEvidenceRefs: recommendation.competingPairEvidenceRefs,
      decisionClass: recommendation.decisionClass,
      continuityWitnessClass: recommendation.continuityWitnessClass,
      continuityWitnessRef: recommendation.continuityWitnessRef,
      reviewMode: recommendation.reviewMode,
      reasonCodes: recommendation.reasonCodes,
      decisionState: "applied",
      supersedesDecisionRef: null,
      downstreamInvalidationRefs: [],
      decidedByRef: input.decidedByRef,
      decidedAt: input.decidedAt,
      revertedAt: null,
    });
    const settledCluster = cluster.applyDecision(decision, {
      updatedAt: input.decidedAt,
      relationTypeFallback: recommendation.relationType,
      clusterConfidence: recommendation.clusterConfidence,
    });

    await this.repositories.saveDuplicateResolutionDecision(decision);
    await this.repositories.saveDuplicateCluster(settledCluster);

    return {
      pairEvidences,
      cluster: settledCluster,
      decision,
      recommendation,
    };
  }

  async beginReview(input: {
    clusterId: string;
    updatedAt: string;
  }): Promise<DuplicateClusterDocument> {
    const cluster = await this.requireCluster(input.clusterId);
    const nextCluster = cluster.markInReview({ updatedAt: input.updatedAt });
    await this.repositories.saveDuplicateCluster(nextCluster, {
      expectedVersion: cluster.version,
    });
    return nextCluster;
  }

  async applyResolutionDecision(input: {
    clusterId: string;
    decisionClass: DuplicateDecisionClass;
    winningPairEvidenceRef: string;
    continuityWitnessClass?: DuplicateContinuityWitnessClass;
    continuityWitnessRef?: string | null;
    reviewMode: DuplicateReviewMode;
    reasonCodes: readonly string[];
    decidedByRef: string;
    decidedAt: string;
    targetRequestRef?: string | null;
    targetEpisodeRef?: string | null;
    downstreamInvalidationRefs?: readonly string[];
    supersedeCurrentDecision?: boolean;
  }): Promise<{
    cluster: DuplicateClusterDocument;
    decision: DuplicateResolutionDecisionDocument;
    supersededDecision: DuplicateResolutionDecisionDocument | null;
  }> {
    const cluster = await this.requireCluster(input.clusterId);
    const winningEvidence = await this.requirePairEvidence(input.winningPairEvidenceRef);
    const winningSnapshot = winningEvidence.toSnapshot();
    const relatedEvidence = await this.loadClusterEvidence(cluster);
    validateExplicitContinuityWitness({
      decisionClass: input.decisionClass,
      continuityWitnessClass: input.continuityWitnessClass ?? "none",
      continuityWitnessRef: input.continuityWitnessRef ?? null,
    });
    validateNonTransitiveDecision({
      decisionClass: input.decisionClass,
      winningPairEvidence: winningEvidence,
      cluster,
      relatedEvidence,
    });

    let supersededDecision: DuplicateResolutionDecisionDocument | null = null;
    if (input.supersedeCurrentDecision !== false && cluster.currentResolutionDecisionRef) {
      const current = await this.requireDecision(cluster.currentResolutionDecisionRef);
      supersededDecision = current.markSuperseded();
      await this.repositories.saveDuplicateResolutionDecision(supersededDecision, {
        expectedVersion: current.version,
      });
    }

    const decision = DuplicateResolutionDecisionDocument.create({
      duplicateResolutionDecisionId: this.nextId("duplicate_resolution_decision"),
      duplicateClusterRef: cluster.clusterId,
      incomingLineageRef: winningSnapshot.incomingLineageRef,
      incomingSnapshotRef: winningSnapshot.incomingSnapshotRef,
      targetRequestRef: input.targetRequestRef ?? winningSnapshot.candidateRequestRef,
      targetEpisodeRef: input.targetEpisodeRef ?? winningSnapshot.candidateEpisodeRef,
      winningPairEvidenceRef: winningEvidence.pairEvidenceId,
      competingPairEvidenceRefs: relatedEvidence
        .filter((evidence) => evidence.pairEvidenceId !== winningEvidence.pairEvidenceId)
        .map((evidence) => evidence.pairEvidenceId),
      decisionClass: input.decisionClass,
      continuityWitnessClass: input.continuityWitnessClass ?? "none",
      continuityWitnessRef: input.continuityWitnessRef ?? null,
      reviewMode: input.reviewMode,
      reasonCodes: input.reasonCodes,
      decisionState: "applied",
      supersedesDecisionRef: supersededDecision?.duplicateResolutionDecisionId ?? null,
      downstreamInvalidationRefs: input.downstreamInvalidationRefs ?? [],
      decidedByRef: input.decidedByRef,
      decidedAt: input.decidedAt,
      revertedAt: null,
    });
    const nextCluster = cluster.applyDecision(decision, {
      updatedAt: input.decidedAt,
      relationTypeFallback: cluster.toSnapshot().relationType,
      clusterConfidence: cluster.toSnapshot().clusterConfidence,
    });

    await this.repositories.saveDuplicateResolutionDecision(decision);
    await this.repositories.saveDuplicateCluster(nextCluster, {
      expectedVersion: cluster.version,
    });

    return { cluster: nextCluster, decision, supersededDecision };
  }

  async revertDecision(input: {
    clusterId: string;
    duplicateResolutionDecisionId: string;
    revertedAt: string;
  }): Promise<{
    cluster: DuplicateClusterDocument;
    decision: DuplicateResolutionDecisionDocument;
  }> {
    const cluster = await this.requireCluster(input.clusterId);
    const decision = await this.requireDecision(input.duplicateResolutionDecisionId);
    invariant(
      decision.toSnapshot().duplicateClusterRef === cluster.clusterId,
      "DECISION_CLUSTER_MISMATCH",
      "DuplicateResolutionDecision does not belong to the requested cluster.",
    );
    const revertedDecision = decision.markReverted({ revertedAt: input.revertedAt });
    const nextCluster = cluster.reopen({
      relationType:
        cluster.toSnapshot().relationType === "same_episode_confirmed"
          ? "same_episode_candidate"
          : cluster.toSnapshot().relationType,
      instabilityState: "oscillating",
      updatedAt: input.revertedAt,
    });
    await this.repositories.saveDuplicateResolutionDecision(revertedDecision, {
      expectedVersion: decision.version,
    });
    await this.repositories.saveDuplicateCluster(nextCluster, {
      expectedVersion: cluster.version,
    });
    return {
      cluster: nextCluster,
      decision: revertedDecision,
    };
  }

  async validateLedgerState(): Promise<readonly DuplicateLedgerIssue[]> {
    return validateDuplicateLedgerState(this.repositories);
  }

  private async requireCandidateRequest(requestId: string): Promise<RequestAggregate> {
    const request = await this.repositories.getRequest(requestId);
    invariant(
      request,
      "DUPLICATE_PAIR_EVIDENCE_CANDIDATE_REQUEST_MISSING",
      `Candidate request ${requestId} does not exist.`,
    );
    return request;
  }

  private async requireEpisode(episodeId: string): Promise<EpisodeAggregate> {
    const episode = await this.repositories.getEpisode(episodeId);
    invariant(
      episode,
      "DUPLICATE_PAIR_EVIDENCE_CANDIDATE_EPISODE_MISSING",
      `Candidate episode ${episodeId} does not exist.`,
    );
    return episode;
  }

  private async requireCluster(clusterId: string): Promise<DuplicateClusterDocument> {
    const cluster = await this.repositories.getDuplicateCluster(clusterId);
    invariant(
      cluster,
      "DUPLICATE_CLUSTER_MISSING",
      `DuplicateCluster ${clusterId} does not exist.`,
    );
    return cluster;
  }

  private async requireDecision(
    duplicateResolutionDecisionId: string,
  ): Promise<DuplicateResolutionDecisionDocument> {
    const decision = await this.repositories.getDuplicateResolutionDecision(
      duplicateResolutionDecisionId,
    );
    invariant(
      decision,
      "DUPLICATE_RESOLUTION_DECISION_MISSING",
      `DuplicateResolutionDecision ${duplicateResolutionDecisionId} does not exist.`,
    );
    return decision;
  }

  private async requirePairEvidence(
    pairEvidenceId: string,
  ): Promise<DuplicatePairEvidenceDocument> {
    const evidence = await this.repositories.getDuplicatePairEvidence(pairEvidenceId);
    invariant(
      evidence,
      "DUPLICATE_PAIR_EVIDENCE_MISSING",
      `DuplicatePairEvidence ${pairEvidenceId} does not exist.`,
    );
    return evidence;
  }

  private async loadClusterEvidence(
    cluster: DuplicateClusterDocument,
  ): Promise<readonly DuplicatePairEvidenceDocument[]> {
    const rows = await Promise.all(
      cluster
        .toSnapshot()
        .pairwiseEvidenceRefs.map((pairEvidenceRef) => this.requirePairEvidence(pairEvidenceRef)),
    );
    return rows;
  }

  private nextId(label: string): string {
    return (this.idGenerator.nextId as unknown as (value: string) => string)(label);
  }
}

export function createDuplicateReviewAuthorityService(
  repositories: DuplicateReviewDependencies,
  idGenerator: BackboneIdGenerator,
): DuplicateReviewAuthorityService {
  return new DuplicateReviewAuthorityService(repositories, idGenerator);
}

export type DuplicateSimulationScenarioId =
  | "exact_retry_collapse"
  | "same_request_continuation_with_witness"
  | "same_episode_candidate_high_similarity"
  | "related_episode_link"
  | "clear_separate_request"
  | "conflicting_candidates_low_margin";

export interface DuplicateSimulationScenarioResult extends AssessedIncomingDuplicateResult {
  readonly scenarioId: DuplicateSimulationScenarioId;
}

export class DuplicateEvidenceSimulationHarness {
  private readonly authority: DuplicateReviewAuthorityService;
  private readonly repositories: DuplicateReviewDependencies;

  constructor(
    authority: DuplicateReviewAuthorityService,
    repositories: DuplicateReviewDependencies,
  ) {
    this.authority = authority;
    this.repositories = repositories;
  }

  async simulateScenario(
    scenarioId: DuplicateSimulationScenarioId,
  ): Promise<DuplicateSimulationScenarioResult> {
    await this.seedScenarioPrerequisites();

    switch (scenarioId) {
      case "exact_retry_collapse": {
        const assessed = await this.authority.assessIncomingDuplicate({
          incomingLineageRef: "lineage_070_retry",
          incomingSnapshotRef: "snapshot_070_retry",
          continuityWitnessClass: "deterministic_replay",
          continuityWitnessRef: "replay_signal_070_retry",
          decidedByRef: "duplicate_governor_070",
          decidedAt: "2026-04-12T16:00:00Z",
          candidatePairs: [
            {
              candidateRequestRef: "request_070_retry_target",
              candidateEpisodeRef: "episode_070_retry",
              replaySignalRefs: ["replay_signal_070_retry"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_web_v1",
              piRetry: 0.96,
              piSameRequestAttach: 0.02,
              piSameEpisode: 0.01,
              piRelatedEpisode: 0.0,
              piNewEpisode: 0.01,
              classMargin: 0.88,
              candidateMargin: 0.74,
              uncertaintyScore: 0.01,
            },
          ],
        });
        return { scenarioId, ...assessed };
      }
      case "same_request_continuation_with_witness": {
        const assessed = await this.authority.assessIncomingDuplicate({
          incomingLineageRef: "lineage_070_attach",
          incomingSnapshotRef: "snapshot_070_attach",
          continuityWitnessClass: "workflow_return",
          continuityWitnessRef: "witness_070_workflow_return",
          decidedByRef: "duplicate_governor_070",
          decidedAt: "2026-04-12T16:05:00Z",
          candidatePairs: [
            {
              candidateRequestRef: "request_070_attach_target",
              candidateEpisodeRef: "episode_070_attach",
              continuitySignalRefs: ["workflow_return_signal_070"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_browser_v1",
              piRetry: 0.04,
              piSameRequestAttach: 0.63,
              piSameEpisode: 0.2,
              piRelatedEpisode: 0.05,
              piNewEpisode: 0.08,
              classMargin: 0.22,
              candidateMargin: 0.31,
              uncertaintyScore: 0.09,
            },
          ],
        });
        return { scenarioId, ...assessed };
      }
      case "same_episode_candidate_high_similarity": {
        const assessed = await this.authority.assessIncomingDuplicate({
          incomingLineageRef: "lineage_070_same_episode",
          incomingSnapshotRef: "snapshot_070_same_episode",
          decidedByRef: "duplicate_governor_070",
          decidedAt: "2026-04-12T16:10:00Z",
          reviewMode: "human_review",
          candidatePairs: [
            {
              candidateRequestRef: "request_070_same_episode_a",
              candidateEpisodeRef: "episode_070_same_episode",
              continuitySignalRefs: ["continuity_hint_070_a"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_browser_v1",
              piRetry: 0.02,
              piSameRequestAttach: 0.15,
              piSameEpisode: 0.44,
              piRelatedEpisode: 0.14,
              piNewEpisode: 0.25,
              classMargin: 0.07,
              candidateMargin: 0.03,
              uncertaintyScore: 0.22,
            },
            {
              candidateRequestRef: "request_070_same_episode_b",
              candidateEpisodeRef: "episode_070_same_episode",
              continuitySignalRefs: ["continuity_hint_070_b"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_browser_v1",
              piRetry: 0.02,
              piSameRequestAttach: 0.13,
              piSameEpisode: 0.42,
              piRelatedEpisode: 0.16,
              piNewEpisode: 0.27,
              classMargin: 0.05,
              candidateMargin: 0.02,
              uncertaintyScore: 0.24,
            },
          ],
        });
        const cluster = await this.authority.beginReview({
          clusterId: assessed.cluster.clusterId,
          updatedAt: "2026-04-12T16:10:30Z",
        });
        return { scenarioId, ...assessed, cluster };
      }
      case "related_episode_link": {
        const assessed = await this.authority.assessIncomingDuplicate({
          incomingLineageRef: "lineage_070_related",
          incomingSnapshotRef: "snapshot_070_related",
          decidedByRef: "duplicate_governor_070",
          decidedAt: "2026-04-12T16:15:00Z",
          candidatePairs: [
            {
              candidateRequestRef: "request_070_related_target",
              candidateEpisodeRef: "episode_070_related_target",
              conflictSignalRefs: ["separate_safety_epoch_070"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_phone_v1",
              piRetry: 0.03,
              piSameRequestAttach: 0.05,
              piSameEpisode: 0.1,
              piRelatedEpisode: 0.71,
              piNewEpisode: 0.11,
              classMargin: 0.19,
              candidateMargin: 0.28,
              uncertaintyScore: 0.08,
            },
          ],
        });
        return { scenarioId, ...assessed };
      }
      case "clear_separate_request": {
        const assessed = await this.authority.assessIncomingDuplicate({
          incomingLineageRef: "lineage_070_separate",
          incomingSnapshotRef: "snapshot_070_separate",
          decidedByRef: "duplicate_governor_070",
          decidedAt: "2026-04-12T16:20:00Z",
          candidatePairs: [
            {
              candidateRequestRef: "request_070_separate_candidate",
              candidateEpisodeRef: "episode_070_separate_candidate",
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_portal_v1",
              piRetry: 0.02,
              piSameRequestAttach: 0.07,
              piSameEpisode: 0.09,
              piRelatedEpisode: 0.08,
              piNewEpisode: 0.74,
              classMargin: 0.33,
              candidateMargin: 0.3,
              uncertaintyScore: 0.06,
            },
          ],
        });
        return { scenarioId, ...assessed };
      }
      case "conflicting_candidates_low_margin": {
        const assessed = await this.authority.assessIncomingDuplicate({
          incomingLineageRef: "lineage_070_conflict",
          incomingSnapshotRef: "snapshot_070_conflict",
          decidedByRef: "duplicate_governor_070",
          decidedAt: "2026-04-12T16:25:00Z",
          reviewMode: "human_review",
          candidatePairs: [
            {
              candidateRequestRef: "request_070_conflict_a",
              candidateEpisodeRef: "episode_070_conflict",
              conflictSignalRefs: ["different_actor_mode_070"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_voice_v1",
              piRetry: 0.03,
              piSameRequestAttach: 0.06,
              piSameEpisode: 0.32,
              piRelatedEpisode: 0.29,
              piNewEpisode: 0.3,
              classMargin: 0.03,
              candidateMargin: 0.01,
              uncertaintyScore: 0.34,
            },
            {
              candidateRequestRef: "request_070_conflict_b",
              candidateEpisodeRef: "episode_070_conflict",
              conflictSignalRefs: ["different_actor_mode_070"],
              relationModelVersionRef: "duplicate_model_070_v1",
              channelCalibrationRef: "duplicate_calibration_voice_v1",
              piRetry: 0.03,
              piSameRequestAttach: 0.05,
              piSameEpisode: 0.31,
              piRelatedEpisode: 0.3,
              piNewEpisode: 0.31,
              classMargin: 0.02,
              candidateMargin: 0.01,
              uncertaintyScore: 0.36,
            },
          ],
        });
        return { scenarioId, ...assessed };
      }
    }
  }

  async runAllScenarios(): Promise<readonly DuplicateSimulationScenarioResult[]> {
    const scenarioIds: DuplicateSimulationScenarioId[] = [
      "exact_retry_collapse",
      "same_request_continuation_with_witness",
      "same_episode_candidate_high_similarity",
      "related_episode_link",
      "clear_separate_request",
      "conflicting_candidates_low_margin",
    ];
    const results: DuplicateSimulationScenarioResult[] = [];
    for (const scenarioId of scenarioIds) {
      results.push(await this.simulateScenario(scenarioId));
    }
    return results;
  }

  private async seedScenarioPrerequisites(): Promise<void> {
    const episodes = [
      ["episode_070_retry", "episode_fp_070_retry"],
      ["episode_070_attach", "episode_fp_070_attach"],
      ["episode_070_same_episode", "episode_fp_070_same_episode"],
      ["episode_070_related_target", "episode_fp_070_related_target"],
      ["episode_070_separate_candidate", "episode_fp_070_separate_candidate"],
      ["episode_070_conflict", "episode_fp_070_conflict"],
    ] as const;
    for (const [episodeId, fingerprint] of episodes) {
      const existing = await this.repositories.getEpisode(episodeId);
      if (!existing) {
        await this.repositories.saveEpisode(
          EpisodeAggregate.create({
            episodeId,
            episodeFingerprint: fingerprint,
            openedAt: "2026-04-12T15:30:00Z",
          }),
        );
      }
    }

    const requests = [
      ["request_070_retry_target", "episode_070_retry", "lineage_070_retry_target"],
      ["request_070_attach_target", "episode_070_attach", "lineage_070_attach_target"],
      ["request_070_same_episode_a", "episode_070_same_episode", "lineage_070_same_episode_a"],
      ["request_070_same_episode_b", "episode_070_same_episode", "lineage_070_same_episode_b"],
      ["request_070_related_target", "episode_070_related_target", "lineage_070_related_target"],
      [
        "request_070_separate_candidate",
        "episode_070_separate_candidate",
        "lineage_070_separate_candidate",
      ],
      ["request_070_conflict_a", "episode_070_conflict", "lineage_070_conflict_a"],
      ["request_070_conflict_b", "episode_070_conflict", "lineage_070_conflict_b"],
    ] as const;
    for (const [requestId, episodeId, lineageRef] of requests) {
      const existing = await this.repositories.getRequest(requestId);
      if (!existing) {
        await this.repositories.saveRequest(
          RequestAggregate.create({
            requestId,
            episodeId,
            originEnvelopeRef: `envelope_${requestId}`,
            promotionRecordRef: `promotion_${requestId}`,
            tenantId: "tenant_070",
            sourceChannel: "self_service_form",
            originIngressRecordRef: `ingress_${requestId}`,
            normalizedSubmissionRef: `normalized_${requestId}`,
            requestType: "clinical_question",
            requestLineageRef: lineageRef,
            createdAt: "2026-04-12T15:31:00Z",
          }),
        );
      }
    }
  }
}

export function createDuplicateEvidenceSimulationHarness(
  authority: DuplicateReviewAuthorityService,
  repositories: DuplicateReviewDependencies,
): DuplicateEvidenceSimulationHarness {
  return new DuplicateEvidenceSimulationHarness(authority, repositories);
}

export interface DuplicateLedgerIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  reference: string;
}

export function validateExplicitContinuityWitness(input: {
  decisionClass: DuplicateDecisionClass;
  continuityWitnessClass: DuplicateContinuityWitnessClass;
  continuityWitnessRef: string | null;
}): void {
  if (input.decisionClass !== "same_request_attach") {
    return;
  }
  invariant(
    input.continuityWitnessClass !== "none" && optionalRef(input.continuityWitnessRef) !== null,
    "SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
    "same_request_attach requires an explicit continuity witness.",
  );
}

export function validateNonTransitiveDecision(input: {
  decisionClass: DuplicateDecisionClass;
  winningPairEvidence: DuplicatePairEvidenceDocument;
  relatedEvidence: readonly DuplicatePairEvidenceDocument[];
  cluster: DuplicateClusterDocument;
}): void {
  if (
    ![
      "exact_retry_collapse",
      "same_request_attach",
      "same_episode_link",
      "related_episode_link",
      "separate_request",
    ].includes(input.decisionClass)
  ) {
    return;
  }
  const winning = input.winningPairEvidence.toSnapshot();
  const competitor = input.relatedEvidence
    .filter((evidence) => evidence.pairEvidenceId !== input.winningPairEvidence.pairEvidenceId)
    .sort((left, right) => {
      const leftSnapshot = left.toSnapshot();
      const rightSnapshot = right.toSnapshot();
      return (
        dominantDuplicateProbability(rightSnapshot) - dominantDuplicateProbability(leftSnapshot)
      );
    })[0];
  if (!competitor) {
    return;
  }
  const competitorSnapshot = competitor.toSnapshot();
  invariant(
    Math.abs(
      dominantDuplicateProbability(winning) - dominantDuplicateProbability(competitorSnapshot),
    ) >= defaultDuplicateThresholdPolicy.canonicalConflictDelta,
    "PAIRWISE_EDGES_ARE_NOT_TRANSITIVE_PROOF",
    `Cluster ${input.cluster.clusterId} has near-equal competing pair evidence and must fail closed to review.`,
  );
}

export async function validateDuplicateLedgerState(
  repositories: DuplicateReviewDependencies,
): Promise<readonly DuplicateLedgerIssue[]> {
  const issues: DuplicateLedgerIssue[] = [];
  const pairEvidences = await repositories.listDuplicatePairEvidences();
  const clusters = await repositories.listDuplicateClusters();
  const decisions = await repositories.listDuplicateResolutionDecisions();
  const pairEvidencesById = new Map(
    pairEvidences.map((evidence) => [evidence.pairEvidenceId, evidence]),
  );
  const decisionsById = new Map(
    decisions.map((decision) => [decision.duplicateResolutionDecisionId, decision]),
  );

  for (const evidence of pairEvidences) {
    const snapshot = evidence.toSnapshot();
    const request = await repositories.getRequest(snapshot.candidateRequestRef);
    if (!request) {
      issues.push({
        code: "DUPLICATE_PAIR_EVIDENCE_CANDIDATE_REQUEST_MISSING",
        severity: "error",
        message: "DuplicatePairEvidence references a missing candidate Request.",
        reference: `pairEvidence:${evidence.pairEvidenceId}`,
      });
    }
    const episode = await repositories.getEpisode(snapshot.candidateEpisodeRef);
    if (!episode) {
      issues.push({
        code: "DUPLICATE_PAIR_EVIDENCE_CANDIDATE_EPISODE_MISSING",
        severity: "error",
        message: "DuplicatePairEvidence references a missing candidate Episode.",
        reference: `pairEvidence:${evidence.pairEvidenceId}`,
      });
    }
    if (
      snapshot.piRetry +
        snapshot.piSameRequestAttach +
        snapshot.piSameEpisode +
        snapshot.piRelatedEpisode +
        snapshot.piNewEpisode <
        0.999 ||
      snapshot.piRetry +
        snapshot.piSameRequestAttach +
        snapshot.piSameEpisode +
        snapshot.piRelatedEpisode +
        snapshot.piNewEpisode >
        1.001
    ) {
      issues.push({
        code: "DUPLICATE_PAIR_EVIDENCE_PROBABILITY_DRIFT",
        severity: "error",
        message: "DuplicatePairEvidence probabilities drifted from a unit-sum vector.",
        reference: `pairEvidence:${evidence.pairEvidenceId}`,
      });
    }
  }

  for (const cluster of clusters) {
    const snapshot = cluster.toSnapshot();
    for (const pairEvidenceRef of snapshot.pairwiseEvidenceRefs) {
      if (!pairEvidencesById.has(pairEvidenceRef)) {
        issues.push({
          code: "DUPLICATE_CLUSTER_MISSING_PAIR_EVIDENCE",
          severity: "error",
          message: "DuplicateCluster references missing DuplicatePairEvidence.",
          reference: `cluster:${cluster.clusterId}`,
        });
      }
    }
    for (const resolutionDecisionRef of snapshot.resolutionDecisionRefs) {
      if (!decisionsById.has(resolutionDecisionRef)) {
        issues.push({
          code: "DUPLICATE_CLUSTER_MISSING_DECISION",
          severity: "error",
          message: "DuplicateCluster references missing DuplicateResolutionDecision.",
          reference: `cluster:${cluster.clusterId}`,
        });
      }
    }
    if (
      snapshot.currentResolutionDecisionRef &&
      decisionsById.get(snapshot.currentResolutionDecisionRef)?.toSnapshot().decisionState !==
        "applied"
    ) {
      issues.push({
        code: "DUPLICATE_CLUSTER_CURRENT_DECISION_NOT_APPLIED",
        severity: "error",
        message: "DuplicateCluster.currentResolutionDecisionRef must point at an applied decision.",
        reference: `cluster:${cluster.clusterId}`,
      });
    }
    if (duplicateReviewBlocksClosure(cluster) && snapshot.reviewStatus === "resolved_confirmed") {
      issues.push({
        code: "DUPLICATE_CLUSTER_BLOCKER_DRIFT",
        severity: "error",
        message: "Resolved DuplicateCluster cannot remain closure-blocking.",
        reference: `cluster:${cluster.clusterId}`,
      });
    }
  }

  for (const decision of decisions) {
    const snapshot = decision.toSnapshot();
    const cluster = clusters.find((entry) => entry.clusterId === snapshot.duplicateClusterRef);
    if (!cluster) {
      issues.push({
        code: "DUPLICATE_RESOLUTION_CLUSTER_MISSING",
        severity: "error",
        message: "DuplicateResolutionDecision references a missing DuplicateCluster.",
        reference: `decision:${decision.duplicateResolutionDecisionId}`,
      });
      continue;
    }
    const winningEvidence = pairEvidencesById.get(snapshot.winningPairEvidenceRef);
    if (!winningEvidence) {
      issues.push({
        code: "DUPLICATE_RESOLUTION_WINNING_EVIDENCE_MISSING",
        severity: "error",
        message: "DuplicateResolutionDecision references missing winning pair evidence.",
        reference: `decision:${decision.duplicateResolutionDecisionId}`,
      });
      continue;
    }
    if (snapshot.decisionClass === "same_request_attach") {
      if (snapshot.continuityWitnessClass === "none" || snapshot.continuityWitnessRef === null) {
        issues.push({
          code: "SAME_REQUEST_ATTACH_WITHOUT_CONTINUITY_WITNESS",
          severity: "error",
          message: "same_request_attach must retain an explicit continuity witness.",
          reference: `decision:${decision.duplicateResolutionDecisionId}`,
        });
      }
    }
    try {
      validateNonTransitiveDecision({
        decisionClass: snapshot.decisionClass,
        winningPairEvidence: winningEvidence,
        relatedEvidence: pairEvidences.filter((evidence) =>
          cluster.toSnapshot().pairwiseEvidenceRefs.includes(evidence.pairEvidenceId),
        ),
        cluster,
      });
    } catch (error) {
      issues.push({
        code: "PAIRWISE_EDGES_ARE_NOT_TRANSITIVE_PROOF",
        severity: "error",
        message:
          error instanceof Error
            ? error.message
            : "Duplicate decision failed transitivity validation.",
        reference: `decision:${decision.duplicateResolutionDecisionId}`,
      });
    }
    if (
      snapshot.decisionState === "applied" &&
      [
        "exact_retry_collapse",
        "same_request_attach",
        "same_episode_link",
        "related_episode_link",
        "separate_request",
      ].includes(snapshot.decisionClass)
    ) {
      const winningSnapshot = winningEvidence.toSnapshot();
      if (
        winningSnapshot.classMargin < defaultDuplicateThresholdPolicy.minClassMargin ||
        winningSnapshot.candidateMargin < defaultDuplicateThresholdPolicy.minCandidateMargin ||
        winningSnapshot.uncertaintyScore > defaultDuplicateThresholdPolicy.maxAutoUncertainty ||
        winningSnapshot.hardBlockerRefs.length > 0
      ) {
        issues.push({
          code: "AUTO_DECISION_ON_UNSTABLE_EVIDENCE",
          severity: "error",
          message:
            "An applied duplicate decision relied on unstable evidence or unresolved blockers.",
          reference: `decision:${decision.duplicateResolutionDecisionId}`,
        });
      }
    }
  }

  return issues;
}

export function createDuplicateReviewSimulationHarness(options?: {
  repositories?: DuplicateReviewDependencies;
  idGenerator?: BackboneIdGenerator;
}) {
  const repositories = options?.repositories ?? createDuplicateReviewStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("duplicate_review_070");
  const authority = createDuplicateReviewAuthorityService(repositories, idGenerator);
  return createDuplicateEvidenceSimulationHarness(authority, repositories);
}

export type DuplicateReviewWitnessRequirementState =
  | "not_required"
  | "required_for_attach"
  | "satisfied";
export type DuplicateReviewQueueBlockingState = "explicit_review_required" | "resolved";
export type DuplicateReviewWorkspaceState = "explicit_review_required" | "resolved";
export type DuplicateConsequenceInvalidationTargetType =
  | "endpoint_decision"
  | "approval_checkpoint"
  | "endpoint_outcome_preview"
  | "booking_intent"
  | "pharmacy_intent"
  | "patient_offer_link"
  | "analytics_join"
  | "workspace_assumption"
  | "reopen_assumption"
  | "handoff_seed";
export type DuplicateConsequenceInvalidationReasonClass =
  | "duplicate_resolution_superseded"
  | "duplicate_resolution_reverted";

export interface DuplicateReviewCandidateSummary {
  requestRef: string;
  episodeRef: string;
  dominantDecisionClass:
    | "exact_retry_collapse"
    | "same_request_attach"
    | "same_episode_link"
    | "related_episode_link"
    | "separate_request";
  dominantScore: number;
  uncertaintyScore: number;
  hardBlockerRefs: readonly string[];
}

export interface DuplicateReviewSnapshotSnapshot {
  duplicateReviewSnapshotId: string;
  taskId: string;
  duplicateClusterRef: string;
  candidateRequestRefs: readonly string[];
  pairEvidenceRefs: readonly string[];
  winningPairEvidenceRef: string | null;
  competingPairEvidenceRefs: readonly string[];
  currentResolutionDecisionRef: string;
  currentDecisionClass: DuplicateDecisionClass;
  currentDecisionState: DuplicateDecisionState;
  continuityWitnessSummaryRef: string;
  continuityWitnessRequirementState: DuplicateReviewWitnessRequirementState;
  requiredContinuityWitnessClasses: readonly DuplicateContinuityWitnessClass[];
  instabilityState: DuplicateInstabilityState;
  authorityBoundary: {
    duplicateClusterAuthority: "DuplicateCluster";
    sameRequestAttachAuthority: "DuplicateResolutionDecision";
    replayAuthority: "IdempotencyRecord";
    reviewProjectionMode: "phase0_projection_reuse";
  };
  candidateMembers: readonly DuplicateReviewCandidateSummary[];
  queueRelevance: {
    queueBlockingState: DuplicateReviewQueueBlockingState;
    canonicalDuplicateReviewFlag: boolean;
    queueAuthorityRef: string;
  };
  workspaceRelevance: {
    workspaceState: DuplicateReviewWorkspaceState;
    actionScope: "resolve_duplicate_cluster";
    commandSurface: string;
  };
  currentInvalidationBurden: {
    burdenState: "none" | "stale_consequences_pending";
    totalCount: number;
    targetTypes: readonly DuplicateConsequenceInvalidationTargetType[];
    invalidationRefs: readonly string[];
  };
  lastRenderedAt: string;
  version: number;
}

export interface PersistedDuplicateReviewSnapshotRow extends DuplicateReviewSnapshotSnapshot {
  aggregateType: "DuplicateReviewSnapshot";
  persistenceSchemaVersion: 1;
}

export class DuplicateReviewSnapshotDocument {
  private readonly snapshot: DuplicateReviewSnapshotSnapshot;

  private constructor(snapshot: DuplicateReviewSnapshotSnapshot) {
    this.snapshot = DuplicateReviewSnapshotDocument.normalize(snapshot);
  }

  static create(
    input: Omit<DuplicateReviewSnapshotSnapshot, "version">,
  ): DuplicateReviewSnapshotDocument {
    return new DuplicateReviewSnapshotDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DuplicateReviewSnapshotSnapshot): DuplicateReviewSnapshotDocument {
    return new DuplicateReviewSnapshotDocument(snapshot);
  }

  private static normalize(snapshot: DuplicateReviewSnapshotSnapshot): DuplicateReviewSnapshotSnapshot {
    ensurePositiveInteger(snapshot.version, "version");
    const currentResolutionDecisionRef = requireRef(
      snapshot.currentResolutionDecisionRef,
      "currentResolutionDecisionRef",
    );
    return {
      ...snapshot,
      duplicateReviewSnapshotId: requireRef(
        snapshot.duplicateReviewSnapshotId,
        "duplicateReviewSnapshotId",
      ),
      taskId: requireRef(snapshot.taskId, "taskId"),
      duplicateClusterRef: requireRef(snapshot.duplicateClusterRef, "duplicateClusterRef"),
      candidateRequestRefs: uniqueSortedRefs(snapshot.candidateRequestRefs),
      pairEvidenceRefs: uniqueSortedRefs(snapshot.pairEvidenceRefs),
      winningPairEvidenceRef: optionalRef(snapshot.winningPairEvidenceRef),
      competingPairEvidenceRefs: uniqueSortedRefs(snapshot.competingPairEvidenceRefs),
      currentResolutionDecisionRef,
      continuityWitnessSummaryRef: requireRef(
        snapshot.continuityWitnessSummaryRef,
        "continuityWitnessSummaryRef",
      ),
      requiredContinuityWitnessClasses: uniqueSortedRefs(
        snapshot.requiredContinuityWitnessClasses,
      ) as DuplicateContinuityWitnessClass[],
      candidateMembers: [...snapshot.candidateMembers]
        .map((candidate) => ({
          requestRef: requireRef(candidate.requestRef, "candidateMembers.requestRef"),
          episodeRef: requireRef(candidate.episodeRef, "candidateMembers.episodeRef"),
          dominantDecisionClass: candidate.dominantDecisionClass,
          dominantScore: ensureUnitInterval(candidate.dominantScore, "candidateMembers.dominantScore"),
          uncertaintyScore: ensureUnitInterval(
            candidate.uncertaintyScore,
            "candidateMembers.uncertaintyScore",
          ),
          hardBlockerRefs: uniqueSortedRefs(candidate.hardBlockerRefs),
        }))
        .sort((left, right) => {
          return (
            right.dominantScore - left.dominantScore ||
            left.requestRef.localeCompare(right.requestRef)
          );
        }),
      queueRelevance: {
        queueBlockingState: snapshot.queueRelevance.queueBlockingState,
        canonicalDuplicateReviewFlag: snapshot.queueRelevance.canonicalDuplicateReviewFlag,
        queueAuthorityRef: requireRef(snapshot.queueRelevance.queueAuthorityRef, "queueAuthorityRef"),
      },
      workspaceRelevance: {
        workspaceState: snapshot.workspaceRelevance.workspaceState,
        actionScope: snapshot.workspaceRelevance.actionScope,
        commandSurface: requireRef(snapshot.workspaceRelevance.commandSurface, "commandSurface"),
      },
      currentInvalidationBurden: {
        burdenState: snapshot.currentInvalidationBurden.burdenState,
        totalCount: ensureNonNegativeInteger(
          snapshot.currentInvalidationBurden.totalCount,
          "currentInvalidationBurden.totalCount",
        ),
        targetTypes: uniqueSortedRefs(
          snapshot.currentInvalidationBurden.targetTypes,
        ) as DuplicateConsequenceInvalidationTargetType[],
        invalidationRefs: uniqueSortedRefs(snapshot.currentInvalidationBurden.invalidationRefs),
      },
      lastRenderedAt: ensureIsoTimestamp(snapshot.lastRenderedAt, "lastRenderedAt"),
    };
  }

  get duplicateReviewSnapshotId(): string {
    return this.snapshot.duplicateReviewSnapshotId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): DuplicateReviewSnapshotSnapshot {
    return {
      ...this.snapshot,
      candidateRequestRefs: [...this.snapshot.candidateRequestRefs],
      pairEvidenceRefs: [...this.snapshot.pairEvidenceRefs],
      competingPairEvidenceRefs: [...this.snapshot.competingPairEvidenceRefs],
      requiredContinuityWitnessClasses: [...this.snapshot.requiredContinuityWitnessClasses],
      candidateMembers: this.snapshot.candidateMembers.map((candidate) => ({
        ...candidate,
        hardBlockerRefs: [...candidate.hardBlockerRefs],
      })),
      currentInvalidationBurden: {
        ...this.snapshot.currentInvalidationBurden,
        targetTypes: [...this.snapshot.currentInvalidationBurden.targetTypes],
        invalidationRefs: [...this.snapshot.currentInvalidationBurden.invalidationRefs],
      },
    };
  }
}

export interface DuplicateConsequenceInvalidationRecordSnapshot {
  duplicateConsequenceInvalidationId: string;
  duplicateClusterRef: string;
  causingDecisionRef: string;
  supersededDecisionRef: string | null;
  taskId: string;
  targetType: DuplicateConsequenceInvalidationTargetType;
  targetRef: string;
  reasonClass: DuplicateConsequenceInvalidationReasonClass;
  decisionSupersessionRecordRef: string;
  recordedByRef: string;
  recordedAt: string;
  version: number;
}

export interface PersistedDuplicateConsequenceInvalidationRecordRow
  extends DuplicateConsequenceInvalidationRecordSnapshot {
  aggregateType: "DuplicateConsequenceInvalidationRecord";
  persistenceSchemaVersion: 1;
}

export class DuplicateConsequenceInvalidationRecordDocument {
  private readonly snapshot: DuplicateConsequenceInvalidationRecordSnapshot;

  private constructor(snapshot: DuplicateConsequenceInvalidationRecordSnapshot) {
    this.snapshot = DuplicateConsequenceInvalidationRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<DuplicateConsequenceInvalidationRecordSnapshot, "version">,
  ): DuplicateConsequenceInvalidationRecordDocument {
    return new DuplicateConsequenceInvalidationRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: DuplicateConsequenceInvalidationRecordSnapshot,
  ): DuplicateConsequenceInvalidationRecordDocument {
    return new DuplicateConsequenceInvalidationRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: DuplicateConsequenceInvalidationRecordSnapshot,
  ): DuplicateConsequenceInvalidationRecordSnapshot {
    ensurePositiveInteger(snapshot.version, "version");
    return {
      ...snapshot,
      duplicateConsequenceInvalidationId: requireRef(
        snapshot.duplicateConsequenceInvalidationId,
        "duplicateConsequenceInvalidationId",
      ),
      duplicateClusterRef: requireRef(snapshot.duplicateClusterRef, "duplicateClusterRef"),
      causingDecisionRef: requireRef(snapshot.causingDecisionRef, "causingDecisionRef"),
      supersededDecisionRef: optionalRef(snapshot.supersededDecisionRef),
      taskId: requireRef(snapshot.taskId, "taskId"),
      targetRef: requireRef(snapshot.targetRef, "targetRef"),
      decisionSupersessionRecordRef: requireRef(
        snapshot.decisionSupersessionRecordRef,
        "decisionSupersessionRecordRef",
      ),
      recordedByRef: requireRef(snapshot.recordedByRef, "recordedByRef"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }

  get duplicateConsequenceInvalidationId(): string {
    return this.snapshot.duplicateConsequenceInvalidationId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): DuplicateConsequenceInvalidationRecordSnapshot {
    return { ...this.snapshot };
  }
}

export interface DuplicateReviewSnapshotRepository {
  getDuplicateReviewSnapshot(
    duplicateReviewSnapshotId: string,
  ): Promise<DuplicateReviewSnapshotDocument | undefined>;
  getLatestDuplicateReviewSnapshotForTask(
    taskId: string,
  ): Promise<DuplicateReviewSnapshotDocument | undefined>;
  listDuplicateReviewSnapshotsForCluster(
    duplicateClusterRef: string,
  ): Promise<readonly DuplicateReviewSnapshotDocument[]>;
  saveDuplicateReviewSnapshot(
    snapshot: DuplicateReviewSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface DuplicateConsequenceInvalidationRepository {
  listDuplicateConsequenceInvalidationsForCluster(
    duplicateClusterRef: string,
  ): Promise<readonly DuplicateConsequenceInvalidationRecordDocument[]>;
  listDuplicateConsequenceInvalidationsForDecision(
    causingDecisionRef: string,
  ): Promise<readonly DuplicateConsequenceInvalidationRecordDocument[]>;
  saveDuplicateConsequenceInvalidation(
    invalidation: DuplicateConsequenceInvalidationRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface DuplicateReviewPhase3Dependencies
  extends DuplicateReviewDependencies,
    DuplicateReviewSnapshotRepository,
    DuplicateConsequenceInvalidationRepository {}

export class InMemoryPhase3DuplicateReviewStore
  extends InMemoryDuplicateReviewStore
  implements DuplicateReviewPhase3Dependencies
{
  private readonly reviewSnapshots = new Map<string, PersistedDuplicateReviewSnapshotRow>();
  private readonly latestReviewSnapshotByTask = new Map<string, string>();
  private readonly invalidations = new Map<
    string,
    PersistedDuplicateConsequenceInvalidationRecordRow
  >();

  async getDuplicateReviewSnapshot(
    duplicateReviewSnapshotId: string,
  ): Promise<DuplicateReviewSnapshotDocument | undefined> {
    const row = this.reviewSnapshots.get(duplicateReviewSnapshotId);
    return row ? DuplicateReviewSnapshotDocument.hydrate(row) : undefined;
  }

  async getLatestDuplicateReviewSnapshotForTask(
    taskId: string,
  ): Promise<DuplicateReviewSnapshotDocument | undefined> {
    const snapshotId = this.latestReviewSnapshotByTask.get(taskId);
    if (!snapshotId) {
      return undefined;
    }
    return this.getDuplicateReviewSnapshot(snapshotId);
  }

  async listDuplicateReviewSnapshotsForCluster(
    duplicateClusterRef: string,
  ): Promise<readonly DuplicateReviewSnapshotDocument[]> {
    return [...this.reviewSnapshots.values()]
      .filter((row) => row.duplicateClusterRef === duplicateClusterRef)
      .sort((left, right) => compareIso(left.lastRenderedAt, right.lastRenderedAt))
      .map((row) => DuplicateReviewSnapshotDocument.hydrate(row));
  }

  async saveDuplicateReviewSnapshot(
    snapshot: DuplicateReviewSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = snapshot.toSnapshot();
    saveWithCas(
      this.reviewSnapshots,
      row.duplicateReviewSnapshotId,
      {
        ...row,
        aggregateType: "DuplicateReviewSnapshot",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.latestReviewSnapshotByTask.set(row.taskId, row.duplicateReviewSnapshotId);
  }

  async listDuplicateConsequenceInvalidationsForCluster(
    duplicateClusterRef: string,
  ): Promise<readonly DuplicateConsequenceInvalidationRecordDocument[]> {
    return [...this.invalidations.values()]
      .filter((row) => row.duplicateClusterRef === duplicateClusterRef)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => DuplicateConsequenceInvalidationRecordDocument.hydrate(row));
  }

  async listDuplicateConsequenceInvalidationsForDecision(
    causingDecisionRef: string,
  ): Promise<readonly DuplicateConsequenceInvalidationRecordDocument[]> {
    return [...this.invalidations.values()]
      .filter((row) => row.causingDecisionRef === causingDecisionRef)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => DuplicateConsequenceInvalidationRecordDocument.hydrate(row));
  }

  async saveDuplicateConsequenceInvalidation(
    invalidation: DuplicateConsequenceInvalidationRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = invalidation.toSnapshot();
    saveWithCas(
      this.invalidations,
      row.duplicateConsequenceInvalidationId,
      {
        ...row,
        aggregateType: "DuplicateConsequenceInvalidationRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }
}

export function createPhase3DuplicateReviewStore(): DuplicateReviewPhase3Dependencies {
  return new InMemoryPhase3DuplicateReviewStore();
}

function dominantDecisionClassForEvidence(
  snapshot: DuplicatePairEvidenceSnapshot,
): DuplicateReviewCandidateSummary["dominantDecisionClass"] {
  const scores = [
    ["exact_retry_collapse", snapshot.piRetry],
    ["same_request_attach", snapshot.piSameRequestAttach],
    ["same_episode_link", snapshot.piSameEpisode],
    ["related_episode_link", snapshot.piRelatedEpisode],
    ["separate_request", snapshot.piNewEpisode],
  ] as const;
  return [...scores].sort((left, right) => right[1] - left[1])[0]![0];
}

function buildContinuityWitnessSummaryRef(input: {
  clusterId: string;
  decision: DuplicateResolutionDecisionSnapshot;
  cluster: DuplicateClusterSnapshot;
}): string {
  if (
    input.decision.continuityWitnessClass !== "none" &&
    input.decision.continuityWitnessRef !== null
  ) {
    return `continuity_witness_summary:${input.clusterId}:${input.decision.continuityWitnessClass}:${input.decision.continuityWitnessRef}`;
  }
  if (
    input.cluster.relationType === "same_episode_candidate" ||
    input.decision.decisionClass === "same_request_attach"
  ) {
    return `continuity_witness_summary:${input.clusterId}:required_for_attach`;
  }
  return `continuity_witness_summary:${input.clusterId}:not_required`;
}

const duplicateInvalidationTargetTemplates = [
  "endpoint_decision",
  "approval_checkpoint",
  "endpoint_outcome_preview",
  "booking_intent",
  "pharmacy_intent",
  "patient_offer_link",
  "analytics_join",
  "workspace_assumption",
  "reopen_assumption",
  "handoff_seed",
] as const satisfies readonly DuplicateConsequenceInvalidationTargetType[];

export interface PublishDuplicateReviewSnapshotInput {
  taskId: string;
  duplicateClusterRef: string;
  renderedAt: string;
}

export interface ResolveDuplicateReviewInput {
  taskId: string;
  duplicateClusterRef: string;
  duplicateReviewSnapshotRef: string;
  decisionClass: DuplicateDecisionClass;
  winningPairEvidenceRef: string;
  continuityWitnessClass?: DuplicateContinuityWitnessClass;
  continuityWitnessRef?: string | null;
  reviewMode: DuplicateReviewMode;
  reasonCodes: readonly string[];
  decidedByRef: string;
  decidedAt: string;
  targetRequestRef?: string | null;
  targetEpisodeRef?: string | null;
}

export interface ResolveDuplicateReviewResult {
  cluster: DuplicateClusterDocument;
  decision: DuplicateResolutionDecisionDocument;
  supersededDecision: DuplicateResolutionDecisionDocument | null;
  snapshot: DuplicateReviewSnapshotDocument;
  invalidations: readonly DuplicateConsequenceInvalidationRecordDocument[];
}

export class Phase3DuplicateReviewAuthorityService {
  private readonly repositories: DuplicateReviewPhase3Dependencies;
  private readonly authority: DuplicateReviewAuthorityService;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    repositories: DuplicateReviewPhase3Dependencies,
    idGenerator: BackboneIdGenerator,
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
    this.authority = createDuplicateReviewAuthorityService(repositories, idGenerator);
  }

  async publishDuplicateReviewSnapshot(
    input: PublishDuplicateReviewSnapshotInput,
  ): Promise<DuplicateReviewSnapshotDocument> {
    const cluster = await this.requireCluster(input.duplicateClusterRef);
    const decisions = await this.repositories.listDuplicateResolutionDecisionsForCluster(cluster.clusterId);
    invariant(
      decisions.length > 0,
      "DUPLICATE_REVIEW_SNAPSHOT_REQUIRES_DECISION_HISTORY",
      "DuplicateReviewSnapshot requires at least one DuplicateResolutionDecision in the cluster.",
    );
    const decision =
      decisions.find((entry) => entry.duplicateResolutionDecisionId === cluster.currentResolutionDecisionRef) ??
      decisions[decisions.length - 1]!;
    const decisionSnapshot = decision.toSnapshot();
    const evidences = await this.loadClusterEvidence(cluster);
    const invalidations = await this.repositories.listDuplicateConsequenceInvalidationsForDecision(
      decision.duplicateResolutionDecisionId,
    );
    const currentInvalidationBurden = {
      burdenState: invalidations.length > 0 ? "stale_consequences_pending" : "none",
      totalCount: invalidations.length,
      targetTypes: invalidations.map((entry) => entry.toSnapshot().targetType),
      invalidationRefs: invalidations.map((entry) => entry.duplicateConsequenceInvalidationId),
    } as const;
    const snapshot = DuplicateReviewSnapshotDocument.create({
      duplicateReviewSnapshotId: this.nextId("duplicate_review_snapshot"),
      taskId: input.taskId,
      duplicateClusterRef: cluster.clusterId,
      candidateRequestRefs: cluster.toSnapshot().candidateRequestRefs,
      pairEvidenceRefs: cluster.toSnapshot().pairwiseEvidenceRefs,
      winningPairEvidenceRef: decisionSnapshot.winningPairEvidenceRef,
      competingPairEvidenceRefs: decisionSnapshot.competingPairEvidenceRefs,
      currentResolutionDecisionRef: decision.duplicateResolutionDecisionId,
      currentDecisionClass: decisionSnapshot.decisionClass,
      currentDecisionState: decisionSnapshot.decisionState,
      continuityWitnessSummaryRef: buildContinuityWitnessSummaryRef({
        clusterId: cluster.clusterId,
        decision: decisionSnapshot,
        cluster: cluster.toSnapshot(),
      }),
      continuityWitnessRequirementState:
        decisionSnapshot.continuityWitnessClass !== "none" &&
        decisionSnapshot.continuityWitnessRef !== null
          ? "satisfied"
          : cluster.toSnapshot().relationType === "same_episode_candidate"
            ? "required_for_attach"
            : "not_required",
      requiredContinuityWitnessClasses:
        cluster.toSnapshot().relationType === "same_episode_candidate" ||
        decisionSnapshot.decisionClass === "same_request_attach"
          ? ["submit_lineage", "workflow_return", "more_info_cycle", "telephony_continuation"]
          : [],
      instabilityState: cluster.toSnapshot().instabilityState,
      authorityBoundary: {
        duplicateClusterAuthority: "DuplicateCluster",
        sameRequestAttachAuthority: "DuplicateResolutionDecision",
        replayAuthority: "IdempotencyRecord",
        reviewProjectionMode: "phase0_projection_reuse",
      },
      candidateMembers: evidences.map((evidence) => {
        const entry = evidence.toSnapshot();
        return {
          requestRef: entry.candidateRequestRef,
          episodeRef: entry.candidateEpisodeRef,
          dominantDecisionClass: dominantDecisionClassForEvidence(entry),
          dominantScore: dominantDuplicateProbability(entry),
          uncertaintyScore: entry.uncertaintyScore,
          hardBlockerRefs: entry.hardBlockerRefs,
        };
      }),
      queueRelevance: {
        queueBlockingState: duplicateReviewBlocksClosure(cluster)
          ? "explicit_review_required"
          : "resolved",
        canonicalDuplicateReviewFlag: duplicateReviewBlocksClosure(cluster),
        queueAuthorityRef: "QueueRankEntry.duplicateReview_i",
      },
      workspaceRelevance: {
        workspaceState: duplicateReviewBlocksClosure(cluster)
          ? "explicit_review_required"
          : "resolved",
        actionScope: "resolve_duplicate_cluster",
        commandSurface: "/internal/v1/workspace/tasks/{taskId}/duplicate-review/resolve",
      },
      currentInvalidationBurden,
      lastRenderedAt: input.renderedAt,
    });
    await this.repositories.saveDuplicateReviewSnapshot(snapshot);
    return snapshot;
  }

  async resolveDuplicateReview(input: ResolveDuplicateReviewInput): Promise<ResolveDuplicateReviewResult> {
    const latestSnapshot = await this.repositories.getLatestDuplicateReviewSnapshotForTask(input.taskId);
    invariant(
      latestSnapshot?.duplicateReviewSnapshotId === input.duplicateReviewSnapshotRef,
      "STALE_DUPLICATE_REVIEW_SNAPSHOT",
      "Duplicate resolution requires the latest DuplicateReviewSnapshot for the task.",
    );
    const resolution = await this.authority.applyResolutionDecision({
      clusterId: input.duplicateClusterRef,
      decisionClass: input.decisionClass,
      winningPairEvidenceRef: input.winningPairEvidenceRef,
      continuityWitnessClass: input.continuityWitnessClass,
      continuityWitnessRef: input.continuityWitnessRef,
      reviewMode: input.reviewMode,
      reasonCodes: input.reasonCodes,
      decidedByRef: input.decidedByRef,
      decidedAt: input.decidedAt,
      targetRequestRef: input.targetRequestRef,
      targetEpisodeRef: input.targetEpisodeRef,
      downstreamInvalidationRefs: [],
      supersedeCurrentDecision: true,
    });

    const invalidations =
      resolution.supersededDecision &&
      this.shouldInvalidateDownstream(
        resolution.supersededDecision.toSnapshot(),
        resolution.decision.toSnapshot(),
      )
        ? await this.emitDuplicateConsequenceInvalidations({
            taskId: input.taskId,
            cluster: resolution.cluster,
            causingDecision: resolution.decision,
            supersededDecision: resolution.supersededDecision,
            recordedByRef: input.decidedByRef,
            recordedAt: input.decidedAt,
          })
        : [];

    let decision = resolution.decision;
    if (invalidations.length > 0) {
      const decisionWithInvalidations = resolution.decision.withDownstreamInvalidationRefs(
        invalidations.map((entry) => entry.duplicateConsequenceInvalidationId),
      );
      await this.repositories.saveDuplicateResolutionDecision(decisionWithInvalidations, {
        expectedVersion: resolution.decision.version,
      });
      decision = decisionWithInvalidations;
    }

    const snapshot = await this.publishDuplicateReviewSnapshot({
      taskId: input.taskId,
      duplicateClusterRef: resolution.cluster.clusterId,
      renderedAt: input.decidedAt,
    });

    return {
      cluster: resolution.cluster,
      decision,
      supersededDecision: resolution.supersededDecision,
      snapshot,
      invalidations,
    };
  }

  private shouldInvalidateDownstream(
    supersededDecision: DuplicateResolutionDecisionSnapshot,
    replacementDecision: DuplicateResolutionDecisionSnapshot,
  ): boolean {
    if (supersededDecision.decisionClass === "review_required") {
      return false;
    }
    return supersededDecision.decisionClass !== replacementDecision.decisionClass;
  }

  private async emitDuplicateConsequenceInvalidations(input: {
    taskId: string;
    cluster: DuplicateClusterDocument;
    causingDecision: DuplicateResolutionDecisionDocument;
    supersededDecision: DuplicateResolutionDecisionDocument;
    recordedByRef: string;
    recordedAt: string;
  }): Promise<readonly DuplicateConsequenceInvalidationRecordDocument[]> {
    const invalidations = duplicateInvalidationTargetTemplates.map((targetType) =>
      DuplicateConsequenceInvalidationRecordDocument.create({
        duplicateConsequenceInvalidationId: this.nextId(
          `duplicate_invalidation_${targetType}`,
        ),
        duplicateClusterRef: input.cluster.clusterId,
        causingDecisionRef: input.causingDecision.duplicateResolutionDecisionId,
        supersededDecisionRef: input.supersededDecision.duplicateResolutionDecisionId,
        taskId: input.taskId,
        targetType,
        targetRef: `${targetType}:${input.taskId}`,
        reasonClass: "duplicate_resolution_superseded",
        decisionSupersessionRecordRef: `decision_supersession_record:${input.taskId}:${input.supersededDecision.duplicateResolutionDecisionId}`,
        recordedByRef: input.recordedByRef,
        recordedAt: input.recordedAt,
      }),
    );
    for (const invalidation of invalidations) {
      await this.repositories.saveDuplicateConsequenceInvalidation(invalidation);
    }
    return invalidations;
  }

  private async requireCluster(clusterId: string): Promise<DuplicateClusterDocument> {
    const cluster = await this.repositories.getDuplicateCluster(clusterId);
    invariant(cluster, "DUPLICATE_CLUSTER_MISSING", `DuplicateCluster ${clusterId} does not exist.`);
    return cluster;
  }

  private async loadClusterEvidence(
    cluster: DuplicateClusterDocument,
  ): Promise<readonly DuplicatePairEvidenceDocument[]> {
    return Promise.all(
      cluster
        .toSnapshot()
        .pairwiseEvidenceRefs.map(async (pairEvidenceRef) => {
          const evidence = await this.repositories.getDuplicatePairEvidence(pairEvidenceRef);
          invariant(
            evidence,
            "DUPLICATE_PAIR_EVIDENCE_MISSING",
            `DuplicatePairEvidence ${pairEvidenceRef} does not exist.`,
          );
          return evidence;
        }),
    );
  }

  private nextId(label: string): string {
    return (this.idGenerator.nextId as unknown as (value: string) => string)(label);
  }
}

export function createPhase3DuplicateReviewAuthorityService(
  repositories: DuplicateReviewPhase3Dependencies = createPhase3DuplicateReviewStore(),
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "duplicate_review_phase3_234",
  ),
): Phase3DuplicateReviewAuthorityService {
  return new Phase3DuplicateReviewAuthorityService(repositories, idGenerator);
}
