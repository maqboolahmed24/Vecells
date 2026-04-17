import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "59_seed_and_simulator_studio.html");
const CASE_PATH = path.join(ROOT, "data", "analysis", "reference_case_catalog.json");
const SIMULATOR_PATH = path.join(ROOT, "data", "analysis", "simulator_contract_catalog.json");
const FAULT_PATH = path.join(ROOT, "data", "analysis", "simulator_fault_injection_matrix.csv");

const CASE_PAYLOAD = JSON.parse(fs.readFileSync(CASE_PATH, "utf8"));
const SIMULATOR_PAYLOAD = JSON.parse(fs.readFileSync(SIMULATOR_PATH, "utf8"));

export const seedAndSimulatorCoverage = [
  "persona filtering",
  "channel filtering",
  "simulator filtering",
  "case-card selection",
  "diagram and matrix and inspector synchronization",
  "keyboard navigation",
  "responsive layout",
  "reduced motion",
  "accessibility smoke checks",
  "table parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
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
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/59_seed_and_simulator_studio.html"
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
    server.listen(4359, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
  const faultRows = parseCsv(fs.readFileSync(FAULT_PATH, "utf8"));
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.SEED_AND_SIMULATOR_STUDIO_URL ??
    "http://127.0.0.1:4359/docs/architecture/59_seed_and_simulator_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='case-flow-map']").waitFor();
    await page.locator("[data-testid='simulator-boundary-diagram']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='case-card-']").count();
    assertCondition(
      initialCards === CASE_PAYLOAD.referenceCases.length,
      `Reference case count drifted: expected ${CASE_PAYLOAD.referenceCases.length}, found ${initialCards}`,
    );

    await page.locator("[data-testid='persona-filter']").selectOption("support_operator");
    const supportCards = await page.locator("[data-testid^='case-card-']").count();
    assertCondition(supportCards === 3, `Expected 3 support_operator cases, found ${supportCards}`);

    await page.locator("[data-testid='persona-filter']").selectOption("all");
    await page.locator("[data-testid='channel-filter']").selectOption("telephony_ivr");
    const telephonyCards = await page.locator("[data-testid^='case-card-']").count();
    assertCondition(
      telephonyCards === 2,
      `Expected 2 telephony_ivr cases, found ${telephonyCards}`,
    );

    await page.locator("[data-testid='channel-filter']").selectOption("all");
    await page
      .locator("[data-testid='simulator-filter']")
      .selectOption("sim_pharmacy_dispatch_transport_twin");
    const pharmacyCards = await page.locator("[data-testid^='case-card-']").count();
    assertCondition(
      pharmacyCards === 1,
      `Expected 1 pharmacy dispatch case, found ${pharmacyCards}`,
    );

    const selectedCase = CASE_PAYLOAD.referenceCases.find(
      (item) => item.referenceCaseId === "RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1",
    );
    assertCondition(Boolean(selectedCase), "Expected pharmacy dispatch reference case to exist.");
    await page.locator("[data-testid='case-card-RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("pharmacy_dispatch_proof_pending_weak_match") &&
        inspectorText.includes("sim_pharmacy_dispatch_transport_twin"),
      "Inspector lost the selected pharmacy dispatch case details.",
    );

    const simNodes = await page.locator("[data-testid^='sim-node-']").count();
    assertCondition(
      simNodes === selectedCase.requiredSimulatorRefs.length,
      `Simulator diagram drifted: expected ${selectedCase.requiredSimulatorRefs.length}, found ${simNodes}`,
    );
    const simParityRows = await page
      .locator("[data-testid='simulator-parity-table'] tbody tr")
      .count();
    assertCondition(
      simParityRows === selectedCase.requiredSimulatorRefs.length,
      "Simulator diagram and parity table drifted.",
    );

    const flowNodes = await page.locator("[data-testid^='flow-node-']").count();
    const flowParityRows = await page
      .locator("[data-testid='case-flow-parity-table'] tbody tr")
      .count();
    assertCondition(flowNodes === flowParityRows, "Case flow map and parity table drifted.");

    const expectedFaultRows = faultRows.filter(
      (row) => row.reference_case_id === "RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1",
    );
    const visibleFaultRows = await page.locator("[data-testid^='fault-row-']").count();
    assertCondition(
      visibleFaultRows === expectedFaultRows.length,
      `Expected ${expectedFaultRows.length} fault rows, found ${visibleFaultRows}`,
    );

    await page.locator("[data-testid='simulator-filter']").selectOption("all");
    await page.locator("[data-testid='case-card-RC_059_CLEAN_SELF_SERVICE_SUBMIT_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='case-card-RC_059_DUPLICATE_RETRY_COLLAPSE_V1']")
      .getAttribute("data-selected");
    assertCondition(
      nextSelected === "true",
      "Arrow-down navigation no longer advances case selection.",
    );

    await page.locator("[data-testid^='fault-row-']").first().focus();
    await page.keyboard.press("ArrowDown");
    const secondFaultSelected = await page
      .locator("[data-testid^='fault-row-']")
      .nth(1)
      .getAttribute("data-selected");
    assertCondition(
      secondFaultSelected === "true",
      "Table-row arrow navigation no longer advances selection.",
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
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}`);
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

export const seedAndSimulatorManifest = {
  task: CASE_PAYLOAD.task_id,
  referenceCases: CASE_PAYLOAD.summary.reference_case_count,
  simulators: SIMULATOR_PAYLOAD.summary.simulator_count,
};
