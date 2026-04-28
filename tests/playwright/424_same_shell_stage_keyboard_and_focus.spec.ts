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

test("preserves reading and focus order across task canvas, DecisionDock, and stage", async ({
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
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=promoted`,
      "WorkspaceTaskRoute",
    );

    const orderIsStable = await page.evaluate(() => {
      const canvas = document.querySelector("[data-testid='task-canvas-frame']");
      const dock = document.querySelector("[data-testid='decision-dock']");
      const stage = document.querySelector("[data-testid='AssistiveWorkspaceStageHost']");
      if (!canvas || !dock || !stage) {
        return false;
      }
      const canvasBeforeDock = Boolean(
        canvas.compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      const dockBeforeStage = Boolean(
        dock.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      return canvasBeforeDock && dockBeforeStage;
    });
    expect(orderIsStable).toBe(true);

    await page.getByTestId("task-canvas-frame").focus();
    await expect(page.getByTestId("task-canvas-frame")).toBeFocused();
    await page.getByTestId("decision-dock").focus();
    await expect(page.getByTestId("decision-dock")).toBeFocused();
    await page.getByTestId("AssistiveStagePinController").focus();
    await expect(page.getByTestId("AssistiveStagePinController")).toBeFocused();
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-keyboard-focus-order-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-keyboard-focus-order-trace.zip") });
  await context.close();
});

test("supports keyboard pin, collapse, and Escape demotion without focus traps", async ({
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
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=promoted`,
      "WorkspaceTaskRoute",
    );

    const pin = page.getByTestId("AssistiveStagePinController");
    await pin.focus();
    await page.keyboard.press("Enter");
    await expect(pin).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("AssistiveWorkspaceStageHost")).toHaveAttribute(
      "data-pinned",
      "true",
    );

    const collapse = page.getByTestId("AssistiveStagePromoter");
    await collapse.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("AssistiveSummaryStubCluster")).toBeVisible();

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=promoted`,
      "WorkspaceTaskRoute",
    );
    await page.getByTestId("AssistiveStagePinController").focus();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("AssistiveSummaryStubCluster")).toBeVisible();
    await expect(page.getByTestId("AssistiveStagePromoter")).toBeFocused();
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("424-keyboard-pin-collapse-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-keyboard-pin-collapse-trace.zip") });
  await context.close();
});
