import {
  assertCondition,
  importPlaywright,
  openPatientRequestRoute,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  patientPharmacyUrl,
  startClinicalWorkspace,
  startPatientWeb,
  startPharmacyConsole,
  stopClinicalWorkspace,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForPatientRequestState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./368_pharmacy_loop_merge.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [
    { child: patientChild, baseUrl: patientBaseUrl },
    { child: workspaceChild, baseUrl: workspaceBaseUrl },
    { child: pharmacyChild, baseUrl: pharmacyBaseUrl },
  ] = await Promise.all([startPatientWeb(), startClinicalWorkspace(), startPharmacyConsole()]);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const triageContext = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const triagePage = await triageContext.newPage();
    await triagePage.goto(`${workspaceBaseUrl}/?state=quiet`, { waitUntil: "networkidle" });
    await triagePage.locator("[data-testid='WorkspaceHomeRoute']").waitFor();
    const triageCard = triagePage.locator(
      "[data-testid='CrossDomainTaskStrip'] [data-domain='pharmacy'][data-request-ref='request_211_b'][data-pharmacy-case-id='PHC-2057']",
    );
    await triageCard.waitFor();
    assertCondition(
      ((await triageCard.textContent()) ?? "").includes("Pharmacy route created"),
      "Triage workspace should expose the triage-created pharmacy continuation card.",
    );

    const patientContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();
    await openPatientRequestRoute(patientPage, patientBaseUrl, "request_211_b");
    await waitForPatientRequestState(patientPage, {
      routeKey: "request_detail",
      requestRef: "request_211_b",
    });

    const childCard = patientPage.getByTestId("pharmacy-child-card-PHC-2057");
    await childCard.waitFor();
    assertCondition(
      (await childCard.getAttribute("data-merge-state")) === "dispatch_pending",
      "Request detail should show the pending pharmacy child state.",
    );
    assertCondition(
      ((await childCard.textContent()) ?? "").includes("Referral proof pending"),
      "Request detail should show the authoritative pharmacy child status.",
    );

    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2057", "status"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
    });
    const patientRoot = patientPage.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await patientRoot.getAttribute("data-patient-status-surface-state")) === "dispatch_pending",
      "Patient pharmacy route should keep the dispatch-pending truth for PHC-2057.",
    );
    assertCondition(
      ((await patientRoot.getAttribute("data-request-lineage-ref")) ?? "").includes("lineage 2057"),
      "Patient pharmacy route should preserve the authoritative request-lineage label for PHC-2057.",
    );

    const pharmacyContext = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const pharmacyPage = await pharmacyContext.newPage();
    await openWorkspacePharmacyRoute(
      pharmacyPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057"),
    );
    await waitForWorkspacePharmacyState(pharmacyPage, {
      currentPath: "/workspace/pharmacy/PHC-2057",
      routeKey: "case",
      selectedCaseId: "PHC-2057",
    });
    const pharmacyRoot = pharmacyPage.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await pharmacyRoot.getAttribute("data-selected-case-id")) === "PHC-2057",
      "Pharmacy console should open the same PHC-2057 case selected from triage and request detail.",
    );
    assertCondition(
      ((await pharmacyPage.textContent("body")) ?? "").includes("Harbour Pharmacy Group"),
      "Pharmacy console case view should expose the seeded provider context for PHC-2057.",
    );

    await Promise.all([triageContext.close(), patientContext.close(), pharmacyContext.close()]);
  } finally {
    await browser.close();
    await Promise.all([
      stopPatientWeb(patientChild),
      stopClinicalWorkspace(workspaceChild),
      stopPharmacyConsole(pharmacyChild),
    ]);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
