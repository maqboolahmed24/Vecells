import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const supportReplayAccessibilityCoverage = [
  "replay route keeps named sections and explicit restore blockers",
  "history route stays keyboard-reachable and same-shell in reduced motion",
  "mobile recovery keeps one readable order for replay, blockers, and chronology",
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openSupportRoute(
      page,
      `${baseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=active&anchor=repair_preview_219&replay=delta_review&delta=blocking&restore=blocked`,
      "SupportReplayRoute",
    );

    assertCondition((await page.locator("[data-testid='SupportReplaySurface']").count()) === 1, "replay surface missing");
    assertCondition(
      (await page.locator("[data-testid='SupportReplayDeltaReviewPanel']").count()) === 1,
      "replay delta review panel missing",
    );
    assertCondition(
      (await page.locator("[data-testid='SupportReplayRestoreBridge']").count()) === 1,
      "replay restore bridge missing",
    );
    await page.getByRole("button", { name: "Replay", exact: true }).focus();
    await assertNoHorizontalOverflow(page, "267 support replay accessibility desktop");

    const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await narrow.emulateMedia({ reducedMotion: "reduce" });
    await openSupportRoute(
      narrow,
      `${baseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&anchor=repair_preview_219&disclosure=expanded`,
      "SupportHistoryRoute",
    );
    assertCondition((await narrow.locator("[data-testid='SupportLinkedContextView']").count()) === 1, "linked context missing");
    assertCondition((await narrow.locator("[data-testid='SupportHistoryView']").count()) >= 1, "history view missing");
    await assertNoHorizontalOverflow(narrow, "267 support replay accessibility narrow");
    await narrow.screenshot({ path: outputPath("267-support-replay-accessibility.png"), fullPage: true });
    await writeAccessibilitySnapshot(narrow, "267-support-replay-accessibility-snapshot.json");
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
