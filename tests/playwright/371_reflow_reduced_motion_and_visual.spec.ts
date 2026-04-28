import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  outputPath,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./365_pharmacy_accessibility.helpers.ts";

async function transitionDuration(page: any, selector: string): Promise<string> {
  return await page.locator(selector).evaluate((node: HTMLElement) => {
    return getComputedStyle(node).transitionDuration;
  });
}

function reducedDurationSatisfied(value: string): boolean {
  const firstDuration = value.split(",")[0]?.trim() ?? value.trim();
  if (firstDuration === "0s" || firstDuration === "0.01ms" || firstDuration === "1e-05s") {
    return true;
  }
  const numeric = Number.parseFloat(firstDuration.replace(/ms|s/g, ""));
  if (Number.isNaN(numeric)) {
    return false;
  }
  return firstDuration.endsWith("ms") ? numeric <= 0.01 : numeric <= 0.00002;
}

async function captureStableScreenshot(page: any, fileName: string): Promise<void> {
  const first = await page.screenshot({ fullPage: true });
  const second = await page.screenshot({ fullPage: true });
  assertCondition(first.equals(second), `${fileName} visual baseline changed between captures.`);
  fs.writeFileSync(outputPath(fileName), first);
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
    const patientReducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const patientReducedPage = await patientReducedContext.newPage();
    await openPatientPharmacyRoute(
      patientReducedPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2057", "status"),
    );
    await waitForPatientPharmacyState(patientReducedPage, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });
    await assertNoHorizontalOverflow(patientReducedPage, "371 patient mobile reduced");
    assertCondition(
      (await patientReducedPage
        .getByTestId("patient-pharmacy-reduced-motion-bridge")
        .getAttribute("data-reduced-motion")) === "true",
      "Patient reduced-motion bridge must activate under prefers-reduced-motion.",
    );
    const patientDuration = await transitionDuration(
      patientReducedPage,
      "[data-testid='patient-pharmacy-route-status']",
    );
    assertCondition(
      reducedDurationSatisfied(patientDuration),
      `Patient reduced-motion transition drifted: ${patientDuration}`,
    );
    await patientReducedPage.setViewportSize({ width: 320, height: 900 });
    await assertNoHorizontalOverflow(patientReducedPage, "371 patient 320px reflow");
    await patientReducedContext.close();

    const pharmacyReducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const pharmacyReducedPage = await pharmacyReducedContext.newPage();
    await openWorkspacePharmacyRoute(
      pharmacyReducedPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(pharmacyReducedPage, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
      recoveryPosture: "recovery_only",
    });
    await assertNoHorizontalOverflow(pharmacyReducedPage, "371 staff mobile reduced");
    assertCondition(
      (await pharmacyReducedPage
        .getByTestId("pharmacy-shell-reduced-motion-bridge")
        .getAttribute("data-reduced-motion")) === "true",
      "Pharmacy reduced-motion bridge must activate under prefers-reduced-motion.",
    );
    const pharmacyDuration = await transitionDuration(
      pharmacyReducedPage,
      "[data-testid='pharmacy-route-button-assurance']",
    );
    assertCondition(
      reducedDurationSatisfied(pharmacyDuration),
      `Pharmacy reduced-motion transition drifted: ${pharmacyDuration}`,
    );
    await pharmacyReducedPage.setViewportSize({ width: 320, height: 900 });
    await assertNoHorizontalOverflow(pharmacyReducedPage, "371 staff 320px reflow");
    await pharmacyReducedContext.close();

    const staffDesktopContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const staffDesktop = await staffDesktopContext.newPage();
    await openWorkspacePharmacyRoute(
      staffDesktop,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2048"),
    );
    await waitForWorkspacePharmacyState(staffDesktop, {
      currentPath: "/workspace/pharmacy/PHC-2048",
      routeKey: "case",
      selectedCaseId: "PHC-2048",
      recoveryPosture: "live",
    });
    await captureStableScreenshot(staffDesktop, "371-calm-console-desktop.png");

    await openWorkspacePharmacyRoute(
      staffDesktop,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(staffDesktop, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });
    await captureStableScreenshot(staffDesktop, "371-stale-console-handoff.png");
    await staffDesktopContext.close();

    const staffMobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const staffMobile = await staffMobileContext.newPage();
    await openWorkspacePharmacyRoute(
      staffMobile,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(staffMobile, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });
    await captureStableScreenshot(staffMobile, "371-blocked-console-mobile.png");
    await staffMobileContext.close();

    const patientVisualContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientVisual = await patientVisualContext.newPage();
    await openPatientPharmacyRoute(
      patientVisual,
      patientPharmacyUrl(patientBaseUrl, "PHC-2057", "status"),
    );
    await waitForPatientPharmacyState(patientVisual, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });
    await captureStableScreenshot(patientVisual, "371-patient-pending-status.png");

    await openPatientPharmacyRoute(
      patientVisual,
      patientPharmacyUrl(patientBaseUrl, "PHC-2090", "status"),
    );
    await waitForPatientPharmacyState(patientVisual, {
      currentPath: "/pharmacy/PHC-2090/status",
      routeKey: "status",
      selectedCaseId: "PHC-2090",
    });
    await captureStableScreenshot(patientVisual, "371-patient-review-status.png");

    await openPatientPharmacyRoute(
      patientVisual,
      patientPharmacyUrl(patientBaseUrl, "PHC-2103", "status"),
    );
    await waitForPatientPharmacyState(patientVisual, {
      currentPath: "/pharmacy/PHC-2103/status",
      routeKey: "status",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    await captureStableScreenshot(patientVisual, "371-patient-urgent-return-status.png");
    await patientVisualContext.close();

    const firefox = await playwright.firefox.launch({ headless: true });
    try {
      const firefoxContext = await firefox.newContext({
        viewport: { width: 1280, height: 900 },
        locale: "en-GB",
        timezoneId: "Europe/London",
      });
      const firefoxStaff = await firefoxContext.newPage();
      await openWorkspacePharmacyRoute(
        firefoxStaff,
        workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
      );
      await waitForWorkspacePharmacyState(firefoxStaff, {
        currentPath: "/workspace/pharmacy/PHC-2244/handoff",
        routeKey: "handoff",
        selectedCaseId: "PHC-2244",
        recoveryPosture: "read_only",
      });
      assertCondition(
        (await firefoxStaff
          .locator("[data-testid='pharmacy-shell-root']")
          .getAttribute("data-workbench-provider-health")) === "outage",
        "Firefox smoke must preserve the staff provider outage state.",
      );

      const firefoxPatient = await firefoxContext.newPage();
      await openPatientPharmacyRoute(
        firefoxPatient,
        patientPharmacyUrl(patientBaseUrl, "PHC-2090", "status"),
      );
      await waitForPatientPharmacyState(firefoxPatient, {
        currentPath: "/pharmacy/PHC-2090/status",
        routeKey: "status",
        selectedCaseId: "PHC-2090",
      });
      assertCondition(
        (await firefoxPatient
          .locator("[data-testid='pharmacy-patient-shell-root']")
          .getAttribute("data-patient-status-surface-state")) === "review_next_steps",
        "Firefox smoke must preserve the patient review state.",
      );
      await firefoxContext.close();
    } finally {
      await firefox.close();
    }
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
