# 139 Phase 1 Submission Schema Lock

## Schema Freeze
| Schema | Artifact | Required fields | Role |
| --- | --- | --- | --- |
| IntakeDraftView | data/contracts/139_intake_draft_view.schema.json | 16 | Pre-submit draft lineage rendered through one IntakeConvergenceContract. |
| IntakeSurfaceRuntimeBinding | data/contracts/139_intake_surface_runtime_binding.schema.json | 13 | Adapter from patient routes into published runtime, parity, freeze, and recovery truth. |
| IntakeSubmitSettlement | data/contracts/139_intake_submit_settlement.schema.json | 20 | Authoritative submit outcome chain; local browser success never substitutes for this record. |
| IntakeOutcomePresentationArtifact | data/contracts/139_intake_outcome_presentation_artifact.schema.json | 14 | Summary-first urgent guidance, receipt, and status artifact contract. |

## Locked Principles
- `SubmissionEnvelope` is the only mutable pre-submit authority. This schema set does not permit a second browser-only draft model.
- `IntakeDraftView` freezes public draft semantics for browser and embedded surfaces through one `IntakeConvergenceContract`.
- `IntakeSurfaceRuntimeBinding` freezes the route-to-runtime-to-recovery tuple so receipt and status remain fail-closed and same-shell.
- `IntakeSubmitSettlement` is the single authoritative success, urgent, stale, denied-scope, or failed-safe submit contract.
- `IntakeOutcomePresentationArtifact` is the same artifact shell for urgent guidance, receipt, and track-my-request. No fifth public schema is introduced for status.

## Draft Schema Version
- `draftSchemaVersion = INTAKE_DRAFT_VIEW_V1`
- Request types are frozen exactly as `Symptoms, Meds, Admin, Results`
- Public IDs are route-safe and separate by type: `dft_*` for drafts and `req_*` for requests.

## SubmissionEnvelope Boundary
The schema lock closes the gap where submit success could otherwise be inferred from local browser state. A patient-visible success surface may render only after:
1. the immutable submission snapshot is frozen,
2. one `SubmissionPromotionRecord` exists when promotion succeeds,
3. one authoritative `IntakeSubmitSettlement` is recorded, and
4. the route still resolves under the current `AudienceSurfaceRuntimeBinding`, `RouteFreezeDisposition`, and `ReleaseRecoveryDisposition`.

## Artifact and Navigation Law
- `ArtifactPresentationContract` is required for every post-submit or urgent artifact surface.
- `OutboundNavigationGrant` is required for any browser exit, embedded downgrade, urgent handoff, document preview, or print/download path.
- Raw object URLs and detached success pages are forbidden.
