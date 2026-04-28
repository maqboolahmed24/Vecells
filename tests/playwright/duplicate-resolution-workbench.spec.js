import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "70_duplicate_resolution_workbench.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "duplicate_cluster_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "duplicate_resolution_casebook.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "duplicate_pair_evidence_matrix.csv");

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
          ? "/docs/architecture/70_duplicate_resolution_workbench.html"
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
    server.listen(4371, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing workbench HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.DUPLICATE_WORKBENCH_URL ??
    "http://127.0.0.1:4371/docs/architecture/70_duplicate_resolution_workbench.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='constellation']").waitFor();
    await page.locator("[data-testid='comparison-lane']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='evidence-table']").waitFor();
    await page.locator("[data-testid='supersession-history']").waitFor();

    const clusterCards = await page.locator("button[data-testid^='cluster-card-']").count();
    assertCondition(
      clusterCards === MANIFEST.summary.cluster_count,
      `Expected ${MANIFEST.summary.cluster_count} cluster cards, found ${clusterCards}.`,
    );

    await page.locator("[data-testid='relation-filter']").selectOption("same_episode_candidate");
    const sameEpisodeCards = await page.locator("button[data-testid^='cluster-card-']").count();
    assertCondition(
      sameEpisodeCards === 1,
      `Expected 1 same_episode_candidate cluster, found ${sameEpisodeCards}.`,
    );

    await page.locator("[data-testid='relation-filter']").selectOption("all");
    await page.locator("[data-testid='review-status-filter']").selectOption("in_review");
    const inReviewCards = await page.locator("button[data-testid^='cluster-card-']").count();
    assertCondition(inReviewCards === 1, `Expected 1 in-review cluster, found ${inReviewCards}.`);

    await page.locator("[data-testid='review-status-filter']").selectOption("all");
    await page.locator("[data-testid='uncertainty-filter']").selectOption("high");
    const highUncertaintyCards = await page.locator("button[data-testid^='cluster-card-']").count();
    assertCondition(
      highUncertaintyCards === 2,
      `Expected 2 high-uncertainty clusters, found ${highUncertaintyCards}.`,
    );

    await page.locator("[data-testid='uncertainty-filter']").selectOption("all");
    await page.locator("[data-testid='cluster-card-DCL_070_ATTACH']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("DCL_070_ATTACH") &&
        inspectorText.includes("DDR_070_ATTACH_APPLIED") &&
        inspectorText.includes("DPE_070_ATTACH"),
      "Inspector lost cluster, decision, or pair synchronization.",
    );

    const historyRows = await page.locator("[data-testid^='history-row-']").count();
    assertCondition(historyRows === 2, `Expected 2 attach history rows, found ${historyRows}.`);

    const parityText = await page.locator("[data-testid='constellation-parity']").textContent();
    assertCondition(parityText.includes("6 visible clusters"), "Constellation parity drifted.");

    const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
    assertCondition(evidenceRows === 1, `Expected 1 attach evidence row, found ${evidenceRows}.`);

    await page.locator("[data-testid='cluster-card-DCL_070_RETRY']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='cluster-card-DCL_070_ATTACH']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance cluster selection.");

    await page.locator("[data-testid='history-row-DDR_070_ATTACH_REVIEW']").focus();
    await page.keyboard.press("ArrowDown");
    const nextDecisionSelected = await page
      .locator("[data-testid='history-row-DDR_070_ATTACH_APPLIED']")
      .getAttribute("data-selected");
    assertCondition(
      nextDecisionSelected === "true",
      "History keyboard navigation did not advance selection.",
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
    assertCondition(CASEBOOK.summary.case_count === 6, "Casebook summary drifted.");
    assertCondition(
      MATRIX.length === MANIFEST.summary.pair_evidence_count,
      "Matrix row count drifted.",
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

export const duplicateResolutionWorkbenchManifest = {
  task: MANIFEST.task_id,
  clusters: MANIFEST.summary.cluster_count,
  pairEvidence: MANIFEST.summary.pair_evidence_count,
  decisions: MANIFEST.summary.decision_count,
  coverage: [
    "relation and status filtering",
    "cluster selection synchronization",
    "diagram and table parity",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
  ],
};
