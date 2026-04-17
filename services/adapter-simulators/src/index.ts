import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shellSurfaceContracts } from "@vecells/api-contracts";
import { foundationFhirMappings } from "@vecells/fhir-mapping";
import { foundationFixtureCatalog } from "@vecells/test-fixtures";
import { createSimulatorBackplaneRuntime } from "./backplane";

export { createSimulatorBackplaneRuntime } from "./backplane";
export { createAttachmentScanSimulator, attachmentScanScenarios } from "./attachment-scan-simulator";
export { createSimulatorSdk } from "./sdk-clients";
export type { AttachmentScanScenarioId } from "./attachment-scan-simulator";
export type {
  FailureMode,
  RuntimeStateSnapshot,
  SimulatorDeckSnapshot,
  SimulatorFamilyCode,
} from "./backplane";

const port = Number(process.env.PORT ?? "7104");

const scaffold = {
  service: "adapter-simulators",
  ownerContext: "platform_integration",
  note: "Simulator control surface serves deterministic manifest, fixture posture, and HTTP backplane routes.",
  contractCount: Object.keys(shellSurfaceContracts).length,
  mappings: foundationFhirMappings,
  fixtures: foundationFixtureCatalog,
} as const;

function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response: http.ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

export function createSimulatorBackplaneServer(options?: {
  readonly rootDir?: string;
}): http.Server {
  const runtime = createSimulatorBackplaneRuntime(options);

  return http.createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = request.url ?? "/";

    try {
      if (method === "GET" && url === "/health") {
        sendJson(response, 200, { ok: true, service: scaffold.service, port });
        return;
      }
      if (method === "GET" && url === "/simulators") {
        sendJson(response, 200, scaffold);
        return;
      }
      if (method === "GET" && url === "/api/control/deck") {
        sendJson(response, 200, runtime.getDeckSnapshot());
        return;
      }
      if (method === "GET" && url === "/api/state") {
        sendJson(response, 200, runtime.getStateSnapshot());
        return;
      }

      const body =
        method === "POST" ? ((await readJsonBody(request)) as Record<string, unknown>) : {};

      switch (`${method} ${url}`) {
        case "POST /api/control/start":
          sendJson(response, 200, runtime.start(body.family as never));
          return;
        case "POST /api/control/stop":
          sendJson(response, 200, runtime.stop(body.family as never));
          return;
        case "POST /api/control/reset":
          sendJson(response, 200, runtime.reset());
          return;
        case "POST /api/control/reseed":
          sendJson(response, 200, runtime.reseed(body.seedId as string | undefined));
          return;
        case "POST /api/control/failure-mode":
          sendJson(
            response,
            200,
            runtime.setFailureMode(body.family as never, body.failureMode as never),
          );
          return;
        case "POST /api/nhs-login/begin":
          sendJson(response, 200, runtime.beginAuthFlow(body as never));
          return;
        case "POST /api/nhs-login/callback":
          sendJson(response, 200, runtime.deliverAuthCallback(body.authSessionRef as string));
          return;
        case "POST /api/nhs-login/replay":
          sendJson(response, 200, runtime.replayAuthCallback(body.authSessionRef as string));
          return;
        case "POST /api/nhs-login/token":
          sendJson(response, 200, runtime.redeemAuthCode(body as never));
          return;
        case "POST /api/im1/search":
          sendJson(response, 200, runtime.searchIm1Slots(body as never));
          return;
        case "POST /api/im1/hold":
          sendJson(response, 200, runtime.holdIm1Slot(body as never));
          return;
        case "POST /api/im1/commit":
          sendJson(response, 200, runtime.commitIm1Booking(body as never));
          return;
        case "POST /api/im1/manage":
          sendJson(response, 200, runtime.manageIm1Appointment(body as never));
          return;
        case "POST /api/mesh/dispatch":
          sendJson(response, 200, runtime.dispatchMeshMessage(body as never));
          return;
        case "POST /api/mesh/poll":
          sendJson(response, 200, runtime.pollMeshMailbox(body.mailboxKey as string));
          return;
        case "POST /api/mesh/ack":
          sendJson(response, 200, runtime.acknowledgeMeshMessage(body.messageRef as string));
          return;
        case "POST /api/telephony/start":
          sendJson(response, 200, runtime.startTelephonyCall(body as never));
          return;
        case "POST /api/telephony/advance":
          sendJson(response, 200, runtime.advanceTelephonyCall(body.callRef as string));
          return;
        case "POST /api/telephony/webhook":
          sendJson(response, 200, runtime.emitTelephonyWebhook(body.callRef as string));
          return;
        case "POST /api/telephony/retry-webhook":
          sendJson(response, 200, runtime.retryTelephonyWebhook(body.callRef as string));
          return;
        case "POST /api/notifications/send":
          sendJson(response, 200, runtime.sendNotification(body as never));
          return;
        case "POST /api/notifications/webhook":
          sendJson(response, 200, runtime.emitNotificationWebhook(body.messageRef as string));
          return;
        case "POST /api/notifications/repair":
          sendJson(response, 200, runtime.repairNotification(body.messageRef as string));
          return;
        case "POST /api/notifications/settle":
          sendJson(response, 200, runtime.settleNotification(body.messageRef as string));
          return;
        default:
          sendJson(response, 404, {
            error: "route_not_found",
            message: `No simulator route for ${method} ${url}`,
          });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown simulator error";
      sendJson(response, 400, { error: "simulator_request_failed", message });
    }
  });
}

function main(): void {
  const server = createSimulatorBackplaneServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`[${scaffold.service}] simulator service listening on http://127.0.0.1:${port}`);
  });
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  main();
}
