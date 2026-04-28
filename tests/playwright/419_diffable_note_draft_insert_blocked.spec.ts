import type { ChildProcess } from "node:child_process";
import { test, expect } from "playwright/test";
import {
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

let clinicalWorkspace: { child: ChildProcess; baseUrl: string };

test.beforeAll(async () => {
  clinicalWorkspace = await startClinicalWorkspace();
});

test.afterAll(async () => {
  await stopClinicalWorkspace(clinicalWorkspace.child);
});

test("blocks insert before click when the target slot or selected anchor drifted", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=insert-blocked-slot`,
    "WorkspaceTaskRoute",
  );

  const firstCard = page.getByTestId("AssistiveDraftSectionCard").first();
  await expect(firstCard).toHaveAttribute("data-insert-allowed", "false");
  await expect(firstCard.getByText("Insert blocked before click")).toBeVisible();
  await expect(firstCard.getByText("Target slot changed")).toBeVisible();
  await expect(firstCard.getByText("Selected anchor changed")).toBeVisible();
  await expect(firstCard.getByTestId("AssistiveTargetSlotPill")).toHaveAttribute(
    "data-slot-state",
    "stale",
  );
  await expect(firstCard.getByTestId("AssistivePatchLeaseStatus")).toHaveAttribute(
    "data-lease-state",
    "stale",
  );
  await expect(firstCard.getByRole("button", { name: "Insert in shown slot" })).toBeDisabled();

  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-blocked-slot-trace.zip"),
  });
  await context.close();
});

test("blocks insert before click when session, decision, publication, or trust drifted", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=insert-blocked-session`,
    "WorkspaceTaskRoute",
  );

  const cards = page.getByTestId("AssistiveDraftSectionCard");
  const firstCard = cards.first();
  const secondCard = cards.nth(1);
  await expect(firstCard.getByText("Assistive session is stale")).toBeVisible();
  await expect(firstCard.getByText("Decision epoch advanced")).toBeVisible();
  await expect(secondCard.getByText("Publication tuple changed")).toBeVisible();
  await expect(secondCard.getByText("Trust posture degraded")).toBeVisible();
  await expect(firstCard.getByTestId("AssistivePatchLeaseStatus")).toHaveAttribute(
    "data-session-state",
    "stale",
  );
  await expect(firstCard.getByRole("button", { name: "Insert in shown slot" })).toBeDisabled();
  await expect(secondCard.getByRole("button", { name: "Insert in shown slot" })).toBeDisabled();

  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-blocked-session-trace.zip"),
  });
  await context.close();
});
