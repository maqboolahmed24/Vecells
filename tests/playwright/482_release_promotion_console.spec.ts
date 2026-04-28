import assert from "node:assert/strict";
import path from "node:path";
import { write482PromotionArtifacts } from "../../tools/release/promote_482_wave1";
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
} from "./482_release_promotion.helpers";

const SUITE = "release-promotion";
const OPS_PORT = 4391;

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
  write482PromotionArtifacts();
  const playwright = await loadPlaywright();
  const ops = await startViteApp(
    "ops-console",
    OPS_PORT,
    "/ops/release/wave1-promotion?state=ready",
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

    const readyArtifacts = await runScenario(context, "promotion_482_ready", async (page) => {
      const artifacts: string[] = [];
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/wave1-promotion?state=ready`,
        "[data-testid='promotion-482-console']",
      );
      await expectAttribute(consoleRoot, "data-preflight-state", "exact");
      await expectAttribute(consoleRoot, "data-activation-claim", "not_active");
      assert(!(await page.locator("[data-testid='promotion-482-promote-action']").isDisabled()));
      await assertNoHorizontalOverflow(page, "ready promotion console");
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='promotion-482-preflight-lanes']"),
            `${SUITE}/promotion_482_ready.preflight-lanes.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await captureScreenshot(consoleRoot, `${SUITE}/promotion_482_ready.console.png`),
        ),
      );

      await page.locator("[data-testid='promotion-482-lane-scorecard']").click();
      const drawer = page.locator("[data-testid='promotion-482-evidence-drawer']");
      await drawer.waitFor();
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(drawer, `${SUITE}/promotion_482_ready.drawer.aria.txt`),
        ),
      );
      await page.locator("[data-testid='promotion-482-close-drawer']").click();

      const action = page.locator("[data-testid='promotion-482-promote-action']");
      await action.focus();
      await page.keyboard.press("Enter");
      const dialog = page.locator("[data-testid='promotion-482-confirmation-dialog']");
      await dialog.waitFor();
      assert.equal(
        await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
        ),
        "promotion-482-confirm-safe-cancel",
        "least destructive confirmation action must receive initial focus",
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(dialog, `${SUITE}/promotion_482_ready.confirmation.aria.txt`),
        ),
      );
      await page.locator("[data-testid='promotion-482-confirm-safe-cancel']").click();
      await page.waitForFunction(
        () =>
          (document.activeElement as HTMLElement | null)?.dataset.testid ===
          "promotion-482-promote-action",
      );
      return artifacts;
    });
    readyArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "promotion_482_ready", artifactRef }),
    );

    const pendingArtifacts = await runScenario(
      context,
      "promotion_482_pending_settlement",
      async (page) => {
        const artifacts: string[] = [];
        const consoleRoot = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/wave1-promotion?state=ready`,
          "[data-testid='promotion-482-console']",
        );
        await page.locator("[data-testid='promotion-482-promote-action']").click();
        await page.locator("[data-testid='promotion-482-confirm-promote']").click();
        await expectAttribute(consoleRoot, "data-settlement-state", "pending");
        await expectAttribute(consoleRoot, "data-activation-claim", "pending_settlement");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='promotion-482-settlement-panel']"),
              `${SUITE}/promotion_482_pending.settlement.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(consoleRoot, `${SUITE}/promotion_482_pending.console.png`),
          ),
        );
        await page.locator("[data-testid='promotion-482-apply-settlement']").click();
        await expectAttribute(consoleRoot, "data-settlement-state", "settled");
        await expectAttribute(consoleRoot, "data-activation-claim", "active_under_observation");
        artifacts.push(
          outputRelative(
            await captureScreenshot(consoleRoot, `${SUITE}/promotion_482_settled.console.png`),
          ),
        );
        return artifacts;
      },
    );
    pendingArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "promotion_482_pending_settlement", artifactRef }),
    );

    for (const [scenarioId, state, expectedPreflight, expectedActivation] of [
      ["promotion_482_blocked", "blocked", "blocked", "blocked"],
      ["promotion_482_parity_failed", "parity_failed", "exact", "blocked"],
      ["promotion_482_role_denied", "role_denied", "exact", "blocked"],
    ] as const) {
      const artifacts = await runScenario(context, scenarioId, async (page) => {
        const consoleRoot = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/wave1-promotion?state=${state}`,
          "[data-testid='promotion-482-console']",
        );
        await expectAttribute(consoleRoot, "data-preflight-state", expectedPreflight);
        await expectAttribute(consoleRoot, "data-activation-claim", expectedActivation);
        assert(
          await page.locator("[data-testid='promotion-482-promote-action']").isDisabled(),
          `${scenarioId} must not allow promotion action`,
        );
        await assertNoHorizontalOverflow(page, `${scenarioId} console`);
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='promotion-482-blocker-rail']"),
              `${SUITE}/${scenarioId}.blocker-rail.aria.txt`,
            ),
          ),
          outputRelative(
            await captureScreenshot(consoleRoot, `${SUITE}/${scenarioId}.console.png`),
          ),
        ];
      });
      artifacts.forEach((artifactRef) => entries.push({ scenarioId, artifactRef }));
    }

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
