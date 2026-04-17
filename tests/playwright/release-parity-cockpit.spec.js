import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "51_release_parity_cockpit.html");
const RULES_PATH = path.join(ROOT, "data", "analysis", "release_publication_parity_rules.json");

const RULES_PAYLOAD = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));

export const releaseParityCockpitCoverage = [
  "candidate filtering",
  "candidate selection",
  "matrix and inspector parity",
  "drift-state visibility",
  "keyboard navigation",
  "responsive behavior",
  "reduced motion",
  "accessibility smoke checks",
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
        rawUrl === "/" ? "/docs/architecture/51_release_parity_cockpit.html" : rawUrl.split("?")[0];
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
          : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4351, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing cockpit HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.RELEASE_PARITY_COCKPIT_URL ??
    "http://127.0.0.1:4351/docs/architecture/51_release_parity_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='candidate-rail']").waitFor();
    await page.locator("[data-testid='parity-matrix']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='candidate-card-']").count();
    assertCondition(
      initialCards === RULES_PAYLOAD.releaseCandidates.length,
      `Candidate count drifted: expected ${RULES_PAYLOAD.releaseCandidates.length}, found ${initialCards}`,
    );

    await page.locator("[data-testid='filter-parity']").selectOption("exact");
    const exactCards = await page.locator("[data-testid^='candidate-card-']").count();
    assertCondition(
      exactCards === RULES_PAYLOAD.summary.exact_parity_count,
      `Exact parity filtering drifted: expected ${RULES_PAYLOAD.summary.exact_parity_count}, found ${exactCards}`,
    );

    await page.locator("[data-testid='filter-parity']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("preprod");
    const preprodCards = await page.locator("[data-testid^='candidate-card-']").count();
    assertCondition(preprodCards === 1, `Expected 1 preprod candidate, found ${preprodCards}`);

    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Pre-production approval freeze") &&
        inspectorText.includes("conflict") &&
        inspectorText.includes("quarantined"),
      "Inspector lost expected preprod conflict detail.",
    );

    const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
    assertCondition(matrixRows === 8, `Expected 8 matrix rows, found ${matrixRows}`);

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-candidate']").selectOption("RC_INTEGRATION_V1");
    const integrationInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      integrationInspector.includes("Integration rehearsal") &&
        integrationInspector.includes("DRIFT_051_ROUTE_CONTRACT_DIGEST_SET_STALE"),
      "Integration drift reasons are no longer visible in the inspector.",
    );

    const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
    assertCondition(evidenceRows === 6, `Expected 6 watch evidence rows, found ${evidenceRows}`);

    await page.locator("[data-testid='filter-candidate']").selectOption("all");
    await page.locator("[data-testid='candidate-card-RC_LOCAL_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='candidate-card-RC_CI_PREVIEW_V1']")
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-down navigation no longer advances candidate selection.",
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
    assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}`);
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

export const releaseParityCockpitManifest = {
  task: RULES_PAYLOAD.task_id,
  candidates: RULES_PAYLOAD.summary.candidate_count,
  exactParity: RULES_PAYLOAD.summary.exact_parity_count,
  watchTuples: RULES_PAYLOAD.summary.watch_tuple_count,
};
