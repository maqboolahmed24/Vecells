import path from "node:path";
import { pathToFileURL } from "node:url";

import { assertCondition, importPlaywright, outputPath } from "./356_pharmacy_shell.helpers.ts";

const ROOT = "/Users/test/Code/V";
const BOARD_URL = pathToFileURL(
  path.join(ROOT, "docs", "frontend", "402_phase7_exit_gate_board.html"),
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

    const board = page.getByTestId("Phase7ExitGateBoard");
    await board.waitFor();
    assertCondition(
      (await board.getAttribute("data-verdict")) === "approved",
      "402 board must expose the approved verdict.",
    );
    assertCondition(
      await page.getByTestId("VerdictStrip").isVisible(),
      "402 verdict strip missing.",
    );
    assertCondition(
      await page.getByTestId("CapabilityRail").isVisible(),
      "402 capability rail missing.",
    );
    assertCondition(
      await page.getByTestId("EvidenceCanvas").isVisible(),
      "402 evidence canvas missing.",
    );
    assertCondition(await page.getByTestId("InspectorPanel").isVisible(), "402 inspector missing.");
    assertCondition(
      await page.getByTestId("TraceabilityTables").isVisible(),
      "402 traceability tables missing.",
    );

    await page.getByTestId("CapabilityButton-CAP402_09").click();
    assertCondition(
      /Release controls and rollback/.test(
        (await page.getByTestId("SelectedCapabilityTitle").textContent()) ?? "",
      ),
      "Selecting CAP402_09 must synchronize the evidence title.",
    );
    assertCondition(
      /release control service/i.test(
        (await page.getByTestId("ImplementationSummary").textContent()) ?? "",
      ),
      "CAP402_09 must synchronize implementation summary.",
    );
    assertCondition(
      /No blockers/.test((await page.getByTestId("BlockerRows").textContent()) ?? ""),
      "CAP402_09 must show no blockers.",
    );
    assertCondition(
      /LC402_002/.test((await page.getByTestId("OwnerRows").textContent()) ?? ""),
      "CAP402_09 must show Phase 8 launch-condition handoff.",
    );

    await page.getByTestId("ProofStatusFilter").selectOption("proved");
    assertCondition(
      (await page.getByTestId("CapabilityCount").textContent()) === "10",
      "proved filter must keep all ten capabilities visible.",
    );
    await page.getByTestId("ContractFamilyFilter").selectOption("release_controls");
    assertCondition(
      (await page.getByTestId("CapabilityCount").textContent()) === "1",
      "contract-family filter must reduce to one release-control row.",
    );
    await page.getByTestId("ContractFamilyFilter").selectOption("all");
    await page.getByTestId("SeverityFilter").selectOption("critical");
    assertCondition(
      Number((await page.getByTestId("CapabilityCount").textContent()) ?? "0") >= 3,
      "critical severity filter must retain critical rows.",
    );

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    assertCondition(activeTag !== "body", "402 board keyboard navigation dropped focus to body.");

    await page.screenshot({
      path: outputPath("402-phase7-exit-gate-board.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({ path: outputPath("402-phase7-exit-gate-board-trace.zip") });
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
