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

export const partnerFeedVerificationCoverage = [
  "verification rebuilds the 318 candidate snapshot from the manifest-driven bindings",
  "trusted, degraded, quarantined, manual-bridge, and unsupported postures stay explicit",
  "supplier portal rows never overclaim beyond their current trust posture",
  "verification evidence remains local and secret-safe",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startPartnerPortalHarness(
    path.join(process.cwd(), "output", "playwright", "336-partner-verification-portal-state"),
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToPartnerPortal(page, baseUrl);
    await page.getByTestId("feed-bootstrap-feed_336_optum_local_twin").click();
    await page.waitForURL(/\/portal\/feeds$/);
    await page.getByTestId("feed-bootstrap-feed_336_tpp_local_twin").click();
    await page.waitForURL(/\/portal\/feeds$/);

    await page.getByTestId("portal-nav-verification").click();
    await page.waitForURL(/\/portal\/verification$/);
    await page.getByTestId("verification-run-all").click();
    await page.waitForURL(/\/portal\/verification$/);

    const gpConnect = page.getByTestId("verification-row-feed_336_gp_connect_local_twin");
    const optum = page.getByTestId("verification-row-feed_336_optum_local_twin");
    const tpp = page.getByTestId("verification-row-feed_336_tpp_local_twin");
    const batch = page.getByTestId("verification-row-feed_336_batch_import_local_twin");
    const supported = page.getByTestId("verification-row-feed_336_optum_supported_test");
    const unsupported = page.getByTestId("verification-row-feed_336_legacy_shadow_unsupported");

    assertCondition(
      (await gpConnect.getAttribute("data-verification-state")) === "verified",
      "gp connect local row should verify",
    );
    assertCondition(
      (await page
        .getByTestId("verification-decisions-feed_336_gp_connect_local_twin")
        .innerText()).includes("trusted_admitted"),
      "gp connect local row should stay trusted admitted",
    );
    assertCondition(
      (await optum.getAttribute("data-verification-state")) === "verified",
      "optum local row should verify",
    );
    assertCondition(
      (await page
        .getByTestId("verification-decisions-feed_336_optum_local_twin")
        .innerText()).includes("binding_hash_current"),
      "optum local row should keep the binding-hash proof",
    );
    assertCondition(
      (await tpp.getAttribute("data-verification-state")) === "verified",
      "tpp local row should verify",
    );
    assertCondition(
      /degraded_/.test(
        await page.getByTestId("verification-decisions-feed_336_tpp_local_twin").innerText(),
      ),
      "tpp local row should stay explicitly degraded",
    );
    assertCondition(
      (await page
        .getByTestId("verification-decisions-feed_336_batch_import_local_twin")
        .innerText()).includes("quarantined_excluded"),
      "batch import row should stay explicitly quarantined",
    );
    assertCondition(
      (await supported.getAttribute("data-verification-state")) === "manual_bridge_required",
      "supported-test row should remain manual bridge",
    );
    assertCondition(
      (await page
        .getByTestId("verification-decisions-feed_336_optum_supported_test")
        .innerText()).includes("manual_bridge_required"),
      "supported-test row should keep manual-bridge decision classes",
    );
    assertCondition(
      (await unsupported.getAttribute("data-verification-state")) === "unsupported",
      "unsupported row should remain unsupported",
    );
    assertCondition(
      (await page
        .getByTestId("verification-decisions-feed_336_legacy_shadow_unsupported")
        .innerText()).includes("unsupported_feed_declared"),
      "unsupported row should keep unsupported decision classes",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "verification page must not render raw secret references",
    );
    assertCondition(
      externalRequests.size === 0,
      `verification portal should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("336-partner-feed-verification.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("336-partner-feed-verification-trace.zip"),
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
