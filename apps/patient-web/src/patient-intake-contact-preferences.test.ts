import { describe, expect, it } from "vitest";
import {
  buildConfirmationCopyPreview,
  buildContactSummaryView,
  createDefaultDraftContactPreferences,
} from "./patient-intake-contact-preferences";

describe("patient intake contact preferences", () => {
  it("masks all ordinary summary destinations", () => {
    const preferences = createDefaultDraftContactPreferences();
    const summaryView = buildContactSummaryView({
      preferences: {
        ...preferences,
        preferredChannel: "email",
        destinations: {
          sms: "07700 900123",
          phone: "020 7946 0012",
          email: "avery.patient@example.test",
        },
      },
    });

    expect(summaryView.preferredDestinationMasked).toContain("@");
    expect(summaryView.preferredDestinationMasked).not.toContain("avery.patient@example.test");
    expect(summaryView.destinations.sms.maskedValue).not.toContain("07700 900123");
    expect(summaryView.destinations.phone.maskedValue).not.toContain("020 7946 0012");
  });

  it("surfaces a bounded review cue when the saved contact method changes", () => {
    const baseline = createDefaultDraftContactPreferences();
    const changed = buildContactSummaryView({
      preferences: {
        ...baseline,
        preferredChannel: "phone",
        destinations: {
          ...baseline.destinations,
          phone: "020 7946 0099",
        },
      },
      baselinePreferences: baseline,
    });

    expect(changed.reasonCodes).toContain("CONTACT_PREF_PRIMARY_CHANNEL_CHANGED");
    expect(changed.reasonCodes).toContain("CONTACT_PREF_DESTINATION_CHANGED");
    expect(changed.reasonCodes).toContain(
      "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT",
    );
    expect(changed.reviewCue).toContain("safest contact method");
  });

  it("keeps the preview truthful about delivery before later evidence exists", () => {
    const summaryView = buildContactSummaryView({
      preferences: createDefaultDraftContactPreferences(),
    });
    const preview = buildConfirmationCopyPreview({
      summaryView,
      lifecycleState: "step_preview",
    });

    expect(preview.state).toBe("confirmation_attempt_planned");
    expect(preview.body).toContain("not delivery confirmation");
    expect(preview.rows.some((row) => row.value.includes("Delivery is checked later"))).toBe(true);
  });
});
