import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
);

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
    process.env.MOCK_NOTIFICATION_STUDIO_URL ??
    "http://127.0.0.1:4191/?notificationBaseUrl=http://127.0.0.1:4190";

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='notification-studio-shell']").waitFor();
  await page.locator("[data-testid='template-button-TF_EMAIL_DELIVERY_REPAIR']").click();
  await page.locator("text=delivery repair notice").waitFor();

  await page.locator("[data-testid='page-tab-Routing_Plan_Studio']").click();
  await page.locator("text=Validation checks").waitFor();

  await page.locator("[data-testid='page-tab-Delivery_Truth_Inspector']").click();
  await page
    .locator("[data-testid='scenario-select']")
    .selectOption("email_bounce_repair_required");
  await page.locator("[data-testid='simulate-message-button']").click();
  await page.locator("text=repair required").waitFor();

  await page.locator("[data-testid='page-tab-Live_Gates_and_Sender_Readiness']").click();
  await page.locator("[data-testid='mode-toggle-actual']").click();
  await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
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
  await page.locator("[data-testid='template-rail']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='lower-diagram']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 10) {
    throw new Error(
      "Accessibility smoke failed: expected multiple headings in the notification studio.",
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

export const notificationStudioManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  templates: PACK.summary.template_count,
  scenarios: PACK.summary.scenario_count,
};
