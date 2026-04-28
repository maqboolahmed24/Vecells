import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "127_manifest_fusion_studio.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "surface_authority_tuple_catalog.json");

export const manifestFusionStudioCoverage = [
  "filtering by audience surface, shell type, verdict state, and bounded context",
  "selection sync across tuple cards, braid rows, heatmap rows, and inspector",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout and table parity fallback",
  "distinct blocked versus partial visual posture",
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

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/127_manifest_fusion_studio.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/127_manifest_fusion_studio.html`,
      });
    });
  });
}

function getExpected() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const rows = catalog.surfaceAuthorityTuples;
  return {
    catalog,
    rows,
    tupleCount: rows.length,
    blockedCount: rows.filter((row) => row.bindingVerdict === "blocked").length,
    operationsCount: rows.filter((row) => row.shellType === "operations").length,
    hubCount: rows.filter((row) => row.governingBoundedContextRef === "hub_coordination").length,
    assistiveCaptureCount: rows.filter((row) => row.inventorySurfaceRef === "surf_support_assisted_capture").length,
  };
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Manifest fusion studio HTML is missing.");
  const expected = getExpected();
  assertCondition(expected.tupleCount === 23, "Tuple count drifted.");
  assertCondition(expected.blockedCount === 3, "Blocked tuple count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='tuple-cards']").waitFor();
    await page.locator("[data-testid='triple-braid']").waitFor();
    await page.locator("[data-testid='heatmap']").waitFor();
    await page.locator("[data-testid='table-parity']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='tuple-card-']").count()) === expected.tupleCount,
      "Initial tuple-card count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='heatmap-row-']").count()) === expected.tupleCount,
      "Initial heatmap row count drifted.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("surf_support_assisted_capture");
    assertCondition(
      (await page.locator("[data-testid^='tuple-card-']").count()) === expected.assistiveCaptureCount,
      "Audience-surface filter drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='table-row-']").count()) === expected.assistiveCaptureCount,
      "Table-parity filter drifted.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-shell']").selectOption("operations");
    assertCondition(
      (await page.locator("[data-testid^='tuple-card-']").count()) === expected.operationsCount,
      "Shell-type filter drifted.",
    );

    await page.locator("[data-testid='filter-shell']").selectOption("all");
    await page.locator("[data-testid='filter-verdict']").selectOption("blocked");
    assertCondition(
      (await page.locator("[data-testid^='tuple-card-']").count()) === expected.blockedCount,
      "Verdict filter drifted.",
    );

    await page.locator("[data-testid='filter-verdict']").selectOption("all");
    await page.locator("[data-testid='filter-bounded-context']").selectOption("hub_coordination");
    assertCondition(
      (await page.locator("[data-testid^='tuple-card-']").count()) === expected.hubCount,
      "Bounded-context filter drifted.",
    );

    await page.locator("[data-testid='filter-bounded-context']").selectOption("all");
    await page.locator("[data-testid='tuple-card-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("surf_hub_case_management") &&
        inspectorText.includes("hub-desk") &&
        inspectorText.includes("rpb::local::authoritative"),
      "Inspector lost synchronized tuple detail.",
    );
    assertCondition(
      (await page
        .locator("[data-testid='braid-surface-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']")
        .getAttribute("data-selected")) === "true",
      "Braid surface strand did not synchronize selection.",
    );
    assertCondition(
      (await page
        .locator("[data-testid='braid-publication-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']")
        .getAttribute("data-selected")) === "true",
      "Braid publication strand did not synchronize selection.",
    );
    assertCondition(
      (await page
        .locator("[data-testid='braid-shell-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']")
        .getAttribute("data-selected")) === "true",
      "Braid shell strand did not synchronize selection.",
    );
    assertCondition(
      (await page
        .locator("tr[data-selected='true'] [data-testid='heatmap-row-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']")
        .count()) === 1,
      "Heatmap row did not synchronize selection.",
    );
    assertCondition(
      (await page
        .locator("tr[data-selected='true'] [data-testid='table-row-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']")
        .count()) === 1,
      "Table parity row did not synchronize selection.",
    );

    const visibleOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-testid^='tuple-card-']")).map((node) =>
        node.getAttribute("data-testid"),
      ),
    );
    const currentIndex = visibleOrder.indexOf("tuple-card-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1");
    assertCondition(currentIndex >= 0, "Selected tuple is missing from visible order.");
    const expectedNext = visibleOrder[Math.min(currentIndex + 1, visibleOrder.length - 1)];
    await page.locator("[data-testid='tuple-card-FMTUP_127_SURF_HUB_CASE_MANAGEMENT_V1']").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator(`[data-testid='${expectedNext}'][data-selected='true']`).count()) === 1,
      "ArrowDown did not advance tuple-card selection.",
    );

    const partialColor = await page
      .locator(".badge-partial")
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    const blockedColor = await page
      .locator(".badge-blocked")
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assertCondition(partialColor !== blockedColor, "Partial and blocked states are no longer visually distinct.");

    await page.setViewportSize({ width: 960, height: 940 });
    assertCondition(
      await page.locator("[data-testid='table-parity']").isVisible(),
      "Table parity disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow width.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }
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
