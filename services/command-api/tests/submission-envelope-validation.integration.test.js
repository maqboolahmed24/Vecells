import { describe, expect, it } from "vitest";
import { createSubmissionEnvelopeValidationApplication } from "../src/submission-envelope-validation.ts";

function runtimeContext(overrides = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope",
    routeIntentBindingRef: "RIB_145_SUBMISSION_VALIDATION_V1",
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

describe("submission envelope validation application seam", () => {
  it("returns one stable submit-ready verdict for a valid browser self-service draft", async () => {
    const application = createSubmissionEnvelopeValidationApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2099-04-14T16:20:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_validation_001",
        idempotencyKey: "idem_validation_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-10",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sleep_affected"],
          "symptoms.narrative": "The problem has been getting harder to ignore.",
        },
        currentStepKey: "review_submit",
        completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/review-submit`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2099-04-14T16:21:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    application.seedUrgentDecisionState(created.view.draftPublicId, "clear");

    const draftVerdict = await application.evaluateDraftValidation(created.view.draftPublicId);
    const submitVerdict = await application.evaluateSubmitReadiness(created.view.draftPublicId);

    expect(draftVerdict.verdictState).toBe("shape_valid");
    expect(submitVerdict.verdictState).toBe("submit_ready");
    expect(submitVerdict.submitReadiness.state).toBe("ready");
    expect(submitVerdict.activeStructuredAnswers["symptoms.onsetDate"]).toBe("2026-04-10");
    expect(submitVerdict.normalizedSubmissionCandidate).toMatchObject({
      symptoms: {
        symptomCategoryCode: "general",
        onsetPrecision: "exact_date",
        onsetDate: "2026-04-10",
        worseningNow: false,
      },
    });
  });

  it("excludes superseded hidden answers from active payload truth and blocks unresolved attachments", async () => {
    const application = createSubmissionEnvelopeValidationApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2099-04-14T16:25:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_validation_branch_001",
        idempotencyKey: "idem_validation_branch_001",
        leaseId: created.lease.leaseId,
        resumeToken: created.view.resumeToken,
        structuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "approximate_window",
          "symptoms.onsetDate": "2026-04-11",
          "symptoms.onsetWindow": "today",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sudden_change"],
          "symptoms.narrative": "Started suddenly today.",
        },
        attachmentRefs: ["att_phase1_validation_001"],
        currentStepKey: "review_submit",
        completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/review-submit`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2099-04-14T16:26:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    application.seedUrgentDecisionState(created.view.draftPublicId, "clear");

    const submitVerdict = await application.evaluateSubmitReadiness(created.view.draftPublicId);

    expect(submitVerdict.supersededQuestionKeys).toContain("symptoms.onsetDate");
    expect(submitVerdict.activeStructuredAnswers).not.toHaveProperty("symptoms.onsetDate");
    expect(
      submitVerdict.issues.some((issue) => issue.code === "FIELD_SUPERSEDED_HIDDEN_ANSWER"),
    ).toBe(true);
    expect(submitVerdict.normalizedSubmissionCandidate).toMatchObject({
      symptoms: {
        onsetPrecision: "approximate_window",
        onsetWindowCode: "today",
      },
    });
    expect(submitVerdict.submitReadiness.blockerCodes).toContain("ATTACHMENT_STATE_UNRESOLVED");
    expect(submitVerdict.submitReadiness.gapRefs).toContain(
      "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING",
    );
  });
});
