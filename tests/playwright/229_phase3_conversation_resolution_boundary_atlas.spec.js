import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const HTML_PATH = path.join(ROOT, "docs", "frontend", "229_phase3_conversation_resolution_boundary_atlas.html");
const STATE_MATRIX_PATH = path.join(ROOT, "data", "analysis", "229_callback_and_message_state_matrix.csv");
const BOUNDARY_CASES_PATH = path.join(ROOT, "data", "analysis", "229_selfcare_admin_boundary_cases.csv");
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "229_conversation_resolution_gap_log.json");
const SUBTYPES_PATH = path.join(ROOT, "data", "contracts", "229_admin_resolution_subtype_profiles.yaml");
const CONVERSATION_CLUSTER_PATH = path.join(ROOT, "data", "contracts", "229_patient_conversation_cluster.schema.json");
const COMPOSER_LEASE_PATH = path.join(ROOT, "data", "contracts", "229_patient_composer_lease.schema.json");
const URGENT_DIVERSION_PATH = path.join(ROOT, "data", "contracts", "229_patient_urgent_diversion_state.schema.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const phase3ConversationResolutionBoundaryAtlasCoverage = [
  "Conversation_Resolution_Boundary_Atlas",
  "CallbackLifecycleLadder",
  "MessageThreadLadder",
  "PatientConversationBraid",
  "SelfCareBoundaryTriad",
  "AdminSubtypeCompletionLadder",
  "lifecycle selection sync",
  "patient-visible promise state rendering",
  "boundary and subtype selection sync",
  "keyboard traversal and landmarks",
  "reduced-motion equivalence",
  "diagram/table parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
    return Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""]));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw new Error("This spec requires the `playwright` package when run with --run.");
  }
}

function loadExpected() {
  for (const filePath of [
    HTML_PATH,
    STATE_MATRIX_PATH,
    BOUNDARY_CASES_PATH,
    GAP_LOG_PATH,
    SUBTYPES_PATH,
    CONVERSATION_CLUSTER_PATH,
    COMPOSER_LEASE_PATH,
    URGENT_DIVERSION_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_229 artifact ${filePath}`);
  }

  const stateMatrix = parseCsv(fs.readFileSync(STATE_MATRIX_PATH, "utf8"));
  const callbackRows = [];
  const messageRows = [];
  const callbackSeen = new Set();
  const messageSeen = new Set();
  for (const row of stateMatrix) {
    if (row.domain === "callback" && !callbackSeen.has(row.stateId)) {
      callbackSeen.add(row.stateId);
      callbackRows.push(row);
    }
    if (row.domain === "message" && !messageSeen.has(row.stateId)) {
      messageSeen.add(row.stateId);
      messageRows.push(row);
    }
  }

  return {
    callbackRows,
    messageRows,
    boundaryRows: parseCsv(fs.readFileSync(BOUNDARY_CASES_PATH, "utf8")),
    gapLog: JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8")),
    subtypeProfiles: JSON.parse(fs.readFileSync(SUBTYPES_PATH, "utf8")),
    clusterSchema: JSON.parse(fs.readFileSync(CONVERSATION_CLUSTER_PATH, "utf8")),
    composerSchema: JSON.parse(fs.readFileSync(COMPOSER_LEASE_PATH, "utf8")),
    urgentSchema: JSON.parse(fs.readFileSync(URGENT_DIVERSION_PATH, "utf8")),
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/229_phase3_conversation_resolution_boundary_atlas.html";
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
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local seq_229 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/229_phase3_conversation_resolution_boundary_atlas.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openAtlas(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Conversation_Resolution_Boundary_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertMetricsAndParity(page, expected) {
  for (const testId of [
    "CallbackLifecycleLadder",
    "MessageThreadLadder",
    "PatientConversationBraid",
    "SelfCareBoundaryTriad",
    "AdminSubtypeCompletionLadder",
    "CallbackStateParityTable",
    "MessageStateParityTable",
    "ConversationPromiseParityTable",
    "BoundaryCaseTable",
    "AdminSubtypeParityTable",
    "SchemaParityTable",
    "GapClosureTable",
    "ArtifactRegistryTable",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    Number((await page.locator("[data-testid='metric-callback-count']").innerText()).trim()) ===
      expected.callbackRows.length,
    "Callback metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-message-count']").innerText()).trim()) ===
      expected.messageRows.length,
    "Message metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-boundary-count']").innerText()).trim()) ===
      expected.boundaryRows.length,
    "Boundary metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-subtype-count']").innerText()).trim()) ===
      expected.subtypeProfiles.subtypes.length,
    "Subtype metric drifted.",
  );

  assertCondition(
    (await page.locator("[data-testid^='callback-state-']").count()) === expected.callbackRows.length,
    "Callback ladder count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='callback-row-']").count()) === expected.callbackRows.length,
    "Callback parity count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='message-state-']").count()) === expected.messageRows.length,
    "Message ladder count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='message-row-']").count()) === expected.messageRows.length,
    "Message parity count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='boundary-row-']").count()) === expected.boundaryRows.length,
    "Boundary table count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='subtype-row-']").count()) === expected.subtypeProfiles.subtypes.length,
    "Subtype table count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='gap-row-']").count()) === expected.gapLog.gaps.length,
    "Gap table count drifted.",
  );
}

async function assertLifecycleSelectionSync(page) {
  await page.locator("[data-testid='callback-filter-awaiting_outcome_evidence']").click();
  assertCondition(
    (await page.locator("[data-testid='callback-state-awaiting_outcome_evidence']").getAttribute("data-selected")) ===
      "true",
    "Callback ladder did not synchronize to the selected filter.",
  );
  assertCondition(
    (await page.locator("[data-testid='callback-row-awaiting_outcome_evidence']").getAttribute("data-selected")) ===
      "true",
    "Callback parity table did not synchronize to the selected filter.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-promise-state']").innerText()).includes("attempting_now"),
    "Callback patient promise did not render from the selected state.",
  );

  await page.locator("[data-testid='message-filter-delivery_failed']").click();
  assertCondition(
    (await page.locator("[data-testid='message-state-delivery_failed']").getAttribute("data-selected")) === "true",
    "Message ladder did not synchronize to the selected filter.",
  );
  assertCondition(
    (await page.locator("[data-testid='message-row-delivery_failed']").getAttribute("data-selected")) === "true",
    "Message parity table did not synchronize to the selected filter.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-promise-state']").innerText()).includes("delivery_repair_required"),
    "Message patient promise did not render from the selected state.",
  );
}

async function assertBoundaryAndSubtypeSelection(page) {
  await page.locator("[data-testid='boundary-filter-BOUNDARY_ADMIN_FORM']").click();
  assertCondition(
    (await page.locator("[data-testid='boundary-row-BOUNDARY_ADMIN_FORM']").getAttribute("data-selected")) === "true",
    "Boundary table did not synchronize to the selected case.",
  );
  assertCondition(
    (await page.locator("[data-testid='subtype-filter-form_workflow']").getAttribute("data-selected")) === "true",
    "Subtype filter did not synchronize from boundary selection.",
  );
  assertCondition(
    (await page.locator("[data-testid='admin-subtype-form_workflow']").getAttribute("data-selected")) === "true",
    "Admin subtype ladder did not synchronize from boundary selection.",
  );

  await page.locator("[data-testid='subtype-filter-registration_or_demographic_update']").click();
  assertCondition(
    (await page.locator("[data-testid='subtype-row-registration_or_demographic_update']").getAttribute("data-selected")) ===
      "true",
    "Subtype table did not synchronize to subtype selection.",
  );
  assertCondition(
    (await page.locator("[data-testid='boundary-row-BOUNDARY_ADMIN_DEMOGRAPHIC']").getAttribute("data-selected")) ===
      "true",
    "Boundary case did not synchronize from subtype selection.",
  );
}

async function assertKeyboardAndLandmarks(page) {
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  assertCondition(focusedId === "atlas-main", "Skip link did not move focus to the main atlas region.");

  await page.keyboard.press("Tab");
  const callbackStateFocused = await page.evaluate(
    () => document.activeElement?.getAttribute("data-testid") === "callback-state-created",
  );
  assertCondition(callbackStateFocused, "Tab order did not reach the callback lifecycle controls.");

  assertCondition((await page.locator("header[role='banner']").count()) === 1, "Banner landmark missing.");
  assertCondition((await page.locator("nav[aria-label='Atlas filters']").count()) === 1, "Filter navigation missing.");
  assertCondition((await page.locator("main#atlas-main").count()) === 1, "Main landmark missing.");
  assertCondition((await page.locator("aside[aria-label='Selection inspector']").count()) === 1, "Inspector landmark missing.");
}

async function assertReducedMotion(browserType, url) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await openAtlas(page, url);
  assertCondition(
    (await page.locator("html").getAttribute("data-motion")) === "reduced",
    "Reduced-motion mode did not propagate into the atlas.",
  );
  await screenshot(page, "output/playwright/229-phase3-conversation-resolution-boundary-atlas-reduced.png");
  await context.close();
  await browser.close();
}

async function run() {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }
  const expected = loadExpected();
  const serverInfo = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
    await openAtlas(page, serverInfo.url);
    await assertMetricsAndParity(page, expected);
    await assertLifecycleSelectionSync(page);
    await assertBoundaryAndSubtypeSelection(page);
    await assertKeyboardAndLandmarks(page);
    await screenshot(page, "output/playwright/229-phase3-conversation-resolution-boundary-atlas-default.png");
    await assertReducedMotion(playwright.chromium, serverInfo.url);
  } finally {
    try {
      await browser.close();
    } catch {}
    await closeServer(serverInfo.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
