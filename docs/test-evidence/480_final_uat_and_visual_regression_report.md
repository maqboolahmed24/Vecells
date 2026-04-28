# 480 Final UAT And Visual Regression Report

Generated: 2026-04-28T00:00:00.000Z

Overall state: **accepted_with_deferred_channel_constraint**

| Scenario                                       | Acceptance                | Artifacts | Blockers |
| ---------------------------------------------- | ------------------------- | --------: | -------: |
| uat_480_patient_desktop_request_status         | accepted                  |         4 |        0 |
| uat_480_patient_mobile_embedded_booking        | accepted                  |         3 |        0 |
| uat_480_staff_focus_live_delta                 | accepted                  |         3 |        0 |
| uat_480_operations_release_training_dependency | accepted                  |         4 |        0 |
| uat_480_governance_signoff_review              | accepted                  |         4 |        0 |
| uat_480_assistive_provenance_posture           | accepted                  |         3 |        0 |
| uat_480_nhs_app_mobile_channel                 | accepted_with_constraints |         3 |        1 |
| uat_480_visual_stable_baselines                | accepted                  |        16 |        0 |
| uat_480_accessibility_cross_shell_snapshots    | accepted                  |         6 |        0 |

## Evidence

- UAT result matrix: `data/evidence/480_uat_result_matrix.json`
- Visual manifest: `data/evidence/480_visual_regression_baseline_manifest.json`
- Accessibility manifest: `data/evidence/480_accessibility_snapshot_manifest.json`
- Visual baselines: 10
- ARIA snapshots: 17

## Constraint

NHS App remains deferred for this release scope; mobile and embedded checks prove the constrained state is visible and does not block core web Wave 1 UAT.
