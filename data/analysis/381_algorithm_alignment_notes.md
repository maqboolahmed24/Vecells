# Algorithm Alignment Notes For Track 381

## Local Blueprint Alignment

The implementation maps to Phase 7 section 7E:

- `NavigationContract` matches the route metadata needed by embedded runtime.
- `BridgeCapabilityMatrix` records platform, script URL, script hint, supported methods, capability state, and diagnostics.
- `BridgeActionLease` makes native back callbacks short-lived and route-scoped.
- `NhsAppBridgeRuntime` is the single wrapper over the NHS App JS API.
- `OutboundNavigationGrant` is required before app-page, overlay, or external-browser handoff.

## Laws Preserved

- Raw NHS App JS API access stays inside one wrapper.
- Capabilities come from runtime negotiation and route law, not user-agent heuristics.
- Stale leases clear on route exit, shell transition, or fence drift.
- Overlay and external-browser exits require scrubbed, allowlisted destinations.
- Version drift is visible through `capabilityState = stale | mismatched | unavailable`.
- Browser-visible diagnostics make hidden and blocked capabilities machine-readable.

## Upstream Consumption

The runtime consumes Phase 7 manifest, embedded eligibility, and external-entry truth by reference:

- `manifestVersionRef`
- `routeFamilyRef`
- `patientEmbeddedNavEligibilityRef`
- `patientEmbeddedSessionProjectionRef`
- `continuityEvidenceRef`
- `routeFreezeDispositionRef`

No duplicate deep-link, session, or artifact law is introduced.
