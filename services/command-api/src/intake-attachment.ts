import {
  createDraftAutosaveStore,
  createDraftSessionAutosaveService,
  type DraftAutosaveDependencies,
} from "@vecells/domain-identity-access";
import {
  FhirResourceRecord,
  createFhirRepresentationStore,
  type InMemoryFhirRepresentationStore,
} from "@vecells/fhir-mapping";
import {
  createAttachmentScanSimulator,
  type AttachmentScanScenarioId,
} from "../../adapter-simulators/src/attachment-scan-simulator";
import {
  createPhase1AttachmentPipelineService,
  createPhase1AttachmentPipelineStore,
  createInMemoryAttachmentObjectStorage,
  type AttachmentArtifactPresentationView,
  type AttachmentScannerAdapter,
  type AttachmentWorkerRunResult,
  type DraftAttachmentProjectionCard,
  type InitiateAttachmentUploadInput,
  type InitiateAttachmentUploadResult,
  type PromotedRequestAttachmentSummary,
  type RecordAttachmentUploadInput,
  type RecordAttachmentUploadResult,
  type SubmissionAttachmentStateView,
} from "../../../packages/domains/intake_request/src/index";
import { createSubmissionEnvelopeValidationApplication } from "./submission-envelope-validation";

function stableDigest(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export interface IntakeAttachmentApplication {
  readonly repositories: DraftAutosaveDependencies;
  readonly drafts: ReturnType<typeof createDraftSessionAutosaveService>;
  readonly attachments: ReturnType<typeof createPhase1AttachmentPipelineService>;
  readonly validation: ReturnType<typeof createSubmissionEnvelopeValidationApplication>;
  readonly fhirStore: InMemoryFhirRepresentationStore;
  initiateAttachmentUpload(
    input: InitiateAttachmentUploadInput,
  ): Promise<InitiateAttachmentUploadResult>;
  recordAttachmentUpload(input: RecordAttachmentUploadInput): Promise<RecordAttachmentUploadResult>;
  runAttachmentWorker(options?: { now?: string }): Promise<AttachmentWorkerRunResult>;
  removeAttachment(input: {
    attachmentPublicId: string;
    removedAt: string;
    reasonCode?: string;
  }): Promise<void>;
  bindPromotedRequestAttachment(input: {
    attachmentPublicId: string;
    requestPublicId: string;
    boundAt: string;
  }): Promise<void>;
  listDraftAttachmentProjection(
    draftPublicId: string,
  ): Promise<readonly DraftAttachmentProjectionCard[]>;
  listPromotedRequestAttachmentSummaries(
    requestPublicId: string,
  ): Promise<readonly PromotedRequestAttachmentSummary[]>;
  buildSubmissionAttachmentStates(
    draftPublicId: string,
  ): Promise<readonly SubmissionAttachmentStateView[]>;
  createArtifactPresentation(input: {
    attachmentPublicId: string;
    action: "open_in_browser" | "download" | "external_handoff";
    routeFamilyRef: string;
    continuityKey: string;
    selectedAnchorRef: string;
    returnTargetRef: string;
    requestedAt: string;
  }): Promise<AttachmentArtifactPresentationView>;
}

async function persistDocumentReferenceArtifact(input: {
  attachmentPublicId: string;
  fhirStore: InMemoryFhirRepresentationStore;
  attachments: ReturnType<typeof createPhase1AttachmentPipelineService>;
}): Promise<void> {
  const attachment = await input.attachments.getAttachment(input.attachmentPublicId);
  if (!attachment || attachment.lifecycleState !== "promoted" || !attachment.documentReferenceRef) {
    return;
  }
  const link = await input.attachments.getDocumentReferenceLink(input.attachmentPublicId);
  if (!link) {
    return;
  }
  const existing = await input.fhirStore.listCurrentResourceRecordsForSet(link.representationSetRef);
  if (existing.some((record) => record.logicalId === link.documentReferenceLogicalId)) {
    return;
  }
  const payload = {
    resourceType: "DocumentReference",
    id: link.documentReferenceLogicalId,
    status: "current",
    docStatus: "final",
    description: attachment.fileName,
    identifier: [
      {
        system: "urn:vecells:attachment-public-id",
        value: attachment.attachmentPublicId,
      },
    ],
    content: [
      {
        attachment: {
          contentType: attachment.detectedMimeType ?? attachment.declaredMimeType,
          title: attachment.fileName,
          size: attachment.byteSize,
          hash: attachment.checksumSha256,
          url: `artifact://${link.linkRef}`,
        },
      },
    ],
    context: {
      related: [
        {
          reference: `Basic/${attachment.draftPublicId}`,
        },
      ],
    },
  };
  await input.fhirStore.saveResourceRecord(
    FhirResourceRecord.create({
      fhirResourceRecordId: link.documentReferenceRecordRef,
      representationSetRef: link.representationSetRef,
      resourceType: "DocumentReference",
      profileCanonicalUrl:
        "https://vecells.example/fhir/StructureDefinition/phase1-intake-attachment-documentreference",
      logicalId: link.documentReferenceLogicalId,
      versionId: "1",
      subjectRef: null,
      payloadArtifactRef: `payload://document-reference/${link.documentReferenceLogicalId}`,
      payloadHash: stableDigest(JSON.stringify(payload)),
      sourceAggregateRefs: [attachment.attachmentPublicId, attachment.draftPublicId],
      identifierSetHash: stableDigest(`${attachment.attachmentPublicId}::${link.checksumSha256}`),
      provenanceAuditJoinRef: null,
      storageDisposition: "clinical_store",
      materializationState: "written",
      supersededByRepresentationSetRef: null,
      invalidationReasonRef: null,
      writtenAt: link.linkedAt,
      payload,
    }),
  );
}

export function createIntakeAttachmentApplication(options?: {
  repositories?: DraftAutosaveDependencies;
  scanner?: AttachmentScannerAdapter;
}) {
  const repositories = options?.repositories ?? createDraftAutosaveStore();
  const drafts = createDraftSessionAutosaveService(repositories);
  const attachments = createPhase1AttachmentPipelineService({
    repositories: createPhase1AttachmentPipelineStore(),
    objectStorage: createInMemoryAttachmentObjectStorage(),
    scanner: options?.scanner ?? createAttachmentScanSimulator(),
  });
  const fhirStore = createFhirRepresentationStore();

  async function syncDraftAttachmentRefs(draftPublicId: string, recordedAt: string): Promise<void> {
    const projection = await repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
    if (!projection) {
      return;
    }
    const nextProjection = projection.withSystemAttachmentRefs({
      attachmentRefs: await attachments.listActiveAttachmentRefsForDraft(draftPublicId),
      recordedAt,
      latestSettlementRef: `attachment_pipeline::${recordedAt}`,
      quietStatusState: projection.toSnapshot().quietStatusState,
    });
    await repositories.saveDraftContinuityEvidenceProjection(nextProjection, {
      expectedVersion: projection.toSnapshot().version,
    });
  }

  const validation = createSubmissionEnvelopeValidationApplication({
    repositories,
    attachmentStateResolver: async ({ draftPublicId }) => attachments.buildSubmissionAttachmentStates(draftPublicId),
  });

  const application: IntakeAttachmentApplication = {
    repositories,
    drafts,
    attachments,
    validation,
    fhirStore,
    async initiateAttachmentUpload(input: InitiateAttachmentUploadInput) {
      const result = await attachments.initiateUpload(input);
      await syncDraftAttachmentRefs(input.draftPublicId, input.initiatedAt);
      return result;
    },
    async recordAttachmentUpload(input: RecordAttachmentUploadInput) {
      const result = await attachments.recordUpload(input);
      await syncDraftAttachmentRefs(result.attachment.draftPublicId, input.uploadedAt);
      return result;
    },
    async runAttachmentWorker(options?: { now?: string }) {
      const result = await attachments.runWorkerCycle(options);
      for (const settlement of result.settlements) {
        await persistDocumentReferenceArtifact({
          attachmentPublicId: settlement.attachmentPublicId,
          fhirStore,
          attachments,
        });
      }
      for (const draftPublicId of result.changedDraftPublicIds) {
        await syncDraftAttachmentRefs(draftPublicId, options?.now ?? new Date().toISOString());
      }
      return result;
    },
    async removeAttachment(input: {
      attachmentPublicId: string;
      removedAt: string;
      reasonCode?: string;
    }) {
      const removed = await attachments.removeAttachment(input);
      await syncDraftAttachmentRefs(removed.attachment.draftPublicId, input.removedAt);
    },
    async bindPromotedRequestAttachment(input: {
      attachmentPublicId: string;
      requestPublicId: string;
      boundAt: string;
    }) {
      await attachments.bindPromotedRequest(input);
    },
    listDraftAttachmentProjection(draftPublicId: string) {
      return attachments.listDraftAttachmentProjection(draftPublicId);
    },
    listPromotedRequestAttachmentSummaries(requestPublicId: string) {
      return attachments.listPromotedRequestAttachmentSummaries(requestPublicId);
    },
    buildSubmissionAttachmentStates(draftPublicId: string) {
      return attachments.buildSubmissionAttachmentStates(draftPublicId);
    },
    createArtifactPresentation(input: {
      attachmentPublicId: string;
      action: "open_in_browser" | "download" | "external_handoff";
      routeFamilyRef: string;
      continuityKey: string;
      selectedAnchorRef: string;
      returnTargetRef: string;
      requestedAt: string;
    }) {
      return attachments.createArtifactPresentation(input);
    },
  };

  return application;
}

export const intakeAttachmentSimulatorScenarioIds = [
  "clean",
  "preview_failure",
  "malware_positive",
  "mime_spoof",
  "timeout_retryable",
  "integrity_failure",
  "unreadable",
] as const satisfies readonly AttachmentScanScenarioId[];
