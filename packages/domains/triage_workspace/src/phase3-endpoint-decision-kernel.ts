import {
  RequestBackboneInvariantError,
  buildReviewProjectionRef,
  computeWorkspaceTupleHash,
  createDeterministicBackboneIdGenerator,
  renderDeterministicReviewSummary,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import type { Phase3CommandContext } from "./phase3-triage-kernel";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextEndpointDecisionId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
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

export const phase3EndpointTaxonomy = [
  "admin_resolution",
  "self_care_and_safety_net",
  "clinician_message",
  "clinician_callback",
  "appointment_required",
  "pharmacy_first_candidate",
  "duty_clinician_escalation",
] as const;

export type Phase3EndpointCode = (typeof phase3EndpointTaxonomy)[number];
export type DecisionEpochState = "live" | "superseded" | "committed" | "blocked";
export type EndpointDecisionState =
  | "drafting"
  | "preview_ready"
  | "awaiting_approval"
  | "submitted"
  | "superseded"
  | "abandoned";
export type EndpointDecisionBindingState = "live" | "preview_only" | "stale" | "blocked";
export type EndpointDecisionActionType =
  | "select_endpoint"
  | "update_payload"
  | "preview_outcome"
  | "submit_endpoint"
  | "regenerate_preview";
export type EndpointDecisionSettlementResult =
  | "draft_saved"
  | "preview_ready"
  | "submitted"
  | "stale_recoverable"
  | "blocked_policy"
  | "blocked_approval_gate"
  | "failed";
export type EndpointOutcomePreviewArtifactType =
  | "patient_outcome_preview"
  | "endpoint_rationale_summary"
  | "handoff_seed_preview"
  | "escalation_summary";
export type EndpointOutcomePreviewArtifactState =
  | "summary_only"
  | "interactive_same_shell"
  | "external_handoff_ready"
  | "recovery_only";
export type DecisionSupersessionReasonClass =
  | "evidence_delta"
  | "safety_delta"
  | "duplicate_resolution"
  | "approval_invalidation"
  | "policy_drift"
  | "publication_drift"
  | "trust_downgrade"
  | "identity_drift"
  | "ownership_drift"
  | "reopen"
  | "manual_replace";
export type ApprovalRequirementState = "required" | "not_required";
export type BoundaryTupleClass = "admin_resolution" | "self_care_and_safety_net";
export type DecisionFenceWriteState = "live" | "preview_only" | "blocked";

const decisionEpochStates: readonly DecisionEpochState[] = [
  "live",
  "superseded",
  "committed",
  "blocked",
];
const endpointDecisionStates: readonly EndpointDecisionState[] = [
  "drafting",
  "preview_ready",
  "awaiting_approval",
  "submitted",
  "superseded",
  "abandoned",
];
const bindingStates: readonly EndpointDecisionBindingState[] = [
  "live",
  "preview_only",
  "stale",
  "blocked",
];
const actionTypes: readonly EndpointDecisionActionType[] = [
  "select_endpoint",
  "update_payload",
  "preview_outcome",
  "submit_endpoint",
  "regenerate_preview",
];
const settlementResults: readonly EndpointDecisionSettlementResult[] = [
  "draft_saved",
  "preview_ready",
  "submitted",
  "stale_recoverable",
  "blocked_policy",
  "blocked_approval_gate",
  "failed",
];
const previewArtifactTypes: readonly EndpointOutcomePreviewArtifactType[] = [
  "patient_outcome_preview",
  "endpoint_rationale_summary",
  "handoff_seed_preview",
  "escalation_summary",
];
const previewArtifactStates: readonly EndpointOutcomePreviewArtifactState[] = [
  "summary_only",
  "interactive_same_shell",
  "external_handoff_ready",
  "recovery_only",
];
const supersessionReasonClasses: readonly DecisionSupersessionReasonClass[] = [
  "evidence_delta",
  "safety_delta",
  "duplicate_resolution",
  "approval_invalidation",
  "policy_drift",
  "publication_drift",
  "trust_downgrade",
  "identity_drift",
  "ownership_drift",
  "reopen",
  "manual_replace",
];
const approvalRequirementStates: readonly ApprovalRequirementState[] = ["required", "not_required"];

export interface DecisionEpochFenceInput {
  taskId: string;
  requestId: string;
  reviewSessionRef: string;
  reviewVersionRef: number;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  governingSnapshotRef: string;
  evidenceSnapshotRef: string;
  compiledPolicyBundleRef: string;
  safetyDecisionEpochRef: string;
  duplicateLineageRef: string | null;
  lineageFenceEpoch: number;
  ownershipEpochRef: number;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  workspaceSliceTrustProjectionRef: string;
  continuityEvidenceRef: string;
  releaseRecoveryDispositionRef: string;
  writeState: DecisionFenceWriteState;
}

export interface DecisionPreviewInput {
  requestSummaryLines: readonly string[];
  patientNarrative: readonly string[];
  safetySummaryLines: readonly string[];
  contactSummaryLines: readonly string[];
  duplicateSummaryLines: readonly string[];
  identitySummaryLines: readonly string[];
  priorResponseSummaryLines: readonly string[];
  sourceArtifactRefs: readonly string[];
  reviewBundleDigestRef: string;
  rulesVersion: string;
  templateVersion: string;
}

export interface DecisionEpochSnapshot {
  epochId: string;
  taskId: string;
  requestId: string;
  reviewSessionRef: string;
  reviewVersionRef: number;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  governingSnapshotRef: string;
  evidenceSnapshotRef: string;
  compiledPolicyBundleRef: string;
  safetyDecisionEpochRef: string;
  duplicateLineageRef: string | null;
  lineageFenceEpoch: number;
  ownershipEpochRef: number;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  workspaceSliceTrustProjectionRef: string;
  continuityEvidenceRef: string;
  decisionTupleHash: string;
  epochState: DecisionEpochState;
  createdAt: string;
  updatedAt: string;
  supersededAt: string | null;
  supersededByEpochRef: string | null;
  version: number;
}

export interface EndpointDecisionSnapshot {
  decisionId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  chosenEndpoint: Phase3EndpointCode;
  decisionVersion: number;
  payloadHash: string;
  reasoningText: string;
  payload: Readonly<Record<string, unknown>>;
  requiredApprovalMode: ApprovalRequirementState;
  previewArtifactRef: string | null;
  previewDigestRef: string | null;
  approvalAssessmentRef: string;
  boundaryTupleRef: string | null;
  decisionState: EndpointDecisionState;
  createdAt: string;
  updatedAt: string;
  supersededAt: string | null;
  supersededByDecisionRef: string | null;
  version: number;
}

export interface EndpointDecisionBindingSnapshot {
  bindingId: string;
  taskId: string;
  decisionId: string;
  decisionEpochRef: string;
  boundaryTupleHash: string;
  boundaryDecisionState: "aligned" | "drifted" | "not_applicable";
  clinicalMeaningState: "bounded" | "requires_approval" | "escalation_only";
  operationalFollowUpScope: "none" | "direct_resolution" | "approval_gate" | "escalation_gate";
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  workspaceSliceTrustProjectionRef: string;
  releaseRecoveryDispositionRef: string;
  approvalAssessmentRef: string;
  boundaryTupleRef: string | null;
  bindingState: EndpointDecisionBindingState;
  evaluatedAt: string;
  version: number;
}

export interface EndpointDecisionActionRecordSnapshot {
  endpointDecisionActionRecordId: string;
  taskId: string;
  requestId: string;
  decisionId: string;
  decisionEpochRef: string;
  actionType: EndpointDecisionActionType;
  routeIntentTupleHash: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  payloadHash: string;
  actorRef: string;
  recordedAt: string;
  version: number;
}

export interface EndpointDecisionSettlementSnapshot {
  endpointDecisionSettlementId: string;
  taskId: string;
  requestId: string;
  decisionId: string;
  endpointDecisionActionRecordRef: string;
  decisionEpochRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  previewArtifactRef: string | null;
  result: EndpointDecisionSettlementResult;
  recoveryRouteRef: string | null;
  recordedAt: string;
  version: number;
}

export interface EndpointOutcomePreviewArtifactSnapshot {
  previewArtifactId: string;
  taskId: string;
  requestId: string;
  decisionId: string;
  decisionEpochRef: string;
  artifactType: EndpointOutcomePreviewArtifactType;
  artifactState: EndpointOutcomePreviewArtifactState;
  selectedAnchorRef: string;
  summaryDigest: string;
  previewDigest: string;
  headline: string;
  summaryLines: readonly string[];
  patientFacingSummary: string;
  provenanceRefs: readonly string[];
  generatedAt: string;
  version: number;
}

export interface DecisionSupersessionRecordSnapshot {
  decisionSupersessionRecordId: string;
  taskId: string;
  requestId: string;
  priorDecisionEpochRef: string;
  replacementDecisionEpochRef: string;
  priorDecisionRef: string | null;
  replacementDecisionRef: string | null;
  reasonClass: DecisionSupersessionReasonClass;
  reasonCodeRefs: readonly string[];
  priorTupleHash: string;
  replacementTupleHash: string;
  recordedAt: string;
  version: number;
}

export interface ApprovalRequirementAssessmentSnapshot {
  assessmentId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  decisionId: string;
  endpointCode: Phase3EndpointCode;
  requiredApprovalMode: ApprovalRequirementState;
  policyMatrixRef: string;
  tupleHash: string;
  assessedAt: string;
  version: number;
}

export interface EndpointBoundaryTupleSnapshot {
  boundaryTupleId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  decisionId: string;
  endpointCode: BoundaryTupleClass;
  boundaryDecisionState: "aligned" | "drifted";
  clinicalMeaningState: "bounded";
  operationalFollowUpScope: "direct_resolution";
  tupleHash: string;
  createdAt: string;
  version: number;
}

export interface EndpointDecisionBundle {
  epoch: DecisionEpochSnapshot;
  decision: EndpointDecisionSnapshot;
  binding: EndpointDecisionBindingSnapshot;
  approvalAssessment: ApprovalRequirementAssessmentSnapshot;
  boundaryTuple: EndpointBoundaryTupleSnapshot | null;
  previewArtifact: EndpointOutcomePreviewArtifactSnapshot | null;
  latestSupersession: DecisionSupersessionRecordSnapshot | null;
}

export interface EndpointDecisionMutationResult extends EndpointDecisionBundle {
  actionRecord: EndpointDecisionActionRecordSnapshot;
  settlement: EndpointDecisionSettlementSnapshot;
  supersessionRecord: DecisionSupersessionRecordSnapshot | null;
}

export interface Phase3EndpointDecisionKernelRepositories {
  getDecisionEpoch(epochId: string): Promise<DecisionEpochSnapshot | null>;
  saveDecisionEpoch(epoch: DecisionEpochSnapshot, options?: CompareAndSetWriteOptions): Promise<void>;
  listDecisionEpochsForTask(taskId: string): Promise<readonly DecisionEpochSnapshot[]>;
  getCurrentDecisionEpochForTask(taskId: string): Promise<DecisionEpochSnapshot | null>;

  getDecision(decisionId: string): Promise<EndpointDecisionSnapshot | null>;
  saveDecision(
    decision: EndpointDecisionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDecisionsForTask(taskId: string): Promise<readonly EndpointDecisionSnapshot[]>;
  getCurrentDecisionForTask(taskId: string): Promise<EndpointDecisionSnapshot | null>;

  saveBinding(
    binding: EndpointDecisionBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBindingForDecision(decisionId: string): Promise<EndpointDecisionBindingSnapshot | null>;
  listBindingsForTask(taskId: string): Promise<readonly EndpointDecisionBindingSnapshot[]>;

  saveActionRecord(
    actionRecord: EndpointDecisionActionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listActionRecordsForTask(taskId: string): Promise<readonly EndpointDecisionActionRecordSnapshot[]>;

  saveSettlement(
    settlement: EndpointDecisionSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSettlementsForTask(taskId: string): Promise<readonly EndpointDecisionSettlementSnapshot[]>;

  savePreviewArtifact(
    previewArtifact: EndpointOutcomePreviewArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPreviewArtifact(previewArtifactId: string): Promise<EndpointOutcomePreviewArtifactSnapshot | null>;
  listPreviewArtifactsForTask(taskId: string): Promise<readonly EndpointOutcomePreviewArtifactSnapshot[]>;

  saveSupersessionRecord(
    record: DecisionSupersessionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSupersessionRecordsForTask(taskId: string): Promise<readonly DecisionSupersessionRecordSnapshot[]>;

  saveApprovalAssessment(
    assessment: ApprovalRequirementAssessmentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getApprovalAssessment(
    assessmentId: string,
  ): Promise<ApprovalRequirementAssessmentSnapshot | null>;
  listApprovalAssessmentsForTask(
    taskId: string,
  ): Promise<readonly ApprovalRequirementAssessmentSnapshot[]>;

  saveBoundaryTuple(
    boundaryTuple: EndpointBoundaryTupleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getBoundaryTuple(boundaryTupleId: string): Promise<EndpointBoundaryTupleSnapshot | null>;
  listBoundaryTuplesForTask(taskId: string): Promise<readonly EndpointBoundaryTupleSnapshot[]>;

  withTaskBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3EndpointDecisionKernelStore
  implements Phase3EndpointDecisionKernelRepositories
{
  private readonly epochs = new Map<string, DecisionEpochSnapshot>();
  private readonly epochsByTask = new Map<string, string[]>();
  private readonly currentEpochByTask = new Map<string, string>();

  private readonly decisions = new Map<string, EndpointDecisionSnapshot>();
  private readonly decisionsByTask = new Map<string, string[]>();
  private readonly currentDecisionByTask = new Map<string, string>();

  private readonly bindings = new Map<string, EndpointDecisionBindingSnapshot>();
  private readonly currentBindingByDecision = new Map<string, string>();
  private readonly bindingsByTask = new Map<string, string[]>();

  private readonly actionRecords = new Map<string, EndpointDecisionActionRecordSnapshot>();
  private readonly actionRecordsByTask = new Map<string, string[]>();

  private readonly settlements = new Map<string, EndpointDecisionSettlementSnapshot>();
  private readonly settlementsByTask = new Map<string, string[]>();

  private readonly previewArtifacts = new Map<string, EndpointOutcomePreviewArtifactSnapshot>();
  private readonly previewArtifactsByTask = new Map<string, string[]>();

  private readonly supersessions = new Map<string, DecisionSupersessionRecordSnapshot>();
  private readonly supersessionsByTask = new Map<string, string[]>();

  private readonly approvalAssessments = new Map<string, ApprovalRequirementAssessmentSnapshot>();
  private readonly approvalAssessmentsByTask = new Map<string, string[]>();

  private readonly boundaryTuples = new Map<string, EndpointBoundaryTupleSnapshot>();
  private readonly boundaryTuplesByTask = new Map<string, string[]>();

  private boundaryQueue: Promise<void> = Promise.resolve();

  async withTaskBoundary<T>(operation: () => Promise<T>): Promise<T> {
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

  async getDecisionEpoch(epochId: string): Promise<DecisionEpochSnapshot | null> {
    return this.epochs.get(epochId) ?? null;
  }

  async saveDecisionEpoch(
    epoch: DecisionEpochSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.epochs, epoch.epochId, epoch, options);
    const existing = this.epochsByTask.get(epoch.taskId) ?? [];
    if (!existing.includes(epoch.epochId)) {
      this.epochsByTask.set(epoch.taskId, [...existing, epoch.epochId]);
    }
    if (epoch.epochState === "live" || epoch.epochState === "committed") {
      this.currentEpochByTask.set(epoch.taskId, epoch.epochId);
    } else if (this.currentEpochByTask.get(epoch.taskId) === epoch.epochId) {
      this.currentEpochByTask.delete(epoch.taskId);
    }
  }

  async listDecisionEpochsForTask(taskId: string): Promise<readonly DecisionEpochSnapshot[]> {
    const ids = this.epochsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.epochs.get(id))
      .filter((entry): entry is DecisionEpochSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getCurrentDecisionEpochForTask(taskId: string): Promise<DecisionEpochSnapshot | null> {
    const current = this.currentEpochByTask.get(taskId);
    return current ? (this.epochs.get(current) ?? null) : null;
  }

  async getDecision(decisionId: string): Promise<EndpointDecisionSnapshot | null> {
    return this.decisions.get(decisionId) ?? null;
  }

  async saveDecision(
    decision: EndpointDecisionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.decisions, decision.decisionId, decision, options);
    const existing = this.decisionsByTask.get(decision.taskId) ?? [];
    if (!existing.includes(decision.decisionId)) {
      this.decisionsByTask.set(decision.taskId, [...existing, decision.decisionId]);
    }
    if (
      decision.decisionState !== "superseded" &&
      decision.decisionState !== "abandoned"
    ) {
      this.currentDecisionByTask.set(decision.taskId, decision.decisionId);
    } else if (this.currentDecisionByTask.get(decision.taskId) === decision.decisionId) {
      this.currentDecisionByTask.delete(decision.taskId);
    }
  }

  async listDecisionsForTask(taskId: string): Promise<readonly EndpointDecisionSnapshot[]> {
    const ids = this.decisionsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.decisions.get(id))
      .filter((entry): entry is EndpointDecisionSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getCurrentDecisionForTask(taskId: string): Promise<EndpointDecisionSnapshot | null> {
    const current = this.currentDecisionByTask.get(taskId);
    return current ? (this.decisions.get(current) ?? null) : null;
  }

  async saveBinding(
    binding: EndpointDecisionBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.bindings, binding.bindingId, binding, options);
    const existing = this.bindingsByTask.get(binding.taskId) ?? [];
    if (!existing.includes(binding.bindingId)) {
      this.bindingsByTask.set(binding.taskId, [...existing, binding.bindingId]);
    }
    this.currentBindingByDecision.set(binding.decisionId, binding.bindingId);
  }

  async getCurrentBindingForDecision(
    decisionId: string,
  ): Promise<EndpointDecisionBindingSnapshot | null> {
    const current = this.currentBindingByDecision.get(decisionId);
    return current ? (this.bindings.get(current) ?? null) : null;
  }

  async listBindingsForTask(taskId: string): Promise<readonly EndpointDecisionBindingSnapshot[]> {
    const ids = this.bindingsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.bindings.get(id))
      .filter((entry): entry is EndpointDecisionBindingSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt));
  }

  async saveActionRecord(
    actionRecord: EndpointDecisionActionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.actionRecords, actionRecord.endpointDecisionActionRecordId, actionRecord, options);
    const existing = this.actionRecordsByTask.get(actionRecord.taskId) ?? [];
    if (!existing.includes(actionRecord.endpointDecisionActionRecordId)) {
      this.actionRecordsByTask.set(actionRecord.taskId, [
        ...existing,
        actionRecord.endpointDecisionActionRecordId,
      ]);
    }
  }

  async listActionRecordsForTask(
    taskId: string,
  ): Promise<readonly EndpointDecisionActionRecordSnapshot[]> {
    const ids = this.actionRecordsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.actionRecords.get(id))
      .filter((entry): entry is EndpointDecisionActionRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async saveSettlement(
    settlement: EndpointDecisionSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.settlements, settlement.endpointDecisionSettlementId, settlement, options);
    const existing = this.settlementsByTask.get(settlement.taskId) ?? [];
    if (!existing.includes(settlement.endpointDecisionSettlementId)) {
      this.settlementsByTask.set(settlement.taskId, [
        ...existing,
        settlement.endpointDecisionSettlementId,
      ]);
    }
  }

  async listSettlementsForTask(
    taskId: string,
  ): Promise<readonly EndpointDecisionSettlementSnapshot[]> {
    const ids = this.settlementsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.settlements.get(id))
      .filter((entry): entry is EndpointDecisionSettlementSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async savePreviewArtifact(
    previewArtifact: EndpointOutcomePreviewArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const current = this.previewArtifacts.get(previewArtifact.previewArtifactId);
    if (
      current &&
      current.previewDigest === previewArtifact.previewDigest &&
      current.summaryDigest === previewArtifact.summaryDigest &&
      current.version === previewArtifact.version &&
      current.artifactState === previewArtifact.artifactState
    ) {
      return;
    }
    saveWithCas(this.previewArtifacts, previewArtifact.previewArtifactId, previewArtifact, options);
    const existing = this.previewArtifactsByTask.get(previewArtifact.taskId) ?? [];
    if (!existing.includes(previewArtifact.previewArtifactId)) {
      this.previewArtifactsByTask.set(previewArtifact.taskId, [
        ...existing,
        previewArtifact.previewArtifactId,
      ]);
    }
  }

  async getPreviewArtifact(
    previewArtifactId: string,
  ): Promise<EndpointOutcomePreviewArtifactSnapshot | null> {
    return this.previewArtifacts.get(previewArtifactId) ?? null;
  }

  async listPreviewArtifactsForTask(
    taskId: string,
  ): Promise<readonly EndpointOutcomePreviewArtifactSnapshot[]> {
    const ids = this.previewArtifactsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.previewArtifacts.get(id))
      .filter((entry): entry is EndpointOutcomePreviewArtifactSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.generatedAt, right.generatedAt));
  }

  async saveSupersessionRecord(
    record: DecisionSupersessionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.supersessions, record.decisionSupersessionRecordId, record, options);
    const existing = this.supersessionsByTask.get(record.taskId) ?? [];
    if (!existing.includes(record.decisionSupersessionRecordId)) {
      this.supersessionsByTask.set(record.taskId, [
        ...existing,
        record.decisionSupersessionRecordId,
      ]);
    }
  }

  async listSupersessionRecordsForTask(
    taskId: string,
  ): Promise<readonly DecisionSupersessionRecordSnapshot[]> {
    const ids = this.supersessionsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.supersessions.get(id))
      .filter((entry): entry is DecisionSupersessionRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async saveApprovalAssessment(
    assessment: ApprovalRequirementAssessmentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.approvalAssessments, assessment.assessmentId, assessment, options);
    const existing = this.approvalAssessmentsByTask.get(assessment.taskId) ?? [];
    if (!existing.includes(assessment.assessmentId)) {
      this.approvalAssessmentsByTask.set(assessment.taskId, [...existing, assessment.assessmentId]);
    }
  }

  async getApprovalAssessment(
    assessmentId: string,
  ): Promise<ApprovalRequirementAssessmentSnapshot | null> {
    return this.approvalAssessments.get(assessmentId) ?? null;
  }

  async listApprovalAssessmentsForTask(
    taskId: string,
  ): Promise<readonly ApprovalRequirementAssessmentSnapshot[]> {
    const ids = this.approvalAssessmentsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.approvalAssessments.get(id))
      .filter((entry): entry is ApprovalRequirementAssessmentSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.assessedAt, right.assessedAt));
  }

  async saveBoundaryTuple(
    boundaryTuple: EndpointBoundaryTupleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.boundaryTuples, boundaryTuple.boundaryTupleId, boundaryTuple, options);
    const existing = this.boundaryTuplesByTask.get(boundaryTuple.taskId) ?? [];
    if (!existing.includes(boundaryTuple.boundaryTupleId)) {
      this.boundaryTuplesByTask.set(boundaryTuple.taskId, [
        ...existing,
        boundaryTuple.boundaryTupleId,
      ]);
    }
  }

  async getBoundaryTuple(boundaryTupleId: string): Promise<EndpointBoundaryTupleSnapshot | null> {
    return this.boundaryTuples.get(boundaryTupleId) ?? null;
  }

  async listBoundaryTuplesForTask(
    taskId: string,
  ): Promise<readonly EndpointBoundaryTupleSnapshot[]> {
    const ids = this.boundaryTuplesByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.boundaryTuples.get(id))
      .filter((entry): entry is EndpointBoundaryTupleSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }
}

export function createPhase3EndpointDecisionKernelStore(): Phase3EndpointDecisionKernelRepositories {
  return new InMemoryPhase3EndpointDecisionKernelStore();
}

function validateEndpointCode(endpointCode: string): Phase3EndpointCode {
  invariant(
    phase3EndpointTaxonomy.includes(endpointCode as Phase3EndpointCode),
    "INVALID_ENDPOINT_CODE",
    "Unsupported endpoint code.",
  );
  return endpointCode as Phase3EndpointCode;
}

function validateDecisionState(state: string): EndpointDecisionState {
  invariant(
    endpointDecisionStates.includes(state as EndpointDecisionState),
    "INVALID_ENDPOINT_DECISION_STATE",
    "Unsupported endpoint decision state.",
  );
  return state as EndpointDecisionState;
}

function validateDecisionEpochState(state: string): DecisionEpochState {
  invariant(
    decisionEpochStates.includes(state as DecisionEpochState),
    "INVALID_DECISION_EPOCH_STATE",
    "Unsupported decision epoch state.",
  );
  return state as DecisionEpochState;
}

function validateBindingState(state: string): EndpointDecisionBindingState {
  invariant(
    bindingStates.includes(state as EndpointDecisionBindingState),
    "INVALID_BINDING_STATE",
    "Unsupported endpoint decision binding state.",
  );
  return state as EndpointDecisionBindingState;
}

function validateActionType(actionType: string): EndpointDecisionActionType {
  invariant(
    actionTypes.includes(actionType as EndpointDecisionActionType),
    "INVALID_ENDPOINT_ACTION_TYPE",
    "Unsupported endpoint decision action type.",
  );
  return actionType as EndpointDecisionActionType;
}

function validateSettlementResult(result: string): EndpointDecisionSettlementResult {
  invariant(
    settlementResults.includes(result as EndpointDecisionSettlementResult),
    "INVALID_ENDPOINT_SETTLEMENT_RESULT",
    "Unsupported endpoint settlement result.",
  );
  return result as EndpointDecisionSettlementResult;
}

function normalizeEpoch(input: DecisionEpochSnapshot): DecisionEpochSnapshot {
  return {
    ...input,
    epochId: requireRef(input.epochId, "epochId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    reviewSessionRef: requireRef(input.reviewSessionRef, "reviewSessionRef"),
    reviewVersionRef: ensureNonNegativeInteger(input.reviewVersionRef, "reviewVersionRef"),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    selectedAnchorTupleHashRef: requireRef(
      input.selectedAnchorTupleHashRef,
      "selectedAnchorTupleHashRef",
    ),
    governingSnapshotRef: requireRef(input.governingSnapshotRef, "governingSnapshotRef"),
    evidenceSnapshotRef: requireRef(input.evidenceSnapshotRef, "evidenceSnapshotRef"),
    compiledPolicyBundleRef: requireRef(
      input.compiledPolicyBundleRef,
      "compiledPolicyBundleRef",
    ),
    safetyDecisionEpochRef: requireRef(input.safetyDecisionEpochRef, "safetyDecisionEpochRef"),
    duplicateLineageRef: optionalRef(input.duplicateLineageRef),
    lineageFenceEpoch: ensureNonNegativeInteger(input.lineageFenceEpoch, "lineageFenceEpoch"),
    ownershipEpochRef: ensureNonNegativeInteger(input.ownershipEpochRef, "ownershipEpochRef"),
    audienceSurfaceRuntimeBindingRef: requireRef(
      input.audienceSurfaceRuntimeBindingRef,
      "audienceSurfaceRuntimeBindingRef",
    ),
    surfaceRouteContractRef: requireRef(input.surfaceRouteContractRef, "surfaceRouteContractRef"),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    releasePublicationParityRef: requireRef(
      input.releasePublicationParityRef,
      "releasePublicationParityRef",
    ),
    workspaceSliceTrustProjectionRef: requireRef(
      input.workspaceSliceTrustProjectionRef,
      "workspaceSliceTrustProjectionRef",
    ),
    continuityEvidenceRef: requireRef(input.continuityEvidenceRef, "continuityEvidenceRef"),
    decisionTupleHash: requireRef(input.decisionTupleHash, "decisionTupleHash"),
    epochState: validateDecisionEpochState(input.epochState),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
    supersededAt: input.supersededAt ? ensureIsoTimestamp(input.supersededAt, "supersededAt") : null,
    supersededByEpochRef: optionalRef(input.supersededByEpochRef),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeDecision(
  input: EndpointDecisionSnapshot,
): EndpointDecisionSnapshot {
  return {
    ...input,
    decisionId: requireRef(input.decisionId, "decisionId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    chosenEndpoint: validateEndpointCode(input.chosenEndpoint),
    decisionVersion: ensurePositiveInteger(input.decisionVersion, "decisionVersion"),
    payloadHash: requireRef(input.payloadHash, "payloadHash"),
    reasoningText: requireRef(input.reasoningText, "reasoningText"),
    payload: JSON.parse(stableStringify(input.payload)) as Readonly<Record<string, unknown>>,
    requiredApprovalMode: (() => {
      invariant(
        approvalRequirementStates.includes(input.requiredApprovalMode),
        "INVALID_REQUIRED_APPROVAL_MODE",
        "requiredApprovalMode must use the frozen approval requirement vocabulary.",
      );
      return input.requiredApprovalMode;
    })(),
    previewArtifactRef: optionalRef(input.previewArtifactRef),
    previewDigestRef: optionalRef(input.previewDigestRef),
    approvalAssessmentRef: requireRef(input.approvalAssessmentRef, "approvalAssessmentRef"),
    boundaryTupleRef: optionalRef(input.boundaryTupleRef),
    decisionState: validateDecisionState(input.decisionState),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
    supersededAt: input.supersededAt ? ensureIsoTimestamp(input.supersededAt, "supersededAt") : null,
    supersededByDecisionRef: optionalRef(input.supersededByDecisionRef),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeBinding(
  input: EndpointDecisionBindingSnapshot,
): EndpointDecisionBindingSnapshot {
  return {
    ...input,
    bindingId: requireRef(input.bindingId, "bindingId"),
    taskId: requireRef(input.taskId, "taskId"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    selectedAnchorTupleHashRef: requireRef(
      input.selectedAnchorTupleHashRef,
      "selectedAnchorTupleHashRef",
    ),
    surfaceRouteContractRef: requireRef(input.surfaceRouteContractRef, "surfaceRouteContractRef"),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    workspaceSliceTrustProjectionRef: requireRef(
      input.workspaceSliceTrustProjectionRef,
      "workspaceSliceTrustProjectionRef",
    ),
    releaseRecoveryDispositionRef: requireRef(
      input.releaseRecoveryDispositionRef,
      "releaseRecoveryDispositionRef",
    ),
    approvalAssessmentRef: requireRef(input.approvalAssessmentRef, "approvalAssessmentRef"),
    boundaryTupleRef: optionalRef(input.boundaryTupleRef),
    bindingState: validateBindingState(input.bindingState),
    evaluatedAt: ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeActionRecord(
  input: EndpointDecisionActionRecordSnapshot,
): EndpointDecisionActionRecordSnapshot {
  return {
    ...input,
    endpointDecisionActionRecordId: requireRef(
      input.endpointDecisionActionRecordId,
      "endpointDecisionActionRecordId",
    ),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    actionType: validateActionType(input.actionType),
    routeIntentTupleHash: requireRef(input.routeIntentTupleHash, "routeIntentTupleHash"),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    payloadHash: requireRef(input.payloadHash, "payloadHash"),
    actorRef: requireRef(input.actorRef, "actorRef"),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeSettlement(
  input: EndpointDecisionSettlementSnapshot,
): EndpointDecisionSettlementSnapshot {
  return {
    ...input,
    endpointDecisionSettlementId: requireRef(
      input.endpointDecisionSettlementId,
      "endpointDecisionSettlementId",
    ),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    endpointDecisionActionRecordRef: requireRef(
      input.endpointDecisionActionRecordRef,
      "endpointDecisionActionRecordRef",
    ),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    transitionEnvelopeRef: requireRef(input.transitionEnvelopeRef, "transitionEnvelopeRef"),
    previewArtifactRef: optionalRef(input.previewArtifactRef),
    result: validateSettlementResult(input.result),
    recoveryRouteRef: optionalRef(input.recoveryRouteRef),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizePreviewArtifact(
  input: EndpointOutcomePreviewArtifactSnapshot,
): EndpointOutcomePreviewArtifactSnapshot {
  invariant(
    previewArtifactTypes.includes(input.artifactType),
    "INVALID_PREVIEW_ARTIFACT_TYPE",
    "Unsupported preview artifact type.",
  );
  invariant(
    previewArtifactStates.includes(input.artifactState),
    "INVALID_PREVIEW_ARTIFACT_STATE",
    "Unsupported preview artifact state.",
  );
  return {
    ...input,
    previewArtifactId: requireRef(input.previewArtifactId, "previewArtifactId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    summaryDigest: requireRef(input.summaryDigest, "summaryDigest"),
    previewDigest: requireRef(input.previewDigest, "previewDigest"),
    headline: requireRef(input.headline, "headline"),
    summaryLines: [...input.summaryLines],
    patientFacingSummary: requireRef(input.patientFacingSummary, "patientFacingSummary"),
    provenanceRefs: uniqueSorted(input.provenanceRefs),
    generatedAt: ensureIsoTimestamp(input.generatedAt, "generatedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeSupersessionRecord(
  input: DecisionSupersessionRecordSnapshot,
): DecisionSupersessionRecordSnapshot {
  invariant(
    supersessionReasonClasses.includes(input.reasonClass),
    "INVALID_SUPERSESSION_REASON_CLASS",
    "Unsupported DecisionSupersessionRecord reasonClass.",
  );
  return {
    ...input,
    decisionSupersessionRecordId: requireRef(
      input.decisionSupersessionRecordId,
      "decisionSupersessionRecordId",
    ),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    priorDecisionEpochRef: requireRef(input.priorDecisionEpochRef, "priorDecisionEpochRef"),
    replacementDecisionEpochRef: requireRef(
      input.replacementDecisionEpochRef,
      "replacementDecisionEpochRef",
    ),
    priorDecisionRef: optionalRef(input.priorDecisionRef),
    replacementDecisionRef: optionalRef(input.replacementDecisionRef),
    reasonCodeRefs: uniqueSorted(input.reasonCodeRefs),
    priorTupleHash: requireRef(input.priorTupleHash, "priorTupleHash"),
    replacementTupleHash: requireRef(input.replacementTupleHash, "replacementTupleHash"),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeApprovalAssessment(
  input: ApprovalRequirementAssessmentSnapshot,
): ApprovalRequirementAssessmentSnapshot {
  invariant(
    approvalRequirementStates.includes(input.requiredApprovalMode),
    "INVALID_APPROVAL_REQUIREMENT_STATE",
    "Unsupported approval requirement state.",
  );
  return {
    ...input,
    assessmentId: requireRef(input.assessmentId, "assessmentId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    endpointCode: validateEndpointCode(input.endpointCode),
    policyMatrixRef: requireRef(input.policyMatrixRef, "policyMatrixRef"),
    tupleHash: requireRef(input.tupleHash, "tupleHash"),
    assessedAt: ensureIsoTimestamp(input.assessedAt, "assessedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeBoundaryTuple(
  input: EndpointBoundaryTupleSnapshot,
): EndpointBoundaryTupleSnapshot {
  invariant(
    input.endpointCode === "admin_resolution" || input.endpointCode === "self_care_and_safety_net",
    "INVALID_BOUNDARY_TUPLE_ENDPOINT",
    "Boundary tuple hooks are only valid for admin_resolution or self_care_and_safety_net.",
  );
  return {
    ...input,
    boundaryTupleId: requireRef(input.boundaryTupleId, "boundaryTupleId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    tupleHash: requireRef(input.tupleHash, "tupleHash"),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function buildDecisionTupleHash(input: DecisionEpochFenceInput): string {
  return computeWorkspaceTupleHash([
    { key: "taskId", value: input.taskId },
    { key: "requestId", value: input.requestId },
    { key: "reviewSessionRef", value: input.reviewSessionRef },
    { key: "reviewVersionRef", value: input.reviewVersionRef },
    { key: "selectedAnchorRef", value: input.selectedAnchorRef },
    { key: "selectedAnchorTupleHashRef", value: input.selectedAnchorTupleHashRef },
    { key: "governingSnapshotRef", value: input.governingSnapshotRef },
    { key: "evidenceSnapshotRef", value: input.evidenceSnapshotRef },
    { key: "compiledPolicyBundleRef", value: input.compiledPolicyBundleRef },
    { key: "safetyDecisionEpochRef", value: input.safetyDecisionEpochRef },
    { key: "duplicateLineageRef", value: input.duplicateLineageRef ?? "none" },
    { key: "lineageFenceEpoch", value: input.lineageFenceEpoch },
    { key: "ownershipEpochRef", value: input.ownershipEpochRef },
    { key: "audienceSurfaceRuntimeBindingRef", value: input.audienceSurfaceRuntimeBindingRef },
    { key: "surfaceRouteContractRef", value: input.surfaceRouteContractRef },
    { key: "surfacePublicationRef", value: input.surfacePublicationRef },
    { key: "runtimePublicationBundleRef", value: input.runtimePublicationBundleRef },
    { key: "releasePublicationParityRef", value: input.releasePublicationParityRef },
    { key: "workspaceSliceTrustProjectionRef", value: input.workspaceSliceTrustProjectionRef },
    { key: "continuityEvidenceRef", value: input.continuityEvidenceRef },
  ]);
}

function buildBoundaryTupleHash(input: {
  endpointCode: Phase3EndpointCode;
  decisionEpochRef: string;
  payloadHash: string;
  selectedAnchorTupleHashRef: string;
}): string {
  return computeWorkspaceTupleHash([
    { key: "endpointCode", value: input.endpointCode },
    { key: "decisionEpochRef", value: input.decisionEpochRef },
    { key: "payloadHash", value: input.payloadHash },
    { key: "selectedAnchorTupleHashRef", value: input.selectedAnchorTupleHashRef },
  ]);
}

function buildPayloadHash(input: {
  endpointCode: Phase3EndpointCode;
  payload: Readonly<Record<string, unknown>>;
  reasoningText: string;
}): string {
  return stableReviewDigest({
    endpointCode: input.endpointCode,
    payload: input.payload,
    reasoningText: input.reasoningText,
  });
}

function requiresField(
  payload: Readonly<Record<string, unknown>>,
  field: string,
): boolean {
  const value = payload[field];
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (typeof value === "number") {
    return true;
  }
  if (typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && value !== undefined;
}

export function validateEndpointPayloadMinimum(
  endpointCode: Phase3EndpointCode,
  payload: Readonly<Record<string, unknown>>,
): void {
  const requiredByEndpoint: Readonly<Record<Phase3EndpointCode, readonly string[]>> = {
    admin_resolution: ["summary"],
    self_care_and_safety_net: ["summary", "safetyNetAdvice"],
    clinician_message: ["messageBody"],
    clinician_callback: ["callbackWindow"],
    appointment_required: ["appointmentReason"],
    pharmacy_first_candidate: ["medicationQuestion"],
    duty_clinician_escalation: ["escalationReason"],
  };
  const missing = requiredByEndpoint[endpointCode].filter((field) => !requiresField(payload, field));
  invariant(
    missing.length === 0,
    "ENDPOINT_PAYLOAD_MINIMUM_NOT_MET",
    `${endpointCode} requires fields: ${missing.join(", ")}.`,
  );
}

export function evaluateApprovalRequirement(input: {
  endpointCode: Phase3EndpointCode;
  payload: Readonly<Record<string, unknown>>;
  compiledPolicyBundleRef: string;
  decisionEpochRef: string;
  taskId: string;
  requestId: string;
  decisionId: string;
  assessedAt: string;
}): ApprovalRequirementAssessmentSnapshot {
  const sensitiveOverride = Boolean(input.payload["sensitiveOverride"]);
  const riskOverride = Boolean(input.payload["highRiskOverride"]);
  const requiredApprovalMode: ApprovalRequirementState =
    input.endpointCode === "appointment_required" ||
    input.endpointCode === "pharmacy_first_candidate" ||
    input.endpointCode === "duty_clinician_escalation" ||
    sensitiveOverride ||
    riskOverride
      ? "required"
      : "not_required";
  const tupleHash = computeWorkspaceTupleHash([
    { key: "decisionEpochRef", value: input.decisionEpochRef },
    { key: "decisionId", value: input.decisionId },
    { key: "endpointCode", value: input.endpointCode },
    { key: "requiredApprovalMode", value: requiredApprovalMode },
    { key: "compiledPolicyBundleRef", value: input.compiledPolicyBundleRef },
  ]);
  return normalizeApprovalAssessment({
    assessmentId: `approval_assessment_${input.taskId}_${tupleHash}`,
    taskId: input.taskId,
    requestId: input.requestId,
    decisionEpochRef: input.decisionEpochRef,
    decisionId: input.decisionId,
    endpointCode: input.endpointCode,
    requiredApprovalMode,
    policyMatrixRef: `${input.compiledPolicyBundleRef}::approval_matrix`,
    tupleHash,
    assessedAt: input.assessedAt,
    version: 1,
  });
}

export function evaluateBoundaryTuple(input: {
  endpointCode: Phase3EndpointCode;
  payloadHash: string;
  decisionEpochRef: string;
  decisionId: string;
  taskId: string;
  requestId: string;
  selectedAnchorTupleHashRef: string;
  createdAt: string;
}): EndpointBoundaryTupleSnapshot | null {
  if (
    input.endpointCode !== "admin_resolution" &&
    input.endpointCode !== "self_care_and_safety_net"
  ) {
    return null;
  }
  const tupleHash = buildBoundaryTupleHash({
    endpointCode: input.endpointCode,
    decisionEpochRef: input.decisionEpochRef,
    payloadHash: input.payloadHash,
    selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
  });
  return normalizeBoundaryTuple({
    boundaryTupleId: `boundary_tuple_${input.taskId}_${tupleHash}`,
    taskId: input.taskId,
    requestId: input.requestId,
    decisionEpochRef: input.decisionEpochRef,
    decisionId: input.decisionId,
    endpointCode: input.endpointCode,
    boundaryDecisionState: "aligned",
    clinicalMeaningState: "bounded",
    operationalFollowUpScope: "direct_resolution",
    tupleHash,
    createdAt: input.createdAt,
    version: 1,
  });
}

export function evaluateBindingState(input: {
  epoch: DecisionEpochSnapshot;
  fence: DecisionEpochFenceInput;
}): EndpointDecisionBindingState {
  if (input.epoch.decisionTupleHash !== buildDecisionTupleHash(input.fence)) {
    return "stale";
  }
  if (input.fence.writeState === "blocked") {
    return "blocked";
  }
  if (input.fence.writeState === "preview_only" || input.epoch.epochState === "blocked") {
    return "preview_only";
  }
  return "live";
}

function classifyBoundaryDecisionState(
  boundaryTuple: EndpointBoundaryTupleSnapshot | null,
  decision: EndpointDecisionSnapshot,
  epoch: DecisionEpochSnapshot,
): EndpointDecisionBindingSnapshot["boundaryDecisionState"] {
  if (!boundaryTuple) {
    return "not_applicable";
  }
  const expectedHash = buildBoundaryTupleHash({
    endpointCode: decision.chosenEndpoint,
    decisionEpochRef: epoch.epochId,
    payloadHash: decision.payloadHash,
    selectedAnchorTupleHashRef: epoch.selectedAnchorTupleHashRef,
  });
  return boundaryTuple.tupleHash === expectedHash ? "aligned" : "drifted";
}

function clinicalMeaningStateForDecision(
  decision: EndpointDecisionSnapshot,
  approvalAssessment: ApprovalRequirementAssessmentSnapshot,
): EndpointDecisionBindingSnapshot["clinicalMeaningState"] {
  if (decision.chosenEndpoint === "duty_clinician_escalation") {
    return "escalation_only";
  }
  if (approvalAssessment.requiredApprovalMode === "required") {
    return "requires_approval";
  }
  return "bounded";
}

function operationalFollowUpScopeForDecision(
  decision: EndpointDecisionSnapshot,
  approvalAssessment: ApprovalRequirementAssessmentSnapshot,
): EndpointDecisionBindingSnapshot["operationalFollowUpScope"] {
  if (decision.chosenEndpoint === "duty_clinician_escalation") {
    return "escalation_gate";
  }
  if (approvalAssessment.requiredApprovalMode === "required") {
    return "approval_gate";
  }
  return decision.chosenEndpoint === "clinician_message" ||
    decision.chosenEndpoint === "clinician_callback" ||
    decision.chosenEndpoint === "appointment_required" ||
    decision.chosenEndpoint === "pharmacy_first_candidate"
    ? "direct_resolution"
    : "none";
}

export function evaluateSupersession(input: {
  epoch: DecisionEpochSnapshot;
  currentFence: DecisionEpochFenceInput;
  nextRequiredApprovalMode?: ApprovalRequirementState | null;
  currentRequiredApprovalMode?: ApprovalRequirementState | null;
  manualReplace?: boolean;
}): {
  supersede: boolean;
  reasonClass: DecisionSupersessionReasonClass | null;
  reasonCodeRefs: readonly string[];
  replacementTupleHash: string;
} {
  const replacementTupleHash = buildDecisionTupleHash(input.currentFence);
  if (input.manualReplace) {
    return {
      supersede: true,
      reasonClass: "manual_replace",
      reasonCodeRefs: ["DECISION_238_MANUAL_REPLACE"],
      replacementTupleHash,
    };
  }

  const reasons: Array<{
    reasonClass: DecisionSupersessionReasonClass;
    reasonCode: string;
    changed: boolean;
  }> = [
    {
      reasonClass: "evidence_delta",
      reasonCode: "DECISION_238_EVIDENCE_SNAPSHOT_DRIFT",
      changed: input.epoch.evidenceSnapshotRef !== input.currentFence.evidenceSnapshotRef,
    },
    {
      reasonClass: "safety_delta",
      reasonCode: "DECISION_238_SAFETY_EPOCH_DRIFT",
      changed: input.epoch.safetyDecisionEpochRef !== input.currentFence.safetyDecisionEpochRef,
    },
    {
      reasonClass: "duplicate_resolution",
      reasonCode: "DECISION_238_DUPLICATE_LINEAGE_DRIFT",
      changed:
        (input.epoch.duplicateLineageRef ?? null) !== (input.currentFence.duplicateLineageRef ?? null),
    },
    {
      reasonClass: "ownership_drift",
      reasonCode: "DECISION_238_OWNERSHIP_EPOCH_DRIFT",
      changed: input.epoch.ownershipEpochRef !== input.currentFence.ownershipEpochRef,
    },
    {
      reasonClass: "evidence_delta",
      reasonCode: "DECISION_238_REVIEW_VERSION_DRIFT",
      changed: input.epoch.reviewVersionRef !== input.currentFence.reviewVersionRef,
    },
    {
      reasonClass: "policy_drift",
      reasonCode: "DECISION_238_SELECTED_ANCHOR_DRIFT",
      changed:
        input.epoch.selectedAnchorRef !== input.currentFence.selectedAnchorRef ||
        input.epoch.selectedAnchorTupleHashRef !== input.currentFence.selectedAnchorTupleHashRef,
    },
    {
      reasonClass: "trust_downgrade",
      reasonCode: "DECISION_238_TRUST_POSTURE_DRIFT",
      changed:
        input.epoch.workspaceSliceTrustProjectionRef !==
          input.currentFence.workspaceSliceTrustProjectionRef ||
        input.currentFence.writeState === "blocked",
    },
    {
      reasonClass: "publication_drift",
      reasonCode: "DECISION_238_PUBLICATION_TUPLE_DRIFT",
      changed:
        input.epoch.surfaceRouteContractRef !== input.currentFence.surfaceRouteContractRef ||
        input.epoch.surfacePublicationRef !== input.currentFence.surfacePublicationRef ||
        input.epoch.runtimePublicationBundleRef !== input.currentFence.runtimePublicationBundleRef ||
        input.epoch.releasePublicationParityRef !== input.currentFence.releasePublicationParityRef,
    },
    {
      reasonClass: "approval_invalidation",
      reasonCode: "DECISION_238_APPROVAL_BURDEN_DRIFT",
      changed:
        input.currentRequiredApprovalMode !== undefined &&
        input.currentRequiredApprovalMode !== null &&
        input.nextRequiredApprovalMode !== undefined &&
        input.nextRequiredApprovalMode !== null &&
        input.currentRequiredApprovalMode !== input.nextRequiredApprovalMode,
    },
  ];

  const changed = reasons.filter((entry) => entry.changed);
  if (changed.length === 0 && input.epoch.decisionTupleHash === replacementTupleHash) {
    return {
      supersede: false,
      reasonClass: null,
      reasonCodeRefs: [],
      replacementTupleHash,
    };
  }
  const reasonClass = changed[0]?.reasonClass ?? "policy_drift";
  return {
    supersede: true,
    reasonClass,
    reasonCodeRefs: changed.map((entry) => entry.reasonCode),
    replacementTupleHash,
  };
}

export function buildDeterministicDecisionPreview(input: {
  taskId: string;
  requestId: string;
  decision: EndpointDecisionSnapshot;
  epoch: DecisionEpochSnapshot;
  bindingState: EndpointDecisionBindingState;
  previewInput: DecisionPreviewInput;
  generatedAt: string;
}): EndpointOutcomePreviewArtifactSnapshot {
  const payloadLines = Object.entries(input.decision.payload)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${stableStringify(value)}`);
  const deterministicSummary = renderDeterministicReviewSummary({
    templateVersion: input.previewInput.templateVersion,
    rulesVersion: input.previewInput.rulesVersion,
    requestSummary: [
      ...input.previewInput.requestSummaryLines,
      `Endpoint: ${input.decision.chosenEndpoint}`,
      `Anchor: ${input.epoch.selectedAnchorRef}`,
    ],
    structuredAnswers: payloadLines.map((line, index) => ({
      questionId: `endpoint_payload_${String(index + 1).padStart(2, "0")}`,
      question: line.split(":")[0] ?? `payload_${index + 1}`,
      answer: line.split(":").slice(1).join(":").trim(),
      sourceArtifactRefs: input.previewInput.sourceArtifactRefs,
    })),
    patientNarrative: input.previewInput.patientNarrative.join(" | "),
    safetySummary: [
      ...input.previewInput.safetySummaryLines,
      `Safety epoch ${input.epoch.safetyDecisionEpochRef}`,
    ],
    telephonySummary: [],
    transcriptSummary: null,
    attachmentLabels: [],
    identitySummary: input.previewInput.identitySummaryLines,
    contactSummary: input.previewInput.contactSummaryLines,
    priorResponseSummary: input.previewInput.priorResponseSummaryLines,
    duplicateSummary: [
      ...input.previewInput.duplicateSummaryLines,
      input.epoch.duplicateLineageRef ? `Duplicate ${input.epoch.duplicateLineageRef}` : "Duplicate clear",
    ],
    slaSummary: [`Binding ${input.bindingState}`],
    visibilityState:
      input.bindingState === "stale" || input.bindingState === "blocked"
        ? "suppressed"
        : input.bindingState === "preview_only"
          ? "provisional"
          : "authoritative",
    suppressionReasonCodes:
      input.bindingState === "stale"
        ? ["DECISION_238_STALE_PREVIEW"]
        : input.bindingState === "blocked"
          ? ["DECISION_238_BLOCKED_PREVIEW"]
          : input.bindingState === "preview_only"
            ? ["DECISION_238_PREVIEW_ONLY"]
            : [],
  });

  const previewDigest = stableReviewDigest({
    taskId: input.taskId,
    requestId: input.requestId,
    decisionId: input.decision.decisionId,
    decisionEpochRef: input.epoch.epochId,
    bindingState: input.bindingState,
    deterministicSummary,
    reviewBundleDigestRef: input.previewInput.reviewBundleDigestRef,
  });

  const artifactState: EndpointOutcomePreviewArtifactState =
    input.bindingState === "blocked" || input.bindingState === "stale"
      ? "recovery_only"
      : input.bindingState === "preview_only"
        ? "summary_only"
        : input.decision.chosenEndpoint === "duty_clinician_escalation"
          ? "external_handoff_ready"
          : "interactive_same_shell";

  const headline = `${input.decision.chosenEndpoint.replaceAll("_", " ")} preview`;
  const summaryLines = [
    `Outcome: ${input.decision.chosenEndpoint}`,
    `Decision epoch: ${input.epoch.epochId}`,
    `Approval: ${input.decision.requiredApprovalMode}`,
    `Binding: ${input.bindingState}`,
    ...deterministicSummary.summaryLines,
  ];

  return normalizePreviewArtifact({
    previewArtifactId: `endpoint_preview_${input.taskId}_${previewDigest}`,
    taskId: input.taskId,
    requestId: input.requestId,
    decisionId: input.decision.decisionId,
    decisionEpochRef: input.epoch.epochId,
    artifactType:
      input.decision.chosenEndpoint === "duty_clinician_escalation"
        ? "escalation_summary"
        : input.decision.chosenEndpoint === "appointment_required" ||
            input.decision.chosenEndpoint === "pharmacy_first_candidate"
          ? "handoff_seed_preview"
          : "patient_outcome_preview",
    artifactState,
    selectedAnchorRef: input.epoch.selectedAnchorRef,
    summaryDigest: deterministicSummary.summaryDigest,
    previewDigest,
    headline,
    summaryLines,
    patientFacingSummary:
      deterministicSummary.summaryText ??
      deterministicSummary.provisionalText ??
      `${headline}. Refresh required before this preview can be committed.`,
    provenanceRefs: uniqueSorted([
      ...input.previewInput.sourceArtifactRefs,
      input.previewInput.reviewBundleDigestRef,
      input.epoch.evidenceSnapshotRef,
      input.epoch.governingSnapshotRef,
    ]),
    generatedAt: input.generatedAt,
    version: 1,
  });
}

export interface SelectEndpointDecisionInput {
  taskId: string;
  requestId: string;
  chosenEndpoint: Phase3EndpointCode;
  reasoningText: string;
  payload: Readonly<Record<string, unknown>>;
  fence: DecisionEpochFenceInput;
  previewInput: DecisionPreviewInput;
  command: Phase3CommandContext;
  manualReplace?: boolean;
}

export interface UpdateEndpointPayloadInput extends SelectEndpointDecisionInput {
  decisionId: string;
}

export interface PreviewEndpointDecisionInput {
  taskId: string;
  requestId: string;
  decisionId: string;
  fence: DecisionEpochFenceInput;
  previewInput: DecisionPreviewInput;
  command: Phase3CommandContext;
}

export interface SubmitEndpointDecisionInput {
  taskId: string;
  requestId: string;
  decisionId: string;
  fence: DecisionEpochFenceInput;
  previewInput: DecisionPreviewInput;
  command: Phase3CommandContext;
}

export interface InvalidateEndpointDecisionInput {
  taskId: string;
  requestId: string;
  decisionId: string;
  fence: DecisionEpochFenceInput;
  previewInput: DecisionPreviewInput;
  command: Phase3CommandContext;
  manualReplace?: boolean;
}

export interface Phase3EndpointDecisionKernelService {
  queryTaskDecisionBundle(taskId: string): Promise<EndpointDecisionBundle | null>;
  selectEndpoint(input: SelectEndpointDecisionInput): Promise<EndpointDecisionMutationResult>;
  updateEndpointPayload(input: UpdateEndpointPayloadInput): Promise<EndpointDecisionMutationResult>;
  previewEndpointOutcome(input: PreviewEndpointDecisionInput): Promise<EndpointDecisionMutationResult>;
  regeneratePreview(input: PreviewEndpointDecisionInput): Promise<EndpointDecisionMutationResult>;
  submitEndpointDecision(input: SubmitEndpointDecisionInput): Promise<EndpointDecisionMutationResult>;
  invalidateStaleDecision(input: InvalidateEndpointDecisionInput): Promise<EndpointDecisionMutationResult>;
}

class Phase3EndpointDecisionKernelServiceImpl
  implements Phase3EndpointDecisionKernelService
{
  constructor(
    private readonly repositories: Phase3EndpointDecisionKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskDecisionBundle(taskId: string): Promise<EndpointDecisionBundle | null> {
    const decision = await this.repositories.getCurrentDecisionForTask(taskId);
    if (!decision) {
      return null;
    }
    return this.bundleForDecision(decision);
  }

  async selectEndpoint(input: SelectEndpointDecisionInput): Promise<EndpointDecisionMutationResult> {
    return this.repositories.withTaskBoundary(async () => {
      validateEndpointPayloadMinimum(input.chosenEndpoint, input.payload);
      const currentDecision = await this.repositories.getCurrentDecisionForTask(input.taskId);
      const currentEpoch = await this.repositories.getCurrentDecisionEpochForTask(input.taskId);
      return this.createOrReplaceDecision({
        taskId: input.taskId,
        requestId: input.requestId,
        chosenEndpoint: input.chosenEndpoint,
        reasoningText: input.reasoningText,
        payload: input.payload,
        fence: input.fence,
        previewInput: input.previewInput,
        command: input.command,
        actionType: "select_endpoint",
        currentDecision,
        currentEpoch,
        manualReplace: input.manualReplace ?? false,
      });
    });
  }

  async updateEndpointPayload(
    input: UpdateEndpointPayloadInput,
  ): Promise<EndpointDecisionMutationResult> {
    return this.repositories.withTaskBoundary(async () => {
      validateEndpointPayloadMinimum(input.chosenEndpoint, input.payload);
      const currentDecision = await this.requireDecision(input.decisionId);
      const currentEpoch = await this.requireEpoch(currentDecision.decisionEpochRef);
      invariant(
        currentDecision.taskId === input.taskId,
        "ENDPOINT_DECISION_TASK_MISMATCH",
        "The requested task and EndpointDecision do not belong together.",
      );
      return this.createOrReplaceDecision({
        taskId: input.taskId,
        requestId: input.requestId,
        chosenEndpoint: input.chosenEndpoint,
        reasoningText: input.reasoningText,
        payload: input.payload,
        fence: input.fence,
        previewInput: input.previewInput,
        command: input.command,
        actionType: "update_payload",
        currentDecision,
        currentEpoch,
        manualReplace: input.manualReplace ?? false,
      });
    });
  }

  async previewEndpointOutcome(
    input: PreviewEndpointDecisionInput,
  ): Promise<EndpointDecisionMutationResult> {
    return this.previewOrRegenerate(input, "preview_outcome");
  }

  async regeneratePreview(
    input: PreviewEndpointDecisionInput,
  ): Promise<EndpointDecisionMutationResult> {
    return this.previewOrRegenerate(input, "regenerate_preview");
  }

  async submitEndpointDecision(
    input: SubmitEndpointDecisionInput,
  ): Promise<EndpointDecisionMutationResult> {
    return this.repositories.withTaskBoundary(async () => {
      const currentDecision = await this.requireDecision(input.decisionId);
      const currentEpoch = await this.requireEpoch(currentDecision.decisionEpochRef);
      const currentApproval = await this.requireApprovalAssessment(currentDecision.approvalAssessmentRef);
      const nextApproval = evaluateApprovalRequirement({
        endpointCode: currentDecision.chosenEndpoint,
        payload: currentDecision.payload,
        compiledPolicyBundleRef: input.fence.compiledPolicyBundleRef,
        decisionEpochRef: currentEpoch.epochId,
        taskId: input.taskId,
        requestId: input.requestId,
        decisionId: currentDecision.decisionId,
        assessedAt: input.command.recordedAt,
      });
      const supersession = evaluateSupersession({
        epoch: currentEpoch,
        currentFence: input.fence,
        currentRequiredApprovalMode: currentApproval.requiredApprovalMode,
        nextRequiredApprovalMode: nextApproval.requiredApprovalMode,
      });
      if (supersession.supersede) {
        return this.rotateDecisionForDrift({
          taskId: input.taskId,
          requestId: input.requestId,
          currentDecision,
          currentEpoch,
          replacementChosenEndpoint: currentDecision.chosenEndpoint,
          replacementReasoningText: currentDecision.reasoningText,
          replacementPayload: currentDecision.payload,
          fence: input.fence,
          previewInput: input.previewInput,
          command: input.command,
          actionType: "submit_endpoint",
          settlementResult: "stale_recoverable",
          supersession,
          carryPreview: true,
        });
      }

      const binding = await this.ensureCurrentBinding({
        decision: currentDecision,
        epoch: currentEpoch,
        approvalAssessment: currentApproval,
        fence: input.fence,
        evaluatedAt: input.command.recordedAt,
      });
      let previewArtifact =
        currentDecision.previewArtifactRef !== null
          ? await this.repositories.getPreviewArtifact(currentDecision.previewArtifactRef)
          : null;
      if (!previewArtifact) {
        previewArtifact = buildDeterministicDecisionPreview({
          taskId: input.taskId,
          requestId: input.requestId,
          decision: currentDecision,
          epoch: currentEpoch,
          bindingState: binding.bindingState,
          previewInput: input.previewInput,
          generatedAt: input.command.recordedAt,
        });
        await this.repositories.savePreviewArtifact(previewArtifact);
      }

      const persistedBoundaryTupleRef = currentDecision.boundaryTupleRef;
      const hasPersistedBoundaryTuple = persistedBoundaryTupleRef !== null;
      const boundaryTuple = hasPersistedBoundaryTuple
        ? await this.repositories.getBoundaryTuple(
            requireRef(persistedBoundaryTupleRef, "boundaryTupleRef"),
          )
        : evaluateBoundaryTuple({
            endpointCode: currentDecision.chosenEndpoint,
            payloadHash: currentDecision.payloadHash,
            decisionEpochRef: currentEpoch.epochId,
            decisionId: currentDecision.decisionId,
            taskId: input.taskId,
            requestId: input.requestId,
            selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
            createdAt: input.command.recordedAt,
          });
      if (boundaryTuple && !hasPersistedBoundaryTuple) {
        await this.repositories.saveBoundaryTuple(boundaryTuple);
      }

      const boundaryState = classifyBoundaryDecisionState(
        boundaryTuple,
        currentDecision,
        currentEpoch,
      );
      const resolvedBinding = normalizeBinding({
        ...binding,
        boundaryDecisionState: boundaryState,
        boundaryTupleRef: boundaryTuple?.boundaryTupleId ?? null,
        bindingState: boundaryState === "drifted" ? "blocked" : binding.bindingState,
        version: binding.version + 1,
      });
      await this.repositories.saveBinding(resolvedBinding, {
        expectedVersion: binding.version,
      });

      const result: EndpointDecisionSettlementResult =
        resolvedBinding.bindingState === "stale"
          ? "stale_recoverable"
          : resolvedBinding.bindingState !== "live"
            ? "blocked_policy"
            : currentApproval.requiredApprovalMode === "required"
              ? "blocked_approval_gate"
              : "submitted";

      const nextDecisionState: EndpointDecisionState =
        result === "submitted"
          ? "submitted"
          : result === "blocked_approval_gate"
            ? "awaiting_approval"
            : "preview_ready";
      const nextEpochState: DecisionEpochState =
        result === "submitted"
          ? "committed"
          : resolvedBinding.bindingState === "blocked"
            ? "blocked"
            : currentEpoch.epochState;

      const updatedDecision = normalizeDecision({
        ...currentDecision,
        previewArtifactRef: previewArtifact.previewArtifactId,
        previewDigestRef: previewArtifact.previewDigest,
        boundaryTupleRef: boundaryTuple?.boundaryTupleId ?? null,
        decisionState: nextDecisionState,
        updatedAt: input.command.recordedAt,
        version: currentDecision.version + 1,
      });
      const updatedEpoch = normalizeEpoch({
        ...currentEpoch,
        epochState: nextEpochState,
        updatedAt: input.command.recordedAt,
        version: currentEpoch.version + 1,
      });
      await this.repositories.saveDecision(updatedDecision, {
        expectedVersion: currentDecision.version,
      });
      await this.repositories.saveDecisionEpoch(updatedEpoch, {
        expectedVersion: currentEpoch.version,
      });

      const actionRecord = this.buildActionRecord({
        taskId: input.taskId,
        requestId: input.requestId,
        decisionId: updatedDecision.decisionId,
        decisionEpochRef: updatedEpoch.epochId,
        actionType: "submit_endpoint",
        payloadHash: updatedDecision.payloadHash,
        command: input.command,
      });
      const settlement = this.buildSettlement({
        taskId: input.taskId,
        requestId: input.requestId,
        decisionId: updatedDecision.decisionId,
        decisionEpochRef: updatedEpoch.epochId,
        actionRecordRef: actionRecord.endpointDecisionActionRecordId,
        previewArtifactRef: previewArtifact.previewArtifactId,
        result,
        command: input.command,
      });

      await this.repositories.saveActionRecord(actionRecord);
      await this.repositories.saveSettlement(settlement);

      return {
        epoch: updatedEpoch,
        decision: updatedDecision,
        binding: resolvedBinding,
        approvalAssessment: currentApproval,
        boundaryTuple,
        previewArtifact,
        latestSupersession: null,
        actionRecord,
        settlement,
        supersessionRecord: null,
      };
    });
  }

  async invalidateStaleDecision(
    input: InvalidateEndpointDecisionInput,
  ): Promise<EndpointDecisionMutationResult> {
    return this.repositories.withTaskBoundary(async () => {
      const currentDecision = await this.requireDecision(input.decisionId);
      const currentEpoch = await this.requireEpoch(currentDecision.decisionEpochRef);
      const currentApproval = await this.requireApprovalAssessment(currentDecision.approvalAssessmentRef);
      const supersession = evaluateSupersession({
        epoch: currentEpoch,
        currentFence: input.fence,
        currentRequiredApprovalMode: currentApproval.requiredApprovalMode,
        nextRequiredApprovalMode: currentApproval.requiredApprovalMode,
        manualReplace: input.manualReplace ?? false,
      });
      invariant(
        supersession.supersede,
        "ENDPOINT_INVALIDATION_NOT_REQUIRED",
        "invalidateStaleDecision requires material drift or manual replacement.",
      );
      return this.rotateDecisionForDrift({
        taskId: input.taskId,
        requestId: input.requestId,
        currentDecision,
        currentEpoch,
        replacementChosenEndpoint: currentDecision.chosenEndpoint,
        replacementReasoningText: currentDecision.reasoningText,
        replacementPayload: currentDecision.payload,
        fence: input.fence,
        previewInput: input.previewInput,
        command: input.command,
        actionType: "regenerate_preview",
        settlementResult:
          input.fence.writeState === "blocked" ? "blocked_policy" : "stale_recoverable",
        supersession,
        carryPreview: true,
      });
    });
  }

  private async previewOrRegenerate(
    input: PreviewEndpointDecisionInput,
    actionType: EndpointDecisionActionType,
  ): Promise<EndpointDecisionMutationResult> {
    return this.repositories.withTaskBoundary(async () => {
      const currentDecision = await this.requireDecision(input.decisionId);
      invariant(
        currentDecision.taskId === input.taskId,
        "ENDPOINT_DECISION_TASK_MISMATCH",
        "The requested task and EndpointDecision do not belong together.",
      );
      const currentEpoch = await this.requireEpoch(currentDecision.decisionEpochRef);
      const currentApproval = await this.requireApprovalAssessment(currentDecision.approvalAssessmentRef);
      const supersession = evaluateSupersession({
        epoch: currentEpoch,
        currentFence: input.fence,
        currentRequiredApprovalMode: currentApproval.requiredApprovalMode,
        nextRequiredApprovalMode: currentApproval.requiredApprovalMode,
      });
      if (supersession.supersede) {
        return this.rotateDecisionForDrift({
          taskId: input.taskId,
          requestId: input.requestId,
          currentDecision,
          currentEpoch,
          replacementChosenEndpoint: currentDecision.chosenEndpoint,
          replacementReasoningText: currentDecision.reasoningText,
          replacementPayload: currentDecision.payload,
          fence: input.fence,
          previewInput: input.previewInput,
          command: input.command,
          actionType,
          settlementResult: "stale_recoverable",
          supersession,
          carryPreview: true,
        });
      }

      const binding = await this.ensureCurrentBinding({
        decision: currentDecision,
        epoch: currentEpoch,
        approvalAssessment: currentApproval,
        fence: input.fence,
        evaluatedAt: input.command.recordedAt,
      });
      const previewArtifact = buildDeterministicDecisionPreview({
        taskId: input.taskId,
        requestId: input.requestId,
        decision: currentDecision,
        epoch: currentEpoch,
        bindingState: binding.bindingState,
        previewInput: input.previewInput,
        generatedAt: input.command.recordedAt,
      });
      await this.repositories.savePreviewArtifact(previewArtifact);
      const updatedDecision = normalizeDecision({
        ...currentDecision,
        previewArtifactRef: previewArtifact.previewArtifactId,
        previewDigestRef: previewArtifact.previewDigest,
        decisionState: "preview_ready",
        updatedAt: input.command.recordedAt,
        version: currentDecision.version + 1,
      });
      await this.repositories.saveDecision(updatedDecision, {
        expectedVersion: currentDecision.version,
      });
      const actionRecord = this.buildActionRecord({
        taskId: input.taskId,
        requestId: input.requestId,
        decisionId: updatedDecision.decisionId,
        decisionEpochRef: currentEpoch.epochId,
        actionType,
        payloadHash: updatedDecision.payloadHash,
        command: input.command,
      });
      const settlement = this.buildSettlement({
        taskId: input.taskId,
        requestId: input.requestId,
        decisionId: updatedDecision.decisionId,
        decisionEpochRef: currentEpoch.epochId,
        actionRecordRef: actionRecord.endpointDecisionActionRecordId,
        previewArtifactRef: previewArtifact.previewArtifactId,
        result:
          binding.bindingState === "stale"
            ? "stale_recoverable"
            : binding.bindingState === "blocked"
              ? "blocked_policy"
              : "preview_ready",
        command: input.command,
      });
      await this.repositories.saveActionRecord(actionRecord);
      await this.repositories.saveSettlement(settlement);

      return {
        epoch: currentEpoch,
        decision: updatedDecision,
        binding,
        approvalAssessment: currentApproval,
        boundaryTuple:
          updatedDecision.boundaryTupleRef !== null
            ? await this.repositories.getBoundaryTuple(updatedDecision.boundaryTupleRef)
            : null,
        previewArtifact,
        latestSupersession: null,
        actionRecord,
        settlement,
        supersessionRecord: null,
      };
    });
  }

  private async createOrReplaceDecision(input: {
    taskId: string;
    requestId: string;
    chosenEndpoint: Phase3EndpointCode;
    reasoningText: string;
    payload: Readonly<Record<string, unknown>>;
    fence: DecisionEpochFenceInput;
    previewInput: DecisionPreviewInput;
    command: Phase3CommandContext;
    actionType: EndpointDecisionActionType;
    currentDecision: EndpointDecisionSnapshot | null;
    currentEpoch: DecisionEpochSnapshot | null;
    manualReplace: boolean;
  }): Promise<EndpointDecisionMutationResult> {
    const payloadHash = buildPayloadHash({
      endpointCode: input.chosenEndpoint,
      payload: input.payload,
      reasoningText: input.reasoningText,
    });

    let supersessionRecord: DecisionSupersessionRecordSnapshot | null = null;
    let epoch = input.currentEpoch;
    if (!epoch) {
      epoch = this.buildEpoch({
        taskId: input.taskId,
        requestId: input.requestId,
        fence: input.fence,
        createdAt: input.command.recordedAt,
      });
      await this.repositories.saveDecisionEpoch(epoch);
    } else {
      const currentApproval =
        input.currentDecision !== null
          ? await this.requireApprovalAssessment(input.currentDecision.approvalAssessmentRef)
          : null;
      const nextApprovalMode = evaluateApprovalRequirement({
        endpointCode: input.chosenEndpoint,
        payload: input.payload,
        compiledPolicyBundleRef: input.fence.compiledPolicyBundleRef,
        decisionEpochRef: epoch.epochId,
        taskId: input.taskId,
        requestId: input.requestId,
        decisionId: input.currentDecision?.decisionId ?? "pending",
        assessedAt: input.command.recordedAt,
      }).requiredApprovalMode;
      const supersession = evaluateSupersession({
        epoch,
        currentFence: input.fence,
        currentRequiredApprovalMode: currentApproval?.requiredApprovalMode ?? null,
        nextRequiredApprovalMode: nextApprovalMode,
        manualReplace: input.manualReplace,
      });
      if (supersession.supersede) {
        const rotated = await this.rotateDecisionForDrift({
          taskId: input.taskId,
          requestId: input.requestId,
          currentDecision: input.currentDecision,
          currentEpoch: epoch,
          replacementChosenEndpoint: input.chosenEndpoint,
          replacementReasoningText: input.reasoningText,
          replacementPayload: input.payload,
          fence: input.fence,
          previewInput: input.previewInput,
          command: input.command,
          actionType: input.actionType,
          settlementResult: "draft_saved",
          supersession,
          carryPreview: false,
        });
        return rotated;
      }
    }

    const decisionVersion = input.currentDecision ? input.currentDecision.decisionVersion + 1 : 1;
    const decision = normalizeDecision({
      decisionId: nextEndpointDecisionId(this.idGenerator, "phase3_endpoint_decision"),
      taskId: input.taskId,
      requestId: input.requestId,
      decisionEpochRef: epoch.epochId,
      chosenEndpoint: input.chosenEndpoint,
      decisionVersion,
      payloadHash,
      reasoningText: requireRef(input.reasoningText, "reasoningText"),
      payload: JSON.parse(stableStringify(input.payload)) as Readonly<Record<string, unknown>>,
      requiredApprovalMode: "not_required",
      previewArtifactRef: null,
      previewDigestRef: null,
      approvalAssessmentRef: "pending",
      boundaryTupleRef: null,
      decisionState: "drafting",
      createdAt: input.command.recordedAt,
      updatedAt: input.command.recordedAt,
      supersededAt: null,
      supersededByDecisionRef: null,
      version: 1,
    });

    const approvalAssessment = evaluateApprovalRequirement({
      endpointCode: decision.chosenEndpoint,
      payload: decision.payload,
      compiledPolicyBundleRef: input.fence.compiledPolicyBundleRef,
      decisionEpochRef: decision.decisionEpochRef,
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: decision.decisionId,
      assessedAt: input.command.recordedAt,
    });
    const boundaryTuple = evaluateBoundaryTuple({
      endpointCode: decision.chosenEndpoint,
      payloadHash: decision.payloadHash,
      decisionEpochRef: decision.decisionEpochRef,
      decisionId: decision.decisionId,
      taskId: input.taskId,
      requestId: input.requestId,
      selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
      createdAt: input.command.recordedAt,
    });
    const finalizedDecision = normalizeDecision({
      ...decision,
      requiredApprovalMode: approvalAssessment.requiredApprovalMode,
      approvalAssessmentRef: approvalAssessment.assessmentId,
      boundaryTupleRef: boundaryTuple?.boundaryTupleId ?? null,
    });
    const binding = normalizeBinding({
      bindingId: nextEndpointDecisionId(this.idGenerator, "phase3_endpoint_decision_binding"),
      taskId: input.taskId,
      decisionId: finalizedDecision.decisionId,
      decisionEpochRef: epoch.epochId,
      boundaryTupleHash:
        boundaryTuple?.tupleHash ??
        buildBoundaryTupleHash({
          endpointCode: finalizedDecision.chosenEndpoint,
          decisionEpochRef: epoch.epochId,
          payloadHash: finalizedDecision.payloadHash,
          selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
        }),
      boundaryDecisionState: boundaryTuple ? "aligned" : "not_applicable",
      clinicalMeaningState: clinicalMeaningStateForDecision(finalizedDecision, approvalAssessment),
      operationalFollowUpScope: operationalFollowUpScopeForDecision(
        finalizedDecision,
        approvalAssessment,
      ),
      selectedAnchorRef: input.fence.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
      surfaceRouteContractRef: input.fence.surfaceRouteContractRef,
      surfacePublicationRef: input.fence.surfacePublicationRef,
      runtimePublicationBundleRef: input.fence.runtimePublicationBundleRef,
      workspaceSliceTrustProjectionRef: input.fence.workspaceSliceTrustProjectionRef,
      releaseRecoveryDispositionRef: input.fence.releaseRecoveryDispositionRef,
      approvalAssessmentRef: approvalAssessment.assessmentId,
      boundaryTupleRef: boundaryTuple?.boundaryTupleId ?? null,
      bindingState: evaluateBindingState({
        epoch,
        fence: input.fence,
      }),
      evaluatedAt: input.command.recordedAt,
      version: 1,
    });
    const actionRecord = this.buildActionRecord({
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: finalizedDecision.decisionId,
      decisionEpochRef: epoch.epochId,
      actionType: input.actionType,
      payloadHash: finalizedDecision.payloadHash,
      command: input.command,
    });
    const settlement = this.buildSettlement({
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: finalizedDecision.decisionId,
      decisionEpochRef: epoch.epochId,
      actionRecordRef: actionRecord.endpointDecisionActionRecordId,
      previewArtifactRef: null,
      result: "draft_saved",
      command: input.command,
    });

    if (input.currentDecision) {
      const supersededDecision = normalizeDecision({
        ...input.currentDecision,
        decisionState: "superseded",
        supersededAt: input.command.recordedAt,
        supersededByDecisionRef: finalizedDecision.decisionId,
        updatedAt: input.command.recordedAt,
        version: input.currentDecision.version + 1,
      });
      await this.repositories.saveDecision(supersededDecision, {
        expectedVersion: input.currentDecision.version,
      });
      if (input.currentDecision.previewArtifactRef) {
        const priorPreview = await this.repositories.getPreviewArtifact(input.currentDecision.previewArtifactRef);
        if (priorPreview) {
          await this.repositories.savePreviewArtifact(
            normalizePreviewArtifact({
              ...priorPreview,
              artifactState: "recovery_only",
              version: priorPreview.version + 1,
            }),
            { expectedVersion: priorPreview.version },
          );
        }
      }
    }

    await this.repositories.saveApprovalAssessment(approvalAssessment);
    if (boundaryTuple) {
      await this.repositories.saveBoundaryTuple(boundaryTuple);
    }
    await this.repositories.saveDecision(finalizedDecision);
    await this.repositories.saveBinding(binding);
    await this.repositories.saveActionRecord(actionRecord);
    await this.repositories.saveSettlement(settlement);

    return {
      epoch,
      decision: finalizedDecision,
      binding,
      approvalAssessment,
      boundaryTuple,
      previewArtifact: null,
      latestSupersession: supersessionRecord,
      actionRecord,
      settlement,
      supersessionRecord,
    };
  }

  private async ensureCurrentBinding(input: {
    decision: EndpointDecisionSnapshot;
    epoch: DecisionEpochSnapshot;
    approvalAssessment: ApprovalRequirementAssessmentSnapshot;
    fence: DecisionEpochFenceInput;
    evaluatedAt: string;
  }): Promise<EndpointDecisionBindingSnapshot> {
    const existing = await this.repositories.getCurrentBindingForDecision(input.decision.decisionId);
    if (existing) {
      const nextState = evaluateBindingState({
        epoch: input.epoch,
        fence: input.fence,
      });
      if (
        existing.bindingState === nextState &&
        existing.selectedAnchorTupleHashRef === input.fence.selectedAnchorTupleHashRef &&
        existing.surfaceRouteContractRef === input.fence.surfaceRouteContractRef &&
        existing.surfacePublicationRef === input.fence.surfacePublicationRef &&
        existing.runtimePublicationBundleRef === input.fence.runtimePublicationBundleRef &&
        existing.workspaceSliceTrustProjectionRef === input.fence.workspaceSliceTrustProjectionRef
      ) {
        return existing;
      }
      const updated = normalizeBinding({
        ...existing,
        bindingState: nextState,
        selectedAnchorRef: input.fence.selectedAnchorRef,
        selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
        surfaceRouteContractRef: input.fence.surfaceRouteContractRef,
        surfacePublicationRef: input.fence.surfacePublicationRef,
        runtimePublicationBundleRef: input.fence.runtimePublicationBundleRef,
        workspaceSliceTrustProjectionRef: input.fence.workspaceSliceTrustProjectionRef,
        approvalAssessmentRef: input.approvalAssessment.assessmentId,
        evaluatedAt: input.evaluatedAt,
        version: existing.version + 1,
      });
      await this.repositories.saveBinding(updated, {
        expectedVersion: existing.version,
      });
      return updated;
    }
    const boundaryTuple =
      input.decision.boundaryTupleRef !== null
        ? await this.repositories.getBoundaryTuple(input.decision.boundaryTupleRef)
        : null;
    const created = normalizeBinding({
      bindingId: nextEndpointDecisionId(this.idGenerator, "phase3_endpoint_decision_binding"),
      taskId: input.decision.taskId,
      decisionId: input.decision.decisionId,
      decisionEpochRef: input.epoch.epochId,
      boundaryTupleHash:
        boundaryTuple?.tupleHash ??
        buildBoundaryTupleHash({
          endpointCode: input.decision.chosenEndpoint,
          decisionEpochRef: input.epoch.epochId,
          payloadHash: input.decision.payloadHash,
          selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
        }),
      boundaryDecisionState: boundaryTuple ? "aligned" : "not_applicable",
      clinicalMeaningState: clinicalMeaningStateForDecision(input.decision, input.approvalAssessment),
      operationalFollowUpScope: operationalFollowUpScopeForDecision(
        input.decision,
        input.approvalAssessment,
      ),
      selectedAnchorRef: input.fence.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
      surfaceRouteContractRef: input.fence.surfaceRouteContractRef,
      surfacePublicationRef: input.fence.surfacePublicationRef,
      runtimePublicationBundleRef: input.fence.runtimePublicationBundleRef,
      workspaceSliceTrustProjectionRef: input.fence.workspaceSliceTrustProjectionRef,
      releaseRecoveryDispositionRef: input.fence.releaseRecoveryDispositionRef,
      approvalAssessmentRef: input.approvalAssessment.assessmentId,
      boundaryTupleRef: boundaryTuple?.boundaryTupleId ?? null,
      bindingState: evaluateBindingState({
        epoch: input.epoch,
        fence: input.fence,
      }),
      evaluatedAt: input.evaluatedAt,
      version: 1,
    });
    await this.repositories.saveBinding(created);
    return created;
  }

  private async rotateDecisionForDrift(input: {
    taskId: string;
    requestId: string;
    currentDecision: EndpointDecisionSnapshot | null;
    currentEpoch: DecisionEpochSnapshot;
    replacementChosenEndpoint: Phase3EndpointCode;
    replacementReasoningText: string;
    replacementPayload: Readonly<Record<string, unknown>>;
    fence: DecisionEpochFenceInput;
    previewInput: DecisionPreviewInput;
    command: Phase3CommandContext;
    actionType: EndpointDecisionActionType;
    settlementResult: EndpointDecisionSettlementResult;
    supersession: {
      supersede: boolean;
      reasonClass: DecisionSupersessionReasonClass | null;
      reasonCodeRefs: readonly string[];
      replacementTupleHash: string;
    };
    carryPreview: boolean;
  }): Promise<EndpointDecisionMutationResult> {
    invariant(
      input.supersession.reasonClass !== null,
      "SUPERSESSION_REASON_REQUIRED",
      "Supersession requires a reasonClass.",
    );
    const replacementEpoch = this.buildEpoch({
      taskId: input.taskId,
      requestId: input.requestId,
      fence: input.fence,
      createdAt: input.command.recordedAt,
    });
    const supersessionRecord = normalizeSupersessionRecord({
      decisionSupersessionRecordId: nextEndpointDecisionId(
        this.idGenerator,
        "phase3_decision_supersession_record",
      ),
      taskId: input.taskId,
      requestId: input.requestId,
      priorDecisionEpochRef: input.currentEpoch.epochId,
      replacementDecisionEpochRef: replacementEpoch.epochId,
      priorDecisionRef: input.currentDecision?.decisionId ?? null,
      replacementDecisionRef: null,
      reasonClass: input.supersession.reasonClass,
      reasonCodeRefs: input.supersession.reasonCodeRefs,
      priorTupleHash: input.currentEpoch.decisionTupleHash,
      replacementTupleHash: input.supersession.replacementTupleHash,
      recordedAt: input.command.recordedAt,
      version: 1,
    });
    const updatedEpoch = normalizeEpoch({
      ...input.currentEpoch,
      epochState: "superseded",
      supersededAt: input.command.recordedAt,
      supersededByEpochRef: replacementEpoch.epochId,
      updatedAt: input.command.recordedAt,
      version: input.currentEpoch.version + 1,
    });
    await this.repositories.saveDecisionEpoch(updatedEpoch, {
      expectedVersion: input.currentEpoch.version,
    });
    await this.repositories.saveDecisionEpoch(replacementEpoch);
    await this.repositories.saveSupersessionRecord(supersessionRecord);

    if (input.currentDecision) {
      const supersededDecision = normalizeDecision({
        ...input.currentDecision,
        decisionState: "superseded",
        supersededAt: input.command.recordedAt,
        updatedAt: input.command.recordedAt,
        version: input.currentDecision.version + 1,
      });
      await this.repositories.saveDecision(supersededDecision, {
        expectedVersion: input.currentDecision.version,
      });
      const currentBinding = await this.repositories.getCurrentBindingForDecision(input.currentDecision.decisionId);
      if (currentBinding) {
        await this.repositories.saveBinding(
          normalizeBinding({
            ...currentBinding,
            bindingState: input.fence.writeState === "blocked" ? "blocked" : "stale",
            boundaryDecisionState:
              currentBinding.boundaryDecisionState === "not_applicable"
                ? "not_applicable"
                : "drifted",
            evaluatedAt: input.command.recordedAt,
            version: currentBinding.version + 1,
          }),
          { expectedVersion: currentBinding.version },
        );
      }
      if (input.currentDecision.previewArtifactRef) {
        const priorPreview = await this.repositories.getPreviewArtifact(input.currentDecision.previewArtifactRef);
        if (priorPreview) {
          await this.repositories.savePreviewArtifact(
            normalizePreviewArtifact({
              ...priorPreview,
              artifactState: "recovery_only",
              version: priorPreview.version + 1,
            }),
            { expectedVersion: priorPreview.version },
          );
        }
      }
    }

    const replacementDecision = await this.createOrReplaceDecision({
      taskId: input.taskId,
      requestId: input.requestId,
      chosenEndpoint: input.replacementChosenEndpoint,
      reasoningText: input.replacementReasoningText,
      payload: input.replacementPayload,
      fence: input.fence,
      previewInput: input.previewInput,
      command: input.command,
      actionType: input.actionType,
      currentDecision: null,
      currentEpoch: replacementEpoch,
      manualReplace: false,
    });

    const baseDecision = normalizeDecision({
      ...replacementDecision.decision,
      decisionState:
        input.settlementResult === "draft_saved"
          ? "drafting"
          : input.settlementResult === "submitted"
            ? "submitted"
            : "preview_ready",
      updatedAt: input.command.recordedAt,
      version: replacementDecision.decision.version + 1,
    });
    await this.repositories.saveDecision(baseDecision, {
      expectedVersion: replacementDecision.decision.version,
    });

    let previewArtifact = replacementDecision.previewArtifact;
    if (input.carryPreview) {
      previewArtifact = buildDeterministicDecisionPreview({
        taskId: input.taskId,
        requestId: input.requestId,
        decision: baseDecision,
        epoch: replacementEpoch,
        bindingState: replacementDecision.binding.bindingState,
        previewInput: input.previewInput,
        generatedAt: input.command.recordedAt,
      });
      await this.repositories.savePreviewArtifact(previewArtifact);
      const updatedReplacementDecision = normalizeDecision({
        ...baseDecision,
        previewArtifactRef: previewArtifact.previewArtifactId,
        previewDigestRef: previewArtifact.previewDigest,
        decisionState: "preview_ready",
        updatedAt: input.command.recordedAt,
        version: baseDecision.version + 1,
      });
      await this.repositories.saveDecision(updatedReplacementDecision, {
        expectedVersion: baseDecision.version,
      });
      replacementDecision.decision = updatedReplacementDecision;
    } else {
      replacementDecision.decision = baseDecision;
    }

    const actionRecord = this.buildActionRecord({
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: replacementDecision.decision.decisionId,
      decisionEpochRef: replacementEpoch.epochId,
      actionType: input.actionType,
      payloadHash: replacementDecision.decision.payloadHash,
      command: input.command,
    });
    const settlement = this.buildSettlement({
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: replacementDecision.decision.decisionId,
      decisionEpochRef: replacementEpoch.epochId,
      actionRecordRef: actionRecord.endpointDecisionActionRecordId,
      previewArtifactRef: previewArtifact?.previewArtifactId ?? null,
      result: input.settlementResult,
      command: input.command,
    });
    await this.repositories.saveActionRecord(actionRecord);
    await this.repositories.saveSettlement(settlement);

    return {
      epoch: replacementEpoch,
      decision: replacementDecision.decision,
      binding: replacementDecision.binding,
      approvalAssessment: replacementDecision.approvalAssessment,
      boundaryTuple: replacementDecision.boundaryTuple,
      previewArtifact,
      latestSupersession: supersessionRecord,
      actionRecord,
      settlement,
      supersessionRecord,
    };
  }

  private async bundleForDecision(decision: EndpointDecisionSnapshot): Promise<EndpointDecisionBundle> {
    const epoch = await this.requireEpoch(decision.decisionEpochRef);
    const binding = await this.requireBinding(decision.decisionId);
    const approvalAssessment = await this.requireApprovalAssessment(decision.approvalAssessmentRef);
    const boundaryTuple =
      decision.boundaryTupleRef !== null
        ? await this.repositories.getBoundaryTuple(decision.boundaryTupleRef)
        : null;
    const previewArtifact =
      decision.previewArtifactRef !== null
        ? await this.repositories.getPreviewArtifact(decision.previewArtifactRef)
        : null;
    const latestSupersession = (await this.repositories.listSupersessionRecordsForTask(decision.taskId))
      .filter((entry) => entry.priorDecisionEpochRef === epoch.epochId)
      .at(-1) ?? null;
    return {
      epoch,
      decision,
      binding,
      approvalAssessment,
      boundaryTuple,
      previewArtifact,
      latestSupersession,
    };
  }

  private buildEpoch(input: {
    taskId: string;
    requestId: string;
    fence: DecisionEpochFenceInput;
    createdAt: string;
  }): DecisionEpochSnapshot {
    return normalizeEpoch({
      epochId: nextEndpointDecisionId(this.idGenerator, "phase3_decision_epoch"),
      taskId: input.taskId,
      requestId: input.requestId,
      reviewSessionRef: input.fence.reviewSessionRef,
      reviewVersionRef: input.fence.reviewVersionRef,
      selectedAnchorRef: input.fence.selectedAnchorRef,
      selectedAnchorTupleHashRef: input.fence.selectedAnchorTupleHashRef,
      governingSnapshotRef: input.fence.governingSnapshotRef,
      evidenceSnapshotRef: input.fence.evidenceSnapshotRef,
      compiledPolicyBundleRef: input.fence.compiledPolicyBundleRef,
      safetyDecisionEpochRef: input.fence.safetyDecisionEpochRef,
      duplicateLineageRef: input.fence.duplicateLineageRef,
      lineageFenceEpoch: input.fence.lineageFenceEpoch,
      ownershipEpochRef: input.fence.ownershipEpochRef,
      audienceSurfaceRuntimeBindingRef: input.fence.audienceSurfaceRuntimeBindingRef,
      surfaceRouteContractRef: input.fence.surfaceRouteContractRef,
      surfacePublicationRef: input.fence.surfacePublicationRef,
      runtimePublicationBundleRef: input.fence.runtimePublicationBundleRef,
      releasePublicationParityRef: input.fence.releasePublicationParityRef,
      workspaceSliceTrustProjectionRef: input.fence.workspaceSliceTrustProjectionRef,
      continuityEvidenceRef: input.fence.continuityEvidenceRef,
      decisionTupleHash: buildDecisionTupleHash(input.fence),
      epochState: input.fence.writeState === "blocked" ? "blocked" : "live",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      supersededAt: null,
      supersededByEpochRef: null,
      version: 1,
    });
  }

  private buildActionRecord(input: {
    taskId: string;
    requestId: string;
    decisionId: string;
    decisionEpochRef: string;
    actionType: EndpointDecisionActionType;
    payloadHash: string;
    command: Phase3CommandContext;
  }): EndpointDecisionActionRecordSnapshot {
    return normalizeActionRecord({
      endpointDecisionActionRecordId: nextEndpointDecisionId(
        this.idGenerator,
        "phase3_endpoint_decision_action_record",
      ),
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: input.decisionId,
      decisionEpochRef: input.decisionEpochRef,
      actionType: input.actionType,
      routeIntentTupleHash: requireRef(input.command.routeIntentTupleHash, "routeIntentTupleHash"),
      routeIntentBindingRef: requireRef(
        input.command.routeIntentBindingRef,
        "routeIntentBindingRef",
      ),
      commandActionRecordRef: requireRef(
        input.command.commandActionRecordRef,
        "commandActionRecordRef",
      ),
      payloadHash: input.payloadHash,
      actorRef: requireRef(input.command.actorRef, "actorRef"),
      recordedAt: ensureIsoTimestamp(input.command.recordedAt, "recordedAt"),
      version: 1,
    });
  }

  private buildSettlement(input: {
    taskId: string;
    requestId: string;
    decisionId: string;
    decisionEpochRef: string;
    actionRecordRef: string;
    previewArtifactRef: string | null;
    result: EndpointDecisionSettlementResult;
    command: Phase3CommandContext;
  }): EndpointDecisionSettlementSnapshot {
    return normalizeSettlement({
      endpointDecisionSettlementId: nextEndpointDecisionId(
        this.idGenerator,
        "phase3_endpoint_decision_settlement",
      ),
      taskId: input.taskId,
      requestId: input.requestId,
      decisionId: input.decisionId,
      endpointDecisionActionRecordRef: input.actionRecordRef,
      decisionEpochRef: input.decisionEpochRef,
      commandActionRecordRef: requireRef(
        input.command.commandActionRecordRef,
        "commandActionRecordRef",
      ),
      commandSettlementRecordRef: requireRef(
        input.command.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      transitionEnvelopeRef: requireRef(
        input.command.transitionEnvelopeRef,
        "transitionEnvelopeRef",
      ),
      previewArtifactRef: input.previewArtifactRef,
      result: input.result,
      recoveryRouteRef: optionalRef(input.command.recoveryRouteRef),
      recordedAt: input.command.recordedAt,
      version: 1,
    });
  }

  private async requireDecision(decisionId: string): Promise<EndpointDecisionSnapshot> {
    const decision = await this.repositories.getDecision(decisionId);
    invariant(decision, "ENDPOINT_DECISION_NOT_FOUND", `EndpointDecision ${decisionId} is required.`);
    return decision;
  }

  private async requireEpoch(epochId: string): Promise<DecisionEpochSnapshot> {
    const epoch = await this.repositories.getDecisionEpoch(epochId);
    invariant(epoch, "DECISION_EPOCH_NOT_FOUND", `DecisionEpoch ${epochId} is required.`);
    return epoch;
  }

  private async requireBinding(decisionId: string): Promise<EndpointDecisionBindingSnapshot> {
    const binding = await this.repositories.getCurrentBindingForDecision(decisionId);
    invariant(
      binding,
      "ENDPOINT_DECISION_BINDING_NOT_FOUND",
      `EndpointDecisionBinding for ${decisionId} is required.`,
    );
    return binding;
  }

  private async requireApprovalAssessment(
    assessmentId: string,
  ): Promise<ApprovalRequirementAssessmentSnapshot> {
    const assessment = await this.repositories.getApprovalAssessment(assessmentId);
    invariant(
      assessment,
      "APPROVAL_REQUIREMENT_ASSESSMENT_NOT_FOUND",
      `ApprovalRequirementAssessment ${assessmentId} is required.`,
    );
    return assessment;
  }
}

export function createPhase3EndpointDecisionKernelService(
  repositories: Phase3EndpointDecisionKernelRepositories = createPhase3EndpointDecisionKernelStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3EndpointDecisionKernelService {
  return new Phase3EndpointDecisionKernelServiceImpl(
    repositories,
    options?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase3_endpoint_decision_kernel"),
  );
}
