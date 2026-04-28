import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LIVE_GATES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "im1_live_gate_checklist.json"), "utf8"),
);

export const pairingFormCoverage = [
  "actual-mode input coverage",
  "gate-state transitions",
  "provider roster refresh",
  "mutation toggle handling",
  "dry-run button remains blocked",
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  const baseUrl = process.env.MOCK_IM1_PAIRING_URL ?? "http://127.0.0.1:4175/";

  await page.goto(`${baseUrl}?mode=actual&page=Licence_and_RFC_Watch`, {
    waitUntil: "networkidle",
  });

  await page
    .locator("[data-testid='actual-field-mvp-evidence-url']")
    .fill("https://vecells.example/demo/im1");
  await page.locator("[data-testid='actual-field-sponsor-name']").fill("Programme Sponsor");
  await page.locator("[data-testid='actual-field-commercial-owner']").fill("Commercial Owner");
  await page.locator("[data-testid='actual-field-named-approver']").fill("Named Approver");
  await page.locator("[data-testid='actual-field-environment-target']").fill("supported_test");
  await page.locator("[data-testid='refresh-provider-roster']").click();

  await page
    .locator("[data-testid='gate-row-LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED']")
    .waitFor();
  await page.locator("[data-testid='actual-field-allow-mutation']").selectOption("true");

  const submitDisabled = await page.locator("[data-testid='dry-run-submit']").isDisabled();
  if (!submitDisabled) {
    throw new Error(
      "Dry-run submit should remain disabled while the external foundation gate is blocked.",
    );
  }

  const blockedText = await page
    .locator("[data-testid='gate-row-LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD']")
    .textContent();

  if (!blockedText || !blockedText.toLowerCase().includes("withheld")) {
    throw new Error("Expected the external foundation gate to remain visibly blocked.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const pairingFormManifest = {
  task: LIVE_GATES.task_id,
  liveGateCount: LIVE_GATES.summary.live_gate_count,
  selectorProfiles: Object.keys(LIVE_GATES.selector_map),
};
