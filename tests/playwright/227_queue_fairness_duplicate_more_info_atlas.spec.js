import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const HTML_PATH = path.join(ROOT, "docs", "frontend", "227_queue_fairness_duplicate_more_info_atlas.html");
const REGISTRY_PATH = path.join(ROOT, "data", "contracts", "227_queue_constants_and_threshold_registry.yaml");
const QUEUE_MATRIX_PATH = path.join(ROOT, "data", "analysis", "227_queue_sort_and_fairness_matrix.csv");
const CHECKPOINT_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "227_more_info_checkpoint_and_disposition_cases.csv",
);
const DUPLICATE_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "227_duplicate_authority_and_relation_cases.json",
);
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "227_phase3_queue_more_info_gap_log.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const phase3QueueMoreInfoAtlasCoverage = [
  "Queue_Fairness_Duplicate_MoreInfo_Atlas",
  "QueueOrderLadder",
  "FairnessBandMergeDiagram",
  "DuplicateAuthorityBraid",
  "MoreInfoCheckpointLadder",
  "FormulaRegistryTable",
  "ThresholdRegistryTable",
  "QueueCaseParityTable",
  "DuplicateCaseTable",
  "CheckpointCaseTable",
  "filter synchronization",
  "queue-order and threshold selection sync",
  "overload rendering",
  "duplicate-authority selection sync",
  "checkpoint/disposition parity",
  "keyboard traversal and landmarks",
  "reduced-motion equivalence",
  "diagram-to-table parity",
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
    REGISTRY_PATH,
    QUEUE_MATRIX_PATH,
    CHECKPOINT_CASES_PATH,
    DUPLICATE_CASES_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_227 artifact ${filePath}`);
  }

  return {
    registry: JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")),
    queueMatrix: parseCsv(fs.readFileSync(QUEUE_MATRIX_PATH, "utf8")),
    checkpointCases: parseCsv(fs.readFileSync(CHECKPOINT_CASES_PATH, "utf8")),
    duplicateCases: JSON.parse(fs.readFileSync(DUPLICATE_CASES_PATH, "utf8")),
    gapLog: JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8")),
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/227_queue_fairness_duplicate_more_info_atlas.html";
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
        reject(new Error("Unable to bind local seq_227 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/227_queue_fairness_duplicate_more_info_atlas.html`,
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
  await page.locator("[data-testid='Queue_Fairness_Duplicate_MoreInfo_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertMetricsAndParity(page, expected) {
  for (const testId of [
    "QueueOrderLadder",
    "FairnessBandMergeDiagram",
    "DuplicateAuthorityBraid",
    "MoreInfoCheckpointLadder",
    "FormulaRegistryTable",
    "ThresholdRegistryTable",
    "QueueCaseParityTable",
    "DuplicateCaseTable",
    "CheckpointCaseTable",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    Number((await page.locator("[data-testid='metric-sort-tier']").innerText()).trim()) ===
      expected.registry.queueRankPlan.sortOrder.length,
    "Sort tier metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-fairness-band']").innerText()).trim()) ===
      expected.registry.queueRankPlan.fairnessMergePolicy.bands.length,
    "Fairness band metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-duplicate-case']").innerText()).trim()) ===
      expected.duplicateCases.cases.length,
    "Duplicate case metric drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='metric-checkpoint-case']").innerText()).trim()) ===
      expected.checkpointCases.length,
    "Checkpoint case metric drifted.",
  );

  assertCondition(
    (await page.locator("[data-testid^='sort-tier-']").count()) === expected.registry.queueRankPlan.sortOrder.length,
    "Queue order ladder count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='fairness-band-']").count()) ===
      expected.registry.queueRankPlan.fairnessMergePolicy.bands.length,
    "Fairness band card count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='authority-card-']").count()) ===
      expected.duplicateCases.authoritySeparation.length,
    "Duplicate authority braid count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid^='checkpoint-state-']").count()) === 7,
    "Checkpoint ladder count drifted.",
  );
}

async function assertQueueThresholdAndOverloadSync(page) {
  await page.locator("[data-testid='queue-filter-CASE_DUPLICATE_REVIEW_PROMOTED_WITHIN_TIER']").click();
  assertCondition(
    (await page.locator("[data-testid='sort-tier-5']").getAttribute("data-selected")) === "true",
    "Duplicate-review queue scenario did not select tier 5.",
  );
  assertCondition(
    (await page.locator("[data-testid='queue-case-row-CASE_DUPLICATE_REVIEW_PROMOTED_WITHIN_TIER'] button").getAttribute("data-selected")) ===
      "true",
    "Queue case table did not synchronize to the selected queue scenario.",
  );

  await page.locator("[data-testid='threshold-row-rho_guard'] button").click();
  assertCondition(
    (await page.locator("#selection-title").innerText()).includes("Threshold row"),
    "Threshold selection did not update the inspector title.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Critical overload guard"),
    "Threshold selection did not update the banner title.",
  );

  await page.locator("[data-testid='overload-filter-overload_critical']").click();
  await page.locator("[data-testid='overload-notice']").waitFor();
  assertCondition(
    (await page.locator("[data-testid='queue-filter-CASE_OVERLOAD_SUPPRESSES_PROMISES']").getAttribute("data-selected")) ===
      "true",
    "Overload filter did not synchronize the selected queue scenario.",
  );
  assertCondition(
    (await page.locator("[data-testid='queue-case-row-CASE_OVERLOAD_SUPPRESSES_PROMISES']").count()) === 1,
    "Overload filter did not constrain the queue case table to overload rows.",
  );
}

async function assertDuplicateSync(page) {
  await page.locator("[data-testid='duplicate-filter-same_episode_candidate_high_similarity']").click();
  assertCondition(
    (await page.locator("[data-testid='authority-card-DuplicateCluster']").getAttribute("data-selected")) ===
      "true",
    "Duplicate filter did not synchronize the authority braid.",
  );
  assertCondition(
    (await page.locator("[data-testid='duplicate-case-row-same_episode_candidate_high_similarity'] button").getAttribute("data-selected")) ===
      "true",
    "Duplicate case table did not synchronize to the selected case.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Same Episode Candidate High Similarity"),
    "Duplicate selection did not update the inspector banner.",
  );
}

async function assertCheckpointSync(page) {
  await page.locator("[data-testid='checkpoint-filter-CASE_BLOCKED_REPAIR']").click();
  assertCondition(
    (await page.locator("[data-testid='checkpoint-state-blocked_repair']").getAttribute("data-selected")) ===
      "true",
    "Checkpoint filter did not synchronize the checkpoint ladder.",
  );
  assertCondition(
    (await page.locator("[data-testid='checkpoint-case-row-CASE_BLOCKED_REPAIR'] button").getAttribute("data-selected")) ===
      "true",
    "Checkpoint case table did not synchronize to the selected case.",
  );
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Case Blocked Repair"),
    "Checkpoint selection did not update the inspector banner.",
  );
}

async function assertKeyboardTraversal(page) {
  const formulaButton = page.locator("[data-testid='formula-row-within_tier_urgency'] button");
  await formulaButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Fairness service cost"),
    "Formula keyboard traversal did not advance to the next formula.",
  );

  const thresholdButton = page.locator("[data-testid='threshold-row-theta_sla_critical_minutes'] button");
  await thresholdButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Warn SLA threshold"),
    "Threshold keyboard traversal did not advance to the next threshold.",
  );

  const duplicateButton = page.locator("[data-testid='duplicate-filter-exact_retry_collapse']");
  await duplicateButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Same Request Continuation With Witness"),
    "Duplicate keyboard traversal did not advance to the next duplicate case.",
  );

  const checkpointButton = page.locator("[data-testid='checkpoint-filter-CASE_ACTIVE_REPLY_OPEN']");
  await checkpointButton.focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page.locator("#selection-banner-title").innerText()).includes("Case Reminder Due Accepted"),
    "Checkpoint keyboard traversal did not advance to the next checkpoint case.",
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
    const page = await browser.newPage({ viewport: { width: 1520, height: 1680 } });
    await openAtlas(page, url);
    await assertMetricsAndParity(page, expected);
    await assertQueueThresholdAndOverloadSync(page);
    await assertDuplicateSync(page);
    await assertCheckpointSync(page);
    await assertKeyboardTraversal(page);
    await assertLandmarks(page);
    await screenshot(page, "output/playwright/227-queue-fairness-duplicate-more-info-atlas-default.png");

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 1600 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, url);
    assertCondition(
      (await reducedPage.evaluate(() => document.documentElement.dataset.motion)) === "reduced",
      "Reduced-motion context did not set data-motion=reduced.",
    );
    await screenshot(reducedPage, "output/playwright/227-queue-fairness-duplicate-more-info-atlas-reduced.png");
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
