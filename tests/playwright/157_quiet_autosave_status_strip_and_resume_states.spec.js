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
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "157_autosave_status_strip_gallery.html");
const CONTRACT_PATH = path.join(ROOT, "data", "contracts", "157_frontend_save_truth_contract.json");
const ARBITRATION_MATRIX_PATH = path.join(ROOT, "data", "analysis", "157_status_arbitration_matrix.csv");
const RECOVERY_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "157_resume_merge_and_recovery_cases.csv",
);
const MERMAID_PATH = path.join(ROOT, "docs", "frontend", "157_autosave_state_machine.mmd");

const MEMORY_PREFIX = "patient-intake-mission-frame::";
const SCENARIO_PREFIX = "patient-intake-autosave-scenario::";

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
const ARBITRATION_ROWS = parseCsv(fs.readFileSync(ARBITRATION_MATRIX_PATH, "utf8"));
const RECOVERY_ROWS = parseCsv(fs.readFileSync(RECOVERY_CASES_PATH, "utf8"));

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
      pathname = "/docs/frontend/157_autosave_status_strip_gallery.html";
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
            : filePath.endsWith(".mmd")
              ? "text/plain; charset=utf-8"
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
    url: `http://127.0.0.1:${port}/docs/frontend/157_autosave_status_strip_gallery.html`,
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

async function rootAttribute(page, name) {
  return await page.locator("[data-testid='patient-intake-mission-frame-root']").getAttribute(name);
}

async function waitForSaveState(page, expectedState, timeout = 5_000) {
  await page.waitForFunction(
    (state) =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute("data-save-state") === state,
    expectedState,
    { timeout },
  );
}

async function waitForFocusField(page, fieldKey, timeout = 5_000) {
  await page.waitForFunction(
    (key) => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) {
        return false;
      }
      return active.closest(`[data-focus-field="${key}"]`) !== null;
    },
    fieldKey,
    { timeout },
  );
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

async function setScenario(page, draftPublicId, scenario) {
  await page.evaluate(
    ({ draftPublicId: nextDraftPublicId, scenario: nextScenario, scenarioPrefix }) => {
      window.localStorage.setItem(`${scenarioPrefix}${nextDraftPublicId}`, JSON.stringify(nextScenario));
    },
    { draftPublicId, scenario, scenarioPrefix: SCENARIO_PREFIX },
  );
}

async function openRoute(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
}

async function typeAndBlur(page, inputTestId, value) {
  const input = page.locator(`[data-testid='${inputTestId}']`);
  await input.waitFor();
  await input.fill(value);
  await page.locator("[data-testid='patient-intake-summary-toggle']").focus();
}

async function assertNoOverflow(page, maxOverflow = 12) {
  const viewport = page.viewportSize();
  assertCondition(Boolean(viewport), "Viewport is unavailable.");
  const width = viewport?.width ?? 0;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  assertCondition(
    scrollWidth <= width + maxOverflow,
    `Layout overflowed horizontally: ${scrollWidth}px for viewport ${width}px.`,
  );
}

export async function run() {
  for (const requiredFile of [
    GALLERY_PATH,
    CONTRACT_PATH,
    ARBITRATION_MATRIX_PATH,
    RECOVERY_CASES_PATH,
    MERMAID_PATH,
  ]) {
    assertCondition(fs.existsSync(requiredFile), `Required artifact missing: ${requiredFile}`);
  }
  assertCondition(
    CONTRACT.contractId === "PHASE1_FRONTEND_SAVE_TRUTH_CONTRACT_V1",
    "Autosave contract id drifted.",
  );
  assertCondition(
    CONTRACT.primaryStates.map((entry) => entry.state).join("|") ===
      "saving|saved|review changes|resume safely",
    "Autosave primary state order drifted.",
  );
  assertCondition(
    ARBITRATION_ROWS.some((row) => row.rendered_state === "review changes"),
    "Arbitration matrix lost review changes.",
  );
  assertCondition(
    ARBITRATION_ROWS.some((row) => row.settlement_ack_state === "saved_authoritative"),
    "Arbitration matrix lost saved_authoritative.",
  );
  assertCondition(
    ARBITRATION_ROWS.some((row) => row.settlement_ack_state === "merge_required"),
    "Arbitration matrix lost merge_required.",
  );
  assertCondition(
    ARBITRATION_ROWS.some((row) => row.settlement_ack_state === "recovery_required"),
    "Arbitration matrix lost recovery_required.",
  );
  assertCondition(
    RECOVERY_ROWS.some((row) => row.case_id === "MERGE_REVIEW_CROSS_SESSION"),
    "Recovery matrix lost the merge case.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const galleryOrigin = new URL(galleryUrl).origin;
    const galleryExternal = new Set();
    trackExternalRequests(galleryPage, galleryOrigin, galleryExternal);

    await galleryPage.goto(galleryUrl, { waitUntil: "networkidle" });
    for (const testId of [
      "autosave-status-strip-gallery",
      "autosave-state-tabs",
      "autosave-state-preview",
      "autosave-arbitration-table",
      "autosave-recovery-cases-table",
      "autosave-diagram-parity-table",
    ]) {
      await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    await galleryPage.getByRole("button", { name: "Review changes" }).click();
    await galleryPage.locator("[data-testid='autosave-merge-sheet-preview']").waitFor();
    await galleryPage.getByRole("button", { name: "Resume safely" }).click();
    await galleryPage.locator("[data-testid='autosave-recovery-preview']").waitFor();
    await galleryPage.getByRole("button", { name: "Saved" }).click();
    await galleryPage.locator("[data-testid='autosave-continue-card-preview']").waitFor();
    const parityText = await galleryPage.locator("[data-testid='autosave-diagram-parity-table']").innerText();
    assertCondition(
      parityText.includes("saving") &&
        parityText.includes("saved") &&
        parityText.includes("review changes") &&
        parityText.includes("resume safely"),
      "Gallery parity table lost one of the canonical states.",
    );
    assertCondition(
      galleryExternal.size === 0,
      `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
    );
    await assertNoOverflow(galleryPage);
    await galleryPage.close();

    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      const page = await context.newPage();
      const draftPublicId = "dft_par157_saved_resume";
      await seedDraftMemory(page, baseUrl, draftPublicId, {
        requestType: "Results",
        structuredAnswers: { "results.context": "blood_test" },
        detailsCursorQuestionKey: "results.testName",
        completedStepKeys: ["request_type"],
      });
      const route = `/start-request/${draftPublicId}/details`;
      await openRoute(page, baseUrl, route);
      await page.locator("[data-testid='patient-intake-status-strip']").waitFor();
      await page.locator("[data-testid='patient-intake-save-label']").waitFor();
      await page.locator("[data-testid='input-results.testName']").fill("HbA1c");
      await waitForSaveState(page, "saving");
      assertCondition(
        (await rootAttribute(page, "data-hard-exit-warning")) === "true",
        "Hard-exit warning should be active while save is pending.",
      );
      const beforeUnloadResult = await page.evaluate(() => {
        const event = new Event("beforeunload", { cancelable: true });
        Object.defineProperty(event, "returnValue", {
          configurable: true,
          enumerable: true,
          writable: true,
          value: "",
        });
        window.dispatchEvent(event);
        return {
          defaultPrevented: event.defaultPrevented,
          returnValue: event.returnValue,
        };
      });
      assertCondition(
        beforeUnloadResult.defaultPrevented || String(beforeUnloadResult.returnValue ?? "").length > 0,
        "Beforeunload warning did not activate while unsynced work was present.",
      );
      await page.locator("[data-testid='patient-intake-summary-toggle']").focus();
      await waitForSaveState(page, "saved");
      assertCondition(
        (await rootAttribute(page, "data-hard-exit-warning")) === "false",
        "Hard-exit warning should clear after authoritative save.",
      );
      const selectedAnchorBeforeReload = await rootAttribute(page, "data-selected-anchor");
      await page.locator("[data-testid='input-results.testName']").focus();
      await waitForFocusField(page, "results.testName");
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
      await waitForSaveState(page, "saved");
      assertCondition(
        page.url().endsWith(route),
        "Refresh resume lost the current step route.",
      );
      assertCondition(
        (await rootAttribute(page, "data-selected-anchor")) === selectedAnchorBeforeReload,
        "Refresh resume lost the selected anchor.",
      );
      await waitForFocusField(page, "results.testName");
      await page.goto(`${baseUrl}/start-request`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='patient-intake-continue-card']").waitFor();
      const continueText = await page.locator("[data-testid='patient-intake-continue-card']").innerText();
      assertCondition(
        continueText.includes("Continue your request"),
        "Continue card did not appear on landing after save.",
      );
      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      const page = await context.newPage();
      const draftPublicId = "dft_par157_blocked_continuity";
      await seedDraftMemory(page, baseUrl, draftPublicId, {
        requestType: "Results",
        structuredAnswers: { "results.context": "blood_test" },
        detailsCursorQuestionKey: "results.testName",
        completedStepKeys: ["request_type"],
      });
      await setScenario(page, draftPublicId, {
        continuityBlockedAfterNextSave: true,
        reasonCodes: ["CONTINUITY_EVIDENCE_STALE"],
      });
      await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
      await typeAndBlur(page, "input-results.testName", "Inflammation marker");
      await waitForSaveState(page, "resume safely");
      await page.locator("[data-testid='patient-intake-status-strip']").waitFor();
      await page.locator("[data-testid='patient-intake-save-label']").waitFor();
      assertCondition(
        (await rootAttribute(page, "data-suppress-saved-reason")) === "continuity_evidence_not_trusted",
        "Saved suppression reason did not match continuity blocking.",
      );
      await page.locator("[data-testid='patient-intake-save-action']").waitFor();
      const actionLabel = await page.locator("[data-testid='patient-intake-save-action']").innerText();
      assertCondition(actionLabel === "Resume safely", "Blocked continuity action drifted.");
      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 960 } });
      const pageOne = await context.newPage();
      const pageTwo = await context.newPage();
      const draftPublicId = "dft_par157_merge_conflict";
      await seedDraftMemory(pageOne, baseUrl, draftPublicId, {
        requestType: "Results",
        structuredAnswers: { "results.context": "blood_test" },
        detailsCursorQuestionKey: "results.testName",
        completedStepKeys: ["request_type"],
      });
      await openRoute(pageOne, baseUrl, `/start-request/${draftPublicId}/request-type`);
      await openRoute(pageTwo, baseUrl, `/start-request/${draftPublicId}/details`);
      await pageTwo.locator("[data-testid='input-results.testName']").fill("CRP");
      await waitForSaveState(pageTwo, "saving");
      await pageOne.locator("[data-testid='request-type-card-Admin']").click();
      await pageTwo.locator("[data-testid='patient-intake-merge-sheet']").waitFor();
      await waitForSaveState(pageTwo, "review changes");
      await pageTwo.locator("[data-testid='patient-intake-save-action']").press("Enter");
      await pageTwo.waitForFunction(
        () => document.activeElement?.getAttribute("data-testid") === "patient-intake-merge-sheet",
      );
      await pageTwo.locator("[data-testid='patient-intake-merge-choice-answers-keep-local']").focus();
      await pageTwo.keyboard.press("Enter");
      await pageTwo.locator("[data-testid='patient-intake-merge-confirm']").focus();
      await pageTwo.keyboard.press("Enter");
      await pageTwo.waitForFunction(
        () => !document.querySelector("[data-testid='patient-intake-merge-sheet']"),
        undefined,
        { timeout: 5_000 },
      );
      await context.close();
    }

    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      const page = await context.newPage();
      const draftPublicId = "dft_par157_recovery";
      await seedDraftMemory(page, baseUrl, draftPublicId, {
        requestType: "Results",
        structuredAnswers: { "results.context": "blood_test" },
        detailsCursorQuestionKey: "results.testName",
        completedStepKeys: ["request_type"],
      });
      await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
      await typeAndBlur(page, "input-results.testName", "Ferritin");
      await waitForSaveState(page, "saved");
      await setScenario(page, draftPublicId, {
        leaseExpired: true,
        recoveryReason: "lease_expired",
      });
      await typeAndBlur(page, "input-results.testName", "Ferritin follow-up");
      await waitForSaveState(page, "resume safely");
      await page.locator("[data-testid='patient-intake-save-action']").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("data-testid") === "patient-intake-recovery-bridge",
      );
      await page.locator("[data-testid='patient-intake-recovery-action']").click();
      await waitForSaveState(page, "saved");
      assertCondition(
        page.url().endsWith(`/start-request/${draftPublicId}/details`),
        "Recovery bridge did not keep the same-lineage route.",
      );
      await context.close();
    }

    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 960 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const draftPublicId = "dft_par157_reduced_motion";
      await seedDraftMemory(page, baseUrl, draftPublicId, {
        requestType: "Results",
        structuredAnswers: { "results.context": "blood_test" },
        detailsCursorQuestionKey: "results.testName",
        completedStepKeys: ["request_type"],
      });
      await openRoute(page, baseUrl, `/start-request/${draftPublicId}/details`);
      assertCondition(
        (await rootAttribute(page, "data-reduced-motion")) === "true",
        "Reduced-motion contract did not reach the root shell.",
      );
      await typeAndBlur(page, "input-results.testName", "TSH");
      await waitForSaveState(page, "saved");
      await context.close();
    }
  } finally {
    await closeServer(server);
    await stopPatientWeb(child);
    await browser.close();
  }
}

const entryPointPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const isDirectRun = entryPointPath === __filename;

if (isDirectRun) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
