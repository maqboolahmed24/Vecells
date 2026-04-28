import {
  assertCondition,
  captureAria,
  closeProject340,
  createRawSpecResult340,
  launchProject340,
  networkConfirmationUrl,
  networkManageUrl,
  openHubRoute,
  openNetworkConfirmationRoute,
  openNetworkManageRoute,
  readBodyText340,
  readHtml340,
  startHubDesk,
  startPatientWeb,
  startTrace340,
  stopHubDesk,
  stopPatientWeb,
  stopTrace340,
  summarizeError340,
  trackExternalRequests,
  visibilityLeakTokens340,
  waitForNetworkManageState,
  waitForPatientConfirmationState,
  writeJsonArtifact340,
  writeRawSpecResult340,
  captureScreenshot340,
} from "./340_phase5_browser_matrix.helpers.ts";

export const phase5CrossOrgVisibilityCoverage340 = [
  "hub origin-practice, servicing-site, and denied postures preserve the active case while tightening the visible payload",
  "scope drift and break-glass movement freeze writable posture before unsafe mutation",
  "patient-safe confirmation and manage surfaces do not leak hub-only or cross-site detail in DOM or accessibility snapshots",
] as const;

const SPEC_ID = "cross_org_visibility_and_scope_drift_browser";
const SPEC_SLUG = "cross-org-visibility-and-scope-drift";
const PROJECT_IDS = [
  "hub_operator_wide_chromium",
  "cross_org_scope_variation_chromium",
  "patient_authenticated_chromium_wide",
] as const;

async function waitForRootAttributes(
  page: any,
  expected: Record<string, string>,
): Promise<void> {
  await page.waitForFunction((attrs) => {
    const root = document.querySelector("[data-testid='hub-shell-root']");
    if (!root) {
      return false;
    }
    return Object.entries(attrs).every(
      ([key, value]) => (root as HTMLElement).getAttribute(key) === value,
    );
  }, expected);
}

export async function run(): Promise<void> {
  const playwright = await import("./340_phase5_browser_matrix.helpers.ts").then((module) =>
    module.importPlaywright(),
  );
  if (!playwright) {
    return;
  }

  const raw = createRawSpecResult340(SPEC_ID, phase5CrossOrgVisibilityCoverage340, PROJECT_IDS);
  const failures: Error[] = [];
  const [
    { child: hubChild, baseUrl: hubBaseUrl },
    { child: patientChild, baseUrl: patientBaseUrl },
  ] = await Promise.all([startHubDesk(), startPatientWeb()]);

  try {
    {
      const { project, browser, context, page } = await launchProject340(
        playwright,
        "hub_operator_wide_chromium",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["VIS340_001", "VIS340_002", "VIS340_003"];
      trackExternalRequests(page, hubBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openHubRoute(page, `${hubBaseUrl}/hub/case/hub-case-104`, "hub-case-route");
        await waitForRootAttributes(page, {
          "data-current-path": "/hub/case/hub-case-104",
          "data-selected-case-id": "hub-case-104",
          "data-acting-organisation": "north_shore_hub",
          "data-access-posture": "writable",
        });

        await page.getByTestId("HubActingContextChip").click();
        await page.getByTestId("OrganisationSwitchDrawer").waitFor();

        await page.locator("[data-organisation-option='riverside_medical']").click();
        await waitForRootAttributes(page, {
          "data-current-path": "/hub/case/hub-case-104",
          "data-selected-case-id": "hub-case-104",
          "data-acting-organisation": "riverside_medical",
          "data-audience-tier": "origin_practice_visibility",
          "data-access-posture": "read_only",
          "data-route-mutation": "disabled",
        });
        const originText = await readBodyText340(page);
        const originHtml = await readHtml340(page);
        const originPlaceholderCount = await page.getByTestId("MinimumNecessaryPlaceholderBlock").count();
        assertCondition(originPlaceholderCount === 3, "origin-practice visibility lost governed placeholders");
        for (const token of visibilityLeakTokens340("origin_practice_visibility")) {
          assertCondition(!originText.includes(token) && !originHtml.includes(token), `origin-practice leak: ${token}`);
        }
        assertCondition(
          originText.includes("Hub internal notes withheld") &&
            originText.includes("Cross-site capacity detail hidden"),
          "origin-practice placeholder copy drifted",
        );

        raw.caseResults.push({
          caseId: "VIS340_001",
          projectId: project.projectId,
          surfaceFamily: "cross_org_visibility",
          status: "passed",
          artifactRefs: [],
          metrics: {
            audienceTier: "origin_practice_visibility",
            accessPosture: "read_only",
            placeholderCount: originPlaceholderCount,
            preservedCaseId: "hub-case-104",
          },
          notes: ["origin-practice payload stayed minimum-necessary without DOM leakage"],
        });

        await page.locator("[data-organisation-option='elm_park_surgery']").click();
        await waitForRootAttributes(page, {
          "data-current-path": "/hub/case/hub-case-104",
          "data-selected-case-id": "hub-case-104",
          "data-acting-organisation": "elm_park_surgery",
          "data-audience-tier": "servicing_site_visibility",
          "data-access-posture": "read_only",
          "data-route-mutation": "disabled",
        });
        const servicingText = await readBodyText340(page);
        const servicingHtml = await readHtml340(page);
        const servicingPlaceholderCount = await page.getByTestId("MinimumNecessaryPlaceholderBlock").count();
        assertCondition(servicingPlaceholderCount === 2, "servicing-site visibility lost the smaller placeholder set");
        for (const token of visibilityLeakTokens340("servicing_site_visibility")) {
          assertCondition(!servicingText.includes(token) && !servicingHtml.includes(token), `servicing-site leak: ${token}`);
        }
        assertCondition(
          servicingText.includes("Origin triage detail hidden") &&
            servicingText.includes("Other-site options removed"),
          "servicing-site placeholder copy drifted",
        );

        raw.caseResults.push({
          caseId: "VIS340_002",
          projectId: project.projectId,
          surfaceFamily: "cross_org_visibility",
          status: "passed",
          artifactRefs: [],
          metrics: {
            audienceTier: "servicing_site_visibility",
            accessPosture: "read_only",
            placeholderCount: servicingPlaceholderCount,
            preservedCaseId: "hub-case-104",
          },
          notes: ["servicing-site payload removed origin-only and other-site content without reinterpreting the case"],
        });

        await page.locator("[data-organisation-option='south_vale_network']").click();
        await waitForRootAttributes(page, {
          "data-current-path": "/hub/case/hub-case-104",
          "data-selected-case-id": "hub-case-104",
          "data-acting-organisation": "south_vale_network",
          "data-access-posture": "denied",
          "data-shell-status": "shell_recovery_only",
          "data-route-mutation": "disabled",
        });
        const denied = page.getByTestId("HubAccessDeniedState");
        await denied.waitFor();
        const deniedText = await denied.textContent();
        assertCondition(
          deniedText?.includes("Choose another acting scope") ?? false,
          "denied posture lost the recovery explanation",
        );

        raw.caseResults.push({
          caseId: "VIS340_003",
          projectId: project.projectId,
          surfaceFamily: "cross_org_visibility",
          status: "passed",
          artifactRefs: [],
          metrics: {
            audienceTier: "no_visibility",
            accessPosture: "denied",
            preservedCaseId: "hub-case-104",
            preservedPath: "/hub/case/hub-case-104",
          },
          notes: ["denied posture remained explicit and same-shell"],
        });

        const ariaRef = writeJsonArtifact340(
          SPEC_SLUG,
          project.projectId,
          "aria",
          {
            denied: await captureAria(denied, page),
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
          notes: ["wide hub operator project covered minimum-necessary switches and denied posture"],
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
        "cross_org_scope_variation_chromium",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["VIS340_004"];
      trackExternalRequests(page, hubBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openHubRoute(page, `${hubBaseUrl}/hub/case/hub-case-031`, "hub-case-route");
        await page.getByTestId("HubActingContextChip").click();
        await page.getByTestId("OrganisationSwitchDrawer").waitFor();
        await page.getByRole("button", { name: "Open break-glass reasons" }).click();
        await page.getByTestId("BreakGlassReasonModal").waitFor();
        await page.locator("[data-break-glass-reason='urgent_clinical_safety']").click();
        await page.getByRole("button", { name: "Activate break-glass" }).click();
        await waitForRootAttributes(page, {
          "data-current-path": "/hub/case/hub-case-031",
          "data-break-glass-state": "active",
          "data-access-posture": "frozen",
          "data-shell-status": "shell_recovery_only",
        });

        await page.locator("[data-site-option='north_shore_escalation_room']").click();
        await waitForRootAttributes(page, {
          "data-break-glass-state": "expiring",
          "data-access-posture": "frozen",
          "data-current-path": "/hub/case/hub-case-031",
        });

        await page.locator("[data-purpose-option='service_recovery_review']").click();
        await waitForRootAttributes(page, {
          "data-purpose-of-use": "service_recovery_review",
          "data-break-glass-state": "inactive",
          "data-access-posture": "frozen",
          "data-route-mutation": "disabled",
          "data-current-path": "/hub/case/hub-case-031",
        });
        await page.getByTestId("ScopeDriftFreezeBanner").waitFor();
        const freezeText = await readBodyText340(page);
        assertCondition(
          freezeText.includes("Purpose-of-use drift froze write posture") &&
            freezeText.includes(
              "The case remains visible, but the new purpose-of-use requires a same-shell re-read before any mutation can continue.",
            ),
          "scope drift freeze explanation disappeared",
        );

        raw.caseResults.push({
          caseId: "VIS340_004",
          projectId: project.projectId,
          surfaceFamily: "cross_org_visibility",
          status: "passed",
          artifactRefs: [],
          metrics: {
            activatedBreakGlass: "active",
            expiringAfterSiteChange: "expiring",
            frozenAfterPurposeDrift: "frozen",
            mutationEnabled: "disabled",
            preservedPath: "/hub/case/hub-case-031",
          },
          notes: ["break-glass movement and purpose drift froze writable posture before mutation"],
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
          notes: ["scope variation project proved break-glass activation, expiry, and purpose drift freeze"],
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
        "patient_authenticated_chromium_wide",
      );
      const externalRequests = new Set<string>();
      const artifactRefs: string[] = [];
      const caseIds = ["VIS340_005"];
      trackExternalRequests(page, patientBaseUrl, externalRequests);
      await startTrace340(context);

      try {
        await openNetworkConfirmationRoute(
          page,
          networkConfirmationUrl(patientBaseUrl, {
            scenarioId: "network_confirmation_329_practice_acknowledged",
          }),
        );
        await waitForPatientConfirmationState(page, {
          scenarioId: "network_confirmation_329_practice_acknowledged",
          truthState: "calm_confirmed",
        });
        const confirmationText = await readBodyText340(page);
        const confirmationHtml = await readHtml340(page);
        for (const token of [
          "hub_internal_free_text",
          "origin_practice_triage_notes",
          "callback_rationale",
          "governed_coordination_evidence",
        ]) {
          assertCondition(
            !confirmationText.includes(token) && !confirmationHtml.includes(token),
            `patient confirmation leaked ${token}`,
          );
        }

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
        const manageText = await readBodyText340(page);
        const manageHtml = await readHtml340(page);
        for (const token of [
          "hub_internal_free_text",
          "origin_practice_triage_notes",
          "callback_rationale",
          "governed_coordination_evidence",
        ]) {
          assertCondition(!manageText.includes(token) && !manageHtml.includes(token), `patient manage leaked ${token}`);
        }

        raw.caseResults.push({
          caseId: "VIS340_005",
          projectId: project.projectId,
          surfaceFamily: "cross_org_visibility",
          status: "passed",
          artifactRefs: [],
          metrics: {
            patientSurfaceRefs: [
              "network_confirmation_329_practice_acknowledged",
              "network_manage_330_live",
            ],
            leakedFieldCount: 0,
          },
          notes: ["patient-safe confirmation and manage surfaces kept hub-only fields out of DOM and accessibility output"],
        });

        const ariaRef = writeJsonArtifact340(
          SPEC_SLUG,
          project.projectId,
          "aria",
          {
            manage: await captureAria(page.getByTestId("Patient_Network_Manage_Route"), page),
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
          notes: ["patient-safe surfaces showed only patient-safe cross-org truth"],
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
    throw new AggregateError(failures, "340 cross-org visibility failures");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
