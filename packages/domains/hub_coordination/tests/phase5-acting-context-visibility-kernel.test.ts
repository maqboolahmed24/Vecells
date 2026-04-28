import { describe, expect, it } from "vitest";

import {
  createPhase5ActingScopeVisibilityService,
  createPhase5ActingScopeVisibilityStore,
} from "../src/phase5-acting-context-visibility-kernel.ts";
import {
  atMinute,
  buildBootstrapStaffCommand,
} from "../../../../tests/integration/316_hub_scope_visibility.helpers.ts";

describe("phase5 acting context and visibility kernel", () => {
  it("boots a CIS2-backed acting context and supersedes the previous tuple when the organisation changes", async () => {
    const service = createPhase5ActingScopeVisibilityService({
      repositories: createPhase5ActingScopeVisibilityStore(),
    });

    const bootstrapped = await service.bootstrapActingContextFromAuthenticatedStaff(
      buildBootstrapStaffCommand("316_unit_switch"),
    );
    const switched = await service.reissueActingContext({
      actingContextId: bootstrapped.actingContext.actingContextId,
      requestedAt: atMinute(5),
      environmentRef: "ptl",
      policyPlaneRef: "policy_plane_316_v1",
      nextActiveOrganisationRef: "ODS_316_unit_switch",
      nextPurposeOfUse: "practice_continuity",
      nextAudienceTierRef: "origin_practice_visibility",
      nextVisibilityCoverageRef: "coverage_practice_316_unit_switch",
    });

    expect(bootstrapped.actingContext.scopeTupleHash).not.toBe(switched.actingContext.scopeTupleHash);
    expect(switched.actingContext.switchGeneration).toBe(1);
    expect(switched.supersededActingScopeTuple?.tupleState).toBe("superseded");
    expect(switched.actingContext.activeOrganisationRef).toBe("ODS_316_unit_switch");
    expect(switched.actingContext.minimumNecessaryContractRef).toBe(
      "MinimumNecessaryContract.origin_practice",
    );
  });

  it("materializes minimum-necessary hub projections without leaking hidden fields", async () => {
    const service = createPhase5ActingScopeVisibilityService({
      repositories: createPhase5ActingScopeVisibilityStore(),
    });
    const bootstrapped = await service.bootstrapActingContextFromAuthenticatedStaff(
      buildBootstrapStaffCommand("316_unit_projection"),
    );
    const envelope = await service.materializeCurrentCrossOrganisationVisibilityEnvelope({
      actingContextId: bootstrapped.actingContext.actingContextId,
      sourceOrganisationRef: "ODS_316_unit_projection",
      targetOrganisationRef: "hub_org_316_unit_projection",
      requiredCoverageRowRefs: ["coverage_row_316_unit_projection"],
      generatedAt: atMinute(1),
    });

    const projection = await service.applyMinimumNecessaryProjection(envelope.crossOrganisationVisibilityEnvelopeId, {
      requestLineageRef: "request_lineage_316_unit_projection",
      clinical_routing_summary: { priorityBand: "priority" },
      operational_timing_needs: { dueAt: atMinute(10) },
      travel_access_constraints: { travelMode: "public_transport" },
      governed_coordination_evidence: { bookingEvidenceRef: "booking_evidence_316_unit_projection" },
      selected_candidate_ref: "candidate_316_unit_projection",
      broad_narrative_without_promotion: "should_not_render",
      attachment_payload_without_break_glass: "should_not_render",
    });

    expect(Object.keys(projection.visibleFields).sort()).toEqual([
      "clinical_routing_summary",
      "governed_coordination_evidence",
      "operational_timing_needs",
      "requestLineageRef",
      "selected_candidate_ref",
      "travel_access_constraints",
    ]);
    expect(projection.visibleFields).not.toHaveProperty("broad_narrative_without_promotion");
    expect(projection.withheldFieldRefs).toContain("attachment_payload_without_break_glass");
    expect(projection.placeholderContractRef).toBe("HubOutOfScopePlaceholder.hub_desk");
  });

  it("revokes writable posture immediately when break-glass is revoked", async () => {
    const service = createPhase5ActingScopeVisibilityService({
      repositories: createPhase5ActingScopeVisibilityStore(),
    });
    const bootstrapped = await service.bootstrapActingContextFromAuthenticatedStaff(
      buildBootstrapStaffCommand("316_unit_breakglass"),
    );
    const activated = await service.activateBreakGlass({
      actingContextId: bootstrapped.actingContext.actingContextId,
      activatedAt: atMinute(2),
      expiresAt: atMinute(12),
      reasonCode: "patient_safety_immediate",
      justification: "Clinical risk requires immediate cross-org review.",
      routeFamilyRef: "hub_case_detail",
    });
    const revoked = await service.revokeBreakGlass({
      actingContextId: activated.actingContext.actingContextId,
      revokedAt: atMinute(3),
      reasonCode: "session_terminated",
      revokedBy: "supervisor_316_unit_breakglass",
    });
    const drift = await service.detectActingScopeDrift({
      actingContextId: revoked.actingContext.actingContextId,
      asOf: atMinute(4),
      presentedScopeTupleHash: revoked.actingContext.scopeTupleHash,
      observedActiveOrganisationRef: "hub_org_316_unit_breakglass",
      observedTenantScopeMode: "organisation_group",
      observedTenantScopeRefs: ["ODS_316_unit_breakglass", "hub_org_316_unit_breakglass"],
      observedEnvironmentRef: "ptl",
      observedPolicyPlaneRef: "policy_plane_316_v1",
      observedPurposeOfUse: "break_glass_patient_safety",
    });

    expect(revoked.actingContext.breakGlassState).toBe("revoked");
    expect(revoked.actingContext.contextState).toBe("blocked");
    expect(drift.driftClasses).toContain("break_glass_revocation");
    expect(drift.recommendedContextState).toBe("blocked");
  });
});
