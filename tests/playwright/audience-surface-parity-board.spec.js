import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "130_audience_surface_parity_board.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "audience_surface_runtime_bindings.json");

export const audienceSurfaceParityBoardCoverage = [
  "filter synchronization across audience surface, shell type, binding state, and route family",
  "selection sync between lattice nodes, heatmap rows, recovery ladder, and inspector",
  "blocked, recovery, and live rendering references",
  "keyboard traversal and landmarks",
  "reduced-motion handling and responsive layout",
  "accessible table parity for every visible row",
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
      pathname = "/docs/architecture/130_audience_surface_parity_board.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/130_audience_surface_parity_board.html`,
      });
    });
  });
}

function getExpected() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const rows = catalog.surfaceAuthorityRows;
  const operationsRows = rows.filter((row) => row.audienceSurface === "audsurf_operations_console");
  const patientRows = rows.filter((row) => row.shellType === "patient");
  const blockedRows = rows.filter((row) => row.bindingState === "blocked");
  const recoveryRows = rows.filter((row) => row.bindingState === "recovery_only");
  const boardRow = rows.find(
    (row) =>
      row.routeFamilyRef === "rf_operations_board" &&
      row.inventorySurfaceRef === "surf_operations_board",
  );
  assertCondition(boardRow, "Expected an operations-board row in the seq_130 catalog.");
  return {
    rows,
    rowCount: rows.length,
    operationsCount: operationsRows.length,
    patientCount: patientRows.length,
    blockedCount: blockedRows.length,
    recoveryCount: recoveryRows.length,
    boardRow,
  };
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Audience surface parity board HTML is missing.");
  const expected = getExpected();
  assertCondition(expected.rowCount === 23, "Audience-surface row count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1540, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='surface-lattice']").waitFor();
    await page.locator("[data-testid='parity-heatmap']").waitFor();
    await page.locator("[data-testid='recovery-ladder']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='table-parity']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='lattice-node-']").count()) === expected.rowCount,
      "Initial lattice count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='heatmap-row-']").count()) === expected.rowCount,
      "Initial heatmap count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='table-row-']").count()) === expected.rowCount,
      "Initial table-parity count drifted.",
    );

    await page.locator("[data-testid='filter-audience-surface']").selectOption("audsurf_operations_console");
    assertCondition(
      (await page.locator("[data-testid^='lattice-node-']").count()) === expected.operationsCount,
      "Audience-surface filter did not synchronize the lattice.",
    );
    assertCondition(
      (await page.locator("[data-testid^='heatmap-row-']").count()) === expected.operationsCount,
      "Audience-surface filter did not synchronize the heatmap.",
    );
    assertCondition(
      (await page.locator("[data-testid^='table-row-']").count()) === expected.operationsCount,
      "Audience-surface filter did not synchronize the parity table.",
    );

    await page.locator("[data-testid='filter-audience-surface']").selectOption("all");
    await page.locator("[data-testid='filter-shell-type']").selectOption("patient");
    assertCondition(
      (await page.locator("[data-testid^='lattice-node-']").count()) === expected.patientCount,
      "Shell-type filter drifted.",
    );

    await page.locator("[data-testid='filter-shell-type']").selectOption("all");
    await page.locator("[data-testid='filter-binding-state']").selectOption("blocked");
    assertCondition(
      (await page.locator("[data-testid^='lattice-node-']").count()) === expected.blockedCount,
      "Binding-state filter drifted for blocked rows.",
    );

    await page.locator("[data-testid='filter-binding-state']").selectOption("recovery_only");
    assertCondition(
      (await page.locator("[data-testid^='lattice-node-']").count()) === expected.recoveryCount,
      "Binding-state filter drifted for recovery rows.",
    );

    await page.locator("[data-testid='filter-binding-state']").selectOption("all");
    await page.locator("[data-testid='filter-route-family']").selectOption("rf_operations_board");
    assertCondition(
      (await page.locator("[data-testid^='lattice-node-']").count()) === 1,
      "Route-family filter did not isolate the expected row.",
    );

    await page.locator("[data-testid='filter-route-family']").selectOption("all");
    await page.locator(`[data-testid='lattice-node-${expected.boardRow.surfaceAuthorityVerdictId}']`).click();

    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("surf_operations_board") &&
        inspectorText.includes("rf_operations_board") &&
        inspectorText.includes("rpp::local::authoritative"),
      "Inspector lost synchronized tuple detail.",
    );

    assertCondition(
      (await page
        .locator(`[data-testid='heatmap-row-${expected.boardRow.surfaceAuthorityVerdictId}']`)
        .locator("xpath=ancestor::tr")
        .getAttribute("data-selected")) === "true",
      "Heatmap row did not synchronize selection.",
    );
    assertCondition(
      (await page
        .locator(`[data-testid='table-row-${expected.boardRow.surfaceAuthorityVerdictId}']`)
        .locator("xpath=ancestor::tr")
        .getAttribute("data-selected")) === "true",
      "Parity table row did not synchronize selection.",
    );

    const recoveryText = await page.locator("[data-testid='recovery-ladder']").innerText();
    assertCondition(
      recoveryText.includes("RRD_OPERATIONS_DIAGNOSTIC_ONLY"),
      "Recovery ladder did not synchronize the selected row.",
    );

    const visibleOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-testid^='lattice-node-']")).map((node) =>
        node.getAttribute("data-testid"),
      ),
    );
    const currentIndex = visibleOrder.indexOf(
      `lattice-node-${expected.boardRow.surfaceAuthorityVerdictId}`,
    );
    assertCondition(currentIndex >= 0, "Selected lattice node is missing from visible order.");
    const expectedNext = visibleOrder[Math.min(currentIndex + 1, visibleOrder.length - 1)];
    await page.locator(`[data-testid='lattice-node-${expected.boardRow.surfaceAuthorityVerdictId}']`).focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator(`[data-testid='${expectedNext}'][data-selected='true']`).count()) === 1,
      "ArrowDown did not advance lattice selection.",
    );

    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Inspector landmark is missing.");

    const liveColor = await page
      .locator("[data-testid='state-reference-publishable_live'] .badge")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    const recoveryColor = await page
      .locator("[data-testid='state-reference-recovery_only'] .badge")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    const blockedColor = await page
      .locator("[data-testid='state-reference-blocked'] .badge")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assertCondition(liveColor !== blockedColor, "Live and blocked rendering references are no longer distinct.");
    assertCondition(recoveryColor !== blockedColor, "Recovery and blocked rendering references are no longer distinct.");

    await page.setViewportSize({ width: 960, height: 960 });
    assertCondition(
      await page.locator("[data-testid='table-parity']").isVisible(),
      "Table parity disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow width.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
