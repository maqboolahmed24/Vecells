import { describe, expect, it } from "vitest";
import {
  buildCanonicalReplayHashes,
  createReplayCollisionAuthorityService,
  createReplayCollisionStore,
  validateReplayLedgerState,
} from "../src/index.ts";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

function createAuthority(seed: string) {
  const store = createReplayCollisionStore();
  const service = createReplayCollisionAuthorityService(
    store,
    createDeterministicBackboneIdGenerator(seed),
  );
  return { store, service };
}

function buildBaseCommand(overrides: Record<string, unknown> = {}) {
  return {
    actionScope: "request_submit",
    governingLineageRef: "lineage_067_primary",
    effectiveActorRef: "actor_patient_001",
    sourceCommandId: "cmd_067_primary",
    sourceCommandIdFamily: "command_id" as const,
    transportCorrelationId: "transport_067_primary",
    causalParentRef: "causal_parent_067_primary",
    intentGeneration: 1,
    expectedEffectSetRefs: ["request.create", "request.promote"],
    scope: {
      governingObjectRef: "submission_envelope_067_primary",
      governingObjectVersionRef: "v1",
      routeIntentTupleHash: "route_intent_tuple_067_primary",
      routeContractDigestRef: "route_contract_digest_067_primary",
      audienceSurfaceRuntimeBindingRef: "surface_runtime_067_primary",
      releaseTrustFreezeVerdictRef: "release_trust_067_primary",
    },
    rawPayload:
      '{"message":"Need   help","requestType":"clinical_question","traceId":"trace_001","transportTimestamp":"2026-04-12T12:00:00Z","details":{"symptom":"pain","age":41}}',
    semanticPayload: {
      requestType: "clinical_question",
      message: "Need help",
      details: {
        age: 41,
        symptom: "pain",
      },
      traceId: "trace_001",
      transportTimestamp: "2026-04-12T12:00:00Z",
    },
    firstAcceptedActionRecordRef: "action_067_primary",
    acceptedSettlementRef: "settlement_067_primary",
    decisionBasisRef: "decision_basis_067_primary",
    observedAt: "2026-04-12T12:00:00Z",
    ...overrides,
  };
}

describe("replay collision authority", () => {
  it("canonicalizes transport-only noise while preserving semantic drift", () => {
    const variants = [
      buildCanonicalReplayHashes({
        actionScope: "request_submit",
        governingLineageRef: "lineage_067_primary",
        effectiveActorRef: "actor_patient_001",
        causalParentRef: "causal_parent_067_primary",
        intentGeneration: 1,
        expectedEffectSetRefs: ["request.promote", "request.create"],
        scope: {
          governingObjectRef: "submission_envelope_067_primary",
          governingObjectVersionRef: "v1",
          routeIntentTupleHash: "route_intent_tuple_067_primary",
          routeContractDigestRef: "route_contract_digest_067_primary",
        },
        rawPayload:
          '{"traceId":"trace_001","message":"Need   help","requestType":"clinical_question","details":{"symptom":"pain","age":41}}',
        semanticPayload: {
          details: { age: 41, symptom: "pain" },
          requestType: "clinical_question",
          message: "Need help",
          traceId: "trace_001",
        },
      }),
      buildCanonicalReplayHashes({
        actionScope: "request_submit",
        governingLineageRef: "lineage_067_primary",
        effectiveActorRef: "actor_patient_001",
        causalParentRef: "causal_parent_067_primary",
        intentGeneration: 1,
        expectedEffectSetRefs: ["request.create", "request.promote"],
        scope: {
          governingObjectRef: "submission_envelope_067_primary",
          governingObjectVersionRef: "v1",
          routeIntentTupleHash: "route_intent_tuple_067_primary",
          routeContractDigestRef: "route_contract_digest_067_primary",
        },
        rawPayload:
          '{"requestType":"clinical_question","transportTimestamp":"2026-04-12T12:00:05Z","message":"Need help","details":{"age":41,"symptom":"pain"},"trace_id":"trace_002"}',
        semanticPayload: {
          requestType: "clinical_question",
          message: " Need   help ",
          details: { symptom: "pain", age: 41 },
          transportTimestamp: "2026-04-12T12:00:05Z",
          trace_id: "trace_002",
        },
      }),
    ];

    expect(variants[0].rawPayloadHash).not.toBe(variants[1].rawPayloadHash);
    expect(variants[0].semanticPayloadHash).toBe(variants[1].semanticPayloadHash);
    expect(variants[0].replayKey).toBe(variants[1].replayKey);
    expect(variants[0].scopeFingerprint).toBe(variants[1].scopeFingerprint);

    const drifted = buildCanonicalReplayHashes({
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      effectiveActorRef: "actor_patient_001",
      causalParentRef: "causal_parent_067_primary",
      intentGeneration: 1,
      expectedEffectSetRefs: ["request.create", "request.promote"],
      scope: {
        governingObjectRef: "submission_envelope_067_primary",
        governingObjectVersionRef: "v1",
        routeIntentTupleHash: "route_intent_tuple_067_primary",
        routeContractDigestRef: "route_contract_digest_067_primary",
      },
      rawPayload:
        '{"requestType":"administrative_change","message":"Need help","details":{"age":41,"symptom":"pain"}}',
      semanticPayload: {
        requestType: "administrative_change",
        message: "Need help",
        details: { age: 41, symptom: "pain" },
      },
    });

    expect(drifted.semanticPayloadHash).not.toBe(variants[0].semanticPayloadHash);
    expect(drifted.replayKey).not.toBe(variants[0].replayKey);
  });

  it("classifies distinct, exact replay, semantic replay, and collision review deterministically", async () => {
    const { service } = createAuthority("replay067a");

    const distinct = await service.resolveInboundCommand(buildBaseCommand());
    const exactReplay = await service.resolveInboundCommand(buildBaseCommand());
    const semanticReplay = await service.resolveInboundCommand(
      buildBaseCommand({
        rawPayload:
          '{"requestType":"clinical_question","message":"Need help","details":{"age":41,"symptom":"pain"},"traceId":"trace_099"}',
        semanticPayload: {
          details: { symptom: "pain", age: 41 },
          message: "Need help",
          requestType: "clinical_question",
          traceId: "trace_099",
        },
        observedAt: "2026-04-12T12:00:05Z",
      }),
    );
    const collision = await service.resolveInboundCommand(
      buildBaseCommand({
        rawPayload:
          '{"requestType":"administrative_change","message":"Need help","details":{"age":41,"symptom":"pain"}}',
        semanticPayload: {
          requestType: "administrative_change",
          message: "Need help",
          details: { age: 41, symptom: "pain" },
        },
        firstAcceptedActionRecordRef: "action_067_drift",
        acceptedSettlementRef: "settlement_067_drift",
        observedAt: "2026-04-12T12:00:10Z",
      }),
    );

    expect(distinct.decisionClass).toBe("distinct");
    expect(distinct.blockedAutomaticMutation).toBe(false);
    expect(exactReplay.decisionClass).toBe("exact_replay");
    expect(exactReplay.authoritativeSettlementRef).toBe("settlement_067_primary");
    expect(semanticReplay.decisionClass).toBe("semantic_replay");
    expect(semanticReplay.authoritativeActionRecordRef).toBe("action_067_primary");
    expect(collision.decisionClass).toBe("collision_review");
    expect(collision.blockedAutomaticMutation).toBe(true);
    expect(collision.collisionReview?.toSnapshot().collisionClass).toBe("source_id_reuse");
    expect(collision.authoritativeSettlementRef).toBe("settlement_067_primary");
  });

  it("blocks a second accepted chain for the same effect scope", async () => {
    const { service } = createAuthority("replay067b");

    const first = await service.resolveInboundCommand(buildBaseCommand());
    const second = await service.resolveInboundCommand(
      buildBaseCommand({
        sourceCommandId: "cmd_067_secondary",
        transportCorrelationId: "transport_067_secondary",
        rawPayload:
          '{"requestType":"clinical_question","message":"Need help urgently","details":{"age":41,"symptom":"pain"}}',
        semanticPayload: {
          requestType: "clinical_question",
          message: "Need help urgently",
          details: { age: 41, symptom: "pain" },
        },
        firstAcceptedActionRecordRef: "action_067_secondary",
        acceptedSettlementRef: "settlement_067_secondary",
        observedAt: "2026-04-12T12:01:00Z",
      }),
    );

    expect(first.decisionClass).toBe("distinct");
    expect(second.decisionClass).toBe("collision_review");
    expect(second.collisionReview?.toSnapshot().collisionClass).toBe("idempotency_key_reuse");
    expect(second.authoritativeActionRecordRef).toBe("action_067_primary");
  });

  it("serializes concurrent duplicate resolution to one durable idempotency record", async () => {
    const { service, store } = createAuthority("replay067c");

    const [left, right] = await Promise.all([
      service.resolveInboundCommand(buildBaseCommand()),
      service.resolveInboundCommand(buildBaseCommand()),
    ]);

    const distinct = left.decisionClass === "distinct" ? left : right;
    const replay = left.decisionClass === "distinct" ? right : left;

    expect(distinct.decisionClass).toBe("distinct");
    expect(["exact_replay", "semantic_replay"]).toContain(replay.decisionClass);
    expect(replay.authoritativeSettlementRef).toBe(distinct.authoritativeSettlementRef);
    expect(await store.listIdempotencyRecords()).toHaveLength(1);
  });

  it("dedupes adapter receipts and ignores stale out-of-order callbacks", async () => {
    const { service, store } = createAuthority("replay067d");

    const command = await service.resolveInboundCommand(buildBaseCommand());
    const dispatch = await service.ensureAdapterDispatchAttempt({
      idempotencyRecordRef: command.idempotencyRecord.idempotencyRecordId,
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      actionRecordRef: command.authoritativeActionRecordRef,
      adapterContractProfileRef: "adapter_contract_notifications_v1",
      effectScope: "request_submit::notification_receipt",
      effectKey: "effect_067_notification_receipt",
      transportPayload: '{"operation":"send","message":"hello"}',
      semanticPayload: { operation: "send", message: "hello" },
      providerCorrelationRef: "provider_corr_067_a",
      firstDispatchedAt: "2026-04-12T12:02:00Z",
    });

    const accepted = await service.recordAdapterReceiptCheckpoint({
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      adapterContractProfileRef: "adapter_contract_notifications_v1",
      effectKey: dispatch.dispatchAttempt.effectKey,
      providerCorrelationRef: "provider_corr_067_a",
      transportMessageId: "transport_message_067_a",
      orderingKey: "002",
      rawReceipt: '{"state":"delivered","traceId":"trace_a"}',
      semanticReceipt: { state: "delivered", traceId: "trace_a" },
      linkedSettlementRef: "settlement_receipt_067_a",
      recordedAt: "2026-04-12T12:02:10Z",
    });
    const semanticReplay = await service.recordAdapterReceiptCheckpoint({
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      adapterContractProfileRef: "adapter_contract_notifications_v1",
      effectKey: dispatch.dispatchAttempt.effectKey,
      providerCorrelationRef: "provider_corr_067_a",
      transportMessageId: "transport_message_067_a",
      orderingKey: "002",
      rawReceipt: '{"traceId":"trace_b","state":"delivered"}',
      semanticReceipt: { traceId: "trace_b", state: "delivered" },
      linkedSettlementRef: "settlement_receipt_067_a",
      recordedAt: "2026-04-12T12:02:15Z",
    });
    const stale = await service.recordAdapterReceiptCheckpoint({
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      adapterContractProfileRef: "adapter_contract_notifications_v1",
      effectKey: dispatch.dispatchAttempt.effectKey,
      providerCorrelationRef: "provider_corr_067_a",
      transportMessageId: "transport_message_067_b",
      orderingKey: "001",
      rawReceipt: '{"state":"queued"}',
      semanticReceipt: { state: "queued" },
      linkedSettlementRef: "settlement_receipt_067_a",
      recordedAt: "2026-04-12T12:02:20Z",
    });

    expect(accepted.decisionClass).toBe("accepted_new");
    expect(accepted.dispatchAttempt.toSnapshot().status).toBe("confirmed");
    expect(semanticReplay.decisionClass).toBe("semantic_replay");
    expect(semanticReplay.dispatchAttempt.toSnapshot().confirmedSettlementRef).toBe(
      "settlement_receipt_067_a",
    );
    expect(stale.decisionClass).toBe("stale_ignored");
    expect(await store.listAdapterDispatchAttempts()).toHaveLength(1);
    expect(await store.listAdapterReceiptCheckpoints()).toHaveLength(2);
  });

  it("opens callback scope drift review when provider correlation is reused on a different effect key", async () => {
    const { service } = createAuthority("replay067e");

    const leftCommand = await service.resolveInboundCommand(buildBaseCommand());
    const rightCommand = await service.resolveInboundCommand(
      buildBaseCommand({
        governingLineageRef: "lineage_067_secondary",
        sourceCommandId: "cmd_067_secondary",
        transportCorrelationId: "transport_067_secondary",
        scope: {
          governingObjectRef: "submission_envelope_067_secondary",
          governingObjectVersionRef: "v1",
          routeIntentTupleHash: "route_intent_tuple_067_secondary",
          routeContractDigestRef: "route_contract_digest_067_secondary",
          audienceSurfaceRuntimeBindingRef: "surface_runtime_067_secondary",
          releaseTrustFreezeVerdictRef: "release_trust_067_secondary",
        },
        rawPayload:
          '{"requestType":"clinical_question","message":"Need help","details":{"age":41,"symptom":"fever"}}',
        semanticPayload: {
          requestType: "clinical_question",
          message: "Need help",
          details: { age: 41, symptom: "fever" },
        },
        firstAcceptedActionRecordRef: "action_067_secondary",
        acceptedSettlementRef: "settlement_067_secondary",
        observedAt: "2026-04-12T12:03:00Z",
      }),
    );

    const leftDispatch = await service.ensureAdapterDispatchAttempt({
      idempotencyRecordRef: leftCommand.idempotencyRecord.idempotencyRecordId,
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      actionRecordRef: leftCommand.authoritativeActionRecordRef,
      adapterContractProfileRef: "adapter_contract_booking_v1",
      effectScope: "booking_confirmation",
      effectKey: "effect_067_booking_primary",
      transportPayload: '{"slot":"10:00"}',
      semanticPayload: { slot: "10:00" },
      providerCorrelationRef: "provider_corr_067_shared",
      firstDispatchedAt: "2026-04-12T12:03:10Z",
    });
    const rightDispatch = await service.ensureAdapterDispatchAttempt({
      idempotencyRecordRef: rightCommand.idempotencyRecord.idempotencyRecordId,
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_secondary",
      actionRecordRef: rightCommand.authoritativeActionRecordRef,
      adapterContractProfileRef: "adapter_contract_booking_v1",
      effectScope: "booking_confirmation",
      effectKey: "effect_067_booking_secondary",
      transportPayload: '{"slot":"11:00"}',
      semanticPayload: { slot: "11:00" },
      providerCorrelationRef: "provider_corr_067_other",
      firstDispatchedAt: "2026-04-12T12:03:15Z",
    });

    await service.recordAdapterReceiptCheckpoint({
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_primary",
      adapterContractProfileRef: "adapter_contract_booking_v1",
      effectKey: leftDispatch.dispatchAttempt.effectKey,
      providerCorrelationRef: "provider_corr_067_shared",
      transportMessageId: "provider_message_067_a",
      orderingKey: "100",
      rawReceipt: '{"state":"accepted"}',
      semanticReceipt: { state: "accepted" },
      linkedSettlementRef: "settlement_booking_067_primary",
      recordedAt: "2026-04-12T12:03:20Z",
    });

    const collision = await service.recordAdapterReceiptCheckpoint({
      actionScope: "request_submit",
      governingLineageRef: "lineage_067_secondary",
      adapterContractProfileRef: "adapter_contract_booking_v1",
      effectKey: rightDispatch.dispatchAttempt.effectKey,
      providerCorrelationRef: "provider_corr_067_shared",
      transportMessageId: "provider_message_067_b",
      orderingKey: "101",
      rawReceipt: '{"state":"accepted"}',
      semanticReceipt: { state: "accepted" },
      linkedSettlementRef: "settlement_booking_067_secondary",
      recordedAt: "2026-04-12T12:03:25Z",
    });

    expect(collision.decisionClass).toBe("collision_review");
    expect(collision.collisionReview?.toSnapshot().collisionClass).toBe("callback_scope_drift");
    expect(collision.dispatchAttempt.toSnapshot().status).toBe("collision_review");
  });

  it("reports validation issues for multi-chain and callback drift violations", () => {
    const issues = validateReplayLedgerState({
      idempotencyRecords: [
        {
          idempotencyRecordId: "idr_001",
          actionScope: "request_submit",
          governingLineageRef: "lineage_a",
          sourceCommandId: "cmd_a",
          sourceCommandIdFamily: "command_id",
          transportCorrelationId: "transport_a",
          rawPayloadHash: "raw_a",
          semanticPayloadHash: "sem_a",
          replayKey: "replay_a",
          scopeFingerprint: "scope_a",
          effectScopeKey: "effect_scope_shared",
          causalParentRef: null,
          intentGeneration: 1,
          expectedEffectSetHash: "effect_set_a",
          decisionClass: "distinct",
          firstAcceptedActionRecordRef: "action_a",
          acceptedSettlementRef: "settlement_a",
          collisionReviewRef: null,
          decisionBasisRef: "basis_a",
          replayWindowClosedAt: null,
          createdAt: "2026-04-12T12:04:00Z",
          updatedAt: "2026-04-12T12:04:00Z",
          version: 1,
        },
        {
          idempotencyRecordId: "idr_002",
          actionScope: "request_submit",
          governingLineageRef: "lineage_b",
          sourceCommandId: "cmd_b",
          sourceCommandIdFamily: "command_id",
          transportCorrelationId: "transport_b",
          rawPayloadHash: "raw_b",
          semanticPayloadHash: "sem_b",
          replayKey: "replay_b",
          scopeFingerprint: "scope_b",
          effectScopeKey: "effect_scope_shared",
          causalParentRef: null,
          intentGeneration: 1,
          expectedEffectSetHash: "effect_set_b",
          decisionClass: "collision_review",
          firstAcceptedActionRecordRef: "action_b",
          acceptedSettlementRef: "settlement_b",
          collisionReviewRef: null,
          decisionBasisRef: "basis_b",
          replayWindowClosedAt: null,
          createdAt: "2026-04-12T12:04:10Z",
          updatedAt: "2026-04-12T12:04:10Z",
          version: 1,
        },
      ],
      replayCollisionReviews: [],
      adapterDispatchAttempts: [
        {
          dispatchAttemptId: "dispatch_001",
          idempotencyRecordRef: "idr_001",
          actionScope: "request_submit",
          governingLineageRef: "lineage_a",
          actionRecordRef: "action_a",
          adapterContractProfileRef: "adapter_profile",
          effectScope: "effect_scope_shared",
          effectKey: "effect_key_shared",
          transportPayloadHash: "payload_hash_a",
          semanticPayloadHash: "payload_sem_a",
          providerCorrelationRef: "provider_corr",
          status: "confirmed",
          attemptCount: 1,
          firstDispatchedAt: "2026-04-12T12:04:20Z",
          lastObservedAt: "2026-04-12T12:04:20Z",
          confirmedSettlementRef: "settlement_a",
          version: 1,
        },
      ],
      adapterReceiptCheckpoints: [
        {
          receiptCheckpointId: "checkpoint_001",
          adapterContractProfileRef: "adapter_profile",
          effectKey: "effect_key_shared",
          providerCorrelationRef: "provider_corr",
          transportMessageId: "message_a",
          orderingKey: "001",
          rawReceiptHash: "receipt_raw_a",
          semanticReceiptHash: "receipt_sem_a",
          decisionClass: "accepted_new",
          linkedDispatchAttemptRef: "dispatch_001",
          linkedSettlementRef: "settlement_a",
          recordedAt: "2026-04-12T12:04:30Z",
          version: 1,
        },
        {
          receiptCheckpointId: "checkpoint_002",
          adapterContractProfileRef: "adapter_profile",
          effectKey: "effect_key_shared",
          providerCorrelationRef: "provider_corr",
          transportMessageId: "message_b",
          orderingKey: "002",
          rawReceiptHash: "receipt_raw_b",
          semanticReceiptHash: "receipt_sem_b",
          decisionClass: "accepted_new",
          linkedDispatchAttemptRef: "dispatch_001",
          linkedSettlementRef: "settlement_b",
          recordedAt: "2026-04-12T12:04:35Z",
          version: 1,
        },
      ],
    });

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "MISSING_COLLISION_REVIEW_REFERENCE",
        "MULTIPLE_ACCEPTED_ACTION_CHAINS_FOR_EFFECT_SCOPE",
        "RECEIPT_CHECKPOINT_CREATED_SECOND_SETTLEMENT_CHAIN",
      ]),
    );
  });
});
