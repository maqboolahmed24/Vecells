import { shellSurfaceContracts } from "@vecells/api-contracts";
import { domainModule as analyticsDomain } from "@vecells/domain-analytics-assurance";
import { domainModule as operationsDomain } from "@vecells/domain-operations";
import { makeFoundationEvent } from "@vecells/event-contracts";
import { foundationFhirMappings } from "@vecells/fhir-mapping";
import { createShellSignal } from "@vecells/observability";
import {
  foundationReleasePosture,
  resolveProjectionPublicationDegradation,
  type DependencyFailureModeClass,
  type DependencyHealthState,
} from "@vecells/release-controls";
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
  config: ServiceConfig;
  headers: Record<string, string>;
  requestBody: unknown;
  readiness: ReadonlyArray<{ name: string; status: "ready" }>;
}

export interface WorkloadResponse {
  statusCode: number;
  body: unknown;
}

const patientSignal = createShellSignal(
  "patient-web",
  shellSurfaceContracts["patient-web"].routeFamilyIds,
  shellSurfaceContracts["patient-web"].gatewaySurfaceIds,
);
const opsSignal = createShellSignal(
  "ops-console",
  shellSurfaceContracts["ops-console"].routeFamilyIds,
  shellSurfaceContracts["ops-console"].gatewaySurfaceIds,
);

export const serviceDefinition = {
  service: "projection-worker",
  packageName: "@vecells/projection-worker",
  ownerContext: "platform_runtime",
  workloadFamily: "projection_read_derivation",
  purpose:
    "Own event consumption, rebuild/backfill hooks, projection freshness markers, stale-read posture, and dead-letter seams for derived read models.",
  truthBoundary:
    "Projection output is derived read state only. It never becomes the write authority and it never hides freshness or continuity debt.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "intake_event",
      method: "POST",
      path: "/events/intake",
      contractFamily: "ProjectionContractFamily",
      purpose:
        "Accept an event-envelope placeholder, stage projection rebuild work, and expose dead-letter posture.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "projection_freshness",
      method: "GET",
      path: "/projections/freshness",
      contractFamily: "ProjectionQueryContract",
      purpose:
        "Expose freshness budgets, stale-read posture, continuity watch, and backfill hooks.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: ["command.accepted", "projection.rebuild.requested", "projection.backfill.requested"],
    publishes: ["projection.updated", "projection.dead-lettered"],
  },
  readinessChecks: [
    {
      name: "projection_freshness_budget",
      detail: "Projection freshness budget exists before derived reads are exposed as current.",
      failureMode: "Shift to stale-read posture with explicit freshness markers.",
    },
    {
      name: "dead_letter_seam",
      detail: "Poison event and dead-letter seams exist before worker intake proceeds.",
      failureMode:
        "Divert poison events and preserve continuity evidence instead of silently dropping work.",
    },
    {
      name: "backfill_hooks",
      detail: "Rebuild and backfill hooks stay wired for later catch-up work.",
      failureMode:
        "Surface backfill debt explicitly rather than allowing projection drift to accumulate invisibly.",
    },
  ] as const,
  retryProfiles: [
    {
      class: "transient_projection_retry",
      triggers: ["consumer batch timeout", "projection write contention"],
      outcome: "Retry within the freshness budget and preserve the original event lineage.",
    },
    {
      class: "poison_event_dead_letter",
      triggers: ["schema mismatch", "trust or continuity contradiction"],
      outcome: "Route the event to dead-letter review and mark affected read models stale.",
    },
  ] as const,
  secretBoundaries: ["PROJECTION_CURSOR_STORE_REF", "PROJECTION_DEAD_LETTER_STORE_REF"] as const,
  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
} as const;

export function buildWorkloadResponse(
  route: ServiceRouteDefinition,
  context: WorkloadRequestContext,
): WorkloadResponse {
  if (route.routeId === "projection_freshness") {
    return {
      statusCode: 200,
      body: {
        service: serviceDefinition.service,
        freshnessBudgetSeconds: context.config.freshnessBudgetSeconds,
        rebuildWindowMode: context.config.rebuildWindowMode,
        projections: [
          {
            name: "patient-home",
            freshnessState: "within_budget",
            staleAfterSeconds: context.config.freshnessBudgetSeconds,
            continuitySignal: patientSignal,
          },
          {
            name: "ops-telemetry",
            freshnessState: "watch",
            staleAfterSeconds: context.config.freshnessBudgetSeconds,
            continuitySignal: opsSignal,
          },
        ],
        releaseWatch: foundationReleasePosture["ops-console"],
        domainPackages: [analyticsDomain, operationsDomain],
      },
    };
  }

  const requestBody =
    typeof context.requestBody === "object" && context.requestBody !== null
      ? (context.requestBody as Record<string, unknown>)
      : {};
  const projectionName =
    typeof requestBody.projectionName === "string" ? requestBody.projectionName : "patient-home";
  const dependencyCode =
    typeof requestBody.dependencyCode === "string" ? requestBody.dependencyCode : null;
  const routeFamilyRef =
    typeof requestBody.routeFamilyRef === "string"
      ? requestBody.routeFamilyRef
      : "rf_support_replay_observe";
  const observedFailureModeClass =
    typeof requestBody.observedFailureModeClass === "string"
      ? (requestBody.observedFailureModeClass as DependencyFailureModeClass)
      : undefined;
  const healthState =
    typeof requestBody.healthState === "string"
      ? (requestBody.healthState as DependencyHealthState)
      : undefined;
  const degradationDecision = dependencyCode
    ? resolveProjectionPublicationDegradation({
        dependencyCode,
        environmentRing: context.config.environment,
        routeFamilyRef,
        observedFailureModeClass,
        healthState,
      })
    : null;

  return {
    statusCode: 200,
    body: {
      service: serviceDefinition.service,
      accepted: true,
      correlationId: context.correlationId,
      traceId: context.traceId,
      eventEnvelope: makeFoundationEvent("projection.placeholder.accepted", {
        projectionName,
        mappings: foundationFhirMappings,
      }),
      worker: {
        consumerBatchSize: context.config.consumerBatchSize,
        rebuildWindowMode: context.config.rebuildWindowMode,
      },
      deadLetter: {
        topic: context.config.deadLetterTopic,
        poisonRetryLimit: context.config.poisonRetryLimit,
        status: "armed",
      },
      degradation:
        degradationDecision === null
          ? null
          : {
              decisionState: degradationDecision.decisionState,
              dependencyCode: degradationDecision.dependencyCode,
              projectionPublicationMode:
                degradationDecision.projectionPublicationResolution.mode,
              freshnessState:
                degradationDecision.projectionPublicationResolution.freshnessState,
              gatewayReadMode: degradationDecision.gatewayReadResolution.mode,
              primaryAudienceFallback: degradationDecision.primaryAudienceFallback,
              reasonRefs: degradationDecision.reasonRefs,
            },
      continuity: {
        patientSignal,
        opsSignal,
        posture:
          degradationDecision?.projectionPublicationResolution.mode === "projection_stale"
            ? "projection-stale-explicit"
            : "stale-read-explicit",
      },
    },
  };
}
