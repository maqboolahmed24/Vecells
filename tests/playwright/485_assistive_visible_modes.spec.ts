import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { write485AssistiveVisibleModeArtifacts } from "../../tools/assistive/enable_485_visible_modes";
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
} from "./485_assistive_visible_modes.helpers";

const SUITE = "assistive-visible-modes";
const CLINICAL_PORT = 4395;
const OPS_PORT = 4396;

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
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  write485AssistiveVisibleModeArtifacts();
  const playwright = await loadPlaywright();
  const clinical = await startViteApp(
    "clinical-workspace",
    CLINICAL_PORT,
    "/workspace/assistive-visible-modes?mode=visible-insert",
  );
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/assistive/visible-modes");
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1360, height: 980 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const visibleInsertArtifacts = await runScenario(
      context,
      "assistive_485_visible-insert",
      async (page) => {
        const artifacts: string[] = [];
        const workspace = await gotoAndWait(
          page,
          `${clinical.baseUrl}/workspace/assistive-visible-modes?mode=visible-insert`,
          "[data-testid='assistive-485-workspace']",
        );
        await expectAttribute(workspace, "data-mode", "visible_insert");
        await expectAttribute(workspace, "data-insert-controls", "true");
        await expectAttribute(workspace, "data-trust-state", "trusted");
        assert(await page.locator("[data-testid='assistive-485-insert-action']").isVisible());
        await assertNoHorizontalOverflow(page, "visible insert workspace");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='assistive-485-workspace-panel']"),
              `${SUITE}/assistive_485_visible-insert.panel.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(workspace, `${SUITE}/assistive_485_visible-insert.png`),
          ),
        );

        await page.locator("[data-testid='assistive-485-insert-action']").focus();
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
          ),
          "assistive-485-regenerate-action",
        );

        await page.locator("[data-testid='assistive-485-open-provenance']").click();
        const drawer = page.locator("[data-testid='assistive-485-provenance-drawer']");
        await drawer.waitFor();
        assert.equal(
          await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
          ),
          "assistive-485-close-provenance",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              drawer,
              `${SUITE}/assistive_485_visible-insert.provenance.aria.txt`,
            ),
          ),
        );
        await page.locator("[data-testid='assistive-485-close-provenance']").click();
        await page.waitForTimeout(80);
        assert.equal(
          await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
          ),
          "assistive-485-open-provenance",
        );

        await page.locator("[data-testid='assistive-485-downgrade-action']").click();
        await expectAttribute(workspace, "data-mode", "observe_only");
        await expectAttribute(workspace, "data-insert-controls", "false");
        assert.equal(await page.locator("[data-testid='assistive-485-insert-action']").count(), 0);
        assert.equal(
          await page.locator("[data-testid='assistive-485-regenerate-action']").count(),
          0,
        );
        assert.equal(await page.locator("[data-testid='assistive-485-export-action']").count(), 0);
        assert(await page.locator("[data-testid='assistive-485-open-provenance']").isVisible());
        assert.equal(
          await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
          ),
          "assistive-485-open-provenance",
        );
        return artifacts;
      },
    );
    visibleInsertArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "assistive_485_visible-insert", artifactRef }),
    );

    for (const [mode, expectedMode] of [
      ["shadow-only", "shadow"],
      ["visible-summary", "visible_summary"],
      ["observe-only", "observe_only"],
      ["frozen", "frozen"],
      ["hidden", "hidden"],
    ] as const) {
      const artifacts = await runScenario(context, `assistive_485_${mode}`, async (page) => {
        const workspace = await gotoAndWait(
          page,
          `${clinical.baseUrl}/workspace/assistive-visible-modes?mode=${mode}`,
          "[data-testid='assistive-485-workspace']",
        );
        await expectAttribute(workspace, "data-mode", expectedMode);
        await expectAttribute(workspace, "data-insert-controls", "false");
        assert.equal(await page.locator("[data-testid='assistive-485-insert-action']").count(), 0);
        if (mode === "hidden") {
          await page.locator("[data-testid='assistive-485-hidden-copy']").waitFor();
          await page.setViewportSize({ width: 390, height: 880 });
          await assertNoHorizontalOverflow(page, "hidden assistive workspace mobile");
        } else {
          await assertNoHorizontalOverflow(page, `${mode} assistive workspace`);
        }
        return [
          outputRelative(await captureScreenshot(workspace, `${SUITE}/assistive_485_${mode}.png`)),
        ];
      });
      artifacts.forEach((artifactRef) =>
        entries.push({ scenarioId: `assistive_485_${mode}`, artifactRef }),
      );
    }

    const commitArtifacts = await runScenario(
      context,
      "assistive_485_commit-gate",
      async (page) => {
        const workspace = await gotoAndWait(
          page,
          `${clinical.baseUrl}/workspace/assistive-visible-modes?mode=commit`,
          "[data-testid='assistive-485-workspace']",
        );
        await expectAttribute(workspace, "data-mode", "visible_commit");
        await expectAttribute(workspace, "data-insert-controls", "false");
        await page.locator("[data-testid='assistive-485-human-approval-required']").waitFor();
        assert.equal(await page.locator("[data-testid='assistive-485-commit-action']").count(), 0);
        await assertNoHorizontalOverflow(page, "commit gate assistive workspace");
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='assistive-485-workspace-panel']"),
              `${SUITE}/assistive_485_commit-gate.panel.aria.txt`,
            ),
          ),
        ];
      },
    );
    commitArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "assistive_485_commit-gate", artifactRef }),
    );

    const opsArtifacts = await runScenario(context, "assistive_485_ops", async (page) => {
      const opsRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/assistive/visible-modes`,
        "[data-testid='assistive-485-ops']",
      );
      await expectAttribute(opsRoot, "data-active-mode", "visible_insert");
      await page.locator("[data-testid='assistive-485-ops-matrix']").waitFor();
      await page.locator("[data-testid='assistive-485-freeze-explanation']").waitFor();
      await assertNoHorizontalOverflow(page, "assistive ops desktop");
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='assistive-485-ops-matrix']"),
            `${SUITE}/assistive_485_ops.matrix.aria.txt`,
          ),
        ),
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='assistive-485-freeze-explanation']"),
            `${SUITE}/assistive_485_ops.freeze.aria.txt`,
          ),
        ),
        outputRelative(await captureScreenshot(opsRoot, `${SUITE}/assistive_485_ops.png`)),
      ];
    });
    opsArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "assistive_485_ops", artifactRef }),
    );

    await context.close();
  } finally {
    await browser.close();
    await stopServer(clinical);
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
