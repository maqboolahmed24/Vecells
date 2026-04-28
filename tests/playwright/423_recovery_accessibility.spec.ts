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

test("uses polite status semantics for recoverable stale frames", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  for (const fixture of [
    "trust-drift",
    "publication-drift",
    "selected-anchor-drift",
    "insertion-drift",
    "review-version-drift-editing",
    "decision-epoch-drift",
  ]) {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=${fixture}`,
      "WorkspaceTaskRoute",
    );
    const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
    await expect(frame).toHaveAttribute("role", "status");
    await expect(frame).toHaveAttribute("aria-live", "polite");
    await expect(frame.getByTestId("AssistiveStaleControlSuppression")).toContainText(
      "Complete task",
    );
  }

  await context.tracing.stop({
    path: outputPath("423-recovery-status-semantics-trace.zip"),
  });
  await context.close();
});

test("uses alert semantics and no enabled local recovery for policy freshness drift", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=policy-freshness-drift`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  await expect(frame).toHaveAttribute("role", "alert");
  await expect(frame).toHaveAttribute("aria-live", "assertive");
  await expect(frame.getByText("No local stale mutation is available.")).toBeVisible();
  await expect(frame.getByRole("button", { name: "Regenerate in place" })).toHaveCount(0);
  await expect(frame.getByRole("button", { name: "Recover in place" })).toHaveCount(0);

  await context.tracing.stop({
    path: outputPath("423-recovery-policy-alert-trace.zip"),
  });
  await context.close();
});

test("marks suppressed stale controls as disabled text and keeps disclosure semantics", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=trust-drift`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
  const suppression = frame.getByTestId("AssistiveStaleControlSuppression");
  for (const label of [
    "Accept artifact",
    "Insert draft",
    "Regenerate from stale session",
    "Export artifact",
    "Complete task",
  ]) {
    await expect(suppression.locator("li", { hasText: label })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }

  const detailButton = frame.getByRole("button", { name: "Show stale reason detail" });
  await expect(detailButton).toHaveAttribute("aria-expanded", "false");
  await detailButton.click();
  await expect(frame.getByRole("button", { name: "Hide stale reason detail" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(frame.getByTestId("AssistiveRecoveryExplanationPanel")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("423-recovery-disabled-controls-trace.zip"),
  });
  await context.close();
});
