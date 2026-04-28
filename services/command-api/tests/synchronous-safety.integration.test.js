import { describe, expect, it } from "vitest";
import { createSynchronousSafetyApplication } from "../src/synchronous-safety.ts";

function buildEvidenceCut(overrides = {}) {
  return {
    requestId: "request_cmd_150_001",
    submissionSnapshotFreezeRef: "freeze_cmd_150_001",
    evidenceSnapshotRef: "snapshot_cmd_150_001",
    normalizedSubmissionRef: "normalized_cmd_150_001",
    sourceLineageRef: "submissionEnvelope_cmd_150_001",
    requestTypeRef: "Results",
    requestShape: {
      results: {
        contextCode: "blood_test",
        questionText: "What does this abnormal result mean?",
      },
    },
    activeStructuredAnswers: {
      "results.context": "blood_test",
      "results.question": "What does this abnormal result mean?",
      "results.dateKnown": "unknown",
    },
    authoredNarrativeText: "The result says abnormal and I am feeling worse with chest discomfort.",
    summaryFragments: ["Blood test result", "Abnormal result question"],
    attachmentRefs: [],
    contactPreferencesRef: "contact_pref_cmd_150_001",
    contactAuthorityState: "assumed_self_service_browser_minimum",
    contactAuthorityClass: "self_asserted",
    evidenceReadinessState: "safety_usable",
    channelCapabilityCeiling: {
      canUploadFiles: true,
      canRenderTrackStatus: true,
      canRenderEmbedded: false,
      mutatingResumeState: "allowed",
    },
    identityContext: {
      bindingState: "anonymous",
      subjectRefPresence: "none",
      claimResumeState: "not_required",
      actorBindingState: "anonymous",
    },
    frozenAt: "2026-04-14T22:10:00Z",
    ...overrides,
  };
}

describe("synchronous safety command-api seam", () => {
  it("persists the immutable submit-time safety chain without issuing urgent settlement early", async () => {
    const application = createSynchronousSafetyApplication();

    const result = await application.services.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_cmd_150_001",
      requestId: "request_cmd_150_001",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T22:10:00Z",
      evidenceCut: buildEvidenceCut(),
    });

    expect(result.replayed).toBe(false);
    expect(result.classification.classificationDecisionId).toBeTruthy();
    expect(result.preemption.preemptionId).toBeTruthy();
    expect(result.safetyDecision.safetyDecisionId).toBeTruthy();
    expect(result.safetyDecision.requestedSafetyState).toBe("urgent_diversion_required");
    expect(
      await application.repositories.getUrgentDiversionSettlement(
        "settlement_should_not_exist",
      ),
    ).toBeNull();
    expect(
      await application.repositories.findLatestUrgentDiversionSettlementForRequest(
        "request_cmd_150_001",
      ),
    ).toBeNull();
  });
});
