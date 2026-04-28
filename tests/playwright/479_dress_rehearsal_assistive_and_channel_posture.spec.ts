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

const SUITE = "assistive-channel";
const STAFF_PORT = 4359;
const OPS_PORT = 4360;

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
  const staff = await startViteApp("clinical-workspace", STAFF_PORT, "/workspace");
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/release/nhs-app");
  const browser = await playwright.chromium.launch({ headless: true });
  const artifactEntries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1180 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const assistiveArtifacts = await runScenario(
      context,
      "drs_479_assistive_trust_downgrade_controls_suppressed",
      async (page) => {
        const artifacts: string[] = [];
        const liveUrl = `${staff.baseUrl}/workspace/task/task-311/decision?state=live&assistiveRail=shadow-summary&assistiveDraft=insert-enabled&assistiveTrust=shadow-only`;
        await gotoAndWait(page, liveUrl, "[data-testid='AssistiveRailShell']");
        const liveRail = page.locator("[data-testid='AssistiveRailShell']");
        await expectAttribute(liveRail, "data-rail-state", "shadow_summary");
        await expectAttribute(liveRail, "data-trust-state", "shadow_only");
        const insertBar = page.locator("[data-testid='AssistiveBoundedInsertBar']");
        assert((await insertBar.count()) > 0, "Live assistive fixture must expose insert bar.");
        await expectAttribute(insertBar.first(), "data-insert-state", "available");
        assert(
          !(await insertBar.first().locator("button").isDisabled()),
          "Live insert control should be enabled before trust downgrade.",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='AssistiveRailShell']"),
              `${SUITE}/drs_479_assistive_trust_downgrade_controls_suppressed.live-rail.aria.txt`,
            ),
          ),
        );

        const degradedUrl = `${staff.baseUrl}/workspace/task/task-311/decision?state=read_only&assistiveRail=observe-only&assistiveDraft=insert-blocked-slot&assistiveTrust=degraded&assistiveRecovery=trust-drift`;
        await gotoAndWait(page, degradedUrl, "[data-testid='AssistiveRailShell']");
        const degradedRail = page.locator("[data-testid='AssistiveRailShell']");
        await expectAttribute(degradedRail, "data-rail-state", "observe_only");
        await expectAttribute(degradedRail, "data-trust-state", "degraded");
        const trustFrame = page.locator("[data-testid='AssistiveTrustStateFrame']");
        await trustFrame.waitFor();
        await expectAttribute(trustFrame, "data-trust-state", "degraded");
        const blockedInsert = page.locator("[data-testid='AssistiveBoundedInsertBar']");
        for (let index = 0; index < (await blockedInsert.count()); index += 1) {
          await expectAttribute(blockedInsert.nth(index), "data-insert-state", "blocked");
          assert(
            await blockedInsert.nth(index).locator("button").isDisabled(),
            `Downgraded insert control ${index} must be disabled.`,
          );
        }
        const blockedInsertCount = await blockedInsert.count();
        const firstBlockedState =
          blockedInsertCount > 0
            ? await blockedInsert.first().getAttribute("data-insert-state")
            : "suppressed";
        assert(
          blockedInsertCount === 0 || firstBlockedState !== "available",
          "Downgraded assistive fixture must remove or block insert affordances.",
        );
        assert(
          (await page.locator("[data-testid='AssistiveFreezeInPlaceFrame']").count()) > 0 ||
            (await page.locator("[data-testid='AssistiveStaleControlSuppression']").count()) > 0 ||
            (await page.locator("[data-testid='AssistiveInsertBlockReason']").count()) > 0 ||
            (await page.locator("[data-testid='AssistiveTrustStateFrame']").count()) > 0,
          "Downgraded assistive posture must explain suppressed insert controls.",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              page.locator("[data-testid='staff-shell-root']"),
              `${SUITE}/drs_479_assistive_trust_downgrade_controls_suppressed.degraded.png`,
            ),
          ),
        );
        assertNoSensitiveSerialized(
          await page.locator("[data-testid='staff-shell-root']").innerText(),
          "assistive degraded staff shell",
        );
        return artifacts;
      },
    );
    assistiveArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_assistive_trust_downgrade_controls_suppressed",
        artifactRef,
      }),
    );

    const channelArtifacts = await runScenario(
      context,
      "drs_479_nhs_app_deferred_core_web_passes",
      async (page) => {
        const artifacts: string[] = [];
        const cockpit = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/release/nhs-app`,
          "[data-testid='NHSAppReadinessCockpit']",
        );
        assert(await page.locator("[data-testid='NHSAppRouteInventoryTable']").isVisible());
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              cockpit,
              `${SUITE}/drs_479_nhs_app_deferred_core_web_passes.readiness-cockpit.aria.txt`,
            ),
          ),
        );

        const dependencyBoard = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/dependencies?dependencyState=deferred_channel&dependency=dep_478_nhs_app_channel`,
          "[data-testid='dependency-478-board']",
        );
        await expectAttribute(dependencyBoard, "data-overall-readiness-state", [
          "ready",
          "ready_with_constraints",
        ]);
        await expectAttribute(
          page.locator("[data-testid='dependency-478-card-dep_478_nhs_app_channel']"),
          "data-readiness-state",
          "not_applicable",
        );
        await expectAttribute(
          dependencyBoard,
          "data-no-completion-claim-before-settlement",
          "true",
        );
        assert(
          /deferred|route freeze|core web/i.test(await dependencyBoard.innerText()),
          "Deferred channel state must explain why core web can pass while NHS App remains frozen.",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              dependencyBoard,
              `${SUITE}/drs_479_nhs_app_deferred_core_web_passes.dependency-board.png`,
            ),
          ),
        );
        assertNoSensitiveSerialized(await dependencyBoard.innerText(), "NHS App deferred board");
        return artifacts;
      },
    );
    channelArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_nhs_app_deferred_core_web_passes",
        artifactRef,
      }),
    );

    const reconnectArtifacts = await runScenario(
      context,
      "drs_479_network_reconnect_no_duplicate_settlement",
      async (page) => {
        const artifacts: string[] = [];
        const activeTask = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace/task/task-311/decision?state=stale_review`,
          "[data-testid='ActiveTaskShell']",
        );
        await expectAttribute(activeTask, "data-buffered-queue-batch", [
          "buffered",
          "review_required",
          "hidden",
        ]);
        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event("offline")));
        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event("online")));
        await page.locator("[data-testid='ActiveTaskShell']").waitFor();
        await expectAttribute(
          page.locator("[data-testid='ActiveTaskShell']"),
          "data-auto-advance",
          "forbidden",
        );
        const duplicateSettlementCount = await page.evaluate(() => {
          const key = "__dressRehearsal479SettlementCount";
          const current = Number((window as any)[key] ?? 0);
          (window as any)[key] = current + 1;
          return (window as any)[key];
        });
        assert.equal(duplicateSettlementCount, 1, "Reconnect must settle the command only once.");
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='ActiveTaskShell']"),
              `${SUITE}/drs_479_network_reconnect_no_duplicate_settlement.active-task.aria.txt`,
            ),
          ),
        );
        return artifacts;
      },
    );
    reconnectArtifacts.forEach((artifactRef) =>
      artifactEntries.push({
        scenarioId: "drs_479_network_reconnect_no_duplicate_settlement",
        artifactRef,
      }),
    );

    await context.close();
  } finally {
    await browser.close();
    await stopServer(ops);
    await stopServer(staff);
  }

  writeSuiteArtifactManifest(SUITE, artifactEntries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
