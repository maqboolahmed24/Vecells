import {
  assertCondition,
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
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await workspaceContext.tracing.start({ screenshots: true, snapshots: true });
    const workspacePage = await workspaceContext.newPage();

    await openWorkspacePharmacyRoute(workspacePage, workspacePharmacyUrl(pharmacyBaseUrl));
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy",
      layoutMode: "two_plane",
      breakpointClass: "wide",
      routeKey: "lane",
      selectedCaseId: "PHC-2057",
    });

    await workspacePage.getByTestId("pharmacy-case-PHC-2081").click();
    await workspacePage.getByTestId("pharmacy-route-button-inventory").click();
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2081/inventory",
      selectedCaseId: "PHC-2081",
      routeKey: "inventory",
      recoveryPosture: "read_only",
    });

    const inventoryRoot = workspacePage.locator("[data-testid='pharmacy-shell-root']");
    const selectedAnchor = await inventoryRoot.getAttribute("data-selected-case-anchor");
    const checkpointSummary = await inventoryRoot.getAttribute("data-active-checkpoint-summary");
    const dominantActionState = await inventoryRoot.getAttribute("data-dominant-action-state");

    await workspacePage.reload({ waitUntil: "networkidle" });
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2081/inventory",
      selectedCaseId: "PHC-2081",
      routeKey: "inventory",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await inventoryRoot.getAttribute("data-selected-case-anchor")) === selectedAnchor,
      "workspace reload drifted the selected case anchor",
    );
    assertCondition(
      (await inventoryRoot.getAttribute("data-active-checkpoint-summary")) === checkpointSummary,
      "workspace reload drifted the checkpoint summary",
    );
    assertCondition(
      (await inventoryRoot.getAttribute("data-dominant-action-state")) === dominantActionState,
      "workspace reload drifted the dominant action state",
    );

    await workspacePage.goBack({ waitUntil: "networkidle" });
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2081",
      routeKey: "case",
      selectedCaseId: "PHC-2081",
    });

    await workspaceContext.tracing.stop({
      path: outputPath("356-workspace-pharmacy-continuity-trace.zip"),
    });
    await workspaceContext.close();

    const patientContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await patientContext.tracing.start({ screenshots: true, snapshots: true });
    const patientPage = await patientContext.newPage();

    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2048", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/choose",
      layoutMode: "two_plane",
      routeKey: "choose",
      recoveryPosture: "live",
      selectedCaseId: "PHC-2048",
    });

    const patientRoot = patientPage.locator("[data-testid='pharmacy-patient-shell-root']");
    const chosenProvider = await patientRoot.getAttribute("data-chosen-provider-ref");
    const requestLineage = await patientRoot.getAttribute("data-request-lineage-ref");

    await patientPage.getByTestId("patient-pharmacy-route-instructions").click();
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2048",
    });
    await patientPage.getByTestId("patient-pharmacy-route-status").click();
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/status",
      routeKey: "status",
      selectedCaseId: "PHC-2048",
    });
    await patientPage.goBack({ waitUntil: "networkidle" });
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2048",
    });
    await patientPage.goForward({ waitUntil: "networkidle" });
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/status",
      routeKey: "status",
      selectedCaseId: "PHC-2048",
    });

    await patientPage.reload({ waitUntil: "networkidle" });
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/status",
      routeKey: "status",
      selectedCaseId: "PHC-2048",
    });
    assertCondition(
      (await patientRoot.getAttribute("data-chosen-provider-ref")) === chosenProvider,
      "patient reload drifted the chosen provider anchor",
    );
    assertCondition(
      (await patientRoot.getAttribute("data-request-lineage-ref")) === requestLineage,
      "patient reload drifted the request lineage anchor",
    );

    await patientContext.tracing.stop({
      path: outputPath("356-patient-pharmacy-continuity-trace.zip"),
    });
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
