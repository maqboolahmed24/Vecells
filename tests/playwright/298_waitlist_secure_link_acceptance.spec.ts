import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientWaitlistSecureLinkCoverage = [
  "secure-link waitlist offer keeps the same-shell banner and return contract",
  "accepting from a secure-link waitlist route preserves the pinned offer while moving to pending",
  "support and fallback context remain in the signed-in booking shell instead of a detached mini-site",
];

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

    const routeRoot = page.getByTestId("Patient_Booking_Workspace_Route");
    const binder = page.getByTestId("booking-return-contract-binder");
    const waitlistStage = page.getByTestId("patient-waitlist-stage");
    const offerCard = page.getByTestId("active-waitlist-offer-card");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_secure_link_offer/waitlist?origin=secure_link&returnRoute=/recovery/secure-link`,
    );
    await waitlistStage.waitFor();
    assertCondition((await routeRoot.getAttribute("data-route-key")) === "waitlist", "secure-link route marker drifted");
    assertCondition(
      (await binder.getAttribute("data-return-route-ref")) === "/recovery/secure-link",
      "secure-link return contract drifted",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-entry-mode")) === "secure_link",
      "secure-link entry marker drifted",
    );
    assertCondition(
      await page.getByTestId("waitlist-secure-link-banner").isVisible(),
      "secure-link continuation banner should remain visible",
    );
    assertCondition(
      (await offerCard.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "secure-link offer should keep honest nonexclusive wording",
    );
    assertCondition(
      ((await page.getByTestId("waitlist-secure-link-banner").textContent()) || "").includes("same waitlist context"),
      "secure-link banner copy drifted away from same-shell continuity",
    );

    await page.getByTestId("waitlist-sticky-primary-action").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        stage?.getAttribute("data-waitlist-state") === "accepted_pending" &&
        stage?.getAttribute("data-reservation-truth") === "pending_confirmation"
      );
    });
    assertCondition(
      await page.getByTestId("waitlist-offer-accept-view").isVisible(),
      "secure-link acceptance should settle into the pending same-shell view",
    );
    assertCondition(
      await offerCard.isVisible(),
      "secure-link acceptance should keep the active offer card pinned",
    );
    assertCondition(
      (await routeRoot.getAttribute("data-shell-frame")) === "signed-in-patient",
      "secure-link route should still render inside the signed-in patient shell",
    );

    assertCondition(
      externalRequests.size === 0,
      `secure-link waitlist route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({ path: outputPath("298-waitlist-secure-link-trace.zip") });
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
