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
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "160_urgent_diversion_gallery.html");
const CONTRACT_PATH = path.join(ROOT, "data", "contracts", "160_urgent_surface_contract.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "160_urgent_outcome_matrix.csv");
const FOCUS_PATH = path.join(ROOT, "data", "analysis", "160_focus_and_recovery_cases.csv");
const MEMORY_PREFIX = "patient-intake-mission-frame::";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
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

const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const MATRIX_ROWS = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
const FOCUS_ROWS = parseCsv(fs.readFileSync(FOCUS_PATH, "utf8"));

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
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
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
      pathname = "/docs/frontend/160_urgent_diversion_gallery.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/160_urgent_diversion_gallery.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startPatientWeb() {
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
      !requestUrl.startsWith("about:") &&
      !requestUrl.startsWith("ws:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

async function clearOriginStorage(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function seedDraftMemory(page, baseUrl, draftPublicId, partialMemory) {
  await clearOriginStorage(page, baseUrl);
  await page.evaluate(
    ({ draftPublicId: nextDraftPublicId, partialMemory: nextPartialMemory, memoryPrefix }) => {
      window.localStorage.setItem(
        `${memoryPrefix}${nextDraftPublicId}`,
        JSON.stringify({
          draftPublicId: nextDraftPublicId,
          ...nextPartialMemory,
        }),
      );
    },
    { draftPublicId, partialMemory, memoryPrefix: MEMORY_PREFIX },
  );
}

async function openRoute(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
}

async function rootAttribute(page, name) {
  return await page.locator("[data-testid='patient-intake-mission-frame-root']").getAttribute(name);
}

async function waitForRouteKey(page, routeKey) {
  await page.waitForFunction(
    (expectedRouteKey) =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute("data-route-key") === expectedRouteKey,
    routeKey,
  );
}

async function assertNoOverflow(page, maxOverflow = 12) {
  const viewport = page.viewportSize();
  assertCondition(Boolean(viewport), "Viewport unavailable.");
  const width = viewport?.width ?? 0;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  assertCondition(
    scrollWidth <= width + maxOverflow,
    `Layout overflowed horizontally: ${scrollWidth}px for viewport ${width}px.`,
  );
}

async function activeTestId(page) {
  return await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return null;
    }
    return (
      active.getAttribute("data-testid") ??
      active.closest("[data-testid]")?.getAttribute("data-testid") ??
      null
    );
  });
}

async function textFor(page, testId) {
  return await page.locator(`[data-testid='${testId}']`).innerText();
}

async function runGalleryChecks(browser, galleryUrl) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const galleryOrigin = new URL(galleryUrl).origin;
  const externalRequests = new Set();
  trackExternalRequests(page, galleryOrigin, externalRequests);

  await page.goto(galleryUrl, { waitUntil: "networkidle" });
  for (const testId of [
    "urgent-diversion-gallery",
    "urgent-decision-ladder-diagram",
    "urgent-decision-ladder-table",
    "urgent-copy-comparison-table",
    "urgent-state-matrix-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  const stateMatrixText = await textFor(page, "urgent-state-matrix-table");
  for (const row of MATRIX_ROWS) {
    assertCondition(
      stateMatrixText.includes(row.variant),
      `Gallery state matrix lost variant ${row.variant}.`,
    );
  }

  const ladderText = await textFor(page, "urgent-decision-ladder-table");
  for (const label of ["Urgent required", "Urgent issued", "Failed-safe recovery"]) {
    assertCondition(ladderText.includes(label), `Gallery ladder parity lost ${label}.`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await assertNoOverflow(page);
  assertCondition(
    externalRequests.size === 0,
    `Gallery made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
  );
  await page.close();
}

async function runRuntimeChecks(browser, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const externalRequests = new Set();
  trackExternalRequests(page, baseUrl, externalRequests);

  const urgentDraftId = "dft_par160_urgent";
  await seedDraftMemory(page, baseUrl, urgentDraftId, {
    requestType: "Symptoms",
    detailNarrative: "Severe chest tightness reported with worsening breathing today.",
    completedStepKeys: ["request_type", "details", "supporting_files", "contact_preferences", "review_submit"],
    contactPreferences: {
      preferredChannel: "sms",
      contactWindow: "weekday_daytime",
      voicemailAllowed: false,
      followUpPermission: "granted",
      destinations: {
        sms: "07700 900456",
        phone: "020 7946 0011",
        email: "alex.rivers@example.test",
      },
      quietHours: {
        enabled: false,
        start: "20:30",
        end: "08:00",
      },
      languagePreference: "English",
      translationRequired: false,
      accessibilityNeeds: [],
      sourceAuthorityClass: "self_service_browser_entry",
      sourceEvidenceRef: "contact_pref_capture_browser_seed_v1",
    },
    outcomeSimulation: {
      urgentVariant: "urgent_required_pending",
      recoveryVariant: "standard_recovery",
    },
  });

  await openRoute(page, baseUrl, `/start-request/${urgentDraftId}/urgent-guidance`);
  for (const testId of [
    "patient-intake-urgent-step",
    "urgent-pathway-frame",
    "urgent-required-pending-settlement-card",
    "urgent-dominant-action",
    "urgent-support-summary",
    "urgent-rationale-disclosure",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    (await rootAttribute(page, "data-route-key")) === "urgent_outcome",
    "Urgent route key drifted.",
  );
  assertCondition(
    (await rootAttribute(page, "data-shell-continuity-key")) === "patient.portal.requests",
    "Urgent surface broke shell continuity.",
  );
  assertCondition(
    (await activeTestId(page)) === FOCUS_ROWS.find((row) => row.variant === "urgent_required_pending")?.dominant_action_testid,
    "Urgent pending focus did not land on the dominant action.",
  );

  const urgentText = await textFor(page, "patient-intake-urgent-step");
  assertCondition(
    !urgentText.includes("Urgent guidance has been issued"),
    "Urgent issued copy rendered before settlement became issued.",
  );
  const pendingAction = page.locator("[data-testid='urgent-dominant-action']");
  assertCondition(
    (await pendingAction.getAttribute("data-navigation-destination-type")) === "phone_dialer",
    "Urgent pending action lost the governed phone handoff marker.",
  );

  await pendingAction.click();
  await page.locator("[data-testid='urgent-issued-guidance-card']").waitFor();
  assertCondition(
    (await rootAttribute(page, "data-shell-continuity-key")) === "patient.portal.requests",
    "Urgent issuance broke shell continuity.",
  );
  assertCondition(
    (await page.locator("[data-testid='urgent-status-pill']").getAttribute("data-settlement-state")) ===
      "issued",
    "Urgent issued state did not publish the issued settlement marker.",
  );
  assertCondition(
    (await pendingAction.getAttribute("data-navigation-destination-type")) === "external_browser",
    "Urgent issued action lost the governed external handoff marker.",
  );
  await page.locator("[data-testid='urgent-secondary-action']").click();
  await page.locator(".patient-intake-mission-frame__urgent-rationale-panel").waitFor();

  await page.keyboard.press("Shift+Tab");
  const focusAfterShiftTab = await activeTestId(page);
  assertCondition(
    focusAfterShiftTab === "urgent-dominant-action" || focusAfterShiftTab === "urgent-secondary-action",
    `Urgent keyboard focus order drifted: ${focusAfterShiftTab}`,
  );

  await assertNoOverflow(page);

  const failedSafeDraftId = "dft_par160_failed_safe";
  await seedDraftMemory(page, baseUrl, failedSafeDraftId, {
    requestType: "Symptoms",
    detailNarrative: "Attachment meaning could not be resolved safely.",
    completedStepKeys: ["request_type", "details", "supporting_files", "contact_preferences", "review_submit"],
    contactPreferences: {
      preferredChannel: "phone",
      contactWindow: "weekday_daytime",
      voicemailAllowed: true,
      followUpPermission: "granted",
      destinations: {
        sms: "",
        phone: "020 7946 0099",
        email: "",
      },
      quietHours: {
        enabled: false,
        start: "20:30",
        end: "08:00",
      },
      languagePreference: "English",
      translationRequired: false,
      accessibilityNeeds: [],
      sourceAuthorityClass: "self_service_browser_entry",
      sourceEvidenceRef: "contact_pref_capture_browser_seed_v1",
    },
    outcomeSimulation: {
      urgentVariant: "urgent_required_pending",
      recoveryVariant: "failed_safe_recovery",
    },
  });

  await openRoute(page, baseUrl, `/start-request/${failedSafeDraftId}/recovery`);
  await page.locator("[data-testid='failed-safe-recovery-card']").waitFor();
  assertCondition(
    (await activeTestId(page)) === "failed-safe-dominant-action",
    "Failed-safe recovery focus did not land on the dominant action.",
  );
  const failedSafeText = await textFor(page, "failed-safe-recovery-card");
  assertCondition(
    !failedSafeText.includes("Your request has been sent"),
    "Failed-safe recovery borrowed routine receipt language.",
  );
  await page.locator("[data-testid='failed-safe-secondary-action']").click();
  await waitForRouteKey(page, "review_submit");
  assertCondition(
    (await rootAttribute(page, "data-route-key")) === "review_submit",
    "Failed-safe quiet secondary action did not return to review.",
  );

  assertCondition(
    externalRequests.size === 0,
    `Patient web made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
  );
  await page.close();

  const reducedMotionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
  await openRoute(reducedMotionPage, baseUrl, `/start-request/${urgentDraftId}/urgent-guidance`);
  assertCondition(
    (await rootAttribute(reducedMotionPage, "data-reduced-motion")) === "true",
    "Reduced-motion mode did not propagate to the urgent shell.",
  );
  await reducedMotionPage.locator("[data-testid='urgent-dominant-action']").waitFor();
  await assertNoOverflow(reducedMotionPage);
  await reducedMotionPage.close();
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Urgent diversion gallery HTML is missing.");
  assertCondition(fs.existsSync(CONTRACT_PATH), "Urgent surface contract JSON is missing.");
  assertCondition(fs.existsSync(MATRIX_PATH), "Urgent outcome matrix CSV is missing.");
  assertCondition(fs.existsSync(FOCUS_PATH), "Urgent focus matrix CSV is missing.");
  assertCondition(
    CONTRACT.contractId === "PHASE1_SAME_SHELL_URGENT_SURFACE_V1",
    "Urgent surface contract drifted.",
  );
  assertCondition(
    MATRIX_ROWS.some(
      (row) =>
        row.variant === "urgent_required_pending" &&
        row.urgent_diverted_visible === "false" &&
        row.settlement_state === "pending",
    ),
    "Urgent outcome matrix lost the pending split row.",
  );
  assertCondition(
    FOCUS_ROWS.some(
      (row) =>
        row.variant === "failed_safe_recovery" &&
        row.lawful_return_action === "return_to_review",
    ),
    "Focus and recovery matrix lost the failed-safe return row.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    await runGalleryChecks(browser, galleryUrl);
    await runRuntimeChecks(browser, baseUrl);
  } finally {
    await browser.close();
    await stopPatientWeb(child);
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
