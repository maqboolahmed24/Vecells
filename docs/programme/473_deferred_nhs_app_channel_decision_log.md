# Deferred NHS App Channel Decision Log

Decision timestamp: `2026-04-28T00:00:00.000Z`
Reconciliation hash: `4f75102704645e9f6cae225127992bbbe51ec8ca85e3ca8221b6b5eb826deff0`

## Decision

Preserve Phase 7 as explicit deferred scope until the future channel enablement authority is published and exact. Local Phase 7 repository evidence is retained as proof input, but it is not treated as NHS App live activation.

## Required Future Inputs

- `seq_476` / `data/release/476_release_wave_manifest.json`: `not_yet_available`
- `seq_477` / `data/signoff/477_security_clinical_safety_privacy_regulatory_signoffs.json`: `not_yet_available`
- `seq_481` / `data/evidence/481_disaster_recovery_go_live_smoke_results.json`: `not_yet_available`
- `seq_482` / `data/release/482_wave1_promotion_settlement.json`: `not_yet_available`
- `seq_483` / `data/release/483_release_watch_tuple_wave1_observation.json`: `not_yet_available`
- `seq_486` / `data/channel/486_nhs_app_channel_enablement_manifest.json`: `not_yet_available`

## Current Blockers

- `future_channel_enablement_authority_not_yet_available` owned by release-governance
- `channel_exposure_flag_must_stay_off` owned by release-operations
- `external_nhs_app_approval_not_claimed_by_local_exit_gate` owned by programme-governance
