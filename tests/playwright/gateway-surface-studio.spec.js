import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "47_trust_zone_and_gateway_studio.html");
const PAYLOAD_PATH = path.join(ROOT, "data", "analysis", "gateway_bff_surfaces.json");
const TRUST_PATH = path.join(ROOT, "data", "analysis", "trust_zone_boundaries.json");

const PAYLOAD = JSON.parse(fs.readFileSync(PAYLOAD_PATH, "utf8"));
const TRUST_PAYLOAD = JSON.parse(fs.readFileSync(TRUST_PATH, "utf8"));

export const gatewaySurfaceStudioCoverage = [
  "audience filtering",
  "gateway-node selection",
  "boundary-edge selection",
  "route-matrix parity",
  "inspector rendering",
  "keyboard navigation",
  "responsive behavior",
  "reduced-motion handling",
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

function filteredSurfaces({
  audience = "all",
  shell = "all",
  route = "all",
  zone = "all",
  defect = "all",
}) {
  return PAYLOAD.gateway_surfaces
    .filter((row) => audience === "all" || row.audience === audience)
    .filter((row) => shell === "all" || row.shellType === shell)
    .filter((row) => route === "all" || row.routeFamilies.includes(route))
    .filter((row) => zone === "all" || row.trustZoneRefs.includes(zone))
    .filter((row) => defect === "all" || row.defectState === defect)
    .sort((left, right) => {
      if (left.candidateGroupId !== right.candidateGroupId) {
        return left.candidateGroupId.localeCompare(right.candidateGroupId);
      }
      return left.surfaceName.localeCompare(right.surfaceName);
    });
}

function filteredBoundaries({ zone = "all", defect = "all" }) {
  return TRUST_PAYLOAD.trust_zone_boundaries
    .filter(
      (row) => zone === "all" || row.sourceTrustZoneRef === zone || row.targetTrustZoneRef === zone,
    )
    .filter(
      (row) =>
        defect === "all" ||
        (defect === "blocked" && row.boundaryState === "blocked") ||
        (defect !== "blocked" && row.boundaryState !== "blocked"),
    )
    .sort((left, right) => left.trustZoneBoundaryId.localeCompare(right.trustZoneBoundaryId));
}

function visibleRouteRows(filters) {
  const surfaceIds = new Set(filteredSurfaces(filters).map((row) => row.surfaceId));
  return PAYLOAD.route_family_ownership.filter((row) => surfaceIds.has(row.gateway_surface_id));
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = ROOT;
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/47_trust_zone_and_gateway_studio.html"
          : rawUrl.split("?")[0];
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
    server.listen(4347, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing gateway surface studio HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } });
  const url =
    process.env.GATEWAY_SURFACE_STUDIO_URL ??
    "http://127.0.0.1:4347/docs/architecture/47_trust_zone_and_gateway_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='map-canvas']").waitFor();
    await page.locator("[data-testid='route-matrix']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialVisible = filteredSurfaces({}).length;
    const initialGatewayCards = await page.locator("[data-testid^='gateway-card-']").count();
    const initialRouteRows = await page.locator("#route-body tr").count();
    assertCondition(
      initialGatewayCards === initialVisible,
      `Initial gateway-card count drifted: expected ${initialVisible}, found ${initialGatewayCards}`,
    );
    assertCondition(
      initialRouteRows === visibleRouteRows({}).length,
      `Initial route-row parity drifted: expected ${visibleRouteRows({}).length}, found ${initialRouteRows}`,
    );

    await page.locator("[data-testid='filter-audience']").selectOption("patient_authenticated");
    const patientAuthenticated = filteredSurfaces({ audience: "patient_authenticated" });
    const patientCards = await page.locator("[data-testid^='gateway-card-']").count();
    const patientRoutes = await page.locator("#route-body tr").count();
    assertCondition(
      patientCards === patientAuthenticated.length,
      `Audience filter drifted: expected ${patientAuthenticated.length}, found ${patientCards}`,
    );
    assertCondition(
      patientRoutes === visibleRouteRows({ audience: "patient_authenticated" }).length,
      "Route matrix parity drifted under audience filter.",
    );
    assertCondition(
      patientAuthenticated.length === 5,
      `Expected 5 authenticated patient surfaces, found ${patientAuthenticated.length}`,
    );

    const selectedSurfaceId = "gws_patient_requests";
    await page.locator(`[data-testid='gateway-node-${selectedSurfaceId}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("intake_safety") && inspectorText.includes("communications"),
      "Surface inspector lost expected mutating or served contexts.",
    );
    assertCondition(
      inspectorText.includes("rf_patient_requests"),
      "Surface inspector lost expected route family detail.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    const selectedBoundaryId = "tzb_published_gateway_to_application_core";
    await page.locator(`[data-testid='boundary-edge-${selectedBoundaryId}']`).click();
    const boundaryInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      boundaryInspector.includes("tenant_tuple_and_route_intent_preserved"),
      "Boundary inspector lost expected tenant-transfer posture.",
    );
    assertCondition(
      boundaryInspector.includes("https"),
      "Boundary inspector lost expected protocol detail.",
    );

    await page.locator("[data-testid='filter-defect']").selectOption("watch");
    const watchVisible = filteredSurfaces({ defect: "watch" });
    const watchCards = await page.locator("[data-testid^='gateway-card-']").count();
    const watchBoundaryRows = await page.locator("#boundary-body tr").count();
    assertCondition(
      watchCards === watchVisible.length,
      `Watch filter drifted: expected ${watchVisible.length}, found ${watchCards}`,
    );
    assertCondition(
      watchBoundaryRows === filteredBoundaries({ defect: "watch" }).length,
      "Boundary matrix drifted under watch filter.",
    );

    await page.locator("[data-testid='filter-defect']").selectOption("all");
    await page.locator("[data-testid='filter-shell']").selectOption("staff");
    const staffVisible = filteredSurfaces({ shell: "staff" });
    assertCondition(
      staffVisible.length >= 4,
      "Expected multiple staff surfaces for keyboard traversal.",
    );
    const firstStaffId = staffVisible[0].surfaceId;
    const secondStaffId = staffVisible[1].surfaceId;
    const firstCard = page.locator(`[data-testid='gateway-card-${firstStaffId}']`);
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='gateway-card-${secondStaffId}']`)
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-down navigation no longer advances to the next gateway card.",
    );

    await page.locator("[data-testid='filter-shell']").selectOption("all");
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

export const gatewaySurfaceStudioManifest = {
  task: PAYLOAD.task_id,
  surfaces: PAYLOAD.summary.gateway_surface_count,
  routes: PAYLOAD.summary.route_family_count,
  boundaries: TRUST_PAYLOAD.summary.boundary_count,
};
