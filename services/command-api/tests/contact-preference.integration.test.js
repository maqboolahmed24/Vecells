import { describe, expect, it } from "vitest";
import { createContactPreferenceApplication } from "../src/contact-preference.ts";

function runtimeContext(overrides = {}) {
  return {
    routeFamilyRef: "rf_intake_self_service",
    actionScope: "envelope_resume",
    lineageScope: "envelope",
    routeIntentBindingRef: "RIB_147_CONTACT_PREFERENCES_V1",
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

describe("contact preference application seam", () => {
  it("captures masked contact preferences on the draft lineage and feeds submit readiness", async () => {
    const application = createContactPreferenceApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2026-04-14T17:20:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_contact_pref_details_001",
        idempotencyKey: "idem_contact_pref_details_001",
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
        currentStepKey: "contact_preferences",
        completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/contact-preferences`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-04-14T17:21:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    const captured = await application.captureContactPreferences({
      draftPublicId: created.view.draftPublicId,
      preferredChannel: "sms",
      destinations: {
        sms: "+44 7700 900123",
        phone: "+44 7700 900456",
        email: "patient@example.com",
      },
      contactWindow: "weekday_daytime",
      voicemailAllowed: true,
      followUpPermission: true,
      quietHours: {
        startLocalTime: "20:00",
        endLocalTime: "08:00",
        timezone: "Europe/London",
      },
      languagePreference: "en",
      translationRequired: false,
      accessibilityNeeds: ["large_text"],
      sourceEvidenceRef: "draft_patch::contact_pref_001",
      clientCommandId: "cmd_contact_pref_001",
      idempotencyKey: "idem_contact_pref_001",
      recordedAt: "2026-04-14T17:22:00Z",
    });

    application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");

    const maskedView = await application.getMaskedContactPreferenceView(created.view.draftPublicId);
    const submitVerdict = await application.validation.evaluateSubmitReadiness(
      created.view.draftPublicId,
    );

    expect(captured.replayed).toBe(false);
    expect(maskedView.preferredDestinationMasked).toContain("••");
    expect(maskedView.preferredDestinationMasked).not.toContain("900123");
    expect(submitVerdict.verdictState).toBe("submit_ready");
    expect(submitVerdict.normalizedSubmissionCandidate).toMatchObject({
      contactPreferencesRef: captured.capture.toSnapshot().contactPreferencesRef,
    });
  });

  it("fails closed on incomplete captured contact preferences even when the public draft tuple exists", async () => {
    const application = createContactPreferenceApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2026-04-14T17:24:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    await application.drafts.patchDraft(
      created.view.draftPublicId,
      {
        draftVersion: created.view.draftVersion,
        clientCommandId: "cmd_contact_pref_details_002",
        idempotencyKey: "idem_contact_pref_details_002",
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
        currentStepKey: "contact_preferences",
        completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
        currentPathname: `/intake/drafts/${created.view.draftPublicId}/contact-preferences`,
        shellContinuityKey: "patient.portal.requests",
        selectedAnchorKey: "request-proof",
        recordedAt: "2026-04-14T17:25:00Z",
      },
      runtimeContextFromLease(created.lease),
    );

    await application.captureContactPreferences({
      draftPublicId: created.view.draftPublicId,
      preferredChannel: "sms",
      destinations: {
        sms: null,
      },
      contactWindow: "weekday_daytime",
      voicemailAllowed: true,
      followUpPermission: null,
      sourceEvidenceRef: "draft_patch::contact_pref_002",
      clientCommandId: "cmd_contact_pref_002",
      idempotencyKey: "idem_contact_pref_002",
      recordedAt: "2026-04-14T17:26:00Z",
    });

    application.validation.seedUrgentDecisionState(created.view.draftPublicId, "clear");

    const summary = await application.buildContactPreferenceValidationSummary(created.view.draftPublicId);
    const submitVerdict = await application.validation.evaluateSubmitReadiness(
      created.view.draftPublicId,
    );

    expect(summary.completenessState).toBe("incomplete");
    expect(summary.reasonCodes).toContain("CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL");
    expect(submitVerdict.verdictState).toBe("submit_blocked");
    expect(submitVerdict.submitReadiness.blockerCodes).toContain("CONTACT_PREFERENCE_INCOMPLETE");
  });

  it("mints one unverified ContactRouteSnapshot from the frozen bridge without manufacturing calm reachability truth", async () => {
    const application = createContactPreferenceApplication();

    const created = await application.drafts.createDraft({
      requestType: "Symptoms",
      surfaceChannelProfile: "browser",
      routeEntryRef: "phase1_intake_entry",
      createdAt: "2026-04-14T17:28:00Z",
      sessionEpochRef: "session_epoch_browser_v1",
    });

    const captured = await application.captureContactPreferences({
      draftPublicId: created.view.draftPublicId,
      preferredChannel: "email",
      destinations: {
        email: "patient@example.com",
      },
      contactWindow: "anytime",
      voicemailAllowed: false,
      followUpPermission: true,
      sourceEvidenceRef: "draft_patch::contact_pref_003",
      clientCommandId: "cmd_contact_pref_003",
      idempotencyKey: "idem_contact_pref_003",
      recordedAt: "2026-04-14T17:29:00Z",
    });

    await application.freezeContactPreferencesForSubmit({
      draftPublicId: created.view.draftPublicId,
      frozenAt: "2026-04-14T17:30:00Z",
    });

    const minted = await application.mintInitialContactRouteSnapshot({
      draftPublicId: created.view.draftPublicId,
      subjectRef: "subject_147_route_001",
      createdAt: "2026-04-14T17:31:00Z",
    });
    const contactRouteSnapshot = await application.repositories.getContactRouteSnapshot(
      minted.contactRouteSnapshotRef,
    );

    expect(minted.contactPreferencesRef).toBe(captured.capture.toSnapshot().contactPreferencesRef);
    expect(contactRouteSnapshot?.toSnapshot().verificationState).toBe("unverified");
    expect(contactRouteSnapshot?.toSnapshot().preferenceFreshnessState).toBe("current");
  });
});
