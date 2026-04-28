import {
  assertCondition,
  openWorkspaceRoute,
} from "./255_workspace_shell_helpers";

export async function clearObservabilityStore(page: any, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/workspace`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.sessionStorage.removeItem("vecells.phase3.workspace_support_observability");
    delete (window as Window & { __vecellsClinicalValidationStore?: unknown }).__vecellsClinicalValidationStore;
  });
}

export async function readObservabilityStore(page: any): Promise<any> {
  return await page.evaluate(() =>
    JSON.parse(
      window.sessionStorage.getItem("vecells.phase3.workspace_support_observability") ?? '{"events":[],"settlements":[],"disclosureFences":[]}',
    ),
  );
}

export async function seedWorkspaceAndSupportEventChains(page: any, baseUrl: string): Promise<void> {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
  await page.locator("[data-task-id='task-412']").waitFor();
  await page.evaluate(() => {
    const button = document
      .querySelector("[data-task-id='task-412']")
      ?.closest("article")
      ?.querySelector(".staff-shell__queue-open-button");
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("task-412 open button not found");
    }
    button.click();
  });
  await page.waitForURL(`${baseUrl}/workspace/task/task-412`);

  await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-412/more-info?state=live`, "WorkspaceMoreInfoChildRoute");
  await openWorkspaceRoute(page, `${baseUrl}/workspace/approvals?state=live`, "WorkspaceApprovalsRoute");
  await openWorkspaceRoute(page, `${baseUrl}/workspace/escalations?state=live`, "WorkspaceEscalationsRoute");
  await openWorkspaceRoute(page, `${baseUrl}/workspace/changed?state=live`, "WorkspaceChangedRoute");
  await openWorkspaceRoute(page, `${baseUrl}/workspace/messages?state=live`, "WorkspaceMessagesRoute");
  await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");

  await page.goto(
    `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&delta=review&restore=ready&context=linked&anchor=repair_preview_219`,
    { waitUntil: "networkidle" },
  );
  await page.locator("[data-testid='SupportReplayRoute']").waitFor();
  const restoreButton = page.getByRole("button", { name: "Restore live ticket" });
  await restoreButton.click();
  await page.locator("[data-testid='SupportTicketRoute']").waitFor();

  await page.goto(
    `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&anchor=repair_preview_219&disclosure=expanded`,
    { waitUntil: "networkidle" },
  );
  await page.locator("[data-testid='SupportHistoryRoute']").waitFor();

  await page.goto(
    `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/knowledge?state=active&anchor=repair_preview_219`,
    { waitUntil: "networkidle" },
  );
  await page.locator("[data-testid='SupportKnowledgeRoute']").waitFor();

  const snapshot = await readObservabilityStore(page);
  assertCondition(snapshot.events.length >= 8, "expected seeded validation store to contain events");
}
