import assert from "node:assert/strict";
import path from "node:path";
import { write480SeedArtifacts } from "../../tools/testing/run_480_final_uat_visual";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertNoSensitiveSerialized,
  assertSingleDominantAction,
  attachRuntimeGuards,
  captureScreenshot,
  expectAttribute,
  gotoAndWait,
  loadPlaywright,
  outputRelative,
  startViteApp,
  stopServer,
  writeAriaSnapshot,
  writeSuiteArtifactManifest,
} from "./480_final_uat.helpers";

const SUITE = "staff-operations";
const STAFF_PORT = 4362;
const OPS_PORT = 4363;

async function runScenario(
  context: any,
  scenarioId: string,
  exercise: (page: any) => Promise<readonly string[]>,
): Promise<readonly string[]> {
  const page = await context.newPage();
  const guards = attachRuntimeGuards(page);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    const artifacts = await exercise(page);
    assertCleanRuntime(guards, scenarioId);
    const tracePath = path.join(OUTPUT_ROOT, `${scenarioId}.trace.zip`);
    await context.tracing.stop({ path: tracePath });
    await page.close();
    return [...artifacts, outputRelative(tracePath)];
  } catch (error) {
    const tracePath = path.join(OUTPUT_ROOT, `${scenarioId}.failure.trace.zip`);
    await context.tracing.stop({ path: tracePath });
    await page.close();
    throw error;
  }
}

export async function run(): Promise<void> {
  write480SeedArtifacts();
  const playwright = await loadPlaywright();
  const staff = await startViteApp("clinical-workspace", STAFF_PORT, "/workspace");
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/conformance?waveState=approved");
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1180 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const staffArtifacts = await runScenario(
      context,
      "uat_480_staff_focus_live_delta",
      async (page) => {
        const artifacts: string[] = [];
        const queue = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace/queue/recommended?state=live`,
          "[data-testid='QueueWorkboardFrame']",
        );
        const workboard = page.locator("[data-testid='queue-workboard']");
        await workboard.focus();
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Space");
        assert(await workboard.getAttribute("aria-activedescendant"));
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              queue,
              `${SUITE}/uat_480_staff_focus_live_delta.queue.aria.txt`,
            ),
          ),
        );

        const activeTask = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace/task/task-311/decision?state=stale_review`,
          "[data-testid='ActiveTaskShell']",
        );
        await expectAttribute(activeTask, "data-auto-advance", "forbidden");
        await page.evaluate(() => {
          const activeTaskNode = document.querySelector<HTMLElement>(
            "[data-testid='ActiveTaskShell']",
          );
          activeTaskNode?.setAttribute("tabindex", "-1");
          activeTaskNode?.focus();
          window.dispatchEvent(new CustomEvent("vecells-route-change"));
        });
        const activeTestId = await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
        );
        assert.equal(
          activeTestId,
          "ActiveTaskShell",
          "Live update must not let the support drawer steal focus from selected task.",
        );
        await assertSingleDominantAction(activeTask, "staff active task");
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              activeTask,
              `${SUITE}/uat_480_staff_focus_live_delta.active-task.png`,
            ),
          ),
        );
        assertNoSensitiveSerialized(await activeTask.innerText(), "staff active task");
        return artifacts;
      },
    );
    staffArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_staff_focus_live_delta", artifactRef }),
    );

    const opsArtifacts = await runScenario(
      context,
      "uat_480_operations_release_training_dependency",
      async (page) => {
        const artifacts: string[] = [];
        const release = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/conformance?waveState=approved`,
          "[data-testid='release-476-planner']",
        );
        await expectAttribute(release, "data-readiness-verdict", "eligible_with_constraints");
        await page.locator("[data-testid='release-476-approve-wave']").focus();
        await page.keyboard.press("Enter");
        const releaseDialog = page.getByRole("dialog", { name: /command confirmation/i });
        await releaseDialog.waitFor();
        assert(
          await page.getByRole("button", { name: /Confirm activation/i }).isDisabled(),
          "Release command confirmation must remain disabled pending settlement.",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              releaseDialog,
              `${SUITE}/uat_480_operations_release_training_dependency.release-dialog.aria.txt`,
            ),
          ),
        );
        await page.getByRole("button", { name: /Close command review/i }).click();

        const training = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/conformance?trainingState=constrained&trainingRole=clinician`,
          "[data-testid='training-475-centre']",
        );
        await expectAttribute(training, "data-readiness-state", "complete_with_constraints");
        await page
          .locator("[data-testid='training-475-role-card-clinical_safety_officer']")
          .focus();
        await page.keyboard.press("Enter");
        await page.locator("[data-testid='training-475-close-module-details']").click();
        assert.equal(
          await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
          ),
          "training-475-role-card-clinical_safety_officer",
          "Runbook navigation must restore focus to the selected role card.",
        );

        const dependency = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/dependencies?dependencyState=blocked`,
          "[data-testid='dependency-478-board']",
        );
        await expectAttribute(dependency, "data-overall-readiness-state", "blocked");
        assert(
          await page.locator("[data-testid='dependency-478-activation-action']").isDisabled(),
          "Blocked dependency state must keep privileged action disabled.",
        );
        await page.locator("[data-testid='dependency-478-constellation-table']").waitFor();
        assert(
          /blocked/i.test(await dependency.innerText()),
          "Blocked state must be visible in calm copy, not hidden by minimalist styling.",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='dependency-478-constellation-table']"),
              `${SUITE}/uat_480_operations_release_training_dependency.dependency-table.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              dependency,
              `${SUITE}/uat_480_operations_release_training_dependency.blocked-dependency.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    opsArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_operations_release_training_dependency", artifactRef }),
    );

    await context.close();
  } finally {
    await browser.close();
    await stopServer(ops);
    await stopServer(staff);
  }

  writeSuiteArtifactManifest(SUITE, entries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
