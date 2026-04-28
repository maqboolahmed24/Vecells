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

test("captures default compact accepted-edited override trail", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=accepted-edited`,
    "WorkspaceTaskRoute",
  );

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(trail).toHaveScreenshot("421-override-accepted-edited-compact.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("421-override-visual-accepted-edited-trace.zip"),
  });
  await context.close();
});

test("captures mandatory reason state for rejected-mandatory override trail", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=rejected-mandatory`,
    "WorkspaceTaskRoute",
  );

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(trail.getByTestId("AssistiveOverrideReasonSheet")).toBeVisible();
  await expect(trail).toHaveScreenshot("421-override-rejected-mandatory.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("421-override-visual-rejected-trace.zip"),
  });
  await context.close();
});

test("captures completed edited-by-clinician trail", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=completed-trail`,
    "WorkspaceTaskRoute",
  );

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(trail).toHaveScreenshot("421-override-completed-trail.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("421-override-visual-completed-trail.zip"),
  });
  await context.close();
});
