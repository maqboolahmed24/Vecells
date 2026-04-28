import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
);

export const telephonyLabCoverage = [
  "number switching",
  "IVR flow simulation",
  "recording and continuation inspector",
  "mock vs actual gating",
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
  const baseUrl =
    process.env.MOCK_TELEPHONY_LAB_URL ??
    "http://127.0.0.1:4181/?telephonyBaseUrl=http://127.0.0.1:4180";

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.locator("[data-testid='telephony-shell']").waitFor();
  await page.locator("[data-testid='number-button-NUM_TEL_DUAL_CONTINUITY']").click();
  await page.locator("text=MOCK:+44-VC-0006").waitFor();

  await page.locator("[data-testid='page-tab-IVR_Flow_Studio']").click();
  await page.locator("[data-testid='scenario-select']").selectOption("urgent_live_preemption");
  await page.locator("[data-testid='simulate-call-button']").click();
  await page.locator("text=urgent live only").waitFor();

  await page.locator("[data-testid='page-tab-Recording_and_Continuation']").click();
  await page.locator("text=Continuation remains bounded").waitFor();

  await page.locator("[data-testid='page-tab-Live_Gates_and_Spend_Controls']").click();
  await page.locator("[data-testid='mode-toggle-actual']").click();
  await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
  await page.locator("[data-testid='actual-field-allow-mutation']").selectOption("false");
  await page.locator("[data-testid='actual-field-allow-spend']").selectOption("false");
  const disabled = await page.locator("[data-testid='actual-submit-button']").isDisabled();
  if (!disabled) {
    throw new Error("Actual submit must stay disabled while Phase 0 remains withheld.");
  }

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.locator("[data-testid='inspector-panel']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='number-rail']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='lower-diagram']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 10) {
    throw new Error("Accessibility smoke failed: expected multiple headings in the telephony lab.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const telephonyLabManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  numbers: PACK.summary.number_count,
  scenarios: PACK.summary.scenario_count,
};
