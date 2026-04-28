import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type CapturePharmacyOutcomeInput,
  type ChoosePharmacyProviderInput,
  type ClosePharmacyCaseInput,
  type CreatePharmacyCaseInput,
  type DispatchPharmacyReferralInput,
  type EvaluatePharmacyCaseInput,
  type PharmacyCaseMutationResult,
  type PharmacyCaseSnapshot,
  type PharmacyPathwayCode,
  type PharmacyServiceType,
  type ReopenPharmacyCaseInput,
  type ReservePharmacyCaseMutationAuthorityInput,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_344 =
  "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts" as const;

const BASE_TIME = Date.parse("2026-04-23T09:00:00.000Z");

function atMinute(offset: number): string {
  return new Date(BASE_TIME + offset * 60_000).toISOString();
}

export function ref<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily,
    refId,
    ownerTask,
  };
}

export function buildCreatePharmacyCaseCommand(
  seed = "346",
  overrides: Partial<CreatePharmacyCaseInput> = {},
): CreatePharmacyCaseInput {
  return {
    pharmacyCaseId: `pharmacy_case_${seed}`,
    lineageCaseLinkId: `pharmacy_lineage_${seed}`,
    episodeRef: ref("Episode", `episode_${seed}`, TASK_342),
    originRequestId: `request_${seed}`,
    requestLineageRef: ref("RequestLineage", `request_lineage_${seed}`, TASK_342),
    parentLineageCaseLinkRef: `triage_lineage_${seed}`,
    originTaskId: `triage_task_${seed}`,
    pharmacyIntentId: `pharmacy_intent_${seed}`,
    sourceDecisionEpochRef: ref("DecisionEpoch", `decision_epoch_${seed}`, TASK_342),
    sourceDecisionSupersessionRef: null,
    patientRef: ref("Patient", `patient_${seed}`, TASK_342),
    tenantId: `tenant_${seed}`,
    serviceType: "clinical_pathway_consultation",
    candidatePathway: "acute_sore_throat_5_plus",
    leaseRef: ref("RequestLifecycleLease", `lease_${seed}_1`, TASK_342),
    initialOwnershipEpoch: 1,
    lineageFenceRef: ref("LineageFence", `lineage_fence_${seed}_1`, TASK_342),
    slaTargetAt: atMinute(240),
    actorRef: `actor_${seed}`,
    commandActionRecordRef: `create_action_${seed}`,
    commandSettlementRecordRef: `create_settlement_${seed}`,
    scopedMutationGateRef: `scoped_gate_${seed}_create`,
    scopedMutationGateState: "admitted",
    createdAt: atMinute(0),
    idempotencyKey: `create_case_${seed}`,
    ...overrides,
  };
}

export function buildAuthorityCommand<T extends { actorRef: string; commandActionRecordRef: string; commandSettlementRecordRef: string; recordedAt: string; leaseRef: AggregateRef<"RequestLifecycleLease", typeof TASK_342>; expectedOwnershipEpoch: number; expectedLineageFenceRef: AggregateRef<"LineageFence", typeof TASK_342>; scopedMutationGateRef: string; reasonCode: string; }>(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  step: string,
  minuteOffset: number,
  overrides: Partial<T> = {},
): T {
  return {
    actorRef: `actor_${seed}`,
    commandActionRecordRef: `action_${seed}_${step}`,
    commandSettlementRecordRef: `settlement_${seed}_${step}`,
    recordedAt: atMinute(minuteOffset),
    leaseRef: pharmacyCase.leaseRef,
    expectedOwnershipEpoch: pharmacyCase.ownershipEpoch,
    expectedLineageFenceRef: pharmacyCase.lineageFenceRef,
    scopedMutationGateRef: `scoped_gate_${seed}_${step}`,
    reasonCode: step,
    ...overrides,
  } as T;
}

export function buildEvaluateCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<EvaluatePharmacyCaseInput> = {},
): EvaluatePharmacyCaseInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    ...buildAuthorityCommand<EvaluatePharmacyCaseInput>(
      pharmacyCase,
      seed,
      "evaluate",
      1,
      {},
    ),
    serviceType: pharmacyCase.serviceType,
    candidatePathway: pharmacyCase.candidatePathway as PharmacyPathwayCode | null,
    eligibilityRef: ref(
      "PathwayEligibilityEvaluation",
      `eligibility_${seed}`,
      TASK_342,
    ),
    evaluationOutcome: "eligible",
    idempotencyKey: `evaluate_${seed}`,
    ...overrides,
  };
}

export function buildChooseProviderCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<ChoosePharmacyProviderInput> = {},
): ChoosePharmacyProviderInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    ...buildAuthorityCommand<ChoosePharmacyProviderInput>(
      pharmacyCase,
      seed,
      "choose_provider",
      2,
      {},
    ),
    choiceSessionRef: ref("PharmacyChoiceSession", `choice_session_${seed}`, TASK_343),
    selectedProviderRef: ref("PharmacyProvider", `provider_${seed}`, TASK_343),
    activeConsentRef: ref("PharmacyConsentRecord", `consent_${seed}`, TASK_343),
    activeConsentCheckpointRef: ref(
      "PharmacyConsentCheckpoint",
      `checkpoint_${seed}`,
      TASK_343,
    ),
    latestConsentRevocationRef: null,
    checkpointState: "satisfied",
    finalizePackageReady: true,
    idempotencyKey: `choose_provider_${seed}`,
    ...overrides,
  };
}

export function buildDispatchCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<DispatchPharmacyReferralInput> = {},
): DispatchPharmacyReferralInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    ...buildAuthorityCommand<DispatchPharmacyReferralInput>(
      pharmacyCase,
      seed,
      "dispatch",
      3,
      {},
    ),
    activeConsentCheckpointRef: ref(
      "PharmacyConsentCheckpoint",
      `checkpoint_${seed}`,
      TASK_343,
    ),
    activeDispatchAttemptRef: ref(
      "PharmacyDispatchAttempt",
      `dispatch_attempt_${seed}`,
      TASK_343,
    ),
    correlationRef: ref("CorrelationRecord", `correlation_${seed}`, TASK_343),
    checkpointState: "satisfied",
    dispatchProofState: "confirmed",
    latestConsentRevocationRef: null,
    currentConfirmationGateRefs: [],
    idempotencyKey: `dispatch_${seed}`,
    ...overrides,
  };
}

export function buildCaptureOutcomeCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<CapturePharmacyOutcomeInput> = {},
): CapturePharmacyOutcomeInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    ...buildAuthorityCommand<CapturePharmacyOutcomeInput>(
      pharmacyCase,
      seed,
      "capture_outcome",
      4,
      {},
    ),
    outcomeRef: ref(
      "PharmacyOutcomeSettlement",
      `outcome_settlement_${seed}`,
      TASK_343,
    ),
    correlationRef: ref("CorrelationRecord", `correlation_${seed}`, TASK_343),
    disposition: "resolved_by_pharmacy",
    bounceBackRef: null,
    currentClosureBlockerRefs: [],
    activeReachabilityDependencyRefs: [],
    idempotencyKey: `capture_outcome_${seed}`,
    ...overrides,
  };
}

export function buildReopenCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<ReopenPharmacyCaseInput> = {},
): ReopenPharmacyCaseInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    ...buildAuthorityCommand<ReopenPharmacyCaseInput>(
      pharmacyCase,
      seed,
      "reopen",
      5,
      {},
    ),
    reopenToStatus: "candidate_received",
    clearOutcomeRef: true,
    clearBounceBackRef: true,
    currentClosureBlockerRefs: [],
    activeReachabilityDependencyRefs: [],
    idempotencyKey: `reopen_${seed}`,
    ...overrides,
  };
}

export function buildCloseCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<ClosePharmacyCaseInput> = {},
): ClosePharmacyCaseInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    ...buildAuthorityCommand<ClosePharmacyCaseInput>(
      pharmacyCase,
      seed,
      "close",
      5,
      {},
    ),
    closeDecisionRef: `close_decision_${seed}`,
    lifecycleCloseApproved: true,
    idempotencyKey: `close_${seed}`,
    ...overrides,
  };
}

export function buildReserveAuthorityCommand(
  pharmacyCase: PharmacyCaseSnapshot,
  seed: string,
  overrides: Partial<ReservePharmacyCaseMutationAuthorityInput> = {},
): ReservePharmacyCaseMutationAuthorityInput {
  return {
    pharmacyCaseId: pharmacyCase.pharmacyCaseId,
    actorRef: `actor_${seed}`,
    commandActionRecordRef: `action_${seed}_reserve`,
    commandSettlementRecordRef: `settlement_${seed}_reserve`,
    recordedAt: atMinute(6),
    currentLeaseRef: pharmacyCase.leaseRef,
    currentOwnershipEpoch: pharmacyCase.ownershipEpoch,
    currentLineageFenceRef: pharmacyCase.lineageFenceRef,
    scopedMutationGateRef: `scoped_gate_${seed}_reserve`,
    scopedMutationGateState: "admitted",
    nextLeaseRef: ref("RequestLifecycleLease", `lease_${seed}_2`, TASK_342),
    nextOwnershipEpoch: pharmacyCase.ownershipEpoch + 1,
    nextLineageFenceRef: ref("LineageFence", `lineage_fence_${seed}_2`, TASK_342),
    reasonCode: "reserve_authority",
    ...overrides,
  };
}

export async function setupEvaluatedEligibleCase(seed = "346_setup") {
  const repositories = createPhase6PharmacyCaseKernelStore();
  const service = createPhase6PharmacyCaseKernelService({ repositories });

  const created = await service.createPharmacyCase(buildCreatePharmacyCaseCommand(seed));
  const evaluated = await service.evaluatePharmacyCase(
    buildEvaluateCommand(created.pharmacyCase, seed),
  );

  return {
    repositories,
    service,
    created,
    evaluated,
  };
}

export async function progressCaseToResolved(seed = "346_resolved") {
  const { repositories, service, created, evaluated } = await setupEvaluatedEligibleCase(seed);
  const chosen = await service.choosePharmacyProvider(
    buildChooseProviderCommand(evaluated.pharmacyCase, seed),
  );
  const dispatched = await service.dispatchPharmacyReferral(
    buildDispatchCommand(chosen.pharmacyCase, seed),
  );
  const resolved = await service.capturePharmacyOutcome(
    buildCaptureOutcomeCommand(dispatched.pharmacyCase, seed),
  );

  return {
    repositories,
    service,
    created,
    evaluated,
    chosen,
    dispatched,
    resolved,
  };
}

export type PharmacyKernelService = ReturnType<typeof createPhase6PharmacyCaseKernelService>;
export type PharmacyMutationResult = PharmacyCaseMutationResult;
