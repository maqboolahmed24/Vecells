import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "171_auth_return_journey_board.html");
const CALLBACK_MATRIX_PATH = path.join(ROOT, "data", "analysis", "171_callback_outcome_matrix.csv");
const TTL_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "171_session_ttl_and_rotation_matrix.csv",
);
const PROJECTION_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "171_session_projection_contract.json",
);
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "171_auth_session_gap_log.json");

export const phase2AuthReturnJourneyCoverage = [
  "transaction outcome rendering for all callback outcomes",
  "sign-in and recovery page atlas parity",
  "keyboard traversal and landmarks",
  "reducedMotion equivalence",
  "diagram/table parity",
  "Auth_Return_Journey_Board",
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
    CALLBACK_MATRIX_PATH,
    TTL_MATRIX_PATH,
    PROJECTION_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_171 artifact ${filePath}`);
  }
  const outcomes = parseCsv(fs.readFileSync(CALLBACK_MATRIX_PATH, "utf8"));
  const ttl = parseCsv(fs.readFileSync(TTL_MATRIX_PATH, "utf8"));
  const projection = JSON.parse(fs.readFileSync(PROJECTION_PATH, "utf8"));
  const gaps = JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8"));
  const linkageUnavailable = outcomes.find(
    (row) => row.outcome_id === "CB_171_LINKAGE_UNAVAILABLE",
  );
  const replayed = outcomes.find((row) => row.outcome_id === "CB_171_REPLAYED_CALLBACK");
  assertCondition(linkageUnavailable, "Missing linkage-unavailable outcome.");
  assertCondition(replayed, "Missing replayed-callback outcome.");
  return {
    outcomes,
    ttl,
    projection,
    gaps,
    linkageUnavailable,
    replayed,
    recoveryCount: outcomes.filter(
      (row) => row.session_decision === "bounded_recovery" || row.session_decision === "deny",
    ).length,
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/171_auth_return_journey_board.html";
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
        reject(new Error("Unable to bind local seq_171 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/171_auth_return_journey_board.html`,
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
  await page.locator("[data-testid='Auth_Return_Journey_Board']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardShell(page, expected) {
  for (const testId of [
    "Auth_Return_Journey_Board",
    "board-masthead",
    "auth_return_mark",
    "pre-auth-landing-card",
    "nhs-login-button-standard",
    "state-rail",
    "outcome-filter",
    "projection-filter",
    "auth-transaction-ladder",
    "auth-transaction-table",
    "return-intent-braid",
    "return-intent-table",
    "session-state-ring",
    "session-state-table",
    "sign-in-recovery-page-atlas",
    "page-atlas-table",
    "parity-table",
    "inspector",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor({ state: "attached" });
  }
  assertCondition(
    Number((await page.locator("[data-testid='visible-outcome-count']").innerText()).trim()) ===
      expected.outcomes.length,
    "Visible outcome count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='recovery-count']").innerText()).trim()) ===
      expected.recoveryCount,
    "Recovery outcome count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='page-atlas-table'] tbody tr").count()) ===
      expected.projection.projectionPostures.length,
    "Page atlas lost parity with projection contract.",
  );
}

async function assertAllCallbackOutcomesRender(page, expected) {
  const tableText = await page.locator("[data-testid='auth-transaction-table']").innerText();
  for (const row of expected.outcomes) {
    assertCondition(
      tableText.includes(row.callback_outcome),
      `Callback outcome ${row.callback_outcome} is not rendered.`,
    );
    await page.locator(`[data-testid='outcome-node-${row.outcome_id}']`).waitFor();
  }
}

async function assertFilterSynchronization(page, expected) {
  await page.locator("[data-testid='outcome-filter']").selectOption("token_validation_failure");
  assertCondition(
    (await page.locator("[data-testid='auth-transaction-table'] tbody tr").count()) === 1,
    "Outcome filter did not narrow transaction rows.",
  );
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("token_validation_failure"),
    "Outcome filter did not sync inspector.",
  );
  assertCondition(
    (await page.locator("[data-testid='return-intent-table'] tbody tr").count()) === 1,
    "Outcome filter did not sync return-intent table.",
  );

  await page.locator("[data-testid='outcome-filter']").selectOption("all");
  await page.locator("[data-testid='projection-filter']").selectOption("consent_declined");
  assertCondition(
    (await page.locator("[data-testid='auth-transaction-table'] tbody tr").count()) ===
      expected.outcomes.filter((row) => row.projection_posture === "consent_declined").length,
    "Projection filter did not sync transaction table.",
  );
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("consent_declined"),
    "Projection filter did not sync inspector.",
  );
  await page.locator("[data-testid='projection-filter']").selectOption("all");
}

async function assertSelectionSync(page, expected) {
  await page
    .locator(`[data-testid='outcome-node-${expected.linkageUnavailable.outcome_id}']`)
    .click();
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("claim_pending"),
    "Outcome node selection did not sync projection posture.",
  );
  assertCondition(
    inspectorText.includes("route_intent_binding_only"),
    "Outcome node selection did not expose governed return intent.",
  );

  await page.locator(`[data-testid='outcome-row-${expected.replayed.outcome_id}']`).focus();
  await page.keyboard.press("Enter");
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("replayed_callback"),
    "Keyboard row selection did not sync inspector.",
  );
  assertCondition(inspectorText.includes("deny"), "Replayed callback did not render deny posture.");
}

async function assertKeyboardAndLandmarks(page) {
  const firstNode = page.locator("[data-testid='auth-transaction-ladder'] button").first();
  await firstNode.focus();
  const firstOutcome = await firstNode.getAttribute("data-outcome-id");
  await page.keyboard.press("ArrowRight");
  const activeOutcomeAfterArrow = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-outcome-id"),
  );
  assertCondition(
    activeOutcomeAfterArrow && activeOutcomeAfterArrow !== firstOutcome,
    "Arrow-key traversal did not move between auth ladder nodes.",
  );
  await page.keyboard.press("Enter");
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(activeOutcomeAfterArrow),
    "Keyboard activation did not sync selected auth ladder node.",
  );
  await page.locator("#auth-main").focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.id)) === "auth-main",
    "Main landmark did not accept focus.",
  );
}

async function assertDiagramTableParity(page) {
  const parityText = await page.locator("[data-testid='parity-table']").innerText();
  for (const [visual, table] of [
    ["auth-transaction-ladder", "auth-transaction-table"],
    ["return-intent-braid", "return-intent-table"],
    ["session-state-ring", "session-state-table"],
    ["sign-in-recovery-page-atlas", "page-atlas-table"],
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
      .locator(".track-line span")
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `Reduced motion did not collapse track-line animation: ${duration}`,
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
    await assertAllCallbackOutcomesRender(page, expected);
    await assertFilterSynchronization(page, expected);
    await assertSelectionSync(page, expected);
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
  console.log("171_auth_return_journey_board.spec.js: syntax ok");
}
