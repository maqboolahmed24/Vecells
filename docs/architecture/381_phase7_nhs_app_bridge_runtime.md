# Phase 7 NHS App Bridge Runtime

Track: `par_381`

## Purpose

`@vecells/nhs-app-bridge-runtime` is the only shared runtime abstraction allowed to touch the raw NHS App JavaScript API. Route components consume `NavigationContract`, `BridgeCapabilityMatrix`, `BridgeActionLease`, and `OutboundNavigationGrant` decisions instead of calling `window.nhsapp` directly or inferring capabilities from user-agent strings.

## Runtime Model

- `NavigationContract` declares the route family, back behavior, required bridge capabilities, external/overlay policy, calendar support, byte-download posture, route-freeze ref, manifest version, and continuity evidence ref.
- `BridgeCapabilityMatrix` is negotiated at runtime from the loaded NHS App JS API surface and current route tuple. It carries script URL, query-version hint, supported methods, platform, capability state, and diagnostics.
- `BridgeActionLease` owns native back callbacks. Leases are cleared on route exit and marked stale on manifest, route-family, session, lineage, matrix, eligibility, or continuity drift.
- `NhsAppBridgeRuntime` exposes `isEmbedded`, `setBackAction`, `clearBackAction`, `goHome`, `goToAppPage`, `openOverlay`, `openExternal`, `addToCalendar`, and `downloadBytes`.
- `renderBridgeDiagnosticsHtml` provides a browser-visible diagnostics surface used by Playwright and later embedded preview UIs.

## Capability Law

The wrapper exposes a capability only when all of these agree:

- the runtime API method exists
- the `BridgeCapabilityMatrix` is `verified`
- the current `PatientEmbeddedNavEligibility` is `live`
- the route `NavigationContract` allows the action
- the action appears in `allowedBridgeActionRefs`

`isEmbedded` remains observable even outside the NHS App, but every bridge-backed action fails closed when the runtime is unavailable, stale, mismatched, or recovery-only.

## Navigation Law

Overlay, external-browser, and app-page handoffs require an `OutboundNavigationGrant` bound to the same route family, manifest version, session epoch, lineage fence, bridge capability matrix, embedded nav eligibility, and selected anchor as the active route. URLs must already be scrubbed and host/path allowlisted.

## Browser Proof

The Playwright specs cover:

- active negotiation in an embedded context
- no capability inference in standalone browser context
- degraded or hidden capability diagnostics
- stale callback clearing after route exit or fence drift
- scrubbed outbound navigation enforcement
- ARIA snapshot and mobile visual stability for the diagnostics surface
