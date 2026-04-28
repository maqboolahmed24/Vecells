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

const FIXTURES = [
  ["trust-drift", "trust_drift", "Regenerate in place"],
  ["publication-drift", "publication_drift", "Recover in place"],
  ["selected-anchor-drift", "selected_anchor_drift", "Regenerate in place"],
  ["insertion-drift", "insertion_point_invalidation", "Recover in place"],
  ["review-version-drift-editing", "review_version_drift", "Regenerate in place"],
  ["decision-epoch-drift", "decision_epoch_drift", "Regenerate in place"],
] as const;

test("renders stale freeze recovery fixtures with preserved artifact and suppressed draft controls", async ({
  browser,
}) => {
  for (const [fixture, drift, actionLabel] of FIXTURES) {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 980 },
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=enabled&assistiveRecovery=${fixture}`,
      "WorkspaceTaskRoute",
    );

    const frame = page.getByTestId("AssistiveFreezeInPlaceFrame");
    await expect(frame).toHaveAttribute("data-visual-mode", "Assistive_Freeze_Regen_In_Place");
    await expect(frame).toHaveAttribute("data-primary-drift", drift);
    await expect(frame.getByTestId("AssistivePreservedArtifactView")).toContainText(
      "Preserved artifact",
    );
    await expect(
      frame.getByTestId("AssistiveFreezeReasonList").locator("li[data-primary='true']"),
    ).toBeVisible();
    await expect(frame.getByTestId("AssistiveStaleControlSuppression")).toContainText(
      "Insert draft",
    );
    await expect(page.getByRole("button", { name: "Insert in shown slot" })).toHaveCount(0);
    await expect(frame.getByRole("button", { name: actionLabel })).toBeVisible();

    if (fixture === "trust-drift") {
      await expect(frame).toMatchAriaSnapshot({
        name: "423-frozen-preserved-artifact.aria.yml",
      });
    }

    await context.tracing.stop({
      path: outputPath(`423-stale-freeze-recovery-${fixture}-trace.zip`),
    });
    await context.close();
  }
});

test("bounds multiple invalidation reasons to one primary and secondary detail", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveRecovery=selected-anchor-drift`,
    "WorkspaceTaskRoute",
  );

  const reasons = page.getByTestId("AssistiveFreezeReasonList");
  await expect(reasons.locator("li[data-primary='true']")).toHaveCount(1);
  await expect(reasons.locator("li")).toHaveCount(3);
  await expect(reasons).toContainText("Selected anchor drift");
  await expect(reasons).toContainText("Publication drift");
  await expect(reasons).toContainText("Insertion point invalidated");

  await context.tracing.stop({
    path: outputPath("423-stale-freeze-recovery-bounded-reasons-trace.zip"),
  });
  await context.close();
});
