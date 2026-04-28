# Phase 7 Navigation Contract And Bridge Usage

Track: `par_381`

## Import Surface

Frontend code should import from `@vecells/nhs-app-bridge-runtime`.

Use `buildNavigationContract` and `createLiveEligibility` only at adapter boundaries, previews, tests, or backend-fed hydration seams. Route components should receive an already materialized `NavigationContract`, `BridgeCapabilityMatrix`, and `PatientEmbeddedNavEligibilitySnapshot`.

## Allowed Pattern

1. Load the NHS App JS API inline with a script URL like `https://www.nhsapp.service.nhs.uk/js/v2/nhsapp.js?v=2025-10-21`.
2. Pass the exposed API object into `createNhsAppBridgeRuntime`.
3. Read `bridge.snapshot()` to render diagnostics and enable or disable bridge-backed actions.
4. Use wrapper methods for all app-page, overlay, external-browser, calendar, byte-download, and native-back behavior.
5. Clear leases on route exit, shell transition, and route-context refresh.

## Disallowed Pattern

Do not call:

- `window.nhsapp.navigation.*`
- `window.nhsapp.storage.*`
- `nhsapp.navigation.*`
- user-agent checks as capability proof

User-agent and `from=nhsApp` hints may influence styling or diagnostics only. They must not unlock actions.

## Diagnostics

Render `renderBridgeDiagnosticsHtml(snapshot)` in local preview or internal readiness mode when proving embedded behavior. Production UI may map the same snapshot into its own components, but it must preserve state, visible capabilities, hidden capabilities, and active lease count.

## Lease Handling

Native back must always be installed through `setBackAction`. On route exit call `clearForRouteExit`. On manifest, session, lineage, route family, capability matrix, eligibility, or continuity drift call `clearForFenceDrift`.
