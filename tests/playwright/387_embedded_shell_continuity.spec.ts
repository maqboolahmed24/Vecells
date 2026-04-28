import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedShellUrl,
  importPlaywright,
  openShellRoute,
  outputPath,
  standaloneShellUrl,
  startPatientWeb,
  stopPatientWeb,
} from "./387_embedded_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const standaloneContext = await browser.newContext({ viewport: { width: 1180, height: 860 } });
    const standalonePage = await standaloneContext.newPage();
    await openShellRoute(standalonePage, standaloneShellUrl(server.baseUrl));
    const standaloneRoot = standalonePage.getByTestId("EmbeddedPatientShellRoot");
    assertCondition(
      (await standaloneRoot.getAttribute("data-shell-mode")) === "standalone",
      "standalone shell mode did not render",
    );
    assertCondition(await standalonePage.getByTestId("standalone-shell-header").isVisible(), "standalone header missing");
    assertCondition(await standalonePage.getByTestId("standalone-shell-footer").isVisible(), "standalone footer missing");
    const standaloneRouteTitle = await standalonePage.locator("#embedded-route-content-title").textContent();
    await assertNoHorizontalOverflow(standalonePage, "standalone shell");
    await standaloneContext.close();

    const embeddedContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    await embeddedContext.tracing.start({ screenshots: true, snapshots: true });
    const embeddedPage = await embeddedContext.newPage();
    await openShellRoute(embeddedPage, embeddedShellUrl(server.baseUrl));
    const embeddedRoot = embeddedPage.getByTestId("EmbeddedPatientShellRoot");
    assertCondition(
      (await embeddedRoot.getAttribute("data-shell-mode")) === "embedded",
      "embedded shell mode did not render",
    );
    assertCondition(
      (await embeddedRoot.getAttribute("data-visual-mode")) === "NHSApp_Embedded_Patient_Shell",
      "embedded visual mode missing",
    );
    assertCondition((await embeddedPage.getByTestId("standalone-shell-header").count()) === 0, "standalone header leaked");
    assertCondition((await embeddedPage.getByTestId("standalone-shell-footer").count()) === 0, "standalone footer leaked");
    assertCondition((await embeddedPage.getByTestId("patient-shell-masthead").count()) === 0, "patient masthead leaked");
    assertCondition((await embeddedPage.getByTestId("patient-shell-footer").count()) === 0, "patient footer leaked");
    assertCondition(
      (await embeddedPage.locator("#embedded-route-content-title").textContent()) === standaloneRouteTitle,
      "standalone and embedded route content diverged",
    );

    const continuityKey = await embeddedRoot.getAttribute("data-continuity-key");
    const anchor = await embeddedRoot.getAttribute("data-anchor-id");
    await embeddedPage.reload({ waitUntil: "load" });
    await embeddedPage.getByTestId("EmbeddedPatientShellRoot").waitFor();
    assertCondition(
      (await embeddedRoot.getAttribute("data-continuity-key")) === continuityKey,
      "refresh changed continuity key",
    );
    assertCondition((await embeddedRoot.getAttribute("data-anchor-id")) === anchor, "refresh changed anchor");
    assertCondition(
      (await embeddedPage.getByTestId("EmbeddedContinuityBanner").getAttribute("data-continuity-restored")) ===
        "true",
      "refresh did not restore continuity envelope",
    );

    await embeddedPage.getByRole("button", { name: /Message thread/ }).click();
    assertCondition(
      (await embeddedRoot.getAttribute("data-shell-mode")) === "embedded",
      "route transition remounted outside embedded shell",
    );
    assertCondition(
      (await embeddedRoot.getAttribute("data-route-family")) === "patient_message_thread",
      "route transition did not preserve route tree navigation",
    );

    await embeddedPage.getByTestId("EmbeddedBackOverride").click();
    await embeddedPage.waitForFunction(() =>
      document
        .querySelector("[data-testid='EmbeddedPatientShellRoot']")
        ?.getAttribute("data-route-family") === "request_status",
    );
    assertCondition(
      (await embeddedRoot.getAttribute("data-route-family")) === "request_status",
      "back override did not return to prior route family",
    );
    await assertNoHorizontalOverflow(embeddedPage, "embedded shell continuity");
    await embeddedContext.tracing.stop({ path: outputPath("387-refresh-recovery-trace.zip") });
    await embeddedContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
