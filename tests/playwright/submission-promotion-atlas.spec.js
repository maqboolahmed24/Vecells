import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "66_promotion_mapping_atlas.html");
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "submission_promotion_record_manifest.json",
);
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "promotion_replay_casebook.json");

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
          ? "/docs/architecture/66_promotion_mapping_atlas.html"
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
    server.listen(4366, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1100 } });
  const url =
    process.env.SUBMISSION_PROMOTION_ATLAS_URL ??
    "http://127.0.0.1:4366/docs/architecture/66_promotion_mapping_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='bridge-diagram']").waitFor();
    await page.locator("[data-testid='continuity-ribbon']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("button[data-testid^='promotion-card-']").count();
    assertCondition(
      initialCards === MANIFEST.summary.promotion_boundary_count,
      `Expected ${MANIFEST.summary.promotion_boundary_count} cards, found ${initialCards}.`,
    );

    const promotionMetric = await page
      .locator("[data-testid='metric-promotion-total']")
      .textContent();
    assertCondition(
      promotionMetric === String(MANIFEST.summary.committed_promotion_count),
      "Promotion total metric drifted.",
    );

    await page.locator("[data-testid='state-filter']").selectOption("promoted");
    const promotedCards = await page.locator("button[data-testid^='promotion-card-']").count();
    assertCondition(promotedCards === 5, `Expected 5 promoted cards, found ${promotedCards}.`);

    await page.locator("[data-testid='state-filter']").selectOption("all");
    await page.locator("[data-testid='replay-filter']").selectOption("support_resume_replay");
    const supportReplayCards = await page.locator("button[data-testid^='promotion-card-']").count();
    assertCondition(
      supportReplayCards === 1,
      `Expected 1 support replay card, found ${supportReplayCards}.`,
    );

    await page.locator("[data-testid='replay-filter']").selectOption("all");
    await page.locator("[data-testid='channel-filter']").selectOption("support_console");
    const supportChannelCards = await page
      .locator("button[data-testid^='promotion-card-']")
      .count();
    assertCondition(
      supportChannelCards === 1,
      `Expected 1 support console card, found ${supportChannelCards}.`,
    );

    await page.locator("[data-testid='promotion-card-PM_066_SUPPORT_RESUME_V1']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("request_shell_redirect") &&
        inspectorText.includes("promotion_066_support_resume_v1"),
      "Inspector lost the support resume selection.",
    );

    const replayRows = await page.locator("[data-testid^='replay-row-']").count();
    assertCondition(replayRows === 1, `Expected 1 linked replay row, found ${replayRows}.`);
    const replayLinked = await page
      .locator("[data-testid='replay-row-CASE_066_SUPPORT_RESUME']")
      .getAttribute("data-linked");
    assertCondition(replayLinked === "true", "Replay row no longer links to the selected card.");

    await page.locator("[data-testid='channel-filter']").selectOption("all");
    await page.locator("[data-testid='promotion-card-PM_066_BROWSER_PRIMARY_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const selectedCard = await page
      .locator("[data-testid='promotion-card-PM_066_BROWSER_CROSSTAB_V1']")
      .getAttribute("data-selected");
    assertCondition(selectedCard === "true", "ArrowDown did not advance card selection.");

    const bridgeNodes = await page.locator("[data-testid^='bridge-node-']").count();
    const parityNodes = await page.locator("[data-testid^='bridge-parity-row-']").count();
    assertCondition(bridgeNodes === 4, `Expected 4 bridge nodes, found ${bridgeNodes}.`);
    assertCondition(bridgeNodes === parityNodes, "Bridge parity row count drifted.");

    await page.locator("[data-testid='mapping-row-PM_066_BROWSER_CROSSTAB_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const nextRowSelected = await page
      .locator("[data-testid='mapping-row-PM_066_AUTH_RETURN_V1']")
      .getAttribute("data-selected");
    assertCondition(nextRowSelected === "true", "ArrowDown did not advance mapping row selection.");

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
    assertCondition(landmarks >= 7, `Expected multiple landmarks, found ${landmarks}.`);
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

export const submissionPromotionAtlasManifest = {
  task: MANIFEST.task_id,
  promotionBoundaries: MANIFEST.summary.promotion_boundary_count,
  replayCases: CASEBOOK.summary.replay_case_count,
  coverage: [
    "envelope state filtering",
    "replay filtering",
    "channel filtering",
    "promotion card selection",
    "bridge and table parity",
    "keyboard navigation",
    "responsive layout",
    "reduced motion",
  ],
};
