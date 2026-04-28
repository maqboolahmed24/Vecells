# 387 Algorithm Alignment Notes

## Phase 7 Shell Split

`resolveEmbeddedShellContext` implements the 7B resolution order: signed context first, NHS App user-agent second, query hints third, and standalone fallback last. Query hints never become `trusted_embedded`; they render `revalidate_only` with frozen actions.

`ShellPolicy`, `EmbeddedShellConsistencyProjection`, and `PatientEmbeddedNavEligibility` are materialized in `embedded-shell-split.model.ts` so shell rendering is derived from channel context rather than ad hoc props.

## Platform Frontend Blueprint

The continuity envelope maps to `RecoveryContinuationToken` and narrow-screen continuity guidance:

- same `patientShellContinuityKey`
- same `entityContinuityKey`
- same `selectedAnchorRef`
- same `returnContractRef`
- same shell recovery posture after refresh, deep link, browser back or forward, and handoff return

Embedded layout uses `embedded_strip`, `44rem` readable measure, `16px` horizontal padding, and a `76px` sticky action reserve.

## Patient Account Blueprint

The component preserves patient shell continuity by keeping all route families inside `EmbeddedRouteContextBoundary`. The same route content renders under `StandaloneShell` and `EmbeddedShell`.

## Canonical UI Contract Kernel

The route boundary emits all required shell DOM markers, including shell type, channel profile, route family, writable state, dominant action, anchor state, continuity key, and return anchor.

## Upstream Outputs

- `378`: context resolution is represented by trust tiers and signed context handling.
- `381`: bridge runtime constraints appear through `BridgeCapabilityMatrix:381-sandpit-verification-current`.
- `383`: route readiness is represented by the five NHS App entry route nodes.
- `385`: route freeze drives `route_freeze` recovery with frozen mutation controls.
