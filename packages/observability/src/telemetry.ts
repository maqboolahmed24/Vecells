import {
  createCorrelationHopRecord,
  digestForTelemetry,
  type CorrelationHopKind,
  type CorrelationHopRecord,
  type CorrelationReplayState,
  type EdgeCorrelationContext,
} from "./correlation-spine";

export type TelemetryScalar = string | number | boolean | null;

export type TelemetryDisclosureClass =
  | "control_plane_safe"
  | "public_descriptor"
  | "phi_reference_only"
  | "masked_contact_descriptor"
  | "masked_route_descriptor"
  | "audit_link_only"
  | "blocked_raw_phi";

export interface TelemetrySafeField {
  disclosureClass: TelemetryDisclosureClass;
  emittedValue: TelemetryScalar;
  sourceRef?: string;
}

export interface TelemetryDisclosureFenceSummary {
  disclosureState: "verified" | "masked" | "blocked";
  blockedFieldCount: number;
  maskedFieldCount: number;
  verifiedFieldCount: number;
}

export interface TelemetryEnvelope {
  envelopeRef: string;
  family:
    | "structured_log"
    | "trace_span"
    | "metric"
    | "ui_event"
    | "ui_visibility_receipt"
    | "ui_transition_settlement"
    | "audit";
  level: "info" | "warn" | "error" | "metric" | "trace";
  eventName: string;
  serviceRef: string;
  environment: string;
  emittedAt: string;
  edgeCorrelationId: string;
  causalToken: string;
  traceId: string;
  hopKind: CorrelationHopKind;
  hopSequence: number;
  replayState: CorrelationReplayState;
  hop: CorrelationHopRecord;
  disclosureFence: TelemetryDisclosureFenceSummary;
  fields: Record<string, TelemetrySafeField>;
}

export interface TelemetryLoggerInput {
  correlation: EdgeCorrelationContext;
  fields?: Record<string, TelemetrySafeField>;
}

export interface StructuredTelemetryLogger {
  info(eventName: string, input: TelemetryLoggerInput): TelemetryEnvelope;
  warn(eventName: string, input: TelemetryLoggerInput): TelemetryEnvelope;
  error(eventName: string, input: TelemetryLoggerInput): TelemetryEnvelope;
}

export interface TelemetrySink {
  emit(envelope: TelemetryEnvelope): void;
}

export interface TraceSpanInput {
  correlation: EdgeCorrelationContext;
  serviceRef: string;
  environment: string;
  spanName: string;
  fields?: Record<string, TelemetrySafeField>;
}

export interface MetricSampleInput {
  correlation: EdgeCorrelationContext;
  serviceRef: string;
  environment: string;
  metricName: string;
  metricValue: number;
  unit: string;
  fields?: Record<string, TelemetrySafeField>;
}

export interface CorrelationReconstruction {
  edgeCorrelationId: string;
  hopKinds: readonly CorrelationHopKind[];
  eventNames: readonly string[];
  finalReplayState: CorrelationReplayState;
  blockedEnvelopeCount: number;
  maskedEnvelopeCount: number;
  settlementVisible: boolean;
  visibilityVisible: boolean;
}

function assertScalar(value: TelemetryScalar, field: string): void {
  const valueType = typeof value;
  if (
    value !== null &&
    valueType !== "string" &&
    valueType !== "number" &&
    valueType !== "boolean"
  ) {
    throw new Error(`${field} must be a scalar telemetry value.`);
  }
}

function maskSensitiveContact(value: string): string {
  if (value.includes("@")) {
    const [local = "", domain = "redacted.invalid"] = value.split("@");
    return `${local.slice(0, 1)}***@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `***${digits.slice(-2)}`;
  }
  return "***";
}

export function publicDescriptor(value: TelemetryScalar, sourceRef?: string): TelemetrySafeField {
  assertScalar(value, "publicDescriptor");
  return { disclosureClass: "public_descriptor", emittedValue: value, sourceRef };
}

export function controlPlaneField(value: TelemetryScalar, sourceRef?: string): TelemetrySafeField {
  assertScalar(value, "controlPlaneField");
  return { disclosureClass: "control_plane_safe", emittedValue: value, sourceRef };
}

export function phiReferenceField(value: string, sourceRef?: string): TelemetrySafeField {
  return {
    disclosureClass: "phi_reference_only",
    emittedValue: `phi_ref:${digestForTelemetry(value).slice(0, 12)}`,
    sourceRef,
  };
}

export function maskedContactField(value: string, sourceRef?: string): TelemetrySafeField {
  return {
    disclosureClass: "masked_contact_descriptor",
    emittedValue: maskSensitiveContact(value),
    sourceRef,
  };
}

export function maskedRouteField(value: string, sourceRef?: string): TelemetrySafeField {
  return {
    disclosureClass: "masked_route_descriptor",
    emittedValue: `route_mask:${digestForTelemetry(value).slice(0, 10)}`,
    sourceRef,
  };
}

export function auditLinkField(value: string, sourceRef?: string): TelemetrySafeField {
  return {
    disclosureClass: "audit_link_only",
    emittedValue: value.trim(),
    sourceRef,
  };
}

export function blockedRawPhiField(sourceRef?: string): TelemetrySafeField {
  return {
    disclosureClass: "blocked_raw_phi",
    emittedValue: "[blocked_raw_phi]",
    sourceRef,
  };
}

function assertSafeFields(fields: Record<string, TelemetrySafeField>): void {
  for (const [key, value] of Object.entries(fields)) {
    if (
      value === null ||
      typeof value !== "object" ||
      typeof value.disclosureClass !== "string" ||
      !("emittedValue" in value)
    ) {
      throw new Error(
        `Telemetry field \`${key}\` must use an approved safe-field wrapper from @vecells/observability.`,
      );
    }
  }
}

export function summarizeDisclosureFence(
  fields: Record<string, TelemetrySafeField>,
): TelemetryDisclosureFenceSummary {
  assertSafeFields(fields);

  let blockedFieldCount = 0;
  let maskedFieldCount = 0;
  let verifiedFieldCount = 0;

  for (const field of Object.values(fields)) {
    if (field.disclosureClass === "blocked_raw_phi") {
      blockedFieldCount += 1;
      continue;
    }
    if (
      field.disclosureClass === "phi_reference_only" ||
      field.disclosureClass === "masked_contact_descriptor" ||
      field.disclosureClass === "masked_route_descriptor"
    ) {
      maskedFieldCount += 1;
      continue;
    }
    verifiedFieldCount += 1;
  }

  return {
    disclosureState:
      blockedFieldCount > 0 ? "blocked" : maskedFieldCount > 0 ? "masked" : "verified",
    blockedFieldCount,
    maskedFieldCount,
    verifiedFieldCount,
  };
}

export class InMemoryTelemetrySink implements TelemetrySink {
  private readonly envelopes: TelemetryEnvelope[] = [];

  emit(envelope: TelemetryEnvelope): void {
    this.envelopes.push(envelope);
  }

  clear(): void {
    this.envelopes.length = 0;
  }

  list(): readonly TelemetryEnvelope[] {
    return [...this.envelopes];
  }

  listForCorrelation(edgeCorrelationId: string): readonly TelemetryEnvelope[] {
    return this.envelopes.filter((entry) => entry.edgeCorrelationId === edgeCorrelationId);
  }
}

export class ConsoleTelemetrySink implements TelemetrySink {
  emit(envelope: TelemetryEnvelope): void {
    console.log(JSON.stringify(envelope));
  }
}

function buildEnvelope(
  family: TelemetryEnvelope["family"],
  level: TelemetryEnvelope["level"],
  eventName: string,
  serviceRef: string,
  environment: string,
  correlation: EdgeCorrelationContext,
  fields: Record<string, TelemetrySafeField>,
): TelemetryEnvelope {
  const hop = createCorrelationHopRecord(correlation);
  const disclosureFence = summarizeDisclosureFence(fields);
  return {
    envelopeRef: `${family}_${digestForTelemetry({
      edgeCorrelationId: correlation.edgeCorrelationId,
      eventName,
      hopSequence: correlation.hopSequence,
      serviceRef,
    }).slice(0, 18)}`,
    family,
    level,
    eventName,
    serviceRef,
    environment,
    emittedAt: correlation.issuedAt,
    edgeCorrelationId: correlation.edgeCorrelationId,
    causalToken: correlation.causalToken,
    traceId: correlation.traceId,
    hopKind: correlation.currentHopKind,
    hopSequence: correlation.hopSequence,
    replayState: correlation.replayState,
    hop,
    disclosureFence,
    fields,
  };
}

export function createStructuredTelemetryLogger(input: {
  serviceRef: string;
  environment: string;
  sink?: TelemetrySink;
}): StructuredTelemetryLogger {
  const sink = input.sink ?? new ConsoleTelemetrySink();

  const emit = (
    level: TelemetryEnvelope["level"],
    eventName: string,
    payload: TelemetryLoggerInput,
  ): TelemetryEnvelope => {
    const fields = payload.fields ?? {};
    assertSafeFields(fields);
    const envelope = buildEnvelope(
      "structured_log",
      level,
      eventName,
      input.serviceRef,
      input.environment,
      payload.correlation,
      fields,
    );
    sink.emit(envelope);
    return envelope;
  };

  return {
    info(eventName, payload) {
      return emit("info", eventName, payload);
    },
    warn(eventName, payload) {
      return emit("warn", eventName, payload);
    },
    error(eventName, payload) {
      return emit("error", eventName, payload);
    },
  };
}

export function recordTraceSpan(sink: TelemetrySink, input: TraceSpanInput): TelemetryEnvelope {
  const fields = input.fields ?? {};
  assertSafeFields(fields);
  const envelope = buildEnvelope(
    "trace_span",
    "trace",
    input.spanName,
    input.serviceRef,
    input.environment,
    input.correlation,
    fields,
  );
  sink.emit(envelope);
  return envelope;
}

export function recordMetricSample(
  sink: TelemetrySink,
  input: MetricSampleInput,
): TelemetryEnvelope {
  const envelope = buildEnvelope(
    "metric",
    "metric",
    input.metricName,
    input.serviceRef,
    input.environment,
    input.correlation,
    {
      metricValue: controlPlaneField(input.metricValue),
      unit: controlPlaneField(input.unit),
      ...(input.fields ?? {}),
    },
  );
  sink.emit(envelope);
  return envelope;
}

export function reconstructCorrelationChain(
  envelopes: readonly TelemetryEnvelope[],
  edgeCorrelationId: string,
): CorrelationReconstruction {
  const matching = envelopes
    .filter((entry) => entry.edgeCorrelationId === edgeCorrelationId)
    .sort((left, right) =>
      left.hopSequence === right.hopSequence
        ? left.emittedAt.localeCompare(right.emittedAt)
        : left.hopSequence - right.hopSequence,
    );

  const hopKinds = [...new Set(matching.map((entry) => entry.hopKind))];
  return {
    edgeCorrelationId,
    hopKinds,
    eventNames: matching.map((entry) => entry.eventName),
    finalReplayState: matching.at(-1)?.replayState ?? "live",
    blockedEnvelopeCount: matching.filter(
      (entry) => entry.disclosureFence.disclosureState === "blocked",
    ).length,
    maskedEnvelopeCount: matching.filter(
      (entry) => entry.disclosureFence.disclosureState === "masked",
    ).length,
    settlementVisible: matching.some((entry) => entry.family === "ui_transition_settlement"),
    visibilityVisible: matching.some((entry) => entry.family === "ui_visibility_receipt"),
  };
}
