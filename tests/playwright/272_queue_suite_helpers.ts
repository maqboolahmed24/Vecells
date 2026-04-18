import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  ROOT,
  allocatePort,
  assertCondition,
  ensureOutputDir,
  importPlaywright,
  outputPath,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const QUEUE_FAIRNESS_LAB_PATH = "/docs/frontend/272_queue_fairness_recovery_lab.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (filePath.endsWith(".csv")) {
    return "text/csv; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "text/plain; charset=utf-8";
}

export async function startQueueFairnessLabServer(): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/" ? QUEUE_FAIRNESS_LAB_PATH : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);

    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    server,
    atlasUrl: `http://127.0.0.1:${port}${QUEUE_FAIRNESS_LAB_PATH}`,
  };
}

export async function stopQueueFairnessLabServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

export async function openQueueFairnessScenario(page: any, atlasUrl: string, scenarioId: string): Promise<void> {
  await page.goto(`${atlasUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-testid='QueueFairnessRecoveryLab']").waitFor();
  await page.locator("[data-testid='RankReplayWorkbench']").waitFor();
  await page.waitForFunction(
    (targetScenarioId) =>
      document.querySelector("[data-testid='QueueFairnessRecoveryLab']")?.getAttribute("data-selected-scenario-id") ===
      targetScenarioId,
    scenarioId,
  );
}

export async function takeQueueLabTrace(context: any, fileName: string): Promise<void> {
  ensureOutputDir();
  await context.tracing.stop({ path: outputPath(fileName) });
}

export {
  assertCondition,
  importPlaywright,
  outputPath,
  writeAccessibilitySnapshot,
};
