# 199 Signed-In Request Creation And Saved-Context Restore

Task: `par_199`
Visual mode: `SignedIn_Mission_Frame`

## Purpose

Signed-in request creation is a bridge into the canonical Phase 1 mission-frame intake, not a new authenticated form stack. The route family `/portal/start-request/*` resolves signed-in start, continue-draft, saved-context restore, post-auth return, promoted-draft mapping, and narrowed-write deferral before handing off to `/start-request/...`.

## Projection Model

`SignedInRequestEntryResolver` composes:

- `SubmissionEnvelope` with `canonical_phase1_intake`
- `DraftSessionLease`
- `DraftContinuityEvidenceProjection`
- `RouteIntentBinding`
- `RecoveryContinuationToken`
- `PatientPortalEntryProjection`
- `PatientHomeProjection`
- `PatientNavReturnContract`
- `PatientRequestReturnBundle`
- `PatientActionRecoveryProjection`
- `PatientAudienceCoverageProjection`
- `PatientIdentityHoldProjection`

`SavedContextResolver` decides whether to start the canonical intake, restore an authoritative draft, restore after post-auth return, map a promoted draft forward, or defer to the `par_197` claim/identity-hold posture family.

## Canonical Intake Law

The signed-in entry never renders a separate logged-in form model. Dominant actions route into the existing Phase 1 mission-frame shell:

- start: `/start-request/dft_auth_199/request-type`
- continue: `/start-request/dft_auth_199/details`
- restore: `/start-request/dft_auth_199/files`

The request type order, helper copy, upload semantics, autosave, review, submission, receipt, and status behavior remain owned by the canonical intake shell.

## Saved-Context Restore

Saved-context restore uses authoritative continuity evidence, not local cache alone. The visible `SavedContextCard` summarizes request type, last meaningful update, current safe destination, and selected anchor. The `DraftContinuitySummary` keeps draft id, step, selected anchor, and last-safe summary together.

Refresh and post-auth return preserve the same tuple when lawful:

- draft public id
- selected step
- selected anchor
- last-safe summary
- current safe destination

## Promoted Draft Mapping

When a draft is already promoted, `PromotedDraftMappedOutcome` maps forward to the authoritative request shell at `/portal/requests/REQ-4219`. Editing stays closed and the route does not reopen a mutable draft.

## Narrowed Write Posture

When a grant or claim posture narrows write authority, `NarrowedWritePostureEntry` defers to the `par_197` same-shell claim/identity-hold posture instead of silently re-enabling edit state.

## Account Disclosure

`AuthenticatedAccountDisclosure` is secondary and collapsible. It explains that the patient is signed in without letting account context dominate the request task.

## Interface Note

Task `par_201` will deepen cross-channel receipt/status parity. This task publishes the signed-in return bundle and promoted-draft target so that receipt/status parity can consume the same lineage later without creating a duplicate mapping.
