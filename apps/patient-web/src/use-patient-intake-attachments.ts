import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { IntakeMissionFrameMemory } from "./patient-intake-mission-frame.model";
import {
  buildAttachmentProcessingPlan,
  createAttachmentCard,
  patchAttachmentState,
  supportsCameraCapture,
  type AttachmentFileLike,
  type AttachmentSelectionSource,
  type IntakeAttachmentCard,
} from "./patient-intake-attachment-lane";

interface UsePatientIntakeAttachmentsArgs {
  memory: IntakeMissionFrameMemory;
  commitMemory: (
    nextMemory: IntakeMissionFrameMemory,
    intent: "immediate" | "debounced" | "none",
  ) => void;
}

export interface AttachmentAnnouncement {
  key: string;
  message: string;
}

export interface PatientIntakeAttachmentController {
  attachments: readonly IntakeAttachmentCard[];
  dragActive: boolean;
  previewAttachment: IntakeAttachmentCard | null;
  highlightedAttachmentRef: string | null;
  dropzoneFocusVersion: number;
  supportsCapture: boolean;
  announcement: AttachmentAnnouncement;
  setDragActive: (nextValue: boolean) => void;
  clearHighlight: () => void;
  addFiles: (
    files: readonly AttachmentFileLike[],
    source: AttachmentSelectionSource,
    replaceTargetRef?: string | null,
  ) => void;
  replaceFiles: (targetAttachmentRef: string, files: readonly AttachmentFileLike[]) => void;
  retryAttachment: (attachmentRef: string) => void;
  removeAttachment: (attachmentRef: string) => void;
  openPreview: (attachmentRef: string) => void;
  closePreview: () => void;
}

function ownerWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function nowIso(): string {
  return new Date().toISOString();
}

function updateAttachmentCollection(
  attachments: readonly IntakeAttachmentCard[],
  attachmentRef: string,
  updater: (attachment: IntakeAttachmentCard) => IntakeAttachmentCard,
): readonly IntakeAttachmentCard[] {
  return attachments.map((attachment) => {
    if (attachment.attachmentRef !== attachmentRef) {
      return {
        ...attachment,
        isDuplicateFocusTarget: false,
      };
    }
    return updater(attachment);
  });
}

export function usePatientIntakeAttachments(
  args: UsePatientIntakeAttachmentsArgs,
): PatientIntakeAttachmentController {
  const { memory, commitMemory } = args;
  const memoryRef = useRef(memory);
  const timersRef = useRef<Record<string, number[]>>({});
  const [dragActive, setDragActive] = useState(false);
  const [previewAttachmentRef, setPreviewAttachmentRef] = useState<string | null>(null);
  const [highlightedAttachmentRef, setHighlightedAttachmentRef] = useState<string | null>(null);
  const [dropzoneFocusVersion, setDropzoneFocusVersion] = useState(0);
  const [announcement, setAnnouncement] = useState<AttachmentAnnouncement>({
    key: "attachment-lane-idle",
    message: "Supporting files stay subordinate to the current request question.",
  });

  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);

  useEffect(() => {
    return () => {
      const nextWindow = ownerWindow();
      if (!nextWindow) {
        return;
      }
      for (const handles of Object.values(timersRef.current)) {
        for (const handle of handles) {
          nextWindow.clearTimeout(handle);
        }
      }
    };
  }, []);

  const supportsCapture = useMemo(() => {
    const nextWindow = ownerWindow();
    return supportsCameraCapture({
      userAgent: nextWindow?.navigator.userAgent,
      maxTouchPoints: nextWindow?.navigator.maxTouchPoints,
    });
  }, []);

  const previewAttachment = useMemo(
    () =>
      previewAttachmentRef
        ? memory.attachments.find((attachment) => attachment.attachmentRef === previewAttachmentRef) ?? null
        : null,
    [memory.attachments, previewAttachmentRef],
  );

  const clearAttachmentTimers = useEffectEvent((attachmentRef: string) => {
    const nextWindow = ownerWindow();
    if (!nextWindow) {
      return;
    }
    for (const handle of timersRef.current[attachmentRef] ?? []) {
      nextWindow.clearTimeout(handle);
    }
    delete timersRef.current[attachmentRef];
  });

  const commitAttachments = useEffectEvent(
    (
      updater: (attachments: readonly IntakeAttachmentCard[]) => readonly IntakeAttachmentCard[],
      intent: "immediate" | "debounced" | "none",
    ) => {
      const current = memoryRef.current;
      const nextMemory = {
        ...current,
        attachments: updater(current.attachments),
      };
      memoryRef.current = nextMemory;
      commitMemory(nextMemory, intent);
    },
  );

  const announce = useEffectEvent((key: string, message: string) => {
    setAnnouncement({ key, message });
  });

  const scheduleAttachmentFlow = useEffectEvent((
    attachmentRef: string,
    attachmentSeed?: IntakeAttachmentCard,
  ) => {
    const nextWindow = ownerWindow();
    if (!nextWindow) {
      return;
    }
    clearAttachmentTimers(attachmentRef);
    const currentAttachment =
      attachmentSeed ??
      memoryRef.current.attachments.find((attachment) => attachment.attachmentRef === attachmentRef);
    if (!currentAttachment) {
      return;
    }
    const plan = buildAttachmentProcessingPlan({
      name: currentAttachment.filename,
      size: currentAttachment.sizeBytes,
      type: currentAttachment.mimeType,
    });
    const effectivePlan =
      currentAttachment.retryCount > 0 && plan.terminalState == "retryable_transfer_failure"
        ? {
            ...plan,
            terminalState: "ready_kept" as const,
            lifecycleState: "promoted" as const,
            quarantineState: "not_quarantined" as const,
            currentSafeMode: "governed_preview" as const,
            artifactMode: "governed_preview" as const,
            documentReferenceState: "created" as const,
            outcomeRef: "ATTACH_OUTCOME_ACCEPTED_SAFE",
            stateReasonCode: "retry_recovered_ready_kept",
            previewAvailable: true,
          }
        : plan;
    const handles: number[] = [];
    const queuedUpdates = [
      {
        afterMs: 120,
        intent: "none" as const,
        update: (attachment: IntakeAttachmentCard) =>
          patchAttachmentState(attachment, {
            uiState: "uploading_to_quarantine",
            lifecycleState: "upload_pending",
            quarantineState: "not_started",
            currentSafeMode: "not_started",
            artifactMode: "summary_only",
            documentReferenceState: "not_created",
            stateReasonCode: "uploading_to_quarantine",
            progressPercent: 42,
            previewAvailable: false,
            nowIso: nowIso(),
          }),
      },
      {
        afterMs: 360,
        intent: "none" as const,
        update: (attachment: IntakeAttachmentCard) =>
          patchAttachmentState(attachment, {
            uiState:
              effectivePlan.terminalState === "retryable_transfer_failure"
                ? "uploading_to_quarantine"
                : "scanning",
            lifecycleState:
              effectivePlan.terminalState === "retryable_transfer_failure"
                ? "upload_pending"
                : "scanning",
            quarantineState:
              plan.terminalState === "retryable_transfer_failure"
                ? "not_started"
                : "not_started",
            currentSafeMode:
              effectivePlan.terminalState === "retryable_transfer_failure"
                ? "not_started"
                : "recovery_only",
            artifactMode:
              effectivePlan.terminalState === "retryable_transfer_failure"
                ? "summary_only"
                : "recovery_only",
            documentReferenceState: "not_created",
            stateReasonCode:
              effectivePlan.terminalState === "retryable_transfer_failure"
                ? "uploading_to_quarantine"
                : "scanning",
            progressPercent:
              effectivePlan.terminalState === "retryable_transfer_failure" ? 64 : null,
            previewAvailable: false,
            nowIso: nowIso(),
          }),
      },
      {
        afterMs: 780,
        intent: "immediate" as const,
        update: (attachment: IntakeAttachmentCard) =>
          patchAttachmentState(attachment, {
            uiState: effectivePlan.terminalState,
            lifecycleState: effectivePlan.lifecycleState,
            quarantineState: effectivePlan.quarantineState,
            currentSafeMode: effectivePlan.currentSafeMode,
            artifactMode: effectivePlan.artifactMode,
            documentReferenceState: effectivePlan.documentReferenceState,
            stateReasonCode: effectivePlan.stateReasonCode,
            progressPercent: null,
            outcomeRef: effectivePlan.outcomeRef,
            previewAvailable: effectivePlan.previewAvailable,
            nowIso: nowIso(),
          }),
      },
    ];
    for (const queuedUpdate of queuedUpdates) {
      const handle = nextWindow.setTimeout(() => {
        commitAttachments(
          (attachments) =>
            updateAttachmentCollection(attachments, attachmentRef, queuedUpdate.update),
          queuedUpdate.intent,
        );
        const updated = memoryRef.current.attachments.find(
          (attachment) => attachment.attachmentRef === attachmentRef,
        );
        if (updated) {
          announce(updated.announcementKey, updated.liveAnnouncement);
        }
      }, queuedUpdate.afterMs);
      handles.push(handle);
    }
    timersRef.current[attachmentRef] = handles;
  });

  const addFiles = useEffectEvent(
    (
      files: readonly AttachmentFileLike[],
      source: AttachmentSelectionSource,
      replaceTargetRef: string | null = null,
    ) => {
      const now = nowIso();
      const currentAttachments = memoryRef.current.attachments;
      const stagedCards: IntakeAttachmentCard[] = [];
      const duplicatePatches = new Map<string, string>();

      for (const file of files) {
        const newCard = createAttachmentCard({
          file,
          selectionSource: source,
          nowIso: now,
          replaceTargetRef,
        });
        const duplicate = currentAttachments.find(
          (attachment) =>
            attachment.keptInDraft && attachment.duplicateFingerprint === newCard.duplicateFingerprint,
        );
        if (duplicate) {
          duplicatePatches.set(
            duplicate.attachmentRef,
            `We kept the earlier evidence card for ${duplicate.filename} and did not create a duplicate row.`,
          );
          setHighlightedAttachmentRef(duplicate.attachmentRef);
          announce(
            `${duplicate.attachmentRef}:duplicate:${now}`,
            `${duplicate.filename}: earlier evidence kept. No duplicate row was created.`,
          );
          continue;
        }
        stagedCards.push(newCard);
      }

      if (duplicatePatches.size > 0) {
        commitAttachments(
          (attachments) =>
            attachments.map((attachment) =>
              duplicatePatches.has(attachment.attachmentRef)
                ? {
                    ...attachment,
                    duplicateNotice: duplicatePatches.get(attachment.attachmentRef) ?? null,
                    isDuplicateFocusTarget: true,
                    announcementKey: `${attachment.attachmentRef}:duplicate:${now}`,
                  }
                : {
                    ...attachment,
                    isDuplicateFocusTarget: false,
                  },
            ),
          "none",
        );
      }

      if (stagedCards.length === 0) {
        return;
      }

      setHighlightedAttachmentRef(stagedCards[0]?.attachmentRef ?? null);
      commitAttachments((attachments) => [...attachments, ...stagedCards], "immediate");
      for (const stagedCard of stagedCards) {
        announce(stagedCard.announcementKey, stagedCard.liveAnnouncement);
        scheduleAttachmentFlow(stagedCard.attachmentRef, stagedCard);
      }
    },
  );

  const replaceFiles = useEffectEvent((targetAttachmentRef: string, files: readonly AttachmentFileLike[]) => {
    if (files.length === 0) {
      return;
    }
    const now = nowIso();
    const currentAttachments = memoryRef.current.attachments;
    const replacedAttachments = currentAttachments.map((attachment) =>
      attachment.attachmentRef === targetAttachmentRef
        ? patchAttachmentState(attachment, {
            uiState: "replaced",
            lifecycleState: "replaced",
            quarantineState: attachment.quarantineState,
            currentSafeMode: "recovery_only",
            artifactMode: "recovery_only",
            documentReferenceState: attachment.documentReferenceState,
            stateReasonCode: "replaced_by_new_file",
            keptInDraft: false,
            replacedAt: now,
            nowIso: now,
          })
        : attachment,
    );
    const retainedAfterReplace = [...replacedAttachments.filter((attachment) => attachment.keptInDraft)];
    const stagedCards: IntakeAttachmentCard[] = [];
    const duplicatePatches = new Map<string, string>();
    let duplicateFocusAttachmentRef: string | null = null;

    for (const file of files) {
      const newCard = createAttachmentCard({
        file,
        selectionSource: "replace",
        nowIso: now,
        replaceTargetRef: targetAttachmentRef,
      });
      const duplicate = retainedAfterReplace.find(
        (attachment) =>
          attachment.keptInDraft && attachment.duplicateFingerprint === newCard.duplicateFingerprint,
      );
      if (duplicate) {
        duplicateFocusAttachmentRef ??= duplicate.attachmentRef;
        duplicatePatches.set(
          duplicate.attachmentRef,
          `We kept the earlier evidence card for ${duplicate.filename} and did not create a duplicate row.`,
        );
        announce(
          `${duplicate.attachmentRef}:duplicate:${now}`,
          `${duplicate.filename}: earlier evidence kept. No duplicate row was created.`,
        );
        continue;
      }
      stagedCards.push(newCard);
      retainedAfterReplace.push(newCard);
    }

    clearAttachmentTimers(targetAttachmentRef);
    if (stagedCards[0]) {
      setHighlightedAttachmentRef(stagedCards[0].attachmentRef);
    } else if (duplicateFocusAttachmentRef) {
      setHighlightedAttachmentRef(duplicateFocusAttachmentRef);
    } else {
      setHighlightedAttachmentRef(targetAttachmentRef);
    }
    commitAttachments(
      () => {
        const patchedAttachments =
          duplicatePatches.size > 0
            ? replacedAttachments.map((attachment) =>
                duplicatePatches.has(attachment.attachmentRef)
                  ? {
                      ...attachment,
                      duplicateNotice: duplicatePatches.get(attachment.attachmentRef) ?? null,
                      isDuplicateFocusTarget: true,
                      announcementKey: `${attachment.attachmentRef}:duplicate:${now}`,
                    }
                  : {
                      ...attachment,
                      isDuplicateFocusTarget: false,
                    },
              )
            : replacedAttachments.map((attachment) => ({
                ...attachment,
                isDuplicateFocusTarget: false,
              }));
        return [...patchedAttachments, ...stagedCards];
      },
      "immediate",
    );
    for (const stagedCard of stagedCards) {
      announce(stagedCard.announcementKey, stagedCard.liveAnnouncement);
      scheduleAttachmentFlow(stagedCard.attachmentRef, stagedCard);
    }
    setPreviewAttachmentRef((current) => (current === targetAttachmentRef ? null : current));
  });

  const retryAttachment = useEffectEvent((attachmentRef: string) => {
    clearAttachmentTimers(attachmentRef);
    const currentAttachment = memoryRef.current.attachments.find(
      (attachment) => attachment.attachmentRef === attachmentRef,
    );
    const retriedAttachment = currentAttachment
      ? {
          ...patchAttachmentState(currentAttachment, {
            uiState: "selecting",
            lifecycleState: "initiated",
            quarantineState: "not_started",
            currentSafeMode: "not_started",
            artifactMode: "summary_only",
            documentReferenceState: "not_created",
            stateReasonCode: "retrying_transfer",
            progressPercent: null,
            outcomeRef: null,
            previewAvailable: false,
            duplicateNotice: null,
            nowIso: nowIso(),
          }),
          retryCount: currentAttachment.retryCount + 1,
        }
      : null;
    commitAttachments(
      (attachments) =>
        updateAttachmentCollection(attachments, attachmentRef, (attachment) =>
          attachment.attachmentRef === attachmentRef && retriedAttachment
            ? retriedAttachment
            : {
                ...patchAttachmentState(attachment, {
                  uiState: "selecting",
                  lifecycleState: "initiated",
                  quarantineState: "not_started",
                  currentSafeMode: "not_started",
                  artifactMode: "summary_only",
                  documentReferenceState: "not_created",
                  stateReasonCode: "retrying_transfer",
                  progressPercent: null,
                  outcomeRef: null,
                  previewAvailable: false,
                  duplicateNotice: null,
                  nowIso: nowIso(),
                }),
                retryCount: attachment.retryCount + 1,
              },
        ),
      "immediate",
    );
    setHighlightedAttachmentRef(attachmentRef);
    if (retriedAttachment) {
      scheduleAttachmentFlow(attachmentRef, retriedAttachment);
    }
  });

  const removeAttachment = useEffectEvent((attachmentRef: string) => {
    const now = nowIso();
    clearAttachmentTimers(attachmentRef);
    commitAttachments(
      (attachments) =>
        updateAttachmentCollection(attachments, attachmentRef, (attachment) =>
          patchAttachmentState(attachment, {
            uiState: "removed",
            lifecycleState: "removed",
            quarantineState: attachment.quarantineState,
            currentSafeMode: "recovery_only",
            artifactMode: "recovery_only",
            documentReferenceState: attachment.documentReferenceState,
            stateReasonCode: "removed_by_user",
            keptInDraft: false,
            removedAt: now,
            nowIso: now,
          }),
        ),
      "immediate",
    );
    setPreviewAttachmentRef((current) => (current === attachmentRef ? null : current));
    setHighlightedAttachmentRef(null);
    setDropzoneFocusVersion((current) => current + 1);
    announce(`${attachmentRef}:removed:${now}`, "File removed. The evidence lane keeps your place.");
  });

  const openPreview = useEffectEvent((attachmentRef: string) => {
    setPreviewAttachmentRef(attachmentRef);
    setHighlightedAttachmentRef(attachmentRef);
  });

  const closePreview = useEffectEvent(() => {
    setPreviewAttachmentRef(null);
  });

  const clearHighlight = useEffectEvent(() => {
    setHighlightedAttachmentRef(null);
  });

  return {
    attachments: memory.attachments,
    dragActive,
    previewAttachment,
    highlightedAttachmentRef,
    dropzoneFocusVersion,
    supportsCapture,
    announcement,
    setDragActive,
    clearHighlight,
    addFiles,
    replaceFiles,
    retryAttachment,
    removeAttachment,
    openPreview,
    closePreview,
  };
}
