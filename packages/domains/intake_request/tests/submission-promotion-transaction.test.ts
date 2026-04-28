import { describe, expect, it } from "vitest";
import {
  IntakeSubmitSettlementDocument,
  SubmissionSnapshotFreezeDocument,
  SubmitNormalizationSeedDocument,
  buildSubmitNormalizationSeedDigest,
  buildSubmitReplaySemanticFingerprint,
  createSubmissionPromotionTransactionStore,
} from "../src/submission-promotion-transaction";

describe("submission promotion transaction records", () => {
  it("stores one append-only freeze, normalization seed, and authoritative submit settlement per lineage", async () => {
    const repositories = createSubmissionPromotionTransactionStore();

    const freeze = SubmissionSnapshotFreezeDocument.create({
      freezeSchemaVersion: "PHASE1_SUBMISSION_SNAPSHOT_FREEZE_V1",
      submissionSnapshotFreezeId: repositories.nextGeneratedId("freeze"),
      envelopeRef: "submissionEnvelope_148_001",
      draftPublicId: "draft_148_001",
      sourceLineageRef: "submissionEnvelope_148_001",
      draftVersion: 4,
      requestType: "Symptoms",
      intakeExperienceBundleRef: "IEB_140_BROWSER_STANDARD_V1",
      validationVerdictHash: "validation_hash_148_001",
      activeQuestionKeys: ["symptoms.category", "symptoms.narrative"],
      activeStructuredAnswers: {
        "symptoms.category": "general",
      },
      freeTextNarrative: "Need help with a continuing problem.",
      attachmentRefs: ["att_148_001"],
      contactPreferencesRef: "contact_pref_148_001",
      contactPreferenceFreezeRef: "contact_freeze_148_001",
      routeFamilyRef: "rf_intake_self_service",
      routeIntentBindingRef: "RIB_148_SUBMIT_V1",
      audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
      releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
      channelReleaseFreezeState: "monitoring",
      manifestVersionRef: "manifest_phase1_browser_v1",
      sessionEpochRef: "session_epoch_browser_v1",
      surfaceChannelProfile: "browser",
      ingressChannel: "self_service_form",
      intakeConvergenceContractRef: "ICC_139_PHASE1_BROWSER_V1",
      sourceHash: "source_hash_148_001",
      semanticHash: "semantic_hash_148_001",
      normalizedCandidateHash: "normalized_hash_148_001",
      evidenceCaptureBundleRef: "capture_bundle_148_001",
      frozenAt: "2026-04-14T21:00:00Z",
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
    });

    const seedPayload = {
      requestType: "Symptoms",
      symptoms: {
        symptomCategoryCode: "general",
      },
    };
    const normalizationSeed = SubmitNormalizationSeedDocument.create({
      seedSchemaVersion: "PHASE1_SUBMIT_NORMALIZATION_SEED_V1",
      submitNormalizationSeedId: repositories.nextGeneratedId("seed"),
      submissionSnapshotFreezeRef: freeze.submissionSnapshotFreezeId,
      envelopeRef: "submissionEnvelope_148_001",
      sourceLineageRef: "submissionEnvelope_148_001",
      evidenceCaptureBundleRef: "capture_bundle_148_001",
      requestType: "Symptoms",
      intakeExperienceBundleRef: "IEB_140_BROWSER_STANDARD_V1",
      normalizationVersionRef: "PHASE1_SUBMIT_PROMOTION_SEED_NORMALIZATION_V1",
      normalizedHash: buildSubmitNormalizationSeedDigest(seedPayload),
      dedupeFingerprint: buildSubmitReplaySemanticFingerprint({
        sourceLineageRef: "submissionEnvelope_148_001",
        requestType: "Symptoms",
        normalizedPayload: seedPayload,
        attachmentRefs: ["att_148_001"],
        contactPreferencesRef: "contact_pref_148_001",
      }),
      futureContractGapRefs: ["GAP_RESOLVED_NORMALIZED_SUBMISSION_SEED_BRIDGE_V1"],
      normalizedPayload: seedPayload,
      createdAt: "2026-04-14T21:00:01Z",
    });

    const settlement = IntakeSubmitSettlementDocument.create({
      settlementSchemaVersion: "INTAKE_SUBMIT_SETTLEMENT_V1",
      intakeSubmitSettlementId: repositories.nextGeneratedId("settlement"),
      decisionClass: "new_lineage",
      settlementState: "request_submitted",
      envelopeRef: "submissionEnvelope_148_001",
      draftPublicId: "draft_148_001",
      sourceLineageRef: "submissionEnvelope_148_001",
      requestRef: "request_148_001",
      requestLineageRef: "request_lineage_148_001",
      promotionRecordRef: "promotion_record_148_001",
      submissionSnapshotFreezeRef: freeze.submissionSnapshotFreezeId,
      evidenceCaptureBundleRef: "capture_bundle_148_001",
      evidenceSnapshotRef: "evidence_snapshot_148_001",
      normalizedSubmissionRef: normalizationSeed.submitNormalizationSeedId,
      collisionReviewRef: null,
      commandActionRecordRef: "action_148_001",
      commandSettlementRecordRef: "settlement_record_148_001",
      routeIntentBindingRef: "RIB_148_SUBMIT_V1",
      receiptConsistencyKey: "receipt_key_148_001",
      statusConsistencyKey: "status_key_148_001",
      reasonCodes: ["GAP_RESOLVED_SUBMISSION_PROMOTION_TRANSACTION_V1"],
      gapRefs: ["GAP_RESOLVED_NORMALIZED_SUBMISSION_SEED_BRIDGE_V1"],
      recordedAt: "2026-04-14T21:00:02Z",
    });

    await repositories.saveSubmissionSnapshotFreeze(freeze);
    await repositories.saveSubmitNormalizationSeed(normalizationSeed);
    await repositories.saveIntakeSubmitSettlement(settlement);

    const persistedFreeze = await repositories.findSubmissionSnapshotFreezeByEnvelope(
      "submissionEnvelope_148_001",
    );
    const persistedSettlement = await repositories.findLatestIntakeSubmitSettlementByEnvelope(
      "submissionEnvelope_148_001",
    );

    expect(persistedFreeze?.submissionSnapshotFreezeId).toBe(freeze.submissionSnapshotFreezeId);
    expect(persistedSettlement?.intakeSubmitSettlementId).toBe(
      settlement.intakeSubmitSettlementId,
    );
    expect((await repositories.listSubmissionSnapshotFreezes())).toHaveLength(1);
    expect((await repositories.listSubmitNormalizationSeeds())).toHaveLength(1);
    expect((await repositories.listIntakeSubmitSettlements())).toHaveLength(1);
  });

  it("fails closed on append-only rewrites and keeps replay digests stable", async () => {
    const repositories = createSubmissionPromotionTransactionStore();
    const freeze = SubmissionSnapshotFreezeDocument.create({
      freezeSchemaVersion: "PHASE1_SUBMISSION_SNAPSHOT_FREEZE_V1",
      submissionSnapshotFreezeId: repositories.nextGeneratedId("freeze"),
      envelopeRef: "submissionEnvelope_148_rewrite",
      draftPublicId: "draft_148_rewrite",
      sourceLineageRef: "submissionEnvelope_148_rewrite",
      draftVersion: 1,
      requestType: "Symptoms",
      intakeExperienceBundleRef: "IEB_140_BROWSER_STANDARD_V1",
      validationVerdictHash: "validation_hash_148_rewrite",
      activeQuestionKeys: ["symptoms.category"],
      activeStructuredAnswers: {
        "symptoms.category": "general",
      },
      freeTextNarrative: "One narrative.",
      attachmentRefs: [],
      contactPreferencesRef: null,
      contactPreferenceFreezeRef: null,
      routeFamilyRef: "rf_intake_self_service",
      routeIntentBindingRef: "RIB_148_REWRITE_V1",
      audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
      releaseApprovalFreezeRef: "release_freeze_phase1_self_service_v1",
      channelReleaseFreezeState: "released",
      manifestVersionRef: "manifest_phase1_browser_v1",
      sessionEpochRef: null,
      surfaceChannelProfile: "browser",
      ingressChannel: "self_service_form",
      intakeConvergenceContractRef: "ICC_139_PHASE1_BROWSER_V1",
      sourceHash: "source_hash_148_rewrite",
      semanticHash: "semantic_hash_148_rewrite",
      normalizedCandidateHash: "normalized_hash_148_rewrite",
      evidenceCaptureBundleRef: "capture_bundle_148_rewrite",
      frozenAt: "2026-04-14T21:05:00Z",
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
    });

    await repositories.saveSubmissionSnapshotFreeze(freeze);

    const payloadLeft = {
      symptoms: {
        onsetDate: "2026-04-10",
        onsetPrecision: "exact_date",
      },
      requestType: "Symptoms",
    };
    const payloadRight = {
      requestType: "Symptoms",
      symptoms: {
        onsetPrecision: "exact_date",
        onsetDate: "2026-04-10",
      },
    };

    expect(buildSubmitNormalizationSeedDigest(payloadLeft)).toBe(
      buildSubmitNormalizationSeedDigest(payloadRight),
    );
    expect(
      buildSubmitReplaySemanticFingerprint({
        sourceLineageRef: "submissionEnvelope_148_rewrite",
        requestType: "Symptoms",
        normalizedPayload: payloadLeft,
        attachmentRefs: ["att_b", "att_a", "att_a"],
        contactPreferencesRef: "contact_pref_148_rewrite",
      }),
    ).toBe(
      buildSubmitReplaySemanticFingerprint({
        sourceLineageRef: "submissionEnvelope_148_rewrite",
        requestType: "Symptoms",
        normalizedPayload: payloadRight,
        attachmentRefs: ["att_a", "att_b"],
        contactPreferencesRef: "contact_pref_148_rewrite",
      }),
    );

    await expect(
      repositories.saveSubmissionSnapshotFreeze(freeze),
    ).rejects.toMatchObject({
      code: "IMMUTABLE_SUBMISSIONSNAPSHOTFREEZE_REWRITE_FORBIDDEN",
    });
  });
});
