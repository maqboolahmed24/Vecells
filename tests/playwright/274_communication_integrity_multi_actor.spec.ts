import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  openStaffTaskRoute,
  openSupportRoute,
  readAttributes,
  selectCallbackRow,
  startPatientWorkspacePair,
  stopCommunicationTrace,
  stopPatientWorkspacePair,
} from "./274_phase3_communication.helpers";

export const communicationIntegrityMultiActorCoverage = [
  "patient and staff callback surfaces publish the same bundle, lineage, delivery posture, and repair posture",
  "patient request, staff task thread, and support replay stay aligned on the same communication lineage",
  "support-local communication recovery does not calm the patient posture prematurely",
];

function expectEqual(actual: string | null, expected: string | null, message: string): void {
  assertCondition(actual === expected, `${message}: ${actual} !== ${expected}`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const pair = await startPatientWorkspacePair();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1040 } });
    await context.tracing.start({ screenshots: true, snapshots: true });

    const patientCallbackPage = await context.newPage();
    const staffCallbackPage = await context.newPage();
    const patientMessagePage = await context.newPage();
    const staffTaskPage = await context.newPage();
    const supportPage = await context.newPage();

    await openPatientConversationRoute(
      patientCallbackPage,
      pair.patientBaseUrl,
      "request_215_callback",
      "conversation_callback",
      "state=live",
    );
    await openStaffCallbacksRoute(staffCallbackPage, pair.workspaceBaseUrl, "live");
    await selectCallbackRow(staffCallbackPage, "task-412");

    const patientCallbackAttrs = await readAttributes(
      patientCallbackPage.locator("[data-testid='PatientConversationRoute']"),
      [
        "data-phase3-bundle-ref",
        "data-request-lineage-ref",
        "data-delivery-posture",
        "data-repair-posture",
      ],
    );
    const staffCallbackAttrs = await readAttributes(
      staffCallbackPage.locator("[data-testid='CallbackDetailSurface']"),
      [
        "data-phase3-bundle-ref",
        "data-request-lineage-ref",
        "data-delivery-posture",
        "data-repair-posture",
      ],
    );

    expectEqual(
      patientCallbackAttrs["data-phase3-bundle-ref"],
      staffCallbackAttrs["data-phase3-bundle-ref"],
      "callback bundle parity drifted",
    );
    expectEqual(
      patientCallbackAttrs["data-request-lineage-ref"],
      staffCallbackAttrs["data-request-lineage-ref"],
      "callback lineage parity drifted",
    );
    expectEqual(
      patientCallbackAttrs["data-delivery-posture"],
      staffCallbackAttrs["data-delivery-posture"],
      "callback delivery posture drifted",
    );
    expectEqual(
      patientCallbackAttrs["data-repair-posture"],
      staffCallbackAttrs["data-repair-posture"],
      "callback repair posture drifted",
    );

    await openPatientConversationRoute(
      patientMessagePage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_messages",
      "state=live&origin=messages",
    );
    await openStaffTaskRoute(staffTaskPage, pair.workspaceBaseUrl, "task-311", "live");
    await staffTaskPage.waitForFunction(
      () => document.querySelector("[data-testid='PatientResponseThreadPanel']") !== null,
    );

    const patientMessageAttrs = await readAttributes(
      patientMessagePage.locator("[data-testid='PatientConversationRoute']"),
      [
        "data-request-lineage-ref",
        "data-cluster-ref",
        "data-thread-id",
        "data-delivery-posture",
        "data-repair-posture",
      ],
    );
    const staffMessageAttrs = await readAttributes(
      staffTaskPage.locator("[data-testid='PatientResponseThreadPanel']"),
      [
        "data-cluster-ref",
        "data-thread-id",
        "data-delivery-posture",
        "data-repair-posture",
      ],
    );

    expectEqual(
      patientMessageAttrs["data-cluster-ref"],
      staffMessageAttrs["data-cluster-ref"],
      "message cluster parity drifted",
    );
    expectEqual(
      patientMessageAttrs["data-thread-id"],
      staffMessageAttrs["data-thread-id"],
      "message thread parity drifted",
    );
    expectEqual(
      patientMessageAttrs["data-delivery-posture"],
      staffMessageAttrs["data-delivery-posture"],
      "message delivery posture drifted",
    );
    expectEqual(
      patientMessageAttrs["data-repair-posture"],
      staffMessageAttrs["data-repair-posture"],
      "message repair posture drifted",
    );

    await openPatientConversationRoute(
      patientMessagePage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_repair",
      "state=repair",
    );
    const patientRepairAttrs = await readAttributes(
      patientMessagePage.locator("[data-testid='PatientConversationRoute']"),
      ["data-request-lineage-ref", "data-repair-posture"],
    );

    await openSupportRoute(
      supportPage,
      `${pair.workspaceBaseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&delta=review&restore=ready&context=linked`,
      "SupportReplayRoute",
    );
    const supportAttrs = await readAttributes(supportPage.locator(".support-workspace"), [
      "data-shared-lineage-ref",
      "data-cause-class",
      "data-recovery-class",
      "data-canonical-status-label",
    ]);

    expectEqual(
      supportAttrs["data-shared-lineage-ref"],
      patientRepairAttrs["data-request-lineage-ref"],
      "support lineage parity drifted",
    );
    assertCondition(
      (supportAttrs["data-cause-class"] || "") !== "" &&
        (supportAttrs["data-recovery-class"] || "") !== "" &&
        supportAttrs["data-recovery-class"] !== "none",
      "support replay lost the governed communication-recovery posture",
    );
    assertCondition(
      patientRepairAttrs["data-repair-posture"] !== "settled",
      "patient message route calmed before support and reachability recovery settled",
    );

    await assertPatientNoHorizontalOverflow(patientCallbackPage, "274 callback parity");
    await assertPatientNoHorizontalOverflow(patientMessagePage, "274 patient message parity");
    await assertWorkspaceNoHorizontalOverflow(staffCallbackPage, "274 staff callback parity");
    await assertWorkspaceNoHorizontalOverflow(staffTaskPage, "274 staff task parity");
    await assertWorkspaceNoHorizontalOverflow(supportPage, "274 support replay parity");

    await stopCommunicationTrace(context, "274-communication-integrity-multi-actor-trace.zip");
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
