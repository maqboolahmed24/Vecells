import { describe, expect, it } from "vitest";
import {
  createAssistiveDocumentationComposerPlane,
  type DocumentationActorContext,
  type DocumentationActorRole,
} from "../../packages/domains/assistive_documentation/src/index.ts";

const fixedClock = { now: () => "2026-04-27T15:00:00.000Z" };

function actor(actorRole: DocumentationActorRole): DocumentationActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_documentation_unit_test",
    routeIntentBindingRef: "route-intent:documentation-composer",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("408 draft section support and abstention", () => {
  it("renders only verifier-supported sections and abstains unsupported required sections", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);

    const draft = plane.draftComposer.composeDraftNote(
      {
        contextSnapshotId: context.contextSnapshotId,
        draftFamily: "triage_summary",
        artifactRevisionRef: "artifact-revision:draft:001",
        calibrationBundleRef: "calibration-bundle:doc:v1",
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
            calibratedSupportProbability: 0.92,
            supportProbabilitySource: "verifier_calibrated",
          },
          {
            outputSpanRef: "output-span:plan",
            calibratedSupportProbability: 0.55,
            supportProbabilitySource: "verifier_calibrated",
          },
        ],
        evidenceRows: [
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
            supportWeight: 0.3,
            requiredWeight: 1,
            supportStrength: "guarded",
          },
        ],
      },
      actor("documentation_composer"),
    );

    const sections = plane.draftNotes.getDraftSections(draft.draftNoteId);
    expect(draft.abstentionState).toBe("partial");
    expect(draft.draftState).toBe("partial_abstention");
    expect(draft.minimumSectionSupport).toBe(0.9);
    expect(draft.overallConfidenceDescriptor).toBe("strong");
    expect(sections.find((section) => section.sectionType === "history")?.sectionState).toBe("rendered");
    expect(sections.find((section) => section.sectionType === "plan")?.missingInfoFlags).toEqual(
      expect.arrayContaining(["evidence_coverage_below_threshold", "unsupported_assertion_risk_above_threshold"]),
    );
  });

  it("rejects decoder probabilities as support evidence", () => {
    const plane = createReadyPlane();
    const context = createContext(plane);

    expect(() =>
      plane.draftComposer.composeDraftNote(
        {
          contextSnapshotId: context.contextSnapshotId,
          draftFamily: "triage_summary",
          artifactRevisionRef: "artifact-revision:draft:decoder",
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
              calibratedSupportProbability: 0.91,
              supportProbabilitySource: "verifier_calibrated",
              decoderProbability: 0.99,
            } as never,
          ],
          evidenceRows: [
            {
              outputSpanRef: "output-span:history",
              sourceEvidenceRefs: ["transcript-span:history:001"],
              supportWeight: 0.95,
              requiredWeight: 1,
              supportStrength: "strong",
            },
          ],
        },
        actor("documentation_composer"),
      ),
    ).toThrow(/decoder probabilities/i);
  });

  it("suppresses visible confidence and blocks visible presentation for unvalidated calibration windows", () => {
    const plane = createReadyPlane("expired");
    const context = createContext(plane);

    const draft = plane.draftComposer.composeDraftNote(
      {
        contextSnapshotId: context.contextSnapshotId,
        draftFamily: "triage_summary",
        artifactRevisionRef: "artifact-revision:draft:expired-calibration",
        calibrationBundleRef: "calibration-bundle:doc:v1",
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
            supportWeight: 0.95,
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

    const presentation = plane.draftNotes.generatePresentationArtifact(
      {
        artifactRef: draft.draftNoteId,
        artifactKind: "draft_note",
        artifactPresentationContractRef: "artifact-presentation:documentation:v1",
        surfaceRouteContractRef: "route-contract:clinical-workspace:v1",
        surfacePublicationRef: "surface-publication:clinical-workspace:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        visibilityTier: "staff_internal_draft",
        summarySafetyTier: "evidence_supported_summary",
        placeholderContractRef: "placeholder:documentation:v1",
        requestedArtifactState: "inline_renderable",
      },
      actor("artifact_presentation_worker"),
    );

    expect(draft.visibleConfidenceAllowed).toBe(false);
    expect(draft.overallConfidenceDescriptor).toBe("suppressed");
    expect(draft.draftState).toBe("blocked");
    expect(presentation.artifactState).toBe("blocked");
    expect(presentation.blockingReasonCodes).toContain("validated_calibration_window_missing");
  });
});

function createReadyPlane(validatedWindowState: "validated" | "expired" = "validated") {
  const plane = createAssistiveDocumentationComposerPlane({ clock: fixedClock });
  plane.templates.registerTemplate(
    {
      draftTemplateId: "template:triage:v1",
      draftFamily: "triage_summary",
      approvedTemplateVersionRef: "template-version:triage:v1",
      approvedState: "approved",
      requiredSectionTypes: ["history", "plan"],
      optionalSectionTypes: ["safety_netting"],
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
      validatedWindowState,
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
      visibleConfidenceAllowed: validatedWindowState === "validated",
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
      attachmentRefs: ["attachment:001"],
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
