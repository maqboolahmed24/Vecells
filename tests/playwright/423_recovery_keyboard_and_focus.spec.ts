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

test("keeps focus in the recovery action bar while regenerating in place", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=review-version-drift-editing`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  const actionBar = frame.getByTestId("AssistiveRegenerateInPlaceActionBar");
  const actionButton = actionBar.getByRole("button", { name: "Regenerate in place" });

  await expect(actionButton).toBeFocused();
  await expect(actionBar).toMatchAriaSnapshot({ name: "423-focused-action-bar.aria.yml" });

  await page.keyboard.press("Enter");
  await expect(frame).toHaveAttribute("data-recovery-state", "regenerated");
  await expect(actionBar.getByRole("button", { name: "Fresh artifact restored" })).toBeFocused();
  await expect(frame.getByTestId("AssistiveRecoverableNotice")).toContainText(
    "Recovered in this shell",
  );

  await context.tracing.stop({
    path: outputPath("423-recovery-keyboard-regenerate-trace.zip"),
  });
  await context.close();
});

test("opens stale reason detail and closes it with Escape without collapsing the rail", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=detail-open`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  const detailButton = frame.getByRole("button", { name: "Hide stale reason detail" });
  await expect(frame.getByTestId("AssistiveRecoveryExplanationPanel")).toBeVisible();

  await detailButton.focus();
  await page.keyboard.press("Escape");
  await expect(frame.getByTestId("AssistiveRecoveryExplanationPanel")).toBeHidden();
  await expect(frame.getByRole("button", { name: "Show stale reason detail" })).toBeFocused();
  await expect(rail).toHaveAttribute("data-collapsed", "false");

  await context.tracing.stop({
    path: outputPath("423-recovery-detail-escape-trace.zip"),
  });
  await context.close();
});

test("recovers publication drift in place without a generic refresh action", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=publication-drift`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  await expect(frame.getByRole("button", { name: "Recover in place" })).toBeVisible();
  await expect(frame.getByRole("button", { name: /refresh/i })).toHaveCount(0);

  await frame.getByRole("button", { name: "Recover in place" }).click();
  await expect(frame).toHaveAttribute("data-recovery-state", "regenerated");
  await expect(frame.getByTestId("AssistiveRegenerateInPlaceActionBar")).toContainText(
    "Recovery completed without remounting",
  );

  await context.tracing.stop({
    path: outputPath("423-recovery-publication-drift-trace.zip"),
  });
  await context.close();
});
