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
    const context = await browser.newContext({ viewport: { width: 1500, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await clearObservabilityStore(page, baseUrl);
    await seedWorkspaceAndSupportEventChains(page, baseUrl);

    await page.goto(`${baseUrl}/workspace/validation?state=live`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceValidationRoute']").waitFor();
    await page.screenshot({ path: outputPath("269-validation-board-live.png"), fullPage: true });

    await page.locator("[data-testid='ValidationRouteFamilySelect']").selectOption("rf_support_ticket_workspace");
    await page.screenshot({ path: outputPath("269-validation-board-support-integrity.png"), fullPage: true });

    await page.goto(`${baseUrl}/workspace/validation?state=blocked`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceValidationRoute']").waitFor();
    await page.screenshot({ path: outputPath("269-validation-board-blocked.png"), fullPage: true });

    await context.tracing.stop({ path: outputPath("269-validation-board-trace.zip") });
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
