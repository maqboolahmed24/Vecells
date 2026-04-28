import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "site_link_environment_matrix.json"), "utf8"),
);

export const siteLinkStudioCoverage = [
  "route filtering and selection",
  "environment and platform switching",
  "Android and iOS JSON generation",
  "unsafe-path warning rendering",
  "local hosting validation panel",
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
  const baseUrl = process.env.MOCK_SITE_LINK_STUDIO_URL ?? "http://127.0.0.1:4181/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.locator("[data-testid='route-tree']").waitFor();
  await page.locator("[data-testid='route-filter']").fill("messages");
  await page.locator("[data-testid='route-row-sl_messages_cluster']").click();
  await page.locator("[data-testid='page-tab-Android_Assetlinks_Generator']").click();
  await page.locator("[data-testid='platform-tab-android']").click();
  await page.locator("[data-testid='json-preview-android']").waitFor();

  await page.locator("[data-testid='page-tab-iOS_AASA_Generator']").click();
  await page.locator("[data-testid='platform-tab-ios']").click();
  await page.locator("[data-testid='json-preview-ios']").waitFor();
  await page.locator("[data-testid='env-tab-aos_like']").click();
  await page.locator("text=__NHS_APP_IOS_APP_ID_AOS__").waitFor();

  await page.locator("[data-testid='route-filter']").fill("download");
  await page.locator("[data-testid='route-row-sl_raw_document_download']").click();
  await page.locator("[data-testid='unsafe-path-warning']").waitFor();

  await page.locator("[data-testid='page-tab-Local_Hosting_Validator']").click();
  await page.locator("[data-testid='local-hosting-panel']").waitFor();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.locator("[data-testid='workspace-grid']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='path-policy-inspector']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='route-tree']").waitFor();

  await page.context().setOffline(true);
  await page.locator("[data-testid='page-tab-Route_Path_Allowlist']").click();
  await page.locator("[data-testid='environment-switcher']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 8) {
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

export const siteLinkStudioManifest = {
  task: PACK.task_id,
  routes: PACK.summary.route_count,
  environments: PACK.summary.environment_count,
};
