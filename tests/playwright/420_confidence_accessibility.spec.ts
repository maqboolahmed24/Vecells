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

test("exposes heading structure, named controls, and No raw percentage confidence text", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByRole("complementary", { name: "Assistive companion" });
  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(rail).toBeVisible();
  await expect(cluster.getByRole("heading", { name: "Bounded assistive confidence" })).toBeVisible();
  await expect(cluster.getByRole("button", { name: "Why this appears" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(cluster.getByRole("button", { name: "Show source lineage" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  const confidenceText = await cluster.textContent();
  expect(confidenceText).not.toMatch(/\b\d{1,3}%\b/);
  expect(confidenceText).not.toContain("logit");
  expect(confidenceText).not.toContain("AI explained");

  await context.tracing.stop({
    path: outputPath("420-confidence-accessibility-trace.zip"),
  });
  await context.close();
});

test("keeps suppressed confidence reason text visible and non-color-only", async ({ browser }) => {
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
  await expect(cluster.getByTestId("AssistiveConfidenceSuppressionState")).toHaveAttribute(
    "role",
    "note",
  );
  await expect(cluster.getByText("Trust posture degraded")).toBeVisible();
  await expect(
    cluster.getByText("The trust projection permits provenance and rationale summary only"),
  ).toBeVisible();
  await expect(cluster.getByTestId("AssistiveFreshnessLine")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("420-confidence-suppressed-accessibility-trace.zip"),
  });
  await context.close();
});
