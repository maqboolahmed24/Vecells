# Task 476 Tenant Cohort Rollout Plan

Release candidate: `RC_LOCAL_V1`
Runtime bundle: `rpb::local::authoritative`
Manifest hash: `79ea284d24bb0a1a8e77680c98baadd55e1db7f56a69b9b1720e9c313f111f06`

## Wave Ladder

- Wave 1: Wave 1 core web canary; state approved; verdict eligible_with_constraints; cohort wtc_476_wave1_core_web_smallest_safe; blockers 7.
- Wave 2: Wave 2 staff and pharmacy after projection convergence; state draft; verdict eligible_with_constraints; cohort wtc_476_wave2_staff_pharmacy_after_projection; blockers 9.
- Remaining tenants: Remaining tenant cohorts; state draft; verdict observe_only; cohort wtc_476_remaining_tenant_cohorts; blockers 8.
- Channel wave: NHS App limited channel wave; state draft; verdict blocked; cohort wtc_476_nhs_app_limited_release; blockers 9.
- Assistive cohort: Assistive narrow staff cohort; state draft; verdict observe_only; cohort wtc_476_assistive_supervised_staff_cohort; blockers 9.

## Cohort Controls

- wtc_476_wave1_core_web_smallest_safe: tenant == tenant-demo-gp AND registered_patients.synthetic == true AND staff.role IN (clinician, care_navigator, support_analyst) AND cohort.wave == 1; selector digest d86957a687913693ce3926c1f1068832add6f4f3f80ad476e16585b90382e884.
- wtc_476_wave2_staff_pharmacy_after_projection: tenant == tenant-demo-gp AND wave1.settled == true AND pharmacy_projection.state == exact; selector digest 5e4ba08f7feda63d180db787aac606754d36bcad014bb568a0d736d12a849277.
- wtc_476_remaining_tenant_cohorts: tenant.group == remaining-programme-tenants AND previous_waves.completed == true; selector digest 23ea84b6a91f2893a4c8181f8be4508e1b86c958dce9bfe8e3b563129c1f0ab0.
- wtc_476_nhs_app_limited_release: tenant == tenant-demo-gp AND nhs_app_limited_release_approval == true AND sample_users <= agreed_plan; selector digest e04257e06e314b1cab3efda882a4d66bd99ecc85006d1c75fecab9ee8df05291.
- wtc_476_assistive_supervised_staff_cohort: tenant == tenant-demo-gp AND staff.role IN (clinical_safety_officer, clinician_superuser) AND assistive.mode == visible_summary; selector digest f411c8e9978a3d181d6ee49e63ccefa8428ec97a6ee54ffde7984e7d991eb452.

## Channel And Assistive Controls

- Wave 1 allows core web/staff/hub only and explicitly excludes NHS App, pharmacy dispatch, and assistive visible mode.
- NHS App exposure remains zero until Phase 7 channel release authority, SCAL/connection agreement, limited-release plan, monthly data, and route-change notice obligations are current.
- Assistive visible mode is limited to clinical safety officer and clinician superuser cohorts; all-staff and patient-facing assistive exposure are denied.
