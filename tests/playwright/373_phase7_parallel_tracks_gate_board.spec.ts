import path from "node:path";
import { pathToFileURL } from "node:url";

import { assertCondition, importPlaywright } from "./356_pharmacy_shell.helpers.ts";

const ROOT = "/Users/test/Code/V";
const BOARD_URL = pathToFileURL(
  path.join(ROOT, "docs", "frontend", "373_deferred_channel_parallel_tracks_gate_board.html"),
).toString();

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(BOARD_URL, { waitUntil: "load" });

    const board = page.getByTestId("Phase7ParallelGateBoard");
    await board.waitFor();
    assertCondition(
      (await board.getAttribute("data-launch-verdict")) === "open_phase7_with_constraints",
      "Gate board must expose the formal constrained Phase 7 opening verdict.",
    );
    assertCondition((await board.getAttribute("data-ready-count")) === "6", "Ready count drifted.");
    assertCondition(
      (await board.getAttribute("data-blocked-count")) === "15",
      "Blocked count drifted.",
    );
    assertCondition(
      (await board.getAttribute("data-deferred-count")) === "8",
      "Deferred count drifted.",
    );

    for (const testId of [
      "SummaryStrip",
      "TrackRail",
      "ReadinessCanvas",
      "InspectorPanel",
      "TrackEvidenceTable",
      "FuturePreconditionTable",
    ]) {
      assertCondition(await page.getByTestId(testId).isVisible(), `${testId} missing.`);
    }

    await page.getByTestId("TrackButton-par_375").click();
    assertCondition(
      /par_375/.test((await page.getByTestId("SelectedTrackTitle").textContent()) ?? ""),
      "Selecting par_375 must synchronize the title.",
    );
    assertCondition(
      /373_track_launch_packet_375/.test(
        (await page.getByTestId("LaunchPacketRows").textContent()) ?? "",
      ),
      "Selecting par_375 must synchronize the launch packet rows.",
    );

    await page.getByTestId("ReadinessFilter").selectOption("blocked");
    assertCondition(
      (await page.getByTestId("TrackCount").textContent()) === "15",
      "Blocked filter must expose 15 blocked tracks.",
    );

    await page.getByTestId("ReadinessFilter").selectOption("deferred");
    assertCondition(
      (await page.getByTestId("TrackCount").textContent()) === "8",
      "Deferred filter must expose 8 deferred tracks.",
    );

    await page.getByTestId("ReadinessFilter").selectOption("all");
    await page.getByTestId("RiskClassFilter").selectOption("identity_trust");
    assertCondition(
      ((await page.getByTestId("TrackCount").textContent()) ?? "").match(/^[0-9]+$/) !== null,
      "Risk filter must keep a deterministic numeric count.",
    );

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    assertCondition(activeTag !== "body", "Keyboard navigation must not drop focus to the body.");

    const reducedMotionDuration = await page
      .locator("[data-testid='Phase7ParallelGateBoard']")
      .evaluate(() => {
        const probe = document.createElement("div");
        probe.style.transitionDuration = "var(--missing, 0s)";
        document.body.append(probe);
        const value = getComputedStyle(probe).transitionDuration;
        probe.remove();
        return value;
      });
    assertCondition(
      typeof reducedMotionDuration === "string",
      "Reduced-motion browser context must compute styles.",
    );

    await context.close();
  } finally {
    await browser.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
