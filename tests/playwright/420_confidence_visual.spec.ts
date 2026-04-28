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

test("captures compact summary confidence surface", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy`,
    "WorkspaceTaskRoute",
  );

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster).toHaveScreenshot("420-confidence-compact-summary.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 600,
  });
  await context.tracing.stop({
    path: outputPath("420-confidence-visual-compact-trace.zip"),
  });
  await context.close();
});

test("captures full rail card with provenance drawer", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=provenance-open&assistiveDraft=insert-enabled`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  await expect(rail.getByTestId("AssistiveProvenanceDrawer")).toBeVisible();
  await expect(rail).toHaveScreenshot("420-confidence-full-rail-card.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 800,
  });
  await context.tracing.stop({
    path: outputPath("420-confidence-visual-full-rail-trace.zip"),
  });
  await context.close();
});

test("captures suppressed-confidence state", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=suppressed-degraded`,
    "WorkspaceTaskRoute",
  );

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster).toHaveScreenshot("420-confidence-suppressed.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 600,
  });
  await context.tracing.stop({
    path: outputPath("420-confidence-visual-suppressed-trace.zip"),
  });
  await context.close();
});

test("captures narrow folded state without horizontal overflow", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=narrow-folded`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  await assertNoHorizontalOverflow(page, "420 narrow folded confidence surface");
  await expect(rail).toHaveScreenshot("420-confidence-narrow-folded.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });
  await context.tracing.stop({
    path: outputPath("420-confidence-visual-narrow-trace.zip"),
  });
  await context.close();
});
