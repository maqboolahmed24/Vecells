import { describe, expect, it } from "vitest";
import { createIntakeAttachmentApplication } from "../src/intake-attachment.ts";

function runtimeContext(overrides = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope",
    routeIntentBindingRef: "RIB_146_ATTACHMENT_FLOW_V1",
    routeIntentBindingState: "live",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
    channelReleaseFreezeState: "monitoring",
    manifestVersionRef: "manifest_phase1_browser_v1",
    sessionEpochRef: "session_epoch_browser_v1",
    ...overrides,
  };
}

function runtimeContextFromLease(lease, overrides = {}) {
  const snapshot = lease.toSnapshot();
  return runtimeContext({
    routeFamilyRef: snapshot.routeFamilyRef,
    routeIntentBindingRef: snapshot.routeIntentBindingRef,
    audienceSurfaceRuntimeBindingRef: snapshot.audienceSurfaceRuntimeBindingRef,
    releaseApprovalFreezeRef: snapshot.releaseApprovalFreezeRef,
    channelReleaseFreezeState: snapshot.channelReleaseFreezeState,
    manifestVersionRef: snapshot.manifestVersionRef,
    sessionEpochRef: snapshot.sessionEpochRef,
    subjectBindingVersionRef: snapshot.subjectBindingVersionRef,
    subjectRef: snapshot.subjectRef,
    ...overrides,
  });
}

describe("intake attachment application seam", () => {
  it("settles a safe attachment into draft truth, fhir linkage, artifact grant, and submit readiness", async () => {
    const application = createIntakeAttachmentApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2026-04-14T20:00:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_attach_001",
        idempotencyKey: "idem_attach_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-10",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sleep_affected"],
          "symptoms.narrative": "Need help with an ongoing issue.",
        },
        currentStepKey: "review_submit",
        completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/review-submit`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "supporting-files",
        recordedAt: "2026-04-14T20:01:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    const initiated = await application.initiateAttachmentUpload({
      draftPublicId: created.view.draftPublicId,
      fileName: "proof.pdf",
      declaredMimeType: "application/pdf",
      byteSize: 2048,
      initiatedAt: "2026-04-14T20:02:00Z",
      clientUploadId: "upl_attach_001",
    });
    expect(initiated.accepted).toBe(true);

    await application.recordAttachmentUpload({
      uploadSessionId: initiated.uploadSession.uploadSessionId,
      fileName: "proof.pdf",
      reportedMimeType: "application/pdf",
      bytes: Buffer.from("proof-pdf"),
      uploadedAt: "2026-04-14T20:02:05Z",
    });
    await application.runAttachmentWorker({
      now: "2026-04-14T20:02:06Z",
    });

    application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");
    application.validation.seedConvergenceState(created.view.draftPublicId, "valid");

    const projection = await application.listDraftAttachmentProjection(created.view.draftPublicId);
    const states = await application.buildSubmissionAttachmentStates(created.view.draftPublicId);
    const artifact = await application.createArtifactPresentation({
      attachmentPublicId: initiated.attachment.attachmentPublicId,
      action: "download",
      routeFamilyRef: "rf_intake_self_service",
      continuityKey: "patient.portal.requests",
      selectedAnchorRef: "patient.portal.requests.intake.supporting_files",
      returnTargetRef: "return://intake/review-submit",
      requestedAt: "2026-04-14T20:03:00Z",
    });
    const submitVerdict = await application.validation.evaluateSubmitReadiness(
      created.view.draftPublicId,
    );

    expect(projection[0]).toMatchObject({
      attachmentPublicId: initiated.attachment.attachmentPublicId,
      lifecycleState: "promoted",
      currentSafeMode: "governed_preview",
    });
    expect(states[0]).toMatchObject({
      attachmentRef: initiated.attachment.attachmentPublicId,
      submitDisposition: "routine_submit_allowed",
      documentReferenceState: "created",
    });
    expect(artifact.grant?.scrubbedDestination).toMatch(/^artifact:\/\/attachment-grant\//);
    expect(artifact.contract.downloadPolicy).toBe("grant_required");
    expect(submitVerdict.verdictState).toBe("submit_ready");
    expect(submitVerdict.submitReadiness.gapRefs).toEqual([]);
    const fhirRecords = await application.fhirStore.listCurrentResourceRecordsForSet(
      `fhir_set_attachment_${initiated.attachment.attachmentPublicId}`,
    );
    expect(fhirRecords).toHaveLength(1);
    expect(fhirRecords[0].toSnapshot().resourceType).toBe("DocumentReference");
  });

  it("keeps malware-positive evidence explicit and blocks submit without falling back to gap truth", async () => {
    const application = createIntakeAttachmentApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2026-04-14T20:10:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    await application.initiateAttachmentUpload({
      draftPublicId: created.view.draftPublicId,
      fileName: "photo.jpg",
      declaredMimeType: "image/jpeg",
      byteSize: 1024,
      initiatedAt: "2026-04-14T20:10:10Z",
      simulatorScenarioId: "malware_positive",
    }).then(async (initiated) => {
      await application.recordAttachmentUpload({
        uploadSessionId: initiated.uploadSession.uploadSessionId,
        fileName: "photo.jpg",
        reportedMimeType: "image/jpeg",
        bytes: Buffer.from("photo"),
        uploadedAt: "2026-04-14T20:10:12Z",
      });
    });

    await application.runAttachmentWorker({
      now: "2026-04-14T20:10:13Z",
    });
    application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");
    application.validation.seedConvergenceState(created.view.draftPublicId, "valid");

    const submitVerdict = await application.validation.evaluateSubmitReadiness(
      created.view.draftPublicId,
    );

    expect(submitVerdict.submitReadiness.blockerCodes).toContain("ATTACHMENT_SUBMIT_BLOCKED");
    expect(submitVerdict.submitReadiness.gapRefs).toEqual([]);
    expect(
      submitVerdict.issues.some(
        (issue) =>
          issue.code === "ATTACHMENT_SUBMIT_BLOCKED" &&
          issue.reasonRef === "ATTACH_OUTCOME_QUARANTINED_MALWARE",
      ),
    ).toBe(true);
  });
});
