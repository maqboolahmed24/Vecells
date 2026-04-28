import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import type { ChildProcess } from "node:child_process";

import {
  BOOKING_ENTRY_FIXTURE_IDS,
  activeElementSummary,
  bookingEntryUrl,
  openBookingEntryRoute,
  readReturnBinder as readEntryReturnBinder,
} from "./300_record_origin_booking_entry.helpers.ts";
import {
  BOOKING_ARTIFACT_FIXTURE_URLS,
  bookingArtifactUrl,
  readArtifactMarkers,
} from "./303_booking_artifact_parity.helpers.ts";
import {
  BOOKING_RESPONSIVE_FIXTURE_URLS,
  assertFocusableVisible,
  bookingResponsiveUrl,
  readRootResponsiveMarkers,
} from "./302_booking_mobile_responsive.helpers.ts";
import {
  DEFAULT_BOOKING_CASE_ID,
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  openStaffBookingRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  waitForStaffBookingCase,
} from "./299_staff_booking_handoff_panel.helpers.ts";
import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export {
  BOOKING_ARTIFACT_FIXTURE_URLS,
  BOOKING_ENTRY_FIXTURE_IDS,
  BOOKING_RESPONSIVE_FIXTURE_URLS,
  DEFAULT_BOOKING_CASE_ID,
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  activeElementSummary,
  assertCondition,
  assertFocusableVisible,
  assertNoHorizontalOverflow,
  bookingArtifactUrl,
  bookingEntryUrl,
  bookingResponsiveUrl,
  importPlaywright,
  openBookingEntryRoute,
  openBookingRoute,
  openStaffBookingRoute,
  outputPath,
  readArtifactMarkers,
  readEntryReturnBinder,
  readRootResponsiveMarkers,
  startClinicalWorkspace,
  startPatientWeb,
  startStaticServer,
  stopClinicalWorkspace,
  stopPatientWeb,
  trackExternalRequests,
  waitForStaffBookingCase,
  writeAccessibilitySnapshot,
};

export const PATIENT_WORKSPACE_ROOT_SELECTOR = "[data-testid='Patient_Booking_Workspace_Route']";
export const PATIENT_CONFIRMATION_STAGE_SELECTOR = "[data-testid='booking-confirmation-stage']";
export const PATIENT_MANAGE_STAGE_SELECTOR = "[data-testid='patient-appointment-manage-view']";
export const PATIENT_ARTIFACT_STAGE_SELECTOR = "[data-testid='patient-booking-artifact-frame']";

export const BOOKING_309_PATIENT_PATHS = {
  homeWorkspace:
    "/bookings/booking_case_293_live?origin=home&returnRoute=/home&anchor=home-booking-launch&anchorLabel=Home%20next%20action",
  requestsWorkspace:
    "/bookings/booking_case_293_live?origin=requests&returnRoute=/requests&anchor=requests-booking-launch&anchorLabel=Requests%20list",
  appointmentsWorkspace:
    "/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments&anchor=appointments-upcoming&anchorLabel=Appointments%20summary",
  selection:
    "/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments",
  partialSelection:
    "/bookings/booking_case_294_partial/select?origin=appointments&returnRoute=/appointments",
  exclusiveSelection:
    "/bookings/booking_case_295_exclusive_hold/select?origin=appointments&returnRoute=/appointments",
  confirmationReview:
    "/bookings/booking_case_296_review/confirm?origin=appointments&returnRoute=/appointments",
  confirmationPending:
    "/bookings/booking_case_296_pending/confirm?origin=appointments&returnRoute=/appointments",
  confirmationConfirmed:
    "/bookings/booking_case_296_confirmed/confirm?origin=appointments&returnRoute=/appointments",
  confirmationReconciliation:
    "/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments",
  manageReady:
    "/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments",
  managePending:
    "/bookings/booking_case_296_pending/manage?origin=appointments&returnRoute=/appointments",
  manageStale:
    "/bookings/booking_case_297_stale/manage?origin=appointments&returnRoute=/appointments",
  waitlistOffer:
    "/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments",
  waitlistExpired:
    "/bookings/booking_case_298_offer_expired/waitlist?origin=appointments&returnRoute=/appointments",
  waitlistFallbackDue:
    "/bookings/booking_case_298_fallback_due/waitlist?origin=appointments&returnRoute=/appointments",
  secureHandoff: "/bookings/booking_case_306_handoff_live",
  securePending: "/bookings/booking_case_306_confirmation_pending/confirm",
  secureConfirmedManage: "/bookings/booking_case_306_confirmed/manage",
  secureReopened: "/bookings/booking_case_306_reopened",
} as const;

export const BOOKING_309_STAFF_PATHS = {
  compareLive: "/workspace/bookings",
  pendingConfirmation: "/workspace/bookings/booking_case_299_pending_confirmation",
  staleRecovery: "/workspace/bookings/booking_case_299_stale_recovery",
  linkageRequired: "/workspace/bookings/booking_case_299_linkage_required",
  confirmed: "/workspace/bookings/booking_case_299_confirmed",
} as const;

export function patientPathUrl(
  baseUrl: string,
  key: keyof typeof BOOKING_309_PATIENT_PATHS,
): string {
  return `${baseUrl}${BOOKING_309_PATIENT_PATHS[key]}`;
}

export function secureLinkUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl}${pathname}?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link`;
}

export async function readWorkspaceReturnBinder(page: any): Promise<Record<string, string | null>> {
  const binder = page.locator("[data-testid='booking-return-contract-binder']");
  await binder.waitFor({ state: "attached" });
  return await binder.evaluate((node: HTMLElement) => ({
    returnRouteRef: node.getAttribute("data-return-route-ref"),
    selectedAnchorRef: node.getAttribute("data-selected-anchor-ref"),
    shellContinuityKey: node.getAttribute("data-shell-continuity-key"),
    tupleHash: node.getAttribute("data-selected-anchor-tuple-hash"),
  }));
}

export async function readPatientWorkspaceMarkers(page: any) {
  const root = page.getByTestId("Patient_Booking_Workspace_Route");
  await root.waitFor();
  return {
    routeKey: await root.getAttribute("data-route-key"),
    originKey: await root.getAttribute("data-origin-key"),
    notificationState: await root.getAttribute("data-notification-state"),
    selectedAnchorRef: await root.getAttribute("data-selected-anchor-ref"),
    capabilityPosture: await root.getAttribute("data-capability-posture"),
    motionProfile: await root.getAttribute("data-motion-profile"),
    breakpointClass: await root.getAttribute("data-breakpoint-class"),
    safeAreaClass: await root.getAttribute("data-safe-area-class"),
    stickyActionPosture: await root.getAttribute("data-sticky-action-posture"),
    embeddedMode: await root.getAttribute("data-embedded-mode"),
  };
}

export async function readConfirmationMarkers(page: any) {
  const stage = page.getByTestId("booking-confirmation-stage");
  await stage.waitFor();
  return {
    confirmationTruth: await stage.getAttribute("data-confirmation-truth"),
    patientVisibility: await stage.getAttribute("data-patient-visibility"),
    manageExposure: await stage.getAttribute("data-manage-exposure"),
    artifactExposure: await stage.getAttribute("data-artifact-exposure"),
    routeFreezeState: await stage.getAttribute("data-route-freeze-state"),
  };
}

export async function readManageMarkers(page: any) {
  const root = page.getByTestId("patient-appointment-manage-view");
  await root.waitFor();
  return {
    manageExposure: await root.getAttribute("data-manage-exposure"),
    confirmationTruth: await root.getAttribute("data-confirmation-truth"),
    manageCapability: await root.getAttribute("data-manage-capability"),
    continuityState: await root.getAttribute("data-continuity-state"),
  };
}

export async function readStaffMarkers(page: any) {
  const root = page.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
  await root.waitFor();
  return {
    bookingCase: await root.getAttribute("data-booking-case"),
    reviewLeaseState: await root.getAttribute("data-review-lease-state"),
    focusProtected: await root.getAttribute("data-focus-protected"),
    confirmationTruth: await root.getAttribute("data-confirmation-truth"),
    taskSettlement: await root.getAttribute("data-task-settlement"),
    exceptionClass: await root.getAttribute("data-exception-class"),
  };
}

export async function captureAria(
  locator: any,
  page: any,
): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

export function writeAriaFile(fileName: string, snapshot: string | Record<string, unknown>): void {
  const content = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath(fileName), content, "utf-8");
}

export async function injectAxe(page: any): Promise<void> {
  if ((await page.evaluate(() => typeof window.axe === "object").catch(() => false)) === false) {
    await page.addScriptTag({ content: AXE_SOURCE });
  }
}

export async function runAxe(page: any, label: string, scopeSelector?: string): Promise<any> {
  await injectAxe(page);
  const result = await page.evaluate(
    async ({ selector }) => {
      const context = selector ? document.querySelector(selector) : document;
      return await window.axe.run(context ?? document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });
    },
    { selector: scopeSelector ?? null },
  );
  assertCondition(
    result.violations.length === 0,
    `${label} axe.run violations: ${result.violations
      .map((violation: any) => `${violation.id}:${violation.nodes.length}`)
      .join(", ")}`,
  );
  return result;
}

export async function assertTargetSize(locator: any, label: string, minimum = 24): Promise<void> {
  const box = await locator.boundingBox();
  assertCondition(box, `${label} target box missing`);
  assertCondition(
    box.width >= minimum && box.height >= minimum,
    `${label} target smaller than ${minimum}x${minimum} CSS pixels`,
  );
}

export async function assertFocusedVisible(
  locator: any,
  page: any,
  label: string,
  reserveBottomPx = 0,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assertCondition(box, `${label} focus box missing`);
  assertCondition(viewport, `${label} viewport missing`);
  assertCondition(
    box.x + box.width > 0 &&
      box.y + box.height > 0 &&
      box.x < viewport.width &&
      box.y < viewport.height - reserveBottomPx + 8,
    `${label} focus became obscured or off-screen`,
  );
}

export async function startLocalBookingApps(): Promise<{
  patientChild: ChildProcess;
  patientBaseUrl: string;
  staffChild: ChildProcess;
  staffBaseUrl: string;
}> {
  const [
    { child: patientChild, baseUrl: patientBaseUrl },
    { child: staffChild, baseUrl: staffBaseUrl },
  ] = await Promise.all([startPatientWeb(), startClinicalWorkspace()]);
  return { patientChild, patientBaseUrl, staffChild, staffBaseUrl };
}

export async function stopLocalBookingApps(apps: {
  patientChild: ChildProcess;
  staffChild: ChildProcess;
}): Promise<void> {
  await Promise.all([stopPatientWeb(apps.patientChild), stopClinicalWorkspace(apps.staffChild)]);
}

export function assertNoExternalRequests(
  label: string,
  ...externalRequestSets: Array<Set<string>>
): void {
  const urls = externalRequestSets.flatMap((entry) => [...entry]);
  assertCondition(
    urls.length === 0,
    `${label} should not fetch external resources: ${urls.join(", ")}`,
  );
}

export function sha256(input: Buffer | string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function captureStableScreenshot(
  page: any,
  locator: any,
  fileName: string,
  label: string,
  options: { fullPage?: boolean } = {},
): Promise<{
  artifactRef: string;
  hash: string;
  signature: {
    width: number;
    height: number;
    color: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
  };
}> {
  const screenshotOptions = {
    path: outputPath(fileName),
    animations: "disabled" as const,
    caret: "hide" as const,
  };
  await page
    .evaluate(async () => {
      if (document.fonts?.status === "loaded") {
        return;
      }
      await document.fonts?.ready;
    })
    .catch(() => undefined);
  await page.waitForTimeout(350);
  await locator.screenshot({
    animations: "disabled",
    caret: "hide",
  });
  const first = await locator.screenshot(screenshotOptions);
  const second = await locator.screenshot({
    animations: "disabled",
    caret: "hide",
  });
  const firstHash = sha256(first);
  const secondHash = sha256(second);
  assertCondition(
    firstHash === secondHash,
    `${label} screenshot drifted between consecutive captures`,
  );
  const signature = await locator.evaluate((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontFamily: style.fontFamily,
      borderRadius: style.borderRadius,
    };
  });
  return {
    artifactRef: `output/playwright/${fileName}`,
    hash: firstHash,
    signature,
  };
}

export async function startBoardServer(boardPath: string) {
  return startStaticServer(boardPath);
}
