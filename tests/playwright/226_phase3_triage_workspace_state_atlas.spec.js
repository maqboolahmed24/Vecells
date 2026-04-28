import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const HTML_PATH = path.join(ROOT, "docs", "frontend", "226_phase3_triage_workspace_state_atlas.html");
const TRIAGE_TASK_PATH = path.join(ROOT, "data", "contracts", "226_triage_task.schema.json");
const ROUTE_REGISTRY_PATH = path.join(ROOT, "data", "contracts", "226_workspace_route_family_registry.yaml");
const TRANSITION_MATRIX_PATH = path.join(ROOT, "data", "analysis", "226_triage_state_transition_matrix.csv");
const EVENT_CATALOG_PATH = path.join(ROOT, "data", "analysis", "226_workspace_event_catalog.csv");
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "226_triage_workspace_gap_log.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const phase3TriageWorkspaceAtlasCoverage = [
  "Triage_Workspace_State_Atlas",
  "WorkspaceShellBraid",
  "RouteFamilyLadder",
  "CommandSettlementChain",
  "TaskStateLattice",
  "SchemaParityTable",
  "TransitionMatrixTable",
  "EventCatalogTable",
  "route-family synchronization",
  "state-node synchronization",
  "stale and blocked trust rendering",
  "keyboard navigation",
  "landmarks",
  "reduced-motion equivalence",
  "diagram-to-table parity",
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
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw new Error("This spec requires the `playwright` package when run with --run.");
  }
}

function loadExpected() {
  for (const filePath of [
    HTML_PATH,
    TRIAGE_TASK_PATH,
    ROUTE_REGISTRY_PATH,
    TRANSITION_MATRIX_PATH,
    EVENT_CATALOG_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_226 artifact ${filePath}`);
  }

  return {
    triageTask: JSON.parse(fs.readFileSync(TRIAGE_TASK_PATH, "utf8")),
    routeRegistry: JSON.parse(fs.readFileSync(ROUTE_REGISTRY_PATH, "utf8")),
    transitionMatrix: parseCsv(fs.readFileSync(TRANSITION_MATRIX_PATH, "utf8")),
    eventCatalog: parseCsv(fs.readFileSync(EVENT_CATALOG_PATH, "utf8")),
    gapLog: JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8")),
  };
}

function relevantTransitionsForRoute(route, transitions) {
  return transitions.filter(
    (row) =>
      route.focusWorkflowStates.includes(row.from_workflow_state) ||
      route.focusWorkflowStates.includes(row.to_workflow_state) ||
      route.focusEventRefs.includes(row.event_id),
  );
}

function relevantTransitionsForState(workflowState, transitions) {
  return transitions.filter(
    (row) => row.from_workflow_state === workflowState || row.to_workflow_state === workflowState,
  );
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/226_phase3_triage_workspace_state_atlas.html";
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
        reject(new Error("Unable to bind local seq_226 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/226_phase3_triage_workspace_state_atlas.html`,
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
  await page.locator("[data-testid='Triage_Workspace_State_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertMetricsAndParity(page, expected) {
  await page.locator("[data-testid='WorkspaceShellBraid']").waitFor();
  for (const testId of [
    "WorkspaceShellBraid",
    "RouteFamilyLadder",
    "CommandSettlementChain",
    "TaskStateLattice",
    "SchemaParityTable",
    "TransitionMatrixTable",
    "EventCatalogTable",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    Number((await page.locator("[data-testid='route-count']").innerText()).trim()) ===
      expected.routeRegistry.routes.length,
    "Route count metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='workflow-count']").innerText()).trim()) ===
      expected.triageTask.properties.status.enum.length,
    "Workflow count metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='event-count']").innerText()).trim()) ===
      expected.eventCatalog.length,
    "Event count metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='gap-count']").innerText()).trim()) ===
      expected.gapLog.gaps.length,
    "Gap count metric drifted.",
  );

  assertCondition(
    (await page.locator("[data-testid^='route-ladder-'][data-route-key]").count()) ===
      expected.routeRegistry.routes.length,
    "Route ladder count drifted from route registry.",
  );
  assertCondition(
    (await page.locator("[data-testid^='shell-node-']").count()) === expected.routeRegistry.routes.length,
    "Shell braid count drifted from route registry.",
  );
  assertCondition(
    (await page.locator("[data-testid^='state-node-']").count()) ===
      expected.triageTask.properties.status.enum.length,
    "State lattice count drifted from workflow enum.",
  );
}

async function assertRouteSync(page, expected) {
  const route = expected.routeRegistry.routes.find((entry) => entry.routeKey === "workspace-task-more-info");
  assertCondition(route, "Expected workspace-task-more-info route.");

  await page.locator("[data-testid='route-filter-workspace-task-more-info']").click();
  assertCondition(
    (await page.locator("#selection-title").innerText()).includes("Workspace Task More Info"),
    "Route filter did not update inspector title.",
  );
  assertCondition(
    (await page.locator("[data-testid='route-ladder-workspace-task-more-info']").getAttribute("data-selected")) ===
      "true",
    "Route ladder selection did not synchronize from filter rail.",
  );

  const expectedEventCount = route.focusEventRefs.length;
  const expectedTransitionCount = relevantTransitionsForRoute(route, expected.transitionMatrix).length;
  assertCondition(
    (await page.locator("[data-testid^='event-row-']").count()) === expectedEventCount,
    "Route selection did not filter the event catalog correctly.",
  );
  assertCondition(
    (await page.locator("[data-testid^='transition-row-']").count()) === expectedTransitionCount,
    "Route selection did not filter the transition matrix correctly.",
  );
}

async function assertStateSync(page, expected) {
  const workflowState = "endpoint_selected";
  await page.locator("[data-testid='state-node-endpoint_selected']").click();
  assertCondition(
    (await page.locator("#selection-title").innerText()).includes("Endpoint Selected"),
    "State node did not update inspector title.",
  );
  assertCondition(
    (await page.locator("[data-testid='state-filter-endpoint_selected']").getAttribute("data-selected")) ===
      "true",
    "State filter button did not synchronize from state lattice selection.",
  );

  const expectedTransitionCount = relevantTransitionsForState(workflowState, expected.transitionMatrix).length;
  const expectedEventCount = new Set(
    relevantTransitionsForState(workflowState, expected.transitionMatrix).map((row) => row.event_id),
  ).size;
  assertCondition(
    (await page.locator("[data-testid^='transition-row-']").count()) === expectedTransitionCount,
    "State selection did not filter transitions correctly.",
  );
  assertCondition(
    (await page.locator("[data-testid^='event-row-']").count()) === expectedEventCount,
    "State selection did not filter events correctly.",
  );
}

async function assertGapSync(page, expected) {
  const gap = expected.gapLog.gaps.find((entry) => entry.gapId === "GAP_226_OPTIMISTIC_SUCCESS_EQUALS_SETTLEMENT");
  assertCondition(gap, "Expected optimistic settlement gap.");
  await page.locator("[data-testid='gap-filter-GAP_226_OPTIMISTIC_SUCCESS_EQUALS_SETTLEMENT']").click();
  const summaryText = await page.locator("#selection-summary").innerText();
  assertCondition(summaryText.includes("artifact refs"), "Gap selection lost summary sync.");
  assertCondition(
    (await page.locator("[data-testid^='event-row-']").count()) === gap.focusEventRefs.length,
    "Gap selection did not filter event catalog correctly.",
  );
}

async function assertTrustRendering(page) {
  await page.locator("[data-testid='trust-preview-stale_recoverable']").click();
  assertCondition(
    (await page.locator("#trust-banner-title").innerText()).trim() === "Stale recoverable",
    "Stale recoverable trust preview did not render.",
  );
  assertCondition(
    (await page.locator("[data-testid='command-node-settlement-record']").innerText()).includes(
      "stale_recoverable",
    ),
    "Command chain did not show stale_recoverable settlement preview.",
  );

  await page.locator("[data-testid='trust-preview-recovery_required']").click();
  assertCondition(
    (await page.locator("#trust-banner-title").innerText()).trim() === "Recovery required",
    "Recovery required trust preview did not render.",
  );
  assertCondition(
    (await page.locator("[data-testid='command-node-action-record']").innerText()).includes("blocked"),
    "Command chain did not show blocked action record under recovery_required preview.",
  );
}

async function assertKeyboardAndLandmarks(page) {
  assertCondition((await page.getByRole("banner").count()) === 1, "Atlas is missing the banner landmark.");
  assertCondition((await page.getByRole("main").count()) === 1, "Atlas is missing the main landmark.");
  assertCondition((await page.getByRole("complementary").count()) >= 2, "Atlas is missing complementary landmarks.");

  await page.locator("[data-testid='route-filter-workspace-task']").focus();
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("#selection-title").innerText()).includes("Workspace Task"),
    "Keyboard activation did not select the route filter.",
  );

  await page.locator("[data-testid='state-node-review_resumed']").focus();
  await page.keyboard.press("Space");
  assertCondition(
    (await page.locator("#selection-title").innerText()).includes("Review Resumed"),
    "Keyboard activation did not select the state node.",
  );
}

async function assertReducedMotion(url, expected, playwright) {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  await openAtlas(page, url);
  assertCondition(
    (await page.evaluate(() => document.documentElement.dataset.motion)) === "reduced",
    "Reduced-motion context did not set the reduced data attribute.",
  );
  assertCondition(
    (await page.locator("[data-testid^='route-ladder-'][data-route-key]").count()) ===
      expected.routeRegistry.routes.length,
    "Reduced-motion route ladder count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='state-node-']").count()) === expected.triageTask.properties.status.enum.length,
    "Reduced-motion state lattice count drifted.",
  );
  await screenshot(page, "output/playwright/226-phase3-triage-workspace-state-atlas-reduced.png");
  await browser.close();
}

async function run() {
  const expected = loadExpected();
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1400 } });
    const page = await context.newPage();
    await openAtlas(page, url);

    await assertMetricsAndParity(page, expected);
    await assertRouteSync(page, expected);
    await assertStateSync(page, expected);
    await assertGapSync(page, expected);
    await assertTrustRendering(page);
    await assertKeyboardAndLandmarks(page);
    await screenshot(page, "output/playwright/226-phase3-triage-workspace-state-atlas-default.png");
    await assertReducedMotion(url, expected, playwright);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

const isRun = process.argv.includes("--run");

if (isRun) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
