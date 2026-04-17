import {
  assertCondition,
  assertNoOverflow,
  closeServer,
  expected195,
  openApp,
  openAtlas,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  withBrowser,
} from "./195_auth_callback_and_signed_out_recovery.shared";
import type { Browser, Page } from "playwright";

async function assertAtlasShell(
  page: Page,
  expected: ReturnType<typeof expected195>,
): Promise<void> {
  for (const testId of [
    "Auth_Callback_Recovery_Atlas",
    "atlas-masthead",
    "atlas-state-rail",
    "atlas-canvas",
    "atlas-inspector",
    "callback-ladder-diagram",
    "same-shell-recovery-atlas",
    "session-state-ring",
    "page-state-gallery",
    "auth-state-matrix-table",
    "refresh-back-cases-table",
    "atlas-parity-table",
    "nhs-login-button-standard",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  for (const row of expected.matrix) {
    await page.locator(`[data-testid='atlas-view-${row.screen_key}']`).waitFor();
    await page.locator(`[data-testid='state-row-${row.screen_key}']`).waitFor();
  }
}

async function assertAtlasInteractions(page: Page): Promise<void> {
  await page.locator("[data-testid='atlas-state-button-safe_re_entry']").click();
  let inspector = (await page.locator("[data-testid='atlas-inspector']").innerText()).toLowerCase();
  assertCondition(
    inspector.includes("routeintentbinding.validity"),
    "Inspector lost binding validity.",
  );
  assertCondition(inspector.includes("stale"), "Safe re-entry did not expose stale binding.");

  await page.locator("[data-testid='atlas-outcome-filter']").selectOption("consent_declined");
  assertCondition(
    (await page
      .locator("[data-testid='atlas-view-consent_declined']")
      .getAttribute("data-hidden")) === "false",
    "Outcome filter did not expose consent declined.",
  );
  assertCondition(
    (await page
      .locator("[data-testid='atlas-view-callback_holding']")
      .getAttribute("data-hidden")) === "true",
    "Outcome filter did not hide unrelated callback holding state.",
  );

  await page.locator("[data-testid='atlas-outcome-filter']").selectOption("all");
  await page.locator("[data-testid='atlas-authority-filter']").selectOption("recovery_only");
  assertCondition(
    (await page.locator("[data-testid='atlas-view-safe_re_entry']").getAttribute("data-hidden")) ===
      "false",
    "Authority filter did not keep recovery-only state.",
  );
  await page.locator("[data-testid='atlas-authority-filter']").selectOption("all");

  const firstRail = page.locator("[data-testid='atlas-state-button-sign_in_entry']");
  await firstRail.focus();
  await page.keyboard.press("ArrowDown");
  inspector = await page.locator("[data-testid='atlas-inspector']").innerText();
  assertCondition(inspector.includes("Callback holding"), "Rail ArrowDown did not move selection.");
}

async function assertAppRoutes(
  page: Page,
  baseUrl: string,
  expected: ReturnType<typeof expected195>,
) {
  for (const row of expected.matrix) {
    await openApp(page, baseUrl, row.route_path);
    const root = page.locator("[data-testid='Auth_Callback_Recovery_Route']");
    await page.locator(`[data-testid='auth-screen-${row.screen_key}'] h1`).waitFor();
    assertCondition(
      (await root.getAttribute("data-screen-key")) === row.screen_key,
      `Route ${row.route_path} rendered wrong screen key.`,
    );
    assertCondition(
      (await root.getAttribute("data-resolved-screen-key")) === row.screen_key,
      `Route ${row.route_path} failed authoritative resolver parity.`,
    );
    await page.locator("[data-testid='auth-context-card']").waitFor();
    await page.locator("[data-testid='header-identity-chip']").waitFor();
    await page.locator("[data-testid='auth-live-region']").waitFor();
    await assertNoOverflow(page);
  }
}

async function assertRefreshReplayAndBack(page: Page, baseUrl: string) {
  await openApp(page, baseUrl, "/auth/callback");
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='auth-screen-callback_holding']").waitFor();

  await openApp(page, baseUrl, "/auth/recovery/safe-re-entry");
  const safeRoot = page.locator("[data-testid='Auth_Callback_Recovery_Route']");
  assertCondition(
    (await safeRoot.getAttribute("data-route-binding-validity")) === "stale",
    "Replay/stale return did not retain stale binding posture.",
  );

  await openApp(page, baseUrl, "/auth/sign-in");
  await page.getByRole("button", { name: "Continue with NHS login" }).click();
  await page.locator("[data-testid='auth-screen-callback_holding']").waitFor();
  await page.goBack({ waitUntil: "networkidle" });
  await page.locator("[data-testid='auth-screen-sign_in_entry']").waitFor();

  await openApp(page, baseUrl, "/auth/signed-out");
  await page.goBack({ waitUntil: "networkidle" }).catch(() => undefined);
  await page.goto(`${baseUrl}/auth/signed-out`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='auth-screen-signed_out_clean']").waitFor();
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  const expected = expected195();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertNoOverflow(page);
    await assertAtlasShell(page, expected);
    await assertAtlasInteractions(page);
    await assertAppRoutes(page, patientWeb.baseUrl, expected);
    await assertRefreshReplayAndBack(page, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected195();
  if (!process.argv.includes("--run")) {
    console.log("195_auth_callback_and_signed_out_recovery.spec.ts: syntax ok");
    return;
  }
  await withBrowser(runBrowserChecks);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
