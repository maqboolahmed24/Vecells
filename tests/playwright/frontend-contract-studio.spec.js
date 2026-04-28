import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "50_frontend_contract_studio.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "frontend_contract_manifests.json");
const PROFILE_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "frontend_accessibility_and_automation_profiles.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "frontend_route_to_query_command_channel_cache_matrix.csv",
);

const MANIFEST_PAYLOAD = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const PROFILE_PAYLOAD = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
const MATRIX_ROWS = fs
  .readFileSync(MATRIX_PATH, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.split(","));

export const frontendContractStudioCoverage = [
  "audience filtering",
  "manifest selection",
  "card and matrix parity",
  "inspector rendering",
  "keyboard navigation",
  "responsive behavior",
  "reduced motion handling",
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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = ROOT;
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/50_frontend_contract_studio.html"
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
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4350, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing frontend contract studio HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.FRONTEND_CONTRACT_STUDIO_URL ??
    "http://127.0.0.1:4350/docs/architecture/50_frontend_contract_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='manifest-list']").waitFor();
    await page.locator("[data-testid='matrix-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='manifest-card-']").count();
    assertCondition(
      initialCards === MANIFEST_PAYLOAD.frontendContractManifests.length,
      `Initial manifest-card parity drifted: expected ${MANIFEST_PAYLOAD.frontendContractManifests.length}, found ${initialCards}`,
    );

    await page
      .locator("[data-testid='filter-audience']")
      .selectOption("audsurf_patient_authenticated_portal");
    const audienceCards = await page.locator("[data-testid^='manifest-card-']").count();
    assertCondition(
      audienceCards === 1,
      `Audience filtering drifted: expected 1 card, found ${audienceCards}`,
    );

    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Authenticated patient portal") &&
        inspectorText.includes("gws_patient_home") &&
        inspectorText.includes("dcpb::patient_authenticated_shell::planned"),
      "Inspector lost expected patient-portal authority detail.",
    );

    const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
    assertCondition(
      matrixRows === 5,
      `Matrix parity drifted: expected 5 patient rows, found ${matrixRows}`,
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-shell']").selectOption("patient");
    const patientCards = await page.locator("[data-testid^='manifest-card-']").count();
    assertCondition(
      patientCards === 3,
      `Patient shell filtering drifted: expected 3 cards, found ${patientCards}`,
    );

    await page.locator("[data-testid='manifest-card-FCM_050_PATIENT_PUBLIC_ENTRY_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='manifest-card-FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1']")
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-down navigation no longer advances manifest selection.",
    );

    await page.locator("[data-testid='filter-shell']").selectOption("all");
    await page.locator("[data-testid='filter-drift']").selectOption("deferred_channel_mixed");
    const driftCards = await page.locator("[data-testid^='manifest-card-']").count();
    assertCondition(
      driftCards === 1,
      `Drift filtering drifted: expected 1 card, found ${driftCards}`,
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

    const profileRows = await page.locator("[data-testid^='profile-row-']").count();
    assertCondition(profileRows >= 1, "Profile matrix failed to render any route coverage rows.");

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 6,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarks}.`,
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

export const frontendContractStudioManifest = {
  task: MANIFEST_PAYLOAD.task_id,
  manifests: MANIFEST_PAYLOAD.summary.manifest_count,
  profiles: PROFILE_PAYLOAD.summary.route_profile_count,
  matrixRows: MATRIX_ROWS.length,
};
