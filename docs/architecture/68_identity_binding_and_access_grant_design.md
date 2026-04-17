# 68 Identity Binding And Access Grant Design

`par_068` publishes the authoritative identity-and-grant substrate for the active Phase 0 backend block. The implementation lives in `packages/domains/identity_access/src/identity-access-backbone.ts` and `services/command-api/src/identity-access.ts`.

## Authority split

- `IdentityBinding` is the only governed serializer for bound `patientRef`, `ownershipState`, and binding-version progression.
- `PatientLink` is persisted as a derived trust record over the latest settled binding version. It never establishes patient truth by itself.
- `AccessGrantScopeEnvelope` freezes route family, action scope, governing object version, release tuple, audience-surface runtime binding, and bridge floor for one redeemable grant.
- `AccessGrant` is immutable issuance truth over exactly one scope envelope, plus replay-safe lifecycle fields.
- `AccessGrantRedemptionRecord` is the authoritative exact-once result for grant presentation.
- `AccessGrantSupersessionRecord` is the only durable way to invalidate or rotate older grants.

## Frozen demonstration pack

- `4` binding versions model the chain from candidate refresh through corrected bind.
- `5` grants cover public status, claim, transaction reply, and support recovery families.
- `4` redemption rows and `3` supersession rows exercise allow, step-up, recover, and revoke outcomes.
- The atlas uses one request lineage so the binding chain, grant lattice, inspector, redemption table, and scope-rule table stay synchronized.

## Implementation surfaces

- `IdentityBindingAuthorityService.settleBinding(...)` compare-and-sets `Request.currentIdentityBindingRef`, `Episode.currentIdentityBindingRef`, derived `patientRef`, and request `identityState`.
- `AccessGrantService.issueGrant(...)` mints one immutable envelope and one grant with family-specific validator and replay policy.
- `AccessGrantService.redeemGrant(...)` returns the same authoritative result on replay for one-time and rotating grants.
- `AccessGrantService.supersedeGrants(...)` records explicit revocation or rotation and prevents stale links from remaining live by convention.
