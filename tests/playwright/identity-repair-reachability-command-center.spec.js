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
  "80_identity_repair_reachability_command_center.html",
);
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "identity_repair_casebook.json");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "route_authority_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "reachability_repair_matrix.csv");

const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const MATRIX_ROWS = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);

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
          ? "/docs/architecture/80_identity_repair_reachability_command_center.html"
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
    server.listen(4380, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing command center HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.IDENTITY_REPAIR_REACHABILITY_COMMAND_CENTER_URL ??
    "http://127.0.0.1:4380/docs/architecture/80_identity_repair_reachability_command_center.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "filter-repair-state",
      "filter-route-state",
      "filter-dependency-class",
      "filter-audience-impact",
      "repair-cascade",
      "route-funnel",
      "repair-ribbon",
      "repair-table",
      "reachability-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    let repairRows = await page.locator("tr[data-testid^='repair-row-']").count();
    let reachabilityRows = await page.locator("tr[data-testid^='reachability-row-']").count();
    assertCondition(
      repairRows === CASEBOOK.summary.repair_case_count,
      `Expected ${CASEBOOK.summary.repair_case_count} repair rows, found ${repairRows}.`,
    );
    assertCondition(
      reachabilityRows === CASEBOOK.summary.reachability_case_count,
      `Expected ${CASEBOOK.summary.reachability_case_count} reachability rows, found ${reachabilityRows}.`,
    );

    await page.locator("[data-testid='filter-dependency-class']").selectOption("pharmacy");
    repairRows = await page.locator("tr[data-testid^='repair-row-']").count();
    reachabilityRows = await page.locator("tr[data-testid^='reachability-row-']").count();
    assertCondition(repairRows === 1, `Expected 1 pharmacy repair row, found ${repairRows}.`);
    assertCondition(
      reachabilityRows === 1,
      `Expected 1 pharmacy reachability row, found ${reachabilityRows}.`,
    );

    await page.locator("[data-testid='filter-dependency-class']").selectOption("all");
    await page.locator("[data-testid='filter-route-state']").selectOption("blocked");
    repairRows = await page.locator("tr[data-testid^='repair-row-']").count();
    reachabilityRows = await page.locator("tr[data-testid^='reachability-row-']").count();
    assertCondition(repairRows === 3, `Expected 3 blocked-route repair rows, found ${repairRows}.`);
    assertCondition(
      reachabilityRows === 2,
      `Expected 2 blocked-route reachability rows, found ${reachabilityRows}.`,
    );

    await page.locator("[data-testid='filter-route-state']").selectOption("all");
    await page.locator("[data-testid='repair-row-IRC_080_DELIVERY_DISPUTE'] .row-select").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("IRC_080_DELIVERY_DISPUTE") &&
        inspectorText.includes("RD_080_MESSAGE") &&
        inspectorText.includes("MANUAL DISPUTE OPEN"),
      "Inspector lost synchronized repair and reachability detail.",
    );
    const selectionDigest = await page.locator("#selection-digest").innerText();
    assertCondition(
      selectionDigest.includes("IRC_080_DELIVERY_DISPUTE") &&
        selectionDigest.includes("RD_080_MESSAGE"),
      "Selection digest drifted after repair-row selection.",
    );
    const cascadeCount = await page
      .locator("#repair-cascade-body [data-testid^='cascade-branch-']")
      .count();
    assertCondition(cascadeCount === 3, `Expected 3 branch cascade rows, found ${cascadeCount}.`);

    await page.locator("[data-testid='repair-row-IRC_080_WRONG_PATIENT'] .row-select").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='repair-row-IRC_080_DELIVERY_DISPUTE']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance the repair selection.");

    assertCondition(MANIFEST.summary.canonical_event_count === 9, "Manifest event count drifted.");
    assertCondition(MATRIX_ROWS.length === 6, "Reachability matrix row count drifted.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1024, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at mobile width.",
    );

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 8,
      `Accessibility smoke failed: found only ${landmarks} landmarks.`,
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

export const identityRepairReachabilityCommandCenterManifest = {
  task: CASEBOOK.task_id,
  repairCases: CASEBOOK.summary.repair_case_count,
  reachabilityCases: CASEBOOK.summary.reachability_case_count,
  coverage: [
    "filtering and synchronized selection",
    "keyboard navigation and focus management",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks",
  ],
};
