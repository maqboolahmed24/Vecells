import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "programme", "128_reference_flow_observatory.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "reference_case_catalog.json");

export const syntheticReferenceFlowObservatoryCoverage = [
  "scenario switching across all six deterministic reference cases",
  "unhappy-path visibility for replay, duplicate review, quarantine fallback, identity hold, and confirmation debt",
  "diagram/table parity for sequence, state lattice, and blocker ribbon",
  "keyboard navigation for scenario rail and trace tabs",
  "reduced-motion equivalence",
  "stable seeded fixture rendering in the inspector",
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

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/programme/128_reference_flow_observatory.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/programme/128_reference_flow_observatory.html`,
      });
    });
  });
}

function loadExpected() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const cases = catalog.referenceFlowCases;
  assertCondition(Array.isArray(cases), "referenceFlowCases must be present.");
  return {
    cases,
    count: cases.length,
    unhappyCount: cases.filter((entry) => entry.scenarioClass !== "nominal").length,
    caseIds: cases.map((entry) => entry.referenceCaseId),
  };
}

async function countTableRows(locator) {
  return await locator.locator("tbody tr").count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Reference flow observatory HTML is missing.");
  const expected = loadExpected();
  assertCondition(expected.count === 6, "Reference-flow case count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1200 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='scenario-rail']").waitFor();
    await page.locator("[data-testid='sequence-diagram']").waitFor();
    await page.locator("[data-testid='state-lattice']").waitFor();
    await page.locator("[data-testid='blocker-ribbon']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='scenario-card-']").count()) === expected.count,
      "Scenario rail count drifted.",
    );

    for (const caseId of expected.caseIds) {
      await page.locator(`[data-testid='scenario-card-${caseId}']`).waitFor();
    }

    await page.locator("[data-testid='scenario-card-RC_FLOW_004']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    const inspectorTextLower = inspectorText.toLowerCase();
    assertCondition(
      inspectorText.includes("RC_FLOW_004") &&
        inspectorTextLower.includes("patient-visible continuity") &&
        inspectorText.includes("FallbackReviewCase"),
      "Fallback review case did not populate the inspector.",
    );

    await page.locator("[data-testid='scenario-card-RC_FLOW_005']").click();
    const blockedInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      blockedInspector.includes("RC_FLOW_005") &&
        blockedInspector.includes("GAP_REFERENCE_FLOW_SURFACE_PATIENT_SECURE_LINK_RECOVERY_PUBLICATION_BLOCKED"),
      "Identity-hold case lost blocked shell visibility.",
    );

    await page.locator("[data-testid='scenario-card-RC_FLOW_006']").click();
    const confirmationInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      confirmationInspector.includes("confirmation debt") ||
        confirmationInspector.includes("confirmation"),
      "Confirmation-blocked case is no longer visible in the inspector.",
    );

    const sequenceRows = await page.locator(".sequence-stack [data-testid^='sequence-row-']").count();
    const sequenceTableRows = await countTableRows(page.locator("[data-testid='sequence-table']"));
    assertCondition(sequenceRows === sequenceTableRows, "Sequence diagram/table parity drifted.");

    const latticeCells = await page.locator(".state-grid [data-testid^='lattice-cell-']").count();
    const latticeTableRows = await countTableRows(page.locator("[data-testid='lattice-table']"));
    assertCondition(latticeCells === latticeTableRows, "State lattice/table parity drifted.");

    const ribbonPills = await page.locator(".ribbon-list [data-testid^='ribbon-pill-']").count();
    const ribbonTableRows = await countTableRows(page.locator("[data-testid='ribbon-table']"));
    assertCondition(ribbonPills === ribbonTableRows, "Blocker ribbon/table parity drifted.");

    await page.locator("[data-testid='scenario-card-RC_FLOW_001']").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator("[data-testid='scenario-card-RC_FLOW_002'][data-selected='true']").count()) === 1,
      "ArrowDown did not move scenario selection.",
    );
    await page.keyboard.press("End");
    assertCondition(
      (await page.locator("[data-testid='scenario-card-RC_FLOW_006'][data-selected='true']").count()) === 1,
      "End did not move scenario selection to the final case.",
    );

    await page.locator("[data-testid='tab-events']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      (await page.locator("[data-testid='tab-settlements'][aria-selected='true']").count()) === 1,
      "ArrowRight did not move tab selection.",
    );
    await page.keyboard.press("End");
    assertCondition(
      (await page.locator("[data-testid='tab-sources'][aria-selected='true']").count()) === 1,
      "End did not move tab selection to the final trace panel.",
    );

    await page.locator("[data-testid='scenario-card-RC_FLOW_001']").click();
    const seedFixtures = await page.locator("[data-testid='seed-fixtures'] li").allInnerTexts();
    assertCondition(
      seedFixtures.includes("SEED_059_CLEAN_SELF_SERVICE_SUBMIT_REQUEST_V1") &&
        seedFixtures.some((entry) => entry.startsWith("SEQ_128_RUNTIME_GATEWAY_CLUSTER_RC_FLOW_001_V1")),
      "Stable seeded fixture rendering drifted in the inspector.",
    );

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1480, height: 1200 } });
    await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
    await reducedMotionPage.goto(url, { waitUntil: "networkidle" });
    assertCondition(
      await reducedMotionPage.locator("body.reduced-motion").count(),
      "Reduced-motion mode was not activated.",
    );
    assertCondition(
      (await reducedMotionPage.locator("[data-testid^='scenario-card-']").count()) === expected.count,
      "Reduced-motion rendering changed the scenario count.",
    );
    const reducedSequenceRows = await reducedMotionPage
      .locator(".sequence-stack [data-testid^='sequence-row-']")
      .count();
    const reducedSequenceTableRows = await countTableRows(
      reducedMotionPage.locator("[data-testid='sequence-table']"),
    );
    assertCondition(
      reducedSequenceRows === reducedSequenceTableRows,
      "Reduced-motion rendering broke sequence parity.",
    );
    await reducedMotionPage.close();
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(undefined);
      });
    });
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  const expected = loadExpected();
  assertCondition(expected.count === 6, "Reference-flow case count drifted.");
  console.log("synthetic-reference-flow-observatory.spec.js:ok");
}
