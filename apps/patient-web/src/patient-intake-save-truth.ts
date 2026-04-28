import {
  defaultIntakeMissionFrameMemory,
  formatPatientIntakeMissionPath,
  parsePatientIntakeMissionLocation,
  routeStepDescriptors,
  selectedAnchorForRoute,
  type DraftStepKey,
  type IntakeMissionFrameLocation,
  type IntakeMissionFrameMemory,
} from "./patient-intake-mission-frame.model";
import type { AttachmentUiState } from "./patient-intake-attachment-lane";
import { buildProgressiveFlowView, projectNarrativeAnswer } from "./patient-intake-progressive-flow";

export const LEGACY_MEMORY_PREFIX = "patient-intake-mission-frame::";
export const AUTOSAVE_RECORD_PREFIX = "patient-intake-autosave-record::";
export const AUTOSAVE_SESSION_PREFIX = "patient-intake-autosave-session::";
export const AUTOSAVE_SCENARIO_PREFIX = "patient-intake-autosave-scenario::";
export const AUTOSAVE_INDEX_KEY = "patient-intake-autosave-index";
export const AUTOSAVE_SESSION_ID_KEY = "patient-intake-autosave-session-id";
export const AUTOSAVE_CHANNEL_NAME = "patient-intake-autosave-channel-v1";
export const SESSION_SCHEMA_VERSION = "PHASE1_PATIENT_DRAFT_SESSION_STATE_V1";
export const RECORD_SCHEMA_VERSION = "PHASE1_PATIENT_DRAFT_AUTOSAVE_SIMULATOR_V1";
export const FRONTEND_SAVE_TRUTH_CONTRACT_ID = "PHASE1_FRONTEND_SAVE_TRUTH_CONTRACT_V1";

export type DraftSaveAckState =
  | "local_ack"
  | "saved_authoritative"
  | "merge_required"
  | "recovery_required";
export type ContinuityState = "stable_writable" | "stable_read_only" | "recovery_only" | "blocked";
export type SameShellRecoveryState = "stable" | "recovery_only" | "blocked";
export type SaveTruthState =
  | "neutral"
  | "saving"
  | "saved"
  | "review changes"
  | "resume safely"
  | "outcome";
export type MergeResolution = "keep_local" | "use_server";
export type MergeGroupType = "answer_fields" | "attachments" | "step_markers";
export type RecoveryReason =
  | "lease_expired"
  | "lease_superseded"
  | "identity_rebind_required"
  | "storage_degraded"
  | "manifest_drift"
  | "channel_frozen"
  | "promoted_request_available"
  | "grant_scope_drift"
  | "grant_superseded"
  | "continuity_blocked";
export type RecoveryActionKind =
  | "resume_review"
  | "resume_current_step"
  | "open_request_receipt"
  | "open_request_status"
  | "open_urgent_guidance"
  | "rebind_and_continue";
export type SaveIntent = "immediate" | "debounced" | "none";

export interface DraftSaveSettlementRecord {
  settlementId: string;
  ackState: DraftSaveAckState;
  authoritativeDraftVersion: number;
  recordedAt: string;
  reasonCodes: readonly string[];
  continuityProjectionRef: string | null;
  mergePlanRef: string | null;
  recoveryRecordRef: string | null;
  source: "authoritative_record" | "session_local";
}

export interface DraftContinuityProjectionRecord {
  projectionId: string;
  continuityState: ContinuityState;
  sameShellRecoveryState: SameShellRecoveryState;
  authoritativeDraftVersion: number;
  lastSavedAt: string;
  latestSettlementRef: string | null;
  currentStepKey: DraftStepKey;
  currentPathname: string;
  selectedAnchorKey: string;
  focusedFieldKey: string | null;
  scrollTop: number;
  resumeBlockedReasonCodes: readonly string[];
}

export interface MergeConflictGroup {
  groupId: string;
  groupType: MergeGroupType;
  title: string;
  localLabel: string;
  localValue: string;
  serverLabel: string;
  serverValue: string;
  selectedResolution: MergeResolution;
  systemReason: string;
}

export interface DraftMergePlanRecord {
  mergePlanId: string;
  mergeState: "open" | "resolved";
  openedAt: string;
  expectedDraftVersion: number;
  actualDraftVersion: number;
  resolutionByGroup: Record<string, MergeResolution>;
  groups: readonly MergeConflictGroup[];
}

export interface DraftRecoveryRecordView {
  recoveryRecordId: string;
  recoveryReason: RecoveryReason;
  recoveryState: "open" | "redirect_ready" | "resolved";
  recordedAt: string;
  reasonCodes: readonly string[];
  dominantActionKind: RecoveryActionKind;
  dominantActionLabel: string;
  targetPathname: string;
  explanation: string;
  keptItems: readonly string[];
}

export interface DraftAutosaveAuthoritativeRecord {
  schemaVersion: typeof RECORD_SCHEMA_VERSION;
  draftPublicId: string;
  requestPublicId: string | null;
  updatedAt: string;
  updatedBySessionId: string | null;
  activeForegroundSessionId: string | null;
  authoritativeMemory: IntakeMissionFrameMemory;
  attachmentStates: Record<string, AttachmentUiState>;
  saveSettlement: DraftSaveSettlementRecord;
  continuityProjection: DraftContinuityProjectionRecord;
}

export interface DraftAutosaveSessionSnapshot {
  schemaVersion: typeof SESSION_SCHEMA_VERSION;
  draftPublicId: string;
  sessionId: string;
  localMemory: IntakeMissionFrameMemory;
  baseAuthoritativeDraftVersion: number;
  localDirty: boolean;
  pendingIntent: SaveIntent;
  currentPathname: string;
  currentStepKey: DraftStepKey;
  selectedAnchorKey: string;
  focusedFieldKey: string | null;
  scrollTop: number;
  lastInteractionAt: string | null;
  latestAnnouncementKey: string | null;
  localSettlement: DraftSaveSettlementRecord | null;
  mergePlan: DraftMergePlanRecord | null;
  recoveryRecord: DraftRecoveryRecordView | null;
}

export interface DraftAutosaveScenarioOverride {
  continuityBlockedAfterNextSave?: boolean;
  leaseExpired?: boolean;
  recoveryReason?: RecoveryReason;
  reasonCodes?: readonly string[];
  forceBlockedRecovery?: boolean;
}

export interface DraftSaveTruthBootstrap {
  sessionId: string;
  authoritativeRecord: DraftAutosaveAuthoritativeRecord | null;
  sessionSnapshot: DraftAutosaveSessionSnapshot | null;
  initialMemory: IntakeMissionFrameMemory;
}

export interface ContinueYourRequestEntry {
  draftPublicId: string;
  title: string;
  summary: string;
  lastUpdatedLabel: string;
  stepLabel: string;
  dominantActionLabel: string;
  targetPathname: string;
  statusState: SaveTruthState;
}

export interface DraftSaveTruthView {
  contractId: typeof FRONTEND_SAVE_TRUTH_CONTRACT_ID;
  state: SaveTruthState;
  label: string;
  detail: string;
  meta: string;
  actionLabel: string | null;
  actionTone: "neutral" | "safe" | "review" | "continuity";
  stateMarkTone: "neutral" | "safe" | "review" | "continuity";
  liveAnnouncement: string;
  announcementKey: string;
  shouldWarnOnHardExit: boolean;
  suppressSavedReason: string | null;
}

function ownerWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function stableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function storageRecordKey(draftPublicId: string): string {
  return `${AUTOSAVE_RECORD_PREFIX}${draftPublicId}`;
}

function storageScenarioKey(draftPublicId: string): string {
  return `${AUTOSAVE_SCENARIO_PREFIX}${draftPublicId}`;
}

function sessionSnapshotKey(draftPublicId: string, sessionId: string): string {
  return `${AUTOSAVE_SESSION_PREFIX}${draftPublicId}::${sessionId}`;
}

function readJson<T>(storage: Storage, key: string): T | null {
  const payload = storage.getItem(key);
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value));
}

export function routeStepLabel(stepKey: DraftStepKey): string {
  return (
    routeStepDescriptors.find((descriptor) => descriptor.stepKey === stepKey)?.title ??
    "Continue request"
  );
}

export function formatClockLabel(timestamp: string): string {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return "Unknown time";
  }
  return value.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatRelativeSaveLabel(timestamp: string, nowIso: string): string {
  const savedAt = new Date(timestamp);
  const now = new Date(nowIso);
  if (Number.isNaN(savedAt.getTime()) || Number.isNaN(now.getTime())) {
    return "Saved recently";
  }
  const deltaSeconds = Math.max(0, Math.round((now.getTime() - savedAt.getTime()) / 1000));
  if (deltaSeconds < 45) {
    return "Saved just now";
  }
  if (deltaSeconds < 120) {
    return "Saved 1 min ago";
  }
  if (deltaSeconds < 3_600) {
    return `Saved ${Math.round(deltaSeconds / 60)} min ago`;
  }
  return `Saved at ${formatClockLabel(timestamp)}`;
}

function blankReasonCodes(): readonly string[] {
  return [];
}

function toLegacyMemoryStorageKey(draftPublicId: string): string {
  return `${LEGACY_MEMORY_PREFIX}${draftPublicId}`;
}

function attachmentStateMap(memory: IntakeMissionFrameMemory): Record<string, AttachmentUiState> {
  return Object.fromEntries(
    memory.attachments.map((attachment) => [attachment.attachmentRef, attachment.uiState]),
  );
}

export function syncMemoryPresentation(
  memory: IntakeMissionFrameMemory,
  state: SaveTruthState,
  savedAt?: string,
  draftVersion?: number,
): IntakeMissionFrameMemory {
  return {
    ...memory,
    savePresentation:
      state === "saving"
        ? "saving_local"
        : state === "saved" || state === "outcome"
          ? "saved_authoritative"
          : memory.savePresentation,
    lastSavedAt: savedAt ?? memory.lastSavedAt,
    draftVersion: draftVersion ?? memory.draftVersion,
  };
}

export function generateSessionId(): string {
  const safeCrypto = ownerWindow()?.crypto;
  if (safeCrypto?.randomUUID) {
    return safeCrypto.randomUUID();
  }
  return `session_${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveDraftSessionId(): string {
  const sessionStore = ownerWindow()?.sessionStorage;
  if (!sessionStore) {
    return "session_ssr";
  }
  const existing = sessionStore.getItem(AUTOSAVE_SESSION_ID_KEY);
  if (existing) {
    return existing;
  }
  const sessionId = generateSessionId();
  sessionStore.setItem(AUTOSAVE_SESSION_ID_KEY, sessionId);
  return sessionId;
}

export function readAuthoritativeRecord(
  draftPublicId: string,
): DraftAutosaveAuthoritativeRecord | null {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return null;
  }
  return readJson<DraftAutosaveAuthoritativeRecord>(storage, storageRecordKey(draftPublicId));
}

export function readScenarioOverride(
  draftPublicId: string,
): DraftAutosaveScenarioOverride | null {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return null;
  }
  return readJson<DraftAutosaveScenarioOverride>(storage, storageScenarioKey(draftPublicId));
}

export function writeAuthoritativeRecord(record: DraftAutosaveAuthoritativeRecord): void {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return;
  }
  writeJson(storage, storageRecordKey(record.draftPublicId), record);
  const currentIndex = readJson<string[]>(storage, AUTOSAVE_INDEX_KEY) ?? [];
  const nextIndex = [record.draftPublicId, ...currentIndex.filter((entry) => entry !== record.draftPublicId)];
  writeJson(storage, AUTOSAVE_INDEX_KEY, nextIndex.slice(0, 6));
}

export function readMostRecentDraftRecord(): DraftAutosaveAuthoritativeRecord | null {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return null;
  }
  const index = readJson<string[]>(storage, AUTOSAVE_INDEX_KEY) ?? [];
  for (const draftPublicId of index) {
    const record = readAuthoritativeRecord(draftPublicId);
    if (record) {
      return record;
    }
  }
  return null;
}

export function readSessionSnapshot(
  draftPublicId: string,
  sessionId: string,
): DraftAutosaveSessionSnapshot | null {
  const storage = ownerWindow()?.sessionStorage;
  if (!storage) {
    return null;
  }
  return readJson<DraftAutosaveSessionSnapshot>(storage, sessionSnapshotKey(draftPublicId, sessionId));
}

export function writeSessionSnapshot(snapshot: DraftAutosaveSessionSnapshot): void {
  const storage = ownerWindow()?.sessionStorage;
  if (!storage) {
    return;
  }
  writeJson(storage, sessionSnapshotKey(snapshot.draftPublicId, snapshot.sessionId), snapshot);
}

export function clearSessionSnapshot(draftPublicId: string, sessionId: string): void {
  const storage = ownerWindow()?.sessionStorage;
  storage?.removeItem(sessionSnapshotKey(draftPublicId, sessionId));
}

function hydrateMemoryFromRecord(
  record: DraftAutosaveAuthoritativeRecord,
): IntakeMissionFrameMemory {
  return syncMemoryPresentation(
    stableClone(record.authoritativeMemory),
    record.saveSettlement.ackState === "saved_authoritative" ? "saved" : "neutral",
    record.continuityProjection.lastSavedAt,
    record.continuityProjection.authoritativeDraftVersion,
  );
}

function readLegacyMemory(draftPublicId: string): IntakeMissionFrameMemory | null {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return null;
  }
  const payload = storage.getItem(toLegacyMemoryStorageKey(draftPublicId));
  if (!payload) {
    return null;
  }
  try {
    return {
      ...defaultIntakeMissionFrameMemory(draftPublicId),
      ...(JSON.parse(payload) as Partial<IntakeMissionFrameMemory>),
      draftPublicId,
    };
  } catch {
    return null;
  }
}

export function writeLegacyMemory(memory: IntakeMissionFrameMemory): void {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return;
  }
  storage.setItem(toLegacyMemoryStorageKey(memory.draftPublicId), JSON.stringify(memory));
}

export function readDraftSaveTruthBootstrap(
  draftPublicId: string,
  fallbackMemory: IntakeMissionFrameMemory,
): DraftSaveTruthBootstrap {
  const sessionId = resolveDraftSessionId();
  const authoritativeRecord = readAuthoritativeRecord(draftPublicId);
  const sessionSnapshot = readSessionSnapshot(draftPublicId, sessionId);
  const legacyMemory = readLegacyMemory(draftPublicId);
  const initialMemory =
    sessionSnapshot?.localMemory ??
    (authoritativeRecord ? hydrateMemoryFromRecord(authoritativeRecord) : null) ??
    legacyMemory ??
    fallbackMemory;

  return {
    sessionId,
    authoritativeRecord,
    sessionSnapshot,
    initialMemory,
  };
}

export function createAuthoritativeRecord(input: {
  draftPublicId: string;
  requestPublicId: string | null;
  memory: IntakeMissionFrameMemory;
  pathname: string;
  currentStepKey: DraftStepKey;
  selectedAnchorKey: string;
  focusedFieldKey: string | null;
  scrollTop: number;
  sessionId: string;
  savedAt: string;
}): DraftAutosaveAuthoritativeRecord {
  const continuityProjectionRef = `proj_${input.draftPublicId}_${input.memory.draftVersion}`;
  const settlementId = `settlement_${input.draftPublicId}_${input.memory.draftVersion}`;
  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    draftPublicId: input.draftPublicId,
    requestPublicId: input.requestPublicId,
    updatedAt: input.savedAt,
    updatedBySessionId: input.sessionId,
    activeForegroundSessionId: input.sessionId,
    authoritativeMemory: syncMemoryPresentation(
      stableClone(input.memory),
      "saved",
      input.savedAt,
      input.memory.draftVersion,
    ),
    attachmentStates: attachmentStateMap(input.memory),
    saveSettlement: {
      settlementId,
      ackState: "saved_authoritative",
      authoritativeDraftVersion: input.memory.draftVersion,
      recordedAt: input.savedAt,
      reasonCodes: ["CONTINUITY_PROOF_STABLE", "MUTATION_APPEND_ONLY_RECORDED"],
      continuityProjectionRef,
      mergePlanRef: null,
      recoveryRecordRef: null,
      source: "authoritative_record",
    },
    continuityProjection: {
      projectionId: continuityProjectionRef,
      continuityState: "stable_writable",
      sameShellRecoveryState: "stable",
      authoritativeDraftVersion: input.memory.draftVersion,
      lastSavedAt: input.savedAt,
      latestSettlementRef: settlementId,
      currentStepKey: input.currentStepKey,
      currentPathname: input.pathname,
      selectedAnchorKey: input.selectedAnchorKey,
      focusedFieldKey: input.focusedFieldKey,
      scrollTop: input.scrollTop,
      resumeBlockedReasonCodes: blankReasonCodes(),
    },
  };
}

export function upsertAuthoritativeRecord(input: {
  existingRecord: DraftAutosaveAuthoritativeRecord | null;
  memory: IntakeMissionFrameMemory;
  pathname: string;
  currentStepKey: DraftStepKey;
  selectedAnchorKey: string;
  focusedFieldKey: string | null;
  scrollTop: number;
  sessionId: string;
  savedAt: string;
  requestPublicId: string | null;
}): DraftAutosaveAuthoritativeRecord {
  const currentVersion = input.existingRecord?.continuityProjection.authoritativeDraftVersion ?? 0;
  const nextVersion = currentVersion + 1;
  const nextMemory = syncMemoryPresentation(input.memory, "saved", input.savedAt, nextVersion);
  const continuityProjectionRef = `proj_${input.memory.draftPublicId}_${nextVersion}`;
  const settlementId = `settlement_${input.memory.draftPublicId}_${nextVersion}`;
  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    draftPublicId: input.memory.draftPublicId,
    requestPublicId: input.requestPublicId,
    updatedAt: input.savedAt,
    updatedBySessionId: input.sessionId,
    activeForegroundSessionId: input.sessionId,
    authoritativeMemory: nextMemory,
    attachmentStates: attachmentStateMap(nextMemory),
    saveSettlement: {
      settlementId,
      ackState: "saved_authoritative",
      authoritativeDraftVersion: nextVersion,
      recordedAt: input.savedAt,
      reasonCodes: ["CONTINUITY_PROOF_STABLE", "MUTATION_APPEND_ONLY_RECORDED"],
      continuityProjectionRef,
      mergePlanRef: null,
      recoveryRecordRef: null,
      source: "authoritative_record",
    },
    continuityProjection: {
      projectionId: continuityProjectionRef,
      continuityState: "stable_writable",
      sameShellRecoveryState: "stable",
      authoritativeDraftVersion: nextVersion,
      lastSavedAt: input.savedAt,
      latestSettlementRef: settlementId,
      currentStepKey: input.currentStepKey,
      currentPathname: input.pathname,
      selectedAnchorKey: input.selectedAnchorKey,
      focusedFieldKey: input.focusedFieldKey,
      scrollTop: input.scrollTop,
      resumeBlockedReasonCodes: blankReasonCodes(),
    },
  };
}

function summaryForMemory(memory: IntakeMissionFrameMemory): string {
  const flow = buildProgressiveFlowView(memory);
  const chips = flow.activeSummaryChips.slice(0, 2);
  if (chips.length > 0) {
    return chips.map((chip) => `${chip.label}: ${chip.value}`).join(" · ");
  }
  const narrative = projectNarrativeAnswer(memory) || memory.detailNarrative;
  if (narrative) {
    return narrative;
  }
  return `${memory.requestType} request draft`;
}

function compareSection(localValue: string, serverValue: string): boolean {
  return localValue.trim() !== serverValue.trim();
}

export function buildMergePlanRecord(input: {
  draftPublicId: string;
  expectedDraftVersion: number;
  actualDraftVersion: number;
  localMemory: IntakeMissionFrameMemory;
  serverMemory: IntakeMissionFrameMemory;
  localPathname: string;
  serverPathname: string;
  localSelectedAnchorKey: string;
  serverSelectedAnchorKey: string;
  openedAt: string;
}): DraftMergePlanRecord {
  const localAnswerSummary = summaryForMemory(input.localMemory);
  const serverAnswerSummary = summaryForMemory(input.serverMemory);
  const groups: MergeConflictGroup[] = [];

  if (compareSection(localAnswerSummary, serverAnswerSummary)) {
    groups.push({
      groupId: "answers",
      groupType: "answer_fields",
      title: "Question answers",
      localLabel: "Your recent value",
      localValue: localAnswerSummary,
      serverLabel: "Newer saved value",
      serverValue: serverAnswerSummary,
      selectedResolution: "keep_local",
      systemReason: "We kept your recent wording selected because it has not been merged yet.",
    });
  }

  const localAttachments = `${input.localMemory.attachments.length} file${input.localMemory.attachments.length === 1 ? "" : "s"}`;
  const serverAttachments = `${input.serverMemory.attachments.length} file${input.serverMemory.attachments.length === 1 ? "" : "s"}`;
  if (compareSection(localAttachments, serverAttachments)) {
    groups.push({
      groupId: "attachments",
      groupType: "attachments",
      title: "Supporting files",
      localLabel: "Your recent lane",
      localValue: localAttachments,
      serverLabel: "Newer saved lane",
      serverValue: serverAttachments,
      selectedResolution: "use_server",
      systemReason: "We preselected the newer saved evidence lane to avoid implying unscanned files are settled.",
    });
  }

  const localStep = `${routeStepLabel(input.localMemory.completedStepKeys.at(-1) ?? input.localMemory.completedStepKeys[0] ?? "request_type")} · ${input.localSelectedAnchorKey.replaceAll("-", " ")}`;
  const serverStep = `${routeStepLabel(input.serverMemory.completedStepKeys.at(-1) ?? input.serverMemory.completedStepKeys[0] ?? "request_type")} · ${input.serverSelectedAnchorKey.replaceAll("-", " ")}`;
  if (
    compareSection(localStep, serverStep) ||
    compareSection(input.localPathname, input.serverPathname)
  ) {
    groups.push({
      groupId: "position",
      groupType: "step_markers",
      title: "Resume position",
      localLabel: "Your current place",
      localValue: `${localStep} · ${input.localPathname}`,
      serverLabel: "Newer saved place",
      serverValue: `${serverStep} · ${input.serverPathname}`,
      selectedResolution: "use_server",
      systemReason: "We preselected the newer saved route marker so the shell keeps one lawful anchor.",
    });
  }

  if (groups.length === 0) {
    groups.push({
      groupId: "answers",
      groupType: "answer_fields",
      title: "Question answers",
      localLabel: "Your recent value",
      localValue: localAnswerSummary,
      serverLabel: "Newer saved value",
      serverValue: serverAnswerSummary,
      selectedResolution: "keep_local",
      systemReason: "The conflict is semantic even though the visible summary still matches.",
    });
  }

  return {
    mergePlanId: `merge_${input.draftPublicId}_${input.actualDraftVersion}`,
    mergeState: "open",
    openedAt: input.openedAt,
    expectedDraftVersion: input.expectedDraftVersion,
    actualDraftVersion: input.actualDraftVersion,
    resolutionByGroup: Object.fromEntries(groups.map((group) => [group.groupId, group.selectedResolution])),
    groups,
  };
}

function keptRecoveryItems(memory: IntakeMissionFrameMemory, pathname: string, selectedAnchorKey: string): string[] {
  return [
    `Last safe step: ${routeStepLabel(memory.completedStepKeys.at(-1) ?? "request_type")}`,
    `Selected anchor: ${selectedAnchorKey.replaceAll("-", " ")}`,
    `Saved route: ${pathname}`,
  ];
}

function recoveryExplanation(reason: RecoveryReason): string {
  switch (reason) {
    case "lease_expired":
      return "This browser no longer holds the writable draft lane. Resume through the last safe state before you continue.";
    case "lease_superseded":
      return "A newer writable session took over this draft. Review the last safe state before this tab continues.";
    case "identity_rebind_required":
      return "The resume proof drifted away from the last safe browser lane. Rebind the same request before more edits are accepted.";
    case "storage_degraded":
      return "The safe draft store degraded during save. Resume from the last confirmed state before more edits continue.";
    case "manifest_drift":
      return "The route or release tuple drifted from the saved continuity proof. Resume safely before continuing.";
    case "channel_frozen":
      return "This channel is temporarily frozen for safe continuation. Resume from the last safe state instead of editing in place.";
    case "promoted_request_available":
      return "This draft has already been promoted to a request. Continue through the bounded same-lineage route instead of reopening a mutable draft.";
    case "grant_scope_drift":
      return "The resume token or route scope drifted. Resume from the last safe state before new edits continue.";
    case "grant_superseded":
      return "The previous resume proof is no longer valid. Resume safely before continuing.";
    case "continuity_blocked":
      return "Continuity proof is blocked for this draft right now. Resume through the last safe context before more edits continue.";
    default:
      return "Resume this request through the last safe state before continuing.";
  }
}

export function buildRecoveryRecordView(input: {
  draftPublicId: string;
  recoveryReason: RecoveryReason;
  reasonCodes: readonly string[];
  recordedAt: string;
  targetPathname: string;
  localMemory: IntakeMissionFrameMemory;
  selectedAnchorKey: string;
}): DraftRecoveryRecordView {
  const dominantActionKind: RecoveryActionKind =
    input.recoveryReason === "promoted_request_available"
      ? "open_request_receipt"
      : input.recoveryReason === "identity_rebind_required"
        ? "rebind_and_continue"
        : "resume_current_step";
  const dominantActionLabel =
    dominantActionKind === "open_request_receipt"
      ? "Open request receipt"
      : dominantActionKind === "rebind_and_continue"
        ? "Resume safely"
        : "Resume safely";
  return {
    recoveryRecordId: `recovery_${input.draftPublicId}_${input.recordedAt}`,
    recoveryReason: input.recoveryReason,
    recoveryState: input.recoveryReason === "promoted_request_available" ? "redirect_ready" : "open",
    recordedAt: input.recordedAt,
    reasonCodes: [...input.reasonCodes],
    dominantActionKind,
    dominantActionLabel,
    targetPathname: input.targetPathname,
    explanation: recoveryExplanation(input.recoveryReason),
    keptItems: keptRecoveryItems(input.localMemory, input.targetPathname, input.selectedAnchorKey),
  };
}

export function buildContinueEntry(
  record: DraftAutosaveAuthoritativeRecord,
  sessionSnapshot: DraftAutosaveSessionSnapshot | null,
  nowIso: string,
): ContinueYourRequestEntry {
  const statusState =
    sessionSnapshot?.recoveryRecord || record.continuityProjection.sameShellRecoveryState !== "stable"
      ? "resume safely"
      : "saved";
  const sessionTargetPath =
    sessionSnapshot?.localMemory != null
      ? formatPatientIntakeMissionPath(
          parsePatientIntakeMissionLocation(record.continuityProjection.currentPathname),
        )
      : null;
  const targetPathname =
    sessionSnapshot?.recoveryRecord?.targetPathname ??
    sessionTargetPath ??
    record.continuityProjection.currentPathname;
  return {
    draftPublicId: record.draftPublicId,
    title: "Continue your request",
    summary:
      statusState === "resume safely"
        ? "We kept the last safe draft context and will reopen it carefully."
        : summaryForMemory(record.authoritativeMemory),
    lastUpdatedLabel: formatRelativeSaveLabel(record.continuityProjection.lastSavedAt, nowIso),
    stepLabel: routeStepLabel(record.continuityProjection.currentStepKey),
    dominantActionLabel: statusState === "resume safely" ? "Resume safely" : "Continue request",
    targetPathname,
    statusState,
  };
}

export function createNeutralTruth(): DraftSaveTruthView {
  return {
    contractId: FRONTEND_SAVE_TRUTH_CONTRACT_ID,
    state: "neutral",
    label: "Nothing saved yet",
    detail: "The shell will create a calm resume point after the first authoritative draft settlement.",
    meta: "No settled draft evidence yet",
    actionLabel: null,
    actionTone: "neutral",
    stateMarkTone: "neutral",
    liveAnnouncement: "Nothing is saved yet.",
    announcementKey: "neutral",
    shouldWarnOnHardExit: false,
    suppressSavedReason: null,
  };
}

export function deriveDraftSaveTruth(input: {
  authoritativeRecord: DraftAutosaveAuthoritativeRecord | null;
  localSettlement: DraftSaveSettlementRecord | null;
  mergePlan: DraftMergePlanRecord | null;
  recoveryRecord: DraftRecoveryRecordView | null;
  localDirty: boolean;
  pendingIntent: SaveIntent;
  nowIso: string;
}): DraftSaveTruthView {
  if (!input.authoritativeRecord && !input.localDirty) {
    return createNeutralTruth();
  }

  const settlement = input.localSettlement ?? input.authoritativeRecord?.saveSettlement ?? null;
  const projection = input.authoritativeRecord?.continuityProjection ?? null;
  const hasStableProjection =
    settlement?.ackState === "saved_authoritative" &&
    projection !== null &&
    projection.continuityState !== "recovery_only" &&
    projection.continuityState !== "blocked" &&
    projection.sameShellRecoveryState === "stable" &&
    projection.latestSettlementRef === settlement.settlementId &&
    projection.authoritativeDraftVersion === settlement.authoritativeDraftVersion;

  if (input.mergePlan || settlement?.ackState === "merge_required") {
    return {
      contractId: FRONTEND_SAVE_TRUTH_CONTRACT_ID,
      state: "review changes",
      label: "Review changes",
      detail: "A newer saved draft exists for this lineage. Review the grouped differences in place.",
      meta: `Draft versions ${input.mergePlan?.expectedDraftVersion ?? settlement?.authoritativeDraftVersion ?? "?"} and ${input.mergePlan?.actualDraftVersion ?? settlement?.authoritativeDraftVersion ?? "?"} need one selected result.`,
      actionLabel: "Review changes",
      actionTone: "review",
      stateMarkTone: "review",
      liveAnnouncement: "Review changes. A newer saved draft needs one selected result.",
      announcementKey: `merge:${input.mergePlan?.mergePlanId ?? settlement?.settlementId ?? "open"}`,
      shouldWarnOnHardExit: true,
      suppressSavedReason: "merge_required_open",
    };
  }

  if (
    input.recoveryRecord ||
    settlement?.ackState === "recovery_required" ||
    projection?.continuityState === "recovery_only" ||
    projection?.continuityState === "blocked" ||
    projection?.sameShellRecoveryState === "blocked" ||
    projection?.sameShellRecoveryState === "recovery_only"
  ) {
    const recovery = input.recoveryRecord;
    return {
      contractId: FRONTEND_SAVE_TRUTH_CONTRACT_ID,
      state: "resume safely",
      label: "Resume safely",
      detail: recovery?.explanation ?? "Continuity proof must be rebound before more edits continue.",
      meta:
        recovery?.reasonCodes.join(" · ") ??
        projection?.resumeBlockedReasonCodes.join(" · ") ??
        "Continuity blocked",
      actionLabel: recovery?.dominantActionLabel ?? "Resume safely",
      actionTone: "continuity",
      stateMarkTone: "continuity",
      liveAnnouncement: "Resume safely. Continuity must be rebound before more edits continue.",
      announcementKey: `recovery:${recovery?.recoveryRecordId ?? settlement?.settlementId ?? "open"}`,
      shouldWarnOnHardExit: Boolean(recovery),
      suppressSavedReason: "continuity_evidence_not_trusted",
    };
  }

  if (input.pendingIntent !== "none" || input.localDirty || settlement?.ackState === "local_ack") {
    return {
      contractId: FRONTEND_SAVE_TRUTH_CONTRACT_ID,
      state: "saving",
      label: "Saving",
      detail: "Local changes are queued for authoritative draft settlement.",
      meta:
        projection?.lastSavedAt != null
          ? formatRelativeSaveLabel(projection.lastSavedAt, input.nowIso)
          : "Awaiting first settlement",
      actionLabel: null,
      actionTone: "neutral",
      stateMarkTone: "neutral",
      liveAnnouncement: "Saving this request quietly.",
      announcementKey: `saving:${settlement?.authoritativeDraftVersion ?? "pending"}`,
      shouldWarnOnHardExit: true,
      suppressSavedReason: hasStableProjection ? null : "local_changes_not_settled",
    };
  }

  if (hasStableProjection && settlement) {
    return {
      contractId: FRONTEND_SAVE_TRUTH_CONTRACT_ID,
      state: "saved",
      label: "Saved",
      detail: "This draft has one authoritative settlement and the continuity proof still matches it.",
      meta: formatRelativeSaveLabel(projection.lastSavedAt, input.nowIso),
      actionLabel: null,
      actionTone: "safe",
      stateMarkTone: "safe",
      liveAnnouncement: `${formatRelativeSaveLabel(projection.lastSavedAt, input.nowIso)}.`,
      announcementKey: `saved:${settlement.settlementId}`,
      shouldWarnOnHardExit: false,
      suppressSavedReason: null,
    };
  }

  return {
    contractId: FRONTEND_SAVE_TRUTH_CONTRACT_ID,
    state: "resume safely",
    label: "Resume safely",
    detail: "Saved posture is suppressed because the continuity tuple is incomplete or stale.",
    meta: "Saved is withheld until settlement and continuity align",
    actionLabel: "Resume safely",
    actionTone: "continuity",
    stateMarkTone: "continuity",
    liveAnnouncement: "Resume safely. Saved is withheld until continuity aligns.",
    announcementKey: `suppressed:${settlement?.settlementId ?? "none"}`,
    shouldWarnOnHardExit: false,
    suppressSavedReason: "saved_withheld_until_continuity_aligns",
  };
}

export function resolveMergeMemory(input: {
  localMemory: IntakeMissionFrameMemory;
  serverMemory: IntakeMissionFrameMemory;
  mergePlan: DraftMergePlanRecord;
}): IntakeMissionFrameMemory {
  const useLocalAnswers = input.mergePlan.resolutionByGroup.answers !== "use_server";
  const useLocalAttachments = input.mergePlan.resolutionByGroup.attachments === "keep_local";
  const useLocalPosition = input.mergePlan.resolutionByGroup.position === "keep_local";

  const nextMemory = stableClone(input.serverMemory);
  if (useLocalAnswers) {
    nextMemory.requestType = input.localMemory.requestType;
    nextMemory.structuredAnswers = stableClone(input.localMemory.structuredAnswers);
    nextMemory.detailNarrative = input.localMemory.detailNarrative;
    nextMemory.supportingFocus = input.localMemory.supportingFocus;
    nextMemory.helperQuestionKey = input.localMemory.helperQuestionKey;
    nextMemory.deltaNotice = input.localMemory.deltaNotice;
    nextMemory.reviewAffirmed = input.localMemory.reviewAffirmed;
  }
  if (useLocalAttachments) {
    nextMemory.attachments = stableClone(input.localMemory.attachments);
  }
  if (useLocalPosition) {
    nextMemory.completedStepKeys = [...input.localMemory.completedStepKeys];
    nextMemory.summaryPeekOpen = input.localMemory.summaryPeekOpen;
  }
  return nextMemory;
}

export function replaceRouteWithStep(
  draftPublicId: string,
  stepKey: DraftStepKey,
): IntakeMissionFrameLocation {
  if (stepKey === "landing") {
    return parsePatientIntakeMissionLocation("/start-request");
  }
  const descriptor = routeStepDescriptors.find((entry) => entry.stepKey === stepKey) ?? routeStepDescriptors[1]!;
  const finalSegment = descriptor.implementedPathPattern.split("/").pop() ?? "request-type";
  return parsePatientIntakeMissionLocation(`/start-request/${draftPublicId}/${finalSegment}`);
}

export function continuitySnapshotForSession(input: {
  draftPublicId: string;
  sessionId: string;
  memory: IntakeMissionFrameMemory;
  authoritativeRecord: DraftAutosaveAuthoritativeRecord | null;
  baseAuthoritativeDraftVersion: number;
  localSettlement: DraftSaveSettlementRecord | null;
  mergePlan: DraftMergePlanRecord | null;
  recoveryRecord: DraftRecoveryRecordView | null;
  localDirty: boolean;
  pendingIntent: SaveIntent;
  currentPathname: string;
  currentStepKey: DraftStepKey;
  selectedAnchorKey: string;
  focusedFieldKey: string | null;
  scrollTop: number;
  lastInteractionAt: string | null;
}): DraftAutosaveSessionSnapshot {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    draftPublicId: input.draftPublicId,
    sessionId: input.sessionId,
    localMemory: stableClone(input.memory),
    baseAuthoritativeDraftVersion: input.baseAuthoritativeDraftVersion,
    localDirty: input.localDirty,
    pendingIntent: input.pendingIntent,
    currentPathname: input.currentPathname,
    currentStepKey: input.currentStepKey,
    selectedAnchorKey: input.selectedAnchorKey,
    focusedFieldKey: input.focusedFieldKey,
    scrollTop: input.scrollTop,
    lastInteractionAt: input.lastInteractionAt,
    latestAnnouncementKey: null,
    localSettlement: input.localSettlement ? stableClone(input.localSettlement) : null,
    mergePlan: input.mergePlan ? stableClone(input.mergePlan) : null,
    recoveryRecord: input.recoveryRecord ? stableClone(input.recoveryRecord) : null,
  };
}

export function continueEntryForLanding(nowIso: string): ContinueYourRequestEntry | null {
  const record = readMostRecentDraftRecord();
  if (!record) {
    return null;
  }
  const sessionId = resolveDraftSessionId();
  const sessionSnapshot = readSessionSnapshot(record.draftPublicId, sessionId);
  return buildContinueEntry(record, sessionSnapshot, nowIso);
}

export function defaultPathForStep(draftPublicId: string, stepKey: DraftStepKey): string {
  return formatPatientIntakeMissionPath(replaceRouteWithStep(draftPublicId, stepKey));
}

export function selectedAnchorKeyForStep(stepKey: DraftStepKey): string {
  return selectedAnchorForRoute(
    routeStepDescriptors.find((descriptor) => descriptor.stepKey === stepKey)?.routeKey ?? "request_type",
  );
}
