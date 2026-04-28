import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  buildReadinessEvidence,
  detectPrimaryConfiguredVendorFromRepository,
  readAndValidateModelVendorSetup,
  resolvePrimaryConfiguredVendor,
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

function resolveMode(): OperationMode {
  const arg = process.argv.find((entry) => entry.startsWith("--mode="));
  const mode = arg?.split("=")[1] ?? "dry_run";
  if (!["dry_run", "rehearsal", "apply", "verify"].includes(mode)) {
    throw new Error(`Unsupported 425 mode: ${mode}`);
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

async function renderHarness(mode: OperationMode): Promise<string> {
  const setup = readAndValidateModelVendorSetup();
  const detection = detectPrimaryConfiguredVendorFromRepository();
  const primary = resolvePrimaryConfiguredVendor(setup.registry);
  const evidence = buildReadinessEvidence(setup, mode);

  const projectRows = evidence.projectRows
    .map(
      (row) => `
        <tr data-testid="project-row-${escapeHtml(row.projectId)}" data-apply="${escapeHtml(row.applyAllowed)}">
          <td>${escapeHtml(row.projectId)}</td>
          <td>${escapeHtml(row.providerId)}</td>
          <td>${escapeHtml(row.environmentId)}</td>
          <td>${escapeHtml(row.projectIdentityStatus)}</td>
          <td>${escapeHtml(row.serviceIdentityCount)}</td>
          <td>${escapeHtml(row.applyAllowed ? "apply-enabled" : "apply-blocked")}</td>
        </tr>`,
    )
    .join("");
  const keyRows = evidence.keyReferenceRows
    .map(
      (row) => `
        <tr data-testid="key-row-${escapeHtml(row.keyReferenceId)}">
          <td>${escapeHtml(row.keyReferenceId)}</td>
          <td>${escapeHtml(row.providerId)}</td>
          <td>${escapeHtml(row.environmentId)}</td>
          <td>${escapeHtml(row.keyStatus)}</td>
          <td>${escapeHtml(row.maskedFingerprint)}</td>
          <td>${escapeHtml(row.scopeCount)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>425 model vendor project provisioning harness</title>
      <style>
        :root { color-scheme: light; font-family: Inter, Arial, sans-serif; }
        body { margin: 0; background: #f6f8fb; color: #182230; }
        main { max-width: 1180px; margin: 0 auto; padding: 28px; }
        header { border-bottom: 1px solid #d7dde8; padding-bottom: 18px; margin-bottom: 22px; }
        h1 { font-size: 24px; margin: 0 0 8px; letter-spacing: 0; }
        h2 { font-size: 16px; margin: 24px 0 10px; letter-spacing: 0; }
        .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
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
          <h1>425 model vendor project provisioning harness</h1>
          <div data-testid="primary-provider">${escapeHtml(primary.providerId)}</div>
          <div data-testid="detection-state">${escapeHtml(detection.detectionState)}</div>
        </header>
        <section class="summary" aria-label="Provisioning summary">
          <div class="metric"><div class="label">Mode</div><div class="value" data-testid="mode">${escapeHtml(mode)}</div></div>
          <div class="metric"><div class="label">Decision</div><div class="value" data-testid="decision">${escapeHtml(evidence.decision)}</div></div>
          <div class="metric"><div class="label">Validation issues</div><div class="value" data-testid="issue-count">${escapeHtml(evidence.validationIssueCount)}</div></div>
        </section>
        <section>
          <h2>Projects</h2>
          <table aria-label="Project readiness">
            <thead><tr><th>Project</th><th>Provider</th><th>Environment</th><th>Status</th><th>Identities</th><th>Apply</th></tr></thead>
            <tbody>${projectRows}</tbody>
          </table>
        </section>
        <section>
          <h2>Key References</h2>
          <table aria-label="Key reference readiness">
            <thead><tr><th>Key ref</th><th>Provider</th><th>Environment</th><th>Status</th><th>Masked fingerprint</th><th>Scopes</th></tr></thead>
            <tbody>${keyRows}</tbody>
          </table>
        </section>
        <section>
          <h2>Actions</h2>
          <button data-testid="run-dry-run" type="button">Dry run</button>
          <button data-testid="run-rehearsal" type="button">Rehearsal</button>
          <button data-testid="run-verify" type="button">Verify</button>
          <button data-testid="run-apply" type="button" disabled>Apply blocked</button>
          <div id="banner" data-testid="provision-banner" data-action="ready">Ready</div>
        </section>
        <section>
          <h2>Readiness Evidence</h2>
          <pre data-testid="readiness-json">${escapeHtml(JSON.stringify(evidence, null, 2))}</pre>
        </section>
      </main>
      <script>
        const banner = document.querySelector('[data-testid="provision-banner"]');
        document.querySelector('[data-testid="run-dry-run"]').addEventListener('click', () => {
          banner.textContent = 'Dry-run completed: local watch-twin references validated.';
          banner.dataset.action = 'dry_run_completed';
        });
        document.querySelector('[data-testid="run-rehearsal"]').addEventListener('click', () => {
          banner.textContent = 'Rehearsal completed: apply remains blocked.';
          banner.dataset.action = 'rehearsal_completed';
        });
        document.querySelector('[data-testid="run-verify"]').addEventListener('click', () => {
          banner.textContent = 'Verify completed: masked fingerprints and scope joins passed.';
          banner.dataset.action = 'verify_completed';
        });
      </script>
    </body>
  </html>`;

  await assertSecretSafeText(html, "425-provision-harness-html");
  return html;
}

export async function run(): Promise<void> {
  const mode = resolveMode();
  const setup = readAndValidateModelVendorSetup();
  const detection = detectPrimaryConfiguredVendorFromRepository();
  const evidence = buildReadinessEvidence(setup, mode);

  assertCondition(setup.validation.valid, JSON.stringify(setup.validation.issues, null, 2));
  assertCondition(
    detection.detectionState === "watch_only_local_twin",
    `Unexpected provider detection state: ${detection.detectionState}`,
  );
  assertCondition(
    evidence.decision !== "blocked_by_validation",
    "Readiness evidence must not be blocked by validation issues.",
  );

  const policy = safeEvidencePolicy();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
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
    await page.setContent(await renderHarness(mode), {
      waitUntil: "domcontentloaded",
    });

    await page.getByTestId("primary-provider").waitFor();
    assertCondition(
      (await page.getByTestId("primary-provider").innerText()) ===
        "vecells_assistive_vendor_watch_shadow_twin",
      "Primary provider should resolve to the local watch shadow twin.",
    );
    assertCondition(
      (await page.getByTestId("detection-state").innerText()) ===
        "watch_only_local_twin",
      "Provider detection should be watch_only_local_twin before provisioning.",
    );

    await page.getByTestId("run-dry-run").click();
    assertCondition(
      (await page.getByTestId("provision-banner").getAttribute("data-action")) ===
        "dry_run_completed",
      "Dry-run action did not settle.",
    );
    await page.getByTestId("run-rehearsal").click();
    assertCondition(
      (await page.getByTestId("provision-banner").getAttribute("data-action")) ===
        "rehearsal_completed",
      "Rehearsal action did not settle.",
    );
    assertCondition(
      await page.getByTestId("run-apply").isDisabled(),
      "Apply must remain disabled in task 425.",
    );
    await assertSecretSafePage(page, "425-provision-page");
    assertCondition(
      externalRequests.size === 0,
      `425 provisioning harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("425-provision-model-vendor-projects.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    writeJson(outputPath("425-provision-readiness-summary.json"), evidence);
  } finally {
    if (policy.recordTraceOnlyForRedactedHarness) {
      await context.tracing.stop({
        path: outputPath("425-provision-model-vendor-projects-trace.zip"),
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
