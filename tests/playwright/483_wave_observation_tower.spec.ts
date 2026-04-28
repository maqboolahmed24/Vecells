import assert from "node:assert/strict";
import path from "node:path";
import { write483Wave1ObservationArtifacts } from "../../tools/release/monitor_483_wave1";
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
} from "./483_wave_observation.helpers";

const SUITE = "wave-observation";
const OPS_PORT = 4392;

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
  write483Wave1ObservationArtifacts();
  const playwright = await loadPlaywright();
  const ops = await startViteApp(
    "ops-console",
    OPS_PORT,
    "/ops/release/wave1-observation?state=stable",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1120 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const stableArtifacts = await runScenario(context, "wave_483_stable", async (page) => {
      const artifacts: string[] = [];
      const tower = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/wave1-observation?state=stable`,
        "[data-testid='wave-observation-483-tower']",
      );
      await expectAttribute(tower, "data-stability-verdict", "stable");
      await expectAttribute(tower, "data-widening-enabled", "true");
      await expectAttribute(tower, "data-dwell-state", "complete");
      await expectAttribute(tower, "data-publication-parity-state", "current");
      assert(
        !(await page.locator("[data-testid='wave-observation-483-widen-action']").isDisabled()),
      );
      await assertNoHorizontalOverflow(page, "stable observation tower");
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='wave-observation-483-dwell-timeline']"),
            `${SUITE}/wave_483_stable.dwell-timeline.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='wave-observation-483-guardrail-cards']"),
            `${SUITE}/wave_483_stable.guardrails.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(await captureScreenshot(tower, `${SUITE}/wave_483_stable.tower.png`)),
      );

      await page.locator("[data-testid='wave-observation-483-probe-dwell_opened']").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
        ),
        "wave-observation-483-probe-latency_probe",
      );
      await page.keyboard.press("Enter");
      const timelineDrawer = page.locator(
        "[data-testid='wave-observation-483-recommendation-drawer']",
      );
      await timelineDrawer.waitFor();
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            timelineDrawer,
            `${SUITE}/wave_483_stable.timeline-drawer.aria.txt`,
          ),
        ),
      );
      await page.locator("[data-testid='wave-observation-483-close-drawer']").click();
      await page.waitForTimeout(80);

      await page.locator("[data-testid='wave-observation-483-guardrail-latency']").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
        ),
        "wave-observation-483-guardrail-error_rate",
      );
      await page.keyboard.press("Enter");
      const guardrailDrawer = page.locator(
        "[data-testid='wave-observation-483-recommendation-drawer']",
      );
      await guardrailDrawer.waitFor();
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            guardrailDrawer,
            `${SUITE}/wave_483_stable.guardrail-drawer.aria.txt`,
          ),
        ),
      );
      return artifacts;
    });
    stableArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "wave_483_stable", artifactRef }),
    );

    const observingArtifacts = await runScenario(context, "wave_483_observing", async (page) => {
      const tower = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/wave1-observation?state=observing`,
        "[data-testid='wave-observation-483-tower']",
      );
      await expectAttribute(tower, "data-stability-verdict", "observing");
      await expectAttribute(tower, "data-widening-enabled", "false");
      assert(await page.locator("[data-testid='wave-observation-483-widen-action']").isDisabled());
      await page.locator("[data-testid='wave-observation-483-why-not-stable']").waitFor();
      await assertNoHorizontalOverflow(page, "observing observation tower");
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='wave-observation-483-dwell-timeline']"),
            `${SUITE}/wave_483_observing.dwell-timeline.aria.txt`,
          ),
        ),
        outputRelative(await captureScreenshot(tower, `${SUITE}/wave_483_observing.tower.png`)),
      ];
    });
    observingArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "wave_483_observing", artifactRef }),
    );

    const insufficientArtifacts = await runScenario(
      context,
      "wave_483_insufficient_evidence",
      async (page) => {
        const tower = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/wave1-observation?state=insufficient_evidence`,
          "[data-testid='wave-observation-483-tower']",
        );
        await expectAttribute(tower, "data-stability-verdict", "insufficient_evidence");
        await expectAttribute(tower, "data-widening-enabled", "false");
        await expectAttribute(tower, "data-dwell-state", "insufficient_evidence");
        assert(
          await page.locator("[data-testid='wave-observation-483-widen-action']").isDisabled(),
        );
        await assertNoHorizontalOverflow(page, "insufficient evidence observation tower");
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='wave-observation-483-guardrail-cards']"),
              `${SUITE}/wave_483_insufficient.guardrails.aria.txt`,
            ),
          ),
          outputRelative(
            await captureScreenshot(tower, `${SUITE}/wave_483_insufficient.tower.png`),
          ),
        ];
      },
    );
    insufficientArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "wave_483_insufficient_evidence", artifactRef }),
    );

    const pauseArtifacts = await runScenario(
      context,
      "wave_483_pause_recommended",
      async (page) => {
        const tower = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/wave1-observation?state=pause_recommended`,
          "[data-testid='wave-observation-483-tower']",
        );
        await expectAttribute(tower, "data-stability-verdict", "pause_recommended");
        await expectAttribute(tower, "data-widening-enabled", "false");
        assert(
          await page.locator("[data-testid='wave-observation-483-widen-action']").isDisabled(),
        );
        await page.getByText("Aggregate healthy, slice breached").waitFor();
        await assertNoHorizontalOverflow(page, "pause recommended observation tower");
        const recommendation = page.locator(
          "[data-testid='wave-observation-483-recommendation-pause_rec_483_tenant_slice_incident']",
        );
        await recommendation.click();
        const drawer = page.locator("[data-testid='wave-observation-483-recommendation-drawer']");
        await drawer.waitFor();
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='wave-observation-483-incident-correlation-rail']"),
              `${SUITE}/wave_483_pause.incident-rail.aria.txt`,
            ),
          ),
          outputRelative(
            await writeAriaSnapshot(drawer, `${SUITE}/wave_483_pause.drawer.aria.txt`),
          ),
          outputRelative(await captureScreenshot(tower, `${SUITE}/wave_483_pause.tower.png`)),
        ];
      },
    );
    pauseArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "wave_483_pause_recommended", artifactRef }),
    );

    const rollbackArtifacts = await runScenario(
      context,
      "wave_483_rollback_recommended",
      async (page) => {
        const tower = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/wave1-observation?state=rollback_recommended`,
          "[data-testid='wave-observation-483-tower']",
        );
        await expectAttribute(tower, "data-stability-verdict", "rollback_recommended");
        await expectAttribute(tower, "data-publication-parity-state", "stale");
        await expectAttribute(tower, "data-widening-enabled", "false");
        assert(
          await page.locator("[data-testid='wave-observation-483-widen-action']").isDisabled(),
        );
        await assertNoHorizontalOverflow(page, "rollback recommended observation tower");
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='wave-observation-483-rail']"),
              `${SUITE}/wave_483_rollback.rail.aria.txt`,
            ),
          ),
          outputRelative(await captureScreenshot(tower, `${SUITE}/wave_483_rollback.tower.png`)),
        ];
      },
    );
    rollbackArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "wave_483_rollback_recommended", artifactRef }),
    );

    const blockedArtifacts = await runScenario(context, "wave_483_blocked", async (page) => {
      const tower = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/wave1-observation?state=blocked`,
        "[data-testid='wave-observation-483-tower']",
      );
      await expectAttribute(tower, "data-stability-verdict", "blocked");
      await expectAttribute(tower, "data-widening-enabled", "false");
      await page.getByText("active-channel-monthly-data-obligation-missing").waitFor();
      assert(await page.locator("[data-testid='wave-observation-483-widen-action']").isDisabled());
      await assertNoHorizontalOverflow(page, "blocked observation tower");
      const desktopScreenshot = outputRelative(
        await captureScreenshot(tower, `${SUITE}/wave_483_blocked.tower.png`),
      );
      await page.setViewportSize({ width: 390, height: 900 });
      await assertNoHorizontalOverflow(page, "blocked observation tower mobile");
      const mobileScreenshot = outputRelative(
        await captureScreenshot(tower, `${SUITE}/wave_483_blocked.mobile.png`),
      );
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='wave-observation-483-guardrail-cards']"),
            `${SUITE}/wave_483_blocked.guardrails.aria.txt`,
          ),
        ),
        desktopScreenshot,
        mobileScreenshot,
      ];
    });
    blockedArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "wave_483_blocked", artifactRef }),
    );

    await context.close();
  } finally {
    await browser.close();
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
