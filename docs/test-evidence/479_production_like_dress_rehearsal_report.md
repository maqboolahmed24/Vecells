# 479 Production-Like Dress Rehearsal Report

Generated: 2026-04-28T00:00:00.000Z

Overall state: **passed_with_channel_constraint**

| Scenario                                                  | Run state   | Launch class       | Trace count | Duplicate settlements |
| --------------------------------------------------------- | ----------- | ------------------ | ----------: | --------------------: |
| drs_479_patient_resume_projection_refresh                 | passed      | launch_pass        |           1 |                     0 |
| drs_479_patient_red_flag_audit                            | passed      | launch_pass        |           1 |                     0 |
| drs_479_patient_status_booking_messages_pharmacy          | passed      | launch_pass        |           1 |                     0 |
| drs_479_staff_queue_resort_in_flight                      | passed      | launch_pass        |           1 |                     0 |
| drs_479_staff_triage_callback_booking_support             | passed      | launch_pass        |           1 |                     0 |
| drs_479_hub_pharmacy_provider_unavailable_manual_fallback | passed      | launch_pass        |           1 |                     0 |
| drs_479_assistive_trust_downgrade_controls_suppressed     | passed      | launch_pass        |           1 |                     0 |
| drs_479_nhs_app_deferred_core_web_passes                  | constrained | constrained_launch |           1 |                     0 |
| drs_479_network_reconnect_no_duplicate_settlement         | passed      | launch_pass        |           1 |                     0 |

## Evidence

- Fixture manifest: `tests/fixtures/479_production_like_seed.json`
- Report JSON: `data/evidence/479_dress_rehearsal_report.json`
- Trace manifest: `data/evidence/479_dress_rehearsal_trace_manifest.json`
- Playwright output root: `output/playwright/479-dress-rehearsal`

## Constraint

NHS App remains a deferred channel. Core web, staff, booking, hub, pharmacy, assistive observe-only, and dependency-readiness surfaces provide the launch-critical proof for Wave 1.
