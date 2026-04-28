import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const API_DIR = path.join(ROOT, "services", "api-gateway");
const HTML_PATH = path.join(ROOT, "docs", "tests", "167_phase1_regression_atlas.html");
const ROUTE_MATRIX_PATH = path.join(ROOT, "data", "test", "167_channel_route_matrix.csv");
const ACCESSIBILITY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "test",
  "167_accessibility_assertion_matrix.csv",
);
const ARIA_MANIFEST_PATH = path.join(ROOT, "data", "test", "167_aria_snapshot_manifest.yaml");
const RESULTS_PATH = path.join(ROOT, "data", "test", "167_regression_results.json");
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const MEMORY_PREFIX = "patient-intake-mission-frame::";
const CONTRACT_REF = "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1";
const ROUTE_FAMILY_REF = "rf_intake_self_service";
const SHELL_CONTINUITY_KEY = "patient.portal.requests";

export const phase1ChannelAccessibilityCoverage = [
  "all four request-type journeys",
  "urgent and routine outcome paths",
  "keyboard-only traversal",
  "sticky-footer non-obscuration checks",
  "live-region dedupe",
  "reduced-motion equivalence",
  "mobile/tablet/desktop layouts",
  "diagram/table parity",
];

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

async function waitForHttp(url, timeoutMs = 20_000) {
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

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/tests/167_phase1_regression_atlas.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": filePath.endsWith(".html")
          ? "text/html; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : filePath.endsWith(".json")
              ? "application/json; charset=utf-8"
              : "text/plain; charset=utf-8",
      });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/tests/167_phase1_regression_atlas.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startGateway() {
  const servicePort = await allocatePort();
  const adminPort = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "tsx", "src/index.ts"], {
    cwd: API_DIR,
    detached: true,
    env: {
      ...process.env,
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: String(servicePort),
      API_GATEWAY_ADMIN_PORT: String(adminPort),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${servicePort}`;
  try {
    await waitForHttp(`${baseUrl}/phase1/intake/bundle`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`API gateway failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, baseUrl, logs };
}

async function startPatientWeb(gatewayBaseUrl) {
  const port = await allocatePort();
  const logs = [];
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: APP_DIR,
      detached: true,
      env: {
        ...process.env,
        BROWSER: "none",
        VITE_PHASE1_INTAKE_API_BASE_URL: gatewayBaseUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, baseUrl, logs };
}

async function stopChild(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    // process group already stopped
  }
}

async function apiPost(baseUrl, pathName, body = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": "phase1-167-channel-a11y",
    },
    body: JSON.stringify(body),
  });
  assertCondition(response.ok, `POST ${pathName} failed with ${response.status}`);
  return await response.json();
}

async function openRoute(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
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
    ({ memoryPrefix, nextDraftPublicId, nextPartialMemory }) => {
      window.localStorage.setItem(
        `${memoryPrefix}${nextDraftPublicId}`,
        JSON.stringify({
          draftPublicId: nextDraftPublicId,
          ...nextPartialMemory,
        }),
      );
    },
    {
      memoryPrefix: MEMORY_PREFIX,
      nextDraftPublicId: draftPublicId,
      nextPartialMemory: partialMemory,
    },
  );
}

async function rootAttribute(page, name) {
  return await page.locator("[data-testid='patient-intake-mission-frame-root']").getAttribute(name);
}

async function waitForRootAttribute(page, name, value) {
  await page.waitForFunction(
    ([attributeName, attributeValue]) =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute(attributeName) === attributeValue,
    [name, value],
  );
}

async function textFor(page, testId) {
  await page.locator(`[data-testid='${testId}']`).waitFor();
  return (
    (await page.locator(`[data-testid='${testId}']`).textContent())?.replace(/\s+/g, " ").trim() ??
    ""
  );
}

async function rowCount(page, testId) {
  return await page.locator(`[data-testid='${testId}'] tbody tr`).count();
}

async function locatorText(page, testId) {
  return ((await page.locator(`[data-testid='${testId}']`).textContent()) ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

async function assertNoOverflow(page, maxOverflow = 12) {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - window.innerWidth,
    bodyWidth: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.width <= maxOverflow && overflow.bodyWidth <= maxOverflow,
    `Overflow exceeded tolerance: ${JSON.stringify(overflow)}`,
  );
}

async function injectAxe(page) {
  if ((await page.evaluate(() => typeof window.axe === "object").catch(() => false)) === false) {
    await page.addScriptTag({ content: AXE_SOURCE });
  }
}

async function runAxe(page, contextLabel) {
  await injectAxe(page);
  const result = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
  });
  assertCondition(
    result.violations.length === 0,
    `${contextLabel} axe.run violations: ${result.violations
      .map((violation) => `${violation.id}:${violation.nodes.length}`)
      .join(", ")}`,
  );
}

function answersFor(requestType, urgent = false) {
  if (requestType === "Symptoms" && urgent) {
    return {
      "symptoms.category": "chest_breathing",
      "symptoms.chestPainLocation": "centre_chest",
      "symptoms.onsetPrecision": "exact_date",
      "symptoms.onsetDate": "2026-04-14",
      "symptoms.worseningNow": true,
      "symptoms.severityClues": ["mobility_affected", "sudden_change"],
      "symptoms.narrative": "Chest pain and struggling to breathe right now.",
    };
  }
  switch (requestType) {
    case "Meds":
      return {
        "meds.queryType": "repeat_supply",
        "meds.nameKnown": "known",
        "meds.medicineName": "Amoxicillin",
        "meds.issueDescription": "I need help with a repeat supply before it runs out.",
        "meds.urgency": "routine",
      };
    case "Admin":
      return {
        "admin.supportType": "fit_note",
        "admin.deadlineKnown": "deadline_known",
        "admin.deadlineDate": "2026-04-20",
        "admin.referenceAvailable": "available",
        "admin.referenceNumber": "ADM-2049",
        "admin.details": "Please help with the fit note reference.",
      };
    case "Results":
      return {
        "results.context": "blood_test",
        "results.testName": "Full blood count",
        "results.dateKnown": "exact_or_approx",
        "results.resultDate": "2026-04-12",
        "results.question": "Can someone explain what these results mean?",
      };
    default:
      return {
        "symptoms.category": "general",
        "symptoms.onsetPrecision": "exact_date",
        "symptoms.onsetDate": "2026-04-10",
        "symptoms.worseningNow": false,
        "symptoms.severityClues": ["sleep_affected"],
        "symptoms.narrative": "The problem has been getting harder to ignore.",
      };
  }
}

function contactPreferences() {
  return {
    preferredChannel: "sms",
    destinations: {
      sms: "07700 900123",
      phone: "020 7946 0012",
      email: "patient.demo@example.test",
    },
    contactWindow: "weekday_daytime",
    voicemailAllowed: true,
    followUpPermission: "granted",
    quietHours: {
      enabled: true,
      start: "20:00",
      end: "08:00",
    },
    languagePreference: "English",
    translationRequired: false,
    accessibilityNeeds: ["large_text"],
    sourceAuthorityClass: "self_service_browser_entry",
    sourceEvidenceRef: "phase1_167_browser_test",
  };
}

function integratedSessionFromStart(started) {
  return {
    enabled: true,
    contractRef: CONTRACT_REF,
    draftPublicId: started.integratedSession.draftPublicId,
    leaseId: started.integratedSession.leaseId,
    resumeToken: started.integratedSession.resumeToken,
    draftVersion: started.integratedSession.draftVersion,
    requestPublicId: null,
    requestRef: null,
    latestSettlementRef: null,
    latestDecisionClass: null,
    latestNotificationPosture: null,
    routeMetadata: started.routeMetadata,
  };
}

async function seedReviewMemory(page, baseUrl, started, requestType, urgent = false) {
  await seedDraftMemory(page, baseUrl, started.draft.draftPublicId, {
    phase1Integration: integratedSessionFromStart(started),
    requestType,
    structuredAnswers: answersFor(requestType, urgent),
    detailNarrative: `Phase 1 ${requestType} browser journey from seq_167.`,
    detailsCursorQuestionKey:
      requestType === "Symptoms"
        ? "symptoms.narrative"
        : requestType === "Meds"
          ? "meds.urgency"
          : requestType === "Admin"
            ? "admin.details"
            : "results.question",
    completedStepKeys: [
      "request_type",
      "details",
      "supporting_files",
      "contact_preferences",
      "review_submit",
    ],
    reviewAffirmed: true,
    contactPreferences: contactPreferences(),
    savePresentation: "saved_authoritative",
  });
}

async function assertLandmarks(page) {
  assertCondition(
    (await page.locator("main").count()) === 1,
    "Main landmark missing or duplicated.",
  );
  assertCondition(
    (await page.locator("header").count()) === 1,
    "Header landmark missing or duplicated.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-intake-progress-rail']").count()) === 1,
    "Progress rail landmark missing.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-intake-summary-panel']").count()) === 1,
    "Summary panel landmark missing.",
  );
}

async function assertNoDuplicateLiveAnnouncements(page) {
  const liveTexts = await page.evaluate(() =>
    [...document.querySelectorAll("[aria-live]")]
      .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );
  assertCondition(
    new Set(liveTexts).size === liveTexts.length,
    `Duplicate live announcement text found: ${liveTexts.join(" | ")}`,
  );
}

async function assertTargetSizes(page, selectors) {
  for (const selector of selectors) {
    const box = await page.locator(selector).first().boundingBox();
    assertCondition(Boolean(box), `Target missing: ${selector}`);
    assertCondition(
      box.width >= 24 && box.height >= 24,
      `Target below minimum size: ${selector} ${JSON.stringify(box)}`,
    );
  }
}

async function assertStickyFooterDoesNotOverlapFocus(page, focusSelector) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(focusSelector).scrollIntoViewIfNeeded();
  await page.locator(focusSelector).focus();
  const geometry = await page.evaluate((selector) => {
    const focused = document.querySelector(selector)?.getBoundingClientRect();
    const tray = document
      .querySelector("[data-testid='patient-intake-action-tray']")
      ?.getBoundingClientRect();
    if (!focused || !tray) {
      return null;
    }
    return {
      focusedBottom: focused.bottom,
      trayTop: tray.top,
      overlap: focused.bottom > tray.top,
    };
  }, focusSelector);
  assertCondition(geometry !== null, "Could not measure focused control and action tray.");
  assertCondition(
    !geometry.overlap,
    `Sticky footer overlaps focused control: ${JSON.stringify(geometry)}`,
  );
}

async function runAtlasChecks(page, atlasUrl, routeRows, assertionRows) {
  await page.goto(atlasUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.querySelectorAll("[data-testid='route-channel-table'] tbody tr").length > 0,
  );
  assertCondition(
    (await locatorText(page, "surface-mode")) === "Phase1_Regression_Atlas",
    "Surface mode drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='parity_grid_mark']").count()) === 1,
    "Vecells parity grid mark is missing.",
  );
  assertCondition(
    (await page.locator("[data-testid^='filter-button-']").count()) === routeRows.length,
    "Filter rail count does not match route matrix.",
  );
  assertCondition(
    (await rowCount(page, "route-channel-table")) === routeRows.length,
    "Route channel table does not cover every route row.",
  );
  assertCondition(
    (await rowCount(page, "accessibility-assertion-table")) === assertionRows.length,
    "Accessibility assertion table does not cover every assertion row.",
  );

  await page.locator("[data-testid='filter-button-CH167_SYMPTOMS_URGENT']").click();
  assertCondition(
    (await locatorText(page, "selected-outcome")) === "urgent_diversion_required",
    "Symptoms urgent route did not synchronize inspector outcome.",
  );
  await page.locator("[data-testid='filter-button-CH167_RESULTS_ROUTINE_RECEIPT']").click();
  assertCondition(
    (await locatorText(page, "selected-request-type")) === "Results",
    "Results route did not synchronize inspector request type.",
  );
  await page.locator("[data-testid='filter-button-CH167_SYMPTOMS_URGENT']").focus();
  await page.keyboard.press("End");
  assertCondition(
    (await page
      .locator("[data-testid='filter-button-CH167_POST_UPLIFT_READONLY_RETURN']")
      .getAttribute("data-selected")) === "true",
    "End key did not traverse to the final route filter.",
  );
  await page.keyboard.press("Home");
  assertCondition(
    (await page
      .locator("[data-testid='filter-button-CH167_SYMPTOMS_URGENT']")
      .getAttribute("data-selected")) === "true",
    "Home key did not traverse to the first route filter.",
  );

  for (const [visualId, tableId] of [
    ["route-family-atlas", "route-atlas-table"],
    ["breakpoint-ribbon", "breakpoint-ribbon-table"],
    ["focus-path-ladder", "focus-path-table"],
    ["live-announcement-timeline", "live-announcement-table"],
  ]) {
    assertCondition(
      (await page.locator(`[data-testid='${visualId}'] > *`).count()) ===
        (await rowCount(page, tableId)),
      `${visualId} diagram/table parity drifted.`,
    );
  }
  assertCondition(
    (await rowCount(page, "diagram-parity-table")) === 4,
    "Diagram parity table count drifted.",
  );

  const atlasSnapshot = await page
    .locator("[data-testid='phase1-regression-atlas']")
    .ariaSnapshot();
  assertCondition(
    atlasSnapshot.includes("Phase1_Regression_Atlas"),
    "Atlas ariaSnapshot lost surface mode.",
  );
  assertCondition(
    atlasSnapshot.includes("Route family atlas"),
    "Atlas ariaSnapshot lost route atlas heading.",
  );
  await runAxe(page, "Phase1_Regression_Atlas");

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(atlasUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.querySelectorAll("[data-testid='route-channel-table'] tbody tr").length > 0,
    );
    await assertNoOverflow(page);
  }

  const reducedContext = await page
    .context()
    .browser()
    .newContext({
      viewport: { width: 834, height: 1194 },
      reducedMotion: "reduce",
    });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(atlasUrl, { waitUntil: "networkidle" });
  await reducedPage.waitForFunction(
    () => document.querySelectorAll("[data-testid='route-channel-table'] tbody tr").length > 0,
  );
  assertCondition(
    (await rowCount(reducedPage, "route-channel-table")) === routeRows.length,
    "Reduced-motion atlas lost route semantic rows.",
  );
  await reducedContext.close();
}

async function runKeyboardTraversal(page, patientBaseUrl) {
  await clearOriginStorage(page, patientBaseUrl);
  await openRoute(page, patientBaseUrl, "/start-request");
  await page.locator("[data-testid='patient-intake-primary-action']").focus();
  await page.keyboard.press("Enter");
  await waitForRootAttribute(page, "data-route-key", "request_type");
  await page.locator("[data-testid='request-type-card-Symptoms']").focus();
  await page.keyboard.press("Tab");
  await page.locator("[data-testid='request-type-card-Meds']").focus();
  await page.locator("[data-testid='request-type-card-Meds']").press("Enter");
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='request-type-card-Meds']")
        ?.getAttribute("data-pending") === "true",
  );
  await page.locator("[data-testid='request-type-change-confirm']").focus();
  await page.locator("[data-testid='request-type-change-confirm']").press("Enter");
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='request-type-card-Meds']")
        ?.getAttribute("aria-checked") === "true",
  );
  assertCondition(
    (await page.locator("[data-testid='request-type-card-Meds']").getAttribute("aria-checked")) ===
      "true",
    "Keyboard request-type traversal did not select Meds.",
  );
  await assertTargetSizes(page, [
    "[data-testid='patient-intake-primary-action']",
    "[data-testid='request-type-card-Meds']",
  ]);
  await page.locator("[data-testid='patient-intake-primary-action']").focus();
  await page.keyboard.press("Enter");
  await waitForRootAttribute(page, "data-route-key", "details");
  await assertTargetSizes(page, ["[data-testid='patient-intake-primary-action']"]);
  const detailsSnapshot = await page
    .locator("[data-testid='patient-intake-mission-frame-root']")
    .ariaSnapshot();
  assertCondition(
    detailsSnapshot.includes("Quiet clarity mission frame"),
    "Details ariaSnapshot lost shell heading.",
  );
}

async function runRequestTypeJourney(page, patientBaseUrl, gatewayBaseUrl, requestType) {
  const urgent = requestType === "Symptoms";
  const started = await apiPost(gatewayBaseUrl, "/phase1/intake/start", { requestType });
  await seedReviewMemory(page, patientBaseUrl, started, requestType, urgent);
  await openRoute(page, patientBaseUrl, `/start-request/${started.draft.draftPublicId}/review`);
  await page.locator("[data-testid='patient-intake-review-step']").waitFor();
  await assertLandmarks(page);
  assertCondition(
    (await rootAttribute(page, "data-route-family")) === ROUTE_FAMILY_REF,
    `${requestType} route family drifted.`,
  );
  assertCondition(
    (await rootAttribute(page, "data-shell-continuity-key")) === SHELL_CONTINUITY_KEY,
    `${requestType} shell continuity drifted.`,
  );
  await page.locator("[data-testid='patient-intake-primary-action']").focus();
  await page.keyboard.press("Enter");
  await waitForRootAttribute(page, "data-route-key", urgent ? "urgent_outcome" : "receipt_outcome");
  assertCondition(
    (await rootAttribute(page, "data-selected-anchor")) === "request-return",
    `${requestType} selected anchor did not land on request-return.`,
  );
  await assertNoDuplicateLiveAnnouncements(page);
  if (urgent) {
    await page.locator("[data-testid='urgent-pathway-frame']").waitFor();
    const urgentSnapshot = await page
      .locator("[data-testid='patient-intake-mission-frame-root']")
      .ariaSnapshot();
    assertCondition(
      urgentSnapshot.toLowerCase().includes("urgent"),
      "Urgent ariaSnapshot lost urgent semantics.",
    );
  } else {
    await page.locator("[data-testid='receipt-outcome-canvas']").waitFor();
    const receiptSnapshot = await page
      .locator("[data-testid='patient-intake-mission-frame-root']")
      .ariaSnapshot();
    assertCondition(
      receiptSnapshot.toLowerCase().includes("receipt"),
      `${requestType} ariaSnapshot lost receipt semantics.`,
    );
  }
  await runAxe(page, `${requestType} journey`);
  return started.draft.draftPublicId;
}

async function runTrackingAndRecoveryChecks(page, patientBaseUrl) {
  await page.locator("[data-testid='receipt-track-request-action']").click();
  await waitForRootAttribute(page, "data-route-key", "request_status");
  await page.locator("[data-testid='track-request-surface']").waitFor();
  await assertNoDuplicateLiveAnnouncements(page);
  assertCondition(
    (await textFor(page, "track-request-title")).length > 0,
    "Minimal tracking title is missing.",
  );

  const draftPublicId = "dft_167_access_posture";
  await seedDraftMemory(page, patientBaseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "stale_draft_promoted" },
  });
  await openRoute(page, patientBaseUrl, `/start-request/${draftPublicId}/review`);
  await waitForRootAttribute(page, "data-route-key", "receipt_outcome");
  await page.locator("[data-testid='stale-draft-notice']").waitFor();
  await page.locator("[data-testid='receipt-outcome-canvas']").waitFor();
  assertCondition(
    (await rootAttribute(page, "data-selected-anchor")) === "request-return",
    "Stale promoted draft did not preserve request-return anchor.",
  );

  await seedDraftMemory(page, patientBaseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "sign_in_uplift_pending" },
  });
  await openRoute(page, patientBaseUrl, `/start-request/${draftPublicId}/details`);
  await waitForRootAttribute(page, "data-access-posture", "uplift_pending");
  await page.locator("[data-testid='access-posture-dominant-action']").click();
  await waitForRootAttribute(page, "data-access-posture", "read_only_return");
  assertCondition(
    (await page.locator("[data-testid='question-field-symptoms.category']").count()) === 0,
    "Read-only return exposed writable detail fields.",
  );
}

async function runStickyAndReducedMotionChecks(page, patientBaseUrl) {
  const draftPublicId = "dft_167_sticky";
  await seedDraftMemory(page, patientBaseUrl, draftPublicId, {
    requestType: "Meds",
    completedStepKeys: ["request_type", "details", "supporting_files"],
    contactPreferences: contactPreferences(),
  });
  await openRoute(page, patientBaseUrl, `/start-request/${draftPublicId}/contact`);
  await assertStickyFooterDoesNotOverlapFocus(
    page,
    "[data-testid='contact-destination-input-sms']",
  );
  await assertTargetSizes(page, [
    "[data-testid='contact-channel-card-sms']",
    "[data-testid='contact-destination-input-sms']",
    "[data-testid='patient-intake-primary-action']",
  ]);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, patientBaseUrl, `/start-request/${draftPublicId}/contact`);
  const normal = {
    route: await rootAttribute(page, "data-route-key"),
    anchor: await rootAttribute(page, "data-selected-anchor"),
    status: await rootAttribute(page, "data-save-state"),
  };
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRoute(page, patientBaseUrl, `/start-request/${draftPublicId}/contact`);
  const reduced = {
    route: await rootAttribute(page, "data-route-key"),
    anchor: await rootAttribute(page, "data-selected-anchor"),
    status: await rootAttribute(page, "data-save-state"),
    reducedMotion: await rootAttribute(page, "data-reduced-motion"),
  };
  assertCondition(reduced.reducedMotion === "true", "Reduced-motion flag did not activate.");
  assertCondition(
    normal.route === reduced.route &&
      normal.anchor === reduced.anchor &&
      normal.status === reduced.status,
    `Reduced-motion semantic drift: ${JSON.stringify({ normal, reduced })}`,
  );
}

async function runResponsiveAppChecks(browser, patientBaseUrl) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
    { width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await openRoute(page, patientBaseUrl, "/start-request");
    await assertNoOverflow(page);
    await context.close();
  }
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Phase 1 regression atlas HTML is missing.");
  assertCondition(fs.existsSync(ROUTE_MATRIX_PATH), "Route matrix is missing.");
  assertCondition(fs.existsSync(ACCESSIBILITY_MATRIX_PATH), "Accessibility matrix is missing.");
  assertCondition(fs.existsSync(ARIA_MANIFEST_PATH), "ARIA snapshot manifest is missing.");
  const routeRows = parseCsv(fs.readFileSync(ROUTE_MATRIX_PATH, "utf8"));
  const assertionRows = parseCsv(fs.readFileSync(ACCESSIBILITY_MATRIX_PATH, "utf8"));
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  assertCondition(
    results.surfaceMode === "Phase1_Regression_Atlas",
    "Result surface mode drifted.",
  );
  assertCondition(
    new Set(
      routeRows
        .filter((row) => row.coverage_ref === "COV167_REQUEST_TYPE_JOURNEY")
        .map((row) => row.request_type),
    ).size === 4,
    "Route matrix does not cover all four request-type journeys.",
  );

  const { chromium } = await importPlaywright();
  const staticServer = await serve(ROOT);
  const gateway = await startGateway();
  const patientWeb = await startPatientWeb(gateway.baseUrl);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  try {
    await runAtlasChecks(page, staticServer.url, routeRows, assertionRows);
    await runKeyboardTraversal(page, patientWeb.baseUrl);
    await runRequestTypeJourney(page, patientWeb.baseUrl, gateway.baseUrl, "Symptoms");
    await runRequestTypeJourney(page, patientWeb.baseUrl, gateway.baseUrl, "Meds");
    await runRequestTypeJourney(page, patientWeb.baseUrl, gateway.baseUrl, "Admin");
    await runRequestTypeJourney(page, patientWeb.baseUrl, gateway.baseUrl, "Results");
    await runTrackingAndRecoveryChecks(page, patientWeb.baseUrl);
    await runStickyAndReducedMotionChecks(page, patientWeb.baseUrl);
    await runResponsiveAppChecks(browser, patientWeb.baseUrl);
  } finally {
    await context.close();
    await browser.close();
    await stopChild(patientWeb.child);
    await stopChild(gateway.child);
    await closeServer(staticServer.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("167_phase1_channel_and_accessibility.spec.js: syntax ok");
}
