import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "tests", "133_transition_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "transition_suite_results.json");

export const domainTransitionLabCoverage = [
  "filter synchronization across aggregate, axis, verdict, and event family",
  "state lattice, heatmap, alias flow, and inspector synchronization",
  "keyboard traversal across rows and inspector tabs",
  "reduced-motion and responsive layout behavior",
  "diagram and table parity for transitions, schema rows, and alias flows",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/tests/133_transition_lab.html";
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
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/tests/133_transition_lab.html`,
      });
    });
  });
}

function loadExpected() {
  const payload = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  return {
    summary: payload.summary,
    requestWorkflowAllowedCount: payload.transitionRows.filter(
      (row) =>
        row.canonicalName === "Request.workflowState" &&
        row.stateAxisType === "workflow" &&
        row.transitionVerdict === "allowed",
    ).length,
    identitySchemaCount: payload.schemaRows.filter(
      (row) => row.eventFamily === "identity" && row.rowKind === "published_contract",
    ).length,
    identityAliasCount: payload.aliasCases.filter((row) => row.targetEventFamily === "identity").length,
    firstRequestWorkflowTransition: payload.transitionRows.find(
      (row) =>
        row.canonicalName === "Request.workflowState" &&
        row.stateAxisType === "workflow" &&
        row.transitionVerdict === "allowed",
    ),
    freezeCommittedSchema: payload.schemaRows.find(
      (row) => row.eventName === "identity.repair_case.freeze_committed",
    ),
  };
}

async function countRows(locator) {
  return await locator.locator("[data-kind]").count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Transition lab HTML is missing.");
  assertCondition(fs.existsSync(RESULTS_PATH), "Transition suite results are missing.");
  const expected = loadExpected();
  assertCondition(expected.summary.transitionMatrixRows > 150, "Transition matrix looks incomplete.");
  assertCondition(expected.summary.schemaMatrixRows > 20, "Schema matrix looks incomplete.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='transition-schema-lab']").waitFor();
    await page.locator("[data-testid='state-lattice']").waitFor();
    await page.locator("[data-testid='event-compatibility-heatmap']").waitFor();
    await page.locator("[data-testid='alias-normalization-flow']").waitFor();
    await page.locator("[data-testid='transition-table']").waitFor();
    await page.locator("[data-testid='schema-table']").waitFor();
    await page.locator("[data-testid='alias-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid='summary-transition-count']").innerText()).includes(
        `${expected.summary.transitionMatrixRows}`,
      ),
      "Transition summary pill drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-schema-count']").innerText()).includes(
        `${expected.summary.schemaMatrixRows}`,
      ),
      "Schema summary pill drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-gap-count']").innerText()).includes(
        `${expected.summary.gapRows}`,
      ),
      "Gap summary pill drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid='state-lattice']").locator("[data-kind='transition']").count()) ===
        (await page.locator("[data-testid='transition-table']").locator("[data-kind='transition']").count()),
      "Transition lattice/table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='event-compatibility-heatmap']").locator("[data-kind='schema']").count()) ===
        (await page.locator("[data-testid='schema-table']").locator("[data-kind='schema']").count()),
      "Schema heatmap/table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='alias-normalization-flow']").locator("[data-kind='alias']").count()) ===
        (await page.locator("[data-testid='alias-table']").locator("[data-kind='alias']").count()),
      "Alias flow/table parity drifted.",
    );

    await page.selectOption("[data-testid='aggregate-filter']", "Request");
    await page.selectOption("[data-testid='axis-filter']", "workflow");
    await page.selectOption("[data-testid='verdict-filter']", "allowed");
    assertCondition(
      (await countRows(page.locator("[data-testid='state-lattice']"))) ===
        expected.requestWorkflowAllowedCount,
      "Aggregate/axis/verdict filter did not synchronize the lattice.",
    );
    assertCondition(
      (await countRows(page.locator("[data-testid='transition-table']"))) ===
        expected.requestWorkflowAllowedCount,
      "Aggregate/axis/verdict filter did not synchronize the transition table.",
    );

    await page.locator(`[data-testid='lattice-cell-${expected.firstRequestWorkflowTransition.matrixRowId}']`).click();
    const transitionInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      transitionInspector.includes("Request.workflowState") &&
        transitionInspector.includes("allowed"),
      "Selecting a transition did not synchronize the inspector.",
    );

    await page.selectOption("[data-testid='verdict-filter']", "all");
    await page.selectOption("[data-testid='event-family-filter']", "identity");
    assertCondition(
      (await countRows(page.locator("[data-testid='event-compatibility-heatmap']"))) ===
        expected.identitySchemaCount,
      "Event family filter did not synchronize the heatmap.",
    );
    assertCondition(
      (await countRows(page.locator("[data-testid='schema-table']"))) === expected.identitySchemaCount,
      "Event family filter did not synchronize the schema table.",
    );
    assertCondition(
      (await countRows(page.locator("[data-testid='alias-normalization-flow']"))) ===
        expected.identityAliasCount,
      "Event family filter did not synchronize the alias flow.",
    );

    await page.locator(`[data-testid='heatmap-row-${expected.freezeCommittedSchema.schemaRowId}']`).click();
    const schemaInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      schemaInspector.includes("identity.repair_case.freeze_committed") &&
        schemaInspector.includes("identity"),
      "Selecting a schema row did not synchronize the inspector.",
    );

    await page.locator(`[data-testid='lattice-cell-${expected.firstRequestWorkflowTransition.matrixRowId}']`).focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator("[data-testid='state-lattice'] [data-kind='transition'][data-selected='true']").count()) === 1,
      "Arrow key traversal did not keep one selected transition.",
    );

    await page.locator("[data-testid='tab-summary']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      (await page.locator("[data-testid='tab-guards'][aria-selected='true']").count()) === 1,
      "ArrowRight did not move inspector tab selection.",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedTransitionDuration = await page.locator("[data-testid='state-lattice'] [data-kind='transition']").first().evaluate((node) => {
      return window.getComputedStyle(node).transitionDuration;
    });
    assertCondition(
      reducedTransitionDuration.includes("0.01ms") || reducedTransitionDuration.includes("1e-05s"),
      "Reduced-motion media query did not collapse transition timing.",
    );

    assertCondition(
      (await page.locator("nav[aria-label='Filters']").count()) === 1 &&
        (await page.locator("main").count()) === 1 &&
        (await page.locator("aside").count()) === 1,
      "Expected landmarks are missing.",
    );

    await page.setViewportSize({ width: 720, height: 1280 });
    const responsiveMetrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assertCondition(
      responsiveMetrics.scrollWidth <= responsiveMetrics.viewportWidth + 8,
      "Responsive layout now overflows horizontally.",
    );
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
