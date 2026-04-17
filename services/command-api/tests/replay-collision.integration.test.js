import { describe, expect, it } from "vitest";
import {
  createReplayCollisionApplication,
  replayCollisionMigrationPlanRefs,
  replayCollisionPersistenceTables,
} from "../src/replay-collision-authority.ts";
import { runAllReplayCollisionScenarios } from "../src/replay-collision-simulator.ts";

describe("replay collision application seam", () => {
  it("composes the canonical idempotency and collision-review authority", async () => {
    const application = createReplayCollisionApplication();

    const distinct = await application.authority.resolveInboundCommand({
      actionScope: "request_submit",
      governingLineageRef: "lineage_cmdapi_067",
      effectiveActorRef: "actor_patient_cmdapi_067",
      sourceCommandId: "cmd_cmdapi_067",
      transportCorrelationId: "transport_cmdapi_067",
      causalParentRef: "causal_parent_cmdapi_067",
      intentGeneration: 1,
      expectedEffectSetRefs: ["request.create", "request.promote"],
      scope: {
        governingObjectRef: "submission_envelope_cmdapi_067",
        governingObjectVersionRef: "v1",
        routeIntentTupleHash: "route_tuple_cmdapi_067",
        routeContractDigestRef: "route_digest_cmdapi_067",
      },
      rawPayload:
        '{"requestType":"clinical_question","message":"Need help","details":{"symptom":"pain","age":41}}',
      semanticPayload: {
        requestType: "clinical_question",
        message: "Need help",
        details: { symptom: "pain", age: 41 },
      },
      firstAcceptedActionRecordRef: "action_cmdapi_067",
      acceptedSettlementRef: "settlement_cmdapi_067",
      observedAt: "2026-04-12T12:40:00Z",
    });
    const replay = await application.authority.resolveInboundCommand({
      actionScope: "request_submit",
      governingLineageRef: "lineage_cmdapi_067",
      effectiveActorRef: "actor_patient_cmdapi_067",
      sourceCommandId: "cmd_cmdapi_067",
      transportCorrelationId: "transport_cmdapi_067",
      causalParentRef: "causal_parent_cmdapi_067",
      intentGeneration: 1,
      expectedEffectSetRefs: ["request.create", "request.promote"],
      scope: {
        governingObjectRef: "submission_envelope_cmdapi_067",
        governingObjectVersionRef: "v1",
        routeIntentTupleHash: "route_tuple_cmdapi_067",
        routeContractDigestRef: "route_digest_cmdapi_067",
      },
      rawPayload:
        '{"message":"Need help","requestType":"clinical_question","details":{"age":41,"symptom":"pain"},"traceId":"trace_cmdapi_067"}',
      semanticPayload: {
        message: "Need help",
        requestType: "clinical_question",
        details: { age: 41, symptom: "pain" },
        traceId: "trace_cmdapi_067",
      },
      firstAcceptedActionRecordRef: "action_cmdapi_067_replay",
      acceptedSettlementRef: "settlement_cmdapi_067_replay",
      observedAt: "2026-04-12T12:40:05Z",
    });

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/067_idempotency_and_replay_collision.sql",
    );
    expect(application.migrationPlanRefs).toEqual(replayCollisionMigrationPlanRefs);
    expect(replayCollisionPersistenceTables).toEqual([
      "idempotency_records",
      "replay_collision_reviews",
      "adapter_dispatch_attempts",
      "adapter_receipt_checkpoints",
    ]);
    expect(distinct.decisionClass).toBe("distinct");
    expect(replay.decisionClass).toBe("semantic_replay");
    expect(replay.authoritativeSettlementRef).toBe(distinct.authoritativeSettlementRef);
  });

  it("runs the replay harness across browser retries, semantic drift, collisions, callbacks, and outbox replays", async () => {
    const results = await runAllReplayCollisionScenarios();

    expect(results).toHaveLength(5);

    const exact = results.find(
      (result) => result.scenarioId === "repeated_browser_taps_identical_raw_payloads",
    );
    expect(exact?.commandDecisionClass).toBe("exact_replay");
    expect(exact?.blockedAutomaticMutation).toBe(false);

    const semantic = results.find(
      (result) => result.scenarioId === "semantically_identical_transport_variance",
    );
    expect(semantic?.commandDecisionClass).toBe("semantic_replay");

    const collision = results.find(
      (result) => result.scenarioId === "reused_source_command_id_changed_semantics",
    );
    expect(collision?.commandDecisionClass).toBe("collision_review");
    expect(collision?.collisionClass).toBe("source_id_reuse");
    expect(collision?.blockedAutomaticMutation).toBe(true);

    const callbacks = results.find(
      (result) => result.scenarioId === "duplicate_callbacks_and_out_of_order_provider_receipts",
    );
    expect(callbacks?.receiptDecisionClasses).toEqual([
      "accepted_new",
      "semantic_replay",
      "stale_ignored",
    ]);

    const outbox = results.find(
      (result) => result.scenarioId === "delayed_duplicate_jobs_from_outbox",
    );
    expect(outbox?.reusedDispatchAttempt).toBe(true);
  });
});
