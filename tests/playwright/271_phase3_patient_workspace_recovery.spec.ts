import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffMoreInfoRoute,
  readAttributes,
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
    const staff = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const patient = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await Promise.all([
      staff.emulateMedia({ reducedMotion: "reduce" }),
      patient.emulateMedia({ reducedMotion: "reduce" }),
    ]);

    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=expired",
    );
    const expiredRoute = patient.locator("[data-testid='PatientConversationRoute']");
    assertCondition(
      (await expiredRoute.getAttribute("data-due-state")) === "expired",
      "expired patient more-info route must publish expired due state",
    );
    assertCondition(
      (await expiredRoute.getAttribute("data-reply-eligibility-state")) === "expired",
      "expired patient more-info route must publish expired reply eligibility",
    );
    assertCondition(
      (await expiredRoute.getAttribute("data-secure-link-access-state")) === "expired_link",
      "expired patient more-info route must publish expired-link access state",
    );
    assertCondition(
      (await expiredRoute.getAttribute("data-dominant-patient-action")) === "return_to_request",
      "expired patient more-info route must keep the dominant action inside the same shell",
    );

    await openStaffMoreInfoRoute(staff, pair.workspaceBaseUrl, "task-311", "blocked");
    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=blocked",
    );
    const staffBlocked = staff.locator("[data-testid='MoreInfoInlineSideStage']");
    const patientBlocked = patient.locator("[data-testid='PatientConversationRoute']");
    const blockedStaffParity = await readAttributes(staffBlocked, [
      "data-phase3-bundle-ref",
      "data-due-state",
      "data-reply-eligibility-state",
      "data-secure-link-access-state",
      "data-delivery-posture",
      "data-repair-posture",
      "data-dominant-next-action",
    ]);
    const blockedPatientParity = await readAttributes(patientBlocked, [
      "data-phase3-bundle-ref",
      "data-due-state",
      "data-reply-eligibility-state",
      "data-secure-link-access-state",
      "data-delivery-posture",
      "data-repair-posture",
      "data-dominant-patient-action",
    ]);
    assertCondition(
      blockedStaffParity["data-phase3-bundle-ref"] === blockedPatientParity["data-phase3-bundle-ref"],
      "blocked staff and patient more-info routes must preserve one 271 bundle",
    );
    assertCondition(
      blockedStaffParity["data-due-state"] === blockedPatientParity["data-due-state"],
      "blocked staff and patient more-info routes must agree on due state",
    );
    assertCondition(
      blockedStaffParity["data-reply-eligibility-state"] ===
        blockedPatientParity["data-reply-eligibility-state"],
      "blocked staff and patient more-info routes must agree on reply eligibility",
    );
    assertCondition(
      blockedStaffParity["data-secure-link-access-state"] ===
        blockedPatientParity["data-secure-link-access-state"],
      "blocked staff and patient more-info routes must agree on secure-link state",
    );
    assertCondition(
      blockedStaffParity["data-delivery-posture"] === blockedPatientParity["data-delivery-posture"],
      "blocked staff and patient more-info routes must agree on delivery posture",
    );
    assertCondition(
      blockedStaffParity["data-repair-posture"] === blockedPatientParity["data-repair-posture"],
      "blocked staff and patient more-info routes must agree on repair posture",
    );
    assertCondition(
      blockedStaffParity["data-dominant-next-action"] ===
        blockedPatientParity["data-dominant-patient-action"],
      "blocked staff and patient more-info routes must agree on the dominant action",
    );

    await openStaffMoreInfoRoute(staff, pair.workspaceBaseUrl, "task-311", "stale");
    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_messages",
      "state=stale&origin=messages",
    );
    const staleTaskShell = staff.locator("[data-testid='ActiveTaskShell']");
    const staleThreadPanel = staff.locator("[data-testid='PatientResponseThreadPanel']");
    const stalePatient = patient.locator("[data-testid='PatientConversationRoute']");
    assertCondition(
      (await staleTaskShell.getAttribute("data-delivery-posture")) === "stale_recoverable",
      "stale task shell must publish stale-recoverable delivery posture",
    );
    assertCondition(
      (await staleTaskShell.getAttribute("data-repair-posture")) === "recovery_required",
      "stale task shell must publish recovery-required repair posture",
    );
    assertCondition(
      (await stalePatient.getAttribute("data-patient-conversation-state")) === "stale_recoverable",
      "stale patient route must remain inside the same shell with stale-recoverable posture",
    );
    assertCondition(
      (await stalePatient.getAttribute("data-phase3-bundle-ref")) ===
        (await staleThreadPanel.getAttribute("data-phase3-bundle-ref")),
      "stale patient thread and staff thread panel must preserve one 271 bundle",
    );
    assertCondition(
      (await stalePatient.getAttribute("data-evidence-delta-packet-ref")) ===
        (await staleThreadPanel.getAttribute("data-evidence-delta-packet-ref")),
      "stale patient thread and staff thread panel must preserve one evidence delta packet",
    );

    await assertWorkspaceNoHorizontalOverflow(staff, "271 reduced-motion staff recovery routes");
    await assertPatientNoHorizontalOverflow(patient, "271 reduced-motion patient recovery routes");
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
