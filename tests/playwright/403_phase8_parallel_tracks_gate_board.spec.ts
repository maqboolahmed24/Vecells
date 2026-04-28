import path from "node:path";
import { pathToFileURL } from "node:url";

import { assertCondition, importPlaywright, outputPath } from "./356_pharmacy_shell.helpers.ts";

const ROOT = "/Users/test/Code/V";
const BOARD_URL = pathToFileURL(
  path.join(ROOT, "docs", "frontend", "403_phase8_parallel_tracks_gate_board.html"),
).toString();

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    await page.goto(BOARD_URL, { waitUntil: "load" });

    const board = page.getByTestId("Phase8ParallelTracksGateBoard");
    await board.waitFor();
    assertCondition(
      (await board.getAttribute("data-verdict")) === "open_phase8_now",
      "403 board must expose the open Phase 8 verdict.",
    );
    assertCondition(await page.getByTestId("LaunchStrip").isVisible(), "403 launch strip missing.");
    assertCondition(await page.getByTestId("TrackRail").isVisible(), "403 track rail missing.");
    assertCondition(
      await page.getByTestId("DependencyCanvas").isVisible(),
      "403 dependency canvas missing.",
    );
    assertCondition(await page.getByTestId("InspectorPanel").isVisible(), "403 inspector missing.");
    assertCondition(
      await page.getByTestId("PreconditionTables").isVisible(),
      "403 precondition tables missing.",
    );

    await page.getByTestId("TrackButton-par_408").click();
    assertCondition(
      /summary, note draft/i.test((await page.getByTestId("SelectedTrackTitle").textContent()) ?? ""),
      "Selecting par_408 must synchronize the selected title.",
    );
    assertCondition(
      /403_track_launch_packet_408/.test((await page.getByTestId("LaunchPacketRows").textContent()) ?? ""),
      "par_408 must show its launch packet.",
    );
    assertCondition(
      /No blockers/.test((await page.getByTestId("BlockerRows").textContent()) ?? ""),
      "par_408 must show no blockers.",
    );
    assertCondition(
      /phase8_8D/.test((await page.getByTestId("UpstreamContractRows").textContent()) ?? ""),
      "par_408 must synchronize upstream contract rows.",
    );

    await page.getByTestId("ReadinessFilter").selectOption("ready");
    assertCondition(
      (await page.getByTestId("TrackCount").textContent()) === "6",
      "ready filter must show the six open tracks.",
    );
    await page.getByTestId("OwnerFilter").selectOption("documentation_composer");
    assertCondition(
      (await page.getByTestId("TrackCount").textContent()) === "1",
      "owner filter must reduce to the documentation composer track.",
    );
    await page.getByTestId("OwnerFilter").selectOption("all");
    await page.getByTestId("ReadinessFilter").selectOption("all");

    await page.getByTestId("TrackButton-par_410").click();
    assertCondition(
      /GAP403_410/.test((await page.getByTestId("BlockerRows").textContent()) ?? ""),
      "par_410 must show its blocking dependency.",
    );
    assertCondition(
      /No launch packet/.test((await page.getByTestId("LaunchPacketRows").textContent()) ?? ""),
      "par_410 must not imply a launch packet.",
    );
    assertCondition(
      /P9RES403_006/.test((await page.getByTestId("FuturePhaseRows").textContent()) ?? ""),
      "par_410 must synchronize future reserve refs.",
    );

    await page.getByTestId("TrackButton-par_410").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      /par_411/.test((await page.getByTestId("SelectedTrackTitle").textContent()) ?? ""),
      "ArrowDown on the rail must move to the next visible track.",
    );

    await page.screenshot({
      path: outputPath("403-phase8-parallel-tracks-gate-board.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({ path: outputPath("403-phase8-parallel-tracks-gate-board-trace.zip") });
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
