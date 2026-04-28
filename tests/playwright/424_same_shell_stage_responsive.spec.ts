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

test("folds the assistive stage into the same shell on narrow layouts", async ({ browser }) => {
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

    const stage = page.getByTestId("AssistiveWorkspaceStageHost");
    await expect(stage).toHaveAttribute("data-stage-mode", "folded");
    await expect(stage).toHaveAttribute("data-responsive-mode", "narrow_folded");
    await expect(page.getByRole("tablist", { name: "Assistive folded stage views" })).toBeVisible();
    await expect(page.getByRole("tabpanel")).toContainText("same-shell tab panel");
    await expect(page.getByTestId("task-status-strip")).toBeVisible();
    await expect(page.getByTestId("decision-dock")).toBeVisible();
    await assertNoHorizontalOverflow(page, "424 folded same-shell stage");
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-responsive-folded-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-responsive-folded-trace.zip") });
  await context.close();
});

test("uses the 360px tablet stage width without detaching from the workspace", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 900 },
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

    const stage = page.getByTestId("AssistiveWorkspaceStageHost");
    const box = await stage.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(350);
    expect(box?.width ?? 0).toBeLessThanOrEqual(370);
    await expect(page.getByTestId("task-canvas-frame")).toBeVisible();
    await expect(page.getByTestId("decision-dock")).toBeVisible();
    await assertNoHorizontalOverflow(page, "424 tablet same-shell stage");
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-responsive-tablet-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-responsive-tablet-trace.zip") });
  await context.close();
});
