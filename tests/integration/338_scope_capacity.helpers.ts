import {
  createPhase5ActingScopeVisibilityService,
  createPhase5ActingScopeVisibilityStore,
} from "../../packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts";
import {
  atMinute,
  buildBootstrapStaffCommand,
} from "./316_hub_scope_visibility.helpers.ts";

export type VisibilityAudienceTier338 =
  | "hub_desk_visibility"
  | "origin_practice_visibility"
  | "servicing_site_visibility";

export const SECRET_VISIBILITY_FIELDS_338 = [
  "hub_internal_free_text",
  "broad_narrative_without_promotion",
  "origin_practice_triage_notes",
] as const;

export const EXPECTED_VISIBLE_FIELDS_338: Record<
  VisibilityAudienceTier338,
  readonly string[]
> = {
  hub_desk_visibility: [
    "clinical_routing_summary",
    "governed_coordination_evidence",
    "operational_timing_needs",
    "requestLineageRef",
    "selected_candidate_ref",
    "travel_access_constraints",
  ],
  origin_practice_visibility: [
    "ack_generation_state",
    "fallback_reason_code",
    "latest_continuity_delta",
    "macro_booking_status",
    "patient_communication_state",
    "requestLineageRef",
  ],
  servicing_site_visibility: [
    "confirmed_slot_summary",
    "encounter_delivery_brief",
    "manage_capability_state",
    "site_local_capacity",
  ],
};

function visibilityTierInput(
  audienceTierRef: VisibilityAudienceTier338,
  seed: string,
) {
  switch (audienceTierRef) {
    case "origin_practice_visibility":
      return {
        activeOrganisation: `ODS_${seed}`,
        purposeOfUse: "practice_continuity" as const,
        sourceOrganisationRef: `ODS_${seed}`,
        targetOrganisationRef: `ODS_${seed}`,
      };
    case "servicing_site_visibility":
      return {
        activeOrganisation: `hub_org_${seed}`,
        purposeOfUse: "direct_care_site_delivery" as const,
        sourceOrganisationRef: `ODS_${seed}`,
        targetOrganisationRef: `hub_org_${seed}`,
      };
    case "hub_desk_visibility":
    default:
      return {
        activeOrganisation: `hub_org_${seed}`,
        purposeOfUse: "direct_care_network_coordination" as const,
        sourceOrganisationRef: `ODS_${seed}`,
        targetOrganisationRef: `hub_org_${seed}`,
      };
  }
}

export function buildVisibilityPayload338() {
  return {
    requestLineageRef: "request_lineage_338_scope_capacity",
    macro_booking_status: "booked",
    fallback_reason_code: "no_local_capacity",
    patient_communication_state: "sent",
    latest_continuity_delta: "delta",
    ack_generation_state: 1,
    clinical_routing_summary: { priorityBand: "urgent" },
    operational_timing_needs: { dueAt: atMinute(20) },
    travel_access_constraints: { travelMode: "public_transport" },
    governed_coordination_evidence: { proof: "present" },
    selected_candidate_ref: "candidate_338",
    encounter_delivery_brief: { slot: "slot_338" },
    site_local_capacity: { site: "site_338" },
    confirmed_slot_summary: "slot_338",
    manage_capability_state: "manage",
    hub_internal_free_text: "secret",
    broad_narrative_without_promotion: "secret",
    origin_practice_triage_notes: "secret",
  };
}

export async function materializeVisibilityProjection338(
  audienceTierRef: VisibilityAudienceTier338,
  seed: string,
) {
  const service = createPhase5ActingScopeVisibilityService({
    repositories: createPhase5ActingScopeVisibilityStore(),
  });
  const input = visibilityTierInput(audienceTierRef, seed);
  const bootstrap = await service.bootstrapActingContextFromAuthenticatedStaff(
    buildBootstrapStaffCommand(seed, {
      audienceTierRef,
      activeOrganisation: input.activeOrganisation,
      purposeOfUse: input.purposeOfUse,
    }),
  );
  const envelope = await service.materializeCurrentCrossOrganisationVisibilityEnvelope({
    actingContextId: bootstrap.actingContext.actingContextId,
    sourceOrganisationRef: input.sourceOrganisationRef,
    targetOrganisationRef: input.targetOrganisationRef,
    requiredCoverageRowRefs: [`coverage_row_${seed}`],
    generatedAt: atMinute(1),
  });
  const projection = await service.applyMinimumNecessaryProjection(
    envelope.crossOrganisationVisibilityEnvelopeId,
    buildVisibilityPayload338(),
  );

  return {
    service,
    bootstrap,
    envelope,
    projection,
  };
}

