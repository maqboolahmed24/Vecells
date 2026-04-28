import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveScreenshot,
  assertNoSensitiveText,
  expectAttribute,
  load469Evidence,
  waitForIncidentSurfaces,
  withIncidentBrowser,
} from "./469_incident_tenant.helpers";

function screenshotPath(name: string): string {
  return path.join(OUTPUT_DIR, name);
}

export async function run(): Promise<void> {
  const evidence = load469Evidence();
  assert.equal(evidence.coverage.incidentDetectionSources, true);
  assert.equal(evidence.coverage.reportabilityDecisionAndHandoff, true);
  assert.equal(evidence.coverage.postIncidentReviewCapaAndOwner, true);
  assert.equal(evidence.gapClosures.incidentSideChannelGap, true);

  await withIncidentBrowser("469-incident-desk-flow", async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/incidents?state=normal`, { waitUntil: "networkidle" });
    await waitForIncidentSurfaces(page);

    const root = page.locator("[data-testid='ops-shell-root']");
    const desk = page.locator("[data-surface='incident-desk']");
    await expectAttribute(root, "data-current-path", "/ops/incidents");
    await expectAttribute(root, "data-incident-binding-state", "live");
    await expectAttribute(root, "data-incident-action-control-state", "live_control");
    await expectAttribute(root, "data-incident-reportability-decision", "reported");
    await expectAttribute(desk, "data-reportability-decision", "reported");
    await expectAttribute(
      page.locator("[data-surface='reportability-checklist']"),
      "data-handoff-state",
      "acknowledged",
    );
    await expectAttribute(
      page.locator("[data-testid='external-reporting-handoff']"),
      "data-handoff-state",
      "acknowledged",
    );
    await expectAttribute(
      page.locator("[data-surface='incident-telemetry-redaction']"),
      "data-payload-class",
      "metadata_only",
    );
    assert(
      (await page.locator("[data-surface='incident-queue'] [data-row-kind='incident']").count()) >=
        2,
      "Incident queue should include incident rows.",
    );
    assert(
      (await page.locator("[data-surface='incident-queue'] [data-row-kind='near_miss']").count()) >=
        1,
      "Incident queue should include a near-miss row.",
    );
    assert(
      (await page.locator("[data-testid='containment-event-applied']").count()) >= 1,
      "Applied containment evidence is missing.",
    );
    assert(
      (await page.locator("[data-testid='incident-action-close_review']").isDisabled()) === true,
      "Review closure must remain blocked until PIR, CAPA, and drill evidence settle.",
    );
    await assertNoSensitiveText(page.locator("body"), "normal incident desk");
    const exact = screenshotPath("469-exact.png");
    await page.screenshot({ path: exact, fullPage: true });
    assertNoSensitiveScreenshot(exact, "exact incident screenshot");

    const reportable = screenshotPath("469-reportable.png");
    await page.locator("[data-surface='reportability-checklist']").scrollIntoViewIfNeeded();
    await page.screenshot({ path: reportable, fullPage: true });
    assertNoSensitiveScreenshot(reportable, "reportable incident screenshot");

    await page.locator("[data-testid='incident-filter-near_miss']").click();
    await expectAttribute(page.locator("[data-surface='incident-queue']"), "data-filter", "near_miss");
    await page.locator("[data-surface='incident-queue'] [data-row-kind='near_miss']").first().click();
    await expectAttribute(
      page.locator("[data-surface='severity-board']"),
      "data-severity",
      "near_miss",
    );
    await page.locator("[data-testid='near-miss-submit']").click();
    await page.locator("[data-testid='near-miss-error']").waitFor();
    assert(
      (await page.locator("[data-testid='near-miss-error']").innerText()).includes("Summary is required"),
      "Near-miss intake must expose a validation error summary.",
    );
    await page
      .locator("[data-surface='near-miss-intake'] textarea")
      .fill("Escalation note was missing during the drill rehearsal.");
    await page.locator("[data-testid='near-miss-submit']").click();
    await expectAttribute(
      page.locator("[data-surface='near-miss-intake']"),
      "data-validation-state",
      "accepted_pending_settlement",
    );
    const nearMiss = screenshotPath("469-near-miss.png");
    await page.screenshot({ path: nearMiss, fullPage: true });
    assertNoSensitiveScreenshot(nearMiss, "near-miss screenshot");

    await page.locator("[data-testid='incident-evidence-investigation_timeline']").click();
    const evidenceDrawer = page.locator("[data-testid='incident-investigation-return']");
    await evidenceDrawer.waitFor();
    await expectAttribute(evidenceDrawer, "data-payload-class", "redacted_summary");
    assert(
      ((await evidenceDrawer.getAttribute("data-safe-return-token")) ?? "").startsWith(
        "ORT_INCIDENT_",
      ),
      "Evidence drawer must preserve a safe return token.",
    );
    await assertNoSensitiveText(evidenceDrawer, "incident evidence drawer");

    await page.locator("[data-surface='incident-capa-links']").scrollIntoViewIfNeeded();
    const capaText = await page.locator("[data-surface='incident-capa-links']").innerText();
    assert(capaText.includes("2026-04-20"), "CAPA overdue date should remain visible.");
    assert(/in progress/i.test(capaText), "CAPA state should remain visible.");
    const capa = screenshotPath("469-capa-overdue.png");
    await page.screenshot({ path: capa, fullPage: true });
    assertNoSensitiveScreenshot(capa, "CAPA-overdue screenshot");

    await page.goto(`${OPS_APP_URL}/ops/incidents?state=settlement-pending`, {
      waitUntil: "networkidle",
    });
    await waitForIncidentSurfaces(page);
    await expectAttribute(root, "data-incident-binding-state", "diagnostic_only");
    await expectAttribute(root, "data-incident-reportability-decision", "reportable_pending_submission");
    assert(
      (await page.locator("[data-testid='containment-event-pending']").count()) >= 1,
      "Pending containment state is missing.",
    );
    const containmentPending = screenshotPath("469-containment-pending.png");
    await page.screenshot({ path: containmentPending, fullPage: true });
    assertNoSensitiveScreenshot(containmentPending, "containment-pending screenshot");

    await page.goto(`${OPS_APP_URL}/ops/incidents?state=permission-denied`, {
      waitUntil: "networkidle",
    });
    await waitForIncidentSurfaces(page);
    await expectAttribute(root, "data-overview-state", "permission_denied");
    await expectAttribute(root, "data-incident-binding-state", "blocked");
    assert(
      (await page.locator("[data-surface='severity-board']").innerText()).includes(
        "Role scope only permits metadata",
      ),
      "Permission-denied incident state should be metadata-only.",
    );
    await assertNoSensitiveText(page.locator("body"), "permission denied incident desk");
    const permissionDenied = screenshotPath("469-permission-denied.png");
    await page.screenshot({ path: permissionDenied, fullPage: true });
    assertNoSensitiveScreenshot(permissionDenied, "permission-denied screenshot");

    await page.keyboard.press("Tab");
    const activeRole = await page.evaluate(() => document.activeElement?.getAttribute("role") ?? "");
    assert(["button", "link", ""].includes(activeRole), "Keyboard focus should land on an operable control.");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
