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

test("captures desktop summary stub visual posture", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=summary-stub`,
      "WorkspaceTaskRoute",
    );
    await expect(page.getByTestId("AssistiveSummaryStubCluster")).toHaveScreenshot(
      "424-desktop-summary-stub.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 700,
      },
    );
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-visual-summary-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-visual-summary-trace.zip") });
  await context.close();
});

test("captures promoted and downgraded desktop stage visual postures", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=promoted`,
      "WorkspaceTaskRoute",
    );
    await expect(page.getByTestId("AssistiveWorkspaceStageHost")).toHaveScreenshot(
      "424-desktop-promoted-stage.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 900,
      },
    );

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=downgraded`,
      "WorkspaceTaskRoute",
    );
    await expect(page.getByTestId("AssistiveWorkspaceStageHost")).toHaveScreenshot(
      "424-downgraded-stage-posture.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 900,
      },
    );
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("424-visual-promoted-downgraded-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-visual-promoted-downgraded-trace.zip") });
  await context.close();
});

test("captures narrow folded stage visual posture", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=folded`,
      "WorkspaceTaskRoute",
    );
    await assertNoHorizontalOverflow(page, "424 narrow folded visual");
    await expect(page.getByTestId("AssistiveWorkspaceStageHost")).toHaveScreenshot(
      "424-narrow-folded-stage.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 900,
      },
    );
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-visual-folded-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-visual-folded-trace.zip") });
  await context.close();
});
