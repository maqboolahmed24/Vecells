import { describe, expect, it } from "vitest";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3CallbackKernelService,
  createPhase3CallbackKernelStore,
  evaluateCallbackResolutionDecision,
  resolveCallbackAttemptWindowPolicy,
  resolveCallbackVoicemailPolicy,
} from "../src/index.ts";

function createCallbackCaseInput(seed: string) {
  return {
    callbackCaseId: `callback_case_${seed}`,
    sourceTriageTaskRef: `task_${seed}`,
    callbackSeedRef: `callback_seed_${seed}`,
    episodeRef: `episode_${seed}`,
    requestId: `request_${seed}`,
    requestLineageRef: `lineage_${seed}`,
    lineageCaseLinkRef: `lineage_case_link_${seed}`,
    decisionEpochRef: `decision_epoch_${seed}`,
    decisionId: `decision_${seed}`,
    initialCaseState: "queued" as const,
    callbackUrgencyRef: "routine_same_day",
    preferredWindowRef: "after_18_00",
    serviceWindowRef: "service_window_daytime",
    contactRouteRef: "route_mobile_primary",
    fallbackRouteRef: "route_mobile_secondary",
    retryPolicyRef: "retry_policy_callback_standard",
    createdAt: "2026-04-17T09:00:00.000Z",
    initialIntentLease: {
      callbackIntentLeaseId: `callback_intent_lease_${seed}`,
      requestLifecycleLeaseRef: `request_lifecycle_lease_${seed}`,
      leaseAuthorityRef: "lease_authority_callback_case",
      ownedByActorRef: `actor_${seed}`,
      ownedBySessionRef: `session_${seed}`,
      serviceWindowRef: "service_window_daytime",
      contactRouteRef: "route_mobile_primary",
      routeIntentBindingRef: `route_intent_callback_${seed}`,
      lineageFenceEpoch: 7,
      ownershipEpoch: 3,
      fencingToken: `fencing_${seed}`,
      leaseMode: "queued" as const,
      lastHeartbeatAt: "2026-04-17T09:00:00.000Z",
      staleOwnerRecoveryRef: null,
      expiresAt: "2026-04-17T09:30:00.000Z",
    },
    initialExpectationEnvelope: {
      expectationEnvelopeId: `callback_expectation_${seed}_1`,
      identityRepairBranchDispositionRef: null,
      patientVisibleState: "queued" as const,
      expectedWindowRef: "callback_window_after_18_00_service_window_daytime",
      windowLowerAt: "2026-04-17T18:00:00.000Z",
      windowUpperAt: "2026-04-17T20:00:00.000Z",
      windowRiskState: "on_track" as const,
      stateConfidenceBand: "medium" as const,
      predictionModelRef: "callback_attempt_window_policy_243.v1",
      fallbackGuidanceRef: "CALLBACK_243_WINDOW_ACTIVE",
      grantSetRef: null,
      routeIntentBindingRef: `route_intent_callback_${seed}`,
      requiredReleaseApprovalFreezeRef: null,
      channelReleaseFreezeState: "open",
      requiredAssuranceSliceTrustRefs: [],
      transitionEnvelopeRef: `transition_envelope_${seed}_1`,
      continuityEvidenceRef: `continuity_evidence_${seed}_1`,
      causalToken: `causal_${seed}_1`,
      freezeDispositionRef: null,
      expectationReasonRef: "CALLBACK_243_WINDOW_ACTIVE",
      createdAt: "2026-04-17T09:00:00.000Z",
    },
  };
}

describe("phase 3 callback kernel", () => {
  it("creates one callback case and reuses it when the same callback seed is replayed", async () => {
    const repositories = createPhase3CallbackKernelStore();
    const service = createPhase3CallbackKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_callback_case_replay"),
    });

    const first = await service.createCallbackCase(createCallbackCaseInput("replay"));
    const replay = await service.createCallbackCase(createCallbackCaseInput("replay"));
    const cases = await service.listCallbackCasesForTask("task_replay");

    expect(first.reusedExisting).toBe(false);
    expect(replay.reusedExisting).toBe(true);
    expect(first.bundle.callbackCase.callbackCaseId).toBe(replay.bundle.callbackCase.callbackCaseId);
    expect(cases).toHaveLength(1);
    expect(first.bundle.currentIntentLease?.leaseMode).toBe("queued");
  });

  it("makes each callback attempt exclusive and returns the same CallbackAttemptRecord for duplicate initiation", async () => {
    const repositories = createPhase3CallbackKernelStore();
    const service = createPhase3CallbackKernelService(repositories, {
      idGenerator: createDeterministicBackboneIdGenerator("phase3_callback_attempt_replay"),
    });

    await service.createCallbackCase(createCallbackCaseInput("attempt"));
    await service.scheduleCallback({
      callbackCaseRef: "callback_case_attempt",
      nextCaseState: "scheduled",
      callbackUrgencyRef: "routine_same_day",
      preferredWindowRef: "after_18_00",
      fallbackRouteRef: "route_mobile_secondary",
      intentLease: {
        callbackIntentLeaseId: "callback_intent_lease_attempt",
        requestLifecycleLeaseRef: "request_lifecycle_lease_attempt",
        leaseAuthorityRef: "lease_authority_callback_case",
        ownedByActorRef: "actor_attempt",
        ownedBySessionRef: "session_attempt",
        serviceWindowRef: "service_window_daytime",
        contactRouteRef: "route_mobile_primary",
        routeIntentBindingRef: "route_intent_callback_attempt",
        lineageFenceEpoch: 7,
        ownershipEpoch: 3,
        fencingToken: "fencing_attempt",
        leaseMode: "scheduled",
        caseVersionRef: "ignored_by_service",
        lastHeartbeatAt: "2026-04-17T09:02:00.000Z",
        staleOwnerRecoveryRef: null,
        expiresAt: "2026-04-17T09:32:00.000Z",
        monotoneRevision: 1,
      },
      expectationEnvelope: {
        expectationEnvelopeId: "callback_expectation_attempt_1b",
        identityRepairBranchDispositionRef: null,
        patientVisibleState: "scheduled",
        expectedWindowRef: "callback_window_after_18_00_service_window_daytime",
        windowLowerAt: "2026-04-17T18:00:00.000Z",
        windowUpperAt: "2026-04-17T20:00:00.000Z",
        windowRiskState: "on_track",
        stateConfidenceBand: "medium",
        predictionModelRef: "callback_attempt_window_policy_243.v1",
        fallbackGuidanceRef: "CALLBACK_243_WINDOW_ACTIVE",
        grantSetRef: null,
        routeIntentBindingRef: "route_intent_callback_attempt",
        requiredReleaseApprovalFreezeRef: null,
        channelReleaseFreezeState: "open",
        requiredAssuranceSliceTrustRefs: [],
        transitionEnvelopeRef: "transition_envelope_attempt_1b",
        continuityEvidenceRef: "continuity_evidence_attempt_1b",
        causalToken: "causal_attempt_1b",
        freezeDispositionRef: null,
        expectationReasonRef: "CALLBACK_243_EXPECTATION_SCHEDULED",
        createdAt: "2026-04-17T09:02:00.000Z",
      },
      recordedAt: "2026-04-17T09:02:00.000Z",
    });
    await service.armCallbackReadyForAttempt({
      callbackCaseRef: "callback_case_attempt",
      nextCaseState: "ready_for_attempt",
      intentLease: {
        callbackIntentLeaseId: "callback_intent_lease_attempt",
        requestLifecycleLeaseRef: "request_lifecycle_lease_attempt",
        leaseAuthorityRef: "lease_authority_callback_case",
        ownedByActorRef: "actor_attempt",
        ownedBySessionRef: "session_attempt",
        serviceWindowRef: "service_window_daytime",
        contactRouteRef: "route_mobile_primary",
        routeIntentBindingRef: "route_intent_callback_attempt",
        lineageFenceEpoch: 7,
        ownershipEpoch: 3,
        fencingToken: "fencing_attempt",
        leaseMode: "ready_for_attempt",
        caseVersionRef: "ignored_by_service",
        lastHeartbeatAt: "2026-04-17T09:05:00.000Z",
        staleOwnerRecoveryRef: null,
        expiresAt: "2026-04-17T09:35:00.000Z",
        monotoneRevision: 1,
      },
      expectationEnvelope: {
        expectationEnvelopeId: "callback_expectation_attempt_2",
        identityRepairBranchDispositionRef: null,
        patientVisibleState: "scheduled",
        expectedWindowRef: "callback_window_after_18_00_service_window_daytime",
        windowLowerAt: "2026-04-17T18:00:00.000Z",
        windowUpperAt: "2026-04-17T20:00:00.000Z",
        windowRiskState: "on_track",
        stateConfidenceBand: "medium",
        predictionModelRef: "callback_attempt_window_policy_243.v1",
        fallbackGuidanceRef: "CALLBACK_243_WINDOW_ACTIVE",
        grantSetRef: null,
        routeIntentBindingRef: "route_intent_callback_attempt",
        requiredReleaseApprovalFreezeRef: null,
        channelReleaseFreezeState: "open",
        requiredAssuranceSliceTrustRefs: [],
        transitionEnvelopeRef: "transition_envelope_attempt_2",
        continuityEvidenceRef: "continuity_evidence_attempt_2",
        causalToken: "causal_attempt_2",
        freezeDispositionRef: null,
        expectationReasonRef: "CALLBACK_243_WINDOW_ACTIVE",
        createdAt: "2026-04-17T09:05:00.000Z",
      },
      recordedAt: "2026-04-17T09:05:00.000Z",
    });

    const first = await service.initiateCallbackAttempt({
      callbackCaseRef: "callback_case_attempt",
      nextCaseState: "attempt_in_progress",
      attempt: {
        callbackAttemptRecordId: "callback_attempt_attempt",
        callbackIntentLeaseRef: "callback_intent_lease_attempt",
        requestLifecycleLeaseRef: "request_lifecycle_lease_attempt",
        attemptOrdinal: 1,
        attemptFenceEpoch: 7,
        ownershipEpochRef: 3,
        fencingToken: "fencing_attempt",
        dialTargetRef: "contact_route_mobile_primary",
        channelProviderRef: "telephony_provider_simulator",
        commandActionRecordRef: "command_action_attempt",
        idempotencyRecordRef: "idempotency_record_attempt",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_attempt",
        adapterEffectKey: "callback_attempt::callback_case_attempt::7::contact_route_mobile_primary",
        latestReceiptCheckpointRef: null,
        latestReceiptDecisionClass: null,
        initiatedAt: "2026-04-17T09:06:00.000Z",
        settlementState: "initiated",
        idempotencyKey: "idempotency_attempt",
      },
      expectationEnvelope: {
        expectationEnvelopeId: "callback_expectation_attempt_3",
        identityRepairBranchDispositionRef: null,
        patientVisibleState: "attempting_now",
        expectedWindowRef: "callback_window_after_18_00_service_window_daytime",
        windowLowerAt: "2026-04-17T18:00:00.000Z",
        windowUpperAt: "2026-04-17T20:00:00.000Z",
        windowRiskState: "on_track",
        stateConfidenceBand: "medium",
        predictionModelRef: "callback_attempt_window_policy_243.v1",
        fallbackGuidanceRef: "CALLBACK_243_WINDOW_ACTIVE",
        grantSetRef: null,
        routeIntentBindingRef: "route_intent_callback_attempt",
        requiredReleaseApprovalFreezeRef: null,
        channelReleaseFreezeState: "open",
        requiredAssuranceSliceTrustRefs: [],
        transitionEnvelopeRef: "transition_envelope_attempt_3",
        continuityEvidenceRef: "continuity_evidence_attempt_3",
        causalToken: "causal_attempt_3",
        freezeDispositionRef: null,
        expectationReasonRef: "CALLBACK_243_WINDOW_ACTIVE",
        createdAt: "2026-04-17T09:06:00.000Z",
      },
      recordedAt: "2026-04-17T09:06:00.000Z",
    });
    const replay = await service.initiateCallbackAttempt({
      callbackCaseRef: "callback_case_attempt",
      nextCaseState: "attempt_in_progress",
      attempt: {
        callbackAttemptRecordId: "callback_attempt_attempt_replayed",
        callbackIntentLeaseRef: "callback_intent_lease_attempt",
        requestLifecycleLeaseRef: "request_lifecycle_lease_attempt",
        attemptOrdinal: 1,
        attemptFenceEpoch: 7,
        ownershipEpochRef: 3,
        fencingToken: "fencing_attempt",
        dialTargetRef: "contact_route_mobile_primary",
        channelProviderRef: "telephony_provider_simulator",
        commandActionRecordRef: "command_action_attempt_replayed",
        idempotencyRecordRef: "idempotency_record_attempt_replayed",
        adapterDispatchAttemptRef: "adapter_dispatch_attempt_attempt_replayed",
        adapterEffectKey: "callback_attempt::callback_case_attempt::7::contact_route_mobile_primary",
        latestReceiptCheckpointRef: null,
        latestReceiptDecisionClass: null,
        initiatedAt: "2026-04-17T09:06:30.000Z",
        settlementState: "initiated",
        idempotencyKey: "idempotency_attempt_replayed",
      },
      expectationEnvelope: {
        expectationEnvelopeId: "callback_expectation_attempt_4",
        identityRepairBranchDispositionRef: null,
        patientVisibleState: "attempting_now",
        expectedWindowRef: "callback_window_after_18_00_service_window_daytime",
        windowLowerAt: "2026-04-17T18:00:00.000Z",
        windowUpperAt: "2026-04-17T20:00:00.000Z",
        windowRiskState: "on_track",
        stateConfidenceBand: "medium",
        predictionModelRef: "callback_attempt_window_policy_243.v1",
        fallbackGuidanceRef: "CALLBACK_243_WINDOW_ACTIVE",
        grantSetRef: null,
        routeIntentBindingRef: "route_intent_callback_attempt",
        requiredReleaseApprovalFreezeRef: null,
        channelReleaseFreezeState: "open",
        requiredAssuranceSliceTrustRefs: [],
        transitionEnvelopeRef: "transition_envelope_attempt_4",
        continuityEvidenceRef: "continuity_evidence_attempt_4",
        causalToken: "causal_attempt_4",
        freezeDispositionRef: null,
        expectationReasonRef: "CALLBACK_243_WINDOW_ACTIVE",
        createdAt: "2026-04-17T09:06:30.000Z",
      },
      recordedAt: "2026-04-17T09:06:30.000Z",
    });

    expect(first.reusedExistingAttempt).toBe(false);
    expect(replay.reusedExistingAttempt).toBe(true);
    expect(first.callbackAttempt.callbackAttemptRecordId).toBe(
      replay.callbackAttempt.callbackAttemptRecordId,
    );
    expect(first.bundle.callbackCase.attemptCounter).toBe(1);
  });

  it("resolves voicemail policy with safe defaults and requires explicit evidence before voicemail_left can count", () => {
    const ambiguous = resolveCallbackVoicemailPolicy({
      pathwayRef: "routine_callback",
      tenantPolicyRef: null,
      callbackUrgencyRef: "routine_same_day",
      explicitPermissionState: "unknown",
      containsClinicalContent: false,
      verifiedTargetState: "unknown",
    });
    const allowed = resolveCallbackVoicemailPolicy({
      pathwayRef: "admin_callback",
      tenantPolicyRef: "tenant_callback_voicemail_policy",
      callbackUrgencyRef: "routine_same_day",
      explicitPermissionState: "granted",
      containsClinicalContent: false,
      verifiedTargetState: "verified",
    });

    expect(ambiguous.voicemailAllowedState).toBe("ambiguous");
    expect(ambiguous.completionDisposition).toBe("evidence_only");
    expect(allowed.voicemailAllowedState).toBe("allowed");
    expect(allowed.requiredEvidenceRefs).toEqual(
      expect.arrayContaining([
        "CALLBACK_243_VOICEMAIL_RECORDING_CAPTURED",
        "CALLBACK_243_VOICEMAIL_SCRIPT_ATTESTED",
      ]),
    );
  });

  it("evaluates attempt-window and resolution rules for retry, escalation, and completion", () => {
    const policy = resolveCallbackAttemptWindowPolicy({
      callbackUrgencyRef: "routine_same_day",
      preferredWindowRef: "after_18_00",
      serviceWindowRef: "service_window_daytime",
      routeAuthorityState: "current",
      recordedAt: "2026-04-17T09:00:00.000Z",
    });
    const retry = evaluateCallbackResolutionDecision({
      latestAttemptOrdinal: 1,
      maxAttempts: 3,
      outcome: "no_answer",
      routeAuthorityState: "current",
      safetyPreemptionState: "clear",
      expectationWindowUpperAt: policy.windowUpperAt,
      evaluatedAt: "2026-04-17T09:15:00.000Z",
    });
    const escalate = evaluateCallbackResolutionDecision({
      latestAttemptOrdinal: 3,
      maxAttempts: 3,
      outcome: "provider_failure",
      routeAuthorityState: "current",
      safetyPreemptionState: "clear",
      expectationWindowUpperAt: policy.windowUpperAt,
      evaluatedAt: "2026-04-17T09:15:00.000Z",
    });
    const complete = evaluateCallbackResolutionDecision({
      latestAttemptOrdinal: 1,
      maxAttempts: 3,
      outcome: "answered",
      routeAuthorityState: "current",
      safetyPreemptionState: "clear",
      expectationWindowUpperAt: policy.windowUpperAt,
      evaluatedAt: "2026-04-17T09:15:00.000Z",
    });

    expect(policy.windowLowerAt).toBe("2026-04-17T18:00:00.000Z");
    expect(retry.decision).toBe("retry");
    expect(escalate.decision).toBe("escalate");
    expect(complete.decision).toBe("complete");
  });
});
