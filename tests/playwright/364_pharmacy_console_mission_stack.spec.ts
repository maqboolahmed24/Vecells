import {
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
    });

    await page
      .getByTestId("pharmacy-line-item-PHC-2244-L2")
      .evaluate((button: HTMLButtonElement) => button.click());
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='pharmacy-shell-root']")
          ?.getAttribute("data-selected-line-item-id") === "PHC-2244-L2",
    );

    await page.setViewportSize({ width: 834, height: 1112 });
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "narrow",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-mission-stack-visual-mode")) ===
        "Pharmacy_Mission_Stack_Recovery",
      "Mission stack root must expose the 364 visual mode.",
    );
    assertCondition(
      (await root.getAttribute("data-selected-line-item-id")) === "PHC-2244-L2",
      "Folded shell must preserve the active line item across resize.",
    );
    assertCondition(
      await page.getByTestId("PharmacyMissionStackController").isVisible(),
      "Folded shell must render the mission stack controller.",
    );
    assertCondition(
      await page.getByTestId("PharmacyCaseResumeStub").isVisible(),
      "Folded shell must render the case resume stub.",
    );
    assertCondition(
      await page.getByTestId("PharmacySupportRegionResumeCard").isVisible(),
      "Folded shell must keep the promoted support region reachable.",
    );
    assertCondition(
      await page.getByTestId("PharmacyMissionStackDock").isVisible(),
      "Folded shell must move the decision dock into the mission-stack dock region.",
    );

    await page.getByTestId("pharmacy-mission-stack-queue-toggle").click();
    await page.locator("[data-testid='PharmacyQueuePeekDrawer'][data-open='true']").waitFor();
    assertCondition(
      (await root.getAttribute("data-queue-peek-state")) === "open",
      "Queue peek drawer must expose open state on the shell root.",
    );
    await page.getByTestId("pharmacy-queue-peek-close").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='pharmacy-shell-root']")
          ?.getAttribute("data-queue-peek-state") === "closed",
    );
    assertCondition(
      (await root.getAttribute("data-queue-peek-state")) === "closed",
      "Queue peek drawer must close without dropping shell continuity.",
    );

    await page.reload({ waitUntil: "load" });
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "narrow",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-selected-line-item-id")) === "PHC-2244-L2",
      "Reload must preserve the selected line item in mission_stack.",
    );
    assertCondition(
      (await root.getAttribute("data-support-region-resume-state")) === "expanded",
      "Child routes must reopen the promoted support region after reload.",
    );

    await context.close();
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
