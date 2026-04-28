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

test("captures live-to-frozen transition end state", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=trust-drift`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  await expect(frame).toHaveScreenshot("423-stale-recovery-trust-drift.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });

  await context.tracing.stop({
    path: outputPath("423-recovery-visual-trust-drift-trace.zip"),
  });
  await context.close();
});

test("captures preserved artifact after regenerate in place", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=trust-drift`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  await frame.getByRole("button", { name: "Regenerate in place" }).click();
  await expect(frame).toHaveAttribute("data-recovery-state", "regenerated");
  await expect(frame).toHaveScreenshot("423-stale-recovery-regenerated.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });

  await context.tracing.stop({
    path: outputPath("423-recovery-visual-regenerated-trace.zip"),
  });
  await context.close();
});

test("captures narrow folded stale recovery without horizontal overflow", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=narrow-folded`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  await expect(frame).toHaveAttribute("data-placement", "narrow_sheet");
  await assertNoHorizontalOverflow(page, "423 narrow folded stale recovery");
  await expect(frame).toHaveScreenshot("423-stale-recovery-narrow-folded.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });

  await context.tracing.stop({
    path: outputPath("423-recovery-visual-narrow-folded-trace.zip"),
  });
  await context.close();
});
