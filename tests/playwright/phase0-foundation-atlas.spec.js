import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "programme", "132_phase0_foundation_atlas.html");
const TRACE_INDEX_PATH = path.join(ROOT, "data", "analysis", "foundation_demo_trace_index.json");
const SCENARIO_CSV_PATH = path.join(ROOT, "data", "analysis", "foundation_demo_scenarios.csv");

export const phase0FoundationAtlasCoverage = [
  "scenario switching sync across rail, constellation, ribbon, ladder, and inspector",
  "happy-path and unhappy-path proof visibility",
  "keyboard traversal for scenario rail and evidence tabs",
  "responsive layout and reduced-motion equivalence",
  "evidence and source tab integrity",
  "diagram and table parity for constellation, state ribbon, settlement ladder, and tabs",
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
      pathname = "/docs/programme/132_phase0_foundation_atlas.html";
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
        url: `http://127.0.0.1:${address.port}/docs/programme/132_phase0_foundation_atlas.html`,
      });
    });
  });
}

function loadExpected() {
  const traceIndex = JSON.parse(fs.readFileSync(TRACE_INDEX_PATH, "utf8"));
  const csvRows = fs
    .readFileSync(SCENARIO_CSV_PATH, "utf8")
    .trim()
    .split("\n");

  return {
    scenarios: traceIndex.scenarios,
    scenarioCount: traceIndex.scenarios.length,
    unhappyCount: traceIndex.scenarios.filter((row) => row.scenarioDisposition === "unhappy").length,
    csvRowCount: csvRows.length - 1,
    driftScenario: traceIndex.scenarios.find((row) => row.scenarioId === "P0_SCN_006_PUBLICATION_DRIFT"),
    identityScenario: traceIndex.scenarios.find((row) => row.scenarioId === "P0_SCN_005_IDENTITY_HOLD"),
  };
}

async function countTableRows(locator) {
  return await locator.locator("tbody tr").count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Phase 0 foundation atlas HTML is missing.");
  const expected = loadExpected();
  assertCondition(expected.scenarioCount === 7, "Scenario count drifted.");
  assertCondition(expected.csvRowCount === 7, "Scenario CSV row count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='scenario-rail']").waitFor();
    await page.locator("[data-testid='constellation']").waitFor();
    await page.locator("[data-testid='state-ribbon']").waitFor();
    await page.locator("[data-testid='settlement-ladder']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='evidence-tabs']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='scenario-button-']").count()) === expected.scenarioCount,
      "Scenario rail count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-release-ref']").innerText()).trim() === "RC_LOCAL_V1",
      "Release candidate summary drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-exit-state']").innerText()).trim() === "withheld",
      "Exit state drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-unhappy-count']").innerText()).trim() === `${expected.unhappyCount} unhappy`,
      "Unhappy-path summary drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid='scenario-table'] tbody tr").count()) === expected.scenarioCount,
      "Scenario table parity drifted.",
    );

    await page.locator("[data-testid='scenario-button-P0_SCN_004_QUARANTINE_FALLBACK']").click();
    const fallbackInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      fallbackInspector.includes("P0_SCN_004_QUARANTINE_FALLBACK") &&
        fallbackInspector.includes("surf_support_replay_observe"),
      "Fallback review scenario did not synchronize the inspector.",
    );

    await page.locator("[data-testid='scenario-button-P0_SCN_005_IDENTITY_HOLD']").click();
    const identityInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      identityInspector.includes("P0_SCN_005_IDENTITY_HOLD") &&
        identityInspector.includes("blocked_proof"),
      "Identity-hold scenario lost blocked proof visibility.",
    );

    await page.locator("[data-testid='scenario-button-P0_SCN_006_PUBLICATION_DRIFT']").click();
    const driftInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      driftInspector.includes(expected.driftScenario.scenarioId) &&
        driftInspector.includes("recovery_only_proof"),
      "Publication drift scenario did not synchronize the inspector.",
    );
    await page.locator("[data-testid='tab-evidence']").click();
    const evidenceText = await page.locator("[data-testid='evidence-table']").innerText();
    assertCondition(
      evidenceText.includes("FZB_131_LOCAL_GATEWAY_SURFACES"),
      "Evidence tab lost the local gateway surface blocker.",
    );
    await page.locator("[data-testid='tab-sources']").click();
    const sourceText = await page.locator("[data-testid='source-table']").innerText();
    assertCondition(
      sourceText.includes("platform-runtime-and-release-blueprint.md#FrontendContractManifest"),
      "Source tab lost the publication/source trace references.",
    );

    const constellationCards = await page.locator("[data-testid^='constellation-card-']").count();
    const scenarioTableRows = await countTableRows(page.locator("[data-testid='scenario-table']"));
    assertCondition(constellationCards === scenarioTableRows, "Constellation/table parity drifted.");

    const statePills = await page.locator("[data-testid^='state-pill-']").count();
    const stateRows = await countTableRows(page.locator("[data-testid='state-table']"));
    assertCondition(statePills === stateRows, "State ribbon/table parity drifted.");

    const settlementSteps = await page.locator("[data-testid^='settlement-step-']").count();
    const settlementRows = await countTableRows(page.locator("[data-testid='settlement-table']"));
    assertCondition(settlementSteps === settlementRows, "Settlement ladder/table parity drifted.");

    const evidenceCards = await page.locator("[data-testid^='evidence-card-']").count();
    const evidenceRows = await countTableRows(page.locator("[data-testid='evidence-table']"));
    assertCondition(evidenceCards === evidenceRows, "Evidence stack/table parity drifted.");

    const sourceItems = await page.locator("[data-testid^='source-item-']").count();
    const sourceRows = await countTableRows(page.locator("[data-testid='source-table']"));
    assertCondition(sourceItems === sourceRows, "Source list/table parity drifted.");

    await page.locator("[data-testid='scenario-button-P0_SCN_001_HAPPY_PATH']").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator("[data-testid='scenario-button-P0_SCN_002_EXACT_REPLAY'][data-selected='true']").count()) === 1,
      "ArrowDown did not move scenario selection.",
    );
    await page.keyboard.press("End");
    assertCondition(
      (await page.locator("[data-testid='scenario-button-P0_SCN_007_CONFIRMATION_BLOCKED'][data-selected='true']").count()) === 1,
      "End did not move to the final scenario.",
    );

    await page.locator("[data-testid='tab-evidence']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      (await page.locator("[data-testid='tab-sources'][aria-selected='true']").count()) === 1,
      "ArrowRight did not move tab selection.",
    );
    await page.keyboard.press("Home");
    assertCondition(
      (await page.locator("[data-testid='tab-evidence'][aria-selected='true']").count()) === 1,
      "Home did not restore the evidence tab.",
    );

    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Inspector landmark is missing.");

    await page.setViewportSize({ width: 980, height: 1120 });
    assertCondition(
      await page.locator("[data-testid='scenario-rail']").isVisible(),
      "Scenario rail disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow width.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 1000);
    assertCondition(widthSafe, "Responsive layout overflowed horizontally.");

    const motionPage = await browser.newPage({ viewport: { width: 1320, height: 980 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body.reduced-motion").count()) === 1,
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid^='scenario-button-']").count()) === expected.scenarioCount,
        "Reduced-motion rendering changed scenario count.",
      );
      const reducedSettlementSteps = await motionPage.locator("[data-testid^='settlement-step-']").count();
      const reducedSettlementRows = await countTableRows(
        motionPage.locator("[data-testid='settlement-table']"),
      );
      assertCondition(
        reducedSettlementSteps === reducedSettlementRows,
        "Reduced-motion rendering broke settlement parity.",
      );
    } finally {
      await motionPage.close();
    }
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
