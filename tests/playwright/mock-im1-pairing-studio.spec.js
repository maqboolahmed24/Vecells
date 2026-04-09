import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "im1_pairing_pack.json"), "utf8"),
);

export const pairingStudioCoverage = [
  "stage navigation",
  "blocking rules",
  "page switching",
  "provider matrix parity",
  "actual-mode gate exposure",
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

async function completeStage(page, stageId) {
  await page.locator(`[data-testid='stage-button-${stageId}']`).click();
  await page.locator("[data-testid='stage-complete-button']").click();
}

async function run() {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const baseUrl = process.env.MOCK_IM1_PAIRING_URL ?? "http://127.0.0.1:4175/";

  await page.goto(`${baseUrl}?page=IM1_Readiness_Overview`, {
    waitUntil: "networkidle",
  });

  await page.locator("[data-testid='im1-shell']").waitFor();
  await page.locator("[data-testid='stage-button-supported_test_readiness_blocked']").click();
  await page.locator("[data-testid='blocker-chip-LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER']").waitFor();

  await completeStage(page, "product_profile_defined");
  await completeStage(page, "prerequisites_drafted");
  await completeStage(page, "stage_one_scal_stub_ready");

  await page.locator("[data-testid='stage-button-provider_supplier_targeting_ready']").click();
  await page.locator("[data-testid='blocker-chip-LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED']").waitFor();

  await page.locator("[data-testid='page-tab-SCAL_Artifact_Map']").click();
  await page.locator("[data-testid='artifact-card-ART_STAGE_ONE_SCAL_STUB']").waitFor();

  await page.locator("[data-testid='page-tab-Provider_Compatibility_Matrix']").click();
  await page.locator("[data-testid='provider-matrix-row-cmp_appointments_optum']").click();
  await page.locator("[data-testid='flow-diagram']").waitFor();
  await page.locator("[data-testid='flow-parity-table']").waitFor();

  await page.locator("[data-testid='mode-toggle-actual']").click();
  await page.locator("[data-testid='page-tab-Licence_and_RFC_Watch']").click();
  await page.locator("[data-testid='gate-row-LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD']").waitFor();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.locator("[data-testid='stage-rail']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='provider-matrix']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='page-tab-Prerequisites_Dossier']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 8) {
    throw new Error("Accessibility smoke failed: expected multiple headings in the IM1 studio.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const pairingStudioManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  stageCount: PACK.summary.stage_count,
  providerRows: PACK.provider_register.route_family_matrix.length,
};
