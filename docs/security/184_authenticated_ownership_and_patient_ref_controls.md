# Authenticated Ownership And Patient-Ref Controls

`SignedInRequestOwnershipService` treats authenticated request ownership as a security boundary, not a convenience flag. A signed-in subject may only gain writable request authority when the current session epoch, binding version, route intent, lineage fence, and subject ref all match the durable request lineage.

## Controls

- `IdentityBindingAuthority` is the only component allowed to settle binding versions, binding state, ownership state, `Request.patientRef`, and `Episode.patientRef` derivation. The ownership service stores only authority settlement refs and derived lineage outputs.
- `SessionGovernor` remains the session authority. If pre-submit claim changes writable scope or binding posture, the session epoch must rotate before writable continuation is materialized.
- `AccessGrantService` remains the grant authority. Pre-submit claim supersedes public grants through canonical supersession records rather than leaving old writable public links alive.
- `RouteIntentBinding` remains part of the runtime authorization tuple. Drift degrades to same-shell recovery instead of optimistic allow.
- `SubmissionEnvelope`, `draftPublicId`, `continuityShellRef`, and `continuityAnchorRef` are immutable across pre-submit claim.
- Post-submit uplift maps to the existing `requestShellRef` and `episodeRef` with `clonedRequestCreated = false`.

## Threats Closed

- Second request system drift: signed-in and public request starts share `RequestLineageOwnershipRecord`; authenticated starts do not create a separate request identity model.
- Direct patientRef writes: request and episode patient refs advance only through `AuthorityPatientRefDerivationSettlement` tied to `IdentityBindingAuthority`.
- Duplicate request creation during uplift: post-submit uplift is keyed by `requestRef` and idempotency, and duplicate promotions replay the existing `AuthenticatedUpliftMappingRecord`.
- Shell discontinuity: all claim/uplift outcomes preserve the same draft or request shell, or degrade to `recovery_shell` / `claim_pending_shell`.
- Stale writable optimism: stale session epoch, stale binding version, subject switch, route tuple drift, and lineage-fence drift write `OwnershipDriftFenceRecord` and deny writable continuation.

## OWASP And NHS-Style Assurance Notes

The flow follows OWASP session and access-control guidance by binding privilege to a server-side session epoch, rotating on privilege change, and refusing stale or replayed authority tuples. It also keeps NHS login subject identity, local binding authority, and PDS demographic evidence separated: signed-in status is not sufficient to set `Request.patientRef`; only the local authority settlement can do that.

Operational logs and events must avoid raw identifiers. Ownership events contain refs, hashes, reason codes, and authority settlement ids only.
