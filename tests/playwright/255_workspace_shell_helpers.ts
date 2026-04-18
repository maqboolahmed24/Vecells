import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, "..", "..");
export const APP_DIR = path.join(ROOT, "apps", "clinical-workspace");
export const OUTPUT_DIR = path.join(ROOT, "output", "playwright");
export const ATLAS_PATH = "/docs/frontend/255_workspace_shell_atlas.html";

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

export async function allocatePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForHttp(url: string, timeoutMs = 20_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export function ensureOutputDir(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function outputPath(name: string): string {
  ensureOutputDir();
  return path.join(OUTPUT_DIR, name);
}

export async function startStaticServer(): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? ATLAS_PATH : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const contentType = filePath.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });
  return {
    server,
    atlasUrl: `http://127.0.0.1:${port}${ATLAS_PATH}`,
  };
}

export async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

export async function startClinicalWorkspace(): Promise<{ child: ChildProcess; baseUrl: string }> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/workspace`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Clinical workspace failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, baseUrl };
}

export async function stopClinicalWorkspace(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

export function trackExternalRequests(page: any, baseOrigin: string, externalRequests: Set<string>): void {
  page.on("request", (request: any) => {
    const requestUrl = request.url();
    if (!requestUrl.startsWith(baseOrigin) && !requestUrl.startsWith("data:") && !requestUrl.startsWith("about:")) {
      externalRequests.add(requestUrl);
    }
  });
}

export async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

export async function openWorkspaceRoute(page: any, url: string, testId: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("[data-testid='WorkspaceShellRouteFamily']").waitFor();
  await page.locator(`[data-testid='${testId}']`).waitFor();
}

export async function writeAccessibilitySnapshot(page: any, fileName: string): Promise<void> {
  const snapshot = await page.evaluate(() => {
    const selectors = [
      "header",
      "nav",
      "main",
      "aside",
      "section",
      "button",
      "[role='listbox']",
      "[role='option']",
      "[aria-label]",
      "[aria-selected]",
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || null,
      ariaLabel: node.getAttribute("aria-label") || null,
      ariaSelected: node.getAttribute("aria-selected") || null,
      testId: node.getAttribute("data-testid") || null,
      text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 180),
    }));
  });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2));
}
