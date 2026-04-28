import { buildTransitionEnvelope, type TransitionEnvelope } from "@vecells/api-contracts";
import {
  CommandActionRecordDocument,
  EpisodeAggregate,
  type CommandSettlementAuthorityService,
  type CommandSettlementDependencies,
  type CommandSettlementRecordDocument,
  type CommandSettlementRecordSnapshot,
  createCommandSettlementAuthorityService,
  createCommandSettlementStore,
  createLeaseFenceCommandAuthorityService,
  type RecordCommandSettlementResult,
} from "@vecells/domain-identity-access";
import {
  RequestAggregate,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const commandSettlementPersistenceTables = [
  "episodes",
  "requests",
  "request_lifecycle_leases",
  "stale_ownership_recovery_records",
  "lease_takeover_records",
  "lineage_fences",
  "command_action_records",
  "lease_authority_states",
  "command_settlement_records",
] as const;

export const commandSettlementMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
  "services/command-api/migrations/072_command_settlement_and_transition_envelope_library.sql",
] as const;

function mapEnvelopeFromSettlement(input: {
  actionRecord: CommandActionRecordDocument;
  settlement: CommandSettlementRecordDocument;
  localAckState: "queued" | "local_ack" | "optimistic_applied" | "superseded";
  entityRef: string;
  affectedAnchorRef: string;
  targetIntent: string;
  visibleScope: "active_shell" | "active_card" | "local_component";
  settlementPolicy: "projection_token" | "external_ack" | "manual_review";
  userVisibleMessage?: string;
}): TransitionEnvelope {
  const action = input.actionRecord.toSnapshot();
  const settlement = input.settlement.toSnapshot();
  return buildTransitionEnvelope({
    settlement: settlement as CommandSettlementRecordSnapshot,
    entityRef: input.entityRef,
    commandRef: action.actionRecordId,
    affectedAnchorRef: input.affectedAnchorRef,
    originState: action.actionScope,
    targetIntent: input.targetIntent,
    localAckState: input.localAckState,
    causalToken: action.causalToken,
    settlementPolicy: input.settlementPolicy,
    userVisibleMessage: input.userVisibleMessage,
    visibleScope: input.visibleScope,
    startedAt: action.createdAt,
    lastSafeAnchorRef: settlement.lastSafeAnchorRef ?? action.parentAnchorRef,
    allowedSummaryTier: settlement.allowedSummaryTier,
  });
}

interface SettlementSimulationScenarioResult {
  scenarioId: string;
  title: string;
  actionRecordIds: readonly string[];
  settlementIds: readonly string[];
  envelopes: readonly TransitionEnvelope[];
}

class CommandSettlementSimulationHarness {
  constructor(
    private readonly repositories: CommandSettlementDependencies,
    private readonly idNamespace = "command_settlement_simulation",
  ) {}

  async runAllScenarios(): Promise<readonly SettlementSimulationScenarioResult[]> {
    return [
      await this.runLocalAckSettledSuccessScenario(),
      await this.runAcceptedForProcessingScenario(),
      await this.runProjectionVisiblePendingScenario(),
      await this.runReviewRequiredScenario(),
      await this.runStaleRecoverableScenario(),
      await this.runBlockedAndDeniedScenario(),
      await this.runSupersededByLaterEvidenceScenario(),
    ];
  }

  private createLeaseAuthority(seed: string) {
    return createLeaseFenceCommandAuthorityService(
      this.repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_${seed}_lease`),
    );
  }

  private createSettlementAuthority(seed: string) {
    return createCommandSettlementAuthorityService(
      this.repositories,
      createDeterministicBackboneIdGenerator(`${this.idNamespace}_${seed}_settlement`),
    );
  }

  private async seedRequest(input: {
    requestId: string;
    episodeId: string;
    requestLineageRef: string;
  }): Promise<void> {
    const episode = await this.repositories.getEpisode(input.episodeId);
    if (!episode) {
      await this.repositories.saveEpisode(
        EpisodeAggregate.create({
          episodeId: input.episodeId,
          episodeFingerprint: `fp_${input.episodeId}`,
          openedAt: "2026-04-12T12:00:00Z",
        }),
      );
    }
    const request = await this.repositories.getRequest(input.requestId);
    if (!request) {
      await this.repositories.saveRequest(
        RequestAggregate.create({
          requestId: input.requestId,
          episodeId: input.episodeId,
          originEnvelopeRef: `envelope_${input.requestId}`,
          promotionRecordRef: `promotion_${input.requestId}`,
          tenantId: "tenant_072",
          sourceChannel: "support_assisted_capture",
          originIngressRecordRef: `ingress_${input.requestId}`,
          normalizedSubmissionRef: `normalized_${input.requestId}`,
          requestType: "clinical_question",
          requestLineageRef: input.requestLineageRef,
          createdAt: "2026-04-12T12:00:00Z",
        }),
      );
    }
  }

  private async createAction(
    seed: string,
    overrides?: {
      domain?: string;
      domainObjectRef?: string;
      actionScope?: string;
      routeIntentRef?: string;
      semanticPayload?: Record<string, unknown>;
      createdAt?: string;
      governingObjectVersionRef?: string;
      idempotencyKey?: string;
      sourceCommandId?: string;
    },
  ): Promise<CommandActionRecordDocument> {
    const requestId = `request_${seed}`;
    const episodeId = `episode_${seed}`;
    const requestLineageRef = `lineage_${seed}`;
    const domain = overrides?.domain ?? "triage_workspace";
    const domainObjectRef = overrides?.domainObjectRef ?? `task_${seed}`;
    const actionScope = overrides?.actionScope ?? "task_claim";
    await this.seedRequest({ requestId, episodeId, requestLineageRef });
    const authority = this.createLeaseAuthority(seed);
    const acquired = await authority.acquireLease({
      requestId,
      episodeId,
      requestLineageRef,
      domain,
      domainObjectRef,
      leaseAuthorityRef: `lease_authority_${domain}`,
      ownerActorRef: `actor_${seed}`,
      ownerSessionRef: `session_${seed}`,
      governingObjectVersionRef: overrides?.governingObjectVersionRef ?? `${domainObjectRef}@v1`,
      leaseScopeComponents: [actionScope, "settlement_window"],
      leaseTtlSeconds: 300,
      acquiredAt: "2026-04-12T12:01:00Z",
      sameShellRecoveryRouteRef: `/${domain}/${domainObjectRef}/recover`,
      operatorVisibleWorkRef: `work_${seed}`,
      blockedActionScopeRefs: [actionScope],
    });

    const action = await authority.registerCommandAction({
      leaseId: acquired.lease.leaseId,
      domain,
      domainObjectRef,
      governingObjectVersionRef: overrides?.governingObjectVersionRef ?? `${domainObjectRef}@v1`,
      presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      actionScope,
      governingObjectRef: domainObjectRef,
      canonicalObjectDescriptorRef: "ReviewTask",
      initiatingBoundedContextRef: domain,
      governingBoundedContextRef: domain,
      lineageScope: "request",
      routeIntentRef: overrides?.routeIntentRef ?? `route_${seed}`,
      routeContractDigestRef: `digest_${seed}_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: `anchor_${domainObjectRef}`,
      edgeCorrelationId: `edge_${seed}`,
      initiatingUiEventRef: `evt_${seed}`,
      initiatingUiEventCausalityFrameRef: `frame_${seed}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_v1",
      sourceCommandId: overrides?.sourceCommandId ?? `cmd_${seed}`,
      transportCorrelationId: `transport_${seed}`,
      semanticPayload: overrides?.semanticPayload ?? { claim: true, seed },
      idempotencyKey: overrides?.idempotencyKey ?? `idem_${seed}`,
      idempotencyRecordRef: `idem_record_${seed}`,
      commandFollowingTokenRef: `follow_${seed}`,
      expectedEffectSetRefs: ["task.updated"],
      causalToken: `cause_${seed}`,
      createdAt: overrides?.createdAt ?? "2026-04-12T12:01:10Z",
      sameShellRecoveryRouteRef: `/${domain}/${domainObjectRef}/recover`,
      operatorVisibleWorkRef: `work_${seed}`,
      blockedActionScopeRefs: [actionScope],
      detectedByRef: `actor_${seed}`,
    });
    return action.actionRecord;
  }

  private async recordSettlement(
    seed: string,
    actionRecord: CommandActionRecordDocument,
    input: Parameters<CommandSettlementAuthorityService["recordSettlement"]>[0],
  ): Promise<RecordCommandSettlementResult> {
    const authority = this.createSettlementAuthority(
      `${seed}_${actionRecord.actionRecordId}_${input.recordedAt}`,
    );
    return authority.recordSettlement({
      ...input,
      actionRecordRef: actionRecord.actionRecordId,
    });
  }

  private scenarioResult(input: {
    scenarioId: string;
    title: string;
    actions: readonly CommandActionRecordDocument[];
    settlements: readonly CommandSettlementRecordDocument[];
    localAckStates: readonly ("queued" | "local_ack" | "optimistic_applied" | "superseded")[];
    targetIntent: string;
    visibleScope: "active_shell" | "active_card" | "local_component";
    settlementPolicy: "projection_token" | "external_ack" | "manual_review";
  }): SettlementSimulationScenarioResult {
    const envelopes = input.settlements.map((settlement, index) => {
      const action = input.actions[Math.min(index, input.actions.length - 1)]!;
      return mapEnvelopeFromSettlement({
        actionRecord: action,
        settlement,
        localAckState: input.localAckStates[Math.min(index, input.localAckStates.length - 1)]!,
        entityRef: action.toSnapshot().governingObjectRef,
        affectedAnchorRef: action.toSnapshot().parentAnchorRef,
        targetIntent: input.targetIntent,
        visibleScope: input.visibleScope,
        settlementPolicy: input.settlementPolicy,
      });
    });
    return {
      scenarioId: input.scenarioId,
      title: input.title,
      actionRecordIds: input.actions.map((action) => action.actionRecordId),
      settlementIds: input.settlements.map((settlement) => settlement.settlementId),
      envelopes,
    };
  }

  private async runLocalAckSettledSuccessScenario(): Promise<SettlementSimulationScenarioResult> {
    const action = await this.createAction("072_local_ack");
    const pending = await this.recordSettlement("072_local_ack", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "pending",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "unobserved",
      authoritativeOutcomeState: "pending",
      authoritativeProofClass: "not_yet_authoritative",
      recordedAt: "2026-04-12T12:01:20Z",
      staleAfterAt: "2026-04-12T12:02:20Z",
    });
    const settled = await this.recordSettlement("072_local_ack", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "externally_accepted",
      externalObservationState: "external_effect_observed",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "external_confirmation",
      externalEffectRefs: ["bookingTxn://072_local_ack"],
      auditRecordRef: "audit://072_local_ack",
      quietEligibleAt: "2026-04-12T12:01:42Z",
      recordedAt: "2026-04-12T12:01:40Z",
    });
    return this.scenarioResult({
      scenarioId: "local_ack_then_settled_success",
      title: "Local acknowledgement advances to authoritative settled success.",
      actions: [action, action],
      settlements: [pending.settlement, settled.settlement],
      localAckStates: ["local_ack", "local_ack"],
      targetIntent: "quiet_return",
      visibleScope: "active_shell",
      settlementPolicy: "external_ack",
    });
  }

  private async runAcceptedForProcessingScenario(): Promise<SettlementSimulationScenarioResult> {
    const action = await this.createAction("072_processing_pending");
    const settlement = await this.recordSettlement("072_processing_pending", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "awaiting_external",
      processingAcceptanceState: "awaiting_external_confirmation",
      externalObservationState: "unobserved",
      authoritativeOutcomeState: "awaiting_external",
      authoritativeProofClass: "not_yet_authoritative",
      recordedAt: "2026-04-12T12:03:10Z",
      staleAfterAt: "2026-04-12T12:05:10Z",
    });
    return this.scenarioResult({
      scenarioId: "accepted_for_processing_pending_external_confirmation",
      title: "Accepted for processing remains pending until authoritative external confirmation.",
      actions: [action],
      settlements: [settlement.settlement],
      localAckStates: ["local_ack"],
      targetIntent: "await_confirmation",
      visibleScope: "active_shell",
      settlementPolicy: "external_ack",
    });
  }

  private async runProjectionVisiblePendingScenario(): Promise<SettlementSimulationScenarioResult> {
    const action = await this.createAction("072_projection_visible");
    const settlement = await this.recordSettlement("072_projection_visible", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "projection_pending",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "projection_pending",
      authoritativeProofClass: "not_yet_authoritative",
      projectionVisibilityRef: "projection://072_projection_visible",
      recordedAt: "2026-04-12T12:04:10Z",
      staleAfterAt: "2026-04-12T12:06:10Z",
    });
    return this.scenarioResult({
      scenarioId: "projection_visible_not_authoritative_success",
      title: "Projection visibility is not enough to claim authoritative success.",
      actions: [action],
      settlements: [settlement.settlement],
      localAckStates: ["optimistic_applied"],
      targetIntent: "hold_shell",
      visibleScope: "active_card",
      settlementPolicy: "projection_token",
    });
  }

  private async runReviewRequiredScenario(): Promise<SettlementSimulationScenarioResult> {
    const action = await this.createAction("072_review_required");
    const settlement = await this.recordSettlement("072_review_required", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "review_required",
      processingAcceptanceState: "externally_accepted",
      externalObservationState: "disputed",
      authoritativeOutcomeState: "review_required",
      authoritativeProofClass: "review_disposition",
      blockingRefs: ["review://072_review_required"],
      recordedAt: "2026-04-12T12:05:10Z",
      staleAfterAt: "2026-04-12T12:07:10Z",
    });
    return this.scenarioResult({
      scenarioId: "review_required_outcome",
      title: "Later evidence disputes the assumed path and requires review in place.",
      actions: [action],
      settlements: [settlement.settlement],
      localAckStates: ["local_ack"],
      targetIntent: "review_in_place",
      visibleScope: "active_shell",
      settlementPolicy: "manual_review",
    });
  }

  private async runStaleRecoverableScenario(): Promise<SettlementSimulationScenarioResult> {
    const seed = "072_stale_recoverable";
    const requestId = `request_${seed}`;
    const episodeId = `episode_${seed}`;
    const requestLineageRef = `lineage_${seed}`;
    const domainObjectRef = `task_${seed}`;
    await this.seedRequest({ requestId, episodeId, requestLineageRef });
    const leaseAuthority = this.createLeaseAuthority(seed);
    const acquired = await leaseAuthority.acquireLease({
      requestId,
      episodeId,
      requestLineageRef,
      domain: "triage_workspace",
      domainObjectRef,
      leaseAuthorityRef: "lease_authority_triage_workspace",
      ownerActorRef: `actor_${seed}`,
      ownerSessionRef: `session_${seed}`,
      governingObjectVersionRef: `${domainObjectRef}@v1`,
      leaseScopeComponents: ["task_claim", "settlement_window"],
      leaseTtlSeconds: 300,
      acquiredAt: "2026-04-12T12:06:00Z",
      sameShellRecoveryRouteRef: `/triage_workspace/${domainObjectRef}/recover`,
      operatorVisibleWorkRef: `work_${seed}`,
      blockedActionScopeRefs: ["task_claim"],
    });
    const original = await leaseAuthority.registerCommandAction({
      leaseId: acquired.lease.leaseId,
      domain: "triage_workspace",
      domainObjectRef,
      governingObjectVersionRef: `${domainObjectRef}@v1`,
      presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      actionScope: "task_claim",
      governingObjectRef: domainObjectRef,
      canonicalObjectDescriptorRef: "ReviewTask",
      initiatingBoundedContextRef: "triage_workspace",
      governingBoundedContextRef: "triage_workspace",
      lineageScope: "request",
      routeIntentRef: `route_${seed}`,
      routeContractDigestRef: `digest_${seed}_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: `anchor_${domainObjectRef}`,
      edgeCorrelationId: `edge_${seed}_1`,
      initiatingUiEventRef: `evt_${seed}_1`,
      initiatingUiEventCausalityFrameRef: `frame_${seed}_1`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_v1",
      sourceCommandId: "cmd_072_shared",
      transportCorrelationId: `transport_${seed}_1`,
      semanticPayload: { claim: true, queueRef: "priority_a" },
      idempotencyKey: "idem_072_stale_original",
      idempotencyRecordRef: "idem_record_072_stale_original",
      commandFollowingTokenRef: `follow_${seed}_1`,
      expectedEffectSetRefs: ["task.updated"],
      causalToken: `cause_${seed}_1`,
      createdAt: "2026-04-12T12:06:05Z",
      sameShellRecoveryRouteRef: `/triage_workspace/${domainObjectRef}/recover`,
      operatorVisibleWorkRef: `work_${seed}`,
      blockedActionScopeRefs: ["task_claim"],
      detectedByRef: `actor_${seed}`,
    });
    await leaseAuthority.registerCommandAction({
      leaseId: acquired.lease.leaseId,
      domain: "triage_workspace",
      domainObjectRef,
      governingObjectVersionRef: `${domainObjectRef}@v1`,
      presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      actionScope: "task_claim",
      governingObjectRef: domainObjectRef,
      canonicalObjectDescriptorRef: "ReviewTask",
      initiatingBoundedContextRef: "triage_workspace",
      governingBoundedContextRef: "triage_workspace",
      lineageScope: "request",
      routeIntentRef: `route_${seed}`,
      routeContractDigestRef: `digest_${seed}_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: `anchor_${domainObjectRef}`,
      edgeCorrelationId: `edge_${seed}_2`,
      initiatingUiEventRef: `evt_${seed}_2`,
      initiatingUiEventCausalityFrameRef: `frame_${seed}_2`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_v1",
      sourceCommandId: "cmd_072_shared",
      transportCorrelationId: `transport_${seed}_2`,
      semanticPayload: { claim: true, queueRef: "priority_b", drift: true },
      idempotencyKey: "idem_072_stale_superseding",
      idempotencyRecordRef: "idem_record_072_stale_superseding",
      commandFollowingTokenRef: `follow_${seed}_2`,
      expectedEffectSetRefs: ["task.updated"],
      causalToken: `cause_${seed}_2`,
      createdAt: "2026-04-12T12:06:10Z",
      sameShellRecoveryRouteRef: `/triage_workspace/${domainObjectRef}/recover`,
      operatorVisibleWorkRef: `work_${seed}`,
      blockedActionScopeRefs: ["task_claim"],
      detectedByRef: `actor_${seed}`,
    });
    const originalAction = original.actionRecord;
    const settlement = await this.recordSettlement("072_stale_recoverable", originalAction, {
      actionRecordRef: originalAction.actionRecordId,
      replayDecisionClass: "distinct",
      result: "stale_recoverable",
      processingAcceptanceState: "not_started",
      externalObservationState: "recovery_observed",
      authoritativeOutcomeState: "stale_recoverable",
      authoritativeProofClass: "recovery_disposition",
      sameShellRecoveryRef: `/recover/${originalAction.toSnapshot().governingObjectRef}`,
      lastSafeAnchorRef: originalAction.toSnapshot().parentAnchorRef,
      allowedSummaryTier: "summary_only",
      auditRecordRef: "audit://072_stale_recoverable",
      recordedAt: "2026-04-12T12:06:40Z",
      staleAfterAt: "2026-04-12T12:08:40Z",
    });
    return this.scenarioResult({
      scenarioId: "stale_recoverable_due_to_tuple_drift",
      title:
        "Tuple drift keeps the original chain recoverable instead of folding drift into success.",
      actions: [originalAction],
      settlements: [settlement.settlement],
      localAckStates: ["superseded"],
      targetIntent: "reacquire_and_retry",
      visibleScope: "active_shell",
      settlementPolicy: "manual_review",
    });
  }

  private async runBlockedAndDeniedScenario(): Promise<SettlementSimulationScenarioResult> {
    const blockedAction = await this.createAction("072_blocked_policy");
    const deniedAction = await this.createAction("072_denied_scope");
    const blocked = await this.recordSettlement("072_blocked_policy", blockedAction, {
      actionRecordRef: blockedAction.actionRecordId,
      replayDecisionClass: "distinct",
      result: "blocked_policy",
      processingAcceptanceState: "not_started",
      externalObservationState: "recovery_observed",
      authoritativeOutcomeState: "recovery_required",
      authoritativeProofClass: "recovery_disposition",
      sameShellRecoveryRef: "/recover/policy/072_blocked_policy",
      lastSafeAnchorRef: blockedAction.toSnapshot().parentAnchorRef,
      allowedSummaryTier: "summary_only",
      auditRecordRef: "audit://072_blocked_policy",
      blockingRefs: ["policy://072_blocked_policy"],
      recordedAt: "2026-04-12T12:07:10Z",
      staleAfterAt: "2026-04-12T12:09:10Z",
    });
    const denied = await this.recordSettlement("072_denied_scope", deniedAction, {
      actionRecordRef: deniedAction.actionRecordId,
      replayDecisionClass: "distinct",
      result: "denied_scope",
      processingAcceptanceState: "not_started",
      externalObservationState: "recovery_observed",
      authoritativeOutcomeState: "recovery_required",
      authoritativeProofClass: "recovery_disposition",
      sameShellRecoveryRef: "/recover/scope/072_denied_scope",
      lastSafeAnchorRef: deniedAction.toSnapshot().parentAnchorRef,
      allowedSummaryTier: "summary_only",
      auditRecordRef: "audit://072_denied_scope",
      blockingRefs: ["scope://072_denied_scope"],
      recordedAt: "2026-04-12T12:07:20Z",
      staleAfterAt: "2026-04-12T12:09:20Z",
    });
    return this.scenarioResult({
      scenarioId: "blocked_policy_and_denied_scope_recovery",
      title: "Blocked-policy and denied-scope results preserve same-shell recovery posture.",
      actions: [blockedAction, deniedAction],
      settlements: [blocked.settlement, denied.settlement],
      localAckStates: ["queued", "queued"],
      targetIntent: "governed_recovery",
      visibleScope: "active_shell",
      settlementPolicy: "manual_review",
    });
  }

  private async runSupersededByLaterEvidenceScenario(): Promise<SettlementSimulationScenarioResult> {
    const action = await this.createAction("072_superseded_evidence");
    const first = await this.recordSettlement("072_superseded_evidence", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "awaiting_external",
      processingAcceptanceState: "awaiting_external_confirmation",
      externalObservationState: "unobserved",
      authoritativeOutcomeState: "awaiting_external",
      authoritativeProofClass: "not_yet_authoritative",
      recordedAt: "2026-04-12T12:08:10Z",
      staleAfterAt: "2026-04-12T12:10:10Z",
    });
    const second = await this.recordSettlement("072_superseded_evidence", action, {
      actionRecordRef: action.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "externally_accepted",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "projection_visible",
      projectionVisibilityRef: "projection://072_superseded_evidence",
      auditRecordRef: "audit://072_superseded_evidence",
      quietEligibleAt: "2026-04-12T12:08:42Z",
      recordedAt: "2026-04-12T12:08:40Z",
    });
    return this.scenarioResult({
      scenarioId: "settlement_superseded_by_later_evidence",
      title:
        "Later evidence supersedes earlier pending settlement without creating a competing chain.",
      actions: [action, action],
      settlements: [first.settlement, second.settlement],
      localAckStates: ["local_ack", "local_ack"],
      targetIntent: "quiet_return",
      visibleScope: "active_shell",
      settlementPolicy: "projection_token",
    });
  }
}

export interface CommandSettlementApplication {
  readonly repositories: CommandSettlementDependencies;
  readonly settlementAuthority: ReturnType<typeof createCommandSettlementAuthorityService>;
  readonly leaseAuthority: ReturnType<typeof createLeaseFenceCommandAuthorityService>;
  readonly simulation: CommandSettlementSimulationHarness;
  readonly transitionLibrary: {
    readonly buildTransitionEnvelope: typeof buildTransitionEnvelope;
    readonly mapEnvelopeFromSettlement: typeof mapEnvelopeFromSettlement;
  };
  readonly migrationPlanRef: (typeof commandSettlementMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof commandSettlementMigrationPlanRefs;
}

export function createCommandSettlementApplication(options?: {
  repositories?: CommandSettlementDependencies;
  settlementIdGenerator?: BackboneIdGenerator;
  leaseIdGenerator?: BackboneIdGenerator;
}): CommandSettlementApplication {
  const repositories = options?.repositories ?? createCommandSettlementStore();
  const settlementAuthority = createCommandSettlementAuthorityService(
    repositories,
    options?.settlementIdGenerator ??
      createDeterministicBackboneIdGenerator("command_api_command_settlement"),
  );
  const leaseAuthority = createLeaseFenceCommandAuthorityService(
    repositories,
    options?.leaseIdGenerator ??
      createDeterministicBackboneIdGenerator("command_api_command_settlement_lease"),
  );
  return {
    repositories,
    settlementAuthority,
    leaseAuthority,
    simulation: new CommandSettlementSimulationHarness(repositories),
    transitionLibrary: {
      buildTransitionEnvelope,
      mapEnvelopeFromSettlement,
    },
    migrationPlanRef: commandSettlementMigrationPlanRefs[2],
    migrationPlanRefs: commandSettlementMigrationPlanRefs,
  };
}
