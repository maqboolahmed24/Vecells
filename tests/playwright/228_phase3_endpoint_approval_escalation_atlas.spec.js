import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const HTML_PATH = path.join(ROOT, "docs", "frontend", "228_phase3_endpoint_approval_escalation_atlas.html");
const ENDPOINT_DECISION_PATH = path.join(ROOT, "data", "contracts", "228_endpoint_decision.schema.json");
const APPROVAL_CHECKPOINT_PATH = path.join(ROOT, "data", "contracts", "228_approval_checkpoint.schema.json");
const APPROVAL_POLICY_MATRIX_PATH = path.join(ROOT, "data", "contracts", "228_approval_policy_matrix.yaml");
const URGENT_ESCALATION_OUTCOME_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "228_urgent_escalation_outcome.schema.json",
);
const PAYLOAD_MATRIX_PATH = path.join(ROOT, "data", "analysis", "228_endpoint_payload_matrix.csv");
const EPOCH_CASES_PATH = path.join(ROOT, "data", "analysis", "228_decision_epoch_supersession_cases.csv");
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "228_approval_and_escalation_gap_log.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const phase3EndpointApprovalEscalationAtlasCoverage = [
  "Endpoint_Approval_Escalation_Atlas",
  "EndpointTaxonomyLattice",
  "DecisionEpochBraid",
  "ApprovalCheckpointLadder",
  "UrgentEscalationLaneSet",
  "EndpointPayloadTable",
  "DecisionEpochCaseTable",
  "ApprovalPolicyTable",
  "UrgentEscalationLaneTable",
  "SchemaParityTable",
  "GapClosureTable",
  "ArtifactRegistryTable",
  "endpoint filter sync",
  "epoch supersession rendering",
  "approval invalidation rendering",
  "escalation lane selection sync",
  "keyboard traversal and landmarks",
  "reduced-motion equivalence",
  "diagram/table parity",
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
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw new Error("This spec requires the `playwright` package when run with --run.");
  }
}

function loadExpected() {
  for (const filePath of [
    HTML_PATH,
    ENDPOINT_DECISION_PATH,
    APPROVAL_CHECKPOINT_PATH,
    APPROVAL_POLICY_MATRIX_PATH,
    URGENT_ESCALATION_OUTCOME_PATH,
    PAYLOAD_MATRIX_PATH,
    EPOCH_CASES_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_228 artifact ${filePath}`);
  }

  return {
    endpointDecision: JSON.parse(fs.readFileSync(ENDPOINT_DECISION_PATH, "utf8")),
    approvalCheckpoint: JSON.parse(fs.readFileSync(APPROVAL_CHECKPOINT_PATH, "utf8")),
    approvalPolicyMatrix: JSON.parse(fs.readFileSync(APPROVAL_POLICY_MATRIX_PATH, "utf8")),
    urgentEscalationOutcome: JSON.parse(fs.readFileSync(URGENT_ESCALATION_OUTCOME_PATH, "utf8")),
    payloadMatrix: parseCsv(fs.readFileSync(PAYLOAD_MATRIX_PATH, "utf8")),
    epochCases: parseCsv(fs.readFileSync(EPOCH_CASES_PATH, "utf8")),
    gapLog: JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8")),
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/228_phase3_endpoint_approval_escalation_atlas.html";
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
        reject(new Error("Unable to bind local seq_228 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/228_phase3_endpoint_approval_escalation_atlas.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openAtlas(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Endpoint_Approval_Escalation_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertMetricsAndParity(page, expected) {
  for (const testId of [
    "EndpointTaxonomyLattice",
    "DecisionEpochBraid",
    "ApprovalCheckpointLadder",
    "UrgentEscalationLaneSet",
    "EndpointPayloadTable",
    "DecisionEpochCaseTable",
    "ApprovalPolicyTable",
    "UrgentEscalationLaneTable",
    "SchemaParityTable",
    "GapClosureTable",
    "ArtifactRegistryTable",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    Number((await page.locator("[data-testid='metric-endpoint-count']").innerText()).trim()) ===
      expected.endpointDecision.$defs.endpointClass.enum.length,
    "Endpoint metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-epoch-case-count']").innerText()).trim()) ===
      expected.epochCases.length,
    "Epoch case metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-approval-rule-count']").innerText()).trim()) ===
      expected.approvalPolicyMatrix.rules.length,
    "Approval rule metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-escalation-lane-count']").innerText()).trim()) ===
      expected.urgentEscalationOutcome.properties.outcomeClass.enum.length,
    "Escalation lane metric drifted.",
  );

  assertCondition(
    (await page.locator("[data-testid^='endpoint-node-']").count()) === expected.payloadMatrix.length,
    "Endpoint lattice count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='approval-state-']").count()) ===
      expected.approvalCheckpoint.properties.state.enum.length,
    "Approval ladder count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='escalation-lane-']").count()) ===
      expected.urgentEscalationOutcome.properties.outcomeClass.enum.length,
    "Escalation lane count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='gap-row-']").count()) === expected.gapLog.gaps.length,
    "Gap table count drifted.",
  );
}

async function assertEndpointFilterSync(page) {
  await page.locator("[data-testid='endpoint-filter-pharmacy_first_candidate']").click();
  assertCondition(
    (await page.locator("[data-testid='endpoint-node-pharmacy_first_candidate']").getAttribute("data-selected")) ===
      "true",
    "Endpoint lattice did not synchronize to the selected filter.",
  );
  assertCondition(
    (await page.locator("[data-testid='endpoint-row-pharmacy_first_candidate'] button").getAttribute("data-selected")) ===
      "true",
    "Endpoint payload table did not synchronize to the selected filter.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Pharmacy First Candidate"),
    "Endpoint selection did not update the inspector banner.",
  );
}

async function assertEpochSupersessionRendering(page) {
  await page.locator("[data-testid='epoch-filter-CASE_POLICY_DRIFT']").click();
  assertCondition(
    (await page.locator("[data-testid='epoch-case-row-CASE_POLICY_DRIFT'] button").getAttribute("data-selected")) ===
      "true",
    "Epoch case table did not synchronize to the selected supersession case.",
  );
  assertCondition(
    (await page.locator("[data-testid='epoch-node-2']").innerText()).includes("policy_drift"),
    "Decision epoch braid did not render the selected supersession reason.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Case Policy Drift"),
    "Epoch case selection did not update the inspector banner.",
  );
}

async function assertApprovalInvalidationRendering(page) {
  await page.locator("[data-testid='epoch-filter-CASE_APPROVAL_INVALIDATION']").click();
  assertCondition(
    (await page.locator("[data-testid='approval-state-superseded']").getAttribute("data-selected")) === "true",
    "Approval ladder did not render the superseded state for approval invalidation.",
  );
  assertCondition(
    (await page.locator("#selection-copy").innerText()).includes(
      "Approval mismatch preserves preview but blocks live consequence.",
    ),
    "Approval invalidation notes did not reach the inspector.",
  );
}

async function assertEscalationLaneSync(page) {
  await page.locator("[data-testid='escalation-filter-downstream_handoff']").click();
  assertCondition(
    (await page.locator("[data-testid='escalation-lane-downstream_handoff']").getAttribute("data-selected")) ===
      "true",
    "Escalation lane set did not synchronize to the selected lane.",
  );
  assertCondition(
    (await page.locator("[data-testid='escalation-row-downstream_handoff'] button").getAttribute("data-selected")) ===
      "true",
    "Escalation lane table did not synchronize to the selected lane.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Downstream Handoff"),
    "Escalation selection did not update the inspector banner.",
  );
}

async function assertKeyboardTraversal(page) {
  const endpointButton = page.locator("[data-testid='endpoint-filter-admin_resolution']");
  await endpointButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Self Care And Safety Net"),
    "Endpoint keyboard traversal did not advance to the next endpoint.",
  );

  const approvalButton = page.locator("[data-testid='approval-rule-row-AP_228_ADMIN_SENSITIVE'] button");
  await approvalButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Self Care Closure"),
    "Approval keyboard traversal did not advance to the next rule.",
  );

  const escalationButton = page.locator("[data-testid='escalation-filter-direct_non_appointment']");
  await escalationButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Downstream Handoff"),
    "Escalation keyboard traversal did not advance to the next lane.",
  );
}

async function assertLandmarks(page) {
  assertCondition((await page.locator("header.masthead").count()) === 1, "Missing masthead landmark.");
  assertCondition((await page.locator("main#atlas-main").count()) === 1, "Missing main landmark.");
  assertCondition((await page.locator("aside[data-testid='FilterRail']").count()) === 1, "Missing filter rail landmark.");
  assertCondition((await page.locator("aside[data-testid='InspectorPanel']").count()) === 1, "Missing inspector landmark.");
  assertCondition((await page.locator("a.skip-link").count()) === 1, "Missing skip link.");
}

async function runSpec() {
  const expected = loadExpected();
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { chromium } = playwright;
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1720 } });
    await openAtlas(page, url);
    await assertMetricsAndParity(page, expected);
    await assertEndpointFilterSync(page);
    await assertEpochSupersessionRendering(page);
    await assertApprovalInvalidationRendering(page);
    await assertEscalationLaneSync(page);
    await assertKeyboardTraversal(page);
    await assertLandmarks(page);
    await screenshot(page, "output/playwright/228-phase3-endpoint-approval-escalation-atlas-default.png");

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 1660 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, url);
    assertCondition(
      (await reducedPage.evaluate(() => document.documentElement.dataset.motion)) === "reduced",
      "Reduced-motion context did not set data-motion=reduced.",
    );
    await screenshot(reducedPage, "output/playwright/228-phase3-endpoint-approval-escalation-atlas-reduced.png");
    await reducedContext.close();
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  runSpec().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
