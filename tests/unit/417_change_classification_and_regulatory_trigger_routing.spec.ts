import { describe, expect, it } from "vitest";
import { createAssistiveAssurancePlane } from "../../packages/domains/assistive_assurance/src/index.ts";
import {
  assuranceActor,
  fixedAssuranceClock,
  materialChangeCommand,
} from "../integration/417_test_helpers.ts";

describe("417 change classification and regulatory trigger routing", () => {
  it("routes capability expansion across IM1, SCAL, DTAC, DCB, DPIA, MHRA, replay, and rollback evidence", () => {
    const plane = createAssistiveAssurancePlane({ clock: fixedAssuranceClock });

    const assessment = plane.changeImpact.assessChangeImpact(
      materialChangeCommand(),
      assuranceActor("change_impact_assessor"),
    );

    expect(assessment.assessmentState).toBe("complete");
    expect(assessment.im1RfcRequired).toBe(true);
    expect(assessment.scalUpdateRequired).toBe(true);
    expect(assessment.dtacDeltaRequired).toBe(true);
    expect(assessment.dcb0129DeltaRequired).toBe(true);
    expect(assessment.dcb0160DependencyNoteRequired).toBe(true);
    expect(assessment.dpiaDeltaRequired).toBe(true);
    expect(assessment.mhraAssessmentRequired).toBe(true);
    expect(assessment.medicalDeviceReassessmentRequired).toBe(true);
    expect(assessment.evaluationRerunRequired).toBe(true);
    expect(assessment.replayProofRequired).toBe(true);
    expect(assessment.rollbackProofRequired).toBe(true);
    expect(assessment.localTechnicalAssuranceRequired).toBe(true);
  });

  it("blocks a template-only claim when real deltas prove material impact", () => {
    const plane = createAssistiveAssurancePlane({ clock: fixedAssuranceClock });

    const assessment = plane.changeImpact.assessChangeImpact(
      materialChangeCommand({
        changeClass: "copy_template_only",
        workflowDecisionDelta: true,
        patientFacingWordingDelta: true,
        candidateHashStable: false,
        medicalPurposeBoundaryState: "higher_function_summarisation_structured_inference",
      }),
      assuranceActor("change_impact_assessor"),
    );

    expect(assessment.assessmentState).toBe("blocked");
    expect(assessment.blockingReasonCodes).toEqual(
      expect.arrayContaining([
        "copy_template_only_claim_has_material_delta",
        "copy_template_only_requires_stable_candidate_hash",
      ]),
    );
  });
});
