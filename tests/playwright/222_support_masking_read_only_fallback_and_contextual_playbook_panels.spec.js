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
const ATLAS_PATH = "/docs/frontend/222_support_masking_and_fallback_atlas.html";
const VISUAL_GRAMMAR_PATH = "/docs/frontend/222_support_disclosure_and_knowledge_visual_grammar.html";
const TASK_ID = "par_222_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_masking_read_only_fallback_and_contextual_playbook_panels";
const SPEC_ID = "222_support_masking_read_only_fallback_and_contextual_playbook_panels";

export const supportMaskingCoverage = [
  "same-shell history summary route",
  "governed history widen",
  "knowledge route with lease-bound playbook cards",
  "observe-only route posture",
  "replay route evidence boundary",
  "same-shell fallback on mobile",
  "ARIA snapshots for history, knowledge, and replay",
  "reduced-motion parity",
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
    await waitForHttp(`${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=calm&anchor=envelope_214_reply`);
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
      "[aria-label]",
      "[aria-live]",
      "[data-testid]",
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || null,
      ariaLabel: node.getAttribute("aria-label") || null,
      ariaLive: node.getAttribute("aria-live") || null,
      testId: node.getAttribute("data-testid") || null,
      text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 180),
    }));
  });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2));
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (!requestUrl.startsWith(baseOrigin) && !requestUrl.startsWith("data:") && !requestUrl.startsWith("about:")) {
      externalRequests.add(requestUrl);
    }
  });
}

async function openSupportRoute(page, url, testId) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(`[data-testid='${testId}']`).waitFor();
  await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").waitFor();
}

async function assertNoHorizontalOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
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

    await page.goto(`${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=calm&anchor=envelope_214_reply`, {
      waitUntil: "networkidle",
    });
    await page.locator("[data-testid='SupportTicketRoute']").waitFor();
    await page.getByRole("tab", { name: "History" }).click();
    await page.waitForURL(`${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=calm&anchor=envelope_214_reply`);
    await page.locator("[data-testid='SupportHistoryRoute']").waitFor();
    await page.locator("[data-testid='DisclosureGatePrompt']").waitFor();
    await page.screenshot({ path: outputPath("222-support-history-summary-desktop.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "222-support-history-aria.json");
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-mask-scope")) !== null,
      "Root shell did not expose the current mask scope",
    );

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&anchor=envelope_214_reply&disclosure=expanded`,
      "SupportHistoryRoute",
    );
    await page.locator("[data-testid='SupportHistoryExpandedRows']").waitFor();
    await page.screenshot({ path: outputPath("222-support-history-expanded-desktop.png"), fullPage: true });

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/knowledge?state=active&assist=executable&anchor=repair_preview_219`,
      "SupportKnowledgeRoute",
    );
    await page.locator("[data-testid='KnowledgeStackRail']").waitFor();
    await page.locator("[data-testid='PlaybookAssistCard']").first().waitFor();
    await page.screenshot({ path: outputPath("222-support-knowledge-desktop.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "222-support-knowledge-aria.json");

    await page.setViewportSize({ width: 1024, height: 1180 });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/observe/support_observe_session_218_delivery_failure?state=calm&anchor=repair_preview_219`,
      "SupportObserveRoute",
    );
    await page.locator("[data-testid='ObserveReplayBreadcrumb']").waitFor();
    await page.screenshot({ path: outputPath("222-support-observe-tablet.png"), fullPage: true });
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-shell-mode")) === "observe_only",
      "Observe route lost observe-only posture",
    );
    assertCondition(await page.locator("[data-testid='support-action-cta']").isDisabled(), "Observe route unexpectedly exposed a writable action CTA");

    await page.setViewportSize({ width: 1440, height: 1080 });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=calm&anchor=repair_preview_219`,
      "SupportReplayRoute",
    );
    await page.locator("[data-testid='SupportReplayBoundaryPanel']").waitFor();
    await page.screenshot({ path: outputPath("222-support-replay-desktop.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "222-support-replay-aria.json");
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-shell-mode")) === "replay",
      "Replay route lost replay posture",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=blocked&fallback=replay_restore_failure&anchor=repair_preview_219`,
      "SupportReplayRoute",
    );
    await page.locator("[data-testid='ReadOnlyFallbackHero']").waitFor();
    await page.screenshot({ path: outputPath("222-support-fallback-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "Fallback mobile route");
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-fallback-active")) === "true",
      "Fallback mobile route did not expose read-only fallback",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=calm&anchor=envelope_214_reply`,
      "SupportHistoryRoute",
    );
    await page.screenshot({ path: outputPath("222-support-reduced-motion.png"), fullPage: true });
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-motion-mode")) === "reduced",
      "Reduced-motion route did not expose reduced motion mode",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });

    const atlasPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    trackExternalRequests(atlasPage, atlasUrl.split("/docs/")[0], appExternalRequests);
    await atlasPage.goto(atlasUrl, { waitUntil: "networkidle" });
    await atlasPage.screenshot({ path: outputPath("222-support-masking-atlas.png"), fullPage: true });
    await atlasPage.close();

    const visualGrammarPage = await browser.newPage({ viewport: { width: 1360, height: 1200 } });
    trackExternalRequests(visualGrammarPage, visualGrammarUrl.split("/docs/")[0], appExternalRequests);
    await visualGrammarPage.goto(visualGrammarUrl, { waitUntil: "networkidle" });
    await visualGrammarPage.screenshot({ path: outputPath("222-support-disclosure-visual-grammar.png"), fullPage: true });
    await visualGrammarPage.close();

    assertCondition(appExternalRequests.size === 0, `Unexpected external requests: ${Array.from(appExternalRequests).join(", ")}`);
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(`[${SPEC_ID}] ${TASK_ID}`);
    console.error(error);
    process.exitCode = 1;
  });
}
