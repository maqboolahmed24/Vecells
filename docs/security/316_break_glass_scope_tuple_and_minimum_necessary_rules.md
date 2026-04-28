# 316 Break-Glass, Scope Tuple, and Minimum-Necessary Rules

## Security rules

- Raw RBAC claims never authorize hub work alone.
- The mutable authority envelope is `StaffIdentityContext + ActingContext + ActingScopeTuple + MinimumNecessaryContract + CrossOrganisationVisibilityEnvelope + 315 ownership fence`.
- Organisation switching is backend truth, not a shell preference. Any mismatch freezes writable posture before mutation.
- Minimum-necessary filtering is applied at materialization time. Controllers and browsers never receive a wider cross-org payload that must be hidden later.

## Break-glass controls

- Break-glass is lawful only on routes whose command policy explicitly sets `allowsBreakGlass = true`.
- Activation requires a known reason code. The current policy requires free-text justification for every reason code shipped in 316.
- Activation binds to the current tuple hash and expiry and never becomes a permanent org-bypass flag.
- Revocation or expiry sets `breakGlassState = revoked` and blocks writable posture immediately.
- Activation, use, and revocation append durable `BreakGlassAuditRecord` rows.

## Drift responses

- `organisation_switch`, `tenant_scope_change`, `environment_change`, `policy_plane_change`, `purpose_of_use_change`, and `visibility_contract_drift` yield stale posture.
- `break_glass_revocation` yields blocked posture.
- `elevation_expiry` yields stale posture and revokes promoted write authority.
- Visibility-envelope drift also supersedes current envelopes so stale projections cannot continue materializing.

## Audit evidence

Every allowed or denied write records:

- actor identity
- active organisation
- purpose of use
- acting role
- break-glass posture
- hub case id when present
- command scope
- visibility tier
- decision and typed reason
- whether scope, visibility, lease, or ownership drift caused rejection

The durable audit tables are created in [144_phase5_staff_identity_acting_context_visibility.sql](/Users/test/Code/V/services/command-api/migrations/144_phase5_staff_identity_acting_context_visibility.sql).
