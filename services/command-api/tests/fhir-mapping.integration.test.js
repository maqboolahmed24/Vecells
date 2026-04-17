import { describe, expect, it } from "vitest";
import {
  createFhirRepresentationCompilerApplication,
  fhirRepresentationPersistenceTables,
} from "../src/fhir-mapping.ts";
import { fhirRepresentationContracts } from "@vecells/fhir-mapping";

function getContract(contractId) {
  const contract = fhirRepresentationContracts.find(
    (candidate) => candidate.fhirRepresentationContractId === contractId,
  );
  if (!contract) {
    throw new Error(`Missing FHIR contract ${contractId}`);
  }
  return contract;
}

describe("FHIR representation compiler application seam", () => {
  it("composes the contract-driven FHIR compiler with append-only persistence tables", async () => {
    const application = createFhirRepresentationCompilerApplication();
    const requestContract = getContract("FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1");

    const first = await application.compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T16:00:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_cmd_064_001",
        aggregateVersionRef: "request_cmd_064_001_v1",
        lineageRef: "lineage_cmd_064_001",
        aggregateState: "submitted",
        subjectRef: "patient_cmd_064_001",
        evidenceSnapshotRef: "snapshot_cmd_064_001_v1",
        payload: {
          messageText: "Command API emits request FHIR package.",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    const second = await application.compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T16:01:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_cmd_064_001",
        aggregateVersionRef: "request_cmd_064_001_v2",
        lineageRef: "lineage_cmd_064_001",
        aggregateState: "triage_ready",
        subjectRef: "patient_cmd_064_001",
        evidenceSnapshotRef: "snapshot_cmd_064_001_v2",
        payload: {
          messageText: "Command API emits superseding request FHIR package.",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/064_fhir_mapping_compiler.sql",
    );
    expect(fhirRepresentationPersistenceTables).toEqual([
      "fhir_representation_contracts",
      "fhir_representation_sets",
      "fhir_resource_records",
      "fhir_exchange_bundles",
    ]);
    expect(first.representationSet.toSnapshot().representationState).toBe("emitted");
    expect(second.representationSet.toSnapshot().monotoneRevision).toBe(2);
    expect(second.exchangeBundle?.toSnapshot().bundleType).toBe("document");
    expect(
      (
        await application.repositories.getRepresentationSet(
          first.representationSet.fhirRepresentationSetId,
        )
      )?.toSnapshot().representationState,
    ).toBe("superseded");
  });
});
