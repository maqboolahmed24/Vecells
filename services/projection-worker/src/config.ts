export type ServiceEnvironment = "local" | "test" | "ci" | "staging" | "production";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ServiceConfig {
  serviceName: "projection-worker";
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
  consumerBatchSize: number;
  freshnessBudgetSeconds: number;
  deadLetterTopic: string;
  rebuildWindowMode: "scheduled" | "operator_only";
  poisonRetryLimit: number;
}

const SERVICE_SECRET_REFS = [
  "PROJECTION_CURSOR_STORE_REF",
  "PROJECTION_DEAD_LETTER_STORE_REF",
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
    serviceName: "projection-worker",
    environment: readEnum(
      env,
      "VECELLS_ENVIRONMENT",
      ["local", "test", "ci", "staging", "production"] as const,
      "local",
    ),
    logLevel: readEnum(
      env,
      "PROJECTION_WORKER_LOG_LEVEL",
      ["debug", "info", "warn", "error"] as const,
      "info",
    ),
    serviceHost: readStringFromKeys(
      env,
      ["PROJECTION_WORKER_SERVICE_HOST", "PROJECTION_WORKER_HOST", "HOST"],
      "127.0.0.1",
    ),
    servicePort: readNumberFromKeys(
      env,
      ["PROJECTION_WORKER_SERVICE_PORT", "PROJECTION_WORKER_PORT", "PORT"],
      7102,
      0,
    ),
    adminHost: readStringFromKeys(env, ["PROJECTION_WORKER_ADMIN_HOST"], "127.0.0.1"),
    adminPort: readNumber(env, "PROJECTION_WORKER_ADMIN_PORT", 7202, 0),
    maxPayloadBytes: readNumber(env, "PROJECTION_WORKER_MAX_PAYLOAD_BYTES", 65536, 1),
    gracefulShutdownMs: readNumber(env, "PROJECTION_WORKER_GRACEFUL_SHUTDOWN_MS", 5000, 1),
    otelEnabled: readBoolean(env, "PROJECTION_WORKER_ENABLE_OTEL", false),
    secretRefs: SERVICE_SECRET_REFS,
    consumerBatchSize: readNumber(env, "PROJECTION_WORKER_CONSUMER_BATCH_SIZE", 25, 1),
    freshnessBudgetSeconds: readNumber(env, "PROJECTION_WORKER_FRESHNESS_BUDGET_SECONDS", 45, 1),
    deadLetterTopic: readString(
      env,
      "PROJECTION_WORKER_DEAD_LETTER_TOPIC",
      "projection.dead-lettered",
    ),
    rebuildWindowMode: readEnum(
      env,
      "PROJECTION_WORKER_REBUILD_WINDOW_MODE",
      ["scheduled", "operator_only"] as const,
      "scheduled",
    ),
    poisonRetryLimit: readNumber(env, "PROJECTION_WORKER_POISON_RETRY_LIMIT", 3, 1),
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
    consumerBatchSize: config.consumerBatchSize,
    freshnessBudgetSeconds: config.freshnessBudgetSeconds,
    deadLetterTopic: config.deadLetterTopic,
    rebuildWindowMode: config.rebuildWindowMode,
    poisonRetryLimit: config.poisonRetryLimit,
  };
}
