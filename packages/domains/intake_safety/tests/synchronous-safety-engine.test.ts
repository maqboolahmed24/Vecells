import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createSynchronousSafetyServices,
  createSynchronousSafetyStore,
  phase1SynchronousSafetyRulePackRegistry,
  type SynchronousSafetyEvidenceCut,
} from "../src/index.ts";

interface ChallengeCase {
  caseId: string;
  expectedDecisionOutcome: string;
  expectedRequestedSafetyState: string;
  expectedRuleRefs: readonly string[];
}

function buildEvidenceCut(overrides: Partial<SynchronousSafetyEvidenceCut> = {}) {
  const base: SynchronousSafetyEvidenceCut = {
    requestId: "request_150_001",
    submissionSnapshotFreezeRef: "freeze_150_001",
    evidenceSnapshotRef: "snapshot_150_001",
    normalizedSubmissionRef: "normalized_150_001",
    sourceLineageRef: "submissionEnvelope_150_001",
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
    contactPreferencesRef: "contact_pref_150_001",
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
    frozenAt: "2026-04-14T22:03:00Z",
  };
  return {
    ...base,
    ...overrides,
  };
}

const challengeCases = readFileSync(
  new URL("../../../../data/analysis/150_challenge_case_corpus.jsonl", import.meta.url),
  "utf8",
)
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line) as ChallengeCase);

function buildChallengeEvidenceCut(caseId: string): SynchronousSafetyEvidenceCut {
  const requestId = `request_${caseId.toLowerCase()}`;
  const common = {
    requestId,
    submissionSnapshotFreezeRef: `freeze_${caseId.toLowerCase()}`,
    evidenceSnapshotRef: `snapshot_${caseId.toLowerCase()}`,
    normalizedSubmissionRef: `normalized_${caseId.toLowerCase()}`,
    sourceLineageRef: `lineage_${caseId.toLowerCase()}`,
  };

  switch (caseId) {
    case "CASE_150_SYMPTOMS_CHEST_BREATHING":
      return buildEvidenceCut({
        ...common,
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
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
      });
    case "CASE_150_RESULTS_HIGH_RISK":
      return buildEvidenceCut({
        ...common,
        requestTypeRef: "Results",
        activeStructuredAnswers: {
          "results.context": "blood_test",
          "results.question": "My abnormal result is worse and I have current pain.",
          "results.dateKnown": "known",
          "symptoms.category": "pain",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": true,
          "symptoms.severityClues": ["mobility_affected"],
        },
        authoredNarrativeText: "Abnormal result, worse today, with current pain.",
        summaryFragments: ["Abnormal result", "Current symptoms"],
        requestShape: {
          results: {
            contextCode: "blood_test",
            questionText: "My abnormal result is worse and I have current pain.",
          },
        },
      });
    case "CASE_150_SYMPTOMS_PERSISTENT":
      return buildEvidenceCut({
        ...common,
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-03-30",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sleep_affected", "work_or_school_affected"],
          "symptoms.narrative": "This has persisted for over two weeks and affects sleep.",
        },
        authoredNarrativeText: "This has persisted for over two weeks and affects sleep.",
        summaryFragments: ["Persistent symptoms", "Sleep affected"],
        requestShape: {
          symptoms: {
            symptomCategoryCode: "general",
            onsetPrecision: "exact_date",
            onsetDate: "2026-03-30",
            worseningNow: false,
          },
        },
      });
    case "CASE_150_ADMIN_DEADLINE":
      return buildEvidenceCut({
        ...common,
        requestTypeRef: "Admin",
        activeStructuredAnswers: {
          "admin.supportType": "fit_note",
          "admin.deadlineKnown": "deadline_known",
        },
        authoredNarrativeText: "I need a fit note by tomorrow for a clinical absence.",
        summaryFragments: ["Fit note", "Deadline known"],
        requestShape: {
          admin: {
            supportTypeCode: "fit_note",
            deadlineKnown: "deadline_known",
          },
        },
      });
    case "CASE_150_RESULTS_UNCLEAR":
      return buildEvidenceCut({
        ...common,
        requestTypeRef: "Results",
        activeStructuredAnswers: {
          "results.context": "blood_test",
          "results.question": "What does it mean and what next?",
          "results.dateKnown": "unknown",
        },
        authoredNarrativeText: "I do not understand what the result means.",
        summaryFragments: ["Results follow-up"],
        requestShape: {
          results: {
            contextCode: "blood_test",
            questionText: "What does it mean and what next?",
          },
        },
      });
    case "CASE_150_CLEAR_ROUTINE":
      return buildEvidenceCut({
        ...common,
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
          "symptoms.narrative": "Mild query with no concerning symptoms.",
        },
        authoredNarrativeText: "Mild query with no concerning symptoms.",
        summaryFragments: ["General symptoms"],
        requestShape: {
          symptoms: {
            symptomCategoryCode: "general",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-14",
            worseningNow: false,
          },
        },
      });
    case "CASE_150_CONTACT_TRUST_GAP":
      return buildEvidenceCut({
        ...common,
        contactAuthorityState: "blocked",
        contactPreferencesRef: null,
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-04-14",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": [],
        },
        authoredNarrativeText: "General symptoms but the safe callback route is blocked.",
        summaryFragments: ["Contact safety gap"],
        requestShape: {
          symptoms: {
            symptomCategoryCode: "general",
            onsetPrecision: "exact_date",
            onsetDate: "2026-04-14",
            worseningNow: false,
          },
        },
      });
    default:
      throw new Error(`No challenge evidence cut fixture for ${caseId}.`);
  }
}

describe("synchronous safety engine", () => {
  it("fires hard-stop rules before any softer score and requests urgent diversion", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);

    const result = await services.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_150_001",
      requestId: "request_150_001",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T22:03:00Z",
      evidenceCut: buildEvidenceCut({
        activeStructuredAnswers: {
          "symptoms.category": "chest_breathing",
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

    expect(result.safetyDecision.requestedSafetyState).toBe("urgent_diversion_required");
    expect(result.safetyDecision.decisionOutcome).toBe("urgent_required");
    expect(result.diagnostics.hardStopRuleRefs).toContain("RF142_HS_ACUTE_CHEST_BREATHING");
    expect(result.preemption.status).toBe("escalated_urgent");
  });

  it("retains residual review when persistent symptoms exceed the residual boundary", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);

    const result = await services.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_150_002",
      requestId: "request_150_002",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T22:04:00Z",
      evidenceCut: buildEvidenceCut({
        requestId: "request_150_002",
        submissionSnapshotFreezeRef: "freeze_150_002",
        evidenceSnapshotRef: "snapshot_150_002",
        normalizedSubmissionRef: "normalized_150_002",
        activeStructuredAnswers: {
          "symptoms.category": "general",
          "symptoms.onsetPrecision": "exact_date",
          "symptoms.onsetDate": "2026-03-30",
          "symptoms.worseningNow": false,
          "symptoms.severityClues": ["sleep_affected", "work_or_school_affected"],
          "symptoms.narrative": "This has been going on for over two weeks and is affecting sleep.",
        },
        authoredNarrativeText:
          "This has been going on for over two weeks and is affecting sleep.",
        summaryFragments: ["Persistent symptoms", "Sleep affected"],
        requestShape: {
          symptoms: {
            symptomCategoryCode: "general",
            onsetPrecision: "exact_date",
            onsetDate: "2026-03-30",
            worseningNow: false,
          },
        },
      }),
    });

    expect(result.safetyDecision.requestedSafetyState).toBe("residual_risk_flagged");
    expect(result.safetyDecision.decisionOutcome).toBe("residual_review");
    expect(result.diagnostics.residualContributorRuleRefs).toContain(
      "RF142_RC_MODERATE_PERSISTENT_SYMPTOMS",
    );
    expect(result.preemption.status).toBe("cleared_routine");
  });

  it("fails closed when the canonical evidence cut is not trustworthy", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);

    const result = await services.synchronousSafety.evaluateFrozenSubmission({
      episodeId: "episode_150_003",
      requestId: "request_150_003",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T22:05:00Z",
      evidenceCut: buildEvidenceCut({
        requestId: "request_150_003",
        submissionSnapshotFreezeRef: "freeze_150_003",
        evidenceSnapshotRef: "snapshot_150_003",
        normalizedSubmissionRef: "normalized_150_003",
        evidenceReadinessState: "manual_review_only",
        contactAuthorityState: "blocked",
        contactPreferencesRef: null,
        activeStructuredAnswers: {
          "symptoms.category": "general",
        },
        requestShape: {},
        authoredNarrativeText: null,
        summaryFragments: [],
      }),
    });

    expect(result.classification.misclassificationRiskState).toBe("fail_closed_review");
    expect(result.safetyDecision.decisionOutcome).toBe("fallback_manual_review");
    expect(result.safetyDecision.requestedSafetyState).toBe("residual_risk_flagged");
    expect(result.preemption.status).toBe("blocked_manual_review");
    expect(result.diagnostics.reasonCodes).toContain(
      "PHASE1_SYNC_SAFETY_FAIL_CLOSED_MANUAL_REVIEW",
    );
  });

  it("replays the same immutable chain for the same frozen snapshot and rule-pack version", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);
    const input = {
      episodeId: "episode_150_004",
      requestId: "request_150_004",
      currentSafetyDecisionEpoch: 0,
      decidedAt: "2026-04-14T22:06:00Z",
      evidenceCut: buildEvidenceCut({
        requestId: "request_150_004",
        submissionSnapshotFreezeRef: "freeze_150_004",
        evidenceSnapshotRef: "snapshot_150_004",
        normalizedSubmissionRef: "normalized_150_004",
      }),
      preferredRulePackVersionRef: phase1SynchronousSafetyRulePackRegistry[0].rulePackVersionRef,
    } as const;

    const first = await services.synchronousSafety.evaluateFrozenSubmission(input);
    const replay = await services.synchronousSafety.evaluateFrozenSubmission(input);

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.safetyDecision.safetyDecisionId).toBe(first.safetyDecision.safetyDecisionId);
    expect(replay.classification.classificationDecisionId).toBe(
      first.classification.classificationDecisionId,
    );
    expect(
      await repositories.listSafetyDecisionRecordsByRequest("request_150_004"),
    ).toHaveLength(1);
  });

  it("replays an existing frozen snapshot even when the caller omits the current epoch", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);
    const input = {
      episodeId: "episode_150_005",
      requestId: "request_150_005",
      decidedAt: "2026-04-14T22:07:00Z",
      evidenceCut: buildEvidenceCut({
        requestId: "request_150_005",
        submissionSnapshotFreezeRef: "freeze_150_005",
        evidenceSnapshotRef: "snapshot_150_005",
        normalizedSubmissionRef: "normalized_150_005",
      }),
    } as const;

    const first = await services.synchronousSafety.evaluateFrozenSubmission(input);
    const replay = await services.synchronousSafety.evaluateFrozenSubmission(input);

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.safetyDecision.safetyDecisionId).toBe(first.safetyDecision.safetyDecisionId);
    expect(
      await repositories.listSafetyDecisionRecordsByRequest("request_150_005"),
    ).toHaveLength(1);
  });

  it("rejects unknown rule-pack versions instead of silently falling back", async () => {
    const repositories = createSynchronousSafetyStore();
    const services = createSynchronousSafetyServices(repositories);

    await expect(
      services.synchronousSafety.evaluateFrozenSubmission({
        episodeId: "episode_150_006",
        requestId: "request_150_006",
        decidedAt: "2026-04-14T22:08:00Z",
        evidenceCut: buildEvidenceCut({
          requestId: "request_150_006",
          submissionSnapshotFreezeRef: "freeze_150_006",
          evidenceSnapshotRef: "snapshot_150_006",
          normalizedSubmissionRef: "normalized_150_006",
        }),
        preferredRulePackVersionRef: "RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1@missing",
      }),
    ).rejects.toThrow("Unsupported synchronous safety rule pack");
  });

  it.each(challengeCases)(
    "matches the authored challenge corpus for $caseId",
    async (challengeCase) => {
      const repositories = createSynchronousSafetyStore();
      const services = createSynchronousSafetyServices(repositories);
      const evidenceCut = buildChallengeEvidenceCut(challengeCase.caseId);

      const result = await services.synchronousSafety.evaluateFrozenSubmission({
        episodeId: `episode_${challengeCase.caseId.toLowerCase()}`,
        requestId: evidenceCut.requestId,
        decidedAt: evidenceCut.frozenAt,
        evidenceCut,
      });

      expect(result.safetyDecision.decisionOutcome).toBe(
        challengeCase.expectedDecisionOutcome,
      );
      expect(result.safetyDecision.requestedSafetyState).toBe(
        challengeCase.expectedRequestedSafetyState,
      );
      for (const expectedRuleRef of challengeCase.expectedRuleRefs) {
        expect(result.diagnostics.firedRuleRefs).toContain(expectedRuleRef);
      }
    },
  );
});
