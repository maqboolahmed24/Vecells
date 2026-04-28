import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_app_stage_progression.json"), "utf8"),
);

export const nhsAppEmbeddedPreviewCoverage = [
  "embedded preview rendering",
  "preview-mode toggle",
  "route parity",
  "artifact safety messaging",
  "safe-browser handoff posture",
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

  await page.locator("[data-testid='page-tab-Embedded_Readiness_Preview']").click();
  await page.locator("[data-testid='preview-shell']").waitFor();
  await page.locator("[data-testid='preview-mode-standalone']").click();
  await page.locator("text=Vecells patient portal header").waitFor();
  await page.locator("[data-testid='preview-mode-embedded']").click();
  await page.locator("text=Native NHS App chrome owns header").waitFor();

  await page.locator("[data-testid='preview-route-manage-appointment']").click();
  await page.locator("text=safe_browser_handoff").waitFor();
  await page.locator("[data-testid='preview-route-record-artifact']").click();
  await page.locator("text=byte-safe preview").waitFor();
  await page.locator("[data-testid='preview-route-messages']").click();
  await page.locator("text=placeholder_only").waitFor();

  const routeCount = PACK.preview_routes.length;
  const renderedTabs = await page.locator(".preview-route-tab").count();
  if (renderedTabs !== routeCount) {
    throw new Error(`Expected ${routeCount} preview tabs, found ${renderedTabs}.`);
  }

  const drawerText = await page.locator("[data-testid='evidence-drawer']").textContent();
  if (!drawerText || !drawerText.includes("Route family")) {
    throw new Error("Evidence drawer should expose route family details.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const nhsAppEmbeddedPreviewManifest = {
  task: PACK.task_id,
  previewRoutes: PACK.summary.preview_route_count,
};
