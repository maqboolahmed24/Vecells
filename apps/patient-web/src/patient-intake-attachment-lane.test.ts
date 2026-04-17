import { describe, expect, it } from "vitest";
import {
  buildAttachmentProcessingPlan,
  normalizeIntakeAttachmentCards,
  supportsCameraCapture,
} from "./patient-intake-attachment-lane";

describe("patient intake attachment lane", () => {
  it("keeps standard images as ready evidence with governed preview", () => {
    expect(
      buildAttachmentProcessingPlan({
        name: "bp-reading-photo.jpg",
        size: 420_000,
        type: "image/jpeg",
      }),
    ).toMatchObject({
      terminalState: "ready_kept",
      currentSafeMode: "governed_preview",
      documentReferenceState: "created",
      previewAvailable: true,
    });
  });

  it("keeps heic uploads while admitting preview may stay unavailable", () => {
    expect(
      buildAttachmentProcessingPlan({
        name: "camera-capture.heic",
        size: 1_200_000,
        type: "image/heic",
      }),
    ).toMatchObject({
      terminalState: "preview_unavailable_kept",
      currentSafeMode: "placeholder_only",
      documentReferenceState: "created",
      previewAvailable: false,
    });
  });

  it("separates retryable transfer failure from quarantine outcomes", () => {
    expect(
      buildAttachmentProcessingPlan({
        name: "retry-transfer-note.pdf",
        size: 200_000,
        type: "application/pdf",
      }),
    ).toMatchObject({
      terminalState: "retryable_transfer_failure",
      lifecycleState: "scan_failed_retryable",
      quarantineState: "not_started",
    });
    expect(
      buildAttachmentProcessingPlan({
        name: "malware-proof.jpg",
        size: 200_000,
        type: "image/jpeg",
      }),
    ).toMatchObject({
      terminalState: "quarantined_malware",
      quarantineState: "quarantined",
    });
  });

  it("normalizes earlier attachment memory into the new ui state shape", () => {
    const normalized = normalizeIntakeAttachmentCards([
      {
        attachmentRef: "att_existing",
        filename: "legacy-note.pdf",
        state: "preview_unavailable_kept",
      },
    ]);

    expect(normalized[0]).toMatchObject({
      attachmentRef: "att_existing",
      filename: "legacy-note.pdf",
      uiState: "preview_unavailable_kept",
      currentSafeMode: "placeholder_only",
    });
  });

  it("only advertises camera capture on touch-friendly runtimes", () => {
    expect(supportsCameraCapture({ maxTouchPoints: 0, userAgent: "Mozilla/5.0 (Macintosh)" })).toBe(
      false,
    );
    expect(
      supportsCameraCapture({ maxTouchPoints: 5, userAgent: "Mozilla/5.0 (iPhone)" }),
    ).toBe(true);
  });
});
