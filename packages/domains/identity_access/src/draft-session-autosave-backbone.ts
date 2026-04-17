import { createHash } from "node:crypto";
import {
  type AccessGrantActionScope,
  type AccessGrantDocument,
  type AccessGrantScopeEnvelopeDocument,
  type AccessGrantSupersessionResult,
  createAccessGrantService,
  createIdentityAccessStore,
  hashAccessGrantToken,
  type IdentityAccessDependencies,
} from "./identity-access-backbone";
import {
  createSubmissionBackboneCommandService,
  createSubmissionBackboneStore,
  type SubmissionBackboneDependencies,
} from "./submission-lineage-backbone";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  type RequestAggregate,
  SubmissionEnvelopeAggregate,
} from "@vecells/domain-kernel";
import {
  emitIntakeDraftUpdated,
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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextDraftId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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

function toDraftPublicId(seed: string): string {
  return `dft_${stableDigest(seed).slice(0, 12)}`;
}

function toRequestPublicId(seed: string): string {
  return `req_${Buffer.from(seed, "utf8").toString("base64url").slice(0, 12)}`;
}

function toRequestPublicIdOrNull(seed: string | null | undefined): string | null {
  return seed ? toRequestPublicId(seed) : null;
}

function encodeResumeToken(grantToken: string): string {
  return `rtk_${Buffer.from(grantToken, "utf8").toString("base64url")}`;
}

function decodeResumeToken(resumeToken: string): string {
  invariant(
    resumeToken.startsWith("rtk_"),
    "RESUME_TOKEN_FORMAT_INVALID",
    "resumeToken must start with rtk_.",
  );
  return Buffer.from(resumeToken.slice(4), "base64url").toString("utf8");
}

function tokenKeyVersionFromGrantToken(grantToken: string): string {
  if (grantToken.startsWith("ag.")) {
    const [, tokenKeyVersionRef] = grantToken.split(".", 4);
    return requireRef(tokenKeyVersionRef, "tokenKeyVersionRef");
  }
  return "token_key_local_v1";
}

function envelopeMutationVersionRef(envelopeId: string): string {
  return `draft_mutation_lane::${envelopeId}`;
}

function touchEnvelopeForMutation(
  envelope: SubmissionEnvelopeAggregate,
  updatedAt: string,
): SubmissionEnvelopeAggregate {
  const snapshot = envelope.toSnapshot();
  return SubmissionEnvelopeAggregate.hydrate({
    ...snapshot,
    updatedAt,
    version: snapshot.version + 1,
  });
}

export type DraftLeaseMode = "foreground_mutating" | "background_read_only";
export type DraftSessionLeaseState = "live" | "superseded" | "expired" | "released";
export type DraftSaveAckState = "saved_authoritative" | "merge_required" | "recovery_required";
export type DraftRecoveryReason =
  | "lease_superseded"
  | "lease_expired"
  | "identity_rebind_required"
  | "storage_degraded"
  | "manifest_drift"
  | "channel_frozen"
  | "promoted_request_available"
  | "grant_scope_drift"
  | "grant_superseded";
export type DraftRecoveryState = "open" | "redirect_ready" | "resolved";
export type DraftMergeState = "open" | "resolved";
export type DraftContinuityState = "stable_writable" | "stable_read_only" | "recovery_only" | "blocked";
export type IntakeRequestType = "Symptoms" | "Meds" | "Admin" | "Results";
export type DraftStepKey =
  | "landing"
  | "request_type"
  | "details"
  | "supporting_files"
  | "contact_preferences"
  | "review_submit"
  | "resume_recovery"
  | "urgent_outcome"
  | "receipt_outcome"
  | "request_status";
export type IdentityContextState =
  | "anonymous"
  | "partial"
  | "verified"
  | "uplift_pending"
  | "identity_repair_required";

export interface DraftIdentityContextView {
  bindingState: IdentityContextState;
  subjectRefPresence: "none" | "masked" | "bound";
  claimResumeState: "not_required" | "pending" | "granted" | "blocked";
  actorBindingState: IdentityContextState;
}

export interface DraftContactPreferencesView {
  preferredChannel: "sms" | "phone" | "email";
  contactWindow: "weekday_daytime" | "weekday_evening" | "anytime";
  voicemailAllowed: boolean;
}

export interface DraftCapabilityCeilingView {
  canUploadFiles: boolean;
  canRenderTrackStatus: boolean;
  canRenderEmbedded: boolean;
  mutatingResumeState: "allowed" | "rebind_required" | "blocked";
}

export interface DraftUiJourneyStateView {
  currentStepKey: DraftStepKey;
  completedStepKeys: readonly DraftStepKey[];
  currentPathname: string;
  quietStatusState:
    | "draft_not_started"
    | "saving_local"
    | "saved_authoritative"
    | "resume_safely"
    | "submitting_authoritative"
    | "outcome_authoritative"
    | "status_authoritative";
  sameShellRecoveryState: "stable" | "recovery_only" | "blocked";
  shellContinuityKey: string;
  selectedAnchorKey: string;
}

export interface IntakeDraftView {
  draftPublicId: string;
  ingressChannel: "self_service_form";
  surfaceChannelProfile: "browser" | "embedded";
  intakeConvergenceContractRef: string;
  identityContext: DraftIdentityContextView;
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: DraftContactPreferencesView;
  channelCapabilityCeiling: DraftCapabilityCeilingView;
  draftVersion: number;
  lastSavedAt: string;
  resumeToken: string;
  uiJourneyState: DraftUiJourneyStateView;
  draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1";
}

export interface DraftSessionLeaseSnapshot {
  leaseId: string;
  envelopeRef: string;
  draftPublicId: string;
  accessGrantRef: string;
  grantScopeEnvelopeRef: string;
  leaseMode: DraftLeaseMode;
  leaseState: DraftSessionLeaseState;
  ownerActorBindingState: IdentityContextState;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: "released" | "monitoring" | "frozen";
  manifestVersionRef: string;
  sessionEpochRef: string | null;
  subjectBindingVersionRef: string | null;
  subjectRef: string | null;
  leaseEpoch: number;
  fencingToken: string;
  governingEnvelopeVersion: number;
  acquiredAt: string;
  expiresAt: string;
  supersededAt: string | null;
  supersededByLeaseRef: string | null;
  releaseReason: string | null;
  recoveryRecordRef: string | null;
  version: number;
}

export interface PersistedDraftSessionLeaseRow extends DraftSessionLeaseSnapshot {
  aggregateType: "DraftSessionLease";
  persistenceSchemaVersion: 1;
}

export class DraftSessionLeaseDocument {
  private readonly snapshot: DraftSessionLeaseSnapshot;

  private constructor(snapshot: DraftSessionLeaseSnapshot) {
    this.snapshot = DraftSessionLeaseDocument.normalize(snapshot);
  }

  static create(input: Omit<DraftSessionLeaseSnapshot, "version">): DraftSessionLeaseDocument {
    return new DraftSessionLeaseDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DraftSessionLeaseSnapshot): DraftSessionLeaseDocument {
    return new DraftSessionLeaseDocument(snapshot);
  }

  private static normalize(snapshot: DraftSessionLeaseSnapshot): DraftSessionLeaseSnapshot {
    invariant(snapshot.version >= 1, "INVALID_DRAFT_LEASE_VERSION", "DraftSessionLease.version must be >= 1.");
    if (snapshot.leaseState === "live") {
      invariant(
        snapshot.supersededAt === null && snapshot.supersededByLeaseRef === null,
        "LIVE_LEASE_MAY_NOT_BE_SUPERSEDED",
        "Live lease may not already reference a superseding lease.",
      );
    }
    return {
      ...snapshot,
      sessionEpochRef: optionalRef(snapshot.sessionEpochRef),
      subjectBindingVersionRef: optionalRef(snapshot.subjectBindingVersionRef),
      subjectRef: optionalRef(snapshot.subjectRef),
      supersededAt: optionalRef(snapshot.supersededAt),
      supersededByLeaseRef: optionalRef(snapshot.supersededByLeaseRef),
      releaseReason: optionalRef(snapshot.releaseReason),
      recoveryRecordRef: optionalRef(snapshot.recoveryRecordRef),
    };
  }

  get leaseId(): string {
    return this.snapshot.leaseId;
  }

  get envelopeRef(): string {
    return this.snapshot.envelopeRef;
  }

  get leaseMode(): DraftLeaseMode {
    return this.snapshot.leaseMode;
  }

  get leaseState(): DraftSessionLeaseState {
    return this.snapshot.leaseState;
  }

  get leaseEpoch(): number {
    return this.snapshot.leaseEpoch;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): DraftSessionLeaseSnapshot {
    return { ...this.snapshot };
  }

  supersede(input: {
    supersededAt: string;
    supersededByLeaseRef: string | null;
    releaseReason: string;
    recoveryRecordRef?: string | null;
  }): DraftSessionLeaseDocument {
    return new DraftSessionLeaseDocument({
      ...this.snapshot,
      leaseState: "superseded",
      supersededAt: input.supersededAt,
      supersededByLeaseRef: optionalRef(input.supersededByLeaseRef),
      releaseReason: requireRef(input.releaseReason, "releaseReason"),
      recoveryRecordRef: optionalRef(input.recoveryRecordRef),
      version: this.snapshot.version + 1,
    });
  }

  expire(input: { expiredAt: string; recoveryRecordRef?: string | null }): DraftSessionLeaseDocument {
    return new DraftSessionLeaseDocument({
      ...this.snapshot,
      leaseState: "expired",
      supersededAt: input.expiredAt,
      supersededByLeaseRef: null,
      releaseReason: "lease_expired",
      recoveryRecordRef: optionalRef(input.recoveryRecordRef),
      version: this.snapshot.version + 1,
    });
  }

  release(releasedAt: string): DraftSessionLeaseDocument {
    return new DraftSessionLeaseDocument({
      ...this.snapshot,
      leaseState: "released",
      supersededAt: releasedAt,
      supersededByLeaseRef: null,
      releaseReason: "released",
      version: this.snapshot.version + 1,
    });
  }
}

export interface DraftMutationRecordSnapshot {
  mutationId: string;
  envelopeRef: string;
  draftPublicId: string;
  leaseRef: string;
  clientCommandId: string;
  idempotencyKey: string;
  mutationKind: "autosave_patch";
  draftVersionBefore: number;
  draftVersionAfter: number;
  payloadHash: string;
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: DraftContactPreferencesView;
  currentStepKey: DraftStepKey;
  completedStepKeys: readonly DraftStepKey[];
  currentPathname: string;
  shellContinuityKey: string;
  selectedAnchorKey: string;
  recordedAt: string;
  version: number;
}

export interface PersistedDraftMutationRecordRow extends DraftMutationRecordSnapshot {
  aggregateType: "DraftMutationRecord";
  persistenceSchemaVersion: 1;
}

export class DraftMutationRecordDocument {
  private readonly snapshot: DraftMutationRecordSnapshot;

  private constructor(snapshot: DraftMutationRecordSnapshot) {
    this.snapshot = DraftMutationRecordDocument.normalize(snapshot);
  }

  static create(input: Omit<DraftMutationRecordSnapshot, "version">): DraftMutationRecordDocument {
    return new DraftMutationRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DraftMutationRecordSnapshot): DraftMutationRecordDocument {
    return new DraftMutationRecordDocument(snapshot);
  }

  private static normalize(snapshot: DraftMutationRecordSnapshot): DraftMutationRecordSnapshot {
    invariant(snapshot.version >= 1, "INVALID_DRAFT_MUTATION_VERSION", "DraftMutationRecord.version must be >= 1.");
    invariant(
      snapshot.draftVersionAfter > snapshot.draftVersionBefore,
      "DRAFT_MUTATION_VERSION_NON_INCREMENTING",
      "Draft mutations must increment the draft version.",
    );
    return {
      ...snapshot,
      attachmentRefs: uniqueSortedRefs(snapshot.attachmentRefs),
      completedStepKeys: [...new Set(snapshot.completedStepKeys)],
    };
  }

  get mutationId(): string {
    return this.snapshot.mutationId;
  }

  get idempotencyKey(): string {
    return this.snapshot.idempotencyKey;
  }

  get clientCommandId(): string {
    return this.snapshot.clientCommandId;
  }

  get payloadHash(): string {
    return this.snapshot.payloadHash;
  }

  toSnapshot(): DraftMutationRecordSnapshot {
    return {
      ...this.snapshot,
      attachmentRefs: [...this.snapshot.attachmentRefs],
      completedStepKeys: [...this.snapshot.completedStepKeys],
    };
  }
}

export interface DraftSaveSettlementSnapshot {
  settlementId: string;
  envelopeRef: string;
  draftPublicId: string;
  mutationRef: string;
  leaseRef: string;
  ackState: DraftSaveAckState;
  authoritativeDraftVersion: number;
  continuityProjectionRef: string | null;
  mergePlanRef: string | null;
  recoveryRecordRef: string | null;
  reasonCodes: readonly string[];
  recordedAt: string;
  version: number;
}

export interface PersistedDraftSaveSettlementRow extends DraftSaveSettlementSnapshot {
  aggregateType: "DraftSaveSettlement";
  persistenceSchemaVersion: 1;
}

export class DraftSaveSettlementDocument {
  private readonly snapshot: DraftSaveSettlementSnapshot;

  private constructor(snapshot: DraftSaveSettlementSnapshot) {
    this.snapshot = DraftSaveSettlementDocument.normalize(snapshot);
  }

  static create(input: Omit<DraftSaveSettlementSnapshot, "version">): DraftSaveSettlementDocument {
    return new DraftSaveSettlementDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DraftSaveSettlementSnapshot): DraftSaveSettlementDocument {
    return new DraftSaveSettlementDocument(snapshot);
  }

  private static normalize(snapshot: DraftSaveSettlementSnapshot): DraftSaveSettlementSnapshot {
    invariant(snapshot.version >= 1, "INVALID_DRAFT_SETTLEMENT_VERSION", "DraftSaveSettlement.version must be >= 1.");
    return {
      ...snapshot,
      continuityProjectionRef: optionalRef(snapshot.continuityProjectionRef),
      mergePlanRef: optionalRef(snapshot.mergePlanRef),
      recoveryRecordRef: optionalRef(snapshot.recoveryRecordRef),
      reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
    };
  }

  get settlementId(): string {
    return this.snapshot.settlementId;
  }

  get ackState(): DraftSaveAckState {
    return this.snapshot.ackState;
  }

  toSnapshot(): DraftSaveSettlementSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface DraftMergeConflictField {
  fieldRef: string;
  currentValueHash: string;
  attemptedValueHash: string;
}

export interface DraftMergePlanSnapshot {
  mergePlanId: string;
  envelopeRef: string;
  draftPublicId: string;
  mergeState: DraftMergeState;
  openedByLeaseRef: string;
  openedByMutationRef: string | null;
  expectedDraftVersion: number;
  actualDraftVersion: number;
  conflictingFieldRefs: readonly DraftMergeConflictField[];
  conflictingStepKey: DraftStepKey | null;
  conflictingAttachmentRefs: readonly string[];
  identityConflictState: "none" | "binding_drift" | "subject_drift";
  recommendedResolution: "refresh_and_retry" | "manual_merge";
  openedAt: string;
  resolvedAt: string | null;
  version: number;
}

export interface PersistedDraftMergePlanRow extends DraftMergePlanSnapshot {
  aggregateType: "DraftMergePlan";
  persistenceSchemaVersion: 1;
}

export class DraftMergePlanDocument {
  private readonly snapshot: DraftMergePlanSnapshot;

  private constructor(snapshot: DraftMergePlanSnapshot) {
    this.snapshot = DraftMergePlanDocument.normalize(snapshot);
  }

  static create(input: Omit<DraftMergePlanSnapshot, "version">): DraftMergePlanDocument {
    return new DraftMergePlanDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DraftMergePlanSnapshot): DraftMergePlanDocument {
    return new DraftMergePlanDocument(snapshot);
  }

  private static normalize(snapshot: DraftMergePlanSnapshot): DraftMergePlanSnapshot {
    invariant(snapshot.version >= 1, "INVALID_DRAFT_MERGE_PLAN_VERSION", "DraftMergePlan.version must be >= 1.");
    return {
      ...snapshot,
      openedByMutationRef: optionalRef(snapshot.openedByMutationRef),
      conflictingFieldRefs: [...snapshot.conflictingFieldRefs].sort((left, right) =>
        left.fieldRef.localeCompare(right.fieldRef),
      ),
      conflictingStepKey: (snapshot.conflictingStepKey ?? null) as DraftStepKey | null,
      conflictingAttachmentRefs: uniqueSortedRefs(snapshot.conflictingAttachmentRefs),
      resolvedAt: optionalRef(snapshot.resolvedAt),
    };
  }

  get mergePlanId(): string {
    return this.snapshot.mergePlanId;
  }

  get mergeState(): DraftMergeState {
    return this.snapshot.mergeState;
  }

  toSnapshot(): DraftMergePlanSnapshot {
    return {
      ...this.snapshot,
      conflictingFieldRefs: [...this.snapshot.conflictingFieldRefs],
      conflictingAttachmentRefs: [...this.snapshot.conflictingAttachmentRefs],
    };
  }
}

export interface DraftRecoveryRecordSnapshot {
  recoveryRecordId: string;
  envelopeRef: string;
  draftPublicId: string;
  leaseRef: string | null;
  sourceMutationRef: string | null;
  recoveryReason: DraftRecoveryReason;
  recoveryState: DraftRecoveryState;
  reasonCodes: readonly string[];
  sameShellRecoveryRouteRef: string;
  requestPublicId: string | null;
  promotedRequestRef: string | null;
  continuityProjectionRef: string | null;
  recordedAt: string;
  resolvedAt: string | null;
  version: number;
}

export interface PersistedDraftRecoveryRecordRow extends DraftRecoveryRecordSnapshot {
  aggregateType: "DraftRecoveryRecord";
  persistenceSchemaVersion: 1;
}

export class DraftRecoveryRecordDocument {
  private readonly snapshot: DraftRecoveryRecordSnapshot;

  private constructor(snapshot: DraftRecoveryRecordSnapshot) {
    this.snapshot = DraftRecoveryRecordDocument.normalize(snapshot);
  }

  static create(input: Omit<DraftRecoveryRecordSnapshot, "version">): DraftRecoveryRecordDocument {
    return new DraftRecoveryRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: DraftRecoveryRecordSnapshot): DraftRecoveryRecordDocument {
    return new DraftRecoveryRecordDocument(snapshot);
  }

  private static normalize(snapshot: DraftRecoveryRecordSnapshot): DraftRecoveryRecordSnapshot {
    invariant(snapshot.version >= 1, "INVALID_DRAFT_RECOVERY_VERSION", "DraftRecoveryRecord.version must be >= 1.");
    return {
      ...snapshot,
      leaseRef: optionalRef(snapshot.leaseRef),
      sourceMutationRef: optionalRef(snapshot.sourceMutationRef),
      reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
      requestPublicId: optionalRef(snapshot.requestPublicId),
      promotedRequestRef: optionalRef(snapshot.promotedRequestRef),
      continuityProjectionRef: optionalRef(snapshot.continuityProjectionRef),
      resolvedAt: optionalRef(snapshot.resolvedAt),
    };
  }

  get recoveryRecordId(): string {
    return this.snapshot.recoveryRecordId;
  }

  get recoveryReason(): DraftRecoveryReason {
    return this.snapshot.recoveryReason;
  }

  toSnapshot(): DraftRecoveryRecordSnapshot {
    return {
      ...this.snapshot,
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface DraftContinuityEvidenceProjectionSnapshot {
  projectionId: string;
  envelopeRef: string;
  draftPublicId: string;
  accessGrantRef: string;
  activeLeaseRef: string | null;
  continuityState: DraftContinuityState;
  quietStatusState: DraftUiJourneyStateView["quietStatusState"];
  sameShellRecoveryState: DraftUiJourneyStateView["sameShellRecoveryState"];
  lastSavedAt: string;
  authoritativeDraftVersion: number;
  latestMutationRef: string | null;
  latestSettlementRef: string | null;
  latestMergePlanRef: string | null;
  latestRecoveryRecordRef: string | null;
  resumeBlockedReasonCodes: readonly string[];
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: DraftContactPreferencesView;
  identityContext: DraftIdentityContextView;
  channelCapabilityCeiling: DraftCapabilityCeilingView;
  surfaceChannelProfile: "browser" | "embedded";
  ingressChannel: "self_service_form";
  intakeConvergenceContractRef: string;
  resumeToken: string;
  currentStepKey: DraftStepKey;
  completedStepKeys: readonly DraftStepKey[];
  currentPathname: string;
  shellContinuityKey: string;
  selectedAnchorKey: string;
  projectionHash: string;
  version: number;
}

export interface PersistedDraftContinuityEvidenceProjectionRow
  extends DraftContinuityEvidenceProjectionSnapshot {
  aggregateType: "DraftContinuityEvidenceProjection";
  persistenceSchemaVersion: 1;
}

function computeDraftContinuityProjectionHash(
  snapshot: Omit<DraftContinuityEvidenceProjectionSnapshot, "projectionHash" | "version">,
): string {
  return stableDigest(
    JSON.stringify({
      envelopeRef: snapshot.envelopeRef,
      draftPublicId: snapshot.draftPublicId,
      accessGrantRef: snapshot.accessGrantRef,
      activeLeaseRef: snapshot.activeLeaseRef,
      continuityState: snapshot.continuityState,
      quietStatusState: snapshot.quietStatusState,
      sameShellRecoveryState: snapshot.sameShellRecoveryState,
      authoritativeDraftVersion: snapshot.authoritativeDraftVersion,
      latestMutationRef: snapshot.latestMutationRef,
      latestSettlementRef: snapshot.latestSettlementRef,
      latestMergePlanRef: snapshot.latestMergePlanRef,
      latestRecoveryRecordRef: snapshot.latestRecoveryRecordRef,
      resumeBlockedReasonCodes: uniqueSortedRefs(snapshot.resumeBlockedReasonCodes),
      requestType: snapshot.requestType,
      structuredAnswers: snapshot.structuredAnswers,
      freeTextNarrative: snapshot.freeTextNarrative,
      attachmentRefs: uniqueSortedRefs(snapshot.attachmentRefs),
      contactPreferences: snapshot.contactPreferences,
      identityContext: snapshot.identityContext,
      channelCapabilityCeiling: snapshot.channelCapabilityCeiling,
      surfaceChannelProfile: snapshot.surfaceChannelProfile,
      intakeConvergenceContractRef: snapshot.intakeConvergenceContractRef,
      currentStepKey: snapshot.currentStepKey,
      completedStepKeys: [...snapshot.completedStepKeys],
      currentPathname: snapshot.currentPathname,
      shellContinuityKey: snapshot.shellContinuityKey,
      selectedAnchorKey: snapshot.selectedAnchorKey,
    }),
  );
}

export class DraftContinuityEvidenceProjectionDocument {
  private readonly snapshot: DraftContinuityEvidenceProjectionSnapshot;

  private constructor(snapshot: DraftContinuityEvidenceProjectionSnapshot) {
    this.snapshot = DraftContinuityEvidenceProjectionDocument.normalize(snapshot);
  }

  static create(
    input: Omit<DraftContinuityEvidenceProjectionSnapshot, "projectionHash" | "version">,
  ): DraftContinuityEvidenceProjectionDocument {
    return new DraftContinuityEvidenceProjectionDocument({
      ...input,
      projectionHash: computeDraftContinuityProjectionHash(input),
      version: 1,
    });
  }

  static hydrate(
    snapshot: DraftContinuityEvidenceProjectionSnapshot,
  ): DraftContinuityEvidenceProjectionDocument {
    return new DraftContinuityEvidenceProjectionDocument(snapshot);
  }

  private static normalize(
    snapshot: DraftContinuityEvidenceProjectionSnapshot,
  ): DraftContinuityEvidenceProjectionSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_DRAFT_CONTINUITY_VERSION",
      "DraftContinuityEvidenceProjection.version must be >= 1.",
    );
    const expectedHash = computeDraftContinuityProjectionHash({
      projectionId: snapshot.projectionId,
      envelopeRef: snapshot.envelopeRef,
      draftPublicId: snapshot.draftPublicId,
      accessGrantRef: snapshot.accessGrantRef,
      activeLeaseRef: snapshot.activeLeaseRef,
      continuityState: snapshot.continuityState,
      quietStatusState: snapshot.quietStatusState,
      sameShellRecoveryState: snapshot.sameShellRecoveryState,
      lastSavedAt: snapshot.lastSavedAt,
      authoritativeDraftVersion: snapshot.authoritativeDraftVersion,
      latestMutationRef: snapshot.latestMutationRef,
      latestSettlementRef: snapshot.latestSettlementRef,
      latestMergePlanRef: snapshot.latestMergePlanRef,
      latestRecoveryRecordRef: snapshot.latestRecoveryRecordRef,
      resumeBlockedReasonCodes: snapshot.resumeBlockedReasonCodes,
      requestType: snapshot.requestType,
      structuredAnswers: snapshot.structuredAnswers,
      freeTextNarrative: snapshot.freeTextNarrative,
      attachmentRefs: snapshot.attachmentRefs,
      contactPreferences: snapshot.contactPreferences,
      identityContext: snapshot.identityContext,
      channelCapabilityCeiling: snapshot.channelCapabilityCeiling,
      surfaceChannelProfile: snapshot.surfaceChannelProfile,
      ingressChannel: snapshot.ingressChannel,
      intakeConvergenceContractRef: snapshot.intakeConvergenceContractRef,
      resumeToken: snapshot.resumeToken,
      currentStepKey: snapshot.currentStepKey,
      completedStepKeys: snapshot.completedStepKeys,
      currentPathname: snapshot.currentPathname,
      shellContinuityKey: snapshot.shellContinuityKey,
      selectedAnchorKey: snapshot.selectedAnchorKey,
    });
    invariant(
      snapshot.projectionHash === expectedHash,
      "DRAFT_CONTINUITY_HASH_DRIFT",
      "DraftContinuityEvidenceProjection.projectionHash must match the projection content.",
    );
    return {
      ...snapshot,
      activeLeaseRef: optionalRef(snapshot.activeLeaseRef),
      latestMutationRef: optionalRef(snapshot.latestMutationRef),
      latestSettlementRef: optionalRef(snapshot.latestSettlementRef),
      latestMergePlanRef: optionalRef(snapshot.latestMergePlanRef),
      latestRecoveryRecordRef: optionalRef(snapshot.latestRecoveryRecordRef),
      resumeBlockedReasonCodes: uniqueSortedRefs(snapshot.resumeBlockedReasonCodes),
      attachmentRefs: uniqueSortedRefs(snapshot.attachmentRefs),
      completedStepKeys: [...new Set(snapshot.completedStepKeys)],
    };
  }

  get projectionId(): string {
    return this.snapshot.projectionId;
  }

  get draftPublicId(): string {
    return this.snapshot.draftPublicId;
  }

  get authoritativeDraftVersion(): number {
    return this.snapshot.authoritativeDraftVersion;
  }

  get activeLeaseRef(): string | null {
    return this.snapshot.activeLeaseRef;
  }

  toSnapshot(): DraftContinuityEvidenceProjectionSnapshot {
    return {
      ...this.snapshot,
      attachmentRefs: [...this.snapshot.attachmentRefs],
      completedStepKeys: [...this.snapshot.completedStepKeys],
      resumeBlockedReasonCodes: [...this.snapshot.resumeBlockedReasonCodes],
    };
  }

  toIntakeDraftView(): IntakeDraftView {
    return {
      draftPublicId: this.snapshot.draftPublicId,
      ingressChannel: this.snapshot.ingressChannel,
      surfaceChannelProfile: this.snapshot.surfaceChannelProfile,
      intakeConvergenceContractRef: this.snapshot.intakeConvergenceContractRef,
      identityContext: { ...this.snapshot.identityContext },
      requestType: this.snapshot.requestType,
      structuredAnswers: { ...this.snapshot.structuredAnswers },
      freeTextNarrative: this.snapshot.freeTextNarrative,
      attachmentRefs: [...this.snapshot.attachmentRefs],
      contactPreferences: { ...this.snapshot.contactPreferences },
      channelCapabilityCeiling: { ...this.snapshot.channelCapabilityCeiling },
      draftVersion: this.snapshot.authoritativeDraftVersion,
      lastSavedAt: this.snapshot.lastSavedAt,
      resumeToken: this.snapshot.resumeToken,
      uiJourneyState: {
        currentStepKey: this.snapshot.currentStepKey,
        completedStepKeys: [...this.snapshot.completedStepKeys],
        currentPathname: this.snapshot.currentPathname,
        quietStatusState: this.snapshot.quietStatusState,
        sameShellRecoveryState: this.snapshot.sameShellRecoveryState,
        shellContinuityKey: this.snapshot.shellContinuityKey,
        selectedAnchorKey: this.snapshot.selectedAnchorKey,
      },
      draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1",
    };
  }

  withSystemAttachmentRefs(input: {
    attachmentRefs: readonly string[];
    recordedAt: string;
    latestSettlementRef?: string | null;
    latestMutationRef?: string | null;
    quietStatusState?: DraftUiJourneyStateView["quietStatusState"];
  }): DraftContinuityEvidenceProjectionDocument {
    const nextSnapshot: DraftContinuityEvidenceProjectionSnapshot = {
      ...this.snapshot,
      attachmentRefs: uniqueSortedRefs(input.attachmentRefs),
      lastSavedAt: input.recordedAt,
      latestSettlementRef:
        input.latestSettlementRef === undefined
          ? this.snapshot.latestSettlementRef
          : optionalRef(input.latestSettlementRef),
      latestMutationRef:
        input.latestMutationRef === undefined
          ? this.snapshot.latestMutationRef
          : optionalRef(input.latestMutationRef),
      quietStatusState: input.quietStatusState ?? this.snapshot.quietStatusState,
      version: this.snapshot.version + 1,
      projectionHash: "",
    };
    nextSnapshot.projectionHash = computeDraftContinuityProjectionHash({
      projectionId: nextSnapshot.projectionId,
      envelopeRef: nextSnapshot.envelopeRef,
      draftPublicId: nextSnapshot.draftPublicId,
      accessGrantRef: nextSnapshot.accessGrantRef,
      activeLeaseRef: nextSnapshot.activeLeaseRef,
      continuityState: nextSnapshot.continuityState,
      quietStatusState: nextSnapshot.quietStatusState,
      sameShellRecoveryState: nextSnapshot.sameShellRecoveryState,
      lastSavedAt: nextSnapshot.lastSavedAt,
      authoritativeDraftVersion: nextSnapshot.authoritativeDraftVersion,
      latestMutationRef: nextSnapshot.latestMutationRef,
      latestSettlementRef: nextSnapshot.latestSettlementRef,
      latestMergePlanRef: nextSnapshot.latestMergePlanRef,
      latestRecoveryRecordRef: nextSnapshot.latestRecoveryRecordRef,
      resumeBlockedReasonCodes: nextSnapshot.resumeBlockedReasonCodes,
      requestType: nextSnapshot.requestType,
      structuredAnswers: nextSnapshot.structuredAnswers,
      freeTextNarrative: nextSnapshot.freeTextNarrative,
      attachmentRefs: nextSnapshot.attachmentRefs,
      contactPreferences: nextSnapshot.contactPreferences,
      identityContext: nextSnapshot.identityContext,
      channelCapabilityCeiling: nextSnapshot.channelCapabilityCeiling,
      surfaceChannelProfile: nextSnapshot.surfaceChannelProfile,
      ingressChannel: nextSnapshot.ingressChannel,
      intakeConvergenceContractRef: nextSnapshot.intakeConvergenceContractRef,
      resumeToken: nextSnapshot.resumeToken,
      currentStepKey: nextSnapshot.currentStepKey,
      completedStepKeys: nextSnapshot.completedStepKeys,
      currentPathname: nextSnapshot.currentPathname,
      shellContinuityKey: nextSnapshot.shellContinuityKey,
      selectedAnchorKey: nextSnapshot.selectedAnchorKey,
    });
    return new DraftContinuityEvidenceProjectionDocument(nextSnapshot);
  }
}

export type DraftResumeProjection = DraftContinuityEvidenceProjectionSnapshot;

export interface DraftResumeTokenState {
  draftPublicId: string;
  resumeToken: string;
  continuityState: DraftContinuityState;
  activeLeaseRef: string | null;
  resumeBlockedReasonCodes: readonly string[];
  mutatingResumeState: DraftCapabilityCeilingView["mutatingResumeState"];
  sameShellRecoveryRouteRef: string;
}

export interface DraftAutosavePatchEnvelope {
  draftVersion: number;
  clientCommandId: string;
  idempotencyKey: string;
  leaseId: string;
  resumeToken: string;
  requestType?: IntakeRequestType;
  structuredAnswers?: Record<string, unknown>;
  freeTextNarrative?: string;
  attachmentRefs?: readonly string[];
  contactPreferences?: Partial<DraftContactPreferencesView>;
  currentStepKey?: DraftStepKey;
  completedStepKeys?: readonly DraftStepKey[];
  currentPathname?: string;
  shellContinuityKey?: string;
  selectedAnchorKey?: string;
  recordedAt: string;
}

export interface DraftCreateCommand {
  requestType?: IntakeRequestType;
  surfaceChannelProfile: "browser" | "embedded";
  routeEntryRef: string;
  createdAt: string;
  routeFamilyRef?: string;
  routeIntentBindingRef?: string;
  audienceSurfaceRuntimeBindingRef?: string;
  releaseApprovalFreezeRef?: string;
  channelReleaseFreezeState?: "released" | "monitoring" | "frozen";
  manifestVersionRef?: string;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  subjectRef?: string | null;
  routePathname?: string;
  currentStepKey?: DraftStepKey;
  shellContinuityKey?: string;
  selectedAnchorKey?: string;
  intakeConvergenceContractRef?: string;
}

export interface DraftResumeCommand {
  draftPublicId: string;
  resumeToken: string;
  requestedLeaseMode?: DraftLeaseMode;
  routeFamilyRef?: string;
  routeIntentBindingRef?: string;
  audienceSurfaceRuntimeBindingRef?: string;
  releaseApprovalFreezeRef?: string;
  channelReleaseFreezeState?: "released" | "monitoring" | "frozen";
  manifestVersionRef?: string;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  subjectRef?: string | null;
  resumedAt: string;
}

export interface DraftRuntimeContext {
  routeFamilyRef: string;
  actionScope: AccessGrantActionScope;
  lineageScope: "envelope";
  routeIntentBindingRef: string;
  routeIntentBindingState: "live" | "drifted" | "superseded";
  audienceSurfaceRuntimeBindingRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeRef?: string | null;
  channelReleaseFreezeState: "released" | "monitoring" | "frozen";
  manifestVersionRef: string;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  subjectRef?: string | null;
  minimumBridgeCapabilitiesRef?: string | null;
  assuranceSliceTrustRefs?: readonly string[];
}

export interface DraftRecordRepositories {
  getDraftLease(leaseId: string): Promise<DraftSessionLeaseDocument | undefined>;
  saveDraftLease(lease: DraftSessionLeaseDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listDraftLeases(): Promise<readonly DraftSessionLeaseDocument[]>;
  findLiveForegroundLeaseForEnvelope(
    envelopeRef: string,
  ): Promise<DraftSessionLeaseDocument | undefined>;
  findDraftMutationByIdempotency(
    envelopeRef: string,
    idempotencyKey: string,
  ): Promise<DraftMutationRecordDocument | undefined>;
  findDraftMutationByClientCommand(
    envelopeRef: string,
    clientCommandId: string,
  ): Promise<DraftMutationRecordDocument | undefined>;
  getDraftMutation(mutationId: string): Promise<DraftMutationRecordDocument | undefined>;
  saveDraftMutation(record: DraftMutationRecordDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listDraftMutations(): Promise<readonly DraftMutationRecordDocument[]>;
  getDraftSaveSettlement(settlementId: string): Promise<DraftSaveSettlementDocument | undefined>;
  saveDraftSaveSettlement(
    settlement: DraftSaveSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDraftSaveSettlements(): Promise<readonly DraftSaveSettlementDocument[]>;
  getDraftMergePlan(mergePlanId: string): Promise<DraftMergePlanDocument | undefined>;
  saveDraftMergePlan(plan: DraftMergePlanDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listDraftMergePlans(): Promise<readonly DraftMergePlanDocument[]>;
  getDraftRecoveryRecord(recoveryRecordId: string): Promise<DraftRecoveryRecordDocument | undefined>;
  saveDraftRecoveryRecord(
    record: DraftRecoveryRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDraftRecoveryRecords(): Promise<readonly DraftRecoveryRecordDocument[]>;
  getDraftContinuityEvidenceProjection(
    projectionId: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument | undefined>;
  findDraftContinuityEvidenceProjectionByPublicId(
    draftPublicId: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument | undefined>;
  findDraftContinuityEvidenceProjectionByEnvelope(
    envelopeRef: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument | undefined>;
  saveDraftContinuityEvidenceProjection(
    projection: DraftContinuityEvidenceProjectionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listDraftContinuityEvidenceProjections(): Promise<
    readonly DraftContinuityEvidenceProjectionDocument[]
  >;
}

type SubmissionStoreWithSeedHooks = SubmissionBackboneDependencies & {
  seedDraftAccessGrant?(submissionEnvelopeRef: string, accessGrantRef: string): void;
  seedDraftLease?(submissionEnvelopeRef: string, draftLeaseRef: string): void;
  getDraftMutabilitySnapshot?(submissionEnvelopeRef: string): {
    liveAccessGrantRefs: readonly string[];
    liveDraftLeaseRefs: readonly string[];
  };
};

export interface DraftAutosaveDependencies
  extends SubmissionStoreWithSeedHooks,
    IdentityAccessDependencies,
    DraftRecordRepositories {}

export class InMemoryDraftAutosaveStore implements DraftAutosaveDependencies {
  private readonly submission = createSubmissionBackboneStore() as SubmissionStoreWithSeedHooks;
  private readonly access = createIdentityAccessStore();
  private readonly leases = new Map<string, PersistedDraftSessionLeaseRow>();
  private readonly mutations = new Map<string, PersistedDraftMutationRecordRow>();
  private readonly mutationByIdempotency = new Map<string, string>();
  private readonly mutationByClientCommand = new Map<string, string>();
  private readonly settlements = new Map<string, PersistedDraftSaveSettlementRow>();
  private readonly mergePlans = new Map<string, PersistedDraftMergePlanRow>();
  private readonly recoveries = new Map<string, PersistedDraftRecoveryRecordRow>();
  private readonly projections = new Map<string, PersistedDraftContinuityEvidenceProjectionRow>();
  private readonly projectionByDraftPublicId = new Map<string, string>();
  private readonly projectionByEnvelope = new Map<string, string>();

  async getSubmissionEnvelope(envelopeId: string) {
    return this.submission.getSubmissionEnvelope(envelopeId);
  }

  async saveSubmissionEnvelope(
    envelope: SubmissionEnvelopeAggregate,
    options?: CompareAndSetWriteOptions,
  ) {
    await this.submission.saveSubmissionEnvelope(envelope, options);
  }

  async findSubmissionEnvelopeBySourceLineage(sourceLineageRef: string) {
    return this.submission.findSubmissionEnvelopeBySourceLineage(sourceLineageRef);
  }

  async listSubmissionEnvelopes() {
    return this.submission.listSubmissionEnvelopes();
  }

  async getRequest(requestId: string) {
    return this.submission.getRequest(requestId);
  }

  async saveRequest(
    request: Parameters<SubmissionBackboneDependencies["saveRequest"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.submission.saveRequest(request, options);
    await this.access.saveRequest(request, options);
  }

  async listRequests() {
    return this.submission.listRequests();
  }

  async getRequestLineage(requestLineageId: string) {
    return this.submission.getRequestLineage(requestLineageId);
  }

  async saveRequestLineage(
    lineage: Parameters<SubmissionBackboneDependencies["saveRequestLineage"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.submission.saveRequestLineage(lineage, options);
  }

  async listRequestLineages() {
    return this.submission.listRequestLineages();
  }

  async getLineageCaseLink(lineageCaseLinkId: string) {
    return this.submission.getLineageCaseLink(lineageCaseLinkId);
  }

  async saveLineageCaseLink(
    link: Parameters<SubmissionBackboneDependencies["saveLineageCaseLink"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.submission.saveLineageCaseLink(link, options);
  }

  async findActiveLineageCaseLinksForRequestLineage(requestLineageId: string) {
    return this.submission.findActiveLineageCaseLinksForRequestLineage(requestLineageId);
  }

  async listLineageCaseLinks() {
    return this.submission.listLineageCaseLinks();
  }

  async getEpisode(episodeId: string) {
    return this.submission.getEpisode(episodeId);
  }

  async saveEpisode(
    episode: Parameters<SubmissionBackboneDependencies["saveEpisode"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.submission.saveEpisode(episode, options);
    await this.access.saveEpisode(episode, options);
  }

  async listEpisodes() {
    return this.submission.listEpisodes();
  }

  async saveSubmissionPromotionRecord(
    record: Parameters<SubmissionBackboneDependencies["saveSubmissionPromotionRecord"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.submission.saveSubmissionPromotionRecord(record, options);
  }

  async getSubmissionPromotionRecord(promotionRecordId: string) {
    return this.submission.getSubmissionPromotionRecord(promotionRecordId);
  }

  async findSubmissionPromotionRecordByEnvelope(submissionEnvelopeRef: string) {
    return this.submission.findSubmissionPromotionRecordByEnvelope(submissionEnvelopeRef);
  }

  async findSubmissionPromotionRecordBySourceLineage(sourceLineageRef: string) {
    return this.submission.findSubmissionPromotionRecordBySourceLineage(sourceLineageRef);
  }

  async findSubmissionPromotionRecordByRequestLineage(requestLineageRef: string) {
    return this.submission.findSubmissionPromotionRecordByRequestLineage(requestLineageRef);
  }

  async findSubmissionPromotionRecordByReceiptConsistencyKey(receiptConsistencyKey: string) {
    return this.submission.findSubmissionPromotionRecordByReceiptConsistencyKey(
      receiptConsistencyKey,
    );
  }

  async findSubmissionPromotionRecordByStatusConsistencyKey(statusConsistencyKey: string) {
    return this.submission.findSubmissionPromotionRecordByStatusConsistencyKey(statusConsistencyKey);
  }

  async listSubmissionPromotionRecords() {
    return this.submission.listSubmissionPromotionRecords();
  }

  async withPromotionBoundary<T>(operation: () => Promise<T>): Promise<T> {
    return this.submission.withPromotionBoundary(operation);
  }

  async applyDraftMutabilitySupersession(
    input: Parameters<SubmissionBackboneDependencies["applyDraftMutabilitySupersession"]>[0],
  ) {
    await this.submission.applyDraftMutabilitySupersession(input);
  }

  seedDraftAccessGrant(submissionEnvelopeRef: string, accessGrantRef: string): void {
    this.submission.seedDraftAccessGrant?.(submissionEnvelopeRef, accessGrantRef);
  }

  seedDraftLease(submissionEnvelopeRef: string, draftLeaseRef: string): void {
    this.submission.seedDraftLease?.(submissionEnvelopeRef, draftLeaseRef);
  }

  getDraftMutabilitySnapshot(submissionEnvelopeRef: string) {
    return (
      this.submission.getDraftMutabilitySnapshot?.(submissionEnvelopeRef) ?? {
        liveAccessGrantRefs: [],
        liveDraftLeaseRefs: [],
      }
    );
  }

  async getIdentityBinding(bindingId: string) {
    return this.access.getIdentityBinding(bindingId);
  }

  async saveIdentityBinding(
    binding: Parameters<IdentityAccessDependencies["saveIdentityBinding"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.access.saveIdentityBinding(binding, options);
  }

  async listIdentityBindings() {
    return this.access.listIdentityBindings();
  }

  async listIdentityBindingsForRequest(requestId: string) {
    return this.access.listIdentityBindingsForRequest(requestId);
  }

  async getPatientLink(patientLinkId: string) {
    return this.access.getPatientLink(patientLinkId);
  }

  async savePatientLink(
    link: Parameters<IdentityAccessDependencies["savePatientLink"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.access.savePatientLink(link, options);
  }

  async listPatientLinks() {
    return this.access.listPatientLinks();
  }

  async listPatientLinksForSubject(subjectRef: string) {
    return this.access.listPatientLinksForSubject(subjectRef);
  }

  async getAccessGrantScopeEnvelope(scopeEnvelopeId: string) {
    return this.access.getAccessGrantScopeEnvelope(scopeEnvelopeId);
  }

  async saveAccessGrantScopeEnvelope(
    scopeEnvelope: Parameters<IdentityAccessDependencies["saveAccessGrantScopeEnvelope"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.access.saveAccessGrantScopeEnvelope(scopeEnvelope, options);
  }

  async listAccessGrantScopeEnvelopes() {
    return this.access.listAccessGrantScopeEnvelopes();
  }

  async getAccessGrant(grantId: string) {
    return this.access.getAccessGrant(grantId);
  }

  async getAccessGrantByTokenHash(tokenHash: string) {
    return this.access.getAccessGrantByTokenHash(tokenHash);
  }

  async saveAccessGrant(
    grant: Parameters<IdentityAccessDependencies["saveAccessGrant"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.access.saveAccessGrant(grant, options);
  }

  async listAccessGrants() {
    return this.access.listAccessGrants();
  }

  async listAccessGrantsForGoverningObject(governingObjectRef: string) {
    return this.access.listAccessGrantsForGoverningObject(governingObjectRef);
  }

  async getAccessGrantRedemption(redemptionId: string) {
    return this.access.getAccessGrantRedemption(redemptionId);
  }

  async getAccessGrantRedemptionByGrant(grantRef: string) {
    return this.access.getAccessGrantRedemptionByGrant(grantRef);
  }

  async getAccessGrantRedemptionByGrantAndContext(grantRef: string, requestContextHash: string) {
    return this.access.getAccessGrantRedemptionByGrantAndContext(grantRef, requestContextHash);
  }

  async saveAccessGrantRedemption(
    redemption: Parameters<IdentityAccessDependencies["saveAccessGrantRedemption"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.access.saveAccessGrantRedemption(redemption, options);
  }

  async listAccessGrantRedemptions() {
    return this.access.listAccessGrantRedemptions();
  }

  async getAccessGrantSupersession(supersessionId: string) {
    return this.access.getAccessGrantSupersession(supersessionId);
  }

  async saveAccessGrantSupersession(
    supersession: Parameters<IdentityAccessDependencies["saveAccessGrantSupersession"]>[0],
    options?: CompareAndSetWriteOptions,
  ) {
    await this.access.saveAccessGrantSupersession(supersession, options);
  }

  async listAccessGrantSupersessions() {
    return this.access.listAccessGrantSupersessions();
  }

  async listAccessGrantSupersessionsForGrant(grantRef: string) {
    return this.access.listAccessGrantSupersessionsForGrant(grantRef);
  }

  async getDraftLease(leaseId: string): Promise<DraftSessionLeaseDocument | undefined> {
    const row = this.leases.get(leaseId);
    return row ? DraftSessionLeaseDocument.hydrate(row) : undefined;
  }

  async saveDraftLease(
    lease: DraftSessionLeaseDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = lease.toSnapshot();
    saveWithCas(
      this.leases,
      snapshot.leaseId,
      {
        ...snapshot,
        aggregateType: "DraftSessionLease",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listDraftLeases(): Promise<readonly DraftSessionLeaseDocument[]> {
    return [...this.leases.values()].map((row) => DraftSessionLeaseDocument.hydrate(row));
  }

  async findLiveForegroundLeaseForEnvelope(
    envelopeRef: string,
  ): Promise<DraftSessionLeaseDocument | undefined> {
    const row = [...this.leases.values()]
      .filter(
        (candidate) =>
          candidate.envelopeRef === envelopeRef &&
          candidate.leaseMode === "foreground_mutating" &&
          candidate.leaseState === "live",
      )
      .sort((left, right) => left.leaseEpoch - right.leaseEpoch)
      .at(-1);
    return row ? DraftSessionLeaseDocument.hydrate(row) : undefined;
  }

  async findDraftMutationByIdempotency(
    envelopeRef: string,
    idempotencyKey: string,
  ): Promise<DraftMutationRecordDocument | undefined> {
    const mutationId = this.mutationByIdempotency.get(`${envelopeRef}::${idempotencyKey}`);
    return mutationId ? this.getDraftMutation(mutationId) : undefined;
  }

  async findDraftMutationByClientCommand(
    envelopeRef: string,
    clientCommandId: string,
  ): Promise<DraftMutationRecordDocument | undefined> {
    const mutationId = this.mutationByClientCommand.get(`${envelopeRef}::${clientCommandId}`);
    return mutationId ? this.getDraftMutation(mutationId) : undefined;
  }

  async getDraftMutation(mutationId: string): Promise<DraftMutationRecordDocument | undefined> {
    const row = this.mutations.get(mutationId);
    return row ? DraftMutationRecordDocument.hydrate(row) : undefined;
  }

  async saveDraftMutation(
    record: DraftMutationRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = record.toSnapshot();
    const idempotencyKey = `${snapshot.envelopeRef}::${snapshot.idempotencyKey}`;
    const clientCommandKey = `${snapshot.envelopeRef}::${snapshot.clientCommandId}`;
    const currentIdempotency = this.mutationByIdempotency.get(idempotencyKey);
    const currentClientCommand = this.mutationByClientCommand.get(clientCommandKey);
    invariant(
      currentIdempotency === undefined || currentIdempotency === snapshot.mutationId,
      "DRAFT_IDEMPOTENCY_ALREADY_BOUND",
      "Draft idempotency key is already bound to another mutation.",
    );
    invariant(
      currentClientCommand === undefined || currentClientCommand === snapshot.mutationId,
      "DRAFT_CLIENT_COMMAND_ALREADY_BOUND",
      "clientCommandId is already bound to another mutation.",
    );
    saveWithCas(
      this.mutations,
      snapshot.mutationId,
      {
        ...snapshot,
        aggregateType: "DraftMutationRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.mutationByIdempotency.set(idempotencyKey, snapshot.mutationId);
    this.mutationByClientCommand.set(clientCommandKey, snapshot.mutationId);
  }

  async listDraftMutations(): Promise<readonly DraftMutationRecordDocument[]> {
    return [...this.mutations.values()].map((row) => DraftMutationRecordDocument.hydrate(row));
  }

  async getDraftSaveSettlement(
    settlementId: string,
  ): Promise<DraftSaveSettlementDocument | undefined> {
    const row = this.settlements.get(settlementId);
    return row ? DraftSaveSettlementDocument.hydrate(row) : undefined;
  }

  async saveDraftSaveSettlement(
    settlement: DraftSaveSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = settlement.toSnapshot();
    saveWithCas(
      this.settlements,
      snapshot.settlementId,
      {
        ...snapshot,
        aggregateType: "DraftSaveSettlement",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listDraftSaveSettlements(): Promise<readonly DraftSaveSettlementDocument[]> {
    return [...this.settlements.values()].map((row) => DraftSaveSettlementDocument.hydrate(row));
  }

  async getDraftMergePlan(mergePlanId: string): Promise<DraftMergePlanDocument | undefined> {
    const row = this.mergePlans.get(mergePlanId);
    return row ? DraftMergePlanDocument.hydrate(row) : undefined;
  }

  async saveDraftMergePlan(
    plan: DraftMergePlanDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = plan.toSnapshot();
    saveWithCas(
      this.mergePlans,
      snapshot.mergePlanId,
      {
        ...snapshot,
        aggregateType: "DraftMergePlan",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listDraftMergePlans(): Promise<readonly DraftMergePlanDocument[]> {
    return [...this.mergePlans.values()].map((row) => DraftMergePlanDocument.hydrate(row));
  }

  async getDraftRecoveryRecord(
    recoveryRecordId: string,
  ): Promise<DraftRecoveryRecordDocument | undefined> {
    const row = this.recoveries.get(recoveryRecordId);
    return row ? DraftRecoveryRecordDocument.hydrate(row) : undefined;
  }

  async saveDraftRecoveryRecord(
    record: DraftRecoveryRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = record.toSnapshot();
    saveWithCas(
      this.recoveries,
      snapshot.recoveryRecordId,
      {
        ...snapshot,
        aggregateType: "DraftRecoveryRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async listDraftRecoveryRecords(): Promise<readonly DraftRecoveryRecordDocument[]> {
    return [...this.recoveries.values()].map((row) => DraftRecoveryRecordDocument.hydrate(row));
  }

  async getDraftContinuityEvidenceProjection(
    projectionId: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument | undefined> {
    const row = this.projections.get(projectionId);
    return row ? DraftContinuityEvidenceProjectionDocument.hydrate(row) : undefined;
  }

  async findDraftContinuityEvidenceProjectionByPublicId(
    draftPublicId: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument | undefined> {
    const projectionId = this.projectionByDraftPublicId.get(draftPublicId);
    return projectionId ? this.getDraftContinuityEvidenceProjection(projectionId) : undefined;
  }

  async findDraftContinuityEvidenceProjectionByEnvelope(
    envelopeRef: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument | undefined> {
    const projectionId = this.projectionByEnvelope.get(envelopeRef);
    return projectionId ? this.getDraftContinuityEvidenceProjection(projectionId) : undefined;
  }

  async saveDraftContinuityEvidenceProjection(
    projection: DraftContinuityEvidenceProjectionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = projection.toSnapshot();
    const currentDraftProjection = this.projectionByDraftPublicId.get(snapshot.draftPublicId);
    const currentEnvelopeProjection = this.projectionByEnvelope.get(snapshot.envelopeRef);
    invariant(
      currentDraftProjection === undefined || currentDraftProjection === snapshot.projectionId,
      "DRAFT_PUBLIC_ID_ALREADY_BOUND",
      "draftPublicId is already bound to another continuity projection.",
    );
    invariant(
      currentEnvelopeProjection === undefined || currentEnvelopeProjection === snapshot.projectionId,
      "ENVELOPE_ALREADY_BOUND_TO_DRAFT_PROJECTION",
      "Envelope is already bound to another continuity projection.",
    );
    saveWithCas(
      this.projections,
      snapshot.projectionId,
      {
        ...snapshot,
        aggregateType: "DraftContinuityEvidenceProjection",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.projectionByDraftPublicId.set(snapshot.draftPublicId, snapshot.projectionId);
    this.projectionByEnvelope.set(snapshot.envelopeRef, snapshot.projectionId);
  }

  async listDraftContinuityEvidenceProjections(): Promise<
    readonly DraftContinuityEvidenceProjectionDocument[]
  > {
    return [...this.projections.values()].map((row) =>
      DraftContinuityEvidenceProjectionDocument.hydrate(row),
    );
  }
}

export function createDraftAutosaveStore(): DraftAutosaveDependencies {
  return new InMemoryDraftAutosaveStore();
}

function resolveDefaultIdentityContext(input: {
  subjectRef?: string | null;
  subjectBindingVersionRef?: string | null;
}): DraftIdentityContextView {
  if (input.subjectBindingVersionRef) {
    return {
      bindingState: "verified",
      subjectRefPresence: input.subjectRef ? "bound" : "masked",
      claimResumeState: "granted",
      actorBindingState: "verified",
    };
  }
  if (input.subjectRef) {
    return {
      bindingState: "partial",
      subjectRefPresence: "masked",
      claimResumeState: "pending",
      actorBindingState: "partial",
    };
  }
  return {
    bindingState: "anonymous",
    subjectRefPresence: "none",
    claimResumeState: "not_required",
    actorBindingState: "anonymous",
  };
}

function resolveCapabilityCeiling(input: {
  surfaceChannelProfile: "browser" | "embedded";
  mutatingResumeState?: DraftCapabilityCeilingView["mutatingResumeState"];
}): DraftCapabilityCeilingView {
  return {
    canUploadFiles: true,
    canRenderTrackStatus: true,
    canRenderEmbedded: input.surfaceChannelProfile === "embedded",
    mutatingResumeState: input.mutatingResumeState ?? "allowed",
  };
}

function mergeContactPreferences(
  current: DraftContactPreferencesView,
  patch?: Partial<DraftContactPreferencesView>,
): DraftContactPreferencesView {
  return {
    preferredChannel: patch?.preferredChannel ?? current.preferredChannel,
    contactWindow: patch?.contactWindow ?? current.contactWindow,
    voicemailAllowed: patch?.voicemailAllowed ?? current.voicemailAllowed,
  };
}

function buildMutationPayloadHash(input: {
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: DraftContactPreferencesView;
  currentStepKey: DraftStepKey;
  completedStepKeys: readonly DraftStepKey[];
  currentPathname: string;
  shellContinuityKey: string;
  selectedAnchorKey: string;
}): string {
  return stableDigest(JSON.stringify(input));
}

function createRecoveryRouteRef(draftPublicId: string): string {
  return `/intake/drafts/${draftPublicId}/recovery`;
}

function createReceiptRouteRef(requestPublicId: string): string {
  return `/intake/requests/${requestPublicId}/receipt`;
}

function createRequestStatusRouteRef(requestPublicId: string): string {
  return `/intake/requests/${requestPublicId}/status`;
}

function createUrgentOutcomeRouteRef(requestPublicId: string): string {
  return `/intake/requests/${requestPublicId}/urgent-guidance`;
}

function resolvePromotedRequestShellTarget(
  request: RequestAggregate | undefined,
  requestPublicId: string,
): {
  targetIntent: DraftRouteEntryTargetIntent;
  targetStepKey: DraftStepKey;
  targetPathname: string;
} {
  const requestSnapshot = request?.toSnapshot();
  if (
    requestSnapshot?.safetyState === "urgent_diverted" ||
    requestSnapshot?.currentUrgentDiversionSettlementRef
  ) {
    return {
      targetIntent: "open_urgent_guidance",
      targetStepKey: "urgent_outcome",
      targetPathname: createUrgentOutcomeRouteRef(requestPublicId),
    };
  }
  if (
    requestSnapshot?.workflowState === "triage_active" ||
    requestSnapshot?.workflowState === "handoff_active" ||
    requestSnapshot?.workflowState === "outcome_recorded" ||
    requestSnapshot?.workflowState === "closed"
  ) {
    return {
      targetIntent: "open_request_status",
      targetStepKey: "request_status",
      targetPathname: createRequestStatusRouteRef(requestPublicId),
    };
  }
  return {
    targetIntent: "open_request_receipt",
    targetStepKey: "receipt_outcome",
    targetPathname: createReceiptRouteRef(requestPublicId),
  };
}

function createLeaseFencingToken(leaseId: string, leaseEpoch: number): string {
  return stableDigest(`${leaseId}::${leaseEpoch}`).slice(0, 32);
}

function resolveGrantValidationFailure(input: {
  draftPublicId: string;
  reasonCodes: readonly string[];
  promotedRequestAvailable?: boolean;
}): { recoveryReason: DraftRecoveryReason; sameShellRecoveryState: DraftUiJourneyStateView["sameShellRecoveryState"]; mutatingResumeState: DraftCapabilityCeilingView["mutatingResumeState"] } {
  if (input.promotedRequestAvailable || input.reasonCodes.includes("PROMOTED_REQUEST_AVAILABLE")) {
    return {
      recoveryReason: "promoted_request_available",
      sameShellRecoveryState: "blocked",
      mutatingResumeState: "blocked",
    };
  }
  if (
    input.reasonCodes.includes("RELEASE_FREEZE_DRIFT") ||
    input.reasonCodes.includes("CHANNEL_FREEZE_DRIFT")
  ) {
    return {
      recoveryReason: "channel_frozen",
      sameShellRecoveryState: "blocked",
      mutatingResumeState: "blocked",
    };
  }
  if (
    input.reasonCodes.includes("IDENTITY_BINDING_REQUIRED") ||
    input.reasonCodes.includes("IDENTITY_BINDING_DRIFT") ||
    input.reasonCodes.includes("SUBJECT_BINDING_VERSION_DRIFT") ||
    input.reasonCodes.includes("SESSION_EPOCH_DRIFT")
  ) {
    return {
      recoveryReason: "identity_rebind_required",
      sameShellRecoveryState: "recovery_only",
      mutatingResumeState: "rebind_required",
    };
  }
  if (input.reasonCodes.includes("GRANT_ALREADY_SUPERSEDED")) {
    return {
      recoveryReason: "grant_superseded",
      sameShellRecoveryState: "recovery_only",
      mutatingResumeState: "blocked",
    };
  }
  if (input.reasonCodes.includes("GRANT_EXPIRED")) {
    return {
      recoveryReason: "lease_expired",
      sameShellRecoveryState: "recovery_only",
      mutatingResumeState: "rebind_required",
    };
  }
  return {
    recoveryReason: "grant_scope_drift",
    sameShellRecoveryState: "recovery_only",
    mutatingResumeState: "rebind_required",
  };
}

function validateGrantAgainstRuntime(
  grant: AccessGrantDocument,
  scopeEnvelope: AccessGrantScopeEnvelopeDocument,
  input: {
    envelopeRef: string;
    routeFamilyRef: string;
    routeIntentBindingRef: string;
    audienceSurfaceRuntimeBindingRef: string;
    releaseApprovalFreezeRef: string;
    manifestVersionRef: string;
    sessionEpochRef?: string | null;
    subjectBindingVersionRef?: string | null;
    channelReleaseFreezeState: "released" | "monitoring" | "frozen";
  },
): string[] {
  const grantSnapshot = grant.toSnapshot();
  const scopeSnapshot = scopeEnvelope.toSnapshot();
  const reasons: string[] = [];
  if (
    grantSnapshot.latestSupersessionRef ||
    grantSnapshot.supersededByGrantRef ||
    grantSnapshot.grantState === "superseded" ||
    grantSnapshot.grantState === "revoked"
  ) {
    reasons.push("GRANT_ALREADY_SUPERSEDED");
  }
  if (compareIso(new Date().toISOString(), grantSnapshot.expiresAt) >= 0) {
    reasons.push("GRANT_EXPIRED");
  }
  if (scopeSnapshot.governingObjectRef !== input.envelopeRef) {
    reasons.push("GOVERNING_OBJECT_DRIFT");
  }
  if (scopeSnapshot.routeFamilyRef !== input.routeFamilyRef) {
    reasons.push("ROUTE_FAMILY_DRIFT");
  }
  if (
    scopeSnapshot.issuedRouteIntentBindingRef &&
    scopeSnapshot.issuedRouteIntentBindingRef !== input.routeIntentBindingRef
  ) {
    reasons.push("ROUTE_INTENT_BINDING_DRIFT");
  }
  if (
    scopeSnapshot.requiredAudienceSurfaceRuntimeBindingRef &&
    scopeSnapshot.requiredAudienceSurfaceRuntimeBindingRef !== input.audienceSurfaceRuntimeBindingRef
  ) {
    reasons.push("AUDIENCE_RUNTIME_DRIFT");
  }
  if (
    scopeSnapshot.requiredReleaseApprovalFreezeRef &&
    scopeSnapshot.requiredReleaseApprovalFreezeRef !== input.releaseApprovalFreezeRef
  ) {
    reasons.push("RELEASE_FREEZE_DRIFT");
  }
  if (input.channelReleaseFreezeState === "frozen") {
    reasons.push("CHANNEL_FREEZE_DRIFT");
  }
  if (
    grantSnapshot.issuedSessionEpochRef &&
    grantSnapshot.issuedSessionEpochRef !== optionalRef(input.sessionEpochRef)
  ) {
    reasons.push("SESSION_EPOCH_DRIFT");
  }
  if (
    grantSnapshot.issuedSubjectBindingVersionRef &&
    grantSnapshot.issuedSubjectBindingVersionRef !== optionalRef(input.subjectBindingVersionRef)
  ) {
    reasons.push("SUBJECT_BINDING_VERSION_DRIFT");
  }
  if (!input.manifestVersionRef.startsWith("manifest_")) {
    reasons.push("MANIFEST_VERSION_DRIFT");
  }
  return uniqueSortedRefs(reasons);
}

export interface DraftCreateResult {
  envelope: SubmissionEnvelopeAggregate;
  view: IntakeDraftView;
  lease: DraftSessionLeaseDocument;
  continuityProjection: DraftContinuityEvidenceProjectionDocument;
  accessGrant: AccessGrantDocument;
  scopeEnvelope: AccessGrantScopeEnvelopeDocument;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface DraftResumeResult {
  view: IntakeDraftView;
  lease: DraftSessionLeaseDocument;
  continuityProjection: DraftContinuityEvidenceProjectionDocument;
  reusedExistingLease: boolean;
  recoveryRecord: DraftRecoveryRecordDocument | null;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export type DraftRouteEntryAuthorityState =
  | "draft_mutable"
  | "request_redirect"
  | "recovery_only"
  | "denied_scope";

export type DraftRouteEntryTargetIntent =
  | "resume_draft"
  | "open_request_receipt"
  | "open_request_status"
  | "open_urgent_guidance"
  | "resume_recovery"
  | "blocked_policy";

export type DraftRouteEntryProofState =
  | "grant_valid"
  | "grant_superseded_same_lineage"
  | "lease_same_lineage"
  | "none";

export interface DraftRouteEntryCommand {
  draftPublicId: string;
  resumeToken?: string | null;
  leaseId?: string | null;
  entrySurface?:
    | "draft_link"
    | "stale_tab"
    | "refresh"
    | "auth_return"
    | "embedded_reentry"
    | "browser_reentry";
  routeFamilyRef?: string;
  routeIntentBindingRef?: string;
  audienceSurfaceRuntimeBindingRef?: string;
  releaseApprovalFreezeRef?: string;
  channelReleaseFreezeState?: "released" | "monitoring" | "frozen";
  manifestVersionRef?: string;
  sessionEpochRef?: string | null;
  subjectBindingVersionRef?: string | null;
  subjectRef?: string | null;
  observedAt: string;
}

export interface DraftRouteEntryResolution {
  resolutionSchemaVersion: "PHASE1_PROMOTED_DRAFT_RESOLUTION_V1";
  draftPublicId: string;
  entryAuthorityState: DraftRouteEntryAuthorityState;
  targetIntent: DraftRouteEntryTargetIntent;
  targetStepKey: DraftStepKey;
  targetPathname: string;
  routeFamilyRef: string;
  requestPublicId: string | null;
  promotedRequestRef: string | null;
  receiptConsistencyKey: string | null;
  statusConsistencyKey: string | null;
  proofState: DraftRouteEntryProofState;
  mutatingResumeState: DraftCapabilityCeilingView["mutatingResumeState"];
  reasonCodes: readonly string[];
  continuityProjection: DraftContinuityEvidenceProjectionDocument;
  recoveryRecord: DraftRecoveryRecordDocument | null;
  lease: DraftSessionLeaseDocument | null;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface DraftPatchResult {
  replayed: boolean;
  view: IntakeDraftView;
  lease: DraftSessionLeaseDocument;
  continuityProjection: DraftContinuityEvidenceProjectionDocument;
  mutationRecord: DraftMutationRecordDocument | null;
  saveSettlement: DraftSaveSettlementDocument;
  mergePlan: DraftMergePlanDocument | null;
  recoveryRecord: DraftRecoveryRecordDocument | null;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface DraftPromotionSupersessionResult {
  draftPublicId: string;
  envelope: SubmissionEnvelopeAggregate;
  supersession: AccessGrantSupersessionResult | null;
  supersededLeases: readonly DraftSessionLeaseDocument[];
  continuityProjection: DraftContinuityEvidenceProjectionDocument;
  recoveryRecord: DraftRecoveryRecordDocument;
}

export class DraftSessionAutosaveService {
  private readonly repositories: DraftAutosaveDependencies;
  private readonly idGenerator: BackboneIdGenerator;
  private readonly submissionCommands: ReturnType<typeof createSubmissionBackboneCommandService>;
  private readonly accessGrantService: ReturnType<typeof createAccessGrantService>;

  constructor(
    repositories: DraftAutosaveDependencies,
    idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator("draft_autosave"),
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
    this.submissionCommands = createSubmissionBackboneCommandService(repositories, idGenerator);
    this.accessGrantService = createAccessGrantService(repositories, idGenerator);
  }

  async createDraft(command: DraftCreateCommand): Promise<DraftCreateResult> {
    const envelopeResult = await this.submissionCommands.createEnvelope({
      sourceChannel: "self_service_form",
      initialSurfaceChannelProfile: command.surfaceChannelProfile,
      intakeConvergenceContractRef:
        command.intakeConvergenceContractRef ?? "ICC_PHASE1_SELF_SERVICE_FORM_V1",
      sourceLineageRef: `source_lineage::${nextDraftId(this.idGenerator, "draftLineage")}`,
      createdAt: command.createdAt,
    });
    const envelope = envelopeResult.envelope;
    const draftPublicId = toDraftPublicId(envelope.envelopeId);
    const routeFamilyRef = command.routeFamilyRef ?? "rf_intake_self_service";
    const routeIntentBindingRef =
      command.routeIntentBindingRef ?? `RIB_144_${draftPublicId.toUpperCase()}_V1`;
    const audienceSurfaceRuntimeBindingRef =
      command.audienceSurfaceRuntimeBindingRef ?? "ASRB_050_PATIENT_PUBLIC_ENTRY_V1";
    const releaseApprovalFreezeRef =
      command.releaseApprovalFreezeRef ?? "release_freeze_phase1_self_service_v1";
    const channelReleaseFreezeState = command.channelReleaseFreezeState ?? "monitoring";
    const manifestVersionRef = command.manifestVersionRef ?? "manifest_phase1_browser_v1";
    const identityContext = resolveDefaultIdentityContext({
      subjectRef: command.subjectRef,
      subjectBindingVersionRef: command.subjectBindingVersionRef,
    });
    const issue = await this.accessGrantService.issueGrantForUseCase({
      useCase: "draft_resume",
      routeFamilyRef,
      governingObjectRef: envelope.envelopeId,
      governingVersionRef: envelopeMutationVersionRef(envelope.envelopeId),
      issuedRouteIntentBindingRef: routeIntentBindingRef,
      requiredReleaseApprovalFreezeRef: releaseApprovalFreezeRef,
      requiredAudienceSurfaceRuntimeBindingRef: audienceSurfaceRuntimeBindingRef,
      recoveryRouteRef: createRecoveryRouteRef(draftPublicId),
      tokenKeyVersionRef: "token_key_local_v1",
      issuedSessionEpochRef: command.sessionEpochRef ?? null,
      issuedSubjectBindingVersionRef: command.subjectBindingVersionRef ?? null,
      issuedLineageFenceEpoch: 1,
      presentedToken: "",
      expiresAt: new Date(Date.parse(command.createdAt) + 45 * 60_000).toISOString(),
      createdAt: command.createdAt,
      subjectRef: command.subjectRef ?? null,
      requiredIdentityBindingRef: null,
    });
    invariant(issue.outcome === "issued", "DRAFT_RESUME_GRANT_NOT_ISSUED", "Draft creation must issue a resume grant.");
    const accessGrant = issue.grant;
    const scopeEnvelope = issue.scopeEnvelope;
    const lease = DraftSessionLeaseDocument.create({
      leaseId: nextDraftId(this.idGenerator, "draftLease"),
      envelopeRef: envelope.envelopeId,
      draftPublicId,
      accessGrantRef: accessGrant.grantId,
      grantScopeEnvelopeRef: scopeEnvelope.scopeEnvelopeId,
      leaseMode: "foreground_mutating",
      leaseState: "live",
      ownerActorBindingState: identityContext.actorBindingState,
      routeFamilyRef,
      routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef,
      channelReleaseFreezeState,
      manifestVersionRef,
      sessionEpochRef: command.sessionEpochRef ?? null,
      subjectBindingVersionRef: command.subjectBindingVersionRef ?? null,
      subjectRef: command.subjectRef ?? null,
      leaseEpoch: 1,
      fencingToken: createLeaseFencingToken(draftPublicId, 1),
      governingEnvelopeVersion: envelope.version,
      acquiredAt: command.createdAt,
      expiresAt: issue.grant.toSnapshot().expiresAt,
      supersededAt: null,
      supersededByLeaseRef: null,
      releaseReason: null,
      recoveryRecordRef: null,
    });
    const resumeToken = encodeResumeToken(
      requireRef(issue.materializedToken?.opaqueToken, "resumeTokenOpaqueGrant"),
    );
    const currentStepKey = command.currentStepKey ?? (command.requestType ? "details" : "request_type");
    const completedStepKeys =
      currentStepKey === "details" ? (["request_type"] as const) : ([] as const);
    const currentPathname =
      command.routePathname ?? `/intake/drafts/${draftPublicId}/${currentStepKey.replaceAll("_", "-")}`;
    const continuityProjection = DraftContinuityEvidenceProjectionDocument.create({
      projectionId: nextDraftId(this.idGenerator, "draftContinuityProjection"),
      envelopeRef: envelope.envelopeId,
      draftPublicId,
      accessGrantRef: accessGrant.grantId,
      activeLeaseRef: lease.leaseId,
      continuityState: "stable_writable",
      quietStatusState: "saved_authoritative",
      sameShellRecoveryState: "stable",
      lastSavedAt: command.createdAt,
      authoritativeDraftVersion: 1,
      latestMutationRef: null,
      latestSettlementRef: null,
      latestMergePlanRef: null,
      latestRecoveryRecordRef: null,
      resumeBlockedReasonCodes: [],
      requestType: command.requestType ?? "Symptoms",
      structuredAnswers: {},
      freeTextNarrative: "",
      attachmentRefs: [],
      contactPreferences: {
        preferredChannel: "sms",
        contactWindow: "weekday_daytime",
        voicemailAllowed: true,
      },
      identityContext,
      channelCapabilityCeiling: resolveCapabilityCeiling({
        surfaceChannelProfile: command.surfaceChannelProfile,
      }),
      surfaceChannelProfile: command.surfaceChannelProfile,
      ingressChannel: "self_service_form",
      intakeConvergenceContractRef:
        command.intakeConvergenceContractRef ?? "ICC_PHASE1_SELF_SERVICE_FORM_V1",
      resumeToken,
      currentStepKey,
      completedStepKeys,
      currentPathname,
      shellContinuityKey: command.shellContinuityKey ?? "patient.portal.requests",
      selectedAnchorKey: command.selectedAnchorKey ?? "request-proof",
    });

    await this.repositories.saveDraftLease(lease);
    await this.repositories.saveDraftContinuityEvidenceProjection(continuityProjection);
    this.repositories.seedDraftAccessGrant?.(envelope.envelopeId, accessGrant.grantId);
    this.repositories.seedDraftLease?.(envelope.envelopeId, lease.leaseId);

    return {
      envelope,
      view: continuityProjection.toIntakeDraftView(),
      lease,
      continuityProjection,
      accessGrant,
      scopeEnvelope,
      events: [
        ...envelopeResult.events,
      ],
    };
  }

  async getDraftView(draftPublicId: string): Promise<IntakeDraftView> {
    const projection = await this.requireProjection(draftPublicId);
    return projection.toIntakeDraftView();
  }

  async resolveDraftRouteEntry(
    command: DraftRouteEntryCommand,
  ): Promise<DraftRouteEntryResolution> {
    const projection = await this.requireProjection(command.draftPublicId);
    const projectionSnapshot = projection.toSnapshot();
    const envelope = await this.requireEnvelope(projectionSnapshot.envelopeRef);
    const envelopeSnapshot = envelope.toSnapshot();
    const routeFamilyRef = command.routeFamilyRef ?? "rf_intake_self_service";
    const routeIntentBindingRef =
      command.routeIntentBindingRef ?? `RIB_154_${command.draftPublicId.toUpperCase()}_V1`;
    const audienceSurfaceRuntimeBindingRef =
      command.audienceSurfaceRuntimeBindingRef ?? "ASRB_050_PATIENT_PUBLIC_ENTRY_V1";
    const releaseApprovalFreezeRef =
      command.releaseApprovalFreezeRef ?? "release_freeze_phase1_self_service_v1";
    const manifestVersionRef = command.manifestVersionRef ?? "manifest_phase1_browser_v1";
    const channelReleaseFreezeState = command.channelReleaseFreezeState ?? "monitoring";
    const lease = command.leaseId ? await this.repositories.getDraftLease(command.leaseId) : undefined;
    const reasonCodes: string[] = [];
    let proofState: DraftRouteEntryProofState = "none";
    let mutatingResumeState: DraftCapabilityCeilingView["mutatingResumeState"] = "allowed";

    if (!command.resumeToken) {
      reasonCodes.push("DRAFT_RESUME_TOKEN_ABSENT");
    }

    const validation = command.resumeToken
      ? await this.validateResumeToken({
          draftPublicId: command.draftPublicId,
          envelopeRef: envelope.envelopeId,
          resumeToken: command.resumeToken,
          routeFamilyRef,
          routeIntentBindingRef,
          audienceSurfaceRuntimeBindingRef,
          releaseApprovalFreezeRef,
          manifestVersionRef,
          sessionEpochRef: command.sessionEpochRef ?? null,
          subjectBindingVersionRef: command.subjectBindingVersionRef ?? null,
          channelReleaseFreezeState,
        })
      : {
          grant: null,
          scopeEnvelope: null,
          reasonCodes: ["DRAFT_RESUME_TOKEN_ABSENT"] as readonly string[],
        };
    reasonCodes.push(...validation.reasonCodes);

    if (lease) {
      const leaseSnapshot = lease.toSnapshot();
      if (leaseSnapshot.draftPublicId !== command.draftPublicId) {
        reasonCodes.push("DRAFT_ENTRY_LEASE_DRAFT_MISMATCH");
      } else {
        proofState = "lease_same_lineage";
      }
      if (leaseSnapshot.leaseState !== "live") {
        reasonCodes.push("DRAFT_ENTRY_LEASE_NOT_LIVE");
      }
    } else if (command.leaseId) {
      reasonCodes.push("DRAFT_ENTRY_LEASE_NOT_FOUND");
    }

    if (validation.grant && validation.scopeEnvelope) {
      const scopeSnapshot = validation.scopeEnvelope.toSnapshot();
      if (scopeSnapshot.governingObjectRef === envelope.envelopeId) {
        proofState =
          validation.reasonCodes.length === 0
            ? "grant_valid"
            : validation.reasonCodes.includes("GRANT_ALREADY_SUPERSEDED")
              ? "grant_superseded_same_lineage"
              : proofState;
      }
    }

    const promotedRequestRef = optionalRef(envelopeSnapshot.promotedRequestRef);
    if (!promotedRequestRef && reasonCodes.length === 0) {
      return {
        resolutionSchemaVersion: "PHASE1_PROMOTED_DRAFT_RESOLUTION_V1",
        draftPublicId: command.draftPublicId,
        entryAuthorityState: "draft_mutable",
        targetIntent: "resume_draft",
        targetStepKey: projectionSnapshot.currentStepKey,
        targetPathname: projectionSnapshot.currentPathname,
        routeFamilyRef,
        requestPublicId: null,
        promotedRequestRef: null,
        receiptConsistencyKey: null,
        statusConsistencyKey: null,
        proofState,
        mutatingResumeState,
        reasonCodes: [],
        continuityProjection: projection,
        recoveryRecord: null,
        lease: lease ?? null,
        events: [],
      };
    }

    if (promotedRequestRef && proofState !== "none") {
      const recovery = await this.ensurePromotedRequestRecovery({
        projection,
        envelope,
        recordedAt: command.observedAt,
        reasonCodes: uniqueSortedRefs([
          ...reasonCodes,
          "PROMOTED_REQUEST_AVAILABLE",
          "GAP_RESOLVED_POST_PROMOTION_RECOVERY_ROUTE_ENTRY_V1",
        ]),
        leaseRef: lease?.leaseId ?? null,
      });
      const promotionRecord =
        await this.repositories.findSubmissionPromotionRecordByEnvelope(envelope.envelopeId);
      const request = await this.repositories.getRequest(promotedRequestRef);
      const requestPublicId = toRequestPublicId(promotedRequestRef);
      const target = resolvePromotedRequestShellTarget(request, requestPublicId);
      return {
        resolutionSchemaVersion: "PHASE1_PROMOTED_DRAFT_RESOLUTION_V1",
        draftPublicId: command.draftPublicId,
        entryAuthorityState: "request_redirect",
        targetIntent: target.targetIntent,
        targetStepKey: target.targetStepKey,
        targetPathname: target.targetPathname,
        routeFamilyRef,
        requestPublicId,
        promotedRequestRef,
        receiptConsistencyKey: promotionRecord?.toSnapshot().receiptConsistencyKey ?? null,
        statusConsistencyKey: promotionRecord?.toSnapshot().statusConsistencyKey ?? null,
        proofState,
        mutatingResumeState: "blocked",
        reasonCodes: recovery.recovery.toSnapshot().reasonCodes,
        continuityProjection: recovery.projection,
        recoveryRecord: recovery.recovery,
        lease: lease ?? null,
        events: recovery.events,
      };
    }

    const recovery = await this.openRecoveryForProjection({
      projection,
      lease,
      mutationRef: null,
      recordedAt: command.observedAt,
      reasonCodes: uniqueSortedRefs([
        ...reasonCodes,
        promotedRequestRef ? "PROMOTED_REQUEST_VIEW_NOT_GRANTED" : "DRAFT_ROUTE_ENTRY_RECOVERY_REQUIRED",
      ]),
      requestPublicId: null,
      promotedRequestRef: null,
    });
    mutatingResumeState = recovery.projection.toSnapshot().channelCapabilityCeiling.mutatingResumeState;
    return {
      resolutionSchemaVersion: "PHASE1_PROMOTED_DRAFT_RESOLUTION_V1",
      draftPublicId: command.draftPublicId,
      entryAuthorityState: promotedRequestRef ? "denied_scope" : "recovery_only",
      targetIntent: promotedRequestRef ? "blocked_policy" : "resume_recovery",
      targetStepKey: "resume_recovery",
      targetPathname: createRecoveryRouteRef(command.draftPublicId),
      routeFamilyRef,
      requestPublicId: null,
      promotedRequestRef: null,
      receiptConsistencyKey: null,
      statusConsistencyKey: null,
      proofState,
      mutatingResumeState,
      reasonCodes: recovery.recovery.toSnapshot().reasonCodes,
      continuityProjection: recovery.projection,
      recoveryRecord: recovery.recovery,
      lease: lease ?? recovery.syntheticLease,
      events: recovery.events,
    };
  }

  async resumeDraft(command: DraftResumeCommand): Promise<DraftResumeResult> {
    const projection = await this.requireProjection(command.draftPublicId);
    const envelope = await this.requireEnvelope(projection.toSnapshot().envelopeRef);
    const lease = await this.repositories.findLiveForegroundLeaseForEnvelope(envelope.envelopeId);
    const requestedLeaseMode = command.requestedLeaseMode ?? "foreground_mutating";
    const explicitLeaseModeRequest = command.requestedLeaseMode !== undefined;
    const runtimeRouteFamilyRef = command.routeFamilyRef ?? "rf_intake_self_service";
    const runtimeRouteIntentBindingRef =
      command.routeIntentBindingRef ?? `RIB_144_${command.draftPublicId.toUpperCase()}_V1`;
    const runtimeAudienceSurfaceRuntimeBindingRef =
      command.audienceSurfaceRuntimeBindingRef ?? "ASRB_050_PATIENT_PUBLIC_ENTRY_V1";
    const runtimeReleaseApprovalFreezeRef =
      command.releaseApprovalFreezeRef ?? "release_freeze_phase1_self_service_v1";
    const runtimeManifestVersionRef = command.manifestVersionRef ?? "manifest_phase1_browser_v1";
    const runtimeChannelReleaseFreezeState = command.channelReleaseFreezeState ?? "monitoring";
    const validation = await this.validateResumeToken({
      draftPublicId: command.draftPublicId,
      envelopeRef: envelope.envelopeId,
      resumeToken: command.resumeToken,
      routeFamilyRef: runtimeRouteFamilyRef,
      routeIntentBindingRef: runtimeRouteIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: runtimeAudienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: runtimeReleaseApprovalFreezeRef,
      manifestVersionRef: runtimeManifestVersionRef,
      sessionEpochRef: command.sessionEpochRef ?? null,
      subjectBindingVersionRef: command.subjectBindingVersionRef ?? null,
      channelReleaseFreezeState: runtimeChannelReleaseFreezeState,
    });
    if (validation.reasonCodes.length > 0) {
      const updatedProjection = await this.openRecoveryForProjection({
        projection,
        lease,
        mutationRef: null,
        recordedAt: command.resumedAt,
        reasonCodes: validation.reasonCodes,
        requestPublicId: toRequestPublicIdOrNull(envelope.toSnapshot().promotedRequestRef),
        promotedRequestRef: envelope.toSnapshot().promotedRequestRef,
      });
      return {
        view: updatedProjection.projection.toIntakeDraftView(),
        lease: lease ?? updatedProjection.syntheticLease,
        continuityProjection: updatedProjection.projection,
        reusedExistingLease: Boolean(lease),
        recoveryRecord: updatedProjection.recovery,
        events: updatedProjection.events,
      };
    }
    if (
      lease &&
      lease.toSnapshot().leaseState === "live" &&
      lease.toSnapshot().sessionEpochRef === optionalRef(command.sessionEpochRef) &&
      lease.toSnapshot().subjectBindingVersionRef === optionalRef(command.subjectBindingVersionRef) &&
      !explicitLeaseModeRequest
    ) {
      return {
        view: projection.toIntakeDraftView(),
        lease,
        continuityProjection: projection,
        reusedExistingLease: true,
        recoveryRecord: null,
        events: [],
      };
    }

    let recoveryRecord: DraftRecoveryRecordDocument | null = null;
    if (lease && lease.toSnapshot().leaseState === "live" && requestedLeaseMode === "foreground_mutating") {
      recoveryRecord = DraftRecoveryRecordDocument.create({
        recoveryRecordId: nextDraftId(this.idGenerator, "draftRecovery"),
        envelopeRef: envelope.envelopeId,
        draftPublicId: command.draftPublicId,
        leaseRef: lease.leaseId,
        sourceMutationRef: null,
        recoveryReason: "lease_superseded",
        recoveryState: "open",
        reasonCodes: ["LEASE_SUPERSEDED_BY_RESUME"],
        sameShellRecoveryRouteRef: createRecoveryRouteRef(command.draftPublicId),
        requestPublicId: null,
        promotedRequestRef: null,
        continuityProjectionRef: projection.projectionId,
        recordedAt: command.resumedAt,
        resolvedAt: null,
      });
      await this.repositories.saveDraftRecoveryRecord(recoveryRecord);
      const superseded = lease.supersede({
        supersededAt: command.resumedAt,
        supersededByLeaseRef: null,
        releaseReason: "lease_superseded",
        recoveryRecordRef: recoveryRecord.recoveryRecordId,
      });
      await this.repositories.saveDraftLease(superseded, { expectedVersion: lease.version });
    }

    invariant(
      validation.grant && validation.scopeEnvelope,
      "DRAFT_RESUME_VALIDATION_INCOMPLETE",
      "A live grant and scope envelope are required before opening a mutable resume lease.",
    );
    const nextEpoch = (lease?.toSnapshot().leaseEpoch ?? 0) + 1;
    const nextLease = DraftSessionLeaseDocument.create({
      leaseId: nextDraftId(this.idGenerator, "draftLease"),
      envelopeRef: envelope.envelopeId,
      draftPublicId: command.draftPublicId,
      accessGrantRef: validation.grant.grantId,
      grantScopeEnvelopeRef: validation.scopeEnvelope.scopeEnvelopeId,
      leaseMode: requestedLeaseMode,
      leaseState: "live",
      ownerActorBindingState: resolveDefaultIdentityContext({
        subjectRef: command.subjectRef,
        subjectBindingVersionRef: command.subjectBindingVersionRef,
      }).actorBindingState,
      routeFamilyRef: runtimeRouteFamilyRef,
      routeIntentBindingRef: runtimeRouteIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: runtimeAudienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: runtimeReleaseApprovalFreezeRef,
      channelReleaseFreezeState: runtimeChannelReleaseFreezeState,
      manifestVersionRef: runtimeManifestVersionRef,
      sessionEpochRef: command.sessionEpochRef ?? null,
      subjectBindingVersionRef: command.subjectBindingVersionRef ?? null,
      subjectRef: command.subjectRef ?? null,
      leaseEpoch: nextEpoch,
      fencingToken: createLeaseFencingToken(command.draftPublicId, nextEpoch),
      governingEnvelopeVersion: envelope.version,
      acquiredAt: command.resumedAt,
      expiresAt: validation.grant.toSnapshot().expiresAt,
      supersededAt: null,
      supersededByLeaseRef: null,
      releaseReason: null,
      recoveryRecordRef: null,
    });
    await this.repositories.saveDraftLease(nextLease);
    this.repositories.seedDraftLease?.(envelope.envelopeId, nextLease.leaseId);
    const nextProjection = DraftContinuityEvidenceProjectionDocument.hydrate({
      ...projection.toSnapshot(),
      activeLeaseRef:
        requestedLeaseMode === "background_read_only" && lease ? lease.leaseId : nextLease.leaseId,
      continuityState: requestedLeaseMode === "background_read_only" ? "stable_read_only" : "stable_writable",
      sameShellRecoveryState: "stable",
      channelCapabilityCeiling: resolveCapabilityCeiling({
        surfaceChannelProfile: projection.toSnapshot().surfaceChannelProfile,
        mutatingResumeState: requestedLeaseMode === "background_read_only" ? "rebind_required" : "allowed",
      }),
      latestRecoveryRecordRef: recoveryRecord?.recoveryRecordId ?? projection.toSnapshot().latestRecoveryRecordRef,
      projectionHash: computeDraftContinuityProjectionHash({
        ...projection.toSnapshot(),
        activeLeaseRef:
          requestedLeaseMode === "background_read_only" && lease ? lease.leaseId : nextLease.leaseId,
        continuityState: requestedLeaseMode === "background_read_only" ? "stable_read_only" : "stable_writable",
        sameShellRecoveryState: "stable",
        channelCapabilityCeiling: resolveCapabilityCeiling({
          surfaceChannelProfile: projection.toSnapshot().surfaceChannelProfile,
          mutatingResumeState: requestedLeaseMode === "background_read_only" ? "rebind_required" : "allowed",
        }),
        latestRecoveryRecordRef:
          recoveryRecord?.recoveryRecordId ?? projection.toSnapshot().latestRecoveryRecordRef,
      }),
      version: projection.toSnapshot().version + 1,
    });
    await this.repositories.saveDraftContinuityEvidenceProjection(nextProjection, {
      expectedVersion: projection.toSnapshot().version,
    });
    return {
      view: nextProjection.toIntakeDraftView(),
      lease: nextLease,
      continuityProjection: nextProjection,
      reusedExistingLease: false,
      recoveryRecord,
      events: [
        {
          eventType: "intake.resume.continuity.updated",
          emittedAt: command.resumedAt,
          payload: {
            draftPublicId: command.draftPublicId,
            continuityProjectionRef: nextProjection.projectionId,
            activeLeaseRef: nextLease.leaseId,
            continuityState: nextProjection.toSnapshot().continuityState,
          },
        },
      ],
    };
  }

  async patchDraft(
    draftPublicId: string,
    patch: DraftAutosavePatchEnvelope,
    runtime: DraftRuntimeContext,
  ): Promise<DraftPatchResult> {
    const projection = await this.requireProjection(draftPublicId);
    const envelope = await this.requireEnvelope(projection.toSnapshot().envelopeRef);
    const lease = await this.requireLease(patch.leaseId);
    invariant(
      lease.toSnapshot().draftPublicId === draftPublicId,
      "PATCH_LEASE_DRAFT_MISMATCH",
      "leaseId must belong to the addressed draftPublicId.",
    );
    const existingByIdempotency = await this.repositories.findDraftMutationByIdempotency(
      envelope.envelopeId,
      patch.idempotencyKey,
    );
    const candidateState = this.materializePatchedProjection(projection, patch);
    const candidatePayloadHash = buildMutationPayloadHash(candidateState.payloadHashInput);
    if (existingByIdempotency) {
      invariant(
        existingByIdempotency.payloadHash === candidatePayloadHash,
        "DRAFT_IDEMPOTENCY_PAYLOAD_MISMATCH",
        "idempotencyKey is already bound to a different patch payload.",
      );
      const existingSettlement = (await this.repositories.listDraftSaveSettlements()).find(
        (entry) => entry.toSnapshot().mutationRef === existingByIdempotency.mutationId,
      );
      invariant(existingSettlement, "DRAFT_SETTLEMENT_NOT_FOUND", "Existing idempotent patch is missing its settlement.");
      return {
        replayed: true,
        view: projection.toIntakeDraftView(),
        lease,
        continuityProjection: projection,
        mutationRecord: existingByIdempotency,
        saveSettlement: existingSettlement,
        mergePlan: null,
        recoveryRecord: null,
        events: [],
      };
    }
    const existingByClientCommand = await this.repositories.findDraftMutationByClientCommand(
      envelope.envelopeId,
      patch.clientCommandId,
    );
    if (existingByClientCommand) {
      invariant(
        existingByClientCommand.payloadHash === candidatePayloadHash,
        "DRAFT_CLIENT_COMMAND_PAYLOAD_MISMATCH",
        "clientCommandId is already bound to a different patch payload.",
      );
    }

    if (lease.toSnapshot().leaseMode !== "foreground_mutating") {
      const recovery = await this.openRecoveryForProjection({
        projection,
        lease,
        mutationRef: null,
        recordedAt: patch.recordedAt,
        reasonCodes: ["BACKGROUND_LEASE_MUTATION_FORBIDDEN"],
        requestPublicId: toRequestPublicIdOrNull(envelope.toSnapshot().promotedRequestRef),
        promotedRequestRef: envelope.toSnapshot().promotedRequestRef,
      });
      const settlement = DraftSaveSettlementDocument.create({
        settlementId: nextDraftId(this.idGenerator, "draftSaveSettlement"),
        envelopeRef: envelope.envelopeId,
        draftPublicId,
        mutationRef: "none",
        leaseRef: lease.leaseId,
        ackState: "recovery_required",
        authoritativeDraftVersion: projection.authoritativeDraftVersion,
        continuityProjectionRef: recovery.projection.projectionId,
        mergePlanRef: null,
        recoveryRecordRef: recovery.recovery.recoveryRecordId,
        reasonCodes: ["BACKGROUND_LEASE_MUTATION_FORBIDDEN"],
        recordedAt: patch.recordedAt,
      });
      await this.repositories.saveDraftSaveSettlement(settlement);
      return {
        replayed: false,
        view: recovery.projection.toIntakeDraftView(),
        lease,
        continuityProjection: recovery.projection,
        mutationRecord: null,
        saveSettlement: settlement,
        mergePlan: null,
        recoveryRecord: recovery.recovery,
        events: recovery.events,
      };
    }

    const validation = await this.validateResumeToken({
      draftPublicId,
      envelopeRef: envelope.envelopeId,
      resumeToken: patch.resumeToken,
      routeFamilyRef: runtime.routeFamilyRef,
      routeIntentBindingRef: runtime.routeIntentBindingRef,
      audienceSurfaceRuntimeBindingRef: runtime.audienceSurfaceRuntimeBindingRef,
      releaseApprovalFreezeRef: runtime.releaseApprovalFreezeRef,
      manifestVersionRef: runtime.manifestVersionRef,
      sessionEpochRef: runtime.sessionEpochRef ?? null,
      subjectBindingVersionRef: runtime.subjectBindingVersionRef ?? null,
      channelReleaseFreezeState: runtime.channelReleaseFreezeState,
    });
    if (validation.reasonCodes.length > 0 || lease.toSnapshot().leaseState !== "live") {
      const recovery = await this.openRecoveryForProjection({
        projection,
        lease,
        mutationRef: null,
        recordedAt: patch.recordedAt,
        reasonCodes:
          validation.reasonCodes.length > 0
            ? validation.reasonCodes
            : ["LEASE_NOT_LIVE"],
        requestPublicId: toRequestPublicIdOrNull(envelope.toSnapshot().promotedRequestRef),
        promotedRequestRef: envelope.toSnapshot().promotedRequestRef,
      });
      const settlement = DraftSaveSettlementDocument.create({
        settlementId: nextDraftId(this.idGenerator, "draftSaveSettlement"),
        envelopeRef: envelope.envelopeId,
        draftPublicId,
        mutationRef: "none",
        leaseRef: lease.leaseId,
        ackState: "recovery_required",
        authoritativeDraftVersion: projection.authoritativeDraftVersion,
        continuityProjectionRef: recovery.projection.projectionId,
        mergePlanRef: null,
        recoveryRecordRef: recovery.recovery.recoveryRecordId,
        reasonCodes:
          validation.reasonCodes.length > 0 ? validation.reasonCodes : ["LEASE_NOT_LIVE"],
        recordedAt: patch.recordedAt,
      });
      await this.repositories.saveDraftSaveSettlement(settlement);
      return {
        replayed: false,
        view: recovery.projection.toIntakeDraftView(),
        lease,
        continuityProjection: recovery.projection,
        mutationRecord: null,
        saveSettlement: settlement,
        mergePlan: null,
        recoveryRecord: recovery.recovery,
        events: recovery.events,
      };
    }

    const liveForegroundLease = await this.repositories.findLiveForegroundLeaseForEnvelope(
      envelope.envelopeId,
    );
    if (
      lease.toSnapshot().leaseMode === "foreground_mutating" &&
      liveForegroundLease &&
      liveForegroundLease.leaseId !== lease.leaseId
    ) {
      const recovery = await this.openRecoveryForProjection({
        projection,
        lease,
        mutationRef: null,
        recordedAt: patch.recordedAt,
        reasonCodes: ["LEASE_SUPERSEDED_BY_FOREGROUND_OWNER"],
        requestPublicId: toRequestPublicIdOrNull(envelope.toSnapshot().promotedRequestRef),
        promotedRequestRef: envelope.toSnapshot().promotedRequestRef,
      });
      const settlement = DraftSaveSettlementDocument.create({
        settlementId: nextDraftId(this.idGenerator, "draftSaveSettlement"),
        envelopeRef: envelope.envelopeId,
        draftPublicId,
        mutationRef: "none",
        leaseRef: lease.leaseId,
        ackState: "recovery_required",
        authoritativeDraftVersion: projection.authoritativeDraftVersion,
        continuityProjectionRef: recovery.projection.projectionId,
        mergePlanRef: null,
        recoveryRecordRef: recovery.recovery.recoveryRecordId,
        reasonCodes: ["LEASE_SUPERSEDED_BY_FOREGROUND_OWNER"],
        recordedAt: patch.recordedAt,
      });
      await this.repositories.saveDraftSaveSettlement(settlement);
      return {
        replayed: false,
        view: recovery.projection.toIntakeDraftView(),
        lease,
        continuityProjection: recovery.projection,
        mutationRecord: null,
        saveSettlement: settlement,
        mergePlan: null,
        recoveryRecord: recovery.recovery,
        events: recovery.events,
      };
    }

    if (patch.draftVersion !== projection.authoritativeDraftVersion) {
      const mergePlan = DraftMergePlanDocument.create({
        mergePlanId: nextDraftId(this.idGenerator, "draftMergePlan"),
        envelopeRef: envelope.envelopeId,
        draftPublicId,
        mergeState: "open",
        openedByLeaseRef: lease.leaseId,
        openedByMutationRef: null,
        expectedDraftVersion: patch.draftVersion,
        actualDraftVersion: projection.authoritativeDraftVersion,
        conflictingFieldRefs: [
          {
            fieldRef: "structuredAnswers",
            currentValueHash: stableDigest(JSON.stringify(projection.toSnapshot().structuredAnswers)),
            attemptedValueHash: stableDigest(JSON.stringify(candidateState.nextStructuredAnswers)),
          },
        ],
        conflictingStepKey: patch.currentStepKey ?? null,
        conflictingAttachmentRefs: patch.attachmentRefs ?? [],
        identityConflictState:
          lease.toSnapshot().subjectBindingVersionRef === optionalRef(runtime.subjectBindingVersionRef)
            ? "none"
            : "binding_drift",
        recommendedResolution: "refresh_and_retry",
        openedAt: patch.recordedAt,
        resolvedAt: null,
      });
      await this.repositories.saveDraftMergePlan(mergePlan);
      const nextProjection = DraftContinuityEvidenceProjectionDocument.hydrate({
        ...projection.toSnapshot(),
        continuityState: "recovery_only",
        quietStatusState: "resume_safely",
        sameShellRecoveryState: "recovery_only",
        latestMergePlanRef: mergePlan.mergePlanId,
        resumeBlockedReasonCodes: ["DRAFT_VERSION_CONFLICT"],
        channelCapabilityCeiling: resolveCapabilityCeiling({
          surfaceChannelProfile: projection.toSnapshot().surfaceChannelProfile,
          mutatingResumeState: "rebind_required",
        }),
        projectionHash: computeDraftContinuityProjectionHash({
          ...projection.toSnapshot(),
          continuityState: "recovery_only",
          quietStatusState: "resume_safely",
          sameShellRecoveryState: "recovery_only",
          latestMergePlanRef: mergePlan.mergePlanId,
          resumeBlockedReasonCodes: ["DRAFT_VERSION_CONFLICT"],
          channelCapabilityCeiling: resolveCapabilityCeiling({
            surfaceChannelProfile: projection.toSnapshot().surfaceChannelProfile,
            mutatingResumeState: "rebind_required",
          }),
        }),
        version: projection.toSnapshot().version + 1,
      });
      await this.repositories.saveDraftContinuityEvidenceProjection(nextProjection, {
        expectedVersion: projection.toSnapshot().version,
      });
      const settlement = DraftSaveSettlementDocument.create({
        settlementId: nextDraftId(this.idGenerator, "draftSaveSettlement"),
        envelopeRef: envelope.envelopeId,
        draftPublicId,
        mutationRef: "none",
        leaseRef: lease.leaseId,
        ackState: "merge_required",
        authoritativeDraftVersion: projection.authoritativeDraftVersion,
        continuityProjectionRef: nextProjection.projectionId,
        mergePlanRef: mergePlan.mergePlanId,
        recoveryRecordRef: null,
        reasonCodes: ["DRAFT_VERSION_CONFLICT"],
        recordedAt: patch.recordedAt,
      });
      await this.repositories.saveDraftSaveSettlement(settlement);
      return {
        replayed: false,
        view: nextProjection.toIntakeDraftView(),
        lease,
        continuityProjection: nextProjection,
        mutationRecord: null,
        saveSettlement: settlement,
        mergePlan,
        recoveryRecord: null,
        events: [
          emitIntakeDraftUpdated({
            envelopeId: envelope.envelopeId,
            draftPublicId,
            mutationRecordId: "none",
            draftVersion: projection.authoritativeDraftVersion,
            previousAckState: projection.toSnapshot().quietStatusState,
            nextAckState: "merge_required",
          }),
        ],
      };
    }

    const nextEnvelope = touchEnvelopeForMutation(envelope, patch.recordedAt);
    await this.repositories.saveSubmissionEnvelope(nextEnvelope, {
      expectedVersion: envelope.version,
    });
    const mutation = DraftMutationRecordDocument.create({
      mutationId: nextDraftId(this.idGenerator, "draftMutation"),
      envelopeRef: envelope.envelopeId,
      draftPublicId,
      leaseRef: lease.leaseId,
      clientCommandId: patch.clientCommandId,
      idempotencyKey: patch.idempotencyKey,
      mutationKind: "autosave_patch",
      draftVersionBefore: projection.authoritativeDraftVersion,
      draftVersionAfter: projection.authoritativeDraftVersion + 1,
      payloadHash: candidatePayloadHash,
      requestType: candidateState.nextRequestType,
      structuredAnswers: candidateState.nextStructuredAnswers,
      freeTextNarrative: candidateState.nextFreeTextNarrative,
      attachmentRefs: candidateState.nextAttachmentRefs,
      contactPreferences: candidateState.nextContactPreferences,
      currentStepKey: candidateState.nextCurrentStepKey,
      completedStepKeys: candidateState.nextCompletedStepKeys,
      currentPathname: candidateState.nextCurrentPathname,
      shellContinuityKey: candidateState.nextShellContinuityKey,
      selectedAnchorKey: candidateState.nextSelectedAnchorKey,
      recordedAt: patch.recordedAt,
    });
    await this.repositories.saveDraftMutation(mutation);
    const previewSettlementRef = nextDraftId(this.idGenerator, "draftSaveSettlement_preview");
    const nextProjection = DraftContinuityEvidenceProjectionDocument.hydrate({
      ...projection.toSnapshot(),
      activeLeaseRef: lease.leaseId,
      continuityState:
        lease.toSnapshot().leaseMode === "background_read_only"
          ? "stable_read_only"
          : "stable_writable",
      quietStatusState: "saved_authoritative",
      sameShellRecoveryState: "stable",
      lastSavedAt: patch.recordedAt,
      authoritativeDraftVersion: mutation.toSnapshot().draftVersionAfter,
      latestMutationRef: mutation.mutationId,
      latestSettlementRef: previewSettlementRef,
      latestMergePlanRef: null,
      latestRecoveryRecordRef: null,
      resumeBlockedReasonCodes: [],
      requestType: candidateState.nextRequestType,
      structuredAnswers: candidateState.nextStructuredAnswers,
      freeTextNarrative: candidateState.nextFreeTextNarrative,
      attachmentRefs: candidateState.nextAttachmentRefs,
      contactPreferences: candidateState.nextContactPreferences,
      currentStepKey: candidateState.nextCurrentStepKey,
      completedStepKeys: candidateState.nextCompletedStepKeys,
      currentPathname: candidateState.nextCurrentPathname,
      shellContinuityKey: candidateState.nextShellContinuityKey,
      selectedAnchorKey: candidateState.nextSelectedAnchorKey,
      projectionHash: computeDraftContinuityProjectionHash({
        ...projection.toSnapshot(),
        activeLeaseRef: lease.leaseId,
        continuityState:
          lease.toSnapshot().leaseMode === "background_read_only"
            ? "stable_read_only"
            : "stable_writable",
        quietStatusState: "saved_authoritative",
        sameShellRecoveryState: "stable",
        lastSavedAt: patch.recordedAt,
        authoritativeDraftVersion: mutation.toSnapshot().draftVersionAfter,
        latestMutationRef: mutation.mutationId,
        latestSettlementRef: previewSettlementRef,
        latestMergePlanRef: null,
        latestRecoveryRecordRef: null,
        resumeBlockedReasonCodes: [],
        requestType: candidateState.nextRequestType,
        structuredAnswers: candidateState.nextStructuredAnswers,
        freeTextNarrative: candidateState.nextFreeTextNarrative,
        attachmentRefs: candidateState.nextAttachmentRefs,
        contactPreferences: candidateState.nextContactPreferences,
        currentStepKey: candidateState.nextCurrentStepKey,
        completedStepKeys: candidateState.nextCompletedStepKeys,
        currentPathname: candidateState.nextCurrentPathname,
        shellContinuityKey: candidateState.nextShellContinuityKey,
        selectedAnchorKey: candidateState.nextSelectedAnchorKey,
      }),
      version: projection.toSnapshot().version + 1,
    });
    const settlement = DraftSaveSettlementDocument.create({
      settlementId: nextDraftId(this.idGenerator, "draftSaveSettlement"),
      envelopeRef: envelope.envelopeId,
      draftPublicId,
      mutationRef: mutation.mutationId,
      leaseRef: lease.leaseId,
      ackState: "saved_authoritative",
      authoritativeDraftVersion: mutation.toSnapshot().draftVersionAfter,
      continuityProjectionRef: nextProjection.projectionId,
      mergePlanRef: null,
      recoveryRecordRef: null,
      reasonCodes: ["CONTINUITY_PROOF_STABLE", "MUTATION_APPEND_ONLY_RECORDED"],
      recordedAt: patch.recordedAt,
    });
    const persistedProjection = DraftContinuityEvidenceProjectionDocument.hydrate({
      ...nextProjection.toSnapshot(),
      latestSettlementRef: settlement.settlementId,
      projectionHash: computeDraftContinuityProjectionHash({
        ...nextProjection.toSnapshot(),
        latestSettlementRef: settlement.settlementId,
      }),
      version: nextProjection.toSnapshot().version + 1,
    });
    await this.repositories.saveDraftContinuityEvidenceProjection(persistedProjection, {
      expectedVersion: projection.toSnapshot().version,
    });
    await this.repositories.saveDraftSaveSettlement(settlement);

    return {
      replayed: false,
      view: persistedProjection.toIntakeDraftView(),
      lease,
      continuityProjection: persistedProjection,
      mutationRecord: mutation,
      saveSettlement: settlement,
      mergePlan: null,
      recoveryRecord: null,
      events: [
        emitIntakeDraftUpdated({
          envelopeId: envelope.envelopeId,
          draftPublicId,
          mutationRecordId: mutation.mutationId,
          draftVersion: mutation.toSnapshot().draftVersionAfter,
          previousAckState: projection.toSnapshot().quietStatusState,
          nextAckState: "saved_authoritative",
        }),
        {
          eventType: "intake.resume.continuity.updated",
          emittedAt: patch.recordedAt,
          payload: {
            draftPublicId,
            continuityProjectionRef: persistedProjection.projectionId,
            activeLeaseRef: lease.leaseId,
            continuityState: persistedProjection.toSnapshot().continuityState,
          },
        },
      ],
    };
  }

  async supersedeDraftForPromotion(input: {
    draftPublicId: string;
    recordedAt: string;
    governingObjectRef?: string;
    reasonCodes?: readonly string[];
  }): Promise<DraftPromotionSupersessionResult> {
    const projection = await this.requireProjection(input.draftPublicId);
    const envelope = await this.requireEnvelope(projection.toSnapshot().envelopeRef);
    const projectionSnapshot = projection.toSnapshot();
    const existingRecovery = projectionSnapshot.latestRecoveryRecordRef
      ? await this.repositories.getDraftRecoveryRecord(projectionSnapshot.latestRecoveryRecordRef)
      : undefined;
    if (
      projectionSnapshot.continuityState === "blocked" &&
      existingRecovery?.toSnapshot().recoveryReason === "promoted_request_available" &&
      existingRecovery.toSnapshot().promotedRequestRef === envelope.toSnapshot().promotedRequestRef
    ) {
      const supersededLeases = (await this.repositories.listDraftLeases()).filter(
        (lease) =>
          lease.toSnapshot().envelopeRef === envelope.envelopeId &&
          lease.toSnapshot().releaseReason === "draft_promoted",
      );
      return {
        draftPublicId: input.draftPublicId,
        envelope,
        supersession: null,
        supersededLeases,
        continuityProjection: projection,
        recoveryRecord: existingRecovery,
      };
    }
    const grants = await this.repositories.listAccessGrantsForGoverningObject(envelope.envelopeId);
    const liveGrantRefs = grants
      .filter((grant) => {
        const state = grant.toSnapshot().grantState;
        return state === "live" || state === "redeeming" || state === "redeemed";
      })
      .map((grant) => grant.grantId);
    const supersession =
      liveGrantRefs.length > 0
        ? await this.accessGrantService.supersedeGrants({
            causeClass: "draft_promoted",
            supersededGrantRefs: liveGrantRefs,
            governingObjectRef: input.governingObjectRef ?? envelope.envelopeId,
            lineageFenceEpoch: (await this.repositories.findLiveForegroundLeaseForEnvelope(envelope.envelopeId))
              ?.toSnapshot().leaseEpoch ?? 1,
            reasonCodes: input.reasonCodes ?? ["DRAFT_PROMOTED"],
            recordedAt: input.recordedAt,
          })
        : null;

    const liveLeases = (await this.repositories.listDraftLeases()).filter(
      (lease) =>
        lease.toSnapshot().envelopeRef === envelope.envelopeId && lease.toSnapshot().leaseState === "live",
    );
    const ensured = await this.ensurePromotedRequestRecovery({
      projection,
      envelope,
      recordedAt: input.recordedAt,
      reasonCodes: uniqueSortedRefs([
        ...(input.reasonCodes ?? []),
        "PROMOTED_REQUEST_AVAILABLE",
        "GAP_RESOLVED_POST_PROMOTION_RECOVERY_ROUTE_ENTRY_V1",
      ]),
      leaseRef: liveLeases[0]?.leaseId ?? null,
    });
    const supersededLeases: DraftSessionLeaseDocument[] = [];
    for (const lease of liveLeases) {
      const nextLease = lease.supersede({
        supersededAt: input.recordedAt,
        supersededByLeaseRef: null,
        releaseReason: "draft_promoted",
        recoveryRecordRef: ensured.recovery.recoveryRecordId,
      });
      await this.repositories.saveDraftLease(nextLease, { expectedVersion: lease.version });
      supersededLeases.push(nextLease);
    }

    return {
      draftPublicId: input.draftPublicId,
      envelope,
      supersession,
      supersededLeases,
      continuityProjection: ensured.projection,
      recoveryRecord: ensured.recovery,
    };
  }

  private async validateResumeToken(input: {
    draftPublicId: string;
    envelopeRef: string;
    resumeToken: string;
    routeFamilyRef: string;
    routeIntentBindingRef: string;
    audienceSurfaceRuntimeBindingRef: string;
    releaseApprovalFreezeRef: string;
    manifestVersionRef: string;
    sessionEpochRef?: string | null;
    subjectBindingVersionRef?: string | null;
    channelReleaseFreezeState: "released" | "monitoring" | "frozen";
  }): Promise<{
    grant: AccessGrantDocument | null;
    scopeEnvelope: AccessGrantScopeEnvelopeDocument | null;
    reasonCodes: readonly string[];
  }> {
    let grantToken: string;
    try {
      grantToken = decodeResumeToken(input.resumeToken);
    } catch {
      return {
        grant: null,
        scopeEnvelope: null,
        reasonCodes: ["DRAFT_RESUME_TOKEN_FORMAT_INVALID"],
      };
    }
    const grant = await this.repositories.getAccessGrantByTokenHash(
      hashAccessGrantToken({
        presentedToken: grantToken,
        tokenKeyVersionRef: tokenKeyVersionFromGrantToken(grantToken),
        validatorFamily: "draft_resume_minimal_validator",
      }),
    );
    if (!grant) {
      return {
        grant: null,
        scopeEnvelope: null,
        reasonCodes: ["DRAFT_RESUME_GRANT_NOT_FOUND"],
      };
    }
    const scopeEnvelope = await this.repositories.getAccessGrantScopeEnvelope(
      grant.toSnapshot().grantScopeEnvelopeRef,
    );
    if (!scopeEnvelope) {
      return {
        grant,
        scopeEnvelope: null,
        reasonCodes: ["DRAFT_RESUME_SCOPE_ENVELOPE_NOT_FOUND"],
      };
    }
    return {
      grant,
      scopeEnvelope,
      reasonCodes: validateGrantAgainstRuntime(grant, scopeEnvelope, {
        envelopeRef: input.envelopeRef,
        routeFamilyRef: input.routeFamilyRef,
        routeIntentBindingRef: input.routeIntentBindingRef,
        audienceSurfaceRuntimeBindingRef: input.audienceSurfaceRuntimeBindingRef,
        releaseApprovalFreezeRef: input.releaseApprovalFreezeRef,
        manifestVersionRef: input.manifestVersionRef,
        sessionEpochRef: input.sessionEpochRef ?? null,
        subjectBindingVersionRef: input.subjectBindingVersionRef ?? null,
        channelReleaseFreezeState: input.channelReleaseFreezeState,
      }),
    };
  }

  private materializePatchedProjection(
    projection: DraftContinuityEvidenceProjectionDocument,
    patch: DraftAutosavePatchEnvelope,
  ) {
    const snapshot = projection.toSnapshot();
    const nextRequestType = patch.requestType ?? snapshot.requestType;
    const nextStructuredAnswers = {
      ...snapshot.structuredAnswers,
      ...(patch.structuredAnswers ?? {}),
    };
    const nextFreeTextNarrative = patch.freeTextNarrative ?? snapshot.freeTextNarrative;
    const nextAttachmentRefs = patch.attachmentRefs
      ? uniqueSortedRefs(patch.attachmentRefs)
      : snapshot.attachmentRefs;
    const nextContactPreferences = mergeContactPreferences(
      snapshot.contactPreferences,
      patch.contactPreferences,
    );
    const nextCurrentStepKey = patch.currentStepKey ?? snapshot.currentStepKey;
    const nextCompletedStepKeys =
      patch.completedStepKeys !== undefined
        ? [...new Set(patch.completedStepKeys)]
        : snapshot.completedStepKeys;
    const nextCurrentPathname = patch.currentPathname ?? snapshot.currentPathname;
    const nextShellContinuityKey = patch.shellContinuityKey ?? snapshot.shellContinuityKey;
    const nextSelectedAnchorKey = patch.selectedAnchorKey ?? snapshot.selectedAnchorKey;
    return {
      nextRequestType,
      nextStructuredAnswers,
      nextFreeTextNarrative,
      nextAttachmentRefs,
      nextContactPreferences,
      nextCurrentStepKey,
      nextCompletedStepKeys,
      nextCurrentPathname,
      nextShellContinuityKey,
      nextSelectedAnchorKey,
      payloadHashInput: {
        requestType: nextRequestType,
        structuredAnswers: nextStructuredAnswers,
        freeTextNarrative: nextFreeTextNarrative,
        attachmentRefs: nextAttachmentRefs,
        contactPreferences: nextContactPreferences,
        currentStepKey: nextCurrentStepKey,
        completedStepKeys: nextCompletedStepKeys,
        currentPathname: nextCurrentPathname,
        shellContinuityKey: nextShellContinuityKey,
        selectedAnchorKey: nextSelectedAnchorKey,
      },
    };
  }

  private async openRecoveryForProjection(input: {
    projection: DraftContinuityEvidenceProjectionDocument;
    lease: DraftSessionLeaseDocument | undefined;
    mutationRef: string | null;
    recordedAt: string;
    reasonCodes: readonly string[];
    requestPublicId?: string | null;
    promotedRequestRef?: string | null;
  }): Promise<{
    projection: DraftContinuityEvidenceProjectionDocument;
    recovery: DraftRecoveryRecordDocument;
    syntheticLease: DraftSessionLeaseDocument;
    events: readonly SubmissionLineageEventEnvelope<unknown>[];
  }> {
    const snapshot = input.projection.toSnapshot();
    const failure = resolveGrantValidationFailure({
      draftPublicId: snapshot.draftPublicId,
      reasonCodes: input.reasonCodes,
      promotedRequestAvailable: Boolean(input.promotedRequestRef),
    });
    const recovery = DraftRecoveryRecordDocument.create({
      recoveryRecordId: nextDraftId(this.idGenerator, "draftRecovery"),
      envelopeRef: snapshot.envelopeRef,
      draftPublicId: snapshot.draftPublicId,
      leaseRef: input.lease?.leaseId ?? null,
      sourceMutationRef: input.mutationRef,
      recoveryReason: failure.recoveryReason,
      recoveryState:
        input.promotedRequestRef || failure.sameShellRecoveryState === "blocked"
          ? "redirect_ready"
          : "open",
      reasonCodes: input.reasonCodes,
      sameShellRecoveryRouteRef: createRecoveryRouteRef(snapshot.draftPublicId),
      requestPublicId: input.requestPublicId ?? null,
      promotedRequestRef: input.promotedRequestRef ?? null,
      continuityProjectionRef: snapshot.projectionId,
      recordedAt: input.recordedAt,
      resolvedAt: null,
    });
    await this.repositories.saveDraftRecoveryRecord(recovery);
    const nextProjection = DraftContinuityEvidenceProjectionDocument.hydrate({
      ...snapshot,
      activeLeaseRef: null,
      continuityState:
        failure.sameShellRecoveryState === "blocked" ? "blocked" : "recovery_only",
      quietStatusState: "resume_safely",
      sameShellRecoveryState: failure.sameShellRecoveryState,
      latestRecoveryRecordRef: recovery.recoveryRecordId,
      resumeBlockedReasonCodes: uniqueSortedRefs([
        ...snapshot.resumeBlockedReasonCodes,
        ...input.reasonCodes,
      ]),
      channelCapabilityCeiling: resolveCapabilityCeiling({
        surfaceChannelProfile: snapshot.surfaceChannelProfile,
        mutatingResumeState: failure.mutatingResumeState,
      }),
      projectionHash: computeDraftContinuityProjectionHash({
        ...snapshot,
        activeLeaseRef: null,
        continuityState:
          failure.sameShellRecoveryState === "blocked" ? "blocked" : "recovery_only",
        quietStatusState: "resume_safely",
        sameShellRecoveryState: failure.sameShellRecoveryState,
        latestRecoveryRecordRef: recovery.recoveryRecordId,
        resumeBlockedReasonCodes: uniqueSortedRefs([
          ...snapshot.resumeBlockedReasonCodes,
          ...input.reasonCodes,
        ]),
        channelCapabilityCeiling: resolveCapabilityCeiling({
          surfaceChannelProfile: snapshot.surfaceChannelProfile,
          mutatingResumeState: failure.mutatingResumeState,
        }),
      }),
      version: snapshot.version + 1,
    });
    await this.repositories.saveDraftContinuityEvidenceProjection(nextProjection, {
      expectedVersion: snapshot.version,
    });
    const syntheticLease =
      input.lease ??
      DraftSessionLeaseDocument.create({
        leaseId: "synthetic_recovery_lease",
        envelopeRef: snapshot.envelopeRef,
        draftPublicId: snapshot.draftPublicId,
        accessGrantRef: snapshot.accessGrantRef,
        grantScopeEnvelopeRef: "synthetic_scope",
        leaseMode: "foreground_mutating",
        leaseState: "superseded",
        ownerActorBindingState: snapshot.identityContext.actorBindingState,
        routeFamilyRef: "rf_intake_self_service",
        routeIntentBindingRef: "RIB_144_SYNTHETIC",
        audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
        releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
        channelReleaseFreezeState: "frozen",
        manifestVersionRef: "manifest_phase1_browser_v1",
        sessionEpochRef: null,
        subjectBindingVersionRef: null,
        subjectRef: null,
        leaseEpoch: 0,
        fencingToken: createLeaseFencingToken(snapshot.draftPublicId, 0),
        governingEnvelopeVersion: 0,
        acquiredAt: input.recordedAt,
        expiresAt: input.recordedAt,
        supersededAt: input.recordedAt,
        supersededByLeaseRef: null,
        releaseReason: failure.recoveryReason,
        recoveryRecordRef: recovery.recoveryRecordId,
      });
    return {
      projection: nextProjection,
      recovery,
      syntheticLease,
      events: [
        emitIntakeDraftUpdated({
          envelopeId: snapshot.envelopeRef,
          draftPublicId: snapshot.draftPublicId,
          mutationRecordId: input.mutationRef ?? "none",
          draftVersion: snapshot.authoritativeDraftVersion,
          previousAckState: snapshot.quietStatusState,
          nextAckState: "recovery_required",
        }),
        {
          eventType: "intake.resume.continuity.updated",
          emittedAt: input.recordedAt,
          payload: {
            draftPublicId: snapshot.draftPublicId,
            continuityProjectionRef: nextProjection.projectionId,
            continuityState: nextProjection.toSnapshot().continuityState,
            reasonCodes: input.reasonCodes,
          },
        },
      ],
    };
  }

  private async ensurePromotedRequestRecovery(input: {
    projection: DraftContinuityEvidenceProjectionDocument;
    envelope: SubmissionEnvelopeAggregate;
    recordedAt: string;
    reasonCodes: readonly string[];
    leaseRef?: string | null;
  }): Promise<{
    projection: DraftContinuityEvidenceProjectionDocument;
    recovery: DraftRecoveryRecordDocument;
    events: readonly SubmissionLineageEventEnvelope<unknown>[];
  }> {
    const snapshot = input.projection.toSnapshot();
    const promotedRequestRef = optionalRef(input.envelope.toSnapshot().promotedRequestRef);
    invariant(
      promotedRequestRef,
      "PROMOTED_REQUEST_REQUIRED",
      "Promoted request recovery requires envelope.promotedRequestRef.",
    );
    const existingRecovery = snapshot.latestRecoveryRecordRef
      ? await this.repositories.getDraftRecoveryRecord(snapshot.latestRecoveryRecordRef)
      : undefined;
    if (
      snapshot.continuityState === "blocked" &&
      existingRecovery?.toSnapshot().recoveryReason === "promoted_request_available" &&
      existingRecovery.toSnapshot().promotedRequestRef === promotedRequestRef
    ) {
      return {
        projection: input.projection,
        recovery: existingRecovery,
        events: [],
      };
    }

    const recovery = DraftRecoveryRecordDocument.create({
      recoveryRecordId: nextDraftId(this.idGenerator, "draftRecovery"),
      envelopeRef: snapshot.envelopeRef,
      draftPublicId: snapshot.draftPublicId,
      leaseRef: input.leaseRef ?? snapshot.activeLeaseRef,
      sourceMutationRef: null,
      recoveryReason: "promoted_request_available",
      recoveryState: "redirect_ready",
      reasonCodes: uniqueSortedRefs(input.reasonCodes),
      sameShellRecoveryRouteRef: createRecoveryRouteRef(snapshot.draftPublicId),
      requestPublicId: toRequestPublicIdOrNull(promotedRequestRef),
      promotedRequestRef,
      continuityProjectionRef: snapshot.projectionId,
      recordedAt: input.recordedAt,
      resolvedAt: null,
    });
    await this.repositories.saveDraftRecoveryRecord(recovery);
    const nextProjection = DraftContinuityEvidenceProjectionDocument.hydrate({
      ...snapshot,
      activeLeaseRef: null,
      continuityState: "blocked",
      quietStatusState: "resume_safely",
      sameShellRecoveryState: "blocked",
      latestRecoveryRecordRef: recovery.recoveryRecordId,
      resumeBlockedReasonCodes: uniqueSortedRefs([
        ...snapshot.resumeBlockedReasonCodes,
        ...input.reasonCodes,
      ]),
      channelCapabilityCeiling: resolveCapabilityCeiling({
        surfaceChannelProfile: snapshot.surfaceChannelProfile,
        mutatingResumeState: "blocked",
      }),
      projectionHash: computeDraftContinuityProjectionHash({
        ...snapshot,
        activeLeaseRef: null,
        continuityState: "blocked",
        quietStatusState: "resume_safely",
        sameShellRecoveryState: "blocked",
        latestRecoveryRecordRef: recovery.recoveryRecordId,
        resumeBlockedReasonCodes: uniqueSortedRefs([
          ...snapshot.resumeBlockedReasonCodes,
          ...input.reasonCodes,
        ]),
        channelCapabilityCeiling: resolveCapabilityCeiling({
          surfaceChannelProfile: snapshot.surfaceChannelProfile,
          mutatingResumeState: "blocked",
        }),
      }),
      version: snapshot.version + 1,
    });
    await this.repositories.saveDraftContinuityEvidenceProjection(nextProjection, {
      expectedVersion: snapshot.version,
    });
    return {
      projection: nextProjection,
      recovery,
      events: [
        {
          eventType: "intake.resume.continuity.updated",
          emittedAt: input.recordedAt,
          payload: {
            draftPublicId: snapshot.draftPublicId,
            continuityProjectionRef: nextProjection.projectionId,
            continuityState: nextProjection.toSnapshot().continuityState,
            reasonCodes: recovery.toSnapshot().reasonCodes,
          },
        },
      ],
    };
  }

  private async requireProjection(draftPublicId: string) {
    const projection =
      await this.repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
    invariant(
      !!projection,
      "DRAFT_CONTINUITY_PROJECTION_NOT_FOUND",
      `Unknown draftPublicId ${draftPublicId}.`,
    );
    return projection;
  }

  private async requireEnvelope(envelopeId: string) {
    const envelope = await this.repositories.getSubmissionEnvelope(envelopeId);
    invariant(!!envelope, "DRAFT_ENVELOPE_NOT_FOUND", `Unknown SubmissionEnvelope ${envelopeId}.`);
    return envelope;
  }

  private async requireLease(leaseId: string) {
    const lease = await this.repositories.getDraftLease(leaseId);
    invariant(!!lease, "DRAFT_LEASE_NOT_FOUND", `Unknown DraftSessionLease ${leaseId}.`);
    return lease;
  }
}

export function createDraftSessionAutosaveService(
  repositories: DraftAutosaveDependencies,
  idGenerator?: BackboneIdGenerator,
): DraftSessionAutosaveService {
  return new DraftSessionAutosaveService(repositories, idGenerator);
}
