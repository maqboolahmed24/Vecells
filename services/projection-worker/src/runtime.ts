import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import {
  advanceCorrelationHop,
  mintEdgeCorrelation,
  readCorrelationFromHeaders,
  serializeCorrelationHeaders,
  type EdgeCorrelationContext,
} from "@vecells/observability";
import { redactConfig, type ServiceConfig } from "./config";
import {
  buildWorkloadResponse,
  serviceDefinition,
  type ServiceRouteDefinition,
  type WorkloadRequestContext,
} from "./service-definition";

interface LogFields {
  [key: string]: unknown;
}

export interface StructuredLogger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export interface RuntimePorts {
  service: number;
  admin: number;
}

export interface ReadinessState {
  name: string;
  detail: string;
  failureMode: string;
  status: "ready";
}

export interface ServiceRuntime {
  readonly definition: typeof serviceDefinition;
  readonly config: ServiceConfig;
  readonly logger: StructuredLogger;
  readonly readiness: ReadinessState[];
  readonly ports: RuntimePorts;
  start(): Promise<void>;
  stop(): Promise<void>;
}

function createLogger(config: ServiceConfig): StructuredLogger {
  const emit = (level: string, event: string, fields: LogFields = {}): void => {
    console.log(
      JSON.stringify({
        level,
        event,
        service: config.serviceName,
        environment: config.environment,
        otelHook: config.otelEnabled ? "stubbed_http_span_emitter" : "disabled",
        ...fields,
      }),
    );
  };

  return {
    info(event: string, fields?: LogFields) {
      emit("info", event, fields);
    },
    warn(event: string, fields?: LogFields) {
      emit("warn", event, fields);
    },
    error(event: string, fields?: LogFields) {
      emit("error", event, fields);
    },
  };
}

function normalizeHeaders(request: IncomingMessage): Record<string, string> {
  const pairs = Object.entries(request.headers).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.join(",")] as const;
    }
    return [key, value ?? ""] as const;
  });
  return Object.fromEntries(pairs);
}

function resolveCorrelationId(headers: Record<string, string>): string {
  return headers["x-correlation-id"] || headers["x-request-id"] || randomUUID();
}

function resolveTraceId(headers: Record<string, string>, correlationId: string): string {
  return headers["x-trace-id"] || correlationId;
}

function resolveRuntimeHopKind(): "gateway" | "command_handler" | "worker" {
  const workloadFamily = serviceDefinition.workloadFamily as string;
  if (workloadFamily === "gateway_ingress") {
    return "gateway";
  }
  if (workloadFamily === "mutation_command_ingress") {
    return "command_handler";
  }
  return "worker";
}

function buildEdgeCorrelation(
  headers: Record<string, string>,
  method: string,
  pathname: string,
  config: ServiceConfig,
): EdgeCorrelationContext {
  const emittedAt = new Date().toISOString();
  const hopKind = resolveRuntimeHopKind();

  if (hopKind === "gateway") {
    const incoming = readCorrelationFromHeaders(headers);
    if (incoming) {
      return advanceCorrelationHop(incoming, {
        hopKind,
        serviceRef: serviceDefinition.service,
        environment: config.environment,
        emittedAt,
        requestMethod: method,
        requestPath: pathname,
      });
    }
    return mintEdgeCorrelation({
      environment: config.environment,
      serviceRef: serviceDefinition.service,
      hopKind,
      requestMethod: method,
      requestPath: pathname,
      issuedAt: emittedAt,
    });
  }

  const incoming = readCorrelationFromHeaders(headers, { requireContext: true });
  if (!incoming) {
    throw new Error("EDGE_CORRELATION_CONTEXT_REQUIRED");
  }
  return advanceCorrelationHop(incoming, {
    hopKind,
    serviceRef: serviceDefinition.service,
    environment: config.environment,
    emittedAt,
    requestMethod: method,
    requestPath: pathname,
  });
}

async function readRequestBody(
  request: IncomingMessage,
  maxPayloadBytes: number,
): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxPayloadBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("INVALID_JSON_BODY");
  }
}

function respondJson(
  response: ServerResponse,
  statusCode: number,
  correlationId: string,
  traceId: string,
  edgeCorrelation: EdgeCorrelationContext | undefined,
  body: unknown,
): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-correlation-id": correlationId,
    "x-trace-id": traceId,
    ...(edgeCorrelation ? serializeCorrelationHeaders(edgeCorrelation) : {}),
  });
  response.end(JSON.stringify(body));
}

function matchRoute(method: string, pathname: string): ServiceRouteDefinition | undefined {
  return serviceDefinition.routeCatalog.find(
    (route) => route.method === method && route.path === pathname,
  );
}

function listen(server: http.Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
}

function getBoundPort(server: http.Server): number {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server address unavailable");
  }
  return address.port;
}

function closeServer(server: http.Server, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Server close exceeded ${timeoutMs}ms`));
    }, timeoutMs);
    server.close((error) => {
      clearTimeout(timer);
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export function createRuntime(config: ServiceConfig): ServiceRuntime {
  const logger = createLogger(config);
  const readiness: ReadinessState[] = serviceDefinition.readinessChecks.map((check) => ({
    name: check.name,
    detail: check.detail,
    failureMode: check.failureMode,
    status: "ready",
  }));

  let serviceServer: http.Server | undefined;
  let adminServer: http.Server | undefined;
  const ports: RuntimePorts = {
    service: config.servicePort,
    admin: config.adminPort,
  };

  const runtime: ServiceRuntime = {
    definition: serviceDefinition,
    config,
    logger,
    readiness,
    ports,
    async start(): Promise<void> {
      if (serviceServer || adminServer) {
        return;
      }

      serviceServer = http.createServer(async (request, response) => {
        const method = request.method?.toUpperCase() ?? "GET";
        const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
        const headers = normalizeHeaders(request);
        const correlationId = resolveCorrelationId(headers);
        const traceId = resolveTraceId(headers, correlationId);
        const route = matchRoute(method, pathname);

        if (!route) {
          respondJson(response, 404, correlationId, traceId, undefined, {
            ok: false,
            error: "ROUTE_NOT_FOUND",
            availableRoutes: serviceDefinition.routeCatalog.map((item) => ({
              method: item.method,
              path: item.path,
            })),
          });
          return;
        }

        const edgeCorrelation = buildEdgeCorrelation(headers, method, pathname, config);

        if (route.idempotencyRequired && !headers["idempotency-key"]) {
          respondJson(response, 400, correlationId, traceId, edgeCorrelation, {
            ok: false,
            error: "IDEMPOTENCY_KEY_REQUIRED",
            routeId: route.routeId,
          });
          return;
        }

        try {
          const requestBody = await readRequestBody(request, config.maxPayloadBytes);
          if (route.bodyRequired && requestBody === undefined) {
            respondJson(response, 400, correlationId, traceId, edgeCorrelation, {
              ok: false,
              error: "REQUEST_BODY_REQUIRED",
              routeId: route.routeId,
            });
            return;
          }

          const context: WorkloadRequestContext = {
            correlationId,
            traceId,
            config,
            headers,
            requestBody,
            readiness,
          };

          const payload = buildWorkloadResponse(route, context);
          logger.info("service_request_completed", {
            routeId: route.routeId,
            correlationId,
            traceId,
            edgeCorrelationId: edgeCorrelation.edgeCorrelationId,
            causalToken: edgeCorrelation.causalToken,
            statusCode: payload.statusCode,
          });
          respondJson(
            response,
            payload.statusCode,
            correlationId,
            traceId,
            edgeCorrelation,
            payload.body,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
          const statusCode = message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
          logger.warn("service_request_rejected", {
            routeId: route.routeId,
            correlationId,
            traceId,
            error: message,
          });
          respondJson(response, statusCode, correlationId, traceId, undefined, {
            ok: false,
            error: message,
            routeId: route.routeId,
          });
        }
      });

      adminServer = http.createServer((request, response) => {
        const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
        const headers = normalizeHeaders(request);
        const correlationId = resolveCorrelationId(headers);
        const traceId = resolveTraceId(headers, correlationId);

        if (pathname === "/health") {
          respondJson(response, 200, correlationId, traceId, undefined, {
            ok: true,
            service: serviceDefinition.service,
            workloadFamily: serviceDefinition.workloadFamily,
            ports,
            uptimeSeconds: Math.floor(process.uptime()),
          });
          return;
        }

        if (pathname === "/ready") {
          respondJson(response, 200, correlationId, traceId, undefined, {
            ok: readiness.every((item) => item.status === "ready"),
            service: serviceDefinition.service,
            readiness,
          });
          return;
        }

        if (pathname === "/manifest") {
          respondJson(response, 200, correlationId, traceId, undefined, {
            definition: serviceDefinition,
            config: redactConfig(config),
          });
          return;
        }

        respondJson(response, 404, correlationId, traceId, undefined, {
          ok: false,
          error: "ADMIN_ROUTE_NOT_FOUND",
          adminRoutes: serviceDefinition.adminRoutes,
        });
      });

      await Promise.all([
        listen(serviceServer, config.servicePort, config.serviceHost),
        listen(adminServer, config.adminPort, config.adminHost),
      ]);
      ports.service = getBoundPort(serviceServer);
      ports.admin = getBoundPort(adminServer);

      logger.info("service_runtime_started", {
        serviceHost: config.serviceHost,
        servicePort: ports.service,
        adminHost: config.adminHost,
        adminPort: ports.admin,
        routeCount: serviceDefinition.routeCatalog.length,
      });
    },
    async stop(): Promise<void> {
      const closers: Promise<void>[] = [];
      if (serviceServer) {
        closers.push(closeServer(serviceServer, config.gracefulShutdownMs));
      }
      if (adminServer) {
        closers.push(closeServer(adminServer, config.gracefulShutdownMs));
      }
      await Promise.all(closers);
      serviceServer = undefined;
      adminServer = undefined;
      logger.info("service_runtime_stopped", {
        serviceHost: config.serviceHost,
        servicePort: ports.service,
        adminHost: config.adminHost,
        adminPort: ports.admin,
      });
    },
  };

  return runtime;
}
