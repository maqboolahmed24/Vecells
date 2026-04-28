import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  buildModelAuditAndSafetyReadinessEvidence,
  readAndValidateModelAuditAndSafetySetup,
  writeJson,
} from "../../scripts/assistive/426_model_audit_and_safety_lib.ts";
import {
  assertSecretSafePage,
  assertSecretSafeText,
  safeEvidencePolicy,
} from "./426_secret_redaction_helpers.ts";

const OUTPUT_DIR = path.join(
  "/Users/test/Code/V",
  "output",
  "playwright",
  "426-model-audit-and-safety",
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

async function renderVerifyHarness(): Promise<string> {
  const setup = readAndValidateModelAuditAndSafetySetup();
  const evidence = buildModelAuditAndSafetyReadinessEvidence(setup, "verify");
  const validationRows = [
    ["manifest_validation", setup.validation.valid ? "passed" : "failed"],
    [
      "audit_logging",
      evidence.auditRows.filter((row) => row.providerId === evidence.primaryProviderId)
        .every((row) => row.status === "verified")
        ? "passed"
        : "failed",
    ],
    [
      "event_export",
      evidence.auditRows.filter((row) => row.providerId === evidence.primaryProviderId)
        .every((row) => row.payloadPolicy === "metadata_only_redacted_no_prompts_responses")
        ? "passed"
        : "failed",
    ],
    [
      "retention",
      evidence.auditRows.filter((row) => row.providerId === evidence.primaryProviderId)
        .every((row) => typeof row.retentionDays === "number" && row.retentionDays > 0)
        ? "passed"
        : "failed",
    ],
    [
      "model_allow_list",
      evidence.safetyRows.filter((row) => row.providerId === evidence.primaryProviderId)
        .every((row) => row.allowedModelFamilyCount > 0)
        ? "passed"
        : "failed",
    ],
    [
      "safety_guardrails",
      evidence.safetyRows.filter((row) => row.providerId === evidence.primaryProviderId)
        .every((row) => row.guardrailCount >= 4)
        ? "passed"
        : "failed",
    ],
    [
      "unsupported_controls",
      evidence.unsupportedControlRows.some(
        (row) => row.blockingImpact === "blocks_apply_until_provider_selected",
      )
        ? "passed"
        : "failed",
    ],
    [
      "apply_blocked",
      buildModelAuditAndSafetyReadinessEvidence(setup, "apply").decision ===
        "blocked_for_apply"
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

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>426 model audit and safety verification harness</title>
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
        pre { white-space: pre-wrap; background: #ffffff; border: 1px solid #d7dde8; border-radius: 6px; padding: 12px; font-size: 12px; }
      </style>
    </head>
    <body>
      <main>
        <h1>426 model audit and safety verification harness</h1>
        <div data-testid="verify-mode">verify</div>
        <table aria-label="Verification checks">
          <thead><tr><th>Check</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <button data-testid="run-verify" type="button">Verify</button>
        <div id="banner" data-testid="verify-banner" data-action="ready">Ready</div>
        <pre data-testid="readiness-json">${escapeHtml(JSON.stringify(evidence, null, 2))}</pre>
      </main>
      <script>
        document.querySelector('[data-testid="run-verify"]').addEventListener('click', () => {
          const banner = document.querySelector('[data-testid="verify-banner"]');
          banner.textContent = 'Verify completed: audit, retention, allow-list, safety, unsupported-control, and apply-block checks passed.';
          banner.dataset.action = 'verify_completed';
        });
      </script>
    </body>
  </html>`;

  await assertSecretSafeText(html, "426-verify-harness-html");
  return html;
}

export async function run(): Promise<void> {
  const setup = readAndValidateModelAuditAndSafetySetup();
  const evidence = buildModelAuditAndSafetyReadinessEvidence(setup, "verify");

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
    await page.setContent(await renderVerifyHarness(), {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("check-row-manifest_validation").waitFor();
    for (const checkId of [
      "manifest_validation",
      "audit_logging",
      "event_export",
      "retention",
      "model_allow_list",
      "safety_guardrails",
      "unsupported_controls",
      "apply_blocked",
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
    await assertSecretSafePage(page, "426-verify-page");
    assertCondition(
      externalRequests.size === 0,
      `426 verify harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({
      path: outputPath("426-verify-model-audit-and-safety.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    writeJson(outputPath("426-verify-readiness-summary.json"), evidence);
  } finally {
    if (policy.recordTraceOnlyForRedactedHarness) {
      await context.tracing.stop({
        path: outputPath("426-verify-model-audit-and-safety-trace.zip"),
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

