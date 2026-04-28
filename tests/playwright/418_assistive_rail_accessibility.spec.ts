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

test("exposes complementary landmark, headings, toggle semantics, and non-authoritative copy", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByRole("complementary", { name: "Assistive companion" });
  await expect(rail).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assistive companion" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Collapse assistive rail" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByText(/No final workflow truth is inferred/)).toBeVisible();
  await expect(page.getByText(/The case canvas remains the primary review surface/)).toBeVisible();

  const postureText = await page.getByTestId("AssistiveCapabilityPostureChip").textContent();
  expect(postureText).toMatch(/Shadow summary/);
  await context.tracing.stop({
    path: outputPath("418-assistive-rail-accessibility-trace.zip"),
  });
  await context.close();
});

test("keeps narrow-width rail as same-shell side-stage below the status strip", async ({
  browser,
}) => {
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

  const statusStrip = page.getByTestId("task-status-strip");
  const rail = page.getByTestId("AssistiveRailShell");
  await expect(statusStrip).toBeVisible();
  await expect(rail).toBeVisible();
  const railBox = await rail.boundingBox();
  const viewportWidth = page.viewportSize()?.width ?? 390;
  expect(railBox?.width ?? 0).toBeLessThanOrEqual(Math.ceil(viewportWidth * 0.92));
  await expect(page.getByTestId("WorkspaceTaskRoute")).toBeVisible();
  await context.tracing.stop({
    path: outputPath("418-assistive-rail-narrow-accessibility-trace.zip"),
  });
  await context.close();
});
