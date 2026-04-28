import type { ChildProcess } from "node:child_process";
import { test, expect } from "playwright/test";
import {
  assertNoHorizontalOverflow,
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

test("captures desktop compare-open draft deck", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=compare-open`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  await expect(rail).toHaveScreenshot("419-diffable-note-draft-desktop-compare.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-visual-compare-trace.zip"),
  });
  await context.close();
});

test("captures desktop blocked draft deck", async ({ browser }) => {
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

  const rail = page.getByTestId("AssistiveRailShell");
  await expect(rail.getByText("Trust posture degraded")).toBeVisible();
  await expect(rail).toHaveScreenshot("419-diffable-note-draft-desktop-blocked.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-visual-blocked-trace.zip"),
  });
  await context.close();
});

test("captures narrow stacked diff behavior in the same rail", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=narrow-stacked`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  await assertNoHorizontalOverflow(page, "419 narrow stacked draft deck");
  const columnCount = await page
    .locator(".assistive-draft__diff-columns")
    .first()
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columnCount).toBe(1);
  await expect(rail).toHaveScreenshot("419-diffable-note-draft-narrow-stacked.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-visual-narrow-trace.zip"),
  });
  await context.close();
});
