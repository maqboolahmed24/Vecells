# Phase 7 Sandpit AOS SCAL Runbook

## Sequence

1. Validate Sandpit profile parity with `validateEnvironmentProfile({ environment: "sandpit" })`.
2. Reset the Sandpit demo dataset with `resetDemoDataset`.
3. Validate telemetry contracts using representative route-entry, SSO, bridge, artifact, and route-exit events.
4. Run the Sandpit demo checklist against the seeded synthetic request, booking, waitlist, pharmacy, and status journeys.
5. Repeat the same validation and demo steps in AOS.
6. Assemble `SCALBundle` for AOS and confirm it is `ready_for_submission`.
7. Preserve the bundle hash, route readiness refs, accessibility evidence refs, clinical safety refs, privacy refs, and incident rehearsal ref.

## Blocking Conditions

- Environment profile release tuple differs from the manifest tuple.
- Sandpit, AOS, and live profiles expose different journey paths without a superseding manifest.
- Demo dataset integrity is invalid or missing a required journey kind.
- Telemetry contract registry is missing an event contract in the active plan.
- Telemetry validation detects raw JWTs, grant identifiers, PHI-bearing query strings, or patient identifiers.
- Route readiness is not `ready` for the exposed environment journey set.

## Evidence

The runbook evidence source is the 384 service inventory, not a spreadsheet:

- `NHSAppEnvironmentProfile`
- `IntegrationDemoDataset`
- `ChannelTelemetryPlan`
- `TelemetryEventContract`
- `SCALBundle`

The local blueprint remains the source of truth where external process wording changes.
