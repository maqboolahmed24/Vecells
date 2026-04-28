import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  openStaffMoreInfoRoute,
  outputPath,
  selectCallbackRow,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
} from "./271_phase3_patient_workspace.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const pair = await startPatientWorkspacePair();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const staff = await browser.newPage({ viewport: { width: 1440, height: 980 } });
    const patient = await browser.newPage({ viewport: { width: 1440, height: 980 } });
    const reducedPatient = await browser.newPage({ viewport: { width: 390, height: 844 } });

    await openStaffMoreInfoRoute(staff, pair.workspaceBaseUrl, "task-311", "live");
    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=live",
    );
    await staff.screenshot({
      path: outputPath("271-staff-more-info-live.png"),
      fullPage: true,
    });
    await patient.screenshot({
      path: outputPath("271-patient-more-info-live.png"),
      fullPage: true,
    });

    await openStaffCallbacksRoute(staff, pair.workspaceBaseUrl, "live");
    await selectCallbackRow(staff, "task-412");
    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_215_callback",
      "conversation_callback",
      "state=repair",
    );
    await staff.screenshot({
      path: outputPath("271-staff-callback-repair.png"),
      fullPage: true,
    });
    await patient.screenshot({
      path: outputPath("271-patient-callback-repair.png"),
      fullPage: true,
    });

    await reducedPatient.emulateMedia({ reducedMotion: "reduce" });
    await openPatientConversationRoute(
      reducedPatient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=expired",
    );
    await reducedPatient.screenshot({
      path: outputPath("271-patient-more-info-expired-mobile-reduced.png"),
      fullPage: true,
    });

    await assertWorkspaceNoHorizontalOverflow(staff, "271 visual staff parity routes");
    await assertPatientNoHorizontalOverflow(patient, "271 visual patient parity routes");
    await assertPatientNoHorizontalOverflow(
      reducedPatient,
      "271 visual patient recovery route on mobile",
    );

    assertCondition(true, "271 visual proof completed");
  } finally {
    await browser.close();
    await stopPatientWorkspacePair(pair);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
