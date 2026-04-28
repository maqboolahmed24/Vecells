import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

import {
  indexSCALBundle,
  load396JsonFile,
  type SCALSubmissionBundleManifest,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";
import { assert396RedactionSafePage, safe396EvidencePolicy } from "./396_redaction_helpers.ts";

const ROOT = "/Users/test/Code/V";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export async function run(): Promise<void> {
  const mode = readMode();
  const evidencePolicy = safe396EvidencePolicy(mode);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const scalManifest = load396JsonFile<SCALSubmissionBundleManifest>(
    "data/config/396_scal_submission_bundle_manifest.example.json",
    ROOT,
  );
  const scalIndex = indexSCALBundle(scalManifest);
  const reportPath = path.join(OUTPUT_DIR, "396_scal_evidence_index_report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ mode, scalIndex }, null, 2));

  if (scalIndex.readinessState !== "ready") {
    throw new Error(`SCAL evidence index failed: ${scalIndex.failureReasons.join(", ")}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  try {
    if (evidencePolicy.captureTrace) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    await page.setContent(renderScalEvidencePage(mode, scalIndex), {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("capture-index").click();
    await page.getByText("SCAL evidence index captured").waitFor();
    await assert396RedactionSafePage(page, "396 SCAL evidence capture page");
    if (evidencePolicy.captureScreenshots) {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "396_scal_evidence_index.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
    }
    if (evidencePolicy.captureTrace) {
      await context.tracing.stop({
        path: path.join(OUTPUT_DIR, "396_capture_scal_evidence_index_trace.zip"),
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

function renderScalEvidencePage(
  mode: string,
  scalIndex: ReturnType<typeof indexSCALBundle>,
): string {
  const rows = scalIndex.rows
    .map(
      (row) => `
        <tr>
          <td>${row.requirementId}</td>
          <td>${row.artifactRef}</td>
          <td>${row.owner}</td>
          <td>${row.freshnessState}</td>
          <td>${row.redactionClass}</td>
          <td>${row.exportPolicy}</td>
          <td>${row.redactedArtifactPath}</td>
        </tr>`,
    )
    .join("");
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>396 SCAL evidence index</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 28px; color: #102033; background: #f8fafc; }
        main { max-width: 1160px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: white; font-size: 13px; }
        th, td { border: 1px solid #ccd7e0; padding: 8px; text-align: left; vertical-align: top; }
        button { margin: 12px 0; padding: 10px 14px; }
        .status { margin: 12px 0; padding: 10px; border: 1px solid #6fb58c; background: #e7f4ee; }
      </style>
    </head>
    <body>
      <main>
        <h1>396 SCAL evidence index</h1>
        <p>Mode: ${mode}</p>
        <p>Readiness: ${scalIndex.readinessState}</p>
        <button data-testid="capture-index" type="button">Capture index</button>
        <div id="status" class="status" aria-live="polite">Waiting for capture.</div>
        <table aria-label="SCAL evidence index">
          <thead><tr><th>Requirement</th><th>Artifact</th><th>Owner</th><th>Freshness</th><th>Redaction</th><th>Export</th><th>Redacted path</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </main>
      <script>
        document.querySelector("[data-testid='capture-index']").addEventListener("click", () => {
          document.getElementById("status").textContent = "SCAL evidence index captured";
        });
      </script>
    </body>
  </html>`;
}

function readMode(): string {
  const arg = process.argv.find((entry) => entry.startsWith("--mode="));
  return arg?.split("=")[1] ?? "capture-evidence";
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
