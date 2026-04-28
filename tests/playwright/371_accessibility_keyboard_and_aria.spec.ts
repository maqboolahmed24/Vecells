import {
  activeElementSummary,
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  tabUntil,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
  writeAriaSnapshot,
} from "./365_pharmacy_accessibility.helpers.ts";

async function assertVisibleTargetsMeetMinimum(page: any, rootSelector: string, label: string) {
  const failures = await page.locator(rootSelector).evaluate((root: HTMLElement) => {
    const selector = [
      "button",
      "a[href]",
      "input",
      "select",
      "textarea",
      "[role='button']",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    return Array.from(root.querySelectorAll<HTMLElement>(selector))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          !node.closest("[aria-hidden='true']")
        );
      })
      .map((node) => {
        const hitTarget =
          node instanceof HTMLInputElement && node.closest("label")
            ? (node.closest("label") ?? node)
            : node;
        const rect = hitTarget.getBoundingClientRect();
        return {
          testId: node.getAttribute("data-testid"),
          text: hitTarget.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((target) => target.width < 24 || target.height < 24);
  });

  assertCondition(
    failures.length === 0,
    `${label} has visible targets below 24 CSS px: ${JSON.stringify(failures)}`,
  );
}

async function assertAnnouncementHub(page: any, testId: string, label: string) {
  const hub = page.getByTestId(testId);
  assertCondition((await hub.count()) === 1, `${label} must expose exactly one announcement hub.`);
  assertCondition(
    (await hub.locator("[role='status'][aria-live='polite']").count()) === 1,
    `${label} must expose a polite status live region.`,
  );
  assertCondition(
    (await hub.locator("[role='alert'][aria-live='assertive']").count()) === 1,
    `${label} must expose an assertive alert live region.`,
  );
}

async function assertLandmarksAndHeadings(page: any, label: string) {
  assertCondition(
    (await page.locator("main[role='main']").count()) === 1,
    `${label} needs one main.`,
  );
  assertCondition((await page.locator("h1").count()) >= 1, `${label} needs an h1.`);
  assertCondition((await page.locator("h2").count()) >= 1, `${label} needs route h2 headings.`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl: patientBaseUrl } = await startPatientWeb();
  const { child: pharmacyChild, baseUrl: pharmacyBaseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();

    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2148", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
      recoveryPosture: "live",
    });
    await assertLandmarksAndHeadings(patientPage, "Patient chooser");
    await assertAnnouncementHub(
      patientPage,
      "PatientPharmacyAnnouncementHub",
      "Patient pharmacy shell",
    );
    assertCondition(
      await patientPage.getByTestId("PatientPharmacyFocusRouteMap").isVisible(),
      "Patient shell must expose the focus route map.",
    );
    assertCondition(
      (await patientPage
        .getByTestId("patient-pharmacy-route-choose")
        .getAttribute("aria-pressed")) === "true",
      "Active patient route button must expose aria-pressed=true.",
    );
    await assertVisibleTargetsMeetMinimum(
      patientPage,
      "[data-testid='pharmacy-patient-shell-root']",
      "Patient chooser",
    );

    await tabUntil(patientPage, (testId) => testId === "patient-pharmacy-route-choose");
    await tabUntil(patientPage, (testId) => testId === "pharmacy-choice-map-toggle");
    await patientPage.keyboard.press("Space");
    assertCondition(
      (await patientPage.getByTestId("PharmacyChoicePage").getAttribute("data-map-visible")) ===
        "true",
      "Patient keyboard flow must toggle the chooser map.",
    );
    await tabUntil(patientPage, (testId) => testId === "pharmacy-provider-select-provider_A10002");
    await patientPage.keyboard.press("Enter");
    await tabUntil(patientPage, (testId) => testId === "pharmacy-choice-warning-checkbox");
    await patientPage.keyboard.press("Space");
    await patientPage.getByTestId("pharmacy-choice-acknowledge-warning").focus();
    await patientPage.keyboard.press("Enter");
    assertCondition(
      (await patientPage
        .getByTestId("pharmacy-patient-shell-root")
        .getAttribute("data-choice-warning-acknowledged")) === "true",
      "Patient keyboard flow must record warned-choice acknowledgement.",
    );

    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2103", "status"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2103/status",
      routeKey: "status",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await patientPage
        .locator("[data-testid='PharmacyReviewNextStepPage'][role='alert']")
        .count()) === 1,
      "Urgent patient status must expose alert semantics.",
    );
    await writeAriaSnapshot(
      patientPage,
      patientPage.locator("[data-testid='PatientPharmacyMainRegion']"),
      "371-patient-urgent-status-aria.txt",
    );
    await patientContext.close();

    const pharmacyContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const pharmacyPage = await pharmacyContext.newPage();

    await openWorkspacePharmacyRoute(
      pharmacyPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(pharmacyPage, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });
    await assertLandmarksAndHeadings(pharmacyPage, "Staff handoff");
    await assertAnnouncementHub(pharmacyPage, "PharmacyShellAnnouncementHub", "Pharmacy shell");
    assertCondition(
      await pharmacyPage.getByTestId("PharmacyShellFocusRouteMap").isVisible(),
      "Pharmacy shell must expose the focus route map.",
    );
    assertCondition(
      (await pharmacyPage
        .getByTestId("pharmacy-route-button-handoff")
        .getAttribute("aria-pressed")) === "true",
      "Active staff route button must expose aria-pressed=true.",
    );
    await assertVisibleTargetsMeetMinimum(
      pharmacyPage,
      "[data-testid='pharmacy-shell-root']",
      "Staff handoff",
    );

    await tabUntil(pharmacyPage, (testId) => testId === "pharmacy-route-button-case");
    await tabUntil(pharmacyPage, (testId) => testId === "open-referral-confirmation-drawer", 40);
    assertCondition(
      (await pharmacyPage
        .getByTestId("open-referral-confirmation-drawer")
        .getAttribute("aria-haspopup")) === "dialog",
      "Dispatch drawer trigger must advertise dialog semantics.",
    );
    await pharmacyPage.keyboard.press("Enter");
    await pharmacyPage.getByTestId("PharmacyReferralConfirmationDrawer").waitFor();
    await pharmacyPage.waitForFunction(() => {
      const active = document.activeElement as HTMLElement | null;
      return (
        active?.tagName.toLowerCase() === "h2" ||
        active?.getAttribute("data-testid") === "dispatch-drawer-close"
      );
    });
    let active = await activeElementSummary(pharmacyPage);
    assertCondition(
      active.tagName === "h2" || active.testId === "dispatch-drawer-close",
      `Dispatch drawer should move focus inside the dialog, found ${JSON.stringify(active)}`,
    );
    await pharmacyPage.keyboard.press("Escape");
    await pharmacyPage.waitForFunction(
      () => !document.querySelector("[data-testid='PharmacyReferralConfirmationDrawer']"),
    );
    active = await activeElementSummary(pharmacyPage);
    assertCondition(
      active.testId === "open-referral-confirmation-drawer",
      "Dispatch drawer must restore focus to its trigger after Escape.",
    );

    await writeAriaSnapshot(
      pharmacyPage,
      pharmacyPage.locator("[data-testid='pharmacy-shell-root']"),
      "371-staff-handoff-aria.txt",
    );

    const tabletContext = await browser.newContext({
      viewport: { width: 834, height: 1112 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const tabletPage = await tabletContext.newPage();
    await openWorkspacePharmacyRoute(
      tabletPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(tabletPage, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "narrow",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });
    await tabletPage.getByTestId("pharmacy-mission-stack-queue-toggle").click();
    await tabletPage.getByTestId("PharmacyQueuePeekDrawer").waitFor();
    active = await activeElementSummary(tabletPage);
    assertCondition(
      active.tagName === "h2" || active.testId === "pharmacy-queue-peek-close",
      `Queue peek should move focus inside the drawer, found ${JSON.stringify(active)}`,
    );
    await tabletPage.keyboard.press("Escape");
    await tabletPage.waitForFunction(
      () => !document.querySelector("[data-testid='PharmacyQueuePeekDrawer']"),
    );
    active = await activeElementSummary(tabletPage);
    assertCondition(
      active.testId === "pharmacy-mission-stack-queue-toggle",
      "Queue peek drawer must restore focus to its trigger.",
    );
    await tabletContext.close();
    await pharmacyContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(patientChild);
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
