import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export const waitlistOfferAndFallbackCoverage = [
  "actionable waitlist offers remain truthful and only widen to pending after explicit acceptance",
  "expired and superseded offers stay as provenance with the next safe action made explicit",
  "fallback-due and overdue callback postures switch the dominant action away from waiting",
  "mobile waitlist affordances keep focus visible, target size safe, and reflow intact",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible waitlist root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "waitlist accessibility snapshot missing");
  return snapshot;
}

function writeAriaFile(fileName: string, snapshot: string | Record<string, unknown>): void {
  const content = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath(fileName), content, "utf-8");
}

async function assertTargetSize(locator: any, label: string): Promise<void> {
  const box = await locator.boundingBox();
  assertCondition(box, `${label} target box missing`);
  assertCondition(
    box.width >= 24 && box.height >= 24,
    `${label} target smaller than 24x24 CSS pixels`,
  );
}

async function assertFocusedVisible(locator: any, page: any, label: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assertCondition(box, `${label} focus box missing`);
  assertCondition(viewport, `${label} viewport missing`);
  assertCondition(
    box.x + box.width > 0 &&
      box.y + box.height > 0 &&
      box.x < viewport.width &&
      box.y < viewport.height,
    `${label} focus became obscured or off-screen`,
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    const waitlistStage = page.getByTestId("patient-waitlist-stage");
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await waitlistStage.waitFor();
    assertCondition(
      (await waitlistStage.getAttribute("data-waitlist-state")) === "offer_actionable",
      "actionable offer state marker drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-continuation-truth")) === "offer_available",
      "actionable offer continuation truth drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "actionable offer reservation truth drifted",
    );
    assertCondition(
      await page.getByTestId("active-waitlist-offer-card").isVisible(),
      "actionable waitlist offer should keep the active offer card visible",
    );
    assertCondition(
      (await page.locator("[role='status'][aria-live='polite']").count()) >= 1,
      "waitlist route should expose at least one polite live region",
    );
    await writeAccessibilitySnapshot(page, "308-waitlist-actionable-accessibility.json");
    writeAriaFile("308-waitlist-actionable-aria.yml", await captureAria(waitlistStage, page));
    const actionableAccept = page.locator("[data-action-ref='accept_waitlist_offer']").first();
    await actionableAccept.waitFor();
    await assertTargetSize(actionableAccept, "waitlist accept action");
    await assertFocusedVisible(actionableAccept, page, "waitlist accept action");
    await actionableAccept.click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-waitlist-state") === "accepted_pending" &&
        stage?.getAttribute("data-reservation-truth") === "pending_confirmation"
      );
    });
    assertCondition(
      await page.getByTestId("waitlist-offer-accept-view").isVisible(),
      "accepted-pending waitlist view should render after explicit acceptance",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_expired/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-offer-expiry-mode")) === "expired",
      "expired waitlist offer marker drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-continuation-truth")) === "expired",
      "expired waitlist route should keep expired continuation truth explicit",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_superseded/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-offer-expiry-mode")) === "superseded",
      "superseded waitlist offer marker drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-continuation-truth")) === "offer_available",
      "superseded waitlist route should keep the newer offer as the active continuation",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_fallback_due/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-window-risk-state")) === "fallback_due",
      "fallback-due waitlist marker drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-fallback-route")) === "callback",
      "fallback-due waitlist route must stay callback-bound",
    );
    assertCondition(
      await page.getByTestId("waitlist-fallback-panel").isVisible(),
      "fallback-due waitlist route should render the fallback panel",
    );
    await page.locator("[data-action-ref='fallback_to_callback']").first().click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-window-risk-state") === "overdue" &&
        stage?.getAttribute("data-continuation-truth") === "callback_expected"
      );
    });
    assertCondition(
      (await waitlistStage.getAttribute("data-fallback-route")) === "callback",
      "overdue waitlist route must preserve callback fallback authority",
    );
    assertCondition(
      (await page.locator("[data-action-ref='accept_waitlist_offer']").count()) === 0,
      "overdue callback posture must not leave offer acceptance visible",
    );

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    trackExternalRequests(mobilePage, baseUrl, externalRequests);
    await openBookingRoute(
      mobilePage,
      `${baseUrl}/bookings/booking_case_298_fallback_due/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    const mobilePrimary = mobilePage.getByTestId("waitlist-sticky-primary-action");
    await mobilePrimary.waitFor();
    await assertTargetSize(mobilePrimary, "mobile waitlist sticky primary action");
    await assertFocusedVisible(mobilePrimary, mobilePage, "mobile waitlist sticky primary action");
    await assertNoHorizontalOverflow(mobilePage, "308 waitlist fallback mobile");
    await writeAccessibilitySnapshot(mobilePage, "308-waitlist-overdue-mobile-accessibility.json");
    await mobileContext.close();

    assertCondition(
      externalRequests.size === 0,
      `waitlist browser proof should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("308-waitlist-offer-and-fallback-trace.zip"),
    });
    await context.close();
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
