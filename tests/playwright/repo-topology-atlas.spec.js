import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "41_repo_topology_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "repo_topology_manifest.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const ARTIFACT_TYPE_ORDER = ["app", "service", "package", "docs-only", "tools-only"];

export const repoTopologyAtlasCoverage = [
  "artifact, context, and defect filtering",
  "graph and table parity",
  "graph-node selection and inspector rendering",
  "keyboard navigation between filtered rows",
  "responsive desktop and mobile layouts",
  "reduced-motion handling",
  "accessibility smoke",
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

function expectedCount(predicate) {
  return MANIFEST.artifacts.filter(predicate).length;
}

function sortArtifacts(items) {
  return [...items].sort((left, right) => {
    const leftType = ARTIFACT_TYPE_ORDER.indexOf(left.artifact_type);
    const rightType = ARTIFACT_TYPE_ORDER.indexOf(right.artifact_type);
    if (leftType !== rightType) {
      return leftType - rightType;
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
        rawUrl === "/" ? "/docs/architecture/41_repo_topology_atlas.html" : rawUrl.split("?")[0];
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
    server.listen(4341, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing topology atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.REPO_TOPOLOGY_ATLAS_URL ??
    "http://127.0.0.1:4341/docs/architecture/41_repo_topology_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='topology-shell']").waitFor();
    await page.locator("[data-testid='graph-canvas']").waitFor();
    await page.locator("[data-testid='node-table']").waitFor();

    const initialRows = await page.locator("#node-body tr").count();
    const initialGraphNodes = await page.locator("[data-testid^='graph-node-']").count();
    assertCondition(
      initialRows === MANIFEST.summary.artifact_count,
      `Expected ${MANIFEST.summary.artifact_count} table rows, found ${initialRows}`,
    );
    assertCondition(
      initialGraphNodes === MANIFEST.summary.artifact_count,
      `Expected ${MANIFEST.summary.artifact_count} graph nodes, found ${initialGraphNodes}`,
    );

    await page.locator("[data-testid='filter-artifact']").selectOption("service");
    const serviceRows = await page.locator("#node-body tr").count();
    const serviceGraphNodes = await page.locator("[data-testid^='graph-node-']").count();
    const expectedServices = expectedCount((artifact) => artifact.artifact_type === "service");
    assertCondition(
      serviceRows === expectedServices,
      `Service filter drifted: expected ${expectedServices}, found ${serviceRows}`,
    );
    assertCondition(
      serviceGraphNodes === expectedServices,
      `Service graph parity drifted: expected ${expectedServices}, found ${serviceGraphNodes}`,
    );

    await page.locator("[data-testid='filter-artifact']").selectOption("all");
    await page.locator("[data-testid='filter-context']").selectOption("pharmacy");
    const pharmacyRows = await page.locator("#node-body tr").count();
    const expectedPharmacy = expectedCount(
      (artifact) => artifact.owner_context_code === "pharmacy",
    );
    assertCondition(
      pharmacyRows === expectedPharmacy,
      `Pharmacy context filter drifted: expected ${expectedPharmacy}, found ${pharmacyRows}`,
    );

    await page.locator("[data-testid='filter-context']").selectOption("all");
    await page.locator("[data-testid='filter-defect']").selectOption("watch");
    const watchRows = await page.locator("#node-body tr").count();
    const expectedWatch = expectedCount((artifact) => artifact.defect_state === "watch");
    assertCondition(
      watchRows === expectedWatch,
      `Watch filter drifted: expected ${expectedWatch}, found ${watchRows}`,
    );

    await page.locator("[data-testid='filter-defect']").selectOption("all");
    await page.locator("[data-testid='graph-node-app_patient_web']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Patient Web"),
      "Inspector lost the selected patient app title.",
    );
    assertCondition(
      inspectorText.includes("rf_patient_home"),
      "Inspector lost the patient route ownership detail.",
    );

    const parityRows = await page.locator("[data-testid='parity-table'] tbody tr").count();
    assertCondition(parityRows === 8, `Expected 8 parity rows, found ${parityRows}`);

    await page.locator("[data-testid='filter-artifact']").selectOption("service");
    const sortedServices = sortArtifacts(
      MANIFEST.artifacts.filter((artifact) => artifact.artifact_type === "service"),
    );
    const firstService = sortedServices[0].artifact_id;
    const secondService = sortedServices[1].artifact_id;
    const firstServiceRow = page.locator(`[data-testid='table-row-${firstService}']`);
    await firstServiceRow.focus();
    await page.keyboard.press("ArrowDown");
    const selected = await page
      .locator(`[data-testid='table-row-${secondService}']`)
      .getAttribute("data-selected");
    assertCondition(
      selected === "true",
      "Arrow-down navigation no longer advances to the next filtered row.",
    );

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

export const repoTopologyAtlasManifest = {
  task: MANIFEST.task_id,
  artifacts: MANIFEST.summary.artifact_count,
  activeDefects: MANIFEST.summary.topology_defect_count,
};
