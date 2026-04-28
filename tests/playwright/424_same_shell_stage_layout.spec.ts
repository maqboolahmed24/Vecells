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

test("renders the summary stub inside the active workspace without the legacy rail", async ({
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
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=summary-stub`,
      "WorkspaceTaskRoute",
    );

    const stub = page.getByTestId("AssistiveSummaryStubCluster");
    await expect(stub).toHaveAttribute("data-visual-mode", "Assistive_Same_Shell_Stage");
    await expect(stub).toHaveAttribute("data-stage-mode", "summary_stub");
    await expect(page.getByTestId("AssistiveRailShell")).toHaveCount(0);
    await expect(page.getByTestId("task-canvas-frame")).toBeVisible();
    await expect(page.getByTestId("decision-dock")).toBeVisible();
    await expect(stub).toMatchAriaSnapshot({ name: "424-summary-stub.aria.yml" });

    const box = await stub.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(56);
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-layout-summary-stub-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-layout-summary-stub-trace.zip") });
  await context.close();
});

test("slots the promoted stage as a bounded fourth support region", async ({ browser }) => {
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

    const stage = page.getByTestId("AssistiveWorkspaceStageHost");
    await expect(stage).toHaveAttribute("role", "complementary");
    await expect(stage).toHaveAttribute("data-stage-mode", "promoted");
    await expect(stage).toHaveAttribute("data-primary-canvas-min-width", "720");
    await expect(page.getByTestId("AssistiveRailShell")).toHaveCount(0);
    await expect(page.getByTestId("task-canvas-frame")).toBeVisible();
    await expect(page.getByTestId("decision-dock")).toBeVisible();
    await expect(stage).toMatchAriaSnapshot({ name: "424-promoted-stage.aria.yml" });

    const box = await stage.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(430);
    expect(box?.width ?? 0).toBeLessThanOrEqual(450);
  } catch (error) {
    await context.tracing.stop({ path: outputPath("424-layout-promoted-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-layout-promoted-trace.zip") });
  await context.close();
});

test("keeps pinned and downgraded states bounded by trust posture", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=pinned`,
      "WorkspaceTaskRoute",
    );
    const pinnedStage = page.getByTestId("AssistiveWorkspaceStageHost");
    await expect(pinnedStage).toHaveAttribute("data-stage-mode", "pinned");
    await expect(pinnedStage).toHaveAttribute("data-pinned", "true");
    await expect(page.getByTestId("AssistiveStagePinController")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=downgraded`,
      "WorkspaceTaskRoute",
    );
    const downgradedStage = page.getByTestId("AssistiveWorkspaceStageHost");
    await expect(downgradedStage).toHaveAttribute("data-stage-mode", "downgraded");
    await expect(downgradedStage).toHaveAttribute("data-trust-state", "degraded");
    await expect(downgradedStage).toHaveAttribute("data-actionability-state", "observe_only");
    await expect(page.getByTestId("AssistiveStagePinController")).toBeDisabled();
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("424-layout-pinned-downgraded-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-layout-pinned-downgraded-trace.zip") });
  await context.close();
});
