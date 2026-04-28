import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  attachmentAcceptAttribute,
  attachmentSelectionSummary,
  attachmentUiCopy,
  ATTACHMENT_INLINE_PREVIEW_CONTRACT_REF,
  ATTACHMENT_NAVIGATION_POLICY_REF,
  ATTACHMENT_PRESENTATION_CONTRACT_REF,
  formatAttachmentBytes,
  type AttachmentFileLike,
  type IntakeAttachmentCard,
} from "./patient-intake-attachment-lane";
import type { AttachmentAnnouncement } from "./use-patient-intake-attachments";

function filesFromList(fileList: FileList | null): readonly AttachmentFileLike[] {
  return fileList ? Array.from(fileList) : [];
}

function reduceMotionDuration() {
  if (typeof window === "undefined") {
    return "160ms";
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "1ms" : "160ms";
}

export function EvidenceLaneDropzone({
  dragActive,
  supportsCapture,
  dropzoneFocusVersion,
  onFilesSelected,
  onDragActiveChange,
}: {
  dragActive: boolean;
  supportsCapture: boolean;
  dropzoneFocusVersion: number;
  onFilesSelected: (files: readonly AttachmentFileLike[], source: "picker" | "drag_drop" | "camera_capture") => void;
  onDragActiveChange: (nextValue: boolean) => void;
}) {
  const pickerInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const focusTargetRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    focusTargetRef.current?.focus();
  }, [dropzoneFocusVersion]);

  const handlePickerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = filesFromList(event.target.files);
    if (files.length > 0) {
      onFilesSelected(files, "picker");
    }
    event.target.value = "";
  };

  const handleCaptureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = filesFromList(event.target.files);
    if (files.length > 0) {
      onFilesSelected(files, "camera_capture");
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragActiveChange(false);
    const files = filesFromList(event.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files, "drag_drop");
    }
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pickerInputRef.current?.click();
    }
  };

  return (
    <section className="patient-intake-mission-frame__evidence-dropzone-wrap">
      <div
        className="patient-intake-mission-frame__evidence-dropzone"
        data-drag-active={dragActive ? "true" : "false"}
        data-testid="patient-intake-evidence-dropzone"
        tabIndex={0}
        role="group"
        aria-label="Supporting files"
        onKeyDown={handleDropzoneKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          onDragActiveChange(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          onDragActiveChange(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
          }
          onDragActiveChange(false);
        }}
        onDrop={handleDrop}
        style={
          {
            "--attachment-motion-duration": reduceMotionDuration(),
          } as CSSProperties
        }
      >
        <div className="patient-intake-mission-frame__evidence-dropzone-copy">
          <span className="patient-intake-mission-frame__eyebrow">Evidence lane</span>
          <h3>Choose files that help explain this request</h3>
          <p>
            Files are checked before they are used. Unsupported or unsafe files stay visible here so
            you can retry, replace, or remove them without losing your place.
          </p>
        </div>
        <div className="patient-intake-mission-frame__evidence-dropzone-actions">
          <button
            ref={focusTargetRef}
            type="button"
            className="patient-intake-mission-frame__primary-button"
            data-testid="patient-intake-file-picker-button"
            onClick={() => pickerInputRef.current?.click()}
          >
            Choose files
          </button>
          {supportsCapture ? (
            <button
              type="button"
              className="patient-intake-mission-frame__ghost-button"
              data-testid="patient-intake-camera-capture-button"
              onClick={() => captureInputRef.current?.click()}
            >
              Use camera
            </button>
          ) : null}
        </div>
        <p className="patient-intake-mission-frame__evidence-dropzone-note">
          Drag and drop works on desktop. JPG, PNG, HEIC, and PDF are accepted up to 15 MB.
        </p>
        <input
          ref={pickerInputRef}
          type="file"
          multiple
          accept={attachmentAcceptAttribute()}
          className="patient-intake-mission-frame__visually-hidden"
          data-testid="patient-intake-file-input"
          onChange={handlePickerChange}
        />
        <input
          ref={captureInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          className="patient-intake-mission-frame__visually-hidden"
          data-testid="patient-intake-camera-input"
          onChange={handleCaptureChange}
        />
      </div>
      <div className="patient-intake-mission-frame__evidence-lane-guidance">
        <strong>What helps here</strong>
        <ul>
          <li>Clear photos of readings, labels, or visible changes.</li>
          <li>PDF letters or results that support the question you already answered.</li>
          <li>Only the file states shown here can tell you whether evidence is ready, blocked, or needs retry.</li>
        </ul>
      </div>
    </section>
  );
}

export function EvidenceCardStack({
  attachments,
  highlightedAttachmentRef,
  onClearHighlight,
  onRetry,
  onRemove,
  onReplaceFiles,
  onOpenPreview,
}: {
  attachments: readonly IntakeAttachmentCard[];
  highlightedAttachmentRef: string | null;
  onClearHighlight: () => void;
  onRetry: (attachmentRef: string) => void;
  onRemove: (attachmentRef: string) => void;
  onReplaceFiles: (attachmentRef: string, files: readonly AttachmentFileLike[]) => void;
  onOpenPreview: (attachmentRef: string) => void;
}) {
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const replaceInputRefs = useRef(new Map<string, HTMLInputElement>());

  useEffect(() => {
    if (!highlightedAttachmentRef) {
      return;
    }
    const target = cardRefs.current.get(highlightedAttachmentRef);
    if (!target) {
      return;
    }
    target.focus();
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
    onClearHighlight();
  }, [highlightedAttachmentRef, onClearHighlight]);

  const visibleAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.uiState !== "removed" || attachment.removedAt),
    [attachments],
  );

  return (
    <section className="patient-intake-mission-frame__evidence-card-stack" data-testid="patient-intake-evidence-card-stack">
      {visibleAttachments.map((attachment) => {
        const copy = attachmentUiCopy(attachment.uiState);
        const canPreview = attachment.previewAvailable && attachment.uiState === "ready_kept";
        const canRetry = attachment.uiState === "retryable_transfer_failure";
        const canMutate = attachment.uiState !== "removed" && attachment.uiState !== "replaced";
        return (
          <article
            key={attachment.attachmentRef}
            ref={(node) => {
              if (node) {
                cardRefs.current.set(attachment.attachmentRef, node);
              } else {
                cardRefs.current.delete(attachment.attachmentRef);
              }
            }}
            className="patient-intake-mission-frame__evidence-card"
            data-testid={`patient-intake-evidence-card-${attachment.attachmentRef}`}
            data-state={attachment.uiState}
            data-tone={copy.tone}
            tabIndex={-1}
          >
            <div className="patient-intake-mission-frame__evidence-card-rail" aria-hidden="true" />
            <div className="patient-intake-mission-frame__evidence-card-head">
              <div className="patient-intake-mission-frame__evidence-card-title">
                <strong>{attachment.filename}</strong>
                <span>{formatAttachmentBytes(attachment.sizeBytes)}</span>
              </div>
              <span
                className="patient-intake-mission-frame__evidence-pill"
                data-tone={copy.tone}
                data-testid={`patient-intake-state-pill-${attachment.attachmentRef}`}
              >
                {copy.pill}
              </span>
            </div>
            <p className="patient-intake-mission-frame__evidence-card-detail">{copy.detail}</p>
            <p className="patient-intake-mission-frame__evidence-card-helper">{copy.helper}</p>
            {attachment.progressPercent !== null ? (
              <div className="patient-intake-mission-frame__evidence-progress" aria-hidden="true">
                <span style={{ width: `${attachment.progressPercent}%` }} />
              </div>
            ) : null}
            {attachment.duplicateNotice ? (
              <div className="patient-intake-mission-frame__evidence-duplicate-note">
                {attachment.duplicateNotice}
              </div>
            ) : null}
            <div className="patient-intake-mission-frame__evidence-card-footer">
              <span>{attachmentSelectionSummary(attachment)}</span>
              <div className="patient-intake-mission-frame__evidence-actions">
                {canPreview ? (
                  <button
                    type="button"
                    className="patient-intake-mission-frame__ghost-button"
                    data-testid={`patient-intake-preview-action-${attachment.attachmentRef}`}
                    onClick={() => onOpenPreview(attachment.attachmentRef)}
                  >
                    Preview
                  </button>
                ) : null}
                {canRetry ? (
                  <button
                    type="button"
                    className="patient-intake-mission-frame__ghost-button"
                    data-testid={`patient-intake-retry-action-${attachment.attachmentRef}`}
                    onClick={() => onRetry(attachment.attachmentRef)}
                  >
                    Retry
                  </button>
                ) : null}
                {canMutate ? (
                  <>
                    <button
                      type="button"
                      className="patient-intake-mission-frame__ghost-button"
                      data-testid={`patient-intake-replace-action-${attachment.attachmentRef}`}
                      onClick={() => replaceInputRefs.current.get(attachment.attachmentRef)?.click()}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      className="patient-intake-mission-frame__ghost-button"
                      data-testid={`patient-intake-remove-action-${attachment.attachmentRef}`}
                      onClick={() => onRemove(attachment.attachmentRef)}
                    >
                      Remove
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <input
              ref={(node) => {
                if (node) {
                  replaceInputRefs.current.set(attachment.attachmentRef, node);
                } else {
                  replaceInputRefs.current.delete(attachment.attachmentRef);
                }
              }}
              type="file"
              accept={attachmentAcceptAttribute()}
              className="patient-intake-mission-frame__visually-hidden"
              data-testid={`patient-intake-replace-input-${attachment.attachmentRef}`}
              onChange={(event) => {
                const files = filesFromList(event.target.files);
                if (files.length > 0) {
                  onReplaceFiles(attachment.attachmentRef, files);
                }
                event.target.value = "";
              }}
            />
          </article>
        );
      })}
    </section>
  );
}

export function GovernedPreviewPanel({
  attachment,
  onClose,
}: {
  attachment: IntakeAttachmentCard;
  onClose: () => void;
}) {
  const openGrant = attachment.navigationGrants.find((grant) => grant.action === "open_in_browser");
  const downloadGrant = attachment.navigationGrants.find((grant) => grant.action === "download");
  return (
    <aside
      className="patient-intake-mission-frame__preview-panel"
      data-testid="patient-intake-preview-panel"
      tabIndex={-1}
    >
      <div className="patient-intake-mission-frame__preview-panel-head">
        <div>
          <span>Governed preview</span>
          <h3>{attachment.filename}</h3>
        </div>
        <button
          type="button"
          className="patient-intake-mission-frame__ghost-button"
          data-testid="patient-intake-preview-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="patient-intake-mission-frame__preview-surface">
        <div className="patient-intake-mission-frame__preview-visual" aria-hidden="true">
          <svg viewBox="0 0 96 96" role="presentation">
            <rect x="8" y="10" width="80" height="76" rx="18" fill="rgba(47,111,237,0.08)" />
            <path d="M26 60l14-16 14 12 10-8 10 12" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="35" cy="33" r="6" fill="currentColor" />
          </svg>
        </div>
        <div className="patient-intake-mission-frame__preview-copy">
          <strong>One governed route only</strong>
          <p>
            Preview and download stay behind {ATTACHMENT_PRESENTATION_CONTRACT_REF} and{" "}
            {ATTACHMENT_NAVIGATION_POLICY_REF}. The shell never exposes raw storage URLs.
          </p>
          <dl>
            <div>
              <dt>Inline preview contract</dt>
              <dd>{ATTACHMENT_INLINE_PREVIEW_CONTRACT_REF}</dd>
            </div>
            <div>
              <dt>Safe mode</dt>
              <dd>{attachment.currentSafeMode.replaceAll("_", " ")}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="patient-intake-mission-frame__preview-actions">
        {openGrant ? (
          <button
            type="button"
            className="patient-intake-mission-frame__primary-button"
            data-testid="patient-intake-preview-open"
            data-governed-href={openGrant.href}
          >
            Open governed preview
          </button>
        ) : null}
        {downloadGrant ? (
          <button
            type="button"
            className="patient-intake-mission-frame__ghost-button"
            data-testid="patient-intake-preview-download"
            data-governed-href={downloadGrant.href}
          >
            Download through grant
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function AttachmentLaneAnnouncementRegion({
  announcement,
}: {
  announcement: AttachmentAnnouncement;
}) {
  return (
    <div className="patient-intake-mission-frame__visually-hidden" aria-live="polite" aria-atomic="true">
      <span key={announcement.key}>{announcement.message}</span>
    </div>
  );
}
