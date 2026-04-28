import {
  createBatchedCapacityImportAdapter,
  createManualCapacityBoardAdapter,
  createNativeApiFeedCapacityAdapter,
  createPartnerScheduleSyncCapacityAdapter,
  createPhase5NetworkCapacityPipelineService,
  createPhase5NetworkCapacityPipelineStore,
  type BuildNetworkCandidateSnapshotInput,
  type CapacitySourceTrustRecordInput,
  type HubCapacityAdapterBindingSnapshot,
  type HubCapacityRawSupplyRow,
  type HubCapacitySourceMode,
  type ManageCapabilityState,
  type Phase5NetworkCapacityPipelineRepositories,
} from "../../packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts";
import {
  createPhase5EnhancedAccessPolicyService,
  createPhase5EnhancedAccessPolicyStore,
} from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";
import { setupClaimedHubCase } from "./315_hub_case.helpers.ts";
import { buildEnhancedAccessPolicyCompileInput } from "./317_enhanced_access_policy.helpers.ts";

const BASE_TIME = Date.parse("2026-04-23T10:00:00.000Z");

export function atMinute(minuteOffset: number): string {
  return new Date(BASE_TIME + minuteOffset * 60_000).toISOString();
}

export function buildTrustRecord(
  seed: string,
  posture: "trusted" | "degraded" | "quarantined",
  overrides: Partial<CapacitySourceTrustRecordInput> = {},
): CapacitySourceTrustRecordInput {
  const baseline: Record<
    "trusted" | "degraded" | "quarantined",
    CapacitySourceTrustRecordInput
  > = {
    trusted: {
      sourceTrustRef: `trust_${seed}_trusted`,
      trustLowerBound: 0.92,
      completenessState: "complete",
      hardBlock: false,
      observedTrustState: "trusted",
      evaluatedAt: atMinute(4),
      reviewDueAt: atMinute(64),
      sourceRefs: ["phase0:assurance_slice_trust_record"],
    },
    degraded: {
      sourceTrustRef: `trust_${seed}_degraded`,
      trustLowerBound: 0.63,
      completenessState: "partial",
      hardBlock: false,
      observedTrustState: "degraded",
      evaluatedAt: atMinute(4),
      reviewDueAt: atMinute(64),
      sourceRefs: ["phase0:assurance_slice_trust_record"],
    },
    quarantined: {
      sourceTrustRef: `trust_${seed}_quarantined`,
      trustLowerBound: 0.18,
      completenessState: "blocked",
      hardBlock: true,
      observedTrustState: "quarantined",
      evaluatedAt: atMinute(4),
      reviewDueAt: atMinute(64),
      sourceRefs: ["phase0:assurance_slice_trust_record"],
    },
  };
  return {
    ...baseline[posture],
    ...overrides,
  };
}

export function buildCapacityRow(
  seed: string,
  name: string,
  startMinute: number,
  endMinute: number,
  overrides: Partial<HubCapacityRawSupplyRow> = {},
): HubCapacityRawSupplyRow {
  return {
    upstreamSlotRef: `slot_${seed}_${name}`,
    capacityUnitRef: `capacity_unit_${seed}_${name}`,
    siteId: `site_${seed}_${name}`,
    siteLabel: `Site ${name}`,
    timezone: "Europe/London",
    modality: "in_person",
    clinicianType: "general_practice",
    startAt: atMinute(startMinute),
    endAt: atMinute(endMinute),
    manageCapabilityState: "network_manage_ready",
    accessibilityFitScore: 0.9,
    travelMinutes: 18,
    sourceRefs: [`fixture:${name}`],
    ...overrides,
  };
}

export function buildBinding(
  seed: string,
  sourceMode: HubCapacitySourceMode,
  trustPosture: "trusted" | "degraded" | "quarantined",
  capacityRows: readonly HubCapacityRawSupplyRow[],
  overrides: Partial<HubCapacityAdapterBindingSnapshot> = {},
): HubCapacityAdapterBindingSnapshot {
  return {
    bindingRef: `binding_${seed}_${sourceMode}`,
    sourceMode,
    sourceRef: `source_${seed}_${sourceMode}`,
    sourceIdentity: `identity_${seed}_${sourceMode}`,
    sourceVersion: `v1_${seed}_${sourceMode}`,
    fetchedAt: atMinute(5),
    trustRecord: buildTrustRecord(`${seed}_${sourceMode}`, trustPosture),
    capacityRows,
    sourceRefs: [`binding:${sourceMode}`],
    ...overrides,
  };
}

export function buildDefaultBindings(seed: string): readonly HubCapacityAdapterBindingSnapshot[] {
  return [
    buildBinding(
      seed,
      "native_api_feed",
      "trusted",
      [
        buildCapacityRow(seed, "trusted_required", 18, 48, {
          travelMinutes: 120,
          accessibilityFitScore: 0.24,
        }),
        buildCapacityRow(seed, "trusted_outside", 330, 360, {
          travelMinutes: 12,
        }),
      ],
      {
        sourceVersion: `native_v1_${seed}`,
      },
    ),
    buildBinding(seed, "partner_schedule_sync", "degraded", [
      buildCapacityRow(seed, "degraded_required", 19, 49, {
        travelMinutes: 22,
      }),
    ]),
    buildBinding(seed, "manual_capacity_board", "trusted", [
      buildCapacityRow(seed, "trusted_variance", 22, 52, {
        capacityUnitRef: `capacity_unit_${seed}_trusted_variance`,
        siteId: `site_${seed}_trusted_variance`,
        siteLabel: "Variance Site",
        travelMinutes: 6,
        accessibilityFitScore: 1,
        manageCapabilityState: "read_only",
      }),
    ]),
    buildBinding(seed, "batched_capacity_import", "quarantined", [
      buildCapacityRow(seed, "quarantined_required", 17, 47, {
        capacityUnitRef: `capacity_unit_${seed}_quarantined_required`,
        siteId: `site_${seed}_quarantined_required`,
        siteLabel: "Quarantine Site",
        travelMinutes: 16,
      }),
    ]),
  ];
}

export function buildCollisionBindings(seed: string): readonly HubCapacityAdapterBindingSnapshot[] {
  const sharedCapacityUnit = `capacity_unit_${seed}_collision`;
  return [
    buildBinding(seed, "native_api_feed", "trusted", [
      buildCapacityRow(seed, "collision_native", 18, 48, {
        capacityUnitRef: sharedCapacityUnit,
        siteId: `site_${seed}_collision`,
        siteLabel: "Collision Site",
      }),
    ]),
    buildBinding(seed, "partner_schedule_sync", "degraded", [
      buildCapacityRow(seed, "collision_partner", 18, 48, {
        capacityUnitRef: sharedCapacityUnit,
        siteId: `site_${seed}_collision`,
        siteLabel: "Collision Site",
      }),
    ]),
  ];
}

export function buildSnapshotCommand(
  seed: string,
  overrides: Partial<BuildNetworkCandidateSnapshotInput> = {},
): BuildNetworkCandidateSnapshotInput {
  return {
    hubCoordinationCaseId: `hub_case_${seed}`,
    evaluatedAt: atMinute(6),
    adapterBindings: buildDefaultBindings(seed),
    adjustedPopulation: 2_000,
    deliveredMinutes: 90,
    cancelledMinutes: 30,
    replacementMinutes: 15,
    cancellationServiceDate: atMinute(30),
    sourceRefs: ["blueprint/phase-5-the-network-horizon.md#5C"],
    ...overrides,
  };
}

export async function setupNetworkCapacityHarness(seed = "318") {
  const hub = await setupClaimedHubCase(seed);
  const policyRepositories = createPhase5EnhancedAccessPolicyStore();
  const policyService = createPhase5EnhancedAccessPolicyService({
    repositories: policyRepositories,
    hubCaseService: hub.service,
  });
  await policyService.compileEnhancedAccessPolicy({
    ...buildEnhancedAccessPolicyCompileInput(seed, hub.claimed.hubCase.servingPcnId, {
      effectiveAt: atMinute(0),
    }),
    effectiveAt: atMinute(0),
  });

  const repositories = createPhase5NetworkCapacityPipelineStore();
  const service = createPhase5NetworkCapacityPipelineService({
    repositories,
    hubCaseService: hub.service,
    policyService,
    adapters: [
      createNativeApiFeedCapacityAdapter(),
      createPartnerScheduleSyncCapacityAdapter(),
      createManualCapacityBoardAdapter(),
      createBatchedCapacityImportAdapter(),
    ],
  });

  return {
    ...hub,
    policyRepositories,
    policyService,
    repositories: repositories as Phase5NetworkCapacityPipelineRepositories,
    service,
  };
}

export type { ManageCapabilityState };
