import { test, expect } from "playwright/test";
import {
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";
import type { ChildProcess } from "node:child_process";

let clinicalWorkspace: { child: ChildProcess; baseUrl: string };

test.beforeAll(async () => {
  clinicalWorkspace = await startClinicalWorkspace();
});

test.afterAll(async () => {
  await stopClinicalWorkspace(clinicalWorkspace.child);
});

test("renders shadow-summary and observe-only rail states in isolated contexts", async ({
  browser,
}) => {
  const shadowContext = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await shadowContext.tracing.start({ screenshots: true, snapshots: true });
  const shadowPage = await shadowContext.newPage();
  await openWorkspaceRoute(
    shadowPage,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary`,
    "WorkspaceTaskRoute",
  );

  const shadowRail = shadowPage.getByTestId("AssistiveRailShell");
  await expect(shadowRail).toBeVisible();
  await expect(shadowRail).toHaveAttribute("data-visual-mode", "Assistive_Rail_Quiet_Copilot");
  await expect(shadowRail).toHaveAttribute("data-rail-state", "shadow_summary");
  await expect(shadowPage.getByTestId("AssistiveShadowModePanel")).toBeVisible();
  await expect(shadowRail).toMatchAriaSnapshot(`
    - complementary "Assistive companion":
      - text: Documentation composer
      - heading "Assistive companion" [level=2]
      - text: ""
      - button "Collapse assistive rail" [expanded]
      - region "Review support for Asha Patel":
        - text: ""
        - heading "Review support for Asha Patel" [level=3]
        - paragraph: A compact assistive summary can be inspected here, but the clinical review canvas and final human action remain authoritative.
        - term: Selected anchor
        - definition: /task-summary-task-\\d+/
        - term: Actionability
        - definition: shell only
      - region "Non-authoritative comparison":
        - text: ""
        - heading "Non-authoritative comparison" [level=3]
        - paragraph: Shadow output is shown as evidence-bearing awareness only.
        - list:
          - listitem: No final workflow truth is inferred from this output.
          - listitem: Insert and completion controls are reserved for later leased states.
          - listitem: The case canvas remains the primary review surface.
      - region "Future assistive detail host":
        - text: ""
        - paragraph: Alt+A toggles this rail.
        - paragraph: Later draft, rationale, override, degraded, and stale-recovery views mount here without rebuilding the rail chrome.
      - text: ""
      - term: Freshness
      - definition: current
      - term: Trust
      - definition: shadow only
      - term: Publication
      - definition: surface_publication.phase8.assistive_staff_workspace.v1
  `);
  await shadowContext.tracing.stop({
    path: outputPath("418-assistive-rail-shadow-summary-trace.zip"),
  });
  await shadowContext.close();

  const observeContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  await observeContext.tracing.start({ screenshots: true, snapshots: true });
  const observePage = await observeContext.newPage();
  await openWorkspaceRoute(
    observePage,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=observe-only`,
    "WorkspaceTaskRoute",
  );

  const observeRail = observePage.getByTestId("AssistiveRailShell");
  await expect(observeRail).toBeVisible();
  await expect(observeRail).toHaveAttribute("data-rail-state", "observe_only");
  await expect(observeRail).toHaveAttribute("data-actionability-state", "observe_only");
  await expect(observePage.getByTestId("AssistiveObserveOnlyPlaceholder")).toBeVisible();
  await expect(observePage.getByText(/Read-only assistive posture/)).toBeVisible();
  await observeContext.tracing.stop({
    path: outputPath("418-assistive-rail-observe-only-trace.zip"),
  });
  await observeContext.close();
});

test("renders loading and placeholder without moving into a full-screen overlay", async ({
  browser,
}) => {
  const fixtures = [
    {
      state: "loading",
      url: `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=loading`,
    },
    {
      state: "placeholder",
      url: `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=placeholder`,
    },
  ] as const;

  for (const { state, url } of fixtures) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    await openWorkspaceRoute(page, url, "WorkspaceTaskRoute");

    const rail = page.getByTestId("AssistiveRailShell");
    await expect(rail).toHaveAttribute(
      "data-rail-state",
      state === "loading" ? "loading" : "placeholder",
    );
    await expect(rail).toBeVisible();
    await expect(page.getByTestId("WorkspaceTaskRoute")).toBeVisible();
    const railBox = await rail.boundingBox();
    const taskBox = await page.getByTestId("WorkspaceTaskRoute").boundingBox();
    expect(railBox?.x ?? 0).toBeGreaterThan(taskBox?.x ?? 0);
    expect(railBox?.width ?? 0).toBeLessThan(430);
    await context.tracing.stop({
      path: outputPath(`418-assistive-rail-${state}-trace.zip`),
    });
    await context.close();
  }
});
