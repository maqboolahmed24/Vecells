# 213 Health Record Projection And Parity Design

Task: `par_213_crosscutting_track_backend_build_health_record_projection_and_record_artifact_parity_witness`

This slice makes the patient records backend a projection family rather than a broad record payload with local component trimming. The central assembler is `HealthRecordProjectionAssembler`, backed by `RecordArtifactParityEngine`.

## Projection Family

The API surfaces are:

- `GET /v1/me/records`
- `GET /v1/me/records/results/{resultId}`
- `GET /v1/me/records/documents/{documentId}`

The service route ids are `patient_portal_records_index`, `patient_portal_record_result_detail`, and `patient_portal_record_document_detail`.

The route catalog binds those surfaces to:

- `PatientRecordSurfaceContext`
- `PatientResultInterpretationProjection`
- `PatientResultInsightProjection`
- `PatientRecordArtifactProjection`
- `RecordArtifactParityWitness`
- `PatientRecordFollowUpEligibilityProjection`
- `PatientRecordContinuityState`
- `VisualizationFallbackContract`
- `VisualizationTableContract`
- `VisualizationParityProjection`

`PatientResultInterpretationProjection` is the only patient-facing explanation authority for result wording. `PatientResultInsightProjection` is retained as an alias only, resolved by `adaptPatientResultInsightProjection`, so older frontend vocabulary cannot become a second interpretation source.

## Assembly Rules

`PatientRecordSurfaceContext` groups the overview in this order: latest updates, test results, medicines and allergies, conditions and care plans, letters and documents, and action-needed follow-up. The context carries selected anchor, one-expanded group, record origin continuation, parity witness refs, artifact refs, continuity refs, and visualization parity refs.

Result detail is always ordered as:

1. what this test is
2. latest result
3. what changed
4. what the patient may need next
5. urgent help
6. technical details

`PatientRecordArtifactProjection` binds source artifact, structured summary, redaction transform, artifact mode truth, delivery grant, transfer settlement, fallback disposition, visibility envelope, release gate, step-up checkpoint, and the current `RecordArtifactParityWitness`.

## Parity Rules

`PatientRecordArtifactProjection.sourceAuthorityState = summary_verified` is legal only when all of these agree:

- `summaryParityState = verified`
- `RecordArtifactParityWitness.sourceAuthorityState = summary_verified`
- `RecordArtifactParityWitness.recordGateState = visible`
- the artifact digest points at the same source and summary refs
- the record visibility envelope, release gate, and step-up checkpoint match the record version
- `ArtifactModeTruthProjection.currentSafeMode` still permits the visible presentation

If any item drifts, `RecordArtifactParityEngine` demotes the record to `summary_provisional`, `source_only`, `placeholder_only`, or `recovery_only`. The source artifact remains authoritative; a verified summary is only a faithful derivative for the current tuple.

## Visualization Bridge

Charts are optional and subordinate. Every chart-backed record view must bind `VisualizationFallbackContract`, `VisualizationTableContract`, and `VisualizationParityProjection`. If chart, table, summary, selection, unit, release, freshness, or witness parity drifts, `VisualizationParityProjection.parityState` demotes to `table_only`, `summary_only`, or `placeholder_only`, and the table, summary, or placeholder becomes the authoritative meaning surface.

The atlas and Playwright proof follow current public guidance:

- GOV.UK Design System check-answers pattern for structured review rows: https://design-system.service.gov.uk/patterns/check-answers/
- NHS service manual accessibility guidance: https://service-manual.nhs.uk/accessibility
- Playwright ARIA snapshot guidance: https://playwright.dev/docs/aria-snapshots
- WCAG 2.2 keyboard and non-color requirements: https://www.w3.org/WAI/WCAG22/quickref/

## Continuity And Follow-Up

`PatientRecordFollowUpEligibilityProjection` covers messaging, callback, booking, request-detail repair, and artifact recovery. A record-origin action is live only when eligibility is available, the fence is aligned, the action context token and continuation envelope are current, and release and visibility posture still permit the action.

`PatientRecordContinuityState` preserves selected anchor and one-expanded group for visible, delayed-release, step-up, identity-hold, and recovery states. Gated records remain visible placeholders rather than disappearing from overview, detail, or document surfaces.
