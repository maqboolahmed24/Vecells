import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "73_queue_rank_explanation_studio.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "queue_rank_plan_manifest.json");
const FACTOR_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "queue_rank_entry_factor_matrix.csv",
);
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "assignment_suggestion_casebook.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const FACTOR_ROWS = fs.readFileSync(FACTOR_MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);

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
          ? "/docs/architecture/73_queue_rank_explanation_studio.html"
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
    server.listen(4373, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.QUEUE_RANK_STUDIO_URL ??
    "http://127.0.0.1:4373/docs/architecture/73_queue_rank_explanation_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='queue-family-filter']").waitFor();
    await page.locator("[data-testid='overload-filter']").waitFor();
    await page.locator("[data-testid='tier-filter']").waitFor();
    await page.locator("[data-testid='ladder']").waitFor();
    await page.locator("[data-testid='fairness-ribbon']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='factor-table']").waitFor();
    await page.locator("[data-testid='suggestion-table']").waitFor();

    const initialCards = await page.locator(".scenario-card").count();
    assertCondition(
      initialCards === MANIFEST.summary.scenario_count,
      `Expected ${MANIFEST.summary.scenario_count} scenario cards, found ${initialCards}.`,
    );

    await page.locator("[data-testid='queue-family-filter']").selectOption("triage_primary");
    const triageCards = await page.locator(".scenario-card").count();
    assertCondition(triageCards === 4, `Expected 4 triage cards, found ${triageCards}.`);

    await page.locator("[data-testid='overload-filter']").selectOption("overload_critical");
    const overloadCards = await page.locator(".scenario-card").count();
    assertCondition(overloadCards === 1, `Expected 1 overload card, found ${overloadCards}.`);

    await page.locator("[data-testid='overload-filter']").selectOption("all");
    await page.locator("[data-testid='tier-filter']").selectOption("critical");
    const criticalCards = await page.locator(".scenario-card").count();
    assertCondition(criticalCards === 3, `Expected 3 critical-tier cards, found ${criticalCards}.`);

    await page.locator("[data-testid='tier-filter']").selectOption("all");
    await page.locator("[data-testid='scenario-card-queue_reviewer_window']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("queue_reviewer_window") &&
        inspectorText.includes("task_suggest_escalated") &&
        inspectorText.includes("queue-row-order::073e5f9cdeff00112233445566778899"),
      "Inspector lost scenario selection synchronization.",
    );

    const suggestionRows = await page.locator("[data-testid^='suggestion-row-']").count();
    assertCondition(suggestionRows === 3, `Expected 3 suggestion rows, found ${suggestionRows}.`);
    const factorRows = await page.locator("[data-testid^='factor-row-']").count();
    assertCondition(factorRows === 3, `Expected 3 factor rows, found ${factorRows}.`);

    await page.locator("[data-testid='scenario-card-queue_triage_nominal']").focus();
    await page.keyboard.press("ArrowDown");
    const selected = await page
      .locator("[data-testid='scenario-card-queue_triage_overload']")
      .getAttribute("data-selected");
    assertCondition(selected === "true", "ArrowDown did not advance to the next visible scenario.");

    const ladderParity = await page.locator("[data-testid='ladder-parity']").textContent();
    assertCondition(ladderParity.includes("3 visible rank rows"), "Ladder parity text drifted.");
    assertCondition(
      FACTOR_ROWS.length === MANIFEST.summary.factor_row_count,
      "Factor matrix row count drifted from manifest summary.",
    );
    assertCondition(CASEBOOK.summary.case_count === 2, "Suggestion casebook summary drifted.");

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
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

export const queueRankExplanationStudioManifest = {
  task: MANIFEST.task_id,
  scenarios: MANIFEST.summary.scenario_count,
  coverage: [
    "queue-family and tier filtering",
    "row and card selection synchronization",
    "diagram and table parity",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
  ],
};
