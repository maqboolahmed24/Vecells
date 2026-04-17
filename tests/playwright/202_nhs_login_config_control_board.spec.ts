import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const ATLAS_PATH = path.join(ROOT, "docs", "frontend", "202_nhs_login_config_control_board.html");
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
const GATES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "202_environment_gate_and_evidence_checklist.json",
);

interface StaticServer {
  readonly server: http.Server;
  readonly url: string;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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

async function assertNoOverflow(page: Page, maxOverflow = 12): Promise<void> {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - window.innerWidth,
    bodyWidth: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.width <= maxOverflow && overflow.bodyWidth <= maxOverflow,
    `Overflow exceeded tolerance: ${JSON.stringify(overflow)}`,
  );
}

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

function expected202(): void {
  for (const filePath of [ATLAS_PATH, MANIFEST_PATH, SELECTORS_PATH, GATES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing 202 artifact ${filePath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly liveMutationGate: {
      readonly liveMutationAllowedByDefault: boolean;
      readonly requiredPreconditions: readonly string[];
    };
    readonly environmentSet: readonly { readonly environmentId: string }[];
    readonly scopeBundles: readonly { readonly requestedScopes: readonly string[] }[];
  };
  assertCondition(manifest.visualMode === "Identity_Config_Control_Board", "Wrong visual mode.");
  const environments = new Set(manifest.environmentSet.map((env) => env.environmentId));
  for (const required of ["local", "sandbox_twin", "sandpit_candidate", "integration_candidate"]) {
    assertCondition(environments.has(required), `Missing environment ${required}.`);
  }
  assertCondition(
    manifest.liveMutationGate.liveMutationAllowedByDefault === false,
    "Live mutation default is not blocked.",
  );
  assertCondition(
    manifest.liveMutationGate.requiredPreconditions.includes("rollback_snapshot_captured"),
    "Rollback snapshot is not required.",
  );
  for (const bundle of manifest.scopeBundles) {
    assertCondition(
      !bundle.requestedScopes.includes("offline_access"),
      "Scope bundle requests offline_access.",
    );
  }
}

async function assertBoardStructure(page: Page): Promise<void> {
  const root = page.locator("[data-testid='NHS_Login_Config_Control_Board']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Identity_Config_Control_Board",
    "Control board visual mode drifted.",
  );
  for (const testId of [
    "environment-rail",
    "manifest-board",
    "evidence-drawer",
    "redirect-ownership-graph",
    "redirect-ownership-table",
    "scope-bundle-matrix",
    "scope-bundle-table",
    "test-user-coverage-table",
    "live-gate-checklist",
    "redacted-screenshot-list",
    "lower-parity-band",
  ]) {
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) >= 1,
      `Missing control board anchor ${testId}.`,
    );
  }
}

async function assertTabsAndKeyboard(page: Page): Promise<void> {
  const tabs = ["Environments", "Redirects", "Scopes", "Test Users", "Evidence", "Live Gates"];
  for (const tab of tabs) {
    await page.getByRole("tab", { name: tab }).click();
    assertCondition(
      (await page.getByRole("tab", { name: tab }).getAttribute("aria-selected")) === "true",
      `${tab} tab did not become selected.`,
    );
  }

  await page.getByRole("tab", { name: "Redirects" }).focus();
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  assertCondition(focused === "Redirects", "keyboard focus did not land on Redirects tab");
  await page.keyboard.press("Enter");
  await page.locator("#panel-redirects[data-active='true']").waitFor();
}

async function assertLiveGateAndRedaction(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Live Gates" }).click();
  const gateText = await page.locator("[data-testid='live-gate-checklist']").innerText();
  for (const token of [
    "ALLOW_REAL_PROVIDER_MUTATION",
    "Credentials",
    "Approver",
    "Rollback",
    "blocked",
  ]) {
    assertCondition(gateText.includes(token), `Live gate table missing ${token}.`);
  }
  const fullText = await page.locator("[data-testid='NHS_Login_Config_Control_Board']").innerText();
  for (const forbidden of ["Bluewoven-", "190696", "client_secret", "console password"]) {
    assertCondition(!fullText.includes(forbidden), `Control board leaked ${forbidden}.`);
  }
}

async function assertResponsiveAndReducedMotion(browser: Browser, url: string): Promise<void> {
  const sizes = [
    { name: "desktop", width: 1280, height: 980 },
    { name: "mobile", width: 390, height: 860 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openBoard(page, url);
      await assertNoOverflow(page);
      await screenshot(page, `output/playwright/202-nhs-login-config-${size.name}.png`);
    } finally {
      await page.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 860 },
    reducedMotion: "reduce",
  });
  const reducedPage = await context.newPage();
  try {
    await openBoard(reducedPage, url);
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "prefers-reduced-motion did not match reduced context.");
    await reducedPage.locator("[data-testid='evidence-drawer']").waitFor();
    await screenshot(reducedPage, "output/playwright/202-nhs-login-config-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected202();
  const staticServer = await startStaticServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  try {
    await openBoard(page, staticServer.url);
    await assertBoardStructure(page);
    await assertTabsAndKeyboard(page);
    await assertLiveGateAndRedaction(page);
    await screenshot(page, "output/playwright/202-nhs-login-config-control-board.png");
    await assertResponsiveAndReducedMotion(browser, staticServer.url);
  } finally {
    await page.close();
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected202();
  if (!process.argv.includes("--run")) {
    console.log("202_nhs_login_config_control_board.spec.ts: syntax ok");
    return;
  }
  const playwright = await importPlaywright();
  assertCondition(playwright, "Playwright unavailable.");
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await runBrowserChecks(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
