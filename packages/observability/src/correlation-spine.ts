export type CorrelationHopKind =
  | "browser"
  | "gateway"
  | "command_handler"
  | "event_bus"
  | "worker"
  | "projection"
  | "ui_visibility_receipt"
  | "audit";

export type CorrelationReplayState = "live" | "restored" | "replayed" | "stale" | "settled";

export interface EdgeCorrelationContext {
  edgeCorrelationId: string;
  causalToken: string;
  traceId: string;
  hopSequence: number;
  currentHopKind: CorrelationHopKind;
  replayState: CorrelationReplayState;
  issuedAt: string;
  environment: string;
  serviceRef: string;
  audienceSurfaceRef: string | null;
  routeFamilyRef: string | null;
  requestMethod: string | null;
  requestPath: string | null;
}

export interface CorrelationHopRecord {
  hopRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  traceId: string;
  hopSequence: number;
  hopKind: CorrelationHopKind;
  replayState: CorrelationReplayState;
  serviceRef: string;
  environment: string;
  emittedAt: string;
  audienceSurfaceRef: string | null;
  routeFamilyRef: string | null;
  requestMethod: string | null;
  requestPath: string | null;
}

export interface MintEdgeCorrelationInput {
  environment: string;
  serviceRef: string;
  hopKind?: CorrelationHopKind;
  replayState?: CorrelationReplayState;
  audienceSurfaceRef?: string | null;
  routeFamilyRef?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
  issuedAt?: string;
  correlationSeed?: string | null;
}

export interface AdvanceCorrelationHopInput {
  hopKind: CorrelationHopKind;
  environment?: string | null;
  serviceRef: string;
  replayState?: CorrelationReplayState;
  emittedAt?: string;
  audienceSurfaceRef?: string | null;
  routeFamilyRef?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
}

export interface ReadCorrelationOptions {
  requireContext?: boolean;
}

export interface CorrelationHeaderMap {
  [key: string]: string | null | undefined;
}

export const correlationHeaderNames = {
  edgeCorrelationId: "x-vecells-edge-correlation-id",
  causalToken: "x-vecells-causal-token",
  hopSequence: "x-vecells-hop-sequence",
  replayState: "x-vecells-replay-state",
  traceId: "x-trace-id",
  legacyCorrelationId: "x-correlation-id",
  legacyRequestId: "x-request-id",
} as const;

export class CorrelationContextError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CorrelationContextError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new CorrelationContextError(code, message);
  }
}

function normalizeTimestamp(value: string | undefined, field: string): string {
  const candidate = (value ?? new Date().toISOString()).trim();
  invariant(
    !Number.isNaN(Date.parse(candidate)),
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return candidate;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

export function stableDigestHex(value: string): string {
  let left = 0x811c9dc5 ^ value.length;
  let right = 0x9e3779b9 ^ value.length;
  let upper = 0xc2b2ae35 ^ value.length;
  let lower = 0x27d4eb2f ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ (code << index % 8), 0x85ebca6b);
    upper = Math.imul(upper ^ (code + index), 0x165667b1);
    lower = Math.imul(lower ^ (code + value.length - index), 0xd3a2646c);
  }

  return [left >>> 0, right >>> 0, upper >>> 0, lower >>> 0]
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");
}

export function digestForTelemetry(value: unknown): string {
  return stableDigestHex(stableStringify(value));
}

function normalizeOptionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeHeaders(headers: CorrelationHeaderMap): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([key, value]) => {
      if (typeof value !== "string") {
        return [];
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? [[key.toLowerCase(), trimmed] as const] : [];
    }),
  );
}

function asReplayState(value: string | null | undefined): CorrelationReplayState {
  if (
    value === "live" ||
    value === "restored" ||
    value === "replayed" ||
    value === "stale" ||
    value === "settled"
  ) {
    return value;
  }
  return "live";
}

function buildCorrelationIds(
  seed: string,
): Pick<EdgeCorrelationContext, "edgeCorrelationId" | "causalToken" | "traceId"> {
  const digest = digestForTelemetry(seed);
  return {
    edgeCorrelationId: `edge_${digest.slice(0, 20)}`,
    causalToken: `cause_${digest.slice(20, 36)}`,
    traceId: `trace_${digest.slice(8, 32)}`,
  };
}

export function mintEdgeCorrelation(input: MintEdgeCorrelationInput): EdgeCorrelationContext {
  const issuedAt = normalizeTimestamp(input.issuedAt, "issuedAt");
  const seed =
    input.correlationSeed ??
    stableStringify({
      environment: input.environment,
      serviceRef: input.serviceRef,
      audienceSurfaceRef: normalizeOptionalRef(input.audienceSurfaceRef),
      routeFamilyRef: normalizeOptionalRef(input.routeFamilyRef),
      requestMethod: normalizeOptionalRef(input.requestMethod),
      requestPath: normalizeOptionalRef(input.requestPath),
      issuedAt,
      hopKind: input.hopKind ?? "browser",
      replayState: input.replayState ?? "live",
    });
  const ids = buildCorrelationIds(seed);
  return {
    ...ids,
    hopSequence: 1,
    currentHopKind: input.hopKind ?? "browser",
    replayState: input.replayState ?? "live",
    issuedAt,
    environment: input.environment,
    serviceRef: input.serviceRef,
    audienceSurfaceRef: normalizeOptionalRef(input.audienceSurfaceRef),
    routeFamilyRef: normalizeOptionalRef(input.routeFamilyRef),
    requestMethod: normalizeOptionalRef(input.requestMethod),
    requestPath: normalizeOptionalRef(input.requestPath),
  };
}

export function readCorrelationFromHeaders(
  headers: CorrelationHeaderMap,
  options: ReadCorrelationOptions = {},
): EdgeCorrelationContext | null {
  const normalized = normalizeHeaders(headers);
  const edgeCorrelationId =
    normalized[correlationHeaderNames.edgeCorrelationId] ??
    normalized[correlationHeaderNames.legacyCorrelationId] ??
    normalized[correlationHeaderNames.legacyRequestId] ??
    null;

  if (!edgeCorrelationId) {
    invariant(
      !options.requireContext,
      "MISSING_EDGE_CORRELATION_ID",
      "edge correlation context is required on protected paths.",
    );
    return null;
  }

  const causalToken =
    normalized[correlationHeaderNames.causalToken] ??
    `cause_${digestForTelemetry(edgeCorrelationId).slice(0, 16)}`;
  const hopSequenceRaw = normalized[correlationHeaderNames.hopSequence] ?? "1";
  const hopSequence = Number.parseInt(hopSequenceRaw, 10);
  invariant(
    Number.isInteger(hopSequence) && hopSequence >= 1,
    "INVALID_HOP_SEQUENCE",
    "x-vecells-hop-sequence must be a positive integer when provided.",
  );

  return {
    edgeCorrelationId,
    causalToken,
    traceId: normalized[correlationHeaderNames.traceId] ?? edgeCorrelationId,
    hopSequence,
    currentHopKind: "browser",
    replayState: asReplayState(normalized[correlationHeaderNames.replayState]),
    issuedAt: new Date().toISOString(),
    environment: "unknown",
    serviceRef: "external",
    audienceSurfaceRef: null,
    routeFamilyRef: null,
    requestMethod: null,
    requestPath: null,
  };
}

export function advanceCorrelationHop(
  previous: EdgeCorrelationContext,
  input: AdvanceCorrelationHopInput,
): EdgeCorrelationContext {
  return {
    edgeCorrelationId: previous.edgeCorrelationId,
    causalToken: previous.causalToken,
    traceId: previous.traceId,
    hopSequence: previous.hopSequence + 1,
    currentHopKind: input.hopKind,
    replayState: input.replayState ?? previous.replayState,
    issuedAt: normalizeTimestamp(input.emittedAt, "emittedAt"),
    environment: normalizeOptionalRef(input.environment) ?? previous.environment,
    serviceRef: input.serviceRef,
    audienceSurfaceRef:
      normalizeOptionalRef(input.audienceSurfaceRef) ?? previous.audienceSurfaceRef,
    routeFamilyRef: normalizeOptionalRef(input.routeFamilyRef) ?? previous.routeFamilyRef,
    requestMethod: normalizeOptionalRef(input.requestMethod) ?? previous.requestMethod,
    requestPath: normalizeOptionalRef(input.requestPath) ?? previous.requestPath,
  };
}

export function serializeCorrelationHeaders(
  context: EdgeCorrelationContext,
): Record<string, string> {
  return {
    [correlationHeaderNames.edgeCorrelationId]: context.edgeCorrelationId,
    [correlationHeaderNames.causalToken]: context.causalToken,
    [correlationHeaderNames.hopSequence]: String(context.hopSequence),
    [correlationHeaderNames.replayState]: context.replayState,
    [correlationHeaderNames.traceId]: context.traceId,
    [correlationHeaderNames.legacyCorrelationId]: context.edgeCorrelationId,
  };
}

export function createCorrelationHopRecord(context: EdgeCorrelationContext): CorrelationHopRecord {
  return {
    hopRef: `hop_${digestForTelemetry({
      edgeCorrelationId: context.edgeCorrelationId,
      hopSequence: context.hopSequence,
      serviceRef: context.serviceRef,
      hopKind: context.currentHopKind,
    }).slice(0, 18)}`,
    edgeCorrelationId: context.edgeCorrelationId,
    causalToken: context.causalToken,
    traceId: context.traceId,
    hopSequence: context.hopSequence,
    hopKind: context.currentHopKind,
    replayState: context.replayState,
    serviceRef: context.serviceRef,
    environment: context.environment,
    emittedAt: context.issuedAt,
    audienceSurfaceRef: context.audienceSurfaceRef,
    routeFamilyRef: context.routeFamilyRef,
    requestMethod: context.requestMethod,
    requestPath: context.requestPath,
  };
}
