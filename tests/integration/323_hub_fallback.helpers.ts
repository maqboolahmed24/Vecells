import {
  createPhase3CallbackKernelService,
  createPhase3CallbackKernelStore,
  type CallbackExpectationEnvelopeSnapshot,
  type CallbackIntentLeaseSnapshot,
} from "../../packages/domains/triage_workspace/src/index.ts";
import {
  createPhase5HubFallbackEngineService,
  createPhase5HubFallbackStore,
  type CompleteHubFallbackInput,
  type LinkCallbackFallbackInput,
  type LinkReturnToPracticeInput,
  type Phase4WaitlistCarryForwardSnapshot,
  type Phase5CallbackLinkBridge,
  type Phase5PracticeReopenBridge,
  type ResolveNoSlotFallbackInput,
} from "../../packages/domains/hub_coordination/src/index.ts";
import {
  atMinute,
  openAndDeliverAlternativeOfferSession,
  setupAlternativeOfferHarness,
} from "./320_alternative_offer.helpers.ts";

export { atMinute };

function addMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

export function buildWaitlistCarryForward(
  seed: string,
): Phase4WaitlistCarryForwardSnapshot {
  return {
    waitlistDeadlineEvaluationRef: `waitlist_deadline_eval_${seed}`,
    waitlistFallbackObligationRef: `waitlist_fallback_obligation_${seed}`,
    waitlistContinuationTruthProjectionRef: `waitlist_continuation_truth_${seed}`,
    requiredFallbackRoute: "hub",
    triggerClass: "no_safe_laxity",
    patientVisibleState: "hub_review_pending",
    windowRiskState: "fallback_due",
    boundAt: atMinute(2),
  };
}

export function createCallbackLinkBridge(seed: string): {
  repositories: ReturnType<typeof createPhase3CallbackKernelStore>;
  service: ReturnType<typeof createPhase3CallbackKernelService>;
  bridge: Phase5CallbackLinkBridge;
} {
  const repositories = createPhase3CallbackKernelStore();
  const service = createPhase3CallbackKernelService(repositories);

  return {
    repositories,
    service,
    bridge: {
      async materializeCallbackLink(input) {
        const callbackSeedRef = `hub_fallback_${input.hubFallbackRecord.hubFallbackRecordId}`;
        const created = await service.createCallbackCase({
          callbackCaseId: `callback_case_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
          sourceTriageTaskRef: `triage_task_${seed}`,
          callbackSeedRef,
          episodeRef: input.hubCaseBundle.networkBookingRequest.episodeRef,
          requestId: input.hubCaseBundle.networkBookingRequest.originRequestId,
          requestLineageRef: input.hubCaseBundle.networkBookingRequest.requestLineageRef,
          lineageCaseLinkRef: `callback_lineage_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
          decisionEpochRef: `decision_epoch_${seed}`,
          decisionId: `decision_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
          initialCaseState: "queued",
          callbackUrgencyRef: `callback_urgency_${seed}`,
          preferredWindowRef: `preferred_window_${seed}`,
          serviceWindowRef: `service_window_${seed}`,
          contactRouteRef: `contact_route_${seed}`,
          fallbackRouteRef: input.hubFallbackRecord.hubFallbackRecordId,
          retryPolicyRef: `retry_policy_${seed}`,
          createdAt: input.recordedAt,
          initialIntentLease: {
            callbackIntentLeaseId: `callback_lease_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
            requestLifecycleLeaseRef: `request_lease_${seed}`,
            leaseAuthorityRef: `lease_authority_${seed}`,
            ownedByActorRef: `callback_owner_${seed}`,
            ownedBySessionRef: null,
            serviceWindowRef: `service_window_${seed}`,
            contactRouteRef: `contact_route_${seed}`,
            routeIntentBindingRef: `route_callback_${seed}`,
            lineageFenceEpoch: 1,
            ownershipEpoch: 1,
            fencingToken: `callback_fence_${seed}`,
            leaseMode: "queued",
            lastHeartbeatAt: input.recordedAt,
            staleOwnerRecoveryRef: null,
            expiresAt: addMinutes(input.recordedAt, 180),
          } satisfies Omit<
            CallbackIntentLeaseSnapshot,
            "callbackCaseRef" | "caseVersionRef" | "monotoneRevision" | "version"
          >,
          initialExpectationEnvelope: {
            expectationEnvelopeId: `callback_expectation_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
            identityRepairBranchDispositionRef: null,
            patientVisibleState: "queued",
            expectedWindowRef: `callback_window_${seed}`,
            windowLowerAt: input.recordedAt,
            windowUpperAt: addMinutes(input.recordedAt, 90),
            windowRiskState: "on_track",
            stateConfidenceBand: "high",
            predictionModelRef: "callback.prediction.v1",
            fallbackGuidanceRef: `callback_guidance_${seed}`,
            grantSetRef: null,
            routeIntentBindingRef: `route_callback_${seed}`,
            requiredReleaseApprovalFreezeRef: null,
            channelReleaseFreezeState: "monitoring",
            requiredAssuranceSliceTrustRefs: [`trust_ref_${seed}`],
            transitionEnvelopeRef: `transition_envelope_${seed}`,
            continuityEvidenceRef: `continuity_${seed}`,
            causalToken: `callback_causal_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
            freezeDispositionRef: null,
            expectationReasonRef: "HUB_CALLBACK_TRANSFER",
            createdAt: input.recordedAt,
          } satisfies Omit<
            CallbackExpectationEnvelopeSnapshot,
            "callbackCaseRef" | "monotoneRevision" | "version"
          >,
        });
        return {
          callbackCaseRef: created.bundle.callbackCase.callbackCaseId,
          callbackExpectationEnvelopeRef:
            created.bundle.currentExpectationEnvelope?.expectationEnvelopeId ?? null,
          linkedAt: input.recordedAt,
          createdOrReused: created.reusedExisting,
          sourceRefs: ["tests/integration/323_hub_fallback.helpers.ts"],
        };
      },
    },
  };
}

export function createPracticeReopenBridge(seed: string): {
  reopenRefs: Map<string, string>;
  bridge: Phase5PracticeReopenBridge;
} {
  const reopenRefs = new Map<string, string>();
  return {
    reopenRefs,
    bridge: {
      async materializePracticeReopen(input) {
        const workflowRef = `practice_reopen_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`;
        reopenRefs.set(input.hubFallbackRecord.hubFallbackRecordId, workflowRef);
        return {
          reopenedWorkflowRef: workflowRef,
          reopenedLineageCaseLinkRef: `triage_reopen_lineage_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
          reopenedLeaseRef: `triage_reopen_lease_${seed}_${input.hubFallbackRecord.hubFallbackRecordId}`,
          linkedAt: input.recordedAt,
          sourceRefs: ["tests/integration/323_hub_fallback.helpers.ts"],
        };
      },
    },
  };
}

export async function setupHubFallbackHarness(seed = "323") {
  const alternativeHarness = await setupAlternativeOfferHarness(seed);
  const callback = createCallbackLinkBridge(seed);
  const reopen = createPracticeReopenBridge(seed);
  const fallbackRepositories = createPhase5HubFallbackStore();
  const fallbackService = createPhase5HubFallbackEngineService({
    repositories: fallbackRepositories,
    hubCaseService: alternativeHarness.service,
    offerRepositories: alternativeHarness.offerRepositories,
    offerActions: alternativeHarness.offerService,
    callbackBridge: callback.bridge,
    practiceReopenBridge: reopen.bridge,
  });

  return {
    ...alternativeHarness,
    callbackRepositories: callback.repositories,
    callbackService: callback.service,
    callbackBridge: callback.bridge,
    practiceReopenBridge: reopen.bridge,
    reopenRefs: reopen.reopenRefs,
    fallbackRepositories,
    fallbackService,
  };
}

export function buildResolveNoSlotInput(
  harness: Awaited<ReturnType<typeof setupHubFallbackHarness>>,
  overrides: Partial<ResolveNoSlotFallbackInput> = {},
): ResolveNoSlotFallbackInput {
  const seed = harness.candidatesReady.hubCase.hubCoordinationCaseId.replace("hub_case_", "");
  return {
    hubCoordinationCaseId: harness.candidatesReady.hubCase.hubCoordinationCaseId,
    actorRef: `fallback_actor_${seed}`,
    routeIntentBindingRef: `route_fallback_${seed}`,
    commandActionRecordRef: `action_fallback_${seed}`,
    commandSettlementRecordRef: `settlement_fallback_${seed}`,
    recordedAt: atMinute(11),
    trustedAlternativeFrontierExists: false,
    degradedOnlyEvidence: false,
    callbackRequested: false,
    policyRequiresCallback: false,
    offerLeadMinutes: 45,
    callbackLeadMinutes: 20,
    bestTrustedFit: 0.28,
    trustGap: 0.62,
    pBreach: 0.74,
    newClinicalContextScore: 0,
    alternativeOfferSessionId: null,
    phase4WaitlistCarryForward: buildWaitlistCarryForward(seed),
    sourceRefs: ["tests/integration/323_hub_fallback.helpers.ts"],
    ...overrides,
  };
}

export function buildLinkCallbackInput(
  hubFallbackRecordId: string,
  seed: string,
  overrides: Partial<LinkCallbackFallbackInput> = {},
): LinkCallbackFallbackInput {
  return {
    hubFallbackRecordId,
    actorRef: `callback_link_actor_${seed}`,
    routeIntentBindingRef: `route_callback_link_${seed}`,
    commandActionRecordRef: `action_callback_link_${seed}`,
    commandSettlementRecordRef: `settlement_callback_link_${seed}`,
    recordedAt: atMinute(12),
    sourceRefs: ["tests/integration/323_hub_fallback.helpers.ts"],
    ...overrides,
  };
}

export function buildLinkReturnInput(
  hubFallbackRecordId: string,
  seed: string,
  overrides: Partial<LinkReturnToPracticeInput> = {},
): LinkReturnToPracticeInput {
  return {
    hubFallbackRecordId,
    actorRef: `return_link_actor_${seed}`,
    routeIntentBindingRef: `route_return_link_${seed}`,
    commandActionRecordRef: `action_return_link_${seed}`,
    commandSettlementRecordRef: `settlement_return_link_${seed}`,
    recordedAt: atMinute(12),
    sourceRefs: ["tests/integration/323_hub_fallback.helpers.ts"],
    ...overrides,
  };
}

export function buildCompleteFallbackInput(
  hubFallbackRecordId: string,
  seed: string,
  overrides: Partial<CompleteHubFallbackInput> = {},
): CompleteHubFallbackInput {
  return {
    hubFallbackRecordId,
    actorRef: `fallback_complete_actor_${seed}`,
    routeIntentBindingRef: `route_fallback_complete_${seed}`,
    commandActionRecordRef: `action_fallback_complete_${seed}`,
    commandSettlementRecordRef: `settlement_fallback_complete_${seed}`,
    recordedAt: atMinute(13),
    closeHubCase: true,
    closeDecisionRef: `close_decision_${seed}`,
    sourceRefs: ["tests/integration/323_hub_fallback.helpers.ts"],
    ...overrides,
  };
}

export async function openFallbackOfferSession(
  harness: Awaited<ReturnType<typeof setupHubFallbackHarness>>,
) {
  return openAndDeliverAlternativeOfferSession(harness);
}
