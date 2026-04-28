import { createReplayCollisionApplication } from "./replay-collision-authority";

export const replayCollisionSimulationScenarios = [
  {
    scenarioId: "repeated_browser_taps_identical_raw_payloads",
    description:
      "Repeated browser taps with identical raw submit payloads return the same settlement.",
  },
  {
    scenarioId: "semantically_identical_transport_variance",
    description:
      "Transport framing and field ordering drift collapse to semantic replay on the same authoritative chain.",
  },
  {
    scenarioId: "reused_source_command_id_changed_semantics",
    description:
      "Reused source command identifiers with changed semantics open ReplayCollisionReview.",
  },
  {
    scenarioId: "duplicate_callbacks_and_out_of_order_provider_receipts",
    description:
      "Accepted callbacks, semantic replays, and stale out-of-order receipts all reconcile onto one dispatch attempt.",
  },
  {
    scenarioId: "delayed_duplicate_jobs_from_outbox",
    description: "Duplicate outbox jobs reuse the same adapter dispatch attempt and effect key.",
  },
] as const;

export interface ReplayCollisionScenarioResult {
  scenarioId: (typeof replayCollisionSimulationScenarios)[number]["scenarioId"];
  commandDecisionClass: string;
  receiptDecisionClasses: readonly string[];
  authoritativeActionRecordRef: string;
  authoritativeSettlementRef: string;
  blockedAutomaticMutation: boolean;
  reusedDispatchAttempt: boolean;
  collisionClass: string | null;
}

function baseCommand(overrides: Record<string, unknown> = {}) {
  return {
    actionScope: "request_submit",
    governingLineageRef: "lineage_sim_067_primary",
    effectiveActorRef: "actor_patient_sim_067",
    sourceCommandId: "cmd_sim_067_primary",
    sourceCommandIdFamily: "command_id" as const,
    transportCorrelationId: "transport_sim_067_primary",
    causalParentRef: "causal_parent_sim_067_primary",
    intentGeneration: 1,
    expectedEffectSetRefs: ["request.create", "request.promote"],
    scope: {
      governingObjectRef: "submission_envelope_sim_067_primary",
      governingObjectVersionRef: "v1",
      routeIntentTupleHash: "route_tuple_sim_067_primary",
      routeContractDigestRef: "route_digest_sim_067_primary",
      audienceSurfaceRuntimeBindingRef: "surface_runtime_sim_067_primary",
      releaseTrustFreezeVerdictRef: "release_trust_sim_067_primary",
    },
    rawPayload:
      '{"requestType":"clinical_question","message":"Need help","details":{"symptom":"pain","age":41}}',
    semanticPayload: {
      requestType: "clinical_question",
      message: "Need help",
      details: { symptom: "pain", age: 41 },
    },
    firstAcceptedActionRecordRef: "action_sim_067_primary",
    acceptedSettlementRef: "settlement_sim_067_primary",
    decisionBasisRef: "decision_basis_sim_067_primary",
    observedAt: "2026-04-12T12:30:00Z",
    ...overrides,
  };
}

export async function simulateReplayCollisionScenario(
  scenarioId: (typeof replayCollisionSimulationScenarios)[number]["scenarioId"],
): Promise<ReplayCollisionScenarioResult> {
  const application = createReplayCollisionApplication();

  switch (scenarioId) {
    case "repeated_browser_taps_identical_raw_payloads": {
      const first = await application.authority.resolveInboundCommand(baseCommand());
      const replay = await application.authority.resolveInboundCommand(baseCommand());
      return {
        scenarioId,
        commandDecisionClass: replay.decisionClass,
        receiptDecisionClasses: [],
        authoritativeActionRecordRef: first.authoritativeActionRecordRef,
        authoritativeSettlementRef: replay.authoritativeSettlementRef,
        blockedAutomaticMutation: replay.blockedAutomaticMutation,
        reusedDispatchAttempt: false,
        collisionClass: replay.collisionReview?.toSnapshot().collisionClass ?? null,
      };
    }
    case "semantically_identical_transport_variance": {
      const first = await application.authority.resolveInboundCommand(baseCommand());
      const replay = await application.authority.resolveInboundCommand(
        baseCommand({
          rawPayload:
            '{"message":"Need help","requestType":"clinical_question","details":{"age":41,"symptom":"pain"},"traceId":"trace_sim_067"}',
          semanticPayload: {
            details: { age: 41, symptom: "pain" },
            message: "Need help",
            requestType: "clinical_question",
            traceId: "trace_sim_067",
          },
          observedAt: "2026-04-12T12:30:05Z",
        }),
      );
      return {
        scenarioId,
        commandDecisionClass: replay.decisionClass,
        receiptDecisionClasses: [],
        authoritativeActionRecordRef: replay.authoritativeActionRecordRef,
        authoritativeSettlementRef: first.authoritativeSettlementRef,
        blockedAutomaticMutation: replay.blockedAutomaticMutation,
        reusedDispatchAttempt: false,
        collisionClass: null,
      };
    }
    case "reused_source_command_id_changed_semantics": {
      await application.authority.resolveInboundCommand(baseCommand());
      const collision = await application.authority.resolveInboundCommand(
        baseCommand({
          rawPayload:
            '{"requestType":"administrative_change","message":"Need help","details":{"symptom":"pain","age":41}}',
          semanticPayload: {
            requestType: "administrative_change",
            message: "Need help",
            details: { symptom: "pain", age: 41 },
          },
          firstAcceptedActionRecordRef: "action_sim_067_collision",
          acceptedSettlementRef: "settlement_sim_067_collision",
          observedAt: "2026-04-12T12:30:10Z",
        }),
      );
      return {
        scenarioId,
        commandDecisionClass: collision.decisionClass,
        receiptDecisionClasses: [],
        authoritativeActionRecordRef: collision.authoritativeActionRecordRef,
        authoritativeSettlementRef: collision.authoritativeSettlementRef,
        blockedAutomaticMutation: collision.blockedAutomaticMutation,
        reusedDispatchAttempt: false,
        collisionClass: collision.collisionReview?.toSnapshot().collisionClass ?? null,
      };
    }
    case "duplicate_callbacks_and_out_of_order_provider_receipts": {
      const command = await application.authority.resolveInboundCommand(baseCommand());
      const dispatch = await application.authority.ensureAdapterDispatchAttempt({
        idempotencyRecordRef: command.idempotencyRecord.idempotencyRecordId,
        actionScope: "request_submit",
        governingLineageRef: "lineage_sim_067_primary",
        actionRecordRef: command.authoritativeActionRecordRef,
        adapterContractProfileRef: "adapter_contract_sim_067",
        effectScope: "request_submit::external_dispatch",
        effectKey: "effect_sim_067_dispatch",
        transportPayload: '{"send":"payload"}',
        semanticPayload: { send: "payload" },
        providerCorrelationRef: "provider_corr_sim_067",
        firstDispatchedAt: "2026-04-12T12:30:20Z",
      });

      const accepted = await application.authority.recordAdapterReceiptCheckpoint({
        actionScope: "request_submit",
        governingLineageRef: "lineage_sim_067_primary",
        adapterContractProfileRef: "adapter_contract_sim_067",
        effectKey: "effect_sim_067_dispatch",
        providerCorrelationRef: "provider_corr_sim_067",
        transportMessageId: "transport_msg_sim_067_a",
        orderingKey: "200",
        rawReceipt: '{"state":"accepted"}',
        semanticReceipt: { state: "accepted" },
        linkedSettlementRef: "settlement_sim_067_dispatch",
        recordedAt: "2026-04-12T12:30:25Z",
      });
      const semanticReplay = await application.authority.recordAdapterReceiptCheckpoint({
        actionScope: "request_submit",
        governingLineageRef: "lineage_sim_067_primary",
        adapterContractProfileRef: "adapter_contract_sim_067",
        effectKey: "effect_sim_067_dispatch",
        providerCorrelationRef: "provider_corr_sim_067",
        transportMessageId: "transport_msg_sim_067_a",
        orderingKey: "200",
        rawReceipt: '{"traceId":"trace_receipt","state":"accepted"}',
        semanticReceipt: { traceId: "trace_receipt", state: "accepted" },
        linkedSettlementRef: "settlement_sim_067_dispatch",
        recordedAt: "2026-04-12T12:30:26Z",
      });
      const stale = await application.authority.recordAdapterReceiptCheckpoint({
        actionScope: "request_submit",
        governingLineageRef: "lineage_sim_067_primary",
        adapterContractProfileRef: "adapter_contract_sim_067",
        effectKey: "effect_sim_067_dispatch",
        providerCorrelationRef: "provider_corr_sim_067",
        transportMessageId: "transport_msg_sim_067_b",
        orderingKey: "199",
        rawReceipt: '{"state":"queued"}',
        semanticReceipt: { state: "queued" },
        linkedSettlementRef: "settlement_sim_067_dispatch",
        recordedAt: "2026-04-12T12:30:27Z",
      });

      return {
        scenarioId,
        commandDecisionClass: command.decisionClass,
        receiptDecisionClasses: [
          accepted.decisionClass,
          semanticReplay.decisionClass,
          stale.decisionClass,
        ],
        authoritativeActionRecordRef: command.authoritativeActionRecordRef,
        authoritativeSettlementRef: command.authoritativeSettlementRef,
        blockedAutomaticMutation: false,
        reusedDispatchAttempt: dispatch.reusedExistingAttempt,
        collisionClass: null,
      };
    }
    case "delayed_duplicate_jobs_from_outbox": {
      const command = await application.authority.resolveInboundCommand(baseCommand());
      const first = await application.authority.ensureAdapterDispatchAttempt({
        idempotencyRecordRef: command.idempotencyRecord.idempotencyRecordId,
        actionScope: "request_submit",
        governingLineageRef: "lineage_sim_067_primary",
        actionRecordRef: command.authoritativeActionRecordRef,
        adapterContractProfileRef: "adapter_contract_sim_067",
        effectScope: "request_submit::external_dispatch",
        effectKey: "effect_sim_067_outbox",
        transportPayload: '{"send":"payload"}',
        semanticPayload: { send: "payload" },
        providerCorrelationRef: "provider_corr_sim_067_outbox",
        firstDispatchedAt: "2026-04-12T12:30:40Z",
      });
      const replay = await application.authority.ensureAdapterDispatchAttempt({
        idempotencyRecordRef: command.idempotencyRecord.idempotencyRecordId,
        actionScope: "request_submit",
        governingLineageRef: "lineage_sim_067_primary",
        actionRecordRef: command.authoritativeActionRecordRef,
        adapterContractProfileRef: "adapter_contract_sim_067",
        effectScope: "request_submit::external_dispatch",
        effectKey: "effect_sim_067_outbox",
        transportPayload: '{"send":"payload"}',
        semanticPayload: { send: "payload" },
        providerCorrelationRef: "provider_corr_sim_067_outbox",
        firstDispatchedAt: "2026-04-12T12:30:41Z",
      });
      return {
        scenarioId,
        commandDecisionClass: command.decisionClass,
        receiptDecisionClasses: [],
        authoritativeActionRecordRef: command.authoritativeActionRecordRef,
        authoritativeSettlementRef: command.authoritativeSettlementRef,
        blockedAutomaticMutation: false,
        reusedDispatchAttempt: replay.reusedExistingAttempt && !first.reusedExistingAttempt,
        collisionClass: null,
      };
    }
  }
}

export async function runAllReplayCollisionScenarios(): Promise<
  readonly ReplayCollisionScenarioResult[]
> {
  const results: ReplayCollisionScenarioResult[] = [];
  for (const scenario of replayCollisionSimulationScenarios) {
    results.push(await simulateReplayCollisionScenario(scenario.scenarioId));
  }
  return results;
}
