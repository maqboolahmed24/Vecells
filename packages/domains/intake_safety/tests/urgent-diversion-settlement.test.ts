import { describe, expect, it } from "vitest";
import {
  createSynchronousSafetyServices,
  createSynchronousSafetyStore,
  createUrgentDiversionSettlementService,
} from "../src/index.ts";

function buildEvidenceCut(overrides: Record<string, unknown> = {}) {
  return {
    requestId: "request_151_001",
    submissionSnapshotFreezeRef: "freeze_151_001",
    evidenceSnapshotRef: "snapshot_151_001",
    normalizedSubmissionRef: "normalized_151_001",
    sourceLineageRef: "submissionEnvelope_151_001",
    requestTypeRef: "Symptoms" as const,
    requestShape: {
      symptoms: {
        symptomCategoryCode: "general",
        onsetPrecision: "exact_date",
        onsetDate: "2026-04-10",
        worseningNow: false,
      },
    },
    activeStructuredAnswers: {
      "symptoms.category": "general",
      "symptoms.onsetPrecision": "exact_date",
      "symptoms.onsetDate": "2026-04-10",
      "symptoms.worseningNow": false,
      "symptoms.severityClues": ["sleep_affected"],
      "symptoms.narrative": "The problem has been getting harder to ignore.",
    },
    authoredNarrativeText: "The problem has been getting harder to ignore.",
    summaryFragments: ["General symptoms", "Sleep affected"],
    attachmentRefs: [],
    contactPreferencesRef: "contact_pref_151_001",
    contactAuthorityState: "assumed_self_service_browser_minimum" as const,
    contactAuthorityClass: "self_asserted" as const,
    evidenceReadinessState: "safety_usable" as const,
    channelCapabilityCeiling: {
      canUploadFiles: true,
      canRenderTrackStatus: true,
      canRenderEmbedded: false,
      mutatingResumeState: "allowed" as const,
    },
    identityContext: {
      bindingState: "anonymous" as const,
      subjectRefPresence: "none" as const,
      claimResumeState: "not_required" as const,
      actorBindingState: "anonymous" as const,
    },
    frozenAt: "2026-04-14T23:40:00Z",
    ...overrides,
  };
}

describe("urgent diversion settlement service", () => {
  it("issues one durable urgent-diversion settlement and exact-replays the same tuple", async () => {
    const repositories = createSynchronousSafetyStore();
    const safety = createSynchronousSafetyServices(repositories);
    const service = createUrgentDiversionSettlementService(repositories);

    const evaluation = await safety.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_151_001",
      requestId: "request_151_001",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T23:40:00Z",
      evidenceCut: buildEvidenceCut({
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
          "symptoms.chestPainLocation": "centre_chest",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": true,
          "symptoms.severityClues": ["mobility_affected", "sudden_change"],
          "symptoms.narrative": "Chest pain and struggling to breathe right now.",
        },
        authoredNarrativeText: "Chest pain and struggling to breathe right now.",
        summaryFragments: ["Chest pain", "Struggling to breathe"],
        requestShape: {
          symptoms: {
            symptomCategoryCode: "chest_breathing",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-14",
            worseningNow: true,
          },
        },
      }),
    });

    const first = await service.issueSettlement({
      requestId: "request_151_001",
      safetyDecisionRef: evaluation.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_151_urgent_001",
      authoritativeActionRef: "action_151_urgent_001",
      settlementState: "issued",
      issuedAt: "2026-04-14T23:40:01Z",
      settledAt: "2026-04-14T23:40:01Z",
    });
    const replay = await service.issueSettlement({
      requestId: "request_151_001",
      safetyDecisionRef: evaluation.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_151_urgent_001",
      authoritativeActionRef: "action_151_urgent_001",
      settlementState: "issued",
      issuedAt: "2026-04-14T23:40:01Z",
      settledAt: "2026-04-14T23:40:01Z",
    });

    expect(first.replayed).toBe(false);
    expect(first.urgentDiversionSettlement.settlementState).toBe("issued");
    expect(first.supersededSettlementRef).toBeNull();
    expect(replay.replayed).toBe(true);
    expect(replay.urgentDiversionSettlement.urgentDiversionSettlementId).toBe(
      first.urgentDiversionSettlement.urgentDiversionSettlementId,
    );
  });

  it("threads supersession when a later urgent issuance replaces the prior settlement", async () => {
    const repositories = createSynchronousSafetyStore();
    const safety = createSynchronousSafetyServices(repositories);
    const service = createUrgentDiversionSettlementService(repositories);

    const evaluation = await safety.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_151_002",
      requestId: "request_151_002",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T23:41:00Z",
      evidenceCut: buildEvidenceCut({
        requestId: "request_151_002",
        submissionSnapshotFreezeRef: "freeze_151_002",
        evidenceSnapshotRef: "snapshot_151_002",
        normalizedSubmissionRef: "normalized_151_002",
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
          "symptoms.chestPainLocation": "centre_chest",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": true,
          "symptoms.severityClues": ["mobility_affected", "sudden_change"],
          "symptoms.narrative": "Chest pain and struggling to breathe right now.",
        },
        authoredNarrativeText: "Chest pain and struggling to breathe right now.",
        summaryFragments: ["Chest pain", "Struggling to breathe"],
        requestShape: {
          symptoms: {
            symptomCategoryCode: "chest_breathing",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-14",
            worseningNow: true,
          },
        },
      }),
    });

    const pending = await service.issueSettlement({
      requestId: "request_151_002",
      safetyDecisionRef: evaluation.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_151_urgent_002_pending",
      authoritativeActionRef: "action_151_urgent_002_pending",
      settlementState: "pending",
      settledAt: "2026-04-14T23:41:01Z",
    });
    const issued = await service.issueSettlement({
      requestId: "request_151_002",
      safetyDecisionRef: evaluation.safetyDecision.safetyDecisionId,
      actionMode: "urgent_guidance_presented",
      presentationArtifactRef: "iopa_151_urgent_002_issued",
      authoritativeActionRef: "action_151_urgent_002_issued",
      settlementState: "issued",
      issuedAt: "2026-04-14T23:41:02Z",
      settledAt: "2026-04-14T23:41:02Z",
    });

    expect(issued.replayed).toBe(false);
    expect(issued.supersededSettlementRef).toBe(
      pending.urgentDiversionSettlement.urgentDiversionSettlementId,
    );
  });

  it("fails closed when the governing safety decision is not urgent", async () => {
    const repositories = createSynchronousSafetyStore();
    const safety = createSynchronousSafetyServices(repositories);
    const service = createUrgentDiversionSettlementService(repositories);

    const evaluation = await safety.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_151_003",
      requestId: "request_151_003",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T23:42:00Z",
      evidenceCut: buildEvidenceCut({
        requestId: "request_151_003",
        submissionSnapshotFreezeRef: "freeze_151_003",
        evidenceSnapshotRef: "snapshot_151_003",
        normalizedSubmissionRef: "normalized_151_003",
      }),
    });

    await expect(
      service.issueSettlement({
        requestId: "request_151_003",
        safetyDecisionRef: evaluation.safetyDecision.safetyDecisionId,
        actionMode: "urgent_guidance_presented",
        settlementState: "issued",
        issuedAt: "2026-04-14T23:42:01Z",
        settledAt: "2026-04-14T23:42:01Z",
      }),
    ).rejects.toMatchObject({
      code: "URGENT_DIVERSION_DECISION_NOT_URGENT",
    });
  });
});
