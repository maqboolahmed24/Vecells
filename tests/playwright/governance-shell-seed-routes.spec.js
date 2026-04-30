import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "governance-console");
const GALLERY_PATH = path.join(ROOT, "docs", "architecture", "119_governance_shell_gallery.html");
const JSON_PATH = path.join(ROOT, "data", "analysis", "governance_mock_projection_examples.json");

const MOCK_DATA = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

export const governanceShellSeedCoverage = [
  "gallery route and runtime selectors",
  "first-load governance landing",
  "scope ribbon persistence across all seeded routes",
  "same-shell change-envelope and approval-stepper behavior",
  "access preview and role studio continuity",
  "compliance and records routes inside the same shell",
  "read-only or blocked posture on scope or freeze drift",
  "responsive mission_stack behavior",
  "reduced-motion equivalence and telemetry markers",
];

function assertCondition(condition, message) {
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

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a free port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/119_governance_shell_gallery.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const contentType = filePath.endsWith(".html")
      ? "text/html; charset=utf-8"
      : filePath.endsWith(".json")
        ? "application/json; charset=utf-8"
        : filePath.endsWith(".csv")
          ? "text/csv; charset=utf-8"
          : filePath.endsWith(".css")
            ? "text/css; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });

  return {
    server,
    url: `http://127.0.0.1:${port}/docs/architecture/119_governance_shell_gallery.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startGovernanceConsole() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      BROWSER: "none",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/ops/governance`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Governance console failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl, logs };
}

async function stopGovernanceConsole(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
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

async function expectAttribute(locator, name, expected) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) {
      return;
    }
    await wait(50);
  }
  const value = await locator.getAttribute(name);
  throw new Error(`Expected ${name}=${expected}, found ${value}.`);
}

async function assertHidden(page, selector) {
  const count = await page.locator(selector).count();
  if (count === 0) {
    return;
  }
  await page.locator(selector).waitFor({ state: "hidden" });
}

async function telemetryCount(page) {
  return await page.locator("[data-testid='governance-telemetry-log'] li").count();
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Governance shell gallery HTML is missing.");
  assertCondition(MOCK_DATA.task_id === "par_119", "Governance shell mock data task drifted.");
  assertCondition(MOCK_DATA.summary.route_count === 15, "Governance shell route count drifted.");
  assertCondition(
    MOCK_DATA.summary.mock_projection_count === 6,
    "Governance shell projection count drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startGovernanceConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
    const galleryOrigin = new URL(galleryUrl).origin;
    const galleryExternal = new Set();
    trackExternalRequests(galleryPage, galleryOrigin, galleryExternal);

    await galleryPage.goto(galleryUrl, { waitUntil: "networkidle" });
    for (const testId of [
      "governance-shell-gallery-root",
      "governance-insignia",
      "governance-route-selector",
      "governance-runtime-selector",
      "governance-gallery-stage",
      "governance-route-table",
      "governance-scope-ribbon-diagram",
      "governance-approval-diagram",
      "governance-release-diagram",
    ]) {
      await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    await galleryPage.getByRole("button", { name: "config_promotions" }).click();
    assertCondition(
      (await galleryPage.locator("#stage-title").innerText()) === "/ops/config/promotions",
      "Gallery route selector drifted away from the promotion route.",
    );
    await galleryPage.getByRole("button", { name: "scope_drift" }).click();
    assertCondition(
      (await galleryPage
        .locator("[data-testid='governance-gallery-stage']")
        .getAttribute("data-runtime")) === "scope_drift",
      "Gallery runtime selector failed to switch to scope_drift.",
    );
    assertCondition(
      galleryExternal.size === 0,
      `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
    );
    await galleryPage.close();

    const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
    const appExternal = new Set();
    trackExternalRequests(page, baseUrl, appExternal);

    await page.goto(`${baseUrl}/ops/governance`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='governance-shell-root']").waitFor();
    await page.locator("[data-testid='governance-scope-ribbon']").waitFor();

    const root = page.locator("[data-testid='governance-shell-root']");
    await expectAttribute(root, "data-current-path", "/ops/governance");
    await expectAttribute(root, "data-automation-surface", "rf_governance_shell");

    await page.locator("[data-testid='governance-route-config_bundles']").click();
    await page.waitForURL(`${baseUrl}/ops/config/bundles`);
    await page.locator("[data-testid='governance-change-envelope']").waitFor();
    await page.locator("[data-testid='governance-open-review']").click();
    await page.waitForURL(`${baseUrl}/ops/config/promotions`);
    await page.locator("[data-testid='governance-review-notice']").waitFor();
    await page.locator("[data-testid='governance-acknowledge-review']").click();
    await assertHidden(page, "[data-testid='governance-review-notice']");
    await expectAttribute(root, "data-current-path", "/ops/config/promotions");

    await page.locator("[data-testid='governance-route-access_roles']").click();
    await page.waitForURL(`${baseUrl}/ops/access/roles`);
    await page.locator("[data-testid='governance-access-surface']").waitFor();
    await page.locator("[data-testid='governance-open-review']").click();
    await page.waitForURL(`${baseUrl}/ops/access/reviews`);
    await page.locator("[data-testid='governance-return-button']").waitFor();
    await page.locator("[data-testid='governance-return-button']").click();
    await page.waitForURL(`${baseUrl}/ops/access/roles`);

    await page.locator("[data-testid='governance-route-governance_compliance']").click();
    await page.waitForURL(`${baseUrl}/ops/governance/compliance`);
    await page.locator("[data-testid='governance-compliance-ledger']").waitFor();
    await page.locator("[data-testid='governance-route-governance_records']").click();
    await page.waitForURL(`${baseUrl}/ops/governance/records`);
    const recordsSurface = page.locator("[data-testid='records-governance']");
    await recordsSurface.waitFor();
    await expectAttribute(recordsSurface, "data-route-mode", "records");
    await page.locator("[data-testid='lifecycle-ledger']").waitFor();
    await page.locator("[data-testid='governance-scope-ribbon']").waitFor();

    await page.locator("[data-testid='governance-disposition-scope_drift']").click();
    await expectAttribute(root, "data-recovery-posture", "blocked");
    await page.locator("[data-testid='governance-support-evidence']").click();
    await page.locator("[data-testid='governance-evidence-panel']").waitFor();

    await page.setViewportSize({ width: 720, height: 1280 });
    await page.waitForTimeout(150);
    await expectAttribute(root, "data-layout-mode", "mission_stack");
    await assertHidden(page, "[data-testid='governance-focus-restore']");

    assertCondition(
      (await telemetryCount(page)) === 0,
      "Telemetry log is visible on the default governance route.",
    );
    await page.goto(`${baseUrl}/governance?diagnostics=governance`, { waitUntil: "networkidle" });
    assertCondition(
      (await telemetryCount(page)) > 0,
      "Diagnostics telemetry did not render behind the governance flag.",
    );
    await page.locator("[data-testid='governance-focus-restore']").waitFor();
    assertCondition(
      appExternal.size === 0,
      `Unexpected external requests: ${Array.from(appExternal).join(", ")}`,
    );

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 1080 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${baseUrl}/ops/release`, { waitUntil: "networkidle" });
    const transitionDuration = await reducedPage
      .locator("[data-testid='governance-disposition-writable']")
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0s") ||
        transitionDuration.includes("0.01ms") ||
        transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedContext.close();
  } finally {
    await browser.close();
    await stopGovernanceConsole(child);
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
