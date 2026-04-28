import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_BOOKING_VISUAL_MODE,
  embeddedBookingPath,
  isEmbeddedBookingPath,
  resolveEmbeddedBookingContext,
} from "../../apps/patient-web/src/embedded-booking.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char ?? "";
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headerLine = lines[0];
  invariant(headerLine, `${relativePath} missing header`);
  const headers = parseCsvLine(headerLine);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}`);
}

const REQUIRED_FILES = [
  "apps/patient-web/src/embedded-booking.model.ts",
  "apps/patient-web/src/embedded-booking.tsx",
  "apps/patient-web/src/embedded-booking.css",
  "docs/frontend/391_embedded_booking_spec.md",
  "docs/frontend/391_embedded_booking_atlas.html",
  "docs/frontend/391_embedded_booking_flow_topology.mmd",
  "docs/frontend/391_embedded_booking_tokens.json",
  "docs/accessibility/391_embedded_booking_a11y_notes.md",
  "data/contracts/391_embedded_booking_contract.json",
  "data/analysis/391_algorithm_alignment_notes.md",
  "data/analysis/391_visual_reference_notes.json",
  "data/analysis/391_embedded_booking_state_matrix.csv",
  "tools/analysis/validate_391_embedded_booking_ui.ts",
  "tests/playwright/391_embedded_booking.helpers.ts",
  "tests/playwright/391_embedded_booking_selection_and_confirm.spec.ts",
  "tests/playwright/391_embedded_booking_manage_waitlist_and_calendar.spec.ts",
  "tests/playwright/391_embedded_booking_accessibility.spec.ts",
  "tests/playwright/391_embedded_booking_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:391-embedded-booking-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_391_embedded_booking_ui.ts",
  "package.json missing validate:391-embedded-booking-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_390_/m.test(checklist), "par_390 must be complete before par_391.");
invariant(/^- \[(?:-|X)\] par_391_/m.test(checklist), "par_391 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedBookingApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedBookingPath(pathname)", "patient-web App route wiring");
const requestRouteIndex = appSource.indexOf("isEmbeddedRequestStatusPath(pathname)");
const bookingRouteIndex = appSource.indexOf("isEmbeddedBookingPath(pathname)");
const shellRouteIndex = appSource.indexOf("isEmbeddedShellSplitPath(pathname, search)");
invariant(bookingRouteIndex > requestRouteIndex, "booking route should follow embedded request route");
invariant(bookingRouteIndex < shellRouteIndex, "booking route must precede /nhs-app shell catch-all");

const componentSource = readText("apps/patient-web/src/embedded-booking.tsx");
for (const componentName of [
  "EmbeddedBookingOfferRail",
  "EmbeddedBookingOfferCard",
  "EmbeddedAlternativeOfferStack",
  "EmbeddedWaitlistOfferCard",
  "EmbeddedManageAppointmentWorkspace",
  "EmbeddedBookingConfirmationFrame",
  "EmbeddedCalendarActionCard",
  "EmbeddedReminderPanel",
  "EmbeddedBookingRecoveryBanner",
  "EmbeddedReservationTruthBadge",
  "EmbeddedSlotComparisonStrip",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
}

for (const hook of [
  "EmbeddedBookingFrame",
  "EmbeddedBookingOfferRail",
  "EmbeddedBookingActionReserve",
  "data-visual-mode",
  "data-selected-anchor",
  "data-continuity-state",
  "aria-live=\"polite\"",
  "role=\"status\"",
  "EmbeddedBookingCalendarBridgeWrapper",
]) {
  requireIncludes(componentSource, hook, "automation and accessibility hooks");
}

const modelSource = readText("apps/patient-web/src/embedded-booking.model.ts");
for (const canonical of [
  "OfferSelectionProjection",
  "BookingSlotResultsProjection",
  "BookingConfirmationProjection",
  "PatientWaitlistViewProjection",
  "PatientAppointmentManageProjection",
  "PatientNetworkAlternativeChoiceProjection",
  "nhsapp.storage.addEventToCalendar",
]) {
  requireIncludes(modelSource, canonical, "canonical projection binding");
}

const cssSource = readText("apps/patient-web/src/embedded-booking.css").toLowerCase();
for (const token of [
  "#f6f8fb",
  "#ffffff",
  "#f3f7fb",
  "#d9e2ec",
  "#0f172a",
  "#334155",
  "#64748b",
  "#2457ff",
  "#146c43",
  "#a16207",
  "#b42318",
  "48rem",
  "18px",
  "12px",
  "72px",
  "env(safe-area-inset-bottom",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "embedded booking CSS tokens");
}

invariant(EMBEDDED_BOOKING_VISUAL_MODE === "NHSApp_Embedded_Booking", "visual mode drift");
invariant(isEmbeddedBookingPath("/nhs-app/bookings/booking_case_391/offers"), "offers path not recognized");
invariant(isEmbeddedBookingPath("/nhs-app/bookings/booking_case_391/waitlist"), "waitlist path not recognized");
invariant(isEmbeddedBookingPath("/nhs-app/bookings/booking_case_391/manage"), "manage path not recognized");
invariant(isEmbeddedBookingPath("/embedded-booking/booking_case_391/calendar"), "fallback path not recognized");
invariant(!isEmbeddedBookingPath("/nhs-app/requests/request_211_a/status"), "request route should not be booking");

const builtPath = embeddedBookingPath({
  bookingCaseId: "booking_case_391",
  routeKey: "calendar",
  fixture: "calendar",
});
invariant(builtPath.includes("/nhs-app/bookings/booking_case_391/calendar"), "embedded booking path builder drift");

const offers = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/offers",
  search: "?fixture=live",
});
invariant(offers.routeKey === "offers", "offers route drift");
invariant(offers.currentState.actionability === "live", "offers should be live");
invariant(offers.selectedTruth?.truthState === "truthful_nonexclusive", "live fixture should be truthful nonexclusive");
invariant(offers.calendarBridgeAction.capability === "not_confirmed", "unconfirmed offers must gate calendar");

const held = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/offers",
  search: "?fixture=exclusive-hold",
});
invariant(held.selectedTruth?.truthState === "exclusive_held", "exclusive hold truth missing");
invariant(held.selectedTruth?.countdownMode === "hold_expiry", "exclusive hold must be the only countdown posture");

const stale = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/offers",
  search: "?fixture=stale",
});
invariant(stale.currentState.actionability === "recovery_required", "stale selection should require recovery");
invariant(stale.recoveryBanner.visible, "stale selection should show recovery");

const waitlist = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/waitlist",
  search: "?fixture=waitlist-offer",
});
invariant(waitlist.waitlist.projectionName === "PatientWaitlistViewProjection", "waitlist projection missing");
invariant(waitlist.currentState.actionability === "live", "waitlist offer should be live");

const alternativesDrifted = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/alternatives",
  search: "?fixture=alternatives-drifted",
});
invariant(
  alternativesDrifted.alternatives.projectionName === "PatientNetworkAlternativeChoiceProjection",
  "alternative projection missing",
);
invariant(alternativesDrifted.currentState.actionability === "read_only", "drifted alternatives should be read-only");
invariant(alternativesDrifted.recoveryBanner.visible, "drifted alternatives should show recovery");

const confirmed = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/confirmation",
  search: "?fixture=confirmed",
});
invariant(confirmed.confirmation.confirmationTruthState === "confirmed", "confirmed fixture should be confirmed");
invariant(confirmed.manage.manageExposureState === "writable", "confirmed fixture should expose writable manage posture");

const calendar = resolveEmbeddedBookingContext({
  pathname: "/nhs-app/bookings/booking_case_391/calendar",
  search: "?fixture=calendar",
});
invariant(calendar.calendarBridgeAction.capability === "available", "calendar should be bridge available after confirmation");
invariant(calendar.currentState.actionability === "bridge_gated", "calendar route should be bridge gated");
invariant(calendar.calendarBridgeAction.bridgeWrapperRef === "EmbeddedBookingCalendarBridgeWrapper", "calendar wrapper drift");

const contract = readJson<{ visualMode?: string; canonicalBindings?: Record<string, unknown>; components?: unknown[] }>(
  "data/contracts/391_embedded_booking_contract.json",
);
invariant(contract.visualMode === "NHSApp_Embedded_Booking", "contract visual mode drift");
invariant(contract.canonicalBindings?.offers === "OfferSelectionProjection", "contract offer binding drift");
invariant(contract.canonicalBindings?.calendar === "EmbeddedBookingCalendarBridgeWrapper", "contract calendar binding drift");
invariant(Array.isArray(contract.components) && contract.components.length >= 11, "contract missing components");

const tokens = readJson<{ layout?: Record<string, unknown>; color?: Record<string, unknown> }>(
  "docs/frontend/391_embedded_booking_tokens.json",
);
invariant(tokens.layout?.contentMaxWidth === "48rem", "token manifest width drift");
invariant(tokens.layout?.stickyReserveHeight === "72px", "token manifest reserve drift");
invariant(tokens.color?.accent === "#2457FF", "token accent drift");

const visualRefs = readJson<{ references?: Array<{ url?: string }> }>("data/analysis/391_visual_reference_notes.json");
const visualUrls = (visualRefs.references ?? []).map((reference) => reference.url ?? "").join("\n");
for (const domain of [
  "nhsconnect.github.io",
  "digital.nhs.uk",
  "service-manual.nhs.uk",
  "w3.org",
  "playwright.dev",
  "linear.app",
  "vercel.com",
  "carbondesignsystem.com",
  "rfc-editor.org",
]) {
  requireIncludes(visualUrls, domain, "visual reference notes");
}

const stateRows = readCsv("data/analysis/391_embedded_booking_state_matrix.csv");
for (const state of [
  "offer_selection_live",
  "exclusive_hold_selection",
  "stale_selection_recovery",
  "alternative_offer_live",
  "alternative_offer_drifted",
  "waitlist_offer_live",
  "waitlist_offer_expired",
  "confirmed_manage",
  "calendar_bridge_available",
]) {
  invariant(stateRows.some((row) => row.state === state), `state matrix missing ${state}`);
}

for (const relativePath of [
  "tests/playwright/391_embedded_booking_selection_and_confirm.spec.ts",
  "tests/playwright/391_embedded_booking_manage_waitlist_and_calendar.spec.ts",
  "tests/playwright/391_embedded_booking_accessibility.spec.ts",
  "tests/playwright/391_embedded_booking_visual.spec.ts",
]) {
  const testSource = readText(relativePath);
  requireIncludes(testSource, "startPatientWeb", `${relativePath} Playwright server harness`);
  requireIncludes(testSource, "openEmbeddedBooking", `${relativePath} route opener`);
}

console.log("validate_391_embedded_booking_ui: ok");

