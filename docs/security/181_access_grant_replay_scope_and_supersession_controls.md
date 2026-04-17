# Access Grant Replay, Scope, And Supersession Controls

Task: `par_181_phase2_track_identity_build_request_claim_redemption_and_access_grant_supersession_workflows`

## Security Boundary

`AccessGrantService` is the only boundary that can create, redeem, rotate, revoke, replace, or supersede redeemable access grants. Grant possession alone is not authority. Every use must pass the immutable `AccessGrantScopeEnvelope`, current `RouteIntentBinding`, current session epoch, current subject-binding version, current lineage fence, and `CapabilityDecision` ceiling.

The implementation follows OWASP authorization guidance: deny by default, validate server-side authorization on every request, bind authorization to object and session context, and log only refs, hashes, decisions, and reason codes.

## Token And Replay Controls

Raw tokens are never persisted. The service stores `tokenHash` and returns a materialized token only at initial issuance.

Replay rules:

- Repeated issue idempotency keys do not create replacement grants.
- Repeated redemption idempotency keys return the original `AccessGrantRedemptionRecord`.
- Reused token hashes return the already-settled redemption outcome.
- Reused claim tokens return the already-settled `ClaimRedemptionSettlement`, even from another device.
- Refreshes and duplicate clicks do not call `IdentityBindingAuthority` or `SessionGovernor` a second time.

## Scope Drift Controls

`AccessGrantScopeEnvelope` is immutable and includes:

- grant family
- route family
- action scope
- governing object ref and version
- session epoch
- subject-binding version
- lineage fence
- `RouteIntentBinding`
- release and manifest posture
- channel and embedded posture
- audience and visibility scope
- lineage scope
- PHI exposure class
- recovery route

Any mismatch downgrades to same-lineage recovery or denies. Stale grants must not be reused for writable access.

## Claim Controls

The claim workflow requires:

- active `SessionGovernor` session
- `SessionEstablishmentDecision(writableAuthorityState = claim_pending | writable)`
- `CapabilityDecision(decisionState = allow)`
- current `RouteIntentBinding`
- current session epoch, subject-binding version, and lineage fence
- matching `AccessGrantScopeEnvelope`
- high-enough identity posture or completed step-up
- no conflicting existing claim by another subject

Successful claim confirmation delegates to `IdentityBindingAuthority` with `claim_confirmed`. The workflow never writes `Request.patientRef`, `Episode.patientRef`, ownership fields, or identity binding pointers directly.

If claim confirmation changes binding version, scope, or writable authority, the workflow rotates through `SessionGovernor`. There is no silent session privilege upgrade.

## Supersession Controls

`AccessGrantSupersessionRecord` is required for:

- `rotation`
- `claim_completed`
- `draft_promoted`
- `secure_link_reissue`
- `identity_repair`
- `session_drift`
- `route_drift`
- `publication_drift`
- `expiry_sweep`
- `logout`
- `manual_revoke`
- `claim_replay_consumed`
- `scope_drift`

After claim, stale `public_status_minimal`, `draft_resume_minimal`, continuation, and claim grants are superseded. Same-lineage recovery may issue a bounded `support_recovery_minimal` grant, but it cannot silently widen the session.

## Manual-Only Rule

`manual_only is not a redeemable grant`. Manual support action may approve or deny a separate authority workflow, but it cannot mint a generic grant that bypasses `AccessGrantScopeEnvelope`, `AccessGrantRedemptionRecord`, `AccessGrantSupersessionRecord`, `IdentityBindingAuthority`, or `SessionGovernor`.

## Operational Invariants

- `AccessGrantService` owns grant truth.
- `CapabilityDecisionEngine` owns route trust ceilings and scope-envelope authorization.
- `IdentityBindingAuthority` owns binding, derived patient refs, and claim confirmation.
- `SessionGovernor` owns local session epoch and writable posture.
- `RouteIntentBinding` owns route intent freshness.
- Controllers and frontend shells may render same-shell recovery, but they must not infer authority from cached grants, browser storage, URLs, or cookies.
