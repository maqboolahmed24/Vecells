import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const focusProtectionNextTaskCoverage = [
  "queue churn renders as a buffered tray instead of silent rerank",
  "protected more-info posture keeps the shell stable and disables batch apply",
  "next-task posture blocks mixed-snapshot launch and only becomes ready on a clean contextual route",
];

async function openProtectedMoreInfo(page: any, baseUrl: string) {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
  await page.locator("[data-testid='QueueWorkboardFrame']").waitFor();
  await page.locator("article:has([data-task-id='task-311']) .staff-shell__queue-open-button").click();
  await page.waitForURL(`${baseUrl}/workspace/task/task-311`);
  await page.getByRole("button", { name: "More-info child route" }).click();
  await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
  await page.waitForFunction(() =>
    document.querySelector("[data-testid='ActiveTaskShell']")?.getAttribute("data-protected-composition") ===
    "composing",
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
    const tray = page.locator("[data-testid='BufferedQueueChangeTray']");
    await tray.waitFor();
    assertCondition(
      (await tray.getAttribute("data-buffered-queue-batch")) === "review_required",
      "queue tray should expose review-required queue churn",
    );
    assertCondition(
      (await tray.getAttribute("data-tray-state")) === "expanded",
      "queue tray should begin expanded on queue entry",
    );

    await openProtectedMoreInfo(page, baseUrl);
    const activeShell = page.locator("[data-testid='ActiveTaskShell']");
    assertCondition(
      (await activeShell.getAttribute("data-focus-protection")) === "active",
      "more-info route should publish active focus protection",
    );
    assertCondition(
      (await activeShell.getAttribute("data-protected-composition")) === "composing",
      "more-info route should publish composing protected state",
    );
    assertCondition(
      (await activeShell.getAttribute("data-buffered-queue-batch")) === "review_required",
      "task shell should keep the buffered queue batch visible",
    );
    assertCondition(
      (await activeShell.getAttribute("data-next-task-state")) === "release_pending",
      "protected route should downgrade next-task posture to release_pending",
    );
    const taskTray = page.locator("[data-testid='decision-dock'] [data-testid='BufferedQueueChangeTray']");
    assertCondition(
      await taskTray.getByRole("button", { name: "Apply buffered queue changes" }).isDisabled(),
      "protected more-info posture should not allow queue batch apply",
    );

    await page.goto(`${baseUrl}/workspace`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.localStorage.clear());
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-118?state=live`, "WorkspaceTaskRoute");
    const readyShell = page.locator("[data-testid='ActiveTaskShell']");
    assertCondition(
      (await readyShell.getAttribute("data-next-task-state")) === "ready",
      "clean contextual task route should expose ready next-task posture",
    );
    assertCondition(
      (await page.locator("[data-testid='NextTaskPostureCard']").getAttribute("data-auto-advance")) === "forbidden",
      "no-auto-advance marker drifted",
    );

    await assertNoHorizontalOverflow(page, "262 focus protection desktop");
    assertCondition(externalRequests.size == 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
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
