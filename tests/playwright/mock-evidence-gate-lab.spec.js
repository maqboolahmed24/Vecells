import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data", "analysis", "35_evidence_processing_lab_pack.json"),
    "utf8",
  ),
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
    process.env.MOCK_EVIDENCE_GATE_LAB_URL ??
    "http://127.0.0.1:4202/?transcriptionBaseUrl=http://127.0.0.1:4200&scanBaseUrl=http://127.0.0.1:4201";

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='evidence-gate-lab-shell']").waitFor();
  await page.locator("[data-testid='job-profile-JOB_TRANS_RETRANSCRIBE_SUPERSEDE']").click();

  await page.locator("[data-testid='page-tab-Transcript_Job_Profiles']").click();
  await page
    .locator("[data-testid='transcript-scenario-select']")
    .selectOption("transcript_signature_retry");
  await page.locator("[data-testid='simulate-transcript-button']").click();
  await page.locator("text=Ready transcript, unsigned callback").waitFor();

  await page.locator("[data-testid='page-tab-Scan_and_Quarantine_Policies']").click();
  await page
    .locator("[data-testid='scan-scenario-select']")
    .selectOption("scan_unreadable_reacquire");
  await page.locator("[data-testid='simulate-scan-button']").click();
  await page.locator("text=Unreadable and reacquire").waitFor();

  await page.locator("[data-testid='page-tab-Evidence_Event_Inspector']").click();
  await page.locator("[data-testid='event-inspector']").waitFor();

  await page.locator("[data-testid='page-tab-Live_Gates_and_Retention_Posture']").click();
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
  await page.locator("[data-testid='job-rail']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='policy-drawer']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='lower-diagram']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 10) {
    throw new Error("Accessibility smoke failed: expected multiple headings in the evidence lab.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const evidenceGateLabManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  jobProfiles: PACK.summary.job_profile_count,
  liveGates: PACK.summary.live_gate_count,
};
