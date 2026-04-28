import {
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  outputPath,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

async function tabUntilTestId(page: any, expectedTestId: string, maxTabs = 24): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? null,
    );
    if (activeTestId === expectedTestId) {
      return;
    }
  }
  throw new Error(`Failed to reach ${expectedTestId} by keyboard.`);
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
      viewport: { width: 1440, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-dispatch-visual-mode")) === "Pharmacy_Dispatch_Assurance",
      "Staff shell must expose the dispatch-assurance visual mode.",
    );
    assertCondition(
      (await root.getAttribute("data-dispatch-surface-state")) === "dispatch_pending",
      "PHC-2057 should render as dispatch pending.",
    );
    assertCondition(
      (await root.getAttribute("data-dispatch-authoritative-proof-state")) === "pending",
      "PHC-2057 must expose pending authoritative proof.",
    );
    assertCondition(
      (await root.getAttribute("data-consent-checkpoint-state")) === "satisfied",
      "PHC-2057 should keep consent current while proof is pending.",
    );

    const openButton = page.getByTestId("open-referral-confirmation-drawer");
    await openButton.click();

    const drawer = page.getByTestId("PharmacyReferralConfirmationDrawer");
    await drawer.waitFor();
    assertCondition(
      (await drawer.getAttribute("role")) === "dialog" &&
        (await drawer.getAttribute("aria-modal")) === "true",
      "Referral confirmation drawer must behave as a modal dialog.",
    );
    assertCondition(
      (await page.evaluate(() => document.activeElement?.tagName)) === "H2",
      "Drawer should move focus to the dialog heading on open.",
    );

    for (const rowId of [
      "transport_acceptance",
      "provider_acceptance",
      "authoritative_proof",
      "proof_deadline",
      "recovery_owner",
    ]) {
      await page.getByTestId(`dispatch-evidence-row-${rowId}`).waitFor();
    }

    await tabUntilTestId(page, "dispatch-drawer-close");
    await tabUntilTestId(page, "dispatch-evidence-row-transport_acceptance");
    await page.keyboard.press("Enter");
    assertCondition(
      (await page
        .getByTestId("dispatch-evidence-row-transport_acceptance")
        .getAttribute("aria-expanded")) === "true",
      "Transport acceptance evidence row must be keyboard reachable and expandable.",
    );

    await tabUntilTestId(page, "dispatch-artifact-summary-toggle");
    assertCondition(
      await page.getByText("Attachment preview").isVisible(),
      "Artifact summary should disclose omitted artifacts.",
    );
    assertCondition(
      await page.getByText("Patient summary").isVisible(),
      "Artifact summary should disclose redacted artifacts.",
    );
    await page.keyboard.press("Enter");
    assertCondition(
      (await page.getByTestId("dispatch-artifact-summary-toggle").getAttribute("aria-expanded")) ===
        "false",
      "Artifact summary toggle must collapse by keyboard.",
    );

    await page.keyboard.press("Escape");
    assertCondition(
      await drawer.isHidden(),
      "Escape should close the referral confirmation drawer.",
    );
    assertCondition(
      (await page.evaluate(
        () => document.activeElement?.getAttribute("data-testid") ?? null,
      )) === "open-referral-confirmation-drawer",
      "Focus must return to the drawer invoker after close.",
    );

    await context.tracing.stop({
      path: outputPath("359-referral-confirmation-drawer-trace.zip"),
    });
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
