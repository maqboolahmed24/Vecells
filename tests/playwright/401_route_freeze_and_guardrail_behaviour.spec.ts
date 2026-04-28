import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startOpsConsole,
  stopOpsConsole,
} from "./386_nhs_app_readiness.helpers";
import {
  buildDefault397ChannelReleaseCohortManifest,
  buildDefault397ReleaseGuardrailPolicyManifest,
  buildDefault397RouteFreezeDispositionManifest,
  create397ReleaseControlApplication,
  rehearse397GuardrailFreezeAndKillSwitch,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";

export async function run(): Promise<void> {
  const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest = buildDefault397RouteFreezeDispositionManifest();
  const cohortId = cohortManifest.cohorts[0]?.cohortId;
  assertCondition(Boolean(cohortId), "401 guardrail proof missing cohort");

  const scenarios = [
    { trigger: "telemetry_missing", observationWindow: { telemetryPresent: false } },
    { trigger: "threshold_breach", observationWindow: { journeyErrorRate: 0.04 } },
    {
      trigger: "assurance_slice_degraded",
      observationWindow: { assuranceSliceState: "quarantined" as const },
    },
    {
      trigger: "compatibility_drift",
      observationWindow: { compatibilityEvidenceState: "stale" as const },
    },
    {
      trigger: "continuity_evidence_degraded",
      observationWindow: { continuityEvidenceState: "missing" as const },
    },
  ] as const;

  const decisions = scenarios.map((scenario) => {
    const application = create397ReleaseControlApplication({
      cohortManifest,
      guardrailManifest,
      dispositionManifest,
    });
    return {
      trigger: scenario.trigger,
      result: application.evaluateCohort({
        cohortId,
        observationWindow: scenario.observationWindow,
        operatorNoteRef: `OperatorNote:401:${scenario.trigger}`,
      }),
    };
  });
  for (const decision of decisions) {
    assertCondition(
      decision.result.freezeRecord?.triggerType === decision.trigger,
      `401 ${decision.trigger} did not create expected freeze`,
    );
    assertCondition(
      decision.result.routeDispositions.length > 0,
      `401 ${decision.trigger} did not resolve route dispositions`,
    );
  }

  const rehearsal = rehearse397GuardrailFreezeAndKillSwitch({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  assertCondition(rehearsal.disabledJumpOffWithoutRedeploy, "401 kill switch was not reversible");
  fs.writeFileSync(
    outputPath("401-route-freeze-guardrail-summary.json"),
    JSON.stringify({ decisions, rehearsal }, null, 2),
    "utf8",
  );

  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/release/nhs-app/cases/jp_manage_local_appointment?case=SUP-398-002&tab=freeze&event=evt-398-freeze&dock=true`,
      { waitUntil: "networkidle" },
    );
    const root = page.getByTestId("NHSAppChannelControlWorkbench");
    await root.waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-route-family")) === "appointment_manage",
      "401 ops workbench did not select appointment route",
    );
    assertCondition(
      (await page.getByTestId("NHSAppRouteFreezeInspector").getAttribute("data-freeze-posture")) ===
        "redirect_to_safe_route",
      "401 freeze inspector did not render governed safe-route disposition",
    );
    assertCondition(
      (await page
        .getByTestId("NHSAppSupportRecoveryActionBar")
        .getAttribute("data-recovery-kind")) === "browser_safe_route",
      "401 recovery action was not browser-safe",
    );
    assertCondition(
      page.url().includes("freeze=redirect_to_safe_route") && page.url().includes("tab=freeze"),
      `401 route-freeze state not serialized: ${page.url()}`,
    );
    await page.getByTestId("ChannelInspectorDockToggle").click();
    assertCondition(
      page.url().includes("dock=false"),
      `401 dock state not serialized: ${page.url()}`,
    );
    await assertNoHorizontalOverflow(page);
  } finally {
    await context.tracing.stop({ path: outputPath("401-route-freeze-guardrail-trace.zip") });
    await context.close();
    await browser.close();
    await stopOpsConsole(server.process);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
