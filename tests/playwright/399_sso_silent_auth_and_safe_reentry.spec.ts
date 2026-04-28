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
  type EntryParam,
  type EntryRouteFamily,
} from "./388_embedded_entry.helpers.ts";

const RECOVERY_CASES: readonly {
  readonly label: string;
  readonly entry?: EntryParam;
  readonly route: EntryRouteFamily;
  readonly title: string;
  readonly disposition: string;
  readonly consentDeclineReturn?: boolean;
}[] = [
  {
    label: "consent denial",
    route: "request_status",
    title: "You chose not to use your NHS login",
    disposition: "consent_declined",
    consentDeclineReturn: true,
  },
  {
    label: "expired session",
    entry: "expired",
    route: "request_status",
    title: "Your session has ended",
    disposition: "session_expired",
  },
  {
    label: "safe re-entry",
    entry: "safe_reentry",
    route: "record_letter_summary",
    title: "Please go back to the NHS App and try again",
    disposition: "host_retry",
  },
  {
    label: "silent failure",
    entry: "failure",
    route: "request_status",
    title: "We could not sign you in here",
    disposition: "silent_failure",
  },
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const successContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      locale: "en-GB",
    });
    await successContext.tracing.start({ screenshots: true, snapshots: true });
    const successConsole: string[] = [];
    const successPage = await successContext.newPage();
    successPage.on("console", (message: any) => successConsole.push(message.text()));
    await openEntryRoute(
      successPage,
      entryUrl(server.baseUrl, {
        entry: "reauth_success",
        route: "patient_message_thread",
        rawHandoff: true,
      }),
    );
    await successPage.getByRole("heading", { name: "You are still signed in" }).waitFor();
    await successPage.getByRole("button", { name: "Return to this journey" }).click();
    await successPage.getByTestId("EmbeddedPatientShellRoot").waitFor();
    assertCondition(
      (await successPage
        .getByTestId("EmbeddedPatientShellRoot")
        .getAttribute("data-route-family")) === "patient_message_thread",
      "silent re-auth did not preserve message-thread route intent",
    );
    await assertNoRawPlumbing(successPage, "399 silent re-auth", successConsole, {
      allowInheritedShellStateText: true,
    });
    await successContext.tracing.stop({ path: outputPath("399-sso-silent-success-trace.zip") });
    await successContext.close();

    const recoveryContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await recoveryContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await recoveryContext.newPage();
    const consoleMessages: string[] = [];
    page.on("console", (message: any) => consoleMessages.push(message.text()));
    for (const branch of RECOVERY_CASES) {
      await openEntryRoute(
        page,
        entryUrl(server.baseUrl, {
          entry: branch.entry,
          route: branch.route,
          rawHandoff: true,
          consentDeclineReturn: branch.consentDeclineReturn,
        }),
      );
      const root = page.getByTestId("EmbeddedEntryCorridorRoot");
      assertCondition(
        (await root.getAttribute("data-return-disposition")) === branch.disposition,
        `${branch.label} disposition mismatch`,
      );
      assertCondition(
        await page.getByRole("heading", { name: branch.title }).isVisible(),
        `${branch.label} title missing`,
      );
      assertCondition(
        (await page.getByTestId("EmbeddedEntryStatusCard").getAttribute("role")) === "alert",
        `${branch.label} did not use alert semantics`,
      );
      assertCondition(
        (await page.getByTestId("EmbeddedPatientShellRoot").count()) === 0,
        `${branch.label} should not unlock shell`,
      );
      await assertNoRawPlumbing(page, `399 ${branch.label}`, consoleMessages, {
        allowInheritedShellStateText: true,
      });
      await assertNoHorizontalOverflow(page, `399 ${branch.label}`);
    }
    await recoveryContext.tracing.stop({ path: outputPath("399-sso-safe-reentry-trace.zip") });
    await recoveryContext.close();
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
