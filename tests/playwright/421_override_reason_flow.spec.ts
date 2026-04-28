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

test("distinguishes accepted unchanged from accepted after material edit", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=accepted-unchanged`,
    "WorkspaceTaskRoute",
  );

  const unchanged = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(unchanged).toHaveAttribute("data-visual-mode", "Assistive_Override_Trail_Review");
  await expect(unchanged).toHaveAttribute("data-disposition", "accepted_unchanged");
  await expect(unchanged).toHaveAttribute("data-material-change", "false");
  await expect(unchanged.getByTestId("AssistiveHumanArtifactSummary")).toBeVisible();
  await expect(unchanged.getByText("No reason required")).toBeVisible();
  await expect(unchanged).toMatchAriaSnapshot({ name: "421-accepted-unchanged-compact.aria.yml" });

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=accepted-edited`,
    "WorkspaceTaskRoute",
  );

  const edited = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(edited).toHaveAttribute("data-disposition", "accepted_after_edit");
  await expect(edited).toHaveAttribute("data-material-change", "true");
  await expect(edited.getByText("Accepted after material edit")).toBeVisible();
  await expect(edited.getByText("Reason required")).toBeVisible();
  await expect(edited.getByTestId("AssistiveHumanArtifactSummary")).toContainText(
    "Seek urgent review",
  );
  await expect(page.getByTestId("AssistiveConfidenceBandCluster")).toBeVisible();
  await expect(edited).toMatchAriaSnapshot({ name: "421-accepted-edited-compact.aria.yml" });

  await context.tracing.stop({
    path: outputPath("421-override-accepted-flow-trace.zip"),
  });
  await context.close();
});

test("opens mandatory reason capture for rejected and policy exception fixtures", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=rejected-mandatory`,
    "WorkspaceTaskRoute",
  );

  const rejected = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(rejected).toHaveAttribute("data-disposition", "rejected_to_alternative");
  await expect(rejected.getByTestId("AssistiveOverrideReasonSheet")).toHaveAttribute(
    "data-reason-state",
    "required",
  );
  await expect(rejected.getByRole("checkbox", { name: /Alternative more appropriate/ })).toBeChecked();
  await expect(rejected.getByText("Alternative note retained by the clinician")).toBeVisible();
  await expect(rejected).toMatchAriaSnapshot({ name: "421-rejected-reason-open.aria.yml" });

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=abstention&assistiveOverride=policy-exception`,
    "WorkspaceTaskRoute",
  );

  const exception = page.getByTestId("AssistiveEditedByClinicianTrail");
  await expect(exception.getByTestId("AssistiveApprovalBurdenNotice")).toHaveAttribute(
    "data-dual-review-required",
    "true",
  );
  await expect(exception.getByRole("checkbox", { name: /Policy exception/ })).toBeChecked();
  await expect(exception.getByRole("checkbox", { name: /Low confidence acceptance/ })).toBeChecked();
  await expect(exception.getByText("Mandatory reason and approval burden")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("421-override-mandatory-flow-trace.zip"),
  });
  await context.close();
});

test("renders completed edited-by-clinician trail with coded reason summary", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 920 },
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
  await expect(trail).toHaveAttribute("data-reason-state", "completed");
  await expect(trail.getByRole("heading", { name: "Reason captured" })).toBeVisible();
  await expect(trail.getByText("Clinical safety, Patient context")).toBeVisible();
  await expect(trail.getByText("Reason codes only in telemetry")).toBeVisible();
  await expect(trail.getByTestId("AssistiveOverrideTrailEventRow")).toHaveCount(4);

  await context.tracing.stop({
    path: outputPath("421-override-completed-trail-trace.zip"),
  });
  await context.close();
});
