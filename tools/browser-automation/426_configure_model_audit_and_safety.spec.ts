import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  buildModelAuditAndSafetyReadinessEvidence,
  readAndValidateModelAuditAndSafetySetup,
  type OperationMode,
  type ProviderId,
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

const ENVIRONMENT_BROWSER_PROFILES = [
  {
    environmentId: "development_local_twin",
    viewport: { width: 1280, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  },
  {
    environmentId: "integration_candidate",
    viewport: { width: 1440, height: 960 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  },
  {
    environmentId: "preprod_rehearsal",
    viewport: { width: 1366, height: 920 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  },
] as const;

function outputPath(fileName: string): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return path.join(OUTPUT_DIR, fileName);
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function resolveMode(): OperationMode {
  const arg = process.argv.find((entry) => entry.startsWith("--mode="));
  const mode = arg?.split("=")[1] ?? "dry_run";
  if (!["dry_run", "rehearsal", "apply", "verify"].includes(mode)) {
    throw new Error(`Unsupported 426 mode: ${mode}`);
  }
  return mode as OperationMode;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slug(value: string): string {
  return value.replaceAll("_", "-");
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

async function renderConfigureHarness(
  mode: OperationMode,
  environmentId: string,
): Promise<string> {
  const setup = readAndValidateModelAuditAndSafetySetup();
  const evidence = buildModelAuditAndSafetyReadinessEvidence(setup, mode);
  const auditRows = evidence.auditRows
    .filter((row) => row.environmentId === environmentId)
    .map(
      (row) => `
        <tr data-testid="audit-row-${escapeHtml(row.auditControlId)}" data-status="${escapeHtml(row.status)}">
          <td>${escapeHtml(row.auditControlId)}</td>
          <td>${escapeHtml(row.providerId)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.retentionDays ?? "blocked")}</td>
          <td>${escapeHtml(row.eventClassCount)}</td>
          <td>${escapeHtml(row.payloadPolicy)}</td>
        </tr>`,
    )
    .join("");
  const safetyRows = evidence.safetyRows
    .filter((row) => row.environmentId === environmentId)
    .map(
      (row) => `
        <tr data-testid="safety-row-${escapeHtml(row.safetyControlId)}" data-status="${escapeHtml(row.status)}">
          <td>${escapeHtml(row.safetyControlId)}</td>
          <td>${escapeHtml(row.providerId)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.allowedModelFamilyCount)}</td>
          <td>${escapeHtml(row.guardrailCount)}</td>
          <td>${escapeHtml(row.humanReviewPosture)}</td>
        </tr>`,
    )
    .join("");
  const unsupportedRows = evidence.unsupportedControlRows
    .filter((row) => row.environmentId === environmentId)
    .map(
      (row) => `
        <tr data-testid="unsupported-row-${escapeHtml(row.unsupportedControlId)}" data-impact="${escapeHtml(row.blockingImpact)}">
          <td>${escapeHtml(row.unsupportedControlId)}</td>
          <td>${escapeHtml(row.controlFamily)}</td>
          <td>${escapeHtml(row.currentState)}</td>
          <td>${escapeHtml(row.blockingImpact)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>426 model audit and safety configuration harness</title>
      <style>
        :root { color-scheme: light; font-family: Inter, Arial, sans-serif; }
        body { margin: 0; background: #f6f8fb; color: #182230; }
        main { max-width: 1180px; margin: 0 auto; padding: 28px; }
        header { border-bottom: 1px solid #d7dde8; padding-bottom: 18px; margin-bottom: 22px; }
        h1 { font-size: 24px; margin: 0 0 8px; letter-spacing: 0; }
        h2 { font-size: 16px; margin: 24px 0 10px; letter-spacing: 0; }
        .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .metric { background: #ffffff; border: 1px solid #d7dde8; border-radius: 6px; padding: 12px; }
        .label { color: #536276; font-size: 12px; margin-bottom: 6px; }
        .value { font-weight: 700; overflow-wrap: anywhere; }
        table { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #d7dde8; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e9f0; font-size: 13px; vertical-align: top; }
        th { background: #eef2f6; color: #243044; }
        button { border: 1px solid #9aa7b8; background: #ffffff; border-radius: 6px; padding: 8px 10px; margin-right: 8px; cursor: pointer; }
        button[disabled] { color: #6b7280; background: #edf0f4; cursor: not-allowed; }
        #banner { margin-top: 14px; padding: 10px; border: 1px solid #c8d1dc; background: #ffffff; border-radius: 6px; }
        pre { white-space: pre-wrap; background: #ffffff; border: 1px solid #d7dde8; border-radius: 6px; padding: 12px; font-size: 12px; }
      </style>
    </head>
    <body>
      <main>
        <header>
          <h1>426 model audit and safety configuration harness</h1>
          <div data-testid="environment-id">${escapeHtml(environmentId)}</div>
          <div data-testid="primary-provider">${escapeHtml(evidence.primaryProviderId)}</div>
        </header>
        <section class="summary" aria-label="Audit and safety summary">
          <div class="metric"><div class="label">Mode</div><div class="value" data-testid="mode">${escapeHtml(mode)}</div></div>
          <div class="metric"><div class="label">Decision</div><div class="value" data-testid="decision">${escapeHtml(evidence.decision)}</div></div>
          <div class="metric"><div class="label">Validation issues</div><div class="value" data-testid="issue-count">${escapeHtml(evidence.validationIssueCount)}</div></div>
          <div class="metric"><div class="label">Evidence digest</div><div class="value" data-testid="evidence-digest">${escapeHtml(evidence.evidenceDigest)}</div></div>
        </section>
        <section>
          <h2>Audit Controls</h2>
          <table aria-label="Audit controls">
            <thead><tr><th>Control</th><th>Provider</th><th>Status</th><th>Retention</th><th>Events</th><th>Payload policy</th></tr></thead>
            <tbody>${auditRows}</tbody>
          </table>
        </section>
        <section>
          <h2>Safety Controls</h2>
          <table aria-label="Safety controls">
            <thead><tr><th>Control</th><th>Provider</th><th>Status</th><th>Models</th><th>Guardrails</th><th>Human review</th></tr></thead>
            <tbody>${safetyRows}</tbody>
          </table>
        </section>
        <section>
          <h2>Unsupported Controls</h2>
          <table aria-label="Unsupported controls">
            <thead><tr><th>Control</th><th>Family</th><th>State</th><th>Impact</th></tr></thead>
            <tbody>${unsupportedRows}</tbody>
          </table>
        </section>
        <section>
          <h2>Actions</h2>
          <button data-testid="run-dry-run" type="button">Dry run</button>
          <button data-testid="run-rehearsal" type="button">Rehearsal</button>
          <button data-testid="run-verify" type="button">Verify</button>
          <button data-testid="run-apply" type="button" disabled>Apply blocked</button>
          <div id="banner" data-testid="configure-banner" data-action="ready">Ready</div>
        </section>
        <section>
          <h2>Readiness Evidence</h2>
          <pre data-testid="readiness-json">${escapeHtml(JSON.stringify(evidence, null, 2))}</pre>
        </section>
      </main>
      <script>
        const banner = document.querySelector('[data-testid="configure-banner"]');
        document.querySelector('[data-testid="run-dry-run"]').addEventListener('click', () => {
          banner.textContent = 'Dry-run completed: audit and safety baselines validated.';
          banner.dataset.action = 'dry_run_completed';
        });
        document.querySelector('[data-testid="run-rehearsal"]').addEventListener('click', () => {
          banner.textContent = 'Rehearsal completed: apply remains blocked.';
          banner.dataset.action = 'rehearsal_completed';
        });
        document.querySelector('[data-testid="run-verify"]').addEventListener('click', () => {
          banner.textContent = 'Verify completed: machine-readable evidence exported.';
          banner.dataset.action = 'verify_completed';
        });
      </script>
    </body>
  </html>`;

  await assertSecretSafeText(html, "426-configure-harness-html");
  return html;
}

async function verifyEnvironment(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  mode: OperationMode,
  profile: (typeof ENVIRONMENT_BROWSER_PROFILES)[number],
): Promise<void> {
  const context = await browser.newContext({
    viewport: profile.viewport,
    locale: profile.locale,
    timezoneId: profile.timezoneId,
  });
  const page = await context.newPage();
  const externalRequests = new Set<string>();
  trackExternalRequests(page, externalRequests);
  const policy = safeEvidencePolicy();

  try {
    if (policy.recordTraceOnlyForRedactedHarness) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    await page.setContent(await renderConfigureHarness(mode, profile.environmentId), {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("environment-id").waitFor();
    assertCondition(
      (await page.getByTestId("primary-provider").innerText()) ===
        "vecells_assistive_vendor_watch_shadow_twin",
      "Primary provider should remain the local watch shadow twin.",
    );
    assertCondition(
      await page.getByTestId("run-apply").isDisabled(),
      "Apply must remain disabled in task 426.",
    );
    if (mode === "apply") {
      assertCondition(
        (await page.getByTestId("decision").innerText()) === "blocked_for_apply",
        "Apply mode must fail closed.",
      );
    } else {
      assertCondition(
        (await page.getByTestId("decision").innerText()) ===
          "ready_for_dry_run_rehearsal_verify",
        "Dry-run, rehearsal, and verify modes should be ready for current local baseline.",
      );
    }
    await page.getByTestId("run-dry-run").click();
    assertCondition(
      (await page.getByTestId("configure-banner").getAttribute("data-action")) ===
        "dry_run_completed",
      "Dry-run action did not settle.",
    );
    await page.getByTestId("run-rehearsal").click();
    assertCondition(
      (await page.getByTestId("configure-banner").getAttribute("data-action")) ===
        "rehearsal_completed",
      "Rehearsal action did not settle.",
    );
    await assertSecretSafePage(page, `426-configure-${profile.environmentId}`);
    assertCondition(
      externalRequests.size === 0,
      `426 configure harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({
      path: outputPath(`426-configure-${slug(profile.environmentId)}-${slug(mode)}.png`),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  } finally {
    if (policy.recordTraceOnlyForRedactedHarness) {
      await context.tracing.stop({
        path: outputPath(
          `426-configure-${slug(profile.environmentId)}-${slug(mode)}-trace.zip`,
        ),
      });
    }
    await context.close();
  }
}

export async function run(): Promise<void> {
  const mode = resolveMode();
  const setup = readAndValidateModelAuditAndSafetySetup();
  const evidence = buildModelAuditAndSafetyReadinessEvidence(setup, mode);

  assertCondition(setup.validation.valid, JSON.stringify(setup.validation.issues, null, 2));
  assertCondition(
    mode === "apply" || evidence.decision === "ready_for_dry_run_rehearsal_verify",
    `Unexpected readiness decision: ${evidence.decision}`,
  );
  assertCondition(
    mode !== "apply" || evidence.decision === "blocked_for_apply",
    "Apply mode must be blocked for current baseline.",
  );

  const browser = await chromium.launch({ headless: true });
  try {
    for (const profile of ENVIRONMENT_BROWSER_PROFILES) {
      await verifyEnvironment(browser, mode, profile);
    }
    writeJson(outputPath(`426-configure-readiness-summary-${slug(mode)}.json`), evidence);
    writeJson(outputPath("426-configure-readiness-summary.json"), evidence);
  } finally {
    await browser.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
