import { describe, expect, it } from "vitest";
import {
  HEALTH_RECORD_PROJECTION_ASSEMBLER_NAME,
  RECORD_ARTIFACT_PARITY_ENGINE_NAME,
  adaptPatientResultInsightProjection,
  createAuthenticatedPortalProjectionApplication,
} from "../src/authenticated-portal-projections.ts";

function baseRouteContext(overrides = {}) {
  return {
    subjectRef: "nhs_subject_213",
    audienceTier: "patient_authenticated",
    purposeOfUse: "authenticated_self_service",
    routeFamilyRef: "patient_records",
    sessionEpochRef: "session_epoch_213_v1",
    expectedSessionEpochRef: "session_epoch_213_v1",
    subjectBindingVersionRef: "binding_version_213_v1",
    expectedSubjectBindingVersionRef: "binding_version_213_v1",
    routeIntentBindingRef: "route_intent_213_v1",
    expectedRouteIntentBindingRef: "route_intent_213_v1",
    lineageFenceRef: "lineage_fence_213_v1",
    expectedLineageFenceRef: "lineage_fence_213_v1",
    trustPosture: "trusted",
    commandConsistencyState: "consistent",
    coverageRowRefs: ["coverage_row_213_records"],
    observedAt: "2026-04-16T13:00:00.000Z",
    ...overrides,
  };
}

function artifact(recordRef, overrides = {}) {
  return {
    recordArtifactRef: `artifact_${recordRef}`,
    structuredSummaryRef: `summary_${recordRef}`,
    structuredSummaryHash: `summary_hash_${recordRef}`,
    summaryDerivationPackageRef: `derivation_${recordRef}`,
    summaryRedactionTransformRef: `summary_redaction_${recordRef}`,
    sourceArtifactRef: `source_artifact_${recordRef}`,
    sourceArtifactBundleRef: `source_bundle_${recordRef}`,
    sourceArtifactHash: `source_hash_${recordRef}`,
    sourceRedactionTransformRef: `source_redaction_${recordRef}`,
    extractVersionRef: `extract_${recordRef}_v1`,
    artifactPresentationContractRef: `ArtifactPresentationContract_${recordRef}`,
    artifactSurfaceBindingRef: `ArtifactSurfaceBinding_${recordRef}`,
    artifactSurfaceContextRef: `ArtifactSurfaceContext_${recordRef}`,
    artifactSurfaceFrameRef: `ArtifactSurfaceFrame_${recordRef}`,
    artifactModeTruthProjectionRef: `ArtifactModeTruthProjection_${recordRef}`,
    currentSafeMode: "governed_preview",
    binaryArtifactDeliveryRef: `binary_delivery_${recordRef}`,
    artifactByteGrantRef: `byte_grant_${recordRef}`,
    artifactParityDigestRef: `ArtifactParityDigest_${recordRef}`,
    artifactTransferSettlementRef: `ArtifactTransferSettlement_${recordRef}`,
    artifactFallbackDispositionRef: null,
    embeddedNavigationGrantRef: `OutboundNavigationGrant_${recordRef}`,
    downloadEligibilityState: "available",
    summaryParityState: "verified",
    ...overrides,
  };
}

function followUpActions(recordRef) {
  return ["messaging", "callback", "booking", "request_detail_repair", "artifact_recovery"].map(
    (actionType) => ({
      actionType,
      actionRef: `${actionType}_${recordRef}`,
      actionLabel: `${actionType} action`,
      routeRef: `/v1/me/records/${recordRef}/${actionType}`,
      recordActionContextTokenRef: `RecordActionContextToken_${recordRef}`,
      recordOriginContinuationRef: `RecordOriginContinuationEnvelope_${recordRef}`,
      capabilityRef: `capability_${recordRef}_${actionType}`,
      capabilityLeaseExpiresAt: "2026-04-16T14:00:00.000Z",
      blockingDependencyRefs: [],
    }),
  );
}

function sourceRecord(overrides = {}) {
  const recordRef = overrides.recordRef ?? "record_213_result_a";
  return {
    recordRef,
    recordVersionRef: `${recordRef}_v2`,
    recordLineageRef: `lineage_${recordRef}`,
    patientSafeTitle: "Full blood count",
    publicSafeTitle: "Test result",
    category: "test_result",
    ownerSubjectRef: "nhs_subject_213",
    requiredSubjectBindingVersionRef: "binding_version_213_v1",
    requiredSessionEpochRef: "session_epoch_213_v1",
    routeIntentBindingRef: "route_intent_213_v1",
    lineageFenceRef: "lineage_fence_213_v1",
    recordVisibilityEnvelopeRef: `RecordVisibilityEnvelope_${recordRef}`,
    recordReleaseGateRef: `RecordReleaseGate_${recordRef}`,
    recordStepUpCheckpointRef: `RecordStepUpCheckpoint_${recordRef}`,
    releaseState: "visible",
    visibilityTier: "full",
    summarySafetyTier: "patient_safe",
    latestMeaningfulUpdateAt: "2026-04-16T12:30:00.000Z",
    selectedAnchorRef: recordRef,
    oneExpandedItemGroupRef: "record_one_expanded_group_213",
    resultId: "result_213_fbc",
    documentId: null,
    placeholderContractRef: `RecordPlaceholderProjection_${recordRef}`,
    recordOriginContinuationRef: `RecordOriginContinuationEnvelope_${recordRef}`,
    recoveryContinuationTokenRef: `RecoveryContinuationToken_${recordRef}`,
    experienceContinuityEvidenceRef: `PatientPortalContinuityEvidenceBundle_${recordRef}`,
    artifacts: [artifact(recordRef)],
    resultInterpretation: {
      observationRef: "observation_213_fbc",
      patientSafeTitle: "Full blood count",
      whatThisTestIs: "A full blood count checks different cells in the blood.",
      latestResult: "Haemoglobin is 132 g/L.",
      whatChanged: "It is stable compared with the prior result.",
      patientNextStep: "No action is needed unless symptoms change.",
      urgentHelp: "Get urgent help for chest pain, severe breathlessness, or fainting.",
      technicalDetails: "Specimen blood, reference range 115 to 165 g/L.",
      displayValue: "132",
      displayUnit: "g/L",
      originalValue: "132",
      originalUnit: "g/L",
      referenceRangeRef: "range_hb_115_165",
      comparatorBasisRef: "same_lab_same_unit",
      trendWindowRef: "trend_90_days",
      specimenRef: "specimen_213_fbc",
      specimenDate: "2026-04-15",
      sourceOrganisationRef: "source_org_practice_213",
      abnormalityBasisRef: "abnormality_basis_normal",
      interpretationSummary: "This result is in the expected range.",
      comparisonState: "comparable",
    },
    visualization: {
      visualizationRef: "chart_213_fbc",
      summarySentenceRef: "summary_sentence_213_fbc",
      summaryText: "Haemoglobin is stable across the latest three results.",
      tableRef: "table_213_fbc",
      rowIdentityRefs: ["row_hb_2026_04", "row_hb_2026_03", "row_hb_2026_02"],
      columnSchemaRef: "columns_value_unit_date",
      sortStateRef: "sort_date_desc",
      filterContextRef: "filter_latest_90_days",
      unitLabelRefs: ["g/L"],
      selectionModelRef: "single_result_selection",
      currentSelectionRef: "row_hb_2026_04",
      selectionSummaryRef: "latest_result_selected",
      filterSummaryRef: "last_90_days",
      trustSummaryRef: "table_and_chart_aligned",
      nonColorCueRefs: ["shape_marker_current", "text_label_normal"],
      comparisonMode: "time_series",
      keyboardModelRef: "arrow_keys_move_result_selection",
      parityState: "visual_and_table",
      freshnessAccessibilityContractRef: "FreshnessAccessibilityContract_213",
    },
    followUpActions: followUpActions(recordRef),
    commandConsistencyState: "consistent",
    ...overrides,
  };
}

function recordSet() {
  return [
    sourceRecord(),
    sourceRecord({
      recordRef: "record_213_medicine",
      patientSafeTitle: "Current medicines",
      publicSafeTitle: "Medicines",
      category: "medicine_allergy",
      resultId: null,
      artifacts: [artifact("record_213_medicine")],
      resultInterpretation: null,
      visualization: null,
    }),
    sourceRecord({
      recordRef: "record_213_condition",
      patientSafeTitle: "Asthma care plan",
      publicSafeTitle: "Care plan",
      category: "condition_care_plan",
      resultId: null,
      artifacts: [artifact("record_213_condition")],
      resultInterpretation: null,
      visualization: null,
    }),
    sourceRecord({
      recordRef: "record_213_letter",
      patientSafeTitle: "Clinic letter",
      publicSafeTitle: "Document",
      category: "letter_document",
      resultId: null,
      documentId: "document_213_letter",
      artifacts: [artifact("record_213_letter")],
      resultInterpretation: null,
      visualization: null,
    }),
    sourceRecord({
      recordRef: "record_213_delayed",
      patientSafeTitle: "Delayed sensitive result",
      publicSafeTitle: "Result not available yet",
      category: "action_needed_follow_up",
      resultId: "result_213_delayed",
      releaseState: "delayed_release",
      visibilityTier: "placeholder_only",
      artifacts: [artifact("record_213_delayed", { currentSafeMode: "placeholder_only" })],
    }),
    sourceRecord({
      recordRef: "record_213_latest",
      patientSafeTitle: "Latest update",
      publicSafeTitle: "Latest update",
      category: "latest_update",
      resultId: null,
      artifacts: [artifact("record_213_latest")],
      resultInterpretation: null,
      visualization: null,
    }),
  ];
}

describe("Health record projection, artifact parity, and visualization bridge", () => {
  it("assembles summary-first record groups without omitting gated placeholders", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientRecords({
      ...baseRouteContext(),
      sourceRecords: recordSet(),
      selectedRecordRef: "record_213_result_a",
    });

    expect(HEALTH_RECORD_PROJECTION_ASSEMBLER_NAME).toBe("HealthRecordProjectionAssembler");
    expect("PatientRecordContinuityState").toBe("PatientRecordContinuityState");
    expect("VisualizationFallbackContract").toBe("VisualizationFallbackContract");
    expect("VisualizationTableContract").toBe("VisualizationTableContract");
    expect("VisualizationParityProjection").toBe("VisualizationParityProjection");
    expect(result.surfaceContext.projectionName).toBe("PatientRecordSurfaceContext");
    expect(result.surfaceContext.overviewGroups.map((group) => group.groupRef)).toEqual([
      "latest_update",
      "test_result",
      "medicine_allergy",
      "condition_care_plan",
      "letter_document",
      "action_needed_follow_up",
    ]);
    expect(result.surfaceContext.recordRows.map((row) => row.recordRef)).toContain(
      "record_213_delayed",
    );
    expect(
      result.surfaceContext.recordRows.find((row) => row.recordRef === "record_213_delayed")
        .placeholderVisible,
    ).toBe(true);
    expect(result.surfaceContext.recordArtifactParityWitnessRefs).toHaveLength(6);
  });

  it("keeps result detail wording on PatientResultInterpretationProjection and resolves the insight alias", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result =
      await application.authenticatedPortalProjectionService.getPatientRecordResultDetail({
        ...baseRouteContext({ routeFamilyRef: "patient_record_result_detail" }),
        sourceRecords: recordSet(),
        resultId: "result_213_fbc",
      });

    expect(result.resultInterpretation.projectionName).toBe(
      "PatientResultInterpretationProjection",
    );
    expect(result.resultInterpretation.projectionAlias).toBe("PatientResultInsightProjection");
    expect(adaptPatientResultInsightProjection(result.resultInterpretation)).toBe(
      result.resultInterpretation,
    );
    expect(result.resultInterpretation.explanationOrder).toEqual([
      "what_this_test_is",
      "latest_result",
      "what_changed",
      "patient_next_step",
      "urgent_help",
      "technical_details",
    ]);
    expect(result.resultInterpretation.comparisonState).toBe("comparable");
    expect(result.resultInsight.resultInterpretationId).toBe(
      result.resultInterpretation.resultInterpretationId,
    );
  });

  it("allows summary_verified only when artifact parity, gate, visibility, and mode truth align", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientRecords({
      ...baseRouteContext(),
      sourceRecords: [
        sourceRecord(),
        sourceRecord({
          recordRef: "record_213_stale_summary",
          resultId: "result_213_stale",
          artifacts: [
            artifact("record_213_stale_summary", {
              summaryParityState: "stale",
              sourceArtifactHash: "source_hash_newer_than_summary",
            }),
          ],
          visualization: {
            ...sourceRecord().visualization,
            visualizationRef: "chart_213_degraded",
            tableRef: "table_213_degraded",
            parityState: "visual_and_table",
          },
        }),
      ],
    });

    expect(RECORD_ARTIFACT_PARITY_ENGINE_NAME).toBe("RecordArtifactParityEngine");
    const verified = result.artifactProjections.find(
      (projection) => projection.recordRef === "record_213_result_a",
    );
    const degraded = result.artifactProjections.find(
      (projection) => projection.recordRef === "record_213_stale_summary",
    );
    expect(verified.sourceAuthorityState).toBe("summary_verified");
    expect(degraded.sourceAuthorityState).not.toBe("summary_verified");
    expect(degraded.summaryParityState).toBe("stale");
    expect(
      result.visualizationParityProjections.find(
        (projection) => projection.surfaceRef === "record_213_stale_summary",
      ).parityState,
    ).toBe("table_only");
  });

  it("keeps delayed-release and step-up records visible as same-shell placeholders", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientRecords({
      ...baseRouteContext(),
      sourceRecords: [
        sourceRecord({
          recordRef: "record_213_step_up",
          resultId: "result_213_step_up",
          releaseState: "step_up_required",
          visibilityTier: "placeholder_only",
          artifacts: [artifact("record_213_step_up", { currentSafeMode: "placeholder_only" })],
        }),
        sourceRecord({
          recordRef: "record_213_delayed_release",
          resultId: "result_213_delayed_release",
          releaseState: "delayed_release",
          visibilityTier: "placeholder_only",
          artifacts: [
            artifact("record_213_delayed_release", { currentSafeMode: "placeholder_only" }),
          ],
        }),
      ],
    });

    expect(result.parityWitnesses.map((witness) => witness.recordGateState)).toEqual([
      "step_up_required",
      "delayed_release",
    ]);
    expect(result.surfaceContext.recordRows.every((row) => row.placeholderVisible)).toBe(true);
    expect(result.continuityStates.map((state) => state.continuationState)).toEqual([
      "awaiting_step_up",
      "delayed_release",
    ]);
  });

  it("publishes follow-up eligibility for messaging, callback, booking, repair, and artifact recovery", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result = await application.authenticatedPortalProjectionService.listPatientRecords({
      ...baseRouteContext(),
      sourceRecords: [sourceRecord()],
    });

    expect(result.followUpEligibilities[0].projectionName).toBe(
      "PatientRecordFollowUpEligibilityProjection",
    );
    expect(result.followUpEligibilities[0].eligibilityState).toBe("available");
    expect(result.followUpEligibilities[0].eligibilityFenceState).toBe("aligned");
    expect(result.followUpEligibilities[0].allowedActionTypes).toEqual([
      "messaging",
      "callback",
      "booking",
      "request_detail_repair",
      "artifact_recovery",
    ]);
    expect(result.followUpEligibilities[0].recordOriginContinuationRef).toBe(
      "RecordOriginContinuationEnvelope_record_213_result_a",
    );
  });

  it("serves document detail from the same artifact projection and parity witness", async () => {
    const application = createAuthenticatedPortalProjectionApplication();

    const result =
      await application.authenticatedPortalProjectionService.getPatientRecordDocumentDetail({
        ...baseRouteContext({ routeFamilyRef: "patient_record_document_detail" }),
        sourceRecords: recordSet(),
        documentId: "document_213_letter",
      });

    expect(result.recordArtifact.projectionName).toBe("PatientRecordArtifactProjection");
    expect(result.parityWitness.projectionName).toBe("RecordArtifactParityWitness");
    expect(result.recordArtifact.recordArtifactParityWitnessRef).toBe(
      result.parityWitness.recordArtifactParityWitnessRef,
    );
    expect(result.recordArtifact.recordRef).toBe("record_213_letter");
    expect(result.recordArtifact.presentationMode).toBe("governed_preview");
  });
});
