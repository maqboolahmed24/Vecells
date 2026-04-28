import {
  assertCondition,
  assertNoHorizontalOverflow,
  assertNoRawPlumbing,
  entryUrl,
  importPlaywright,
  openEntryRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./388_embedded_entry.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const cleanContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    await cleanContext.tracing.start({ screenshots: true, snapshots: true });
    const cleanConsole: string[] = [];
    const cleanPage = await cleanContext.newPage();
    cleanPage.on("console", (message: any) => cleanConsole.push(message.text()));
    await openEntryRoute(
      cleanPage,
      entryUrl(server.baseUrl, {
        entry: "landing",
        route: "request_status",
        rawHandoff: true,
      }),
    );
    const cleanRoot = cleanPage.getByTestId("EmbeddedEntryCorridorRoot");
    assertCondition(
      (await cleanRoot.getAttribute("data-sensitive-url-redacted")) === "true",
      "clean entry did not record URL redaction",
    );
    assertCondition(
      (await cleanRoot.getAttribute("data-visual-mode")) === "NHSApp_Embedded_Entry_Corridor",
      "entry corridor visual mode missing",
    );
    await assertNoRawPlumbing(cleanPage, "clean entry", cleanConsole);
    await cleanPage.getByRole("button", { name: "Continue with NHS login" }).click();
    await cleanPage.getByRole("heading", { name: "Confirming your details" }).waitFor();
    await assertNoRawPlumbing(cleanPage, "confirming after clean entry", cleanConsole);
    await assertNoHorizontalOverflow(cleanPage, "clean entry corridor");
    await cleanContext.tracing.stop({ path: outputPath("388-clean-entry-trace.zip") });
    await cleanContext.close();

    const successContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await successContext.tracing.start({ screenshots: true, snapshots: true });
    const successConsole: string[] = [];
    const successPage = await successContext.newPage();
    successPage.on("console", (message: any) => successConsole.push(message.text()));
    await openEntryRoute(
      successPage,
      entryUrl(server.baseUrl, {
        entry: "success",
        route: "request_status",
        rawHandoff: true,
      }),
    );
    await assertNoRawPlumbing(successPage, "success entry before handoff", successConsole);
    await successPage.getByRole("button", { name: "Continue to request status" }).click();
    await successPage.getByTestId("EmbeddedPatientShellRoot").waitFor();
    const shellRoot = successPage.getByTestId("EmbeddedPatientShellRoot");
    assertCondition(
      (await shellRoot.getAttribute("data-route-family")) === "request_status",
      "successful handoff did not preserve request status route family",
    );
    assertCondition(
      (await shellRoot.getAttribute("data-shell-mode")) === "embedded",
      "successful handoff did not open embedded shell",
    );
    await assertNoRawPlumbing(successPage, "success shell handoff", successConsole, {
      allowInheritedShellStateText: true,
    });
    await successContext.tracing.stop({ path: outputPath("388-successful-shell-handoff-trace.zip") });
    await successContext.close();

    const reauthContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
    await reauthContext.tracing.start({ screenshots: true, snapshots: true });
    const reauthConsole: string[] = [];
    const reauthPage = await reauthContext.newPage();
    reauthPage.on("console", (message: any) => reauthConsole.push(message.text()));
    await openEntryRoute(
      reauthPage,
      entryUrl(server.baseUrl, {
        entry: "reauth_success",
        route: "patient_message_thread",
        rawHandoff: true,
      }),
    );
    assertCondition(
      await reauthPage.getByRole("heading", { name: "You are still signed in" }).isVisible(),
      "silent re-auth success heading missing",
    );
    await reauthPage.getByRole("button", { name: "Return to this journey" }).click();
    await reauthPage.getByTestId("EmbeddedPatientShellRoot").waitFor();
    assertCondition(
      (await reauthPage.getByTestId("EmbeddedPatientShellRoot").getAttribute("data-route-family")) ===
        "patient_message_thread",
      "silent re-auth handoff did not preserve message thread route family",
    );
    await assertNoRawPlumbing(reauthPage, "silent re-auth shell handoff", reauthConsole, {
      allowInheritedShellStateText: true,
    });
    await reauthContext.tracing.stop({
      path: outputPath("388-silent-reauth-shell-handoff-trace.zip"),
    });
    await reauthContext.close();
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
