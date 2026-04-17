import { describe, expect, it } from "vitest";
import { createAuthenticatedPortalProjectionApplication } from "../src/authenticated-portal-projections.ts";

function baseHomeContext(overrides = {}) {
  return {
    subjectRef: "nhs_subject_210",
    audienceTier: "patient_authenticated",
    purposeOfUse: "authenticated_self_service",
    routeFamilyRef: "patient_home",
    sessionEpochRef: "session_epoch_210_v1",
    expectedSessionEpochRef: "session_epoch_210_v1",
    subjectBindingVersionRef: "binding_version_210_v1",
    expectedSubjectBindingVersionRef: "binding_version_210_v1",
    routeIntentBindingRef: "route_intent_210_v1",
    expectedRouteIntentBindingRef: "route_intent_210_v1",
    lineageFenceRef: "lineage_fence_210_v1",
    expectedLineageFenceRef: "lineage_fence_210_v1",
    trustPosture: "trusted",
    commandConsistencyState: "consistent",
    coverageRowRefs: ["coverage_row_210_patient_home"],
    observedAt: "2026-04-16T10:00:00.000Z",
    sourceRequests: [],
    ...overrides,
  };
}

function candidate(candidateRef, overrides = {}) {
  return {
    candidateRef,
    candidateType: "pending_patient_action",
    entityRef: `entity_${candidateRef}`,
    entityVersionRef: `entity_${candidateRef}_v1`,
    patientLabel: `Candidate ${candidateRef}`,
    decisionTier: "patient_action",
    patientSafetyBlocker: false,
    patientOwedAction: true,
    activeDependencyFailure: false,
    authoritativeDueAt: null,
    latestMeaningfulUpdateAt: "2026-04-16T09:58:00.000Z",
    stableEntityRef: `entity_${candidateRef}`,
    actionRef: `action_${candidateRef}`,
    actionLabel: "Continue",
    actionRouteRef: `/v1/me/requests/${candidateRef}`,
    visibilityAllowed: true,
    identityHoldClear: true,
    continuityClear: true,
    releaseTrustClear: true,
    capabilityLeaseState: "live",
    writableEligibilityState: "writable",
    recoveryOnly: false,
    ...overrides,
  };
}

describe("Patient home spotlight and quiet-home projection stack", () => {
  it("returns the harmonized PatientHomeProjection alias from GET /v1/me/home", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        spotlightCandidates: [candidate("candidate_patient_action")],
      }),
    );

    expect(result.home.projectionName).toBe("PatientHomeProjection");
    expect(result.home.projectionAlias).toBe("PatientPortalHomeProjection");
    expect(result.home.querySurfaceRef).toBe("GET /v1/me/home");
    expect(result.home.spotlightDecision.projectionName).toBe("PatientSpotlightDecisionProjection");
    expect(result.home.spotlightUseWindow.projectionName).toBe("PatientSpotlightDecisionUseWindow");
    expect(result.home.quietHomeDecision.projectionName).toBe("PatientQuietHomeDecision");
    expect(result.home.navigationUrgencyDigest.projectionName).toBe("PatientNavUrgencyDigest");
    expect(result.home.navReturnContract.projectionName).toBe("PatientNavReturnContract");
    expect(result.home.dominantActionRef).toBe("action_candidate_patient_action");
    expect(result.home.spotlightDecision.singleDominantAction).toBe(true);
  });

  it("preserves the active spotlight during its use window when a same-tier challenger appears", async () => {
    const application = createAuthenticatedPortalProjectionApplication();
    const first = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        spotlightCandidates: [candidate("candidate_current")],
      }),
    );

    const second = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        observedAt: "2026-04-16T10:01:00.000Z",
        currentSpotlightDecision: first.home.spotlightDecision,
        spotlightCandidates: [
          candidate("candidate_current", {
            latestMeaningfulUpdateAt: "2026-04-16T09:58:00.000Z",
          }),
          candidate("candidate_challenger", {
            latestMeaningfulUpdateAt: "2026-04-16T10:00:30.000Z",
          }),
        ],
      }),
    );

    expect(second.home.spotlightDecision.selectedCandidateRef).toBe("candidate_current");
    expect(second.home.spotlightUseWindow.state).toBe("preserved");
    expect(second.home.spotlightUseWindow.challengerCandidateRef).toBe("candidate_challenger");
  });

  it("preempts the active spotlight when a higher-tier urgent-safety candidate appears", async () => {
    const application = createAuthenticatedPortalProjectionApplication();
    const first = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        spotlightCandidates: [candidate("candidate_patient_action")],
      }),
    );

    const second = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        observedAt: "2026-04-16T10:02:00.000Z",
        currentSpotlightDecision: first.home.spotlightDecision,
        spotlightCandidates: [
          candidate("candidate_patient_action"),
          candidate("candidate_urgent", {
            candidateType: "active_request",
            decisionTier: "urgent_safety",
            patientSafetyBlocker: true,
            latestMeaningfulUpdateAt: "2026-04-16T10:01:00.000Z",
          }),
        ],
      }),
    );

    expect(second.home.spotlightDecision.selectedCandidateRef).toBe("candidate_urgent");
    expect(second.home.spotlightDecision.decisionTier).toBe("urgent_safety");
    expect(second.home.spotlightUseWindow.state).toBe("preempted_by_higher_tier");
  });

  it("allows quiet home only when complete projection truth has no visible or excluded blockers", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        homeTruthState: "complete",
        spotlightCandidates: [],
      }),
    );

    expect(result.home.homeMode).toBe("quiet");
    expect(result.home.spotlightDecision.decisionTier).toBe("quiet_home");
    expect(result.home.spotlightDecision.selectedCandidateRef).toBeNull();
    expect(result.home.quietHomeDecision.eligible).toBe(true);
    expect(result.home.dominantActionRef).toBeNull();
  });

  it("blocks quiet home when the source query is failed, converging, or fallback truth", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        homeTruthState: "query_failed",
        spotlightCandidates: [],
      }),
    );

    expect(result.home.homeMode).toBe("blocked");
    expect(result.home.quietHomeDecision.eligible).toBe(false);
    expect(result.home.quietHomeDecision.reason).toBe("blocked_by_degraded_truth");
    expect(result.home.quietHomeDecision.explanation).toContain("not complete");
  });

  it("downgrades stale capability or read-only candidates instead of treating them as quiet", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.getPatientHome(
      baseHomeContext({
        spotlightCandidates: [
          candidate("candidate_read_only_recovery", {
            candidateType: "contact_reachability_repair",
            decisionTier: "dependency_repair",
            activeDependencyFailure: true,
            capabilityLeaseState: "stale",
            writableEligibilityState: "read_only",
          }),
        ],
      }),
    );

    expect(result.home.homeMode).toBe("blocked");
    expect(result.home.visibleCandidateRefs).toEqual([]);
    expect(result.home.excludedCandidateRefs).toContain("candidate_read_only_recovery");
    expect(result.home.quietHomeDecision.reason).toBe("blocked_by_visibility_or_actionability");
    expect(result.home.quietHomeDecision.blockedPreventionRefs.join("|")).toContain(
      "capability_lease_stale",
    );
  });
});
