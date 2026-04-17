import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "140_request_type_questionnaire_atlas.html");
const TAXONOMY_PATH = path.join(ROOT, "data", "contracts", "140_request_type_taxonomy.json");
const QUESTION_DEFINITIONS_PATH = path.join(ROOT, "data", "contracts", "140_question_definitions.json");
const VISIBILITY_MATRIX_PATH = path.join(ROOT, "data", "analysis", "140_question_visibility_matrix.csv");
const BUNDLE_MATRIX_PATH = path.join(ROOT, "data", "analysis", "140_bundle_compatibility_matrix.csv");

export const requestTypeQuestionnaireAtlasCoverage = [
  "request-type switching across Symptoms, Meds, Admin, and Results",
  "conditional reveal and superseded-audit behavior",
  "keyboard navigation and focus order across cards and tabs",
  "responsive mission_stack collapse",
  "reduced-motion equivalence",
  "question tree and table parity",
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
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/140_request_type_questionnaire_atlas.html";
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
        url: `http://127.0.0.1:${address.port}/docs/frontend/140_request_type_questionnaire_atlas.html`,
      });
    });
  });
}

function loadExpected() {
  const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));
  const questionContract = JSON.parse(fs.readFileSync(QUESTION_DEFINITIONS_PATH, "utf8"));
  const visibilityRows = parseCsv(fs.readFileSync(VISIBILITY_MATRIX_PATH, "utf8"));
  const bundleRows = parseCsv(fs.readFileSync(BUNDLE_MATRIX_PATH, "utf8"));
  const questionCounts = Object.fromEntries(
    taxonomy.requestTypes.map((row) => [
      row.requestType,
      questionContract.questionDefinitions.filter((question) => question.requestType === row.requestType).length,
    ]),
  );
  const bundleCounts = Object.fromEntries(
    taxonomy.requestTypes.map((row) => [
      row.requestType,
      bundleRows.filter((bundleRow) => bundleRow.appliesToRequestTypes.split(",").includes(row.requestType)).length,
    ]),
  );
  return {
    requestTypeCount: taxonomy.requestTypes.length,
    visibilityRowCount: visibilityRows.length,
    questionCounts,
    bundleCounts,
  };
}

async function tableRowCount(page, testId) {
  return await page.locator(`[data-testid='${testId}'] tbody tr`).count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_140 questionnaire atlas HTML is missing.");
  const expected = loadExpected();
  assertCondition(expected.requestTypeCount === 4, "Request-type count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1240 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='request-type-atlas']").waitFor();
    await page.locator("[data-testid='request-type-card-Symptoms']").waitFor();
    await page.locator("[data-testid='decision-table']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='request-type-card-']").count()) === expected.requestTypeCount,
      "Request-type card count drifted.",
    );
    assertCondition(
      await page.locator("[data-testid='request-type-card-Symptoms']").getAttribute("data-selected") === "true",
      "Symptoms should be selected on first render.",
    );
    assertCondition(
      (await page.locator("#summary-lines li").first().innerText()).includes("Symptoms"),
      "Initial summary card does not reflect the Symptoms branch.",
    );

    await page.locator("[data-testid='request-type-card-Results']").click();
    assertCondition((await page.locator("#type-title").innerText()).trim() === "Results", "Results card did not update the narrative title.");
    assertCondition(
      (await page.locator("#summary-lines li").first().innerText()).includes("Result context"),
      "Results selection did not update the example summary card.",
    );
    assertCondition(
      (await tableRowCount(page, "decision-table")) === expected.questionCounts.Results,
      "Results question-rule table count drifted.",
    );
    assertCondition(
      await page.locator("[data-testid='table-panel-bundle']").evaluate((node) => node.hidden) === true,
      "Bundle matrix panel should stay hidden until its tab is selected.",
    );

    await page.locator("[data-testid='request-type-card-Meds']").click();
    assertCondition((await page.locator("#type-title").innerText()).trim() === "Meds", "Meds card did not update the narrative title.");
    assertCondition(
      (await page.locator("[data-testid='selected-question-set']").innerText()).trim() === "QSET_140_MEDS_V1",
      "Question set chip drifted for Meds.",
    );
    assertCondition(
      (await tableRowCount(page, "decision-table")) === expected.questionCounts.Meds,
      "Meds question-rule table count drifted.",
    );
    assertCondition(
      await page.locator("[data-testid='conditional-field-meds.medicineName']").isVisible(),
      "The default Meds conditional field should show medicineName.",
    );

    await page.locator("[data-testid='conditional-option-Meds-unknown_or_unsure']").click();
    assertCondition(
      (await page.locator("[data-testid='conditional-field-meds.medicineName']").count()) === 0,
      "medicineName should be hidden after switching Meds to unknown_or_unsure.",
    );
    assertCondition(
      await page.locator("[data-testid='conditional-field-meds.nameUnknownReason']").isVisible(),
      "Unknown reason should appear after switching Meds to unknown_or_unsure.",
    );
    const activePayloadText = await page.locator("[data-testid='active-payload']").innerText();
    const supersededAuditText = await page.locator("[data-testid='superseded-audit']").innerText();
    assertCondition(
      activePayloadText.includes("medicineNameUnknownReason") && !activePayloadText.includes("medicineNameText"),
      "Active payload did not swap to the unknown-reason branch cleanly.",
    );
    assertCondition(
      supersededAuditText.includes("meds.medicineName superseded"),
      "Meds superseded audit did not retain the hidden medicineName answer.",
    );

    await page.locator("[data-testid='request-type-card-Symptoms']").click();
    await page.locator("[data-testid='conditional-option-Symptoms-general']").click();
    assertCondition(
      (await page.locator("[data-testid='conditional-field-symptoms.chestPainLocation']").count()) === 0,
      "Chest-pain location should be hidden when Symptoms changes to general.",
    );
    assertCondition(
      (await page.locator("[data-testid='superseded-audit']").innerText()).includes("safety review"),
      "Safety-relevant superseded audit marker disappeared for Symptoms.",
    );
    assertCondition(
      (await page.locator("#review-note-copy").innerText()).includes("confirmation checkpoint"),
      "Safety review checkpoint copy did not appear after hiding a safety-relevant answer.",
    );

    await page.locator("[data-testid='request-type-card-Symptoms']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      await page.locator("[data-testid='request-type-card-Meds']").getAttribute("data-selected") === "true",
      "ArrowRight did not move request-type selection to Meds.",
    );
    await page.keyboard.press("End");
    assertCondition(
      await page.locator("[data-testid='request-type-card-Results']").getAttribute("data-selected") === "true",
      "End did not move request-type selection to Results.",
    );
    await page.keyboard.press("Home");
    assertCondition(
      await page.locator("[data-testid='request-type-card-Symptoms']").getAttribute("data-selected") === "true",
      "Home did not restore request-type selection to Symptoms.",
    );
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) ===
        "request-type-card-Symptoms",
      "Focus did not remain on the selected request-type card.",
    );

    const treeCount = await page.locator("[data-testid^='tree-node-']").count();
    const treeTableCount = await tableRowCount(page, "tree-parity-table");
    assertCondition(treeCount === treeTableCount, "Tree nodes and tree parity rows drifted out of sync.");

    await page.locator("[data-testid='table-tab-decision']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      await page.locator("[data-testid='table-tab-visibility']").getAttribute("aria-selected") === "true",
      "ArrowRight did not move table-tab selection to visibility.",
    );
    assertCondition(
      (await tableRowCount(page, "visibility-matrix")) === expected.questionCounts.Symptoms,
      "Visibility matrix row count drifted for Symptoms.",
    );
    await page.keyboard.press("ArrowRight");
    assertCondition(
      await page.locator("[data-testid='table-tab-bundle']").getAttribute("aria-selected") === "true",
      "ArrowRight did not move table-tab selection to bundle compatibility.",
    );
    assertCondition(
      (await tableRowCount(page, "bundle-matrix")) === expected.bundleCounts.Symptoms,
      "Bundle compatibility row count drifted for Symptoms.",
    );

    await page.setViewportSize({ width: 900, height: 1200 });
    await page.waitForFunction(() => document.body.dataset.layout === "mission_stack");
    assertCondition(
      (await page.evaluate(() => document.body.dataset.layout)) === "mission_stack",
      "Responsive mission_stack layout did not activate.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 920);
    assertCondition(widthSafe, "mission_stack layout overflowed horizontally.");

    const motionPage = await browser.newPage({ viewport: { width: 1320, height: 980 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body.reduced-motion").count()) === 1,
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid^='request-type-card-']").count()) === expected.requestTypeCount,
        "Reduced-motion rendering changed the request-type card count.",
      );
      const reducedTreeCount = await motionPage.locator("[data-testid^='tree-node-']").count();
      const reducedTreeTableCount = await tableRowCount(motionPage, "tree-parity-table");
      assertCondition(
        reducedTreeCount === reducedTreeTableCount,
        "Reduced-motion rendering broke tree/table parity.",
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
