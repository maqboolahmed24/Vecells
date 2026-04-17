import { describe, expect, it } from "vitest";
import {
  buildContactSummaryView,
  createDefaultDraftContactPreferences,
} from "./patient-intake-contact-preferences";
import {
  buildUrgentOutcomeSurface,
  createDefaultUrgentOutcomeSimulation,
  issueUrgentOutcome,
} from "./patient-intake-urgent-outcome";

function buildContactSummary() {
  return buildContactSummaryView({
    preferences: {
      ...createDefaultDraftContactPreferences(),
      preferredChannel: "sms",
      followUpPermission: "granted",
      destinations: {
        sms: "07700 900888",
        phone: "020 7946 0011",
        email: "alex.patient@example.test",
      },
    },
    baselinePreferences: createDefaultDraftContactPreferences(),
  });
}

describe("patient intake urgent outcome", () => {
  it("keeps urgent required pending separate from urgent issued until settlement is issued", () => {
    const required = buildUrgentOutcomeSurface({
      routeKey: "urgent_outcome",
      requestPublicId: "req_qc_2049",
      requestType: "Symptoms",
      detailNarrative: "Severe chest tightness reported in the latest question frame.",
      attachmentCount: 1,
      contactSummaryView: buildContactSummary(),
      simulationState: createDefaultUrgentOutcomeSimulation(),
    });

    expect(required?.variant).toBe("urgent_required_pending");
    expect(required?.requestSafetyState).toBe("urgent_diversion_required");
    expect(required?.urgentDiversionSettlementState).toBe("pending");
    expect(required?.title).toBe("Get urgent help now");
    expect(required?.summary).toContain("routine queue");

    const issued = buildUrgentOutcomeSurface({
      routeKey: "urgent_outcome",
      requestPublicId: "req_qc_2049",
      requestType: "Symptoms",
      detailNarrative: "Severe chest tightness reported in the latest question frame.",
      attachmentCount: 1,
      contactSummaryView: buildContactSummary(),
      simulationState: issueUrgentOutcome(createDefaultUrgentOutcomeSimulation()),
    });

    expect(issued?.variant).toBe("urgent_issued");
    expect(issued?.requestSafetyState).toBe("urgent_diverted");
    expect(issued?.urgentDiversionSettlementState).toBe("issued");
    expect(issued?.title).toBe("Urgent guidance has been issued");
  });

  it("renders failed-safe recovery without borrowing routine receipt language", () => {
    const failedSafe = buildUrgentOutcomeSurface({
      routeKey: "resume_recovery",
      requestPublicId: "req_qc_2049",
      requestType: "Symptoms",
      detailNarrative: "Attachment meaning could not be resolved safely.",
      attachmentCount: 2,
      contactSummaryView: buildContactSummary(),
      simulationState: {
        urgentVariant: "urgent_required_pending",
        recoveryVariant: "failed_safe_recovery",
      },
    });

    expect(failedSafe?.variant).toBe("failed_safe_recovery");
    expect(failedSafe?.result).toBe("failed_safe");
    expect(failedSafe?.artifactState).toBe("summary_only");
    expect(failedSafe?.title).toBe("We could not safely complete this online");
    expect(failedSafe?.summary.toLowerCase()).not.toContain("sent");
    expect(failedSafe?.summary.toLowerCase()).not.toContain("review path");
  });
});
