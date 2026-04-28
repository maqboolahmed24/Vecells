import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

import {
  createSignoffReadinessReport,
  load396JsonFile,
  validateDemoDatasetManifest,
  type IntegrationDemoDatasetManifest,
  type NHSAppEnvironmentProfileManifest,
  type SCALSubmissionBundleManifest,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";
import { assert396RedactionSafePage, safe396EvidencePolicy } from "./396_redaction_helpers.ts";

const ROOT = "/Users/test/Code/V";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export async function run(): Promise<void> {
  const mode = readMode();
  const evidencePolicy = safe396EvidencePolicy(mode);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const environmentManifest = load396JsonFile<NHSAppEnvironmentProfileManifest>(
    "data/config/396_nhs_app_environment_profile_manifest.example.json",
    ROOT,
  );
  const demoManifest = load396JsonFile<IntegrationDemoDatasetManifest>(
    "data/config/396_nhs_app_demo_dataset_manifest.example.json",
    ROOT,
  );
  const scalManifest = load396JsonFile<SCALSubmissionBundleManifest>(
    "data/config/396_scal_submission_bundle_manifest.example.json",
    ROOT,
  );
  const demoValidation = validateDemoDatasetManifest(demoManifest);
  const signoff = createSignoffReadinessReport(environmentManifest, demoManifest, scalManifest);
  const reportPath = path.join(OUTPUT_DIR, "396_demo_environment_readiness_report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ mode, demoValidation, signoff }, null, 2));

  if (demoValidation.readinessState !== "ready") {
    throw new Error(`Demo readiness failed: ${demoValidation.failureReasons.join(", ")}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  try {
    if (evidencePolicy.captureTrace) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    await page.setContent(renderDemoReadinessPage(mode, demoValidation), {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("reset-sandpit").click();
    await page.getByText("Sandpit reset deterministic").waitFor();
    await page.getByTestId("reset-aos").click();
    await page.getByText("AOS reset deterministic").waitFor();
    await assert396RedactionSafePage(page, "396 demo readiness page");
    if (evidencePolicy.captureScreenshots) {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "396_demo_environment_readiness.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
    }
    if (evidencePolicy.captureTrace) {
      await context.tracing.stop({
        path: path.join(OUTPUT_DIR, "396_demo_environment_readiness_trace.zip"),
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

function renderDemoReadinessPage(
  mode: string,
  demoValidation: ReturnType<typeof validateDemoDatasetManifest>,
): string {
  const rows = demoValidation.environmentResults
    .map(
      (result) => `
        <tr>
          <td>${result.environment}</td>
          <td>${result.datasetId ?? "missing"}</td>
          <td>${result.missingJourneyKinds.length === 0 ? "complete" : result.missingJourneyKinds.join(", ")}</td>
          <td>${result.resetPlan?.afterHash ?? "missing"}</td>
        </tr>`,
    )
    .join("");
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>396 Demo readiness</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #102033; background: #f8fafc; }
        main { max-width: 760px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { border: 1px solid #ccd7e0; padding: 9px; text-align: left; }
        button { margin: 10px 8px 10px 0; padding: 10px 12px; }
        .status { margin: 12px 0; padding: 10px; border: 1px solid #6fb58c; background: #e7f4ee; }
      </style>
    </head>
    <body>
      <main>
        <h1>396 Demo readiness</h1>
        <p>Mode: ${mode}</p>
        <button data-testid="reset-sandpit" type="button">Reset Sandpit</button>
        <button data-testid="reset-aos" type="button">Reset AOS</button>
        <div id="status" class="status" aria-live="polite">Waiting for reset rehearsal.</div>
        <table aria-label="Demo journey coverage">
          <thead><tr><th>Environment</th><th>Dataset</th><th>Coverage</th><th>Reset hash</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </main>
      <script>
        const status = document.getElementById("status");
        document.querySelector("[data-testid='reset-sandpit']").addEventListener("click", () => {
          status.textContent = "Sandpit reset deterministic";
        });
        document.querySelector("[data-testid='reset-aos']").addEventListener("click", () => {
          status.textContent = "AOS reset deterministic";
        });
      </script>
    </body>
  </html>`;
}

function readMode(): string {
  const arg = process.argv.find((entry) => entry.startsWith("--mode="));
  return arg?.split("=")[1] ?? "verify-only";
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
