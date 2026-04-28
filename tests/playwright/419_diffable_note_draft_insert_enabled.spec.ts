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

test("renders sectioned draft cards with live slot and patch lease before insert", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=insert-enabled`,
    "WorkspaceTaskRoute",
  );

  const deck = page.getByTestId("AssistiveDraftSectionDeck");
  const firstCard = page.getByTestId("AssistiveDraftSectionCard").first();
  await expect(deck).toHaveAttribute("data-visual-mode", "Assistive_Draft_Diff_Deck");
  await expect(deck.getByRole("heading", { name: "Draft note sections" })).toBeVisible();
  await expect(
    firstCard.getByRole("heading", { name: "History summary", exact: true }),
  ).toBeVisible();
  await expect(firstCard.getByText("Decision note - history slot", { exact: true })).toBeVisible();
  await expect(firstCard.getByTestId("AssistiveTargetSlotPill")).toHaveAttribute(
    "data-slot-state",
    "live",
  );
  await expect(firstCard.getByTestId("AssistivePatchLeaseStatus")).toHaveAttribute(
    "data-lease-state",
    "live",
  );
  await expect(firstCard.getByText("No same-day red flags are recorded")).toBeVisible();

  await expect(deck).toMatchAriaSnapshot({ name: "419-draft-deck-enabled.aria.yml" });
  await expect(firstCard).toMatchAriaSnapshot({ name: "419-draft-card-enabled.aria.yml" });

  const insertButton = firstCard.getByRole("button", { name: "Insert in shown slot" });
  await expect(insertButton).toBeEnabled();
  await insertButton.click();
  await expect(firstCard).toHaveAttribute("data-insert-requested", "true");
  await expect(
    firstCard.getByText("Insert queued for review against Decision note - history slot."),
  ).toBeVisible();
  await expect(firstCard.getByRole("button", { name: "Insert queued for review" })).toBeDisabled();

  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-insert-enabled-trace.zip"),
  });
  await context.close();
});

test("compare closed fixture keeps after view bounded to the same target slot", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=compare-closed`,
    "WorkspaceTaskRoute",
  );

  const firstCard = page.getByTestId("AssistiveDraftSectionCard").first();
  await expect(firstCard.getByTestId("AssistiveDraftDiffBlock")).toHaveAttribute(
    "data-compare-mode",
    "after",
  );
  await expect(firstCard.getByRole("button", { name: "After" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(firstCard.getByText("Decision note - history slot", { exact: true })).toBeVisible();

  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-compare-closed-trace.zip"),
  });
  await context.close();
});
