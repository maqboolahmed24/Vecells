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
  "95_migration_and_backfill_control_room.html",
);
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "migration_backfill_control_catalog.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "migration_readiness_matrix.csv");

const CATALOG = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
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
          ? "/docs/architecture/95_migration_and_backfill_control_room.html"
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
    server.listen(4395, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing control room HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.MIGRATION_BACKFILL_CONTROL_ROOM_URL ??
    "http://127.0.0.1:4395/docs/architecture/95_migration_and_backfill_control_room.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "phase-diagram",
      "readiness-matrix",
      "execution-timeline",
      "execution-table",
      "evidence-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    let matrixCards = await page.locator(".matrix-card").count();
    assertCondition(
      matrixCards === CATALOG.summary.scenario_count,
      `Expected ${CATALOG.summary.scenario_count} matrix cards, found ${matrixCards}.`,
    );
    assertCondition(
      MATRIX_ROWS.length === CATALOG.summary.scenario_count,
      "Matrix csv row count drifted from catalog scenario count.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("local");
    matrixCards = await page.locator(".matrix-card").count();
    assertCondition(matrixCards === 3, `Expected 3 local scenarios, found ${matrixCards}.`);

    await page.locator("[data-testid='filter-verdict-state']").selectOption("ready");
    matrixCards = await page.locator(".matrix-card").count();
    assertCondition(matrixCards === 1, `Expected 1 ready scenario, found ${matrixCards}.`);
    const inspectorReady = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorReady.includes("LOCAL_READY") || inspectorReady.includes("local"),
      "Inspector did not synchronize after ready filtering.",
    );

    await page.locator("[data-testid='filter-verdict-state']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-rollback-mode']").selectOption("binary_safe");
    matrixCards = await page.locator(".matrix-card").count();
    assertCondition(matrixCards === 2, `Expected 2 binary_safe scenarios, found ${matrixCards}.`);

    await page.locator("[data-testid='filter-rollback-mode']").selectOption("all");
    await page.locator("[data-testid='execution-row-LOCAL_ROLLBACK_MISMATCH']").click();
    const phaseText = await page.locator("[data-testid='phase-diagram']").innerText();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    const evidenceText = await page.locator("[data-testid='evidence-table']").innerText();
    assertCondition(
      phaseText.includes("PCF_050_RF_OPERATIONS_BOARD_V1") &&
        inspectorText.includes("rollback_only") &&
        inspectorText.includes("binary_safe"),
      "Phase diagram or inspector did not follow the selected execution row.",
    );
    assertCondition(
      evidenceText.includes("rollback") && evidenceText.includes("mismatch"),
      "Evidence table lost synchronized rollback detail.",
    );

    await page.locator("[data-testid='execution-row-LOCAL_READY']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='execution-row-LOCAL_CONSTRAINED']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance execution-row selection.");

    const readyCount = await page.locator('[data-verdict-state="ready"]').count();
    const constrainedCount = await page.locator('[data-verdict-state="constrained"]').count();
    const blockedCount = await page.locator('[data-verdict-state="blocked"]').count();
    assertCondition(readyCount > 0, "Ready verdict styling disappeared.");
    assertCondition(constrainedCount > 0, "Constrained verdict styling disappeared.");
    assertCondition(blockedCount > 0, "Blocked verdict styling disappeared.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reduced = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reduced === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1100, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='execution-table']").isVisible(),
      "Execution table disappeared at tablet width.",
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

export const migrationAndBackfillControlRoomManifest = {
  task: CATALOG.task_id,
  scenarios: CATALOG.summary.scenario_count,
  coverage: [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks and landmark verification",
    "blocked, constrained, and ready verdicts remain visually and semantically distinct",
  ],
};
