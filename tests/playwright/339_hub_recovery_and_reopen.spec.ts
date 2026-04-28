import {
  assertCondition,
  buildExpectedHubScenario,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  readRecoveryRoot,
  startHubDesk,
  startTrace,
  stopHubDesk,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForHubRootState,
  writeJsonArtifact,
} from "./339_commit_mesh_no_slot_reopen.helpers.ts";

export const hubRecoveryCoverage339 = [
  "callback fallback stays non-closable and provenance-preserving until linkage is durable",
  "urgent bounce-back keeps return receipt and supervisor escalation in one same-shell recovery path",
  "reopen remains diff-first, anchor-preserving, and reachable from the exceptions workspace",
];

function assertTextIncludes(text: string, value: string, label: string): void {
  assertCondition(text.includes(value), `${label} is missing ${value}`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();
  const viewportWidth = 1520;

  try {
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: 1160 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);

    try {
      const page = await context.newPage();
      trackExternalRequests(page, baseUrl, externalRequests);

      const callbackScenario = buildExpectedHubScenario("/hub/case/hub-case-052", viewportWidth);
      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-052`, "hub-case-route");
      await waitForHubRootState(page, {
        currentPath: "/hub/case/hub-case-052",
        viewMode: "case",
        selectedCaseId: "hub-case-052",
      });
      await page.getByTestId("HubNoSlotResolutionPanel").waitFor();
      await page.getByTestId("HubCallbackTransferPendingState").waitFor();
      await page.getByTestId("HubReopenProvenanceStub").waitFor();
      const callbackText =
        (await page.getByTestId("HubNoSlotResolutionPanel").textContent()) ?? "";
      assertCondition(
        (await page.getByTestId("HubNoSlotResolutionPanel").getAttribute("data-fallback-type")) ===
          "callback_request",
        "callback no-slot panel lost fallback type",
      );
      assertCondition(
        (await page.getByTestId("HubCallbackTransferPendingState").getAttribute(
          "data-callback-transfer",
        )) === "pending",
        "callback transfer state drifted",
      );
      assertTextIncludes(
        callbackText,
        callbackScenario.snapshot.recoveryCase?.noSlotResolutionPanel?.summary ?? "",
        "callback recovery panel",
      );
      assertTextIncludes(
        (await page.getByTestId("HubReopenProvenanceStub").textContent()) ?? "",
        callbackScenario.snapshot.recoveryCase?.reopenProvenanceStub?.lawSummary ?? "",
        "callback provenance panel",
      );

      await openHubRoute(page, `${baseUrl}/hub/exceptions`, "HubExceptionQueueView");
      await waitForHubRootState(page, {
        currentPath: "/hub/exceptions",
        viewMode: "exceptions",
        selectedCaseId: "hub-case-052",
      });
      await page.getByTestId("hub-exception-row-exc-drift-041").click();
      const exceptionRoot = await readRecoveryRoot(page);
      assertCondition(
        exceptionRoot["data-selected-exception-id"] === "exc-drift-041",
        `expected selected exception exc-drift-041, received ${String(exceptionRoot["data-selected-exception-id"])}`,
      );
      assertCondition(
        exceptionRoot["data-selected-case-id"] === "hub-case-041",
        `expected selected case hub-case-041, received ${String(exceptionRoot["data-selected-case-id"])}`,
      );

      const urgentScenario = buildExpectedHubScenario("/hub/case/hub-case-031", viewportWidth);
      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-031`, "hub-case-route");
      await waitForHubRootState(page, {
        currentPath: "/hub/case/hub-case-031",
        viewMode: "case",
        selectedCaseId: "hub-case-031",
      });
      await page.getByTestId("HubUrgentBounceBackBanner").waitFor();
      await page.getByTestId("HubReturnToPracticeReceipt").waitFor();
      await page.getByTestId("HubSupervisorEscalationPanel").waitFor();
      assertCondition(
        (await page.getByTestId("HubReturnToPracticeReceipt").getAttribute(
          "data-return-to-practice",
        )) === "urgent_return_to_practice",
        "urgent return receipt lost fallback marker",
      );
      assertCondition(
        (await page.getByTestId("HubSupervisorEscalationPanel").getAttribute(
          "data-supervisor-escalation",
        )) === "true",
        "supervisor escalation marker missing",
      );
      assertTextIncludes(
        (await page.getByTestId("HubUrgentBounceBackBanner").textContent()) ?? "",
        urgentScenario.snapshot.recoveryCase?.urgentBounceBackBanner?.dueLabel ?? "",
        "urgent bounce-back banner",
      );

      const reopenScenario = buildExpectedHubScenario("/hub/case/hub-case-041", viewportWidth);
      await openHubRoute(page, `${baseUrl}/hub/case/hub-case-041`, "hub-case-route");
      await waitForHubRootState(page, {
        currentPath: "/hub/case/hub-case-041",
        viewMode: "case",
        selectedCaseId: "hub-case-041",
      });
      await page.getByTestId("HubRecoveryDiffStrip").waitFor();
      await page.getByTestId("HubReopenProvenanceStub").waitFor();
      const diffText = (await page.getByTestId("HubRecoveryDiffStrip").textContent()) ?? "";
      for (const row of reopenScenario.snapshot.recoveryCase?.recoveryDiffStrip?.diffRows ?? []) {
        assertTextIncludes(diffText, row.nextValue, "reopen diff strip");
      }
      const reopenAria = await captureAria(page.getByTestId("HubRecoveryDiffStrip"), page);

      writeJsonArtifact("339-hub-recovery-and-reopen.json", {
        callbackRecoveryCase: callbackScenario.snapshot.currentCase.caseId,
        urgentBounceCase: urgentScenario.snapshot.currentCase.caseId,
        reopenCase: reopenScenario.snapshot.currentCase.caseId,
        selectedException: exceptionRoot["data-selected-exception-id"],
        aria: {
          reopenDiffStrip: reopenAria,
        },
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );

      await page.screenshot({
        path: outputPath("339-hub-recovery-and-reopen.png"),
        fullPage: true,
      });
      await stopTrace(context, "339-hub-recovery-and-reopen-trace.zip");
    } catch (error) {
      await stopTraceOnError(context, "339-hub-recovery-and-reopen-trace.zip", error);
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
