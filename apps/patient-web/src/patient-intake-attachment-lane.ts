export const ATTACHMENT_FRONTEND_STATE_CONTRACT_ID =
  "PHASE1_ATTACHMENT_FRONTEND_STATE_CONTRACT_V1";
export const ATTACHMENT_PUBLIC_PIPELINE_CONTRACT_ID = "PHASE1_ATTACHMENT_PIPELINE_PUBLIC_V1";
export const ATTACHMENT_PRESENTATION_CONTRACT_REF = "APC_141_INTAKE_ATTACHMENT_V1";
export const ATTACHMENT_NAVIGATION_POLICY_REF = "ONG_141_INTAKE_ATTACHMENT_HANDOFF_V1";
export const ATTACHMENT_INLINE_PREVIEW_CONTRACT_REF = "IPC_141_ATTACHMENT_INLINE_PREVIEW_V1";
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
export const MAX_INLINE_PREVIEW_BYTES = 8 * 1024 * 1024;

const ACCEPTED_RULES = [
  {
    ruleRef: "ATTACH_RULE_IMAGE_JPEG_PNG",
    mimeTypes: ["image/jpeg", "image/png"],
    extensions: [".jpg", ".jpeg", ".png"],
    directCameraCaptureSupport: true,
  },
  {
    ruleRef: "ATTACH_RULE_IMAGE_HEIC",
    mimeTypes: ["image/heic", "image/heif"],
    extensions: [".heic", ".heif"],
    directCameraCaptureSupport: true,
  },
  {
    ruleRef: "ATTACH_RULE_PDF",
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    directCameraCaptureSupport: false,
  },
] as const;

export type AttachmentSelectionSource = "picker" | "drag_drop" | "camera_capture" | "replace";
export type AttachmentActionTone = "neutral" | "safe" | "retry" | "quarantine" | "preview";
export type AttachmentCardTone = "upload" | "safe" | "retry" | "quarantine" | "removed";
export type AttachmentDocumentReferenceState = "not_created" | "created";
export type AttachmentDuplicateDisposition = "new_upload" | "reuse_existing_attachment";
export type AttachmentCurrentSafeMode =
  | "governed_preview"
  | "placeholder_only"
  | "recovery_only"
  | "not_started";
export type AttachmentQuarantineState = "not_started" | "not_quarantined" | "quarantined";
export type AttachmentLifecycleState =
  | "initiated"
  | "upload_pending"
  | "uploaded_unverified"
  | "scanning"
  | "safe_pending_promotion"
  | "promoted"
  | "quarantined"
  | "rejected_policy"
  | "scan_failed_retryable"
  | "removed"
  | "replaced";
export type AttachmentUiState =
  | "selecting"
  | "uploading_to_quarantine"
  | "scanning"
  | "ready_kept"
  | "preview_unavailable_kept"
  | "retryable_transfer_failure"
  | "quarantined_unsupported_type"
  | "quarantined_unreadable"
  | "quarantined_malware"
  | "removed"
  | "replaced";
export type AttachmentNavigationGrantAction = "open_in_browser" | "download";

export interface AttachmentFileLike {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

export interface AttachmentNavigationGrant {
  grantId: string;
  action: AttachmentNavigationGrantAction;
  contractRef: typeof ATTACHMENT_PRESENTATION_CONTRACT_REF;
  policyRef: typeof ATTACHMENT_NAVIGATION_POLICY_REF;
  href: string;
}

export interface IntakeAttachmentCard {
  attachmentRef: string;
  uploadSessionId: string;
  filename: string;
  fileExtension: string;
  mimeType: string;
  sizeBytes: number;
  selectionSource: AttachmentSelectionSource;
  duplicateFingerprint: string;
  duplicateDisposition: AttachmentDuplicateDisposition;
  uiState: AttachmentUiState;
  lifecycleState: AttachmentLifecycleState;
  quarantineState: AttachmentQuarantineState;
  currentSafeMode: AttachmentCurrentSafeMode;
  artifactMode: "summary_only" | "governed_preview" | "placeholder_only" | "recovery_only";
  documentReferenceState: AttachmentDocumentReferenceState;
  ruleRef: string | null;
  outcomeRef: string | null;
  stateReasonCode: string;
  retryCount: number;
  progressPercent: number | null;
  previewAvailable: boolean;
  evidenceNote: string;
  duplicateNotice: string | null;
  isDuplicateFocusTarget: boolean;
  replacesAttachmentRef: string | null;
  removedAt: string | null;
  replacedAt: string | null;
  keptInDraft: boolean;
  liveAnnouncement: string;
  announcementKey: string;
  stateUpdatedAt: string;
  navigationGrants: readonly AttachmentNavigationGrant[];
}

export interface AttachmentUiCopy {
  pill: string;
  detail: string;
  tone: AttachmentCardTone;
  helper: string;
}

export interface AttachmentProcessingPlan {
  terminalState: AttachmentUiState;
  lifecycleState: AttachmentLifecycleState;
  quarantineState: AttachmentQuarantineState;
  currentSafeMode: AttachmentCurrentSafeMode;
  artifactMode: IntakeAttachmentCard["artifactMode"];
  documentReferenceState: AttachmentDocumentReferenceState;
  outcomeRef: string | null;
  stateReasonCode: string;
  previewAvailable: boolean;
}

function hashString(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(10, "0");
}

function normalizedExtension(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex === -1 ? "" : name.slice(dotIndex).toLowerCase();
}

function mediaTypeFromName(name: string): string {
  const extension = normalizedExtension(name);
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".heic" || extension === ".heif") {
    return "image/heic";
  }
  if (extension === ".pdf") {
    return "application/pdf";
  }
  return "application/octet-stream";
}

function matchedRule(file: AttachmentFileLike) {
  const extension = normalizedExtension(file.name);
  const mediaType = file.type || mediaTypeFromName(file.name);
  return (
    ACCEPTED_RULES.find(
      (rule) =>
        (rule.mimeTypes as readonly string[]).includes(mediaType) ||
        (rule.extensions as readonly string[]).includes(extension),
    ) ?? null
  );
}

function previewGrantHref(attachmentRef: string, action: AttachmentNavigationGrantAction): string {
  return `/artifacts/attachment/${attachmentRef}/${action}?grant=${hashString(
    `${attachmentRef}:${action}:grant`,
  )}`;
}

export function isAttachmentRetained(card: IntakeAttachmentCard): boolean {
  return card.keptInDraft;
}

export function isAttachmentVisible(card: IntakeAttachmentCard): boolean {
  return card.uiState !== "removed" || Boolean(card.removedAt);
}

export function activeAttachmentCount(cards: readonly IntakeAttachmentCard[]): number {
  return cards.filter((card) => card.keptInDraft).length;
}

export function activeAttachmentRefs(cards: readonly IntakeAttachmentCard[]): readonly string[] {
  return cards.filter((card) => card.keptInDraft).map((card) => card.attachmentRef);
}

export function formatAttachmentBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function supportsCameraCapture(runtime: {
  userAgent?: string;
  maxTouchPoints?: number;
}): boolean {
  const userAgent = runtime.userAgent ?? "";
  return runtime.maxTouchPoints ? runtime.maxTouchPoints > 0 : /Android|iPhone|iPad|Mobile/i.test(userAgent);
}

export function duplicateFingerprintForFile(file: AttachmentFileLike): string {
  const mediaType = file.type || mediaTypeFromName(file.name);
  return hashString(`${file.name.toLowerCase()}:${file.size}:${mediaType.toLowerCase()}`);
}

export function buildAttachmentProcessingPlan(file: AttachmentFileLike): AttachmentProcessingPlan {
  const extension = normalizedExtension(file.name);
  const filenameLower = file.name.toLowerCase();
  const rule = matchedRule(file);

  if (!rule || file.size > MAX_ATTACHMENT_BYTES) {
    return {
      terminalState: "quarantined_unsupported_type",
      lifecycleState: "rejected_policy",
      quarantineState: "quarantined",
      currentSafeMode: "recovery_only",
      artifactMode: "recovery_only",
      documentReferenceState: "not_created",
      outcomeRef: "ATTACH_OUTCOME_QUARANTINED_UNSUPPORTED_TYPE",
      stateReasonCode: "unsupported_type",
      previewAvailable: false,
    };
  }

  if (/(malware|virus|trojan)/i.test(filenameLower)) {
    return {
      terminalState: "quarantined_malware",
      lifecycleState: "quarantined",
      quarantineState: "quarantined",
      currentSafeMode: "recovery_only",
      artifactMode: "recovery_only",
      documentReferenceState: "not_created",
      outcomeRef: "ATTACH_OUTCOME_QUARANTINED_MALWARE",
      stateReasonCode: "malware_detected",
      previewAvailable: false,
    };
  }

  if (/(unreadable|corrupt|checksum|integrity)/i.test(filenameLower)) {
    return {
      terminalState: "quarantined_unreadable",
      lifecycleState: "quarantined",
      quarantineState: "quarantined",
      currentSafeMode: "recovery_only",
      artifactMode: "recovery_only",
      documentReferenceState: "not_created",
      outcomeRef: "ATTACH_OUTCOME_QUARANTINED_INTEGRITY_FAILURE",
      stateReasonCode: "unreadable_or_integrity_failure",
      previewAvailable: false,
    };
  }

  if (/(retry|timeout|offline|transfer)/i.test(filenameLower)) {
    return {
      terminalState: "retryable_transfer_failure",
      lifecycleState: "scan_failed_retryable",
      quarantineState: "not_started",
      currentSafeMode: "recovery_only",
      artifactMode: "recovery_only",
      documentReferenceState: "not_created",
      outcomeRef: "ATTACH_OUTCOME_RETRYABLE_TRANSFER_FAILURE",
      stateReasonCode: "retryable_transfer_failure",
      previewAvailable: false,
    };
  }

  if (extension === ".heic" || extension === ".heif" || file.size > MAX_INLINE_PREVIEW_BYTES) {
    return {
      terminalState: "preview_unavailable_kept",
      lifecycleState: "promoted",
      quarantineState: "not_quarantined",
      currentSafeMode: "placeholder_only",
      artifactMode: "placeholder_only",
      documentReferenceState: "created",
      outcomeRef: "ATTACH_OUTCOME_PREVIEW_UNAVAILABLE_BUT_FILE_KEPT",
      stateReasonCode: "preview_unavailable_but_kept",
      previewAvailable: false,
    };
  }

  return {
    terminalState: "ready_kept",
    lifecycleState: "promoted",
    quarantineState: "not_quarantined",
    currentSafeMode: "governed_preview",
    artifactMode: "governed_preview",
    documentReferenceState: "created",
    outcomeRef: "ATTACH_OUTCOME_ACCEPTED_SAFE",
    stateReasonCode: "ready_kept",
    previewAvailable: true,
  };
}

export function attachmentUiCopy(state: AttachmentUiState): AttachmentUiCopy {
  switch (state) {
    case "selecting":
      return {
        pill: "Selecting",
        detail: "Preparing one governed evidence slot before anything is trusted.",
        tone: "upload",
        helper: "Selected locally. Quarantine upload has not started yet.",
      };
    case "uploading_to_quarantine":
      return {
        pill: "Uploading to quarantine",
        detail: "Moving the file into quarantine so it can be checked before use.",
        tone: "upload",
        helper: "This file is not trusted yet.",
      };
    case "scanning":
      return {
        pill: "Scanning",
        detail: "Checks are still running. The shell keeps your place while we wait.",
        tone: "upload",
        helper: "Keep working in this step. Final meaning is still pending.",
      };
    case "ready_kept":
      return {
        pill: "Ready / kept",
        detail: "Checked and kept. Preview stays governed inside the same shell.",
        tone: "safe",
        helper: "Safe supporting evidence is ready to travel with this request.",
      };
    case "preview_unavailable_kept":
      return {
        pill: "Preview unavailable but kept",
        detail: "The file was kept, but inline preview is not available for this safe version.",
        tone: "safe",
        helper: "A governed placeholder stands in until a safe preview is available.",
      };
    case "retryable_transfer_failure":
      return {
        pill: "Retryable transfer failure",
        detail: "The upload did not reach quarantine. You can retry without losing this step.",
        tone: "retry",
        helper: "This is not the same as quarantine. The file has not been accepted yet.",
      };
    case "quarantined_unsupported_type":
      return {
        pill: "Quarantined unsupported type",
        detail: "This format is not accepted for Phase 1 evidence, so it stays blocked.",
        tone: "quarantine",
        helper: "Replace it with a JPG, PNG, HEIC, or PDF file.",
      };
    case "quarantined_unreadable":
      return {
        pill: "Quarantined unreadable / integrity failure",
        detail: "The file could not be read safely, so it remains fail-closed.",
        tone: "quarantine",
        helper: "Use Replace or Remove. This evidence is not being used.",
      };
    case "quarantined_malware":
      return {
        pill: "Quarantined malware",
        detail: "The file was blocked as unsafe and will not be used for this request.",
        tone: "quarantine",
        helper: "Remove it or replace it with a clean file.",
      };
    case "removed":
      return {
        pill: "Removed",
        detail: "This file was removed from the evidence lane and will not travel with the request.",
        tone: "removed",
        helper: "The card stays visible for continuity until the shell changes state.",
      };
    case "replaced":
      return {
        pill: "Replaced",
        detail: "A newer file took this slot. This older version is now retained only for continuity.",
        tone: "removed",
        helper: "The replacement card carries the active evidence state.",
      };
  }
}

export function buildAttachmentNavigationGrants(
  attachmentRef: string,
): readonly AttachmentNavigationGrant[] {
  return [
    {
      grantId: `grant_${hashString(`${attachmentRef}:open`)}`,
      action: "open_in_browser",
      contractRef: ATTACHMENT_PRESENTATION_CONTRACT_REF,
      policyRef: ATTACHMENT_NAVIGATION_POLICY_REF,
      href: previewGrantHref(attachmentRef, "open_in_browser"),
    },
    {
      grantId: `grant_${hashString(`${attachmentRef}:download`)}`,
      action: "download",
      contractRef: ATTACHMENT_PRESENTATION_CONTRACT_REF,
      policyRef: ATTACHMENT_NAVIGATION_POLICY_REF,
      href: previewGrantHref(attachmentRef, "download"),
    },
  ];
}

export function createAttachmentCard(input: {
  file: AttachmentFileLike;
  selectionSource: AttachmentSelectionSource;
  nowIso: string;
  replaceTargetRef?: string | null;
}): IntakeAttachmentCard {
  const extension = normalizedExtension(input.file.name);
  const mediaType = input.file.type || mediaTypeFromName(input.file.name);
  const fingerprint = duplicateFingerprintForFile(input.file);
  const rule = matchedRule(input.file);
  const attachmentRef = `att_${hashString(
    `${fingerprint}:${input.file.name}:${input.file.lastModified ?? input.nowIso}`,
  ).slice(0, 12)}`;
  const uploadSessionId = `upl_${hashString(`${attachmentRef}:${input.nowIso}`)}`;
  const uiCopy = attachmentUiCopy("selecting");
  return {
    attachmentRef,
    uploadSessionId,
    filename: input.file.name,
    fileExtension: extension,
    mimeType: mediaType,
    sizeBytes: input.file.size,
    selectionSource: input.selectionSource,
    duplicateFingerprint: fingerprint,
    duplicateDisposition: "new_upload",
    uiState: "selecting",
    lifecycleState: "initiated",
    quarantineState: "not_started",
    currentSafeMode: "not_started",
    artifactMode: "summary_only",
    documentReferenceState: "not_created",
    ruleRef: rule?.ruleRef ?? null,
    outcomeRef: null,
    stateReasonCode: "selecting",
    retryCount: 0,
    progressPercent: null,
    previewAvailable: false,
    evidenceNote: uiCopy.detail,
    duplicateNotice: null,
    isDuplicateFocusTarget: false,
    replacesAttachmentRef: input.replaceTargetRef ?? null,
    removedAt: null,
    replacedAt: null,
    keptInDraft: true,
    liveAnnouncement: `${input.file.name} selected. Quarantine upload has not started yet.`,
    announcementKey: `${attachmentRef}:selecting:${input.nowIso}`,
    stateUpdatedAt: input.nowIso,
    navigationGrants: buildAttachmentNavigationGrants(attachmentRef),
  };
}

export function patchAttachmentState(
  attachment: IntakeAttachmentCard,
  next: {
    uiState: AttachmentUiState;
    lifecycleState: AttachmentLifecycleState;
    quarantineState: AttachmentQuarantineState;
    currentSafeMode: AttachmentCurrentSafeMode;
    artifactMode: IntakeAttachmentCard["artifactMode"];
    documentReferenceState: AttachmentDocumentReferenceState;
    stateReasonCode: string;
    progressPercent?: number | null;
    outcomeRef?: string | null;
    previewAvailable?: boolean;
    keptInDraft?: boolean;
    removedAt?: string | null;
    replacedAt?: string | null;
    duplicateNotice?: string | null;
    isDuplicateFocusTarget?: boolean;
    nowIso: string;
  },
): IntakeAttachmentCard {
  const copy = attachmentUiCopy(next.uiState);
  return {
    ...attachment,
    uiState: next.uiState,
    lifecycleState: next.lifecycleState,
    quarantineState: next.quarantineState,
    currentSafeMode: next.currentSafeMode,
    artifactMode: next.artifactMode,
    documentReferenceState: next.documentReferenceState,
    stateReasonCode: next.stateReasonCode,
    retryCount: attachment.retryCount,
    progressPercent: next.progressPercent ?? null,
    outcomeRef: next.outcomeRef ?? attachment.outcomeRef,
    previewAvailable: next.previewAvailable ?? attachment.previewAvailable,
    evidenceNote: copy.detail,
    keptInDraft: next.keptInDraft ?? attachment.keptInDraft,
    removedAt: next.removedAt ?? attachment.removedAt,
    replacedAt: next.replacedAt ?? attachment.replacedAt,
    duplicateNotice: next.duplicateNotice ?? attachment.duplicateNotice,
    isDuplicateFocusTarget: next.isDuplicateFocusTarget ?? attachment.isDuplicateFocusTarget,
    liveAnnouncement: `${attachment.filename}: ${copy.pill}.`,
    announcementKey: `${attachment.attachmentRef}:${next.uiState}:${next.nowIso}`,
    stateUpdatedAt: next.nowIso,
  };
}

export function normalizeIntakeAttachmentCards(
  rawCards:
    | readonly (Partial<IntakeAttachmentCard> & { state?: AttachmentUiState | string })[]
    | undefined,
): readonly IntakeAttachmentCard[] {
  if (!rawCards || rawCards.length === 0) {
    return [];
  }
  return rawCards.map((rawCard, index) => {
    const filename = rawCard.filename ?? `attachment-${index + 1}.pdf`;
    const fileLike = {
      name: filename,
      size: rawCard.sizeBytes ?? 512_000,
      type: rawCard.mimeType ?? mediaTypeFromName(filename),
      lastModified: Date.parse(rawCard.stateUpdatedAt ?? "2026-04-15T09:00:00Z"),
    };
    const seed = createAttachmentCard({
      file: fileLike,
      selectionSource: rawCard.selectionSource ?? "picker",
      nowIso: rawCard.stateUpdatedAt ?? "2026-04-15T09:00:00Z",
      replaceTargetRef: rawCard.replacesAttachmentRef ?? null,
    });
    const nextState = rawCard.uiState ?? (rawCard.state as AttachmentUiState | undefined) ?? "ready_kept";
    const plan = buildAttachmentProcessingPlan(fileLike);
    const stateDerivedDefaults =
      nextState === "preview_unavailable_kept"
        ? {
            lifecycleState: "promoted" as const,
            quarantineState: "not_quarantined" as const,
            currentSafeMode: "placeholder_only" as const,
            artifactMode: "placeholder_only" as const,
            documentReferenceState: "created" as const,
            outcomeRef: "ATTACH_OUTCOME_PREVIEW_UNAVAILABLE_BUT_FILE_KEPT",
            stateReasonCode: "preview_unavailable_but_kept",
            previewAvailable: false,
          }
        : nextState === "ready_kept"
          ? {
              lifecycleState: "promoted" as const,
              quarantineState: "not_quarantined" as const,
              currentSafeMode: "governed_preview" as const,
              artifactMode: "governed_preview" as const,
              documentReferenceState: "created" as const,
              outcomeRef: "ATTACH_OUTCOME_ACCEPTED_SAFE",
              stateReasonCode: "ready_kept",
              previewAvailable: true,
            }
          : plan;
    const settled = patchAttachmentState(seed, {
      uiState: nextState,
      lifecycleState: rawCard.lifecycleState ?? stateDerivedDefaults.lifecycleState,
      quarantineState: rawCard.quarantineState ?? stateDerivedDefaults.quarantineState,
      currentSafeMode: rawCard.currentSafeMode ?? stateDerivedDefaults.currentSafeMode,
      artifactMode: rawCard.artifactMode ?? stateDerivedDefaults.artifactMode,
      documentReferenceState:
        rawCard.documentReferenceState ?? stateDerivedDefaults.documentReferenceState,
      stateReasonCode: rawCard.stateReasonCode ?? stateDerivedDefaults.stateReasonCode,
      progressPercent: rawCard.progressPercent ?? null,
      outcomeRef: rawCard.outcomeRef ?? stateDerivedDefaults.outcomeRef,
      previewAvailable: rawCard.previewAvailable ?? stateDerivedDefaults.previewAvailable,
      keptInDraft:
        rawCard.keptInDraft ??
        !(nextState === "removed" || nextState === "replaced"),
      removedAt: rawCard.removedAt ?? null,
      replacedAt: rawCard.replacedAt ?? null,
      duplicateNotice: rawCard.duplicateNotice ?? null,
      isDuplicateFocusTarget: rawCard.isDuplicateFocusTarget ?? false,
      nowIso: rawCard.stateUpdatedAt ?? "2026-04-15T09:00:00Z",
    });
    return {
      ...settled,
      attachmentRef: rawCard.attachmentRef ?? seed.attachmentRef,
      uploadSessionId: rawCard.uploadSessionId ?? seed.uploadSessionId,
      duplicateFingerprint: rawCard.duplicateFingerprint ?? seed.duplicateFingerprint,
      duplicateDisposition: rawCard.duplicateDisposition ?? seed.duplicateDisposition,
      retryCount: rawCard.retryCount ?? seed.retryCount,
      ruleRef: rawCard.ruleRef ?? seed.ruleRef,
      navigationGrants:
        rawCard.navigationGrants && rawCard.navigationGrants.length > 0
          ? rawCard.navigationGrants
          : buildAttachmentNavigationGrants(rawCard.attachmentRef ?? seed.attachmentRef),
    };
  });
}

export function attachmentAcceptAttribute(): string {
  return [".jpg", ".jpeg", ".png", ".heic", ".heif", ".pdf"].join(",");
}

export function attachmentSelectionSummary(card: IntakeAttachmentCard): string {
  return `${card.filename} · ${formatAttachmentBytes(card.sizeBytes)}`;
}
