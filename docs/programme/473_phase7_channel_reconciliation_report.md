# Phase 7 Channel Reconciliation Report

Readiness state: `deferred`
Manifest: `nhsapp-manifest-v0.1.0-freeze-374`
Row patch state: `deferred_preserved`
Row hash: `e829845ff76f8ec06820518a8b3982bdb6533ccdee75acb2a168c7a450d69e63`

## Decision

The Phase 7 row remains deferred for the current core-web release. This is intentional and machine-readable; the master scorecard must not imply NHS App live-channel completion.

## Route Coverage

- `status`: `exact` (jp_request_status, jp_respond_more_info)
- `start_request`: `exact` (jp_start_medical_request, jp_start_admin_request, jp_continue_draft)
- `booking`: `exact` (jp_manage_local_appointment)
- `pharmacy`: `exact` (jp_pharmacy_choice, jp_pharmacy_status)
- `secure_link_recovery`: `exact` (jp_continue_draft, jp_request_status)
- `artifact_handoff`: `exact` (jp_manage_local_appointment, jp_pharmacy_status)
- `unsupported_bridge_capability`: `exact` (browser_print, conventional_download)

## Blockers

- `future_channel_enablement_authority_not_yet_available`: Keep the 472 Phase 7 row deferred until task 486 publishes an approved manifest-version enablement authority.
- `channel_exposure_flag_must_stay_off`: Leave NHS App jump-off exposure disabled for the core release while future wave and channel authority inputs are absent.
- `external_nhs_app_approval_not_claimed_by_local_exit_gate`: Treat local Phase 7 proof as repository readiness only; do not claim NHS App live-channel completion without external activation evidence.
