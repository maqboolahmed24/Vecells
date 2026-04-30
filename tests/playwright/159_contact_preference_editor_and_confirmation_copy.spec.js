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
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "159_contact_preference_gallery.html");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "159_contact_summary_view_contract.json",
);
const STATE_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "159_contact_preference_state_matrix.csv",
);
const TRUTH_TABLE_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "159_confirmation_copy_truth_table.csv",
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
const STATE_ROWS = parseCsv(fs.readFileSync(STATE_MATRIX_PATH, "utf8"));
const TRUTH_ROWS = parseCsv(fs.readFileSync(TRUTH_TABLE_PATH, "utf8"));

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
      pathname = "/docs/frontend/159_contact_preference_gallery.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/159_contact_preference_gallery.html`,
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

async function waitForText(page, testId, predicate, message, timeoutMs = 5_000) {
  const startedAt = Date.now();
  let latestText = "";
  while (Date.now() - startedAt < timeoutMs) {
    latestText = await textFor(page, testId);
    if (predicate(latestText)) {
      return latestText;
    }
    await wait(100);
  }
  throw new Error(`${message} Last observed text: ${latestText}`);
}

async function runGalleryChecks(browser, galleryUrl) {
  const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const galleryOrigin = new URL(galleryUrl).origin;
  const galleryExternal = new Set();
  trackExternalRequests(galleryPage, galleryOrigin, galleryExternal);

  await galleryPage.goto(galleryUrl, { waitUntil: "networkidle" });
  for (const testId of [
    "contact-preference-gallery",
    "contact-gallery-components",
    "contact-gallery-state-matrix",
    "contact-gallery-copy-truth-table",
    "contact-trust-ladder-diagram",
    "contact-trust-ladder-table",
  ]) {
    await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
  }

  const truthTableText = await textFor(galleryPage, "contact-gallery-copy-truth-table");
  for (const row of TRUTH_ROWS) {
    assertCondition(
      truthTableText.includes(row.copy_state),
      `Gallery truth table lost copy state ${row.copy_state}.`,
    );
  }

  const ladderText = await textFor(galleryPage, "contact-trust-ladder-table");
  for (const step of [
    "Preference entered",
    "Route snapshot",
    "Transport acceptance",
    "Delivery evidence",
    "Authoritative outcome",
  ]) {
    assertCondition(ladderText.includes(step), `Gallery ladder parity lost step ${step}.`);
  }

  assertCondition(
    !truthTableText.includes("patient.demo@example.test") &&
      !truthTableText.includes("07700 900123"),
    "Gallery leaked a raw destination value.",
  );
  assertCondition(
    galleryExternal.size === 0,
    `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
  );

  await galleryPage.setViewportSize({ width: 390, height: 844 });
  await assertNoOverflow(galleryPage);
  await galleryPage.close();
}

async function runRuntimeChecks(browser, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const externalRequests = new Set();
  trackExternalRequests(page, baseUrl, externalRequests);
  const draftPublicId = "dft_par159_contact";
  const seededEmail = "alex.rivers@example.test";
  const seededPhone = "020 7946 0011";
  const seededSms = "07700 900456";

  await seedDraftMemory(page, baseUrl, draftPublicId, {
    requestType: "Admin",
    completedStepKeys: ["request_type", "details", "supporting_files"],
    contactPreferences: {
      preferredChannel: "sms",
      contactWindow: "weekday_daytime",
      voicemailAllowed: false,
      followUpPermission: "granted",
      destinations: {
        sms: seededSms,
        phone: seededPhone,
        email: seededEmail,
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
    contactPreferencesBaseline: {
      preferredChannel: "sms",
      contactWindow: "weekday_daytime",
      voicemailAllowed: false,
      followUpPermission: "granted",
      destinations: {
        sms: seededSms,
        phone: seededPhone,
        email: seededEmail,
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
  });

  await openRoute(page, baseUrl, `/start-request/${draftPublicId}/contact`);
  for (const testId of [
    "contact-channel-stack",
    "contact-route-entry-panel",
    "contact-masked-summary-card",
    "contact-communication-needs-panel",
    "contact-confirmation-copy-preview",
    "contact-trust-boundary-note",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    (await rootAttribute(page, "data-route-key")) === "contact_preferences",
    "Contact route did not stay on the contact_preferences key.",
  );

  const summaryPanelText = await textFor(page, "patient-intake-summary-panel");
  const maskedSummaryText = await textFor(page, "contact-masked-summary-card");
  const previewText = await textFor(page, "contact-confirmation-copy-preview");
  for (const rawValue of [seededEmail, seededPhone, seededSms]) {
    assertCondition(
      !summaryPanelText.includes(rawValue) &&
        !maskedSummaryText.includes(rawValue) &&
        !previewText.includes(rawValue),
      `Masked summary or preview leaked a raw destination value: ${rawValue}`,
    );
  }

  await page.locator("[data-testid='contact-channel-card-email']").click();
  await waitForText(
    page,
    "contact-masked-summary-card",
    (text) => text.includes("Email") && text.includes("@") && !text.includes(seededEmail),
    "Email route did not become the masked preferred route before editing.",
  );
  await page
    .locator("[data-testid='contact-destination-input-email']")
    .fill("river.patient@example.test");
  await page.locator("[data-testid='contact-destination-input-email']").blur();
  const emailSummaryText = await waitForText(
    page,
    "contact-masked-summary-card",
    (text) => text.includes("@") && !text.includes("river.patient@example.test"),
    "Email summary did not stay masked after editing the preferred route.",
  );
  assertCondition(
    emailSummaryText.includes("@") && !emailSummaryText.includes("river.patient@example.test"),
    "Email summary did not stay masked after editing the preferred route.",
  );
  await page.locator("[data-testid='contact-channel-card-phone']").click();
  await page.locator("[data-testid='contact-destination-input-phone']").fill("020 7946 0042");
  await page.locator("[data-testid='contact-destination-input-phone']").blur();
  await page.locator("[data-testid='contact-channel-card-sms']").click();
  await page.locator("[data-testid='contact-destination-input-sms']").fill("07700 900999");
  await page.locator("[data-testid='contact-destination-input-sms']").blur();

  await page.locator("[data-testid='contact-language-input']").fill("Welsh");
  await page.locator("[data-testid='contact-translation-toggle']").click();
  await page.locator("[data-testid='contact-accessibility-large_text']").click();
  await page.locator("[data-testid='contact-review-cue']").waitFor();
  const reviewCueText = await textFor(page, "contact-review-cue");
  assertCondition(
    reviewCueText.includes("safest route"),
    "Safety-relevant contact changes did not surface the bounded review cue.",
  );

  await page.locator("[data-testid='contact-follow-up-not_set']").click();
  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await page.locator("[data-testid='contact-inline-error-follow-up']").waitFor();
  assertCondition(
    (await rootAttribute(page, "data-route-key")) === "contact_preferences",
    "Contact validation allowed navigation away from the contact step.",
  );
  const preservedEmailValue = await page
    .locator("[data-testid='contact-destination-input-email']")
    .inputValue();
  assertCondition(
    preservedEmailValue === "river.patient@example.test",
    "Validation cleared the entered email route.",
  );
  const incompletePreviewText = await textFor(page, "contact-confirmation-copy-preview");
  assertCondition(
    incompletePreviewText.includes("preference incomplete") ||
      incompletePreviewText.includes("Add the missing route details") ||
      incompletePreviewText.includes("still incomplete"),
    "Incomplete follow-up posture did not update the preview to an incomplete state.",
  );

  await page.locator("[data-testid='contact-follow-up-granted']").click();
  await page.locator("[data-testid='contact-channel-card-sms']").focus();
  const keyboardOrder = [];
  for (let index = 0; index < 5; index += 1) {
    keyboardOrder.push(await activeTestId(page));
    await page.keyboard.press("Tab");
  }
  assertCondition(
    keyboardOrder[0] === "contact-channel-card-sms" &&
      keyboardOrder.includes("contact-channel-card-phone") &&
      keyboardOrder.includes("contact-channel-card-email"),
    `Keyboard order drifted in the channel stack: ${keyboardOrder.join(", ")}`,
  );

  await assertNoOverflow(page);
  assertCondition(
    externalRequests.size === 0,
    `Patient web made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
  );
  await page.close();

  const reducedMotionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
  await openRoute(reducedMotionPage, baseUrl, `/start-request/${draftPublicId}/contact`);
  assertCondition(
    (await rootAttribute(reducedMotionPage, "data-reduced-motion")) === "true",
    "Reduced-motion mode did not propagate to the mission-frame root.",
  );
  await reducedMotionPage.locator("[data-testid='contact-channel-card-email']").click();
  await reducedMotionPage.locator("[data-testid='contact-confirmation-copy-preview']").waitFor();
  assertCondition(
    (await reducedMotionPage
      .locator("[data-testid='contact-confirmation-copy-preview']")
      .getAttribute("data-copy-state")) !== null,
    "Confirmation preview lost its deterministic state marker in reduced-motion mode.",
  );
  await assertNoOverflow(reducedMotionPage);
  await reducedMotionPage.close();
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Contact preference gallery HTML is missing.");
  assertCondition(fs.existsSync(CONTRACT_PATH), "Contact summary contract JSON is missing.");
  assertCondition(
    fs.existsSync(STATE_MATRIX_PATH),
    "Contact preference state matrix CSV is missing.",
  );
  assertCondition(fs.existsSync(TRUTH_TABLE_PATH), "Confirmation copy truth table CSV is missing.");
  assertCondition(
    CONTRACT.contractId === "PHASE1_CONTACT_SUMMARY_VIEW_CONTRACT_V1",
    "Contact summary view contract drifted.",
  );
  assertCondition(
    STATE_ROWS.some((row) => row.confirmation_copy_state === "follow_up_declined"),
    "State matrix lost the follow_up_declined row.",
  );
  assertCondition(
    TRUTH_ROWS.some(
      (row) => row.copy_state === "delivery_confirmed" && row.delivery_claim_allowed === "true",
    ),
    "Truth table lost the only delivered row that may claim delivery.",
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
