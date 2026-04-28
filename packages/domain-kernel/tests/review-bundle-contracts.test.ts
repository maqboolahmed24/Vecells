import { describe, expect, it } from "vitest";
import {
  buildReviewProjectionRef,
  classifyReviewDeltaPacket,
  renderDeterministicReviewSummary,
  resolveReviewSummaryVisibility,
  type ReviewStructuredAnswer,
} from "../src/index.ts";

function answers(entries: readonly [string, string, string][]): readonly ReviewStructuredAnswer[] {
  return entries.map(([questionId, question, answer]) => ({
    questionId,
    question,
    answer,
    sourceArtifactRefs: [`artifact_${questionId}`],
  }));
}

describe("review bundle shared contracts", () => {
  it("renders the same deterministic summary for equivalent authoritative evidence", () => {
    const first = renderDeterministicReviewSummary({
      templateVersion: "review_summary_v1",
      rulesVersion: "rules_v1",
      requestSummary: ["Headache follow-up", "Needs clinician review"],
      structuredAnswers: answers([
        ["q_2", "Duration", "Three days"],
        ["q_1", "Severity", "8/10"],
      ]),
      patientNarrative: "Pain is worse overnight.",
      safetySummary: ["No red flag triggered"],
      telephonySummary: ["Inbound continuation"],
      transcriptSummary: "Caller confirmed pain escalation overnight.",
      attachmentLabels: ["medication-photo.jpg", "sleep-log.pdf"],
      identitySummary: ["Matched subject", "Confidence medium"],
      contactSummary: ["SMS preferred"],
      priorResponseSummary: ["Patient replied to more-info at 08:10Z"],
      duplicateSummary: ["No duplicate cluster"],
      slaSummary: ["SLA on track"],
      visibilityState: "authoritative",
    });

    const second = renderDeterministicReviewSummary({
      templateVersion: "review_summary_v1",
      rulesVersion: "rules_v1",
      requestSummary: ["Headache follow-up", "Needs clinician review"],
      structuredAnswers: answers([
        ["q_1", "Severity", "8/10"],
        ["q_2", "Duration", "Three days"],
      ]),
      patientNarrative: "Pain is worse overnight.",
      safetySummary: ["No red flag triggered"],
      telephonySummary: ["Inbound continuation"],
      transcriptSummary: "Caller confirmed pain escalation overnight.",
      attachmentLabels: ["sleep-log.pdf", "medication-photo.jpg"],
      identitySummary: ["Matched subject", "Confidence medium"],
      contactSummary: ["SMS preferred"],
      priorResponseSummary: ["Patient replied to more-info at 08:10Z"],
      duplicateSummary: ["No duplicate cluster"],
      slaSummary: ["SLA on track"],
      visibilityState: "authoritative",
    });

    expect(first.summaryDigest).toBe(second.summaryDigest);
    expect(first.summaryText).toBe(second.summaryText);
    expect(first.summaryLines).toEqual(second.summaryLines);
  });

  it("suppresses authoritative regenerated copy when parity is not safe", () => {
    const visibility = resolveReviewSummaryVisibility({
      parityState: "blocked",
      missingRequiredProvenance: false,
    });

    const summary = renderDeterministicReviewSummary({
      templateVersion: "review_summary_v1",
      rulesVersion: "rules_v1",
      requestSummary: ["Awaiting evidence rebuild"],
      structuredAnswers: [],
      patientNarrative: null,
      safetySummary: ["Safety meaning unresolved"],
      telephonySummary: [],
      transcriptSummary: null,
      attachmentLabels: [],
      identitySummary: ["Identity stable"],
      contactSummary: ["Portal only"],
      priorResponseSummary: [],
      duplicateSummary: [],
      slaSummary: ["SLA held"],
      visibilityState: visibility.visibilityState,
      suppressionReasonCodes: visibility.suppressionReasonCodes,
    });

    expect(summary.visibilityState).toBe("suppressed");
    expect(summary.summaryLines).toEqual([]);
    expect(summary.summaryText).toBeNull();
    expect(summary.provisionalText).toBeNull();
    expect(summary.suppressionReasonCodes).toContain("REVIEW_235_PARITY_BLOCKED");
  });

  it("allows provisional regenerated copy only for stale parity", () => {
    const visibility = resolveReviewSummaryVisibility({
      parityState: "stale",
      missingRequiredProvenance: false,
    });

    const summary = renderDeterministicReviewSummary({
      templateVersion: "review_summary_v1",
      rulesVersion: "rules_v1",
      requestSummary: ["Awaiting parity refresh"],
      structuredAnswers: [],
      patientNarrative: null,
      safetySummary: ["Safety meaning unchanged"],
      telephonySummary: [],
      transcriptSummary: null,
      attachmentLabels: [],
      identitySummary: ["Identity stable"],
      contactSummary: ["Portal only"],
      priorResponseSummary: [],
      duplicateSummary: [],
      slaSummary: ["SLA held"],
      visibilityState: visibility.visibilityState,
      suppressionReasonCodes: visibility.suppressionReasonCodes,
    });

    expect(summary.visibilityState).toBe("provisional");
    expect(summary.summaryText).toBeNull();
    expect(summary.provisionalText).toContain("Awaiting parity refresh");
    expect(summary.suppressionReasonCodes).toContain("REVIEW_235_PARITY_STALE");
  });

  it("classifies duplicate and decision supersession as decisive delta", () => {
    expect(
      classifyReviewDeltaPacket({
        contradictions: [],
        actionInvalidationTypes: ["duplicate_lineage_supersession"],
        changedFieldRefs: ["duplicate_resolution_ref"],
        newEvidenceCount: 1,
      }),
    ).toBe("decisive");

    expect(
      classifyReviewDeltaPacket({
        contradictions: [],
        actionInvalidationTypes: ["approval_posture_changed"],
        changedFieldRefs: ["approval_posture"],
        newEvidenceCount: 0,
      }),
    ).toBe("consequential");
  });

  it("builds stable projection refs from equivalent payloads", () => {
    const first = buildReviewProjectionRef("review_bundle", {
      taskId: "task_235",
      snapshot: "snapshot_current",
    });
    const second = buildReviewProjectionRef("review_bundle", {
      snapshot: "snapshot_current",
      taskId: "task_235",
    });

    expect(first).toBe(second);
  });
});
