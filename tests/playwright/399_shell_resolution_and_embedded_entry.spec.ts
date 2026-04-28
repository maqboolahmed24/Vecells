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
  writeAriaSnapshot,
} from "./388_embedded_entry.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const consoleMessages: string[] = [];
  const page = await context.newPage();
  page.on("console", (message: any) => consoleMessages.push(message.text()));

  try {
    await openEntryRoute(
      page,
      entryUrl(server.baseUrl, {
        entry: "landing",
        route: "request_status",
        rawHandoff: true,
      }),
    );
    const root = page.getByTestId("EmbeddedEntryCorridorRoot");
    assertCondition(
      (await root.getAttribute("data-sensitive-url-redacted")) === "true",
      "raw entry query was not redacted",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedPatientShellRoot").count()) === 0,
      "spoofed entry query unlocked shell before SSO",
    );
    await writeAriaSnapshot(
      page.getByTestId("EmbeddedEntryStatusCard"),
      "399-shell-resolution-entry.aria.yml",
    );
    await assertNoRawPlumbing(page, "399 landing", consoleMessages, {
      allowInheritedShellStateText: true,
    });

    await openEntryRoute(
      page,
      entryUrl(server.baseUrl, {
        entry: "success",
        route: "request_status",
        rawHandoff: true,
      }),
    );
    await page.getByRole("button", { name: "Continue to request status" }).click();
    await page.getByTestId("EmbeddedPatientShellRoot").waitFor();
    const shellRoot = page.getByTestId("EmbeddedPatientShellRoot");
    assertCondition(
      (await shellRoot.getAttribute("data-shell-mode")) === "embedded",
      "shell did not stay embedded",
    );
    assertCondition(
      (await shellRoot.getAttribute("data-route-family")) === "request_status",
      "route intent was not preserved",
    );
    assertCondition(
      (await page.getByTestId("standalone-shell-header").count()) === 0 &&
        (await page.getByTestId("standalone-shell-footer").count()) === 0,
      "embedded mode rendered standalone supplier chrome",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedShellHeaderFrame").count()) === 1,
      "embedded shell header frame missing",
    );
    await assertNoRawPlumbing(page, "399 shell handoff", consoleMessages, {
      allowInheritedShellStateText: true,
    });
    await assertNoHorizontalOverflow(page, "399 shell resolution");

    await openEntryRoute(
      page,
      entryUrl(server.baseUrl, {
        entry: "wrong_context",
        route: "appointment_manage",
        rawHandoff: true,
      }),
    );
    assertCondition(
      (await page.getByTestId("EmbeddedEntryStatusCard").getAttribute("role")) === "alert",
      "wrong context did not render alert recovery",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedPatientShellRoot").count()) === 0,
      "wrong context unlocked embedded shell",
    );
    await assertNoRawPlumbing(page, "399 wrong context", consoleMessages, {
      allowInheritedShellStateText: true,
    });
    await context.tracing.stop({ path: outputPath("399-shell-resolution-entry-trace.zip") });
  } finally {
    await context.close();
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
