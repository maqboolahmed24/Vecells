import {
  createPhase5ActingScopeVisibilityService,
  type BootstrapStaffActingContextInput,
  type HubCommandAuthorityInput,
  type Phase5HubMutationCommandId,
  type Phase5HubRouteFamily,
} from "../../packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts";
import {
  buildOwnedHubCommand,
  setupClaimedHubCase,
} from "./315_hub_case.helpers.ts";

const BASE_TIME = Date.parse("2026-04-23T12:00:00.000Z");

export function atMinute(minuteOffset: number): string {
  return new Date(BASE_TIME + minuteOffset * 60_000).toISOString();
}

export function buildBootstrapStaffCommand(
  seed = "316",
  overrides: Partial<BootstrapStaffActingContextInput> = {},
): BootstrapStaffActingContextInput {
  return {
    staffUserId: `staff_${seed}`,
    homeOrganisation: `ODS_${seed}`,
    homePracticeOds: `ODS_${seed}`,
    affiliatedOrganisationRefs: [`hub_org_${seed}`],
    tenantGrantRefs: [`tenant_${seed}`, `hub_org_${seed}`, `ODS_${seed}`],
    activeOrganisation: `hub_org_${seed}`,
    activePcnId: `pcn_${seed}`,
    activeHubSiteId: `hub_site_${seed}`,
    tenantScopeMode: "organisation_group",
    tenantScopeRefs: [`ODS_${seed}`, `hub_org_${seed}`],
    purposeOfUse: "direct_care_network_coordination",
    actingRoleRef: `role_profile_${seed}`,
    audienceTierRef: "hub_desk_visibility",
    visibilityCoverageRef: `coverage_${seed}`,
    sessionAssurance: "aal3",
    authenticatedAt: atMinute(0),
    expiresAt: atMinute(120),
    cis2RoleClaims: [
      {
        orgCode: `hub_org_${seed}`,
        personOrgId: `person_org_${seed}`,
        personRoleId: `role_profile_${seed}`,
        roleCode: `R8${seed.slice(-2).padStart(2, "0")}`,
        roleName: "Hub Coordinator",
        activityCodes: ["B0264"],
        aowCodes: ["A1"],
        workgroupCodes: ["WG1"],
      },
      {
        orgCode: `ODS_${seed}`,
        personOrgId: `person_org_origin_${seed}`,
        personRoleId: `practice_role_${seed}`,
        roleCode: `R9${seed.slice(-2).padStart(2, "0")}`,
        roleName: "Practice Staff",
      },
    ],
    nationalRbacRef: `national_rbac_${seed}`,
    localRoleRefs: [`role_profile_${seed}`, `practice_role_${seed}`],
    environmentRef: "ptl",
    policyPlaneRef: "policy_plane_316_v1",
    ...overrides,
  };
}

export async function setupHubScopeVisibilityHarness(seed = "316") {
  const hub = await setupClaimedHubCase(seed);
  const visibilityService = createPhase5ActingScopeVisibilityService({
    hubCaseService: hub.service,
  });
  const bootstrap = await visibilityService.bootstrapActingContextFromAuthenticatedStaff(
    buildBootstrapStaffCommand(seed),
  );
  const visibilityEnvelope =
    await visibilityService.materializeCurrentCrossOrganisationVisibilityEnvelope({
      actingContextId: bootstrap.actingContext.actingContextId,
      sourceOrganisationRef: hub.request.networkBookingRequest.originPracticeOds,
      targetOrganisationRef: bootstrap.actingContext.activeOrganisationRef,
      requiredCoverageRowRefs: [`coverage_row_${seed}`],
      generatedAt: atMinute(1),
    });

  return {
    ...hub,
    visibilityService,
    bootstrap,
    visibilityEnvelope,
  };
}

export function buildHubAuthorityCommand(
  input: {
    seed: string;
    staffIdentityContextId: string;
    actingContextId: string;
    scopeTupleHash: string;
    minimumNecessaryContractRef: string;
    visibilityEnvelopeId?: string | null;
    hubCoordinationCaseId?: string | null;
    expectedOwnershipEpoch?: number | null;
    expectedOwnershipFenceToken?: string | null;
  },
  commandId: Phase5HubMutationCommandId,
  routeId: Phase5HubRouteFamily,
  minuteOffset: number,
  overrides: Partial<HubCommandAuthorityInput> = {},
): HubCommandAuthorityInput {
  return {
    staffIdentityContextId: input.staffIdentityContextId,
    actingContextId: input.actingContextId,
    commandId,
    routeId,
    hubCoordinationCaseId: input.hubCoordinationCaseId ?? null,
    crossOrganisationVisibilityEnvelopeId: input.visibilityEnvelopeId ?? null,
    presentedScopeTupleHash: input.scopeTupleHash,
    presentedPurposeOfUse: "direct_care_network_coordination",
    presentedAudienceTierRef: "hub_desk_visibility",
    presentedMinimumNecessaryContractRef: input.minimumNecessaryContractRef,
    expectedOwnershipEpoch: input.expectedOwnershipEpoch ?? null,
    expectedOwnershipFenceToken: input.expectedOwnershipFenceToken ?? null,
    observedActiveOrganisationRef: `hub_org_${input.seed}`,
    observedTenantScopeMode: "organisation_group",
    observedTenantScopeRefs: [`ODS_${input.seed}`, `hub_org_${input.seed}`],
    observedEnvironmentRef: "ptl",
    observedPolicyPlaneRef: "policy_plane_316_v1",
    commandActionRecordRef: `authority_action_${input.seed}_${commandId}`,
    commandSettlementRecordRef: `authority_settlement_${input.seed}_${commandId}`,
    recordedAt: atMinute(minuteOffset),
    ...overrides,
  };
}

export { buildOwnedHubCommand };
