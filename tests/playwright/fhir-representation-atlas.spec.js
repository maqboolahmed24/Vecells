import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "49_fhir_representation_atlas.html");
const CONTRACT_PATH = path.join(ROOT, "data", "analysis", "fhir_representation_contracts.json");
const EXCHANGE_PATH = path.join(ROOT, "data", "analysis", "fhir_exchange_bundle_policies.json");
const POLICY_PATH = path.join(ROOT, "data", "analysis", "fhir_identifier_and_status_policies.json");

const CONTRACT_PAYLOAD = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const EXCHANGE_PAYLOAD = JSON.parse(fs.readFileSync(EXCHANGE_PATH, "utf8"));
const POLICY_PAYLOAD = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));

export const fhirRepresentationAtlasCoverage = [
  "aggregate filtering",
  "mapping-row selection",
  "inspector rendering",
  "bundle-policy visibility",
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

function filteredContracts({
  aggregate = "all",
  context = "all",
  purpose = "all",
  resource = "all",
  defect = "all",
}) {
  return CONTRACT_PAYLOAD.contracts.filter((row) => {
    return (
      (aggregate === "all" || row.governingAggregateType === aggregate) &&
      (context === "all" || row.owningBoundedContextRef === context) &&
      (purpose === "all" || row.representationPurpose === purpose) &&
      (resource === "all" || row.allowedResourceTypes.includes(resource)) &&
      (defect === "all" || row.defectState === defect)
    );
  });
}

function bundlePolicies(contractId) {
  const contract = CONTRACT_PAYLOAD.contracts.find(
    (row) => row.fhirRepresentationContractId === contractId,
  );
  return EXCHANGE_PAYLOAD.policies.filter((row) =>
    contract.declaredBundlePolicyRefs.includes(row.policyId),
  );
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = ROOT;
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/49_fhir_representation_atlas.html"
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
    server.listen(4349, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing FHIR representation atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.FHIR_REPRESENTATION_ATLAS_URL ??
    "http://127.0.0.1:4349/docs/architecture/49_fhir_representation_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='mapping-table']").waitFor();
    await page.locator("[data-testid='bundle-matrix']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialRows = await page.locator("[data-testid^='mapping-row-']").count();
    assertCondition(
      initialRows === CONTRACT_PAYLOAD.contracts.length,
      `Initial mapping-row parity drifted: expected ${CONTRACT_PAYLOAD.contracts.length}, found ${initialRows}`,
    );

    await page.locator("[data-testid='filter-purpose']").selectOption("external_interchange");
    await page.locator("[data-testid='filter-resource']").selectOption("ServiceRequest");
    await page.locator("[data-testid='filter-defect']").selectOption("active");
    const filtered = filteredContracts({
      purpose: "external_interchange",
      resource: "ServiceRequest",
      defect: "active",
    });
    const filteredRows = await page.locator("[data-testid^='mapping-row-']").count();
    assertCondition(
      filteredRows === filtered.length,
      `Purpose/resource filtering drifted: expected ${filtered.length}, found ${filteredRows}`,
    );

    const pharmacyAggregateButton = page
      .locator("[data-testid='aggregate-button-list'] .aggregate-button")
      .filter({ hasText: "PharmacyCase" })
      .first();
    await pharmacyAggregateButton.click();
    const pharmacyFiltered = filteredContracts({
      aggregate: "PharmacyCase",
      purpose: "external_interchange",
      resource: "ServiceRequest",
      defect: "active",
    });
    const pharmacyRows = await page.locator("[data-testid^='mapping-row-']").count();
    assertCondition(
      pharmacyRows === pharmacyFiltered.length,
      `Aggregate filtering drifted: expected ${pharmacyFiltered.length}, found ${pharmacyRows}`,
    );

    const targetId = "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1";
    await page.locator(`[data-testid='mapping-row-${targetId}'] td`).first().click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("PharmacyCase") &&
        inspectorText.includes("ServiceRequest") &&
        inspectorText.includes("DispatchProofEnvelope"),
      "Inspector lost expected pharmacy referral detail.",
    );

    const bundleRows = await page.locator("[data-testid^='bundle-row-']").count();
    assertCondition(
      bundleRows === bundlePolicies(targetId).length,
      `Bundle matrix drifted: expected ${bundlePolicies(targetId).length}, found ${bundleRows}`,
    );
    const bundleText = await page.locator("[data-testid='bundle-matrix']").innerText();
    assertCondition(
      bundleText.includes("ACP_049_PHARMACY_REFERRAL_TRANSPORT") && bundleText.includes("message"),
      "Bundle matrix lost expected pharmacy transport policy detail.",
    );

    await page.locator("[data-testid='filter-purpose']").selectOption("all");
    await page.locator("[data-testid='filter-resource']").selectOption("all");
    await page
      .locator("[data-testid='aggregate-button-list'] .aggregate-button")
      .filter({ hasText: "Request" })
      .first()
      .click();
    const requestContracts = filteredContracts({ aggregate: "Request" });
    const firstRequest = requestContracts[0];
    const secondRequest = requestContracts[1];
    const firstRow = page.locator(
      `[data-testid='mapping-row-${firstRequest.fhirRepresentationContractId}']`,
    );
    await firstRow.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='mapping-row-${secondRequest.fhirRepresentationContractId}']`)
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-down navigation no longer advances to the next mapping row.",
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

export const fhirRepresentationAtlasManifest = {
  task: CONTRACT_PAYLOAD.task_id,
  contracts: CONTRACT_PAYLOAD.summary.active_contract_count,
  bundles: EXCHANGE_PAYLOAD.summary.policy_count,
  blocked: POLICY_PAYLOAD.summary.blocked_lifecycle_owner_count,
};
