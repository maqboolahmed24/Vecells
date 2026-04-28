import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
};

export const BOOKING_ARTIFACT_ATLAS_PATH = "/docs/frontend/303_booking_artifact_parity_atlas.html";

export const BOOKING_ARTIFACT_FIXTURE_URLS = {
  confirmedReceipt:
    "/bookings/booking_case_296_confirmed/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=receipt",
  confirmedCalendar:
    "/bookings/booking_case_296_confirmed/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=calendar",
  confirmedBrowserHandoff:
    "/bookings/booking_case_296_confirmed/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=browser_handoff",
  managePrint:
    "/bookings/booking_case_297_ready/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=manage&artifactMode=print",
  manageDirections:
    "/bookings/booking_case_297_ready/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=manage&artifactMode=directions",
  pendingPrint:
    "/bookings/booking_case_296_pending/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=print",
  staleReceipt:
    "/bookings/booking_case_297_stale/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=manage&artifactMode=receipt",
  identityReceipt:
    "/bookings/booking_case_296_identity_repair/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=receipt",
  embeddedPrint:
    "/bookings/booking_case_296_confirmed/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=print&host=nhs_app&safeArea=bottom",
  embeddedBrowserHandoff:
    "/bookings/booking_case_296_confirmed/artifacts?origin=appointments&returnRoute=/appointments&artifactSource=confirm&artifactMode=browser_handoff&host=nhs_app&safeArea=bottom",
} as const;

export type BookingArtifactFixtureKey = keyof typeof BOOKING_ARTIFACT_FIXTURE_URLS;

export function bookingArtifactUrl(baseUrl: string, fixture: BookingArtifactFixtureKey): string {
  return `${baseUrl}${BOOKING_ARTIFACT_FIXTURE_URLS[fixture]}`;
}

export async function startArtifactAtlasServer() {
  return startStaticServer(BOOKING_ARTIFACT_ATLAS_PATH);
}

export async function readArtifactMarkers(page: any) {
  const root = page.getByTestId("patient-booking-artifact-frame");
  await root.waitFor();
  return {
    artifactMode: await root.getAttribute("data-artifact-mode"),
    parityPosture: await root.getAttribute("data-parity-posture"),
    grantState: await root.getAttribute("data-grant-state"),
    printPosture: await root.getAttribute("data-print-posture"),
    handoffReadiness: await root.getAttribute("data-handoff-readiness"),
    artifactSource: await root.getAttribute("data-artifact-source"),
    artifactExposure: await root.getAttribute("data-artifact-exposure"),
  };
}
