import {
  assertCondition,
  importPlaywright,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  readAttributes,
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
    const staff = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const patient = await browser.newPage({ viewport: { width: 1400, height: 960 } });

    await openStaffCallbacksRoute(staff, pair.workspaceBaseUrl, "live");
    await selectCallbackRow(staff, "task-412");
    const callbackDetail = staff.locator("[data-testid='CallbackDetailSurface']");

    await openPatientConversationRoute(
      patient,
      pair.patientBaseUrl,
      "request_215_callback",
      "conversation_callback",
      "state=live",
    );

    const patientRoute = patient.locator("[data-testid='PatientConversationRoute']");
    const staffParity = await readAttributes(callbackDetail, [
      "data-request-ref",
      "data-request-lineage-ref",
      "data-patient-conversation-route",
      "data-phase3-bundle-ref",
      "data-delivery-posture",
      "data-repair-posture",
      "data-dominant-next-action",
    ]);
    const patientParity = await readAttributes(patientRoute, [
      "data-request-lineage-ref",
      "data-phase3-bundle-ref",
      "data-delivery-posture",
      "data-repair-posture",
      "data-dominant-patient-action",
      "data-request-return-bundle",
      "data-cluster-ref",
    ]);

    assertCondition(
      staffParity["data-request-ref"] === "request_215_callback",
      "callback detail must stay bound to request_215_callback",
    );
    assertCondition(
      new URL(patient.url()).pathname === staffParity["data-patient-conversation-route"],
      "callback detail must target the active patient callback child route",
    );
    assertCondition(
      staffParity["data-request-lineage-ref"] === patientParity["data-request-lineage-ref"],
      "callback detail and patient callback route must share one request lineage",
    );
    assertCondition(
      staffParity["data-phase3-bundle-ref"] === patientParity["data-phase3-bundle-ref"],
      "callback detail and patient callback route must share one 271 bundle",
    );
    assertCondition(
      staffParity["data-delivery-posture"] === patientParity["data-delivery-posture"],
      "callback detail and patient callback route must agree on delivery posture",
    );
    assertCondition(
      staffParity["data-repair-posture"] === patientParity["data-repair-posture"],
      "callback detail and patient callback route must agree on repair posture",
    );
    assertCondition(
      staffParity["data-dominant-next-action"] === patientParity["data-dominant-patient-action"],
      "callback detail and patient callback route must agree on the dominant next action",
    );
    assertCondition(
      patientParity["data-cluster-ref"] === "cluster_214_callback",
      "callback route launch must keep the callback request inside the same cluster lineage",
    );

    const patientAnchorBeforeReload = await patientRoute.getAttribute("data-route-anchor");
    const staffAnchorBeforeReload = await staff
      .locator("[data-testid='WorkspaceShellRouteFamily']")
      .getAttribute("data-selected-anchor-ref");
    await Promise.all([
      patient.reload({ waitUntil: "networkidle" }),
      staff.reload({ waitUntil: "networkidle" }),
    ]);
    await patient.locator("[data-testid='PatientConversationRoute']").waitFor();
    await staff.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    assertCondition(
      (await patientRoute.getAttribute("data-route-anchor")) === patientAnchorBeforeReload,
      "patient callback reload must preserve the selected anchor",
    );
    assertCondition(
      (await staff.locator("[data-testid='WorkspaceShellRouteFamily']").getAttribute("data-selected-anchor-ref")) ===
        staffAnchorBeforeReload,
      "staff callback reload must preserve the selected anchor",
    );

    await patient.locator("[data-testid='PatientConversationReturnButton']").focus();
    await patient.keyboard.press("Enter");
    await patient.locator("[data-testid='patient-request-detail-route']").waitFor();
    assertCondition(
      new URL(patient.url()).pathname === "/requests/request_215_callback",
      "patient return must go back to the governing request detail route",
    );
    await patient.goBack({ waitUntil: "networkidle" });
    await patient.locator("[data-testid='PatientConversationRoute']").waitFor();
    assertCondition(
      new URL(patient.url()).pathname === "/requests/request_215_callback/conversation/callback",
      "patient browser back must restore the callback child route",
    );

    const callbackStageBeforeTaskOpen = await callbackDetail.getAttribute("data-stage");
    await callbackDetail.getByRole("button", { name: "Open task shell" }).focus();
    await staff.keyboard.press("Enter");
    await staff.waitForURL((url: URL) => url.pathname === "/workspace/task/task-412");
    const taskShell = staff.locator("[data-testid='ActiveTaskShell']");
    assertCondition(
      (await taskShell.getAttribute("data-request-lineage-ref")) === patientParity["data-request-lineage-ref"],
      "staff task shell must preserve the same request lineage after callback-to-task handoff",
    );
    assertCondition(
      (await taskShell.getAttribute("data-delivery-posture")) === patientParity["data-delivery-posture"],
      "staff task shell must preserve the same delivery posture after callback-to-task handoff",
    );
    assertCondition(
      (await taskShell.getAttribute("data-repair-posture")) === patientParity["data-repair-posture"],
      "staff task shell must preserve the same repair posture after callback-to-task handoff",
    );

    await staff.goBack({ waitUntil: "networkidle" });
    await staff.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    assertCondition(
      (await callbackDetail.getAttribute("data-stage")) === callbackStageBeforeTaskOpen,
      "staff browser back must restore the prior callback detail stage",
    );
    assertCondition(
      (await callbackDetail.getAttribute("data-phase3-bundle-ref")) === patientParity["data-phase3-bundle-ref"],
      "staff browser back must preserve callback bundle continuity",
    );

    await patient.goto(`${pair.patientBaseUrl}/messages/cluster_214_derm`, {
      waitUntil: "networkidle",
    });
    await patient.locator("[data-testid='message-open-request-conversation']").click();
    await patient.locator("[data-testid='PatientConversationRoute']").waitFor();
    assertCondition(
      new URL(patient.url()).pathname === "/requests/request_211_a/conversation/messages",
      "message-cluster launch must still preserve request-linked conversation continuity",
    );
    assertCondition(
      (await patient.locator("[data-testid='PatientConversationReturnButton']").innerText()) ===
        "Return to message cluster",
      "message-cluster launch must keep the cluster return bridge visible",
    );
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
