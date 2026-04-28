import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "pds_access_pack.json"), "utf8"),
);

export const pdsSandboxCoverage = [
  "mode selection",
  "matched search and read",
  "ambiguous search rendering",
  "degraded response rendering",
  "masked audit log",
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
  const baseUrl = process.env.MOCK_PDS_SANDBOX_URL ?? "http://127.0.0.1:4176/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='sandbox-shell']").waitFor();

  await page.locator("[data-testid='access-mode-select']").selectOption("application_restricted");
  await page.locator("[data-testid='scenario-select']").selectOption("matched");
  await page.locator("[data-testid='search-button']").click();
  await page.locator("[data-testid='result-summary']").waitFor();
  await page.locator("[data-testid='trace-class-matched']").waitFor();
  await page.locator("[data-testid='result-row-pds_pt_meridian_001']").click();
  await page.locator("[data-testid='result-json']").waitFor();

  await page.locator("[data-testid='scenario-select']").selectOption("ambiguous");
  await page.locator("[data-testid='search-button']").click();
  await page.locator("[data-testid='trace-class-ambiguous']").waitFor();
  const ambiguousCount = await page.locator("[data-testid^='result-row-']").count();
  if (ambiguousCount < 2) {
    throw new Error("Expected ambiguous sandbox search to render at least two result rows.");
  }

  await page.locator("[data-testid='scenario-select']").selectOption("degraded");
  await page.locator("[data-testid='search-button']").click();
  await page.locator("[data-testid='trace-class-degraded']").waitFor();

  const auditText = await page.locator("[data-testid='audit-log']").textContent();
  if (!auditText || !auditText.includes("***")) {
    throw new Error("Masked audit log did not render masked identifiers.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const pdsSandboxManifest = {
  task: PACK.task_id,
  scenarioCount: PACK.summary.scenario_count,
  patientCount: PACK.summary.mock_patient_count,
};
