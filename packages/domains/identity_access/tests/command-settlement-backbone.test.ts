import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createCommandSettlementAuthorityService,
  createCommandSettlementStore,
  createLeaseFenceCommandAuthorityService,
  validateCommandSettlementAgainstActionRecords,
  validateCommandSettlementCalmReturnLaw,
  validateCommandSettlementRevisionChain,
} from "../src/index.ts";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

async function seedAction(seed: string) {
  const repositories = createCommandSettlementStore();
  const episode = EpisodeAggregate.create({
    episodeId: `episode_${seed}`,
    episodeFingerprint: `fp_${seed}`,
    openedAt: "2026-04-12T19:00:00Z",
  });
  const request = RequestAggregate.create({
    requestId: `request_${seed}`,
    episodeId: episode.episodeId,
    originEnvelopeRef: `envelope_${seed}`,
    promotionRecordRef: `promotion_${seed}`,
    tenantId: "tenant_072",
    sourceChannel: "support_assisted_capture",
    originIngressRecordRef: `ingress_${seed}`,
    normalizedSubmissionRef: `normalized_${seed}`,
    requestType: "clinical_question",
    requestLineageRef: `lineage_${seed}`,
    createdAt: "2026-04-12T19:00:00Z",
  });
  await repositories.saveEpisode(episode);
  await repositories.saveRequest(request);
  const leaseAuthority = createLeaseFenceCommandAuthorityService(
    repositories,
    createDeterministicBackboneIdGenerator(`par072_lease_${seed}`),
  );
  const settlementAuthority = createCommandSettlementAuthorityService(
    repositories,
    createDeterministicBackboneIdGenerator(`par072_settlement_${seed}`),
  );
  const acquired = await leaseAuthority.acquireLease({
    requestId: request.requestId,
    episodeId: episode.episodeId,
    requestLineageRef: request.requestLineageRef,
    domain: "triage_workspace",
    domainObjectRef: `task_${seed}`,
    leaseAuthorityRef: "lease_authority_triage_workspace",
    ownerActorRef: `actor_${seed}`,
    ownerSessionRef: `session_${seed}`,
    governingObjectVersionRef: `task_${seed}@v1`,
    leaseScopeComponents: ["task_claim", "settlement"],
    leaseTtlSeconds: 300,
    acquiredAt: "2026-04-12T19:01:00Z",
    sameShellRecoveryRouteRef: `/workspace/tasks/task_${seed}/recover`,
    operatorVisibleWorkRef: `work_${seed}`,
    blockedActionScopeRefs: ["task_claim"],
  });
  const action = await leaseAuthority.registerCommandAction({
    leaseId: acquired.lease.leaseId,
    domain: "triage_workspace",
    domainObjectRef: `task_${seed}`,
    governingObjectVersionRef: `task_${seed}@v1`,
    presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
    presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
    presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
    actionScope: "task_claim",
    governingObjectRef: `task_${seed}`,
    canonicalObjectDescriptorRef: "ReviewTask",
    initiatingBoundedContextRef: "triage_workspace",
    governingBoundedContextRef: "triage_workspace",
    lineageScope: "request",
    routeIntentRef: `route_${seed}`,
    routeContractDigestRef: `digest_${seed}_v1`,
    requiredContextBoundaryRefs: [],
    parentAnchorRef: `anchor_task_${seed}`,
    edgeCorrelationId: `edge_${seed}`,
    initiatingUiEventRef: `evt_${seed}`,
    initiatingUiEventCausalityFrameRef: `frame_${seed}`,
    actingContextRef: "staff_workspace",
    policyBundleRef: "policy_triage_v1",
    sourceCommandId: `cmd_${seed}`,
    transportCorrelationId: `transport_${seed}`,
    semanticPayload: { seed },
    idempotencyKey: `idem_${seed}`,
    idempotencyRecordRef: `idem_record_${seed}`,
    commandFollowingTokenRef: `follow_${seed}`,
    expectedEffectSetRefs: ["task.updated"],
    causalToken: `cause_${seed}`,
    createdAt: "2026-04-12T19:01:10Z",
    sameShellRecoveryRouteRef: `/workspace/tasks/task_${seed}/recover`,
    operatorVisibleWorkRef: `work_${seed}`,
    blockedActionScopeRefs: ["task_claim"],
    detectedByRef: `actor_${seed}`,
  });

  return {
    repositories,
    leaseAuthority,
    settlementAuthority,
    action: action.actionRecord,
  };
}

describe("command settlement backbone", () => {
  it("appends monotone settlement revisions without creating competing heads", async () => {
    const { repositories, settlementAuthority, action } = await seedAction("072_monotone");
    const pending = await settlementAuthority.recordSettlement({
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "pending",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "unobserved",
      authoritativeOutcomeState: "pending",
      authoritativeProofClass: "not_yet_authoritative",
      recordedAt: "2026-04-12T19:01:20Z",
      staleAfterAt: "2026-04-12T19:03:20Z",
    });
    const settled = await settlementAuthority.recordSettlement({
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "externally_accepted",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "projection_visible",
      projectionVisibilityRef: "projection://072_monotone",
      auditRecordRef: "audit://072_monotone",
      quietEligibleAt: "2026-04-12T19:01:42Z",
      recordedAt: "2026-04-12T19:01:40Z",
    });

    expect(pending.priorSettlement).toBeNull();
    expect(settled.priorSettlement?.settlementId).toBe(pending.settlement.settlementId);
    expect(settled.settlement.toSnapshot().settlementRevision).toBe(2);

    const settlements = await repositories.listCommandSettlementRecords();
    validateCommandSettlementRevisionChain(settlements);
    validateCommandSettlementAgainstActionRecords({
      settlements,
      actions: await repositories.listCommandActionRecords(),
    });
  });

  it("rejects calm success when authoritative proof and quiet eligibility are missing", async () => {
    const { settlementAuthority, action } = await seedAction("072_invalid_calm");
    await expect(
      settlementAuthority.recordSettlement({
        actionRecordRef: action.actionRecordId,
        replayDecisionClass: "distinct",
        result: "applied",
        processingAcceptanceState: "externally_accepted",
        externalObservationState: "projection_visible",
        authoritativeOutcomeState: "settled",
        authoritativeProofClass: "not_yet_authoritative",
        recordedAt: "2026-04-12T19:02:10Z",
      }),
    ).rejects.toThrow(/authoritative proof|quietEligibleAt/i);
  });

  it("requires same-shell recovery and preserved anchor context for recoverable outcomes", async () => {
    const { repositories, settlementAuthority, action } = await seedAction("072_recovery");
    const recovery = await settlementAuthority.recordSettlement({
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "blocked_policy",
      processingAcceptanceState: "not_started",
      externalObservationState: "recovery_observed",
      authoritativeOutcomeState: "recovery_required",
      authoritativeProofClass: "recovery_disposition",
      sameShellRecoveryRef: "/workspace/tasks/task_072_recovery/recover",
      lastSafeAnchorRef: "anchor_task_072_recovery",
      allowedSummaryTier: "summary_only",
      auditRecordRef: "audit://072_recovery",
      recordedAt: "2026-04-12T19:03:10Z",
      staleAfterAt: "2026-04-12T19:05:10Z",
    });

    validateCommandSettlementCalmReturnLaw(await repositories.listCommandSettlementRecords());
    expect(recovery.settlement.toSnapshot().sameShellRecoveryRef).toContain("/recover");

    await expect(
      settlementAuthority.recordSettlement({
        actionRecordRef: action.actionRecordId,
        replayDecisionClass: "distinct",
        result: "stale_recoverable",
        processingAcceptanceState: "not_started",
        externalObservationState: "recovery_observed",
        authoritativeOutcomeState: "stale_recoverable",
        authoritativeProofClass: "recovery_disposition",
        auditRecordRef: "audit://072_recovery_missing",
        recordedAt: "2026-04-12T19:03:20Z",
      }),
    ).rejects.toThrow(/sameShellRecoveryRef|lastSafeAnchorRef|allowedSummaryTier/i);
  });
});
