import fs from "node:fs";
import { describe, expect, it } from "vitest";

const suite = JSON.parse(
  fs.readFileSync(
    new URL("../../../../data/test/exception_path_suite_results.json", import.meta.url),
    "utf8",
  ),
);

function findCase(caseId: string) {
  const row = suite.exceptionCases.find((entry: { caseId: string }) => entry.caseId === caseId);
  if (!row) {
    throw new Error(`Missing seq_135 case ${caseId}.`);
  }
  return row;
}

describe("seq_135 identity access exception path suite", () => {
  it("keeps same-request attach guarded by continuity proof and conditional safety reassessment", () => {
    const attach = findCase("CASE_135_SAME_REQUEST_ATTACH_PROVEN");

    expect(attach.caseFamily).toBe("same_request_attach_requires_proof");
    expect(attach.continuityWitnessClass).toBe("workflow_return");
    expect(attach.safetyReassessmentContract).toBe("required_if_material_delta");
    expect(attach.closureBlocked).toBe(false);
    expect(
      attach.eventExpectations.map((entry: { eventName: string }) => entry.eventName),
    ).toEqual(
      expect.arrayContaining(["request.duplicate.attach_applied", "safety.reassessed"]),
    );
  });

  it("keeps duplicate and fallback review blockers orthogonal to closure milestones", () => {
    const duplicateBlocked = findCase("CASE_135_CLOSURE_BLOCKED_BY_DUPLICATE_REVIEW");
    const fallbackBlocked = findCase("CASE_135_CLOSURE_BLOCKED_BY_FALLBACK");

    expect(duplicateBlocked.caseFamily).toBe("closure_blocked_while_review_open");
    expect(duplicateBlocked.closureBlocked).toBe(true);
    expect(duplicateBlocked.blockerRefs).toContain("duplicate_cluster_001");

    expect(fallbackBlocked.caseFamily).toBe("closure_blocked_while_review_open");
    expect(fallbackBlocked.closureBlocked).toBe(true);
    expect(fallbackBlocked.blockerRefs).toEqual(
      expect.arrayContaining([
        "command_api_request_closure_fallbackReviewCase_0001",
        "fallback_case_restore_review_001",
      ]),
    );
  });

  it("keeps quarantined continuity truthful instead of silently clearing fallback debt", () => {
    const fallback = findCase("CASE_135_QUARANTINE_FALLBACK_CONTINUITY");

    expect(fallback.caseFamily).toBe("quarantine_opens_fallback_review");
    expect(fallback.patientVisibleState).toBe("submitted_degraded");
    expect(fallback.closureBlocked).toBe(true);
    expect(fallback.blockerRefs).toEqual(
      expect.arrayContaining([
        "command_api_request_closure_fallbackReviewCase_0001",
        "fallback_case_restore_review_001",
      ]),
    );
    expect(fallback.continuityOutcome).toContain("same lineage");
    expect(
      fallback.eventExpectations.map((entry: { eventName: string }) => entry.eventName),
    ).toEqual(
      expect.arrayContaining(["intake.attachment.quarantined", "exception.review_case.opened"]),
    );
  });
});
