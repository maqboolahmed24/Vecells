import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "76_closure_governance_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "request_closure_record_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "closure_blocker_casebook.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));

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
          ? "/docs/architecture/76_closure_governance_atlas.html"
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
        : "application/json; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4376, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing governance atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1160 } });
  const url =
    process.env.CLOSURE_GOVERNANCE_ATLAS_URL ??
    "http://127.0.0.1:4376/docs/architecture/76_closure_governance_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='decision-filter']").waitFor();
    await page.locator("[data-testid='blocker-filter']").waitFor();
    await page.locator("[data-testid='trigger-filter']").waitFor();
    await page.locator("[data-testid='lineage-filter']").waitFor();
    await page.locator("[data-testid='decision-ladder']").waitFor();
    await page.locator("[data-testid='blocker-matrix']").waitFor();
    await page.locator("[data-testid='fallback-ribbon']").waitFor();
    await page.locator("[data-testid='closure-table']").waitFor();
    await page.locator("[data-testid='exception-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("button[data-testid^='closure-card-']").count();
    assertCondition(
      initialCards === MANIFEST.summary.scenario_count,
      `Expected ${MANIFEST.summary.scenario_count} closure cards, found ${initialCards}.`,
    );

    await page.locator("[data-testid='decision-filter']").selectOption("defer");
    const deferCards = await page.locator("button[data-testid^='closure-card-']").count();
    assertCondition(deferCards === 6, `Expected 6 defer cards, found ${deferCards}.`);

    await page.locator("[data-testid='decision-filter']").selectOption("all");
    await page.locator("[data-testid='blocker-filter']").selectOption("duplicate_review");
    const duplicateCards = await page.locator("button[data-testid^='closure-card-']").count();
    assertCondition(
      duplicateCards === 1,
      `Expected 1 duplicate-review card, found ${duplicateCards}.`,
    );

    await page.locator("[data-testid='blocker-filter']").selectOption("all");
    await page.locator("[data-testid='trigger-filter']").selectOption("artifact_quarantine");
    const fallbackCards = await page.locator("button[data-testid^='closure-card-']").count();
    assertCondition(
      fallbackCards === 1,
      `Expected 1 artifact-quarantine card, found ${fallbackCards}.`,
    );

    await page.locator("[data-testid='trigger-filter']").selectOption("all");
    const fallbackScenario = page.locator(
      "[data-testid='closure-card-defer_fallback_review_after_degraded_progress']",
    );
    await fallbackScenario.click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("command_api_request_closure_fallbackReviewCase_0001") &&
        inspectorText.includes("REPAIR_OR_REVIEW_OPEN"),
      "Inspector did not synchronize fallback review details.",
    );
    const matrixSelected = await page
      .locator("[data-testid='blocker-row-defer_fallback_review_after_degraded_progress']")
      .getAttribute("data-selected");
    assertCondition(matrixSelected === "true", "Blocker matrix lost synchronized selection state.");
    const fallbackSelected = await page
      .locator("[data-testid='fallback-card-command_api_request_closure_fallbackReviewCase_0001']")
      .getAttribute("data-selected");
    assertCondition(
      fallbackSelected === "true",
      "Fallback ribbon lost synchronized selection state.",
    );

    const parityText = await page.locator("[data-testid='decision-ladder-parity']").innerText();
    assertCondition(
      parityText.includes("visible closure evaluations"),
      "Decision ladder parity text drifted.",
    );
    assertCondition(CASEBOOK.summary.fallback_case_count === 1, "Casebook fallback count drifted.");

    const firstCard = page.locator("[data-testid='closure-card-legal_close_no_blockers']");
    await page.locator("[data-testid='decision-filter']").selectOption("all");
    await page.locator("[data-testid='blocker-filter']").selectOption("all");
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='closure-card-defer_duplicate_review_open']")
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "ArrowDown did not move ladder selection.");

    await page.setViewportSize({ width: 834, height: 1112 });
    const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(inspectorVisible, "Inspector disappeared at tablet width.");

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
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
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

export const closureGovernanceAtlasManifest = {
  task: MANIFEST.task_id,
  scenarios: MANIFEST.summary.scenario_count,
  coverage: [
    "filter behavior across decision and blocker classes",
    "selection synchronization between table, inspector, and diagrams",
    "keyboard navigation",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
  ],
};
