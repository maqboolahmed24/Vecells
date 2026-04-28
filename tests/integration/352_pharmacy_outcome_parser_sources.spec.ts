import { describe, expect, it } from "vitest";

import { create352OutcomeHarness } from "./352_pharmacy_outcome.helpers.ts";

describe("352 pharmacy outcome parser sources", () => {
  it("preserves trust and provenance differences across all four source families", async () => {
    const harness = create352OutcomeHarness();
    const cases = [
      {
        sourceType: "gp_workflow_observation" as const,
        expectedTrustClass: "trusted_observed",
      },
      {
        sourceType: "direct_structured_message" as const,
        expectedTrustClass: "trusted_structured",
      },
      {
        sourceType: "email_ingest" as const,
        expectedTrustClass: "email_low_assurance",
      },
      {
        sourceType: "manual_structured_capture" as const,
        expectedTrustClass: "manual_operator_entered",
      },
    ];

    for (const testCase of cases) {
      const preview = await harness.outcomeService.previewNormalizedOutcome({
        sourceType: testCase.sourceType,
        sourceMessageKey: `${testCase.sourceType}_352_source`,
        receivedAt: "2026-04-23T18:00:00.000Z",
        rawPayload: {
          classificationState: "resolved_no_supply",
          patientRefId: "patient_352_source",
          providerOdsCode: "A10001",
          serviceType: "clinical_pathway_consultation",
          correlationRefs: ["corr_352_source"],
        },
      });

      expect(preview.parsed.envelope.trustClass).toBe(testCase.expectedTrustClass);
      expect(preview.parsed.provenance.fieldOriginRefs).toHaveLength(1);
      expect(preview.parsed.normalized.classificationState).toBe("resolved_no_supply");
    }
  });
});
