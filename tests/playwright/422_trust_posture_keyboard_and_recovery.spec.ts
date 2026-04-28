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

test("opens bounded recovery detail with keyboard and closes with Escape", async ({ browser }) => {
  // The enabled degraded posture control is labelled "Review recovery options" before it opens.
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
  const button = frame.locator(".assistive-trust__recovery button");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(frame.getByTestId("AssistiveTrustDetailDrawer")).toBeVisible();
  await expect(frame.getByText("Current posture fails closed")).toBeVisible();
  await expect(frame).toMatchAriaSnapshot({ name: "422-degraded-recovery-open.aria.yml" });

  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();

  await context.tracing.stop({
    path: outputPath("422-trust-posture-keyboard-recovery-trace.zip"),
  });
  await context.close();
});

test("keeps reducedMotion state stable while detail patches in place", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=detail-open`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveTrustStateFrame");
  await expect(frame).toHaveAttribute("data-placement", "rail_card");
  await expect(frame.getByTestId("AssistiveTrustDetailDrawer")).toBeVisible();
  await expect(frame.getByRole("button", { name: "Hide recovery detail" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await context.tracing.stop({
    path: outputPath("422-trust-posture-reduced-motion-detail-trace.zip"),
  });
  await context.close();
});

test("does not expose enabled recovery button for blocked-by-policy", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=blocked-by-policy`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveTrustStateFrame");
  await expect(frame.getByRole("button")).toHaveCount(0);
  await expect(frame.getByText("No local assistive action is available.")).toBeVisible();
  await expect(frame.getByText("Do not work around this block")).toBeVisible();

  await context.tracing.stop({
    path: outputPath("422-trust-posture-blocked-keyboard-trace.zip"),
  });
  await context.close();
});
