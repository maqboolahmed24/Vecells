import { shellSurfaceContracts } from "@vecells/api-contracts";
import { foundationPolicyScopes } from "@vecells/authz-policy";
import { createShellSignal } from "@vecells/observability";
import { foundationReleasePosture } from "@vecells/release-controls";
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

const surfaceLedger = Object.values(shellSurfaceContracts).map((contract) => ({
  shellSlug: contract.shellSlug,
  routeFamilyIds: [...contract.routeFamilyIds],
  gatewaySurfaceIds: [...contract.gatewaySurfaceIds],
  publication: foundationReleasePosture[contract.shellSlug].publication,
  watchSignal: createShellSignal(
    contract.shellSlug,
    contract.routeFamilyIds,
    contract.gatewaySurfaceIds,
  ),
}));

export const serviceDefinition = {
  service: "api-gateway",
  packageName: "@vecells/api-gateway",
  ownerContext: "platform_runtime",
  workloadFamily: "gateway_ingress",
  purpose:
    "Own ingress HTTP, auth/session edge adapters, request correlation, rate limiting, and release-aware route-to-BFF handoff without becoming a hidden truth owner.",
  truthBoundary:
    "Ingress policy only. The gateway does not own mutation settlement, projection freshness truth, or provider delivery truth.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "list_ingress_surfaces",
      method: "GET",
      path: "/ingress/surfaces",
      contractFamily: "GatewayBffSurface",
      purpose: "Expose shell-facing gateway surfaces, route families, and ingress policy seams.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "get_release_awareness",
      method: "GET",
      path: "/ingress/release-awareness",
      contractFamily: "ReleaseGateEvidence",
      purpose: "Expose release ring, publication watch, and route-freeze awareness hooks.",
      bodyRequired: false,
      idempotencyRequired: false,
    },

    {
      routeId: "get_gateway_surface_authority",
      method: "GET",
      path: "/authority/surfaces",
      contractFamily: "GatewaySurfaceAuthorityManifest",
      purpose:
        "Expose audience-scoped gateway services, route publications, refusal policy, and downstream boundary posture.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "get_gateway_surface_openapi",
      method: "GET",
      path: "/authority/openapi",
      contractFamily: "GatewaySurfaceOpenApiPublication",
      purpose:
        "Publish audience-scoped OpenAPI documents for declared browser-callable route families without implying undeclared handlers.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "evaluate_gateway_surface_authority",
      method: "POST",
      path: "/authority/evaluate",
      contractFamily: "GatewaySurfaceAuthorityEvaluation",
      purpose:
        "Evaluate whether a route family, contract, cache posture, or downstream boundary request is explicitly permitted.",
      bodyRequired: true,
      idempotencyRequired: false,
    },

    {
      routeId: "get_api_contract_registry",
      method: "GET",
      path: "/contracts/registry",
      contractFamily: "ApiContractRegistry",
      purpose:
        "Expose backend-published registry lookup for query, mutation, live-channel, and cache contracts.",
      bodyRequired: false,
      idempotencyRequired: false,
    },

    {
      routeId: "get_cache_live_transport_baseline",
      method: "GET",
      path: "/runtime/cache-live-transport",
      contractFamily: "LiveTransportRuntimeBaseline",
      purpose:
        "Expose cache namespace, connection-registry, replay-window, and degraded transport substrate without implying fresh truth from warm caches or open sockets.",
      bodyRequired: false,
      idempotencyRequired: false,
    },

    {
      routeId: "get_cache_channel_contracts",
      method: "GET",
      path: "/runtime/cache-channel-contracts",
      contractFamily: "BrowserRecoveryPostureContract",
      purpose:
        "Resolve route-family cache, live-channel, freshness, parity, and recovery posture from the published runtime tuple without implying fresh truth from warm caches or open transports.",
      bodyRequired: false,
      idempotencyRequired: false,
    },

    {
      routeId: "phase1_intake_get_bundle",
      method: "GET",
      path: "/phase1/intake/bundle",
      contractFamily: "Phase1IntegratedRouteAndSettlementBundle",
      purpose:
        "Expose the single browser-callable Phase 1 intake route, settlement, notification, receipt, and tracking contract consumed by the patient shell.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "phase1_intake_start_draft",
      method: "POST",
      path: "/phase1/intake/start",
      contractFamily: "DraftSaveSettlement",
      purpose:
        "Create the authoritative draft, foreground lease, resume token, and route tuple for the Quiet Clarity mission frame.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "phase1_intake_patch_draft",
      method: "POST",
      path: "/phase1/intake/patch",
      contractFamily: "DraftSaveSettlement",
      purpose:
        "Apply browser autosave through the authoritative draft session lease and settlement chain.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "phase1_intake_capture_contact",
      method: "POST",
      path: "/phase1/intake/contact",
      contractFamily: "ContactPreferenceCapture",
      purpose:
        "Capture protected contact preferences and return masked route truth for submit readiness and patient receipt copy.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "phase1_intake_submit_journey",
      method: "POST",
      path: "/phase1/intake/submit",
      contractFamily: "IntakeSubmitSettlement",
      purpose:
        "Submit the full Phase 1 journey through immutable promotion, safety, urgent or receipt outcome, triage, and notification queueing.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "phase1_intake_get_projection",
      method: "GET",
      path: "/phase1/intake/projection",
      contractFamily: "PatientReceiptConsistencyEnvelope",
      purpose:
        "Return command-following receipt, tracking, and notification projection truth for a draft or request public id.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "phase1_intake_advance_notification",
      method: "POST",
      path: "/phase1/intake/notifications/advance",
      contractFamily: "Phase1ConfirmationDispatch",
      purpose:
        "Run the simulator-backed notification worker against the queued confirmation envelope without changing receipt truth into delivery optimism.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: [],
    publishes: ["gateway.request.observed", "gateway.freeze.reviewed"],
  },
  readinessChecks: [
    {
      name: "shell_surface_contracts",
      detail: "Published gateway surface contracts load from the shared API contract package.",
      failureMode: "Fail closed to read-only ingress if route surface inventory cannot load.",
    },
    {
      name: "auth_edge_mode",
      detail:
        "Auth/session edge mode remains explicit and never implies writable authority by callback alone.",
      failureMode:
        "Return claim-pending or auth-read-only posture instead of promoting to full access.",
    },
    {
      name: "release_publication_watch",
      detail: "Publication and route-freeze awareness hooks remain wired before ingress proceeds.",
      failureMode: "Downgrade to observe-only freeze posture and require operator review.",
    },

    {
      name: "gateway_surface_authority",
      detail:
        "Audience-specific gateway authority manifests, refusal policies, and OpenAPI publications remain explicit before browser traffic is served.",
      failureMode:
        "Fail closed to declared authority lookup errors instead of inferring surface or downstream access from base paths.",
    },

    {
      name: "api_contract_registry",
      detail:
        "Published browser query, mutation, live-channel, and cache contracts load from the shared registry package.",
      failureMode:
        "Fail closed to explicit contract lookup errors instead of inferring browser authority from gateway routes.",
    },

    {
      name: "cache_live_transport_substrate",
      detail:
        "Published cache namespace and live transport substrate stays governed, gateway-safe, and explicit about stale or blocked posture.",
      failureMode:
        "Fail closed to degraded infrastructure posture instead of treating connection health or cache warmth as fresh truth.",
    },

    {
      name: "cache_channel_contract_governor",
      detail:
        "Published cache, live-update, freshness, and recovery posture tuples resolve from the shared release-controls governor before route-local shells consume them.",
      failureMode:
        "Fail closed to explicit recovery posture lookup errors instead of inferring fresh or writable truth from transport health or cached payloads.",
    },

    {
      name: "phase1_integrated_intake_bff",
      detail:
        "Phase 1 draft, autosave, attachment, contact, submit, receipt, tracking, and notification worker seams are composed as one route-family BFF contract.",
      failureMode:
        "Fail closed to same-shell recovery posture rather than allowing the browser to infer settlement or delivery truth from local state.",
    },
  ] as const,
  retryProfiles: [
    {
      class: "transient_backoff",
      triggers: ["downstream surface timeout", "auth edge simulator jitter"],
      outcome: "Retry inside ingress guard window and emit gateway.request.observed watch events.",
    },
    {
      class: "permanent_freeze",
      triggers: ["publication drift", "route freeze enforcement"],
      outcome:
        "Hold ingress at the edge and expose release-aware freeze status instead of forwarding.",
    },
  ] as const,
  secretBoundaries: ["AUTH_EDGE_SESSION_SECRET_REF", "AUTH_EDGE_SIGNING_KEY_REF"] as const,

  testHarnesses: [
    "tests/config.test.js",
    "tests/runtime.integration.test.js",
    "tests/gateway-surface-authority.integration.test.js",
    "tests/api-contract-registry.integration.test.js",
    "tests/cache-live-transport.integration.test.js",
    "tests/phase1-integrated-intake.integration.test.js",
  ] as const,
} as const;

export function buildWorkloadResponse(
  route: ServiceRouteDefinition,
  context: WorkloadRequestContext,
): WorkloadResponse {
  if (route.routeId === "list_ingress_surfaces") {
    return {
      statusCode: 200,
      body: {
        service: serviceDefinition.service,
        correlationId: context.correlationId,
        traceId: context.traceId,
        rateLimitPerMinute: context.config.rateLimitPerMinute,
        authEdgeMode: context.config.authEdgeMode,
        routeFreezeMode: context.config.routeFreezeMode,
        policyScopes: Object.keys(foundationPolicyScopes),
        surfaces: surfaceLedger,
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      service: serviceDefinition.service,
      correlationId: context.correlationId,
      traceId: context.traceId,
      releaseFreezeMode: context.config.routeFreezeMode,
      publicationMatrix: surfaceLedger.map((surface) => ({
        shellSlug: surface.shellSlug,
        publication: surface.publication,
        gatewaySurfaceCount: surface.gatewaySurfaceIds.length,
      })),
      watchSignals: surfaceLedger.map((surface) => surface.watchSignal),
    },
  };
}
