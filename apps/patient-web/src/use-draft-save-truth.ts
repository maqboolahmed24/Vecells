import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  requestPublicIdForDraft,
  type IntakeMissionFrameLocation,
  type IntakeMissionFrameMemory,
} from "./patient-intake-mission-frame.model";
import {
  AUTOSAVE_CHANNEL_NAME,
  DraftSaveAckState,
  continueEntryForLanding,
  buildMergePlanRecord,
  buildRecoveryRecordView,
  clearSessionSnapshot,
  continuitySnapshotForSession,
  createNeutralTruth,
  deriveDraftSaveTruth,
  readAuthoritativeRecord,
  readScenarioOverride,
  resolveMergeMemory,
  syncMemoryPresentation,
  type ContinueYourRequestEntry,
  type DraftAutosaveAuthoritativeRecord,
  type DraftMergePlanRecord,
  type DraftRecoveryRecordView,
  type DraftSaveSettlementRecord,
  type DraftSaveTruthBootstrap,
  type DraftSaveTruthView,
  type MergeResolution,
  type RecoveryReason,
  type SaveIntent,
  upsertAuthoritativeRecord,
  writeAuthoritativeRecord,
  writeLegacyMemory,
  writeSessionSnapshot,
} from "./patient-intake-save-truth";

const SAVE_IMMEDIATE_DELAY_MS = 120;
const SAVE_DEBOUNCE_DELAY_MS = 360;

function ownerWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createLocalSettlement(input: {
  ackState: DraftSaveAckState;
  draftPublicId: string;
  authoritativeDraftVersion: number;
  recordedAt: string;
  reasonCodes?: readonly string[];
  mergePlanRef?: string | null;
  recoveryRecordRef?: string | null;
}): DraftSaveSettlementRecord {
  return {
    settlementId: `session_settlement_${input.draftPublicId}_${input.recordedAt}`,
    ackState: input.ackState,
    authoritativeDraftVersion: input.authoritativeDraftVersion,
    recordedAt: input.recordedAt,
    reasonCodes: input.reasonCodes ?? [],
    continuityProjectionRef: null,
    mergePlanRef: input.mergePlanRef ?? null,
    recoveryRecordRef: input.recoveryRecordRef ?? null,
    source: "session_local",
  };
}

function memoryFingerprint(memory: IntakeMissionFrameMemory): string {
  return JSON.stringify({
    requestType: memory.requestType,
    structuredAnswers: memory.structuredAnswers,
    detailNarrative: memory.detailNarrative,
    supportingFocus: memory.supportingFocus,
    attachments: memory.attachments.map((attachment) => ({
      attachmentRef: attachment.attachmentRef,
      state: attachment.uiState,
      artifactMode: attachment.artifactMode,
    })),
    contactPreferences: memory.contactPreferences,
    completedStepKeys: memory.completedStepKeys,
    helperQuestionKey: memory.helperQuestionKey,
    summaryPeekOpen: memory.summaryPeekOpen,
    reviewAffirmed: memory.reviewAffirmed,
  });
}

function stripTransientUiState(memory: IntakeMissionFrameMemory): IntakeMissionFrameMemory {
  return {
    ...memory,
    savePresentation: "saved_authoritative",
  };
}

function mergeConflictNeeded(
  currentMemory: IntakeMissionFrameMemory,
  serverMemory: IntakeMissionFrameMemory,
): boolean {
  return memoryFingerprint(currentMemory) !== memoryFingerprint(serverMemory);
}

function clearScenarioAfterConsumption(draftPublicId: string): void {
  const storage = ownerWindow()?.localStorage;
  if (!storage) {
    return;
  }
  storage.removeItem(`patient-intake-autosave-scenario::${draftPublicId}`);
}

export interface DraftSaveResolution {
  pathname: string;
  memory: IntakeMissionFrameMemory;
}

interface UseDraftSaveTruthArgs {
  bootstrap: DraftSaveTruthBootstrap;
  location: IntakeMissionFrameLocation;
  memory: IntakeMissionFrameMemory;
}

interface ApplyLocalChangeInput {
  nextMemory: IntakeMissionFrameMemory;
  intent: SaveIntent;
}

export interface DraftSaveTruthController {
  truth: DraftSaveTruthView;
  continueEntry: ContinueYourRequestEntry | null;
  mergePlan: DraftMergePlanRecord | null;
  recoveryRecord: DraftRecoveryRecordView | null;
  sessionId: string;
  focusedFieldKey: string | null;
  savedScrollTop: number;
  applyLocalChange: (input: ApplyLocalChangeInput) => void;
  applyLocalOnlyMemory: (nextMemory: IntakeMissionFrameMemory) => void;
  flushPendingSave: () => void;
  resolveMergeChoice: (groupId: string, resolution: MergeResolution) => void;
  confirmMergeResolution: () => DraftSaveResolution | null;
  resolveRecoveryBridge: () => DraftSaveResolution | null;
  clearSessionState: () => void;
  registerFocusedField: (fieldKey: string | null) => void;
  registerScrollTop: (scrollTop: number) => void;
}

export function useDraftSaveTruth(args: UseDraftSaveTruthArgs): DraftSaveTruthController {
  const { bootstrap, location, memory } = args;
  const [authoritativeRecord, setAuthoritativeRecord] = useState<DraftAutosaveAuthoritativeRecord | null>(
    bootstrap.authoritativeRecord,
  );
  const [baseAuthoritativeDraftVersion, setBaseAuthoritativeDraftVersion] = useState(
    bootstrap.sessionSnapshot?.baseAuthoritativeDraftVersion ??
      bootstrap.authoritativeRecord?.continuityProjection.authoritativeDraftVersion ??
      bootstrap.initialMemory.draftVersion,
  );
  const [localDirty, setLocalDirty] = useState(bootstrap.sessionSnapshot?.localDirty ?? false);
  const [pendingIntent, setPendingIntent] = useState<SaveIntent>(
    bootstrap.sessionSnapshot?.pendingIntent ?? "none",
  );
  const [localSettlement, setLocalSettlement] = useState<DraftSaveSettlementRecord | null>(
    bootstrap.sessionSnapshot?.localSettlement ?? null,
  );
  const [mergePlan, setMergePlan] = useState<DraftMergePlanRecord | null>(
    bootstrap.sessionSnapshot?.mergePlan ?? null,
  );
  const [recoveryRecord, setRecoveryRecord] = useState<DraftRecoveryRecordView | null>(
    bootstrap.sessionSnapshot?.recoveryRecord ?? null,
  );
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(
    bootstrap.sessionSnapshot?.focusedFieldKey ?? null,
  );
  const [scrollTop, setScrollTop] = useState(bootstrap.sessionSnapshot?.scrollTop ?? 0);
  const [lastInteractionAt, setLastInteractionAt] = useState<string | null>(
    bootstrap.sessionSnapshot?.lastInteractionAt ?? null,
  );
  const pendingSaveTimerRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const sessionId = bootstrap.sessionId;

  const memoryRef = useRef(memory);
  const locationRef = useRef(location);
  const authoritativeRecordRef = useRef(authoritativeRecord);
  const localDirtyRef = useRef(localDirty);
  const pendingIntentRef = useRef(pendingIntent);
  const mergePlanRef = useRef(mergePlan);
  const recoveryRecordRef = useRef(recoveryRecord);
  const focusedFieldKeyRef = useRef(focusedFieldKey);
  const scrollTopRef = useRef(scrollTop);

  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  useEffect(() => {
    authoritativeRecordRef.current = authoritativeRecord;
  }, [authoritativeRecord]);
  useEffect(() => {
    localDirtyRef.current = localDirty;
  }, [localDirty]);
  useEffect(() => {
    pendingIntentRef.current = pendingIntent;
  }, [pendingIntent]);
  useEffect(() => {
    mergePlanRef.current = mergePlan;
  }, [mergePlan]);
  useEffect(() => {
    recoveryRecordRef.current = recoveryRecord;
  }, [recoveryRecord]);
  useEffect(() => {
    focusedFieldKeyRef.current = focusedFieldKey;
  }, [focusedFieldKey]);
  useEffect(() => {
    scrollTopRef.current = scrollTop;
  }, [scrollTop]);

  const persistSessionSnapshot = useEffectEvent(() => {
    const draftPublicId = locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId;
    const stepKey = locationRef.current.stepKey;
    writeSessionSnapshot(
      continuitySnapshotForSession({
        draftPublicId,
        sessionId,
        memory: memoryRef.current,
        authoritativeRecord: authoritativeRecordRef.current,
        baseAuthoritativeDraftVersion,
        localSettlement,
        mergePlan,
        recoveryRecord,
        localDirty,
        pendingIntent,
        currentPathname: locationRef.current.pathname,
        currentStepKey: stepKey,
        selectedAnchorKey:
          authoritativeRecordRef.current?.continuityProjection.selectedAnchorKey ??
          locationRef.current.continuityKey,
        focusedFieldKey,
        scrollTop,
        lastInteractionAt,
      }),
    );
    writeLegacyMemory(memoryRef.current);
  });

  useEffect(() => {
    persistSessionSnapshot();
  }, [
    focusedFieldKey,
    lastInteractionAt,
    localDirty,
    localSettlement,
    location.pathname,
    location.stepKey,
    memory,
    mergePlan,
    pendingIntent,
    persistSessionSnapshot,
    recoveryRecord,
    scrollTop,
    sessionId,
    baseAuthoritativeDraftVersion,
  ]);

  const continueEntry = useMemo(() => {
    if (location.routeKey !== "landing") {
      return null;
    }
    return continueEntryForLanding(nowIso());
  }, [location.routeKey]);

  const truth = useMemo(
    () =>
      deriveDraftSaveTruth({
        authoritativeRecord,
        localSettlement,
        mergePlan,
        recoveryRecord,
        localDirty,
        pendingIntent,
        nowIso: nowIso(),
      }),
    [authoritativeRecord, localSettlement, mergePlan, recoveryRecord, localDirty, pendingIntent],
  );

  useEffect(() => {
    if (!truth.shouldWarnOnHardExit) {
      return;
    }
    const nextWindow = ownerWindow();
    if (!nextWindow) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    nextWindow.addEventListener("beforeunload", handleBeforeUnload);
    return () => nextWindow.removeEventListener("beforeunload", handleBeforeUnload);
  }, [truth.shouldWarnOnHardExit]);

  const processExternalAuthoritativeUpdate = useEffectEvent((nextRecord: DraftAutosaveAuthoritativeRecord) => {
    setAuthoritativeRecord(nextRecord);
    if (recoveryRecordRef.current) {
      return;
    }
    const serverMemory = syncMemoryPresentation(
      nextRecord.authoritativeMemory,
      "saved",
      nextRecord.continuityProjection.lastSavedAt,
      nextRecord.continuityProjection.authoritativeDraftVersion,
    );
    if (localDirtyRef.current && mergeConflictNeeded(memoryRef.current, serverMemory)) {
      const nextMergePlan = buildMergePlanRecord({
        draftPublicId: nextRecord.draftPublicId,
        expectedDraftVersion:
          authoritativeRecordRef.current?.continuityProjection.authoritativeDraftVersion ??
          nextRecord.continuityProjection.authoritativeDraftVersion - 1,
        actualDraftVersion: nextRecord.continuityProjection.authoritativeDraftVersion,
        localMemory: memoryRef.current,
        serverMemory,
        localPathname: locationRef.current.pathname,
        serverPathname: nextRecord.continuityProjection.currentPathname,
        localSelectedAnchorKey: nextRecord.continuityProjection.selectedAnchorKey,
        serverSelectedAnchorKey: nextRecord.continuityProjection.selectedAnchorKey,
        openedAt: nowIso(),
      });
      setMergePlan(nextMergePlan);
      setLocalSettlement(
        createLocalSettlement({
          ackState: "merge_required",
          draftPublicId: nextRecord.draftPublicId,
          authoritativeDraftVersion: nextRecord.continuityProjection.authoritativeDraftVersion,
          recordedAt: nowIso(),
          reasonCodes: ["DRAFT_VERSION_CONFLICT", "CROSS_SESSION_UPDATE_DETECTED"],
          mergePlanRef: nextMergePlan.mergePlanId,
        }),
      );
      setPendingIntent("none");
      return;
    }
    setMergePlan(null);
    setLocalSettlement(null);
    setLocalDirty(false);
    setBaseAuthoritativeDraftVersion(nextRecord.continuityProjection.authoritativeDraftVersion);
  });

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    const channel = new BroadcastChannel(AUTOSAVE_CHANNEL_NAME);
    broadcastChannelRef.current = channel;
    const onMessage = (event: MessageEvent<{ draftPublicId: string; sessionId: string }>) => {
      if (event.data.draftPublicId !== (locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId)) {
        return;
      }
      if (event.data.sessionId === sessionId) {
        return;
      }
      const nextRecord = readAuthoritativeRecord(event.data.draftPublicId);
      if (!nextRecord) {
        return;
      }
      processExternalAuthoritativeUpdate(nextRecord);
    };
    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [processExternalAuthoritativeUpdate, sessionId]);

  useEffect(() => {
    const nextWindow = ownerWindow();
    if (!nextWindow) {
      return;
    }
    const onStorage = (event: StorageEvent) => {
      const draftPublicId = locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId;
      if (event.key !== `patient-intake-autosave-record::${draftPublicId}` || !event.newValue) {
        return;
      }
      const nextRecord = readAuthoritativeRecord(draftPublicId);
      if (!nextRecord || nextRecord.updatedBySessionId === sessionId) {
        return;
      }
      processExternalAuthoritativeUpdate(nextRecord);
    };
    nextWindow.addEventListener("storage", onStorage);
    return () => nextWindow.removeEventListener("storage", onStorage);
  }, [processExternalAuthoritativeUpdate, sessionId]);

  const clearPendingTimer = useEffectEvent(() => {
    const nextWindow = ownerWindow();
    if (pendingSaveTimerRef.current !== null && nextWindow) {
      nextWindow.clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }
  });

  const persistAuthoritativeSave = useEffectEvent((savedAt: string) => {
    const currentLocation = locationRef.current;
    const currentMemory = memoryRef.current;
    const nextRecord = upsertAuthoritativeRecord({
      existingRecord: authoritativeRecordRef.current,
      memory: stripTransientUiState(currentMemory),
      pathname: currentLocation.pathname,
      currentStepKey: currentLocation.stepKey,
      selectedAnchorKey:
        authoritativeRecordRef.current?.continuityProjection.selectedAnchorKey ??
        currentLocation.continuityKey,
      focusedFieldKey: focusedFieldKeyRef.current,
      scrollTop: scrollTopRef.current,
      sessionId,
      savedAt,
      requestPublicId: requestPublicIdForDraft(currentLocation.draftPublicId ?? currentMemory.draftPublicId),
    });
    const scenario = readScenarioOverride(nextRecord.draftPublicId);
    if (scenario?.continuityBlockedAfterNextSave || scenario?.forceBlockedRecovery) {
      nextRecord.continuityProjection = {
        ...nextRecord.continuityProjection,
        continuityState: scenario.forceBlockedRecovery ? "blocked" : "recovery_only",
        sameShellRecoveryState: scenario.forceBlockedRecovery ? "blocked" : "recovery_only",
        resumeBlockedReasonCodes: scenario.reasonCodes ?? ["CONTINUITY_EVIDENCE_STALE"],
      };
      const blockedRecovery = buildRecoveryRecordView({
        draftPublicId: nextRecord.draftPublicId,
        recoveryReason: "continuity_blocked",
        reasonCodes: scenario.reasonCodes ?? ["CONTINUITY_EVIDENCE_STALE"],
        recordedAt: savedAt,
        targetPathname: nextRecord.continuityProjection.currentPathname,
        localMemory: currentMemory,
        selectedAnchorKey: nextRecord.continuityProjection.selectedAnchorKey,
      });
      setRecoveryRecord(blockedRecovery);
    } else {
      setRecoveryRecord(null);
    }
    setAuthoritativeRecord(nextRecord);
    writeAuthoritativeRecord(nextRecord);
    broadcastChannelRef.current?.postMessage({
      draftPublicId: nextRecord.draftPublicId,
      sessionId,
    });
    clearScenarioAfterConsumption(nextRecord.draftPublicId);
    setLocalDirty(false);
    setPendingIntent("none");
    setLocalSettlement(null);
    setMergePlan(null);
    setBaseAuthoritativeDraftVersion(nextRecord.continuityProjection.authoritativeDraftVersion);
  });

  const openRecoveryFromScenario = useEffectEvent((reason: RecoveryReason, recordedAt: string) => {
    const currentLocation = locationRef.current;
    const currentMemory = memoryRef.current;
    const nextRecovery = buildRecoveryRecordView({
      draftPublicId: currentLocation.draftPublicId ?? currentMemory.draftPublicId,
      recoveryReason: reason,
      reasonCodes: [reason.toUpperCase()],
      recordedAt,
      targetPathname: currentLocation.pathname,
      localMemory: currentMemory,
      selectedAnchorKey:
        authoritativeRecordRef.current?.continuityProjection.selectedAnchorKey ??
        currentLocation.continuityKey,
    });
    setRecoveryRecord(nextRecovery);
    setLocalSettlement(
      createLocalSettlement({
        ackState: "recovery_required",
        draftPublicId: currentLocation.draftPublicId ?? currentMemory.draftPublicId,
        authoritativeDraftVersion:
          authoritativeRecordRef.current?.continuityProjection.authoritativeDraftVersion ??
          currentMemory.draftVersion,
        recordedAt,
        reasonCodes: nextRecovery.reasonCodes,
        recoveryRecordRef: nextRecovery.recoveryRecordId,
      }),
    );
    setPendingIntent("none");
  });

  const performSave = useEffectEvent(() => {
    if (mergePlanRef.current || recoveryRecordRef.current) {
      setPendingIntent("none");
      return;
    }
    if (!localDirtyRef.current) {
      setPendingIntent("none");
      return;
    }
    const recordedAt = nowIso();
    const scenario = readScenarioOverride(locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId);
    if (scenario?.leaseExpired || scenario?.recoveryReason) {
      openRecoveryFromScenario(
        scenario.recoveryReason ?? "lease_expired",
        recordedAt,
      );
      clearScenarioAfterConsumption(locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId);
      return;
    }

    const serverRecord = authoritativeRecordRef.current;
    const serverMemory = serverRecord?.authoritativeMemory ?? null;
    if (
      serverRecord &&
      mergeConflictNeeded(memoryRef.current, syncMemoryPresentation(serverMemory!, "saved")) &&
      baseAuthoritativeDraftVersion <
        serverRecord.continuityProjection.authoritativeDraftVersion
    ) {
      const nextMergePlan = buildMergePlanRecord({
        draftPublicId: serverRecord.draftPublicId,
        expectedDraftVersion: baseAuthoritativeDraftVersion,
        actualDraftVersion: serverRecord.continuityProjection.authoritativeDraftVersion,
        localMemory: memoryRef.current,
        serverMemory: syncMemoryPresentation(serverMemory!, "saved"),
        localPathname: locationRef.current.pathname,
        serverPathname: serverRecord.continuityProjection.currentPathname,
        localSelectedAnchorKey:
          authoritativeRecordRef.current?.continuityProjection.selectedAnchorKey ??
          locationRef.current.continuityKey,
        serverSelectedAnchorKey: serverRecord.continuityProjection.selectedAnchorKey,
        openedAt: recordedAt,
      });
      setMergePlan(nextMergePlan);
      setLocalSettlement(
        createLocalSettlement({
          ackState: "merge_required",
          draftPublicId: serverRecord.draftPublicId,
          authoritativeDraftVersion: serverRecord.continuityProjection.authoritativeDraftVersion,
          recordedAt,
          reasonCodes: ["DRAFT_VERSION_CONFLICT"],
          mergePlanRef: nextMergePlan.mergePlanId,
        }),
      );
      setPendingIntent("none");
      return;
    }

    persistAuthoritativeSave(recordedAt);
  });

  const scheduleSave = useEffectEvent((intent: SaveIntent) => {
    clearPendingTimer();
    if (intent === "none") {
      setPendingIntent("none");
      return;
    }
    setPendingIntent(intent);
    setLocalSettlement(
      createLocalSettlement({
        ackState: "local_ack",
        draftPublicId: locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId,
        authoritativeDraftVersion:
          authoritativeRecordRef.current?.continuityProjection.authoritativeDraftVersion ??
          memoryRef.current.draftVersion,
        recordedAt: nowIso(),
      }),
    );
    const nextWindow = ownerWindow();
    if (!nextWindow) {
      return;
    }
    pendingSaveTimerRef.current = nextWindow.setTimeout(
      () => {
        pendingSaveTimerRef.current = null;
        performSave();
      },
      intent === "immediate" ? SAVE_IMMEDIATE_DELAY_MS : SAVE_DEBOUNCE_DELAY_MS,
    );
  });

  const applyLocalChange = useEffectEvent((input: ApplyLocalChangeInput) => {
    setLocalDirty(true);
    setLastInteractionAt(nowIso());
    setRecoveryRecord(null);
    setMergePlan(null);
    scheduleSave(input.intent);
  });

  const applyLocalOnlyMemory = useEffectEvent(() => {
    setLastInteractionAt(nowIso());
  });

  const resolveMergeChoice = useEffectEvent((groupId: string, resolution: MergeResolution) => {
    setMergePlan((current) =>
      current
        ? {
            ...current,
            resolutionByGroup: {
              ...current.resolutionByGroup,
              [groupId]: resolution,
            },
            groups: current.groups.map((group) =>
              group.groupId === groupId
                ? {
                    ...group,
                    selectedResolution: resolution,
                  }
                : group,
            ),
          }
        : current,
    );
  });

  const confirmMergeResolution = useEffectEvent((): DraftSaveResolution | null => {
    const currentMergePlan = mergePlanRef.current;
    const record = authoritativeRecordRef.current;
    if (!currentMergePlan || !record) {
      return null;
    }
    const nextMemory = resolveMergeMemory({
      localMemory: memoryRef.current,
      serverMemory: syncMemoryPresentation(record.authoritativeMemory, "saved"),
      mergePlan: currentMergePlan,
    });
    const mergedMatchesServer = !mergeConflictNeeded(nextMemory, syncMemoryPresentation(record.authoritativeMemory, "saved"));
      setMergePlan(null);
      setLocalSettlement(null);
      if (mergedMatchesServer) {
        setLocalDirty(false);
        setBaseAuthoritativeDraftVersion(record.continuityProjection.authoritativeDraftVersion);
        return {
          pathname: record.continuityProjection.currentPathname,
          memory: syncMemoryPresentation(
          record.authoritativeMemory,
          "saved",
          record.continuityProjection.lastSavedAt,
          record.continuityProjection.authoritativeDraftVersion,
        ),
      };
    }
    memoryRef.current = syncMemoryPresentation(nextMemory, "saving");
    persistAuthoritativeSave(nowIso());
    return {
      pathname: locationRef.current.pathname,
      memory: syncMemoryPresentation(nextMemory, "saved"),
    };
  });

  const resolveRecoveryBridge = useEffectEvent((): DraftSaveResolution | null => {
    const record = authoritativeRecordRef.current;
    const currentRecovery = recoveryRecordRef.current;
    if (!record || !currentRecovery) {
      return null;
    }
    setRecoveryRecord(null);
    setLocalSettlement(null);
    setLocalDirty(false);
    setPendingIntent("none");
    setBaseAuthoritativeDraftVersion(record.continuityProjection.authoritativeDraftVersion);
    return {
      pathname: currentRecovery.targetPathname,
      memory: syncMemoryPresentation(
        record.authoritativeMemory,
        "saved",
        record.continuityProjection.lastSavedAt,
        record.continuityProjection.authoritativeDraftVersion,
      ),
    };
  });

  const clearSessionState = useEffectEvent(() => {
    const draftPublicId = locationRef.current.draftPublicId ?? memoryRef.current.draftPublicId;
    clearPendingTimer();
    clearSessionSnapshot(draftPublicId, sessionId);
  });

  const registerFocusedField = useEffectEvent((fieldKey: string | null) => {
    setFocusedFieldKey(fieldKey);
  });

  const registerScrollTop = useEffectEvent((nextScrollTop: number) => {
    setScrollTop(nextScrollTop);
  });

  return {
    truth: truth ?? createNeutralTruth(),
    continueEntry,
    mergePlan,
    recoveryRecord,
    sessionId,
    focusedFieldKey,
    savedScrollTop: scrollTop,
    applyLocalChange,
    applyLocalOnlyMemory,
    flushPendingSave: performSave,
    resolveMergeChoice,
    confirmMergeResolution,
    resolveRecoveryBridge,
    clearSessionState,
    registerFocusedField,
    registerScrollTop,
  };
}
