import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "142_urgent_pathway_atlas.html");
const DECISION_TABLES_PATH = path.join(ROOT, "data", "contracts", "142_red_flag_decision_tables.yaml");
const COPY_CONTRACT_PATH = path.join(ROOT, "data", "contracts", "142_outcome_copy_contract.json");
const COVERAGE_MATRIX_PATH = path.join(ROOT, "data", "analysis", "142_rule_coverage_matrix.csv");

export const urgentPathwayAtlasCoverage = [
  "urgent-diversion same-shell transition",
  "safe-receipt outcome",
  "failed-safe recovery outcome",
  "keyboard focus placement",
  "responsive layout",
  "reduced-motion equivalence",
  "diagram and table parity",
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

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
  });
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/142_urgent_pathway_atlas.html";
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
      const contentType =
        extension === ".html"
          ? "text/html"
          : extension === ".json" || extension === ".yaml"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": contentType });
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
        url: `http://127.0.0.1:${address.port}/docs/frontend/142_urgent_pathway_atlas.html`,
      });
    });
  });
}

function loadExpected() {
  const decisionTables = JSON.parse(fs.readFileSync(DECISION_TABLES_PATH, "utf8"));
  const copyContract = JSON.parse(fs.readFileSync(COPY_CONTRACT_PATH, "utf8"));
  const coverageRows = parseCsv(fs.readFileSync(COVERAGE_MATRIX_PATH, "utf8"));
  const copyVariantCount = copyContract.copyFamilies.reduce((count, family) => count + family.variants.length, 0);
  return {
    scenarioCount: 5,
    ladderCount: 6,
    ruleFamilyCount: 4,
    copyVariantCount,
    coverageCount: coverageRows.length,
    hardStopCount: decisionTables.hardStopRules.length,
  };
}

async function rowCount(page, testId) {
  return await page.locator(`[data-testid='${testId}'] tbody tr`).count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_142 urgent pathway atlas HTML is missing.");
  const expected = loadExpected();
  assertCondition(expected.hardStopCount >= 5, "Hard-stop coverage drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='urgent-pathway-atlas']").waitFor();
    await page.locator("[data-testid='scenario-bar']").waitFor();
    await page.locator("[data-testid='outcome-card']").waitFor();
    await page.locator("[data-testid='decision-ladder']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='scenario-button-']").count()) === expected.scenarioCount,
      "Scenario button count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='ladder-step-']").count()) === expected.ladderCount,
      "Decision ladder visual count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='rule-family-visuals'] [data-testid^='rule-family-']").count()) ===
        expected.ruleFamilyCount,
      "Rule-family visual count drifted.",
    );
    assertCondition(
      (await rowCount(page, "decision-ladder-table")) === expected.ladderCount,
      "Decision ladder table count drifted.",
    );
    assertCondition(
      (await rowCount(page, "rule-family-table")) === expected.ruleFamilyCount,
      "Rule-family table count drifted.",
    );
    assertCondition(
      (await rowCount(page, "copy-comparison-table")) === expected.copyVariantCount,
      "Copy comparison count drifted.",
    );
    assertCondition(
      (await rowCount(page, "rule-coverage-table")) === expected.coverageCount,
      "Rule coverage count drifted.",
    );

    const shellKey = (await page.locator("[data-testid='shell-key-chip']").innerText()).trim();
    assertCondition(shellKey === "patient.portal.requests", "Shell key drifted from same-shell lineage.");

    await page.locator("[data-testid='scenario-button-C142_URGENT_CHEST_PAIN']").click();
    assertCondition(
      (await page.locator("[data-testid='outcome-title']").innerText()).trim() === "Get urgent help now",
      "Urgent required title drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='submit-result-chip']").innerText()).trim() === "urgent_diversion",
      "Urgent required submit result drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-state']").innerText()).trim() === "urgent_diversion_required",
      "Urgent required inspector state drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-settlement']").innerText()).trim() === "pending",
      "Urgent required settlement should still be pending.",
    );
    assertCondition(
      (await page.locator("[data-testid='primary-action']").innerText()).trim() === "Call 999 now",
      "Urgent primary action drifted.",
    );
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) === "primary-action",
      "Urgent selection did not move focus to the primary action.",
    );
    assertCondition(
      (await page.locator("[data-testid='shell-key-chip']").innerText()).trim() === shellKey,
      "Urgent selection broke same-shell continuity.",
    );

    await page.locator("[data-testid='scenario-button-C142_URGENT_ISSUED_AFTER_SETTLEMENT']").click();
    assertCondition(
      (await page.locator("[data-testid='inspector-state']").innerText()).trim() === "urgent_diverted",
      "Urgent issued scenario did not expose urgent_diverted.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-settlement']").innerText()).trim() === "issued",
      "Urgent issued scenario is missing the issued settlement.",
    );
    assertCondition(
      (await page.locator("[data-testid='primary-action']").innerText()).trim() === "Open urgent guidance",
      "Urgent issued primary action drifted.",
    );

    await page.locator("[data-testid='scenario-button-C142_SAFE_RECEIPT_CLEAR']").click();
    assertCondition(
      (await page.locator("[data-testid='outcome-title']").innerText()).trim() === "Your request has been sent",
      "Safe receipt title drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='submit-result-chip']").innerText()).trim() === "triage_ready",
      "Safe receipt submit result drifted.",
    );
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) === "outcome-title",
      "Safe receipt should move focus to the outcome title.",
    );

    await page.locator("[data-testid='scenario-button-C142_DEGRADED_ATTACHMENT_FAIL_CLOSED']").click();
    assertCondition(
      (await page.locator("[data-testid='outcome-title']").innerText()).trim() === "We could not safely complete this online",
      "Failed-safe title drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='submit-result-chip']").innerText()).trim() === "failed_safe",
      "Failed-safe submit result drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-state']").innerText()).trim() === "not_settled",
      "Failed-safe inspector state should stay not_settled.",
    );
    assertCondition(
      (await page.locator("[data-testid='primary-action']").innerText()).trim() === "Call the practice now",
      "Failed-safe primary action drifted.",
    );
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) === "primary-action",
      "Failed-safe selection did not move focus to the dominant action.",
    );

    await page.locator("[data-testid='scenario-button-C142_SAFE_RECEIPT_CLEAR']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      await page.locator("[data-testid='scenario-button-C142_RESULTS_RESIDUAL_REVIEW']").getAttribute("data-selected") ===
        "true",
      "ArrowRight did not move selection to the residual review scenario.",
    );
    await page.keyboard.press("End");
    assertCondition(
      await page.locator("[data-testid='scenario-button-C142_DEGRADED_ATTACHMENT_FAIL_CLOSED']").getAttribute("data-selected") ===
        "true",
      "End did not move selection to the last scenario.",
    );
    await page.keyboard.press("Home");
    assertCondition(
      await page.locator("[data-testid='scenario-button-C142_SAFE_RECEIPT_CLEAR']").getAttribute("data-selected") ===
        "true",
      "Home did not restore selection to the first scenario.",
    );

    assertCondition((await page.locator("header").count()) === 1, "Header landmark is missing.");
    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Aside landmark is missing.");

    await page.setViewportSize({ width: 960, height: 1100 });
    await page.waitForFunction(() => document.body.dataset.layout === "stack");
    assertCondition(
      await page.locator("[data-testid='inspector-drawer-button']").isVisible(),
      "Inspector drawer button disappeared in stacked layout.",
    );
    await page.locator("[data-testid='inspector-drawer-button']").click();
    assertCondition(
      (await page.locator("[data-testid='copy-inspector']").getAttribute("data-open")) === "false",
      "Inspector drawer button did not toggle the inspector state.",
    );
    await page.locator("[data-testid='inspector-drawer-button']").click();
    assertCondition(
      (await page.locator("[data-testid='copy-inspector']").getAttribute("data-open")) === "true",
      "Inspector drawer did not reopen.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 980);
    assertCondition(widthSafe, "Responsive urgent atlas overflowed horizontally.");

    const motionPage = await browser.newPage({ viewport: { width: 1320, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body.reduced-motion").count()) === 1,
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid^='ladder-step-']").count()) === expected.ladderCount,
        "Reduced-motion rendering changed ladder count.",
      );
      assertCondition(
        (await rowCount(motionPage, "rule-family-table")) === expected.ruleFamilyCount,
        "Reduced-motion rendering broke rule-family parity.",
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
