import { describe, expect, it } from "vitest";
import {
  createLeaseFenceCommandApplication,
  leaseFenceCommandMigrationPlanRefs,
  leaseFenceCommandPersistenceTables,
} from "../src/lease-fence-command.ts";
import { EpisodeAggregate } from "@vecells/domain-identity-access";
import { RequestAggregate } from "@vecells/domain-kernel";

describe("lease fence command application seam", () => {
  it("composes the canonical lease, fence, takeover, and action-record authority", async () => {
    const application = createLeaseFenceCommandApplication();
    const episode = EpisodeAggregate.create({
      episodeId: "episode_cmdapi_071",
      episodeFingerprint: "episode_fp_cmdapi_071",
      openedAt: "2026-04-12T18:00:00Z",
    });
    const request = RequestAggregate.create({
      requestId: "request_cmdapi_071",
      episodeId: episode.episodeId,
      originEnvelopeRef: "envelope_cmdapi_071",
      promotionRecordRef: "promotion_cmdapi_071",
      tenantId: "tenant_cmdapi_071",
      sourceChannel: "support_assisted_capture",
      originIngressRecordRef: "ingress_cmdapi_071",
      normalizedSubmissionRef: "normalized_cmdapi_071",
      requestType: "clinical_question",
      requestLineageRef: "lineage_cmdapi_071",
      createdAt: "2026-04-12T18:00:00Z",
    });
    await application.repositories.saveEpisode(episode);
    await application.repositories.saveRequest(request);

    const acquired = await application.authority.acquireLease({
      requestId: request.requestId,
      episodeId: episode.episodeId,
      requestLineageRef: request.requestLineageRef,
      domain: "triage_workspace",
      domainObjectRef: "task_cmdapi_071",
      leaseAuthorityRef: "lease_authority_triage_workspace",
      ownerActorRef: "actor_cmdapi_071",
      ownerSessionRef: "session_cmdapi_071",
      governingObjectVersionRef: "task_cmdapi_071@v1",
      leaseScopeComponents: ["task_claim", "queue_snapshot::cmdapi"],
      leaseTtlSeconds: 300,
      acquiredAt: "2026-04-12T18:01:00Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_cmdapi_071/recover",
      operatorVisibleWorkRef: "work_task_cmdapi_071",
      blockedActionScopeRefs: ["task_claim", "close"],
    });

    const action = await application.authority.registerCommandAction({
      leaseId: acquired.lease.leaseId,
      domain: "triage_workspace",
      domainObjectRef: "task_cmdapi_071",
      governingObjectVersionRef: "task_cmdapi_071@v1",
      presentedOwnershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      presentedFencingToken: acquired.lease.toSnapshot().fencingToken,
      presentedLineageFenceEpoch: acquired.lineageFence.currentEpoch,
      actionScope: "task_claim",
      governingObjectRef: "task_cmdapi_071",
      canonicalObjectDescriptorRef: "ReviewTask",
      initiatingBoundedContextRef: "triage_workspace",
      governingBoundedContextRef: "triage_workspace",
      lineageScope: "request",
      routeIntentRef: "route_triage_task_claim",
      routeContractDigestRef: "digest_triage_task_claim_v1",
      requiredContextBoundaryRefs: [],
      parentAnchorRef: "anchor_task_cmdapi_071",
      edgeCorrelationId: "edge_cmdapi_071",
      initiatingUiEventRef: "evt_cmdapi_071",
      initiatingUiEventCausalityFrameRef: "frame_cmdapi_071",
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_v1",
      sourceCommandId: "cmd_cmdapi_071",
      transportCorrelationId: "transport_cmdapi_071",
      semanticPayload: { taskState: "claimed", queueRef: "priority_a" },
      idempotencyKey: "idem_cmdapi_071",
      idempotencyRecordRef: "idem_record_cmdapi_071",
      commandFollowingTokenRef: "follow_cmdapi_071",
      expectedEffectSetRefs: ["task.claimed"],
      causalToken: "cause_cmdapi_071",
      createdAt: "2026-04-12T18:01:10Z",
      sameShellRecoveryRouteRef: "/workspace/tasks/task_cmdapi_071/recover",
      operatorVisibleWorkRef: "work_task_cmdapi_071",
      blockedActionScopeRefs: ["task_claim"],
      detectedByRef: "actor_cmdapi_071",
    });

    const scenarios = await application.simulation.runAllScenarios();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
    );
    expect(application.migrationPlanRefs).toEqual(leaseFenceCommandMigrationPlanRefs);
    expect(leaseFenceCommandPersistenceTables).toEqual([
      "episodes",
      "requests",
      "request_lifecycle_leases",
      "stale_ownership_recovery_records",
      "lease_takeover_records",
      "lineage_fences",
      "command_action_records",
      "lease_authority_states",
    ]);
    expect(acquired.lineageFence.currentEpoch).toBe(1);
    expect(action.reusedExisting).toBe(false);
    expect(action.actionRecord.toSnapshot().lineageFenceEpoch).toBe(1);
    expect(scenarios).toHaveLength(5);
    expect(
      scenarios.find(
        (scenario) => scenario.scenarioId === "worker_restart_with_stale_fencing_token",
      )?.recoveries.length,
    ).toBe(2);
    expect(
      scenarios.find((scenario) => scenario.scenarioId === "repeated_ui_actions_reuse_or_supersede")
        ?.actions.length,
    ).toBe(2);
  });
});
