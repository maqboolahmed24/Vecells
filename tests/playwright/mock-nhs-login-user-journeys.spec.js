import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_login_capture_pack.json"), "utf8"),
);

export const userJourneyCoverage = [
  "authorize to token to userinfo happy path",
  "consent denied path",
  "expired auth code path",
  "settings-link return",
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

async function continueToConsent(page) {
  await page.locator("[data-testid='continue-sign-in']").click();
  await page.locator("[data-testid='field-otp']").waitFor();
  await page.locator("[data-testid='continue-sign-in']").click();
  await page.locator("[data-testid='consent-button-allow']").waitFor();
}

async function run() {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const baseUrl = process.env.MOCK_NHS_LOGIN_URL ?? "http://127.0.0.1:4174/";

  await page.goto(`${baseUrl}?view=signin`, { waitUntil: "networkidle" });

  await page.locator("[data-testid='route-binding-select']").selectOption("rb_patient_requests");
  await page.locator("[data-testid='scenario-chip-happy_path']").click();
  await continueToConsent(page);
  await page.locator("[data-testid='consent-button-allow']").click();
  await page.locator("[data-testid='auth-return-state']").waitFor();

  await page.locator("[data-testid='nav-view-signin']").click();
  await page.locator("[data-testid='scenario-chip-consent_denied']").click();
  await continueToConsent(page);
  await page.locator("[data-testid='consent-button-deny']").click();
  await page.locator("[data-testid='auth-return-state']").waitFor();

  await page.locator("[data-testid='nav-view-signin']").click();
  await page.locator("[data-testid='scenario-chip-stale_code']").click();
  await continueToConsent(page);
  await page.locator("[data-testid='consent-button-allow']").click();
  await page.locator("[data-testid='auth-return-state']").waitFor();

  await page.locator("[data-testid='nav-view-settings']").click();
  await page.locator("[data-testid='settings-return-button']").click();
  await page.locator("[data-testid='auth-return-state']").waitFor();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='summary-banner']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='nav-view-admin']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 5) {
    throw new Error("Accessibility smoke failed: expected multiple headings for the simulator.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const userJourneyManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  routeBindings: PACK.route_bindings.map((row) => row.route_binding_id),
  scenarios: PACK.auth_scenarios.map((row) => row.scenario_id),
};
