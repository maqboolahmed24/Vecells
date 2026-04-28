# Phase 7 Channel Telemetry Contracts

The channel telemetry contract set is privacy-minimized by default.

## Common Required Fields

- `environment`
- `journeyPathId`
- `manifestVersionRef`
- `releaseApprovalFreezeRef`
- `channelSessionHash`
- `occurredAt`

`channelSessionHash` is the pseudonymous join key. Raw patient identifiers, raw subject refs, NHS numbers, emails, phone numbers, JWTs, access grants, artifact byte grants, and PHI-bearing query strings are prohibited.

## Event Contracts

- `nhs_app_route_entry`
- `nhs_app_route_readiness`
- `nhs_app_sso_result`
- `nhs_app_bridge_action_result`
- `nhs_app_artifact_delivery_result`
- `nhs_app_route_exit`
- `nhs_app_demo_dataset_reset`

Each contract publishes `allowedFields`, `requiredFields`, `prohibitedFields`, `retentionClass`, and `monthlyPackFieldMap`. Validation quarantines any event that widens the payload beyond the named contract or drifts from the active release tuple.

## Monthly Pack Mapping

The `ChannelTelemetryPlan` maps event fields into aggregate monthly pack columns such as journey path, route family, cohort, platform, readiness verdict, SSO result, bridge result, artifact result, exit reason, and duration bucket. The monthly pack mapping is aggregate-only and must not include raw identifiers.
