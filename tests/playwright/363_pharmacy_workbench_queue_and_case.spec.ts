import {
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

async function waitForScrollRestore(page: any, targetY: number): Promise<void> {
  await page.waitForFunction(
    (expected) => window.scrollY >= Math.max(0, Number(expected) - 4),
    targetY,
  );
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
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(page, workspacePharmacyUrl(baseUrl));
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy",
      routeKey: "lane",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-workbench-visual-mode")) === "Pharmacy_Operations_Workbench",
      "Queue root must expose the pharmacy operations workbench visual mode.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOperationsPanel").isVisible(),
      "Queue root must render the operations panel.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOperationsQueueTable").isVisible(),
      "Queue root must render the queue table.",
    );
    assertCondition(
      (await page.locator("table .pharmacy-ops-table__indicator").allTextContents()).includes(
        "Waiting For Patient Choice",
      ),
      "Queue table must expose waiting-for-choice indicators.",
    );
    assertCondition(
      (await page.locator("table .pharmacy-ops-table__indicator").allTextContents()).includes(
        "Provider Outage",
      ),
      "Queue table must expose provider-outage indicators.",
    );

    await page.getByTestId("pharmacy-case-PHC-2244").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244",
      routeKey: "case",
      selectedCaseId: "PHC-2244",
    });

    assertCondition(
      await page.getByTestId("PharmacyCaseWorkbench").isVisible(),
      "Opening a queue row must morph into the case workbench inside the same shell.",
    );
    assertCondition(
      await page.getByTestId("MedicationValidationBoard").isVisible(),
      "Case route must keep the medication validation board visible.",
    );
    assertCondition(
      await page.getByTestId("PharmacyWorkbenchDecisionDock").isVisible(),
      "Case route must keep the sticky workbench decision dock visible.",
    );
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "inventory_truth",
      "Case route must promote the inventory truth support region.",
    );
    assertCondition(
      (await page.locator("[data-testid^='pharmacy-workbench-line-'][data-expanded='true']").count()) === 1,
      "Workbench must keep exactly one medication card expanded.",
    );

    await page
      .getByTestId("pharmacy-line-item-PHC-2244-L2")
      .evaluate((button: HTMLButtonElement) => button.click());
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='pharmacy-shell-root']")
          ?.getAttribute("data-selected-line-item-id") === "PHC-2244-L2",
    );
    assertCondition(
      (await root.getAttribute("data-selected-line-item-id")) === "PHC-2244-L2",
      "Selecting a medication line must update the shell-selected line item.",
    );

    await page.getByTestId("pharmacy-route-button-inventory").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/inventory",
      routeKey: "inventory",
      selectedCaseId: "PHC-2244",
    });
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "inventory_comparison",
      "Inventory route must promote the inventory comparison support region.",
    );

    const targetY = await page.evaluate(() =>
      Math.max(0, Math.min(640, document.documentElement.scrollHeight - window.innerHeight)),
    );
    await page.evaluate((nextY) => window.scrollTo({ top: Number(nextY), behavior: "auto" }), targetY);
    await page.waitForTimeout(100);

    await page.reload({ waitUntil: "load" });
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/inventory",
      routeKey: "inventory",
      selectedCaseId: "PHC-2244",
    });
    assertCondition(
      (await root.getAttribute("data-selected-line-item-id")) === "PHC-2244-L2",
      "Refreshing the inventory route must restore the selected line item.",
    );
    await waitForScrollRestore(page, targetY);
    assertCondition(
      (await page.evaluate(() => window.scrollY)) >= Math.max(0, targetY - 4),
      "Refreshing the same-shell inventory route must restore the scroll position.",
    );

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
