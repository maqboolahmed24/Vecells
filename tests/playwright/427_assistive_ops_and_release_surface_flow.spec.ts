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

test("renders ops and release assurance with the shared degraded trust language", async ({
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
      `${clinicalWorkspace.baseUrl}/workspace/queue/recommended?assistiveMerge=continuum&state=stale_review`,
      "WorkspaceQueueRoute",
    );

    const adapter = page.getByTestId("AssistiveQueueAndAssuranceMergeAdapter");
    await expect(adapter).toHaveAttribute("data-visual-mode", "Assistive_Queue_Assurance_Continuum");
    await expect(page.getByTestId("AssistiveOpsTrustSummaryCard")).toHaveAttribute(
      "data-posture",
      "degraded",
    );
    await expect(page.getByTestId("AssistiveOpsIncidentAndFreezeStrip")).toContainText(
      "Freeze vocabulary active",
    );
    await expect(page.getByTestId("AssistiveReleaseAssuranceSummaryCard")).toContainText(
      "data/config/426_model_audit_baseline.example.json",
    );
    await expect(page.getByTestId("AssistiveReleaseCandidateDeltaBadge")).toContainText(
      "Rollout held below write posture",
    );
    await expect(adapter).toMatchAriaSnapshot({
      name: "427-ops-release-summary.aria.yml",
    });
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("427-ops-release-flow-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("427-ops-release-flow-trace.zip") });
  await context.close();
});

