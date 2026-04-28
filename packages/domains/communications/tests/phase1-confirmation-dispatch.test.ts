import { describe, expect, it } from "vitest";
import {
  createPhase1ConfirmationDispatchService,
  phase1ConfirmationDispatchContractRef,
} from "../src/index.ts";

describe("phase1 confirmation dispatch service", () => {
  it("queues one idempotent confirmation chain and blocks calm outcome when route truth is stale", async () => {
    const service = createPhase1ConfirmationDispatchService();

    const first = await service.queueConfirmationCommunication({
      requestRef: "request_153_queued",
      requestLineageRef: "lineage_153_queued",
      triageTaskRef: "triage_153_queued",
      receiptEnvelopeRef: "receipt_153_queued",
      outcomeArtifactRef: "artifact_153_queued",
      contactPreferencesRef: "cpref_153_queued",
      routeSnapshotSeedRef: "seed_153_queued",
      currentContactRouteSnapshotRef: "route_snapshot_153_queued",
      currentReachabilityAssessmentRef: "reachability_153_queued",
      reachabilityDependencyRef: "dependency_153_queued",
      preferredChannel: "sms",
      maskedDestination: "+44 ••••••0123",
      templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
      routeAuthorityState: "stale_verification",
      reachabilityAssessmentState: "blocked",
      deliveryRiskState: "at_risk",
      enqueueIdempotencyKey: "enqueue_153_queued",
      queuedAt: "2026-04-14T22:20:00Z",
    });
    const replay = await service.queueConfirmationCommunication({
      requestRef: "request_153_queued",
      requestLineageRef: "lineage_153_queued",
      triageTaskRef: "triage_153_queued",
      receiptEnvelopeRef: "receipt_153_queued",
      outcomeArtifactRef: "artifact_153_queued",
      contactPreferencesRef: "cpref_153_queued",
      routeSnapshotSeedRef: "seed_153_queued",
      currentContactRouteSnapshotRef: "route_snapshot_153_queued",
      currentReachabilityAssessmentRef: "reachability_153_queued",
      reachabilityDependencyRef: "dependency_153_queued",
      preferredChannel: "sms",
      maskedDestination: "+44 ••••••0123",
      templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
      routeAuthorityState: "stale_verification",
      reachabilityAssessmentState: "blocked",
      deliveryRiskState: "at_risk",
      enqueueIdempotencyKey: "enqueue_153_queued",
      queuedAt: "2026-04-14T22:20:00Z",
    });

    expect(first.replayed).toBe(false);
    expect(first.events.map((event) => event.eventType)).toContain("communication.queued");
    expect(first.envelope.toSnapshot().dispatchContractRef).toBe(
      phase1ConfirmationDispatchContractRef,
    );
    expect(first.envelope.toSnapshot().dispatchEligibilityState).toBe("blocked_route_truth");
    expect(first.receiptBridge.toSnapshot().authoritativeOutcomeState).toBe("recovery_required");
    expect(replay.replayed).toBe(true);
    expect(replay.envelope.communicationEnvelopeId).toBe(first.envelope.communicationEnvelopeId);
  });

  it("keeps transport settlement distinct from delivery evidence and emits callback evidence separately", async () => {
    const service = createPhase1ConfirmationDispatchService();

    const queued = await service.queueConfirmationCommunication({
      requestRef: "request_153_delivery",
      requestLineageRef: "lineage_153_delivery",
      triageTaskRef: "triage_153_delivery",
      receiptEnvelopeRef: "receipt_153_delivery",
      outcomeArtifactRef: "artifact_153_delivery",
      contactPreferencesRef: "cpref_153_delivery",
      routeSnapshotSeedRef: "seed_153_delivery",
      currentContactRouteSnapshotRef: "route_snapshot_153_delivery",
      currentReachabilityAssessmentRef: "reachability_153_delivery",
      reachabilityDependencyRef: "dependency_153_delivery",
      preferredChannel: "email",
      maskedDestination: "p•••@example.com",
      templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
      routeAuthorityState: "current",
      reachabilityAssessmentState: "at_risk",
      deliveryRiskState: "at_risk",
      enqueueIdempotencyKey: "enqueue_153_delivery",
      queuedAt: "2026-04-14T22:21:00Z",
    });
    const accepted = await service.dispatchQueuedConfirmation({
      communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
      transportSettlementKey: "transport_153_delivery_accepted",
      workerRunRef: "worker_153_delivery",
      providerMode: "simulator",
      transportOutcome: "accepted",
      providerCorrelationRef: "provider_153_delivery",
      recordedAt: "2026-04-14T22:21:10Z",
    });
    const delivered = await service.recordDeliveryEvidence({
      communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
      deliveryEvidenceKey: "delivery_153_delivery",
      evidenceSource: "simulator_delivery_webhook",
      providerCorrelationRef: "provider_153_delivery",
      deliveryEvidenceState: "delivered",
      observedAt: "2026-04-14T22:21:20Z",
      recordedAt: "2026-04-14T22:21:21Z",
    });

    expect(accepted.transportSettlement?.toSnapshot().outcome).toBe("accepted");
    expect(accepted.envelope.toSnapshot().transportAckState).toBe("accepted");
    expect(accepted.receiptBridge.toSnapshot().authoritativeOutcomeState).toBe(
      "awaiting_delivery_truth",
    );
    expect(delivered.envelope.toSnapshot().deliveryEvidenceState).toBe("delivered");
    expect(delivered.receiptBridge.toSnapshot().authoritativeOutcomeState).toBe(
      "delivery_confirmed",
    );
    expect(delivered.events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "communication.delivery.evidence.recorded",
        "communication.callback.outcome.recorded",
      ]),
    );
  });
});
