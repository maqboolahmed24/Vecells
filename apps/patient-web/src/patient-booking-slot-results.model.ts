export const PATIENT_BOOKING_SLOT_RESULTS_TASK_ID =
  "par_294_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_slot_search_results_and_availability_freshness_states";
export const PATIENT_BOOKING_SLOT_RESULTS_VISUAL_MODE = "Snapshot_Result_Studio";

export type SlotSnapshotRecoveryViewState =
  | "renderable"
  | "partial_coverage"
  | "stale_refresh_required"
  | "no_supply_confirmed"
  | "support_fallback";
export type SlotCoverageState =
  | "complete"
  | "partial_coverage"
  | "timeout"
  | "degraded"
  | "failed";
export type CapacityReasonCueRef =
  | "cue_soonest"
  | "cue_best_match"
  | "cue_preferred_site"
  | "cue_accessibility_fit"
  | "cue_time_of_day_fit"
  | "cue_closest_suitable_site";
export type SlotActionabilityState = "available" | "frozen" | "support_only";
export type SlotRefineFilterKey =
  | "morning_only"
  | "preferred_site_only"
  | "accessible_site_only"
  | "remote_only";
export type SlotModality = "face_to_face" | "video" | "phone";
export type SlotTimeBucket = "morning" | "midday" | "afternoon";

export interface BookingSlotSummaryProjection {
  readonly slotSummaryId: string;
  readonly canonicalSlotIdentityRef: string;
  readonly dayKey: string;
  readonly dayShortLabel: string;
  readonly dayLongLabel: string;
  readonly startTimeLabel: string;
  readonly endTimeLabel: string;
  readonly siteLabel: string;
  readonly modalityLabel: string;
  readonly modality: SlotModality;
  readonly clinicianLabel: string;
  readonly clinicianTypeLabel: string;
  readonly accessibilityCue: string | null;
  readonly travelCue: string | null;
  readonly patientReasonCueRefs: readonly CapacityReasonCueRef[];
  readonly timeBucket: SlotTimeBucket;
  readonly preferredSite: boolean;
  readonly meetsAccessibilityNeed: boolean;
  readonly remoteCapable: boolean;
  readonly actionabilityState: SlotActionabilityState;
}

export interface SlotRefineOptionProjection {
  readonly optionId: string;
  readonly filterKey: SlotRefineFilterKey;
  readonly label: string;
  readonly description: string;
}

export interface SlotSnapshotRecoveryProjection {
  readonly viewState: SlotSnapshotRecoveryViewState;
  readonly coverageState: SlotCoverageState;
  readonly reasonCodes: readonly string[];
  readonly supportHelpVisible: boolean;
  readonly sameShellActionRef: string | null;
  readonly anchorDayKey: string | null;
  readonly headline: string;
  readonly body: string;
  readonly actionLabel: string | null;
  readonly secondaryActionLabel: string | null;
}

export interface BookingSupportFallbackProjection {
  readonly label: string;
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
}

export interface BookingSlotResultsProjection {
  readonly projectionName: "BookingSlotResultsProjection";
  readonly scenarioId: string;
  readonly bookingCaseId: string;
  readonly slotSetSnapshotRef: string;
  readonly searchSessionRef: string;
  readonly snapshotChecksum: string;
  readonly fetchedAt: string;
  readonly fetchedLabel: string;
  readonly expiresAt: string;
  readonly expiresLabel: string;
  readonly coverageState: SlotCoverageState;
  readonly viewState: SlotSnapshotRecoveryViewState;
  readonly slotCount: number;
  readonly candidateCount: number;
  readonly resultSummary: string;
  readonly resultCountLabel: string;
  readonly snapshotCountLabel: string;
  readonly dayJumpLabel: string;
  readonly anchorDayKey: string | null;
  readonly activeDayKey: string | null;
  readonly slots: readonly BookingSlotSummaryProjection[];
  readonly recovery: SlotSnapshotRecoveryProjection;
  readonly supportFallback: BookingSupportFallbackProjection;
  readonly refineOptions: readonly SlotRefineOptionProjection[];
  readonly refreshProjectionRef: string | null;
}

export interface BookingSlotDayGroupProjection {
  readonly dayKey: string;
  readonly anchorRef: string;
  readonly headingLabel: string;
  readonly longHeadingLabel: string;
  readonly slotCount: number;
  readonly slotCountLabel: string;
  readonly slots: readonly BookingSlotSummaryProjection[];
}

const DEFAULT_REFINE_OPTIONS: readonly SlotRefineOptionProjection[] = [
  {
    optionId: "refine_morning_only",
    filterKey: "morning_only",
    label: "Morning only",
    description: "Narrow the frozen snapshot to morning appointments without asking suppliers again.",
  },
  {
    optionId: "refine_preferred_site_only",
    filterKey: "preferred_site_only",
    label: "Preferred site only",
    description: "Keep only appointments already at the preferred community clinic.",
  },
  {
    optionId: "refine_accessible_site_only",
    filterKey: "accessible_site_only",
    label: "Accessible site only",
    description: "Show only slots carrying the current accessibility-fit evidence.",
  },
  {
    optionId: "refine_remote_only",
    filterKey: "remote_only",
    label: "Remote options only",
    description: "Show only video or phone options already present in this snapshot.",
  },
] as const;

const RENDERABLE_SLOTS: readonly BookingSlotSummaryProjection[] = [
  {
    slotSummaryId: "slot_summary_294_211_0910",
    canonicalSlotIdentityRef: "slot_identity_294_211_0910",
    dayKey: "2026-04-21",
    dayShortLabel: "Mon 21 Apr",
    dayLongLabel: "Monday 21 April",
    startTimeLabel: "09:10",
    endTimeLabel: "09:30",
    siteLabel: "Elmwood community clinic",
    modalityLabel: "Face to face",
    modality: "face_to_face",
    clinicianLabel: "Dr Hanna Malik",
    clinicianTypeLabel: "Dermatology follow-up",
    accessibilityCue: "Lift access and step-free entrance confirmed",
    travelCue: "14 minute journey from home",
    patientReasonCueRefs: ["cue_soonest", "cue_best_match"],
    timeBucket: "morning",
    preferredSite: true,
    meetsAccessibilityNeed: true,
    remoteCapable: false,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_211_1040",
    canonicalSlotIdentityRef: "slot_identity_294_211_1040",
    dayKey: "2026-04-21",
    dayShortLabel: "Mon 21 Apr",
    dayLongLabel: "Monday 21 April",
    startTimeLabel: "10:40",
    endTimeLabel: "11:00",
    siteLabel: "Elmwood community clinic",
    modalityLabel: "Video review",
    modality: "video",
    clinicianLabel: "Dr Hanna Malik",
    clinicianTypeLabel: "Dermatology follow-up",
    accessibilityCue: "No travel needed",
    travelCue: "Remote review",
    patientReasonCueRefs: ["cue_time_of_day_fit"],
    timeBucket: "morning",
    preferredSite: true,
    meetsAccessibilityNeed: true,
    remoteCapable: true,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_211_1330",
    canonicalSlotIdentityRef: "slot_identity_294_211_1330",
    dayKey: "2026-04-21",
    dayShortLabel: "Mon 21 Apr",
    dayLongLabel: "Monday 21 April",
    startTimeLabel: "13:30",
    endTimeLabel: "13:50",
    siteLabel: "Elmwood community clinic",
    modalityLabel: "Face to face",
    modality: "face_to_face",
    clinicianLabel: "Nurse specialist team",
    clinicianTypeLabel: "Dermatology nurse review",
    accessibilityCue: "Blue-badge parking nearby",
    travelCue: "14 minute journey from home",
    patientReasonCueRefs: ["cue_preferred_site"],
    timeBucket: "afternoon",
    preferredSite: true,
    meetsAccessibilityNeed: true,
    remoteCapable: false,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_222_0845",
    canonicalSlotIdentityRef: "slot_identity_294_222_0845",
    dayKey: "2026-04-22",
    dayShortLabel: "Tue 22 Apr",
    dayLongLabel: "Tuesday 22 April",
    startTimeLabel: "08:45",
    endTimeLabel: "09:05",
    siteLabel: "Riverside outpatient centre",
    modalityLabel: "Face to face",
    modality: "face_to_face",
    clinicianLabel: "Dr Hanna Malik",
    clinicianTypeLabel: "Dermatology follow-up",
    accessibilityCue: "Lift access confirmed",
    travelCue: "22 minute journey from home",
    patientReasonCueRefs: ["cue_accessibility_fit"],
    timeBucket: "morning",
    preferredSite: false,
    meetsAccessibilityNeed: true,
    remoteCapable: false,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_222_1120",
    canonicalSlotIdentityRef: "slot_identity_294_222_1120",
    dayKey: "2026-04-22",
    dayShortLabel: "Tue 22 Apr",
    dayLongLabel: "Tuesday 22 April",
    startTimeLabel: "11:20",
    endTimeLabel: "11:40",
    siteLabel: "Elmwood community clinic",
    modalityLabel: "Face to face",
    modality: "face_to_face",
    clinicianLabel: "Dr Hanna Malik",
    clinicianTypeLabel: "Dermatology follow-up",
    accessibilityCue: "Lift access and quiet waiting area",
    travelCue: "14 minute journey from home",
    patientReasonCueRefs: ["cue_best_match"],
    timeBucket: "morning",
    preferredSite: true,
    meetsAccessibilityNeed: true,
    remoteCapable: false,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_222_1410",
    canonicalSlotIdentityRef: "slot_identity_294_222_1410",
    dayKey: "2026-04-22",
    dayShortLabel: "Tue 22 Apr",
    dayLongLabel: "Tuesday 22 April",
    startTimeLabel: "14:10",
    endTimeLabel: "14:30",
    siteLabel: "Video clinic",
    modalityLabel: "Video review",
    modality: "video",
    clinicianLabel: "Consultant review pool",
    clinicianTypeLabel: "Dermatology follow-up",
    accessibilityCue: "No travel needed",
    travelCue: "Remote review",
    patientReasonCueRefs: ["cue_time_of_day_fit"],
    timeBucket: "afternoon",
    preferredSite: false,
    meetsAccessibilityNeed: true,
    remoteCapable: true,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_233_0940",
    canonicalSlotIdentityRef: "slot_identity_294_233_0940",
    dayKey: "2026-04-23",
    dayShortLabel: "Wed 23 Apr",
    dayLongLabel: "Wednesday 23 April",
    startTimeLabel: "09:40",
    endTimeLabel: "10:00",
    siteLabel: "Ashbrook treatment suite",
    modalityLabel: "Phone review",
    modality: "phone",
    clinicianLabel: "Nurse specialist team",
    clinicianTypeLabel: "Dermatology nurse review",
    accessibilityCue: "No travel needed",
    travelCue: "Phone call",
    patientReasonCueRefs: ["cue_closest_suitable_site"],
    timeBucket: "morning",
    preferredSite: false,
    meetsAccessibilityNeed: true,
    remoteCapable: true,
    actionabilityState: "available",
  },
  {
    slotSummaryId: "slot_summary_294_233_1115",
    canonicalSlotIdentityRef: "slot_identity_294_233_1115",
    dayKey: "2026-04-23",
    dayShortLabel: "Wed 23 Apr",
    dayLongLabel: "Wednesday 23 April",
    startTimeLabel: "11:15",
    endTimeLabel: "11:35",
    siteLabel: "Elmwood community clinic",
    modalityLabel: "Face to face",
    modality: "face_to_face",
    clinicianLabel: "Dr Hanna Malik",
    clinicianTypeLabel: "Dermatology follow-up",
    accessibilityCue: "Lift access and step-free entrance confirmed",
    travelCue: "14 minute journey from home",
    patientReasonCueRefs: ["cue_preferred_site"],
    timeBucket: "morning",
    preferredSite: true,
    meetsAccessibilityNeed: true,
    remoteCapable: false,
    actionabilityState: "available",
  },
] as const;

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "appointment" : "appointments"} in this snapshot`;
}

function buildProjection(input: {
  scenarioId: string;
  bookingCaseId: string;
  slotSetSnapshotRef: string;
  searchSessionRef: string;
  snapshotChecksum: string;
  fetchedAt: string;
  fetchedLabel: string;
  expiresAt: string;
  expiresLabel: string;
  coverageState: SlotCoverageState;
  viewState: SlotSnapshotRecoveryViewState;
  resultSummary: string;
  anchorDayKey: string | null;
  activeDayKey?: string | null;
  slots: readonly BookingSlotSummaryProjection[];
  recovery: SlotSnapshotRecoveryProjection;
  supportFallback: BookingSupportFallbackProjection;
  refreshProjectionRef?: string | null;
}): BookingSlotResultsProjection {
  return {
    projectionName: "BookingSlotResultsProjection",
    scenarioId: input.scenarioId,
    bookingCaseId: input.bookingCaseId,
    slotSetSnapshotRef: input.slotSetSnapshotRef,
    searchSessionRef: input.searchSessionRef,
    snapshotChecksum: input.snapshotChecksum,
    fetchedAt: input.fetchedAt,
    fetchedLabel: input.fetchedLabel,
    expiresAt: input.expiresAt,
    expiresLabel: input.expiresLabel,
    coverageState: input.coverageState,
    viewState: input.viewState,
    slotCount: input.slots.length,
    candidateCount: input.slots.length,
    resultSummary: input.resultSummary,
    resultCountLabel: countLabel(input.slots.length),
    snapshotCountLabel: `${input.slots.length} ranked results frozen at ${input.fetchedLabel}`,
    dayJumpLabel: "Jump to day",
    anchorDayKey: input.anchorDayKey,
    activeDayKey: input.activeDayKey ?? input.anchorDayKey,
    slots: input.slots,
    recovery: input.recovery,
    supportFallback: input.supportFallback,
    refineOptions: DEFAULT_REFINE_OPTIONS,
    refreshProjectionRef: input.refreshProjectionRef ?? null,
  };
}

const projectionsByScenario = {
  booking_case_294_renderable: buildProjection({
    scenarioId: "booking_case_294_renderable",
    bookingCaseId: "booking_case_294_renderable",
    slotSetSnapshotRef: "slot_set_snapshot_294_renderable",
    searchSessionRef: "slot_search_session_294_renderable",
    snapshotChecksum: "294-renderable-a91fd4b3",
    fetchedAt: "2026-04-19T08:18:00Z",
    fetchedLabel: "08:18",
    expiresAt: "2026-04-19T08:48:00Z",
    expiresLabel: "08:48",
    coverageState: "complete",
    viewState: "renderable",
    resultSummary: "Local appointments ranked from the frozen snapshot.",
    anchorDayKey: "2026-04-21",
    slots: RENDERABLE_SLOTS,
    recovery: {
      viewState: "renderable",
      coverageState: "complete",
      reasonCodes: ["coverage_complete"],
      supportHelpVisible: false,
      sameShellActionRef: "search_slots",
      anchorDayKey: "2026-04-21",
      headline: "Snapshot complete and ready to browse",
      body: "These results come from one frozen search snapshot. Ranking, counts, and day order stay tied to that snapshot until you refresh.",
      actionLabel: null,
      secondaryActionLabel: null,
    },
    supportFallback: {
      label: "Need help booking?",
      title: "Support stays available if scanning becomes difficult",
      body: "You can keep browsing here and still hand the booking to staff without losing this day anchor.",
      actionLabel: "Ask for booking help",
    },
  }),
  booking_case_294_partial: buildProjection({
    scenarioId: "booking_case_294_partial",
    bookingCaseId: "booking_case_294_partial",
    slotSetSnapshotRef: "slot_set_snapshot_294_partial",
    searchSessionRef: "slot_search_session_294_partial",
    snapshotChecksum: "294-partial-3bc3d0c2",
    fetchedAt: "2026-04-19T08:21:00Z",
    fetchedLabel: "08:21",
    expiresAt: "2026-04-19T08:51:00Z",
    expiresLabel: "08:51",
    coverageState: "partial_coverage",
    viewState: "partial_coverage",
    resultSummary: "Some suppliers have not settled yet, so availability may be incomplete.",
    anchorDayKey: "2026-04-21",
    slots: RENDERABLE_SLOTS.slice(0, 4),
    recovery: {
      viewState: "partial_coverage",
      coverageState: "partial_coverage",
      reasonCodes: ["supplier_timeout", "coverage_incomplete"],
      supportHelpVisible: true,
      sameShellActionRef: "request_staff_assist",
      anchorDayKey: "2026-04-21",
      headline: "Availability is only partially confirmed",
      body: "We have some local appointments to show, but one supplier window is still missing. Do not treat this as a final no-availability outcome.",
      actionLabel: null,
      secondaryActionLabel: "Need help booking?",
    },
    supportFallback: {
      label: "Need help booking?",
      title: "Support can continue while coverage is incomplete",
      body: "If the missing supplier window matters for this appointment, staff can keep the same booking case and continue from the preserved snapshot context.",
      actionLabel: "Ask for booking help",
    },
  }),
  booking_case_294_stale: buildProjection({
    scenarioId: "booking_case_294_stale",
    bookingCaseId: "booking_case_294_stale",
    slotSetSnapshotRef: "slot_set_snapshot_294_stale",
    searchSessionRef: "slot_search_session_294_stale",
    snapshotChecksum: "294-stale-cd11a83e",
    fetchedAt: "2026-04-19T07:42:00Z",
    fetchedLabel: "07:42",
    expiresAt: "2026-04-19T08:12:00Z",
    expiresLabel: "08:12",
    coverageState: "complete",
    viewState: "stale_refresh_required",
    resultSummary: "The visible ranking is preserved as provenance, but selection must pause until the snapshot is refreshed.",
    anchorDayKey: "2026-04-22",
    activeDayKey: "2026-04-22",
    slots: RENDERABLE_SLOTS.map((slot) => ({ ...slot, actionabilityState: "frozen" })),
    recovery: {
      viewState: "stale_refresh_required",
      coverageState: "complete",
      reasonCodes: ["snapshot_expired", "refresh_required_before_selection"],
      supportHelpVisible: true,
      sameShellActionRef: "refresh_booking_continuity",
      anchorDayKey: "2026-04-22",
      headline: "Refresh this snapshot before choosing a slot",
      body: "The day anchor and visible results stay in place, but selection controls are frozen until a new lawful snapshot replaces this one.",
      actionLabel: "Refresh results",
      secondaryActionLabel: "Need help booking?",
    },
    supportFallback: {
      label: "Need help booking?",
      title: "Support can continue if refresh is not possible now",
      body: "Staff can use the preserved day anchor and last safe result context without leaving this booking shell.",
      actionLabel: "Ask for booking help",
    },
    refreshProjectionRef: "booking_case_294_refresh_complete",
  }),
  booking_case_294_refresh_complete: buildProjection({
    scenarioId: "booking_case_294_refresh_complete",
    bookingCaseId: "booking_case_294_stale",
    slotSetSnapshotRef: "slot_set_snapshot_294_refresh_complete",
    searchSessionRef: "slot_search_session_294_refresh_complete",
    snapshotChecksum: "294-refresh-complete-581e9ab0",
    fetchedAt: "2026-04-19T08:26:00Z",
    fetchedLabel: "08:26",
    expiresAt: "2026-04-19T08:56:00Z",
    expiresLabel: "08:56",
    coverageState: "complete",
    viewState: "renderable",
    resultSummary: "Results were refreshed in place. Ranking now comes from the latest lawful frozen snapshot.",
    anchorDayKey: "2026-04-22",
    activeDayKey: "2026-04-22",
    slots: RENDERABLE_SLOTS,
    recovery: {
      viewState: "renderable",
      coverageState: "complete",
      reasonCodes: ["refresh_complete"],
      supportHelpVisible: false,
      sameShellActionRef: "search_slots",
      anchorDayKey: "2026-04-22",
      headline: "Snapshot refreshed in place",
      body: "Selection is available again and your day anchor has been preserved.",
      actionLabel: null,
      secondaryActionLabel: null,
    },
    supportFallback: {
      label: "Need help booking?",
      title: "Support still stays nearby",
      body: "If you prefer not to continue in self-service, staff can pick up this refreshed result set from the same booking case.",
      actionLabel: "Ask for booking help",
    },
  }),
  booking_case_294_no_supply: buildProjection({
    scenarioId: "booking_case_294_no_supply",
    bookingCaseId: "booking_case_294_no_supply",
    slotSetSnapshotRef: "slot_set_snapshot_294_no_supply",
    searchSessionRef: "slot_search_session_294_no_supply",
    snapshotChecksum: "294-no-supply-d2f90f70",
    fetchedAt: "2026-04-19T08:17:00Z",
    fetchedLabel: "08:17",
    expiresAt: "2026-04-19T08:47:00Z",
    expiresLabel: "08:47",
    coverageState: "complete",
    viewState: "no_supply_confirmed",
    resultSummary: "This search completed for the current policy and did not return a local appointment.",
    anchorDayKey: null,
    activeDayKey: null,
    slots: [],
    recovery: {
      viewState: "no_supply_confirmed",
      coverageState: "complete",
      reasonCodes: ["search_exhausted", "no_local_supply"],
      supportHelpVisible: true,
      sameShellActionRef: "request_staff_assist",
      anchorDayKey: null,
      headline: "No local appointments were found in this completed search",
      body: "The snapshot finished with complete coverage for the current policy. If the appointment is still needed, use the next safe support path instead of assuming more hidden self-service supply exists.",
      actionLabel: null,
      secondaryActionLabel: "Need help booking?",
    },
    supportFallback: {
      label: "Need help booking?",
      title: "Use the next safe continuation",
      body: "Staff can check whether a waitlist, callback, or another governed continuation is available for this booking case.",
      actionLabel: "Ask for booking help",
    },
  }),
  booking_case_294_fallback: buildProjection({
    scenarioId: "booking_case_294_fallback",
    bookingCaseId: "booking_case_294_fallback",
    slotSetSnapshotRef: "slot_set_snapshot_294_fallback",
    searchSessionRef: "slot_search_session_294_fallback",
    snapshotChecksum: "294-fallback-f413cd81",
    fetchedAt: "2026-04-19T08:11:00Z",
    fetchedLabel: "08:11",
    expiresAt: "2026-04-19T08:41:00Z",
    expiresLabel: "08:41",
    coverageState: "failed",
    viewState: "support_fallback",
    resultSummary: "Supplier recovery did not complete cleanly, so this shell now routes to the safest assisted continuation.",
    anchorDayKey: null,
    activeDayKey: null,
    slots: [],
    recovery: {
      viewState: "support_fallback",
      coverageState: "failed",
      reasonCodes: ["supplier_recovery_failed", "assisted_fallback_required"],
      supportHelpVisible: true,
      sameShellActionRef: "fallback_contact_practice_support",
      anchorDayKey: null,
      headline: "Self-service cannot continue from this search snapshot",
      body: "The booking shell stays open, but this supplier path needs assisted follow-up rather than more local browsing or a generic empty page.",
      actionLabel: null,
      secondaryActionLabel: "Use the supported fallback",
    },
    supportFallback: {
      label: "Need help booking?",
      title: "Use the supported fallback route",
      body: "The practice booking team can continue from this same case without pretending the snapshot completed normally.",
      actionLabel: "Use the supported fallback",
    },
  }),
} as const satisfies Record<string, BookingSlotResultsProjection>;

const scenarioAlias: Record<string, keyof typeof projectionsByScenario> = {
  booking_case_293_live: "booking_case_294_renderable",
  booking_case_293_degraded: "booking_case_294_partial",
  booking_case_293_recovery: "booking_case_294_stale",
};

export const patientBookingSlotResultsScenarioIds = Object.keys(
  projectionsByScenario,
).filter((scenarioId) => scenarioId !== "booking_case_294_refresh_complete");

export function patientReasonCueLabel(reasonCueRef: CapacityReasonCueRef): string {
  switch (reasonCueRef) {
    case "cue_soonest":
      return "Soonest";
    case "cue_best_match":
      return "Best match";
    case "cue_preferred_site":
      return "Preferred site";
    case "cue_accessibility_fit":
      return "Accessibility fit";
    case "cue_time_of_day_fit":
      return "Fits your time";
    case "cue_closest_suitable_site":
      return "Closest suitable site";
    default:
      return "Recommended";
  }
}

export function groupBookingSlotsByDay(
  slots: readonly BookingSlotSummaryProjection[],
): BookingSlotDayGroupProjection[] {
  const groups = new Map<string, BookingSlotDayGroupProjection>();
  for (const slot of slots) {
    const existing = groups.get(slot.dayKey);
    if (existing) {
      groups.set(slot.dayKey, {
        ...existing,
        slotCount: existing.slotCount + 1,
        slotCountLabel: countLabel(existing.slotCount + 1),
        slots: [...existing.slots, slot],
      });
      continue;
    }
    groups.set(slot.dayKey, {
      dayKey: slot.dayKey,
      anchorRef: `slot-day-${slot.dayKey}`,
      headingLabel: slot.dayShortLabel,
      longHeadingLabel: slot.dayLongLabel,
      slotCount: 1,
      slotCountLabel: countLabel(1),
      slots: [slot],
    });
  }
  return [...groups.values()];
}

export function resolveBookingSlotResultsProjection(
  bookingCaseId: string,
): BookingSlotResultsProjection | null {
  const scenarioId = scenarioAlias[bookingCaseId] ?? bookingCaseId;
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function resolveBookingSlotResultsProjectionByScenarioId(
  scenarioId: string,
): BookingSlotResultsProjection | null {
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function bookingSlotResultsStateMatrix(): Array<Record<string, string>> {
  return patientBookingSlotResultsScenarioIds.map((scenarioId) => {
    const projection = resolveBookingSlotResultsProjectionByScenarioId(scenarioId)!;
    return {
      scenario_id: projection.scenarioId,
      booking_case_id: projection.bookingCaseId,
      view_state: projection.viewState,
      coverage_state: projection.coverageState,
      slot_count: String(projection.slotCount),
      support_visible: String(projection.recovery.supportHelpVisible),
      anchor_day_key: projection.anchorDayKey ?? "none",
      selection_state:
        projection.viewState === "stale_refresh_required"
          ? "frozen"
          : projection.viewState === "support_fallback"
            ? "support_only"
            : "available",
    };
  });
}

export function bookingSlotResultsAtlasScenarios() {
  return patientBookingSlotResultsScenarioIds.map((scenarioId) => {
    const projection = resolveBookingSlotResultsProjectionByScenarioId(scenarioId)!;
    return {
      scenarioId: projection.scenarioId,
      bookingCaseId: projection.bookingCaseId,
      viewState: projection.viewState,
      coverageState: projection.coverageState,
      headline: projection.recovery.headline,
      resultCountLabel: projection.resultCountLabel,
      supportAction: projection.supportFallback.actionLabel,
      anchorDayKey: projection.anchorDayKey,
    };
  });
}

export function bookingSlotResultsContractSummary() {
  return {
    taskId: PATIENT_BOOKING_SLOT_RESULTS_TASK_ID,
    visualMode: PATIENT_BOOKING_SLOT_RESULTS_VISUAL_MODE,
    routes: ["/bookings/:bookingCaseId/select"],
    viewStates: [
      "renderable",
      "partial_coverage",
      "stale_refresh_required",
      "no_supply_confirmed",
      "support_fallback",
    ],
    uiPrimitives: [
      "BookingSlotResultsStage",
      "SnapshotCoverageRibbon",
      "DayGroupedSlotList",
      "SlotDayHeader",
      "SlotSummaryRow",
      "RefineOptionsDrawer",
      "SlotSnapshotRecoveryPanel",
      "BookingSupportFallbackStub",
    ],
    scenarioIds: [...patientBookingSlotResultsScenarioIds],
  };
}
