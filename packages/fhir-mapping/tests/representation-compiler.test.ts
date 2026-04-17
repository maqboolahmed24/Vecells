import { describe, expect, it } from "vitest";
import {
  authorizeAdapterConsumption,
  createFhirRepresentationCompiler,
  createFhirRepresentationStore,
  fhirExchangeBundlePolicies,
  fhirIdentifierPolicies,
  fhirRepresentationContracts,
  fhirStatusMappingPolicies,
  type FhirBundleType,
  type FhirExchangeBundlePolicy,
  type FhirRepresentationContractSnapshot,
} from "../src/index.ts";

function createCompilerRuntime(options?: {
  contracts?: readonly FhirRepresentationContractSnapshot[];
  bundlePolicies?: readonly FhirExchangeBundlePolicy[];
}) {
  const store = createFhirRepresentationStore({
    contracts: options?.contracts ?? fhirRepresentationContracts,
    bundlePolicies: options?.bundlePolicies ?? fhirExchangeBundlePolicies,
    identifierPolicies: fhirIdentifierPolicies,
    statusPolicies: fhirStatusMappingPolicies,
  });

  return {
    store,
    compiler: createFhirRepresentationCompiler(store),
  };
}

function getContract(contractId: string): FhirRepresentationContractSnapshot {
  const contract = fhirRepresentationContracts.find(
    (candidate) => candidate.fhirRepresentationContractId === contractId,
  );
  if (!contract) {
    throw new Error(`Missing FHIR contract ${contractId}`);
  }
  return contract;
}

describe("FHIR representation compiler", () => {
  it("rematerializes the same aggregate version deterministically and replays the existing set", async () => {
    const requestContract = getContract("FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1");
    const { compiler, store } = createCompilerRuntime();

    const first = await compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T15:00:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_064_001",
        aggregateVersionRef: "request_064_001_v1",
        lineageRef: "lineage_064_001",
        aggregateState: "submitted",
        subjectRef: "patient_064_001",
        evidenceSnapshotRef: "snapshot_064_001",
        payload: {
          messageText: "Patient supplied evidence bundle is ready for interchange.",
          requestLifecycleLeaseRef: "lease_internal_only",
          closureTruthOwner: "Request",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    const replay = await compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T15:01:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_064_001",
        aggregateVersionRef: "request_064_001_v1",
        lineageRef: "lineage_064_001",
        aggregateState: "submitted",
        subjectRef: "patient_064_001",
        evidenceSnapshotRef: "snapshot_064_001",
        payload: {
          messageText: "Patient supplied evidence bundle is ready for interchange.",
          requestLifecycleLeaseRef: "lease_internal_only",
          closureTruthOwner: "Request",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    expect(replay.replayed).toBe(true);
    expect(replay.representationSet.fhirRepresentationSetId).toBe(
      first.representationSet.fhirRepresentationSetId,
    );
    expect(replay.exchangeBundle?.toSnapshot().transportPayloadHash).toBe(
      first.exchangeBundle?.toSnapshot().transportPayloadHash,
    );
    expect(
      replay.resourceRecords.map((record) => ({
        logicalId: record.logicalId,
        versionId: record.versionId,
      })),
    ).toEqual(
      first.resourceRecords.map((record) => ({
        logicalId: record.logicalId,
        versionId: record.versionId,
      })),
    );
    expect(
      (
        await store.getRepresentationSet(first.representationSet.fhirRepresentationSetId)
      )?.toSnapshot().recordVersion,
    ).toBe(1);
  });

  it("supersedes the prior emitted set append-only when a new aggregate version materializes", async () => {
    const requestContract = getContract("FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1");
    const { compiler, store } = createCompilerRuntime();

    const versionOne = await compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T15:10:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_064_002",
        aggregateVersionRef: "request_064_002_v1",
        lineageRef: "lineage_064_002",
        aggregateState: "submitted",
        subjectRef: "patient_064_002",
        evidenceSnapshotRef: "snapshot_064_002_v1",
        payload: {
          messageText: "Initial request representation.",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    const versionTwo = await compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T15:11:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_064_002",
        aggregateVersionRef: "request_064_002_v2",
        lineageRef: "lineage_064_002",
        aggregateState: "triage_ready",
        subjectRef: "patient_064_002",
        evidenceSnapshotRef: "snapshot_064_002_v2",
        payload: {
          messageText: "Superseding request representation.",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    const supersededVersionOne = await store.getRepresentationSet(
      versionOne.representationSet.fhirRepresentationSetId,
    );
    expect(supersededVersionOne?.toSnapshot().representationState).toBe("superseded");
    expect(supersededVersionOne?.toSnapshot().recordVersion).toBe(2);
    expect(supersededVersionOne?.toSnapshot().supersededByRepresentationSetRef).toBe(
      versionTwo.representationSet.fhirRepresentationSetId,
    );
    expect(versionTwo.representationSet.toSnapshot().monotoneRevision).toBe(2);
    expect(versionTwo.representationSet.toSnapshot().supersedesRepresentationSetRef).toBe(
      versionOne.representationSet.fhirRepresentationSetId,
    );
    expect(
      (
        await store.getCurrentRepresentationSetForContractAggregate(
          requestContract.fhirRepresentationContractId,
          "request_064_002",
        )
      )?.fhirRepresentationSetId,
    ).toBe(versionTwo.representationSet.fhirRepresentationSetId);
  });

  it("rejects unsupported resource types and unsupported bundle types at the published contract boundary", async () => {
    const validContract = getContract("FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1");

    expect(() =>
      createFhirRepresentationStore({
        contracts: [
          {
            ...validContract,
            fhirRepresentationContractId: "FRC_064_INVALID_RESOURCE",
            allowedResourceTypes: [
              ...validContract.allowedResourceTypes,
              "Observation" as unknown as FhirRepresentationContractSnapshot["allowedResourceTypes"][number],
            ],
          },
        ],
        bundlePolicies: fhirExchangeBundlePolicies,
        identifierPolicies: fhirIdentifierPolicies,
        statusPolicies: fhirStatusMappingPolicies,
      }),
    ).toThrowError(/unsupported resource type/i);

    const invalidBundleContract: FhirRepresentationContractSnapshot = {
      ...validContract,
      fhirRepresentationContractId: "FRC_064_INVALID_BUNDLE",
      contractVersionRef: "FRCV_064_INVALID_BUNDLE",
      declaredBundlePolicyRefs: ["FXBP_064_INVALID_BUNDLE"],
    };
    const invalidBundlePolicy: FhirExchangeBundlePolicy = {
      ...fhirExchangeBundlePolicies[0]!,
      policyId: "FXBP_064_INVALID_BUNDLE",
      representationContractRefs: [invalidBundleContract.fhirRepresentationContractId],
      legalBundleTypes: ["document", "subscription-notification" as unknown as FhirBundleType],
    };
    const { compiler } = createCompilerRuntime({
      contracts: [invalidBundleContract],
      bundlePolicies: [invalidBundlePolicy],
    });

    await expect(
      compiler.materializeRepresentationSet({
        representationContractRef: invalidBundleContract.fhirRepresentationContractId,
        generatedAt: "2026-04-12T15:20:00Z",
        bundlePolicyRef: invalidBundlePolicy.policyId,
        aggregate: {
          governingAggregateType: invalidBundleContract.governingAggregateType,
          aggregateRef: "request_064_invalid_bundle",
          aggregateVersionRef: "request_064_invalid_bundle_v1",
          lineageRef: "lineage_064_invalid_bundle",
          aggregateState: "submitted",
          subjectRef: "patient_invalid_bundle",
          evidenceSnapshotRef: "snapshot_invalid_bundle",
          payload: {},
          availableEvidenceRefs: invalidBundleContract.requiredEvidenceRefs,
        },
      }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_BUNDLE_TYPE" });
  });

  it("allows adapters to consume only published contract rows and allowed bundle types", async () => {
    const requestContract = getContract("FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1");
    const { compiler } = createCompilerRuntime();

    const result = await compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T15:30:00Z",
      bundlePolicyRef: requestContract.declaredBundlePolicyRefs[0],
      adapterContractProfileRef: "ACP_049_CLINICAL_REQUEST_INTERCHANGE",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_064_003",
        aggregateVersionRef: "request_064_003_v1",
        lineageRef: "lineage_064_003",
        aggregateState: "submitted",
        subjectRef: "patient_064_003",
        evidenceSnapshotRef: "snapshot_064_003",
        payload: {},
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    await expect(
      authorizeAdapterConsumption({
        allowedFhirRepresentationContractRefs: [requestContract.fhirRepresentationContractId],
        allowedFhirExchangeBundleTypes: [result.exchangeBundle!.bundleType],
        representationContract: requestContract,
        exchangeBundle: result.exchangeBundle!.toSnapshot(),
      }),
    ).resolves.toBeUndefined();

    await expect(
      authorizeAdapterConsumption({
        allowedFhirRepresentationContractRefs: [],
        allowedFhirExchangeBundleTypes: [result.exchangeBundle!.bundleType],
        representationContract: requestContract,
        exchangeBundle: result.exchangeBundle!.toSnapshot(),
      }),
    ).rejects.toMatchObject({ code: "ADAPTER_CONSUMPTION_CONTRACT_NOT_ALLOWED" });

    await expect(
      authorizeAdapterConsumption({
        allowedFhirRepresentationContractRefs: [requestContract.fhirRepresentationContractId],
        allowedFhirExchangeBundleTypes: ["transaction"],
        representationContract: requestContract,
        exchangeBundle: result.exchangeBundle!.toSnapshot(),
      }),
    ).rejects.toMatchObject({ code: "ADAPTER_CONSUMPTION_BUNDLE_TYPE_NOT_ALLOWED" });
  });

  it("keeps FHIR payloads representational and does not leak internal lifecycle truth into resources", async () => {
    const requestContract = getContract("FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1");
    const { compiler } = createCompilerRuntime();

    const result = await compiler.materializeRepresentationSet({
      representationContractRef: requestContract.fhirRepresentationContractId,
      generatedAt: "2026-04-12T15:40:00Z",
      aggregate: {
        governingAggregateType: requestContract.governingAggregateType,
        aggregateRef: "request_064_004",
        aggregateVersionRef: "request_064_004_v1",
        lineageRef: "lineage_064_004",
        aggregateState: "submitted",
        subjectRef: "patient_064_004",
        evidenceSnapshotRef: "snapshot_064_004",
        payload: {
          messageText: "Callback proof ready.",
          requestLifecycleLeaseRef: "lease_should_not_escape",
          closureTruthOwner: "Request",
          capacityReservationRef: "capacity_should_not_escape",
        },
        availableEvidenceRefs: requestContract.requiredEvidenceRefs,
      },
    });

    const serializedPayloads = result.resourceRecords.map((record) =>
      JSON.stringify(record.toSnapshot().payload),
    );

    expect(serializedPayloads.join(" ")).not.toContain("requestLifecycleLeaseRef");
    expect(serializedPayloads.join(" ")).not.toContain("closureTruthOwner");
    expect(serializedPayloads.join(" ")).not.toContain("capacityReservationRef");
    expect(
      result.resourceRecords.every((record) =>
        JSON.stringify(record.toSnapshot().payload).includes("representation-contract-ref"),
      ),
    ).toBe(true);
  });
});
