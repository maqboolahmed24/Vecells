import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function queueOrder(page: any): Promise<string[]> {
  return await page.evaluate(() =>
    Array.from(document.querySelectorAll(".staff-shell__queue-row-main[data-task-id]")).map((node) =>
      node.getAttribute("data-task-id"),
    ),
  );
}

export const queueWorkboardLiveUpdateCoverage = [
  "queue batch apply preserves the selected anchor",
  "row order updates only after explicit apply",
  "moved row surfaces as an anchored stub instead of disappearing",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    const before = await queueOrder(page);
    await page.locator("[data-testid='queue-change-batch-banner']").waitFor();
    assertCondition(before[0] === "task-311", `expected task-311 to stay first before apply, got ${before.join("|")}`);
    assertCondition(before.includes("task-412"), "expected task-412 in the pre-apply queue");

    await page.getByRole("button", { name: "Apply queued changes" }).click();
    const after = await queueOrder(page);
    assertCondition(after[0] === "task-311", `selected anchor row should stay first after apply, got ${after.join("|")}`);
    assertCondition(before.join("|") !== after.join("|"), "queue order did not change after explicit apply");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-311",
      "selected anchor should stay pinned after batch apply",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-208`, "WorkspaceTaskRoute");
    await page.locator("[data-testid='queue-toolbar']").getByRole("button", { name: "Returned evidence" }).click();
    await page.waitForURL(`${baseUrl}/workspace/queue/returned-evidence`);
    const stub = page.locator("[data-testid='queue-anchor-stub']");
    await stub.waitFor();
    await page.waitForFunction(
      () => document.querySelector("[data-testid='queue-anchor-stub']")?.getAttribute("data-stub-state") === "moved_to_approvals",
    );
    assertCondition(
      (await stub.getAttribute("data-stub-state")) === "moved_to_approvals",
      "expected the moved approval row to surface as an anchored stub",
    );
    await page.getByRole("button", { name: "Open approvals lane" }).click();
    await page.waitForURL(`${baseUrl}/workspace/queue/approvals`);
    await page.locator("[data-task-id='task-208']").waitFor();
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
