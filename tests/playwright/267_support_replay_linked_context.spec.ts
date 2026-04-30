import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const supportReplayCoverage = [
  "enter replay from a live ticket without losing anchor context",
  "buffer live deltas into replay delta review",
  "keep history and knowledge same-shell and mask-safe",
];

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
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219`,
      "SupportTicketRoute",
    );
    const root = page.locator(".support-workspace");
    assertCondition(
      (await root.getAttribute("data-support-shell-mode")) === "live",
      "live support ticket should publish live shell mode before replay opens",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === "repair_preview_219",
      "live support ticket should keep the selected repair preview anchor",
    );

    await page.getByRole("button", { name: "Replay", exact: true }).click();
    await page.locator("[data-testid='SupportReplayRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/ops/support/replay/support_replay_session_218_delivery_failure",
      "replay button should open the governed replay route",
    );
    assertCondition(
      (await root.getAttribute("data-support-shell-mode")) === "replay",
      "replay entry should upgrade the shell mode in place",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === "repair_preview_219",
      "replay entry should preserve the selected timeline anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportReplaySurface']").getAttribute("data-replay-checkpoint")) ===
        "support_replay_checkpoint_219_delivery_failure",
      "replay surface should expose the replay checkpoint",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportTicketChildRouteShell']").getAttribute("data-shell-topology")) ===
        "three_plane",
      "replay should promote the three-plane child shell",
    );

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&anchor=repair_preview_219&replay=delta_review&delta=blocking&restore=blocked`,
      "SupportReplayRoute",
    );
    assertCondition(
      (await root.getAttribute("data-delta-review-state")) === "blocking",
      "blocking replay deltas should publish on the shell root",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportReplayDeltaReviewPanel']").getAttribute("data-delta-review-state")) ===
        "blocking",
      "replay delta review panel should expose the blocking delta state",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportReplayRestoreBridge']").getAttribute("data-restore-state")) ===
        "blocked",
      "restore bridge should remain blocked while delta review is blocking",
    );

    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&anchor=repair_preview_219&disclosure=expanded`,
      "SupportHistoryRoute",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportTicketChildRouteShell']").getAttribute("data-route-key")) ===
        "ticket-history",
      "history should remain a support child route rather than a detached utility page",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === "repair_preview_219",
      "history route should preserve the selected support anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportLinkedContextView']").getAttribute("data-linked-context-mode")) ===
        "history",
      "history route should keep linked context in history mode",
    );

    await page.locator(".support-workspace__left-rail").getByRole("button", { name: "Knowledge", exact: true }).click();
    await page.locator("[data-testid='SupportKnowledgeRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/ops/support/tickets/support_ticket_218_delivery_failure/knowledge",
      "knowledge route should stay inside the support ticket route family",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === "repair_preview_219",
      "knowledge route should preserve the active support anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportTicketChildRouteShell'] [data-testid='SupportKnowledgeView']").getAttribute("data-knowledge-state")) ===
        "live",
      "knowledge route should stay bound to the live knowledge state",
    );

    await assertNoHorizontalOverflow(page, "267 support replay linked context desktop");
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
