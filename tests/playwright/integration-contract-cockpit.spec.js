import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "external", "40_integration_contract_cockpit.html");
const DEGRADED_DEFAULTS_PATH = path.join(ROOT, "data", "analysis", "degraded_mode_defaults.json");
const CONFLICT_REGISTER_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "integration_contract_conflict_register.json",
);

const DEGRADED_DEFAULTS = JSON.parse(fs.readFileSync(DEGRADED_DEFAULTS_PATH, "utf8"));
const CONFLICT_REGISTER = JSON.parse(fs.readFileSync(CONFLICT_REGISTER_PATH, "utf8"));

export const integrationContractCockpitCoverage = [
  "dependency family, ambiguity class, and blocker filtering",
  "freshness and blocker sorting",
  "row selection and inspector rendering",
  "proof/ambiguity/degraded/manual/override chip rendering",
  "keyboard navigation",
  "responsive desktop/tablet/mobile layouts",
  "reduced-motion handling",
  "accessibility smoke",
  "table parity and conflict-strip parity",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = path.join(ROOT, "docs", "external");
    const server = http.createServer((req, res) => {
      if (!req.url || req.url === "/") {
        res.writeHead(302, { Location: "/40_integration_contract_cockpit.html" });
        res.end();
        return;
      }
      const safePath = req.url.replace(/^\/+/, "");
      const filePath = path.join(rootDir, safePath);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4340, "127.0.0.1", () => resolve(server));
  });
}

function expectedCount(predicate) {
  return DEGRADED_DEFAULTS.dependencies.filter(predicate).length;
}

function sortedByFreshness(direction = "asc") {
  const factor = direction === "asc" ? 1 : -1;
  return [...DEGRADED_DEFAULTS.dependencies].sort((left, right) => {
    const delta = left.freshness_window_days - right.freshness_window_days;
    if (delta !== 0) {
      return delta * factor;
    }
    return left.dependency_id.localeCompare(right.dependency_id);
  });
}

function sortedByBlocker(direction = "asc") {
  const factor = direction === "asc" ? 1 : -1;
  return [...DEGRADED_DEFAULTS.dependencies].sort((left, right) => {
    const delta = left.blocker_rank - right.blocker_rank;
    if (delta !== 0) {
      return delta * factor;
    }
    return left.dependency_id.localeCompare(right.dependency_id);
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing cockpit HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.INTEGRATION_CONTRACT_COCKPIT_URL ??
    "http://127.0.0.1:4340/40_integration_contract_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='cockpit-shell']").waitFor();
    await page.locator("[data-testid='ledger-table']").waitFor();

    const initialRows = await page.locator("#ledger-body tr").count();
    assertCondition(
      initialRows === DEGRADED_DEFAULTS.summary.dependency_count,
      `Expected ${DEGRADED_DEFAULTS.summary.dependency_count} ledger rows, found ${initialRows}`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("pharmacy");
    const pharmacyRows = await page.locator("#ledger-body tr").count();
    assertCondition(
      pharmacyRows === expectedCount((row) => row.dependency_family === "pharmacy"),
      `Pharmacy filter drifted: expected ${expectedCount((row) => row.dependency_family === "pharmacy")}, found ${pharmacyRows}`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page
      .locator("[data-testid='filter-ambiguity']")
      .selectOption("transport_delivery_unproven");
    const ambiguityRows = await page.locator("#ledger-body tr").count();
    assertCondition(
      ambiguityRows ===
        expectedCount((row) => row.ambiguity_class === "transport_delivery_unproven"),
      `Ambiguity filter drifted: expected ${expectedCount((row) => row.ambiguity_class === "transport_delivery_unproven")}, found ${ambiguityRows}`,
    );

    await page.locator("[data-testid='filter-ambiguity']").selectOption("all");
    await page.locator("[data-testid='filter-blocker']").selectOption("watch_only");
    const watchRows = await page.locator("#ledger-body tr").count();
    assertCondition(
      watchRows === expectedCount((row) => row.blocker_impact === "watch_only"),
      `Watch-only blocker filter drifted: expected ${expectedCount((row) => row.blocker_impact === "watch_only")}, found ${watchRows}`,
    );

    await page.locator("[data-testid='filter-blocker']").selectOption("all");
    await page.locator("[data-testid='sort-freshness']").click();
    const expectedFreshnessFirst = sortedByFreshness("asc")[0].dependency_id;
    const firstFreshnessRow = await page
      .locator("#ledger-body tr")
      .first()
      .getAttribute("data-dependency-id");
    assertCondition(
      firstFreshnessRow === expectedFreshnessFirst,
      `Freshness sort drifted: expected ${expectedFreshnessFirst}, found ${firstFreshnessRow}`,
    );

    await page.locator("[data-testid='sort-blocker']").click();
    const expectedBlockerFirst = sortedByBlocker("asc")[0].dependency_id;
    const firstBlockerRow = await page
      .locator("#ledger-body tr")
      .first()
      .getAttribute("data-dependency-id");
    assertCondition(
      firstBlockerRow === expectedBlockerFirst,
      `Blocker sort drifted: expected ${expectedBlockerFirst}, found ${firstBlockerRow}`,
    );

    await page.locator("[data-testid='ledger-row-dep_email_notification_provider']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Email and notification delivery provider"),
      "Inspector lost the selected email dependency title.",
    );
    assertCondition(
      inspectorText.includes("Delivery acceptance never equals patient-visible truth by itself"),
      "Inspector lost the email non-negotiable contract text.",
    );

    const overrideChipCount = await page
      .locator("[data-testid='chip-dep_email_notification_provider-override']")
      .count();
    assertCondition(
      overrideChipCount === 1,
      "Override chip disappeared from the email dependency row.",
    );

    const blockerRows = sortedByBlocker("asc");
    const firstKey = blockerRows[0].dependency_id;
    const expectedNext = blockerRows[1].dependency_id;
    const firstRow = page.locator(`[data-testid='ledger-row-${firstKey}']`);
    await firstRow.focus();
    await page.keyboard.press("ArrowDown");
    const selected = await page
      .locator(`[data-testid='ledger-row-${expectedNext}']`)
      .getAttribute("data-selected");
    assertCondition(selected === "true", "Arrow-down navigation no longer advances selection.");

    const parityRows = await page.locator("#parity-body tr").count();
    assertCondition(parityRows === 4, `Expected 4 parity rows, found ${parityRows}`);

    await page.locator("[data-testid='filter-scope']").selectOption("all");
    const conflictCards = await page
      .locator("[data-testid='conflict-strip'] .conflict-card")
      .count();
    assertCondition(
      conflictCards === CONFLICT_REGISTER.summary.conflict_count,
      `Expected ${CONFLICT_REGISTER.summary.conflict_count} conflict cards, found ${conflictCards}`,
    );

    await page.setViewportSize({ width: 1024, height: 1100 });
    await page.locator("[data-testid='ledger-table']").waitFor();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const bodyFlag = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(bodyFlag === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("main, aside, section").count();
    assertCondition(
      landmarkCount >= 6,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`,
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

export const integrationContractCockpitManifest = {
  task: DEGRADED_DEFAULTS.task_id,
  dependencies: DEGRADED_DEFAULTS.summary.dependency_count,
  unresolvedConflicts: CONFLICT_REGISTER.summary.unresolved_conflict_count,
};
