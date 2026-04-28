import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..", "..");
export const APP_DIR = path.join(ROOT, "apps", "patient-web");
export const OUTPUT_DIR = path.join(ROOT, "output", "playwright");
export const ATLAS_PATH = "/docs/frontend/293_patient_booking_workspace_atlas.html";

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
      // retry until ready
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

export async function startPatientWeb(): Promise<{ child: ChildProcess; baseUrl: string }> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
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
      await waitForHttp(`${baseUrl}/bookings/booking_case_293_live`);
      return { child, baseUrl };
    } catch (error) {
      lastError = new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
      child.kill("SIGTERM");
      await wait(200);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Patient web failed to start.");
}

export async function stopPatientWeb(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".mmd")) return "text/plain; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export async function startStaticServer(atlasPath = ATLAS_PATH): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? atlasPath : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
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
    atlasUrl: `http://127.0.0.1:${port}${atlasPath}`,
  };
}

export async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export function trackExternalRequests(page: any, baseOrigin: string, externalRequests: Set<string>): void {
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

export async function openBookingRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "load" });
  await page.locator("[data-testid='Patient_Booking_Workspace_Route']").waitFor();
}

export async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
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
      "[aria-label]",
      "[data-testid]",
      "[data-anchor-ref]",
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || null,
      ariaLabel: node.getAttribute("aria-label") || null,
      testId: node.getAttribute("data-testid") || null,
      anchorRef: node.getAttribute("data-anchor-ref") || null,
      text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 160),
    }));
  });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2), "utf-8");
}
