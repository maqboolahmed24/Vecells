import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";
import { createNotificationDispatchApplication } from "../src/confirmation-dispatch.ts";

describe("notification-worker webhook reconciliation integration", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("keeps delivery ambiguity queue-only instead of widening to a generic outage", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      NOTIFICATION_WORKER_SERVICE_PORT: "0",
      NOTIFICATION_WORKER_ADMIN_PORT: "0",
      NOTIFICATION_WORKER_DISPATCH_BATCH_SIZE: "50",
    });
    const application = createNotificationDispatchApplication({
      serviceName: config.serviceName,
      environment: config.environment,
      providerMode: config.providerMode,
    });
    const routeSnapshot = await application.reachabilityGovernor.freezeContactRouteSnapshot({
      subjectRef: "subject_worker_webhook_001",
      routeRef: "contact_route_worker_webhook_001",
      routeVersionRef: "contact_route_worker_webhook_001_v1",
      routeKind: "sms",
      normalizedAddressRef: "tel:+447700900123",
      preferenceProfileRef: "cpref_worker_webhook_001",
      verificationState: "verified_current",
      demographicFreshnessState: "current",
      preferenceFreshnessState: "current",
      sourceAuthorityClass: "self_asserted",
      createdAt: "2026-04-14T22:44:55Z",
    });
    const dependency = await application.reachabilityGovernor.createDependency({
      episodeId: "lineage_worker_webhook_001",
      requestId: "request_worker_webhook_001",
      domain: "patient",
      domainObjectRef: "confirmation_queue::request_worker_webhook_001",
      requiredRouteRef: routeSnapshot.snapshot.toSnapshot().routeRef,
      purpose: "outcome_confirmation",
      blockedActionScopeRefs: ["status_view", "contact_route_repair"],
      selectedAnchorRef: "receipt_outcome",
      requestReturnBundleRef: null,
      resumeContinuationRef: null,
      deadlineAt: "2026-04-16T22:45:00Z",
      failureEffect: "invalidate_pending_action",
      assessedAt: "2026-04-14T22:45:00Z",
    });
    const queued = await application.communication.queueConfirmationCommunication({
      requestRef: "request_worker_webhook_001",
      requestLineageRef: "lineage_worker_webhook_001",
      triageTaskRef: "triage_worker_webhook_001",
      receiptEnvelopeRef: "receipt_worker_webhook_001",
      outcomeArtifactRef: "artifact_worker_webhook_001",
      contactPreferencesRef: "cpref_worker_webhook_001",
      routeSnapshotSeedRef: "seed_worker_webhook_001",
      currentContactRouteSnapshotRef: routeSnapshot.snapshot.contactRouteSnapshotId,
      currentReachabilityAssessmentRef:
        dependency.assessment.reachabilityAssessmentId,
      reachabilityDependencyRef: dependency.dependency.dependencyId,
      preferredChannel: "sms",
      maskedDestination: "+44 ••••••0123",
      templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
      routeAuthorityState: dependency.assessment.toSnapshot().routeAuthorityState,
      reachabilityAssessmentState: dependency.assessment.toSnapshot().assessmentState,
      deliveryRiskState: dependency.assessment.toSnapshot().deliveryRiskState,
      enqueueIdempotencyKey: "enqueue_worker_webhook_001",
      queuedAt: "2026-04-14T22:45:00Z",
    });

    runtime = createRuntime(config, { application });
    await runtime.start();

    const dispatchResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/dispatch/envelopes`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "idem-worker-webhook-dispatch",
          "x-correlation-id": "corr-notification-webhook-dispatch",
        },
        body: JSON.stringify({
          communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
          transportSettlementKey: "transport_worker_webhook_accepted",
          transportOutcome: "accepted",
          providerCorrelationRef: "provider_worker_webhook_001",
          recordedAt: "2026-04-14T22:45:10Z",
        }),
      },
    );
    expect(dispatchResponse.status).toBe(200);

    const webhookResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/dispatch/webhooks`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "idem-worker-webhook-callback",
          "x-correlation-id": "corr-notification-webhook-callback",
        },
        body: JSON.stringify({
          communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
          deliveryEvidenceKey: "delivery_worker_webhook_001",
          webhookScenario: "delivered",
          providerCorrelationRef: "provider_worker_webhook_001",
          observedAt: "2026-04-14T22:45:20Z",
          recordedAt: "2026-04-14T22:45:21Z",
        }),
      },
    );

    expect(webhookResponse.status).toBe(200);
    const body = await webhookResponse.json();
    expect(body.webhookResult.eventTypes).toEqual(
      expect.arrayContaining([
        "communication.delivery.evidence.recorded",
        "communication.callback.outcome.recorded",
      ]),
    );

    const metrics = await application.communication.buildMetricsSnapshot(
      "2026-04-14T22:45:22Z",
    );
    expect(metrics.deliveredCount).toBe(1);
    expect(metrics.receiptRecoveryRequiredCount).toBe(0);
    const maskedTelemetry = application.telemetrySink
      .list()
      .find((entry) => entry.eventName === "notification_confirmation_webhook_recorded");
    expect(maskedTelemetry?.disclosureFence.disclosureState).toBe("masked");
  });
});
