import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3SelfCareOutcomeAnalyticsKernelService,
  createPhase3SelfCareOutcomeAnalyticsKernelStore,
  type PublishPatientExpectationTemplateVersionInput,
  type RecordOutcomeAnalyticsInput,
  type ResolvePatientExpectationTemplateInput,
} from "../src/index.ts";

function buildTemplateInput(
  patientExpectationTemplateRef: string,
  overrides: Partial<PublishPatientExpectationTemplateVersionInput> = {},
): PublishPatientExpectationTemplateVersionInput {
  return {
    patientExpectationTemplateRef,
    expectationClass: "admin_waiting",
    allowedConsequenceClasses: ["admin_resolution_waiting"],
    advicePathwayRef: null,
    adminResolutionSubtypeRef: "registration_or_demographic_update",
    bindingRuleRef: "binding_rule.admin.registration.waiting",
    authoringProvenanceRef: "content_repo/admin_expectation_templates",
    approvalProvenanceRef: "clinical_content_approval/admin_expectation_templates",
    policyBundleRef: "policy_bundle_253_v1",
    publishedAt: "2026-04-17T12:00:00.000Z",
    variants: [
      {
        deliveryMode: "full",
        channelRef: "patient_portal",
        localeRef: "en-GB",
        audienceTierRefs: ["patient_authenticated"],
        releaseStateRefs: ["current"],
        visibilityTier: "patient_authenticated",
        summarySafetyTier: "clinical_safe_summary",
        renderInputRef: "render_input.admin.registration.waiting.full",
        headlineText: "We are processing your update",
        bodyText: "Your request is with the registration team.",
        nextStepText: "You do not need to send anything else right now.",
        safetyNetText: "Tell us if your contact details change again.",
        placeholderText: "We are still processing this update.",
      },
      {
        deliveryMode: "summary_safe",
        channelRef: "patient_portal",
        localeRef: "en-GB",
        audienceTierRefs: ["patient_authenticated"],
        releaseStateRefs: ["current", "degraded"],
        visibilityTier: "patient_authenticated",
        summarySafetyTier: "clinical_safe_summary",
        renderInputRef: "render_input.admin.registration.waiting.summary",
        headlineText: "We are processing your update",
        bodyText: "Your update is in progress.",
        nextStepText: "We will let you know when it changes.",
        safetyNetText: "Tell us if anything changes.",
        placeholderText: "We are still processing this update.",
      },
      {
        deliveryMode: "placeholder_safe",
        channelRef: "patient_portal",
        localeRef: "en-GB",
        audienceTierRefs: ["patient_authenticated"],
        releaseStateRefs: ["current", "degraded", "quarantined"],
        visibilityTier: "patient_authenticated",
        summarySafetyTier: "clinical_safe_summary",
        renderInputRef: "render_input.admin.registration.waiting.placeholder",
        headlineText: "Update in progress",
        bodyText: "We are keeping a short summary visible.",
        nextStepText: "No action is needed right now.",
        safetyNetText: "Use the recovery path if the status changes.",
        placeholderText: "A short progress summary is available.",
      },
    ],
    ...overrides,
  };
}

function buildResolveInput(
  patientExpectationTemplateRef: string,
  overrides: Partial<ResolvePatientExpectationTemplateInput> = {},
): ResolvePatientExpectationTemplateInput {
  return {
    patientExpectationTemplateRef,
    consequenceClass: "admin_resolution_waiting",
    channelRef: "patient_portal",
    localeRef: "en-GB",
    readingLevelRef: null,
    accessibilityVariantRefs: [],
    audienceTierRef: "patient_authenticated",
    desiredDeliveryMode: "full",
    releaseState: "current",
    ...overrides,
  };
}

function buildAnalyticsInput(
  overrides: Partial<RecordOutcomeAnalyticsInput> = {},
): RecordOutcomeAnalyticsInput {
  return {
    taskId: "task_253",
    requestRef: "request_253",
    boundaryDecisionRef: "boundary_253",
    boundaryTupleHash: "boundary_tuple_253",
    decisionEpochRef: "decision_epoch_253",
    consequenceClass: "self_care",
    eventClass: "patient_recontacted",
    adviceBundleVersionRef: "advice_bundle_253",
    adviceVariantSetRef: "advice_variant_253",
    patientExpectationTemplateRef: "patient_expectation_template.self_care.default",
    patientExpectationTemplateVersionRef: "template_version_253",
    patientExpectationTemplateVariantRef: "template_variant_253",
    adminResolutionSubtypeRef: null,
    adminResolutionCaseRef: null,
    completionArtifactRef: null,
    channelRef: "patient_portal",
    localeRef: "en-GB",
    readingLevelRef: null,
    accessibilityVariantRefs: [],
    audienceTierRef: "patient_authenticated",
    releaseState: "current",
    visibilityTier: "patient_authenticated",
    summarySafetyTier: "clinical_safe_summary",
    eventOccurredAt: "2026-04-17T12:30:00.000Z",
    recordedAt: "2026-04-17T12:30:00.000Z",
    watchWindow: {
      taskId: "task_253",
      requestRef: "request_253",
      boundaryDecisionRef: "boundary_253",
      boundaryTupleHash: "boundary_tuple_253",
      decisionEpochRef: "decision_epoch_253",
      consequenceClass: "self_care",
      adminResolutionSubtypeRef: null,
      adviceBundleVersionRef: "advice_bundle_253",
      watchStartAt: "2026-04-17T12:00:00.000Z",
      watchUntil: "2026-04-18T12:00:00.000Z",
      recontactThresholdRef: "recontact_threshold.48h",
      escalationThresholdRef: "escalation_threshold.24h",
      rollbackReviewState: "none",
      watchRevision: 1,
      assuranceSliceTrustRefs: ["assurance_slice_trust.self_care"],
      watchState: "monitoring",
      latestReviewOutcomeRef: null,
    },
    reasonCodeRefs: ["patient_recontacted_in_watch_window"],
    ...overrides,
  };
}

describe("phase 3 self-care outcome analytics kernel", () => {
  it("publishes a versioned template registry row and resolves full delivery when coverage exists", async () => {
    const service = createPhase3SelfCareOutcomeAnalyticsKernelService(
      createPhase3SelfCareOutcomeAnalyticsKernelStore(),
      {
        idGenerator: createDeterministicBackboneIdGenerator(
          "phase3_self_care_outcome_analytics_publish",
        ),
      },
    );

    const published = await service.publishPatientExpectationTemplateVersion(
      buildTemplateInput("patient_expectation_template.admin.registration.waiting"),
    );
    const resolved = await service.resolvePatientExpectationTemplate(
      buildResolveInput("patient_expectation_template.admin.registration.waiting"),
    );

    expect(published.template.activeVersionRef).toBe(
      published.templateVersion.patientExpectationTemplateVersionId,
    );
    expect(published.variants).toHaveLength(3);
    expect(resolved?.deliveryMode).toBe("full");
    expect(resolved?.headlineText).toContain("processing");
  });

  it("falls back from full to summary-safe copy when only safer delivery is allowed", async () => {
    const service = createPhase3SelfCareOutcomeAnalyticsKernelService(
      createPhase3SelfCareOutcomeAnalyticsKernelStore(),
      {
        idGenerator: createDeterministicBackboneIdGenerator(
          "phase3_self_care_outcome_analytics_fallback",
        ),
      },
    );

    await service.publishPatientExpectationTemplateVersion(
      buildTemplateInput("patient_expectation_template.admin.registration.waiting"),
    );
    const resolved = await service.resolvePatientExpectationTemplate(
      buildResolveInput("patient_expectation_template.admin.registration.waiting", {
        desiredDeliveryMode: "summary_safe",
        releaseState: "degraded",
      }),
    );

    expect(resolved?.deliveryMode).toBe("summary_safe");
    expect(resolved?.reasonCodeRefs).not.toContain("delivery_mode_downgraded_to_placeholder_safe");
  });

  it("keeps analytics observational and links typed records onto the watch window", async () => {
    const repositories = createPhase3SelfCareOutcomeAnalyticsKernelStore();
    const service = createPhase3SelfCareOutcomeAnalyticsKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator(
        "phase3_self_care_outcome_analytics_watch",
      ),
    });

    const first = await service.recordAdviceOutcomeAnalytics(buildAnalyticsInput());
    const replay = await service.recordAdviceOutcomeAnalytics(
      buildAnalyticsInput({
        recordedAt: "2026-04-17T12:35:00.000Z",
      }),
    );

    expect(first.analyticsRecord.observationalAuthorityState).toBe("analytics_only");
    expect(first.analyticsRecord.watchWindowTiming).toBe("within_watch_window");
    expect(first.watchWindow?.linkedAnalyticsRefs).toContain(
      first.analyticsRecord.adviceUsageAnalyticsRecordId,
    );
    expect(replay.analyticsRecord.adviceUsageAnalyticsRecordId).toBe(
      first.analyticsRecord.adviceUsageAnalyticsRecordId,
    );
  });

  it("supersedes the previous active template version instead of mutating history in place", async () => {
    const repositories = createPhase3SelfCareOutcomeAnalyticsKernelStore();
    const service = createPhase3SelfCareOutcomeAnalyticsKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator(
        "phase3_self_care_outcome_analytics_supersession",
      ),
    });

    const first = await service.publishPatientExpectationTemplateVersion(
      buildTemplateInput("patient_expectation_template.admin.registration.waiting"),
    );
    const second = await service.publishPatientExpectationTemplateVersion(
      buildTemplateInput("patient_expectation_template.admin.registration.waiting", {
        publishedAt: "2026-04-18T12:00:00.000Z",
        variants: buildTemplateInput(
          "patient_expectation_template.admin.registration.waiting",
        ).variants.map((variant) =>
          variant.deliveryMode === "full"
            ? {
                ...variant,
                bodyText: "The registration team is still processing your update.",
              }
            : variant,
        ),
      }),
    );

    expect(second.supersededTemplateVersion?.templateState).toBe("superseded");
    expect(second.templateVersion.templateVersionNumber).toBe(
      first.templateVersion.templateVersionNumber + 1,
    );
  });
});
