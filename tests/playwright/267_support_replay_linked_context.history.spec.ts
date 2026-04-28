import {
  assertCondition,
  importPlaywright,
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&anchor=repair_preview_219&replay=delta_review&delta=blocking&restore=blocked`,
      "SupportReplayRoute",
    );
    const root = page.locator(".support-workspace");
    const anchorBeforeReload = await root.getAttribute("data-selected-anchor");

    await page.getByRole("tab", { name: "Ticket" }).click();
    await page.locator("[data-testid='SupportTicketRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='SupportReplayRestoreBridge']").count()) === 1,
      "ticket overview should keep the replay restore bridge visible after replay was opened",
    );
    assertCondition(
      (await page.locator("[data-testid='support-action-cta']").isDisabled()) === true,
      "ticket overview should keep live action controls inert while replay restore is blocked",
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='SupportTicketRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === anchorBeforeReload,
      "reload should preserve the selected support anchor while replay gate is active",
    );
    assertCondition(
      (await root.getAttribute("data-restore-state")) === "blocked",
      "reload should preserve the replay restore state on the support shell root",
    );

    await page.getByRole("button", { name: "Open replay restore" }).click();
    await page.locator("[data-testid='SupportReplayRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/ops/support/replay/support_replay_session_218_delivery_failure",
      "return to replay restore should reopen the same replay session",
    );

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='SupportTicketRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='SupportReplayRestoreBridge']").count()) === 1,
      "back navigation should restore the same replay gate on the ticket overview",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === anchorBeforeReload,
      "back navigation should restore the same support anchor",
    );

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=blocked&fallback=replay_restore_failure&replay=read_only_recovery&delta=blocking&restore=read_only_recovery`,
      "SupportReplayRoute",
    );
    assertCondition(
      (await root.getAttribute("data-support-shell-mode")) === "read_only_recovery",
      "stale replay deep link should fall to same-shell read-only recovery",
    );
    assertCondition(
      (await page.locator("[data-testid='ReadOnlyFallbackHero']").count()) === 1,
      "stale replay deep link should keep the read-only fallback panel in place",
    );
    assertCondition(
      (await page.locator("[data-testid='support-action-cta']").isDisabled()) === true,
      "stale replay deep link must not silently re-enable live controls",
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
