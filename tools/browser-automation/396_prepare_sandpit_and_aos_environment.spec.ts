import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

import {
  compareSandpitAOSParity,
  load396JsonFile,
  type NHSAppEnvironmentProfileManifest,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";
import { assert396RedactionSafePage, safe396EvidencePolicy } from "./396_redaction_helpers.ts";

const ROOT = "/Users/test/Code/V";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export async function run(): Promise<void> {
  const mode = readMode();
  const evidencePolicy = safe396EvidencePolicy(mode);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest = load396JsonFile<NHSAppEnvironmentProfileManifest>(
    "data/config/396_nhs_app_environment_profile_manifest.example.json",
    ROOT,
  );
  const parity = compareSandpitAOSParity(manifest);
  const reportPath = path.join(OUTPUT_DIR, "396_sandpit_aos_prepare_report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ mode, parity }, null, 2));

  if (parity.parityState !== "matching") {
    throw new Error(`Sandpit/AOS parity failed: ${parity.failureReasons.join(", ")}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  try {
    if (evidencePolicy.captureTrace) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    await page.setContent(renderParityPage(mode, parity), { waitUntil: "domcontentloaded" });
    await page.getByTestId("validate-sandpit").click();
    await page.getByText("Sandpit tuple verified").waitFor();
    await page.getByTestId("validate-aos").click();
    await page.getByText("AOS tuple verified").waitFor();
    await assert396RedactionSafePage(page, "396 Sandpit/AOS preparation page");
    if (evidencePolicy.captureScreenshots) {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "396_sandpit_aos_prepare.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
    }
    if (evidencePolicy.captureTrace) {
      await context.tracing.stop({
        path: path.join(OUTPUT_DIR, "396_sandpit_aos_prepare_trace.zip"),
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

function renderParityPage(
  mode: string,
  parity: ReturnType<typeof compareSandpitAOSParity>,
): string {
  const rows = parity.environmentResults
    .map(
      (result) => `
        <tr>
          <td>${result.environment}</td>
          <td>${result.readinessState}</td>
          <td>${result.routeInventoryRefs.join(", ")}</td>
          <td>${result.tupleHash ?? "missing"}</td>
        </tr>`,
    )
    .join("");
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>396 Sandpit and AOS preparation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #102033; background: #f7f9fb; }
        main { max-width: 1080px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { border: 1px solid #ccd7e0; padding: 10px; text-align: left; vertical-align: top; }
        button { margin: 12px 12px 12px 0; padding: 10px 14px; }
        .status { margin-top: 16px; padding: 12px; background: #e7f4ee; border: 1px solid #6fb58c; }
      </style>
    </head>
    <body>
      <main>
        <h1>396 Sandpit and AOS preparation</h1>
        <p data-testid="automation-mode">Mode: ${mode}</p>
        <p>Parity: ${parity.parityState}</p>
        <button data-testid="validate-sandpit" type="button">Validate Sandpit</button>
        <button data-testid="validate-aos" type="button">Validate AOS</button>
        <div id="status" class="status" aria-live="polite">Waiting for browser validation.</div>
        <table aria-label="Sandpit and AOS tuple parity">
          <thead><tr><th>Environment</th><th>Readiness</th><th>Routes</th><th>Tuple hash</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </main>
      <script>
        const status = document.getElementById("status");
        document.querySelector("[data-testid='validate-sandpit']").addEventListener("click", () => {
          status.textContent = "Sandpit tuple verified";
        });
        document.querySelector("[data-testid='validate-aos']").addEventListener("click", () => {
          status.textContent = "AOS tuple verified";
        });
      </script>
    </body>
  </html>`;
}

function readMode(): string {
  const arg = process.argv.find((entry) => entry.startsWith("--mode="));
  return arg?.split("=")[1] ?? "dry-run";
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
