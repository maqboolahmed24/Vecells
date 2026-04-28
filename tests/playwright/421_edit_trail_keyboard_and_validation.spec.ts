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

test("validates mandatory reason capture and completes with keyboard selection", async ({
  browser,
}) => {
  // Verifies the validation role alert path before a coded reason is selected.
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

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  await trail.getByRole("button", { name: "Record override reason" }).click();
  await trail.getByRole("button", { name: "Complete reason capture" }).click();
  await expect(trail.getByRole("alert")).toHaveText(
    "Select at least one coded override reason before completing this trail.",
  );

  const clinicalSafety = trail.getByRole("checkbox", { name: /Clinical safety/ });
  await clinicalSafety.focus();
  await page.keyboard.press("Space");
  await expect(clinicalSafety).toBeChecked();
  await trail.getByRole("button", { name: "Complete reason capture" }).click();
  await expect(trail).toHaveAttribute("data-reason-state", "completed");
  await expect(trail.getByText("Override reason captured")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("421-override-keyboard-validation-trace.zip"),
  });
  await context.close();
});

test("closes diff and reason disclosures with Escape and returns focus", async ({ browser }) => {
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
  const reasonToggle = trail.getByRole("button", { name: "Hide reason sheet" });
  await reasonToggle.focus();
  await page.keyboard.press("Escape");
  await expect(trail.getByRole("button", { name: "Record override reason" })).toBeFocused();
  await expect(trail.locator("form.assistive-override__reason-sheet")).toBeHidden();

  const diffToggle = trail.locator(".assistive-override__delta-summary button");
  await diffToggle.focus();
  await page.keyboard.press("Enter");
  await expect(diffToggle).toHaveAttribute("aria-expanded", "true");
  await expect(trail.getByTestId("AssistiveEditDeltaDrawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(diffToggle).toHaveAttribute("aria-expanded", "false");
  await expect(diffToggle).toBeFocused();

  await context.tracing.stop({
    path: outputPath("421-override-keyboard-disclosure-trace.zip"),
  });
  await context.close();
});

test("captures optional note behind a disclosure fence without showing note text after submit", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveConfidence=healthy&assistiveOverride=reason-open`,
    "WorkspaceTaskRoute",
  );

  const trail = page.getByTestId("AssistiveEditedByClinicianTrail");
  await trail.getByText("Optional note", { exact: true }).click();
  await trail.getByLabel("Optional override note").fill("free-text private clinical note");
  await trail.getByRole("checkbox", { name: /Patient context/ }).check();
  await trail.getByRole("button", { name: "Complete reason capture" }).click();
  await expect(trail).toContainText("Optional note captured behind disclosure fence.");
  await expect(trail).not.toContainText("free-text private clinical note");

  await context.tracing.stop({
    path: outputPath("421-override-note-fence-trace.zip"),
  });
  await context.close();
});
