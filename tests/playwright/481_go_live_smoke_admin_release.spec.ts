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

const SUITE = "admin-release";
const OPS_PORT = 4381;

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
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/go-live-smoke?smokeState=green");
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1120 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const green = await runScenario(context, "gls_481_admin_green_release_board", async (page) => {
      const artifacts: string[] = [];
      const board = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/go-live-smoke?smokeState=green`,
        "[data-testid='go-live-smoke-481-board']",
      );
      await expectAttribute(board, "data-smoke-verdict", "go_live_smoke_green");
      await expectAttribute(board, "data-recovery-posture", "live_control");
      await expectAttribute(board, "data-destructive-rehearsal-allowed", "true");
      await assertNoHorizontalOverflow(page, "green go-live smoke board");

      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='go-live-481-lanes']"),
            `${SUITE}/gls_481_admin_green_release_board.lanes.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='go-live-481-timeline']"),
            `${SUITE}/gls_481_admin_green_release_board.timeline.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await captureScreenshot(board, `${SUITE}/gls_481_admin_green_release_board.board.png`),
        ),
      );

      const action = page.locator("[data-testid='go-live-481-run-rehearsal']");
      assert(!(await action.isDisabled()), "approved synthetic scope must allow rehearsal dialog");
      await action.focus();
      await page.keyboard.press("Enter");
      const dialog = page.locator("[data-testid='go-live-481-confirmation-dialog']");
      await dialog.waitFor();
      assert.equal(
        await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
        ),
        "go-live-481-confirm-safe-cancel",
        "least destructive dialog action must receive initial focus",
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            dialog,
            `${SUITE}/gls_481_admin_green_release_board.confirmation.aria.txt`,
          ),
        ),
      );
      await page.locator("[data-testid='go-live-481-confirm-safe-cancel']").click();
      await page.waitForFunction(
        () =>
          (document.activeElement as HTMLElement | null)?.dataset.testid ===
          "go-live-481-run-rehearsal",
      );
      return artifacts;
    });
    green.forEach((artifactRef) =>
      entries.push({ scenarioId: "gls_481_admin_green_release_board", artifactRef }),
    );

    for (const [scenarioId, smokeState, verdict, destructiveAllowed] of [
      ["gls_481_restore_channel_missing", "blocked", "go_live_smoke_blocked", "false"],
      ["gls_481_failover_parity_mismatch", "blocked", "go_live_smoke_blocked", "false"],
      ["gls_481_rollback_assistive_freeze", "rollback_smoke", "go_live_smoke_constrained", "false"],
    ] as const) {
      const artifacts = await runScenario(context, scenarioId, async (page) => {
        const board = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/go-live-smoke?smokeState=${smokeState}`,
          "[data-testid='go-live-smoke-481-board']",
        );
        await expectAttribute(board, "data-smoke-verdict", verdict);
        await expectAttribute(board, "data-destructive-rehearsal-allowed", destructiveAllowed);
        assert(
          await page.locator("[data-testid='go-live-481-run-rehearsal']").isDisabled(),
          `${scenarioId} must keep destructive rehearsal unavailable`,
        );
        if (scenarioId === "gls_481_rollback_assistive_freeze") {
          await expectAttribute(board, "data-rollback-assistive-insert-visible", "true");
        }
        await assertNoHorizontalOverflow(page, `${scenarioId} board`);
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='go-live-481-blocker-rail']"),
              `${SUITE}/${scenarioId}.blocker-rail.aria.txt`,
            ),
          ),
          outputRelative(await captureScreenshot(board, `${SUITE}/${scenarioId}.board.png`)),
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
