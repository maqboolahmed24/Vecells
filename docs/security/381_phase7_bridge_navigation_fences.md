# Phase 7 Bridge Navigation Fences

Track: `par_381`

## Raw API Boundary

Only `@vecells/nhs-app-bridge-runtime` may touch the raw NHS App JS API. This prevents route-local behavior from accidentally bypassing manifest, continuity, capability, or outbound-navigation law.

## Capability Boundary

The wrapper blocks bridge-backed actions unless capability negotiation is current and verified. A raw API object, custom user agent, or query hint alone is not authority.

## Lease Boundary

Back callbacks are short-lived leases bound to route, manifest, session epoch, lineage fence, selected anchor, bridge matrix, embedded eligibility, and continuity evidence. Drift clears or stales the lease before another callback can run.

## Outbound Boundary

`openOverlay`, `openExternal`, and `goToAppPage` require `OutboundNavigationGrant`. The grant must be live, route-bound, manifest-bound, session-bound, matrix-bound, eligibility-bound, and selected-anchor-bound. Overlay and external URLs must already be scrubbed; sensitive query keys such as `token`, `code`, `assertedLoginIdentity`, `asserted_login_identity`, and `nhsNumber` are not allowed.

## Failure Posture

The wrapper returns machine-readable diagnostics such as:

- `nhs_app_js_api_unavailable`
- `required_bridge_method_missing`
- `capability_stale`
- `eligibility_recovery_required`
- `destination_not_scrubbed`
- `destination_not_allowlisted`
- `outbound_navigation_session_epoch_mismatch`

These diagnostics should render as same-shell recovery or hidden capability posture, not generic failure pages.
