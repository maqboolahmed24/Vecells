import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "48_event_registry_studio.html");
const CONTRACT_PATH = path.join(ROOT, "data", "analysis", "canonical_event_contracts.json");
const NORMALIZATION_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "canonical_event_normalization_rules.json",
);
const SCHEMA_PATH = path.join(ROOT, "data", "analysis", "canonical_event_schema_versions.json");

const CONTRACT_PAYLOAD = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const NORMALIZATION_PAYLOAD = JSON.parse(fs.readFileSync(NORMALIZATION_PATH, "utf8"));
const SCHEMA_PAYLOAD = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));

export const eventRegistryStudioCoverage = [
  "namespace filtering",
  "event-row expansion",
  "inspector rendering",
  "normalization-rule parity",
  "schema diff filtering",
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
  namespace = "all",
  context = "all",
  compatibility = "all",
  replay = "all",
  defect = "all",
}) {
  return CONTRACT_PAYLOAD.contracts
    .filter((row) => namespace === "all" || row.namespaceCode === namespace)
    .filter((row) => context === "all" || row.owningBoundedContextRef === context)
    .filter((row) => compatibility === "all" || row.compatibilityMode === compatibility)
    .filter((row) => replay === "all" || row.replaySemantics === replay)
    .filter((row) => defect === "all" || row.defectState === defect)
    .sort((left, right) => left.eventName.localeCompare(right.eventName));
}

function filteredRules(namespace) {
  const contracts = filteredContracts({ namespace });
  const refs = new Set(contracts.map((row) => row.canonicalEventContractId));
  return NORMALIZATION_PAYLOAD.normalizationRules.filter((row) =>
    refs.has(row.targetCanonicalEventContractRef),
  );
}

function filteredDiffs(namespace, diff) {
  const eventNames = new Set(filteredContracts({ namespace }).map((row) => row.eventName));
  return SCHEMA_PAYLOAD.schemaDiffLedger
    .filter((row) => eventNames.has(row.eventName))
    .filter(
      (row) => diff === "all" || row.reviewOutcome === diff || row.compatibilityMode === diff,
    );
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = ROOT;
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/" ? "/docs/architecture/48_event_registry_studio.html" : rawUrl.split("?")[0];
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
    server.listen(4348, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing event registry studio HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.EVENT_REGISTRY_STUDIO_URL ??
    "http://127.0.0.1:4348/docs/architecture/48_event_registry_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='contract-table']").waitFor();
    await page.locator("[data-testid='diff-ledger']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialRows = await page.locator("[data-testid^='contract-row-']").count();
    assertCondition(
      initialRows === filteredContracts({}).length,
      `Initial contract-row parity drifted: expected ${filteredContracts({}).length}, found ${initialRows}`,
    );

    await page.locator("[data-testid='filter-context']").selectOption("identity_access");
    const identityContextContracts = filteredContracts({ context: "identity_access" });
    const identityContextRows = await page.locator("[data-testid^='contract-row-']").count();
    assertCondition(
      identityContextRows === identityContextContracts.length,
      `Context filter drifted: expected ${identityContextContracts.length}, found ${identityContextRows}`,
    );

    await page.locator("[data-testid='namespace-button-identity']").click();
    const identityContracts = filteredContracts({
      namespace: "identity",
      context: "identity_access",
    });
    const identityRows = await page.locator("[data-testid^='contract-row-']").count();
    assertCondition(
      identityRows === identityContracts.length,
      `Namespace filter drifted: expected ${identityContracts.length}, found ${identityRows}`,
    );
    assertCondition(
      identityContracts.length >= 10,
      "Expected multiple identity contracts for registry coverage.",
    );

    const targetEvent = "identity.repair_case.opened";
    const targetContract = CONTRACT_PAYLOAD.contracts.find((row) => row.eventName === targetEvent);
    await page
      .locator(`[data-testid='contract-row-${targetContract.canonicalEventContractId}'] td`)
      .first()
      .click();
    await page
      .locator(`[data-testid='contract-expand-${targetContract.canonicalEventContractId}']`)
      .waitFor();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("IdentityRepairCase") &&
        inspectorText.includes("identity.repair_case.opened"),
      "Inspector lost expected identity repair contract detail.",
    );

    const ruleRows = await page.locator("[data-testid^='rule-row-']").count();
    assertCondition(
      ruleRows === filteredRules("identity").length,
      `Normalization rule parity drifted: expected ${filteredRules("identity").length}, found ${ruleRows}`,
    );

    await page.locator("[data-testid='filter-compatibility']").selectOption("new_version_required");
    const newVersionRows = await page.locator("[data-testid^='contract-row-']").count();
    assertCondition(
      newVersionRows ===
        filteredContracts({
          namespace: "identity",
          context: "identity_access",
          compatibility: "new_version_required",
        }).length,
      "Compatibility filter drifted.",
    );

    await page.locator("[data-testid='filter-diff']").selectOption("blocked");
    const blockedDiffRows = await page.locator("[data-testid^='diff-row-']").count();
    assertCondition(
      blockedDiffRows === filteredDiffs("identity", "blocked").length,
      "Schema diff filtering drifted.",
    );

    await page.locator("[data-testid='filter-context']").selectOption("all");
    await page.locator("[data-testid='filter-compatibility']").selectOption("all");
    await page.locator("[data-testid='namespace-button-request']").click();
    const requestContracts = filteredContracts({ namespace: "request" });
    const firstRequest = requestContracts[0];
    const secondRequest = requestContracts[1];
    const firstRow = page.locator(
      `[data-testid='contract-row-${firstRequest.canonicalEventContractId}']`,
    );
    await firstRow.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='contract-row-${secondRequest.canonicalEventContractId}']`)
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-down navigation no longer advances to the next contract row.",
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

export const eventRegistryStudioManifest = {
  task: CONTRACT_PAYLOAD.task_id,
  contracts: CONTRACT_PAYLOAD.summary.active_contract_count,
  namespaces: CONTRACT_PAYLOAD.summary.namespace_count,
  blockedSchemas: SCHEMA_PAYLOAD.summary.blocked_schema_count,
};
