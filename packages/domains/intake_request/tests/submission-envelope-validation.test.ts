import { describe, expect, it } from "vitest";
import { createSubmissionEnvelopeValidationService } from "../src/submission-envelope-validation";

function validSymptomsInput(overrides = {}) {
  return {
    envelopeRef: "submissionEnvelope_145_0001",
    draftPublicId: "dft_145ready0001",
    requestType: "Symptoms",
    structuredAnswers: {
      "symptoms.category": "general",
      "symptoms.onsetPrecision": "exact_date",
      "symptoms.onsetDate": "2026-04-10",
      "symptoms.worseningNow": false,
      "symptoms.severityClues": ["sleep_affected"],
      "symptoms.narrative": "The problem has been getting harder to ignore.",
    },
    freeTextNarrative: "",
    attachmentRefs: [],
    contactPreferences: {
      preferredChannel: "sms",
      contactWindow: "weekday_daytime",
      voicemailAllowed: true,
    },
    identityContext: {
      bindingState: "anonymous",
      subjectRefPresence: "none",
      claimResumeState: "not_required",
      actorBindingState: "anonymous",
    },
    channelCapabilityCeiling: {
      canUploadFiles: true,
      canRenderTrackStatus: true,
      canRenderEmbedded: false,
      mutatingResumeState: "allowed",
    },
    surfaceChannelProfile: "browser",
    ingressChannel: "self_service_form",
    intakeConvergenceContractRef: "ICC_PHASE1_SELF_SERVICE_FORM_V1",
    draftVersion: 3,
    currentStepKey: "review_submit",
    completedStepKeys: ["request_type", "details", "contact_preferences", "review_submit"],
    urgentDecisionState: "clear",
    convergenceState: "valid",
    ...overrides,
  } as const;
}

describe("submission envelope validation", () => {
  it("separates permissive draft-save shape validation from strict submit readiness", () => {
    const service = createSubmissionEnvelopeValidationService();
    const input = validSymptomsInput({
      structuredAnswers: {
        "symptoms.category": "general",
      },
      currentStepKey: "details",
      completedStepKeys: ["request_type"],
      urgentDecisionState: "pending",
    });

    const draftVerdict = service.evaluateDraftSave(input);
    const submitVerdict = service.evaluateSubmit(input);

    expect(draftVerdict.verdictState).toBe("shape_valid");
    expect(draftVerdict.issues.some((issue) => issue.code === "FIELD_REQUIRED")).toBe(true);
    expect(submitVerdict.verdictState).toBe("submit_blocked");
    expect(submitVerdict.submitReadiness.blockerCodes).toContain("FIELD_REQUIRED");
    expect(submitVerdict.submitReadiness.blockerCodes).toContain("URGENT_DECISION_PENDING");
  });

  it("excludes superseded hidden answers from active payload and normalization", () => {
    const service = createSubmissionEnvelopeValidationService();
    const verdict = service.evaluateSubmit(
      validSymptomsInput({
        structuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "approximate_window",
          "symptoms.onsetDate": "2026-04-10",
          "symptoms.onsetWindow": "today",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sudden_change"],
          "symptoms.narrative": "Started suddenly today.",
        },
      }),
    );

    expect(verdict.supersededQuestionKeys).toContain("symptoms.onsetDate");
    expect(verdict.activeStructuredAnswers).not.toHaveProperty("symptoms.onsetDate");
    expect(
      verdict.issues.some((issue) => issue.code === "FIELD_SUPERSEDED_HIDDEN_ANSWER"),
    ).toBe(true);
    expect(verdict.normalizedSubmissionCandidate).toMatchObject({
      symptoms: {
        onsetPrecision: "approximate_window",
        onsetWindowCode: "today",
      },
    });
  });

  it("fails closed on unresolved attachment or embedded contact-authority gaps", () => {
    const service = createSubmissionEnvelopeValidationService();
    const browserBlocked = service.evaluateSubmit(
      validSymptomsInput({
        attachmentRefs: ["att_145unresolved"],
      }),
    );
    const embeddedBlocked = service.evaluateSubmit(
      validSymptomsInput({
        surfaceChannelProfile: "embedded",
        channelCapabilityCeiling: {
          canUploadFiles: true,
          canRenderTrackStatus: false,
          canRenderEmbedded: false,
          mutatingResumeState: "allowed",
        },
      }),
    );

    expect(browserBlocked.submitReadiness.blockerCodes).toContain("ATTACHMENT_STATE_UNRESOLVED");
    expect(browserBlocked.submitReadiness.gapRefs).toContain(
      "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING",
    );
    expect(embeddedBlocked.submitReadiness.blockerCodes).toContain("CHANNEL_CAPABILITY_BLOCKED");
    expect(embeddedBlocked.issues.some((issue) => issue.code === "CONTACT_AUTHORITY_BLOCKED")).toBe(
      true,
    );
  });

  it("is deterministic and replay-safe for the same preflight input", () => {
    const service = createSubmissionEnvelopeValidationService();
    const input = validSymptomsInput();
    const first = service.evaluateSubmit(input);
    const replay = service.evaluateSubmit(JSON.parse(JSON.stringify(input)));

    expect(first.verdictState).toBe("submit_ready");
    expect(replay).toEqual(first);
    expect(replay.verdictHash).toBe(first.verdictHash);
  });

  it("uses captured contact-preference completeness and writes contactPreferencesRef into the normalization candidate", () => {
    const service = createSubmissionEnvelopeValidationService();
    const verdict = service.evaluateSubmit(
      validSymptomsInput({
        contactPreferenceSummary: {
          validationSummarySchemaVersion: "PHASE1_CONTACT_PREFERENCE_VALIDATION_SUMMARY_V1",
          draftPublicId: "dft_145ready0001",
          envelopeRef: "submissionEnvelope_145_0001",
          contactPreferenceCaptureRef: "contact_pref_capture_147_001",
          contactPreferencesRef: "cpref_147ready0001",
          maskedViewRef: "contact_pref_masked_147_001",
          routeSnapshotSeedRef: "route_seed_147_001",
          preferredChannel: "sms",
          preferredDestinationMasked: "+44 ••••••0123",
          completenessState: "complete",
          reasonCodes: [
            "GAP_RESOLVED_CONTACT_PREFERENCE_MINIMUM_PHASE1_SELF_SERVICE_V1",
          ],
          sourceAuthorityClass: "self_service_browser_entry",
        },
      }),
    );

    expect(verdict.verdictState).toBe("submit_ready");
    expect(verdict.normalizedSubmissionCandidate).toMatchObject({
      contactPreferencesRef: "cpref_147ready0001",
    });
  });

  it("blocks submit when captured contact preferences remain incomplete", () => {
    const service = createSubmissionEnvelopeValidationService();
    const verdict = service.evaluateSubmit(
      validSymptomsInput({
        contactPreferenceSummary: {
          validationSummarySchemaVersion: "PHASE1_CONTACT_PREFERENCE_VALIDATION_SUMMARY_V1",
          draftPublicId: "dft_145ready0001",
          envelopeRef: "submissionEnvelope_145_0001",
          contactPreferenceCaptureRef: "contact_pref_capture_147_002",
          contactPreferencesRef: "cpref_147blocked0001",
          maskedViewRef: "contact_pref_masked_147_002",
          routeSnapshotSeedRef: null,
          preferredChannel: "sms",
          preferredDestinationMasked: null,
          completenessState: "incomplete",
          reasonCodes: ["CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL"],
          sourceAuthorityClass: "self_service_browser_entry",
        },
      }),
    );

    expect(verdict.verdictState).toBe("submit_blocked");
    expect(verdict.submitReadiness.blockerCodes).toContain("CONTACT_PREFERENCE_INCOMPLETE");
  });

  it("keeps branch supersession deterministic across the frozen conditional branches", () => {
    const service = createSubmissionEnvelopeValidationService();
    const branchCases = [
      {
        requestType: "Symptoms",
        driverKey: "symptoms.onsetPrecision",
        driverValue: "approximate_window",
        hiddenKey: "symptoms.onsetDate",
        hiddenValue: "2026-04-10",
        visibleKey: "symptoms.onsetWindow",
        visibleValue: "today",
      },
      {
        requestType: "Meds",
        driverKey: "meds.nameKnown",
        driverValue: "unknown_or_unsure",
        hiddenKey: "meds.medicineName",
        hiddenValue: "Amoxicillin",
        visibleKey: "meds.nameUnknownReason",
        visibleValue: "label_not_available",
      },
      {
        requestType: "Admin",
        driverKey: "admin.referenceAvailable",
        driverValue: "not_available",
        hiddenKey: "admin.referenceNumber",
        hiddenValue: "ABC123",
        visibleKey: "admin.details",
        visibleValue: "Need help with a note.",
      },
      {
        requestType: "Results",
        driverKey: "results.dateKnown",
        driverValue: "unknown",
        hiddenKey: "results.resultDate",
        hiddenValue: "2026-04",
        visibleKey: "results.question",
        visibleValue: "What does it mean?",
      },
    ];

    for (const branchCase of branchCases) {
      const baseAnswers =
        branchCase.requestType === "Symptoms"
          ? {
              "symptoms.category": "general",
              "symptoms.worseningNow": false,
              "symptoms.severityClues": ["sudden_change"],
              "symptoms.narrative": "Started suddenly today.",
            }
          : branchCase.requestType === "Meds"
            ? {
                "meds.queryType": "repeat_supply",
                "meds.issueDescription": "Need help with a repeat supply.",
                "meds.urgency": "urgent_today",
              }
            : branchCase.requestType === "Admin"
              ? {
                  "admin.supportType": "fit_note",
                  "admin.deadlineKnown": "deadline_known",
                  "admin.deadlineDate": "2026-04-20",
                }
              : {
                  "results.context": "blood_test",
                  "results.testName": "Full blood count",
                  "results.question": "What does it mean?",
                };

      const verdict = service.evaluateDraftSave(
        validSymptomsInput({
          requestType: branchCase.requestType,
          structuredAnswers: {
            ...baseAnswers,
            [branchCase.driverKey]: branchCase.driverValue,
            [branchCase.hiddenKey]: branchCase.hiddenValue,
            [branchCase.visibleKey]: branchCase.visibleValue,
          },
        }),
      );

      expect(verdict.supersededQuestionKeys).toContain(branchCase.hiddenKey);
      expect(verdict.activeStructuredAnswers).not.toHaveProperty(branchCase.hiddenKey);
      expect(verdict.activeStructuredAnswers).toHaveProperty(branchCase.visibleKey);
    }
  });
});
