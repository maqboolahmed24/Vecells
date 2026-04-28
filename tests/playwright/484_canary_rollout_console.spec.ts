import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { write484GuardrailedCanaryArtifacts } from "../../tools/release/promote_484_guardrailed_canaries";
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
} from "./484_canary_rollout.helpers";

const SUITE = "canary-rollout";
const OPS_PORT = 4393;

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

async function openConfirmation(page: any) {
  const action = page.locator("[data-testid='canary-484-widen-action']");
  assert(!(await action.isDisabled()));
  await action.click();
  const dialog = page.locator("[data-testid='canary-484-confirmation-dialog']");
  await dialog.waitFor();
  assert.equal(
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid),
    "canary-484-confirm-cancel",
  );
  return dialog;
}

export async function run(): Promise<void> {
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  write484GuardrailedCanaryArtifacts();
  const playwright = await loadPlaywright();
  const ops = await startViteApp(
    "ops-console",
    OPS_PORT,
    "/ops/release/canary-rollout?state=ready",
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

    const readyArtifacts = await runScenario(context, "canary_484_ready", async (page) => {
      const artifacts: string[] = [];
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/canary-rollout?state=ready`,
        "[data-testid='canary-484-console']",
      );
      await expectAttribute(consoleRoot, "data-canary-state", "ready");
      await expectAttribute(consoleRoot, "data-widening-enabled", "true");
      await expectAttribute(consoleRoot, "data-previous-stability", "stable");
      await expectAttribute(consoleRoot, "data-selector-state", "exact");
      await expectAttribute(consoleRoot, "data-settlement-state", "accepted_pending_observation");
      await assertNoHorizontalOverflow(page, "ready canary console");
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-ladder']"),
            `${SUITE}/canary_484_ready.ladder.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-scope-comparison']"),
            `${SUITE}/canary_484_ready.scope.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-controls']"),
            `${SUITE}/canary_484_ready.controls.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-node-details']"),
            `${SUITE}/canary_484_ready.node.aria.txt`,
          ),
        ),
      );
      artifacts.push(
        outputRelative(await captureScreenshot(consoleRoot, `${SUITE}/canary_484_ready.png`)),
      );

      await page.locator("[data-testid='canary-484-node-wave2']").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
        ),
        "canary-484-node-remaining",
      );

      const dialog = await openConfirmation(page);
      await expectAttribute(consoleRoot, "data-canary-state", "ready");
      const dialogText = await dialog.innerText();
      assert(dialogText.includes("Mixed"));
      assert(dialogText.includes("Tenant selector"));
      assert(dialogText.includes("Channel selector"));
      assert(dialogText.includes("Recovery disposition"));
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(dialog, `${SUITE}/canary_484_ready.confirmation.aria.txt`),
        ),
      );
      await page.locator("[data-testid='canary-484-confirm-cancel']").click();
      await page.waitForTimeout(80);
      await openConfirmation(page);
      await page.locator("[data-testid='canary-484-confirm-submit']").click();
      await expectAttribute(consoleRoot, "data-canary-state", "active");
      await expectAttribute(consoleRoot, "data-settlement-state", "accepted_pending_observation");
      assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
      return artifacts;
    });
    readyArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_ready", artifactRef }),
    );

    const confirmationArtifacts = await runScenario(
      context,
      "canary_484_tenant_channel_confirmations",
      async (page) => {
        const artifacts: string[] = [];
        for (const [state, expectedKind] of [
          ["tenant_ready", "Tenant"],
          ["channel_ready", "Channel"],
          ["ready", "Mixed"],
        ] as const) {
          const consoleRoot = await gotoAndWait(
            page,
            `${ops.baseUrl}/ops/release/canary-rollout?state=${state}`,
            "[data-testid='canary-484-console']",
          );
          await expectAttribute(consoleRoot, "data-canary-state", state);
          await expectAttribute(consoleRoot, "data-widening-enabled", "true");
          const dialog = await openConfirmation(page);
          const text = await dialog.innerText();
          assert(text.includes(expectedKind), `${state} dialog must show ${expectedKind}`);
          assert(text.includes("Tenant selector"));
          assert(text.includes("Cohort selector"));
          assert(text.includes("Channel selector"));
          artifacts.push(
            outputRelative(
              await writeAriaSnapshot(dialog, `${SUITE}/canary_484_${state}.confirmation.aria.txt`),
            ),
          );
          await page.locator("[data-testid='canary-484-confirm-cancel']").click();
        }
        await assertNoHorizontalOverflow(page, "tenant channel confirmation console");
        return artifacts;
      },
    );
    confirmationArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_tenant_channel_confirmations", artifactRef }),
    );

    const activeArtifacts = await runScenario(context, "canary_484_active", async (page) => {
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/canary-rollout?state=active`,
        "[data-testid='canary-484-console']",
      );
      await expectAttribute(consoleRoot, "data-canary-state", "active");
      await expectAttribute(consoleRoot, "data-widening-enabled", "false");
      await expectAttribute(consoleRoot, "data-settlement-state", "accepted_pending_observation");
      assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
      await assertNoHorizontalOverflow(page, "active canary console");
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-ladder']"),
            `${SUITE}/canary_484_active.ladder.aria.txt`,
          ),
        ),
        outputRelative(await captureScreenshot(consoleRoot, `${SUITE}/canary_484_active.png`)),
      ];
    });
    activeArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_active", artifactRef }),
    );

    const pausedArtifacts = await runScenario(context, "canary_484_paused", async (page) => {
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/canary-rollout?state=paused`,
        "[data-testid='canary-484-console']",
      );
      await expectAttribute(consoleRoot, "data-canary-state", "paused");
      await expectAttribute(consoleRoot, "data-widening-enabled", "false");
      await expectAttribute(consoleRoot, "data-settlement-state", "blocked_guardrail");
      await page.locator("[data-testid='canary-484-pause-record']").waitFor();
      assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
      await assertNoHorizontalOverflow(page, "paused canary console");
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-controls']"),
            `${SUITE}/canary_484_paused.controls.aria.txt`,
          ),
        ),
        outputRelative(await captureScreenshot(consoleRoot, `${SUITE}/canary_484_paused.png`)),
      ];
    });
    pausedArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_paused", artifactRef }),
    );

    const rollbackArtifacts = await runScenario(context, "canary_484_rollback", async (page) => {
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/canary-rollout?state=rollback`,
        "[data-testid='canary-484-console']",
      );
      await expectAttribute(consoleRoot, "data-canary-state", "rollback");
      await expectAttribute(consoleRoot, "data-widening-enabled", "false");
      await expectAttribute(consoleRoot, "data-settlement-state", "evidence_required");
      await page.locator("[data-testid='canary-484-rollback-record']").waitFor();
      assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
      await assertNoHorizontalOverflow(page, "rollback canary console");
      const desktop = outputRelative(
        await captureScreenshot(consoleRoot, `${SUITE}/canary_484_rollback.png`),
      );
      await page.setViewportSize({ width: 390, height: 920 });
      await assertNoHorizontalOverflow(page, "rollback canary console mobile");
      const mobile = outputRelative(
        await captureScreenshot(consoleRoot, `${SUITE}/canary_484_rollback.mobile.png`),
      );
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-controls']"),
            `${SUITE}/canary_484_rollback.controls.aria.txt`,
          ),
        ),
        desktop,
        mobile,
      ];
    });
    rollbackArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_rollback", artifactRef }),
    );

    const completedArtifacts = await runScenario(context, "canary_484_completed", async (page) => {
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/canary-rollout?state=completed`,
        "[data-testid='canary-484-console']",
      );
      await expectAttribute(consoleRoot, "data-canary-state", "completed");
      await expectAttribute(consoleRoot, "data-settlement-state", "applied");
      await expectAttribute(consoleRoot, "data-widening-enabled", "false");
      assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
      await assertNoHorizontalOverflow(page, "completed canary console");
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-node-details']"),
            `${SUITE}/canary_484_completed.node.aria.txt`,
          ),
        ),
        outputRelative(await captureScreenshot(consoleRoot, `${SUITE}/canary_484_completed.png`)),
      ];
    });
    completedArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_completed", artifactRef }),
    );

    const blockedArtifacts = await runScenario(context, "canary_484_blocked", async (page) => {
      const consoleRoot = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/canary-rollout?state=blocked`,
        "[data-testid='canary-484-console']",
      );
      await expectAttribute(consoleRoot, "data-canary-state", "blocked");
      await expectAttribute(consoleRoot, "data-widening-enabled", "false");
      await expectAttribute(consoleRoot, "data-previous-stability", "insufficient_evidence");
      await page
        .locator("[data-testid='canary-484-controls']")
        .getByText("blocker:484:previous-wave-stability-not-exact")
        .waitFor();
      assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
      await assertNoHorizontalOverflow(page, "blocked canary console");
      const desktop = outputRelative(
        await captureScreenshot(consoleRoot, `${SUITE}/canary_484_blocked.png`),
      );
      await page.setViewportSize({ width: 390, height: 920 });
      await assertNoHorizontalOverflow(page, "blocked canary console mobile");
      const mobile = outputRelative(
        await captureScreenshot(consoleRoot, `${SUITE}/canary_484_blocked.mobile.png`),
      );
      return [
        outputRelative(
          await writeAriaSnapshot(
            page.locator("[data-testid='canary-484-controls']"),
            `${SUITE}/canary_484_blocked.controls.aria.txt`,
          ),
        ),
        desktop,
        mobile,
      ];
    });
    blockedArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_blocked", artifactRef }),
    );

    const selectorArtifacts = await runScenario(
      context,
      "canary_484_selector_expanded",
      async (page) => {
        const consoleRoot = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/canary-rollout?state=selector_expanded`,
          "[data-testid='canary-484-console']",
        );
        await expectAttribute(consoleRoot, "data-canary-state", "selector_expanded");
        await expectAttribute(consoleRoot, "data-widening-enabled", "false");
        await expectAttribute(consoleRoot, "data-selector-state", "expanded");
        assert(await page.locator("[data-testid='canary-484-widen-action']").isDisabled());
        await assertNoHorizontalOverflow(page, "selector expanded canary console");
        return [
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='canary-484-scope-comparison']"),
              `${SUITE}/canary_484_selector_expanded.scope.aria.txt`,
            ),
          ),
          outputRelative(
            await captureScreenshot(consoleRoot, `${SUITE}/canary_484_selector_expanded.png`),
          ),
        ];
      },
    );
    selectorArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "canary_484_selector_expanded", artifactRef }),
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
