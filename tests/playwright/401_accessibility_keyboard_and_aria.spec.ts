import {
  assertCondition,
  assertFocusedElementNotObscured,
  embeddedA11yRouteFamilies,
  importPlaywright,
  openEmbeddedA11yRoute,
  outputPath,
  runEmbeddedA11yEquivalentAssertions,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./394_embedded_accessibility.helpers.ts";

async function assertHeadingPresence(page: any, label: string): Promise<void> {
  const headingCount = await page.locator("main h1").count();
  assertCondition(headingCount >= 1, `${label} missing primary heading`);
  const emptyHeadings = await page.evaluate(() =>
    Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map((heading) => heading.textContent?.trim() ?? "")
      .filter((text) => text.length === 0),
  );
  assertCondition(emptyHeadings.length === 0, `${label} has empty headings`);
}

async function assertKeyboardTraversal(page: any, label: string): Promise<void> {
  await page.getByTestId("EmbeddedFocusGuard").focus();
  const enabledControls = page.locator(
    ".embedded-a11y main button:not([disabled]), .embedded-a11y main a[href], .embedded-a11y main input:not([disabled]), .embedded-a11y main select:not([disabled]), .embedded-a11y main textarea:not([disabled])",
  );
  const enabledControlCount = await enabledControls.count();
  const firstEnabledControl = enabledControls.first();
  if (enabledControlCount > 0) {
    await firstEnabledControl.focus();
    await assertFocusedElementNotObscured(page, label);
  }
  for (let index = 0; index < Math.min(1, Math.max(0, enabledControlCount - 1)); index += 1) {
    await page.keyboard.press("Tab");
  }
  const focusState = await page.evaluate(() => {
    const active = document.activeElement;
    const layer = document.querySelector("[data-testid='EmbeddedAccessibilityResponsiveLayer']");
    return {
      activeTag: active?.tagName ?? null,
      activeText: active?.textContent?.trim().slice(0, 80) ?? "",
      insideLayer: Boolean(active && layer?.contains(active)),
      activeIsBody: active === document.body,
    };
  });
  assertCondition(!focusState.activeIsBody, `${label} keyboard traversal fell back to body focus`);
  assertCondition(focusState.insideLayer, `${label} keyboard traversal left embedded layer`);
  await assertFocusedElementNotObscured(page, label);
  await page.keyboard.press("Escape");
  assertCondition(
    (await page.getByTestId("AssistiveAnnouncementDedupeBus").getAttribute("aria-live")) ===
      "polite",
    `${label} live region changed urgency after Escape`,
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
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    for (const family of embeddedA11yRouteFamilies) {
      await openEmbeddedA11yRoute(page, server.baseUrl, family);
      await page.evaluate(() => window.scrollTo(0, 0));
      await runEmbeddedA11yEquivalentAssertions(page, `401 ${family}`);
      await assertHeadingPresence(page, `401 ${family}`);
      await assertKeyboardTraversal(page, `401 ${family}`);
      await writeAriaSnapshot(
        page.getByTestId("EmbeddedAccessibilityResponsiveLayer"),
        `401-${family}-route-root.aria.yml`,
      );
    }

    await openEmbeddedA11yRoute(page, server.baseUrl, "booking");
    await writeAriaSnapshot(page.getByTestId("EmbeddedBookingFrame"), "401-calm-booking.aria.yml");

    await page.goto(
      `${server.baseUrl}/nhs-app/recovery/DGD-401/degraded-mode?fixture=degraded-mode`,
      {
        waitUntil: "load",
      },
    );
    await page.getByTestId("EmbeddedRecoveryArtifactFrame").waitFor();
    await page.getByTestId("EmbeddedAccessibilityResponsiveLayer").waitFor();
    await writeAriaSnapshot(
      page.getByTestId("EmbeddedRecoveryArtifactFrame"),
      "401-degraded-recovery.aria.yml",
    );

    await page.goto(
      `${server.baseUrl}/nhs-app/recovery/FRZ-401/route-freeze?fixture=route-freeze`,
      {
        waitUntil: "load",
      },
    );
    await page.getByTestId("EmbeddedRouteFreezeNotice").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedRouteFreezeNotice")
        .getAttribute("data-route-freeze-state")) === "frozen",
      "401 frozen recovery route did not expose route-freeze state",
    );
    await writeAriaSnapshot(
      page.getByTestId("EmbeddedRecoveryArtifactFrame"),
      "401-frozen-recovery.aria.yml",
    );
  } finally {
    await context.tracing.stop({ path: outputPath("401-accessibility-keyboard-aria-trace.zip") });
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
