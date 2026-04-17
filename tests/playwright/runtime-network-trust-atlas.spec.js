import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "84_runtime_network_trust_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json");
const ALLOWLIST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "private_egress_allowlist_manifest.json",
);

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const ALLOWLIST = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"));

export const runtimeNetworkTrustAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
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

function scopedNodes({ environment, family = "all", egressScope = "all" }) {
  const allowlistByRef = Object.fromEntries(
    ALLOWLIST.allowlists.map((row) => [row.egress_allowlist_ref, row]),
  );
  const familyByRef = Object.fromEntries(
    MANIFEST.workload_family_catalog.map((row) => [row.runtime_workload_family_ref, row]),
  );

  return MANIFEST.runtime_workload_families
    .filter((row) => row.environment_ring === environment)
    .filter((row) => family === "all" || row.family_code === family)
    .filter((row) => {
      if (egressScope === "all") {
        return true;
      }
      const familyRow = familyByRef[row.runtime_workload_family_ref];
      return allowlistByRef[familyRow.egress_allowlist_ref].scope_class === egressScope;
    });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const rawUrl = request.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/84_runtime_network_trust_atlas.html"
          : rawUrl.split("?")[0];
      const filePath = path.join(ROOT, decodeURIComponent(urlPath).replace(/^\/+/, ""));

      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
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
      response.writeHead(200, { "Content-Type": contentType });
      response.end(body);
    });
    server.once("error", reject);
    server.listen(4384, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(
    fs.existsSync(HTML_PATH),
    `Missing runtime network trust atlas HTML: ${HTML_PATH}`,
  );
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1100 } });
  const url =
    process.env.RUNTIME_NETWORK_TRUST_ATLAS_URL ??
    "http://127.0.0.1:4384/docs/architecture/84_runtime_network_trust_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='topology-diagram']").waitFor();
    await page.locator("[data-testid='manifest-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const localNodes = scopedNodes({ environment: "local" }).length;
    const initialTopologyCount = await page.locator("[data-testid^='topology-node-']").count();
    const initialManifestCount = await page.locator("[data-testid^='manifest-row-']").count();
    assertCondition(
      initialTopologyCount === localNodes,
      `Initial local topology count drifted: expected ${localNodes}, found ${initialTopologyCount}`,
    );
    assertCondition(
      initialManifestCount === localNodes,
      `Initial local manifest count drifted: expected ${localNodes}, found ${initialManifestCount}`,
    );

    await page.locator("[data-testid='filter-environment']").selectOption("production");
    const productionNodes = scopedNodes({ environment: "production" }).length;
    const productionTopologyCount = await page.locator("[data-testid^='topology-node-']").count();
    assertCondition(
      productionTopologyCount === productionNodes,
      `Production topology count drifted: expected ${productionNodes}, found ${productionTopologyCount}`,
    );

    await page.locator("[data-testid='filter-workload-family']").selectOption("integration");
    const productionIntegrationNodes = scopedNodes({
      environment: "production",
      family: "integration",
    }).length;
    const filteredTopologyCount = await page.locator("[data-testid^='topology-node-']").count();
    const filteredManifestCount = await page.locator("[data-testid^='manifest-row-']").count();
    assertCondition(
      filteredTopologyCount === productionIntegrationNodes,
      `Integration family filter drifted: expected ${productionIntegrationNodes}, found ${filteredTopologyCount}`,
    );
    assertCondition(
      filteredManifestCount === productionIntegrationNodes,
      `Integration manifest filter drifted: expected ${productionIntegrationNodes}, found ${filteredManifestCount}`,
    );
    assertCondition(
      productionIntegrationNodes === 2,
      `Expected two production integration workloads, found ${productionIntegrationNodes}`,
    );

    await page
      .locator("[data-testid='filter-egress-scope']")
      .selectOption("declared_external_dependencies");
    const declaredEgressNodes = scopedNodes({
      environment: "production",
      family: "integration",
      egressScope: "declared_external_dependencies",
    }).length;
    const declaredEgressCount = await page.locator("[data-testid^='egress-card-']").count();
    assertCondition(
      declaredEgressCount === 1,
      `Expected one declared external dependency allowlist card, found ${declaredEgressCount}`,
    );
    const declaredManifestCount = await page.locator("[data-testid^='manifest-row-']").count();
    assertCondition(
      declaredManifestCount === declaredEgressNodes,
      `Declared egress scope drifted: expected ${declaredEgressNodes}, found ${declaredManifestCount}`,
    );

    await page.locator("[data-testid='filter-egress-scope']").selectOption("all");
    await page.locator("[data-testid='filter-workload-family']").selectOption("all");
    await page.locator("[data-testid='filter-boundary-state']").selectOption("blocked");
    const blockedBoundaryCount = await page.locator("[data-testid^='boundary-row-']").count();
    assertCondition(
      blockedBoundaryCount === MANIFEST.blocked_crossings.length,
      `Blocked boundary count drifted: expected ${MANIFEST.blocked_crossings.length}, found ${blockedBoundaryCount}`,
    );

    await page.locator("[data-testid='filter-boundary-state']").selectOption("all");
    const commandNodeId = MANIFEST.runtime_workload_families.find(
      (row) =>
        row.environment_ring === "production" &&
        row.family_code === "command" &&
        row.uk_region_role === "primary",
    ).runtime_workload_family_id;
    await page.locator(`[data-testid='topology-node-${commandNodeId}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("sid_command_api"),
      "Inspector lost command service identity detail.",
    );
    assertCondition(
      inspectorText.includes("eal_command_to_internal_planes_only"),
      "Inspector lost command egress allowlist detail.",
    );
    const manifestSelected = await page
      .locator(`[data-testid='manifest-row-${commandNodeId}']`)
      .getAttribute("data-selected");
    assertCondition(
      manifestSelected === "true",
      "Topology selection no longer synchronizes manifest table selection.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("local");
    await page.locator("[data-testid='filter-workload-family']").selectOption("all");
    await page.locator("[data-testid='filter-boundary-state']").selectOption("all");
    const firstManifestRow = page.locator("[data-testid^='manifest-row-']").first();
    await firstManifestRow.focus();
    await page.keyboard.press("ArrowDown");
    const selectedRows = page.locator("[data-testid^='manifest-row-'][data-selected='true']");
    assertCondition(
      (await selectedRows.count()) === 1,
      "Arrow navigation should keep exactly one manifest row selected.",
    );

    await page.setViewportSize({ width: 900, height: 1100 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
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
      landmarkCount >= 3,
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
