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

test("uses labelled form controls, fieldset, legend, and alert validation", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=reason-open`,
    "WorkspaceTaskRoute",
  );

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  const sheet = trail.getByTestId("AssistiveOverrideReasonSheet");
  await expect(sheet.locator("fieldset")).toHaveCount(1);
  await expect(sheet.locator("legend")).toHaveText("Override reason codes");
  await expect(sheet.getByRole("checkbox", { name: /Clinical safety/ })).toBeVisible();
  await expect(sheet.getByRole("checkbox", { name: /Evidence mismatch/ })).toBeVisible();
  await expect(sheet.getByText("Optional note", { exact: true })).toBeVisible();
  await sheet.getByRole("button", { name: "Complete reason capture" }).click();
  await expect(sheet.getByRole("alert")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("421-override-accessible-form-trace.zip"),
  });
  await context.close();
});

test("keeps final human artifact primary and free-text notes fenced", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=completed-trail`,
    "WorkspaceTaskRoute",
  );

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(trail.getByTestId("AssistiveHumanArtifactSummary")).toBeVisible();
  const order = await trail.evaluate((node) => {
    const artifact = node.querySelector("[data-testid='AssistiveHumanArtifactSummary']");
    const delta = node.querySelector("[data-testid='AssistiveEditDeltaSummary']");
    if (!artifact || !delta) {
      return "missing";
    }
    return artifact.compareDocumentPosition(delta) & Node.DOCUMENT_POSITION_FOLLOWING
      ? "artifact-before-delta"
      : "delta-before-artifact";
  });
  expect(order).toBe("artifact-before-delta");
  await expect(trail.getByText("Optional free-text notes are disclosure-fenced")).toBeVisible();
  await expect(trail).not.toContainText("private clinical note");

  await context.tracing.stop({
    path: outputPath("421-override-primary-artifact-trace.zip"),
  });
  await context.close();
});

test("exposes confidence and provenance refs at capture time", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=accepted-edited`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  const confidence = rail.getByTestId("AssistiveConfidenceBandCluster");
  const trail = rail.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(confidence).toBeVisible();
  await expect(trail.getByText("assistive_confidence_digest.420.task-311")).toBeVisible();
  await expect(trail.getByText("assistive_provenance.420.task-311")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("421-override-confidence-provenance-refs-trace.zip"),
  });
  await context.close();
});
