import { describe, expect, it } from "vitest";
import {
  createTelephonyConvergenceApplication,
  telephonyConvergenceGapResolutions,
  telephonyConvergenceMigrationPlanRefs,
  telephonyConvergencePersistenceTables,
  telephonyConvergenceReasonCatalog,
} from "../src/telephony-convergence-pipeline.ts";

const observedAt = "2026-04-15T17:00:00.000Z";

function readiness(overrides = {}) {
  return {
    telephonyEvidenceReadinessAssessmentRef:
      overrides.telephonyEvidenceReadinessAssessmentRef ?? "tel_era_193_ready",
    schemaVersion: "191.phase2.telephony-readiness.v1",
    policyVersion: "phase2-evidence-readiness-191.v1",
    callSessionRef: overrides.callSessionRef ?? "call_session_193",
    submissionEnvelopeRef: overrides.submissionEnvelopeRef ?? "submission_envelope_193",
    urgentLiveAssessmentRef: null,
    transcriptReadinessRef: "tel_trr_193_ready",
    structuredCaptureRefs: ["structured_capture_193"],
    identityEvidenceRefs: ["identity_evidence_193"],
    contactRouteEvidenceRefs: ["contact_route_193"],
    manualReviewDispositionRef: null,
    continuationEligibilityRef: null,
    usabilityState: overrides.usabilityState ?? "safety_usable",
    promotionReadiness: overrides.promotionReadiness ?? "ready_to_promote",
    governingInputRefs: ["tel_trr_193_ready"],
    supersedesEvidenceReadinessAssessmentRef: null,
    reasonCodes: ["TEL_READY_191_SAFETY_USABLE_READY_TO_PROMOTE"],
    assessedAt: observedAt,
    recordedBy: "TelephonyReadinessPipeline",
    ...overrides,
  };
}

function identity(overrides = {}) {
  return {
    bindingState: "verified",
    subjectRefPresence: "bound",
    claimResumeState: "not_required",
    actorBindingState: "verified",
    identityEvidenceRefs: ["identity_evidence_193"],
    contactRouteEvidenceRefs: ["contact_route_193"],
    authorityBindingRef: "identity_binding_193",
    ...overrides,
  };
}

function capability(overrides = {}) {
  return {
    canUploadFiles: true,
    canRenderTrackStatus: true,
    canRenderEmbedded: false,
    mutatingResumeState: "allowed",
    maxDisclosurePosture: "full_self_service",
    ...overrides,
  };
}

function symptomAnswers(overrides = {}) {
  return {
    "symptoms.category": "cough_or_breathing",
    "symptoms.onsetPrecision": "exact_date",
    "symptoms.onsetDate": "2026-04-14",
    "symptoms.worseningNow": false,
    "symptoms.severityClues": ["fever"],
    "symptoms.narrative": "Cough and fever for two days.",
    ...overrides,
  };
}

function baseCommand(overrides = {}) {
  const ingressChannel = overrides.ingressChannel ?? "telephony_capture";
  return {
    commandId: overrides.commandId ?? `cmd_193_${ingressChannel}`,
    idempotencyKey: overrides.idempotencyKey ?? `idem_193_${ingressChannel}`,
    tenantId: "tenant_193",
    sourceLineageRef: overrides.sourceLineageRef ?? `source_lineage_193_${ingressChannel}`,
    ingressChannel,
    requestType: "Symptoms",
    narratives: overrides.narratives ?? {
      spoken: "Cough and fever for two days.",
      transcript: "Cough and fever for two days.",
      continuation: "Cough and fever for two days.",
      web: "Cough and fever for two days.",
      support: "Cough and fever for two days.",
    },
    structuredAnswers: overrides.structuredAnswers ?? {
      keypad: symptomAnswers({ "symptoms.severityClues": ["fever"] }),
      transcript: symptomAnswers(),
      continuation: symptomAnswers(),
      web: symptomAnswers(),
      support: symptomAnswers(),
    },
    channelMetadata: {
      callSessionRef: "call_session_193",
      providerEventRef: "provider_event_193",
      ...(overrides.channelMetadata ?? {}),
    },
    identityContext: overrides.identityContext ?? identity(),
    attachmentRefs: overrides.attachmentRefs ?? ["attachment_docref_193"],
    audioRefs: overrides.audioRefs ?? ["audio_docref_193"],
    contactPreferencesRef: overrides.contactPreferencesRef ?? "contact_pref_193",
    sourceTimestamp: overrides.sourceTimestamp ?? observedAt,
    patientMatchConfidenceRef: overrides.patientMatchConfidenceRef ?? "patient_match_193",
    evidenceReadinessAssessment: Object.prototype.hasOwnProperty.call(
      overrides,
      "evidenceReadinessAssessment",
    )
      ? overrides.evidenceReadinessAssessment
      : readiness(),
    evidenceReadinessState: overrides.evidenceReadinessState,
    channelCapabilityCeiling: overrides.channelCapabilityCeiling ?? capability(),
    contactAuthorityClass: overrides.contactAuthorityClass ?? "authority_confirmed",
    routeFamilyRef: "rf_intake_convergence_193",
    routeIntentBindingRef: "rib_193",
    audienceSurfaceRuntimeBindingRef: "asrb_193",
    releaseApprovalFreezeRef: "release_freeze_193",
    manifestVersionRef: "manifest_193",
    sessionEpochRef: "session_epoch_193",
    receiptSeedRef: overrides.receiptSeedRef ?? "receipt_seed_193",
    duplicateProbe: overrides.duplicateProbe ?? null,
    observedAt: overrides.observedAt ?? observedAt,
    ...overrides,
  };
}

describe("TelephonyConvergencePipeline", () => {
  it("collapses exact replay without creating another capture, promotion, or receipt", async () => {
    const app = createTelephonyConvergenceApplication();
    const first = await app.service.submitConvergenceCommand(baseCommand());
    const replay = await app.service.submitConvergenceCommand(baseCommand());
    const snapshots = app.repository.snapshots();

    expect(app.persistenceTables).toEqual(telephonyConvergencePersistenceTables);
    expect(app.migrationPlanRefs).toEqual(telephonyConvergenceMigrationPlanRefs);
    expect(app.gapResolutions).toEqual(telephonyConvergenceGapResolutions);
    expect(app.reasonCatalog).toEqual(telephonyConvergenceReasonCatalog);
    expect(first.promotionRecord?.requestRef).toBeTruthy();
    expect(replay.replayClassification).toBe("exact_replay");
    expect(replay.sideEffects.createdPromotion).toBe(false);
    expect(replay.sideEffects.createdReceipt).toBe(false);
    expect(snapshots.captureBundles).toHaveLength(1);
    expect(snapshots.receiptStatusProjections.filter((row) => row.receiptIssued)).toHaveLength(1);
  });

  it("freezes collision review from the changed idempotency payload and blocks ordinary promotion", async () => {
    const app = createTelephonyConvergenceApplication();
    await app.service.submitConvergenceCommand(baseCommand());

    const collision = await app.service.submitConvergenceCommand(
      baseCommand({
        narratives: {
          spoken: "New conflicting headache report.",
          transcript: "New conflicting headache report.",
        },
      }),
    );
    const snapshots = app.repository.snapshots();

    expect(collision.replayClassification).toBe("collision_review");
    expect(collision.promotionReadiness).toBe("blocked_collision_review");
    expect(collision.promotionRecord).toBeNull();
    expect(collision.reasonCodes).toContain("TEL_CONV_193_COLLISION_REVIEW_FROZEN");
    expect(snapshots.captureBundles).toHaveLength(2);
    expect(snapshots.receiptStatusProjections.filter((row) => row.receiptIssued)).toHaveLength(1);
  });

  it("settles the canonical duplicate relation classes without channel-local heuristics", async () => {
    const app = createTelephonyConvergenceApplication();
    const relations = [
      ["retry", "exact_retry_collapse", "retry_collapsed"],
      ["same_episode_candidate", "review_required", "ready_to_promote"],
      ["same_episode_confirmed", "same_request_attach", "same_request_attach_no_promotion"],
      ["related_episode", "related_episode_link", "ready_to_promote"],
      ["new_episode", "separate_request", "ready_to_promote"],
    ];

    for (const [relationClass, decisionClass, readinessClass] of relations) {
      const outcome = await app.service.submitConvergenceCommand(
        baseCommand({
          commandId: `cmd_193_dup_${relationClass}`,
          idempotencyKey: `idem_193_dup_${relationClass}`,
          sourceLineageRef: `source_lineage_193_dup_${relationClass}`,
          receiptSeedRef: `receipt_seed_193_dup_${relationClass}`,
          duplicateProbe:
            relationClass === "new_episode"
              ? { relationClass }
              : {
                  relationClass,
                  candidateRequestRef: `request_193_candidate_${relationClass}`,
                  candidateEpisodeRef: `episode_193_candidate_${relationClass}`,
                  explicitContinuityWitness: relationClass === "same_episode_confirmed",
                  continuityWitnessClass: "telephony_continuation",
                  continuityWitnessRef:
                    relationClass === "same_episode_confirmed" ? "continuity_witness_193" : null,
                  noMaterialDivergence: true,
                  calibratedForChannelMix: true,
                },
        }),
      );
      expect(outcome.duplicateResolutionDecision.relationClass).toBe(relationClass);
      expect(outcome.duplicateResolutionDecision.decisionClass).toBe(decisionClass);
      expect(outcome.promotionReadiness).toBe(readinessClass);
    }
  });

  it("fails same-request attach closed without witness or channel calibration", async () => {
    const app = createTelephonyConvergenceApplication();
    const missingWitness = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_missing_witness",
        idempotencyKey: "idem_193_missing_witness",
        sourceLineageRef: "source_lineage_193_missing_witness",
        receiptSeedRef: "receipt_seed_193_missing_witness",
        duplicateProbe: {
          relationClass: "same_episode_confirmed",
          candidateRequestRef: "request_193_attach_target",
          candidateEpisodeRef: "episode_193_attach_target",
          explicitContinuityWitness: false,
          continuityWitnessRef: null,
          noMaterialDivergence: true,
          calibratedForChannelMix: true,
        },
      }),
    );
    const uncalibrated = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_uncalibrated",
        idempotencyKey: "idem_193_uncalibrated",
        sourceLineageRef: "source_lineage_193_uncalibrated",
        receiptSeedRef: "receipt_seed_193_uncalibrated",
        duplicateProbe: {
          relationClass: "same_episode_confirmed",
          candidateRequestRef: "request_193_uncalibrated_target",
          candidateEpisodeRef: "episode_193_uncalibrated_target",
          explicitContinuityWitness: true,
          continuityWitnessClass: "telephony_continuation",
          continuityWitnessRef: "continuity_witness_193_uncalibrated",
          noMaterialDivergence: true,
          calibratedForChannelMix: false,
        },
      }),
    );

    expect(missingWitness.duplicateResolutionDecision.decisionClass).toBe("same_episode_link");
    expect(missingWitness.promotionRecord).toBeTruthy();
    expect(uncalibrated.duplicateResolutionDecision.decisionClass).toBe("review_required");
    expect(uncalibrated.reasonCodes).toContain(
      "TEL_CONV_193_CROSS_CHANNEL_CALIBRATION_FAIL_CLOSED",
    );
  });

  it("keeps same facts on web, phone, and continuation on the same normalized safety and receipt grammar", async () => {
    const app = createTelephonyConvergenceApplication();
    const common = {
      receiptSeedRef: "receipt_seed_193_common_patient",
      patientMatchConfidenceRef: "patient_match_193_common",
      audioRefs: [],
      attachmentRefs: ["attachment_docref_193_common"],
      contactPreferencesRef: "contact_pref_193_common",
    };
    const web = await app.service.submitConvergenceCommand(
      baseCommand({
        ...common,
        commandId: "cmd_193_web",
        idempotencyKey: "idem_193_web",
        sourceLineageRef: "source_lineage_193_web",
        ingressChannel: "self_service_form",
        surfaceChannelProfile: "browser",
        narratives: { web: "Cough and fever for two days." },
        structuredAnswers: { web: symptomAnswers() },
        evidenceReadinessAssessment: null,
        evidenceReadinessState: "safety_usable",
        contactAuthorityClass: "self_asserted",
      }),
    );
    const phone = await app.service.submitConvergenceCommand(
      baseCommand({
        ...common,
        commandId: "cmd_193_phone",
        idempotencyKey: "idem_193_phone",
        sourceLineageRef: "source_lineage_193_phone",
        ingressChannel: "telephony_capture",
        audioRefs: [],
        narratives: { spoken: "Cough and fever for two days." },
        structuredAnswers: { keypad: symptomAnswers(), transcript: symptomAnswers() },
      }),
    );
    const continuation = await app.service.submitConvergenceCommand(
      baseCommand({
        ...common,
        commandId: "cmd_193_continuation",
        idempotencyKey: "idem_193_continuation",
        sourceLineageRef: "source_lineage_193_continuation",
        ingressChannel: "secure_link_continuation",
        audioRefs: [],
        narratives: { continuation: "Cough and fever for two days." },
        structuredAnswers: { continuation: symptomAnswers() },
        contactAuthorityClass: "verified_destination",
      }),
    );

    expect(phone.normalizedSubmission.normalizedHash).toBe(web.normalizedSubmission.normalizedHash);
    expect(continuation.normalizedSubmission.normalizedHash).toBe(
      web.normalizedSubmission.normalizedHash,
    );
    expect(phone.channelParityProjection.sameFactsSameSafetyKey).toBe(
      web.channelParityProjection.sameFactsSameSafetyKey,
    );
    expect(continuation.receiptKey.receiptConsistencyKey).toBe(
      web.receiptKey.receiptConsistencyKey,
    );
    expect(phone.receiptStatusProjection.promiseState).toBe("submitted");
    expect(continuation.receiptStatusProjection.recoveryPosture).toBe("track_status_available");
  });

  it("honours phone plus continuation field precedence without changing canonical meaning", async () => {
    const app = createTelephonyConvergenceApplication();
    const outcome = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_precedence",
        idempotencyKey: "idem_193_precedence",
        sourceLineageRef: "source_lineage_193_precedence",
        receiptSeedRef: "receipt_seed_193_precedence",
        structuredAnswers: {
          keypad: symptomAnswers({ "symptoms.worseningNow": true }),
          transcript: symptomAnswers({ "symptoms.worseningNow": true }),
          continuation: symptomAnswers({ "symptoms.worseningNow": false }),
        },
        narratives: {
          spoken: "Caller said symptoms are worse.",
          continuation: "Cough and fever for two days.",
        },
      }),
    );

    expect(outcome.captureBundle.fieldSourceManifest["symptoms.worseningNow"]).toBe("continuation");
    expect(outcome.normalizedSubmission.requestShape.symptoms.worseningNow).toBe(false);
    expect(outcome.captureBundle.narrativeSource).toBe("continuation");
  });

  it("keeps non-safety-usable telephony evidence out of routine promotion until readiness resumes", async () => {
    const app = createTelephonyConvergenceApplication();
    const pending = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_pending",
        idempotencyKey: "idem_193_pending",
        sourceLineageRef: "source_lineage_193_pending",
        receiptSeedRef: "receipt_seed_193_pending",
        evidenceReadinessAssessment: readiness({
          telephonyEvidenceReadinessAssessmentRef: "tel_era_193_pending",
          usabilityState: "awaiting_transcript",
          promotionReadiness: "blocked",
        }),
      }),
    );

    expect(pending.promotionReadiness).toBe("hold_evidence_pending");
    expect(pending.promotionRecord).toBeNull();
    expect(pending.receiptStatusProjection.receiptIssued).toBe(false);

    const resumed = await app.service.resumePausedIngress({
      resumeIdempotencyKey: "resume_193_pending",
      convergenceOutcomeRef: pending.convergenceOutcomeRef,
      evidenceReadinessAssessment: readiness({
        telephonyEvidenceReadinessAssessmentRef: "tel_era_193_resumed",
      }),
      observedAt: "2026-04-15T17:05:00.000Z",
    });

    expect(resumed.promotionReadiness).toBe("ready_to_promote");
    expect(resumed.promotionRecord?.requestRef).toBeTruthy();
    expect(resumed.reasonCodes).toContain(
      "TEL_CONV_193_LATE_READINESS_RESUMED_FROM_FROZEN_INGRESS",
    );
  });

  it("routes support-assisted capture through the same canonical ingress and promotion path", async () => {
    const app = createTelephonyConvergenceApplication();
    const support = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_support",
        idempotencyKey: "idem_193_support",
        sourceLineageRef: "source_lineage_193_support",
        receiptSeedRef: "receipt_seed_193_support",
        ingressChannel: "support_assisted_capture",
        captureAuthorityClass: "staff_transcribed",
        narratives: { support: "Cough and fever for two days." },
        structuredAnswers: { support: symptomAnswers() },
        contactAuthorityClass: "support_attested",
        channelCapabilityCeiling: capability({ maxDisclosurePosture: "support_console" }),
      }),
    );

    expect(support.ingressRecord.ingressChannel).toBe("support_assisted_capture");
    expect(support.ingressRecord.captureAuthorityClass).toBe("staff_transcribed");
    expect(support.normalizedSubmission.requestType).toBe("Symptoms");
    expect(support.promotionRecord?.requestRef).toBeTruthy();
    expect(support.reasonCodes).toContain("TEL_CONV_193_SUPPORT_ASSISTED_SHARED_PATH");
  });

  it("does not create a second receipt for same-request attach or cross-channel receipt replay", async () => {
    const app = createTelephonyConvergenceApplication();
    const attached = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_attach",
        idempotencyKey: "idem_193_attach",
        sourceLineageRef: "source_lineage_193_attach",
        receiptSeedRef: "receipt_seed_193_attach",
        duplicateProbe: {
          relationClass: "same_episode_confirmed",
          candidateRequestRef: "request_193_existing",
          candidateEpisodeRef: "episode_193_existing",
          explicitContinuityWitness: true,
          continuityWitnessClass: "telephony_continuation",
          continuityWitnessRef: "continuity_witness_193_attach",
          noMaterialDivergence: true,
          calibratedForChannelMix: true,
        },
      }),
    );
    const first = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_receipt_first",
        idempotencyKey: "idem_193_receipt_first",
        sourceLineageRef: "source_lineage_193_receipt_first",
        receiptSeedRef: "receipt_seed_193_receipt_replay",
      }),
    );
    const replayedReceipt = await app.service.submitConvergenceCommand(
      baseCommand({
        commandId: "cmd_193_receipt_second",
        idempotencyKey: "idem_193_receipt_second",
        sourceLineageRef: "source_lineage_193_receipt_second",
        receiptSeedRef: "receipt_seed_193_receipt_replay",
      }),
    );

    expect(attached.promotionReadiness).toBe("same_request_attach_no_promotion");
    expect(attached.receiptStatusProjection.receiptIssued).toBe(false);
    expect(first.receiptStatusProjection.receiptIssued).toBe(true);
    expect(replayedReceipt.receiptStatusProjection.receiptIssued).toBe(false);
    expect(replayedReceipt.sideEffects.createdReceipt).toBe(false);
  });
});
