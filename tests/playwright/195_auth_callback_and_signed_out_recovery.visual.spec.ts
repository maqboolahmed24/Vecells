import {
  assertCondition,
  assertNoOverflow,
  closeServer,
  expected195,
  openApp,
  openAtlas,
  screenshot,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  withBrowser,
} from "./195_auth_callback_and_signed_out_recovery.shared";
import type { Browser } from "playwright";

async function runVisualChecks(browser: Browser): Promise<void> {
  const expected = expected195();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();

  try {
    const atlas = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openAtlas(atlas, staticServer.url);
    await assertNoOverflow(atlas);
    await screenshot(atlas, "output/playwright/195-auth-callback-atlas-desktop.png");
    await atlas.close();

    const app = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openApp(app, patientWeb.baseUrl, "/auth/sign-in");
    await assertNoOverflow(app);
    const nhsBackground = await app
      .locator("[data-testid='nhs-login-button-standard']")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    assertCondition(
      nhsBackground === "rgb(0, 94, 184)",
      `NHS login button was recolored: ${nhsBackground}`,
    );
    await screenshot(app, "output/playwright/195-auth-callback-route-sign-in.png");

    await openApp(app, patientWeb.baseUrl, "/auth/recovery/safe-re-entry");
    await assertNoOverflow(app);
    await screenshot(app, "output/playwright/195-auth-callback-route-safe-re-entry.png");
    await app.close();

    const reduced = await browser.newPage({
      viewport: { width: 834, height: 1194 },
      reducedMotion: "reduce",
    });
    await openApp(reduced, patientWeb.baseUrl, "/auth/callback");
    const duration = await reduced
      .locator(".auth-callback-recovery__rail button")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `Reduced motion did not collapse transition duration: ${duration}`,
    );
    await screenshot(reduced, "output/playwright/195-auth-callback-route-reduced-motion.png");
    await reduced.close();

    for (const artifact of expected.manifest.expectedArtifacts) {
      assertCondition(
        artifact.startsWith("output/playwright/195-auth-callback"),
        `Unexpected visual artifact path ${artifact}`,
      );
    }
  } finally {
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected195();
  if (!process.argv.includes("--run")) {
    console.log("195_auth_callback_and_signed_out_recovery.visual.spec.ts: syntax ok");
    return;
  }
  await withBrowser(runVisualChecks);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
