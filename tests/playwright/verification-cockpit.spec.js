import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "58_verification_cockpit.html");
const POLICY_PATH = path.join(ROOT, "data", "analysis", "environment_ring_policy.json");
const SCENARIO_PATH = path.join(ROOT, "data", "analysis", "verification_scenarios.json");

const POLICY_PAYLOAD = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
const SCENARIO_PAYLOAD = JSON.parse(fs.readFileSync(SCENARIO_PATH, "utf8"));

export const verificationCockpitCoverage = [
  "ring filtering",
  "gate filtering",
  "scenario selection",
  "diagram and matrix and inspector synchronization",
  "keyboard navigation",
  "responsive layout",
  "reduced motion",
  "accessibility smoke checks",
  "table parity",
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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/" ? "/docs/architecture/58_verification_cockpit.html" : rawUrl.split("?")[0];
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
    server.listen(4358, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing cockpit HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.VERIFICATION_COCKPIT_URL ??
    "http://127.0.0.1:4358/docs/architecture/58_verification_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='ring-diagram']").waitFor();
    await page.locator("[data-testid='gate-strip']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='scenario-card-']").count();
    assertCondition(
      initialCards === SCENARIO_PAYLOAD.verificationScenarios.length,
      `Scenario count drifted: expected ${SCENARIO_PAYLOAD.verificationScenarios.length}, found ${initialCards}`,
    );

    await page.locator("[data-testid='ring-filter']").selectOption("integration");
    const integrationCards = await page.locator("[data-testid^='scenario-card-']").count();
    assertCondition(
      integrationCards === 1,
      `Expected 1 integration scenario, found ${integrationCards}`,
    );

    await page.locator("[data-testid='ring-filter']").selectOption("all");
    await page
      .locator("[data-testid='gate-filter']")
      .selectOption("GATE_4_RESILIENCE_AND_RECOVERY");
    const gateCards = await page.locator("[data-testid^='scenario-card-']").count();
    assertCondition(gateCards === 1, `Expected 1 Gate 4 scenario, found ${gateCards}`);

    await page.locator("[data-testid='gate-filter']").selectOption("all");
    await page.locator("[data-testid='drift-filter']").selectOption("rollback_required");
    const rollbackCards = await page.locator("[data-testid^='scenario-card-']").count();
    assertCondition(
      rollbackCards === 1,
      `Expected 1 rollback-required scenario, found ${rollbackCards}`,
    );

    await page.locator("[data-testid='drift-filter']").selectOption("all");
    await page.locator("[data-testid='scenario-card-VS_058_PRODUCTION_V1']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("VS_058_PRODUCTION_V1") &&
        inspectorText.includes("rollback_required") &&
        inspectorText.includes("WCF_PRODUCTION_V1"),
      "Inspector lost the expected production rollback posture.",
    );

    await page.locator("[data-testid='matrix-row-GATE_5_LIVE_WAVE_PROOF']").click();
    const selectedMatrix = await page
      .locator("[data-testid='matrix-row-GATE_5_LIVE_WAVE_PROOF']")
      .getAttribute("data-selected");
    assertCondition(selectedMatrix === "true", "Gate 5 matrix row did not stay selected.");
    const gateInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      gateInspector.includes("GATE_5_LIVE_WAVE_PROOF"),
      "Inspector did not synchronize with the selected gate row.",
    );

    await page.locator("[data-testid='scenario-card-VS_058_LOCAL_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const secondScenarioSelected = await page
      .locator("[data-testid='scenario-card-VS_058_CI_PREVIEW_V1']")
      .getAttribute("data-selected");
    assertCondition(
      secondScenarioSelected === "true",
      "Arrow-down navigation no longer advances scenario selection.",
    );

    const ringNodes = await page.locator("[data-testid^='ring-node-']").count();
    const ringParityRows = await page.locator("[data-testid='ring-parity-table'] tbody tr").count();
    assertCondition(
      ringNodes === 5 && ringParityRows === 5,
      "Ring diagram and parity table drifted.",
    );

    const gateNodes = await page.locator("[data-testid^='gate-chip-']").count();
    const gateParityRows = await page.locator("[data-testid='gate-parity-table'] tbody tr").count();
    assertCondition(
      gateNodes === 5 && gateParityRows === 5,
      "Gate strip and parity table drifted.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='inspector']").waitFor();

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
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}`);
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

export const verificationCockpitManifest = {
  task: POLICY_PAYLOAD.task_id,
  rings: POLICY_PAYLOAD.summary.ring_count,
  scenarios: SCENARIO_PAYLOAD.summary.scenario_count,
  gates: POLICY_PAYLOAD.summary.gate_count,
};
