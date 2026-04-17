export type ServiceEnvironment = "local" | "test" | "ci" | "staging" | "production";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ServiceConfig {
  serviceName: "api-gateway";
  environment: ServiceEnvironment;
  logLevel: LogLevel;
  servicePort: number;
  adminPort: number;
  maxPayloadBytes: number;
  gracefulShutdownMs: number;
  otelEnabled: boolean;
  secretRefs: readonly string[];
  rateLimitPerMinute: number;
  authEdgeMode: "simulator" | "watch" | "hybrid";
  routeFreezeMode: "observe" | "enforce";
}

const SERVICE_SECRET_REFS = ["AUTH_EDGE_SESSION_SECRET_REF", "AUTH_EDGE_SIGNING_KEY_REF"] as const;

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
    serviceName: "api-gateway",
    environment: readEnum(
      env,
      "VECELLS_ENVIRONMENT",
      ["local", "test", "ci", "staging", "production"] as const,
      "local",
    ),
    logLevel: readEnum(
      env,
      "API_GATEWAY_LOG_LEVEL",
      ["debug", "info", "warn", "error"] as const,
      "info",
    ),
    servicePort: readNumberFromKeys(env, ["API_GATEWAY_SERVICE_PORT", "API_GATEWAY_PORT"], 7100, 0),
    adminPort: readNumber(env, "API_GATEWAY_ADMIN_PORT", 7200, 0),
    maxPayloadBytes: readNumber(env, "API_GATEWAY_MAX_PAYLOAD_BYTES", 65536, 1),
    gracefulShutdownMs: readNumber(env, "API_GATEWAY_GRACEFUL_SHUTDOWN_MS", 5000, 1),
    otelEnabled: readBoolean(env, "API_GATEWAY_ENABLE_OTEL", false),
    secretRefs: SERVICE_SECRET_REFS,
    rateLimitPerMinute: readNumber(env, "API_GATEWAY_RATE_LIMIT_PER_MINUTE", 180, 1),
    authEdgeMode: readEnum(
      env,
      "API_GATEWAY_AUTH_EDGE_MODE",
      ["simulator", "watch", "hybrid"] as const,
      "hybrid",
    ),
    routeFreezeMode: readEnum(
      env,
      "API_GATEWAY_ROUTE_FREEZE_MODE",
      ["observe", "enforce"] as const,
      "observe",
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
    servicePort: config.servicePort,
    adminPort: config.adminPort,
    maxPayloadBytes: config.maxPayloadBytes,
    gracefulShutdownMs: config.gracefulShutdownMs,
    otelEnabled: config.otelEnabled,
    secretRefs: [...config.secretRefs],
    rateLimitPerMinute: config.rateLimitPerMinute,
    authEdgeMode: config.authEdgeMode,
    routeFreezeMode: config.routeFreezeMode,
  };
}
