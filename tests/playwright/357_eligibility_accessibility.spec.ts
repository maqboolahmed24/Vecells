import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
  writeAccessibilitySnapshot,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [{ child: pharmacyChild, baseUrl: pharmacyBaseUrl }, { child: patientChild, baseUrl: patientBaseUrl }] =
    await Promise.all([startPharmacyConsole(), startPatientWeb()]);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const workspaceContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const workspacePage = await workspaceContext.newPage();
    await openWorkspacePharmacyRoute(
      workspacePage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2090"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2090",
      routeKey: "case",
      selectedCaseId: "PHC-2090",
    });

    const gateButton = workspacePage.getByRole("button", { name: /global safety gate/i });
    await gateButton.focus();
    await workspacePage.keyboard.press("Space");
    assertCondition(
      (await gateButton.getAttribute("aria-expanded")) === "true",
      "gate ladder button should toggle with keyboard input",
    );
    assertCondition(
      Boolean(await gateButton.getAttribute("aria-controls")),
      "gate ladder button should publish aria-controls",
    );

    const evidenceDrawer = workspacePage.getByTestId("EligibilityEvidenceDrawer");
    await evidenceDrawer.waitFor();
    const evidenceButton = evidenceDrawer.locator("button").first();
    await evidenceButton.focus();
    await workspacePage.keyboard.press("Enter");
    assertCondition(
      (await evidenceButton.getAttribute("aria-expanded")) === "true",
      "evidence disclosure should toggle with keyboard input",
    );
    assertCondition(
      Boolean(await evidenceButton.getAttribute("aria-controls")),
      "evidence disclosure should publish aria-controls",
    );
    await writeAccessibilitySnapshot(workspacePage, "357-workspace-eligibility-a11y.json");
    await workspaceContext.close();

    const patientContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2090", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2090/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2090",
    });
    await assertNoHorizontalOverflow(patientPage, "patient unsuitable-return mobile view");
    assertCondition(
      (await patientPage.locator("header[role='banner']").count()) === 1,
      "patient shell should expose exactly one banner landmark",
    );
    assertCondition(
      (await patientPage.locator("main[role='main']").count()) === 1,
      "patient shell should expose exactly one main landmark",
    );
    const nextStepButton = patientPage.getByRole("button", { name: /review the next safe step/i });
    await nextStepButton.focus();
    await patientPage.keyboard.press("Enter");
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2090/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2090",
    });
    await writeAccessibilitySnapshot(patientPage, "357-patient-eligibility-a11y.json");
    await patientContext.close();
  } finally {
    await browser.close();
    await Promise.all([stopPharmacyConsole(pharmacyChild), stopPatientWeb(patientChild)]);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
