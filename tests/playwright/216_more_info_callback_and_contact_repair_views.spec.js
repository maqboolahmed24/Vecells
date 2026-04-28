import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "216_more_info_callback_contact_repair_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "216_more_info_callback_contact_repair_ui_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "216_validation_confirmation_and_recovery_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "216_mobile_and_accessibility_state_cases.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const moreInfoCallbackRepairUiCoverage = [
  "Precision_Reassurance_Workflow",
  "MoreInfoThreadFrame",
  "PromptStepCard",
  "ReplyWindowBand",
  "CheckAnswersPanel",
  "SubmissionReceiptPanel",
  "CallbackStatusRail",
  "ContactRepairBridge",
  "BlockedActionSummaryCard",
  "ContinuityPreservedPanel",
  "sequential more-info step entry",
  "validation error summary and inline errors",
  "check-answers and confirmation states",
  "callback status states",
  "repair-required and consent-blocked states",
  "same-shell return behavior",
  "desktop and mobile screenshots",
  "ARIA snapshots",
  "accessibility assertions for forms, errors, and landmarks",
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate local port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startPatientWeb() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, baseUrl };
}

async function stopPatientWeb(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/216_more_info_callback_contact_repair_atlas.html";
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
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });
  return {
    server,
    url: `http://127.0.0.1:${port}/docs/frontend/216_more_info_callback_contact_repair_atlas.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

function getExpected() {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 216 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  assertCondition(
    contract.visualMode === "Precision_Reassurance_Workflow",
    "Contract visual mode drifted.",
  );
  assertCondition(matrix.length >= 12, "Validation matrix needs all critical states.");
  assertCondition(cases.cases.length >= 6, "Mobile/accessibility cases missing.");
  return { contract, matrix, cases };
}

async function screenshot(page, relativePath) {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function activeTestId(page) {
  return await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return null;
    return (
      active.getAttribute("data-testid") ??
      active.closest("[data-testid]")?.getAttribute("data-testid") ??
      active.id ??
      null
    );
  });
}

async function openApp(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='More_Info_Callback_Contact_Repair_Route']").waitFor();
}

async function assertMoreInfoFlow(page, baseUrl) {
  await openApp(page, baseUrl, "/requests/request_211_a/more-info");
  const root = page.locator("[data-testid='More_Info_Callback_Contact_Repair_Route']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Precision_Reassurance_Workflow",
    "Wrong route visual mode.",
  );
  await page.locator("[data-testid='more-info-thread-frame']").waitFor();
  await page.locator("[data-testid='reply-window-band']").waitFor();
  await page.locator("[data-testid='prompt-step-card']").waitFor();
  await page.locator("[data-testid='continuity-preserved-panel']").waitFor();
  await page.locator("[data-testid='more-info-continue-action']").click();
  await page.locator("[data-testid='more-info-error-summary']").waitFor();
  assertCondition(
    (await activeTestId(page)) === "more-info-error-summary",
    "Validation did not focus the error summary.",
  );
  await page
    .locator("[data-testid='more-info-field-prompt_216_photo_timing']")
    .fill("Monday morning in daylight");
  await page.locator("[data-testid='more-info-continue-action']").click();
  await page.waitForURL("**/requests/request_211_a/more-info/step-2");
  await page.locator("[data-testid='prompt-step-card']").waitFor();
  await screenshot(page, "output/playwright/216-more-info-step-2.png");
  await page.locator("[data-testid='more-info-continue-action']").click();
  await page.locator("[data-testid='more-info-error-summary']").waitFor();
  await page.getByLabel("No clear change").check();
  await page.locator("[data-testid='more-info-continue-action']").click();
  await page.waitForURL("**/requests/request_211_a/more-info/check");
  await page.locator("[data-testid='check-answers-panel']").waitFor();
  const checkSnapshot = await page.locator("[data-testid='check-answers-panel']").ariaSnapshot();
  for (const token of ["Check before sending", "Monday morning in daylight", "No clear change"]) {
    assertCondition(checkSnapshot.includes(token), `Check answers ARIA missing ${token}`);
  }
  await screenshot(page, "output/playwright/216-check-answers.png");
  await page.locator("[data-testid='send-more-info-action']").click();
  await page.waitForURL("**/requests/request_211_a/more-info/confirmation");
  await page.locator("[data-testid='submission-receipt-panel']").waitFor();
  await screenshot(page, "output/playwright/216-confirmation.png");
}

async function assertValidationScreenshot(page, baseUrl) {
  await openApp(page, baseUrl, "/requests/request_211_a/more-info");
  await page.locator("[data-testid='more-info-field-prompt_216_photo_timing']").fill("kept value");
  await page.locator("[data-testid='more-info-field-prompt_216_photo_timing']").fill("");
  await page.locator("[data-testid='more-info-continue-action']").click();
  await page.locator("[data-testid='more-info-error-summary']").waitFor();
  await screenshot(page, "output/playwright/216-validation-error.png");
}

async function assertStateRoutes(page, baseUrl) {
  const shots = [
    ["/requests/request_211_a/more-info", "216-more-info-step-desktop.png", "prompt-step-card"],
    ["/requests/request_211_a/more-info/late-review", "216-late-review.png", "reply-window-band"],
    [
      "/requests/request_211_a/more-info/expired",
      "216-expired-recovery.png",
      "more-info-read-only-recovery-panel",
    ],
    [
      "/requests/request_211_a/more-info/read-only",
      "216-read-only.png",
      "more-info-read-only-recovery-panel",
    ],
    ["/requests/request_211_a/callback", "216-callback-status.png", "callback-status-rail"],
    [
      "/requests/request_211_a/callback/at-risk",
      "216-callback-at-risk.png",
      "blocked-action-summary-card",
    ],
    ["/contact-repair/repair_216_sms", "216-contact-repair.png", "contact-repair-bridge"],
    [
      "/requests/request_211_a/consent-checkpoint",
      "216-consent-checkpoint.png",
      "consent-checkpoint-bridge",
    ],
  ];
  for (const [route, output, testId] of shots) {
    await openApp(page, baseUrl, route);
    await page.locator(`[data-testid='${testId}']`).waitFor();
    await assertNoOverflow(page);
    await screenshot(page, `output/playwright/${output}`);
  }

  await openApp(page, baseUrl, "/contact-repair/repair_216_sms");
  await page.locator("[data-testid='apply-contact-repair-action']").click();
  await page.waitForURL("**/contact-repair/repair_216_sms/applied");
  await page.locator("[data-testid='contact-repair-bridge']").waitFor();
  await screenshot(page, "output/playwright/216-contact-repair-applied.png");

  await openApp(page, baseUrl, "/requests/request_211_a/callback/at-risk");
  const callbackSnapshot = await page
    .locator("[data-testid='callback-status-view']")
    .ariaSnapshot();
  assertCondition(
    (await page
      .locator("[data-testid='callback-status-rail']")
      .getAttribute("data-projection-name")) === "PatientCallbackStatusProjection",
    "Callback rail projection marker drifted.",
  );
  for (const token of [
    "Repair contact details before callback can continue",
    "Reply and callback are paused",
  ]) {
    assertCondition(callbackSnapshot.includes(token), `Callback/repair ARIA missing ${token}`);
  }
}

async function assertReturnBridge(page, baseUrl) {
  await openApp(page, baseUrl, "/requests/request_211_a/more-info");
  await page.getByRole("button", { name: /Request/ }).click();
  await page.waitForURL("**/requests/request_211_a");
  await page.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
}

async function assertResponsive(browser, baseUrl) {
  const mobileInfo = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileInfo, baseUrl, "/requests/request_211_a/more-info");
    await assertNoOverflow(mobileInfo);
    await screenshot(mobileInfo, "output/playwright/216-mobile-more-info.png");
  } finally {
    await mobileInfo.close();
  }

  const mobileRepair = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileRepair, baseUrl, "/contact-repair/repair_216_sms");
    await assertNoOverflow(mobileRepair);
    await screenshot(mobileRepair, "output/playwright/216-mobile-contact-repair.png");
  } finally {
    await mobileRepair.close();
  }

  const zoom = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(zoom, baseUrl, "/requests/request_211_a/more-info");
    await zoom.evaluate(() => {
      document.body.style.zoom = "4";
    });
    await zoom.locator("[data-testid='more-info-continue-action']").focus();
    await zoom.keyboard.press("Enter");
    await zoom.locator("[data-testid='more-info-error-summary']").waitFor();
    await screenshot(zoom, "output/playwright/216-zoom-validation.png");
  } finally {
    await zoom.close();
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const reduced = await reducedContext.newPage();
  try {
    await openApp(reduced, baseUrl, "/requests/request_211_a/more-info");
    await reduced.locator("[data-testid='prompt-step-card']").waitFor();
    await screenshot(reduced, "output/playwright/216-reduced-motion.png");
  } finally {
    await reducedContext.close();
  }
}

async function assertAtlas(page, staticServer) {
  await page.goto(staticServer.url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='More_Info_Callback_Contact_Repair_Atlas']").waitFor();
  const snapshot = await page
    .locator("[data-testid='More_Info_Callback_Contact_Repair_Atlas']")
    .ariaSnapshot();
  for (const token of [
    "More-info steps",
    "PatientMoreInfoStatusProjection",
    "PatientCallbackStatusProjection",
    "PatientContactRepairProjection",
  ]) {
    assertCondition(snapshot.includes(token), `Atlas ARIA missing ${token}`);
  }
  await page.locator("[data-scenario-button='step-gallery']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page.locator("[data-scenario-button='validation']").getAttribute("aria-selected")) ===
      "true",
    "Atlas ArrowRight did not move selected scenario.",
  );
  for (const scenario of [
    ["step-gallery", "216-atlas-step-gallery.png"],
    ["validation", "216-atlas-validation.png"],
    ["confirmation", "216-atlas-confirmation.png"],
    ["callback", "216-atlas-callback.png"],
    ["repair", "216-atlas-repair.png"],
    ["continuity", "216-atlas-continuity.png"],
  ]) {
    await page.locator(`[data-scenario-button='${scenario[0]}']`).click();
    await assertNoOverflow(page);
    await screenshot(page, `output/playwright/${scenario[1]}`);
  }
  await screenshot(page, "output/playwright/216-atlas.png");
}

async function runBrowserChecks(browser) {
  getExpected();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
  try {
    await assertAtlas(page, staticServer);
    await assertValidationScreenshot(page, patientWeb.baseUrl);
    await assertMoreInfoFlow(page, patientWeb.baseUrl);
    await assertStateRoutes(page, patientWeb.baseUrl);
    await assertReturnBridge(page, patientWeb.baseUrl);
    await assertResponsive(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main() {
  getExpected();
  if (!process.argv.includes("--run")) {
    console.log("216_more_info_callback_and_contact_repair_views.spec.js: syntax ok");
    return;
  }
  const playwright = await importPlaywright();
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
