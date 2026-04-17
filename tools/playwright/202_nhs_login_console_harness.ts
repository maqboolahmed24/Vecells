import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const CONTROL_BOARD = path.join(
  ROOT,
  "docs",
  "frontend",
  "202_nhs_login_config_control_board.html",
);
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "202_nhs_login_client_config_manifest.json",
);
const SELECTORS_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "202_nhs_login_console_selector_manifest.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

type Manifest = {
  readonly manifestVersion: string;
  readonly liveMutationGate: {
    readonly allowLiveMutationFlag: string;
    readonly liveMutationAllowedByDefault: boolean;
    readonly requiredPreconditions: readonly string[];
  };
  readonly environmentSet: readonly {
    readonly environmentId: string;
    readonly providerMutationAllowed: boolean;
  }[];
};

interface StaticServer {
  readonly server: http.Server;
  readonly url: string;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redact(item)]),
    );
  }
  if (typeof value !== "string") {
    return value;
  }
  return value
    .replace(/secret:\/\/[^"'\s]+/g, "secret://[REDACTED]")
    .replace(/client_[A-Za-z0-9_-]+/g, "client_[REDACTED]")
    .replace(/https:\/\/[A-Za-z0-9_.-]+/g, "https://[REDACTED-HOST]")
    .replace(/password[^"'\s]*/gi, "[TEST-USER-CREDENTIAL-REDACTED]")
    .replace(/otp[^"'\s]*/gi, "[TEST-USER-CREDENTIAL-REDACTED]");
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

async function allocatePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function startStaticServer(): Promise<StaticServer> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/202_nhs_login_config_control_board.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    server,
    url: `http://127.0.0.1:${port}/docs/frontend/202_nhs_login_config_control_board.html`,
  };
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openBoard(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='NHS_Login_Config_Control_Board']").waitFor();
}

async function captureSelectorSnapshot(page: Page): Promise<Record<string, string>> {
  const selectors = readJson<{ localTwinSelectors: Record<string, string> }>(SELECTORS_PATH);
  const snapshot: Record<string, string> = {};
  for (const [name, selector] of Object.entries(selectors.localTwinSelectors)) {
    snapshot[name] = String(await page.locator(selector).count());
  }
  return snapshot;
}

function providerMutationAllowed(manifest: Manifest, targetEnvironment: string): boolean {
  const target = manifest.environmentSet.find((env) => env.environmentId === targetEnvironment);
  return Boolean(target?.providerMutationAllowed);
}

async function runDryRun(browser: Browser): Promise<void> {
  const manifest = readJson<Manifest>(MANIFEST_PATH);
  assertCondition(
    manifest.liveMutationGate.liveMutationAllowedByDefault === false,
    "Live mutation must default to false.",
  );
  assertCondition(
    !providerMutationAllowed(manifest, "sandpit_candidate"),
    "sandpit_candidate providerMutationAllowed must remain false by default.",
  );

  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 920 } });
  try {
    await openBoard(page, staticServer.url);
    await page.getByRole("tab", { name: "Redirects" }).click();
    await page.locator("[data-testid='redirect-ownership-graph']").waitFor();
    await page.getByRole("tab", { name: "Scopes" }).click();
    await page.locator("[data-testid='scope-bundle-matrix']").waitFor();
    await page.getByRole("tab", { name: "Live Gates" }).click();
    await page.locator("[data-testid='live-gate-checklist']").waitFor();

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "202-nhs-login-console-harness.png"),
      fullPage: true,
    });

    const selectorSnapshot = await captureSelectorSnapshot(page);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "202-nhs-login-selector-snapshot.json"),
      `${JSON.stringify(redact(selectorSnapshot), null, 2)}\n`,
      "utf8",
    );

    const evidence = redact({
      taskId: "seq_202",
      mode: "dry_run",
      manifestVersion: manifest.manifestVersion,
      liveMutationFlag: manifest.liveMutationGate.allowLiveMutationFlag,
      liveMutationObserved: process.env.ALLOW_REAL_PROVIDER_MUTATION === "true",
      liveMutationPerformed: false,
      providerMutationAllowed: false,
      rollback: {
        snapshotRequiredBeforeMutation: true,
        realProviderRollbackRequiresApproval: true,
      },
      checkedTabs: ["Redirects", "Scopes", "Live Gates"],
      selectorSnapshot,
    });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "202-nhs-login-console-harness-evidence.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  const manifest = readJson<Manifest>(MANIFEST_PATH);
  const targetEnvironment =
    process.argv.find((arg) => arg.startsWith("--target-environment="))?.split("=")[1] ?? "local";
  const wantsProvider = process.argv.includes("--provider-console");
  const liveFlag = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  if (wantsProvider) {
    const allowed = liveFlag && providerMutationAllowed(manifest, targetEnvironment);
    assertCondition(
      !allowed,
      "Provider console mutation is intentionally unavailable in seq_202 dry-run harness.",
    );
    console.log(
      `202_nhs_login_console_harness.ts: provider mutation blocked for ${targetEnvironment}; dry_run only`,
    );
  }

  if (!process.argv.includes("--run")) {
    console.log("202_nhs_login_console_harness.ts: syntax ok");
    return;
  }

  const playwright = await importPlaywright();
  assertCondition(playwright, "Playwright unavailable.");
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await runDryRun(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
