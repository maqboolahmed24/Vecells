import {
  createDeterministicBackboneIdGenerator,
  RequestBackboneInvariantError,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  makeFoundationEvent,
  type SubmissionLineageEventEnvelope,
} from "@vecells/event-contracts";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

function nextCommunicationId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function addSeconds(timestamp: string, seconds: number): string {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}

export const phase1ConfirmationDispatchContractRef =
  "GAP_RESOLVED_PHASE1_CONFIRMATION_COMMUNICATION_CHAIN_V1";
export const phase1ConfirmationReceiptBridgeContractRef =
  "GAP_RESOLVED_PHASE1_CONFIRMATION_RECEIPT_BRIDGE_V1";
export const phase1ConfirmationTelemetryContractRef =
  "GAP_RESOLVED_PHASE1_CONFIRMATION_OBSERVABILITY_V1";

export type Phase1ConfirmationPreferredChannel = "sms" | "email";
export type Phase1ConfirmationDispatchEligibilityState = "dispatchable" | "blocked_route_truth";
export type Phase1ConfirmationQueueState =
  | "queued"
  | "dispatching"
  | "delivery_pending"
  | "delivered"
  | "failed"
  | "disputed"
  | "expired";
export type Phase1ConfirmationTransportAckState =
  | "not_started"
  | "accepted"
  | "rejected"
  | "timed_out";
export type Phase1ConfirmationDeliveryEvidenceState =
  | "pending"
  | "delivered"
  | "failed"
  | "disputed"
  | "expired";
export type Phase1ConfirmationAuthoritativeOutcomeState =
  | "awaiting_delivery_truth"
  | "delivery_confirmed"
  | "recovery_required";
export type Phase1ConfirmationPatientPostureState =
  | "queued"
  | "delivery_pending"
  | "delivered"
  | "recovery_required";
export type Phase1ConfirmationRouteAuthorityState =
  | "current"
  | "stale_verification"
  | "stale_demographics"
  | "stale_preferences"
  | "disputed"
  | "superseded"
  | "unknown";
export type Phase1ConfirmationReachabilityAssessmentState =
  | "clear"
  | "at_risk"
  | "blocked"
  | "disputed"
  | "unknown";
export type Phase1ConfirmationDeliveryRiskState =
  | "on_track"
  | "at_risk"
  | "likely_failed"
  | "disputed"
  | "unknown";
export type Phase1ConfirmationTransportOutcome = "accepted" | "rejected" | "timed_out";
export type Phase1NotificationProviderMode = "simulator" | "shadow" | "hybrid";
export type Phase1DeliveryEvidenceSource =
  | "simulator_delivery_webhook"
  | "provider_delivery_webhook"
  | "provider_callback"
  | "manual_review"
  | "system_expiry";

export interface Phase1ConfirmationCommunicationEnvelopeSnapshot {
  communicationEnvelopeSchemaVersion: "PHASE1_CONFIRMATION_COMMUNICATION_ENVELOPE_V1";
  communicationEnvelopeId: string;
  queueScopeRef: string;
  dispatchContractRef: typeof phase1ConfirmationDispatchContractRef;
  enqueueIdempotencyKey: string;
  requestRef: string;
  requestLineageRef: string;
  triageTaskRef: string;
  receiptEnvelopeRef: string;
  outcomeArtifactRef: string;
  contactPreferencesRef: string | null;
  routeSnapshotSeedRef: string | null;
  currentContactRouteSnapshotRef: string | null;
  currentReachabilityAssessmentRef: string | null;
  reachabilityDependencyRef: string | null;
  preferredChannel: Phase1ConfirmationPreferredChannel;
  maskedDestination: string;
  templateVariantRef: string;
  localAckState: "queued";
  dispatchEligibilityState: Phase1ConfirmationDispatchEligibilityState;
  queueState: Phase1ConfirmationQueueState;
  transportAckState: Phase1ConfirmationTransportAckState;
  deliveryEvidenceState: Phase1ConfirmationDeliveryEvidenceState;
  authoritativeOutcomeState: Phase1ConfirmationAuthoritativeOutcomeState;
  routeAuthorityState: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState: Phase1ConfirmationDeliveryRiskState;
  latestTransportSettlementRef: string | null;
  latestDeliveryEvidenceRef: string | null;
  lastProviderCorrelationRef: string | null;
  dispatchAttemptCount: number;
  nextAttemptNotBeforeAt: string | null;
  terminalAt: string | null;
  reasonCodes: readonly string[];
  monotoneRevision: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedPhase1ConfirmationCommunicationEnvelopeRow
  extends Phase1ConfirmationCommunicationEnvelopeSnapshot {
  aggregateType: "Phase1ConfirmationCommunicationEnvelope";
  persistenceSchemaVersion: 1;
}

export class Phase1ConfirmationCommunicationEnvelopeDocument {
  private readonly snapshot: Phase1ConfirmationCommunicationEnvelopeSnapshot;

  private constructor(snapshot: Phase1ConfirmationCommunicationEnvelopeSnapshot) {
    this.snapshot = Phase1ConfirmationCommunicationEnvelopeDocument.normalize(snapshot);
  }

  static create(
    input: Omit<Phase1ConfirmationCommunicationEnvelopeSnapshot, "version">,
  ): Phase1ConfirmationCommunicationEnvelopeDocument {
    return new Phase1ConfirmationCommunicationEnvelopeDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: Phase1ConfirmationCommunicationEnvelopeSnapshot,
  ): Phase1ConfirmationCommunicationEnvelopeDocument {
    return new Phase1ConfirmationCommunicationEnvelopeDocument(snapshot);
  }

  private static normalize(
    snapshot: Phase1ConfirmationCommunicationEnvelopeSnapshot,
  ): Phase1ConfirmationCommunicationEnvelopeSnapshot {
    invariant(
      snapshot.dispatchAttemptCount >= 0,
      "DISPATCH_ATTEMPT_COUNT_INVALID",
      "dispatchAttemptCount must be non-negative.",
    );
    invariant(
      snapshot.monotoneRevision >= 1,
      "MONOTONE_REVISION_INVALID",
      "monotoneRevision must be >= 1.",
    );
    return {
      ...snapshot,
      communicationEnvelopeId: requireRef(snapshot.communicationEnvelopeId, "communicationEnvelopeId"),
      queueScopeRef: requireRef(snapshot.queueScopeRef, "queueScopeRef"),
      enqueueIdempotencyKey: requireRef(snapshot.enqueueIdempotencyKey, "enqueueIdempotencyKey"),
      requestRef: requireRef(snapshot.requestRef, "requestRef"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      triageTaskRef: requireRef(snapshot.triageTaskRef, "triageTaskRef"),
      receiptEnvelopeRef: requireRef(snapshot.receiptEnvelopeRef, "receiptEnvelopeRef"),
      outcomeArtifactRef: requireRef(snapshot.outcomeArtifactRef, "outcomeArtifactRef"),
      contactPreferencesRef: optionalRef(snapshot.contactPreferencesRef),
      routeSnapshotSeedRef: optionalRef(snapshot.routeSnapshotSeedRef),
      currentContactRouteSnapshotRef: optionalRef(snapshot.currentContactRouteSnapshotRef),
      currentReachabilityAssessmentRef: optionalRef(snapshot.currentReachabilityAssessmentRef),
      reachabilityDependencyRef: optionalRef(snapshot.reachabilityDependencyRef),
      maskedDestination: requireRef(snapshot.maskedDestination, "maskedDestination"),
      templateVariantRef: requireRef(snapshot.templateVariantRef, "templateVariantRef"),
      latestTransportSettlementRef: optionalRef(snapshot.latestTransportSettlementRef),
      latestDeliveryEvidenceRef: optionalRef(snapshot.latestDeliveryEvidenceRef),
      lastProviderCorrelationRef: optionalRef(snapshot.lastProviderCorrelationRef),
      nextAttemptNotBeforeAt: optionalRef(snapshot.nextAttemptNotBeforeAt),
      terminalAt: optionalRef(snapshot.terminalAt),
      reasonCodes: uniqueSorted(snapshot.reasonCodes),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
  }

  get communicationEnvelopeId(): string {
    return this.snapshot.communicationEnvelopeId;
  }

  get enqueueIdempotencyKey(): string {
    return this.snapshot.enqueueIdempotencyKey;
  }

  get queueScopeRef(): string {
    return this.snapshot.queueScopeRef;
  }

  get queueState(): Phase1ConfirmationQueueState {
    return this.snapshot.queueState;
  }

  get transportAckState(): Phase1ConfirmationTransportAckState {
    return this.snapshot.transportAckState;
  }

  get deliveryEvidenceState(): Phase1ConfirmationDeliveryEvidenceState {
    return this.snapshot.deliveryEvidenceState;
  }

  get authoritativeOutcomeState(): Phase1ConfirmationAuthoritativeOutcomeState {
    return this.snapshot.authoritativeOutcomeState;
  }

  get dispatchEligibilityState(): Phase1ConfirmationDispatchEligibilityState {
    return this.snapshot.dispatchEligibilityState;
  }

  get dispatchAttemptCount(): number {
    return this.snapshot.dispatchAttemptCount;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): Phase1ConfirmationCommunicationEnvelopeSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface Phase1ConfirmationTransportSettlementSnapshot {
  transportSettlementSchemaVersion: "PHASE1_CONFIRMATION_TRANSPORT_SETTLEMENT_V1";
  transportSettlementId: string;
  communicationEnvelopeRef: string;
  queueScopeRef: string;
  attemptNumber: number;
  workerRunRef: string;
  transportSettlementKey: string;
  providerMode: Phase1NotificationProviderMode;
  providerCorrelationRef: string | null;
  processingAcceptanceState:
    | "accepted_for_processing"
    | "externally_accepted"
    | "externally_rejected"
    | "timed_out";
  outcome: Phase1ConfirmationTransportOutcome;
  reasonCodes: readonly string[];
  recordedAt: string;
  version: number;
}

export interface PersistedPhase1ConfirmationTransportSettlementRow
  extends Phase1ConfirmationTransportSettlementSnapshot {
  aggregateType: "Phase1ConfirmationTransportSettlement";
  persistenceSchemaVersion: 1;
}

export class Phase1ConfirmationTransportSettlementDocument {
  private readonly snapshot: Phase1ConfirmationTransportSettlementSnapshot;

  private constructor(snapshot: Phase1ConfirmationTransportSettlementSnapshot) {
    this.snapshot = Phase1ConfirmationTransportSettlementDocument.normalize(snapshot);
  }

  static create(
    input: Omit<Phase1ConfirmationTransportSettlementSnapshot, "version">,
  ): Phase1ConfirmationTransportSettlementDocument {
    return new Phase1ConfirmationTransportSettlementDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: Phase1ConfirmationTransportSettlementSnapshot,
  ): Phase1ConfirmationTransportSettlementDocument {
    return new Phase1ConfirmationTransportSettlementDocument(snapshot);
  }

  private static normalize(
    snapshot: Phase1ConfirmationTransportSettlementSnapshot,
  ): Phase1ConfirmationTransportSettlementSnapshot {
    invariant(
      snapshot.attemptNumber >= 1,
      "TRANSPORT_ATTEMPT_NUMBER_INVALID",
      "attemptNumber must be >= 1.",
    );
    return {
      ...snapshot,
      transportSettlementId: requireRef(snapshot.transportSettlementId, "transportSettlementId"),
      communicationEnvelopeRef: requireRef(
        snapshot.communicationEnvelopeRef,
        "communicationEnvelopeRef",
      ),
      queueScopeRef: requireRef(snapshot.queueScopeRef, "queueScopeRef"),
      workerRunRef: requireRef(snapshot.workerRunRef, "workerRunRef"),
      transportSettlementKey: requireRef(snapshot.transportSettlementKey, "transportSettlementKey"),
      providerCorrelationRef: optionalRef(snapshot.providerCorrelationRef),
      reasonCodes: uniqueSorted(snapshot.reasonCodes),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }

  get transportSettlementId(): string {
    return this.snapshot.transportSettlementId;
  }

  get transportSettlementKey(): string {
    return this.snapshot.transportSettlementKey;
  }

  get communicationEnvelopeRef(): string {
    return this.snapshot.communicationEnvelopeRef;
  }

  toSnapshot(): Phase1ConfirmationTransportSettlementSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface Phase1ConfirmationDeliveryEvidenceSnapshot {
  deliveryEvidenceSchemaVersion: "PHASE1_CONFIRMATION_DELIVERY_EVIDENCE_V1";
  deliveryEvidenceId: string;
  communicationEnvelopeRef: string;
  queueScopeRef: string;
  deliveryEvidenceKey: string;
  evidenceSource: Phase1DeliveryEvidenceSource;
  providerCorrelationRef: string | null;
  deliveryEvidenceState: Phase1ConfirmationDeliveryEvidenceState;
  reasonCodes: readonly string[];
  observedAt: string;
  recordedAt: string;
  supersedesDeliveryEvidenceRef: string | null;
  version: number;
}

export interface PersistedPhase1ConfirmationDeliveryEvidenceRow
  extends Phase1ConfirmationDeliveryEvidenceSnapshot {
  aggregateType: "Phase1ConfirmationDeliveryEvidence";
  persistenceSchemaVersion: 1;
}

export class Phase1ConfirmationDeliveryEvidenceDocument {
  private readonly snapshot: Phase1ConfirmationDeliveryEvidenceSnapshot;

  private constructor(snapshot: Phase1ConfirmationDeliveryEvidenceSnapshot) {
    this.snapshot = Phase1ConfirmationDeliveryEvidenceDocument.normalize(snapshot);
  }

  static create(
    input: Omit<Phase1ConfirmationDeliveryEvidenceSnapshot, "version">,
  ): Phase1ConfirmationDeliveryEvidenceDocument {
    return new Phase1ConfirmationDeliveryEvidenceDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: Phase1ConfirmationDeliveryEvidenceSnapshot,
  ): Phase1ConfirmationDeliveryEvidenceDocument {
    return new Phase1ConfirmationDeliveryEvidenceDocument(snapshot);
  }

  private static normalize(
    snapshot: Phase1ConfirmationDeliveryEvidenceSnapshot,
  ): Phase1ConfirmationDeliveryEvidenceSnapshot {
    return {
      ...snapshot,
      deliveryEvidenceId: requireRef(snapshot.deliveryEvidenceId, "deliveryEvidenceId"),
      communicationEnvelopeRef: requireRef(
        snapshot.communicationEnvelopeRef,
        "communicationEnvelopeRef",
      ),
      queueScopeRef: requireRef(snapshot.queueScopeRef, "queueScopeRef"),
      deliveryEvidenceKey: requireRef(snapshot.deliveryEvidenceKey, "deliveryEvidenceKey"),
      providerCorrelationRef: optionalRef(snapshot.providerCorrelationRef),
      reasonCodes: uniqueSorted(snapshot.reasonCodes),
      observedAt: ensureIsoTimestamp(snapshot.observedAt, "observedAt"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
      supersedesDeliveryEvidenceRef: optionalRef(snapshot.supersedesDeliveryEvidenceRef),
    };
  }

  get deliveryEvidenceId(): string {
    return this.snapshot.deliveryEvidenceId;
  }

  get deliveryEvidenceKey(): string {
    return this.snapshot.deliveryEvidenceKey;
  }

  get communicationEnvelopeRef(): string {
    return this.snapshot.communicationEnvelopeRef;
  }

  toSnapshot(): Phase1ConfirmationDeliveryEvidenceSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface Phase1ConfirmationReceiptBridgeSnapshot {
  receiptBridgeSchemaVersion: "PHASE1_CONFIRMATION_RECEIPT_BRIDGE_V1";
  receiptBridgeId: string;
  communicationEnvelopeRef: string;
  requestRef: string;
  receiptEnvelopeRef: string;
  localAckState: "queued";
  transportAckState: Phase1ConfirmationTransportAckState;
  deliveryEvidenceState: Phase1ConfirmationDeliveryEvidenceState;
  authoritativeOutcomeState: Phase1ConfirmationAuthoritativeOutcomeState;
  patientPostureState: Phase1ConfirmationPatientPostureState;
  dispatchEligibilityState: Phase1ConfirmationDispatchEligibilityState;
  routeAuthorityState: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState: Phase1ConfirmationDeliveryRiskState;
  reasonCodes: readonly string[];
  monotoneRevision: number;
  updatedAt: string;
  version: number;
}

export interface PersistedPhase1ConfirmationReceiptBridgeRow
  extends Phase1ConfirmationReceiptBridgeSnapshot {
  aggregateType: "Phase1ConfirmationReceiptBridge";
  persistenceSchemaVersion: 1;
}

export class Phase1ConfirmationReceiptBridgeDocument {
  private readonly snapshot: Phase1ConfirmationReceiptBridgeSnapshot;

  private constructor(snapshot: Phase1ConfirmationReceiptBridgeSnapshot) {
    this.snapshot = Phase1ConfirmationReceiptBridgeDocument.normalize(snapshot);
  }

  static create(
    input: Omit<Phase1ConfirmationReceiptBridgeSnapshot, "version">,
  ): Phase1ConfirmationReceiptBridgeDocument {
    return new Phase1ConfirmationReceiptBridgeDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: Phase1ConfirmationReceiptBridgeSnapshot,
  ): Phase1ConfirmationReceiptBridgeDocument {
    return new Phase1ConfirmationReceiptBridgeDocument(snapshot);
  }

  private static normalize(
    snapshot: Phase1ConfirmationReceiptBridgeSnapshot,
  ): Phase1ConfirmationReceiptBridgeSnapshot {
    invariant(
      snapshot.monotoneRevision >= 1,
      "RECEIPT_BRIDGE_REVISION_INVALID",
      "monotoneRevision must be >= 1.",
    );
    return {
      ...snapshot,
      receiptBridgeId: requireRef(snapshot.receiptBridgeId, "receiptBridgeId"),
      communicationEnvelopeRef: requireRef(
        snapshot.communicationEnvelopeRef,
        "communicationEnvelopeRef",
      ),
      requestRef: requireRef(snapshot.requestRef, "requestRef"),
      receiptEnvelopeRef: requireRef(snapshot.receiptEnvelopeRef, "receiptEnvelopeRef"),
      reasonCodes: uniqueSorted(snapshot.reasonCodes),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
  }

  get receiptBridgeId(): string {
    return this.snapshot.receiptBridgeId;
  }

  get communicationEnvelopeRef(): string {
    return this.snapshot.communicationEnvelopeRef;
  }

  get authoritativeOutcomeState(): Phase1ConfirmationAuthoritativeOutcomeState {
    return this.snapshot.authoritativeOutcomeState;
  }

  get patientPostureState(): Phase1ConfirmationPatientPostureState {
    return this.snapshot.patientPostureState;
  }

  toSnapshot(): Phase1ConfirmationReceiptBridgeSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface Phase1NotificationMetricsSnapshot {
  metricsSchemaVersion: "PHASE1_CONFIRMATION_NOTIFICATION_METRICS_V1";
  snapshotGeneratedAt: string;
  queuedCount: number;
  blockedRouteTruthCount: number;
  deliveryPendingCount: number;
  deliveredCount: number;
  failureCount: number;
  disputedCount: number;
  expiredCount: number;
  providerAcceptanceRate: number;
  deliveryEvidenceRate: number;
  bounceFailureRate: number;
  queueDepth: number;
  queueBlockageCount: number;
  endToEndConfirmationLatencyP95Ms: number;
  receiptRecoveryRequiredCount: number;
}

export interface Phase1ConfirmationDispatchRepositories {
  getCommunicationEnvelope(
    communicationEnvelopeId: string,
  ): Promise<Phase1ConfirmationCommunicationEnvelopeDocument | undefined>;
  findCommunicationEnvelopeByIdempotencyKey(
    enqueueIdempotencyKey: string,
  ): Promise<Phase1ConfirmationCommunicationEnvelopeDocument | undefined>;
  listCommunicationEnvelopes(): Promise<readonly Phase1ConfirmationCommunicationEnvelopeDocument[]>;
  saveCommunicationEnvelope(
    envelope: Phase1ConfirmationCommunicationEnvelopeDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getTransportSettlement(
    transportSettlementId: string,
  ): Promise<Phase1ConfirmationTransportSettlementDocument | undefined>;
  findTransportSettlementByKey(
    transportSettlementKey: string,
  ): Promise<Phase1ConfirmationTransportSettlementDocument | undefined>;
  listTransportSettlementsForEnvelope(
    communicationEnvelopeRef: string,
  ): Promise<readonly Phase1ConfirmationTransportSettlementDocument[]>;
  saveTransportSettlement(
    settlement: Phase1ConfirmationTransportSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDeliveryEvidence(
    deliveryEvidenceId: string,
  ): Promise<Phase1ConfirmationDeliveryEvidenceDocument | undefined>;
  findDeliveryEvidenceByKey(
    deliveryEvidenceKey: string,
  ): Promise<Phase1ConfirmationDeliveryEvidenceDocument | undefined>;
  listDeliveryEvidenceForEnvelope(
    communicationEnvelopeRef: string,
  ): Promise<readonly Phase1ConfirmationDeliveryEvidenceDocument[]>;
  saveDeliveryEvidence(
    evidence: Phase1ConfirmationDeliveryEvidenceDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getReceiptBridge(
    receiptBridgeId: string,
  ): Promise<Phase1ConfirmationReceiptBridgeDocument | undefined>;
  findReceiptBridgeByCommunicationEnvelope(
    communicationEnvelopeRef: string,
  ): Promise<Phase1ConfirmationReceiptBridgeDocument | undefined>;
  listReceiptBridges(): Promise<readonly Phase1ConfirmationReceiptBridgeDocument[]>;
  saveReceiptBridge(
    bridge: Phase1ConfirmationReceiptBridgeDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

class InMemoryPhase1ConfirmationDispatchStore implements Phase1ConfirmationDispatchRepositories {
  private readonly envelopes = new Map<string, PersistedPhase1ConfirmationCommunicationEnvelopeRow>();
  private readonly envelopeByIdempotencyKey = new Map<string, string>();
  private readonly transportSettlements =
    new Map<string, PersistedPhase1ConfirmationTransportSettlementRow>();
  private readonly transportSettlementByKey = new Map<string, string>();
  private readonly transportByEnvelope = new Map<string, string[]>();
  private readonly deliveryEvidence =
    new Map<string, PersistedPhase1ConfirmationDeliveryEvidenceRow>();
  private readonly deliveryEvidenceByKey = new Map<string, string>();
  private readonly deliveryEvidenceByEnvelope = new Map<string, string[]>();
  private readonly receiptBridges = new Map<string, PersistedPhase1ConfirmationReceiptBridgeRow>();
  private readonly receiptBridgeByEnvelope = new Map<string, string>();

  async getCommunicationEnvelope(communicationEnvelopeId: string) {
    const row = this.envelopes.get(communicationEnvelopeId);
    return row ? Phase1ConfirmationCommunicationEnvelopeDocument.hydrate(row) : undefined;
  }

  async findCommunicationEnvelopeByIdempotencyKey(enqueueIdempotencyKey: string) {
    const id = this.envelopeByIdempotencyKey.get(enqueueIdempotencyKey);
    return id ? this.getCommunicationEnvelope(id) : undefined;
  }

  async listCommunicationEnvelopes() {
    return [...this.envelopes.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => Phase1ConfirmationCommunicationEnvelopeDocument.hydrate(row));
  }

  async saveCommunicationEnvelope(
    envelope: Phase1ConfirmationCommunicationEnvelopeDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = envelope.toSnapshot();
    saveWithCas(this.envelopes, snapshot.communicationEnvelopeId, {
      ...snapshot,
      aggregateType: "Phase1ConfirmationCommunicationEnvelope",
      persistenceSchemaVersion: 1,
    }, options);
    this.envelopeByIdempotencyKey.set(snapshot.enqueueIdempotencyKey, snapshot.communicationEnvelopeId);
  }

  async getTransportSettlement(transportSettlementId: string) {
    const row = this.transportSettlements.get(transportSettlementId);
    return row ? Phase1ConfirmationTransportSettlementDocument.hydrate(row) : undefined;
  }

  async findTransportSettlementByKey(transportSettlementKey: string) {
    const id = this.transportSettlementByKey.get(transportSettlementKey);
    return id ? this.getTransportSettlement(id) : undefined;
  }

  async listTransportSettlementsForEnvelope(communicationEnvelopeRef: string) {
    return (this.transportByEnvelope.get(communicationEnvelopeRef) ?? [])
      .map((id) => this.transportSettlements.get(id))
      .filter((row): row is PersistedPhase1ConfirmationTransportSettlementRow => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => Phase1ConfirmationTransportSettlementDocument.hydrate(row));
  }

  async saveTransportSettlement(
    settlement: Phase1ConfirmationTransportSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = settlement.toSnapshot();
    saveWithCas(this.transportSettlements, snapshot.transportSettlementId, {
      ...snapshot,
      aggregateType: "Phase1ConfirmationTransportSettlement",
      persistenceSchemaVersion: 1,
    }, options);
    this.transportSettlementByKey.set(snapshot.transportSettlementKey, snapshot.transportSettlementId);
    const current = this.transportByEnvelope.get(snapshot.communicationEnvelopeRef) ?? [];
    if (!current.includes(snapshot.transportSettlementId)) {
      current.push(snapshot.transportSettlementId);
      this.transportByEnvelope.set(snapshot.communicationEnvelopeRef, current);
    }
  }

  async getDeliveryEvidence(deliveryEvidenceId: string) {
    const row = this.deliveryEvidence.get(deliveryEvidenceId);
    return row ? Phase1ConfirmationDeliveryEvidenceDocument.hydrate(row) : undefined;
  }

  async findDeliveryEvidenceByKey(deliveryEvidenceKey: string) {
    const id = this.deliveryEvidenceByKey.get(deliveryEvidenceKey);
    return id ? this.getDeliveryEvidence(id) : undefined;
  }

  async listDeliveryEvidenceForEnvelope(communicationEnvelopeRef: string) {
    return (this.deliveryEvidenceByEnvelope.get(communicationEnvelopeRef) ?? [])
      .map((id) => this.deliveryEvidence.get(id))
      .filter((row): row is PersistedPhase1ConfirmationDeliveryEvidenceRow => row !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => Phase1ConfirmationDeliveryEvidenceDocument.hydrate(row));
  }

  async saveDeliveryEvidence(
    evidence: Phase1ConfirmationDeliveryEvidenceDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = evidence.toSnapshot();
    saveWithCas(this.deliveryEvidence, snapshot.deliveryEvidenceId, {
      ...snapshot,
      aggregateType: "Phase1ConfirmationDeliveryEvidence",
      persistenceSchemaVersion: 1,
    }, options);
    this.deliveryEvidenceByKey.set(snapshot.deliveryEvidenceKey, snapshot.deliveryEvidenceId);
    const current = this.deliveryEvidenceByEnvelope.get(snapshot.communicationEnvelopeRef) ?? [];
    if (!current.includes(snapshot.deliveryEvidenceId)) {
      current.push(snapshot.deliveryEvidenceId);
      this.deliveryEvidenceByEnvelope.set(snapshot.communicationEnvelopeRef, current);
    }
  }

  async getReceiptBridge(receiptBridgeId: string) {
    const row = this.receiptBridges.get(receiptBridgeId);
    return row ? Phase1ConfirmationReceiptBridgeDocument.hydrate(row) : undefined;
  }

  async findReceiptBridgeByCommunicationEnvelope(communicationEnvelopeRef: string) {
    const id = this.receiptBridgeByEnvelope.get(communicationEnvelopeRef);
    return id ? this.getReceiptBridge(id) : undefined;
  }

  async listReceiptBridges() {
    return [...this.receiptBridges.values()]
      .sort((left, right) => compareIso(left.updatedAt, right.updatedAt))
      .map((row) => Phase1ConfirmationReceiptBridgeDocument.hydrate(row));
  }

  async saveReceiptBridge(
    bridge: Phase1ConfirmationReceiptBridgeDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = bridge.toSnapshot();
    saveWithCas(this.receiptBridges, snapshot.receiptBridgeId, {
      ...snapshot,
      aggregateType: "Phase1ConfirmationReceiptBridge",
      persistenceSchemaVersion: 1,
    }, options);
    this.receiptBridgeByEnvelope.set(snapshot.communicationEnvelopeRef, snapshot.receiptBridgeId);
  }
}

export function createPhase1ConfirmationDispatchStore(): Phase1ConfirmationDispatchRepositories {
  return new InMemoryPhase1ConfirmationDispatchStore();
}

function deriveDispatchEligibilityState(input: {
  routeAuthorityState: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState: Phase1ConfirmationDeliveryRiskState;
}): Phase1ConfirmationDispatchEligibilityState {
  if (
    input.routeAuthorityState !== "current" ||
    input.reachabilityAssessmentState === "blocked" ||
    input.reachabilityAssessmentState === "disputed" ||
    input.deliveryRiskState === "likely_failed" ||
    input.deliveryRiskState === "disputed"
  ) {
    return "blocked_route_truth";
  }
  return "dispatchable";
}

function deriveInitialReasonCodes(input: {
  dispatchEligibilityState: Phase1ConfirmationDispatchEligibilityState;
  routeAuthorityState: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState: Phase1ConfirmationDeliveryRiskState;
}): string[] {
  if (input.dispatchEligibilityState === "dispatchable") {
    return [];
  }
  return uniqueSorted([
    `ROUTE_AUTHORITY_${input.routeAuthorityState.toUpperCase()}`,
    `REACHABILITY_${input.reachabilityAssessmentState.toUpperCase()}`,
    `DELIVERY_RISK_${input.deliveryRiskState.toUpperCase()}`,
    "ROUTE_TRUTH_BLOCKS_DISPATCH",
  ]);
}

function derivePatientPostureState(input: {
  authoritativeOutcomeState: Phase1ConfirmationAuthoritativeOutcomeState;
  transportAckState: Phase1ConfirmationTransportAckState;
  deliveryEvidenceState: Phase1ConfirmationDeliveryEvidenceState;
}): Phase1ConfirmationPatientPostureState {
  if (input.authoritativeOutcomeState === "delivery_confirmed") {
    return "delivered";
  }
  if (input.authoritativeOutcomeState === "recovery_required") {
    return "recovery_required";
  }
  if (input.transportAckState === "accepted" || input.deliveryEvidenceState === "pending") {
    return "delivery_pending";
  }
  return "queued";
}

function mapTransportOutcomeToAcceptanceState(
  outcome: Phase1ConfirmationTransportOutcome,
): Phase1ConfirmationTransportSettlementSnapshot["processingAcceptanceState"] {
  if (outcome === "accepted") {
    return "externally_accepted";
  }
  if (outcome === "rejected") {
    return "externally_rejected";
  }
  return "timed_out";
}

export interface QueuePhase1ConfirmationCommunicationInput {
  requestRef: string;
  requestLineageRef: string;
  triageTaskRef: string;
  receiptEnvelopeRef: string;
  outcomeArtifactRef: string;
  contactPreferencesRef?: string | null;
  routeSnapshotSeedRef?: string | null;
  currentContactRouteSnapshotRef?: string | null;
  currentReachabilityAssessmentRef?: string | null;
  reachabilityDependencyRef?: string | null;
  preferredChannel: Phase1ConfirmationPreferredChannel;
  maskedDestination: string;
  templateVariantRef: string;
  routeAuthorityState?: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState?: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState?: Phase1ConfirmationDeliveryRiskState;
  enqueueIdempotencyKey: string;
  queuedAt: string;
}

export interface QueuePhase1ConfirmationCommunicationResult {
  replayed: boolean;
  envelope: Phase1ConfirmationCommunicationEnvelopeDocument;
  receiptBridge: Phase1ConfirmationReceiptBridgeDocument;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface DispatchQueuedConfirmationInput {
  communicationEnvelopeRef: string;
  transportSettlementKey: string;
  workerRunRef: string;
  providerMode: Phase1NotificationProviderMode;
  transportOutcome: Phase1ConfirmationTransportOutcome;
  providerCorrelationRef?: string | null;
  recordedAt: string;
  maxAttempts?: number;
  backoffSeconds?: readonly number[];
}

export interface DispatchQueuedConfirmationResult {
  replayed: boolean;
  skipped: boolean;
  envelope: Phase1ConfirmationCommunicationEnvelopeDocument;
  receiptBridge: Phase1ConfirmationReceiptBridgeDocument;
  transportSettlement: Phase1ConfirmationTransportSettlementDocument | null;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface RecordPhase1DeliveryEvidenceInput {
  communicationEnvelopeRef: string;
  deliveryEvidenceKey: string;
  evidenceSource: Phase1DeliveryEvidenceSource;
  providerCorrelationRef?: string | null;
  deliveryEvidenceState: Phase1ConfirmationDeliveryEvidenceState;
  observedAt: string;
  recordedAt: string;
}

export interface RecordPhase1DeliveryEvidenceResult {
  replayed: boolean;
  envelope: Phase1ConfirmationCommunicationEnvelopeDocument;
  receiptBridge: Phase1ConfirmationReceiptBridgeDocument;
  deliveryEvidence: Phase1ConfirmationDeliveryEvidenceDocument;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface RefreshPhase1ConfirmationRouteTruthInput {
  communicationEnvelopeRef: string;
  currentContactRouteSnapshotRef?: string | null;
  currentReachabilityAssessmentRef?: string | null;
  routeAuthorityState: Phase1ConfirmationRouteAuthorityState;
  reachabilityAssessmentState: Phase1ConfirmationReachabilityAssessmentState;
  deliveryRiskState: Phase1ConfirmationDeliveryRiskState;
  recordedAt: string;
  reasonCodes?: readonly string[];
}

export interface Phase1ConfirmationDispatchService {
  readonly repositories: Phase1ConfirmationDispatchRepositories;
  queueConfirmationCommunication(
    input: QueuePhase1ConfirmationCommunicationInput,
  ): Promise<QueuePhase1ConfirmationCommunicationResult>;
  dispatchQueuedConfirmation(
    input: DispatchQueuedConfirmationInput,
  ): Promise<DispatchQueuedConfirmationResult>;
  recordDeliveryEvidence(
    input: RecordPhase1DeliveryEvidenceInput,
  ): Promise<RecordPhase1DeliveryEvidenceResult>;
  refreshRouteTruth(
    input: RefreshPhase1ConfirmationRouteTruthInput,
  ): Promise<{
    envelope: Phase1ConfirmationCommunicationEnvelopeDocument;
    receiptBridge: Phase1ConfirmationReceiptBridgeDocument;
  }>;
  getCommunicationEnvelope(
    communicationEnvelopeId: string,
  ): Promise<Phase1ConfirmationCommunicationEnvelopeDocument | undefined>;
  getReceiptBridgeForCommunicationEnvelope(
    communicationEnvelopeRef: string,
  ): Promise<Phase1ConfirmationReceiptBridgeDocument | undefined>;
  listDispatchReady(now: string, limit?: number): Promise<readonly Phase1ConfirmationCommunicationEnvelopeDocument[]>;
  buildMetricsSnapshot(now: string): Promise<Phase1NotificationMetricsSnapshot>;
}

export class InMemoryPhase1ConfirmationDispatchService
  implements Phase1ConfirmationDispatchService
{
  readonly repositories: Phase1ConfirmationDispatchRepositories;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    repositories: Phase1ConfirmationDispatchRepositories,
    idGenerator: BackboneIdGenerator,
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  async queueConfirmationCommunication(
    input: QueuePhase1ConfirmationCommunicationInput,
  ): Promise<QueuePhase1ConfirmationCommunicationResult> {
    const existing = await this.repositories.findCommunicationEnvelopeByIdempotencyKey(
      input.enqueueIdempotencyKey,
    );
    if (existing) {
      const bridge = await this.requireReceiptBridge(existing.communicationEnvelopeId);
      return {
        replayed: true,
        envelope: existing,
        receiptBridge: bridge,
        events: [],
      };
    }

    const routeAuthorityState = input.routeAuthorityState ?? "unknown";
    const reachabilityAssessmentState = input.reachabilityAssessmentState ?? "unknown";
    const deliveryRiskState = input.deliveryRiskState ?? "unknown";
    const dispatchEligibilityState = deriveDispatchEligibilityState({
      routeAuthorityState,
      reachabilityAssessmentState,
      deliveryRiskState,
    });
    const reasonCodes = deriveInitialReasonCodes({
      dispatchEligibilityState,
      routeAuthorityState,
      reachabilityAssessmentState,
      deliveryRiskState,
    });

    const queueScopeRef = `${input.requestRef}::${input.receiptEnvelopeRef}`;
    const communicationEnvelope = Phase1ConfirmationCommunicationEnvelopeDocument.create({
      communicationEnvelopeSchemaVersion: "PHASE1_CONFIRMATION_COMMUNICATION_ENVELOPE_V1",
      communicationEnvelopeId: nextCommunicationId(this.idGenerator, "confirmationCommunicationEnvelope"),
      queueScopeRef,
      dispatchContractRef: phase1ConfirmationDispatchContractRef,
      enqueueIdempotencyKey: input.enqueueIdempotencyKey,
      requestRef: input.requestRef,
      requestLineageRef: input.requestLineageRef,
      triageTaskRef: input.triageTaskRef,
      receiptEnvelopeRef: input.receiptEnvelopeRef,
      outcomeArtifactRef: input.outcomeArtifactRef,
      contactPreferencesRef: input.contactPreferencesRef ?? null,
      routeSnapshotSeedRef: input.routeSnapshotSeedRef ?? null,
      currentContactRouteSnapshotRef: input.currentContactRouteSnapshotRef ?? null,
      currentReachabilityAssessmentRef: input.currentReachabilityAssessmentRef ?? null,
      reachabilityDependencyRef: input.reachabilityDependencyRef ?? null,
      preferredChannel: input.preferredChannel,
      maskedDestination: input.maskedDestination,
      templateVariantRef: input.templateVariantRef,
      localAckState: "queued",
      dispatchEligibilityState,
      queueState: "queued",
      transportAckState: "not_started",
      deliveryEvidenceState: "pending",
      authoritativeOutcomeState:
        dispatchEligibilityState === "dispatchable"
          ? "awaiting_delivery_truth"
          : "recovery_required",
      routeAuthorityState,
      reachabilityAssessmentState,
      deliveryRiskState,
      latestTransportSettlementRef: null,
      latestDeliveryEvidenceRef: null,
      lastProviderCorrelationRef: null,
      dispatchAttemptCount: 0,
      nextAttemptNotBeforeAt: input.queuedAt,
      terminalAt: null,
      reasonCodes,
      monotoneRevision: 1,
      createdAt: input.queuedAt,
      updatedAt: input.queuedAt,
    });
    const receiptBridge = Phase1ConfirmationReceiptBridgeDocument.create({
      receiptBridgeSchemaVersion: "PHASE1_CONFIRMATION_RECEIPT_BRIDGE_V1",
      receiptBridgeId: nextCommunicationId(this.idGenerator, "confirmationReceiptBridge"),
      communicationEnvelopeRef: communicationEnvelope.communicationEnvelopeId,
      requestRef: input.requestRef,
      receiptEnvelopeRef: input.receiptEnvelopeRef,
      localAckState: "queued",
      transportAckState: "not_started",
      deliveryEvidenceState: "pending",
      authoritativeOutcomeState:
        communicationEnvelope.toSnapshot().authoritativeOutcomeState,
      patientPostureState: derivePatientPostureState({
        authoritativeOutcomeState: communicationEnvelope.toSnapshot().authoritativeOutcomeState,
        transportAckState: "not_started",
        deliveryEvidenceState: "pending",
      }),
      dispatchEligibilityState,
      routeAuthorityState,
      reachabilityAssessmentState,
      deliveryRiskState,
      reasonCodes,
      monotoneRevision: 1,
      updatedAt: input.queuedAt,
    });

    await this.repositories.saveCommunicationEnvelope(communicationEnvelope);
    await this.repositories.saveReceiptBridge(receiptBridge);

    return {
      replayed: false,
      envelope: communicationEnvelope,
      receiptBridge,
      events: [
        makeFoundationEvent("communication.queued", {
          governingRef: input.requestRef,
          governingVersionRef: communicationEnvelope.communicationEnvelopeId,
          previousState: "not_queued",
          nextState: "queued",
          stateAxis: "confirmation_dispatch_queue",
          receiptEnvelopeRef: input.receiptEnvelopeRef,
          communicationEnvelopeRef: communicationEnvelope.communicationEnvelopeId,
          dispatchEligibilityState,
          authoritativeOutcomeState: communicationEnvelope.toSnapshot().authoritativeOutcomeState,
        }),
      ],
    };
  }

  async dispatchQueuedConfirmation(
    input: DispatchQueuedConfirmationInput,
  ): Promise<DispatchQueuedConfirmationResult> {
    const envelope = await this.requireCommunicationEnvelope(input.communicationEnvelopeRef);
    const bridge = await this.requireReceiptBridge(input.communicationEnvelopeRef);

    const replayed = await this.repositories.findTransportSettlementByKey(input.transportSettlementKey);
    if (replayed) {
      return {
        replayed: true,
        skipped: false,
        envelope,
        receiptBridge: bridge,
        transportSettlement: replayed,
        events: [],
      };
    }

    const snapshot = envelope.toSnapshot();
    if (
      snapshot.dispatchEligibilityState !== "dispatchable" ||
      snapshot.queueState === "delivered" ||
      snapshot.queueState === "failed" ||
      snapshot.queueState === "disputed" ||
      snapshot.queueState === "expired"
    ) {
      return {
        replayed: false,
        skipped: true,
        envelope,
        receiptBridge: bridge,
        transportSettlement: null,
        events: [],
      };
    }

    const backoffSchedule = input.backoffSeconds ?? [60, 300, 900];
    const maxAttempts = input.maxAttempts ?? 3;
    const attemptNumber = snapshot.dispatchAttemptCount + 1;
    const transportSettlement = Phase1ConfirmationTransportSettlementDocument.create({
      transportSettlementSchemaVersion: "PHASE1_CONFIRMATION_TRANSPORT_SETTLEMENT_V1",
      transportSettlementId: nextCommunicationId(this.idGenerator, "confirmationTransportSettlement"),
      communicationEnvelopeRef: snapshot.communicationEnvelopeId,
      queueScopeRef: snapshot.queueScopeRef,
      attemptNumber,
      workerRunRef: input.workerRunRef,
      transportSettlementKey: input.transportSettlementKey,
      providerMode: input.providerMode,
      providerCorrelationRef: input.providerCorrelationRef ?? null,
      processingAcceptanceState: mapTransportOutcomeToAcceptanceState(input.transportOutcome),
      outcome: input.transportOutcome,
      reasonCodes:
        input.transportOutcome === "accepted"
          ? []
          : uniqueSorted([`TRANSPORT_${input.transportOutcome.toUpperCase()}`]),
      recordedAt: input.recordedAt,
    });

    const retrySeconds =
      input.transportOutcome === "timed_out" && attemptNumber < maxAttempts
        ? backoffSchedule[Math.min(attemptNumber - 1, backoffSchedule.length - 1)] ?? 900
        : null;
    const updatedEnvelope = Phase1ConfirmationCommunicationEnvelopeDocument.hydrate({
      ...snapshot,
      transportAckState:
        input.transportOutcome === "accepted"
          ? "accepted"
          : input.transportOutcome === "rejected"
            ? "rejected"
            : "timed_out",
      queueState:
        input.transportOutcome === "accepted"
          ? "delivery_pending"
          : retrySeconds !== null
            ? "queued"
            : "failed",
      authoritativeOutcomeState:
        input.transportOutcome === "accepted"
          ? "awaiting_delivery_truth"
          : "recovery_required",
      latestTransportSettlementRef: transportSettlement.transportSettlementId,
      lastProviderCorrelationRef: input.providerCorrelationRef ?? snapshot.lastProviderCorrelationRef,
      dispatchAttemptCount: attemptNumber,
      nextAttemptNotBeforeAt:
        retrySeconds !== null ? addSeconds(input.recordedAt, retrySeconds) : null,
      terminalAt:
        input.transportOutcome === "accepted" || retrySeconds !== null ? null : input.recordedAt,
      reasonCodes:
        input.transportOutcome === "accepted"
          ? []
          : uniqueSorted([
              ...snapshot.reasonCodes,
              `TRANSPORT_${input.transportOutcome.toUpperCase()}`,
            ]),
      monotoneRevision: snapshot.monotoneRevision + 1,
      updatedAt: input.recordedAt,
      version: snapshot.version + 1,
    });
    const updatedBridgeSnapshot = bridge.toSnapshot();
    const updatedBridge = Phase1ConfirmationReceiptBridgeDocument.hydrate({
      ...updatedBridgeSnapshot,
      transportAckState: updatedEnvelope.toSnapshot().transportAckState,
      deliveryEvidenceState: updatedEnvelope.toSnapshot().deliveryEvidenceState,
      authoritativeOutcomeState: updatedEnvelope.toSnapshot().authoritativeOutcomeState,
      patientPostureState: derivePatientPostureState({
        authoritativeOutcomeState: updatedEnvelope.toSnapshot().authoritativeOutcomeState,
        transportAckState: updatedEnvelope.toSnapshot().transportAckState,
        deliveryEvidenceState: updatedEnvelope.toSnapshot().deliveryEvidenceState,
      }),
      reasonCodes: updatedEnvelope.toSnapshot().reasonCodes,
      monotoneRevision: updatedBridgeSnapshot.monotoneRevision + 1,
      updatedAt: input.recordedAt,
      version: updatedBridgeSnapshot.version + 1,
    });

    await this.repositories.saveTransportSettlement(transportSettlement);
    await this.repositories.saveCommunicationEnvelope(updatedEnvelope, {
      expectedVersion: snapshot.version,
    });
    await this.repositories.saveReceiptBridge(updatedBridge, {
      expectedVersion: updatedBridgeSnapshot.version,
    });

    return {
      replayed: false,
      skipped: false,
      envelope: updatedEnvelope,
      receiptBridge: updatedBridge,
      transportSettlement,
      events: [
        makeFoundationEvent("communication.command.settled", {
          governingRef: snapshot.requestRef,
          governingVersionRef: transportSettlement.transportSettlementId,
          previousState: snapshot.transportAckState,
          nextState: updatedEnvelope.toSnapshot().transportAckState,
          stateAxis: "confirmation_transport_settlement",
          communicationEnvelopeRef: snapshot.communicationEnvelopeId,
          receiptEnvelopeRef: snapshot.receiptEnvelopeRef,
          authoritativeOutcomeState: updatedEnvelope.toSnapshot().authoritativeOutcomeState,
        }),
      ],
    };
  }

  async recordDeliveryEvidence(
    input: RecordPhase1DeliveryEvidenceInput,
  ): Promise<RecordPhase1DeliveryEvidenceResult> {
    const existing = await this.repositories.findDeliveryEvidenceByKey(input.deliveryEvidenceKey);
    const envelope = await this.requireCommunicationEnvelope(input.communicationEnvelopeRef);
    const bridge = await this.requireReceiptBridge(input.communicationEnvelopeRef);
    if (existing) {
      return {
        replayed: true,
        envelope,
        receiptBridge: bridge,
        deliveryEvidence: existing,
        events: [],
      };
    }

    const deliveryEvidence = Phase1ConfirmationDeliveryEvidenceDocument.create({
      deliveryEvidenceSchemaVersion: "PHASE1_CONFIRMATION_DELIVERY_EVIDENCE_V1",
      deliveryEvidenceId: nextCommunicationId(this.idGenerator, "confirmationDeliveryEvidence"),
      communicationEnvelopeRef: input.communicationEnvelopeRef,
      queueScopeRef: envelope.queueScopeRef,
      deliveryEvidenceKey: input.deliveryEvidenceKey,
      evidenceSource: input.evidenceSource,
      providerCorrelationRef: input.providerCorrelationRef ?? null,
      deliveryEvidenceState: input.deliveryEvidenceState,
      reasonCodes: uniqueSorted([`DELIVERY_${input.deliveryEvidenceState.toUpperCase()}`]),
      observedAt: input.observedAt,
      recordedAt: input.recordedAt,
      supersedesDeliveryEvidenceRef: envelope.toSnapshot().latestDeliveryEvidenceRef,
    });

    const envelopeSnapshot = envelope.toSnapshot();
    const authoritativeOutcomeState =
      input.deliveryEvidenceState === "delivered"
        ? "delivery_confirmed"
        : "recovery_required";
    const queueState =
      input.deliveryEvidenceState === "delivered"
        ? "delivered"
        : input.deliveryEvidenceState === "disputed"
          ? "disputed"
          : input.deliveryEvidenceState === "expired"
            ? "expired"
            : "failed";
    const updatedEnvelope = Phase1ConfirmationCommunicationEnvelopeDocument.hydrate({
      ...envelopeSnapshot,
      deliveryEvidenceState: input.deliveryEvidenceState,
      authoritativeOutcomeState,
      queueState,
      latestDeliveryEvidenceRef: deliveryEvidence.deliveryEvidenceId,
      terminalAt: input.recordedAt,
      reasonCodes: uniqueSorted([
        ...envelopeSnapshot.reasonCodes,
        `DELIVERY_${input.deliveryEvidenceState.toUpperCase()}`,
      ]),
      monotoneRevision: envelopeSnapshot.monotoneRevision + 1,
      updatedAt: input.recordedAt,
      version: envelopeSnapshot.version + 1,
    });
    const bridgeSnapshot = bridge.toSnapshot();
    const updatedBridge = Phase1ConfirmationReceiptBridgeDocument.hydrate({
      ...bridgeSnapshot,
      deliveryEvidenceState: input.deliveryEvidenceState,
      authoritativeOutcomeState,
      patientPostureState: derivePatientPostureState({
        authoritativeOutcomeState,
        transportAckState: updatedEnvelope.toSnapshot().transportAckState,
        deliveryEvidenceState: input.deliveryEvidenceState,
      }),
      reasonCodes: updatedEnvelope.toSnapshot().reasonCodes,
      monotoneRevision: bridgeSnapshot.monotoneRevision + 1,
      updatedAt: input.recordedAt,
      version: bridgeSnapshot.version + 1,
    });

    await this.repositories.saveDeliveryEvidence(deliveryEvidence);
    await this.repositories.saveCommunicationEnvelope(updatedEnvelope, {
      expectedVersion: envelopeSnapshot.version,
    });
    await this.repositories.saveReceiptBridge(updatedBridge, {
      expectedVersion: bridgeSnapshot.version,
    });

    const events: SubmissionLineageEventEnvelope<unknown>[] = [
      makeFoundationEvent("communication.delivery.evidence.recorded", {
        governingRef: envelopeSnapshot.requestRef,
        governingVersionRef: deliveryEvidence.deliveryEvidenceId,
        previousState: envelopeSnapshot.deliveryEvidenceState,
        nextState: input.deliveryEvidenceState,
        stateAxis: "confirmation_delivery_evidence",
        communicationEnvelopeRef: envelopeSnapshot.communicationEnvelopeId,
        receiptEnvelopeRef: envelopeSnapshot.receiptEnvelopeRef,
      }),
    ];
    if (
      input.evidenceSource === "provider_delivery_webhook" ||
      input.evidenceSource === "provider_callback" ||
      input.evidenceSource === "simulator_delivery_webhook"
    ) {
      events.push(
        makeFoundationEvent("communication.callback.outcome.recorded", {
          governingRef: envelopeSnapshot.requestRef,
          governingVersionRef: deliveryEvidence.deliveryEvidenceId,
          previousState: envelopeSnapshot.deliveryEvidenceState,
          nextState: input.deliveryEvidenceState,
          stateAxis: "confirmation_provider_callback",
          communicationEnvelopeRef: envelopeSnapshot.communicationEnvelopeId,
          receiptEnvelopeRef: envelopeSnapshot.receiptEnvelopeRef,
        }),
      );
    }

    return {
      replayed: false,
      envelope: updatedEnvelope,
      receiptBridge: updatedBridge,
      deliveryEvidence,
      events,
    };
  }

  async refreshRouteTruth(input: RefreshPhase1ConfirmationRouteTruthInput) {
    const envelope = await this.requireCommunicationEnvelope(input.communicationEnvelopeRef);
    const bridge = await this.requireReceiptBridge(input.communicationEnvelopeRef);
    const envelopeSnapshot = envelope.toSnapshot();
    const bridgeSnapshot = bridge.toSnapshot();
    const dispatchEligibilityState = deriveDispatchEligibilityState({
      routeAuthorityState: input.routeAuthorityState,
      reachabilityAssessmentState: input.reachabilityAssessmentState,
      deliveryRiskState: input.deliveryRiskState,
    });
    const authoritativeOutcomeState =
      dispatchEligibilityState === "dispatchable" &&
      envelopeSnapshot.deliveryEvidenceState !== "delivered" &&
      envelopeSnapshot.transportAckState !== "rejected" &&
      envelopeSnapshot.transportAckState !== "timed_out"
        ? "awaiting_delivery_truth"
        : envelopeSnapshot.deliveryEvidenceState === "delivered"
          ? "delivery_confirmed"
          : "recovery_required";
    const mergedReasonCodes =
      authoritativeOutcomeState === "delivery_confirmed"
        ? []
        : uniqueSorted([...(input.reasonCodes ?? []), ...deriveInitialReasonCodes({
            dispatchEligibilityState,
            routeAuthorityState: input.routeAuthorityState,
            reachabilityAssessmentState: input.reachabilityAssessmentState,
            deliveryRiskState: input.deliveryRiskState,
          })]);
    const updatedEnvelope = Phase1ConfirmationCommunicationEnvelopeDocument.hydrate({
      ...envelopeSnapshot,
      currentContactRouteSnapshotRef:
        input.currentContactRouteSnapshotRef ?? envelopeSnapshot.currentContactRouteSnapshotRef,
      currentReachabilityAssessmentRef:
        input.currentReachabilityAssessmentRef ??
        envelopeSnapshot.currentReachabilityAssessmentRef,
      routeAuthorityState: input.routeAuthorityState,
      reachabilityAssessmentState: input.reachabilityAssessmentState,
      deliveryRiskState: input.deliveryRiskState,
      dispatchEligibilityState,
      authoritativeOutcomeState,
      reasonCodes: mergedReasonCodes,
      monotoneRevision: envelopeSnapshot.monotoneRevision + 1,
      updatedAt: input.recordedAt,
      version: envelopeSnapshot.version + 1,
    });
    const updatedBridge = Phase1ConfirmationReceiptBridgeDocument.hydrate({
      ...bridgeSnapshot,
      routeAuthorityState: input.routeAuthorityState,
      reachabilityAssessmentState: input.reachabilityAssessmentState,
      deliveryRiskState: input.deliveryRiskState,
      dispatchEligibilityState,
      authoritativeOutcomeState,
      patientPostureState: derivePatientPostureState({
        authoritativeOutcomeState,
        transportAckState: updatedEnvelope.toSnapshot().transportAckState,
        deliveryEvidenceState: updatedEnvelope.toSnapshot().deliveryEvidenceState,
      }),
      reasonCodes: mergedReasonCodes,
      monotoneRevision: bridgeSnapshot.monotoneRevision + 1,
      updatedAt: input.recordedAt,
      version: bridgeSnapshot.version + 1,
    });
    await this.repositories.saveCommunicationEnvelope(updatedEnvelope, {
      expectedVersion: envelopeSnapshot.version,
    });
    await this.repositories.saveReceiptBridge(updatedBridge, {
      expectedVersion: bridgeSnapshot.version,
    });
    return {
      envelope: updatedEnvelope,
      receiptBridge: updatedBridge,
    };
  }

  async getCommunicationEnvelope(communicationEnvelopeId: string) {
    return this.repositories.getCommunicationEnvelope(communicationEnvelopeId);
  }

  async getReceiptBridgeForCommunicationEnvelope(communicationEnvelopeRef: string) {
    return this.repositories.findReceiptBridgeByCommunicationEnvelope(communicationEnvelopeRef);
  }

  async listDispatchReady(now: string, limit = Number.POSITIVE_INFINITY) {
    const all = await this.repositories.listCommunicationEnvelopes();
    return all
      .filter((envelope) => {
        const snapshot = envelope.toSnapshot();
        return (
          snapshot.queueState === "queued" &&
          snapshot.dispatchEligibilityState === "dispatchable" &&
          (!snapshot.nextAttemptNotBeforeAt || snapshot.nextAttemptNotBeforeAt <= now)
        );
      })
      .sort((left, right) => compareIso(left.toSnapshot().updatedAt, right.toSnapshot().updatedAt))
      .slice(0, limit);
  }

  async buildMetricsSnapshot(now: string): Promise<Phase1NotificationMetricsSnapshot> {
    const envelopes = await this.repositories.listCommunicationEnvelopes();
    const bridges = await this.repositories.listReceiptBridges();
    const accepted = envelopes.filter((entry) => entry.toSnapshot().transportAckState === "accepted");
    const withEvidence = envelopes.filter(
      (entry) => entry.toSnapshot().latestDeliveryEvidenceRef !== null,
    );
    const delivered = envelopes.filter(
      (entry) => entry.toSnapshot().deliveryEvidenceState === "delivered",
    );
    const failures = envelopes.filter((entry) =>
      ["failed"].includes(entry.toSnapshot().queueState),
    );
    const disputed = envelopes.filter((entry) => entry.toSnapshot().queueState === "disputed");
    const expired = envelopes.filter((entry) => entry.toSnapshot().queueState === "expired");
    const blockage = envelopes.filter((entry) => {
      const snapshot = entry.toSnapshot();
      return (
        snapshot.dispatchEligibilityState === "blocked_route_truth" ||
        (snapshot.queueState === "queued" &&
          snapshot.nextAttemptNotBeforeAt !== null &&
          snapshot.nextAttemptNotBeforeAt < now)
      );
    });
    const latencies = delivered
      .map((entry) => {
        const snapshot = entry.toSnapshot();
        return Date.parse(snapshot.updatedAt) - Date.parse(snapshot.createdAt);
      })
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);
    const p95Index =
      latencies.length === 0 ? -1 : Math.min(latencies.length - 1, Math.floor((latencies.length - 1) * 0.95));

    return {
      metricsSchemaVersion: "PHASE1_CONFIRMATION_NOTIFICATION_METRICS_V1",
      snapshotGeneratedAt: now,
      queuedCount: envelopes.filter((entry) => entry.toSnapshot().queueState === "queued").length,
      blockedRouteTruthCount: envelopes.filter(
        (entry) => entry.toSnapshot().dispatchEligibilityState === "blocked_route_truth",
      ).length,
      deliveryPendingCount: envelopes.filter(
        (entry) => entry.toSnapshot().queueState === "delivery_pending",
      ).length,
      deliveredCount: delivered.length,
      failureCount: failures.length,
      disputedCount: disputed.length,
      expiredCount: expired.length,
      providerAcceptanceRate: envelopes.length === 0 ? 0 : accepted.length / envelopes.length,
      deliveryEvidenceRate: envelopes.length === 0 ? 0 : withEvidence.length / envelopes.length,
      bounceFailureRate: envelopes.length === 0 ? 0 : failures.length / envelopes.length,
      queueDepth: envelopes.filter((entry) => {
        const state = entry.toSnapshot().queueState;
        return state === "queued" || state === "dispatching" || state === "delivery_pending";
      }).length,
      queueBlockageCount: blockage.length,
      endToEndConfirmationLatencyP95Ms: p95Index >= 0 ? latencies[p95Index] ?? 0 : 0,
      receiptRecoveryRequiredCount: bridges.filter(
        (bridge) => bridge.toSnapshot().authoritativeOutcomeState === "recovery_required",
      ).length,
    };
  }

  private async requireCommunicationEnvelope(
    communicationEnvelopeId: string,
  ): Promise<Phase1ConfirmationCommunicationEnvelopeDocument> {
    const envelope = await this.repositories.getCommunicationEnvelope(communicationEnvelopeId);
    invariant(
      !!envelope,
      "CONFIRMATION_COMMUNICATION_ENVELOPE_NOT_FOUND",
      `Phase1 confirmation communication envelope ${communicationEnvelopeId} was not found.`,
    );
    return envelope;
  }

  private async requireReceiptBridge(
    communicationEnvelopeRef: string,
  ): Promise<Phase1ConfirmationReceiptBridgeDocument> {
    const bridge = await this.repositories.findReceiptBridgeByCommunicationEnvelope(
      communicationEnvelopeRef,
    );
    invariant(
      !!bridge,
      "CONFIRMATION_RECEIPT_BRIDGE_NOT_FOUND",
      `Phase1 confirmation receipt bridge for ${communicationEnvelopeRef} was not found.`,
    );
    return bridge;
  }
}

export function createPhase1ConfirmationDispatchService(options?: {
  repositories?: Phase1ConfirmationDispatchRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase1ConfirmationDispatchService {
  const repositories = options?.repositories ?? createPhase1ConfirmationDispatchStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase1_confirmation_dispatch");
  return new InMemoryPhase1ConfirmationDispatchService(repositories, idGenerator);
}
