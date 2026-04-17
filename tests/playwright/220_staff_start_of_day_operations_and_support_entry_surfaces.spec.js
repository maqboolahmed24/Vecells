import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "clinical-workspace");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");
const ATLAS_PATH = "/docs/frontend/220_staff_entry_atlas.html";
const VISUAL_GRAMMAR_PATH = "/docs/frontend/220_staff_entry_visual_grammar.html";
const TASK_ID = "par_220_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_start_of_day_operations_and_support_entry_surfaces";
const SPEC_ID = "220_staff_start_of_day_operations_and_support_entry_surfaces";

export const staffEntrySurfaceCoverage = [
  "workspace quiet desktop screenshot",
  "workspace busy tablet screenshot",
  "workspace blocking mobile screenshot",
  "ops overview calm and busy screenshots",
  "support entry and repair inbox screenshots",
  "same-shell continuity route launches",
  "ARIA snapshots for workspace, ops overview, and support entry",
  "reduced-motion parity",
  "overflow assertions",
  "atlas and visual grammar screenshots",
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
        reject(new Error("Unable to allocate port."));
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

async function waitForHttp(url, timeoutMs = 20_000) {
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

async function startStaticServer() {
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
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });
  return {
    server,
    atlasUrl: `http://127.0.0.1:${port}${ATLAS_PATH}`,
    visualGrammarUrl: `http://127.0.0.1:${port}${VISUAL_GRAMMAR_PATH}`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(undefined))));
}

async function startClinicalWorkspace() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/workspace?state=quiet`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Clinical workspace failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, baseUrl };
}

async function stopClinicalWorkspace(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function outputPath(name) {
  return path.join(OUTPUT_DIR, name);
}

async function writeAccessibilitySnapshot(page, fileName) {
  const snapshot = await page.evaluate(() => {
    const selectors = [
      "header",
      "nav",
      "main",
      "aside",
      "section",
      "button",
      "[role='tab']",
      "[role='tabpanel']",
      "[aria-label]",
      "[aria-current]",
    ];
    const nodes = Array.from(document.querySelectorAll(selectors.join(",")));
    return nodes.map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || null,
      ariaLabel: node.getAttribute("aria-label") || null,
      ariaCurrent: node.getAttribute("aria-current") || null,
      text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 180),
    }));
  });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2));
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

async function assertNoHorizontalOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

async function openRoute(page, url, testId) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(`[data-testid='${testId}']`).waitFor();
  await page.locator("[data-testid='Quiet_Internal_Control']").waitFor();
}

export async function run() {
  ensureOutputDir();
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, atlasUrl, visualGrammarUrl } = await startStaticServer();
  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const appExternalRequests = new Set();
    trackExternalRequests(page, baseUrl, appExternalRequests);

    await openRoute(page, `${baseUrl}/workspace?state=quiet`, "WorkspaceHomeRoute");
    await page.screenshot({ path: outputPath("220-workspace-desktop-quiet.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "220-workspace-aria.json");
    assertCondition(
      (await page.locator("[data-testid='Quiet_Internal_Control']").getAttribute("data-continuity-key")) ===
        "staff.workspace.queue",
      "Workspace route continuity key drifted",
    );

    await page.locator("[data-testid='recommended-queue-launch']").focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`${baseUrl}/workspace/queue/same-day-review?state=quiet`);
    assertCondition(
      (await page.locator("[data-testid='Quiet_Internal_Control']").getAttribute("data-shell-family")) ===
        "staff_entry_same_shell",
      "Queue launch changed shell family",
    );

    await page.setViewportSize({ width: 960, height: 1080 });
    await openRoute(page, `${baseUrl}/workspace?state=busy`, "WorkspaceHomeRoute");
    await page.screenshot({ path: outputPath("220-workspace-tablet-busy.png"), fullPage: true });

    await page.setViewportSize({ width: 430, height: 932 });
    await openRoute(page, `${baseUrl}/workspace?state=blocking`, "WorkspaceHomeRoute");
    await page.screenshot({ path: outputPath("220-workspace-mobile-blocking.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "Workspace mobile blocking");

    await page.setViewportSize({ width: 1440, height: 1080 });
    await openRoute(page, `${baseUrl}/ops/overview?state=quiet`, "OpsOverviewRoute");
    await page.screenshot({ path: outputPath("220-ops-overview-desktop-calm.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "220-ops-overview-aria.json");

    await openRoute(page, `${baseUrl}/ops/overview?state=busy`, "OpsOverviewRoute");
    await page.screenshot({ path: outputPath("220-ops-overview-desktop-busy.png"), fullPage: true });

    await openRoute(page, `${baseUrl}/ops/support?state=quiet`, "OpsSupportRoute");
    await page.screenshot({ path: outputPath("220-support-entry-desktop.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "220-support-entry-aria.json");
    assertCondition(
      (await page.locator("[data-testid='Quiet_Internal_Control']").getAttribute("data-continuity-key")) ===
        "support.workspace.tickets",
      "Support route continuity key drifted",
    );

    await page.getByRole("button", { name: "Repair inbox" }).click();
    await page.waitForURL(`${baseUrl}/ops/support/inbox/repair?state=quiet`);
    await page.locator("[data-testid='OpsSupportInboxRoute']").waitFor();
    await page.screenshot({ path: outputPath("220-support-inbox-repair.png"), fullPage: true });

    await openRoute(page, `${baseUrl}/ops/support?state=degraded`, "OpsSupportRoute");
    await page.screenshot({ path: outputPath("220-degraded-state.png"), fullPage: true });

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openRoute(reducedPage, `${baseUrl}/workspace?state=quiet`, "WorkspaceHomeRoute");
    assertCondition(
      (await reducedPage.locator("[data-testid='Quiet_Internal_Control']").getAttribute("data-motion-mode")) ===
        "reduced",
      "Reduced motion attribute drifted",
    );
    await reducedPage.screenshot({ path: outputPath("220-reduced-motion.png"), fullPage: true });
    await reducedContext.close();

    const atlasPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    const atlasOrigin = new URL(atlasUrl).origin;
    const atlasExternalRequests = new Set();
    trackExternalRequests(atlasPage, atlasOrigin, atlasExternalRequests);
    await atlasPage.goto(atlasUrl, { waitUntil: "networkidle" });
    for (const boardId of [
      "StaffEntryShellAnatomyBoard",
      "StartOfDayStateBoard",
      "OpsCalmBusyEntryBoard",
      "SupportEntryInboxBoard",
      "RouteContinuityBoard",
      "DegradationBlockingBoard",
    ]) {
      await atlasPage.locator(`[data-testid='${boardId}']`).waitFor();
    }
    await atlasPage.screenshot({ path: outputPath("220-staff-entry-atlas.png"), fullPage: true });
    assertCondition(atlasExternalRequests.size === 0, "Atlas made external requests");
    await atlasPage.close();

    const grammarPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    const grammarOrigin = new URL(visualGrammarUrl).origin;
    const grammarExternalRequests = new Set();
    trackExternalRequests(grammarPage, grammarOrigin, grammarExternalRequests);
    await grammarPage.goto(visualGrammarUrl, { waitUntil: "networkidle" });
    await grammarPage.locator("[data-testid='Quiet_Internal_Control']").waitFor();
    await grammarPage.screenshot({ path: outputPath("220-staff-entry-visual-grammar.png"), fullPage: true });
    assertCondition(grammarExternalRequests.size === 0, "Visual grammar made external requests");
    await grammarPage.close();

    assertCondition(appExternalRequests.size === 0, `App made external requests: ${Array.from(appExternalRequests).join(", ")}`);
  } finally {
    await browser.close();
    await closeServer(server);
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
