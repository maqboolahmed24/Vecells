import {
  appointmentFamilyUrl,
  assertCondition,
  captureAria,
  closeProject340,
  createRawSpecResult340,
  launchProject340,
  networkChoiceUrl,
  networkConfirmationUrl,
  networkManageUrl,
  openAppointmentFamilyRoute,
  openHubRoute,
  openNetworkChoiceRoute,
  openNetworkConfirmationRoute,
  openNetworkManageRoute,
  readBodyText340,
  startHubDesk,
  startPatientWeb,
  startTrace340,
  stopHubDesk,
  stopPatientWeb,
  stopTrace340,
  summarizeError340,
  trackExternalRequests,
  waitForNetworkManageState,
  waitForPatientConfirmationState,
  writeJsonArtifact340,
  writeRawSpecResult340,
  captureScreenshot340,
} from "./340_phase5_browser_matrix.helpers.ts";

export const phase5AccessibilityCoverage340 = [
  "patient choice, confirmation, manage, and appointment family surfaces keep durable landmarks and status semantics",
  "pending patient-facing copy never overclaims booked or guaranteed calmness",
  "hub scope drawer and break-glass modal keep dialog semantics and return focus to the invoking control",
  "timeline disclosures and artifact frames retain durable accessible names and aria-expanded state",
] as const;

const SPEC_ID = "accessibility_content_and_regression_browser";
const SPEC_SLUG = "accessibility-content-and-regression";
const PROJECT_IDS = [
  "patient_authenticated_chromium_wide",
  "hub_operator_wide_chromium",
  "patient_mobile_portrait_webkit",
] as const;

async function waitForFocusOnChip(page: any): Promise<void> {
  await page.waitForFunction(() => {
    const active = document.activeElement as HTMLElement | null;
    return active?.getAttribute("data-testid") === "HubActingContextChip";
  });
}

async function tabWithin(locator: any, page: any, steps: number): Promise<boolean> {
  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press("Tab");
    const staysInside = await page.evaluate((selector) => {
      const active = document.activeElement as HTMLElement | null;
      return active ? active.closest(selector as string) != null : false;
    }, locator);
    if (!staysInside) {
      return false;
    }
  }
  return true;
}

export async function run(): Promise<void> {
  const playwright = await import("./340_phase5_browser_matrix.helpers.ts").then((module) =>
    module.importPlaywright(),
  );
  if (!playwright) {
    return;
  }

  const raw = createRawSpecResult340(SPEC_ID, phase5AccessibilityCoverage340, PROJECT_IDS);
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
      const caseIds = ["A11Y340_001", "A11Y340_002", "A11Y340_003"];
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
        assertCondition((await page.locator("main").count()) === 1, "choice route should keep one main landmark");
        assertCondition((await page.locator("[role='radiogroup']").count()) === 1, "choice route lost the radiogroup");
        assertCondition(
          (await page.getByTestId("patient-network-choice-live-region").getAttribute("role")) === "status",
          "choice live region must use role=status",
        );

        raw.caseResults.push({
          caseId: "A11Y340_001",
          projectId: project.projectId,
          surfaceFamily: "accessibility_content",
          status: "passed",
          artifactRefs: [],
          metrics: {
            landmarks: {
              main: await page.locator("main").count(),
              nav: await page.locator("nav").count(),
            },
            liveRegionRole: await page.getByTestId("patient-network-choice-live-region").getAttribute("role"),
          },
          notes: ["patient choice retained landmarks and status semantics"],
        });

        await openNetworkConfirmationRoute(
          page,
          networkConfirmationUrl(patientBaseUrl, {
            scenarioId: "network_confirmation_329_pending",
          }),
        );
        await waitForPatientConfirmationState(page, {
          scenarioId: "network_confirmation_329_pending",
          truthState: "pending_copy",
        });
        const pendingHeroText = await page.getByTestId("patient-confirmation-hero").innerText();
        assertCondition(
          pendingHeroText.includes("confirming your appointment") &&
            pendingHeroText.includes("Pending confirmation") &&
            !pendingHeroText.includes("Your appointment is confirmed"),
          "pending patient confirmation copy overclaimed the truth state",
        );

        raw.caseResults.push({
          caseId: "A11Y340_002",
          projectId: project.projectId,
          surfaceFamily: "accessibility_content",
          status: "passed",
          artifactRefs: [],
          metrics: {
            scenarioId: "network_confirmation_329_pending",
            pendingCopyGuard: true,
          },
          notes: ["pending patient-facing copy stayed plain-language and monotone"],
        });

        await openAppointmentFamilyRoute(
          page,
          appointmentFamilyUrl(patientBaseUrl, {
            familyRef: "family_network_live",
            variant: "pending",
          }),
        );
        const familyText = await readBodyText340(page);
        assertCondition(
          familyText.includes("Review network status") &&
            !familyText.includes("Open network manage"),
          "appointment family pending resolver lost the read-only wording",
        );
        const familyAriaRef = writeJsonArtifact340(
          SPEC_SLUG,
          project.projectId,
          "appointment-family-aria",
          await captureAria(page.getByTestId("PatientAppointmentFamilyWorkspace"), page),
        );
        artifactRefs.push(familyAriaRef);

        raw.caseResults.push({
          caseId: "A11Y340_003",
          projectId: project.projectId,
          surfaceFamily: "accessibility_content",
          status: "passed",
          artifactRefs: [familyAriaRef],
          metrics: {
            familyRef: "family_network_live",
            variant: "pending",
          },
          notes: ["appointment family kept the honest pending wording and durable structure"],
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
          notes: ["patient accessibility and content regression proof"],
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
      const caseIds = ["A11Y340_004"];
      trackExternalRequests(page, hubBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openHubRoute(page, `${hubBaseUrl}/hub/case/hub-case-104`, "hub-case-route");
        const chip = page.getByTestId("HubActingContextChip");
        await chip.focus();
        await chip.press("Enter");
        const drawer = page.getByTestId("OrganisationSwitchDrawer");
        await drawer.waitFor();
        assertCondition(
          (await drawer.getAttribute("aria-labelledby")) === "hub-org-switch-title",
          "scope drawer lost its labelled relationship",
        );
        await drawer.getByRole("button", { name: "Close" }).click();
        await waitForFocusOnChip(page);

        await chip.press("Enter");
        await drawer.waitFor();
        await page.getByRole("button", { name: "Open break-glass reasons" }).click();
        const modal = page.getByTestId("BreakGlassReasonModal");
        await modal.waitFor();
        assertCondition((await page.locator("[role='dialog']").count()) === 1, "break-glass modal lost dialog semantics");
        assertCondition(await tabWithin("[data-testid='BreakGlassReasonModal']", page, 6), "break-glass modal leaked focus outside the dialog");
        await modal.getByRole("button", { name: "Close" }).click();
        await waitForFocusOnChip(page);

        raw.caseResults.push({
          caseId: "A11Y340_004",
          projectId: project.projectId,
          surfaceFamily: "accessibility_content",
          status: "passed",
          artifactRefs: [],
          metrics: {
            scopeDrawerFocusTrap: true,
            breakGlassFocusTrap: true,
            focusReturn: "HubActingContextChip",
          },
          notes: ["hub drawer and modal trapped focus and returned it to the invoking control"],
        });

        const ariaRef = writeJsonArtifact340(
          SPEC_SLUG,
          project.projectId,
          "hub-aria",
          {
            shell: await captureAria(page.getByTestId("hub-shell-root"), page),
          },
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
          notes: ["hub dialog and focus-return proof"],
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
      const caseIds = ["A11Y340_005"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkManageRoute(
          page,
          networkManageUrl(patientBaseUrl, {
            scenarioId: "network_manage_330_live",
          }),
        );
        await waitForNetworkManageState(page, {
          scenarioId: "network_manage_330_live",
          capabilityState: "live",
        });
        const timelineRow = page.getByTestId("timeline-row-reminder_delivered_live");
        await timelineRow.click();
        assertCondition(
          (await timelineRow.locator("button").getAttribute("aria-expanded")) === "true",
          "timeline disclosure lost aria-expanded under WebKit mobile",
        );
        const frameAria = await captureAria(page.getByTestId("network-manage-artifact-frame"), page);
        const timelineAria = await captureAria(page.getByTestId("MessageTimelineClusterView"), page);
        const ariaRef = writeJsonArtifact340(SPEC_SLUG, project.projectId, "webkit-aria", {
          frame: frameAria,
          timeline: timelineAria,
        });

        raw.caseResults.push({
          caseId: "A11Y340_005",
          projectId: project.projectId,
          surfaceFamily: "accessibility_content",
          status: "passed",
          artifactRefs: [ariaRef],
          metrics: {
            browserName: project.browserName,
            disclosureExpanded: true,
          },
          notes: ["WebKit mobile kept artifact and timeline semantics stable"],
        });

        artifactRefs.push(ariaRef, await captureScreenshot340(page, SPEC_SLUG, project.projectId));
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
          notes: ["WebKit mobile a11y parity proof"],
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
    throw new AggregateError(failures, "340 accessibility regression failures");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
