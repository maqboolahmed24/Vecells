import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_SELF_CARE_OUTCOME_ANALYTICS_QUERY_SURFACES,
  PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SCHEMA_VERSION,
  PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SERVICE_NAME,
  createPhase3SelfCareOutcomeAnalyticsApplication,
  phase3SelfCareOutcomeAnalyticsMigrationPlanRefs,
  phase3SelfCareOutcomeAnalyticsPersistenceTables,
  phase3SelfCareOutcomeAnalyticsRoutes,
} from "../src/phase3-self-care-outcome-analytics.ts";

function buildSelfCareFixture() {
  return {
    selfCareBoundaryBundle: {
      boundaryBundle: {
        currentBoundaryDecision: {
          selfCareBoundaryDecisionId: "boundary_253",
          requestRef: "request_253",
          boundaryTupleHash: "boundary_tuple_253",
          decisionEpochRef: "decision_epoch_253",
          decisionState: "self_care",
          reopenState: "stable",
          boundaryState: "live",
          compiledPolicyBundleRef: "policy_bundle_253_v1",
          reasonCodeRefs: ["self_care_current"],
          adminResolutionSubtypeRef: null,
        },
        currentAdviceEligibilityGrant: {
          channelRef: "patient_portal",
          localeRef: "en-GB",
          audienceTier: "patient_authenticated",
        },
      },
    },
    adviceRenderBundle: {
      selectedAdviceBundleVersion: {
        adviceBundleVersionId: "advice_bundle_253",
        pathwayRef: "common_cold_guidance",
      },
      selectedAdviceVariantSet: {
        adviceVariantSetId: "advice_variant_253",
        readingLevelRef: "standard",
        accessibilityVariantRefs: ["screen_reader_ready"],
      },
      renderBundle: {
        currentRenderSettlement: {
          visibilityTier: "patient_authenticated",
          summarySafetyTier: "clinical_safe_summary",
          trustState: "trusted",
        },
      },
      effectiveRenderState: "renderable",
      effectiveReasonCodeRefs: [],
    },
    adminResolutionBundle: {
      adminResolutionBundle: {
        currentAdminResolutionCase: null,
        currentCompletionArtifact: null,
        currentSubtypeProfile: null,
      },
      effectiveReasonCodeRefs: [],
    },
    dependencyBundle: {
      projection: {
        canContinueCurrentConsequence: true,
        currentAdviceAdminDependencySet: {
          reasonCodeRefs: [],
        },
      },
    },
  };
}

function buildAdminCompletionFixture() {
  return {
    selfCareBoundaryBundle: {
      boundaryBundle: {
        currentBoundaryDecision: {
          selfCareBoundaryDecisionId: "boundary_253_admin",
          requestRef: "request_253_admin",
          boundaryTupleHash: "boundary_tuple_253_admin",
          decisionEpochRef: "decision_epoch_253_admin",
          decisionState: "admin_resolution",
          reopenState: "stable",
          boundaryState: "live",
          compiledPolicyBundleRef: "policy_bundle_253_admin_v1",
          reasonCodeRefs: ["admin_resolution_current"],
          adminResolutionSubtypeRef: "registration_or_demographic_update",
        },
        currentAdviceEligibilityGrant: {
          channelRef: "patient_portal",
          localeRef: "en-GB",
          audienceTier: "patient_authenticated",
        },
      },
    },
    adviceRenderBundle: {
      selectedAdviceBundleVersion: null,
      selectedAdviceVariantSet: null,
      renderBundle: {
        currentRenderSettlement: null,
      },
      effectiveRenderState: null,
      effectiveReasonCodeRefs: [],
    },
    adminResolutionBundle: {
      adminResolutionBundle: {
        currentAdminResolutionCase: {
          adminResolutionCaseId: "admin_case_253",
          caseState: "completion_artifact_recorded",
          waitingState: "none",
          adminResolutionSubtypeRef: "registration_or_demographic_update",
        },
        currentCompletionArtifact: {
          adminResolutionCompletionArtifactId: "completion_artifact_253",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.registration_or_demographic_update.completed",
          visibilityTier: "patient_authenticated",
          summarySafetyTier: "clinical_safe_summary",
          releaseState: "current",
          artifactState: "delivered",
        },
        currentSubtypeProfile: {
          adminResolutionSubtypeRef: "registration_or_demographic_update",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.registration_or_demographic_update",
          waitingPolicies: [],
        },
      },
      effectiveReasonCodeRefs: [],
    },
    dependencyBundle: {
      projection: {
        canContinueCurrentConsequence: true,
        currentAdviceAdminDependencySet: {
          reasonCodeRefs: [],
        },
      },
    },
  };
}

describe("phase 3 self-care outcome analytics application", () => {
  it("publishes a lazy canonical template and resolves the current self-care expectation", async () => {
    const fixture = buildSelfCareFixture();
    const app = createPhase3SelfCareOutcomeAnalyticsApplication({
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary(taskId) {
          expect(taskId).toBe("task_253");
          return fixture.selfCareBoundaryBundle;
        },
      },
      adviceRenderApplication: {
        async queryTaskAdviceRender(taskId) {
          expect(taskId).toBe("task_253");
          return fixture.adviceRenderBundle;
        },
      },
      adminResolutionApplication: {
        async queryTaskAdminResolution(taskId) {
          expect(taskId).toBe("task_253");
          return fixture.adminResolutionBundle;
        },
      },
      dependencyApplication: {
        async queryTaskAdviceAdminDependency(taskId) {
          expect(taskId).toBe("task_253");
          return fixture.dependencyBundle;
        },
      },
    });

    const result = await app.queryTaskSelfCareOutcomeAnalytics("task_253");
    expect(result?.currentExpectationResolution?.patientExpectationTemplateRef).toBe(
      "patient_expectation_template.self_care.common_cold_guidance",
    );
    expect(result?.analyticsBundle.patientExpectationTemplates.length).toBeGreaterThan(0);
  });

  it("records advice outcome analytics and links the typed record onto the current watch window", async () => {
    const fixture = buildSelfCareFixture();
    const app = createPhase3SelfCareOutcomeAnalyticsApplication({
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary() {
          return fixture.selfCareBoundaryBundle;
        },
      },
      adviceRenderApplication: {
        async queryTaskAdviceRender() {
          return fixture.adviceRenderBundle;
        },
      },
      adminResolutionApplication: {
        async queryTaskAdminResolution() {
          return fixture.adminResolutionBundle;
        },
      },
      dependencyApplication: {
        async queryTaskAdviceAdminDependency() {
          return fixture.dependencyBundle;
        },
      },
    });

    const recorded = await app.recordAdviceOutcomeAnalytics({
      taskId: "task_253",
      eventClass: "patient_recontacted",
      eventOccurredAt: "2026-04-17T12:30:00.000Z",
      recordedAt: "2026-04-17T12:30:00.000Z",
      watchStartAt: "2026-04-17T12:00:00.000Z",
      watchUntil: "2026-04-18T12:00:00.000Z",
      recontactThresholdRef: "recontact_threshold.48h",
      escalationThresholdRef: "escalation_threshold.24h",
      rollbackReviewState: "none",
      watchRevision: 1,
      assuranceSliceTrustRefs: ["assurance_slice_trust.self_care"],
      watchState: "monitoring",
      latestReviewOutcomeRef: null,
      reasonCodeRefs: ["patient_recontacted_in_window"],
    });
    const watchAnalytics = await app.fetchAdviceFollowUpWatchAnalytics("task_253");

    expect(recorded.analyticsRecord.observationalAuthorityState).toBe("analytics_only");
    expect(recorded.watchWindow?.linkedAnalyticsRefs).toContain(
      recorded.analyticsRecord.adviceUsageAnalyticsRecordId,
    );
    expect(watchAnalytics.watchWindows).toHaveLength(1);
    expect(watchAnalytics.analyticsRecords).toHaveLength(1);
  });

  it("resolves bounded admin completion through the completion artifact template ref", async () => {
    const fixture = buildAdminCompletionFixture();
    const app = createPhase3SelfCareOutcomeAnalyticsApplication({
      selfCareBoundaryApplication: {
        async queryTaskSelfCareBoundary() {
          return fixture.selfCareBoundaryBundle;
        },
      },
      adviceRenderApplication: {
        async queryTaskAdviceRender() {
          return fixture.adviceRenderBundle;
        },
      },
      adminResolutionApplication: {
        async queryTaskAdminResolution() {
          return fixture.adminResolutionBundle;
        },
      },
      dependencyApplication: {
        async queryTaskAdviceAdminDependency() {
          return fixture.dependencyBundle;
        },
      },
    });

    const resolution = await app.resolvePatientExpectationTemplate({
      taskId: "task_253_admin",
      desiredDeliveryMode: "full",
    });

    expect(resolution?.patientExpectationTemplateRef).toBe(
      "patient_expectation_template.admin.registration_or_demographic_update.completed",
    );
  });

  it("publishes the expected route contract and service metadata", () => {
    expect(PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SERVICE_NAME).toBe(
      "Phase3SelfCareOutcomeAnalyticsApplication",
    );
    expect(PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SCHEMA_VERSION).toBe(
      "253.phase3.self-care-outcome-analytics-and-expectation-templates.v1",
    );
    expect(PHASE3_SELF_CARE_OUTCOME_ANALYTICS_QUERY_SURFACES).toContain(
      "GET /v1/workspace/tasks/{taskId}/self-care-outcome-analytics",
    );
    expect(phase3SelfCareOutcomeAnalyticsRoutes).toHaveLength(6);
    expect(phase3SelfCareOutcomeAnalyticsPersistenceTables).toContain(
      "phase3_patient_expectation_templates",
    );
    expect(phase3SelfCareOutcomeAnalyticsMigrationPlanRefs.at(-1)).toBe(
      "services/command-api/migrations/129_phase3_self_care_outcome_analytics_and_expectation_templates.sql",
    );
    expect(
      serviceDefinition.routeCatalog.some(
        (route) => route.routeId === "workspace_task_record_admin_outcome_analytics",
      ),
    ).toBe(true);
  });
});
