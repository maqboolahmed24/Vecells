import { describe, expect, it } from "vitest";

import {
  createPhase5ActingScopeVisibilityService,
  createPhase5ActingScopeVisibilityStore,
} from "../../packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts";
import {
  atMinute,
  buildBootstrapStaffCommand,
} from "../integration/316_hub_scope_visibility.helpers.ts";

describe("316 acting context visibility properties", () => {
  it("monotonically advances switch generation and supersedes each previous tuple across repeated reissues", async () => {
    const service = createPhase5ActingScopeVisibilityService({
      repositories: createPhase5ActingScopeVisibilityStore(),
    });
    const bootstrapped = await service.bootstrapActingContextFromAuthenticatedStaff(
      buildBootstrapStaffCommand("316_property_switch"),
    );
    const firstSwitch = await service.reissueActingContext({
      actingContextId: bootstrapped.actingContext.actingContextId,
      requestedAt: atMinute(5),
      environmentRef: "ptl",
      policyPlaneRef: "policy_plane_316_v1",
      nextActiveOrganisationRef: "ODS_316_property_switch",
      nextAudienceTierRef: "origin_practice_visibility",
      nextPurposeOfUse: "practice_continuity",
      nextVisibilityCoverageRef: "coverage_practice_316_property_switch",
    });
    const secondSwitch = await service.reissueActingContext({
      actingContextId: firstSwitch.actingContext.actingContextId,
      requestedAt: atMinute(10),
      environmentRef: "ptl",
      policyPlaneRef: "policy_plane_316_v1",
      nextActiveOrganisationRef: "hub_org_316_property_switch",
      nextAudienceTierRef: "hub_desk_visibility",
      nextPurposeOfUse: "direct_care_network_coordination",
      nextVisibilityCoverageRef: "coverage_316_property_switch",
    });

    expect(bootstrapped.actingContext.switchGeneration).toBe(0);
    expect(firstSwitch.actingContext.switchGeneration).toBe(1);
    expect(secondSwitch.actingContext.switchGeneration).toBe(2);
    expect(firstSwitch.supersededActingScopeTuple?.tupleState).toBe("superseded");
    expect(secondSwitch.supersededActingScopeTuple?.tupleState).toBe("superseded");
  });

  it("never returns hidden field values from the minimum-necessary materializer for any tier", async () => {
    const service = createPhase5ActingScopeVisibilityService({
      repositories: createPhase5ActingScopeVisibilityStore(),
    });
    const payload = {
      requestLineageRef: "request_lineage_316_property_projection",
      macro_booking_status: "booked",
      fallback_reason_code: "no_local_capacity",
      patient_communication_state: "sent",
      latest_continuity_delta: "delta",
      ack_generation_state: 1,
      clinical_routing_summary: { priorityBand: "urgent" },
      operational_timing_needs: { dueAt: atMinute(20) },
      travel_access_constraints: { travelMode: "public_transport" },
      governed_coordination_evidence: { proof: "present" },
      selected_candidate_ref: "candidate",
      encounter_delivery_brief: { slot: "slot_1" },
      site_local_capacity: { site: "site_1" },
      confirmed_slot_summary: "slot_1",
      manage_capability_state: "manage",
      hub_internal_free_text: "secret",
      broad_narrative_without_promotion: "secret",
      origin_practice_triage_notes: "secret",
    };

    const tiers = [
      {
        seed: "316_property_origin",
        audienceTierRef: "origin_practice_visibility" as const,
        sourceOrganisationRef: "ODS_316_property_origin",
        targetOrganisationRef: "ODS_316_property_origin",
      },
      {
        seed: "316_property_hub",
        audienceTierRef: "hub_desk_visibility" as const,
        sourceOrganisationRef: "ODS_316_property_hub",
        targetOrganisationRef: "hub_org_316_property_hub",
      },
      {
        seed: "316_property_site",
        audienceTierRef: "servicing_site_visibility" as const,
        sourceOrganisationRef: "ODS_316_property_site",
        targetOrganisationRef: "hub_org_316_property_site",
      },
    ];

    for (const [index, tier] of tiers.entries()) {
      const bootstrapped = await service.bootstrapActingContextFromAuthenticatedStaff(
        buildBootstrapStaffCommand(tier.seed, {
          audienceTierRef: tier.audienceTierRef,
          activeOrganisation:
            tier.audienceTierRef === "origin_practice_visibility"
              ? `ODS_${tier.seed}`
              : `hub_org_${tier.seed}`,
          purposeOfUse:
            tier.audienceTierRef === "origin_practice_visibility"
              ? "practice_continuity"
              : tier.audienceTierRef === "servicing_site_visibility"
                ? "direct_care_site_delivery"
                : "direct_care_network_coordination",
        }),
      );
      const envelope = await service.materializeCurrentCrossOrganisationVisibilityEnvelope({
        actingContextId: bootstrapped.actingContext.actingContextId,
        sourceOrganisationRef: tier.sourceOrganisationRef,
        targetOrganisationRef: tier.targetOrganisationRef,
        requiredCoverageRowRefs: [`coverage_row_${tier.seed}`],
        generatedAt: atMinute(index + 1),
      });
      const projection = await service.applyMinimumNecessaryProjection(
        envelope.crossOrganisationVisibilityEnvelopeId,
        payload,
      );

      expect(Object.values(projection.visibleFields)).not.toContain("secret");
      expect(projection.withheldFieldRefs.length).toBeGreaterThan(0);
    }
  });
});
