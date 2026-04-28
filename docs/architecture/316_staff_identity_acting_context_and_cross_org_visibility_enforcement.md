# 316 Staff Identity, Acting Context, and Cross-Organisation Visibility Enforcement

`par_316` implements the executable Phase 5 authority kernel for cross-practice hub work. The runtime lives in [phase5-acting-context-visibility-kernel.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts) and composes the 315 hub case kernel instead of duplicating ownership-fence logic.

## Durable objects

- `StaffIdentityContext` is the CIS2-backed durable staff shell. It freezes `authProvider = cis2`, stores the active organisation separately from role claims, and fails closed through `authenticated`, `reauth_required`, and `revoked`.
- `ActingContext` is the current writable command envelope. It binds organisation, tenant scope, purpose of use, audience tier, visibility coverage, minimum-necessary contract, elevation state, break-glass state, and `scopeTupleHash`.
- `ActingScopeTuple` is the explicit issuance/supersession history that captures environment, policy plane, tenant scope, audience, purpose, and break-glass/elevation expiry. Every reissue supersedes the prior tuple and advances `switchGeneration`.
- `CrossOrganisationVisibilityEnvelope` is the server-materialized minimum-necessary projection contract for `origin_practice_visibility`, `hub_desk_visibility`, and `servicing_site_visibility`.

## Enforcement model

Every hub mutation must bind:

- the current durable `StaffIdentityContext`
- the current `ActingContext`
- the current `ActingScopeTuple.tupleHash`
- the current purpose of use
- the current audience tier and minimum-necessary contract
- the current `CrossOrganisationVisibilityEnvelope` when the active organisation differs from the origin practice
- the current ownership epoch and fence token from `HubCoordinationCase`

The 316 gate runs before any 315 ownership-sensitive mutation. Allowed and denied decisions both append `AuthorityEvidenceRecord`.

## Drift model

The kernel detects and freezes writable posture for all required Phase 5 drift classes:

- `organisation_switch`
- `tenant_scope_change`
- `environment_change`
- `policy_plane_change`
- `purpose_of_use_change`
- `elevation_expiry`
- `break_glass_revocation`
- `visibility_contract_drift`

`organisation_switch`, `tenant_scope_change`, `environment_change`, `policy_plane_change`, `purpose_of_use_change`, and `visibility_contract_drift` demote the context to `stale`. `break_glass_revocation` blocks the context immediately. When drift is detected, current visibility envelopes are also marked stale or blocked so wide payloads cannot continue rendering under a stale shell.

## Break-glass and elevation

- Break-glass activation requires a known reason code.
- Current reason codes require free-text justification.
- Activation binds the resulting promotion to the current scope tuple and expiry.
- Revocation immediately drives `breakGlassState = revoked`, `elevationState = revoked`, and `contextState = blocked`.
- Each activation, use, and revocation appends a `BreakGlassAuditRecord`.

## Minimum necessary

The tier contracts are frozen from 311 and enforced in the kernel, not in controllers:

- `origin_practice_visibility` only receives macro status and continuity deltas.
- `hub_desk_visibility` receives routing, timing, access, and governed proof only.
- `servicing_site_visibility` receives encounter-delivery and site-local facts only.

`applyMinimumNecessaryProjection` and `materializeHubCaseAudienceProjection` filter fields before materialization and return only allowed fields plus the placeholder contract for withheld content.
