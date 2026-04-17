import { describe, expect, it } from "vitest";
import {
  buildNormalizedSubmissionDedupeFingerprint,
  createNormalizedSubmissionService,
  type NormalizedSubmissionFreezeInput,
} from "../src/normalized-submission";

function makeFreeze(overrides: Partial<NormalizedSubmissionFreezeInput> = {}) {
  return {
    submissionSnapshotFreezeRef: "freeze_149_001",
    submissionEnvelopeRef: "submissionEnvelope_149_001",
    sourceLineageRef: "submissionEnvelope_149_001",
    draftPublicId: "draft_149_001",
    requestType: "Symptoms" as const,
    intakeExperienceBundleRef: "IEB_140_BROWSER_STANDARD_V1",
    activeQuestionKeys: [
      "symptoms.category",
      "symptoms.onsetPrecision",
      "symptoms.onsetDate",
      "symptoms.worseningNow",
      "symptoms.severityClues",
      "symptoms.narrative",
    ],
    activeStructuredAnswers: {
      "symptoms.category": "general",
      "symptoms.onsetPrecision": "exact_date",
      "symptoms.onsetDate": "2026-04-10",
      "symptoms.worseningNow": false,
      "symptoms.severityClues": ["sleep_affected", "sudden_change"],
      "symptoms.narrative": "The pain is worse at night.",
    },
    freeTextNarrative: "  The pain is worse at night.  ",
    attachmentRefs: ["att_b", "att_a"],
    contactPreferencesRef: "cpref_149_001",
    routeFamilyRef: "rf_intake_self_service",
    routeIntentBindingRef: "RIB_149_NORMALIZE_V1",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
    channelReleaseFreezeState: "monitoring" as const,
    manifestVersionRef: "manifest_phase1_browser_v1",
    sessionEpochRef: "session_epoch_browser_v1",
    surfaceChannelProfile: "browser" as const,
    ingressChannel: "self_service_form" as const,
    intakeConvergenceContractRef: "ICC_139_PHASE1_BROWSER_V1",
    sourceHash: "source_hash_149_001",
    semanticHash: "semantic_hash_149_001",
    evidenceCaptureBundleRef: "capture_bundle_149_001",
    frozenAt: "2026-04-14T23:10:00Z",
    identityContext: {
      bindingState: "anonymous" as const,
      subjectRefPresence: "none" as const,
      claimResumeState: "not_required" as const,
      actorBindingState: "anonymous" as const,
    },
    channelCapabilityCeiling: {
      canUploadFiles: true,
      canRenderTrackStatus: true,
      canRenderEmbedded: false,
      mutatingResumeState: "allowed" as const,
    },
    contactAuthorityState: "assumed_self_service_browser_minimum" as const,
    contactAuthorityPolicyRef: "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1",
    ...overrides,
  };
}

describe("normalized submission service", () => {
  it("creates one deterministic canonical normalized submission from a frozen submit cut", () => {
    const service = createNormalizedSubmissionService();
    const freeze = makeFreeze();

    const first = service.createNormalizedSubmission({
      normalizedSubmissionId: "normalized_submission_149_001",
      governingSnapshotRef: "evidence_snapshot_149_001",
      primaryIngressRecordRef: "ingress::draft_149_001::2026-04-14T23:10:00Z",
      freeze,
      createdAt: "2026-04-14T23:10:01Z",
    });
    const replay = service.createNormalizedSubmission({
      normalizedSubmissionId: "normalized_submission_149_001",
      governingSnapshotRef: "evidence_snapshot_149_001",
      primaryIngressRecordRef: "ingress::draft_149_001::2026-04-14T23:10:00Z",
      freeze: JSON.parse(JSON.stringify(freeze)),
      createdAt: "2026-04-14T23:10:01Z",
    });

    expect(replay.toSnapshot()).toEqual(first.toSnapshot());
    expect(first.toSnapshot().requestShape).toMatchObject({
      symptoms: {
        symptomCategoryCode: "general",
        onsetPrecision: "exact_date",
        onsetDate: "2026-04-10",
        worseningNow: false,
        severityClueCodes: ["sleep_affected", "sudden_change"],
        patientNarrative: "The pain is worse at night.",
      },
    });
    expect(first.toSnapshot().authoredNarrative).toMatchObject({
      sourceKind: "free_text",
      authoredText: "The pain is worse at night.",
    });
  });

  it("keeps dedupe fingerprints stable across answer ordering and whitespace-only narrative drift", () => {
    const baseline = {
      requestType: "Symptoms" as const,
      requestShape: {
        symptoms: {
          symptomCategoryCode: "general",
          severityClueCodes: ["sleep_affected", "sudden_change"],
          patientNarrative: "The pain is worse at night.",
        },
      },
      authoredNarrative: {
        sourceKind: "free_text" as const,
        authoredText: "The pain is worse at night.",
        canonicalText: "The pain is worse at night.",
        tokenFingerprint: "fp",
      },
    };

    const reordered = {
      requestType: "Symptoms" as const,
      requestShape: {
        symptoms: {
          patientNarrative: "The pain is worse at night.",
          severityClueCodes: ["sudden_change", "sleep_affected"],
          symptomCategoryCode: "general",
        },
      },
      authoredNarrative: {
        sourceKind: "free_text" as const,
        authoredText: " The pain is  worse at night. ",
        canonicalText: "The pain is worse at night.",
        tokenFingerprint: "fp",
      },
    };

    expect(buildNormalizedSubmissionDedupeFingerprint(baseline)).toBe(
      buildNormalizedSubmissionDedupeFingerprint(reordered),
    );
  });

  it("uses the request-type narrative field when the dedicated free-text channel is blank", () => {
    const service = createNormalizedSubmissionService();
    const normalized = service.createNormalizedSubmission({
      normalizedSubmissionId: "normalized_submission_149_002",
      governingSnapshotRef: "evidence_snapshot_149_002",
      primaryIngressRecordRef: "ingress::draft_149_002::2026-04-14T23:11:00Z",
      freeze: makeFreeze({
        requestType: "Results",
        activeStructuredAnswers: {
          "results.context": "blood_test",
          "results.testName": "Full blood count",
          "results.dateKnown": "unknown",
          "results.question": "What does this result mean for me?",
        },
        freeTextNarrative: "",
      }),
      createdAt: "2026-04-14T23:11:01Z",
    });

    expect(normalized.toSnapshot().requestShape).toMatchObject({
      results: {
        contextCode: "blood_test",
        testNameText: "Full blood count",
        resultDateState: "unknown",
        patientQuestion: "What does this result mean for me?",
      },
    });
    expect(normalized.toSnapshot().authoredNarrative).toMatchObject({
      sourceKind: "request_field",
      authoredText: "What does this result mean for me?",
    });
  });

  it("sorts multi-select answers and attachment refs in the canonical snapshot", () => {
    const service = createNormalizedSubmissionService();
    const normalized = service.createNormalizedSubmission({
      normalizedSubmissionId: "normalized_submission_149_003",
      governingSnapshotRef: "evidence_snapshot_149_003",
      primaryIngressRecordRef: "ingress::draft_149_003::2026-04-14T23:12:00Z",
      freeze: makeFreeze({
        attachmentRefs: ["att_c", "att_a", "att_b"],
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-10",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sudden_change", "sleep_affected", "sleep_affected"],
          "symptoms.narrative": "The pain is worse at night.",
        },
      }),
      createdAt: "2026-04-14T23:12:01Z",
    });

    expect(normalized.toSnapshot().attachmentRefs).toEqual(["att_a", "att_b", "att_c"]);
    expect(normalized.toSnapshot().requestShape).toMatchObject({
      symptoms: {
        severityClueCodes: ["sleep_affected", "sudden_change"],
      },
    });
  });
});
