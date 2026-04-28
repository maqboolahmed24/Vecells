import assert from "node:assert/strict";
import path from "node:path";
import {
  APP_URL,
  OUTPUT_DIR,
  assertNoRawArtifactUrls,
  expectAttribute,
  withOpsConformancePage,
} from "./460_conformance_scorecard.helpers";

export async function runConformanceVisualSuite() {
  await withOpsConformancePage(async (page) => {
    for (const [state, fileName, scorecardState, actionState] of [
      ["exact", "conformance-scorecard-exact.png", "exact", "ready"],
      ["stale", "conformance-scorecard-stale.png", "stale", "diagnostic_only"],
      ["blocked", "conformance-scorecard-blocked.png", "blocked", "blocked"],
      ["deferred-channel", "conformance-scorecard-deferred.png", "exact", "ready"],
      ["no-blocker", "conformance-scorecard-no-blocker.png", "exact", "ready"],
      [
        "permission-denied",
        "conformance-scorecard-permission-denied.png",
        "blocked",
        "permission_denied",
      ],
    ] as const) {
      await page.goto(`${APP_URL}/ops/conformance?state=${state}`, { waitUntil: "networkidle" });
      const shell = page.locator("[data-testid='conformance-scorecard-shell']");
      await shell.waitFor();
      await expectAttribute(shell, "data-scorecard-state", scorecardState);
      await expectAttribute(shell, "data-bau-action-state", actionState);
      await assertNoRawArtifactUrls(page);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, fileName),
        fullPage: true,
      });
    }
  });

  await withOpsConformancePage(
    async (page) => {
      await page.goto(`${APP_URL}/ops/conformance?state=exact`, { waitUntil: "networkidle" });
      const root = page.locator("[data-testid='ops-shell-root']");
      const shell = page.locator("[data-testid='conformance-scorecard-shell']");
      await root.waitFor();
      await shell.waitFor();
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(root, "data-reduced-motion", "respect");
      await expectAttribute(shell, "data-mission-stack-preserved", "true");
      const box = await shell.boundingBox();
      assert(
        box && box.width > 320 && box.height > 500,
        "mission stack scorecard should be visible",
      );
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "conformance-scorecard-mobile-reduced-motion.png"),
        fullPage: true,
      });
    },
    { viewport: { width: 820, height: 1100 }, reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  await runConformanceVisualSuite();
}
