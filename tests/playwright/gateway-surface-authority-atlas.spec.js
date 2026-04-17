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
  "90_gateway_surface_authority_atlas.html",
);
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "gateway_surface_manifest.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

export const gatewaySurfaceAuthorityAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that undeclared route or boundary states visibly downgrade or block the surface instead of remaining calm",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function filteredServices({
  audienceFamily = "all",
  channelProfile = "all",
  routeFamilyRef = "all",
  publicationState = "all",
  boundaryState = "all",
} = {}) {
  return MANIFEST.gateway_services.filter((service) => {
    if (audienceFamily !== "all" && service.audienceFamily !== audienceFamily) return false;
    if (channelProfile !== "all" && !service.channelProfiles.includes(channelProfile)) return false;
    if (routeFamilyRef !== "all" && !service.routeFamilyRefs.includes(routeFamilyRef)) return false;
    if (publicationState !== "all") {
      const routeMatch = MANIFEST.route_publications.some(
        (row) =>
          row.gatewayServiceRef === service.gatewayServiceRef &&
          row.routeState === publicationState,
      );
      if (
        service.authorityState !== publicationState &&
        service.publicationState !== publicationState &&
        !routeMatch
      ) {
        return false;
      }
    }
    if (boundaryState !== "all") {
      const boundaryMatch = MANIFEST.boundary_rows.some(
        (row) =>
          row.gateway_service_ref === service.gatewayServiceRef &&
          row.boundary_state === boundaryState,
      );
      if (!boundaryMatch) return false;
    }
    return true;
  });
}

function filteredRoutes({
  audienceFamily = "all",
  channelProfile = "all",
  routeFamilyRef = "all",
  publicationState = "all",
} = {}) {
  return MANIFEST.route_publications.filter((route) => {
    const service = MANIFEST.gateway_services.find(
      (item) => item.gatewayServiceRef === route.gatewayServiceRef,
    );
    const surface = MANIFEST.gateway_surfaces.find(
      (item) => item.surfaceId === route.primaryGatewaySurfaceRef,
    );
    if (audienceFamily !== "all" && service?.audienceFamily !== audienceFamily) return false;
    if (channelProfile !== "all" && surface?.channelProfile !== channelProfile) return false;
    if (routeFamilyRef !== "all" && route.routeFamilyRef !== routeFamilyRef) return false;
    if (publicationState !== "all" && route.routeState !== publicationState) return false;
    return true;
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = ROOT;
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/90_gateway_surface_authority_atlas.html"
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
    server.listen(4350, "127.0.0.1", () => resolve(server));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } });
  const url =
    process.env.GATEWAY_SURFACE_AUTHORITY_ATLAS_URL ??
    "http://127.0.0.1:4350/docs/architecture/90_gateway_surface_authority_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='topology-diagram']").waitFor();
    await page.locator("[data-testid='authority-map']").waitFor();
    await page.locator("[data-testid='downstream-matrix']").waitFor();
    await page.locator("[data-testid='manifest-table']").waitFor();
    await page.locator("[data-testid='policy-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialServiceCards = await page.locator("[data-testid^='service-card-']").count();
    assertCondition(
      initialServiceCards === filteredServices().length,
      `Initial service-card count drifted: expected ${filteredServices().length}, found ${initialServiceCards}`,
    );

    await page.locator("[data-testid='filter-audience']").selectOption("patient");
    const patientServices = filteredServices({ audienceFamily: "patient" });
    const patientRoutes = filteredRoutes({ audienceFamily: "patient" });
    const patientServiceCards = await page.locator("[data-testid^='service-card-']").count();
    const patientRouteCards = await page.locator("[data-testid^='route-card-']").count();
    assertCondition(
      patientServiceCards === patientServices.length,
      "Audience filter drifted on services.",
    );
    assertCondition(
      patientRouteCards === patientRoutes.length,
      "Audience filter drifted on routes.",
    );

    await page.locator("[data-testid='service-card-agws_patient_web']").click();
    const patientInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      patientInspector.includes("agws_patient_web") &&
        patientInspector.includes("/audiences/patient-web"),
      "Patient service selection lost inspector parity.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-publication-state']").selectOption("blocked");
    const blockedRoutes = filteredRoutes({ publicationState: "blocked" });
    const blockedServiceCards = await page.locator("[data-testid^='service-card-']").count();
    const blockedRouteCards = await page.locator("[data-testid^='route-card-']").count();
    assertCondition(
      blockedServiceCards === filteredServices({ publicationState: "blocked" }).length,
      "Blocked publication filter drifted on services.",
    );
    assertCondition(
      blockedRouteCards === blockedRoutes.length,
      `Blocked publication filter drifted on routes: expected ${blockedRoutes.length}, found ${blockedRouteCards}`,
    );

    await page.locator("[data-testid='route-card-rf_assistive_control_shell']").click();
    const blockedInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      blockedInspector.includes("PARALLEL_INTERFACE_GAP_090_ASSISTIVE_ROUTE_REGISTRY_PENDING") &&
        blockedInspector.toLowerCase().includes("blocked"),
      "Blocked route inspector no longer exposes the bounded parallel gap or blocked posture.",
    );

    const firstBlockedRoute = page.locator("[data-testid='route-card-rf_assistive_control_shell']");
    const secondBlockedRoute = page.locator(
      "[data-testid='route-card-rf_patient_secure_link_recovery']",
    );
    const assistiveIndex = blockedRoutes.findIndex(
      (route) => route.routeFamilyRef === "rf_assistive_control_shell",
    );
    const recoveryIndex = blockedRoutes.findIndex(
      (route) => route.routeFamilyRef === "rf_patient_secure_link_recovery",
    );
    assertCondition(
      assistiveIndex !== -1 && recoveryIndex !== -1,
      "Blocked route navigation test lost one of the expected blocked routes.",
    );
    const routeNavigationKey = recoveryIndex > assistiveIndex ? "ArrowDown" : "ArrowUp";
    await firstBlockedRoute.focus();
    await page.keyboard.press(routeNavigationKey);
    const secondSelected = await secondBlockedRoute.getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-key navigation no longer moves between blocked route authority cards.",
    );

    await page.setViewportSize({ width: 960, height: 1180 });
    await page.locator("[data-testid='inspector']").waitFor();
    const tabletCards = await page.locator("[data-testid^='service-card-']").count();
    assertCondition(tabletCards > 0, "Responsive layout hid all service cards at tablet width.");

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

export const gatewaySurfaceAuthorityAtlasManifest = {
  task: MANIFEST.task_id,
  services: MANIFEST.summary.gateway_service_count,
  routes: MANIFEST.summary.route_publication_count,
  boundaries: MANIFEST.summary.boundary_matrix_row_count,
};
