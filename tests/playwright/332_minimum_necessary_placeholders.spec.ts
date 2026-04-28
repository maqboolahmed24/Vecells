import {
  assertCondition,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export const hubMinimumNecessaryPlaceholderCoverage = [
  "origin-practice read-only posture explains withheld hub detail explicitly",
  "servicing-site delivery posture swaps in the smaller site-local placeholder set",
  "hub elevation placeholders disappear only after reason-coded break-glass activation",
];

async function waitForRootAttributes(
  page: any,
  expected: Record<string, string>,
): Promise<void> {
  await page.waitForFunction((attrs) => {
    const root = document.querySelector("[data-testid='hub-shell-root']");
    if (!root) {
      return false;
    }
    return Object.entries(attrs).every(
      ([key, value]) => (root as HTMLElement).getAttribute(key) === value,
    );
  }, expected);
}

async function placeholderTitles(page: any): Promise<string[]> {
  return page.locator("[data-testid='MinimumNecessaryPlaceholderBlock'] h3").allTextContents();
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 1500, height: 1120 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      selectedCaseId: "hub-case-104",
    });
    await page.getByTestId("HubActingContextChip").click();
    await page.getByTestId("OrganisationSwitchDrawer").waitFor();

    await page.locator("[data-organisation-option='riverside_medical']").click();
    await waitForRootAttributes(page, {
      "data-acting-organisation": "riverside_medical",
      "data-audience-tier": "origin_practice_visibility",
      "data-access-posture": "read_only",
      "data-route-mutation": "disabled",
    });
    assertCondition(
      (await page.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 3,
      "origin-practice scope should expose three placeholder blocks",
    );
    const originTitles = await placeholderTitles(page);
    assertCondition(
      originTitles.join("|") ===
        [
          "Hub internal notes withheld",
          "Cross-site capacity detail hidden",
          "Raw booking proof withheld",
        ].join("|"),
      `unexpected origin-practice placeholder titles: ${originTitles.join(" | ")}`,
    );
    assertCondition(
      (await page.locator("[data-placeholder-reason='hidden_by_audience_tier']").count()) === 2 &&
        (await page.locator("[data-placeholder-reason='hidden_by_role']").count()) === 1,
      "origin-practice placeholder reasons drifted",
    );

    await page.locator("[data-organisation-option='elm_park_surgery']").click();
    await waitForRootAttributes(page, {
      "data-acting-organisation": "elm_park_surgery",
      "data-audience-tier": "servicing_site_visibility",
      "data-access-posture": "read_only",
      "data-route-mutation": "disabled",
    });
    assertCondition(
      (await page.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 2,
      "servicing-site scope should expose two placeholder blocks",
    );
    const servicingTitles = await placeholderTitles(page);
    assertCondition(
      servicingTitles.join("|") ===
        ["Origin triage detail hidden", "Other-site options removed"].join("|"),
      `unexpected servicing-site placeholder titles: ${servicingTitles.join(" | ")}`,
    );
    assertCondition(
      (await page.locator("[data-placeholder-reason='hidden_by_audience_tier']").count()) === 1 &&
        (await page.locator("[data-placeholder-reason='out_of_scope']").count()) === 1,
      "servicing-site placeholder reasons drifted",
    );

    await page.locator("[data-organisation-option='north_shore_hub']").click();
    await waitForRootAttributes(page, {
      "data-acting-organisation": "north_shore_hub",
      "data-acting-site": "north_shore_coordination_desk",
      "data-purpose-of-use": "direct_care_coordination",
      "data-audience-tier": "hub_desk_visibility",
      "data-access-posture": "writable",
      "data-break-glass-state": "inactive",
    });
    assertCondition(
      (await page.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 1,
      "hub tuple should keep a single elevation-required placeholder before break-glass",
    );
    assertCondition(
      (await page.locator("[data-placeholder-reason='elevation_required']").count()) === 1,
      "hub tuple lost the elevation-required placeholder reason",
    );
    assertCondition(
      (await page.getByText("Attachment payload requires break-glass").count()) === 1,
      "hub tuple lost the attachment-elevation placeholder",
    );

    await page.getByRole("button", { name: "Open break-glass reasons" }).click();
    await page.getByTestId("BreakGlassReasonModal").waitFor();
    await page.locator("[data-break-glass-reason='urgent_clinical_safety']").click();
    await page.getByRole("button", { name: "Activate break-glass" }).click();
    await waitForRootAttributes(page, {
      "data-break-glass-state": "active",
      "data-access-posture": "writable",
    });
    assertCondition(
      (await page.getByTestId("MinimumNecessaryPlaceholderBlock").count()) === 0,
      "elevation-required placeholder should clear once break-glass is active",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({
      path: outputPath("332-minimum-necessary-placeholders.png"),
      fullPage: true,
    });
    await context.tracing.stop({ path: outputPath("332-minimum-necessary-placeholders-trace.zip") });
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
