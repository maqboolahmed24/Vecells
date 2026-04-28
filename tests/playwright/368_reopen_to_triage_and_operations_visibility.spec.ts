import {
  assertCondition,
  importPlaywright,
  openOpsOverview,
  openPatientRequestRoute,
  startClinicalWorkspace,
  startOpsConsole,
  startPatientWeb,
  stopClinicalWorkspace,
  stopOpsConsole,
  stopPatientWeb,
  waitForPatientRequestState,
} from "./368_pharmacy_loop_merge.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [
    { child: patientChild, baseUrl: patientBaseUrl },
    { child: workspaceChild, baseUrl: workspaceBaseUrl },
    { child: opsChild, baseUrl: opsBaseUrl },
  ] = await Promise.all([startPatientWeb(), startClinicalWorkspace(), startOpsConsole()]);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();
    await openPatientRequestRoute(patientPage, patientBaseUrl, "request_215_callback");
    await waitForPatientRequestState(patientPage, {
      routeKey: "request_detail",
      requestRef: "request_215_callback",
    });
    const requestChildCard = patientPage.getByTestId("pharmacy-child-card-PHC-2103");
    await requestChildCard.waitFor();
    assertCondition(
      (await requestChildCard.getAttribute("data-merge-state")) === "urgent_return",
      "Reopened request detail should expose the urgent-return pharmacy child state.",
    );
    assertCondition(
      ((await requestChildCard.textContent()) ?? "").includes(
        "Urgent return reopened the original request context",
      ),
      "Reopened request detail should preserve the original urgent-return anchor summary.",
    );

    const workspaceContext = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const workspacePage = await workspaceContext.newPage();
    await workspacePage.goto(`${workspaceBaseUrl}/?state=blocking`, {
      waitUntil: "networkidle",
    });
    await workspacePage.locator("[data-testid='WorkspaceHomeRoute']").waitFor();
    const triageCard = workspacePage.locator(
      "[data-testid='CrossDomainTaskStrip'] [data-domain='pharmacy'][data-request-ref='request_215_callback'][data-pharmacy-case-id='PHC-2103']",
    );
    await triageCard.waitFor();
    assertCondition(
      ((await triageCard.textContent()) ?? "").includes("Urgent pharmacy return"),
      "Blocking staff-entry scenario should surface the urgent pharmacy return card.",
    );
    assertCondition(
      (await triageCard.getAttribute("data-changed-since-seen")) ===
        "Urgent return reopened the original request context",
      "Staff-entry card should surface the authoritative urgent-return changed-since-seen label.",
    );

    const opsContext = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const opsPage = await opsContext.newPage();
    await openOpsOverview(opsPage, opsBaseUrl);
    const opsRoot = opsPage.locator("[data-testid='ops-shell-root']");
    assertCondition(
      (await opsRoot.getAttribute("data-selected-anomaly-id")) === "ops-route-pharmacy-2103",
      "Ops overview should promote the urgent pharmacy return anomaly by default.",
    );
    const opsAnomaly = opsPage.getByTestId("ops-anomaly-ops-route-pharmacy-2103");
    await opsAnomaly.waitFor();
    const opsText = (await opsPage.textContent("body")) ?? "";
    assertCondition(
      opsText.includes("PHC-2103") && opsText.includes("request_215_callback"),
      "Ops overview should keep both the pharmacy case id and original request anchor visible.",
    );
    assertCondition(
      opsText.includes("Urgent return reopened the original request context"),
      "Ops overview should use the same urgent-return continuity explanation as the request surface.",
    );

    await Promise.all([patientContext.close(), workspaceContext.close(), opsContext.close()]);
  } finally {
    await browser.close();
    await Promise.all([
      stopPatientWeb(patientChild),
      stopClinicalWorkspace(workspaceChild),
      stopOpsConsole(opsChild),
    ]);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
