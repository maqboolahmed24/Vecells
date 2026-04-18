import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./266_patient_conversation_surface.helpers";

async function activeTestId(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return null;
    }
    return (
      active.id ??
      active.getAttribute("data-testid") ??
      active.closest("[data-testid]")?.getAttribute("data-testid") ??
      null
    );
  });
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/more-info?state=live`);

    const routeSnapshot = await page.locator("[data-testid='PatientConversationRoute']").ariaSnapshot();
    for (const token of [
      "More information",
      "Answer the question the practice still needs",
      "Return to request",
      "What happens next",
    ]) {
      assertCondition(routeSnapshot.includes(token), `conversation ARIA snapshot missing ${token}`);
    }

    await page.locator("[data-testid='PatientConversationReturnButton']").focus();
    await page.keyboard.press("Tab");
    let reachedReplyField = false;
    for (let index = 0; index < 7; index += 1) {
      if ((await activeTestId(page)) === "prompt_216_photo_timing") {
        reachedReplyField = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    assertCondition(reachedReplyField, "tab order should eventually reach the active reply field");

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/messages?state=blocked&origin=messages`);
    const liveRegion = page.locator("[data-testid='patient-shell-live-region']");
    assertCondition(
      (await liveRegion.getAttribute("aria-live")) === "polite",
      "patient shell live region must stay polite inside the conversation family",
    );

    await assertNoHorizontalOverflow(page, "266 accessibility route");
    await page.screenshot({
      path: outputPath("266-patient-conversation-accessibility.png"),
      fullPage: true,
    });
    await writeAccessibilitySnapshot(page, "266-patient-conversation-accessibility-snapshot.json");
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
