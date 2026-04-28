import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "185_authenticated_portal_state_atlas.html");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "185_portal_projection_matrix.csv");
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "185_status_visibility_recovery_and_hold_cases.json",
);

export const authenticatedPortalStateAtlasCoverage = [
  "Portal_State_Atlas",
  "projection state switching",
  "list/detail field parity",
  "recovery replaces detail",
  "identity hold suppresses PHI",
  "keyboard state rail traversal",
  "reduced motion hierarchy",
  "stable screenshot coverage",
];

const REQUIRED_STATES = [
  {
    id: "entry-authenticated",
    projection: "PatientPortalEntryProjection",
    surface: "ready",
  },
  {
    id: "home-pending",
    projection: "PatientHomeProjection",
    surface: "pending_confirmation",
  },
  {
    id: "requests-index",
    projection: "PatientRequestsIndexProjection",
    surface: "ready",
  },
  {
    id: "detail-full",
    projection: "PatientRequestDetailProjection",
    surface: "ready",
  },
  {
    id: "detail-summary",
    projection: "PatientRequestDetailProjection",
    surface: "summary_only",
  },
  {
    id: "recovery-stale-session",
    projection: "PatientActionRecoveryProjection",
    surface: "recovery_required",
  },
  {
    id: "recovery-route-drift",
    projection: "PatientActionRecoveryProjection",
    surface: "recovery_required",
  },
  {
    id: "identity-hold",
    projection: "PatientIdentityHoldProjection",
    surface: "identity_hold",
  },
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
  for (const filePath of [HTML_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_185 atlas artifact ${filePath}`);
  }
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8")).cases ?? [];
  for (const projectionFamily of [
    "PatientPortalEntryProjection",
    "PatientRequestsIndexProjection",
    "PatientRequestDetailProjection",
    "PatientActionRecoveryProjection",
    "PatientIdentityHoldProjection",
    "PatientCommunicationVisibilityProjection",
  ]) {
    assertCondition(
      matrix.some((row) => row.projection_family === projectionFamily),
      `Matrix missing ${projectionFamily}.`,
    );
  }
  for (const caseId of [
    "PORTAL185_COVERAGE_FIRST_ENTRY",
    "PORTAL185_STALE_SESSION_RECOVERY",
    "PORTAL185_IDENTITY_HOLD_REPLACES_DETAIL",
    "PORTAL185_LIST_DETAIL_PARITY",
  ]) {
    assertCondition(
      cases.some((testCase) => testCase.caseId === caseId),
      `Cases missing ${caseId}.`,
    );
  }
  return { matrix, cases };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/185_authenticated_portal_state_atlas.html";
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
        reject(new Error("Unable to bind local par_185 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/185_authenticated_portal_state_atlas.html`,
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
  await page.locator("[data-testid='Portal_State_Atlas']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function tagTexts(page, testId) {
  return page
    .locator(`[data-testid='${testId}'] .tag`)
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()).filter(Boolean));
}

async function visibleFieldTexts(page) {
  return page
    .locator("[data-testid='visible-fields-list'] .field-row span:first-child")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()).filter(Boolean));
}

async function selectState(page, stateId) {
  await page.locator(`[data-state='${stateId}']`).click();
  const activeState = await page.evaluate(() => document.documentElement.dataset.activeState);
  assertCondition(activeState === stateId, `Atlas did not select ${stateId}.`);
}

async function assertAtlasShell(page) {
  for (const testId of [
    "Portal_State_Atlas",
    "atlas-masthead",
    "state-rail",
    "main-state-canvas",
    "coverage-ribbon",
    "page-mock-frame",
    "transition-strip",
    "inspector-panel",
    "projection-ref-card",
    "visible-fields-card",
    "blocked-fields-card",
    "recovery-reason-card",
    "route-dependencies-card",
    "projection-inputs-table",
    "expected-ui-table",
    "downgrade-triggers-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor({ state: "attached" });
  }
  assertCondition(
    (await page.locator("[data-testid='state-rail'] [data-state]").count()) ===
      REQUIRED_STATES.length,
    "State rail count drifted.",
  );
}

async function assertStateCoherence(page) {
  for (const expected of REQUIRED_STATES) {
    await selectState(page, expected.id);
    const projection = await page.locator("[data-testid='projection-ref']").innerText();
    const surface = await page.locator("[data-testid='surface-state-chip']").innerText();
    const mastheadTitle = await page.locator("[data-testid='state-title']").innerText();
    const mockTitle = await page.locator("[data-testid='mock-title']").innerText();
    const visible = await tagTexts(page, "inspector-visible-fields");
    const blocked = await tagTexts(page, "inspector-blocked-fields");
    const mainVisible = await visibleFieldTexts(page);
    const mainBlocked = await tagTexts(page, "blocked-fields-list");
    const overlap = visible.filter((field) => blocked.includes(field));

    assertCondition(
      projection.includes(expected.projection),
      `${expected.id} rendered ${projection}, not ${expected.projection}.`,
    );
    assertCondition(surface === expected.surface, `${expected.id} surface state drifted.`);
    assertCondition(mastheadTitle === mockTitle, `${expected.id} title parity drifted.`);
    assertCondition(visible.length > 0, `${expected.id} has no visible fields.`);
    assertCondition(
      mainVisible.length === visible.length,
      `${expected.id} visible field parity drifted.`,
    );
    assertCondition(
      mainBlocked.join("|") === blocked.join("|"),
      `${expected.id} blocked field parity drifted.`,
    );
    assertCondition(
      overlap.length === 0,
      `${expected.id} exposes blocked fields: ${overlap.join(", ")}`,
    );
    assertCondition(
      (await page.locator("[data-testid='projection-inputs-table'] tbody tr").count()) > 0,
      `${expected.id} lost projection input rows.`,
    );
    assertCondition(
      (await page.locator("[data-testid='expected-ui-table'] tbody tr").count()) > 0,
      `${expected.id} lost expected UI rows.`,
    );
    assertCondition(
      (await page.locator("[data-testid='downgrade-triggers-table'] tbody tr").count()) > 0,
      `${expected.id} lost downgrade trigger rows.`,
    );
  }
}

async function assertAccessControlStates(page) {
  await selectState(page, "detail-summary");
  const summaryBlocked = await tagTexts(page, "inspector-blocked-fields");
  const summaryVisible = await tagTexts(page, "inspector-visible-fields");
  assertCondition(
    summaryBlocked.includes("threadBodies"),
    "Summary detail must block threadBodies.",
  );
  assertCondition(
    !summaryVisible.includes("threadBodies"),
    "Summary detail exposed a blocked thread body.",
  );
  assertCondition(
    (await page.locator("[data-testid='coverage-mutation']").innerText()) === "step_up_only",
    "Summary detail did not narrow mutation authority.",
  );

  await selectState(page, "recovery-stale-session");
  const recoveryCopy = await page.locator("[data-testid='state-copy']").innerText();
  const recoveryBlocked = await tagTexts(page, "inspector-blocked-fields");
  assertCondition(
    recoveryCopy.includes("replaced") && recoveryBlocked.includes("requestDetailProjection"),
    "Same-shell recovery did not replace live detail.",
  );
  assertCondition(
    (await page.locator("[data-testid='coverage-mutation']").innerText()) === "none",
    "Recovery should suppress mutation authority.",
  );

  await selectState(page, "identity-hold");
  const holdCopy = await page.locator("[data-testid='state-copy']").innerText();
  const holdBlocked = await tagTexts(page, "inspector-blocked-fields");
  assertCondition(holdCopy.includes("identity hold"), "Identity hold copy did not render.");
  for (const blocked of [
    "patientSafeLabel",
    "threadBodies",
    "respond_more_info",
    "upload_attachment",
  ]) {
    assertCondition(holdBlocked.includes(blocked), `Identity hold did not block ${blocked}.`);
  }
}

async function assertKeyboardNavigation(page) {
  const first = page.locator("[data-testid='state-rail'] [data-state]").first();
  await first.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.evaluate(() => document.activeElement?.getAttribute("data-state"))) ===
      "home-pending",
    "ArrowDown did not move to the next state.",
  );
  assertCondition(
    (await page.evaluate(() => document.documentElement.dataset.activeState)) === "home-pending",
    "ArrowDown did not activate the focused state.",
  );
  await page.keyboard.press("ArrowUp");
  assertCondition(
    (await page.evaluate(() => document.activeElement?.getAttribute("data-state"))) ===
      "entry-authenticated",
    "ArrowUp did not move to the previous state.",
  );
  await page.keyboard.press("End");
  assertCondition(
    (await page.evaluate(() => document.activeElement?.getAttribute("data-state"))) ===
      "identity-hold",
    "End did not move to identity hold.",
  );
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("[data-testid='surface-state-chip']").innerText()) === "identity_hold",
    "Keyboard Enter did not activate identity hold.",
  );
}

async function assertReducedMotion(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openAtlas(page, url);
    await assertAtlasShell(page);
    assertCondition(
      (await page.evaluate(() => document.body.dataset.reducedMotion)) === "true",
      "Reduced motion media query was not observed.",
    );
    assertCondition(
      await page.locator("[data-testid='coverage-ribbon']").isVisible(),
      "Reduced motion lost coverage hierarchy.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector-panel']").isVisible(),
      "Reduced motion lost inspector hierarchy.",
    );
  } finally {
    await context.close();
  }
}

async function assertScreenshotStable(page) {
  const buffer = await page.screenshot({ animations: "disabled", fullPage: true });
  assertCondition(buffer.length > 30000, "Screenshot capture is unexpectedly small.");
}

export async function run() {
  getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openAtlas(page, url);
    await assertNoOverflow(page);
    await assertAtlasShell(page);
    await assertStateCoherence(page);
    await assertAccessControlStates(page);
    await assertKeyboardNavigation(page);
    await assertScreenshotStable(page);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openAtlas(mobile, url);
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
  console.log("185_authenticated_portal_state_atlas.spec.js: syntax ok");
}
