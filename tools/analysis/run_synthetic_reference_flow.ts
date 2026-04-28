import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuntime as createApiGatewayRuntime,
  type ServiceRuntime as ApiGatewayRuntime,
} from "../../services/api-gateway/src/runtime.ts";
import { loadConfig as loadApiGatewayConfig } from "../../services/api-gateway/src/config.ts";
import {
  createRuntime as createCommandApiRuntime,
  type ServiceRuntime as CommandApiRuntime,
} from "../../services/command-api/src/runtime.ts";
import { loadConfig as loadCommandApiConfig } from "../../services/command-api/src/config.ts";
import {
  createRuntime as createProjectionWorkerRuntime,
  type ServiceRuntime as ProjectionWorkerRuntime,
} from "../../services/projection-worker/src/runtime.ts";
import { loadConfig as loadProjectionWorkerConfig } from "../../services/projection-worker/src/config.ts";
import { createSubmissionBackboneApplication } from "../../services/command-api/src/submission-backbone.ts";
import { simulateSubmissionPromotionReplayScenario } from "../../services/command-api/src/submission-promotion-simulator.ts";
import { createDuplicateReviewApplication } from "../../services/command-api/src/duplicate-review.ts";
import { createRequestClosureApplication } from "../../services/command-api/src/request-closure.ts";
import { createCommandSettlementApplication } from "../../services/command-api/src/command-settlement.ts";
import { createEventSpineApplication } from "../../services/command-api/src/event-spine.ts";
import { createAssimilationSafetyApplication } from "../../services/command-api/src/assimilation-safety.ts";
import { runLifecycleCoordinatorSimulation } from "../../packages/domains/identity_access/src/lifecycle-coordinator-backbone.ts";
import { runIdentityRepairReachabilitySimulation } from "../../packages/domains/identity_access/src/identity-repair-backbone.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "data", "analysis");
const DOCS_DIR = path.join(ROOT, "docs", "programme");
const REFERENCE_CATALOG_PATH = path.join(DATA_DIR, "reference_case_catalog.json");
const TRACE_MATRIX_PATH = path.join(DATA_DIR, "reference_flow_trace_matrix.csv");
const PROJECTION_SNAPSHOTS_PATH = path.join(DATA_DIR, "reference_flow_projection_snapshots.csv");
const SETTLEMENT_CHAIN_PATH = path.join(DATA_DIR, "reference_flow_settlement_chain.jsonl");
const BLOCKER_MATRIX_PATH = path.join(DATA_DIR, "reference_flow_blocker_matrix.csv");
const SURFACE_AUTHORITY_TUPLES_PATH = path.join(DATA_DIR, "surface_authority_tuple_catalog.json");

const SYNTHETIC_FLOW_DOC_PATH = path.join(DOCS_DIR, "128_synthetic_reference_flow.md");
const CASE_CATALOG_DOC_PATH = path.join(DOCS_DIR, "128_reference_case_catalog.md");
const SEED_CONTRACT_DOC_PATH = path.join(DOCS_DIR, "128_seed_data_and_trace_contracts.md");
const OBSERVATORY_PATH = path.join(DOCS_DIR, "128_reference_flow_observatory.html");
const TRACEABILITY_DOC_PATH = path.join(DOCS_DIR, "128_reference_flow_traceability.md");

const TASK_ID = "seq_128";
const VISUAL_MODE = "Reference_Flow_Observatory";
const MOCK_NOW_STATE = "mock_now_execution";

const SOURCE_PRECEDENCE = [
  "prompt/128.md",
  "prompt/shared_operating_contract_126_to_135.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "phase-cards.md",
  "phase-0-the-foundation-protocol.md",
  "phase-1-the-red-flag-gate.md",
  "forensic-audit-findings.md",
  "data/analysis/reference_case_catalog.json",
  "data/analysis/surface_authority_tuple_catalog.json",
  "data/analysis/frontend_contract_manifests.json",
  "data/analysis/persistent_shell_contracts.json",
];

const PROGRAMME_TASK_REFS = [
  "seq_047",
  "seq_050",
  "seq_055",
  "seq_059",
  "par_066",
  "par_070",
  "par_072",
  "par_076",
  "par_077",
  "par_079",
  "par_080",
  "par_082",
  "par_087",
  "par_090",
  "par_093",
  "par_094",
  "par_106",
  "par_115",
  "par_117",
  "par_118",
  "seq_127",
];

type ScenarioClass =
  | "nominal"
  | "replay"
  | "duplicate_review"
  | "quarantine_fallback"
  | "identity_hold"
  | "confirmation_blocked";

type JsonObject = Record<string, unknown>;

interface LegacyReferenceCase {
  referenceCaseId: string;
  caseCode: string;
  title: string;
  channelProfile: string;
  routeFamily: string;
  requiredSeedObjects: string[];
  requiredSimulatorRefs: string[];
  requiredContinuityControlRefs: string[];
  continuityCoverageRecordRefs: string[];
  expectedSettlementRefs: string[];
  expectedClosureBlockerRefs: string[];
  surfaceManifestRef: string;
  gatewaySurfaceRefs: string[];
  projectionQueryContractRefs: string[];
  mutationCommandContractRefs: string[];
  liveUpdateChannelContractRefs: string[];
  notes: string;
  source_refs: string[];
}

interface SurfaceAuthorityTuple {
  tupleId: string;
  routeFamilyRef: string;
  inventorySurfaceRef: string;
  audienceSurface: string;
  shellSlug: string;
  shellType: string;
  bindingVerdict: string;
  writabilityState: string;
  calmState: string;
  governingBoundedContextRef: string;
}

interface RuntimeCluster {
  apiGateway: ApiGatewayRuntime;
  commandApi: CommandApiRuntime;
  projectionWorker: ProjectionWorkerRuntime;
  urls: {
    apiGateway: string;
    commandApi: string;
    projectionWorker: string;
  };
}

interface GatewayTrace {
  pathKind: "runtime_http";
  statusCode: number;
  responseBody: JsonObject;
  correlationId: string | null;
  traceId: string | null;
  routeFamilyRef: string;
  gatewaySurfaceRef: string;
  gatewayServiceRef: string;
  operationKind: string;
  usedRealCurrentPath: true;
}

interface CommandTrace {
  pathKind: "runtime_http";
  statusCode: number;
  responseBody: JsonObject;
  correlationId: string | null;
  traceId: string | null;
  idempotencyKey: string;
  usedRealCurrentPath: true;
}

interface ProjectionTrace {
  pathKind: "runtime_http";
  intakeStatusCode: number;
  intakeBody: JsonObject;
  freshnessStatusCode: number;
  freshnessBody: JsonObject;
  correlationId: string | null;
  traceId: string | null;
  projectionName: string;
  usedRealCurrentPath: true;
}

interface DomainTrace {
  pathKind: "domain_orchestrator";
  canonicalObjectRefs: string[];
  eventNames: string[];
  settlementRefs: string[];
  closureAuthorityOwner: "LifecycleCoordinator";
  sideEffectDelta: number;
  continuityOutcome: string;
  closureBlockerRefs: string[];
  payload: JsonObject;
}

interface EventSpineTrace {
  pathKind: "event_spine";
  eventNames: string[];
  mappedTransportRows: Array<{
    eventName: string;
    queueRefs: string[];
    consumerGroupRefs: string[];
    streamRef: string | null;
  }>;
  scenarioId: string | null;
  scenarioSummary: JsonObject | null;
  gapRefs: string[];
}

interface ShellTrace {
  pathKind: "shell_manifest";
  shellSlug: string;
  shellType: string;
  tupleId: string;
  audienceSurface: string;
  bindingVerdict: string;
  writabilityState: string;
  calmState: string;
  governingBoundedContextRef: string;
  continuityExpectation: string;
  gapRefs: string[];
}

interface ReferenceFlowCase {
  referenceCaseId: string;
  legacyReferenceCaseId: string;
  legacyCaseCode: string;
  title: string;
  scenarioClass: ScenarioClass;
  seedFixtureRefs: string[];
  entryChannel: string;
  gatewaySurfaceRef: string;
  routeFamilyRef: string;
  expectedCanonicalObjects: string[];
  expectedEvents: string[];
  expectedSettlementChain: string[];
  expectedProjectionFamilies: string[];
  expectedClosureBlockers: string[];
  expectedRecoveryOrFallbackPosture: string;
  shellContinuityExpectation: string;
  mockOrActualState: string;
  notes: string;
  provesRuleRefs: string[];
  dependencyTaskRefs: string[];
  gapRefs: string[];
  traceDigestRef: string;
  actualTrace: {
    gateway: GatewayTrace;
    command: CommandTrace;
    domain: DomainTrace;
    eventSpine: EventSpineTrace;
    projection: ProjectionTrace;
    shell: ShellTrace;
  };
}

interface TraceMatrixRow {
  referenceCaseId: string;
  scenarioClass: ScenarioClass;
  layer:
    | "gateway"
    | "command_api"
    | "domain_kernel"
    | "event_spine"
    | "projection_worker"
    | "shell_observatory";
  pathKind: string;
  usedRealCurrentPath: string;
  routeFamilyRef: string;
  gatewaySurfaceRef: string;
  status: string;
  canonicalObjectRefs: string;
  eventRefs: string;
  settlementRefs: string;
  projectionRefs: string;
  closureBlockerRefs: string;
  continuityState: string;
  lineageTraceable: string;
  coordinatorOwnedClosure: string;
  gapRefs: string;
  notes: string;
}

interface ProjectionSnapshotRow {
  referenceCaseId: string;
  routeFamilyRef: string;
  projectionName: string;
  projectionFamilyRef: string;
  freshnessState: string;
  staleAfterSeconds: string;
  continuitySignalShellSlug: string;
  continuitySignalRouteFamilies: string;
  visibilityTruth: string;
  notes: string;
}

interface BlockerMatrixRow {
  referenceCaseId: string;
  scenarioClass: ScenarioClass;
  blockerFamily: string;
  blockerRef: string;
  blockerSourceLayer: string;
  patientVisibleContinuity: string;
  lineageTraceable: string;
  lifecycleCoordinatorDecision: string;
  recoveryPosture: string;
  notes: string;
}

interface SettlementLine {
  referenceCaseId: string;
  scenarioClass: ScenarioClass;
  stepIndex: number;
  layer: string;
  state: string;
  settlementRef: string | null;
  causalRef: string | null;
  authoritative: boolean;
  summary: string;
}

interface CaseBlueprint {
  referenceCaseId: string;
  legacyCaseCode: string;
  title: string;
  scenarioClass: ScenarioClass;
  entryChannel: string;
  gatewayServiceRef: string;
  gatewaySurfaceRef: string;
  routeFamilyRef: string;
  gatewayOperationKind: "read" | "mutation";
  downstreamWorkloadFamilyRef?: string;
  projectionName: string;
  preferredInventorySurfaceRef: string;
  expectedRecoveryOrFallbackPosture: string;
  shellContinuityExpectation: string;
  provesRuleRefs: string[];
  dependencyTaskRefs: string[];
  gapRefs: string[];
}

const CASE_BLUEPRINTS: readonly CaseBlueprint[] = [
  {
    referenceCaseId: "RC_FLOW_001",
    legacyCaseCode: "clean_self_service_submit",
    title: "Nominal request promotion with visible projection truth",
    scenarioClass: "nominal",
    entryChannel: "browser_public",
    gatewayServiceRef: "agws_patient_web",
    gatewaySurfaceRef: "gws_patient_intake_web",
    routeFamilyRef: "rf_intake_self_service",
    gatewayOperationKind: "mutation",
    downstreamWorkloadFamilyRef: "wf_command_orchestration",
    projectionName: "patient-home",
    preferredInventorySurfaceRef: "surf_patient_intake_web",
    expectedRecoveryOrFallbackPosture: "triage_ready_authoritative_settlement",
    shellContinuityExpectation:
      "The patient shell returns to the same request lineage with a truthful settled posture instead of a reopened draft.",
    provesRuleRefs: [
      "phase0.canonical_ingest_and_promotion_flow",
      "phase0.transport_ack_is_not_business_truth",
      "phase0.visible_projection_truth",
    ],
    dependencyTaskRefs: ["seq_059", "par_066", "par_072", "par_079", "par_090", "seq_127"],
    gapRefs: [],
  },
  {
    referenceCaseId: "RC_FLOW_002",
    legacyCaseCode: "duplicate_retry_return_prior_accepted",
    title: "Exact replay returns prior authoritative outcome",
    scenarioClass: "replay",
    entryChannel: "authenticated_portal",
    gatewayServiceRef: "agws_patient_web",
    gatewaySurfaceRef: "gws_patient_requests",
    routeFamilyRef: "rf_patient_requests",
    gatewayOperationKind: "mutation",
    downstreamWorkloadFamilyRef: "wf_command_orchestration",
    projectionName: "patient-home",
    preferredInventorySurfaceRef: "surf_patient_requests",
    expectedRecoveryOrFallbackPosture: "authoritative_replay_no_new_side_effect",
    shellContinuityExpectation:
      "The authenticated patient shell stays on the prior request lineage and reuses the authoritative outcome without minting a second request.",
    provesRuleRefs: [
      "phase0.duplicate_control_and_replay_discipline",
      "phase1.submit_algorithm_replay_branch",
      "phase0.transport_ack_is_not_business_truth",
    ],
    dependencyTaskRefs: ["seq_059", "par_066", "par_067", "par_072", "par_090", "seq_127"],
    gapRefs: ["GAP_REFERENCE_FLOW_EVENT_SPINE_REPLAY_MAPPING_PENDING"],
  },
  {
    referenceCaseId: "RC_FLOW_003",
    legacyCaseCode: "duplicate_collision_open_review",
    title: "Duplicate collision opens explicit review instead of collapsing",
    scenarioClass: "duplicate_review",
    entryChannel: "support_workspace",
    gatewayServiceRef: "agws_support_workspace",
    gatewaySurfaceRef: "gws_support_ticket_workspace",
    routeFamilyRef: "rf_support_ticket_workspace",
    gatewayOperationKind: "mutation",
    downstreamWorkloadFamilyRef: "wf_command_orchestration",
    projectionName: "ops-telemetry",
    preferredInventorySurfaceRef: "surf_support_ticket_workspace",
    expectedRecoveryOrFallbackPosture: "review_required_same_shell_recovery",
    shellContinuityExpectation:
      "The support workspace keeps the task in place, exposes duplicate-review debt, and does not silently attach to another request.",
    provesRuleRefs: [
      "phase0.duplicate_control_and_replay_discipline",
      "phase0.lifecycle_coordinator_ownership_of_closure",
      "phase1.route_intent_and_command_settlement_chain",
    ],
    dependencyTaskRefs: ["seq_059", "par_070", "par_072", "par_076", "par_077", "seq_127"],
    gapRefs: ["GAP_REFERENCE_FLOW_SURFACE_DUPLICATE_REVIEW_LINKAGE_SEMANTIC_MATCH_ONLY"],
  },
  {
    referenceCaseId: "RC_FLOW_004",
    legacyCaseCode: "fallback_review_after_accepted_progress_degrades",
    title: "Quarantined evidence falls back to governed review with continuity",
    scenarioClass: "quarantine_fallback",
    entryChannel: "support_workspace",
    gatewayServiceRef: "agws_support_workspace",
    gatewaySurfaceRef: "gws_support_replay_observe",
    routeFamilyRef: "rf_support_replay_observe",
    gatewayOperationKind: "read",
    projectionName: "ops-telemetry",
    preferredInventorySurfaceRef: "surf_support_replay_observe",
    expectedRecoveryOrFallbackPosture: "fallback_review_open_same_lineage_continuity",
    shellContinuityExpectation:
      "Patient-visible continuity remains truthful while support replay observes the same lineage and manual fallback review is opened.",
    provesRuleRefs: [
      "phase0.artifact_quarantine_and_fallback_review",
      "phase1.immutable_evidence_snapshot_rules",
      "phase0.lifecycle_coordinator_ownership_of_closure",
    ],
    dependencyTaskRefs: ["seq_059", "par_076", "par_077", "par_082", "par_087", "seq_127"],
    gapRefs: ["GAP_REFERENCE_FLOW_SURFACE_SUPPORT_REPLAY_MUTATION_PATH_UNPUBLISHED"],
  },
  {
    referenceCaseId: "RC_FLOW_005",
    legacyCaseCode: "wrong_patient_identity_repair_hold",
    title: "Identity mismatch opens repair hold and blocks unsafe continuation",
    scenarioClass: "identity_hold",
    entryChannel: "authenticated_portal",
    gatewayServiceRef: "agws_patient_web",
    gatewaySurfaceRef: "gws_patient_secure_link_recovery",
    routeFamilyRef: "rf_patient_secure_link_recovery",
    gatewayOperationKind: "mutation",
    downstreamWorkloadFamilyRef: "wf_command_orchestration",
    projectionName: "patient-home",
    preferredInventorySurfaceRef: "surf_patient_secure_link_recovery",
    expectedRecoveryOrFallbackPosture: "identity_repair_hold_recovery_only",
    shellContinuityExpectation:
      "The patient recovery shell stays lineage-aware, but mutation stays blocked until identity repair is governed and auditable.",
    provesRuleRefs: [
      "phase0.identity_repair_and_subject_binding_rules",
      "phase0.lifecycle_coordinator_ownership_of_closure",
      "phase1.route_intent_and_command_settlement_chain",
    ],
    dependencyTaskRefs: ["seq_059", "par_076", "par_077", "par_078", "par_080", "seq_127"],
    gapRefs: ["GAP_REFERENCE_FLOW_SURFACE_PATIENT_SECURE_LINK_RECOVERY_PUBLICATION_BLOCKED"],
  },
  {
    referenceCaseId: "RC_FLOW_006",
    legacyCaseCode: "booking_confirmation_pending_ambiguity",
    title: "External confirmation debt prevents calm completion",
    scenarioClass: "confirmation_blocked",
    entryChannel: "hub_workspace",
    gatewayServiceRef: "agws_hub_desk",
    gatewaySurfaceRef: "gws_hub_case_management",
    routeFamilyRef: "rf_hub_case_management",
    gatewayOperationKind: "mutation",
    downstreamWorkloadFamilyRef: "wf_command_orchestration",
    projectionName: "ops-telemetry",
    preferredInventorySurfaceRef: "surf_hub_case_management",
    expectedRecoveryOrFallbackPosture: "confirmation_pending_same_lineage_open",
    shellContinuityExpectation:
      "The hub shell keeps the same lineage open, marks confirmation debt explicitly, and does not collapse pending transport into calm completion.",
    provesRuleRefs: [
      "phase0.confirmation_gate_blocker_rules",
      "phase0.lifecycle_coordinator_ownership_of_closure",
      "phase1.command_settlement_chain_pending_external_confirmation",
    ],
    dependencyTaskRefs: ["seq_059", "par_072", "par_074", "par_076", "par_077", "seq_127"],
    gapRefs: [],
  },
] as const;

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function stableDigest(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16);
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function csvEscape(value: unknown): string {
  const stringValue =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join(" | ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function writeFile(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

async function readJson<TValue>(filePath: string): Promise<TValue> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as TValue;
}

async function writeJson(filePath: string, payload: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

async function writeCsv(filePath: string, rows: Array<Record<string, unknown>>): Promise<void> {
  if (rows.length === 0) {
    await writeFile(filePath, "");
    return;
  }
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  await writeFile(filePath, `${lines.join("\n")}\n`);
}

async function writeJsonl(filePath: string, rows: unknown[]): Promise<void> {
  const lines = rows.map((row) => JSON.stringify(row));
  await writeFile(filePath, `${lines.join("\n")}\n`);
}

async function createRuntimeCluster(): Promise<RuntimeCluster> {
  const apiGateway = createApiGatewayRuntime(
    loadApiGatewayConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
      API_GATEWAY_AUTH_EDGE_MODE: "simulator",
      API_GATEWAY_ROUTE_FREEZE_MODE: "observe",
    }),
  );
  const commandApi = createCommandApiRuntime(
    loadCommandApiConfig({
      VECELLS_ENVIRONMENT: "test",
      COMMAND_API_SERVICE_PORT: "0",
      COMMAND_API_ADMIN_PORT: "0",
      COMMAND_API_MUTATION_GATE_MODE: "named_review",
      COMMAND_API_ROUTE_INTENT_MODE: "required",
    }),
  );
  const projectionWorker = createProjectionWorkerRuntime(
    loadProjectionWorkerConfig({
      VECELLS_ENVIRONMENT: "test",
      PROJECTION_WORKER_SERVICE_PORT: "0",
      PROJECTION_WORKER_ADMIN_PORT: "0",
      PROJECTION_WORKER_REBUILD_WINDOW_MODE: "scheduled",
    }),
  );

  await apiGateway.start();
  await commandApi.start();
  await projectionWorker.start();

  return {
    apiGateway,
    commandApi,
    projectionWorker,
    urls: {
      apiGateway: `http://127.0.0.1:${apiGateway.ports.service}`,
      commandApi: `http://127.0.0.1:${commandApi.ports.service}`,
      projectionWorker: `http://127.0.0.1:${projectionWorker.ports.service}`,
    },
  };
}

async function stopRuntimeCluster(cluster: RuntimeCluster): Promise<void> {
  await Promise.allSettled([
    cluster.apiGateway.stop(),
    cluster.commandApi.stop(),
    cluster.projectionWorker.stop(),
  ]);
}

async function fetchJson(
  url: string,
  init?: Parameters<typeof fetch>[1],
): Promise<{
  statusCode: number;
  body: JsonObject;
  headers: Headers;
}> {
  const response = await fetch(url, init);
  const body = (await response.json()) as JsonObject;
  return {
    statusCode: response.status,
    body,
    headers: response.headers,
  };
}

function getHeader(headers: Headers, name: string): string | null {
  return headers.get(name);
}

async function captureGatewayTrace(
  cluster: RuntimeCluster,
  blueprint: CaseBlueprint,
  contractRef: string | undefined,
): Promise<GatewayTrace> {
  const response = await fetchJson(`${cluster.urls.apiGateway}/authority/evaluate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": `seq128-${blueprint.referenceCaseId.toLowerCase()}-gateway`,
    },
    body: JSON.stringify({
      gatewayServiceRef: blueprint.gatewayServiceRef,
      routeFamilyRef: blueprint.routeFamilyRef,
      operationKind: blueprint.gatewayOperationKind,
      contractRef,
      downstreamWorkloadFamilyRef: blueprint.downstreamWorkloadFamilyRef,
    }),
  });

  return {
    pathKind: "runtime_http",
    statusCode: response.statusCode,
    responseBody: response.body,
    correlationId: getHeader(response.headers, "x-correlation-id"),
    traceId: getHeader(response.headers, "x-trace-id"),
    routeFamilyRef: blueprint.routeFamilyRef,
    gatewaySurfaceRef: blueprint.gatewaySurfaceRef,
    gatewayServiceRef: blueprint.gatewayServiceRef,
    operationKind: blueprint.gatewayOperationKind,
    usedRealCurrentPath: true,
  };
}

async function captureCommandTrace(
  cluster: RuntimeCluster,
  blueprint: CaseBlueprint,
  correlationId: string,
): Promise<CommandTrace> {
  const idempotencyKey = `seq128-${blueprint.referenceCaseId.toLowerCase()}-idem`;
  const response = await fetchJson(`${cluster.urls.commandApi}/commands/submit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": correlationId,
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({
      routeIntent: blueprint.routeFamilyRef,
      channel: blueprint.entryChannel,
    }),
  });

  return {
    pathKind: "runtime_http",
    statusCode: response.statusCode,
    responseBody: response.body,
    correlationId: getHeader(response.headers, "x-correlation-id"),
    traceId: getHeader(response.headers, "x-trace-id"),
    idempotencyKey,
    usedRealCurrentPath: true,
  };
}

async function captureProjectionTrace(
  cluster: RuntimeCluster,
  blueprint: CaseBlueprint,
  correlationId: string,
  seedEventName: string,
): Promise<ProjectionTrace> {
  const intakeResponse = await fetchJson(`${cluster.urls.projectionWorker}/events/intake`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": correlationId,
    },
    body: JSON.stringify({
      eventType: seedEventName,
      projectionName: blueprint.projectionName,
      routeFamilyRef: blueprint.routeFamilyRef,
    }),
  });
  const freshnessResponse = await fetchJson(
    `${cluster.urls.projectionWorker}/projections/freshness`,
    {
      method: "GET",
      headers: { "x-correlation-id": correlationId },
    },
  );

  return {
    pathKind: "runtime_http",
    intakeStatusCode: intakeResponse.statusCode,
    intakeBody: intakeResponse.body,
    freshnessStatusCode: freshnessResponse.statusCode,
    freshnessBody: freshnessResponse.body,
    correlationId: getHeader(freshnessResponse.headers, "x-correlation-id"),
    traceId: getHeader(freshnessResponse.headers, "x-trace-id"),
    projectionName: blueprint.projectionName,
    usedRealCurrentPath: true,
  };
}

async function createNominalSubmissionTrace(): Promise<{
  canonicalObjectRefs: string[];
  eventNames: string[];
  settlementRefs: string[];
  payload: JsonObject;
}> {
  const application = createSubmissionBackboneApplication();
  const { envelope } = await application.commands.createEnvelope({
    sourceChannel: "self_service_form",
    initialSurfaceChannelProfile: "browser",
    intakeConvergenceContractRef: "icc_seq128_nominal",
    sourceLineageRef: "source_lineage_seq128_nominal",
    createdAt: "2026-04-14T08:00:00Z",
  });
  await application.commands.appendEnvelopeIngress({
    envelopeId: envelope.envelopeId,
    ingressRecordRef: "ingress_seq128_nominal",
    updatedAt: "2026-04-14T08:01:00Z",
  });
  await application.commands.attachEnvelopeEvidence({
    envelopeId: envelope.envelopeId,
    evidenceSnapshotRef: "snapshot_seq128_nominal",
    updatedAt: "2026-04-14T08:02:00Z",
  });
  await application.commands.attachEnvelopeNormalization({
    envelopeId: envelope.envelopeId,
    normalizedSubmissionRef: "normalized_seq128_nominal",
    updatedAt: "2026-04-14T08:03:00Z",
  });
  await application.commands.markEnvelopeReady({
    envelopeId: envelope.envelopeId,
    promotionDecisionRef: "promotion_decision_seq128_nominal",
    updatedAt: "2026-04-14T08:04:00Z",
  });

  const result = await application.commands.promoteEnvelope({
    envelopeId: envelope.envelopeId,
    promotedAt: "2026-04-14T08:05:00Z",
    tenantId: "tenant_vecells_demo",
    requestType: "service_request",
    episodeFingerprint: "episode_fingerprint_seq128_nominal",
    promotionCommandActionRecordRef: "cmd_action_seq128_nominal",
    promotionCommandSettlementRecordRef: "cmd_settlement_seq128_nominal",
  });

  const assimilationApplication = createAssimilationSafetyApplication();
  const assimilationScenarios = await assimilationApplication.simulation.runAllScenarios();
  const assimilation = assimilationScenarios.find(
    (scenario) => scenario.scenarioId === "post_submit_reply_no_material_change",
  );
  if (!assimilation) {
    throw new Error("Missing assimilation scenario post_submit_reply_no_material_change");
  }

  return {
    canonicalObjectRefs: [
      `SubmissionEnvelope:${envelope.envelopeId}`,
      `SubmissionPromotionRecord:${result.promotionRecord.snapshot.promotionRecordId}`,
      `Request:${result.request.snapshot.requestId}`,
      `RequestLineage:${result.requestLineage.snapshot.requestLineageId}`,
      `Episode:${result.episode.snapshot.episodeId}`,
      `EvidenceAssimilationRecord:${assimilation.assimilationRecord.evidenceAssimilationId}`,
    ],
    eventNames: result.events.map((event) => event.eventType),
    settlementRefs: [
      result.promotionRecord.snapshot.promotionRecordId,
      getString(result.handoff.redirectTarget, "authoritative_request_shell"),
      "settlement_scenario:local_ack_then_settled_success",
    ],
    payload: {
      envelope: envelope.toSnapshot(),
      promotionRecord: result.promotionRecord.snapshot,
      request: result.request.snapshot,
      requestLineage: result.requestLineage.snapshot,
      episode: result.episode.snapshot,
      handoff: result.handoff,
      assimilation,
    },
  };
}

function buildMappedEventRows(
  mapping: Array<{
    eventName: string;
    queueRefs: string[];
    consumerGroupRefs: string[];
    streamRef: string;
  }>,
  eventNames: readonly string[],
): {
  rows: Array<{ eventName: string; queueRefs: string[]; consumerGroupRefs: string[]; streamRef: string | null }>;
  gapRefs: string[];
} {
  const rows: Array<{
    eventName: string;
    queueRefs: string[];
    consumerGroupRefs: string[];
    streamRef: string | null;
  }> = [];
  const gapRefs: string[] = [];
  for (const eventName of eventNames) {
    const match = mapping.find((entry) => entry.eventName === eventName);
    if (!match) {
      gapRefs.push(`GAP_REFERENCE_FLOW_EVENT_MAPPING_${eventName.replace(/[^A-Z0-9]+/gi, "_").toUpperCase()}`);
      rows.push({
        eventName,
        queueRefs: [],
        consumerGroupRefs: [],
        streamRef: null,
      });
      continue;
    }
    rows.push({
      eventName,
      queueRefs: [...match.queueRefs],
      consumerGroupRefs: [...match.consumerGroupRefs],
      streamRef: match.streamRef,
    });
  }
  return { rows, gapRefs };
}

function buildShellTrace(
  tuples: SurfaceAuthorityTuple[],
  blueprint: CaseBlueprint,
  continuityExpectation: string,
  inheritedGapRefs: readonly string[],
): ShellTrace {
  const tuple =
    tuples.find((candidate) => candidate.inventorySurfaceRef === blueprint.preferredInventorySurfaceRef) ??
    tuples.find((candidate) => candidate.routeFamilyRef === blueprint.routeFamilyRef);

  if (!tuple) {
    throw new Error(`Missing surface authority tuple for ${blueprint.routeFamilyRef}`);
  }

  return {
    pathKind: "shell_manifest",
    shellSlug: tuple.shellSlug,
    shellType: tuple.shellType,
    tupleId: tuple.tupleId,
    audienceSurface: tuple.audienceSurface,
    bindingVerdict: tuple.bindingVerdict,
    writabilityState: tuple.writabilityState,
    calmState: tuple.calmState,
    governingBoundedContextRef: tuple.governingBoundedContextRef,
    continuityExpectation,
    gapRefs: [...inheritedGapRefs],
  };
}

function buildTraceDigest(caseRecord: Omit<ReferenceFlowCase, "traceDigestRef">): string {
  return `rftrace::${stableDigest({
    referenceCaseId: caseRecord.referenceCaseId,
    routeFamilyRef: caseRecord.routeFamilyRef,
    gatewayStatus: caseRecord.actualTrace.gateway.statusCode,
    commandStatus: caseRecord.actualTrace.command.statusCode,
    projectionStatus: caseRecord.actualTrace.projection.intakeStatusCode,
    canonicalObjectRefs: caseRecord.actualTrace.domain.canonicalObjectRefs,
  })}`;
}

function findLegacyCase(
  legacyCases: Map<string, LegacyReferenceCase>,
  caseCode: string,
): LegacyReferenceCase {
  const legacy = legacyCases.get(caseCode);
  if (!legacy) {
    throw new Error(`Missing legacy reference case ${caseCode}`);
  }
  return legacy;
}

function mapProjectionRows(caseRecord: ReferenceFlowCase): ProjectionSnapshotRow[] {
  const freshnessBody = caseRecord.actualTrace.projection.freshnessBody;
  const projections = Array.isArray(freshnessBody.projections)
    ? (freshnessBody.projections as Array<Record<string, unknown>>)
    : [];
  const shellSignalKey =
    caseRecord.actualTrace.shell.shellSlug === "patient-web" ? "patientSignal" : "opsSignal";
  const intakeEvent = requireObject(caseRecord.actualTrace.projection.intakeBody.eventEnvelope, "eventEnvelope");

  return projections.map((projection) => {
    const signal = requireObject(projection.continuitySignal, "continuitySignal");
    return {
      referenceCaseId: caseRecord.referenceCaseId,
      routeFamilyRef: caseRecord.routeFamilyRef,
      projectionName: getString(projection.name),
      projectionFamilyRef: caseRecord.expectedProjectionFamilies.join(" | "),
      freshnessState: getString(projection.freshnessState),
      staleAfterSeconds: String(projection.staleAfterSeconds ?? ""),
      continuitySignalShellSlug: getString(signal.shellSlug),
      continuitySignalRouteFamilies: getStringArray(signal.routeFamilyIds).join(" | "),
      visibilityTruth:
        getString(intakeEvent.eventType) === "projection.placeholder.accepted"
          ? "derived_read_model_visible"
          : "event_seed_visible",
      notes:
        shellSignalKey === "patientSignal"
          ? "Patient-shell freshness and continuity marker."
          : "Support or hub shell freshness and continuity marker.",
    };
  });
}

function buildTraceMatrixRows(caseRecord: ReferenceFlowCase): TraceMatrixRow[] {
  const gatewayBody = caseRecord.actualTrace.gateway.responseBody;
  const commandBody = caseRecord.actualTrace.command.responseBody;
  const projectionBody = caseRecord.actualTrace.projection.intakeBody;

  return [
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      layer: "gateway",
      pathKind: caseRecord.actualTrace.gateway.pathKind,
      usedRealCurrentPath: "true",
      routeFamilyRef: caseRecord.routeFamilyRef,
      gatewaySurfaceRef: caseRecord.gatewaySurfaceRef,
      status: `${caseRecord.actualTrace.gateway.statusCode}:${getString(gatewayBody.error, getString(gatewayBody.authorityState))}`,
      canonicalObjectRefs: "",
      eventRefs: "",
      settlementRefs: "",
      projectionRefs: "",
      closureBlockerRefs: "",
      continuityState: getString(gatewayBody.publicationState, "declared"),
      lineageTraceable: "true",
      coordinatorOwnedClosure: "true",
      gapRefs: caseRecord.gapRefs.join(" | "),
      notes: "Real gateway authority evaluation over local HTTP.",
    },
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      layer: "command_api",
      pathKind: caseRecord.actualTrace.command.pathKind,
      usedRealCurrentPath: "true",
      routeFamilyRef: caseRecord.routeFamilyRef,
      gatewaySurfaceRef: caseRecord.gatewaySurfaceRef,
      status: `${caseRecord.actualTrace.command.statusCode}:${getString(requireObject(commandBody.settlement, "settlement").state)}`,
      canonicalObjectRefs: "",
      eventRefs: getString(requireObject(commandBody.envelope, "envelope").eventType),
      settlementRefs: getString(requireObject(commandBody.outbox, "outbox").status),
      projectionRefs: "",
      closureBlockerRefs: "",
      continuityState: getString(requireObject(commandBody.routeIntentValidation, "routeIntentValidation").status),
      lineageTraceable: "true",
      coordinatorOwnedClosure: "true",
      gapRefs: "",
      notes: "Real command ingress over local HTTP.",
    },
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      layer: "domain_kernel",
      pathKind: caseRecord.actualTrace.domain.pathKind,
      usedRealCurrentPath: "true",
      routeFamilyRef: caseRecord.routeFamilyRef,
      gatewaySurfaceRef: caseRecord.gatewaySurfaceRef,
      status:
        caseRecord.actualTrace.domain.sideEffectDelta === 0
          ? "replayed_authoritative"
          : "authoritative_progress_recorded",
      canonicalObjectRefs: caseRecord.actualTrace.domain.canonicalObjectRefs.join(" | "),
      eventRefs: caseRecord.actualTrace.domain.eventNames.join(" | "),
      settlementRefs: caseRecord.actualTrace.domain.settlementRefs.join(" | "),
      projectionRefs: "",
      closureBlockerRefs: caseRecord.actualTrace.domain.closureBlockerRefs.join(" | "),
      continuityState: caseRecord.actualTrace.domain.continuityOutcome,
      lineageTraceable: "true",
      coordinatorOwnedClosure: "true",
      gapRefs: caseRecord.actualTrace.shell.gapRefs.join(" | "),
      notes: "Canonical domain and orchestrator proof reused by the synthetic harness.",
    },
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      layer: "event_spine",
      pathKind: caseRecord.actualTrace.eventSpine.pathKind,
      usedRealCurrentPath: "true",
      routeFamilyRef: caseRecord.routeFamilyRef,
      gatewaySurfaceRef: caseRecord.gatewaySurfaceRef,
      status:
        caseRecord.actualTrace.eventSpine.scenarioId === null
          ? "mapped_transport_rows"
          : `scenario:${caseRecord.actualTrace.eventSpine.scenarioId}`,
      canonicalObjectRefs: "",
      eventRefs: caseRecord.actualTrace.eventSpine.eventNames.join(" | "),
      settlementRefs: caseRecord.actualTrace.eventSpine.mappedTransportRows
        .map((row) => row.streamRef ?? "unmapped")
        .join(" | "),
      projectionRefs: caseRecord.actualTrace.eventSpine.mappedTransportRows
        .flatMap((row) => row.queueRefs)
        .join(" | "),
      closureBlockerRefs: "",
      continuityState: "transport_and_queue_lineage_preserved",
      lineageTraceable: "true",
      coordinatorOwnedClosure: "true",
      gapRefs: caseRecord.actualTrace.eventSpine.gapRefs.join(" | "),
      notes: "Canonical event names mapped into the published event spine transport rows.",
    },
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      layer: "projection_worker",
      pathKind: caseRecord.actualTrace.projection.pathKind,
      usedRealCurrentPath: "true",
      routeFamilyRef: caseRecord.routeFamilyRef,
      gatewaySurfaceRef: caseRecord.gatewaySurfaceRef,
      status: `${caseRecord.actualTrace.projection.intakeStatusCode}:${getString(requireObject(projectionBody.deadLetter, "deadLetter").status)}`,
      canonicalObjectRefs: "",
      eventRefs: getString(requireObject(projectionBody.eventEnvelope, "eventEnvelope").eventType),
      settlementRefs: "",
      projectionRefs: caseRecord.expectedProjectionFamilies.join(" | "),
      closureBlockerRefs: "",
      continuityState: getString(requireObject(projectionBody.continuity, "continuity").posture),
      lineageTraceable: "true",
      coordinatorOwnedClosure: "true",
      gapRefs: "",
      notes: "Real projection intake and freshness endpoints over local HTTP.",
    },
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      layer: "shell_observatory",
      pathKind: caseRecord.actualTrace.shell.pathKind,
      usedRealCurrentPath: "true",
      routeFamilyRef: caseRecord.routeFamilyRef,
      gatewaySurfaceRef: caseRecord.gatewaySurfaceRef,
      status: `${caseRecord.actualTrace.shell.bindingVerdict}:${caseRecord.actualTrace.shell.writabilityState}`,
      canonicalObjectRefs: "",
      eventRefs: "",
      settlementRefs: caseRecord.actualTrace.shell.tupleId,
      projectionRefs: caseRecord.actualTrace.shell.audienceSurface,
      closureBlockerRefs: caseRecord.actualTrace.domain.closureBlockerRefs.join(" | "),
      continuityState: caseRecord.actualTrace.shell.continuityExpectation,
      lineageTraceable: "true",
      coordinatorOwnedClosure: "true",
      gapRefs: caseRecord.actualTrace.shell.gapRefs.join(" | "),
      notes: "Published shell tuple and continuity expectation reflected in the observatory.",
    },
  ];
}

function buildSettlementLines(caseRecord: ReferenceFlowCase): SettlementLine[] {
  const lines: SettlementLine[] = [
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      stepIndex: 1,
      layer: "gateway",
      state:
        caseRecord.actualTrace.gateway.statusCode >= 400
          ? getString(caseRecord.actualTrace.gateway.responseBody.error, "refused")
          : getString(caseRecord.actualTrace.gateway.responseBody.authorityState, "declared"),
      settlementRef: caseRecord.gatewaySurfaceRef,
      causalRef: caseRecord.actualTrace.gateway.correlationId,
      authoritative: false,
      summary: "Gateway authority is declared before downstream mutation or observation truth is considered.",
    },
    {
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      stepIndex: 2,
      layer: "command_api",
      state: getString(
        requireObject(caseRecord.actualTrace.command.responseBody.settlement, "settlement").state,
      ),
      settlementRef: getString(
        requireObject(caseRecord.actualTrace.command.responseBody.outbox, "outbox").status,
      ),
      causalRef: caseRecord.actualTrace.command.idempotencyKey,
      authoritative: false,
      summary: "Command acceptance stays separate from authoritative outcome.",
    },
  ];

  caseRecord.actualTrace.domain.settlementRefs.forEach((settlementRef, index) => {
    lines.push({
      referenceCaseId: caseRecord.referenceCaseId,
      scenarioClass: caseRecord.scenarioClass,
      stepIndex: lines.length + 1,
      layer: "domain_kernel",
      state:
        index === caseRecord.actualTrace.domain.settlementRefs.length - 1
          ? caseRecord.expectedRecoveryOrFallbackPosture
          : "intermediate_domain_settlement",
      settlementRef,
      causalRef:
        index === 0 && caseRecord.actualTrace.domain.canonicalObjectRefs.length > 0
          ? caseRecord.actualTrace.domain.canonicalObjectRefs[0] ?? null
          : null,
      authoritative: true,
      summary:
        index === caseRecord.actualTrace.domain.settlementRefs.length - 1
          ? "The canonical domain outcome remains the authoritative point in the chain."
          : "Domain records expand the chain without promoting transport acknowledgement into business truth.",
    });
  });

  lines.push({
    referenceCaseId: caseRecord.referenceCaseId,
    scenarioClass: caseRecord.scenarioClass,
    stepIndex: lines.length + 1,
    layer: "event_spine",
    state:
      caseRecord.actualTrace.eventSpine.scenarioId === null
        ? "transport_rows_resolved"
        : caseRecord.actualTrace.eventSpine.scenarioId,
    settlementRef:
      caseRecord.actualTrace.eventSpine.mappedTransportRows[0]?.streamRef ??
      caseRecord.actualTrace.eventSpine.scenarioId,
    causalRef: caseRecord.actualTrace.eventSpine.eventNames[0] ?? null,
    authoritative: false,
    summary: "Canonical events are published to the event spine with queue and stream lineage.",
  });
  lines.push({
    referenceCaseId: caseRecord.referenceCaseId,
    scenarioClass: caseRecord.scenarioClass,
    stepIndex: lines.length + 1,
    layer: "projection_worker",
    state: caseRecord.actualTrace.projection.projectionName,
    settlementRef: getString(
      requireObject(caseRecord.actualTrace.projection.intakeBody.deadLetter, "deadLetter").status,
    ),
    causalRef: caseRecord.actualTrace.projection.correlationId,
    authoritative: false,
    summary: "Projection visibility is recorded without claiming write authority.",
  });
  lines.push({
    referenceCaseId: caseRecord.referenceCaseId,
    scenarioClass: caseRecord.scenarioClass,
    stepIndex: lines.length + 1,
    layer: "shell_observatory",
    state: caseRecord.actualTrace.shell.bindingVerdict,
    settlementRef: caseRecord.actualTrace.shell.tupleId,
    causalRef: caseRecord.traceDigestRef,
    authoritative: false,
    summary: "The shell-facing tuple and observatory preserve the user-visible continuity claim.",
  });
  return lines;
}

function buildBlockerRows(caseRecord: ReferenceFlowCase): BlockerMatrixRow[] {
  if (caseRecord.expectedClosureBlockers.length === 0) {
    return [
      {
        referenceCaseId: caseRecord.referenceCaseId,
        scenarioClass: caseRecord.scenarioClass,
        blockerFamily: "none",
        blockerRef: "none",
        blockerSourceLayer: "domain_kernel",
        patientVisibleContinuity: "true",
        lineageTraceable: "true",
        lifecycleCoordinatorDecision: "unblocked",
        recoveryPosture: caseRecord.expectedRecoveryOrFallbackPosture,
        notes: "No closure blocker is expected for the nominal or exact-replay case.",
      },
    ];
  }

  return caseRecord.expectedClosureBlockers.map((blockerRef) => ({
    referenceCaseId: caseRecord.referenceCaseId,
    scenarioClass: caseRecord.scenarioClass,
    blockerFamily:
      caseRecord.scenarioClass === "duplicate_review"
        ? "duplicate_review"
        : caseRecord.scenarioClass === "quarantine_fallback"
          ? "fallback_review"
          : caseRecord.scenarioClass === "identity_hold"
            ? "identity_repair"
            : "confirmation_gate",
    blockerRef,
    blockerSourceLayer: "domain_kernel",
    patientVisibleContinuity:
      caseRecord.scenarioClass === "quarantine_fallback" ? "true" : "guarded",
    lineageTraceable: "true",
    lifecycleCoordinatorDecision: "defer",
    recoveryPosture: caseRecord.expectedRecoveryOrFallbackPosture,
    notes: caseRecord.notes,
  }));
}

function markdownTable(headers: string[], rows: string[][]): string {
  const divider = headers.map(() => "---");
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
  return lines.join("\n");
}

function renderSyntheticFlowDoc(cases: ReferenceFlowCase[], generatedAt: string): string {
  return `# 128 Synthetic Reference Flow

Generated at: ${generatedAt}

## Mission

This harness seeds and proves one deterministic Phase 0 synthetic reference flow across the current gateway, command API, domain kernel, event spine, projection worker, and shell-facing manifest layers. It keeps the old \`seq_059\` corpus intact while adding executable per-case traces that later Phase 0 merge and exit work can reuse.

## Runtime Chain

1. Real local HTTP request into \`api-gateway\` authority evaluation.
2. Real local HTTP request into \`command-api\` mutation ingress.
3. Canonical domain or orchestrator proof using the already-published Phase 0 backbones.
4. Published event-spine transport mapping and scenario views.
5. Real local HTTP request into \`projection-worker\` intake and freshness endpoints.
6. Shell continuity proof from the fused route-to-shell authority tuple catalog and this observatory.

## Reference Cases

${markdownTable(
  ["Reference case", "Class", "Route family", "Gateway surface", "Shell continuity", "Gaps"],
  cases.map((caseRecord) => [
    `\`${caseRecord.referenceCaseId}\``,
    `\`${caseRecord.scenarioClass}\``,
    `\`${caseRecord.routeFamilyRef}\``,
    `\`${caseRecord.gatewaySurfaceRef}\``,
    caseRecord.shellContinuityExpectation,
    caseRecord.gapRefs.length === 0 ? "none" : caseRecord.gapRefs.map((gap) => `\`${gap}\``).join("<br/>"),
  ]),
)}

## Assertions

- Transport acknowledgement is captured, but it never becomes business truth by itself.
- Exact replay reuses the prior authoritative request and produces zero new side effects.
- Duplicate review, quarantine fallback, identity hold, and confirmation debt stay first-class machine-readable reference cases.
- Closure blockers are recorded as \`LifecycleCoordinator\`-owned defer decisions instead of local shell shortcuts.
`;
}

function renderCaseCatalogDoc(cases: ReferenceFlowCase[]): string {
  return `# 128 Reference Case Catalog

${markdownTable(
  [
    "Reference case",
    "Legacy case",
    "Expected canonical objects",
    "Expected events",
    "Expected settlement chain",
    "Expected blockers",
  ],
  cases.map((caseRecord) => [
    `\`${caseRecord.referenceCaseId}\``,
    `\`${caseRecord.legacyReferenceCaseId}\``,
    caseRecord.expectedCanonicalObjects.map((entry) => `\`${entry}\``).join("<br/>"),
    caseRecord.expectedEvents.map((entry) => `\`${entry}\``).join("<br/>"),
    caseRecord.expectedSettlementChain.map((entry) => `\`${entry}\``).join("<br/>"),
    caseRecord.expectedClosureBlockers.length === 0
      ? "none"
      : caseRecord.expectedClosureBlockers.map((entry) => `\`${entry}\``).join("<br/>"),
  ]),
)}
`;
}

function renderSeedContractsDoc(cases: ReferenceFlowCase[]): string {
  return `# 128 Seed Data And Trace Contracts

## Seeding Discipline

- Every reference case reuses its \`seq_059\` seed fixture family and adds only deterministic \`seq_128\` runtime-cluster refs.
- Gateway, command, and projection traces always come from local HTTP against the current service runtime entrypoints.
- Domain, event-spine, and shell proof rows stay machine-readable inside \`data/analysis/reference_case_catalog.json\`.

## Per-Case Seed Coverage

${cases
  .map(
    (caseRecord) => `### ${caseRecord.referenceCaseId}

- Entry channel: \`${caseRecord.entryChannel}\`
- Route family: \`${caseRecord.routeFamilyRef}\`
- Seed fixture refs:
${caseRecord.seedFixtureRefs.map((seedRef) => `  - \`${seedRef}\``).join("\n")}
`,
  )
  .join("\n")}
`;
}

function renderTraceabilityDoc(cases: ReferenceFlowCase[]): string {
  return `# 128 Reference Flow Traceability

${markdownTable(
  ["Reference case", "Blueprint rules proved", "Dependency task refs", "Trace digest"],
  cases.map((caseRecord) => [
    `\`${caseRecord.referenceCaseId}\``,
    caseRecord.provesRuleRefs.map((entry) => `\`${entry}\``).join("<br/>"),
    caseRecord.dependencyTaskRefs.map((entry) => `\`${entry}\``).join("<br/>"),
    `\`${caseRecord.traceDigestRef}\``,
  ]),
)}
`;
}

function renderObservatoryHtml(cases: ReferenceFlowCase[], generatedAt: string): string {
  const embedded = JSON.stringify(
    {
      taskId: TASK_ID,
      generatedAt,
      visualMode: VISUAL_MODE,
      cases,
    },
    null,
    2,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>128 Reference Flow Observatory</title>
    <style>
      :root {
        --canvas: #f7f8fa;
        --panel: #ffffff;
        --inset: #e8eef3;
        --text-strong: #0f1720;
        --text-default: #24313d;
        --text-muted: #5e6b78;
        --accent-nominal: #117a55;
        --accent-replay: #2f6fed;
        --accent-review: #b7791f;
        --accent-blocked: #b42318;
        --accent-continuity: #5b61f6;
        --border: rgba(15, 23, 32, 0.12);
        --shadow: 0 18px 40px rgba(15, 23, 32, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: radial-gradient(circle at top left, rgba(91, 97, 246, 0.08), transparent 24%), var(--canvas);
        color: var(--text-default);
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      }

      .page {
        max-width: 1560px;
        margin: 0 auto;
        padding: 24px;
      }

      .masthead {
        height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .brand-mark {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(17, 122, 85, 0.18), rgba(91, 97, 246, 0.18));
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .brand h1,
      .brand p,
      .meta p {
        margin: 0;
      }

      .brand h1 {
        font-size: 1.2rem;
        color: var(--text-strong);
      }

      .brand p,
      .meta p,
      .caption,
      .eyebrow {
        color: var(--text-muted);
        font-size: 0.9rem;
      }

      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr) 400px;
        gap: 20px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .rail,
      .canvas,
      .inspector {
        min-height: 720px;
      }

      .rail {
        padding: 18px;
        position: sticky;
        top: 24px;
      }

      .scenario-list {
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }

      .scenario-card {
        width: 100%;
        text-align: left;
        border: 1px solid transparent;
        background: var(--inset);
        border-radius: 18px;
        padding: 14px;
        cursor: pointer;
        transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
      }

      .scenario-card:focus-visible,
      .tab-button:focus-visible {
        outline: 2px solid var(--accent-continuity);
        outline-offset: 2px;
      }

      .scenario-card[data-selected="true"] {
        border-color: rgba(91, 97, 246, 0.32);
        box-shadow: 0 10px 24px rgba(91, 97, 246, 0.14);
        transform: translateY(-1px);
      }

      .scenario-card small {
        display: block;
        margin-bottom: 8px;
        color: var(--text-muted);
      }

      .scenario-card strong {
        display: block;
        color: var(--text-strong);
        font-size: 0.96rem;
      }

      .scenario-card span {
        display: inline-flex;
        margin-top: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
      }

      .class-nominal span { background: rgba(17, 122, 85, 0.12); color: var(--accent-nominal); }
      .class-replay span { background: rgba(47, 111, 237, 0.12); color: var(--accent-replay); }
      .class-duplicate_review span,
      .class-quarantine_fallback span { background: rgba(183, 121, 31, 0.12); color: var(--accent-review); }
      .class-identity_hold span,
      .class-confirmation_blocked span { background: rgba(180, 35, 24, 0.12); color: var(--accent-blocked); }

      .canvas {
        padding: 20px;
      }

      .canvas-grid {
        display: grid;
        gap: 20px;
      }

      .diagram-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 16px;
      }

      .diagram,
      .parity-table,
      .tab-panel {
        border: 1px solid var(--border);
        border-radius: 20px;
        background: rgba(248, 250, 252, 0.88);
        padding: 16px;
      }

      .sequence-stack,
      .state-grid,
      .ribbon-list {
        display: grid;
        gap: 10px;
      }

      .sequence-step,
      .state-cell,
      .ribbon-pill {
        display: grid;
        gap: 4px;
        padding: 12px 14px;
        background: var(--panel);
        border-radius: 16px;
        border: 1px solid rgba(15, 23, 32, 0.08);
      }

      .sequence-step[data-selected="true"],
      .state-cell[data-selected="true"],
      .ribbon-pill[data-selected="true"] {
        border-color: rgba(91, 97, 246, 0.28);
        box-shadow: inset 0 0 0 1px rgba(91, 97, 246, 0.16);
      }

      .state-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.88rem;
      }

      th,
      td {
        text-align: left;
        padding: 8px 10px;
        border-bottom: 1px solid rgba(15, 23, 32, 0.08);
        vertical-align: top;
      }

      th {
        color: var(--text-muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .tablist {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 4px;
        margin-bottom: 12px;
      }

      .tab-button {
        border: 1px solid rgba(15, 23, 32, 0.1);
        background: var(--panel);
        border-radius: 999px;
        padding: 10px 14px;
        cursor: pointer;
      }

      .tab-button[aria-selected="true"] {
        border-color: rgba(91, 97, 246, 0.26);
        color: var(--accent-continuity);
        background: rgba(91, 97, 246, 0.08);
      }

      .inspector {
        padding: 20px;
        position: sticky;
        top: 24px;
      }

      .inspector-grid {
        display: grid;
        gap: 16px;
      }

      .inspector-card {
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 14px;
        background: rgba(248, 250, 252, 0.92);
      }

      ul.seed-list {
        margin: 0;
        padding-left: 18px;
        max-height: 220px;
        overflow: auto;
      }

      .reduced-motion * {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }

      @media (max-width: 1300px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .rail,
        .inspector {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <div class="page" data-testid="reference-flow-observatory">
      <header class="masthead" role="banner">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h4l3 3 3-5 4 8" stroke="#24313D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <p class="eyebrow">Vecells</p>
            <h1>Reference Flow Observatory</h1>
            <p>Calm diagnostic proof lab for the synthetic Phase 0 causal chain.</p>
          </div>
        </div>
        <div class="meta">
          <p data-testid="generated-at">Generated ${generatedAt}</p>
          <p data-testid="scenario-count">${cases.length} deterministic reference cases</p>
        </div>
      </header>

      <main class="layout">
        <nav class="panel rail" aria-label="Reference scenarios">
          <p class="eyebrow">Scenario rail</p>
          <h2 style="margin: 0; color: var(--text-strong)">Phase 0 cases</h2>
          <p class="caption">Each case binds gateway, command, domain, event, projection, and shell truth into one digest.</p>
          <div class="scenario-list" data-testid="scenario-rail"></div>
        </nav>

        <section class="panel canvas">
          <div class="canvas-grid">
            <div class="diagram-row">
              <section class="diagram" data-testid="sequence-diagram" aria-labelledby="sequence-heading">
                <p class="eyebrow">Sequence diagram</p>
                <h2 id="sequence-heading" style="margin-top: 0">Causal braid</h2>
                <div class="sequence-stack"></div>
              </section>
              <section class="parity-table" data-testid="sequence-table" aria-label="Sequence diagram table parity"></section>
            </div>

            <div class="diagram-row">
              <section class="diagram" data-testid="state-lattice" aria-labelledby="lattice-heading">
                <p class="eyebrow">State-axis lattice</p>
                <h2 id="lattice-heading" style="margin-top: 0">Outcome axes</h2>
                <div class="state-grid"></div>
              </section>
              <section class="parity-table" data-testid="lattice-table" aria-label="State lattice table parity"></section>
            </div>

            <div class="diagram-row">
              <section class="diagram" data-testid="blocker-ribbon" aria-labelledby="ribbon-heading">
                <p class="eyebrow">Blocker and settlement ribbon</p>
                <h2 id="ribbon-heading" style="margin-top: 0">Current blockers and recovery posture</h2>
                <div class="ribbon-list"></div>
              </section>
              <section class="parity-table" data-testid="ribbon-table" aria-label="Blocker ribbon table parity"></section>
            </div>

            <section class="diagram" aria-labelledby="tabs-heading">
              <p class="eyebrow">Trace tables</p>
              <h2 id="tabs-heading" style="margin-top: 0">Events, settlements, projections, blockers, and source traces</h2>
              <div class="tablist" data-testid="trace-tabs" role="tablist" aria-label="Trace tabs"></div>
              <div data-testid="tab-panels"></div>
            </section>
          </div>
        </section>

        <aside class="panel inspector" data-testid="inspector" aria-live="polite"></aside>
      </main>
    </div>

    <script type="application/json" id="reference-flow-data">${embedded}</script>
    <script>
      const HARNESS = JSON.parse(document.getElementById("reference-flow-data").textContent);
      const state = {
        selectedCaseId: HARNESS.cases[0]?.referenceCaseId,
        activeTab: "events",
        focusTarget: null,
      };

      const scenarioRail = document.querySelector("[data-testid='scenario-rail']");
      const sequenceStack = document.querySelector(".sequence-stack");
      const stateGrid = document.querySelector(".state-grid");
      const ribbonList = document.querySelector(".ribbon-list");
      const inspector = document.querySelector("[data-testid='inspector']");
      const sequenceTable = document.querySelector("[data-testid='sequence-table']");
      const latticeTable = document.querySelector("[data-testid='lattice-table']");
      const ribbonTable = document.querySelector("[data-testid='ribbon-table']");
      const tabsHost = document.querySelector("[data-testid='trace-tabs']");
      const panelsHost = document.querySelector("[data-testid='tab-panels']");
      const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        document.body.classList.add("reduced-motion");
      }

      const tabDefs = [
        { id: "events", label: "Events" },
        { id: "settlements", label: "Settlements" },
        { id: "projections", label: "Projections" },
        { id: "blockers", label: "Blockers" },
        { id: "sources", label: "Source traces" },
      ];

      function getCaseRecord() {
        return HARNESS.cases.find((entry) => entry.referenceCaseId === state.selectedCaseId) || HARNESS.cases[0];
      }

      function focusSelector(selector) {
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          element.focus();
        }
      }

      function restoreFocus() {
        if (!state.focusTarget) {
          return;
        }
        if (state.focusTarget.kind === "scenario") {
          focusSelector(\`[data-testid="scenario-card-\${state.focusTarget.id}"]\`);
          return;
        }
        if (state.focusTarget.kind === "tab") {
          focusSelector(\`[data-testid="tab-\${state.focusTarget.id}"]\`);
        }
      }

      function selectScenario(caseId, focusMode = "scenario") {
        state.selectedCaseId = caseId;
        state.focusTarget = focusMode === "scenario" ? { kind: "scenario", id: caseId } : null;
        render();
      }

      function selectTab(tabId, focusMode = "tab") {
        state.activeTab = tabId;
        state.focusTarget = focusMode === "tab" ? { kind: "tab", id: tabId } : null;
        render();
      }

      function renderScenarioRail() {
        scenarioRail.innerHTML = "";
        HARNESS.cases.forEach((caseRecord) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = \`scenario-card class-\${caseRecord.scenarioClass}\`;
          button.dataset.selected = String(caseRecord.referenceCaseId === state.selectedCaseId);
          button.dataset.caseId = caseRecord.referenceCaseId;
          button.dataset.testid = \`scenario-card-\${caseRecord.referenceCaseId}\`;
          button.setAttribute("data-testid", \`scenario-card-\${caseRecord.referenceCaseId}\`);
          button.tabIndex = caseRecord.referenceCaseId === state.selectedCaseId ? 0 : -1;
          button.innerHTML = \`
            <small>\${caseRecord.referenceCaseId}</small>
            <strong>\${caseRecord.title}</strong>
            <p class="caption">\${caseRecord.routeFamilyRef} -> \${caseRecord.gatewaySurfaceRef}</p>
            <span>\${caseRecord.scenarioClass}</span>
          \`;
          button.addEventListener("click", () => {
            selectScenario(caseRecord.referenceCaseId);
          });
          button.addEventListener("keydown", (event) => {
            const buttons = [...scenarioRail.querySelectorAll("button")];
            const currentIndex = buttons.indexOf(button);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              const next = buttons[Math.min(currentIndex + 1, buttons.length - 1)];
              if (next?.dataset.caseId) {
                selectScenario(next.dataset.caseId);
              }
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              const prev = buttons[Math.max(currentIndex - 1, 0)];
              if (prev?.dataset.caseId) {
                selectScenario(prev.dataset.caseId);
              }
            }
            if (event.key === "Home") {
              event.preventDefault();
              const first = buttons[0];
              if (first?.dataset.caseId) {
                selectScenario(first.dataset.caseId);
              }
            }
            if (event.key === "End") {
              event.preventDefault();
              const last = buttons[buttons.length - 1];
              if (last?.dataset.caseId) {
                selectScenario(last.dataset.caseId);
              }
            }
          });
          scenarioRail.appendChild(button);
        });
      }

      function renderSequence(caseRecord) {
        const rows = [
          {
            testid: "sequence-row-gateway",
            layer: "Gateway",
            summary: \`\${caseRecord.actualTrace.gateway.statusCode} -> \${caseRecord.actualTrace.gateway.routeFamilyRef}\`,
            detail: caseRecord.actualTrace.gateway.responseBody.error || caseRecord.actualTrace.gateway.responseBody.publicationState || caseRecord.actualTrace.gateway.responseBody.authorityState,
          },
          {
            testid: "sequence-row-command",
            layer: "Command API",
            summary: caseRecord.actualTrace.command.responseBody.settlement.state,
            detail: caseRecord.actualTrace.command.responseBody.outbox.status,
          },
          {
            testid: "sequence-row-domain",
            layer: "Domain kernel",
            summary: caseRecord.actualTrace.domain.continuityOutcome,
            detail: caseRecord.actualTrace.domain.canonicalObjectRefs.join(", "),
          },
          {
            testid: "sequence-row-event",
            layer: "Event spine",
            summary: caseRecord.actualTrace.eventSpine.eventNames[0] || "No mapped events",
            detail: caseRecord.actualTrace.eventSpine.mappedTransportRows.flatMap((row) => row.queueRefs).join(", ") || "mapping gap preserved",
          },
          {
            testid: "sequence-row-projection",
            layer: "Projection worker",
            summary: caseRecord.actualTrace.projection.projectionName,
            detail: caseRecord.actualTrace.projection.intakeBody.continuity.posture,
          },
          {
            testid: "sequence-row-shell",
            layer: "Shell observatory",
            summary: caseRecord.actualTrace.shell.bindingVerdict,
            detail: caseRecord.actualTrace.shell.continuityExpectation,
          },
        ];
        sequenceStack.innerHTML = "";
        rows.forEach((row) => {
          const element = document.createElement("div");
          element.className = "sequence-step";
          element.dataset.selected = "true";
          element.setAttribute("data-testid", row.testid);
          element.innerHTML = \`
            <strong>\${row.layer}</strong>
            <span>\${row.summary}</span>
            <span class="caption">\${row.detail}</span>
          \`;
          sequenceStack.appendChild(element);
        });
        sequenceTable.innerHTML = renderTableHtml(
          ["Layer", "Summary", "Detail"],
          rows.map((row) => [row.layer, row.summary, row.detail]),
          "sequence-table-body",
        );
      }

      function renderLattice(caseRecord) {
        const cells = [
          { label: "Gateway publication", value: caseRecord.actualTrace.gateway.responseBody.publicationState || caseRecord.actualTrace.gateway.responseBody.error || "n/a" },
          { label: "Command settlement", value: caseRecord.actualTrace.command.responseBody.settlement.state },
          { label: "Authoritative outcome", value: caseRecord.expectedRecoveryOrFallbackPosture },
          { label: "Shell posture", value: \`\${caseRecord.actualTrace.shell.bindingVerdict} / \${caseRecord.actualTrace.shell.writabilityState}\` },
        ];
        stateGrid.innerHTML = "";
        cells.forEach((cell, index) => {
          const element = document.createElement("div");
          element.className = "state-cell";
          element.dataset.selected = "true";
          element.setAttribute("data-testid", \`lattice-cell-\${index}\`);
          element.innerHTML = \`
            <strong>\${cell.label}</strong>
            <span>\${cell.value}</span>
          \`;
          stateGrid.appendChild(element);
        });
        latticeTable.innerHTML = renderTableHtml(
          ["Axis", "Value"],
          cells.map((cell) => [cell.label, cell.value]),
          "lattice-table-body",
        );
      }

      function renderRibbon(caseRecord) {
        const blockers = caseRecord.expectedClosureBlockers.length === 0 ? ["no_blockers"] : caseRecord.expectedClosureBlockers;
        const ribbonItems = [...blockers, caseRecord.expectedRecoveryOrFallbackPosture, caseRecord.shellContinuityExpectation];
        ribbonList.innerHTML = "";
        ribbonItems.forEach((item, index) => {
          const element = document.createElement("div");
          element.className = "ribbon-pill";
          element.dataset.selected = "true";
          element.setAttribute("data-testid", \`ribbon-pill-\${index}\`);
          element.innerHTML = \`<strong>\${index === ribbonItems.length - 1 ? "Continuity" : "Signal"}</strong><span>\${item}</span>\`;
          ribbonList.appendChild(element);
        });
        ribbonTable.innerHTML = renderTableHtml(
          ["Kind", "Value"],
          ribbonItems.map((item, index) => [index < blockers.length ? "Blocker" : index === blockers.length ? "Recovery" : "Continuity", item]),
          "ribbon-table-body",
        );
      }

      function renderInspector(caseRecord) {
        inspector.innerHTML = \`
          <div class="inspector-grid">
            <section class="inspector-card">
              <p class="eyebrow">Selected case</p>
              <h2 style="margin: 0 0 8px; color: var(--text-strong)">\${caseRecord.referenceCaseId}</h2>
              <p class="caption">\${caseRecord.title}</p>
              <p><strong>Legacy anchor:</strong> \${caseRecord.legacyReferenceCaseId}</p>
              <p><strong>Trace digest:</strong> <span data-testid="trace-digest">\${caseRecord.traceDigestRef}</span></p>
            </section>

            <section class="inspector-card">
              <p class="eyebrow">Continuity</p>
              <p>\${caseRecord.shellContinuityExpectation}</p>
              <p><strong>Shell tuple:</strong> \${caseRecord.actualTrace.shell.tupleId}</p>
              <p><strong>Gap refs:</strong> <span data-testid="gap-refs">\${caseRecord.gapRefs.length === 0 ? "none" : caseRecord.gapRefs.join(", ")}</span></p>
            </section>

            <section class="inspector-card">
              <p class="eyebrow">Seed fixtures</p>
              <ul class="seed-list" data-testid="seed-fixtures">
                \${caseRecord.seedFixtureRefs.map((seedRef) => \`<li>\${seedRef}</li>\`).join("")}
              </ul>
            </section>

            <section class="inspector-card">
              <p class="eyebrow">Canonical objects</p>
              <ul class="seed-list" data-testid="canonical-objects">
                \${caseRecord.actualTrace.domain.canonicalObjectRefs.map((item) => \`<li>\${item}</li>\`).join("")}
              </ul>
            </section>
          </div>
        \`;
      }

      function renderTabs(caseRecord) {
        tabsHost.innerHTML = "";
        tabDefs.forEach((tab) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "tab-button";
          button.setAttribute("role", "tab");
          button.setAttribute("aria-selected", String(state.activeTab === tab.id));
          button.setAttribute("aria-controls", \`tab-panel-\${tab.id}\`);
          button.id = \`tab-\${tab.id}\`;
          button.setAttribute("data-testid", \`tab-\${tab.id}\`);
          button.tabIndex = state.activeTab === tab.id ? 0 : -1;
          button.textContent = tab.label;
          button.addEventListener("click", () => {
            selectTab(tab.id);
          });
          button.addEventListener("keydown", (event) => {
            const buttons = [...tabsHost.querySelectorAll("button")];
            const currentIndex = buttons.indexOf(button);
            if (event.key === "ArrowRight") {
              event.preventDefault();
              const next = buttons[(currentIndex + 1) % buttons.length];
              const nextTabId = next?.id.replace("tab-", "");
              if (nextTabId) {
                selectTab(nextTabId);
              }
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              const previous = buttons[(currentIndex - 1 + buttons.length) % buttons.length];
              const previousTabId = previous?.id.replace("tab-", "");
              if (previousTabId) {
                selectTab(previousTabId);
              }
            }
            if (event.key === "Home") {
              event.preventDefault();
              const first = buttons[0];
              const firstTabId = first?.id.replace("tab-", "");
              if (firstTabId) {
                selectTab(firstTabId);
              }
            }
            if (event.key === "End") {
              event.preventDefault();
              const last = buttons[buttons.length - 1];
              const lastTabId = last?.id.replace("tab-", "");
              if (lastTabId) {
                selectTab(lastTabId);
              }
            }
          });
          tabsHost.appendChild(button);
        });

        const eventRows = caseRecord.actualTrace.eventSpine.eventNames.map((eventName, index) => [
          eventName,
          caseRecord.actualTrace.eventSpine.mappedTransportRows[index]?.queueRefs.join(", ") || "unmapped",
          caseRecord.actualTrace.eventSpine.mappedTransportRows[index]?.streamRef || "n/a",
        ]);
        const settlementRows = caseRecord.expectedSettlementChain.map((item, index) => [
          String(index + 1),
          item,
          caseRecord.actualTrace.domain.settlementRefs[index] || "",
        ]);
        const projectionRows = caseRecord.expectedProjectionFamilies.map((item) => [
          item,
          caseRecord.actualTrace.projection.projectionName,
          caseRecord.actualTrace.projection.intakeBody.continuity.posture,
        ]);
        const blockerRows = (caseRecord.expectedClosureBlockers.length === 0
          ? [["none", "No closure blockers expected", caseRecord.expectedRecoveryOrFallbackPosture]]
          : caseRecord.expectedClosureBlockers.map((item) => [item, "LifecycleCoordinator defer", caseRecord.expectedRecoveryOrFallbackPosture]));
        const sourceRows = [
          ["Rules", caseRecord.provesRuleRefs.join(", "), caseRecord.dependencyTaskRefs.join(", ")],
          ["Trace digest", caseRecord.traceDigestRef, caseRecord.actualTrace.shell.tupleId],
        ];

        const panels = {
          events: renderTableHtml(["Event", "Queues", "Stream"], eventRows, "events-table"),
          settlements: renderTableHtml(["Step", "Expected chain", "Domain ref"], settlementRows, "settlements-table"),
          projections: renderTableHtml(["Projection family", "Projection name", "Continuity posture"], projectionRows, "projections-table"),
          blockers: renderTableHtml(["Blocker", "Coordinator posture", "Recovery"], blockerRows, "blockers-table"),
          sources: renderTableHtml(["Source type", "Rules or digest", "Dependencies or tuple"], sourceRows, "sources-table"),
        };

        panelsHost.innerHTML = tabDefs
          .map((tab) => {
            const hidden = tab.id === state.activeTab ? "" : "hidden";
            return \`
              <section
                class="tab-panel"
                id="tab-panel-\${tab.id}"
                role="tabpanel"
                aria-labelledby="tab-\${tab.id}"
                data-testid="tab-panel-\${tab.id}"
                \${hidden}
              >
                \${panels[tab.id]}
              </section>
            \`;
          })
          .join("");
      }

      function renderTableHtml(headers, rows, testId) {
        return \`
          <table data-testid="\${testId}">
            <thead>
              <tr>\${headers.map((header) => \`<th>\${header}</th>\`).join("")}</tr>
            </thead>
            <tbody>
              \${rows.map((row, rowIndex) => \`<tr data-testid="\${testId}-row-\${rowIndex}">\${row.map((cell) => \`<td>\${cell}</td>\`).join("")}</tr>\`).join("")}
            </tbody>
          </table>
        \`;
      }

      function render() {
        const caseRecord = getCaseRecord();
        renderScenarioRail();
        renderSequence(caseRecord);
        renderLattice(caseRecord);
        renderRibbon(caseRecord);
        renderInspector(caseRecord);
        renderTabs(caseRecord);
        restoreFocus();
      }

      render();
    </script>
  </body>
</html>
`;
}

async function main(): Promise<void> {
  const generatedAt = nowIso();
  const legacyCatalog = await readJson<Record<string, unknown>>(REFERENCE_CATALOG_PATH);
  const legacyReferenceCases = new Map(
    ((legacyCatalog.referenceCases as LegacyReferenceCase[] | undefined) ?? []).map((entry) => [
      entry.caseCode,
      entry,
    ]),
  );
  const tupleCatalog = await readJson<{ surfaceAuthorityTuples: SurfaceAuthorityTuple[] }>(
    SURFACE_AUTHORITY_TUPLES_PATH,
  );

  const duplicateResults = await createDuplicateReviewApplication().simulation.runAllScenarios();
  const duplicateByScenario = new Map(duplicateResults.map((entry) => [entry.scenarioId, entry]));

  const requestClosureResults = await createRequestClosureApplication().simulation.runAllScenarios();
  const requestClosureByScenario = new Map(
    requestClosureResults.map((entry) => [entry.scenarioId, entry]),
  );

  const settlementResults = await createCommandSettlementApplication().simulation.runAllScenarios();
  const settlementByScenario = new Map(settlementResults.map((entry) => [entry.scenarioId, entry]));

  const lifecycleResults = await runLifecycleCoordinatorSimulation();
  const lifecycleByScenario = new Map(lifecycleResults.map((entry) => [entry.scenarioId, entry]));

  const identityResults = await runIdentityRepairReachabilitySimulation();
  const identityByScenario = new Map(identityResults.map((entry) => [entry.scenarioId, entry]));

  const eventSpineApplication = createEventSpineApplication();
  const eventSpineScenarios = eventSpineApplication.simulation.runAllScenarios();
  const eventSpineByScenario = new Map(eventSpineScenarios.map((entry) => [entry.scenarioId, entry]));

  const cluster = await createRuntimeCluster();
  try {
    const nominalSubmission = await createNominalSubmissionTrace();
    const replayTrace = await simulateSubmissionPromotionReplayScenario("same_tab_double_submit");

    const cases: ReferenceFlowCase[] = [];

    for (const blueprint of CASE_BLUEPRINTS) {
      const legacy = findLegacyCase(legacyReferenceCases, blueprint.legacyCaseCode);
      const gatewayContractRef =
        blueprint.gatewayOperationKind === "mutation"
          ? legacy.mutationCommandContractRefs[0]
          : legacy.projectionQueryContractRefs[0];
      const gatewayTrace = await captureGatewayTrace(cluster, blueprint, gatewayContractRef);
      const commandTrace = await captureCommandTrace(
        cluster,
        blueprint,
        gatewayTrace.correlationId ?? `seq128-${blueprint.referenceCaseId.toLowerCase()}-gateway`,
      );

      let domainTrace: DomainTrace;
      let expectedEvents: string[] = [];
      let settlementChain: string[] = [];
      let expectedClosureBlockers: string[] = [];
      let notes = legacy.notes;
      let caseGapRefs = [...blueprint.gapRefs];
      let seedFixtureRefs = dedupe([
        ...legacy.requiredSeedObjects,
        ...legacy.requiredSimulatorRefs,
        `SEQ_128_RUNTIME_GATEWAY_CLUSTER_${blueprint.referenceCaseId}_V1`,
        `SEQ_128_RUNTIME_COMMAND_CLUSTER_${blueprint.referenceCaseId}_V1`,
        `SEQ_128_RUNTIME_PROJECTION_CLUSTER_${blueprint.referenceCaseId}_V1`,
      ]);

      if (blueprint.referenceCaseId === "RC_FLOW_001") {
        const settlement = settlementByScenario.get("local_ack_then_settled_success");
        if (!settlement) {
          throw new Error("Missing settlement scenario local_ack_then_settled_success");
        }
        expectedEvents = dedupe([
          ...nominalSubmission.eventNames,
        ]);
        settlementChain = [
          "gateway.authority.declared",
          "command.accepted.awaiting_settlement_evidence",
          ...settlement.envelopes.map((entry) => entry.authoritativeOutcomeState),
          "projection.visible",
        ];
        expectedClosureBlockers = [];
        domainTrace = {
          pathKind: "domain_orchestrator",
          canonicalObjectRefs: nominalSubmission.canonicalObjectRefs,
          eventNames: nominalSubmission.eventNames,
          settlementRefs: settlement.settlementIds,
          closureAuthorityOwner: "LifecycleCoordinator",
          sideEffectDelta: 1,
          continuityOutcome: "triage_ready_and_authoritatively_settled",
          closureBlockerRefs: [],
          payload: {
            ...nominalSubmission.payload,
            settlementScenario: settlement,
          },
        };
      } else if (blueprint.referenceCaseId === "RC_FLOW_002") {
        expectedEvents = dedupe([
          ...replayTrace.transactionEvents,
          ...replayTrace.replayEvents,
        ]);
        settlementChain = [
          "gateway.authority.declared",
          "command.accepted.awaiting_settlement_evidence",
          "domain.authoritative_request_committed",
          "domain.replay_returned_without_new_side_effect",
          "projection.visible_same_request",
        ];
        expectedClosureBlockers = [];
        domainTrace = {
          pathKind: "domain_orchestrator",
          canonicalObjectRefs: [
            `Request:${replayTrace.committedRequestId}`,
            `ReplayRequest:${replayTrace.replayRequestId}`,
          ],
          eventNames: dedupe([...replayTrace.transactionEvents, ...replayTrace.replayEvents]),
          settlementRefs: [
            replayTrace.committedRequestId,
            replayTrace.replayRequestId,
            `lookup:${replayTrace.replayLookupField}`,
          ],
          closureAuthorityOwner: "LifecycleCoordinator",
          sideEffectDelta: replayTrace.committedRequestId === replayTrace.replayRequestId ? 0 : 1,
          continuityOutcome: "prior_authoritative_outcome_reused",
          closureBlockerRefs: [],
          payload: replayTrace as unknown as JsonObject,
        };
      } else if (blueprint.referenceCaseId === "RC_FLOW_003") {
        const duplicate = duplicateByScenario.get("conflicting_candidates_low_margin");
        const lifecycle = lifecycleByScenario.get("duplicate_review_hold");
        const settlement = settlementByScenario.get("review_required_outcome");
        if (!duplicate || !lifecycle || !settlement) {
          throw new Error("Missing duplicate_review case dependencies");
        }
        const decision = duplicate.decision.snapshot;
        const closureRecord = lifecycle.closureRecords[0]?.toSnapshot();
        expectedEvents = dedupe([
          "request.duplicate.review_required",
          "request.closure_blockers.changed",
        ]);
        settlementChain = [
          "gateway.authority.declared",
          "command.accepted.awaiting_settlement_evidence",
          settlement.envelopes[0]?.authoritativeOutcomeState ?? "review_required",
          "lifecycle.defer_duplicate_review_hold",
          "projection.visible_review_required",
        ];
        expectedClosureBlockers = dedupe([
          ...(closureRecord?.currentClosureBlockerRefs ?? []),
          decision.duplicateClusterRef,
        ]);
        domainTrace = {
          pathKind: "domain_orchestrator",
          canonicalObjectRefs: [
            `DuplicateCluster:${decision.duplicateClusterRef}`,
            `DuplicateResolutionDecision:${decision.duplicateResolutionDecisionId}`,
            `RequestClosureRecord:${closureRecord?.closureRecordId ?? "missing"}`,
          ],
          eventNames: expectedEvents,
          settlementRefs: settlement.settlementIds,
          closureAuthorityOwner: "LifecycleCoordinator",
          sideEffectDelta: 1,
          continuityOutcome: "review_required_same_shell",
          closureBlockerRefs: expectedClosureBlockers,
          payload: {
            duplicate,
            lifecycle: {
              request: lifecycle.request.toSnapshot(),
              closureRecords: lifecycle.closureRecords.map((entry) => entry.toSnapshot()),
              fence: lifecycle.fence.toSnapshot(),
            },
            settlement,
          },
        };
      } else if (blueprint.referenceCaseId === "RC_FLOW_004") {
        const requestClosure = requestClosureByScenario.get(
          "defer_fallback_review_after_degraded_progress",
        );
        const lifecycle = lifecycleByScenario.get("fallback_review_hold");
        const settlement = settlementByScenario.get("stale_recoverable_due_to_tuple_drift");
        if (!requestClosure || !lifecycle || !settlement) {
          throw new Error("Missing quarantine fallback dependencies");
        }
        expectedEvents = dedupe([
          "intake.attachment.quarantined",
          "request.closure_blockers.changed",
        ]);
        settlementChain = [
          "gateway.authority.declared_read_surface",
          "command.accepted.awaiting_settlement_evidence",
          settlement.envelopes[0]?.authoritativeOutcomeState ?? "recovery_required",
          "fallback_review_case_open",
          "projection.visible_recovery_required",
        ];
        expectedClosureBlockers = dedupe([
          ...(requestClosure.blockerRefs ?? []),
          ...(lifecycle.closureRecords[0]?.toSnapshot().currentClosureBlockerRefs ?? []),
        ]);
        caseGapRefs = dedupe([
          ...caseGapRefs,
          "GAP_REFERENCE_FLOW_SURFACE_SUPPORT_REPLAY_CONTINUES_VIA_READ_ONLY_PUBLISHED_SHELL",
        ]);
        domainTrace = {
          pathKind: "domain_orchestrator",
          canonicalObjectRefs: [
            `FallbackReviewCase:${requestClosure.fallbackCase?.fallbackCaseId ?? "missing"}`,
            `RequestClosureRecord:${requestClosure.closureRecord.closureRecordId}`,
            `TransitionEnvelope:${settlement.envelopes[0]?.transitionId ?? "missing"}`,
          ],
          eventNames: expectedEvents,
          settlementRefs: settlement.settlementIds,
          closureAuthorityOwner: "LifecycleCoordinator",
          sideEffectDelta: 1,
          continuityOutcome: "patient_visible_continuity_preserved_during_fallback_review",
          closureBlockerRefs: expectedClosureBlockers,
          payload: {
            requestClosure,
            lifecycle: {
              request: lifecycle.request.toSnapshot(),
              closureRecords: lifecycle.closureRecords.map((entry) => entry.toSnapshot()),
              fence: lifecycle.fence.toSnapshot(),
            },
            settlement,
          },
        };
      } else if (blueprint.referenceCaseId === "RC_FLOW_005") {
        const requestClosure = requestClosureByScenario.get("defer_identity_repair_hold");
        const lifecycle = lifecycleByScenario.get("wrong_patient_repair_release");
        const identity = identityByScenario.get("wrong_patient_freeze_release");
        if (!requestClosure || !lifecycle || !identity) {
          throw new Error("Missing identity hold dependencies");
        }
        expectedEvents = dedupe([
          "identity.repair_case.opened",
          "identity.repair_case.freeze_committed",
          "reachability.changed",
        ]);
        settlementChain = [
          "gateway.publication_blocked",
          "command.accepted.awaiting_settlement_evidence",
          "identity_repair_hold_open",
          "lifecycle.defer_identity_repair",
          "projection.visible_recovery_required",
        ];
        expectedClosureBlockers = dedupe([
          ...(requestClosure.blockerRefs ?? []),
          ...(lifecycle.closureRecords[0]?.toSnapshot().currentClosureBlockerRefs ?? []),
        ]);
        domainTrace = {
          pathKind: "domain_orchestrator",
          canonicalObjectRefs: [
            `IdentityRepairCase:${identity.repairCase.repairCaseId}`,
            `IdentityRepairFreeze:${identity.freezeRecord.freezeRecordId}`,
            `RequestClosureRecord:${requestClosure.closureRecord.closureRecordId}`,
          ],
          eventNames: expectedEvents,
          settlementRefs: [
            identity.freezeRecord.freezeRecordId,
            identity.releaseSettlement.releaseSettlementId,
          ],
          closureAuthorityOwner: "LifecycleCoordinator",
          sideEffectDelta: 1,
          continuityOutcome: "unsafe_continuation_blocked_pending_identity_repair",
          closureBlockerRefs: expectedClosureBlockers,
          payload: {
            requestClosure,
            lifecycle: {
              request: lifecycle.request.toSnapshot(),
              closureRecords: lifecycle.closureRecords.map((entry) => entry.toSnapshot()),
              fence: lifecycle.fence.toSnapshot(),
            },
            identity,
          },
        };
      } else if (blueprint.referenceCaseId === "RC_FLOW_006") {
        const requestClosure = requestClosureByScenario.get("defer_external_confirmation_pending");
        const lifecycle = lifecycleByScenario.get("booking_confirmation");
        const settlement = settlementByScenario.get(
          "accepted_for_processing_pending_external_confirmation",
        );
        if (!requestClosure || !lifecycle || !settlement) {
          throw new Error("Missing confirmation blocked dependencies");
        }
        const lifecycleClosure = lifecycle.closureRecords[0]?.toSnapshot();
        expectedEvents = dedupe([
          "confirmation.gate.created",
          "request.closure_blockers.changed",
        ]);
        settlementChain = [
          "gateway.authority.declared",
          "command.accepted.awaiting_settlement_evidence",
          settlement.envelopes[0]?.processingAcceptanceState ?? "awaiting_external_confirmation",
          "lifecycle.defer_confirmation_gate",
          "projection.visible_pending_confirmation",
        ];
        expectedClosureBlockers = dedupe([
          ...(requestClosure.blockerRefs ?? []),
          ...(lifecycleClosure?.currentConfirmationGateRefs ?? []),
        ]);
        domainTrace = {
          pathKind: "domain_orchestrator",
          canonicalObjectRefs: [
            `RequestClosureRecord:${lifecycleClosure?.closureRecordId ?? "missing"}`,
            `TransitionEnvelope:${settlement.envelopes[0]?.transitionId ?? "missing"}`,
            `ConfirmationGate:${lifecycleClosure?.currentConfirmationGateRefs?.[0] ?? "missing"}`,
          ],
          eventNames: expectedEvents,
          settlementRefs: settlement.settlementIds,
          closureAuthorityOwner: "LifecycleCoordinator",
          sideEffectDelta: 1,
          continuityOutcome: "same_lineage_open_pending_external_confirmation",
          closureBlockerRefs: expectedClosureBlockers,
          payload: {
            requestClosure,
            lifecycle: {
              request: lifecycle.request.toSnapshot(),
              closureRecords: lifecycle.closureRecords.map((entry) => entry.toSnapshot()),
              fence: lifecycle.fence.toSnapshot(),
            },
            settlement,
          },
        };
      } else {
        throw new Error(`Unhandled reference case ${blueprint.referenceCaseId}`);
      }

      const eventScenarioId =
        blueprint.referenceCaseId === "RC_FLOW_003"
          ? "closure_blocker_flow"
          : blueprint.referenceCaseId === "RC_FLOW_004"
            ? "quarantine_attachment_flow"
            : blueprint.referenceCaseId === "RC_FLOW_005"
              ? "reachability_failure_flow"
              : blueprint.referenceCaseId === "RC_FLOW_006"
                ? "confirmation_gate_flow"
                : null;
      const mappedEventRows = buildMappedEventRows(
        eventSpineApplication.mapping.transportMappings,
        expectedEvents,
      );
      const eventScenario = eventScenarioId ? eventSpineByScenario.get(eventScenarioId) ?? null : null;
      const projectionTrace = await captureProjectionTrace(
        cluster,
        blueprint,
        commandTrace.correlationId ??
          gatewayTrace.correlationId ??
          `seq128-${blueprint.referenceCaseId.toLowerCase()}-projection`,
        expectedEvents[0] ?? "request.submitted",
      );

      const shellTrace = buildShellTrace(
        tupleCatalog.surfaceAuthorityTuples,
        blueprint,
        blueprint.shellContinuityExpectation,
        caseGapRefs,
      );

      const caseRecordBase: Omit<ReferenceFlowCase, "traceDigestRef"> = {
        referenceCaseId: blueprint.referenceCaseId,
        legacyReferenceCaseId: legacy.referenceCaseId,
        legacyCaseCode: legacy.caseCode,
        title: blueprint.title,
        scenarioClass: blueprint.scenarioClass,
        seedFixtureRefs,
        entryChannel: blueprint.entryChannel,
        gatewaySurfaceRef: blueprint.gatewaySurfaceRef,
        routeFamilyRef: blueprint.routeFamilyRef,
        expectedCanonicalObjects: domainTrace.canonicalObjectRefs,
        expectedEvents,
        expectedSettlementChain: settlementChain,
        expectedProjectionFamilies: dedupe([
          ...legacy.projectionQueryContractRefs,
          `projection::${blueprint.projectionName}`,
        ]),
        expectedClosureBlockers,
        expectedRecoveryOrFallbackPosture: blueprint.expectedRecoveryOrFallbackPosture,
        shellContinuityExpectation: blueprint.shellContinuityExpectation,
        mockOrActualState: MOCK_NOW_STATE,
        notes,
        provesRuleRefs: blueprint.provesRuleRefs,
        dependencyTaskRefs: dedupe([...PROGRAMME_TASK_REFS, ...blueprint.dependencyTaskRefs]),
        gapRefs: dedupe([...caseGapRefs, ...mappedEventRows.gapRefs]),
        actualTrace: {
          gateway: gatewayTrace,
          command: commandTrace,
          domain: domainTrace,
          eventSpine: {
            pathKind: "event_spine",
            eventNames: expectedEvents,
            mappedTransportRows: mappedEventRows.rows,
            scenarioId: eventScenario?.scenarioId ?? null,
            scenarioSummary: eventScenario ? (eventScenario as unknown as JsonObject) : null,
            gapRefs: dedupe([...mappedEventRows.gapRefs]),
          },
          projection: projectionTrace,
          shell: shellTrace,
        },
      };
      const caseRecord: ReferenceFlowCase = {
        ...caseRecordBase,
        traceDigestRef: buildTraceDigest(caseRecordBase),
      };
      cases.push(caseRecord);
    }

    const traceMatrixRows = cases.flatMap((caseRecord) => buildTraceMatrixRows(caseRecord));
    const projectionSnapshotRows = cases.flatMap((caseRecord) => mapProjectionRows(caseRecord));
    const settlementLines = cases.flatMap((caseRecord) => buildSettlementLines(caseRecord));
    const blockerRows = cases.flatMap((caseRecord) => buildBlockerRows(caseRecord));

    const referenceFlowHarness = {
      task_id: TASK_ID,
      generated_at: generatedAt,
      captured_on: generatedAt.slice(0, 10),
      visual_mode: VISUAL_MODE,
      mission:
        "Synthetic Phase 0 reference flow through the actual gateway, command API, domain kernel, event spine, projection worker, and shell-facing manifest layers.",
      source_precedence: SOURCE_PRECEDENCE,
      summary: {
        reference_case_count: cases.length,
        unhappy_path_case_count: cases.filter((entry) => entry.scenarioClass !== "nominal").length,
        runtime_http_layer_count: traceMatrixRows.filter((entry) => entry.pathKind === "runtime_http").length,
        gap_count: cases.reduce((sum, entry) => sum + entry.gapRefs.length, 0),
      },
      dependency_task_refs: PROGRAMME_TASK_REFS,
      runtime_services: [
        "api-gateway",
        "command-api",
        "projection-worker",
      ],
      referenceFlowCases: cases,
      traceability: cases.map((entry) => ({
        referenceCaseId: entry.referenceCaseId,
        provesRuleRefs: entry.provesRuleRefs,
        dependencyTaskRefs: entry.dependencyTaskRefs,
        traceDigestRef: entry.traceDigestRef,
      })),
    };

    const mergedReferenceCatalog = {
      ...legacyCatalog,
      referenceFlowHarness,
      referenceFlowCases: cases,
    };

    await Promise.all([
      writeJson(REFERENCE_CATALOG_PATH, mergedReferenceCatalog),
      writeCsv(TRACE_MATRIX_PATH, traceMatrixRows),
      writeCsv(PROJECTION_SNAPSHOTS_PATH, projectionSnapshotRows),
      writeJsonl(SETTLEMENT_CHAIN_PATH, settlementLines),
      writeCsv(BLOCKER_MATRIX_PATH, blockerRows),
      writeFile(SYNTHETIC_FLOW_DOC_PATH, renderSyntheticFlowDoc(cases, generatedAt)),
      writeFile(CASE_CATALOG_DOC_PATH, renderCaseCatalogDoc(cases)),
      writeFile(SEED_CONTRACT_DOC_PATH, renderSeedContractsDoc(cases)),
      writeFile(TRACEABILITY_DOC_PATH, renderTraceabilityDoc(cases)),
      writeFile(OBSERVATORY_PATH, renderObservatoryHtml(cases, generatedAt)),
    ]);

    console.log(
      JSON.stringify(
        {
          task_id: TASK_ID,
          generated_at: generatedAt,
          reference_case_count: cases.length,
          trace_matrix_rows: traceMatrixRows.length,
          projection_snapshot_rows: projectionSnapshotRows.length,
          blocker_rows: blockerRows.length,
          settlement_lines: settlementLines.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await stopRuntimeCluster(cluster);
  }
}

await main();
