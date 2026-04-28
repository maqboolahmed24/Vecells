export const OPERATIONAL_DESTINATION_SCHEMA_VERSION =
  "461.phase9.operational-destination-binding.v1";
export const OPERATIONAL_DESTINATION_VISUAL_MODE = "Operational_Destination_Control_Ledger";
export const OPERATIONAL_DESTINATION_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_461_DESTINATION_REGISTRY";

export type OperationalDestinationClass =
  | "service_level_breach_risk_alert"
  | "projection_stale_quarantined_alert"
  | "incident_creation_severity_escalation"
  | "near_miss_intake_notification"
  | "reportability_assessment_pending_overdue"
  | "release_freeze_recovery_disposition"
  | "resilience_posture_blocked_stale"
  | "assurance_graph_blocked_stale"
  | "evidence_gap_owner_notification"
  | "destination_delivery_failure_fallback";

export type OperationalDestinationScenarioState =
  | "normal"
  | "missing_secret"
  | "denied_scope"
  | "stale_destination"
  | "delivery_failed"
  | "permission_denied";

export type OperationalDestinationVerificationStatus =
  | "verified"
  | "missing_secret"
  | "denied_scope"
  | "stale"
  | "failed"
  | "blocked"
  | "permission_denied";

export type OperationalDestinationDeliveryResult =
  | "delivered"
  | "blocked"
  | "failed"
  | "stale"
  | "permission_denied";

export type OperationalDestinationSeverityThreshold =
  | "watch"
  | "caution"
  | "critical"
  | "overdue"
  | "blocked";

export type OperationalDestinationConsumer =
  | "operations"
  | "incident"
  | "assurance"
  | "release"
  | "resilience";

export interface DestinationRedactionPolicyBinding {
  readonly policyId: string;
  readonly policyHash: string;
  readonly mode: "minimum_necessary_hashes_only";
  readonly allowedFields: readonly string[];
  readonly disallowedFields: readonly string[];
  readonly proof:
    | "no_phi_no_inline_secret"
    | "minimum_necessary_synthetic_payload"
    | "fallback_delivery_failure_safe";
}

export interface AlertDestinationVerificationRecord {
  readonly verificationId: string;
  readonly bindingId: string;
  readonly verifiedAt: string;
  readonly status: OperationalDestinationVerificationStatus;
  readonly receiverRef: string;
  readonly syntheticPayloadHash: string;
  readonly settlementRef: string;
  readonly checkedBy: "playwright:461_configure_alerting_destinations";
  readonly evidenceRef: string;
  readonly redactionPolicyHash: string;
  readonly secretRef: string;
  readonly scopeTupleHash: string;
  readonly receiverObserved: boolean;
  readonly failureReason?: string;
}

export interface IncidentDestinationRoute {
  readonly routeId: string;
  readonly bindingId: string;
  readonly routeFamily:
    | "service_breach"
    | "projection_health"
    | "incident_command"
    | "near_miss"
    | "reportability"
    | "release_watch"
    | "resilience"
    | "assurance"
    | "evidence_gap"
    | "fallback";
  readonly consumedBy: readonly OperationalDestinationConsumer[];
  readonly readinessState: "ready" | "blocked" | "stale" | "permission_denied";
  readonly routeProofRef: string;
}

export interface DestinationDeliverySettlement {
  readonly settlementId: string;
  readonly bindingId: string;
  readonly idempotencyKey: string;
  readonly result: OperationalDestinationDeliveryResult;
  readonly commandEnvelopeRef: string;
  readonly retryAttemptCount: number;
  readonly nextRetryAt: string | null;
  readonly receiverStatus: "accepted" | "not_called" | "rejected" | "stale";
  readonly payloadSchemaRef: "data/contracts/461_operational_destination_binding.schema.json";
  readonly fallbackTriggered: boolean;
  readonly fallbackBindingId?: string;
}

export interface OperationalDestinationBinding {
  readonly schemaVersion: typeof OPERATIONAL_DESTINATION_SCHEMA_VERSION;
  readonly bindingId: string;
  readonly destinationClass: OperationalDestinationClass;
  readonly label: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly audience: string;
  readonly purpose: string;
  readonly eventClass: string;
  readonly severityThreshold: OperationalDestinationSeverityThreshold;
  readonly receiverRef: string;
  readonly endpointLabel: string;
  readonly secretRef: string;
  readonly secretHandleRef: string;
  readonly secretMaterialInline: false;
  readonly redactionPolicy: DestinationRedactionPolicyBinding;
  readonly redactionPolicyHash: string;
  readonly retryPolicy: {
    readonly maxAttempts: number;
    readonly backoff: "fixed_30s_then_2m_cap_5m";
    readonly deadLetterAfter: "verification_failure_or_scope_denied";
  };
  readonly idempotencyStrategy: {
    readonly naturalKey: string;
    readonly replayPolicy: "upsert_same_natural_key";
    readonly dedupeWindow: "24h";
  };
  readonly failClosedPolicy: {
    readonly staleSecret: true;
    readonly staleRedactionPolicy: true;
    readonly staleRuntimePublication: true;
    readonly missingVerification: true;
  };
  readonly fallbackBindingId: string | null;
  readonly lastVerification: AlertDestinationVerificationRecord;
  readonly route: IncidentDestinationRoute;
  readonly settlement: DestinationDeliverySettlement;
  readonly downstreamReadinessRefs: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface DestinationSyntheticPayload {
  readonly schemaVersion: "461.phase9.fake-receiver-payload.v1";
  readonly eventClass: string;
  readonly destinationClass: OperationalDestinationClass;
  readonly severityThreshold: OperationalDestinationSeverityThreshold;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly correlationId: string;
  readonly scopeTupleHash: string;
  readonly redactionPolicyHash: string;
  readonly syntheticSummary: string;
  readonly safeDescriptorHash: string;
  readonly idempotencyKey: string;
  readonly receiverRef: string;
}

export interface AlertDestinationVerificationFixtureSinkRecord {
  readonly receiverRecordId: string;
  readonly bindingId: string;
  readonly receiverRef: string;
  readonly observedAt: string;
  readonly accepted: boolean;
  readonly responseCode: number;
  readonly payloadHash: string;
  readonly payload: DestinationSyntheticPayload;
}

export interface DownstreamDestinationReadinessProjection {
  readonly surface: OperationalDestinationConsumer;
  readonly route: "/ops/overview" | "/ops/incidents" | "/ops/assurance" | "/ops/release" | "/ops/resilience";
  readonly readinessState: "ready" | "blocked" | "stale" | "permission_denied";
  readonly destinationRefs: readonly string[];
  readonly blockedDestinationRefs: readonly string[];
  readonly summary: string;
}

export interface OperationalDestinationRegistryProjection {
  readonly schemaVersion: typeof OPERATIONAL_DESTINATION_SCHEMA_VERSION;
  readonly visualMode: typeof OPERATIONAL_DESTINATION_VISUAL_MODE;
  readonly scenarioState: OperationalDestinationScenarioState;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly selectedBindingId: string;
  readonly selectedBinding: OperationalDestinationBinding;
  readonly bindings: readonly OperationalDestinationBinding[];
  readonly verificationRecords: readonly AlertDestinationVerificationRecord[];
  readonly settlements: readonly DestinationDeliverySettlement[];
  readonly fakeReceiverRecords: readonly AlertDestinationVerificationFixtureSinkRecord[];
  readonly downstreamReadiness: readonly DownstreamDestinationReadinessProjection[];
  readonly registryHash: string;
  readonly readyCount: number;
  readonly blockedCount: number;
  readonly staleCount: number;
  readonly failedCount: number;
  readonly automationAnchors: readonly string[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly interfaceGapArtifactRef: typeof OPERATIONAL_DESTINATION_GAP_ARTIFACT_REF;
}

export interface OperationalDestinationDefinition {
  readonly destinationClass: OperationalDestinationClass;
  readonly label: string;
  readonly audience: string;
  readonly purpose: string;
  readonly eventClass: string;
  readonly severityThreshold: OperationalDestinationSeverityThreshold;
  readonly routeFamily: IncidentDestinationRoute["routeFamily"];
  readonly consumedBy: readonly OperationalDestinationConsumer[];
}

const DESTINATION_DEFINITIONS = [
  {
    destinationClass: "service_level_breach_risk_alert",
    label: "Service-level breach-risk alerts",
    audience: "Operations duty lead",
    purpose: "Escalate calibrated breach-risk before service SLOs are missed.",
    eventClass: "ops.slo.breach_risk",
    severityThreshold: "caution",
    routeFamily: "service_breach",
    consumedBy: ["operations", "incident"],
  },
  {
    destinationClass: "projection_stale_quarantined_alert",
    label: "Projection stale or quarantined alerts",
    audience: "Projection owner",
    purpose: "Notify when published operational projections become stale or quarantined.",
    eventClass: "ops.projection.health",
    severityThreshold: "critical",
    routeFamily: "projection_health",
    consumedBy: ["operations", "assurance", "resilience"],
  },
  {
    destinationClass: "incident_creation_severity_escalation",
    label: "Incident creation and severity escalation",
    audience: "Incident commander",
    purpose: "Route new incidents and severity changes to command intake.",
    eventClass: "ops.incident.command",
    severityThreshold: "critical",
    routeFamily: "incident_command",
    consumedBy: ["incident", "operations", "assurance"],
  },
  {
    destinationClass: "near_miss_intake_notification",
    label: "Near-miss intake notifications",
    audience: "Safety review owner",
    purpose: "Bring near-miss reports into the same incident and assurance review path.",
    eventClass: "ops.incident.near_miss",
    severityThreshold: "watch",
    routeFamily: "near_miss",
    consumedBy: ["incident", "assurance"],
  },
  {
    destinationClass: "reportability_assessment_pending_overdue",
    label: "Reportability pending or overdue alerts",
    audience: "Reportability reviewer",
    purpose: "Escalate pending and overdue reportability decisions.",
    eventClass: "ops.incident.reportability",
    severityThreshold: "overdue",
    routeFamily: "reportability",
    consumedBy: ["incident", "assurance"],
  },
  {
    destinationClass: "release_freeze_recovery_disposition",
    label: "Release freeze and recovery disposition alerts",
    audience: "Release manager",
    purpose: "Route freeze, rollback, and recovery disposition changes into release watch.",
    eventClass: "ops.release.watch",
    severityThreshold: "critical",
    routeFamily: "release_watch",
    consumedBy: ["release", "operations", "resilience"],
  },
  {
    destinationClass: "resilience_posture_blocked_stale",
    label: "Resilience posture blocked or stale alerts",
    audience: "Resilience lead",
    purpose: "Escalate blocked or stale resilience posture before exercises proceed.",
    eventClass: "ops.resilience.posture",
    severityThreshold: "blocked",
    routeFamily: "resilience",
    consumedBy: ["resilience", "operations", "assurance"],
  },
  {
    destinationClass: "assurance_graph_blocked_stale",
    label: "Assurance graph blocked or stale alerts",
    audience: "Assurance evidence owner",
    purpose: "Escalate blocked evidence graph verdicts and stale runtime bindings.",
    eventClass: "ops.assurance.graph",
    severityThreshold: "blocked",
    routeFamily: "assurance",
    consumedBy: ["assurance", "operations"],
  },
  {
    destinationClass: "evidence_gap_owner_notification",
    label: "Evidence-gap owner notifications",
    audience: "Evidence owner",
    purpose: "Notify named owners when control evidence gaps need action.",
    eventClass: "ops.assurance.evidence_gap",
    severityThreshold: "caution",
    routeFamily: "evidence_gap",
    consumedBy: ["assurance", "operations"],
  },
  {
    destinationClass: "destination_delivery_failure_fallback",
    label: "Destination delivery failure fallback",
    audience: "Fallback operations duty lead",
    purpose: "Route failed destination deliveries to a safe fallback path without leaking payloads.",
    eventClass: "ops.destination.delivery_failure",
    severityThreshold: "critical",
    routeFamily: "fallback",
    consumedBy: ["operations", "incident", "assurance", "release", "resilience"],
  },
] as const satisfies readonly OperationalDestinationDefinition[];

export const operationalDestinationClassOptions = DESTINATION_DEFINITIONS.map((definition) => ({
  value: definition.destinationClass,
  label: definition.label,
}));

export const requiredOperationalDestinationClasses = DESTINATION_DEFINITIONS.map(
  (definition) => definition.destinationClass,
);

const SOURCE_ALGORITHM_REFS = [
  "blueprint/phase-9-the-assurance-ledger.md#9A-assurance-ledger",
  "blueprint/phase-9-the-assurance-ledger.md#9B-operational-projections",
  "blueprint/phase-9-the-assurance-ledger.md#9G-security-incident-and-near-miss",
  "blueprint/platform-runtime-and-release-blueprint.md#release-watch-alerting",
  "blueprint/platform-admin-and-config-blueprint.md#config-workspace",
  "blueprint/operations-console-frontend-blueprint.md#telemetry-disclosure-fences",
  "blueprint/phase-0-the-foundation-protocol.md#ui-event-envelope",
];

const AUTOMATION_ANCHORS = [
  "operational-destination-config-surface",
  "destination-scope-ribbon",
  "destination-binding-wizard",
  "destination-binding-table",
  "destination-fake-receiver-ledger",
  "destination-redaction-secret-rail",
  "destination-downstream-readiness-strip",
  "destination-error-summary",
];

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `sha256:${(hash >>> 0).toString(16).padStart(8, "0")}${value.length
    .toString(16)
    .padStart(8, "0")}`;
}

function slug(value: string): string {
  return value.replace(/_/g, "-");
}

function statusForScenario(
  scenarioState: OperationalDestinationScenarioState,
  selected: boolean,
  destinationClass: OperationalDestinationClass,
): OperationalDestinationVerificationStatus {
  if (!selected || destinationClass === "destination_delivery_failure_fallback") {
    return "verified";
  }
  switch (scenarioState) {
    case "missing_secret":
      return "missing_secret";
    case "denied_scope":
      return "denied_scope";
    case "stale_destination":
      return "stale";
    case "delivery_failed":
      return "failed";
    case "permission_denied":
      return "permission_denied";
    case "normal":
      return "verified";
  }
}

function deliveryResultForStatus(
  status: OperationalDestinationVerificationStatus,
): OperationalDestinationDeliveryResult {
  switch (status) {
    case "verified":
      return "delivered";
    case "stale":
      return "stale";
    case "failed":
      return "failed";
    case "permission_denied":
      return "permission_denied";
    case "missing_secret":
    case "denied_scope":
    case "blocked":
      return "blocked";
  }
}

function readinessForStatus(
  status: OperationalDestinationVerificationStatus,
): IncidentDestinationRoute["readinessState"] {
  switch (status) {
    case "verified":
      return "ready";
    case "stale":
      return "stale";
    case "permission_denied":
      return "permission_denied";
    case "missing_secret":
    case "denied_scope":
    case "failed":
    case "blocked":
      return "blocked";
  }
}

export function normalizeOperationalDestinationScenarioState(
  value: string | null | undefined,
): OperationalDestinationScenarioState {
  const normalized = String(value ?? "normal")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (
    normalized === "missing_secret" ||
    normalized === "denied_scope" ||
    normalized === "stale_destination" ||
    normalized === "delivery_failed" ||
    normalized === "permission_denied"
  ) {
    return normalized;
  }
  return "normal";
}

export function secretRefForOperationalDestination(
  destinationClass: OperationalDestinationClass,
  tenantRef = "tenant-demo-gp",
  environmentRef = "local",
): string {
  return `vault-ref/${tenantRef}/${environmentRef}/alerting/${slug(destinationClass)}/v1`;
}

export function createDestinationSyntheticPayload(
  binding: OperationalDestinationBinding,
): DestinationSyntheticPayload {
  return {
    schemaVersion: "461.phase9.fake-receiver-payload.v1",
    eventClass: binding.eventClass,
    destinationClass: binding.destinationClass,
    severityThreshold: binding.severityThreshold,
    tenantRef: binding.tenantRef,
    environmentRef: binding.environmentRef,
    correlationId: `corr-461-${slug(binding.destinationClass)}`,
    scopeTupleHash: binding.lastVerification.scopeTupleHash,
    redactionPolicyHash: binding.redactionPolicyHash,
    syntheticSummary: `Synthetic ${binding.label.toLowerCase()} verification only.`,
    safeDescriptorHash: stableHash(`${binding.bindingId}:safe-descriptor`),
    idempotencyKey: binding.settlement.idempotencyKey,
    receiverRef: binding.receiverRef,
  };
}

export function createOperationalDestinationBinding(
  definition: OperationalDestinationDefinition,
  options: {
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly selected?: boolean;
    readonly scenarioState?: OperationalDestinationScenarioState;
    readonly secretRefOverride?: string;
  } = {},
): OperationalDestinationBinding {
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const bindingId = `dest-${slug(definition.destinationClass)}`;
  const status = statusForScenario(
    options.scenarioState ?? "normal",
    options.selected ?? false,
    definition.destinationClass,
  );
  const secretRef =
    options.secretRefOverride ??
    (status === "missing_secret"
      ? ""
      : secretRefForOperationalDestination(definition.destinationClass, tenantRef, environmentRef));
  const redactionPolicyHash = stableHash(
    `${definition.destinationClass}:${tenantRef}:${environmentRef}:minimum-necessary`,
  );
  const scopeTupleHash = stableHash(`${tenantRef}:${environmentRef}:ops-destinations`);
  const payloadHash = stableHash(
    `${definition.eventClass}:${definition.destinationClass}:${redactionPolicyHash}`,
  );
  const settlementResult = deliveryResultForStatus(status);
  const fallbackBindingId =
    definition.destinationClass === "destination_delivery_failure_fallback"
      ? null
      : "dest-destination-delivery-failure-fallback";
  const settlementId = `settlement-461-${slug(definition.destinationClass)}`;
  const settlement: DestinationDeliverySettlement = {
    settlementId,
    bindingId,
    idempotencyKey: `${tenantRef}:${environmentRef}:${definition.destinationClass}:v1`,
    result: settlementResult,
    commandEnvelopeRef: `ui-command-settlement:461:${bindingId}`,
    retryAttemptCount: settlementResult === "failed" ? 3 : 0,
    nextRetryAt: settlementResult === "failed" ? "2026-04-28T10:07:00Z" : null,
    receiverStatus:
      settlementResult === "delivered"
        ? "accepted"
        : settlementResult === "stale"
          ? "stale"
          : settlementResult === "failed"
            ? "rejected"
            : "not_called",
    payloadSchemaRef: "data/contracts/461_operational_destination_binding.schema.json",
    fallbackTriggered: settlementResult === "failed",
    fallbackBindingId: settlementResult === "failed" ? fallbackBindingId ?? undefined : undefined,
  };
  const verification: AlertDestinationVerificationRecord = {
    verificationId: `verification-461-${slug(definition.destinationClass)}`,
    bindingId,
    verifiedAt: status === "stale" ? "2026-04-26T09:00:00Z" : "2026-04-28T09:46:00Z",
    status,
    receiverRef: `fake-receiver:phase9:${slug(definition.destinationClass)}`,
    syntheticPayloadHash: payloadHash,
    settlementRef: settlementId,
    checkedBy: "playwright:461_configure_alerting_destinations",
    evidenceRef: `.artifacts/operational-destinations-461/${slug(definition.destinationClass)}.json`,
    redactionPolicyHash,
    secretRef,
    scopeTupleHash,
    receiverObserved: status === "verified" || status === "failed",
    failureReason:
      status === "missing_secret"
        ? "Vault handle is required before verification can call the fake receiver."
        : status === "denied_scope"
          ? "Selected tenant and environment are outside the operator scope."
          : status === "stale"
            ? "Last verification is older than the runtime publication window."
            : status === "failed"
              ? "Fake receiver returned a deterministic delivery failure."
              : status === "permission_denied"
                ? "Operator lacks destination configuration permission for this scope."
                : undefined,
  };
  const route: IncidentDestinationRoute = {
    routeId: `route-461-${slug(definition.destinationClass)}`,
    bindingId,
    routeFamily: definition.routeFamily,
    consumedBy: definition.consumedBy,
    readinessState: readinessForStatus(status),
    routeProofRef: `route-proof:461:${definition.destinationClass}:${readinessForStatus(status)}`,
  };
  return {
    schemaVersion: OPERATIONAL_DESTINATION_SCHEMA_VERSION,
    bindingId,
    destinationClass: definition.destinationClass,
    label: definition.label,
    tenantRef,
    environmentRef,
    audience: definition.audience,
    purpose: definition.purpose,
    eventClass: definition.eventClass,
    severityThreshold: definition.severityThreshold,
    receiverRef: verification.receiverRef,
    endpointLabel: `fake receiver alias ${slug(definition.destinationClass)}`,
    secretRef,
    secretHandleRef: secretRef,
    secretMaterialInline: false,
    redactionPolicy: {
      policyId: `redaction-policy-461-${slug(definition.destinationClass)}`,
      policyHash: redactionPolicyHash,
      mode: "minimum_necessary_hashes_only",
      allowedFields: [
        "schemaVersion",
        "eventClass",
        "destinationClass",
        "severityThreshold",
        "tenantRef",
        "environmentRef",
        "correlationId",
        "scopeTupleHash",
        "redactionPolicyHash",
        "syntheticSummary",
        "safeDescriptorHash",
        "idempotencyKey",
        "receiverRef",
      ],
      disallowedFields: [
        "inlineSecret",
        "rawWebhookUrl",
        "rawPayload",
        "rawPersonIdentifier",
        "clinicalNarrative",
        "freeText",
        "accessToken",
        "credential",
      ],
      proof:
        definition.destinationClass === "destination_delivery_failure_fallback"
          ? "fallback_delivery_failure_safe"
          : "minimum_necessary_synthetic_payload",
    },
    redactionPolicyHash,
    retryPolicy: {
      maxAttempts: 3,
      backoff: "fixed_30s_then_2m_cap_5m",
      deadLetterAfter: "verification_failure_or_scope_denied",
    },
    idempotencyStrategy: {
      naturalKey: `${tenantRef}:${environmentRef}:${definition.destinationClass}`,
      replayPolicy: "upsert_same_natural_key",
      dedupeWindow: "24h",
    },
    failClosedPolicy: {
      staleSecret: true,
      staleRedactionPolicy: true,
      staleRuntimePublication: true,
      missingVerification: true,
    },
    fallbackBindingId,
    lastVerification: verification,
    route,
    settlement,
    downstreamReadinessRefs: definition.consumedBy.map(
      (consumer) => `readiness:461:${consumer}:${definition.destinationClass}`,
    ),
    sourceRefs: SOURCE_ALGORITHM_REFS,
  };
}

function createFakeReceiverRecord(
  binding: OperationalDestinationBinding,
): AlertDestinationVerificationFixtureSinkRecord {
  const payload = createDestinationSyntheticPayload(binding);
  return {
    receiverRecordId: `receiver-record-461-${slug(binding.destinationClass)}`,
    bindingId: binding.bindingId,
    receiverRef: binding.receiverRef,
    observedAt: binding.lastVerification.verifiedAt,
    accepted: binding.settlement.result === "delivered",
    responseCode:
      binding.settlement.result === "delivered"
        ? 202
        : binding.settlement.result === "failed"
          ? 503
          : 409,
    payloadHash: stableHash(JSON.stringify(payload)),
    payload,
  };
}

function buildDownstreamReadiness(
  bindings: readonly OperationalDestinationBinding[],
): readonly DownstreamDestinationReadinessProjection[] {
  const surfaces = [
    ["operations", "/ops/overview"],
    ["incident", "/ops/incidents"],
    ["assurance", "/ops/assurance"],
    ["release", "/ops/release"],
    ["resilience", "/ops/resilience"],
  ] as const satisfies readonly (readonly [OperationalDestinationConsumer, DownstreamDestinationReadinessProjection["route"]])[];
  return surfaces.map(([surface, route]) => {
    const surfaceBindings = bindings.filter((binding) => binding.route.consumedBy.includes(surface));
    const blocked = surfaceBindings.filter((binding) => binding.route.readinessState !== "ready");
    const stale = surfaceBindings.some((binding) => binding.route.readinessState === "stale");
    const denied = surfaceBindings.some(
      (binding) => binding.route.readinessState === "permission_denied",
    );
    const readinessState =
      blocked.length === 0
        ? "ready"
        : denied
          ? "permission_denied"
          : stale
            ? "stale"
            : "blocked";
    return {
      surface,
      route,
      readinessState,
      destinationRefs: surfaceBindings.map((binding) => binding.bindingId),
      blockedDestinationRefs: blocked.map((binding) => binding.bindingId),
      summary:
        blocked.length === 0
          ? `${surface} destinations verified for Phase 9 exercises.`
          : `${surface} readiness waits on ${blocked.length} destination binding${blocked.length === 1 ? "" : "s"}.`,
    };
  });
}

export function createOperationalDestinationRegistryProjection(
  options: {
    readonly scenarioState?: OperationalDestinationScenarioState | string | null;
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly selectedBindingId?: string;
    readonly destinationClass?: OperationalDestinationClass;
    readonly secretRefOverride?: string;
  } = {},
): OperationalDestinationRegistryProjection {
  const scenarioState = normalizeOperationalDestinationScenarioState(options.scenarioState);
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const selectedDefinition =
    DESTINATION_DEFINITIONS.find(
      (definition) =>
        definition.destinationClass === options.destinationClass ||
        `dest-${slug(definition.destinationClass)}` === options.selectedBindingId,
    ) ?? DESTINATION_DEFINITIONS[0]!;
  const bindings = DESTINATION_DEFINITIONS.map((definition) =>
    createOperationalDestinationBinding(definition, {
      tenantRef,
      environmentRef,
      selected: definition.destinationClass === selectedDefinition.destinationClass,
      scenarioState,
      secretRefOverride:
        definition.destinationClass === selectedDefinition.destinationClass
          ? options.secretRefOverride
          : undefined,
    }),
  );
  const selectedBinding =
    bindings.find((binding) => binding.destinationClass === selectedDefinition.destinationClass) ??
    bindings[0]!;
  const downstreamReadiness = buildDownstreamReadiness(bindings);
  const fakeReceiverRecords = bindings
    .filter((binding) => binding.lastVerification.receiverObserved)
    .map(createFakeReceiverRecord);
  const verificationRecords = bindings.map((binding) => binding.lastVerification);
  const settlements = bindings.map((binding) => binding.settlement);
  const readyCount = bindings.filter((binding) => binding.lastVerification.status === "verified")
    .length;
  const staleCount = bindings.filter((binding) => binding.lastVerification.status === "stale")
    .length;
  const failedCount = bindings.filter((binding) => binding.lastVerification.status === "failed")
    .length;
  const blockedCount = bindings.length - readyCount - staleCount - failedCount;
  return {
    schemaVersion: OPERATIONAL_DESTINATION_SCHEMA_VERSION,
    visualMode: OPERATIONAL_DESTINATION_VISUAL_MODE,
    scenarioState,
    tenantRef,
    environmentRef,
    selectedBindingId: selectedBinding.bindingId,
    selectedBinding,
    bindings,
    verificationRecords,
    settlements,
    fakeReceiverRecords,
    downstreamReadiness,
    registryHash: stableHash(
      JSON.stringify(
        bindings.map((binding) => [
          binding.bindingId,
          binding.lastVerification.status,
          binding.redactionPolicyHash,
        ]),
      ),
    ),
    readyCount,
    blockedCount,
    staleCount,
    failedCount,
    automationAnchors: AUTOMATION_ANCHORS,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    interfaceGapArtifactRef: OPERATIONAL_DESTINATION_GAP_ARTIFACT_REF,
  };
}

export function upsertOperationalDestinationBinding(
  bindings: readonly OperationalDestinationBinding[],
  candidate: OperationalDestinationBinding,
): readonly OperationalDestinationBinding[] {
  const candidateKey = candidate.idempotencyStrategy.naturalKey;
  const existingIndex = bindings.findIndex(
    (binding) => binding.idempotencyStrategy.naturalKey === candidateKey,
  );
  if (existingIndex === -1) {
    return [...bindings, candidate];
  }
  return bindings.map((binding, index) => (index === existingIndex ? candidate : binding));
}

export function verifyOperationalDestinationBinding(
  binding: OperationalDestinationBinding,
): {
  readonly binding: OperationalDestinationBinding;
  readonly verification: AlertDestinationVerificationRecord;
  readonly settlement: DestinationDeliverySettlement;
  readonly fakeReceiverRecord: AlertDestinationVerificationFixtureSinkRecord;
} {
  const verified = createOperationalDestinationBinding(
    DESTINATION_DEFINITIONS.find(
      (definition) => definition.destinationClass === binding.destinationClass,
    ) ?? DESTINATION_DEFINITIONS[0]!,
    {
      tenantRef: binding.tenantRef,
      environmentRef: binding.environmentRef,
      selected: true,
      scenarioState: "normal",
      secretRefOverride: binding.secretRef,
    },
  );
  return {
    binding: verified,
    verification: verified.lastVerification,
    settlement: verified.settlement,
    fakeReceiverRecord: createFakeReceiverRecord(verified),
  };
}

export function createOperationalDestinationRegistryFixture() {
  const scenarios = [
    "normal",
    "missing_secret",
    "denied_scope",
    "stale_destination",
    "delivery_failed",
    "permission_denied",
  ] as const satisfies readonly OperationalDestinationScenarioState[];
  return {
    schemaVersion: OPERATIONAL_DESTINATION_SCHEMA_VERSION,
    visualMode: OPERATIONAL_DESTINATION_VISUAL_MODE,
    requiredDestinationClasses: requiredOperationalDestinationClasses,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    automationAnchors: AUTOMATION_ANCHORS,
    scenarioProjections: Object.fromEntries(
      scenarios.map((scenarioState) => [
        scenarioState,
        createOperationalDestinationRegistryProjection({ scenarioState }),
      ]),
    ) as Record<OperationalDestinationScenarioState, OperationalDestinationRegistryProjection>,
  };
}
