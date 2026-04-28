import { describe, expect, it } from "vitest";
import {
  EventSpineStore,
  createDeterministicEventSpineIdGenerator,
  makeCanonicalEffectKey,
  makeCanonicalEventEnvelope,
  runEventSpineSimulationScenarios,
} from "../src/index.ts";

describe("event spine primitives", () => {
  it("deduplicates outbox effects by canonical effect key", () => {
    const store = new EventSpineStore(createDeterministicEventSpineIdGenerator("evt_test"));
    const event = makeCanonicalEventEnvelope({
      tenantId: "tenant_evt_087",
      eventName: "confirmation.gate.created",
      schemaVersionRef: "schema::confirmation_gate_created@v1",
      sourceBoundedContextRef: "platform_runtime",
      governingBoundedContextRef: "confirmation",
      edgeCorrelationId: "corr_evt_001",
      causalToken: "causal_evt_001",
      emittedAt: "2026-04-12T09:00:00Z",
      payload: { gateRef: "gate_001" },
    });
    const effectKey = makeCanonicalEffectKey({
      queueRef: "q_event_integration_effects",
      orderingKey: "gate_001",
      eventName: event.eventName,
      governingObjectRef: "gate_001",
      causalToken: event.causalToken,
    });

    const first = store.enqueueOutbox({
      queueRef: "q_event_integration_effects",
      producerServiceRef: "service_command_api",
      orderingKey: "gate_001",
      effectKey,
      event,
    });
    const duplicate = store.enqueueOutbox({
      queueRef: "q_event_integration_effects",
      producerServiceRef: "service_command_api",
      orderingKey: "gate_001",
      effectKey,
      event,
    });

    expect(duplicate.outboxEntryId).toBe(first.outboxEntryId);
    expect(store.toSnapshot().outboxEntries).toHaveLength(1);
  });

  it("blocks out-of-order inbox receipts until the missing sequence arrives", () => {
    const store = new EventSpineStore(createDeterministicEventSpineIdGenerator("evt_gap"));
    const baseEvent = makeCanonicalEventEnvelope({
      tenantId: "tenant_evt_087",
      eventName: "reachability.dependency.failed",
      schemaVersionRef: "schema::reachability_dependency_failed@v1",
      sourceBoundedContextRef: "platform_runtime",
      governingBoundedContextRef: "reachability",
      edgeCorrelationId: "corr_evt_gap",
      causalToken: "causal_evt_gap",
      emittedAt: "2026-04-12T09:01:00Z",
      payload: { dependencyRef: "dep_001" },
    });

    const blocked = store.receiveInbox({
      consumerGroupRef: "cg_callback_receipt_ingest",
      queueRef: "q_event_callback_correlation",
      orderingKey: "dep_001",
      sequence: 2,
      callbackCorrelationKey: "dep_001::callback",
      receivedAt: "2026-04-12T09:01:00Z",
      event: baseEvent,
    });
    expect(blocked.receiptState).toBe("gap_blocked");
    expect(blocked.gapExpectedSequence).toBe(1);

    const accepted = store.receiveInbox({
      consumerGroupRef: "cg_callback_receipt_ingest",
      queueRef: "q_event_callback_correlation",
      orderingKey: "dep_001",
      sequence: 1,
      callbackCorrelationKey: "dep_001::callback",
      receivedAt: "2026-04-12T09:02:00Z",
      event: {
        ...baseEvent,
        eventId: "evt_gap_accepted",
        edgeCorrelationId: "corr_evt_gap_accepted",
      },
    });
    expect(accepted.receiptState).toBe("accepted");

    const checkpoint = store.getInboxCheckpoint("cg_callback_receipt_ingest", "dep_001");
    expect(checkpoint?.nextExpectedSequence).toBe(2);
  });

  it("keeps canonical identity visible through quarantine, duplicates, and replay review", () => {
    const results = runEventSpineSimulationScenarios();
    expect(results).toHaveLength(6);

    const quarantine = results.find((result) => result.scenarioId === "quarantine_attachment_flow");
    expect(quarantine?.eventName).toBe("intake.attachment.quarantined");
    expect(quarantine?.quarantineQueueRefs).toContain("q_event_replay_quarantine");

    const degraded = results.find(
      (result) => result.scenarioId === "patient_receipt_degraded_flow",
    );
    expect(degraded?.duplicateReceiptCount).toBeGreaterThan(0);

    const gap = results.find((result) => result.scenarioId === "reachability_failure_flow");
    expect(gap?.replayReviewRefs.length).toBeGreaterThan(0);
  });
});
