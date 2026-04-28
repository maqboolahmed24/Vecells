import path from "node:path";

import {
  assertCondition,
  importPlaywright,
  loginToPartnerPortal,
  outputPath,
  startPartnerPortalHarness,
  stopPartnerPortalHarness,
  trackExternalRequests,
} from "./336_partner_portal.helpers.ts";

export const partnerPortalCapacitySetupCoverage = [
  "local supplier portal twins converge to the manifest binding hash instead of layering drift",
  "supported-test supplier feeds stay explicit as manual bridges",
  "unsupported partner feeds stay explicit unsupported rows",
  "only masked credential evidence renders in the portal harness",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startPartnerPortalHarness(
    path.join(process.cwd(), "output", "playwright", "336-partner-capacity-portal-state"),
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToPartnerPortal(page, baseUrl);

    const optumLocal = page.getByTestId("feed-row-feed_336_optum_local_twin");
    const tppLocal = page.getByTestId("feed-row-feed_336_tpp_local_twin");
    const optumSupported = page.getByTestId("feed-row-feed_336_optum_supported_test");
    const unsupported = page.getByTestId("feed-row-feed_336_legacy_shadow_unsupported");

    assertCondition(
      (await optumLocal.getAttribute("data-configured-state")) === "unconfigured",
      "optum local twin should start unconfigured",
    );
    await page.getByTestId("feed-bootstrap-feed_336_optum_local_twin").click();
    await page.waitForURL(/\/portal\/feeds$/);
    assertCondition(
      (await optumLocal.getAttribute("data-configured-state")) === "current",
      "optum local twin should converge to current",
    );

    await page.getByTestId("feed-bootstrap-feed_336_tpp_local_twin").click();
    await page.waitForURL(/\/portal\/feeds$/);
    assertCondition(
      (await tppLocal.getAttribute("data-configured-state")) === "current",
      "tpp local twin should converge to current",
    );
    assertCondition(
      await page.getByTestId("manual-bridge-feed_336_optum_supported_test").isVisible(),
      "supported-test feed should expose a manual bridge banner",
    );
    assertCondition(
      (await optumSupported.getAttribute("data-configured-state")) === "manual_bridge_required",
      "supported-test feed must stay manual bridge",
    );
    assertCondition(
      await page.getByTestId("unsupported-feed_336_legacy_shadow_unsupported").isVisible(),
      "unsupported feed should stay explicit",
    );
    assertCondition(
      (await unsupported.getAttribute("data-configured-state")) === "unsupported",
      "unsupported feed must stay explicit unsupported",
    );
    assertCondition(
      (await page.getByTestId("feed-secret-fingerprint-feed_336_optum_local_twin").innerText()).includes(
        "sha256:",
      ),
      "portal should expose only masked credential fingerprints",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "portal page must not render raw secret references",
    );
    assertCondition(
      externalRequests.size === 0,
      `partner portal should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("336-partner-capacity-setup.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("336-partner-capacity-setup-trace.zip"),
    });
    await context.close();
  } finally {
    await browser.close();
    await stopPartnerPortalHarness(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
