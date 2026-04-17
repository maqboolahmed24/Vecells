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
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "163_access_change_and_recovery_gallery.html");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "163_patient_action_recovery_surface_contract.json",
);
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "163_access_posture_matrix.csv");
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "163_refresh_resume_and_stale_token_cases.csv",
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
const CASE_ROWS = parseCsv(fs.readFileSync(CASES_PATH, "utf8"));

assertCondition(fs.existsSync(GALLERY_PATH), "Access recovery gallery is missing.");

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
      pathname = "/docs/frontend/163_access_change_and_recovery_gallery.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const contentType =
      filePath.endsWith(".html")
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
    url: `http://127.0.0.1:${port}/docs/frontend/163_access_change_and_recovery_gallery.html`,
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

async function waitForRootAttribute(page, name, value) {
  await page.waitForFunction(
    ([attributeName, attributeValue]) =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute(attributeName) === attributeValue,
    [name, value],
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

async function runGalleryChecks(page, galleryUrl) {
  await page.goto(galleryUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='access-recovery-gallery']").waitFor();
  await page.locator("[data-testid='access-transition-diagram']").waitFor();
  await page.locator("[data-testid='access-posture-matrix-table']").waitFor();
  await page.locator("[data-testid='stale-draft-mapping-table']").waitFor();
  assertCondition(
    (await textFor(page, "stale-draft-parity-note")).includes("mutable draft editing is not restored"),
    "Stale draft parity note missing.",
  );

  for (const size of [
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(galleryUrl, { waitUntil: "networkidle" });
    await assertNoOverflow(page);
  }
}

async function runAppChecks(page, baseUrl) {
  const draftPublicId = "dft_7k49m2v8pq41";

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "sign_in_uplift_pending" },
  });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
  assertCondition((await rootAttribute(page, "data-route-key")) === "details", "Expected details route.");
  assertCondition(
    (await rootAttribute(page, "data-selected-anchor")) === "request-proof",
    "Selected anchor drifted before uplift return.",
  );
  assertCondition(
    (await rootAttribute(page, "data-access-posture")) === "uplift_pending",
    "Expected uplift posture.",
  );
  await page.click("[data-testid='access-posture-dominant-action']");
  await waitForRootAttribute(page, "data-access-posture", "read_only_return");
  assertCondition(
    (await rootAttribute(page, "data-route-key")) === "details",
    "Auth return left the current shell route.",
  );
  assertCondition(
    (await rootAttribute(page, "data-selected-anchor")) === "request-proof",
    "Selected anchor changed during auth return.",
  );
  assertCondition(
    (await page.locator("[data-testid='question-field-symptoms.category']").count()) === 0,
    "Writable detail field stayed visible during narrowed return.",
  );

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "claim_pending_narrowing" },
    contactPreferences: {
      preferredChannel: "email",
      allowVoicemail: false,
      communicationNeeds: [],
      destinations: {
        email: "patient.claim.pending@example.test",
        phone: "",
        sms: "",
      },
    },
  });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/contact`);
  await waitForRootAttribute(page, "data-access-posture", "claim_pending");
  assertCondition(
    (await page.locator("[data-testid='access-posture-hidden-summary']").count()) === 1,
    "Claim pending posture did not hide summary.",
  );
  await page.click("[data-testid='access-posture-dominant-action']");
  await waitForRootAttribute(page, "data-access-posture", "read_only_return");

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "identity_hold" },
  });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/review`);
  await waitForRootAttribute(page, "data-access-posture", "identity_hold");
  assertCondition(
    ["access-posture-dominant-action", "access-posture-title"].includes(await activeTestId(page)),
    "Focus did not land on the identity hold posture.",
  );
  await page.click("[data-testid='access-posture-dominant-action']");
  await waitForRootAttribute(page, "data-access-posture", "rebind_required");

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "stale_draft_promoted" },
  });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/review`);
  await waitForRootAttribute(page, "data-route-key", "receipt_outcome");
  await page.locator("[data-testid='stale-draft-notice']").waitFor();
  await page.locator("[data-testid='receipt-outcome-canvas']").waitFor();
  await page.click("[data-testid='access-posture-dominant-action']");
  await waitForRootAttribute(page, "data-route-key", "request_status");

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "embedded_drift_recovery" },
  });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
  await waitForRootAttribute(page, "data-access-posture", "embedded_drift");
  await page.click("[data-testid='access-posture-dominant-action']");
  await waitForRootAttribute(page, "data-access-posture", "none");
  await page.locator("[data-testid='question-field-symptoms.category']").waitFor();

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    accessSimulation: { scenarioId: "auth_return_read_only" },
  });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
  await waitForRootAttribute(page, "data-access-posture", "read_only_return");
  await page.reload({ waitUntil: "networkidle" });
  await waitForRootAttribute(page, "data-access-posture", "read_only_return");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
  assertCondition(
    (await rootAttribute(page, "data-reduced-motion")) === "true",
    "Reduced-motion flag did not propagate.",
  );
}

async function main() {
  assertCondition(CONTRACT.taskId === "par_163", "Contract task drift.");
  assertCondition(
    CONTRACT.contractId === "PHASE1_PATIENT_ACTION_RECOVERY_SURFACE_V1",
    "Contract id drift.",
  );
  assertCondition(
    MATRIX_ROWS.length >= 7 && CASE_ROWS.length >= 6,
    "Expected posture matrix or case rows missing.",
  );

  const playwright = await importPlaywright();
  if (!process.argv.includes("--run")) {
    console.log("163_sign_in_uplift_refresh_and_resume_postures.spec.js: syntax ok");
    return;
  }
  if (!playwright) {
    throw new Error("Playwright unavailable.");
  }

  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const externalRequests = new Set();
  trackExternalRequests(
    page,
    [patientWeb.baseUrl, new URL(staticServer.url).origin],
    externalRequests,
  );

  try {
    await runGalleryChecks(page, staticServer.url);
    await runAppChecks(page, patientWeb.baseUrl);
    assertCondition(externalRequests.size === 0, `Unexpected external requests: ${[...externalRequests].join(", ")}`);
  } finally {
    await context.close();
    await browser.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
