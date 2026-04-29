import assert from "node:assert/strict";
import path from "node:path";
import { write481SeedArtifacts } from "../../tools/testing/run_481_dr_go_live_smoke";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertNoHorizontalOverflow,
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
} from "./481_go_live_smoke.helpers";

const SUITE = "patient-staff";
const PATIENT_PORT = 4382;
const STAFF_PORT = 4383;
const OPS_PORT = 4384;

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
  write481SeedArtifacts();
  const playwright = await loadPlaywright();
  const patient = await startViteApp("patient-web", PATIENT_PORT, "/home");
  const staff = await startViteApp("clinical-workspace", STAFF_PORT, "/workspace");
  const ops = await startViteApp(
    "ops-console",
    OPS_PORT,
    "/ops/go-live-smoke?smokeState=constrained",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1366, height: 1040 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "light",
    });

    const queueLagArtifacts = await runScenario(
      desktop,
      "gls_481_patient_staff_queue_lag",
      async (page) => {
        const artifacts: string[] = [];
        const intake = await gotoAndWait(
          page,
          `${patient.baseUrl}/start-request/draft_480/request-type`,
          "[data-testid='patient-intake-mission-frame-root']",
        );
        await expectAttribute(intake, "data-route-key", "request_type");
        await assertNoHorizontalOverflow(page, "patient desktop intake");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              intake,
              `${SUITE}/gls_481_patient_staff_queue_lag.patient-intake.aria.txt`,
            ),
          ),
        );

        const status = await gotoAndWait(
          page,
          `${patient.baseUrl}/start-request/draft_480/status`,
          "[data-testid='track-request-surface']",
        );
        await assertNoHorizontalOverflow(page, "patient desktop status");
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              status,
              `${SUITE}/gls_481_patient_staff_queue_lag.patient-status.png`,
            ),
          ),
        );

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
              `${SUITE}/gls_481_patient_staff_queue_lag.staff-queue.aria.txt`,
            ),
          ),
        );

        const activeTask = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace/task/task-311/decision?state=stale_review`,
          "[data-testid='ActiveTaskShell']",
        );
        await expectAttribute(activeTask, "data-auto-advance", "forbidden");
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              activeTask,
              `${SUITE}/gls_481_patient_staff_queue_lag.staff-active-task.png`,
            ),
          ),
        );

        const board = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/go-live-smoke?smokeState=constrained`,
          "[data-testid='go-live-smoke-481-board']",
        );
        await expectAttribute(board, "data-smoke-verdict", "go_live_smoke_constrained");
        await expectAttribute(board, "data-recovery-posture", "diagnostic_only");
        await assertNoHorizontalOverflow(page, "constrained go-live board");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='go-live-481-lane-failover_continuity']"),
              `${SUITE}/gls_481_patient_staff_queue_lag.staff-lag-lane.aria.txt`,
            ),
          ),
        );
        return artifacts;
      },
    );
    queueLagArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "gls_481_patient_staff_queue_lag", artifactRef }),
    );
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 920 },
      isMobile: true,
      reducedMotion: "reduce",
      colorScheme: "light",
    });

    const mobileArtifacts = await runScenario(
      mobile,
      "gls_481_alert_owner_rota_and_mobile",
      async (page) => {
        const artifacts: string[] = [];
        const board = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/go-live-smoke?smokeState=constrained&mobileEmbeddedState=blocked`,
          "[data-testid='go-live-smoke-481-board']",
        );
        await expectAttribute(board, "data-smoke-verdict", "go_live_smoke_constrained");
        await expectAttribute(board, "data-mobile-embedded-state", "blocked");
        await expectAttribute(board, "data-destructive-rehearsal-allowed", "false");
        await assertNoHorizontalOverflow(page, "mobile constrained go-live board");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='go-live-481-blocker-rail']"),
              `${SUITE}/gls_481_alert_owner_rota_and_mobile.blocker-rail.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              board,
              `${SUITE}/gls_481_alert_owner_rota_and_mobile.mobile-board.png`,
            ),
          ),
        );

        const embeddedHome = await gotoAndWait(
          page,
          `${patient.baseUrl}/home`,
          "[data-testid='Patient_Home_Requests_Detail_Route']",
        );
        await assertNoHorizontalOverflow(page, "patient embedded mobile home");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              embeddedHome,
              `${SUITE}/gls_481_alert_owner_rota_and_mobile.embedded-home.aria.txt`,
            ),
          ),
        );
        return artifacts;
      },
    );
    mobileArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "gls_481_alert_owner_rota_and_mobile", artifactRef }),
    );
    await mobile.close();
  } finally {
    await browser.close();
    await stopServer(ops);
    await stopServer(staff);
    await stopServer(patient);
  }

  writeSuiteArtifactManifest(SUITE, entries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
