import type { ChangeEvent } from "react";
import {
  CONTACT_ACCESSIBILITY_NEEDS,
  CONTACT_CHANNELS,
  CONTACT_FOLLOW_UP_PERMISSION_STATES,
  CONTACT_REASON_CODE_MESSAGES,
  CONTACT_WINDOWS,
  accessibilityNeedLabel,
  buildConfirmationCopyPreview,
  channelLabel,
  contactWindowLabel,
  type ContactConfirmationCopyModel,
  type ContactSummaryView,
  type DraftContactAccessibilityNeed,
  type DraftContactChannel,
  type DraftContactPreferencesView,
} from "./patient-intake-contact-preferences";

function ContactSelectionGlyph({ channel }: { channel: DraftContactChannel }) {
  if (channel === "phone") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 12h10a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-4l2 10c2 8 8 14 16 16l10 2v-4a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v10c0 2-2 4-4 4C34 62 10 38 10 16c0-2 2-4 4-4h4Z" />
      </svg>
    );
  }
  if (channel === "email") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect x="10" y="14" width="44" height="36" rx="8" />
        <path d="m14 20 18 14 18-14" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="8" width="36" height="48" rx="10" />
      <path d="M22 18h20" />
      <path d="M28 48h8" />
    </svg>
  );
}

function supportSummary(preferences: DraftContactPreferencesView): string {
  if (preferences.accessibilityNeeds.length === 0 && !preferences.translationRequired) {
    return "No extra communication support set";
  }
  const parts: string[] = [];
  if (preferences.translationRequired) {
    parts.push(`Translation support for ${preferences.languagePreference}`);
  }
  if (preferences.accessibilityNeeds.length > 0) {
    parts.push(
      preferences.accessibilityNeeds.map((need) => accessibilityNeedLabel(need)).join(", "),
    );
  }
  return parts.join(" · ");
}

function updateDestinations(
  preferences: DraftContactPreferencesView,
  channel: DraftContactChannel,
  value: string,
): DraftContactPreferencesView {
  return {
    ...preferences,
    destinations: {
      ...preferences.destinations,
      [channel]: value,
    },
  };
}

function toggleAccessibilityNeed(
  preferences: DraftContactPreferencesView,
  accessibilityNeed: DraftContactAccessibilityNeed,
): DraftContactPreferencesView {
  const nextAccessibilityNeeds = preferences.accessibilityNeeds.includes(accessibilityNeed)
    ? preferences.accessibilityNeeds.filter((entry) => entry !== accessibilityNeed)
    : [...preferences.accessibilityNeeds, accessibilityNeed];
  return {
    ...preferences,
    accessibilityNeeds: nextAccessibilityNeeds,
  };
}

export function ChannelPreferenceStack({
  value,
  onChange,
}: {
  value: DraftContactPreferencesView;
  onChange: (nextValue: DraftContactPreferencesView) => void;
}) {
  return (
    <section
      className="patient-intake-mission-frame__channel-stack"
      data-testid="contact-channel-stack"
      aria-labelledby="contact-channel-stack-title"
    >
      <div className="patient-intake-mission-frame__contact-section-head">
        <span id="contact-channel-stack-title">Preferred contact method</span>
        <p>Choose the contact method we should try first if it is still available and safe.</p>
      </div>
      <div
        className="patient-intake-mission-frame__channel-grid"
        role="group"
        aria-label="Preferred contact method"
      >
        {CONTACT_CHANNELS.map((channel) => (
          <button
            key={channel}
            type="button"
            className="patient-intake-mission-frame__channel-card"
            data-active={value.preferredChannel === channel ? "true" : "false"}
            data-testid={`contact-channel-card-${channel}`}
            aria-pressed={value.preferredChannel === channel}
            onClick={() =>
              onChange({
                ...value,
                preferredChannel: channel,
              })
            }
          >
            <span className="patient-intake-mission-frame__channel-glyph">
              <ContactSelectionGlyph channel={channel} />
            </span>
            <strong>{channelLabel(channel)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

export function RouteEntryPanel({
  value,
  summaryView,
  validationActive,
  onChange,
  onFocusField,
  onBlurField,
}: {
  value: DraftContactPreferencesView;
  summaryView: ContactSummaryView;
  validationActive: boolean;
  onChange: (nextValue: DraftContactPreferencesView) => void;
  onFocusField: (fieldKey: string | null) => void;
  onBlurField: () => void;
}) {
  const orderedChannels = [
    value.preferredChannel,
    ...CONTACT_CHANNELS.filter((channel) => channel !== value.preferredChannel),
  ] as const;
  const missingPreferredDestination =
    validationActive &&
    summaryView.reasonCodes.includes("CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL");

  return (
    <section
      className="patient-intake-mission-frame__route-entry-panel"
      data-testid="contact-route-entry-panel"
      aria-labelledby="contact-route-entry-title"
    >
      <div className="patient-intake-mission-frame__contact-section-head">
        <span id="contact-route-entry-title">Contact details</span>
        <p>
          Enter the contact details you want us to keep on file. Only masked versions appear in summaries
          elsewhere.
        </p>
      </div>
      <div className="patient-intake-mission-frame__route-entry-grid">
        {orderedChannels.map((channel) => {
          const fieldKey = `contact.destinations.${channel}`;
          const isPreferred = channel === value.preferredChannel;
          const hasInlineError = isPreferred && missingPreferredDestination;
          return (
            <section
              key={channel}
              className="patient-intake-mission-frame__route-card"
              data-preferred={isPreferred ? "true" : "false"}
              data-testid={`contact-route-card-${channel}`}
            >
              <div className="patient-intake-mission-frame__route-card-head">
                <div>
                  <strong>{channelLabel(channel)}</strong>
                  <p>
                    {isPreferred
                      ? "This contact method is currently preferred."
                      : "Keep this as an alternate masked contact method if you want a fallback available later."}
                  </p>
                </div>
                {isPreferred ? (
                  <span className="patient-intake-mission-frame__route-badge">Preferred</span>
                ) : null}
              </div>
              <label
                className="patient-intake-mission-frame__contact-field"
                data-focus-field={fieldKey}
                data-testid={`contact-field-${channel}`}
              >
                <span>
                  {channel === "sms"
                    ? "Mobile number"
                    : channel === "phone"
                      ? "Phone number"
                      : "Email address"}
                </span>
                <input
                  type={channel === "email" ? "email" : "text"}
                  inputMode={channel === "email" ? "email" : "tel"}
                  autoComplete={channel === "email" ? "email" : "tel"}
                  value={value.destinations[channel]}
                  placeholder={
                    channel === "email"
                      ? "name@example.com"
                      : "Enter the contact detail exactly as you use it"
                  }
                  onFocus={() => onFocusField(fieldKey)}
                  onBlur={onBlurField}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onChange(updateDestinations(value, channel, event.target.value))
                  }
                  data-testid={`contact-destination-input-${channel}`}
                  aria-invalid={hasInlineError}
                  aria-describedby={
                    hasInlineError ? `contact-error-${channel}` : `contact-masked-hint-${channel}`
                  }
                />
              </label>
              <p
                className="patient-intake-mission-frame__contact-masked-hint"
                id={`contact-masked-hint-${channel}`}
              >
                Elsewhere this appears as{" "}
                <strong>{summaryView.destinations[channel].maskedValue}</strong>
              </p>
              {hasInlineError ? (
                <p
                  className="patient-intake-mission-frame__contact-inline-error"
                  id={`contact-error-${channel}`}
                  data-testid={`contact-inline-error-${channel}`}
                >
                  {
                    CONTACT_REASON_CODE_MESSAGES[
                      "CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL"
                    ]
                  }
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}

export function CommunicationNeedsPanel({
  value,
  summaryView,
  validationActive,
  onChange,
  onFocusField,
  onBlurField,
}: {
  value: DraftContactPreferencesView;
  summaryView: ContactSummaryView;
  validationActive: boolean;
  onChange: (nextValue: DraftContactPreferencesView) => void;
  onFocusField: (fieldKey: string | null) => void;
  onBlurField: () => void;
}) {
  const followUpMissing =
    validationActive &&
    summaryView.reasonCodes.includes("CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED");

  return (
    <section
      className="patient-intake-mission-frame__communication-needs-panel"
      data-testid="contact-communication-needs-panel"
      aria-labelledby="contact-communication-needs-title"
    >
      <div className="patient-intake-mission-frame__contact-section-head">
        <span id="contact-communication-needs-title">Timing and communication needs</span>
        <p>
          Tell us what should shape later contact choice without turning this step into an account
          settings page.
        </p>
      </div>

      <fieldset className="patient-intake-mission-frame__contact-group">
        <legend>Routine follow-up</legend>
        <div
          className="patient-intake-mission-frame__segmented-control"
          role="group"
          aria-label="Follow-up permission"
        >
          {CONTACT_FOLLOW_UP_PERMISSION_STATES.map((state) => (
            <button
              key={state}
              type="button"
              aria-pressed={value.followUpPermission === state}
              data-active={value.followUpPermission === state ? "true" : "false"}
              data-testid={`contact-follow-up-${state}`}
              onClick={() =>
                onChange({
                  ...value,
                  followUpPermission: state,
                })
              }
            >
              {state === "granted"
                ? "Allowed"
                : state === "declined"
                  ? "Do not use"
                  : "I need to decide"}
            </button>
          ))}
        </div>
        {followUpMissing ? (
          <p
            className="patient-intake-mission-frame__contact-inline-error"
            data-testid="contact-inline-error-follow-up"
          >
            {CONTACT_REASON_CODE_MESSAGES["CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED"]}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="patient-intake-mission-frame__contact-group">
        <legend>When contact is usually okay</legend>
        <div
          className="patient-intake-mission-frame__segmented-control"
          role="group"
          aria-label="Contact window"
        >
          {CONTACT_WINDOWS.map((windowValue) => (
            <button
              key={windowValue}
              type="button"
              aria-pressed={value.contactWindow === windowValue}
              data-active={value.contactWindow === windowValue ? "true" : "false"}
              data-testid={`contact-window-${windowValue}`}
              onClick={() =>
                onChange({
                  ...value,
                  contactWindow: windowValue,
                })
              }
            >
              {contactWindowLabel(windowValue)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="patient-intake-mission-frame__contact-grid">
        <label className="patient-intake-mission-frame__contact-toggle">
          <input
            type="checkbox"
            checked={value.voicemailAllowed}
            onChange={(event) =>
              onChange({
                ...value,
                voicemailAllowed: event.target.checked,
              })
            }
            data-testid="contact-voicemail-toggle"
          />
          <span>Voicemail is okay for this request</span>
        </label>

        <label className="patient-intake-mission-frame__contact-toggle">
          <input
            type="checkbox"
            checked={value.quietHours.enabled}
            onChange={(event) =>
              onChange({
                ...value,
                quietHours: {
                  ...value.quietHours,
                  enabled: event.target.checked,
                },
              })
            }
            data-testid="contact-quiet-hours-toggle"
          />
          <span>Use quiet hours</span>
        </label>
      </div>

      {value.quietHours.enabled ? (
        <div className="patient-intake-mission-frame__contact-grid">
          <label
            className="patient-intake-mission-frame__contact-field"
            data-focus-field="contact.quietHours.start"
          >
            <span>Quiet hours start</span>
            <input
              type="time"
              value={value.quietHours.start}
              onFocus={() => onFocusField("contact.quietHours.start")}
              onBlur={onBlurField}
              onChange={(event) =>
                onChange({
                  ...value,
                  quietHours: {
                    ...value.quietHours,
                    start: event.target.value,
                  },
                })
              }
              data-testid="contact-quiet-hours-start"
            />
          </label>
          <label
            className="patient-intake-mission-frame__contact-field"
            data-focus-field="contact.quietHours.end"
          >
            <span>Quiet hours end</span>
            <input
              type="time"
              value={value.quietHours.end}
              onFocus={() => onFocusField("contact.quietHours.end")}
              onBlur={onBlurField}
              onChange={(event) =>
                onChange({
                  ...value,
                  quietHours: {
                    ...value.quietHours,
                    end: event.target.value,
                  },
                })
              }
              data-testid="contact-quiet-hours-end"
            />
          </label>
        </div>
      ) : null}

      <div className="patient-intake-mission-frame__contact-grid">
        <label
          className="patient-intake-mission-frame__contact-field"
          data-focus-field="contact.languagePreference"
        >
          <span>Preferred language</span>
          <input
            type="text"
            value={value.languagePreference}
            onFocus={() => onFocusField("contact.languagePreference")}
            onBlur={onBlurField}
            onChange={(event) =>
              onChange({
                ...value,
                languagePreference: event.target.value,
              })
            }
            data-testid="contact-language-input"
          />
        </label>
        <label className="patient-intake-mission-frame__contact-toggle">
          <input
            type="checkbox"
            checked={value.translationRequired}
            onChange={(event) =>
              onChange({
                ...value,
                translationRequired: event.target.checked,
              })
            }
            data-testid="contact-translation-toggle"
          />
          <span>Translation support is needed</span>
        </label>
      </div>

      <fieldset className="patient-intake-mission-frame__contact-group">
        <legend>Accessibility and communication support</legend>
        <div className="patient-intake-mission-frame__support-checklist">
          {CONTACT_ACCESSIBILITY_NEEDS.map((accessibilityNeed) => (
            <label key={accessibilityNeed} className="patient-intake-mission-frame__contact-toggle">
              <input
                type="checkbox"
                checked={value.accessibilityNeeds.includes(accessibilityNeed)}
                onChange={() => onChange(toggleAccessibilityNeed(value, accessibilityNeed))}
                data-testid={`contact-accessibility-${accessibilityNeed}`}
              />
              <span>{accessibilityNeedLabel(accessibilityNeed)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="patient-intake-mission-frame__contact-support-summary">
        {supportSummary(value)}
      </p>
    </section>
  );
}

export function RouteMaskedSummaryCard({ summaryView }: { summaryView: ContactSummaryView }) {
  return (
    <section
      className="patient-intake-mission-frame__route-masked-summary-card"
      data-testid="contact-masked-summary-card"
      data-completeness-state={summaryView.completenessState}
    >
      <div className="patient-intake-mission-frame__contact-section-head">
        <span>Masked summary</span>
        <p>Summaries outside this step stay masked, even while you edit contact details.</p>
      </div>
      <div className="patient-intake-mission-frame__summary-card">
        <div className="patient-intake-mission-frame__summary-row">
          <span>Preferred contact</span>
          <strong>{summaryView.preferredRouteLabel}</strong>
        </div>
        <div className="patient-intake-mission-frame__summary-row">
          <span>Masked destination</span>
          <strong>{summaryView.preferredDestinationMasked}</strong>
        </div>
        <div className="patient-intake-mission-frame__summary-row">
          <span>Follow-up</span>
          <strong>
            {summaryView.followUpPermissionState === "granted"
              ? "Allowed"
              : summaryView.followUpPermissionState === "declined"
                ? "Do not use"
                : "Still deciding"}
          </strong>
        </div>
        <div className="patient-intake-mission-frame__summary-row">
          <span>Timing</span>
          <strong>{summaryView.contactWindowLabel}</strong>
        </div>
        <div className="patient-intake-mission-frame__summary-row">
          <span>Quiet hours</span>
          <strong>{summaryView.quietHoursSummary}</strong>
        </div>
        <div className="patient-intake-mission-frame__summary-row">
          <span>Support needs</span>
          <strong>{summaryView.accessibilityNeedsLabel}</strong>
        </div>
      </div>
      {summaryView.reviewCue ? (
        <p
          className="patient-intake-mission-frame__contact-review-cue"
          data-testid="contact-review-cue"
          data-tone={summaryView.reviewCueTone}
        >
          {summaryView.reviewCue}
        </p>
      ) : null}
      {summaryView.reasonCodes.length > 0 ? (
        <ul className="patient-intake-mission-frame__contact-reason-list">
          {summaryView.reasonCodes.map((reasonCode) => (
            <li key={reasonCode}>{CONTACT_REASON_CODE_MESSAGES[reasonCode] ?? reasonCode}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ConfirmationCopyPreview({ preview }: { preview: ContactConfirmationCopyModel }) {
  return (
    <section
      className="patient-intake-mission-frame__confirmation-copy-preview"
      data-testid="contact-confirmation-copy-preview"
      data-copy-state={preview.state}
      data-tone={preview.tone}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="patient-intake-mission-frame__contact-section-head">
        <span>How we’ll confirm this</span>
        <p>{preview.body}</p>
      </div>
      <div className="patient-intake-mission-frame__contact-preview-pill">
        {preview.state.replaceAll("_", " ")}
      </div>
      <div className="patient-intake-mission-frame__contact-preview-rows">
        {preview.rows.map((row) => (
          <div
            key={`${row.label}:${row.value}`}
            className="patient-intake-mission-frame__summary-row"
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
      <span className="patient-intake-mission-frame__visually-hidden">
        {preview.liveAnnouncement}
      </span>
    </section>
  );
}

export function TrustBoundaryNote({
  summaryView,
  preview,
}: {
  summaryView: ContactSummaryView;
  preview: ContactConfirmationCopyModel;
}) {
  return (
    <aside
      className="patient-intake-mission-frame__trust-boundary-note"
      data-testid="contact-trust-boundary-note"
    >
      <strong>Privacy and contact details</strong>
      <p>
        Ordinary summaries stay masked. This step records what you chose, not whether the contact method is
        verified or whether a message was delivered.
      </p>
      <p>
        Current preview: <strong>{preview.state.replaceAll("_", " ")}</strong>. The receipt may add
        delivery details later, but it will still keep private details masked.
      </p>
      {summaryView.hasSafetyRelevantDelta ? (
        <p className="patient-intake-mission-frame__trust-boundary-note--review">
          Review this change before you submit because the contact method, timing, or support needs changed.
        </p>
      ) : null}
    </aside>
  );
}

export function buildStepPreviewModel(
  summaryView: ContactSummaryView,
): ContactConfirmationCopyModel {
  return buildConfirmationCopyPreview({
    summaryView,
    lifecycleState: "step_preview",
  });
}
