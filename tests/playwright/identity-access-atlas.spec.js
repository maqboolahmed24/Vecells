import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "68_identity_access_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "identity_binding_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "grant_supersession_casebook.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "access_grant_scope_matrix.csv");

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

async function waitForTestIdFocus(page, testId, message, timeoutMs = 3000) {
  const startedAt = Date.now();
  let activeTestId = null;
  while (Date.now() - startedAt < timeoutMs) {
    activeTestId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    if (activeTestId === testId) {
      return;
    }
    await page.waitForTimeout(50);
  }
  throw new Error(`${message} Active test id: ${activeTestId ?? "none"}.`);
}

async function waitForSelected(locator, message, timeoutMs = 3000) {
  const startedAt = Date.now();
  let selected = null;
  while (Date.now() - startedAt < timeoutMs) {
    selected = await locator.getAttribute("data-selected");
    if (selected === "true") {
      return;
    }
    await locator.page().waitForTimeout(50);
  }
  throw new Error(`${message} Last data-selected: ${selected ?? "missing"}.`);
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/" ? "/docs/architecture/68_identity_access_atlas.html" : rawUrl.split("?")[0];
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
    server.listen(4368, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.IDENTITY_ACCESS_ATLAS_URL ??
    "http://127.0.0.1:4368/docs/architecture/68_identity_access_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='binding-chain']").waitFor();
    await page.locator("[data-testid='grant-lattice']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='redemption-log']").waitFor();
    await page.locator("[data-testid='scope-rule-table']").waitFor();

    const bindingNodes = await page.locator("button[data-testid^='binding-node-']").count();
    assertCondition(
      bindingNodes === MANIFEST.summary.identity_binding_count,
      `Expected ${MANIFEST.summary.identity_binding_count} binding nodes, found ${bindingNodes}.`,
    );

    const claimMetric = await page.locator("[data-testid='metric-live-grants']").textContent();
    assertCondition(claimMetric === "2", "Live grant metric drifted.");

    await page
      .locator("[data-testid='grant-family-filter']")
      .selectOption("transaction_action_minimal");
    const transactionCards = await page.locator("button[data-testid^='grant-card-']").count();
    assertCondition(
      transactionCards === 2,
      `Expected 2 transaction grant cards, found ${transactionCards}.`,
    );

    await page.locator("[data-testid='grant-family-filter']").selectOption("all");
    await page.locator("[data-testid='binding-state-filter']").selectOption("corrected");
    const correctedBindings = await page.locator("button[data-testid^='binding-node-']").count();
    assertCondition(
      correctedBindings === 1,
      `Expected 1 corrected binding node, found ${correctedBindings}.`,
    );

    await page.locator("[data-testid='binding-state-filter']").selectOption("all");
    await page.locator("[data-testid='action-scope-filter']").selectOption("message_reply");
    const messageCards = await page.locator("button[data-testid^='grant-card-']").count();
    assertCondition(messageCards === 2, `Expected 2 message_reply grants, found ${messageCards}.`);

    await page.locator("[data-testid='grant-card-AG_068_MESSAGE_REPLY_V1']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("AG_068_MESSAGE_REPLY_V1") &&
        inspectorText.includes("AGS_068_ROTATION"),
      "Inspector lost grant or supersession synchronization.",
    );

    const redemptionRows = await page.locator("[data-testid^='redemption-row-']").count();
    assertCondition(
      redemptionRows === 1,
      `Expected 1 redemption row for selected grant, found ${redemptionRows}.`,
    );

    await page.locator("[data-testid='action-scope-filter']").selectOption("all");
    await page.locator("[data-testid='binding-node-IB_068_001']").focus();
    await page.keyboard.press("ArrowDown");
    await waitForSelected(
      page.locator("[data-testid='binding-node-IB_068_002']"),
      "ArrowDown did not advance binding selection.",
    );
    await waitForTestIdFocus(
      page,
      "binding-node-IB_068_002",
      "Binding keyboard navigation did not restore focus.",
    );

    await page.locator("[data-testid='redemption-row-AGR_068_PUBLIC_STATUS']").press("ArrowDown");
    await waitForSelected(
      page.locator("[data-testid='redemption-row-AGR_068_CLAIM_STEP_UP']"),
      "Redemption keyboard navigation did not advance selection.",
    );

    const scopeRows = await page.locator("[data-testid^='scope-rule-row-']").count();
    assertCondition(scopeRows === MATRIX.length, "Scope rule table parity drifted.");

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
    assertCondition(CASEBOOK.summary.supersession_count === 3, "Casebook summary drifted.");
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

export const identityAccessAtlasManifest = {
  task: MANIFEST.task_id,
  bindings: MANIFEST.summary.identity_binding_count,
  grants: MANIFEST.summary.access_grant_count,
  redemptions: MANIFEST.summary.redemption_count,
  supersessions: MANIFEST.summary.supersession_count,
  coverage: [
    "binding-state filtering",
    "grant-family filtering",
    "selection synchronization",
    "diagram and table parity",
    "keyboard navigation",
    "reduced motion",
  ],
};
