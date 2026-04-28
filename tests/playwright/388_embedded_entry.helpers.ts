import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

export const ROOT = "/Users/test/Code/V";
export const APP_DIR = path.join(ROOT, "apps", "patient-web");
export const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export type EntryRouteFamily =
  | "patient_home"
  | "request_status"
  | "appointment_manage"
  | "record_letter_summary"
  | "patient_message_thread";

export type EntryParam =
  | "landing"
  | "opening"
  | "confirming"
  | "success"
  | "reauth_success"
  | "consent_denied"
  | "expired"
  | "safe_reentry"
  | "wrong_context"
  | "failure";

const RAW_PLUMBING_PATTERNS = [
  { name: "assertedLoginIdentity", pattern: /assertedLoginIdentity/i },
  { name: "asserted_login_identity", pattern: /asserted_login_identity/i },
  { name: "pkce", pattern: /\bpkce\b/i },
  { name: "jwt", pattern: /\bjwt\b/i },
  { name: "oidc", pattern: /\boidc\b/i },
  { name: "nonce", pattern: /\bnonce\b/i },
  { name: "state", pattern: /\bstate\b/i },
  { name: "token", pattern: /\btoken\b/i },
  { name: "ConsentNotGiven", pattern: /ConsentNotGiven/i },
] as const;

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

function canUsePort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function allocatePort(start = 4988 + (process.pid % 500)): Promise<number> {
  for (let port = start; port < start + 200; port += 1) {
    if (await canUsePort(port)) return port;
  }
  throw new Error("No free localhost port found for 388 patient-web Playwright test.");
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
    await waitForHttp(`${baseUrl}/nhs-app/entry?entry=landing&route=request_status&channel=nhs_app`);
    return { child, baseUrl };
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`patient-web failed to start for 388.\n${logs.join("")}`, { cause: error });
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

export function entryUrl(
  baseUrl: string,
  options: {
    readonly entry?: EntryParam;
    readonly route?: EntryRouteFamily;
    readonly rawHandoff?: boolean;
    readonly consentDeclineReturn?: boolean;
  } = {},
): string {
  const params = new URLSearchParams();
  if (options.entry) params.set("entry", options.entry);
  params.set("route", options.route ?? "request_status");
  params.set("channel", "nhs_app");
  if (options.rawHandoff) {
    params.set("assertedLoginIdentity", "redacted-sample-value");
    params.set("asserted_login_identity", "redacted-snake-sample");
    params.set("pkce", "sample-proof");
    params.set("state", "sample-state");
    params.set("nonce", "sample-nonce");
    params.set("token", "sample-token");
  }
  if (options.consentDeclineReturn) {
    params.set("error", "access_denied");
    params.set("error_description", "ConsentNotGiven");
  }
  return `${baseUrl}/nhs-app/entry?${params.toString()}`;
}

export async function openEntryRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "load" });
  await page.getByTestId("EmbeddedEntryCorridorRoot").waitFor();
  await page.waitForFunction(
    () =>
      !/(assertedLoginIdentity|asserted_login_identity|access_token|id_token|refresh_token|jwt|token|nonce|state|pkce|error_description|error=|ConsentNotGiven)/i.test(
        window.location.href,
      ),
  );
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

export async function assertNoRawPlumbing(
  page: any,
  label: string,
  consoleMessages: readonly string[] = [],
  options: { readonly allowInheritedShellStateText?: boolean } = {},
): Promise<void> {
  const visibleText = await page.locator("body").innerText();
  const automationAnchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid], [data-action-kind], [data-return-disposition], [data-posture]"))
      .map((element) =>
        Array.from(element.attributes)
          .filter((attribute) => attribute.name.startsWith("data-") || attribute.name === "aria-label")
          .map((attribute) => `${attribute.name}=${attribute.value}`)
          .join(" "),
      )
      .join("\n"),
  );
  const url = page.url();
  for (const { name, pattern } of RAW_PLUMBING_PATTERNS) {
    const inheritedShellStateTextAllowed = options.allowInheritedShellStateText && name === "state";
    if (!inheritedShellStateTextAllowed) {
      assertCondition(!pattern.test(visibleText), `${label} leaked raw auth plumbing in visible text: ${pattern}`);
      assertCondition(
        !pattern.test(automationAnchors),
        `${label} leaked raw auth plumbing in automation anchors: ${pattern}`,
      );
    }
    assertCondition(!pattern.test(url), `${label} leaked raw auth plumbing in URL: ${pattern}`);
    assertCondition(
      consoleMessages.every((message) => !pattern.test(message)),
      `${label} leaked raw auth plumbing in console: ${pattern}`,
    );
  }
}

export async function writeAriaSnapshot(locator: any, fileName: string): Promise<string> {
  const snapshot =
    typeof locator.ariaSnapshot === "function"
      ? await locator.ariaSnapshot()
      : JSON.stringify(await locator.page().accessibility.snapshot({ root: await locator.elementHandle() }));
  fs.writeFileSync(outputPath(fileName), String(snapshot), "utf8");
  return String(snapshot);
}
