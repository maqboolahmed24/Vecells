import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { write486NHSAppChannelArtifacts } from "../../tools/channel/enable_486_nhs_app_channel";
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
} from "./486_nhs_app_embedded_channel.helpers";

const SUITE = "nhs-app-embedded-channel";
const PATIENT_PORT = 4401;
const OPS_PORT = 4402;

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

async function assertNoUnsupportedDeadActions(page: any, label: string): Promise<void> {
  assert.equal(
    await page.getByRole("button", { name: /download|print|open in browser/i }).count(),
    0,
    `${label} must not expose unsupported download, print, or browser actions`,
  );
}

export async function run(): Promise<void> {
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  write486NHSAppChannelArtifacts();
  const playwright = await loadPlaywright();
  const patient = await startViteApp(
    "patient-web",
    PATIENT_PORT,
    "/nhs-app/embedded?state=approved&flow=start",
  );
  const ops = await startViteApp(
    "ops-console",
    OPS_PORT,
    "/ops/release/nhs-app/channel-activation",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
      colorScheme: "light",
    });

    const approvedArtifacts = await runScenario(
      mobile,
      "nhs_app_486_approved_embedded",
      async (page) => {
        const artifacts: string[] = [];
        for (const flow of [
          "start",
          "status",
          "booking",
          "pharmacy",
          "secure-link",
          "artifact",
        ] as const) {
          const root = await gotoAndWait(
            page,
            `${patient.baseUrl}/nhs-app/embedded?state=approved&flow=${flow}`,
            "[data-testid='nhs-app-486-embedded']",
          );
          await expectAttribute(root, "data-state", "approved");
          await expectAttribute(root, "data-flow", flow);
          await expectAttribute(root, "data-channel-exposure", "enabled");
          await expectAttribute(root, "data-primary-action-visible", "true");
          await expectAttribute(root, "data-download-exposed", "false");
          await expectAttribute(root, "data-print-exposed", "false");
          assert(
            await page
              .getByRole("button", { name: /continue|view|choose|return|read/i })
              .first()
              .isVisible(),
          );
          await assertNoUnsupportedDeadActions(page, `approved ${flow}`);
          await assertNoHorizontalOverflow(page, `approved ${flow}`);
          artifacts.push(
            outputRelative(
              await writeAriaSnapshot(
                page.locator("[data-testid='nhs-app-486-route-content']"),
                `${SUITE}/nhs_app_486_approved_${flow}.aria.txt`,
              ),
            ),
          );
          if (flow === "start" || flow === "artifact") {
            artifacts.push(
              outputRelative(
                await captureScreenshot(root, `${SUITE}/nhs_app_486_approved_${flow}.png`),
              ),
            );
          }
        }
        await page.locator("[data-testid='nhs-app-486-flow-status']").focus();
        await page.keyboard.press("Enter");
        await expectAttribute(
          page.locator("[data-testid='nhs-app-486-embedded']"),
          "data-flow",
          "status",
        );
        return artifacts;
      },
    );
    approvedArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "nhs_app_486_approved_embedded", artifactRef }),
    );

    for (const state of ["deferred", "blocked"] as const) {
      const artifacts = await runScenario(mobile, `nhs_app_486_${state}`, async (page) => {
        const root = await gotoAndWait(
          page,
          `${patient.baseUrl}/nhs-app/embedded?state=${state}&flow=status`,
          "[data-testid='nhs-app-486-embedded']",
        );
        await expectAttribute(root, "data-state", state);
        await expectAttribute(root, "data-primary-action-visible", "false");
        await expectAttribute(
          root,
          "data-channel-exposure",
          state === "deferred" ? "deferred_hidden" : "blocked_hidden",
        );
        await assertNoUnsupportedDeadActions(page, state);
        const safeReturn = page.locator("[data-testid='nhs-app-486-safe-return']").first();
        await safeReturn.waitFor();
        const artifacts = [
          outputRelative(await captureScreenshot(root, `${SUITE}/nhs_app_486_${state}.png`)),
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='nhs-app-486-route-content']"),
              `${SUITE}/nhs_app_486_${state}.aria.txt`,
            ),
          ),
        ];
        await safeReturn.click();
        await expectAttribute(root, "data-state", "approved");
        await expectAttribute(root, "data-flow", "status");
        await assertNoHorizontalOverflow(page, `${state} safe return`);
        return artifacts;
      });
      artifacts.forEach((artifactRef) =>
        entries.push({ scenarioId: `nhs_app_486_${state}`, artifactRef }),
      );
    }

    const unsupportedArtifacts = await runScenario(
      mobile,
      "nhs_app_486_unsupported_bridge",
      async (page) => {
        const root = await gotoAndWait(
          page,
          `${patient.baseUrl}/nhs-app/embedded?state=unsupported&flow=artifact`,
          "[data-testid='nhs-app-486-embedded']",
        );
        await expectAttribute(root, "data-state", "unsupported");
        await expectAttribute(root, "data-channel-exposure", "enabled");
        await expectAttribute(root, "data-download-exposed", "false");
        await expectAttribute(root, "data-print-exposed", "false");
        const fallback = page.locator("[data-testid='nhs-app-486-unsupported-fallback']");
        await fallback.waitFor();
        await expectAttribute(fallback, "data-unsupported-bridge-state", "governed_fallback");
        await assertNoUnsupportedDeadActions(page, "unsupported fallback");
        const artifacts = [
          outputRelative(
            await writeAriaSnapshot(fallback, `${SUITE}/nhs_app_486_unsupported_fallback.aria.txt`),
          ),
          outputRelative(
            await captureScreenshot(root, `${SUITE}/nhs_app_486_unsupported_bridge.png`),
          ),
        ];
        await page.locator("[data-testid='nhs-app-486-safe-return']").click();
        await expectAttribute(root, "data-state", "approved");
        await expectAttribute(root, "data-flow", "status");
        await assertNoHorizontalOverflow(page, "unsupported fallback return");
        return artifacts;
      },
    );
    unsupportedArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "nhs_app_486_unsupported_bridge", artifactRef }),
    );

    await mobile.close();

    const desktop = await browser.newContext({
      viewport: { width: 1360, height: 980 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "light",
    });
    const opsArtifacts = await runScenario(desktop, "nhs_app_486_ops_activation", async (page) => {
      const root = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/nhs-app/channel-activation`,
        "[data-testid='nhs-app-486-ops']",
      );
      await expectAttribute(root, "data-channel-exposure", "enabled");
      await expectAttribute(root, "data-settlement-result", "applied");
      await page.locator("[data-testid='nhs-app-486-route-coverage-table']").waitFor();
      await page.locator("[data-testid='nhs-app-486-monthly-obligations']").waitFor();
      await page.locator("[data-testid='nhs-app-486-activation-settlement']").waitFor();
      await assertNoHorizontalOverflow(page, "ops activation panel");
      return [
        outputRelative(
          await writeAriaSnapshot(root, `${SUITE}/nhs_app_486_ops_activation.aria.txt`),
        ),
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='nhs-app-486-route-coverage-table']"),
            `${SUITE}/nhs_app_486_ops_route_coverage_table.aria.txt`,
          ),
        ),
        outputRelative(await captureScreenshot(root, `${SUITE}/nhs_app_486_ops_activation.png`)),
      ];
    });
    opsArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "nhs_app_486_ops_activation", artifactRef }),
    );
    await desktop.close();
  } finally {
    await browser.close();
    await stopServer(patient);
    await stopServer(ops);
  }

  writeSuiteArtifactManifest(SUITE, entries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
