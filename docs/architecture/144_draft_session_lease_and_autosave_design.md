# 144 Draft Session Lease And Autosave Design

`par_144` implements the `SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE` boundary on top of the canonical `SubmissionEnvelope`. Draft truth does not move into a second aggregate or shadow draft table. The mutable envelope remains the governing object, while append-only draft records and one continuity projection capture autosave, lease, merge, and recovery posture.

## Canonical objects

- `DraftSessionLease`: one foreground mutating lease is the normal writable lane; background read-only leases may exist, but they may not mutate.
- `DraftMutationRecord`: one immutable append-only record for every accepted PATCH.
- `DraftSaveSettlement`: authoritative save acknowledgement. The shell may not infer `saved` from transport timing alone.
- `DraftMergePlan`: opened for stale-version semantic conflicts instead of generic last-write-wins.
- `DraftRecoveryRecord`: opened for supersession, expiry, identity rebind, manifest drift, channel freeze, and post-promotion resume blocking.
- `DraftContinuityEvidenceProjection(controlCode = intake_resume)`: the only authority for writable resume and quiet `saved` posture.

## Runtime law

- `Mock_now_execution`: browser/self-service draft create, resume, autosave, merge, stale recovery, and post-promotion blocking run against simulator-backed storage and runtime posture tuples, but they already preserve `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, and `channelReleaseFreezeState`.
- `Actual_production_strategy_later`: authenticated uplift and embedded delivery must reuse the same `draftPublicId`, `resumeToken`, `DraftSessionLease`, `DraftRecoveryRecord`, and continuity semantics. Later providers may enrich the checks, not replace them.

## Command flow

1. `createDraft` creates one `SubmissionEnvelope(state = draft)`, issues one `draft_resume_minimal` `AccessGrant`, opens one foreground `DraftSessionLease`, and materializes `DraftContinuityEvidenceProjection`.
2. `resumeDraft` validates `resumeToken` against `AccessGrant`, `AccessGrantScopeEnvelope`, and runtime drift posture before it reuses or rotates the mutable lane.
3. `patchDraft` requires `draftVersion`, `clientCommandId`, `idempotencyKey`, `leaseId`, and `resumeToken`.
4. Accepted PATCH commands CAS-touch the same `SubmissionEnvelope`, append one `DraftMutationRecord`, append one `DraftSaveSettlement`, and refresh `DraftContinuityEvidenceProjection`.
5. Stale-version PATCH commands open `DraftMergePlan`.
6. Background or stale owners fail into `DraftRecoveryRecord` instead of mutating.
7. Governed promotion supersedes all active draft grants and leases and blocks any later mutable resume.

## Event posture

- Public canonical event names remain the frozen seq_139 set: `intake.draft.created`, `intake.draft.updated`, and `intake.resume.continuity.updated`.
- `merge_required`, `recovery_required`, and lease supersession surface as machine-readable reason codes on `DraftSaveSettlement`, `DraftRecoveryRecord`, and continuity updates instead of inventing new public event names inside the parallel block.

## Required guarantees

- No controller-side hidden mutation.
- Deterministic idempotency keyed by `(envelopeRef, idempotencyKey)` and `(envelopeRef, clientCommandId)`.
- Authoritative `saved` posture requires both `DraftSaveSettlement` and `DraftContinuityEvidenceProjection`.
- `SubmissionEnvelope` remains the only mutable pre-submit governing object.
