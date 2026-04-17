import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "172_patient_linkage_confidence_board.html");
const EXAMPLES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "172_candidate_competition_examples.json",
);
const THRESHOLDS_PATH = path.join(ROOT, "data", "analysis", "172_link_threshold_matrix.csv");
const CONTACT_RULES_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "172_contact_claim_and_preference_separation_rules.json",
);
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "172_patient_link_gap_log.json");

export const phase2PatientLinkageCoverage = [
  "candidate and threshold filter synchronization",
  "row and diagram selection sync",
  "ambiguous/out-of-domain rendering",
  "patient-state atlas parity",
  "keyboard traversal and landmarks",
  "reducedMotion equivalence",
  "diagram/table parity",
  "Patient_Linkage_Confidence_Board",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
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

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function getExpected() {
  for (const filePath of [
    HTML_PATH,
    EXAMPLES_PATH,
    THRESHOLDS_PATH,
    CONTACT_RULES_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_172 artifact ${filePath}`);
  }
  const payload = JSON.parse(fs.readFileSync(EXAMPLES_PATH, "utf8"));
  const thresholds = parseCsv(fs.readFileSync(THRESHOLDS_PATH, "utf8"));
  const rules = JSON.parse(fs.readFileSync(CONTACT_RULES_PATH, "utf8"));
  const gaps = JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8"));
  const ambiguous = payload.examples.find((row) => row.linkState === "ambiguous");
  const outOfDomain = payload.examples.find((row) => row.confidenceModelState === "out_of_domain");
  const verified = payload.examples.find((row) => row.linkState === "verified_patient");
  assertCondition(ambiguous, "Missing ambiguous candidate example.");
  assertCondition(outOfDomain, "Missing out-of-domain candidate example.");
  assertCondition(verified, "Missing verified candidate example.");
  return {
    examples: payload.examples,
    states: payload.patientStateRegistry,
    thresholds,
    rules,
    gaps,
    ambiguous,
    outOfDomain,
    verified,
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/172_patient_linkage_confidence_board.html";
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
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local seq_172 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/172_patient_linkage_confidence_board.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openBoard(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Patient_Linkage_Confidence_Board']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardShell(page, expected) {
  for (const testId of [
    "Patient_Linkage_Confidence_Board",
    "board-masthead",
    "identity_constellation_mark",
    "state-rail",
    "route-filter",
    "link-state-filter",
    "model-state-filter",
    "candidate-confidence-ridge",
    "candidate-confidence-table",
    "subject-proof-braid",
    "subject-proof-table",
    "threshold-ladder",
    "threshold-table",
    "patient-state-atlas",
    "patient-state-table",
    "copy-state-registry",
    "parity-table",
    "inspector",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor({ state: "attached" });
  }
  assertCondition(
    Number((await page.locator("[data-testid='visible-candidate-count']").innerText()).trim()) ===
      expected.examples.length,
    "Visible candidate count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='threshold-family-count']").innerText()).trim()) ===
      expected.thresholds.length,
    "Threshold family count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-state-table'] tbody tr").count()) ===
      expected.states.length,
    "Patient state table lost parity with state registry.",
  );
}

async function assertFilterSynchronization(page, expected) {
  await page.locator("[data-testid='route-filter']").selectOption("authenticated_request_status");
  const expectedCount = expected.examples.filter(
    (row) => row.routeSensitivityFamily === "authenticated_request_status",
  ).length;
  assertCondition(
    (await page.locator("[data-testid='candidate-confidence-table'] tbody tr").count()) ===
      expectedCount,
    "Route filter did not narrow candidate rows.",
  );
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("authenticated_request_status"),
    "Route filter did not sync inspector.",
  );

  await page.locator("[data-testid='link-state-filter']").selectOption("ambiguous");
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(inspectorText.includes("ambiguous"), "Link-state filter did not sync inspector.");

  await page.locator("[data-testid='route-filter']").selectOption("all");
  await page.locator("[data-testid='link-state-filter']").selectOption("all");
  await page.locator("[data-testid='model-state-filter']").selectOption("out_of_domain");
  assertCondition(
    (await page.locator("[data-testid='candidate-confidence-table'] tbody tr").count()) ===
      expected.examples.filter((row) => row.confidenceModelState === "out_of_domain").length,
    "Model-state filter did not narrow candidate rows.",
  );
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("out_of_domain"),
    "Model-state filter did not expose out-of-domain posture.",
  );

  await page.locator("[data-testid='model-state-filter']").selectOption("all");
}

async function assertSelectionSync(page, expected) {
  await page.locator(`[data-testid='candidate-node-${expected.ambiguous.exampleId}']`).click();
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(expected.ambiguous.exampleId),
    "Node selection did not sync id.",
  );
  assertCondition(inspectorText.includes("ambiguous"), "Ambiguous node did not sync link state.");
  assertCondition(
    inspectorText.includes("submit_candidate_refresh"),
    "Ambiguous node did not expose authority intent.",
  );

  await page.locator(`[data-testid='candidate-row-${expected.outOfDomain.exampleId}']`).focus();
  await page.keyboard.press("Enter");
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes("out_of_domain"),
    "Keyboard row selection did not sync out-of-domain model state.",
  );
  assertCondition(
    inspectorText.includes("submit_repair_signal"),
    "Out-of-domain row did not fail closed to repair signal.",
  );
}

async function assertPatientStateAtlasParity(page, expected) {
  for (const state of expected.states) {
    await page.locator(`[data-testid='patient-state-card-${state.state}']`).waitFor();
  }
  const tableText = await page.locator("[data-testid='patient-state-table']").innerText();
  const registryText = await page.locator("[data-testid='copy-state-registry']").innerText();
  for (const state of expected.states) {
    assertCondition(tableText.includes(state.state), `${state.state} missing from state table.`);
    assertCondition(
      registryText.includes(state.copyKey),
      `${state.copyKey} missing from registry.`,
    );
  }
}

async function assertKeyboardAndLandmarks(page) {
  const firstNode = page.locator("[data-testid='candidate-confidence-ridge'] button").first();
  await firstNode.focus();
  const firstExample = await firstNode.getAttribute("data-example-id");
  await page.keyboard.press("ArrowRight");
  const activeAfterArrow = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-example-id"),
  );
  assertCondition(
    activeAfterArrow && activeAfterArrow !== firstExample,
    "Arrow-key traversal did not move between candidate nodes.",
  );
  await page.keyboard.press("Enter");
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(activeAfterArrow),
    "Keyboard activation did not sync selected candidate node.",
  );
  await page.locator("#link-main").focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.id)) === "link-main",
    "Main landmark did not accept focus.",
  );
}

async function assertDiagramTableParity(page) {
  const parityText = await page.locator("[data-testid='parity-table']").innerText();
  for (const [visual, table] of [
    ["candidate-confidence-ridge", "candidate-confidence-table"],
    ["subject-proof-braid", "subject-proof-table"],
    ["threshold-ladder", "threshold-table"],
    ["patient-state-atlas", "patient-state-table"],
  ]) {
    assertCondition(parityText.includes(visual), `${visual} missing from parity table.`);
    assertCondition(parityText.includes(table), `${table} missing from parity table.`);
  }
}

async function assertReducedMotion(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openBoard(page, url);
    await assertDiagramTableParity(page);
    const duration = await page
      .locator(".ridge-fill")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `Reduced motion did not collapse ridge transition: ${duration}`,
    );
  } finally {
    await context.close();
  }
}

export async function run() {
  const expected = getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openBoard(page, url);
    await assertNoOverflow(page);
    await assertBoardShell(page, expected);
    await assertFilterSynchronization(page, expected);
    await assertSelectionSync(page, expected);
    await assertPatientStateAtlasParity(page, expected);
    await assertKeyboardAndLandmarks(page);
    await assertDiagramTableParity(page);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openBoard(mobile, url);
    await assertNoOverflow(mobile);
    await mobile.close();

    await assertReducedMotion(browser, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("172_patient_linkage_confidence_board.spec.js: syntax ok");
}
