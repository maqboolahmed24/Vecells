import { describe, expect, it } from "vitest";
import { build474CutoverArtifacts, stableStringify } from "../../tools/migration/plan_474_cutover";

const forbiddenPatterns =
  /nhsNumber|patientNhs|clinicalNarrative|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;

describe("task 474 reference dataset masking", () => {
  it("publishes only synthetic, masked, tenant-scoped reference data", () => {
    const { referenceDatasetManifest } = build474CutoverArtifacts();

    expect(referenceDatasetManifest.privacyAttestation.syntheticOnly).toBe(true);
    expect(referenceDatasetManifest.privacyAttestation.noPhi).toBe(true);
    expect(referenceDatasetManifest.privacyAttestation.noPii).toBe(true);
    expect(referenceDatasetManifest.privacyAttestation.tenantCrossingIdentifiersPresent).toBe(
      false,
    );
    expect(referenceDatasetManifest.privacyAttestation.rawIdentifierFields).toEqual([]);

    for (const record of referenceDatasetManifest.recordClasses) {
      expect(record.phiClassification).toBe("none");
      expect(record.rawIdentifierFields).toEqual([]);
      expect(record.tenantScope).toBe(referenceDatasetManifest.tenantScope);
      expect(record.recordClassHash).toMatch(/^[a-f0-9]{64}$/);
    }

    expect(
      referenceDatasetManifest.rejectedEdgeCases.map((edgeCase) => edgeCase.edgeCaseId),
    ).toEqual(
      expect.arrayContaining([
        "reference_dataset_unmasked_phi_rejected",
        "reference_dataset_tenant_crossing_identifier_rejected",
      ]),
    );
    expect(stableStringify(referenceDatasetManifest)).not.toMatch(forbiddenPatterns);
  });
});
