import {
  assertCondition,
  assertRootMatchesExpectedScenario,
  buildExpectedHubScenario,
  importPlaywright,
  openHubRoute,
  outputPath,
  readRootAttributes338,
  startHubDesk,
  startTrace,
  stopHubDesk,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForRootAttributes,
  writeJsonArtifact,
} from "./338_scope_capacity.helpers.ts";

export const scopeBoundaryCoverage338 = [
  "multi-context browser isolation keeps one acting-context switch from mutating a second coordinator session",
  "scope drift collapses writable posture into explicit read-only or denied states instead of leaving mutation authority live",
  "minimum-necessary placeholders and denied rendering stay aligned with the governing audience tier",
];

async function captureScenario(
  page: any,
  name: string,
): Promise<Record<string, string | null>> {
  const attributes = await readRootAttributes338(page, [
    "data-current-path",
    "data-view-mode",
    "data-layout-mode",
    "data-selected-case-id",
    "data-acting-organisation",
    "data-acting-site",
    "data-purpose-of-use",
    "data-audience-tier",
    "data-access-posture",
    "data-shell-status",
    "data-route-mutation",
    "data-break-glass-state",
    "data-visibility-envelope-state",
  ]);
  return { scenario: name, ...attributes };
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const defaultScenario = buildExpectedHubScenario("/hub/case/hub-case-104", 1560);
  const originScenario = buildExpectedHubScenario("/hub/case/hub-case-104", 1560, {
    selectedOrganisationId: "riverside_medical",
  });
  const deniedScenario = buildExpectedHubScenario("/hub/case/hub-case-104", 1560, {
    selectedOrganisationId: "south_vale_network",
  });

  try {
    const primaryContext = await browser.newContext({
      viewport: { width: 1560, height: 1120 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const isolatedContext = await browser.newContext({
      viewport: { width: 1560, height: 1120 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(primaryContext);
    await startTrace(isolatedContext);

    try {
      const primaryPage = await primaryContext.newPage();
      const isolatedPage = await isolatedContext.newPage();
      const primaryExternal = new Set<string>();
      const isolatedExternal = new Set<string>();
      trackExternalRequests(primaryPage, baseUrl, primaryExternal);
      trackExternalRequests(isolatedPage, baseUrl, isolatedExternal);

      await openHubRoute(primaryPage, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
      await openHubRoute(isolatedPage, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
      await assertRootMatchesExpectedScenario(primaryPage, defaultScenario);
      await assertRootMatchesExpectedScenario(isolatedPage, defaultScenario);

      await primaryPage.getByTestId("HubActingContextChip").click();
      await waitForRootAttributes(primaryPage, { "data-scope-drawer-open": "true" });
      await primaryPage.locator("[data-organisation-option='riverside_medical']").click();
      await assertRootMatchesExpectedScenario(primaryPage, originScenario);
      assertCondition(
        (await primaryPage.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 3,
        "origin-practice view should expose exactly three minimum-necessary placeholder blocks",
      );
      assertCondition(
        (await primaryPage.getByTestId("AccessScopeTransitionReceipt").getAttribute(
          "data-scope-transition-outcome",
        )) === "preserve_read_only",
        "origin-practice switch should emit the read-only scope transition receipt",
      );

      await assertRootMatchesExpectedScenario(isolatedPage, defaultScenario);

      await primaryPage.locator("[data-organisation-option='south_vale_network']").click();
      await assertRootMatchesExpectedScenario(primaryPage, deniedScenario);
      await primaryPage.getByTestId("HubAccessDeniedState").waitFor();
      assertCondition(
        (await primaryPage.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 0,
        "denied view should not render governed placeholder blocks",
      );
      assertCondition(
        (await primaryPage.getByTestId("HubAccessDeniedState").getAttribute(
          "data-access-posture",
        )) === "denied",
        "denied shell must keep the explicit denied posture marker",
      );

      await assertRootMatchesExpectedScenario(isolatedPage, defaultScenario);

      writeJsonArtifact("338-org-boundary-scope-snapshots.json", {
        default: await captureScenario(isolatedPage, "default"),
        originPractice: await captureScenario(primaryPage, "origin_practice_visibility"),
        denied: await captureScenario(primaryPage, "no_visibility"),
      });

      await primaryPage.screenshot({
        path: outputPath("338-org-boundary-denied.png"),
        fullPage: true,
      });
      await isolatedPage.screenshot({
        path: outputPath("338-org-boundary-isolated-default.png"),
        fullPage: true,
      });

      assertCondition(
        primaryExternal.size === 0,
        `unexpected primary-context external requests: ${Array.from(primaryExternal).join(", ")}`,
      );
      assertCondition(
        isolatedExternal.size === 0,
        `unexpected isolated-context external requests: ${Array.from(isolatedExternal).join(", ")}`,
      );

      await stopTrace(primaryContext, "338-org-boundary-primary-trace.zip");
      await stopTrace(isolatedContext, "338-org-boundary-isolated-trace.zip");
    } catch (error) {
      await stopTraceOnError(primaryContext, "338-org-boundary-primary-trace.zip", error);
    } finally {
      await primaryContext.close();
      await isolatedContext.close();
    }
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
