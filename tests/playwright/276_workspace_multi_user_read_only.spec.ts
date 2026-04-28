import {
  assertCondition,
  assertReadonlyMutationLock,
  assertWritableMutationControl,
  ensurePhiSafeWorkspace,
  importPlaywright,
  openHardeningWorkspaceRoute,
  startClinicalWorkspace,
  startTracedContext,
  stopClinicalWorkspace,
  stopTrace,
} from "./276_workspace_hardening.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const writerContext = await startTracedContext(browser);
    const readerContext = await startTracedContext(browser);
    const writerPage = await writerContext.newPage();
    const readerPage = await readerContext.newPage();

    await openHardeningWorkspaceRoute(
      writerPage,
      baseUrl,
      "/workspace/task/task-311/more-info?state=live",
      "WorkspaceMoreInfoChildRoute",
    );
    await openHardeningWorkspaceRoute(
      readerPage,
      baseUrl,
      "/workspace/task/task-311/more-info?state=read_only",
      "WorkspaceMoreInfoChildRoute",
    );

    await ensurePhiSafeWorkspace(writerPage);
    await ensurePhiSafeWorkspace(readerPage);
    await assertWritableMutationControl(writerPage, ".staff-shell__note-field textarea");
    await assertReadonlyMutationLock(
      readerPage,
      ".staff-shell__note-field textarea",
      "[data-testid='ProtectedCompositionRecovery']",
    );

    await readerPage.reload({ waitUntil: "networkidle" });
    await assertReadonlyMutationLock(
      readerPage,
      ".staff-shell__note-field textarea",
      "[data-testid='ProtectedCompositionRecovery']",
    );

    const approvalWriterPage = await writerContext.newPage();
    const approvalReaderPage = await readerContext.newPage();
    await openHardeningWorkspaceRoute(
      approvalWriterPage,
      baseUrl,
      "/workspace/approvals?state=live",
      "WorkspaceApprovalsRoute",
    );
    await openHardeningWorkspaceRoute(
      approvalReaderPage,
      baseUrl,
      "/workspace/approvals?state=read_only",
      "WorkspaceApprovalsRoute",
    );
    await assertWritableMutationControl(
      approvalWriterPage,
      "[data-testid='ApprovalReviewStage'] .staff-shell__inline-action",
    );
    await assertReadonlyMutationLock(
      approvalReaderPage,
      "[data-testid='ApprovalReviewStage'] .staff-shell__inline-action",
      "[data-testid='ApprovalReviewStage'] .staff-shell__control-room-freeze",
    );

    const escalationWriterPage = await writerContext.newPage();
    const escalationReaderPage = await readerContext.newPage();
    await openHardeningWorkspaceRoute(
      escalationWriterPage,
      baseUrl,
      "/workspace/escalations?state=live",
      "WorkspaceEscalationsRoute",
    );
    await openHardeningWorkspaceRoute(
      escalationReaderPage,
      baseUrl,
      "/workspace/escalations?state=read_only",
      "WorkspaceEscalationsRoute",
    );
    await assertWritableMutationControl(
      escalationWriterPage,
      "[data-testid='EscalationCommandSurface'] .staff-shell__inline-action",
    );
    await assertReadonlyMutationLock(
      escalationReaderPage,
      "[data-testid='EscalationCommandSurface'] .staff-shell__inline-action",
      "[data-testid='EscalationCommandSurface'] .staff-shell__control-room-freeze",
    );

    const changedWriterPage = await writerContext.newPage();
    const changedReaderPage = await readerContext.newPage();
    await openHardeningWorkspaceRoute(
      changedWriterPage,
      baseUrl,
      "/workspace/changed?state=live",
      "WorkspaceChangedRoute",
    );
    await openHardeningWorkspaceRoute(
      changedReaderPage,
      baseUrl,
      "/workspace/changed?state=read_only",
      "WorkspaceChangedRoute",
    );
    await assertWritableMutationControl(
      changedWriterPage,
      "[data-testid='ResumeReviewGate'] .staff-shell__inline-action",
    );
    await assertReadonlyMutationLock(
      changedReaderPage,
      "[data-testid='ResumeReviewGate'] .staff-shell__inline-action",
    );

    const messageReaderPage = await readerContext.newPage();
    await openHardeningWorkspaceRoute(
      messageReaderPage,
      baseUrl,
      "/workspace/messages?state=read_only",
      "WorkspaceMessagesRoute",
    );
    await ensurePhiSafeWorkspace(messageReaderPage);
    assertCondition(
      ((await messageReaderPage
        .locator("[data-testid='ClinicianMessageThreadSurface']")
        .getAttribute("data-mutation-state")) ?? "") !== "live",
      "read-only message route should never expose a live mutation state",
    );
    await assertReadonlyMutationLock(
      messageReaderPage,
      "[data-testid='MessageRepairWorkbench'] .staff-shell__inline-action",
    );

    await stopTrace(writerContext, "276-workspace-multi-user-writer.trace.zip");
    await stopTrace(readerContext, "276-workspace-multi-user-reader.trace.zip");
    await writerContext.close();
    await readerContext.close();
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
