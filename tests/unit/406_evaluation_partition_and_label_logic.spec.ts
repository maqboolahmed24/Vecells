import { describe, expect, it } from "vitest";
import {
  createAssistiveEvaluationPlane,
  type CreateCaseReplayBundleCommand,
  type EvaluationActorContext,
  type EvaluationActorRole,
} from "../../packages/domains/assistive_evaluation/src/index.ts";

const fixedClock = { now: () => "2026-04-27T09:00:00.000Z" };

function actor(actorRole: EvaluationActorRole): EvaluationActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_evaluation_runtime_test",
    routeIntentBindingRef: "route-intent:eval-workbench",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

function baseBundle(datasetPartition: CreateCaseReplayBundleCommand["datasetPartition"]): CreateCaseReplayBundleCommand {
  return {
    requestRef: "request:frozen:001",
    taskRef: "task:frozen:001",
    requestLineageRef: "lineage:request:001",
    taskLineageRef: "lineage:task:001",
    evidenceSnapshotRefs: ["evidence-snapshot:001"],
    evidenceCaptureBundleRefs: ["evidence-capture:001"],
    evidenceDerivationPackageRefs: ["evidence-derivation:001"],
    expectedOutputsRef: "expected-output:001",
    featureSnapshotRefs: ["feature-snapshot:001"],
    promptTemplateVersionRef: "prompt-template:summary:v1",
    modelRegistryEntryRef: "model-registry:shadow:v1",
    outputSchemaVersionRef: "schema:summary:v1",
    runtimeConfigHash: "sha256:runtime-config-001",
    datasetPartition,
    sensitivityTag: "nhs_internal_replay",
    surfaceRouteContractRef: "route-contract:evaluation-workbench:v1",
    surfacePublicationRef: "surface-publication:evaluation-workbench:v1",
    runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    telemetryDisclosureFenceRef: "telemetry-fence:evaluation:v1",
  };
}

describe("406 evaluation partition and label logic", () => {
  it("enforces partition-specific writer roles in code", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });

    const manifest = plane.datasetPartitions.createManifest(
      {
        partitionId: "gold",
        partitionVersion: "gold-v1",
        accessPolicyRef: "access-policy:gold:v1",
        goldSetVersionRef: "gold-set:v1",
      },
      actor("evaluation_data_steward"),
    );

    expect(manifest.partitionId).toBe("gold");
    expect(() =>
      plane.datasetPartitions.createManifest(
        {
          partitionId: "gold",
          partitionVersion: "gold-v2",
          accessPolicyRef: "access-policy:gold:v1",
          goldSetVersionRef: "gold-set:v2",
        },
        actor("shadow_dataset_capture_job"),
      ),
    ).toThrow(/cannot write gold/i);
  });

  it("keeps published gold manifests immutable", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const steward = actor("evaluation_data_steward");
    const manifest = plane.datasetPartitions.createManifest(
      {
        partitionId: "gold",
        partitionVersion: "gold-v1",
        accessPolicyRef: "access-policy:gold:v1",
        goldSetVersionRef: "gold-set:v1",
        caseReplayBundleRefs: ["replay:already-frozen"],
        labelSetRefs: ["label-set:gold:v1"],
        adjudicationSetRefs: ["adjudication-set:gold:v1"],
      },
      steward,
    );

    const published = plane.datasetPartitions.publishManifest(manifest.datasetPartitionManifestId, steward);

    expect(published.publicationState).toBe("published");
    expect(() =>
      plane.datasetPartitions.addBundleToManifest(
        {
          datasetPartitionManifestId: manifest.datasetPartitionManifestId,
          replayBundleRef: "replay:new-bundle",
        },
        steward,
      ),
    ).toThrow(/immutable/i);
  });

  it("separates raw labels from final adjudicated truth", () => {
    const plane = createAssistiveEvaluationPlane({ clock: fixedClock });
    const steward = actor("evaluation_data_steward");
    const reviewer = actor("clinical_reviewer");
    const adjudicator = actor("senior_clinician");
    const bundle = plane.replayBundles.createReplayBundle(baseBundle("gold"), steward);

    const draft = plane.labels.recordLabel(
      {
        replayBundleId: bundle.replayBundleId,
        labelType: "summary_concordance",
        labelValueRef: "label-value:summary-clean",
        labelSchemaVersionRef: "label-schema:summary:v1",
        annotatorRef: reviewer.actorRef,
        annotatorRole: reviewer.actorRole,
        labelProvenanceRef: "label-provenance:case-001",
      },
      reviewer,
    );

    expect(plane.labels.canSupportFinalTruth(draft)).toBe(false);
    const submitted = plane.labels.submitLabel(draft.labelId, reviewer);
    expect(plane.labels.canSupportFinalTruth(submitted)).toBe(false);

    const adjudication = plane.adjudications.adjudicateLabels(
      {
        replayBundleId: bundle.replayBundleId,
        candidateLabelRefs: [submitted.labelId],
        adjudicatorRef: adjudicator.actorRef,
        adjudicatorRole: adjudicator.actorRole,
        adjudicationReasonCodes: ["single_label_high_value_gold_truth"],
        finalLabelRef: submitted.labelId,
        decisionRationaleRef: "rationale:summary-clean",
      },
      adjudicator,
    );

    const finalLabel = plane.store.labels.get(submitted.labelId);
    expect(adjudication.adjudicationState).toBe("adjudicated");
    expect(finalLabel?.adjudicationState).toBe("adjudicated");
    expect(finalLabel && plane.labels.canSupportFinalTruth(finalLabel)).toBe(true);
  });
});
