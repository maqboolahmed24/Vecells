import {
  assertCondition,
  importPlaywright,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";
import {
  clearObservabilityStore,
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
    const page = await browser.newPage({ viewport: { width: 1500, height: 1040 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await clearObservabilityStore(page, baseUrl);
    await seedWorkspaceAndSupportEventChains(page, baseUrl);

    await page.goto(`${baseUrl}/workspace/validation?state=live`, { waitUntil: "networkidle" });
    const route = page.locator("[data-testid='WorkspaceValidationRoute']");
    await route.waitFor();
    assertCondition(
      (await route.getAttribute("data-visual-mode")) === "Clinical_Beta_Validation_Deck",
      "validation board should publish the required visual mode",
    );
    assertCondition(
      (await route.getAttribute("data-feature-flag")) === "phase3_internal_validation",
      "validation board should publish the feature flag",
    );

    for (const testId of [
      "ValidationNorthStarBand",
      "MetricGuardrailMatrix",
      "EventChainInspector",
      "RedactionFenceVerifier",
      "RouteContractDriftPanel",
      "SupportFlowIntegrityBoard",
      "DefectAndRemediationLedger",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    await page.locator("[data-testid='ValidationRouteFamilySelect']").selectOption("rf_support_ticket_workspace");
    const supportBoardText = await page.locator("[data-testid='SupportFlowIntegrityBoard']").textContent();
    assertCondition(
      (supportBoardText ?? "").toLowerCase().includes("support"),
      "support filter should keep support integrity content visible",
    );

    await page.locator("[data-testid='ValidationActionFamilySelect']").selectOption("support_replay");
    const chainText = await page.locator("[data-testid='EventChainInspector']").textContent();
    assertCondition(
      (chainText ?? "").includes("ui.support.replay.entered"),
      "action family filter should retain the replay event chain",
    );

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
