import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";
import { createNotificationDispatchApplication } from "../src/confirmation-dispatch.ts";
import { serviceDefinition } from "../src/service-definition.ts";

describe("notification-worker runtime", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("serves health, readiness, and correlation-aware workload routes", async () => {
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
    const queued = await application.communication.queueConfirmationCommunication({
      requestRef: "request_worker_runtime_001",
      requestLineageRef: "lineage_worker_runtime_001",
      triageTaskRef: "triage_worker_runtime_001",
      receiptEnvelopeRef: "receipt_worker_runtime_001",
      outcomeArtifactRef: "artifact_worker_runtime_001",
      contactPreferencesRef: "cpref_worker_runtime_001",
      routeSnapshotSeedRef: "seed_worker_runtime_001",
      currentContactRouteSnapshotRef: "route_snapshot_worker_runtime_001",
      currentReachabilityAssessmentRef: "reachability_worker_runtime_001",
      reachabilityDependencyRef: "dependency_worker_runtime_001",
      preferredChannel: "email",
      maskedDestination: "p•••@example.com",
      templateVariantRef: "PHASE1_TRIAGE_CONFIRMATION_NOTIFICATION_V1",
      routeAuthorityState: "current",
      reachabilityAssessmentState: "at_risk",
      deliveryRiskState: "at_risk",
      enqueueIdempotencyKey: "enqueue_worker_runtime_001",
      queuedAt: "2026-04-14T22:40:00Z",
    });

    runtime = createRuntime(config, { application });
    await runtime.start();

    const healthResponse = await fetch(`http://127.0.0.1:${runtime.ports.admin}/health`);
    expect(healthResponse.status).toBe(200);
    const healthBody = await healthResponse.json();
    expect(healthBody.service).toBe(serviceDefinition.service);

    const readyResponse = await fetch(`http://127.0.0.1:${runtime.ports.admin}/ready`);
    expect(readyResponse.status).toBe(200);
    const readyBody = await readyResponse.json();
    expect(readyBody.ok).toBe(true);

    const correlationId = "corr-notification-worker";
    const routeResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/dispatch/envelopes`,
      {
        method: "POST",
        headers: {
          "x-correlation-id": correlationId,
          "idempotency-key": "idem-test-001",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          communicationEnvelopeRef: queued.envelope.communicationEnvelopeId,
          transportSettlementKey: "transport_worker_runtime_accepted",
          transportOutcome: "accepted",
          recordedAt: "2026-04-14T22:40:10Z",
        }),
      },
    );
    expect(routeResponse.status).toBe(200);
    expect(routeResponse.headers.get("x-correlation-id")).toBe(correlationId);
    const body = await routeResponse.json();
    expect(body.providerMode).toBe(config.providerMode);
    expect(body.result.skipped).toBe(false);
    expect(body.result.eventTypes).toContain("communication.command.settled");
  });
});
