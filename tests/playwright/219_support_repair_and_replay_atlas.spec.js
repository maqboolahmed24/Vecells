import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const ATLAS_PATH = path.join(ROOT, "docs", "frontend", "219_support_repair_and_replay_atlas.html");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "219_support_repair_and_replay_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "219_repair_attempt_idempotency_matrix.csv",
);
const REPLAY_CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "219_replay_boundary_and_restore_cases.json",
);
const PROVIDER_HYGIENE_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "219_provider_metadata_and_webhook_hygiene.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const supportReplayControlAtlasCoverage = [
  "Support_Replay_Control_Atlas",
  "RepairLifecycleBoard",
  "IdempotencyDuplicateBoard",
  "TimelineSettlementAlignmentBoard",
  "ReplayCheckpointBoundaryBoard",
  "DeltaReviewBoard",
  "RestoreFallbackBoard",
  "ProviderCallbackHygieneBoard",
  "MetadataHygieneBoard",
  "SupportOmnichannelTimelineProjection",
  "SupportMutationAttempt",
  "SupportActionRecord",
  "SupportActionSettlement",
  "CommunicationReplayRecord",
  "SupportReplayCheckpoint",
  "SupportReplayEvidenceBoundary",
  "SupportReplayDeltaReview",
  "SupportReplayReleaseDecision",
  "SupportReplayRestoreSettlement",
  "SupportRouteIntentToken",
  "SupportContinuityEvidenceProjection",
  "SupportReadOnlyFallbackProjection",
  "SupportActionWorkbenchProjection",
  "SupportReachabilityPostureProjection",
  "SupportRepairChainView",
  "MessageDispatchEnvelope",
  "MessageDeliveryEvidenceBundle",
  "ThreadExpectationEnvelope",
  "ThreadResolutionGate",
  "AdapterReceiptCheckpoint",
  "ProviderSafeMetadataBundle",
  "ARIA snapshots",
  "keyboard tablist",
  "mobile viewport",
  "reduced motion",
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
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
    ATLAS_PATH,
    CONTRACT_PATH,
    MATRIX_PATH,
    REPLAY_CASES_PATH,
    PROVIDER_HYGIENE_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing task 219 artifact ${filePath}`);
  }
  const html = fs.readFileSync(ATLAS_PATH, "utf8");
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const replayCases = JSON.parse(fs.readFileSync(REPLAY_CASES_PATH, "utf8"));
  const provider = JSON.parse(fs.readFileSync(PROVIDER_HYGIENE_PATH, "utf8"));
  assertCondition(html.includes("window.__supportReplayControlAtlasData"), "Atlas data missing.");
  assertCondition(contract.visualMode === "Support_Replay_Control_Atlas", "Contract mode drifted.");
  assertCondition(matrix.length >= 12, "Idempotency matrix needs critical rows.");
  assertCondition(replayCases.cases.length >= 6, "Replay cases incomplete.");
  assertCondition(provider.providers.length >= 2, "Provider hygiene cases incomplete.");
  for (const marker of [
    "SupportOmnichannelTimelineProjection",
    "SupportMutationAttempt",
    "SupportActionRecord",
    "SupportActionSettlement",
    "CommunicationReplayRecord",
    "SupportReplayCheckpoint",
    "SupportReplayEvidenceBoundary",
    "SupportReplayDeltaReview",
    "SupportReplayReleaseDecision",
    "SupportReplayRestoreSettlement",
    "SupportRouteIntentToken",
    "SupportContinuityEvidenceProjection",
    "SupportReadOnlyFallbackProjection",
  ]) {
    assertCondition(html.includes(marker), `Atlas missing ${marker}`);
    assertCondition(JSON.stringify(contract).includes(marker), `Contract missing ${marker}`);
  }
  return { contract, matrix, replayCases, provider };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/219_support_repair_and_replay_atlas.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local task 219 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/219_support_repair_and_replay_atlas.html`,
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
  await page.locator("[data-testid='Support_Replay_Control_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function selectBoard(page, boardId) {
  await page.locator(`[data-scenario-button='${boardId}']`).click();
  await page.waitForFunction((id) => document.documentElement.dataset.scenario === id, boardId);
}

async function assertBoards(page) {
  const boardPairs = [
    ["repair", "RepairLifecycleBoard"],
    ["idempotency", "IdempotencyDuplicateBoard"],
    ["timeline", "TimelineSettlementAlignmentBoard"],
    ["boundary", "ReplayCheckpointBoundaryBoard"],
    ["delta", "DeltaReviewBoard"],
    ["restore", "RestoreFallbackBoard"],
    ["callback", "ProviderCallbackHygieneBoard"],
    ["metadata", "MetadataHygieneBoard"],
  ];
  for (const [boardId, testId] of boardPairs) {
    await selectBoard(page, boardId);
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) === 1,
      `Missing ${testId}`,
    );
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).isVisible()) === true,
      `${testId} is not visible`,
    );
  }
}

async function assertScreenshots(page) {
  const shots = [
    ["repair", "output/playwright/219-atlas-repair-lifecycle.png"],
    ["idempotency", "output/playwright/219-atlas-idempotency.png"],
    ["timeline", "output/playwright/219-atlas-timeline-settlement.png"],
    ["boundary", "output/playwright/219-atlas-replay-boundary.png"],
    ["delta", "output/playwright/219-atlas-delta-review.png"],
    ["restore", "output/playwright/219-atlas-restore-fallback.png"],
    ["callback", "output/playwright/219-atlas-provider-callback.png"],
    ["metadata", "output/playwright/219-atlas-metadata-hygiene.png"],
  ];
  for (const [boardId, outputPath] of shots) {
    await selectBoard(page, boardId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
  await selectBoard(page, "repair");
  await screenshot(page, "output/playwright/219-atlas.png");
}

async function assertAriaSnapshots(page) {
  await selectBoard(page, "repair");
  const repair = await page.locator("[data-testid='RepairLifecycleBoard']").ariaSnapshot();
  for (const token of [
    "SupportRepairChainAssembler",
    "SupportMutationAttempt",
    "SupportActionSettlement",
  ]) {
    assertCondition(repair.includes(token), `Repair ARIA missing ${token}`);
  }

  await selectBoard(page, "boundary");
  const boundary = await page
    .locator("[data-testid='ReplayCheckpointBoundaryBoard']")
    .ariaSnapshot();
  for (const token of ["SupportReplayCheckpoint", "SupportReplayEvidenceBoundary", "Drafts"]) {
    assertCondition(boundary.includes(token), `Boundary ARIA missing ${token}`);
  }

  await selectBoard(page, "metadata");
  const metadata = await page.locator("[data-testid='MetadataHygieneBoard']").ariaSnapshot();
  for (const token of ["ProviderSafeMetadataBundle", "SendGrid", "PHI"]) {
    assertCondition(metadata.includes(token), `Metadata ARIA missing ${token}`);
  }
}

async function assertResponsive(page) {
  await page.setViewportSize({ width: 390, height: 900 });
  await selectBoard(page, "restore");
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/219-atlas-mobile.png");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1180, height: 820 });
  await selectBoard(page, "callback");
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/219-atlas-reduced-motion.png");
}

async function run() {
  getExpected();
  const { chromium } = await importPlaywright();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const serverHandle = await serve(ROOT);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
    await openAtlas(page, serverHandle.url);
    await assertNoOverflow(page);
    await assertBoards(page);
    await assertAriaSnapshots(page);
    await assertScreenshots(page);
    await assertResponsive(page);
  } finally {
    await browser.close();
    await closeServer(serverHandle.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  getExpected();
}
