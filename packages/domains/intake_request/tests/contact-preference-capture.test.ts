import { describe, expect, it } from "vitest";
import {
  createPhase1ContactPreferenceService,
  createPhase1ContactPreferenceStore,
} from "../src/contact-preference-capture";

function buildInput(overrides = {}) {
  return {
    envelopeRef: "submissionEnvelope_147_0001",
    draftPublicId: "dft_147contact0001",
    preferredChannel: "sms",
    destinations: {
      sms: "+44 7700 900123",
      phone: "+44 7700 900456",
      email: "patient@example.com",
    },
    contactWindow: "weekday_daytime",
    voicemailAllowed: true,
    followUpPermission: true,
    quietHours: {
      startLocalTime: "20:00",
      endLocalTime: "08:00",
      timezone: "Europe/London",
    },
    languagePreference: "en",
    translationRequired: false,
    accessibilityNeeds: ["large_text"],
    sourceAuthorityClass: "self_service_browser_entry",
    sourceEvidenceRef: "draft_patch::cmd_147_001",
    clientCommandId: "cmd_147_001",
    idempotencyKey: "idem_147_001",
    recordedAt: "2026-04-14T17:10:00Z",
    ...overrides,
  } as const;
}

describe("contact preference capture", () => {
  it("stores protected destinations separately from masked summaries and replays exact idempotent writes", async () => {
    const repositories = createPhase1ContactPreferenceStore();
    const service = createPhase1ContactPreferenceService({ repositories });

    const first = await service.captureContactPreferences(buildInput());
    const replay = await service.captureContactPreferences(buildInput());

    expect(first.replayed).toBe(false);
    expect(first.maskedView.toSnapshot().preferredDestinationMasked).toContain("••");
    expect(first.maskedView.toSnapshot().preferredDestinationMasked).not.toContain("900123");
    expect(first.capture.toSnapshot().smsDestination?.rawValue).toBe("+44 7700 900123");
    expect(first.capture.toSnapshot().smsDestination?.normalizedValue).toBe("+447700900123");
    expect(replay.replayed).toBe(true);
    expect(replay.capture.contactPreferenceCaptureId).toBe(first.capture.contactPreferenceCaptureId);
    expect(replay.maskedView.maskedViewId).toBe(first.maskedView.maskedViewId);
  });

  it("appends a fresh version for divergent route changes and records machine-readable route-delta reason codes", async () => {
    const repositories = createPhase1ContactPreferenceStore();
    const service = createPhase1ContactPreferenceService({ repositories });

    const first = await service.captureContactPreferences(buildInput());
    const second = await service.captureContactPreferences(
      buildInput({
        destinations: {
          sms: "+44 7700 900999",
          phone: "+44 7700 900456",
          email: "patient@example.com",
        },
        clientCommandId: "cmd_147_002",
        idempotencyKey: "idem_147_002",
        recordedAt: "2026-04-14T17:12:00Z",
      }),
    );

    expect(second.replayed).toBe(false);
    expect(second.capture.contactPreferenceCaptureId).not.toBe(first.capture.contactPreferenceCaptureId);
    expect(second.capture.toSnapshot().captureVersion).toBe(2);
    expect(second.capture.toSnapshot().reasonCodes).toContain("CONTACT_PREF_DESTINATION_CHANGED");
    expect(second.capture.toSnapshot().reasonCodes).toContain(
      "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT",
    );
    expect(second.routeSnapshotSeed?.toSnapshot().routeVersionRef).not.toBe(
      first.routeSnapshotSeed?.toSnapshot().routeVersionRef,
    );
  });

  it("freezes complete preferences for submit and exposes one stable normalization ref and route snapshot seed", async () => {
    const repositories = createPhase1ContactPreferenceStore();
    const service = createPhase1ContactPreferenceService({ repositories });

    const captured = await service.captureContactPreferences(buildInput());
    const frozen = await service.freezeContactPreferencesForSubmit({
      draftPublicId: captured.capture.draftPublicId,
      envelopeRef: captured.capture.envelopeRef,
      frozenAt: "2026-04-14T17:14:00Z",
    });

    expect(frozen.replayed).toBe(false);
    expect(frozen.submitFreeze.toSnapshot().contactPreferencesRef).toBe(
      captured.capture.contactPreferencesRef,
    );
    expect(frozen.routeSnapshotSeed?.toSnapshot().normalizedAddressRef).toMatch(
      /^contact_normalized_address::/,
    );
    expect(frozen.validationSummary.completenessState).toBe("complete");
  });

  it("reports incomplete validation truth when the preferred channel destination or follow-up permission is missing", async () => {
    const repositories = createPhase1ContactPreferenceStore();
    const service = createPhase1ContactPreferenceService({ repositories });

    await service.captureContactPreferences(
      buildInput({
        destinations: {
          sms: null,
          phone: null,
          email: "patient@example.com",
        },
        followUpPermission: null,
        clientCommandId: "cmd_147_003",
        idempotencyKey: "idem_147_003",
      }),
    );

    const summary = await service.buildValidationSummaryForDraft(
      "dft_147contact0001",
      "submissionEnvelope_147_0001",
    );

    expect(summary.completenessState).toBe("incomplete");
    expect(summary.reasonCodes).toContain("CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL");
    expect(summary.reasonCodes).toContain("CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED");
    expect(summary.routeSnapshotSeedRef).toBeNull();
  });
});
