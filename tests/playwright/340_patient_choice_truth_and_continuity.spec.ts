import {
  appointmentFamilyUrl,
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  closeProject340,
  createRawSpecResult340,
  currentActionRef340,
  launchProject340,
  networkChoiceUrl,
  openAppointmentFamilyRoute,
  openHubRoute,
  openNetworkChoiceRoute,
  readAppointmentFamilyMarkers,
  readBodyText340,
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
  writeJsonArtifact340,
  writeRawSpecResult340,
  captureScreenshot340,
} from "./340_phase5_browser_matrix.helpers.ts";

export const phase5PatientChoiceCoverage340 = [
  "the patient-visible choice set stays full-set, advisory, and callback-separated across Chromium, Firefox, and WebKit",
  "selected anchors survive refresh and explicit accept remains pending rather than overstating confirmation",
  "drift, expiry, and supersession keep provenance visible while fencing stale writable posture",
  "the merged appointment family continues to resolve pending network truth honestly",
  "hub-assisted alternatives keep warned or diagnostic options visible and keep callback outside the ranked stack",
] as const;

const SPEC_ID = "patient_choice_truth_and_continuity_browser";
const SPEC_SLUG = "patient-choice-truth-and-continuity";
const PROJECT_IDS = [
  "patient_authenticated_chromium_wide",
  "patient_wide_desktop_firefox",
  "patient_mobile_portrait_webkit",
  "patient_high_zoom_reflow_chromium",
  "hub_operator_wide_chromium",
] as const;

export async function run(): Promise<void> {
  const playwright = await import("./340_phase5_browser_matrix.helpers.ts").then((module) =>
    module.importPlaywright(),
  );
  if (!playwright) {
    return;
  }

  const raw = createRawSpecResult340(SPEC_ID, phase5PatientChoiceCoverage340, PROJECT_IDS);
  const failures: Error[] = [];
  const [
    { child: patientChild, baseUrl: patientBaseUrl },
    { child: hubChild, baseUrl: hubBaseUrl },
  ] = await Promise.all([startPatientWeb(), startHubDesk()]);

  try {
    {
      const { project, browser, context, page } = await launchProject340(
        playwright,
        "patient_authenticated_chromium_wide",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["CHOICE340_001", "CHOICE340_004", "CHOICE340_006"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkChoiceRoute(
          page,
          networkChoiceUrl(patientBaseUrl, {
            scenarioId: "offer_session_328_live",
            origin: "appointments",
            returnRoute: "/appointments",
            anchor: "offer_entry_328_riverside_1830",
            anchorLabel: "Riverside Community Clinic",
          }),
        );
        const openingMarkers = await readNetworkChoiceMarkers(page);
        const openingText = await readBodyText340(page);
        const offerCount = await page.locator("[data-offer-card]").count();
        const recommendedCount = await page
          .locator("[data-offer-card][data-recommendation-state='recommended']")
          .count();
        const advisoryChipCount = await page.locator("[data-advisory-only='true']").count();
        assertCondition(openingMarkers.choiceActionability === "live_open_choice", "live choice posture drifted");
        assertCondition(openingMarkers.selectedOfferEntry === "", "choice route should not preselect on first entry");
        assertCondition(offerCount === 4, `expected four visible offer cards, received ${offerCount}`);
        assertCondition(recommendedCount === 1, `expected one recommended visible card, received ${recommendedCount}`);
        assertCondition(advisoryChipCount >= 4, "advisory recommendation chips disappeared from the full set");
        assertCondition(
          (await page.locator("[role='radiogroup'] [data-callback-fallback]").count()) === 0,
          "callback fallback leaked into the ranked radiogroup",
        );
        assertCondition(
          openingText.includes("Recommendation chips are advisory only") &&
            openingText.includes("Nothing is preselected for you"),
          "opening copy lost the advisory or no-preselect law",
        );

        raw.caseResults.push({
          caseId: "CHOICE340_001",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            scenarioId: "offer_session_328_live",
            visibleOfferCount: offerCount,
            recommendedVisibleCount: recommendedCount,
            advisoryOnlyChipCount: advisoryChipCount,
            callbackInsideRadiogroup: false,
            openChoiceState: "full_set_visible",
          },
          notes: ["visible frontier remains full-set and advisory"],
        });

        await page
          .locator("[data-offer-card='offer_entry_328_wharf_1910'] .patient-network-choice__card-button")
          .click();
        await waitForNetworkChoiceState(page, {
          selectedOfferEntry: "offer_entry_328_wharf_1910",
        });
        await page.reload({ waitUntil: "networkidle" });
        await waitForNetworkChoiceState(page, {
          selectedOfferEntry: "offer_entry_328_wharf_1910",
        });
        const refreshedMarkers = await readNetworkChoiceMarkers(page);
        assertCondition(
          refreshedMarkers.selectedOfferEntry === "offer_entry_328_wharf_1910" &&
            refreshedMarkers.selectedAnchorRef === "offer_entry_328_riverside_1830",
          `selected anchor drifted after refresh: ${JSON.stringify(refreshedMarkers)}`,
        );

        await page.getByRole("button", { name: "Accept this option" }).click();
        await waitForNetworkChoiceState(page, {
          offerState: "selected",
          choiceActionability: "blocked",
          confirmationTruth: "confirmation_pending",
          patientVisibility: "provisional_receipt",
        });
        const acceptedText = await readBodyText340(page);
        assertCondition(
          !acceptedText.includes("Appointment confirmed"),
          "accept path overstated confirmation instead of keeping it pending",
        );
        assertCondition(
          acceptedText.includes("Confirmation is now pending"),
          "accept path lost the pending confirmation announcement",
        );

        raw.caseResults.push({
          caseId: "CHOICE340_004",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            selectedOfferEntry: refreshedMarkers.selectedOfferEntry,
            selectedAnchorRef: refreshedMarkers.selectedAnchorRef,
            postAcceptConfirmationTruth: "confirmation_pending",
            postAcceptPatientVisibility: "provisional_receipt",
          },
          notes: ["selected anchor survives refresh and explicit accept remains pending"],
        });

        await openAppointmentFamilyRoute(
          page,
          appointmentFamilyUrl(patientBaseUrl, {
            familyRef: "family_network_live",
            variant: "pending",
          }),
        );
        await waitForAppointmentFamilySelection(page, "family_network_live");
        const familyMarkers = await readAppointmentFamilyMarkers(page);
        const resolver = page.getByTestId("AppointmentManageEntryResolver");
        const selectedRow = page.getByTestId("appointment-family-row-family_network_live");
        assertCondition(
          (await resolver.getAttribute("data-resolution-kind")) === "read_only" &&
            (await resolver.getAttribute("data-stale-cta-suppressed")) === "true",
          "pending network family resolution stopped fencing stale manage actions",
        );
        assertCondition(
          (await selectedRow.getAttribute("data-status-state")) === "pending",
          "pending appointment family row lost the guarded pending status state",
        );

        raw.caseResults.push({
          caseId: "CHOICE340_006",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            familyRef: familyMarkers.selectedFamilyRef,
            entrySource: familyMarkers.entrySource,
            resolutionKind: await resolver.getAttribute("data-resolution-kind"),
            staleCtaSuppressed: await resolver.getAttribute("data-stale-cta-suppressed"),
          },
          notes: ["merged appointment family keeps pending hub truth honest"],
        });

        const ariaRef = writeJsonArtifact340(
          SPEC_SLUG,
          project.projectId,
          "aria",
          await captureAria(page.getByTestId("PatientAppointmentFamilyWorkspace"), page),
        );
        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(ariaRef, screenshotRef);

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
          notes: ["wide Chromium patient route exercised live choice and merged appointment family"],
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
        "patient_wide_desktop_firefox",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["CHOICE340_002"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkChoiceRoute(
          page,
          networkChoiceUrl(patientBaseUrl, {
            scenarioId: "offer_session_328_live",
            origin: "requests",
            returnRoute: "/requests",
          }),
        );
        const markers = await readNetworkChoiceMarkers(page);
        const firefoxOfferCount = await page.locator("[data-offer-card]").count();
        const firefoxText = await readBodyText340(page);
        assertCondition(markers.choiceActionability === "live_open_choice", "Firefox choice posture drifted");
        assertCondition(firefoxOfferCount === 4, `Firefox lost visible offer cards: ${firefoxOfferCount}`);
        assertCondition(
          firefoxText.includes("Recommendation chips are advisory only") &&
            firefoxText.includes("Request a callback instead"),
          "Firefox route lost advisory or callback copy",
        );
        assertCondition(
          (await page.locator("[role='radiogroup']").count()) === 1,
          "Firefox route lost the radiogroup structure",
        );

        raw.caseResults.push({
          caseId: "CHOICE340_002",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            visibleOfferCount: firefoxOfferCount,
            callbackFallbackSeparate: true,
            browserName: project.browserName,
          },
          notes: ["Firefox parity kept the same visible frontier and callback separation"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
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
          notes: ["Firefox parity project stayed aligned with the Chromium patient choice contract"],
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
        "patient_mobile_portrait_webkit",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["CHOICE340_003"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkChoiceRoute(
          page,
          networkChoiceUrl(patientBaseUrl, {
            scenarioId: "offer_session_328_live",
            origin: "appointments",
            returnRoute: "/appointments",
            host: "nhs_app",
            safeArea: "bottom",
          }),
        );
        const markers = await readNetworkChoiceMarkers(page);
        assertCondition(
          markers.embeddedMode === "nhs_app" && markers.safeAreaClass === "bottom",
          `WebKit embedded markers drifted: ${JSON.stringify(markers)}`,
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
        assertCondition(stickyFullyVisible, "WebKit sticky primary action was not fully visible");
        const webkitActionRef = await currentActionRef340(page);
        assertCondition(webkitActionRef === "accept_alternative_offer", "WebKit focus drifted off the dominant action");

        raw.caseResults.push({
          caseId: "CHOICE340_003",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            embeddedMode: markers.embeddedMode,
            safeAreaClass: markers.safeAreaClass,
            selectedOfferEntry: "offer_entry_328_riverside_1830",
          },
          notes: ["WebKit mobile project kept patient choice first-class in the NHS App host posture"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
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
          notes: ["Safari-equivalent patient project preserved sticky action reachability"],
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
      const caseIds = ["CHOICE340_005"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkChoiceRoute(
          page,
          networkChoiceUrl(patientBaseUrl, {
            scenarioId: "offer_session_328_publication_drift",
            origin: "secure_link",
            returnRoute: "/appointments",
          }),
        );
        const markers = await readNetworkChoiceMarkers(page);
        const pageText = await readBodyText340(page);
        assertCondition(markers.choiceActionability === "blocked", "publication drift lost blocked posture");
        await assertNoHorizontalOverflow(page, "340 patient high-zoom publication drift");
        assertCondition(
          pageText.includes("Publication drift blocked fresh choice") &&
            pageText.includes(
              "Publication drift keeps the option cards visible, but it must not leave stale accept or callback controls armed.",
            ),
          "publication drift copy no longer explains the fenced recovery posture",
        );
        assertCondition(
          (await page.getByRole("button", { name: "Accept this option" }).count()) === 0,
          "publication drift should not expose a live accept action",
        );
        assertCondition(
          (await page.getByTestId("alternative-offer-provenance-stub").count()) === 1,
          "publication drift lost the provenance stub",
        );

        raw.caseResults.push({
          caseId: "CHOICE340_005",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            choiceActionability: markers.choiceActionability,
            breakpointClass: markers.breakpointClass,
            missionStackState: markers.missionStackState,
            acceptActionVisible: false,
          },
          notes: ["high-zoom publication drift preserved read-only provenance without stale controls"],
        });

        const ariaRef = writeJsonArtifact340(
          SPEC_SLUG,
          project.projectId,
          "aria",
          await captureAria(page.getByTestId("Patient_Network_Alternative_Choice_Route"), page),
        );
        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(ariaRef, screenshotRef);
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
          notes: ["high-zoom reflow project kept blocked publication drift readable and fenced"],
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
        "hub_operator_wide_chromium",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["CHOICE340_007"];
      trackExternalRequests(page, hubBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openHubRoute(page, `${hubBaseUrl}/hub/queue`, "hub-start-of-day");
        const queueOptionCount = await page.locator("[data-option-card]").count();
        const queueDiagnosticOnlyCount = await page
          .locator("[data-option-card][data-offerability-state='diagnostic_only']")
          .count();
        const patientOfferableCount = await page
          .locator("[data-option-card][data-offerability-state='patient_offerable']")
          .count();
        assertCondition(queueOptionCount >= 3, `hub alternatives lost ranked cards: ${queueOptionCount}`);
        assertCondition(
          queueDiagnosticOnlyCount >= 1,
          "hub alternatives hid diagnostic-only warned options on the live queue route",
        );
        assertCondition(
          patientOfferableCount >= 1,
          "hub alternatives lost patient-offerable options on the live queue route",
        );

        await page.getByTestId("hub-saved-view-callback_recovery").click();
        const recoveryOptionCount = await page.locator("[data-option-card]").count();
        const recoveryDiagnosticOnlyCount = await page
          .locator("[data-option-card][data-offerability-state='diagnostic_only']")
          .count();
        const callbackFallbackCard = page.getByTestId("hub-callback-fallback");
        assertCondition(
          (await callbackFallbackCard.count()) === 1,
          "hub alternatives lost the separate callback fallback card",
        );
        assertCondition(
          recoveryOptionCount >= 2 && recoveryDiagnosticOnlyCount >= 1,
          "hub callback recovery lost the ranked diagnostic stack",
        );
        assertCondition(
          ((await callbackFallbackCard.textContent()) ?? "").includes("Governed callback fallback"),
          "hub alternatives no longer explain the separate callback fallback path",
        );

        raw.caseResults.push({
          caseId: "CHOICE340_007",
          projectId: project.projectId,
          surfaceFamily: "patient_choice_truth",
          status: "passed",
          artifactRefs: [],
          metrics: {
            route: "/hub/queue",
            visibleOptionCount: queueOptionCount,
            diagnosticOnlyCount: queueDiagnosticOnlyCount,
            patientOfferableCount,
            callbackFallbackSeparate: true,
            callbackRecoveryOptionCount: recoveryOptionCount,
            callbackRecoveryDiagnosticOnlyCount: recoveryDiagnosticOnlyCount,
          },
          notes: ["hub-assisted alternatives kept diagnostic-only options visible and callback separate"],
        });

        const screenshotRef = await captureScreenshot340(page, SPEC_SLUG, project.projectId);
        artifactRefs.push(screenshotRef);
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
          notes: ["hub-assisted alternatives route stayed aligned with the choice law"],
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
    await Promise.all([stopPatientWeb(patientChild), stopHubDesk(hubChild)]);
  }

  writeRawSpecResult340(SPEC_SLUG, raw);

  if (failures.length > 0) {
    throw new AggregateError(failures, "340 patient choice truth and continuity failures");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
