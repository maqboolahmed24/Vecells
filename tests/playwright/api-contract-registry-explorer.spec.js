import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "65_contract_registry_explorer.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "api_contract_registry_manifest.json");
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "route_family_to_query_mutation_channel_cache_matrix.csv",
);

const PAYLOAD = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const MATRIX_ROWS = fs
  .readFileSync(MATRIX_PATH, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.split(","));

export const apiContractRegistryExplorerCoverage = [
  "contract-family filtering",
  "audience and route-family filtering",
  "card selection",
  "constellation and matrix parity",
  "inspector rendering",
  "keyboard navigation",
  "responsive layout",
  "reduced motion",
  "table parity",
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
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/65_contract_registry_explorer.html"
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
    server.listen(4351, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(
    fs.existsSync(HTML_PATH),
    `Missing api contract registry explorer HTML: ${HTML_PATH}`,
  );
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
  const url =
    process.env.API_CONTRACT_REGISTRY_EXPLORER_URL ??
    "http://127.0.0.1:4351/docs/architecture/65_contract_registry_explorer.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='contract-constellation']").waitFor();
    await page.locator("[data-testid='bundle-strip']").waitFor();
    await page.locator("[data-testid='digest-inspector']").waitFor();
    await page.locator("[data-testid='route-family-matrix']").waitFor();

    const initialCards = await page.locator("[data-testid^='contract-card-']").count();
    const expectedContractCount =
      PAYLOAD.summary.projection_query_contract_count +
      PAYLOAD.summary.mutation_command_contract_count +
      PAYLOAD.summary.live_update_channel_contract_count +
      PAYLOAD.summary.client_cache_policy_count;
    assertCondition(
      initialCards === expectedContractCount,
      `Initial contract-card parity drifted: expected ${expectedContractCount}, found ${initialCards}`,
    );

    await page
      .locator("[data-testid='filter-contract-family']")
      .selectOption("MutationCommandContract");
    const mutationCards = await page.locator("[data-testid^='contract-card-']").count();
    assertCondition(
      mutationCards === PAYLOAD.summary.mutation_command_contract_count,
      `Mutation filtering drifted: expected ${PAYLOAD.summary.mutation_command_contract_count}, found ${mutationCards}`,
    );

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_governance_admin");
    const governanceCards = await page.locator("[data-testid^='contract-card-']").count();
    assertCondition(
      governanceCards === 1,
      `Governance audience filtering drifted: found ${governanceCards}`,
    );

    const inspectorText = await page.locator("[data-testid='digest-inspector']").innerText();
    assertCondition(
      inspectorText.includes("MCC_050_RF_GOVERNANCE_SHELL_V1") &&
        inspectorText.includes("RIB_050_RF_GOVERNANCE_SHELL_V1"),
      "Inspector lost expected governance mutation contract detail.",
    );

    await page.locator("[data-testid='filter-contract-family']").selectOption("all");
    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-route-family']").selectOption("rf_patient_requests");
    const patientRouteCards = await page.locator("[data-testid^='contract-card-']").count();
    assertCondition(
      patientRouteCards === 4,
      `Route-family filtering drifted: expected 4 cards, found ${patientRouteCards}`,
    );

    const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
    assertCondition(
      matrixRows === 1,
      `Matrix filtering drifted: expected 1 row, found ${matrixRows}`,
    );

    await page.locator("[data-testid='filter-route-family']").selectOption("all");
    await page
      .locator("[data-testid='filter-contract-family']")
      .selectOption("ProjectionQueryContract");
    await page.locator("[data-testid='contract-card-PQC_050_RF_GOVERNANCE_SHELL_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const selected = await page
      .locator("[data-testid='contract-card-PQC_050_RF_HUB_CASE_MANAGEMENT_V1']")
      .getAttribute("data-selected");
    assertCondition(selected === "true", "ArrowDown no longer advances contract-card selection.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='digest-inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const defectCards = await page.locator("[data-testid^='defect-card-']").count();
    assertCondition(
      defectCards === PAYLOAD.parallelInterfaceGaps.length + PAYLOAD.defects.length,
      "Defect strip parity drifted.",
    );

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

export const apiContractRegistryExplorerManifest = {
  task: PAYLOAD.task_id,
  routeBundles: PAYLOAD.summary.route_family_bundle_count,
  digestRows: PAYLOAD.summary.digest_record_count,
  matrixRows: MATRIX_ROWS.length,
};
