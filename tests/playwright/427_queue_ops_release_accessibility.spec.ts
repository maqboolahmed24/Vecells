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

test("keeps queue keyboard flow and assistive landmarks coherent", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
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

    await expect(page.getByRole("listbox", { name: "Clinical queue workboard" })).toBeVisible();
    await expect(page.getByTestId("AssistiveQueueCue").first()).toHaveAttribute("role", "status");
    await expect(page.getByTestId("AssistiveQueueContextPocket")).toBeVisible();
    await expect(page.getByTestId("AssistiveOpsIncidentAndFreezeStrip")).toHaveAttribute(
      "role",
      "status",
    );
    await expect(page.getByRole("navigation", { name: "Clinical workspace sections" })).toBeVisible();

    const workboard = page.getByTestId("queue-workboard");
    await workboard.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await page.getByTestId("WorkspaceTaskRoute").waitFor();
    await expect(
      page.getByTestId("WorkspaceTaskRoute").getByTestId("AssistiveQueueOpenToStageBridge"),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page, "427 queue task accessibility");
  } catch (error) {
    await context.tracing.stop({ path: outputPath("427-accessibility-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("427-accessibility-trace.zip") });
  await context.close();
});

test("announces frozen cross-surface posture as an alert", async ({ browser }) => {
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
      `${clinicalWorkspace.baseUrl}/workspace/queue/recommended?assistiveMerge=continuum&state=blocked`,
      "WorkspaceQueueRoute",
    );
    await expect(page.getByTestId("AssistiveOpsIncidentAndFreezeStrip")).toHaveAttribute(
      "role",
      "alert",
    );
    await expect(page.getByTestId("AssistiveCrossSurfaceRecoveryFrame")).toContainText(
      "Frozen",
    );
    await assertNoHorizontalOverflow(page, "427 frozen narrow accessibility");
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("427-frozen-accessibility-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("427-frozen-accessibility-trace.zip") });
  await context.close();
});
