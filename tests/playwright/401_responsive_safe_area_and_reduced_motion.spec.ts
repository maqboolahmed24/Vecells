import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedA11yRouteFamilies,
  importPlaywright,
  openEmbeddedA11yRoute,
  outputPath,
  runEmbeddedA11yEquivalentAssertions,
  startPatientWeb,
  stopPatientWeb,
} from "./394_embedded_accessibility.helpers.ts";

const responsiveMatrix = [
  { family: "entry_corridor", width: 390, height: 844, label: "nhs app phone" },
  { family: "start_request", width: 320, height: 720, label: "400 percent reflow equivalent" },
  { family: "request_status", width: 640, height: 900, label: "200 percent reflow equivalent" },
  { family: "booking", width: 390, height: 844, label: "booking phone" },
  { family: "pharmacy", width: 768, height: 1024, label: "tablet" },
  { family: "recovery_artifact", width: 320, height: 720, label: "recovery reflow" },
  { family: "embedded_shell", width: 1280, height: 900, label: "desktop shell parity" },
] as const;

async function assertSafeAreaAndReducedMotion(page: any, label: string): Promise<void> {
  const layer = page.getByTestId("EmbeddedAccessibilityResponsiveLayer");
  assertCondition(
    (await page.getByTestId("EmbeddedSafeAreaObserver").count()) === 1,
    `${label} missing safe-area observer`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedReducedMotionAdapter").getAttribute("data-reduced-motion")) ===
      "reduce",
    `${label} did not honor reduced motion`,
  );
  const contracts =
    (await page
      .getByTestId("EmbeddedA11yCoverageReporter")
      .getAttribute("data-covered-contracts")) ?? "";
  for (const contract of [
    "EmbeddedSafeAreaObserver",
    "HostResizeResilienceLayer",
    "EmbeddedReducedMotionAdapter",
    "StickyActionObscurationGuard",
  ]) {
    assertCondition(contracts.includes(contract), `${label} missing ${contract}`);
  }
  assertCondition(
    (await layer.getAttribute("data-safe-area-observer")) === "ready",
    `${label} safe-area observer did not mark layer ready`,
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
    reducedMotion: "reduce",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });

  try {
    for (const family of embeddedA11yRouteFamilies) {
      await page.setViewportSize({ width: 390, height: 844 });
      await openEmbeddedA11yRoute(page, server.baseUrl, family);
      await runEmbeddedA11yEquivalentAssertions(page, `401 full matrix ${family}`);
      await assertSafeAreaAndReducedMotion(page, `401 full matrix ${family}`);
    }

    for (const entry of responsiveMatrix) {
      await page.setViewportSize({ width: entry.width, height: entry.height });
      await openEmbeddedA11yRoute(page, server.baseUrl, entry.family);
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-testid='HostResizeResilienceLayer']")
            ?.getAttribute("data-host-resize-state") === "settled",
      );
      await runEmbeddedA11yEquivalentAssertions(page, `401 ${entry.label} ${entry.family}`);
      await assertSafeAreaAndReducedMotion(page, `401 ${entry.label} ${entry.family}`);
      await assertNoHorizontalOverflow(page, `401 ${entry.label} ${entry.family}`);
    }
  } finally {
    await context.tracing.stop({
      path: outputPath("401-responsive-safe-area-reduced-motion-trace.zip"),
    });
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
