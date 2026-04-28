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

const SUITE = "patient";
const PATIENT_PORT = 4354;

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
  const server = await startViteApp("patient-web", PATIENT_PORT, "/home");
  const browser = await playwright.chromium.launch({ headless: true });
  const artifactEntries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1360, height: 1120 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "light",
    });

    const resumeArtifacts = await runScenario(
      desktopContext,
      "drs_479_patient_resume_projection_refresh",
      async (page) => {
        const artifacts: string[] = [];
        const recoveryRoot = await gotoAndWait(
          page,
          `${server.baseUrl}/start-request/draft_479_resume/recovery`,
          "[data-testid='patient-intake-mission-frame-root']",
        );
        await expectAttribute(recoveryRoot, "data-route-key", "resume_recovery");
        await page.locator("[data-testid='patient-intake-recovery-step']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='patient-intake-recovery-step']"),
              `${SUITE}/drs_479_patient_resume_projection_refresh.recovery.aria.txt`,
            ),
          ),
        );

        const statusRoot = await gotoAndWait(
          page,
          `${server.baseUrl}/start-request/draft_479_resume/status`,
          "[data-testid='patient-intake-mission-frame-root']",
        );
        await expectAttribute(statusRoot, "data-route-key", "request_status");
        await page.locator("[data-testid='track-request-surface']").waitFor();
        const refresh = page.locator("[data-testid='track-refresh-action']");
        if ((await refresh.count()) > 0) {
          await refresh.first().focus();
          await page.keyboard.press("Enter");
        }
        const statusText = await page.locator("[data-testid='track-request-surface']").innerText();
        assertNoSensitiveSerialized(statusText, "patient request status surface");
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='track-request-surface']"),
              `${SUITE}/drs_479_patient_resume_projection_refresh.status.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    resumeArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_patient_resume_projection_refresh",
        artifactRef,
      }),
    );

    const redFlagArtifacts = await runScenario(
      desktopContext,
      "drs_479_patient_red_flag_audit",
      async (page) => {
        const artifacts: string[] = [];
        const root = await gotoAndWait(
          page,
          `${server.baseUrl}/start-request/draft_479_redflag/urgent-guidance`,
          "[data-testid='patient-intake-mission-frame-root']",
        );
        await expectAttribute(root, "data-route-key", "urgent_outcome");
        await expectAttribute(root, "data-shell-posture", "urgent outcome");
        await page.locator("[data-testid='urgent-pathway-frame']").waitFor();
        const actionText = await root.innerText();
        assert(
          !/submit request/i.test(actionText),
          "Urgent diversion must not expose routine submission.",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='urgent-pathway-frame']"),
              `${SUITE}/drs_479_patient_red_flag_audit.urgent.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='urgent-pathway-frame']"),
              `${SUITE}/drs_479_patient_red_flag_audit.urgent.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    redFlagArtifacts.forEach((artifactRef) =>
      artifactEntries.push({ scenarioId: "drs_479_patient_red_flag_audit", artifactRef }),
    );

    const patientFlowArtifacts = await runScenario(
      desktopContext,
      "drs_479_patient_status_booking_messages_pharmacy",
      async (page) => {
        const artifacts: string[] = [];
        await gotoAndWait(
          page,
          `${server.baseUrl}/requests/REQ-2049`,
          "[data-testid='patient-request-detail-route']",
        );
        await page.locator("[data-testid='case-pulse-panel']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='patient-request-detail-route']"),
              `${SUITE}/drs_479_patient_status_booking_messages_pharmacy.request-detail.aria.txt`,
            ),
          ),
        );

        await gotoAndWait(
          page,
          `${server.baseUrl}/messages/thread/THR-420`,
          "[data-testid='patient-message-thread']",
        );
        await page.keyboard.press("Tab");
        assertNoSensitiveSerialized(
          await page.locator("[data-testid='patient-message-thread']").innerText(),
          "patient message thread",
        );

        const booking = await gotoAndWait(
          page,
          `${server.baseUrl}/bookings/booking_case_293_recovery/confirm`,
          "[data-testid='booking-confirmation-stage']",
        );
        await expectAttribute(booking, "data-view-kind", "recovery");
        await expectAttribute(booking, "data-route-freeze-state", "publication_stale");
        await expectAttribute(booking, "data-confirmation-truth", [
          "confirmation_pending",
          "reconciliation_required",
        ]);
        assert.notEqual(
          await booking.getAttribute("data-patient-visibility"),
          "booked_summary",
          "Invalidated confirmation route must not expose a booked summary.",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='booking-confirmation-stage']"),
              `${SUITE}/drs_479_patient_status_booking_messages_pharmacy.booking-safe-state.png`,
            ),
          ),
        );

        await gotoAndWait(
          page,
          `${server.baseUrl}/pharmacy/PHC-2057/status`,
          "[data-testid='pharmacy-patient-shell-root']",
        );
        await page.locator("[data-testid='PatientPharmacyStatusSurface']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='PatientPharmacyStatusSurface']"),
              `${SUITE}/drs_479_patient_status_booking_messages_pharmacy.pharmacy-status.aria.txt`,
            ),
          ),
        );
        assertNoSensitiveSerialized(
          await page.locator("[data-testid='pharmacy-patient-shell-root']").innerText(),
          "patient pharmacy shell",
        );
        return artifacts;
      },
    );
    patientFlowArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_patient_status_booking_messages_pharmacy",
        artifactRef,
      }),
    );

    await desktopContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 920 },
      isMobile: true,
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    const mobileArtifacts = await runScenario(
      mobileContext,
      "drs_479_patient_status_booking_messages_pharmacy",
      async (page) => {
        const artifacts: string[] = [];
        await gotoAndWait(
          page,
          `${server.baseUrl}/bookings/booking_case_293_recovery/confirm`,
          "[data-testid='patient-booking-workspace-shell']",
        );
        await page.locator("[data-testid='booking-confirmation-stage']").waitFor();
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='patient-booking-workspace-shell']"),
              `${SUITE}/drs_479_patient_status_booking_messages_pharmacy.mobile-booking.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    mobileArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_patient_status_booking_messages_pharmacy",
        artifactRef,
      }),
    );
    await mobileContext.close();
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
