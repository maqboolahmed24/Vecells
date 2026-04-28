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

test("exposes labelled complementary semantics for the promoted stage", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1480, height: 980 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=promoted`,
      "WorkspaceTaskRoute",
    );

    const complementary = page.getByRole("complementary", {
      name: "Assistive workspace stage",
    });
    await expect(complementary).toBeVisible();
    await expect(page.getByTestId("AssistiveStagePromoter")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.getByTestId("AssistiveStagePromoter")).toHaveAttribute("aria-controls", /.*/);
    await expect(page.getByTestId("AssistiveStagePinController")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("424-accessibility-complementary-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-accessibility-complementary-trace.zip") });
  await context.close();
});

test("keeps summary, downgraded, and folded states semantically distinct", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=summary-stub`,
      "WorkspaceTaskRoute",
    );
    await expect(page.getByRole("region", { name: "Summary stub, not promoted" })).toBeVisible();

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=downgraded`,
      "WorkspaceTaskRoute",
    );
    await expect(page.getByTestId("AssistiveStagePinController")).toBeDisabled();
    await expect(page.getByTestId("AssistiveAttentionBudgetCoordinator")).toHaveAttribute(
      "data-promotion-state",
      "blocked_by_trust",
    );

    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveStage=folded`,
      "WorkspaceTaskRoute",
    );
    const tab = page.getByRole("tab", { name: "Assistive support" });
    const panel = page.getByRole("tabpanel");
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const controls = await tab.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    await expect(panel).toHaveAttribute("id", controls ?? "");
  } catch (error) {
    await context.tracing.stop({
      path: outputPath("424-accessibility-states-failure-trace.zip"),
    });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("424-accessibility-states-trace.zip") });
  await context.close();
});
