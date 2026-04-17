import { describe, expect, it } from "vitest";
import {
  EpisodeAggregate,
  createLeaseFenceCommandAuthorityService,
  createLeaseFenceCommandStore,
  validateActionRecordReconstruction,
  validateLeaseLedgerState,
} from "../src/index.ts";
import { RequestAggregate, createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

async function seedLineage() {
  const store = createLeaseFenceCommandStore();
  const episode = EpisodeAggregate.create({
    episodeId: "episode_071_primary",
    episodeFingerprint: "episode_fp_071_primary",
    openedAt: "2026-04-12T17:00:00Z",
  });
  const request = RequestAggregate.create({
    requestId: "request_071_primary",
    episodeId: episode.episodeId,
    originEnvelopeRef: "envelope_071_primary",
    promotionRecordRef: "promotion_071_primary",
    tenantId: "tenant_071",
    sourceChannel: "support_assisted_capture",
    originIngressRecordRef: "ingress_071_primary",
    normalizedSubmissionRef: "normalized_071_primary",
    requestType: "clinical_question",
    requestLineageRef: "lineage_071_primary",
    createdAt: "2026-04-12T17:00:00Z",
  });
  await store.saveEpisode(episode);
  await store.saveRequest(request);
  const authority = createLeaseFenceCommandAuthorityService(
    store,
    createDeterministicBackboneIdGenerator("par071_backbone"),
  );
  return { store, authority, episode, request };
}

function buildActionInput(input: {
  leaseId: string;
  domainObjectRef: string;
  governingObjectVersionRef: string;
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
  semanticPayload: unknown;
  idempotencyKey: string;
  idempotencyRecordRef: string;
  sourceCommandId: string;
  transportCorrelationId: string;
  createdAt: string;
}) {
  return {
    leaseId: input.leaseId,
    domain: "triage_workspace",
    domainObjectRef: input.domainObjectRef,
    governingObjectVersionRef: input.governingObjectVersionRef,
    presentedOwnershipEpoch: input.presentedOwnershipEpoch,
    presentedFencingToken: input.presentedFencingToken,
    presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
    actionScope: "task_claim",
    governingObjectRef: input.domainObjectRef,
    canonicalObjectDescriptorRef: "ReviewTask",
    initiatingBoundedContextRef: "triage_workspace",
    governingBoundedContextRef: "triage_workspace",
    lineageScope: "request",
    routeIntentRef: "route_triage_task_claim",
    routeContractDigestRef: "digest_triage_task_claim_v1",
    requiredContextBoundaryRefs: [],
    parentAnchorRef: `anchor_${input.domainObjectRef}`,
    edgeCorrelationId: `edge_${input.idempotencyKey}`,
    initiatingUiEventRef: `evt_${input.idempotencyKey}`,
    initiatingUiEventCausalityFrameRef: `frame_${input.idempotencyKey}`,
    actingContextRef: "staff_workspace",
    policyBundleRef: "policy_triage_v1",
    sourceCommandId: input.sourceCommandId,
    transportCorrelationId: input.transportCorrelationId,
    semanticPayload: input.semanticPayload,
    idempotencyKey: input.idempotencyKey,
    idempotencyRecordRef: input.idempotencyRecordRef,
    commandFollowingTokenRef: `follow_${input.idempotencyKey}`,
    expectedEffectSetRefs: ["task.claimed"],
    causalToken: `cause_${input.idempotencyKey}`,
    createdAt: input.createdAt,
    sameShellRecoveryRouteRef: `/workspace/tasks/${input.domainObjectRef}/recover`,
    operatorVisibleWorkRef: `work_${input.domainObjectRef}`,
    blockedActionScopeRefs: ["task_claim"],
    detectedByRef: "actor_triage_alpha",
  } as const;
}

describe("lease fence command backbone", () => {
  it("opens stale-owner recovery when lineage fence issuance presents a stale epoch", async () => {
    const { store, authority, episode, request } = await seedLineage();
    const acquired = await authority.acquireLease({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      requestLineageRef: request.requestLineageRef,
      domain: "triage_workspace",
      domainObjectRef: "task_071_lineage",
      leaseAuthorityRef: "lease_authority_triage_workspace",
      ownerActorRef: "actor_triage_alpha",
      ownerSessionRef: "session_triage_alpha",
      governingObjectVersionRef: "task_071_lineage@v1",
      leaseScopeComponents: ["task_claim", "queue_snapshot::fresh"],
      leaseTtlSeconds: 300,
      acquiredAt: "2026-04-12T17:01:00Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_071_lineage/recover",
      operatorVisibleWorkRef: "work_task_071_lineage",
      blockedActionScopeRefs: ["task_claim", "close"],
    });

    const currentFence = await authority.issueLineageFence({
      leaseId: acquired.lease.leaseId,
      domain: "triage_workspace",
      domainObjectRef: "task_071_lineage",
      presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      issuedFor: "close",
      issuedAt: "2026-04-12T17:01:20Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_071_lineage/recover",
      operatorVisibleWorkRef: "work_task_071_lineage",
      blockedActionScopeRefs: ["close"],
      detectedByRef: "actor_triage_alpha",
    });

    await expect(
      authority.issueLineageFence({
        leaseId: acquired.lease.leaseId,
        domain: "triage_workspace",
        domainObjectRef: "task_071_lineage",
        presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
        presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
        presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
        issuedFor: "reopen",
        issuedAt: "2026-04-12T17:01:40Z",
        sameShellRecoveryRouteRef: "/workspace/tasks/task_071_lineage/recover",
        operatorVisibleWorkRef: "work_task_071_lineage",
        blockedActionScopeRefs: ["reopen"],
        detectedByRef: "actor_triage_alpha",
      }),
    ).rejects.toThrow(/current lineage epoch/i);

    const recoveries = await store.listStaleOwnershipRecoveryRecords();
    expect(recoveries).toHaveLength(1);
    expect(recoveries[0]?.toSnapshot().recoveryReason).toBe("lineage_drift");
    expect(currentFence.currentEpoch).toBe(acquired.lineageFence.currentEpoch + 1);
  });

  it("reuses exact command tuples and supersedes changed retries for the same source command", async () => {
    const { store, authority, episode, request } = await seedLineage();
    const acquired = await authority.acquireLease({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      requestLineageRef: request.requestLineageRef,
      domain: "triage_workspace",
      domainObjectRef: "task_071_actions",
      leaseAuthorityRef: "lease_authority_triage_workspace",
      ownerActorRef: "actor_triage_alpha",
      ownerSessionRef: "session_triage_alpha",
      governingObjectVersionRef: "task_071_actions@v3",
      leaseScopeComponents: ["task_claim", "queue_snapshot::stable"],
      leaseTtlSeconds: 300,
      acquiredAt: "2026-04-12T17:02:00Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_071_actions/recover",
      operatorVisibleWorkRef: "work_task_071_actions",
      blockedActionScopeRefs: ["task_claim"],
    });

    const first = await authority.registerCommandAction(
      buildActionInput({
        leaseId: acquired.lease.leaseId,
        domainObjectRef: "task_071_actions",
        governingObjectVersionRef: "task_071_actions@v3",
        presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
        presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
        presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
        semanticPayload: { taskState: "claimed", queueRef: "priority_a" },
        idempotencyKey: "idem_071_actions_exact",
        idempotencyRecordRef: "idem_record_071_actions_exact",
        sourceCommandId: "cmd_071_actions",
        transportCorrelationId: "transport_071_actions_1",
        createdAt: "2026-04-12T17:02:10Z",
      }),
    );
    const replay = await authority.registerCommandAction(
      buildActionInput({
        leaseId: acquired.lease.leaseId,
        domainObjectRef: "task_071_actions",
        governingObjectVersionRef: "task_071_actions@v3",
        presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
        presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
        presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
        semanticPayload: { taskState: "claimed", queueRef: "priority_a" },
        idempotencyKey: "idem_071_actions_exact",
        idempotencyRecordRef: "idem_record_071_actions_exact",
        sourceCommandId: "cmd_071_actions",
        transportCorrelationId: "transport_071_actions_replay",
        createdAt: "2026-04-12T17:02:11Z",
      }),
    );
    const superseding = await authority.registerCommandAction(
      buildActionInput({
        leaseId: acquired.lease.leaseId,
        domainObjectRef: "task_071_actions",
        governingObjectVersionRef: "task_071_actions@v3",
        presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
        presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
        presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
        semanticPayload: { taskState: "claimed", queueRef: "priority_b", escalation: true },
        idempotencyKey: "idem_071_actions_changed",
        idempotencyRecordRef: "idem_record_071_actions_changed",
        sourceCommandId: "cmd_071_actions",
        transportCorrelationId: "transport_071_actions_2",
        createdAt: "2026-04-12T17:02:20Z",
      }),
    );

    expect(first.reusedExisting).toBe(false);
    expect(replay.reusedExisting).toBe(true);
    expect(replay.actionRecord.actionRecordId).toBe(first.actionRecord.actionRecordId);
    expect(superseding.reusedExisting).toBe(false);
    expect(superseding.supersededActionRecordRef).toBe(first.actionRecord.actionRecordId);

    const actions = await store.listCommandActionRecords();
    expect(actions).toHaveLength(2);
    for (const action of actions) {
      validateActionRecordReconstruction(action);
    }
    validateLeaseLedgerState({
      leases: await store.listRequestLifecycleLeases(),
      recoveries: await store.listStaleOwnershipRecoveryRecords(),
      takeovers: await store.listLeaseTakeoverRecords(),
      fences: await store.listLineageFences(),
      actions,
    });
  });

  it("rejects stale fencing tokens after takeover and records explicit recovery", async () => {
    const { store, authority, episode, request } = await seedLineage();
    const acquired = await authority.acquireLease({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      requestLineageRef: request.requestLineageRef,
      domain: "triage_workspace",
      domainObjectRef: "task_071_takeover",
      leaseAuthorityRef: "lease_authority_triage_workspace",
      ownerActorRef: "actor_triage_alpha",
      ownerWorkerRef: "worker_triage_alpha",
      governingObjectVersionRef: "task_071_takeover@v2",
      leaseScopeComponents: ["task_claim", "queue_snapshot::handoff"],
      leaseTtlSeconds: 120,
      acquiredAt: "2026-04-12T17:03:00Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_071_takeover/recover",
      operatorVisibleWorkRef: "work_task_071_takeover",
      blockedActionScopeRefs: ["task_claim", "reassign"],
    });

    const takeover = await authority.takeoverLease({
      priorLeaseId: acquired.lease.leaseId,
      domain: "triage_workspace",
      domainObjectRef: "task_071_takeover",
      requestId: request.requestId,
      episodeId: episode.episodeId,
      requestLineageRef: request.requestLineageRef,
      leaseAuthorityRef: "lease_authority_triage_workspace",
      governingObjectVersionRef: "task_071_takeover@v3",
      toOwnerActorRef: "actor_triage_supervisor",
      toOwnerWorkerRef: "worker_triage_supervisor",
      authorizedByRef: "director_triage",
      takeoverReason: "supervisor_takeover_for_stale_owner",
      leaseScopeComponents: ["task_claim", "queue_snapshot::handoff"],
      leaseTtlSeconds: 180,
      committedAt: "2026-04-12T17:03:30Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_071_takeover/recover",
      operatorVisibleWorkRef: "work_task_071_takeover",
      blockedActionScopeRefs: ["task_claim", "reassign"],
    });

    await expect(
      authority.registerCommandAction(
        buildActionInput({
          leaseId: acquired.lease.leaseId,
          domainObjectRef: "task_071_takeover",
          governingObjectVersionRef: "task_071_takeover@v2",
          presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
          presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
          presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
          semanticPayload: { taskState: "claimed", retrySource: "stale_worker" },
          idempotencyKey: "idem_071_takeover_stale",
          idempotencyRecordRef: "idem_record_071_takeover_stale",
          sourceCommandId: "cmd_071_takeover_stale",
          transportCorrelationId: "transport_071_takeover_stale",
          createdAt: "2026-04-12T17:03:40Z",
        }),
      ),
    ).rejects.toThrow(/stale/i);

    const recoveries = await store.listStaleOwnershipRecoveryRecords();
    expect(recoveries).toHaveLength(2);
    expect(recoveries.map((record) => record.toSnapshot().recoveryReason)).toEqual([
      "supervisor_takeover",
      "stale_write_rejected",
    ]);
    expect(takeover.replacementLease.toSnapshot().ownershipEpoch).toBe(
      acquired.lease.toSnapshot().ownershipEpoch + 1,
    );
    validateLeaseLedgerState({
      leases: await store.listRequestLifecycleLeases(),
      recoveries,
      takeovers: await store.listLeaseTakeoverRecords(),
      fences: await store.listLineageFences(),
      actions: await store.listCommandActionRecords(),
    });
  });
});
