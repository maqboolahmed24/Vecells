import { describe, expect, it } from "vitest";
import {
  AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION,
  createAuthenticatedPortalProjectionApplication,
  authenticatedPortalProjectionMigrationPlanRefs,
  authenticatedPortalProjectionParallelInterfaceGaps,
  authenticatedPortalProjectionPersistenceTables,
} from "../src/authenticated-portal-projections.ts";

function baseRouteContext(overrides = {}) {
  return {
    subjectRef: "nhs_subject_185",
    audienceTier: "patient_authenticated",
    purposeOfUse: "authenticated_self_service",
    routeFamilyRef: "patient_requests",
    sessionEpochRef: "session_epoch_185_v1",
    expectedSessionEpochRef: "session_epoch_185_v1",
    subjectBindingVersionRef: "binding_version_185_v1",
    expectedSubjectBindingVersionRef: "binding_version_185_v1",
    routeIntentBindingRef: "route_intent_185_v1",
    expectedRouteIntentBindingRef: "route_intent_185_v1",
    lineageFenceRef: "lineage_fence_185_v1",
    expectedLineageFenceRef: "lineage_fence_185_v1",
    trustPosture: "trusted",
    commandConsistencyState: "consistent",
    coverageRowRefs: ["coverage_row_185_authenticated_request_detail"],
    observedAt: "2026-04-15T10:00:00.000Z",
    ...overrides,
  };
}

function sourceRequests(overrides = {}) {
  return [
    {
      requestRef: "request_185_a",
      requestVersionRef: "request_185_a_v1",
      requestLineageRef: "lineage_185_a",
      patientSafeLabel: "Medication request",
      publicSafeLabel: "Request update",
      statusText: "Awaiting practice review",
      bucket: "needs_attention",
      ownerSubjectRef: "nhs_subject_185",
      requiredSubjectBindingVersionRef: "binding_version_185_v1",
      requiredSessionEpochRef: "session_epoch_185_v1",
      routeIntentBindingRef: "route_intent_185_v1",
      lineageFenceRef: "lineage_fence_185_v1",
      awaitingParty: "practice",
      nextSafeActionRef: "view_request_detail",
      dominantActionRef: "respond_more_info",
      latestMeaningfulUpdateAt: "2026-04-15T09:30:00.000Z",
      evidenceSnapshotRef: "evidence_snapshot_185_a",
      evidenceSummaryParityRef: "evidence_parity_185_a",
      trustCueRef: "fresh_from_practice",
      lineageCaseLinkRefs: ["lineage_case_link_185_callback"],
      downstream: [
        {
          childType: "callback_case",
          childRef: "callback_185_a",
          patientLabelRef: "callback_expected",
          authoritativeState: "scheduled",
          awaitingParty: "practice",
          nextSafeActionRef: "wait_for_callback",
          visibilityTier: "partial",
          lastMeaningfulUpdateAt: "2026-04-15T09:20:00.000Z",
        },
        {
          childType: "conversation_cluster",
          childRef: "conversation_185_a",
          patientLabelRef: "message_thread",
          authoritativeState: "message_safe",
          awaitingParty: "patient",
          nextSafeActionRef: "reply_when_ready",
          visibilityTier: "full",
          lastMeaningfulUpdateAt: "2026-04-15T09:25:00.000Z",
        },
      ],
      communicationClusterRefs: ["conversation_185_a"],
      artifactRefs: ["artifact_placeholder_185_a"],
      commandConsistencyState: "consistent",
      ...overrides,
    },
    {
      requestRef: "request_185_b",
      requestVersionRef: "request_185_b_v1",
      requestLineageRef: "lineage_185_b",
      patientSafeLabel: "Admin question",
      publicSafeLabel: "Request update",
      statusText: "Complete",
      bucket: "complete",
      ownerSubjectRef: "nhs_subject_185",
      requiredSubjectBindingVersionRef: "binding_version_185_v1",
      requiredSessionEpochRef: "session_epoch_185_v1",
      routeIntentBindingRef: "route_intent_185_v1",
      lineageFenceRef: "lineage_fence_185_v1",
      awaitingParty: "none",
      nextSafeActionRef: null,
      dominantActionRef: null,
      latestMeaningfulUpdateAt: "2026-04-14T17:00:00.000Z",
      evidenceSnapshotRef: "evidence_snapshot_185_b",
      evidenceSummaryParityRef: "evidence_parity_185_b",
      trustCueRef: "closed",
      lineageCaseLinkRefs: [],
      downstream: [],
      communicationClusterRefs: [],
      artifactRefs: [],
      commandConsistencyState: "consistent",
    },
  ];
}

function createHarness() {
  const ownershipCalls = [];
  const application = createAuthenticatedPortalProjectionApplication({
    requestOwnership: {
      async getOwnershipContext(input) {
        ownershipCalls.push(input);
        return {
          requestLineageRef: input.requestLineageRef,
          subjectBindingVersionRef: "binding_version_185_v1",
          sessionEpochRef: "session_epoch_185_v1",
          routeIntentBindingRef: "route_intent_185_v1",
          lineageFenceRef: "lineage_fence_185_v1",
          ownershipPosture: "owned_authenticated",
          reasonCodes: ["PORTAL_185_COVERAGE_FIRST"],
        };
      },
    },
  });
  return { application, ownershipCalls };
}

describe("AuthenticatedPortalProjectionService", () => {
  it("computes coverage before portal entry and home from PatientAudienceCoverageProjection", async () => {
    const { application } = createHarness();

    const result = await application.authenticatedPortalProjectionService.resolvePortalEntry({
      ...baseRouteContext(),
      sourceRequests: sourceRequests(),
    });

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/100_phase2_authenticated_portal_projections.sql",
    );
    expect(application.migrationPlanRefs).toEqual(authenticatedPortalProjectionMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(authenticatedPortalProjectionPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(
      authenticatedPortalProjectionParallelInterfaceGaps,
    );
    expect(application.policyVersion).toBe(AUTHENTICATED_PORTAL_PROJECTION_POLICY_VERSION);
    expect(result.coverage.patientAudienceCoverageProjectionId).toBe(
      result.entry.coverageProjectionRef,
    );
    expect(result.coverage.reasonCodes).toContain("PORTAL_185_COVERAGE_FIRST");
    expect(result.entry.entryState).toBe("request_detail");
    expect(result.home.coverageProjectionRef).toBe(
      result.coverage.patientAudienceCoverageProjectionId,
    );
  });

  it("derives request list visibility from coverage rows without broad-fetch controller-local trimming", async () => {
    const { application } = createHarness();

    const publicResult = await application.authenticatedPortalProjectionService.listPatientRequests(
      {
        ...baseRouteContext({
          audienceTier: "patient_public",
          purposeOfUse: "public_status",
        }),
        sourceRequests: sourceRequests(),
      },
    );
    const authResult = await application.authenticatedPortalProjectionService.listPatientRequests({
      ...baseRouteContext(),
      sourceRequests: sourceRequests(),
    });

    expect(publicResult.coverage.communicationPreviewMode).toBe("public_safe_summary");
    expect(publicResult.summaries).toHaveLength(1);
    expect(publicResult.summaries[0].displayLabel).toBe("Request update");
    expect(publicResult.summaries[0].blockedFieldRefs).toContain("patientSafeLabel");
    expect(authResult.coverage.communicationPreviewMode).toBe("authenticated_summary");
    expect(authResult.summaries).toHaveLength(2);
    expect(authResult.summaries[0].visibleFieldRefs).toContain("lineageCaseLinkRefs");
    expect(authResult.index.requestSummaryRefs).toHaveLength(authResult.summaries.length);
  });

  it("keeps detail and communication visibility previews bound to the same coverage projection", async () => {
    const { application, ownershipCalls } = createHarness();

    const result = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext(),
      requestRef: "request_185_a",
      sourceRequests: sourceRequests(),
    });

    expect(result.detail.surfaceState).toBe("ready");
    expect(result.detail.visibleFieldRefs).toContain("communicationsPreview");
    expect(result.detail.coverageProjectionRef).toBe(
      result.coverage.patientAudienceCoverageProjectionId,
    );
    expect(result.summary.coverageProjectionRef).toBe(
      result.coverage.patientAudienceCoverageProjectionId,
    );
    expect(result.lineage.coverageProjectionRef).toBe(
      result.coverage.patientAudienceCoverageProjectionId,
    );
    expect(result.communicationVisibility[0].coverageProjectionRef).toBe(
      result.coverage.patientAudienceCoverageProjectionId,
    );
    expect(result.communicationVisibility[0].previewMode).toBe("authenticated_summary");
    expect(ownershipCalls).toHaveLength(1);
  });

  it("degrades stale session and stale binding detail routes to same-shell recovery", async () => {
    const { application } = createHarness();

    const staleSession =
      await application.authenticatedPortalProjectionService.getPatientRequestDetail({
        ...baseRouteContext({ sessionEpochRef: "session_epoch_185_stale" }),
        requestRef: "request_185_a",
        sourceRequests: sourceRequests(),
      });
    const staleBinding =
      await application.authenticatedPortalProjectionService.getPatientRequestDetail({
        ...baseRouteContext({ subjectBindingVersionRef: "binding_version_185_stale" }),
        requestRef: "request_185_a",
        sourceRequests: sourceRequests(),
      });

    expect(staleSession.detail).toBeNull();
    expect(staleSession.recovery.surfaceState).toBe("recovery_required");
    expect(staleSession.recovery.reasonCodes).toContain("PORTAL_185_STALE_SESSION_RECOVERY");
    expect(staleBinding.detail).toBeNull();
    expect(staleBinding.recovery.reasonCodes).toContain("PORTAL_185_STALE_BINDING_RECOVERY");
  });

  it("emits identity hold projection instead of PHI-bearing detail during repair", async () => {
    const { application } = createHarness();

    const result = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext({ trustPosture: "repair_hold", identityRepairCaseRef: "repair_185" }),
      requestRef: "request_185_a",
      sourceRequests: sourceRequests({
        identityRepairCaseRef: "repair_185",
        identityRepairFreezeRef: "freeze_185",
      }),
    });

    expect(result.detail).toBeNull();
    expect(result.identityHold.surfaceState).toBe("active");
    expect(result.identityHold.suppressedActionRefs).toContain("respond_more_info");
    expect(result.coverage.surfaceState).toBe("identity_hold");
    expect(result.summary.summarySafetyTier).toBe("public_safe");
  });

  it("shows command-following freshness and pending consistency placeholders instead of racing ahead after commands", async () => {
    const { application } = createHarness();

    const result = await application.authenticatedPortalProjectionService.getPatientRequestDetail({
      ...baseRouteContext({ commandConsistencyState: "pending" }),
      requestRef: "request_185_a",
      sourceRequests: sourceRequests({ commandConsistencyState: "pending" }),
    });

    expect(result.coverage.surfaceState).toBe("pending_confirmation");
    expect(result.coverage.reasonCodes).toContain("PORTAL_185_COMMAND_PENDING_CONSISTENCY");
    expect(result.detail.surfaceState).toBe("pending_confirmation");
    expect(result.detail.blockedFieldRefs).toContain("liveMutationControls");
    expect(result.detail.dominantActionRef).toBeNull();
  });
});
