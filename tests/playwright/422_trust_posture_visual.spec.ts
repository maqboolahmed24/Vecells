import type { ChildProcess } from "node:child_process";
import { test, expect } from "playwright/test";
import {
  assertNoHorizontalOverflow,
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

const VISUAL_FIXTURES = [
  "shadow-only",
  "observe-only",
  "degraded",
  "quarantined",
  "frozen",
  "blocked-by-policy",
] as const;

test("captures each canonical trust posture family member", async ({ browser }) => {
  for (const fixture of VISUAL_FIXTURES) {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 980 },
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    await openWorkspaceRoute(
      page,
      `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=${fixture}`,
      "WorkspaceTaskRoute",
    );

    const frame = page.getByTestId("AssistiveTrustStateFrame");
    await expect(frame).toHaveScreenshot(`422-trust-posture-${fixture}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixels: 700,
    });
    await context.tracing.stop({
      path: outputPath(`422-trust-posture-visual-${fixture}-trace.zip`),
    });
    await context.close();
  }
});

test("captures narrow folded trust posture without horizontal overflow", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveTrust=narrow-folded`,
    "WorkspaceTaskRoute",
  );

  const frame = page.getByTestId("AssistiveTrustStateFrame");
  await assertNoHorizontalOverflow(page, "422 narrow folded trust posture");
  await expect(frame).toHaveScreenshot("422-trust-posture-narrow-folded.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixels: 700,
  });

  await context.tracing.stop({
    path: outputPath("422-trust-posture-visual-narrow-folded-trace.zip"),
  });
  await context.close();
});
