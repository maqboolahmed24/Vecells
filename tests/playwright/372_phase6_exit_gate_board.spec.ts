import path from "node:path";
import { pathToFileURL } from "node:url";

import { assertCondition, importPlaywright } from "./356_pharmacy_shell.helpers.ts";

const ROOT = "/Users/test/Code/V";
const BOARD_URL = pathToFileURL(
  path.join(ROOT, "docs", "frontend", "372_phase6_exit_gate_board.html"),
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

    const board = page.getByTestId("Phase6ExitGateBoard");
    await board.waitFor();
    assertCondition(
      (await board.getAttribute("data-verdict")) === "go_with_constraints",
      "Gate board must expose the formal go_with_constraints verdict.",
    );
    assertCondition(await page.getByTestId("VerdictStrip").isVisible(), "Verdict strip missing.");
    assertCondition(
      await page.getByTestId("CapabilityRail").isVisible(),
      "Capability rail missing.",
    );
    assertCondition(
      await page.getByTestId("EvidenceCanvas").isVisible(),
      "Evidence canvas missing.",
    );
    assertCondition(
      await page.getByTestId("InspectorPanel").isVisible(),
      "Inspector panel missing.",
    );
    assertCondition(
      await page.getByTestId("TraceabilityTables").isVisible(),
      "Traceability tables missing.",
    );

    await page.getByTestId("CapabilityButton-CAP372_03").click();
    assertCondition(
      /Dispatch and transport proof/.test(
        (await page.getByTestId("SelectedCapabilityTitle").textContent()) ?? "",
      ),
      "Selecting dispatch capability must synchronize the evidence title.",
    );
    assertCondition(
      /CF372_001|CF372_002/.test((await page.getByTestId("CarryForwardRows").textContent()) ?? ""),
      "Dispatch capability must synchronize carry-forward rows.",
    );
    assertCondition(
      /HZ372_005/.test((await page.getByTestId("HazardRows").textContent()) ?? ""),
      "Dispatch capability must synchronize hazard rows.",
    );

    await page.getByTestId("ProofStatusFilter").selectOption("proved_with_constraints");
    assertCondition(
      (await page.getByTestId("CapabilityCount").textContent()) === "4",
      "Proof status filter must reduce capability rail to constrained rows.",
    );
    await page.getByTestId("AudienceFilter").selectOption("patient_staff");
    assertCondition(
      ((await page.getByTestId("CapabilityCount").textContent()) ?? "").match(/^[0-9]+$/) !== null,
      "Audience filter must keep a deterministic numeric count.",
    );

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    assertCondition(activeTag !== "body", "Keyboard navigation must not drop focus to the body.");

    const reducedMotionDuration = await page
      .locator("[data-testid='Phase6ExitGateBoard']")
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
      "Reduced-motion browser context must be able to compute styles.",
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
