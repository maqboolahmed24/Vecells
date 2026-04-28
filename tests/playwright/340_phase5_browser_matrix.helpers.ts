import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";
import {
  captureAria,
  openHubRoute,
  readQueueOrder,
  startHubDesk,
  stopHubDesk,
  waitForHubRootState,
} from "./327_hub_queue.helpers.ts";
import {
  assertFocusableVisible,
  networkChoiceUrl,
  openNetworkChoiceRoute,
  readNetworkChoiceMarkers,
  waitForNetworkChoiceState,
} from "./328_network_alternative_choice.helpers.ts";
import {
  networkConfirmationUrl,
  openNetworkConfirmationRoute,
  readHubCommitMarkers,
  readPatientConfirmationMarkers,
  waitForHubCommitPosture,
  waitForPatientConfirmationState,
} from "./329_commit_confirmation.helpers.ts";
import {
  networkManageUrl,
  openNetworkManageRoute,
  readNetworkManageMarkers,
  waitForNetworkManageState,
} from "./330_network_manage.helpers.ts";
import {
  appointmentFamilyUrl,
  openAppointmentFamilyRoute,
  readAppointmentFamilyMarkers,
  waitForAppointmentFamilySelection,
} from "./337_appointment_family.helpers.ts";
import {
  EXPECTED_VISIBLE_FIELDS_338,
  SECRET_VISIBILITY_FIELDS_338,
  type VisibilityAudienceTier338,
} from "../integration/338_scope_capacity.helpers.ts";

export {
  appointmentFamilyUrl,
  EXPECTED_VISIBLE_FIELDS_338,
  SECRET_VISIBILITY_FIELDS_338,
  assertCondition,
  assertFocusableVisible,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  networkChoiceUrl,
  networkConfirmationUrl,
  networkManageUrl,
  openAppointmentFamilyRoute,
  openHubRoute,
  openNetworkChoiceRoute,
  openNetworkConfirmationRoute,
  openNetworkManageRoute,
  outputPath,
  readAppointmentFamilyMarkers,
  readHubCommitMarkers,
  readNetworkChoiceMarkers,
  readNetworkManageMarkers,
  readPatientConfirmationMarkers,
  readQueueOrder,
  startHubDesk,
  startPatientWeb,
  stopHubDesk,
  stopPatientWeb,
  trackExternalRequests,
  waitForAppointmentFamilySelection,
  waitForHubCommitPosture,
  waitForHubRootState,
  waitForNetworkChoiceState,
  waitForNetworkManageState,
  waitForPatientConfirmationState,
  writeAccessibilitySnapshot,
};

export type BrowserEngine340 = "chromium" | "firefox" | "webkit";
export type AuthProfile340 = "hub_operator_authenticated" | "patient_authenticated";

export interface BrowserProject340 {
  readonly projectId: string;
  readonly browserName: BrowserEngine340;
  readonly authProfile: AuthProfile340;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly breakpointRef:
    | "wide"
    | "narrow_desktop"
    | "tablet_portrait"
    | "tablet_landscape"
    | "mobile_portrait"
    | "high_zoom_reflow";
  readonly orientation: "portrait" | "landscape";
  readonly reducedMotion: boolean;
  readonly highZoomProxy: boolean;
  readonly scopeVariation: boolean;
  readonly hostMode: "browser" | "nhs_app";
  readonly hasTouch: boolean;
  readonly isMobile: boolean;
  readonly description: string;
}

export const PHASE5_BROWSER_PROJECTS_340 = [
  {
    projectId: "hub_operator_wide_chromium",
    browserName: "chromium",
    authProfile: "hub_operator_authenticated",
    viewport: { width: 1520, height: 1120 },
    breakpointRef: "wide",
    orientation: "landscape",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "Wide desktop Chromium for the default hub operator shell.",
  },
  {
    projectId: "hub_operator_narrow_chromium",
    browserName: "chromium",
    authProfile: "hub_operator_authenticated",
    viewport: { width: 1100, height: 920 },
    breakpointRef: "narrow_desktop",
    orientation: "landscape",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "Narrow desktop Chromium for folded shell degradation.",
  },
  {
    projectId: "hub_operator_tablet_portrait_chromium",
    browserName: "chromium",
    authProfile: "hub_operator_authenticated",
    viewport: { width: 834, height: 1112 },
    breakpointRef: "tablet_portrait",
    orientation: "portrait",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: true,
    isMobile: false,
    description: "Tablet portrait Chromium for hub mission-stack continuity.",
  },
  {
    projectId: "hub_operator_tablet_landscape_chromium",
    browserName: "chromium",
    authProfile: "hub_operator_authenticated",
    viewport: { width: 1112, height: 834 },
    breakpointRef: "tablet_landscape",
    orientation: "landscape",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: true,
    isMobile: false,
    description: "Tablet landscape Chromium for hub mission-stack continuity.",
  },
  {
    projectId: "patient_authenticated_chromium_wide",
    browserName: "chromium",
    authProfile: "patient_authenticated",
    viewport: { width: 1440, height: 1080 },
    breakpointRef: "wide",
    orientation: "landscape",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "Wide desktop Chromium for patient-authenticated routes.",
  },
  {
    projectId: "patient_wide_desktop_firefox",
    browserName: "firefox",
    authProfile: "patient_authenticated",
    viewport: { width: 1440, height: 1080 },
    breakpointRef: "wide",
    orientation: "landscape",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "Wide desktop Firefox parity proof for patient choice surfaces.",
  },
  {
    projectId: "patient_mobile_portrait_chromium",
    browserName: "chromium",
    authProfile: "patient_authenticated",
    viewport: { width: 390, height: 844 },
    breakpointRef: "mobile_portrait",
    orientation: "portrait",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: true,
    isMobile: true,
    description: "Mobile portrait Chromium for patient same-shell continuity.",
  },
  {
    projectId: "patient_mobile_portrait_webkit",
    browserName: "webkit",
    authProfile: "patient_authenticated",
    viewport: { width: 390, height: 844 },
    breakpointRef: "mobile_portrait",
    orientation: "portrait",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "nhs_app",
    hasTouch: true,
    isMobile: true,
    description: "Mobile portrait WebKit for Safari-equivalent patient proof.",
  },
  {
    projectId: "hub_operator_reduced_motion_chromium",
    browserName: "chromium",
    authProfile: "hub_operator_authenticated",
    viewport: { width: 1280, height: 960 },
    breakpointRef: "wide",
    orientation: "landscape",
    reducedMotion: true,
    highZoomProxy: false,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "Reduced-motion Chromium for hub shell transition proof.",
  },
  {
    projectId: "patient_high_zoom_reflow_chromium",
    browserName: "chromium",
    authProfile: "patient_authenticated",
    viewport: { width: 320, height: 800 },
    breakpointRef: "high_zoom_reflow",
    orientation: "portrait",
    reducedMotion: false,
    highZoomProxy: true,
    scopeVariation: false,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "320 CSS px / 400% zoom proxy for patient reflow and sticky focus proof.",
  },
  {
    projectId: "cross_org_scope_variation_chromium",
    browserName: "chromium",
    authProfile: "hub_operator_authenticated",
    viewport: { width: 1500, height: 1120 },
    breakpointRef: "wide",
    orientation: "landscape",
    reducedMotion: false,
    highZoomProxy: false,
    scopeVariation: true,
    hostMode: "browser",
    hasTouch: false,
    isMobile: false,
    description: "Cross-organisation tuple drift, break-glass, and denial proof project.",
  },
] as const satisfies readonly BrowserProject340[];

export const PHASE5_BROWSER_PROJECTS_BY_ID_340 = Object.fromEntries(
  PHASE5_BROWSER_PROJECTS_340.map((project) => [project.projectId, project]),
) as Record<string, BrowserProject340>;

export interface RawCaseResult340 {
  readonly caseId: string;
  readonly projectId: string;
  readonly surfaceFamily:
    | "patient_choice_truth"
    | "cross_org_visibility"
    | "responsive_continuity"
    | "accessibility_content";
  readonly status: "passed" | "failed" | "unsupported";
  readonly artifactRefs: readonly string[];
  readonly metrics?: Record<string, unknown>;
  readonly notes?: readonly string[];
}

export interface RawProjectRun340 {
  readonly projectId: string;
  readonly browserName: BrowserEngine340;
  readonly authProfile: AuthProfile340;
  readonly breakpointRef: BrowserProject340["breakpointRef"];
  readonly orientation: BrowserProject340["orientation"];
  readonly reducedMotion: boolean;
  readonly highZoomProxy: boolean;
  readonly scopeVariation: boolean;
  readonly status: "passed" | "failed" | "unsupported";
  readonly caseIds: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly notes?: readonly string[];
  readonly errorMessage?: string;
}

export interface RawSpecResult340 {
  readonly taskId: "seq_340_phase5_browser_suite";
  readonly specId: string;
  readonly generatedAt: string;
  readonly coverage: readonly string[];
  readonly projectIds: readonly string[];
  readonly statusVocabulary: readonly ["passed", "failed", "unsupported"];
  readonly projectRuns: RawProjectRun340[];
  readonly caseResults: RawCaseResult340[];
  readonly unsupportedGapRefs: readonly string[];
}

export function createRawSpecResult340(
  specId: string,
  coverage: readonly string[],
  projectIds: readonly string[],
): RawSpecResult340 {
  return {
    taskId: "seq_340_phase5_browser_suite",
    specId,
    generatedAt: new Date().toISOString(),
    coverage,
    projectIds,
    statusVocabulary: ["passed", "failed", "unsupported"],
    projectRuns: [],
    caseResults: [],
    unsupportedGapRefs: [],
  };
}

export function artifactBasename340(
  specSlug: string,
  projectId: string,
  kind: string,
  extension: "json" | "png" | "zip",
): string {
  return `340-${specSlug}-${projectId}-${kind}.${extension}`;
}

export function artifactRef340(
  specSlug: string,
  projectId: string,
  kind: string,
  extension: "json" | "png" | "zip",
): string {
  return `output/playwright/${artifactBasename340(specSlug, projectId, kind, extension)}`;
}

export async function launchProject340(
  playwright: Awaited<ReturnType<typeof importPlaywright>>,
  projectId: string,
): Promise<{
  readonly project: BrowserProject340;
  readonly browser: any;
  readonly context: any;
  readonly page: any;
}> {
  const project = PHASE5_BROWSER_PROJECTS_BY_ID_340[projectId];
  assertCondition(project, `unknown 340 project ${projectId}`);

  const browser = await playwright[project.browserName].launch({ headless: true });
  const context = await browser.newContext({
    viewport: project.viewport,
    locale: "en-GB",
    timezoneId: "Europe/London",
    colorScheme: "light",
    reducedMotion: project.reducedMotion ? "reduce" : "no-preference",
    hasTouch: project.hasTouch,
    isMobile: project.isMobile,
  });
  const page = await context.newPage();
  return { project, browser, context, page };
}

export async function startTrace340(context: any): Promise<void> {
  await context.tracing.start({ screenshots: true, snapshots: true });
}

export async function stopTrace340(
  context: any,
  specSlug: string,
  projectId: string,
): Promise<string> {
  const fileName = artifactBasename340(specSlug, projectId, "trace", "zip");
  await context.tracing.stop({ path: outputPath(fileName) });
  return artifactRef340(specSlug, projectId, "trace", "zip");
}

export async function captureScreenshot340(
  page: any,
  specSlug: string,
  projectId: string,
  kind = "baseline",
): Promise<string> {
  const fileName = artifactBasename340(specSlug, projectId, kind, "png");
  await page.screenshot({
    path: outputPath(fileName),
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
  return artifactRef340(specSlug, projectId, kind, "png");
}

export function writeJsonArtifact340(
  specSlug: string,
  projectId: string,
  kind: string,
  payload: unknown,
): string {
  const fileName = artifactBasename340(specSlug, projectId, kind, "json");
  fs.writeFileSync(outputPath(fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return artifactRef340(specSlug, projectId, kind, "json");
}

export function writeRawSpecResult340(specSlug: string, payload: RawSpecResult340): string {
  const fileName = `340-${specSlug}-matrix.json`;
  fs.writeFileSync(outputPath(fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return `output/playwright/${fileName}`;
}

export function summarizeError340(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

export async function readBodyText340(page: any): Promise<string> {
  const text = await page.locator("body").innerText();
  return text.replace(/\s+/g, " ").trim();
}

export async function readHtml340(page: any): Promise<string> {
  return page.content();
}

export function assertTokensAbsent340(
  haystack: string,
  tokens: readonly string[],
  label: string,
): void {
  const leaked = tokens.filter((token) => haystack.includes(token));
  assertCondition(leaked.length === 0, `${label} leaked tokens: ${leaked.join(", ")}`);
}

export async function currentActionRef340(page: any): Promise<string | null> {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return (
      active?.getAttribute("data-action-ref") ??
      active?.closest("[data-action-ref]")?.getAttribute("data-action-ref") ??
      null
    );
  });
}

export function visibilityLeakTokens340(
  audienceTier: VisibilityAudienceTier338,
): readonly string[] {
  if (audienceTier === "servicing_site_visibility") {
    return [...SECRET_VISIBILITY_FIELDS_338, "callback_rationale"] as const;
  }
  return SECRET_VISIBILITY_FIELDS_338;
}

export async function closeProject340(
  browser: any,
  context: any,
): Promise<void> {
  await context.close().catch(() => undefined);
  await browser.close().catch(() => undefined);
}
