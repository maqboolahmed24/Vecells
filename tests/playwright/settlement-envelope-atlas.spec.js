import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "72_settlement_envelope_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "command_settlement_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "settlement_supersession_casebook.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "settlement_to_transition_matrix.csv");

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
          ? "/docs/architecture/72_settlement_envelope_atlas.html"
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
    server.listen(4372, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.SETTLEMENT_ENVELOPE_ATLAS_URL ??
    "http://127.0.0.1:4372/docs/architecture/72_settlement_envelope_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='quadrant']").waitFor();
    await page.locator("[data-testid='revision-rail']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='mapping-table']").waitFor();
    await page.locator("[data-testid='validator-table']").waitFor();

    const cards = await page.locator("button[data-testid^='settlement-card-']").count();
    assertCondition(
      cards === MANIFEST.summary.settlement_revision_count,
      `Expected ${MANIFEST.summary.settlement_revision_count} visible settlement cards, found ${cards}.`,
    );

    await page.locator("[data-testid='result-filter']").selectOption("review_required");
    const reviewCards = await page.locator("button[data-testid^='settlement-card-']").count();
    assertCondition(reviewCards === 1, `Expected 1 review card, found ${reviewCards}.`);

    await page.locator("[data-testid='result-filter']").selectOption("all");
    await page.locator("[data-testid='outcome-filter']").selectOption("recovery_required");
    const recoveryCards = await page.locator("button[data-testid^='settlement-card-']").count();
    assertCondition(recoveryCards === 3, `Expected 3 recovery cards, found ${recoveryCards}.`);

    await page.locator("[data-testid='outcome-filter']").selectOption("all");
    await page.locator("[data-testid='recovery-filter']").selectOption("recovery_required");
    const recoveryOnlyCards = await page.locator("button[data-testid^='settlement-card-']").count();
    assertCondition(
      recoveryOnlyCards === 3,
      `Expected 3 recovery-filtered cards, found ${recoveryOnlyCards}.`,
    );

    await page.locator("[data-testid='settlement-card-CSR_072_DENIED_SCOPE_V1']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("CSR_072_DENIED_SCOPE_V1") &&
        inspectorText.includes("/recover/scope/072_denied_scope") &&
        inspectorText.includes("summary_only"),
      "Inspector lost settlement selection synchronization.",
    );
    const selectedRow = await page
      .locator("[data-testid='mapping-row-CSR_072_DENIED_SCOPE_V1']")
      .getAttribute("data-selected");
    assertCondition(selectedRow === "true", "Mapping row did not synchronize with selected card.");

    await page.locator("[data-testid='settlement-card-CSR_072_BLOCKED_POLICY_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='settlement-card-CSR_072_DENIED_SCOPE_V1']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance settlement selection.");

    await page.locator("[data-testid='recovery-filter']").selectOption("all");
    const parityText = await page.locator("[data-testid='quadrant-parity']").textContent();
    assertCondition(
      parityText.includes("10 visible settlement revisions"),
      "Quadrant parity text drifted.",
    );
    assertCondition(
      MATRIX.length === MANIFEST.summary.settlement_revision_count,
      "Matrix row count drifted from the frozen baseline.",
    );
    assertCondition(CASEBOOK.summary.case_count === 7, "Casebook summary drifted.");

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

export const settlementEnvelopeAtlasManifest = {
  task: MANIFEST.task_id,
  settlementRevisions: MANIFEST.summary.settlement_revision_count,
  coverage: [
    "settlement filtering",
    "card selection synchronization",
    "quadrant and table parity",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
  ],
};
