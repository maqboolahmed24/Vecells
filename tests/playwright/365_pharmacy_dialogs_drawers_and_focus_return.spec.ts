import {
  activeElementSummary,
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./365_pharmacy_accessibility.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const desktopPage = await desktopContext.newPage();
    await openWorkspacePharmacyRoute(
      desktopPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
    });

    await desktopPage.getByTestId("open-referral-confirmation-drawer").click();
    await desktopPage.getByTestId("PharmacyReferralConfirmationDrawer").waitFor();
    let active = await activeElementSummary(desktopPage);
    assertCondition(
      active.tagName === "h2" || active.testId === "dispatch-drawer-close",
      `Dispatch drawer should move focus inside the dialog, found ${JSON.stringify(active)}`,
    );
    await desktopPage.keyboard.press("Escape");
    await desktopPage.waitForFunction(
      () => !document.querySelector("[data-testid='PharmacyReferralConfirmationDrawer']"),
    );
    active = await activeElementSummary(desktopPage);
    assertCondition(
      active.testId === "open-referral-confirmation-drawer",
      "Dispatch drawer must restore focus to its trigger on close.",
    );
    await desktopContext.close();

    const missionContext = await browser.newContext({
      viewport: { width: 834, height: 1112 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const missionPage = await missionContext.newPage();
    await openWorkspacePharmacyRoute(
      missionPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(missionPage, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "narrow",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });

    await missionPage.getByTestId("pharmacy-mission-stack-queue-toggle").click();
    await missionPage.getByTestId("PharmacyQueuePeekDrawer").waitFor();
    await missionPage.waitForFunction(() => {
      const active = document.activeElement as HTMLElement | null;
      return (
        active?.tagName === "H2" ||
        active?.getAttribute("data-testid") === "pharmacy-queue-peek-close"
      );
    });
    active = await activeElementSummary(missionPage);
    assertCondition(
      active.tagName === "h2" || active.testId === "pharmacy-queue-peek-close",
      `Queue peek should move focus inside the drawer, found ${JSON.stringify(active)}`,
    );
    await missionPage.keyboard.press("Escape");
    await missionPage.waitForFunction(
      () => !document.querySelector("[data-testid='PharmacyQueuePeekDrawer']"),
    );
    active = await activeElementSummary(missionPage);
    assertCondition(
      active.testId === "pharmacy-mission-stack-queue-toggle",
      "Queue peek drawer must restore focus to its trigger on close.",
    );
    await missionContext.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
