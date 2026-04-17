import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "tests", "134_continuity_gate_lab.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "continuity_gate_suite_results.json");

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
        pathname = "/docs/tests/134_continuity_gate_lab.html";
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
        reject(new Error("Unable to bind seq_134 continuity gate static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/tests/134_continuity_gate_lab.html`,
      });
    });
  });
}

async function waitForLab(page) {
  for (const testId of [
    "continuity-gate-lab",
    "case-family-filter",
    "browser-filter",
    "case-list",
    "route-intent-lattice",
    "route-lattice-table",
    "freshness-ladder",
    "freshness-table",
    "mutation-braid",
    "mutation-table",
    "case-table",
    "shell-snapshot-tabs",
    "shell-snapshot-panel",
    "continuity-inspector",
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

async function selectedTab(page) {
  return page.evaluate(
    () =>
      document
        .querySelector("[data-testid^='snapshot-tab-'][data-active='true']")
        ?.getAttribute("data-tab") || "",
  );
}

async function panelText(page, testId) {
  return page.locator(`[data-testid='${testId}']`).innerText();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_134 continuity gate lab HTML is missing.");
  assertCondition(SUITE.task_id === "seq_134", "seq_134 suite payload drifted.");
  assertCondition(
    SUITE.visual_mode === "Continuity_Gate_Lab",
    "seq_134 visual mode drifted from Continuity_Gate_Lab.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForLab(page);

    const caseButtonCount = await page.locator("[data-testid^='case-button-']").count();
    assertCondition(
      caseButtonCount === SUITE.summary.continuity_scenario_count,
      `Scenario parity drifted: expected ${SUITE.summary.continuity_scenario_count}, found ${caseButtonCount}.`,
    );

    const summaryScenarios = await page.locator("[data-testid='summary-scenarios']").innerText();
    const summaryBrowser = await page.locator("[data-testid='summary-browser']").innerText();
    const summaryGaps = await page.locator("[data-testid='summary-gaps']").innerText();
    const summaryLiveNotFresh = await page
      .locator("[data-testid='summary-live-not-fresh']")
      .innerText();
    assertCondition(
      summaryScenarios === String(SUITE.summary.continuity_scenario_count),
      "Scenario summary drifted from the suite payload.",
    );
    assertCondition(
      summaryBrowser === String(SUITE.summary.browser_available_count),
      "Browser summary drifted from the suite payload.",
    );
    assertCondition(
      summaryGaps === String(SUITE.summary.browser_gap_count),
      "Browser gap summary drifted from the suite payload.",
    );
    assertCondition(
      summaryLiveNotFresh === String(SUITE.summary.transport_live_but_non_live_actionability_count),
      "Live-not-fresh summary drifted from the suite payload.",
    );

    // selected-anchor preservation
    await page.locator("[data-testid='case-family-filter']").selectOption(
      "same_shell_recovery_preserves_selected_anchor",
    );
    const selectedAnchorCases = await page.locator("[data-testid^='case-button-']").count();
    assertCondition(
      selectedAnchorCases === 1,
      `Selected-anchor preservation filter expected 1 case, found ${selectedAnchorCases}.`,
    );
    const selectedAnchorDetail = await panelText(page, "selected-anchor-detail");
    const nextSafeAction = await panelText(page, "next-safe-action");
    assertCondition(
      selectedAnchorDetail.includes("queue-evidence") && selectedAnchorDetail.includes("freeze"),
      "Selected-anchor preservation lost the queue-evidence recovery anchor.",
    );
    assertCondition(
      nextSafeAction.includes("Restore the draft"),
      "Selected-anchor preservation lost the explicit next safe action.",
    );
    await page.locator("[data-testid='snapshot-tab-recovery']").click();
    const recoverySnapshot = await panelText(page, "shell-snapshot-panel");
    assertCondition(
      recoverySnapshot.includes("downgrade_recovery_only") &&
        recoverySnapshot.includes("Same-shell recovery keeps the active header"),
      "Recovery snapshot lost same-shell anchor preservation detail.",
    );

    // live-vs-fresh distinction
    await page.locator("[data-testid='case-family-filter']").selectOption(
      "transport_live_but_freshness_not_authoritative",
    );
    const liveNotFreshCases = await page.locator("[data-testid^='case-button-']").count();
    assertCondition(
      liveNotFreshCases === 1,
      `Live-vs-fresh distinction filter expected 1 case, found ${liveNotFreshCases}.`,
    );
    const freshnessTable = await panelText(page, "freshness-table");
    const mutationTable = await panelText(page, "mutation-table");
    assertCondition(
      freshnessTable.includes("Transport state") &&
        freshnessTable.includes("live") &&
        freshnessTable.includes("Projection freshness") &&
        freshnessTable.includes("stale_review") &&
        freshnessTable.includes("Shell posture") &&
        freshnessTable.includes("recovery_only") &&
        freshnessTable.includes("Transport live insufficient") &&
        freshnessTable.includes("yes"),
      "Live-vs-fresh distinction no longer proves live transport is insufficient.",
    );
    assertCondition(
      mutationTable.includes("Acting scope tuple") &&
        mutationTable.includes("Runtime binding") &&
        mutationTable.includes("Release binding"),
      "Live-vs-fresh distinction lost the mutation tuple table.",
    );

    // blocked/widened mutation behavior
    await page.locator("[data-testid='case-family-filter']").selectOption(
      "acting_scope_or_break_glass_drift",
    );
    const scopeDriftCases = await page.locator("[data-testid^='case-button-']").count();
    assertCondition(
      scopeDriftCases === 1,
      `Blocked/widened mutation behavior filter expected 1 case, found ${scopeDriftCases}.`,
    );
    const scopeInspector = await panelText(page, "continuity-inspector");
    const scopeTable = await panelText(page, "case-table");
    assertCondition(
      scopeInspector.includes("hub-settlement") &&
        scopeInspector.includes("Re-issue the hub scope tuple"),
      "Blocked/widened mutation behavior lost the hub scope recovery cue.",
    );
    assertCondition(
      scopeTable.includes("recovery-only") && scopeTable.includes("blocked"),
      "Blocked/widened mutation behavior lost the widened route vs blocked mutation split.",
    );

    await page.locator("[data-testid='case-family-filter']").selectOption("all");
    await page.locator("[data-testid='browser-filter']").selectOption("gap");
    const gapCases = await page.locator("[data-testid^='case-button-']").count();
    assertCondition(
      gapCases === SUITE.summary.browser_gap_count,
      `Browser gap filter expected ${SUITE.summary.browser_gap_count} rows, found ${gapCases}.`,
    );
    const gapInspector = await panelText(page, "continuity-inspector");
    assertCondition(
      gapInspector.includes("GAP_BROWSER_SPECIMEN_RF_SUPPORT_TICKET_WORKSPACE") ||
        gapInspector.includes("GAP_BROWSER_SPECIMEN_RF_INTAKE_TELEPHONY_CAPTURE"),
      "Browser gap filtering lost the explicit gap references.",
    );

    await page.locator("[data-testid='browser-filter']").selectOption("all");
    const firstCase = page.locator("[data-testid='case-button-cg-134-patient-message-current']");
    await firstCase.focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await selectedCaseId(page)) === "CG_134_PATIENT_MESSAGE_SUPERSEDED",
      "ArrowDown did not advance the selected case rail.",
    );

    const supersededInspector = await panelText(page, "continuity-inspector");
    assertCondition(
      supersededInspector.includes("messages-thread") &&
        supersededInspector.includes("Resume on the latest thread"),
      "Superseded message selection lost same-shell recovery detail.",
    );

    const supersededRow = page.locator(
      "[data-testid='case-table-row-cg-134-patient-message-superseded']",
    );
    await supersededRow.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assertCondition(
      (await selectedCaseId(page)) === "CG_134_PATIENT_CLAIM_PARTIAL_IDENTITY",
      "Case-table keyboard traversal did not activate the next row.",
    );

    await page.locator("[data-testid='snapshot-tab-current']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      (await selectedTab(page)) === "recovery",
      "Snapshot tabs lost ArrowRight traversal.",
    );
    await page.keyboard.press("ArrowRight");
    assertCondition(
      (await selectedTab(page)) === "tuple",
      "Snapshot tabs lost tuple traversal.",
    );
    const tupleSnapshot = await panelText(page, "shell-snapshot-panel");
    assertCondition(
      tupleSnapshot.toLowerCase().includes("tuple snapshot") &&
        tupleSnapshot.includes("Freshness:") &&
        tupleSnapshot.includes("blocked_recovery"),
      "Tuple snapshot lost the tuple and freshness composite view.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='continuity-inspector']").isVisible();
    assertCondition(inspectorVisible, "Continuity inspector disappeared at mobile width.");
    const responsiveWidth = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 2,
    );
    assertCondition(responsiveWidth, "Continuity gate lab overflowed the mobile viewport.");

    const reducedPage = await browser.newPage({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
    });
    try {
      await reducedPage.goto(url, { waitUntil: "networkidle" });
      await waitForLab(reducedPage);
      const reducedMotion = await reducedPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
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
