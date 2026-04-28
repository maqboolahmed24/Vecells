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

const SUITE = "hub-pharmacy-booking";
const PATIENT_PORT = 4356;
const HUB_PORT = 4357;
const PHARMACY_PORT = 4358;

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
  const patient = await startViteApp("patient-web", PATIENT_PORT, "/home");
  const hub = await startViteApp("hub-desk", HUB_PORT, "/hub");
  const pharmacy = await startViteApp("pharmacy-console", PHARMACY_PORT, "/workspace/pharmacy");
  const browser = await playwright.chromium.launch({ headless: true });
  const artifactEntries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1180 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const bookingArtifacts = await runScenario(
      context,
      "drs_479_patient_status_booking_messages_pharmacy",
      async (page) => {
        const artifacts: string[] = [];
        const booking = await gotoAndWait(
          page,
          `${patient.baseUrl}/bookings/booking_case_293_recovery/confirm`,
          "[data-testid='booking-confirmation-stage']",
        );
        await expectAttribute(booking, "data-view-kind", "recovery");
        await expectAttribute(booking, "data-route-freeze-state", "publication_stale");
        await expectAttribute(booking, "data-artifact-exposure", ["hidden", "summary_only"]);
        assert.notEqual(
          await booking.getAttribute("data-confirmation-truth"),
          "confirmed",
          "Slot invalidation rehearsal must not show confirmed truth.",
        );
        const supportAction = page.locator("[data-testid='booking-support-action']");
        if ((await supportAction.count()) > 0) {
          assert(
            await supportAction.first().isVisible(),
            "Booking safe state must expose a support or recovery action.",
          );
        }
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              booking,
              `${SUITE}/drs_479_patient_status_booking_messages_pharmacy.booking-recovery.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              booking,
              `${SUITE}/drs_479_patient_status_booking_messages_pharmacy.booking-recovery.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    bookingArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_patient_status_booking_messages_pharmacy",
        artifactRef,
      }),
    );

    const outageArtifacts = await runScenario(
      context,
      "drs_479_hub_pharmacy_provider_unavailable_manual_fallback",
      async (page) => {
        const artifacts: string[] = [];
        const hubRoot = await gotoAndWait(
          page,
          `${hub.baseUrl}/hub/case/hub-case-052`,
          "[data-testid='hub-shell-root']",
        );
        await expectAttribute(hubRoot, "data-selected-case-id", "hub-case-052");
        const noSlotPanel = page.locator("[data-testid='HubNoSlotResolutionPanel']");
        const callbackPanel = page.locator("[data-testid='HubCallbackTransferPendingState']");
        assert(
          (await noSlotPanel.count()) > 0 || (await callbackPanel.count()) > 0,
          "Hub fallback route must expose no-slot or callback transfer evidence.",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='hub-shell-root']"),
              `${SUITE}/drs_479_hub_pharmacy_provider_unavailable_manual_fallback.hub.aria.txt`,
            ),
          ),
        );
        assertNoSensitiveSerialized(await hubRoot.innerText(), "hub fallback surface");

        const pharmacyRoot = await gotoAndWait(
          page,
          `${pharmacy.baseUrl}/workspace/pharmacy/PHC-2244/handoff`,
          "[data-testid='pharmacy-shell-root']",
        );
        await expectAttribute(pharmacyRoot, "data-selected-case-id", "PHC-2244");
        await expectAttribute(pharmacyRoot, "data-workbench-provider-health", "outage");
        await page.locator("[data-testid='PharmacyDecisionDockHost']").waitFor();
        assert(
          (await page.locator("[data-testid='PharmacyRouteRecoveryFrame']").count()) > 0 ||
            /manual|outage|fallback/i.test(await pharmacyRoot.innerText()),
          "Provider outage must invoke recovery or manual fallback wording.",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              pharmacyRoot,
              `${SUITE}/drs_479_hub_pharmacy_provider_unavailable_manual_fallback.pharmacy-outage.png`,
            ),
          ),
        );
        assertNoSensitiveSerialized(await pharmacyRoot.innerText(), "pharmacy outage surface");
        return artifacts;
      },
    );
    outageArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_hub_pharmacy_provider_unavailable_manual_fallback",
        artifactRef,
      }),
    );

    await context.close();
  } finally {
    await browser.close();
    await stopServer(pharmacy);
    await stopServer(hub);
    await stopServer(patient);
  }

  writeSuiteArtifactManifest(SUITE, artifactEntries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
