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

test("renders healthy confidence with visible provenance and bounded rationale snapshot", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveDraft=insert-enabled`,
    "WorkspaceTaskRoute",
  );

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster).toHaveAttribute("data-visual-mode", "Assistive_Confidence_Provenance_Prism");
  await expect(cluster.getByTestId("AssistiveConfidenceBand")).toHaveText("Supported draft aid");
  await expect(cluster.getByTestId("AssistiveProvenanceFooter")).toBeVisible();
  await expect(cluster.getByText("evidence_snapshot.task-311")).toBeVisible();
  await expect(cluster).toMatchAriaSnapshot({ name: "420-confidence-compact-summary.aria.yml" });

  await cluster.getByRole("button", { name: "Why this appears" }).click();
  await expect(cluster.getByTestId("AssistiveRationaleExplainer")).toBeVisible();
  await expect(cluster.getByTestId("AssistiveFactorRowList")).toBeVisible();
  await expect(cluster.getByTestId("AssistiveEvidenceCoverageMiniMap")).toBeVisible();
  await expect(cluster).toMatchAriaSnapshot({ name: "420-confidence-expanded-rationale.aria.yml" });

  await context.tracing.stop({
    path: outputPath("420-confidence-healthy-rendering-trace.zip"),
  });
  await context.close();
});

test("suppresses confidence when degraded trust narrows display posture", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=suppressed-degraded&assistiveDraft=insert-blocked-session`,
    "WorkspaceTaskRoute",
  );

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster).toHaveAttribute("data-display-band", "suppressed");
  await expect(cluster).toHaveAttribute("data-trust-state", "degraded");
  await expect(cluster.getByTestId("AssistiveConfidenceBand")).toHaveAttribute(
    "data-source-display-band",
    "supported",
  );
  await expect(cluster.getByText("Confidence suppressed")).toBeVisible();
  await expect(cluster.getByText("Trust posture degraded")).toBeVisible();
  await expect(cluster.getByTestId("AssistiveProvenanceFooter")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("420-confidence-suppressed-rendering-trace.zip"),
  });
  await context.close();
});

test("renders abstention posture without recommendation certainty", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=abstention`,
    "WorkspaceTaskRoute",
  );

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster).toHaveAttribute("data-display-band", "insufficient");
  await expect(cluster.getByText("Abstention advised")).toBeVisible();
  await cluster.getByRole("button", { name: "Why this appears" }).click();
  await expect(cluster.getByText("Abstention posture")).toBeVisible();
  await expect(cluster.getByText("External artifact detail is not available")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("420-confidence-abstention-rendering-trace.zip"),
  });
  await context.close();
});
