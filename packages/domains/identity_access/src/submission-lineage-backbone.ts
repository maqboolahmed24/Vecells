import { AsyncLocalStorage } from "node:async_hooks";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  type CreateSubmissionEnvelopeInput,
  type LineageCaseLinkAggregate,
  type LineageCaseLinkRepository,
  type PersistedLineageCaseLinkRow,
  type PersistedRequestLineageRow,
  type PersistedRequestRow,
  type PersistedSubmissionEnvelopeRow,
  type ProposeLineageCaseLinkInput,
  type RequestAggregate,
  type RequestLineageAggregate,
  type RequestLineageBranchClass,
  type RequestLineageRepository,
  type RequestRepository,
  type SubmissionEnvelopeAggregate,
  type SubmissionEnvelopeRepository,
  type ContinuityWitnessClass,
  createDeterministicBackboneIdGenerator,
  hydrateLineageCaseLink,
  hydrateRequest,
  hydrateRequestLineage,
  hydrateSubmissionEnvelope,
  LineageCaseLinkAggregate as KernelLineageCaseLinkAggregate,
  RequestAggregate as KernelRequestAggregate,
  RequestBackboneInvariantError,
  RequestLineageAggregate as KernelRequestLineageAggregate,
  serializeLineageCaseLink,
  serializeRequest,
  serializeRequestLineage,
  serializeSubmissionEnvelope,
  SubmissionEnvelopeAggregate as KernelSubmissionEnvelopeAggregate,
} from "@vecells/domain-kernel";
import {
  emitIntakeDraftCreated,
  emitIntakeIngressRecorded,
  emitIntakeNormalized,
  emitIntakePromotionCommitted,
  emitIntakePromotionReplayReturned,
  emitIntakePromotionStarted,
  emitIntakePromotionSupersededGrantsApplied,
  emitIntakePromotionSettled,
  emitIntakeResumeContinuityUpdated,
  emitRequestCreated,
  emitRequestLineageBranched,
  emitRequestLineageCaseLinkChanged,
  emitRequestSnapshotCreated,
  emitRequestSubmitted,
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

function uniqueSortedRefs(values: readonly string[]): string[] {
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

function assertUniqueSecondaryKey(
  map: Map<string, string>,
  secondaryKey: string,
  primaryKey: string,
  errorCode: string,
  fieldName: string,
): void {
  const current = map.get(secondaryKey);
  invariant(
    current === undefined || current === primaryKey,
    errorCode,
    `${fieldName} ${secondaryKey} is already bound to ${current}.`,
  );
}

function setSecondaryKey(map: Map<string, string>, secondaryKey: string, primaryKey: string): void {
  map.set(secondaryKey, primaryKey);
}

export type PromotionReplayClass =
  | "exact_submit_replay"
  | "duplicate_submit_same_tab"
  | "duplicate_submit_cross_tab"
  | "auth_return_replay"
  | "support_resume_replay"
  | "delayed_network_retry";

export type PromotionLookupField =
  | "submissionEnvelopeRef"
  | "sourceLineageRef"
  | "requestLineageRef"
  | "receiptConsistencyKey"
  | "statusConsistencyKey";

export interface DraftMutabilitySupersessionReceipt {
  submissionEnvelopeRef: string;
  sourceLineageRef: string;
  promotionRecordRef: string;
  requestRef: string;
  requestLineageRef: string;
  supersededAccessGrantRefs: readonly string[];
  supersededDraftLeaseRefs: readonly string[];
  appliedAt: string;
}

export interface AuthoritativeRequestShellHandoff {
  lookupField: PromotionLookupField;
  envelope: SubmissionEnvelopeAggregate;
  promotionRecord: SubmissionPromotionRecordDocument;
  request: RequestAggregate;
  requestLineage: RequestLineageAggregate;
  episode: EpisodeAggregate;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  patientJourneyLineageRef: string;
  redirectTarget: "authoritative_request_shell";
}

export interface EpisodeSnapshot {
  episodeId: string;
  patientRef: string | null;
  currentIdentityBindingRef: string | null;
  activeIdentityRepairCaseRef: string | null;
  currentConfirmationGateRefs: readonly string[];
  currentClosureBlockerRefs: readonly string[];
  episodeFingerprint: string;
  originRequestRef: string | null;
  memberRequestRefs: readonly string[];
  requestLineageRefs: readonly string[];
  state: "open" | "resolved" | "archived";
  resolutionReason: string | null;
  openedAt: string;
  resolvedAt: string | null;
  updatedAt: string;
  version: number;
}

export interface SubmissionPromotionRecordSnapshot {
  promotionRecordId: string;
  submissionEnvelopeRef: string;
  sourceLineageRef: string;
  requestRef: string;
  requestLineageRef: string;
  promotionCommandActionRecordRef: string;
  promotionCommandSettlementRecordRef: string;
  promotedEvidenceSnapshotRef: string;
  promotedNormalizedSubmissionRef: string;
  promotedDraftVersion: number;
  intakeExperienceBundleRef: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  patientJourneyLineageRef: string;
  supersededAccessGrantRefs: readonly string[];
  supersededDraftLeaseRefs: readonly string[];
  createdAt: string;
  version: number;
}

export interface PersistedEpisodeRow extends EpisodeSnapshot {
  aggregateType: "Episode";
  persistenceSchemaVersion: 1;
}

export interface PersistedSubmissionPromotionRecordRow extends SubmissionPromotionRecordSnapshot {
  aggregateType: "SubmissionPromotionRecord";
  persistenceSchemaVersion: 1;
}

export class EpisodeAggregate {
  private readonly snapshot: EpisodeSnapshot;

  private constructor(snapshot: EpisodeSnapshot) {
    this.snapshot = EpisodeAggregate.normalize(snapshot);
  }

  static create(input: {
    episodeId: string;
    episodeFingerprint: string;
    openedAt: string;
    patientRef?: string | null;
    currentIdentityBindingRef?: string | null;
    originRequestRef?: string | null;
  }): EpisodeAggregate {
    return new EpisodeAggregate({
      episodeId: requireRef(input.episodeId, "episodeId"),
      patientRef: input.patientRef ?? null,
      currentIdentityBindingRef: input.currentIdentityBindingRef ?? null,
      activeIdentityRepairCaseRef: null,
      currentConfirmationGateRefs: [],
      currentClosureBlockerRefs: [],
      episodeFingerprint: requireRef(input.episodeFingerprint, "episodeFingerprint"),
      originRequestRef: input.originRequestRef ?? null,
      memberRequestRefs: [],
      requestLineageRefs: [],
      state: "open",
      resolutionReason: null,
      openedAt: input.openedAt,
      resolvedAt: null,
      updatedAt: input.openedAt,
      version: 1,
    });
  }

  static hydrate(snapshot: EpisodeSnapshot): EpisodeAggregate {
    return new EpisodeAggregate(snapshot);
  }

  private static normalize(snapshot: EpisodeSnapshot): EpisodeSnapshot {
    invariant(snapshot.version >= 1, "INVALID_EPISODE_VERSION", "Episode version must be >= 1.");
    if (snapshot.patientRef) {
      invariant(
        snapshot.currentIdentityBindingRef,
        "EPISODE_PATIENT_REF_REQUIRES_IDENTITY_BINDING",
        "Episode.patientRef may derive only from currentIdentityBindingRef.",
      );
    }
    return {
      ...snapshot,
      currentConfirmationGateRefs: uniqueSortedRefs(snapshot.currentConfirmationGateRefs),
      currentClosureBlockerRefs: uniqueSortedRefs(snapshot.currentClosureBlockerRefs),
      memberRequestRefs: uniqueSortedRefs(snapshot.memberRequestRefs),
      requestLineageRefs: uniqueSortedRefs(snapshot.requestLineageRefs),
    };
  }

  get episodeId(): string {
    return this.snapshot.episodeId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  get patientRef(): string | null {
    return this.snapshot.patientRef;
  }

  get currentIdentityBindingRef(): string | null {
    return this.snapshot.currentIdentityBindingRef;
  }

  get state(): EpisodeSnapshot["state"] {
    return this.snapshot.state;
  }

  toSnapshot(): EpisodeSnapshot {
    return {
      ...this.snapshot,
      currentConfirmationGateRefs: [...this.snapshot.currentConfirmationGateRefs],
      currentClosureBlockerRefs: [...this.snapshot.currentClosureBlockerRefs],
      memberRequestRefs: [...this.snapshot.memberRequestRefs],
      requestLineageRefs: [...this.snapshot.requestLineageRefs],
    };
  }

  bindIdentity(input: {
    identityBindingRef: string;
    patientRef: string;
    updatedAt: string;
  }): EpisodeAggregate {
    return new EpisodeAggregate({
      ...this.snapshot,
      currentIdentityBindingRef: requireRef(input.identityBindingRef, "identityBindingRef"),
      patientRef: requireRef(input.patientRef, "patientRef"),
      updatedAt: input.updatedAt,
      version: this.snapshot.version + 1,
    });
  }

  attachRequestMembership(input: {
    requestRef: string;
    requestLineageRef: string;
    updatedAt: string;
  }): EpisodeAggregate {
    return new EpisodeAggregate({
      ...this.snapshot,
      originRequestRef:
        this.snapshot.originRequestRef ?? requireRef(input.requestRef, "requestRef"),
      memberRequestRefs: uniqueSortedRefs([
        ...this.snapshot.memberRequestRefs,
        requireRef(input.requestRef, "requestRef"),
      ]),
      requestLineageRefs: uniqueSortedRefs([
        ...this.snapshot.requestLineageRefs,
        requireRef(input.requestLineageRef, "requestLineageRef"),
      ]),
      updatedAt: input.updatedAt,
      version: this.snapshot.version + 1,
    });
  }

  refreshOperationalRefs(input: {
    currentConfirmationGateRefs?: readonly string[];
    currentClosureBlockerRefs?: readonly string[];
    activeIdentityRepairCaseRef?: string | null;
    updatedAt: string;
  }): EpisodeAggregate {
    return new EpisodeAggregate({
      ...this.snapshot,
      currentConfirmationGateRefs:
        input.currentConfirmationGateRefs === undefined
          ? this.snapshot.currentConfirmationGateRefs
          : uniqueSortedRefs(input.currentConfirmationGateRefs),
      currentClosureBlockerRefs:
        input.currentClosureBlockerRefs === undefined
          ? this.snapshot.currentClosureBlockerRefs
          : uniqueSortedRefs(input.currentClosureBlockerRefs),
      activeIdentityRepairCaseRef:
        input.activeIdentityRepairCaseRef === undefined
          ? this.snapshot.activeIdentityRepairCaseRef
          : input.activeIdentityRepairCaseRef,
      updatedAt: input.updatedAt,
      version: this.snapshot.version + 1,
    });
  }
}

export class SubmissionPromotionRecordDocument {
  private readonly snapshot: SubmissionPromotionRecordSnapshot;

  private constructor(snapshot: SubmissionPromotionRecordSnapshot) {
    this.snapshot = SubmissionPromotionRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<SubmissionPromotionRecordSnapshot, "version">,
  ): SubmissionPromotionRecordDocument {
    return new SubmissionPromotionRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: SubmissionPromotionRecordSnapshot): SubmissionPromotionRecordDocument {
    return new SubmissionPromotionRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: SubmissionPromotionRecordSnapshot,
  ): SubmissionPromotionRecordSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_SUBMISSION_PROMOTION_RECORD_VERSION",
      "SubmissionPromotionRecord version must be >= 1.",
    );
    return {
      ...snapshot,
      promotionRecordId: requireRef(snapshot.promotionRecordId, "promotionRecordId"),
      submissionEnvelopeRef: requireRef(snapshot.submissionEnvelopeRef, "submissionEnvelopeRef"),
      sourceLineageRef: requireRef(snapshot.sourceLineageRef, "sourceLineageRef"),
      requestRef: requireRef(snapshot.requestRef, "requestRef"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      promotionCommandActionRecordRef: requireRef(
        snapshot.promotionCommandActionRecordRef,
        "promotionCommandActionRecordRef",
      ),
      promotionCommandSettlementRecordRef: requireRef(
        snapshot.promotionCommandSettlementRecordRef,
        "promotionCommandSettlementRecordRef",
      ),
      promotedEvidenceSnapshotRef: requireRef(
        snapshot.promotedEvidenceSnapshotRef,
        "promotedEvidenceSnapshotRef",
      ),
      promotedNormalizedSubmissionRef: requireRef(
        snapshot.promotedNormalizedSubmissionRef,
        "promotedNormalizedSubmissionRef",
      ),
      intakeExperienceBundleRef: requireRef(
        snapshot.intakeExperienceBundleRef,
        "intakeExperienceBundleRef",
      ),
      receiptConsistencyKey: requireRef(snapshot.receiptConsistencyKey, "receiptConsistencyKey"),
      statusConsistencyKey: requireRef(snapshot.statusConsistencyKey, "statusConsistencyKey"),
      patientJourneyLineageRef: requireRef(
        snapshot.patientJourneyLineageRef,
        "patientJourneyLineageRef",
      ),
      supersededAccessGrantRefs: uniqueSortedRefs(snapshot.supersededAccessGrantRefs),
      supersededDraftLeaseRefs: uniqueSortedRefs(snapshot.supersededDraftLeaseRefs),
    };
  }

  get promotionRecordId(): string {
    return this.snapshot.promotionRecordId;
  }

  get requestRef(): string {
    return this.snapshot.requestRef;
  }

  get requestLineageRef(): string {
    return this.snapshot.requestLineageRef;
  }

  get submissionEnvelopeRef(): string {
    return this.snapshot.submissionEnvelopeRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): SubmissionPromotionRecordSnapshot {
    return {
      ...this.snapshot,
      supersededAccessGrantRefs: [...this.snapshot.supersededAccessGrantRefs],
      supersededDraftLeaseRefs: [...this.snapshot.supersededDraftLeaseRefs],
    };
  }
}

export interface EpisodeRepository {
  getEpisode(episodeId: string): Promise<EpisodeAggregate | undefined>;
  saveEpisode(episode: EpisodeAggregate, options?: CompareAndSetWriteOptions): Promise<void>;
  listEpisodes(): Promise<readonly EpisodeAggregate[]>;
}

export interface SubmissionPromotionRecordRepository {
  getSubmissionPromotionRecord(
    promotionRecordId: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined>;
  saveSubmissionPromotionRecord(
    promotionRecord: SubmissionPromotionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findSubmissionPromotionRecordByEnvelope(
    submissionEnvelopeRef: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined>;
  findSubmissionPromotionRecordBySourceLineage(
    sourceLineageRef: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined>;
  findSubmissionPromotionRecordByRequestLineage(
    requestLineageRef: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined>;
  findSubmissionPromotionRecordByReceiptConsistencyKey(
    receiptConsistencyKey: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined>;
  findSubmissionPromotionRecordByStatusConsistencyKey(
    statusConsistencyKey: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined>;
  listSubmissionPromotionRecords(): Promise<readonly SubmissionPromotionRecordDocument[]>;
}

export interface SubmissionPromotionBoundaryRepository {
  withPromotionBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

export interface DraftMutabilitySupersessionRepository {
  applyDraftMutabilitySupersession(input: DraftMutabilitySupersessionReceipt): Promise<void>;
}

export class InMemorySubmissionLineageFoundationStore
  implements
    SubmissionEnvelopeRepository,
    RequestRepository,
    RequestLineageRepository,
    LineageCaseLinkRepository,
    EpisodeRepository,
    SubmissionPromotionRecordRepository
{
  private readonly submissionEnvelopes = new Map<string, PersistedSubmissionEnvelopeRow>();
  private readonly requests = new Map<string, PersistedRequestRow>();
  private readonly requestLineages = new Map<string, PersistedRequestLineageRow>();
  private readonly lineageCaseLinks = new Map<string, PersistedLineageCaseLinkRow>();
  private readonly episodes = new Map<string, PersistedEpisodeRow>();
  private readonly submissionPromotions = new Map<string, PersistedSubmissionPromotionRecordRow>();
  private readonly promotionByEnvelopeRef = new Map<string, string>();
  private readonly promotionBySourceLineageRef = new Map<string, string>();
  private readonly promotionByRequestLineageRef = new Map<string, string>();
  private readonly promotionByReceiptConsistencyKey = new Map<string, string>();
  private readonly promotionByStatusConsistencyKey = new Map<string, string>();
  private readonly liveDraftAccessGrantRefsByEnvelope = new Map<string, Set<string>>();
  private readonly liveDraftLeaseRefsByEnvelope = new Map<string, Set<string>>();
  private readonly draftMutabilitySupersessionReceipts: DraftMutabilitySupersessionReceipt[] = [];
  private promotionBoundaryQueue: Promise<void> = Promise.resolve();
  private readonly promotionBoundaryContext = new AsyncLocalStorage<boolean>();

  async getSubmissionEnvelope(
    envelopeId: string,
  ): Promise<SubmissionEnvelopeAggregate | undefined> {
    const row = this.submissionEnvelopes.get(envelopeId);
    return row ? hydrateSubmissionEnvelope(row) : undefined;
  }

  async saveSubmissionEnvelope(
    envelope: SubmissionEnvelopeAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.submissionEnvelopes,
      envelope.envelopeId,
      serializeSubmissionEnvelope(envelope),
      options,
    );
  }

  async findSubmissionEnvelopeBySourceLineage(
    sourceLineageRef: string,
  ): Promise<SubmissionEnvelopeAggregate | undefined> {
    const row = [...this.submissionEnvelopes.values()].find(
      (candidate) => candidate.sourceLineageRef === sourceLineageRef,
    );
    return row ? hydrateSubmissionEnvelope(row) : undefined;
  }

  async listSubmissionEnvelopes(): Promise<readonly SubmissionEnvelopeAggregate[]> {
    return [...this.submissionEnvelopes.values()].map(hydrateSubmissionEnvelope);
  }

  async getRequest(requestId: string): Promise<RequestAggregate | undefined> {
    const row = this.requests.get(requestId);
    return row ? hydrateRequest(row) : undefined;
  }

  async saveRequest(request: RequestAggregate, options?: CompareAndSetWriteOptions): Promise<void> {
    saveWithCas(this.requests, request.requestId, serializeRequest(request), options);
  }

  async listRequests(): Promise<readonly RequestAggregate[]> {
    return [...this.requests.values()].map(hydrateRequest);
  }

  async getRequestLineage(requestLineageId: string): Promise<RequestLineageAggregate | undefined> {
    const row = this.requestLineages.get(requestLineageId);
    return row ? hydrateRequestLineage(row) : undefined;
  }

  async saveRequestLineage(
    lineage: RequestLineageAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.requestLineages,
      lineage.requestLineageId,
      serializeRequestLineage(lineage),
      options,
    );
  }

  async listRequestLineages(): Promise<readonly RequestLineageAggregate[]> {
    return [...this.requestLineages.values()].map(hydrateRequestLineage);
  }

  async getLineageCaseLink(
    lineageCaseLinkId: string,
  ): Promise<LineageCaseLinkAggregate | undefined> {
    const row = this.lineageCaseLinks.get(lineageCaseLinkId);
    return row ? hydrateLineageCaseLink(row) : undefined;
  }

  async saveLineageCaseLink(
    link: LineageCaseLinkAggregate,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.lineageCaseLinks,
      link.lineageCaseLinkId,
      serializeLineageCaseLink(link),
      options,
    );
  }

  async findActiveLineageCaseLinksForRequestLineage(
    requestLineageId: string,
  ): Promise<readonly LineageCaseLinkAggregate[]> {
    return [...this.lineageCaseLinks.values()]
      .filter(
        (row) => row.requestLineageRef === requestLineageId && row.ownershipState === "active",
      )
      .map(hydrateLineageCaseLink);
  }

  async listLineageCaseLinks(): Promise<readonly LineageCaseLinkAggregate[]> {
    return [...this.lineageCaseLinks.values()].map(hydrateLineageCaseLink);
  }

  async getEpisode(episodeId: string): Promise<EpisodeAggregate | undefined> {
    const row = this.episodes.get(episodeId);
    return row ? EpisodeAggregate.hydrate(row) : undefined;
  }

  async saveEpisode(episode: EpisodeAggregate, options?: CompareAndSetWriteOptions): Promise<void> {
    saveWithCas(
      this.episodes,
      episode.episodeId,
      {
        aggregateType: "Episode",
        persistenceSchemaVersion: 1,
        ...episode.toSnapshot(),
      },
      options,
    );
  }

  async listEpisodes(): Promise<readonly EpisodeAggregate[]> {
    return [...this.episodes.values()].map((row) => EpisodeAggregate.hydrate(row));
  }

  async getSubmissionPromotionRecord(
    promotionRecordId: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined> {
    const row = this.submissionPromotions.get(promotionRecordId);
    return row ? SubmissionPromotionRecordDocument.hydrate(row) : undefined;
  }

  async saveSubmissionPromotionRecord(
    promotionRecord: SubmissionPromotionRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = promotionRecord.toSnapshot();
    assertUniqueSecondaryKey(
      this.promotionByEnvelopeRef,
      snapshot.submissionEnvelopeRef,
      promotionRecord.promotionRecordId,
      "DUPLICATE_PROMOTION_ENVELOPE_REF",
      "submissionEnvelopeRef",
    );
    assertUniqueSecondaryKey(
      this.promotionBySourceLineageRef,
      snapshot.sourceLineageRef,
      promotionRecord.promotionRecordId,
      "DUPLICATE_PROMOTION_SOURCE_LINEAGE_REF",
      "sourceLineageRef",
    );
    assertUniqueSecondaryKey(
      this.promotionByRequestLineageRef,
      snapshot.requestLineageRef,
      promotionRecord.promotionRecordId,
      "DUPLICATE_PROMOTION_REQUEST_LINEAGE_REF",
      "requestLineageRef",
    );
    assertUniqueSecondaryKey(
      this.promotionByReceiptConsistencyKey,
      snapshot.receiptConsistencyKey,
      promotionRecord.promotionRecordId,
      "DUPLICATE_PROMOTION_RECEIPT_CONSISTENCY_KEY",
      "receiptConsistencyKey",
    );
    assertUniqueSecondaryKey(
      this.promotionByStatusConsistencyKey,
      snapshot.statusConsistencyKey,
      promotionRecord.promotionRecordId,
      "DUPLICATE_PROMOTION_STATUS_CONSISTENCY_KEY",
      "statusConsistencyKey",
    );
    saveWithCas(
      this.submissionPromotions,
      promotionRecord.promotionRecordId,
      {
        aggregateType: "SubmissionPromotionRecord",
        persistenceSchemaVersion: 1,
        ...snapshot,
      },
      options,
    );
    setSecondaryKey(
      this.promotionByEnvelopeRef,
      snapshot.submissionEnvelopeRef,
      promotionRecord.promotionRecordId,
    );
    setSecondaryKey(
      this.promotionBySourceLineageRef,
      snapshot.sourceLineageRef,
      promotionRecord.promotionRecordId,
    );
    setSecondaryKey(
      this.promotionByRequestLineageRef,
      snapshot.requestLineageRef,
      promotionRecord.promotionRecordId,
    );
    setSecondaryKey(
      this.promotionByReceiptConsistencyKey,
      snapshot.receiptConsistencyKey,
      promotionRecord.promotionRecordId,
    );
    setSecondaryKey(
      this.promotionByStatusConsistencyKey,
      snapshot.statusConsistencyKey,
      promotionRecord.promotionRecordId,
    );
  }

  async findSubmissionPromotionRecordByEnvelope(
    submissionEnvelopeRef: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined> {
    const promotionRecordId = this.promotionByEnvelopeRef.get(submissionEnvelopeRef);
    const row = promotionRecordId
      ? this.submissionPromotions.get(promotionRecordId)
      : [...this.submissionPromotions.values()].find(
          (candidate) => candidate.submissionEnvelopeRef === submissionEnvelopeRef,
        );
    return row ? SubmissionPromotionRecordDocument.hydrate(row) : undefined;
  }

  async findSubmissionPromotionRecordBySourceLineage(
    sourceLineageRef: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined> {
    const promotionRecordId = this.promotionBySourceLineageRef.get(sourceLineageRef);
    const row = promotionRecordId
      ? this.submissionPromotions.get(promotionRecordId)
      : [...this.submissionPromotions.values()].find(
          (candidate) => candidate.sourceLineageRef === sourceLineageRef,
        );
    return row ? SubmissionPromotionRecordDocument.hydrate(row) : undefined;
  }

  async findSubmissionPromotionRecordByRequestLineage(
    requestLineageRef: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined> {
    const promotionRecordId = this.promotionByRequestLineageRef.get(requestLineageRef);
    const row = promotionRecordId
      ? this.submissionPromotions.get(promotionRecordId)
      : [...this.submissionPromotions.values()].find(
          (candidate) => candidate.requestLineageRef === requestLineageRef,
        );
    return row ? SubmissionPromotionRecordDocument.hydrate(row) : undefined;
  }

  async findSubmissionPromotionRecordByReceiptConsistencyKey(
    receiptConsistencyKey: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined> {
    const promotionRecordId = this.promotionByReceiptConsistencyKey.get(receiptConsistencyKey);
    const row = promotionRecordId
      ? this.submissionPromotions.get(promotionRecordId)
      : [...this.submissionPromotions.values()].find(
          (candidate) => candidate.receiptConsistencyKey === receiptConsistencyKey,
        );
    return row ? SubmissionPromotionRecordDocument.hydrate(row) : undefined;
  }

  async findSubmissionPromotionRecordByStatusConsistencyKey(
    statusConsistencyKey: string,
  ): Promise<SubmissionPromotionRecordDocument | undefined> {
    const promotionRecordId = this.promotionByStatusConsistencyKey.get(statusConsistencyKey);
    const row = promotionRecordId
      ? this.submissionPromotions.get(promotionRecordId)
      : [...this.submissionPromotions.values()].find(
          (candidate) => candidate.statusConsistencyKey === statusConsistencyKey,
        );
    return row ? SubmissionPromotionRecordDocument.hydrate(row) : undefined;
  }

  async listSubmissionPromotionRecords(): Promise<readonly SubmissionPromotionRecordDocument[]> {
    return [...this.submissionPromotions.values()].map((row) =>
      SubmissionPromotionRecordDocument.hydrate(row),
    );
  }

  async withPromotionBoundary<T>(operation: () => Promise<T>): Promise<T> {
    if (this.promotionBoundaryContext.getStore() === true) {
      return operation();
    }
    const prior = this.promotionBoundaryQueue;
    let release: (() => void) | undefined;
    this.promotionBoundaryQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prior;
    try {
      return await this.promotionBoundaryContext.run(true, operation);
    } finally {
      release?.();
    }
  }

  async applyDraftMutabilitySupersession(input: DraftMutabilitySupersessionReceipt): Promise<void> {
    const liveGrantRefs =
      this.liveDraftAccessGrantRefsByEnvelope.get(input.submissionEnvelopeRef) ?? new Set<string>();
    const liveLeaseRefs =
      this.liveDraftLeaseRefsByEnvelope.get(input.submissionEnvelopeRef) ?? new Set<string>();

    const requestedGrantRefs = new Set(input.supersededAccessGrantRefs);
    const requestedLeaseRefs = new Set(input.supersededDraftLeaseRefs);

    invariant(
      [...liveGrantRefs].every((ref) => requestedGrantRefs.has(ref)),
      "PROMOTION_REQUIRES_SUPERSEDING_ALL_LIVE_ACCESS_GRANTS",
      `Promotion for ${input.submissionEnvelopeRef} must supersede every live access grant.`,
    );
    invariant(
      [...liveLeaseRefs].every((ref) => requestedLeaseRefs.has(ref)),
      "PROMOTION_REQUIRES_SUPERSEDING_ALL_LIVE_DRAFT_LEASES",
      `Promotion for ${input.submissionEnvelopeRef} must supersede every live draft lease.`,
    );

    for (const grantRef of requestedGrantRefs) {
      liveGrantRefs.delete(grantRef);
    }
    for (const leaseRef of requestedLeaseRefs) {
      liveLeaseRefs.delete(leaseRef);
    }

    this.liveDraftAccessGrantRefsByEnvelope.set(input.submissionEnvelopeRef, liveGrantRefs);
    this.liveDraftLeaseRefsByEnvelope.set(input.submissionEnvelopeRef, liveLeaseRefs);
    this.draftMutabilitySupersessionReceipts.push({
      ...input,
      supersededAccessGrantRefs: uniqueSortedRefs(input.supersededAccessGrantRefs),
      supersededDraftLeaseRefs: uniqueSortedRefs(input.supersededDraftLeaseRefs),
    });
  }

  seedDraftAccessGrant(submissionEnvelopeRef: string, accessGrantRef: string): void {
    const current =
      this.liveDraftAccessGrantRefsByEnvelope.get(submissionEnvelopeRef) ?? new Set<string>();
    current.add(requireRef(accessGrantRef, "accessGrantRef"));
    this.liveDraftAccessGrantRefsByEnvelope.set(submissionEnvelopeRef, current);
  }

  seedDraftLease(submissionEnvelopeRef: string, draftLeaseRef: string): void {
    const current =
      this.liveDraftLeaseRefsByEnvelope.get(submissionEnvelopeRef) ?? new Set<string>();
    current.add(requireRef(draftLeaseRef, "draftLeaseRef"));
    this.liveDraftLeaseRefsByEnvelope.set(submissionEnvelopeRef, current);
  }

  getDraftMutabilitySnapshot(submissionEnvelopeRef: string) {
    return {
      liveAccessGrantRefs: uniqueSortedRefs([
        ...(this.liveDraftAccessGrantRefsByEnvelope.get(submissionEnvelopeRef) ?? []),
      ]),
      liveDraftLeaseRefs: uniqueSortedRefs([
        ...(this.liveDraftLeaseRefsByEnvelope.get(submissionEnvelopeRef) ?? []),
      ]),
    };
  }

  listDraftMutabilitySupersessionReceipts(): readonly DraftMutabilitySupersessionReceipt[] {
    return this.draftMutabilitySupersessionReceipts.map((receipt) => ({
      ...receipt,
      supersededAccessGrantRefs: [...receipt.supersededAccessGrantRefs],
      supersededDraftLeaseRefs: [...receipt.supersededDraftLeaseRefs],
    }));
  }

  dumpPersistenceSnapshot() {
    return {
      submissionEnvelopes: [...this.submissionEnvelopes.values()],
      requests: [...this.requests.values()],
      requestLineages: [...this.requestLineages.values()],
      lineageCaseLinks: [...this.lineageCaseLinks.values()],
      episodes: [...this.episodes.values()],
      submissionPromotions: [...this.submissionPromotions.values()],
      draftMutabilitySupersessionReceipts: this.listDraftMutabilitySupersessionReceipts(),
    } as const;
  }
}

type SubmissionLineageEvent = SubmissionLineageEventEnvelope<unknown>;

export interface SubmissionBackboneDependencies
  extends SubmissionEnvelopeRepository,
    RequestRepository,
    RequestLineageRepository,
    LineageCaseLinkRepository,
    EpisodeRepository,
    SubmissionPromotionRecordRepository,
    SubmissionPromotionBoundaryRepository,
    DraftMutabilitySupersessionRepository {}

export interface CreateEnvelopeCommand extends Omit<CreateSubmissionEnvelopeInput, "envelopeId"> {
  envelopeId?: string;
}

export interface PromoteEnvelopeCommand {
  envelopeId: string;
  promotedAt: string;
  tenantId: string;
  requestType: string;
  episodeFingerprint: string;
  promotionCommandActionRecordRef: string;
  promotionCommandSettlementRecordRef: string;
  intakeExperienceBundleRef?: string;
  receiptConsistencyKey?: string;
  statusConsistencyKey?: string;
  patientJourneyLineageRef?: string;
  replayClass?: PromotionReplayClass;
  supersededAccessGrantRefs?: readonly string[];
  supersededDraftLeaseRefs?: readonly string[];
  narrativeRef?: string | null;
  structuredDataRef?: string | null;
  attachmentRefs?: readonly string[];
  contactPreferencesRef?: string | null;
  priorityBand?: string | null;
  pathwayRef?: string | null;
  assignedQueueRef?: string | null;
}

export interface BranchRequestLineageCommand {
  parentRequestLineageId: string;
  requestRef: string;
  branchClass: Extract<RequestLineageBranchClass, "same_episode_branch" | "related_episode_branch">;
  branchDecisionRef: string;
  continuityWitnessClass: Exclude<ContinuityWitnessClass, "envelope_promotion">;
  continuityWitnessRef: string;
  createdAt: string;
  requestLineageId?: string;
  episodeRef?: string;
  originEnvelopeRef?: string | null;
  submissionPromotionRecordRef?: string | null;
}

export interface ContinueRequestLineageCommand {
  requestLineageId: string;
  continuityWitnessClass: Exclude<ContinuityWitnessClass, "envelope_promotion">;
  continuityWitnessRef: string;
  updatedAt: string;
  latestTriageTaskRef?: string | null;
  latestDecisionEpochRef?: string | null;
}

export interface ProposeLineageCaseLinkCommand
  extends Omit<ProposeLineageCaseLinkInput, "lineageCaseLinkId"> {
  lineageCaseLinkId?: string;
}

export interface TransitionLineageCaseLinkCommand {
  lineageCaseLinkId: string;
  nextState: "acknowledged" | "active" | "returned" | "closed" | "superseded" | "compensated";
  updatedAt: string;
  latestMilestoneRef?: string | null;
  returnToTriageRef?: string | null;
  currentClosureBlockerRefs?: readonly string[];
  currentConfirmationGateRefs?: readonly string[];
}

export class SubmissionLineageCommandService {
  private readonly repositories: SubmissionBackboneDependencies;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    repositories: SubmissionBackboneDependencies,
    idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "submission_backbone",
    ),
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  async createEnvelope(command: CreateEnvelopeCommand) {
    const envelope = KernelSubmissionEnvelopeAggregate.create({
      ...command,
      envelopeId: command.envelopeId ?? this.idGenerator.nextId("submissionEnvelope"),
    });
    await this.repositories.saveSubmissionEnvelope(envelope);
    return {
      envelope,
      events: [
        emitIntakeDraftCreated({
          envelopeId: envelope.envelopeId,
          sourceChannel: command.sourceChannel,
          surfaceChannelProfile: command.initialSurfaceChannelProfile,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async appendEnvelopeIngress(command: {
    envelopeId: string;
    ingressRecordRef: string;
    updatedAt: string;
  }) {
    const envelope = await this.requireEnvelope(command.envelopeId);
    const nextEnvelope = envelope.appendIngress({
      ingressRecordRef: command.ingressRecordRef,
      updatedAt: command.updatedAt,
    });
    await this.repositories.saveSubmissionEnvelope(nextEnvelope, {
      expectedVersion: envelope.version,
    });
    return {
      envelope: nextEnvelope,
      events: [
        emitIntakeIngressRecorded({
          envelopeId: nextEnvelope.envelopeId,
          ingressRecordRef: command.ingressRecordRef,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async attachEnvelopeEvidence(command: {
    envelopeId: string;
    evidenceSnapshotRef: string;
    updatedAt: string;
  }) {
    const envelope = await this.requireEnvelope(command.envelopeId);
    const nextEnvelope = envelope.recordEvidenceSnapshot({
      evidenceSnapshotRef: command.evidenceSnapshotRef,
      updatedAt: command.updatedAt,
    });
    await this.repositories.saveSubmissionEnvelope(nextEnvelope, {
      expectedVersion: envelope.version,
    });
    return {
      envelope: nextEnvelope,
      events: [
        emitRequestSnapshotCreated({
          envelopeId: nextEnvelope.envelopeId,
          evidenceSnapshotRef: command.evidenceSnapshotRef,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async attachEnvelopeNormalization(command: {
    envelopeId: string;
    normalizedSubmissionRef: string;
    updatedAt: string;
    candidatePatientRefs?: readonly string[];
    candidateEpisodeRef?: string | null;
    candidateRequestRef?: string | null;
    verifiedSubjectRef?: string | null;
  }) {
    const envelope = await this.requireEnvelope(command.envelopeId);
    const nextEnvelope = envelope.recordNormalizedSubmission(command);
    await this.repositories.saveSubmissionEnvelope(nextEnvelope, {
      expectedVersion: envelope.version,
    });
    return {
      envelope: nextEnvelope,
      events: [
        emitIntakeNormalized({
          envelopeId: nextEnvelope.envelopeId,
          normalizedSubmissionRef: command.normalizedSubmissionRef,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async markEnvelopeReady(command: {
    envelopeId: string;
    promotionDecisionRef: string;
    updatedAt: string;
  }) {
    const envelope = await this.requireEnvelope(command.envelopeId);
    const nextEnvelope = envelope.markReadyToPromote(command);
    await this.repositories.saveSubmissionEnvelope(nextEnvelope, {
      expectedVersion: envelope.version,
    });
    return nextEnvelope;
  }

  async promoteEnvelope(command: PromoteEnvelopeCommand) {
    return this.repositories.withPromotionBoundary(async () => {
      const envelope = await this.requireEnvelope(command.envelopeId);
      const envelopeSnapshot = envelope.toSnapshot();
      const receiptConsistencyKey =
        command.receiptConsistencyKey ?? `receipt_consistency::${envelope.envelopeId}`;
      const statusConsistencyKey =
        command.statusConsistencyKey ?? `status_consistency::${envelope.envelopeId}`;

      const existingPromotionLookup = await this.resolvePromotionLookup({
        submissionEnvelopeRef: envelope.envelopeId,
        sourceLineageRef: envelopeSnapshot.sourceLineageRef,
        receiptConsistencyKey,
        statusConsistencyKey,
      });
      if (existingPromotionLookup) {
        return await this.buildReplayPromotionResult(
          existingPromotionLookup.lookupField,
          existingPromotionLookup.promotionRecord,
          command.replayClass ?? "exact_submit_replay",
        );
      }

      invariant(
        envelope.state !== "promoted",
        "PROMOTED_ENVELOPE_MISSING_PROMOTION_RECORD",
        `Envelope ${envelope.envelopeId} is marked promoted without a persisted SubmissionPromotionRecord.`,
      );

      const requestId = this.idGenerator.nextId("request");
      const requestLineageId = this.idGenerator.nextId("requestLineage");
      const promotionRecordId = this.idGenerator.nextId("submissionPromotionRecord");
      const episodeId = envelopeSnapshot.candidateEpisodeRef ?? this.idGenerator.nextId("episode");
      const promotionTimestamp = command.promotedAt;
      const intakeExperienceBundleRef =
        command.intakeExperienceBundleRef ?? `intake_bundle::${envelope.envelopeId}`;
      const patientJourneyLineageRef =
        command.patientJourneyLineageRef ?? `patient_journey::${requestLineageId}`;
      const requestEvidenceSnapshotRef = requireRef(
        envelopeSnapshot.latestEvidenceSnapshotRef,
        "latestEvidenceSnapshotRef",
      );
      const normalizedSubmissionRef = requireRef(
        envelopeSnapshot.currentNormalizedSubmissionRef,
        "currentNormalizedSubmissionRef",
      );
      const originIngressRecordRef = requireRef(
        envelopeSnapshot.latestIngressRecordRef,
        "latestIngressRecordRef",
      );

      const existingEpisode = await this.repositories.getEpisode(episodeId);
      const episodeBase =
        existingEpisode ??
        EpisodeAggregate.create({
          episodeId,
          episodeFingerprint: command.episodeFingerprint,
          openedAt: promotionTimestamp,
        });
      const requestLineage = KernelRequestLineageAggregate.create({
        requestLineageId,
        episodeRef: episodeId,
        requestRef: requestId,
        originEnvelopeRef: envelope.envelopeId,
        submissionPromotionRecordRef: promotionRecordId,
        continuityWitnessRef: promotionRecordId,
        createdAt: promotionTimestamp,
      });
      const request = KernelRequestAggregate.create({
        requestId,
        episodeId,
        originEnvelopeRef: envelope.envelopeId,
        promotionRecordRef: promotionRecordId,
        tenantId: command.tenantId,
        sourceChannel: envelopeSnapshot.sourceChannel,
        originIngressRecordRef,
        normalizedSubmissionRef,
        requestType: command.requestType,
        requestLineageRef: requestLineageId,
        createdAt: promotionTimestamp,
        narrativeRef: command.narrativeRef ?? null,
        structuredDataRef: command.structuredDataRef ?? null,
        attachmentRefs: command.attachmentRefs ?? [],
        contactPreferencesRef: command.contactPreferencesRef ?? null,
        priorityBand: command.priorityBand ?? null,
        pathwayRef: command.pathwayRef ?? null,
        assignedQueueRef: command.assignedQueueRef ?? null,
        currentEvidenceSnapshotRef: requestEvidenceSnapshotRef,
        patientRef: episodeBase.patientRef,
        currentIdentityBindingRef: episodeBase.currentIdentityBindingRef,
        identityState:
          episodeBase.patientRef && episodeBase.currentIdentityBindingRef ? "claimed" : "anonymous",
      });
      const promotionRecord = SubmissionPromotionRecordDocument.create({
        promotionRecordId,
        submissionEnvelopeRef: envelope.envelopeId,
        sourceLineageRef: envelopeSnapshot.sourceLineageRef,
        requestRef: requestId,
        requestLineageRef: requestLineageId,
        promotionCommandActionRecordRef: command.promotionCommandActionRecordRef,
        promotionCommandSettlementRecordRef: command.promotionCommandSettlementRecordRef,
        promotedEvidenceSnapshotRef: requestEvidenceSnapshotRef,
        promotedNormalizedSubmissionRef: normalizedSubmissionRef,
        promotedDraftVersion: envelope.version,
        intakeExperienceBundleRef,
        receiptConsistencyKey,
        statusConsistencyKey,
        patientJourneyLineageRef,
        supersededAccessGrantRefs: command.supersededAccessGrantRefs ?? [],
        supersededDraftLeaseRefs: command.supersededDraftLeaseRefs ?? [],
        createdAt: promotionTimestamp,
      });
      const nextEnvelope = envelope.promote({
        promotionRecordRef: promotionRecordId,
        promotedRequestRef: requestId,
        updatedAt: promotionTimestamp,
      });
      const nextEpisode = episodeBase.attachRequestMembership({
        requestRef: requestId,
        requestLineageRef: requestLineageId,
        updatedAt: promotionTimestamp,
      });

      await this.repositories.applyDraftMutabilitySupersession({
        submissionEnvelopeRef: envelope.envelopeId,
        sourceLineageRef: envelopeSnapshot.sourceLineageRef,
        promotionRecordRef: promotionRecordId,
        requestRef: requestId,
        requestLineageRef: requestLineageId,
        supersededAccessGrantRefs: command.supersededAccessGrantRefs ?? [],
        supersededDraftLeaseRefs: command.supersededDraftLeaseRefs ?? [],
        appliedAt: promotionTimestamp,
      });
      await this.repositories.saveSubmissionPromotionRecord(promotionRecord);
      await this.repositories.saveRequestLineage(requestLineage);
      await this.repositories.saveRequest(request);
      await this.repositories.saveEpisode(nextEpisode, {
        expectedVersion: existingEpisode?.version,
      });
      await this.repositories.saveSubmissionEnvelope(nextEnvelope, {
        expectedVersion: envelope.version,
      });

      const handoff = await this.materializeAuthoritativeRequestShell(
        "submissionEnvelopeRef",
        promotionRecord,
      );

      return {
        replayed: false as const,
        replayClass: null,
        lookupField: null,
        envelope: nextEnvelope,
        promotionRecord,
        request,
        requestLineage,
        episode: nextEpisode,
        handoff,
        events: [
          emitIntakePromotionStarted({
            envelopeId: envelope.envelopeId,
            sourceLineageRef: envelopeSnapshot.sourceLineageRef,
            receiptConsistencyKey,
            statusConsistencyKey,
          }),
          emitIntakePromotionSupersededGrantsApplied({
            envelopeId: envelope.envelopeId,
            promotionRecordId,
            supersededAccessGrantRefs: command.supersededAccessGrantRefs ?? [],
            supersededDraftLeaseRefs: command.supersededDraftLeaseRefs ?? [],
          }),
          emitIntakePromotionCommitted({
            envelopeId: envelope.envelopeId,
            promotionRecordId,
            requestId,
            requestLineageId,
            receiptConsistencyKey,
            statusConsistencyKey,
          }),
          emitIntakePromotionSettled({
            envelopeId: envelope.envelopeId,
            promotionRecordId,
            requestId,
            requestLineageId,
          }),
          emitRequestCreated({
            requestId,
            requestLineageId,
            episodeId,
            promotionRecordId,
          }),
          emitRequestSubmitted({
            requestId,
            workflowState: "submitted",
            sourceChannel: envelopeSnapshot.sourceChannel,
          }),
        ] satisfies readonly SubmissionLineageEvent[],
      };
    });
  }

  async resolveAuthoritativeRequestShell(query: {
    submissionEnvelopeRef?: string;
    sourceLineageRef?: string;
    requestLineageRef?: string;
    receiptConsistencyKey?: string;
    statusConsistencyKey?: string;
  }): Promise<AuthoritativeRequestShellHandoff> {
    const promotionLookup = await this.resolvePromotionLookup(query);
    invariant(
      !!promotionLookup,
      "AUTHORITATIVE_REQUEST_SHELL_NOT_FOUND",
      "No SubmissionPromotionRecord matched the supplied continuity keys.",
    );
    return this.materializeAuthoritativeRequestShell(
      promotionLookup.lookupField,
      promotionLookup.promotionRecord,
    );
  }

  async continueRequestLineage(command: ContinueRequestLineageCommand) {
    const lineage = await this.requireRequestLineage(command.requestLineageId);
    const nextLineage = lineage.recordContinuation(command);
    await this.repositories.saveRequestLineage(nextLineage, {
      expectedVersion: lineage.version,
    });
    return {
      requestLineage: nextLineage,
      events: [
        emitIntakeResumeContinuityUpdated({
          requestLineageId: nextLineage.requestLineageId,
          continuityWitnessClass: command.continuityWitnessClass,
          continuityWitnessRef: command.continuityWitnessRef,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async branchRequestLineage(command: BranchRequestLineageCommand) {
    const parentLineage = await this.requireRequestLineage(command.parentRequestLineageId);
    const request = await this.requireRequest(command.requestRef);
    const episodeRef =
      command.branchClass === "same_episode_branch"
        ? parentLineage.toSnapshot().episodeRef
        : requireRef(command.episodeRef ?? request.episodeId, "episodeRef");

    invariant(
      command.branchClass !== "related_episode_branch" ||
        episodeRef !== parentLineage.toSnapshot().episodeRef,
      "RELATED_EPISODE_BRANCH_REQUIRES_DISTINCT_EPISODE",
      "related_episode_branch must target a distinct episodeRef.",
    );
    invariant(
      command.branchClass !== "same_episode_branch" ||
        episodeRef === parentLineage.toSnapshot().episodeRef,
      "SAME_EPISODE_BRANCH_REQUIRES_SHARED_EPISODE",
      "same_episode_branch must stay in the same episode.",
    );

    const requestLineage = KernelRequestLineageAggregate.branch({
      requestLineageId: command.requestLineageId ?? this.idGenerator.nextId("requestLineage"),
      episodeRef,
      requestRef: request.requestId,
      originEnvelopeRef: command.originEnvelopeRef ?? parentLineage.toSnapshot().originEnvelopeRef,
      submissionPromotionRecordRef:
        command.submissionPromotionRecordRef ??
        parentLineage.toSnapshot().submissionPromotionRecordRef,
      branchClass: command.branchClass,
      branchDecisionRef: command.branchDecisionRef,
      continuityWitnessClass: command.continuityWitnessClass,
      continuityWitnessRef: command.continuityWitnessRef,
      createdAt: command.createdAt,
    });
    await this.repositories.saveRequestLineage(requestLineage);

    const episode = await this.requireEpisode(episodeRef);
    const nextEpisode = episode.attachRequestMembership({
      requestRef: request.requestId,
      requestLineageRef: requestLineage.requestLineageId,
      updatedAt: command.createdAt,
    });
    await this.repositories.saveEpisode(nextEpisode, {
      expectedVersion: episode.version,
    });

    return {
      requestLineage,
      episode: nextEpisode,
      events: [
        emitRequestLineageBranched({
          requestLineageId: requestLineage.requestLineageId,
          parentRequestLineageId: command.parentRequestLineageId,
          branchClass: command.branchClass,
          branchDecisionRef: command.branchDecisionRef,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async proposeLineageCaseLink(command: ProposeLineageCaseLinkCommand) {
    const lineage = await this.requireRequestLineage(command.requestLineageRef);
    invariant(
      lineage.requestRef === command.requestRef,
      "CASE_LINK_REQUEST_MISMATCH",
      "LineageCaseLink requestRef must align with the governing RequestLineage.",
    );

    const link = KernelLineageCaseLinkAggregate.propose({
      ...command,
      lineageCaseLinkId: command.lineageCaseLinkId ?? this.idGenerator.nextId("lineageCaseLink"),
    });
    await this.repositories.saveLineageCaseLink(link);
    return {
      link,
      events: [
        emitRequestLineageCaseLinkChanged({
          requestLineageId: command.requestLineageRef,
          lineageCaseLinkId: link.lineageCaseLinkId,
          ownershipState: link.ownershipState,
          caseFamily: command.caseFamily,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  async transitionLineageCaseLink(command: TransitionLineageCaseLinkCommand) {
    const currentLink = await this.requireLineageCaseLink(command.lineageCaseLinkId);
    const currentLinkSnapshot = currentLink.toSnapshot();
    const nextLink =
      command.currentClosureBlockerRefs !== undefined ||
      command.currentConfirmationGateRefs !== undefined ||
      command.latestMilestoneRef !== undefined
        ? currentLink
            .refreshOperationalFacts({
              currentClosureBlockerRefs: command.currentClosureBlockerRefs,
              currentConfirmationGateRefs: command.currentConfirmationGateRefs,
              latestMilestoneRef: command.latestMilestoneRef,
              updatedAt: command.updatedAt,
            })
            .transition(command)
        : currentLink.transition(command);
    await this.repositories.saveLineageCaseLink(nextLink, {
      expectedVersion: currentLink.version,
    });

    let requestLineage = await this.requireRequestLineage(currentLinkSnapshot.requestLineageRef);
    let request = await this.requireRequest(currentLinkSnapshot.requestRef);
    const activeLinks = await this.repositories.findActiveLineageCaseLinksForRequestLineage(
      currentLinkSnapshot.requestLineageRef,
    );
    const activeLinkRefs = activeLinks.map((link) => link.lineageCaseLinkId);

    if (command.nextState === "active") {
      requestLineage = requestLineage.updateSummary({
        latestLineageCaseLinkRef: nextLink.lineageCaseLinkId,
        activeLineageCaseLinkRefs: activeLinkRefs,
        updatedAt: command.updatedAt,
      });
      request = request.refreshLineageSummary({
        latestLineageCaseLinkRef: nextLink.lineageCaseLinkId,
        activeLineageCaseLinkRefs: activeLinkRefs,
        updatedAt: command.updatedAt,
      });
      await this.repositories.saveRequestLineage(requestLineage, {
        expectedVersion: requestLineage.version - 1,
      });
      await this.repositories.saveRequest(request, {
        expectedVersion: request.version - 1,
      });
    } else if (
      command.nextState === "returned" ||
      command.nextState === "closed" ||
      command.nextState === "superseded" ||
      command.nextState === "compensated"
    ) {
      const latestLineageCaseLinkRef = activeLinkRefs.at(-1) ?? nextLink.lineageCaseLinkId;
      requestLineage = requestLineage.updateSummary({
        latestLineageCaseLinkRef,
        activeLineageCaseLinkRefs: activeLinkRefs,
        updatedAt: command.updatedAt,
      });
      request = request.refreshLineageSummary({
        latestLineageCaseLinkRef,
        activeLineageCaseLinkRefs: activeLinkRefs,
        updatedAt: command.updatedAt,
      });
      await this.repositories.saveRequestLineage(requestLineage, {
        expectedVersion: requestLineage.version - 1,
      });
      await this.repositories.saveRequest(request, {
        expectedVersion: request.version - 1,
      });
    }

    return {
      link: nextLink,
      requestLineage,
      request,
      events: [
        emitRequestLineageCaseLinkChanged({
          requestLineageId: currentLinkSnapshot.requestLineageRef,
          lineageCaseLinkId: nextLink.lineageCaseLinkId,
          ownershipState: command.nextState,
          returnToTriageRef: command.returnToTriageRef ?? null,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  private async buildReplayPromotionResult(
    lookupField: PromotionLookupField,
    promotionRecord: SubmissionPromotionRecordDocument,
    replayClass: PromotionReplayClass,
  ) {
    const handoff = await this.materializeAuthoritativeRequestShell(lookupField, promotionRecord);
    return {
      replayed: true as const,
      replayClass,
      lookupField,
      envelope: handoff.envelope,
      promotionRecord,
      request: handoff.request,
      requestLineage: handoff.requestLineage,
      episode: handoff.episode,
      handoff,
      events: [
        emitIntakePromotionReplayReturned({
          envelopeId: handoff.envelope.envelopeId,
          promotionRecordId: promotionRecord.promotionRecordId,
          requestId: handoff.request.requestId,
          requestLineageId: handoff.requestLineage.requestLineageId,
          replayClass,
          lookupField,
        }),
      ] satisfies readonly SubmissionLineageEvent[],
    };
  }

  private async materializeAuthoritativeRequestShell(
    lookupField: PromotionLookupField,
    promotionRecord: SubmissionPromotionRecordDocument,
  ): Promise<AuthoritativeRequestShellHandoff> {
    const envelope = await this.requireEnvelope(promotionRecord.submissionEnvelopeRef);
    const request = await this.requireRequest(promotionRecord.requestRef);
    const requestLineage = await this.requireRequestLineage(promotionRecord.requestLineageRef);
    const episode = await this.requireEpisode(request.episodeId);
    const promotionSnapshot = promotionRecord.toSnapshot();
    return {
      lookupField,
      envelope,
      promotionRecord,
      request,
      requestLineage,
      episode,
      receiptConsistencyKey: promotionSnapshot.receiptConsistencyKey,
      statusConsistencyKey: promotionSnapshot.statusConsistencyKey,
      patientJourneyLineageRef: promotionSnapshot.patientJourneyLineageRef,
      redirectTarget: "authoritative_request_shell",
    };
  }

  private async resolvePromotionLookup(query: {
    submissionEnvelopeRef?: string;
    sourceLineageRef?: string;
    requestLineageRef?: string;
    receiptConsistencyKey?: string;
    statusConsistencyKey?: string;
  }): Promise<
    | {
        lookupField: PromotionLookupField;
        promotionRecord: SubmissionPromotionRecordDocument;
      }
    | undefined
  > {
    const matches = (
      await Promise.all([
        query.submissionEnvelopeRef
          ? this.repositories.findSubmissionPromotionRecordByEnvelope(query.submissionEnvelopeRef)
          : Promise.resolve(undefined),
        query.sourceLineageRef
          ? this.repositories.findSubmissionPromotionRecordBySourceLineage(query.sourceLineageRef)
          : Promise.resolve(undefined),
        query.requestLineageRef
          ? this.repositories.findSubmissionPromotionRecordByRequestLineage(query.requestLineageRef)
          : Promise.resolve(undefined),
        query.receiptConsistencyKey
          ? this.repositories.findSubmissionPromotionRecordByReceiptConsistencyKey(
              query.receiptConsistencyKey,
            )
          : Promise.resolve(undefined),
        query.statusConsistencyKey
          ? this.repositories.findSubmissionPromotionRecordByStatusConsistencyKey(
              query.statusConsistencyKey,
            )
          : Promise.resolve(undefined),
      ])
    )
      .map((promotionRecord, index) =>
        promotionRecord
          ? {
              lookupField: [
                "submissionEnvelopeRef",
                "sourceLineageRef",
                "requestLineageRef",
                "receiptConsistencyKey",
                "statusConsistencyKey",
              ][index] as PromotionLookupField,
              promotionRecord,
            }
          : undefined,
      )
      .filter(
        (
          match,
        ): match is {
          lookupField: PromotionLookupField;
          promotionRecord: SubmissionPromotionRecordDocument;
        } => Boolean(match),
      );

    if (matches.length === 0) {
      return undefined;
    }

    const promotionRecordIds = new Set(
      matches.map((match) => match.promotionRecord.promotionRecordId),
    );
    invariant(
      promotionRecordIds.size === 1,
      "PROMOTION_LOOKUP_CONFLICT",
      `Promotion lookup resolved to conflicting records ${[...promotionRecordIds].join(", ")}.`,
    );
    return matches[0];
  }

  private async requireEnvelope(envelopeId: string) {
    const envelope = await this.repositories.getSubmissionEnvelope(envelopeId);
    invariant(
      !!envelope,
      "SUBMISSION_ENVELOPE_NOT_FOUND",
      `Unknown SubmissionEnvelope ${envelopeId}.`,
    );
    return envelope;
  }

  private async requireRequest(requestId: string) {
    const request = await this.repositories.getRequest(requestId);
    invariant(!!request, "REQUEST_NOT_FOUND", `Unknown Request ${requestId}.`);
    return request;
  }

  private async requireRequestLineage(requestLineageId: string) {
    const lineage = await this.repositories.getRequestLineage(requestLineageId);
    invariant(
      !!lineage,
      "REQUEST_LINEAGE_NOT_FOUND",
      `Unknown RequestLineage ${requestLineageId}.`,
    );
    return lineage;
  }

  private async requireLineageCaseLink(lineageCaseLinkId: string) {
    const link = await this.repositories.getLineageCaseLink(lineageCaseLinkId);
    invariant(
      !!link,
      "LINEAGE_CASE_LINK_NOT_FOUND",
      `Unknown LineageCaseLink ${lineageCaseLinkId}.`,
    );
    return link;
  }

  private async requireEpisode(episodeId: string) {
    const episode = await this.repositories.getEpisode(episodeId);
    invariant(!!episode, "EPISODE_NOT_FOUND", `Unknown Episode ${episodeId}.`);
    return episode;
  }

  private async requireSubmissionPromotionRecordByEnvelope(submissionEnvelopeRef: string) {
    const promotionRecord =
      await this.repositories.findSubmissionPromotionRecordByEnvelope(submissionEnvelopeRef);
    invariant(
      !!promotionRecord,
      "SUBMISSION_PROMOTION_RECORD_NOT_FOUND",
      `Missing SubmissionPromotionRecord for envelope ${submissionEnvelopeRef}.`,
    );
    return promotionRecord;
  }
}

export function createSubmissionBackboneStore() {
  return new InMemorySubmissionLineageFoundationStore();
}

export function createSubmissionBackboneCommandService(
  repositories: SubmissionBackboneDependencies,
  idGenerator?: BackboneIdGenerator,
) {
  return new SubmissionLineageCommandService(repositories, idGenerator);
}
