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
const API_DIR = path.join(ROOT, "services", "api-gateway");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "164_phase1_integrated_route_and_settlement_bundle.json",
);
const ENDPOINT_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "164_phase1_endpoint_to_surface_binding_matrix.csv",
);
const STORYBOARD_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "164_phase1_integrated_flow_storyboard.html",
);
const MEMORY_PREFIX = "patient-intake-mission-frame::";
const CONTRACT_REF = "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1";
const ROUTE_FAMILY_REF = "rf_intake_self_service";
const SHELL_CONTINUITY_KEY = "patient.portal.requests";

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
const ENDPOINT_ROWS = parseCsv(fs.readFileSync(ENDPOINT_MATRIX_PATH, "utf8"));

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
    sourceEvidenceRef: "phase1_integrated_browser_test",
  };
}

function journeyPayload(draftPublicId, requestType, options = {}) {
  return {
    draftPublicId,
    requestType,
    structuredAnswers: answersFor(requestType, options.urgent === true),
    detailNarrative: `Integrated ${requestType} request from the patient shell.`,
    completedStepKeys: [
      "request_type",
      "details",
      "supporting_files",
      "contact_preferences",
      "review_submit",
    ],
    currentStepKey: "review_submit",
    currentPathname: `/start-request/${draftPublicId}/review`,
    contactPreferences: contactPreferences(),
    observedAt: options.observedAt ?? "2026-04-15T08:30:00.000Z",
    clientCommandId: options.clientCommandId ?? `cmd_164_${requestType}_${draftPublicId}`,
    idempotencyKey: options.idempotencyKey ?? `idem_164_${requestType}_${draftPublicId}`,
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

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/"
        ? "/docs/frontend/164_phase1_integrated_flow_storyboard.html"
        : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "text/plain; charset=utf-8",
    });
    response.end(fs.readFileSync(filePath));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });
  return {
    server,
    url: `http://127.0.0.1:${port}/docs/frontend/164_phase1_integrated_flow_storyboard.html`,
  };
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
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      BROWSER: "none",
      VITE_PHASE1_INTAKE_API_BASE_URL: gatewayBaseUrl,
    },
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
  return { child, baseUrl, logs };
}

async function stopChild(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function apiGet(baseUrl, pathName) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    headers: { "x-correlation-id": "phase1-integrated-playwright" },
  });
  assertCondition(response.ok, `GET ${pathName} failed with ${response.status}`);
  return await response.json();
}

async function apiPost(baseUrl, pathName, body = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": "phase1-integrated-playwright",
    },
    body: JSON.stringify(body),
  });
  assertCondition(response.ok, `POST ${pathName} failed with ${response.status}`);
  return await response.json();
}

function trackExternalRequests(page, allowedOrigins, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !allowedOrigins.some((origin) => requestUrl.startsWith(origin)) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:") &&
      !requestUrl.startsWith("ws:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
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

async function textFor(page, testId) {
  await page.locator(`[data-testid='${testId}']`).waitFor();
  return (
    (await page.locator(`[data-testid='${testId}']`).textContent())?.replace(/\s+/g, " ").trim() ??
    ""
  );
}

async function seedIntegratedMemory(page, baseUrl, draftPublicId, partialMemory) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
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
    { memoryPrefix: MEMORY_PREFIX, nextDraftPublicId: draftPublicId, nextPartialMemory: partialMemory },
  );
}

async function readDraftMemoryFromStorage(page, draftPublicId) {
  return await page.evaluate(({ memoryPrefix, currentDraftPublicId }) => {
    const key = `${memoryPrefix}${currentDraftPublicId}`;
    if (!window.localStorage.getItem(key)) {
      return null;
    }
    return JSON.parse(window.localStorage.getItem(key) || "null");
  }, { memoryPrefix: MEMORY_PREFIX, currentDraftPublicId: draftPublicId });
}

function draftPublicIdFromUrl(url) {
  const match = url.match(/\/start-request\/([^/]+)/);
  assertCondition(Boolean(match?.[1]), `Unable to read draft public id from ${url}.`);
  return match[1];
}

async function openRoute(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
}

async function runStoryboardChecks(page, storyboardUrl) {
  await page.goto(storyboardUrl, { waitUntil: "networkidle" });
  for (const testId of [
    "phase1-integrated-storyboard",
    "journey-braid",
    "journey-braid-table",
    "shell-morph-diagram",
    "shell-morph-table",
    "route-settlement-table",
    "notification-truth-ladder",
    "notification-truth-table",
    "storyboard-parity-list",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  assertCondition(
    (await textFor(page, "notification-truth-table")).includes("accepted"),
    "transport accepted is not delivery parity row missing.",
  );
  for (const size of [
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(storyboardUrl, { waitUntil: "networkidle" });
    await assertNoOverflow(page);
  }
}

async function runGatewayApiChecks(gatewayBaseUrl) {
  const bundle = await apiGet(gatewayBaseUrl, "/phase1/intake/bundle");
  assertCondition(bundle.contractRef === CONTRACT_REF, "Integrated bundle contract drifted.");
  assertCondition(bundle.routeFamilyRef === ROUTE_FAMILY_REF, "Integrated bundle route family drifted.");
  assertCondition(
    bundle.shellContinuityKey === SHELL_CONTINUITY_KEY,
    "Integrated bundle shell continuity key drifted.",
  );

  const settled = [];
  for (const requestType of ["Symptoms", "Meds", "Admin", "Results"]) {
    const started = await apiPost(gatewayBaseUrl, "/phase1/intake/start", { requestType });
    assertCondition(
      started.routeMetadata.shellContinuityKey === SHELL_CONTINUITY_KEY,
      `${requestType} start lost shell continuity.`,
    );
    const submitted = await apiPost(
      gatewayBaseUrl,
      "/phase1/intake/submit",
      journeyPayload(started.draft.draftPublicId, requestType, {
        clientCommandId: `cmd_164_api_${requestType}`,
        idempotencyKey: `idem_164_api_${requestType}`,
      }),
    );
    assertCondition(
      submitted.routeMetadata.routeFamilyRef === ROUTE_FAMILY_REF,
      `${requestType} submit left the route family.`,
    );
    assertCondition(
      submitted.routeMetadata.shellContinuityKey === SHELL_CONTINUITY_KEY,
      `${requestType} submit lost shell continuity.`,
    );
    assertCondition(submitted.decisionClass === "new_lineage", `${requestType} did not create a new lineage.`);
    assertCondition(
      submitted.notification.communicationEnvelope.localAckState === "queued",
      `${requestType} did not queue notification locally.`,
    );
    assertCondition(
      submitted.notification.patientCommunicationPosture !== "delivered",
      `${requestType} treated queued notification as delivered.`,
    );
    settled.push(submitted);
  }

  const first = settled[0];
  const projection = await apiGet(
    gatewayBaseUrl,
    `/phase1/intake/projection?requestPublicId=${first.requestPublicId}`,
  );
  assertCondition(
    projection.receiptConsistencyEnvelope.consistencyEnvelopeId ===
      first.receiptConsistencyEnvelope.consistencyEnvelopeId,
    "Projection did not return the same receipt consistency envelope.",
  );

  const replay = await apiPost(
    gatewayBaseUrl,
    "/phase1/intake/submit",
    journeyPayload(first.settlement.draftPublicId, "Symptoms", {
      clientCommandId: "cmd_164_api_Symptoms",
      idempotencyKey: "idem_164_api_Symptoms",
      observedAt: "2026-04-15T08:31:00.000Z",
    }),
  );
  assertCondition(replay.replayed === true, "Exact replay did not return replayed=true.");
  assertCondition(replay.requestPublicId === first.requestPublicId, "Exact replay changed request public id.");

  const accepted = await apiPost(gatewayBaseUrl, "/phase1/intake/notifications/advance", {
    requestPublicId: first.requestPublicId,
    deliveryEvidence: false,
    recordedAt: "2026-04-15T08:32:00.000Z",
    observedAt: "2026-04-15T08:32:00.000Z",
  });
  assertCondition(
    accepted.notification.truthLadder.includes("accepted"),
    "Notification truth ladder did not include accepted transport.",
  );
  assertCondition(
    accepted.notification.patientCommunicationPosture === "delivery_pending",
    "transport accepted is not delivery: patient posture should be delivery_pending.",
  );
  const delivered = await apiPost(gatewayBaseUrl, "/phase1/intake/notifications/advance", {
    requestPublicId: first.requestPublicId,
    deliveryEvidence: true,
    recordedAt: "2026-04-15T08:33:00.000Z",
    observedAt: "2026-04-15T08:33:00.000Z",
  });
  assertCondition(
    delivered.notification.truthLadder.includes("delivered"),
    "Delivery evidence did not reach the truth ladder.",
  );

  const urgentStarted = await apiPost(gatewayBaseUrl, "/phase1/intake/start", {
    requestType: "Symptoms",
  });
  const urgent = await apiPost(
    gatewayBaseUrl,
    "/phase1/intake/submit",
    journeyPayload(urgentStarted.draft.draftPublicId, "Symptoms", {
      urgent: true,
      clientCommandId: "cmd_164_api_urgent",
      idempotencyKey: "idem_164_api_urgent",
    }),
  );
  assertCondition(
    urgent.outcomeTuple?.outcomeResult === "urgent_diversion",
    "Urgent symptoms did not settle to urgent diversion.",
  );
}

async function seedReviewMemoryFromStartedDraft(page, startedMemory, overrides) {
  assertCondition(startedMemory?.phase1Integration?.enabled === true, "Started draft lost integration state.");
  await page.evaluate(
    ({ memoryPrefix, nextMemory }) => {
      window.localStorage.setItem(
        `${memoryPrefix}${nextMemory.draftPublicId}`,
        JSON.stringify(nextMemory),
      );
    },
    {
      memoryPrefix: MEMORY_PREFIX,
      nextMemory: {
        ...startedMemory,
        completedStepKeys: [
          "request_type",
          "details",
          "supporting_files",
          "contact_preferences",
          "review_submit",
        ],
        currentStepKey: "review_submit",
        reviewAffirmed: true,
        contactPreferences: contactPreferences(),
        ...overrides,
      },
    },
  );
}

async function runBrowserShellChecks(page, patientBaseUrl, gatewayBaseUrl) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, patientBaseUrl, "/start-request");
  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await waitForRootAttribute(page, "data-route-key", "request_type");
  await page.locator("[data-testid='request-type-card-Meds']").waitFor();
  await waitForRootAttribute(page, "data-phase1-integration", "authoritative");
  assertCondition((await rootAttribute(page, "data-route-family")) === ROUTE_FAMILY_REF, "Shell route family drifted.");
  assertCondition(
    (await rootAttribute(page, "data-shell-continuity-key")) === SHELL_CONTINUITY_KEY,
    "Shell continuity key drifted.",
  );

  const startedDraftPublicId = draftPublicIdFromUrl(page.url());
  const startedMemory = await readDraftMemoryFromStorage(page, startedDraftPublicId);
  await seedReviewMemoryFromStartedDraft(page, startedMemory, {
    requestType: "Symptoms",
    structuredAnswers: answersFor("Symptoms", true),
    detailNarrative: "Chest pain and struggling to breathe right now.",
    detailsCursorQuestionKey: "symptoms.narrative",
  });
  await openRoute(page, patientBaseUrl, `/start-request/${startedMemory.draftPublicId}/review`);
  await page.locator("[data-testid='patient-intake-review-step']").waitFor();
  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await waitForRootAttribute(page, "data-route-key", "urgent_outcome");
  await page.locator("[data-testid='urgent-pathway-frame']").waitFor();
  assertCondition(
    (await rootAttribute(page, "data-phase1-integration")) === "authoritative",
    "Urgent outcome left the authoritative integration seam.",
  );

  const routineStarted = await apiPost(gatewayBaseUrl, "/phase1/intake/start", {
    requestType: "Meds",
  });
  await seedIntegratedMemory(page, patientBaseUrl, routineStarted.draft.draftPublicId, {
    phase1Integration: integratedSessionFromStart(routineStarted),
    requestType: "Meds",
    structuredAnswers: answersFor("Meds"),
    detailNarrative: "I need help with a repeat supply before it runs out.",
    detailsCursorQuestionKey: "meds.urgency",
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
  await openRoute(page, patientBaseUrl, `/start-request/${routineStarted.draft.draftPublicId}/review`);
  await page.locator("[data-testid='patient-intake-review-step']").waitFor();
  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await waitForRootAttribute(page, "data-route-key", "receipt_outcome");
  await page.locator("[data-testid='receipt-outcome-canvas']").waitFor();
  assertCondition(
    (await rootAttribute(page, "data-phase1-notification-posture")) !== "delivered",
    "Routine receipt treated queued or accepted notification as delivered.",
  );
  await page.locator("[data-testid='receipt-track-request-action']").click();
  await waitForRootAttribute(page, "data-route-key", "request_status");
  await page.locator("[data-testid='track-request-surface']").waitFor();
  await page.locator("[data-testid='track-current-state-panel']").waitFor();
  await page.locator("[data-testid='track-next-steps-timeline']").waitFor();

  await page.keyboard.press("Tab");
  const focusedTestId = await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return "";
    }
    return active.getAttribute("data-testid") ?? active.closest("[data-testid]")?.getAttribute("data-testid") ?? "";
  });
  assertCondition(focusedTestId.length > 0, "keyboard traversal did not land on a deterministic marker.");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRoute(page, patientBaseUrl, `/start-request/${routineStarted.draft.draftPublicId}/receipt`);
  assertCondition((await rootAttribute(page, "data-reduced-motion")) === "true", "reducedMotion flag drifted.");

  for (const size of [
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await openRoute(page, patientBaseUrl, `/start-request/${routineStarted.draft.draftPublicId}/receipt`);
    await page.locator("[data-testid='receipt-outcome-canvas']").waitFor();
    await assertNoOverflow(page);
  }
}

async function main() {
  assertCondition(CONTRACT.taskId === "seq_164", "Contract task drift.");
  assertCondition(CONTRACT.contractId === CONTRACT_REF, "Contract id drift.");
  assertCondition(CONTRACT.routeFamilyRef === ROUTE_FAMILY_REF, "Contract route family drift.");
  assertCondition(CONTRACT.shellContinuityKey === SHELL_CONTINUITY_KEY, "Contract continuity key drift.");
  assertCondition(ENDPOINT_ROWS.length === 7, "Endpoint matrix row count drift.");
  assertCondition(fs.existsSync(STORYBOARD_PATH), "Storyboard artifact is missing.");

  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log("164_phase1_integrated_intake.spec.js: syntax ok");
    return;
  }
  if (!playwright) {
    throw new Error("Playwright unavailable.");
  }

  const staticServer = await startStaticServer();
  const gateway = await startGateway();
  const patientWeb = await startPatientWeb(gateway.baseUrl);
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const externalRequests = new Set();
  trackExternalRequests(
    page,
    [new URL(staticServer.url).origin, gateway.baseUrl, patientWeb.baseUrl],
    externalRequests,
  );

  try {
    await runStoryboardChecks(page, staticServer.url);
    await runGatewayApiChecks(gateway.baseUrl);
    await runBrowserShellChecks(page, patientWeb.baseUrl, gateway.baseUrl);
    assertCondition(
      externalRequests.size === 0,
      `Unexpected external requests: ${[...externalRequests].join(", ")}`,
    );
  } finally {
    await context.close();
    await browser.close();
    await stopChild(patientWeb.child);
    await stopChild(gateway.child);
    await closeServer(staticServer.server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
