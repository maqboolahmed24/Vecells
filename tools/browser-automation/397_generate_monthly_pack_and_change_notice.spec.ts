import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  assert397MonthlyPackRedactionSafe,
  create397ReleaseControlApplication,
  generate397MonthlyPerformancePack,
  load397JsonFile,
  submit397JourneyChangeNotice,
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
  const application = create397ReleaseControlApplication({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  const pack = generate397MonthlyPerformancePack({
    application,
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
    environment: "limited_release",
    period: "2026-05",
  });
  const redaction = assert397MonthlyPackRedactionSafe(pack);
  const notice = submit397JourneyChangeNotice({
    application,
    cohortManifest,
    changeType: "minor",
    affectedJourneys: ["jp_start_medical_request"],
    submittedAt: "2026-04-27T08:15:00.000Z",
    plannedChangeAt: "2026-05-30T08:15:00.000Z",
    integrationManagerRef: "IntegrationManager:nhs-app-phase7",
  });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "397_monthly_pack_and_change_notice.json"),
    JSON.stringify({ mode, pack, redaction, notice }, null, 2),
  );
  if (!redaction.safeForExport || notice.approvalState !== "submitted") {
    throw new Error("397 monthly pack or change notice failed readiness checks.");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  try {
    if (mode === "capture-evidence") {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    await page.setContent(renderPackPage(pack, notice), { waitUntil: "domcontentloaded" });
    await page.getByTestId("generate-pack").click();
    await page.getByText("Monthly pack redaction checked").waitFor();
    await page.getByTestId("submit-notice").click();
    await page.getByText("Change notice submitted").waitFor();
    await assert397RedactionSafePage(page, "397 monthly pack and change notice");
    if (mode !== "dry-run") {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "397_monthly_pack_and_change_notice.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
    }
    if (mode === "capture-evidence") {
      await context.tracing.stop({
        path: path.join(OUTPUT_DIR, "397_monthly_pack_and_change_notice_trace.zip"),
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

function renderPackPage(
  pack: ReturnType<typeof generate397MonthlyPerformancePack>,
  notice: ReturnType<typeof submit397JourneyChangeNotice>,
): string {
  const rows = pack.journeyUsage
    .map(
      (usage) => `<tr>
        <td>${usage.journeyPathRef}</td>
        <td>${usage.routeEntryCount}</td>
        <td>${usage.successfulCompletionCount}</td>
      </tr>`,
    )
    .join("");
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>397 Monthly Pack and Change Notice</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #102033; background: #f7f9fb; }
        main { max-width: 1080px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { border: 1px solid #ccd7e0; padding: 10px; text-align: left; }
        button { margin: 12px 12px 12px 0; padding: 10px 14px; }
        .status { margin-top: 16px; padding: 12px; background: #e7f4ee; border: 1px solid #6fb58c; }
      </style>
    </head>
    <body>
      <main>
        <h1>397 Monthly Pack and Change Notice</h1>
        <p>Pack: ${pack.packId}</p>
        <p>Notice: ${notice.noticeId} (${notice.approvalState})</p>
        <button data-testid="generate-pack" type="button">Check monthly pack</button>
        <button data-testid="submit-notice" type="button">Submit change notice</button>
        <div id="status" class="status" aria-live="polite">Waiting for rehearsal.</div>
        <table aria-label="Monthly pack journey usage">
          <thead><tr><th>Journey</th><th>Entries</th><th>Completions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </main>
      <script>
        const status = document.getElementById("status");
        document.querySelector("[data-testid='generate-pack']").addEventListener("click", () => {
          status.textContent = "Monthly pack redaction checked";
        });
        document.querySelector("[data-testid='submit-notice']").addEventListener("click", () => {
          status.textContent = "Change notice submitted";
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
  return arg?.split("=")[1] ?? "capture-evidence";
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
