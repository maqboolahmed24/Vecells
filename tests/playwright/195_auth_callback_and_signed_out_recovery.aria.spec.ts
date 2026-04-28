import {
  assertCondition,
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

async function assertAppAria(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/auth/sign-in");
  const status = page.locator("[data-testid='auth-live-region']");
  assertCondition((await status.getAttribute("role")) === "status", "Live region role drifted.");
  assertCondition(
    (await status.getAttribute("aria-live")) === "polite",
    "Live region aria-live must be polite.",
  );

  const selected = page.locator("[data-testid='auth-state-sign_in_entry']");
  assertCondition(
    (await selected.getAttribute("aria-current")) === "page",
    "Current state not marked.",
  );

  await page.getByRole("button", { name: "Continue with NHS login" }).click();
  await page.locator("[data-testid='auth-screen-callback_holding']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='auth-state-callback_holding']")
      .getAttribute("aria-current")) === "page",
    "ARIA current did not update after primary auth action.",
  );

  await openApp(page, baseUrl, "/auth/recovery/higher-assurance");
  const alertText = await page.getByRole("alert").innerText();
  assertCondition(
    alertText.includes("CapabilityDecision.reasonCodes"),
    "Higher-assurance alert did not describe authoritative reason codes.",
  );
}

async function assertAtlasAria(page: Page, url: string): Promise<void> {
  await openAtlas(page, url);
  const current = await page
    .locator("[data-testid='atlas-state-button-sign_in_entry']")
    .getAttribute("aria-current");
  assertCondition(current === "page", "Atlas initial state did not expose aria-current=page.");
  await page.locator("[data-testid='atlas-state-button-consent_declined']").click();
  const updated = await page
    .locator("[data-testid='atlas-state-button-consent_declined']")
    .getAttribute("aria-current");
  assertCondition(updated === "page", "Atlas clicked state did not update aria-current.");
}

async function runAriaChecks(browser: Browser): Promise<void> {
  expected195();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await assertAtlasAria(page, staticServer.url);
    await assertAppAria(page, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected195();
  if (!process.argv.includes("--run")) {
    console.log("195_auth_callback_and_signed_out_recovery.aria.spec.ts: syntax ok");
    return;
  }
  await withBrowser(runAriaChecks);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
