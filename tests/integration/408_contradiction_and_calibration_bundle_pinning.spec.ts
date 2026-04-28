import { describe, expect, it } from "vitest";
import {
  createAssistiveDocumentationComposerPlane,
  type DocumentationActorContext,
  type DocumentationActorRole,
} from "../../packages/domains/assistive_documentation/src/index.ts";

const fixedClock = { now: () => "2026-04-27T17:00:00.000Z" };

function actor(actorRole: DocumentationActorRole): DocumentationActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_documentation_calibration_test",
    routeIntentBindingRef: "route-intent:documentation-composer",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("408 contradiction and calibration bundle pinning", () => {
  it("uses contradiction checks in unsupported assertion risk and abstains unsafe spans", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);

    const draft = plane.draftComposer.composeDraftNote(
      {
        contextSnapshotId: context.contextSnapshotId,
        draftFamily: "triage_summary",
        artifactRevisionRef: "artifact-revision:draft:contradiction",
        calibrationBundleRef: "calibration-bundle:doc:v1",
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
            calibratedSupportProbability: 0.95,
            supportProbabilitySource: "verifier_calibrated",
          },
        ],
        evidenceRows: [
          {
            outputSpanRef: "output-span:history",
            sourceEvidenceRefs: ["transcript-span:history:001"],
            supportWeight: 0.98,
            requiredWeight: 1,
            supportStrength: "strong",
          },
        ],
        contradictionFlags: [
          {
            flagRef: "contradiction:history:001",
            outputSpanRef: "output-span:history",
            reasonCode: "source_evidence_conflicts_with_generated_span",
            severity: "high",
          },
        ],
      },
      actor("documentation_composer"),
    );

    const history = plane.draftNotes.getDraftSections(draft.draftNoteId).find((section) => section.sectionType === "history");
    expect(draft.abstentionState).toBe("full");
    expect(draft.draftState).toBe("full_abstention");
    expect(history?.unsupportedAssertionRisk).toBeGreaterThan(0.35);
    expect(history?.missingInfoFlags).toContain("contradiction_flag_present");
  });

  it("requires a pinned calibration bundle and does not fall back to local thresholds", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);

    expect(() =>
      plane.draftComposer.composeDraftNote(
        {
          contextSnapshotId: context.contextSnapshotId,
          draftFamily: "triage_summary",
          artifactRevisionRef: "artifact-revision:draft:no-calibration",
          calibrationBundleRef: "calibration-bundle:missing",
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
              calibratedSupportProbability: 0.95,
              supportProbabilitySource: "verifier_calibrated",
            },
          ],
          evidenceRows: [
            {
              outputSpanRef: "output-span:history",
              sourceEvidenceRefs: ["transcript-span:history:001"],
              supportWeight: 0.98,
              requiredWeight: 1,
              supportStrength: "strong",
            },
          ],
        },
        actor("documentation_composer"),
      ),
    ).toThrow(/calibration/i);
  });

  it("pins visible confidence to the active release cohort and watch tuple", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);

    const draft = plane.draftComposer.composeDraftNote(
      {
        contextSnapshotId: context.contextSnapshotId,
        draftFamily: "triage_summary",
        artifactRevisionRef: "artifact-revision:draft:watch-mismatch",
        calibrationBundleRef: "calibration-bundle:doc:v1",
        activeReleaseCohortRef: "release-cohort:phase8:rc2",
        activeWatchTupleRef: "watch-tuple:phase8:rc1",
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
            calibratedSupportProbability: 0.94,
            supportProbabilitySource: "verifier_calibrated",
          },
          {
            outputSpanRef: "output-span:plan",
            calibratedSupportProbability: 0.93,
            supportProbabilitySource: "verifier_calibrated",
          },
        ],
        evidenceRows: [
          {
            outputSpanRef: "output-span:history",
            sourceEvidenceRefs: ["transcript-span:history:001"],
            supportWeight: 0.93,
            requiredWeight: 1,
            supportStrength: "strong",
          },
          {
            outputSpanRef: "output-span:plan",
            sourceEvidenceRefs: ["transcript-span:plan:001"],
            supportWeight: 0.92,
            requiredWeight: 1,
            supportStrength: "strong",
          },
        ],
      },
      actor("documentation_composer"),
    );

    expect(draft.visibleConfidenceAllowed).toBe(false);
    expect(draft.overallConfidenceDescriptor).toBe("suppressed");
    expect(draft.draftState).toBe("blocked");
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
      lambdaConflict: 0.4,
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
