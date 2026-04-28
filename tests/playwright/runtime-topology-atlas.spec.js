import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "46_runtime_topology_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

export const runtimeTopologyAtlasCoverage = [
  "environment switching",
  "family, tenant, and defect filtering",
  "graph-node selection and inspector rendering",
  "graph/table parity",
  "keyboard navigation across family cards",
  "responsive behavior",
  "reduced-motion handling",
  "accessibility smoke",
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

function filteredInstances({
  environment,
  trustZone = "all",
  familyCode = "all",
  tenantMode = "all",
  defect = "all",
}) {
  return MANIFEST.runtime_workload_families
    .filter((row) => row.environment_ring === environment)
    .filter((row) => trustZone === "all" || row.trust_zone_ref === trustZone)
    .filter((row) => familyCode === "all" || row.family_code === familyCode)
    .filter((row) => tenantMode === "all" || row.tenant_isolation_mode === tenantMode)
    .filter((row) => defect === "all" || row.defect_state === defect)
    .sort((left, right) => {
      if (left.trust_zone_ref !== right.trust_zone_ref) {
        return left.trust_zone_ref.localeCompare(right.trust_zone_ref);
      }
      return left.display_name.localeCompare(right.display_name);
    });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = ROOT;
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/" ? "/docs/architecture/46_runtime_topology_atlas.html" : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(rootDir, safePath);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4346, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing runtime topology atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.RUNTIME_TOPOLOGY_ATLAS_URL ??
    "http://127.0.0.1:4346/docs/architecture/46_runtime_topology_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='graph-canvas']").waitFor();
    await page.locator("[data-testid='family-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const localExpected = filteredInstances({ environment: "local" }).length;
    const initialGraphNodes = await page.locator("[data-testid^='graph-node-']").count();
    const initialFamilyRows = await page.locator("#family-body tr").count();
    assertCondition(
      initialGraphNodes === localExpected,
      `Initial local graph count drifted: expected ${localExpected}, found ${initialGraphNodes}`,
    );
    assertCondition(
      initialFamilyRows === localExpected,
      `Initial local family-table count drifted: expected ${localExpected}, found ${initialFamilyRows}`,
    );

    await page.locator("[data-testid='filter-environment']").selectOption("production");
    const productionExpected = filteredInstances({ environment: "production" }).length;
    const productionGraphNodes = await page.locator("[data-testid^='graph-node-']").count();
    const productionFamilyRows = await page.locator("#family-body tr").count();
    assertCondition(
      productionGraphNodes === productionExpected,
      `Production graph count drifted: expected ${productionExpected}, found ${productionGraphNodes}`,
    );
    assertCondition(
      productionFamilyRows === productionExpected,
      `Production table count drifted: expected ${productionExpected}, found ${productionFamilyRows}`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("integration");
    const productionIntegrationExpected = filteredInstances({
      environment: "production",
      familyCode: "integration",
    }).length;
    const integrationGraphNodes = await page.locator("[data-testid^='graph-node-']").count();
    assertCondition(
      integrationGraphNodes === productionIntegrationExpected,
      `Production integration filter drifted: expected ${productionIntegrationExpected}, found ${integrationGraphNodes}`,
    );
    assertCondition(
      productionIntegrationExpected === 2,
      `Expected one live integration instance per production region role, found ${productionIntegrationExpected}`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page
      .locator("[data-testid='filter-tenant']")
      .selectOption("audience_surface_tuple_scoped");
    const tenantExpected = filteredInstances({
      environment: "production",
      tenantMode: "audience_surface_tuple_scoped",
    }).length;
    const tenantGraphNodes = await page.locator("[data-testid^='graph-node-']").count();
    assertCondition(
      tenantGraphNodes === tenantExpected,
      `Production tenant filter drifted: expected ${tenantExpected}, found ${tenantGraphNodes}`,
    );

    await page.locator("[data-testid='filter-tenant']").selectOption("all");
    await page.locator("[data-testid='filter-defect']").selectOption("watch");
    const watchExpected = filteredInstances({
      environment: "production",
      defect: "watch",
    }).length;
    const watchRows = await page.locator("#family-body tr").count();
    assertCondition(
      watchRows === watchExpected,
      `Production watch filter drifted: expected ${watchExpected}, found ${watchRows}`,
    );

    await page.locator("[data-testid='filter-defect']").selectOption("all");
    const selectedGatewayId = "rwf_production_primary_shell_delivery_published_gateway";
    await page.locator(`[data-testid='graph-node-${selectedGatewayId}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("service_api_gateway"),
      "Inspector lost API gateway membership detail.",
    );
    assertCondition(
      inspectorText.includes("eal_gateway_internal_only"),
      "Inspector lost gateway egress posture.",
    );

    const graphParity = await page.locator("[data-testid^='graph-node-']").count();
    const tableParity = await page.locator("#family-body tr").count();
    assertCondition(graphParity === tableParity, "Graph and family parity table diverged.");

    await page.locator("[data-testid='filter-environment']").selectOption("local");
    await page.locator("[data-testid='filter-family']").selectOption("integration");
    const localIntegration = filteredInstances({ environment: "local", familyCode: "integration" });
    assertCondition(localIntegration.length === 2, "Local integration family split drifted.");
    const firstCardId = localIntegration[0].runtime_workload_family_id;
    const secondCardId = localIntegration[1].runtime_workload_family_id;
    const firstCard = page.locator(`[data-testid='family-card-${firstCardId}']`);
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondCardSelected = await page
      .locator(`[data-testid='family-card-${secondCardId}']`)
      .getAttribute("data-selected");
    assertCondition(
      secondCardSelected === "true",
      "Arrow-down navigation no longer advances to the next family card.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("header, main, aside").count();
    assertCondition(
      landmarkCount >= 4,
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

export const runtimeTopologyAtlasManifest = {
  task: MANIFEST.task_id,
  families: MANIFEST.summary.workload_family_catalog_count,
  runtimeInstances: MANIFEST.summary.runtime_workload_instance_count,
  edges: MANIFEST.summary.edge_count,
};
