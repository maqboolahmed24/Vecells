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

test("captures desktop expanded and collapsed visual baselines", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  await expect(rail).toHaveScreenshot("418-assistive-rail-expanded.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 600,
  });

  await page.getByTestId("AssistiveRailCollapseToggle").click();
  await expect(rail).toHaveAttribute("data-collapsed", "true");
  await expect(rail).toHaveScreenshot("418-assistive-rail-collapsed.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 400,
  });
  await context.tracing.stop({
    path: outputPath("418-assistive-rail-visual-desktop-trace.zip"),
  });
  await context.close();
});

test("captures narrow-width same-shell rail baseline", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=observe-only`,
    "WorkspaceTaskRoute",
  );

  await expect(page.getByTestId("AssistiveRailShell")).toHaveScreenshot(
    "418-assistive-rail-narrow.png",
    {
      animations: "disabled",
      caret: "hide",
      maxDiffPixels: 600,
    },
  );
  await context.tracing.stop({
    path: outputPath("418-assistive-rail-visual-narrow-trace.zip"),
  });
  await context.close();
});
