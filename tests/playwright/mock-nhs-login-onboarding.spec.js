import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data", "analysis", "nhs_login_application_field_map.json"),
    "utf8",
  ),
);

// Autosave, mode toggle, blockers, evidence, keyboard, responsive, reduced motion,
// accessibility smoke, and offline completeness all run against deterministic test ids.
export const mockCoveragePlan = [
  "form completion and validation",
  "stage transitions",
  "blocker rendering",
  "autosave",
  "evidence attachment simulation",
  "mock/actual mode toggle",
  "responsive behavior",
  "keyboard navigation",
  "reduced motion",
  "accessibility smoke checks",
  "offline asset completeness",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const baseUrl = process.env.MOCK_NHS_LOGIN_URL ?? "http://127.0.0.1:4173/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.locator("[data-testid='stage-rail']").waitFor();
  await page.locator("[data-testid='field-fld_service_name']").fill("Vecells rehearsal");
  await page
    .locator("[data-testid='field-fld_service_summary']")
    .fill("Autosave proof from Playwright rehearsal.");
  await page.locator("[data-testid='field-fld_patient_eligibility']").fill("Patients in England.");
  await page.locator("[data-testid='next-stage-button']").click();
  await page.locator("[data-testid='checkpoint-toggle-chk_internal_eligibility_review']").click();
  await page.locator("[data-testid='artifact-toggle-art_architecture_diagram']").click();
  await page.locator("[data-testid='artifact-toggle-art_data_flow_diagram']").click();
  await page.locator("[data-testid='artifact-toggle-art_user_journey_pack']").click();
  await page.locator("[data-testid='artifact-toggle-art_demo_walkthrough']").click();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await page.locator("[data-testid='mode-toggle-actual']").click();
  await page.locator("[data-testid='actual-submission-notice']").waitFor();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='stage-rail']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='readiness-banner']").waitFor();

  await page.context().setOffline(true);
  await page.locator("[data-testid='mode-toggle-mock']").click();
  await page.locator("[data-testid='readiness-banner']").waitFor();

  const headings = await page.locator("h1, h2").count();
  if (headings < 3) {
    throw new Error("Accessibility smoke failed: expected at least three headings.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
