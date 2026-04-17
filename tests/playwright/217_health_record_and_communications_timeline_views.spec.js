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
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "217_health_record_and_communications_atlas.html",
);
const GRAMMAR_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "217_record_and_conversation_visual_grammar.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "217_health_record_and_communications_ui_contract.json",
);
const RECORD_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "217_record_chart_table_fallback_matrix.csv",
);
const MESSAGE_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "217_message_visibility_placeholder_cases.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const healthRecordCommunicationsCoverage = [
  "Quiet_Clinical_Correspondence",
  "RecordOverviewSection",
  "ResultInterpretationHero",
  "TrendParitySwitcher",
  "RecordArtifactPanel",
  "RecordVisibilityPlaceholder",
  "ConversationClusterList",
  "ConversationBraid",
  "MessagePreviewCard",
  "ReceiptStateChip",
  "DeliveryDisputeNotice",
  "records overview summary-first",
  "result detail fixed six-part order",
  "chart/table fallback parity",
  "document source authority posture",
  "conversation cluster chronology",
  "delivery failure and provider dispute visibility",
  "keyboard traversal and focus restoration",
  "ARIA snapshots",
  "mobile and reduced-motion screenshots",
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
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
        reject(new Error("Unable to allocate local port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startPatientWeb() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));
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
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/217_health_record_and_communications_atlas.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });
  return {
    server,
    atlasUrl: `http://127.0.0.1:${port}/docs/frontend/217_health_record_and_communications_atlas.html`,
    grammarUrl: `http://127.0.0.1:${port}/docs/frontend/217_record_and_conversation_visual_grammar.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

function getExpected() {
  for (const filePath of [
    ATLAS_PATH,
    GRAMMAR_PATH,
    CONTRACT_PATH,
    RECORD_MATRIX_PATH,
    MESSAGE_CASES_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing task 217 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(RECORD_MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(MESSAGE_CASES_PATH, "utf8"));
  assertCondition(
    contract.visualMode === "Quiet_Clinical_Correspondence",
    "Contract visual mode drifted.",
  );
  assertCondition(matrix.length >= 12, "Record fallback matrix needs all critical states.");
  assertCondition(cases.cases.length >= 8, "Message visibility cases missing.");
  return { contract, matrix, cases };
}

async function screenshot(page, relativePath) {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function openApp(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Health_Record_Communications_Route']").waitFor();
}

async function assertRecords(page, baseUrl) {
  await openApp(page, baseUrl, "/records");
  const root = page.locator("[data-testid='Health_Record_Communications_Route']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Quiet_Clinical_Correspondence",
    "Wrong visual mode.",
  );
  await page.locator("[data-testid='record-overview-section']").waitFor();
  const recordsSnapshot = await page
    .locator("[data-testid='record-overview-section']")
    .ariaSnapshot();
  for (const token of [
    "Health record",
    "Full blood count result",
    "Microbiology result",
    "Placeholder visible",
  ]) {
    assertCondition(recordsSnapshot.includes(token), `Records ARIA missing ${token}`);
  }
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/217-records-overview.png");

  await page.locator("[data-testid='record-overview-row-record_213_result_a']").focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/records/results/result_213_fbc");
  await page.locator("[data-testid='result-interpretation-hero']").waitFor();
}

async function assertResultDetail(page, baseUrl) {
  await openApp(page, baseUrl, "/records/results/result_213_fbc");
  const fixedOrder = await page.locator("[data-testid='result-detail-fixed-order']").ariaSnapshot();
  const ordered = [
    "What this test is",
    "What the latest result says",
    "What changed since last time",
    "What you may need to do next",
    "When to get urgent help",
    "Technical details",
  ];
  let cursor = -1;
  for (const token of ordered) {
    const next = fixedOrder.indexOf(token);
    assertCondition(next > cursor, `Result detail order missing or wrong for ${token}`);
    cursor = next;
  }
  await page.locator("[data-testid='trend-parity-switcher']").waitFor();
  const resultSnapshot = await page.locator("[data-testid='trend-parity-switcher']").ariaSnapshot();
  assertCondition(
    resultSnapshot.includes("Table-first result values"),
    "Result table caption missing.",
  );
  await screenshot(page, "output/playwright/217-result-detail.png");

  await page.getByRole("button", { name: "Table" }).click();
  await page.locator("[data-testid='record-result-table']").waitFor();
  await screenshot(page, "output/playwright/217-chart-table-fallback.png");

  await openApp(page, baseUrl, "/records/results/result_213_stale");
  await page.locator("[data-testid='chart-demotion-notice']").waitFor();
  await screenshot(page, "output/playwright/217-table-only-fallback.png");

  await openApp(page, baseUrl, "/records/results/result_213_delayed_release");
  await page.locator("[data-testid='record-visibility-placeholder']").waitFor();
  await screenshot(page, "output/playwright/217-delayed-placeholder.png");

  await openApp(page, baseUrl, "/records/results/result_213_step_up");
  await page.locator("[data-testid='record-visibility-placeholder']").waitFor();
  await screenshot(page, "output/playwright/217-step-up-placeholder.png");
}

async function assertDocuments(page, baseUrl) {
  await openApp(page, baseUrl, "/records/documents/document_213_letter");
  await page.locator("[data-testid='record-artifact-panel']").waitFor();
  await screenshot(page, "output/playwright/217-document-summary.png");

  await openApp(page, baseUrl, "/records/documents/document_213_source_only");
  await page.locator("[data-testid='record-artifact-panel']").waitFor();
  const sourceSnapshot = await page.locator("[data-testid='record-artifact-panel']").ariaSnapshot();
  assertCondition(sourceSnapshot.includes("source only"), "Source-only artifact state missing.");
  await screenshot(page, "output/playwright/217-source-only-document.png");

  await openApp(page, baseUrl, "/records/documents/document_213_restricted");
  await page.locator("[data-testid='record-visibility-placeholder']").waitFor();
  await screenshot(page, "output/playwright/217-restricted-placeholder.png");
}

async function assertMessages(page, baseUrl) {
  await openApp(page, baseUrl, "/messages");
  await page.locator("[data-testid='conversation-cluster-list']").waitFor();
  const listSnapshot = await page
    .locator("[data-testid='conversation-cluster-list']")
    .ariaSnapshot();
  for (const token of ["Dermatology request", "Callback follow-up", "Preview limited"]) {
    assertCondition(listSnapshot.includes(token), `Message list missing ${token}`);
  }
  await screenshot(page, "output/playwright/217-messages-list.png");

  await page.locator("[data-cluster-ref='cluster_214_derm']").focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/messages/cluster_214_derm");
  await page.locator("[data-testid='conversation-braid']").waitFor();
  await screenshot(page, "output/playwright/217-message-cluster.png");

  await openApp(page, baseUrl, "/messages/cluster_214_derm/thread/thread_214_primary");
  await page.locator("[data-testid='conversation-braid']").waitFor();
  await screenshot(page, "output/playwright/217-message-thread.png");

  await openApp(page, baseUrl, "/messages/cluster_214_callback/callback/callback_217");
  await page.locator("[data-testid='conversation-callback-card']").waitFor();
  await screenshot(page, "output/playwright/217-message-callback-risk.png");

  await openApp(page, baseUrl, "/messages/cluster_214_callback/repair");
  await page.locator("[data-testid='conversation-next-action']").waitFor();
  await screenshot(page, "output/playwright/217-message-repair.png");

  await openApp(page, baseUrl, "/messages/cluster_214_stepup");
  await page.locator("[data-testid='conversation-braid']").waitFor();
  await screenshot(page, "output/playwright/217-message-step-up-placeholder.png");

  await openApp(page, baseUrl, "/messages/cluster_214_dispute");
  await page.locator("[data-testid='delivery-dispute-notice']").waitFor();
  const disputeSnapshot = await page
    .locator("[data-testid='delivery-dispute-notice']")
    .ariaSnapshot();
  assertCondition(disputeSnapshot.includes("Provider dispute visible"), "Dispute notice missing.");
  await screenshot(page, "output/playwright/217-message-dispute.png");
}

async function assertResponsive(browser, baseUrl) {
  const mobileRecords = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileRecords, baseUrl, "/records");
    await assertNoOverflow(mobileRecords);
    await screenshot(mobileRecords, "output/playwright/217-mobile-records.png");
  } finally {
    await mobileRecords.close();
  }

  const mobileTable = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileTable, baseUrl, "/records/results/result_213_stale");
    await assertNoOverflow(mobileTable);
    await screenshot(mobileTable, "output/playwright/217-mobile-table-fallback.png");
  } finally {
    await mobileTable.close();
  }

  const mobileMessages = await browser.newPage({ viewport: { width: 390, height: 880 } });
  try {
    await openApp(mobileMessages, baseUrl, "/messages");
    await assertNoOverflow(mobileMessages);
    await screenshot(mobileMessages, "output/playwright/217-mobile-messages.png");
  } finally {
    await mobileMessages.close();
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const reduced = await reducedContext.newPage();
  try {
    await openApp(reduced, baseUrl, "/records/results/result_213_fbc");
    await reduced.locator("[data-testid='trend-parity-switcher']").waitFor();
    await screenshot(reduced, "output/playwright/217-reduced-motion.png");
  } finally {
    await reducedContext.close();
  }
}

async function assertAtlas(page, staticServer) {
  await page.goto(staticServer.atlasUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Health_Record_Communications_Atlas']").waitFor();
  const atlasSnapshot = await page
    .locator("[data-testid='Health_Record_Communications_Atlas']")
    .ariaSnapshot();
  for (const token of [
    "PatientRecordSurfaceContext",
    "PatientCommunicationsTimelineProjection",
    "ConversationThreadProjection",
  ]) {
    assertCondition(atlasSnapshot.includes(token), `Atlas ARIA missing ${token}`);
  }
  await page.locator("[data-scenario-button='overview']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page.locator("[data-scenario-button='result']").getAttribute("aria-selected")) ===
      "true",
    "Atlas ArrowRight did not move selected scenario.",
  );
  for (const [scenario, output] of [
    ["overview", "217-atlas-overview.png"],
    ["result", "217-atlas-result.png"],
    ["fallback", "217-atlas-fallback.png"],
    ["document", "217-atlas-document.png"],
    ["messages", "217-atlas-messages.png"],
    ["placeholder", "217-atlas-placeholder.png"],
    ["grammar", "217-atlas-grammar-board.png"],
  ]) {
    await page.locator(`[data-scenario-button='${scenario}']`).click();
    await assertNoOverflow(page);
    await screenshot(page, `output/playwright/${output}`);
  }
  await screenshot(page, "output/playwright/217-atlas.png");

  await page.goto(staticServer.grammarUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Record_Conversation_Visual_Grammar']").waitFor();
  await screenshot(page, "output/playwright/217-visual-grammar.png");
}

async function runBrowserChecks(browser) {
  getExpected();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
  try {
    await assertAtlas(page, staticServer);
    await assertRecords(page, patientWeb.baseUrl);
    await assertResultDetail(page, patientWeb.baseUrl);
    await assertDocuments(page, patientWeb.baseUrl);
    await assertMessages(page, patientWeb.baseUrl);
    await assertResponsive(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main() {
  getExpected();
  if (!process.argv.includes("--run")) {
    console.log("217_health_record_and_communications_timeline_views.spec.js: syntax ok");
    return;
  }
  const playwright = await importPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await runBrowserChecks(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
