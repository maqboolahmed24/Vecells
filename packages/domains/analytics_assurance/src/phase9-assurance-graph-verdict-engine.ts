import {
  assertValidContractObject,
  collectGraphNodeRefs,
  hashAssurancePayload,
  type AssuranceEvidenceGraphEdge,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceGraphCompletenessVerdict,
  type AssuranceSliceTrustRecord,
  type GraphVerdictState,
} from "./phase9-assurance-ledger-contracts";
import type { AssuranceReadContext } from "./phase9-assurance-ingest-service";

export const PHASE9_GRAPH_VERDICT_ENGINE_VERSION = "436.phase9.graph-verdict-engine.v1";

export type Phase9GraphConsumerContext =
  | "assurance_pack"
  | "audit_timeline"
  | "support_replay"
  | "retention_disposition"
  | "archive_or_delete"
  | "operational_dashboard"
  | "incident_follow_up"
  | "recovery_proof"
  | "tenant_governance"
  | "generic_read";

export type Phase9GraphVerdictState = "complete" | "partial" | "stale" | "blocked";

export type Phase9GraphVerdictReasonCode =
  | "ORPHAN_EDGE"
  | "MISSING_REQUIRED_EDGE"
  | "MISSING_REQUIRED_NODE"
  | "STALE_EVIDENCE"
  | "SUPERSEDED_EVIDENCE"
  | "SCHEMA_MISMATCH"
  | "GRAPH_WATERMARK_MISMATCH"
  | "TENANT_BOUNDARY_VIOLATION"
  | "VISIBILITY_GAP"
  | "CONTRADICTION"
  | "LOW_TRUST"
  | "REPLAY_MISMATCH"
  | "RETENTION_DEPENDENCY_GAP"
  | "UNSEALED_SNAPSHOT"
  | "CYCLE_DETECTED";

export interface RequiredGraphEdge {
  readonly requirementRef: string;
  readonly fromRef: string;
  readonly toRef: string;
  readonly edgeType?: string;
}

export interface EvidenceFreshnessInput {
  readonly evidenceRef: string;
  readonly capturedAt: string;
  readonly freshnessBudgetMs: number;
  readonly freshnessState?: "current" | "stale" | "expired" | "missing" | "quarantined";
}

export interface SchemaPinInput {
  readonly sourceRef: string;
  readonly schemaVersionRef: string;
  readonly normalizationVersionRef?: string;
}

export interface VisibilityGrantInput {
  readonly artifactRef: string;
  readonly visibilityScope: string;
  readonly allowedContexts: readonly Phase9GraphConsumerContext[];
}

export interface ContradictionInput {
  readonly contradictionRef: string;
  readonly subjectRef: string;
  readonly claimRefs: readonly string[];
}

export interface ReplayCheckInput {
  readonly replayCheckRef: string;
  readonly replayMatchScore: number;
  readonly minimumReplayMatchScore: number;
  readonly snapshotHash: string;
  readonly rebuildHash: string;
}

export interface RetentionDependencyInput {
  readonly dependencyRef: string;
  readonly requiredNodeRef: string;
}

export interface Phase9GraphVerdictPolicy {
  readonly policyHash: string;
  readonly evaluatorVersion: string;
  readonly minimumTrustLowerBound: number;
  readonly supportedSchemaVersionRefs: readonly string[];
  readonly supportedNormalizationVersionRefs: readonly string[];
  readonly strictStaleContexts: readonly Phase9GraphConsumerContext[];
  readonly strictVisibilityContexts: readonly Phase9GraphConsumerContext[];
  readonly defaultMaxTraversalDepth: number;
}

export const defaultPhase9GraphVerdictPolicy: Phase9GraphVerdictPolicy = {
  policyHash: hashAssurancePayload(
    {
      policy: "phase9.graph-verdict.default",
      stale: [
        "assurance_pack",
        "audit_timeline",
        "support_replay",
        "retention_disposition",
        "archive_or_delete",
        "incident_follow_up",
        "recovery_proof",
      ],
      visibility: ["audit_timeline", "support_replay", "archive_or_delete", "assurance_pack", "recovery_proof"],
    },
    "phase9.graph-verdict.policy",
  ),
  evaluatorVersion: PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  minimumTrustLowerBound: 0.82,
  supportedSchemaVersionRefs: ["432.phase9.assurance-ledger-contracts.v1", "435.phase9.assurance-ingest-service.v1"],
  supportedNormalizationVersionRefs: ["phase9.assurance.normalization.v1"],
  strictStaleContexts: [
    "assurance_pack",
    "audit_timeline",
    "support_replay",
    "retention_disposition",
    "archive_or_delete",
    "incident_follow_up",
    "recovery_proof",
  ],
  strictVisibilityContexts: ["audit_timeline", "support_replay", "archive_or_delete", "assurance_pack", "recovery_proof"],
  defaultMaxTraversalDepth: 64,
};

export interface Phase9GraphVerdictEvaluationInput {
  readonly snapshot: AssuranceEvidenceGraphSnapshot;
  readonly edges: readonly AssuranceEvidenceGraphEdge[];
  readonly context: Phase9GraphConsumerContext;
  readonly scopeRef: string;
  readonly generatedAt: string;
  readonly policy?: Phase9GraphVerdictPolicy;
  readonly graphWatermark?: string;
  readonly requiredLedgerWatermark?: string;
  readonly requiredNodeRefs?: readonly string[];
  readonly requiredEdges?: readonly RequiredGraphEdge[];
  readonly evidenceFreshness?: readonly EvidenceFreshnessInput[];
  readonly schemaPins?: readonly SchemaPinInput[];
  readonly visibilityGrants?: readonly VisibilityGrantInput[];
  readonly contradictionInputs?: readonly ContradictionInput[];
  readonly trustRecords?: readonly AssuranceSliceTrustRecord[];
  readonly replayChecks?: readonly ReplayCheckInput[];
  readonly retentionDependencies?: readonly RetentionDependencyInput[];
  readonly traversalRootRefs?: readonly string[];
  readonly maxTraversalDepth?: number;
}

export interface Phase9GraphTraversalResult {
  readonly visitedRefs: readonly string[];
  readonly cycleRefs: readonly string[];
  readonly maxDepthReached: boolean;
}

export interface Phase9GraphVerdictRecord {
  readonly verdictId: string;
  readonly graphSnapshotRef: string;
  readonly graphHash: string;
  readonly context: Phase9GraphConsumerContext;
  readonly scopeRef: string;
  readonly state: Phase9GraphVerdictState;
  readonly contractVerdict: AssuranceGraphCompletenessVerdict;
  readonly evaluatedRequirements: readonly string[];
  readonly passedRequirements: readonly string[];
  readonly failedRequirements: readonly string[];
  readonly orphanEdgeRefs: readonly string[];
  readonly missingEdgeRefs: readonly string[];
  readonly staleEvidenceRefs: readonly string[];
  readonly contradictionRefs: readonly string[];
  readonly visibilityGapRefs: readonly string[];
  readonly trustBlockingRefs: readonly string[];
  readonly reasonCodes: readonly Phase9GraphVerdictReasonCode[];
  readonly watermarks: {
    readonly graphWatermark: string;
    readonly requiredLedgerWatermark: string;
  };
  readonly traversal: Phase9GraphTraversalResult;
  readonly generatedAt: string;
  readonly evaluatorVersion: string;
  readonly policyHash: string;
  readonly verdictHash: string;
}

export interface Phase9GraphVerdictComparison {
  readonly leftVerdictRef: string;
  readonly rightVerdictRef: string;
  readonly sameDecision: boolean;
  readonly addedReasonCodes: readonly Phase9GraphVerdictReasonCode[];
  readonly removedReasonCodes: readonly Phase9GraphVerdictReasonCode[];
  readonly stateChanged: boolean;
}

export class Phase9GraphVerdictEngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9GraphVerdictEngineError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9GraphVerdictEngineError(code, message);
  }
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function isSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function addReason(reasons: Set<Phase9GraphVerdictReasonCode>, condition: unknown, reason: Phase9GraphVerdictReasonCode): void {
  if (condition) {
    reasons.add(reason);
  }
}

function contextTreatsStaleAsBlock(context: Phase9GraphConsumerContext, policy: Phase9GraphVerdictPolicy): boolean {
  return policy.strictStaleContexts.includes(context);
}

function contextRequiresStrictVisibility(context: Phase9GraphConsumerContext, policy: Phase9GraphVerdictPolicy): boolean {
  return policy.strictVisibilityContexts.includes(context);
}

function contractStateFor(state: Phase9GraphVerdictState): GraphVerdictState {
  return state === "complete" ? "complete" : state === "blocked" ? "blocked" : "stale";
}

function graphContainsNode(snapshot: AssuranceEvidenceGraphSnapshot, nodeRef: string): boolean {
  return collectGraphNodeRefs(snapshot).has(nodeRef);
}

export function traverseAssuranceGraph(
  edges: readonly AssuranceEvidenceGraphEdge[],
  rootRefs: readonly string[],
  maxDepth: number,
): Phase9GraphTraversalResult {
  const orderedEdges = [...edges].sort(
    (left, right) =>
      left.fromRef.localeCompare(right.fromRef) ||
      left.toRef.localeCompare(right.toRef) ||
      left.edgeHash.localeCompare(right.edgeHash),
  );
  const adjacency = new Map<string, AssuranceEvidenceGraphEdge[]>();
  for (const edge of orderedEdges) {
    adjacency.set(edge.fromRef, [...(adjacency.get(edge.fromRef) ?? []), edge]);
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const cycleRefs = new Set<string>();
  let maxDepthReached = false;

  const visit = (nodeRef: string, depth: number): void => {
    if (depth > maxDepth) {
      maxDepthReached = true;
      return;
    }
    if (visiting.has(nodeRef)) {
      cycleRefs.add(nodeRef);
      return;
    }
    if (visited.has(nodeRef)) {
      return;
    }
    visiting.add(nodeRef);
    visited.add(nodeRef);
    for (const edge of adjacency.get(nodeRef) ?? []) {
      visit(edge.toRef, depth + 1);
    }
    visiting.delete(nodeRef);
  };

  for (const rootRef of [...rootRefs].sort()) {
    visit(rootRef, 0);
  }
  return {
    visitedRefs: uniqueSorted([...visited]),
    cycleRefs: uniqueSorted([...cycleRefs]),
    maxDepthReached,
  };
}

export function evaluatePhase9GraphVerdict(input: Phase9GraphVerdictEvaluationInput): Phase9GraphVerdictRecord {
  const policy = input.policy ?? defaultPhase9GraphVerdictPolicy;
  const nodeRefs = collectGraphNodeRefs(input.snapshot);
  const sortedEdges = [...input.edges].sort((left, right) => left.edgeHash.localeCompare(right.edgeHash));
  const reasonCodes = new Set<Phase9GraphVerdictReasonCode>();
  const requiredNodeRefs = uniqueSorted(input.requiredNodeRefs ?? []);
  const missingNodeRefs = requiredNodeRefs.filter((nodeRef) => !nodeRefs.has(nodeRef));
  const orphanEdgeRefs = sortedEdges
    .filter((edge) => !nodeRefs.has(edge.fromRef) || !nodeRefs.has(edge.toRef))
    .map((edge) => edge.assuranceEvidenceGraphEdgeId);
  const requiredEdges = [...(input.requiredEdges ?? [])].sort((left, right) => left.requirementRef.localeCompare(right.requirementRef));
  const missingEdgeRefs = requiredEdges
    .filter(
      (required) =>
        !sortedEdges.some(
          (edge) =>
            edge.fromRef === required.fromRef &&
            edge.toRef === required.toRef &&
            (!required.edgeType || edge.edgeType === required.edgeType),
        ),
    )
    .map((required) => required.requirementRef);
  const staleEvidenceRefs = (input.evidenceFreshness ?? [])
    .filter((freshness) => {
      const age = Date.parse(input.generatedAt) - Date.parse(freshness.capturedAt);
      return (
        freshness.freshnessState === "stale" ||
        freshness.freshnessState === "expired" ||
        freshness.freshnessState === "missing" ||
        freshness.freshnessState === "quarantined" ||
        Number.isNaN(age) ||
        age > freshness.freshnessBudgetMs
      );
    })
    .map((freshness) => freshness.evidenceRef);
  const schemaMismatchRefs = (input.schemaPins ?? [])
    .filter(
      (pin) =>
        !policy.supportedSchemaVersionRefs.includes(pin.schemaVersionRef) ||
        (pin.normalizationVersionRef !== undefined &&
          !policy.supportedNormalizationVersionRefs.includes(pin.normalizationVersionRef)),
    )
    .map((pin) => pin.sourceRef);
  const watermarkMismatch =
    input.requiredLedgerWatermark !== undefined &&
    input.graphWatermark !== undefined &&
    input.requiredLedgerWatermark !== input.graphWatermark;
  const crossScopeConflictRefs = sortedEdges
    .filter((edge) => edge.scopeState !== "in_scope")
    .map((edge) => edge.assuranceEvidenceGraphEdgeId);
  const visibilityGapRefs = (input.visibilityGrants ?? [])
    .filter((grant) => contextRequiresStrictVisibility(input.context, policy) && !grant.allowedContexts.includes(input.context))
    .map((grant) => grant.artifactRef);
  const contradictionRefs = (input.contradictionInputs ?? [])
    .filter((contradiction) => contradiction.claimRefs.length > 1)
    .map((contradiction) => contradiction.contradictionRef);
  const trustBlockingRefs = (input.trustRecords ?? [])
    .filter(
      (trust) =>
        trust.trustLowerBound < policy.minimumTrustLowerBound ||
        trust.trustState !== "trusted" ||
        trust.completenessState !== "complete" ||
        trust.hardBlockState,
    )
    .map((trust) => trust.assuranceSliceTrustRecordId);
  const replayMismatchRefs = (input.replayChecks ?? [])
    .filter(
      (check) =>
        check.replayMatchScore < check.minimumReplayMatchScore ||
        check.snapshotHash !== check.rebuildHash,
    )
    .map((check) => check.replayCheckRef);
  const retentionDependencyGapRefs = (input.retentionDependencies ?? [])
    .filter((dependency) => !graphContainsNode(input.snapshot, dependency.requiredNodeRef))
    .map((dependency) => dependency.dependencyRef);
  const supersessionConflictRefs = sortedEdges
    .filter((edge) => edge.supersessionState !== "live")
    .map((edge) => edge.assuranceEvidenceGraphEdgeId);
  const traversal = traverseAssuranceGraph(
    sortedEdges,
    input.traversalRootRefs ?? requiredNodeRefs,
    input.maxTraversalDepth ?? policy.defaultMaxTraversalDepth,
  );

  addReason(reasonCodes, orphanEdgeRefs.length > 0, "ORPHAN_EDGE");
  addReason(reasonCodes, missingEdgeRefs.length > 0, "MISSING_REQUIRED_EDGE");
  addReason(reasonCodes, missingNodeRefs.length > 0, "MISSING_REQUIRED_NODE");
  addReason(reasonCodes, staleEvidenceRefs.length > 0, "STALE_EVIDENCE");
  addReason(reasonCodes, supersessionConflictRefs.length > 0, "SUPERSEDED_EVIDENCE");
  addReason(reasonCodes, schemaMismatchRefs.length > 0, "SCHEMA_MISMATCH");
  addReason(reasonCodes, watermarkMismatch, "GRAPH_WATERMARK_MISMATCH");
  addReason(reasonCodes, crossScopeConflictRefs.length > 0, "TENANT_BOUNDARY_VIOLATION");
  addReason(reasonCodes, visibilityGapRefs.length > 0, "VISIBILITY_GAP");
  addReason(reasonCodes, contradictionRefs.length > 0, "CONTRADICTION");
  addReason(reasonCodes, trustBlockingRefs.length > 0, "LOW_TRUST");
  addReason(reasonCodes, replayMismatchRefs.length > 0, "REPLAY_MISMATCH");
  addReason(reasonCodes, retentionDependencyGapRefs.length > 0, "RETENTION_DEPENDENCY_GAP");
  addReason(reasonCodes, input.snapshot.snapshotState !== "complete" || !isSha256Hex(input.snapshot.graphHash), "UNSEALED_SNAPSHOT");
  addReason(reasonCodes, traversal.cycleRefs.length > 0, "CYCLE_DETECTED");

  const hardBlockReasonCodes = new Set<Phase9GraphVerdictReasonCode>([
    "ORPHAN_EDGE",
    "MISSING_REQUIRED_EDGE",
    "MISSING_REQUIRED_NODE",
    "SUPERSEDED_EVIDENCE",
    "SCHEMA_MISMATCH",
    "GRAPH_WATERMARK_MISMATCH",
    "TENANT_BOUNDARY_VIOLATION",
    "VISIBILITY_GAP",
    "CONTRADICTION",
    "LOW_TRUST",
    "REPLAY_MISMATCH",
    "RETENTION_DEPENDENCY_GAP",
    "UNSEALED_SNAPSHOT",
    "CYCLE_DETECTED",
  ]);
  if (contextTreatsStaleAsBlock(input.context, policy)) {
    hardBlockReasonCodes.add("STALE_EVIDENCE");
  }
  const reasonList = uniqueSorted([...reasonCodes]);
  const hasHardBlock = reasonList.some((reason) => hardBlockReasonCodes.has(reason));
  const state: Phase9GraphVerdictState =
    hasHardBlock
      ? "blocked"
      : staleEvidenceRefs.length > 0
        ? "stale"
        : reasonList.length > 0
          ? "partial"
          : "complete";
  const evaluatedRequirements = uniqueSorted([
    ...requiredNodeRefs.map((nodeRef) => `node:${nodeRef}`),
    ...requiredEdges.map((edge) => `edge:${edge.requirementRef}`),
    ...(input.evidenceFreshness ?? []).map((freshness) => `freshness:${freshness.evidenceRef}`),
    ...(input.visibilityGrants ?? []).map((grant) => `visibility:${grant.artifactRef}`),
    ...(input.trustRecords ?? []).map((trust) => `trust:${trust.assuranceSliceTrustRecordId}`),
    ...(input.replayChecks ?? []).map((check) => `replay:${check.replayCheckRef}`),
    ...(input.retentionDependencies ?? []).map((dependency) => `retention:${dependency.dependencyRef}`),
  ]);
  const failedRequirements = uniqueSorted([
    ...missingNodeRefs.map((ref) => `node:${ref}`),
    ...missingEdgeRefs.map((ref) => `edge:${ref}`),
    ...staleEvidenceRefs.map((ref) => `freshness:${ref}`),
    ...visibilityGapRefs.map((ref) => `visibility:${ref}`),
    ...trustBlockingRefs.map((ref) => `trust:${ref}`),
    ...replayMismatchRefs.map((ref) => `replay:${ref}`),
    ...retentionDependencyGapRefs.map((ref) => `retention:${ref}`),
  ]);
  const passedRequirements = evaluatedRequirements.filter((requirement) => !failedRequirements.includes(requirement));
  const contractVerdict = buildContractVerdict({
    snapshot: input.snapshot,
    scopeRef: input.scopeRef,
    requiredNodeRefs,
    missingNodeRefs,
    missingEdgeRefs: uniqueSorted([...missingEdgeRefs, ...orphanEdgeRefs]),
    orphanNodeRefs: uniqueSorted(
      sortedEdges
        .filter((edge) => !nodeRefs.has(edge.fromRef) || !nodeRefs.has(edge.toRef))
        .flatMap((edge) => [edge.fromRef, edge.toRef])
        .filter((ref) => !nodeRefs.has(ref)),
    ),
    supersessionConflictRefs,
    crossScopeConflictRefs,
    requiredPackRefs: input.context === "assurance_pack" ? requiredNodeRefs.filter((ref) => ref.startsWith("pack:")) : [],
    requiredRetentionRefs:
      input.context === "retention_disposition" || input.context === "archive_or_delete"
        ? (input.retentionDependencies ?? []).map((dependency) => dependency.requiredNodeRef)
        : [],
    blockedExportRefs: input.context === "archive_or_delete" ? visibilityGapRefs : [],
    state: contractStateFor(state),
    evaluatedAt: input.generatedAt,
    context: input.context,
    policyHash: policy.policyHash,
    reasonCodes: reasonList,
  });
  const verdictPayload = {
    graphSnapshotRef: input.snapshot.assuranceEvidenceGraphSnapshotId,
    graphHash: input.snapshot.graphHash,
    context: input.context,
    scopeRef: input.scopeRef,
    state,
    contractDecisionHash: contractVerdict.decisionHash,
    evaluatedRequirements,
    passedRequirements,
    failedRequirements,
    orphanEdgeRefs: uniqueSorted(orphanEdgeRefs),
    missingEdgeRefs: uniqueSorted([...missingEdgeRefs, ...orphanEdgeRefs]),
    staleEvidenceRefs: uniqueSorted(staleEvidenceRefs),
    contradictionRefs: uniqueSorted(contradictionRefs),
    visibilityGapRefs: uniqueSorted(visibilityGapRefs),
    trustBlockingRefs: uniqueSorted(trustBlockingRefs),
    reasonCodes: reasonList,
    watermarks: {
      graphWatermark: input.graphWatermark ?? "",
      requiredLedgerWatermark: input.requiredLedgerWatermark ?? "",
    },
    traversal,
    generatedAt: input.generatedAt,
    evaluatorVersion: policy.evaluatorVersion,
    policyHash: policy.policyHash,
  };
  const verdictHash = hashAssurancePayload(verdictPayload, "phase9.graph-verdict.record");
  return {
    verdictId: `agve_436_${verdictHash.slice(0, 16)}`,
    ...verdictPayload,
    contractVerdict,
    verdictHash,
  };
}

function buildContractVerdict(input: {
  readonly snapshot: AssuranceEvidenceGraphSnapshot;
  readonly scopeRef: string;
  readonly requiredNodeRefs: readonly string[];
  readonly missingNodeRefs: readonly string[];
  readonly orphanNodeRefs: readonly string[];
  readonly missingEdgeRefs: readonly string[];
  readonly supersessionConflictRefs: readonly string[];
  readonly crossScopeConflictRefs: readonly string[];
  readonly requiredPackRefs: readonly string[];
  readonly requiredRetentionRefs: readonly string[];
  readonly blockedExportRefs: readonly string[];
  readonly state: GraphVerdictState;
  readonly evaluatedAt: string;
  readonly context: Phase9GraphConsumerContext;
  readonly policyHash: string;
  readonly reasonCodes: readonly Phase9GraphVerdictReasonCode[];
}): AssuranceGraphCompletenessVerdict {
  const decisionPayload = {
    graphSnapshotRef: input.snapshot.assuranceEvidenceGraphSnapshotId,
    graphHash: input.snapshot.graphHash,
    scopeRef: input.scopeRef,
    context: input.context,
    policyHash: input.policyHash,
    requiredNodeRefs: uniqueSorted(input.requiredNodeRefs),
    missingNodeRefs: uniqueSorted(input.missingNodeRefs),
    orphanNodeRefs: uniqueSorted(input.orphanNodeRefs),
    missingEdgeRefs: uniqueSorted(input.missingEdgeRefs),
    supersessionConflictRefs: uniqueSorted(input.supersessionConflictRefs),
    crossScopeConflictRefs: uniqueSorted(input.crossScopeConflictRefs),
    requiredPackRefs: uniqueSorted(input.requiredPackRefs),
    requiredRetentionRefs: uniqueSorted(input.requiredRetentionRefs),
    blockedExportRefs: uniqueSorted(input.blockedExportRefs),
    verdictState: input.state,
    reasonCodes: input.reasonCodes,
  };
  const verdict: AssuranceGraphCompletenessVerdict = {
    assuranceGraphCompletenessVerdictId: `agcv_436_${hashAssurancePayload(
      decisionPayload,
      "phase9.graph-verdict.contract.id",
    ).slice(0, 16)}`,
    graphSnapshotRef: input.snapshot.assuranceEvidenceGraphSnapshotId,
    scopeRef: input.scopeRef,
    requiredNodeRefs: uniqueSorted(input.requiredNodeRefs),
    missingNodeRefs: uniqueSorted(input.missingNodeRefs),
    orphanNodeRefs: uniqueSorted(input.orphanNodeRefs),
    missingEdgeRefs: uniqueSorted(input.missingEdgeRefs),
    supersessionConflictRefs: uniqueSorted(input.supersessionConflictRefs),
    crossScopeConflictRefs: uniqueSorted(input.crossScopeConflictRefs),
    requiredPackRefs: uniqueSorted(input.requiredPackRefs),
    requiredRetentionRefs: uniqueSorted(input.requiredRetentionRefs),
    blockedExportRefs: uniqueSorted(input.blockedExportRefs),
    verdictState: input.state,
    decisionHash: hashAssurancePayload(decisionPayload, "phase9.graph-verdict.contract.decision"),
    evaluatedAt: input.evaluatedAt,
  };
  assertValidContractObject("AssuranceGraphCompletenessVerdict", verdict);
  return verdict;
}

export interface Phase9GraphSnapshotProvider {
  fetchLatestSnapshotRef(tenantScopeRef: string, context: AssuranceReadContext): string | undefined;
  fetchSnapshotById(snapshotId: string, context: AssuranceReadContext): AssuranceEvidenceGraphSnapshot | undefined;
  fetchGraphEdges(
    filter: { readonly snapshotId?: string; readonly artifactRef?: string; readonly controlRef?: string; readonly timelineRef?: string },
    context: AssuranceReadContext,
  ): readonly AssuranceEvidenceGraphEdge[];
}

export class Phase9GraphVerdictEngine {
  private readonly verdicts = new Map<string, Phase9GraphVerdictRecord>();
  private readonly cache = new Map<string, string>();

  evaluate(input: Phase9GraphVerdictEvaluationInput, readContext?: AssuranceReadContext): Phase9GraphVerdictRecord {
    if (readContext) {
      this.assertAuthorized(input.snapshot.tenantScopeRef, readContext);
    }
    const policy = input.policy ?? defaultPhase9GraphVerdictPolicy;
    const cacheKey = this.cacheKey(input, policy);
    const cachedId = this.cache.get(cacheKey);
    if (cachedId) {
      const cached = this.verdicts.get(cachedId);
      if (cached) {
        return cached;
      }
    }
    const verdict = evaluatePhase9GraphVerdict({ ...input, policy });
    this.verdicts.set(verdict.verdictId, verdict);
    this.cache.set(cacheKey, verdict.verdictId);
    return verdict;
  }

  dryRun(input: Phase9GraphVerdictEvaluationInput, readContext?: AssuranceReadContext): Phase9GraphVerdictRecord {
    if (readContext) {
      this.assertAuthorized(input.snapshot.tenantScopeRef, readContext);
    }
    return evaluatePhase9GraphVerdict(input);
  }

  evaluateLatestGraph(
    provider: Phase9GraphSnapshotProvider,
    tenantScopeRef: string,
    input: Omit<Phase9GraphVerdictEvaluationInput, "snapshot" | "edges">,
    readContext: AssuranceReadContext,
  ): Phase9GraphVerdictRecord {
    this.assertAuthorized(tenantScopeRef, readContext);
    const snapshotId = provider.fetchLatestSnapshotRef(tenantScopeRef, readContext);
    invariant(snapshotId, "GRAPH_SNAPSHOT_REQUIRED", `No graph snapshot for ${tenantScopeRef}.`);
    const snapshot = provider.fetchSnapshotById(snapshotId, readContext);
    invariant(snapshot, "GRAPH_SNAPSHOT_REQUIRED", `Snapshot ${snapshotId} was not readable.`);
    const edges = provider.fetchGraphEdges({ snapshotId }, readContext);
    return this.evaluate({ ...input, snapshot, edges }, readContext);
  }

  fetchVerdictById(verdictId: string, readContext?: AssuranceReadContext): Phase9GraphVerdictRecord | undefined {
    const verdict = this.verdicts.get(verdictId);
    if (verdict && readContext) {
      this.assertAuthorized(verdict.scopeRef, readContext);
    }
    return verdict;
  }

  listBlockers(graphSnapshotRef: string, scopeRef: string): readonly Phase9GraphVerdictRecord[] {
    return [...this.verdicts.values()]
      .filter(
        (verdict) =>
          verdict.graphSnapshotRef === graphSnapshotRef &&
          verdict.scopeRef === scopeRef &&
          verdict.state !== "complete",
      )
      .sort((left, right) => left.verdictHash.localeCompare(right.verdictHash));
  }

  explainBlocked(verdictId: string): string {
    const verdict = this.verdicts.get(verdictId);
    invariant(verdict, "VERDICT_NOT_FOUND", `Verdict ${verdictId} not found.`);
    if (verdict.state === "complete") {
      return `${verdict.context} is complete for ${verdict.scopeRef}.`;
    }
    return `${verdict.context} is ${verdict.state} for ${verdict.scopeRef}: ${verdict.reasonCodes.join(", ")}`;
  }

  compareVerdicts(left: Phase9GraphVerdictRecord, right: Phase9GraphVerdictRecord): Phase9GraphVerdictComparison {
    const leftReasons = new Set(left.reasonCodes);
    const rightReasons = new Set(right.reasonCodes);
    return {
      leftVerdictRef: left.verdictId,
      rightVerdictRef: right.verdictId,
      sameDecision: left.verdictHash === right.verdictHash,
      addedReasonCodes: uniqueSorted(right.reasonCodes.filter((reason) => !leftReasons.has(reason))),
      removedReasonCodes: uniqueSorted(left.reasonCodes.filter((reason) => !rightReasons.has(reason))),
      stateChanged: left.state !== right.state,
    };
  }

  assertConsumerHasCompleteVerdict(context: Phase9GraphConsumerContext, verdict: Phase9GraphVerdictRecord | undefined): void {
    invariant(verdict, "GRAPH_VERDICT_REQUIRED", `${context} requires a graph verdict.`);
    invariant(verdict.context === context, "GRAPH_VERDICT_CONTEXT_MISMATCH", `${context} requires a matching verdict context.`);
    invariant(verdict.state === "complete", "GRAPH_VERDICT_NOT_COMPLETE", `${context} must fail closed without a complete verdict.`);
  }

  private cacheKey(input: Phase9GraphVerdictEvaluationInput, policy: Phase9GraphVerdictPolicy): string {
    return hashAssurancePayload(
      {
        graphHash: input.snapshot.graphHash,
        context: input.context,
        scopeRef: input.scopeRef,
        policyHash: policy.policyHash,
        evaluatorVersion: policy.evaluatorVersion,
      },
      "phase9.graph-verdict.cache-key",
    );
  }

  private assertAuthorized(tenantScopeRef: string, readContext: AssuranceReadContext): void {
    invariant(readContext.tenantId === tenantScopeRef, "AUTHORIZATION_DENIED", "Verdict read tenant mismatch.");
    invariant(
      ["assurance_reader", "assurance_admin"].includes(readContext.role),
      "AUTHORIZATION_DENIED",
      "Verdict read role is not permitted.",
    );
    invariant(
      ["assurance.operations", "assurance.audit", "assurance.governance"].includes(readContext.purposeOfUseRef),
      "AUTHORIZATION_DENIED",
      "Verdict read purpose-of-use is not permitted.",
    );
  }
}

export interface Phase9GraphVerdictFixture {
  readonly schemaVersion: typeof PHASE9_GRAPH_VERDICT_ENGINE_VERSION;
  readonly generatedAt: string;
  readonly completeVerdict: Phase9GraphVerdictRecord;
  readonly blockedVerdict: Phase9GraphVerdictRecord;
  readonly staleDashboardVerdict: Phase9GraphVerdictRecord;
  readonly strictStaleVerdict: Phase9GraphVerdictRecord;
  readonly comparison: Phase9GraphVerdictComparison;
}

export function createPhase9GraphVerdictFixture(
  snapshot: AssuranceEvidenceGraphSnapshot,
  edges: readonly AssuranceEvidenceGraphEdge[],
): Phase9GraphVerdictFixture {
  const generatedAt = "2026-04-27T09:10:00.000Z";
  const engine = new Phase9GraphVerdictEngine();
  const requiredNodeRefs = [
    ...snapshot.ledgerEntryRefs,
    ...snapshot.evidenceArtifactRefs,
    ...snapshot.controlObjectiveRefs,
  ];
  const completeVerdict = engine.evaluate({
    snapshot,
    edges,
    context: "assurance_pack",
    scopeRef: snapshot.tenantScopeRef,
    generatedAt,
    graphWatermark: snapshot.graphHash,
    requiredLedgerWatermark: snapshot.graphHash,
    requiredNodeRefs,
    requiredEdges: [
      {
        requirementRef: "ledger-produces-artifact",
        fromRef: snapshot.ledgerEntryRefs[0] ?? "",
        toRef: snapshot.evidenceArtifactRefs[0] ?? "",
        edgeType: "ledger_produces_artifact",
      },
    ],
    evidenceFreshness: [
      {
        evidenceRef: snapshot.evidenceArtifactRefs[0] ?? "",
        capturedAt: "2026-04-27T09:05:00.000Z",
        freshnessBudgetMs: 60 * 60 * 1000,
        freshnessState: "current",
      },
    ],
    schemaPins: [
      {
        sourceRef: snapshot.ledgerEntryRefs[0] ?? "",
        schemaVersionRef: "432.phase9.assurance-ledger-contracts.v1",
        normalizationVersionRef: "phase9.assurance.normalization.v1",
      },
    ],
  });
  const blockedVerdict = engine.evaluate({
    snapshot,
    edges: [
      ...edges,
      {
        assuranceEvidenceGraphEdgeId: "aege_436_orphan_demo",
        graphSnapshotRef: snapshot.assuranceEvidenceGraphSnapshotId,
        fromRef: snapshot.evidenceArtifactRefs[0] ?? "",
        toRef: "missing:control",
        edgeType: "artifact_satisfies_control",
        scopeState: "out_of_scope_conflict",
        supersessionState: "unresolved",
        edgeHash: hashAssurancePayload({ orphan: true }, "phase9.graph-verdict.fixture.edge"),
        createdAt: generatedAt,
      },
    ],
    context: "archive_or_delete",
    scopeRef: snapshot.tenantScopeRef,
    generatedAt,
    graphWatermark: "watermark:old",
    requiredLedgerWatermark: "watermark:new",
    requiredNodeRefs: [...requiredNodeRefs, "missing:control"],
    requiredEdges: [
      {
        requirementRef: "retention-dependency-edge",
        fromRef: snapshot.evidenceArtifactRefs[0] ?? "",
        toRef: "missing:control",
        edgeType: "artifact_satisfies_control",
      },
    ],
    visibilityGrants: [
      {
        artifactRef: snapshot.evidenceArtifactRefs[0] ?? "",
        visibilityScope: "support",
        allowedContexts: ["generic_read"],
      },
    ],
    contradictionInputs: [
      {
        contradictionRef: "contradiction:control-state",
        subjectRef: "control:dtac",
        claimRefs: ["claim:satisfied", "claim:blocked"],
      },
    ],
    trustRecords: [
      {
        assuranceSliceTrustRecordId: "astr_436_low",
        sliceRef: "slice:assurance-pack",
        scopeRef: snapshot.tenantScopeRef,
        audienceTier: "governance",
        trustState: "degraded",
        completenessState: "partial",
        trustScore: 0.5,
        trustLowerBound: 0.4,
        freshnessScore: 0.5,
        coverageScore: 0.5,
        lineageScore: 0.5,
        replayScore: 0.5,
        consistencyScore: 0.5,
        hardBlockState: false,
        blockingProducerRefs: [],
        blockingNamespaceRefs: [],
        evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
        evaluationInputHash: hashAssurancePayload({ low: true }, "phase9.graph-verdict.fixture.trust"),
        lastEvaluatedAt: generatedAt,
      },
    ],
    replayChecks: [
      {
        replayCheckRef: "replay:mismatch",
        replayMatchScore: 0.6,
        minimumReplayMatchScore: 0.99,
        snapshotHash: "snapshot:old",
        rebuildHash: "snapshot:new",
      },
    ],
    retentionDependencies: [
      {
        dependencyRef: "retention:dependency-gap",
        requiredNodeRef: "missing:retention-dependency",
      },
    ],
  });
  const staleDashboardVerdict = engine.evaluate({
    snapshot,
    edges,
    context: "operational_dashboard",
    scopeRef: snapshot.tenantScopeRef,
    generatedAt,
    requiredNodeRefs,
    evidenceFreshness: [
      {
        evidenceRef: snapshot.evidenceArtifactRefs[0] ?? "",
        capturedAt: "2026-04-25T09:05:00.000Z",
        freshnessBudgetMs: 60 * 60 * 1000,
        freshnessState: "stale",
      },
    ],
  });
  const strictStaleVerdict = engine.evaluate({
    snapshot,
    edges,
    context: "support_replay",
    scopeRef: snapshot.tenantScopeRef,
    generatedAt,
    requiredNodeRefs,
    evidenceFreshness: [
      {
        evidenceRef: snapshot.evidenceArtifactRefs[0] ?? "",
        capturedAt: "2026-04-25T09:05:00.000Z",
        freshnessBudgetMs: 60 * 60 * 1000,
        freshnessState: "stale",
      },
    ],
  });
  return {
    schemaVersion: PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
    generatedAt,
    completeVerdict,
    blockedVerdict,
    staleDashboardVerdict,
    strictStaleVerdict,
    comparison: engine.compareVerdicts(completeVerdict, blockedVerdict),
  };
}

export function phase9GraphVerdictSummary(fixture: Phase9GraphVerdictFixture): string {
  return [
    "# Phase 9 Graph Completeness Verdict Engine",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Complete verdict: ${fixture.completeVerdict.verdictId}`,
    `Blocked verdict: ${fixture.blockedVerdict.verdictId}`,
    `Blocked reason codes: ${fixture.blockedVerdict.reasonCodes.join(", ")}`,
    `Dashboard stale state: ${fixture.staleDashboardVerdict.state}`,
    `Support replay stale state: ${fixture.strictStaleVerdict.state}`,
    "",
    "## Guarantees",
    "",
    "- Every graph-consuming path can require a structured verdict before authority is granted.",
    "- Orphan edges, missing required edges, stale or superseded evidence, schema mismatch, tenant leakage, visibility gaps, contradictions, low trust, replay mismatch, retention dependency gaps, unsealed snapshots, and cycles produce deterministic blockers.",
    "- Cache keys include graph hash, context, scope, evaluator version, and policy hash.",
    "- Dry-run evaluation is available for admin preview without mutating authoritative verdict storage.",
    "",
  ].join("\n");
}

export function phase9GraphVerdictMatrixCsv(): string {
  return [
    "context,staleHandling,visibilityHandling,defaultPosture",
    "assurance_pack,blocked,strict,fail_closed",
    "audit_timeline,blocked,strict,fail_closed",
    "support_replay,blocked,strict,fail_closed",
    "retention_disposition,blocked,standard,fail_closed",
    "archive_or_delete,blocked,strict,fail_closed",
    "operational_dashboard,stale,standard,diagnostic_when_stale",
    "incident_follow_up,blocked,standard,fail_closed",
    "recovery_proof,blocked,strict,fail_closed",
    "tenant_governance,stale,standard,review_required",
    "generic_read,stale,standard,diagnostic_only",
  ].join("\n") + "\n";
}
