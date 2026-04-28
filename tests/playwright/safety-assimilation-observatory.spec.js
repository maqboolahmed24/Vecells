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
  "79_safety_assimilation_observatory.html",
);
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "evidence_assimilation_casebook.json");
const URGENT_MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "urgent_diversion_truth_manifest.json",
);

const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const URGENT_MANIFEST = JSON.parse(fs.readFileSync(URGENT_MANIFEST_PATH, "utf8"));

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
          ? "/docs/architecture/79_safety_assimilation_observatory.html"
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
    server.listen(4379, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing observatory HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1160 } });
  const url =
    process.env.SAFETY_ASSIMILATION_OBSERVATORY_URL ??
    "http://127.0.0.1:4379/docs/architecture/79_safety_assimilation_observatory.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='source-filter']").waitFor();
    await page.locator("[data-testid='trigger-filter']").waitFor();
    await page.locator("[data-testid='safety-filter']").waitFor();
    await page.locator("[data-testid='urgent-filter']").waitFor();
    await page.locator("[data-testid='evidence-ribbon']").waitFor();
    await page.locator("[data-testid='rule-heat-surface']").waitFor();
    await page.locator("[data-testid='urgent-ladder']").waitFor();
    await page.locator("[data-testid='assimilation-table']").waitFor();
    await page.locator("[data-testid='safety-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("button[data-testid^='ribbon-card-']").count();
    assertCondition(
      initialCards === CASEBOOK.summary.scenario_count,
      `Expected ${CASEBOOK.summary.scenario_count} ribbon cards, found ${initialCards}.`,
    );

    await page.locator("[data-testid='source-filter']").selectOption("support_capture");
    let filteredCards = await page.locator("button[data-testid^='ribbon-card-']").count();
    assertCondition(
      filteredCards === 1,
      `Expected 1 support_capture card, found ${filteredCards}.`,
    );

    await page.locator("[data-testid='source-filter']").selectOption("all");
    await page.locator("[data-testid='trigger-filter']").selectOption("blocked_manual_review");
    filteredCards = await page.locator("button[data-testid^='ribbon-card-']").count();
    assertCondition(
      filteredCards === 1,
      `Expected 1 blocked_manual_review card, found ${filteredCards}.`,
    );

    await page.locator("[data-testid='trigger-filter']").selectOption("all");
    await page.locator("[data-testid='safety-filter']").selectOption("residual_risk_flagged");
    filteredCards = await page.locator("button[data-testid^='ribbon-card-']").count();
    assertCondition(
      filteredCards === 3,
      `Expected 3 residual_risk_flagged cards, found ${filteredCards}.`,
    );

    await page.locator("[data-testid='safety-filter']").selectOption("all");
    await page.locator("[data-testid='urgent-filter']").selectOption("issued");
    filteredCards = await page.locator("button[data-testid^='ribbon-card-']").count();
    assertCondition(filteredCards === 1, `Expected 1 urgent issued card, found ${filteredCards}.`);

    await page.locator("[data-testid='urgent-filter']").selectOption("all");
    const callbackRow = page.locator(
      "[data-testid='safety-row-callback_outcome_triggers_urgent_diversion']",
    );
    await callbackRow.click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("assimilation_safety_evidenceAssimilation_0004") &&
        inspectorText.includes("urgent_live"),
      "Inspector did not synchronize callback urgent details.",
    );
    const heatSelected = await page
      .locator("[data-testid='heat-row-callback_outcome_triggers_urgent_diversion']")
      .getAttribute("data-selected");
    assertCondition(heatSelected === "true", "Heat surface lost synchronized selection state.");
    const assimilationSelected = await page
      .locator("[data-testid='assimilation-row-callback_outcome_triggers_urgent_diversion']")
      .getAttribute("data-selected");
    assertCondition(
      assimilationSelected === "true",
      "Assimilation table lost synchronized selection state.",
    );

    const firstCard = page.locator(
      "[data-testid='ribbon-card-post_submit_reply_no_material_change']",
    );
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='ribbon-card-reply_clinically_material_forces_resafety']")
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "ArrowDown did not move ribbon selection.");

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

    const urgentMetric = await page.locator("[data-testid='metric-urgent']").innerText();
    assertCondition(
      urgentMetric === String(URGENT_MANIFEST.summary.urgent_required_count),
      "Urgent metric drifted from urgent diversion manifest.",
    );
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

export const safetyAssimilationObservatoryCoverage = {
  task: CASEBOOK.task_id,
  scenarios: CASEBOOK.summary.scenario_count,
  coverage: [
    "filtering and synchronization across assimilation and safety views",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
  ],
};
