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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1080 } });
  const baseUrl = process.env.MOCK_NOTIFICATION_RAIL_URL ?? "http://127.0.0.1:4190/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='notification-sandbox-shell']").waitFor();

  await page.locator("#scenario-id").selectOption("email_webhook_signature_retry");
  await page.locator("[data-testid='simulate-button']").click();
  await page.locator("text=delivery truth held").waitFor();
  await page.locator("#retry-button").click();
  await page.locator("text=webhook signature validated").waitFor();

  await page.locator("#scenario-id").selectOption("sms_wrong_recipient_disputed");
  await page.locator("[data-testid='simulate-button']").click();
  await page.locator("text=wrong recipient suspected").waitFor();
  await page.locator("#repair-button").click();
  await page.locator("text=challenge fallback selected").waitFor();

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const deliveryTruthCoverage = {
  task: PACK.task_id,
  seededMessages: PACK.summary.seeded_message_count,
  coversDisputeAndRepair: true,
};
