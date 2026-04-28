# Phase 7 Environment Profiles And Telemetry

Task 384 adds `Phase7NHSAppEnvironmentTelemetryAndSCALDeliveryService`, the executable source for NHS App environment profiles, demo datasets, telemetry contracts, and SCAL bundle assembly.

## Environment Profiles

`NHSAppEnvironmentProfile` pins every NHS App environment to the same patient-visible release tuple:

- `manifestVersionRef`
- `configFingerprint`
- `releaseCandidateRef`
- `releaseApprovalFreezeRef`
- `behaviorContractSetRef`
- `surfaceSchemaSetRef`
- `compatibilityEvidenceRef`
- `journeyPaths`

The default Sandpit, AOS, limited-release, and full-release profiles expose the same route set and fail parity validation if any profile drifts. `validateEnvironmentProfile` also checks the manifest service base URL, route inventory, route readiness verdicts, telemetry contracts, and demo dataset integrity.

## Demo Dataset

`IntegrationDemoDatasetStore` owns deterministic synthetic data for repeated NHS App walkthroughs. Each environment receives request, booking, waitlist, pharmacy, and status journeys without patient identifiers, NHS numbers, raw subject refs, or real contact details. Resetting a dataset increments the reset ordinal while preserving the dataset hash so demo evidence remains repeatable.

## Telemetry Plan

`ChannelTelemetryPlanBuilder` builds a route-aware plan from the current environment profile and `TelemetryEventContract` registry. Contracts define allowed fields, required fields, prohibited fields, retention class, pseudonymous join key, and monthly-pack mappings.

Telemetry validation quarantines events containing raw JWTs, grant identifiers, PHI-bearing query strings, patient identifiers, unknown fields, missing required fields, or release tuple drift.

## SCAL Bundle

`assembleSCALBundle` collects the environment profile, telemetry plan, demo dataset, route readiness refs, accessibility evidence refs, clinical safety refs, privacy refs, and incident rehearsal ref into one `SCALBundle`. The bundle is `ready_for_submission` for AOS and live-like environments only when environment parity and route readiness are current.

This closes the operational gap where SCAL evidence was assembled from scattered documents rather than executable profile, telemetry, and readiness truth.
