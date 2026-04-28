# NHS App Limited Release Decision

Generated: 2026-04-28T00:00:00.000Z

The deferred NHS App channel is enabled only for the approved manifest version and limited-release synthetic cohort represented by manifest_activation_plan_486_approved_embedded. The active settlement is applied; any other scenario in this pack fails closed to deferred or hidden exposure.

## Scope

- Tenant: tenant-demo-gp:programme-core-release
- Cohort: wtc_476_nhs_app_limited_release
- Wave: wave_476_channel_nhs_app_limited_release
- Manifest: nhsapp-manifest-v0.1.0-freeze-374
- Watch tuple: 9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779

## Guardrails

- approved_embedded: applied; exposure=enabled; blockers=0
- deferred_scope: deferred_hidden; exposure=deferred_hidden; blockers=1
- blocked_tuple_mismatch: blocked_tuple; exposure=blocked_hidden; blockers=1
- unsupported_bridge: applied_with_fallback; exposure=enabled; blockers=0
- aos_approved_live_profile_missing: blocked_environment; exposure=blocked_hidden; blockers=1
- route_coverage_missing_pharmacy_status: blocked_coverage; exposure=blocked_hidden; blockers=3
- unsupported_download_no_fallback: blocked_fallback; exposure=blocked_hidden; blockers=1
- chrome_hiding_not_enforced: blocked_chrome; exposure=blocked_hidden; blockers=1
- monthly_data_missing_active_release: blocked_obligation; exposure=blocked_hidden; blockers=1
- journey_text_changed_without_notice: blocked_change_control; exposure=blocked_hidden; blockers=1
- safe_return_broken: blocked_safe_return; exposure=blocked_hidden; blockers=1
