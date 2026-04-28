import path from "node:path";
import { write480SeedArtifacts } from "../../tools/testing/run_480_final_uat_visual";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertNoHorizontalOverflow,
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
import assert from "node:assert/strict";

const SUITE = "patient";
const PATIENT_PORT = 4361;

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
  const server = await startViteApp("patient-web", PATIENT_PORT, "/home");
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1360, height: 1080 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "light",
    });

    const desktopArtifacts = await runScenario(
      desktop,
      "uat_480_patient_desktop_request_status",
      async (page) => {
        const artifacts: string[] = [];
        const intake = await gotoAndWait(
          page,
          `${server.baseUrl}/start-request/draft_480/request-type`,
          "[data-testid='patient-intake-mission-frame-root']",
        );
        await expectAttribute(intake, "data-route-key", "request_type");
        await page.locator("[data-testid='patient-intake-primary-action']").focus();
        await page.keyboard.press("Tab");
        assert.equal(
          await intake.locator(".ops-table, [data-density='dense']").count(),
          0,
          "Editable patient controls must not inherit dense operations table treatment.",
        );
        await assertSingleDominantAction(intake, "patient intake");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              intake,
              `${SUITE}/uat_480_patient_desktop_request_status.intake.aria.txt`,
            ),
          ),
        );

        const status = await gotoAndWait(
          page,
          `${server.baseUrl}/start-request/draft_480/status`,
          "[data-testid='track-request-surface']",
        );
        assertNoSensitiveSerialized(await status.innerText(), "patient request status");
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              status,
              `${SUITE}/uat_480_patient_desktop_request_status.status.png`,
            ),
          ),
        );

        const detail = await gotoAndWait(
          page,
          `${server.baseUrl}/requests/REQ-2049`,
          "[data-testid='patient-request-detail-route']",
        );
        await page.locator("[data-testid='case-pulse-panel']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              detail,
              `${SUITE}/uat_480_patient_desktop_request_status.detail.aria.txt`,
            ),
          ),
        );
        return artifacts;
      },
    );
    desktopArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_patient_desktop_request_status", artifactRef }),
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
      "uat_480_patient_mobile_embedded_booking",
      async (page) => {
        const artifacts: string[] = [];
        const embedded = await gotoAndWait(
          page,
          `${server.baseUrl}/home/embedded`,
          "[data-testid='patient-shell-root']",
        );
        await assertNoHorizontalOverflow(page, "patient embedded home");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              embedded,
              `${SUITE}/uat_480_patient_mobile_embedded_booking.embedded-home.aria.txt`,
            ),
          ),
        );

        const booking = await gotoAndWait(
          page,
          `${server.baseUrl}/bookings/booking_case_293_recovery/confirm`,
          "[data-testid='booking-confirmation-stage']",
        );
        await expectAttribute(booking, "data-route-freeze-state", "publication_stale");
        await assertNoHorizontalOverflow(page, "patient mobile booking");
        assert.notEqual(
          await booking.getAttribute("data-confirmation-truth"),
          "confirmed",
          "Mobile booking recovery must not hide the blocked confirmation state.",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='patient-booking-workspace-shell']"),
              `${SUITE}/uat_480_patient_mobile_embedded_booking.mobile-booking.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    mobileArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_patient_mobile_embedded_booking", artifactRef }),
    );
    await mobile.close();
  } finally {
    await browser.close();
    await stopServer(server);
  }

  writeSuiteArtifactManifest(SUITE, entries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
