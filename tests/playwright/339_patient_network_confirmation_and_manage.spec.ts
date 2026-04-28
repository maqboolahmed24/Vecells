import {
  assertCondition,
  assertNetworkManageProjection,
  assertPatientConfirmationProjection,
  captureAria,
  expectedManageProjection,
  expectedManageProjectionForConfirmation,
  importPlaywright,
  networkConfirmationUrl,
  networkManageUrl,
  openNetworkConfirmationRoute,
  openNetworkManageRoute,
  outputPath,
  startPatientWeb,
  startTrace,
  stopPatientWeb,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForNetworkManageState,
  writeJsonArtifact,
} from "./339_commit_mesh_no_slot_reopen.helpers.ts";

export const patientCommitMeshCoverage339 = [
  "confirmation routes hand off to the correct manage posture instead of widening calmness optimistically",
  "pending, calm, blocked, and embedded confirmation states stay aligned with the live manage route family",
  "repair and reconciliation manage states remain same-shell instead of collapsing into detached support copy",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);

    try {
      const page = await context.newPage();
      trackExternalRequests(page, baseUrl, externalRequests);

      await openNetworkConfirmationRoute(
        page,
        networkConfirmationUrl(baseUrl, {
          scenarioId: "network_confirmation_329_pending",
        }),
      );
      await assertPatientConfirmationProjection(page, "network_confirmation_329_pending", "browser");
      const pendingManage = expectedManageProjectionForConfirmation("network_confirmation_329_pending");
      await page
        .getByTestId("patient-confirmation-manage-stub")
        .getByRole("button", { name: "Open managed follow-on" })
        .click();
      await waitForNetworkManageState(page, {
        scenarioId: pendingManage.manageScenarioId,
      });
      await assertNetworkManageProjection(page, pendingManage.manageScenarioId, "browser");

      await openNetworkConfirmationRoute(
        page,
        networkConfirmationUrl(baseUrl, {
          scenarioId: "network_confirmation_329_practice_acknowledged",
          host: "nhs_app",
          safeArea: "bottom",
        }),
      );
      await assertPatientConfirmationProjection(
        page,
        "network_confirmation_329_practice_acknowledged",
        "nhs_app",
      );
      const confirmedManage = expectedManageProjectionForConfirmation(
        "network_confirmation_329_practice_acknowledged",
      );
      await page
        .getByTestId("patient-confirmation-manage-stub")
        .getByRole("button", { name: "Open managed follow-on" })
        .click();
      await waitForNetworkManageState(page, {
        scenarioId: confirmedManage.manageScenarioId,
        embeddedMode: "nhs_app",
      });
      await assertNetworkManageProjection(page, confirmedManage.manageScenarioId, "nhs_app");

      await openNetworkConfirmationRoute(
        page,
        networkConfirmationUrl(baseUrl, {
          scenarioId: "network_confirmation_329_supplier_drift",
        }),
      );
      await assertPatientConfirmationProjection(
        page,
        "network_confirmation_329_supplier_drift",
        "browser",
      );
      const driftManage = expectedManageProjectionForConfirmation(
        "network_confirmation_329_supplier_drift",
      );
      await page
        .getByTestId("patient-confirmation-manage-stub")
        .getByRole("button", { name: "Open managed follow-on" })
        .click();
      await waitForNetworkManageState(page, {
        scenarioId: driftManage.manageScenarioId,
      });
      await assertNetworkManageProjection(page, driftManage.manageScenarioId, "browser");

      await openNetworkManageRoute(
        page,
        networkManageUrl(baseUrl, {
          scenarioId: "network_manage_330_contact_repair",
        }),
      );
      await assertNetworkManageProjection(page, "network_manage_330_contact_repair", "browser");
      const repairAria = await captureAria(page.getByTestId("Patient_Network_Manage_Route"), page);
      const repairProjection = expectedManageProjection("network_manage_330_contact_repair");
      const repairText =
        (await page.getByTestId("Patient_Network_Manage_Route").textContent()) ?? "";
      assertCondition(
        repairText.includes(repairProjection.contactRepairJourney?.heading ?? ""),
        "contact repair route lost the repair heading",
      );

      writeJsonArtifact("339-patient-network-confirmation-and-manage.json", {
        confirmationToManage: {
          pending: pendingManage.manageScenarioId,
          acknowledgedEmbedded: confirmedManage.manageScenarioId,
          supplierDrift: driftManage.manageScenarioId,
        },
        directRepairScenario: repairProjection.scenarioId,
        directRepairSettlement: repairProjection.settlementPanel?.settlementResult ?? "none",
        aria: {
          manageRepairRoute: repairAria,
        },
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );

      await page.screenshot({
        path: outputPath("339-patient-network-confirmation-and-manage.png"),
        fullPage: true,
      });
      await stopTrace(context, "339-patient-network-confirmation-and-manage-trace.zip");
    } catch (error) {
      await stopTraceOnError(context, "339-patient-network-confirmation-and-manage-trace.zip", error);
    } finally {
      await context.close();
    }
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
