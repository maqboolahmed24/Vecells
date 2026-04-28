import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "69_reachability_truth_studio.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "contact_route_snapshot_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "reachability_assessment_casebook.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "reachability_dependency_matrix.csv");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const MATRIX = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);

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
          ? "/docs/architecture/69_reachability_truth_studio.html"
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
    server.listen(4370, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.REACHABILITY_STUDIO_URL ??
    "http://127.0.0.1:4370/docs/architecture/69_reachability_truth_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='constellation']").waitFor();
    await page.locator("[data-testid='snapshot-stack']").waitFor();
    await page.locator("[data-testid='repair-ribbon']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='observation-table']").waitFor();
    await page.locator("[data-testid='checkpoint-table']").waitFor();

    const dependencyCards = await page.locator("button[data-testid^='dependency-card-']").count();
    assertCondition(
      dependencyCards === MANIFEST.summary.dependency_count,
      `Expected ${MANIFEST.summary.dependency_count} visible dependency cards, found ${dependencyCards}.`,
    );

    await page.locator("[data-testid='domain-filter']").selectOption("pharmacy");
    const pharmacyCards = await page.locator("button[data-testid^='dependency-card-']").count();
    assertCondition(
      pharmacyCards === 2,
      `Expected 2 pharmacy dependency cards, found ${pharmacyCards}.`,
    );

    await page.locator("[data-testid='domain-filter']").selectOption("all");
    await page.locator("[data-testid='assessment-state-filter']").selectOption("blocked");
    const blockedCards = await page.locator("button[data-testid^='dependency-card-']").count();
    assertCondition(
      blockedCards === 2,
      `Expected 2 blocked dependency cards, found ${blockedCards}.`,
    );

    await page.locator("[data-testid='assessment-state-filter']").selectOption("all");
    await page.locator("[data-testid='repair-state-filter']").selectOption("awaiting_verification");
    const verificationCards = await page.locator("button[data-testid^='dependency-card-']").count();
    assertCondition(
      verificationCards === 1,
      `Expected 1 awaiting-verification dependency, found ${verificationCards}.`,
    );

    await page.locator("[data-testid='repair-state-filter']").selectOption("all");
    await page.locator("[data-testid='dependency-card-DEP_069_CALLBACK']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("DEP_069_CALLBACK") &&
        inspectorText.includes("INVALID_ROUTE_CONFIRMED") &&
        inspectorText.includes("CK_069_CALLBACK_OTP"),
      "Inspector lost dependency selection synchronization.",
    );
    const callbackRibbon = await page.locator("[data-testid='repair-ribbon']").innerText();
    assertCondition(
      callbackRibbon.includes("RJ_069_CALLBACK") &&
        callbackRibbon.includes("awaiting_verification"),
      "Repair spotlight ribbon drifted for callback repair.",
    );

    const observationRows = await page.locator("[data-testid^='observation-row-']").count();
    assertCondition(
      observationRows === 1,
      `Expected 1 callback observation row, found ${observationRows}.`,
    );
    const checkpointRows = await page.locator("[data-testid^='checkpoint-row-']").count();
    assertCondition(
      checkpointRows === 1,
      `Expected 1 callback checkpoint row, found ${checkpointRows}.`,
    );

    const parityText = await page.locator("[data-testid='constellation-parity']").textContent();
    assertCondition(
      parityText.includes("6 visible dependencies"),
      "Constellation parity text drifted.",
    );
    const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
    assertCondition(
      matrixRows === MANIFEST.summary.dependency_count,
      "Dependency matrix parity drifted.",
    );

    await page.locator("[data-testid='dependency-card-DEP_069_CALLBACK']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='dependency-card-DEP_069_MESSAGE']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance dependency selection.");

    await page.locator("[data-testid='dependency-card-DEP_069_URGENT']").click();
    const snapshotRows = await page.locator("[data-testid^='snapshot-row-']").count();
    assertCondition(snapshotRows === 3, `Expected 3 urgent snapshot rows, found ${snapshotRows}.`);
    const snapshotParity = await page.locator("[data-testid='snapshot-parity']").textContent();
    assertCondition(
      snapshotParity.includes("3 frozen route snapshots"),
      "Snapshot parity drifted.",
    );
    const urgentRibbon = await page.locator("[data-testid='repair-ribbon']").innerText();
    assertCondition(
      urgentRibbon.includes("RJ_069_URGENT") && urgentRibbon.includes("completed"),
      "Repair spotlight ribbon failed to update for the urgent rebound case.",
    );

    await page.locator("[data-testid='matrix-row-DEP_069_CALLBACK']").focus();
    await page.keyboard.press("ArrowDown");
    const matrixSelected = await page
      .locator("[data-testid='matrix-row-DEP_069_MESSAGE']")
      .getAttribute("data-selected");
    assertCondition(
      matrixSelected === "true",
      "Matrix keyboard navigation did not advance selection.",
    );

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
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
    assertCondition(CASEBOOK.summary.case_count === 4, "Casebook summary drifted.");
    assertCondition(
      MATRIX.length === MANIFEST.summary.dependency_count,
      "Dependency matrix row count drifted.",
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

export const reachabilityTruthStudioManifest = {
  task: MANIFEST.task_id,
  dependencies: MANIFEST.summary.dependency_count,
  checkpoints: MANIFEST.summary.verification_checkpoint_count,
  coverage: [
    "domain filtering",
    "state filtering",
    "selection synchronization",
    "repair spotlight ribbon",
    "diagram and table parity",
    "keyboard navigation",
    "reduced motion",
  ],
};
