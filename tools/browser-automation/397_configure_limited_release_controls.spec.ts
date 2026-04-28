import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  load397JsonFile,
  validateChannelReleaseCohortManifest,
  validateReleaseGuardrailPolicyManifest,
  validateRouteFreezeDispositionManifest,
  type ChannelReleaseCohortManifest,
  type ReleaseGuardrailPolicyManifest,
  type RouteFreezeDispositionManifest,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";

const ROOT = "/Users/test/Code/V";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export async function run(): Promise<void> {
  const mode = readMode();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const cohortManifest = load397JsonFile<ChannelReleaseCohortManifest>(
    "data/config/397_channel_release_cohort_manifest.example.json",
    ROOT,
  );
  const guardrailManifest = load397JsonFile<ReleaseGuardrailPolicyManifest>(
    "data/config/397_release_guardrail_policy_manifest.example.json",
    ROOT,
  );
  const dispositionManifest = load397JsonFile<RouteFreezeDispositionManifest>(
    "data/config/397_route_freeze_disposition_manifest.example.json",
    ROOT,
  );
  const validations = {
    cohorts: validateChannelReleaseCohortManifest(cohortManifest),
    guardrails: validateReleaseGuardrailPolicyManifest(guardrailManifest),
    dispositions: validateRouteFreezeDispositionManifest(dispositionManifest),
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "397_configure_limited_release_controls_report.json"),
    JSON.stringify({ mode, validations }, null, 2),
  );
  if (Object.values(validations).some((validation) => validation.readinessState !== "ready")) {
    throw new Error("397 limited-release control manifests are not ready.");
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
    if (mode === "capture-evidence") {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    await page.setContent(renderConfigurePage(cohortManifest, validations), {
      waitUntil: "domcontentloaded",
    });
    await page.getByTestId("validate-cohort").click();
    await page.getByText("Cohort manifest applied").waitFor();
    await page.getByTestId("validate-guardrails").click();
    await page.getByText("Guardrails armed").waitFor();
    await assert397RedactionSafePage(page, "397 configure limited release controls");
    if (mode !== "dry-run") {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "397_configure_limited_release_controls.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
    }
    if (mode === "capture-evidence") {
      await context.tracing.stop({
        path: path.join(OUTPUT_DIR, "397_configure_limited_release_controls_trace.zip"),
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

function renderConfigurePage(
  manifest: ChannelReleaseCohortManifest,
  validations: {
    readonly cohorts: ReturnType<typeof validateChannelReleaseCohortManifest>;
    readonly guardrails: ReturnType<typeof validateReleaseGuardrailPolicyManifest>;
    readonly dispositions: ReturnType<typeof validateRouteFreezeDispositionManifest>;
  },
): string {
  const rows = manifest.cohorts
    .map(
      (cohort) => `<tr>
        <td>${cohort.cohortId}</td>
        <td>${cohort.releaseStage}</td>
        <td>${cohort.environment}</td>
        <td>${cohort.enabledJourneys.join(", ")}</td>
        <td>${cohort.exposureCeiling}</td>
      </tr>`,
    )
    .join("");
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>397 Configure Limited Release Controls</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #102033; background: #f7f9fb; }
        main { max-width: 1120px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { border: 1px solid #ccd7e0; padding: 10px; text-align: left; vertical-align: top; }
        button { margin: 12px 12px 12px 0; padding: 10px 14px; }
        .status { margin-top: 16px; padding: 12px; background: #e7f4ee; border: 1px solid #6fb58c; }
      </style>
    </head>
    <body>
      <main>
        <h1>397 Configure Limited Release Controls</h1>
        <p>Release tuple: ${manifest.releaseTuple.releaseApprovalFreezeRef}</p>
        <p>Validation states: ${validations.cohorts.readinessState}, ${validations.guardrails.readinessState}, ${validations.dispositions.readinessState}</p>
        <button data-testid="validate-cohort" type="button">Apply cohorts</button>
        <button data-testid="validate-guardrails" type="button">Arm guardrails</button>
        <div id="status" class="status" aria-live="polite">Waiting for operator rehearsal.</div>
        <table aria-label="NHS App release cohorts">
          <thead><tr><th>Cohort</th><th>Stage</th><th>Environment</th><th>Journeys</th><th>Ceiling</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </main>
      <script>
        const status = document.getElementById("status");
        document.querySelector("[data-testid='validate-cohort']").addEventListener("click", () => {
          status.textContent = "Cohort manifest applied";
        });
        document.querySelector("[data-testid='validate-guardrails']").addEventListener("click", () => {
          status.textContent = "Guardrails armed";
        });
      </script>
    </body>
  </html>`;
}

async function assert397RedactionSafePage(page: Page, label: string): Promise<void> {
  const content = await page.content();
  if (
    /assertedLoginIdentity|asserted_login_identity|Bearer\s+[A-Za-z0-9]|grantId|patientId|nhsNumber/iu.test(
      content,
    )
  ) {
    throw new Error(`${label} contains sensitive browser evidence.`);
  }
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
