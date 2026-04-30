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
const GALLERY_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "156_request_type_and_question_flow_gallery.html",
);
const MERMAID_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "156_question_tree_and_anchor_continuity.mmd",
);
const UI_CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "156_progressive_question_ui_contract.json",
);
const VISIBILITY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "156_question_visibility_and_supersession_matrix.csv",
);
const COMPATIBILITY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "156_bundle_resume_compatibility_matrix.csv",
);

const MEMORY_PREFIX = "patient-intake-mission-frame::";

export const requestTypeProgressiveFlowCoverage = [
  "request-type selection at desktop, tablet, and mobile widths",
  "keyboard-only traversal and confirm-and-supersede request-type changes",
  "conditional reveal behavior across Symptoms, Meds, Admin, and Results",
  "summary-chip updates after hidden branch answers are superseded",
  "safety-relevant supersession prompting review before submit",
  "resume-compatibility postures for resume_compatible, review_migration_required, and blocked",
  "bounded helper disclosure behavior and deterministic data-testid markers",
  "reduced-motion equivalence and gallery diagram/table parity",
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

function loadExpected() {
  const uiContract = JSON.parse(fs.readFileSync(UI_CONTRACT_PATH, "utf8"));
  const visibilityRows = parseCsv(fs.readFileSync(VISIBILITY_MATRIX_PATH, "utf8"));
  const compatibilityRows = parseCsv(fs.readFileSync(COMPATIBILITY_MATRIX_PATH, "utf8"));
  return {
    uiContract,
    requestTypeCount: uiContract.requestTypeUiProfiles.length,
    visibilityRowCount: visibilityRows.length,
    compatibilityRows,
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
      pathname = "/docs/frontend/156_request_type_and_question_flow_gallery.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/156_request_type_and_question_flow_gallery.html`,
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

async function waitForRootAttribute(page, name, expected, message, timeoutMs = 3_000) {
  const startedAt = Date.now();
  let latest = null;
  while (Date.now() - startedAt < timeoutMs) {
    latest = await rootAttribute(page, name);
    if (latest === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${message} Last observed ${name}: ${latest}`);
}

async function clickPrimaryAndWaitForProgress(page, timeoutMs = 3_000) {
  const before = await page
    .locator("[data-testid='patient-intake-mission-frame-root']")
    .evaluate((root) => ({
      questionKey: root.getAttribute("data-current-question-key"),
      routeKey: root.getAttribute("data-route-key"),
    }));
  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await page.waitForFunction(
    (previous) => {
      const root = document.querySelector("[data-testid='patient-intake-mission-frame-root']");
      return (
        root?.getAttribute("data-route-key") !== previous.routeKey ||
        root?.getAttribute("data-current-question-key") !== previous.questionKey
      );
    },
    before,
    { timeout: timeoutMs },
  );
}

async function waitForFocusTarget(page, focusTarget) {
  await page.waitForFunction(
    (target) => document.activeElement?.getAttribute("data-focus-target") === target,
    focusTarget,
  );
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

async function seedDraftMemory(page, baseUrl, draftPublicId, partialMemory) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
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

async function openDraftRoute(page, baseUrl, draftPublicId, routeSuffix) {
  await page.goto(`${baseUrl}/start-request/${draftPublicId}/${routeSuffix}`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
}

async function summaryPanelText(page) {
  return await page.locator("[data-testid='patient-intake-summary-panel']").innerText();
}

async function clickSummaryToggle(page) {
  const toggle = page.locator("[data-testid='patient-intake-summary-toggle']");
  await toggle.evaluate((node) => node.scrollIntoView({ block: "center", inline: "center" }));
  await toggle.click({ force: true });
}

async function waitForSummaryIncludes(page, expectedSnippets, message, timeoutMs = 3_000) {
  const startedAt = Date.now();
  let latest = "";
  while (Date.now() - startedAt < timeoutMs) {
    latest = await summaryPanelText(page);
    if (expectedSnippets.every((snippet) => latest.includes(snippet))) {
      return latest;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${message} Last observed summary: ${latest}`);
}

async function waitForSummaryExcludes(page, excludedSnippets, message, timeoutMs = 3_000) {
  const startedAt = Date.now();
  let latest = "";
  while (Date.now() - startedAt < timeoutMs) {
    latest = await summaryPanelText(page);
    if (excludedSnippets.every((snippet) => !latest.includes(snippet))) {
      return latest;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${message} Last observed summary: ${latest}`);
}

async function helperOpenCount(page) {
  return await page.locator("[data-testid='patient-intake-helper-region'][open]").count();
}

async function currentRouteKey(page) {
  return await rootAttribute(page, "data-route-key");
}

async function currentQuestionKey(page) {
  return await rootAttribute(page, "data-current-question-key");
}

async function runDesktopMainJourney(page, baseUrl) {
  const draftPublicId = "dft_par156_main";
  const externalRequests = new Set();
  trackExternalRequests(page, baseUrl, externalRequests);

  await openDraftRoute(page, baseUrl, draftPublicId, "request-type");
  await page.locator("[data-testid='patient-intake-request-type-grid']").waitFor();
  await page.locator("[data-testid='patient-intake-question-stem']").waitFor();
  assertCondition(
    (await page.locator("[data-testid^='request-type-card-']").count()) === 4,
    "Request-type grid no longer renders the canonical four request types.",
  );
  await waitForFocusTarget(page, "request-type-heading");
  assertCondition(
    (await rootAttribute(page, "data-selected-anchor")) === "request-start",
    "Request-type route lost the request-start anchor.",
  );

  await page.locator("[data-testid='request-type-card-Symptoms']").focus();
  await page.locator("[data-testid='request-type-card-Symptoms']").press("ArrowRight");
  assertCondition(
    (await page.locator("[data-testid='request-type-card-Meds']").getAttribute("data-pending")) ===
      "true",
    "ArrowRight did not queue the Meds request type as the pending keyboard selection.",
  );
  await page.locator("[data-testid='request-type-change-confirm']").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute("data-current-question-key") === "meds.queryType",
  );
  assertCondition(
    (await page.locator("[data-testid='request-type-card-Meds']").getAttribute("data-active")) ===
      "true",
    "Confirming the request-type change did not activate the Meds card.",
  );
  assertCondition(
    (await currentQuestionKey(page)) === "meds.queryType",
    "Request-type confirmation did not reset the question flow to the Meds root question.",
  );

  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await page.locator("[data-testid='patient-intake-details-step']").waitFor();
  await page.locator("[data-testid='question-field-meds.queryType']").waitFor();
  await waitForFocusTarget(page, "details-heading");
  assertCondition(
    (await rootAttribute(page, "data-selected-anchor")) === "request-proof",
    "Details route lost the request-proof anchor.",
  );
  await page.locator("[data-testid='answer-meds.queryType-repeat_supply']").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='answer-meds.queryType-repeat_supply']")
        ?.getAttribute("data-active") === "true",
  );
  await page.locator("[data-testid='patient-intake-primary-action']").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute("data-current-question-key") === "meds.nameKnown",
  );
  assertCondition(
    (await currentQuestionKey(page)) === "meds.nameKnown",
    "Continuing from the Meds query type did not advance to meds.nameKnown.",
  );

  await page.locator("[data-testid='answer-meds.nameKnown-unknown_or_unsure']").click();
  await page.locator("[data-testid='patient-intake-reveal-patch-region']").waitFor();
  await page.locator("[data-testid='question-field-meds.nameUnknownReason']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='question-field-meds.medicineName']").count()) === 0,
    "Unknown medicine posture still renders the medicineName field.",
  );
  await page.locator("[data-testid='patient-intake-helper-region'] summary").first().click();
  assertCondition(
    (await helperOpenCount(page)) === 1,
    "Helper disclosures no longer stay bounded to one open region.",
  );
  await page.locator("[data-testid='answer-meds.nameUnknownReason-label_not_available']").click();
  await waitForSummaryIncludes(
    page,
    ["Repeat supply", "The label or packaging is not available"],
    "The active summary stopped reflecting the live Meds branch answers.",
  );

  await page.locator("[data-testid='progress-node-request_type']").click();
  await page.locator("[data-testid='patient-intake-request-type-grid']").waitFor();
  await page.locator("[data-testid='request-type-card-Results']").click();
  await page.locator("[data-testid='patient-intake-review-delta-notice']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='request-type-change-confirm']").count()) === 1,
    "Mid-draft request-type changes no longer require an explicit confirm path.",
  );
  await page.locator("[data-testid='request-type-change-confirm']").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='patient-intake-mission-frame-root']")
        ?.getAttribute("data-current-question-key") === "results.context",
  );
  assertCondition(
    (await currentQuestionKey(page)) === "results.context",
    "Confirm-and-supersede did not reset the flow to the Results root question.",
  );
  await waitForSummaryExcludes(
    page,
    ["Repeat supply", "The label or packaging is not available"],
    "Superseded Meds answers leaked into the active summary after a request-type change.",
  );

  await assertNoOverflow(page);
  assertCondition(
    externalRequests.size === 0,
    `Patient web made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
  );
}

async function runSymptomsSafetyScenario(page, baseUrl, uiContract) {
  const draftPublicId = "dft_par156_symptoms";
  await openDraftRoute(page, baseUrl, draftPublicId, "details");
  await page.locator("[data-testid='question-field-symptoms.category']").waitFor();
  await page.locator("[data-testid='question-field-symptoms.chestPainLocation']").waitFor();
  const beforeSummary = await summaryPanelText(page);
  assertCondition(
    beforeSummary.includes("Centre chest"),
    "Initial symptom summary lost the chest-pain branch context.",
  );

  await page.locator("[data-testid='answer-symptoms.category-general']").click();
  await page.locator("[data-testid='patient-intake-review-delta-notice']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='question-field-symptoms.chestPainLocation']").count()) === 0,
    "Changing the symptom category did not hide the superseded chest-pain branch.",
  );
  const noticeText = await page
    .locator("[data-testid='patient-intake-review-delta-notice']")
    .innerText();
  assertCondition(
    noticeText.includes(uiContract.requestTypeChangePolicy.safetyReviewTitle),
    "Safety-relevant supersession no longer surfaces the canonical review cue.",
  );
  const afterSummary = await summaryPanelText(page);
  assertCondition(
    !afterSummary.includes("Centre chest"),
    "Safety-relevant superseded answers still appear in the active summary.",
  );

  for (let index = 0; index < 6 && (await currentRouteKey(page)) === "details"; index += 1) {
    await clickPrimaryAndWaitForProgress(page);
  }
  if ((await currentRouteKey(page)) === "supporting_files") {
    await clickPrimaryAndWaitForProgress(page);
  }
  if ((await currentRouteKey(page)) === "contact_preferences") {
    await clickPrimaryAndWaitForProgress(page);
  }
  await waitForRootAttribute(
    page,
    "data-route-key",
    "review_submit",
    "The Symptoms safety-review scenario failed to reach the review step.",
  );
  await page.locator("[data-testid='patient-intake-review-step']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='patient-intake-primary-action']").innerText()).trim() ===
      "Acknowledge changes",
    "Safety-relevant supersession no longer blocks submit behind the acknowledgement step.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-intake-review-delta-notice']").count()) === 1,
    "The review step lost the delta notice for a safety-relevant supersession.",
  );
}

async function runAdminTabletScenario(page, baseUrl) {
  const draftPublicId = "dft_par156_admin";
  await seedDraftMemory(page, baseUrl, draftPublicId, {
    requestType: "Admin",
    structuredAnswers: {
      "admin.supportType": "fit_note",
      "admin.deadlineKnown": "deadline_known",
      "admin.deadlineDate": "2026-04-20",
    },
    detailsCursorQuestionKey: "admin.deadlineKnown",
    reviewAffirmed: true,
  });
  await openDraftRoute(page, baseUrl, draftPublicId, "details");
  await page.locator("[data-testid='question-field-admin.deadlineKnown']").waitFor();
  await page.locator("[data-testid='question-field-admin.deadlineDate']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='patient-intake-summary-panel']")
      .getAttribute("data-summary-mode")) === "drawer",
    "Tablet summary mode drifted away from the drawer posture.",
  );

  await page.locator("[data-testid='answer-admin.deadlineKnown-no_deadline']").click();
  await page.locator("[data-testid='patient-intake-review-delta-notice']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='question-field-admin.deadlineDate']").count()) === 0,
    "Admin deadlineDate did not disappear after switching to no_deadline.",
  );
  await clickSummaryToggle(page);
  assertCondition(
    (await page
      .locator("[data-testid='patient-intake-summary-panel']")
      .getAttribute("data-open")) === "true",
    "Tablet summary drawer did not open from the summary toggle.",
  );
  const summaryText = await summaryPanelText(page);
  assertCondition(
    !summaryText.includes("2026-04-20"),
    "Admin superseded deadlineDate still appears in the drawer summary.",
  );
  await assertNoOverflow(page);
}

async function runResultsMobileScenario(page, baseUrl) {
  const draftPublicId = "dft_par156_results";
  await seedDraftMemory(page, baseUrl, draftPublicId, {
    requestType: "Results",
    structuredAnswers: {
      "results.context": "blood_test",
      "results.testName": "HbA1c",
      "results.dateKnown": "exact_or_approx",
      "results.resultDate": "2026-04",
    },
    detailsCursorQuestionKey: "results.dateKnown",
    reviewAffirmed: true,
  });
  await openDraftRoute(page, baseUrl, draftPublicId, "details");
  await page.locator("[data-testid='question-field-results.dateKnown']").waitFor();
  await page.locator("[data-testid='question-field-results.resultDate']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='patient-intake-summary-panel']")
      .getAttribute("data-summary-mode")) === "sheet",
    "Mobile summary mode drifted away from the sheet posture.",
  );

  const dateNotSureAnswer = page.locator("[data-testid='answer-results.dateKnown-not_sure']");
  await dateNotSureAnswer.click({ force: true });
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='answer-results.dateKnown-not_sure']")
        ?.getAttribute("data-active") === "true",
  );
  await page.locator("[data-testid='patient-intake-review-delta-notice']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='question-field-results.resultDate']").count()) === 0,
    "Results resultDate did not disappear after switching to not_sure.",
  );
  await clickSummaryToggle(page);
  assertCondition(
    (await page
      .locator("[data-testid='patient-intake-summary-panel']")
      .getAttribute("data-open")) === "true",
    "Mobile summary sheet did not open from the summary toggle.",
  );
  await assertNoOverflow(page, 18);
}

async function runCompatibilityScenarios(page, baseUrl, compatibilityRows) {
  const scenarios = [
    {
      draftPublicId: "dft_par156_resume_ok",
      mode: "resume_compatible",
      expectRouteAfterPrimary: "review_submit",
    },
    {
      draftPublicId: "dft_par156_resume_review",
      mode: "review_migration_required",
      expectRouteAfterPrimary: "review_submit",
    },
    {
      draftPublicId: "dft_par156_resume_blocked",
      mode: "blocked",
      expectRouteAfterPrimary: "resume_recovery",
    },
  ];

  for (const scenario of scenarios) {
    const compatibility = compatibilityRows.find(
      (entry) => entry.compatibility_mode === scenario.mode,
    );
    assertCondition(Boolean(compatibility), `Missing compatibility row for ${scenario.mode}.`);
    await seedDraftMemory(page, baseUrl, scenario.draftPublicId, {
      requestType: "Symptoms",
      bundleCompatibilityMode: scenario.mode,
      bundleCompatibilityScenarioId: compatibility.scenario_id,
      reviewAffirmed: true,
    });
    await openDraftRoute(page, baseUrl, scenario.draftPublicId, "recovery");
    await page.locator("[data-testid='patient-intake-bundle-compatibility-sheet']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-bundle-compatibility-mode")) === scenario.mode,
      `Root bundle compatibility mode drifted for ${scenario.mode}.`,
    );
    const sheetText = await page
      .locator("[data-testid='patient-intake-bundle-compatibility-sheet']")
      .innerText();
    assertCondition(
      sheetText.includes(compatibility.title),
      `Compatibility sheet lost the canonical title for ${scenario.mode}.`,
    );
    const primaryLabel = (
      await page.locator("[data-testid='patient-intake-primary-action']").innerText()
    ).trim();
    assertCondition(
      primaryLabel === compatibility.dominant_action,
      `Recovery primary CTA drifted for ${scenario.mode}.`,
    );
    await page.locator("[data-testid='patient-intake-primary-action']").click();
    await page.waitForFunction(
      ([expectedRouteKey]) =>
        document
          .querySelector("[data-testid='patient-intake-mission-frame-root']")
          ?.getAttribute("data-route-key") === expectedRouteKey,
      [scenario.expectRouteAfterPrimary],
    );
    assertCondition(
      (await currentRouteKey(page)) === scenario.expectRouteAfterPrimary,
      `Recovery primary action routed incorrectly for ${scenario.mode}.`,
    );
  }
}

async function runReducedMotionScenario(page, baseUrl) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDraftRoute(page, baseUrl, "dft_par156_reduce", "request-type");
  await page.locator("[data-testid='patient-intake-request-type-grid']").waitFor();
  assertCondition(
    (await rootAttribute(page, "data-reduced-motion")) === "true",
    "Reduced-motion posture did not propagate to the mission-frame root.",
  );
  assertCondition(
    (await page.locator("[data-testid^='request-type-card-']").count()) === 4,
    "Reduced-motion rendering changed the request-type grid cardinality.",
  );
  await page.locator("[data-testid='request-type-card-Symptoms']").focus();
  await page.locator("[data-testid='request-type-card-Symptoms']").press("ArrowRight");
  assertCondition(
    (await page.locator("[data-testid='request-type-card-Meds']").getAttribute("data-pending")) ===
      "true",
    "Reduced-motion mode changed keyboard request-type traversal semantics.",
  );
}

export async function run() {
  for (const requiredPath of [
    GALLERY_PATH,
    MERMAID_PATH,
    UI_CONTRACT_PATH,
    VISIBILITY_MATRIX_PATH,
    COMPATIBILITY_MATRIX_PATH,
  ]) {
    assertCondition(
      fs.existsSync(requiredPath),
      `Missing required par_156 artifact: ${requiredPath}`,
    );
  }
  const expected = loadExpected();
  assertCondition(
    expected.requestTypeCount === 4,
    "The UI contract no longer publishes four request types.",
  );
  assertCondition(expected.visibilityRowCount > 0, "Visibility matrix is empty.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const galleryExternal = new Set();
    const galleryOrigin = new URL(galleryUrl).origin;
    trackExternalRequests(galleryPage, galleryOrigin, galleryExternal);

    await galleryPage.goto(galleryUrl, { waitUntil: "networkidle" });
    for (const testId of [
      "request-type-flow-gallery",
      "request-type-gallery-grid",
      "question-frame-gallery",
      "question-tree-diagram",
      "question-tree-table",
      "request-type-gallery-route-grid",
      "supersession-gallery-notice",
      "compatibility-sheet-gallery",
    ]) {
      await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    assertCondition(
      (await galleryPage.locator(".signal-card").count()) === expected.requestTypeCount,
      "Gallery request-type signal grid drifted from the canonical request-type count.",
    );
    const galleryText = await galleryPage
      .locator("[data-testid='request-type-flow-gallery']")
      .innerText();
    assertCondition(
      galleryText.includes("/start-request") &&
        galleryText.includes("same-shell") &&
        galleryText.includes("request-proof"),
      "Gallery lost the implemented route alias, same-shell language, or request-proof anchor reference.",
    );
    await galleryPage.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(galleryPage, 18);
    assertCondition(
      galleryExternal.size === 0,
      `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
    );
    await galleryPage.close();

    const desktopPage = await browser.newPage({ viewport: { width: 1480, height: 1100 } });
    await runDesktopMainJourney(desktopPage, baseUrl);
    await desktopPage.close();

    const symptomsPage = await browser.newPage({ viewport: { width: 1320, height: 1080 } });
    await runSymptomsSafetyScenario(symptomsPage, baseUrl, expected.uiContract);
    await symptomsPage.close();

    const adminPage = await browser.newPage({ viewport: { width: 960, height: 1000 } });
    await runAdminTabletScenario(adminPage, baseUrl);
    await adminPage.close();

    const resultsPage = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await runResultsMobileScenario(resultsPage, baseUrl);
    await resultsPage.close();

    const compatibilityPage = await browser.newPage({ viewport: { width: 1320, height: 1024 } });
    await runCompatibilityScenarios(compatibilityPage, baseUrl, expected.compatibilityRows);
    await compatibilityPage.close();

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1320, height: 960 } });
    await runReducedMotionScenario(reducedMotionPage, baseUrl);
    await reducedMotionPage.close();
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
}
