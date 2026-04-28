import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const rapidEntryAndReasoningFreezeCoverage = [
  "stale review freezes compose state in place",
  "frozen provenance keeps the current note visible",
  "send controls disable under stale-recoverable posture",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311/more-info`, "WorkspaceMoreInfoChildRoute");
    await page.getByLabel("Rapid entry note").fill("Keep the current inhaler draft visible if the epoch drifts.");
    await page.waitForTimeout(320);
    await page.locator("select").selectOption("stale_review");

    await page.locator("[data-testid='ProtectedCompositionFreezeFrame']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ProtectedCompositionFreezeFrame']").getAttribute("data-freeze-state")) ===
        "stale_recoverable",
      "freeze frame did not enter stale-recoverable posture",
    );
    assertCondition(
      await page.getByLabel("Rapid entry note").isDisabled(),
      "rapid entry note stayed writable after stale drift",
    );
    assertCondition(
      ((await page.locator("[data-testid='ProtectedCompositionFreezeFrame']").textContent()) || "").includes(
        "Keep the current inhaler draft visible",
      ),
      "freeze frame lost the preserved draft summary",
    );
    assertCondition(
      await page.getByRole("button", { name: "Send frozen by current tuple drift" }).isDisabled(),
      "more-info send remained enabled under stale drift",
    );
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
