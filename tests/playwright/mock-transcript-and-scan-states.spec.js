import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "35_evidence_processing_lab_pack.json"), "utf8"),
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

  const transcriptPage = await browser.newPage({ viewport: { width: 1280, height: 1080 } });
  await transcriptPage.goto(process.env.MOCK_TRANSCRIPTION_ENGINE_URL ?? "http://127.0.0.1:4200/", {
    waitUntil: "networkidle",
  });
  await transcriptPage.locator("[data-testid='transcription-sandbox-shell']").waitFor();
  await transcriptPage.locator("#scenario-id").selectOption("transcript_signature_retry");
  await transcriptPage.locator("[data-testid='simulate-button']").click();
  await transcriptPage.locator("text=signature_failed").waitFor();
  await transcriptPage.locator("#retry-button").click();
  await transcriptPage.locator("text=review_gate_open").waitFor();
  await transcriptPage.locator("#scenario-id").selectOption("transcript_superseded_replacement");
  await transcriptPage.locator("[data-testid='simulate-button']").click();
  await transcriptPage.locator("#supersede-button").click();
  await transcriptPage.locator("text=superseded").waitFor();

  const scanPage = await browser.newPage({ viewport: { width: 1280, height: 1080 } });
  await scanPage.goto(process.env.MOCK_SCAN_GATEWAY_URL ?? "http://127.0.0.1:4201/", {
    waitUntil: "networkidle",
  });
  await scanPage.locator("[data-testid='scan-sandbox-shell']").waitFor();
  await scanPage.locator("#scenario-id").selectOption("scan_webhook_retry");
  await scanPage.locator("[data-testid='simulate-button']").click();
  await scanPage.locator("text=signature_failed").waitFor();
  await scanPage.locator("#retry-button").click();
  await scanPage.locator("text=held_pending_release").waitFor();
  await scanPage.locator("#scenario-id").selectOption("scan_suspicious_review");
  await scanPage.locator("[data-testid='simulate-button']").click();
  await scanPage.locator("#review-button").click();
  await scanPage.locator("text=manual_review_complete").waitFor();

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const evidenceStateCoverage = {
  task: PACK.task_id,
  transcriptScenarios: PACK.summary.transcript_scenario_count,
  scanScenarios: PACK.summary.scan_scenario_count,
};
