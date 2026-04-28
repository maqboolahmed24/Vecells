import { describe, expect, it } from "vitest";
import {
  createAssistiveDocumentationComposerPlane,
  type DocumentationActorContext,
  type DocumentationActorRole,
} from "../../packages/domains/assistive_documentation/src/index.ts";

const fixedClock = { now: () => "2026-04-27T16:00:00.000Z" };

function actor(actorRole: DocumentationActorRole): DocumentationActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_documentation_context_test",
    routeIntentBindingRef: "route-intent:documentation-composer",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("408 documentation context and evidence map", () => {
  it("requires frozen context refs before drafting", () => {
    const plane = createReadyPlane();

    expect(() =>
      plane.contextSnapshots.createContextSnapshot(
        {
          requestRef: "mutable:request:001",
          taskRef: "task:001",
          reviewBundleRef: "review-bundle:001",
          transcriptRefs: ["transcript-artifact:ready:001"],
          templateRef: "template:triage:v1",
          reviewVersionRef: "review-version:001",
          decisionEpochRef: "decision-epoch:001",
          policyBundleRef: "policy-bundle:phase8:001",
          lineageFenceEpoch: "lineage-fence:001",
          surfaceRouteContractRef: "route-contract:clinical-workspace:v1",
          surfacePublicationRef: "surface-publication:clinical-workspace:v1",
          runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        },
        actor("documentation_composer"),
      ),
    ).toThrow(/frozen refs/i);
  });

  it("keeps evidence map sets immutable and bound to the same draft artifact revision", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);
    const mapSet = plane.evidenceMaps.createEvidenceMapSet(
      {
        artifactRef: "draft-note:expected",
        artifactRevisionRef: "artifact-revision:draft:001",
        contextSnapshotId: context.contextSnapshotId,
        rows: [
          {
            outputSpanRef: "output-span:history",
            sourceEvidenceRefs: ["transcript-span:history:001"],
            supportWeight: 0.9,
            requiredWeight: 1,
            supportStrength: "strong",
          },
          {
            outputSpanRef: "output-span:plan",
            sourceEvidenceRefs: ["transcript-span:plan:001"],
            supportWeight: 0.88,
            requiredWeight: 1,
            supportStrength: "strong",
          },
        ],
      },
      actor("documentation_composer"),
    );

    const draft = plane.draftComposer.composeDraftNote(
      {
        contextSnapshotId: context.contextSnapshotId,
        draftFamily: "triage_summary",
        draftNoteRef: "draft-note:expected",
        artifactRevisionRef: "artifact-revision:draft:001",
        calibrationBundleRef: "calibration-bundle:doc:v1",
        evidenceMapSetRef: mapSet.evidenceMapSetId,
        sections: [
          {
            sectionType: "history",
            outputSpanRef: "output-span:history",
            generatedTextRef: "generated-section:history",
          },
          {
            sectionType: "plan",
            outputSpanRef: "output-span:plan",
            generatedTextRef: "generated-section:plan",
          },
        ],
        verifierOutputs: [
          {
            outputSpanRef: "output-span:history",
            calibratedSupportProbability: 0.9,
            supportProbabilitySource: "verifier_calibrated",
          },
          {
            outputSpanRef: "output-span:plan",
            calibratedSupportProbability: 0.91,
            supportProbabilitySource: "verifier_calibrated",
          },
        ],
      },
      actor("documentation_composer"),
    );

    expect(mapSet.mapState).toBe("immutable");
    expect(() => {
      (mapSet as { artifactRef: string }).artifactRef = "draft-note:mutated";
    }).toThrow();
    expect(plane.draftNotes.assertDraftEvidenceMapBinding(draft.draftNoteId).artifactRef).toBe(draft.draftNoteId);
  });

  it("fails closed when a draft attempts to claim another artifact's evidence map set", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);
    const mapSet = plane.evidenceMaps.createEvidenceMapSet(
      {
        artifactRef: "draft-note:other",
        artifactRevisionRef: "artifact-revision:draft:001",
        contextSnapshotId: context.contextSnapshotId,
        rows: [
          {
            outputSpanRef: "output-span:history",
            sourceEvidenceRefs: ["transcript-span:history:001"],
            supportWeight: 0.9,
            requiredWeight: 1,
            supportStrength: "strong",
          },
        ],
      },
      actor("documentation_composer"),
    );

    expect(() =>
      plane.draftComposer.composeDraftNote(
        {
          contextSnapshotId: context.contextSnapshotId,
          draftFamily: "triage_summary",
          draftNoteRef: "draft-note:expected",
          artifactRevisionRef: "artifact-revision:draft:001",
          calibrationBundleRef: "calibration-bundle:doc:v1",
          evidenceMapSetRef: mapSet.evidenceMapSetId,
          sections: [
            {
              sectionType: "history",
              outputSpanRef: "output-span:history",
              generatedTextRef: "generated-section:history",
            },
          ],
          verifierOutputs: [
            {
              outputSpanRef: "output-span:history",
              calibratedSupportProbability: 0.9,
              supportProbabilitySource: "verifier_calibrated",
            },
          ],
        },
        actor("documentation_composer"),
      ),
    ).toThrow(/same artifact revision/i);
  });
});

function createReadyPlane() {
  const plane = createAssistiveDocumentationComposerPlane({ clock: fixedClock });
  plane.templates.registerTemplate(
    {
      draftTemplateId: "template:triage:v1",
      draftFamily: "triage_summary",
      approvedTemplateVersionRef: "template-version:triage:v1",
      approvedState: "approved",
      requiredSectionTypes: ["history", "plan"],
      calibrationProfileRef: "calibration-profile:triage:v1",
      artifactPresentationContractRef: "artifact-presentation:documentation:v1",
    },
    actor("clinical_safety_lead"),
  );
  plane.calibrations.registerCalibrationBundle(
    {
      calibrationBundleId: "calibration-bundle:doc:v1",
      calibrationProfileRef: "calibration-profile:triage:v1",
      releaseCohortRef: "release-cohort:phase8:rc1",
      watchTupleRef: "watch-tuple:phase8:rc1",
      calibrationVersion: "calibration-version:doc:v1",
      validatedWindowState: "validated",
      cDocRender: 0.7,
      thetaDocRender: 0.35,
      lambdaConflict: 0.25,
      lambdaUnsupported: 0.2,
      lambdaMissing: 0.2,
      buckets: [
        { descriptor: "strong", minScore: 0.85 },
        { descriptor: "supported", minScore: 0.7 },
        { descriptor: "guarded", minScore: 0.5 },
        { descriptor: "insufficient", minScore: 0 },
      ],
      visibleConfidenceAllowed: true,
    },
    actor("calibration_release_manager"),
  );
  return plane;
}

function createContext(plane: ReturnType<typeof createAssistiveDocumentationComposerPlane>) {
  return plane.contextSnapshots.createContextSnapshot(
    {
      requestRef: "request:001",
      taskRef: "task:001",
      reviewBundleRef: "review-bundle:001",
      transcriptRefs: ["transcript-artifact:ready:001"],
      attachmentRefs: [],
      historyRefs: ["history-snapshot:001"],
      templateRef: "template:triage:v1",
      reviewVersionRef: "review-version:001",
      decisionEpochRef: "decision-epoch:001",
      policyBundleRef: "policy-bundle:phase8:001",
      lineageFenceEpoch: "lineage-fence:001",
      surfaceRouteContractRef: "route-contract:clinical-workspace:v1",
      surfacePublicationRef: "surface-publication:clinical-workspace:v1",
      runtimePublicationBundleRef: "runtime-publication:phase8:v1",
    },
    actor("documentation_composer"),
  );
}
