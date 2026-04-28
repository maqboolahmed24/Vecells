# 144 Draft Merge And Recovery Rules

This rule set closes the Phase 1 gaps around stale resume, cross-tab mutation, and false calm autosave.

## Merge rules

- Version conflict is a semantic merge problem, not a controller-local warning.
- `DraftMergePlan` must keep answer payload, step markers, attachments, and identity-context drift separate.
- The current implementation opens a merge plan whenever `PATCH.draftVersion` is behind the authoritative draft version and records the conflicting field hashes plus attachment and step context.

## Recovery rules

- `BACKGROUND_LEASE_MUTATION_FORBIDDEN`: background read-only leases may inspect, not mutate.
- `LEASE_NOT_LIVE`: stale or superseded owners may not continue mutating.
- `SESSION_EPOCH_DRIFT`, `SUBJECT_BINDING_VERSION_DRIFT`, `IDENTITY_BINDING_DRIFT`, and `IDENTITY_BINDING_REQUIRED` route to `DraftRecoveryRecord(recoveryReason = identity_rebind_required)` and block PHI-bearing writable resume until rebind succeeds.
- `RELEASE_FREEZE_DRIFT` and `CHANNEL_FREEZE_DRIFT` route to blocked same-shell recovery rather than quiet success.
- `PROMOTED_REQUEST_AVAILABLE` blocks mutable draft resume and points recovery to the mapped request shell or bounded request recovery.

## Same-shell continuity law

- Quiet `saved` may appear only while the latest `DraftSaveSettlement(ackState = saved_authoritative)` is still covered by `DraftContinuityEvidenceProjection(validationState = stable_writable)`.
- `merge_required` and `recovery_required` must preserve the same shell and anchor where possible, but they may not collapse back to quiet success.
- Local cache calmness, debounced network success, or a stored `resumeToken` alone are never sufficient evidence for authoritative saved state.

## Parallel block discipline

- `par_144` owns `DraftSessionLease`, `DraftAutosavePatchEnvelope`, and `DraftResumeTokenState`.
- It may not redefine seq_139 public event names or invent alternate save-state meanings for the frontend tracks.
- `par_148` and `par_154` consume this seam for promotion supersession and resume blocking; they do not replace its lease or recovery semantics.
