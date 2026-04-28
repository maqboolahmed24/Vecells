import {
  activeTestId,
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

async function assertAppAccessibility(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/auth/recovery/session-expired");

  await page.getByRole("banner").waitFor();
  await page.getByRole("navigation", { name: "Auth recovery states" }).waitFor();
  await page.getByRole("main").waitFor();
  await page.locator("[data-testid='auth-context-card']").waitFor();
  await page.getByRole("status").waitFor();
  await page.getByRole("alert").waitFor();

  const focused = await activeTestId(page);
  assertCondition(
    focused === "auth-screen-session_expired",
    `Expected focus inside session-expired screen, got ${focused}`,
  );

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const tabbedTestId = await activeTestId(page);
  assertCondition(Boolean(tabbedTestId), "Tab traversal did not reach a labelled control.");

  const buttonNames = await page
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => button.textContent?.replace(/\s+/g, " ").trim() ?? ""),
    );
  for (const required of ["Sign in again", "View read-only summary"]) {
    assertCondition(
      buttonNames.some((name) => name.includes(required)),
      `Missing button ${required}`,
    );
  }
}

async function assertAtlasAccessibility(page: Page, url: string): Promise<void> {
  await openAtlas(page, url);
  await page.getByRole("banner").waitFor();
  await page.getByRole("main").waitFor();
  await page.getByRole("navigation", { name: "Auth callback states" }).waitFor();
  await page.getByRole("heading", { name: "Same-shell sign-in callback atlas" }).waitFor();
  await page.locator("[data-testid='atlas-state-button-sign_in_entry']").focus();
  await page.keyboard.press("ArrowRight");
  const current = await page
    .locator("[data-testid='atlas-state-button-callback_holding']")
    .getAttribute("aria-current");
  assertCondition(current === "page", "Atlas keyboard traversal did not update aria-current.");
}

async function runAccessibilityChecks(browser: Browser): Promise<void> {
  expected195();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await assertAtlasAccessibility(page, staticServer.url);
    await assertAppAccessibility(page, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected195();
  if (!process.argv.includes("--run")) {
    console.log("195_auth_callback_and_signed_out_recovery.accessibility.spec.ts: syntax ok");
    return;
  }
  await withBrowser(runAccessibilityChecks);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
