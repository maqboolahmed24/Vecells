import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function openSupportRoute(page: any, url: string, testId: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("[data-testid='SupportTicketHeader']").waitFor();
  await page.locator(`[data-testid='${testId}']`).waitFor();
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openSupportRoute(
      desktop,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&anchor=repair_preview_219`,
      "SupportReplayRoute",
    );
    await desktop.screenshot({ path: outputPath("267-support-replay-live.png"), fullPage: true });

    const blocking = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await blocking.emulateMedia({ reducedMotion: "reduce" });
    await openSupportRoute(
      blocking,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&anchor=repair_preview_219&replay=delta_review&delta=blocking&restore=blocked`,
      "SupportReplayRoute",
    );
    assertCondition(
      (await blocking.locator("[data-testid='SupportReplayRestoreBridge']").getAttribute("data-restore-state")) ===
        "blocked",
      "blocking replay visual state should keep restore blocked",
    );
    await assertNoHorizontalOverflow(blocking, "267 support replay blocking desktop");
    await blocking.screenshot({ path: outputPath("267-support-replay-blocking.png"), fullPage: true });

    const history = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openSupportRoute(
      history,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&anchor=repair_preview_219&disclosure=expanded`,
      "SupportHistoryRoute",
    );
    await history.screenshot({ path: outputPath("267-support-history-linked-context.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 430, height: 980 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await openSupportRoute(
      mobile,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=blocked&fallback=replay_restore_failure&replay=read_only_recovery&delta=blocking&restore=read_only_recovery`,
      "SupportReplayRoute",
    );
    assertCondition(
      (await mobile.locator(".support-workspace").getAttribute("data-support-shell-mode")) ===
        "read_only_recovery",
      "blocked replay should collapse to read-only recovery on mobile",
    );
    await assertNoHorizontalOverflow(mobile, "267 support replay mobile recovery");
    await mobile.screenshot({ path: outputPath("267-support-replay-mobile-recovery.png"), fullPage: true });
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
