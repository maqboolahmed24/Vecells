import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_login_capture_pack.json"), "utf8"),
);

export const adminConsoleCoverage = [
  "client selection",
  "environment switching",
  "redirect validation",
  "redirect addition",
  "scope chips",
  "route-map parity",
  "keyboard navigation",
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const baseUrl = process.env.MOCK_NHS_LOGIN_URL ?? "http://127.0.0.1:4174/";

  await page.goto(`${baseUrl}?view=admin`, { waitUntil: "networkidle" });

  await page.locator("[data-testid='client-registry-list']").waitFor();
  await page.locator("[data-testid='client-card-mc_recovery_bridge']").click();
  await page.locator("[data-testid='environment-option-env_sandpit_like']").click();
  await page
    .locator("[data-testid='redirect-uri-input']")
    .fill("https://sandpit-like.vecells.local/not-governed");
  await page.locator("[data-testid='redirect-uri-add']").click();
  await page.locator("[data-testid='admin-message']").waitFor();

  await page
    .locator("[data-testid='redirect-uri-input']")
    .fill("https://sandpit-like.vecells.local/auth/callback/custom-seq-025");
  await page.locator("[data-testid='redirect-uri-add']").click();
  await page.locator("[data-testid='admin-message']").waitFor();

  await page.locator("[data-testid='im1-toggle']").click();
  await page.locator("[data-testid='scope-chip-sb_auth_contact_minimum']").waitFor();
  await page.locator("[data-testid='route-map-diagram']").waitFor();
  await page.locator("[data-testid='route-map-parity-table']").waitFor();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.locator("[data-testid='environment-switcher']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='credential-intake-drawer']").waitFor();

  const redirectCount = await page.locator("[data-testid^='redirect-uri-entry-']").count();
  if (redirectCount < 3) {
    throw new Error("Expected multiple redirect URI entries on the admin console.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const adminConsoleManifest = {
  task: PACK.task_id,
  clients: PACK.mock_clients.map((row) => row.client_id),
  environments: PACK.environment_profiles.map((row) => row.environment_profile_id),
};
