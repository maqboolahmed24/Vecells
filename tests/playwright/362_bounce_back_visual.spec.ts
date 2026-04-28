import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspacePharmacyRoute,
  outputPath,
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

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await desktop.newPage();

    for (const [caseId, fileName] of [
      ["PHC-2103", "362-recovery-urgent-return.png"],
      ["PHC-2204", "362-recovery-routine-reopen.png"],
      ["PHC-2215", "362-recovery-loop-risk-escalation.png"],
    ] as const) {
      await openWorkspacePharmacyRoute(
        page,
        workspacePharmacyUrl(baseUrl, `/workspace/pharmacy/${caseId}/assurance`),
      );
      await waitForWorkspacePharmacyState(page, {
        currentPath: `/workspace/pharmacy/${caseId}/assurance`,
        routeKey: "assurance",
        selectedCaseId: caseId,
      });
      await page.screenshot({
        path: outputPath(fileName),
        fullPage: true,
      });
    }
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const mobilePage = await mobile.newPage();
    await openWorkspacePharmacyRoute(
      mobilePage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(mobilePage, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
    });
    await assertNoHorizontalOverflow(mobilePage, "362 recovery visual mobile");
    await mobilePage.screenshot({
      path: outputPath("362-recovery-loop-risk-mobile.png"),
      fullPage: true,
    });
    await mobile.close();
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
