# 213 Health Record Visibility, Release, And Parity Controls

Task: `par_213_crosscutting_track_backend_build_health_record_projection_and_record_artifact_parity_witness`

Health record surfaces are source-authoritative and summary-first. They must never use controller-local trimming, browser byte availability, chart rendering, or cached summaries as authority.

## Security Controls

- `RecordVisibilityEnvelope`, `RecordReleaseGate`, and `RecordStepUpCheckpoint` are checked before a summary, preview, download, print, browser handoff, chart, table, or follow-up action is marked live.
- `RecordArtifactParityWitness.recordGateState != visible` forces same-shell placeholder or recovery posture.
- `PatientRecordArtifactProjection.sourceAuthorityState = summary_verified` is only allowed when the current summary, source artifact, digest, gate, visibility, step-up, and artifact-mode truth agree.
- Delayed-release, step-up-required, restricted, and identity-held records remain visible as governed placeholders with no body preview leakage.
- `PatientResultInterpretationProjection` owns patient-facing result explanation. `PatientResultInsightProjection` is an alias, not a competing model.
- `VisualizationParityProjection.parityState != visual_and_table` makes table, summary, or placeholder the authority; charts cannot keep extra meaning.
- `PatientRecordFollowUpEligibilityProjection` freezes messaging, callback, booking, request-detail repair, and artifact recovery when action context, continuation, release, visibility, or capability lease drifts.

## Forbidden Truth Sources

- chart pixel output as meaning authority
- browser download completion as artifact truth
- stale structured summary as source truth
- frontend-local omission of gated records
- `PatientResultInsightProjection` as a separate explanation source
- local CTA enablement without `PatientRecordFollowUpEligibilityProjection`
- route-only step-up success without the matching record version, session epoch, and subject binding

## Release And Placeholder Discipline

Gated records use explicit reason states:

- delayed release: show that the record exists, why detail is unavailable, and when or how access may become available
- step-up required: show the record anchor and step-up route without revealing hidden fields
- restricted or identity-held: show a public-safe placeholder and recovery guidance
- parity degraded: keep the last safe summary or source-only posture, and label any download as the source artifact

The atlas uses accessible headings, tables, description lists, keyboard tabs, disclosures, reduced-motion CSS, and narrow-width checks. This follows NHS service manual accessibility guidance, WCAG keyboard and non-color rules, GOV.UK structured review row conventions, and Playwright ARIA snapshot verification.
