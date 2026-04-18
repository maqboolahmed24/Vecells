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
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await clearObservabilityStore(page, baseUrl);
    await seedWorkspaceAndSupportEventChains(page, baseUrl);

    const snapshot = await readObservabilityStore(page);
    const serialized = JSON.stringify(snapshot);
    for (const unsafeToken of ["Elena Morris", "Asha Patel", "Marta Singh", "@vecells.invalid"]) {
      assertCondition(!serialized.includes(unsafeToken), `redacted store leaked unsafe token: ${unsafeToken}`);
    }
    assertCondition(
      snapshot.events.every((event: any) => typeof event.selectedAnchorRef === "string" && event.selectedAnchorRef.startsWith("anchor_")),
      "event selected anchors should be hashed",
    );
    assertCondition(
      snapshot.events.every((event: any) => typeof event.routeScopeHash === "string" && event.routeScopeHash.startsWith("scope_")),
      "event route scope hashes should stay masked",
    );
    assertCondition(
      snapshot.disclosureFences.every((fence: any) => fence.fenceState === "enforced"),
      "all emitted fences should stay enforced in the redaction proof",
    );

    await page.goto(`${baseUrl}/workspace/validation?state=live`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceValidationRoute']").waitFor();
    await page.getByLabel("Search event family, route family, defect, or release tuple").fill("Elena Morris");
    assertCondition(
      (await page.locator("[data-testid='EventChainInspector']").textContent())?.includes("No event chains match the current filter.") ?? false,
      "validation board search should not resolve raw patient labels",
    );

    await context.tracing.stop({ path: outputPath("269-ui-event-redaction-trace.zip") });
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
