import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingWorkspaceCoverage = [
  "signed-in booking shell entry",
  "dominant action follows capability posture",
  "same-shell child host transitions",
  "assisted-only shell posture",
  "degraded-manual shell posture",
  "blocked shell posture",
  "no detached generic recovery page",
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

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments`,
    );

    const root = page.locator("[data-testid='Patient_Booking_Workspace_Route']");
    assertCondition((await root.getAttribute("data-shell")) === "patient-booking", "shell marker drifted");
    assertCondition(
      (await root.getAttribute("data-shell-frame")) === "signed-in-patient",
      "signed-in shell marker drifted",
    );
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "self_service_live",
      "live route should expose self_service_live posture",
    );
    assertCondition(
      (await root.getAttribute("data-dominant-action")) === "search_slots",
      "dominant action should come from capability posture",
    );
    assertCondition((await page.locator("header").count()) >= 1, "header landmark missing");
    assertCondition((await page.locator("nav").count()) >= 1, "navigation landmark missing");
    assertCondition((await page.locator("main").count()) === 1, "expected exactly one main landmark");

    await page.getByTestId("booking-primary-action").click();
    await page.waitForURL(/\/bookings\/booking_case_293_live\/select\?/);
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      return root?.getAttribute("data-route-key") === "select";
    });
    assertCondition((await root.getAttribute("data-route-key")) === "select", "select route marker drifted");
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "booking-content-stage",
      "select route should pin the content stage anchor",
    );

    await page.getByTestId("booking-open-confirmation-host").click();
    await page.waitForURL(/\/bookings\/booking_case_293_live\/confirm\?/);
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      return root?.getAttribute("data-route-key") === "confirm";
    });
    assertCondition(
      (await root.getAttribute("data-route-key")) === "confirm",
      "confirm route marker drifted",
    );
    assertCondition(
      (await page.getByTestId("booking-content-stage").getAttribute("data-route-key")) === "confirm",
      "content stage should stay mounted on confirm host",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_assisted?origin=home&returnRoute=/home`,
    );
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "assisted_only",
      "assisted case posture drifted",
    );
    assertCondition(
      ((await page.getByTestId("booking-primary-action").textContent()) || "").includes("Need help booking"),
      "assisted-only posture should promote help as the dominant action",
    );
    assertCondition(
      (await page.getByTestId("booking-content-stage").textContent())?.includes("shell") ?? false,
      "assisted posture should still render the shared shell stage",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_degraded?origin=requests&returnRoute=/requests`,
    );
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "degraded_manual",
      "degraded case posture drifted",
    );
    assertCondition(
      (await page.getByTestId("booking-primary-action").textContent())?.includes("practice booking line") ??
        false,
      "degraded posture should switch the dominant action away from stale self-service",
    );
    assertCondition(
      (await page.locator("[data-testid='booking-open-confirmation-host']").count()) === 0,
      "degraded posture must not leave confirmation affordances visible",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_blocked?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition((await root.getAttribute("data-shell-state")) === "read_only", "blocked shell state drifted");
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "blocked",
      "blocked case posture drifted",
    );
    await page.getByTestId("booking-primary-action").click();
    assertCondition(
      await page.getByTestId("booking-provenance-card").isVisible(),
      "blocked posture should keep the last safe provenance visible in-place",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_recovery?origin=recovery&returnRoute=/home`,
    );
    assertCondition(
      (await root.getAttribute("data-shell-state")) === "recovery_required",
      "recovery shell state drifted",
    );
    assertCondition(
      (await root.getAttribute("data-continuity-state")) === "recovery_required",
      "recovery continuity marker drifted",
    );
    assertCondition(
      (await page.getByTestId("booking-content-stage").textContent())?.includes("Recovery stays in place") ??
        false,
      "recovery posture should remain inside the shared stage",
    );
    assertCondition(
      externalRequests.size === 0,
      `workspace should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({ path: outputPath("293-patient-booking-workspace-trace.zip") });
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
