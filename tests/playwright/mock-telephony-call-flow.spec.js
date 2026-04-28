import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
);

export const telephonyCallFlowCoverage = [
  "webhook retry and signature failure",
  "recording-missing blocking",
  "urgent-live flow",
  "carrier sandbox selection and inspection",
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
  const baseUrl = process.env.MOCK_TELEPHONY_CARRIER_URL ?? "http://127.0.0.1:4180/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='telephony-sandbox-shell']").waitFor();

  await page.locator("#scenario-id").selectOption("webhook_signature_retry");
  await page.locator("[data-testid='simulate-button']").click();
  await page.locator("text=webhook_retry_pending").waitFor();
  await page.locator("#retry-button").click();
  await page.locator("text=webhook_dispatch_recovered").waitFor();

  await page.locator("#scenario-id").selectOption("recording_missing_manual_review");
  await page.locator("[data-testid='simulate-button']").click();
  await page.locator("text=manual_audio_review_required").waitFor();

  await page.locator("#scenario-id").selectOption("urgent_live_preemption");
  await page.locator("[data-testid='simulate-button']").click();
  await page.locator("text=urgent_live_only").waitFor();

  await page.locator("#advance-button").click();
  await page.locator("text=closed").waitFor();

  const jsonText = await page.locator("[data-testid='call-json']").textContent();
  if (!jsonText || !jsonText.includes("call_id")) {
    throw new Error("Expected selected call JSON to render in carrier sandbox.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const telephonyCallFlowManifest = {
  task: PACK.task_id,
  seededCalls: PACK.summary.seeded_call_count,
  webhooks: PACK.summary.webhook_row_count,
};
