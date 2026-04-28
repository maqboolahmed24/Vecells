# 397 Algorithm Alignment Notes

This artifact maps the limited-release operating artifacts to the phase 7 control objects before implementation and verification.

| Control object | 397 artifacts | Enforcement path |
| --- | --- | --- |
| `ChannelReleaseCohort` | `data/config/397_channel_release_cohort_manifest.example.json`, `ops/release/397_cohort_plan_template.csv` | Cohorts bind journey refs, ODS rules, patient population slices, release stage, manifest tuple, guardrail policy, and kill switch ref. No ad hoc feature flag is accepted as the release boundary. |
| `ReleaseGuardrailPolicy` | `data/config/397_release_guardrail_policy_manifest.example.json`, `ops/release/397_guardrail_threshold_matrix.csv` | Policy evaluation freezes on missing telemetry, threshold breach, degraded assurance slice, compatibility drift, or continuity degradation. Release requires an operator note and fresh green window. |
| `ChannelReleaseFreezeRecord` | `data/analysis/397_release_control_rehearsal_matrix.csv`, `tools/browser-automation/397_rehearse_guardrail_freeze_and_kill_switch.spec.ts` | Freeze records are opened under the manifest and release approval tuple and are reused until explicit operator release. Refreshing configuration does not release a freeze. |
| `RouteFreezeDisposition` | `data/config/397_route_freeze_disposition_manifest.example.json`, `ops/release/397_nhs_app_limited_release_runbook.md` | Frozen journeys map to patient-safe `read_only`, `placeholder_only`, or `redirect_to_safe_route` dispositions. Each disposition has a patient message, safe route, and support recovery ref. |
| `NHSAppPerformancePack` | `data/analysis/397_monthly_pack_field_map.csv`, `ops/release/397_monthly_performance_pack_guide.md` | Monthly packs are generated from validated aggregate event contracts and checked for raw JWTs, grant IDs, patient IDs, NHS numbers, and PHI-bearing query strings before export. |
| `JourneyChangeNotice` | `ops/release/397_change_notice_workflow.md`, `data/contracts/397_nhs_app_release_control_contract.json` | Change notices are typed as minor, significant, or new journey; tied to manifest version and affected journeys; and enforce one-month or three-month NHS App lead times. |

The implemented service layer is `services/command-api/src/phase7-nhs-app-release-control-service.ts`. It wraps the existing phase 7 live-control primitives from task 385 and exposes 397-specific manifest validation, freeze rehearsal, kill-switch rehearsal, monthly pack generation, redaction checks, and change-notice submission.
