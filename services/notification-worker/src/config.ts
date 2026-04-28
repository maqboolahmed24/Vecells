export type ServiceEnvironment = "local" | "test" | "ci" | "staging" | "production";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ServiceConfig {
  serviceName: "notification-worker";
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
  dispatchBatchSize: number;
  providerMode: "simulator" | "shadow" | "hybrid";
  callbackSettlementWindowSeconds: number;
  resendGuardMode: "manual_review" | "cooldown_only";
}

const SERVICE_SECRET_REFS = [
  "NOTIFICATION_PROVIDER_SECRET_REF",
  "NOTIFICATION_WEBHOOK_SECRET_REF",
  "NOTIFICATION_SIGNING_KEY_REF",
] as const;

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
    serviceName: "notification-worker",
    environment: readEnum(
      env,
      "VECELLS_ENVIRONMENT",
      ["local", "test", "ci", "staging", "production"] as const,
      "local",
    ),
    logLevel: readEnum(
      env,
      "NOTIFICATION_WORKER_LOG_LEVEL",
      ["debug", "info", "warn", "error"] as const,
      "info",
    ),
    serviceHost: readStringFromKeys(
      env,
      ["NOTIFICATION_WORKER_SERVICE_HOST", "NOTIFICATION_WORKER_HOST", "HOST"],
      "127.0.0.1",
    ),
    servicePort: readNumberFromKeys(
      env,
      ["NOTIFICATION_WORKER_SERVICE_PORT", "NOTIFICATION_WORKER_PORT", "PORT"],
      7103,
      0,
    ),
    adminHost: readStringFromKeys(env, ["NOTIFICATION_WORKER_ADMIN_HOST"], "127.0.0.1"),
    adminPort: readNumber(env, "NOTIFICATION_WORKER_ADMIN_PORT", 7203, 0),
    maxPayloadBytes: readNumber(env, "NOTIFICATION_WORKER_MAX_PAYLOAD_BYTES", 65536, 1),
    gracefulShutdownMs: readNumber(env, "NOTIFICATION_WORKER_GRACEFUL_SHUTDOWN_MS", 5000, 1),
    otelEnabled: readBoolean(env, "NOTIFICATION_WORKER_ENABLE_OTEL", false),
    secretRefs: SERVICE_SECRET_REFS,
    dispatchBatchSize: readNumber(env, "NOTIFICATION_WORKER_DISPATCH_BATCH_SIZE", 50, 1),
    providerMode: readEnum(
      env,
      "NOTIFICATION_WORKER_PROVIDER_MODE",
      ["simulator", "shadow", "hybrid"] as const,
      "simulator",
    ),
    callbackSettlementWindowSeconds: readNumber(
      env,
      "NOTIFICATION_WORKER_CALLBACK_SETTLEMENT_WINDOW_SECONDS",
      300,
      1,
    ),
    resendGuardMode: readEnum(
      env,
      "NOTIFICATION_WORKER_RESEND_GUARD_MODE",
      ["manual_review", "cooldown_only"] as const,
      "manual_review",
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
    dispatchBatchSize: config.dispatchBatchSize,
    providerMode: config.providerMode,
    callbackSettlementWindowSeconds: config.callbackSettlementWindowSeconds,
    resendGuardMode: config.resendGuardMode,
  };
}
