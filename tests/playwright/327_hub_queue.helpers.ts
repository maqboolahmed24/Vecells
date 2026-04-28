import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

import {
  ROOT,
  allocatePort,
  assertCondition,
  importPlaywright,
  outputPath,
  waitForHttp,
} from "./255_workspace_shell_helpers";

const APP_DIR = path.join(ROOT, "apps", "hub-desk");
const ATLAS_PATH = "/docs/frontend/327_hub_queue_candidate_ranking_and_sla_atlas.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export { assertCondition, importPlaywright, outputPath };

export async function startHubDesk(): Promise<{ child: ChildProcess; baseUrl: string }> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: APP_DIR,
      env: { ...process.env, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/hub/queue`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`hub-desk failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl };
}

export async function stopHubDesk(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

export async function openHubRoute(page: any, url: string, routeTestId?: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("[data-testid='hub-shell-root']").waitFor();
  if (routeTestId) {
    await page.locator(`[data-testid='${routeTestId}']`).waitFor();
  }
}

export async function waitForHubRootState(
  page: any,
  expected: Partial<{
    currentPath: string;
    viewMode: string;
    shellStatus: string;
    savedViewId: string;
    selectedCaseId: string;
    layoutMode: string;
    routeFamily: string;
  }>,
): Promise<void> {
  await page.waitForFunction((assertion) => {
    const root = document.querySelector("[data-testid='hub-shell-root']");
    if (!root) return false;
    const element = root as HTMLElement;
    return Object.entries(assertion).every(([key, value]) => {
      if (value == null) {
        return true;
      }
      switch (key) {
        case "currentPath":
          return element.getAttribute("data-current-path") === value;
        case "viewMode":
          return element.getAttribute("data-view-mode") === value;
        case "shellStatus":
          return element.getAttribute("data-shell-status") === value;
        case "savedViewId":
          return element.getAttribute("data-saved-view-id") === value;
        case "selectedCaseId":
          return element.getAttribute("data-selected-case-id") === value;
        case "layoutMode":
          return element.getAttribute("data-layout-mode") === value;
        case "routeFamily":
          return element.getAttribute("data-hub-route-family") === value;
        default:
          return true;
      }
    });
  }, expected);
}

export async function readQueueOrder(page: any): Promise<string[]> {
  return page
    .locator("[data-hub-queue-row]")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).getAttribute("data-hub-queue-row") ?? ""),
    );
}

export function trackExternalRequests(
  page: any,
  baseOrigin: string,
  externalRequests: Set<string>,
): void {
  page.on("request", (request: any) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

export async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

export async function captureAria(locator: any, page: any): Promise<unknown> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "aria snapshot root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

export function writeJsonArtifact(fileName: string, payload: unknown): void {
  fs.writeFileSync(outputPath(fileName), `${JSON.stringify(payload, null, 2)}\n`);
}

export async function startHubAtlasServer(): Promise<{ atlasUrl: string; server: http.Server }> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/" ? ATLAS_PATH : decodeURIComponent(requestUrl.pathname);
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
    atlasUrl: `http://127.0.0.1:${port}${ATLAS_PATH}`,
    server,
  };
}

export async function stopHubAtlasServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function openHubAtlas(page: any, atlasUrl: string): Promise<void> {
  await page.goto(atlasUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='HubQueueWorkbenchAtlas']").waitFor();
}
