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
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "161_receipt_and_eta_gallery.html");
const CONTRACT_PATH = path.join(ROOT, "data", "contracts", "161_receipt_surface_contract.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "161_receipt_eta_state_matrix.csv");
const COPY_TABLE_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "161_receipt_copy_and_promise_state_table.csv",
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
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const MATRIX_ROWS = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
const COPY_ROWS = parseCsv(fs.readFileSync(COPY_TABLE_PATH, "utf8"));

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
      pathname = "/docs/frontend/161_receipt_and_eta_gallery.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/161_receipt_and_eta_gallery.html`,
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

async function runGalleryChecks(playwright) {
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const { server, url } = await startStaticServer();

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "receipt-gallery",
      "receipt-morph-diagram",
      "receipt-morph-table",
      "receipt-promise-state-table",
      "receipt-state-matrix-table",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const promiseTable = await textFor(page, "receipt-promise-state-table");
    assertCondition(
      promiseTable.includes("Recovery required"),
      "Receipt gallery omitted the recovery-required promise row.",
    );
    assertCondition(
      promiseTable.includes("exact timing"),
      "Receipt gallery omitted the no exact timestamp rule.",
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    const externalRequests = new Set();
    trackExternalRequests(page, baseUrl, externalRequests);

    const draftId = "dft_par161_receipt";
    await seedDraftMemory(page, baseUrl, draftId, {
      requestType: "Admin",
      detailNarrative: "A routine admin request was submitted and should land on the receipt path.",
      completedStepKeys: [
        "request_type",
        "details",
        "supporting_files",
        "contact_preferences",
        "review_submit",
      ],
      contactPreferences: {
        preferredChannel: "email",
        contactWindow: "weekday_daytime",
        voicemailAllowed: false,
        followUpPermission: "granted",
        destinations: {
          sms: "",
          phone: "020 7946 0100",
          email: "receipt.route@example.test",
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
        sourceEvidenceRef: "contact_pref_receipt_seed_v1",
      },
      receiptSimulation: {
        macroState: "received",
        receiptBucket: "within_2_working_days",
        promiseState: "on_track",
        communicationPosture: "queued",
        summarySafetyState: "screen_clear",
        allowInlinePatch: true,
        nextPatchMacroState: "in_review",
        nextPatchPromiseState: "revised_downward",
        nextPatchCommunicationPosture: "delivery_pending",
      },
    });

    await openRoute(page, baseUrl, `/start-request/${draftId}/receipt`);
    await page.locator("[data-testid='receipt-outcome-canvas']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-route-key")) === "receipt_outcome",
      "Receipt route did not stay on the same-shell receipt key.",
    );
    assertCondition(
      (await rootAttribute(page, "data-shell-continuity-key")) === "patient.portal.requests",
      "Receipt route lost the shell continuity key.",
    );
    assertCondition(
      (await activeTestId(page)) === "receipt-outcome-title",
      "Receipt focus did not land on the receipt title.",
    );

    const referenceText = await textFor(page, "receipt-reference-fact");
    assertCondition(referenceText.includes("REQ-PAR161-RECEIPT"), "Receipt reference fact drifted.");

    const etaText = await textFor(page, "receipt-eta-fact");
    assertCondition(
      etaText.includes("Within 2 working days"),
      "Receipt ETA fact did not render the authoritative bucket.",
    );
    const currentStateText = await textFor(page, "receipt-current-state-panel");
    assertCondition(
      currentStateText.includes("What happened just now"),
      "Receipt current-state panel lost the expected received-state heading.",
    );
    assertCondition(!/\d{1,2}:\d{2}/.test(await page.textContent("body")), "Receipt exposed an exact timestamp.");

    const communicationText = await textFor(page, "receipt-communication-note");
    assertCondition(
      communicationText.toLowerCase().includes("queued is not the same as delivered"),
      "Queued communication posture was flattened into delivered meaning.",
    );

    const contactText = await textFor(page, "receipt-contact-summary");
    assertCondition(contactText.includes("r•••@e•••.test"), "Receipt contact summary lost masking.");
    assertCondition(!contactText.includes("receipt.route@example.test"), "Receipt contact summary exposed the raw route.");

    await page.keyboard.press("Tab");
    const focusAfterTab = await activeTestId(page);
    assertCondition(
      focusAfterTab === "receipt-patch-action" || focusAfterTab === "receipt-track-request-action",
      `Receipt keyboard traversal drifted: ${focusAfterTab}`,
    );

    await page.locator("[data-testid='receipt-patch-action']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='receipt-state-fact']")
          ?.textContent?.includes("In review"),
    );
    assertCondition(
      (await rootAttribute(page, "data-route-key")) === "receipt_outcome",
      "Receipt patch replaced the route instead of patching in place.",
    );
    const patchedPromiseText = await textFor(page, "receipt-promise-note");
    assertCondition(
      patchedPromiseText.includes("Revised downward"),
      "Receipt promise note did not refresh in place.",
    );
    const patchedCommunicationText = await textFor(page, "receipt-communication-note");
    assertCondition(
      patchedCommunicationText.toLowerCase().includes("delivery service"),
      "Receipt communication posture did not patch to delivery_pending.",
    );

    const trackCard = page.locator("[data-testid='receipt-track-request-anchor-card']");
    await trackCard.waitFor();
    assertCondition(
      (await page.locator("[data-testid='receipt-track-request-action']").getAttribute("data-target-pathname")) ===
        "/intake/requests/req_par161_receipt/status",
      "Track-request CTA lost the authoritative request-lineage path.",
    );
    await page.locator("[data-testid='receipt-track-request-action']").click();
    await waitForRouteKey(page, "request_status");
    assertCondition(
      (await page.evaluate(() => window.location.pathname)) ===
        "/intake/requests/req_par161_receipt/status",
      "Track-request CTA did not navigate to the governed status route.",
    );
    await assertNoOverflow(page);
    await page.close();

    const recoveryPage = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    await seedDraftMemory(recoveryPage, baseUrl, "dft_par161_recovery", {
      requestType: "Results",
      detailNarrative: "A calm receipt needs to show recovery-required posture honestly.",
      completedStepKeys: [
        "request_type",
        "details",
        "supporting_files",
        "contact_preferences",
        "review_submit",
      ],
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
    });
    await openRoute(recoveryPage, baseUrl, "/start-request/dft_par161_recovery/receipt");
    const recoveryPromiseText = await textFor(recoveryPage, "receipt-promise-note");
    assertCondition(
      recoveryPromiseText.includes("Recovery required"),
      "Receipt did not render the recovery-required promise state.",
    );
    assertCondition(
      recoveryPromiseText.toLowerCase().includes("cannot keep a calm"),
      "Recovery-required receipt stayed too calm.",
    );
    await assertNoOverflow(recoveryPage);
    await recoveryPage.close();

    const reducedMotionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
    await openRoute(reducedMotionPage, baseUrl, `/start-request/${draftId}/receipt`);
    assertCondition(
      (await rootAttribute(reducedMotionPage, "data-reduced-motion")) === "true",
      "Reduced-motion mode did not propagate to the receipt shell.",
    );
    await reducedMotionPage.locator("[data-testid='receipt-outcome-canvas']").waitFor();
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
  assertCondition(fs.existsSync(GALLERY_PATH), "Receipt gallery HTML is missing.");
  assertCondition(fs.existsSync(CONTRACT_PATH), "Receipt surface contract JSON is missing.");
  assertCondition(fs.existsSync(MATRIX_PATH), "Receipt ETA matrix CSV is missing.");
  assertCondition(fs.existsSync(COPY_TABLE_PATH), "Receipt copy table CSV is missing.");
  assertCondition(
    CONTRACT.contractId === "PHASE1_SAME_SHELL_RECEIPT_SURFACE_V1",
    "Receipt surface contract drifted.",
  );
  assertCondition(
    MATRIX_ROWS.some(
      (row) =>
        row.macro_state === "received" &&
        row.receipt_bucket === "within_2_working_days" &&
        row.promise_state === "on_track",
    ),
    "Receipt matrix lost the received baseline row.",
  );
  assertCondition(
    COPY_ROWS.every((row) => row.exact_timestamp_visible === "false"),
    "Receipt copy table allows exact timestamps.",
  );
  assertCondition(
    COPY_ROWS.every((row) => row.queued_claims_delivery === "false"),
    "Receipt copy table allows queued to imply delivered.",
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
