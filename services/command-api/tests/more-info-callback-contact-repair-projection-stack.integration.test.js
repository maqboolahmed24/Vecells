import { describe, expect, it } from "vitest";
import { createAuthenticatedPortalProjectionApplication } from "../src/authenticated-portal-projections.ts";

function baseRouteContext(overrides = {}) {
  return {
    subjectRef: "nhs_subject_212",
    audienceTier: "patient_authenticated",
    purposeOfUse: "authenticated_self_service",
    routeFamilyRef: "patient_more_info",
    sessionEpochRef: "session_epoch_212_v1",
    expectedSessionEpochRef: "session_epoch_212_v1",
    subjectBindingVersionRef: "binding_version_212_v1",
    expectedSubjectBindingVersionRef: "binding_version_212_v1",
    routeIntentBindingRef: "route_intent_212_v1",
    expectedRouteIntentBindingRef: "route_intent_212_v1",
    lineageFenceRef: "lineage_fence_212_v1",
    expectedLineageFenceRef: "lineage_fence_212_v1",
    trustPosture: "trusted",
    commandConsistencyState: "consistent",
    coverageRowRefs: ["coverage_row_212_more_info"],
    observedAt: "2026-04-16T12:00:00.000Z",
    ...overrides,
  };
}

function sourceRequest(overrides = {}) {
  return {
    requestRef: "request_212_a",
    requestVersionRef: "request_212_a_v3",
    requestLineageRef: "lineage_212_a",
    patientSafeLabel: "Dermatology request",
    publicSafeLabel: "Request update",
    statusText: "Reply needed",
    bucket: "needs_attention",
    ownerSubjectRef: "nhs_subject_212",
    requiredSubjectBindingVersionRef: "binding_version_212_v1",
    requiredSessionEpochRef: "session_epoch_212_v1",
    routeIntentBindingRef: "route_intent_212_v1",
    lineageFenceRef: "lineage_fence_212_v1",
    awaitingParty: "patient",
    nextSafeActionRef: "reply_to_more_info",
    dominantActionRef: "respond_more_info",
    latestMeaningfulUpdateAt: "2026-04-16T11:45:00.000Z",
    evidenceSnapshotRef: "evidence_snapshot_212_a",
    evidenceSummaryParityRef: "evidence_parity_212_a",
    trustCueRef: "fresh_from_practice",
    lineageCaseLinkRefs: ["case_212_more_info", "case_212_callback"],
    downstream: [
      {
        childType: "conversation_cluster",
        childRef: "cluster_212_more_info",
        patientLabelRef: "more_info_question",
        authoritativeState: "reply_needed",
        awaitingParty: "patient",
        nextSafeActionRef: "reply_to_more_info",
        visibilityTier: "full",
        lastMeaningfulUpdateAt: "2026-04-16T11:44:00.000Z",
      },
      {
        childType: "callback_case",
        childRef: "callback_212_a",
        patientLabelRef: "callback_expected",
        authoritativeState: "scheduled",
        awaitingParty: "practice",
        nextSafeActionRef: "view_callback_status",
        visibilityTier: "full",
        lastMeaningfulUpdateAt: "2026-04-16T11:30:00.000Z",
      },
    ],
    communicationClusterRefs: ["cluster_212_more_info"],
    artifactRefs: [],
    commandConsistencyState: "consistent",
    preferredActionType: "respond_more_info",
    moreInfoCycle: {
      cycleRef: "more_info_cycle_212_a",
      cycleVersionRef: "more_info_cycle_212_a_v2",
      promptStackRef: "prompt_stack_212_a",
      state: "reply_needed",
      replyWindowCheckpointRef: "reply_window_212_a",
      lateReviewWindowRef: "late_review_212_a",
      dueAt: "2026-04-18T17:00:00.000Z",
      expiresAt: "2026-04-21T17:00:00.000Z",
      authoritativeReceiptRef: null,
      secureLinkGrantRef: "secure_link_212_a_expires_soon",
      continuityEvidenceRef: "continuity_212_more_info_reply",
      promptItems: [
        {
          promptRef: "prompt_212_symptoms",
          promptLabelRef: "symptom_photo_question",
          state: "unanswered",
          requiredEvidenceRefs: ["photo_optional"],
          visibilityTier: "full",
        },
        {
          promptRef: "prompt_212_medicines",
          promptLabelRef: "current_medicines_question",
          state: "unanswered",
          requiredEvidenceRefs: [],
          visibilityTier: "full",
        },
      ],
    },
    callbackCases: [
      {
        callbackCaseRef: "callback_212_a",
        callbackCaseVersionRef: "callback_212_a_v1",
        clusterRef: "cluster_212_more_info",
        expectationEnvelopeRef: "callback_expectation_212_a",
        outcomeEvidenceBundleRef: null,
        resolutionGateRef: "callback_resolution_212_a",
        patientVisibleState: "scheduled",
        windowRiskState: "on_track",
        windowLowerAt: "2026-04-16T14:00:00.000Z",
        windowUpperAt: "2026-04-16T16:00:00.000Z",
        stateConfidenceBand: "high",
        monotoneRevision: 3,
        continuityEvidenceRef: "continuity_212_callback",
      },
    ],
    reachability: {
      reachabilityAssessmentRef: "reachability_212_clear",
      contactRouteSnapshotRef: "contact_snapshot_212_current",
      summaryState: "clear",
      routeAuthorityState: "current",
      deliveryRiskState: "on_track",
      activeDependencyRef: null,
      affectedRouteRefs: [],
      latestObservationAt: "2026-04-16T11:00:00.000Z",
    },
    contactRepair: null,
    consentCheckpoint: null,
    ...overrides,
  };
}

describe("More-info, callback, reachability, and contact-repair projections", () => {
  it("resolves active more-info status and response thread from one request return bundle", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMoreInfo({
      ...baseRouteContext(),
      requestRef: "request_212_a",
      sourceRequests: [sourceRequest()],
    });

    expect(result.moreInfoStatus.projectionName).toBe("PatientMoreInfoStatusProjection");
    expect(result.responseThread.projectionName).toBe(
      "PatientMoreInfoResponseThreadProjection",
    );
    expect(result.moreInfoStatus.activeCycleRef).toBe("more_info_cycle_212_a");
    expect(result.moreInfoStatus.answerabilityState).toBe("answerable");
    expect(result.moreInfoStatus.dominantActionRef).toBe("respond_more_info");
    expect(result.moreInfoStatus.requestReturnBundleRef).toBe(
      result.requestReturnBundle.requestReturnBundleRef,
    );
    expect(result.responseThread.currentFocusablePromptRef).toBe("prompt_212_symptoms");
    expect(result.responseThread.threadTupleHash).toContain("");
    expect(result.actionRouting.routeTargetRef).toBe(
      "/v1/me/requests/request_212_a/more-info",
    );
  });

  it("does not treat secure-link expiry as more-info cycle expiry", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMoreInfo({
      ...baseRouteContext(),
      requestRef: "request_212_a",
      sourceRequests: [
        sourceRequest({
          moreInfoCycle: {
            ...sourceRequest().moreInfoCycle,
            state: "reply_needed",
            secureLinkGrantRef: "secure_link_212_expired",
            expiresAt: "2026-04-22T17:00:00.000Z",
          },
        }),
      ],
    });

    expect(result.moreInfoStatus.cycleState).toBe("reply_needed");
    expect(result.moreInfoStatus.secureLinkGrantRef).toBe("secure_link_212_expired");
    expect(result.moreInfoStatus.answerabilityState).toBe("answerable");
  });

  it("keeps callback status evidence-derived and route repair aware", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientCallbackStatus({
      ...baseRouteContext({ routeFamilyRef: "patient_callback_status" }),
      requestRef: "request_212_a",
      clusterId: "cluster_212_more_info",
      callbackCaseId: "callback_212_a",
      sourceRequests: [
        sourceRequest({
          callbackCases: [
            {
              ...sourceRequest().callbackCases[0],
              outcomeEvidenceBundleRef: "callback_outcome_212_answered",
              patientVisibleState: "closed",
              windowRiskState: "on_track",
            },
          ],
        }),
      ],
    });

    expect(result.callbackStatus.projectionName).toBe("PatientCallbackStatusProjection");
    expect("CallbackExpectationEnvelope").toBe("CallbackExpectationEnvelope");
    expect("CallbackOutcomeEvidenceBundle").toBe("CallbackOutcomeEvidenceBundle");
    expect("CallbackResolutionGate").toBe("CallbackResolutionGate");
    expect(result.callbackStatus.patientVisibleState).toBe("closed");
    expect(result.callbackStatus.authoritativeBasisRefs).toContain(
      "callback_expectation_212_a",
    );
    expect(result.callbackStatus.authoritativeBasisRefs).toContain(
      "callback_outcome_212_answered",
    );
    expect(result.callbackStatus.authoritativeBasisRefs).toContain(
      "callback_resolution_212_a",
    );
    expect(result.callbackStatus.dominantActionRef).toBeNull();
  });

  it("lets reachability and contact repair dominate stale reply and callback CTAs", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMoreInfo({
      ...baseRouteContext(),
      requestRef: "request_212_a",
      sourceRequests: [
        sourceRequest({
          reachability: {
            reachabilityAssessmentRef: "reachability_212_blocked",
            contactRouteSnapshotRef: "contact_snapshot_212_stale",
            summaryState: "blocked",
            routeAuthorityState: "stale",
            deliveryRiskState: "likely_failed",
            activeDependencyRef: "reachability_dependency_212_sms",
            affectedRouteRefs: ["sms", "callback"],
            latestObservationAt: "2026-04-16T11:55:00.000Z",
          },
          contactRepair: {
            repairCaseRef: "repair_212_sms",
            contactRepairJourneyRef: "repair_journey_212_sms",
            repairState: "required",
            blockedActionRef: "respond_more_info",
            blockedContextRef: "more_info_cycle_212_a",
            verificationCheckpointRef: "verify_contact_212_sms",
            resultingReachabilityAssessmentRef: null,
          },
        }),
      ],
    });

    expect(result.reachabilitySummary.projectionName).toBe(
      "PatientReachabilitySummaryProjection",
    );
    expect(result.reachabilitySummary.summaryState).toBe("blocked");
    expect(result.contactRepair.projectionName).toBe("PatientContactRepairProjection");
    expect(result.moreInfoStatus.answerabilityState).toBe("blocked_by_repair");
    expect(result.moreInfoStatus.dominantActionRef).toBe("contact_route_repair");
    expect(result.actionRouting.actionType).toBe("contact_route_repair");
    expect(result.callbackStatuses[0].patientVisibleState).toBe("route_repair_required");
  });

  it("surfaces consent checkpoints as typed blockers instead of generic errors", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMoreInfo({
      ...baseRouteContext(),
      requestRef: "request_212_a",
      sourceRequests: [
        sourceRequest({
          consentCheckpoint: {
            checkpointRef: "consent_212_more_info",
            checkpointClass: "more_info",
            surfaceState: "expired",
            blockedActionRef: "respond_more_info",
            blockedContextRef: "more_info_cycle_212_a",
            consentGrantRef: "consent_grant_212_old",
            renewalRouteRef: "/v1/me/requests/request_212_a/consent",
            selectionBindingHash: "selection_hash_212",
          },
        }),
      ],
    });

    expect(result.consentCheckpoint.projectionName).toBe("PatientConsentCheckpointProjection");
    expect(result.moreInfoStatus.answerabilityState).toBe("blocked_by_consent");
    expect(result.moreInfoStatus.dominantActionRef).toBe("renew_consent");
    expect(result.actionRouting.actionType).toBe("renew_consent");
  });

  it("separates public-safe placeholder from authenticated-safe thread detail", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientMoreInfoThread({
      ...baseRouteContext({
        audienceTier: "patient_public",
        purposeOfUse: "secure_link_recovery",
        trustPosture: "reduced",
      }),
      requestRef: "request_212_a",
      sourceRequests: [sourceRequest()],
    });

    expect(result.moreInfoStatus.answerabilityState).toBe("public_safe_placeholder");
    expect(result.responseThread.maskingTier).toBe("public_safe");
    expect(result.responseThread.visibilityTier).toBe("placeholder_only");
    expect(result.responseThread.orderedPromptItems.every((item) => item.state === "blocked")).toBe(
      true,
    );
  });
});
