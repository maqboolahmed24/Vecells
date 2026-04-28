# Phase 9 Live Event Stream Integration Spec

## Contract Boundary

The browser consumes `LivePhase9ProjectionGatewayProjection`, not raw patient, audit, incident, or domain events. Each route selects one `Phase9LiveProjectionChannelContract` by tenant, environment, route family, route, scope tuple, runtime bundle, projection contract version, and surface binding.

Every channel fails closed when the projection version or runtime binding is missing. The UI can become stale, quarantined, blocked, diagnostic-only, reconnecting, or recovery-only, but it cannot become more writable than the current settlement and graph authority permit.

## Visible Surfaces

- `/ops/overview`: operations overview
- `/ops/assurance`: assurance center
- `/ops/audit`: audit explorer
- `/ops/resilience`: resilience board
- `/ops/incidents`: incident desk
- `/ops/governance/records`: records governance
- `/ops/governance/tenants`: tenant governance
- `/ops/access/roles`: access studio
- `/ops/governance/compliance`: compliance ledger
- `/ops/conformance`: conformance scorecard

## Browser Adapter Rules

- Render the live gateway strip before the main route body in both ops and governance shells.
- Bind root `data-phase9-live-*` attributes for automation and safety checks.
- Render row-level patch state with selected-anchor preservation data.
- Use `aria-live="polite"` only for the bounded gateway status, never for high-frequency table churn.
- Keep last stable snapshot and return-token copy visible under stale, drift, or recovery-only states.
- Never display `rawDomainEventRef`, raw payloads, PHI, incident notes, audit details, or webhook URLs.

## State Handling

- `projection_version_mismatch`: block before subscription and preserve last stable projection.
- `missing_runtime_binding`: block before subscription and show binding recovery copy.
- `stale_projection`: stale-review frame with no live action claim.
- `quarantined_incident_producer`: downgrade incident-dependent slices only.
- `action_settlement_failed`: replace pending local action with authoritative failed settlement.
- `delta_gate_open`: buffer patch, preserve selected row, and keep focus protection active.
- `graph_drift`: block assurance export and conformance signoff.
- `return_token_drift`: restore the nearest valid context in read-only recovery.
- `telemetry_fence_violation`: block update and keep disclosure fence state visible.
- `reconnecting`: keep last stable snapshot while channel reconnects.

## Test Evidence

The task suite covers contract validation, fail-closed mismatch states, stale/quarantine isolation, settlement replacement, graph drift, return-token drift, telemetry fence redaction, subscription cleanup, and browser screenshots across ops and governance shells.
