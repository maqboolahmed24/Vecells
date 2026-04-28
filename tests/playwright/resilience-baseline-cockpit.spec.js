import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "101_resilience_baseline_cockpit.html",
);
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "resilience_baseline_catalog.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "readiness_coverage_matrix.csv");

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
          ? "/docs/architecture/101_resilience_baseline_cockpit.html"
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
    server.listen(4401, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing resilience cockpit: ${HTML_PATH}`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const matrixRows = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);
  const tupleDriftCount = catalog.scenarios.filter(
    (row) => row.actualReadinessState === "tuple_drift",
  ).length;

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.RESILIENCE_BASELINE_COCKPIT_URL ??
    "http://127.0.0.1:4401/docs/architecture/101_resilience_baseline_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "cockpit-masthead",
      "readiness-summary",
      "filter-scenario",
      "filter-readiness",
      "scenario-grid",
      "scenario-table",
      "manifest-table",
      "essential-function-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    assertCondition(
      (await page.locator(".scenario-card").count()) === catalog.summary.scenario_count,
      "Scenario-card count drifted from the catalog summary.",
    );
    assertCondition(
      matrixRows.length === catalog.summary.scenario_count * catalog.summary.essential_function_count,
      "Readiness matrix row count drifted from scenario and function coverage.",
    );

    // filters by readiness and keeps counts synchronized
    await page.locator("[data-testid='filter-readiness']").selectOption("tuple_drift");
    assertCondition(
      (await page.locator(".scenario-card").count()) === tupleDriftCount,
      "Tuple-drift filter count drifted.",
    );

    // selection stays synchronized between scenario cards, table rows, and inspector
    await page.locator("[data-testid='scenario-card-PREPROD_TUPLE_DRIFT']").click();
    let inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("PREPROD_TUPLE_DRIFT") &&
        inspectorText.includes("RESILIENCE_TUPLE_DRIFT"),
      "Inspector did not synchronize from the tuple-drift scenario card.",
    );

    await page.locator("[data-testid='filter-readiness']").selectOption("all");
    await page.locator("[data-testid='scenario-row-PREPROD_ASSURANCE_OR_FREEZE_BLOCKED']").click();
    inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("PREPROD_ASSURANCE_OR_FREEZE_BLOCKED") &&
        inspectorText.includes("ASSURANCE_OR_FREEZE_BLOCKED"),
      "Inspector did not synchronize from the scenario table row.",
    );

    const manifestRows = await page.locator("[data-testid^='manifest-row-']").count();
    const functionRows = await page.locator("[data-testid='essential-function-table'] tbody tr").count();
    assertCondition(manifestRows === 6, `Expected 6 manifest rows, found ${manifestRows}.`);
    assertCondition(functionRows === catalog.summary.essential_function_count, "Function table drifted.");

    // keyboard flow, reduced motion, responsive layout, and landmarks remain intact
    await page.locator("[data-testid='scenario-card-LOCAL_EXACT_READY']").focus();
    await page.keyboard.press("Enter");
    inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("LOCAL_EXACT_READY"),
      "Keyboard activation did not keep scenario selection stable.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reduced = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reduced === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1080, height: 980 });
    assertCondition(
      await page.locator("[data-testid='manifest-table']").isVisible(),
      "Manifest table disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='essential-function-table']").isVisible(),
      "Function table disappeared at tablet width.",
    );

    const landmarks = await page.locator("main, aside, section").count();
    assertCondition(landmarks >= 7, `Accessibility smoke failed: found only ${landmarks} landmarks.`);
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
} else {
  assertCondition(fs.existsSync(HTML_PATH), `Missing resilience cockpit: ${HTML_PATH}`);
  assertCondition(fs.existsSync(CATALOG_PATH), `Missing resilience catalog: ${CATALOG_PATH}`);
  assertCondition(fs.existsSync(MATRIX_PATH), `Missing readiness matrix: ${MATRIX_PATH}`);
}

export const resilienceBaselineCockpitCoverage = {
  task: "par_101",
  coverage: [
    "filter behavior and synchronized selection",
    "manifest and essential-function table fallback",
    "keyboard flow",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks and blocker readability",
  ],
};
