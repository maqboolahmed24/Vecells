import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "pds_access_pack.json"), "utf8"),
);

export const pdsAccessStudioCoverage = [
  "route-family switching",
  "access-mode validation",
  "feature-flag transitions",
  "mock search and read flows",
  "ambiguous and degraded rendering",
  "rollback trigger rendering",
  "keyboard navigation",
  "reduced motion",
  "responsive behavior",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const baseUrl = process.env.MOCK_PDS_ACCESS_URL ?? "http://127.0.0.1:4177/";

  await page.goto(`${baseUrl}?page=PDS_Flag_Overview`, {
    waitUntil: "networkidle",
  });

  await page.locator("[data-testid='pds-shell']").waitFor();
  await page.locator("[data-testid='route-button-rf_support_ticket_workspace']").click();
  await page.locator("text=PDS_UC_SUPPORT_IDENTITY_REVIEW").waitFor();

  await page.locator("[data-testid='feature-flag-select']").selectOption("ready_for_live");
  await page.locator("[data-testid='page-tab-Rollback_and_Kill_Switches']").click();
  await page
    .locator("[data-testid='live-gate-row-PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF']")
    .waitFor();

  await page.locator("[data-testid='page-tab-PDS_Flag_Overview']").click();
  await page.locator("[data-testid='access-mode-select']").selectOption("patient_access");
  await page.locator("[data-testid='page-tab-Rollback_and_Kill_Switches']").click();
  await page.locator("[data-testid='live-gate-row-PDS_LIVE_GATE_ACCESS_MODE_SELECTED']").waitFor();

  await page.locator("[data-testid='page-tab-PDS_Flag_Overview']").click();
  await page.locator("[data-testid='scenario-select']").selectOption("matched");
  await page.locator("[data-testid='run-trace-button']").click();
  await page.locator("[data-testid='trace-class-matched']").waitFor();
  await page.locator("[data-testid^='trace-result-']").first().click();
  await page.locator("[data-testid='trace-json']").waitFor();

  await page.locator("[data-testid='scenario-select']").selectOption("ambiguous");
  await page.locator("[data-testid='run-trace-button']").click();
  await page.locator("[data-testid='trace-class-ambiguous']").waitFor();
  const ambiguousCount = await page.locator("[data-testid^='trace-result-']").count();
  if (ambiguousCount < 2) {
    throw new Error("Expected ambiguous scenario to render at least two trace result buttons.");
  }

  await page.locator("[data-testid='scenario-select']").selectOption("degraded");
  await page.locator("[data-testid='run-trace-button']").click();
  await page.locator("[data-testid='trace-class-degraded']").waitFor();

  await page.locator("[data-testid='page-tab-Rollback_and_Kill_Switches']").click();
  await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
  await page.locator("[data-testid='actual-field-environment-target']").fill("sandbox");
  await page.locator("[data-testid='actual-field-org-ods']").fill("ORG-PLACEHOLDER");
  await page
    .locator("[data-testid='actual-field-use-case-owner']")
    .fill("ROLE_INTEROPERABILITY_LEAD");
  await page.locator("[data-testid='actual-field-allow-mutation']").selectOption("false");
  await page.locator("[data-testid='actual-submit-button']").waitFor();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.locator("[data-testid='route-rail']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='lineage-strip']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='identity-inspector']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 10) {
    throw new Error(
      "Accessibility smoke failed: expected multiple headings in the PDS access studio.",
    );
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const pdsAccessStudioManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  accessRows: PACK.summary.access_row_count,
  featureFlags: PACK.summary.feature_flag_count,
};
