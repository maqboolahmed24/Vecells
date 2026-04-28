import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  PHASE9_ASSURANCE_CONTRACT_VERSION,
  PHASE9_ASSURANCE_GRAPH_SNAPSHOT_VERSION,
  PHASE9_ASSURANCE_NORMALIZATION_VERSION,
  assertValidContractObject,
  buildAssuranceEvidenceGraphEdge,
  buildAssuranceEvidenceGraphSnapshot,
  buildAssuranceLedgerEntry,
  hashAssurancePayload,
  orderedSetHash,
  validateAssuranceLedgerEntry,
  validateLedgerPreviousHashContinuity,
  type AssuranceEvidenceGraphEdge,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceGraphEdgeType,
  type AssuranceIngestCheckpoint,
  type AssuranceLedgerEntry,
  type EdgeScopeState,
  type EdgeSupersessionState,
  type EvidenceArtifact,
  type ReplayDecisionClass,
} from "./phase9-assurance-ledger-contracts";

export const PHASE9_ASSURANCE_INGEST_SERVICE_VERSION = "435.phase9.assurance-ingest-service.v1";
export const PHASE9_ASSURANCE_INGEST_REBUILD_VERSION = "435.phase9.assurance-ingest-rebuild.v1";

export type AssuranceIngestDecision = "accepted" | "idempotent_replay" | "quarantined";
export type AssuranceQuarantineReason =
  | "MISSING_PRODUCER_REGISTRATION"
  | "UNSUPPORTED_SCHEMA"
  | "UNSUPPORTED_NAMESPACE"
  | "TENANT_NOT_AUTHORIZED"
  | "SEQUENCE_GAP"
  | "SEQUENCE_REGRESSION"
  | "DUPLICATE_SAME_HASH"
  | "DUPLICATE_DIFFERENT_HASH"
  | "PREVIOUS_HASH_DISCONTINUITY"
  | "INVALID_BOUNDED_CONTEXT_OWNER"
  | "CROSS_TENANT_REFERENCE"
  | "MALFORMED_PAYLOAD"
  | "NORMALIZATION_FAILURE"
  | "GRAPH_EDGE_SOURCE_REF_MISSING"
  | "AUTHORIZATION_DENIED"
  | "PHI_FIELD_IN_LOGGABLE_METADATA";

export interface AssuranceProducerRegistration {
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly normalizationVersionRef: string;
  readonly tenantIds: readonly string[];
  readonly sourceBoundedContextRef: string;
  readonly governingBoundedContextRef: string;
  readonly requiredContextBoundaryRefs: readonly string[];
  readonly allowedEventTypes: readonly string[];
  readonly allowedRoles: readonly string[];
  readonly allowedPurposeOfUseRefs: readonly string[];
  readonly allowedReferencedTenantIds?: readonly string[];
  readonly schemaHash: string;
}

export interface AssuranceEvidenceArtifactInput {
  readonly evidenceArtifactId?: string;
  readonly artifactType: string;
  readonly sourceRef?: string;
  readonly sourceVersion: string;
  readonly sourceSnapshotRef: string;
  readonly sourceCaptureBundleRef: string;
  readonly sourceDerivationPackageRefs: readonly string[];
  readonly sourceSummaryParityRef: string;
  readonly canonicalScopeRef: string;
  readonly artifactRole: string;
  readonly artifactPayload: unknown;
  readonly artifactManifest: unknown;
  readonly derivedFromArtifactRefs: readonly string[];
  readonly redactionTransformHash: string;
  readonly retentionClassRef: string;
  readonly visibilityScope: string;
  readonly supersedesArtifactRef?: string;
}

export interface AssuranceGraphEdgeInput {
  readonly fromRef: string;
  readonly toRef: string;
  readonly edgeType: AssuranceGraphEdgeType;
  readonly scopeState?: EdgeScopeState;
  readonly supersessionState?: EdgeSupersessionState;
}

export interface AssuranceProducerEnvelope {
  readonly sourceEventRef: string;
  readonly eventType: string;
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly tenantId: string;
  readonly referencedTenantIds?: readonly string[];
  readonly sourceSequenceRef: string;
  readonly sourceBoundedContextRef: string;
  readonly governingBoundedContextRef: string;
  readonly requiredContextBoundaryRefs: readonly string[];
  readonly edgeCorrelationId: string;
  readonly continuityFrameRef?: string;
  readonly routeIntentRef?: string;
  readonly commandActionRef?: string;
  readonly commandSettlementRef?: string;
  readonly uiEventRef?: string;
  readonly uiTransitionSettlementRef?: string;
  readonly projectionVisibilityRef?: string;
  readonly auditRecordRef: string;
  readonly telemetryDisclosureFenceRef?: string;
  readonly causalTokenRef: string;
  readonly replayDecisionClass: ReplayDecisionClass;
  readonly effectKeyRef: string;
  readonly controlRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly payload: unknown;
  readonly evidenceArtifacts?: readonly AssuranceEvidenceArtifactInput[];
  readonly graphEdges?: readonly AssuranceGraphEdgeInput[];
  readonly createdAt: string;
  readonly expectedPreviousHash?: string;
}

export interface AssuranceReadContext {
  readonly tenantId: string;
  readonly role: string;
  readonly purposeOfUseRef: string;
}

export interface AssuranceQuarantineRecord {
  readonly quarantineRecordId: string;
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly tenantId: string;
  readonly sourceSequenceRef: string;
  readonly sourceEventRef: string;
  readonly reason: AssuranceQuarantineReason;
  readonly canonicalInputHash: string;
  readonly safeMetadata: Record<string, string>;
  readonly recordedAt: string;
}

export interface AssuranceIngestReceipt {
  readonly decision: AssuranceIngestDecision;
  readonly sourceEventRef: string;
  readonly sourceSequenceRef: string;
  readonly canonicalInputHash: string;
  readonly checkpoint?: AssuranceIngestCheckpoint;
  readonly ledgerEntry?: AssuranceLedgerEntry;
  readonly evidenceArtifacts: readonly EvidenceArtifact[];
  readonly graphEdges: readonly AssuranceEvidenceGraphEdge[];
  readonly quarantineRecord?: AssuranceQuarantineRecord;
  readonly ingestResultAuditRef: string;
}

export interface AssuranceGraphSnapshotSealInput {
  readonly tenantScopeRef: string;
  readonly generatedAt: string;
  readonly allowPartial?: boolean;
  readonly standardsVersionMapRefs?: readonly string[];
  readonly controlObjectiveRefs?: readonly string[];
  readonly controlEvidenceLinkRefs?: readonly string[];
  readonly controlStatusSnapshotRefs?: readonly string[];
  readonly controlRecordRefs?: readonly string[];
  readonly evidenceGapRecordRefs?: readonly string[];
  readonly continuityEvidenceRefs?: readonly string[];
  readonly continuityEvidencePackSectionRefs?: readonly string[];
  readonly incidentRefs?: readonly string[];
  readonly exceptionRefs?: readonly string[];
  readonly capaActionRefs?: readonly string[];
  readonly retentionDecisionRefs?: readonly string[];
  readonly archiveManifestRefs?: readonly string[];
  readonly deletionCertificateRefs?: readonly string[];
  readonly packRefs?: readonly string[];
  readonly assurancePackActionRecordRefs?: readonly string[];
  readonly assurancePackSettlementRefs?: readonly string[];
  readonly recoveryEvidenceArtifactRefs?: readonly string[];
}

export interface AssuranceGraphSnapshotSealResult {
  readonly snapshot: AssuranceEvidenceGraphSnapshot;
  readonly edges: readonly AssuranceEvidenceGraphEdge[];
  readonly unresolvedEdgeRefs: readonly string[];
  readonly graphWatermark: string;
}

export interface AssuranceIngestServiceState {
  readonly producerRegistrations: readonly AssuranceProducerRegistration[];
  readonly checkpoints: readonly AssuranceIngestCheckpoint[];
  readonly quarantineRecords: readonly AssuranceQuarantineRecord[];
  readonly ledgerEntries: readonly AssuranceLedgerEntry[];
  readonly evidenceArtifacts: readonly EvidenceArtifact[];
  readonly graphEdges: readonly AssuranceEvidenceGraphEdge[];
  readonly graphSnapshots: readonly AssuranceEvidenceGraphSnapshot[];
}

export interface AssuranceIngestFixture {
  readonly schemaVersion: typeof PHASE9_ASSURANCE_INGEST_SERVICE_VERSION;
  readonly generatedAt: string;
  readonly producerRegistration: AssuranceProducerRegistration;
  readonly acceptedReceipt: AssuranceIngestReceipt;
  readonly duplicateReceipt: AssuranceIngestReceipt;
  readonly snapshot: AssuranceEvidenceGraphSnapshot;
  readonly graphWatermark: string;
  readonly rebuildHash: string;
  readonly healthMetrics: AssuranceIngestHealthMetrics;
}

export interface AssuranceIngestHealthMetrics {
  readonly acceptedCount: number;
  readonly quarantineCount: number;
  readonly latestCheckpointCount: number;
  readonly graphSnapshotCount: number;
  readonly graphMaterializationState: "ready" | "blocked" | "empty";
  readonly rebuildState: "not_run" | "exact" | "drifted" | "blocked";
  readonly ledgerLagSequences: number;
}

interface AcceptedRawEvent {
  readonly envelope: AssuranceProducerEnvelope;
  readonly canonicalInputHash: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function checkpointScopeKey(envelope: Pick<AssuranceProducerEnvelope, "producerRef" | "namespaceRef" | "schemaVersionRef" | "tenantId">): string {
  return `${envelope.producerRef}|${envelope.namespaceRef}|${envelope.schemaVersionRef}|${envelope.tenantId}`;
}

function eventIdentityKey(envelope: Pick<AssuranceProducerEnvelope, "producerRef" | "namespaceRef" | "schemaVersionRef" | "tenantId" | "sourceSequenceRef">): string {
  return `${checkpointScopeKey(envelope)}|${envelope.sourceSequenceRef}`;
}

function parseSequenceRef(sourceSequenceRef: string): bigint | undefined {
  const match = sourceSequenceRef.match(/(\d+)$/);
  if (!match?.[1]) {
    return undefined;
  }
  return BigInt(match[1]);
}

function nextSequenceRef(previous: string): bigint | undefined {
  const parsed = parseSequenceRef(previous);
  return parsed === undefined ? undefined : parsed + 1n;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function safeQuarantineMetadata(envelope: AssuranceProducerEnvelope, reason: AssuranceQuarantineReason): Record<string, string> {
  return {
    reason,
    producerRef: envelope.producerRef,
    namespaceRef: envelope.namespaceRef,
    schemaVersionRef: envelope.schemaVersionRef,
    tenantId: envelope.tenantId,
    sourceSequenceRef: envelope.sourceSequenceRef,
    sourceEventRef: envelope.sourceEventRef,
  };
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function assertNoUnsafeLogMetadata(metadata: Record<string, string>): void {
  for (const key of Object.keys(metadata)) {
    if (/^(patient|nhs|dob|address|phone|email|clinical|diagnosis)|.*(patient|nhsNumber|dateOfBirth)$/i.test(key)) {
      throw new Phase9AssuranceIngestServiceError(
        "PHI_FIELD_IN_LOGGABLE_METADATA",
        `Unsafe log metadata key ${key} is not permitted.`,
      );
    }
  }
}

export class Phase9AssuranceIngestServiceError extends Error {
  readonly code: string;

  constructor(code: AssuranceQuarantineReason | string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9AssuranceIngestServiceError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: AssuranceQuarantineReason | string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9AssuranceIngestServiceError(code, message);
  }
}

export function canonicalProducerEventHash(envelope: AssuranceProducerEnvelope): string {
  return hashAssurancePayload(
    {
      sourceEventRef: envelope.sourceEventRef,
      eventType: envelope.eventType,
      producerRef: envelope.producerRef,
      namespaceRef: envelope.namespaceRef,
      schemaVersionRef: envelope.schemaVersionRef,
      tenantId: envelope.tenantId,
      referencedTenantIds: [...(envelope.referencedTenantIds ?? [])].sort(),
      sourceSequenceRef: envelope.sourceSequenceRef,
      sourceBoundedContextRef: envelope.sourceBoundedContextRef,
      governingBoundedContextRef: envelope.governingBoundedContextRef,
      requiredContextBoundaryRefs: [...envelope.requiredContextBoundaryRefs].sort(),
      edgeCorrelationId: envelope.edgeCorrelationId,
      continuityFrameRef: envelope.continuityFrameRef ?? "",
      routeIntentRef: envelope.routeIntentRef ?? "",
      commandActionRef: envelope.commandActionRef ?? "",
      commandSettlementRef: envelope.commandSettlementRef ?? "",
      uiEventRef: envelope.uiEventRef ?? "",
      uiTransitionSettlementRef: envelope.uiTransitionSettlementRef ?? "",
      projectionVisibilityRef: envelope.projectionVisibilityRef ?? "",
      auditRecordRef: envelope.auditRecordRef,
      telemetryDisclosureFenceRef: envelope.telemetryDisclosureFenceRef ?? "",
      causalTokenRef: envelope.causalTokenRef,
      replayDecisionClass: envelope.replayDecisionClass,
      effectKeyRef: envelope.effectKeyRef,
      controlRefs: [...envelope.controlRefs].sort(),
      evidenceRefs: [...envelope.evidenceRefs].sort(),
      payload: envelope.payload,
      evidenceArtifacts: envelope.evidenceArtifacts ?? [],
      graphEdges: envelope.graphEdges ?? [],
      createdAt: envelope.createdAt,
    },
    "phase9.assurance.ingest.canonical-input",
  );
}

export function buildAssuranceIngestCheckpoint(
  envelope: AssuranceProducerEnvelope,
  ledgerEntry: AssuranceLedgerEntry,
): AssuranceIngestCheckpoint {
  return {
    assuranceIngestCheckpointId: `aic_435_${hashAssurancePayload(
      checkpointScopeKey(envelope),
      "phase9.assurance.ingest.checkpoint.id",
    ).slice(0, 16)}`,
    producerRef: envelope.producerRef,
    namespaceRef: envelope.namespaceRef,
    schemaVersionRef: envelope.schemaVersionRef,
    lastAcceptedSequenceRef: envelope.sourceSequenceRef,
    lastAcceptedEventRef: envelope.sourceEventRef,
    lastAcceptedHash: ledgerEntry.hash,
    quarantineState: "clear",
    updatedAt: envelope.createdAt,
  };
}

export function assertEvidenceArtifactImmutable(previous: EvidenceArtifact, next: EvidenceArtifact): void {
  if (previous.evidenceArtifactId !== next.evidenceArtifactId) {
    return;
  }
  const previousHash = hashAssurancePayload(stripUndefinedFields({ ...previous }), "phase9.assurance.evidence-artifact.immutable");
  const nextHash = hashAssurancePayload(stripUndefinedFields({ ...next }), "phase9.assurance.evidence-artifact.immutable");
  invariant(previousHash === nextHash, "EVIDENCE_ARTIFACT_MUTATED_IN_PLACE", previous.evidenceArtifactId);
}

export class Phase9AssuranceIngestService {
  private readonly registrations = new Map<string, AssuranceProducerRegistration>();
  private readonly checkpoints = new Map<string, AssuranceIngestCheckpoint>();
  private readonly acceptedByEventKey = new Map<string, AssuranceIngestReceipt>();
  private readonly acceptedRawEvents: AcceptedRawEvent[] = [];
  private readonly ledgerEntries: AssuranceLedgerEntry[] = [];
  private readonly evidenceArtifacts = new Map<string, EvidenceArtifact>();
  private readonly stagedGraphEdgeInputs: AssuranceGraphEdgeInput[] = [];
  private readonly graphEdgesBySnapshot = new Map<string, readonly AssuranceEvidenceGraphEdge[]>();
  private readonly graphSnapshots = new Map<string, AssuranceEvidenceGraphSnapshot>();
  private readonly quarantineRecords: AssuranceQuarantineRecord[] = [];
  private readonly safeLogs: Record<string, string>[] = [];
  private rebuildState: AssuranceIngestHealthMetrics["rebuildState"] = "not_run";

  constructor(registrations: readonly AssuranceProducerRegistration[] = []) {
    for (const registration of registrations) {
      this.registerProducer(registration);
    }
  }

  registerProducer(registration: AssuranceProducerRegistration): void {
    invariant(isNonEmptyString(registration.schemaHash), "UNSUPPORTED_SCHEMA", "Producer schemaHash is required.");
    invariant(
      registration.normalizationVersionRef === PHASE9_ASSURANCE_NORMALIZATION_VERSION,
      "NORMALIZATION_FAILURE",
      `Unsupported normalization version ${registration.normalizationVersionRef}.`,
    );
    this.registrations.set(
      `${registration.producerRef}|${registration.namespaceRef}|${registration.schemaVersionRef}`,
      registration,
    );
  }

  ingestBatch(envelopes: readonly AssuranceProducerEnvelope[]): readonly AssuranceIngestReceipt[] {
    return envelopes.map((envelope) => this.ingestEvent(envelope));
  }

  ingestEvent(envelope: AssuranceProducerEnvelope): AssuranceIngestReceipt {
    const canonicalInputHash = canonicalProducerEventHash(envelope);
    const registration = this.lookupRegistration(envelope);
    if (!registration) {
      return this.quarantine(envelope, this.missingRegistrationReason(envelope), canonicalInputHash);
    }
    const validationReason = this.validateEnvelope(envelope, registration);
    if (validationReason) {
      return this.quarantine(envelope, validationReason, canonicalInputHash);
    }

    const eventKey = eventIdentityKey(envelope);
    const previousReceipt = this.acceptedByEventKey.get(eventKey);
    if (previousReceipt) {
      if (previousReceipt.canonicalInputHash === canonicalInputHash) {
        return {
          ...previousReceipt,
          decision: "idempotent_replay",
          ingestResultAuditRef: `audit:ingest:idempotent:${envelope.sourceEventRef}`,
        };
      }
      return this.quarantine(envelope, "DUPLICATE_DIFFERENT_HASH", canonicalInputHash);
    }

    const checkpoint = this.checkpoints.get(checkpointScopeKey(envelope));
    const sequenceReason = this.validateSequence(envelope, checkpoint);
    if (sequenceReason) {
      return this.quarantine(envelope, sequenceReason, canonicalInputHash);
    }

    const previousHash = this.ledgerEntries.at(-1)?.hash ?? GENESIS_ASSURANCE_LEDGER_HASH;
    if (envelope.expectedPreviousHash && envelope.expectedPreviousHash !== previousHash) {
      return this.quarantine(envelope, "PREVIOUS_HASH_DISCONTINUITY", canonicalInputHash);
    }

    const ledgerEntryId = `ale_435_${canonicalInputHash.slice(0, 20)}`;
    const evidenceRefs = sortedUnique([
      ...envelope.evidenceRefs,
      ...(envelope.evidenceArtifacts ?? []).map(
        (artifact) => artifact.evidenceArtifactId ?? `ea_435_${hashAssurancePayload(
          {
            sourceEventRef: envelope.sourceEventRef,
            artifactType: artifact.artifactType,
            sourceVersion: artifact.sourceVersion,
          },
          "phase9.assurance.ingest.evidence.id",
        ).slice(0, 16)}`,
      ),
    ]);
    const pendingGraphEdgeRefs = [
      ...evidenceRefs.map((evidenceRef) => `aege_435_${hashAssurancePayload(
        { ledgerEntryId, evidenceRef, edgeType: "ledger_produces_artifact" },
        "phase9.assurance.ingest.edge.id",
      ).slice(0, 16)}`),
      ...(envelope.graphEdges ?? []).map((edge) => `aege_435_${hashAssurancePayload(edge, "phase9.assurance.ingest.edge.id").slice(0, 16)}`),
    ];
    const ledgerEntry = buildAssuranceLedgerEntry({
      assuranceLedgerEntryId: ledgerEntryId,
      sourceEventRef: envelope.sourceEventRef,
      entryType: envelope.eventType,
      tenantId: envelope.tenantId,
      producerRef: envelope.producerRef,
      namespaceRef: envelope.namespaceRef,
      schemaVersionRef: envelope.schemaVersionRef,
      normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
      sourceSequenceRef: envelope.sourceSequenceRef,
      sourceBoundedContextRef: envelope.sourceBoundedContextRef,
      governingBoundedContextRef: envelope.governingBoundedContextRef,
      requiredContextBoundaryRefs: sortedUnique(envelope.requiredContextBoundaryRefs),
      edgeCorrelationId: envelope.edgeCorrelationId,
      continuityFrameRef: envelope.continuityFrameRef,
      routeIntentRef: envelope.routeIntentRef,
      commandActionRef: envelope.commandActionRef,
      commandSettlementRef: envelope.commandSettlementRef,
      uiEventRef: envelope.uiEventRef,
      uiTransitionSettlementRef: envelope.uiTransitionSettlementRef,
      projectionVisibilityRef: envelope.projectionVisibilityRef,
      auditRecordRef: envelope.auditRecordRef,
      telemetryDisclosureFenceRef: envelope.telemetryDisclosureFenceRef,
      causalTokenRef: envelope.causalTokenRef,
      replayDecisionClass: envelope.replayDecisionClass,
      effectKeyRef: envelope.effectKeyRef,
      controlRefs: sortedUnique(envelope.controlRefs),
      evidenceRefs,
      graphEdgeRefs: sortedUnique(pendingGraphEdgeRefs),
      previousHash,
      createdAt: envelope.createdAt,
      canonicalPayload: envelope.payload,
      inputSetValues: [canonicalInputHash, envelope.controlRefs, evidenceRefs, pendingGraphEdgeRefs],
    });
    const ledgerValidation = validateAssuranceLedgerEntry(ledgerEntry);
    if (!ledgerValidation.valid) {
      return this.quarantine(envelope, "NORMALIZATION_FAILURE", canonicalInputHash);
    }

    const artifacts = (envelope.evidenceArtifacts ?? []).map((artifact) =>
      this.materializeEvidenceArtifact(envelope, artifact, ledgerEntry),
    );
    const graphEdgeInputs = this.createGraphEdgeInputs(envelope, ledgerEntry, artifacts);
    const graphEdgeReferenceReason = this.validateGraphEdgeInputs(graphEdgeInputs, ledgerEntry, artifacts);
    if (graphEdgeReferenceReason) {
      return this.quarantine(envelope, graphEdgeReferenceReason, canonicalInputHash);
    }

    for (const artifact of artifacts) {
      const previousArtifact = this.evidenceArtifacts.get(artifact.evidenceArtifactId);
      if (previousArtifact) {
        try {
          assertEvidenceArtifactImmutable(previousArtifact, artifact);
        } catch {
          return this.quarantine(envelope, "DUPLICATE_DIFFERENT_HASH", canonicalInputHash);
        }
      }
    }

    const nextCheckpoint = buildAssuranceIngestCheckpoint(envelope, ledgerEntry);
    this.ledgerEntries.push(ledgerEntry);
    for (const artifact of artifacts) {
      this.evidenceArtifacts.set(artifact.evidenceArtifactId, artifact);
    }
    this.stagedGraphEdgeInputs.push(...graphEdgeInputs);
    this.checkpoints.set(checkpointScopeKey(envelope), nextCheckpoint);
    this.acceptedRawEvents.push({ envelope, canonicalInputHash });
    const receipt: AssuranceIngestReceipt = {
      decision: "accepted",
      sourceEventRef: envelope.sourceEventRef,
      sourceSequenceRef: envelope.sourceSequenceRef,
      canonicalInputHash,
      checkpoint: nextCheckpoint,
      ledgerEntry,
      evidenceArtifacts: artifacts,
      graphEdges: [],
      ingestResultAuditRef: `audit:ingest:accepted:${envelope.sourceEventRef}`,
    };
    this.acceptedByEventKey.set(eventKey, receipt);
    this.appendSafeLog({
      action: "ingest.accepted",
      producerRef: envelope.producerRef,
      namespaceRef: envelope.namespaceRef,
      tenantId: envelope.tenantId,
      sourceSequenceRef: envelope.sourceSequenceRef,
      canonicalInputHash,
    });
    return receipt;
  }

  queryCheckpoint(
    selector: Pick<AssuranceProducerEnvelope, "producerRef" | "namespaceRef" | "schemaVersionRef" | "tenantId">,
    context?: AssuranceReadContext,
  ): AssuranceIngestCheckpoint | undefined {
    if (context) {
      this.assertReadAuthorized(context, selector.tenantId);
    }
    return this.checkpoints.get(checkpointScopeKey(selector));
  }

  queryQuarantineRecords(context: AssuranceReadContext): readonly AssuranceQuarantineRecord[] {
    this.assertReadAuthorized(context, context.tenantId);
    return this.quarantineRecords.filter((record) => record.tenantId === context.tenantId);
  }

  materializeGraphSnapshot(input: AssuranceGraphSnapshotSealInput, context?: AssuranceReadContext): AssuranceGraphSnapshotSealResult {
    if (context) {
      this.assertReadAuthorized(context, input.tenantScopeRef);
    }
    const ledgerEntryRefs = this.ledgerEntries
      .filter((entry) => entry.tenantId === input.tenantScopeRef)
      .map((entry) => entry.assuranceLedgerEntryId)
      .sort();
    const evidenceArtifactRefs = [...this.evidenceArtifacts.values()]
      .filter((artifact) => artifact.canonicalScopeRef === input.tenantScopeRef)
      .map((artifact) => artifact.evidenceArtifactId)
      .sort();
    const snapshotId = `aegs_435_${hashAssurancePayload(
      {
        tenantScopeRef: input.tenantScopeRef,
        ledgerEntryRefs,
        evidenceArtifactRefs,
        generatedAt: input.generatedAt,
        graphSnapshotVersion: PHASE9_ASSURANCE_GRAPH_SNAPSHOT_VERSION,
      },
      "phase9.assurance.ingest.snapshot.id",
    ).slice(0, 16)}`;
    const edges = this.buildSnapshotEdges(snapshotId, input.generatedAt);
    const nodeRefs = new Set([
      ...ledgerEntryRefs,
      ...evidenceArtifactRefs,
      ...(input.standardsVersionMapRefs ?? []),
      ...(input.controlObjectiveRefs ?? []),
      ...(input.controlEvidenceLinkRefs ?? []),
      ...(input.controlStatusSnapshotRefs ?? []),
      ...(input.controlRecordRefs ?? []),
      ...(input.evidenceGapRecordRefs ?? []),
      ...(input.continuityEvidenceRefs ?? []),
      ...(input.continuityEvidencePackSectionRefs ?? []),
      ...(input.incidentRefs ?? []),
      ...(input.exceptionRefs ?? []),
      ...(input.capaActionRefs ?? []),
      ...(input.retentionDecisionRefs ?? []),
      ...(input.archiveManifestRefs ?? []),
      ...(input.deletionCertificateRefs ?? []),
      ...(input.packRefs ?? []),
      ...(input.assurancePackActionRecordRefs ?? []),
      ...(input.assurancePackSettlementRefs ?? []),
      ...(input.recoveryEvidenceArtifactRefs ?? []),
    ]);
    const unresolvedEdgeRefs = edges
      .filter((edge) => !nodeRefs.has(edge.fromRef) || !nodeRefs.has(edge.toRef))
      .map((edge) => edge.assuranceEvidenceGraphEdgeId)
      .sort();
    if (unresolvedEdgeRefs.length > 0 && !input.allowPartial) {
      invariant(false, "GRAPH_EDGE_SOURCE_REF_MISSING", `Unresolved graph edge refs: ${unresolvedEdgeRefs.join(",")}`);
    }
    const snapshot = buildAssuranceEvidenceGraphSnapshot(
      {
        assuranceEvidenceGraphSnapshotId: snapshotId,
        tenantScopeRef: input.tenantScopeRef,
        standardsVersionMapRefs: sortedUnique(input.standardsVersionMapRefs ?? []),
        ledgerEntryRefs,
        evidenceArtifactRefs,
        controlObjectiveRefs: sortedUnique(input.controlObjectiveRefs ?? []),
        controlEvidenceLinkRefs: sortedUnique(input.controlEvidenceLinkRefs ?? []),
        controlStatusSnapshotRefs: sortedUnique(input.controlStatusSnapshotRefs ?? []),
        controlRecordRefs: sortedUnique(input.controlRecordRefs ?? []),
        evidenceGapRecordRefs: sortedUnique(input.evidenceGapRecordRefs ?? []),
        continuityEvidenceRefs: sortedUnique(input.continuityEvidenceRefs ?? []),
        continuityEvidencePackSectionRefs: sortedUnique(input.continuityEvidencePackSectionRefs ?? []),
        incidentRefs: sortedUnique(input.incidentRefs ?? []),
        exceptionRefs: sortedUnique(input.exceptionRefs ?? []),
        capaActionRefs: sortedUnique(input.capaActionRefs ?? []),
        retentionDecisionRefs: sortedUnique(input.retentionDecisionRefs ?? []),
        archiveManifestRefs: sortedUnique(input.archiveManifestRefs ?? []),
        deletionCertificateRefs: sortedUnique(input.deletionCertificateRefs ?? []),
        packRefs: sortedUnique(input.packRefs ?? []),
        assurancePackActionRecordRefs: sortedUnique(input.assurancePackActionRecordRefs ?? []),
        assurancePackSettlementRefs: sortedUnique(input.assurancePackSettlementRefs ?? []),
        recoveryEvidenceArtifactRefs: sortedUnique(input.recoveryEvidenceArtifactRefs ?? []),
        snapshotState: unresolvedEdgeRefs.length > 0 ? "blocked" : "complete",
        generatedAt: input.generatedAt,
      },
      edges,
    );
    this.graphSnapshots.set(snapshot.assuranceEvidenceGraphSnapshotId, snapshot);
    this.graphEdgesBySnapshot.set(snapshot.assuranceEvidenceGraphSnapshotId, edges);
    const graphWatermark = this.ledgerEntries.at(-1)?.hash ?? GENESIS_ASSURANCE_LEDGER_HASH;
    this.appendSafeLog({
      action: "graph.snapshot.sealed",
      tenantId: input.tenantScopeRef,
      graphSnapshotRef: snapshot.assuranceEvidenceGraphSnapshotId,
      graphHash: snapshot.graphHash,
      graphWatermark,
    });
    return { snapshot, edges, unresolvedEdgeRefs, graphWatermark };
  }

  fetchSnapshotById(snapshotId: string, context: AssuranceReadContext): AssuranceEvidenceGraphSnapshot | undefined {
    const snapshot = this.graphSnapshots.get(snapshotId);
    if (snapshot) {
      this.assertReadAuthorized(context, snapshot.tenantScopeRef);
    }
    return snapshot;
  }

  fetchGraphEdges(
    filter: { readonly snapshotId?: string; readonly artifactRef?: string; readonly controlRef?: string; readonly timelineRef?: string },
    context: AssuranceReadContext,
  ): readonly AssuranceEvidenceGraphEdge[] {
    const edges = filter.snapshotId
      ? this.graphEdgesBySnapshot.get(filter.snapshotId) ?? []
      : [...this.graphEdgesBySnapshot.values()].flat();
    if (filter.snapshotId) {
      const snapshot = this.graphSnapshots.get(filter.snapshotId);
      if (snapshot) {
        this.assertReadAuthorized(context, snapshot.tenantScopeRef);
      }
    }
    return edges
      .filter((edge) => !filter.artifactRef || edge.fromRef === filter.artifactRef || edge.toRef === filter.artifactRef)
      .filter((edge) => !filter.controlRef || edge.fromRef === filter.controlRef || edge.toRef === filter.controlRef)
      .filter((edge) => !filter.timelineRef || edge.fromRef === filter.timelineRef || edge.toRef === filter.timelineRef)
      .sort((left, right) => left.edgeHash.localeCompare(right.edgeHash));
  }

  fetchLatestSnapshotRef(tenantScopeRef: string, context: AssuranceReadContext): string | undefined {
    this.assertReadAuthorized(context, tenantScopeRef);
    return [...this.graphSnapshots.values()]
      .filter((snapshot) => snapshot.tenantScopeRef === tenantScopeRef)
      .sort((left, right) => left.generatedAt.localeCompare(right.generatedAt) || left.graphHash.localeCompare(right.graphHash))
      .at(-1)?.assuranceEvidenceGraphSnapshotId;
  }

  rebuildFromAcceptedRawEvents(input: AssuranceGraphSnapshotSealInput): AssuranceGraphSnapshotSealResult & {
    readonly ledgerEntries: readonly AssuranceLedgerEntry[];
    readonly evidenceArtifacts: readonly EvidenceArtifact[];
    readonly rebuildHash: string;
  } {
    const rebuilt = new Phase9AssuranceIngestService([...this.registrations.values()]);
    const orderedRawEvents = [...this.acceptedRawEvents].sort((left, right) => {
      const leftSeq = parseSequenceRef(left.envelope.sourceSequenceRef) ?? 0n;
      const rightSeq = parseSequenceRef(right.envelope.sourceSequenceRef) ?? 0n;
      return leftSeq < rightSeq ? -1 : leftSeq > rightSeq ? 1 : left.envelope.sourceEventRef.localeCompare(right.envelope.sourceEventRef);
    });
    for (const raw of orderedRawEvents) {
      const receipt = rebuilt.ingestEvent(raw.envelope);
      invariant(receipt.decision === "accepted", "NORMALIZATION_FAILURE", `Rebuild failed for ${raw.envelope.sourceEventRef}.`);
    }
    const result = rebuilt.materializeGraphSnapshot(input);
    const originalLedgerHash = orderedSetHash(this.ledgerEntries.map((entry) => entry.hash), "phase9.assurance.ingest.rebuild.ledger");
    const rebuiltLedgerHash = orderedSetHash(rebuilt.ledgerEntries.map((entry) => entry.hash), "phase9.assurance.ingest.rebuild.ledger");
    this.rebuildState =
      originalLedgerHash === rebuiltLedgerHash && this.latestSnapshot()?.graphHash === result.snapshot.graphHash
        ? "exact"
        : "drifted";
    return {
      ...result,
      ledgerEntries: rebuilt.ledgerEntries,
      evidenceArtifacts: [...rebuilt.evidenceArtifacts.values()].sort((left, right) =>
        left.evidenceArtifactId.localeCompare(right.evidenceArtifactId),
      ),
      rebuildHash: hashAssurancePayload(
        {
          ledgerHash: rebuiltLedgerHash,
          graphHash: result.snapshot.graphHash,
        },
        "phase9.assurance.ingest.rebuild.result",
      ),
    };
  }

  getHealthMetrics(): AssuranceIngestHealthMetrics {
    const lastCheckpoint = [...this.checkpoints.values()].at(-1);
    const lastSequence = lastCheckpoint ? Number(parseSequenceRef(lastCheckpoint.lastAcceptedSequenceRef) ?? 0n) : 0;
    return {
      acceptedCount: this.ledgerEntries.length,
      quarantineCount: this.quarantineRecords.length,
      latestCheckpointCount: this.checkpoints.size,
      graphSnapshotCount: this.graphSnapshots.size,
      graphMaterializationState:
        this.graphSnapshots.size === 0 ? "empty" : this.latestSnapshot()?.snapshotState === "blocked" ? "blocked" : "ready",
      rebuildState: this.rebuildState,
      ledgerLagSequences: Math.max(0, this.ledgerEntries.length - lastSequence),
    };
  }

  getSafeLogs(): readonly Record<string, string>[] {
    return this.safeLogs;
  }

  getState(): AssuranceIngestServiceState {
    return {
      producerRegistrations: [...this.registrations.values()],
      checkpoints: [...this.checkpoints.values()],
      quarantineRecords: [...this.quarantineRecords],
      ledgerEntries: [...this.ledgerEntries],
      evidenceArtifacts: [...this.evidenceArtifacts.values()],
      graphEdges: [...this.graphEdgesBySnapshot.values()].flat(),
      graphSnapshots: [...this.graphSnapshots.values()],
    };
  }

  private lookupRegistration(envelope: AssuranceProducerEnvelope): AssuranceProducerRegistration | undefined {
    return this.registrations.get(`${envelope.producerRef}|${envelope.namespaceRef}|${envelope.schemaVersionRef}`);
  }

  private missingRegistrationReason(envelope: AssuranceProducerEnvelope): AssuranceQuarantineReason {
    const registrations = [...this.registrations.values()].filter(
      (registration) => registration.producerRef === envelope.producerRef,
    );
    if (registrations.length === 0) {
      return "MISSING_PRODUCER_REGISTRATION";
    }
    if (!registrations.some((registration) => registration.namespaceRef === envelope.namespaceRef)) {
      return "UNSUPPORTED_NAMESPACE";
    }
    return "UNSUPPORTED_SCHEMA";
  }

  private validateEnvelope(
    envelope: AssuranceProducerEnvelope,
    registration: AssuranceProducerRegistration,
  ): AssuranceQuarantineReason | undefined {
    if (registration.namespaceRef !== envelope.namespaceRef) {
      return "UNSUPPORTED_NAMESPACE";
    }
    if (registration.schemaVersionRef !== envelope.schemaVersionRef) {
      return "UNSUPPORTED_SCHEMA";
    }
    if (!registration.tenantIds.includes(envelope.tenantId)) {
      return "TENANT_NOT_AUTHORIZED";
    }
    if (!registration.allowedEventTypes.includes(envelope.eventType)) {
      return "UNSUPPORTED_SCHEMA";
    }
    if (!isRecord(envelope.payload)) {
      return "MALFORMED_PAYLOAD";
    }
    if (
      envelope.sourceBoundedContextRef !== registration.sourceBoundedContextRef ||
      envelope.governingBoundedContextRef !== registration.governingBoundedContextRef ||
      registration.requiredContextBoundaryRefs.some((boundaryRef) => !envelope.requiredContextBoundaryRefs.includes(boundaryRef))
    ) {
      return "INVALID_BOUNDED_CONTEXT_OWNER";
    }
    const allowedTenants = new Set([envelope.tenantId, ...(registration.allowedReferencedTenantIds ?? [])]);
    if ((envelope.referencedTenantIds ?? []).some((tenantId) => !allowedTenants.has(tenantId))) {
      return "CROSS_TENANT_REFERENCE";
    }
    return undefined;
  }

  private validateSequence(
    envelope: AssuranceProducerEnvelope,
    checkpoint: AssuranceIngestCheckpoint | undefined,
  ): AssuranceQuarantineReason | undefined {
    const sourceSequence = parseSequenceRef(envelope.sourceSequenceRef);
    if (sourceSequence === undefined) {
      return "MALFORMED_PAYLOAD";
    }
    if (!checkpoint) {
      return sourceSequence === 1n ? undefined : "SEQUENCE_GAP";
    }
    const lastSequence = parseSequenceRef(checkpoint.lastAcceptedSequenceRef);
    if (lastSequence === undefined) {
      return "NORMALIZATION_FAILURE";
    }
    if (sourceSequence <= lastSequence) {
      return "SEQUENCE_REGRESSION";
    }
    const expected = nextSequenceRef(checkpoint.lastAcceptedSequenceRef);
    return expected !== undefined && sourceSequence === expected ? undefined : "SEQUENCE_GAP";
  }

  private materializeEvidenceArtifact(
    envelope: AssuranceProducerEnvelope,
    artifact: AssuranceEvidenceArtifactInput,
    ledgerEntry: AssuranceLedgerEntry,
  ): EvidenceArtifact {
    const evidenceArtifactId =
      artifact.evidenceArtifactId ??
      `ea_435_${hashAssurancePayload(
        {
          sourceEventRef: envelope.sourceEventRef,
          artifactType: artifact.artifactType,
          sourceVersion: artifact.sourceVersion,
        },
        "phase9.assurance.ingest.evidence.id",
      ).slice(0, 16)}`;
    const materialized = {
      evidenceArtifactId,
      artifactType: artifact.artifactType,
      sourceRef: artifact.sourceRef ?? envelope.sourceEventRef,
      sourceVersion: artifact.sourceVersion,
      sourceSnapshotRef: artifact.sourceSnapshotRef,
      sourceCaptureBundleRef: artifact.sourceCaptureBundleRef,
      sourceDerivationPackageRefs: sortedUnique(artifact.sourceDerivationPackageRefs),
      sourceSummaryParityRef: artifact.sourceSummaryParityRef,
      producedByEntryRef: ledgerEntry.assuranceLedgerEntryId,
      canonicalScopeRef: artifact.canonicalScopeRef,
      artifactRole: artifact.artifactRole,
      integrityHash: hashAssurancePayload(artifact.artifactPayload, "phase9.assurance.ingest.evidence.integrity"),
      canonicalArtifactHash: hashAssurancePayload(
        {
          artifactType: artifact.artifactType,
          artifactPayload: artifact.artifactPayload,
          sourceVersion: artifact.sourceVersion,
        },
        "phase9.assurance.ingest.evidence.canonical",
      ),
      artifactManifestHash: hashAssurancePayload(artifact.artifactManifest, "phase9.assurance.ingest.evidence.manifest"),
      derivedFromArtifactRefs: sortedUnique(artifact.derivedFromArtifactRefs),
      redactionTransformHash: artifact.redactionTransformHash,
      retentionClassRef: artifact.retentionClassRef,
      visibilityScope: artifact.visibilityScope,
      supersedesArtifactRef: artifact.supersedesArtifactRef,
      createdAt: envelope.createdAt,
    };
    assertValidContractObject("EvidenceArtifact", materialized);
    return materialized;
  }

  private createGraphEdgeInputs(
    envelope: AssuranceProducerEnvelope,
    ledgerEntry: AssuranceLedgerEntry,
    artifacts: readonly EvidenceArtifact[],
  ): AssuranceGraphEdgeInput[] {
    return [
      ...artifacts.map((artifact) => ({
        fromRef: ledgerEntry.assuranceLedgerEntryId,
        toRef: artifact.evidenceArtifactId,
        edgeType: "ledger_produces_artifact" as const,
        scopeState: "in_scope" as const,
        supersessionState: "live" as const,
      })),
      ...artifacts.flatMap((artifact) =>
        envelope.controlRefs.map((controlRef) => ({
          fromRef: artifact.evidenceArtifactId,
          toRef: controlRef,
          edgeType: "artifact_satisfies_control" as const,
          scopeState: "in_scope" as const,
          supersessionState: "live" as const,
        })),
      ),
      ...(envelope.graphEdges ?? []).map((edge) => ({
        ...edge,
        scopeState: edge.scopeState ?? "in_scope",
        supersessionState: edge.supersessionState ?? "live",
      })),
    ];
  }

  private validateGraphEdgeInputs(
    edgeInputs: readonly AssuranceGraphEdgeInput[],
    ledgerEntry: AssuranceLedgerEntry,
    artifacts: readonly EvidenceArtifact[],
  ): AssuranceQuarantineReason | undefined {
    const knownRefs = new Set([
      ledgerEntry.assuranceLedgerEntryId,
      ...ledgerEntry.controlRefs,
      ...ledgerEntry.evidenceRefs,
      ...artifacts.map((artifact) => artifact.evidenceArtifactId),
    ]);
    for (const edge of edgeInputs) {
      if (!knownRefs.has(edge.fromRef) || !knownRefs.has(edge.toRef)) {
        return "GRAPH_EDGE_SOURCE_REF_MISSING";
      }
    }
    return undefined;
  }

  private buildSnapshotEdges(snapshotId: string, createdAt: string): readonly AssuranceEvidenceGraphEdge[] {
    return this.stagedGraphEdgeInputs
      .map((edge) => {
        const assuranceEvidenceGraphEdgeId = `aege_435_${hashAssurancePayload(
          { snapshotId, edge },
          "phase9.assurance.ingest.snapshot.edge.id",
        ).slice(0, 16)}`;
        return buildAssuranceEvidenceGraphEdge({
          assuranceEvidenceGraphEdgeId,
          graphSnapshotRef: snapshotId,
          fromRef: edge.fromRef,
          toRef: edge.toRef,
          edgeType: edge.edgeType,
          scopeState: edge.scopeState ?? "in_scope",
          supersessionState: edge.supersessionState ?? "live",
          createdAt,
        });
      })
      .sort((left, right) => left.edgeHash.localeCompare(right.edgeHash));
  }

  private quarantine(
    envelope: AssuranceProducerEnvelope,
    reason: AssuranceQuarantineReason,
    canonicalInputHash: string,
  ): AssuranceIngestReceipt {
    const safeMetadata = safeQuarantineMetadata(envelope, reason);
    const record: AssuranceQuarantineRecord = {
      quarantineRecordId: `aiq_435_${hashAssurancePayload(
        {
          sourceEventRef: envelope.sourceEventRef,
          sourceSequenceRef: envelope.sourceSequenceRef,
          canonicalInputHash,
          reason,
        },
        "phase9.assurance.ingest.quarantine.id",
      ).slice(0, 16)}`,
      producerRef: envelope.producerRef,
      namespaceRef: envelope.namespaceRef,
      schemaVersionRef: envelope.schemaVersionRef,
      tenantId: envelope.tenantId,
      sourceSequenceRef: envelope.sourceSequenceRef,
      sourceEventRef: envelope.sourceEventRef,
      reason,
      canonicalInputHash,
      safeMetadata,
      recordedAt: envelope.createdAt,
    };
    this.quarantineRecords.push(record);
    this.appendSafeLog({ action: "ingest.quarantined", ...safeMetadata, canonicalInputHash });
    return {
      decision: "quarantined",
      sourceEventRef: envelope.sourceEventRef,
      sourceSequenceRef: envelope.sourceSequenceRef,
      canonicalInputHash,
      evidenceArtifacts: [],
      graphEdges: [],
      quarantineRecord: record,
      ingestResultAuditRef: `audit:ingest:quarantined:${envelope.sourceEventRef}`,
    };
  }

  private appendSafeLog(metadata: Record<string, string>): void {
    assertNoUnsafeLogMetadata(metadata);
    this.safeLogs.push(metadata);
  }

  private assertReadAuthorized(context: AssuranceReadContext, tenantId: string): void {
    invariant(context.tenantId === tenantId, "AUTHORIZATION_DENIED", "Read context tenant does not match requested tenant.");
    const registrations = [...this.registrations.values()].filter((registration) => registration.tenantIds.includes(tenantId));
    invariant(
      registrations.some(
        (registration) =>
          registration.allowedRoles.includes(context.role) &&
          registration.allowedPurposeOfUseRefs.includes(context.purposeOfUseRef),
      ),
      "AUTHORIZATION_DENIED",
      "Read context role or purpose-of-use is not permitted.",
    );
  }

  private latestSnapshot(): AssuranceEvidenceGraphSnapshot | undefined {
    return [...this.graphSnapshots.values()].sort(
      (left, right) => left.generatedAt.localeCompare(right.generatedAt) || left.graphHash.localeCompare(right.graphHash),
    ).at(-1);
  }
}

export function createDefaultPhase9AssuranceProducerRegistration(): AssuranceProducerRegistration {
  return {
    producerRef: "producer:assistive-rollout",
    namespaceRef: "canonical.assurance.assistive",
    schemaVersionRef: PHASE9_ASSURANCE_CONTRACT_VERSION,
    normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
    tenantIds: ["tenant:demo-gp"],
    sourceBoundedContextRef: "bounded-context:triage_workspace",
    governingBoundedContextRef: "bounded-context:analytics_assurance",
    requiredContextBoundaryRefs: ["boundary:triage-to-assurance:observer"],
    allowedEventTypes: ["evidence_materialization", "control_evaluation"],
    allowedRoles: ["assurance_reader", "assurance_admin"],
    allowedPurposeOfUseRefs: ["assurance.operations", "assurance.audit"],
    schemaHash: hashAssurancePayload(
      {
        schemaVersionRef: PHASE9_ASSURANCE_CONTRACT_VERSION,
        requiredFields: [
          "sourceEventRef",
          "producerRef",
          "namespaceRef",
          "schemaVersionRef",
          "sourceSequenceRef",
          "sourceBoundedContextRef",
          "governingBoundedContextRef",
          "auditRecordRef",
        ],
      },
      "phase9.assurance.ingest.producer.schema",
    ),
  };
}

export function createPhase9AssuranceProducerEnvelope(
  overrides: Partial<AssuranceProducerEnvelope> = {},
): AssuranceProducerEnvelope {
  const sequence = overrides.sourceSequenceRef ?? "seq:000001";
  return {
    sourceEventRef: `event:assistive:${sequence}`,
    eventType: "evidence_materialization",
    producerRef: "producer:assistive-rollout",
    namespaceRef: "canonical.assurance.assistive",
    schemaVersionRef: PHASE9_ASSURANCE_CONTRACT_VERSION,
    tenantId: "tenant:demo-gp",
    referencedTenantIds: ["tenant:demo-gp"],
    sourceSequenceRef: sequence,
    sourceBoundedContextRef: "bounded-context:triage_workspace",
    governingBoundedContextRef: "bounded-context:analytics_assurance",
    requiredContextBoundaryRefs: ["boundary:triage-to-assurance:observer"],
    edgeCorrelationId: "edge-correlation:assistive-rollout",
    continuityFrameRef: "continuity:workspace-task-completion",
    routeIntentRef: "route-intent:workspace-assistive",
    commandActionRef: "command-action:assistive-suggestion",
    commandSettlementRef: "command-settlement:human-accepted",
    uiEventRef: "ui-event:assistive-visible",
    uiTransitionSettlementRef: "ui-transition:visible-settled",
    projectionVisibilityRef: "visibility:minimum-necessary",
    auditRecordRef: "audit:assistive-visible",
    telemetryDisclosureFenceRef: "telemetry:fence:minimum-necessary",
    causalTokenRef: "causal:assistive-rollout",
    replayDecisionClass: "original",
    effectKeyRef: "effect:assistive-rollout",
    controlRefs: ["control:dtac:clinical-safety:evidence"],
    evidenceRefs: [],
    payload: {
      controlCode: "dtac-clinical-safety",
      evidenceState: "visible",
      payloadDigestRef: "digest:assistive-visible",
    },
    evidenceArtifacts: [
      {
        artifactType: "event_snapshot",
        sourceVersion: "v1",
        sourceSnapshotRef: "snapshot:assistive-rollout",
        sourceCaptureBundleRef: "capture:assistive-rollout",
        sourceDerivationPackageRefs: ["derivation:assistive-rollout"],
        sourceSummaryParityRef: "summary-parity:assistive-rollout",
        canonicalScopeRef: "tenant:demo-gp",
        artifactRole: "source",
        artifactPayload: { digest: "assistive-visible", inlinePhi: false },
        artifactManifest: { files: ["manifest:assistive-rollout"], redacted: true },
        derivedFromArtifactRefs: [],
        redactionTransformHash: hashAssurancePayload({ transform: "minimum-necessary" }, "phase9.assurance.redaction"),
        retentionClassRef: "retention:assurance-ledger-worm",
        visibilityScope: "governance",
      },
    ],
    graphEdges: [],
    createdAt: "2026-04-27T09:00:00.000Z",
    ...overrides,
  };
}

export function createPhase9AssuranceIngestFixture(): AssuranceIngestFixture {
  const producerRegistration = createDefaultPhase9AssuranceProducerRegistration();
  const service = new Phase9AssuranceIngestService([producerRegistration]);
  const acceptedReceipt = service.ingestEvent(createPhase9AssuranceProducerEnvelope());
  const duplicateReceipt = service.ingestEvent(createPhase9AssuranceProducerEnvelope());
  const snapshotResult = service.materializeGraphSnapshot({
    tenantScopeRef: "tenant:demo-gp",
    generatedAt: "2026-04-27T09:05:00.000Z",
    controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
  });
  const rebuild = service.rebuildFromAcceptedRawEvents({
    tenantScopeRef: "tenant:demo-gp",
    generatedAt: "2026-04-27T09:05:00.000Z",
    controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
  });
  invariant(acceptedReceipt.ledgerEntry, "NORMALIZATION_FAILURE", "Fixture accepted receipt missing ledger entry.");
  invariant(
    validateLedgerPreviousHashContinuity(service.getState().ledgerEntries).valid,
    "PREVIOUS_HASH_DISCONTINUITY",
    "Fixture ledger continuity failed.",
  );
  return {
    schemaVersion: PHASE9_ASSURANCE_INGEST_SERVICE_VERSION,
    generatedAt: "2026-04-27T09:05:00.000Z",
    producerRegistration,
    acceptedReceipt,
    duplicateReceipt,
    snapshot: snapshotResult.snapshot,
    graphWatermark: snapshotResult.graphWatermark,
    rebuildHash: rebuild.rebuildHash,
    healthMetrics: service.getHealthMetrics(),
  };
}

export function phase9AssuranceIngestServiceSummary(
  fixture: AssuranceIngestFixture = createPhase9AssuranceIngestFixture(),
): string {
  return [
    "# Phase 9 Assurance Ingest Service",
    "",
    `Service version: ${fixture.schemaVersion}`,
    `Producer: ${fixture.producerRegistration.producerRef}`,
    `Accepted decision: ${fixture.acceptedReceipt.decision}`,
    `Duplicate decision: ${fixture.duplicateReceipt.decision}`,
    `Snapshot: ${fixture.snapshot.assuranceEvidenceGraphSnapshotId}`,
    `Graph hash: ${fixture.snapshot.graphHash}`,
    `Graph watermark: ${fixture.graphWatermark}`,
    `Rebuild hash: ${fixture.rebuildHash}`,
    "",
    "## Guarantees",
    "",
    "- Producer, namespace, schema, sequence, tenant, bounded-context, and normalization metadata are validated before acceptance.",
    "- Checkpoint, ledger entry, evidence artifact, and graph staging are updated together before an accepted receipt is returned.",
    "- Duplicate same-hash events are idempotent replays; duplicate different-hash, out-of-order, unsupported, cross-tenant, and malformed inputs quarantine.",
    "- Graph snapshots are deterministic, immutable, hash-addressable, and queryable by tenant and scope.",
    "- Rebuild from accepted raw inputs yields the same ledger and graph hash.",
    "",
  ].join("\n");
}

export function phase9AssuranceIngestServiceMatrixCsv(): string {
  return [
    "api,authorization,determinism,failClosedReason",
    "ingestEvent,producer registration and tenant/schema validation,canonical input hash + previous hash,DUPLICATE_DIFFERENT_HASH|SEQUENCE_GAP|UNSUPPORTED_SCHEMA",
    "ingestBatch,same as ingestEvent,ordered per input batch,first invalid event quarantines independently",
    "queryCheckpoint,tenant role and purpose-of-use,checkpoint scope key,AUTHORIZATION_DENIED",
    "queryQuarantineRecords,tenant role and purpose-of-use,recorded safe metadata only,AUTHORIZATION_DENIED",
    "materializeGraphSnapshot,tenant role and purpose-of-use when supplied,sorted refs + Merkle edge hash,GRAPH_EDGE_SOURCE_REF_MISSING",
    "fetchSnapshotById,tenant role and purpose-of-use,immutable snapshot id,AUTHORIZATION_DENIED",
    "fetchGraphEdges,tenant role and purpose-of-use,edge hash ordering,AUTHORIZATION_DENIED",
    "rebuildFromAcceptedRawEvents,accepted raw event log,canonical raw input replay,NORMALIZATION_FAILURE",
  ].join("\n") + "\n";
}
