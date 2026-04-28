import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  startOpsConsole,
  stopOpsConsole,
} from "./386_nhs_app_readiness.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 940 } });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/audit/channel/nhs-app/evt-398-consent-denied?tab=audit`,
      {
        waitUntil: "networkidle",
      },
    );
    const root = page.getByTestId("NHSAppChannelControlWorkbench");
    await root.waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-case")) === "SUP-398-003",
      "audit event did not resolve selected case.",
    );
    assertCondition(
      (await root.getAttribute("data-sso-outcome")) === "consent_denied",
      "audit route did not expose consent denial.",
    );
    await page.getByTestId("ChannelTimelineEvent-evt-398-status-freeze").click();
    assertCondition(
      page.url().includes("event=evt-398-status-freeze"),
      `timeline event selection did not serialize: ${page.url()}`,
    );
    const patientText = await page.getByTestId("WhatPatientSawPanel").innerText();
    assertCondition(
      /read-only|consent/i.test(patientText),
      `patient preview missing consent/read-only state: ${patientText}`,
    );
    const deepLinks = page.getByTestId("NHSAppAuditDeepLinkStrip");
    assertCondition(
      (
        (await deepLinks.locator("a", { hasText: "Support case" }).getAttribute("href")) ?? ""
      ).includes("/ops/support/cases/SUP-398-003/channel"),
      "support case deep link mismatch.",
    );
    assertCondition(
      (
        (await deepLinks.locator("a", { hasText: "Audit event" }).getAttribute("href")) ?? ""
      ).includes("/ops/audit/channel/nhs-app/evt-398-status-entry"),
      "audit event deep link mismatch.",
    );
    await assertNoHorizontalOverflow(page);
  } finally {
    await context.close();
    await browser.close();
    await stopOpsConsole(server.process);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
