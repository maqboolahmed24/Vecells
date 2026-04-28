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

test("collapse toggle preserves semantics and Escape collapses focus inside the rail", async ({
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
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary`,
    "WorkspaceTaskRoute",
  );

  const rail = page.getByTestId("AssistiveRailShell");
  const toggle = page.getByTestId("AssistiveRailCollapseToggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute("aria-controls", /.+/);

  await page.getByTestId("AssistiveRailQuietContentWell").focus();
  await page.keyboard.press("Escape");
  await expect(rail).toHaveAttribute("data-collapsed", "true");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(rail).toMatchAriaSnapshot(`
    - complementary "Assistive companion":
      - button "Expand assistive rail" [expanded=false]
  `);

  await page.keyboard.press("Alt+A");
  await expect(rail).toHaveAttribute("data-collapsed", "false");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await context.tracing.stop({
    path: outputPath("418-assistive-rail-keyboard-trace.zip"),
  });
  await context.close();
});

test("rail focusables stay in predictable source order", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=observe-only`,
    "WorkspaceTaskRoute",
  );

  const focusableNames = await page.getByTestId("AssistiveRailShell").evaluate((rail) =>
    Array.from(rail.querySelectorAll<HTMLElement>("button, [tabindex]:not([tabindex='-1'])"))
      .filter((node) => !node.hasAttribute("hidden") && node.tabIndex >= 0)
      .map((node) => node.getAttribute("aria-label") || node.textContent?.trim() || node.tagName),
  );

  expect(focusableNames[0]).toBe("Collapse assistive rail");
  expect(focusableNames).toHaveLength(1);
  await context.tracing.stop({
    path: outputPath("418-assistive-rail-focus-order-trace.zip"),
  });
  await context.close();
});
