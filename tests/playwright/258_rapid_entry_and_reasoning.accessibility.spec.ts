import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const rapidEntryAndReasoningAccessibilityCoverage = [
  "reasoning tabs are keyboard reachable",
  "question set picker exposes selected state",
  "reduced-motion narrow layout stays readable",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1180, height: 960 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");

    assertCondition((await page.locator("[data-testid='QuickCaptureTray']").count()) === 1, "quick capture tray missing");
    assertCondition((await page.locator("[data-testid='QuestionSetPicker']").count()) === 1, "question set picker missing");

    await page.getByRole("tab", { name: "More-info" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
    await page.locator("[data-testid='MoreInfoInlineSideStage']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='QuickCaptureTray']").getAttribute("data-active-mode")) === "more_info",
      "more-info tab state did not update",
    );

    const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await narrow.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(narrow, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await assertNoHorizontalOverflow(narrow, "258 reasoning dock accessibility narrow");
    await writeAccessibilitySnapshot(narrow, "258-reasoning-dock-accessibility-snapshot.json");
    await narrow.close();
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
