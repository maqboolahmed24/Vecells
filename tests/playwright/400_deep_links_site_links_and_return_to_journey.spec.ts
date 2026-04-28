import { assertCondition, importPlaywright, outputPath } from "./381_nhs_app_bridge.helpers.ts";
import {
  createDefaultPhase7ExternalEntryApplication,
  type ExternalEntrySessionSnapshot,
} from "../../services/command-api/src/phase7-external-entry-service.ts";

function activeSession(): ExternalEntrySessionSnapshot {
  return {
    sessionRef: "Session:400-playwright",
    subjectRef: "Subject:patient-400",
    sessionEpochRef: "SessionEpoch:400",
    subjectBindingVersionRef: "SubjectBindingVersion:patient-400:v1",
    assuranceLevel: "nhs_p9",
    sessionState: "active",
    embeddedSessionRef: "EmbeddedSession:400",
  };
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const application = createDefaultPhase7ExternalEntryApplication();
  const session = activeSession();
  const manifest = application.getSiteLinkManifest({ environment: "sandpit" });
  const android = application.exportAndroidAssetLinks({ environment: "sandpit" });
  const ios = application.exportIosAssociation({ environment: "sandpit" });
  const issuance = await application.issueExternalEntryGrant({
    environment: "sandpit",
    entryMode: "nhs_app_site_link",
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-400/pharmacy/status?from=nhsApp",
    governingObjectRef: "Request:REQ-400",
    governingObjectVersionRef: "RequestVersion:REQ-400:v1",
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    lineageFenceRef: "LineageFence:REQ-400",
    subjectRef: session.subjectRef,
    issueIdempotencyKey: "issue-400-playwright-status",
    opaqueToken: "external-entry-token-400-playwright-status",
  });
  const commonResolution = {
    environment: "sandpit" as const,
    entryMode: "nhs_app_site_link" as const,
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-400/pharmacy/status?from=nhsApp",
    presentedToken: issuance.materializedToken,
    governingObjectRef: "Request:REQ-400",
    governingObjectVersionRef: "RequestVersion:REQ-400:v1",
    lineageFenceRef: "LineageFence:REQ-400",
    currentSession: session,
  };
  const resolved = await application.resolveExternalEntry({
    ...commonResolution,
    redemptionIdempotencyKey: "redeem-400-playwright-first",
  });
  const replay = await application.resolveExternalEntry({
    ...commonResolution,
    redemptionIdempotencyKey: "redeem-400-playwright-replay",
  });
  const noToken = await application.resolveExternalEntry({
    ...commonResolution,
    presentedToken: null,
    redemptionIdempotencyKey: "redeem-400-playwright-no-token",
  });

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Mobile Safari/537.36 nhsapp-android/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await page.setContent(
      `
        <main data-testid="SiteLinkProofRoot" data-manifest="${escapeHtml(manifest.manifestVersionRef)}">
          <section data-testid="AndroidAssociation" data-path="${android.wellKnownPath}" data-package="${android.body[0]?.target.package_name}">
            <pre>${escapeHtml(JSON.stringify(android.body, null, 2))}</pre>
          </section>
          <section data-testid="IosAssociation" data-path="${ios.wellKnownPath}" data-app-id="${ios.body.applinks.details[0]?.appID}">
            <pre>${escapeHtml(JSON.stringify(ios.body, null, 2))}</pre>
          </section>
          <section data-testid="ConfiguredEmailLink" data-open-mode="${manifest.allowedPathPatterns.includes("/requests/*") ? "in_app" : "browser"}">
            /requests/REQ-400/pharmacy/status
          </section>
          <section data-testid="UnconfiguredSmsLink" data-open-mode="${manifest.allowedPathPatterns.includes("/admin/*") ? "in_app" : "browser"}">
            /admin/raw-staff-link
          </section>
          <section data-testid="FirstUseResolution" data-outcome="${resolved.outcome}" data-phi="${String(resolved.routeInstruction.includePhi)}">
            ${escapeHtml(resolved.routeInstruction.targetRoute)}
          </section>
          <section data-testid="ReplayResolution" data-outcome="${replay.outcome}" data-fence="${replay.grantFenceState}" data-phi="${String(replay.routeInstruction.includePhi)}">
            ${escapeHtml(replay.routeInstruction.targetRoute)}
          </section>
          <section data-testid="NoTokenResolution" data-outcome="${noToken.outcome}" data-decision="${noToken.sessionRecoveryDecision}">
            ${escapeHtml(noToken.routeInstruction.targetRoute)}
          </section>
        </main>
      `,
      { waitUntil: "domcontentloaded" },
    );
    await page.getByTestId("SiteLinkProofRoot").waitFor();
    assertCondition(
      (await page.getByTestId("AndroidAssociation").getAttribute("data-package")) ===
        "uk.nhs.nhsapp.sandpit",
      "Android association package drifted",
    );
    assertCondition(
      (await page.getByTestId("IosAssociation").getAttribute("data-app-id")) ===
        "ABCDE12345.uk.nhs.nhsapp.sandpit",
      "iOS association appID drifted",
    );
    assertCondition(
      (await page.getByTestId("ConfiguredEmailLink").getAttribute("data-open-mode")) === "in_app",
      "configured email link should open in app",
    );
    assertCondition(
      (await page.getByTestId("UnconfiguredSmsLink").getAttribute("data-open-mode")) === "browser",
      "unconfigured SMS link should remain browser fallback",
    );
    assertCondition(
      (await page.getByTestId("FirstUseResolution").getAttribute("data-outcome")) ===
        "resolved_full",
      "first-use link did not resolve",
    );
    assertCondition(
      (await page.getByTestId("ReplayResolution").getAttribute("data-fence")) === "replayed",
      "replayed link was not fenced",
    );
    assertCondition(
      (await page.getByTestId("ReplayResolution").getAttribute("data-phi")) === "false",
      "replayed link exposed PHI",
    );
    assertCondition(
      (await page.getByTestId("NoTokenResolution").getAttribute("data-outcome")) ===
        "verification_required",
      "missing token should require verification",
    );
    await page.screenshot({
      path: outputPath("400-deep-links-site-links.png"),
      fullPage: true,
      animations: "disabled",
    });
    await context.tracing.stop({ path: outputPath("400-deep-links-site-links-trace.zip") });
  } finally {
    await context.close();
    await browser.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
