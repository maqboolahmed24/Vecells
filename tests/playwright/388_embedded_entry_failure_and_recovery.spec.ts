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

const RECOVERY_BRANCHES: readonly {
  readonly label: string;
  readonly entry?: EntryParam;
  readonly route: EntryRouteFamily;
  readonly expectedTitle: string;
  readonly expectedDisposition: string;
  readonly traceName: string;
  readonly consentDeclineReturn?: boolean;
}[] = [
  {
    label: "consent denial",
    route: "request_status",
    expectedTitle: "You chose not to use your NHS login",
    expectedDisposition: "consent_declined",
    traceName: "388-consent-denied-trace.zip",
    consentDeclineReturn: true,
  },
  {
    label: "session expiry",
    entry: "expired",
    route: "request_status",
    expectedTitle: "Your session has ended",
    expectedDisposition: "session_expired",
    traceName: "388-expired-session-trace.zip",
  },
  {
    label: "wrong context",
    entry: "wrong_context",
    route: "appointment_manage",
    expectedTitle: "We could not sign you in here",
    expectedDisposition: "wrong_context",
    traceName: "388-wrong-context-trace.zip",
  },
  {
    label: "safe re-entry",
    entry: "safe_reentry",
    route: "record_letter_summary",
    expectedTitle: "Please go back to the NHS App and try again",
    expectedDisposition: "host_retry",
    traceName: "388-safe-reentry-trace.zip",
  },
  {
    label: "silent failure",
    entry: "failure",
    route: "request_status",
    expectedTitle: "We could not sign you in here",
    expectedDisposition: "silent_failure",
    traceName: "388-silent-failure-trace.zip",
  },
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    for (const branch of RECOVERY_BRANCHES) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        locale: "en-GB",
        timezoneId: "Europe/London",
      });
      await context.tracing.start({ screenshots: true, snapshots: true });
      const page = await context.newPage();
      const consoleMessages: string[] = [];
      page.on("console", (message: any) => consoleMessages.push(message.text()));
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
        (await root.getAttribute("data-return-disposition")) === branch.expectedDisposition,
        `${branch.label} disposition mismatch`,
      );
      assertCondition(
        (await root.getAttribute("data-sensitive-url-redacted")) === "true",
        `${branch.label} did not record URL redaction`,
      );
      assertCondition(
        await page.getByRole("heading", { name: branch.expectedTitle }).isVisible(),
        `${branch.label} title missing`,
      );
      assertCondition(
        (await page.getByTestId("EmbeddedEntryStatusCard").getAttribute("role")) === "alert",
        `${branch.label} should use alert semantics`,
      );
      assertCondition(
        (await page.getByTestId("EmbeddedPatientShellRoot").count()) === 0,
        `${branch.label} should not reveal embedded shell`,
      );
      assertCondition(
        (await page.getByTestId("EmbeddedEntryActionCluster").locator("button").count()) >= 1,
        `${branch.label} action cluster missing`,
      );
      await assertNoRawPlumbing(page, branch.label, consoleMessages);
      await assertNoHorizontalOverflow(page, branch.label);
      await context.tracing.stop({ path: outputPath(branch.traceName) });
      await context.close();
    }
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

