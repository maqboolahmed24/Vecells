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

test("opens from queue cue to same-shell assistive stage with context preserved", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/queue/recommended?assistiveMerge=continuum&assistiveStage=promoted`,
      "WorkspaceQueueRoute",
    );

    const cue = page.getByTestId("AssistiveQueueCue").first();
    await expect(cue).toHaveAttribute("data-visual-mode", "Assistive_Queue_Assurance_Continuum");
    await expect(cue).toHaveAttribute("data-posture", "shadow_only");
    await expect(cue).toMatchAriaSnapshot({ name: "427-queue-cue.aria.yml" });

    const pocket = page.getByTestId("AssistiveQueueContextPocket");
    await expect(pocket).toContainText("From recommended queue");
    await expect(page.getByTestId("AssistiveQueueOpenToStageBridge").first()).toBeVisible();
    await page.getByTestId("AssistiveQueueOpenToStageBridge").first().getByRole("button").click();

    await page.getByTestId("WorkspaceTaskRoute").waitFor();
    await expect(page.getByTestId("AssistiveWorkspaceStageHost")).toHaveAttribute(
      "data-stage-mode",
      "promoted",
    );
    await expect(
      page.getByTestId("WorkspaceTaskRoute").getByTestId("AssistiveQueueOpenToStageBridge"),
    ).toContainText(/same-shell/i);
    await expect(page.getByTestId("WorkspaceTaskRoute")).toMatchAriaSnapshot({
      name: "427-open-task-assistive-stage.aria.yml",
    });
  } catch (error) {
    await context.tracing.stop({ path: outputPath("427-queue-task-flow-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("427-queue-task-flow-trace.zip") });
  await context.close();
});
