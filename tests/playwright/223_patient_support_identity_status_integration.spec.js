import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PATIENT_APP_DIR = path.join(ROOT, "apps", "patient-web");
const SUPPORT_APP_DIR = path.join(ROOT, "apps", "clinical-workspace");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");
const LAB_PATH = "/docs/frontend/223_patient_support_identity_status_integration_lab.html";
const TASK_ID =
  "seq_223_crosscutting_merge_Playwright_or_other_appropriate_tooling_integrate_patient_account_and_support_surfaces_with_phase2_identity_and_status_models";
const SPEC_ID = "223_patient_support_identity_status_integration";

export const patientSupportIntegrationCoverage = [
  "patient request detail and support ticket parity for the same lineage",
  "patient callback repair posture",
  "patient record step-up restriction",
  "patient signed-out and identity-hold recovery routes",
  "support history and replay-safe fallback parity",
  "keyboard navigation, reduced motion, contrast, and ARIA snapshots",
  "integration lab desktop and mobile evidence",
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

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function outputPath(name) {
  return path.join(OUTPUT_DIR, name);
}

async function startViteApp(appDir, readyPath) {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: appDir,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}${readyPath}`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Vite app failed to start at ${appDir}.\n${logs.join("")}`, {
      cause: error,
    });
  }
  return { child, baseUrl };
}

async function stopProcess(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? LAB_PATH : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const contentType = filePath.endsWith(".html")
      ? "text/html; charset=utf-8"
      : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });
  return { server, labUrl: `http://127.0.0.1:${port}${LAB_PATH}` };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

function trackExternalRequests(page, allowedOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(allowedOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

async function writeAccessibilitySnapshot(page, fileName) {
  const snapshot = await page.evaluate(() => {
    const selectors = [
      "header",
      "nav",
      "main",
      "aside",
      "section",
      "details",
      "summary",
      "button",
      "[role='status']",
      "[aria-live]",
      "[data-testid]",
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || null,
      ariaLive: node.getAttribute("aria-live") || null,
      testId: node.getAttribute("data-testid") || null,
      text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 220),
    }));
  });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2));
}

function parseChannel(raw) {
  const match = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) {
    return [255, 255, 255];
  }
  return match[1]
    .split(",")
    .slice(0, 3)
    .map((value) => Number(value.trim()));
}

function relativeLuminance([r, g, b]) {
  const channel = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

async function assertContrastRatio(page, selector, minRatio, label) {
  const ratio = await page.locator(selector).evaluate((element) => {
    const computed = window.getComputedStyle(element);
    const color = computed.color;
    const background =
      computed.backgroundColor && computed.backgroundColor !== "rgba(0, 0, 0, 0)"
        ? computed.backgroundColor
        : "rgb(255, 255, 255)";
    const parse = (raw) => {
      const match = raw.match(/^rgba?\(([^)]+)\)$/i);
      if (!match) return [255, 255, 255];
      return match[1]
        .split(",")
        .slice(0, 3)
        .map((value) => Number(value.trim()));
    };
    const luminance = (rgb) => {
      const channel = rgb.map((value) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
    };
    const foreground = luminance(parse(color));
    const backgroundLum = luminance(parse(background));
    const lighter = Math.max(foreground, backgroundLum);
    const darker = Math.min(foreground, backgroundLum);
    return (lighter + 0.05) / (darker + 0.05);
  });
  assertCondition(ratio >= minRatio, `${label} contrast ratio ${ratio.toFixed(2)} fell below ${minRatio}`);
}

async function readPhase2Attrs(page, selector) {
  return await page.locator(selector).evaluate((node) => ({
    requestRef: node.getAttribute("data-shared-request-ref"),
    lineageRef: node.getAttribute("data-shared-lineage-ref"),
    causeClass: node.getAttribute("data-cause-class"),
    recoveryClass: node.getAttribute("data-recovery-class"),
    canonicalStatus: node.getAttribute("data-canonical-status-label"),
  }));
}

async function assertKeyboardFocusMoves(page, label) {
  await page.keyboard.press("Tab");
  const activeTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() || null);
  assertCondition(activeTag !== null && activeTag !== "body", `${label} did not move focus on Tab`);
}

export async function run() {
  ensureOutputDir();
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl: patientBaseUrl } = await startViteApp(
    PATIENT_APP_DIR,
    "/requests/request_211_a",
  );
  const { child: supportChild, baseUrl: supportBaseUrl } = await startViteApp(
    SUPPORT_APP_DIR,
    "/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219",
  );
  const { server, labUrl } = await startStaticServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const patientExternalRequests = new Set();
    trackExternalRequests(patientPage, patientBaseUrl, patientExternalRequests);

    await patientPage.goto(`${patientBaseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
    await patientPage.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
    await patientPage.locator("[data-testid='PatientSupportPhase2Bridge']").waitFor();
    await patientPage.screenshot({ path: outputPath("223-patient-request-parity.png"), fullPage: true });
    await writeAccessibilitySnapshot(patientPage, "223-patient-request-aria.json");
    await assertKeyboardFocusMoves(patientPage, "Patient request detail");
    await assertContrastRatio(patientPage, ".patient-phase2-bridge__header h2", 4.5, "Patient Phase 2 bridge");
    const patientRequestAttrs = await readPhase2Attrs(
      patientPage,
      "[data-testid='Patient_Home_Requests_Detail_Route']",
    );
    assertCondition(patientRequestAttrs.canonicalStatus === "Reply needed", "Patient request route lost canonical status parity");
    for (const label of ["Auth claim", "Identity evidence", "Patient preference", "Support reachability"]) {
      await patientPage.getByText(label, { exact: true }).waitFor();
    }

    await patientPage.goto(`${patientBaseUrl}/requests/request_211_a/callback/at-risk`, {
      waitUntil: "networkidle",
    });
    await patientPage.locator("[data-testid='More_Info_Callback_Contact_Repair_Route']").waitFor();
    assertCondition(
      (await patientPage.locator("[data-testid='More_Info_Callback_Contact_Repair_Route']").getAttribute("data-cause-class")) ===
        "repair_required",
      "Patient repair route lost repair_required cause class",
    );
    await patientPage.screenshot({ path: outputPath("223-patient-repair-parity.png"), fullPage: true });

    await patientPage.goto(`${patientBaseUrl}/records/results/result_213_step_up`, {
      waitUntil: "networkidle",
    });
    await patientPage.locator("[data-testid='Health_Record_Communications_Route']").waitFor();
    assertCondition(
      (await patientPage.locator("[data-testid='Health_Record_Communications_Route']").getAttribute("data-cause-class")) ===
        "step_up_required",
      "Patient records step-up route lost step_up_required cause class",
    );
    await patientPage.screenshot({ path: outputPath("223-patient-record-step-up.png"), fullPage: true });

    await patientPage.goto(`${patientBaseUrl}/auth/signed-out`, { waitUntil: "networkidle" });
    await patientPage.locator("[data-testid='Auth_Callback_Recovery_Route']").waitFor();
    assertCondition(
      (await patientPage.locator("[data-testid='Auth_Callback_Recovery_Route']").getAttribute("data-cause-class")) ===
        "session_recovery_required",
      "Auth signed-out route lost session_recovery_required cause class",
    );
    await patientPage.screenshot({ path: outputPath("223-auth-signed-out-parity.png"), fullPage: true });

    await patientPage.goto(`${patientBaseUrl}/portal/claim/identity-hold`, { waitUntil: "networkidle" });
    await patientPage.locator("[data-testid='Claim_Resume_Identity_Hold_Route']").waitFor();
    assertCondition(
      (await patientPage.locator("[data-testid='Claim_Resume_Identity_Hold_Route']").getAttribute("data-cause-class")) ===
        "identity_hold",
      "Claim identity-hold route lost identity_hold cause class",
    );
    await patientPage.screenshot({ path: outputPath("223-claim-identity-hold-parity.png"), fullPage: true });

    const supportPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const supportExternalRequests = new Set();
    trackExternalRequests(supportPage, supportBaseUrl, supportExternalRequests);

    await supportPage.goto(
      `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219`,
      { waitUntil: "networkidle" },
    );
    await supportPage.locator("[data-testid='SupportTicketRoute']").waitFor();
    await supportPage.locator("[data-testid='Subject360SummaryPanel']").waitFor();
    await supportPage.screenshot({ path: outputPath("223-support-ticket-parity.png"), fullPage: true });
    await writeAccessibilitySnapshot(supportPage, "223-support-ticket-aria.json");
    await assertKeyboardFocusMoves(supportPage, "Support ticket");
    const supportAttrs = await readPhase2Attrs(
      supportPage,
      "[data-testid='Support_Ticket_Omnichannel_Shell']",
    );
    assertCondition(
      patientRequestAttrs.requestRef === supportAttrs.requestRef &&
        patientRequestAttrs.lineageRef === supportAttrs.lineageRef &&
        patientRequestAttrs.canonicalStatus === supportAttrs.canonicalStatus,
      "Patient request and support ticket parity drifted on request, lineage, or canonical status",
    );
    for (const label of ["Auth claim", "Identity evidence", "Patient preference", "Support reachability"]) {
      await supportPage.getByText(label, { exact: true }).waitFor();
    }

    await supportPage.goto(
      `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&disclosure=expanded&anchor=repair_preview_219`,
      { waitUntil: "networkidle" },
    );
    await supportPage.locator("[data-testid='SupportHistoryRoute']").waitFor();
    await supportPage.locator("[data-testid='SupportHistoryExpandedRows']").waitFor();
    await supportPage.screenshot({ path: outputPath("223-support-history-parity.png"), fullPage: true });

    await supportPage.goto(
      `${supportBaseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=blocked&fallback=replay_restore_failure&anchor=repair_preview_219`,
      { waitUntil: "networkidle" },
    );
    await supportPage.locator("[data-testid='SupportReplayRoute']").waitFor();
    assertCondition(
      (await supportPage
        .locator("[data-testid='Support_Ticket_Omnichannel_Shell']")
        .getAttribute("data-cause-class")) === "read_only_recovery",
      "Support replay route lost read_only_recovery cause class",
    );
    await supportPage.screenshot({ path: outputPath("223-support-replay-read-only.png"), fullPage: true });

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(
      `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219`,
      { waitUntil: "networkidle" },
    );
    await reducedPage.locator("[data-testid='SupportTicketRoute']").waitFor();
    assertCondition(
      (await reducedPage
        .locator("[data-testid='Support_Ticket_Omnichannel_Shell']")
        .getAttribute("data-motion-mode")) === "reduced",
      "Reduced motion did not propagate into the support shell",
    );
    await reducedPage.screenshot({ path: outputPath("223-reduced-motion-parity.png"), fullPage: true });
    await reducedContext.close();

    const labPage = await browser.newPage({ viewport: { width: 1440, height: 1180 } });
    const labOrigin = new URL(labUrl).origin;
    const labExternalRequests = new Set();
    trackExternalRequests(labPage, labOrigin, labExternalRequests);

    await labPage.goto(labUrl, { waitUntil: "networkidle" });
    for (const testId of [
      "Portal_Support_Identity_Status_Integration_Lab",
      "RouteFamilyParityMap",
      "IdentityStatusCauseLadder",
      "PatientSupportRecoveryMatrix",
      "MaskingAndRestrictionParityTable",
      "SeamResolutionPanel",
    ]) {
      await labPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    await labPage.screenshot({ path: outputPath("223-integration-lab.png"), fullPage: true });
    await writeAccessibilitySnapshot(labPage, "223-integration-lab-aria.json");

    await labPage.setViewportSize({ width: 390, height: 1200 });
    await labPage.locator("details").evaluate((element) => element.setAttribute("open", ""));
    await labPage.screenshot({ path: outputPath("223-integration-lab-mobile.png"), fullPage: true });

    assertCondition(patientExternalRequests.size === 0, `Unexpected patient external requests: ${Array.from(patientExternalRequests).join(", ")}`);
    assertCondition(supportExternalRequests.size === 0, `Unexpected support external requests: ${Array.from(supportExternalRequests).join(", ")}`);
    assertCondition(labExternalRequests.size === 0, `Unexpected lab external requests: ${Array.from(labExternalRequests).join(", ")}`);
  } finally {
    await browser.close();
    await stopProcess(patientChild);
    await stopProcess(supportChild);
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(`[${SPEC_ID}] ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
