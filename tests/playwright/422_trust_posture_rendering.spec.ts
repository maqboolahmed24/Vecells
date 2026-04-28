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

const POSTURES = [
  ["shadow-only", "shadow_only", "Shadow-only"],
  ["observe-only", "observe_only", "Observe-only"],
  ["degraded", "degraded", "Degraded"],
  ["quarantined", "quarantined", "Quarantined"],
  ["frozen", "frozen", "Frozen"],
  ["blocked-by-policy", "blocked_by_policy", "Blocked by policy"],
] as const;

test("renders the complete trust posture family with distinct actionability", async ({
  browser,
}) => {
  for (const [fixture, posture, label] of POSTURES) {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 980 },
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=${fixture}`,
      "WorkspaceTaskRoute",
    );

    const frame = page.getByTestId("AssistiveTrustStateFrame");
    await expect(frame).toHaveAttribute("data-visual-mode", "Assistive_Trust_Posture_Ladder");
    await expect(frame).toHaveAttribute("data-posture", posture);
    await expect(frame.getByTestId("AssistiveTrustStateChip")).toHaveText(label);
    await expect(frame.getByText("Dominant safe next action")).toBeVisible();
    await expect(frame.getByLabel("Suppressed assistive actions")).toBeVisible();

    if (fixture === "shadow-only") {
      await expect(frame).toMatchAriaSnapshot({ name: "422-shadow-only-compact.aria.yml" });
    }
    if (fixture === "blocked-by-policy") {
      await expect(frame).toMatchAriaSnapshot({ name: "422-blocked-by-policy-severe.aria.yml" });
      await expect(frame.getByText("No local assistive action is available.")).toBeVisible();
      await expect(frame.getByText("Do not work around this block")).toBeVisible();
    }

    await context.tracing.stop({
      path: outputPath(`422-trust-posture-rendering-${fixture}-trace.zip`),
    });
    await context.close();
  }
});

test("keeps degraded, quarantined, and frozen posture meanings separate", async ({ browser }) => {
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
  await expect(page.getByTestId("AssistiveDegradedStatePanel")).toContainText("recoverable");
  await expect(page.getByRole("button", { name: "Review recovery options" })).toBeVisible();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=quarantined`,
    "WorkspaceTaskRoute",
  );
  await expect(page.getByTestId("AssistiveQuarantinedStatePanel")).toContainText("containment");
  await expect(page.getByTestId("AssistiveTrustStateFrame")).toHaveAttribute(
    "data-confidence-posture",
    "hidden",
  );

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=frozen`,
    "WorkspaceTaskRoute",
  );
  const frozenPanel = page.getByTestId("AssistiveFrozenStatePanel");
  await expect(frozenPanel).toContainText("preserved");
  await expect(frozenPanel.getByText("write and completion controls remain frozen")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("422-trust-posture-distinction-trace.zip"),
  });
  await context.close();
});
