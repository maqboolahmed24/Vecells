import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_app_stage_progression.json"), "utf8"),
);

export const nhsAppStudioCoverage = [
  "stage navigation and gating",
  "eligibility editing and validation",
  "mock/actual mode behavior",
  "responsive behavior",
  "keyboard navigation",
  "reduced motion",
  "offline asset completeness",
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } });
  const baseUrl = process.env.MOCK_NHS_APP_STUDIO_URL ?? "http://127.0.0.1:4180/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.locator("[data-testid='stage-rail']").waitFor();
  await page.locator("[data-testid='field-q01_company_name']").fill("Vecells");
  await page.locator("[data-testid='field-q03_product_overview']").fill(
    "Playwright rehearsal proving one portal, two shells, and deferred embedded readiness.",
  );
  await page.locator("[data-testid='field-q14_commissioned_by_nhs_body']").selectOption("to_be_confirmed");
  await page.locator("[data-testid='field-q18_nhs_login_posture']").selectOption("integrating");
  await page.locator("[data-testid='eligibility-chip-crit_deferred_scope_boundary']").click();

  await page.locator("[data-testid='page-tab-Product_Review_and_Demo']").click();
  await page.locator("[data-testid='artifact-toggle-art_demo_environment_brief']").click();
  await page.locator("[data-testid='artifact-toggle-art_route_manifest']").click();

  await page.locator("[data-testid='page-tab-SCAL_and_Release_Gates']").click();
  await page.locator("[data-testid='mode-toggle-actual']").click();
  await page.locator("[data-testid='actual-submission-notice']").waitFor();
  await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
  await page.locator("[data-testid='actual-field-environment-target']").selectOption("sandpit");
  await page.locator("[data-testid='actual-field-allow-mutation']").selectOption("false");

  const disabled = await page.locator("[data-testid='actual-submit-button']").isDisabled();
  if (!disabled) {
    throw new Error("Real submit button should stay disabled while live gates are blocked.");
  }

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.locator("[data-testid='environment-ladder']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='evidence-drawer']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='stage-rail']").waitFor();

  await page.context().setOffline(true);
  await page.locator("[data-testid='page-tab-Eligibility_and_EOI']").click();
  await page.locator("[data-testid='readiness-banner']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 10) {
    throw new Error("Accessibility smoke failed: expected multiple headings in the studio.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const nhsAppStudioManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  stages: PACK.summary.stage_count,
  liveGates: PACK.summary.live_gate_count,
};
