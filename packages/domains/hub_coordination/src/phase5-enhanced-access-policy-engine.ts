import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase5HubCaseKernelService,
  type HubCaseBundle,
  type Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";

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

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextHubPolicyId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
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
  map.set(key, structuredClone(row));
}

function canonicalStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type PolicyState = "draft" | "active" | "superseded";
export type RoutingDisposition =
  | "route_to_network"
  | "retain_local"
  | "bounce_back_urgent"
  | "blocked";
export type VarianceDisposition =
  | "inside_required_window"
  | "inside_approved_variance_window"
  | "outside_window_visible_by_policy"
  | "outside_window_blocked";
export type ServiceObligationDisposition =
  | "within_obligation"
  | "make_up_required"
  | "obligation_risk"
  | "commissioner_exception_active";
export type PracticeVisibilityDisposition =
  | "standard_origin_visibility"
  | "visibility_restricted"
  | "ack_debt_open"
  | "delta_required";
export type CapacityAdmissionDisposition =
  | "trusted_admitted"
  | "degraded_callback_only"
  | "degraded_diagnostic_only"
  | "quarantined_excluded"
  | "stale_capacity"
  | "missing_capacity";
export type SourceTrustState = "trusted" | "degraded" | "quarantined";
export const phase5PolicyEvaluationScopes = [
  "candidate_snapshot",
  "offer_generation",
  "commit_attempt",
  "practice_visibility_generation",
  "manage_exposure",
] as const;
export type PolicyEvaluationScope = (typeof phase5PolicyEvaluationScopes)[number];
export type LedgerMode = "minutes_ledger_required" | "minutes_ledger_optional";
export type PolicyExceptionFamily =
  | "routing"
  | "variance"
  | "service_obligation"
  | "practice_visibility"
  | "capacity_ingestion"
  | "tuple_drift";
export type PolicyExceptionSeverity = "info" | "warning" | "blocking";
export type PolicyTupleDriftDisposition = "current" | "drifted";
export type DegradedVisibilityMode = "callback_only_reasoning" | "diagnostic_only";

export interface NetworkStandardHoursSnapshot {
  weekdayStartLocal: string;
  weekdayEndLocal: string;
  saturdayStartLocal: string;
  saturdayEndLocal: string;
}

export interface HubRoutingPolicyPackInput {
  routingPolicyPackId?: string;
  policyVersion: string;
  routeReasonCode?: string | null;
  routingDisposition: RoutingDisposition;
  eligibleSiteRefs: readonly string[];
  serviceFamilyRefs?: readonly string[];
  sourceNamespaceRefs?: readonly string[];
  commissionerApprovalRef?: string | null;
  sourceRefs: readonly string[];
}

export interface HubVarianceWindowPolicyInput {
  varianceWindowPolicyId?: string;
  policyVersion: string;
  requiredWindowRule: string;
  approvedVarianceBeforeMinutes: number;
  approvedVarianceAfterMinutes: number;
  outsideWindowVisibleByPolicy: boolean;
  varianceDisposition: VarianceDisposition;
  sourceRefs: readonly string[];
}

export interface HubServiceObligationPolicyInput {
  serviceObligationPolicyId?: string;
  policyVersion: string;
  weeklyMinutesPer1000AdjustedPopulation: number;
  bankHolidayMakeUpWindowHours: number;
  comparableOfferRule: string;
  ledgerMode: LedgerMode;
  serviceObligationDisposition: ServiceObligationDisposition;
  sourceRefs: readonly string[];
}

export interface HubPracticeVisibilityPolicyInput {
  practiceVisibilityPolicyId?: string;
  policyVersion: string;
  minimumNecessaryContractRef: string;
  originPracticeVisibleFieldRefs: readonly string[];
  hiddenFieldRefs?: readonly string[];
  visibilityDeltaRule: string;
  ackGenerationMode: "generation_bound" | "generation_bound_with_exception";
  practiceVisibilityDisposition: PracticeVisibilityDisposition;
  sourceRefs: readonly string[];
}

export interface HubCapacityIngestionPolicyInput {
  capacityIngestionPolicyId?: string;
  policyVersion: string;
  freshnessThresholdMinutes: number;
  staleThresholdMinutes: number;
  quarantineTriggers: readonly string[];
  degradedTriggers: readonly string[];
  duplicateCapacityCollisionPolicy: string;
  degradedVisibilityModes: readonly DegradedVisibilityMode[];
  patientOfferableTrustStates: readonly "trusted"[];
  directCommitTrustStates: readonly "trusted"[];
  capacityAdmissionDisposition: CapacityAdmissionDisposition;
  sourceRefs: readonly string[];
}

export interface HubRoutingPolicyPackSnapshot {
  routingPolicyPackId: string;
  pcnRef: string;
  policyVersion: string;
  policyState: PolicyState;
  effectiveAt: string;
  effectiveUntil: string | null;
  policyTupleHash: string;
  routeReasonCode: string | null;
  routingDisposition: RoutingDisposition;
  eligibleSiteRefs: readonly string[];
  serviceFamilyRefs: readonly string[];
  sourceNamespaceRefs: readonly string[];
  commissionerApprovalRef: string | null;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubVarianceWindowPolicySnapshot {
  varianceWindowPolicyId: string;
  pcnRef: string;
  policyVersion: string;
  policyState: PolicyState;
  effectiveAt: string;
  effectiveUntil: string | null;
  policyTupleHash: string;
  requiredWindowRule: string;
  approvedVarianceBeforeMinutes: number;
  approvedVarianceAfterMinutes: number;
  outsideWindowVisibleByPolicy: boolean;
  varianceDisposition: VarianceDisposition;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubServiceObligationPolicySnapshot {
  serviceObligationPolicyId: string;
  pcnRef: string;
  policyVersion: string;
  policyState: PolicyState;
  effectiveAt: string;
  effectiveUntil: string | null;
  policyTupleHash: string;
  weeklyMinutesPer1000AdjustedPopulation: number;
  bankHolidayMakeUpWindowHours: number;
  comparableOfferRule: string;
  ledgerMode: LedgerMode;
  serviceObligationDisposition: ServiceObligationDisposition;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubPracticeVisibilityPolicySnapshot {
  practiceVisibilityPolicyId: string;
  pcnRef: string;
  policyVersion: string;
  policyState: PolicyState;
  effectiveAt: string;
  effectiveUntil: string | null;
  policyTupleHash: string;
  minimumNecessaryContractRef: string;
  originPracticeVisibleFieldRefs: readonly string[];
  hiddenFieldRefs: readonly string[];
  visibilityDeltaRule: string;
  ackGenerationMode: "generation_bound" | "generation_bound_with_exception";
  practiceVisibilityDisposition: PracticeVisibilityDisposition;
  sourceRefs: readonly string[];
  version: number;
}

export interface HubCapacityIngestionPolicySnapshot {
  capacityIngestionPolicyId: string;
  pcnRef: string;
  policyVersion: string;
  policyState: PolicyState;
  effectiveAt: string;
  effectiveUntil: string | null;
  policyTupleHash: string;
  freshnessThresholdMinutes: number;
  staleThresholdMinutes: number;
  quarantineTriggers: readonly string[];
  degradedTriggers: readonly string[];
  duplicateCapacityCollisionPolicy: string;
  degradedVisibilityModes: readonly DegradedVisibilityMode[];
  patientOfferableTrustStates: readonly "trusted"[];
  directCommitTrustStates: readonly "trusted"[];
  capacityAdmissionDisposition: CapacityAdmissionDisposition;
  sourceRefs: readonly string[];
  version: number;
}

export interface EnhancedAccessPolicySnapshot {
  policyId: string;
  policyVersion: string;
  policyState: PolicyState;
  compiledPolicyBundleRef: string;
  policyTupleHash: string;
  effectiveAt: string;
  effectiveUntil: string | null;
  pcnRef: string;
  weeklyMinutesPer1000AdjustedPopulation: number;
  networkStandardHours: NetworkStandardHoursSnapshot;
  sameDayOnlineBookingRule: string;
  comparableOfferRule: string;
  routingPolicyPackRef: string;
  varianceWindowPolicyRef: string;
  serviceObligationPolicyRef: string;
  practiceVisibilityPolicyRef: string;
  capacityIngestionPolicyRef: string;
  rankPlanVersionRef: string;
  uncertaintyModelVersionRef: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PolicySourceAdmissionSummaryEntry {
  sourceRef: string;
  sourceTrustState: SourceTrustState;
  candidateCount: number;
}

export interface NetworkCoordinationPolicyEvaluationSnapshot {
  policyEvaluationId: string;
  hubCoordinationCaseId: string;
  evaluationScope: PolicyEvaluationScope;
  compiledPolicyBundleRef: string;
  policyTupleHash: string;
  routingPolicyPackRef: string;
  varianceWindowPolicyRef: string;
  serviceObligationPolicyRef: string;
  practiceVisibilityPolicyRef: string;
  capacityIngestionPolicyRef: string;
  routingDisposition: RoutingDisposition;
  varianceDisposition: VarianceDisposition;
  serviceObligationDisposition: ServiceObligationDisposition;
  practiceVisibilityDisposition: PracticeVisibilityDisposition;
  capacityAdmissionDisposition: CapacityAdmissionDisposition;
  sourceAdmissionSummary: readonly PolicySourceAdmissionSummaryEntry[];
  policyExceptionRefs: readonly string[];
  replayFixtureRef: string;
  evaluatedAt: string;
  sourceRefs: readonly string[];
  version: number;
}

export interface PolicyExceptionRecordSnapshot {
  policyExceptionRecordId: string;
  policyEvaluationRef: string;
  hubCoordinationCaseId: string;
  evaluationScope: PolicyEvaluationScope;
  policyTupleHash: string;
  family: PolicyExceptionFamily;
  exceptionCode: string;
  severity: PolicyExceptionSeverity;
  safeSummary: string;
  createdAt: string;
  version: number;
}

export interface PolicyEvaluationFactsSnapshot {
  routeToNetworkRequested: boolean | null;
  urgentBounceRequired: boolean;
  requiredWindowFit: 0 | 1 | 2 | null;
  sourceAdmissionSummary: readonly PolicySourceAdmissionSummaryEntry[];
  staleCapacityDetected: boolean;
  adjustedPopulation: number | null;
  deliveredMinutes: number | null;
  availableMinutes: number | null;
  cancelledMinutes: number | null;
  replacementMinutes: number | null;
  commissionerExceptionRef: string | null;
  minimumNecessaryContractRef: string | null;
  ackDebtOpen: boolean;
  visibilityDeltaRequired: boolean;
}

export interface PolicyEvaluationReplayFixtureSnapshot {
  policyEvaluationReplayFixtureId: string;
  policyEvaluationRef: string;
  policyId: string;
  hubCoordinationCaseId: string;
  pcnRef: string;
  evaluationScope: PolicyEvaluationScope;
  presentedPolicyTupleHash: string | null;
  facts: PolicyEvaluationFactsSnapshot;
  evaluatedAt: string;
  version: number;
}

export interface CompileEnhancedAccessPolicyInput {
  policyId?: string;
  policyVersion: string;
  policyState?: PolicyState;
  compiledPolicyBundleRef?: string;
  effectiveAt: string;
  effectiveUntil?: string | null;
  pcnRef: string;
  networkStandardHours: NetworkStandardHoursSnapshot;
  sameDayOnlineBookingRule: string;
  rankPlanVersionRef: string;
  uncertaintyModelVersionRef: string;
  sourceRefs?: readonly string[];
  routingPolicyPack: HubRoutingPolicyPackInput;
  varianceWindowPolicy: HubVarianceWindowPolicyInput;
  serviceObligationPolicy: HubServiceObligationPolicyInput;
  practiceVisibilityPolicy: HubPracticeVisibilityPolicyInput;
  capacityIngestionPolicy: HubCapacityIngestionPolicyInput;
}

export interface EvaluateNetworkPolicyInput {
  hubCoordinationCaseId: string;
  pcnRef?: string | null;
  policyId?: string | null;
  evaluationScope: PolicyEvaluationScope;
  evaluatedAt: string;
  presentedPolicyTupleHash?: string | null;
  facts?: Partial<PolicyEvaluationFactsSnapshot>;
}

export interface EvaluateNetworkPolicyScopesInput
  extends Omit<EvaluateNetworkPolicyInput, "evaluationScope"> {
  evaluationScopes: readonly PolicyEvaluationScope[];
}

export interface ReplayNetworkPolicyEvaluationInput {
  policyEvaluationId: string;
}

export interface ActivePolicyPackSet {
  compiledPolicy: EnhancedAccessPolicySnapshot;
  routingPolicyPack: HubRoutingPolicyPackSnapshot;
  varianceWindowPolicy: HubVarianceWindowPolicySnapshot;
  serviceObligationPolicy: HubServiceObligationPolicySnapshot;
  practiceVisibilityPolicy: HubPracticeVisibilityPolicySnapshot;
  capacityIngestionPolicy: HubCapacityIngestionPolicySnapshot;
}

export interface CompileEnhancedAccessPolicyResult extends ActivePolicyPackSet {
  tupleCanonicalPayload: string;
}

export interface NetworkPolicyEvaluationResult {
  evaluation: NetworkCoordinationPolicyEvaluationSnapshot;
  exceptions: readonly PolicyExceptionRecordSnapshot[];
  replayFixture: PolicyEvaluationReplayFixtureSnapshot;
  compiledPolicy: EnhancedAccessPolicySnapshot;
  hubCaseBundle: HubCaseBundle | null;
}

export interface NetworkPolicyReplayResult extends NetworkPolicyEvaluationResult {
  matchesStoredEvaluation: boolean;
  mismatchFields: readonly string[];
  originalEvaluation: NetworkCoordinationPolicyEvaluationSnapshot;
}

export interface PolicyTupleDriftResult {
  pcnRef: string;
  boundPolicyTupleHash: string;
  currentPolicyTupleHash: string;
  driftDisposition: PolicyTupleDriftDisposition;
  policyId: string;
  asOf: string;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

export interface Phase5EnhancedAccessPolicyRepositories {
  getRoutingPolicyPack(
    routingPolicyPackId: string,
  ): Promise<SnapshotDocument<HubRoutingPolicyPackSnapshot> | null>;
  saveRoutingPolicyPack(
    snapshot: HubRoutingPolicyPackSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getVarianceWindowPolicy(
    varianceWindowPolicyId: string,
  ): Promise<SnapshotDocument<HubVarianceWindowPolicySnapshot> | null>;
  saveVarianceWindowPolicy(
    snapshot: HubVarianceWindowPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getServiceObligationPolicy(
    serviceObligationPolicyId: string,
  ): Promise<SnapshotDocument<HubServiceObligationPolicySnapshot> | null>;
  saveServiceObligationPolicy(
    snapshot: HubServiceObligationPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getPracticeVisibilityPolicy(
    practiceVisibilityPolicyId: string,
  ): Promise<SnapshotDocument<HubPracticeVisibilityPolicySnapshot> | null>;
  savePracticeVisibilityPolicy(
    snapshot: HubPracticeVisibilityPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCapacityIngestionPolicy(
    capacityIngestionPolicyId: string,
  ): Promise<SnapshotDocument<HubCapacityIngestionPolicySnapshot> | null>;
  saveCapacityIngestionPolicy(
    snapshot: HubCapacityIngestionPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCompiledPolicy(policyId: string): Promise<SnapshotDocument<EnhancedAccessPolicySnapshot> | null>;
  getCompiledPolicyByTupleHash(
    policyTupleHash: string,
  ): Promise<SnapshotDocument<EnhancedAccessPolicySnapshot> | null>;
  saveCompiledPolicy(
    snapshot: EnhancedAccessPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getActivePolicyIdForPcn(pcnRef: string): Promise<string | null>;
  setActivePolicyIdForPcn(pcnRef: string, policyId: string): Promise<void>;
  getPolicyEvaluation(
    policyEvaluationId: string,
  ): Promise<SnapshotDocument<NetworkCoordinationPolicyEvaluationSnapshot> | null>;
  savePolicyEvaluation(
    snapshot: NetworkCoordinationPolicyEvaluationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listPolicyEvaluationsForCase(
    hubCoordinationCaseId: string,
  ): Promise<readonly SnapshotDocument<NetworkCoordinationPolicyEvaluationSnapshot>[]>;
  appendPolicyException(
    snapshot: PolicyExceptionRecordSnapshot,
  ): Promise<void>;
  listPolicyExceptions(
    policyEvaluationId: string,
  ): Promise<readonly SnapshotDocument<PolicyExceptionRecordSnapshot>[]>;
  saveReplayFixture(
    snapshot: PolicyEvaluationReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReplayFixtureForEvaluation(
    policyEvaluationId: string,
  ): Promise<SnapshotDocument<PolicyEvaluationReplayFixtureSnapshot> | null>;
}

export class Phase5EnhancedAccessPolicyStore implements Phase5EnhancedAccessPolicyRepositories {
  private readonly routingPolicyPacks = new Map<string, HubRoutingPolicyPackSnapshot>();
  private readonly variancePolicies = new Map<string, HubVarianceWindowPolicySnapshot>();
  private readonly serviceObligationPolicies = new Map<string, HubServiceObligationPolicySnapshot>();
  private readonly practiceVisibilityPolicies = new Map<string, HubPracticeVisibilityPolicySnapshot>();
  private readonly capacityIngestionPolicies = new Map<string, HubCapacityIngestionPolicySnapshot>();
  private readonly compiledPolicies = new Map<string, EnhancedAccessPolicySnapshot>();
  private readonly compiledPoliciesByTupleHash = new Map<string, string>();
  private readonly activePolicyByPcn = new Map<string, string>();
  private readonly policyEvaluations = new Map<string, NetworkCoordinationPolicyEvaluationSnapshot>();
  private readonly caseEvaluations = new Map<string, string[]>();
  private readonly policyExceptions = new Map<string, PolicyExceptionRecordSnapshot[]>();
  private readonly replayFixtures = new Map<string, PolicyEvaluationReplayFixtureSnapshot>();
  private readonly replayFixtureByEvaluation = new Map<string, string>();

  async getRoutingPolicyPack(routingPolicyPackId: string) {
    const snapshot = this.routingPolicyPacks.get(routingPolicyPackId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveRoutingPolicyPack(
    snapshot: HubRoutingPolicyPackSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.routingPolicyPacks, snapshot.routingPolicyPackId, snapshot, options);
  }

  async getVarianceWindowPolicy(varianceWindowPolicyId: string) {
    const snapshot = this.variancePolicies.get(varianceWindowPolicyId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveVarianceWindowPolicy(
    snapshot: HubVarianceWindowPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.variancePolicies, snapshot.varianceWindowPolicyId, snapshot, options);
  }

  async getServiceObligationPolicy(serviceObligationPolicyId: string) {
    const snapshot = this.serviceObligationPolicies.get(serviceObligationPolicyId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveServiceObligationPolicy(
    snapshot: HubServiceObligationPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.serviceObligationPolicies,
      snapshot.serviceObligationPolicyId,
      snapshot,
      options,
    );
  }

  async getPracticeVisibilityPolicy(practiceVisibilityPolicyId: string) {
    const snapshot = this.practiceVisibilityPolicies.get(practiceVisibilityPolicyId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async savePracticeVisibilityPolicy(
    snapshot: HubPracticeVisibilityPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.practiceVisibilityPolicies,
      snapshot.practiceVisibilityPolicyId,
      snapshot,
      options,
    );
  }

  async getCapacityIngestionPolicy(capacityIngestionPolicyId: string) {
    const snapshot = this.capacityIngestionPolicies.get(capacityIngestionPolicyId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async saveCapacityIngestionPolicy(
    snapshot: HubCapacityIngestionPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(
      this.capacityIngestionPolicies,
      snapshot.capacityIngestionPolicyId,
      snapshot,
      options,
    );
  }

  async getCompiledPolicy(policyId: string) {
    const snapshot = this.compiledPolicies.get(policyId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async getCompiledPolicyByTupleHash(policyTupleHash: string) {
    const policyId = this.compiledPoliciesByTupleHash.get(policyTupleHash);
    return policyId ? this.getCompiledPolicy(policyId) : null;
  }

  async saveCompiledPolicy(
    snapshot: EnhancedAccessPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.compiledPolicies, snapshot.policyId, snapshot, options);
    this.compiledPoliciesByTupleHash.set(snapshot.policyTupleHash, snapshot.policyId);
  }

  async getActivePolicyIdForPcn(pcnRef: string) {
    return this.activePolicyByPcn.get(pcnRef) ?? null;
  }

  async setActivePolicyIdForPcn(pcnRef: string, policyId: string) {
    this.activePolicyByPcn.set(pcnRef, policyId);
  }

  async getPolicyEvaluation(policyEvaluationId: string) {
    const snapshot = this.policyEvaluations.get(policyEvaluationId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }

  async savePolicyEvaluation(
    snapshot: NetworkCoordinationPolicyEvaluationSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.policyEvaluations, snapshot.policyEvaluationId, snapshot, options);
    const history = this.caseEvaluations.get(snapshot.hubCoordinationCaseId) ?? [];
    if (!history.includes(snapshot.policyEvaluationId)) {
      history.push(snapshot.policyEvaluationId);
      this.caseEvaluations.set(snapshot.hubCoordinationCaseId, history);
    }
  }

  async listPolicyEvaluationsForCase(hubCoordinationCaseId: string) {
    const history = this.caseEvaluations.get(hubCoordinationCaseId) ?? [];
    return history
      .map((evaluationId) => this.policyEvaluations.get(evaluationId))
      .filter((snapshot): snapshot is NetworkCoordinationPolicyEvaluationSnapshot => Boolean(snapshot))
      .map((snapshot) => new StoredDocument(snapshot));
  }

  async appendPolicyException(snapshot: PolicyExceptionRecordSnapshot) {
    const history = this.policyExceptions.get(snapshot.policyEvaluationRef) ?? [];
    history.push(structuredClone(snapshot));
    this.policyExceptions.set(snapshot.policyEvaluationRef, history);
  }

  async listPolicyExceptions(policyEvaluationId: string) {
    return (this.policyExceptions.get(policyEvaluationId) ?? []).map(
      (snapshot) => new StoredDocument(snapshot),
    );
  }

  async saveReplayFixture(
    snapshot: PolicyEvaluationReplayFixtureSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.replayFixtures, snapshot.policyEvaluationReplayFixtureId, snapshot, options);
    this.replayFixtureByEvaluation.set(
      snapshot.policyEvaluationRef,
      snapshot.policyEvaluationReplayFixtureId,
    );
  }

  async getReplayFixtureForEvaluation(policyEvaluationId: string) {
    const fixtureId = this.replayFixtureByEvaluation.get(policyEvaluationId);
    if (!fixtureId) {
      return null;
    }
    const snapshot = this.replayFixtures.get(fixtureId);
    return snapshot ? new StoredDocument(snapshot) : null;
  }
}

export function createPhase5EnhancedAccessPolicyStore(): Phase5EnhancedAccessPolicyStore {
  return new Phase5EnhancedAccessPolicyStore();
}

function normalizeNetworkStandardHours(
  snapshot: NetworkStandardHoursSnapshot,
): NetworkStandardHoursSnapshot {
  return {
    weekdayStartLocal: requireRef(snapshot.weekdayStartLocal, "weekdayStartLocal"),
    weekdayEndLocal: requireRef(snapshot.weekdayEndLocal, "weekdayEndLocal"),
    saturdayStartLocal: requireRef(snapshot.saturdayStartLocal, "saturdayStartLocal"),
    saturdayEndLocal: requireRef(snapshot.saturdayEndLocal, "saturdayEndLocal"),
  };
}

function normalizeRoutingPolicyPack(
  snapshot: HubRoutingPolicyPackSnapshot,
): HubRoutingPolicyPackSnapshot {
  return {
    routingPolicyPackId: requireRef(snapshot.routingPolicyPackId, "routingPolicyPackId"),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    policyVersion: requireRef(snapshot.policyVersion, "policyVersion"),
    policyState: snapshot.policyState,
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(snapshot.effectiveUntil),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    routeReasonCode: optionalRef(snapshot.routeReasonCode),
    routingDisposition: snapshot.routingDisposition,
    eligibleSiteRefs: uniqueSortedRefs(snapshot.eligibleSiteRefs),
    serviceFamilyRefs: uniqueSortedRefs(snapshot.serviceFamilyRefs),
    sourceNamespaceRefs: uniqueSortedRefs(snapshot.sourceNamespaceRefs),
    commissionerApprovalRef: optionalRef(snapshot.commissionerApprovalRef),
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeVarianceWindowPolicy(
  snapshot: HubVarianceWindowPolicySnapshot,
): HubVarianceWindowPolicySnapshot {
  return {
    varianceWindowPolicyId: requireRef(snapshot.varianceWindowPolicyId, "varianceWindowPolicyId"),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    policyVersion: requireRef(snapshot.policyVersion, "policyVersion"),
    policyState: snapshot.policyState,
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(snapshot.effectiveUntil),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    requiredWindowRule: requireRef(snapshot.requiredWindowRule, "requiredWindowRule"),
    approvedVarianceBeforeMinutes: ensureNonNegativeInteger(
      snapshot.approvedVarianceBeforeMinutes,
      "approvedVarianceBeforeMinutes",
    ),
    approvedVarianceAfterMinutes: ensureNonNegativeInteger(
      snapshot.approvedVarianceAfterMinutes,
      "approvedVarianceAfterMinutes",
    ),
    outsideWindowVisibleByPolicy: Boolean(snapshot.outsideWindowVisibleByPolicy),
    varianceDisposition: snapshot.varianceDisposition,
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeServiceObligationPolicy(
  snapshot: HubServiceObligationPolicySnapshot,
): HubServiceObligationPolicySnapshot {
  return {
    serviceObligationPolicyId: requireRef(
      snapshot.serviceObligationPolicyId,
      "serviceObligationPolicyId",
    ),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    policyVersion: requireRef(snapshot.policyVersion, "policyVersion"),
    policyState: snapshot.policyState,
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(snapshot.effectiveUntil),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    weeklyMinutesPer1000AdjustedPopulation: ensureNonNegativeInteger(
      snapshot.weeklyMinutesPer1000AdjustedPopulation,
      "weeklyMinutesPer1000AdjustedPopulation",
    ),
    bankHolidayMakeUpWindowHours: ensureNonNegativeInteger(
      snapshot.bankHolidayMakeUpWindowHours,
      "bankHolidayMakeUpWindowHours",
    ),
    comparableOfferRule: requireRef(snapshot.comparableOfferRule, "comparableOfferRule"),
    ledgerMode: snapshot.ledgerMode,
    serviceObligationDisposition: snapshot.serviceObligationDisposition,
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizePracticeVisibilityPolicy(
  snapshot: HubPracticeVisibilityPolicySnapshot,
): HubPracticeVisibilityPolicySnapshot {
  return {
    practiceVisibilityPolicyId: requireRef(
      snapshot.practiceVisibilityPolicyId,
      "practiceVisibilityPolicyId",
    ),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    policyVersion: requireRef(snapshot.policyVersion, "policyVersion"),
    policyState: snapshot.policyState,
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(snapshot.effectiveUntil),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    minimumNecessaryContractRef: requireRef(
      snapshot.minimumNecessaryContractRef,
      "minimumNecessaryContractRef",
    ),
    originPracticeVisibleFieldRefs: uniqueSortedRefs(snapshot.originPracticeVisibleFieldRefs),
    hiddenFieldRefs: uniqueSortedRefs(snapshot.hiddenFieldRefs),
    visibilityDeltaRule: requireRef(snapshot.visibilityDeltaRule, "visibilityDeltaRule"),
    ackGenerationMode: snapshot.ackGenerationMode,
    practiceVisibilityDisposition: snapshot.practiceVisibilityDisposition,
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeCapacityIngestionPolicy(
  snapshot: HubCapacityIngestionPolicySnapshot,
): HubCapacityIngestionPolicySnapshot {
  return {
    capacityIngestionPolicyId: requireRef(
      snapshot.capacityIngestionPolicyId,
      "capacityIngestionPolicyId",
    ),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    policyVersion: requireRef(snapshot.policyVersion, "policyVersion"),
    policyState: snapshot.policyState,
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(snapshot.effectiveUntil),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    freshnessThresholdMinutes: ensureNonNegativeInteger(
      snapshot.freshnessThresholdMinutes,
      "freshnessThresholdMinutes",
    ),
    staleThresholdMinutes: ensureNonNegativeInteger(
      snapshot.staleThresholdMinutes,
      "staleThresholdMinutes",
    ),
    quarantineTriggers: uniqueSortedRefs(snapshot.quarantineTriggers),
    degradedTriggers: uniqueSortedRefs(snapshot.degradedTriggers),
    duplicateCapacityCollisionPolicy: requireRef(
      snapshot.duplicateCapacityCollisionPolicy,
      "duplicateCapacityCollisionPolicy",
    ),
    degradedVisibilityModes: uniqueSortedRefs(snapshot.degradedVisibilityModes) as DegradedVisibilityMode[],
    patientOfferableTrustStates: uniqueSortedRefs(
      snapshot.patientOfferableTrustStates,
    ) as "trusted"[],
    directCommitTrustStates: uniqueSortedRefs(snapshot.directCommitTrustStates) as "trusted"[],
    capacityAdmissionDisposition: snapshot.capacityAdmissionDisposition,
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeEnhancedAccessPolicy(
  snapshot: EnhancedAccessPolicySnapshot,
): EnhancedAccessPolicySnapshot {
  return {
    policyId: requireRef(snapshot.policyId, "policyId"),
    policyVersion: requireRef(snapshot.policyVersion, "policyVersion"),
    policyState: snapshot.policyState,
    compiledPolicyBundleRef: requireRef(snapshot.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(snapshot.effectiveUntil),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    weeklyMinutesPer1000AdjustedPopulation: ensureNonNegativeInteger(
      snapshot.weeklyMinutesPer1000AdjustedPopulation,
      "weeklyMinutesPer1000AdjustedPopulation",
    ),
    networkStandardHours: normalizeNetworkStandardHours(snapshot.networkStandardHours),
    sameDayOnlineBookingRule: requireRef(snapshot.sameDayOnlineBookingRule, "sameDayOnlineBookingRule"),
    comparableOfferRule: requireRef(snapshot.comparableOfferRule, "comparableOfferRule"),
    routingPolicyPackRef: requireRef(snapshot.routingPolicyPackRef, "routingPolicyPackRef"),
    varianceWindowPolicyRef: requireRef(snapshot.varianceWindowPolicyRef, "varianceWindowPolicyRef"),
    serviceObligationPolicyRef: requireRef(
      snapshot.serviceObligationPolicyRef,
      "serviceObligationPolicyRef",
    ),
    practiceVisibilityPolicyRef: requireRef(
      snapshot.practiceVisibilityPolicyRef,
      "practiceVisibilityPolicyRef",
    ),
    capacityIngestionPolicyRef: requireRef(
      snapshot.capacityIngestionPolicyRef,
      "capacityIngestionPolicyRef",
    ),
    rankPlanVersionRef: requireRef(snapshot.rankPlanVersionRef, "rankPlanVersionRef"),
    uncertaintyModelVersionRef: requireRef(
      snapshot.uncertaintyModelVersionRef,
      "uncertaintyModelVersionRef",
    ),
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeSourceAdmissionSummary(
  sourceAdmissionSummary: readonly PolicySourceAdmissionSummaryEntry[],
): PolicySourceAdmissionSummaryEntry[] {
  return [...sourceAdmissionSummary]
    .map((entry) => ({
      sourceRef: requireRef(entry.sourceRef, "sourceRef"),
      sourceTrustState: entry.sourceTrustState,
      candidateCount: ensureNonNegativeInteger(entry.candidateCount, "candidateCount"),
    }))
    .sort((left, right) => left.sourceRef.localeCompare(right.sourceRef));
}

function normalizePolicyEvaluationFacts(
  input: Partial<PolicyEvaluationFactsSnapshot> | undefined,
): PolicyEvaluationFactsSnapshot {
  return {
    routeToNetworkRequested:
      input?.routeToNetworkRequested === undefined ? null : Boolean(input.routeToNetworkRequested),
    urgentBounceRequired: Boolean(input?.urgentBounceRequired),
    requiredWindowFit:
      input?.requiredWindowFit === undefined || input.requiredWindowFit === null
        ? null
        : (() => {
            invariant(
              input.requiredWindowFit === 0 ||
                input.requiredWindowFit === 1 ||
                input.requiredWindowFit === 2,
              "REQUIRED_WINDOW_FIT_INVALID",
              "requiredWindowFit must be 0, 1, or 2.",
            );
            return input.requiredWindowFit;
          })(),
    sourceAdmissionSummary: normalizeSourceAdmissionSummary(input?.sourceAdmissionSummary ?? []),
    staleCapacityDetected: Boolean(input?.staleCapacityDetected),
    adjustedPopulation:
      input?.adjustedPopulation === undefined || input.adjustedPopulation === null
        ? null
        : ensureNonNegativeInteger(input.adjustedPopulation, "adjustedPopulation"),
    deliveredMinutes:
      input?.deliveredMinutes === undefined || input.deliveredMinutes === null
        ? null
        : ensureNonNegativeInteger(input.deliveredMinutes, "deliveredMinutes"),
    availableMinutes:
      input?.availableMinutes === undefined || input.availableMinutes === null
        ? null
        : ensureNonNegativeInteger(input.availableMinutes, "availableMinutes"),
    cancelledMinutes:
      input?.cancelledMinutes === undefined || input.cancelledMinutes === null
        ? null
        : ensureNonNegativeInteger(input.cancelledMinutes, "cancelledMinutes"),
    replacementMinutes:
      input?.replacementMinutes === undefined || input.replacementMinutes === null
        ? null
        : ensureNonNegativeInteger(input.replacementMinutes, "replacementMinutes"),
    commissionerExceptionRef: optionalRef(input?.commissionerExceptionRef),
    minimumNecessaryContractRef: optionalRef(input?.minimumNecessaryContractRef),
    ackDebtOpen: Boolean(input?.ackDebtOpen),
    visibilityDeltaRequired: Boolean(input?.visibilityDeltaRequired),
  };
}

function normalizePolicyEvaluation(
  snapshot: NetworkCoordinationPolicyEvaluationSnapshot,
): NetworkCoordinationPolicyEvaluationSnapshot {
  return {
    policyEvaluationId: requireRef(snapshot.policyEvaluationId, "policyEvaluationId"),
    hubCoordinationCaseId: requireRef(snapshot.hubCoordinationCaseId, "hubCoordinationCaseId"),
    evaluationScope: snapshot.evaluationScope,
    compiledPolicyBundleRef: requireRef(snapshot.compiledPolicyBundleRef, "compiledPolicyBundleRef"),
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    routingPolicyPackRef: requireRef(snapshot.routingPolicyPackRef, "routingPolicyPackRef"),
    varianceWindowPolicyRef: requireRef(snapshot.varianceWindowPolicyRef, "varianceWindowPolicyRef"),
    serviceObligationPolicyRef: requireRef(
      snapshot.serviceObligationPolicyRef,
      "serviceObligationPolicyRef",
    ),
    practiceVisibilityPolicyRef: requireRef(
      snapshot.practiceVisibilityPolicyRef,
      "practiceVisibilityPolicyRef",
    ),
    capacityIngestionPolicyRef: requireRef(
      snapshot.capacityIngestionPolicyRef,
      "capacityIngestionPolicyRef",
    ),
    routingDisposition: snapshot.routingDisposition,
    varianceDisposition: snapshot.varianceDisposition,
    serviceObligationDisposition: snapshot.serviceObligationDisposition,
    practiceVisibilityDisposition: snapshot.practiceVisibilityDisposition,
    capacityAdmissionDisposition: snapshot.capacityAdmissionDisposition,
    sourceAdmissionSummary: normalizeSourceAdmissionSummary(snapshot.sourceAdmissionSummary),
    policyExceptionRefs: uniqueSortedRefs(snapshot.policyExceptionRefs),
    replayFixtureRef: requireRef(snapshot.replayFixtureRef, "replayFixtureRef"),
    evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
    sourceRefs: uniqueSortedRefs(snapshot.sourceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizePolicyException(
  snapshot: PolicyExceptionRecordSnapshot,
): PolicyExceptionRecordSnapshot {
  return {
    policyExceptionRecordId: requireRef(snapshot.policyExceptionRecordId, "policyExceptionRecordId"),
    policyEvaluationRef: requireRef(snapshot.policyEvaluationRef, "policyEvaluationRef"),
    hubCoordinationCaseId: requireRef(snapshot.hubCoordinationCaseId, "hubCoordinationCaseId"),
    evaluationScope: snapshot.evaluationScope,
    policyTupleHash: requireRef(snapshot.policyTupleHash, "policyTupleHash"),
    family: snapshot.family,
    exceptionCode: requireRef(snapshot.exceptionCode, "exceptionCode"),
    severity: snapshot.severity,
    safeSummary: requireRef(snapshot.safeSummary, "safeSummary"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeReplayFixture(
  snapshot: PolicyEvaluationReplayFixtureSnapshot,
): PolicyEvaluationReplayFixtureSnapshot {
  return {
    policyEvaluationReplayFixtureId: requireRef(
      snapshot.policyEvaluationReplayFixtureId,
      "policyEvaluationReplayFixtureId",
    ),
    policyEvaluationRef: requireRef(snapshot.policyEvaluationRef, "policyEvaluationRef"),
    policyId: requireRef(snapshot.policyId, "policyId"),
    hubCoordinationCaseId: requireRef(snapshot.hubCoordinationCaseId, "hubCoordinationCaseId"),
    pcnRef: requireRef(snapshot.pcnRef, "pcnRef"),
    evaluationScope: snapshot.evaluationScope,
    presentedPolicyTupleHash: optionalRef(snapshot.presentedPolicyTupleHash),
    facts: normalizePolicyEvaluationFacts(snapshot.facts),
    evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

async function requireCompiledPolicy(
  repositories: Phase5EnhancedAccessPolicyRepositories,
  policyId: string,
): Promise<EnhancedAccessPolicySnapshot> {
  const document = await repositories.getCompiledPolicy(policyId);
  invariant(document !== null, "ENHANCED_ACCESS_POLICY_NOT_FOUND", "EnhancedAccessPolicy not found.");
  return document.toSnapshot();
}

async function requirePackSet(
  repositories: Phase5EnhancedAccessPolicyRepositories,
  compiledPolicy: EnhancedAccessPolicySnapshot,
): Promise<ActivePolicyPackSet> {
  const routingPolicyPack = await repositories.getRoutingPolicyPack(compiledPolicy.routingPolicyPackRef);
  const varianceWindowPolicy = await repositories.getVarianceWindowPolicy(
    compiledPolicy.varianceWindowPolicyRef,
  );
  const serviceObligationPolicy = await repositories.getServiceObligationPolicy(
    compiledPolicy.serviceObligationPolicyRef,
  );
  const practiceVisibilityPolicy = await repositories.getPracticeVisibilityPolicy(
    compiledPolicy.practiceVisibilityPolicyRef,
  );
  const capacityIngestionPolicy = await repositories.getCapacityIngestionPolicy(
    compiledPolicy.capacityIngestionPolicyRef,
  );
  invariant(routingPolicyPack !== null, "ROUTING_POLICY_PACK_NOT_FOUND", "Routing pack not found.");
  invariant(
    varianceWindowPolicy !== null,
    "VARIANCE_WINDOW_POLICY_NOT_FOUND",
    "Variance policy not found.",
  );
  invariant(
    serviceObligationPolicy !== null,
    "SERVICE_OBLIGATION_POLICY_NOT_FOUND",
    "Service-obligation policy not found.",
  );
  invariant(
    practiceVisibilityPolicy !== null,
    "PRACTICE_VISIBILITY_POLICY_NOT_FOUND",
    "Practice visibility policy not found.",
  );
  invariant(
    capacityIngestionPolicy !== null,
    "CAPACITY_INGESTION_POLICY_NOT_FOUND",
    "Capacity-ingestion policy not found.",
  );
  return {
    compiledPolicy,
    routingPolicyPack: routingPolicyPack.toSnapshot(),
    varianceWindowPolicy: varianceWindowPolicy.toSnapshot(),
    serviceObligationPolicy: serviceObligationPolicy.toSnapshot(),
    practiceVisibilityPolicy: practiceVisibilityPolicy.toSnapshot(),
    capacityIngestionPolicy: capacityIngestionPolicy.toSnapshot(),
  };
}

function tuplePayloadFromCompileInput(input: CompileEnhancedAccessPolicyInput) {
  return {
    pcnRef: requireRef(input.pcnRef, "pcnRef"),
    policyVersion: requireRef(input.policyVersion, "policyVersion"),
    effectiveAt: ensureIsoTimestamp(input.effectiveAt, "effectiveAt"),
    effectiveUntil: optionalRef(input.effectiveUntil),
    networkStandardHours: normalizeNetworkStandardHours(input.networkStandardHours),
    sameDayOnlineBookingRule: requireRef(
      input.sameDayOnlineBookingRule,
      "sameDayOnlineBookingRule",
    ),
    rankPlanVersionRef: requireRef(input.rankPlanVersionRef, "rankPlanVersionRef"),
    uncertaintyModelVersionRef: requireRef(
      input.uncertaintyModelVersionRef,
      "uncertaintyModelVersionRef",
    ),
    routingPolicyPack: {
      routingPolicyPackId: requireRef(
        input.routingPolicyPack.routingPolicyPackId ?? "routing_policy_pack_generated",
        "routingPolicyPackId",
      ),
      policyVersion: requireRef(input.routingPolicyPack.policyVersion, "routingPolicyPack.policyVersion"),
      routeReasonCode: optionalRef(input.routingPolicyPack.routeReasonCode),
      routingDisposition: input.routingPolicyPack.routingDisposition,
      eligibleSiteRefs: uniqueSortedRefs(input.routingPolicyPack.eligibleSiteRefs),
      serviceFamilyRefs: uniqueSortedRefs(input.routingPolicyPack.serviceFamilyRefs ?? []),
      sourceNamespaceRefs: uniqueSortedRefs(input.routingPolicyPack.sourceNamespaceRefs ?? []),
      commissionerApprovalRef: optionalRef(input.routingPolicyPack.commissionerApprovalRef),
      sourceRefs: uniqueSortedRefs(input.routingPolicyPack.sourceRefs),
    },
    varianceWindowPolicy: {
      varianceWindowPolicyId: requireRef(
        input.varianceWindowPolicy.varianceWindowPolicyId ?? "variance_window_policy_generated",
        "varianceWindowPolicyId",
      ),
      policyVersion: requireRef(
        input.varianceWindowPolicy.policyVersion,
        "varianceWindowPolicy.policyVersion",
      ),
      requiredWindowRule: requireRef(
        input.varianceWindowPolicy.requiredWindowRule,
        "varianceWindowPolicy.requiredWindowRule",
      ),
      approvedVarianceBeforeMinutes: ensureNonNegativeInteger(
        input.varianceWindowPolicy.approvedVarianceBeforeMinutes,
        "approvedVarianceBeforeMinutes",
      ),
      approvedVarianceAfterMinutes: ensureNonNegativeInteger(
        input.varianceWindowPolicy.approvedVarianceAfterMinutes,
        "approvedVarianceAfterMinutes",
      ),
      outsideWindowVisibleByPolicy: Boolean(input.varianceWindowPolicy.outsideWindowVisibleByPolicy),
      varianceDisposition: input.varianceWindowPolicy.varianceDisposition,
      sourceRefs: uniqueSortedRefs(input.varianceWindowPolicy.sourceRefs),
    },
    serviceObligationPolicy: {
      serviceObligationPolicyId: requireRef(
        input.serviceObligationPolicy.serviceObligationPolicyId ??
          "service_obligation_policy_generated",
        "serviceObligationPolicyId",
      ),
      policyVersion: requireRef(
        input.serviceObligationPolicy.policyVersion,
        "serviceObligationPolicy.policyVersion",
      ),
      weeklyMinutesPer1000AdjustedPopulation: ensureNonNegativeInteger(
        input.serviceObligationPolicy.weeklyMinutesPer1000AdjustedPopulation,
        "weeklyMinutesPer1000AdjustedPopulation",
      ),
      bankHolidayMakeUpWindowHours: ensureNonNegativeInteger(
        input.serviceObligationPolicy.bankHolidayMakeUpWindowHours,
        "bankHolidayMakeUpWindowHours",
      ),
      comparableOfferRule: requireRef(
        input.serviceObligationPolicy.comparableOfferRule,
        "serviceObligationPolicy.comparableOfferRule",
      ),
      ledgerMode: input.serviceObligationPolicy.ledgerMode,
      serviceObligationDisposition: input.serviceObligationPolicy.serviceObligationDisposition,
      sourceRefs: uniqueSortedRefs(input.serviceObligationPolicy.sourceRefs),
    },
    practiceVisibilityPolicy: {
      practiceVisibilityPolicyId: requireRef(
        input.practiceVisibilityPolicy.practiceVisibilityPolicyId ??
          "practice_visibility_policy_generated",
        "practiceVisibilityPolicyId",
      ),
      policyVersion: requireRef(
        input.practiceVisibilityPolicy.policyVersion,
        "practiceVisibilityPolicy.policyVersion",
      ),
      minimumNecessaryContractRef: requireRef(
        input.practiceVisibilityPolicy.minimumNecessaryContractRef,
        "practiceVisibilityPolicy.minimumNecessaryContractRef",
      ),
      originPracticeVisibleFieldRefs: uniqueSortedRefs(
        input.practiceVisibilityPolicy.originPracticeVisibleFieldRefs,
      ),
      hiddenFieldRefs: uniqueSortedRefs(input.practiceVisibilityPolicy.hiddenFieldRefs ?? []),
      visibilityDeltaRule: requireRef(
        input.practiceVisibilityPolicy.visibilityDeltaRule,
        "practiceVisibilityPolicy.visibilityDeltaRule",
      ),
      ackGenerationMode: input.practiceVisibilityPolicy.ackGenerationMode,
      practiceVisibilityDisposition: input.practiceVisibilityPolicy.practiceVisibilityDisposition,
      sourceRefs: uniqueSortedRefs(input.practiceVisibilityPolicy.sourceRefs),
    },
    capacityIngestionPolicy: {
      capacityIngestionPolicyId: requireRef(
        input.capacityIngestionPolicy.capacityIngestionPolicyId ??
          "capacity_ingestion_policy_generated",
        "capacityIngestionPolicyId",
      ),
      policyVersion: requireRef(
        input.capacityIngestionPolicy.policyVersion,
        "capacityIngestionPolicy.policyVersion",
      ),
      freshnessThresholdMinutes: ensureNonNegativeInteger(
        input.capacityIngestionPolicy.freshnessThresholdMinutes,
        "freshnessThresholdMinutes",
      ),
      staleThresholdMinutes: ensureNonNegativeInteger(
        input.capacityIngestionPolicy.staleThresholdMinutes,
        "staleThresholdMinutes",
      ),
      quarantineTriggers: uniqueSortedRefs(input.capacityIngestionPolicy.quarantineTriggers),
      degradedTriggers: uniqueSortedRefs(input.capacityIngestionPolicy.degradedTriggers),
      duplicateCapacityCollisionPolicy: requireRef(
        input.capacityIngestionPolicy.duplicateCapacityCollisionPolicy,
        "capacityIngestionPolicy.duplicateCapacityCollisionPolicy",
      ),
      degradedVisibilityModes: uniqueSortedRefs(
        input.capacityIngestionPolicy.degradedVisibilityModes,
      ),
      patientOfferableTrustStates: uniqueSortedRefs(
        input.capacityIngestionPolicy.patientOfferableTrustStates,
      ),
      directCommitTrustStates: uniqueSortedRefs(
        input.capacityIngestionPolicy.directCommitTrustStates,
      ),
      capacityAdmissionDisposition: input.capacityIngestionPolicy.capacityAdmissionDisposition,
      sourceRefs: uniqueSortedRefs(input.capacityIngestionPolicy.sourceRefs),
    },
    sourceRefs: uniqueSortedRefs(
      input.sourceRefs ?? [
        ...input.routingPolicyPack.sourceRefs,
        ...input.varianceWindowPolicy.sourceRefs,
        ...input.serviceObligationPolicy.sourceRefs,
        ...input.practiceVisibilityPolicy.sourceRefs,
        ...input.capacityIngestionPolicy.sourceRefs,
      ],
    ),
  };
}

function policyTupleHashFromCompileInput(input: CompileEnhancedAccessPolicyInput): {
  policyTupleHash: string;
  tupleCanonicalPayload: string;
  tuplePayload: ReturnType<typeof tuplePayloadFromCompileInput>;
} {
  const tuplePayload = tuplePayloadFromCompileInput(input);
  const tupleCanonicalPayload = canonicalStringify(tuplePayload);
  return {
    policyTupleHash: sha256Hex(tupleCanonicalPayload),
    tupleCanonicalPayload,
    tuplePayload,
  };
}

function currentWithinEffectiveWindow(
  effectiveAt: string,
  effectiveUntil: string | null,
  asOf: string,
): boolean {
  return compareIso(effectiveAt, asOf) <= 0 && (effectiveUntil === null || compareIso(asOf, effectiveUntil) < 0);
}

function requiredMinutesForPopulation(
  weeklyMinutesPer1000AdjustedPopulation: number,
  adjustedPopulation: number,
): number {
  return Math.ceil((weeklyMinutesPer1000AdjustedPopulation * adjustedPopulation) / 1000);
}

function varianceDispositionFromFacts(
  varianceWindowPolicy: HubVarianceWindowPolicySnapshot,
  requiredWindowFit: 0 | 1 | 2 | null,
): VarianceDisposition {
  if (requiredWindowFit === null) {
    return varianceWindowPolicy.varianceDisposition;
  }
  if (requiredWindowFit === 2) {
    return "inside_required_window";
  }
  if (requiredWindowFit === 1) {
    return "inside_approved_variance_window";
  }
  return varianceWindowPolicy.outsideWindowVisibleByPolicy
    ? "outside_window_visible_by_policy"
    : "outside_window_blocked";
}

function routingDispositionFromFacts(
  routingPolicyPack: HubRoutingPolicyPackSnapshot,
  facts: PolicyEvaluationFactsSnapshot,
): RoutingDisposition {
  if (facts.urgentBounceRequired) {
    return "bounce_back_urgent";
  }
  if (facts.routeToNetworkRequested === false) {
    return "retain_local";
  }
  if (
    routingPolicyPack.routingDisposition === "blocked" ||
    routingPolicyPack.eligibleSiteRefs.length === 0
  ) {
    return "blocked";
  }
  return facts.routeToNetworkRequested === true
    ? "route_to_network"
    : routingPolicyPack.routingDisposition;
}

function serviceObligationDispositionFromFacts(
  compiledPolicy: EnhancedAccessPolicySnapshot,
  serviceObligationPolicy: HubServiceObligationPolicySnapshot,
  facts: PolicyEvaluationFactsSnapshot,
): ServiceObligationDisposition {
  if (facts.commissionerExceptionRef !== null) {
    return "commissioner_exception_active";
  }
  if (
    serviceObligationPolicy.ledgerMode === "minutes_ledger_required" &&
    facts.cancelledMinutes !== null &&
    facts.replacementMinutes !== null &&
    facts.cancelledMinutes > facts.replacementMinutes
  ) {
    return "make_up_required";
  }
  if (
    facts.adjustedPopulation !== null &&
    (facts.deliveredMinutes !== null || facts.availableMinutes !== null)
  ) {
    const requiredMinutes = requiredMinutesForPopulation(
      compiledPolicy.weeklyMinutesPer1000AdjustedPopulation,
      facts.adjustedPopulation,
    );
    if (
      (facts.deliveredMinutes !== null && facts.deliveredMinutes < requiredMinutes) ||
      (facts.availableMinutes !== null && facts.availableMinutes < requiredMinutes)
    ) {
      return "obligation_risk";
    }
  }
  return serviceObligationPolicy.serviceObligationDisposition;
}

function practiceVisibilityDispositionFromFacts(
  practiceVisibilityPolicy: HubPracticeVisibilityPolicySnapshot,
  facts: PolicyEvaluationFactsSnapshot,
): PracticeVisibilityDisposition {
  if (
    facts.minimumNecessaryContractRef !== null &&
    facts.minimumNecessaryContractRef !== practiceVisibilityPolicy.minimumNecessaryContractRef
  ) {
    return "visibility_restricted";
  }
  if (facts.visibilityDeltaRequired) {
    return "delta_required";
  }
  if (facts.ackDebtOpen) {
    return "ack_debt_open";
  }
  return practiceVisibilityPolicy.practiceVisibilityDisposition;
}

function capacityAdmissionDispositionFromFacts(
  capacityIngestionPolicy: HubCapacityIngestionPolicySnapshot,
  sourceAdmissionSummary: readonly PolicySourceAdmissionSummaryEntry[],
  facts: PolicyEvaluationFactsSnapshot,
): CapacityAdmissionDisposition {
  const totalCandidateCount = sourceAdmissionSummary.reduce(
    (sum, entry) => sum + entry.candidateCount,
    0,
  );
  if (facts.staleCapacityDetected) {
    return "stale_capacity";
  }
  if (totalCandidateCount === 0) {
    return "missing_capacity";
  }
  const trustedCount = sourceAdmissionSummary
    .filter((entry) => entry.sourceTrustState === "trusted")
    .reduce((sum, entry) => sum + entry.candidateCount, 0);
  if (trustedCount > 0) {
    return "trusted_admitted";
  }
  const degradedCount = sourceAdmissionSummary
    .filter((entry) => entry.sourceTrustState === "degraded")
    .reduce((sum, entry) => sum + entry.candidateCount, 0);
  if (degradedCount > 0) {
    return capacityIngestionPolicy.degradedVisibilityModes.includes("callback_only_reasoning")
      ? "degraded_callback_only"
      : "degraded_diagnostic_only";
  }
  return "quarantined_excluded";
}

function safeSummaryForException(
  family: PolicyExceptionFamily,
  exceptionCode: string,
): string {
  switch (exceptionCode) {
    case "POLICY_TUPLE_DRIFT":
      return "The active policy tuple changed and the bound evaluation is no longer current.";
    case "ROUTING_BLOCKED":
      return "Routing policy currently blocks network progression.";
    case "ROUTING_URGENT_BOUNCE":
      return "Routing policy requires urgent return instead of hub progression.";
    case "VARIANCE_OUTSIDE_WINDOW_BLOCKED":
      return "The case is outside the lawful offer window for this tuple.";
    case "VARIANCE_OUTSIDE_WINDOW_VISIBLE":
      return "The case is outside the required window and remains visible only as a governed explanation.";
    case "SERVICE_OBLIGATION_MAKE_UP_REQUIRED":
      return "The tuple requires make-up action for cancelled or missing minutes.";
    case "SERVICE_OBLIGATION_RISK":
      return "The current minutes or supply facts place the network under obligation risk.";
    case "PRACTICE_VISIBILITY_RESTRICTED":
      return "Practice visibility generation is restricted under the current minimum-necessary contract.";
    case "PRACTICE_ACK_DEBT_OPEN":
      return "Practice acknowledgement debt remains open under the current tuple.";
    case "PRACTICE_DELTA_REQUIRED":
      return "A practice visibility delta must be generated before this scope is complete.";
    case "CAPACITY_DEGRADED_CALLBACK_ONLY":
      return "Only callback-only reasoning is lawful for the current degraded capacity state.";
    case "CAPACITY_DEGRADED_DIAGNOSTIC_ONLY":
      return "Only diagnostic-only visibility is lawful for the current degraded capacity state.";
    case "CAPACITY_QUARANTINED":
      return "Quarantined capacity is excluded from ordinary patient offer and direct commit.";
    case "CAPACITY_STALE":
      return "Stale capacity prevents ordinary progression under the current tuple.";
    case "CAPACITY_MISSING":
      return "No capacity is currently admissible for the evaluated scope.";
    default:
      return `Policy exception raised in ${family}.`;
  }
}

function collectPolicyExceptions(input: {
  hubCoordinationCaseId: string;
  evaluationScope: PolicyEvaluationScope;
  policyTupleHash: string;
  routingDisposition: RoutingDisposition;
  varianceDisposition: VarianceDisposition;
  serviceObligationDisposition: ServiceObligationDisposition;
  practiceVisibilityDisposition: PracticeVisibilityDisposition;
  capacityAdmissionDisposition: CapacityAdmissionDisposition;
  tupleDrifted: boolean;
  createdAt: string;
  policyEvaluationId: string;
  existingCount: number;
  idGenerator: BackboneIdGenerator;
}): PolicyExceptionRecordSnapshot[] {
  const exceptions: Array<{
    family: PolicyExceptionFamily;
    exceptionCode: string;
    severity: PolicyExceptionSeverity;
  }> = [];

  if (input.tupleDrifted) {
    exceptions.push({
      family: "tuple_drift",
      exceptionCode: "POLICY_TUPLE_DRIFT",
      severity: "blocking",
    });
  }
  if (input.routingDisposition === "blocked") {
    exceptions.push({
      family: "routing",
      exceptionCode: "ROUTING_BLOCKED",
      severity: "blocking",
    });
  }
  if (input.routingDisposition === "bounce_back_urgent") {
    exceptions.push({
      family: "routing",
      exceptionCode: "ROUTING_URGENT_BOUNCE",
      severity: "blocking",
    });
  }
  if (input.varianceDisposition === "outside_window_blocked") {
    exceptions.push({
      family: "variance",
      exceptionCode: "VARIANCE_OUTSIDE_WINDOW_BLOCKED",
      severity: input.evaluationScope === "manage_exposure" ? "warning" : "blocking",
    });
  }
  if (input.varianceDisposition === "outside_window_visible_by_policy") {
    exceptions.push({
      family: "variance",
      exceptionCode: "VARIANCE_OUTSIDE_WINDOW_VISIBLE",
      severity: "warning",
    });
  }
  if (input.serviceObligationDisposition === "make_up_required") {
    exceptions.push({
      family: "service_obligation",
      exceptionCode: "SERVICE_OBLIGATION_MAKE_UP_REQUIRED",
      severity: "warning",
    });
  }
  if (input.serviceObligationDisposition === "obligation_risk") {
    exceptions.push({
      family: "service_obligation",
      exceptionCode: "SERVICE_OBLIGATION_RISK",
      severity: "warning",
    });
  }
  if (input.practiceVisibilityDisposition === "visibility_restricted") {
    exceptions.push({
      family: "practice_visibility",
      exceptionCode: "PRACTICE_VISIBILITY_RESTRICTED",
      severity:
        input.evaluationScope === "practice_visibility_generation" ? "blocking" : "warning",
    });
  }
  if (input.practiceVisibilityDisposition === "ack_debt_open") {
    exceptions.push({
      family: "practice_visibility",
      exceptionCode: "PRACTICE_ACK_DEBT_OPEN",
      severity: "warning",
    });
  }
  if (input.practiceVisibilityDisposition === "delta_required") {
    exceptions.push({
      family: "practice_visibility",
      exceptionCode: "PRACTICE_DELTA_REQUIRED",
      severity: "warning",
    });
  }
  if (input.capacityAdmissionDisposition === "degraded_callback_only") {
    exceptions.push({
      family: "capacity_ingestion",
      exceptionCode: "CAPACITY_DEGRADED_CALLBACK_ONLY",
      severity:
        input.evaluationScope === "candidate_snapshot" ||
        input.evaluationScope === "manage_exposure"
          ? "warning"
          : "blocking",
    });
  }
  if (input.capacityAdmissionDisposition === "degraded_diagnostic_only") {
    exceptions.push({
      family: "capacity_ingestion",
      exceptionCode: "CAPACITY_DEGRADED_DIAGNOSTIC_ONLY",
      severity: "blocking",
    });
  }
  if (input.capacityAdmissionDisposition === "quarantined_excluded") {
    exceptions.push({
      family: "capacity_ingestion",
      exceptionCode: "CAPACITY_QUARANTINED",
      severity: "blocking",
    });
  }
  if (input.capacityAdmissionDisposition === "stale_capacity") {
    exceptions.push({
      family: "capacity_ingestion",
      exceptionCode: "CAPACITY_STALE",
      severity: "blocking",
    });
  }
  if (input.capacityAdmissionDisposition === "missing_capacity") {
    exceptions.push({
      family: "capacity_ingestion",
      exceptionCode: "CAPACITY_MISSING",
      severity:
        input.evaluationScope === "practice_visibility_generation" ? "warning" : "blocking",
    });
  }

  return exceptions.map((exception, index) =>
    normalizePolicyException({
      policyExceptionRecordId: nextHubPolicyId(input.idGenerator, "policy_exception_record"),
      policyEvaluationRef: input.policyEvaluationId,
      hubCoordinationCaseId: input.hubCoordinationCaseId,
      evaluationScope: input.evaluationScope,
      policyTupleHash: input.policyTupleHash,
      family: exception.family,
      exceptionCode: exception.exceptionCode,
      severity: exception.severity,
      safeSummary: safeSummaryForException(exception.family, exception.exceptionCode),
      createdAt: input.createdAt,
      version: input.existingCount + index + 1,
    }),
  );
}

function evaluationMatches(
  left: NetworkCoordinationPolicyEvaluationSnapshot,
  right: NetworkCoordinationPolicyEvaluationSnapshot,
): readonly string[] {
  const mismatches: string[] = [];
  for (const key of [
    "evaluationScope",
    "policyTupleHash",
    "routingDisposition",
    "varianceDisposition",
    "serviceObligationDisposition",
    "practiceVisibilityDisposition",
    "capacityAdmissionDisposition",
  ] as const) {
    if (left[key] !== right[key]) {
      mismatches.push(key);
    }
  }
  if (canonicalStringify(left.sourceAdmissionSummary) !== canonicalStringify(right.sourceAdmissionSummary)) {
    mismatches.push("sourceAdmissionSummary");
  }
  return mismatches;
}

export interface Phase5EnhancedAccessPolicyService {
  repositories: Phase5EnhancedAccessPolicyRepositories;
  hubCaseService: Phase5HubCaseKernelService;
  policyTupleHashFromCompileInput(input: CompileEnhancedAccessPolicyInput): {
    policyTupleHash: string;
    tupleCanonicalPayload: string;
  };
  loadActivePolicyPacksForScope(input: {
    pcnRef: string;
    asOf: string;
  }): Promise<ActivePolicyPackSet>;
  compileEnhancedAccessPolicy(
    input: CompileEnhancedAccessPolicyInput,
  ): Promise<CompileEnhancedAccessPolicyResult>;
  evaluateHubCaseAgainstPolicy(
    input: EvaluateNetworkPolicyInput,
  ): Promise<NetworkPolicyEvaluationResult>;
  evaluateHubCaseAcrossScopes(
    input: EvaluateNetworkPolicyScopesInput,
  ): Promise<readonly NetworkPolicyEvaluationResult[]>;
  replayHistoricalEvaluation(
    input: ReplayNetworkPolicyEvaluationInput,
  ): Promise<NetworkPolicyReplayResult>;
  resolvePolicyTupleDrift(input: {
    pcnRef: string;
    boundPolicyTupleHash: string;
    asOf: string;
  }): Promise<PolicyTupleDriftResult>;
  assertPolicyTupleCurrent(input: {
    pcnRef: string;
    boundPolicyTupleHash: string;
    asOf: string;
  }): Promise<PolicyTupleDriftResult>;
}

export function createPhase5EnhancedAccessPolicyService(input?: {
  repositories?: Phase5EnhancedAccessPolicyRepositories;
  idGenerator?: BackboneIdGenerator;
  hubCaseService?: Phase5HubCaseKernelService;
}): Phase5EnhancedAccessPolicyService {
  const repositories = input?.repositories ?? createPhase5EnhancedAccessPolicyStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-enhanced-access-policy");
  const hubCaseService = input?.hubCaseService ?? createPhase5HubCaseKernelService();

  async function maybeSupersedeActivePolicy(pcnRef: string, asOf: string): Promise<void> {
    const activePolicyId = await repositories.getActivePolicyIdForPcn(pcnRef);
    if (!activePolicyId) {
      return;
    }
    const activePolicy = await requireCompiledPolicy(repositories, activePolicyId);
    if (activePolicy.policyState !== "active") {
      return;
    }
    const packSet = await requirePackSet(repositories, activePolicy);
    const nextPolicy = normalizeEnhancedAccessPolicy({
      ...activePolicy,
      policyState: "superseded",
      effectiveUntil: asOf,
      version: nextVersion(activePolicy.version),
    });
    await repositories.saveCompiledPolicy(nextPolicy, { expectedVersion: activePolicy.version });

    await repositories.saveRoutingPolicyPack(
      normalizeRoutingPolicyPack({
        ...packSet.routingPolicyPack,
        policyState: "superseded",
        effectiveUntil: asOf,
        version: nextVersion(packSet.routingPolicyPack.version),
      }),
      { expectedVersion: packSet.routingPolicyPack.version },
    );
    await repositories.saveVarianceWindowPolicy(
      normalizeVarianceWindowPolicy({
        ...packSet.varianceWindowPolicy,
        policyState: "superseded",
        effectiveUntil: asOf,
        version: nextVersion(packSet.varianceWindowPolicy.version),
      }),
      { expectedVersion: packSet.varianceWindowPolicy.version },
    );
    await repositories.saveServiceObligationPolicy(
      normalizeServiceObligationPolicy({
        ...packSet.serviceObligationPolicy,
        policyState: "superseded",
        effectiveUntil: asOf,
        version: nextVersion(packSet.serviceObligationPolicy.version),
      }),
      { expectedVersion: packSet.serviceObligationPolicy.version },
    );
    await repositories.savePracticeVisibilityPolicy(
      normalizePracticeVisibilityPolicy({
        ...packSet.practiceVisibilityPolicy,
        policyState: "superseded",
        effectiveUntil: asOf,
        version: nextVersion(packSet.practiceVisibilityPolicy.version),
      }),
      { expectedVersion: packSet.practiceVisibilityPolicy.version },
    );
    await repositories.saveCapacityIngestionPolicy(
      normalizeCapacityIngestionPolicy({
        ...packSet.capacityIngestionPolicy,
        policyState: "superseded",
        effectiveUntil: asOf,
        version: nextVersion(packSet.capacityIngestionPolicy.version),
      }),
      { expectedVersion: packSet.capacityIngestionPolicy.version },
    );
  }

  return {
    repositories,
    hubCaseService,

    policyTupleHashFromCompileInput(inputValue) {
      const { policyTupleHash, tupleCanonicalPayload } = policyTupleHashFromCompileInput(inputValue);
      return { policyTupleHash, tupleCanonicalPayload };
    },

    async loadActivePolicyPacksForScope(command) {
      const asOf = ensureIsoTimestamp(command.asOf, "asOf");
      const activePolicyId = await repositories.getActivePolicyIdForPcn(
        requireRef(command.pcnRef, "pcnRef"),
      );
      invariant(activePolicyId !== null, "ACTIVE_POLICY_NOT_FOUND", "Active policy not found.");
      const compiledPolicy = await requireCompiledPolicy(repositories, activePolicyId);
      invariant(
        compiledPolicy.policyState === "active" &&
          currentWithinEffectiveWindow(compiledPolicy.effectiveAt, compiledPolicy.effectiveUntil, asOf),
        "ACTIVE_POLICY_NOT_CURRENT",
        "The active EnhancedAccessPolicy is not current for the supplied timestamp.",
      );
      return requirePackSet(repositories, compiledPolicy);
    },

    async compileEnhancedAccessPolicy(command) {
      const effectiveAt = ensureIsoTimestamp(command.effectiveAt, "effectiveAt");
      const effectiveUntil = optionalRef(command.effectiveUntil);
      if (effectiveUntil !== null) {
        invariant(
          compareIso(effectiveAt, effectiveUntil) < 0,
          "EFFECTIVE_WINDOW_INVALID",
          "effectiveUntil must be after effectiveAt.",
        );
      }
      const policyState = command.policyState ?? "active";
      if (policyState === "active") {
        await maybeSupersedeActivePolicy(command.pcnRef, effectiveAt);
      }
      const { policyTupleHash, tupleCanonicalPayload, tuplePayload } =
        policyTupleHashFromCompileInput(command);

      const routingPolicyPack = normalizeRoutingPolicyPack({
        routingPolicyPackId:
          command.routingPolicyPack.routingPolicyPackId ??
          nextHubPolicyId(idGenerator, "hub_routing_policy_pack"),
        pcnRef: requireRef(command.pcnRef, "pcnRef"),
        policyVersion: requireRef(command.routingPolicyPack.policyVersion, "policyVersion"),
        policyState,
        effectiveAt,
        effectiveUntil,
        policyTupleHash,
        routeReasonCode: optionalRef(command.routingPolicyPack.routeReasonCode),
        routingDisposition: command.routingPolicyPack.routingDisposition,
        eligibleSiteRefs: tuplePayload.routingPolicyPack.eligibleSiteRefs,
        serviceFamilyRefs: tuplePayload.routingPolicyPack.serviceFamilyRefs,
        sourceNamespaceRefs: tuplePayload.routingPolicyPack.sourceNamespaceRefs,
        commissionerApprovalRef: tuplePayload.routingPolicyPack.commissionerApprovalRef,
        sourceRefs: tuplePayload.routingPolicyPack.sourceRefs,
        version: 1,
      });
      const varianceWindowPolicy = normalizeVarianceWindowPolicy({
        varianceWindowPolicyId:
          command.varianceWindowPolicy.varianceWindowPolicyId ??
          nextHubPolicyId(idGenerator, "hub_variance_window_policy"),
        pcnRef: command.pcnRef,
        policyVersion: requireRef(command.varianceWindowPolicy.policyVersion, "policyVersion"),
        policyState,
        effectiveAt,
        effectiveUntil,
        policyTupleHash,
        requiredWindowRule: requireRef(
          command.varianceWindowPolicy.requiredWindowRule,
          "requiredWindowRule",
        ),
        approvedVarianceBeforeMinutes: command.varianceWindowPolicy.approvedVarianceBeforeMinutes,
        approvedVarianceAfterMinutes: command.varianceWindowPolicy.approvedVarianceAfterMinutes,
        outsideWindowVisibleByPolicy: command.varianceWindowPolicy.outsideWindowVisibleByPolicy,
        varianceDisposition: command.varianceWindowPolicy.varianceDisposition,
        sourceRefs: tuplePayload.varianceWindowPolicy.sourceRefs,
        version: 1,
      });
      const serviceObligationPolicy = normalizeServiceObligationPolicy({
        serviceObligationPolicyId:
          command.serviceObligationPolicy.serviceObligationPolicyId ??
          nextHubPolicyId(idGenerator, "hub_service_obligation_policy"),
        pcnRef: command.pcnRef,
        policyVersion: requireRef(command.serviceObligationPolicy.policyVersion, "policyVersion"),
        policyState,
        effectiveAt,
        effectiveUntil,
        policyTupleHash,
        weeklyMinutesPer1000AdjustedPopulation:
          command.serviceObligationPolicy.weeklyMinutesPer1000AdjustedPopulation,
        bankHolidayMakeUpWindowHours:
          command.serviceObligationPolicy.bankHolidayMakeUpWindowHours,
        comparableOfferRule: requireRef(
          command.serviceObligationPolicy.comparableOfferRule,
          "comparableOfferRule",
        ),
        ledgerMode: command.serviceObligationPolicy.ledgerMode,
        serviceObligationDisposition: command.serviceObligationPolicy.serviceObligationDisposition,
        sourceRefs: tuplePayload.serviceObligationPolicy.sourceRefs,
        version: 1,
      });
      const practiceVisibilityPolicy = normalizePracticeVisibilityPolicy({
        practiceVisibilityPolicyId:
          command.practiceVisibilityPolicy.practiceVisibilityPolicyId ??
          nextHubPolicyId(idGenerator, "hub_practice_visibility_policy"),
        pcnRef: command.pcnRef,
        policyVersion: requireRef(command.practiceVisibilityPolicy.policyVersion, "policyVersion"),
        policyState,
        effectiveAt,
        effectiveUntil,
        policyTupleHash,
        minimumNecessaryContractRef: requireRef(
          command.practiceVisibilityPolicy.minimumNecessaryContractRef,
          "minimumNecessaryContractRef",
        ),
        originPracticeVisibleFieldRefs:
          tuplePayload.practiceVisibilityPolicy.originPracticeVisibleFieldRefs,
        hiddenFieldRefs: tuplePayload.practiceVisibilityPolicy.hiddenFieldRefs,
        visibilityDeltaRule: requireRef(
          command.practiceVisibilityPolicy.visibilityDeltaRule,
          "visibilityDeltaRule",
        ),
        ackGenerationMode: command.practiceVisibilityPolicy.ackGenerationMode,
        practiceVisibilityDisposition:
          command.practiceVisibilityPolicy.practiceVisibilityDisposition,
        sourceRefs: tuplePayload.practiceVisibilityPolicy.sourceRefs,
        version: 1,
      });
      const capacityIngestionPolicy = normalizeCapacityIngestionPolicy({
        capacityIngestionPolicyId:
          command.capacityIngestionPolicy.capacityIngestionPolicyId ??
          nextHubPolicyId(idGenerator, "hub_capacity_ingestion_policy"),
        pcnRef: command.pcnRef,
        policyVersion: requireRef(command.capacityIngestionPolicy.policyVersion, "policyVersion"),
        policyState,
        effectiveAt,
        effectiveUntil,
        policyTupleHash,
        freshnessThresholdMinutes: command.capacityIngestionPolicy.freshnessThresholdMinutes,
        staleThresholdMinutes: command.capacityIngestionPolicy.staleThresholdMinutes,
        quarantineTriggers: tuplePayload.capacityIngestionPolicy.quarantineTriggers,
        degradedTriggers: tuplePayload.capacityIngestionPolicy.degradedTriggers,
        duplicateCapacityCollisionPolicy: requireRef(
          command.capacityIngestionPolicy.duplicateCapacityCollisionPolicy,
          "duplicateCapacityCollisionPolicy",
        ),
        degradedVisibilityModes:
          tuplePayload.capacityIngestionPolicy.degradedVisibilityModes as DegradedVisibilityMode[],
        patientOfferableTrustStates:
          tuplePayload.capacityIngestionPolicy.patientOfferableTrustStates as "trusted"[],
        directCommitTrustStates:
          tuplePayload.capacityIngestionPolicy.directCommitTrustStates as "trusted"[],
        capacityAdmissionDisposition: command.capacityIngestionPolicy.capacityAdmissionDisposition,
        sourceRefs: tuplePayload.capacityIngestionPolicy.sourceRefs,
        version: 1,
      });

      const compiledPolicy = normalizeEnhancedAccessPolicy({
        policyId: command.policyId ?? nextHubPolicyId(idGenerator, "enhanced_access_policy"),
        policyVersion: requireRef(command.policyVersion, "policyVersion"),
        policyState,
        compiledPolicyBundleRef:
          command.compiledPolicyBundleRef ??
          `compiled_policy_bundle_${policyTupleHash.slice(0, 16)}`,
        policyTupleHash,
        effectiveAt,
        effectiveUntil,
        pcnRef: requireRef(command.pcnRef, "pcnRef"),
        weeklyMinutesPer1000AdjustedPopulation:
          serviceObligationPolicy.weeklyMinutesPer1000AdjustedPopulation,
        networkStandardHours: normalizeNetworkStandardHours(command.networkStandardHours),
        sameDayOnlineBookingRule: requireRef(
          command.sameDayOnlineBookingRule,
          "sameDayOnlineBookingRule",
        ),
        comparableOfferRule: serviceObligationPolicy.comparableOfferRule,
        routingPolicyPackRef: routingPolicyPack.routingPolicyPackId,
        varianceWindowPolicyRef: varianceWindowPolicy.varianceWindowPolicyId,
        serviceObligationPolicyRef: serviceObligationPolicy.serviceObligationPolicyId,
        practiceVisibilityPolicyRef: practiceVisibilityPolicy.practiceVisibilityPolicyId,
        capacityIngestionPolicyRef: capacityIngestionPolicy.capacityIngestionPolicyId,
        rankPlanVersionRef: requireRef(command.rankPlanVersionRef, "rankPlanVersionRef"),
        uncertaintyModelVersionRef: requireRef(
          command.uncertaintyModelVersionRef,
          "uncertaintyModelVersionRef",
        ),
        sourceRefs: tuplePayload.sourceRefs,
        version: 1,
      });

      await repositories.saveRoutingPolicyPack(routingPolicyPack);
      await repositories.saveVarianceWindowPolicy(varianceWindowPolicy);
      await repositories.saveServiceObligationPolicy(serviceObligationPolicy);
      await repositories.savePracticeVisibilityPolicy(practiceVisibilityPolicy);
      await repositories.saveCapacityIngestionPolicy(capacityIngestionPolicy);
      await repositories.saveCompiledPolicy(compiledPolicy);
      if (policyState === "active") {
        await repositories.setActivePolicyIdForPcn(compiledPolicy.pcnRef, compiledPolicy.policyId);
      }

      return {
        compiledPolicy,
        routingPolicyPack,
        varianceWindowPolicy,
        serviceObligationPolicy,
        practiceVisibilityPolicy,
        capacityIngestionPolicy,
        tupleCanonicalPayload,
      };
    },

    async evaluateHubCaseAgainstPolicy(command) {
      const evaluatedAt = ensureIsoTimestamp(command.evaluatedAt, "evaluatedAt");
      const hubCaseBundle = await hubCaseService.queryHubCaseBundle(command.hubCoordinationCaseId);
      const pcnRef =
        optionalRef(command.pcnRef) ?? hubCaseBundle?.hubCase.servingPcnId ?? null;
      invariant(pcnRef !== null, "PCN_SCOPE_REQUIRED", "pcnRef is required for policy evaluation.");

      const policySet =
        optionalRef(command.policyId) !== null
          ? await requirePackSet(repositories, await requireCompiledPolicy(repositories, command.policyId!))
          : await this.loadActivePolicyPacksForScope({
              pcnRef,
              asOf: evaluatedAt,
            });
      const facts = normalizePolicyEvaluationFacts(command.facts);
      const normalizedSourceSummary = facts.sourceAdmissionSummary;
      const presentedPolicyTupleHash = optionalRef(command.presentedPolicyTupleHash);
      const tupleDrifted =
        presentedPolicyTupleHash !== null &&
        presentedPolicyTupleHash !== policySet.compiledPolicy.policyTupleHash;
      const routingDisposition = routingDispositionFromFacts(policySet.routingPolicyPack, facts);
      const varianceDisposition = varianceDispositionFromFacts(
        policySet.varianceWindowPolicy,
        facts.requiredWindowFit,
      );
      const serviceObligationDisposition = serviceObligationDispositionFromFacts(
        policySet.compiledPolicy,
        policySet.serviceObligationPolicy,
        facts,
      );
      const practiceVisibilityDisposition = practiceVisibilityDispositionFromFacts(
        policySet.practiceVisibilityPolicy,
        facts,
      );
      const capacityAdmissionDisposition = capacityAdmissionDispositionFromFacts(
        policySet.capacityIngestionPolicy,
        normalizedSourceSummary,
        facts,
      );

      const caseHistory = await repositories.listPolicyEvaluationsForCase(command.hubCoordinationCaseId);
      const policyEvaluationId = nextHubPolicyId(idGenerator, "network_coordination_policy_evaluation");
      const policyExceptionBaseCount = 0;
      const exceptions = collectPolicyExceptions({
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        evaluationScope: command.evaluationScope,
        policyTupleHash: policySet.compiledPolicy.policyTupleHash,
        routingDisposition,
        varianceDisposition,
        serviceObligationDisposition,
        practiceVisibilityDisposition,
        capacityAdmissionDisposition,
        tupleDrifted,
        createdAt: evaluatedAt,
        policyEvaluationId,
        existingCount: policyExceptionBaseCount,
        idGenerator,
      });
      const replayFixture = normalizeReplayFixture({
        policyEvaluationReplayFixtureId: nextHubPolicyId(idGenerator, "policy_evaluation_replay_fixture"),
        policyEvaluationRef: policyEvaluationId,
        policyId: policySet.compiledPolicy.policyId,
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        pcnRef,
        evaluationScope: command.evaluationScope,
        presentedPolicyTupleHash,
        facts,
        evaluatedAt,
        version: 1,
      });
      const evaluation = normalizePolicyEvaluation({
        policyEvaluationId,
        hubCoordinationCaseId: command.hubCoordinationCaseId,
        evaluationScope: command.evaluationScope,
        compiledPolicyBundleRef: policySet.compiledPolicy.compiledPolicyBundleRef,
        policyTupleHash: policySet.compiledPolicy.policyTupleHash,
        routingPolicyPackRef: policySet.routingPolicyPack.routingPolicyPackId,
        varianceWindowPolicyRef: policySet.varianceWindowPolicy.varianceWindowPolicyId,
        serviceObligationPolicyRef:
          policySet.serviceObligationPolicy.serviceObligationPolicyId,
        practiceVisibilityPolicyRef:
          policySet.practiceVisibilityPolicy.practiceVisibilityPolicyId,
        capacityIngestionPolicyRef:
          policySet.capacityIngestionPolicy.capacityIngestionPolicyId,
        routingDisposition,
        varianceDisposition,
        serviceObligationDisposition,
        practiceVisibilityDisposition,
        capacityAdmissionDisposition,
        sourceAdmissionSummary: normalizedSourceSummary,
        policyExceptionRefs: exceptions.map((exception) => exception.policyExceptionRecordId),
        replayFixtureRef: replayFixture.policyEvaluationReplayFixtureId,
        evaluatedAt,
        sourceRefs: policySet.compiledPolicy.sourceRefs,
        version: caseHistory.length + 1,
      });

      await repositories.savePolicyEvaluation(evaluation);
      for (const exception of exceptions) {
        await repositories.appendPolicyException(exception);
      }
      await repositories.saveReplayFixture(replayFixture);

      return {
        evaluation,
        exceptions,
        replayFixture,
        compiledPolicy: policySet.compiledPolicy,
        hubCaseBundle,
      };
    },

    async evaluateHubCaseAcrossScopes(command) {
      const results: NetworkPolicyEvaluationResult[] = [];
      for (const evaluationScope of command.evaluationScopes) {
        results.push(
          await this.evaluateHubCaseAgainstPolicy({
            ...command,
            evaluationScope,
          }),
        );
      }
      return results;
    },

    async replayHistoricalEvaluation(command) {
      const originalEvaluationDocument = await repositories.getPolicyEvaluation(command.policyEvaluationId);
      invariant(
        originalEvaluationDocument !== null,
        "POLICY_EVALUATION_NOT_FOUND",
        "NetworkCoordinationPolicyEvaluation not found.",
      );
      const originalEvaluation = originalEvaluationDocument.toSnapshot();
      const replayFixtureDocument = await repositories.getReplayFixtureForEvaluation(
        command.policyEvaluationId,
      );
      invariant(
        replayFixtureDocument !== null,
        "POLICY_REPLAY_FIXTURE_NOT_FOUND",
        "Policy replay fixture not found.",
      );
      const replayFixture = replayFixtureDocument.toSnapshot();
      const replayed = await this.evaluateHubCaseAgainstPolicy({
        hubCoordinationCaseId: replayFixture.hubCoordinationCaseId,
        policyId: replayFixture.policyId,
        pcnRef: replayFixture.pcnRef,
        evaluationScope: replayFixture.evaluationScope,
        evaluatedAt: replayFixture.evaluatedAt,
        presentedPolicyTupleHash: replayFixture.presentedPolicyTupleHash,
        facts: replayFixture.facts,
      });
      const mismatchFields = evaluationMatches(originalEvaluation, replayed.evaluation);
      return {
        ...replayed,
        matchesStoredEvaluation: mismatchFields.length === 0,
        mismatchFields,
        originalEvaluation,
      };
    },

    async resolvePolicyTupleDrift(command) {
      const activePolicySet = await this.loadActivePolicyPacksForScope({
        pcnRef: command.pcnRef,
        asOf: ensureIsoTimestamp(command.asOf, "asOf"),
      });
      return {
        pcnRef: requireRef(command.pcnRef, "pcnRef"),
        boundPolicyTupleHash: requireRef(command.boundPolicyTupleHash, "boundPolicyTupleHash"),
        currentPolicyTupleHash: activePolicySet.compiledPolicy.policyTupleHash,
        driftDisposition:
          command.boundPolicyTupleHash === activePolicySet.compiledPolicy.policyTupleHash
            ? "current"
            : "drifted",
        policyId: activePolicySet.compiledPolicy.policyId,
        asOf: ensureIsoTimestamp(command.asOf, "asOf"),
      };
    },

    async assertPolicyTupleCurrent(command) {
      const result = await this.resolvePolicyTupleDrift(command);
      invariant(
        result.driftDisposition === "current",
        "POLICY_TUPLE_DRIFT",
        "The bound policy tuple is stale.",
      );
      return result;
    },
  };
}

export const PHASE5_ENHANCED_ACCESS_POLICY_SERVICE_NAME =
  "Phase5EnhancedAccessPolicyEngine";
export const PHASE5_ENHANCED_ACCESS_POLICY_SCHEMA_VERSION =
  "317.phase5.enhanced-access-policy-engine.v1";
export const phase5EnhancedAccessPolicyPersistenceTables = [
  "phase5_hub_routing_policy_packs",
  "phase5_hub_variance_window_policies",
  "phase5_hub_service_obligation_policies",
  "phase5_hub_practice_visibility_policies",
  "phase5_hub_capacity_ingestion_policies",
  "phase5_enhanced_access_policies",
  "phase5_enhanced_access_policy_active_bindings",
  "phase5_network_coordination_policy_evaluations",
  "phase5_policy_exception_records",
  "phase5_policy_evaluation_replay_fixtures",
] as const;
export const phase5EnhancedAccessPolicyMigrationPlanRefs = [
  "services/command-api/migrations/143_phase5_hub_case_kernel.sql",
  "services/command-api/migrations/144_phase5_staff_identity_acting_context_visibility.sql",
  "services/command-api/migrations/145_phase5_enhanced_access_policy_engine.sql",
] as const;
