import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "173_telephony_readiness_board.html");
const TRANSITIONS_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "173_call_state_transition_matrix.csv",
);
const READINESS_PATH = path.join(ROOT, "data", "analysis", "173_readiness_truth_table.csv");
const PROVIDER_MAPPING_PATH = path.join(ROOT, "data", "analysis", "173_provider_event_mapping.csv");
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "173_telephony_gap_log.json");

export const phase2TelephonyCoverage = [
  "state selection synchronization",
  "provider-event and readiness-table parity",
  "urgent-live-only and manual-review-only rendering",
  "mobile continuation preview parity",
  "keyboard traversal and landmarks",
  "reducedMotion equivalence",
  "diagram/table parity",
  "Telephony_Readiness_Board",
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

function getExpected() {
  for (const filePath of [
    HTML_PATH,
    TRANSITIONS_PATH,
    READINESS_PATH,
    PROVIDER_MAPPING_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_173 artifact ${filePath}`);
  }
  const transitions = parseCsv(fs.readFileSync(TRANSITIONS_PATH, "utf8"));
  const readiness = parseCsv(fs.readFileSync(READINESS_PATH, "utf8"));
  const providerEvents = parseCsv(fs.readFileSync(PROVIDER_MAPPING_PATH, "utf8"));
  const gaps = JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8"));
  const urgent = readiness.find((row) => row.usabilityState === "urgent_live_only");
  const manual = readiness.find((row) => row.usabilityState === "manual_review_only");
  const routine = readiness.find((row) => row.routine_submission_allowed === "true");
  const transcriptEvent = providerEvents.find(
    (row) => row.canonical_event_type === "transcript_degraded",
  );
  assertCondition(urgent, "Missing urgent-live-only readiness row.");
  assertCondition(manual, "Missing manual-review-only readiness row.");
  assertCondition(routine, "Missing routine-ready readiness row.");
  assertCondition(transcriptEvent, "Missing transcript-degraded provider mapping.");
  return { transitions, readiness, providerEvents, gaps, urgent, manual, routine, transcriptEvent };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/173_telephony_readiness_board.html";
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
        reject(new Error("Unable to bind local seq_173 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/173_telephony_readiness_board.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openBoard(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Telephony_Readiness_Board']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardShell(page, expected) {
  for (const testId of [
    "Telephony_Readiness_Board",
    "board-masthead",
    "telephony_echo_mark",
    "readiness-summary-strip",
    "mobile-continuation-preview",
    "mobile-preview-parity",
    "state-rail",
    "state-filter",
    "provider-event-filter",
    "readiness-filter",
    "call-state-braid",
    "call-state-transition-table",
    "readiness-ladder",
    "readiness-truth-table",
    "continuation-gate-strip",
    "provider-event-mapping-table",
    "parity-table",
    "inspector",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor({ state: "attached" });
  }
  assertCondition(
    Number((await page.locator("[data-testid='transition-count']").innerText()).trim()) ===
      expected.transitions.length,
    "Transition count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='readiness-count']").innerText()).trim()) ===
      expected.readiness.length,
    "Readiness count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='readiness-truth-table'] tbody tr").count()) ===
      expected.readiness.length,
    "Readiness table lost parity with truth table.",
  );
}

async function assertStateSelectionSynchronization(page) {
  await page.locator("[data-testid='state-filter']").selectOption("urgent_live_only");
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("urgent_live_only"),
    "State filter did not sync inspector.",
  );
  const tableText = await page.locator("[data-testid='call-state-transition-table']").innerText();
  assertCondition(
    tableText.includes("urgent_live_only"),
    "State filter did not sync transition parity table.",
  );

  await page.locator("[data-testid='state-filter']").selectOption("all");
  await page.locator("[data-testid='transition-row-T026']").focus();
  await page.keyboard.press("Enter");
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(inspectorText.includes("T026"), "Keyboard transition selection did not sync id.");
  assertCondition(
    (await page.locator("[data-testid='summary-state']").innerText()).includes("evidence_ready"),
    "Transition selection did not sync readiness summary state.",
  );
}

async function assertProviderAndReadinessParity(page, expected) {
  await page
    .locator("[data-testid='provider-event-filter']")
    .selectOption(expected.transcriptEvent.canonical_event_type);
  assertCondition(
    (await page.locator("[data-testid='provider-event-mapping-table'] tbody tr").count()) ===
      expected.providerEvents.filter(
        (row) => row.canonical_event_type === expected.transcriptEvent.canonical_event_type,
      ).length,
    "Provider-event filter did not narrow mapping rows.",
  );
  await page
    .locator(
      `[data-testid='provider-row-${expected.transcriptEvent.provider_event_family}-${expected.transcriptEvent.canonical_event_type}']`,
    )
    .click();
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("normalized_event_only"),
    "Provider boundary was not visible in inspector.",
  );

  await page.locator("[data-testid='readiness-filter']").selectOption("manual_review_only");
  const manualRows = expected.readiness.filter(
    (row) => row.usabilityState === "manual_review_only",
  );
  assertCondition(
    (await page.locator("[data-testid='readiness-truth-table'] tbody tr").count()) ===
      manualRows.length,
    "Readiness filter did not narrow truth rows.",
  );
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("manual_only"),
    "Manual-only readiness did not sync inspector.",
  );
  assertCondition(
    inspectorText.includes("no_redeemable_grant"),
    "Manual-only readiness implied a grant.",
  );
}

async function assertUrgentAndManualRendering(page, expected) {
  await page.locator("[data-testid='readiness-filter']").selectOption("all");
  await page
    .locator(`[data-testid='readiness-table-row-${expected.urgent.readiness_case_id}']`)
    .click();
  let previewText = await page.locator("[data-testid='mobile-continuation-preview']").innerText();
  assertCondition(previewText.includes("Urgent help"), "Urgent-live preview did not render.");
  assertCondition(
    (await page.locator("[data-testid='summary-readiness']").innerText()).includes(
      "urgent_live_only",
    ),
    "Urgent-live readiness did not sync summary strip.",
  );

  await page.locator("[data-testid='readiness-filter']").selectOption("all");
  await page
    .locator(`[data-testid='readiness-table-row-${expected.manual.readiness_case_id}']`)
    .click();
  previewText = await page.locator("[data-testid='mobile-continuation-preview']").innerText();
  assertCondition(
    previewText.includes("review the call"),
    "Manual-review-only preview did not render.",
  );
  const parityText = await page.locator("[data-testid='mobile-preview-parity']").innerText();
  assertCondition(
    parityText.includes(expected.manual.readiness_case_id),
    "Mobile preview parity did not cite selected manual row.",
  );
  assertCondition(parityText.includes("no_redeemable_grant"), "Mobile parity lost no-grant truth.");
}

async function assertMobileContinuationPreviewParity(page, expected) {
  await page.locator("[data-testid='readiness-filter']").selectOption("all");
  await page
    .locator(`[data-testid='readiness-table-row-${expected.routine.readiness_case_id}']`)
    .click();
  const previewText = await page.locator("[data-testid='mobile-continuation-preview']").innerText();
  const parityText = await page.locator("[data-testid='mobile-preview-parity']").innerText();
  assertCondition(
    previewText.includes("Add anything missing"),
    "Seeded mobile copy did not render.",
  );
  assertCondition(
    parityText.includes(expected.routine.continuation_recommendation),
    "Mobile parity did not include continuation recommendation.",
  );
  assertCondition(
    parityText.includes(expected.routine.grant_issuance),
    "Mobile parity did not include grant issuance.",
  );
}

async function assertKeyboardAndLandmarks(page) {
  await page.locator("[data-testid='state-filter']").selectOption("all");
  const firstNode = page.locator("[data-testid='call-state-braid'] button").first();
  await firstNode.focus();
  const firstState = await firstNode.getAttribute("data-state");
  await page.keyboard.press("ArrowRight");
  const activeAfterArrow = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-state"),
  );
  assertCondition(
    activeAfterArrow && activeAfterArrow !== firstState,
    "Arrow-key traversal did not move between state nodes.",
  );
  await page.keyboard.press("Enter");
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(activeAfterArrow),
    "Keyboard activation did not sync selected state node.",
  );
  await page.locator("#telephony-main").focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.id)) === "telephony-main",
    "Main landmark did not accept focus.",
  );
}

async function assertDiagramTableParity(page) {
  const parityText = await page.locator("[data-testid='parity-table']").innerText();
  for (const [visual, table] of [
    ["call-state-braid", "call-state-transition-table"],
    ["readiness-ladder", "readiness-truth-table"],
    ["continuation-gate-strip", "readiness-truth-table"],
    ["mobile-continuation-preview", "mobile-preview-parity"],
    ["provider-event rail", "provider-event-mapping-table"],
  ]) {
    assertCondition(parityText.includes(visual), `${visual} missing from parity table.`);
    assertCondition(parityText.includes(table), `${table} missing from parity table.`);
  }
}

async function assertReducedMotion(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openBoard(page, url);
    await assertDiagramTableParity(page);
    const duration = await page
      .locator(".braid-node")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `Reduced motion did not collapse braid transition: ${duration}`,
    );
  } finally {
    await context.close();
  }
}

export async function run() {
  const expected = getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openBoard(page, url);
    await assertNoOverflow(page);
    await assertBoardShell(page, expected);
    await assertStateSelectionSynchronization(page);
    await assertProviderAndReadinessParity(page, expected);
    await assertUrgentAndManualRendering(page, expected);
    await assertMobileContinuationPreviewParity(page, expected);
    await assertKeyboardAndLandmarks(page);
    await assertDiagramTableParity(page);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openBoard(mobile, url);
    await assertNoOverflow(mobile);
    await mobile.close();

    await assertReducedMotion(browser, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("173_telephony_readiness_board.spec.js: syntax ok");
}
