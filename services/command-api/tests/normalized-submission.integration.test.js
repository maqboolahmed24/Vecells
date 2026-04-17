import { describe, expect, it } from "vitest";
import { createNormalizedSubmissionApplication } from "../src/normalized-submission.ts";

function freeze(overrides = {}) {
  return {
    submissionSnapshotFreezeRef: "freeze_149_cmd_001",
    submissionEnvelopeRef: "submissionEnvelope_149_cmd_001",
    sourceLineageRef: "submissionEnvelope_149_cmd_001",
    draftPublicId: "draft_149_cmd_001",
    requestType: "Meds",
    intakeExperienceBundleRef: "IEB_140_BROWSER_STANDARD_V1",
    activeQuestionKeys: [
      "meds.queryType",
      "meds.nameKnown",
      "meds.medicineName",
      "meds.issueDescription",
      "meds.urgency",
    ],
    activeStructuredAnswers: {
      "meds.queryType": "repeat_supply",
      "meds.nameKnown": "known",
      "meds.medicineName": "Amoxicillin",
      "meds.issueDescription": "I have run out of tablets.",
      "meds.urgency": "urgent_today",
    },
    freeTextNarrative: "I have run out of tablets.",
    attachmentRefs: [],
    contactPreferencesRef: "cpref_149_cmd_001",
    routeFamilyRef: "rf_intake_self_service",
    routeIntentBindingRef: "RIB_149_CMD_V1",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
    channelReleaseFreezeState: "monitoring",
    manifestVersionRef: "manifest_phase1_browser_v1",
    sessionEpochRef: "session_epoch_browser_v1",
    surfaceChannelProfile: "browser",
    ingressChannel: "self_service_form",
    intakeConvergenceContractRef: "ICC_139_PHASE1_BROWSER_V1",
    sourceHash: "source_hash_149_cmd_001",
    semanticHash: "semantic_hash_149_cmd_001",
    evidenceCaptureBundleRef: "capture_bundle_149_cmd_001",
    frozenAt: "2026-04-14T23:20:00Z",
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
    contactAuthorityState: "assumed_self_service_browser_minimum",
    contactAuthorityPolicyRef: "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1",
    ...overrides,
  };
}

describe("normalized submission command-api seam", () => {
  it("persists one canonical normalized submission from a frozen evidence cut", async () => {
    const application = createNormalizedSubmissionApplication();

    const document = await application.normalizeAndPersist({
      normalizedSubmissionId: "normalized_submission_149_cmd_001",
      governingSnapshotRef: "evidence_snapshot_149_cmd_001",
      primaryIngressRecordRef: "ingress::draft_149_cmd_001::2026-04-14T23:20:00Z",
      freeze: freeze(),
      createdAt: "2026-04-14T23:20:01Z",
    });

    const persisted = await application.repositories.getNormalizedSubmission(
      document.normalizedSubmissionId,
    );

    expect(persisted?.toSnapshot().requestType).toBe("Meds");
    expect(persisted?.toSnapshot().requestShape).toMatchObject({
      meds: {
        queryTypeCode: "repeat_supply",
        medicineNameState: "known",
        medicineNameText: "Amoxicillin",
        issueNarrative: "I have run out of tablets.",
        urgencyBand: "urgent_today",
      },
    });
    expect(persisted?.toSnapshot().governingSnapshotRef).toBe(
      "evidence_snapshot_149_cmd_001",
    );
    expect(persisted?.toSnapshot().normalizationVersionRef).toBe(
      application.service.normalizationVersionRef,
    );
  });
});
