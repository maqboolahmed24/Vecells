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

test("uses status semantics for non-interruptive postures", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  for (const fixture of ["shadow-only", "observe-only", "degraded", "frozen"]) {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=${fixture}`,
      "WorkspaceTaskRoute",
    );
    await expect(page.getByTestId("AssistiveTrustStateFrame")).toHaveAttribute("role", "status");
    await expect(page.getByTestId("AssistiveTrustStateFrame")).toHaveAttribute("aria-live", "polite");
  }

  await context.tracing.stop({
    path: outputPath("422-trust-posture-status-semantics-trace.zip"),
  });
  await context.close();
});

test("uses alert semantics for severe containment and hard-stop postures", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  for (const fixture of ["quarantined", "blocked-by-policy"]) {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=${fixture}`,
      "WorkspaceTaskRoute",
    );
    const frame = page.getByTestId("AssistiveTrustStateFrame");
    await expect(frame).toHaveAttribute("role", "alert");
    await expect(frame).toHaveAttribute("aria-live", "assertive");
    await expect(frame.getByText("No local assistive action")).toBeVisible();
  }

  await context.tracing.stop({
    path: outputPath("422-trust-posture-alert-semantics-trace.zip"),
  });
  await context.close();
});

test("keeps dominant action, allowed actions, and suppressed actions visible as text", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=degraded`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveTrustStateFrame");
  await expect(frame.getByText("Current actionability")).toBeVisible();
  await expect(frame.getByLabel("Allowed assistive actions")).toContainText("Read provenance");
  await expect(frame.getByLabel("Suppressed assistive actions")).toContainText("Insert draft");
  await expect(frame.getByLabel("Suppressed assistive actions")).toContainText("Complete task");

  await context.tracing.stop({
    path: outputPath("422-trust-posture-text-actionability-trace.zip"),
  });
  await context.close();
});
