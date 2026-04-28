import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffMoreInfoRoute,
  openStaffTaskRoute,
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
    const staff = await browser.newPage({ viewport: { width: 1480, height: 980 } });
    const patient = await browser.newPage({ viewport: { width: 1440, height: 980 } });

    await openStaffMoreInfoRoute(staff, pair.workspaceBaseUrl, "task-311", "live");
    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=live",
    );

    const moreInfoStage = staff.locator("[data-testid='MoreInfoInlineSideStage']");
    const patientRoute = patient.locator("[data-testid='PatientConversationRoute']");
    const parityAttributes = [
      "data-phase3-bundle-ref",
      "data-request-lineage-ref",
      "data-more-info-cycle-ref",
      "data-reply-window-checkpoint",
      "data-due-state",
      "data-reply-eligibility-state",
      "data-secure-link-access-state",
      "data-delivery-posture",
      "data-repair-posture",
      "data-dominant-next-action",
    ] as const;
    const staffParity = await readAttributes(moreInfoStage, parityAttributes);
    const patientParity = await readAttributes(patientRoute, [
      "data-phase3-bundle-ref",
      "data-request-lineage-ref",
      "data-more-info-cycle-ref",
      "data-reply-window-checkpoint",
      "data-due-state",
      "data-reply-eligibility-state",
      "data-secure-link-access-state",
      "data-delivery-posture",
      "data-repair-posture",
      "data-dominant-patient-action",
    ]);

    assertCondition(
      staffParity["data-phase3-bundle-ref"] === patientParity["data-phase3-bundle-ref"],
      "staff and patient more-info routes must resolve the same 271 bundle",
    );
    assertCondition(
      staffParity["data-request-lineage-ref"] === patientParity["data-request-lineage-ref"],
      "staff and patient more-info routes must preserve the same request lineage",
    );
    assertCondition(
      staffParity["data-more-info-cycle-ref"] === patientParity["data-more-info-cycle-ref"],
      "staff and patient more-info routes must preserve the same cycle ref",
    );
    assertCondition(
      staffParity["data-reply-window-checkpoint"] === patientParity["data-reply-window-checkpoint"],
      "staff and patient more-info routes must preserve the same checkpoint ref",
    );
    assertCondition(
      staffParity["data-due-state"] === patientParity["data-due-state"],
      "staff and patient more-info routes must agree on due state",
    );
    assertCondition(
      staffParity["data-reply-eligibility-state"] === patientParity["data-reply-eligibility-state"],
      "staff and patient more-info routes must agree on reply eligibility",
    );
    assertCondition(
      staffParity["data-secure-link-access-state"] === patientParity["data-secure-link-access-state"],
      "staff and patient more-info routes must agree on secure-link access state",
    );
    assertCondition(
      staffParity["data-delivery-posture"] === patientParity["data-delivery-posture"],
      "staff and patient more-info routes must agree on delivery posture",
    );
    assertCondition(
      staffParity["data-repair-posture"] === patientParity["data-repair-posture"],
      "staff and patient more-info routes must agree on repair posture",
    );
    assertCondition(
      staffParity["data-dominant-next-action"] === patientParity["data-dominant-patient-action"],
      "staff and patient more-info routes must agree on the dominant next action",
    );
    assertCondition(
      new URL(patient.url()).pathname ===
        (await moreInfoStage.getAttribute("data-patient-conversation-route")),
      "the staff more-info stage must point to the active patient child route",
    );

    const staffAria = String(await moreInfoStage.ariaSnapshot());
    const patientAria = String(await patientRoute.ariaSnapshot());
    assertCondition(staffAria.length > 40, "staff more-info stage should expose a non-empty aria snapshot");
    assertCondition(patientAria.length > 40, "patient conversation route should expose a non-empty aria snapshot");

    await patient.locator("#prompt_216_photo_timing").fill("Tuesday midday in natural light");
    await patient.locator("input[name='prompt_216_symptom_change'][value='It looks worse']").check();
    await patient
      .locator("[data-testid='PatientMoreInfoReplySurface']")
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await patient.locator("[data-testid='PatientMoreInfoCheckPanel']").waitFor();
    await patient
      .locator("[data-testid='PatientMoreInfoCheckPanel']")
      .getByRole("button", { name: "Send reply", exact: true })
      .click();
    await patient.locator("[data-testid='PatientMoreInfoReceiptPanel']").waitFor();
    assertCondition(
      (await patientRoute.getAttribute("data-route-anchor")) === "more_info_receipt_panel",
      "patient more-info send must stay in the same shell and promote the receipt anchor",
    );

    await openStaffTaskRoute(staff, pair.workspaceBaseUrl, "task-311", "live");
    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_messages",
      "origin=messages",
    );

    const threadPanel = staff.locator("[data-testid='PatientResponseThreadPanel']");
    const patientThread = await readAttributes(patientRoute, [
      "data-phase3-bundle-ref",
      "data-request-lineage-ref",
      "data-cluster-ref",
      "data-thread-id",
      "data-evidence-delta-packet-ref",
      "data-more-info-response-disposition-ref",
      "data-delivery-posture",
      "data-repair-posture",
    ]);
    const staffThread = await readAttributes(threadPanel, [
      "data-phase3-bundle-ref",
      "data-request-lineage-ref",
      "data-cluster-ref",
      "data-thread-id",
      "data-evidence-delta-packet-ref",
      "data-more-info-response-disposition-ref",
      "data-delivery-posture",
      "data-repair-posture",
    ]);

    for (const attribute of Object.keys(patientThread)) {
      assertCondition(
        patientThread[attribute] === staffThread[attribute],
        `staff and patient thread views must agree on ${attribute}`,
      );
    }

    const taskShell = staff.locator("[data-testid='ActiveTaskShell']");
    assertCondition(
      (await taskShell.getAttribute("data-request-lineage-ref")) ===
        patientThread["data-request-lineage-ref"],
      "task shell root must preserve the same request lineage as the patient thread route",
    );
    assertCondition(
      (await taskShell.getAttribute("data-evidence-delta-packet-ref")) ===
        patientThread["data-evidence-delta-packet-ref"],
      "task shell root must preserve the same evidence delta packet as the patient thread route",
    );
    assertCondition(
      (await taskShell.getAttribute("data-more-info-response-disposition-ref")) ===
        patientThread["data-more-info-response-disposition-ref"],
      "task shell root must preserve the same more-info response disposition as the patient thread route",
    );

    await assertWorkspaceNoHorizontalOverflow(staff, "271 staff more-info and task shell");
    await assertPatientNoHorizontalOverflow(patient, "271 patient more-info and thread routes");
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
