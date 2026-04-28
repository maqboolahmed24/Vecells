export const PATIENT_BOOKING_RESPONSIVE_TASK_ID =
  "par_302_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_mobile_responsive_booking_and_manage_flows";
export const PATIENT_BOOKING_RESPONSIVE_VISUAL_MODE = "Mobile_Transactional_Booking";

export type BookingResponsiveBreakpointClass =
  | "compact"
  | "narrow"
  | "medium"
  | "expanded"
  | "wide";
export type BookingMissionStackState = "folded" | "unfolded";
export type BookingSafeAreaClass = "none" | "top" | "bottom" | "both";
export type BookingStickyActionPosture = "hidden" | "inline" | "bottom_tray";
export type BookingEmbeddedMode = "browser" | "nhs_app";

export interface BookingResponsiveCoverageProfile {
  readonly projectionName: "BookingResponsiveCoverageProfile";
  readonly taskId: typeof PATIENT_BOOKING_RESPONSIVE_TASK_ID;
  readonly visualMode: typeof PATIENT_BOOKING_RESPONSIVE_VISUAL_MODE;
  readonly breakpointClass: BookingResponsiveBreakpointClass;
  readonly missionStackState: BookingMissionStackState;
  readonly safeAreaClass: BookingSafeAreaClass;
  readonly stickyActionPosture: BookingStickyActionPosture;
  readonly embeddedMode: BookingEmbeddedMode;
  readonly reducedMotion: boolean;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

export interface BookingResponsiveHostContext {
  readonly embeddedMode: BookingEmbeddedMode;
  readonly safeAreaOverride: BookingSafeAreaClass | null;
}

export function resolveBookingBreakpointClass(
  width: number,
): BookingResponsiveBreakpointClass {
  if (width <= 520) {
    return "compact";
  }
  if (width <= 860) {
    return "narrow";
  }
  if (width <= 1100) {
    return "medium";
  }
  if (width <= 1340) {
    return "expanded";
  }
  return "wide";
}

export function resolveBookingMissionStackState(
  breakpointClass: BookingResponsiveBreakpointClass,
): BookingMissionStackState {
  return breakpointClass === "compact" || breakpointClass === "narrow"
    ? "folded"
    : "unfolded";
}

export function resolveBookingSafeAreaClass(
  topInsetPx: number,
  bottomInsetPx: number,
): BookingSafeAreaClass {
  if (topInsetPx > 0 && bottomInsetPx > 0) {
    return "both";
  }
  if (topInsetPx > 0) {
    return "top";
  }
  if (bottomInsetPx > 0) {
    return "bottom";
  }
  return "none";
}

export function resolveBookingStickyActionPosture(input: {
  breakpointClass: BookingResponsiveBreakpointClass;
  stickyVisible: boolean;
}): BookingStickyActionPosture {
  if (!input.stickyVisible) {
    return "hidden";
  }
  return input.breakpointClass === "compact" || input.breakpointClass === "narrow"
    ? "bottom_tray"
    : "inline";
}

export function resolveBookingResponsiveHostContext(
  search: string,
): BookingResponsiveHostContext {
  const params = new URLSearchParams(search);
  // Canonical embedded-host query remains `host=nhs_app`, with `host=embedded` accepted for legacy fixtures.
  const host = params.get("host");
  const safeArea = params.get("safeArea");

  const embeddedMode: BookingEmbeddedMode =
    host === "nhs_app" || host === "embedded" ? "nhs_app" : "browser";
  const safeAreaOverride: BookingSafeAreaClass | null =
    safeArea === "top" ||
    safeArea === "bottom" ||
    safeArea === "both" ||
    safeArea === "none"
      ? safeArea
      : null;

  return {
    embeddedMode,
    safeAreaOverride,
  };
}
