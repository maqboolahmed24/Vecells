import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3AdviceRenderKernelService,
  createPhase3AdviceRenderKernelStore,
  type EvaluateAdviceRenderCandidateInput,
  type SettleAdviceRenderInput,
} from "../src/index.ts";

function buildEvaluationInput(
  taskId: string,
  overrides: Partial<EvaluateAdviceRenderCandidateInput> = {},
): EvaluateAdviceRenderCandidateInput {
  return {
    taskId,
    requestRef: `request_${taskId}`,
    pathwayRef: "self_serve_guidance",
    compiledPolicyBundleRef: "policy_bundle_250_v1",
    adviceEligibilityGrantRef: `advice_grant_${taskId}`,
    effectiveAdviceGrantState: "live",
    effectiveAdviceGrantReasonCodeRefs: [],
    boundaryDecisionRef: `boundary_${taskId}`,
    boundaryTupleHash: `boundary_hash_${taskId}`,
    decisionEpochRef: `decision_epoch_${taskId}`,
    decisionSupersessionRecordRef: null,
    routeIntentBindingRef: `route_intent_${taskId}`,
    surfaceRouteContractRef: `surface_route_contract_${taskId}`,
    surfacePublicationRef: `surface_publication_${taskId}`,
    runtimePublicationBundleRef: `runtime_publication_bundle_${taskId}`,
    dependencySetRef: `dependency_set_${taskId}`,
    clinicalMeaningState: "informational_only",
    operationalFollowUpScope: "self_serve_guidance",
    reopenState: "stable",
    audienceTier: "authenticated",
    channelRef: "portal_web",
    localeRef: "en-GB",
    readingLevelRef: "standard",
    accessibilityVariantRefs: ["screen_reader"],
    publicationState: "current",
    releaseTrustState: "trusted",
    releaseGateState: "open",
    channelReleaseState: "open",
    artifactPresentationContractRef: null,
    outboundNavigationGrantPolicyRef: null,
    transitionEnvelopeRef: null,
    recoveryDispositionRef: null,
    visibilityTier: "authenticated",
    summarySafetyTier: "clinical_safe_summary",
    placeholderContractRef: null,
    recoveryRouteRef: null,
    patientTimelineRef: `patient_timeline_${taskId}`,
    communicationTemplateRef: `communication_template_${taskId}`,
    controlStatusSnapshotRef: `control_status_${taskId}`,
    settledAt: "2026-04-17T11:00:00.000Z",
    ...overrides,
  };
}

function buildSettleInput(
  taskId: string,
  overrides: Partial<SettleAdviceRenderInput> = {},
): SettleAdviceRenderInput {
  return {
    ...buildEvaluationInput(taskId, overrides),
    commandActionRef: `command_action_${taskId}`,
    commandSettlementRef: `command_settlement_${taskId}`,
  };
}

async function registerRenderableBundle(
  service: ReturnType<typeof createPhase3AdviceRenderKernelService>,
  bundleId = "advice_bundle_250_v1",
) {
  const approval = await service.registerClinicalContentApprovalRecord({
    pathwayRef: "self_serve_guidance",
    adviceBundleVersionRef: bundleId,
    clinicalIntentRef: "clinical_intent_self_care",
    compiledPolicyBundleRef: "policy_bundle_250_v1",
    approvedAudienceTierRefs: ["authenticated"],
    approvedChannelRefs: ["portal_web"],
    approvedLocaleRefs: ["en-GB"],
    approvedReadingLevelRefs: ["standard"],
    approvedAccessibilityVariantRefs: ["screen_reader"],
    approvalState: "approved",
    approvedByRef: "clinical_reviewer_250",
    approvedAt: "2026-04-17T10:00:00.000Z",
    validFrom: "2026-04-17T10:00:00.000Z",
    validUntil: "2030-01-01T00:00:00.000Z",
  });
  const review = await service.registerContentReviewSchedule({
    pathwayRef: "self_serve_guidance",
    adviceBundleVersionRef: bundleId,
    reviewCadenceRef: "cadence_90d",
    reviewState: "current",
    lastReviewedAt: "2026-04-17T10:01:00.000Z",
    nextReviewDueAt: "2030-01-01T00:00:00.000Z",
    reviewOwnerRef: "clinical_reviewer_250",
  });
  const bundle = await service.registerAdviceBundleVersion({
    adviceBundleVersionId: bundleId,
    pathwayRef: "self_serve_guidance",
    compiledPolicyBundleRef: "policy_bundle_250_v1",
    clinicalIntentRef: "clinical_intent_self_care",
    audienceTierRefs: ["authenticated"],
    variantSetRef: "variant_family_250_v1",
    safetyNetInstructionSetRef: "safety_net_set_250_v1",
    effectiveFrom: "2026-04-17T10:02:00.000Z",
    effectiveTo: "2030-01-01T00:00:00.000Z",
    approvalRecordRef: approval.clinicalContentApprovalRecordId,
  });

  return { approval, review, bundle };
}

describe("phase 3 advice render kernel", () => {
  it("selects the exact approved variant and reuses an idempotent render settlement", async () => {
    const repositories = createPhase3AdviceRenderKernelStore();
    const service = createPhase3AdviceRenderKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_render_exact"),
    });
    const { bundle, approval, review } = await registerRenderableBundle(service);
    const exactVariant = await service.registerAdviceVariantSet({
      adviceBundleVersionRef: bundle.adviceBundleVersionId,
      channelRef: "portal_web",
      localeRef: "en-GB",
      readingLevelRef: "standard",
      contentBlocksRef: "content_blocks.self_care.en_gb.standard",
      previewChecksum: "checksum_exact",
      translationVersionRef: "translation_v1",
      accessibilityVariantRefs: ["screen_reader"],
      linkedArtifactContractRefs: ["artifact_presentation_contract.self_care.exact"],
    });

    const first = await service.settleAdviceRender(buildSettleInput("task_250_exact"));
    const replay = await service.settleAdviceRender({
      ...buildSettleInput("task_250_exact"),
      commandActionRef: "command_action_task_250_exact_replay",
      commandSettlementRef: "command_settlement_task_250_exact_replay",
      settledAt: "2026-04-17T11:01:00.000Z",
    });

    expect(first.selectedAdviceBundleVersion?.adviceBundleVersionId).toBe(
      bundle.adviceBundleVersionId,
    );
    expect(first.selectedApprovalRecord?.clinicalContentApprovalRecordId).toBe(
      approval.clinicalContentApprovalRecordId,
    );
    expect(first.selectedReviewSchedule?.contentReviewScheduleId).toBe(
      review.contentReviewScheduleId,
    );
    expect(first.selectedAdviceVariantSet?.adviceVariantSetId).toBe(
      exactVariant.adviceVariantSetId,
    );
    expect(first.renderSettlement.renderState).toBe("renderable");
    expect(first.renderSettlement.trustState).toBe("trusted");
    expect(first.renderSettlement.variantFallbackPathRefs).toEqual([]);
    expect(first.renderSettlement.artifactPresentationContractRef).toBe(
      "artifact_presentation_contract.self_care.exact",
    );
    expect(replay.reusedExisting).toBe(true);
    expect(replay.renderSettlement.adviceRenderSettlementId).toBe(
      first.renderSettlement.adviceRenderSettlementId,
    );
  });

  it("falls back to a governed locale-transform variant when an exact variant is unavailable", async () => {
    const repositories = createPhase3AdviceRenderKernelStore();
    const service = createPhase3AdviceRenderKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_render_fallback"),
    });
    const { bundle } = await registerRenderableBundle(service, "advice_bundle_250_fallback");
    const fallbackVariant = await service.registerAdviceVariantSet({
      adviceBundleVersionRef: bundle.adviceBundleVersionId,
      channelRef: "portal_web",
      localeRef: "en-US",
      readingLevelRef: "standard",
      contentBlocksRef: "content_blocks.self_care.fallback",
      fallbackTransformRef: "fallback_transform.locale.en_gb",
      previewChecksum: "checksum_fallback",
      translationVersionRef: "translation_v1",
      accessibilityVariantRefs: ["screen_reader"],
      linkedArtifactContractRefs: ["artifact_presentation_contract.self_care.fallback"],
    });

    const evaluation = await service.evaluateAdviceRenderCandidate(
      buildEvaluationInput("task_250_fallback"),
    );

    expect(evaluation.renderState).toBe("renderable");
    expect(evaluation.selectedAdviceVariantSet?.adviceVariantSetId).toBe(
      fallbackVariant.adviceVariantSetId,
    );
    expect(evaluation.variantFallbackPathRefs).toEqual(["fallback_locale_transform"]);
  });

  it("withholds advice when content review cadence is due and quarantines when release trust is quarantined", async () => {
    const repositories = createPhase3AdviceRenderKernelStore();
    const service = createPhase3AdviceRenderKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_render_state_gates"),
    });
    const { bundle, approval } = await registerRenderableBundle(service, "advice_bundle_250_state");
    await service.registerContentReviewSchedule({
      pathwayRef: "self_serve_guidance",
      adviceBundleVersionRef: bundle.adviceBundleVersionId,
      reviewCadenceRef: "cadence_due",
      reviewState: "current",
      lastReviewedAt: "2026-04-17T10:03:00.000Z",
      nextReviewDueAt: "2026-04-17T10:59:00.000Z",
      reviewOwnerRef: "clinical_reviewer_250",
    });
    await service.registerAdviceBundleVersion({
      adviceBundleVersionId: bundle.adviceBundleVersionId,
      pathwayRef: bundle.pathwayRef,
      compiledPolicyBundleRef: bundle.compiledPolicyBundleRef,
      clinicalIntentRef: bundle.clinicalIntentRef,
      audienceTierRefs: bundle.audienceTierRefs,
      variantSetRef: bundle.variantSetRef,
      safetyNetInstructionSetRef: bundle.safetyNetInstructionSetRef,
      effectiveFrom: bundle.effectiveFrom,
      effectiveTo: bundle.effectiveTo,
      approvalRecordRef: approval.clinicalContentApprovalRecordId,
    });
    await service.registerAdviceVariantSet({
      adviceBundleVersionRef: bundle.adviceBundleVersionId,
      channelRef: "portal_web",
      localeRef: "en-GB",
      readingLevelRef: "standard",
      contentBlocksRef: "content_blocks.self_care.review_due",
      previewChecksum: "checksum_review_due",
      translationVersionRef: "translation_v1",
      accessibilityVariantRefs: ["screen_reader"],
      linkedArtifactContractRefs: ["artifact_presentation_contract.self_care.review_due"],
    });

    const reviewDue = await service.evaluateAdviceRenderCandidate(
      buildEvaluationInput("task_250_review_due", {
        settledAt: "2026-04-17T11:00:00.000Z",
      }),
    );
    const quarantined = await service.evaluateAdviceRenderCandidate(
      buildEvaluationInput("task_250_quarantined", {
        releaseTrustState: "quarantined",
      }),
    );

    expect(reviewDue.renderState).toBe("withheld");
    expect(reviewDue.reasonCodeRefs).toContain("content_review_review_due");
    expect(quarantined.renderState).toBe("quarantined");
    expect(quarantined.trustState).toBe("quarantined");
    expect(quarantined.reasonCodeRefs).toContain("release_trust_quarantined");
  });

  it("rejects raw external artifact references in advice variants", async () => {
    const repositories = createPhase3AdviceRenderKernelStore();
    const service = createPhase3AdviceRenderKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_advice_render_artifacts"),
    });
    const { bundle } = await registerRenderableBundle(service, "advice_bundle_250_artifacts");

    await expect(
      service.registerAdviceVariantSet({
        adviceBundleVersionRef: bundle.adviceBundleVersionId,
        channelRef: "portal_web",
        localeRef: "en-GB",
        readingLevelRef: "standard",
        contentBlocksRef: "content_blocks.self_care.raw_url",
        previewChecksum: "checksum_raw_url",
        translationVersionRef: "translation_v1",
        linkedArtifactContractRefs: ["https://example.com/raw.pdf"],
      }),
    ).rejects.toThrowError(/raw external urls/i);
  });
});
