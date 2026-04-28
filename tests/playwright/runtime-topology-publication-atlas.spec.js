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
  "99_runtime_topology_publication_atlas.html",
);
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "runtime_topology_drift_catalog.json");
const GATEWAY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "gateway_surface_publication_matrix.json",
);

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
          ? "/docs/architecture/99_runtime_topology_publication_atlas.html"
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
    server.listen(4399, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing runtime topology publication atlas: ${HTML_PATH}`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const gatewayMatrix = JSON.parse(fs.readFileSync(GATEWAY_MATRIX_PATH, "utf8"));
  const productionCount = catalog.publicationScenarios.filter(
    (scenario) => scenario.environmentRing === "production",
  ).length;
  const designMismatchCount = catalog.publicationScenarios.filter(
    (scenario) =>
      scenario.environmentRing === "production" &&
      scenario.expected.driftCategoryCodes.includes("DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE"),
  ).length;

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.RUNTIME_TOPOLOGY_PUBLICATION_ATLAS_URL ??
    "http://127.0.0.1:4399/docs/architecture/99_runtime_topology_publication_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "publication-masthead",
      "current-snapshot",
      "scenario-rail",
      "scenario-table",
      "gateway-table",
      "current-drift-table",
      "inspector",
      "filter-environment",
      "filter-status",
      "filter-category",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    let cards = await page.locator(".scenario-card").count();
    assertCondition(
      cards === catalog.publicationScenarios.length,
      `Expected ${catalog.publicationScenarios.length} scenario cards, found ${cards}.`,
    );
    assertCondition(
      (await page.locator("[data-testid^='gateway-row-']").count()) ===
        gatewayMatrix.gatewaySurfacePublicationRows.length,
      "Gateway matrix row count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='drift-row-']").count()) ===
        catalog.currentGraphSnapshot.verdict.driftFindings.length,
      "Current drift finding row count drifted.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("production");
    cards = await page.locator(".scenario-card").count();
    assertCondition(cards === productionCount, `Expected ${productionCount} production cards, found ${cards}.`);

    await page.locator("[data-testid='filter-status']").selectOption("blocked");
    await page
      .locator("[data-testid='filter-category']")
      .selectOption("DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE");
    cards = await page.locator(".scenario-card").count();
    assertCondition(
      cards === designMismatchCount,
      `Expected ${designMismatchCount} production design mismatch cards, found ${cards}.`,
    );

    await page.locator("[data-testid='scenario-card-PRODUCTION_DESIGN_BUNDLE_WRONG_TOPOLOGY']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Design bundle wrong topology tuple") &&
        inspectorText.includes("DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE") &&
        inspectorText.includes("rpb::production::authoritative"),
      "Inspector lost production topology tuple drift detail.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-status']").selectOption("all");
    await page.locator("[data-testid='filter-category']").selectOption("all");
    await page.locator("[data-testid='scenario-card-LOCAL_AUTHORITATIVE_ALIGNMENT']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='scenario-card-CI_PREVIEW_AUTHORITATIVE_ALIGNMENT']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance scenario selection.");

    const publishableColor = await page.evaluate(() => {
      const node = document.querySelector(
        "[data-testid='scenario-card-LOCAL_AUTHORITATIVE_ALIGNMENT'] .badge-publishable",
      );
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const blockedColor = await page.evaluate(() => {
      const node = document.querySelector(
        "[data-testid='scenario-card-LOCAL_MISSING_MANIFEST_BINDING'] .badge-blocked",
      );
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    assertCondition(
      publishableColor !== blockedColor,
      "Publishable and blocked states are no longer visually distinct.",
    );

    const currentSnapshotText = await page.locator("[data-testid='current-snapshot']").innerText();
    assertCondition(
      currentSnapshotText.includes("rpb::local::authoritative") &&
        currentSnapshotText.includes("blocked"),
      "Current snapshot panel lost the blocked local tuple summary.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reduced = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reduced === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1040, height: 920 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='gateway-table']").isVisible(),
      "Gateway table disappeared at tablet width.",
    );

    assertCondition(
      (await page.locator("header").count()) === 1 &&
        (await page.locator("nav").count()) === 1 &&
        (await page.locator("main").count()) === 1 &&
        (await page.locator("aside").count()) === 1,
      "Required landmarks are missing.",
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

export const runtimeTopologyPublicationAtlasCoverage = {
  task: "par_099",
  coverage: [
    "scenario filtering by environment, publication state, and drift category",
    "inspector synchronization",
    "keyboard navigation",
    "gateway matrix table fallback",
    "reduced motion",
    "responsive layout",
    "accessibility landmarks",
  ],
};
