import {
  appointmentFamilyUrl,
  assertCondition,
  assertNoHorizontalOverflow,
  closeProject340,
  createRawSpecResult340,
  launchProject340,
  networkChoiceUrl,
  openAppointmentFamilyRoute,
  openHubRoute,
  openNetworkChoiceRoute,
  readAppointmentFamilyMarkers,
  readNetworkChoiceMarkers,
  startHubDesk,
  startPatientWeb,
  startTrace340,
  stopHubDesk,
  stopPatientWeb,
  stopTrace340,
  summarizeError340,
  trackExternalRequests,
  waitForAppointmentFamilySelection,
  waitForNetworkChoiceState,
  writeRawSpecResult340,
  captureScreenshot340,
} from "./340_phase5_browser_matrix.helpers.ts";
import {
  assertRootMatchesExpectedScenario,
  buildExpectedHubScenario,
  waitForRootAttributes,
} from "./338_scope_capacity.helpers.ts";

export const phase5ResponsiveContinuityCoverage340 = [
  "wide, narrow, tablet portrait, and tablet landscape hub layouts keep the same current case and dominant decision meaning",
  "patient mobile choice keeps sticky actions reachable without horizontal overflow",
  "320px / 400% zoom proxy stays readable on appointment family follow-on surfaces",
  "reduced-motion mode keeps state changes visible while collapsing motion",
] as const;

const SPEC_ID = "responsive_same_shell_continuity_browser";
const SPEC_SLUG = "responsive-same-shell-continuity";
const PROJECT_IDS = [
  "hub_operator_wide_chromium",
  "hub_operator_narrow_chromium",
  "hub_operator_tablet_portrait_chromium",
  "hub_operator_tablet_landscape_chromium",
  "patient_mobile_portrait_chromium",
  "patient_high_zoom_reflow_chromium",
  "hub_operator_reduced_motion_chromium",
] as const;

export async function run(): Promise<void> {
  const playwright = await import("./340_phase5_browser_matrix.helpers.ts").then((module) =>
    module.importPlaywright(),
  );
  if (!playwright) {
    return;
  }

  const raw = createRawSpecResult340(SPEC_ID, phase5ResponsiveContinuityCoverage340, PROJECT_IDS);
  const failures: Error[] = [];
  const [
    { child: hubChild, baseUrl: hubBaseUrl },
    { child: patientChild, baseUrl: patientBaseUrl },
  ] = await Promise.all([startHubDesk(), startPatientWeb()]);

  try {
    for (const projectId of [
      "hub_operator_wide_chromium",
      "hub_operator_narrow_chromium",
      "hub_operator_tablet_portrait_chromium",
      "hub_operator_tablet_landscape_chromium",
    ] as const) {
      const { project, browser, context, page } = await launchProject340(playwright, projectId);
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseId =
        projectId === "hub_operator_wide_chromium"
          ? "RESP340_001"
          : projectId === "hub_operator_narrow_chromium"
            ? "RESP340_002"
            : projectId === "hub_operator_tablet_portrait_chromium"
              ? "RESP340_003"
              : "RESP340_004";
      trackExternalRequests(page, hubBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        const expected = buildExpectedHubScenario("/hub/queue", project.viewport.width, {
          selectedSavedViewId: "callback_recovery",
        });
        await openHubRoute(page, `${hubBaseUrl}/hub/queue`);
        if (expected.snapshot.layoutMode === "mission_stack") {
          await page.getByTestId("hub-mission-stack-saved-view-callback_recovery").click();
        } else {
          await page.getByTestId("hub-saved-view-callback_recovery").click();
        }
        await assertRootMatchesExpectedScenario(page, expected);
        const selectedOption = await page
          .locator("[data-testid='hub-shell-root']")
          .getAttribute("data-selected-option-card");
        assertCondition(
          selectedOption === expected.snapshot.selectedOptionCard.optionCardId,
          `selected option drifted for ${projectId}: ${String(selectedOption)}`,
        );

        raw.caseResults.push({
          caseId,
          projectId: project.projectId,
          surfaceFamily: "responsive_continuity",
          status: "passed",
          artifactRefs: [],
          metrics: {
            layoutMode: expected.snapshot.layoutMode,
            selectedCaseId: expected.snapshot.currentCase.caseId,
            selectedOptionCardId: expected.snapshot.selectedOptionCard.optionCardId,
          },
          notes: ["hub same-shell continuity stayed bound to the same case and dominant action"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
        assertCondition(
          externalRequests.size === 0,
          `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
        );
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        artifactRefs.push(traceRef);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "passed",
          caseIds: [caseId],
          artifactRefs,
          notes: ["hub queue continuity proof"],
        });
      } catch (error) {
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "failed",
          caseIds: [caseId],
          artifactRefs: [traceRef],
          errorMessage: summarizeError340(error),
        });
        failures.push(error instanceof Error ? error : new Error(String(error)));
      } finally {
        await closeProject340(browser, context);
      }
    }

    {
      const { project, browser, context, page } = await launchProject340(
        playwright,
        "patient_mobile_portrait_chromium",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["RESP340_005"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkChoiceRoute(
          page,
          networkChoiceUrl(patientBaseUrl, {
            scenarioId: "offer_session_328_live",
            origin: "appointments",
            returnRoute: "/appointments",
          }),
        );
        await page
          .locator("[data-offer-card='offer_entry_328_riverside_1830'] .patient-network-choice__card-button")
          .click();
        await waitForNetworkChoiceState(page, {
          selectedOfferEntry: "offer_entry_328_riverside_1830",
        });
        const stickyAcceptButton = page.getByRole("button", { name: "Accept this option" });
        await stickyAcceptButton.focus();
        await page.waitForTimeout(120);
        const stickyFullyVisible = await stickyAcceptButton.evaluate((node: HTMLElement) => {
          const rect = node.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        });
        assertCondition(stickyFullyVisible, "patient mobile sticky action was not fully visible");
        await assertNoHorizontalOverflow(page, "340 patient mobile choice continuity");
        const markers = await readNetworkChoiceMarkers(page);
        assertCondition(
          markers.breakpointClass === "compact" || markers.missionStackState === "folded",
          `patient mobile breakpoint markers drifted: ${JSON.stringify(markers)}`,
        );

        raw.caseResults.push({
          caseId: "RESP340_005",
          projectId: project.projectId,
          surfaceFamily: "responsive_continuity",
          status: "passed",
          artifactRefs: [],
          metrics: {
            breakpointClass: markers.breakpointClass,
            missionStackState: markers.missionStackState,
            selectedOfferEntry: markers.selectedOfferEntry,
          },
          notes: ["patient mobile choice kept sticky action reachability and focus visibility"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
        assertCondition(
          externalRequests.size === 0,
          `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
        );
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        artifactRefs.push(traceRef);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "passed",
          caseIds,
          artifactRefs,
          notes: ["patient mobile choice continuity proof"],
        });
      } catch (error) {
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "failed",
          caseIds,
          artifactRefs: [traceRef],
          errorMessage: summarizeError340(error),
        });
        failures.push(error instanceof Error ? error : new Error(String(error)));
      } finally {
        await closeProject340(browser, context);
      }
    }

    {
      const { project, browser, context, page } = await launchProject340(
        playwright,
        "patient_high_zoom_reflow_chromium",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["RESP340_006"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openAppointmentFamilyRoute(
          page,
          appointmentFamilyUrl(patientBaseUrl, {
            familyRef: "family_waitlist_fallback_due",
          }),
        );
        await waitForAppointmentFamilySelection(page, "family_waitlist_fallback_due");
        await assertNoHorizontalOverflow(page, "340 appointment family high-zoom");
        const action = page.getByTestId("appointment-family-manage-entry-action");
        await action.scrollIntoViewIfNeeded();
        await action.focus();
        await page.waitForTimeout(120);
        const actionFullyVisible = await action.evaluate((node: HTMLElement) => {
          const rect = node.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        });
        assertCondition(actionFullyVisible, "appointment family high-zoom action was not fully visible");
        const markers = await readAppointmentFamilyMarkers(page);
        assertCondition(
          markers.selectedFamilyRef === "family_waitlist_fallback_due",
          `appointment family selection drifted under high zoom: ${JSON.stringify(markers)}`,
        );

        raw.caseResults.push({
          caseId: "RESP340_006",
          projectId: project.projectId,
          surfaceFamily: "responsive_continuity",
          status: "passed",
          artifactRefs: [],
          metrics: {
            selectedFamilyRef: markers.selectedFamilyRef,
            returnAnchorState: markers.returnAnchor,
            highZoomProxy: true,
          },
          notes: ["320px proxy kept appointment family detail readable and actionable"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
        assertCondition(
          externalRequests.size === 0,
          `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
        );
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        artifactRefs.push(traceRef);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "passed",
          caseIds,
          artifactRefs,
          notes: ["patient high-zoom appointment family proof"],
        });
      } catch (error) {
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "failed",
          caseIds,
          artifactRefs: [traceRef],
          errorMessage: summarizeError340(error),
        });
        failures.push(error instanceof Error ? error : new Error(String(error)));
      } finally {
        await closeProject340(browser, context);
      }
    }

    {
      const { project, browser, context, page } = await launchProject340(
        playwright,
        "hub_operator_reduced_motion_chromium",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["RESP340_007"];
      trackExternalRequests(page, hubBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openHubRoute(page, `${hubBaseUrl}/hub/case/hub-case-104`, "hub-case-route");
        await waitForRootAttributes(page, {
          "data-reduced-motion": "reduce",
          "data-current-path": "/hub/case/hub-case-104",
        });
        const transitionDuration = await page
          .locator(".hub-acting-context-chip .hub-chip")
          .first()
          .evaluate((node) => window.getComputedStyle(node).transitionDuration);
        assertCondition(
          transitionDuration.includes("0.01ms") ||
            transitionDuration.includes("1e-05s") ||
            transitionDuration.includes("0s"),
          `reduced-motion transition did not collapse: ${transitionDuration}`,
        );

        raw.caseResults.push({
          caseId: "RESP340_007",
          projectId: project.projectId,
          surfaceFamily: "responsive_continuity",
          status: "passed",
          artifactRefs: [],
          metrics: {
            reducedMotion: true,
            transitionDuration,
          },
          notes: ["reduced-motion project kept the shell truthful without motion-heavy transitions"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
        assertCondition(
          externalRequests.size === 0,
          `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
        );
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        artifactRefs.push(traceRef);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "passed",
          caseIds,
          artifactRefs,
          notes: ["reduced-motion project"],
        });
      } catch (error) {
        const traceRef = await stopTrace340(context, SPEC_SLUG, project.projectId);
        raw.projectRuns.push({
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          orientation: project.orientation,
          reducedMotion: project.reducedMotion,
          highZoomProxy: project.highZoomProxy,
          scopeVariation: project.scopeVariation,
          status: "failed",
          caseIds,
          artifactRefs: [traceRef],
          errorMessage: summarizeError340(error),
        });
        failures.push(error instanceof Error ? error : new Error(String(error)));
      } finally {
        await closeProject340(browser, context);
      }
    }
  } finally {
    await Promise.all([stopHubDesk(hubChild), stopPatientWeb(patientChild)]);
  }

  writeRawSpecResult340(SPEC_SLUG, raw);

  if (failures.length > 0) {
    throw new AggregateError(failures, "340 responsive continuity failures");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
