import {
  assertCondition,
  importPlaywright,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";
import {
  clearObservabilityStore,
  readObservabilityStore,
  seedWorkspaceAndSupportEventChains,
} from "./269_validation_helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1040 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await clearObservabilityStore(page, baseUrl);
    await seedWorkspaceAndSupportEventChains(page, baseUrl);

    const snapshot = await readObservabilityStore(page);
    const actionFamilies = new Set(snapshot.events.map((event: any) => event.actionFamily));
    for (const actionFamily of [
      "claim",
      "start_review",
      "request_more_info",
      "approve",
      "escalate",
      "reopen",
      "message_action",
      "self_care_action",
      "support_replay",
      "support_restore",
      "history_reveal",
      "knowledge_reveal",
    ]) {
      assertCondition(actionFamilies.has(actionFamily), `missing action family ${actionFamily}`);
    }

    assertCondition(
      snapshot.events.every((event: any) => typeof event.edgeCorrelationId === "string" && event.edgeCorrelationId.startsWith("edge_")),
      "every event should publish an edge correlation id",
    );
    assertCondition(
      snapshot.settlements.length >= snapshot.events.length - 1,
      "critical flows should join almost all events to settlements",
    );

    await page.goto(`${baseUrl}/workspace/validation?state=live`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceValidationRoute']").waitFor();
    const northStar = page.locator("[data-testid='ValidationNorthStarBand']");
    assertCondition(
      (await northStar.textContent())?.includes("settlement"),
      "validation north-star band should summarize settlement truth",
    );
    const supportIntegrity = page.locator("[data-testid='SupportFlowIntegrityBoard']");
    assertCondition(
      (await supportIntegrity.textContent())?.toLowerCase().includes("support"),
      "support integrity panel should render support-chain proof",
    );

    await context.tracing.stop({ path: outputPath("269-workspace-support-event-chains-trace.zip") });
    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
