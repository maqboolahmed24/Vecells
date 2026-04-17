import { shellSurfaceContracts } from "@vecells/api-contracts";
import { foundationPolicyScopes } from "@vecells/authz-policy";
import { domainModule as communicationsDomain } from "@vecells/domain-communications";
import { domainModule as identityAccessDomain } from "@vecells/domain-identity-access";
import { domainModule as supportDomain } from "@vecells/domain-support";
import type { EdgeCorrelationContext } from "@vecells/observability";
import {
  foundationReleasePosture,
} from "@vecells/release-controls";
import type { NotificationDispatchApplication } from "./confirmation-dispatch";
import type { ServiceConfig } from "./config";

export interface ServiceRouteDefinition {
  routeId: string;
  method: "GET" | "POST";
  path: string;
  contractFamily: string;
  purpose: string;
  bodyRequired: boolean;
  idempotencyRequired: boolean;
}

export interface WorkloadRequestContext {
  correlationId: string;
  traceId: string;
  edgeCorrelation: EdgeCorrelationContext;
  config: ServiceConfig;
  headers: Record<string, string>;
  requestBody: unknown;
  readiness: ReadonlyArray<{ name: string; status: "ready" }>;
  application: NotificationDispatchApplication;
}

export interface WorkloadResponse {
  statusCode: number;
  body: unknown;
}

const replayFamilies = shellSurfaceContracts["support-workspace"].routeFamilyIds;

export const serviceDefinition = {
  service: "notification-worker",
  packageName: "@vecells/notification-worker",
  ownerContext: "platform_integration",
  workloadFamily: "notification_dispatch_and_settlement",
  purpose:
    "Own dispatch envelopes, provider adapter boundaries, settlement callbacks, controlled resend hooks, and secret-safe delivery seams without embedding live provider credentials.",
  truthBoundary:
    "Dispatch acceptance is not delivery truth. Provider callbacks, resend policy, and settlement evidence stay explicit and can fail closed.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "dispatch_envelope",
      method: "POST",
      path: "/dispatch/envelopes",
      contractFamily: "CanonicalEventContract",
      purpose: "Process one queued confirmation envelope through provider transport settlement.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "dispatch_webhook",
      method: "POST",
      path: "/dispatch/webhooks",
      contractFamily: "CanonicalEventContract",
      purpose:
        "Ingest deterministic provider webhook evidence and reconcile delivery posture without leaking raw provider payloads.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "dispatch_settlement",
      method: "GET",
      path: "/dispatch/settlement",
      contractFamily: "DependencyDegradationProfile",
      purpose:
        "Expose delivery settlement ladder, resend controls, and safe provider boundary posture.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: ["communication.queued"],
    publishes: [
      "communication.command.settled",
      "communication.delivery.evidence.recorded",
      "communication.callback.outcome.recorded",
    ],
  },
  readinessChecks: [
    {
      name: "provider_secret_boundary",
      detail:
        "Provider credentials and webhook material remain env-ref-only and never land in fixtures or manifests.",
      failureMode: "Fail closed before any placeholder provider action is attempted.",
    },
    {
      name: "delivery_settlement",
      detail: "Delivery callbacks and settlement status remain separate from dispatch acceptance.",
      failureMode: "Mark the envelope awaiting_settlement and hold resend review open.",
    },
    {
      name: "controlled_resend",
      detail:
        "Resend is an explicit hook with cooldown or named-review posture, not an automatic blind retry.",
      failureMode: "Escalate to review-required resend posture.",
    },
  ] as const,
  retryProfiles: [
    {
      class: "transient_provider_retry",
      triggers: ["provider timeout", "callback jitter", "temporary suppression"],
      outcome:
        "Retry inside the delivery window while preserving envelope lineage and idempotency.",
    },
    {
      class: "permanent_delivery_review",
      triggers: ["hard bounce", "invalid destination", "provider suppression"],
      outcome: "Escalate to settlement review or manual resend rather than inferring recovery.",
    },
  ] as const,
  secretBoundaries: [
    "NOTIFICATION_PROVIDER_SECRET_REF",
    "NOTIFICATION_WEBHOOK_SECRET_REF",
    "NOTIFICATION_SIGNING_KEY_REF",
  ] as const,
  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
} as const;

export async function buildWorkloadResponse(
  route: ServiceRouteDefinition,
  context: WorkloadRequestContext,
): Promise<WorkloadResponse> {
  if (route.routeId === "dispatch_settlement") {
    const metrics = await context.application.communication.buildMetricsSnapshot(
      new Date().toISOString(),
    );
    return {
      statusCode: 200,
      body: {
        service: serviceDefinition.service,
        providerMode: context.config.providerMode,
        callbackSettlementWindowSeconds: context.config.callbackSettlementWindowSeconds,
        resendGuardMode: context.config.resendGuardMode,
        replayRouteFamilies: replayFamilies,
        deliverySettlementStates: ["awaiting_callback", "delivered", "failed", "review_required"],
        releaseWatch: foundationReleasePosture["support-workspace"],
        domainPackages: [communicationsDomain, identityAccessDomain, supportDomain],
        metrics,
      },
    };
  }

  const requestBody =
    typeof context.requestBody === "object" && context.requestBody !== null
      ? (context.requestBody as Record<string, unknown>)
      : {};
  const communicationEnvelopeRef =
    typeof requestBody.communicationEnvelopeRef === "string"
      ? requestBody.communicationEnvelopeRef
      : null;
  if (!communicationEnvelopeRef) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        error: "COMMUNICATION_ENVELOPE_REF_REQUIRED",
        routeId: route.routeId,
      },
    };
  }

  if (route.routeId === "dispatch_envelope") {
    const rawTransportOutcome =
      typeof requestBody.transportOutcome === "string" ? requestBody.transportOutcome : null;
    const transportOutcome =
      rawTransportOutcome === "rejected" || rawTransportOutcome === "timed_out"
        ? rawTransportOutcome
        : "accepted";
    const result = await context.application.processQueuedConfirmation({
      communicationEnvelopeRef,
      transportSettlementKey:
        typeof requestBody.transportSettlementKey === "string"
          ? requestBody.transportSettlementKey
          : `${communicationEnvelopeRef}::transport::${transportOutcome}`,
      workerRunRef:
        typeof requestBody.workerRunRef === "string"
          ? requestBody.workerRunRef
          : `worker_run::${context.correlationId}`,
      transportOutcome,
      providerCorrelationRef:
        typeof requestBody.providerCorrelationRef === "string"
          ? requestBody.providerCorrelationRef
          : null,
      recordedAt:
        typeof requestBody.recordedAt === "string"
          ? requestBody.recordedAt
          : new Date().toISOString(),
      correlation: context.edgeCorrelation,
    });

    return {
      statusCode: 200,
      body: {
        service: serviceDefinition.service,
        accepted: true,
        correlationId: context.correlationId,
        traceId: context.traceId,
        providerMode: context.config.providerMode,
        result,
      },
    };
  }

  const webhookScenario =
    typeof requestBody.webhookScenario === "string"
      ? requestBody.webhookScenario
      : "delivered";
  const webhookResult = await context.application.ingestConfirmationWebhook({
    communicationEnvelopeRef,
    deliveryEvidenceKey:
      typeof requestBody.deliveryEvidenceKey === "string"
        ? requestBody.deliveryEvidenceKey
        : `${communicationEnvelopeRef}::webhook::${webhookScenario}`,
    webhookScenario:
      webhookScenario === "bounced" ||
      webhookScenario === "expired" ||
      webhookScenario === "suppressed" ||
      webhookScenario === "disputed"
        ? webhookScenario
        : "delivered",
    providerCorrelationRef:
      typeof requestBody.providerCorrelationRef === "string"
        ? requestBody.providerCorrelationRef
        : null,
    observedAt:
      typeof requestBody.observedAt === "string"
        ? requestBody.observedAt
        : new Date().toISOString(),
    recordedAt:
      typeof requestBody.recordedAt === "string"
        ? requestBody.recordedAt
        : new Date().toISOString(),
    correlation: context.edgeCorrelation,
  });

  return {
    statusCode: 200,
    body: {
      service: serviceDefinition.service,
      accepted: true,
      correlationId: context.correlationId,
      traceId: context.traceId,
      governanceScope: foundationPolicyScopes.governance_release,
      providerMode: context.config.providerMode,
      webhookResult,
    },
  };
}
