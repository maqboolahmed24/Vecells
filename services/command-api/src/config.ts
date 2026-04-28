export type ServiceEnvironment = "local" | "test" | "ci" | "staging" | "production";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ServiceConfig {
  serviceName: "command-api";
  environment: ServiceEnvironment;
  logLevel: LogLevel;
  serviceHost: string;
  servicePort: number;
  adminHost: string;
  adminPort: number;
  maxPayloadBytes: number;
  gracefulShutdownMs: number;
  otelEnabled: boolean;
  secretRefs: readonly string[];
  idempotencyTtlSeconds: number;
  outboxTopic: string;
  mutationGateMode: "observe" | "enforce" | "named_review";
  routeIntentMode: "required" | "warn" | "disabled";
}

const SERVICE_SECRET_REFS = [
  "COMMAND_IDEMPOTENCY_STORE_REF",
  "COMMAND_MUTATION_GATE_SECRET_REF",
] as const;

function readString(
  env: Record<string, string | undefined>,
  key: string,
  fallback: string,
): string {
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function readStringFromKeys(
  env: Record<string, string | undefined>,
  keys: readonly string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function readNumber(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number,
  minimum: number,
): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`Invalid ${key} value: expected number >= ${minimum}`);
  }
  return parsed;
}

function readNumberFromKeys(
  env: Record<string, string | undefined>,
  keys: readonly string[],
  fallback: number,
  minimum: number,
): number {
  for (const key of keys) {
    const raw = env[key];
    if (raw) {
      return readNumber(env, key, fallback, minimum);
    }
  }
  return fallback;
}

function readBoolean(
  env: Record<string, string | undefined>,
  key: string,
  fallback: boolean,
): boolean {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  throw new Error(`Invalid ${key} value: expected true or false`);
}

function readEnum<TValue extends string>(
  env: Record<string, string | undefined>,
  key: string,
  values: readonly TValue[],
  fallback: TValue,
): TValue {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  if (!values.includes(raw as TValue)) {
    throw new Error(`Invalid ${key} value: expected one of ${values.join(", ")}`);
  }
  return raw as TValue;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): ServiceConfig {
  const config: ServiceConfig = {
    serviceName: "command-api",
    environment: readEnum(
      env,
      "VECELLS_ENVIRONMENT",
      ["local", "test", "ci", "staging", "production"] as const,
      "local",
    ),
    logLevel: readEnum(
      env,
      "COMMAND_API_LOG_LEVEL",
      ["debug", "info", "warn", "error"] as const,
      "info",
    ),
    serviceHost: readStringFromKeys(
      env,
      ["COMMAND_API_SERVICE_HOST", "COMMAND_API_HOST", "HOST"],
      "127.0.0.1",
    ),
    servicePort: readNumberFromKeys(
      env,
      ["COMMAND_API_SERVICE_PORT", "COMMAND_API_PORT", "PORT"],
      7101,
      0,
    ),
    adminHost: readStringFromKeys(env, ["COMMAND_API_ADMIN_HOST"], "127.0.0.1"),
    adminPort: readNumber(env, "COMMAND_API_ADMIN_PORT", 7201, 0),
    maxPayloadBytes: readNumber(env, "COMMAND_API_MAX_PAYLOAD_BYTES", 65536, 1),
    gracefulShutdownMs: readNumber(env, "COMMAND_API_GRACEFUL_SHUTDOWN_MS", 5000, 1),
    otelEnabled: readBoolean(env, "COMMAND_API_ENABLE_OTEL", false),
    secretRefs: SERVICE_SECRET_REFS,
    idempotencyTtlSeconds: readNumber(env, "COMMAND_API_IDEMPOTENCY_TTL_SECONDS", 900, 30),
    outboxTopic: readString(env, "COMMAND_API_OUTBOX_TOPIC", "command.outbox.pending"),
    mutationGateMode: readEnum(
      env,
      "COMMAND_API_MUTATION_GATE_MODE",
      ["observe", "enforce", "named_review"] as const,
      "named_review",
    ),
    routeIntentMode: readEnum(
      env,
      "COMMAND_API_ROUTE_INTENT_MODE",
      ["required", "warn", "disabled"] as const,
      "required",
    ),
  };

  if (config.servicePort == config.adminPort && config.servicePort !== 0) {
    throw new Error("Service and admin ports must remain distinct");
  }

  return config;
}

export function redactConfig(config: ServiceConfig): Record<string, unknown> {
  return {
    serviceName: config.serviceName,
    environment: config.environment,
    logLevel: config.logLevel,
    serviceHost: config.serviceHost,
    servicePort: config.servicePort,
    adminHost: config.adminHost,
    adminPort: config.adminPort,
    maxPayloadBytes: config.maxPayloadBytes,
    gracefulShutdownMs: config.gracefulShutdownMs,
    otelEnabled: config.otelEnabled,
    secretRefs: [...config.secretRefs],
    idempotencyTtlSeconds: config.idempotencyTtlSeconds,
    outboxTopic: config.outboxTopic,
    mutationGateMode: config.mutationGateMode,
    routeIntentMode: config.routeIntentMode,
  };
}
