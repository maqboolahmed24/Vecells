import { describe, expect, it } from "vitest";
import {
  createInMemoryAttachmentObjectStorage,
  createPhase1AttachmentPipelineService,
  createPhase1AttachmentPipelineStore,
  type AttachmentScannerAdapter,
} from "../src/attachment-pipeline";

function scanner(): AttachmentScannerAdapter {
  return {
    async scanAttachment(input) {
      if (input.simulatorScenarioId === "malware_positive") {
        return {
          scannerRef: "scanner_sim_v1",
          scenarioId: "malware_positive",
          verdict: "malware",
          detectedMimeType: input.detectedMimeType,
          reasonCodes: ["ATTACH_REASON_MALWARE_DETECTED"],
          settledAt: "2026-04-14T19:00:12Z",
        };
      }
      return {
        scannerRef: "scanner_sim_v1",
        scenarioId: input.simulatorScenarioId ?? "clean",
        verdict: "clean",
        detectedMimeType: input.detectedMimeType,
        reasonCodes: [],
        settledAt: "2026-04-14T19:00:12Z",
      };
    },
  };
}

describe("phase1 attachment pipeline", () => {
  it("promotes a safe PDF into governed preview and a document-reference link", async () => {
    const service = createPhase1AttachmentPipelineService({
      repositories: createPhase1AttachmentPipelineStore(),
      objectStorage: createInMemoryAttachmentObjectStorage(),
      scanner: scanner(),
    });

    const initiated = await service.initiateUpload({
      draftPublicId: "dft_attach_001",
      fileName: "clinic-note.pdf",
      declaredMimeType: "application/pdf",
      byteSize: 2048,
      initiatedAt: "2026-04-14T19:00:00Z",
      clientUploadId: "upl_001",
    });
    expect(initiated.accepted).toBe(true);

    await service.recordUpload({
      uploadSessionId: initiated.uploadSession?.uploadSessionId ?? "",
      fileName: "clinic-note.pdf",
      reportedMimeType: "application/pdf",
      bytes: Buffer.from("pdf-bytes"),
      uploadedAt: "2026-04-14T19:00:10Z",
    });
    const worker = await service.runWorkerCycle({
      now: "2026-04-14T19:00:10Z",
    });

    const attachment = await service.getAttachment(initiated.attachment.attachmentPublicId);
    const link = await service.getDocumentReferenceLink(initiated.attachment.attachmentPublicId);
    const states = await service.buildSubmissionAttachmentStates("dft_attach_001");

    expect(worker.events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "intake.attachment.scanning",
        "intake.attachment.safe",
        "intake.attachment.preview.generated",
        "intake.attachment.promoted",
      ]),
    );
    expect(attachment?.lifecycleState).toBe("promoted");
    expect(attachment?.currentSafeMode).toBe("governed_preview");
    expect(attachment?.documentReferenceRef).toBeTruthy();
    expect(link?.documentReferenceLogicalId).toMatch(/^docref_/);
    expect(states).toEqual([
      expect.objectContaining({
        attachmentRef: initiated.attachment.attachmentPublicId,
        submitDisposition: "routine_submit_allowed",
      }),
    ]);
  });

  it("keeps malware-positive evidence quarantined and blocks submit readiness", async () => {
    const service = createPhase1AttachmentPipelineService({
      repositories: createPhase1AttachmentPipelineStore(),
      objectStorage: createInMemoryAttachmentObjectStorage(),
      scanner: scanner(),
    });

    const initiated = await service.initiateUpload({
      draftPublicId: "dft_attach_002",
      fileName: "photo.jpg",
      declaredMimeType: "image/jpeg",
      byteSize: 1024,
      initiatedAt: "2026-04-14T19:05:00Z",
      simulatorScenarioId: "malware_positive",
    });

    await service.recordUpload({
      uploadSessionId: initiated.uploadSession?.uploadSessionId ?? "",
      fileName: "photo.jpg",
      reportedMimeType: "image/jpeg",
      bytes: Buffer.from("image-bytes"),
      uploadedAt: "2026-04-14T19:05:04Z",
    });
    await service.runWorkerCycle({
      now: "2026-04-14T19:05:05Z",
    });

    const attachment = await service.getAttachment(initiated.attachment.attachmentPublicId);
    const states = await service.buildSubmissionAttachmentStates("dft_attach_002");
    const projection = await service.listDraftAttachmentProjection("dft_attach_002");

    expect(attachment?.lifecycleState).toBe("quarantined");
    expect(attachment?.classificationOutcome).toBe("quarantined_malware");
    expect(states[0]).toMatchObject({
      submitDisposition: "replace_or_remove_then_review",
      quarantineState: "quarantined",
    });
    expect(projection[0]?.allowedActions).toEqual(["replace", "remove"]);
  });

  it("replays duplicate uploads and preserves explicit replacement lineage", async () => {
    const service = createPhase1AttachmentPipelineService({
      repositories: createPhase1AttachmentPipelineStore(),
      objectStorage: createInMemoryAttachmentObjectStorage(),
      scanner: scanner(),
    });

    const first = await service.initiateUpload({
      draftPublicId: "dft_attach_003",
      fileName: "repeat-note.pdf",
      declaredMimeType: "application/pdf",
      byteSize: 4096,
      initiatedAt: "2026-04-14T19:10:00Z",
      checksumSha256: "fingerprint_001",
    });
    const replay = await service.initiateUpload({
      draftPublicId: "dft_attach_003",
      fileName: "repeat-note.pdf",
      declaredMimeType: "application/pdf",
      byteSize: 4096,
      initiatedAt: "2026-04-14T19:10:02Z",
      checksumSha256: "fingerprint_001",
    });

    expect(replay.duplicateReplayOfAttachmentPublicId).toBe(first.attachment.attachmentPublicId);

    await service.recordUpload({
      uploadSessionId: first.uploadSession?.uploadSessionId ?? "",
      fileName: "repeat-note.pdf",
      reportedMimeType: "application/pdf",
      bytes: Buffer.from("original"),
      uploadedAt: "2026-04-14T19:10:03Z",
    });
    await service.runWorkerCycle({ now: "2026-04-14T19:10:04Z" });

    const replacement = await service.initiateUpload({
      draftPublicId: "dft_attach_003",
      fileName: "replacement-note.pdf",
      declaredMimeType: "application/pdf",
      byteSize: 4096,
      initiatedAt: "2026-04-14T19:10:10Z",
      replacementForAttachmentPublicId: first.attachment.attachmentPublicId,
    });
    await service.recordUpload({
      uploadSessionId: replacement.uploadSession?.uploadSessionId ?? "",
      fileName: "replacement-note.pdf",
      reportedMimeType: "application/pdf",
      bytes: Buffer.from("replacement"),
      uploadedAt: "2026-04-14T19:10:11Z",
    });
    await service.runWorkerCycle({ now: "2026-04-14T19:10:12Z" });

    const superseded = await service.getAttachment(first.attachment.attachmentPublicId);
    const activeRefs = await service.listActiveAttachmentRefsForDraft("dft_attach_003");

    expect(superseded?.lifecycleState).toBe("replaced");
    expect(superseded?.replacedByAttachmentPublicId).toBe(
      replacement.attachment.attachmentPublicId,
    );
    expect(activeRefs).toEqual([replacement.attachment.attachmentPublicId]);
  });
});
