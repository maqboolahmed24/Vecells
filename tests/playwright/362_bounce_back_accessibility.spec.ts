import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
  writeAccessibilitySnapshot,
} from "./356_pharmacy_shell.helpers.ts";

async function tabToTestId(page: any, testId: string, maxTabs = 36): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? "",
    );
    if (activeTestId === testId) {
      return;
    }
  }
  throw new Error(`Unable to reach ${testId} with keyboard navigation.`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2204/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2204/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2204",
      recoveryPosture: "recovery_only",
    });

    await assertNoHorizontalOverflow(page, "362 routine reopen mobile reduced");
    assertCondition(
      (await page.locator("header[role='banner']").count()) === 1,
      "Recovery route should expose exactly one banner landmark.",
    );
    assertCondition(
      (await page.locator("main[role='main']").count()) === 1,
      "Recovery route should expose exactly one main landmark.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReopenedCaseBanner'][role='status']").count()) === 1,
      "Routine reopen banner must use polite status semantics.",
    );

    await tabToTestId(page, "pharmacy-open-original-request");
    const originalRequestButton = page.getByTestId("pharmacy-open-original-request");
    assertCondition(
      await originalRequestButton.isVisible(),
      "Original request action must be keyboard reachable.",
    );

    await tabToTestId(page, "pharmacy-return-message-toggle");
    const toggle = page.getByTestId("pharmacy-return-message-toggle");
    assertCondition(
      (await toggle.getAttribute("aria-expanded")) === "true",
      "Return message preview should begin expanded for review.",
    );
    assertCondition(
      Boolean(await toggle.getAttribute("aria-controls")),
      "Return message preview toggle must expose aria-controls.",
    );
    await toggle.press("Space");
    assertCondition(
      (await toggle.getAttribute("aria-expanded")) === "false",
      "Return message preview toggle must be keyboard operable.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
      recoveryPosture: "recovery_only",
    });
    await assertNoHorizontalOverflow(page, "362 escalation mobile reduced");
    assertCondition(
      (await page.locator("[data-testid='PharmacyLoopRiskEscalationCard'][role='alert']").count()) === 1,
      "Loop-risk escalation must announce the escalated blocker as an alert.",
    );

    await writeAccessibilitySnapshot(page, "362-bounce-back-a11y.json");
    await context.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
