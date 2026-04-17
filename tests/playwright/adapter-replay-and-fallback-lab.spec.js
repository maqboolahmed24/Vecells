import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "tests", "135_exception_path_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "exception_path_suite_results.json");

const SUITE = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

function serve(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") {
        pathname = "/docs/tests/135_exception_path_lab.html";
      }
      const filePath = path.join(rootDir, pathname);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const body = fs.readFileSync(filePath);
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
      response.end(body);
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind seq_135 exception-path static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/tests/135_exception_path_lab.html`,
      });
    });
  });
}

async function waitForLab(page) {
  for (const testId of [
    "exception-path-lab",
    "case-family-rail",
    "case-list",
    "replay-ladder",
    "replay-step-table",
    "duplicate-cluster-map",
    "duplicate-truth-table",
    "fallback-continuity-ribbon",
    "fallback-truth-table",
    "exception-inspector",
    "case-summary-table",
    "evidence-table",
    "event-table",
    "blocker-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function selectedCaseId(page) {
  return page.evaluate(
    () =>
      document
        .querySelector("[data-testid^='case-button-'][data-active='true']")
        ?.getAttribute("data-case-id") || "",
  );
}

async function panelText(page, testId) {
  return page.locator(`[data-testid='${testId}']`).innerText();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_135 exception path lab HTML is missing.");
  assertCondition(SUITE.task_id === "seq_135", "seq_135 suite payload drifted.");
  assertCondition(
    SUITE.visual_mode === "Exception_Path_Lab",
    "seq_135 visual mode drifted from Exception_Path_Lab.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1540, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForLab(page);

    const caseButtonCount = await page.locator("[data-testid^='case-button-']").count();
    assertCondition(
      caseButtonCount === SUITE.summary.exception_case_count,
      `Exception-case parity drifted: expected ${SUITE.summary.exception_case_count}, found ${caseButtonCount}.`,
    );

    const summaryCases = await page.locator("[data-testid='summary-cases']").innerText();
    const summaryFull = await page.locator("[data-testid='summary-full']").innerText();
    const summaryPartial = await page.locator("[data-testid='summary-partial']").innerText();
    const summaryBlocked = await page.locator("[data-testid='summary-blocked']").innerText();
    assertCondition(
      summaryCases === String(SUITE.summary.exception_case_count),
      "Exception case summary drifted from the suite payload.",
    );
    assertCondition(
      summaryFull === String(SUITE.summary.full_surface_proof_count),
      "Full-surface summary drifted from the suite payload.",
    );
    assertCondition(
      summaryPartial === String(SUITE.summary.partial_surface_proof_count),
      "Partial-surface summary drifted from the suite payload.",
    );
    assertCondition(
      summaryBlocked === String(SUITE.summary.closure_blocked_case_count),
      "Closure-blocked summary drifted from the suite payload.",
    );

    // exact replay settlement reuse
    await page.locator("[data-testid='case-family-filter']").selectOption("exact_submit_replay");
    assertCondition(
      (await page.locator("[data-testid^='case-button-']").count()) === 1,
      "Exact replay filter should expose exactly one case.",
    );
    assertCondition(
      (await selectedCaseId(page)) === "CASE_135_EXACT_SUBMIT_REPLAY",
      "Exact replay filter did not keep the expected case selected.",
    );
    const replaySummary = (await panelText(page, "case-summary-table")).toLowerCase();
    const replayTable = (await panelText(page, "replay-step-table")).toLowerCase();
    const replayFallback = (await panelText(page, "fallback-truth-table")).toLowerCase();
    assertCondition(
      replaySummary.includes("decision class") &&
        replaySummary.includes("exact_replay") &&
        replaySummary.includes("duplicate request delta") &&
        replaySummary.includes("0") &&
        replaySummary.includes("duplicate side-effect delta"),
      "Exact replay settlement reuse lost the zero-delta summary rows.",
    );
    assertCondition(
      replayTable.includes("settlement_067_browser_primary") &&
        replayTable.includes("exact_replay_returned"),
      "Exact replay settlement reuse lost the returned settlement ladder step.",
    );
    assertCondition(
      replayFallback.includes("closure blocked") && replayFallback.includes("no"),
      "Exact replay settlement reuse should stay closure-unblocked.",
    );

    // duplicate review blocker visibility
    await page
      .locator("[data-testid='case-family-filter']")
      .selectOption("review_required_duplicate_cluster");
    assertCondition(
      (await page.locator("[data-testid^='case-button-']").count()) === 1,
      "Review-required duplicate filter should expose exactly one case.",
    );
    const duplicateSummary = (await panelText(page, "case-summary-table")).toLowerCase();
    const duplicateTable = (await panelText(page, "duplicate-truth-table")).toLowerCase();
    const duplicateBlockers = (await panelText(page, "blocker-table")).toLowerCase();
    assertCondition(
      duplicateSummary.includes("review status") &&
        duplicateSummary.includes("in_review") &&
        duplicateSummary.includes("auto-merge") &&
        duplicateSummary.includes("forbidden"),
      "Duplicate review blocker visibility lost explicit in-review or auto-merge-forbidden truth.",
    );
    assertCondition(
      duplicateTable.includes("dcl_070_same_episode") &&
        duplicateTable.includes("candidate_margin_too_low"),
      "Duplicate review blocker visibility lost the cluster map truth rows.",
    );
    assertCondition(
      duplicateBlockers.includes("command_api_duplicate_review_duplicate_cluster_0006") &&
        duplicateBlockers.includes("closure blocked") &&
        duplicateBlockers.includes("yes"),
      "Duplicate review blocker visibility lost the closure-blocker inspector rows.",
    );

    // fallback degraded continuity
    await page.locator("[data-testid='case-family-filter']").selectOption("quarantine_opens_fallback_review");
    await page
      .locator("[data-testid='case-button-case-135-quarantine-fallback-continuity']")
      .click();
    const fallbackSummary = (await panelText(page, "case-summary-table")).toLowerCase();
    const fallbackTruth = (await panelText(page, "fallback-truth-table")).toLowerCase();
    const fallbackBlockers = (await panelText(page, "blocker-table")).toLowerCase();
    assertCondition(
      fallbackSummary.includes("patient-visible state") &&
        fallbackSummary.includes("submitted_degraded"),
      "Fallback degraded continuity lost the degraded patient-visible state.",
    );
    assertCondition(
      fallbackTruth.includes("manual owner queue") &&
        fallbackTruth.includes("manual_exception_review") &&
        fallbackTruth.includes("governed recovery family") &&
        fallbackTruth.includes("accepted_progress"),
      "Fallback degraded continuity lost the governed recovery and owner queue detail.",
    );
    assertCondition(
      fallbackBlockers.includes("fallback_case_restore_review_001") &&
        fallbackBlockers.includes("closure blocked") &&
        fallbackBlockers.includes("yes"),
      "Fallback degraded continuity lost the explicit blocker chain.",
    );

    // unsupported scanner runtime gap
    await page.locator("[data-testid='case-family-filter']").selectOption("fallback_review_stays_explicit");
    await page
      .locator("[data-testid='case-button-case-135-unsupported-scanner-runtime-gap']")
      .click();
    const gapSummary = (await panelText(page, "case-summary-table")).toLowerCase();
    const gapReplay = (await panelText(page, "replay-step-table")).toLowerCase();
    const gapBlockers = (await panelText(page, "blocker-table")).toLowerCase();
    assertCondition(
      gapSummary.includes("validation state") &&
        gapSummary.includes("blocked") &&
        gapSummary.includes("runtime coverage") &&
        gapSummary.includes("missing_runtime"),
      "Unsupported scanner runtime gap lost blocked missing-runtime truth.",
    );
    assertCondition(
      gapReplay.includes("fallbackreviewcase with same-lineage degraded receipt") &&
        gapReplay.includes("gap_missing_simulator_runtime_adp_malware_artifact_scanning_v1"),
      "Unsupported scanner runtime gap lost the explicit fallback strategy or gap ref.",
    );
    assertCondition(
      gapBlockers.includes("gap_missing_simulator_runtime_adp_malware_artifact_scanning_v1") &&
        gapBlockers.includes("closure blocked") &&
        gapBlockers.includes("yes"),
      "Unsupported scanner runtime gap lost the blocked gap inspector row.",
    );

    await page.locator("[data-testid='case-family-filter']").selectOption("all");
    await page.locator("[data-testid='proof-filter']").selectOption("all");
    const firstCase = page.locator("[data-testid='case-button-case-135-exact-submit-replay']");
    await firstCase.focus();
    await page.keyboard.press("ArrowDown");
    const focusedCaseId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-case-id") || "",
    );
    assertCondition(
      focusedCaseId === "CASE_135_SEMANTIC_REPLAY_RETURN",
      "ArrowDown did not move focus to the next exception case.",
    );
    await page.keyboard.press("Enter");
    assertCondition(
      (await selectedCaseId(page)) === "CASE_135_SEMANTIC_REPLAY_RETURN",
      "Enter did not activate the focused exception case after ArrowDown traversal.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='exception-inspector']").isVisible();
    assertCondition(inspectorVisible, "Exception inspector disappeared at mobile width.");
    const responsiveWidth = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 2,
    );
    assertCondition(responsiveWidth, "Exception path lab overflowed the mobile viewport.");

    const reducedPage = await browser.newPage({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
    });
    try {
      await reducedPage.goto(url, { waitUntil: "networkidle" });
      await waitForLab(reducedPage);
      const reducedMotionMatches = await reducedPage.evaluate(() =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
      assertCondition(reducedMotionMatches, "Reduced-motion media query did not activate.");
    } finally {
      await reducedPage.close();
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
