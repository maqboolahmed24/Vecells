import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createApiContractRegistryStore,
  type ApiContractRouteBundle,
} from "@vecells/api-contracts";
import {
  resolveGatewayRouteDegradation,
  type DependencyFailureModeClass,
  type DependencyHealthState,
} from "@vecells/release-controls";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "gateway_surface_manifest.json");

type AuthorityState = "published" | "degraded" | "blocked";

interface GatewayServiceRow {
  gatewayServiceRef: string;
  serviceLabel: string;
  audienceFamily: string;
  shellSlug: string;
  gatewaySurfaceRefs: string[];
  routeFamilyRefs: string[];
  channelProfiles: string[];
  sessionPolicyRefs: string[];
  tenantIsolationModes: string[];
  allowedDownstreamWorkloadFamilyRefs: string[];
  trustZoneBoundaryRefs: string[];
  requiredAssuranceSliceRefs: string[];
  entrypointBasePath: string;
  authorityEndpointPath: string;
  openApiEndpointPath: string;
  evaluationEndpointPath: string;
  combinedSurfaceJustification: string;
  authorityState: AuthorityState;
  publicationState: string;
  openApiPublicationRef: string;
  deploymentDescriptorRef: string;
  localBootstrapRef: string;
  source_refs: string[];
}

interface GatewaySurfaceRow {
  surfaceId: string;
  gatewayServiceRef: string;
  surfaceName: string;
  audience: string;
  audienceSurfaceRef: string;
  shellType: string;
  channelProfile: string;
  routeFamilyRefs: string[];
  allowedDownstreamWorkloadFamilyRefs: string[];
  trustZoneBoundaryRefs: string[];
  tenantIsolationMode: string;
  sessionPolicyRef: string;
  cachePolicyRef: string;
  frontendContractManifestRef: string | null;
  audienceSurfaceRuntimeBindingRef: string | null;
  runtimePublicationBundleRef: string | null;
  authorityState: AuthorityState;
  publicationState: string;
  surfaceAuthorityTupleHash: string;
  rationale: string;
  source_refs: string[];
}

interface RoutePublicationRow {
  routePublicationRef: string;
  gatewayServiceRef: string;
  routeFamilyRef: string;
  routeFamilyLabel: string;
  audienceSurfaceRef: string;
  primaryGatewaySurfaceRef: string;
  gatewaySurfaceRefs: string[];
  projectionQueryContractRef: string | null;
  mutationCommandContractRef: string | null;
  liveUpdateChannelContractRef: string | null;
  clientCachePolicyRefs: string[];
  validationState: string;
  browserPostureState: string;
  routeState: AuthorityState;
  publicationState: string;
  allowedDownstreamWorkloadFamilyRefs: string[];
  sessionPolicyRef: string;
  tenantIsolationMode: string;
  frontendContractManifestRef: string | null;
  parallelInterfaceGapRefs: string[];
  source_refs: string[];
}

interface BoundaryRow {
  gateway_service_ref: string;
  gateway_surface_ref: string;
  route_family_refs: string;
  boundary_scope: string;
  downstream_workload_family_ref: string;
  trust_zone_boundary_ref: string;
  boundary_rule_ref: string;
  boundary_state: string;
  allowed_protocol_refs: string;
  tenant_transfer_mode: string;
  assurance_trust_transfer_mode: string;
  adapter_egress_allowed: string;
  raw_data_plane_access_allowed: string;
}

interface RefusalPolicyRow {
  refusalPolicyRef: string;
  errorCode: string;
  httpStatus: number;
  ruleSummary: string;
  source_refs: string[];
}

interface DeploymentDescriptorRow {
  deploymentDescriptorRef: string;
  gatewayServiceRef: string;
  serviceModulePath: string;
  runtimeEntrypoint: string;
  servicePortEnvKey: string;
  adminPortEnvKey: string;
  entrypointBasePath: string;
  healthPath: string;
  manifestPath: string;
  openApiPath: string;
  evaluationPath: string;
  localBaseUrl: string;
  ciBasePath: string;
  requiredSecretRefs: string[];
  source_refs: string[];
}

interface LocalBootstrapRow {
  localBootstrapRef: string;
  gatewayServiceRef: string;
  startupCommand: string;
  projectionSeedRefs: string[];
  simulatorBackplaneRefs: string[];
  serviceBasePath: string;
  healthPath: string;
  source_refs: string[];
}

interface GatewayAuthorityManifest {
  task_id: string;
  visual_mode: string;
  summary: Record<string, number>;
  gateway_services: GatewayServiceRow[];
  gateway_surfaces: GatewaySurfaceRow[];
  route_publications: RoutePublicationRow[];
  boundary_rows: BoundaryRow[];
  refusal_policies: RefusalPolicyRow[];
  deployment_descriptors: DeploymentDescriptorRow[];
  local_bootstrap: LocalBootstrapRow[];
  parallel_interface_gaps: Array<Record<string, unknown>>;
  manifest_digest_ref: string;
}

interface GatewaySurfaceAuthorityFilter {
  gatewayServiceRef?: string;
  audienceFamily?: string;
  channelProfile?: string;
  boundaryState?: string;
  routeFamilyRef?: string;
  publicationState?: string;
}

interface EvaluationRequestBody {
  gatewayServiceRef?: string;
  gatewaySurfaceRef?: string;
  routeFamilyRef?: string;
  operationKind?: "read" | "mutation" | "stream" | "cache";
  contractRef?: string;
  downstreamWorkloadFamilyRef?: string;
  channelProfile?: string;
  sessionPolicyRef?: string;
  cachePolicyRef?: string;
  requestsAdapterEgress?: boolean;
  requestsRawDataPlaneAccess?: boolean;
  dependencyCode?: string;
  observedFailureModeClass?: DependencyFailureModeClass;
  healthState?: DependencyHealthState;
  environmentRing?: string;
  runtimePublicationState?: "published" | "stale" | "conflict" | "withdrawn";
  parityState?: "exact" | "stale" | "conflict" | "withdrawn";
  routeExposureState?: "publishable" | "constrained" | "frozen" | "withdrawn";
  trustFreezeLive?: boolean;
  assuranceHardBlock?: boolean;
}

interface EvaluationResponseBody {
  ok: boolean;
  error?: string;
  refusalPolicyRef?: string;
  routeFamilyRef?: string;
  gatewayServiceRef?: string;
  gatewaySurfaceRef?: string;
  operationKind?: string;
  authorityState?: string;
  publicationState?: string;
  allowedDownstreamWorkloadFamilyRefs?: string[];
  degradationDecision?: Record<string, unknown>;
  source_refs?: string[];
}

function readManifest(): GatewayAuthorityManifest {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as GatewayAuthorityManifest;
}

function normalizeOptional(value: string | null): string | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildOpenApiDocument(
  service: GatewayServiceRow,
  routePublications: readonly RoutePublicationRow[],
  registryBundles: readonly ApiContractRouteBundle[],
): Record<string, unknown> {
  const paths: Record<string, unknown> = {};
  for (const route of routePublications) {
    const routePathBase = `${service.entrypointBasePath}/routes/${route.routeFamilyRef}`;
    const registryBundle = registryBundles.find(
      (bundle) => bundle.routeFamilyRef === route.routeFamilyRef,
    );

    if (route.projectionQueryContractRef) {
      paths[`${routePathBase}/read`] = {
        get: {
          summary: `Read ${route.routeFamilyLabel}`,
          tags: [service.gatewayServiceRef],
          responses: {
            "200": {
              description: "Declared projection query contract",
            },
          },
          "x-vecells-contract-ref": route.projectionQueryContractRef,
          "x-vecells-browser-posture": route.browserPostureState,
        },
      };
    }

    if (route.mutationCommandContractRef) {
      paths[`${routePathBase}/mutation`] = {
        post: {
          summary: `Mutate ${route.routeFamilyLabel}`,
          tags: [service.gatewayServiceRef],
          responses: {
            "200": { description: "Declared mutation command contract" },
            "403": { description: "Refused by gateway authority rules" },
            "409": { description: "Blocked by publication or contract posture" },
          },
          "x-vecells-contract-ref": route.mutationCommandContractRef,
          "x-vecells-route-state": route.routeState,
        },
      };
    }

    if (route.liveUpdateChannelContractRef) {
      paths[`${routePathBase}/stream`] = {
        get: {
          summary: `Live updates for ${route.routeFamilyLabel}`,
          tags: [service.gatewayServiceRef],
          responses: {
            "200": { description: "Declared live update channel contract" },
          },
          "x-vecells-contract-ref": route.liveUpdateChannelContractRef,
          "x-vecells-staleness-posture":
            registryBundle?.browserPostureState ?? route.browserPostureState,
        },
      };
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: service.serviceLabel,
      version: "v1",
      description:
        "Audience-specific gateway authority publication for the Vecells mock-now runtime.",
    },
    servers: [
      {
        url: service.entrypointBasePath,
      },
    ],
    tags: [
      {
        name: service.gatewayServiceRef,
        description: service.combinedSurfaceJustification,
      },
    ],
    paths,
  };
}

export class GatewaySurfaceAuthorityStore {
  readonly manifest: GatewayAuthorityManifest;
  readonly registry = createApiContractRegistryStore();
  readonly servicesByRef = new Map<string, GatewayServiceRow>();
  readonly surfacesById = new Map<string, GatewaySurfaceRow>();
  readonly routesByRef = new Map<string, RoutePublicationRow>();
  readonly refusalPoliciesByCode = new Map<string, RefusalPolicyRow>();
  readonly refusalPoliciesByRef = new Map<string, RefusalPolicyRow>();

  constructor(manifest: GatewayAuthorityManifest = readManifest()) {
    this.manifest = manifest;
    this.validateManifest();
    for (const service of manifest.gateway_services) {
      this.servicesByRef.set(service.gatewayServiceRef, service);
    }
    for (const surface of manifest.gateway_surfaces) {
      this.surfacesById.set(surface.surfaceId, surface);
    }
    for (const route of manifest.route_publications) {
      this.routesByRef.set(route.routeFamilyRef, route);
    }
    for (const policy of manifest.refusal_policies) {
      this.refusalPoliciesByCode.set(policy.errorCode, policy);
      this.refusalPoliciesByRef.set(policy.refusalPolicyRef, policy);
    }
  }

  private validateManifest(): void {
    const manifest = this.manifest;
    if (manifest.task_id !== "par_090") {
      throw new Error("GATEWAY_SURFACE_AUTHORITY_TASK_ID_DRIFT");
    }
    if (manifest.visual_mode !== "Gateway_Surface_Authority_Atlas") {
      throw new Error("GATEWAY_SURFACE_AUTHORITY_VISUAL_MODE_DRIFT");
    }
    if (manifest.summary.gateway_service_count !== manifest.gateway_services.length) {
      throw new Error("GATEWAY_SURFACE_AUTHORITY_SERVICE_COUNT_DRIFT");
    }
    if (manifest.summary.gateway_surface_count !== manifest.gateway_surfaces.length) {
      throw new Error("GATEWAY_SURFACE_AUTHORITY_SURFACE_COUNT_DRIFT");
    }
    if (manifest.summary.route_publication_count !== manifest.route_publications.length) {
      throw new Error("GATEWAY_SURFACE_AUTHORITY_ROUTE_COUNT_DRIFT");
    }

    const serviceRefs = new Set<string>();
    for (const service of manifest.gateway_services) {
      if (serviceRefs.has(service.gatewayServiceRef)) {
        throw new Error(`GATEWAY_SURFACE_AUTHORITY_DUPLICATE_SERVICE:${service.gatewayServiceRef}`);
      }
      serviceRefs.add(service.gatewayServiceRef);
    }

    const surfaceRefs = new Set<string>();
    for (const surface of manifest.gateway_surfaces) {
      if (surfaceRefs.has(surface.surfaceId)) {
        throw new Error(`GATEWAY_SURFACE_AUTHORITY_DUPLICATE_SURFACE:${surface.surfaceId}`);
      }
      surfaceRefs.add(surface.surfaceId);
      if (!serviceRefs.has(surface.gatewayServiceRef)) {
        throw new Error(`GATEWAY_SURFACE_AUTHORITY_SURFACE_UNKNOWN_SERVICE:${surface.surfaceId}`);
      }
    }

    const routeRefs = new Set<string>();
    for (const route of manifest.route_publications) {
      if (routeRefs.has(route.routeFamilyRef)) {
        throw new Error(`GATEWAY_SURFACE_AUTHORITY_DUPLICATE_ROUTE:${route.routeFamilyRef}`);
      }
      routeRefs.add(route.routeFamilyRef);
      if (!serviceRefs.has(route.gatewayServiceRef)) {
        throw new Error(`GATEWAY_SURFACE_AUTHORITY_ROUTE_UNKNOWN_SERVICE:${route.routeFamilyRef}`);
      }
      if (!surfaceRefs.has(route.primaryGatewaySurfaceRef)) {
        throw new Error(
          `GATEWAY_SURFACE_AUTHORITY_ROUTE_UNKNOWN_PRIMARY_SURFACE:${route.routeFamilyRef}`,
        );
      }
      for (const downstream of route.allowedDownstreamWorkloadFamilyRefs) {
        if (
          ![
            "wf_projection_read_models",
            "wf_command_orchestration",
            "wf_assurance_security_control",
          ].includes(downstream)
        ) {
          throw new Error(
            `GATEWAY_SURFACE_AUTHORITY_ROUTE_FORBIDDEN_DOWNSTREAM:${route.routeFamilyRef}:${downstream}`,
          );
        }
      }
    }
  }

  listGatewayServices(filter: GatewaySurfaceAuthorityFilter = {}): GatewayServiceRow[] {
    const routeRef = filter.routeFamilyRef;
    const routeStateByService = new Map<string, Set<string>>();
    for (const route of this.manifest.route_publications) {
      const items = routeStateByService.get(route.gatewayServiceRef) ?? new Set<string>();
      items.add(route.routeState);
      this.manifest.boundary_rows
        .filter((row) => row.gateway_service_ref === route.gatewayServiceRef)
        .forEach((row) => items.add(row.boundary_state === "blocked" ? "blocked" : "published"));
      routeStateByService.set(route.gatewayServiceRef, items);
    }

    return this.manifest.gateway_services.filter((service) => {
      if (filter.gatewayServiceRef && service.gatewayServiceRef !== filter.gatewayServiceRef) {
        return false;
      }
      if (filter.audienceFamily && service.audienceFamily !== filter.audienceFamily) {
        return false;
      }
      if (filter.channelProfile && !service.channelProfiles.includes(filter.channelProfile)) {
        return false;
      }
      if (routeRef && !service.routeFamilyRefs.includes(routeRef)) {
        return false;
      }
      if (
        filter.publicationState &&
        service.publicationState !== filter.publicationState &&
        service.authorityState !== filter.publicationState
      ) {
        return false;
      }
      if (filter.boundaryState) {
        const states = routeStateByService.get(service.gatewayServiceRef) ?? new Set<string>();
        if (!states.has(filter.boundaryState)) {
          return false;
        }
      }
      return true;
    });
  }

  listGatewaySurfaces(filter: GatewaySurfaceAuthorityFilter = {}): GatewaySurfaceRow[] {
    return this.manifest.gateway_surfaces.filter((surface) => {
      if (filter.gatewayServiceRef && surface.gatewayServiceRef !== filter.gatewayServiceRef) {
        return false;
      }
      if (filter.audienceFamily) {
        const service = this.servicesByRef.get(surface.gatewayServiceRef);
        if (!service || service.audienceFamily !== filter.audienceFamily) {
          return false;
        }
      }
      if (filter.channelProfile && surface.channelProfile !== filter.channelProfile) {
        return false;
      }
      if (filter.routeFamilyRef && !surface.routeFamilyRefs.includes(filter.routeFamilyRef)) {
        return false;
      }
      if (
        filter.publicationState &&
        surface.publicationState !== filter.publicationState &&
        surface.authorityState !== filter.publicationState
      ) {
        return false;
      }
      if (filter.boundaryState) {
        const boundaryStates = this.manifest.boundary_rows
          .filter((row) => row.gateway_surface_ref === surface.surfaceId)
          .map((row) => row.boundary_state);
        if (!boundaryStates.includes(filter.boundaryState)) {
          return false;
        }
      }
      return true;
    });
  }

  listRoutePublications(filter: GatewaySurfaceAuthorityFilter = {}): RoutePublicationRow[] {
    return this.manifest.route_publications.filter((route) => {
      if (filter.gatewayServiceRef && route.gatewayServiceRef !== filter.gatewayServiceRef) {
        return false;
      }
      if (filter.routeFamilyRef && route.routeFamilyRef !== filter.routeFamilyRef) {
        return false;
      }
      if (filter.publicationState && route.routeState !== filter.publicationState) {
        return false;
      }
      if (filter.channelProfile) {
        const primarySurface = this.surfacesById.get(route.primaryGatewaySurfaceRef);
        if (!primarySurface || primarySurface.channelProfile !== filter.channelProfile) {
          return false;
        }
      }
      if (filter.audienceFamily) {
        const service = this.servicesByRef.get(route.gatewayServiceRef);
        if (!service || service.audienceFamily !== filter.audienceFamily) {
          return false;
        }
      }
      return true;
    });
  }

  listBoundaryRows(filter: GatewaySurfaceAuthorityFilter = {}): BoundaryRow[] {
    return this.manifest.boundary_rows.filter((row) => {
      if (filter.gatewayServiceRef && row.gateway_service_ref !== filter.gatewayServiceRef) {
        return false;
      }
      if (filter.boundaryState && row.boundary_state !== filter.boundaryState) {
        return false;
      }
      if (
        filter.routeFamilyRef &&
        !row.route_family_refs
          .split(";")
          .map((value) => value.trim())
          .includes(filter.routeFamilyRef)
      ) {
        return false;
      }
      if (filter.channelProfile) {
        const surface = this.surfacesById.get(row.gateway_surface_ref);
        if (!surface || surface.channelProfile !== filter.channelProfile) {
          return false;
        }
      }
      if (filter.audienceFamily) {
        const service = this.servicesByRef.get(row.gateway_service_ref);
        if (!service || service.audienceFamily !== filter.audienceFamily) {
          return false;
        }
      }
      return true;
    });
  }

  buildOpenApiDocuments(gatewayServiceRef?: string) {
    const services = gatewayServiceRef
      ? [this.servicesByRef.get(gatewayServiceRef)].filter(
          (service): service is GatewayServiceRow => Boolean(service),
        )
      : this.manifest.gateway_services;

    return services.map((service) => ({
      gatewayServiceRef: service.gatewayServiceRef,
      openApiPublicationRef: service.openApiPublicationRef,
      document: buildOpenApiDocument(
        service,
        this.manifest.route_publications.filter(
          (route) => route.gatewayServiceRef === service.gatewayServiceRef,
        ),
        this.registry.listRouteFamilyBundles(),
      ),
    }));
  }

  evaluate(body: unknown): { statusCode: number; body: EvaluationResponseBody } {
    if (!isRecord(body)) {
      return this.refusal("REQUEST_BODY_REQUIRED", {
        operationKind: "unknown",
      });
    }

    const request = body as EvaluationRequestBody;
    const gatewayServiceRef = request.gatewayServiceRef;
    const routeFamilyRef = request.routeFamilyRef;
    const operationKind = request.operationKind;

    if (!gatewayServiceRef || !routeFamilyRef || !operationKind) {
      return this.refusal("REQUEST_BODY_REQUIRED", {
        gatewayServiceRef,
        routeFamilyRef,
        operationKind,
      });
    }

    const service = this.servicesByRef.get(gatewayServiceRef);
    if (!service) {
      return this.refusal("GATEWAY_ROUTE_UNDECLARED", {
        gatewayServiceRef,
        routeFamilyRef,
        operationKind,
      });
    }

    const route = this.routesByRef.get(routeFamilyRef);
    if (!route || route.gatewayServiceRef !== gatewayServiceRef) {
      return this.refusal("GATEWAY_ROUTE_UNDECLARED", {
        gatewayServiceRef,
        routeFamilyRef,
        operationKind,
      });
    }

    const primarySurface = this.surfacesById.get(route.primaryGatewaySurfaceRef);
    if (!primarySurface) {
      return this.refusal("SURFACE_PUBLICATION_BLOCKED", {
        gatewayServiceRef,
        routeFamilyRef,
        operationKind,
      });
    }

    if (request.gatewaySurfaceRef && request.gatewaySurfaceRef !== route.primaryGatewaySurfaceRef) {
      return this.refusal("GATEWAY_ROUTE_UNDECLARED", {
        gatewayServiceRef,
        gatewaySurfaceRef: request.gatewaySurfaceRef,
        routeFamilyRef,
        operationKind,
      });
    }

    if (request.channelProfile && request.channelProfile !== primarySurface.channelProfile) {
      return this.refusal("SESSION_POLICY_MISMATCH", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (request.sessionPolicyRef && request.sessionPolicyRef !== route.sessionPolicyRef) {
      return this.refusal("SESSION_POLICY_MISMATCH", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (request.requestsAdapterEgress) {
      return this.refusal("DIRECT_ADAPTER_EGRESS_FORBIDDEN", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (request.requestsRawDataPlaneAccess) {
      return this.refusal("RAW_DATA_PLANE_ACCESS_FORBIDDEN", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (
      request.downstreamWorkloadFamilyRef &&
      !route.allowedDownstreamWorkloadFamilyRefs.includes(request.downstreamWorkloadFamilyRef)
    ) {
      return this.refusal("DOWNSTREAM_WORKLOAD_FAMILY_FORBIDDEN", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (route.routeState === "blocked") {
      return this.refusal("SURFACE_PUBLICATION_BLOCKED", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (
      operationKind === "read" &&
      request.contractRef &&
      request.contractRef !== route.projectionQueryContractRef
    ) {
      return this.refusal("GATEWAY_ROUTE_UNDECLARED", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (
      operationKind === "mutation" &&
      (!route.mutationCommandContractRef ||
        (request.contractRef && request.contractRef !== route.mutationCommandContractRef))
    ) {
      return this.refusal("GATEWAY_ROUTE_UNDECLARED", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (
      operationKind === "stream" &&
      (!route.liveUpdateChannelContractRef ||
        (request.contractRef && request.contractRef !== route.liveUpdateChannelContractRef))
    ) {
      return this.refusal("LIVE_CHANNEL_UNDECLARED", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    if (
      operationKind === "cache" &&
      ((request.cachePolicyRef && !route.clientCachePolicyRefs.includes(request.cachePolicyRef)) ||
        (request.contractRef && !route.clientCachePolicyRefs.includes(request.contractRef)))
    ) {
      return this.refusal("CACHE_POLICY_UNDECLARED", {
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
      });
    }

    return {
      statusCode: 200,
      body: {
        ok: true,
        gatewayServiceRef,
        gatewaySurfaceRef: primarySurface.surfaceId,
        routeFamilyRef,
        operationKind,
        authorityState: primarySurface.authorityState,
        publicationState: route.publicationState,
        allowedDownstreamWorkloadFamilyRefs: route.allowedDownstreamWorkloadFamilyRefs,
        degradationDecision: request.dependencyCode
          ? (() => {
              const decision = resolveGatewayRouteDegradation({
                dependencyCode: request.dependencyCode,
                environmentRing: request.environmentRing ?? "local",
                routeFamilyRef,
                observedFailureModeClass: request.observedFailureModeClass,
                healthState: request.healthState,
                requestedWorkloadFamilyRefs: route.allowedDownstreamWorkloadFamilyRefs,
                runtimePublicationState: request.runtimePublicationState,
                parityState: request.parityState,
                routeExposureState: request.routeExposureState,
                trustFreezeLive: request.trustFreezeLive,
                assuranceHardBlock: request.assuranceHardBlock,
              });
              return {
                decisionState: decision.decisionState,
                outcomeState: decision.outcomeState,
                dependencyCode: decision.dependencyCode,
                gatewayReadMode: decision.gatewayReadResolution.mode,
                browserReadPosture: decision.browserMutationResolution.readPosture,
                browserMutationMode: decision.browserMutationResolution.mode,
                projectionPublicationMode: decision.projectionPublicationResolution.mode,
                integrationDispatchMode: decision.integrationDispatchResolution.mode,
                primaryAudienceFallback: decision.primaryAudienceFallback,
                blockedEscalationFamilyRefs: decision.blockedEscalationFamilyRefs,
                reasonRefs: decision.reasonRefs,
              };
            })()
          : undefined,
        source_refs: route.source_refs,
      },
    };
  }

  private refusal(
    errorCode: string,
    context: {
      gatewayServiceRef?: string;
      gatewaySurfaceRef?: string;
      routeFamilyRef?: string;
      operationKind?: string;
    },
  ): { statusCode: number; body: EvaluationResponseBody } {
    const policy =
      this.refusalPoliciesByCode.get(errorCode) ??
      this.refusalPoliciesByCode.get("GATEWAY_ROUTE_UNDECLARED");
    return {
      statusCode: policy?.httpStatus ?? 400,
      body: {
        ok: false,
        error: errorCode,
        refusalPolicyRef: policy?.refusalPolicyRef,
        gatewayServiceRef: context.gatewayServiceRef,
        gatewaySurfaceRef: context.gatewaySurfaceRef,
        routeFamilyRef: context.routeFamilyRef,
        operationKind: context.operationKind,
        source_refs: policy?.source_refs,
      },
    };
  }
}

let cachedStore: GatewaySurfaceAuthorityStore | undefined;

export function getGatewaySurfaceAuthorityStore(): GatewaySurfaceAuthorityStore {
  if (!cachedStore) {
    cachedStore = new GatewaySurfaceAuthorityStore();
  }
  return cachedStore;
}

export function buildGatewaySurfaceAuthorityResponse(searchParams: URLSearchParams) {
  const filters: GatewaySurfaceAuthorityFilter = {
    gatewayServiceRef: normalizeOptional(searchParams.get("gatewayServiceRef")),
    audienceFamily: normalizeOptional(searchParams.get("audienceFamily")),
    channelProfile: normalizeOptional(searchParams.get("channelProfile")),
    boundaryState: normalizeOptional(searchParams.get("boundaryState")),
    routeFamilyRef: normalizeOptional(searchParams.get("routeFamilyRef")),
    publicationState: normalizeOptional(searchParams.get("publicationState")),
  };
  const store = getGatewaySurfaceAuthorityStore();
  return {
    statusCode: 200,
    body: {
      ok: true,
      lookupMode: "gateway_surface_authority",
      filters: {
        gatewayServiceRef: filters.gatewayServiceRef ?? "all",
        audienceFamily: filters.audienceFamily ?? "all",
        channelProfile: filters.channelProfile ?? "all",
        boundaryState: filters.boundaryState ?? "all",
        routeFamilyRef: filters.routeFamilyRef ?? "all",
        publicationState: filters.publicationState ?? "all",
      },
      summary: store.manifest.summary,
      manifestDigestRef: store.manifest.manifest_digest_ref,
      gatewayServices: store.listGatewayServices(filters),
      gatewaySurfaces: store.listGatewaySurfaces(filters),
      routePublications: store.listRoutePublications(filters),
      boundaryRows: store.listBoundaryRows(filters),
      refusalPolicies: store.manifest.refusal_policies,
      deploymentDescriptors: store.manifest.deployment_descriptors,
      localBootstrap: store.manifest.local_bootstrap,
      parallelInterfaceGaps: store.manifest.parallel_interface_gaps,
    },
  } as const;
}

export function buildGatewaySurfaceOpenApiResponse(searchParams: URLSearchParams) {
  const gatewayServiceRef = normalizeOptional(searchParams.get("gatewayServiceRef"));
  const store = getGatewaySurfaceAuthorityStore();
  const documents = store.buildOpenApiDocuments(gatewayServiceRef);
  if (gatewayServiceRef && documents.length === 0) {
    return {
      statusCode: 404,
      body: {
        ok: false,
        error: "GATEWAY_SERVICE_NOT_FOUND",
        gatewayServiceRef,
      },
    } as const;
  }
  return {
    statusCode: 200,
    body: {
      ok: true,
      lookupMode: "gateway_openapi_publication",
      gatewayServiceRef: gatewayServiceRef ?? "all",
      documents,
    },
  } as const;
}

export function buildGatewaySurfaceEvaluationResponse(requestBody: unknown) {
  return getGatewaySurfaceAuthorityStore().evaluate(requestBody);
}
