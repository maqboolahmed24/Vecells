# 389 Algorithm Alignment Notes

## Canonical Intake Binding

The embedded flow calls `resolveEmbeddedStartRequestContext`, which maps the embedded pathname to a canonical Phase 1 start-request location before resolving `resolveMissionFrameView`. This keeps `IntakeDraftView.intakeConvergenceContractRef` on `ICC_139_PHASE1_SELF_SERVICE_V1` and prevents NHS-App-only field semantics.

## Autosave Truth

`EmbeddedDraftSaveChip` reads from the same memory save presentation used by the browser mission frame. Local save movement is temporary; the authoritative saved state is represented by `saved_authoritative` and a draft save settlement reference in `draftContinuityEvidence.latestSaveSettlementRef`.

## Validation

Detail-step validation calls `moveEmbeddedDetailsForward`, which wraps the canonical `moveDetailsForward` result. Contact validation uses the canonical `primaryContactValidationMessage`. No embedded-only validation grammar is introduced.

## Submission And Receipt

The review step exposes `SubmissionEnvelope:389:<draftPublicId>`. Submitting moves to `receipt_outcome`, assigns a request public id with `requestPublicIdForDraft`, and renders `buildReceiptSurface` facts and timeline.

## Resume And Promoted Drafts

Resume fixtures expose degraded continuity evidence. Promoted fixtures force `resume_recovery`, set the submission envelope state to `promoted_recovery`, and route the primary action to receipt rather than editable review fields.
