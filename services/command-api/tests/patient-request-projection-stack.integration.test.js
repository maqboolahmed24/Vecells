import { describe, expect, it } from "vitest";
import { createAuthenticatedPortalProjectionApplication } from "../src/authenticated-portal-projections.ts";

function baseRouteContext(overrides = {}) {
  return {
    subjectRef: "nhs_subject_211",
    audienceTier: "patient_authenticated",
    purposeOfUse: "authenticated_self_service",
    routeFamilyRef: "patient_requests",
    sessionEpochRef: "session_epoch_211_v1",
    expectedSessionEpochRef: "session_epoch_211_v1",
    subjectBindingVersionRef: "binding_version_211_v1",
    expectedSubjectBindingVersionRef: "binding_version_211_v1",
    routeIntentBindingRef: "route_intent_211_v1",
    expectedRouteIntentBindingRef: "route_intent_211_v1",
    lineageFenceRef: "lineage_fence_211_v1",
    expectedLineageFenceRef: "lineage_fence_211_v1",
    trustPosture: "trusted",
    commandConsistencyState: "consistent",
    coverageRowRefs: ["coverage_row_211_request_detail"],
    observedAt: "2026-04-16T11:00:00.000Z",
    ...overrides,
  };
}

function sourceRequests(overrides = {}) {
  return [
    {
      requestRef: "request_211_a",
      requestVersionRef: "request_211_a_v1",
      requestLineageRef: "lineage_211_a",
      patientSafeLabel: "Dermatology request",
      publicSafeLabel: "Request update",
      statusText: "Reply needed",
      bucket: "needs_attention",
      ownerSubjectRef: "nhs_subject_211",
      requiredSubjectBindingVersionRef: "binding_version_211_v1",
      requiredSessionEpochRef: "session_epoch_211_v1",
      routeIntentBindingRef: "route_intent_211_v1",
      lineageFenceRef: "lineage_fence_211_v1",
      awaitingParty: "patient",
      nextSafeActionRef: "reply_to_more_info",
      dominantActionRef: "respond_more_info",
      latestMeaningfulUpdateAt: "2026-04-16T10:45:00.000Z",
      evidenceSnapshotRef: "evidence_snapshot_211_a",
      evidenceSummaryParityRef: "evidence_parity_211_a",
      trustCueRef: "fresh_from_practice",
      lineageCaseLinkRefs: ["case_211_more_info", "case_211_callback"],
      downstream: [
        {
          childType: "record_follow_up",
          childRef: "record_211_a",
          patientLabelRef: "results_update",
          authoritativeState: "available",
          awaitingParty: "none",
          nextSafeActionRef: "view_results_update",
          visibilityTier: "partial",
          lastMeaningfulUpdateAt: "2026-04-16T10:10:00.000Z",
        },
        {
          childType: "conversation_cluster",
          childRef: "thread_211_a",
          patientLabelRef: "more_info_question",
          authoritativeState: "reply_needed",
          awaitingParty: "patient",
          nextSafeActionRef: "reply_to_more_info",
          visibilityTier: "full",
          lastMeaningfulUpdateAt: "2026-04-16T10:40:00.000Z",
        },
        {
          childType: "admin_repair",
          childRef: "repair_211_a",
          patientLabelRef: "contact_repair",
          authoritativeState: "repair_required",
          awaitingParty: "patient",
          nextSafeActionRef: "repair_contact_route",
          visibilityTier: "full",
          lastMeaningfulUpdateAt: "2026-04-16T10:35:00.000Z",
        },
      ],
      communicationClusterRefs: ["thread_211_a"],
      artifactRefs: ["artifact_211_a"],
      commandConsistencyState: "consistent",
      preferredActionType: "respond_more_info",
      ...overrides,
    },
    {
      requestRef: "request_211_b",
      requestVersionRef: "request_211_b_v1",
      requestLineageRef: "lineage_211_b",
      patientSafeLabel: "Admin request",
      publicSafeLabel: "Request update",
      statusText: "In progress",
      bucket: "in_progress",
      ownerSubjectRef: "nhs_subject_211",
      requiredSubjectBindingVersionRef: "binding_version_211_v1",
      requiredSessionEpochRef: "session_epoch_211_v1",
      routeIntentBindingRef: "route_intent_211_v1",
      lineageFenceRef: "lineage_fence_211_v1",
      awaitingParty: "practice",
      nextSafeActionRef: "view_request",
      dominantActionRef: null,
      latestMeaningfulUpdateAt: "2026-04-16T09:30:00.000Z",
      evidenceSnapshotRef: "evidence_snapshot_211_b",
      evidenceSummaryParityRef: "evidence_parity_211_b",
      trustCueRef: "in_progress",
      lineageCaseLinkRefs: ["case_211_admin"],
      downstream: [],
      communicationClusterRefs: [],
      artifactRefs: [],
      commandConsistencyState: "consistent",
    },
  ];
}

describe("Patient request browsing, detail, and typed action routing projections", () => {
  it("keeps list, lineage, detail, and return bundle aligned on the same request tuple", async () => {
    const application = createAuthenticatedPortalProjectionApplication();
    const requests = sourceRequests();

    const list = await application.authenticatedPortalProjectionService.listPatientRequests({
      ...baseRouteContext({
        selectedAnchorRef: "request_211_a",
        selectedFilterRef: "needs_attention",
      }),
      sourceRequests: requests,
    });
    const detail = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext({ selectedFilterRef: "needs_attention" }),
      requestRef: "request_211_a",
      sourceRequests: requests,
    });

    expect("PatientRequestsIndexProjection").toBe("PatientRequestsIndexProjection");
    expect("PatientRequestLineageProjection").toBe("PatientRequestLineageProjection");
    expect("PatientRequestDetailProjection").toBe("PatientRequestDetailProjection");
    expect("PatientRequestSummaryProjection").toBe("PatientRequestSummaryProjection");
    expect(detail.summary.summaryProjectionRef).toContain("patient_request_summary");
    expect(list.index.selectedRequestReturnBundleRef).toBe(
      list.returnBundles[0].requestReturnBundleRef,
    );
    expect(detail.lineage.lineageTupleHash).toBe(list.lineages[0].lineageTupleHash);
    expect(detail.detail.lineageTupleHash).toBe(detail.lineage.lineageTupleHash);
    expect(detail.returnBundle.projectionName).toBe("PatientRequestReturnBundle");
    expect(detail.detail.requestReturnBundleRef).toBe(detail.returnBundle.requestReturnBundleRef);
    expect(detail.returnBundle.selectedAnchorRef).toBe("request_211_a");
    expect(detail.detail.downstreamProjectionRefs).toEqual(
      detail.downstream.map((projection) => projection.downstreamProjectionRef),
    );
  });

  it("orders downstream projections by blocker severity and preserves placeholders for missing siblings", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const detail = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext(),
      requestRef: "request_211_a",
      sourceRequests: sourceRequests(),
    });

    expect(detail.downstream[0].projectionName).toBe("PatientRequestDownstreamProjection");
    expect(detail.downstream.map((projection) => projection.childRef)).toEqual([
      "repair_211_a",
      "thread_211_a",
      "record_211_a",
    ]);
    expect(detail.downstream[1].placeholderPosture).toBe("sibling_projection_missing");
    expect(detail.downstream[1].placeholderReasonRefs).toContain(
      "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT",
    );
    expect(detail.downstream[2].placeholderReasonRefs).toContain(
      "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS",
    );
  });

  it("derives one dominant next action and binds it to a typed routing envelope", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const detail = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext({ actionType: "respond_more_info" }),
      requestRef: "request_211_a",
      sourceRequests: sourceRequests(),
    });

    expect(detail.nextAction.projectionName).toBe("PatientNextActionProjection");
    expect(detail.nextAction.actionability).toBe("live");
    expect(detail.nextAction.dominantActionRef).toBe("respond_more_info");
    expect(detail.actionRouting.projectionName).toBe("PatientActionRoutingProjection");
    expect(detail.actionRouting.routeIntentBindingRef).toBe("route_intent_211_v1");
    expect(detail.actionRouting.requestReturnBundleRef).toBe(
      detail.returnBundle.requestReturnBundleRef,
    );
    expect(detail.actionRouting.blockedReasonRef).toBeNull();
    expect(detail.actionRouting.routeTargetRef).toBe("/v1/me/requests/request_211_a/more-info");
    expect(detail.detail.dominantActionRef).toBe("respond_more_info");
  });

  it("keeps pending authoritative settlement separate from local acknowledgement", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const detail = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext({ actionSettlementState: "pending_authoritative_confirmation" }),
      requestRef: "request_211_a",
      sourceRequests: sourceRequests(),
    });

    expect(detail.actionSettlement.projectionName).toBe("PatientActionSettlementProjection");
    expect(detail.actionSettlement.localAckState).toBe("acknowledged");
    expect(detail.actionSettlement.processingAcceptanceState).toBe("pending");
    expect(detail.actionSettlement.authoritativeOutcomeState).toBe(
      "pending_authoritative_confirmation",
    );
    expect(detail.actionSettlement.sameShellState).toBe("pending");
    expect(detail.actionSettlement.settledAt).toBeNull();
  });

  it("lets safety interruption override stale optimistic actionability", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const detail = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext(),
      requestRef: "request_211_a",
      sourceRequests: sourceRequests({
        safetyInterruptionState: "urgent_required",
        safetyInterruptionReasonRef: "safety_epoch_211_red_flag",
      }),
    });

    expect(detail.safetyInterruption.surfaceState).toBe("urgent_required");
    expect(detail.safetyInterruption.projectionName).toBe("PatientSafetyInterruptionProjection");
    expect(detail.safetyInterruption.suppressedActionRefs).toContain("respond_more_info");
    expect(detail.nextAction.actionability).toBe("blocked");
    expect(detail.nextAction.dominantActionRef).toBeNull();
    expect(detail.actionRouting.blockedReasonRef).toBe(
      detail.safetyInterruption.safetyInterruptionProjectionRef,
    );
    expect(detail.detail.dominantActionRef).toBeNull();
  });

  it("degrades identity-hold detail in place while preserving routing and return context", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const detail = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext({ trustPosture: "repair_hold", identityRepairCaseRef: "repair_211" }),
      requestRef: "request_211_a",
      sourceRequests: sourceRequests({
        identityRepairCaseRef: "repair_211",
        identityRepairFreezeRef: "freeze_211",
      }),
    });

    expect(detail.detail).toBeNull();
    expect(detail.identityHold.surfaceState).toBe("active");
    expect(detail.returnBundle.sameShellState).toBe("identity_hold");
    expect(detail.nextAction.actionability).toBe("blocked");
    expect(detail.actionRouting.blockedReasonRef).toBe("identity_hold");
    expect(
      detail.downstream.every((projection) => projection.placeholderPosture === "identity_hold"),
    ).toBe(true);
  });
});
