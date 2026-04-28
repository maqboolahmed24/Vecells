import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "78_access_grant_journey_lab.html");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "access_grant_casebook.json");
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "access_grant_runtime_tuple_manifest.json",
);
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "access_grant_family_matrix.csv");

const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const MATRIX_ROWS = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);

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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/78_access_grant_journey_lab.html"
          : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4378, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing journey lab HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.ACCESS_GRANT_JOURNEY_LAB_URL ??
    "http://127.0.0.1:4378/docs/architecture/78_access_grant_journey_lab.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='family-filter']").waitFor();
    await page.locator("[data-testid='redemption-state-filter']").waitFor();
    await page.locator("[data-testid='subject-binding-filter']").waitFor();
    await page.locator("[data-testid='route-family-filter']").waitFor();
    await page.locator("[data-testid='family-ladder']").waitFor();
    await page.locator("[data-testid='transition-map']").waitFor();
    await page.locator("[data-testid='supersession-ribbon']").waitFor();
    await page.locator("[data-testid='issuance-table']").waitFor();
    await page.locator("[data-testid='redemption-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const allIssuanceRows = await page.locator("tr[data-testid^='issuance-row-']").count();
    assertCondition(
      allIssuanceRows === CASEBOOK.summary.scenario_count,
      `Expected ${CASEBOOK.summary.scenario_count} issuance rows, found ${allIssuanceRows}.`,
    );

    await page.locator("[data-testid='family-filter']").selectOption("transaction_action_minimal");
    const transactionRows = await page.locator("tr[data-testid^='issuance-row-']").count();
    assertCondition(
      transactionRows === 6,
      `Expected 6 transaction rows, found ${transactionRows}.`,
    );

    await page.locator("[data-testid='family-filter']").selectOption("all");
    await page.locator("[data-testid='redemption-state-filter']").selectOption("replaced");
    const replacedRows = await page.locator("tr[data-testid^='issuance-row-']").count();
    assertCondition(replacedRows === 3, `Expected 3 replaced rows, found ${replacedRows}.`);

    await page.locator("[data-testid='redemption-state-filter']").selectOption("all");
    await page.locator("[data-testid='subject-binding-filter']").selectOption("hard_subject");
    const hardSubjectRows = await page.locator("tr[data-testid^='issuance-row-']").count();
    assertCondition(
      hardSubjectRows === 8,
      `Expected 8 hard-subject rows, found ${hardSubjectRows}.`,
    );

    await page.locator("[data-testid='subject-binding-filter']").selectOption("all");
    await page
      .locator("[data-testid='route-family-filter']")
      .selectOption("rf_patient_secure_link_recovery");
    const recoveryRouteRows = await page.locator("tr[data-testid^='issuance-row-']").count();
    assertCondition(
      recoveryRouteRows === 6,
      `Expected 6 secure-recovery rows, found ${recoveryRouteRows}.`,
    );

    await page.locator("[data-testid='route-family-filter']").selectOption("all");
    await page
      .locator("[data-testid='issuance-row-support_reissue_recovery']")
      .evaluate((node) => node.click());
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("support_reissue_recovery") &&
        inspectorText.includes("AG_078_SUPPORT_REISSUE_RECOVERY"),
      "Inspector lost selection synchronization for the support reissue case.",
    );
    const ladderSelected = await page
      .locator("[data-testid='family-ladder-node-support_recovery_minimal']")
      .getAttribute("data-selected");
    assertCondition(
      ladderSelected === "true",
      "Family ladder did not synchronize to the selected support-recovery case.",
    );
    const transitionSelected = await page
      .locator("[data-testid='transition-map']")
      .getAttribute("data-selected-case");
    assertCondition(
      transitionSelected === "support_reissue_recovery",
      "Transition map did not synchronize to the selected case.",
    );
    const ribbonSelected = await page
      .locator("[data-testid='supersession-ribbon']")
      .getAttribute("data-selected-case");
    assertCondition(
      ribbonSelected === "support_reissue_recovery",
      "Supersession ribbon did not synchronize to the selected case.",
    );
    const supersessionChipCount = await page.locator("[data-testid^='supersession-chip-']").count();
    assertCondition(
      supersessionChipCount === 1,
      "Expected one supersession chip for support reissue.",
    );

    const issuanceParity = await page
      .locator("[data-testid='issuance-table-parity']")
      .textContent();
    assertCondition(
      issuanceParity.includes(`${CASEBOOK.summary.scenario_count} total scenarios`),
      "Issuance parity text drifted.",
    );
    const redemptionRows = await page.locator("tr[data-testid^='redemption-row-']").count();
    assertCondition(
      redemptionRows >= 2,
      "Expected multiple settlement rows for the selected case.",
    );

    await page.locator("[data-testid='family-filter']").focus();
    await page.keyboard.press("Tab");
    const focusedTestId = await page.evaluate(() => document.activeElement?.dataset?.testid ?? "");
    assertCondition(
      focusedTestId === "redemption-state-filter",
      `Expected focus to advance to redemption-state-filter, found ${focusedTestId}.`,
    );

    await page
      .locator("[data-testid='route-family-filter']")
      .selectOption("rf_patient_secure_link_recovery");
    await page.locator("[data-testid='issuance-row-request_claim_auth_uplift']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='issuance-row-secure_continuation_verified_resume']")
      .getAttribute("data-selected");
    assertCondition(
      nextSelected === "true",
      "ArrowDown did not advance the visible issuance selection.",
    );
    await page.locator("[data-testid='route-family-filter']").selectOption("all");

    assertCondition(
      MATRIX_ROWS.length === 11,
      "Matrix row count drifted from the frozen use-case registry.",
    );

    await page.setViewportSize({ width: 1024, height: 900 });
    const tabletInspector = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(tabletInspector, "Inspector disappeared at tablet width.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileInspector = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(mobileInspector, "Inspector disappeared on mobile width.");

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
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

export const accessGrantJourneyLabManifest = {
  task: MANIFEST.task_id,
  scenarios: CASEBOOK.summary.scenario_count,
  runtimeTuples: MANIFEST.summary.runtime_tuple_count,
  coverage: [
    "issuance, redemption, and supersession filters",
    "selection synchronization",
    "keyboard navigation and focus order",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks",
  ],
};
