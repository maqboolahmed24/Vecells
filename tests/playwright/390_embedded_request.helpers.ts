import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

export const ROOT = "/Users/test/Code/V";
export const APP_DIR = path.join(ROOT, "apps", "patient-web");
export const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export type EmbeddedRequestView = "status" | "more-info" | "callback" | "messages" | "recovery";

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) return null;
    throw error;
  }
}

function canUsePort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function allocatePort(start = 5190 + (process.pid % 500)): Promise<number> {
  for (let port = start; port < start + 200; port += 1) {
    if (await canUsePort(port)) return port;
  }
  throw new Error("No free localhost port found for 390 patient-web Playwright test.");
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url: string, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

export async function startPatientWeb(): Promise<{ child: ChildProcess; baseUrl: string }> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: APP_DIR,
      env: { ...process.env, BROWSER: "none", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/nhs-app/requests/request_211_a/status?fixture=status`);
    return { child, baseUrl };
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`patient-web failed to start for 390.\n${logs.join("")}`, { cause: error });
  }
}

export async function stopPatientWeb(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

export function outputPath(fileName: string): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return path.join(OUTPUT_DIR, fileName);
}

export function embeddedRequestUrl(
  baseUrl: string,
  options: {
    readonly requestRef?: string;
    readonly view?: EmbeddedRequestView;
    readonly query?: string;
  } = {},
): string {
  const requestRef = options.requestRef ?? "request_211_a";
  const view = options.view ?? "status";
  const query = options.query ? `?${options.query.replace(/^\?/, "")}` : "";
  return `${baseUrl}/nhs-app/requests/${requestRef}/${view}${query}`;
}

export async function openEmbeddedRequest(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "load" });
  await page.getByTestId("EmbeddedRequestStatusFrame").waitFor();
  await assertRootContract(page);
}

export async function assertRootContract(page: any): Promise<void> {
  const root = page.getByTestId("EmbeddedRequestStatusFrame");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "NHSApp_Embedded_Request_Status",
    "embedded request status visual mode missing",
  );
  assertCondition(Boolean(await root.getAttribute("data-selected-anchor")), "selected anchor missing");
}

export async function clickPrimary(page: any): Promise<void> {
  await page.getByTestId("EmbeddedRequestActionReserve").locator("button").first().click();
}

export async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assertCondition(
    metrics.scrollWidth <= metrics.clientWidth + 2 && metrics.bodyScrollWidth <= metrics.clientWidth + 2,
    `${label} overflowed horizontally: ${JSON.stringify(metrics)}`,
  );
}

export async function writeAriaSnapshot(locator: any, fileName: string): Promise<string> {
  const snapshot =
    typeof locator.ariaSnapshot === "function"
      ? await locator.ariaSnapshot()
      : JSON.stringify(await locator.page().accessibility.snapshot({ root: await locator.elementHandle() }));
  fs.writeFileSync(outputPath(fileName), String(snapshot), "utf8");
  return String(snapshot);
}
