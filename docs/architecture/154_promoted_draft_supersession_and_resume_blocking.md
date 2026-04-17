# 154 Promoted Draft Supersession And Resume Blocking

`par_154` closes the post-submit stale-draft gap at the authority layer. Governed promotion now supersedes every active draft resume grant and every live `DraftSessionLease` in the same submit boundary, then publishes one machine-readable route-entry resolution contract for later refresh, auth-return, copied-link, stale-tab, and embedded/browser re-entry.

## Canonical objects

- `AccessGrantSupersessionRecord(causeClass = draft_promoted)`: the durable proof that the mutable draft grant family was explicitly closed.
- `DraftSessionLease(releaseReason = draft_promoted)`: the lease fence that stops cached foreground or background tabs from mutating after promotion.
- `DraftRecoveryRecord(recoveryReason = promoted_request_available)`: the same-lineage recovery tuple for stale draft entry after promotion.
- `DraftContinuityEvidenceProjection`: the route-entry authority for draft mutability, bounded recovery posture, and machine-readable reason codes.
- `SubmissionPromotionRecord`, `Request`, and `RequestLineage`: the post-promotion truth that route entry may continue to when policy allows.

## Promotion-time law

1. `submitDraft` promotes the envelope and then calls `supersedeDraftForPromotion` in the same governed path.
2. `supersedeDraftForPromotion` supersedes every still-live draft grant with `causeClass = draft_promoted`.
3. The same operation supersedes every still-live `DraftSessionLease` with `releaseReason = draft_promoted`.
4. The continuity projection is moved to `continuityState = blocked`, `quietStatusState = resume_safely`, and `sameShellRecoveryState = blocked`.
5. The recovery tuple is idempotent. Repeating the same post-promotion supersession reuses the existing `promoted_request_available` recovery instead of minting duplicate grant supersessions or duplicate recovery rows.

## Route-entry law

- If the lineage is still a mutable draft and the presented proof is valid, route entry returns `draft_mutable` with `targetIntent = resume_draft`.
- If the lineage is promoted and the presented proof still establishes lawful same-lineage continuity, route entry returns `request_redirect`.
- `request_redirect` resolves to:
  - `open_urgent_guidance` when the request is already urgent-diverted.
  - `open_request_status` when the request is already `triage_active`, `handoff_active`, `outcome_recorded`, or `closed`.
  - `open_request_receipt` for the routine receipt / early request shell.
- If the draft is promoted but the presented token or lease cannot lawfully widen to request view, route entry returns `denied_scope` with `targetIntent = blocked_policy`.
- If the draft is stale but not promotable to request truth, route entry returns `recovery_only` with `targetIntent = resume_recovery`.

## Replay and exactness

- `exact replay` remains available after promotion when the accepted submit payload is unchanged. Promotion-side route blocking may not silently downgrade that result to `semantic_replay`.
- Accepted submit replay must not downgrade from `exact_replay` to `semantic_replay` merely because promotion changed the draft continuity posture from mutable to blocked.
- The submit raw replay hash still carries continuity refs such as `latestMutationRef`, `latestSettlementRef`, and `latestMergePlanRef` so real raw evidence drift remains visible.
- The raw replay hash now excludes post-promotion `validationVerdictHash` drift, because that value reflects later route-entry posture after promotion rather than a new patient submit.

## Fail-closed guarantees

- A promoted lineage may never reopen as a mutable draft.
- Background read-only tabs cannot mutate after promotion even if they still hold a cached draft version or DOM state.
- Request existence and route truth are not widened from browser cache, URL shape, or missing proof.
- Same-lineage continuation preserves calm continuity when lawful, but denied-scope posture remains bounded and PHI-safe.
