import { describe, expect, it } from "vitest";
import {
  createPhoneFollowupResafetyApplication,
  phoneFollowupContinuityWitnessCatalog,
  phoneFollowupGapResolutions,
  phoneFollowupMigrationPlanRefs,
  phoneFollowupPersistenceTables,
  phoneFollowupReasonCatalog,
} from "../src/phone-followup-resafety.ts";

const observedAt = "2026-04-15T18:00:00.000Z";

function continuityWitness(overrides = {}) {
  return {
    witnessClass: "telephony_lineage_authority",
    witnessRef: "followup_witness_194",
    requestId: "request_194",
    episodeId: "episode_194",
    requestLineageRef: "request_lineage_194",
    sourceLineageRef: "call_lineage_194",
    telephonyLineageRef: "call_lineage_194",
    authoritativeRequestContextRef: "convergence_outcome_193_request_context",
    routeFenceCurrent: true,
    subjectFenceCurrent: true,
    releaseFenceCurrent: true,
    verifiedAt: observedAt,
    verifiedByRef: "PhoneFollowupResafetyService",
    ...overrides,
  };
}

function baseCommand(overrides = {}) {
  return {
    commandId: overrides.commandId ?? "cmd_followup_194",
    idempotencyKey: overrides.idempotencyKey ?? "idem_followup_194",
    tenantId: "tenant_194",
    requestId: "request_194",
    episodeId: "episode_194",
    requestLineageRef: "request_lineage_194",
    requestTypeRef: "Symptoms",
    sourceLineageRef: "call_lineage_194",
    followupChannel: "post_submit_phone_call",
    evidenceKind: "transcript",
    evidenceRefs: overrides.evidenceRefs ?? ["followup_transcript_docref_194"],
    transcriptRefs: overrides.transcriptRefs ?? ["followup_transcript_docref_194"],
    audioRefs: overrides.audioRefs ?? ["followup_audio_docref_194"],
    attachmentRefs: overrides.attachmentRefs ?? [],
    narrative: overrides.narrative ?? "I need to add that the cough is worse today.",
    structuredFacts: overrides.structuredFacts ?? { "symptoms.worseningNow": true },
    evidenceQuality: overrides.evidenceQuality ?? "accepted",
    sourceTimestamp: observedAt,
    receivedAt: observedAt,
    provenance: {
      callSessionRef: "call_session_194",
      convergenceOutcomeRef: "convergence_outcome_193",
      ...(overrides.provenance ?? {}),
    },
    duplicateProbe: overrides.duplicateProbe ?? {
      relationClass: "same_request_attach",
      candidateRequestRef: "request_194",
      candidateEpisodeRef: "episode_194",
      candidateRequestLineageRef: "request_lineage_194",
      noMaterialDivergence: true,
      calibratedForLateEvidence: true,
    },
    continuityWitness: Object.prototype.hasOwnProperty.call(overrides, "continuityWitness")
      ? overrides.continuityWitness
      : continuityWitness(),
    materialSignals: overrides.materialSignals ?? {
      clinicalMeaningChanged: true,
      symptomWorsened: true,
    },
    currentSafetyDecisionEpoch: overrides.currentSafetyDecisionEpoch ?? 3,
    observedAt,
    ...overrides,
  };
}

describe("PhoneFollowupResafetyService", () => {
  it("collapses exact replay without a second preemption or receipt", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const first = await app.service.ingestFollowupEvidence(
      baseCommand({
        materialSignals: { clinicalMeaningChanged: true, urgentRedFlag: true },
      }),
    );
    const replay = await app.service.ingestFollowupEvidence(
      baseCommand({
        materialSignals: { clinicalMeaningChanged: true, urgentRedFlag: true },
      }),
    );
    const preemptions =
      await app.assimilationRepositories.listSafetyPreemptionRecordsByRequest("request_194");

    expect(app.persistenceTables).toEqual(phoneFollowupPersistenceTables);
    expect(app.migrationPlanRefs).toEqual(phoneFollowupMigrationPlanRefs);
    expect(app.gapResolutions).toEqual(phoneFollowupGapResolutions);
    expect(app.continuityWitnessCatalog).toEqual(phoneFollowupContinuityWitnessCatalog);
    expect(app.reasonCatalog).toEqual(phoneFollowupReasonCatalog);
    expect(first.sideEffects.createdSafetyPreemption).toBe(true);
    expect(first.sideEffects.createdReceipt).toBe(false);
    expect(replay.replayClassification).toBe("exact_replay");
    expect(replay.sideEffects.createdSafetyPreemption).toBe(false);
    expect(replay.sideEffects.createdReceipt).toBe(false);
    expect(preemptions).toHaveLength(1);
  });

  it("returns the settled assimilation chain for semantic replay", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const first = await app.service.ingestFollowupEvidence(baseCommand());
    const replay = await app.service.ingestFollowupEvidence(
      baseCommand({
        commandId: "cmd_followup_194_semantic_replay",
        idempotencyKey: "idem_followup_194_semantic_replay",
      }),
    );
    const records =
      await app.assimilationRepositories.listEvidenceAssimilationRecordsByRequest("request_194");

    expect(replay.replayClassification).toBe("semantic_replay");
    expect(replay.assimilationChain.assimilationRecord.evidenceAssimilationId).toBe(
      first.assimilationChain.assimilationRecord.evidenceAssimilationId,
    );
    expect(replay.assimilationChain.replayDisposition).toBe("semantic_replay");
    expect(records).toHaveLength(1);
  });

  it("attaches a duplicate attachment to the same request only with a continuity witness", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const outcome = await app.service.ingestFollowupEvidence(
      baseCommand({
        commandId: "cmd_followup_194_duplicate_attachment",
        idempotencyKey: "idem_followup_194_duplicate_attachment",
        followupChannel: "duplicate_attachment",
        evidenceKind: "attachment",
        evidenceRefs: ["duplicate_attachment_docref_194"],
        transcriptRefs: [],
        audioRefs: [],
        attachmentRefs: ["duplicate_attachment_docref_194"],
        narrative: "",
        structuredFacts: {},
        duplicateProbe: {
          relationClass: "duplicate_attachment",
          candidateRequestRef: "request_194",
          candidateEpisodeRef: "episode_194",
          candidateRequestLineageRef: "request_lineage_194",
          noMaterialDivergence: true,
          calibratedForLateEvidence: true,
        },
        materialSignals: { technicalOnly: true },
      }),
    );

    expect(outcome.duplicateEvaluation.decisionClass).toBe("same_request_attach");
    expect(outcome.assimilationChain.materialDelta.triggerDecision).toBe("no_re_safety");
    expect(outcome.sideEffects.createdReceipt).toBe(false);
    expect(outcome.reasonCodes).toContain("PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_ACCEPTED");
  });

  it("routes a same-episode candidate without witness to review rather than same-request attach", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const outcome = await app.service.ingestFollowupEvidence(
      baseCommand({
        commandId: "cmd_followup_194_missing_witness",
        idempotencyKey: "idem_followup_194_missing_witness",
        continuityWitness: null,
        duplicateProbe: {
          relationClass: "same_episode_candidate",
          candidateRequestRef: "request_194",
          candidateEpisodeRef: "episode_194",
          candidateRequestLineageRef: "request_lineage_194",
          scoreOnly: true,
        },
        materialSignals: { technicalOnly: true },
      }),
    );

    expect(outcome.duplicateEvaluation.decisionClass).toBe("review_required");
    expect(outcome.projectionHold.holdState).toBe("review_pending");
    expect(outcome.projectionHold.patientVisibleCalmStatusAllowed).toBe(false);
    expect(outcome.reasonCodes).toContain(
      "PHONE_FOLLOWUP_194_CONTINUITY_WITNESS_MISSING_OR_DRIFTED",
    );
  });

  it("fails closed when a late transcript is degraded after attachment", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const outcome = await app.service.ingestFollowupEvidence(
      baseCommand({
        commandId: "cmd_followup_194_degraded",
        idempotencyKey: "idem_followup_194_degraded",
        evidenceQuality: "degraded",
        materialSignals: {
          degradedTranscript: true,
          transcriptContradictory: true,
        },
      }),
    );

    expect(outcome.assimilationChain.classification.misclassificationRiskState).toBe(
      "fail_closed_review",
    );
    expect(outcome.assimilationChain.assimilationRecord.assimilationState).toBe(
      "blocked_manual_review",
    );
    expect(outcome.projectionHold.holdState).toBe("blocked_by_degraded_followup_evidence");
    expect(outcome.reasonCodes).toContain("PHONE_FOLLOWUP_194_DEGRADED_TRANSCRIPT_FAIL_CLOSED");
  });

  it("opens re-safety from safety-material late detail and freezes projections", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const outcome = await app.service.ingestFollowupEvidence(
      baseCommand({
        commandId: "cmd_followup_194_resafety",
        idempotencyKey: "idem_followup_194_resafety",
        materialSignals: {
          clinicalMeaningChanged: true,
          symptomWorsened: true,
          chronologyChanged: true,
        },
      }),
    );

    expect(outcome.assimilationChain.materialDelta.triggerDecision).toBe("re_safety_required");
    expect(outcome.assimilationChain.preemption).toBeTruthy();
    expect(outcome.projectionHold.holdState).toBe("detail_received_being_checked");
    expect(outcome.projectionHold.staleRoutineProjectionSuppressed).toBe(true);
    expect(outcome.projectionHold.patientVisibleCalmStatusAllowed).toBe(false);
  });

  it("opens urgent review and never exposes stale calm status during reassessment", async () => {
    const app = createPhoneFollowupResafetyApplication();
    const outcome = await app.service.ingestFollowupEvidence(
      baseCommand({
        commandId: "cmd_followup_194_urgent",
        idempotencyKey: "idem_followup_194_urgent",
        materialSignals: {
          clinicalMeaningChanged: true,
          urgentRedFlag: true,
          respiratoryDistress: true,
        },
      }),
    );

    expect(outcome.assimilationChain.safetyDecision?.requestedSafetyState).toBe(
      "urgent_diversion_required",
    );
    expect(outcome.projectionHold.holdState).toBe("urgent_review_opened");
    expect(outcome.projectionHold.patientVisibleCalmStatusAllowed).toBe(false);
    expect(outcome.reasonCodes).toContain("PHONE_FOLLOWUP_194_NO_STALE_CALM_STATUS");
  });
});
