import {
  assertCondition,
  assertHubCommitProjection,
  captureAria,
  expectedCommitProjection,
  importPlaywright,
  openHubRoute,
  outputPath,
  readPracticeVisibilityDetails,
  startHubDesk,
  startTrace,
  stopHubDesk,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForHubCommitPosture,
  writeJsonArtifact,
} from "./339_commit_mesh_no_slot_reopen.helpers.ts";

export const practiceVisibilityCoverage339 = [
  "practice informed, practice acknowledged, and reopened acknowledgement debt remain distinct end to end",
  "MESH-backed continuity evidence stays visible without leaking hub-only identifiers",
  "supplier drift visibly reopens acknowledgement debt instead of clearing it through stale generation state",
];

function assertTextIncludesAll(text: string, values: readonly string[], label: string): void {
  for (const value of values) {
    assertCondition(text.includes(value), `${label} is missing ${value}`);
  }
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 1520, height: 1160 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);

    try {
      const page = await context.newPage();
      trackExternalRequests(page, baseUrl, externalRequests);

      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-066`, "hub-case-route");
      await waitForHubCommitPosture(page, "booked_pending_practice_ack");
      await assertHubCommitProjection(page, "booked_pending_practice_ack");

      const practiceProjection = expectedCommitProjection("booked_pending_practice_ack").practiceView;
      const practice = await readPracticeVisibilityDetails(page);
      assertCondition(
        practice.acknowledgementState === practiceProjection.acknowledgementState,
        `expected acknowledgement state ${practiceProjection.acknowledgementState}, received ${String(practice.acknowledgementState)}`,
      );
      assertTextIncludesAll(
        practice.text,
        practiceProjection.minimumNecessaryRows.map((row) => row.value),
        "practice minimum-necessary panel",
      );
      assertTextIncludesAll(
        practice.text,
        practiceProjection.patientFacingRows.map((row) => row.value),
        "practice patient-facing rows",
      );
      assertCondition(!practice.text.includes("RANK-"), "practice panel leaked hub rank proof");
      assertCondition(!practice.text.includes("BTX-"), "practice panel leaked booking transaction ref");

      await page.getByRole("button", { name: "Show evidence" }).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-testid='ContinuityDeliveryEvidenceDrawer']")
            ?.getAttribute("data-open") === "true",
      );
      const continuityProjection = expectedCommitProjection("booked_pending_practice_ack").continuityDrawer;
      const continuityText =
        (await page.getByTestId("ContinuityDeliveryEvidenceDrawer").textContent()) ?? "";
      assertTextIncludesAll(
        continuityText,
        continuityProjection.evidenceRows.map((row) => row.value),
        "continuity evidence drawer",
      );
      const continuityAria = await captureAria(
        page.getByTestId("ContinuityDeliveryEvidenceDrawer"),
        page,
      );

      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-041`, "hub-case-route");
      await waitForHubCommitPosture(page, "supplier_drift");
      await assertHubCommitProjection(page, "supplier_drift");
      const reopenedProjection = expectedCommitProjection("supplier_drift").practiceView;
      const reopened = await readPracticeVisibilityDetails(page);
      assertCondition(
        reopened.acknowledgementState === reopenedProjection.acknowledgementState,
        `expected reopened acknowledgement state ${reopenedProjection.acknowledgementState}, received ${String(reopened.acknowledgementState)}`,
      );
      assertCondition(
        reopened.text.includes(reopenedProjection.acknowledgementLabel),
        "supplier drift practice panel lost reopened acknowledgement label",
      );

      writeJsonArtifact("339-practice-visibility-and-acknowledgement.json", {
        bookedPendingPracticeAck: {
          acknowledgementLabel: practiceProjection.acknowledgementLabel,
          minimumNecessaryRows: practiceProjection.minimumNecessaryRows,
          patientFacingRows: practiceProjection.patientFacingRows,
        },
        supplierDrift: {
          acknowledgementLabel: reopenedProjection.acknowledgementLabel,
          acknowledgementState: reopenedProjection.acknowledgementState,
        },
        aria: {
          continuityDrawer: continuityAria,
        },
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );

      await page.screenshot({
        path: outputPath("339-practice-visibility-and-acknowledgement.png"),
        fullPage: true,
      });
      await stopTrace(context, "339-practice-visibility-and-acknowledgement-trace.zip");
    } catch (error) {
      await stopTraceOnError(
        context,
        "339-practice-visibility-and-acknowledgement-trace.zip",
        error,
      );
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
