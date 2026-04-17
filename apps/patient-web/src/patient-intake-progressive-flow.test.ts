import { describe, expect, it } from "vitest";
import {
  answerProgressiveQuestion,
  buildProgressiveFlowView,
  confirmRequestTypeChange,
  createDefaultStructuredAnswers,
  moveDetailsForward,
  selectRequestType,
  type ProgressiveFlowMemoryShape,
  type ProgressiveSupersededAnswerRecord,
} from "./patient-intake-progressive-flow";

describe("patient intake progressive flow", () => {
  it("requires confirm-and-supersede when the request type changes after branch answers exist", () => {
    const memory: ProgressiveFlowMemoryShape = {
      requestType: "Symptoms" as const,
      structuredAnswers: createDefaultStructuredAnswers(),
      reviewAffirmed: true,
    };

    const pending = selectRequestType(memory, "Meds");

    expect(pending.pendingRequestTypeChange?.currentRequestType).toBe("Symptoms");
    expect(pending.pendingRequestTypeChange?.nextRequestType).toBe("Meds");
    expect(pending.pendingRequestTypeChange?.impactedQuestionKeys).toContain("symptoms.category");

    const confirmed = confirmRequestTypeChange(pending);

    expect(confirmed.requestType).toBe("Meds");
    expect(Object.keys(confirmed.structuredAnswers ?? {})).toHaveLength(0);
    expect(
      confirmed.supersededAnswers?.some(
        (entry: ProgressiveSupersededAnswerRecord) => entry.questionKey === "symptoms.category",
      ),
    ).toBe(true);
  });

  it("supersedes hidden branch answers and removes them from the active summary", () => {
    const withExactDate: ProgressiveFlowMemoryShape = {
      requestType: "Symptoms" as const,
      structuredAnswers: {
        "symptoms.category": "chest_breathing",
        "symptoms.chestPainLocation": "centre_chest",
        "symptoms.onsetPrecision": "exact_date",
        "symptoms.onsetDate": "2026-04-10",
      },
      reviewAffirmed: true,
    };

    const changed = answerProgressiveQuestion(withExactDate, "symptoms.onsetPrecision", "approximate_window");
    const withWindow = answerProgressiveQuestion(changed, "symptoms.onsetWindow", "last_2_days");
    const flow = buildProgressiveFlowView(withWindow);

    expect(
      withWindow.supersededAnswers?.some(
        (entry: ProgressiveSupersededAnswerRecord) => entry.questionKey === "symptoms.onsetDate",
      ),
    ).toBe(true);
    expect(flow.activeSummaryChips.some((chip) => chip.questionKey === "symptoms.onsetDate")).toBe(false);
    expect(changed.deltaNotice?.kind).toBe("branch_superseded");
  });

  it("keeps a safety-review delta notice active until the patient acknowledges it", () => {
    const symptomsDraft: ProgressiveFlowMemoryShape = {
      requestType: "Symptoms" as const,
      structuredAnswers: createDefaultStructuredAnswers(),
      reviewAffirmed: true,
    };
    const changedCategory = answerProgressiveQuestion(symptomsDraft, "symptoms.category", "general");

    expect(changedCategory.reviewAffirmed).toBe(false);
    expect(changedCategory.deltaNotice?.kind).toBe("safety_review_required");

    const advanced = moveDetailsForward(changedCategory);
    expect(advanced.nextMemory.deltaNotice?.kind).toBe("safety_review_required");
    expect(advanced.nextMemory.reviewAffirmed).toBe(false);
  });

  it("validates the current question frame before details can continue", () => {
    const incomplete: ProgressiveFlowMemoryShape = {
      requestType: "Results" as const,
      structuredAnswers: {},
      detailsCursorQuestionKey: "results.context",
      reviewAffirmed: true,
    };

    const blocked = moveDetailsForward(incomplete);
    expect(blocked.complete).toBe(false);
    expect(blocked.validationIssues[0]?.code).toBe("FIELD_REQUIRED");

    const answered = answerProgressiveQuestion(incomplete, "results.context", "blood_test");
    const advanced = moveDetailsForward(answered);
    expect(advanced.validationIssues).toHaveLength(0);
    expect(advanced.nextMemory.detailsCursorQuestionKey).toBe("results.testName");
  });

  it("surfaces the requested bundle compatibility posture in the recovery sheet", () => {
    const reviewMode = buildProgressiveFlowView({
      requestType: "Admin",
      structuredAnswers: {},
      bundleCompatibilityMode: "review_migration_required",
      bundleCompatibilityScenarioId: "BC_140_EMBEDDED_MANIFEST_ALIGNMENT_V1",
      reviewAffirmed: true,
    });

    expect(reviewMode.bundleCompatibilitySheet.compatibilityMode).toBe("review_migration_required");
    expect(reviewMode.bundleCompatibilitySheet.title).toContain("Review");
  });
});
