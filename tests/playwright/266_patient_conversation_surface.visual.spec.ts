import {
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  openPatientRoute,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
} from "./266_patient_conversation_surface.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const { server, atlasUrl } = await startStaticServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });

    await page.goto(atlasUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    await page.locator("[data-testid='patient-conversation-surface-atlas-root']").screenshot({
      path: outputPath("266-patient-conversation-atlas.png"),
      fullPage: true,
    });

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation?state=live`);
    await assertNoHorizontalOverflow(page, "266 live conversation");
    await page.screenshot({ path: outputPath("266-patient-conversation-live.png"), fullPage: true });

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/callback?state=repair`);
    await assertNoHorizontalOverflow(page, "266 repair conversation");
    await page.screenshot({ path: outputPath("266-patient-conversation-repair.png"), fullPage: true });

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/messages?state=stale&origin=messages`);
    await assertNoHorizontalOverflow(page, "266 stale conversation");
    await page.screenshot({ path: outputPath("266-patient-conversation-stale.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openPatientRoute(mobile, `${baseUrl}/requests/request_211_a/conversation/repair?state=blocked`);
    await assertNoHorizontalOverflow(mobile, "266 blocked conversation mobile");
    await mobile.screenshot({
      path: outputPath("266-patient-conversation-blocked-mobile.png"),
      fullPage: true,
    });
    await mobile.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openPatientRoute(reducedPage, `${baseUrl}/requests/request_211_a/conversation/messages?origin=messages`);
    await reducedPage.screenshot({
      path: outputPath("266-patient-conversation-reduced-motion.png"),
      fullPage: true,
    });
    await reducedContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(child);
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
