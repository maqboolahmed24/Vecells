import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "mesh_execution_pack.json"), "utf8"),
);

export const meshWorkflowProofCoverage = [
  "duplicate delivery",
  "replay resistance",
  "expiry handling",
  "quarantine handling",
  "proof inspector parity",
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
    process.env.MOCK_MESH_MAILROOM_URL ?? "http://127.0.0.1:4179/?page=Proof_and_Replay_Inspector";

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.locator("[data-testid='mesh-shell']").waitFor();
  await page.locator("[data-testid='mailbox-button-MBX_VEC_SUPPORT']").click();
  await page.locator("[data-testid='workflow-select']").selectOption("VEC_ATTACHMENT_QUARANTINE");
  await page.locator("[data-testid='scenario-select']").selectOption("quarantine_attachment");
  await page.locator("[data-testid='send-message-button']").click();
  await page.locator("[data-testid='advance-lifecycle-button']").click();
  await page.locator("text=Attachment quarantined").waitFor();

  await page.locator("[data-testid='workflow-select']").selectOption("VEC_REPLAY_EVIDENCE_REQUEST");
  await page.locator("[data-testid='scenario-select']").selectOption("replay_guard");
  await page.locator("[data-testid='send-message-button']").click();
  await page.locator("[data-testid='advance-lifecycle-button']").click();
  await page.locator("text=Replay blocked").waitFor();

  await page.locator("[data-testid='mailbox-button-MBX_VEC_PHARMACY']").click();
  await page.locator("[data-testid='workflow-select']").selectOption("VEC_PF_OUTCOME_RESP");
  await page.locator("[data-testid='scenario-select']").selectOption("expired_pickup");
  await page.locator("[data-testid='send-message-button']").click();
  await page.locator("[data-testid='advance-lifecycle-button']").click();
  await page.locator("text=Pickup expired").waitFor();

  await page.locator("[data-testid='page-tab-Proof_and_Replay_Inspector']").click();
  await page.locator("text=Replay resistance, quarantine, and proof debt").waitFor();
  await page.locator("[data-testid='proof-inspector']").waitFor();

  const riskCards = await page.locator("text=RISK_EXT_MESH_DELAY").count();
  if (riskCards < 1) {
    throw new Error("Expected mesh risk coverage in the proof inspector.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const meshWorkflowProofManifest = {
  task: PACK.task_id,
  scenarios: PACK.summary.scenario_count,
  seededMessages: PACK.summary.seeded_message_count,
};
