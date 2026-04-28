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

export const hubBreakGlassAndScopeDriftCoverage = [
  "reason-coded break-glass activation stays bound to the current hub tuple",
  "site switches can move active elevation into an explicit expiring posture",
  "purpose drift freezes the route in place and revocation hard-denies it",
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

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-031`, "hub-case-route");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-031",
      viewMode: "case",
      selectedCaseId: "hub-case-031",
    });
    await page.getByTestId("HubActingContextChip").click();
    await page.getByTestId("OrganisationSwitchDrawer").waitFor();

    await page.getByRole("button", { name: "Open break-glass reasons" }).click();
    await page.getByTestId("BreakGlassReasonModal").waitFor();
    assertCondition(
      (await page.locator("[role='dialog']").count()) === 1,
      "break-glass modal should mount as a single dialog",
    );
    await page.locator("[data-break-glass-reason='safeguarding_continuity']").click();
    await page.getByRole("button", { name: "Activate break-glass" }).click();
    await waitForRootAttributes(page, {
      "data-current-path": "/hub/case/hub-case-031",
      "data-acting-organisation": "north_shore_hub",
      "data-acting-site": "north_shore_coordination_desk",
      "data-purpose-of-use": "direct_care_coordination",
      "data-access-posture": "frozen",
      "data-shell-status": "shell_recovery_only",
      "data-break-glass-state": "active",
    });
    assertCondition(
      (await page.getByTestId("HubScopeSummaryStrip").getAttribute("data-break-glass-state")) ===
        "active",
      "scope summary strip lost active break-glass posture",
    );

    await page.locator("[data-site-option='north_shore_escalation_room']").click();
    await waitForRootAttributes(page, {
      "data-current-path": "/hub/case/hub-case-031",
      "data-acting-site": "north_shore_escalation_room",
      "data-access-posture": "frozen",
      "data-shell-status": "shell_recovery_only",
      "data-break-glass-state": "expiring",
    });
    assertCondition(
      (await page.getByTestId("HubActingContextChip").getAttribute("data-break-glass-state")) ===
        "expiring",
      "acting-context chip lost the expiring break-glass marker",
    );

    await page.locator("[data-purpose-option='service_recovery_review']").click();
    await waitForRootAttributes(page, {
      "data-current-path": "/hub/case/hub-case-031",
      "data-purpose-of-use": "service_recovery_review",
      "data-access-posture": "frozen",
      "data-shell-status": "shell_recovery_only",
      "data-route-mutation": "disabled",
      "data-break-glass-state": "inactive",
    });
    await page.getByTestId("ScopeDriftFreezeBanner").waitFor();
    assertCondition(
      (await page.getByTestId("ScopeDriftFreezeBanner").getAttribute("data-scope-drift-class")) ===
        "purpose_of_use_change",
      "scope drift banner lost the purpose-of-use drift class",
    );
    assertCondition(
      (await page.getByTestId("AccessScopeTransitionReceipt").getAttribute(
        "data-scope-transition-outcome",
      )) === "freeze_refresh_required",
      "purpose drift lost the freeze transition receipt",
    );

    await page.getByRole("button", { name: "Open break-glass reasons" }).click();
    await page.getByTestId("BreakGlassReasonModal").waitFor();
    assertCondition(
      (await page.getByText("Break-glass cannot start here").count()) === 1,
      "purpose drift should deny new break-glass activation under the current tuple",
    );
    await page.getByTestId("BreakGlassReasonModal").getByRole("button", { name: "Close" }).click();

    const revokeContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const revokePage = await revokeContext.newPage();
    trackExternalRequests(revokePage, baseUrl, externalRequests);
    await openHubRoute(revokePage, `${baseUrl}/hub/case/hub-case-031`, "hub-case-route");
    await revokePage.getByTestId("HubActingContextChip").click();
    await revokePage.getByRole("button", { name: "Open break-glass reasons" }).click();
    await revokePage.getByTestId("BreakGlassReasonModal").waitFor();
    await revokePage.locator("[data-break-glass-reason='urgent_clinical_safety']").click();
    await revokePage.getByRole("button", { name: "Activate break-glass" }).click();
    await waitForRootAttributes(revokePage, {
      "data-current-path": "/hub/case/hub-case-031",
      "data-break-glass-state": "active",
      "data-access-posture": "frozen",
      "data-shell-status": "shell_recovery_only",
    });
    await revokePage.getByRole("button", { name: "Revoke break-glass" }).click();
    await waitForRootAttributes(revokePage, {
      "data-current-path": "/hub/case/hub-case-031",
      "data-break-glass-state": "revoked",
      "data-access-posture": "denied",
      "data-shell-status": "shell_recovery_only",
      "data-route-mutation": "disabled",
    });
    await revokePage.getByTestId("HubAccessDeniedState").waitFor();
    assertCondition(
      (await revokePage.getByTestId("HubAccessDeniedState").textContent())?.includes("revoked") ===
        true,
      "revoked break-glass should be explained in the denied state",
    );
    await revokeContext.close();

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({
      path: outputPath("332-break-glass-and-scope-drift.png"),
      fullPage: true,
    });
    await context.tracing.stop({ path: outputPath("332-break-glass-and-scope-drift-trace.zip") });
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
