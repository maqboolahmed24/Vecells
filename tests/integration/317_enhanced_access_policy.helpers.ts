import {
  createPhase5EnhancedAccessPolicyService,
  createPhase5EnhancedAccessPolicyStore,
  phase5PolicyEvaluationScopes,
  type CompileEnhancedAccessPolicyInput,
  type NetworkPolicyEvaluationResult,
  type Phase5EnhancedAccessPolicyStore,
  type PolicyEvaluationFactsSnapshot,
} from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";
import { setupClaimedHubCase } from "./315_hub_case.helpers.ts";

const BASE_TIME = Date.parse("2026-04-23T14:00:00.000Z");

export function atMinute(minuteOffset: number): string {
  return new Date(BASE_TIME + minuteOffset * 60_000).toISOString();
}

export function buildEnhancedAccessPolicyCompileInput(
  seed: string,
  pcnRef: string,
  overrides: Partial<CompileEnhancedAccessPolicyInput> = {},
): CompileEnhancedAccessPolicyInput {
  return {
    policyVersion: `317.policy.${seed}.v1`,
    effectiveAt: atMinute(0),
    effectiveUntil: null,
    pcnRef,
    networkStandardHours: {
      weekdayStartLocal: "18:30",
      weekdayEndLocal: "20:00",
      saturdayStartLocal: "09:00",
      saturdayEndLocal: "17:00",
    },
    sameDayOnlineBookingRule: "same_day_online_no_triage_when_routine_and_offerable",
    rankPlanVersionRef: "312.rank-plan.network-candidate.v1",
    uncertaintyModelVersionRef: "312.uncertainty-model.network-candidate.v1",
    sourceRefs: [
      "blueprint/phase-5-the-network-horizon.md#5C",
      "docs/architecture/312_phase5_policy_capacity_and_candidate_ranking_contract.md",
    ],
    routingPolicyPack: {
      routingPolicyPackId: `routing_pack_${seed}`,
      policyVersion: `routing.${seed}.v1`,
      routeReasonCode: "network_standard_hours_gap",
      routingDisposition: "route_to_network",
      eligibleSiteRefs: [`hub_site_${seed}_b`, `hub_site_${seed}_a`],
      serviceFamilyRefs: ["routine_gp"],
      sourceNamespaceRefs: ["native_api", "im1"],
      commissionerApprovalRef: null,
      sourceRefs: ["des:8.6.4", "blueprint:5C"],
    },
    varianceWindowPolicy: {
      varianceWindowPolicyId: `variance_pack_${seed}`,
      policyVersion: `variance.${seed}.v1`,
      requiredWindowRule: "inside_required_or_approved_variance_only",
      approvedVarianceBeforeMinutes: 120,
      approvedVarianceAfterMinutes: 240,
      outsideWindowVisibleByPolicy: true,
      varianceDisposition: "inside_required_window",
      sourceRefs: ["des:8.6.4", "blueprint:5C"],
    },
    serviceObligationPolicy: {
      serviceObligationPolicyId: `service_pack_${seed}`,
      policyVersion: `service.${seed}.v1`,
      weeklyMinutesPer1000AdjustedPopulation: 60,
      bankHolidayMakeUpWindowHours: 336,
      comparableOfferRule: "preserve_local_first_when_clinically_equivalent",
      ledgerMode: "minutes_ledger_required",
      serviceObligationDisposition: "within_obligation",
      sourceRefs: ["des:8.6.5", "des:8.6.8", "blueprint:5C"],
    },
    practiceVisibilityPolicy: {
      practiceVisibilityPolicyId: `visibility_pack_${seed}`,
      policyVersion: `visibility.${seed}.v1`,
      minimumNecessaryContractRef: `min_necessary_hub_to_origin_${seed}_v1`,
      originPracticeVisibleFieldRefs: ["macro_status", "continuity_delta", "ack_state"],
      hiddenFieldRefs: ["hub_free_text", "cross_site_capacity_detail"],
      visibilityDeltaRule: "delta_on_material_change",
      ackGenerationMode: "generation_bound_with_exception",
      practiceVisibilityDisposition: "standard_origin_visibility",
      sourceRefs: [
        "docs/security/313_phase5_truth_tuple_ack_generation_and_minimum_necessary_rules.md",
        "blueprint:5C",
      ],
    },
    capacityIngestionPolicy: {
      capacityIngestionPolicyId: `capacity_pack_${seed}`,
      policyVersion: `capacity.${seed}.v1`,
      freshnessThresholdMinutes: 15,
      staleThresholdMinutes: 30,
      quarantineTriggers: ["supplier_drift", "trust_quarantine"],
      degradedTriggers: ["partial_feed", "late_snapshot"],
      duplicateCapacityCollisionPolicy: "keep_one_live_candidate_per_capacity_unit",
      degradedVisibilityModes: ["callback_only_reasoning"],
      patientOfferableTrustStates: ["trusted"],
      directCommitTrustStates: ["trusted"],
      capacityAdmissionDisposition: "trusted_admitted",
      sourceRefs: ["blueprint:5C", "phase0:assurance_slice_trust_record"],
    },
    ...overrides,
  };
}

export function buildTrustedPolicyFacts(
  seed: string,
  overrides: Partial<PolicyEvaluationFactsSnapshot> = {},
): PolicyEvaluationFactsSnapshot {
  return {
    routeToNetworkRequested: true,
    urgentBounceRequired: false,
    requiredWindowFit: 2,
    sourceAdmissionSummary: [
      {
        sourceRef: `im1_${seed}`,
        sourceTrustState: "trusted",
        candidateCount: 2,
      },
      {
        sourceRef: `native_api_${seed}`,
        sourceTrustState: "trusted",
        candidateCount: 4,
      },
    ],
    staleCapacityDetected: false,
    adjustedPopulation: 8000,
    deliveredMinutes: 620,
    availableMinutes: 700,
    cancelledMinutes: 0,
    replacementMinutes: 0,
    commissionerExceptionRef: null,
    minimumNecessaryContractRef: `min_necessary_hub_to_origin_${seed}_v1`,
    ackDebtOpen: false,
    visibilityDeltaRequired: false,
    ...overrides,
  };
}

export function buildDegradedPolicyFacts(
  seed: string,
  overrides: Partial<PolicyEvaluationFactsSnapshot> = {},
): PolicyEvaluationFactsSnapshot {
  return {
    routeToNetworkRequested: true,
    urgentBounceRequired: false,
    requiredWindowFit: 0,
    sourceAdmissionSummary: [
      {
        sourceRef: `im1_${seed}`,
        sourceTrustState: "quarantined",
        candidateCount: 1,
      },
      {
        sourceRef: `native_api_${seed}`,
        sourceTrustState: "degraded",
        candidateCount: 3,
      },
    ],
    staleCapacityDetected: false,
    adjustedPopulation: 8000,
    deliveredMinutes: 200,
    availableMinutes: 180,
    cancelledMinutes: 120,
    replacementMinutes: 0,
    commissionerExceptionRef: null,
    minimumNecessaryContractRef: `wrong_contract_${seed}`,
    ackDebtOpen: true,
    visibilityDeltaRequired: true,
    ...overrides,
  };
}

export async function setupEnhancedAccessPolicyHarness(seed = "317") {
  const hub = await setupClaimedHubCase(seed);
  const repositories = createPhase5EnhancedAccessPolicyStore();
  const policyService = createPhase5EnhancedAccessPolicyService({
    repositories,
    hubCaseService: hub.service,
  });
  const compileInput = buildEnhancedAccessPolicyCompileInput(
    seed,
    hub.claimed.hubCase.servingPcnId,
  );
  const compiled = await policyService.compileEnhancedAccessPolicy(compileInput);

  return {
    ...hub,
    repositories,
    policyService,
    compileInput,
    compiled,
  };
}

export async function evaluateAcrossAllScopes(
  harness: {
    claimed: {
      hubCase: {
        hubCoordinationCaseId: string;
        servingPcnId: string;
      };
    };
    policyService: {
      evaluateHubCaseAcrossScopes(input: {
        hubCoordinationCaseId: string;
        pcnRef: string;
        evaluationScopes: readonly (typeof phase5PolicyEvaluationScopes)[number][];
        evaluatedAt: string;
        presentedPolicyTupleHash?: string | null;
        facts?: Partial<PolicyEvaluationFactsSnapshot>;
      }): Promise<readonly NetworkPolicyEvaluationResult[]>;
    };
  },
  evaluatedAt: string,
  facts: PolicyEvaluationFactsSnapshot,
): Promise<readonly NetworkPolicyEvaluationResult[]> {
  return harness.policyService.evaluateHubCaseAcrossScopes({
    hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
    pcnRef: harness.claimed.hubCase.servingPcnId,
    evaluationScopes: phase5PolicyEvaluationScopes,
    evaluatedAt,
    facts,
  });
}

export type { Phase5EnhancedAccessPolicyStore };
