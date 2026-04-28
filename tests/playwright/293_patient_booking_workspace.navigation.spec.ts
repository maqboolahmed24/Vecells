import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  startPatientWeb,
  stopPatientWeb,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingWorkspaceNavigationCoverage = [
  "resume-safe refresh on confirm host",
  "browser-history restoration within the booking shell",
  "selected-anchor preservation across refresh",
  "home, requests, and appointments return-contract variants",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 960 } });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=home&returnRoute=/home&anchor=home-booking-launch&anchorLabel=Home%20next%20action`,
    );
    const root = page.locator("[data-testid='Patient_Booking_Workspace_Route']");
    const shellKey = await page
      .getByTestId("booking-return-contract-binder")
      .getAttribute("data-shell-continuity-key");
    assertCondition(Boolean(shellKey), "shell continuity key missing");

    await page.getByTestId("booking-primary-action").click();
    await page.waitForURL(/\/bookings\/booking_case_293_live\/select\?/);
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      return root?.getAttribute("data-route-key") === "select";
    });
    await page.getByTestId("booking-open-confirmation-host").click();
    await page.waitForURL(/\/bookings\/booking_case_293_live\/confirm\?/);
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      return root?.getAttribute("data-route-key") === "confirm";
    });
    const selectedAnchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");

    await page.reload({ waitUntil: "load" });
    await page.locator("[data-testid='Patient_Booking_Workspace_Route']").waitFor();
    assertCondition(
      (await page.getByTestId("booking-return-contract-binder").getAttribute("data-shell-continuity-key")) ===
        shellKey,
      "reload replaced the shell continuity key",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === selectedAnchorBeforeReload,
      "reload did not preserve the selected anchor",
    );
    assertCondition(
      Boolean(await root.getAttribute("data-restore-storage-key")),
      "restore storage key missing after reload",
    );

    await page.goBack({ waitUntil: "load" });
    await page.locator("[data-testid='Patient_Booking_Workspace_Route']").waitFor();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      return root?.getAttribute("data-route-key") === "select";
    });
    assertCondition((await root.getAttribute("data-route-key")) === "select", "browser back should restore select host");

    await page.goBack({ waitUntil: "load" });
    await page.locator("[data-testid='Patient_Booking_Workspace_Route']").waitFor();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='Patient_Booking_Workspace_Route']");
      return root?.getAttribute("data-route-key") === "workspace";
    });
    assertCondition((await root.getAttribute("data-route-key")) === "workspace", "browser back should restore workspace host");
    assertCondition(
      (await page.getByTestId("booking-return-contract-binder").getAttribute("data-return-route-ref")) === "/home",
      "home return route drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=requests&returnRoute=/requests&anchor=requests-booking-launch&anchorLabel=Requests%20list`,
    );
    assertCondition(
      (await page.getByTestId("booking-return-button").textContent())?.includes("Requests") ?? false,
      "requests origin should label the quiet return stub",
    );
    assertCondition(
      (await page.getByTestId("booking-return-contract-binder").getAttribute("data-return-route-ref")) ===
        "/requests",
      "requests return route drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments&anchor=appointments-upcoming&anchorLabel=Appointments%20summary`,
    );
    assertCondition(
      (await page.getByTestId("booking-return-button").textContent())?.includes("Appointments") ?? false,
      "appointments origin should label the quiet return stub",
    );
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "self_service_live",
      "origin changes must not mutate the live capability posture",
    );
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
