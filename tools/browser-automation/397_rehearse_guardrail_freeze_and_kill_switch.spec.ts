import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  load397JsonFile,
  rehearse397GuardrailFreezeAndKillSwitch,
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
  const rehearsal = rehearse397GuardrailFreezeAndKillSwitch({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "397_guardrail_freeze_and_kill_switch_rehearsal.json"),
    JSON.stringify({ mode, rehearsal }, null, 2),
  );
  if (!rehearsal.disabledJumpOffWithoutRedeploy) {
    throw new Error("397 kill-switch rehearsal did not disable jump-off without redeploy.");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  try {
    if (mode !== "dry-run") {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    await page.setContent(renderRehearsalPage(rehearsal), { waitUntil: "domcontentloaded" });
    await page.getByTestId("open-freeze").click();
    await page.getByText("Freeze record opened").waitFor();
    await page.getByTestId("activate-kill-switch").click();
    await page.getByText("Jump-off disabled without redeploy").waitFor();
    await assert397RedactionSafePage(page, "397 freeze and kill switch rehearsal");
    if (mode !== "dry-run") {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "397_guardrail_freeze_and_kill_switch.png"),
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
      await context.tracing.stop({
        path: path.join(OUTPUT_DIR, "397_guardrail_freeze_and_kill_switch_trace.zip"),
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

function renderRehearsalPage(
  rehearsal: ReturnType<typeof rehearse397GuardrailFreezeAndKillSwitch>,
): string {
  const dispositions = rehearsal.routeDispositions
    .map(
      (disposition) => `<tr>
        <td>${disposition.journeyPathRef}</td>
        <td>${disposition.freezeMode}</td>
        <td>${disposition.safeRouteRef ?? "none"}</td>
      </tr>`,
    )
    .join("");
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>397 Guardrail Freeze and Kill Switch</title>
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
        <h1>397 Guardrail Freeze and Kill Switch</h1>
        <p>Freeze decision: ${rehearsal.freezeDecision.decision}</p>
        <p>Kill-switch decision: ${rehearsal.killSwitchDecision.decision}</p>
        <button data-testid="open-freeze" type="button">Open freeze</button>
        <button data-testid="activate-kill-switch" type="button">Activate kill switch</button>
        <div id="status" class="status" aria-live="polite">Waiting for rehearsal.</div>
        <table aria-label="Route freeze dispositions">
          <thead><tr><th>Journey</th><th>Mode</th><th>Safe route</th></tr></thead>
          <tbody>${dispositions}</tbody>
        </table>
      </main>
      <script>
        const status = document.getElementById("status");
        document.querySelector("[data-testid='open-freeze']").addEventListener("click", () => {
          status.textContent = "Freeze record opened";
        });
        document.querySelector("[data-testid='activate-kill-switch']").addEventListener("click", () => {
          status.textContent = "Jump-off disabled without redeploy";
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
  return arg?.split("=")[1] ?? "verify-only";
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
