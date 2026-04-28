import assert from "node:assert/strict";
import path from "node:path";
import { write479SeedArtifacts } from "../../tools/testing/run_479_dress_rehearsal";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertNoSensitiveSerialized,
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
} from "./479_dress_rehearsal.helpers";

const SUITE = "staff";
const STAFF_PORT = 4355;

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
  write479SeedArtifacts();
  const playwright = await loadPlaywright();
  const server = await startViteApp("clinical-workspace", STAFF_PORT, "/workspace");
  const browser = await playwright.chromium.launch({ headless: true });
  const artifactEntries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const queueArtifacts = await runScenario(
      context,
      "drs_479_staff_queue_resort_in_flight",
      async (page) => {
        const artifacts: string[] = [];
        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/queue/recommended?state=live`,
          "[data-testid='QueueWorkboardFrame']",
        );
        const workboard = page.locator("[data-testid='queue-workboard']");
        await workboard.focus();
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Space");
        const activeDescendant = await workboard.getAttribute("aria-activedescendant");
        assert(activeDescendant, "Queue keyboard navigation must preserve an active descendant.");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='QueueWorkboardFrame']"),
              `${SUITE}/drs_479_staff_queue_resort_in_flight.queue.aria.txt`,
            ),
          ),
        );

        const activeTask = await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/task/task-311/decision?state=stale_review`,
          "[data-testid='ActiveTaskShell']",
        );
        await expectAttribute(activeTask, "data-buffered-queue-batch", [
          "buffered",
          "review_required",
          "hidden",
        ]);
        await expectAttribute(activeTask, "data-auto-advance", "forbidden");
        const bufferedTray = page.locator("[data-testid='BufferedQueueChangeTray']");
        if ((await bufferedTray.count()) > 0) {
          assert.notEqual(
            await bufferedTray.first().getAttribute("data-focus-conflict-state"),
            "",
            "Buffered queue tray must expose focus conflict state.",
          );
        }
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='ActiveTaskShell']"),
              `${SUITE}/drs_479_staff_queue_resort_in_flight.active-task.png`,
            ),
          ),
        );
        assertNoSensitiveSerialized(
          await page.locator("[data-testid='ActiveTaskShell']").innerText(),
          "active task shell",
        );
        return artifacts;
      },
    );
    queueArtifacts.forEach((artifactRef) =>
      artifactEntries.push({ scenarioId: "drs_479_staff_queue_resort_in_flight", artifactRef }),
    );

    const routeArtifacts = await runScenario(
      context,
      "drs_479_staff_triage_callback_booking_support",
      async (page) => {
        const artifacts: string[] = [];
        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/task/task-311/decision?state=live`,
          "[data-testid='ActiveTaskShell']",
        );
        await page.locator("[data-testid='decision-dock']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='ActiveTaskShell']"),
              `${SUITE}/drs_479_staff_triage_callback_booking_support.triage.aria.txt`,
            ),
          ),
        );

        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/callbacks`,
          "[data-testid='CallbackWorklistRoute']",
        );
        await page.keyboard.press("Tab");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='CallbackWorklistRoute']"),
              `${SUITE}/drs_479_staff_triage_callback_booking_support.callbacks.aria.txt`,
            ),
          ),
        );

        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/bookings/staff-booking-299-main`,
          "[data-testid='WorkspaceBookingsRoute']",
        );
        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/support-handoff`,
          "[data-testid='support-handoff-stub']",
        );
        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/escalations`,
          "[data-testid='EscalationWorkspaceRoute']",
        );
        await gotoAndWait(
          page,
          `${server.baseUrl}/workspace/approvals`,
          "[data-testid='ApprovalInboxRoute']",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='staff-shell-root']"),
              `${SUITE}/drs_479_staff_triage_callback_booking_support.staff-shell.png`,
            ),
          ),
        );
        assertNoSensitiveSerialized(
          await page.locator("[data-testid='staff-shell-root']").innerText(),
          "staff shell",
        );
        return artifacts;
      },
    );
    routeArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_staff_triage_callback_booking_support",
        artifactRef,
      }),
    );

    await context.close();
  } finally {
    await browser.close();
    await stopServer(server);
  }

  writeSuiteArtifactManifest(SUITE, artifactEntries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
