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

test("toggles rationale with Enter and closes disclosure with Escape", async ({ browser }) => {
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

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster.getByRole("button", { name: "Why this appears" })).toBeVisible();
  const rationaleButton = cluster.locator(".assistive-confidence__rationale button");
  await rationaleButton.focus();
  await page.keyboard.press("Enter");
  await expect(rationaleButton).toHaveAttribute("aria-expanded", "true");
  await expect(cluster.getByTestId("AssistiveRationaleExplainer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(rationaleButton).toHaveAttribute("aria-expanded", "false");
  await expect(rationaleButton).toBeFocused();

  await context.tracing.stop({
    path: outputPath("420-confidence-rationale-keyboard-trace.zip"),
  });
  await context.close();
});

test("toggles source lineage with Space and returns focus after Escape", async ({ browser }) => {
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

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  await expect(cluster.getByRole("button", { name: "Show source lineage" })).toBeVisible();
  const provenanceButton = cluster.locator(".assistive-confidence__provenance-footer button");
  await provenanceButton.focus();
  await page.keyboard.press("Space");
  await expect(provenanceButton).toHaveAttribute("aria-expanded", "true");
  await expect(cluster.getByTestId("AssistiveProvenanceDrawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(provenanceButton).toHaveAttribute("aria-expanded", "false");
  await expect(provenanceButton).toBeFocused();

  await context.tracing.stop({
    path: outputPath("420-confidence-provenance-keyboard-trace.zip"),
  });
  await context.close();
});

test("keeps confidence disclosure controls in predictable focus order", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=rationale-open`,
    "WorkspaceTaskRoute",
  );

  const cluster = page.getByTestId("AssistiveConfidenceBandCluster");
  const focusableNames = await cluster.evaluate((node) =>
    Array.from(node.querySelectorAll<HTMLElement>("button"))
      .filter((element) => element.offsetParent !== null && element.tabIndex >= 0)
      .map((element) => element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName),
  );

  expect(focusableNames).toEqual(["Hide rationale factors", "Show source lineage"]);

  await context.tracing.stop({
    path: outputPath("420-confidence-focus-order-trace.zip"),
  });
  await context.close();
});
