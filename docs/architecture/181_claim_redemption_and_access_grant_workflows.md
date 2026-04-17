# Claim Redemption And Access Grant Workflows

Task: `par_181_phase2_track_identity_build_request_claim_redemption_and_access_grant_supersession_workflows`

## Purpose

`AccessGrantService` is the canonical Phase 2 boundary for redeemable grant issuance, redemption, rotation, revocation, replacement, and supersession. Controllers, BFF handlers, background workers, and secure-link surfaces must not issue or redeem grants with ad hoc secure-link logic.

Each redeemable grant has one immutable `AccessGrantScopeEnvelope`. Each terminal token use settles one durable `AccessGrantRedemptionRecord`. Each replacement, revocation, session or route drift, privilege change, draft promotion, or claim cleanup settles one `AccessGrantSupersessionRecord`.

`manual_only is not a redeemable grant`.

## Grant Families

The canonical redeemable families are:

| Grant family | Typical scope | Replay behavior |
| --- | --- | --- |
| `draft_resume_minimal` | Anonymous or signed-in draft lease resume. | Terminal redemption returns the same settled outcome on duplicate clicks. |
| `public_status_minimal` | Public-safe status shell. | Minimal shell scope only; superseded after claim. |
| `claim_step_up` | Request or draft claim handoff. | Redeems through claim workflow and never mutates ownership directly. |
| `continuation_seeded_verified` | Seeded continuation after verified contact route. | Rotating continuation grant. |
| `continuation_challenge` | Challenge-gated continuation. | Rotating continuation grant requiring challenge posture. |
| `support_recovery_minimal` | Same-lineage recovery or support repair shell. | Recovery-only, no silent privilege upgrade. |

`transaction_action_minimal` remains available to the central capability registry for future transaction actions, but it is not used for request claim promotion in this task.

## Claim Flow

`POST /v1/drafts/{publicId}/claim` runs as a single canonical workflow:

1. Resolve the existing claim settlement by idempotency key or token hash. Duplicate clicks, refreshes, repeated submissions, and cross-device replays return the already-settled outcome.
2. Require an active local session from `SessionGovernor`.
3. Require `SessionEstablishmentDecision.writableAuthorityState = claim_pending | writable`.
4. Require `CapabilityDecision.decisionState = allow`. `CapabilityDecision` remains a ceiling only.
5. Require current `RouteIntentBinding` for route family, action scope, governing object, session epoch, subject-binding version, and lineage fence.
6. Redeem the presented grant through `AccessGrantRedemptionRecord` after checking the immutable `AccessGrantScopeEnvelope` against the current route tuple.
7. If posture is insufficient, settle `step_up_required` and preserve the return path.
8. If the target is already claimed by another subject, deny and route to support or identity repair.
9. If valid, hand off to `IdentityBindingAuthority` with `claim_confirmed`.
10. Supersede stale public and claim grants with `AccessGrantSupersessionRecord`.
11. Rotate the local session through the `SessionGovernor` seam when binding, scope, or writable authority changes.
12. Settle the claim command with command-action and command-settlement refs.

The claim workflow does not write `Request.patientRef`, `Episode.patientRef`, ownership fields, or binding pointers directly. Only `IdentityBindingAuthority` can advance binding and derived patient-ref truth.

## Persistence

Migration `services/command-api/migrations/096_phase2_access_grant_supersession.sql` adds:

| Table | Purpose |
| --- | --- |
| `phase2_access_grant_scope_envelopes` | Immutable `AccessGrantScopeEnvelope` rows, scope hash, route tuple refs, lineage scope, and recovery route. |
| `phase2_access_grants` | Token-hash-only grant state, replay policy, scope envelope ref, predecessor and successor refs. |
| `phase2_access_grant_redemptions` | Exact-once terminal `AccessGrantRedemptionRecord` rows keyed by idempotency key and token hash. |
| `phase2_access_grant_supersessions` | `AccessGrantSupersessionRecord` rows for rotations, revocations, replacements, drift, claim completion, and repair. |
| `phase2_claim_redemption_settlements` | Claim workflow settlements that bind grant redemption, binding-authority settlement, session rotation, and command settlement refs. |
| `phase2_secure_link_session_projections` | Same-shell recovery projection for secure-link and continuation grants without privilege uplift. |

## Interfaces

`services/command-api/src/access-grant-supersession.ts` exports:

- `createAccessGrantSupersessionApplication()`
- `createAccessGrantService()`
- `createInMemoryAccessGrantSupersessionRepository()`
- `AccessGrantScopeEnvelopeRecord`
- `AccessGrantRedemptionRecord`
- `AccessGrantSupersessionRecord`
- `ClaimRedemptionSettlement`

The service consumes task `180` route tuple and `ScopeEnvelopeAuthorizationRecord` semantics, delegates binding writes to `IdentityBindingAuthority`, and delegates session epoch rotation to `SessionGovernor`.

## Gap Closures

| Gap | Closure |
| --- | --- |
| `PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_CANONICAL_SERVICE_V1` | All redeemable grant issue, redeem, revoke, rotate, and replace paths enter `AccessGrantService`. |
| `PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SCOPE_ENVELOPE_V1` | Every grant has an immutable `AccessGrantScopeEnvelope` and `immutableScopeHash`. |
| `PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_EXACT_ONCE_REDEMPTION_V1` | Token hash and idempotency replay return the same terminal `AccessGrantRedemptionRecord`. |
| `PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SUPERSESSION_CHAIN_V1` | Every replacement, revocation, drift, claim completion, and privilege change writes `AccessGrantSupersessionRecord`. |
| `PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_CLAIM_AUTHORITY_HANDOFF_V1` | Claim confirmation calls `IdentityBindingAuthority` with `claim_confirmed`; no direct ownership mutation. |
| `PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SESSION_ROTATION_V1` | Claim success rotates through `SessionGovernor` when scope, binding, or writable authority changes. |
