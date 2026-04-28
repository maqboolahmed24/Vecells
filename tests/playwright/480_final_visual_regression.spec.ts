import path from "node:path";
import { write480SeedArtifacts } from "../../tools/testing/run_480_final_uat_visual";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertStableVisual,
  attachRuntimeGuards,
  gotoAndWait,
  loadPlaywright,
  outputRelative,
  startViteApp,
  stopServer,
  writeSuiteArtifactManifest,
} from "./480_final_uat.helpers";

const SUITE = "visual";
const PATIENT_PORT = 4366;
const STAFF_PORT = 4367;
const OPS_PORT = 4368;
const GOVERNANCE_PORT = 4369;

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
  const patient = await startViteApp("patient-web", PATIENT_PORT, "/home");
  const staff = await startViteApp("clinical-workspace", STAFF_PORT, "/workspace");
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/conformance?waveState=approved");
  const governance = await startViteApp(
    "governance-console",
    GOVERNANCE_PORT,
    "/ops/release?signoffState=ready_with_constraints",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1180 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const artifacts = await runScenario(
      context,
      "uat_480_visual_stable_baselines",
      async (page) => {
        const scenarioArtifacts: string[] = [];
        const booking = await gotoAndWait(
          page,
          `${patient.baseUrl}/bookings/booking_case_293_recovery/confirm`,
          "[data-testid='booking-confirmation-stage']",
        );
        const bookingVisual = await assertStableVisual(
          booking,
          `${SUITE}/uat_480_visual_stable_baselines.patient-booking.png`,
        );
        scenarioArtifacts.push(outputRelative(bookingVisual.baselinePath));
        scenarioArtifacts.push(outputRelative(bookingVisual.comparisonPath));
        scenarioArtifacts.push(outputRelative(bookingVisual.comparisonMetadataPath));

        const activeTask = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace/task/task-311/decision?state=stale_review`,
          "[data-testid='ActiveTaskShell']",
        );
        const staffVisual = await assertStableVisual(
          activeTask,
          `${SUITE}/uat_480_visual_stable_baselines.staff-active-task.png`,
        );
        scenarioArtifacts.push(outputRelative(staffVisual.baselinePath));
        scenarioArtifacts.push(outputRelative(staffVisual.comparisonPath));
        scenarioArtifacts.push(outputRelative(staffVisual.comparisonMetadataPath));

        const release = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/conformance?waveState=approved`,
          "[data-testid='release-476-planner']",
        );
        const releaseVisual = await assertStableVisual(
          release,
          `${SUITE}/uat_480_visual_stable_baselines.release-planner.png`,
        );
        scenarioArtifacts.push(outputRelative(releaseVisual.baselinePath));
        scenarioArtifacts.push(outputRelative(releaseVisual.comparisonPath));
        scenarioArtifacts.push(outputRelative(releaseVisual.comparisonMetadataPath));

        const dependency = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/dependencies?dependencyState=blocked`,
          "[data-testid='dependency-478-board']",
        );
        const dependencyVisual = await assertStableVisual(
          dependency,
          `${SUITE}/uat_480_visual_stable_baselines.dependency-blocked.png`,
        );
        scenarioArtifacts.push(outputRelative(dependencyVisual.baselinePath));
        scenarioArtifacts.push(outputRelative(dependencyVisual.comparisonPath));
        scenarioArtifacts.push(outputRelative(dependencyVisual.comparisonMetadataPath));

        const signoff = await gotoAndWait(
          page,
          `${governance.baseUrl}/ops/release?signoffState=ready_with_constraints`,
          "[data-testid='final-477-signoff-cockpit']",
        );
        const signoffVisual = await assertStableVisual(
          signoff,
          `${SUITE}/uat_480_visual_stable_baselines.signoff-cockpit.png`,
        );
        scenarioArtifacts.push(outputRelative(signoffVisual.baselinePath));
        scenarioArtifacts.push(outputRelative(signoffVisual.comparisonPath));
        scenarioArtifacts.push(outputRelative(signoffVisual.comparisonMetadataPath));
        return scenarioArtifacts;
      },
    );
    artifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_visual_stable_baselines", artifactRef }),
    );
    await context.close();
  } finally {
    await browser.close();
    await stopServer(governance);
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
