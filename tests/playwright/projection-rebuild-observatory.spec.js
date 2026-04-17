import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "82_projection_rebuild_observatory.html");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "projection_rebuild_casebook.json");
const CHECKPOINT_PATH = path.join(ROOT, "data", "analysis", "projection_checkpoint_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "event_applier_dispatch_matrix.csv");

const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const CHECKPOINT_MANIFEST = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
const MATRIX_ROWS = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);

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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/82_projection_rebuild_observatory.html"
          : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4382, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing observatory HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.PROJECTION_REBUILD_OBSERVATORY_URL ??
    "http://127.0.0.1:4382/docs/architecture/82_projection_rebuild_observatory.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "filter-family",
      "filter-readiness",
      "filter-compatibility",
      "filter-environment",
      "flow-diagram",
      "lag-surface",
      "readiness-strip",
      "rebuild-table",
      "applier-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    let scenarioRows = await page.locator("button[data-testid^='scenario-row-']").count();
    assertCondition(
      scenarioRows === CASEBOOK.summary.scenario_count,
      `Expected ${CASEBOOK.summary.scenario_count} scenario rows, found ${scenarioRows}.`,
    );

    await page.locator("[data-testid='filter-readiness']").selectOption("live");
    scenarioRows = await page.locator("button[data-testid^='scenario-row-']").count();
    assertCondition(scenarioRows === 3, `Expected 3 live scenarios, found ${scenarioRows}.`);

    await page.locator("[data-testid='filter-readiness']").selectOption("all");
    await page.locator("[data-testid='filter-compatibility']").selectOption("blocked");
    scenarioRows = await page.locator("button[data-testid^='scenario-row-']").count();
    assertCondition(scenarioRows === 1, `Expected 1 blocked scenario, found ${scenarioRows}.`);

    await page.locator("[data-testid='filter-compatibility']").selectOption("all");
    await page.locator("[data-testid='filter-family']").selectOption("PRCF_082_PATIENT_REQUESTS");
    scenarioRows = await page.locator("button[data-testid^='scenario-row-']").count();
    assertCondition(
      scenarioRows === 2,
      `Expected 2 patient-request scenarios, found ${scenarioRows}.`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page.locator("[data-testid='scenario-row-PRB_082_DUAL_READ_COMPARE']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("PRCV_082_PATIENT_REQUESTS_V2") &&
        inspectorText.includes("summaryDigest") &&
        inspectorText.includes("projectionFlavor"),
      "Inspector lost synchronized dual-read detail.",
    );
    const flowText = await page.locator("[data-testid='flow-diagram']").innerText();
    assertCondition(
      flowText.includes("request.created") && flowText.includes("PRCF_082_PATIENT_REQUESTS"),
      "Flow diagram detail did not synchronize with the selected scenario.",
    );
    const selectedLagTiles = await page.locator(".lag-card[data-selected='true']").count();
    assertCondition(
      selectedLagTiles === 1,
      "Lag surface did not preserve a single synchronized selection.",
    );

    await page.locator("[data-testid='scenario-row-PRB_082_COLD_REBUILD']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='scenario-row-PRB_082_PARTIAL_RESUME']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance the selection.");

    assertCondition(MATRIX_ROWS.length === 15, "Dispatch matrix row count drifted.");
    assertCondition(
      CHECKPOINT_MANIFEST.summary.checkpoint_record_count === 7,
      "Checkpoint manifest summary drifted.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1024, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at mobile width.",
    );

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 8,
      `Accessibility smoke failed: found only ${landmarks} landmarks.`,
    );
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

export const projectionRebuildObservatoryManifest = {
  task: CASEBOOK.task_id,
  scenarios: CASEBOOK.summary.scenario_count,
  checkpoints: CHECKPOINT_MANIFEST.summary.checkpoint_record_count,
  dispatchRows: MATRIX_ROWS.length,
  coverage: [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks",
  ],
};
