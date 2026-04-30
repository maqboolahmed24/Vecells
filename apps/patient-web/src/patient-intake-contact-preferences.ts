export const CONTACT_CHANNELS = ["sms", "phone", "email"] as const;
export const CONTACT_WINDOWS = ["weekday_daytime", "weekday_evening", "anytime"] as const;
export const CONTACT_FOLLOW_UP_PERMISSION_STATES = ["granted", "declined", "not_set"] as const;
export const CONTACT_ACCESSIBILITY_NEEDS = [
  "large_text",
  "screen_reader_support",
  "relay_or_textphone",
  "british_sign_language",
  "easy_read",
] as const;
export const CONTACT_SOURCE_AUTHORITY_CLASSES = [
  "self_service_browser_entry",
  "self_service_embedded_entry",
  "authenticated_uplift_pending",
  "support_captured",
] as const;

export type DraftContactChannel = (typeof CONTACT_CHANNELS)[number];
export type DraftContactWindow = (typeof CONTACT_WINDOWS)[number];
export type DraftFollowUpPermissionState = (typeof CONTACT_FOLLOW_UP_PERMISSION_STATES)[number];
export type DraftContactAccessibilityNeed = (typeof CONTACT_ACCESSIBILITY_NEEDS)[number];
export type DraftContactSourceAuthorityClass = (typeof CONTACT_SOURCE_AUTHORITY_CLASSES)[number];
export type ContactMaskedDestinationState = "present_masked" | "missing";
export type ContactCompletenessState = "complete" | "incomplete" | "blocked";
export type ContactReviewCueTone = "neutral" | "review";
export type ContactConfirmationCopyState =
  | "preference_incomplete"
  | "confirmation_attempt_planned"
  | "follow_up_declined"
  | "confirmation_queued"
  | "delivery_pending"
  | "delivery_confirmed"
  | "recovery_required";
export type ContactConfirmationLifecycleState =
  | "step_preview"
  | "queued"
  | "delivery_pending"
  | "delivery_confirmed"
  | "recovery_required";

export interface DraftContactDestinations {
  sms: string;
  phone: string;
  email: string;
}

export interface DraftContactQuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface DraftContactPreferencesView {
  preferredChannel: DraftContactChannel;
  contactWindow: DraftContactWindow;
  voicemailAllowed: boolean;
  followUpPermission: DraftFollowUpPermissionState;
  destinations: DraftContactDestinations;
  quietHours: DraftContactQuietHours;
  languagePreference: string;
  translationRequired: boolean;
  accessibilityNeeds: readonly DraftContactAccessibilityNeed[];
  sourceAuthorityClass: DraftContactSourceAuthorityClass;
  sourceEvidenceRef: string;
}

export interface ContactMaskedDestinationView {
  channel: DraftContactChannel;
  label: string;
  state: ContactMaskedDestinationState;
  maskedValue: string;
}

export interface ContactSummaryView {
  contractId: "PHASE1_CONTACT_SUMMARY_VIEW_CONTRACT_V1";
  preferredChannel: DraftContactChannel;
  preferredRouteLabel: string;
  preferredDestinationMasked: string;
  destinations: Record<DraftContactChannel, ContactMaskedDestinationView>;
  followUpPermissionState: DraftFollowUpPermissionState;
  contactWindow: DraftContactWindow;
  contactWindowLabel: string;
  voicemailAllowed: boolean;
  quietHoursSummary: string;
  languagePreference: string;
  translationRequired: boolean;
  accessibilityNeeds: readonly DraftContactAccessibilityNeed[];
  accessibilityNeedsLabel: string;
  sourceAuthorityClass: DraftContactSourceAuthorityClass;
  completenessState: ContactCompletenessState;
  reasonCodes: readonly string[];
  reviewCue: string | null;
  reviewCueTone: ContactReviewCueTone;
  hasSafetyRelevantDelta: boolean;
}

export interface ContactConfirmationCopyRow {
  label: string;
  value: string;
}

export interface ContactConfirmationCopyModel {
  state: ContactConfirmationCopyState;
  title: string;
  body: string;
  tone: "continuity" | "safe" | "review" | "blocked";
  rows: readonly ContactConfirmationCopyRow[];
  liveAnnouncement: string;
}

const DEFAULT_CONTACT_PREFERENCES: DraftContactPreferencesView = {
  preferredChannel: "sms",
  contactWindow: "weekday_daytime",
  voicemailAllowed: false,
  followUpPermission: "granted",
  destinations: {
    sms: "07700 900123",
    phone: "020 7946 0012",
    email: "patient.demo@example.test",
  },
  quietHours: {
    enabled: false,
    start: "20:30",
    end: "08:00",
  },
  languagePreference: "English",
  translationRequired: false,
  accessibilityNeeds: [],
  sourceAuthorityClass: "self_service_browser_entry",
  sourceEvidenceRef: "contact_pref_capture_browser_seed_v1",
};

const CHANNEL_LABELS: Record<DraftContactChannel, string> = {
  sms: "Text message",
  phone: "Phone call",
  email: "Email",
};

const WINDOW_LABELS: Record<DraftContactWindow, string> = {
  weekday_daytime: "Weekday daytime",
  weekday_evening: "Weekday evening",
  anytime: "Any time",
};

const ACCESSIBILITY_LABELS: Record<DraftContactAccessibilityNeed, string> = {
  large_text: "Large text",
  screen_reader_support: "Screen reader support",
  relay_or_textphone: "Relay or textphone",
  british_sign_language: "British Sign Language",
  easy_read: "Easy Read",
};

export const CONTACT_REASON_CODE_MESSAGES: Record<string, string> = {
  CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL:
    "Add the contact detail you want us to try first.",
  CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED:
    "Tell us whether routine follow-up is okay on this contact method.",
  CONTACT_PREF_CAPTURE_MISSING: "Add a preferred contact method before you continue to review.",
  CONTACT_PREF_PRIMARY_CHANNEL_CHANGED:
    "The preferred contact method changed, so review the contact plan before you submit.",
  CONTACT_PREF_DESTINATION_CHANGED:
    "A saved destination changed. Review the masked summary before you submit.",
  CONTACT_PREF_FOLLOW_UP_PERMISSION_CHANGED:
    "The follow-up permission changed. Review the contact plan before you submit.",
  CONTACT_PREF_CONTACT_WINDOW_CHANGED:
    "The contact timing or quiet-hours preference changed. Review before you submit.",
  CONTACT_PREF_LANGUAGE_OR_ACCESSIBILITY_CHANGED:
    "Language or accessibility support changed. Review before you submit.",
  CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT:
    "This contact change may affect the safest contact method to use later.",
};

function sanitizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function uniqueAccessibilityNeeds(value: unknown): readonly DraftContactAccessibilityNeed[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<DraftContactAccessibilityNeed>();
  for (const entry of value) {
    if (
      typeof entry === "string" &&
      (CONTACT_ACCESSIBILITY_NEEDS as readonly string[]).includes(entry) &&
      !seen.has(entry as DraftContactAccessibilityNeed)
    ) {
      seen.add(entry as DraftContactAccessibilityNeed);
    }
  }
  return Array.from(seen);
}

function ensureChannel(value: unknown): DraftContactChannel {
  return (CONTACT_CHANNELS as readonly string[]).includes(String(value))
    ? (value as DraftContactChannel)
    : DEFAULT_CONTACT_PREFERENCES.preferredChannel;
}

function ensureContactWindow(value: unknown): DraftContactWindow {
  return (CONTACT_WINDOWS as readonly string[]).includes(String(value))
    ? (value as DraftContactWindow)
    : DEFAULT_CONTACT_PREFERENCES.contactWindow;
}

function ensureFollowUpPermission(value: unknown): DraftFollowUpPermissionState {
  return (CONTACT_FOLLOW_UP_PERMISSION_STATES as readonly string[]).includes(String(value))
    ? (value as DraftFollowUpPermissionState)
    : DEFAULT_CONTACT_PREFERENCES.followUpPermission;
}

function ensureAuthorityClass(value: unknown): DraftContactSourceAuthorityClass {
  return (CONTACT_SOURCE_AUTHORITY_CLASSES as readonly string[]).includes(String(value))
    ? (value as DraftContactSourceAuthorityClass)
    : DEFAULT_CONTACT_PREFERENCES.sourceAuthorityClass;
}

function normalizeDestinations(
  value: Partial<DraftContactDestinations> | null | undefined,
): DraftContactDestinations {
  return {
    sms: sanitizeString(value?.sms),
    phone: sanitizeString(value?.phone),
    email: sanitizeString(value?.email),
  };
}

function normalizeQuietHours(
  value: Partial<DraftContactQuietHours> | null | undefined,
): DraftContactQuietHours {
  return {
    enabled: sanitizeBoolean(value?.enabled, DEFAULT_CONTACT_PREFERENCES.quietHours.enabled),
    start: sanitizeString(value?.start) || DEFAULT_CONTACT_PREFERENCES.quietHours.start,
    end: sanitizeString(value?.end) || DEFAULT_CONTACT_PREFERENCES.quietHours.end,
  };
}

function maskPhoneLikeValue(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "");
  if (digits.length === 0) {
    return "Not added";
  }
  const suffix = digits.slice(-2);
  return `••••${suffix}`;
}

function maskEmailValue(rawValue: string): string {
  const [localPart, domainPart] = rawValue.split("@");
  if (!localPart || !domainPart) {
    return "Masked email";
  }
  const domainSegments = domainPart.split(".");
  const root = domainSegments[0] ?? "";
  const suffix = domainSegments.slice(1).join(".");
  const localMask = `${localPart[0] ?? "•"}•••`;
  const domainMask = `${root[0] ?? "•"}•••`;
  return suffix ? `${localMask}@${domainMask}.${suffix}` : `${localMask}@${domainMask}`;
}

function maskedDestinationForChannel(channel: DraftContactChannel, rawValue: string): string {
  if (!rawValue.trim()) {
    return "Not added";
  }
  if (channel === "email") {
    return maskEmailValue(rawValue);
  }
  return maskPhoneLikeValue(rawValue);
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((entry, index) => entry === right[index]);
}

function destinationsEqual(
  left: DraftContactDestinations,
  right: DraftContactDestinations,
): boolean {
  return left.sms === right.sms && left.phone === right.phone && left.email === right.email;
}

function quietHoursEqual(left: DraftContactQuietHours, right: DraftContactQuietHours): boolean {
  return left.enabled === right.enabled && left.start === right.start && left.end === right.end;
}

function buildReasonCodes(
  current: DraftContactPreferencesView,
  baseline: DraftContactPreferencesView,
): readonly string[] {
  const reasonCodes: string[] = [];
  const preferredDestination = sanitizeString(current.destinations[current.preferredChannel]);
  const anyDestinationPresent = CONTACT_CHANNELS.some(
    (channel) => sanitizeString(current.destinations[channel]).length > 0,
  );

  if (!anyDestinationPresent && current.followUpPermission === "not_set") {
    reasonCodes.push("CONTACT_PREF_CAPTURE_MISSING");
  }
  if (!preferredDestination) {
    reasonCodes.push("CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL");
  }
  if (current.followUpPermission === "not_set") {
    reasonCodes.push("CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED");
  }

  const deltaReasonCodes: string[] = [];
  if (current.preferredChannel !== baseline.preferredChannel) {
    deltaReasonCodes.push("CONTACT_PREF_PRIMARY_CHANNEL_CHANGED");
  }
  if (!destinationsEqual(current.destinations, baseline.destinations)) {
    deltaReasonCodes.push("CONTACT_PREF_DESTINATION_CHANGED");
  }
  if (current.followUpPermission !== baseline.followUpPermission) {
    deltaReasonCodes.push("CONTACT_PREF_FOLLOW_UP_PERMISSION_CHANGED");
  }
  if (
    current.contactWindow !== baseline.contactWindow ||
    current.voicemailAllowed !== baseline.voicemailAllowed ||
    !quietHoursEqual(current.quietHours, baseline.quietHours)
  ) {
    deltaReasonCodes.push("CONTACT_PREF_CONTACT_WINDOW_CHANGED");
  }
  if (
    current.languagePreference !== baseline.languagePreference ||
    current.translationRequired !== baseline.translationRequired ||
    !arraysEqual(current.accessibilityNeeds, baseline.accessibilityNeeds)
  ) {
    deltaReasonCodes.push("CONTACT_PREF_LANGUAGE_OR_ACCESSIBILITY_CHANGED");
  }
  if (deltaReasonCodes.length > 0) {
    deltaReasonCodes.push("CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT");
  }
  return [...reasonCodes, ...deltaReasonCodes];
}

function quietHoursSummary(preferences: DraftContactPreferencesView): string {
  if (!preferences.quietHours.enabled) {
    return "No quiet hours";
  }
  return `Avoid ${preferences.quietHours.start} to ${preferences.quietHours.end}`;
}

function accessibilitySummary(
  accessibilityNeeds: readonly DraftContactAccessibilityNeed[],
): string {
  if (accessibilityNeeds.length === 0) {
    return "No extra communication support set";
  }
  return accessibilityNeeds.map((need) => ACCESSIBILITY_LABELS[need]).join(", ");
}

function fallbackRowValue(summary: ContactSummaryView): string {
  const alternate = CONTACT_CHANNELS.find(
    (channel) =>
      channel !== summary.preferredChannel &&
      summary.destinations[channel].state === "present_masked",
  );
  if (!alternate) {
    return "If this contact method is not available later, we can use a safer backup step instead.";
  }
  return `${summary.destinations[alternate].label}: ${summary.destinations[alternate].maskedValue}`;
}

export function createDefaultDraftContactPreferences(): DraftContactPreferencesView {
  return {
    ...DEFAULT_CONTACT_PREFERENCES,
    destinations: {
      ...DEFAULT_CONTACT_PREFERENCES.destinations,
    },
    quietHours: {
      ...DEFAULT_CONTACT_PREFERENCES.quietHours,
    },
    accessibilityNeeds: [...DEFAULT_CONTACT_PREFERENCES.accessibilityNeeds],
  };
}

export function normalizeDraftContactPreferences(
  partialPreferences: Partial<DraftContactPreferencesView> | null | undefined,
): DraftContactPreferencesView {
  const fallback = createDefaultDraftContactPreferences();
  return {
    preferredChannel: ensureChannel(partialPreferences?.preferredChannel),
    contactWindow: ensureContactWindow(partialPreferences?.contactWindow),
    voicemailAllowed: sanitizeBoolean(
      partialPreferences?.voicemailAllowed,
      fallback.voicemailAllowed,
    ),
    followUpPermission: ensureFollowUpPermission(partialPreferences?.followUpPermission),
    destinations: normalizeDestinations(partialPreferences?.destinations),
    quietHours: normalizeQuietHours(partialPreferences?.quietHours),
    languagePreference:
      sanitizeString(partialPreferences?.languagePreference) || fallback.languagePreference,
    translationRequired: sanitizeBoolean(
      partialPreferences?.translationRequired,
      fallback.translationRequired,
    ),
    accessibilityNeeds: uniqueAccessibilityNeeds(partialPreferences?.accessibilityNeeds),
    sourceAuthorityClass: ensureAuthorityClass(partialPreferences?.sourceAuthorityClass),
    sourceEvidenceRef:
      sanitizeString(partialPreferences?.sourceEvidenceRef) || fallback.sourceEvidenceRef,
  };
}

export function channelLabel(channel: DraftContactChannel): string {
  return CHANNEL_LABELS[channel];
}

export function contactWindowLabel(windowValue: DraftContactWindow): string {
  return WINDOW_LABELS[windowValue];
}

export function accessibilityNeedLabel(accessibilityNeed: DraftContactAccessibilityNeed): string {
  return ACCESSIBILITY_LABELS[accessibilityNeed];
}

export function buildContactSummaryView(input: {
  preferences: DraftContactPreferencesView;
  baselinePreferences?: DraftContactPreferencesView | null;
}): ContactSummaryView {
  const preferences = normalizeDraftContactPreferences(input.preferences);
  const baseline = input.baselinePreferences
    ? normalizeDraftContactPreferences(input.baselinePreferences)
    : preferences;
  const destinations = Object.fromEntries(
    CONTACT_CHANNELS.map((channel) => {
      const rawValue = sanitizeString(preferences.destinations[channel]);
      const maskedValue = maskedDestinationForChannel(channel, rawValue);
      return [
        channel,
        {
          channel,
          label: channelLabel(channel),
          state: rawValue ? "present_masked" : "missing",
          maskedValue,
        },
      ];
    }),
  ) as Record<DraftContactChannel, ContactMaskedDestinationView>;
  const reasonCodes = buildReasonCodes(preferences, baseline);
  const completenessState: ContactCompletenessState =
    reasonCodes.includes("CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL") ||
    reasonCodes.includes("CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED") ||
    reasonCodes.includes("CONTACT_PREF_CAPTURE_MISSING")
      ? "incomplete"
      : "complete";
  const hasSafetyRelevantDelta = reasonCodes.includes(
    "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT",
  );
  return {
    contractId: "PHASE1_CONTACT_SUMMARY_VIEW_CONTRACT_V1",
    preferredChannel: preferences.preferredChannel,
    preferredRouteLabel: channelLabel(preferences.preferredChannel),
    preferredDestinationMasked: destinations[preferences.preferredChannel].maskedValue,
    destinations,
    followUpPermissionState: preferences.followUpPermission,
    contactWindow: preferences.contactWindow,
    contactWindowLabel: contactWindowLabel(preferences.contactWindow),
    voicemailAllowed: preferences.voicemailAllowed,
    quietHoursSummary: quietHoursSummary(preferences),
    languagePreference: preferences.languagePreference,
    translationRequired: preferences.translationRequired,
    accessibilityNeeds: preferences.accessibilityNeeds,
    accessibilityNeedsLabel: accessibilitySummary(preferences.accessibilityNeeds),
    sourceAuthorityClass: preferences.sourceAuthorityClass,
    completenessState,
    reasonCodes,
    reviewCue: hasSafetyRelevantDelta
      ? (CONTACT_REASON_CODE_MESSAGES[
          "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT"
        ] ?? null)
      : completenessState === "incomplete"
        ? "Add the missing contact details before you continue to review."
        : null,
    reviewCueTone:
      hasSafetyRelevantDelta || completenessState === "incomplete" ? "review" : "neutral",
    hasSafetyRelevantDelta,
  };
}

export function buildContactSummaryChip(summaryView: ContactSummaryView): string {
  const routeValue =
    summaryView.preferredDestinationMasked === "Not added"
      ? "Needs contact detail"
      : summaryView.preferredDestinationMasked;
  return `${summaryView.preferredRouteLabel} · ${routeValue}`;
}

export function primaryContactValidationMessage(summaryView: ContactSummaryView): string | null {
  const firstCode = summaryView.reasonCodes.find((reasonCode) =>
    [
      "CONTACT_PREF_CAPTURE_MISSING",
      "CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL",
      "CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED",
    ].includes(reasonCode),
  );
  return firstCode ? (CONTACT_REASON_CODE_MESSAGES[firstCode] ?? null) : null;
}

export function buildConfirmationCopyPreview(input: {
  summaryView: ContactSummaryView;
  lifecycleState?: ContactConfirmationLifecycleState;
}): ContactConfirmationCopyModel {
  const summaryView = input.summaryView;
  const lifecycleState = input.lifecycleState ?? "step_preview";
  const routeRow = {
    label: "Preferred contact",
    value: `${summaryView.preferredRouteLabel} to ${summaryView.preferredDestinationMasked}`,
  };
  const boundaryRow = {
    label: "What we know now",
    value: "Preference captured only. Delivery is checked later.",
  };

  if (summaryView.completenessState !== "complete") {
    return {
      state: "preference_incomplete",
      title: "How we’ll confirm this",
      body: "Add the missing contact details before we can preview the confirmation wording that the receipt may use later.",
      tone: "review",
      rows: [
        routeRow,
        {
          label: "Missing now",
          value:
            primaryContactValidationMessage(summaryView) ??
            "Finish the contact preference details.",
        },
      ],
      liveAnnouncement:
        "Confirmation preview updated. Contact preference details are still incomplete.",
    };
  }

  if (summaryView.followUpPermissionState === "declined") {
    return {
      state: "follow_up_declined",
      title: "How we’ll confirm this",
      body: "We’ll keep your preference with the request, but no routine follow-up is planned on this contact method unless you change that before submit.",
      tone: "continuity",
      rows: [
        routeRow,
        {
          label: "Current boundary",
          value: "Preference stored only. No confirmation attempt is planned yet.",
        },
      ],
      liveAnnouncement:
        "Confirmation preview updated. Follow-up is not currently permitted on the preferred contact method.",
    };
  }

  if (lifecycleState === "queued") {
    return {
      state: "confirmation_queued",
      title: "How we’ll confirm this",
      body: "A confirmation attempt is waiting for the preferred contact method. This does not mean it has been delivered.",
      tone: "continuity",
      rows: [
        routeRow,
        boundaryRow,
        {
          label: "Next step",
          value:
            "Sending and delivery details will be recorded later if they arrive.",
        },
      ],
      liveAnnouncement: "Confirmation preview updated. A later confirmation attempt is queued.",
    };
  }

  if (lifecycleState === "delivery_pending") {
    return {
      state: "delivery_pending",
      title: "How we’ll confirm this",
      body: "A handoff to the preferred contact method may be in progress, but delivery has not been confirmed yet.",
      tone: "continuity",
      rows: [
        routeRow,
        {
          label: "Sending",
          value: "Sending can be accepted before delivery is confirmed.",
        },
        {
          label: "Still not claimed",
          value: "Delivery is not confirmed yet.",
        },
      ],
      liveAnnouncement:
        "Confirmation preview updated. Delivery is still pending and not yet confirmed.",
    };
  }

  if (lifecycleState === "delivery_confirmed") {
    return {
      state: "delivery_confirmed",
      title: "How we’ll confirm this",
      body: "Delivery is confirmed for the masked preferred contact method.",
      tone: "safe",
      rows: [
        routeRow,
        {
          label: "Delivery outcome",
          value: "Delivery confirmed",
        },
      ],
      liveAnnouncement:
        "Confirmation preview updated. Delivery is only shown as confirmed when later evidence supports it.",
    };
  }

  if (lifecycleState === "recovery_required") {
    return {
      state: "recovery_required",
      title: "How we’ll confirm this",
      body: "The preferred contact method needs a safer recovery step. Do not assume a confirmation arrived there.",
      tone: "blocked",
      rows: [
        routeRow,
        {
          label: "Recovery path",
          value: "Use the recovery or status step instead of assuming delivery.",
        },
      ],
      liveAnnouncement:
        "Confirmation preview updated. Recovery is required for this contact method.",
    };
  }

  return {
    state: "confirmation_attempt_planned",
    title: "How we’ll confirm this",
    body: "After you submit, we’ll plan to use this preferred contact method if it is still available and safe. This preview is not delivery confirmation.",
    tone: summaryView.hasSafetyRelevantDelta ? "review" : "continuity",
    rows: [
      routeRow,
      boundaryRow,
      {
        label: "Fallback",
        value: fallbackRowValue(summaryView),
      },
    ],
    liveAnnouncement:
      "Confirmation preview updated. This is a preference preview only, not delivery confirmation.",
  };
}
