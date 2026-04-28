const { test, expect } = require("@playwright/test");

test.describe("34 evidence signal atlas", () => {
  test("supports tab switching, lane toggles, and evidence drawer rendering", async ({ page }) => {
    await page.goto("http://127.0.0.1:4192/34_evidence_signal_atlas.html");

    await expect(page.getByTestId("vendor-atlas-shell")).toBeVisible();
    await page.getByTestId("tab-artifact_scanning").click();
    await expect(page.getByTestId("provider-grid")).toContainText(
      "GuardDuty Malware Protection for S3",
    );

    await page.getByTestId("lane-toggle").getByRole("button", { name: "Mock lane" }).click();
    await expect(page.getByTestId("provider-grid")).toContainText(
      "Vecells Artifact Quarantine Twin",
    );

    await page.getByTestId("lane-toggle").getByRole("button", { name: "Actual lane" }).click();
    await page.getByTestId("provider-row-aws_guardduty_s3_scan").click();
    await expect(page.getByTestId("evidence-drawer")).toContainText(
      "GuardDuty Malware Protection for S3",
    );
  });

  test("keeps chart and table parity for the selected provider", async ({ page }) => {
    await page.goto("http://127.0.0.1:4192/34_evidence_signal_atlas.html");

    await page.getByTestId("provider-row-deepgram_transcription").click();
    await expect(page.getByTestId("dimension-chart")).toBeVisible();
    await expect(page.getByTestId("dimension-table")).toContainText("Contract Shape");
    await expect(
      page.getByTestId("score-cell-deepgram_transcription-contract_shape"),
    ).toBeVisible();
  });
});
