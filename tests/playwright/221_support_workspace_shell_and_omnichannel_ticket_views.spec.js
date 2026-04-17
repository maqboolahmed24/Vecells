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
const ATLAS_PATH = "/docs/frontend/221_support_workspace_shell_atlas.html";
const VISUAL_GRAMMAR_PATH = "/docs/frontend/221_support_workspace_visual_grammar.html";
const TASK_ID = "par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views";
const SPEC_ID = "221_support_workspace_shell_and_omnichannel_ticket_views";

export const supportWorkspaceCoverage = [
  "entry-to-ticket launch inside one routed app shell",
  "ticket calm desktop screenshot",
  "active action desktop screenshot",
  "provisional conversation screenshot",
  "degraded tablet screenshot",
  "blocked mobile screenshot",
  "ARIA snapshots for shell, conversation, and action dock",
  "same-shell continuity and anchor retention",
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
    await waitForHttp(`${baseUrl}/ops/support/inbox/repair?state=quiet`);
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
    return Array.from(document.querySelectorAll(selectors.join(","))).map((node) => ({
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

    await page.goto(`${baseUrl}/ops/support/inbox/repair?state=quiet`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='OpsSupportInboxRoute']").waitFor();
    await page.getByRole("button", { name: "Launch governed ticket" }).first().click();
    await page.waitForURL(`${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=quiet`);
    await page.locator("[data-testid='SupportTicketRoute']").waitFor();
    await page.screenshot({ path: outputPath("221-support-ticket-calm-desktop.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "221-support-shell-aria.json");
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-continuity-key")) ===
        "support.workspace.tickets",
      "Support ticket continuity key drifted",
    );

    await page.getByRole("button", { name: "Repair preview" }).click();
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-selected-anchor")) ===
        "repair_preview_219",
      "Selected anchor did not update after choosing repair preview",
    );

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/actions/controlled_resend?state=active&anchor=repair_preview_219`,
      "SupportActionRoute",
    );
    await page.screenshot({ path: outputPath("221-support-ticket-active-action-desktop.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "221-support-action-dock-aria.json");
    assertCondition(
      (await page.locator("[data-testid='support-action-cta']").isDisabled()) === false,
      "Active action CTA unexpectedly disabled",
    );

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/conversation?state=provisional&anchor=repair_preview_219`,
      "SupportConversationRoute",
    );
    await page.screenshot({ path: outputPath("221-support-ticket-provisional-conversation.png"), fullPage: true });
    await writeAccessibilitySnapshot(page, "221-support-conversation-aria.json");
    assertCondition(
      (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-selected-anchor")) ===
        "repair_preview_219",
      "Conversation route lost the selected anchor",
    );

    await page.setViewportSize({ width: 960, height: 1080 });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=degraded&anchor=settlement_219`,
      "SupportTicketRoute",
    );
    await page.screenshot({ path: outputPath("221-support-ticket-degraded-tablet.png"), fullPage: true });

    await page.setViewportSize({ width: 430, height: 932 });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/actions/controlled_resend?state=blocked&anchor=repair_preview_219`,
      "SupportActionRoute",
    );
    await page.screenshot({ path: outputPath("221-support-ticket-blocked-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "Blocked mobile action route");
    assertCondition(
      await page.locator("[data-testid='support-action-cta']").isDisabled(),
      "Blocked action CTA should be disabled",
    );

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openSupportRoute(
      reducedPage,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=calm&anchor=envelope_214_reply`,
      "SupportTicketRoute",
    );
    assertCondition(
      (await reducedPage.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-motion-mode")) ===
        "reduced",
      "Reduced motion attribute drifted",
    );
    await reducedPage.screenshot({ path: outputPath("221-support-reduced-motion.png"), fullPage: true });
    await reducedContext.close();

    const atlasPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    const atlasOrigin = new URL(atlasUrl).origin;
    const atlasExternalRequests = new Set();
    trackExternalRequests(atlasPage, atlasOrigin, atlasExternalRequests);
    await atlasPage.goto(atlasUrl, { waitUntil: "networkidle" });
    for (const boardId of [
      "SupportWorkspaceShellAnatomyBoard",
      "TimelineGrammarBoard",
      "ActionDockBoard",
      "BaseTicketChildRouteBoard",
      "ProvisionalAuthoritativeBoard",
      "DegradedPlaceholderBoard",
    ]) {
      await atlasPage.locator(`[data-testid='${boardId}']`).waitFor();
    }
    await atlasPage.screenshot({ path: outputPath("221-support-workspace-atlas.png"), fullPage: true });
    assertCondition(atlasExternalRequests.size === 0, "Atlas made external requests");
    await atlasPage.close();

    const grammarPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    const grammarOrigin = new URL(visualGrammarUrl).origin;
    const grammarExternalRequests = new Set();
    trackExternalRequests(grammarPage, grammarOrigin, grammarExternalRequests);
    await grammarPage.goto(visualGrammarUrl, { waitUntil: "networkidle" });
    await grammarPage.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").waitFor();
    await grammarPage.screenshot({ path: outputPath("221-support-workspace-visual-grammar.png"), fullPage: true });
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
