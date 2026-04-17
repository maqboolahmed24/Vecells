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
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "162_track_request_gallery.html");
const CONTRACT_PATH = path.join(ROOT, "data", "contracts", "162_track_request_surface_contract.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "162_status_macrostate_matrix.csv");
const RECOVERY_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "162_tracking_access_and_recovery_cases.csv",
);
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
    return Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? ""]));
  });
}

const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const MATRIX_ROWS = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
const RECOVERY_ROWS = parseCsv(fs.readFileSync(RECOVERY_PATH, "utf8"));

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
      pathname = "/docs/frontend/162_track_request_gallery.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/162_track_request_gallery.html`,
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

async function textFor(page, testId) {
  await page.locator(`[data-testid='${testId}']`).waitFor();
  return (
    (await page.locator(`[data-testid='${testId}']`).textContent())?.replace(/\s+/g, " ").trim() ??
    ""
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

async function waitForActiveTestId(page, testId) {
  await page.waitForFunction(
    (expectedTestId) => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) {
        return false;
      }
      return (
        active.getAttribute("data-testid") === expectedTestId ||
        active.closest("[data-testid]")?.getAttribute("data-testid") === expectedTestId
      );
    },
    testId,
  );
}

async function runGalleryChecks(playwright) {
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const { server, url } = await startStaticServer();

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "track-request-gallery",
      "status-macrostate-table",
      "status-timeline-diagram",
      "status-timeline-parity-table",
      "status-access-recovery-matrix",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const macroTable = await textFor(page, "status-macrostate-table");
    for (const label of ["Received", "In review", "We need you", "Completed", "Urgent action"]) {
      assertCondition(macroTable.includes(label), `Gallery omitted macro-state row: ${label}`);
    }
    const parityTable = await textFor(page, "status-timeline-parity-table");
    assertCondition(
      parityTable.includes("Urgent action"),
      "Timeline parity table omitted urgent-action coverage.",
    );
    assertCondition(
      parityTable.toLowerCase().includes("same shell"),
      "Timeline parity table omitted same-shell continuity.",
    );
    const accessMatrix = await textFor(page, "status-access-recovery-matrix");
    assertCondition(
      accessMatrix.includes("recovery_only"),
      "Access matrix omitted the recovery_only posture.",
    );
    assertCondition(
      accessMatrix.toLowerCase().includes("no generic error page"),
      "Access matrix omitted the generic-error guardrail.",
    );
    const galleryText = (await page.textContent("body")) ?? "";
    assertCondition(
      galleryText.toLowerCase().includes("no queue position"),
      "Gallery omitted the no-queue-position rule.",
    );
    assertCondition(
      galleryText.toLowerCase().includes("not an exact time"),
      "Gallery omitted the no exact time rule.",
    );
    await assertNoOverflow(page);
    await page.close();
  } finally {
    await closeServer(server);
    await browser.close();
  }
}

async function runRuntimeChecks(playwright) {
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const { child, baseUrl } = await startPatientWeb();

  try {
    const externalRequests = new Set();

    const continuityPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    trackExternalRequests(continuityPage, baseUrl, externalRequests);
    const continuityDraftId = "dft_par162_continuity";
    await seedDraftMemory(continuityPage, baseUrl, continuityDraftId, {
      requestType: "Admin",
      detailNarrative: "A minimal status route should stay calm and same-lineage.",
      completedStepKeys: [
        "request_type",
        "details",
        "supporting_files",
        "contact_preferences",
        "review_submit",
      ],
      receiptSimulation: {
        macroState: "received",
        receiptBucket: "within_2_working_days",
        promiseState: "on_track",
        communicationPosture: "queued",
        summarySafetyState: "screen_clear",
        allowInlinePatch: false,
        nextPatchMacroState: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
      requestStatusSimulation: {
        surfacePosture: "summary_read_only",
        etaVisibility: "visible",
        lastMeaningfulUpdateLine:
          "Last meaningful update: the request was received into the routine review line.",
        allowRefreshPatch: true,
        nextPatchMacroState: "in_review",
        nextPatchReceiptBucket: "within_2_working_days",
        nextPatchPromiseState: "on_track",
        nextPatchCommunicationPosture: "delivery_pending",
      },
    });
    await openRoute(continuityPage, baseUrl, `/start-request/${continuityDraftId}/receipt`);
    await continuityPage.locator("[data-testid='receipt-track-request-action']").click();
    await waitForRouteKey(continuityPage, "request_status");
    await continuityPage.locator("[data-testid='track-request-surface']").waitFor();
    await waitForActiveTestId(continuityPage, "track-request-title");
    assertCondition(
      (await continuityPage.evaluate(() => window.location.pathname)) ===
        "/intake/requests/req_par162_continuity/status",
      "Receipt-to-status continuity lost the governed contract route.",
    );
    assertCondition(
      (await rootAttribute(continuityPage, "data-shell-continuity-key")) ===
        "patient.portal.requests",
      "Status route lost the shell continuity key.",
    );
    assertCondition(
      (await rootAttribute(continuityPage, "data-selected-anchor")) === "request-return",
      "Status route lost the selected anchor.",
    );
    for (const testId of [
      "track-request-pulse-header",
      "track-current-state-panel",
      "track-next-steps-timeline",
      "track-eta-promise-note",
      "track-return-link",
    ]) {
      await continuityPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    const etaText = await textFor(continuityPage, "track-eta-promise-note");
    assertCondition(
      etaText.includes("Within 2 working days"),
      "Status ETA note lost the authoritative bucket.",
    );
    assertCondition(
      etaText.toLowerCase().includes("not an exact time"),
      "Status ETA note omitted the no exact time rule.",
    );
    const stateText = await textFor(continuityPage, "track-current-state-panel");
    assertCondition(
      stateText.includes("Current state") && stateText.includes("Next, the request moves into the first review step."),
      "Status current-state panel lost the one-state or one-next-step law.",
    );
    const surfaceText = (await continuityPage.locator("[data-testid='track-request-surface']").textContent()) ?? "";
    assertCondition(
      !surfaceText.toLowerCase().includes("queue position"),
      "Status surface exposed raw queue position.",
    );
    await continuityPage.keyboard.press("Tab");
    assertCondition(
      (await activeTestId(continuityPage)) === "track-refresh-action",
      "Status keyboard order drifted away from the refresh action.",
    );
    await continuityPage.locator("[data-testid='track-refresh-action']").click();
    await continuityPage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='track-request-state-badge']")
          ?.textContent?.includes("In review"),
    );
    assertCondition(
      (await rootAttribute(continuityPage, "data-route-key")) === "request_status",
      "Status refresh changed the route instead of patching in place.",
    );
    assertCondition(
      (await continuityPage.locator("[data-testid='track-return-link']").getAttribute("data-target-pathname")) ===
        "/intake/requests/req_par162_continuity/receipt",
      "Status return link lost the receipt contract path.",
    );
    await continuityPage.locator("[data-testid='track-return-link']").click();
    await waitForRouteKey(continuityPage, "receipt_outcome");
    assertCondition(
      (await continuityPage.evaluate(() => window.location.pathname)) ===
        "/intake/requests/req_par162_continuity/receipt",
      "Status return link did not navigate back to the receipt contract route.",
    );
    await assertNoOverflow(continuityPage);
    await continuityPage.close();

    const actionNeededPage = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    trackExternalRequests(actionNeededPage, baseUrl, externalRequests);
    const actionNeededDraftId = "dft_par162_action_needed";
    await seedDraftMemory(actionNeededPage, baseUrl, actionNeededDraftId, {
      requestType: "Meds",
      detailNarrative: "Action-needed status should show one dominant cue only.",
      receiptSimulation: {
        macroState: "we_need_you",
        receiptBucket: "next_working_day",
        promiseState: "at_risk",
        communicationPosture: "delivery_pending",
        summarySafetyState: "screen_clear",
        allowInlinePatch: false,
        nextPatchMacroState: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
      requestStatusSimulation: {
        surfacePosture: "summary_read_only",
        etaVisibility: "visible",
        lastMeaningfulUpdateLine:
          "Last meaningful update: the review flagged that we may need one more detail.",
        allowRefreshPatch: false,
        nextPatchMacroState: null,
        nextPatchReceiptBucket: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
    });
    await openRoute(actionNeededPage, baseUrl, `/start-request/${actionNeededDraftId}/status`);
    await actionNeededPage.locator("[data-testid='track-action-needed-card']").waitFor();
    await waitForActiveTestId(actionNeededPage, "track-request-title");
    assertCondition(
      (await actionNeededPage.locator("[data-testid='track-return-link']").count()) === 0,
      "Action-needed state rendered an extra return link.",
    );
    assertCondition(
      (await actionNeededPage.locator("[data-testid='track-refresh-action']").count()) === 0,
      "Action-needed state rendered a competing refresh action.",
    );
    assertCondition(
      (await actionNeededPage.locator("[data-testid='track-action-needed-cta']").getAttribute("data-target-pathname")) ===
        `/start-request/${actionNeededDraftId}/receipt`,
      "Action-needed CTA lost the alias receipt return path.",
    );
    await actionNeededPage.keyboard.press("Tab");
    assertCondition(
      (await activeTestId(actionNeededPage)) === "track-action-needed-cta",
      "Action-needed keyboard order drifted away from the dominant CTA.",
    );
    await actionNeededPage.keyboard.press("Enter");
    await waitForRouteKey(actionNeededPage, "receipt_outcome");
    assertCondition(
      (await actionNeededPage.evaluate(() => window.location.pathname)) ===
        `/start-request/${actionNeededDraftId}/receipt`,
      "Action-needed CTA did not return to the same-shell receipt alias.",
    );
    await assertNoOverflow(actionNeededPage);
    await actionNeededPage.close();

    const urgentPage = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    trackExternalRequests(urgentPage, baseUrl, externalRequests);
    const urgentDraftId = "dft_par162_urgent";
    await seedDraftMemory(urgentPage, baseUrl, urgentDraftId, {
      requestType: "Symptoms",
      detailNarrative: "Urgent status posture should narrow without leaving the shell.",
      receiptSimulation: {
        macroState: "urgent_action",
        receiptBucket: "after_2_working_days",
        promiseState: "recovery_required",
        communicationPosture: "recovery_required",
        summarySafetyState: "screen_clear",
        allowInlinePatch: false,
        nextPatchMacroState: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
      requestStatusSimulation: {
        surfacePosture: "recovery_only",
        etaVisibility: "withheld",
        lastMeaningfulUpdateLine:
          "Last meaningful update: routine tracking narrowed to an urgent follow-up posture.",
        allowRefreshPatch: false,
        nextPatchMacroState: null,
        nextPatchReceiptBucket: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
    });
    await openRoute(urgentPage, baseUrl, "/intake/requests/req_par162_urgent/status");
    await urgentPage.locator("[data-testid='track-action-needed-card']").waitFor();
    const urgentEtaText = await textFor(urgentPage, "track-eta-promise-note");
    assertCondition(
      urgentEtaText.toLowerCase().includes("narrowed"),
      "Urgent recovery posture did not narrow the ETA note.",
    );
    assertCondition(
      (await urgentPage.locator("[data-testid='track-refresh-action']").count()) === 0,
      "Urgent recovery posture rendered a refresh action.",
    );
    assertCondition(
      (await urgentPage.locator("[data-testid='track-action-needed-cta']").getAttribute("data-target-pathname")) ===
        "/intake/requests/req_par162_urgent/urgent-guidance",
      "Urgent action CTA lost the governed urgent-guidance path.",
    );
    await urgentPage.locator("[data-testid='track-action-needed-cta']").click();
    await waitForRouteKey(urgentPage, "urgent_outcome");
    assertCondition(
      (await urgentPage.evaluate(() => window.location.pathname)) ===
        "/intake/requests/req_par162_urgent/urgent-guidance",
      "Urgent action CTA did not navigate to urgent guidance.",
    );
    await assertNoOverflow(urgentPage);
    await urgentPage.close();

    const completedPage = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    trackExternalRequests(completedPage, baseUrl, externalRequests);
    const completedDraftId = "dft_par162_completed";
    await seedDraftMemory(completedPage, baseUrl, completedDraftId, {
      requestType: "Results",
      detailNarrative: "Completed tracking should stay quiet and return-safe.",
      receiptSimulation: {
        macroState: "completed",
        receiptBucket: "same_day",
        promiseState: "improved",
        communicationPosture: "delivered",
        summarySafetyState: "screen_clear",
        allowInlinePatch: false,
        nextPatchMacroState: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
      requestStatusSimulation: {
        surfacePosture: "summary_read_only",
        etaVisibility: "visible",
        lastMeaningfulUpdateLine:
          "Last meaningful update: the routine review path reached a completed state.",
        allowRefreshPatch: false,
        nextPatchMacroState: null,
        nextPatchReceiptBucket: null,
        nextPatchPromiseState: null,
        nextPatchCommunicationPosture: null,
      },
    });
    await openRoute(completedPage, baseUrl, `/start-request/${completedDraftId}/status`);
    assertCondition(
      (await completedPage.locator("[data-testid='track-action-needed-card']").count()) === 0,
      "Completed status rendered an action-needed card.",
    );
    await completedPage.locator("[data-testid='track-return-link']").waitFor();
    await assertNoOverflow(completedPage);
    await completedPage.close();

    const reducedMotionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    trackExternalRequests(reducedMotionPage, baseUrl, externalRequests);
    await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
    await openRoute(reducedMotionPage, baseUrl, `/start-request/${completedDraftId}/status`);
    await reducedMotionPage.locator("[data-testid='track-request-surface']").waitFor();
    assertCondition(
      (await rootAttribute(reducedMotionPage, "data-reduced-motion")) === "true",
      "Reduced-motion mode did not propagate to the tracking shell.",
    );
    await assertNoOverflow(reducedMotionPage);
    await reducedMotionPage.close();

    assertCondition(
      externalRequests.size === 0,
      `Patient web made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await stopPatientWeb(child);
    await browser.close();
  }
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Track-request gallery HTML is missing.");
  assertCondition(fs.existsSync(CONTRACT_PATH), "Track-request contract JSON is missing.");
  assertCondition(fs.existsSync(MATRIX_PATH), "Track-request macro-state matrix CSV is missing.");
  assertCondition(fs.existsSync(RECOVERY_PATH), "Track-request recovery matrix CSV is missing.");
  assertCondition(
    CONTRACT.contractId === "PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1",
    "Track-request contract drifted.",
  );
  assertCondition(
    MATRIX_ROWS.some(
      (row) =>
        row.macro_state === "urgent_action" &&
        row.surface_posture === "recovery_only" &&
        row.eta_visible === "false",
    ),
    "Track-request matrix lost the urgent recovery row.",
  );
  assertCondition(
    RECOVERY_ROWS.some((row) => row.surface_posture === "recovery_only"),
    "Track-request recovery matrix lost the recovery_only posture.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  await runGalleryChecks(playwright);
  if (process.argv.includes("--run")) {
    await runRuntimeChecks(playwright);
  }
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
