import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 980 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
    const cssVars = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        background: root.getPropertyValue("--staff-shell-bg").trim(),
        accent: root.getPropertyValue("--staff-shell-accent").trim(),
      };
    });
    assertCondition(cssVars.background === "#eef2f7", "workspace background token drifted");
    assertCondition(cssVars.accent === "#3158e0", "workspace accent token drifted");
    await page.screenshot({ path: outputPath("268-workspace-queue-live.png"), fullPage: true });

    const numericFontVariant = await page.locator(".staff-shell__queue-rank-chip").first().evaluate((node: HTMLElement) => {
      return getComputedStyle(node).fontVariantNumeric;
    });
    assertCondition(
      numericFontVariant.includes("tabular-nums"),
      "queue rank chip should keep tabular numerics for scan stability",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-208?state=live`, "WorkspaceTaskRoute");
    await page.screenshot({ path: outputPath("268-workspace-task-ergonomic.png"), fullPage: true });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/approvals?state=live`, "WorkspaceApprovalsRoute");
    await page.screenshot({ path: outputPath("268-workspace-approvals-ergonomic.png"), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/messages?state=stale`, "WorkspaceMessagesRoute");
    await assertNoHorizontalOverflow(page, "268 messages stale mobile");
    await page.screenshot({ path: outputPath("268-workspace-messages-mobile-reduced.png"), fullPage: true });

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
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
