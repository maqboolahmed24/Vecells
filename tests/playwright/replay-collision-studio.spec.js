import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "67_replay_collision_studio.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "idempotency_record_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "replay_collision_casebook.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "replay_classification_matrix.csv");

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
          ? "/docs/architecture/67_replay_collision_studio.html"
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
    server.listen(4367, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.REPLAY_COLLISION_STUDIO_URL ??
    "http://127.0.0.1:4367/docs/architecture/67_replay_collision_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='diff-pane']").waitFor();
    await page.locator("[data-testid='decision-timeline']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='checkpoint-table']").waitFor();
    await page.locator("[data-testid='validator-rail']").waitFor();

    const initialCards = await page.locator("button[data-testid^='record-card-']").count();
    assertCondition(
      initialCards === MANIFEST.summary.idempotency_record_count,
      `Expected ${MANIFEST.summary.idempotency_record_count} cards, found ${initialCards}.`,
    );

    const collisionMetric = await page
      .locator("[data-testid='metric-collision-total']")
      .textContent();
    assertCondition(
      collisionMetric === String(MANIFEST.summary.collision_review_count),
      "Collision metric drifted.",
    );

    await page.locator("[data-testid='decision-class-filter']").selectOption("collision_review");
    const collisionCards = await page.locator("button[data-testid^='record-card-']").count();
    assertCondition(
      collisionCards === 2,
      `Expected 2 collision review cards, found ${collisionCards}.`,
    );

    await page.locator("[data-testid='decision-class-filter']").selectOption("all");
    await page.locator("[data-testid='action-scope-filter']").selectOption("booking_commit");
    const bookingCards = await page.locator("button[data-testid^='record-card-']").count();
    assertCondition(bookingCards === 1, `Expected 1 booking card, found ${bookingCards}.`);

    await page.locator("[data-testid='action-scope-filter']").selectOption("all");
    await page.locator("[data-testid='effect-scope-filter']").selectOption("Outbox dispatch reuse");
    const outboxCards = await page.locator("button[data-testid^='record-card-']").count();
    assertCondition(outboxCards === 1, `Expected 1 outbox card, found ${outboxCards}.`);

    await page.locator("[data-testid='effect-scope-filter']").selectOption("all");
    await page.locator("[data-testid='record-card-IDR_067_CALLBACK_SCOPE_DRIFT']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("RCR_067_CALLBACK_SCOPE_DRIFT") &&
        inspectorText.includes("settlement_067_callback_scope_drift_primary"),
      "Inspector lost the callback scope drift selection.",
    );

    const checkpointRows = await page.locator("[data-testid^='checkpoint-row-']").count();
    assertCondition(checkpointRows === 4, `Expected 4 checkpoint rows, found ${checkpointRows}.`);

    const timelineSteps = await page.locator("[data-testid^='timeline-step-']").count();
    assertCondition(timelineSteps === 4, `Expected 4 timeline steps, found ${timelineSteps}.`);

    const validatorRows = await page.locator("[data-testid^='validator-row-']").count();
    assertCondition(
      validatorRows === MANIFEST.validatorResults.length,
      "Validator rail row count drifted.",
    );

    const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
    assertCondition(matrixRows === MATRIX.length, "Classification matrix row count drifted.");

    await page.locator("[data-testid='record-card-IDR_067_BROWSER_PRIMARY']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='record-card-IDR_067_BROWSER_SEMANTIC']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance card selection.");

    await page.locator("[data-testid='matrix-row-IDR_067_SOURCE_COLLISION']").focus();
    await page.keyboard.press("ArrowDown");
    const matrixSelected = await page
      .locator("[data-testid='matrix-row-IDR_067_CALLBACK_SCOPE_DRIFT']")
      .getAttribute("data-selected");
    assertCondition(matrixSelected === "true", "ArrowDown did not advance matrix selection.");

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
    assertCondition(CASEBOOK.summary.replay_case_count === 5, "Casebook summary drifted.");
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

export const replayCollisionStudioManifest = {
  task: MANIFEST.task_id,
  idempotencyRecords: MANIFEST.summary.idempotency_record_count,
  replayCases: CASEBOOK.summary.replay_case_count,
  coverage: [
    "action-scope filtering",
    "decision-class filtering",
    "effect-scope filtering",
    "card selection",
    "timeline and inspector synchronization",
    "checkpoint parity",
    "keyboard navigation",
    "reduced motion",
  ],
};
