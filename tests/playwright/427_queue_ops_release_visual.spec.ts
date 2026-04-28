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

test("captures compact queue, ops, and release continuum visuals", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/queue/recommended?assistiveMerge=continuum&state=stale_review`,
      "WorkspaceQueueRoute",
    );

    await expect(page.getByTestId("AssistiveQueueCue").first()).toHaveScreenshot(
      "427-queue-compact-cue.png",
      { animations: "disabled", caret: "hide", maxDiffPixels: 500 },
    );
    await expect(page.getByTestId("AssistiveOpsTrustSummaryCard")).toHaveScreenshot(
      "427-ops-trust-summary.png",
      { animations: "disabled", caret: "hide", maxDiffPixels: 800 },
    );
    await expect(page.getByTestId("AssistiveReleaseAssuranceSummaryCard")).toHaveScreenshot(
      "427-release-assurance-summary.png",
      { animations: "disabled", caret: "hide", maxDiffPixels: 900 },
    );
  } catch (error) {
    await context.tracing.stop({ path: outputPath("427-visual-queue-ops-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("427-visual-queue-ops-trace.zip") });
  await context.close();
});

test("captures same-shell task with assistive stage and queue continuity", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveMerge=continuum&assistiveStage=promoted`,
      "WorkspaceTaskRoute",
    );
    await assertNoHorizontalOverflow(page, "427 task visual");
    await expect(page.getByTestId("AssistiveWorkspaceStageHost")).toHaveScreenshot(
      "427-task-same-shell-assistive-stage.png",
      { animations: "disabled", caret: "hide", maxDiffPixels: 900 },
    );
  } catch (error) {
    await context.tracing.stop({ path: outputPath("427-visual-task-stage-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("427-visual-task-stage-trace.zip") });
  await context.close();
});

