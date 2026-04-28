# 384 Algorithm Alignment Notes

## Environment Profiles

Each `NHSAppEnvironmentProfile` pins base URL, journey paths, release tuple, SSO config, site link config, telemetry namespace, allowed cohorts, demo dataset, and SCAL bundle refs. Validation compares the profile against the manifest service and 383 route readiness output.

`validateEnvironmentParity` compares Sandpit, AOS, and full release. It fails on tuple or journey-path drift, closing the gap where environments silently diverge under the same release label.

## Demo Dataset

`IntegrationDemoDataset` covers request, booking, waitlist, pharmacy, and status journeys using synthetic refs only. Resetting the dataset produces a new reset run while preserving a stable dataset hash. Dataset integrity fails when required journey kinds are absent or unsafe identifiers appear.

## Telemetry Contracts

`TelemetryEventContract` rejects unknown fields and explicitly prohibits raw JWTs, asserted-login query strings, grant identifiers, patient identifiers, NHS numbers, emails, phones, and PHI-bearing query strings. The event validator also compares telemetry events to the active release tuple.

## SCAL Bundle

`SCALBundle` assembly pulls from current environment profile, telemetry plan, demo dataset, route readiness refs, accessibility evidence refs, clinical safety refs, privacy refs, and incident rehearsal refs. AOS and live-like bundles are `ready_for_submission` only when the executable evidence is current.

This aligns with the Phase 7 `7H` rule: Sandpit, AOS, SCAL, telemetry, and operational delivery must be release-traceable and machine-checkable.
