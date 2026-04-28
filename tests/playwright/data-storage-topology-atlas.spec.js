import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "85_data_storage_topology_atlas.html");
const DOMAIN_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "domain_store_manifest.json");
const FHIR_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "fhir_store_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "data_plane_separation_matrix.csv");

export const dataStorageTopologyAtlasCoverage = [
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
  );
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
    const server = http.createServer((request, response) => {
      const rawUrl = request.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/85_data_storage_topology_atlas.html"
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
    server.listen(4385, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing data storage atlas HTML: ${HTML_PATH}`);
  const domainManifest = JSON.parse(fs.readFileSync(DOMAIN_MANIFEST_PATH, "utf8"));
  const fhirManifest = JSON.parse(fs.readFileSync(FHIR_MANIFEST_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  assertCondition(
    domainManifest.summary.store_realization_count === 7,
    "Domain store count drifted.",
  );
  assertCondition(fhirManifest.summary.store_realization_count === 7, "FHIR store count drifted.");
  assertCondition(matrix.length === 10, "Separation matrix row count drifted.");

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1100 } });
  const url =
    process.env.DATA_STORAGE_TOPOLOGY_ATLAS_URL ??
    "http://127.0.0.1:4385/docs/architecture/85_data_storage_topology_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='topology-diagram']").waitFor();
    await page.locator("[data-testid='binding-matrix']").waitFor();
    await page.locator("[data-testid='representation-strip']").waitFor();
    await page.locator("[data-testid='store-table']").waitFor();
    await page.locator("[data-testid='binding-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialStoreCount = await page.locator("[data-testid^='store-row-']").count();
    const initialTopologyCount = await page.locator("[data-testid^='topology-node-']").count();
    assertCondition(
      initialStoreCount === 2,
      `Expected 2 local store rows, found ${initialStoreCount}`,
    );
    assertCondition(
      initialTopologyCount === 2,
      `Expected 2 local topology nodes, found ${initialTopologyCount}`,
    );

    await page.locator("[data-testid='filter-environment']").selectOption("production");
    const productionStoreCount = await page.locator("[data-testid^='store-row-']").count();
    assertCondition(
      productionStoreCount === 4,
      `Expected 4 production store rows, found ${productionStoreCount}`,
    );

    await page.locator("[data-testid='filter-store-family']").selectOption("domain");
    const domainStoreCount = await page.locator("[data-testid^='store-row-']").count();
    assertCondition(
      domainStoreCount === 2,
      `Expected 2 production domain rows, found ${domainStoreCount}`,
    );

    await page.locator("[data-testid='filter-binding-state']").selectOption("warm_standby");
    const standbyDomainCount = await page.locator("[data-testid^='store-row-']").count();
    assertCondition(
      standbyDomainCount === 1,
      `Expected 1 standby domain row, found ${standbyDomainCount}`,
    );

    await page.locator("[data-testid='filter-binding-state']").selectOption("all");
    await page.locator("[data-testid='filter-access-posture']").selectOption("command_write");
    const commandWritableCount = await page.locator("[data-testid^='store-row-']").count();
    assertCondition(
      commandWritableCount === 1,
      `Expected 1 command-write row, found ${commandWritableCount}`,
    );

    await page.locator("[data-testid='store-row-domain-production-primary'] .row-select").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("sid_command_api"),
      "Inspector lost command identity detail.",
    );
    assertCondition(
      inspectorText.includes("001_domain_transaction_bootstrap.sql"),
      "Inspector lost bootstrap SQL reference.",
    );
    const selectedTopology = await page
      .locator("[data-testid='topology-node-domain-production-primary']")
      .getAttribute("data-selected");
    assertCondition(
      selectedTopology === "true",
      "Store selection did not synchronize topology state.",
    );

    await page.locator("[data-testid='filter-access-posture']").selectOption("all");
    await page.locator("[data-testid='filter-store-family']").selectOption("fhir");
    await page
      .locator("[data-testid='filter-binding-state']")
      .selectOption("derived_materialization");
    const derivedFhirCount = await page.locator("[data-testid^='store-row-']").count();
    assertCondition(
      derivedFhirCount === 1,
      `Expected 1 derived FHIR row, found ${derivedFhirCount}`,
    );

    await page
      .locator("[data-testid='binding-row-sep_fhir_mapping_contract_gate'] .row-select")
      .click();
    const stripSelected = await page
      .locator("[data-testid='representation-strip']")
      .getAttribute("data-selected-binding");
    const topologyFamily = await page
      .locator("[data-testid='topology-diagram']")
      .getAttribute("data-selected-family");
    assertCondition(
      stripSelected === "sep_fhir_mapping_contract_gate",
      "Binding selection did not synchronize the representation strip.",
    );
    assertCondition(
      topologyFamily === "fhir",
      "Binding selection did not synchronize topology family highlighting.",
    );

    await page.locator("[data-testid='filter-store-family']").selectOption("domain");
    await page.locator("[data-testid='filter-binding-state']").selectOption("all");
    await page.locator("[data-testid='filter-access-posture']").selectOption("all");
    const firstStoreRow = page.locator("[data-testid='store-row-domain-production-primary']");
    await firstStoreRow.focus();
    await page.keyboard.press("ArrowDown");
    const keyboardSelected = await page
      .locator("[data-testid='store-row-domain-production-secondary']")
      .getAttribute("data-selected");
    assertCondition(
      keyboardSelected === "true",
      "Arrow navigation did not move selection to the next store row.",
    );

    await page.setViewportSize({ width: 940, height: 980 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarkCount >= 5,
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
