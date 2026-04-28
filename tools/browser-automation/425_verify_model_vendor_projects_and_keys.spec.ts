import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  buildReadinessEvidence,
  readAndValidateModelVendorSetup,
  type OperationMode,
  writeJson,
} from "../../scripts/assistive/425_model_vendor_project_setup_lib.ts";
import {
  assertSecretSafePage,
  assertSecretSafeText,
  safeEvidencePolicy,
} from "./425_secret_redaction_helpers.ts";

const OUTPUT_DIR = path.join(
  "/Users/test/Code/V",
  "output",
  "playwright",
  "425-model-vendor-projects",
);

function outputPath(fileName: string): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return path.join(OUTPUT_DIR, fileName);
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function trackExternalRequests(page: Page, externalRequests: Set<string>): void {
  page.on("request", (request) => {
    const url = request.url();
    if (
      url === "about:blank" ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return;
    }
    externalRequests.add(url);
  });
}

async function renderVerifyHarness(mode: OperationMode): Promise<string> {
  const setup = readAndValidateModelVendorSetup();
  const evidence = buildReadinessEvidence(setup, mode);
  const validationRows = [
    ["manifest_validation", setup.validation.valid ? "passed" : "failed"],
    [
      "primary_provider",
      setup.registry.primaryProviderId === "vecells_assistive_vendor_watch_shadow_twin"
        ? "passed"
        : "failed",
    ],
    [
      "apply_blocked",
      evidence.projectRows.every((row) => row.applyAllowed === false)
        ? "passed"
        : "failed",
    ],
    [
      "masked_fingerprints",
      evidence.keyReferenceRows.every((row) =>
        row.maskedFingerprint.startsWith("fp_sha256_"),
      )
        ? "passed"
        : "failed",
    ],
  ];
  const rows = validationRows
    .map(
      ([checkId, status]) => `
        <tr data-testid="check-row-${escapeHtml(checkId)}" data-status="${escapeHtml(status)}">
          <td>${escapeHtml(checkId)}</td>
          <td>${escapeHtml(status)}</td>
        </tr>`,
    )
    .join("");
  const keyRows = evidence.keyReferenceRows
    .map(
      (row) => `
        <li data-testid="fingerprint-${escapeHtml(row.keyReferenceId)}">${escapeHtml(row.maskedFingerprint)}</li>`,
    )
    .join("");

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>425 model vendor verification harness</title>
      <style>
        :root { color-scheme: light; font-family: Inter, Arial, sans-serif; }
        body { margin: 0; background: #f7f9fb; color: #17202e; }
        main { max-width: 980px; margin: 0 auto; padding: 28px; }
        h1 { font-size: 23px; margin: 0 0 16px; letter-spacing: 0; }
        table { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #d7dde8; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e9f0; font-size: 13px; }
        th { background: #edf2f7; }
        button { border: 1px solid #9aa7b8; background: #ffffff; border-radius: 6px; padding: 8px 10px; margin-top: 16px; cursor: pointer; }
        #banner { margin-top: 12px; padding: 10px; background: #ffffff; border: 1px solid #c8d1dc; border-radius: 6px; }
        ul { background: #ffffff; border: 1px solid #d7dde8; border-radius: 6px; padding: 12px 12px 12px 28px; }
      </style>
    </head>
    <body>
      <main>
        <h1>425 model vendor verification harness</h1>
        <div data-testid="verify-mode">${escapeHtml(mode)}</div>
        <table aria-label="Verification checks">
          <thead><tr><th>Check</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <h2>Masked fingerprints</h2>
        <ul>${keyRows}</ul>
        <button data-testid="run-verify" type="button">Verify</button>
        <div id="banner" data-testid="verify-banner" data-action="ready">Ready</div>
      </main>
      <script>
        document.querySelector('[data-testid="run-verify"]').addEventListener('click', () => {
          const banner = document.querySelector('[data-testid="verify-banner"]');
          banner.textContent = 'Verify completed: all current 425 checks passed and apply remains blocked.';
          banner.dataset.action = 'verify_completed';
        });
      </script>
    </body>
  </html>`;

  await assertSecretSafeText(html, "425-verify-harness-html");
  return html;
}

export async function run(): Promise<void> {
  const mode: OperationMode = "verify";
  const setup = readAndValidateModelVendorSetup();
  const evidence = buildReadinessEvidence(setup, mode);

  assertCondition(setup.validation.valid, JSON.stringify(setup.validation.issues, null, 2));
  assertCondition(
    evidence.decision === "ready_for_dry_run_rehearsal_verify",
    `Unexpected verify decision: ${evidence.decision}`,
  );

  const policy = safeEvidencePolicy();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  const page = await context.newPage();
  const externalRequests = new Set<string>();
  trackExternalRequests(page, externalRequests);

  try {
    if (policy.recordTraceOnlyForRedactedHarness) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    await page.setContent(await renderVerifyHarness(mode), {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("check-row-manifest_validation").waitFor();
    for (const checkId of [
      "manifest_validation",
      "primary_provider",
      "apply_blocked",
      "masked_fingerprints",
    ]) {
      assertCondition(
        (await page.getByTestId(`check-row-${checkId}`).getAttribute("data-status")) ===
          "passed",
        `Verification check failed: ${checkId}`,
      );
    }
    await page.getByTestId("run-verify").click();
    assertCondition(
      (await page.getByTestId("verify-banner").getAttribute("data-action")) ===
        "verify_completed",
      "Verify action did not settle.",
    );
    await assertSecretSafePage(page, "425-verify-page");
    assertCondition(
      externalRequests.size === 0,
      `425 verify harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("425-verify-model-vendor-projects.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    writeJson(outputPath("425-verify-readiness-summary.json"), evidence);
  } finally {
    if (policy.recordTraceOnlyForRedactedHarness) {
      await context.tracing.stop({
        path: outputPath("425-verify-model-vendor-projects-trace.zip"),
      });
    }
    await context.close();
    await browser.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
